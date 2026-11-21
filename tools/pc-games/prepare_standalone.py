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
            apks[slug] = (links[0].rstrip("/"), apk)
    return apks


def download(url, size):
    request = Request(url, headers={"User-Agent": "pureTV-standalone-builder"})
    with urlopen(request, timeout=90) as response:
        payload = response.read(size + 1)
    if len(payload) != size:
        raise ValueError(f"Unexpected APK size at {url}")
    return payload


def tracked_file(path):
    local = ROOT / path
    if local.is_file():
        return local.read_bytes()
    return subprocess.check_output(["git", "-C", str(ROOT), "show", f"HEAD:{path}"])


def write_notices(archive, game, page, directory):
    directory.mkdir()
    slug = game["id"]
    # Preserve upstream notices verbatim. The project license covers its own host code.
    filenames = ["LICENSE", "NOTICE.md", "upstream.json", "licenses"]
    if slug == "jackal":
        filenames.extend(["docs/reference.md", "docs/reference-audio.md"])
    tracked = subprocess.check_output(
        ["git", "-C", str(ROOT), "ls-tree", "-r", "--name-only", "HEAD", "--",
         *(f"{page}/{name}" for name in filenames)], text=True
    ).splitlines()
    for path in tracked:
        (directory / ("game-" + Path(path).name)).write_bytes(tracked_file(path))
    (directory / "desktop-host-LICENSE.txt").write_bytes(tracked_file("LICENSE"))
    for name in archive.namelist():
        leaf = Path(name).name
        if (name.startswith("assets/") or name == "res/raw/license.txt") and re.search(
            r"(?:license|notice|provenance).*\.(?:txt|md|json)$", leaf, re.I
        ):
            (directory / ("apk-" + name.replace("/", "_"))).write_bytes(archive.read(name))
    if b"com/google/zxing" in archive.read("classes.dex"):
        for name in ("zxing-LICENSE.txt", "zxing-NOTICE.txt"):
            (directory / name).write_bytes(tracked_file(f"resource/apps/hifini/third-party/{name}"))
    revision = subprocess.check_output(["git", "-C", str(ROOT), "rev-parse", "HEAD"], text=True).strip()
    source = {
        "game": slug,
        "game_directory": f"https://github.com/ecojust/pureTV/tree/{revision}/{page}",
        "source_apk": game["url"],
        "apk_sha256": game["sha256"],
    }
    if page.startswith("resource/apps/"):
        resource = json.loads(tracked_file(f"{page}/resource.json"))
        source.update({k: resource[k] for k in ("author", "license", "romIncluded") if k in resource})
    (directory / "source.json").write_text(
        json.dumps(source, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def prepare(game, page, apk_url, output):
    slug = game["id"]
    filename = urlsplit(game["url"]).path.rsplit("/", 1)[-1]
    match = re.fullmatch(re.escape(slug) + r"-(\d+\.\d+\.\d+)\.apk", filename)
    source = urlsplit(apk_url)
    if not match or source.path.rsplit("/", 1)[-1] != filename:
        raise ValueError(f"{slug}: check game ID and version against the source APK")
    size = game["bytes"]
    data = download(game["url"], size)
    if hashlib.sha256(data).hexdigest() != game["sha256"]:
        raise ValueError(f"{slug}: catalog download SHA-256 mismatch")
    if not source.scheme:
        source_data = tracked_file(source.path)
    elif apk_url != game["url"]:
        source_data = download(apk_url, size)
    else:
        source_data = data
    if data != source_data:
        raise ValueError(f"{slug}: source and desktop catalog point to different APK content")

    target = output / slug
    target.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=target) as staging:
        apk = Path(staging) / "game.apk"
        apk.write_bytes(data)
        licenses = Path(staging) / "licenses"
        with ZipFile(apk) as archive:
            if archive.testzip() or not archive.read("AndroidManifest.xml"):
                raise ValueError(f"{slug}: damaged APK")
            html = archive.read("assets/tv.html").decode("utf-8-sig")
            if not re.search(r"<head(?:\s[^>]*)?>", html, re.I):
                raise ValueError(f"{slug}: missing game page entry point")
            write_notices(archive, game, page, licenses)
        metadata = {key: game[key] for key in ("id", "en", "zh", "sha256")}
        metadata["version"] = match.group(1)
        metadata["platforms"] = ["macos", "windows"] if slug in BOTH_PLATFORMS else ["windows"]
        info = Path(staging) / "game.json"
        info.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        installed_licenses = target / "licenses"
        # Keep only the notices belonging to this verified APK on repeated builds.
        previous = Path(staging) / "previous-licenses"
        if installed_licenses.exists():
            installed_licenses.replace(previous)
        try:
            licenses.replace(installed_licenses)
        except OSError:
            if previous.exists():
                previous.replace(installed_licenses)
            raise
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
        if slug in readme:
            page, apk_url = readme[slug]
        else:
            page = f"resource/apps/{slug}"
            resource = json.loads(tracked_file(f"{page}/resource.json"))
            apk_url = f"{page}/{resource['apk']}"
        prepare(games[slug], page, apk_url, args.output)


if __name__ == "__main__":
    main()
