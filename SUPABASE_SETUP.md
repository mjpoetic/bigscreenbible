# Supabase setup for Big Screen Bible

Use this when you are ready to turn on account sync, signed-in social profiles, friendships, and live friend game challenges.

## 1. Create or open your Supabase project

In Supabase, create a project for Big Screen Bible or open the one you already made.

## 2. Add the account tables

Open the Supabase SQL Editor, paste the contents of `supabase/schema.sql`, and run it.

This creates:

- One private sync row per signed-in user for settings and study data.
- One optional social-profile row per signed-in user with a unique username, optional display name, selected avatar, and privacy preferences.
- One relationship row for each pending friend request or accepted friendship.
- One challenge row for each friend game invitation, plus two participant rows for ready state, live score, progress, and completion.

Row Level Security keeps sync rows private. A social profile is always readable by its owner; other signed-in users can read it when the owner enables discovery or when a friend-request relationship exists between the two users. Anonymous visitors cannot read profile, friendship, or challenge rows, and email addresses are never stored in those tables.

The schema includes explicit, least-privilege Data API grants for `bsb_profiles`, `bsb_friendships`, `bsb_game_challenges`, and `bsb_game_challenge_players`. These grants are separate from the row-level policies.

Friendship policies enforce that:

- Only the requester and recipient can read a relationship.
- A request can be created only by its requester and only when the recipient is discoverable and accepts requests.
- Only the recipient can accept a pending request.
- Either participant can cancel, decline, or remove their relationship.
- Crossed or duplicate relationships for the same pair are rejected.

Game-challenge policies enforce that:

- Only accepted friends can create a challenge.
- Only the two participants can read its invitation, setup, score, progress, or result.
- Only the recipient can accept or decline a pending invitation. The challenger can cancel a pending invitation, and either participant can end an accepted challenge.
- Each participant can update only their own ready state, score, progress, and completion.
- Only one pending or accepted challenge can exist between the same two people at a time.

The schema also adds both challenge tables to the `supabase_realtime` publication. The app listens for authorized Postgres changes so invitations, ready state, progress, scores, and final results update without a manual refresh.

### Existing projects: enable every avatar choice

Pushing the website does not update an existing Supabase database. If `bsb_profiles` was created before the expanded avatar picker was added, the original check constraint accepts only the six quick choices and rejects the additional choices with Postgres error `23514`.

Open the Supabase SQL Editor, paste the contents of `supabase/update-profile-avatar-options.sql`, and run it once. The script replaces only the `avatar_key` check constraint, preserves all profile rows, and returns the installed constraint definition so you can confirm all 16 avatar keys are present.

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

Open the site, open Account, and sign in.

When signed in, the app syncs:

- Theme, font, text size, version, startup, display, and game preferences
- Bookmarks
- Notes
- Highlights
- Reading history
- Reading streak

The same Account panel lets a signed-in user create a social profile. Usernames:

- Are 3–20 characters.
- Begin with a letter.
- Use lowercase letters, numbers, and underscores.
- Are unique across all accounts, including profiles that have disabled discovery.

The user can separately decide whether the profile appears in signed-in people searches and whether it accepts friend requests. The Friends card supports username search, sending and cancelling requests, accepting or declining incoming requests, viewing friends, and removing a friendship.

Test the full loop with two signed-in accounts:

1. Make both profiles discoverable and enable friend requests.
2. From the first account, find the second username and send a request.
3. From the second account, open Account → Friends → Requests and accept or decline it.
4. Confirm accepted requests appear in both Friends lists.
5. Confirm either account can remove the friendship.

Then test a live challenge:

1. Keep the two accounts connected as friends.
2. From Games, choose a mode and setup, select the friend, and send the challenge.
3. From the other account, open Account → Game challenges and accept it.
4. Mark both players ready and confirm the same seeded game begins for both.
5. Answer on each account and confirm the live score and progress update on the other device.
6. Finish on both accounts and confirm the same final result appears for each player.

Invitations expire after 24 hours; an expired invitation is cleared automatically when the pair starts a new one. Either player can end an accepted challenge for both participants. Phase 3 uses client-reported casual-game scores; it is designed for friendly play, not prize competitions or anti-cheat enforcement.

The signed-in Account panel also includes **Switch account**. The browser keeps a separate local Supabase session for each account the person signs into, so a remembered account marked **Ready to switch** can be opened without entering its password again. The outgoing account is saved before the selected session is activated. Supabase refreshes an expired access token from its refresh token; if a saved session has been revoked or is otherwise invalid, the chooser removes that session and asks the person to sign in once to reconnect it.

Passwords are never stored by the account chooser. **Sign out on this device** removes the active account's reusable local session but leaves other remembered accounts available. **Forget** removes that account's remembered identity, local study snapshot, and reusable session from the browser.

Browser study data is isolated in one snapshot per Supabase user. On a person's first sign-in, existing guest data follows the account as before. During later account switches, bookmarks, notes, highlights, history, streaks, and version-selection timestamps from the outgoing account are not merged into a newly selected account.

