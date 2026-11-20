# Owned QEMU diagnostic integration

Status: implementation and local boundaries reviewed; actual same-permission CI capability remains unverified. No workflow was dispatched and no new QEMU/AVD was started for this change.

The original Pon v8 run `44630011092`, QA `467670b4e43189dc8fc4786a5c6b3a14b6f9b2bd`, still records its actual parent wait `-11 / SIGSEGV`. Disabling Vulkan did not avoid that failure. This diagnostic does not identify Vulkan or another component as the cause.

## Isolated source and unchanged experiment

`local-attempt-2/overlay-plan.json` lists exactly six QA paths to overlay on the v8 parent. The three existing files were identical between that parent and the integration starting commit `41f8db4`; the other three are new helpers/tests. Root must construct the isolated ref and verify that every other Git path remains the parent bytes.

Keep the original `run.py`, `test_runner.py`, Pon plan, APK, Observer, SDK and production tree. The original emulator configuration stays API 36, stable build `16970787`, 2048 MiB, `swiftshader_indirect`, with the v8 `-feature -Vulkan` arguments. `pon_capture_qemu_stack` defaults to false and requires the exact original Pon source/run/export plus both existing supervision and Vulkan-off flags. No new emulator argument is added.

The overlay is:

- `.github/workflows/joystick-catalog-android-runtime.yml`
- `joystick-games/tools/android-emulator-supervisor.py`
- `joystick-games/tools/android-qemu-stack.py`
- `joystick-games/qa/android/test_emulator_supervisor.py`
- `joystick-games/qa/android/test_qemu_permission.py`
- `joystick-games/qa/android/test_qemu_stack_integration.py`

## Permission and ownership

A same-user GDB process is configured first. Its actual PID/start/parent/UID/executable SHA is bound before the original launcher child is created. The child calls `PR_SET_PTRACER` with that exact positive GDB PID, then executes the unchanged launcher command. The callback is allowed only when both Python and `/proc/self/task` confirm one supervisor thread. The libc function and receipt bytes are prepared in the parent. Failure exits the child before the original executable and records the real errno.

The GDB PID remains unreaped across the grant/exec window. A two-byte receipt and the owned child's PID/start bind the grant to its actual exec. Successful permission is not sufficient to read frames: the helper waits for the fixed QEMU SHA in the original same-PID/start child, attaches once, then verifies its exact actual `TracerPid` and both identities. It repeats these checks before frame reads.

Linux Yama grants the named debugger and its descendants; the implementation nevertheless requires the actual tracer to be the exact bound GDB PID. It never uses `PR_SET_PTRACER_ANY`, sudo, a root identity bridge, or global ptrace/core/kernel configuration. Yama modes 2/3 are rejected. The official permission references and the original local `EINVAL` observations are preserved in the earlier core/proposal evidence; this integration does not replace those records.

GDB receives fixed commands only. Collection remains limited to four SIGSEGV events, four threads and twelve frames per event. Reports contain bounded frame addresses, function names and mapped module offsets/hashes. No locals, argument values, environment, arbitrary memory dumps or core files are requested/copied. Raw MI/console/stderr is not retained. The tool's `coreCreated:false` means it does not issue core creation commands; it does not change or claim to verify the operating system's existing core policy.

SIGSEGV is delivered back to the original process. A recoverable first signal is not labelled terminal. The original supervisor parent wait remains the only actual exit evidence. Diagnostic intervention is explicitly separated from a game's original report.

## Cleanup and remaining boundary

Normal completion/deadline uses MI asynchronous detach and debugger exit, with independent cleanup budgets and actual kernel state verification. A failed or delayed attach cannot cause the parent to reap the target early. Preparation/session constructor failures retain a cleanup owner, including a target that exits between constructing and starting a session.

If a debugger does not respond or exit and attachment remains unresolved, the supervisor marks cleanup incomplete and keeps the original child unreaped. The quarantine does not consume further raw MI; it waits for actual debugger exit. The original external cancellation/deadline control still applies and is recorded separately. No internal diagnostic failure sends a target kill signal. This exceptional quarantine does not guarantee termination within the diagnostic's 300-second collection budget; the workflow's outer timeout remains a boundary. Restore may restore the original SDK bytes but must still fail when supervisor cleanup is incomplete.

Default-off execution keeps the original spawning, SDK queries, argv and seven-second restore budget. The new tests add the explicit false environment key required by the workflow selector; they do not relax existing waits.

## Evidence and capability gate

`validation.json` and `inventory.json` bind the source copies and original logs. The first local attempt retains its two old-fixture missing-environment errors. The corrected second attempt records:

- Core: 28 passed, zero skips.
- Supervisor: 22 passed, zero skips.
- Integration boundaries: 9 passed, zero skips. Their synthetic grant is explicitly not kernel permission evidence.
- Ten new permission-test paths also passed under a separate scratch driver that mocked only the grant and used the environment's existing same-user attach permission. This verifies new owner/control wiring, including the real ELF parent's `-11`, but cannot authorize an AVD. The driver calls the test class directly and never produces a usable permission-gate report.
- The actual unmocked local permission gate failed its first test with `EINVAL` (22), zero skips. The other nine cases were not executed. No positive `PR_SET_PTRACER` capability is claimed.
- Actionlint reported no diagnostics.

Before starting any AVD, CI must find an executable `/usr/bin/gdb` and C compiler, pass the integration boundaries, and execute all ten real same-permission ELF cases with zero skips. That report binds the actual GDB SHA/path, helper/test SHA, runner, run, attempt and QA source. Preparation and launch verify it again. A failed/missing gate blocks the AVD; there is no fallback permission path.

The export retains original game reports unchanged. A diagnostic request always produces `runtimeAccepted:false` and `nativeAcceptanceAllowed:false`, even if ordinary game checks happen to pass. Its top-level diagnostic flag labels the requested experiment; actual attach/fault events remain separately recorded in the original trace report. No diagnostic result is a new delivery acceptance.
