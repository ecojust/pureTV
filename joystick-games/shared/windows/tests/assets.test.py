#!/usr/bin/env python3
"""Nested Windows assets retain explicit policy limits and old defaults."""
import importlib.util,json,subprocess,sys,tempfile,unittest
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
        with self.assertRaisesRegex(AssertionError,'requires explicit assetPolicy'):builder.verify_web_assets(self.web,self.meta,self.identity)
        self.policy();result=builder.verify_web_assets(self.web,self.meta,self.identity);self.assertEqual(result['files'],3);self.assertEqual(result['expectedAudioMimeTypes'],{'.opus':'audio/ogg','.m4a':'audio/mp4'})
    def test_flat_audio_and_text_notices_still_require_policy(self):
        for name in ('sound.opus','sound.m4a','NOTICE','LICENSE','COPYING','THREE_LICENSE','README.md','manifest.webmanifest'):
            path=self.web/name;path.write_text('original upstream asset')
            with self.assertRaisesRegex(AssertionError,'Unsupported distribution asset'):builder.verify_web_assets(self.web,self.meta,self.identity)
            path.unlink()
        self.policy(maxTotalBytes=512)
        for name in ('NOTICE','LICENSE','COPYING','THREE_LICENSE','README.md','manifest.webmanifest'):(self.web/name).write_text('original license')
        self.assertEqual(builder.verify_web_assets(self.web,self.meta,self.identity)['files'],7)
    def test_copy_retains_module_worker_audio_paths_and_original_hashes(self):
        self.policy(maxAssetBytes=512,maxTotalBytes=2048)
        assets={'js/main.js':"import './worker/bridge.js';",'js/worker/bridge.js':"new Worker('./worker.js');",'js/worker/worker.js':'postMessage(1);','audio/engine.opus':'original audio','models/car.glb':'original model','vendor/LICENSE':'license'}
        for name,data in assets.items():
            path=self.web/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(data)
        with tempfile.TemporaryDirectory() as target:
            destination=Path(target)/'Web';record=builder.copy_web_assets(self.web,destination,self.meta,self.identity)
            self.assertEqual(record['assetFiles'],builder.inventory(destination));self.assertEqual(record['assetFiles'],builder.inventory(self.web))
            for name,data in assets.items():self.assertEqual((destination/name).read_text(),data)
    def test_relative_path_boundaries(self):
        for name in ('../secret','/absolute','a//b.js','a\\b.js','a%2fb.js','foo./a.js','CON','aux.txt','foo/LPT9.bin','a/'*16+'x.js','a'*1025):
            with self.subTest(name=name),self.assertRaises(AssertionError):builder.asset_relative_path(name)
        self.assertEqual(len(builder.asset_relative_path('a/'*15+'x.js')),16)
    def test_casefold_file_and_directory_collisions(self):
        self.policy();(self.web/'Foo').mkdir();(self.web/'Foo/a.js').write_text('a')
        (self.web/'foo').mkdir(exist_ok=True)
        if (self.web/'Foo').samefile(self.web/'foo'):self.skipTest('Filesystem itself prevents distinct case aliases')
        (self.web/'foo/b.js').write_text('b')
        with self.assertRaisesRegex(AssertionError,'collision'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_symlink_source_and_intermediate_directory_rejected(self):
        self.policy()
        with tempfile.TemporaryDirectory() as external:
            target=Path(external);(target/'image.png').write_bytes(b'external')
            try:(self.web/'assets').symlink_to(target,target_is_directory=True)
            except OSError:self.skipTest('Symlink creation unavailable')
            with self.assertRaisesRegex(AssertionError,'Symlink'):builder.verify_web_assets(self.web,self.meta,self.identity)
            with self.assertRaisesRegex(AssertionError,'symlinked'):builder.verify_web_assets(self.web/'assets',self.meta,self.identity)
    @unittest.skipUnless(sys.platform=='win32','Real NTFS junction check requires Windows')
    def test_windows_junction_cannot_escape_asset_root(self):
        self.policy()
        with tempfile.TemporaryDirectory() as external:
            junction=self.web/'assets'
            result=subprocess.run(['cmd','/c','mklink','/J',str(junction),external],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            try:
                self.assertTrue(junction.is_junction())
                with self.assertRaisesRegex(AssertionError,'Symlink'):builder.verify_web_assets(self.web,self.meta,self.identity)
            finally:junction.rmdir()
    def test_full_inventory_index_byte_budget(self):
        self.policy(maxAssetBytes=64,maxTotalBytes=100000)
        for i in range(400):(self.web/(str(i)+'a'*90+'.txt')).write_text('x')
        with self.assertRaisesRegex(AssertionError,'index byte budget'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_full_file_and_node_limits(self):
        self.policy(maxAssetBytes=64,maxTotalBytes=100000)
        for i in range(2048):(self.web/(str(i)+'.txt')).write_text('x')
        with self.assertRaisesRegex(AssertionError,'Too many distribution assets'):builder.verify_web_assets(self.web,self.meta,self.identity)
        for i in range(2048):(self.web/('directory'+str(i))).mkdir()
        with self.assertRaisesRegex(AssertionError,'files/directories'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_per_file_and_total_limits(self):
        self.policy(maxAssetBytes=12,maxTotalBytes=20);(self.web/'nested').mkdir();asset=self.web/'nested/model.glb';asset.write_bytes(b'x'*13)
        with self.assertRaisesRegex(AssertionError,'Asset exceeds'):builder.verify_web_assets(self.web,self.meta,self.identity)
        asset.write_bytes(b'x'*12);(self.web/'extra.bin').write_bytes(b'x'*8)
        with self.assertRaisesRegex(AssertionError,'total budget'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_reserved_host_files_and_mismatched_policy_rejected(self):
        self.policy()
        for name in ('bridge.js','bootstrap.js','Bootstrap.JS','diagnostics.js'):
            path=self.web/name;path.write_text('wrong host script')
            with self.subTest(name=name),self.assertRaisesRegex(AssertionError,'Reserved host asset'):builder.verify_web_assets(self.web,self.meta,self.identity)
            self.assertIn(name,builder.verify_web_assets(self.web,self.meta,self.identity,with_host=True)['assetFiles'])
            path.unlink()
        self.identity['assetPolicy']['maxTotalBytes']=127
        with self.assertRaisesRegex(AssertionError,'match exactly'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_cache_named_asset_directory_is_rejected_instead_of_unfrozen(self):
        (self.web/'node_modules').mkdir();(self.web/'node_modules/image.png').write_bytes(b'image')
        with self.assertRaisesRegex(AssertionError,'inside packaged assets'):builder.verify_web_assets(self.web,self.meta,self.identity)
    def test_explicit_storage_declarations_are_bounded_and_exact(self):
        self.meta['storageKeys']=['ghost_'+str(i) for i in range(65)]
        with self.assertRaisesRegex(AssertionError,'key count'):builder.storage_keys(self.meta,self.identity)
        self.policy();self.meta['storageKeys']=['ghost_'+str(i) for i in range(512)];self.assertEqual(len(builder.storage_keys(self.meta,self.identity)),512)
        self.meta['storageKeys'].append('ghost_512')
        with self.assertRaisesRegex(AssertionError,'key count'):builder.storage_keys(self.meta,self.identity)
        for keys in (['ghost_*'],['__proto__'],['same','same']):
            self.meta['storageKeys']=keys
            with self.assertRaises(AssertionError):builder.storage_keys(self.meta,self.identity)
    def test_desktop_default_and_explicit_package_bound(self):
        self.assertEqual(builder.asset_policy.desktop_package_limit(self.meta,self.identity),100000000)
        self.policy();self.assertEqual(builder.asset_policy.desktop_package_limit(self.meta,self.identity),128000000)
        self.policy(maxApkBytes=128000001)
        with self.assertRaisesRegex(AssertionError,'Invalid assetPolicy'):builder.verify_web_assets(self.web,self.meta,self.identity)
if __name__=='__main__':unittest.main()
