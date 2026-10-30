#!/usr/bin/env python3
"""Exercise the native updater with shipped packages in an isolated CI installation.

Windows and macOS upgrade a SHA256-pinned 0.4.10 installation using the current
build's real helper, then query the relaunched Manager over its local MCP socket.
Linux validates the real DEB and preparation plan without installing a system
package. This script never changes HOME, APPDATA or the release signing setup.
"""

import argparse
import hashlib
import http.client
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request


BASELINE_VERSION = "0.4.10"
BASELINES = {
    "aarch64-apple-darwin": ("macos-arm64.dmg", "b9ef93e27c896ea5caed1f3e3afea7ea3e5bab960a697fea338a60aa05af8442"),
    "x86_64-apple-darwin": ("macos-x64.dmg", "d4623c0b63e0bea70c5abf178718563a241ae2ff5867738e2ef364bee0744bd2"),
    "x86_64-pc-windows-msvc": ("windows-x64-setup.exe", "253c34e9c96ff513e898a37f2934b454899764c43c3e18f2a5fc5122a366eb0f"),
}
PLATFORMS = {
    "aarch64-apple-darwin": ("darwin", "dmg", "*.dmg"),
    "x86_64-apple-darwin": ("darwin", "dmg", "*.dmg"),
    "x86_64-pc-windows-msvc": ("win32", "nsis", "*.exe"),
    "x86_64-unknown-linux-gnu": ("linux", "deb", "*.deb"),
}
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\pureTV Manager"
TEST_NAME = "client_install::tests::native_update_package_preparation"


def run(arguments, *, timeout=90, env=None):
    result = subprocess.run(list(map(str, arguments)), capture_output=True, text=True,
                            errors="replace", timeout=timeout, env=env)
    if result.returncode:
        raise RuntimeError(f"{Path(str(arguments[0])).name} exited {result.returncode}:\n"
                           f"{result.stdout[-6000:]}{result.stderr[-6000:]}")
    return result.stdout + result.stderr


def wait_until(check, description, *, timeout=60):
    deadline = time.monotonic() + timeout
    while True:
        result = check()
        if result:
            return result
        if time.monotonic() >= deadline:
            raise RuntimeError(f"Timed out waiting for {description}")
        time.sleep(0.2)


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def download_baseline(target, directory):
    suffix, expected = BASELINES[target]
    name = f"pureTV-Manager-{BASELINE_VERSION}-{suffix}"
    path = directory / name
    url = f"https://github.com/ecojust/pureTV/releases/download/desktop-v{BASELINE_VERSION}/{name}"
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "pureTV-updater-CI"})
            with urllib.request.urlopen(request, timeout=45) as response, path.open("wb") as output:
                size = 0
                while chunk := response.read(65536):
                    size += len(chunk)
                    assert size <= 32 * 1024 * 1024, "Unexpected baseline package size"
                    output.write(chunk)
            assert digest(path) == expected, "Baseline SHA256 does not match the pinned release"
            print(f"Verified baseline {name}: {path.stat().st_size} bytes", flush=True)
            return path
        except (urllib.error.URLError, TimeoutError):
            path.unlink(missing_ok=True)
            if attempt == 2:
                raise
            time.sleep(2)


def standard_data_dir(identifier):
    if sys.platform == "darwin":
        return Path.home() / "Library/Application Support" / identifier
    if sys.platform == "win32":
        return Path(os.environ["APPDATA"]) / identifier
    raise RuntimeError("A GUI profile is not required for the Linux metadata check")


def windows_registration():
    import winreg
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY) as key:
            return {name: winreg.QueryValueEx(key, name)[0]
                    for name in ("DisplayName", "DisplayVersion", "InstallLocation", "UninstallString")}
    except FileNotFoundError:
        return None


def reject_existing_windows_install():
    import winreg
    for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
        for view in (winreg.KEY_WOW64_64KEY, winreg.KEY_WOW64_32KEY):
            for path in (UNINSTALL_KEY, r"Software\pureTV Manager", r"Software\com.ecojust.puretv.manager"):
                try:
                    with winreg.OpenKey(hive, path, 0, winreg.KEY_READ | view):
                        raise RuntimeError("Refusing an existing Manager registry entry")
                except FileNotFoundError:
                    pass


