"""Release-boundary regressions: tampered assets and incompatible upgrades fail."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
spec=importlib.util.spec_from_file_location('controller_release',ROOT/'tools/controller-release.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)

class Boundaries(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='controller-release-test-')
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        self.slug='tetris'
        self.game=self.root/'resource/apps'/self.slug
        assets=self.game/'src/main/assets';assets.mkdir(parents=True)
        (assets/'runtime.js').write_bytes(b'fixed runtime')
        (assets/'tv.html').write_bytes(b'<html>fixed</html>')
        (self.game/'build.gradle').write_text("applicationId 'com.ecojust.tetristv'\nversionName '0.5.3'\nversionCode 5\n")
        (self.game/'resource.json').write_text(json.dumps({'apk':'tetris-0.5.2.apk','certificateSha256':'c'*64}))
        self.old={'packageName':'com.ecojust.tetristv','versionName':'0.5.2','versionCode':4,'certificateSha256':'c'*64,'sha256':'1'*64,'bytes':123}
        (self.game/'resource.json').write_text(json.dumps({'apk':'tetris-0.5.2.apk','packageName':self.old['packageName'],'version':self.old['versionName'],'versionCode':self.old['versionCode'],'sha256':self.old['sha256'],'apkBytes':self.old['bytes'],'certificateSha256':self.old['certificateSha256']}))
        self.new={'packageName':'com.ecojust.tetristv','versionName':'0.5.3','versionCode':5}
        self.root_patch=patch.object(release,'ROOT',self.root);self.root_patch.start();self.addCleanup(self.root_patch.stop)
    def apk(self, changes=None):
        files={'assets/runtime.js':b'fixed runtime','assets/tv.html':b'<html>fixed</html>'}
        files.update(changes or {})
        p=self.root/'test.apk'
        with zipfile.ZipFile(p,'w') as z:
            for name,data in files.items():z.writestr(name,data)
        return p
    def test_incorrect_published_hash_is_rejected(self):
        resource=json.loads((self.game/'resource.json').read_text());resource['sha256']='f'*64
        (self.game/'resource.json').write_text(json.dumps(resource))
        with patch.object(release,'info',return_value=self.old),self.assertRaisesRegex(AssertionError,'metadata differs'):
            release.upgrade(self.slug,self.new,Path('/unused'))
    def test_exact_assets_are_accepted(self):
        self.assertEqual(set(release.assets(self.apk(),self.slug)),{'runtime.js','tv.html'})
    def test_tampered_runtime_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'differ from source'):
            release.assets(self.apk({'assets/runtime.js':b'replaced'}),self.slug)
    def test_unexpected_asset_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'Unexpected APK asset'):
            release.assets(self.apk({'assets/injected.js':b'bad'}),self.slug)
    def test_zip_path_traversal_is_rejected(self):
        with self.assertRaises(AssertionError):
            release.assets(self.apk({'assets/../injected.js':b'bad'}),self.slug)
    def upgrade(self,candidate=None,old=None,pin=None):
        prior=old or self.old
        (self.game/'resource.json').write_text(json.dumps({'apk':'tetris-0.5.2.apk','packageName':prior['packageName'],'version':prior['versionName'],'versionCode':prior['versionCode'],'sha256':prior['sha256'],'apkBytes':prior['bytes'],'certificateSha256':prior['certificateSha256']}))
        with patch.object(release,'info',return_value=old or self.old),patch.object(release,'expected_release_certificate',return_value=pin or 'c'*64):
            return release.upgrade(self.slug,candidate or self.new,Path('/unused'))
    def test_matching_certificate_and_increment_are_accepted(self):
        self.assertEqual(self.upgrade(),self.old)
    def test_equal_version_code_is_rejected(self):
        with self.assertRaises(AssertionError):self.upgrade(old={**self.old,'versionCode':5})
    def test_wrong_package_is_rejected(self):
        with self.assertRaises(AssertionError):self.upgrade(old={**self.old,'packageName':'com.ecojust.other'})
    def test_wrong_existing_certificate_is_rejected(self):
        with self.assertRaises(AssertionError):self.upgrade(old={**self.old,'certificateSha256':'b'*64})
    def test_wrong_release_key_pin_is_rejected(self):
        with self.assertRaises(AssertionError):self.upgrade(pin='a'*64)
    def test_mismatched_candidate_identity_is_rejected(self):
        with self.assertRaises(AssertionError):self.upgrade(candidate={**self.new,'versionName':'9.9.9'})

if __name__=='__main__':unittest.main()
