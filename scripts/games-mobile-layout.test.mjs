import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

assert.match(source, /gamesDrawerOpen: ""/);
assert.match(source, /state\.mode === "trivia" \? "trivia-shell" : ""/);
assert.match(source, /id="gameSocialToggle"[\s\S]*?aria-controls="gamesSocialDrawer"/);
assert.match(source, /id="gameOptionsToggle"[\s\S]*?aria-controls="gamesOptionsDrawer"/);
assert.match(source, /class="trivia-start-dock"[\s\S]*?id="startTriviaGame"/);
assert.match(source, /class="games-drawer games-options-drawer"[\s\S]*?role="dialog"/);
assert.match(source, /class="games-drawer games-social-drawer"[\s\S]*?role="dialog"/);
assert.match(source, /gamesUseDrawers \? 'role="dialog" aria-modal="true"' : 'role="region"'/);
assert.equal(source.match(/\$\{gameChallengeSetupCard\(\)\}/g)?.length, 1);
assert.match(extractFunction("setGamesDrawer"), /renderPreservingReaderScroll\(\)/);
assert.match(extractFunction("setGamesDrawer"), /focus\(\{ preventScroll: true \}\)/);
assert.match(extractFunction("trapGamesDrawerFocus"), /event\.key === "Escape"/);
assert.match(extractFunction("trapGamesDrawerFocus"), /event\.key !== "Tab"/);
assert.match(extractFunction("centerActiveTriviaMode"), /tabs\.scrollLeft/);
assert.match(extractFunction("startTriviaGame"), /state\.gamesDrawerOpen = ""/);
assert.match(extractFunction("switchMode"), /nextMode !== "trivia"[\s\S]*?state\.gamesDrawerOpen = ""/);

assert.match(styles, /\.games-drawer-shell,[\s\S]*?\.games-drawer-scroll \{[\s\S]*?display: contents;/);
assert.match(styles, /\.trivia-reader\.is-setup \{[\s\S]*?overflow: hidden;/);
assert.match(styles, /\.app-shell\.trivia-shell \.mobile-floating-settings \{[\s\S]*?display: none;/);
assert.match(styles, /\.trivia-setup \{[\s\S]*?grid-template-rows: auto minmax\(0, 1fr\) auto;/);
assert.match(styles, /\.trivia-mode-tabs \{[\s\S]*?grid-auto-flow: column;[\s\S]*?overflow-x: auto;/);
assert.match(styles, /\.trivia-start-dock \{[\s\S]*?display: grid;/);
assert.match(styles, /\.games-drawer-shell\.open \{[\s\S]*?position: fixed;/);
assert.match(styles, /\.games-options-drawer \{[\s\S]*?top: auto;[\s\S]*?animation-name: gamesDrawerInBottom;/);
assert.match(styles, /@media \(orientation: landscape\) and \(max-width: 1024px\) and \(max-height: 560px\) \{[\s\S]*?\.trivia-start-dock \{[\s\S]*?grid-column: 2;/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?animation-duration: 1ms !important;/);

console.log("Games mobile layout tests passed");
