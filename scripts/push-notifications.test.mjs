import assert from "node:assert/strict";
import fs from "node:fs";

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
assert.match(schema, /after insert or update of status on public\.bsb_game_challenges/);
assert.match(schema, /old\.status = 'pending'[\s\S]+new\.status = 'accepted'/);

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
assert.match(sender, /challengeStatus === "pending"/);
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
assert.match(styles, /\.push-social-options/);

console.log("Push notification tests passed");
