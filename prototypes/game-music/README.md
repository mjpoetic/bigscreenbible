# Game music auditions

These are pre-production music-direction prototypes for Big Screen Bible Games.

- `Still Waters` explores mellow 16-bit lo-fi music for untimed puzzle play.
- `Final Run` explores a dramatic 8/16-bit countdown direction for Reference Rush.
- Both tracks are sample-free and are rendered from deterministic oscillators and noise by `scripts/generate-game-music-auditions.mjs`.
- The encoded files are audition assets only. They are not copied into the production web or mobile bundle.

Regenerate the audio with:

```sh
npm run audio:auditions
```

The generator requires `ffmpeg` with the `libmp3lame` encoder.
