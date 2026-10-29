import { runCompatibilityTests } from '../../../../tools/tests/modern-game-harness.mjs';
import { runRuntimeInputTests } from './runtime-input.mjs';
await runCompatibilityTests({kind:'cozy-island'});
await runRuntimeInputTests();
