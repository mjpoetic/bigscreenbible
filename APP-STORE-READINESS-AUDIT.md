# App store readiness audit — October 10, 2026

## Decision

Begin submission preparation immediately. The app is far enough along to aim for first TestFlight and Google Play testing uploads during October 12–16. It is **not ready for an unconditional production submission today**. Android has a reproduced release build failure and account verification gates; both platforms need signed build validation, device acceptance tests, accurate store disclosures, and a decision on social safety controls.

iOS production review during October 12–16 is a conditional target, not a commitment. Android production timing depends on account testing requirements. New personal accounts need 12 testers opted in continuously for 14 days, followed by production-access approval. An upload to a testing track is different from submission for public distribution.

## Scope and evidence

Audited repository commit `74a9fab`, shared web release `2026.10.09.3`, native project configuration, live public pages, deployed Supabase function inventory/security advisors, and the accessible Play Console account. The working tree was clean before the audit. This audit adds documentation only; it does not modify application behavior, publish changes, accept agreements, or submit builds.

The user confirmed neither store has an uploaded build. App Store Connect reached its login page, so membership, agreements, app record, certificates, metadata and build acceptance could not be inspected. Physical device behavior, real authentication/deletion, publisher permission records and support mailbox delivery were not established. This is a broad engineering and policy readiness audit, not a claim that those unobserved checks passed.

## Confirmed findings

| Priority | Finding | Required result before production submission |
| --- | --- | --- |
| Blocker | Android `:app:bundleRelease` fails at `:app:mergeReleaseResources`: `android/app/src/main/res/xml/config 4.xml` contains an invalid resource filename. `config 2.xml` and `config 3.xml` also exist. | Remove or relocate redundant copies after checking their contents; retain the canonical resource, then build successfully. Investigate how duplicate files recur. |
| Blocker | Play Console identifies a personal account and requires Android-device access verification and contact-phone verification. It shows no app records and disables Create app. An identity-verification success notification is present. | Finish remaining account verification in Play Console and the Play Console Android app, then create the app record. Do not repeat completed identity verification unless Google asks. |
| High | Discoverable social profiles expose user-entered usernames and display names. Validation checks syntax, reserved names and length. No abuse reporting, user blocking or objectionable-content filtering was found in the inspected UI/schema. Removing a friend does not prevent another request. | Treat as a likely UGC/social policy gap. Implement moderation, reporting, effective server-enforced blocking and a response process, or remove the exposed social experience from the initial release. App review determines applicability. |
| High | Both native public asset folders report `2026.10.08.10`; live/root release is `2026.10.09.3`. Each native folder contains 126 files absent from `www`, many numbered duplicate copies, and 13 canonical file differences. Each is approximately 206 MB versus `www` at 107 MB. | Clean the source/generated duplicates, rebuild and sync both platforms, inspect actual packaged assets and offline fallback. A sync alone may copy source duplicates again. |
| Required gate | iOS Release compilation succeeds with signing disabled. This is not an archive/export/validation success. Android release configuration has no signingConfigs/signingConfig assignment. | Produce an App Store distribution archive and signed Android AAB with the intended upload key; validate/upload to the testing services. Android Studio can supply signing separately, so absence in Gradle is not proof no key exists. |
| Required gate | Native versions are `1.0` / build `1` on both platforms; shared web version is independently managed. | Confirm store history and select valid unused build numbers. `1.0`/`1` can be appropriate for a first upload; their values are not themselves defects. |

## What passed

- 89 of 91 existing JavaScript test scripts passed. `rotation.test.mjs` fails because its isolated VM lacks `deferViewportRefreshForActiveInput`; `ylt.test.mjs` lacks `applyFootnoteMetadata`. These appear to be stale test harness dependencies, not demonstrated runtime defects. Repair the tests and rerun before treating the suite as green.
- 35 Deno tests passed across account deletion, APNs, FCM and ESV/YouVersion/API.Bible passage parsing.
- iOS Release build using Xcode 27 / iOS SDK 27 succeeded with `CODE_SIGNING_ALLOWED=NO`. Current Apple minimums are Xcode 26 / iOS SDK 26 and deployment target iOS 13 or later; the project targets iOS 15.
- Android compile and target SDK are 36, matching current new-app requirements. Minimum SDK is 24. Firebase client configuration exists and release push configuration verification ran successfully before the resource failure.
- Public home, privacy, terms, Apple association, Android association and application JavaScript returned HTTP 200 and matched local source byte-for-byte. The live browser loaded Scripture and attribution successfully. Shared app version consistency check passed.
- iOS has Apple sign-in and associated-domain entitlements; Release push is configured for production. Native Apple authentication and deletion-with-revocation paths exist. Account deletion validates the current user server-side.
- Required backend functions are ACTIVE, including passage providers, account deletion, push registration/delivery and semantic search. Function presence does not establish credential correctness or end-to-end behavior.
- The deployed `nlt-footnotes-diagnostic` now returns HTTP 410 with “Diagnostic retired”; its retained deployment is not an active diagnostic data endpoint.

