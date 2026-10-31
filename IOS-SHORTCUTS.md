# Siri and Apple Shortcuts

Build 8 adds interactive Scripture cards on iOS 26 and later, including iOS 27.

## Compact card actions

- **Show Bible Passage** displays bundled KJV Scripture without opening the full app. Enter a full book name and chapter, or a verse/range within one chapter: `John 3:16`, `Psalm 23`, or `1 Corinthians 13:4–7`. Cards support up to 40 verses and return text for later Shortcuts steps. Invalid references show an error rather than opening an unrelated passage.
- **Show Verse of the Day** retrieves the existing daily verse. If the service cannot be reached, a cached verse for today or a clearly labeled bundled offline selection is used. The service request has an eight-second timeout.
- Both cards include **Open in Big Screen Bible**, which opens that specific passage and translation in the reader.

Try “Siri, show a passage in Big Screen Bible” (then provide a reference), or “Siri, show today's verse in Big Screen Bible.”

Siri AI controls its presentation and may show its own text response instead of the custom card. The actions return both Scripture text and a dialog for that case. Card appearance and Siri recognition still require physical-device verification.

## Existing foreground actions

**Open Bible Passage**, **Open Verse of the Day**, and **Continue Bible Reading** still open the full app. The existing daily action's identifier is retained, so saved shortcuts continue to work. These actions remain available from iOS 16; automatic phrase registration requires iOS 17.4 or later. Continue Reading uses the existing saved local chapter and scroll position.

The app refreshes App Shortcut registration on launch. This is not a verified fix for the reported Siri AI phrase recognition failure.

## Device verification

Install build 8 and open the app once. In Shortcuts, add the new **Show** action rather than an existing **Open** action.

1. Run each Show action with the app closed and confirm the full app stays closed.
2. Check verse text, reference, translation, and the open-in-app button. Tap the button and verify the same passage opens.
3. Test John 3:16, Psalm 23, 1 Corinthians 13:4–7, and invalid references. Test a text variable from an earlier shortcut step.
4. Try Siri's exact Show phrases. If direct phrases fail, save a shortcut named “Daily Scripture,” run it by tapping, then invoke that name through Siri. Record whether recognition or action execution fails.
5. Disable connectivity and verify the daily fallback label and offline KJV passage card.
6. Confirm the existing Open and Continue actions still work.

Automated checks: compile and run `scripts/shortcut-scripture.test.swift` with `ios/App/App/ShortcutScripture.swift`, plus `npm run test:ios-quick-actions` and `npm run test:native-links`.
