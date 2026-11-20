"""Extract unchanged, checksum-verified game assets and matching production room classes."""

import hashlib
import json
import os
from pathlib import Path
import subprocess
from zipfile import ZipFile


here = Path(__file__).resolve().parent
repo = Path(os.environ["QA_REPO"])
apk_dir = Path(os.environ["QA_SIGNED_APKS"])
work = Path(os.environ["QA_WORKDIR"])
games = json.loads((here / "source.json").read_text())
receipt_dir = here / "compact" if os.environ.get("QA_COMPACT") else here
signed = json.loads((receipt_dir / "signed-assets.json").read_text())

for slug, receipt in signed.items():
    source = games[slug]
    apk = apk_dir / slug / receipt["apk"]
    with apk.open("rb") as stream:
        checksum = hashlib.file_digest(stream, "sha256").hexdigest()
    if checksum != receipt["apkSha256"]:
        raise ValueError(f"Unexpected signed package content for {slug}")

    src = source["serverSource"]
    code = subprocess.check_output(
        ["git", "-C", str(repo), "show", f"{source['sourceCommit']}:{src}"]
    )
    if hashlib.sha256(code).hexdigest() != source["serverSha256"]:
        raise ValueError(f"Unexpected room server source for {slug}")
    target = work / "sources" / src
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(code)

    target = work / "assets" / slug
    with ZipFile(apk) as archive:
        for member in archive.infolist():
            if not member.filename.startswith("assets/") or member.is_dir():
                continue
            relative = Path(member.filename.removeprefix("assets/"))
            if relative.is_absolute() or ".." in relative.parts:
                raise ValueError(f"Invalid asset path {member.filename}")
            local = target / relative
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(archive.read(member))

(work / "empty-overlay").mkdir(exist_ok=True)
(work / "classes").mkdir(exist_ok=True)
