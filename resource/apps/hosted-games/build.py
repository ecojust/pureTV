#!/usr/bin/env python3
"""Build the online TV game's unsigned APK with Android SDK 35 and JDK 17."""
import argparse
import hashlib
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

APP = Path(__file__).resolve().parent
REPO = APP.parents[2]
KIT = REPO / "resource/game-kit"
ZXING_SHA256 = "8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82"
CONTROLLER_CLASSES = ("LanGameServer", "WifiControllerServer", "WifiControllerDiscovery")


def build(sdk, zxing, output):
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
        shutil.copyfile(REPO / "tools/pc-games/hosted-games.json", assets / "hosted-games.json")
        for extension in ("html", "css", "js"):
            shutil.copy(KIT / "web" / f"controller.{extension}", assets)
        generated = work / "generated"
        apk = work / "unsigned.apk"
        run(tools / "aapt2", "compile", "--dir", source / "res", "-o", work / "res.zip")
        run(tools / "aapt2", "link", "-I", android, "--manifest", source / "AndroidManifest.xml",
            "--java", generated, "-A", assets, "-o", apk, work / "res.zip")

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
    args = parser.parse_args()
    build(args.sdk, args.zxing, args.output)
