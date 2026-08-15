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

const popupContext = {
  state: {
    streakPopupVisible: true,
    streak: { current: 72, best: 72, totalDays: 72, lastVisit: "2026-08-15", days: [] },
  },
  document: { getElementById: () => null },
  icons: { flame: "flame" },
};
vm.createContext(popupContext);
vm.runInContext(`
  const normalizeReadingStreak = (streak) => streak;
  const escapeHtml = (value) => String(value);
  ${extractFunction("streakPopup")}
  globalThis.popupMarkup = () => streakPopup();
`, popupContext);

const initialMarkup = popupContext.popupMarkup();
assert.match(initialMarkup, /class="streak-popup "/);
assert.match(initialMarkup, /data-popup-continuing="false"/);
assert.doesNotMatch(initialMarkup, /class="streak-popup continuing"/);

popupContext.document.getElementById = () => ({ id: "streakPopup" });
const continuingMarkup = popupContext.popupMarkup();
assert.match(continuingMarkup, /class="streak-popup continuing"/);
assert.match(continuingMarkup, /data-popup-continuing="true"/);

const timerCallbacks = [];
const timerContext = {
  state: { streakPopupVisible: true },
  setTimeout(callback, delay) {
    timerCallbacks.push({ callback, delay });
    return timerCallbacks.length;
  },
  dismissCalls: 0,
};
vm.createContext(timerContext);
vm.runInContext(`
  let streakPopupTimer = 0;
  const dismissStreakPopup = () => { globalThis.dismissCalls += 1; };
  ${extractFunction("scheduleStreakPopupDismiss")}
  globalThis.schedule = scheduleStreakPopupDismiss;
  globalThis.activeTimer = () => streakPopupTimer;
`, timerContext);

timerContext.schedule();
timerContext.schedule();
assert.equal(timerCallbacks.length, 1, "Rerenders must not restart the streak dismissal timer");
assert.equal(timerCallbacks[0].delay, 4200);
assert.equal(timerContext.activeTimer(), 1);

timerCallbacks[0].callback();
assert.equal(timerContext.dismissCalls, 1);
assert.equal(timerContext.activeTimer(), 0, "The timer must clear before dismissal begins");

timerContext.schedule();
assert.equal(timerCallbacks.length, 2, "A new streak popup can schedule a fresh dismissal timer");

assert.match(styles, /\.streak-popup\.continuing\s*\{[^}]*animation:\s*none;/);
assert.match(styles, /\.streak-popup\.motion-exit\s*\{[^}]*animation:\s*streakPopupOut/);

console.log("Streak popup tests passed");
