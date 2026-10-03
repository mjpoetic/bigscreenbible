# Account deletion

The shared Account panel offers Delete account. The dialog identifies the current account, explains permanent deletion, and offers explicit Yes/No choices followed by a separate final confirmation screen reiterating permanent data loss. Guest data and other remembered accounts remain separate. A verified session owns the server operation; a caller cannot choose another target user ID.

The `delete-account` Edge Function is deployed to project `yyldnatfhzobyeqnvqjv`. Gateway JWT verification is disabled for compatibility with publishable keys, but the function verifies every deletion request with Supabase `auth.getUser` before using server-only admin privileges. It hard-deletes the user, cascades study/profile/friendship/challenge/notification-event records, and explicitly deletes push subscriptions that otherwise retain a detached record. Existing access JWTs may remain cryptographically valid until expiry; deleted users fail the endpoint's user lookup and cannot create account-owned records because their user FK no longer exists.

## Apple server secrets

In Supabase project Settings → Edge Functions → Secrets, configure:

- `APPLE_TEAM_ID`: `8QY8QS9TH2`
- `APPLE_SERVICES_ID`: `com.bigscreenbible.app.web`
- `APPLE_KEY_ID`: ID of the Apple signing key already created
- `APPLE_PRIVATE_KEY`: full PEM contents of that `.p8`, including BEGIN/END lines (actual newlines or escaped newline sequences are supported)

Keep these server-only. Do not commit the `.p8` or enter it in frontend config. The function signs a short-lived client secret for the appropriate audience, so this revocation secret needs no six-month manual rotation; the Supabase Apple OAuth provider secret still does.

Apple-linked deletion requires fresh Apple authorization. Native iOS returns a single-use authorization code, which the server exchanges. Website/Android obtains Apple's provider refresh token through Supabase OAuth, returns to a second explicit deletion confirmation, and sends that token to the server only on confirmation. The server verifies Apple's signed ID token and matches its subject to the current user's Apple identity before revocation. A different Apple account, expired code, missing configuration, or failed revocation blocks deletion.

## Delivery and validation

Publish the shared website changes, then run `npm run cap:ios:live` and build the updated iOS app. Its BSBAppleAuth plugin must include `authorizationCode` in the response.

Checks: `deno test --allow-env --node-modules-dir=auto supabase/functions/delete-account/index.test.ts`, `npm run test:accounts`, `npm run test:native-auth`, build/version checks, and iOS simulator compilation. Use a disposable account with study data to test success, refresh after deletion, cancellation, offline behavior, invalid session, wrong Apple account, both native/web Apple deletion, and preservation of another saved account. Do not use an account whose data you need to keep. These real-account flows remain unverified until performed.

Local copies on other devices are not remotely erased. The deleting device clears this account's stored identity/session/snapshot and restores separate guest data. The privacy policy describes this limitation.
