# Scripture + Streak widgets

The first native widget combines a daily verse, the current reading streak, and today's check-in. Tap anywhere to open the displayed passage in Reader. Light/dark appearance follows the device. No notification permission or account is required.

## Available sizes

- iOS 16+: small and medium Home Screen widgets and a rectangular Lock Screen accessory.
- Android 7+: a resizable Home Screen widget; the default is four columns by two rows. Compact widths hide weekly dots and reduce the verse font. The launcher controls exact sizing.

After installing a native build containing these changes, open Big Screen Bible once. Add **Scripture + Streak** from the system widget gallery. On iOS, long-press the Home Screen, choose Edit > Add Widget, and search for Big Screen Bible. On Android, long-press the Home Screen, choose Widgets, and expand Big Screen Bible. Updating only the website cannot install a native widget extension.

## Content and progress

The widget independently requests the existing public `verse-of-the-day` endpoint, using the same public publishable key as the website. Feed text is identified as **Heartlight** rather than incorrectly labeling it as a Bible translation. A tap opens the reference in BSB. If the feed is unavailable, a bundled KJV passage uses the app's curated anchors, seasonal dates, and local day-of-year selection, with a KJV passage link. Long text is truncated in small spaces; the full passage is available in Reader.

Each platform caches the successful verse for the local date. iOS requests an hourly refresh and includes seven future local-midnight fallback entries. Android requests hourly host updates and refreshes local content on date, time, timezone, and locale changes. The OS controls scheduling; refreshes are not guaranteed at an exact minute. No continuous background service or exact alarm is used.

The Capacitor `BSBWidget.sync` bridge publishes only the current streak count, last check-in date, and up to 400 recent check-in dates. It coalesces app renders, skips unchanged snapshots, and retries after a bridge failure. Account tokens, names, notes, and highlights never enter the widget cache. Progress on other devices appears after the app syncs and publishes it locally. Widgets do not independently sign into an account.

The streak remains available on the day after a check-in and displays zero after a missed day, even while the app is closed. Merely viewing a widget does not count as opening the Bible.

## Native setup and builds

Both iOS targets use the App Group `group.com.bigscreenbible.app`. Enable/register that group for the main app and the `com.bigscreenbible.app.ScriptureWidget` extension in the Apple developer account when provisioning a device or store build. Xcode automatic signing may handle registration with the appropriate account permissions. The extension is a dependency of the App target and is embedded in its PlugIns directory. Keep its marketing/build versions aligned with the containing app when preparing a store archive. Shared UserDefaults access is declared in the privacy manifest.

Android uses AppWidgetProvider and RemoteViews with system light/dark resources. No additional runtime library or permission is needed.

Regenerate public offline data after changing curated references, KJV content, or the public endpoint configuration:

```sh
npm run build:widgets
```

Build web assets and sync them before running a locally bundled native build:

```sh
npm run cap:sync
```

## Verification

```sh
npm run test:widgets
node scripts/native-links.test.mjs
npm run test:streak
npm run test:verse-of-day
swiftc -module-cache-path /tmp/bsb-widget-swift-cache ios/App/WidgetShared/WidgetData.swift scripts/widget-data.test.swift -o /tmp/bsb-widget-data-tests
TZ=America/New_York /tmp/bsb-widget-data-tests
TZ=Pacific/Auckland /tmp/bsb-widget-data-tests
```

Also build App for an iOS simulator and `:app:assembleDebug` for Android. On devices, check gallery discovery, both appearances, compact/expanded layouts, long passages, offline and midnight behavior, cold/warm passage taps, and check-in/account changes. Signed-device provisioning and manufacturer-specific launcher behavior require device verification.

The web/mobile build regenerates both native catalogs automatically. The images in `output/widget-previews/ios-medium-*.png` were rendered from the production SwiftUI view in a standalone native renderer (with a fixed sample streak and verse). They are layout previews, not screenshots of an installed Home Screen widget.

### Local validation (2026-10-26)

- iOS simulator App build succeeded, including the embedded widget extension; the containing app installed and launched in the simulator.
- Android debug app and instrumentation APK builds succeeded.
- Widget bridge/catalog tests, existing streak/verse-of-day/native-link/launcher-shortcut checks, and Swift data tests in New York and Auckland timezones passed.
- Standalone SwiftUI renders were inspected in both appearances and with long text. These do not replace testing the widget in the system gallery.
- Android instrumentation tests compiled, but runtime execution was blocked by an unauthorized ADB emulator connection. They have not been reported as passed. With an authorized device/emulator, run `:app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.bigscreenbible.app.ScriptureWidgetTest` (Gradle may need network access for host test-runner dependencies).
- Signed iOS App Group provisioning, actual widget gallery/tap interactions, and physical-device behavior remain to be verified before release.

The native shells also capture the existing `lw_reading_streak` local-storage value when backgrounding, restricted to the app's own live/local origins. This lets the installed beta update its widget even before the web bridge is deployed.
