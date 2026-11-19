import ast,hashlib,importlib.util,json,os,subprocess,sys,time,fnmatch
from pathlib import Path
R=Path('/dev/shm/puretv-submit');S=Path(__file__).parent;C=S/'candidate-minimal';C.mkdir(exist_ok=False)
BASE='c5ad63e8c6a0ccfada5f763d1d26afa27f45002e';PLAN='ff645cc2f195d4071150be1fffd2b7952c265129'
def git(*args):return subprocess.check_output(['git',*args],cwd=R)
def blob(n):return git('show',BASE+':'+n)
def rec(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
# The previous sparse support inventory already enumerates small test dependencies.
old=json.loads((R/'joystick-games/penguintrack/docs/android-original-qa-isolation-attempt-1/local-support-inventory.json').read_text())
basepaths=set(git('ls-tree','-r','--name-only',BASE).decode().splitlines())
for item in old:
 n=item['path']
 if n not in basepaths:continue
 p=C/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(blob(n))
plan='joystick-games/penguintrack/qa-plan.json';(C/plan).write_bytes(git('show',PLAN+':'+plan))
inputs='joystick-games/tools/android-runtime-inputs.py';text=(C/inputs).read_text();text=text.replace('import sys\n','import sys\nimport tempfile\nimport types\n',1)
up=(S/'candidate'/inputs).read_text();t=ast.parse(up);f=next(x for x in t.body if isinstance(x,ast.FunctionDef) and x.name=='frozen_payload');helper=ast.get_source_segment(up,f)
text=text.replace('\ndef verify(args):','\n'+helper+'\n\n\ndef verify(args):',1)
old_block="""        prefix = 'joystick-games/' + slug + '/dist/'
        expected_assets = {name[len(prefix):]: value for name, value in frozen_files.items() if name.startswith(prefix)}
        assert all('/' not in name for name in expected_assets)
        expected_assets.update({Path(name).name: frozen_files[name] for name in PHONE})
        expected_assets['game-config.json'] = (json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + '\\n').encode()
        expected_assets['assets-index.json'] = (json.dumps(sorted(expected_assets), separators=(',', ':')) + '\\n').encode()
"""
assert text.count(old_block)==1;text=text.replace(old_block,'        expected_assets = frozen_payload(meta, registered, frozen_files, slug)\n');(C/inputs).write_text(text)
tests='joystick-games/tools/android-tests.py';t=(C/tests).read_text();extra='''class FrozenPayloadBoundaries(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('frozen_payload_under_test', HERE / 'android-runtime-inputs.py')
        self.inputs = importlib.util.module_from_spec(spec); spec.loader.exec_module(self.inputs)
        self.slug = 'penguintrack'
        self.meta = json.loads((HERE.parent / self.slug / 'game.json').read_text())
        self.registration = json.loads((HERE.parent / 'catalog-registry.json').read_text())['games'][self.slug]
        self.files = {'resource/game-kit/build.py': (HERE.parents[1] / 'resource/game-kit/build.py').read_bytes(),
                      **{name: b'phone fixture' for name in self.inputs.PHONE},
                      'joystick-games/penguintrack/dist/tv.html': b'<html>fixture</html>',
                      'joystick-games/penguintrack/dist/js/game.js': b'original nested source'}

    def payload(self, files=None):
        return self.inputs.frozen_payload(self.meta, self.registration, self.files if files is None else files, self.slug)

    def test_matching_declared_policy_keeps_original_nested_bytes_and_index(self):
        value = self.payload()
        self.assertEqual(value['js/game.js'], b'original nested source')
        self.assertEqual(json.loads(value['assets-index.json']), sorted(set(value) - {'assets-index.json'}))

    def test_missing_or_mismatched_policy_cannot_admit_nested_assets(self):
        self.registration['assetPolicy']['maxTotalBytes'] -= 1
        with self.assertRaises(AssertionError): self.payload()
        self.meta.pop('assetPolicy'); self.registration.pop('assetPolicy')
        with self.assertRaises((AssertionError, ValueError, RuntimeError)): self.payload()

    def test_unsafe_alias_reserved_and_traversal_names_are_rejected(self):
        for name in ('js/GAME.js', 'game-config.json', 'assets-index.json', '../outside.js', 'js/../outside.js', '/outside.js', 'js\\\\bad.js'):
            with self.subTest(name=name), self.assertRaises((AssertionError, ValueError, RuntimeError)):
                self.payload({**self.files, 'joystick-games/penguintrack/dist/' + name: b'rejected'})

    def test_default_flat_payload_is_byte_identical_to_original_rule(self):
        self.meta.pop('assetPolicy'); self.registration.pop('assetPolicy')
        self.files.pop('joystick-games/penguintrack/dist/js/game.js')
        value = self.payload()
        expected = {'tv.html': b'<html>fixture</html>', **{Path(n).name: self.files[n] for n in self.inputs.PHONE}}
        expected['game-config.json'] = (json.dumps(self.meta, ensure_ascii=False, separators=(',', ':')) + '\\n').encode()
        expected['assets-index.json'] = (json.dumps(sorted(expected), separators=(',', ':')) + '\\n').encode()
        self.assertEqual(value, expected)


'''
assert t.count("if __name__ == '__main__':")==1;t=t.replace("if __name__ == '__main__':",extra+"if __name__ == '__main__':");(C/tests).write_text(t)
# The existing workflow and complete original runner/schema remain frozen c5.
sourcefiles=[{'path':n,**rec((C/n).read_bytes())} for n in [plan,inputs,tests]]
protected=['.github/workflows/joystick-catalog-android-runtime.yml','joystick-games/qa/android/run.py','joystick-games/qa/android/test_runner.py','joystick-games/tools/qa-plan.py','joystick-games/tools/android-catalog.py','joystick-games/tools/android-build.py','joystick-games/qa/android/build-observer.py','joystick-games/qa/android/src/com/ecojust/controllerqa/Observer.java']
for n in protected:assert (C/n).read_bytes()==blob(n)
log=S/'minimal-android-tests.log';start=time.monotonic()
with log.open('wb') as f:result=subprocess.run([sys.executable,'-B',str(C/tests)],cwd=C,env={**os.environ,'TMPDIR':str(S),'PYTHONDONTWRITEBYTECODE':'1'},stdout=f,stderr=subprocess.STDOUT,timeout=60)
assert result.returncode==0,log
# Actual original payload reconstructed from the already audited fixed source.
spec=importlib.util.spec_from_file_location('minimal_payload',C/inputs);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
receipt_path=R/'joystick-games/penguintrack/docs/android-original-packages-44606071748-44606074787/penguintrack/packages/signing-receipt.json';receipt=json.loads(receipt_path.read_text());names=set(n for n in receipt['sourceInputs'] if n.startswith('joystick-games/penguintrack/dist/'))|m.PHONE|{'resource/game-kit/build.py'}
files={n:blob(n) for n in names}
for n,b in files.items():assert rec(b)==receipt['sourceInputs'][n]
meta=json.loads((C/'joystick-games/penguintrack/game.json').read_text());registration=json.loads((C/'joystick-games/catalog-registry.json').read_text())['games']['penguintrack'];payload=m.frozen_payload(meta,registration,files,'penguintrack');assert {n:rec(b) for n,b in payload.items()}==receipt['assets']
# Exact original source predicates after replacing just the payload-construction block.
old=ast.parse(blob(inputs));new=ast.parse((C/inputs).read_bytes())
oldfunctions={x.name:ast.dump(x,include_attributes=False) for x in old.body if isinstance(x,ast.FunctionDef)};newfunctions={x.name:ast.dump(x,include_attributes=False) for x in new.body if isinstance(x,ast.FunctionDef)}
assert [k for k in oldfunctions if oldfunctions[k]!=newfunctions[k]]==['verify'];assert set(newfunctions)-set(oldfunctions)=={'frozen_payload'}
plan_before=json.loads(blob(plan));plan_after=json.loads((C/plan).read_text());assert plan_after['steps'][2:]==plan_before['steps'];assert {k:v for k,v in plan_after.items() if k!='steps'}=={k:v for k,v in plan_before.items() if k!='steps'}
report={'parentCommit':BASE,'sourceFiles':sourcefiles,'protectedOriginalSources':{n:rec((C/n).read_bytes()) for n in protected},'newPayloadHelperOrigin':'d3b9178bfc4748ef0d8b983f4c6775969f946625 exact frozen_payload function','nestedPayloadAssets':len(payload),'actualOriginalPayloadMatchesSignedReceipt':True,'receiptSha256':rec(receipt_path.read_bytes())['sha256'],'androidTests':{'count':20,'originalPreserved':16,'new':4,'returncode':result.returncode,'seconds':time.monotonic()-start,'log':log.name,**rec(log.read_bytes())},'allOtherOriginalVerifierFunctionsUnchanged':True,'originalPlanStepsUnchanged':16,'addedMenuSteps':2,'noRefCommitOrDispatch':True}
(S/'minimal-preflight.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
