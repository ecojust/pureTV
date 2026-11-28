"""Drive an installed Manager with AT-SPI. ADB observes and boots the real Android TV."""
import errno
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import subprocess
import sys
import time

import pyatspi as at
from gi.repository import GLib


out, manager_pid, metadata = sys.argv[1:]
out = Path(out)
game = json.loads(Path(metadata).read_text())
title, package = game["name"], game["packageName"]
endpoint = "127.0.0.1:15555"
install_message = "游戏已安装。可前往启动器，将游戏添加到电视主屏幕。"
report = {"game": title}


def record(key, value):
    report[key] = value
    (out / "native.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(key, flush=True)


def command(*args, timeout=25):
    return subprocess.check_output(args, stderr=subprocess.DEVNULL, text=True, timeout=timeout).strip()


def adb(serial, *args, timeout=30):
    return command("adb", "-s", serial, *args, timeout=timeout)


def wait(label, check, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        result = check()
        if result:
            return result
        time.sleep(0.25)
    raise RuntimeError("Timed out waiting for " + label)


def entries():
    # Accessible text on WebKit is often exposed by a text interface with an empty name.
    pending = [at.Registry.getDesktop(0)]
    while pending:
        node = pending.pop()
        try:
            role = node.getRoleName()
            name = node.name or ""
            value = ""
            if role in ("paragraph", "heading", "label", "static", "text", "status bar"):
                try:
                    value = node.queryText().getText(0, -1)
                except (NotImplementedError, GLib.Error):
                    pass
            yield role, name, value, node
            pending.extend(reversed([child for child in node if child is not None]))
        except (RuntimeError, LookupError, ValueError, GLib.Error):
            continue


def button(label, timeout=25):
    def find():
        return next((n for role, name, _, n in entries()
                     if role in ("push button", "toggle button", "button") and name == label), None)
    return wait("button " + label, find, timeout)


def click(node):
    component = node.queryComponent()
    box = component.getExtents(at.DESKTOP_COORDS)
    x, y = box.x + box.width // 2, box.y + box.height // 2
    if box.width > 0 and box.height > 0 and 0 <= x < 1500 and 0 <= y < 980:
        command("xdotool", "mousemove", str(x), str(y), "click", "1")
    else:
        component.grabFocus()
        key("space")


def has_text(needle):
    return any(needle in name or needle in value for _, name, value, _ in entries())


def see(needle, timeout=25):
    return wait(needle, lambda: has_text(needle), timeout)


def key(*names):
    command("xdotool", "key", "--clearmodifiers", *names)


def enter(label, value):
    field = wait(label, lambda: next((n for r, name, _, n in entries()
                                     if r in ("entry", "text", "spin button") and name == label), None), 20)
    field.queryComponent().grabFocus()
    key("ctrl+a")
    command("xdotool", "type", "--clearmodifiers", value)


def photo(filename):
    command("import", "-window", "root", str(out / (filename + ".png")))


def host_isolation():
    names = [name for _, name in socket.if_nameindex()]
    assert names == ["lo"], names
    with socket.socket() as probe:
        probe.settimeout(2)
        error = probe.connect_ex(("1.1.1.1", 443))
    assert error == errno.ENETUNREACH, error
    assert not command("ip", "route", "show", "default")
    assert not command("ip", "-6", "route", "show", "default")
    assert os.readlink("/proc/self/ns/net") == os.readlink("/proc/" + manager_pid + "/ns/net")
    return {"interfaces": names, "publicTcp": "ENETUNREACH", "managerInSameNamespace": True}


def disconnected_and_play():
    nav = wait("Manager sidebar", lambda: next((n for r, name, _, n in entries()
               if r in ("button", "push button") and name in ("Games", "游戏")), None), 65)
    if nav.name == "Games":
        language = next(n for r, name, _, n in entries() if r == "combo box" and name == "Interface language")
        language.queryComponent().grabFocus()
        key("Home", "Return")
    click(button("游戏"))
    assert command("adb", "devices").splitlines() == ["List of devices attached"]
    click(button(title + " · 部署到电视"))
    message = "请先连接电视并完成 ADB 授权，再部署游戏。"
    see(message)
    assert not has_text(install_message) and not has_text("前往启动器")
    photo("no-device")
    record("noDevice", {"adbDevices": [], "guidance": message, "installSuccessVisible": False})
    click(button("关闭"))
    click(button(title))
    start = button("开始竞速 · ENTER", 80)
    assert start.getState().contains(at.STATE_ENABLED), "Renderer does not support this race"
    click(start)
    # Pausing via the running game's own control exposes a distinct resume action.
    pause = wait("game pause action", lambda: next((n for r, name, _, n in entries()
                 if r in ("button", "push button") and name.startswith("暂停")), None), 35)
    click(pause)
    button("继续比赛 · P")
    photo("local-race-paused")
    record("offlineDesktop", {"game": title, "input": "Start race, then pause", "observed": "继续比赛 · P"})
    back = wait("player toolbar", lambda: next((n for r, name, _, n in entries()
                if r in ("button", "push button") and "返回游戏列表" in name), None), 15)
    click(back)
    click(button(title + " · 部署到电视"))
    click(button("前往设备连接"))


def boot_tv():
    scratch = Path(os.environ["XDG_RUNTIME_DIR"])
    emulator = subprocess.Popen(["emulator", "-avd", "offlineTV", "-port", "5554", "-no-window",
                                 "-gpu", "lavapipe", "-memory", "2048", "-cores", "2", "-noaudio",
                                 "-no-boot-anim", "-no-snapshot"], stdout=(scratch / "emulator.log").open("w"),
                                stderr=subprocess.STDOUT)
    def booted():
        if emulator.poll() is not None:
            raise RuntimeError("Android TV emulator exited during boot")
        try:
            return adb("emulator-5554", "shell", "getprop", "sys.boot_completed", timeout=5) == "1"
        except (subprocess.SubprocessError, OSError):
            return False
    wait("Android TV boot", booted, 420)
    assert os.readlink("/proc/self/ns/net") == os.readlink(f"/proc/{emulator.pid}/ns/net")
    assert "android.software.leanback" in adb("emulator-5554", "shell", "pm", "list", "features")
    # A QEMU port redirection survives Manager restarting the host ADB daemon during connection.
    # Expose real guest adbd over guest Ethernet as on a network-enabled television.
    adb("emulator-5554", "emu", "redir", "add", "tcp:15555:5555")
    adb("emulator-5554", "tcpip", "5555")

    def ready():
        try:
            command("adb", "connect", endpoint, timeout=8)
            return adb(endpoint, "get-state", timeout=5) == "device"
        except subprocess.SubprocessError:
            return False
    wait("real Android network ADB", ready, 50)
    assert package not in adb(endpoint, "shell", "pm", "list", "packages", package)
    # Shell ping is secondary evidence. QEMU has no egress route even if guest DNS is cached.
    probe = subprocess.run(["adb", "-s", endpoint, "shell", "ping", "-c", "1", "-W", "2", "1.1.1.1"],
                           capture_output=True, text=True, timeout=10)
    assert probe.returncode and ("100% packet loss" in probe.stdout or
           "unreachable" in (probe.stdout + probe.stderr).lower() or "Network is down" in probe.stderr), probe.stdout
    record("androidTV", {"android": adb(endpoint, "shell", "getprop", "ro.build.version.release"),
                         "hasLeanback": True, "qemuInSameNamespace": True, "guestPublicPing": "unreachable",
                         "authorizedEndpoint": endpoint, "gameInstalledBeforeDeploy": False})
    return emulator


def deploy():
    enter("电视 IP", "127.0.0.1")
    enter("端口", "15555")
    click(button("连接电视"))
    def connect_outcome():
        for r, name, _, n in entries():
            if r in ("button", "push button") and name in ("继续连接", "确定"):
                return name, n
    name, node = wait("connection confirmation or result", connect_outcome, 150)
    if name == "继续连接":
        click(node)
        node = button("确定", 150)
    see("操作成功")
    click(node)
    button("断开")
    click(button("游戏"))
    click(button(title + " · 部署到电视"))
    see(install_message, 150)
    see("操作成功")
    button("前往启动器")
    photo("deployed")
    path = adb(endpoint, "shell", "pm", "path", "--user", "0", package)
    assert re.fullmatch(r"package:/data/app/[^\n]+/base\.apk", path), path
    installed = subprocess.check_output(["adb", "-s", endpoint, "exec-out", "cat", path[8:]], timeout=45)
    digest = hashlib.sha256(installed).hexdigest()
    assert digest == game["sha256"] and len(installed) == game["apkBytes"]
    component = adb(endpoint, "shell", "cmd", "package", "resolve-activity", "--brief", "-a",
                    "android.intent.action.MAIN", "-c", "android.intent.category.LEANBACK_LAUNCHER", package).splitlines()[-1]
    assert component.startswith(package + "/"), component
    launch = adb(endpoint, "shell", "am", "start", "-W", "-n", component)
    assert "Status: ok" in launch, launch
    def foreground():
        return any(package + "/" in line and re.search(r"(?:topResumedActivity|mResumedActivity|ResumedActivity)", line)
                   for line in adb(endpoint, "shell", "dumpsys", "activity", "activities").splitlines())
    wait("game resumed on the TV", foreground, 20)
    time.sleep(5)
    assert foreground(), "Game left foreground after launch"
    click(button("前往启动器"))
    see("电视启动器")
    record("installed", {"package": package, "user": 0, "size": len(installed), "sha256": digest,
                         "matchesPublishedApk": True, "launcherGuidance": install_message,
                         "launcherPageOpened": True, "leanbackComponent": component, "foregroundAfter5s": True})


if __name__ == "__main__":
    record("offlineHost", host_isolation())
    disconnected_and_play()
    tv = boot_tv()
    try:
        deploy()
        record("status", "passed")
    finally:
        tv.terminate()