def install_baseline(package, directory, config):
    installed = directory / "installed"
    installed.mkdir()
    if sys.platform == "win32":
        reject_existing_windows_install()
        run([package, "/S", f"/D={installed}"], timeout=240)
        registration = windows_registration()
        assert registration and registration["DisplayVersion"] == BASELINE_VERSION
        assert Path(registration["InstallLocation"]).resolve() == installed.resolve(), "Baseline escaped the temporary installation"
        executable = installed / "puretv-desktop.exe"
    else:
        mount = directory / "baseline-mount"
        mount.mkdir()
        run(["/usr/bin/hdiutil", "verify", package])
        mounted = False
        try:
            run(["/usr/bin/hdiutil", "attach", "-readonly", "-nobrowse", "-noautoopen",
                 "-mountpoint", mount, package])
            mounted = True
            bundles = list(mount.glob("*.app"))
            assert len(bundles) == 1 and bundles[0].name == config["productName"] + ".app"
            target = installed / bundles[0].name
            run(["/usr/bin/ditto", bundles[0], target])
            with (target / "Contents/Info.plist").open("rb") as stream:
                info = plistlib.load(stream)
            assert info["CFBundleIdentifier"] == config["identifier"]
            assert info["CFBundleShortVersionString"] == BASELINE_VERSION
            run(["/usr/bin/codesign", "--verify", "--deep", "--strict", target])
            executable = target / "Contents/MacOS" / info["CFBundleExecutable"]
        finally:
            if mounted:
                run(["/usr/bin/hdiutil", "detach", mount])
    assert executable.is_file(), "Baseline executable is missing"
    return executable


def read_session(path):
    try:
        value = json.loads(path.read_text())
        url = urllib.parse.urlparse(value["url"])
        assert url.scheme == "http" and url.hostname == "127.0.0.1" and url.path == "/mcp"
        assert url.port and re.fullmatch(r"[0-9a-f]{64}", value["token"])
        return value
    except (OSError, ValueError, KeyError):
        return None


def rpc(session, method, params):
    request = urllib.request.Request(session["url"], data=json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": method, "params": params,
    }).encode(), headers={"Authorization": "Bearer " + session["token"], "Content-Type": "application/json"}, method="POST")
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(request, timeout=5) as response:
        result = json.load(response)
    assert "error" not in result, "The installed Manager rejected its local MCP request"
    return result["result"]


