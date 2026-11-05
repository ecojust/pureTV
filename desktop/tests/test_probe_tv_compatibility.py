"""Cross-platform boundary tests; no real ADB or television is used."""
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
from contextlib import redirect_stdout, redirect_stderr


SCRIPT = Path(__file__).resolve().parents[1] / "scripts/probe-tv-compatibility.py"
SPEC = importlib.util.spec_from_file_location("tv_compatibility_probe", SCRIPT)
probe = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = probe
SPEC.loader.exec_module(probe)
SERIAL = "192.168.1.16:5555"
PRIVATE_PACKAGE = "com.private.personalaccount"


class FakeAdb(probe.AdbReader):
    """Inject command results below the production target/allowlist boundary."""
    def __init__(self, sdk="33", overrides=None, devices=None):
        super().__init__("fake-adb", SERIAL)
        self.calls = []
        self.sdk = sdk
        self.overrides = overrides or {}
        self.device_text = devices if devices is not None else (
            "List of devices attached\n" + SERIAL + "\tdevice model:PrivateDevice\n"
            "another-secret-serial\tdevice model:OtherDevice\n")

    def _run(self, args):
        args = tuple(args)
        self.calls.append(args)
        if args == ("devices", "-l"):
            return self.overrides.get(args, probe.Result("ok", self.device_text, 0))
        if args == ("version",):
            return self.overrides.get(args, probe.Result("ok", "Android Debug Bridge version 1.0.41\nVersion 37.0.1-12345678\nInstalled as /Users/private-person/sdk/adb\n", 0))
        assert args[:3] == ("-s", SERIAL, "shell"), args
        command = args[3:]
        if command in self.overrides:
            return self.overrides[command]
        if command[0] == "getprop":
            values = {"ro.product.manufacturer": "Xiaomi", "ro.product.brand": "Xiaomi",
                      "ro.product.model": "Mi TV 4", "ro.build.version.release": "6.0",
                      "ro.build.version.sdk": self.sdk, "ro.product.cpu.abilist": "arm64-v8a,armeabi-v7a",
                      "ro.product.cpu.abi": "arm64-v8a", "ro.build.version.security_patch": "2017-06-01",
                      "ro.build.display.id": "TV-firmware-2026.1"}
            return probe.Result("ok", values[command[1]] + "\n", 0)
        if command == ("cat", "/proc/meminfo"):
            text = "MemTotal: 4096 kB\nMemAvailable: 1024 kB\n"
        elif command == ("df", "-k", "/data"):
            text = "Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/data 4096 1024 3072 25% /data\n"
        elif command == ("wm", "size"):
            text = "Physical size: 1920x1080\nOverride size: 1280x720\n"
        elif command in (("am", "get-current-user"), ("cmd", "activity", "get-current-user")):
            text = "10\n"
        elif command == ("dumpsys", "activity", "processes"):
            text = ("ProcessRecord{secret " + PRIVATE_PACKAGE + "}\n"
                    "UserInfo{0:Private Owner:13}\n  mUserLru: [0, 10]\n")
        elif command[:3] == ("pm", "list", "packages"):
            text = "package:android\npackage:" + PRIVATE_PACKAGE + "\n"
        elif "query-activities" in command or "resolve-activity" in command:
            text = PRIVATE_PACKAGE + "/.PrivateHome\n"
        else:
            raise AssertionError("Unexpected fake ADB command")
        return probe.Result("ok", text, 0)


def unavailable_user():
    return {("am", "get-current-user"): probe.Result("usage", "usage: am SECRET", 1),
            ("cmd", "activity", "get-current-user"): probe.Result("unsupported", "cmd: not found SECRET", 127)}


