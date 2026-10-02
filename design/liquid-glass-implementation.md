# Liquid Glass control finish

Implemented October 2, 2026, release 2026.10.02.8.

Apple-inspired web material for the shared site and Capacitor UI. This uses
CSS backdrop blur, theme tint, reflective edges and rounded control groups;
it does not use Apple's native Liquid Glass renderer.

## Reversal

Settings → Appearance & Text → Control finish → Classic restores the original material styles
immediately. The preference persists on this device across reloads using
`lw_control_material`; it is independent of account theme synchronization.
New and existing devices default to Liquid Glass until Classic is chosen.

All material overrides live in `assets/liquid-glass.css`, gated by
`html[data-control-material="glass"]`. Remove its stylesheet link from
`index.html` to disable the treatment for everyone. Original styles remain
in `assets/bible-app.css`. No control actions or routing were replaced.

## Scope

The material covers header/footer navigation, search and version controls,
streak chip, header icons, shared-passage Copy/Share/Print/read actions,
Reader/Parallel selection and floating controls, study rail, Focus launcher
and tool buttons, floating settings/version menus, Big Screen utilities,
Parallel version triggers, panel close buttons, study action buttons and Games utility controls.
Games navigation, options and Start controls use the same rounded finish.
Study drawers, book selectors, bookmark/history disclosures, note fields,
joined search controls, Help and About dialogs, account forms and streak
cards now share denser material surfaces and reflective edges. Settings
titlebars and text-size groups use the same finish. Parallel Study has a
rounded frame, softer dividers and an opaque coordinated header.
Scripture, parallel reading columns, workspace content, game boards and
answer surfaces keep their existing content treatment and geometry.

Big Screen glass has its own light/dark palette, independent of Reader
colors. Menu material is denser than utility-button material for legibility.
The version picker wrapper owns its finish so there is no pill inside a
square box. Nested settings controls use an edge finish without extra blur.

Control finish appears inside Appearance & Text and remains searchable.
Its two choices fill equal columns in both glass and Classic; the separate
Light/Dark/System group still has three choices.

Browsers without backdrop-filter use solid material. Reduced transparency,
increased contrast and forced-color media preferences disable glass blur
and reflections. No additional motion was introduced. Classic remains
available where a WebView does not expose system transparency preferences.

## Validation

- JavaScript syntax, release advance, version synchronization and mobile build passed.
- Existing Settings, themes, Focus layout, Games layout, presentation, sharing
  notes and interface text-size checks passed.
- Browser: light/dark Settings, shared-passage actions, Reader rail/footer,
  verse actions and selection bar, Focus fan/Bookmarks panel, Big Screen dark navigation/settings, and
  Games setup/play/control drawer inspected.
- Control finish absent from quick Settings and present in Appearance & Text;
  both options equal width without overflowing at 320 pixels. Classic restored
  the original search radius; glass restored the new radius after reload.
- No horizontal document overflow at 320×568, 390×844, 844×390, 839×900 or 841×900.
- One remote Bible reference-preview request failed with `TypeError: Failed
  to fetch` during local QA. The material changes do not change fetching.
- Native iOS/Android appearance and performance, physical-device checks and
  OS accessibility preference behavior still need device verification.
- Panel pass: notes, settings, Focus layout, Parallel reorder, headings,
  accessibility, tutorial, account and streak regression checks passed.
  Help fits 390×844 and 844×390 without document overflow. Classic restores
  the settings titlebar to its original square finish immediately.
- Fixed hidden notes-search Clear control occupying space; verified empty,
  filtered and cleared states remain on one row. This bug fix also applies
  to Classic.
- Local implementation only; no website deployment performed.

## Follow-up refinements (.6)

- Search submit and scope controls use one shared reflection; child utility
  styles no longer override the transparent joined segments.
- Save note has padding and a 44px touch area. Its focus ring stays inside
  the textarea, avoiding clipping against the drawer scroll container.
- Book lists use an opaque body and quieter hover treatment.
- Help's About link, Games records, restart/hint/check/reset controls,
  volume card, social setup card and keyboard keys share the finish.
  Hidden Word hit/miss colors remain distinct.
- Games layout, Hidden Word, notes, Focus/search layout, release checks and
  version synchronization passed. Desktop and 390px browser views inspected.
- Narrow Hidden Word keyboard rows now fit their container in both finishes.

Compact navigation contrast (.7): selected rows now pair the teal fill with accent ink in one scoped rule. The dropdown uses an opaque panel background; hover/focus rows retain theme ink.

Focus sheets (.8): verse picker and native quick-action search use dense glass shells, rounded fields and accent buttons. Header search focus is drawn on its capsule wrapper rather than the rectangular input. Focus/search layout and iOS quick-action regression checks passed; native keyboard appearance still requires device verification.
