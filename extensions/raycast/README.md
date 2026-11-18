# Big Screen Bible for Raycast

Version 0.1.0. A local Raycast extension for opening passages and copying links. No account or API key is required.

## Commands

- **Open Bible Passage**: enter a reference such as `John 3:16-18`, `Psalm 23`, or `1 Corinthians 13`. Choose a translation and Reader, Big Screen, or Parallel Study mode. Press Enter to open, or Command-Shift-C to copy the link.
- **Open Big Screen Bible**: open the website in your default browser.

Set **Preferred Translation** in Raycast's extension preferences. Translation abbreviations are resolved by the website; unavailable translations fall back to BSB. References are resolved by the website, so the extension does not validate book names or chapter/verse numbers locally. Parallel Study uses the website's saved additional translations.

## Develop and install locally

Requires Node.js 22 or newer and Raycast on macOS.

```sh
cd extensions/raycast
npm install
npm run dev
```

Run these commands from the repository root for the first line, then inside the extension directory for the remaining lines. The Raycast development command imports the extension into your installed Raycast. Search Raycast for **Open Bible Passage**.

```sh
npm test
npm run typecheck
npm run build
```

The extension uses Raycast's standard manifest and command structure: https://developers.raycast.com/information/file-structure

## What to Test

1. Open `John 3:16-18` in Reader with BSB; check the passage and selected verses.
2. Open `1 Corinthians 13` in Big Screen mode with KJV.
3. Open a passage in Parallel Study and confirm your saved comparison translations.
4. Copy a passage link with Command-Shift-C and open it in a browser.
5. Set Preferred Translation to ESV, reopen the command, and check its default.
6. Try a blank reference and an invalid book name; confirm the blank field is flagged and the website handles an unresolved reference.
7. Run Open Big Screen Bible directly.

## Publishing

This extension has not been submitted to the Raycast Store. Before submission, verify the `author` value in package.json is your Raycast Store handle, capture screenshots in Raycast, and confirm the distribution license with the project owner. The repository's COPYRIGHT.md applies; this extension does not bundle Scripture text.
