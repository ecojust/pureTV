from pathlib import Path
import json,subprocess,hashlib,ast,copy,difflib
R=Path('/dev/shm/puretv-submit');S=Path(__file__).parent;C=S/'candidate';C.mkdir(exist_ok=False)
BASE='6c7cb4fdb99dce236b634c842326bae6aed5f232';TAP='f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965'
def blob(n,commit=BASE):return subprocess.check_output(['git','show',commit+':'+n],cwd=R)
def sig(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
receipt=json.loads((R/'joystick-games/kart-royale/docs/android-package-audit-44616011172/original-small-export/packages/kart-royale/signing-receipt.json').read_text())
names=set(receipt['sourceInputs']);tree=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=R,text=True).splitlines()
# Isolated test execution uses only exact original commit files. Include existing
# fixture/cross-game plan dependencies without transplanting newer production.
for n in tree:
 if (n.startswith('joystick-games/qa/android/') and not '/docs/' in n) or (n.startswith('joystick-games/tools/') and (n.endswith('.py') or '/fixtures/' in n)) or (n.startswith('joystick-games/') and n.endswith('/qa-plan.json') and '/docs/' not in n):names.add(n)
names.update(['.github/workflows/joystick-catalog-android-runtime.yml','puretv-joystick/joystick_sdk.py','resource/game-kit/build.py','tools/resource_catalog.py','joystick-games/tools/artifact-draft-transfer.py','joystick-games/catalog-registry.json','joystick-games/tools/asset-policy.py'])
original={}
for n in sorted(names):
 b=blob(n);p=C/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);original[n]=sig(b)
assert all(original[n]==v for n,v in receipt['sourceInputs'].items())
planpath='joystick-games/kart-royale/qa-plan.json';plan=json.loads(blob(planpath));current=json.loads((R/planpath).read_text())
for i in range(2,8):
 assert plan['steps'][i]['name']==current['steps'][i]['name'];plan['steps'][i]['menuTap']=True;plan['steps'][i]['expect']=copy.deepcopy(current['steps'][i]['expect'])
assert not any('windowsStartupWait' in s for s in plan['steps']);(C/planpath).write_text(json.dumps(plan,indent=2)+'\n')
runnerpath='joystick-games/qa/android/run.py';old=blob(runnerpath).decode();newtap=blob(runnerpath,TAP).decode();tap_ast=ast.parse(newtap);cls=next(n for n in tap_ast.body if isinstance(n,ast.ClassDef) and n.name=='Acceptance')
parts=[]
for name in ['menu_player','menu_released','menu_wire_pair','catalog_menu_tap']:
 n=next(n for n in cls.body if isinstance(n,ast.FunctionDef) and n.name==name);part=ast.get_source_segment(newtap,n);part='    '+part
 if name=='catalog_menu_tap':
  assert part.count('basis = self.menu_reload_basis(step, before)')==1;part=part.replace('basis = self.menu_reload_basis(step, before)','basis = None  # This isolated Royale QA accepts no document/poll reset exception.')
  assert part.count('self.frame_advanced(state, before) or (basis is not None and type(count) is int and count > 0)')==1;part=part.replace('self.frame_advanced(state, before) or (basis is not None and type(count) is int and count > 0)','self.frame_advanced(state, before)')
  part=part.replace('                # In the one source-proven reload, the first new Low document\n                # snapshot is only a baseline, never itself a successful frame.','                # A released matching observation is only the baseline;\n                # require two later fresh polls in this same document.')
 parts.append(part)
needle='    def catalog_scenarios(self):';assert old.count(needle)==1;new=old.replace(needle,'\n\n'.join(parts)+'\n\n'+needle)
anchor="            before = self.record('before-plan-' + step['name'])\n";branch="""            if step.get('menuTap') is True:
                after = self.catalog_menu_tap(step, before)
                self.record('after-plan-' + step['name'], after)
                self.passed('actual SDK gameplay: ' + step['name'], {'expect': step['expect'], 'holdMs': step['holdMs'], 'menuTap': True})
                continue
""";assert new.count(anchor)==1;new=new.replace(anchor,anchor+branch)
assert 'NIGHT_LOW' not in new and 'menu_reload_basis' not in new and 'install_confirmation' not in new
(C/runnerpath).write_text(new)
# Reuse only generic menu transport/stability tests from f3; keep all 44 original
# test cases and helpers untouched. Runtime observations remain synthetic.
testpath='joystick-games/qa/android/test_runner.py';testold=blob(testpath).decode();tt=blob(testpath,TAP).decode();tc=next(n for n in ast.parse(tt).body if isinstance(n,ast.ClassDef) and n.name=='MenuTapContracts')
remove={'reload_step','test_exact_night_low_reload_requires_new_baseline_then_two_new_polls','test_constant_post_reload_counter_does_not_count_as_fresh_frames','test_reload_proof_rejects_changed_apk_source_wrong_state_and_expectation'}
methods=['class MenuTapContracts(unittest.TestCase):','    """Real original SDK/TCP ACK fixtures; synthetic Royale DOM observations."""']
for n in tc.body:
 if not isinstance(n,ast.FunctionDef) or n.name in remove:continue
 part='    '+ast.get_source_segment(tt,n)
 part=part.replace("tempfile.TemporaryDirectory(prefix='android-menu-tap-', dir='/dev/shm')","tempfile.TemporaryDirectory(prefix='android-menu-tap-')")
 part=part.replace("game='night-racer'","game='kart-royale'").replace("'game': 'night-racer'","'game': 'kart-royale'")
 part=part.replace("{'apk': {'bytes': 22465268, 'sha256': runner.NIGHT_LOW_RELOAD_APK}}", "{'apk': {'bytes': 1221895, 'sha256': '63b39ff300811e00401239ab5a4ec1206b6f96bfd8877e78399911e023038712'}}")
 part=part.replace("['RIGHT']","['Y']").replace("'RIGHT'","'Y'")
 part=part.replace("'gameplay.menu.focusIndex'","'gameplay.focus'").replace("'value': 2", "'value': 'Left'")
 if n.name=='state':
  part=part.replace('count, *, index=1, low=False','count, *, index=1')
  start=part.index("                         'gameplay':");end=part.index("                'page':",start)
  part=part[:start]+"                         'gameplay': {'menu': 'controls', 'focus': 'Right' if index == 1 else 'Left'}},\n"+part[end:]
 methods.append(part)
