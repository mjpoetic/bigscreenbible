# Android widget fix beta — October 27, 2026

Native Android version **1.0 (3)** includes commit `3fff7fc`, replacing the unsupported plain `View` divider in the RemoteViews widget layout with a supported `TextView`. The same layout supplies the launcher preview and installed widget.

The widget regression checks and Android debug build passed. Android Studio generated the signed release bundle using the existing saved upload-key credentials. JAR signature verification passed and the upload certificate SHA-256 matches build 2: `E6:7A:6A:E9:9E:72:3D:C0:9F:8D:7D:FD:23:BE:80:B9:18:E7:51:16:6A:A9:A9:90:48:00:40:91:19:07:E6:49`.

Ignored artifact: `store-builds/2026-10-27/android-signed/release/app-release.aab`.

Bundle SHA-256: `72310a0af31a3658ee803ea031b82a70c5d446076a495acb6e88203acd08f141`.

Actual launcher rendering on a beta device remains to be verified after installation.

Google Play accepted version code 3. The closed Alpha release `1.0 (3) - Android widget fix` was saved at 100% rollout and submitted. Publishing overview confirmed **Changes in review** and **1 change sent for review**, with automated quick checks running. Managed publishing is off, so the approved update publishes automatically. No production release was submitted.

There were two nonblocking warnings for missing deobfuscation mapping (minification remains disabled) and native debug symbols. Play reported no loss of supported devices. This update was submitted directly to closed Alpha; the internal track was not changed.
