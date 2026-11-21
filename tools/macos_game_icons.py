"""Generate and verify a macOS application icon from a game's selected gameplay image."""

import hashlib
from pathlib import Path
import subprocess
import tempfile


def committed_inputs(game, root, commit):
    """Bind the actual artwork, crop settings and converters to the frozen source."""
    from game_icons import source_image

    paths = [source_image(game), root / "tools/game_icons.py", Path(__file__).resolve(),
             root / "tools/game-icon-sources.json", root / "tools/game-icon-crops.json"]
    inputs = {}
    for path in paths:
        name = path.relative_to(root).as_posix()
        frozen = subprocess.check_output(["git", "-C", str(root), "show", f"{commit}:{name}"])
        current = path.read_bytes() if path.is_file() else subprocess.check_output(
            ["git", "-C", str(root), "show", ":" + name]
        )
        if current != frozen:
            raise ValueError(f"Gameplay icon input differs from frozen source: {name}")
        inputs[name] = {"bytes": len(frozen), "sha256": hashlib.sha256(frozen).hexdigest()}
    return inputs


def write_icns(game, destination):
    from PIL import Image
    from game_icons import save_png, source_bytes

    destination = Path(destination)
    with tempfile.TemporaryDirectory() as scratch:
        png = Path(scratch) / "game.png"
        save_png(Path(game), png, 1024)
        with Image.open(png) as source:
            art = source.convert("RGBA")
        if art.size != (1024, 1024):
            raise ValueError(f"Expected 1024px square gameplay artwork for {game}")
        art.save(destination, format="ICNS")
        with Image.open(destination) as icon:
            sizes = {width * scale for width, height, scale in icon.info["sizes"] if width == height}
            if not {32, 128, 256, 512, 1024} <= sizes or icon.convert("RGBA").tobytes() != art.tobytes():
                raise ValueError(f"ICNS does not contain the expected gameplay image for {game}")
        return {
            "screenshotSha256": hashlib.sha256(source_bytes(Path(game))).hexdigest(),
            "pixels1024Sha256": hashlib.sha256(art.tobytes()).hexdigest(),
            "icnsSha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
        }
