import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../assets/coloring-book.js", import.meta.url), "utf8");
function view(value, fail = false) {
  const window = {};
  vm.runInNewContext(source, { window, localStorage: {getItem(){if(fail)throw Error("Storage denied");return value;}} });
  return window.BSBColoring.view();
}
const initial = view(null);
assert.match(initial, /game-new-badge">BETA<\/small>/);
const appSource=readFileSync(new URL("../assets/bible-app.js",import.meta.url),"utf8");
assert.match(appSource, /<span>Coloring Book<\/span><small class="game-new-badge">BETA<\/small>/);
assert.equal((initial.match(/data-page=/g)||[]).length,7);
assert.equal((initial.match(/data-color=/g)||[]).length,14);
assert.match(initial,/type="color"/);
assert.match(initial,/data-tool="fill"/);
assert.match(initial,/data-tool="brush"/);
assert.match(initial,/data-coloring="expand"/);
assert.match(initial,/data-coloring="reader"/);
assert.match(initial,/data-coloring="games"/);
assert.match(initial,/width="600" height="600"/);
assert.match(initial,/jesus-welcomes-children.png/);
assert.match(initial,/data-tool="pan"/);
const vectorWindow={};vm.runInNewContext(source.replace("let selected = pages[0].id",'let selected = "ark"'),{window:vectorWindow,localStorage:{getItem:()=>null}});
assert.match(vectorWindow.BSBColoring.view(),/data-region="0" tabindex="0" role="button"/);
assert.match(view('{"ark":{"1":"#123456"}}'),/fill="#123456"/);
assert.doesNotMatch(view('{"ark":{"1":"red onclick=evil"}}'),/onclick=evil/);
assert.doesNotMatch(view('{"__ink":{"ark":"javascript:evil"}}'),/javascript:evil/);
assert.match(view('{"__ink":{"ark":"data:image/png;base64,AAAA"}}'),/<image href="data:image\/png;base64,AAAA"/);
for(const invalid of ['{broken','null','[]','false']) assert.match(view(invalid),/Bible Coloring Book/);
assert.match(view(null,true),/Bible Coloring Book/);
console.log("Coloring book catalog, saved colors, raster restoration, input safety, and storage recovery passed");

assert.equal((initial.match(/data-within-lines checked/g)||[]).length,2,"Line protection defaults on in both views");
assert.doesNotMatch(view('{"__withinLines":false}'),/data-within-lines checked/);
const testWindow={};
vm.runInNewContext(source.replace("window.BSBColoring={view,bind};", "window.BSBColoring={view,bind};window.testRegionMask=regionMask;"),{window:testWindow,localStorage:{getItem:()=>null}});
// Two regions, an opaque outline, and an antialiased edge. Only the starting
// region is paintable; a foreground detail remains excluded from its parent.
const pixels=new Uint8ClampedArray([1,0,127,255, 2,0,127,255, 0,0,0,255, 1,0,127,128]);
assert.deepEqual([...testWindow.testRegionMask(pixels,0,0,2)],[0,0,0,255, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
assert.equal(testWindow.testRegionMask(pixels,0,1,2),null,"Starting on an outline cannot paint");
assert.equal(testWindow.testRegionMask(pixels,-1,0,2),null);
assert.equal(testWindow.testRegionMask(pixels,2,0,2),null);
assert.equal(testWindow.testRegionMask(pixels,1,1,2),null,"Antialiased outline pixels stay protected");
const thumbnails=[...initial.matchAll(/data-page="([^"]+)"[\s\S]*?<\/svg>/g)];
for(const [,id] of thumbnails) {
  if(id === "jesus-children")continue;
  const thumbnail=thumbnails.find(m=>m[1]===id)[0];
  assert.ok((thumbnail.match(/stroke-width="3"/g)||[]).length>=45,`${id} includes richer detail`);
}
console.log("Default line protection, saved preference, nested-region masking, protected edges, and detailed illustrations passed");
const css=readFileSync(new URL('../assets/bible-app.css',import.meta.url),'utf8');
assert.match(initial,/coloring-reader/);
assert.doesNotMatch(initial,/trivia-reader is-setup/);
assert.match(css,/\.app-shell \.trivia-grid > \.coloring-reader[^}]*overflow-y:auto/);
assert.doesNotMatch(source,/!e\.isPrimary/);
assert.match(source,/e\.pointerType==="mouse" && e\.button!==0/);
assert.match(appSource,/icons\.paintbrush/);
const art=JSON.parse(readFileSync(new URL('../assets/coloring-pages/jesus-welcomes-children.json',import.meta.url),'utf8'));
assert.ok(art.regions>500);
console.log('Illustrated regions, portrait scroll scope, paintbrush glyph and touch/Pencil metadata regression checks passed');
