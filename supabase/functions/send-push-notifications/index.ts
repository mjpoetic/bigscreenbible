// @deno-types="npm:@types/web-push@3.6.4"
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.110.1";
import { dueNotifications, type PushSchedule } from "./schedule.ts";

const tableName = "bsb_push_subscriptions";
const siteUrl = "https://bigscreenbible.com";

type SubscriptionRow = PushSchedule & {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type VerseRow = {
  reference: string | null;
  verse_text: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
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
      ? `${siteUrl}/?ref=${encodeURIComponent(reference)}&mode=reader`
      : `${siteUrl}/?mode=reader`,
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

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  const configuredSecret = Deno.env.get("PUSH_CRON_SECRET") || "";
  const providedSecret = request.headers.get("x-push-cron-secret") || "";
  if (!configuredSecret || providedSecret !== configuredSecret) return jsonResponse({ error: "Unauthorized" }, 401);

  const vapidPublicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") || "";
  const vapidPrivateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") || "";
  const vapidSubject = Deno.env.get("WEB_PUSH_SUBJECT") || "mailto:support@bigscreenbible.com";
  if (!vapidPublicKey || !vapidPrivateKey) return jsonResponse({ error: "Web Push VAPID keys are not configured" }, 503);

  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = databaseClient();
    const now = new Date();
    const { data: rows, error: rowsError } = await supabase.from(tableName)
      .select("id, endpoint, p256dh, auth, timezone, morning_time, evening_enabled, evening_time, last_opened_at, last_morning_sent_on, last_evening_sent_on")
      .eq("enabled", true)
      .order("updated_at", { ascending: true })
      .limit(2000);
    if (rowsError) throw rowsError;

    const due = (rows as SubscriptionRow[] || []).flatMap((row) =>
      dueNotifications(row, now).map((notification) => ({ row, notification }))
    );
    const needsMorningVerse = due.some(({ notification }) => notification.kind === "morning");
    let verse: VerseRow | null = null;
    if (needsMorningVerse) {
      const { data, error } = await supabase.from("bsb_verse_of_day_cache")
        .select("reference, verse_text")
        .eq("status", "ready")
        .eq("cache_date", verseCacheDate(now))
        .maybeSingle<VerseRow>();
      if (error) console.warn("[Push sender] Verse lookup failed", error.message);
      verse = data || null;
      if (!verse) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/verse-of-the-day`, {
            headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
          });
          const payload = await response.json().catch(() => ({}));
          if (response.ok && payload.reference && payload.verseText) {
            verse = { reference: payload.reference, verse_text: payload.verseText };
          }
        } catch (error) {
          console.warn("[Push sender] Verse refresh failed", error instanceof Error ? error.message : error);
        }
      }
    }

    let sent = 0;
    let skipped = 0;
    let expired = 0;
    let failed = 0;

    for (const { row, notification } of due) {
      const sentColumn = notification.kind === "morning" ? "last_morning_sent_on" : "last_evening_sent_on";
      const currentValue = notification.kind === "morning" ? row.last_morning_sent_on : row.last_evening_sent_on;
      let claimQuery = supabase.from(tableName)
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
        const payload = notification.kind === "morning" ? morningPayload(verse) : eveningPayload();
        await webpush.sendNotification({
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        }, JSON.stringify(payload), { TTL: 43_200, urgency: "normal" });
        sent += 1;
      } catch (error) {
        const statusCode = pushStatusCode(error);
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from(tableName).delete().eq("id", row.id);
          expired += 1;
          continue;
        }
        await supabase.from(tableName)
          .update({ [sentColumn]: currentValue })
          .eq("id", row.id)
          .eq(sentColumn, notification.localDate);
        failed += 1;
        console.error("[Push sender] Delivery failed", row.id, statusCode || "unknown status");
      }
    }

    return jsonResponse({ checked: rows?.length || 0, due: due.length, sent, skipped, expired, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Push delivery failed";
    console.error("[Push sender]", message);
    return jsonResponse({ error: "Push delivery failed" }, 500);
  }
});
