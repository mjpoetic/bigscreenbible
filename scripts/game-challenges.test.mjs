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
pureContext.friendshipProfile = (userId) => ({ displayName: userId });
pureContext.socialProfileAvatarMarkup = (_profile, className) => `<span class="${className}"></span>`;
vm.createContext(pureContext);
vm.runInContext(`
  const escapeHtml = (value) => String(value).replaceAll("<", "&lt;");
  const liveChallengeStartDelay = 5000;
  ${extractFunction("isTimedGameChallenge")}
  ${extractFunction("normalizedGameChallenge")}
  ${extractFunction("normalizedGameChallengePlayer")}
  ${extractFunction("gameChallengePlayersFor")}
  ${extractFunction("gameChallengeOtherUserId")}
  ${extractFunction("gameChallengePlayer")}
  ${extractFunction("gameChallengeIsExpired")}
  ${extractFunction("gameChallengeCollections")}
  ${extractFunction("gameChallengeErrorMessage")}
  ${extractFunction("gameChallengeClosureNotice")}
  ${extractFunction("gameChallengePopupCandidates")}
  ${extractFunction("gameChallengePopupShouldInterrupt")}
  ${extractFunction("seededTriviaRandom")}
  ${extractFunction("gameChallengePlayerComparison")}
  ${extractFunction("gameChallengeRankedPlayers")}
  ${extractFunction("gameChallengePlayerRank")}
  ${extractFunction("gameChallengePlayerName")}
  ${extractFunction("gameChallengePodium")}
  ${extractFunction("gameChallengeAwaitingResults")}
  ${extractFunction("gameChallengeResultLabel")}
  ${extractFunction("liveGameElapsedFromStoredMs")}
  ${extractFunction("gameChallengeTimedElapsedMs")}
  ${extractFunction("challengeGameElapsedMs")}
  ${extractFunction("activeGameChallenge")}
  ${extractFunction("gameChallengeActionButton")}
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
  globalThis.bookSprintElapsed = gameChallengeTimedElapsedMs;
  globalThis.exitControl = triviaExitControl;
`, pureContext);

const podiumPlayers = [
  { userId: "user-a", score: 6, puzzleState: { points: 500 }, completedAt: "done", elapsedMs: 12000 },
  { userId: "Guest <B>", score: 5, puzzleState: { points: 900 }, completedAt: "done", elapsedMs: 11000 },
  { userId: "Guest C", score: 4, puzzleState: { points: 300 }, completedAt: "done", elapsedMs: 13000 },
  { userId: "Guest D", score: 3, puzzleState: { points: 100 }, completedAt: "done", elapsedMs: 14000 },
];
for (const gameType of ["trivia", "who-said-it", "verse-order", "reference-rush", "book-sprint", "word-search", "crossword", "hidden-word"]) {
  const room = { status: "completed", gameType };
  const ranked = pureContext.gameChallengeRankedPlayers(room, podiumPlayers);
  const podium = pureContext.gameChallengePodium(room, ranked);
  const scoreRanked = ["trivia", "who-said-it", "verse-order", "reference-rush"].includes(gameType);
  const firstPlace = scoreRanked ? "You" : "Guest &lt;B>";
  assert.match(podium, new RegExp(`First place</strong>[\\s\\S]*?game-podium-avatar[\\s\\S]*?<span>${firstPlace}</span>`));
  assert.match(podium, /Second place/);
  assert.match(podium, /Third place<\/strong>[\s\S]*?game-podium-avatar[\s\S]*?<span>Guest C<\/span>/);
  assert.doesNotMatch(podium, /Guest D/);
  for (const medal of ["🥇", "🥈", "🥉"]) assert.ok(podium.includes(medal));
  assert.equal(pureContext.gameChallengePodium({ ...room, status: "accepted" }, ranked), "");
  const finishedGame = { complete: true, challengeId: "room", type: gameType };
  assert.equal(pureContext.gameChallengeAwaitingResults(finishedGame, { ...room, id: "room", status: "accepted" }),
    !["book-sprint", "word-search", "crossword"].includes(gameType));
  assert.equal(pureContext.gameChallengeAwaitingResults(finishedGame, { ...room, id: "room" }), false);
}
const tiedPodium = pureContext.gameChallengePodium({ status: "completed", gameType: "trivia" }, [
  podiumPlayers[0],
  { ...podiumPlayers[1], score: podiumPlayers[0].score },
  podiumPlayers[2],
]);
assert.match(tiedPodium, /First place · Tie<\/strong>[\s\S]*?<span>You<\/span>[\s\S]*?<span>Guest &lt;B><\/span>/);
assert.doesNotMatch(tiedPodium, /Second place/);
assert.match(tiedPodium, /Third place/);
assert.doesNotMatch(pureContext.gameChallengePodium({ status: "completed", gameType: "trivia" }, podiumPlayers.slice(0, 2)), /Third place/);

