import { createClient } from "npm:@supabase/supabase-js@2.110.1";

const tableName = "bsb_push_subscriptions";

type PushPreferences = {
  timezone: string;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
  friendRequestNotifications: boolean;
  gameChallengeNotifications: boolean;
  challengeAcceptedNotifications: boolean;
};

type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function validTime(value: unknown) {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validTimezone(value: unknown) {
  if (typeof value !== "string" || value.length < 1 || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function normalizePreferences(value: unknown): PushPreferences | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    !validTimezone(input.timezone) || !validTime(input.morningTime) || !validTime(input.eveningTime) ||
    typeof input.eveningEnabled !== "boolean"
  ) return null;
  return {
    timezone: input.timezone as string,
    morningTime: input.morningTime as string,
    eveningEnabled: input.eveningEnabled !== false,
    eveningTime: input.eveningTime as string,
    friendRequestNotifications: input.friendRequestNotifications !== false,
    gameChallengeNotifications: input.gameChallengeNotifications !== false,
    challengeAcceptedNotifications: input.challengeAcceptedNotifications !== false,
  };
}

function normalizeSubscription(value: unknown): PushSubscriptionInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const keys = input.keys as Record<string, unknown> | undefined;
  const endpoint = typeof input.endpoint === "string" ? input.endpoint.trim() : "";
  const p256dh = typeof keys?.p256dh === "string" ? keys.p256dh.trim() : "";
  const auth = typeof keys?.auth === "string" ? keys.auth.trim() : "";
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:") return null;
    const hostname = parsed.hostname.toLowerCase();
    const allowedHost = [
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "web.push.apple.com",
    ].includes(hostname) || [
      ".notify.windows.com",
      ".push.samsungosp.com",
    ].some((suffix) => hostname.endsWith(suffix));
    if (!allowedHost) return null;
  } catch {
    return null;
  }
  if (endpoint.length > 4096 || p256dh.length < 20 || p256dh.length > 512 || auth.length < 8 || auth.length > 256) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(p256dh) || !/^[A-Za-z0-9_-]+$/.test(auth)) return null;
  return { endpoint, keys: { p256dh, auth } };
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validDeviceToken(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{40,100}$/.test(value);
}

class AuthenticationError extends Error {}

async function authenticatedUserId(request: Request, supabase: ReturnType<typeof databaseClient>) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (
    !token
    || token === Deno.env.get("SUPABASE_ANON_KEY")
    || token.startsWith("sb_publishable_")
  ) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) throw new AuthenticationError("Invalid authentication session");
  return data.user.id;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (!allowedOrigin(request.headers.get("origin") || "")) {
    return jsonResponse(request, { error: "Origin not allowed" }, 403);
  }

  if (request.method === "GET") {
    const publicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
    return jsonResponse(request, { enabled: Boolean(publicKey), publicKey: publicKey || null });
  }
  if (request.method !== "POST") return jsonResponse(request, { error: "Method not allowed" }, 405);

  try {
    const rawBody = await request.text();
    if (rawBody.length > 20_000) return jsonResponse(request, { error: "Request body is too large" }, 413);
    const body = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    const action = String(body.action || "");
    const supabase = databaseClient();
    const userId = await authenticatedUserId(request, supabase);

    if (action === "subscribe") {
      const subscription = normalizeSubscription(body.subscription);
      const preferences = normalizePreferences(body.preferences);
      if (!subscription || !preferences) return jsonResponse(request, { error: "Invalid subscription or schedule" }, 400);
      if (!Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY")) {
        return jsonResponse(request, { error: "Push notifications are not configured yet" }, 503);
      }

      const deviceToken = randomToken();
      const deviceTokenHash = await tokenHash(deviceToken);
      const { error } = await supabase.from(tableName).upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        device_token_hash: deviceTokenHash,
        timezone: preferences.timezone,
        morning_time: preferences.morningTime,
        evening_enabled: preferences.eveningEnabled,
        evening_time: preferences.eveningTime,
        friend_request_notifications: preferences.friendRequestNotifications,
        game_challenge_notifications: preferences.gameChallengeNotifications,
        challenge_accepted_notifications: preferences.challengeAcceptedNotifications,
        user_id: userId,
        enabled: true,
        last_opened_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });
      if (error) throw error;
      return jsonResponse(request, { subscribed: true, deviceToken });
    }

    if (!validDeviceToken(body.deviceToken)) return jsonResponse(request, { error: "Invalid device token" }, 401);
    const deviceTokenHash = await tokenHash(body.deviceToken as string);

    if (action === "opened") {
      if (!validTimezone(body.timezone)) return jsonResponse(request, { error: "Invalid device timezone" }, 400);
      const openedUpdate: Record<string, unknown> = {
        last_opened_at: new Date().toISOString(),
        timezone: body.timezone,
      };
      if (userId) openedUpdate.user_id = userId;
      const { error } = await supabase.from(tableName)
        .update(openedUpdate)
        .eq("device_token_hash", deviceTokenHash)
        .eq("enabled", true);
      if (error) throw error;
      return jsonResponse(request, { recorded: true });
    }

    if (action === "update") {
      const preferences = normalizePreferences(body.preferences);
      if (!preferences) return jsonResponse(request, { error: "Invalid reminder schedule" }, 400);
      const preferenceUpdate: Record<string, unknown> = {
        timezone: preferences.timezone,
        morning_time: preferences.morningTime,
        evening_enabled: preferences.eveningEnabled,
        evening_time: preferences.eveningTime,
        friend_request_notifications: preferences.friendRequestNotifications,
        game_challenge_notifications: preferences.gameChallengeNotifications,
        challenge_accepted_notifications: preferences.challengeAcceptedNotifications,
      };
      if (userId) preferenceUpdate.user_id = userId;
      const { data, error } = await supabase.from(tableName)
        .update(preferenceUpdate)
        .eq("device_token_hash", deviceTokenHash)
        .eq("enabled", true)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse(request, { error: "Subscription not found" }, 404);
      return jsonResponse(request, { updated: true });
    }

    if (action === "unsubscribe") {
      const { error } = await supabase.from(tableName).delete().eq("device_token_hash", deviceTokenHash);
      if (error) throw error;
      return jsonResponse(request, { unsubscribed: true });
    }

    if (action === "unlink-user") {
      if (!userId) return jsonResponse(request, { error: "Authentication required" }, 401);
      const { error } = await supabase.from(tableName)
        .update({ user_id: null })
        .eq("device_token_hash", deviceTokenHash)
        .eq("user_id", userId);
      if (error) throw error;
      return jsonResponse(request, { unlinked: true });
    }

    return jsonResponse(request, { error: "Unknown action" }, 400);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return jsonResponse(request, { error: error.message }, 401);
    }
    const message = error instanceof Error ? error.message : "Push subscription request failed";
    console.error("[Push subscriptions]", message);
    return jsonResponse(request, { error: "Push subscription request failed" }, 500);
  }
});
