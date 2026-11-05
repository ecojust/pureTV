"""Runner controls and real aapt2 output regressions; no SDK or device is used."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    "tv_emulator_runner", ROOT / "desktop/scripts/run-tv-emulator-compatibility.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

# Actual Build Tools 35 aapt2 output, API23 job in GitHub run 42074502535.
# The minSdkVersion field differs from the old aapt sdkVersion field.
BADGING = """package: name='org.puretv.compatfixture' versionCode='1' versionName='1' platformBuildVersionName='15' platformBuildVersionCode='35' compileSdkVersion='35' compileSdkVersionCodename='15'
minSdkVersion:'19'
targetSdkVersion:'28'
application: label='pureTV emulator test fixture' icon=''
application-debuggable
feature-group: label=''
  uses-feature: name='android.hardware.faketouch'
  uses-implied-feature: name='android.hardware.faketouch' reason='default feature for all apps'
supports-screens: 'small' 'normal' 'large' 'xlarge'
supports-any-density: 'true'
locales:
densities:
"""


@unittest.skipUnless(platform.system() == "Linux", "The isolated emulator runner requires Linux")
class RunnerControls(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="puretv-runner-control-")
        self.root = Path(self.directory.name)
        self.run = runner.Run(self.root, os.environ.copy())

    def tearDown(self):
        self.directory.cleanup()

    def test_command_exit_and_nonzero(self):
        self.assertEqual(self.run.command("success", [sys.executable, "-c", "print('ready')"]), (0, "ready\n"))
        with self.assertRaisesRegex(runner.Failure, "exited 7"):
            self.run.command("nonzero", [sys.executable, "-c", "raise SystemExit(7)"])

    def test_command_timeout_is_bounded(self):
        started = time.monotonic()
        with self.assertRaisesRegex(runner.Failure, "timeout"):
            self.run.command("timeout", [sys.executable, "-c", "import time; time.sleep(60)"], timeout=0.15)
        self.assertLess(time.monotonic() - started, 8)

    def test_success_exit_cannot_hide_output_limit(self):
        # Sparse output exercises the real limit without allocating 17 MiB.
        with self.assertRaisesRegex(runner.Failure, "diagnostic output limit"):
            self.run.command("oversize", [sys.executable, "-c", "import os; os.ftruncate(1, 17*1024*1024)"])

    def test_monitor_refuses_before_command_starts(self):
        def fail():
            raise runner.EmulatorFailure("monitor refusal")
        self.run.monitor = fail
        with self.assertRaises(runner.EmulatorFailure):
            self.run.command("refused", [sys.executable, "-c", "raise SystemExit(99)"])
        self.assertEqual(list(self.root.iterdir()), [])

    def test_monitor_stops_only_its_owned_command(self):
        pid_path = self.root / "child.pid"
        def monitor():
            if pid_path.exists():
                raise runner.EmulatorFailure("simulated emulator output cap")
        self.run.monitor = monitor
        code = ("import os,pathlib,sys,time; pathlib.Path(sys.argv[1]).write_text(str(os.getpid())); "
                "time.sleep(60)")
        unrelated = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"],
                                     start_new_session=True)
        try:
            started = time.monotonic()
            with self.assertRaisesRegex(runner.EmulatorFailure, "output cap"):
                self.run.command("monitored", [sys.executable, "-c", code, pid_path])
            self.assertLess(time.monotonic() - started, 8)
            with self.assertRaises(ProcessLookupError):
                os.kill(int(pid_path.read_text()), 0)
            self.assertIsNone(unrelated.poll())
        finally:
            unrelated.kill()
            unrelated.wait(timeout=5)

    def test_monitor_checks_success_and_final_diagnostics_can_still_run(self):
        calls = []
        self.run.monitor = lambda: calls.append(True)
        self.run.command("monitored-success", [sys.executable, "-c", "pass"])
        self.assertGreaterEqual(len(calls), 2)
        def fail():
            raise runner.EmulatorFailure("already stopped")
        self.run.monitor = fail
        self.assertEqual(self.run.command("final-diagnostic", [sys.executable, "-c", "print('saved')"],
                                         diagnostic=True), (0, "saved\n"))

    def test_non_hosted_execution_retains_e0_without_running_commands(self):
        artifacts = self.root / "guard"
        with mock.patch.dict(os.environ, {"GITHUB_ACTIONS": "false"}), contextlib.redirect_stdout(io.StringIO()):
            result = runner.main(["--image", "api23-tv", "--artifacts", str(artifacts)])
        self.assertEqual(result, 1)
        report = json.loads((artifacts / "summary.json").read_text())
        self.assertEqual((report["status"], report["stage"], report["evidenceLevel"]), ("FAIL", "setup", "E0"))
        self.assertFalse(report["emulatorTested"])
        self.assertFalse(report["physicalTvTested"])
        self.assertEqual([file.name for file in artifacts.iterdir()], ["summary.json"])

    def test_failure_excerpt_uses_only_bounded_tail(self):
        path = self.root / "failed-command.log"
        path.write_bytes(b"not-in-the-tail\n" + b"x" * 5000 + b"actual loader error\n")
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            runner.print_diagnostic_excerpt(path)
        self.assertNotIn("not-in-the-tail", output.getvalue())
        self.assertIn("actual loader error", output.getvalue())
        self.assertLess(len(output.getvalue()), 4300)


class FakeBuildTools:
    """Supply builder output only; files are deliberately not real APKs."""
    def __init__(self, artifacts, badging):
        self.artifacts, self.badging = artifacts, badging

    def command(self, name, args, **kwargs):
        if name.endswith("-link"):
            # Model aapt2's actual manifest precedence, not the command's name.
            manifest = ET.parse(args[args.index("--manifest") + 1]).getroot()
            self.version_code = manifest.attrib[runner.ANDROID_NS + "versionCode"]
            self.version_name = manifest.attrib[runner.ANDROID_NS + "versionName"]
        if name.endswith("-sign"):
            Path(args[args.index("--out") + 1]).write_bytes(b"FAKE APK: validation test only")
        if name.endswith("-verify"):
            return 0, "Verified using v1 scheme (JAR signing): true\n"
        if name.endswith("-identity"):
            return 0, self.badging.replace("versionCode='1'", f"versionCode='{self.version_code}'").replace(
                "versionName='1'", f"versionName='{self.version_name}'")
        return 0, ""


class FixtureBadging(unittest.TestCase):
    def check_output(self, badging, valid=False):
        with tempfile.TemporaryDirectory(prefix="puretv-fixture-badging-") as temp:
            root = Path(temp)
            fake = FakeBuildTools(root, badging)
            if valid:
                paths = runner.fixture_apks(fake, runner.configuration(), root / "fake-sdk", root)
                report = json.loads((root / "fixture.json").read_text())
                self.assertEqual(len(paths), 2)
                self.assertEqual([item["versionCode"] for item in report["versions"]], [1, 2])
                self.assertTrue(all(len(item["sha256"]) == 64 for item in report["versions"]))
            else:
                with self.assertRaisesRegex(runner.Failure, "SDK bounds"):
                    runner.fixture_apks(fake, runner.configuration(), root / "fake-sdk", root)
                self.assertFalse((root / "fixture.json").exists())

    def test_real_aapt2_35_min_sdk_format(self):
        self.check_output(BADGING, valid=True)

    def test_wrong_min_sdk_rejected(self):
        self.check_output(BADGING.replace("minSdkVersion:'19'", "minSdkVersion:'18'"))

    def test_wrong_target_sdk_rejected(self):
        self.check_output(BADGING.replace("targetSdkVersion:'28'", "targetSdkVersion:'27'"))

    def test_duplicate_min_sdk_rejected(self):
        self.check_output(BADGING + "minSdkVersion:'19'\n")

    def test_conflicting_min_sdk_rejected(self):
        self.check_output(BADGING + "minSdkVersion:'23'\n")

    def test_unexpected_legacy_aapt_field_rejected(self):
        self.check_output(BADGING.replace("minSdkVersion:", "sdkVersion:"))


class PrivilegeFacts(unittest.TestCase):
    def test_android_shell_uid_and_build_type_are_actual_facts(self):
        result = runner.privilege_facts(0, "uid=2000(shell) gid=2000(shell) groups=1004(input),1007(log) context=u:r:shell:s0\n",
                                        0, "user\n")
        self.assertEqual(result["shellUid"], 2000)
        self.assertFalse(result["adbShellRoot"])
        self.assertEqual(result["buildType"], "user")

    def test_root_and_system_uid_are_not_confused(self):
        for uid, name, rooted in ((0, "root", True), (1000, "system", False)):
            with self.subTest(uid=uid):
                result = runner.privilege_facts(0, f"uid={uid}({name}) gid={uid}({name})", 0, "userdebug")
                self.assertEqual(result["shellUid"], uid)
                self.assertEqual(result["adbShellRoot"], rooted)

    def test_failed_or_malformed_identity_stays_unknown(self):
        for code, output in ((1, "uid=0(root) gid=0(root)"), (0, "usage: id"),
                             (0, "uid=02000(shell) gid=2000(shell)"),
                             (0, "uid=2000(shell) gid=2000(shell) uid=0(root)"),
                             (0, "error\nuid=0(root) gid=0(root)")):
            with self.subTest(code=code, output=output):
                result = runner.privilege_facts(code, output, 0, "not-a-build-type")
                self.assertIsNone(result["shellUid"])
                self.assertIsNone(result["adbShellRoot"])
                self.assertIsNone(result["buildType"])

    def test_build_type_nonzero_is_not_verified(self):
        self.assertIsNone(runner.privilege_facts(0, "uid=2000 gid=2000", 1, "eng")["buildType"])


class FakePrivilegeCommands:
    def __init__(self, before=0, after=2000, qemu="1", unroot_exit=0):
        self.before, self.after, self.qemu, self.unroot_exit = before, after, qemu, unroot_exit
        self.commands = []
        self.now = 0
        self.deadline = 100

    def sleep(self, seconds):
        self.now += seconds

    def command(self, name, args, **kwargs):
        self.now += 0.05
        self.commands.append(args)
        if args[-1] == "unroot":
            return self.unroot_exit, "restarting adbd as non root\n"
        if args[-1] == "id":
            uid = self.after if name.startswith("unroot-") else self.before
            return 0, "usage: id" if uid is None else f"uid={uid} gid={uid}\n"
        if args[-1] == "ro.build.type":
            return 0, "userdebug\n"
        if args[-1] == "ro.kernel.qemu":
            return 0, self.qemu
        if args[-1] == "ro.build.version.sdk":
            return 0, "23\n"
        raise AssertionError("Unexpected command")


class EmulatorPrivilegeReduction(unittest.TestCase):
    BOOT = {"ro.kernel.qemu": "1", "ro.build.version.sdk": "23", "sys.boot_completed": "1"}

    def prepare(self, fake, boot=None):
        report = {}
        with mock.patch.object(runner.time, "monotonic", side_effect=lambda: fake.now), \
                mock.patch.object(runner.time, "sleep", side_effect=fake.sleep):
            runner.prepare_emulator_privilege(fake, Path("fake-adb"), 23, self.BOOT if boot is None else boot, report)
        self.assertTrue(all(command[1:3] == ["-s", "emulator-5554"] for command in fake.commands))
        self.assertFalse(any(command[-1] == "root" for command in fake.commands))
        return report

    def test_verified_root_emulator_reduces_to_actual_shell_uid(self):
        fake = FakePrivilegeCommands()
        report = self.prepare(fake)
        self.assertEqual(report["before"]["shellUid"], 0)
        self.assertEqual(report["after"]["shellUid"], 2000)
        self.assertTrue(report["unrootRequested"])
        self.assertFalse(report["rootRequested"])
        self.assertTrue(report["ordinaryAdbShellVerified"])
        self.assertTrue(report["identityReverifiedAfterUnroot"])
        self.assertIsNone(report["limitation"])

    def test_existing_shell_uid_does_not_change_daemon_privilege(self):
        fake = FakePrivilegeCommands(before=2000)
        report = self.prepare(fake)
        self.assertFalse(report["unrootRequested"])
        self.assertFalse(any(command[-1] == "unroot" for command in fake.commands))
        self.assertTrue(report["ordinaryAdbShellVerified"])

    def test_success_message_cannot_hide_persistent_root(self):
        fake = FakePrivilegeCommands(after=0)
        report = self.prepare(fake)
        self.assertEqual(report["unrootCommandStatus"], "exit_zero")
        self.assertTrue(report["adbShellRoot"])
        self.assertFalse(report["ordinaryAdbShellVerified"])
        self.assertIsNotNone(report["limitation"])
        self.assertLessEqual(fake.now, 31)

    def test_unroot_failure_keeps_actual_privilege_condition(self):
        report = self.prepare(FakePrivilegeCommands(after=0, unroot_exit=1))
        self.assertEqual(report["unrootCommandStatus"], "nonzero_exit")
        self.assertTrue(report["adbShellRoot"])
        self.assertFalse(report["ordinaryAdbShellVerified"])

    def test_unknown_initial_uid_does_not_request_unroot(self):
        fake = FakePrivilegeCommands(before=None)
        report = self.prepare(fake)
        self.assertFalse(report["unrootRequested"])
        self.assertIsNone(report["shellUid"])
        self.assertFalse(report["ordinaryAdbShellVerified"])

    def test_missing_boot_identity_prevents_all_commands(self):
        fake = FakePrivilegeCommands()
        with self.assertRaisesRegex(runner.Failure, "exact booted emulator"):
            self.prepare(fake, {})
        self.assertEqual(fake.commands, [])

    def test_changed_device_identity_blocks_manager_operations(self):
        fake = FakePrivilegeCommands(qemu="0")
        with self.assertRaisesRegex(runner.EmulatorFailure, "identity changed"):
            self.prepare(fake)
        self.assertFalse(any(command[-1] == "root" for command in fake.commands))

    def test_unavailable_identity_has_a_bounded_recheck(self):
        fake = FakePrivilegeCommands(qemu="")
        with self.assertRaisesRegex(runner.Failure, "could not be reverified"):
            self.prepare(fake)
        self.assertLessEqual(fake.now, 31)

    def test_pre_restart_identity_cannot_survive_later_offline_state(self):
        class GoesOffline(FakePrivilegeCommands):
            checks = 0

            def command(self, name, args, **kwargs):
                result = super().command(name, args, **kwargs)
                if name == "unroot-qemu":
                    self.checks += 1
                    if self.checks > 1:
                        return 1, "device offline"
                return result

        fake = GoesOffline(after=0)
        with self.assertRaisesRegex(runner.Failure, "could not be reverified"):
            self.prepare(fake)
        self.assertGreater(fake.checks, 1)
        self.assertLessEqual(fake.now, 31)


if __name__ == "__main__":
    unittest.main()