## Store policy and disclosure work

1. **Privacy labels/Data safety:** Prepare answers from actual off-device collection, including account names/email, user IDs, synced notes and other study content, reading/game activity, profiles/social graph, push/device identifiers, and service-provider handling. Evaluate whether synced religious study content requires a sensitive-information declaration. Optional account use does not automatically exempt ongoing collection. Do not claim “no data collected.” Review APNs/FCM, authentication, font/CDN, Scripture-provider and semantic-search data handling. Verify applicable collection versus sharing exemptions for each store.
2. **Deletion web URL:** The live privacy page includes website/app deletion instructions and a support email for deletion requests. A separate page is not inherently mandatory. `https://bigscreenbible.com/privacy/#choices` has a verified section anchor and is a candidate, subject to verifying that the linked section is prominent and the request path/mailbox works. Test email/password, Google and Apple deletion with disposable accounts; Apple revocation is a required part of the Apple flow. Check deletion cascades include current multiplayer game records.
3. **iOS privacy manifests:** Capacitor and Cordova privacy manifests are present in the compiled app. No separate app manifest was found. Absence alone does not prove noncompliance: inspect required-reason API use and the archive privacy report, then resolve any upload validation warnings. A store privacy label remains required separately.
4. **Audience/age ratings:** Complete the actual Apple age-rating and Google content-rating/target-audience questionnaires. Do not assume Bible content means every questionnaire answer is “none.” Discoverable profiles, multiplayer activity, external content and references to children affect the assessment. If children are in the intended audience, assess Families/Kids requirements and the account/social experience; parental-supervision wording alone does not complete compliance.
5. **Content rights:** Collect current provider/publisher authorization covering mobile distribution and the intended territories/use. Existing attribution and working APIs are positive evidence, but not proof of app-store distribution rights. Check ESV, API.Bible translations, YouVersion translations, bundled texts, dictionaries, cross-references, fonts and audio. Preserve notices, limits and applicable usage reporting.
6. **Web-based app review:** The app provides reader/study/games/offline/native features that support a useful app experience. Explain those clearly in review notes. Apple minimum-functionality review remains discretionary. Keep the live site stable during review; material remote changes must remain within store policy.
7. **Links and permissions:** The public association files are reachable. Match Android assetlinks to the Play **app signing** certificate, not only a local/debug/upload certificate; the current file has one fingerprint. Test installed universal/app links, auth callbacks and notification cold-start routes. Inspect merged release permissions, native libraries and 16 KB page-size compatibility in the final AAB; the failed build prevented final-bundle verification.
8. **Listing package:** Finalize icons, required iPhone/iPad and Android screenshots, Play feature graphic, descriptions, category, support URL/email, privacy/deletion URLs, review contact, reproducible review instructions and review credentials for account features. No complete store listing package was established. Confirm membership/account agreements, distribution countries, trader status where applicable, pricing, ads declarations and export-compliance answers. No paid flow was identified in the inspected app; recheck final listing and release behavior.

The privacy policy's displayed “Last updated” date is July 28 despite later feature text. Reconcile that date when finalizing disclosures.

## Backend security observations

Supabase security advisors returned no ERROR-level findings, two categories of WARN and informational RLS findings. This is not a penetration test or proof of complete security.

