# Jackal audio: independent synthesis and score transcription

Jackal TV uses a newly written Web Audio scheduler with pulse, triangle and deterministic noise instruments. It does **not** include recordings from another remake, original WAV/OGG files, a ROM, a 6502 interpreter, an NSF player, or a NES emulator. The melodies are transcribed from documented original note tables; they are not newly composed replacements presented as original music.

## Local test data and attribution

The synthesizer and transcription tool live in this repository. The original-score transcription is supplied separately for the local fidelity test build at:

```text
/workspace/library-files/nes-reference/jackal/visual-data/data/audio-score.json
```

The test APK's external asset mount exposes that file as **`art/data/audio-score.json`**. It is intentionally absent from `src/main/assets/data/`. This matches the separate local original-art reference bundle. A distributable build needs appropriately licensed score data, just as it needs appropriately licensed original artwork; the synthesizer itself does not confer a license to Konami's compositions.

The primary note/timer reference is [RayofJay/NES-Jackal_Disassembly_Fully_Commented](https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented), commit `f6788304f7021cb50938238a66123bb1db03a9e6`, `ASM Source/Code/Bank0.ASM`. `Sound.ASM` names the sound IDs; `Bank7.ASM:3566` maps the six stages to music IDs `38, 3C, 40, 38, 3C, 40` (hexadecimal).

The reference repository's MIT-0 notice applies to its disassembly and comments. Its README explicitly states: **“No claim is made to the code itself.”** Jackal's original music, sound designs and score tables remain credited to **Konami**; this project does not relabel those compositions as MIT assets. No third-party PCM audio files are copied.

