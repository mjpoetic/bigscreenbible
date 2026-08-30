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

const layoutContext = {};
vm.createContext(layoutContext);
vm.runInContext(`
  ${extractFunction("tutorialCardTopForTarget")}
  ${extractFunction("tutorialCompactCardSide")}
  globalThis.positionCard = tutorialCardTopForTarget;
  globalThis.cardSide = tutorialCompactCardSide;
`, layoutContext);

assert.equal(
  layoutContext.positionCard({
    targetTop: 24,
    targetBottom: 62,
    cardHeight: 196,
    viewportHeight: 800,
  }),
  74,
  "A portrait tour card sits below a top control",
);

assert.equal(
  layoutContext.positionCard({
    targetTop: 742,
    targetBottom: 784,
    cardHeight: 196,
    viewportHeight: 800,
  }),
  534,
  "A portrait tour card sits above a bottom control",
);

assert.equal(
  layoutContext.positionCard({
    targetTop: 270,
    targetBottom: 310,
    cardHeight: 420,
    viewportHeight: 568,
  }),
  12,
  "A tall card stays inside a short viewport when neither side has enough room",
);

assert.equal(
  layoutContext.cardSide({
    targetLeft: 3,
    targetTop: 220,
    targetRight: 69,
    targetBottom: 772,
    cardHeight: 239,
    viewportWidth: 390,
    viewportHeight: 844,
  }),
  "right",
  "A tall portrait Study rail moves the tour card into the open side of the screen",
);

assert.equal(
  layoutContext.cardSide({
    targetLeft: 142,
    targetTop: 770,
    targetRight: 248,
    targetBottom: 818,
    cardHeight: 262,
    viewportWidth: 390,
    viewportHeight: 844,
  }),
  "above",
  "A bottom navigation target keeps the full-width card above it",
);

const spotlightFunction = extractFunction("updateTutorialSpotlight");
assert.match(spotlightFunction, /if \(isCompactScreen\(\) \|\| isShortLandscapeScreen\(\)\)[\s\S]*?tutorialCardTopForTarget/);
assert.match(spotlightFunction, /tutorialCompactCardSide/);
assert.match(spotlightFunction, /if \(!compactWidth && cardSide !== "right" && cardSide !== "left"\)/);
assert.match(spotlightFunction, /setProperty\("top", `\$\{cardTop\}px`, "important"\)/);
assert.match(spotlightFunction, /setProperty\("bottom", "auto", "important"\)/);
assert.match(styles, /@media \(max-width: 840px\) \{[\s\S]*?\.tutorial-card \{[\s\S]*?left: calc\(12px \+ env\(safe-area-inset-left, 0px\)\) !important;/);

console.log("Tutorial layout tests passed");
