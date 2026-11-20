#!/usr/bin/env python3
"""Read archived steering evidence; do not launch or modify the game."""
import datetime
import hashlib
import json
import math
import subprocess
import sys
import traceback
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[5]
TARGET = "cc04129f0369c1e9f9262ab798b353f276f1dc3b"
OUTPUT = HERE / "preflight-audit.json"


def sha(body):
    return hashlib.sha256(body).hexdigest()


def read(name):
    return json.loads((HERE / name).read_text())


def committed(name, commit=TARGET):
    return subprocess.check_output(["git", "show", commit + ":" + name], cwd=REPO)


def multiply(a, b):
    assert len(a) == len(b) == 16
    return [sum(a[k * 4 + row] * b[col * 4 + k] for k in range(4))
            for col in range(4) for row in range(4)]


def project(matrix, car):
    assert len(matrix) == 16 and all(math.isfinite(v) for v in matrix)
    position = [car["x"], car["y"] + 0.5, car["z"], 1]
    clip = [sum(matrix[col * 4 + row] * position[col] for col in range(4))
            for row in range(4)]
    assert clip[3] > 0.01, "Car is behind the frozen reference camera"
    return clip[0] / clip[3]


def old_zip():
    provenance = read("before-keyboard/provenance.json")
    archive = REPO / provenance["zip"]
    assert sha(archive.read_bytes()) == provenance["zipSha256"]
    prefix = "Neon Rush.app/Contents/Resources/Web/"
    rows = []
    with zipfile.ZipFile(archive) as opened:
        names = sorted(name for name in opened.namelist()
                       if name.startswith(prefix) and not name.endswith("/"))
        local = sorted(p.name for p in (HERE / "before-keyboard/web").iterdir() if p.is_file())
        assert len(names) == len(local) == 17
        assert [name[len(prefix):] for name in names] == local
        for name in names:
            short = name[len(prefix):]
            packed = opened.read(name)
            extracted = (HERE / "before-keyboard/web" / short).read_bytes()
            assert packed == extracted, short + " differs from ZIP bytes"
            rows.append({"file": short, "bytes": len(packed), "sha256": sha(packed)})
    return {"zip": provenance["zip"], "zipSha256": provenance["zipSha256"],
            "filesComparedByteForByte": len(rows), "files": rows}


def directions(directory, old):
    report = read(directory + "/report.json")
    assert report["errors"] == []
    assert report["status"] == ("failed" if old else "passed")
    assert sorted(row["input"] for row in report["cases"]) == ["LEFT", "RIGHT"]
    rows = []
    for case in report["cases"]:
        sign = {"LEFT": -1, "RIGHT": 1}[case["input"]]
        assert case["expectedSign"] == sign
        if old:
            before, after = case["before"]["game"], case["after"]["game"]
            camera = case["before"]["camera"]
            matrix = multiply(camera["projection"], camera["view"])
            assert case["passed"] is False
        else:
            before, after = case["before"], case["after"]
            matrix = before["renderer"]["cameraViewProjection"]
            assert case["status"] == "passed"
            video = case["video"]
            body = (HERE / directory / video["file"]).read_bytes()
            assert len(body) == video["bytes"] and sha(body) == video["sha256"]
        assert before["renderer"]["drawCalls"] > 0 and after["renderer"]["drawCalls"] > 0
        assert before["model"]["trackId"] == after["model"]["trackId"] == "skyport"
        assert after["model"]["raceTime"] > before["model"]["raceTime"]
        assert after["model"]["stats"]["collisions"] == before["model"]["stats"]["collisions"]
        delta = project(matrix, after["model"]["player"]) - project(matrix, before["model"]["player"])
        assert math.isclose(delta, case["screenDeltaX"], rel_tol=1e-12, abs_tol=1e-12)
        assert delta * sign < -0.015 if old else delta * sign > 0.015
        rows.append({"input": case["input"], "expectedSign": sign,
                     "recomputedScreenDeltaX": delta,
                     "matchesRecordedValue": True, "matchesIntendedDirection": not old})
    if not old:
        assert report["nativeMacOSAppTested"] is False
        assert report["physicalEsp32Tested"] is False and report["gameStateWrites"] is False
    return {"statusInOriginalReport": report["status"], "cases": rows,
            "scope": "Recomputed from archived actual renderer camera matrices and car positions; no game rerun. Browser evidence is not native Mac or physical controller evidence."}