vm.runInContext(extractFunction("arcadeScoreboard"), pureContext);
const personalScores = Array.from({ length: 5 }, (_, index) => ({ points: 500 - 100 * index, elapsedMs: 10000, achievedAt: index + 1 }));
const matchingSoloRound = pureContext.arcadeScoreboard(personalScores, "", () => "", "Personal scores", { ...personalScores[3] });
assert.equal((matchingSoloRound.match(/data-solo-result-spotlight/g) || []).length, 1);
assert.match(matchingSoloRound, /data-solo-result-spotlight><span[^>]*aria-label="Rank 4"/);
const outsideTopFive = pureContext.arcadeScoreboard(personalScores, "", () => "", "Personal scores", { points: 20, elapsedMs: 12000, achievedAt: 6 });
assert.match(outsideTopFive, /data-solo-result-spotlight><span[^>]*aria-label="Unranked"/);
assert.match(outsideTopFive, /This round/);

const socialResultsContext = vm.createContext({
  state: { authUser: { id: "self" }, socialProfile: {}, socialSafetyReady: true, socialConsent: true, socialAccessAllowed: true,
    gameSocialResultsOpen: false, gamesDrawerOpen: "social", mode: "trivia" },
  Date,
  accountDataOwner: () => "self",
  escapeHtml: String,
  gameChallengeCollections: () => ({ completed: [
    { id: "older-search", gameType: "word-search", completedAt: "2026-11-25T12:00:00Z" },
    { id: "crossword", gameType: "crossword", completedAt: "2026-11-26T12:00:00Z" },
    { id: "newer-search", gameType: "word-search", completedAt: "2026-11-27T12:00:00Z" },
  ] }),
  gameChallengeTitle: String,
  gameChallengeSummary: (room) => room.gameType,
  gameChallengeAcceptedPlayers: () => [{ userId: "self" }],
  gameChallengePlayerRank: () => 1,
  gameChallengePlayer: () => ({ userId: "self" }),
  gameChallengeActionButton: (_action, _label, room) => `<button data-room="${room.id}"></button>`,
});
for (const name of ["recentSocialGameResults", "keepOpenGamesDrawerOnAuthRefresh"]) vm.runInContext(extractFunction(name), socialResultsContext);
const wordSearchResults = socialResultsContext.recentSocialGameResults("word-search");
assert.doesNotMatch(wordSearchResults, /crossword|id="socialGameResults" open/);
assert.deepEqual([...wordSearchResults.matchAll(/data-room="([^"]+)"/g)].map((match) => match[1]), ["newer-search", "older-search"]);
assert.match(socialResultsContext.recentSocialGameResults("crossword"), /data-room="crossword"/);
const sameSession = { user: { id: "self" } };
assert.equal(socialResultsContext.keepOpenGamesDrawerOnAuthRefresh("SIGNED_IN", sameSession), true);
assert.equal(socialResultsContext.keepOpenGamesDrawerOnAuthRefresh("PASSWORD_RECOVERY", sameSession), false);
assert.equal(socialResultsContext.keepOpenGamesDrawerOnAuthRefresh("TOKEN_REFRESHED", { user: { id: "other" } }), false);
socialResultsContext.state.accountSwitching = true;
assert.equal(socialResultsContext.keepOpenGamesDrawerOnAuthRefresh("SIGNED_IN", sameSession), false);

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
    puzzle: null,
    rematchOf: "",
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
const rematchRoom = { id: "rematch", rematchOf: "complete", challengerId: "user-e", status: "accepted" };
const rematchRoster = { rematch: [{ userId: "user-a", inviteStatus: "accepted" }] };
assert.equal(pureContext.popupCandidates([], [rematchRoom], "user-a", {}, rematchRoster)[0].status, "rematch");

const popupContext = vm.createContext({
  state: { ...state, gameChallenges: [...state.gameChallenges, rematchRoom] },
  document: { getElementById: () => null },
  escapeHtml: String,
  icons: { trivia: "" },
  friendshipProfile: () => ({ displayName: "Friend" }),
  socialProfileAvatarMarkup: (_profile, className) => `<span class="${className}"></span>`,
  gameChallengeSummary: () => "Trivia",
  gameChallengePopupIsVisible: () => true,
  gameChallengePopupNoticeKey: () => "notice",
  gameChallengeAcceptedPlayers: () => [{ isHost: true }, { ready: true }],
});
vm.runInContext(extractFunction("gameRoomCanStart"), popupContext);
vm.runInContext(extractFunction("gameRoomAwaitingRematchReplies"), popupContext);
vm.runInContext(extractFunction("gameChallengePopup"), popupContext);
for (const [kind, status, challengeId, action, label] of [
  ["incoming", "invited", "incoming", "accept", "I’m ready"],
  ["reply", "accepted", "outgoing", "start-room", "Start game"],
  ["incoming", "rematch", "rematch", "join", "Join rematch"],
]) {
  popupContext.gameChallengePopupNotice = { kind, status, challengeId, actorUserId: "friend" };
  const markup = popupContext.gameChallengePopup();
  assert.equal(markup.includes("challenge-invite-sparks"), kind === "incoming");
  assert.match(markup, new RegExp(`data-game-challenge-action="${action}"[\\s\\S]*>${label}</button>`));
}
popupContext.gameChallengePopupNotice = { kind: "friend", status: "pending", friendshipId: "request", actorUserId: "friend" };
const friendPopup = popupContext.gameChallengePopup();
assert.match(friendPopup, /Friend sent you a friend request/);
assert.match(friendPopup, /friend-invite-spotlight/);
assert.doesNotMatch(friendPopup, /challenge-invite-sparks/);
assert.match(friendPopup, /data-friend-action="accept" data-friendship-id="request"/);
assert.match(friendPopup, /data-game-challenge-popup-dismiss[^>]*>Maybe later/);
for (const [roomStatus, inviteStatus, heading] of [
  ["pending", "invited", "Challenge cancelled"],
  ["accepted", "accepted", "Challenge ended"],
]) {
  const room = { id: "closed", challengerId: "user-b", status: roomStatus };
  const roster = { closed: [{ userId: "user-a", inviteStatus }] };
  const notices = pureContext.popupCandidates([room], [{ ...room, status: "cancelled" }], "user-a", roster, {});
  assert.equal(notices.length, 1);
  assert.equal(notices[0].kind, "closure");
  popupContext.gameChallengePopupNotice = notices[0];
  const markup = popupContext.gameChallengePopup();
  assert.match(markup, new RegExp(heading));
  assert.match(markup, /data-game-challenge-popup-dismiss[^>]*>Got it/);
  assert.equal(pureContext.popupCandidates([room], [], "user-a", roster, {}).length, 0);
}
vm.runInContext(extractFunction("gameChallengeActionButton"), popupContext);
vm.runInContext(extractFunction("gameChallengeDepartures"), popupContext);
const liveRoom = popupContext.state.gameChallenges.find((room) => room.id === "live");
const startingPlayers = state.gameChallengePlayers.live;
const departurePlayers = startingPlayers.map((player) => player.userId === "user-d"
  ? { ...player, inviteStatus: "left", respondedAt: "2026-07-29T12:00:03.000Z" } : player);
const groupDepartures = popupContext.gameChallengeDepartures(liveRoom, startingPlayers, departurePlayers, "user-a");
assert.equal(groupDepartures[0].headToHead, false);
const headToHead = popupContext.gameChallengeDepartures(liveRoom, startingPlayers.slice(0, 2), departurePlayers.slice(0, 2), "user-a");
assert.equal(headToHead[0].headToHead, true);
popupContext.gameChallengePopupNotice = headToHead[0];
const departurePopup = popupContext.gameChallengePopup();
assert.match(departurePopup, /Friend left the challenge/);
assert.match(departurePopup, /Continue game/);
assert.match(departurePopup, /data-game-challenge-action="end-solo"[\s\S]*End challenge/);
assert.equal(popupContext.gameChallengeDepartures(liveRoom, departurePlayers, departurePlayers, "user-a").length, 0);
const watchedRoom = { id: "room", status: "accepted", updatedAt: "before" };
let serverRoom = { status: "accepted", updated_at: "before" };
let refreshes = 0;
const roomPollQuery = {
  select: () => roomPollQuery,
  eq: () => roomPollQuery,
  maybeSingle: async () => ({ data: serverRoom, error: null }),
};
const roomPoll = vm.createContext({
  activeGameChallenge: () => watchedRoom,
  activeGameRoomCheckInFlight: false,
  gameChallengeRefreshInFlight: false,
  gameChallengeTable: "rooms",
  document: { visibilityState: "visible" },
  createSupabaseClient: () => ({ from: () => roomPollQuery }),
  refreshGameChallengesFromRealtime: async () => { refreshes++; },
});
vm.runInContext(extractFunction("checkActiveGameRoom"), roomPoll);
await roomPoll.checkActiveGameRoom();
assert.equal(refreshes, 0);
serverRoom = { status: "cancelled", updated_at: "after" };
await roomPoll.checkActiveGameRoom();
assert.equal(refreshes, 1, "A missed Realtime closure must trigger a full room refresh");
serverRoom = null;
await roomPoll.checkActiveGameRoom();
assert.equal(refreshes, 2, "A room that becomes unreadable must also trigger a refresh");

const lobby = state.gameChallenges.find((challenge) => challenge.id === "outgoing");
const host = { userId: "user-a", isHost: true, inviteStatus: "accepted" };
const guest = { userId: "user-c", ready: true, inviteStatus: "accepted" };
let roster = [host, guest];
let relationship = { status: "accepted" };
let discoverable = true;
const lobbyContext = vm.createContext({
  state: { authUser: { id: host.userId }, gameRoomOnlineUserIds: [] },
  gameChallengePlayersFor: () => roster,
  gameChallengePlayer: () => guest,
  gameChallengeFriends: () => [{ userId: "user-d", profile: { displayName: "New friend" } }],
  socialProfileAvatarMarkup: () => "",
  friendshipForUser: () => relationship,
  friendshipProfile: (userId) => ({ userId, displayName: "Joined friend", allowFriendRequests: true, isDiscoverable: discoverable }),
  friendshipActionButton: (action, label) => `<button data-friend-action="${action}">${label}</button>`,
  gameChallengeTitle: () => "Trivia",
  escapeHtml: String,
});
for (const name of ["gameRoomCanStart", "gameRoomAwaitingRematchReplies", "gameChallengeActionButton", "gameRoomRosterButton", "gameRoomFriendshipControl", "gameRoomLobbyPlayer", "gameFriendSearchMarkup", "gameFriendSearchAttributes", "gameRoomLobbyCard"]) {
  vm.runInContext(extractFunction(name), lobbyContext);
}
const hostMarkup = lobbyContext.gameRoomLobbyCard(lobby);
assert.match(hostMarkup, /data-game-challenge-action="start-room"[^>]*>Start game/);
assert.doesNotMatch(hostMarkup, /disabled/);
assert.match(hostMarkup, /data-game-challenge-action="cancel"/);
assert.match(hostMarkup, /data-game-challenge-action="remove"[^>]*aria-label="Remove Joined friend"/);
assert.match(hostMarkup, /data-game-challenge-action="invite"[^>]*aria-label="Invite New friend"[^>]*>Invite<\/button>/);
assert.match(hostMarkup, /✓ Friends/);
assert.match(hostMarkup, /8 spots open/);
assert.match(hostMarkup, /type="search" aria-label="Search friends"/);

const friendRows = [
  { dataset: { gameFriendName: "José Rivera", gameFriendUsername: "jrivera" }, selected: true },
  { dataset: { gameFriendName: "Jo Park", gameFriendUsername: "jopark" } },
];
const searchStatus = {};
const searchInput = {
  value: "",
  closest: () => ({ querySelectorAll: () => friendRows, querySelector: () => searchStatus }),
  addEventListener(type, listener) {
    assert.equal(type, "input");
    this.update = listener;
  },
};
lobbyContext.document = { getElementById: () => searchInput };
vm.runInContext(extractFunction("bindGameFriendSearch"), lobbyContext);
lobbyContext.bindGameFriendSearch();
for (const [query, hidden] of [
  ["  JOSE   RI ", [false, true]],
  ["@JOP", [true, false]],
  ["missing", [true, true]],
  ["", [false, false]],
]) {
  searchInput.value = query;
  searchInput.update();
  assert.deepEqual(friendRows.map((row) => row.hidden), hidden);
  assert.equal(lobbyContext.state.gameFriendSearchQuery, query);
  assert.equal(searchStatus.textContent, hidden.every(Boolean) ? "No friends match your search." : "");
  assert.equal(friendRows[0].selected, true);
}

relationship = null;
assert.match(lobbyContext.gameRoomLobbyCard(lobby), /data-friend-action="send">Add friend/);
discoverable = false;
assert.doesNotMatch(lobbyContext.gameRoomLobbyCard(lobby), /data-friend-action="send"/);
relationship = { status: "pending", requesterId: guest.userId };
assert.match(lobbyContext.gameRoomLobbyCard(lobby), /data-friend-action="accept"/);
relationship.requesterId = host.userId;
assert.match(lobbyContext.gameRoomLobbyCard(lobby), /Request sent/);
roster = [host, guest, ...Array.from({ length: 8 }, (_, index) => ({ userId: `extra-${index}`, inviteStatus: "invited" }))];
assert.doesNotMatch(lobbyContext.gameRoomLobbyCard(lobby), /data-game-challenge-action="invite"/);
roster = [host, guest];
roster.push({ userId: "invitee", inviteStatus: "invited" });
const rematchMarkup = lobbyContext.gameRoomLobbyCard({ ...lobby, rematchOf: "prior" });
assert.match(rematchMarkup, /Waiting for everyone to respond to the rematch/);
assert.match(rematchMarkup, /data-game-challenge-action="start-room"[^>]*disabled/);
assert.doesNotMatch(rematchMarkup, /data-game-challenge-action="invite"/);
roster.pop();
assert.match(source, /id="challengeFriendForGame"[\s\S]*<span>Challenge a friend<\/span>/);
lobbyContext.state.authUser.id = guest.userId;
const guestMarkup = lobbyContext.gameRoomLobbyCard(lobby);
assert.doesNotMatch(guestMarkup, /Invite more players/);
assert.match(guestMarkup, /role="status"[\s\S]*loading-spinner[\s\S]*Waiting for the host to start the game/);
assert.match(guestMarkup, /data-game-challenge-action="leave"/);
guest.ready = false;
assert.match(lobbyContext.gameRoomLobbyCard(lobby), /data-game-challenge-action="ready"/);
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
  37500,
  "An unfinished timed player must show elapsed play time after the countdown",
);
assert.equal(pureContext.bookSprintElapsed({}, { elapsedMs: 173000 }), 168000, "2:53 stored is 2:48 of play");
assert.equal(pureContext.bookSprintElapsed({ startedAt: "2026-07-29T12:00:00Z" }, null, Date.parse("2026-07-29T12:00:03Z")), 0);
state.activeGameChallengeId = "live";
assert.equal(pureContext.challengeGameElapsedMs({
  challengeId: "live", complete: true, finishedAt: Date.parse(state.gameChallenges.find(({ id }) => id === "live").startedAt) + 173000,
}), 173000, "Save the actual finish instant in the existing room-timestamp format");
assert.match(
  pureContext.exitControl({ challengeId: "live", complete: false }),
  /data-game-challenge-action="end"[\s\S]*End challenge/,
  "The host must get a prominent end-challenge control during a live round",
);
state.authUser.id = "user-d";
assert.match(
  pureContext.exitControl({ challengeId: "live", complete: false }),
  /data-game-challenge-action="leave"[\s\S]*Leave challenge/,
  "A guest can leave a running room",
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
assert.match(source, /data-live-game-running="true"/);
assert.match(source, /function triviaExitControl\(/);
assert.match(source, /data-game-challenge-action="end"/);
assert.match(source, /Invite up to 9 friends to a live room/);
assert.match(source, /data-challenge-friend=/);
assert.match(source, /data-game-challenge-action="start-room"/);
assert.match(source, /Start becomes available when a friend joins ready to play/);
assert.match(source, /const challengeSetupLock = waitingForLiveChallenge/);
assert.match(source, /End this live challenge for every player/);
assert.match(extractFunction("exitTriviaGame"), /exitGameChallengeRoom/);
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

const room = { id: "countdown-room", status: "accepted", startedAt: "2026-11-21T12:00:00Z", gameType: "trivia" };
const serverStart = Date.parse(room.startedAt);
const expectedStart = serverStart + 5000;

function countdownClient(userId, receiptTime) {
  let now = receiptTime;
  let scheduled;
  let timerCount = 0;
  let dialogs = 0;
  let markup;
  const started = [];
  const number = { textContent: "" };
  const rendered = [];
  const state = { authUser: { id: userId }, mode: "trivia", gamesDrawerOpen: "social" };
  const context = vm.createContext({
    state,
    room: { ...room },
    Date: { now: () => now, parse: Date.parse },
    document: {
      getElementById: () => null,
      body: { append() { dialogs += 1; } },
      createElement: () => ({
        dataset: {},
        setAttribute() {},
        addEventListener() {},
        showModal() {
          assert.equal(state.gamesDrawerOpen, "");
          assert.equal(state.triviaGame.challengeId, room.id);
          assert.equal(rendered.at(-1)?.drawer, "");
          markup = this.innerHTML;
        },
        remove() { dialogs -= 1; },
        querySelector: (selector) => selector === "strong" ? number : {},
      }),
    },
    window: {
      setTimeout(callback, delay) { scheduled = { callback, at: now + delay }; return ++timerCount; },
      clearTimeout() { scheduled = null; },
    },
    activeGameChallenge: () => context.room,
    startLoadedGameChallenge(challenge, options) {
      started.push([challenge.id, options.startsAt, now]);
      state.gamesDrawerOpen = "";
      state.triviaGame = { challengeId: challenge.id };
    },
    playGameCountdownTone() {},
    gameChallengeTitle: () => "Trivia",
    renderPreservingReaderScroll() { rendered.push({ drawer: state.gamesDrawerOpen }); },
  });
  vm.runInContext(`
    ${source.slice(source.indexOf("const liveChallengeStartDelay"), source.indexOf("function animateSocialPopupExit"))}
    openStartedGameChallenge(room);
  `, context);
  return {
    number, started, context,
    get dialogs() { return dialogs; },
    get markup() { return markup; },
    advance(time) {
      while (scheduled && scheduled.at <= time) {
        now = scheduled.at;
        const { callback } = scheduled;
        scheduled = null;
        callback();
      }
      now = time;
    },
  };
}

const hostCountdown = countdownClient("host", serverStart + 200);
const guestCountdown = countdownClient("guest", serverStart + 2400);
assert.equal(hostCountdown.number.textContent, "Ready?");
assert.equal(guestCountdown.number.textContent, "3");
assert.doesNotMatch(hostCountdown.markup, /<button/);
vm.runInContext("openStartedGameChallenge(room)", hostCountdown.context);
assert.equal(hostCountdown.dialogs, 1, "room refreshes keep the same countdown");
for (const [offset, label] of [[3000, "2"], [4000, "1"]]) {
  hostCountdown.advance(serverStart + offset);
  guestCountdown.advance(serverStart + offset);
  assert.equal(hostCountdown.number.textContent, label);
  assert.equal(guestCountdown.number.textContent, label);
}
hostCountdown.advance(expectedStart);
guestCountdown.advance(expectedStart);
assert.deepEqual(hostCountdown.started, [[room.id, expectedStart, serverStart + 200]]);
assert.deepEqual(guestCountdown.started, [[room.id, expectedStart, serverStart + 2400]]);
assert.equal(hostCountdown.context.state.triviaGame.countdownStartedAt, undefined);
assert.equal(guestCountdown.context.state.triviaGame.countdownStartedAt, undefined);
assert.equal(guestCountdown.dialogs, 0);
const late = countdownClient("late", expectedStart + 100);
assert.equal(late.dialogs, 0);
assert.deepEqual(late.started, [[room.id, expectedStart, expectedStart + 100]]);
const cancelled = countdownClient("guest", serverStart + 500);
cancelled.context.room.status = "cancelled";
cancelled.advance(expectedStart);
assert.equal(cancelled.dialogs, 0);
assert.equal(cancelled.context.state.triviaGame.countdownStartedAt, serverStart + 500);

console.log("Game challenge tests passed");
