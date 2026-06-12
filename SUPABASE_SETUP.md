# Supabase setup for Big Screen Bible

Use this when you are ready to turn on account sync for settings, bookmarks, notes, highlights, history, and reading streaks.

## 1. Create or open your Supabase project

In Supabase, create a project for Big Screen Bible or open the one you already made.

## 2. Add the sync table

Open the Supabase SQL Editor, paste the contents of `supabase/schema.sql`, and run it.

This creates one private sync row per signed-in user. Row Level Security is enabled so a user can only read or update their own saved data.

## 3. Configure authentication URLs

In Supabase, open Authentication settings and set:

- Site URL: `https://bigscreenbible.com`
- Redirect URLs: `https://bigscreenbible.com/**`

For local testing from a temporary local server, you can also add:

- `http://localhost:8000/**`
- `http://127.0.0.1:8000/**`

Email/password sign-in does not require a redirect after every sign-in, but these URLs matter for confirmation emails, password recovery, OAuth providers, and future passkey work.

If Google sign-in is enabled, Supabase can automatically link identities that share the same verified email address. Big Screen Bible does not link accounts by email itself; it always syncs with the Supabase `session.user.id` returned after sign-in.

## 4. Add the public browser keys

Open your Supabase project settings and copy:

- Project URL
- Publishable key, or the legacy public `anon` key

Paste them into `assets/supabase-config.js`:

```js
window.BigScreenBibleSupabase = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY",
  // Optional: override where password reset links return.
  // redirectTo: "https://bigscreenbible.com/",
};
```

Do not put the service role key in the website. The publishable or anon key is intended for browser use, and the table policies protect user data.

## 5. Test sign in

Open the site, go to Settings, and use Account sync.

When signed in, the app syncs:

- Theme, font, text size, version, startup, display, and game preferences
- Bookmarks
- Notes
- Highlights
- Reading history
- Reading streak

If you see a Row Level Security insert error, confirm that the app is signed in with an active Supabase session. The sync code writes `user_id` from `session.user.id`; it never uses the email address as the user id.

## 6. Passkeys later

The current implementation uses Supabase email/password auth first. Device passkeys can be added later when we choose the exact WebAuthn/passkey provider path. The sync table can stay the same.

## 7. Optional: ESV API proxy

The ESV is licensed through Crossway's API, so Big Screen Bible does not store a full ESV text file in the public repo. Instead, the browser calls a Supabase Edge Function and the function calls Crossway with a private API token.

1. Request an ESV API key from Crossway for your non-commercial use case.
2. Add `ESV_API_KEY` as a Supabase project secret in the Supabase dashboard.
3. Add a GitHub repository secret named `SUPABASE_ACCESS_TOKEN`.

You can create the access token in Supabase from Account settings → Access Tokens. Do not commit this token to the repo.

4. Commit and push the included GitHub Actions workflow:

- `.github/workflows/deploy-supabase-functions.yml`
- `supabase/config.toml`
- `supabase/functions/esv-passage/index.ts`

The workflow deploys the `esv-passage` function to project `yyldnatfhzobyeqnvqjv` without requiring the Supabase CLI on your Mac.

5. In GitHub, open Actions → Deploy Supabase Edge Functions → Run workflow.

If you ever want to deploy from a machine where the Supabase CLI works, the equivalent commands are:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set ESV_API_KEY=YOUR_CROSSWAY_ESV_API_KEY
supabase functions deploy esv-passage --no-verify-jwt
```

The included `supabase/config.toml` keeps JWT verification off for this one function so visitors can read ESV without signing in. The function still does not expose the Crossway API token.

The website only contains the public Supabase publishable/anon key. The Crossway token stays in Supabase and is never committed to GitHub or exposed in the browser.
