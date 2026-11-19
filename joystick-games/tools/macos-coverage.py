#!/usr/bin/env python3
"""Validate native coverage without changing any original game QA result."""
import argparse,ast,datetime,hashlib,json,plistlib,re
from pathlib import Path,PurePosixPath
FULL='full-v1'
PARTIAL='arm-rosetta-with-intel-observation-v1'
RACING_NINE=frozenset(('backroad-rally','ponpoko-kart','night-racer','penguintrack','last-track','dirt-crown','turbo-kart-rush','kart-rush','kart-royale'))
TEST_NAMES=(
 'Bonjour actual port and version','Original SDK and complete identity card',
 'Real gameplay actions and START pause/resume','Three foreground cycles keep transport stable',
 'Disconnect, held sync and same-ID reconnect','Real game storage reaches native persistence',
 'Same-sequence ACK for every SDK message','Normal quit closes TCP',
 'Native relaunch restores actual saves at a different origin')
VERIFY='joystick-games/tools/macos-verify.py'
QA_PLAN='joystick-games/tools/qa-plan.py'
NETWORK='joystick-games/shared/macos/tools/allow-local-network.py'
PROBE='joystick-games/shared/macos/tools/webgl-probe.swift'
CAPABILITY='joystick-games/tools/macos-capability.py'
HTTP_SOURCE='joystick-games/shared/macos/Sources/LocalAssetServer.swift'
HTTP_TEST='joystick-games/shared/macos/tests/local-assets.test.py'
RUNTIME_WORKFLOW='.github/workflows/joystick-catalog-macos-runtime.yml'
AUDIO='joystick-games/tools/fixtures/audio/'
PON_PRECISION_ERROR="null is not an object (evaluating 'i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision')"
PON_BUNDLE={'bytes':1561049,'sha256':'b26270b854a7672d67e36e987c2a5c938044556d5b91fc480c41211a5b959729'}
PON_BUNDLE_SOURCE='joystick-games/ponpoko-kart/dist/game.js'

def digest(data):return hashlib.sha256(data).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def sha(value):assert isinstance(value,str) and re.fullmatch('[a-f0-9]{64}',value),'Invalid SHA256';return value
def commit(value):assert isinstance(value,str) and re.fullmatch('[a-f0-9]{40}',value),'Invalid source commit';return value
def positive(value):assert type(value) is int and value>0,'Invalid numeric identity';return value
def timestamp(value):
    assert isinstance(value,str),'Missing execution timestamp'
    parsed=datetime.datetime.fromisoformat(value.replace('Z','+00:00'));assert parsed.tzinfo is not None,'Timestamp requires timezone';return parsed

def policy(game,entry,renderers):
    assert isinstance(entry,dict),'Missing registry entry'
    value=entry.get('macosCoveragePolicy',FULL)
    assert value in (FULL,PARTIAL),'Unknown macOS coverage policy'
    if value==PARTIAL:
        assert game in RACING_NINE,'Limited coverage is restricted to the approved nine racers'
        assert renderers==['webgl2'],'Limited coverage requires the exact WebGL2 renderer plan'
    return value

class Evidence:
    def __init__(self,folder):
        original=Path(folder).absolute();assert original.is_dir() and not any(p.is_symlink() for p in [original,*original.parents]),'Missing or aliased evidence artifact directory'
        self.root=original.resolve();self.references={}
    def bytes(self,name,expected=None):
        relative=PurePosixPath(name)
        assert isinstance(name,str) and name==relative.as_posix() and not relative.is_absolute() and '..' not in relative.parts and '\\' not in name,'Unsafe evidence path'
        path=self.root.joinpath(*relative.parts)
        assert path.is_file() and not any(p.is_symlink() for p in [path,*path.parents] if p==self.root or self.root in p.parents),'Missing or symlinked evidence: '+name
        data=path.read_bytes();record={'bytes':len(data),'sha256':digest(data)}
        if expected is not None:assert record==expected,'Evidence bytes differ: '+name
        self.references[self.root.name+'/'+name]=record;return data
    def read(self,name):
        def unique(pairs):
            result={}
            for key,value in pairs:assert key not in result,'Duplicate JSON key';result[key]=value
            return result
        return json.loads(self.bytes(name),object_pairs_hook=unique)

