#!/usr/bin/env python3
"""Build the online TV game's unsigned APK with Android SDK 35 and JDK 17."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

APP = Path(__file__).resolve().parent
REPO = APP.parents[2]
KIT = REPO / "resource/game-kit"
ZXING_SHA256 = "8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82"
CONTROLLER_CLASSES = ("LanGameServer", "WifiControllerServer", "WifiControllerDiscovery")


CATALOG = REPO / "tools/pc-games/hosted-games.json"


def single_game_inputs(game_id, source, assets, work):
    from PIL import Image, ImageOps

    games = json.loads(CATALOG.read_text(encoding="utf-8"))
    game = next((entry for entry in games if entry["id"] == game_id), None)
    if game is None:
        raise ValueError(f"Unknown hosted game: {game_id}")

    (assets / "hosted-games.json").write_text(json.dumps([game], ensure_ascii=False), encoding="utf-8")
    config = assets / "game-config.json"
    controller = json.loads(config.read_text(encoding="utf-8"))
    controller.update(name=game["zh"], nameEn=game["en"])
    config.write_text(json.dumps(controller, ensure_ascii=False), encoding="utf-8")

    resources = work / "res"
    shutil.copytree(source / "res", resources)
    strings = resources / "values/strings.xml"
    values = ET.parse(strings)
    values.find(".//string[@name='app_name']").text = game["zh"]
    values.write(strings, encoding="utf-8")
    number = game["number"]
    start = (number - 1) // 500 * 500 + 1
    preview = REPO / "joystick-games/catalog/previews" / f"{start:04}-{start + 499:04}" / f"{number:04}.webp"
    drawables = resources / "drawable-nodpi"
    drawables.mkdir()
    with Image.open(preview) as original:
        for name, size in (("icon", (192, 192)), ("banner", (320, 180))):
            (resources / "drawable" / f"{name}.xml").unlink()
            ImageOps.fit(original.convert("RGB"), size, method=Image.Resampling.LANCZOS).save(drawables / f"{name}.png")

    package = "com.ecojust.hostedgames." + game_id.replace("-", "_")
    return resources, ["--rename-manifest-package", package]


def build(sdk, zxing, output, game_id=None):
    if hashlib.sha256(zxing.read_bytes()).hexdigest() != ZXING_SHA256:
        raise ValueError("Expected the pinned ZXing core 3.5.3 JAR")
    tools = sdk / "build-tools/34.0.0"
    android = sdk / "platforms/android-35/android.jar"
    source = APP / "src/main"
    output.parent.mkdir(parents=True, exist_ok=True)

    def run(*command):
        subprocess.run(command, check=True)

    with tempfile.TemporaryDirectory(prefix="hosted-tv-") as tmp:
        work = Path(tmp)
        assets = work / "assets"
        shutil.copytree(source / "assets", assets)
        resources = source / "res"
        link_options = []
        if game_id is None:
            shutil.copyfile(CATALOG, assets / "hosted-games.json")
        else:
            resources, link_options = single_game_inputs(game_id, source, assets, work)
        for extension in ("html", "css", "js"):
            shutil.copy(KIT / "web" / f"controller.{extension}", assets)
        generated = work / "generated"
        apk = work / "unsigned.apk"
        run(tools / "aapt2", "compile", "--dir", resources, "-o", work / "res.zip")
        run(tools / "aapt2", "link", "-I", android, "--manifest", source / "AndroidManifest.xml",
            *link_options, "--java", generated, "-A", assets, "-o", apk, work / "res.zip")

        classes = work / "classes"
        classes.mkdir()
        shared = KIT / "android/src/main/java/com/ecojust/gamekit"
        java = sorted((source / "java").rglob("*.java")) + sorted(generated.rglob("*.java"))
        java.extend(shared / (name + ".java") for name in CONTROLLER_CLASSES)
        run("javac", "-encoding", "UTF-8", "-proc:none", "-source", "8", "-target", "8",
            "-bootclasspath", f"{android}:{tools / 'core-lambda-stubs.jar'}", "-classpath", zxing,
            "-d", classes, *java)
        library = work / "classes.jar"
        run("jar", "cf", library, "-C", classes, ".")
        dex = work / "dex"
        dex.mkdir()
        run(tools / "d8", "--release", "--min-api", "26", "--lib", android,
            "--output", dex, library, zxing)
        with zipfile.ZipFile(apk, "a") as archive:
            archive.write(dex / "classes.dex", "classes.dex", compress_type=zipfile.ZIP_STORED)
        run(tools / "zipalign", "-f", "4", apk, output)
        with zipfile.ZipFile(output) as archive:
            if archive.testzip() or output.stat().st_size >= 10_000_000:
                raise ValueError("Invalid or oversized TV APK")
            for path in assets.rglob("*"):
                if path.is_file() and archive.read("assets/" + path.relative_to(assets).as_posix()) != path.read_bytes():
                    raise ValueError(f"Packaged asset differs: {path.name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sdk", required=True, type=Path)
    parser.add_argument("--zxing", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--game", choices=[entry["id"] for entry in json.loads(CATALOG.read_text(encoding="utf-8"))],
                        help="Build a standalone TV app for one game from the hosted catalog")
    args = parser.parse_args()
    build(args.sdk, args.zxing, args.output, args.game)
