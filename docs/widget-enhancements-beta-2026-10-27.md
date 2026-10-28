# Expanded widgets beta — October 27, 2026

Includes `38d1b86` (larger widgets and app/device/custom background appearance), with bundled web version `2026.10.27.1`. The live website version was independently verified as `2026.10.27.1` during upload.

## iOS

User updated App and ScriptureWidget to version **1.0 (3)**. Both target versions were verified inside the signed archive. Xcode archive and certificate-aware deep signature verification passed. App Store Connect upload completed successfully at 8:53 p.m. Eastern. The upload permits external TestFlight testing.

Processing completed. Build `a41214bc-e06f-4bca-84e2-2615520568c9` has both existing tester groups assigned (internal: 1, family external: 19 at submission). Widget testing notes were saved, external Submit for Review completed with automatic tester notifications enabled, and the final iOS builds table showed **build 3: Testing**.

Ignored archive: `store-builds/2026-10-27/BigScreenBible-1.0-build3.xcarchive`.

Logs: `/tmp/bsb-ios-build3-archive.log`, `/tmp/bsb-ios-build3-upload.log`.

## Android

Signed release **1.0 (4) - Widget sizes and colors** uploaded directly to the existing closed Alpha track at 100% rollout. Publishing overview confirmed **Changes in review** and **1 change sent for review**. Managed publishing remains off. The internal track was not changed.

Ignored bundle: `store-builds/2026-10-27/android-build4-signed/release/app-release.aab`.

SHA-256: `b9d5ed1dba9cead0467efa15dbf47e3e6fd26b264cefe7cfdb283495533c7695`.

Android Studio used the existing saved signing credentials. JAR verification passed. Play accepted build 4 with two nonblocking warnings: absent deobfuscation mapping (minification is disabled) and native debug symbols.

No production release was submitted on either platform. Physical-device gallery, size, and appearance testing remains necessary for these new builds.
