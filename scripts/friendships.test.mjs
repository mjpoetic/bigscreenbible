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
  friendships: [
    { id: "accepted", requesterId: "user-a", addresseeId: "user-b", status: "accepted" },
    { id: "incoming", requesterId: "user-c", addresseeId: "user-a", status: "pending" },
    { id: "outgoing", requesterId: "user-a", addresseeId: "user-d", status: "pending" },
  ],
};

const pureContext = { state };
vm.createContext(pureContext);
vm.runInContext(`
  ${extractFunction("normalizedFriendship")}
  ${extractFunction("friendshipOtherUserId")}
  ${extractFunction("friendshipCollections")}
  ${extractFunction("friendshipForUser")}
  ${extractFunction("friendshipErrorMessage")}
  globalThis.normalizeFriendship = normalizedFriendship;
  globalThis.otherUserId = friendshipOtherUserId;
  globalThis.collections = friendshipCollections;
  globalThis.forUser = friendshipForUser;
  globalThis.errorMessage = friendshipErrorMessage;
`, pureContext);

assert.deepEqual(
  { ...pureContext.normalizeFriendship({
    id: "row-1",
    requester_id: "user-a",
    addressee_id: "user-b",
    status: "accepted",
    responded_at: "2026-07-28T12:00:00.000Z",
  }) },
  {
    id: "row-1",
    requesterId: "user-a",
    addresseeId: "user-b",
    status: "accepted",
    respondedAt: "2026-07-28T12:00:00.000Z",
    createdAt: "",
    updatedAt: "",
  },
);
assert.equal(pureContext.otherUserId(state.friendships[0]), "user-b");
assert.equal(pureContext.collections().friends.length, 1);
assert.equal(pureContext.collections().incoming[0].id, "incoming");
assert.equal(pureContext.collections().outgoing[0].id, "outgoing");
assert.equal(pureContext.forUser("user-c").id, "incoming");
assert.match(pureContext.errorMessage({ code: "23505" }), /already exists/);
assert.match(pureContext.errorMessage({ code: "42501" }), /not accepting/);

const writes = [];
const messages = [];
const toasts = [];
const actionState = {
  authUser: { id: "user-a" },
  friendshipActionBusyId: "",
  friendshipMessage: "",
};
const actionContext = {
  state: actionState,
  friendshipTable: "bsb_friendships",
  createSupabaseClient() {
    const builder = {
      insert(payload) {
        writes.push({ action: "insert", payload });
        return Promise.resolve({ error: null });
      },
      update(payload) {
        writes.push({ action: "update", payload });
        return this;
      },
      eq(column, value) {
        writes.push({ action: "eq", column, value });
        return this;
      },
      select() {
        return this;
      },
      async single() {
        return { data: { id: "incoming" }, error: null };
      },
    };
    return {
      from(table) {
        assert.equal(table, "bsb_friendships");
        return builder;
      },
    };
  },
  async authenticatedSupabaseSession() {
    return { user: { id: "user-a" } };
  },
  async finishFriendshipAction(message) {
    messages.push(message);
    actionState.friendshipActionBusyId = "";
  },
  queueSocialPushDelivery() {},
  friendshipErrorMessage(error) {
    return error?.message || "Friends could not be updated.";
  },
  renderPreservingReaderScroll() {},
  showToast(message) {
    toasts.push(message);
  },
  console,
  Date,
};
vm.createContext(actionContext);
vm.runInContext(`
  ${extractFunction("sendFriendRequest")}
  ${extractFunction("acceptFriendRequest")}
  globalThis.sendRequest = sendFriendRequest;
  globalThis.acceptRequest = acceptFriendRequest;
`, actionContext);

await actionContext.sendRequest("user-b");
assert.deepEqual({ ...writes[0], payload: { ...writes[0].payload } }, {
  action: "insert",
  payload: { requester_id: "user-a", addressee_id: "user-b" },
});
assert.deepEqual(messages, ["Friend request sent."]);
assert.equal(toasts[0], "Friend request sent");

await actionContext.acceptRequest("incoming");
const updateWrite = writes.find((write) => write.action === "update");
assert.equal(updateWrite.payload.status, "accepted");
assert.match(updateWrite.payload.responded_at, /^\d{4}-\d{2}-\d{2}T/);
assert.ok(writes.some((write) => write.action === "eq" && write.column === "addressee_id" && write.value === "user-a"));
assert.ok(writes.some((write) => write.action === "eq" && write.column === "status" && write.value === "pending"));
assert.deepEqual(messages, ["Friend request sent.", "Friend request accepted."]);

