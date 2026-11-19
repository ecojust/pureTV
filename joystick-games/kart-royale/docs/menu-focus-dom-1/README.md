# Kart Royale menu-focus and renderer observation repair

Original Mac ARM run 44605303936 has separate failures: native mode visibly lost its graphics context; occupied-port and Rosetta reached character selection with focus still outside the active menu. The next A focused the first Vela card instead of starting the race. The original reports are preserved and remain failures.

Ordinary Chromium DOM navigation passed at three dimensions. A separate regression fixture hides the actual select root for one adapter poll, then restores its original CSS. The old source never retries its failed default focus and the next A merely focuses Vela. The repaired adapter retries only when focus is outside the active root, preserves a user-selected in-menu item, and invokes the original start callback once. This synthetic failure does not establish Safari's exact cause.

The snapshot now reports null for null or unknown GL version strings; a non-null context object alone is insufficient proof of WebGL availability. The roster QA step also waits for the original Start race focus before sending A. Twelve unit tests, the build, five-file deterministic build check, and three repaired DOM cases pass. New native packages and native calibration remain pending.

All executed fixtures, input hashes, before/after observations, screenshots, original plan, exact tested source, build logs and validation summary are retained here. No game physics, race clock or native transport was exercised by the DOM fixtures.
