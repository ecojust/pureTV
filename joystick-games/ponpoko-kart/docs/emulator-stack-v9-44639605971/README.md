# Pon QEMU stack v9: preflight fixture failure

Run `44639605971`, attempt 1, used isolated QA source `c22b297146547e5503f8dc9b0bfa9163518f6673`. It failed in generic QA contracts. The actual process-local permission gate, APK input binding and AVD/game execution were skipped. This run supplies no new QEMU crash, stack or permission-capability result.

The original failure is `owned_qemu_stack.Rejected: Missing bounded permission gate` in `test_stack_flag_is_default_off_exact_scope_and_never_changes_argv`. That negative fixture intended to reject a missing gate but expected the wrong exception types. Locally, an unset `RUNNER_TEMP` had produced an accepted `KeyError` before reaching the gate. CI defined `RUNNER_TEMP`, reached the real gate and correctly raised its own `Rejected` type.

Only that test method is corrected. It now supplies a controlled temporary path without a gate, uses the actual helper module and precisely expects `helper.Rejected` with the exact missing-gate message. The module instance is fixed so the exception class identity matches the actual call; permission validation itself is not mocked. The helper, supervisor implementation, workflow, emulator parameters and game production sources are unchanged.

`fixture-fix/` preserves the original failure reproduced from the 92-file isolated c22 source, the one-file candidate, its exact executed source set and the original six-suite replay under explicit CI-style variables. All six suites passed: 53 + 16 + 15 + 14 + 18 + 22 = 138 tests, zero skips. All other 91 source hashes and all other 28 test-class methods remained unchanged. This is local fixture validation, not an additional hosted run or successful permission check.

The original immutable export is `6d8567969e05a97fca87d61c6759280408d542e9`. All 58 blobs (1,211,847 bytes) were recovered and matched their Git blob and manifest hashes; all 43 declared executed-source copies matched c22. The export's preservation step succeeded, but its final integrity gate correctly failed because `verified-inputs/input-verification.json` was never generated after the earlier preflight failure. No export code was changed and no incomplete result is treated as accepted.

`analyze-original.py`, `findings.json` and `inventory.json` bind these records. The full original job log, early unavailable-log response, dispatch markers and run/job API responses remain unchanged. Root may prepare a new isolated ref whose sole change from c22 is the fixed test file; no ref or workflow POST was created by this recovery/fix.