Run the focused browser-isolation regression test after changing authentication or cloud-sync behavior:

```sh
npm run test:accounts
```

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
- `supabase/functions/semantic-bible-search/index.ts`

The workflow deploys the Bible provider, Verse of the Day, push-notification, and semantic-search functions to project `yyldnatfhzobyeqnvqjv` without requiring the Supabase CLI on your Mac.

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
supabase functions deploy semantic-bible-search --no-verify-jwt
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

### Semantic Bible search

Natural questions use a hybrid search path: the existing local/provider search continues to run, while `semantic-bible-search` generates a query embedding with Supabase Edge Runtime's built-in English `gte-small` model and retrieves related passages from `public.bsb_semantic_passages` through pgvector.

The semantic corpus is deliberately limited to the bundled World English Bible (WEB). Never index, embed, upload, paraphrase, or otherwise send API.Bible, ESV API, or YouVersion provider text through this semantic pipeline. Once a reference is found, the normal reader may display that reference in the user's selected licensed translation through its existing provider.

`supabase/schema.sql` enables the `vector` extension, creates the 384-dimensional HNSW-backed passage table, and creates the service-role-only similarity RPC. The table has Row Level Security enabled and grants no direct access to browser roles. The public Edge Function returns only bounded search results and uses `Cache-Control: no-store`; indexing operations additionally require a Supabase server secret.

Generate and check the deterministic corpus without contacting Supabase:

```bash
npm run semantic:corpus -- --book Genesis
npm run test:search
```

For the Genesis pilot, create or copy a secret key from **Supabase Dashboard → Settings → API Keys → Publishable and secret API keys**. Put it in the current shell only, run the importer, and then unset it. The legacy service-role key also remains supported. Never put either credential in `assets/supabase-config.js`, a committed `.env` file, terminal output, or GitHub Actions.

```bash
export SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
npm run semantic:index:genesis
unset SUPABASE_SECRET_KEY
```

After the Genesis pilot is verified, populate the complete WEB corpus and rerun the quality evaluation:

```bash
export SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
npm run semantic:index:all
unset SUPABASE_SECRET_KEY
npm run semantic:evaluate
```

The importer uploads at most eight chunks per request, records a deterministic corpus version, and prunes stale chunks only after a complete scoped run succeeds. If semantic search is unavailable or has not yet been populated, the website silently retains the existing local question-aware results.

### Verse of the Day RSS behavior

- The `verse-of-the-day` Edge Function fetches `https://feeds.feedburner.com/hl-devos-votd` server-side.
- It parses the newest RSS item and keeps only the reference, first verse paragraph, publication time, and original VerseoftheDay.com item URL.
- The daily result is cached in `public.bsb_verse_of_day_cache`. A new cache day begins at 2:00 a.m. `America/Chicago`, matching the feed's publication boundary.
- The cache table has Row Level Security enabled with no public policies. Only the Edge Function service role reads or writes it.
- A failed daily refresh is cached as a failure for that date, and the website uses its existing local curated verse rotation instead.
- The website never requests or scrapes the linked VerseoftheDay.com webpage.

## 8. Daily and social push notifications

Notifications use the browser Push API, the root `push-sw.js` service worker, two Supabase Edge Functions, and the private `public.bsb_push_subscriptions` and `public.bsb_push_events` tables created by `supabase/schema.sql`.

Each subscribed browser can choose its own morning time and optional evening time. The browser sends its IANA timezone, so reminders follow local time and daylight-saving changes. The sender suppresses the evening notification when that subscription has recorded an app open during the same local day. The defaults are 7:00 a.m. and 6:00 p.m.

When a subscribed person is signed in, the device subscription is linked to that Supabase user ID. The person can independently turn off notifications for friend requests, incoming game challenges, and accepted challenges. Database triggers create private delivery events for those actions. The initiating signed-in browser asks the sender to deliver immediately, while the existing cron invocation retries pending events if that request is interrupted. Social notification links open the relevant Friend Requests or Game Challenges area after authentication and data loading.

On account switching or sign-out, the app unlinks the device from the outgoing account before changing the active session. The daily reminder subscription can remain enabled without an account. If the secure unlink request fails, the browser subscription is turned off locally rather than leaving social notifications connected to the outgoing account.

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

The cron wakes the sender for both daily schedules and retryable social events. Each subscription’s user-selected local times determine whether a daily reminder is sent. The sender claims each local delivery date or social event before sending so overlapping calls do not duplicate a notification, and expired browser subscriptions are removed after a `404` or `410` response from the push service. Completed social delivery events are removed after 30 days.

### Platform boundary

This implementation covers supported desktop browsers, Android browsers, and installed web apps. On iPhone and iPad, Web Push requires the website to be added to the Home Screen before notification permission can be granted. The Capacitor App Store wrappers need a separate native APNs/FCM integration; unsupported web views show an explanatory message instead of an enable control.
