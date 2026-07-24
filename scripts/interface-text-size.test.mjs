import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing ${name} in bible-app.js`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert.ok(bodyStart > 1, `Could not find ${name} body in bible-app.js`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name} from bible-app.js`);
}

const context = {};
vm.createContext(context);
vm.runInContext(`
  const defaultInterfaceTextSize = "default";
  const interfaceTextSizeCodes = ["default", "large", "larger"];
  ${extractFunction("normalizedInterfaceTextSize")}
  globalThis.normalize = normalizedInterfaceTextSize;
`, context);

assert.equal(context.normalize("default"), "default");
assert.equal(context.normalize("large"), "large");
assert.equal(context.normalize("larger"), "larger");
assert.equal(context.normalize("unexpected"), "default");
assert.equal(context.normalize(null), "default");

assert.match(source, /data-interface-text-size="\$\{state\.interfaceTextSize\}"/);
assert.match(source, /\$\{accessibilitySettings\("mobile"\)\}/);
assert.match(source, /\$\{accessibilitySettings\(\)\}/);
assert.match(source, /interfaceTextSize: state\.interfaceTextSize/);
assert.match(source, /localStorage\.setItem\("lw_interface_text_size", state\.interfaceTextSize\)/);

assert.match(styles, /\.app-shell\[data-interface-text-size="large"\]/);
assert.match(styles, /\.app-shell\[data-interface-text-size="larger"\]/);
assert.match(styles, /@media \(max-width: 840px\)[\s\S]*?\.book-row \{[\s\S]*?font-size: var\(--interface-text-16\)/);
assert.match(styles, /\.select-row select,[\s\S]*?\.testament-group summary \{[\s\S]*?font-size: var\(--interface-text-15\)/);

console.log("Interface text size tests passed");