For matching the existing local cinematic reference playback, sound-command timestamps are read from the external `cinematics/*/timeline.json` files. Those files identify their historic reference source, `e8fc3391d5b27fcd98b82fd27984141840449708`, from [HungLo2020/Jackal](https://github.com/HungLo2020/Jackal). They have no verified asset license and remain in the same external local reference bundle. The generated score file records SHA-256 hashes of the ASM source and each supplied timeline.

## Reproducible transcription

[transcribe-audio.py](transcribe-audio.py) reads only declarative `db`, `dw`, and `SoundDefinition` data statements. It resolves the documented score repeats and subphrases **offline**, and writes flat note events. The app never parses ASM or executes the original score-command stream. The tool does not assemble instructions or require a ROM.

```sh
python resource/apps/jackal/docs/transcribe-audio.py \
  '/path/to/NES-Jackal_Disassembly_Fully_Commented/ASM Source/Code/Bank0.ASM' \
  /path/to/local-jackal-art/data/audio-score.json \
  /path/to/local-jackal-art/cinematics
```

The current transcription has **41 named score/effect entries and 9,113 note/period events**. Each channel records its source label and line, total audio ticks, optional loop start, and flat notes. Music columns are:

| Column | Meaning |
| --- | --- |
| `frame` | Onset in the original audio driver's logical ticks |
| `frames` | Note duration in those ticks |
| `timerOrDrum` | NES frequency timer, noise-period index, or percussion command |
| `volumeOrAttenuation` | Direct volume for raw effects; subtraction from the music envelope otherwise |
| `duty` | Pulse duty index: 12.5%, 25%, 50%, 75% |
| `envelope` | Original envelope-table index; `-1` is raw constant volume and `-2` is triangle control |
| `gate` | Pulse decay/gate setting, or triangle linear-counter setting |
| `sweep` | Raw pulse sweep setting |
| `control` | Original channel control value used when reconstructing the envelope |

The documented musical duration rule is `baseDuration × (lowNibble + 1)`. The twelve timer bases are `06AE, 064E, 05F4, 059E, 054E, 0501, 04B9, 0476, 0436, 03F9, 03C0, 038A`; octave shifts and the original one-timer-unit detune are retained. Pulse frequency is `1,789,773 / (16 × (timer + 1))`; triangle uses denominator 32. The score parser distinguishes escaped raw noise data from repeat-control values, and preserves one-slot subphrase calls, finite repeats, and loop starts.

## Music coverage

| Game state | Original ID | Implemented sequence |
| --- | --- | --- |
| Static title | — | Silent, matching the reference; music begins with the attract/story sequence |
| Attract / POW portraits | `30` | Two pulse voices, triangle and percussion sequence; portrait/text cue times come from the local cinematic timeline |
| Start/deployment | `34` | Intro, then automatic stage-one music; intro uses the documented 8/9 update rate |
| Stages 1 and 4 | `38` | Full three-voice note sequence, percussion, intro and loop |
| Stages 2 and 5 | `3C` | Full three-voice note sequence, percussion, intro and loop |
| Stages 3 and 6 | `40` | Full three-voice note sequence, percussion and loop |
| Boss approach | `23` then `44` | Warning followed by the boss theme |
| Final boss | `48` | Final-boss introduction and theme, activated by `final-boss-music` |
| Stage clear | `4C` | Complete victory sequence |
| Continue / game over | `50` | Complete game-over sequence |
| Ending | `4C`, `28`, `54` | Victory, helicopter sequence, then credits music at the external cinematic's recorded command times; credits use the documented 20/21 update rate |
| Pause | `58` | Pause effect; music resumes from its saved position |

The original six stages reuse three compositions. This implementation therefore does not invent three additional themes. The ending timeline currently starts victory at frame 0, the helicopter sequence at 1025, and credits music at 1762. Intro timelines trigger the short explosion at frame 0 and intro music at frame 83.

## Gameplay effects

The model's `gun`, `grenade`, `rocket`, `explosion`, `jeep-explosion`, `barracks`, `pow-pickup`, `pow-boarded`, `upgrade`, `extra-life`, `boss`, and `final-boss-music` events select their corresponding transcribed sound entries. `pow-boarded` is the helicopter-entry cue; leaving the jeep alone does not prematurely play that cue. Score tally and menu selection use the supplied text tick. Moving rescue helicopters receive a periodic rotor cue.

Water splash, projectile impact, infantry squish, bomber roar, laser, flame, portrait, mission-text and final-destruction sounds are also available in the sound table and event mapping where the model emits the corresponding event. Some enemy actions currently expose only a generic effect rather than a dedicated audio event; their specific sound is transcribed but cannot be triggered reliably until the model reports that action. This is an integration gap, not a missing melody.

## What is exact data, and what is approximate

The source note order, timer values, durations, repeats, channel assignments, source envelopes, stage mapping and available cinematic command timestamps are transcribed data. They can be inspected without listening to a recording. The music scheduler has no invented melody fallback.

The **sound output is an approximation** of the NES instruments:

- Pulse waves use band-limited periodic waves; triangle uses the Web Audio oscillator rather than the NES's exact stepped DAC waveform.
- Noise is independently generated with a 15-bit LFSR and the documented period table. Its phase restarts on notes and is not synchronized to the original hardware shift register.
- Pulse envelopes, gates and sweep behavior are reconstructed with gain/frequency automation. Hardware envelope clocks, length counters, sweep edge cases, nonlinear mixing and analog filtering are not cycle-identical.
- Intro/ending tempo uses the correct average update ratios. Fractional scheduling does not duplicate every individual skipped hardware frame.
- **Original DMC sample bytes are not present.** Drum onsets are retained, but the DMC kick/snare layer is replaced with newly synthesized triangle/noise transients. This is the principal missing original sound material; it is not presented as an exact sample reproduction.
- Effects are mixed over music in Web Audio; the original hardware's exact channel-stealing/priority behavior is not emulated.

No original melodic note table is missing for the music states listed above. These qualifications apply to timbre and timing fidelity, rather than substituting unrelated music.

## Host API and lifecycle

```js
const audio = new JackalAudio(); // optional { scoreUrl: 'art/data/audio-score.json' }
await audio.load();             // safe to preload alongside renderer.load()
await audio.unlock();           // create/resume AudioContext on a user action
audio.update(game);             // after game.step()
audio.pause(true);              // background: stop all sources and scheduler
// ...
audio.pause(false);             // resume the saved music position
audio.dispose();                // exit: stop sources/timer and close context
```

`load()` returns `null` and sets `audio.failed` if the optional external score is unavailable. The game remains playable. There is no external network fallback. The native server only needs to expose the exact local path `art/data/audio-score.json`; no audio media route is needed.

Events are consumed once per array and index, supporting the model's array reset on each step. A paused game retains its track position, including the case where the Android activity is backgrounded while already paused. On exit, all oscillator/buffer sources stop, the scheduling interval is cleared, and the AudioContext closes.

## Validation

The transcription was checked for monotonic onsets, positive durations, finite timer/envelope values and valid loop boundaries. Chromium scheduled all 41 entries without an exception, verified the 1/2/3/1/2/3 stage mapping, avoided duplicate retained events, resumed after combined game/app pause, and scheduled music beyond a loop boundary. Backgrounding left zero sources and no scheduling timer; disposal closed the AudioContext. These checks validate the implementation and data integration, not sample-identical output or final television speaker quality.
