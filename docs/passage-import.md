# Importing devotional passages

Website and apps: open **Bookmarks → Imported passages → Import from text**.
Paste devotional text or choose a UTF-8 `.txt` file, select **Find passages**, correct
any flagged references, uncheck unwanted passages, name the list, and save it.
**Open passage** displays that selection in the Reader with the normal verse actions.
**Read in context** opens the full chapter. The bottom return button restores the list.
Lists and unfinished drafts are stored on the device, including the app's existing
live/offline storage handoff. Lists do not currently sync between devices. Ordinary
verse annotations keep their existing storage and account sync behavior.

The extractor recognizes explicit book/chapter/verse references and same-chapter
ranges or comma-separated verses. It normalizes copied Unicode formatting and book
aliases, preserves reference order, removes duplicate references, and validates every
requested verse. Cross-chapter ranges are flagged for splitting. Limits: 100,000
characters per import, 100 passages per list, 200 verses per reference, 100 saved
lists, and 10 pending shared texts. The supplied devotional produces 18 references
covering 23 verses. Quotations without references and fetching devotional webpages
are not supported. The devotional is processed locally; previewing a remote Bible
translation sends the Scripture reference to its existing provider, not the devotional.

## Receiving shares

- **Android:** registered for `ACTION_SEND` / `text/plain`. Shared text is queued in
  app preferences and delivered to `bsbReceiveSharedText` when the trusted webview is
  ready. It is removed from the native inbox only after durable draft storage succeeds.
- **iOS:** the `PassageShare` extension accepts text and web URLs. The same JavaScript
  extractor runs locally through JavaScriptCore using bundled reference metadata.
  Recognized references are editable in the sharing panel. Save, then open the app
  to preview Scripture and finish the list. The extension does not force-launch the
  containing app. App Group `group.com.bigscreenbible.app` holds pending imports until
  the trusted webview acknowledges them. If extraction is unavailable, the original
  shared text is retained for review in the app.
- **Installed website:** supporting browsers can register the manifest's POST share
  target. The service worker stores incoming text in a bounded local Cache Storage
  inbox and redirects using an opaque ID. Once a durable draft is created, it removes
  the inbox entry and ID from the URL. Receiving shares requires a supporting browser,
  an installed PWA, and an active service worker. Paste remains available everywhere.

The iOS extension requires its own distribution provisioning profile for
`com.bigscreenbible.app.PassageShare`, with the existing App Group enabled.
`npm run build:mobile` regenerates the extension's reference metadata. The Xcode
project embeds the new extension; use the normal signed app release workflow.
The live website must also be deployed before live-origin native shells can use
its importer; `npx cap copy ios` / `android` refresh bundled offline web assets.

## Validation

`npm run test:passage-import` exercises extraction and service-worker receipt,
limits, durable acknowledgement, draft preservation, and website/extension parity.
Existing sharing, native-link, quick-action, note, preview, and offline tests cover
integration regressions. Compile both native projects after changing their bridges.

Before release, check these on real devices:

1. Website paste, text-file import, correction, deselection, save, reopen, deletion,
   and keyboard/screen-reader behavior in light and dark themes and narrow layouts.
2. Open a range, highlight a verse, bookmark, add a note, read the chapter, and return
   to the same list. Confirm normal annotations also appear outside the list.
3. iOS share from Notes and a devotional app; review references, save, open the app,
   and finish importing. Check cold launch, queued imports, and an existing draft.
4. Android share with the app closed and already open; confirm queued text survives
   a restart and never replaces an unfinished draft.
5. Installed Android PWA share, including a URL-only share and an oversized payload.
6. Remote translation unavailable/offline: verify the preview discloses its fallback.

Local compilation and VM tests do not establish real-device share-sheet behavior
or browser visual quality. Browser inspection was unavailable during implementation
because the Mac was locked; simulator and device sharing remain manual acceptance.
