# Kart Rush — source and license notice

Upstream: https://github.com/stevkazt/kart-rush
Fixed commit: `4b0cf276d84e76171feb765d87b5e8a6159cc421`.

The inspected root tree at that commit contains no LICENSE or COPYING file. No project-wide license grant was identified. This is a factual license-status notice, not a license for the original game, and the pureTV adaptation does not assign MIT or another license to the original game code or art. Upstream authors retain their rights. Before public redistribution, resolve authorization with the upstream rights holder; technical packaging does not establish that authorization.

The original procedural art, tracks, racer designs, kart bodies, physics, rules, sound synthesis and interface are retained. Adaptation changes are limited to offline dependency imports, pureTV input and lifecycle support, telemetry/service-worker removal, explicit throttle and TV focus/help. `upstream.json` records the original file URLs, byte sizes and SHA-256; `docs/source-changes.json` identifies changed originals. New adapters are identified separately rather than represented as upstream files.

Bundled third-party dependencies have their own license grants:

- Three.js 0.160.0: MIT, original notice in `src/vendor/THREE-LICENSE.txt`.
- cannon-es 0.20.0: MIT, original notice in `src/vendor/CANNON-LICENSE.txt`.

`dependency-lock.json` pins their exact downloaded bytes. Dependency MIT notices do not apply to the game's original code. No account, remote API, CDN, telemetry endpoint or online asset request is required to play this adaptation. Wi-Fi controller discovery and TCP port 63485 are supplied by the shared native host.
