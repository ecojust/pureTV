#!/usr/bin/env python3
"""Approve the game's and its test bridge's observed network prompts on a CI Mac.

Never runs on a user's Mac. Preserve the prompt text and action in test evidence.
"""
import json
import os
import plistlib
import subprocess
import sys
import time
from pathlib import Path


def app_names(app):
    """Use only identities from the installed app already checked by package QA."""
    info = plistlib.loads((Path(app) / 'Contents/Info.plist').read_bytes())
    names = [info[key] for key in ['CFBundleName', 'CFBundleDisplayName'] if info.get(key)]
    assert names and all(isinstance(name, str) and name == name.strip() and 0 < len(name) <= 120
                         and not any(ord(char) < 32 for char in name) for name in names)
    return list(dict.fromkeys(names))


def prompt_matches(wording, names):
    """The same exact quoted-name/network predicate used by the AX observer."""
    text = wording.casefold()
    network = any(term in text for term in ['local network', '本地网络', 'incoming network', '传入网络'])
    quoted = [left + name + right for name in [*names, 'Python']
              for left, right in [('“', '”'), ('"', '"'), ('「', '」'), ('『', '』')]]
    return network and any(value.casefold() in text for value in quoted)


SCRIPT = r'''
on run targetNames
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
      set targetMatched to false
      repeat with nameRef in targetNames
        set targetName to contents of nameRef
        if wording contains ("“" & targetName & "”") or wording contains (quote & targetName & quote) or wording contains ("「" & targetName & "」") or wording contains ("『" & targetName & "』") then set targetMatched to true
      end repeat
      if targetMatched and (wording contains "local network" or wording contains "本地网络" or wording contains "incoming network" or wording contains "传入网络") and allowButton is not missing value then
        click allowButton
        return "Approved test network prompt: " & wording
      end if
    end repeat
    return "Observed notification: " & observed
  end tell
end tell
end run
'''


def main():
    if os.environ.get('GITHUB_ACTIONS') != 'true' or os.environ.get('RUNNER_OS') != 'macOS':
        raise SystemExit('This test helper is restricted to disposable GitHub macOS runners')
    assert len(sys.argv) == 2, 'The exact installed app path is required'
    app = Path(sys.argv[1]).resolve()
    names = app_names(app)
    print(json.dumps({'installedApp': str(app), 'exactAppNames': names,
                      'additionalNetworkPromptName': 'Python', 'scope': 'Disposable GitHub runner network prompts only'}), flush=True)
    end = time.monotonic() + 100
    last = None
    while time.monotonic() < end:
        try:
            # Names are arguments, never interpolated executable AppleScript.
            result = subprocess.run(['/usr/bin/osascript', '-e', SCRIPT, '--', *names, 'Python'], capture_output=True, text=True, timeout=8)
            message = (result.stdout + result.stderr).strip()
            if message != last:
                print(message, flush=True)
                last = message
            if message.startswith('Approved test network prompt:'):
                time.sleep(.5)
                activate = 'on run argv\ntell application (item 1 of argv) to activate\nend run'
                subprocess.run(['/usr/bin/osascript', '-e', activate, '--', str(app)], timeout=8)
        except subprocess.TimeoutExpired:
            print('Prompt inspection timed out', flush=True)
        time.sleep(.5)


if __name__ == '__main__':
    main()
