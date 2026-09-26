# Bundled fonts

Cinzel Black (900), Latin WOFF2, is used for branding throughout the website
and native offline reader. It is declared in `assets/bible-app.css` and preloaded
by the main, About, Privacy, and Terms pages. Downloaded unmodified from the
Google Fonts CSS API on 2026-09-26; its SIL Open Font License is included.

- Cinzel: https://github.com/google/fonts/tree/main/ofl/cinzel

## Offline default reading fonts

Inter (400/500/600/700) and Literata (400/600/700) are bundled for the native
fallback reader. Other selected families fall back to the application's existing
system font stack when unavailable offline.

Downloaded from the Google Fonts CSS API on 2026-09-23. The font files are
unmodified. Each family's SIL Open Font License is included alongside it.

- Inter: https://github.com/google/fonts/tree/main/ofl/inter
- Literata: https://github.com/google/fonts/tree/main/ofl/literata

`offline.css` is included only in the generated native `offline.html` page.
