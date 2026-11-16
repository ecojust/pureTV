"""A later one-game UI build cannot silently replace other accepted APKs."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools'))
spec = importlib.util.spec_from_file_location('controller_status_release', ROOT/'tools/controller-status-release.py')
release = importlib.util.module_from_spec(spec);spec.loader.exec_module(release)
A, B, HASH_A, HASH_B, CERT = 'a'*40, 'b'*40, '1'*64, '2'*64, 'c'*64


def candidate(source=A, digest=HASH_A):
    return {'row':{'artifactSourceSha':source,'package':{'sha256':digest,'certificateSha256':CERT}}}


class SelectionBoundaries(unittest.TestCase):
    def test_original_single_input_needs_no_new_selector(self):
        value = candidate()
        self.assertIs(release.select_signed_candidates({'cozy-island':{}}, {'cozy-island':[value]})['cozy-island'], value)

    def test_multiple_sources_require_explicit_source(self):
        with self.assertRaises(AssertionError):
            release.select_signed_candidates({'cozy-island':{'packageSha256':HASH_B}}, {'cozy-island':[candidate(),candidate(B,HASH_B)]})

    def test_explicit_source_retains_other_original_inputs_without_mutation(self):
        options = {'cozy-island':[candidate(),candidate(B,HASH_B)],'coast-kart':[candidate()]}
        original = copy.deepcopy(options)
        chosen = release.select_signed_candidates({'cozy-island':{'artifactSourceSha':B,'packageSha256':HASH_B},'coast-kart':{}},options)
        self.assertEqual(chosen['cozy-island']['row']['artifactSourceSha'], B)
        self.assertEqual(chosen['coast-kart']['row']['artifactSourceSha'], A)
        self.assertEqual(options, original)

    def test_missing_or_invalid_selection_rejected(self):
        for choice in [{'artifactSourceSha':'c'*40},{'artifactSourceSha':'latest'},
                       {'artifactSourceSha':A,'packageSha256':HASH_B},{'packageSha256':'bad'}]:
            with self.subTest(choice=choice), self.assertRaises(AssertionError):
                release.select_signed_candidates({'cozy-island':choice},{'cozy-island':[candidate()]})

    def test_same_source_multiple_packages_need_exact_digest(self):
        options = {'cozy-island':[candidate(),candidate(A,HASH_B)]}
        with self.assertRaises(AssertionError):
            release.select_signed_candidates({'cozy-island':{'artifactSourceSha':A}},options)
        chosen = release.select_signed_candidates({'cozy-island':{'artifactSourceSha':A,'packageSha256':HASH_B}},options)
        self.assertEqual(chosen['cozy-island']['row']['package']['sha256'],HASH_B)

    def test_duplicate_matching_candidates_rejected(self):
        with self.assertRaises(AssertionError):
            release.select_signed_candidates({'cozy-island':{'artifactSourceSha':A,'packageSha256':HASH_A}}, {'cozy-island':[candidate(),candidate()]})

    def test_catalog_coverage_must_match(self):
        with self.assertRaises(AssertionError):
            release.select_signed_candidates({'cozy-island':{}},{'coast-kart':[candidate()]})


class IdentityBoundaries(unittest.TestCase):
    def test_valid_actual_identity_binds_source_digest_and_certificate(self):
        row = candidate()['row'];receipt = {'sourceSha':A,'sha256':HASH_A,'signatureVerified':True}
        release.verify_signed_identity({'artifactSourceSha':A,'packageSha256':HASH_A},row,receipt,copy.deepcopy(row['package']),CERT)

    def test_tampered_digest_source_or_signature_claim_rejected(self):
        row = candidate()['row']
        for changed in [{'sha256':HASH_B},{'sourceSha':B},{'signatureVerified':False}]:
            receipt = {'sourceSha':A,'sha256':HASH_A,'signatureVerified':True,**changed}
            with self.subTest(changed=changed), self.assertRaises(AssertionError):
                release.verify_signed_identity({},row,receipt,copy.deepcopy(row['package']),CERT)

    def test_actual_certificate_cannot_be_relabelled_by_an_input_report(self):
        row = candidate()['row'];row['package']['certificateSha256'] = 'd'*64
        with self.assertRaises(AssertionError):
            release.verify_signed_identity({},row,{'sourceSha':A,'sha256':HASH_A,'signatureVerified':True},copy.deepcopy(row['package']),CERT)

    def test_actual_identity_and_explicit_selection_must_agree(self):
        row = candidate()['row'];receipt = {'sourceSha':A,'sha256':HASH_A,'signatureVerified':True}
        for choice,identity in [({},dict(row['package'],sha256=HASH_B)),({'artifactSourceSha':B},row['package']),({'packageSha256':HASH_B},row['package'])]:
            with self.subTest(choice=choice),self.assertRaises(AssertionError):
                release.verify_signed_identity(choice,row,receipt,identity,CERT)


class CommittedAssetBoundaries(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='status-source-boundary-');self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name);self.slug = 'cozy-island'
        self.assets = self.root/'resource/apps'/self.slug/'src/main/assets';self.assets.mkdir(parents=True)
        (self.assets/'game-model.js').write_bytes(b'unchanged model')
        (self.assets/'tv.css').write_bytes(b'original css')
        shared = self.root/'resource/game-kit/web';shared.mkdir(parents=True);(shared/'tv.html').write_bytes(b'shared shell')
        self.config = {'id':self.slug,'version':'0.5.4'}
        (self.root/'resource/apps'/self.slug/'game.json').write_text(json.dumps(self.config))
        self.git('init','-q');self.git('add','.');self.git('-c','user.name=Boundary test','-c','user.email=qa@example.invalid','commit','-q','-m','Original assets')
        self.original = self.git('rev-parse','HEAD').strip()
        (self.assets/'tv.css').write_bytes(b'corrected css');self.git('add','.');self.git('-c','user.name=Boundary test','-c','user.email=qa@example.invalid','commit','-q','-m','Corrected assets')
        self.corrected = self.git('rev-parse','HEAD').strip()
        self.root_patch = patch.object(release,'ROOT',self.root);self.root_patch.start();self.addCleanup(self.root_patch.stop)

    def git(self,*args):
        return subprocess.check_output(['git',*args],cwd=self.root,text=True,stderr=subprocess.DEVNULL)

    def actual(self):
        return {'game-model.js':b'unchanged model','tv.css':b'corrected css'}

    def test_correct_assets_bind_to_exact_selected_commit(self):
        release.verify_committed_assets(self.slug,'legacy',self.corrected,self.actual())
        with self.assertRaises(AssertionError):
            release.verify_committed_assets(self.slug,'legacy',self.original,self.actual())

    def test_missing_changed_or_injected_assets_rejected(self):
        for actual in [{'tv.css':b'corrected css'},dict(self.actual(),**{'tv.css':b'tampered'}),dict(self.actual(),extra=b'injected')]:
            with self.subTest(files=list(actual)),self.assertRaises(AssertionError):
                release.verify_committed_assets(self.slug,'legacy',self.corrected,actual)

    def test_gamekit_shared_and_generated_json_are_source_bound(self):
        actual = dict(self.actual(),**{'tv.html':b'shared shell','game-config.json':(json.dumps(self.config,separators=(',',':'))+'\n').encode()})
        actual['assets-index.json'] = (json.dumps(sorted(actual),separators=(',',':'))+'\n').encode()
        release.verify_committed_assets(self.slug,'game-kit',self.corrected,actual)
        actual['game-config.json'] = b'{"version":"wrong"}\n'
        with self.assertRaises(AssertionError):
            release.verify_committed_assets(self.slug,'game-kit',self.corrected,actual)


if __name__ == '__main__':
    unittest.main()
