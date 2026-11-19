#!/usr/bin/env python3
"""Synthetic provenance boundary tests; the probe fixture alone is a real old observation."""
import copy,hashlib,importlib.util,json,plistlib,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
spec=importlib.util.spec_from_file_location('macos_coverage',ROOT/'joystick-games/tools/macos-coverage.py');coverage=importlib.util.module_from_spec(spec);spec.loader.exec_module(coverage)
REAL_PROBE_BYTES=b'{\n  "method" : "Independent default WKWebView; three animation-frame samples; no game state access",\n  "processArchitecture" : "x86_64",\n  "samples" : [\n    {\n      "contextLost" : true,\n      "fragmentHighFloat" : null,\n      "glError" : 37442,\n      "renderer" : null,\n      "vendor" : null,\n      "version" : null,\n      "vertexHighFloat" : null\n    },\n    {\n      "contextLost" : true,\n      "fragmentHighFloat" : null,\n      "glError" : 0,\n      "renderer" : null,\n      "vendor" : null,\n      "version" : null,\n      "vertexHighFloat" : null\n    },\n    {\n      "contextLost" : true,\n      "fragmentHighFloat" : null,\n      "glError" : 0,\n      "renderer" : null,\n      "vendor" : null,\n      "version" : null,\n      "vertexHighFloat" : null\n    }\n  ],\n  "status" : "complete",\n  "systemVersion" : "Version 15.7.9 (Build 24G830)",\n  "url" : "http:\\/\\/127.0.0.1\\/",\n  "userAgent" : "Mozilla\\/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit\\/605.1.15 (KHTML, like Gecko)",\n  "webgl2ContextCreated" : true\n}'
REAL_PROBE_SHA256='9fa3123bc67099b564783941e61e7131a19d35def53f7702e45facdc7cd833b3'
REAL_PROBE_PROVENANCE={'exportCommit':'d26c8eabe88dea372fc342e38c3f48361bf72cd3','path':'joystick-macos-capability-macos-15-intel/webgl2-native.json','runId':44159596612,'note':'Old observation reused only as a unit-test fixture; never new native QA evidence.'}
TESTS=['Bonjour actual port and version','Original SDK and complete identity card','Real gameplay actions and START pause/resume','Three foreground cycles keep transport stable','Disconnect, held sync and same-ID reconnect','Real game storage reaches native persistence','Same-sequence ACK for every SDK message','Normal quit closes TCP','Native relaunch restores actual saves at a different origin']
class Coverage(unittest.TestCase):
    def setUp(self,game='dirt-crown'):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name).resolve();self.arm=self.root/'arm-artifact';self.intel=self.root/'intel-artifact';self.arm.mkdir();self.intel.mkdir()
        self.game=game;self.source='a'*40;self.qa=self.source;self.binary=hashlib.sha256(b'actual binary fixture').hexdigest()
        self.entry={'packageName':'com.ecojust.joystick.dirtcrown','appName':'DirtCrown','executable':'DirtCrown'}
        self.qa_plan={'storageRestartRequired':True}
        self.sources={coverage.VERIFY:b'original verifier fixture',coverage.QA_PLAN:b'original plan validator fixture','puretv-joystick/joystick_sdk.py':b'original SDK fixture','joystick-games/'+self.game+'/qa-plan.json':json.dumps(self.qa_plan).encode(),coverage.PROBE:b'original default WKWebView probe fixture',coverage.CAPABILITY:b'original capability helper fixture',coverage.NETWORK:b'original network helper fixture'}
        self.inputs={name:{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in self.sources.items()}
        self.meta={'game':self.game,'sourceCommit':self.source,'committedInputsVerified':True,'bundleIdentifier':self.entry['packageName'],'appName':'DirtCrown.app','architectures':['arm64','x86_64'],'signature':'ad-hoc','appleNotarized':False,'appFiles':{'Contents/MacOS/DirtCrown':{'bytes':21,'sha256':self.binary}},'inputFiles':copy.deepcopy(self.inputs)}
        self.plan={'sourceCommit':self.source,'runId':901,'runAttempt':2,'games':[self.game],'batches':[{'batch':'racing02','games':[self.game]}],'renderers':{self.game:['webgl2']},'inputFiles':copy.deepcopy(self.inputs)}
        for folder,runner,modes,arch in [(self.arm,'macos-latest',['native','occupied-port','rosetta'],'arm64'),(self.intel,'macos-15-intel',['native'],'x86_64')]:
            checks=[{'status':'passed','returncode':0} for _ in range(len(modes)+1)]
            self.put(folder/'batch-report.json',{'sourceCommit':self.source,'batch':'racing02','runner':runner,'expectedArchitecture':arch,'status':'passed','games':[{'game':self.game,'status':'passed','checks':checks}]})
            self.put(folder/self.game/'package-verification.json',{'status':'passed','game':self.game,'sourceCommit':self.source,'artifactSourceCommit':self.source,'qaSourceCommit':self.qa,'zipDmgAndInstalledCopyVerified':True,'completeFileSetVerified':True,'architectures':['arm64','x86_64'],'signature':'ad-hoc','appleNotarized':False})
            for mode in modes:
                process='x86_64' if mode=='rosetta' or runner=='macos-15-intel' else 'arm64'
                report={'status':'passed','game':self.game,'artifactSourceCommit':self.source,'qaSourceCommit':self.qa,'binarySha256':self.binary,'nativeProcessArchitecture':process,'initialization':{'classification':'ready','observedGame':{'renderer':'webgl2'}},'renderingAvailable':True,'tests':[{'name':name,'status':'passed'} for name in TESTS],'storageRestart':{'status':'passed','initialHydrationEqual':True,'newOriginVerified':True,'nativeSavedAfterQuit':{'save':'saved by fixture gameplay'}},'freshInstallSetup':{'reusedAcrossRestartOnly':True},'qaPlan':self.qa_plan,'sourceHashes':{name:item['sha256'] for name,item in self.inputs.items()},'startedAt':'2026-11-19T01:02:00+00:00','finishedAt':'2026-11-19T01:03:00+00:00'}
                report['screenshots']=[]
                for image_name in ('menu.png','playing.png'):
                    # Synthetic bytes only exercise evidence binding; no claim of native rendering.
                    data=b'\x89PNG\r\n\x1a\n'+image_name.encode()+b'fixture'*200;name='diagnostics/'+image_name
                    self.put(folder/self.game/mode/name,data);report['screenshots'].append({'path':name,'bytes':len(data),'sha256':coverage.digest(data)})
                self.put(folder/self.game/mode/'report.json',report)
                for local,source in [('executed-macos-verify.py',coverage.VERIFY),('executed-qa-plan.py',coverage.QA_PLAN),('executed-qa-plan.json','joystick-games/'+self.game+'/qa-plan.json'),('executed-allow-local-network.py',coverage.NETWORK)]:self.put(folder/self.game/mode/local,self.sources[source])
    def tearDown(self):self.tmp.cleanup()
    def put(self,path,value):
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(value if isinstance(value,bytes) else json.dumps(value).encode())
    def read(self,path):return json.loads(path.read_bytes())
    def change(self,path,callback):
        value=self.read(path);callback(value);self.put(path,value)
    def assess(self):return coverage.assess_game(self.game,self.meta,self.plan,self.entry,self.arm,self.intel)
    def enable_partial(self):
        self.entry['macosCoveragePolicy']=coverage.PARTIAL;self.plan['coveragePolicies']={self.game:coverage.PARTIAL}
        for folder,runner,name in [(self.arm,'macos-latest','Apple runner fixture'),(self.intel,'macos-15-intel','Intel runner fixture')]:
            for path in (folder/self.game).glob('*/report.json'):
                self.change(path,lambda value:value.update(qaRunId=901,qaRunAttempt=2,runnerKind=runner,runnerName=name))
    def partial_fixture(self,intel_pass=False):
        self.enable_partial()
        original_batch=(self.intel/'batch-report.json').read_bytes();original_game=(self.intel/self.game/'native/report.json').read_bytes()
        def fail_batch(value):value['status']='failed';value['games'][0]['status']='failed';value['games'][0]['checks'][1]={'status':'failed','returncode':1}
        self.change(self.intel/'batch-report.json',fail_batch)
        def fail(value):
            value.pop('initialization');value.pop('renderingAvailable')
            value.update(status='failed',failurePhase='initialization',error='Traceback (synthetic fixture)\nAssertionError: Native initialization terminal state timed out: {"game":null}',nativeProcessAlive=True,lastStateFresh=True,lastState={'ready':True,'active':True,'processArchitecture':'x86_64','game':None},tests=[])
        self.change(self.intel/self.game/'native/report.json',fail)
        observations={key:{'returncode':0,'stdout':value,'stderr':''} for key,value in [('hw.machine','x86_64\n'),('machdep.cpu.brand_string','Intel(R) Xeon(R)\n'),('sysctl.proc_translated','0\n'),('hw.optional.arm64','0\n')]}
        job={'id':502,'run_id':901,'run_attempt':2,'head_sha':self.qa,'runner_name':'Intel runner fixture','status':'in_progress','conclusion':None,'name':'verify (racing02, macos-15-intel)','labels':['macos-15-intel']}
        for phase,start,end in [('before','2026-11-19T01:00:00+00:00','2026-11-19T01:01:00+00:00'),('after','2026-11-19T01:04:00+00:00','2026-11-19T01:05:00+00:00')]:
            folder=self.intel/self.game/'capability'/phase
            record={'schemaVersion':1,'status':'observed','probeExitCode':0,'gamesOpened':False,'gameAssetsChanged':False,'game':self.game,'phase':phase,'sourceCommit':self.source,'qaSourceCommit':self.qa,'runId':901,'runAttempt':2,'runner':'macos-15-intel','runnerName':'Intel runner fixture','jobId':502,'job':job,'startedAt':start,'finishedAt':end,'host':{'processArchitecture':'x86_64','hardwareMachine':'x86_64','translatedProcess':False,'nativeIntelVerified':True,'sysctlObservations':observations},'package':{'game':self.game,'sourceCommit':self.source,'binarySha256':self.binary,'appFilesManifestSha256':coverage.digest(coverage.canonical(self.meta['appFiles']))},'probe':json.loads(REAL_PROBE_BYTES),'probeSourceSha256':self.inputs[coverage.PROBE]['sha256'],'probeBinarySha256':hashlib.sha256(b'probe fixture').hexdigest(),'binaryIncluded':False,'sourceHashes':{coverage.PROBE:self.inputs[coverage.PROBE]['sha256'],coverage.CAPABILITY:self.inputs[coverage.CAPABILITY]['sha256']},'executedSources':{'executed-webgl-probe.swift':self.inputs[coverage.PROBE],'executed-macos-capability.py':self.inputs[coverage.CAPABILITY]}}
            record['runnerImage']={'ImageOS':'macos15','ImageVersion':'synthetic-fixture','unavailableFields':[]}
            self.put(folder/'report.json',record);self.put(folder/'probe.json',REAL_PROBE_BYTES)
            for local,source in [('executed-webgl-probe.swift',coverage.PROBE),('executed-macos-capability.py',coverage.CAPABILITY)]:self.put(folder/local,self.sources[source])
            for key,value in observations.items():
                self.put(folder/(key+'-command.json'),{'command':['/usr/sbin/sysctl','-n',key],**value})
                for stream in ('stdout','stderr'):self.put(folder/(key+'-'+stream+'.log'),value[stream].encode())
            jobs=json.dumps({'total_count':1,'jobs':[job]})
            self.put(folder/'original-jobs-command.json',{'command':['gh','api','repos/ecojust/pureTV/actions/runs/901/attempts/2/jobs?per_page=100'],'returncode':0,'stdout':jobs,'stderr':''});self.put(folder/'original-jobs-stdout.log',jobs.encode());self.put(folder/'original-jobs-stderr.log',b'')
            sdk='/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk';binary='/private/tmp/puretv-native-capability-fixture/probe'
            commands={
                'system-version':(['/usr/bin/sw_vers'],'ProductVersion: 15.7.9\n','systemVersion'),
                'xcode-version':(['/usr/bin/xcodebuild','-version'],'Xcode fixture\n','xcodeVersion'),
                'swift-version':(['xcrun','swiftc','--version'],'Swift fixture\n','swiftVersion'),
                'sdk-path':(['xcrun','--sdk','macosx','--show-sdk-path'],sdk+'\n',None),
                'sdk-version':(['xcrun','--sdk','macosx','--show-sdk-version'],'15.0\n','sdkVersion'),
                'compile-probe':(['xcrun','swiftc','-swift-version','5','-target','x86_64-apple-macos11.0','-sdk',sdk,'-framework','AppKit','-framework','WebKit','/Users/runner/work/pureTV/pureTV/'+coverage.PROBE,'-o',binary],'',None),
                'sign-probe':(['/usr/bin/codesign','--force','--sign','-','--timestamp=none',binary],'',None),
                'probe':([binary,'/Users/runner/work/pureTV/pureTV/qa/'+self.game+'/capability/'+phase+'/probe.json'],'',None)}
            for name,(argv,stdout,field) in commands.items():
                self.put(folder/(name+'-command.json'),{'command':argv,'returncode':0,'stdout':stdout,'stderr':''})
                self.put(folder/(name+'-stdout.log'),stdout.encode());self.put(folder/(name+'-stderr.log'),b'')
                if field:record[field]=stdout.strip() if field=='sdkVersion' else stdout
            webkit={'CFBundleIdentifier':'com.apple.WebKit','CFBundleShortVersionString':'fixture','CFBundleVersion':'fixture'};webkit_bytes=plistlib.dumps(webkit)
            self.put(folder/'WebKit-Info.plist',webkit_bytes);record.update(webKitFramework=webkit,webKitInfoSha256=coverage.digest(webkit_bytes));self.put(folder/'report.json',record)
        if intel_pass:
            self.put(self.intel/'batch-report.json',original_batch);self.put(self.intel/self.game/'native/report.json',original_game)
            for phase in ('before','after'):
                folder=self.intel/self.game/'capability'/phase;record=self.read(folder/'report.json')
                for sample in record['probe']['samples']:
                    sample.update(contextLost=False,glError=0,version='WebGL 2.0',renderer='WebKit Renderer',vendor='WebKit',vertexHighFloat={'rangeMin':127,'rangeMax':127,'precision':23},fragmentHighFloat={'rangeMin':127,'rangeMax':127,'precision':23})
                self.put(folder/'report.json',record);self.put(folder/'probe.json',record['probe'])
    def fingerprints(self):return {str(p.relative_to(self.root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in self.root.rglob('*') if p.is_file()}
    def pon_fixture(self):
        # Surrounding success/provenance remains synthetic. The exact error and
        # reviewed bundle identity come from run 44596707197, not a new pass.
        self.tearDown();self.setUp('ponpoko-kart');self.partial_fixture()
        self.meta['webFiles']={'game.js':copy.deepcopy(coverage.PON_BUNDLE)};self.meta['inputFiles'][coverage.PON_BUNDLE_SOURCE]=copy.deepcopy(coverage.PON_BUNDLE)
        path=self.intel/self.game/'native/report.json'
        def failed(value):
            value['error']='Traceback (synthetic surrounding fixture)\nAssertionError: Game runtime errors: '+json.dumps([coverage.PON_PRECISION_ERROR],ensure_ascii=False)
            value['lastState']['game']={'game':'ponpoko-kart','stage':'error','renderer':'webgl2','webglVersion':None,'errors':[coverage.PON_PRECISION_ERROR],'frames':0,'paused':False,'audioState':'not_created','gameplay':{'mode':'boot','screen':'boot','renderCalls':0,'framePolls':0,'tick':0,'time':0,'worldTime':0},'controller':{'connected':False,'players':[],'pollCount':0}}
        self.change(path,failed)
    def http_fixture(self):
        harness='// Synthetic harness; not a native execution\n'
        test_source=('HARNESS = '+repr(harness)+'\nclass NativeLocalAssets:\n    def test_fixture(self): pass\n').encode()
        sources={coverage.HTTP_SOURCE:b'synthetic server source',coverage.HTTP_TEST:test_source,coverage.RUNTIME_WORKFLOW:b'synthetic workflow'}
        for name in ('backfire.opus','backfire.m4a','provenance.json','LICENSE.txt'):sources[coverage.AUDIO+name]=('synthetic audio fixture '+name).encode()
        inputs={name:{'bytes':len(data),'sha256':coverage.digest(data)} for name,data in sources.items()};self.plan['inputFiles'].update(inputs)
        for folder,arch in [(self.arm,'arm64'),(self.intel,'x86_64')]:
            self.change(folder/'batch-report.json',lambda value:value.update(localAssetHttp={'status':'passed','returncode':0,'command':['python3',coverage.HTTP_TEST],'log':'local-assets.log','startedAt':'2026-11-19T00:59:00+00:00'}))
            self.put(folder/'local-assets.log',b'Synthetic transcript only\nRan 1 test in 0.1s\n\nOK\n')
            self.put(folder/'local-assets-source-inputs.json',{'qaSourceCommit':self.plan.get('qaSourceCommit',self.source),'artifactSourceCommit':self.source,'runnerArchitecture':arch,'files':inputs})
            for name,data in sources.items():self.put(folder/'executed-source'/name,data)
            context={'status':'compiled','architecture':arch,'system':'synthetic system','swiftVersion':'synthetic compiler','sourceSha256':inputs[coverage.HTTP_SOURCE]['sha256'],'testSha256':inputs[coverage.HTTP_TEST]['sha256'],'harnessSha256':coverage.digest(harness.encode()),'binarySha256':coverage.digest(b'synthetic binary'),'command':['xcrun','swiftc','-swift-version','5','-O','/Users/runner/work/pureTV/pureTV/'+coverage.HTTP_SOURCE,'/private/tmp/fixture/main.swift','-framework','Network','-o','/private/tmp/fixture/asset-server-test']}
            self.put(folder/'local-assets-compile/compile-context.json',context);self.put(folder/'local-assets-compile/main.swift',harness.encode())
            case=folder/'local-assets-compile/cases/test_fixture';self.put(case/'0-process.json',{'command':['/private/tmp/fixture/asset-server-test','/private/tmp/fixture/Web'],'exitCode':-15,'terminationAfterTestIsExpected':True});self.put(case/'0-stdout.log',b'READY synthetic fixture');self.put(case/'0-stderr.log',b'')
    def blocked(self):
        with self.assertRaises((AssertionError,KeyError,ValueError,StopIteration)):self.assess()
    def kart_fallback_fixture(self,intel_pass=False,primary='webgl2'):
        self.tearDown();self.setUp('kart-rush')
        self.qa_plan.update(renderer=primary,compatibleRenderers=['webgl2','webgl1'])
        name='joystick-games/'+self.game+'/qa-plan.json';data=json.dumps(self.qa_plan).encode();record={'bytes':len(data),'sha256':coverage.digest(data)}
        self.sources[name]=data;self.inputs[name]=record;self.meta['inputFiles'][name]=record;self.plan['inputFiles'][name]=record
        self.plan['renderers'][self.game]=['webgl2','webgl1']
        for folder in (self.arm,self.intel):
            for path in (folder/self.game).glob('*/report.json'):
                def update(value):value['qaPlan']=copy.deepcopy(self.qa_plan);value['sourceHashes'][name]=record['sha256']
                self.change(path,update);self.put(path.parent/'executed-qa-plan.json',data)
        self.partial_fixture(intel_pass=intel_pass)
    def test_only_kart_rush_exact_fallback_plan_is_approved(self):
        entry={'macosCoveragePolicy':coverage.PARTIAL}
        self.assertEqual(coverage.policy('kart-rush',entry,['webgl2','webgl1']),coverage.PARTIAL)
        for game,renderers in [('turbo-kart-rush',['webgl2','webgl1']),('dirt-crown',['webgl2','webgl1']),('old-game',['webgl2','webgl1']),('kart-rush',['webgl1','webgl2']),('kart-rush',['webgl1']),('kart-rush',['webgl2','webgl1','canvas']),('kart-rush',['webgl2','webgl1','webgl1'])]:
            with self.subTest(game=game,renderers=renderers),self.assertRaises(AssertionError):coverage.policy(game,entry,renderers)
    def test_kart_rush_intel_observation_never_claims_webgl1_or_failure_cause(self):
        self.kart_fallback_fixture();before=self.fingerprints();result=self.assess();intel=result['verificationCoverage']['intelNative']
        self.assertEqual(result['deliveryEligibility'],'eligible_with_intel_unverified');self.assertEqual(result['rendererPlan'],{'primary':'webgl2','accepted':['webgl2','webgl1'],'fallbackPreserved':True})
        self.assertEqual(intel['status'],'unverified');self.assertEqual(intel['originalGameQaStatus'],'failed');self.assertFalse(intel['gameFailureCauseProven']);self.assertFalse(intel['actualGameRendererVerified']);self.assertEqual(intel['rendererObservations'],{'webgl2':'independent_probe_context_lost','webgl1':'unobserved'})
        for mode in ('appleSiliconNative','appleSiliconOccupiedPort','appleSiliconRosetta'):self.assertEqual(result['verificationCoverage'][mode]['observedRenderer'],'webgl2')
        self.assertEqual(self.fingerprints(),before)
    def test_kart_rush_actual_webgl1_remains_valid_and_is_recorded_without_inference(self):
        self.kart_fallback_fixture(intel_pass=True)
        for folder,modes in ((self.arm,('native','occupied-port','rosetta')),(self.intel,('native',))):
            for mode in modes:self.change(folder/self.game/mode/'report.json',lambda value:value['initialization']['observedGame'].update(renderer='webgl1'))
        result=self.assess();self.assertEqual(result['overallGameplayVerification'],'complete')
        for value in result['verificationCoverage'].values():self.assertEqual(value['observedRenderer'],'webgl1');self.assertEqual(value['status'],'passed');self.assertNotIn('rendererObservations',value)
    def test_kart_rush_source_bound_primary_and_fallback_are_required(self):
        self.kart_fallback_fixture(primary='webgl1');self.blocked()
        self.kart_fallback_fixture();path=self.intel/self.game/'native/report.json';self.change(path,lambda value:value['qaPlan'].pop('compatibleRenderers'));self.blocked()
    def test_kart_rush_unknown_renderer_failed_actual_checks_and_intel_errors_block(self):
        self.kart_fallback_fixture()
        for mode in ('native','occupied-port','rosetta'):
            path=self.arm/self.game/mode/'report.json';original=path.read_bytes()
            for mutate in (lambda value:value['initialization']['observedGame'].update(renderer='canvas'),lambda value:value['tests'][2].update(status='failed'),lambda value:value.update(renderingAvailable=False)):
                self.change(path,mutate);self.blocked();path.write_bytes(original)
        path=self.intel/self.game/'native/report.json';original=path.read_bytes()
        for update in ({'game':{'errors':['WebGL1 failed']}},{'game':{'errors':[coverage.PON_PRECISION_ERROR]}},{'resourceErrors':['missing fallback module']},{'lastJavaScriptError':'TypeError'}):
            self.change(path,lambda value:value['lastState'].update(update));self.blocked();path.write_bytes(original)
        self.entry.pop('macosCoveragePolicy');self.plan.pop('coveragePolicies');self.blocked()
    def test_real_probe_fixture_retains_original_bytes_and_provenance(self):
        self.assertEqual(hashlib.sha256(REAL_PROBE_BYTES).hexdigest(),REAL_PROBE_SHA256);self.assertEqual(json.loads(REAL_PROBE_BYTES)['samples'][0]['glError'],37442);self.assertEqual(REAL_PROBE_PROVENANCE['runId'],44159596612)
    def test_default_full_still_needs_no_probe_but_limited_policy_binds_intel_hardware(self):
        self.assertEqual(self.assess()['overallGameplayVerification'],'complete');self.enable_partial();self.blocked()
        self.partial_fixture(intel_pass=True);self.assertEqual(self.assess()['overallGameplayVerification'],'complete');self.assertEqual(self.assess()['deliveryEligibility'],'eligible')
        self.assertEqual(coverage.policy('legacy-canvas',{},['canvas']),'full-v1')
    def test_partial_keeps_original_failure_and_all_input_bytes_unchanged(self):
        self.partial_fixture();before=self.fingerprints();result=self.assess();self.assertEqual(result['overallGameplayVerification'],'partial');self.assertEqual(result['deliveryEligibility'],'eligible_with_intel_unverified');self.assertEqual(result['verificationCoverage']['intelNative']['originalGameQaStatus'],'failed');self.assertFalse(result['verificationCoverage']['intelNative']['gameFailureCauseProven']);self.assertEqual(self.fingerprints(),before);self.assertGreater(len(result['evidenceFiles']),30)
    def test_default_full_never_waives_intel_failure(self):
        self.partial_fixture();self.entry.pop('macosCoveragePolicy');self.plan.pop('coveragePolicies');self.blocked()
    def test_unknown_policy_unregistered_game_renderer_and_plan_mismatch_block(self):
        for game,entry,renderer in [('dirt-crown',{'macosCoveragePolicy':'anything'},['webgl2']),('old-game',{'macosCoveragePolicy':coverage.PARTIAL},['webgl2']),('dirt-crown',{'macosCoveragePolicy':coverage.PARTIAL},['webgl','webgl2'])]:
            with self.subTest(game=game,entry=entry),self.assertRaises(AssertionError):coverage.policy(game,entry,renderer)
        self.entry['macosCoveragePolicy']=coverage.PARTIAL;self.blocked()
    def test_missing_or_different_executed_source_blocks(self):
        path=self.arm/self.game/'native/executed-macos-verify.py';path.write_bytes(b'changed');self.blocked()
    def test_required_source_hash_cannot_be_omitted(self):
        self.change(self.arm/self.game/'native/report.json',lambda value:value['sourceHashes'].pop('puretv-joystick/joystick_sdk.py'));self.blocked()
    def test_protocol_only_or_failed_arm_or_rosetta_never_qualifies(self):
        for mode in ('native','occupied-port','rosetta'):
            path=self.arm/self.game/mode/'report.json';old=path.read_bytes();self.change(path,lambda value:value.update(tests=value['tests'][:2]));self.blocked();path.write_bytes(old)
            self.change(path,lambda value:value.update(status='limited_graphics'));self.blocked();path.write_bytes(old)
    def test_actual_storage_result_and_fresh_origin_are_required(self):
        path=self.arm/self.game/'native/report.json';old=path.read_bytes();self.change(path,lambda value:value['storageRestart'].update(nativeSavedAfterQuit={}));self.blocked();path.write_bytes(old)
        self.change(path,lambda value:value['storageRestart'].update(newOriginVerified=False));self.blocked()
    def test_installed_package_identity_and_original_binary_are_required(self):
        path=self.intel/self.game/'package-verification.json';self.change(path,lambda value:value.update(completeFileSetVerified=False));self.blocked()
    def test_missing_fresh_alive_navigation_architecture_or_phase_blocks(self):
        self.partial_fixture();path=self.intel/self.game/'native/report.json';old=path.read_bytes()
        for update in ({'nativeProcessAlive':False},{'lastStateFresh':False},{'nativeProcessArchitecture':'arm64'},{'failurePhase':'storage_restart'},{'lastState':{'game':None}},{'tests':[{'name':'protocol','status':'passed'}]}):
            self.change(path,lambda value:value.update(update));self.blocked();path.write_bytes(old)
    def test_explicit_non_graphics_and_unclassified_errors_block(self):
        self.partial_fixture();path=self.intel/self.game/'native/report.json';old=path.read_bytes()
        for state in ({'lastJavaScriptError':'SyntaxError'},{'diagnosticError':'native script error'},{'resourceErrors':['missing module']},{'game':{'errors':['unhandled']}},{'game':{'error':'permission denied'}}):
            self.change(path,lambda value:value['lastState'].update(state));self.blocked();path.write_bytes(old)
    def test_ready_then_storage_failure_and_unknown_initialization_exceptions_block(self):
        self.partial_fixture();path=self.intel/self.game/'native/report.json';original=path.read_bytes()
        for update in ({'initialization':{'classification':'ready'}},{'renderingAvailable':True},{'error':'AssertionError: Fresh test domain unexpectedly restored saved game data'},{'error':'KeyError: missing field'}):
            self.change(path,lambda value:value.update(update));self.blocked();path.write_bytes(original)
    def test_exact_frozen_pon_constructor_error_remains_failed_and_intel_unverified(self):
        self.pon_fixture();before=self.fingerprints();result=self.assess();intel=result['verificationCoverage']['intelNative']
        self.assertEqual(intel['status'],'unverified');self.assertEqual(intel['originalGameQaStatus'],'failed');self.assertFalse(intel['gameFailureCauseProven']);self.assertFalse(intel['boundedInitializationEvidence']['originalJavaScriptStackCaptured']);self.assertEqual(intel['boundedInitializationEvidence']['bundle'],coverage.PON_BUNDLE);self.assertEqual(self.fingerprints(),before)
        report=self.read(self.intel/self.game/'native/report.json')
        with self.assertRaises(AssertionError):coverage.failed_initialization(report)
        with self.assertRaises(AssertionError):coverage.failed_initialization(report,'dirt-crown',self.meta)
    def test_pon_bundle_must_match_both_packaged_web_and_frozen_source(self):
        self.pon_fixture()
        for section,key in [('webFiles','game.js'),('inputFiles',coverage.PON_BUNDLE_SOURCE)]:
            original=copy.deepcopy(self.meta[section][key])
            for value in ({'bytes':original['bytes']+1,'sha256':original['sha256']},{'bytes':original['bytes'],'sha256':'b'*64}):
                self.meta[section][key]=value;self.blocked()
            self.meta[section][key]=original
    def test_pon_unknown_additional_and_generic_precision_errors_are_blocked(self):
        self.pon_fixture();path=self.intel/self.game/'native/report.json';original=path.read_bytes()
        for errors in ([coverage.PON_PRECISION_ERROR,'SyntaxError: missing module'],['null precision'],[coverage.PON_PRECISION_ERROR.replace('i.getShaderPrecisionFormat','j.getShaderPrecisionFormat')],['TypeError: '+coverage.PON_PRECISION_ERROR]):
            def mutate(value):value['lastState']['game']['errors']=errors;value['error']='AssertionError: Game runtime errors: '+json.dumps(errors,ensure_ascii=False)
            self.change(path,mutate);self.blocked();path.write_bytes(original)
        self.change(path,lambda value:value.update(error='AssertionError: Actual game initialization failed: '+coverage.PON_PRECISION_ERROR));self.blocked()
    def test_pon_non_boot_rendered_or_later_constructor_state_is_blocked(self):
        self.pon_fixture();path=self.intel/self.game/'native/report.json';original=path.read_bytes()
        for update in ({'frames':1},{'frames':False},{'stage':'playing'},{'webglVersion':2},{'audioState':'running'},{'error':'additional error'},{'stack':'new original evidence requires review'}):
            self.change(path,lambda value:value['lastState']['game'].update(update));self.blocked();path.write_bytes(original)
        for update in ({'mode':'menu'},{'screen':'race'},{'renderCalls':1},{'framePolls':1},{'tick':1},{'worldTime':1}):
            self.change(path,lambda value:value['lastState']['game']['gameplay'].update(update));self.blocked();path.write_bytes(original)
        self.change(path,lambda value:value['lastState']['game']['controller'].update(pollCount=1));self.blocked()
    def test_pon_does_not_waive_healthy_probe_or_failed_arm_gameplay(self):
        self.pon_fixture();path=self.arm/self.game/'rosetta/report.json';original=path.read_bytes();self.change(path,lambda value:value.update(status='failed'));self.blocked();path.write_bytes(original)
        folder=self.intel/self.game/'capability/after';record=self.read(folder/'report.json');record['probe']['samples'][0]['contextLost']=False;self.put(folder/'report.json',record);self.put(folder/'probe.json',record['probe']);self.blocked()
    def test_probe_samples_errors_missing_or_healthy_cannot_qualify(self):
        self.partial_fixture();folder=self.intel/self.game/'capability/before';original=self.read(folder/'report.json')
        for changed in ('healthy','missing','error','notcreated','failed'):
            value=copy.deepcopy(original)
            if changed=='healthy':value['probe']['samples'][1]['contextLost']=False
            elif changed=='missing':value['probe']['samples'].pop()
            elif changed=='error':value['probe']['samples'][0]['error']='script failed'
            elif changed=='notcreated':value['probe']['webgl2ContextCreated']=False
            else:value['status']='failed'
            self.put(folder/'report.json',value);self.put(folder/'probe.json',value['probe']);self.blocked()
    def test_raw_probe_or_command_log_disagreement_blocks(self):
        self.partial_fixture();folder=self.intel/self.game/'capability/before';self.put(folder/'probe.json',{});self.blocked();self.put(folder/'probe.json',REAL_PROBE_BYTES)
        self.put(folder/'probe-stdout.log',b'not original');self.blocked()
    def test_old_run_attempt_job_host_or_package_observation_blocks(self):
        self.partial_fixture();path=self.intel/self.game/'capability/after/report.json';old=path.read_bytes()
        for update in ({'runId':900},{'runAttempt':1},{'runAttempt':True},{'jobId':999},{'runnerName':'different host'},{'sourceCommit':'b'*40},{'qaSourceCommit':'b'*40},{'package':{'game':'other'}}):
            self.change(path,lambda value:value.update(update));self.blocked();path.write_bytes(old)
    def test_probe_must_bracket_current_game_run(self):
        self.partial_fixture();path=self.intel/self.game/'capability/before/report.json';self.change(path,lambda value:value.update(finishedAt='2026-11-19T01:03:00+00:00'));self.blocked()
    def test_rosetta_claiming_intel_and_unknown_sysctl_errors_block(self):
        self.partial_fixture();path=self.intel/self.game/'capability/before/report.json';old=path.read_bytes()
        for key,value in [('machdep.cpu.brand_string',{'returncode':0,'stdout':'Apple M4','stderr':''}),('hw.optional.arm64',{'returncode':0,'stdout':'1','stderr':''}),('sysctl.proc_translated',{'returncode':1,'stdout':'','stderr':'permission denied'}),('hw.machine',{'returncode':0,'stdout':'x86_64','stderr':'warning'})]:
            self.change(path,lambda row:row['host']['sysctlObservations'].update({key:value}));self.blocked();path.write_bytes(old)
    def test_original_raw_sysctl_and_api_job_bytes_are_bound(self):
        self.partial_fixture();folder=self.intel/self.game/'capability/before';self.put(folder/'hw.machine-stdout.log',b'arm64');self.blocked();self.put(folder/'hw.machine-stdout.log',b'x86_64\n')
        self.put(folder/'original-jobs-stdout.log',{'total_count':0,'jobs':[]});self.blocked()
    def test_source_symlink_or_traversal_is_never_read_as_evidence(self):
        reader=coverage.Evidence(self.arm)
        with self.assertRaises(AssertionError):reader.bytes('../outside')
        path=self.arm/self.game/'native/executed-macos-verify.py';path.unlink()
        try:path.symlink_to(self.intel/self.game/'native/executed-macos-verify.py')
        except OSError:self.skipTest('Symlink creation unavailable')
        self.blocked()
    def test_evidence_directory_ancestor_symlink_is_rejected(self):
        alias=self.root/'alias';alias.symlink_to(self.arm,target_is_directory=True)
        with self.assertRaises(AssertionError):coverage.Evidence(alias/self.game)
    def test_limited_passed_modes_require_original_menu_and_gameplay_images(self):
        self.partial_fixture(intel_pass=True)
        for folder,mode in [(self.arm,'native'),(self.arm,'occupied-port'),(self.arm,'rosetta'),(self.intel,'native')]:
            path=folder/self.game/mode/'diagnostics/playing.png';original=path.read_bytes();path.unlink();self.blocked();path.write_bytes(original)
            path.write_bytes(original+b'changed');self.blocked();path.write_bytes(original)
        result=self.assess();self.assertIn('intel-artifact/'+self.game+'/native/diagnostics/playing.png',result['evidenceFiles'])
    def test_capability_environment_and_signature_raw_evidence_are_required(self):
        self.partial_fixture();folder=self.intel/self.game/'capability/before'
        for name in ('WebKit-Info.plist','system-version-stdout.log','xcode-version-command.json','swift-version-stderr.log','sdk-path-stdout.log','sdk-version-command.json','sign-probe-command.json'):
            path=folder/name;original=path.read_bytes();path.unlink();self.blocked();path.write_bytes(original)
        self.change(folder/'report.json',lambda value:value['webKitFramework'].update(CFBundleVersion='wrong'));self.blocked()
    def test_probe_compile_sign_execution_and_output_chain_must_match(self):
        self.partial_fixture();folder=self.intel/self.game/'capability/before'
        for name,index,value in [('compile-probe',5,'arm64-apple-macos11.0'),('compile-probe',7,'/wrong/sdk'),('compile-probe',12,'/wrong/probe.swift'),('compile-probe',14,'/tmp/other'),('sign-probe',5,'/tmp/other'),('probe',0,'/tmp/other'),('probe',1,'/other/game/capability/before/probe.json')]:
            path=folder/(name+'-command.json');original=path.read_bytes();self.change(path,lambda row:row['command'].__setitem__(index,value));self.blocked();path.write_bytes(original)
    def test_same_run_attempt_and_runner_are_required_for_every_limited_mode(self):
        self.partial_fixture()
        for folder,mode in [(self.arm,'native'),(self.arm,'occupied-port'),(self.arm,'rosetta'),(self.intel,'native')]:
            path=folder/self.game/mode/'report.json';old=path.read_bytes()
            for update in ({'qaRunId':900},{'qaRunAttempt':1},{'qaRunAttempt':True},{'runnerKind':'wrong-runner'}):
                self.change(path,lambda value:value.update(update));self.blocked();path.write_bytes(old)
        path=self.intel/self.game/'native/report.json';self.change(path,lambda value:value.update(runnerName='another Intel runner'));self.blocked()
    def test_recognized_missing_native_intel_sysctl_keys_remain_auditable(self):
        self.partial_fixture()
        for phase in ('before','after'):
            folder=self.intel/self.game/'capability'/phase
            for key in ('sysctl.proc_translated','hw.optional.arm64'):
                observation={'returncode':1,'stdout':'','stderr':"sysctl: unknown oid '"+key+"'\n"}
                self.change(folder/'report.json',lambda value:value['host']['sysctlObservations'].update({key:observation}))
                self.put(folder/(key+'-command.json'),{'command':['/usr/sbin/sysctl','-n',key],**observation})
                for stream in ('stdout','stderr'):self.put(folder/(key+'-'+stream+'.log'),observation[stream].encode())
        self.assertEqual(self.assess()['overallGameplayVerification'],'partial')
    def test_runner_image_missing_values_are_explicit_and_same_before_after(self):
        self.partial_fixture()
        for phase in ('before','after'):
            self.change(self.intel/self.game/'capability'/phase/'report.json',lambda value:value.update(runnerImage={'ImageOS':None,'ImageVersion':None,'unavailableFields':['ImageOS','ImageVersion']}))
        self.assertEqual(self.assess()['overallGameplayVerification'],'partial')
        self.change(self.intel/self.game/'capability/after/report.json',lambda value:value['runnerImage'].update(unavailableFields=[]));self.blocked()
    def test_valid_runtime_reuse_binds_new_qa_to_unchanged_original_package(self):
        self.plan.update(artifactRunId=801,artifactRunAttempt=3,qaSourceCommit='b'*40)
        new_source=b'new QA verifier fixture';self.plan['inputFiles'][coverage.VERIFY]={'bytes':len(new_source),'sha256':hashlib.sha256(new_source).hexdigest()}
        for folder in (self.arm,self.intel):
            self.change(folder/'batch-report.json',lambda value:value.update(qaSourceCommit='b'*40))
            self.change(folder/self.game/'package-verification.json',lambda value:value.update(qaSourceCommit='b'*40,artifactRunId=801,artifactRunAttempt=3,originalPackageBytesReused=True))
            for path in (folder/self.game).glob('*/report.json'):
                def update(value):
                    value.update(qaSourceCommit='b'*40,artifactRunId='801');value['sourceHashes'][coverage.VERIFY]=hashlib.sha256(new_source).hexdigest()
                self.change(path,update);self.put(path.parent/'executed-macos-verify.py',new_source)
        self.http_fixture();result=self.assess();self.assertEqual(result['artifactSourceCommit'],self.source);self.assertEqual(result['qaSourceCommit'],'b'*40);self.assertEqual(result['overallGameplayVerification'],'complete')
    def test_runtime_http_failure_missing_raw_source_or_compile_case_blocks_partial(self):
        self.partial_fixture();self.plan.update(artifactRunId=801,artifactRunAttempt=3)
        for folder in (self.arm,self.intel):
            self.change(folder/self.game/'package-verification.json',lambda value:value.update(artifactRunId=801,artifactRunAttempt=3,originalPackageBytesReused=True))
            for path in (folder/self.game).glob('*/report.json'):self.change(path,lambda value:value.update(artifactRunId='801'))
        self.http_fixture();self.assertEqual(self.assess()['overallGameplayVerification'],'partial')
        batch=self.intel/'batch-report.json';original=batch.read_bytes();self.change(batch,lambda value:value['localAssetHttp'].update(status='failed',returncode=1));self.blocked();batch.write_bytes(original)
        for name in ('local-assets.log','executed-source/'+coverage.HTTP_SOURCE,'executed-source/'+coverage.AUDIO+'backfire.opus','local-assets-compile/main.swift','local-assets-compile/cases/test_fixture/0-stdout.log'):
            path=self.intel/name;original=path.read_bytes();path.unlink();self.blocked();path.write_bytes(original)
        self.change(self.intel/'local-assets-compile/compile-context.json',lambda value:value.update(architecture='arm64'));self.blocked()
    def mixed_triple(self):
        others=[game for game in ('backroad-rally','night-racer','last-track') if game!=self.game][:2]
        self.plan['games']=[self.game,*others];self.plan['batches'][0]['games']=[self.game,*others]
        for folder,runner in [(self.arm,'macos-latest'),(self.intel,'macos-15-intel')]:
            def mixed(value):
                value['games'] += [{'game':others[0],'status':'failed','checks':[]},{'game':others[1],'status':'passed','checks':[]}]
                value['status']='failed'
            self.change(folder/'batch-report.json',mixed)
            for path in (folder/self.game).glob('*/report.json'):
                self.change(path,lambda value:value.update(qaRunId=901,qaRunAttempt=2,runnerKind=runner,runnerName='Apple runner fixture' if runner=='macos-latest' else 'Intel runner fixture'))
        return others
    def assess_per_game(self):return coverage.assess_game(self.game,self.meta,self.plan,self.entry,self.arm,self.intel,per_game=True)
    def blocked_per_game(self):
        with self.assertRaises((AssertionError,KeyError,ValueError,StopIteration)):self.assess_per_game()
    def test_per_game_true_target_in_failed_mixed_batch_preserves_every_original(self):
        others=self.mixed_triple();before=self.fingerprints();self.blocked()
        result=self.assess_per_game()
        self.assertEqual(result['deliveryEligibility'],'eligible');self.assertTrue(result['batchFailed']);self.assertTrue(result['targetVerified'])
        self.assertEqual(result['originalBatchStatuses'],{'macos-latest':'failed','macos-15-intel':'failed'})
        self.assertEqual(result['failedOtherGames'],[{'runner':runner,'game':others[0],'status':'failed'} for runner in ('macos-latest','macos-15-intel')])
        self.assertEqual(result['overallGameplayVerification'],'complete');self.assertEqual(before,self.fingerprints())
    def test_per_game_partial_target_keeps_intel_unverified_and_failed_batch(self):
        self.pon_fixture();self.mixed_triple();before=self.fingerprints();self.blocked()
        result=self.assess_per_game()
        self.assertEqual(result['deliveryEligibility'],'eligible_with_intel_unverified');self.assertTrue(result['targetVerified'])
        self.assertEqual(result['verificationCoverage']['intelNative']['originalGameQaStatus'],'failed')
        self.assertEqual(result['verificationCoverage']['intelNative']['status'],'unverified');self.assertTrue(result['batchFailed'])
        self.assertEqual(before,self.fingerprints())
    def test_per_game_failed_target_record_cannot_borrow_other_success(self):
        self.mixed_triple();self.change(self.arm/'batch-report.json',lambda value:value['games'][0].update(status='failed'));self.blocked_per_game()
    def test_per_game_failed_target_mode_still_blocks(self):
        self.mixed_triple()
        for mode in ('native','occupied-port','rosetta'):
            path=self.arm/self.game/mode/'report.json';old=path.read_bytes()
            self.change(path,lambda value:value.update(status='failed'));self.blocked_per_game();path.write_bytes(old)
    def test_per_game_false_passed_target_test_still_blocks(self):
        self.mixed_triple();self.change(self.arm/self.game/'native/report.json',lambda value:value['tests'][2].update(status='failed'));self.blocked_per_game()
    def test_per_game_missing_target_mode_or_image_still_blocks(self):
        self.mixed_triple()
        for relative in ('rosetta/report.json','occupied-port/diagnostics/playing.png'):
            path=self.arm/self.game/relative;old=path.read_bytes();path.unlink();self.blocked_per_game();path.write_bytes(old)
        self.change(self.arm/'batch-report.json',lambda value:value['games'][0]['checks'].pop());self.blocked_per_game()
    def test_per_game_source_and_actual_run_identity_cannot_change(self):
        self.mixed_triple();path=self.arm/self.game/'native/report.json';old=path.read_bytes()
        for change in ({'artifactSourceCommit':'b'*40},{'qaSourceCommit':'b'*40},{'qaRunId':902},{'qaRunAttempt':1},{'runnerKind':'macos-15-intel'}):
            self.change(path,lambda value:value.update(change));self.blocked_per_game();path.write_bytes(old)
        self.plan['sourceCommit']='b'*40;self.blocked_per_game()
    def test_per_game_missing_original_package_validation_still_blocks(self):
        self.mixed_triple();self.change(self.arm/self.game/'package-verification.json',lambda value:value.update(completeFileSetVerified=False));self.blocked_per_game()
    def test_per_game_incomplete_or_reordered_original_triple_blocks(self):
        self.mixed_triple();path=self.arm/'batch-report.json';old=path.read_bytes()
        self.change(path,lambda value:value['games'].pop());self.blocked_per_game();path.write_bytes(old)
        self.change(path,lambda value:value['games'].reverse());self.blocked_per_game();path.write_bytes(old)
        self.plan['batches'][0]['games'].pop();self.blocked_per_game()
    def test_per_game_unexplained_original_batch_failure_still_blocks(self):
        self.mixed_triple()
        def conceal(value):
            for game in value['games']:game['status']='passed'
        self.change(self.arm/'batch-report.json',conceal);self.blocked_per_game()
    def test_per_game_true_target_in_passed_batch_reports_no_other_failures(self):
        self.mixed_triple()
        for folder in (self.arm,self.intel):
            def passed(value):
                value['status']='passed'
                for game in value['games']:game['status']='passed'
            self.change(folder/'batch-report.json',passed)
        result=self.assess_per_game();self.assertFalse(result['batchFailed']);self.assertEqual(result['failedOtherGames'],[])
    def test_per_game_default_full_policy_cannot_waive_failed_intel(self):
        self.partial_fixture();self.mixed_triple();self.entry.pop('macosCoveragePolicy');self.plan.pop('coveragePolicies');self.blocked_per_game()
    def test_runtime_reuse_needs_exact_original_source_run_attempt_and_bytes(self):
        self.plan.update(artifactRunId=801,artifactRunAttempt=3)
        self.blocked()
if __name__=='__main__':unittest.main()
