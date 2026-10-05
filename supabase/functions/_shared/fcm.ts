export type FCMConfiguration = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};
export function normalizeFCMToken(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_:\-]{32,4092}$/.test(value)
    ? value
    : null;
}
export function fcmConfiguration(): FCMConfiguration | null {
  try {
    const value = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") || "{}");
    if (
      !/^[a-z][a-z0-9-]{4,62}$/.test(value.project_id || "") ||
      typeof value.client_email !== "string" ||
      !value.client_email.endsWith(".iam.gserviceaccount.com") ||
      typeof value.private_key !== "string" ||
      !value.private_key.includes("BEGIN PRIVATE KEY")
    ) return null;
    return {
      projectId: value.project_id,
      clientEmail: value.client_email,
      privateKey: value.private_key,
    };
  } catch {
    return null;
  }
}
function base64url(value: Uint8Array) {
  return btoa(String.fromCharCode(...value)).replace(/=/g, "").replace(
    /\+/g,
    "-",
  ).replace(/\//g, "_");
}
export async function createFCMAssertion(
  config: FCMConfiguration,
  now: number,
) {
  const encoder = new TextEncoder();
  const header = base64url(
    encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })),
  );
  const iat = Math.floor(now / 1000);
  const claims = base64url(
    encoder.encode(
      JSON.stringify({
        iss: config.clientEmail,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat,
        exp: iat + 3600,
      }),
    ),
  );
  const der = Uint8Array.from(
    atob(
      config.privateKey.replace(
        /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
        "",
      ),
    ),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const input = `${header}.${claims}`;
  return `${input}.${
    base64url(
      new Uint8Array(
        await crypto.subtle.sign(
          "RSASSA-PKCS1-v1_5",
          key,
          encoder.encode(input),
        ),
      ),
    )
  }`;
}
let cached: { credential: string; token: string; expiresAt: number } | null =
  null;
export async function sendFCMNotification(
  token: string,
  payload: Record<string, unknown>,
) {
  const config = fcmConfiguration();
  if (!config) throw new Error("Android push delivery is not configured");
  if (!normalizeFCMToken(token)) {
    throw new Error("Invalid stored Android push token");
  }
  const credential = JSON.stringify(config);
  if (
    !cached || cached.credential !== credential ||
    cached.expiresAt < Date.now() + 60000
  ) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: await createFCMAssertion(config, Date.now()),
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (
      !response.ok || typeof result.access_token !== "string" ||
      !Number.isFinite(result.expires_in) || result.expires_in <= 0
    ) throw new Error("Firebase authorization failed");
    cached = {
      credential,
      token: result.access_token,
      expiresAt: Date.now() + result.expires_in * 1000,
    };
  }
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${cached.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: String(payload.title || "Big Screen Bible"),
            body: String(payload.body || ""),
          },
          data: {
            url: String(payload.url || ""),
            kind: String(payload.kind || ""),
            tag: String(payload.tag || ""),
          },
          android: {
            priority: "NORMAL",
            ttl: "86400s",
            notification: {
              channel_id: "bsb_notifications",
              icon: "ic_stat_bible",
              sound: "default",
              tag: String(payload.tag || "bsb"),
            },
          },
        },
      }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const unregistered = result.error?.details?.some((
      detail: Record<string, unknown>,
    ) =>
      detail["@type"] ===
        "type.googleapis.com/google.firebase.fcm.v1.FcmError" &&
      detail.errorCode === "UNREGISTERED"
    );
    if (response.status === 401) cached = null;
    const error = new Error(`Firebase push delivery failed (HTTP ${response.status})`) as Error & {
      statusCode: number;
    };
    // Only confirmed expired device tokens should delete a subscription.
    error.statusCode = unregistered ? 410 : 503;
    throw error;
  }
}
