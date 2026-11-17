import sys,importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('builder',Path(sys.argv[1])/'resource/game-kit/build.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
game=Path(sys.argv[1])/'resource/apps'/sys.argv[2];out=Path(sys.argv[3]);out.mkdir(parents=True)
for name,data in m.payload(game).items():(out/name).write_bytes(data)