def manager_version(session):
    try:
        return rpc(session, "initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                   "clientInfo": {"name": "pureTV updater CI", "version": "1"}})["serverInfo"]["version"]
    except (urllib.error.URLError, http.client.RemoteDisconnected, ConnectionResetError):
        return None


def close_manager(session):
    if not session:
        return
    try:
        result = rpc(session, "tools/call", {"name": "close_manager", "arguments": {"confirmShutdown": True}})
        assert result.get("isError") is False, "Installed Manager refused normal shutdown"
    except (urllib.error.URLError, http.client.RemoteDisconnected, ConnectionResetError):
        pass  # The successful exit can close the socket before the reply is sent.
    wait_until(lambda: manager_version(session) is None, "Manager normal exit", timeout=30)


def native_prepare(desktop, package, old_executable, helper_executable, data_dir, directory):
    output = directory / "prepared-update.json"
    environment = {**os.environ, "PURETV_TEST_UPDATE_PACKAGE": str(package),
                   "PURETV_TEST_UPDATE_EXECUTABLE": str(old_executable),
                   "PURETV_TEST_UPDATE_HELPER": str(helper_executable),
                   "PURETV_TEST_UPDATE_DATA_DIR": str(data_dir),
                   "PURETV_TEST_UPDATE_PLAN_OUTPUT": str(output)}
    log = run(["cargo", "test", "--locked", "--manifest-path", desktop / "src-tauri/Cargo.toml",
               TEST_NAME, "--", "--exact", "--ignored", "--nocapture"], timeout=600, env=environment)
    assert re.search(r"test result: ok\. 1 passed; 0 failed", log), "Native updater test did not execute"
    print(log, end="", flush=True)
    assert output.is_file(), "Native preparation test did not export its result"
    return json.loads(output.read_text())


def verify_deb(package, version):
    fields = {name: run(["/usr/bin/dpkg-deb", "--field", package, name]).strip()
              for name in ("Package", "Version", "Architecture")}
    assert fields == {"Package": "pure-tv-manager", "Version": version, "Architecture": "amd64"}, fields


def linux_check(desktop, package, executable, directory, config):
    before = subprocess.run(["/usr/bin/dpkg-query", "--show", "--showformat=${Version} ${Status}",
                             "pure-tv-manager"], capture_output=True)
    verify_deb(package, config["version"])
    data_dir = directory / "metadata-profile"
    data_dir.mkdir()
    result = native_prepare(desktop, package, executable, executable, data_dir, directory)
    assert result.get("metadataOnly") is True, "Linux check must not execute the package installer"
    after = subprocess.run(["/usr/bin/dpkg-query", "--show", "--showformat=${Version} ${Status}",
                            "pure-tv-manager"], capture_output=True)
    assert (before.returncode, before.stdout) == (after.returncode, after.stdout), "System package state changed"
    print("Verified actual DEB identity and native metadata preparation; no system installation performed", flush=True)


def gui_upgrade(desktop, package, helper_executable, target, directory, config):
    data_dir = standard_data_dir(config["identifier"])
    assert not data_dir.exists() and not data_dir.is_symlink(), "Refusing existing Manager app data"
    baseline = download_baseline(target, directory)
    old_executable = directory / "installed/puretv-desktop.exe"
    data_created = False
    log_path = directory / "manager.log"
    old_process = helper = None
    try:
        old_executable = install_baseline(baseline, directory, config)
        data_dir.mkdir(parents=True)
        data_created = True
        sentinel = data_dir / "updater-ci-preserve.txt"
        sentinel.write_text("existing Manager data must survive the update\n")
        # A saved but missing ADB path stops automatic discovery, including on relaunch.
        (data_dir / "state.json").write_text(json.dumps({"adb_path": str(directory / "no-adb-for-update-test")}))
        # Exercise replacement of a previous update result, including on Windows.
        (data_dir / "client-update-result.json").write_text(json.dumps({
            "version": "0.4.9", "success": True, "message": "Previous update fixture",
        }))
        with log_path.open("wb") as log:
            old_process = subprocess.Popen([str(old_executable)], stdout=log, stderr=subprocess.STDOUT)
            session_file = data_dir / "mcp-session.json"
            old_session = wait_until(lambda: read_session(session_file), "baseline MCP session")
            assert manager_version(old_session) == BASELINE_VERSION, "The baseline Manager did not start"
            old_digest = digest(old_executable)
            prepared = native_prepare(desktop, package, old_executable, helper_executable, data_dir, directory)
            assert prepared.get("metadataOnly") is not True
            assert Path(prepared["dataDir"]).resolve() == data_dir.resolve()
            plan, helper_path = Path(prepared["planPath"]), Path(prepared["helperPath"])
            assert plan.resolve().is_relative_to(data_dir.resolve()) and helper_path.parent == plan.parent
            helper = subprocess.Popen([str(helper_path), "--apply-client-update", str(plan)], stdout=log, stderr=subprocess.STDOUT)
            wait_until(lambda: Path(prepared["readyPath"]).is_file(), "updater helper readiness", timeout=15)
            time.sleep(0.4)
            assert old_process.poll() is None and helper.poll() is None
            assert digest(old_executable) == old_digest, "Helper replaced a still-running Manager"
            close_manager(old_session)
            old_process.wait(timeout=30)
            assert old_process.returncode == 0
            helper.wait(timeout=240)
            assert helper.returncode == 0, "Real updater helper failed"
            result = json.loads(Path(prepared["resultPath"]).read_text())
            assert result["success"] is True and result["version"] == config["version"], result

            def restarted():
                session = read_session(session_file)
                return session if session and session != old_session and manager_version(session) == config["version"] else None

            new_session = wait_until(restarted, "updated Manager relaunch and version confirmation", timeout=90)
            assert sentinel.read_text() == "existing Manager data must survive the update\n"
            if sys.platform == "win32":
                registration = windows_registration()
                assert registration and registration["DisplayVersion"] == config["version"]
                assert Path(registration["InstallLocation"]).resolve() == old_executable.parent.resolve(), "Update escaped the temporary installation"
            else:
                bundle = old_executable.parents[2]
                with (bundle / "Contents/Info.plist").open("rb") as stream:
                    info = plistlib.load(stream)
                assert info["CFBundleIdentifier"] == config["identifier"] and info["CFBundleShortVersionString"] == config["version"]
                run(["/usr/bin/codesign", "--verify", "--deep", "--strict", bundle])
            assert digest(old_executable) == digest(helper_executable), "Installed executable differs from the current build"
            close_manager(new_session)
            print(f"Verified actual {BASELINE_VERSION} -> {config['version']} helper upgrade, normal shutdown, relaunch and retained data", flush=True)
    finally:
        primary_failure = sys.exc_info()[0] is not None
        cleanup_errors = []
        session = read_session(data_dir / "mcp-session.json") if data_created else None
        try:
            close_manager(session)
        except Exception as error:
            cleanup_errors.append(str(error))
        for process in (helper, old_process):
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill(); process.wait(timeout=5)
        if log_path.exists():
            print(log_path.read_text(errors="replace")[-6000:], end="", flush=True)
        try:
            if sys.platform == "win32":
                uninstaller = old_executable.parent / "uninstall.exe"
                registration = windows_registration()
                if registration:
                    assert Path(registration["InstallLocation"]).resolve() == old_executable.parent.resolve(), "Refusing cleanup outside the test installation"
                    assert uninstaller.is_file(), "Test installation is missing its uninstaller"
                    run([uninstaller, "/S"], timeout=120)
                    wait_until(lambda: windows_registration() is None, "temporary NSIS installation cleanup", timeout=30)
        except Exception as error:
            cleanup_errors.append(str(error))
        if data_created:
            try:
                shutil.rmtree(data_dir)
            except OSError as error:
                cleanup_errors.append(str(error))
        if cleanup_errors:
            detail = "Temporary updater installation cleanup: " + "; ".join(cleanup_errors)
            if primary_failure:
                print(detail, file=sys.stderr, flush=True)
            else:
                raise RuntimeError(detail)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", choices=PLATFORMS, required=True)
    args = parser.parse_args()
    host, bundle, pattern = PLATFORMS[args.target]
    assert sys.platform == host, "Use the native runner for this target"
    assert os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("RUNNER_TEMP"), "Real installer tests require an isolated GitHub Actions runner"
    desktop = Path(__file__).resolve().parent.parent
    config = json.loads((desktop / "src-tauri/tauri.conf.json").read_text())
    assert re.fullmatch(r"\d+\.\d+\.\d+", config["version"])
    assert tuple(map(int, config["version"].split("."))) > tuple(map(int, BASELINE_VERSION.split(".")))
    release = desktop / "src-tauri/target" / args.target / "release"
    packages = list((release / "bundle" / bundle).glob(pattern))
    assert len(packages) == 1 and packages[0].is_file(), "Expected exactly one native update package"
    # Use the actual signed bundle executable on macOS: bundle signing may
    # change its bytes after the unbundled cargo binary was built.
    executable = (release / "bundle/macos" / (config["productName"] + ".app") / "Contents/MacOS/puretv-desktop"
                  if host == "darwin" else release / ("puretv-desktop.exe" if host == "win32" else "puretv-desktop"))
    assert executable.is_file()
    with tempfile.TemporaryDirectory(prefix="puretv-update-ci-", dir=os.environ["RUNNER_TEMP"]) as temporary:
        directory = Path(temporary).resolve()
        if host == "linux":
            linux_check(desktop, packages[0].resolve(), executable.resolve(), directory, config)
        else:
            gui_upgrade(desktop, packages[0].resolve(), executable.resolve(), args.target, directory, config)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        if os.environ.get("GITHUB_ACTIONS"):
            detail = traceback.format_exc()[-3500:]
            print("::error title=Client update integration::" + detail.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A"), flush=True)
        raise
