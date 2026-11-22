import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../assets/coloring-book.js", import.meta.url), "utf8");
function coloring(value, fail = false, vector = false) {
  const window = {};
  vm.runInNewContext(vector ? source.replace("let selected = null",'let selected = "ark"') : source, { window, localStorage: {getItem(){if(fail)throw Error("Storage denied");return value;}} });
  return window.BSBColoring;
}
const view=(...args)=>coloring(...args).view();
const initial = view(null);
assert.match(initial, /game-new-badge">BETA<\/small>/);
const appSource=readFileSync(new URL("../assets/bible-app.js",import.meta.url),"utf8");
assert.match(appSource, /<span>Coloring Book<\/span><small class="game-new-badge">BETA<\/small>/);
const gallery=coloring(null).galleryView();
assert.deepEqual([...gallery.matchAll(/data-coloring-page="([^"]+)"/g)].map(match=>match[1]),["jesus-children","jesus-calms-storm"],"Only approved coloring pages are listed");
assert.doesNotMatch(gallery,/Continue coloring/);
assert.doesNotMatch(initial,/coloringPagePicker/);
const resumed=coloring(JSON.stringify({
  __ink:{"jesus-calms-storm":"data:image/png;base64,AAAA"},
  __artUpdatedAt:{"jesus-children":10,"jesus-calms-storm":20,"ark":30}
}));
assert.match(resumed.galleryView(),/data-coloring-page="jesus-calms-storm"[\s\S]*data:image\/png;base64,AAAA[\s\S]*Continue coloring/);
assert.match(resumed.view(),/coloring-page-title">Jesus Calms the Storm/);
assert.equal(resumed.selectPage("ark"),false);
assert.equal(resumed.selectPage("jesus-children"),true);
assert.match(resumed.view(),/coloring-page-title">Jesus Welcomes the Children/);
assert.match(resumed.galleryView(),/data-coloring-page="jesus-calms-storm"[\s\S]*Continue coloring/);
assert.equal((initial.match(/data-color=/g)||[]).length,26);
assert.match(initial,/type="color"/);
assert.match(initial,/data-tool="fill"/);
assert.match(initial,/data-tool="brush"/);
assert.match(initial,/data-coloring="expand"/);
assert.match(initial,/data-coloring="reader"/);
assert.match(initial,/data-coloring="games"/);
assert.match(initial,/width="600" height="600"/);
assert.match(initial,/jesus-welcomes-children.png/);
assert.match(initial,/data-tool="pan"/);
const vectorWindow={};vm.runInNewContext(source.replace("let selected = null",'let selected = "ark"'),{window:vectorWindow,localStorage:{getItem:()=>null}});
assert.match(vectorWindow.BSBColoring.view(),/data-region="0" tabindex="0" role="button"/);
assert.match(view('{"ark":{"1":"#123456"}}',false,true),/fill="#123456"/);
assert.doesNotMatch(view('{"ark":{"1":"red onclick=evil"}}'),/onclick=evil/);
assert.doesNotMatch(view('{"__ink":{"ark":"javascript:evil"}}'),/javascript:evil/);
assert.doesNotThrow(()=>view('{"__ink":{"jesus-children":"data:image/png;base64,AAAA"}}'));
for(const invalid of ['{broken','null','[]','false']) assert.match(view(invalid),/Coloring Book/);
assert.match(view(null,true),/Coloring Book/);
console.log("Coloring book catalog, saved colors, raster restoration, input safety, and storage recovery passed");

assert.equal((initial.match(/data-within-lines checked/g)||[]).length,1,"One shared line-protection control travels into full screen");
assert.doesNotMatch(view('{"__withinLines":false}'),/data-within-lines checked/);
const testWindow={};
vm.runInNewContext(source.replace("window.BSBColoring={view,galleryView,selectPage,bind,captureProgress,applyProgress,mergeProgress,handleShortcut};", "window.BSBColoring={view,galleryView,selectPage,bind,captureProgress,applyProgress,mergeProgress,handleShortcut};window.testRegionMask=regionMask;window.testRegionSeed=regionSeed;"),{window:testWindow,localStorage:{getItem:()=>null}});
// Two regions, an opaque outline, and an antialiased edge. Only the starting
// region is paintable; a foreground detail remains excluded from its parent.
const pixels=new Uint8ClampedArray([1,0,127,255, 2,0,127,255, 0,0,0,255, 1,0,127,128]);
assert.deepEqual([...testWindow.testRegionMask(pixels,0,0,2)],[0,0,0,255, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
assert.equal(testWindow.testRegionMask(pixels,0,1,2),null,"Starting on an outline cannot paint");
assert.equal(testWindow.testRegionMask(pixels,-1,0,2),null);
assert.equal(testWindow.testRegionMask(pixels,2,0,2),null);
assert.equal(testWindow.testRegionMask(pixels,1,1,2),null,"Antialiased outline pixels stay protected");
assert.match(initial,/data-tool="brush" aria-pressed="true"/);
assert.doesNotMatch(initial,/Noah’s Ark|Creation Morning|Garden of Praise|The Christmas Star|Beside Still Waters|The Vine and Branches/);
assert.deepEqual(JSON.parse(JSON.stringify(testWindow.testRegionSeed(pixels,0,1,2,1))),{x:0,y:0},"A start on an outline can find the nearest enclosed region");
assert.equal(testWindow.testRegionSeed(new Uint8ClampedArray(16),0,0,2,1),null);
assert.equal(testWindow.testRegionSeed(pixels,-1,0,2,6),null);
console.log("Brush default, hidden draft pages, region seeding, and protected boundaries passed");
const css=readFileSync(new URL('../assets/bible-app.css',import.meta.url),'utf8');
assert.match(initial,/coloring-reader/);
assert.doesNotMatch(initial,/trivia-reader is-setup/);
assert.match(css,/\.app-shell \.trivia-grid > \.coloring-reader[^}]*overflow-y:auto/);
assert.doesNotMatch(source,/!e\.isPrimary/);
assert.match(source,/e\.pointerType==="mouse" && e\.button!==0/);
assert.match(appSource,/icons\.artistPalette/);
const art=JSON.parse(readFileSync(new URL('../assets/coloring-pages/jesus-welcomes-children.json',import.meta.url),'utf8'));
assert.ok(art.regions>500);
console.log('Illustrated regions, portrait scroll scope, artist palette glyph and touch/Pencil metadata regression checks passed');

assert.match(initial,/coloring-skin-tones[^>]*hidden/);
assert.match(initial,/class="coloring-reference"[^>]*data-coloring="read"/);
assert.doesNotMatch(initial,/data-coloring="palette"|Download outline/);
assert.match(initial,/Print outline \/ Save PDF/);
