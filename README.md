# Big Screen Bible

A clean Bible web app that focuses on displaying Scripture for screens big and small.

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

The data bundles were generated from eBible.org USFX packages for [KJV](https://ebible.org/eng-kjv/), [BSB](https://ebible.org/engbsb/), [WEB](https://ebible.org/engwebp/), and [ASV](https://ebible.org/eng-asv/). The remaining listed translations still need licensed text-provider integration before their full text can be shown.

The bundled data also includes word-level Strong's number tags where the USFX source provides them.
