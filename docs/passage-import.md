# Importing devotional passages

Website and apps: open **Bookmarks → Import passages**, below the current-passage
bookmark button. Paste devotional text or choose a UTF-8 `.txt` file and select
**Find passages**. Choose **Read in Big Screen Bible** to save a reading list and open all recognized passages together in the Reader,
using the same Scripture typography as shared passages. Choose **Save as bookmarks** instead to add the recognized references to Bookmarks without creating a reading list. Every passage is displayed
in reading order. **Saved lists** reopens older imports, and **Edit references**
lets you correct or deselect references before updating the same list. Invalid
references are omitted from automatic reading; the original draft remains available
for correction.

At the end of the reading list, **Bookmark all** adds every passage without removing
existing bookmarks, and **Highlight all** offers the usual highlight colors for all
imported verses. Overlapping ranges highlight each verse once. Verse-number menus
support individual bookmarks, highlights, and notes. Tap verse text to open the
normal highlighter bar with cross references, memorization, copy, share, passage
links, notes, and printing. Repeated taps toggle selection; selecting in another
chapter starts a new selection, and ranges include only imported verses. **Read full chapter** opens the
chapter; the bottom return button restores the complete list and its reading position.

The web import chooser works in the live-site experience of existing Android builds
without a native rebuild. iOS build 12 adds the two explicit actions to the native
share extension. Both iOS actions take effect when the app next opens; the extension
does not force-launch the app. Deploy web release 2026.11.07.4 so the live site can
honor explicit iOS actions. Older sites do not acknowledge the new receiver, and
the native inbox retains the request until a compatible site is available. The
updated iOS build includes the same web release for its bundled offline path.

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
  Recognized references are editable in the sharing panel. Choose **Read in Big Screen
  Bible** or **Save as bookmarks**, then open the app to apply that choice. The extension does not force-launch the
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

Safari desktop verification covered paste import, automatic display across three
chapters, Bookmark all, Highlight all, full-chapter navigation, and return to the
complete list. VM tests also cover overlapping ranges, storage failure, translation
fallback, and metadata surviving remote-cache eviction. Physical-device sharing
and narrow portrait layout remain manual acceptance checks.
