#!/usr/bin/env python3
"""Ensure a build cannot label mutable/symlinked input as committed source."""
import hashlib,importlib.util,subprocess,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('macbuild',Path(__file__).resolve().parents[3]/'tools/macos-build.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class SourceBoundary(unittest.TestCase):
 def test_committed_then_changed_and_symlink(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory).resolve();subprocess.run(['git','init','-q',str(root)],check=True)
   for key,value in [('user.name','test'),('user.email','test@example.invalid')]:subprocess.run(['git','-C',str(root),'config',key,value],check=True)
   source=root/'game.js';source.write_text('const game=1;\n');subprocess.run(['git','-C',str(root),'add','.'],check=True);subprocess.run(['git','-C',str(root),'commit','-qm','fixture'],check=True)
   commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip();items={'game.js':m.regular_input(source)};m.verify_committed(root,items,commit)
   source.write_text('const game=2;\n')
   with self.assertRaises(AssertionError):m.verify_committed(root,items,commit)
   # Even updating the manifest to current dirty bytes may not call them frozen.
   with self.assertRaises(AssertionError):m.verify_committed(root,{'game.js':m.regular_input(source)},commit)
   link=root/'alias.js';link.symlink_to(source)
   with self.assertRaises(AssertionError):m.regular_input(link)
if __name__=='__main__':unittest.main()
