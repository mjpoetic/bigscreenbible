import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const avatarConstraintUpdate = readFileSync(new URL("../supabase/update-profile-avatar-options.sql", import.meta.url), "utf8");

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

const savedPayloads = [];
const toasts = [];
let draftAvatarKey = "book";
const expectedAvatarKeys = [
  "initials",
  "book",
  "sun",
  "flame",
  "bookmark",
  "quote",
  "cross",
  "heart",
  "star",
  "dove",
  "fish",
  "mountain",
  "leaf",
  "crown",
  "compass",
  "moon",
];
const state = {
  authUser: { id: "user-123", email: "private@example.com" },
  socialProfile: null,
  socialProfileDraft: null,
  socialProfileStatus: "ready",
  socialProfileMessage: "",
  socialProfileBusy: false,
  socialProfileOpen: true,
};

const profileRow = {
  user_id: "user-123",
  username: "reader_one",
  display_name: "Reader One",
  avatar_key: "book",
  is_discoverable: false,
  allow_friend_requests: true,
  created_at: "2026-07-28T12:00:00.000Z",
  updated_at: "2026-07-28T12:00:00.000Z",
};

const context = {
  state,
  socialProfileTable: "bsb_profiles",
  socialAvatarKeys: expectedAvatarKeys,
  captureSocialProfileDraft() {
    return {
      username: "reader_one",
      displayName: "Reader One",
      avatarKey: draftAvatarKey,
      isDiscoverable: false,
      allowFriendRequests: true,
    };
  },
  createSupabaseClient() {
    return {
      from(table) {
        assert.equal(table, "bsb_profiles");
        return {
          upsert(payload, options) {
            savedPayloads.push({ payload, options });
            return this;
          },
          select(columns) {
            assert.match(columns, /username/);
            return this;
          },
          async single() {
            return { data: { ...profileRow, avatar_key: draftAvatarKey }, error: null };
          },
        };
      },
    };
  },
  async authenticatedSupabaseSession() {
    return { user: { id: "user-123" } };
  },
  renderPreservingReaderScroll() {},
  rememberAuthenticatedAccount() {},
  showToast(message) {
    toasts.push(message);
  },
  console,
};

vm.createContext(context);
vm.runInContext(`
  ${extractFunction("normalizeProfileUsername")}
  ${extractFunction("socialProfileValidationMessage")}
  ${extractFunction("normalizedSocialProfile")}
  ${extractFunction("socialProfileDraft")}
  ${extractFunction("socialProfileErrorMessage")}
  ${extractFunction("saveSocialProfile")}
  globalThis.normalizeUsername = normalizeProfileUsername;
  globalThis.validateProfile = socialProfileValidationMessage;
  globalThis.profileError = socialProfileErrorMessage;
  globalThis.saveProfile = saveSocialProfile;
`, context);

assert.equal(context.normalizeUsername("  @Reader_One "), "reader_one");
assert.equal(context.validateProfile("reader_one", "Reader One"), "");
assert.match(context.validateProfile("2reader", ""), /beginning with a letter/);
assert.match(context.validateProfile("support", ""), /reserved/);
assert.match(context.validateProfile("reader", "x".repeat(41)), /40 characters/);
assert.equal(context.profileError({ code: "23505" }), "That username is already taken. Choose another.");

await context.saveProfile({ preventDefault() {} }, "quick");

assert.equal(savedPayloads.length, 1);
assert.deepEqual(
  { ...savedPayloads[0].payload },
  {
    user_id: "user-123",
    username: "reader_one",
    display_name: "Reader One",
    avatar_key: "book",
    is_discoverable: false,
    allow_friend_requests: true,
  },
);
assert.equal("email" in savedPayloads[0].payload, false, "Social profile writes must never include email");
assert.deepEqual({ ...savedPayloads[0].options }, { onConflict: "user_id" });
assert.equal(state.socialProfile.username, "reader_one");
assert.equal(state.socialProfile.isDiscoverable, false);
assert.equal(state.socialProfileDraft.displayName, "Reader One");
assert.equal(state.socialProfileDraft.avatarKey, "book");
assert.equal(state.socialProfileDraft.isDiscoverable, false);
assert.deepEqual(toasts, ["Social profile saved"]);

