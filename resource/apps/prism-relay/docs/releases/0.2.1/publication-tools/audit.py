#!/usr/bin/env python3
"""Read-only patch release audit. Requires completed signed, QA and visual evidence."""
import argparse,json,pathlib
from release_lib import config,audit_inputs,write_report
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=pathlib.Path,default=pathlib.Path(__file__).with_name('release-config.json'));p.add_argument('--game',required=True);p.add_argument('--browser',default='browser-01');p.add_argument('--shared',default='shared-01');p.add_argument('--recording',default='recording-01');p.add_argument('--artifacts',type=pathlib.Path,required=True);p.add_argument('--visual',type=pathlib.Path);p.add_argument('--output',type=pathlib.Path);a=p.parse_args();c=config(a.config,a.game);result,_=audit_inputs(c,a.browser,a.shared,a.recording,a.artifacts,a.visual)
if a.output:write_report(a.output,result,c['repo'])
print(json.dumps(result,ensure_ascii=False,indent=2))
