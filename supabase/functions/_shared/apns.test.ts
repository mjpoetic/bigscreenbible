import { normalizeNativeSubscription, createAPNSToken, sendAPNSNotification } from "./apns.ts";
function assert(value: unknown, message = "Assertion failed") { if (!value) throw new Error(message); }
Deno.test("APNs token and environment validation", () => {
  assert(normalizeNativeSubscription({ token: "AB".repeat(32), environment: "development" })?.token === "ab".repeat(32));
  for (const value of [null, {}, { token: "../evil", environment: "production" }, { token: "ab".repeat(32), environment: "https://evil.test" }]) assert(normalizeNativeSubscription(value) === null);
});
Deno.test("APNs signed JWT, transport, safe payload, and expiry classification", async () => {
  const key = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", key.privateKey));
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...der))}\n-----END PRIVATE KEY-----`;
  const config = { keyId: "TESTKEY123", teamId: "TESTTEAM12", privateKey: pem, topic: "com.bigscreenbible.app" };
  const jwt = await createAPNSToken(config, 1700000000000);
  const decode = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const [header, payload, sig] = jwt.split(".");
  assert(JSON.parse(new TextDecoder().decode(decode(header))).alg === "ES256");
  assert(JSON.parse(new TextDecoder().decode(decode(payload))).iat === 1700000000);
  assert(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key.publicKey, decode(sig), new TextEncoder().encode(`${header}.${payload}`)));
  const names = ["APNS_KEY_ID", "APNS_TEAM_ID", "APNS_PRIVATE_KEY"];
  const previous = names.map(name => Deno.env.get(name));
  Deno.env.set(names[0], config.keyId); Deno.env.set(names[1], config.teamId); Deno.env.set(names[2], pem);
  const originalFetch = globalThis.fetch;
  let status = 200, reason = "", lastHost = "";
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input)); lastHost = url.hostname;
    const headers = new Headers(init?.headers);
    assert(headers.get("apns-topic") === config.topic);
    assert(headers.get("apns-push-type") === "alert");
    const body = JSON.parse(String(init?.body));
    assert(body.aps.alert.title === "Test"); assert(body.url === "https://bigscreenbible.com/?mode=reader");
    assert(!("privateKey" in body));
    return new Response(status === 200 ? null : JSON.stringify({ reason }), { status });
  }) as typeof fetch;
  try {
    const subscription = { token: "ab".repeat(32), environment: "development" as const };
    const message = { title: "Test", body: "Body", url: "https://bigscreenbible.com/?mode=reader" };
    await sendAPNSNotification(subscription, message); assert(lastHost === "api.sandbox.push.apple.com");
    await sendAPNSNotification({ ...subscription, environment: "production" }, message); assert(lastHost === "api.push.apple.com");
    for (const [code, errorReason, expected] of [[410, "Unregistered", 410], [400, "BadDeviceToken", 503], [403, "InvalidProviderToken", 503]] as const) {
      status = code; reason = errorReason;
      let caught = false;
      try { await sendAPNSNotification(subscription, message); }
      catch (error) { caught = true; assert((error as { statusCode: number }).statusCode === expected); }
      assert(caught);
    }
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, i) => { if (previous[i] === undefined) Deno.env.delete(name); else Deno.env.set(name, previous[i]!); });
  }
});
