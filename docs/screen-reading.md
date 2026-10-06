# Native screen reading

Open **Settings → Accessibility** and turn on **Enable Scripture screen reading**.
The feature is off by default and the choice is saved on this device. Turn it off
in the same menu to disable reading views and Scripture focus shortcuts.

Reading-view controls are available only inside Accessibility. **Scripture reading
view** opens the displayed passage and **From current verse** opens the remaining
verses from the current verse. Big Screen settings also have an Accessibility
menu; its view contains only the currently displayed text, including only the
displayed part of a split verse.

The reading dialog contains the passage heading, displayed translation(s), plain
Scripture, enabled section headings, required copyright/source notices, and a
Close reading view button. Parallel text follows the rendered verse order with
translation labels. Native modal behavior keeps the covered app out of
accessibility navigation. Text selection is enabled and the normal verse-hold,
Strong's, and chapter-swipe handlers do not attach to this dialog.

Open the view, then invoke Speak Screen or ask Siri to read the screen. The OS
controls the voice, speed, stopping, and resuming. Speak Selection is also usable
by selecting text in the dialog. Opening the view does not automatically start
speech or enable an OS accessibility setting. Focus begins at the passage title;
closing returns focus to the opening control when it is still present.

When the feature is enabled, keyboard/screen-reader shortcuts at the start of the app, **Go to passage** and
**Go to current verse**, focus the Scripture directly. These appear visually on
keyboard focus. Routine renders preserve explicitly focused Reader Scripture
within the same passage. Big Screen excludes the workspace covered underneath
it from accessibility navigation.

## Validation

`npm run test:screen-reading` checks enable/disable behavior, device preference persistence, verse filtering, combined verses, parallel
translation order, markup escaping, modal focus, and closing behavior. Existing
Reader lifecycle, touch gestures, verse hold, presentation, and interface text
checks also pass. Browser accessibility-tree checks confirm isolation of the
reading dialog, title focus, current-verse starting text, and focus return.

Physical device testing remains necessary: browser checks cannot establish Siri,
Speak Screen, VoiceOver, TalkBack, or native text-selection behavior.

On iPhone/iPad, verify Speak Screen and Siri read the title and Scripture in order,
without the covered toolbar, and can continue through a long chapter. Verify
selection brings up the native text menu without haptics or verse actions. On Mac,
check spoken content and VoiceOver reading/navigation. Check Escape/close, focus
return, portrait/landscape scrolling, a combined verse translation, Parallel Study,
Verse of the Day source links, and Big Screen split verses. Confirm the normal
Reader's verse-hold behavior still works after closing the reading view.
