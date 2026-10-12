import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('let focusReadingAutoElapsed = 0'), source.indexOf('function reader(chapterChange'));
const status = { textContent: '' };
const guide = { style: {}, children: Array.from({length:4},()=>({style:{}})) };
const rect = (top,left=10,right=290) => ({top,bottom:top+20,left,right,width:right-left,height:20});
const text = (left, lines) => ({ closest:()=>({dataset:{version:left===310?'AMP':'BSB'},getBoundingClientRect:()=>({left,right:left+280})}), getBoundingClientRect:()=>({left,right:left+280}), lines, textContent:'Scripture',parentElement:{closest:()=>null} });
// Nested inline markup produces duplicate rectangles; a parallel column has independent lines.
const texts = [text(10,[rect(80),rect(80),rect(110)]),text(310,[rect(80,310,590),rect(110,310,590)]),text(10,[rect(150)])];
const surface = {scrollTop:0,scrollHeight:1000,isConnected:true,clientHeight:200,getBoundingClientRect:()=>({top:50,left:0,width:600,height:200}),querySelectorAll:()=>texts};
let renders = 0;
const context = vm.createContext({state:{focusMode:true,focusReading:true,focusReadingLines:2,focusReadingStyle:'dim',mode:'parallel',reference:'John 3'},
 document:{querySelector:s=>s==='.scripture'?surface:null,getElementById:id=>id==='focusReadingGuide'?guide:status,createTreeWalker:t=>({currentNode:t,done:false,nextNode(){if(this.done)return false;this.done=true;return true;}}),createRange:()=>({selectNodeContents(t){this.text=t;},getClientRects(){return this.text.lines;}})},
 window:{matchMedia:()=>({matches:true})},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},activeAutoScrollSpeed:()=>({pixelsPerSecond:10}),pauseReaderAutoScroll:()=>{context.state.autoScrollActive=false;},showToast:()=>{},NodeFilter:{SHOW_TEXT:4},cancelFocusReadingTap:()=>{},localStorage:{setItem(){}},renderPreservingReaderScroll:()=>renders++});
vm.runInContext(code,context);
context.measureFocusReading();
assert.equal(status.textContent,'Reading line 1 of 5','Deduplicates inline rects and orders by column');
assert.equal(guide.children[0].style.height,'27px');
assert.equal(guide.children[1].style.top,'83px','Two rendered lines stay clear');
context.moveFocusReading(1);
assert.equal(status.textContent,'Reading line 2 of 5');
context.moveFocusReading(-100);
assert.equal(status.textContent,'Reading line 1 of 5','Previous clamps at first line');
context.moveFocusReading(100);
assert.equal(status.textContent,'Reading line 5 of 5','Next clamps at last line');
context.state.focusReadingLines=3;
context.moveFocusReading(-2);
assert.equal(guide.children[1].style.top,'123px','Window stops at column boundary');
surface.scrollTop=100;
context.moveFocusReading(-100);
assert.equal(surface.scrollTop,0,'Active line is scrolled back into view');
context.toggleFocusReading();
assert.equal(context.state.focusReading,false);
assert.equal(renders,1);
context.state.focusMode=false;
context.toggleFocusReading();
assert.equal(context.state.focusMode,true,'Shortcut can enter Focus Mode');
context.state.mode='big';
context.toggleFocusReading();
assert.equal(renders,2,'Other modes do not toggle reading guide');
console.log('Focus Reading: line grouping, columns, windows, boundaries, scroll, and toggle passed.');
let toggles=0,steps=[];
const shortcutState={mode:'reader',focusMode:true,focusReading:true};
const shortcuts=vm.createContext({state:shortcutState, document:{getElementById:()=>null},
 handleCrosswordClueSizeShortcut:()=>false,gameChallengePopupIsVisible:()=>false,
 isTypingTarget:target=>target?.tagName==='INPUT',toggleFocusReading:()=>toggles++,moveFocusReading:d=>steps.push(d)});
vm.runInContext(source.slice(source.indexOf('function handleGlobalShortcuts('),source.indexOf('function shortcutWorkspace(')),shortcuts);
function key(key,options={}) {let prevented=false; shortcuts.handleGlobalShortcuts({key,shiftKey:false,ctrlKey:false,metaKey:false,altKey:false,target:{},preventDefault(){prevented=true;},...options});return prevented;}
assert.equal(key('R',{shiftKey:true}),true);
assert.equal(toggles,1);
key('R',{shiftKey:true,repeat:true});
assert.equal(toggles,1,'Holding toggle does not flicker');
key('R',{shiftKey:true,ctrlKey:true});
key('R',{shiftKey:true,target:{tagName:'INPUT'}});
assert.equal(toggles,1,'Browser shortcuts and typing are left alone');
assert.equal(key('ArrowDown'),true);
assert.equal(key('ArrowUp'),true);
assert.deepEqual(steps,[1,-1]);
console.log('Focus Reading shortcuts: toggle, repeat, browser modifiers, typing, and line arrows passed.');

