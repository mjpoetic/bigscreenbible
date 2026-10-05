import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('let focusReadingRects = []'), source.indexOf('function reader(chapterChange'));
const status = { textContent: '' };
const guide = { style: {}, children: Array.from({length:4},()=>({style:{}})) };
const rect = (top,left=10,right=290) => ({top,bottom:top+20,left,right,width:right-left,height:20});
const text = (left, lines) => ({ closest:()=>null, getBoundingClientRect:()=>({left,right:left+280}), lines });
// Nested inline markup produces duplicate rectangles; a parallel column has independent lines.
const texts = [text(10,[rect(80),rect(80),rect(110)]),text(310,[rect(80,310,590),rect(110,310,590)]),text(10,[rect(150)])];
const surface = {scrollTop:0,clientHeight:200,getBoundingClientRect:()=>({top:50,left:0,width:600,height:200}),querySelectorAll:()=>texts};
let renders = 0;
const context = vm.createContext({state:{focusMode:true,focusReading:true,focusReadingLines:2,focusReadingStyle:'dim',mode:'parallel',reference:'John 3'},
 document:{querySelector:s=>s==='.scripture'?surface:null,getElementById:id=>id==='focusReadingGuide'?guide:status,createRange:()=>({selectNodeContents(t){this.text=t;},getClientRects(){return this.text.lines;}})},
 localStorage:{setItem(){}},renderPreservingReaderScroll:()=>renders++});
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
