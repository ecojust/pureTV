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
from PIL import Image, ImageChops


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
                                     if r in ("entry", "text", "spin button") and
                                     (name == label or name.startswith(label + " "))), None), 20)
    field.queryComponent().grabFocus()
    key("ctrl+a")
    command("xdotool", "type", "--clearmodifiers", value)


def photo(filename):
    command("import", "-window", "root", str(out / (filename + ".png")))


def deployment_photo():
    # Capture real X11 pixels after the success dialog has been painted. In addition
    # to AT-SPI semantics, OCR verifies its contents in the actual submitted frame.
    target = out / "deployed.png"
    heading = wait("success heading", lambda: next((node for role, name, _, node in entries()
                   if role == "heading" and name.strip() == "操作成功"), None), 10)
    action = button("前往启动器")
    xid = command("xdotool", "getactivewindow")
    command("xdotool", "windowactivate", "--sync", xid)
    print("Active window class", command("xprop", "-id", xid, "WM_CLASS", "_NET_WM_PID"), flush=True)
    windows = command("xdotool", "search", "--onlyvisible", "--pid", manager_pid).splitlines()
    print("Manager window count", len(windows), "active belongs to Manager", xid in windows, flush=True)
    if xid not in windows and windows:
        xid = windows[-1]
        command("xdotool", "windowactivate", "--sync", xid)
    words = []
    for attempt in range(4):
        if attempt == 1:
            command("xdotool", "windowsize", "--sync", xid, "1380", "910")
        if attempt == 2:
            action.queryComponent().grabFocus()
            subprocess.run(["xrefresh"], timeout=4, check=False)
        if attempt == 3:
            key("alt+F10")
        time.sleep(1)
        left = top_offset = 0
        if attempt < 2:
            photo("deployed")
            surface = "X11 root"
        else:
            surface = "X11 application window"
            command("import", "-window", xid, str(target))
            geometry = command("xwininfo", "-id", xid)
            left = int(re.search(r"Absolute upper-left X:\s*(-?\d+)", geometry)[1])
            top_offset = int(re.search(r"Absolute upper-left Y:\s*(-?\d+)", geometry)[1])
        with Image.open(target) as captured:
            read = []
            for node in (heading, action):
                box = node.queryComponent().getExtents(at.DESKTOP_COORDS)
                top = max(0, box.y - top_offset - 4)
                crop = captured.crop((max(0, box.x - left - 4), top, min(captured.width, box.x - left + box.width + 4),
                                      min(captured.height, box.y - top_offset + box.height + 4)))
                if crop.width == 0 or crop.height == 0:
                    read.append("")
                    continue
                from io import BytesIO
                stream = BytesIO()
                crop = crop.resize((crop.width * 3, crop.height * 3))
                crop.save(stream, "PNG")
                ocr = subprocess.run(["tesseract","stdin","stdout","-l","chi_sim","--psm","7"],
                                     input=stream.getvalue(), capture_output=True, timeout=12, check=True)
                read.append(re.sub(r"\s+", "", ocr.stdout.decode(errors="replace")))
            full = subprocess.run(["tesseract",str(target),"stdout","-l","chi_sim+eng","--psm","11"],
                                  capture_output=True, text=True, timeout=25, check=True)
            text = re.sub(r"\s+", "", full.stdout)
        words = read
        if ("成功" in read[0] and "启动器" in read[1]) or (
                ("操作成功" in text or "游戏已安装" in text) and "前往启动器" in text):
            record("visibleResult", {"ocrConfirmed": True, "window": surface,
                                     "expected": ["操作成功", "前往启动器"]})
            return
    raise RuntimeError("Could not verify success dialog in screenshot: " + repr(words[:2]))


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
    # The original Tetris implementation draws all menus and pieces inside one canvas.
    # Capture only its actual visible pixels, with the pointer kept off the board.
    click(button("Tetris"))
    canvas = wait("Tetris game canvas", lambda: next((n for r, name, _, n in entries()
                  if r == "canvas" and name == "TETRIS TV"), None), 75)
    box = canvas.queryComponent().getExtents(at.DESKTOP_COORDS)
    assert box.width > 128 and box.height > 120 and box.x >= 0 and box.y >= 0, tuple(box)
    command("xdotool", "mousemove", str(box.x + box.width // 2), str(box.y + box.height // 2), "click", "1")
    command("xdotool", "mousemove", "0", "0")
    time.sleep(2)

    def board(filename):
        path = out / (filename + ".png")
        command("import", "-window", "root", "-crop", f"{box.width}x{box.height}+{box.x}+{box.y}", str(path))
        with Image.open(path) as opened:
            image = opened.convert("RGB").resize((128, 120))
        assert len(image.getcolors(128 * 120)) > 10, "Game has not rendered a board"
        return image

    def changed_fraction(before, after):
        gray = ImageChops.difference(before, after).convert("L")
        return sum(gray.histogram()[20:]) / (gray.width * gray.height)

    menu = board("game-title")
    key("p")
    time.sleep(1)
    playing = board("game-playing")
    changed = changed_fraction(menu, playing)
    assert changed > 0.08, f"START did not replace the title with a board ({changed:.1%})"
    key("Right")
    key("p")
    time.sleep(0.5)
    paused = board("game-paused")
    changed_again = changed_fraction(playing, paused)
    assert changed_again > 0.025, f"Pause overlay did not appear ({changed_again:.1%})"
    record("offlineDesktop", {"game": "Tetris", "input": ["START", "Right", "Pause"],
                              "menuToBoardChangedFraction": round(changed, 4),
                              "boardToPauseChangedFraction": round(changed_again, 4)})
    back = wait("player toolbar", lambda: next((n for r, name, _, n in entries()
                if r in ("button", "push button") and "返回游戏列表" in name), None), 15)
    click(back)
    click(button(title + " · 部署到电视"))
    click(button("前往设备连接"))


def boot_tv():
    scratch = Path(os.environ["XDG_RUNTIME_DIR"])
    avds = command("emulator", "-list-avds").splitlines()
    assert "offlineTV" in avds, f"Prepared AVD unavailable: {avds}"
    free = os.statvfs(os.environ["ANDROID_AVD_HOME"])
    emulator_version = command("emulator", "-version").splitlines()
    version = next((line.strip() for line in emulator_version if "emulator version" in line.lower()), "unknown")
    record("emulatorEnvironment", {"availableAvds": avds, "version": version,
                                   "avdFreeMiB": free.f_bavail * free.f_frsize // 1048576})
    print(command("df", "-h", os.environ["ANDROID_AVD_HOME"]), flush=True)
    emulator_log = scratch / "emulator.log"

    def emulator_failure():
        text = emulator_log.read_text(errors="replace").splitlines()
        diagnostics = [line[:400] for line in text if re.search(
            r"error|failed|fatal|panic|missing|unknown|not found|not enough|does not exist|not supported", line, re.I)
            and not re.search(r"token|credential|password|adbkey|api.key|jwt|grpc", line, re.I)]
        return " | ".join(diagnostics[-8:]) or f"emulator exited with code {emulator.poll()}"

    emulator = subprocess.Popen(["emulator", "-avd", "offlineTV", "-port", "5554", "-no-window",
                                 "-gpu", "lavapipe", "-memory", "2048", "-cores", "2", "-noaudio",
                                 "-no-boot-anim", "-no-snapshot"], stdout=emulator_log.open("w"),
                                stderr=subprocess.STDOUT)
    def booted():
        if emulator.poll() is not None:
            failure = emulator_failure()
            record("emulatorExit", {"code": emulator.returncode, "reason": failure})
            raise RuntimeError("Android TV emulator exited during boot: " + failure)
        try:
            return (adb("emulator-5554", "shell", "getprop", "sys.boot_completed", timeout=5) == "1"
                    and "android.software.leanback" in adb("emulator-5554", "shell", "pm", "list", "features", timeout=8))
        except (subprocess.SubprocessError, OSError):
            return False
    wait("Android TV boot", booted, 420)
    assert os.readlink("/proc/self/ns/net") == os.readlink(f"/proc/{emulator.pid}/ns/net")
    for args in (["input", "keyevent", "KEYCODE_WAKEUP"], ["wm", "dismiss-keyguard"]):
        try:
            subprocess.run(["adb", "-s", "emulator-5554", "shell", *args], capture_output=True, timeout=10)
        except subprocess.TimeoutExpired:
            pass
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
    steps = ["打包 APK", "安装到电视", "完成"]
    for step in steps:
        see(step)
    deployment_photo()
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
                         "displayedSteps": steps, "launcherPageOpened": True, "leanbackComponent": component, "foregroundAfter5s": True})


if __name__ == "__main__":
    record("offlineHost", host_isolation())
    disconnected_and_play()
    tv = boot_tv()
    try:
        deploy()
        record("status", "passed")
    finally:
        tv.terminate()
