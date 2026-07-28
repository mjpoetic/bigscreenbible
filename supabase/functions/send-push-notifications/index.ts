// @deno-types="npm:@types/web-push@3.6.4"
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.110.1";
import { dueNotifications, type PushSchedule } from "./schedule.ts";

const subscriptionTable = "bsb_push_subscriptions";
const eventTable = "bsb_push_events";
const siteUrl = "https://bigscreenbible.com";

type DatabaseClient = ReturnType<typeof databaseClient>;

type SubscriptionRow = PushSchedule & {
  id: string;
  user_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  friend_request_notifications: boolean;
  game_challenge_notifications: boolean;
  challenge_accepted_notifications: boolean;
};

type VerseRow = {
  reference: string | null;
  verse_text: string | null;
};

type PushEventRow = {
  id: string;
  recipient_id: string;
  actor_id: string;
  kind: "friend_request" | "game_challenge" | "challenge_accepted";
  friendship_id: string | null;
  challenge_id: string | null;
  status: "pending" | "processing";
  attempts: number;
  claimed_at: string | null;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  username: string | null;
  display_name: string | null;
};

type ChallengeRow = {
  id: string;
  game_type: string;
  round_count: number;
  status: string;
};

type FriendshipRow = {
  id: string;
  status: string;
};

function allowedOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && ["bigscreenbible.com", "www.bigscreenbible.com"].includes(url.hostname)) return true;
    return url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin) ? origin : "https://bigscreenbible.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-push-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function databaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase server credentials are not configured");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function morningPayload(verse: VerseRow | null) {
  const reference = String(verse?.reference || "").trim();
  const verseText = String(verse?.verse_text || "").replace(/\s+/g, " ").trim();
  const body = verseText.length > 180 ? `${verseText.slice(0, 177).trimEnd()}…` : verseText;
  return {
    title: reference ? `Verse of the Day · ${reference}` : "Your Verse of the Day",
    body: body || "Begin the day with a quiet moment in Scripture.",
    url: reference
      ? `${siteUrl}/?ref=${encodeURIComponent(reference)}&mode=big`
      : `${siteUrl}/?mode=big`,
    tag: "bsb-verse-of-the-day",
    kind: "morning",
  };
}

function eveningPayload() {
  return {
    title: "A quiet moment for Scripture",
    body: "You haven’t opened Big Screen Bible today. Take a few minutes to read.",
    url: `${siteUrl}/?mode=reader`,
    tag: "bsb-evening-reminder",
    kind: "evening",
  };
}

function pushStatusCode(error: unknown) {
  if (!error || typeof error !== "object") return 0;
  const value = (error as { statusCode?: unknown }).statusCode;
  return typeof value === "number" ? value : 0;
}