methods.append('''    def test_constant_matching_counter_cannot_supply_two_fresh_polls(self):
        self.step['timeoutSeconds'] = .2
        self.use_samples([self.state(101, index=2)])
        with self.assertRaisesRegex(AssertionError, 'two subsequent fresh polls'):
            self.acceptance.catalog_menu_tap(self.step, self.state(100))

    def test_observer_disconnect_preserves_failure_after_releasing_input(self):
        def broken(**kwargs): raise ConnectionResetError('original observer disconnect fixture')
        self.acceptance.snapshot = broken
        with self.assertRaisesRegex(ConnectionResetError, 'original observer disconnect fixture'):
            self.acceptance.catalog_menu_tap(self.step, self.state(100))
        record = self.acceptance.report['menuTapObservations'][0]
        self.assertEqual(record['status'], 'failed')
        self.assertEqual(record['wire']['matchingAcks'], 2)
        self.assertEqual(self.acceptance.menu_wire_pair('Y', record['downSequence'], record['releaseSequence'])['downCounts']['Y'], 1)

    def test_missing_ack_cannot_pass_and_both_original_buttons_are_released(self):
        self.server.drop_key = 'Y'; self.step['timeoutSeconds'] = .15
        self.use_samples([self.state(101, index=2), self.state(102, index=2), self.state(103, index=2)])
        with self.assertRaisesRegex(AssertionError, 'Actual host ACK'):
            self.acceptance.catalog_menu_tap(self.step, self.state(100))
        self.assertEqual(self.acceptance.report['menuTapObservations'][0]['status'], 'failed')
        with self.proxy.lock:
            sent = [r['message'] for r in self.proxy.records if r['direction'] == 'sdk-to-game' and r['message'].get('type') == 'button']
        self.assertEqual([(r['key'],r['action'],r['pressed']) for r in sent], [('Y','down',True),('Y','tap',False)])
''')
fixture=json.loads((R/'joystick-games/kart-royale/tests/fixtures/menu-focus-original-failures.json').read_text());facts=[]
for row in fixture['cases']:
 facts.append({'mode':row['mode'],'name':row['name'],'originalReport':row['originalReport'],'gameplay':{k:row['snapshot']['gameplay'][k] for k in ['menu','focus']}})
methods.append('''    def test_all_twelve_original_windows_stale_focus_samples_fail_new_plan(self):
        # Exact selected fields from original run 44621752383/source039d/exportf559;
        # these are Windows failure observations of the same original menu source,
        # not fabricated Android gameplay or a claim that Android already passed.
        cases = json.loads('''+repr(json.dumps(facts,separators=(',',':')))+''')
        plan = runner.plan.load_plan(runner.ROOT/'joystick-games/kart-royale/qa-plan.json')
        legacy = [{'path':'gameplay.menu','op':'eq','value':'controls'}]
        self.assertEqual(len(cases),12)
        for case in cases:
            step = next(s for s in plan['steps'] if s['name']==case['name'])
            game = {'gameplay':case['gameplay']}
            self.assertTrue(runner.plan.matches(legacy,game,game),case['name'])
            self.assertFalse(runner.plan.matches(step['expect'],game,game),case['name'])
            self.assertTrue(step['menuTap'])
''')
newtest=testold.replace('\nclass Contracts(unittest.TestCase):','\n'+'\n\n'.join(methods)+'\n\nclass Contracts(unittest.TestCase):',1);assert 'NIGHT_LOW' not in newtest and 'low=True' not in newtest
(C/testpath).write_text(newtest)
changed=[n for n in names if (C/n).read_bytes()!=blob(n)];assert sorted(changed)==sorted([planpath,runnerpath,testpath])
(S/'original-file-inventory.json').write_text(json.dumps(original,indent=2)+'\n');(S/'candidate-three-files.json').write_text(json.dumps({n:sig((C/n).read_bytes()) for n in changed},indent=2)+'\n')
(S/'source.diff').write_text(''.join(''.join(difflib.unified_diff(blob(n).decode().splitlines(True),(C/n).read_text().splitlines(True),fromfile=BASE+'/'+n,tofile='candidate/'+n)) for n in sorted(changed)))
print(json.dumps({'candidate':str(C),'originalFiles':len(names),'changed':changed,'candidateBytes':sum(p.stat().st_size for p in C.rglob('*') if p.is_file())}))
