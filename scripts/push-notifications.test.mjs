import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const app = fs.readFileSync(new URL("../assets/bible-app.js", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../assets/bible-app.css", import.meta.url), "utf8");
const schema = fs.readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const subscriptions = fs.readFileSync(
  new URL("../supabase/functions/push-subscriptions/index.ts", import.meta.url),
  "utf8",
);
const sender = fs.readFileSync(
  new URL("../supabase/functions/send-push-notifications/index.ts", import.meta.url),
  "utf8",
);

function namedFunctionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} should have a complete function body`);
}

assert.match(schema, /add column if not exists user_id uuid references auth\.users\(id\) on delete set null/);
assert.match(schema, /friend_request_notifications boolean not null default true/);
assert.match(schema, /game_challenge_notifications boolean not null default true/);
assert.match(schema, /challenge_accepted_notifications boolean not null default true/);
assert.match(schema, /create table if not exists public\.bsb_push_events/);
assert.match(schema, /alter table public\.bsb_push_events enable row level security/);
assert.match(schema, /revoke all on table public\.bsb_push_events from anon, authenticated/);
assert.match(schema, /bsb_push_events_delivery_idx/);
assert.match(schema, /bsb_push_events_friendship_idx/);
assert.match(schema, /bsb_push_events_challenge_idx/);
assert.match(schema, /create or replace function private\.enqueue_bsb_social_push_event/);
assert.match(schema, /after insert on public\.bsb_friendships/);
assert.match(schema, /after insert or update of invite_status on public\.bsb_game_challenge_players/);
assert.match(schema, /old\.invite_status = 'invited'[\s\S]+new\.invite_status = 'accepted'/);
assert.match(schema, /'game_challenge:' \|\| new\.challenge_id::text \|\| ':' \|\| new\.user_id::text/);

assert.match(subscriptions, /authenticatedUserId\(request, supabase\)/);
assert.match(subscriptions, /token\.startsWith\("sb_publishable_"\)/);
assert.match(subscriptions, /user_id: userId/);
assert.match(subscriptions, /action === "unlink-user"/);
assert.match(subscriptions, /friend_request_notifications: preferences\.friendRequestNotifications/);

assert.match(sender, /authenticatedActorId\(request, supabase\)/);
assert.match(sender, /sendSocialNotifications\(supabase, actorId, now\)/);
assert.match(sender, /event\.kind === "friend_request"/);
assert.match(sender, /event\.kind === "challenge_accepted"/);
assert.match(sender, /eventIsStillActionable/);
assert.match(sender, /challengePlayers\.get\(`\$\{event\.challenge_id\}:\$\{event\.recipient_id\}`\)\?\.invite_status === "invited"/);
assert.match(sender, /challengePlayers\.get\(`\$\{event\.challenge_id\}:\$\{event\.actor_id\}`\)\?\.invite_status === "accepted"/);
assert.match(sender, /joined your game room/);
assert.match(sender, /invited you to a game room/);
assert.match(sender, /social=friends&tab=requests/);
assert.match(sender, /social=challenges&challenge=/);
assert.match(sender, /\.eq\("actor_id", actorId\)/);
assert.match(sender, /status: "processing"/);
assert.match(sender, /status: "pending"/);
assert.match(sender, /status: "sent"/);

assert.match(app, /pushFriendRequestNotifications/);
assert.match(app, /pushGameChallengeNotifications/);
assert.match(app, /pushChallengeAcceptedNotifications/);
assert.match(app, /requestSocialPushDelivery/);
assert.match(app, /queueSocialPushDelivery\(\)/);
assert.match(app, /unlinkPushSubscriptionFromCurrentAccount/);
assert.match(app, /applySocialNotificationDeepLink/);
assert.match(app, /params\.get\("challenge"\)/);
assert.match(app, /Friend requests/);
assert.match(app, /openGameChallengeNotificationDestination\(challenge, player\)/);
assert.match(app, /gameChallengePopupNotice = \{[\s\S]+kind: "incoming"/);
assert.match(app, /Waiting room opened from your notification/);
assert.match(app, /not available for this account\. Try switching accounts/);
assert.match(styles, /\.push-social-options/);

const notificationDestination = vm.runInNewContext(
  `(${namedFunctionSource(app, "gameChallengeNotificationDestination")})`,
  { gameChallengeIsExpired: (challenge) => Boolean(challenge.expired) },
);
const acceptedPlayer = { inviteStatus: "accepted" };
const invitedPlayer = { inviteStatus: "invited" };
assert.equal(notificationDestination(null, null), "unavailable");
assert.equal(notificationDestination({ status: "pending" }, invitedPlayer), "invitation");
assert.equal(notificationDestination({ status: "pending" }, acceptedPlayer), "lobby");
assert.equal(notificationDestination({ status: "pending", expired: true }, acceptedPlayer), "ended");
assert.equal(notificationDestination({ status: "accepted", startedAt: "" }, acceptedPlayer), "lobby");
assert.equal(notificationDestination({ status: "accepted", startedAt: "2026-07-29T12:00:00Z" }, acceptedPlayer), "game");
assert.equal(notificationDestination({ status: "completed" }, acceptedPlayer), "results");
assert.equal(notificationDestination({ status: "cancelled" }, acceptedPlayer), "ended");

console.log("Push notification tests passed");
