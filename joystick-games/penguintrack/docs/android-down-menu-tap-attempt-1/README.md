# Penguin Android short DOWN QA candidate

Unique parent `15c9c1044b8cd2173e07b8eedfb836738cc79e1c`; exactly three QA overlays in `source-inventory.json`. The original c5 signed APK remains unchanged. Root alone materializes/ref/dispatches.

Original run44630032256 remains failed: synchronous Observer calls made declared80ms DOWN last2.22 seconds on the wire, ending on Settings. The first UP is deliberately left on its original held path: it clamps to Controller and that expectation may already be true. Only DOWN now uses the reviewed short SDK pair followed by exactACK, full release, expectation and two further fresh-poll checks. No page reset exception.

51 runner tests passed (39 original methods unchanged +12 boundaries). Four original-menu DOM cases reproduce long DOWN repeated navigation, UP clamp, single-poll DOWN to Play and A calling the original campaign handler. Real SDK transport tests are separate from synthetic DOM input. No game state/clock changes or new native pass is claimed.

See `result.json`, `source.diff`, `production-scope.json`, original failure archive and independent review. Existing nested-payload fix in parent15c9 is retained; original workflow/schema/SDK/production sources remain untouched.
