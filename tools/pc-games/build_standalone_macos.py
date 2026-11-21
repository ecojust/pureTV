"""Build game-specific, offline macOS Universal 2 apps and disk images on a Mac."""

import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import plistlib
import shutil
import subprocess
import sys
import sysconfig
import tempfile
from zipfile import ZipFile


SOURCE = Path(__file__).resolve().parent
sys.path.insert(0, str(SOURCE.parent))

ARCHS = ("arm64", "x86_64")


def run(*command, **kwargs):
    return subprocess.run([str(arg) for arg in command], check=True, **kwargs)


def build_players(work):
    run(
        sys.executable, "-m", "PyInstaller", "--noconfirm", "--onefile", "--console",
        "--name", "player", "--target-architecture", "universal2",
        "--distpath", work, "--specpath", work, "--workpath", work / "pyinstaller",
        "--add-data", f"{SOURCE / 'pc-bridge.js'}:.", "--collect-all", "zeroconf",
        "--recursive-copy-metadata", "zeroconf", SOURCE / "standalone.py", cwd=work,
    )
    parts = []
    for arch in ARCHS:
        part = work / ("Game-" + arch)
        run("xcrun", "swiftc", "-swift-version", "5", "-O", "-target", arch + "-apple-macos11.0",
            "-framework", "AppKit", "-framework", "WebKit", SOURCE / "StandaloneGame.swift", "-o", part)
        parts.append(part)
    run("lipo", "-create", *parts, "-output", work / "Game")
    for binary in (work / "Game", work / "player"):
        run("lipo", binary, "-verify_arch", *ARCHS)


def licenses(resources, apk, game_licenses):
    directory = resources / "Licenses"
    directory.mkdir()
    if game_licenses.is_dir():
        shutil.copytree(game_licenses, directory / "Game")
    shutil.copyfile(SOURCE.parents[1] / "LICENSE", directory / "pureTV.txt")
    shutil.copyfile(Path(sysconfig.get_path("stdlib")) / "LICENSE.txt", directory / "Python.txt")
    for name in ("zeroconf", "ifaddr", "PyInstaller"):
        dist = importlib.metadata.distribution(name)
        for rel in dist.files or []:
            if rel.name.lower().startswith(("copying", "license")) and rel.locate().is_file():
                shutil.copyfile(rel.locate(), directory / (name + "-" + rel.name))
    with ZipFile(apk) as archive:
        for info in archive.infolist():
            basename = Path(info.filename).name
            if not info.is_dir() and any(term in basename.upper() for term in ("LICENSE", "NOTICE", "COPYING")):
                # Preserve distinct notices from separate directories of the APK.
                (directory / info.filename.replace("/", "_")).write_bytes(archive.read(info))


def build_game(source, game, players, output):
    name, slug = game["en"], game["id"]
    if Path(name).name != name or ":" in name or source.name != slug:
        raise ValueError(f"Invalid bundle name or game ID: {source}")
    with tempfile.TemporaryDirectory(dir=players) as tmp:
        staging = Path(tmp)
        app = staging / (name + ".app")
        contents = app / "Contents"
        for directory in ("MacOS", "Helpers", "Resources"):
            (contents / directory).mkdir(parents=True)
        exe = contents / "MacOS" / "Game"
        helper = contents / "Helpers" / "player"
        resources = contents / "Resources"
        shutil.copy2(players / "Game", exe)
        shutil.copy2(players / "player", helper)
        apk = resources / "game.apk"
        shutil.copyfile(source / "game.apk", apk)
        shutil.copyfile(source / "game.json", resources / "game.json")
        licenses(resources, apk, source / "licenses")
        from game_icons import catalog_game_dir
        from macos_game_icons import write_icns
        write_icns(catalog_game_dir(SOURCE.parents[1], slug), resources / "Game.icns")
        info = {
            "CFBundleIconFile": "Game.icns",
            "CFBundleExecutable": "Game", "CFBundleName": name, "CFBundleDisplayName": name,
            "CFBundleIdentifier": "com.ecojust.puretv.games." + slug,
            "CFBundlePackageType": "APPL", "CFBundleInfoDictionaryVersion": "6.0",
            "CFBundleShortVersionString": game["version"], "CFBundleVersion": game["version"],
            "LSMinimumSystemVersion": "11.0", "LSApplicationCategoryType": "public.app-category.games",
            "NSHighResolutionCapable": True, "NSBonjourServices": ["_puretv._tcp"],
            "NSLocalNetworkUsageDescription": "Connect a pureTV Wi-Fi controller to this game.",
            "NSAppTransportSecurity": {"NSAllowsLocalNetworking": True},
        }
        (contents / "Info.plist").write_bytes(plistlib.dumps(info))
        run("codesign", "--force", "--sign", "-", "--timestamp=none", helper)
        run("codesign", "--force", "--sign", "-", "--timestamp=none", app)
        run("codesign", "--verify", "--deep", "--strict", app)
        identity = json.loads(run(exe, "--smoke-test", capture_output=True, text=True).stdout)
        if identity != {"id": slug, "version": game["version"]}:
            raise ValueError(f"Unexpected packaged game identity: {identity}")
        (staging / "Applications").symlink_to("/Applications")
        # Build outside the source folder so hdiutil cannot copy its own image.
        image = players / (slug + "-macos.dmg")
        run("hdiutil", "create", "-quiet", "-fs", "HFS+", "-format", "UDZO",
            "-volname", name, "-srcfolder", staging, image)
        run("hdiutil", "verify", "-quiet", image)
        target = output / image.name
        shutil.move(image, target)
        print(f"{slug} {game['version']} {target.name} {hashlib.sha256(target.read_bytes()).hexdigest()}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--games", nargs="+")
    args = parser.parse_args()
    if sys.platform != "darwin":
        parser.error("Requires macOS, Xcode command line tools and a Universal 2 Python / PyInstaller")
    inputs = args.inputs.resolve()
    slugs = args.games or sorted(p.name for p in inputs.iterdir() if p.is_dir())
    games = []
    for slug in slugs:
        info = json.loads((inputs / slug / "game.json").read_text(encoding="utf-8"))
        if "macos" in info["platforms"]:
            games.append((inputs / slug, info))
        elif args.games:
            parser.error(f"{slug} has no macOS build target")
    if not games:
        parser.error("No macOS game data found")
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as scratch:
        work = Path(scratch)
        build_players(work)
        for source, info in games:
            build_game(source, info, work, output)


if __name__ == "__main__":
    main()
