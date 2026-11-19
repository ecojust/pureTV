# Penguintrack original menu entry: DOM verification

Android run 44606071748 (source c5ad63e8c6a0ccfada5f763d1d26afa27f45002e) had Play focused initially but Controller focused before the first plan action; pressing A opened the original Controller help. The three successful Mac modes retained Play focus. The exact cause of the native focus change is not established.

Six DOM cases use the original Menu module, spatial navigation, TV adapter and shared controller bridge at 960×540, 1024×645 and 1280×720. Each dimension starts from both observed focus positions. Ordinary UP then DOWN reaches Play; A invokes the original campaign callback once. Geometry checks find the Play button, Controller button and ID card inside the viewport and unobstructed. Two captures were independently viewed (listed in summary.json).

The QA data plan adds those two directional actions with explicit original focus assertions, preserving all previous steps. Production source and dist are unchanged. The fixture sets the starting focus explicitly and records app.goto; it does not render or initialize a campaign or exercise native transport, physics, countdown or model state. Native calibration of the updated plan remains pending.

`report.json` retains all observations and source hashes; the executed scripts, raw log, screenshots, old plan and final validation summary remain alongside it. Original Android failures and successful Mac native reports are unchanged.