def native_intel(host):
    assert isinstance(host,dict) and host['processArchitecture']=='x86_64' and host['hardwareMachine']=='x86_64'
    assert host['translatedProcess'] is False and host['nativeIntelVerified'] is True,'Intel host identity was not observed'
    observations=host['sysctlObservations'];assert set(observations)=={'hw.machine','machdep.cpu.brand_string','sysctl.proc_translated','hw.optional.arm64'}
    def item(key):
        value=observations[key];assert type(value['returncode']) is int and isinstance(value['stdout'],str) and isinstance(value['stderr'],str);return value
    machine=item('hw.machine');brand=item('machdep.cpu.brand_string')
    assert machine['returncode']==0 and machine['stdout'].strip()=='x86_64' and not machine['stderr'].strip()
    assert brand['returncode']==0 and 'Intel' in brand['stdout'] and not brand['stderr'].strip(),'Rosetta/Apple host cannot stand in for Intel hardware'
    for key in ('sysctl.proc_translated','hw.optional.arm64'):
        value=item(key)
        known_absent=value['returncode']==1 and not value['stdout'].strip() and value['stderr'].strip()=="sysctl: unknown oid '"+key+"'"
        assert (value['returncode']==0 and value['stdout'].strip()=='0' and not value['stderr'].strip()) or known_absent,'Uncertain translated/ARM host identity'

def same_provenance(report,game,source,qa,binary):
    assert report['game']==game and report['artifactSourceCommit']==source and report['qaSourceCommit']==qa
    assert report['binarySha256']==binary,'Actual app binary differs from package'

def inspect_sources(evidence,relative,report,inputs,game):
    hashes=report['sourceHashes'];assert isinstance(hashes,dict)
    required={VERIFY,QA_PLAN,'puretv-joystick/joystick_sdk.py','joystick-games/'+game+'/qa-plan.json'}
    assert required<=hashes.keys(),'Missing actual QA source hashes'
    for name,value in hashes.items():assert name in inputs and sha(value)==inputs[name]['sha256'],'QA source differs from frozen input: '+name
    copies={'executed-macos-verify.py':VERIFY,'executed-qa-plan.py':QA_PLAN,'executed-qa-plan.json':'joystick-games/'+game+'/qa-plan.json'}
    if NETWORK in inputs:copies['executed-allow-local-network.py']=NETWORK
    for filename,source in copies.items():evidence.bytes(relative+'/'+filename,inputs[source])
    assert evidence.read(relative+'/executed-qa-plan.json')==report['qaPlan'],'Gameplay plan differs from executed source'

def strict_game(report,architecture,renderers):
    assert report['status']=='passed' and report['nativeProcessArchitecture']==architecture,'Actual native game QA did not pass'
    assert report['initialization']['classification']=='ready' and report['initialization']['observedGame']['renderer'] in renderers
    assert report['renderingAvailable'] is True,'Actual renderer was not verified'
    assert [item['name'] for item in report['tests']]==list(TEST_NAMES),'Incomplete actual gameplay/controller/storage checks'
    assert all(item['status']=='passed' for item in report['tests'])
    storage=report['storageRestart'];assert storage['initialHydrationEqual'] is True and storage['newOriginVerified'] is True
    assert report['freshInstallSetup']['reusedAcrossRestartOnly'] is True
    if report['qaPlan'].get('storageRestartRequired'):assert storage['status']=='passed' and storage['nativeSavedAfterQuit'],'Required real saved result is missing'

def screenshots(evidence,relative,report):
    items=report['screenshots'];assert isinstance(items,list)
    names=[item['path'] for item in items]
    assert len(names)==len(set(names)) and {'diagnostics/menu.png','diagnostics/playing.png'}<=set(names),'Actual menu and gameplay screenshots are required'
    for item in items:
        assert item['path'].startswith('diagnostics/') and item['path'].endswith('.png')
        expected={'bytes':item['bytes'],'sha256':sha(item['sha256'])}
        assert type(expected['bytes']) is int and expected['bytes']>1000,'Incomplete original screenshot'
        assert evidence.bytes(relative+'/'+item['path'],expected).startswith(b'\x89PNG\r\n\x1a\n'),'Original screenshot is not PNG'

