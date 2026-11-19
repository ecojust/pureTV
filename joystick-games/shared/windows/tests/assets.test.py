#!/usr/bin/env python3
"""Nested Windows assets retain explicit policy limits and old defaults."""
import importlib.util,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('windows_build',ROOT/'joystick-games/tools/windows-build.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
class Assets(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.web=Path(self.tmp.name);(self.web/'tv.html').write_text('<html>')
        self.meta={'id':'sample','packageName':'com.ecojust.joystick.sample'};self.identity={'packageName':self.meta['packageName']}
    def tearDown(self):self.tmp.cleanup()
    def policy(self,**values):
        value={'schemaVersion':1,'maxAssetBytes':64,'maxTotalBytes':128,'maxApkBytes':128000000,**values};self.meta['assetPolicy']=value;self.identity['assetPolicy']=dict(value)
    def test_nested_tree_and_audio_require_explicit_policy(self):
        audio=self.web/'assets/audio';audio.mkdir(parents=True)
        for ext in ('opus','m4a'):(audio/('engine.'+ext)).write_bytes(b'audio')
        with self.assertRaisesRegex(AssertionError,'Unsupported distribution asset'):builder.verify_web_assets(self.web,self.meta,self.identity)
        self.policy();result=builder.verify_web_assets(self.web,self.meta,self.identity);self.assertEqual(result['files'],3);self.assertEqual(result['expectedAudioMimeTypes'],{'.opus':'audio/ogg','.m4a':'audio/mp4'})
    def test_per_file_and_total_limits(self):
        self.policy(maxAssetBytes=12,maxTotalBytes=20);(self.web/'nested').mkdir();asset=self.web/'nested/model.glb';asset.write_bytes(b'x'*13)
        with self.assertRaisesRegex(AssertionError,'Asset exceeds'):builder.verify_web_assets(self.web,self.meta,self.identity)
        asset.write_bytes(b'x'*12);(self.web/'extra.bin').write_bytes(b'x'*8)
        with self.assertRaisesRegex(AssertionError,'total budget'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_reserved_host_files_and_mismatched_policy_rejected(self):
        self.policy();(self.web/'bridge.js').write_text('wrong bridge')
        with self.assertRaisesRegex(AssertionError,'Reserved host asset'):builder.verify_web_assets(self.web,self.meta,self.identity)
        (self.web/'bridge.js').unlink();self.identity['assetPolicy']['maxTotalBytes']=127
        with self.assertRaisesRegex(AssertionError,'match exactly'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_cache_named_asset_directory_is_rejected_instead_of_unfrozen(self):
        (self.web/'node_modules').mkdir();(self.web/'node_modules/image.png').write_bytes(b'image')
        with self.assertRaisesRegex(AssertionError,'inside packaged assets'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_desktop_default_and_explicit_package_bound(self):
        self.assertEqual(builder.asset_policy.desktop_package_limit(self.meta,self.identity),100000000)
        self.policy();self.assertEqual(builder.asset_policy.desktop_package_limit(self.meta,self.identity),128000000)
        self.policy(maxApkBytes=128000001)
        with self.assertRaisesRegex(AssertionError,'Invalid assetPolicy'):builder.verify_web_assets(self.web,self.meta,self.identity)
if __name__=='__main__':unittest.main()
