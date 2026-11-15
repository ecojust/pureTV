#!/usr/bin/env python3
"""Materialize exactly the Game Kit APK payload for browser development."""
from pathlib import Path
import argparse,importlib.util,json
app=Path(__file__).resolve().parents[1]
kit=app.parents[1]/'game-kit'
spec=importlib.util.spec_from_file_location('game_kit_build',kit/'build.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);args=p.parse_args()
out=args.output.resolve()
if out.is_relative_to(app) or out.is_relative_to(kit):raise SystemExit('Output must be outside source directories')
out.mkdir(parents=True,exist_ok=True)
for name,data in module.payload(app).items():(out/name).write_bytes(data)
print(json.dumps({'directory':str(out),'entry':'tv.html','assets':len(module.payload(app))}))
