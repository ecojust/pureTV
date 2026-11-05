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
        if name.endswith("-sign"):
            Path(args[args.index("--out") + 1]).write_bytes(b"FAKE APK: validation test only")
        if name.endswith("-verify"):
            return 0, "Verified using v1 scheme (JAR signing): true\n"
        if name.endswith("-identity"):
            version = "2" if "-v2-" in name else "1"
            return 0, self.badging.replace("versionCode='1'", f"versionCode='{version}'").replace(
                "versionName='1'", f"versionName='{version}'")
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


if __name__ == "__main__":
    unittest.main()
