import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/bible-app.js',import.meta.url),'utf8');
function extract(name){const start=source.indexOf(`function ${name}(`),body=source.indexOf(') {',start)+2;let depth=0;for(let i=body;i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;if(!depth)return source.slice(start,i+1);}throw new Error(name);}
let now=1000,timerId=0,pending=new Map(), toggles=0,reading=0,pauses=0;
const state={mode:'reader',reference:'John 3',focusMode:true,autoScrollActive:false,textScale:1};
const surface={contains:()=>true};
const ctx=vm.createContext({state,Date:{now:()=>now},Math,
 setTimeout:(fn,delay)=>{pending.set(++timerId,{fn,at:now+delay});return timerId;},clearTimeout:id=>pending.delete(id),
 canUseReaderChapterSwipe:()=>true,readerGestureTouchesAllowed:()=>true,captureReaderScroll:()=>({}),
 beginReaderBlankTap:()=>{},finishReaderBlankTap:()=>{},cancelReaderChapterPull:()=>{},finishReaderPinch:()=>{},
 pauseReaderAutoScroll:()=>{if(state.autoScrollActive)pauses++;state.autoScrollActive=false;},
 toggleReaderAutoScrollFromGesture:()=>{toggles++;state.autoScrollActive=!state.autoScrollActive;},toggleFocusReading:()=>reading++,
});
vm.runInContext(`let readerTouchGesture=null,readerBlankTapStart=null,lastReaderBlankTap=null,readerChapterTouchStart=null;
const readerGestureMoveTolerancePx=18,readerPinchStartPx=10,readerTwoFingerTapMaxMs=360;
${source.slice(source.indexOf('const focusReadingDoubleTapMs ='),source.indexOf('function toggleReaderAutoScrollFromGesture()'))}
${['touchDistance','touchPoint','touchMovedBeyond','updateReaderGestureMovement','beginReaderTwoFingerGesture','handleReaderGestureStart','handleReaderGestureMove','handleReaderGestureEnd','cancelReaderTouchGesture'].map(extract).join('\n')}`,ctx);
const touch=(identifier,x)=>({identifier,clientX:x,clientY:150,target:{}});
let prevented=0;
const event=(touches,changedTouches=[])=>({currentTarget:surface,touches,changedTouches,cancelable:true,preventDefault(){prevented++;}});
function advance(ms){now+=ms;for(const [id,timer] of [...pending])if(timer.at<=now){pending.delete(id);timer.fn();}}
function start(){ctx.handleReaderGestureStart(event([touch(1,100)]));advance(25);ctx.handleReaderGestureStart(event([touch(1,100),touch(2,150)]));}
function end(){advance(40);ctx.handleReaderGestureEnd(event([touch(2,150)],[touch(1,100)]));advance(35);ctx.handleReaderGestureEnd(event([],[touch(2,150)]));}
// Android: each two-finger single tap makes precisely one playback transition.
start();end();advance(451);
assert.equal(state.autoScrollActive,true);assert.equal(toggles,1);
start();assert.equal(state.autoScrollActive,true,'First finger does not prematurely pause playback');end();advance(451);
assert.equal(state.autoScrollActive,false);assert.equal(toggles,2);assert.equal(pauses,0);
// iOS: staggered fingers, with second tap beginning before the deadline but
// finishing after it, still form a double tap and never toggle auto-scroll.
start();end();advance(380);start();advance(50);end();advance(500);
assert.equal(reading,1);assert.equal(toggles,2);assert.ok(prevented>=6,'Own multi-touch start/end to avoid native gesture takeover');
// Quick unmatched taps coalesce, avoiding an off/on playback flicker.
start();end();advance(100);
ctx.handleReaderGestureStart(event([touch(3,300),touch(4,350)]));advance(50);
ctx.handleReaderGestureEnd(event([],[touch(3,300),touch(4,350)]));advance(451);
assert.equal(toggles,3);assert.equal(state.autoScrollActive,true);
// Ordinary scrolling still pauses playback immediately on movement.
ctx.handleReaderGestureStart(event([touch(1,100)]));
ctx.handleReaderGestureMove(event([touch(1,125)]));
assert.equal(state.autoScrollActive,false);assert.equal(pauses,1);
ctx.cancelReaderTouchGesture();
// Cancelled multi-touch never invokes a delayed action.
start();end();ctx.cancelReaderTouchGesture();advance(500);
assert.equal(toggles,3);
// A one-finger pause cancels a pending two-finger action rather than restarting.
start();end();ctx.handleReaderGestureStart(event([touch(1,100)]));
ctx.handleReaderGestureEnd(event([],[touch(1,100)]));advance(500);
assert.equal(toggles,3);assert.equal(state.autoScrollActive,false);
assert.match(source,/addEventListener\("touchstart", handleReaderGestureStart, \{ passive: false \}\)/);
console.log('Reader touch gestures: Android start/pause, iOS staggered double taps, coalescing, scroll pause, and cancellation passed.');
