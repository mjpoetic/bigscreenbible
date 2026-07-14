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

## 7. Licensed Bible API proxies

Licensed translations are not stored as full-text files in the public repo. The browser calls Supabase Edge Functions, and those functions call the Bible providers with private API keys.

### Secrets

Add these in Supabase Project Settings → Edge Functions → Secrets:

- `ESV_API_KEY` for the Crossway ESV API.
- `API_BIBLE_KEY` for API.Bible. Do not add this key to `assets/supabase-config.js` or any other browser file.
- `YOUVERSION_APP_KEY` for YouVersion Platform. Do not add this key to `assets/supabase-config.js` or any other browser file.

The API.Bible endpoint used by the function is `https://rest.api.bible`.
The YouVersion Platform endpoint used by the function is `https://api.youversion.com`.

Also add a GitHub repository secret named `SUPABASE_ACCESS_TOKEN`.

You can create the access token in Supabase from Account settings → Access Tokens. Do not commit this token to the repo.

4. Commit and push the included GitHub Actions workflow:

- `.github/workflows/deploy-supabase-functions.yml`
- `supabase/config.toml`
- `supabase/functions/esv-passage/index.ts`
- `supabase/functions/api-bible-passage/index.ts`
- `supabase/functions/youversion-passage/index.ts`
- `supabase/functions/verse-of-the-day/index.ts`
- `supabase/functions/push-subscriptions/index.ts`
- `supabase/functions/send-push-notifications/index.ts`

The workflow deploys the Bible provider, Verse of the Day, and push-notification functions to project `yyldnatfhzobyeqnvqjv` without requiring the Supabase CLI on your Mac.

5. In GitHub, open Actions → Deploy Supabase Edge Functions → Run workflow.

If you ever want to deploy from a machine where the Supabase CLI works, the equivalent commands are:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set ESV_API_KEY=YOUR_CROSSWAY_ESV_API_KEY
supabase secrets set API_BIBLE_KEY=YOUR_API_BIBLE_KEY
supabase secrets set YOUVERSION_APP_KEY=YOUR_YOUVERSION_PLATFORM_APP_KEY
supabase functions deploy esv-passage --no-verify-jwt
supabase functions deploy api-bible-passage --no-verify-jwt
supabase functions deploy youversion-passage --no-verify-jwt
supabase functions deploy verse-of-the-day --no-verify-jwt
supabase functions deploy push-subscriptions --no-verify-jwt
supabase functions deploy send-push-notifications --no-verify-jwt
```

The included `supabase/config.toml` keeps JWT verification off for these read-only functions so visitors can read licensed translations without signing in. The provider API keys remain in Supabase and are never returned to the browser.

### Remote Bible behavior

- ESV search requests use Crossway's server-side passage search endpoint through the `esv-passage` Edge Function. Quoted searches are sent as exact phrase searches.
- The function calls `GET /v1/bibles?language=eng&include-full-details=true` and discovers the authorized Bible IDs for NIV, NLT, and NASB 2020 from the API.Bible account.
- Authorized Bible metadata is cached only in Edge Function memory for up to 24 hours. Scripture responses use `Cache-Control: no-store`, so copyrighted text is not placed in a shared or persistent application cache.
- Chapter requests use API.Bible JSON output with notes and chapter numbers disabled. Section headings are kept as display metadata, while formatting markers are removed and the returned verse wording is retained.
- Search requests use API.Bible's server-side search endpoint through the same Edge Function proxy. Quoted searches are filtered to exact phrase matches before results are returned to the browser.
- API.Bible currently limits passage responses to 200 verses. Big Screen Bible requests one chapter at a time, so even Psalm 119 remains below that limit.
- API.Bible FUMS view tokens are forwarded to the browser and reported through the official FUMS web tracker.
- Copyright text returned by API.Bible is displayed with the passage in Reader, Parallel Study, print, and Big Screen Mode.
- API.Bible Scripture text must not be used for AI training, embeddings, LLM fine-tuning, generated paraphrases, or similar derivative model workflows.
- YouVersion Platform requests use the `youversion-passage` Edge Function and the `X-YVP-App-Key` header server-side. The function discovers the authorized AMP Bible ID from `GET /v1/bibles?language_ranges[]=en` and caches only Bible metadata in Edge Function memory for up to 24 hours.
- AMP chapter requests currently fetch the chapter's verse index and then fetch each verse through YouVersion's passage endpoint with notes disabled. Scripture responses use `Cache-Control: no-store`.
- YouVersion's public REST docs do not currently list a Bible search endpoint, so AMP is not included in global remote-provider search yet.
- Copyright text returned by YouVersion metadata is displayed with AMP passages in Reader, Parallel Study, print, and Big Screen Mode.

To inspect which approved editions the function discovered after deployment:

```text
https://YOUR_PROJECT.supabase.co/functions/v1/api-bible-passage?action=bibles
https://YOUR_PROJECT.supabase.co/functions/v1/youversion-passage?action=bibles
```

Send the public Supabase publishable/anon key in the `apikey` and bearer authorization headers, just as the website does. These responses contain Bible IDs and metadata, never `API_BIBLE_KEY` or `YOUVERSION_APP_KEY`.

The website only contains the public Supabase publishable/anon key. Provider secrets stay in Supabase and are never committed to GitHub or exposed in browser code.

### Verse of the Day RSS behavior

- The `verse-of-the-day` Edge Function fetches `https://feeds.feedburner.com/hl-devos-votd` server-side.
- It parses the newest RSS item and keeps only the reference, first verse paragraph, publication time, and original VerseoftheDay.com item URL.
- The daily result is cached in `public.bsb_verse_of_day_cache`. A new cache day begins at 2:00 a.m. `America/Chicago`, matching the feed's publication boundary.
- The cache table has Row Level Security enabled with no public policies. Only the Edge Function service role reads or writes it.
- A failed daily refresh is cached as a failure for that date, and the website uses its existing local curated verse rotation instead.
- The website never requests or scrapes the linked VerseoftheDay.com webpage.

