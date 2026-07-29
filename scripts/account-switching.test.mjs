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

function snapshot(label) {
  return {
    settings: {
      themeMode: label,
      versions: ["BSB"],
      versionsUpdatedAt: "2026-07-28T12:00:00.000Z",
    },
    bookmarks: [`${label}:1`],
    notes: { [label]: `note-${label}` },
    highlights: { [label]: "yellow" },
    history: [{ ref: label, at: "2026-07-28T12:00:00.000Z" }],
    streak: { current: 1, best: 1, totalDays: 1, lastVisit: "2026-07-28", days: ["2026-07-28"] },
  };
}

const storage = new Map();
let liveSnapshot = snapshot("account-a");
const context = {
  accountDataOwnerStorageKey: "lw_account_data_owner",
  guestSnapshotStorageKey: "lw_guest_snapshot",
  accountSnapshotStoragePrefix: "lw_account_snapshot:",
  accountSessionStoragePrefix: "lw_account_session:",
  pendingAccountSwitchStorageKey: "lw_pending_account_switch",
  guestDataOwner: "guest",
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
  },
  normalizeCloudRow(value = {}) {
    return JSON.parse(JSON.stringify({
      settings: value.settings && typeof value.settings === "object" ? value.settings : {},
      bookmarks: Array.isArray(value.bookmarks) ? value.bookmarks : [],
      notes: value.notes && typeof value.notes === "object" ? value.notes : {},
      highlights: value.highlights && typeof value.highlights === "object" ? value.highlights : {},
      history: Array.isArray(value.history) ? value.history : [],
      streak: value.streak && typeof value.streak === "object" ? value.streak : {},
    }));
  },
  normalizeReadingStreak() {
    return { current: 0, best: 0, totalDays: 0, lastVisit: "", days: [] };
  },
  normalizedVersionsUpdatedAt(value) {
    return typeof value === "string" ? value : "";
  },
  captureCloudSnapshot() {
    return JSON.parse(JSON.stringify(liveSnapshot));
  },
};

vm.createContext(context);
vm.runInContext(`
  ${extractFunction("accountDataOwner")}
  ${extractFunction("setAccountDataOwner")}
  ${extractFunction("accountSnapshotStorageKey")}
  ${extractFunction("readBrowserSnapshot")}
  ${extractFunction("saveBrowserSnapshot")}
  ${extractFunction("guestBrowserSnapshot")}
  ${extractFunction("accountBrowserSnapshot")}
  ${extractFunction("saveSnapshotForOwner")}
  ${extractFunction("blankLocalSnapshot")}
  ${extractFunction("pendingAccountSwitch")}
  ${extractFunction("localSnapshotForAuthenticatedUser")}
  ${extractFunction("accountSessionStorageKey")}
  ${extractFunction("rememberedAccountSession")}
  ${extractFunction("rememberAuthenticatedSession")}
  ${extractFunction("removeRememberedAccountSession")}
  globalThis.snapshotForUser = localSnapshotForAuthenticatedUser;
  globalThis.savedSession = rememberedAccountSession;
  globalThis.rememberSession = rememberAuthenticatedSession;
  globalThis.removeSession = removeRememberedAccountSession;
`, context);

storage.set("lw_account_data_owner", "account-a");
storage.set("lw_pending_account_switch", "true");
storage.set("lw_account_snapshot:account-b", JSON.stringify(snapshot("account-b")));

const switchedToB = context.snapshotForUser("account-b");
assert.deepEqual([...switchedToB.bookmarks], ["account-b:1"]);
assert.deepEqual(
  JSON.parse(storage.get("lw_account_snapshot:account-a")).bookmarks,
  ["account-a:1"],
  "The outgoing account must be cached before another account is opened",
);

const newAccountDuringSwitch = context.snapshotForUser("account-c");
assert.deepEqual([...newAccountDuringSwitch.bookmarks], []);
assert.deepEqual({ ...newAccountDuringSwitch.notes }, {});
assert.deepEqual({ ...newAccountDuringSwitch.highlights }, {});
assert.deepEqual([...newAccountDuringSwitch.history], []);
assert.equal(
  newAccountDuringSwitch.settings.versionsUpdatedAt,
  "",
  "Device version timestamps must not override a new account during a switch",
);

liveSnapshot = snapshot("guest");
storage.set("lw_account_data_owner", "guest");
storage.delete("lw_pending_account_switch");
const firstSignIn = context.snapshotForUser("first-account");
assert.deepEqual([...firstSignIn.bookmarks], ["guest:1"], "First sign-in should retain intentional guest data");
assert.deepEqual(JSON.parse(storage.get("lw_guest_snapshot")).bookmarks, ["guest:1"]);

