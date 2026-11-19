from pathlib import Path
import ast,json,subprocess,hashlib,copy,shutil,os
R=Path('/dev/shm/puretv-submit');S=Path('/dev/shm/racing-review-karts/penguin-down-tap-candidate');S.mkdir(exist_ok=False);C=S/'candidate';shutil.copytree('/dev/shm/racing-review-karts/penguin-android-isolation/candidate-minimal',C,copy_function=os.link)
BASE='15c9c1044b8cd2173e07b8eedfb836738cc79e1c';Q=R/'joystick-games/kart-royale/docs/android-original-qa-isolation-attempt-1/executed-overlay'
def blob(n):return subprocess.check_output(['git','show',BASE+':'+n],cwd=R)
def write(n,b):
 p=C/n;temp=p.with_name(p.name+'.new');temp.write_bytes(b);temp.replace(p)
def rec(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
planpath='joystick-games/penguintrack/qa-plan.json';plan=json.loads(blob(planpath));assert plan['steps'][0]['keys']==['UP'] and plan['steps'][1]['keys']==['DOWN'];assert all('menuTap' not in x for x in plan['steps']);plan['steps'][1]['menuTap']=True;write(planpath,(json.dumps(plan,indent=2)+'\n').encode())
runpath='joystick-games/qa/android/run.py';text=blob(runpath).decode();borrow=(Q/runpath).read_text();t=ast.parse(borrow);ac=next(n for n in t.body if isinstance(n,ast.ClassDef) and n.name=='Acceptance');names=['menu_player','menu_released','menu_wire_pair','catalog_menu_tap'];nodes={n.name:n for n in ac.body if isinstance(n,ast.FunctionDef)};lines=borrow.splitlines(True);helpers='\n'.join(''.join(lines[nodes[n].lineno-1:nodes[n].end_lineno]) for n in names)+'\n\n';text=text.replace('    def catalog_scenarios(self):',helpers+'    def catalog_scenarios(self):',1)
loop=next(n for n in nodes['catalog_scenarios'].body if isinstance(n,ast.For));branch=loop.body[2];assert ast.unparse(branch.test)=="step.get('menuTap') is True";fragment=''.join(lines[branch.lineno-1:branch.end_lineno]);anchor="            before = self.record('before-plan-' + step['name'])\n";assert text.count(anchor)==1;text=text.replace(anchor,anchor+fragment,1);text=text.replace('This isolated Royale QA accepts no document/poll reset exception.','This isolated menu QA accepts no document/poll reset exception.');write(runpath,text.encode())
testpath='joystick-games/qa/android/test_runner.py';tests=blob(testpath).decode();src=(Q/testpath).read_text();tt=ast.parse(src);cls=next(n for n in tt.body if isinstance(n,ast.ClassDef) and n.name=='MenuTapContracts');end=next(n.lineno for n in cls.body if isinstance(n,ast.FunctionDef) and n.name=='test_all_twelve_original_windows_stale_focus_samples_fail_new_plan')-1;code=''.join(src.splitlines(True)[cls.lineno-1:end]);code=code.replace('Royale','Penguintrack').replace('kart-royale','penguintrack').replace('1221895','2342332').replace('63b39ff300811e00401239ab5a4ec1206b6f96bfd8877e78399911e023038712','e1f9aa255413819bda917543c2d2258dd685a8eff61f982f26a98dfcfc827827');code=code.replace("'Y'","'DOWN'").replace('original_y_is_released','original_down_is_released');code=code.replace("'Right'", "'Controller'").replace("'Left'", "'Play'");code=code.replace("'menu': 'controls'", "'screen': 'menu'")
extra='''    def test_only_down_is_short_and_up_normalization_remains_original_held(self):
        p = runner.plan.load_plan(runner.ROOT/'joystick-games/penguintrack/qa-plan.json')
        self.assertEqual(len(p['steps']), 18)
        self.assertEqual(p['steps'][0]['keys'], ['UP']); self.assertNotIn('menuTap', p['steps'][0])
        self.assertEqual(p['steps'][1]['keys'], ['DOWN']); self.assertIs(p['steps'][1]['menuTap'], True)
        self.assertEqual([i for i, step in enumerate(p['steps']) if step.get('menuTap') is True], [1])
        before = self.state(53)
        self.assertTrue(runner.plan.matches(p['steps'][0]['expect'], runner.Acceptance.game(before), runner.Acceptance.game(before)))
        self.assertFalse(runner.plan.matches(p['steps'][1]['expect'], runner.Acceptance.game(before), runner.Acceptance.game(before)))

    def test_original_long_hold_end_focus_never_satisfies_play(self):
        # Selected fields from actual run44630032256, not synthetic successful gameplay.
        originals = [('normal', 87, 417, 2.2225834900000336), ('occupied', 84, 372, 2.226433608999969)]
        for mode, before_count, after_count, seconds in originals:
            before = self.state(before_count); after = self.state(after_count, index=2)
            after['game']['gameplay']['focus'] = 'SettingsSound, graphics, keys'
            self.assertGreater(seconds, .380)
            self.assertTrue(self.acceptance.frame_advanced(after, before), mode)
            self.assertTrue(self.acceptance.menu_released(after, before), mode)
            self.assertFalse(runner.plan.matches(self.step['expect'], runner.Acceptance.game(after), runner.Acceptance.game(before)), mode)

    def test_observer_delay_after_release_does_not_extend_real_sdk_hold(self):
        self.use_samples([self.state(101, index=2), self.state(102, index=2), self.state(103, index=2)])
        original = self.acceptance.snapshot; calls = []
        def slow(**kwargs):
            if not calls: time.sleep(.45)
            calls.append(True)
            return original(**kwargs)
        self.acceptance.snapshot = slow
        result = self.acceptance.catalog_menu_tap(self.step, self.state(100))
        record = self.acceptance.report['menuTapObservations'][0]
        self.assertGreaterEqual(record['elapsedSeconds'], .45)
        self.assertGreaterEqual(record['wire']['observedWireHeldMs'], 16)
        self.assertLess(record['wire']['observedWireHeldMs'], 380)
        self.assertEqual(record['wire']['matchingAcks'], 2)
        self.assertEqual(result['game']['controller']['pollCount'], 103)


'''
anchor='class Contracts(unittest.TestCase):';assert tests.count(anchor)==1;tests=tests.replace(anchor,code+extra+anchor,1);write(testpath,tests.encode())
for path in [planpath,runpath,testpath]:assert (C/path).read_bytes()!=blob(path)
record={'parentCommit':BASE,'sourceFiles':[{'path':n,**rec((C/n).read_bytes())} for n in [planpath,runpath,testpath]],'borrowedFrom':'kart-royale/docs/android-original-qa-isolation-attempt-1/executed-overlay','noLiveSourceEdited':True};(S/'source-inventory.json').write_text(json.dumps(record,indent=2)+'\n');shutil.copyfile(__file__,S/'executed-prepare.py');print(json.dumps(record,indent=2))