def original_command(evidence,relative,name,argv=None):
    observed=evidence.read(relative+'/'+name+'-command.json')
    assert type(observed['returncode']) is int and observed['returncode']==0 and not observed.get('timedOut'),'Incomplete original command: '+name
    assert isinstance(observed['command'],list) and observed['command'] and all(isinstance(part,str) and part for part in observed['command'])
    if argv is not None:assert observed['command']==argv,'Unexpected original command: '+name
    for stream in ('stdout','stderr'):
        assert evidence.bytes(relative+'/'+name+'-'+stream+'.log').decode('utf-8',errors='replace')==observed[stream],'Original command log differs: '+name
    return observed

def absolute_recorded_path(value):
    assert isinstance(value,str)
    path=PurePosixPath(value)
    assert path.is_absolute() and path.as_posix()==value and '..' not in path.parts and '\\' not in value,'Unsafe recorded command path'
    return path


def failed_initialization(report,game=None,meta=None):
    assert report['status']=='failed' and report['failurePhase']=='initialization','Only an observed initialization failure can have limited coverage'
    assert report['nativeProcessAlive'] is True and report['lastStateFresh'] is True,'Native app must still be alive with a fresh observation'
    assert report['nativeProcessArchitecture']=='x86_64'
    assert report.get('initialization',{}).get('classification')!='ready' and report.get('renderingAvailable') is not True,'A later failure after renderer readiness cannot have limited coverage'
    error=report['error'];assert isinstance(error,str)
    terminal=error.strip().splitlines()[-1]
    state=report['lastState'];assert state['ready'] is True and state['active'] is True and state['processArchitecture']=='x86_64'
    for key in ('diagnosticError','lastJavaScriptError','navigationError','lastNavigationError'):
        assert not state.get(key),'Non-graphics native/JavaScript failure: '+key
    assert not state.get('earlyJavaScriptErrors') and not state.get('resourceErrors')
    assert report['tests']==[],'Gameplay/protocol/storage execution already began; this is not initialization-only'
    observed=state.get('game');bounded=None
    if isinstance(observed,dict) and observed.get('errors'):
        # This exact frozen constructor expression was reviewed against the
        # original Pon bundle. It is not a general TypeError/precision waiver.
        assert game=='ponpoko-kart' and report['game']==game and isinstance(meta,dict) and meta['game']==game
        assert meta['webFiles']['game.js']==PON_BUNDLE and meta['inputFiles'][PON_BUNDLE_SOURCE]==PON_BUNDLE,'Unreviewed Pon renderer bundle'
        assert observed['errors']==[PON_PRECISION_ERROR] and terminal=='AssertionError: Game runtime errors: '+json.dumps([PON_PRECISION_ERROR],ensure_ascii=False),'Unknown or additional original renderer error'
        assert observed['game']==game and observed['stage']=='error' and observed['renderer']=='webgl2' and observed['webglVersion'] is None
        assert type(observed['frames']) is int and observed['frames']==0 and observed['paused'] is False and observed['audioState']=='not_created'
        gameplay=observed['gameplay'];assert gameplay['mode']==gameplay['screen']=='boot'
        for key in ('renderCalls','framePolls','tick','time','worldTime'):
            assert type(gameplay[key]) in (int,float) and gameplay[key]==0,'Renderer/gameplay progressed beyond the bounded constructor failure'
        controller=observed['controller'];assert controller['connected'] is False and controller['players']==[] and type(controller['pollCount']) is int and controller['pollCount']==0
        assert not any(observed.get(key) for key in ('error','message','stack','errorStack')) and not state.get('lastJavaScriptStack'),'Additional or newly captured error evidence needs review'
        bounded={'kind':'frozen_ponpoko_three_precision_initialization','originalError':PON_PRECISION_ERROR,'bundlePath':'game.js','bundleSourcePath':PON_BUNDLE_SOURCE,'bundle':dict(PON_BUNDLE),'originalJavaScriptStackCaptured':False,'gameplayStarted':False,'diagnosticStage':'error','diagnosticMode':'boot'}
    else:
        assert terminal.startswith(('AssertionError: Native initialization terminal state timed out: ', 'AssertionError: Actual game initialization failed: ')),'Non-initialization or unknown native QA exception requires investigation'
    if observed is not None and bounded is None:
        assert isinstance(observed,dict) and not observed.get('errors'),'Explicit game errors require investigation'
        allowed={'Error creating WebGL context.','THREE.WebGLRenderer: Error creating WebGL context.','WebGL2 is required','WebGL 2 is required'}
        for key in ('error','message'):
            value=observed.get(key);assert not value or value in allowed,'Unclassified game error cannot be attributed to graphics'
    timestamp(report['startedAt']);timestamp(report['finishedAt'])
    return bounded


