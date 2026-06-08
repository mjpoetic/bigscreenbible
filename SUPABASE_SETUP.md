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

## 4. Add the public browser keys

Open your Supabase project settings and copy:

- Project URL
- Publishable key, or the legacy public `anon` key

Paste them into `assets/supabase-config.js`:

```js
window.BigScreenBibleSupabase = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY",
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
