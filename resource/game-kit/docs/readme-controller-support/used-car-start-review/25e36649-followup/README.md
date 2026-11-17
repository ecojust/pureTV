# Used Car follow-up evidence

`android-delta.json` records the new supported-SwiftShader attempt: START completes and the observed game enters race, then the A-throttle readiness wait loses observer access. LEFT/RIGHT presses have not begun. The original failed status remains. The host kernel now records a RenderThread segmentation fault; that is separate from the prior unrelated Katniss WebView message and does not identify a JS root cause.

`browser-direction-analysis.json` independently checks the retained full-browser failed direction report without rerunning or writing any model. The original RIGHT center-projection delta is negative, so its assertion really failed. With the same actual before camera and center, the recorded body heading and front-wheel orientation project right for RIGHT and left for LEFT. The center-travel test mixes forward perspective and prior vehicle motion; it alone cannot establish reversed controls. The analysis does not replace or mark the failed test passed.

Production, QA tools and original reports remain unchanged.
