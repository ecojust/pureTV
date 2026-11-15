#!/usr/bin/env python3
"""Copy/check the shared browser adapter in the eleven standalone games."""
import argparse
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
base=Path(__file__).resolve().parent
apps=base.parents[1]/'apps'
slugs='alien-shooter used-car-racing cozy-island coast-kart super-mario bomb-jack adventure-island tetris jewel jackal tank'.split()
source=(base/'puretv-controller.js').read_bytes()
for slug in slugs:
 target=apps/slug/'src/main/assets/puretv-controller.js'
 if args.check:
  assert target.read_bytes()==source,slug+' adapter differs from canonical source'
 else:target.write_bytes(source)
print(('Checked' if args.check else 'Copied')+' shared adapter for '+str(len(slugs))+' games')