// Verse fragments start at different x positions in a flowing paragraph.
// The second visual line contains the end of verse 1 and the start of verse 2.
context.state.mode='reader';context.state.focusMode=true;context.state.focusReading=true;
context.state.reference='2 Thessalonians 3';context.state.focusReadingLines=1;
const paragraph={getBoundingClientRect:()=>({left:10,right:590})};
function fragment(left,lines){return {...text(left,lines),closest:selector=>selector==='.parallel-copy'?null:paragraph};}
texts.splice(0,texts.length,fragment(30,[rect(80),rect(110)]),fragment(220,[rect(110,220),rect(140,220)]),fragment(45,[rect(170)]));
context.measureFocusReading();
assert.equal(status.textContent,'Reading line 1 of 4','Shared paragraph line counted only once');
for(const top of ['57px','87px','117px']){
  context.moveFocusReading(1);
  assert.equal(parseFloat(guide.children[0].style.height)+surface.scrollTop,parseFloat(top),'Reading follows vertical order despite verse start offsets');
}
console.log('Flowing paragraph regression: shared lines merge and every visual line is visited in order.');

let now=1000, pending=new Map(), timerId=0, readingToggles=0, autoToggles=0;
const gestureContext=vm.createContext({state:{focusMode:true,mode:'reader',reference:'John 3'},Date:{now:()=>now},Math,
 setTimeout:fn=>{pending.set(++timerId,fn);return timerId;},clearTimeout:id=>pending.delete(id),
 toggleFocusReading:()=>readingToggles++,toggleReaderAutoScrollFromGesture:()=>autoToggles++});
vm.runInContext(source.slice(source.indexOf('const focusReadingDoubleTapMs ='),source.indexOf('function toggleReaderAutoScrollFromGesture()')),gestureContext);
const gesture={startPoints:new Map([[1,{x:100,y:100}],[2,{x:150,y:100}]])};
gestureContext.handleFocusReadingTwoFingerTap(gesture);now+=200;gestureContext.handleFocusReadingTwoFingerTap(gesture);
assert.equal(readingToggles,1);assert.equal(autoToggles,0);assert.equal(pending.size,0,'Double tap consumes pending auto-scroll tap');
now+=500;gestureContext.handleFocusReadingTwoFingerTap(gesture);[...pending.values()][0]();
assert.equal(autoToggles,1,'Single tap retains auto-scroll');
gestureContext.handleFocusReadingTwoFingerTap(gesture);gestureContext.cancelFocusReadingTap();
assert.equal(pending.size,0,'Pinch, movement, or touch cancellation clears delayed tap');
gestureContext.handleFocusReadingTwoFingerTap(gesture);gestureContext.state.reference='John 4';[...pending.values()][0]();
assert.equal(autoToggles,1,'Delayed tap never acts on a different chapter');
console.log('Two-finger gesture: double toggle, single auto-scroll, cancellation, and chapter changes passed.');

context.measureFocusReading();context.state.autoScrollActive=true;
context.moveFocusReading(-100,{automatic:true});
context.advanceFocusReadingAutoScroll(1999);
assert.equal(status.textContent,'Reading line 1 of 4','Guide holds the line at selected speed');
context.advanceFocusReadingAutoScroll(1);
assert.equal(status.textContent,'Reading line 2 of 4','Playback advances one visual line');
context.advanceFocusReadingAutoScroll(2000);context.advanceFocusReadingAutoScroll(2000);
assert.equal(status.textContent,'Reading line 4 of 4');
context.advanceFocusReadingAutoScroll(2000);
assert.equal(context.state.autoScrollActive,false,'Playback stops after reading the final line');
context.state.autoScrollActive=true;context.moveFocusReading(-1);
assert.equal(context.state.autoScrollActive,false,'Manual navigation pauses automatic reading');
console.log('Focus Reading playback: pacing, ordered progress, final line, and manual pause passed.');

// Sample the actual animation at start, midpoint, and completion.
context.state.autoScrollActive=false;context.moveFocusReading(-100);
const frames=new Map();let frameId=0;
context.requestAnimationFrame=fn=>{frames.set(++frameId,fn);return frameId;};
context.cancelAnimationFrame=id=>frames.delete(id);
context.window.matchMedia=()=>({matches:false});
const sample=time=>{const [id,fn]=frames.entries().next().value;frames.delete(id);fn(time);};
const contentTop=()=>parseFloat(guide.children[0].style.height)+surface.scrollTop;
const before=contentTop();context.moveFocusReading(1);sample(0);sample(210);
assert.ok(contentTop()>before && contentTop()<before+30,'Ruler passes through an intermediate position');
context.advanceFocusReadingAutoScroll(10000);
assert.equal(status.textContent,'Reading line 2 of 4','Playback lets the current glide finish before advancing');
sample(420);assert.equal(contentTop(),before+30,'Ruler settles exactly on next line');
context.moveFocusReading(1);sample(500);sample(600);
context.moveFocusReading(-1);assert.equal(frames.size,1,'Rapid input replaces the old animation');
context.cancelFocusReadingMotion();assert.equal(frames.size,0,'Manual interaction cancels animation');
context.window.matchMedia=()=>({matches:true});context.moveFocusReading(1);
assert.equal(frames.size,0,'Reduced motion uses immediate placement');
console.log('Focus Reading motion: interpolation, final alignment, interruption, and reduced-motion fallback passed.');

