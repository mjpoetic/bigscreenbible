import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const listeners = {};
const storage = new Map();
let syncs = 0;
const surface = { dataset: {}, matches: () => true, contains: target => target === surface, addEventListener: (name, fn) => { listeners[name] = fn; } };
const context = { state: { popupTextScale: 1, popupPinchEnabled: true, textScale: 1 }, document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null }, localStorage: { setItem: (key, value) => storage.set(key, value) }, scheduleCloudSync: () => syncs++, touchDistance: (a, b) => Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY), Date };
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('// Shared by study dialogs'), source.indexOf('const defaultInterfaceTextSize')), context);
const event = distance => ({ touches: [{clientX:0,clientY:0,target:surface},{clientX:distance,clientY:0,target:surface}], cancelable:true, prevented:false, stopped:false, preventDefault(){this.prevented=true}, stopPropagation(){this.stopped=true}, stopImmediatePropagation(){this.stopped=true} });
context.bindPopupTextGestures(surface);
listeners.touchstart(event(100));
const jitter = event(103); listeners.touchmove(jitter); assert.equal(context.state.popupTextScale,1); assert.equal(jitter.prevented,false);
const pinch = event(150); listeners.touchmove(pinch); assert.equal(context.state.popupTextScale,1.5); assert.equal(pinch.prevented,true); assert.equal(pinch.stopped,true); assert.equal(syncs,0);
listeners.touchend(event(0)); assert.equal(storage.get('lw_popup_text_scale'),'1.5'); assert.equal(syncs,1); assert.equal(context.state.textScale,1);
const click=event(0); listeners.click(click); assert.equal(click.prevented,true);
listeners.touchstart(event(100)); listeners.touchmove(event(400)); assert.equal(context.state.popupTextScale,2); listeners.touchcancel(event(0)); assert.equal(storage.get('lw_popup_text_scale'),'2');
listeners.touchstart(event(100)); listeners.touchmove(event(10)); assert.equal(context.state.popupTextScale,0.8); listeners.touchend(event(0));
context.state.popupPinchEnabled=false; listeners.touchstart(event(100)); listeners.touchmove(event(200)); assert.equal(context.state.popupTextScale,0.8);
context.setPopupTextScale(1); assert.equal(storage.get('lw_popup_text_scale'),'1');
context.setPopupTextScale(NaN); assert.equal(context.state.popupTextScale,1);
assert.match(source,/popupTextScale: state.popupTextScale/); assert.match(source,/popupPinchEnabled: state.popupPinchEnabled/);
// Long previews must remain inside portrait and short landscape viewports.
const positioning = source.slice(source.indexOf('function positionStudyPopup('), source.indexOf('function closeStudyPopupOnOutside('));
context.window = {innerWidth:390,innerHeight:844};
vm.runInContext(positioning,context);
const popup = { classList:{contains:()=>true}, style:{setProperty(){},removeProperty(){}}, dataset:{}, getBoundingClientRect:()=>({width:366,height:444}), querySelector:()=>null };
const anchor = {isConnected:true,getBoundingClientRect:()=>({left:74,top:450,bottom:482,width:100})};
context.positionStudyPopup(anchor,popup);
assert.ok(parseFloat(popup.style.top)+444<=832);
context.window.innerHeight=390;
popup.getBoundingClientRect=()=>({width:366,height:366});
context.positionStudyPopup(anchor,popup);
assert.equal(parseFloat(popup.style.top),12);

// Opening Strong's must wire gestures without a render or Scripture preview.
const strongListeners = {};
let listenerCount = 0;
const strongPopup = {
  dataset: {}, matches: () => true, contains: target => target === strongPopup,
  setAttribute() {}, querySelector: () => null, querySelectorAll: () => [],
  addEventListener(name, fn) { strongListeners[name] = fn; listenerCount++; },
};
Object.assign(context, {
  normalizeStrongCodes: codes => codes, strongEntry: () => ({ code: 'G1401' }),
  strongLookupCard: () => '<div class="strong-card">Servant</div>',
  strongLexiconStatus: 'ready', escapeHtml: value => value,
  closeStudyPopup() {}, positionStudyPopup() {}, requestAnimationFrame() {},
});
context.document.createElement = () => strongPopup;
context.document.querySelector = () => ({ appendChild() {}, style: { setProperty() {} } });
vm.runInContext(source.slice(source.indexOf('function bindStudyPopupGotoLinks('), source.indexOf('function positionStudyPopup(')), context);
vm.runInContext(source.slice(source.indexOf('function openStrongPopup('), source.indexOf('function openCrossReferencePopup(')), context);
context.state.popupPinchEnabled = true;
context.openStrongPopup({dataset:{strong:'G1401',strongWord:'a servant'},setAttribute(){},getBoundingClientRect:()=>({})});
assert.match(strongPopup.innerHTML, /Servant/);
assert.equal(typeof strongListeners.touchmove, 'function');
const strongEvent = distance => { const e = event(distance); e.touches.forEach(t => { t.target = strongPopup; }); return e; };
strongListeners.touchstart(strongEvent(100));
strongListeners.touchmove(strongEvent(150));
assert.equal(context.state.popupTextScale, 1.5);
strongListeners.touchend(strongEvent(0));
assert.equal(storage.get('lw_popup_text_scale'), '1.5');
const countBefore = listenerCount;
context.setStudyPopupContent(strongPopup, 'Updated lookup', "Strong's");
assert.equal(listenerCount, countBefore, 'Refreshing content must not duplicate pinch listeners');
console.log('Popup text size, Strong lookup binding, and pinch tests passed');
