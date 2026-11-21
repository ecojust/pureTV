"""Prepare the catalog-verified APK and game metadata used by each standalone desktop build."""

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[2]
BOTH_PLATFORMS = {
    "adventure-island", "alien-shooter", "bomb-jack", "clawd-pop", "coast-kart",
    "jackal", "jewel", "lumenrift", "operation-ironhold", "saber-magic-tower",
    "super-mario", "tank", "tetris", "tower-overlap", "turbo-kart-rally", "used-car-racing",
}
WINDOWS_ONLY = {"cf-transport-ship", "emberbrood", "glup", "neon-rush", "qq-speed"}


def readme_apks():
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    gallery = readme.split("<!-- game-index:start -->")[1].split("<!-- game-index:end -->")[0]
    apks = {}
    for card in re.findall(r"<td\b[^>]*>(.*?)</td>", gallery, re.S):
        links = re.findall(r'<a href="([^"]+)"', card)
        if links:
            slug = links[0].rstrip("/").rsplit("/", 1)[-1]
            apk, = [href for href in links if urlsplit(href).path.endswith(".apk")]
            if slug in apks:
                raise ValueError(f"Duplicate README game: {slug}")
            apks[slug] = apk
    return apks


def download(url, size):
    request = Request(url, headers={"User-Agent": "pureTV-standalone-builder"})
    with urlopen(request, timeout=90) as response:
        payload = response.read(size + 1)
    if len(payload) != size:
        raise ValueError(f"Unexpected APK size at {url}")
    return payload


def prepare(game, readme_url, output):
    slug = game["id"]
    filename = urlsplit(game["url"]).path.rsplit("/", 1)[-1]
    match = re.fullmatch(re.escape(slug) + r"-(\d+\.\d+\.\d+)\.apk", filename)
    source = urlsplit(readme_url)
    if not match or source.path.rsplit("/", 1)[-1] != filename:
        raise ValueError(f"{slug}: check game ID and version against the README APK")
    size = game["bytes"]
    data = download(game["url"], size)
    if hashlib.sha256(data).hexdigest() != game["sha256"]:
        raise ValueError(f"{slug}: catalog download SHA-256 mismatch")
    if not source.scheme:
        path = ROOT / source.path
        # Sparse CI checkouts still have access to the tracked README target.
        readme_data = path.read_bytes() if path.is_file() else subprocess.check_output(
            ["git", "-C", str(ROOT), "show", f"HEAD:{source.path}"]
        )
    elif readme_url != game["url"]:
        readme_data = download(readme_url, size)
    else:
        readme_data = data
    if data != readme_data:
        raise ValueError(f"{slug}: README and desktop catalog point to different APK content")

    target = output / slug
    target.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=target) as staging:
        apk = Path(staging) / "game.apk"
        apk.write_bytes(data)
        with ZipFile(apk) as archive:
            if archive.testzip() or not archive.read("AndroidManifest.xml"):
                raise ValueError(f"{slug}: damaged APK")
            html = archive.read("assets/tv.html").decode("utf-8-sig")
            if not re.search(r"<head(?:\s[^>]*)?>", html, re.I):
                raise ValueError(f"{slug}: missing game page entry point")
        metadata = {key: game[key] for key in ("id", "en", "zh", "sha256")}
        metadata["version"] = match.group(1)
        metadata["platforms"] = ["macos", "windows"] if slug in BOTH_PLATFORMS else ["windows"]
        info = Path(staging) / "game.json"
        info.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        apk.replace(target / apk.name)
        info.replace(target / info.name)
    print(f"{slug} {metadata['version']} {game['sha256']}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--game", choices=sorted(BOTH_PLATFORMS | WINDOWS_ONLY))
    parser.add_argument("--platform", choices=["macos", "windows"])
    args = parser.parse_args()
    selected = BOTH_PLATFORMS if args.platform == "macos" else BOTH_PLATFORMS | WINDOWS_ONLY
    if args.game:
        if args.game not in selected:
            parser.error(f"{args.game} has no build target for {args.platform}")
        selected = {args.game}
    catalog = json.loads((ROOT / "tools/pc-games/catalog.json").read_text(encoding="utf-8"))
    games = {game["id"]: game for game in catalog}
    if len(games) != len(catalog):
        raise ValueError("Duplicate desktop catalog game ID")
    readme = readme_apks()
    for slug in sorted(selected):
        prepare(games[slug], readme[slug], args.output)


if __name__ == "__main__":
    main()
