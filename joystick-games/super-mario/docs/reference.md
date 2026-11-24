# Super Mario TV: reference and reconstruction notes

This is an independently implemented, first-game **Super Mario Bros. (1985)** inspired platform game. It does not run a ROM and does not contain an extracted program, level dump, sprite sheet, sound recording or original soundtrack. It is not Super Mario Bros. 3. Names identify the gameplay reference; this is an unofficial project.

The 32 courses are **independently reconstructed routes, not the original ROM's exact tile coordinates**. Their layouts, movement parameters, enemy timing, graphics and music are not claimed to be pixel-, frame- or cycle-identical to the commercial game.

## References checked

- [Super Mario Bros. — Super Mario Wiki](https://www.mariowiki.com/Super_Mario_Bros.) — checked 2026-10-28 for the eight-world/four-course structure, world themes, power-ups, running/jumping, flagpole scoring, castle axe and alternating Mario/Luigi turns after a lost life.
- [Super Mario Bros. — Wikipedia](https://en.wikipedia.org/wiki/Super_Mario_Bros.) — background reference for the original 1985 game, rather than later Super Mario titles.

- [Fireworks — Super Mario Wiki](https://www.mariowiki.com/Fireworks), [Goal Pole](https://www.mariowiki.com/Goal_Pole), and [Axe](https://www.mariowiki.com/Axe) — checked 2026-10-29 for touch-time fireworks conditions, five flagpole score tiers, and skipping bridge collapse after a fireball defeat.

References describe observable rules. No code, tile map, ROM or artwork was copied from them.

## Implemented rules

- A 256 × 240 game view with a fixed score/coins/world/time strip and horizontally scrolling world. Physics advances at a fixed 60.0988 steps per second; display refresh does not change movement speed.
- Left/right acceleration and inertia; B raises the movement cap from 1.75 to 3.1 pixels per physics step. A begins a jump, and keeping A held while rising produces a higher arc. Water uses repeated A swimming strokes and slower horizontal movement.
- Items released from blocks rise into view before becoming collectible or moving sideways; the rise time is independently tuned. Small, Super and Fire forms. Mushrooms increase size; a power block yields a flower when the player is already large. A flower collected by a small player first produces Super form. Damage returns a large character to small form with brief invulnerability. Stars grant temporary invulnerability; green mushrooms grant a life.
- Large characters use a real short collision body while crouching, preserve running momentum through low passages, and cannot stand up through ceilings. Moving lifts carry standing players on both halves of their cycle.
- Airborne stomp chains and rolling-shell chains award escalating scores and then extra lives, with floating score/1UP feedback. Landing resets the stomp chain; stopping or kicking a shell starts its next chain.
- Head collisions open question blocks, collect their coins or release items. A large character breaks bricks. Collecting 100 coins grants an extra life. Collectible coins, item pickups, defeated enemies, flag height and remaining time contribute to score.
- Goombas, green/red Koopas, Buzzy Beetles, Piranha Plants, fish, Bloopers, Hammer Bros., fire bars and castle bosses. Stomps, stationary/moving shells, fireballs and star collisions have separate behavior. Red Koopas turn at ledges. Buzzy Beetles resist fireballs. A boss takes five fireball hits, or can be defeated by the bridge axe.
- Only the active player's inputs move the character or pause the game. In two-player mode, losing a life passes the turn; each player retains their own stage, lives, score and checkpoint. Reconnecting the active controller resumes an automatic disconnect pause, but does not cancel a manual pause.
- Supported pipes lead to a separate coin room, then return to the same course, with size-aware placement above the floor. Non-castle courses use a staged flagpole clear: lock to the pole, slide with the flag, walk into the castle, then convert remaining time to score. Touch-time timer digits 1, 3 and 6 produce that many fireworks, worth 500 points each. Flagpole heights award 100/400/800/2000/5000; the thresholds, animation speeds and melody are independently tuned.
- A castle axe removes bridge sections from its end, allowing a living boss to visibly fall before the character walks right. A boss already defeated by fireballs skips the collapse. Castles do not produce fireworks. Goal sequences ignore movement buttons, freeze on pause/disconnect, and settle scores once. The real stage-clear transition advances through all 32 courses, and 8-4 leads to an ending screen.
- Fireballs distinguish wall impacts from downward landings: walls consume the shot, floor/brick tops bounce it, and each shot can hit only one foe. Buzzy Beetles consume fireballs without taking damage.
- Timer expiry and falling cost lives. Checkpoint respawn chooses clear, supported ground so a saved position on a pipe or stair cannot trap the returning character.
- Highest score and music preference persist locally. Current run progress does not persist across application exit.

A and B retain their gameplay roles. SELECT changes the player count on the title screen and toggles music while paused. A separate TV button also controls music. START starts/pauses/resumes. Music uses newly composed short synthesized themes and effects; it does not reproduce the original soundtrack.

## Course sequence

Each entry is generated from its own explicit course recipe: width, pit positions and widths, pipe positions, staircase positions and theme-specific details. The recipes are not a single course repeated with a new palette. However, block clusters, tree platforms, castle fire bars and most enemy placements still use shared periodic generators. Distinct map hashes establish variation, not faithful reconstruction of each original course. Enemy and obstacle density increases through later worlds. Enemy-type selection now uses placement order so the coordinate stride cannot accidentally remove all Koopas from worlds 3 and 6.

| World | First course                                           | Second course                                          | Third course                                | Fourth course                              |
| ----- | ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------- | ------------------------------------------ |
| 1     | Ground: introductory question blocks, pipes and stairs | Underground: ceiling, brick structures and a coin room | Treetops: raised platforms and moving lifts | Castle: lava, fire bars, boss bridge       |
| 2     | Ground: longer pipe/gap combinations                   | Underwater: swimming, coral, fish and Bloopers         | Treetops: wider gaps                        | Castle: altered platforms and lava spacing |
| 3     | Night ground                                           | Night ground with another route                        | Treetops with overhead landing choices      | Castle with four-tile lava gaps            |
| 4     | Ground: more frequent obstacles                        | Underground: a new pipe/stair route                    | Treetops with late staircase                | Castle: new fire-bar and gap placement     |
| 5     | Ground with denser enemy patterns                      | Ground with offset pipe and gap sequence               | Treetops with longer progression            | Castle with a longer approach              |
| 6     | Night ground                                           | Night ground with separate route                       | Treetops with alternate lift timing         | Castle with longer fire bars               |
| 7     | Ground with later-game enemies                         | Underwater with a longer route                         | Bridge/platform route                       | Castle with later-game obstacle spacing    |
| 8     | Long ground course                                     | Ground with separated staircase sections               | Ground with late-game enemies and gaps      | Final castle and ending                    |

The first course deliberately presents familiar opening landmarks: the lone question block, a short brick/question group, and successive pipes. The complete map is still independently laid out.

## Scope differences from the original

This release covers the central platforming loop and a full eight-world progression, rather than every original behavior. It does not reproduce exact original map coordinates, warp-zone destinations, vine/cloud bonuses, maze-repetition castle routing, Lakitu/Spiny, Bullet Bill/cannon and Koopa Paratroopa sequences, every enemy animation, the precise original timing/scoring tables, ROM glitches, or a second harder quest. Underwater and underground exits are simplified into this game's course/flag progression. Castle bosses share one independently implemented boss behavior; original impostor reveal variations are not recreated.

The largest remaining course-identity gaps are the missing flying-fish bridges in 2-3 and 7-3, shared castle obstacle patterns rather than maze routing, and simplified underground/underwater exits. Current 2-3 uses the treetop generator. The final 12 tiles of flag courses are reserved as a clear, supported castle approach; this corrects staircase overlap in the independently generated 4-2 and 7-2 exits, rather than claiming original map coordinates. Castle rescue rooms, original retainer/princess staging and impostor reveal animations remain simplified.

The introductory world banner does not block controller input. Crouch-slide collision and chain rewards are now supported; their movement and timing remain independently tuned.

## Code and asset boundaries

| File                                | Responsibility                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/main/assets/game-model.js`     | Fixed-step rules, collision, 32 explicit course recipes, items, enemies, turns and progression |
| `src/main/assets/renderer.js`       | Self-drawn pixel sprites, tile textures, backgrounds, HUD, title and ending                    |
| `src/main/assets/audio.js`          | Original synthesized effects and short melodies; bounded voices and explicit cleanup           |
| `src/main/assets/runtime.js`        | Native room snapshots, keyboard mapping, player status, visibility/exit cleanup                |
| `src/main/assets/bootstrap.js`      | Visible startup errors, including failed script loads                                          |
| `src/main/assets/game.js`           | Game construction and local score/music preferences                                            |
| `src/main/assets/tv.html`, `tv.css` | TV layout and bilingual room sidebar                                                           |
| `logo.svg`                          | Self-drawn 64 × 64 static SVG; reusable by the manager/launcher                                |

`MarioHost` is the Android bridge. `MarioTV.game.status()` reports `phase`, a one-based `stage`, `stageLabel`, a one-based `activePlayer`, and the two players' own lives, score, stage and active-turn flags. Only the current player has a moving world actor. `MarioTV.game.player()` returns that actor for rendering and diagnostics. Normal lifecycle methods such as `loseLife()` and `finishStage()` are also used by explicitly identified lifecycle test fixtures; they are not hidden game cheats.

## Verification boundaries

Run:

```sh
node --test resource/apps/super-mario/tests/model.test.cjs
```

The model tests cover motion, variable jump height, head collisions, items, coins/lives, damage, stomps, shells, fireballs, boss hits, pipe travel, swimming, player turns, disconnects, timer/game over, checkpoints, distinct geometry, fixed-step behavior, music persistence, crouch-slide clearance, full moving-lift cycles, stomp/shell chains, staged goal clears, timer-digit fireworks and exact once-only bonuses, bridge collapse/previously-defeated bosses, paused clear sequences, emerging pickups, projectile collision isolation and progression.

The full-course traversal test starts normally and reaches **all 32 real flag/axe exits in sequence using controller input**. It does not teleport, edit terrain, grant flight, force a stage clear or skip transitions. Enemies are deliberately removed in that particular test to isolate geometric reachability; it does not replenish time or lives, reset positions within a route, or force a clear. It is not evidence of an unassisted enemy-complete run. Because that fixture removes bosses too, its axe exits correctly skip collapse; separate controlled boss fixtures exercise actual bridge collapse and falling. A separate first-course smoke test keeps all real enemies enabled and reaches its flag using normal input without losing a life. Focused enemy collision tests cover the remaining combat mechanics.

Browser/compatibility tests exercise the real bundled TV/controller pages, room-state updates, simultaneous phone controls, alternating turns, startup errors and audio cleanup. Those captures use a simulated native bridge and are not physical television screenshots. Physical-TV performance, real phone Wi-Fi latency and an unassisted 32-course playthrough remain outside the automated verification claim.

## Native character and HUD artwork (0.5.2 source)

The character renderer now selects independently drawn native grids: 16×16 small poses and 16×32 large poses, each with three running frames, an airborne pose and a pole-climbing pose. A separate short large-character crouch is foot-aligned to the existing collision body. The 30-pixel large collision height is unchanged; its artwork extends two pixels above it. Large characters are no longer vertically stretched copies of the small bitmap, including on the ending screen. Mario, Luigi and Fire form use distinct three-color palettes with no new 3D treatment.

The gameplay HUD uses its own bold 8×8 cells and the SMB1 score/coin/world/time arrangement. Modern pause and connection notices retain the compact project font. Artwork and palette values remain independently drawn approximations, not extracted CHR tiles or claims of exact original pixel coordinates. The scene still renders at 256×240 with nearest-neighbor sampling; this change does not alter screen aspect ratio, game physics or course layouts.

`tests/renderer.test.cjs` checks native one-pixel drawing, feet alignment, independent run/jump/crouch silhouettes, horizontal mirroring, three-color forms and bounded 8-pixel HUD cells. Controlled browser previews demonstrate these drawings; they do not establish original-hardware equivalence.
