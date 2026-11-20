"""Reconcile the nine frozen packages with their upstream and SDK browser evidence."""
import argparse
import base64
import hashlib
import json
import re
import subprocess
from functools import lru_cache
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[3]
BASE = "ec5161417eaaf4b6be0585d04da60e59fb8d060f"
BUMBLE = "84eedab7caf4e7feb2d4292e64bf4468e8f6c6b0"
EARLIER = "18836937d8564c0e1534e1798c1dfb3096164bb0"
UPSTREAM = "a7051c34fe2e7550fd206e6272f758df171855b0"
UPSTREAM_TREE = "85ea19c4fae52bf13e9f7648c7d28d40a4f043e3"
UPSTREAM_REPO = "triptych/web-games-andrew"
BASE_EVIDENCE = (44715165610, "888897d75faf073b758c0759b080a8f0ad276b3b")
BUMBLE_EVIDENCE = (44716017753, "0acf8ec637dc7e5551982b737f25de5f62377fb9")
GAMES = (
    "alchemists-lattice", "story-thief", "bumble-basket", "starsling", "solder-and-rain",
    "oathstones", "neon-arcana", "atlas-of-ink", "starbase-spooky",
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def git(*args):
    return subprocess.check_output(["git", "-C", str(ROOT), *args])


def digest(data):
    return hashlib.sha256(data).hexdigest()


def blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def get(url):
    request = Request(url, headers={"User-Agent": "pureTV-source-audit"})
    with urlopen(request, timeout=45) as response:
        return response.read()


@lru_cache(maxsize=None)
def remote_tree(repo, ref):
    url = f"https://api.github.com/repos/{repo}/git/trees/{ref}?recursive=1"
    tree = json.loads(get(url))
    require(not tree["truncated"], f"Incomplete Git tree for {repo}@{ref}")
    if repo == UPSTREAM_REPO:
        require(tree["sha"] == UPSTREAM_TREE, "Unexpected upstream tree")
    return {v["path"]: v for v in tree["tree"] if v["type"] == "blob"}


def local_tree(revision, prefix):
    lines = git("ls-tree", "-r", revision, "--", prefix).decode().splitlines()
    return {path.removeprefix(prefix + "/"): meta.split()[2]
            for meta, path in (line.split("\t", 1) for line in lines)}


class FrozenGame:
    def __init__(self, slug):
        self.slug = slug
        self.prefix = f"joystick-games/{slug}"
        self.revision = BUMBLE if slug == "bumble-basket" else BASE
        self.files = local_tree(self.revision, self.prefix)

    def read(self, path):
        object_id = self.files[path]
        current = ROOT / self.prefix / path
        if current.is_file():
            data = current.read_bytes()
            if blob(data) == object_id:
                return data
        return git("cat-file", "blob", object_id)

    def json(self, path):
        return json.loads(self.read(path))


def original_bytes(path, directory, source, raw):
    oid = raw[path]["sha"]
    candidate = "src/" + path.removeprefix(directory + "/") if path.startswith(directory + "/") else path
    if source.files.get(candidate) == oid:
        return source.read(candidate)
    data = get(f"https://raw.githubusercontent.com/{UPSTREAM_REPO}/{UPSTREAM}/{path}")
    require(blob(data) == oid, f"Invalid upstream bytes for {path}")
    return data


def original_manifest(metadata, source, directory, raw):
    git_blobs = {}
    for path, oid in metadata.get("originalGitBlobs", {}).items():
        joined = f"{directory}/{path}"
        git_blobs[joined if joined in raw else path] = oid
    files = metadata.get("files", {})
    if isinstance(files, list):
        git_blobs.update((row["path"], row["sha"]) for row in files)
    else:
        git_blobs.update((p, row["gitBlob"]) for p, row in files.items())
    for path, oid in git_blobs.items():
        require(raw[path]["sha"] == oid, f"Original Git blob differs for {path}")
    checksums = metadata.get("originalFiles", metadata.get("filesAtUpstreamSha256", {}))
    for path, record in checksums.items():
        data = original_bytes(path, directory, source, raw)
        value = record
        if isinstance(record, dict):
            require(len(data) == record["bytes"], f"Source length differs for {path}")
            value = record["sha256"]
        require(digest(data) == value, f"Original SHA-256 differs for {path}")
    return len(git_blobs) + len(checksums)


def check_source(source, meta, raw):
    upstream = source.json("upstream.json")
    directory = meta["upstreamPath"]
    require(upstream.get("path", upstream.get("directory")) == directory, "Upstream directory differs")
    require(upstream["commit"] == meta["upstreamCommit"] == UPSTREAM, "Upstream commit differs")
    manifest_entries = original_manifest(upstream, source, directory, raw)
    original = {p.removeprefix(directory + "/"): v for p, v in raw.items() if p.startswith(directory + "/")}
    unchanged = {p for p, v in original.items() if source.files.get("src/" + p) == v["sha"]}
    model = {p for p in original if p.startswith(("js/sim/", "js/data/", "js/content/", "js/scenes/"))}
    require(model and model <= unchanged, f"Original model or scenes changed in {source.slug}")
    require(source.files["LICENSE"] == raw["LICENSE"]["sha"], "Original MIT license differs")
    require(source.read("NOTICE.md") == source.read("dist/THIRD-PARTY-NOTICES.txt"),
            f"Shipped notice differs for {source.slug}")
    html = source.read("dist/tv.html").decode()
    hosts = set(re.findall(r"https?://([a-zA-Z0-9.:-]+)", html))
    require(not hosts - {"www.w3.org"}, f"External URL in {source.slug} distribution: {hosts}")
    media = {p: v["sha"] for p, v in original.items() if p.endswith((".webp", ".mp3"))}
    embedded = {blob(base64.b64decode(s)) for s in re.findall(r"data:image/webp;base64,([\w+/=]+)", html)}
    media_found = {p for p, oid in media.items() if oid in embedded or source.files.get("dist/" + p) == oid}
    require(media_found == set(media), f"Missing original media in {source.slug}: {set(media) - media_found}")
    fonts = {digest(base64.b64decode(s)) for s in re.findall(r"data:font/woff2;base64,([\w+/=]+)", html)}
    declared = set(re.findall(r"SHA-256\s+([0-9a-f]{64})", source.read("NOTICE.md").decode()))
    declared.update(f["sha256"] for f in upstream.get("bundledFonts", []))
    require(fonts == declared, f"Bundled fonts differ from attribution for {source.slug}")
    return {"directory": directory, "manifestEntriesVerified": manifest_entries,
            "filesUnchangedAtOriginalPath": len(unchanged), "modelOrSceneFilesUnchanged": len(model),
            "originalMediaInDistribution": len(media), "distinctDistributionFontsVerified": len(fonts)}


def check_identity(source, meta, registry, claimed_keys):
    pkg = source.json("package.json")
    lock = source.json("package-lock.json")
    require(meta["version"] == pkg["version"] == lock["version"] == lock["packages"][""]["version"],
            "Package and lock versions differ")
    require(pkg["name"] == lock["name"] == lock["packages"][""]["name"], "Package and lock names differ")
    require(meta["versionCode"] == {"0.1.0": 1, "0.1.1": 2, "0.1.2": 3}[meta["version"]],
            "Android version code differs")
    expected_id = "com.ecojust.joystick." + source.slug.replace("-", "")
    require(meta["id"] == source.slug and meta["packageName"] == registry[source.slug]["packageName"] == expected_id,
            "Package ID differs between catalog and game")
    storage = set(meta["storageKeys"])
    require(not storage.intersection(claimed_keys), "Overlapping game storage keys")
    declared = set()
    suffixes = set()
    for p in source.files:
        if p.startswith("src/js/") and p.endswith(".js"):
            text = source.read(p).decode()
            declared.update(re.findall(r"""const\s+\w*KEY\s*=\s*['"]([^'"]+)['"]""", text))
            suffixes.update(re.findall(r"""SAVE_KEY\s*\+\s*['"]([^'"]+)['"]""", text))
    bases = {k for k in declared if k.endswith((".v1", ".v2"))}
    declared.update(k + s for k in bases for s in suffixes)
    require(storage == declared, f"Game and save implementation differ for {source.slug}")
    claimed_keys.update(storage)


def check_readme(source):
    folder = ROOT / source.prefix
    readme = (folder / "README.md").read_text(encoding="utf-8")
    links = set(re.findall(r"\]\(([^ )#]+)", readme))
    local = {path for path in links if "://" not in path}
    missing = sorted(path for path in local if not (folder / path).exists())
    require(not missing, f"Missing README links for {source.slug}: {missing}")
    return len(local)


def check_browser(source):
    folder = ROOT / "docs/puzzle-nine/browser" / source.slug
    recorded = json.loads((folder / "browser.json").read_bytes())
    exact_dist = {p.removeprefix("dist/"): digest(source.read(p)) for p in source.files if p.startswith("dist/")}
    require(recorded["dist"] == exact_dist, f"SDK run did not use the frozen {source.slug} dist")
    commit = recorded["evidenceCommit"]
    expected = BUMBLE_EVIDENCE if source.slug == "bumble-basket" else BASE_EVIDENCE
    require((recorded["verificationRun"], commit) == expected, "Unexpected SDK evidence identity")
    original = remote_tree("ecojust/pureTV", commit)
    # The imported report adds provenance only. Recompare with its original bytes and screenshot.
    prefix = f"https://raw.githubusercontent.com/ecojust/pureTV/{commit}/{source.slug}"
    exported = get(prefix + "/browser.json")
    require(blob(exported) == original[source.slug + "/browser.json"]["sha"], "Unexpected exported report")
    core = {k: v for k, v in recorded.items() if k not in ("evidenceCommit", "verificationRun", "evidenceUrl")}
    require(json.loads(exported) == core and core["game"] == source.slug, "Imported SDK evidence differs")
    gallery = (folder / "playing-1280.jpg").read_bytes()
    require(blob(gallery) == original[f"{source.slug}/1280/playing.jpg"]["sha"], "Illustrated screenshot differs")
    results = core["results"]
    require({tuple(r["viewport"]) for r in results} == {(960, 540), (1280, 720)} and len(results) == 2,
            "Expected both TV sizes")
    require("original SDK over loopback TCP" in core["transport"], "Incorrect controller transport")
    require(all(r["status"] == "passed" and r["disconnectPause"] and r["explicitResume"] and
                not r["externalRequests"] and not r["pageErrors"] and
                any("gameplay." in k for step in r["steps"] for k in step["observed"]) for r in results),
            "Gameplay, lifecycle or offline checks failed")
    return {"run": recorded["verificationRun"], "exportCommit": commit, "distFilesVerified": len(exact_dist),
            "htmlSHA256": exact_dist["tv.html"], "previewSHA256": digest(gallery),
            "stepsByWidth": {str(r["viewport"][0]): len(r["steps"]) for r in results}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write machine-readable audit results here.")
    args = parser.parse_args()
    registry = json.loads(git("show", BASE + ":joystick-games/catalog-registry.json"))["games"]
    raw = remote_tree(UPSTREAM_REPO, UPSTREAM_TREE)
    report = {"upstream": UPSTREAM, "upstreamTree": UPSTREAM_TREE, "baseProduction": BASE,
              "bumbleBasketProduction": BUMBLE, "earlierProduction": EARLIER, "games": {}}
    keys = set()
    for slug in GAMES:
        source = FrozenGame(slug)
        meta = source.json("game.json")
        check_identity(source, meta, registry, keys)
        r = {"version": meta["version"], "versionCode": meta["versionCode"], "packageName": meta["packageName"],
             "storageKeys": sorted(meta["storageKeys"]), "production": source.revision,
             "source": check_source(source, meta, raw), "browser": check_browser(source),
             "localReadmeTargetsVerified": check_readme(source)}
        old = local_tree(EARLIER, source.prefix)
        r["baseMatchesEarlier"] = old == local_tree(BASE, source.prefix)
        report["games"][slug] = r
    report["distinctStorageKeys"] = len(keys)
    output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.write_text(output, encoding="utf-8")
    else:
        print(output, end="")


if __name__ == "__main__":
    main()