def capability(evidence,phase,game,meta,plan,binary,report,inputs,require_context_loss=True):
    relative=game+'/capability/'+phase;record=evidence.read(relative+'/report.json')
    source=meta['sourceCommit'];qa=plan.get('qaSourceCommit',plan['sourceCommit'])
    assert type(record['schemaVersion']) is int and record['schemaVersion']==1 and record['status']=='observed' and type(record['probeExitCode']) is int and record['probeExitCode']==0
    assert record['gamesOpened'] is False and record['gameAssetsChanged'] is False
    assert record['game']==game and record['phase']==phase and record['sourceCommit']==source and record['qaSourceCommit']==qa
    assert positive(record['runId'])==positive(plan['runId']) and positive(record['runAttempt'])==positive(plan['runAttempt'])
    assert record['runner']=='macos-15-intel' and isinstance(record['runnerName'],str) and record['runnerName']
    runner_image=record['runnerImage'];assert set(runner_image)=={'ImageOS','ImageVersion','unavailableFields'}
    assert runner_image['unavailableFields']==[key for key in ('ImageOS','ImageVersion') if runner_image[key] is None]
    assert all(runner_image[key] is None or isinstance(runner_image[key],str) and runner_image[key] for key in ('ImageOS','ImageVersion')),'Invalid runner image observation'
    job=record['job'];assert record['jobId']==positive(job['id']) and positive(job['run_id'])==plan['runId'] and job['head_sha']==qa
    assert positive(job['run_attempt'])==plan['runAttempt'] and record['runner'] in job['labels']
    assert job['runner_name']==record['runnerName'] and job['status']=='in_progress' and job.get('conclusion') is None
    batch_name=next(item['batch'] for item in plan['batches'] if game in item['games'])
    assert job['name'].startswith('verify ('+batch_name+',') and job['name'].endswith(', macos-15-intel)'),'Capability job identity is not the selected Intel batch'
    assert record['runnerName']==report['runnerName'],'Capability host differs from actual game QA'
    native_intel(record['host'])
    for key,observation in record['host']['sysctlObservations'].items():
        command=evidence.read(relative+'/'+key+'-command.json');assert command['command']==['/usr/sbin/sysctl','-n',key] and not command.get('timedOut')
        assert observation=={name:command[name] for name in ('returncode','stdout','stderr')}
        for stream in ('stdout','stderr'):assert evidence.bytes(relative+'/'+key+'-'+stream+'.log').decode('utf-8',errors='replace')==command[stream]
    raw_jobs=evidence.bytes(relative+'/original-jobs-stdout.log');jobs=json.loads(raw_jobs)
    assert jobs['total_count']==len(jobs['jobs']),'Capability job list is incomplete'
    matching=[item for item in jobs['jobs'] if item.get('runner_name')==record['runnerName'] and item.get('status')=='in_progress' and item.get('name','').startswith('verify') and record['runner'] in item.get('name','')]
    assert matching==[job],'Original API response does not identify the same unique job'
    job_command=original_command(evidence,relative,'original-jobs',['gh','api',f"repos/ecojust/pureTV/actions/runs/{plan['runId']}/attempts/{plan['runAttempt']}/jobs?per_page=100"])
    assert raw_jobs.decode('utf-8',errors='replace')==job_command['stdout']
    assert evidence.bytes(relative+'/original-jobs-stderr.log').decode('utf-8',errors='replace')==job_command['stderr']==''
    package=record['package'];assert package['game']==game and package['sourceCommit']==source and package['binarySha256']==binary
    assert package['appFilesManifestSha256']==digest(canonical(meta['appFiles']))
    assert timestamp(record['startedAt'])<=timestamp(record['finishedAt'])
    if phase=='before':assert timestamp(record['finishedAt'])<=timestamp(report['startedAt']),'Probe was not before game QA'
    else:assert timestamp(record['startedAt'])>=timestamp(report['finishedAt']),'Probe was not after game QA'
    probe=record['probe'];assert evidence.read(relative+'/probe.json')==probe,'Embedded probe differs from original probe output'
    assert probe['status']=='complete' and probe['processArchitecture']=='x86_64' and probe['webgl2ContextCreated'] is True
    samples=probe['samples'];assert isinstance(samples,list) and len(samples)==3,'Capability requires three actual frames'
    if require_context_loss:assert samples[0]['glError']==37442,'Missing original CONTEXT_LOST_WEBGL observation'
    assert not probe.get('error'),'Probe reported a script error'
    for sample in samples:
        assert 'error' not in sample,'Sample with script error cannot qualify'
        assert type(sample['contextLost']) is bool and type(sample['glError']) is int and sample['glError']>=0
        assert all(key in sample for key in ('vertexHighFloat','fragmentHighFloat','renderer','vendor','version')),'Incomplete raw probe sample'
        if require_context_loss:
            assert sample['contextLost'] is True and sample['glError'] in (0,37442)
            assert all(sample[key] is None for key in ('vertexHighFloat','fragmentHighFloat','renderer','vendor','version')),'Probe differs from the bounded context-lost observation'
    sha(record['probeBinarySha256']);assert record['binaryIncluded'] is False
    assert record['probeSourceSha256']==inputs[PROBE]['sha256']
    expected={'executed-webgl-probe.swift':PROBE,'executed-macos-capability.py':CAPABILITY}
    assert record['sourceHashes']=={PROBE:inputs[PROBE]['sha256'],CAPABILITY:inputs[CAPABILITY]['sha256']}
    assert set(record['executedSources'])==set(expected),'Unknown or missing capability source files'
    for local,source_path in expected.items():
        assert record['executedSources'][local]==inputs[source_path];evidence.bytes(relative+'/'+local,inputs[source_path])
    for name,argv,field,strip in (
        ('system-version',['/usr/bin/sw_vers'],'systemVersion',False),
        ('xcode-version',['/usr/bin/xcodebuild','-version'],'xcodeVersion',False),
        ('swift-version',['xcrun','swiftc','--version'],'swiftVersion',False),
        ('sdk-version',['xcrun','--sdk','macosx','--show-sdk-version'],'sdkVersion',True)):
        observed=original_command(evidence,relative,name,argv);value=observed['stdout'].strip() if strip else observed['stdout']
        assert value and record[field]==value,'OS/compiler version differs from original command'
    sdk=original_command(evidence,relative,'sdk-path',['xcrun','--sdk','macosx','--show-sdk-path'])['stdout'].strip();absolute_recorded_path(sdk)
    webkit_bytes=evidence.bytes(relative+'/WebKit-Info.plist');assert digest(webkit_bytes)==sha(record['webKitInfoSha256'])
    webkit=plistlib.loads(webkit_bytes)
    assert record['webKitFramework']=={key:webkit.get(key) for key in ('CFBundleIdentifier','CFBundleShortVersionString','CFBundleVersion')}
    compile_command=original_command(evidence,relative,'compile-probe')['command']
    assert len(compile_command)==15
    source_path=absolute_recorded_path(compile_command[12]);binary_path=absolute_recorded_path(compile_command[14])
    assert source_path.parts[-len(PurePosixPath(PROBE).parts):]==PurePosixPath(PROBE).parts and binary_path.name=='probe'
    assert compile_command==['xcrun','swiftc','-swift-version','5','-target','x86_64-apple-macos11.0','-sdk',sdk,'-framework','AppKit','-framework','WebKit',str(source_path),'-o',str(binary_path)]
    original_command(evidence,relative,'sign-probe',['/usr/bin/codesign','--force','--sign','-','--timestamp=none',str(binary_path)])
    probe_command=original_command(evidence,relative,'probe')['command'];assert len(probe_command)==2 and probe_command[0]==str(binary_path)
    output_path=absolute_recorded_path(probe_command[1]);assert output_path.parts[-4:]==(game,'capability',phase,'probe.json'),'Probe output differs from the original case'
    return record

