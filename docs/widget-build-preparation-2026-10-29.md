# Widget beta build preparation — October 29, 2026

Includes Lock Screen Scripture/check-in and streak choices, favorite Home Screen passages, and Big Screen Bible headers. Visible feed citations omit Heartlight, while source metadata, in-app credits, and translation labels remain. Bundled web version: `2026.10.29.2`.

## iOS — upload-ready

- Version **1.0 (4)** verified for both app and ScriptureWidget in the exported IPA.
- `store-builds/2026-10-29/BigScreenBible-1.0-build4-AppStore.ipa`.
- SHA-256: `3f0b975cb4231ae85a1d4574a5f35cbc20f841f760e2456bbf1b295d8a6c2db7`.
- Signed archive: `store-builds/2026-10-29/BigScreenBible-1.0-build4.xcarchive`.
- Automatic export succeeded. Both distribution profiles retain `group.com.bigscreenbible.app` and `get-task-allow=false`. Exported app/extension deep signature verification passed.
- Export settings permit external TestFlight distribution. No upload was performed.
- Logs: `/tmp/bsb-ios-build4-archive.log`, `/tmp/bsb-ios-build4-export.log`.

## Android — upload-ready

- Version **1.0 (5)** configured; signed release bundle generation succeeded in Android Studio.
- JAR signature verification passed. Upload certificate SHA-256 matches previous betas: `E6:7A:6A:E9:9E:72:3D:C0:9F:8D:7D:FD:23:BE:80:B9:18:E7:51:16:6A:A9:A9:90:48:00:40:91:19:07:E6:49`. Existing saved signing credentials were used; no credentials were extracted or changed.
- Upload artifact: `store-builds/2026-10-29/BigScreenBible-1.0-build5-signed.aab`.
- Original output: `store-builds/2026-10-29/android-build5-signed/release/app-release.aab`.
- SHA-256: `63b102acdad6badc7bcaf16fa97650993efbf9dd4595e76a468f725ab0029452`.
- No upload was performed.

## Validation

JavaScript widget checks and Swift citation/favorite data tests passed. Android instrumentation passed both tests, including 48 Scripture/streak rendering combinations and assertions that the branded header is visible and the Heartlight label is absent. Signed iOS archive/export passed. Physical Samsung A16 Lock Screen placement and installed iOS accessory rendering remain device QA.

## Suggested beta notes

New Lock Screen Scripture and reading-streak widgets where supported. Select verses in Reader and choose Use in widget to save a favorite Home Screen passage. Widget headers now show Big Screen Bible branding. Try daily/favorite content, light/dark/custom colors, resizing, passage taps, and daily check-ins.
