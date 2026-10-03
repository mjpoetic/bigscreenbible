# Sign in with Apple setup

The shared account panels now offer Continue with Apple. iOS uses AuthenticationServices and exchanges a nonce-bound identity token with Supabase; the website uses Supabase OAuth. Android uses its existing system browser authentication flow.

## Apple Developer

Use team `8QY8QS9TH2` and the existing App ID `com.bigscreenbible.app`.

1. In Certificates, Identifiers & Profiles → Identifiers, open the App ID and enable **Sign in with Apple**. Configure it as the primary App ID for this app and website. The entitlement is already in the project. Refresh provisioning profiles after enabling the capability.
2. Create a **Services ID**, suggested identifier `com.bigscreenbible.app.web`, and enable Sign in with Apple. Select the existing primary App ID.
3. Configure its website domains with `yyldnatfhzobyeqnvqjv.supabase.co` and return URL `https://yyldnatfhzobyeqnvqjv.supabase.co/auth/v1/callback`. This is the Apple OAuth callback; the website itself receives the subsequent Supabase redirect.
4. Create a Sign in with Apple signing key associated with the primary App ID. Download the `.p8` once and keep it securely outside this repository. Record its Key ID.
5. Generate an Apple client-secret JWT with the generator in the official Supabase Apple guide, using the Team ID, Key ID, Services ID, and `.p8`. Enter the resulting secret only into Supabase. Do not put the key or secret in frontend configuration or chat.

## Supabase

Open Authentication → Sign In / Providers → Apple for project `yyldnatfhzobyeqnvqjv`.

- Enable Apple.
- Client IDs: `com.bigscreenbible.app.web,com.bigscreenbible.app` (replace the first identifier if you chose another Services ID). **Services ID must come first** for web OAuth; the bundle ID allows native tokens.
- Secret: the generated Apple client-secret JWT.
- Keep nonce verification enabled.
- Authentication → URL Configuration: Site URL `https://bigscreenbible.com`; allow `https://bigscreenbible.com` and `com.bigscreenbible.app://auth/callback`. Retain existing approved URLs.
- Rotate the web client secret before its expiry (maximum six months). Keep the `.p8` for rotations.

If your auth emails use Apple private relay addresses, register the actual sending domains/email addresses in Apple Developer's Sign in with Apple email communication configuration and verify the sender's SPF/DKIM setup.

Apple may conceal the email address. Supabase user IDs remain the data owners; the app never merges accounts by email. A hidden-email Apple account may be separate from an existing Google/email account. Native first-time authorization supplies a name, which is saved as profile metadata; web OAuth does not provide it, and the existing profile editor remains available.

## Build and verify

After the provider and Apple configuration are saved, run `npm run cap:ios:live` and `npx cap open ios`. Build with updated signing/provisioning, then test on an iPhone: first sign-in, returning sign-in, Hide My Email, cancellation, sign-out, expired saved-account sign-in, and switching accounts with distinct saved data. Test website success/cancel and refresh persistence too. Publish the shared web assets so the live-site iOS shell receives the new button.

Local automated tests/builds do not prove Apple authorization or production provider configuration. No production provider credentials are stored by this implementation.

References: https://supabase.com/docs/guides/auth/social-login/auth-apple and https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/
