# Scripture + Streak widgets

The first native widget combines a daily verse, the current reading streak, and today's check-in. Tap anywhere to open the displayed passage in Reader. Home Screen appearance is configurable in the app. No notification permission or account is required.

## Available sizes

- iOS 16+: small, medium, large, and extra-large Home Screen families where supported by the device, a daily Scripture + check-in rectangular Lock Screen accessory, and a separate Reading Streak widget in circular/rectangular Lock Screen sizes.
- Android 7+: a resizable Home Screen widget; the default is four columns by two rows. Compact widths hide weekly dots and reduce the verse font. The verse area grows with the widget instead of retaining a fixed line cap. The launcher controls exact sizing.

After installing a native build containing these changes, open Big Screen Bible once. Add **Scripture + Streak** from the system widget gallery. On iOS, long-press the Home Screen, choose Edit > Add Widget, and search for Big Screen Bible. On Android, long-press the Home Screen, choose Widgets, and expand Big Screen Bible. Updating only the website cannot install a native widget extension.

## Content and progress

The widget independently requests the existing public `verse-of-the-day` endpoint, using the same public publishable key as the website. Feed text is identified as **Heartlight** rather than incorrectly labeling it as a Bible translation. A tap opens the reference in BSB. If the feed is unavailable, a bundled KJV passage uses the app's curated anchors, seasonal dates, and local day-of-year selection, with a KJV passage link. Long text is truncated in small spaces; the full passage is available in Reader.

Each platform caches the successful verse for the local date. iOS requests an hourly refresh and includes seven future local-midnight fallback entries. Android requests hourly host updates and refreshes local content on date, time, timezone, and locale changes. The OS controls scheduling; refreshes are not guaranteed at an exact minute. No continuous background service or exact alarm is used.

The Capacitor `BSBWidget.sync` bridge publishes only the current streak count, last check-in date, up to 400 recent check-in dates, and an optional background hex color. It coalesces app renders, skips unchanged snapshots, and retries after a bridge failure. Account tokens, names, notes, and highlights never enter the widget cache. Progress on other devices appears after the app syncs and publishes it locally. Widgets do not independently sign into an account.

The streak remains available on the day after a check-in and displays zero after a missed day, even while the app is closed. Merely viewing a widget does not count as opening the Bible.

## Native setup and builds

Both iOS targets use the App Group `group.com.bigscreenbible.app`. Enable/register that group for the main app and the `com.bigscreenbible.app.ScriptureWidget` extension in the Apple developer account when provisioning a device or store build. Xcode automatic signing may handle registration with the appropriate account permissions. The extension is a dependency of the App target and is embedded in its PlugIns directory. Keep its marketing/build versions aligned with the containing app when preparing a store archive. Shared UserDefaults access is declared in the privacy manifest.

Android uses AppWidgetProvider and RemoteViews with system light/dark resources or a rounded bitmap background for custom colors. No additional runtime library or permission is needed.

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

### Expanded widgets and appearance (2026-10-27)

Native Widgets settings include **Widget appearance**, shared by all Home Screen widgets on that device: **Follow app theme** (default), **Device light/dark**, or **Custom color**. App theme uses the solid chrome color of the selected palette, without gradients/motion. A custom background selects black or white text using relative luminance. Device mode uses the original automatic light/dark palette. Theme changes publish when the app opens or its appearance changes; the closed app cannot continuously publish app-theme updates. Lock Screen and system-tinted widgets retain OS styling.

These controls require the updated website and native bridge; older native builds ignore the extra color field. Older caches retain device appearance until the app publishes a color. Streak and appearance stay local to the device.

Validation: Android emulator instrumentation passed both tests, including 24 light/dark custom-color render combinations at widths 150/180/330 dp and heights 150/180/360/500 dp. Both platform builds passed. Swift legacy-cache/color round-trip and streak/link tests passed. Standalone SwiftUI large/extra-large renders and an Android tall render were inspected. Actual installed iOS gallery behavior and physical-device appearance changes remain beta QA; no new beta has been uploaded for this change.

### Lock Screen options and favorite passages (2026-10-29)

- iOS keeps the existing DailyScripture widget kind and adds a ReadingStreak kind through a WidgetBundle. The Scripture Lock Screen rectangle shows a short daily excerpt, reference, and check-in state. Reading Streak offers circular and rectangular accessories. iOS 16 accessories avoid the Home Screen padding. Changes reload both widget timelines.
- Android registers a separate Reading Streak provider and marks both providers for home_screen and keyguard placement. Both refresh from the same local snapshot. This enables compatible hosts; it does not grant access to Samsung's restricted Lock Screen picker. Samsung A16/One UI placement remains unverified. No notification workaround, extra permission, or Live Update was added. On hosts reporting keyguard category, Scripture always uses the daily verse; hosts that report home-screen category retain Home Screen content behavior.
- Select verses in the native Reader selection toolbar and choose **Use in widget**. The exact displayed text, translation, reference, and selected verse range are stored locally. All Home Screen Scripture widgets on this device share the active favorite. **Home Screen widget content** in native settings switches between **Verse of the Day** and **My favorite passage** without deleting the saved favorite. No favorite uses the daily fallback. Long selections above 2,000 characters are rejected with a message. Streak widgets remain focused on check-ins.
- Favorite content is included in the bounded native snapshot and captured on backgrounding; older native builds ignore it. It remains fixed across midnight/offline refreshes. Source/version and multi-verse deep links are preserved. The daily feed's source metadata and in-app credit are retained; the visible Home Screen header uses Big Screen Bible and the citation omits the Heartlight label. Translation names such as KJV remain visible.

Validation: both native builds, Swift legacy/favorite cache and deep-link tests, JavaScript favorite selection/privacy/fallback tests, settings and native-link checks passed. Android emulator instrumentation passed both tests covering daily/favorite/Lock Screen selection and 48 Scripture/streak layout combinations. A native-mode browser preview verified selecting John 3:16, saving it, switching daily/favorite, and persistence after reload at desktop and 390px phone widths. This preview mocks the native shell; physical Samsung A16 placement and installed iOS Lock Screen rendering still require device testing. No new store uploads were performed.

### Branded release preparation (2026-10-29)

Home Screen Scripture headers now read **BIG SCREEN BIBLE**. Feed verses show the Scripture reference without the visible Heartlight label; translation labels remain on translated/favorite passages. The underlying `source` value remains unchanged for provenance and passage-link handling, and the in-app Heartlight credit/link remains. No publisher text or in-app attribution was removed.

Prepared native versions: iOS **1.0 (4)** for app and extension; Android **1.0 (5)**. The new Lock Screen/favorite changes and branding require updated native beta builds. See `docs/widget-build-preparation-2026-10-29.md` for artifact readiness.

### Dedicated widget settings (2026-10-29)

Widget content, saved-passage summary, appearance mode, and custom background color now live under **Settings → Widgets**, with a widget glyph and standard back navigation. Quick settings and Appearance & Text no longer repeat these controls. The row remains native-only; saved preferences and the bridge are unchanged. This web UI reorganization needs a site deployment/refresh, not a new native binary. Bundled offline copies keep the old layout until a future native rebuild.