class ProbeTests(unittest.TestCase):
    def test_modern_collection_is_read_only_and_scoped_to_exact_device(self):
        adb = FakeAdb()
        report = probe.collect(adb, SERIAL)
        self.assertTrue(report["readOnlyProbe"])
        self.assertTrue(report["deviceAccessVerified"])
        self.assertTrue(report["probeCompleted"])
        self.assertFalse(report["physicalTvTested"])
        self.assertFalse(report["fullPhysicalCompatibilityVerified"])
        self.assertEqual(report["identity"]["model"], "Mi TV 4")
        self.assertEqual(report["identity"]["firmwareBuild"], "TV-firmware-2026.1")
        self.assertEqual(report["currentUser"]["id"], 10)
        self.assertEqual(report["commands"]["packages"]["summary"], {"packageCount": 2})
        self.assertEqual(report["commands"]["dataStorage.statFs"], {"status": "not_run", "reason": "df_query_succeeded"})
        self.assertFalse(any(call[3:4] == ("stat",) for call in adb.calls))
        self.assertEqual(set(report["writeOperations"].values()), {"not_verified_on_device"})
        self.assertEqual(adb.calls[0], ("devices", "-l"))
        for call in adb.calls[1:]:
            if call == ("version",):
                continue
            self.assertEqual(call[:3], ("-s", SERIAL, "shell"))
            self.assertTrue(probe.allowed_shell(call[3:]))
            self.assertFalse(set(call) & {"install", "uninstall", "disable-user", "enable", "set-home-activity", "connect", "kill-server", "content"})
            if "--user" in call:
                self.assertEqual(call[call.index("--user") + 1], "10")
        self.assertNotIn(("-s", SERIAL, "shell", "getprop"), adb.calls)

    def test_missing_unauthorized_offline_or_duplicate_target_never_runs_shell(self):
        samples = [
            "List of devices attached\nanother-device device\n",
            "List of devices attached\n" + SERIAL + " unauthorized\n",
            "List of devices attached\n" + SERIAL + " offline\n",
            "List of devices attached\n" + SERIAL + " device\n" + SERIAL + " device\n",
            SERIAL + " device\n",
        ]
        for devices in samples:
            with self.subTest(devices=devices):
                adb = FakeAdb(devices=devices)
                report = probe.collect(adb, SERIAL)
                self.assertFalse(report["deviceAccessVerified"])
                self.assertFalse(report["probeCompleted"])
                self.assertEqual(adb.calls, [("devices", "-l")])

    def test_device_listing_failure_stops_all_following_commands(self):
        for status in ("command_failed", "usage", "unsupported", "timeout", "output_limit"):
            with self.subTest(status=status):
                adb = FakeAdb(overrides={("devices", "-l"): probe.Result(status, "SECRET " + SERIAL, 1)})
                report = probe.collect(adb, SERIAL)
                self.assertFalse(report["deviceAccessVerified"])
                self.assertEqual(len(adb.calls), 1)
                self.assertNotIn("SECRET", json.dumps(report))

    def test_legacy_user_lru_is_used_only_on_verified_sdks(self):
        for sdk in ("19", "21", "22", "23"):
            with self.subTest(sdk=sdk):
                adb = FakeAdb(sdk=sdk, overrides=unavailable_user())
                report = probe.collect(adb, SERIAL)
                self.assertEqual(report["currentUser"], {"verified": True, "source": "currentUser.legacyUserLru", "id": 10})
                self.assertEqual(report["identity"]["sdk"], sdk)
                self.assertNotIn(PRIVATE_PACKAGE, json.dumps(report))
                self.assertNotIn("Private Owner", json.dumps(report))
        for sdk in ("20", "24", "33", "019", "023", "unknown", ""):
            with self.subTest(sdk=sdk):
                adb = FakeAdb(sdk=sdk, overrides=unavailable_user())
                report = probe.collect(adb, SERIAL)
                self.assertFalse(report["currentUser"]["verified"])
                self.assertFalse(any(call[3:4] == ("dumpsys",) for call in adb.calls))
                self.assertEqual(report["commands"]["packages"]["status"], "not_run")

    def test_unverified_user_keeps_global_reads_but_never_assumes_user_zero(self):
        overrides = unavailable_user()
        overrides[("dumpsys", "activity", "processes")] = probe.Result("ok", "Users: UserInfo{0:Owner:13} running", 0)
        adb = FakeAdb(sdk="23", overrides=overrides)
        report = probe.collect(adb, SERIAL)
        self.assertFalse(report["currentUser"]["verified"])
        self.assertEqual(report["commands"]["memory"]["status"], "ok")
        self.assertEqual(report["commands"]["dataStorage"]["status"], "ok")
        self.assertFalse(any("--user" in call for call in adb.calls))

    def test_user_outputs_are_strict_not_any_number_from_help_or_process_text(self):
        for text in ("", "+0", "-1", "2147483648", "0\n10", "usage: am start --user 0", "UserInfo{0:Owner:13}"):
            self.assertIsNone(probe.valid_user(text), text)
        self.assertEqual(probe.valid_user("0\n"), 0)
        for text in ("mUserLru: []", "mUserLru: [0,]", "mUserLru: [0, 0]", "mUserLru: [-1]",
                     "mUserLru: [+0]", "mUserLru: [2147483648]", "mUserLru: [0] trailing",
                     "mUserLru: [0]\nmUserLru: [10]", "mResumedActivity: record u0"):
            self.assertIsNone(probe.legacy_user(text), text)
        self.assertEqual(probe.legacy_user("mUserLru: [10, 0]"), 0)

    def test_zero_exit_status_cannot_turn_usage_failure_or_garbage_into_capability(self):
        for text, code, expected in (("usage: pm list SECRET", 0, "usage"),
                                    ("Unknown command: query-activities", 0, "unsupported"),
                                    ("Error: Unknown command: query-activities", 0, "unsupported"),
                                    ("Error: Unknown option: -k", 0, "unsupported"),
                                    ("/system/bin/sh: cmd: not found", 127, "unsupported"),
                                    ("Error: permission denied SECRET", 0, "command_failed"),
                                    ("Permission Denial: private app SECRET", 0, "command_failed"),
                                    ("java.lang.SecurityException: denied", 0, "command_failed"),
                                    ("random text", 1, "command_failed")):
            self.assertEqual(probe.classify(text, code), expected)
        overrides = {("pm", "list", "packages", "--user", "10"): probe.Result("ok", "SECRET unexpected text", 0)}
        report = probe.collect(FakeAdb(overrides=overrides), SERIAL)
        self.assertEqual(report["commands"]["packages"]["status"], "invalid_output")
        self.assertNotIn("SECRET", json.dumps(report))

    def test_kitkat_dalvik_warning_keeps_only_real_package_counts(self):
        warning = ("WARNING: linker: libdvm.so has text relocations. This is wasting memory "
                   "and is a security risk. Please fix.")
        output = f"{warning}\r\npackage:android\r\n{warning}\r\npackage:{PRIVATE_PACKAGE}\r\npackage:android\r\n"
        self.assertEqual(probe.packages_summary(output), {"packageCount": 2})
        overrides = unavailable_user()
        overrides[("pm", "list", "packages", "--user", "10")] = probe.Result("ok", output, 0)
        report = probe.collect(FakeAdb(sdk="19", overrides=overrides), SERIAL)
        self.assertEqual(report["commands"]["packages"], {
            "status": "ok", "exitCode": 0, "summary": {"packageCount": 2}})
        self.assertNotIn(PRIVATE_PACKAGE, json.dumps(report))
        self.assertNotIn(warning, json.dumps(report))

    def test_package_warning_cannot_prove_empty_catalogue_or_hide_errors(self):
        warning = ("WARNING: linker: libdvm.so has text relocations. This is wasting memory "
                   "and is a security risk. Please fix.")
        for output in ("", warning, warning + "\n" + warning):
            with self.subTest(output=output):
                self.assertIsNone(probe.packages_summary(output))
        for invalid in ("usage: pm list packages", "Error: permission denied",
                        "java.lang.SecurityException: Permission Denial",
                        "WARNING: linker: could not load library libdvm.so",
                        warning.replace("libdvm.so", "libother.so"),
                        warning + " Permission Denial", "package:com.invalid;name"):
            with self.subTest(invalid=invalid):
                self.assertIsNone(probe.packages_summary(f"{warning}\npackage:android\n{invalid}\n"))

    def test_report_redacts_addresses_and_discards_app_user_and_error_details(self):
        overrides = unavailable_user()
        overrides[("getprop", "ro.product.model")] = probe.Result("ok", "Mi TV " + SERIAL + " 10.0.0.9 2001:db8::1234 aa:bb:cc:dd:ee:ff", 0)
        overrides[("wm", "size")] = probe.Result("command_failed", "SECRET " + SERIAL + " " + PRIVATE_PACKAGE, 1)
        report = probe.collect(FakeAdb(sdk="23", overrides=overrides), SERIAL)
        encoded = json.dumps(report)
        for secret in (SERIAL, "10.0.0.9", "2001:db8::1234", "aa:bb:cc:dd:ee:ff", "another-secret-serial", "PrivateDevice", "Private Owner", PRIVATE_PACKAGE, "SECRET"):
            self.assertNotIn(secret, encoded)
        self.assertIn("[redacted]", encoded)

    def test_legacy_memory_and_storage_are_summarized_without_raw_paths(self):
        self.assertEqual(probe.memory_summary("MemTotal: 4096 kB\nMemFree: 1024 kB\nBuffers: 128 kB\nCached: 512 kB"),
                         {"totalBytes": 4194304, "availableBytes": 1703936})
        summary = probe.disk_summary("Filesystem Size Used Free Blksize\n/data 4G 1G 3G 4096\n")
        self.assertEqual(summary, {"format": "legacy-human", "totalBytes": 4294967296, "availableBytes": 3221225472})
        self.assertIsNone(probe.disk_summary("usage: df /secret/path"))
        self.assertIsNone(probe.display_summary("Physical size: 99999x1080"))

    def test_reader_rejects_every_non_allowlisted_command_before_execution(self):
        adb = FakeAdb()
        for command in (("getprop",), ("getprop", "ro.serialno"), ("am", "start", "x"),
                        ("pm", "install", "x"), ("pm", "uninstall", "x"), ("pm", "list", "packages"),
                        ("cmd", "package", "set-home-activity", "x"), ("content", "call"),
                        ("stat", "-f", "-c", "%S:%b:%a", "/cache"),
                        ("stat", "-f", "-c", "%S %b %a", "/data"),
                        ("stat", "-c", "%S:%b:%a", "/data"),
                        ("sh", "-c", "echo hello"), ("pm", "list", "packages", "--user", "-1")):
            with self.subTest(command=command), self.assertRaises(ValueError):
                adb.shell(command)
        self.assertEqual(adb.calls, [])

    def test_unsupported_or_malformed_df_k_falls_back_to_legacy_read(self):
        for first in (probe.Result("usage", "usage: df [path]", 0),
                      probe.Result("ok", "unrecognized output", 0),
                      probe.Result("command_failed", "Error: unknown option -k", 1)):
            with self.subTest(status=first.status):
                adb = FakeAdb(overrides={
                    ("df", "-k", "/data"): first,
                    ("df", "/data"): probe.Result("ok", "Filesystem Size Used Free Blksize\n/data 4G 1G 3G 4096\n", 0),
                })
                report = probe.collect(adb, SERIAL)
                self.assertEqual(report["commands"]["dataStorage.legacy"]["status"], "ok")
                self.assertIn(("-s", SERIAL, "shell", "df", "/data"), adb.calls)
                self.assertEqual(report["commands"]["dataStorage.statFs"], {"status": "not_run", "reason": "df_query_succeeded"})
                self.assertFalse(any(call[3:4] == ("stat",) for call in adb.calls))

    def test_stat_fs_parser_matches_real_api30_bytes_and_rejects_ambiguous_or_overflowing_values(self):
        # Actual API30 E3 stat output from run 42079101858, separately from df's
        # /storage/emulated/0/Android/obb alias. These are bytes, not KiB.
        self.assertEqual(probe.stat_fs_summary("4096:1523600:1443191\n"),
                         {"format": "stat-f", "totalBytes": 6240665600, "availableBytes": 5911310336})
        self.assertEqual(probe.stat_fs_summary("4096:1:0"),
                         {"format": "stat-f", "totalBytes": 4096, "availableBytes": 0})
        self.assertEqual(probe.stat_fs_summary("1:18446744073709551615:0")["totalBytes"], 2**64 - 1)
        for output in ("", "usage: stat", "stat: /data: Permission denied", "4096:1:0\n4096:1:0",
                       "4096:1:0\nError: denied", "4096: 1:0", "4096:1:", "4096:1:0:0",
                       "0:1:0", "4096:0:0", "4096:1:2", "-4096:1:0", "+4096:1:0",
                       "4096:1.0:0", "４０９６:1:0", "0x1000:1:0", "18446744073709551616:1:0",
                       "4096:18446744073709551615:0", "1:18446744073709551616:0"):
            with self.subTest(output=output):
                self.assertIsNone(probe.stat_fs_summary(output))

    def test_df_alias_stays_invalid_and_uses_only_the_exact_data_stat_fallback(self):
        for mount in ("/storage/emulated/0/Android/obb", "/cache"):
            with self.subTest(mount=mount):
                output = ("Filesystem     1K-blocks   Used Available Use% Mounted on\n"
                          "/dev/block/vdc   6094400 179800   5772388   4% " + mount + "\n")
                self.assertIsNone(probe.disk_summary(output))
                adb = FakeAdb(sdk="30", overrides={
                    ("df", "-k", "/data"): probe.Result("ok", output, 0),
                    ("df", "/data"): probe.Result("ok", output, 0),
                    ("stat", "-f", "-c", "%S:%b:%a", "/data"): probe.Result("ok", "4096:1523600:1443191\n", 0),
                })
                report = probe.collect(adb, SERIAL)
                for label in ("dataStorage", "dataStorage.legacy"):
                    self.assertEqual(report["commands"][label]["status"], "invalid_output")
                self.assertEqual(report["commands"]["dataStorage.statFs"], {
                    "status": "ok", "exitCode": 0,
                    "summary": {"format": "stat-f", "totalBytes": 6240665600, "availableBytes": 5911310336},
                })
                self.assertEqual([call for call in adb.calls if call[3:4] == ("stat",)],
                                 [("-s", SERIAL, "shell", "stat", "-f", "-c", "%S:%b:%a", "/data")])
                self.assertNotIn(mount, json.dumps(report))
                self.assertTrue(report["probeCompleted"])

    def test_failed_stat_fallback_never_invents_capacity_or_persists_raw_errors(self):
        for result, expected in ((probe.Result("unsupported", "stat: not found SECRET", 127), "unsupported"),
                                 (probe.Result("command_failed", "Permission denied SECRET", 1), "command_failed"),
                                 (probe.Result("timeout"), "timeout"),
                                 (probe.Result("ok", "4096:1:2 SECRET", 0), "invalid_output")):
            with self.subTest(status=result.status):
                adb = FakeAdb(overrides={
                    ("df", "-k", "/data"): probe.Result("unsupported", "df unavailable", 1),
                    ("df", "/data"): probe.Result("ok", "unrecognized df output", 0),
                    ("stat", "-f", "-c", "%S:%b:%a", "/data"): result,
                })
                report = probe.collect(adb, SERIAL)
                entry = report["commands"]["dataStorage.statFs"]
                self.assertEqual(entry["status"], expected)
                self.assertNotIn("summary", entry)
                self.assertNotIn("SECRET", json.dumps(report))
                if expected == "timeout":
                    self.assertFalse(report["probeCompleted"])

    def test_home_candidates_are_not_default_home_and_resolver_is_not_resolved(self):
        component = "com.vendor.home/.Home"
        self.assertEqual(probe.homes_summary(component), {"componentCount": 1})
        self.assertEqual(probe.homes_summary(component + "\ncom.vendor.home/com.vendor.home.Home", True),
                         {"componentCount": 1, "resolved": True})
        for output in ("android/com.android.internal.app.ResolverActivity",
                       "android/com.android.internal.app.ChooserActivity",
                       component + "\ncom.other.home/.Home",
                       component + "\nandroid/com.android.internal.app.ResolverActivity",
                       component + "\nandroid/com.android.internal.app.ChooserActivity"):
            with self.subTest(output=output):
                self.assertFalse(probe.homes_summary(output, True)["resolved"])
        report = probe.collect(FakeAdb(), SERIAL)
        self.assertNotIn("resolved", report["commands"]["home.cmd.query-activities"]["summary"])
        self.assertTrue(report["commands"]["home.cmd.resolve-activity"]["summary"]["resolved"])

    def test_resolve_brief_accepts_only_known_metadata_before_a_component(self):
        metadata = "priority=0 preferredOrder=0 match=0x108000 specificIndex=-1 isDefault=true"
        component = "com.vendor.home/.Home"
        self.assertEqual(probe.homes_summary(metadata + "\n" + component, True),
                         {"componentCount": 1, "resolved": True})
        self.assertEqual(probe.homes_summary(metadata + "\nandroid/com.android.internal.app.ResolverActivity", True),
                         {"componentCount": 1, "resolved": False})
        self.assertIsNone(probe.homes_summary(metadata + "\n" + component))
        for prefix in (metadata + " unexpected=1", metadata.replace("isDefault=true", "isDefault=unknown"),
                       metadata.replace("match=0x108000", "match=garbage"), "unexpected command output", metadata):
            with self.subTest(prefix=prefix):
                text = prefix if prefix == metadata else prefix + "\n" + component
                self.assertIsNone(probe.homes_summary(text, True))
        adb = FakeAdb(overrides={
            ("cmd", "package", "resolve-activity", "--brief", "--user", "10", *probe.INTENT):
                probe.Result("ok", metadata + "\n" + component, 0),
        })
        self.assertTrue(probe.collect(adb, SERIAL)["commands"]["home.cmd.resolve-activity"]["summary"]["resolved"])

    def test_bounded_runner_combines_and_limits_stdout_and_stderr(self):
        result = probe.run_bounded((sys.executable, "-c", "import os;os.write(1,b'x'*96);os.write(2,b'y'*96)"),
                                   3, 128, time.monotonic() + 5)
        self.assertEqual(result.status, "output_limit")
        self.assertEqual(result.text, "")

    def test_bounded_runner_returns_failure_without_echoing_it_into_report(self):
        result = probe.run_bounded((sys.executable, "-c", "import sys;print('Error: SECRET');sys.exit(3)"),
                                   3, 256, time.monotonic() + 5)
        self.assertEqual(result.status, "command_failed")
        self.assertEqual(result.exit_code, 3)

    def test_per_command_timeout_is_bounded(self):
        started = time.monotonic()
        result = probe.run_bounded((sys.executable, "-c", "import time;time.sleep(3)"),
                                   0.08, 128, started + 5)
        self.assertEqual(result.status, "timeout")
        self.assertEqual(result.text, "")
        self.assertLess(time.monotonic() - started, 2)

    def test_total_budget_stops_a_command_and_never_starts_the_next(self):
        deadline = time.monotonic() + 0.08
        result = probe.run_bounded((sys.executable, "-c", "import time;time.sleep(3)"), 3, 128, deadline)
        self.assertEqual(result.status, "budget_exhausted")
        with patch.object(probe.subprocess, "Popen", side_effect=AssertionError("must not spawn")):
            self.assertEqual(probe.run_bounded(("anything",), 3, 128, deadline).status, "budget_exhausted")

    def test_read_failure_discards_partial_data_and_reader_owns_stream_close(self):
        closed_by = []
        original_read = probe.os.read
        remaining = [b"10\n"]

        class Stream:
            def fileno(self):
                return 123456789

            def close(self):
                closed_by.append(threading.get_ident())

        class Process:
            stdout = Stream()

            def poll(self):
                return 0

            def wait(self, timeout):
                return 0

            def kill(self):
                pass

        def broken_read(fd, size):
            if fd != 123456789:
                return original_read(fd, size)
            if remaining:
                return remaining.pop()
            raise OSError("read failed after partial data")

        with patch.object(probe.subprocess, "Popen", return_value=Process()), patch.object(probe.os, "read", broken_read):
            result = probe.run_bounded(("fake-adb",), 1, 128, time.monotonic() + 2)
        self.assertEqual(result.status, "read_error")
        self.assertEqual(result.text, "")
        self.assertEqual(len(closed_by), 1)
        self.assertNotEqual(closed_by[0], threading.get_ident())

    def test_inherited_stdout_pipe_cannot_extend_total_budget(self):
        with tempfile.TemporaryDirectory() as temp:
            marker = Path(temp) / "child-started"
            # The parent exits normally while a child retains its stdout pipe.
            # A blocking communicate()/read() would wait for the child's sleep.
            child = "import time;time.sleep(3)"
            parent = ("import subprocess,sys;from pathlib import Path;"
                      "subprocess.Popen([sys.executable,'-c'," + repr(child) + "],stdout=sys.stdout,stderr=sys.stderr);"
                      "Path(" + repr(str(marker)) + ").write_text('started')")
            started = time.monotonic()
            result = probe.run_bounded((sys.executable, "-c", parent), 5, 128, started + 1)
            self.assertEqual(result.status, "budget_exhausted")
            self.assertTrue(marker.exists(), "The pipe-inheriting child was actually started")
            self.assertLess(time.monotonic() - started, 2)

    def test_cli_requires_explicit_arguments_and_does_not_replace_old_report(self):
        with redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            probe.main([])
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp)
            destination = output / probe.REPORT_NAME
            destination.write_text("old report", encoding="utf-8")
            with patch.object(probe, "AdbReader", side_effect=AssertionError("must not access ADB")), redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
                probe.main(["--adb", sys.executable, "--serial", SERIAL, "--output", str(output)])
            self.assertEqual(destination.read_text(), "old report")

    def test_cli_persists_only_redacted_summary_and_marks_writes_unverified(self):
        with tempfile.TemporaryDirectory() as temp:
            with patch.object(probe, "AdbReader", return_value=FakeAdb()), redirect_stdout(io.StringIO()) as output:
                code = probe.main(["--adb", sys.executable, "--serial", SERIAL, "--output", temp])
            self.assertEqual(code, 0)
            report = json.loads((Path(temp) / probe.REPORT_NAME).read_text(encoding="utf-8"))
            self.assertNotIn(SERIAL, json.dumps(report))
            self.assertNotIn(PRIVATE_PACKAGE, json.dumps(report))
            self.assertNotIn(SERIAL, output.getvalue())
            self.assertFalse(report["physicalTvTested"])
            self.assertEqual(set(report["writeOperations"].values()), {"not_verified_on_device"})

    def test_host_and_adb_version_summary_never_collect_hostname_or_binary_path(self):
        with patch.object(probe.platform, "node", side_effect=AssertionError("No hostname collection")):
            report = probe.collect(FakeAdb(), SERIAL)
        self.assertEqual(set(report["host"]), {"os", "release", "architecture"})
        self.assertEqual(report["adbVersion"], {"bridgeVersion": "1.0.41", "platformToolsVersion": "37.0.1-12345678"})
        self.assertNotIn("Installed as", json.dumps(report))
        self.assertNotIn("private-person", json.dumps(report))
        self.assertNotIn("/Users/", json.dumps(report))

    def test_adb_version_requires_one_recognizable_version_line(self):
        self.assertIsNone(probe.adb_version_summary("Installed as /private/user/adb\nVersion not-real"))
        self.assertIsNone(probe.adb_version_summary("Android Debug Bridge version 1.0.41\nAndroid Debug Bridge version 1.0.32"))
        self.assertEqual(probe.adb_version_summary("Android Debug Bridge version 1.0.32"),
                         {"bridgeVersion": "1.0.32", "platformToolsVersion": None})


if __name__ == "__main__":
    unittest.main()
