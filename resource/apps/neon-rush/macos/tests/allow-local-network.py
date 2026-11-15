#!/usr/bin/env python3
"""Approve only Neon Rush's network prompt on a disposable GitHub macOS runner.

Never runs on a user's Mac. Preserve the prompt text and action in test evidence.
"""
import os
import subprocess
import sys
import time

if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('RUNNER_OS') != 'macOS':
    raise SystemExit('This test helper is restricted to disposable GitHub macOS runners')
script = r'''
tell application "System Events"
  repeat with proc in (every application process whose visible is true)
    if name of proc is "UserNotificationCenter" or name of proc is "SystemUIServer" or name of proc is "NeonRush" then
      try
        repeat with win in windows of proc
          set wording to ""
          set allowButton to missing value
          repeat with itemRef in (entire contents of win)
            try
              if role of itemRef is "AXStaticText" then set wording to wording & " " & value of itemRef
              if role of itemRef is "AXButton" and (name of itemRef is "Allow" or name of itemRef is "允许") then set allowButton to itemRef
            end try
          end repeat
          if (wording contains "Neon Rush" or wording contains "NeonRush" or wording contains "霓虹飞车") and (wording contains "local network" or wording contains "本地网络" or wording contains "incoming network" or wording contains "传入网络") and allowButton is not missing value then
            click allowButton
            return "Approved Neon Rush network prompt: " & wording
          end if
        end repeat
      end try
    end if
  end repeat
end tell
return "No matching Neon Rush network prompt"
'''
end = time.monotonic() + 100
last = None
while time.monotonic() < end:
    try:
        result = subprocess.run(['/usr/bin/osascript', '-e', script], capture_output=True, text=True, timeout=8)
        message = (result.stdout + result.stderr).strip()
        if message != last:
            print(message, flush=True)
            last = message
        if message.startswith('Approved Neon Rush network prompt:'):
            time.sleep(.5)
            if len(sys.argv) > 1:
                app = sys.argv[1].replace('\\', '\\\\').replace('"', '\\"')
                subprocess.run(['/usr/bin/osascript', '-e', 'tell application "' + app + '" to activate'], timeout=8)
    except subprocess.TimeoutExpired:
        print('Prompt inspection timed out', flush=True)
    time.sleep(.5)
