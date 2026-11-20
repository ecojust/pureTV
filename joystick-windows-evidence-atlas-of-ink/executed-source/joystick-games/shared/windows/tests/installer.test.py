#!/usr/bin/env python3
import importlib.util,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('windows_builder',ROOT/'joystick-games/tools/windows-build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class InstallerSafety(unittest.TestCase):
    def script(self):return builder.installer_text({'packageName':'com.ecojust.game','name':'Game "quoted" $name'},{'appName':'Game'},Path('C:/stage/game'),Path('C:/output/setup.exe'),{'PureTVGame.exe':{},'Web/tv.html':{},'Web/assets/music.ogg':{},'game.json':{}})
    def test_uninstall_deletes_only_known_files(self):
        source=self.script().split('Section "Uninstall"',1)[1]
        self.assertNotIn('RMDir /r',source)
        self.assertNotIn('Delete "$INSTDIR\\*',source)
        self.assertIn('Delete "$INSTDIR\\Web\\assets\\music.ogg"',source)
        self.assertIn('Delete "$INSTDIR\\PureTVGame.exe"',source)
        self.assertLess(source.index('RMDir "$INSTDIR\\Web\\assets"'),source.index('RMDir "$INSTDIR\\Web"'))
        self.assertNotIn('preferences',source)
    def test_registry_command_contains_literal_quoted_path(self):
        line=next(line for line in self.script().splitlines() if '"UninstallString"' in line)
        self.assertTrue(line.endswith(' "UninstallString" \'"$INSTDIR\\Uninstall.exe"\''),line)
    def test_app_title_cannot_expand_nsis_variables(self):
        self.assertIn('Name "Game $\\"quoted$\\" $$name"',self.script())
if __name__=='__main__':unittest.main()
