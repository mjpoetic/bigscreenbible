# Bible trivia crossword investigation

Investigated October 3, 2026. This is a proposal; the trivia mode is not implemented.

## Recommended experience

Retain Scripture Crossword and add a Bible Trivia choice within Crossword options. Scripture keeps its passage and translation selection. Bible Trivia uses standalone, reviewed clues such as “The first woman” → EVE, with answer length shown and no multiple-choice answers. Offer mixed subjects or People, Places, and Bible Vocabulary. Reuse the board, clue navigation, keyboard, zoom, hints, and sizing controls.

Start with roughly 15–25 entries per puzzle, with fewer entries on Easy. Keep the modes' best times separate. Store the mode on the round and record key; preserve existing Scripture records. Trivia completion should reveal clue explanations and their individual references rather than opening a single passage. Restart should retain the selected mode.

## Existing resources and experiment

`assets/bible-app.js` contains `hiddenWordPuzzleCatalog`: 120 descriptive clues with categories and references. Only 31 answers are single alphabetic words. Many remaining entries are phrases or titles and need explicit enumeration or editorial conversion; removing spaces alone makes answers ambiguous. `assets/trivia.js` provides another source of questions, but its multiple-choice questions need review before conversion to crossword clues.

An offline experiment reused the actual `createCrosswordGrid` engine and all 31 unique single-word catalog answers, without verse allocation. Ten sequential seeded trials were run per configuration on the development computer:

| Workspace | Entries | Successful trials | Generation time |
| --- | --- | --- | --- |
| 15×15 | 15 | 10/10 | 4–17 ms |
| 21×21 | 25 | 10/10 | 6–29 ms |
| 21×21 | 30 | 4/10 | 99–1,210 ms |

These are feasibility observations, not device benchmarks or a guarantee across arbitrary word banks. The engine creates connected sparse crosswords; it does not enforce newspaper-style symmetry, dense fill, or multiple crossings per answer. More entries are immediately feasible; a dense traditional layout needs template-based generation or a stronger fill algorithm with a larger clue bank.

## Work needed before shipping

- Build a dedicated, reviewed answer/clue/reference bank. Avoid vague clues with multiple valid names, accidental answer disclosure in other clues, duplicate normalized answers, and unmarked multiword entries. Include EVE as its own answer rather than copying ADAM AND EVE.
- Add mode selection, mode-aware generation, completion, restart, records, and persisted preferences. Review account record synchronization for the new mode key.
- Use a bounded generator with retries and a smaller-entry fallback; avoid blocking the UI during larger fills. Evaluate a worker or prebuilt templates if increasing density.
- Check crossings, clue uniqueness, answer leakage, generation success across seeds, and mobile layout/performance with 15–25 clues. If using templates, ensure every open run has a matching clue and no unintended words form.

## Scripture clue repair

The previous algorithm clipped snippets at neighboring answers, sometimes leaving just an ellipsis and a blank. It now retains surrounding context, expands to the full verse when a snippet has fewer than five visible words, and conceals other puzzle answers wherever they appear. The requested answer uses `_____`; other puzzle words use `[…]`. Regression coverage includes Proverbs 3:6 and adjacent answers. Existing passage generation and difficulty counts remain intact.