const friendshipSchema = schema.slice(
  schema.indexOf("create table if not exists public.bsb_friendships"),
  schema.indexOf("create table if not exists public.bsb_verse_of_day_cache"),
);
const friendshipSecuritySchema = schema.slice(
  schema.indexOf("create schema if not exists private"),
  schema.indexOf("create table if not exists public.bsb_verse_of_day_cache"),
);
const friendRequestInsertPolicy = friendshipSecuritySchema.slice(
  friendshipSecuritySchema.indexOf('drop policy if exists "Users can send permitted friend requests"'),
  friendshipSecuritySchema.indexOf('drop policy if exists "Recipients can accept pending requests"'),
);
assert.match(friendshipSchema, /alter table public\.bsb_friendships enable row level security/);
assert.match(friendshipSchema, /grant select, delete on table public\.bsb_friendships to authenticated/);
assert.match(friendshipSchema, /grant insert \(requester_id, addressee_id\)/);
assert.match(friendshipSchema, /grant update \(status, responded_at\)/);
assert.match(friendshipSchema, /least\(requester_id, addressee_id\)/);
assert.match(friendshipSchema, /greatest\(requester_id, addressee_id\)/);
assert.match(friendshipSchema, /requester_id <> addressee_id/);
assert.match(friendshipSecuritySchema, /function private\.bsb_profile_accepts_friend_requests\(target_user_id uuid\)/);
assert.match(friendshipSecuritySchema, /security definer/);
assert.match(friendshipSecuritySchema, /\(select auth\.uid\(\)\) is not null/);
assert.match(friendshipSecuritySchema, /target_profile\.is_discoverable/);
assert.match(friendshipSecuritySchema, /target_profile\.allow_friend_requests/);
assert.match(friendshipSecuritySchema, /revoke all on function private\.bsb_profile_accepts_friend_requests\(uuid\) from public, anon/);
assert.match(friendshipSecuritySchema, /grant execute on function private\.bsb_profile_accepts_friend_requests\(uuid\) to authenticated/);
assert.match(friendRequestInsertPolicy, /select private\.bsb_profile_accepts_friend_requests\(addressee_id\)/);
assert.doesNotMatch(friendRequestInsertPolicy, /from public\.bsb_profiles/);
assert.match(friendshipSchema, /"Recipients can accept pending requests"/);
assert.match(friendshipSchema, /and status = 'pending'/);
assert.match(friendshipSchema, /and status = 'accepted'/);
assert.match(friendshipSchema, /bsb_friendships_incoming_pending_idx/);
assert.match(friendshipSchema, /bsb_friendships_requester_accepted_idx/);
assert.match(friendshipSchema, /bsb_friendships_addressee_accepted_idx/);
assert.match(friendshipSchema, /relationship\.addressee_id = bsb_profiles\.user_id/);

