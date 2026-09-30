# Big Screen Bible control inventory and visual concepts

September 30, 2026. This is a design review of the current shared web UI used by the site and Capacitor apps. It proposes no product changes. The mockups are illustrative; their Scripture, game grids, spacing, and some icon placements are not verified against running builds.

## Mockups

- [Focus and Reader states](mockups/focus-reader-states.png): Focus at rest, Focus tools and Bookmarks open, selected Reader verse, collapsed selection tools.
- [Mode states](mockups/mode-states.png): Parallel at rest and selected, Big Screen at rest and with controls, Games setup and play.
- [Responsive states](mockups/responsive-states.png): portrait Reader, short landscape Focus selection, desktop Parallel selection.

These boards show control priority and visual treatment, not a proposal to replace the current mode picker, study rail, game choices, or passage controls. In particular, the generated Games screens include illustrative choices and the short-landscape board simplifies the Focus controls.

## Shared shell and screen sizes

The shell renders `topbar`, a main grid, footer, mobile Focus overlays, and a separate Big Screen presentation surface. Reader and Parallel share the rail, footer, floating reading controls, and `selectionBar()`. Focus removes the rail and uses in-context overlays. Games replaces the reading surface and suppresses unrelated reader chrome. See `assets/bible-app.js` around `render()` (1601), `topbar()` (4854), `reader()` (7426), and `bottombar()` (17083).

| Viewport | Current control pattern | Design implication |
| --- | --- | --- |
| Wide desktop | Header mode tabs and search/version; side study rail and optional library panel; footer reference and chapter arrows; floating reading controls. | Keep stable places for navigation. A light surface finish can unify controls without turning Scripture or side panels into glass. |
| Portrait at or below 840 px | Compact mode picker; search/version can collapse; vertical side rail; footer and floating controls. Selection bar moves into the reading area and may be collapsed with a reopen button. | Preserve clear access to passage, version, study rail, and highlighter. Avoid stacking new floating controls over the existing right-edge controls. |
| Short landscape | Denser header and content width; safe-area insets matter. Selection bar can wrap; the portrait selection-tools reopen button is hidden. | Show only the active controls, keep tap targets out of cutouts/system gesture areas, and verify the open highlighter fits without obscuring all Scripture. |
| Foldable/tablet/intermediate width | Depending on width and orientation, the app crosses the 840 px layout boundary. Parallel version selectors and the selection bar adapt separately. | Test both sides of the breakpoint rather than treating all tablets as desktop. |

Responsive evidence: `assets/bible-app.css` around 18352, 18923–19095, 23002–23249, and 23461. The Android edge-to-edge rules and safe-area handling are near 23390–23460.

## Controls by mode and state

| Surface | Resting and persistent controls | Contextual or expanded controls | Recommendation |
| --- | --- | --- | --- |
| Reader | Brand/Verse of Day, reference search, Bible version, mode choice, Help/account/Settings as space allows; side rail for Verse, Bookmarks, Annotations, Cross-Refs, History, Search; footer chapter arrows/reference/version, Copy/Print/About; page controls when available. | Library panel, search results, Back/Forward history, auto-scroll if enabled, selected-verse toolbar, highlighter reopen button when collapsed, notes/cross-reference popups. | Keep the existing locations and reveal rules. Style floating controls as one family; do not add another bottom navigation row. |
| Parallel | Reader shell and navigation; per-column translation selectors and reorder grips; aligned verse rows. | Per-column version menu/remove, shared selected-verse toolbar, study panels, Back/Forward and auto-scroll. | Preserve column labels and ordering. Keep selection actions shared across both versions and opaque text columns. |
| Focus | Reading content without the study rail; mobile passage search, Focus tools launcher, Settings; desktop Focus tools control; reading navigation as applicable. | Tools fan: Verse picker, History, Bookmarks, Annotations. Selected tool opens an in-context workspace panel. Passage search/results and selected-verse toolbar can appear without leaving Focus. | Keep the fan and workspace panels. Give the launcher priority over decorative effects. Do not move History/Bookmarks/Annotations out of Focus. |
| Big Screen | Full-screen presentation verse and reference with controls that can recede. | Search and version; book/chapter/verse pickers; Share, account, Back to Bible, previous/next, settings; browser fullscreen only where supported. | Leave Scripture visually dominant. Apply a subtle surface to revealed controls only; never introduce Reader highlighter/footer into presentation. |
| Games setup | Game heading and type picker, summary, Game options, Start; Social where supported. Reader search, version, and footer are suppressed. | Options drawer with difficulty/round/passage choices and game-specific setup; social drawer where supported. | Retain game-specific setup and current drawer structure. Do not add reading chrome for visual symmetry. |
| Games play | Score/progress, game-specific play area, Games menu, Controls, and Hint where available. | Controls drawer for music/sound/volume, hints drawer, answer/result dialog and challenge controls where applicable. | Keep puzzle and answer surfaces solid and readable. Limit translucent styling to utility controls. |

Sources: `assets/bible-app.js` around `rail()` (7134), `reader()` (7426), `parallelView()` (15735), `selectionBar()` (17154), `presentation()` (17572), `triviaView()` (14152), and `mobileFocusOverlayControls()` (2818).

## Selection and floating-control detail

- `selectionBar()` appears in Reader and Parallel when verses are selected. It contains selection count/reference; standard highlight swatches, custom color, and remove highlight; Cross references, Copy passage, Share, Copy link, Note, Print, and Clear. This full action set is more complete than any generated board. Source: `assets/bible-app.js` 17154–17185.
- On narrow portrait screens the selection bar occupies a compact region within the reader. In Focus it can use a grid; short landscape allows wrapping. When the bar is collapsed, `readerSelectionToolsButton()` gives a way back. Source: `assets/bible-app.css` 18923–19095 and `assets/bible-app.js` 7602.
- The Reader floating stack also includes Page Up/Down, conditional auto-scroll, conditional Back/Forward, and the conditional selection-tools reopen button. These have independent state/availability rules. Source: `assets/bible-app.js` 7494–7510 and 7583–7638.
- Focus has three mobile floating entry points: passage search, tools fan, and Settings. The tools fan retains the current reading context while its Verse/History/Bookmarks/Annotations panel opens. Source: `assets/bible-app.js` 2818–2986.

## Placement decisions for a future implementation

1. Keep the current information architecture. Apply a shared control token set (radius, border, elevation, blur/opacity, active color) across site, iOS WebView, and Android WebView. Let the platform change the finish slightly while the controls remain in familiar places.
2. Keep Bible content and game grids opaque. Use translucent treatment only for floating or revealed controls. Preserve high contrast and provide a more solid fallback for reduced transparency/contrast needs.
3. Treat selected verse and open Focus panel states as first-class design states. Selection tools must appear immediately after selection and remain easy to reopen after manual collapse.
4. If portrait selection actions need consolidation, keep color swatches, Copy, Note, and Clear directly reachable. Put secondary actions in a labeled More menu only after actual width testing; do not remove Share, Copy link, Cross references, or Print.
5. Keep Big Screen controls transient and Games controls game-specific. A consistent control material does not require identical navigation in every mode.

## Verification needed before implementation

Review actual app states at desktop, 390×844 portrait, 320×568 portrait, 844×390 short landscape, and the two sides of the 840 px breakpoint. Include Reader and Parallel selection, Focus fan/panel/search, Big Screen idle/revealed, Games setup/play/drawers, light/dark themes, safe areas, and iOS/Android WebViews. The current mockups are concept art and do not establish fit, accessibility, or device behavior.
