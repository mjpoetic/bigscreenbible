import { handleDeleteAccount } from "./index.ts";
function assert(value: unknown, message = "Assertion failed") { if (!value) throw new Error(message); }
function harness({apple = false, authFailure = false, pushFailure = false, revokeFailure = false} = {}) {
  const calls: string[] = [];
  const admin = { auth: { getUser: async () => ({data: {user: authFailure ? null : {id: "owner", identities: apple ? [{provider: "apple", id: "apple-owner"}] : []}}, error: authFailure ? {} : null}), admin: {deleteUser: async (id: string, soft: boolean) => {calls.push(`delete:${id}:${soft}`); return {};} } }, from: (table: string) => ({delete: () => ({eq: async (column: string, id: string) => {calls.push(`${table}:${column}:${id}`); return {error: pushFailure ? {} : null};}})}) };
  const dependencies = {admin: admin as never, revokeApple: async () => {calls.push("revoke"); if (revokeFailure) throw new Error("revocation failed");}};
  const request = (body: unknown = {userId: "owner", confirmation: "DELETE"}, authorized = true) => new Request("https://test/delete", {method: "POST", headers: {"Content-Type": "application/json", ...(authorized ? {Authorization: "Bearer test"} : {})}, body: JSON.stringify(body)});
  return {calls, run: (body?: unknown, authorized = true) => handleDeleteAccount(request(body, authorized), dependencies)};
}
Deno.test("unauthenticated and forged targets cannot delete", async () => {
  const h = harness(); assert((await h.run(undefined, false)).status === 401);
  assert((await h.run({userId: "other", confirmation: "DELETE"})).status === 400);
  assert((await h.run({userId: "owner", confirmation: "wrong"})).status === 400);
  assert(h.calls.length === 0);
  const expired = harness({authFailure: true}); assert((await expired.run()).status === 401); assert(expired.calls.length === 0);
});
Deno.test("hard deletion removes owned push records first", async () => {
  const h = harness(); assert((await h.run()).status === 200);
  assert(h.calls.join(",") === "bsb_push_subscriptions:user_id:owner,delete:owner:false");
});
Deno.test("Apple revocation is required before any data deletion", async () => {
  const h = harness({apple: true}); assert((await h.run()).status === 200); assert(h.calls[0] === "revoke");
  const failure = harness({apple: true, revokeFailure: true}); assert((await failure.run()).status === 400); assert(failure.calls.join() === "revoke");
});
Deno.test("push cleanup failure prevents auth deletion", async () => {
  const h = harness({pushFailure: true}); assert((await h.run()).status === 400); assert(!h.calls.some(call => call.startsWith("delete:")));
});
Deno.test("only POST can delete", async () => {
  assert((await handleDeleteAccount(new Request("https://test", {method: "GET"}))).status === 405);
});
