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
assert.equal((initial.match(/data-page=/g)||[]).length,6);
assert.equal((initial.match(/data-color=/g)||[]).length,14);
assert.match(initial,/type="color"/);
assert.match(initial,/data-tool="fill"/);
assert.match(initial,/data-tool="brush"/);
assert.match(initial,/data-coloring="expand"/);
assert.match(initial,/data-coloring="reader"/);
assert.match(initial,/data-coloring="games"/);
assert.match(initial,/width="600" height="600"/);
assert.match(initial,/data-region="0" tabindex="0" role="button"/);
assert.match(view('{"ark":{"1":"#123456"}}'),/fill="#123456"/);
assert.doesNotMatch(view('{"ark":{"1":"red onclick=evil"}}'),/onclick=evil/);
assert.doesNotMatch(view('{"__ink":{"ark":"javascript:evil"}}'),/javascript:evil/);
assert.match(view('{"__ink":{"ark":"data:image/png;base64,AAAA"}}'),/<image href="data:image\/png;base64,AAAA"/);
for(const invalid of ['{broken','null','[]','false']) assert.match(view(invalid),/Bible Coloring Book/);
assert.match(view(null,true),/Bible Coloring Book/);
console.log("Coloring book catalog, saved colors, raster restoration, input safety, and storage recovery passed");
