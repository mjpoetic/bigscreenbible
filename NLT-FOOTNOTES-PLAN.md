# NLT footnotes implementation plan

Prepared October 8, 2026. Implementation completed locally as release
`2026.10.08.1`; the updated passage backend is deployed. Web publication and
physical-device verification remain outstanding.

## Implementation results

- Verified the authorized API.Bible NLT Luke 4 response: eight footnotes,
  including both screenshot examples. All 44 parsed verses and their
  red-letter metadata match the notes-off response after removing the separate
  footnote arrays.
- The backend requests notes for NLT only, extracts them separately, skips
  unsupported note types, and returns stable provider IDs and note references.
  The deployed function is version 72 with parser version
  `2026-10-08-nlt-footnotes`. A live NKJV check returned no footnotes.
- Reader verse/paragraph, Focus, Parallel, and shared-passage reading have
  accessible verse-level footnote controls and an escaped-text study popup.
  Notes are excluded from Scripture text, Big Screen controls, copy/share,
  print, and simplified reading output.
- `npm run test:footnotes` covers verified provider note fixtures, unchanged
  Scripture/red-letter offsets, multiple notes, bridged verses, ignored note
  types, translation isolation, stale-data clearing, and escaping.
- Provider/version loading, headings, reference preview, sharing, presentation,
  print, and simplified reading regression checks passed. Mobile build,
  version checks, and Capacitor sync for iOS/Android completed.
- Browser checks verified both Luke examples, keyboard focus restoration,
  Focus and Parallel opening, and popup bounds in portrait/landscape. Classic
  and Glass were visually checked. Physical iOS/Android behavior is unverified.
- The temporary diagnostic endpoint is retired: JWT verification remains on
  and its entire handler now returns HTTP 410 without reading secrets or
  requesting Scripture. CLI deletion could not run because no CLI access
  token was available; its inert entry can be deleted in the dashboard later.

The sections below preserve the original implementation scope and verification
criteria. Their pre-implementation uncertainty is resolved by the results above.

## Objective

Show publisher-supplied NLT footnotes in Big Screen Bible, starting with Reader, Focus, and NLT columns in Parallel. Use only notes returned for our authorized API.Bible NLT edition. Keep footnotes separate from personal study notes and cross references.

## Confirmed findings and remaining verification

- NLT uses `api-bible-passage`. Both the inspected deployed function and the local source explicitly request `include-notes=false`.
- API.Bible documents `include-notes=true` for chapter and passage requests: https://docs.api.bible/guides/chapters/ . This establishes API support, not the contents of its NLT edition.
- `content-parser.ts` recursively collects text and has no footnote extraction or separate footnote result field. Enabling notes without changing the parser risks including note text in Scripture.
- `mergeRemoteVersionChapter` currently carries verse text, headings, line breaks, and red-letter metadata, but no footnotes.
- The API key is server-side. The existing public function hardcodes notes off; adding `include-notes=true` to its public URL cannot verify upstream availability.
- Actual NLT footnote availability, node structure, and anchor placement remain unverified. The screenshots are comparison examples, not evidence of API.Bible's payload.

## 1. Verify the upstream NLT payload

Use the existing authorized API key in a secure execution context to request NLT Luke 4 with notes enabled, in JSON and, if needed, HTML. Do not expose the key in logs, browser code, fixtures, or documentation. Prefer a local authenticated diagnostic request; if only server-side access is available, use a narrowly scoped diagnostic function without changing the reader endpoint's behavior. Remove temporary diagnostics after verification.

Compare notes-on and notes-off responses. Check Luke 4:33 against “Greek unclean; also in 4:36” and Luke 4:44 against “Some manuscripts read Galilee.” These strings come from the user's screenshots and are not yet verified API results. Also inspect every other note in Luke 4 to establish numbering, repeated callers, note styles, reference fields, and anchor semantics. Check another chapter for multiple notes in one verse and formatted note text. Preserve small representative fixtures under existing parser tests, with appropriate attribution; avoid storing whole licensed chapters.

If the authorized edition supplies no notes, record that result and resolve provider availability before building a visible feature. Do not substitute YouVersion notes or hand-author missing publisher notes.

## 2. Add a separate footnote data path

- Enable upstream notes for NLT only after fixture verification. Other versions retain their current request behavior.
- Extend `ParsedVerse` with a `footnotes` array. Proposed normalized fields: stable chapter-local `id`, optional provider `caller`, `text`, and optional `reference`. Add an `offset` only if the verified payload supports a reliable anchor in the final normalized Scripture text.
- Extract note containers before recursively processing Scripture text. Their contents and caller markers must never enter verse text, red-letter ranges, search highlights, or line-break offsets. Distinguish footnotes from cross-reference note types using actual provider styles.
- Preserve punctuation and readable formatting in notes. Render returned content as escaped text or through an explicit safe formatter; do not insert provider HTML directly.
- Advance `parserVersion`. Pass metadata through `mergeRemoteVersionChapter` as `verse.footnotes[version]`, clear stale metadata when replacing a chapter, and preserve verse-range behavior without showing duplicate notes for bridged verses.
- Audit remote loading, shared passages, reference previews, and in-memory chapter reuse so metadata is retained and old responses without footnotes remain valid.

## 3. Reader experience

Start with a small accessible footnote button at the end of an NLT verse that has notes. This avoids guessing inline anchor positions. The accessible label should identify the passage, version, and footnote count. Keep the button visually distinct from the personal-note control.

Open a study popup using the existing popup infrastructure, headed with the reference and NLT, followed by the publisher's footnotes in their returned order. Support keyboard activation, Escape/close, focus restoration, touch-sized controls, scrolling, safe areas, and current popup text sizing. Fit Classic and Glass appearances with readable solid fallbacks. Prevent the footnote button from triggering verse selection, swipe navigation, or hold actions.

Render independently for Reader verse and paragraph layouts, Focus, and each Parallel version column. Pass the rendered chapter, verse, and version to the handler rather than relying on the currently selected verse. Close stale popups on passage or version changes.

Initial scope: keep footnote markers out of Big Screen presentation, copied/shared Scripture, print output, and simplified Scripture reading. Ensure those paths still receive clean verse text. Inline word-level callers and optional presentation/print inclusion can follow after reliable provider anchors are established.

## 4. Validation and release

- Parser fixtures: both Luke examples if supplied, multiple notes, formatted notes, cross-reference distinction, absent notes, bridged verses, and notes adjacent to words of Jesus. Compare notes-on versus notes-off Scripture text and offsets.
- Client checks: translation-specific storage, chapter refresh, no duplicate markers, correct popup passage/version, safe escaping, and separation from personal notes.
- Browser review: Reader verse/paragraph, Focus, Parallel, narrow portrait and landscape, desktop, Classic/Glass, larger text, keyboard navigation, and popup close/focus behavior.
- Regression checks: API.Bible parser tests, provider/version loading, section headings, reference previews, passage sharing, presentation, printing, and screen reading where affected. Run the mobile build and version consistency check after runtime implementation.
- Deploy the updated passage function and publish matching web assets as one coordinated release. Rebuild/sync native bundles as appropriate. Verify live Luke 4 after deployment; browser checks do not establish physical iOS/Android behavior.

## Completion criteria

NLT publisher notes are verified in the authorized upstream response; users can open the correct notes in the initial reading views; Scripture stays unchanged; other translations retain current behavior; relevant checks pass; deployment and device-verification status are reported explicitly.