draftAvatarKey = "heart";
await context.saveProfile({ preventDefault() {} }, "quick");

assert.equal(savedPayloads.length, 2);
assert.equal(savedPayloads[1].payload.avatar_key, "heart", "Additional avatar choices must be sent to Supabase");
assert.equal(state.socialProfile.avatarKey, "heart", "The saved additional avatar must survive response normalization");
assert.equal(state.socialProfileDraft.avatarKey, "heart", "The saved additional avatar must remain selected");
assert.deepEqual(toasts, ["Social profile saved", "Social profile saved"]);

const profileSchema = schema.slice(
  schema.indexOf("create table if not exists public.bsb_profiles"),
  schema.indexOf("create table if not exists public.bsb_verse_of_day_cache"),
);
const profileTableDefinition = profileSchema.slice(0, profileSchema.indexOf("\n);") + 3);
assert.match(profileSchema, /alter table public\.bsb_profiles enable row level security/);
assert.match(profileSchema, /revoke all on table public\.bsb_profiles from anon, authenticated/);
assert.match(profileSchema, /grant select, insert, update on table public\.bsb_profiles to authenticated/);
assert.match(profileSchema, /using \(\(\(select auth\.uid\(\)\) = user_id\) or is_discoverable\)/);
assert.doesNotMatch(profileTableDefinition, /\bemail\b/i);
assert.match(profileSchema, /username ~ '\^\[a-z\]\[a-z0-9_\]\{2,19\}\$'/);
for (const avatarKey of expectedAvatarKeys) {
  assert.match(source, new RegExp(`key: "${avatarKey}"`), `Missing ${avatarKey} frontend avatar`);
  assert.match(profileSchema, new RegExp(`'${avatarKey}'`), `Missing ${avatarKey} database avatar`);
  assert.match(avatarConstraintUpdate, new RegExp(`'${avatarKey}'`), `Missing ${avatarKey} deployed constraint update`);
}
assert.match(profileSchema, /drop constraint if exists bsb_profiles_avatar_key_check/);
assert.match(profileSchema, /add constraint bsb_profiles_avatar_key_check/);
assert.match(avatarConstraintUpdate, /begin;/);
assert.match(avatarConstraintUpdate, /drop constraint if exists bsb_profiles_avatar_key_check/);
assert.match(avatarConstraintUpdate, /add constraint bsb_profiles_avatar_key_check/);
assert.match(avatarConstraintUpdate, /select pg_get_constraintdef\(oid\) as avatar_key_constraint/);

assert.match(source, /id="\$\{suffix\}socialProfileForm"/);
assert.match(source, /<details class="account-card social-profile-card"/);
assert.match(source, /data-social-profile-disclosure/);
assert.match(source, /state\.socialProfileOpen = !data/);
assert.match(source, /if \(creatingProfile\) state\.socialProfileOpen = false/);
assert.match(source, /Your email is never shown/);
assert.match(styles, /\.social-profile-card/);
assert.match(styles, /\.social-profile-summary/);
assert.match(styles, /details\.social-profile-card\[open\] \.social-profile-disclosure-icon/);
assert.match(styles, /\.social-avatar-options/);
assert.match(source, /data-profile-avatar-more/);
assert.match(source, /function openSocialAvatarPicker/);
assert.match(source, /role="dialog"/);
assert.match(styles, /\.social-avatar-picker-popup/);
assert.match(styles, /\.social-avatar-more-options/);
assert.match(styles, /\.social-profile-privacy/);

console.log("Social profile tests passed");
