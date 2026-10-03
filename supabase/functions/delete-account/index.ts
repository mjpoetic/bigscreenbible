import { createClient } from "npm:@supabase/supabase-js@2.110.1";
import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "npm:jose@6.1.3";

const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
function response(request: Request, status: number, body: unknown) {
  const origin = request.headers.get("origin") || "";
  const allowed = ["https://bigscreenbible.com", "https://www.bigscreenbible.com", "capacitor://localhost", "http://localhost", "https://localhost"].includes(origin);
  return new Response(JSON.stringify(body), { status, headers: {
    "Content-Type": "application/json", "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": allowed ? origin : "https://bigscreenbible.com",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin",
  } });
}

async function revokeApple(user: { identities?: Array<{ provider: string; id: string; identity_data?: Record<string, unknown> }> }, proof: Record<string, unknown>) {
  const native = proof.platform === "ios";
  const clientId = native ? "com.bigscreenbible.app" : Deno.env.get("APPLE_SERVICES_ID") || "com.bigscreenbible.app.web";
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  const team = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  if (!privateKey || !team || !keyId) throw new Error("Apple account deletion is not configured yet. Please try again later.");
  const key = await importPKCS8(privateKey, "ES256");
  const secret = await new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(team).setSubject(clientId).setAudience("https://appleid.apple.com")
    .setIssuedAt().setExpirationTime("5m").sign(key);
  const token = native ? proof.authorizationCode : proof.refreshToken;
  if (typeof token !== "string" || !token || token.length > 8192) throw new Error("Confirm with Apple again before deleting your account.");
  const parameters = new URLSearchParams({ client_id: clientId, client_secret: secret,
    grant_type: native ? "authorization_code" : "refresh_token",
    [native ? "code" : "refresh_token"]: token });
  const exchange = await fetch("https://appleid.apple.com/auth/token", { method: "POST", body: parameters });
  if (!exchange.ok) throw new Error("Apple confirmation expired or could not be verified. Confirm with Apple again.");
  const tokens = await exchange.json();
  const { payload } = await jwtVerify(tokens.id_token, appleKeys, { issuer: ["https://appleid.apple.com", "https://account.apple.com"], audience: clientId });
  const identity = user.identities?.find(item => item.provider === "apple");
  if (!identity || payload.sub !== (identity.identity_data?.sub || identity.id)) throw new Error("That Apple account does not match this account. Nothing was deleted.");
  const revokeToken = tokens.refresh_token || tokens.access_token;
  if (!revokeToken) throw new Error("Apple did not return a token for account deletion.");
  const revoked = await fetch("https://appleid.apple.com/auth/revoke", { method: "POST", body: new URLSearchParams({
    client_id: clientId, client_secret: secret, token: revokeToken,
    token_type_hint: tokens.refresh_token ? "refresh_token" : "access_token",
  }) });
  if (!revoked.ok) throw new Error("Apple authorization could not be revoked. Your account was not deleted.");
}

export async function handleDeleteAccount(request: Request, dependencies: { admin?: ReturnType<typeof createClient>; revokeApple?: typeof revokeApple } = {}) {
  if (request.method === "OPTIONS") return response(request, 200, {});
  if (request.method !== "POST") return response(request, 405, { error: "Method not allowed" });
  const jwt = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!jwt) return response(request, 401, { error: "Sign in before deleting your account." });
  const admin = dependencies.admin || createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) return response(request, 401, { error: "Your session expired. Sign in again." });
  try {
    const body = await request.json();
    // Never accept a caller-selected target user. The verified session owns the deletion.
    if (body.confirmation !== "DELETE" || body.userId !== data.user.id) return response(request, 400, { error: "Account confirmation did not match." });
    if (data.user.identities?.some(identity => identity.provider === "apple")) await (dependencies.revokeApple || revokeApple)(data.user, body.apple || {});
    const { error: pushError } = await admin.from("bsb_push_subscriptions").delete().eq("user_id", data.user.id);
    if (pushError) throw new Error("Could not remove notification subscriptions. Please try again.");
    const { error: deletionError } = await admin.auth.admin.deleteUser(data.user.id, false);
    if (deletionError) throw new Error("Account deletion could not finish. Please try again.");
    return response(request, 200, { deleted: true, userId: data.user.id });
  } catch (error) {
    return response(request, 400, { error: error instanceof Error ? error.message : "Account deletion could not finish." });
  }
}

if (import.meta.main) Deno.serve(request => handleDeleteAccount(request));