storage.set("lw_pending_account_switch", "true");
const newAccountAfterSwitch = context.snapshotForUser("new-account");
assert.deepEqual([...newAccountAfterSwitch.bookmarks], [], "Guest data must not leak into a newly switched account");

context.rememberSession({
  access_token: "access-b",
  refresh_token: "refresh-b",
  expires_at: 1785254400,
  user: { id: "account-b", email: "b@example.com" },
});
assert.deepEqual(
  { ...context.savedSession("account-b") },
  {
    userId: "account-b",
    access_token: "access-b",
    refresh_token: "refresh-b",
    expires_at: 1785254400,
    updatedAt: JSON.parse(storage.get("lw_account_session:account-b")).updatedAt,
  },
  "A remembered account should retain the token pair needed for one-click switching",
);
assert.doesNotMatch(storage.get("lw_account_session:account-b"), /password/i);
context.removeSession("account-b");
assert.equal(context.savedSession("account-b"), null);

const switchAccountSource = extractFunction("switchAccount");
assert.doesNotMatch(switchAccountSource, /signOutAccount|auth\.signOut/);
assert.match(switchAccountSource, /rememberCurrentAccountSession/);
assert.match(switchAccountSource, /state\.accountSwitching = true/);

const activateAccountSource = extractFunction("activateRememberedAccount");
assert.match(activateAccountSource, /auth\.setSession\(\{/);
assert.match(activateAccountSource, /savedSession\.access_token/);
assert.match(activateAccountSource, /savedSession\.refresh_token/);
assert.match(activateAccountSource, /previousSession\.access_token/);
assert.match(activateAccountSource, /removeRememberedAccountSession\(account\.userId\)/);
assert.match(activateAccountSource, /unlinkPushSubscriptionFromCurrentAccount/);
assert.doesNotMatch(activateAccountSource, /signInWithPassword|signInWithOAuth|signOut/);

const activatedSessions = [];
const cachedSessions = [];
const accountSwitchNotices = [];
const switchContext = {
  state: {
    authUser: { id: "account-a", email: "a@example.com" },
    authBusy: false,
    authMessage: "",
    syncMessage: "",
    syncStatus: "",
    accountSwitching: true,
    accountAddOpen: false,
  },
  createSupabaseClient() {
    return {
      auth: {
        async setSession(session) {
          activatedSessions.push({ ...session });
          return {
            data: {
              session: {
                ...session,
                user: { id: "account-b", email: "b@example.com" },
              },
            },
            error: null,
          };
        },
      },
    };
  },
  rememberedAccountSession() {
    return null;
  },
  async rememberCurrentAccountSession() {
    return {
      access_token: "access-a",
      refresh_token: "refresh-a",
      user: { id: "account-a", email: "a@example.com" },
    };
  },
  captureCloudSnapshot() {
    return snapshot("account-a");
  },
  saveSnapshotForOwner() {},
  setPendingAccountSwitch() {},
  clearTimeout() {},
  cloudSyncTimer: 0,
  async upsertCloudSnapshot() {},
  async unlinkPushSubscriptionFromCurrentAccount() {
    return true;
  },
  rememberAuthenticatedSession(session) {
    cachedSessions.push(session);
  },
  rememberAuthenticatedAccount() {},
  removeRememberedAccountSession() {},
  renderPreservingReaderScroll() {},
  showAccountSwitchNotification(user, destinationAccount) {
    accountSwitchNotices.push({ user, destinationAccount });
  },
  showToast() {},
  console,
};
vm.createContext(switchContext);
vm.runInContext(`${activateAccountSource}; globalThis.activate = activateRememberedAccount;`, switchContext);
await switchContext.activate(
  { userId: "account-b", email: "b@example.com" },
  { access_token: "access-b", refresh_token: "refresh-b" },
);
assert.deepEqual(activatedSessions, [{ access_token: "access-b", refresh_token: "refresh-b" }]);
assert.equal(switchContext.state.authUser.id, "account-b");
assert.equal(switchContext.state.accountSwitching, false);
assert.equal(cachedSessions.at(-1).user.id, "account-b");
assert.equal(accountSwitchNotices.at(-1).user.id, "account-b");
assert.equal(accountSwitchNotices.at(-1).destinationAccount.userId, "account-b");
assert.equal(accountSwitchNotices.at(-1).destinationAccount.email, "b@example.com");

const accountSwitchNotificationSource = extractFunction("accountSwitchNotification");
const showAccountSwitchNotificationSource = extractFunction("showAccountSwitchNotification");
assert.match(source, /const accountSwitchNoticeDurationMs = 2000/);
assert.match(accountSwitchNotificationSource, /role="status"/);
assert.match(accountSwitchNotificationSource, /aria-live="polite"/);
assert.match(accountSwitchNotificationSource, /Switched to/);
assert.match(accountSwitchNotificationSource, /socialProfileAvatarMarkup/);
assert.match(accountSwitchNotificationSource, /account-switch-fallback-avatar/);
assert.match(showAccountSwitchNotificationSource, /state\.accountOpen = false/);
assert.match(showAccountSwitchNotificationSource, /state\.socialProfile/);
assert.match(showAccountSwitchNotificationSource, /setTimeout\(\(\) =>/);
assert.match(showAccountSwitchNotificationSource, /accountSwitchNoticeDurationMs/);
assert.match(showAccountSwitchNotificationSource, /account-switch-indicator/);
assert.match(styles, /\.account-switch-indicator/);
assert.match(styles, /animation: account-switch-indicator 2000ms/);
assert.match(styles, /account-switch-indicator-reduced/);
assert.match(styles, /\.chapter-change-icon\.account-switch-icon\s*\{[^}]*position:\s*relative/);
assert.match(styles, /\.account-switch-avatar\s*\{[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*transform:\s*translate\(-50%, -50%\)/);
assert.match(styles, /\.account-switch-fallback-avatar\s*\{[^}]*top:\s*50%;[^}]*left:\s*50%;[^}]*transform:\s*translate\(-50%, -50%\)/);

let accountSwitchTimeout = null;
let accountSwitchTimeoutDelay = 0;
let accountSwitchIndicatorRemoved = false;
const notificationContext = {
  accountSwitchNotice: null,
  accountSwitchNoticeTimer: 0,
  accountSwitchNoticeDurationMs: 2000,
  state: { accountOpen: true, socialProfile: null },
  rememberedAccounts() {
    return [{ userId: "account-b", email: "b@example.com", username: "outgoing-profile" }];
  },
  clearTimeout() {},
  setTimeout(callback, delay) {
    accountSwitchTimeout = callback;
    accountSwitchTimeoutDelay = delay;
    return 17;
  },
  renderPreservingReaderScroll() {},
  document: {
    querySelector(selector) {
      assert.equal(selector, ".account-switch-indicator");
      return {
        remove() {
          accountSwitchIndicatorRemoved = true;
        },
      };
    },
  },
};
vm.createContext(notificationContext);
vm.runInContext(`
  ${showAccountSwitchNotificationSource}
  globalThis.showSwitchNotice = showAccountSwitchNotification;
  globalThis.currentSwitchNotice = () => accountSwitchNotice;
`, notificationContext);
notificationContext.showSwitchNotice(
  { id: "account-b", email: "b@example.com" },
  {
    userId: "account-b",
    email: "b@example.com",
    username: "destination-profile",
    displayName: "Destination Profile",
    avatarKey: "heart",
  },
);
assert.equal(notificationContext.state.accountOpen, false);
assert.equal(
  notificationContext.currentSwitchNotice().identity,
  "@destination-profile",
  "The switch notice must use the account the user selected, not stale remembered profile state",
);
assert.equal(notificationContext.currentSwitchNotice().avatarKey, "heart");
assert.equal(notificationContext.currentSwitchNotice().displayName, "Destination Profile");
notificationContext.state.socialProfile = {
  userId: "account-b",
  username: "destination-profile",
  displayName: "Fresh Profile",
  avatarKey: "star",
};
notificationContext.showSwitchNotice(
  { id: "account-b", email: "b@example.com" },
  {
    userId: "account-b",
    email: "b@example.com",
    username: "destination-profile",
    displayName: "Stale Profile",
    avatarKey: "heart",
  },
);
assert.equal(notificationContext.currentSwitchNotice().avatarKey, "star");
assert.equal(notificationContext.currentSwitchNotice().displayName, "Fresh Profile");

const notificationMarkupContext = {
  accountSwitchNotice: {
    identity: "@destination-profile",
    username: "destination-profile",
    displayName: "Destination Profile",
    avatarKey: "heart",
  },
  socialAvatarKeys: ["initials", "heart"],
  socialProfileAvatarMarkup(profile, className) {
    return `<span class="${className} avatar-${profile.avatarKey}"></span>`;
  },
  escapeHtml(value) {
    return String(value);
  },
  icons: { user: "<svg>generic-user</svg>" },
};
vm.createContext(notificationMarkupContext);
vm.runInContext(`
  ${accountSwitchNotificationSource}
  globalThis.renderSwitchNotice = accountSwitchNotification;
`, notificationMarkupContext);
const chosenAvatarNotice = notificationMarkupContext.renderSwitchNotice();
assert.match(chosenAvatarNotice, /account-switch-avatar avatar-heart/);
assert.doesNotMatch(chosenAvatarNotice, /generic-user/);
notificationMarkupContext.accountSwitchNotice.avatarKey = "";
const fallbackAvatarNotice = notificationMarkupContext.renderSwitchNotice();
assert.match(fallbackAvatarNotice, /account-switch-fallback-avatar/);
assert.match(fallbackAvatarNotice, /generic-user/);

assert.equal(accountSwitchTimeoutDelay, 2000);
assert.equal(typeof accountSwitchTimeout, "function");
accountSwitchTimeout();
assert.equal(notificationContext.currentSwitchNotice(), null);
assert.equal(accountSwitchIndicatorRemoved, true);

const signOutSource = extractFunction("signOutAccount");
assert.match(signOutSource, /upsertCloudSnapshot\(snapshot/);
assert.match(signOutSource, /removeRememberedAccountSession\(user\.id\)/);
assert.match(signOutSource, /auth\.signOut\(\{ scope: "local" \}\)/);
assert.ok(
  signOutSource.indexOf("upsertCloudSnapshot(snapshot") < signOutSource.indexOf('auth.signOut({ scope: "local" })'),
  "The active account should sync before its local session is closed",
);

const loadCloudSyncSource = extractFunction("loadCloudSync");
assert.match(loadCloudSyncSource, /localSnapshotForAuthenticatedUser\(userId\)/);
assert.match(loadCloudSyncSource, /setAccountDataOwner\(userId\)/);
assert.doesNotMatch(loadCloudSyncSource, /const localSnapshot = captureCloudSnapshot\(\)/);

const rememberAccountSource = extractFunction("rememberAuthenticatedAccount");
assert.doesNotMatch(rememberAccountSource, /password/i, "Remembered account metadata must never include a password");
assert.match(rememberAccountSource, /profile = null/);
assert.doesNotMatch(
  rememberAccountSource,
  /profile = state\.socialProfile/,
  "A new auth user must not inherit the outgoing account's profile",
);
let rememberedAccountWrite = null;
const rememberedProfileContext = {
  state: {
    authUser: { id: "account-a", email: "a@example.com" },
    socialProfile: { username: "outgoing-profile", displayName: "Outgoing" },
  },
  rememberedAccountLimit: 6,
  rememberedAccounts() {
    return [{
      userId: "account-b",
      email: "b@example.com",
      provider: "email",
      username: "destination-profile",
      displayName: "Destination",
      avatarKey: "initials",
      lastUsedAt: "2026-07-28T12:00:00.000Z",
    }];
  },
  normalizedRememberedAccount(account) {
    return account;
  },
  authProviderForUser() {
    return "email";
  },
  rememberedAccountsStorageKey: "lw_remembered_accounts",
  localStorage: {
    setItem(_key, value) {
      rememberedAccountWrite = JSON.parse(value);
    },
  },
};
vm.createContext(rememberedProfileContext);
vm.runInContext(`
  ${rememberAccountSource}
  globalThis.rememberAccount = rememberAuthenticatedAccount;
`, rememberedProfileContext);
rememberedProfileContext.rememberAccount({ id: "account-b", email: "b@example.com" });
assert.equal(rememberedAccountWrite[0].username, "destination-profile");
assert.equal(rememberedAccountWrite[0].displayName, "Destination");
const rememberSessionSource = extractFunction("rememberAuthenticatedSession");
assert.doesNotMatch(rememberSessionSource, /password/i, "Remembered sessions must never include a password");
assert.match(source, /id="\$\{suffix\}switchAccountButton"/);
assert.match(source, /rememberedAccountsCard\(prefix\)/);
assert.match(source, /Ready to switch/);
assert.match(source, /Your current account stays signed in while you choose another one/);
assert.match(source, /queryParams: \{ prompt: "select_account" \}/);
assert.match(styles, /\.remembered-account-use/);
assert.match(styles, /min-height: 44px/);

console.log("Account switching tests passed");