def commit_binding():
    report = read("after-keyboard/report.json")
    rows = []
    for name in ("game-model.js", "game.js"):
        path = "resource/apps/neon-rush/src/main/assets/" + name
        blob = committed(path)
        expected = report["assetHashes"][name]
        assert sha(blob) == expected, name + " report hash does not match target commit"
        assert (REPO / path).read_bytes() == blob, name + " worktree differs from target commit"
        rows.append({"file": path, "sha256": expected, "matchesReportAndCommit": True})
    sources = []
    for name in ("model.mjs", "tracks.mjs", "world.mjs"):
        path = "resource/apps/neon-rush/source/" + name
        blob = committed(path)
        assert (REPO / path).read_bytes() == blob
        sources.append({"file": path, "sha256": sha(blob), "matchesTargetCommit": True})
    script = "resource/apps/neon-rush/macos/tests/steering-browser.mjs"
    assert (HERE / "after-keyboard/executed-steering-browser.mjs").read_bytes() == committed(script)
    return {"commit": TARGET, "generatedAssets": rows, "sourceFiles": sources,
            "executedBrowserScriptMatchesCommit": True,
            "scope": "Binds the captured generated-asset hashes and frozen source files to the requested commit; does not regenerate bundles or rerun build checks."}


def synthetic_projection():
    provenance = read("before-projection/provenance.json")
    result = read("before-projection/result.json")
    source_commit = provenance["sourceCommit"]
    assert result["sourceCommit"] == source_commit and result["status"] == "reproduced"
    assert sha((HERE / "before-projection/reproduce.mjs").read_bytes()) == result["scriptSha256"]
    for source, metadata in provenance["sourceFiles"].items():
        body = (HERE / "before-projection" / Path(source).name).read_bytes()
        assert len(body) == metadata["bytes"] and sha(body) == metadata["sha256"]
        assert body == committed(source, source_commit)
    rows = []
    for row in result["records"]:
        variants = row["variants"]
        left = variants["left"]["initialCameraProjectedX"] - variants["straight"]["initialCameraProjectedX"]
        right = variants["right"]["initialCameraProjectedX"] - variants["straight"]["initialCameraProjectedX"]
        assert math.isclose(left, row["leftMinusStraightScreenX"], abs_tol=1e-12)
        assert math.isclose(right, row["rightMinusStraightScreenX"], abs_tol=1e-12)
        assert left > 0 and right < 0
        rows.append({"track": row["track"], "leftMinusStraightScreenX": left,
                     "rightMinusStraightScreenX": right})
    return {"sourceCommit": source_commit, "archivedSourcesVerified": len(provenance["sourceFiles"]),
            "records": rows, "scope": provenance["scope"]}


def runtime_scripts():
    rows = []
    for attempt in range(4, 8):
        directory = "runtime-attempt-" + str(attempt)
        report = read(directory + "/report.json")
        digest = sha((HERE / directory / "executed-wifi-runtime.test.mjs").read_bytes())
        assert digest == report["sourceHashes"]["test"]
        assert report["passed"] is (attempt >= 5)
        rows.append({"attempt": attempt, "scriptSha256": digest,
                     "matchesOriginalReport": True, "originalPassed": report["passed"]})
    return {"attempts": rows, "scope": "Synthetic bridge with manual RAF. Read-only AI policy prepares a real charged drift in attempts 5–7; this is not the screen-direction oracle."}


def main():
    assert not OUTPUT.exists(), "Preserve the existing audit rather than overwrite it"
    result = {"status": "running", "auditedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "targetCommit": TARGET, "auditScriptSha256": sha(Path(__file__).read_bytes()),
              "gameRerun": False, "productionFilesModified": False,
              "nativeMacCI": "Still running at audit request; not certified by this evidence-only preflight.",
              "checks": []}
    for name, check in [("old_zip_17_web_files", old_zip),
                        ("before_keyboard_reversed", lambda: directions("before-keyboard", True)),
                        ("after_keyboard_correct", lambda: directions("after-keyboard", False)),
                        ("after_production_assets_bound_to_commit", commit_binding),
                        ("before_synthetic_projection", synthetic_projection),
                        ("runtime_attempts_4_to_7_exact_scripts", runtime_scripts)]:
        try:
            result["checks"].append({"name": name, "status": "passed", "details": check()})
        except Exception:
            result["checks"].append({"name": name, "status": "failed", "error": traceback.format_exc()})
    result["status"] = "passed" if all(c["status"] == "passed" for c in result["checks"]) else "failed"
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"status": result["status"], "checks": len(result["checks"]), "output": str(OUTPUT)}))
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
