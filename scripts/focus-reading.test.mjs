import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/bible-app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('let focusReadingRects = []'), source.indexOf('function reader(chapterChange'));
const status = { textContent: '' };
const guide = { style: {}, children: Array.from({length:4},()=>({style:{}})) };
const rect = (top,left=10,right=290) => ({top,bottom:top+20,left,right,width:right-left,height:20});
const text = (left, lines) => ({ closest:()=>({dataset:{version:left===310?'AMP':'BSB'},getBoundingClientRect:()=>({left,right:left+280})}), getBoundingClientRect:()=>({left,right:left+280}), lines, textContent:'Scripture',parentElement:{closest:()=>null} });
// Nested inline markup produces duplicate rectangles; a parallel column has independent lines.
const texts = [text(10,[rect(80),rect(80),rect(110)]),text(310,[rect(80,310,590),rect(110,310,590)]),text(10,[rect(150)])];
const surface = {scrollTop:0,clientHeight:200,getBoundingClientRect:()=>({top:50,left:0,width:600,height:200}),querySelectorAll:()=>texts};
let renders = 0;
const context = vm.createContext({state:{focusMode:true,focusReading:true,focusReadingLines:2,focusReadingStyle:'dim',mode:'parallel',reference:'John 3'},
 document:{querySelector:s=>s==='.scripture'?surface:null,getElementById:id=>id==='focusReadingGuide'?guide:status,createTreeWalker:t=>({currentNode:t,done:false,nextNode(){if(this.done)return false;this.done=true;return true;}}),createRange:()=>({selectNodeContents(t){this.text=t;},getClientRects(){return this.text.lines;}})},
 NodeFilter:{SHOW_TEXT:4},cancelFocusReadingTap:()=>{},localStorage:{setItem(){}},renderPreservingReaderScroll:()=>renders++});
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
vm.runInContext(source.slice(source.indexOf('let focusReadingTapTimer = 0'),source.indexOf('function toggleReaderAutoScrollFromGesture()')),gestureContext);
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
