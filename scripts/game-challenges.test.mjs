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
      startedAt: "2026-07-29T12:00:00.000Z",
    },
    {
      id: "complete",
      challengerId: "user-e",
      challengedId: "user-a",
      status: "completed",
    },
  ],
  gameChallengePlayers: {
    incoming: [
      { challengeId: "incoming", userId: "user-b", isHost: true, inviteStatus: "accepted" },
      { challengeId: "incoming", userId: "user-a", isHost: false, inviteStatus: "invited" },
    ],
    outgoing: [
      { challengeId: "outgoing", userId: "user-a", isHost: true, inviteStatus: "accepted" },
      { challengeId: "outgoing", userId: "user-c", isHost: false, inviteStatus: "invited" },
    ],
    live: [
      { challengeId: "live", userId: "user-a", score: 3, progress: 4, ready: true, inviteStatus: "accepted" },
      { challengeId: "live", userId: "user-d", score: 2, progress: 3, ready: true, inviteStatus: "accepted" },
      { challengeId: "live", userId: "user-f", score: 1, progress: 2, ready: true, inviteStatus: "accepted" },
    ],
    complete: [
      { challengeId: "complete", userId: "user-a", score: 5, progress: 5, inviteStatus: "accepted" },
      { challengeId: "complete", userId: "user-e", score: 4, progress: 5, inviteStatus: "accepted" },
    ],
  },
};

