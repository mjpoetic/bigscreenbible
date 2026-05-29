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

Cross references are bundled in `assets/crossrefs.js` from the [OpenBible.info Cross References](https://www.openbible.info/labs/cross-references/) dataset, credited under CC-BY.

Strong's dictionary lookup data is loaded from the [Open Scriptures Strong's dictionaries](https://github.com/openscriptures/strongs). Their browser dictionary files identify the JSON editions as Open Scriptures CC-BY-SA data derived from the public-domain Strong's dictionaries.