## 8. Daily push notifications

Daily reminders use the browser Push API, the root `push-sw.js` service worker, two Supabase Edge Functions, and the private `public.bsb_push_subscriptions` table created by `supabase/schema.sql`.

Each subscribed browser can choose its own morning time and optional evening time. The browser sends its IANA timezone, so reminders follow local time and daylight-saving changes. The sender suppresses the evening notification when that subscription has recorded an app open during the same local day. The defaults are 7:00 a.m. and 6:00 p.m.

### Generate and store Web Push secrets

Generate one VAPID key pair. Keep the private key secret and reuse this pair; replacing it invalidates existing browser subscriptions.

```bash
npx web-push generate-vapid-keys --json
openssl rand -hex 32
```

The first command prints a public and private VAPID key. The second command prints a separate random value for `PUSH_CRON_SECRET`. Store them as Supabase Edge Function secrets:

```bash
supabase secrets set \
  WEB_PUSH_VAPID_PUBLIC_KEY=YOUR_PUBLIC_VAPID_KEY \
  WEB_PUSH_VAPID_PRIVATE_KEY=YOUR_PRIVATE_VAPID_KEY \
  WEB_PUSH_SUBJECT=mailto:support@bigscreenbible.com \
  PUSH_CRON_SECRET=YOUR_RANDOM_CRON_SECRET
```

Never place the VAPID private key or cron secret in `assets/supabase-config.js`, GitHub Actions variables, or committed files. The public VAPID key is returned to supported browsers by `push-subscriptions` only when the user opts in.

### Schedule the sender

Enable Supabase Cron and `pg_net`, then store the sender URL and the same cron secret in Vault. Replace the placeholder before running this SQL in the Supabase SQL Editor:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://yyldnatfhzobyeqnvqjv.supabase.co/functions/v1/send-push-notifications',
  'bsb_push_sender_url'
);

select vault.create_secret(
  'YOUR_RANDOM_CRON_SECRET',
  'bsb_push_cron_secret'
);

select cron.schedule(
  'bsb-send-daily-push',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'bsb_push_sender_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'bsb_push_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

The cron only wakes the sender. Each subscription’s user-selected local times determine whether anything is sent. The sender claims each local delivery date before sending so overlapping cron calls do not duplicate a reminder, and expired browser subscriptions are removed after a `404` or `410` response from the push service.

### Platform boundary

This implementation covers supported desktop browsers, Android browsers, and installed web apps. On iPhone and iPad, Web Push requires the website to be added to the Home Screen before notification permission can be granted. The Capacitor App Store wrappers need a separate native APNs/FCM integration; unsupported web views show an explanatory message instead of an enable control.
