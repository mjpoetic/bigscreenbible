# Widget beta — October 26, 2026

Native version **1.0 (2)** on both platforms. Bundled web version `2026.10.25.1`; the native shells continue loading `https://bigscreenbible.com` online.

## Artifacts

Ignored local files under `store-builds/2026-10-26/`:

- `BigScreenBible-1.0-build2-AppStore.ipa` — SHA-256 `bd40b302018ebeb4f105b3a458fd57c542a53a0a3564f4505a26434a45fcf484`.
- `BigScreenBible-1.0-build2.xcarchive` — signed archive including `ScriptureWidget.appex`.
- `BigScreenBible-1.0-build2-signed.aab` — SHA-256 `07a274b81a0cbd88d7803f4fed19f3488e6b8175efb8e88772a18717c3f697d3`.

The Android upload certificate SHA-256 is `E6:7A:6A:E9:9E:72:3D:C0:9F:8D:7D:FD:23:BE:80:B9:18:E7:51:16:6A:A9:A9:90:48:00:40:91:19:07:E6:49`, matching the signed build 1 candidate. Android Studio used the existing saved signing credentials; passwords were not extracted or written into this repository.

The exported iOS app and widget both report version 1.0/build 2. Their distribution profiles contain `group.com.bigscreenbible.app` and `get-task-allow=false`; the app has production APNs. The App Group/provisioning updates were explicitly approved by Dane. Xcode archive, export, signature verification, and upload succeeded. App Store Connect confirmed build 2 processing at 10:08 p.m. Eastern.

## Beta scope

- Scripture + Streak widgets, automatic light/dark appearance, daily feed and bundled KJV fallback, passage deep links, and local streak updates.
- Small/medium iOS Home Screen sizes and rectangular Lock Screen accessory; resizable Android Home Screen widget.
- Native backgrounding captures the existing live website's reading-streak value so check-ins work before publishing the new JavaScript bridge. Only streak count and check-in dates are shared.

## Validation and caveats

Widget/catalog, native-link, streak, verse-of-day, and launcher-shortcut tests passed. Native iOS archive/export and Android signed release bundle builds succeeded. iOS group entitlements and matching native version numbers were verified in the exported package.

Google accepted version code 2 with no blocking validation errors and three warnings: increased download size, absent deobfuscation mapping, and absent native debug symbols. Minification remains disabled, as before. Play reported no loss of supported devices. New-install delivery is about 128 MB; the existing release was smaller. These warnings did not prevent the internal beta rollout.

Widget gallery placement, long verses, midnight/offline refreshes, signed-device tap behavior, and account/check-in changes still need beta-device testing. Android instrumentation APKs compiled, but the emulator's unauthorized ADB connection prevented runtime execution; these tests are not claimed as passed.

## Distribution state

- **Android internal:** Play confirmed `1.0 (2) - Scripture widgets beta` is **Available to internal testers**, released October 26 at 10:10 p.m. Eastern.
- **Android closed Alpha:** the same bundle was promoted to the existing track at 100%, saved, and sent for review. Publishing overview confirmed **Changes in review** with automated quick checks running; the rollout publishes after approval with the existing managed-publishing setting off.
- **iOS:** Xcode confirmed upload success at 10:08 p.m. Eastern. Processing completed; build 2 is assigned to the existing internal group (1 tester) and family external group (12 testers). Widget-specific What to Test notes were saved and Submit for Review completed for the family group, with the existing automatic tester-notification option enabled.

No production/public-store release was submitted. Existing tester groups and track audiences were retained.

Final App Store Connect verification showed **build 2: Testing**, expiring in 90 days, assigned to both existing groups with 13 total invitations. The prior build remains available as well. The Android closed-track update remains subject to Google's checks/review; no approval is claimed.
