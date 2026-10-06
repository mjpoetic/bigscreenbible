# Ambient audio sources

All files are hosted by Big Screen Bible and included in the mobile web bundle.
Source licenses checked October 5, 2026. No third-party streaming player, account,
audio service API, or sampled commercial instrument is used.

## Gentle rain

- Creator: Ylmir
- Recording: Rain (loopable), file `1.mp3` from `Rain MP3.zip`
- Source: https://opengameart.org/content/rain-loopable
- Download: https://opengameart.org/sites/default/files/Rain%20MP3.zip
- License: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/
- Changes: first 27 seconds, four-second complementary overlap, volume normalization,
  conversion to stereo 32 kHz / 128 kbps MP3. Effective loop: 23 seconds.

## Ocean waves

- Creator: SamsterBirdies
- Recording: Calm ocean waves, sound 578524, recorded at Whidbey Island, Washington
- Source: https://freesound.org/people/SamsterBirdies/sounds/578524/
- Download: https://cdn.freesound.org/previews/578/578524_5487341-hq.mp3
- License: CC0 1.0, https://creativecommons.org/publicdomain/zero/1.0/
- Changes: first 60 seconds of the high-quality MP3 preview, four-second complementary
  overlap, volume normalization, stereo 32 kHz / 128 kbps MP3. Effective loop: 56 seconds.

## Peaceful piano

Original synthesized instrumental created for Big Screen Bible by the repository's
`scripts/generate-ambient-audio.mjs`. No third-party recording or sample.
96-second chord/arpeggio cycle with circular reverb and wrapped note tails.

## Amazing Grace — Lo-fi

Original synthesized arrangement/recording created for Big Screen Bible by the same
generator. Traditional public-domain NEW BRITAIN melody with original accompaniment,
soft 3/4 pulse, and circular reverb. No modern recording or modern published setting copied.
Composition reference: https://hymnary.org/tune/new_britain
Effective loop: 96 beats at 66 BPM, 87.27271875 seconds at 32 kHz.

## White, pink, and brown noise

Generated on the listener's device in `assets/ambient-audio.js`. No external assets.

## Reproduction

Requires Node.js and ffmpeg on PATH. Retrieve and unzip the CC0 inputs above, then:

```sh
node scripts/generate-ambient-audio.mjs --rain /path/to/1.mp3 --ocean /path/to/ocean.mp3
```

Without input arguments, only the original music is regenerated. The player excludes
encoder padding from its loop clock and applies a short boundary smoothing window.
