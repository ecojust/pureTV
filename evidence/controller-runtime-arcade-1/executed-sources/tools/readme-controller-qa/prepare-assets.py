#!/usr/bin/env python3
import argparse,importlib.util,json,shutil,zipfile,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--slug',required=True);p.add_argument('--apk',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
out=a.output.resolve();out.mkdir(parents=True,exist_ok=True);assert not list(out.iterdir()),'Use an empty output directory'
game=ROOT/'joystick-games'/a.slug
if a.apk:
 with zipfile.ZipFile(a.apk) as z:
  for n in z.namelist():
   if n.startswith('assets/') and not n.endswith('/'):
    target=out/n[7:];assert target.resolve().is_relative_to(out);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(n))
elif (game/'game.json').exists():
 spec=importlib.util.spec_from_file_location('game_kit_build',ROOT/'resource/game-kit/build.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 for name,data in module.payload(game).items():(out/name).write_bytes(data)
else:
 shutil.copytree(game/'src/main/assets',out,dirs_exist_ok=True)
 if a.slug=='jackal' and not (out/'art').exists():subprocess.run(['python3',str(game/'tools/extract-artwork.py'),'--output',str(out/'art')],check=True)
print(json.dumps({'slug':a.slug,'apk':str(a.apk) if a.apk else None,'output':str(out)}))