- Leaked-password protection is disabled. Enable if available under the project plan and verify behavior; this is a recommended hardening step rather than a demonstrated store-upload blocker. [Guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Two exposed SECURITY DEFINER game-room functions are callable by authenticated users. Their live definitions include authentication, friendship/host checks and an empty search path; the warning does not by itself demonstrate a vulnerability. Retain and test authorization boundaries. [Advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Four backend-managed tables have RLS enabled with no policies, consistent with denying ordinary client access. Do not add permissive policies just to silence the informational advisor. [Advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Device acceptance gate

Use the final signed candidate on a physical iPhone, iPad and Android phone; include portrait/landscape and supported OS coverage. Record device/build, steps and results for:

- Fresh install, ordinary relaunch, offline first launch/recovery and bundled translation access; licensed-provider failures must fail clearly.
- Email/Google/Apple sign-in, cancellation, returning sessions, Hide My Email, sign-out/account switching, sync ownership and disposable-account deletion/revocation.
- Reading/navigation, search and keyboard dismissal, footnotes/attribution, font scaling, VoiceOver/TalkBack, Read Aloud, selection, rotation and safe areas.
- Reminders/social notifications in foreground/background/normal closed state, permission denial/recovery, cold-start taps, sign-out/account changes and opt-out.
- Games/multiplayer, interruption/resume, sharing, printing and verified links. Test social safety if included.

Automated mocks and compilation cannot replace these checks. Native Read Aloud, Apple authorization, production APNs, FCM taps and real deletion remain acceptance gates until recorded.

## Proposed schedule

| Window | Work and decision |
| --- | --- |
| October 10–12 | Finish Play account verification; secure App Store Connect access; resolve resource/source duplicates; decide social safety scope; confirm publisher rights. |
| October 12–14 | Repair test harnesses, clean/rebuild/sync, make signed archive/AAB, validate privacy reports and permissions, perform essential device checks. Upload TestFlight/internal test candidates when these gates pass. |
| October 14–16 | Complete listings/disclosures/screenshots/review access, finish device acceptance tests. Submit iOS for production review if all gates pass. Start Play closed testing as soon as its requirements are satisfied. |
| Android after qualifying test | If the new-personal-account rule applies, maintain 12 opted-in testers continuously for 14 days, then apply for production access. If all 12 qualify starting October 12, the earliest eligibility is approximately October 26, plus access approval and app review. A later start moves this date. |

Planning estimate: approximately 3–5 focused working days for release preparation if rights, access and device checks resolve promptly; social controls or provider issues could extend this. The Android testing clock and store review times are external dependencies. Do not announce an approved/public release date yet.

## Official requirements checked

- [Apple current submission requirements](https://developer.apple.com/news/upcoming-requirements/)
- [Apple review guidelines: UGC, functionality, login and deletion](https://developer.apple.com/app-store/review/guidelines/)
- [Apple privacy disclosures](https://developer.apple.com/app-store/app-privacy-details/)
- [Capacitor privacy manifests](https://capacitorjs.com/docs/ios/privacy-manifest)
- [Google target SDK requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [Google new personal account testing](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Google account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Google UGC policy](https://support.google.com/googleplay/android-developer/answer/9876937)
- [Android 16 KB page-size compatibility](https://developer.android.com/guide/practices/page-sizes)

## October 11 moderation update

The social safeguards and private moderation dashboard were implemented after this audit. Dane confirmed the other social controls work. Moderator authenticator enrollment, recent-MFA enforcement, private email queuing, and a moderator-only Account shortcut were added in web release `2026.10.11.22`. Automated authorization, account-switching, delivery-retry, and privacy checks passed. The four moderator accounts require their own authenticator enrollment. A live scheduler check reports missing email sender configuration, so alerts are not yet delivering.

This closes specific implementation gaps; it does not certify the entire Developer Program Policies declaration. Mobile content rights remain unverified in this task, and the native encryption/export classification has not been completed. Do not treat app creation declarations as a substitute for those reviews. [Google app setup](https://support.google.com/googleplay/android-developer/answer/9859152), [Google intellectual property policy](https://support.google.com/googleplay/android-developer/answer/9888072), [BIS encryption guidance](https://www.bis.gov/learn-support/encryption-controls).

## October 11 Read Aloud restriction

In release `2026.10.11.23`, the app's Read Aloud is disabled for NLT, NKJV, and CEV at Dane's request while permissions are reviewed. A Parallel workspace containing any of these translations disables speech for the entire workspace. The speech engine is not initialized for restricted content; text preferences, passage navigation, and selectable Scripture remain available. Regression checks cover all three versions across reading modes, mixed Parallel content, and programmatically triggered playback. Mobile web assets were rebuilt; physical-device validation and native release packaging remain pending.

API.Bible's current terms include a limited ephemeral TTS permission for specified CEV editions (Section 9.10); CEV remains disabled as requested until edition and conditions are confirmed. Pro alone does not remove the general copyrighted-content TTS restriction. [API.Bible terms](https://api.bible/terms-and-conditions).

The moderation email setup has since been completed: Resend accepted the delivery test, and Dane confirmed receipt. Dane also reported completing authenticator setup; enrollment on every alternate moderator account has not been independently confirmed.

Release `2026.10.11.25` extends the same Read Aloud restriction to NIV, NIrV, NASB 2020 (including the NASB display alias), and AMP at Dane's request pending permission. The existing NLT, NKJV, and CEV restrictions remain. Regression checks cover every restricted code in Reader, Focus, Big Screen, and mixed Parallel workspaces and ensure restricted content does not initialize the speech engine. This precaution does not revoke or dispute the active YouVersion text licenses observed in the portal.

## October 11 publisher attribution and remaining gates

Release `2026.10.11.27` adds fixed HTTPS publisher links alongside remote translation notices: Biblica (NIV/NIrV), Lockman (NASB/AMP), Tyndale (NLT), Thomas Nelson (NKJV), American Bible Society (CEV), and Crossway (ESV). API.Bible translations also link to API.Bible. Copyright strings remain escaped, and duplicate notices no longer suppress different publisher links. ESV now receives a short notice with a link to the complete copyright notice and copying limits in Terms. The shared renderer supplies Reader, Parallel, Big Screen, reference previews, shared passages, footnotes, and print output; immersive reading copies these attribution nodes. Provider, screen-reading, sharing, printing, syntax, version, and mobile web build checks passed. Native device appearance has not been verified.

Active Biblica and Lockman text licenses were observed in the YouVersion portal in the preceding licensing review. Still obtain confirmation that Biblica's prior written approval covers the new iOS/Android release and that Lockman's SDK wording covers this server-side REST integration. These are scope questions, not a finding that accepted text licenses are absent.

The cache review identified an unresolved implementation gap: `ensureRemoteBibleVersion` fetches with `cache: "no-store"`, but retains chapters indefinitely in `remoteVersionData` and merges them into `bibleData`. No eviction or age checks were found. A compliant cache fix must remove stale chapter text from both structures, protect visible passages during concurrent loads, and enforce publisher-specific limits. ESV limits local caching to 500 verses and local storage to 500 verses or half a book, whichever is less. API.Bible requires cached content to be refreshed at least every 30 days. Repeated reading can currently exceed these limits even without offline downloads. [ESV API terms](https://www.esv.org/api/), [API.Bible terms](https://api.bible/terms-and-conditions).

Export classification remains open. Native iOS code uses CryptoKit SHA-256 for the Sign in with Apple nonce; no custom encryption algorithm was found in the focused native source search. This is not a complete dependency or binary review. `ITSAppUsesNonExemptEncryption` is not set. Review the built app's networking, authentication, bundled dependencies, and distribution countries before setting that value or certifying the export declaration. [Apple export-compliance guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/).

Next sequence: resolve cache limits and licensing scope questions, complete encryption classification, then create signed builds for TestFlight and Play testing. Store privacy disclosures, account deletion, reviewer access, screenshots, and production-access eligibility still require final reconciliation against the actual release builds.

## October 11 bounded remote cache update

Release `2026.10.11.28` replaces indefinite accumulation with at most two cached chapters per remote translation and a 24-hour expiry. ESV additionally has a 500-verse cache ceiling, including verse ranges; oversized responses are rejected. Eviction removes translation text and translation-specific notes, headings, ranges, red-letter offsets, and line breaks from merged reading data. Empty rows created only by an evicted remote translation are removed, while other translations remain. Replacement responses clear omitted verses and metadata. Cache reads update recency; ordinary-size concurrent preview completions preserve the main reading chapter. Expiry is checked on loading, rendering, preview opening, visibility changes, and a minute timer. Expired text is fetched again instead of reused.

Automated checks cover bounds, expiry, replacement, cross-translation isolation, duplicate fetch coalescing, out-of-order responses, active-chapter retention, and refetch. Loading, preview, screen-reading, and offline regressions passed. These checks are source/runtime evidence; physical-device validation remains pending.

This closes the unbounded chapter accumulation and missing freshness policy. It does not close the separate ESV half-book storage/display restrictions, copied text in existing dialogs, publisher-specific display limits, or aggregate server/API request quotas. The full-chapter ESV model needs a decision for short books before release: obtain clarified permission, implement bounded passage windows throughout every reading view, or restrict affected passages with a clear publisher link. Do not certify ESV compliance solely from the 500-verse ceiling. [ESV conditions](https://www.esv.org/api/), [API.Bible freshness requirement](https://api.bible/terms-and-conditions).

### Publisher scope questions ready for review

- Biblica: Our free Big Screen Bible app already has an accepted YouVersion text license for NIV and NIrV. It currently runs on the web and will be distributed through Apple's App Store and Google Play using Capacitor shells. Does the existing approval cover these mobile releases, or do you require a new prospectus and prior written approval? Please confirm the applicable display, cache, and digital protection requirements for this implementation.
- Lockman / YouVersion: Our free app has an accepted YouVersion text license for NASB 2020 and AMP. The app obtains passages through a server-side YouVersion REST integration rather than a YouVersion client SDK. Does this satisfy the agreement's SDK wording for web, iOS, and Android distribution, or should we change the integration?

These questions have been prepared only; no email or support request has been sent. Read Aloud remains disabled for these translations pending permission.

## October 11 publisher clarification handoff

Dane chose to keep ESV unchanged while requesting clarification from Crossway. The half-book storage/display issue remains open; no affected passage has been disabled and the existing bounded cache remains. Complete, unsent requests for Crossway, Biblica, and Lockman/YouVersion are prepared in [publisher-permission-requests.md](docs/publisher-permission-requests.md). Crossway's licensing contact is verified against its official API page. Biblica and Lockman requests should use the existing licensing/support channels rather than an unverified email address. Preserve replies as release evidence before closing these gates.

A further source inventory confirmed iOS CryptoKit SHA-256 is used for the Apple sign-in nonce, Capacitor is pinned to 8.4.1 in the Swift package resolution, and the web page loads Supabase JS 2.110.1 plus the API.Bible FUM script. The source search did not find custom encryption/decryption implementations in app-owned web or native source. External JavaScript and transitive native dependencies have not been fully reviewed, so this does not yet justify setting the encryption exemption flag. Apple provides its encryption questionnaire in App Store Connect under App Information → App Encryption Documentation, or through Manage on a build missing encryption information. [Apple guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-app-encryption-documentation/).

## October 11 encryption technical review

The app-owned source, declared native dependencies, and exact loaded Supabase/FUM JavaScript snapshots were reviewed. The identified iOS cryptographic operations use Apple's OS APIs: HTTPS through WebKit/URLSession, SHA-256 through CryptoKit/CommonCrypto/Web Crypto, and signature verification through Web Crypto. No custom data cipher was identified. `ITSAppUsesNonExemptEncryption` is now Boolean false in the iOS source Info.plist, consistent with Apple's OS-only documentation exemption. See [export-compliance-review.md](docs/export-compliance-review.md) for versions, snapshot hashes, console-answer guidance, primary sources, and limitations.

This closes the technical source/configuration review. It does not record an Apple decision, a formal BIS classification, a completed Google legal declaration, or verification of the final signed binaries. Before upload, confirm the flag and reviewed dependency set in the final archive and recheck remotely loaded scripts. Actual build processing and distribution/export obligations remain part of submission. Existing publisher scope questions are unchanged.

## October 11 native release candidates

A signed iOS Release archive and App Store distribution IPA were produced. The exported signature, App Store profile, production APNs entitlement, and Boolean encryption exemption flag were verified. Android release compilation was repaired by preserving/removing seven invalid duplicate resource files and upgrading the transitive DataStore library through an explicit stable 1.2.1 dependency. The resulting release AAB and APK build successfully; 64-bit ELF LOAD/GNU_RELRO and APK ZIP alignment checks pass. Android remains unsigned; only a debug keystore was found in the limited locations searched, and Dane is unsure whether an upload key exists elsewhere.

Local artifacts, hashes, detailed evidence, and signing instructions are recorded in [store-build-handoff.md](docs/store-build-handoff.md). No store upload occurred. This supersedes the original Android compilation failure and the earlier unsigned-only iOS build evidence; physical-device QA, final Android signing, store validation/disclosures, testing eligibility, and publisher scope confirmations remain open.