context.document.createRange = () => ({ selectNodeContents(t) { this.text = t; }, getClientRects() { return this.text.lines.map(r => ({ ...r, top: r.top - surface.scrollTop, bottom: r.bottom - surface.scrollTop })); } });
context.state.focusReading = false; context.state.mode = 'reader'; surface.scrollTop = 0;
context.toggleFocusReading();
assert.equal(frames.size, 1, 'Opening defers positioning until scroll restoration');
sample(1000); surface.scrollTop = 70;
sample(1016); sample(1032);
assert.equal(status.textContent, 'Reading line 2 of 4', 'Opening chooses the line in the restored viewport');
assert.equal(surface.scrollTop, 0, 'Opening centers that line without starting playback');
assert.equal(context.state.autoScrollActive, false);
console.log('Focus Reading opening: restored viewport, immediate positioning, and paused playback passed.');

context.measureFocusReading();
for (const scroll of [0, 10, 20, 50]) {
  surface.scrollTop = scroll;
  const ruler = context.manualFocusReadingWindowRect(surface);
  assert.equal((ruler.top + ruler.bottom) / 2 - scroll, surface.clientHeight / 2, 'Manual ruler stays centered while the text moves');
}
const manualTop = surface.scrollTop;
context.manualFocusReadingWindowRect(surface);
assert.equal(surface.scrollTop, manualTop, 'Manual tracking never fights the user scroll position');
context.state.mode = 'parallel'; surface.scrollTop = 0; surface.querySelectorAll = () => texts;
context.measureFocusReading(); context.moveFocusReading(-100);
const columnRect = context.manualFocusReadingWindowRect(surface);
assert.equal(columnRect.left, 10, 'Manual scrolling stays in the current side-by-side translation');
console.log('Focus Reading manual ruler: stationary center, free scrolling, and parallel column ownership passed.');
vm.runInContext('focusReadingManualScroll = true;', context);
context.paintFocusReading();
assert.equal((parseFloat(guide.children[0].style.height) + parseFloat(guide.children[1].style.top)) / 2, surface.clientHeight / 2, 'Painted masks leave the manual window at viewport center');
vm.runInContext('focusReadingManualScroll = false;', context);

const parallelText = (version, left, tops) => ({
  ...text(left, tops.map(top => rect(top, left, left + 280))),
  closest: () => ({ dataset: { version }, getBoundingClientRect: () => ({ left, right: left + 280 }) }),
});
vm.runInContext('focusReadingManualScroll = false;', context);
context.state.mode = 'parallel'; context.state.reference = 'John 3'; context.state.focusReadingLines = 3;
surface.scrollTop = 0;
const stackedTexts = [parallelText('BSB', 10, [80, 110]), parallelText('AMP', 10, [140, 170]), parallelText('BSB', 10, [200]), parallelText('AMP', 10, [230])];
surface.querySelectorAll = () => stackedTexts;
context.measureFocusReading(); context.moveFocusReading(-100);
const visited = [];
for (let i = 0; i < 6; i++) {
  visited.push(context.focusReadingWindowRect().top);
  if (i === 0) assert.equal(context.focusReadingWindowRect().bottom, 80, 'Multi-line window stops before the next stacked translation');
  if (i < 5) context.moveFocusReading(1, { automatic: true });
}
assert.deepEqual(visited, [30, 60, 90, 120, 150, 180], 'Stacked playback reads each translation within a verse before advancing to the next verse');
context.state.autoScrollActive = true; context.advanceFocusReadingAutoScroll(2000);
assert.equal(context.state.autoScrollActive, false, 'Stacked playback ends after the last translation');
surface.scrollTop = 0;
surface.querySelectorAll = () => [parallelText('BSB', 10, [80, 110, 200]), parallelText('AMP', 310, [80, 110, 200])];
context.measureFocusReading(); context.moveFocusReading(-100);
const columnTops = [];
for (let i = 0; i < 6; i++) { columnTops.push(context.focusReadingWindowRect().top); if (i < 5) context.moveFocusReading(1); }
assert.deepEqual(columnTops, [30, 60, 150, 30, 60, 150], 'After reflow to side-by-side, playback retains column order');
console.log('Parallel Focus Reading: stacked visual order, translation boundaries, final stop, and side-by-side reflow passed.');
