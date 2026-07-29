import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");

function extractFunction(name) {
  const patterns = [`function ${name}(`, `async function ${name}(`];
  const start = patterns
    .map((pattern) => source.indexOf(pattern))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)[0];
  assert.notEqual(start, undefined, `Missing ${name} in bible-app.js`);
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

const saved = new Map();
const context = {
  state: {
    authUser: { id: "user-a" },
    socialConnectionsOpen: false,
  },
  socialConnectionsOpenStorageKey: "lw_social_connections_open",
  localStorage: {
    setItem(key, value) {
      saved.set(key, String(value));
    },
  },
  friendshipCollections() {
    return {
      friends: [{ id: "friend-a" }, { id: "friend-b" }],
      incoming: [{ id: "request-a" }],
      outgoing: [],
    };
  },
  gameChallengeCollections() {
    return {
      incoming: [{ id: "challenge-a" }, { id: "challenge-b" }],
      outgoing: [],
      live: [],
      completed: [],
    };
  },
  escapeHtml(value) {
    return String(value);
  },
  icons: { chevron: "<svg></svg>" },
  friendsCard() {
    return "<section>FRIENDS</section>";
  },
  gameChallengesCard() {
    return "<section>CHALLENGES</section>";
  },
};

vm.createContext(context);
vm.runInContext(`
  ${extractFunction("setSocialConnectionsOpen")}
  ${extractFunction("socialConnectionsSection")}
  globalThis.setOpen = setSocialConnectionsOpen;
  globalThis.renderSection = socialConnectionsSection;
`, context);

const collapsed = context.renderSection("quick");
assert.match(collapsed, /class="social-connections-card has-incoming-activity"/);
assert.match(collapsed, /aria-label="1 friend request and 2 game challenges waiting"/);
assert.match(collapsed, />3<\/span>/);
assert.match(collapsed, /<small>New<\/small>/);
assert.match(collapsed, /2 connections/);
assert.doesNotMatch(collapsed, /<span class="setting-label">Friends<\/span>/);
assert.match(collapsed, /FRIENDS/);
assert.match(collapsed, /CHALLENGES/);
assert.doesNotMatch(collapsed, /data-social-connections-disclosure\s+open/);

context.setOpen(true);
assert.equal(context.state.socialConnectionsOpen, true);
assert.equal(saved.get("lw_social_connections_open"), "true");
assert.match(context.renderSection("quick"), /data-social-connections-disclosure\s+open/);

assert.match(source, /data-social-connections-disclosure/);
assert.match(source, /setSocialConnectionsOpen\(true\)/);
assert.match(styles, /\.social-connections-card\.has-incoming-activity:not\(\[open\]\)/);
assert.match(styles, /\.social-connections-card\[open\] \.social-connections-activity/);
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);

console.log("Social connections tests passed");