assert.match(source, /function friendsCard\(/);
assert.match(source, /id="\$\{suffix\}friendSearchForm"/);
assert.match(source, /friendshipActionButton\("send"/);
assert.match(source, /friendshipActionButton\("accept"/);
assert.match(source, /friendshipActionButton\("decline"/);
assert.match(source, /friendshipActionButton\("cancel"/);
assert.match(source, /friendshipActionButton\("remove"/);
assert.match(source, /const accountPanelRerender = Boolean\(accountScrollState\)/);
assert.match(source, /accountPanelRerender \? "account-panel-rerender" : ""/);
assert.match(styles, /\.friends-tabs/);
assert.match(styles, /\.friend-person-row/);
assert.match(styles, /\.friend-search-form/);
assert.match(styles, /\.account-friend-request-badge/);
assert.match(styles, /\.account-popover\.open\.account-panel-rerender/);

const inviteId = "12345678-abcd-1234-abcd-123456789abc";
const pendingInvite = new Map();
let landingUrl = `https://bigscreenbible.com/?friend=${inviteId}&nativeLink=1`;
const inviteFilters = [];
const invitePopups = [];
const inviteProfile = { userId: inviteId, username: "inviter", allowFriendRequests: true };
const inviteState = {
  authUser: { id: "recipient" },
  socialProfile: { username: "recipient" },
  socialConsent: true,
  socialSafetyReady: true,
};
const inviteContext = vm.createContext({
  URL,
  state: inviteState,
  window: { location: { href: landingUrl } },
  history: { replaceState(_state, _title, href) { landingUrl = href; } },
  sessionStorage: {
    getItem: (key) => pendingInvite.get(key),
    setItem: (key, value) => pendingInvite.set(key, value),
    removeItem: (key) => pendingInvite.delete(key),
  },
  document: { getElementById: () => null },
  normalizeProfileUsername: (value) => value,
  normalizedSocialProfile: (value) => value,
  authenticatedSupabaseSession: async () => ({ user: inviteState.authUser }),
  socialProfileTable: "profiles",
  invitePopups,
  friendshipForUser: () => null,
  renderPreservingReaderScroll() {},
  createSupabaseClient() {
    return { from: () => ({
      select() { return this; },
      eq(key, value) { inviteFilters.push(["eq", key, value]); return this; },
      neq(key, value) { inviteFilters.push(["neq", key, value]); return this; },
      async limit(count) { assert.equal(count, 1); return { data: [inviteProfile] }; },
    }) };
  },
});
vm.runInContext(`
  ${source.slice(source.indexOf("const friendInviteStorageKey"), source.indexOf("\nasync function finishFriendshipAction"))}
  showFriendInviteOutcome = (...args) => invitePopups.push(friendInviteOutcome(...args));
  captureFriendInvite();
`, inviteContext);
assert.equal(landingUrl, "https://bigscreenbible.com/?nativeLink=1");
assert.equal(vm.runInContext("pendingFriendInvite()", inviteContext), inviteId);
await vm.runInContext('searchFriends(null, "quick", pendingFriendInvite())', inviteContext);
assert.deepEqual(inviteFilters, [
  ["eq", "is_discoverable", true],
  ["neq", "user_id", "recipient"],
  ["eq", "user_id", inviteId],
]);
assert.equal(inviteState.friendSearchResults[0], inviteProfile);
assert.equal(vm.runInContext("pendingFriendInvite()", inviteContext), "");

assert.equal(invitePopups[0].action, "Add Friend");
assert.equal(invitePopups[0].title, "Add @inviter as a friend?");
const outcome = (relationship, profile = inviteProfile) => vm.runInContext("friendInviteOutcome", inviteContext)(
  inviteId, profile, relationship, "recipient",
);
assert.equal(outcome({ status: "accepted" }).title, "You’re already friends");
assert.equal(outcome({ status: "pending", requesterId: "recipient" }).title, "Friend request already sent");
assert.equal(outcome({ status: "pending", requesterId: inviteId }).action, "Accept");
assert.equal(outcome(null, null).title, "This friend invite is unavailable");
assert.equal(outcome(null, { ...inviteProfile, allowFriendRequests: false }).title, "Friend requests are turned off");
assert.match(source, /data-friend-action="share-invite"[\s\S]*?<strong>My Friend QR<\/strong>/);
assert.match(source, /friendRequest[\s\S]*?data-game-challenge-popup-dismiss[^>]*>Maybe later/);

let pollQr;
let qrClosedWith;
let friendshipRefreshes = 0;
const priorPopup = { kind: "reply", challengeId: "game" };
const oldRequest = { id: "old", requesterId: "previous" };
const newRequest = { id: "new", requesterId: "scanner" };
let pendingRequests = [oldRequest];
let loadedRequests = pendingRequests;
const qrDialog = {
  open: true,
  addEventListener() {},
  close(value) { qrClosedWith = value; this.open = false; },
};
const qrWatchContext = vm.createContext({
  qrDialog,
  state: { authUser: { id: "recipient" } },
  canShareFriendInvite: () => true,
  document: { visibilityState: "visible" },
  window: { setTimeout(callback) { pollQr = callback; }, clearTimeout() {} },
  friendshipTable: "friendships",
  createSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq(column, value) {
          if (column === "addressee_id") {
            assert.equal(value, "recipient");
            return this;
          }
          assert.equal(column, "status");
          assert.equal(value, "pending");
          return Promise.resolve({ data: pendingRequests });
        },
      }),
    }),
  }),
  async loadFriendships() { friendshipRefreshes += 1; loadedRequests = pendingRequests; },
  friendshipCollections: () => ({ incoming: loadedRequests }),
  gameChallengePopupNotice: priorPopup,
  gameChallengePopupQueue: [],
  gameChallengePopupNoticeKey: (notice) => notice?.friendshipId || notice?.challengeId,
  gameChallengePopupNoticeIsValid: () => true,
  dismissedGameChallengePopups: () => new Set(),
  renderPreservingReaderScroll() {},
});
vm.runInContext(`
  ${extractFunction("showNewRequestOverFriendQr")}
  ${extractFunction("watchFriendQrRequests")}
  watchFriendQrRequests(qrDialog, "recipient");
`, qrWatchContext);
await new Promise(setImmediate);
assert.equal(qrDialog.open, true, "an existing request leaves the QR visible");
assert.equal(friendshipRefreshes, 0);
pendingRequests = [oldRequest, newRequest];
await pollQr();
assert.equal(friendshipRefreshes, 1);
assert.equal(qrClosedWith, "incoming-request");
assert.equal(qrWatchContext.gameChallengePopupNotice.friendshipId, "new");
assert.equal(qrWatchContext.gameChallengePopupNotice.fromFriendQr, true);
assert.equal(qrWatchContext.gameChallengePopupQueue[0], priorPopup);
await pollQr();
assert.equal(friendshipRefreshes, 1, "polling stops after the QR closes");
assert.match(source, /notice\.fromFriendQr \? friendshipActionButton\("decline", "Decline"/);

console.log("Friendship tests passed");
