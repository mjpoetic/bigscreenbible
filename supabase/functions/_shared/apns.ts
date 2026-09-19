export type NativePushSubscription = { token: string; environment: "development" | "production" };
export type APNSConfiguration = { keyId: string; teamId: string; privateKey: string; topic: string };

export function normalizeNativeSubscription(value: unknown): NativePushSubscription | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.token !== "string" || !/^(?:[a-f0-9]{2}){16,256}$/i.test(input.token)) return null;
  if (input.environment !== "development" && input.environment !== "production") return null;
  return { token: input.token.toLowerCase(), environment: input.environment };
}

export function apnsConfiguration(): APNSConfiguration | null {
  const keyId = Deno.env.get("APNS_KEY_ID") || "";
  const teamId = Deno.env.get("APNS_TEAM_ID") || "";
  const privateKey = (Deno.env.get("APNS_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
  const topic = "com.bigscreenbible.app";
  return keyId && teamId && privateKey ? { keyId, teamId, privateKey, topic } : null;
}

function base64url(value: Uint8Array) {
  return btoa(String.fromCharCode(...value)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function createAPNSToken(config: APNSConfiguration, now: number) {
  const encoder = new TextEncoder();
  const header = base64url(encoder.encode(JSON.stringify({ alg: "ES256", kid: config.keyId })));
  const claims = base64url(encoder.encode(JSON.stringify({ iss: config.teamId, iat: Math.floor(now / 1000) })));
  const pem = config.privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const der = Uint8Array.from(atob(pem), character => character.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const message = `${header}.${claims}`;
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(message));
  return `${message}.${base64url(new Uint8Array(signature))}`;
}

let cachedProviderToken: { token: string; createdAt: number; keyId: string; teamId: string } | null = null;
export async function sendAPNSNotification(subscription: NativePushSubscription, payload: Record<string, unknown>) {
  const config = apnsConfiguration();
  if (!config) throw new Error("Apple push delivery is not configured");
  const now = Date.now();
  if (!cachedProviderToken || cachedProviderToken.keyId !== config.keyId || cachedProviderToken.teamId !== config.teamId || now - cachedProviderToken.createdAt > 50 * 60 * 1000) {
    cachedProviderToken = { token: await createAPNSToken(config, now), createdAt: now, keyId: config.keyId, teamId: config.teamId };
  }
  const host = subscription.environment === "development" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const response = await fetch(`https://${host}/3/device/${subscription.token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${cachedProviderToken.token}`,
      "apns-topic": config.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "apns-expiration": String(Math.floor(now / 1000) + 86400),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      aps: { alert: { title: String(payload.title || "Big Screen Bible"), body: String(payload.body || "") }, sound: "default" },
      url: payload.url, kind: payload.kind, tag: payload.tag,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const reason = String(result.reason || "ApplePushError");
    if (reason === "ExpiredProviderToken") cachedProviderToken = null;
    // Delete only tokens Apple confirms are no longer valid. Configuration errors
    // (including BadDeviceToken/environment mismatch) retain the subscription.
    const error = new Error(`Apple push delivery failed: ${reason}`) as Error & { statusCode: number };
    error.statusCode = response.status === 410 && reason === "Unregistered" ? 410 : 503;
    throw error;
  }
}