const pureContext = { state, Date };
vm.createContext(pureContext);
vm.runInContext(`
  const escapeHtml = (value) => String(value);
  ${extractFunction("normalizedGameChallenge")}
  ${extractFunction("normalizedGameChallengePlayer")}
  ${extractFunction("gameChallengePlayersFor")}
  ${extractFunction("gameChallengeOtherUserId")}
  ${extractFunction("gameChallengePlayer")}
  ${extractFunction("gameChallengeIsExpired")}
  ${extractFunction("gameChallengeCollections")}
  ${extractFunction("gameChallengeErrorMessage")}
  ${extractFunction("gameChallengePopupCandidates")}
  ${extractFunction("gameChallengePopupShouldInterrupt")}
  ${extractFunction("seededTriviaRandom")}
  ${extractFunction("gameChallengePlayerComparison")}
  ${extractFunction("gameChallengeRankedPlayers")}
  ${extractFunction("gameChallengePlayerRank")}
  ${extractFunction("gameChallengeResultLabel")}
  ${extractFunction("gameChallengeBookSprintElapsedMs")}
  ${extractFunction("activeGameChallenge")}
  ${extractFunction("triviaExitControl")}
  globalThis.normalizeChallenge = normalizedGameChallenge;
  globalThis.normalizePlayer = normalizedGameChallengePlayer;
  globalThis.otherUserId = gameChallengeOtherUserId;
  globalThis.player = gameChallengePlayer;
  globalThis.collections = gameChallengeCollections;
  globalThis.errorMessage = gameChallengeErrorMessage;
  globalThis.popupCandidates = gameChallengePopupCandidates;
  globalThis.popupShouldInterrupt = gameChallengePopupShouldInterrupt;
  globalThis.seededRandom = seededTriviaRandom;
  globalThis.resultLabel = gameChallengeResultLabel;
  globalThis.bookSprintElapsed = gameChallengeBookSprintElapsedMs;
  globalThis.exitControl = triviaExitControl;
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
    maxPlayers: 2,
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
assert.equal(
  pureContext.errorMessage({
    code: "PGRST202",
    message: "Could not find the function public.create_bsb_game_room in the schema cache",
  }),
  "Game rooms need the latest server update. Please try again after it is deployed.",
  "A missing multiplayer RPC must produce an actionable in-screen message",
);
assert.deepEqual(
  Array.from(pureContext.popupCandidates(
    [],
    state.gameChallenges,
    "user-a",
    {},
    state.gameChallengePlayers,
  ), (notice) => ({
    kind: notice.kind,
    challengeId: notice.challengeId,
    status: notice.status,
  })),
  [{ kind: "incoming", challengeId: "incoming", status: "invited" }],
  "Room invitations must surface when membership first loads",
);
assert.deepEqual(
  Array.from(pureContext.popupCandidates(
    [{ id: "reply", challengerId: "user-a", status: "pending" }],
    [{ id: "reply", challengerId: "user-a", status: "pending" }],
    "user-a",
    {
      reply: [{ challengeId: "reply", userId: "user-b", inviteStatus: "invited" }],
    },
    {
      reply: [{ challengeId: "reply", userId: "user-b", inviteStatus: "accepted" }],
    },
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
    [{ id: "reply", challengerId: "user-a", status: "pending" }],
    [{ id: "reply", challengerId: "user-a", status: "pending" }],
    "user-a",
    {
      reply: [{ challengeId: "reply", userId: "user-b", inviteStatus: "invited" }],
    },
    {
      reply: [{ challengeId: "reply", userId: "user-b", inviteStatus: "declined" }],
    },
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
    { userId: "user-a", score: 5, completedAt: "done", elapsedMs: 38000 },
    [
      { userId: "user-a", score: 5, completedAt: "done", elapsedMs: 38000 },
      { userId: "user-b", score: 5, completedAt: "done", elapsedMs: 41000 },
      { userId: "user-c", score: 4, completedAt: "done", elapsedMs: 35000 },
    ],
  ),
  "You finished #2 of 3",
  "Book Sprint standings must rank completed players by total time, not score",
);
assert.equal(
  pureContext.bookSprintElapsed(
    { startedAt: "2026-07-29T12:00:00.000Z" },
    { elapsedMs: null },
    Date.parse("2026-07-29T12:00:42.500Z"),
  ),
  42500,
  "An unfinished Book Sprint player must show total elapsed room time",
);
state.activeGameChallengeId = "live";
assert.match(
  pureContext.exitControl({ challengeId: "live", complete: false }),
  /data-game-challenge-action="end"[\s\S]*End challenge/,
  "The host must get a prominent end-challenge control during a live round",
);
state.authUser.id = "user-d";
assert.match(
  pureContext.exitControl({ challengeId: "live", complete: false }),
  /Live challenge in progress/,
  "A guest must not receive a control that locally drops them out of a running room",
);
state.authUser.id = "user-a";
assert.equal(
  pureContext.resultLabel(
    { gameType: "trivia" },
    { userId: "user-a", score: 5, completedAt: "done", elapsedMs: null },
    [
      { userId: "user-a", score: 5, completedAt: "done", elapsedMs: null },
      { userId: "user-b", score: 5, completedAt: "done", elapsedMs: 41000 },
      { userId: "user-c", score: 3, completedAt: "done", elapsedMs: 39000 },
    ],
  ),
  "You tied for #1 of 3",
);

const challengeSchema = schema.slice(
  schema.indexOf("create or replace function private.bsb_users_are_friends"),
  schema.indexOf("create table if not exists public.bsb_verse_of_day_cache"),
);
assert.match(challengeSchema, /create table if not exists public\.bsb_game_challenges/);
assert.match(challengeSchema, /create table if not exists public\.bsb_game_challenge_players/);
assert.match(challengeSchema, /alter table public\.bsb_game_challenges enable row level security/);
assert.match(challengeSchema, /alter table public\.bsb_game_challenge_players enable row level security/);
assert.match(challengeSchema, /max_players smallint not null default 2\s+check \(max_players between 2 and 10\)/);
assert.match(challengeSchema, /grant update \(status, responded_at\)/);
assert.match(challengeSchema, /grant update \(\s*invite_status,\s*responded_at,\s*score,\s*progress,\s*ready,\s*completed_at,\s*elapsed_ms/s);
assert.match(challengeSchema, /function private\.bsb_users_are_friends\(other_user_id uuid\)/);
assert.match(challengeSchema, /security definer/);
assert.match(challengeSchema, /\(select auth\.uid\(\)\) is not null/);
assert.match(challengeSchema, /"Friends can create game challenges"/);
assert.match(challengeSchema, /"Room members can read game challenges"/);
assert.match(challengeSchema, /"Hosts can cancel game rooms"/);
assert.match(challengeSchema, /"Room members can read challenge players"/);
assert.match(challengeSchema, /"Players can update own room state"/);
assert.match(challengeSchema, /"Hosts can invite room players"/);
assert.match(challengeSchema, /drop index if exists public\.bsb_game_challenges_active_pair_idx/);
assert.match(challengeSchema, /bsb_game_challenge_players_user_idx/);
assert.match(challengeSchema, /invite_status in \('invited', 'accepted', 'declined', 'left'\)/);
assert.match(challengeSchema, /validate_bsb_game_room_player_change/);
assert.match(challengeSchema, /Room membership is locked after the game starts/);
assert.match(challengeSchema, /player\.invite_status = 'invited'\s+and room\.status = 'pending'/);
assert.match(challengeSchema, /create_bsb_game_challenge_players/);
assert.match(challengeSchema, /sync_bsb_game_challenge_state/);
assert.match(challengeSchema, /create or replace function public\.create_bsb_game_room/);
assert.match(challengeSchema, /create or replace function public\.start_bsb_game_room/);
assert.match(challengeSchema, /At least two players must join before the game starts/);
assert.match(challengeSchema, /Game rooms support up to ten players/);
assert.match(challengeSchema, /Room members can receive game room realtime/);
assert.match(challengeSchema, /Room members can send game room realtime/);
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
assert.match(extractFunction("gameChallengeSetupCard"), /class="challenge-setup-status"/);
assert.match(extractFunction("gameChallengeSetupCard"), /role="status" aria-live="polite"/);
assert.doesNotMatch(
  extractFunction("gameChallengeSetupCard"),
  /Invitations? expire/,
  "The reusable setup card must not imply that an invitation is still active",
);
assert.match(source, /function gameRoomLobbyCard\(/);
assert.match(source, /function liveGameChallengeScoreboard\(/);
assert.match(source, /function refreshLiveGameChallengeScoreboard\(/);
assert.match(source, /data-live-book-sprint-running="true"/);
assert.match(source, /function triviaExitControl\(/);
assert.match(source, /data-game-challenge-action="end"/);
assert.match(source, /Invite up to 9 friends to a live room/);
assert.match(source, /data-challenge-friend=/);
assert.match(source, /data-game-challenge-action="start-room"/);
assert.match(source, /Players who have not answered do not block the room/);
assert.match(source, /const challengeSetupLock = waitingForLiveChallenge/);
assert.match(source, /End this live challenge for every player/);
assert.match(extractFunction("exitTriviaGame"), /The host ends a live challenge for everyone/);
assert.match(source, /gameChallengeLoadSequence/);
assert.match(source, /gameChallengeRefreshInFlight/);
assert.match(source, /previousPopupKey === gameChallengePopupNoticeKey/);
assert.match(source, /activeGameStayedOpen/);
assert.match(source, /game-challenge-popup-overlay open \$\{continuingPopup/);
assert.match(source, /\.channel\(`bsb-game-challenges-\$\{userId\}`\)/);
assert.match(source, /\.channel\(`bsb-game-room:\$\{challenge\.id\}`/);
assert.match(source, /table: gameChallengeTable/);
assert.match(source, /table: gameChallengePlayerTable/);
assert.match(source, /withTriviaRandomSeed\(challenge\.seed, \(\) => startTriviaGame\(\{ render: false \}\)\)/);
assert.match(source, /syncActiveChallengeProgress\(\{ completed: true \}\)/);
assert.match(styles, /\.game-challenges-card/);
assert.match(styles, /\.game-challenge-popup-overlay/);
assert.match(styles, /\.game-challenge-popup-actions/);
assert.match(styles, /\.challenge-setup-card/);
assert.match(styles, /\.challenge-setup-status/);
assert.match(styles, /\.challenge-friend-picker/);
assert.match(styles, /\.game-room-player-list/);
assert.match(styles, /\.live-challenge-scoreboard/);
assert.match(styles, /\.live-status-dot/);
assert.match(styles, /\.trivia-end-challenge/);
assert.match(styles, /\.game-challenge-popup-overlay\.continuing/);

console.log("Game challenge tests passed");
