import {
  createFCMAssertion,
  fcmConfiguration,
  normalizeFCMToken,
  sendFCMNotification,
} from "./fcm.ts";
function assert(value: unknown, message = "Assertion failed") {
  if (!value) throw new Error(message);
}
Deno.test("FCM token validation", () => {
  assert(normalizeFCMToken("Device_TOKEN:" + "A".repeat(140)) !== null);
  for (
    const value of [
      null,
      {},
      "short",
      "A".repeat(4093),
      "https://evil.test/" + "a".repeat(40),
      "a".repeat(40) + "\n",
    ]
  ) assert(normalizeFCMToken(value) === null);
});
Deno.test("FCM signed OAuth assertion, delivery, caching and error retention", async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", key.privateKey),
  );
  const privateKey = `-----BEGIN PRIVATE KEY-----\n${
    btoa(String.fromCharCode(...der))
  }\n-----END PRIVATE KEY-----`;
  const config = {
    projectId: "test-bible-project",
    clientEmail: "push@test-bible-project.iam.gserviceaccount.com",
    privateKey,
  };
  const decode = (value: string) =>
    Uint8Array.from(
      atob(value.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
  const [header, claims, signature] =
    (await createFCMAssertion(config, 1700000000000)).split(".");
  const payload = JSON.parse(new TextDecoder().decode(decode(claims)));
  assert(
    payload.aud === "https://oauth2.googleapis.com/token" &&
      payload.exp - payload.iat === 3600,
  );
  assert(
    payload.scope === "https://www.googleapis.com/auth/firebase.messaging",
  );
  assert(
    await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key.publicKey,
      decode(signature),
      new TextEncoder().encode(`${header}.${claims}`),
    ),
  );
  const previous = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  const originalFetch = globalThis.fetch;
  let oauthCalls = 0,
    status = 200,
    code = "",
    detailType = "type.googleapis.com/google.firebase.fcm.v1.FcmError";
  const token = "Device_TOKEN:" + "A".repeat(140);
  try {
    Deno.env.set("FCM_SERVICE_ACCOUNT_JSON", "invalid");
    assert(fcmConfiguration() === null);
    Deno.env.set(
      "FCM_SERVICE_ACCOUNT_JSON",
      JSON.stringify({
        project_id: config.projectId,
        client_email: config.clientEmail,
        private_key: privateKey,
      }),
    );
    assert(fcmConfiguration()?.projectId === config.projectId);
    globalThis.fetch =
      (async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url === "https://oauth2.googleapis.com/token") {
          oauthCalls++;
          const form = init?.body as URLSearchParams;
          assert(
            form.get("grant_type") ===
              "urn:ietf:params:oauth:grant-type:jwt-bearer",
          );
          return Response.json({
            access_token: "test-access-token",
            expires_in: 3600,
          });
        }
        assert(
          url ===
            `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`,
        );
        assert(
          new Headers(init?.headers).get("authorization") ===
            "Bearer test-access-token",
        );
        const body = JSON.parse(String(init?.body)).message;
        assert(body.token === token && body.notification.title === "Reminder");
        assert(body.data.url === "https://bigscreenbible.com/?mode=reader");
        assert(body.android.notification.channel_id === "bsb_notifications");
        assert(body.android.notification.icon === "ic_stat_bible");
        return Response.json(
          status === 200 ? { name: "sent" } : {
            error: { details: [{ "@type": detailType, errorCode: code }] },
          },
          { status },
        );
      }) as typeof fetch;
    const notification = {
      title: "Reminder",
      body: "Read today",
      url: "https://bigscreenbible.com/?mode=reader",
    };
    await sendFCMNotification(token, notification);
    await sendFCMNotification(token, notification);
    assert(oauthCalls === 1);
    for (
      const [http, reason, expected] of [
        [404, "UNREGISTERED", 410],
        [400, "INVALID_ARGUMENT", 503],
        [403, "SENDER_ID_MISMATCH", 503],
        [429, "QUOTA_EXCEEDED", 503],
      ] as const
    ) {
      status = http;
      code = reason;
      try {
        await sendFCMNotification(token, notification);
        throw new Error("Expected delivery failure");
      } catch (error) {
        assert((error as { statusCode?: number }).statusCode === expected);
      }
    }
    detailType = "another-error-type";
    code = "UNREGISTERED";
    status = 404;
    try {
      await sendFCMNotification(token, notification);
      throw new Error("Expected delivery failure");
    } catch (error) {
      assert((error as { statusCode?: number }).statusCode === 503);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) Deno.env.delete("FCM_SERVICE_ACCOUNT_JSON");
    else Deno.env.set("FCM_SERVICE_ACCOUNT_JSON", previous);
  }
});
