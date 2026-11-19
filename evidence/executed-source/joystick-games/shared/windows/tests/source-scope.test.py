#!/usr/bin/env python3
"""Behavior tests for bounded source inventories, real local deps and omissions."""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('windows_inputs',ROOT/'joystick-games/tools/windows-inputs.py');scope=importlib.util.module_from_spec(spec);spec.loader.exec_module(scope)
class SourceScope(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.game=self.root/'joystick-games/sample';self.game.mkdir(parents=True)
        def put(name,text='source'):
            p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text);return p
        self.put=put
        for name in ('CMakeLists.txt','dependencies.json','README.md','.gitattributes','.gitignore'):put(scope.HOST+'/'+name)
        for name in ('Sources/main.cpp','Web/bridge.js','tests/protocol.test.cpp'):put(scope.HOST+'/'+name)
        for name in scope.TOOLS:put('joystick-games/tools/'+name)
        for name in (scope.WORKFLOW,'joystick-games/catalog-registry.json','puretv-joystick/joystick_sdk.py'):put(name)
        put('joystick-games/shared/web/input.js');put('joystick-games/shared/triptych/build.mjs')
        for name in scope.GAME_REQUIRED:put('joystick-games/sample/'+name,'{}' if name.endswith('.json') else 'source')
        put('joystick-games/sample/LICENSE');put('joystick-games/sample/src/nested/engine.js');put('joystick-games/sample/dist/tv.html');put('joystick-games/sample/dist/assets/track.glb')
    def tearDown(self):self.tmp.cleanup()
    def selection(self):return scope.select('sample',self.root)
    def package(self,path,manifest):
        self.put(path+'/package.json',json.dumps(manifest));self.put(path+'/index.js','local dependency')
    def test_production_derivation_qa_and_complete_set_changes(self):
        baseline=scope.file_records(self.selection())
        names=['joystick-games/sample/dist/assets/track.glb','joystick-games/sample/package-lock.json','joystick-games/shared/triptych/build.mjs','puretv-joystick/joystick_sdk.py','joystick-games/tools/windows-packages.py',scope.HOST+'/Sources/main.cpp',scope.WORKFLOW]
        for name in names:
            self.assertIn(name,baseline);p=self.root/name;old=p.read_bytes();p.write_bytes(old+b'\n');self.assertNotEqual(scope.file_records(self.selection()),baseline,name);p.write_bytes(old)
        new=self.put('joystick-games/sample/dist/assets/new.ogg');self.assertNotEqual(scope.file_records(self.selection()),baseline);new.unlink()
        removed=self.root/'joystick-games/sample/src/nested/engine.js';removed.unlink();self.assertNotEqual(scope.file_records(self.selection()),baseline)
    def test_tracked_deletions_cannot_shrink_initial_frozen_inventory(self):
        initial=self.selection();blobs={name:{} for name in initial['files']};scope.verify_complete_git_selection(initial,blobs)
        (self.game/'src/nested/engine.js').unlink()
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(self.selection(),blobs)
        self.put('joystick-games/sample/src/nested/engine.js');(self.root/'joystick-games/shared/triptych/build.mjs').unlink();(self.root/'joystick-games/shared/triptych').rmdir()
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(self.selection(),blobs)
    def test_packaged_assets_never_silently_skip_cache_names(self):
        asset=self.put('joystick-games/sample/dist/node_modules/actual-image.png','asset bytes')
        with self.assertRaisesRegex(AssertionError,'inside packaged assets'):self.selection()
        asset.unlink();asset.parent.rmdir();selection=self.selection();blobs={name:{} for name in selection['files']};blobs['joystick-games/sample/dist/node_modules/actual-image.png']={}
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(selection,blobs)
    def test_history_and_platform_siblings_excluded_but_asset_archives_kept(self):
        old=self.put(scope.HOST+'/docs/old/original-export/executed-source/docs/old.log','old original')
        self.put('joystick-games/sample/docs/report.json','old report');self.put('joystick-games/shared/macos/Sources/Host.swift','other host')
        asset=self.put('joystick-games/sample/assets/music.zip','actual source asset')
        name='Sample-0.1.0-macos-universal.zip';self.put('joystick-games/sample/'+name,'old binary')
        self.put('joystick-games/sample/macos-release.json',json.dumps({'game':'sample','packages':{name:{}}}))
        result=self.selection();self.assertNotIn(old.relative_to(self.root).as_posix(),result['files']);self.assertNotIn('joystick-games/sample/'+name,result['files']);self.assertIn(asset.relative_to(self.root).as_posix(),result['files']);self.assertEqual(old.read_text(),'old original')
        self.assertNotIn('joystick-games/shared/macos/Sources/Host.swift',result['files'])
    def test_release_descriptor_cannot_hide_build_script(self):
        self.put('joystick-games/sample/macos-release.json',json.dumps({'game':'sample','packages':{'build.mjs':{}}}))
        with self.assertRaisesRegex(AssertionError,'Unrecognized release output'):self.selection()
    def test_local_packages_recursive_cycle_and_original_lock(self):
        self.package('local/one',{'dependencies':{'two':'file:../two'}});self.package('local/two',{'dependencies':{'one':'file:../one'}})
        (self.game/'package.json').write_text(json.dumps({'dependencies':{'one':'file:../../local/one'}}))
        (self.game/'package-lock.json').write_text(json.dumps({'lockfileVersion':3,'packages':{'node_modules/one':{'link':True,'resolved':'../../local/one'}}}))
        result=self.selection();self.assertIn('local/one/index.js',result['files']);self.assertIn('local/two/index.js',result['files']);self.assertIn('joystick-games/sample/package-lock.json',result['files'])
        self.assertEqual(result['files']['local/one/index.js']['roles'],['local-dependency'])
    def test_local_archive_dependency_is_bound(self):
        self.put('vendor/dependency.tgz','original package bytes');(self.game/'package.json').write_text(json.dumps({'dependencies':{'dep':'file:../../vendor/dependency.tgz'}}))
        self.assertIn('vendor/dependency.tgz',self.selection()['files'])
    def test_missing_required_qa_or_workflow_is_fatal(self):
        for name in ('puretv-joystick/joystick_sdk.py',scope.WORKFLOW,'joystick-games/sample/package-lock.json'):
            p=self.root/name;data=p.read_bytes();p.unlink()
            with self.assertRaisesRegex(AssertionError,'Required source file missing'):self.selection()
            p.write_bytes(data)
    def test_unknown_root_and_unsupported_local_forms_fail(self):
        self.put('joystick-games/sample/unclassified/file.js')
        with self.assertRaisesRegex(AssertionError,'Unclassified game root'):self.selection()
        (self.game/'unclassified/file.js').unlink();(self.game/'unclassified').rmdir()
        (self.game/'package.json').write_text(json.dumps({'dependencies':{'dep':'workspace:*'}}))
        with self.assertRaisesRegex(AssertionError,'Unsupported local dependency'):self.selection()
        (self.game/'package.json').write_text(json.dumps({'dependencies':{'dep':'file:../../../../escape'}}))
        with self.assertRaisesRegex(AssertionError,'escapes repository'):self.selection()
    def test_symlink_ancestor_rejected_installed_dependency_ignored(self):
        try:(self.game/'src/link').symlink_to(self.root/'joystick-games/shared/web',target_is_directory=True)
        except OSError:self.skipTest('Symlink creation unavailable for current Windows user')
        with self.assertRaisesRegex(AssertionError,'Symlink'):self.selection()
        (self.game/'src/link').unlink();(self.game/'node_modules').symlink_to(self.root/'not-committed',target_is_directory=True)
        self.assertIn('joystick-games/sample/node_modules',self.selection()['excluded'])
    def test_evidence_execution_graph_complete_without_historical_recursion(self):
        self.put(scope.HOST+'/docs/attempt/report.json','history');selection=self.selection();executed=scope.executed_sources(selection)
        for name in scope.TOOLS:self.assertIn('joystick-games/tools/'+name,executed)
        for name in (scope.WORKFLOW,'puretv-joystick/joystick_sdk.py','joystick-games/sample/qa-plan.json','joystick-games/sample/build.mjs'):self.assertIn(name,executed)
        self.assertFalse(any('/docs/' in name for name in executed));self.assertIn('joystick-games/sample/dist/assets/track.glb',selection['files'])
if __name__=='__main__':unittest.main()
