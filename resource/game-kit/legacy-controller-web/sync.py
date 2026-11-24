#!/usr/bin/env python3
"""Copy/check the shared adapter and identity display in Game Kit and the standalone legacy games."""
import argparse
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
base=Path(__file__).resolve().parent
games=base.parents[2]/'joystick-games'
slugs='alien-shooter used-car-racing super-mario tetris jewel jackal tank'.split()
source=(base/'puretv-controller.js').read_bytes()
targets=[('Game Kit web',base.parent/'web/puretv-controller.js')]+[(slug,games/slug/'src/main/assets/puretv-controller.js') for slug in slugs]
for slug,target in targets:
 if args.check:
  assert target.read_bytes()==source,slug+' adapter differs from canonical source'
 else:target.write_bytes(source)
print(('Checked' if args.check else 'Copied')+' shared adapter for Game Kit web and '+str(len(slugs))+' games')
