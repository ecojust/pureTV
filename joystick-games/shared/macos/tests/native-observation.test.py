#!/usr/bin/env python3
"""Reject stale native diagnostics even if their cached values look correct."""
import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('macverify',Path(__file__).resolve().parents[3]/'tools/macos-verify.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Observation(unittest.TestCase):
 def test_a_new_diagnostic_is_not_a_new_game_frame(self):
  check=object.__new__(module.Check)
  before={'timestamp':10,'game':{'controller':{'pollCount':40}}}
  same_frame={'timestamp':11,'game':{'controller':{'pollCount':40}}}
  stale_file={'timestamp':10,'game':{'controller':{'pollCount':41}}}
  consumed={'timestamp':11,'game':{'controller':{'pollCount':41}}}
  self.assertFalse(check.fresh(same_frame,before,True));self.assertFalse(check.fresh(stale_file,before,True));self.assertTrue(check.fresh(consumed,before,True))
  # Background native transport checks remain meaningful while RAF is stopped.
  self.assertTrue(check.fresh(same_frame,before,False))
if __name__=='__main__':unittest.main()
