# Bloom Hop: assets and spend

Prices (looked up 2026-10-23):
- imagegen2, gpt-image-2.5-flare, from OpenAI's model page: $30 / M image output tokens, $8 / M image input tokens, $5 / M text input tokens. High quality 1024² = 1756 output tokens ≈ $0.053; with one 1024 reference ≈ $0.061.
- nanogen (from its skill): Pro 1K/2K $0.134; Flash 1K $0.067.
- audiogen (from its skill): music ~$0.30/min; sfx ~$0.12 each.
- anim8gen: imagegen2 calls, counted like imagegen2.

Budget: $20. Warn at $16.

| ID | File | Tool | Prompt (short) | Tries | Est. cost |
|---|---|---|---|---|---|
| style-anchor | game/assets/style-anchor.png | imagegen2 high | top-down cute frog (try 1 was a front view, rejected) | 2 | $0.114 |
| mus-morning | game/assets/audio/music/mus-morning.mp3 | audiogen music 75 s | plucky marimba, guitar, flute, 96 BPM | 1 | $0.375 |

| bg-morning | game/assets/bg/bg-morning.jpg | nanogen Pro 2K | open pond water, morning, calm middle | 1 | $0.134 |
| bg-sunset | game/assets/bg/bg-sunset.jpg | nanogen Pro edit | edit of morning, sunset light | 1 | $0.134 |
| bg-moon | game/assets/bg/bg-moon.jpg | nanogen Pro edit | edit of morning, moonlight | 1 | $0.134 |
| mus-sunset | game/assets/audio/music/mus-sunset.mp3 | audiogen music 75 s | clarinet, pizzicato, upright bass shuffle, 84 BPM | 1 | $0.375 |
| mus-moon | game/assets/audio/music/mus-moon.mp3 | audiogen music 75 s | music box, harp, pads, 72 BPM | 1 | $0.375 |
| mus-bloom | game/assets/audio/music/mus-bloom.mp3 | audiogen music 5 s | marimba/glockenspiel fanfare | 1 | $0.025 |
| sfx (19) | game/assets/audio/sfx/*.mp3 | audiogen sfx | hop, land, gulp, sink, nope, flick, scuttle, tick, dive, surface, fishleap, powerup, poweruse, dunk, undo, stuck, bloom, croak, click | 1 each | $2.28 |
| amb (3) | game/assets/audio/amb/*.mp3 | audiogen sfx --loop 20 s | morning birds, sunset crickets, night frogs | 1 each | $0.36 |
| pad-3, pad-2, pad-1 | game/assets/sprites/pad-*.png | imagegen2 high (+2 edits) | jade lily pad, worn variants, same outline | 1 each | $0.199 |
| fly, beetle, pu-mend, pu-leap, lotus-bud, lotus-pink | game/assets/items/*.png | imagegen2 high | sprites with anchor ref | 1 each | $0.366 |
| lotus-white | game/assets/items/lotus-white.png | imagegen2 edit | cream lotus | 1 | $0.069 |
| turtle, fish, reeds, rock | game/assets/sprites/*.png | imagegen2 high | sprites with anchor ref | 1 each | $0.244 |
| dragonfly | game/assets/items/dragonfly.png | imagegen2 high | teal dragonfly | 1 | $0.061 |
| app-icon | game/assets/app-icon-src.png | imagegen2 high | frog head on pad, teal water | 1 | $0.061 |
| frog-hop, frog-celebrate, frog-idle | game/assets/sprites/frog/*.png | anim8gen (imagegen2 high) | stretch, cheer-open, cheer-happy, blink | 6 calls | $0.37 |

**Total: $5.68 of the $20 budget** (estimate was about $10.60). Code-drawn: pips, glows, rings, ripples, UI, icons from app-icon, title and screens, social card.