def runtime_http(evidence,batch,plan,source,qa,architecture):
    command=batch['localAssetHttp'];assert command['status']=='passed' and type(command['returncode']) is int and command['returncode']==0,'Actual runner HTTP checks did not pass'
    assert command['command']==['python3',HTTP_TEST] and command['log']=='local-assets.log' and not command.get('error')
    timestamp(command['startedAt']);log=evidence.bytes('local-assets.log').decode('utf-8',errors='replace')
    original=evidence.read('local-assets-source-inputs.json')
    assert original['qaSourceCommit']==qa and original['artifactSourceCommit']==source and original['runnerArchitecture']==architecture
    expected={HTTP_SOURCE,HTTP_TEST,RUNTIME_WORKFLOW}|{name for name in plan['inputFiles'] if name.startswith(AUDIO)}
    assert {AUDIO+'backfire.opus',AUDIO+'backfire.m4a',AUDIO+'provenance.json',AUDIO+'LICENSE.txt'}<=expected
    assert set(original['files'])==expected,'Incomplete local HTTP source/fixture provenance'
    originals={}
    for name in expected:
        assert original['files'][name]==plan['inputFiles'][name],'HTTP test input differs from frozen QA source'
        originals[name]=evidence.bytes('executed-source/'+name,plan['inputFiles'][name])
    tree=ast.parse(originals[HTTP_TEST]);harness=next(ast.literal_eval(node.value) for node in tree.body if isinstance(node,ast.Assign) and any(isinstance(target,ast.Name) and target.id=='HARNESS' for target in node.targets))
    names={node.name for owner in tree.body if isinstance(owner,ast.ClassDef) and owner.name=='NativeLocalAssets' for node in owner.body if isinstance(node,ast.FunctionDef) and node.name.startswith('test_')}
    assert names and re.search(r'Ran '+str(len(names))+r' tests? in ',log) and re.search(r'^OK(?: \(skipped=\d+\))?\s*$',log,re.M),'Original HTTP suite did not finish successfully'
    relative='local-assets-compile';compiled=evidence.read(relative+'/compile-context.json')
    assert compiled['status']=='compiled' and compiled['architecture']==architecture and compiled['swiftVersion'] and compiled['system']
    assert compiled['sourceSha256']==plan['inputFiles'][HTTP_SOURCE]['sha256'] and compiled['testSha256']==plan['inputFiles'][HTTP_TEST]['sha256']
    assert compiled['harnessSha256']==digest(harness.encode()) and evidence.bytes(relative+'/main.swift')==harness.encode();sha(compiled['binarySha256'])
    argv=compiled['command'];assert len(argv)==11
    server_path=absolute_recorded_path(argv[5]);harness_path=absolute_recorded_path(argv[6]);binary_path=absolute_recorded_path(argv[10])
    assert server_path.parts[-len(PurePosixPath(HTTP_SOURCE).parts):]==PurePosixPath(HTTP_SOURCE).parts
    assert harness_path.name=='main.swift' and binary_path.name=='asset-server-test' and harness_path.parent==binary_path.parent
    assert argv==['xcrun','swiftc','-swift-version','5','-O',str(server_path),str(harness_path),'-framework','Network','-o',str(binary_path)]
    case_root=evidence.root/relative/'cases';assert case_root.is_dir() and {path.name for path in case_root.iterdir()}==names,'Missing actual HTTP case evidence'
    for path in (evidence.root/relative).rglob('*'):
        assert not path.is_symlink(),'Symlink in original HTTP evidence'
        if path.is_file():evidence.bytes(path.relative_to(evidence.root).as_posix())
    for name in names:
        folder=relative+'/cases/'+name
        for path in (evidence.root/folder).glob('*-process.json'):
            process=evidence.read(path.relative_to(evidence.root).as_posix());assert process['command'][0]==str(binary_path)
            stem=path.name.removesuffix('-process.json')
            evidence.bytes(folder+'/'+stem+'-stdout.log');evidence.bytes(folder+'/'+stem+'-stderr.log')


