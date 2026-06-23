# Big Screen Bible

A clean Bible web app that focuses on displaying Scripture for screens big and small as distraction-free as possible.

## GitHub Pages

This project is a static site. To publish it with GitHub Pages:

1. Open the repository settings on GitHub.
2. Go to **Pages**.
3. Set the source to **Deploy from a branch**.
4. Choose the `main` branch and `/ (root)` folder.
5. Save the setting.

GitHub Pages will serve `index.html` from the repository root.

## Bible Texts

The bundled full-text translations live in `assets/bibles/` as JavaScript data bundles so the app works from GitHub Pages, a local preview server, or a direct `file://` browser open:

- KJV: King James Version
- BSB: Berean Standard Bible
- WEB: World English Bible
- ASV: American Standard Version (1901)
- BBE: Bible in Basic English

The data bundles were generated from eBible.org USFX packages for [KJV](https://ebible.org/eng-kjv/), [BSB](https://ebible.org/engbsb/), [WEB](https://ebible.org/engwebp/), and [ASV](https://ebible.org/eng-asv/). BBE was generated from the public-domain [eng-bbe.usfx.xml](https://github.com/seven1m/open-bibles/blob/master/eng-bbe.usfx.xml) file in the seven1m/open-bibles collection.

The bundled data also includes word-level Strong's number tags where the USFX source provides them.

Paragraph layout support is data-driven. ESV paragraphing comes from the ESV passage API. The bundled public-domain/open translations can also use paragraph metadata when source files with paragraph markers are available.

Red-letter support is also data-driven. KJV and WEB use their source USFM/USX `wj` annotations directly. BSB, BBE, and ASV use translation-specific character ranges aligned from WEB's editorial boundaries, with explicit overrides for structurally unusual mixed-speaker verses. API.Bible translations preserve `wj` ranges when their provider text includes them. Translations without source annotations or configured aligned metadata remain normal text.

Licensed remote translations are provider-based:

- ESV uses the Crossway ESV Supabase Edge Function.
- NIV, NLT, and NASB 2020 use the API.Bible Supabase Edge Function.
- API keys remain Supabase secrets; the browser only calls the project Edge Functions.
- API.Bible copyright notices and FUMS view tracking are included in the rendered experience.

Verse of the Day is fetched server-side from the VerseoftheDay.com / Heartlight RSS feed, cached once per Eastern calendar day in Supabase, and reduced to the item reference, verse text, and linked attribution. The bundled curated rotation remains the offline/failure fallback.

See `SUPABASE_SETUP.md` for secret names, deployment, caching, and API.Bible usage constraints.

To generate bundled paragraph metadata:

1. Download and unzip USFM or USFX source packages from the eBible detail pages, not the country/territory landing page:
   - [WEB formats](https://ebible.org/find/details.php?id=engwebp): `engwebp_usfm.zip` or `engwebp_usfx.zip`
   - [BSB formats](https://ebible.org/find/details.php?id=engbsb): `engbsb_usfm.zip` or `engbsb_usfx.zip`
   - [KJV formats](https://ebible.org/find/details.php?id=eng-kjv): `eng-kjv_usfm.zip` or `eng-kjv_usfx.zip`
   - [ASV formats](https://ebible.org/find/details.php?id=eng-asv): `eng-asv_usfm.zip` or `eng-asv_usfx.zip`
2. Put the unzipped source folders or files inside a local `sources/` folder. This folder is ignored by git.
3. Check the exact folder names:

   ```bash
   find sources -maxdepth 2 -type d | sort
   ```

4. Run the builder with the exact paths shown on your machine:

   ```bash
   node scripts/build-paragraph-metadata.mjs WEB=./sources/engwebp_usfm BSB=./sources/engbsb_usfm KJV=./sources/eng-kjv_usfm ASV=./sources/eng-asv_usfm
   ```

The generated `assets/bibles/paragraphs.js` is safe to commit. The raw `sources/` files should stay local.

To regenerate bundled red-letter metadata from sources that include `wj` markers:

```bash
node scripts/build-red-letter-metadata.mjs WEB=./sources/engwebp_usfm KJV=./sources/eng-kjv_usfm --derive=BSB:WEB,BBE:WEB,ASV:WEB
```

The generated `assets/bibles/red-letters.js` contains character ranges only; it does not duplicate Scripture text.

Cross references are bundled in `assets/crossrefs.js` from the [OpenBible.info Cross References](https://www.openbible.info/labs/cross-references/) dataset, credited under CC-BY.

Strong's dictionary lookup data is loaded from the [Open Scriptures Strong's dictionaries](https://github.com/openscriptures/strongs). Their browser dictionary files identify the JSON editions as Open Scriptures CC-BY-SA data derived from the public-domain Strong's dictionaries.
