# Preserved browser preflight attempts

These are original failed reports, actual captures/videos and exact executed test files. No report was edited to turn a failure into a pass. The corresponding `cf-N-archive.json` binds every archived byte.

- `cf-1`: menu and connected identity passed. The test incorrectly required DOWN from the bottom Start control to change focus; the game correctly had no lower selectable control.
- `cf-2`: changed the navigation test to UP, but the software renderer did not consume another frame within the fixed 420 ms observation window (`pollCount` stayed 13). The test now waits for the actual input-consuming frame and for a release frame, using normal wall-clock time.
- `cf-3`: five groups passed, including actual start, movement, left/right turn, vertical aim, firing and magazine consumption. Reload genuinely began; 12 seconds of wall time did not advance enough game time to finish the ordinary reload under SwiftShader. The next run retains the same reload-finished assertion with a 120-second wall-clock bound. No clock or game state is overridden.

The 1280×720 connected menu and playing capture from `cf-3` were visually inspected: the game world, original interface and complete controller ID are visible. These preflight results do not count as complete CF acceptance and do not claim TCP/native hardware coverage.
