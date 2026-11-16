#!/usr/bin/env python3
"""Test command adapter around the unchanged repository SDK; no replacement wire client."""
import json,sys,threading
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'puretv-joystick'))
from joystick_sdk import JoystickClient
client=JoystickClient('127.0.0.1',int(sys.argv[1]))
assert all(value=='--heartbeat' for value in sys.argv[2:]), 'Unknown SDK peer option'
stop=threading.Event()
def heartbeat():
 while not stop.wait(1):
  # Use the original SDK sender and lock; do not invent messages or ACKs.
  with client.lock:
   if client.sock is not None:
    try:client.ping()
    except (ConnectionError,OSError):pass
worker=None
if '--heartbeat' in sys.argv[2:]:
 worker=threading.Thread(target=heartbeat,daemon=True);worker.start()
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
stop.set()
if worker is not None:worker.join(2)
client.disconnect()
