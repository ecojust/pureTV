#!/usr/bin/env python3
"""Behavior tests for bounded source inventories, real local deps and omissions."""
import copy,hashlib,importlib.util,io,json,struct,tempfile,unittest,zipfile
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
    def release_fixture(self,platform='macos',nested=True):
        # Small structural containers exercise source selection, not real package
        # execution, signing, gameplay, or platform installation.
        pe=bytearray(70);pe[:2]=b'MZ';struct.pack_into('<I',pe,60,64);pe[64:68]=b'PE\0\0'
        archive=io.BytesIO()
        with zipfile.ZipFile(archive,'w') as z:
            if platform=='macos':
                z.writestr('Sample.app/Contents/Info.plist',b'plist fixture');z.writestr('Sample.app/Contents/MacOS/Sample',b'\xca\xfe\xba\xbe'+b'fixture')
            elif platform=='android':z.writestr('AndroidManifest.xml',b'manifest fixture');z.writestr('classes.dex',b'dex\n035\0fixture')
            else:z.writestr('Sample/PureTVGame.exe',pe)
        basename='sample.apk' if platform=='android' else 'Sample-0.1.0-'+('macos-universal.zip' if platform=='macos' else 'windows-x64.zip')
        name=(platform+'/' if nested else '')+basename;data=archive.getvalue();target=self.game/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        row={'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()};meta={'schemaVersion':1,'game':'sample',platform:row if platform=='android' else {'files':[row]}}
        self.put('joystick-games/sample/packages.json',json.dumps(meta));return target,meta,row
    def test_exact_published_packages_are_excluded_but_metadata_is_bound(self):
        target,meta,row=self.release_fixture();sums=target.parent/'SHA256SUMS.txt';sums.write_text(row['sha256']+'  '+target.name+'\n')
        result=self.selection();name=target.relative_to(self.root).as_posix();self.assertNotIn(name,result['files']);self.assertIn(name,result['excluded'])
        for name in ['joystick-games/sample/packages.json','joystick-games/sample/macos/SHA256SUMS.txt']:self.assertIn('scope-configuration',result['files'][name]['roles'])
        git_files={name:{} for name in result['files']};git_files.update({name:{} for name in result['excluded']});scope.verify_complete_git_selection(result,git_files)
        sums.write_text('0'*64+'  '+target.name+'\n')
        with self.assertRaisesRegex(AssertionError,'checksum list differs'):self.selection()
    def test_declared_android_and_windows_structural_packages(self):
        for platform in ['android','windows']:
            with self.subTest(platform=platform):
                target,meta,row=self.release_fixture(platform,nested=False);result=self.selection();self.assertIn(target.relative_to(self.root).as_posix(),result['excluded']);target.unlink()
    def test_versioned_repo_apk_is_not_a_windows_build_input(self):
        target, _, _ = self.release_fixture('android', nested=False)
        (self.game/'packages.json').unlink()
        target = target.rename(self.game/'sample-0.2.1.apk')
        result = self.selection()
        name = target.relative_to(self.root).as_posix()
        self.assertIn(name, result['excluded'])
        self.assertNotIn(name, result['files'])
        target.write_text('invalid payload')
        with self.assertRaisesRegex(AssertionError, 'Invalid published archive'):
            self.selection()

    def test_android_index_verifies_local_game_root_apk(self):
        target,meta,row=self.release_fixture('android',nested=False)
        self.put('joystick-games/sample/android-release.json',json.dumps({'game':'sample','file':target.name}))
        index=self.put('joystick-games/sample/android/SHA256SUMS.txt',row['sha256']+'  '+target.name+'\n')
        result=self.selection()
        self.assertIn(target.relative_to(self.root).as_posix(),result['excluded'])
        self.assertIn('scope-configuration',result['files'][index.relative_to(self.root).as_posix()]['roles'])
        index.write_text('0'*64+'  '+target.name+'\n')
        with self.assertRaisesRegex(AssertionError,'checksum list differs'):self.selection()
    def test_new_release_metadata_does_not_hide_undeclared_source_in_directory(self):
        target,meta,row=self.release_fixture();extra=self.put('joystick-games/sample/macos/build.mjs','real derivation source')
        with self.assertRaisesRegex(AssertionError,'Undeclared file'):self.selection()
        extra.unlink();extra=self.put('joystick-games/sample/macos/assets/data.js')
        with self.assertRaisesRegex(AssertionError,'Unexpected node'):self.selection()
    def test_missing_changed_and_wrong_size_package_fails_before_exclusion(self):
        target,meta,row=self.release_fixture();original=target.read_bytes()
        target.unlink()
        with self.assertRaisesRegex(AssertionError,'Missing or symlinked'):self.selection()
        target.write_bytes(original+b'changed')
        with self.assertRaisesRegex(AssertionError,'size mismatch'):self.selection()
        target.write_bytes(b'X'+original[1:])
        with self.assertRaisesRegex(AssertionError,'hash mismatch'):self.selection()
    def test_declaration_cannot_hide_source_or_cross_platform_paths(self):
        target,meta,row=self.release_fixture();path=self.game/'packages.json'
        for name in ['build.mjs','macos/build.mjs','src/Sample-macos-universal.zip','windows/Sample-macos-universal.zip','../Sample-macos-universal.zip','/Sample-macos-universal.zip','macos/nested/Sample-macos-universal.zip','macos\\Sample-macos-universal.zip','macos/Sample-windows-x64.zip']:
            changed=copy.deepcopy(meta);changed['macos']['files'][0]['file']=name;path.write_text(json.dumps(changed))
            with self.subTest(name=name),self.assertRaises(AssertionError):self.selection()
    def test_source_disguised_with_release_suffix_and_matching_hash_is_rejected(self):
        target,meta,row=self.release_fixture();data=b'export function build(){return 1;}';target.write_bytes(data);row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest());(self.game/'packages.json').write_text(json.dumps(meta))
        with self.assertRaisesRegex(AssertionError,'Invalid published archive'):self.selection()
        buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w') as z:z.writestr('build.mjs',data)
        data=buffer.getvalue();target.write_bytes(data);row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest());(self.game/'packages.json').write_text(json.dumps(meta))
        with self.assertRaisesRegex(AssertionError,'lacks app payload'):self.selection()
    def test_new_descriptor_identity_duplicates_and_pending_output_are_rejected(self):
        target,meta,row=self.release_fixture();path=self.game/'packages.json'
        for mutate in [lambda d:d.update(game='other'),lambda d:d.update(schemaVersion=True),lambda d:d['macos'].update(status='pending'),lambda d:d['macos']['files'].append(copy.deepcopy(row))]:
            changed=copy.deepcopy(meta);mutate(changed);path.write_text(json.dumps(changed))
            with self.assertRaises(AssertionError):self.selection()
        path.write_text('{"schemaVersion":1,"game":"sample","game":"sample"}')
        with self.assertRaisesRegex(AssertionError,'Duplicate'):self.selection()
    def test_new_package_hash_record_requires_exact_positive_size_and_sha(self):
        target,meta,row=self.release_fixture();path=self.game/'packages.json'
        for update in [{'bytes':True},{'bytes':0},{'bytes':str(row['bytes'])},{'sha256':'A'*64},{'sha256':'bad'}]:
            changed=copy.deepcopy(meta);changed['macos']['files'][0].update(update);path.write_text(json.dumps(changed))
            with self.assertRaisesRegex(AssertionError,'Invalid published package size/hash'):self.selection()
    def test_published_package_symlink_cannot_escape_scope(self):
        target,meta,row=self.release_fixture();data=target.read_bytes();target.unlink();outside=self.put('outside.zip','unused');outside.write_bytes(data)
        try:target.symlink_to(outside)
        except OSError:self.skipTest('Symlink creation unavailable')
        with self.assertRaisesRegex(AssertionError,'symlinked published'):self.selection()
    def test_checksum_list_cannot_hide_missing_extra_or_duplicate_members(self):
        target,meta,row=self.release_fixture();sums=target.parent/'SHA256SUMS.txt'
        for text in ['',row['sha256']+'  missing.zip\n',(row['sha256']+'  '+target.name+'\n')*2]:
            sums.write_text(text)
            with self.assertRaises(AssertionError):self.selection()
    def test_matching_hash_does_not_make_text_an_exe_or_dmg(self):
        for platform,name in [('windows','Sample-windows-x64-setup.exe'),('macos','Sample-macos-universal.dmg')]:
            data=b'export function build() {}'+b' '*600;target=self.game/name;target.write_bytes(data)
            row={'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            (self.game/'packages.json').write_text(json.dumps({'schemaVersion':1,'game':'sample',platform:{'files':[row]}}))
            with self.subTest(platform=platform),self.assertRaises(AssertionError):self.selection()
            target.unlink()
    def test_archive_traversal_is_rejected_even_with_matching_declared_hash(self):
        target,meta,row=self.release_fixture();buffer=io.BytesIO()
        with zipfile.ZipFile(buffer,'w') as z:z.writestr('../build.mjs','source')
        data=buffer.getvalue();target.write_bytes(data);row.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest());(self.game/'packages.json').write_text(json.dumps(meta))
        with self.assertRaisesRegex(AssertionError,'Unsafe published archive path'):self.selection()
    def test_pending_platform_cannot_hide_an_unclassified_macos_directory(self):
        self.put('joystick-games/sample/packages.json',json.dumps({'schemaVersion':1,'game':'sample','macos':{'status':'pending'}}));self.put('joystick-games/sample/macos/engine.js','source')
        with self.assertRaisesRegex(AssertionError,'Unclassified game root directory'):self.selection()
    def test_deleted_tracked_source_cannot_be_masked_by_valid_mac_release(self):
        target,meta,row=self.release_fixture();initial=self.selection();blobs={name:{} for name in initial['files']};blobs[target.relative_to(self.root).as_posix()]={}
        (self.game/'src/nested/engine.js').unlink()
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(self.selection(),blobs)
    def remote_mac_fixture(self):
        name='Sample-0.1.0-macos-universal.zip';tag='joystick-sample-v0.1.0'
        row={'file':name,'storage':'github-release-asset','url':'https://github.com/ecojust/pureTV/releases/download/'+tag+'/'+name,'assetId':123,'bytes':105275042,'sha256':'a'*64}
        meta={'schemaVersion':1,'game':'sample','macos':{'version':'0.1.0','releaseTag':tag,'releaseId':456,'files':[row]}}
        self.put('joystick-games/sample/packages.json',json.dumps(meta));return meta,row
    def test_remote_mac_metadata_never_excludes_a_source_path(self):
        meta,row=self.remote_mac_fixture();result=self.selection();name='joystick-games/sample/'+row['file']
        self.assertNotIn(name,result['files']);self.assertNotIn(name,result['excluded'])
        self.assertIn('joystick-games/sample/packages.json',result['files']);self.assertIn('joystick-games/sample/dist/assets/track.glb',result['files'])
        blobs={name:{} for name in result['files']};scope.verify_complete_git_selection(result,blobs)
        # Even a tracked filename matching the remote artifact must remain an
        # input omission; the declaration cannot hide a checkout deletion.
        blobs[name]={}
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(result,blobs)
    def test_remote_mac_cannot_mask_an_existing_file_directory_or_link(self):
        meta,row=self.remote_mac_fixture();target=self.game/row['file'];target.write_bytes(b'actual source bytes')
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
        target.unlink();target.mkdir()
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
        target.rmdir()
        try:target.symlink_to(self.root/'missing')
        except OSError:return
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
    def test_remote_mac_requires_exact_repo_tag_version_and_asset_identity(self):
        meta,row=self.remote_mac_fixture();path=self.game/'packages.json'
        mutations=[lambda d:d['macos'].update(version='0.1.0/evil'),lambda d:d['macos'].update(releaseTag='other'),lambda d:d['macos'].update(releaseId=True),lambda d:d['macos'].update(releaseId=0),lambda d:d['macos']['files'][0].update(assetId='123'),lambda d:d['macos']['files'][0].update(assetId=2**63),lambda d:d['macos']['files'][0].update(storage='external'),lambda d:d['macos']['files'][0].pop('assetId')]
        for mutate in mutations:
            changed=copy.deepcopy(meta);mutate(changed);path.write_text(json.dumps(changed))
            with self.subTest(meta=changed),self.assertRaises(AssertionError):self.selection()
        for url in ['http://github.com/ecojust/pureTV/releases/download/'+meta['macos']['releaseTag']+'/'+row['file'],row['url'].replace('ecojust/pureTV','someone/pureTV'),row['url']+'?redirect=1',row['url']+'#fragment',row['url'].replace(row['file'],'../'+row['file']),row['url'].replace('github.com','github.com.evil.invalid')]:
            changed=copy.deepcopy(meta);changed['macos']['files'][0]['url']=url;path.write_text(json.dumps(changed))
            with self.subTest(url=url),self.assertRaisesRegex(AssertionError,'URL differs'):self.selection()
    def test_remote_mac_retains_original_path_size_hash_and_alias_guards(self):
        meta,row=self.remote_mac_fixture();path=self.game/'packages.json'
        for update in [{'file':'build.mjs'},{'file':'src/'+row['file']},{'file':'macos/'+row['file']},{'file':'../'+row['file']},{'bytes':True},{'bytes':0},{'sha256':'A'*64},{'sha256':'bad'}]:
            changed=copy.deepcopy(meta);changed['macos']['files'][0].update(update);path.write_text(json.dumps(changed))
            with self.subTest(update=update),self.assertRaises(AssertionError):self.selection()
        changed=copy.deepcopy(meta);changed['macos']['files'].append(copy.deepcopy(row));path.write_text(json.dumps(changed))
        with self.assertRaisesRegex(AssertionError,'Duplicate'):self.selection()
    def test_remote_mac_does_not_relax_local_package_or_production_inputs(self):
        target,local_meta,local_row=self.release_fixture();meta,row=self.remote_mac_fixture();old=row['file'];row['file']='Remote-'+old;row['url']=row['url'].replace(old,row['file']);meta['macos']['files'].append(local_row);(self.game/'packages.json').write_text(json.dumps(meta))
        (target.parent/'SHA256SUMS.txt').write_text(''.join(r['sha256']+'  '+Path(r['file']).name+'\n' for r in [row,local_row]))
        original=target.read_bytes();selected=self.selection();self.assertIn(target.relative_to(self.root).as_posix(),selected['excluded'])
        target.write_bytes(original+b'changed')
        with self.assertRaisesRegex(AssertionError,'size mismatch'):self.selection()
        target.write_bytes(original);blobs={name:{} for name in selected['files']};(self.game/'src/nested/engine.js').unlink()
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(self.selection(),blobs)
    def test_remote_mac_index_keeps_readme_and_checksums_as_exact_inputs(self):
        meta,row=self.remote_mac_fixture();readme=self.put('joystick-games/sample/macos/README.md','Original release download links');sums=self.put('joystick-games/sample/macos/SHA256SUMS.txt',row['sha256']+'  '+row['file']+'\n')
        result=self.selection()
        for path in (readme,sums):self.assertIn('scope-configuration',result['files'][path.relative_to(self.root).as_posix()]['roles'])
        readme.write_text('Changed actual delivery instructions');self.assertNotEqual(scope.file_records(result),scope.file_records(self.selection()))
        extra=self.put('joystick-games/sample/macos/build.mjs','Must never disappear from production closure')
        with self.assertRaisesRegex(AssertionError,'Undeclared file'):self.selection()
        extra.unlink();sums.write_text('0'*64+'  '+row['file']+'\n')
        with self.assertRaisesRegex(AssertionError,'checksum list differs'):self.selection()
        sums.unlink()
        with self.assertRaisesRegex(AssertionError,'requires exact checksum'):self.selection()
    def test_remote_mac_index_rejects_local_binary_and_ambiguous_name(self):
        target,local_meta,local_row=self.release_fixture();meta,row=self.remote_mac_fixture();meta['macos']['files'].append(local_row);(self.game/'packages.json').write_text(json.dumps(meta))
        with self.assertRaisesRegex(AssertionError,'Ambiguous local and remote'):self.selection()
        meta['macos']['files'].pop();(self.game/'packages.json').write_text(json.dumps(meta));(target.parent/'SHA256SUMS.txt').write_text(row['sha256']+'  '+row['file']+'\n')
        with self.assertRaisesRegex(AssertionError,'Undeclared file'):self.selection()
    def remote_android_fixture(self):
        name='sample-0.1.0.apk';tag='joystick-sample-v0.1.0'
        row={'version':'0.1.0','file':name,'storage':'github-release-asset','url':'https://github.com/ecojust/pureTV/releases/download/'+tag+'/'+name,'releaseTag':tag,'releaseId':456,'assetId':123,'bytes':105024551,'sha256':'b'*64}
        meta={'schemaVersion':1,'game':'sample','android':row};self.put('joystick-games/sample/packages.json',json.dumps(meta));return meta,row
    def test_remote_android_keeps_exact_index_and_cannot_hide_missing_input(self):
        meta,row=self.remote_android_fixture();readme=self.put('joystick-games/sample/android/README.md','Original APK download');sums=self.put('joystick-games/sample/android/SHA256SUMS.txt',row['sha256']+'  '+row['file']+'\n')
        result=self.selection();name='joystick-games/sample/'+row['file'];self.assertNotIn(name,result['excluded']);self.assertNotIn(name,result['files'])
        for path in (readme,sums):self.assertIn('scope-configuration',result['files'][path.relative_to(self.root).as_posix()]['roles'])
        blobs={name:{} for name in result['files']};scope.verify_complete_git_selection(result,blobs);blobs[name]={}
        with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(result,blobs)
        sums.write_text('0'*64+'  '+row['file']+'\n')
        with self.assertRaisesRegex(AssertionError,'checksum list differs'):self.selection()
    def test_remote_android_exact_identity_and_local_conflicts_remain_rejected(self):
        meta,row=self.remote_android_fixture();path=self.game/'packages.json'
        for update in [{'releaseTag':'other'},{'releaseId':True},{'assetId':0},{'version':'../0.1.0'},{'url':row['url']+'?other=1'},{'storage':'external'},{'file':'android/'+row['file']},{'file':'build.mjs'},{'bytes':0},{'sha256':'B'*64}]:
            changed=copy.deepcopy(meta);changed['android'].update(update);path.write_text(json.dumps(changed))
            with self.subTest(update=update),self.assertRaises(AssertionError):self.selection()
        path.write_text(json.dumps(meta));target=self.game/row['file'];target.write_text('local source')
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
        target.unlink();target.mkdir()
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
        target.rmdir()
        try:target.symlink_to(self.root/'missing')
        except OSError:return
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
    def test_remote_android_does_not_exempt_undeclared_index_source(self):
        meta,row=self.remote_android_fixture();self.put('joystick-games/sample/android/SHA256SUMS.txt',row['sha256']+'  '+row['file']+'\n');self.put('joystick-games/sample/android/build.mjs','production code')
        with self.assertRaisesRegex(AssertionError,'Undeclared file'):self.selection()
    def remote_windows_fixture(self):
        tag='joystick-sample-v0.1.0';rows=[]
        for index,suffix in enumerate(['windows-x64.zip','windows-x64-setup.exe']):
            name='Sample-0.1.0-'+suffix;rows.append({'file':name,'storage':'github-release-asset','url':'https://github.com/ecojust/pureTV/releases/download/'+tag+'/'+name,'assetId':123+index,'bytes':104921739+index,'sha256':str(index+1)*64})
        meta={'schemaVersion':1,'game':'sample','windows':{'version':'0.1.0','releaseTag':tag,'releaseId':456,'files':rows}}
        self.put('joystick-games/sample/packages.json',json.dumps(meta))
        self.put('joystick-games/sample/windows-release.json',json.dumps({'game':'sample','packages':{r['file']:{'bytes':r['bytes'],'sha256':r['sha256']} for r in rows}}))
        return meta,rows
    def test_remote_windows_pair_keeps_index_bound_and_does_not_hide_tracked_input(self):
        meta,rows=self.remote_windows_fixture();readme=self.put('joystick-games/sample/windows/README.md','Original portable and setup downloads');sums=self.put('joystick-games/sample/windows/SHA256SUMS.txt',''.join(r['sha256']+'  '+r['file']+'\n' for r in rows));result=self.selection()
        for p in (readme,sums):self.assertIn('scope-configuration',result['files'][p.relative_to(self.root).as_posix()]['roles'])
        blobs={name:{} for name in result['files']};scope.verify_complete_git_selection(result,blobs)
        for row in rows:
            name='joystick-games/sample/'+row['file'];self.assertNotIn(name,result['excluded']);missing=dict(blobs);missing[name]={}
            with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(result,missing)
        self.put('joystick-games/sample/windows/build.mjs','real production derivation')
        with self.assertRaisesRegex(AssertionError,'Undeclared file'):self.selection()
    def test_independently_versioned_windows_release_tag(self):
        meta,rows=self.remote_windows_fixture()
        for tag,valid in [('joystick-sample-windows-v0.1.0',True),
                          ('joystick-sample-windows-v0.1.1',False),
                          ('joystick-sample-macos-v0.1.0',False)]:
            meta['windows']['releaseTag']=tag
            for row in rows:
                row['url']=f"https://github.com/ecojust/pureTV/releases/download/{tag}/{row['file']}"
            self.put('joystick-games/sample/packages.json',json.dumps(meta))
            with self.subTest(tag=tag):
                if valid:self.selection()
                else:
                    with self.assertRaisesRegex(AssertionError,'release tag'):self.selection()
    def test_remote_windows_pair_keeps_exact_identities_and_local_conflict_guard(self):
        meta,rows=self.remote_windows_fixture();path=self.game/'packages.json'
        for update in [{'storage':'external'},{'url':rows[0]['url'].replace('ecojust/pureTV','other/pureTV')},{'file':'src/'+rows[0]['file']},{'assetId':True},{'bytes':0},{'sha256':'bad'}]:
            changed=copy.deepcopy(meta);changed['windows']['files'][0].update(update);path.write_text(json.dumps(changed))
            with self.subTest(update=update),self.assertRaises(AssertionError):self.selection()
        path.write_text(json.dumps(meta));self.put('joystick-games/sample/'+rows[1]['file'],'local source')
        with self.assertRaisesRegex(AssertionError,'conflicts with a local node'):self.selection()
    def test_remote_android_and_mac_release_indexes_cannot_reintroduce_exclusions(self):
        meta,mac=self.remote_mac_fixture();android_meta,android=self.remote_android_fixture();meta['android']=android_meta['android'];self.put('joystick-games/sample/packages.json',json.dumps(meta))
        self.put('joystick-games/sample/macos-release.json',json.dumps({'game':'sample','packages':{mac['file']:{'bytes':mac['bytes'],'sha256':mac['sha256']}}}))
        self.put('joystick-games/sample/android-release.json',json.dumps({'game':'sample','apk':{'file':android['file']}}))
        result=self.selection();blobs={name:{} for name in result['files']};scope.verify_complete_git_selection(result,blobs)
        for platform,row in [('macos',mac),('android',android)]:
            name='joystick-games/sample/'+row['file'];self.assertNotIn(name,result['excluded'])
            self.assertIn('scope-configuration',result['files']['joystick-games/sample/'+platform+'-release.json']['roles'])
            missing=dict(blobs);missing[name]={}
            with self.assertRaisesRegex(AssertionError,'missing'):scope.verify_complete_git_selection(result,missing)
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
