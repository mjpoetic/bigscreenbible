# Bible provider migration

## Current status (CEV / NKJV release)

The user has replaced the API.Bible NIV/NASB licenses with CEV and NKJV, keeping NLT. The live catalog confirms CEV `555fef9a6cb31151-01` (2006 second edition), NKJV `63097d2a0a2f7db3-01`, and NLT `d6e14a625393b4da-01`. Missing NIV/NASB entries in the API.Bible catalog are now expected. Both continue through YouVersion.

CEV/NKJV backend support and combined-verse parsing are deployed. Live John 3 and Psalm 42 requests returned text, copyright, and FUMS tokens for both translations. Both provider searches returned results. NLT John 3 also passed.

CEV combines some source verses, including John 3:23–24. The parser preserves that range; the frontend makes either verse addressable, labels the range, and avoids duplicate passages in Reader, reference previews, and copied selections. Parallel uses a continuation notice while keeping the other translations aligned to their verse numbers.

The user committed and pushed `86c2f72` while validation was ongoing. Final follow-up changes advance the app to `2026.09.07.9`; commit and publish those changes to complete the release.

For rollback of this addition, remove CEV/NKJV selector entries and publish a new app version. Leave NIV/NASB on YouVersion and NLT on API.Bible. To restore the prior backend, recover its source files from `34327e76c958cc681e1663c95b5a0f33b7cf701f` in an isolated checkout and deploy only `api-bible-passage`. Reverting the original NIV/NASB migration now requires restoring their API.Bible licenses first.

The original migration record follows for historical reference.

## Checkpoint (2026-09-07)

- Clean pre-migration Git baseline: `a04931389baa76d0c3b39c6c7626d016d3082cfa`.
- Previous production `youversion-passage`: version 28. Its three source files matched the baseline before this change.
- Additive backend support deployed as version 29; live catalog confirms NIV 2011 (`111`) and NASB 2020 (`2692`), AMP, and NIrV. No missing editions.
- NIV and NASB each returned John 3 (36 verses) and Psalm 42 (11 verses), with copyright, paragraph boundaries, headings, red-letter ranges in John, and poetic line breaks in Psalms.
- Frontend mappings prepared for YouVersion. Existing `NIV` and `NASB2020` keys and display labels are preserved.
- API.Bible function, key, and licenses have not been removed. NLT stays on API.Bible.

## Local validation

Parser/edition tests (9), provider routing and independent rollback, version loading, search, version synchronization, build, and release guard pass. Live chapter checks cover both editions in John 3 and Psalm 42. Browser checks replay those live responses to avoid extra provider calls. Reader, Parallel, and Big Screen rendered at 1440x900, 390x844, and 844x390 without page errors or horizontal overflow. Production frontend verification, reference-preview checks, and account/saved-selection checks remain required after publishing.

## Release and validation

The backend must be deployed and verified before publishing the frontend. The backend deployment alone does not change provider routing for existing clients.

Publish the frontend through the normal GitHub release process after local checks. Verify the deployed app uses `youversion-passage` for both translations in Reader, Parallel, Big Screen, and reference previews, including mobile. Confirm attribution and selected-version persistence. Check AMP, NIrV, and NLT for regressions.

The current YouVersion integration does not support remote phrase search. NIV/NASB are therefore omitted from provider-wide text searches after cutover; direct passage lookup remains available. API.Bible search is not retained as a hidden dependency. Do not use licensed Scripture in embeddings or generated puzzles to compensate.

Do not release the API.Bible slots until production is stable and older open browser sessions / installed native versions have been addressed. Replacing the licenses is a separate account action. CEV and NKJV are a later integration.

## Rollback

While the NIV and NASB API.Bible licenses remain active:

1. In `assets/bible-app.js`, change `provider: "youVersion"` to `provider: "apiBible"` on either or both of the `NIV` and `NASB2020` translation rows. Do not change their codes, labels, or other translations.
2. Adjust the migration test expectations for any rolled-back translation; run the version-loading, search, and provider tests.
3. Advance to a NEW app version using `npm run version:app -- <new-version>`, run `npm run build`, and run `npm run check:app-version` and `npm run test:version-sync`. Publish normally, then reload and verify API.Bible chapter requests and attribution.
4. The additive YouVersion backend can remain deployed; no data/account migration needs reversal.

If the YouVersion backend itself must be restored, recover ONLY its three original files (`index.ts`, `translations.ts`, `text-cleaner.ts`) from the baseline commit into an isolated checkout and redeploy `youversion-passage` with the existing `verify_jwt = false` configuration. Roll the frontend back first. Avoid resetting the whole repository or overwriting subsequent work.

After the API.Bible licenses are removed, rollback requires restoring those licenses before routing traffic back. This may require freeing CEV/NKJV slots again. Keeping source code alone cannot preserve provider access.
