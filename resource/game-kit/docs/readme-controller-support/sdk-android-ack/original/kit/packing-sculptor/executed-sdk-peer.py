#!/usr/bin/env python3
"""Test command adapter around the unchanged repository SDK; no replacement wire client."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'puretv-joystick'))
from joystick_sdk import JoystickClient
client=JoystickClient('127.0.0.1',int(sys.argv[1]))
for line in sys.stdin:
 try:
  row=json.loads(line);action=row['command']
  if action=='connect':client.connect()
  elif action=='disconnect':client.disconnect()
  elif action=='ping':client.ping()
  elif action=='button':client.button(row['key'],row['action'],row.get('duration',0))
  elif action=='held-sync':client.send('button',key=row['key'],action='sync',pressed=True,duration_ms=0)
  else:raise ValueError('Unknown test command')
  print(json.dumps({'ok':True,'identity':client.identity}),flush=True)
 except Exception as e:print(json.dumps({'ok':False,'error':str(e)}),flush=True)
client.disconnect()
