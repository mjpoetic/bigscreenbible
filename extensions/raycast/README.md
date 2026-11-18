# Big Screen Bible for Raycast

Version 0.3.6. Look up and read Scripture inside Raycast without an account or API key. Six bundled translations work offline; online translations use Big Screen Bible’s existing Scripture services.

## Commands

- **Look Up Bible Passage**: enter a full book name and chapter, verse, or range, such as `John 3:16-18`, `Psalm 23`, or `1 Corinthians 13:4-7`. Choose offline BSB, KJV, WEB, ASV, BBE, or YLT, or online ESV, NIV, NASB, AMP, NIrV, NKJV, NLT, or CEV. Enter runs the search. Read the passage in Raycast and press Escape to return to lookup.
- On the passage screen, press Enter to **Copy Scripture Text**. The Actions menu also offers **Open in Big Screen Bible**, **Open in Big Screen Mode**, and **Copy Passage Link** (Command-Shift-C). Command-Enter opens the passage on the website. The Open in Mode submenu offers Reader, Big Screen, Parallel Study, Memorize, and setup for Word Search, Crossword, or Hidden Word. Memorize prefills the Save & practice form; games prefill custom passage setup and still require Start. Online game translations fall back to BSB with a notice because passage puzzles use bundled texts. Opening the website is optional. HTTPS links use the default browser; native app routing depends on the operating system and installed app.
- **Open Big Screen Bible** opens the website directly.

Set **Preferred Translation** in extension preferences. Use NASB2020 or NIRV as the preference codes. NLT, NKJV, and CEV use API.Bible’s documented native HTTP usage reporting. A random device identifier is saved in Raycast’s extension storage and a random session identifier is generated for each command execution. No account, email, or hardware identifiers are sent. Reporting must succeed before API.Bible text is displayed; a failed report shows an error so you can retry. No remote Scripture is saved to disk. Full chapters are supported; cross-chapter ranges are not.

## Words and phrases

Type words instead of a reference to search the selected translation. Unquoted local searches require all words in the same verse; wrap text in double quotes for an exact phrase. Choose Words or Phrase explicitly for ambiguous queries containing digits. Results show inside Raycast: Enter reads the selected passage, and Command-Enter opens it on the website. Local search shows the first 50 matches and a total count; online search returns the provider’s limited result set. Search is lexical/provider search, without the website’s semantic expansion. Scripture stays in the Raycast UI unless you choose an open action. Online queries and API.Bible anonymous usage reports are sent to their respective services.

Online requests require connectivity, time out after 25 seconds, and display service errors without silently switching translations. Copyright notices appear with online text and are included in copied text. Only the existing public publishable key is included; provider secrets remain on the server.

## Develop and install locally

Requires Node.js 22 or newer and Raycast on macOS. From the repository root:

```sh
cd extensions/raycast
npm install
npm run dev
```

Search Raycast for **Look Up Bible Passage**. After it loads, you can stop the watcher with Control-C and close Terminal; rerun it when updating the extension.

```sh
npm test
npm run typecheck
npm run build
```

## Scripture assets

The six compressed, text-only translation files are generated from the same bundled sources used by the iOS Shortcuts cards. Each passage includes its translation and source link. No licensed remote provider credentials are bundled. To refresh Scripture after updating the repository sources, run `npm run bundle:scripture` from this directory inside the Big Screen Bible repository. Commit the regenerated assets.

## What to Test

1. Look up `John 3:16-18`; confirm all three verses display inside Raycast with no browser opening.
2. Try all six translations and `1 Corinthians 13:4-7`.
3. Disable connectivity and look up `Psalm 23`; confirm the whole chapter remains available.
4. Copy Scripture text and a passage link, and check the pasted content.
5. Choose Open in Big Screen Bible and Open in Big Screen Mode; verify the passage and translation.
6. Try `John 3:999`, a backwards range, and an invalid book; confirm useful errors.
7. Press Escape, change the reference, and look up another passage.
8. Search `love world` and `"love one another"`; inspect results, read one with Enter, then open it with Command-Enter.
9. Try each online translation and disconnect networking to verify useful errors.
10. Test Reader, Big Screen, Parallel, Memorize, and all three game setup actions with the same passage. Very short passages may not contain enough words for a puzzle; the site shows its existing validation.
11. Confirm the icon has transparent squircle corners in Raycast.

The new website mode handling must be deployed with app version 2026.11.18.3 before live game and Memorize links work as described.

## Publishing

This extension has not been submitted to the Raycast Store. Before submission, verify the `author` value in package.json is your Raycast Store handle, capture screenshots in Raycast, and confirm the distribution license with the project owner. The repository's COPYRIGHT.md applies; this extension does not bundle Scripture text.

API.Bible native reporting reference: https://docs.api.bible/guides/fair-use/

## Cross-references

From a word-search result or passage, choose **Show Cross-References** (Command-Shift-X). The list shows related passages and the source verses that link to them. Enter reads the related passage inside Raycast using the selected translation. Escape returns to the previous screen; Command-Enter opens the selected reference on the website. Mode actions remain available. Cross-references work offline with bundled translations; online text still requires connectivity.

The catalog is the same OpenBible.info CC-BY dataset used by the website, with up to eight references per source verse. Duplicate targets are merged. Cross-chapter targets retain their label but open the catalog's starting verse because inline lookup supports one chapter at a time. Attribution: https://www.openbible.info/labs/cross-references/ (CC-BY).

What to Test: look up John 3:16, press Command-Shift-X, select a related passage, and press Enter. Repeat from a word-search result, try an online translation, and use Escape to return through the navigation stack.

Translation labels use an asterisk (`*`) for versions requiring internet access; unmarked versions work offline.

## Search all translations

Choose **All translations \*** in the translation dropdown. Word/phrase searches run across all fourteen translations with at most three requests in flight. Results retain their translation label and copyright; reading, cross-references, copying, and website actions use that result’s translation. A passage reference shows the passage in each available translation. Failed translations appear separately with an explanation; available results remain usable, including the six bundled translations while offline. Per-translation result limits still apply. Command-Enter from the form first shows the combined results so you can choose a translation; Command-Enter on a result opens that specific translation.

What to Test: search `"love one another"` with All translations, inspect translation labels, copy an NLT result, and open an NIV result on the website. Try John 3:16 to compare translations. Disconnect networking and confirm bundled matches remain available with online failures labeled.
