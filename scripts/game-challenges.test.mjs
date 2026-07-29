import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

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

const state = {
  authUser: { id: "user-a" },
  gameChallenges: [
    {
      id: "incoming",
      challengerId: "user-b",
      challengedId: "user-a",
      status: "pending",
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
    {
      id: "outgoing",
      challengerId: "user-a",
      challengedId: "user-c",
      status: "pending",
      expiresAt: "2099-01-01T00:00:00.000Z",
    },
    {
      id: "live",
      challengerId: "user-a",
      challengedId: "user-d",
      status: "accepted",
    },
    {
      id: "complete",
      challengerId: "user-e",
      challengedId: "user-a",
      status: "completed",
    },
  ],
  gameChallengePlayers: {
    live: [
      { challengeId: "live", userId: "user-a", score: 3, progress: 4, ready: true },
      { challengeId: "live", userId: "user-d", score: 2, progress: 3, ready: true },
    ],
  },
};

const pureContext = { state, Date };
vm.createContext(pureContext);
vm.runInContext(`
  ${extractFunction("normalizedGameChallenge")}
  ${extractFunction("normalizedGameChallengePlayer")}
  ${extractFunction("gameChallengeOtherUserId")}
  ${extractFunction("gameChallengePlayer")}
  ${extractFunction("gameChallengeIsExpired")}
  ${extractFunction("gameChallengeCollections")}
  ${extractFunction("gameChallengePopupCandidates")}
  ${extractFunction("gameChallengePopupShouldInterrupt")}
  ${extractFunction("seededTriviaRandom")}
  ${extractFunction("gameChallengeResultLabel")}
  globalThis.normalizeChallenge = normalizedGameChallenge;
  globalThis.normalizePlayer = normalizedGameChallengePlayer;
  globalThis.otherUserId = gameChallengeOtherUserId;
  globalThis.player = gameChallengePlayer;
  globalThis.collections = gameChallengeCollections;
  globalThis.popupCandidates = gameChallengePopupCandidates;
  globalThis.popupShouldInterrupt = gameChallengePopupShouldInterrupt;
  globalThis.seededRandom = seededTriviaRandom;
  globalThis.resultLabel = gameChallengeResultLabel;
`, pureContext);

assert.deepEqual(
  { ...pureContext.normalizeChallenge({
    id: "challenge-1",
    challenger_id: "user-a",
    challenged_id: "user-b",
    game_type: "who-said-it",
    round_count: 15,
    seed: 42,
  }) },
  {
    id: "challenge-1",
    challengerId: "user-a",
    challengedId: "user-b",
    gameType: "who-said-it",
    category: "Mixed",
    difficulty: "All",
    roundCount: 15,
    version: "BSB",
    timed: false,
    seed: 42,
    status: "pending",
    respondedAt: "",
    startedAt: "",
    completedAt: "",
    expiresAt: "",
    createdAt: "",
    updatedAt: "",
  },
);
assert.equal(pureContext.otherUserId(state.gameChallenges[0]), "user-b");
assert.equal(pureContext.collections().incoming[0].id, "incoming");
assert.equal(pureContext.collections().outgoing[0].id, "outgoing");
assert.equal(pureContext.collections().live[0].id, "live");
assert.equal(pureContext.collections().completed[0].id, "complete");
assert.equal(pureContext.player("live").score, 3);
assert.deepEqual(
  Array.from(pureContext.popupCandidates([], state.gameChallenges, "user-a"), (notice) => ({
    kind: notice.kind,
    challengeId: notice.challengeId,
    status: notice.status,
  })),
  [{ kind: "incoming", challengeId: "incoming", status: "pending" }],
  "Pending invitations must surface when challenge state first loads",
);
assert.deepEqual(
  Array.from(pureContext.popupCandidates(
    [{ id: "reply", challengerId: "user-a", challengedId: "user-b", status: "pending" }],
    [{ id: "reply", challengerId: "user-a", challengedId: "user-b", status: "accepted" }],
    "user-a",
  ), (notice) => ({
    kind: notice.kind,
    challengeId: notice.challengeId,
    status: notice.status,
  })),
  [{ kind: "reply", challengeId: "reply", status: "accepted" }],
  "The challenger must see an accepted reply transition",
);
assert.deepEqual(
  Array.from(pureContext.popupCandidates(
    [{ id: "reply", challengerId: "user-a", challengedId: "user-b", status: "pending" }],
    [{ id: "reply", challengerId: "user-a", challengedId: "user-b", status: "declined" }],
    "user-a",
  ), (notice) => ({
    kind: notice.kind,
    challengeId: notice.challengeId,
    status: notice.status,
  })),
  [{ kind: "reply", challengeId: "reply", status: "declined" }],
  "The challenger must see a declined reply transition",
);
assert.equal(
  pureContext.popupShouldInterrupt({ kind: "incoming" }, true, "reader"),
  false,
  "Quiet Mode must keep incoming challenge popups out of Scripture reading",
);
assert.equal(
  pureContext.popupShouldInterrupt({ kind: "incoming" }, true, "trivia"),
  true,
  "Quiet Mode must still surface incoming challenges in Games",
);
assert.equal(
  pureContext.popupShouldInterrupt({ kind: "reply" }, true, "reader"),
  true,
  "Quiet Mode must not hide a reply from the challenger",
);

const randomA = pureContext.seededRandom(9876);
const randomB = pureContext.seededRandom(9876);
assert.deepEqual(
  [randomA(), randomA(), randomA(), randomA()],
  [randomB(), randomB(), randomB(), randomB()],
  "Challenge seeds must generate the same game order for both players",
);
assert.equal(
  pureContext.resultLabel(
    { gameType: "book-sprint" },
    { score: 5, completedAt: "done", elapsedMs: 38000 },
    { score: 5, completedAt: "done", elapsedMs: 41000 },
  ),
  "You won the tiebreak",
);
assert.equal(
  pureContext.resultLabel(
    { gameType: "book-sprint" },
    { score: 5, completedAt: "done", elapsedMs: null },
    { score: 5, completedAt: "done", elapsedMs: 41000 },
  ),
  "Tie game",
);

const challengeSchema = schema.slice(
  schema.indexOf("create or replace function private.bsb_users_are_friends"),
  schema.indexOf("create table if not exists public.bsb_verse_of_day_cache"),
);
assert.match(challengeSchema, /create table if not exists public\.bsb_game_challenges/);
assert.match(challengeSchema, /create table if not exists public\.bsb_game_challenge_players/);
assert.match(challengeSchema, /alter table public\.bsb_game_challenges enable row level security/);
assert.match(challengeSchema, /alter table public\.bsb_game_challenge_players enable row level security/);
assert.match(challengeSchema, /grant insert \(\s*challenger_id,\s*challenged_id,/s);
assert.match(challengeSchema, /grant update \(status, responded_at\)/);
assert.match(challengeSchema, /grant update \(\s*score,\s*progress,\s*ready,\s*completed_at,\s*elapsed_ms/s);
assert.match(challengeSchema, /function private\.bsb_users_are_friends\(other_user_id uuid\)/);
assert.match(challengeSchema, /security definer/);
assert.match(challengeSchema, /\(select auth\.uid\(\)\) is not null/);
assert.match(challengeSchema, /"Participants can read game challenges"/);
assert.match(challengeSchema, /"Friends can create game challenges"/);
assert.match(challengeSchema, /"Participants can answer or cancel game challenges"/);
assert.match(challengeSchema, /"Participants can read challenge players"/);
assert.match(challengeSchema, /"Players can update own live challenge state"/);
assert.match(challengeSchema, /bsb_game_challenges_active_pair_idx/);
assert.match(challengeSchema, /bsb_game_challenges_incoming_pending_idx/);
assert.match(challengeSchema, /bsb_game_challenge_players_user_idx/);
assert.match(challengeSchema, /expire_bsb_game_challenges_for_pair/);
assert.match(challengeSchema, /status in \('pending', 'accepted'\)/);
assert.match(challengeSchema, /create_bsb_game_challenge_players/);
assert.match(challengeSchema, /sync_bsb_game_challenge_state/);
assert.match(challengeSchema, /alter publication supabase_realtime add table public\.bsb_game_challenges/);
assert.match(challengeSchema, /alter publication supabase_realtime add table public\.bsb_game_challenge_players/);

assert.match(source, /function gameChallengesCard\(/);
assert.match(source, /function gameChallengePopup\(/);
assert.match(source, /id="gameChallengePopupDialog"/);
assert.match(source, /role="dialog"/);
assert.match(source, /aria-modal="true"/);
assert.match(source, />Maybe later</);
assert.match(source, /gameChallengePopupDismissedStorageKey/);
assert.match(source, /lw_dismissed_game_challenge_popups/);
assert.match(source, /id="\$\{controlId\("ChallengeQuietModeToggle"\)\}"/);
assert.match(source, /lw_challenge_quiet_mode/);
assert.match(source, /challengeQuietMode: state\.challengeQuietMode/);
assert.match(source, /state\.challengeQuietMode = typeof settings\.challengeQuietMode/);
assert.match(source, /function gameChallengeSetupCard\(/);
assert.match(source, /function liveGameChallengeScoreboard\(/);
assert.match(source, /challenge\.status === "accepted" && !challenge\.startedAt/);
assert.match(source, /const challengeSetupLock = waitingForLiveChallenge/);
assert.match(source, /End this live challenge for both players/);
assert.match(source, /\.channel\(`bsb-game-challenges-\$\{userId\}`\)/);
assert.match(source, /table: gameChallengeTable/);
assert.match(source, /table: gameChallengePlayerTable/);
assert.match(source, /withTriviaRandomSeed\(challenge\.seed, startTriviaGame\)/);
assert.match(source, /syncActiveChallengeProgress\(\{ completed: true \}\)/);
assert.match(styles, /\.game-challenges-card/);
assert.match(styles, /\.game-challenge-popup-overlay/);
assert.match(styles, /\.game-challenge-popup-actions/);
assert.match(styles, /\.challenge-setup-card/);
assert.match(styles, /\.live-challenge-scoreboard/);
assert.match(styles, /\.live-status-dot/);

console.log("Game challenge tests passed");
