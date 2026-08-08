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

const scaleContext = {};
vm.createContext(scaleContext);
vm.runInContext(`
  const defaultPresentationTextScale = 1;
  ${extractFunction("clampPresentationTextScale")}
  globalThis.clampScale = clampPresentationTextScale;
`, scaleContext);

assert.equal(scaleContext.clampScale(0.2), 0.6);
assert.equal(scaleContext.clampScale(0.85), 0.9);
assert.equal(scaleContext.clampScale(1.24), 1.2);
assert.equal(scaleContext.clampScale(2), 1.6);
assert.equal(scaleContext.clampScale(null), 1);

assert.match(source, /presentationTextScale: Number\(localStorage\.getItem\("lw_presentation_text_scale"\)/);
assert.match(extractFunction("captureCloudSnapshot"), /presentationTextScale: state\.presentationTextScale/);
assert.match(extractFunction("applyCloudSnapshot"), /state\.presentationTextScale = clampPresentationTextScale/);
assert.match(extractFunction("persistCloudSnapshotLocally"), /lw_presentation_text_scale/);
assert.match(extractFunction("persistPresentationTextScale"), /scheduleCloudSync\(\)/);

assert.match(source, /id="presentationDecreaseText"/);
assert.match(source, /id="presentationResetText"/);
assert.match(source, /id="presentationIncreaseText"/);
assert.match(source, /Big Screen text size controls/);
assert.match(source, /id="presentationAccountButton"/);
assert.match(source, /id="presentationAccountPopover"/);
assert.match(source, /presentation-bottom-settings-menu/);
assert.match(source, /presentation-about-settings-btn/);
assert.doesNotMatch(extractFunction("presentation"), /class="presentation-about-link"/);
assert.match(extractFunction("bindEvents"), /presentationAccountButton/);
assert.match(extractFunction("toggleAccountMenu"), /state\.mode === "big"/);
assert.match(extractFunction("handleGlobalShortcuts"), /state\.mode === "big"\) return adjustPresentationTextScale\(0\.1/);
assert.match(extractFunction("handleGlobalShortcuts"), /state\.mode === "big"\) return resetPresentationTextScale/);

assert.match(source, /touchmove", handlePresentationTouchMove, \{ passive: false \}/);
assert.match(source, /touchend", handlePresentationTouchEnd, \{ passive: false \}/);
assert.match(source, /touchcancel", cancelPresentationTouch/);
assert.match(extractFunction("handlePresentationTouchMove"), /event\.preventDefault\(\)/);
assert.match(extractFunction("handlePresentationTouchMove"), /presentation-swipe-ready/);
assert.match(extractFunction("handlePresentationPinchMove"), /state\.presentationTextScale = clamp/);
assert.match(extractFunction("commitPresentationSwipe"), /prefers-reduced-motion: reduce/);
assert.match(extractFunction("commitPresentationSwipe"), /presentationEnterDirection = direction/);
assert.match(source, /presentation-swipe-preview-previous/);
assert.match(source, /presentation-swipe-preview-next/);

assert.match(extractFunction("fitPresentationText"), /naturalFontSize \* clamp\(state\.presentationTextScale, 0\.6, 1\.6\)/);
assert.match(styles, /width: min\(100%, 3400px\)/);
assert.match(styles, /clamp\(34px, 5\.8vw, 240px\)/);
assert.match(styles, /\.presentation-swipe-preview \{/);
assert.match(styles, /\.presentation\.presentation-enter-next \.presentation-passage/);
assert.match(styles, /@keyframes presentation-slide-in-next/);
assert.match(styles, /\.presentation-scale-feedback\.show/);
assert.match(styles, /\.presentation-settings-popover \{[\s\S]*?max-height: calc\(100dvh - 96px/);
assert.match(styles, /\.presentation-settings-popover \{[\s\S]*?overflow-y: auto/);
assert.match(styles, /\.presentation-bottom-settings-menu \.presentation-settings-popover \{[\s\S]*?bottom: calc\(100% \+ 10px\)/);
assert.match(styles, /\.presentation-account-popover \{[\s\S]*?background: var\(--panel\)/);
assert.match(styles, /\.presentation-account-toggle/);

console.log("Presentation display tests passed");