function verseCacheDate(date = new Date()) {
  const adjusted = new Date(date.getTime() - 2 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(adjusted);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function gameTitle(gameType: string) {
  return ({
    trivia: "Bible Trivia",
    "verse-order": "Verse Order",
    "reference-rush": "Reference Rush",
    "book-sprint": "Book Sprint",
    "who-said-it": "Who Said It?",
  } as Record<string, string>)[gameType] || "Bible game";
}

function actorName(profile: ProfileRow | undefined) {
  return String(profile?.display_name || (profile?.username ? `@${profile.username}` : "") || "A friend");
}

function socialPayload(
  event: PushEventRow,
  profile: ProfileRow | undefined,
  challenge: ChallengeRow | undefined,
) {
  const name = actorName(profile);
  if (event.kind === "friend_request") {
    return {
      title: "New friend request",
      body: `${name} sent you a friend request.`,
      url: `${siteUrl}/?social=friends&tab=requests`,
      tag: `bsb-friend-request-${event.friendship_id}`,
      kind: event.kind,
    };
  }
  const title = gameTitle(challenge?.game_type || "");
  if (event.kind === "challenge_accepted") {
    return {
      title: `${name} accepted your challenge`,
      body: `${title} is ready when you are.`,
      url: `${siteUrl}/?social=challenges&challenge=${encodeURIComponent(event.challenge_id || "")}`,
      tag: `bsb-challenge-accepted-${event.challenge_id}`,
      kind: event.kind,
    };
  }
  const rounds = Number(challenge?.round_count || 0);
  return {
    title: `${name} challenged you`,
    body: rounds ? `${title} · ${rounds} rounds` : title,
    url: `${siteUrl}/?social=challenges&challenge=${encodeURIComponent(event.challenge_id || "")}`,
    tag: `bsb-game-challenge-${event.challenge_id}`,
    kind: event.kind,
  };
}

function subscriptionAllowsEvent(subscription: SubscriptionRow, event: PushEventRow) {
  if (event.kind === "friend_request") return subscription.friend_request_notifications;
  if (event.kind === "game_challenge") return subscription.game_challenge_notifications;
  return subscription.challenge_accepted_notifications;
}

function eventIsStillActionable(
  event: PushEventRow,
  friendships: Map<string, FriendshipRow>,
  challenges: Map<string, ChallengeRow>,
) {
  if (event.kind === "friend_request") {
    return friendships.get(event.friendship_id || "")?.status === "pending";
  }
  const challengeStatus = challenges.get(event.challenge_id || "")?.status;
  if (event.kind === "game_challenge") return challengeStatus === "pending";
  return challengeStatus === "accepted" || challengeStatus === "completed";
}

async function sendToSubscription(subscription: SubscriptionRow, payload: Record<string, unknown>) {
  await webpush.sendNotification({
    endpoint: subscription.endpoint,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  }, JSON.stringify(payload), { TTL: 86_400, urgency: "normal" });
}

async function authenticatedActorId(request: Request, supabase: DatabaseClient) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return data.user.id;
}

async function loadMorningVerse(supabase: DatabaseClient, now: Date) {
  const { data, error } = await supabase.from("bsb_verse_of_day_cache")
    .select("reference, verse_text")
    .eq("status", "ready")
    .eq("cache_date", verseCacheDate(now))
    .maybeSingle<VerseRow>();
  if (error) console.warn("[Push sender] Verse lookup failed", error.message);
  if (data) return data;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/verse-of-the-day`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.reference && payload.verseText) {
      return { reference: payload.reference, verse_text: payload.verseText } as VerseRow;
    }
  } catch (error) {
    console.warn("[Push sender] Verse refresh failed", error instanceof Error ? error.message : error);
  }
  return null;
}

async function sendDailyNotifications(supabase: DatabaseClient, now: Date) {
  const { data: rows, error: rowsError } = await supabase.from(subscriptionTable)
    .select("id, user_id, endpoint, p256dh, auth, timezone, morning_time, evening_enabled, evening_time, last_opened_at, last_morning_sent_on, last_evening_sent_on, friend_request_notifications, game_challenge_notifications, challenge_accepted_notifications")
    .eq("enabled", true)
    .order("updated_at", { ascending: true })
    .limit(2000);
  if (rowsError) throw rowsError;

  const due = (rows as SubscriptionRow[] || []).flatMap((row) =>
    dueNotifications(row, now).map((notification) => ({ row, notification }))
  );
  const verse = due.some(({ notification }) => notification.kind === "morning")
    ? await loadMorningVerse(supabase, now)
    : null;
  let sent = 0;
  let skipped = 0;
  let expired = 0;
  let failed = 0;

  for (const { row, notification } of due) {
    const sentColumn = notification.kind === "morning" ? "last_morning_sent_on" : "last_evening_sent_on";
    const currentValue = notification.kind === "morning" ? row.last_morning_sent_on : row.last_evening_sent_on;
    let claimQuery = supabase.from(subscriptionTable)
      .update({ [sentColumn]: notification.localDate })
      .eq("id", row.id)
      .eq("enabled", true);
    claimQuery = currentValue === null ? claimQuery.is(sentColumn, null) : claimQuery.eq(sentColumn, currentValue);
    const { data: claimed, error: claimError } = await claimQuery.select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) {
      skipped += 1;
      continue;
    }

    try {
      await sendToSubscription(row, notification.kind === "morning" ? morningPayload(verse) : eveningPayload());
      sent += 1;
    } catch (error) {
      const statusCode = pushStatusCode(error);
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from(subscriptionTable).delete().eq("id", row.id);
        expired += 1;
        continue;
      }
      await supabase.from(subscriptionTable)
        .update({ [sentColumn]: currentValue })
        .eq("id", row.id)
        .eq(sentColumn, notification.localDate);
      failed += 1;
      console.error("[Push sender] Daily delivery failed", row.id, statusCode || "unknown status");
    }
  }

  return { checked: rows?.length || 0, due: due.length, sent, skipped, expired, failed };
}

async function loadSocialEvents(supabase: DatabaseClient, actorId: string | null, now: Date) {
  const columns = "id, recipient_id, actor_id, kind, friendship_id, challenge_id, status, attempts, claimed_at, created_at";
  let pendingQuery = supabase.from(eventTable)
    .select(columns)
    .eq("status", "pending")
    .lte("available_at", now.toISOString())
    .order("created_at", { ascending: true })
    .limit(100);
  if (actorId) pendingQuery = pendingQuery.eq("actor_id", actorId);
  const { data: pending, error: pendingError } = await pendingQuery;
  if (pendingError) throw pendingError;

  const staleBefore = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  let staleQuery = supabase.from(eventTable)
    .select(columns)
    .eq("status", "processing")
    .lt("claimed_at", staleBefore)
    .order("created_at", { ascending: true })
    .limit(100);
  if (actorId) staleQuery = staleQuery.eq("actor_id", actorId);
  const { data: stale, error: staleError } = await staleQuery;
  if (staleError) throw staleError;

  const unique = new Map<string, PushEventRow>();
  [...(pending || []), ...(stale || [])].forEach((event) => unique.set(event.id, event as PushEventRow));
  return [...unique.values()].slice(0, 100);
}

async function claimSocialEvent(supabase: DatabaseClient, event: PushEventRow, now: Date) {
  let query = supabase.from(eventTable)
    .update({
      status: "processing",
      attempts: Math.min(20, event.attempts + 1),
      claimed_at: now.toISOString(),
      last_error: null,
    })
    .eq("id", event.id)
    .eq("status", event.status);
  if (event.status === "processing") query = query.eq("claimed_at", event.claimed_at);
  const { data, error } = await query.select("id").maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function sendSocialNotifications(supabase: DatabaseClient, actorId: string | null, now: Date) {
  const events = await loadSocialEvents(supabase, actorId, now);
  if (!events.length) return { checked: 0, claimed: 0, sent: 0, skipped: 0, expired: 0, failed: 0 };

  const actorIds = [...new Set(events.map((event) => event.actor_id))];
  const recipientIds = [...new Set(events.map((event) => event.recipient_id))];
  const friendshipIds = [...new Set(events.map((event) => event.friendship_id).filter(Boolean))] as string[];
  const challengeIds = [...new Set(events.map((event) => event.challenge_id).filter(Boolean))] as string[];
  const [
    { data: profiles, error: profileError },
    { data: subscriptions, error: subscriptionError },
    friendshipResult,
  ] = await Promise.all([
    supabase.from("bsb_profiles").select("user_id, username, display_name").in("user_id", actorIds),
    supabase.from(subscriptionTable)
      .select("id, user_id, endpoint, p256dh, auth, timezone, morning_time, evening_enabled, evening_time, last_opened_at, last_morning_sent_on, last_evening_sent_on, friend_request_notifications, game_challenge_notifications, challenge_accepted_notifications")
      .eq("enabled", true)
      .in("user_id", recipientIds),
    friendshipIds.length
      ? supabase.from("bsb_friendships").select("id, status").in("id", friendshipIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profileError) throw profileError;
  if (subscriptionError) throw subscriptionError;
  if (friendshipResult.error) throw friendshipResult.error;

  let challenges: ChallengeRow[] = [];
  if (challengeIds.length) {
    const { data, error } = await supabase.from("bsb_game_challenges")
      .select("id, game_type, round_count, status")
      .in("id", challengeIds);
    if (error) throw error;
    challenges = (data || []) as ChallengeRow[];
  }

  const profilesById = new Map((profiles as ProfileRow[] || []).map((profile) => [profile.user_id, profile]));
  const friendshipsById = new Map(
    (friendshipResult.data as FriendshipRow[] || []).map((friendship) => [friendship.id, friendship]),
  );
  const challengesById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const subscriptionsByUser = (subscriptions as SubscriptionRow[] || []).reduce((map, subscription) => {
    if (!subscription.user_id) return map;
    if (!map.has(subscription.user_id)) map.set(subscription.user_id, []);
    map.get(subscription.user_id)!.push(subscription);
    return map;
  }, new Map<string, SubscriptionRow[]>());

  let claimed = 0;
  let sent = 0;
  let skipped = 0;
  let expired = 0;
  let failed = 0;

  for (const event of events) {
    if (!await claimSocialEvent(supabase, event, now)) {
      skipped += 1;
      continue;
    }
    claimed += 1;
    if (!eventIsStillActionable(event, friendshipsById, challengesById)) {
      const { error } = await supabase.from(eventTable)
        .update({ status: "sent", sent_at: new Date().toISOString(), claimed_at: null, last_error: null })
        .eq("id", event.id)
        .eq("status", "processing");
      if (error) throw error;
      skipped += 1;
      continue;
    }
    const payload = socialPayload(
      event,
      profilesById.get(event.actor_id),
      event.challenge_id ? challengesById.get(event.challenge_id) : undefined,
    );
    const recipients = (subscriptionsByUser.get(event.recipient_id) || [])
      .filter((subscription) => subscriptionAllowsEvent(subscription, event));
    let eventSent = 0;
    let transientFailures = 0;

    for (const subscription of recipients) {
      try {
        await sendToSubscription(subscription, payload);
        eventSent += 1;
      } catch (error) {
        const statusCode = pushStatusCode(error);
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from(subscriptionTable).delete().eq("id", subscription.id);
          expired += 1;
        } else {
          transientFailures += 1;
          console.error("[Push sender] Social delivery failed", event.id, subscription.id, statusCode || "unknown status");
        }
      }
    }

    if (eventSent > 0 || transientFailures === 0) {
      const { error } = await supabase.from(eventTable)
        .update({ status: "sent", sent_at: new Date().toISOString(), claimed_at: null, last_error: null })
        .eq("id", event.id)
        .eq("status", "processing");
      if (error) throw error;
      if (eventSent > 0) sent += 1;
      else skipped += 1;
      continue;
    }

    if (event.attempts + 1 >= 20) {
      const { error } = await supabase.from(eventTable)
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          claimed_at: null,
          last_error: "Delivery abandoned after 20 attempts",
        })
        .eq("id", event.id)
        .eq("status", "processing");
      if (error) throw error;
      failed += 1;
      continue;
    }

    const retryMinutes = Math.min(60, 2 ** Math.min(event.attempts + 1, 6));
    const { error } = await supabase.from(eventTable)
      .update({
        status: "pending",
        available_at: new Date(now.getTime() + retryMinutes * 60 * 1000).toISOString(),
        claimed_at: null,
        last_error: "Transient Web Push delivery failure",
      })
      .eq("id", event.id)
      .eq("status", "processing");
    if (error) throw error;
    failed += 1;
  }

  return { checked: events.length, claimed, sent, skipped, expired, failed };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return jsonResponse(request, { error: "Method not allowed" }, 405);

  const origin = request.headers.get("origin") || "";
  if (origin && !allowedOrigin(origin)) return jsonResponse(request, { error: "Origin not allowed" }, 403);

  const configuredSecret = Deno.env.get("PUSH_CRON_SECRET") || "";
  const providedSecret = request.headers.get("x-push-cron-secret") || "";
  const cronAuthorized = Boolean(configuredSecret && providedSecret === configuredSecret);
  const supabase = databaseClient();
  const actorId = cronAuthorized ? null : await authenticatedActorId(request, supabase);
  if (!cronAuthorized && !actorId) return jsonResponse(request, { error: "Unauthorized" }, 401);

  const vapidPublicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
  const vapidPrivateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") || "";
  const vapidSubject = Deno.env.get("WEB_PUSH_SUBJECT") || "mailto:support@bigscreenbible.com";
  if (!vapidPublicKey || !vapidPrivateKey) {
    return jsonResponse(request, { error: "Web Push VAPID keys are not configured" }, 503);
  }

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const now = new Date();
    const [daily, social] = await Promise.all([
      cronAuthorized ? sendDailyNotifications(supabase, now) : Promise.resolve(null),
      sendSocialNotifications(supabase, actorId, now),
    ]);
    if (cronAuthorized) {
      const retentionBefore = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from(eventTable)
        .delete()
        .eq("status", "sent")
        .lt("sent_at", retentionBefore);
      if (error) console.warn("[Push sender] Event cleanup failed", error.message);
    }
    return jsonResponse(request, { daily, social });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Push delivery failed";
    console.error("[Push sender]", message);
    return jsonResponse(request, { error: "Push delivery failed" }, 500);
  }
});
