# Publisher clarification requests

Prepared October 11, 2026. These messages have not been sent. Preserve each written response with your licensing records. ESV remains unchanged at Dane's request while clarification is sought.

## Crossway / ESV

Contact: licensing@crossway.org, listed on the [official ESV API page](https://www.esv.org/api/). If that team redirects you, use their recommended contact.

Subject: ESV API clarification for Big Screen Bible

Hello Crossway Licensing Team,

I develop Big Screen Bible (https://bigscreenbible.com), a completely free, non-commercial Bible reading app with no ads, paid features, sponsorships, or donation/support links. I am preparing iOS and Android releases. The app obtains ESV text through the ESV API using a server-side key and displays the ESV attribution and publisher link.

The app normally displays one complete chapter. It can also display a Scripture preview alongside the current chapter, or ESV alongside another translation in Parallel reading. It currently retains at most two ESV chapters in session memory, with a combined 500-verse ceiling and a one-day refresh deadline. ESV is not bundled for offline reading or offered as a whole-Bible download.

I would appreciate written clarification of these API conditions:

1. The query limit excepts single-chapter and double-chapter books, but the local-storage and page-display limits do not state that exception. May our app display and temporarily retain a complete chapter of books such as Obadiah, Philemon, 2 John, 3 John, Jude, and Haggai when that chapter exceeds half of the book?
2. Does temporary session memory used to render a passage count as local storage? Should the main chapter and an open preview be counted together for the half-book and 500-verse limits? Do copied passage text and retained reading dialogs also count?
3. For longer books, how should we measure half a book: by verse count, chapters, or another measure? Is the limit per book across all retained passages, or per individual displayed passage?
4. Are system text-to-speech reading of the displayed ESV text and user-initiated copy, share, or print permitted under the API conditions? If so, what limits and notices should we enforce?
5. Is the described free web/iOS/Android implementation within the API permission, or is a separate license or approval required?

If this implementation exceeds the permitted scope, please advise the changes necessary to use the API within its existing conditions.

Thank you,
Dane Hurst
Big Screen Bible

## Biblica / YouVersion

Use your existing licensing or YouVersion partner support channel; no recipient address has been verified here.

Subject: NIV and NIrV mobile release approval

Hello,

Our free Big Screen Bible app (https://bigscreenbible.com) has accepted Biblica text licenses through YouVersion for NIV and NIrV. We are preparing iOS and Android releases of the existing web app using Capacitor shells. There are no ads, paid features, sponsorships, or donation/support links. Text is obtained through a server-side YouVersion REST integration. Read Aloud for these translations is disabled pending permission.

Does the existing approval cover these mobile releases, or do you require a new prospectus and prior written approval before production? Please also confirm the applicable simultaneous display limits, temporary cache limits, and digital protection requirements for this implementation. Our app currently retains no more than two chapters per translation in session memory, refreshes after one day, and does not bundle these translations for offline reading.

Please let us know what information you need to confirm the permitted scope in writing.

Thank you,
Dane Hurst
Big Screen Bible

## Lockman / YouVersion

Use your existing licensing or YouVersion partner support channel; no recipient address has been verified here.

Subject: NASB and AMP REST integration clarification

Hello,

Our free Big Screen Bible app (https://bigscreenbible.com) has accepted YouVersion text licenses for NASB 2020 and AMP. We are preparing web, iOS, and Android distribution. There are no ads, paid features, sponsorships, or donation/support links. Read Aloud for these translations is disabled pending permission.

The app obtains passages through a server-side YouVersion REST integration rather than a YouVersion client SDK. Does this satisfy the agreement's SDK wording for these platforms, or should we change the integration? Does the accepted approval cover these mobile releases, and is any additional vetting needed before publication?

Please confirm how we should provide the annual distributed-copies report for a web app and mobile apps, including the reporting contact and whether active users, installations, or another measure should be used.

Thank you,
Dane Hurst
Big Screen Bible
