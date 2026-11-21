"""Refresh the artwork in published game apps and verify both the game and its new containers."""

import argparse
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import tempfile

from game_icons import source_image
from macos_game_icons import write_icns

ROOT = Path(__file__).resolve().parents[1]
INPUTS = ROOT / "tools/game-client-icon-inputs.json"


def run(*args, **kwargs):
    return subprocess.run([str(arg) for arg in args], check=True, **kwargs)


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def record(path):
    return {"bytes": path.stat().st_size, "sha256": digest(path)}


@contextmanager
def mounted(dmg):
    with tempfile.TemporaryDirectory() as directory:
        mount = Path(directory)
        run("hdiutil", "attach", "-readonly", "-nobrowse", "-mountpoint", mount, dmg)
        try:
            app, = [path for path in mount.glob("*.app") if path.is_dir() and not path.is_symlink()]
            yield app
        finally:
            run("hdiutil", "detach", mount)


def tree(app):
    result = {}
    for path in app.rglob("*"):
        relative = path.relative_to(app).as_posix()
        if path.is_symlink():
            result[relative] = ("symlink", str(path.readlink()))
        elif path.is_file():
            result[relative] = (path.stat().st_mode & 0o777, digest(path))
    return result


def unsigned_slices(exe, scratch):
    # The main executable has an embedded Mach-O signature. Compare each actual
    # architecture after stripping that signature from disposable file copies.
    archs = run("lipo", "-archs", exe, capture_output=True, text=True).stdout.split()
    if set(archs) != {"arm64", "x86_64"}:
        raise ValueError(f"Expected a Universal 2 executable at {exe}")
    hashes = {}
    for arch in archs:
        thin = scratch / ("unsigned-" + arch)
        run("lipo", exe, "-thin", arch, "-output", thin)
        run("codesign", "--remove-signature", thin)
        hashes[arch] = digest(thin)
        thin.unlink()
    return hashes


def verify_container_app(app, expected_tree, icon_name, art):
    run("codesign", "--verify", "--deep", "--strict", app)
    info = plistlib.loads((app / "Contents/Info.plist").read_bytes())
    resource = app / "Contents/Resources" / icon_name
    if (info.get("CFBundleIconFile") != icon_name or digest(resource) != art["icnsSha256"]
            or tree(app) != expected_tree):
        raise ValueError(f"Packaged app, signature resource or icon differs: {app}")


def repackage(row, scratch, out):
    slug, game = row["id"], ROOT / row["gameDir"]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or game.name != slug:
        raise ValueError(f"Invalid game identity {slug}, {game}")
    url = row["macos"]
    original = scratch / "original.dmg"
    run("curl", "--retry", "3", "--fail", "--location", "--silent", "--show-error", url, "-o", original)
    source_digest = digest(original)
    if source_digest != row["macosSha256"]:
        raise ValueError(f"{slug}: downloaded disk image differs from the frozen input")
    with mounted(original) as original_app:
        app = scratch / original_app.name
        run("ditto", original_app, app)
    run("codesign", "--verify", "--deep", "--strict", app)
    before = tree(app)
    contents = app / "Contents"
    info_file = contents / "Info.plist"
    info = plistlib.loads(info_file.read_bytes())
    exe = contents / "MacOS" / info["CFBundleExecutable"]
    slices = unsigned_slices(exe, scratch)

    icon_name = info.get("CFBundleIconFile") or "Game.icns"
    if Path(icon_name).name != icon_name:
        raise ValueError(f"{slug}: unexpected bundle icon path {icon_name}")
    if not icon_name.lower().endswith(".icns"):
        icon_name += ".icns"
    icon = contents / "Resources" / icon_name
    info["CFBundleIconFile"] = icon_name
    info.pop("CFBundleIconName", None)
    info_file.write_bytes(plistlib.dumps(info))
    art = write_icns(game, icon)
    run("codesign", "--force", "--sign", "-", "--preserve-metadata=identifier,entitlements,flags,runtime",
        "--timestamp=none", app)
    run("codesign", "--verify", "--deep", "--strict", app)
    if unsigned_slices(exe, scratch) != slices:
        raise ValueError(f"{slug}: executable code changed")
    signed = tree(app)
    allowed = {p.relative_to(app).as_posix() for p in (icon, info_file, exe)}
    allowed.add("Contents/_CodeSignature/CodeResources")
    changed = {p for p in before.keys() | signed.keys() if before.get(p) != signed.get(p)}
    if not changed <= allowed:
        raise ValueError(f"{slug}: unexpected changes inside app: {sorted(changed - allowed)}")

    # Keep a companion ZIP for games that previously shipped a native app ZIP.
    files = {}
    if not info["CFBundleIdentifier"].startswith("com.ecojust.puretv.games."):
        archive = out / (slug + "-macos.zip")
        run("ditto", "-c", "-k", "--sequesterRsrc", "--keepParent", app, archive)
        extracted = scratch / "extracted"
        run("ditto", "-x", "-k", archive, extracted)
        verify_container_app(extracted / app.name, signed, icon_name, art)
        files[archive.name] = record(archive)

    staging = scratch / "volume"
    staging.mkdir()
    run("ditto", app, staging / app.name)
    (staging / "Applications").symlink_to("/Applications")
    dmg = out / (slug + "-macos.dmg")
    run("hdiutil", "create", "-volname", app.stem, "-srcfolder", staging, "-format", "UDZO", dmg)
    run("hdiutil", "verify", dmg)
    with mounted(dmg) as installed:
        verify_container_app(installed, signed, icon_name, art)
    files[dmg.name] = record(dmg)
    return {
        "id": slug, "sourceDmg": url, "sourceDmgSha256": source_digest,
        "bundleIdentifier": info["CFBundleIdentifier"], "appVersion": info["CFBundleShortVersionString"],
        "screenshot": source_image(game).relative_to(ROOT).as_posix(),
        **art,
        "bundleIconFile": icon_name, "unsignedMachOSlices": slices, "changedFiles": sorted(changed),
        "adHocSignatureVerified": True, "files": files,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--shard", type=int, default=0)
    parser.add_argument("--shards", type=int, default=1)
    args = parser.parse_args()
    if not 0 <= args.shard < args.shards:
        parser.error("invalid shard")
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    rows = [row for row in json.loads(INPUTS.read_text()) if row.get("macos")]
    report = []
    for row in rows[args.shard::args.shards]:
        print(f"Refreshing {row['id']}", flush=True)
        with tempfile.TemporaryDirectory() as directory:
            report.append(repackage(row, Path(directory), out))
    (out / f"macos-shard-{args.shard}.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
