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
  if not (exists application process "UserNotificationCenter") then return "No notification process"
  tell application process "UserNotificationCenter"
    set observed to ""
    repeat with winRef in every window
      set win to contents of winRef
      set wording to ""
      set allowButton to missing value
      set nodes to entire contents of win
      repeat with nodeRef in nodes
        set node to contents of nodeRef
        try
          set wording to wording & " | " & (value of node as text)
        end try
        try
          set wording to wording & " | " & (name of node as text)
        end try
        try
          set wording to wording & " | " & (description of node as text)
        end try
        try
          if role of node is "AXButton" then
            if name of node is "Allow" or name of node is "允许" or description of node is "Allow" then set allowButton to node
          end if
        end try
      end repeat
      set observed to observed & wording
      if (wording contains "Neon Rush" or wording contains "NeonRush" or wording contains "霓虹飞车") and (wording contains "local network" or wording contains "本地网络" or wording contains "incoming network" or wording contains "传入网络") and allowButton is not missing value then
        click allowButton
        return "Approved Neon Rush network prompt: " & wording
      end if
    end repeat
    return "Observed notification: " & observed
  end tell
end tell
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
