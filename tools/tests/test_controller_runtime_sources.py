"""Mixed source groups must remain exact, including independently signed observers."""
import importlib.util
from pathlib import Path
import sys
import unittest
import json
import tempfile
from unittest import mock
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
spec=importlib.util.spec_from_file_location('runtime_inputs',ROOT/'tools/controller-runtime-inputs.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class Sources(unittest.TestCase):
    def setUp(self):
        self.kit='a'*40;self.legacy='b'*40
        self.manifest={'sourceSha':self.kit,'legacySourceSha':self.legacy}
    def binding(self,slug,app,observer):
        return m.source_bindings(self.manifest,slug,{'sourceSha':app,'packageName':'com.ecojust.example'}, {'sourceSha':observer,'targetPackage':'com.ecojust.example'})
    def test_reused_gamekit_retains_its_own_exact_source(self):
        self.assertEqual(self.binding('neon-rush',self.kit,self.legacy),(self.kit,self.legacy))
    def test_new_legacy_game_binds_new_source(self):
        self.assertEqual(self.binding('coast-kart',self.legacy,self.legacy),(self.legacy,self.legacy))
    def test_old_legacy_apk_cannot_pass_new_group(self):
        with self.assertRaisesRegex(AssertionError,'wrong source group'):self.binding('coast-kart',self.kit,self.legacy)
    def test_gamekit_is_not_silently_rebound_to_legacy_commit(self):
        with self.assertRaisesRegex(AssertionError,'wrong source group'):self.binding('neon-rush',self.legacy,self.legacy)
    def test_observer_from_wrong_signing_source_fails(self):
        with self.assertRaisesRegex(AssertionError,'Observer must match'):self.binding('neon-rush',self.kit,self.kit)
    def test_missing_legacy_source_preserves_original_single_source_format(self):
        self.manifest.pop('legacySourceSha');self.assertEqual(self.binding('coast-kart',self.kit,self.kit),(self.kit,self.kit))
    def test_unregistered_game_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'twenty README'):self.binding('unknown',self.legacy,self.legacy)
    def test_wrong_observer_target_is_rejected(self):
        with self.assertRaisesRegex(AssertionError,'another package'):
            m.source_bindings(self.manifest,'neon-rush',{'sourceSha':self.kit,'packageName':'com.ecojust.neonrushtv'}, {'sourceSha':self.legacy,'targetPackage':'com.ecojust.other'})
class Baselines(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location('runtime_batch',ROOT/'tools/controller-emulator-batch.py')
        cls.batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.batch)
    def setUp(self):
        self.ref='a'*40
        self.old={'apk':'old.apk','packageName':'com.ecojust.example','version':'0.1','versionCode':1,'sha256':'c'*64,'apkBytes':123,'certificateSha256':'d'*64}
        self.actual={'packageName':self.old['packageName'],'versionName':'0.1','versionCode':1,'sha256':'c'*64,'bytes':123,'certificateSha256':'d'*64}
        self.new={'packageName':self.old['packageName'],'versionCode':2,'certificateSha256':'d'*64}
    def read(self):
        with mock.patch.object(self.batch.subprocess,'check_output',return_value=json.dumps(self.old).encode()) as git, mock.patch.object(self.batch.release,'info',return_value=self.actual):
            result=self.batch.baseline_release('neon-rush',self.ref,self.new,Path('/unused'))
            git.assert_called_once_with(['git','show',self.ref+':resource/apps/neon-rush/resource.json'],cwd=ROOT)
            return result
    def test_metadata_comes_from_artifact_commit(self):
        path,receipt=self.read()
        self.assertEqual(path,ROOT/'resource/apps/neon-rush/old.apk')
        self.assertEqual(receipt['baselineMetadataRef'],self.ref+':resource/apps/neon-rush/resource.json')
    def test_changed_old_apk_fails(self):
        self.actual['sha256']='e'*64
        with self.assertRaisesRegex(AssertionError,'committed resource'):self.read()
    def test_old_metadata_cannot_point_outside_game(self):
        self.old['apk']='../other.apk'
        with self.assertRaises(AssertionError):self.read()
    def test_new_metadata_cannot_be_its_own_upgrade_baseline(self):
        self.new['versionCode']=1
        with self.assertRaises(AssertionError):self.read()
    def test_certificate_changed_between_versions_fails(self):
        self.new['certificateSha256']='f'*64
        with self.assertRaises(AssertionError):self.read()

class DisposableEmulator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec=importlib.util.spec_from_file_location('runtime_batch_emulator',ROOT/'tools/controller-emulator-batch.py')
        cls.batch=importlib.util.module_from_spec(spec);spec.loader.exec_module(cls.batch)
    def setUp(self):
        self.calls=[];self.qemu='1';self.apply=True
        self.settings={'verifier_verify_adb_installs':'1','package_verifier_enable':'null'}
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.receipt=Path(self.temp.name)/'emulator.json'
    def command(self,args):
        self.calls.append(args);tail=args[3:]
        if tail==['shell','getprop','ro.kernel.qemu']:return self.qemu+'\n'
        if tail==['shell','getprop','ro.build.fingerprint']:return 'google/test-emulator:16/test/dev-keys\n'
        if tail==['shell','getprop','ro.build.version.sdk']:return '36\n'
        if tail[:4]==['shell','settings','get','global']:return self.settings[tail[4]]+'\n'
        if tail[:4]==['shell','settings','put','global']:
            if self.apply:self.settings[tail[4]]=tail[5]
            return ''
        raise AssertionError(args)
    def configure(self,serial='emulator-5554',environment=None):
        return self.batch.configure_disposable_emulator(self.command,['adb','-s',serial],serial,{'PURETV_DISPOSABLE_EMULATOR':'1'} if environment is None else environment,self.receipt)
    def test_disposable_device_records_both_original_and_applied_values(self):
        result=self.configure()
        self.assertEqual(result['before'],{'verifier_verify_adb_installs':'1','package_verifier_enable':'null'})
        self.assertEqual(result['after'],{'verifier_verify_adb_installs':'0','package_verifier_enable':'0'})
        self.assertEqual(result['status'],'configured');self.assertEqual(json.loads(self.receipt.read_text()),result)
        self.assertEqual(len(result['commands']),2)
    def test_missing_disposable_opt_in_changes_nothing(self):
        with self.assertRaisesRegex(AssertionError,'opt-in'):self.configure(environment={})
        self.assertEqual(self.calls,[])
    def test_physical_device_serial_changes_nothing(self):
        with self.assertRaisesRegex(AssertionError,'serial'):self.configure(serial='192.168.1.16:5555')
        self.assertEqual(self.calls,[])
    def test_emulator_shaped_serial_without_qemu_changes_nothing(self):
        self.qemu='0'
        with self.assertRaisesRegex(AssertionError,'identify itself'):self.configure()
        self.assertEqual(len(self.calls),1);self.assertNotIn('put',self.calls[0])
    def test_unapplied_configuration_is_reported_as_failure(self):
        self.apply=False
        with self.assertRaisesRegex(AssertionError,'not applied'):self.configure()
        record=json.loads(self.receipt.read_text());self.assertEqual(record['status'],'failed');self.assertEqual(record['after'],record['before'])

if __name__=='__main__':unittest.main()
