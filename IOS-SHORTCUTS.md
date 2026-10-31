# Siri and Apple Shortcuts

Requires an iOS app build containing `BSBAppShortcuts.swift` and iOS 16 or later.
The app's existing iOS 15 support remains available without these actions.

Three actions appear under Big Screen Bible in Apple Shortcuts:

- **Open Bible Passage** accepts a Passage text parameter (for example, `John 3:16` or `Psalm 23`). Use a fixed reference, Ask Each Time, or text from an earlier action. Siri asks for the passage when it isn't provided.
- **Show Verse of the Day** opens today's verse using the existing daily-verse route.
- **Continue Bible Reading** opens the reader at the saved local reading position. If no valid position exists, it opens the current reader passage.

Example Siri phrases:

- “Open a passage in Big Screen Bible.”
- “Show today's verse in Big Screen Bible.”
- “Continue reading in Big Screen Bible.”

All actions open the app; they do not return Scripture text or speak it in the background. The daily verse may need a network connection. These are native App Intents; no Siri permission prompt or SiriKit extension is needed.

## Release and device verification

Publish the web change along with the native release: Continue Reading needs the updated `bsbHandleQuickAction` handler. Rebuild and sync bundled web assets before archiving so the offline reader also receives the handler.

On a physical iPhone with the new build:

1. Open the app once, then find Big Screen Bible in Shortcuts and confirm all three actions appear.
2. Run each action with the app active, in the background, and after force quitting.
3. Ask Siri to open a passage; answer `John 3:16`. Repeat with `Psalm 23` and a numbered book such as `1 Corinthians 13:4–7`.
4. Run Open Bible Passage with a fixed reference and with text passed from an earlier shortcut step. Check blank input prompts for a reference.
5. Scroll a chapter, leave the app, then use Continue Reading. Repeat from Verse of the Day, a shared passage, Parallel, and Games. Verify the saved chapter and scroll position return.
6. Show Verse of the Day with the app's startup preference both enabled and disabled.
7. Try Continue Reading without a saved position, and with connectivity disabled after the bundled offline reader is available.

Automated navigation regression checks: `npm run test:ios-quick-actions` and `npm run test:native-links`.
