# Kartipelago

An original adventure kart racer you can play in your browser. Drive, hover and fly
across a chain of islands, race rivals, and unlock new worlds.

> **Status:** playable from boot to finish line: title screen, four dinosaur racers, Tracks mode
> with two worlds (the four-course Dinosaur Valley, and a Test World of six
> prototypes), racing seven AI rivals or solo time trials, pause, results, records,
> options and an original soundtrack. Adventure mode is coming. See the
> [roadmap](docs/ROADMAP.md).

## Play

The latest build of `main` is deployed automatically to GitHub Pages:
`https://blakebates22.github.io/kartipelago/`

## How to play

Start the game, press **Enter** (or click, or press **Start** on a gamepad), pick
**Play**, choose your racer, then **Tracks**, a track and a race type.

| Action             | Keyboard           | Gamepad      |
| ------------------ | ------------------ | ------------ |
| Accelerate         | W or ▲             | A or RT      |
| Brake / reverse    | S or ▼             | X or LT      |
| Steer              | A D or ◀ ▶         | Stick, d-pad |
| Drift              | Space or Shift     | RB or LB     |
| Use item (release) | E or F             | B or Y       |
| Pause              | Esc or P           | Start        |
| Menus              | Arrows, Enter, Esc | D-pad, A, B  |

Settings and personal bests are saved in your browser. How the menus, music and
screens fit together: [docs/frontend.md](docs/frontend.md).

## Run it locally

You need [Node.js](https://nodejs.org) 24 or newer (it includes npm 11, which this project needs).

```bash
npm install
npm run dev      # starts a local server with hot reload
```

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Local dev server with hot reload                   |
| `npm run build`     | Production build into `dist/`                      |
| `npm run preview`   | Serve the production build locally                 |
| `npm run typecheck` | TypeScript type checking                           |
| `npm test`          | Run unit tests once                                |
| `npm run format`    | Auto-format all files                              |
| `npm run check`     | Everything CI runs: format, types, tests and build |

## Debug tools

Press the **backtick key** (`` ` ``) in game, or open the page with `?debug` in the URL.

- **Overlay** (top left): FPS, frame time, simulation tick, plus any value a system reports.
- **Tuning panel** (top right): live controls for every value in
  [`assets/data/tuning.json`](assets/data/tuning.json). When something feels right, click
  **Copy tuning JSON** and paste it into the file.

In dev, saving `tuning.json` hot-reloads the values without restarting the game.

## Project layout

```
src/
  app/       screen manager, menu input, settings, records
  screens/   title, racer select, modes, tracks, loading, race HUD and pause, options...
  game/      the race session and the track list
  ui/        pixel font, menu textures, the UI canvas
  audio/     audio engine, synthesized instruments, the soundtrack
  core/      game loop, fixed timestep, tuning data
  render/    Three.js renderer, racers, track views
  physics/, vehicles/, race/, ai/, items/, world/   the game itself
  debug/     overlay and tuning panel
assets/
  data/      tuning.json and other game data
docs/        design doc, architecture, roadmap, milestone specs
tests/       unit tests (Vitest)
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially the **originality rule**: every
character, track, name, sound and model in this project must be our own or openly licensed.

## License

Code is released under the [MIT License](LICENSE). Asset licenses are listed in
[assets/CREDITS.md](assets/CREDITS.md).