def assess_game(game,meta,plan,entry,arm_folder,intel_folder):
    """Return complete/explicitly partial coverage, or fail closed with AssertionError."""
    source=commit(meta['sourceCommit']);qa=commit(plan.get('qaSourceCommit',plan['sourceCommit']))
    assert plan['sourceCommit']==source and game in plan['games']
    renderers=plan['renderers'][game];selected_policy=policy(game,entry,renderers)
    assert plan.get('coveragePolicies',{}).get(game,FULL)==selected_policy,'Plan/registry coverage policy mismatch'
    assert meta['game']==game and meta['committedInputsVerified'] is True
    assert meta['bundleIdentifier']==entry['packageName'] and meta['appName']==entry['appName']+'.app'
    assert set(meta['architectures'])=={'arm64','x86_64'} and meta['signature']=='ad-hoc' and meta['appleNotarized'] is False
    binary=sha(meta['appFiles']['Contents/MacOS/'+entry['executable']]['sha256'])
    inputs={**meta['inputFiles'],**plan['inputFiles']}
    expected_batch=next(item for item in plan['batches'] if game in item['games'])
    all_refs={};coverage={}
    for runner,folder in [('macos-latest',arm_folder),('macos-15-intel',intel_folder)]:
        evidence=Evidence(folder);batch=evidence.read('batch-report.json')
        assert batch['sourceCommit']==source and batch.get('qaSourceCommit',source)==qa and batch['runner']==runner
        assert batch['expectedArchitecture']==('arm64' if runner=='macos-latest' else 'x86_64')
        if 'artifactRunId' in plan:runtime_http(evidence,batch,plan,source,qa,batch['expectedArchitecture'])
        assert batch['batch']==expected_batch['batch'] and [item['game'] for item in batch['games']]==expected_batch['games']
        assert all(item['status'] in ('passed','failed') for item in batch['games']),'Incomplete batch game record'
        assert batch['status']==('passed' if all(item['status']=='passed' for item in batch['games']) else 'failed'),'Unexplained batch status'
        record=next(item for item in batch['games'] if item['game']==game);modes=['native','occupied-port','rosetta'] if runner=='macos-latest' else ['native']
        assert len(record['checks'])==len(modes)+1 and record['checks'][0]['status']=='passed' and record['checks'][0]['returncode']==0
        installed=evidence.read(game+'/package-verification.json')
        assert installed['status']=='passed' and installed['game']==game and installed['sourceCommit']==installed['artifactSourceCommit']==source and installed['qaSourceCommit']==qa
        assert installed['zipDmgAndInstalledCopyVerified'] is True and installed['completeFileSetVerified'] is True
        assert set(installed['architectures'])=={'arm64','x86_64'} and installed['signature']=='ad-hoc' and installed['appleNotarized'] is False
        if 'artifactRunId' in plan:
            assert installed['artifactRunId']==plan['artifactRunId'] and installed['artifactRunAttempt']==plan['artifactRunAttempt'] and installed['originalPackageBytesReused'] is True
        for index,mode in enumerate(modes,1):
            relative=game+'/'+mode;report=evidence.read(relative+'/report.json');same_provenance(report,game,source,qa,binary)
            if selected_policy==PARTIAL:
                assert positive(report['qaRunId'])==plan['runId'] and positive(report['qaRunAttempt'])==plan['runAttempt']
                assert report['runnerKind']==runner and isinstance(report['runnerName'],str) and report['runnerName'],'Missing actual game runner identity'
            if 'artifactRunId' in plan:assert str(report['artifactRunId'])==str(plan['artifactRunId'])
            inspect_sources(evidence,relative,report,inputs,game)
            architecture='x86_64' if runner=='macos-15-intel' or mode=='rosetta' else 'arm64'
            if runner=='macos-15-intel' and report['status']!='passed':
                assert selected_policy==PARTIAL,'Default full policy never waives Intel native failure'
                assert batch['status']=='failed' and record['status']=='failed' and record['checks'][index]['status']=='failed' and record['checks'][index]['returncode']!=0
                bounded=failed_initialization(report,game,meta)
                before=capability(evidence,'before',game,meta,plan,binary,report,inputs);after=capability(evidence,'after',game,meta,plan,binary,report,inputs)
                assert before['jobId']==after['jobId'] and before['runnerName']==after['runnerName'] and before['host']==after['host'] and before['runnerImage']==after['runnerImage'],'Capability observations came from different execution hosts'
                coverage['intelNative']={'status':'unverified','processArchitecture':'x86_64','originalGameQaStatus':'failed','capabilityObservation':'webgl2_context_lost','gameFailureCauseProven':False}
                if bounded is not None:coverage['intelNative']['boundedInitializationEvidence']=bounded
            else:
                assert (batch['status']=='passed' or (runner=='macos-15-intel' and selected_policy==PARTIAL and batch['status']=='failed')) and record['status']=='passed' and record['checks'][index]['status']=='passed' and record['checks'][index]['returncode']==0
                strict_game(report,architecture,renderers)
                if selected_policy==PARTIAL:screenshots(evidence,relative,report)
                if runner=='macos-15-intel' and selected_policy==PARTIAL:
                    before=capability(evidence,'before',game,meta,plan,binary,report,inputs,require_context_loss=False)
                    after=capability(evidence,'after',game,meta,plan,binary,report,inputs,require_context_loss=False)
                    assert before['jobId']==after['jobId'] and before['runnerName']==after['runnerName'] and before['host']==after['host'] and before['runnerImage']==after['runnerImage'],'Capability observations came from different execution hosts'
                label='intelNative' if runner=='macos-15-intel' else {'native':'appleSiliconNative','occupied-port':'appleSiliconOccupiedPort','rosetta':'appleSiliconRosetta'}[mode]
                coverage[label]={'status':'passed','processArchitecture':architecture,'originalGameQaStatus':'passed'}
        all_refs.update(evidence.references)
    partial=coverage['intelNative']['status']=='unverified'
    return {'schemaVersion':2,'game':game,'coveragePolicy':selected_policy,'artifactSourceCommit':source,'qaSourceCommit':qa,'runId':plan['runId'],'runAttempt':plan['runAttempt'],'installPackagesValidated':True,'packageArchitectures':['arm64','x86_64'],'binarySha256':binary,'verificationCoverage':coverage,'overallGameplayVerification':'partial' if partial else 'complete','deliveryEligibility':'eligible_with_intel_unverified' if partial else 'eligible','originalGameReportsModified':False,'physicalControllerTested':False,'appleNotarized':False,'evidenceFiles':all_refs}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('game','meta','plan','entry','arm','intel','output'):parser.add_argument('--'+name,required=True)
    args=parser.parse_args();output=Path(args.output).resolve()
    assert not any(output.is_relative_to(Path(folder).resolve()) for folder in (args.arm,args.intel))
    assert output not in {Path(p).resolve() for p in (args.meta,args.plan,args.entry)},'Never overwrite input evidence'
    try:result=assess_game(args.game,*[json.loads(Path(p).read_text()) for p in (args.meta,args.plan,args.entry)],Path(args.arm),Path(args.intel));code=0
    except (AssertionError,KeyError,ValueError,StopIteration) as error:result={'schemaVersion':2,'game':args.game,'deliveryEligibility':'blocked','error':str(error),'originalGameReportsModified':False};code=1
    output.parent.mkdir(parents=True,exist_ok=True);assert not output.exists(),'Use a fresh coverage output path';output.write_text(json.dumps(result,indent=2)+'\n');raise SystemExit(code)
