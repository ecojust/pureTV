#!/usr/bin/env python3
"""Read and verify completed original Windows packages. Never build or run games."""
import argparse,datetime as dt,hashlib,importlib.util,json,os,re,shutil,stat,subprocess,sys,traceback,zipfile
from pathlib import Path

REPO='ecojust/pureTV'
WORKFLOW='.github/workflows/joystick-catalog-windows.yml'
READER_WORKFLOW='.github/workflows/joystick-catalog-windows-reexport.yml'
GIT_FILE_LIMIT=100000000
ROOT=Path(__file__).resolve().parents[2]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
transfer=module('original_artifact_transfer',Path(__file__).with_name('artifact-draft-transfer.py'))
exporter=module('original_windows_export',Path(__file__).with_name('windows-export.py'))
def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
def valid_slug(value):return isinstance(value,str) and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',value)
def positive(value):assert type(value) is int and 0<value<2**63;return value
def safe_name(name):
    assert isinstance(name,str) and 0<len(name)<=1024 and '\\' not in name,'Unsafe archive/source path'
    parts=name.split('/');assert 1<=len(parts)<=32 and all(re.fullmatch(r'[A-Za-z0-9_.-]+',p) and p not in ('.','..') and not p.endswith('.') for p in parts),'Unsafe archive/source path'
    return parts

def validate_selection(run,jobs,artifacts,request,registry):
    for key in ('run','attempt'):positive(request[key])
    assert isinstance(request['source'],str) and re.fullmatch('[a-f0-9]{40}',request['source'])
    games=request['games'];assert isinstance(games,list) and 0<len(games)<=32 and all(valid_slug(g) for g in games) and len(games)==len(set(games))
    assert type(registry['schemaVersion']) is int and registry['schemaVersion']==1 and isinstance(registry['games'],dict) and all(g in registry['games'] for g in games),'Unregistered selected game'
    positive(run['id']);positive(run['run_attempt']);positive(run['head_repository']['id'])
    assert run['id']==request['run'] and run['run_attempt']==request['attempt'] and run['head_sha']==request['source']
    assert run['path']==WORKFLOW and run['event']=='workflow_dispatch' and run['status']=='completed'
    assert run['repository']['full_name']==run['head_repository']['full_name']==REPO and positive(run['repository']['id'])==run['head_repository']['id']
    selected={}
    for game in games:
        matching=[j for j in jobs if j['name']==f'verify ({game})'];assert len(matching)==1,'Original job not unique'
        job=matching[0];positive(job['id']);positive(job['run_id']);positive(job['run_attempt'])
        assert job['run_id']==request['run'] and job['run_attempt']==request['attempt'] and job['head_sha']==request['source']
        assert job['status']=='completed' and job['conclusion']=='success','Selected game was not originally successful'
        uploads=[s for s in job['steps'] if s['name']=='Run actions/upload-artifact@v4']
        assert len(uploads)==2 and uploads[0]['number']<uploads[1]['number'],'Original upload layout changed'
        for step in uploads:positive(step['number'])
        row={'job':job,'uploadTimestampBindings':{}}
        for index,kind in enumerate(('evidence','packages')):
            matches=[a for a in artifacts if a['name']==f'joystick-windows-{kind}-{game}'];assert len(matches)==1,'Original artifact not unique'
            artifact=matches[0];positive(artifact['id']);assert artifact['expired'] is False and transfer.stamp(artifact['expires_at'])>dt.datetime.now(dt.timezone.utc)
            assert type(artifact['size_in_bytes']) is int and 0<artifact['size_in_bytes']<=transfer.MAX_BYTES
            transfer.sha(artifact.get('digest'));link=artifact['workflow_run']
            for key in ('id','repository_id','head_repository_id'):positive(link[key])
            assert link['id']==request['run'] and link['head_sha']==request['source'] and link['head_branch']==run['head_branch']
            assert link['repository_id']==link['head_repository_id']==run['repository']['id']
            created=transfer.stamp(artifact['created_at']);start=transfer.stamp(job['started_at']);end=transfer.stamp(job['completed_at'])
            assert start<=created<=end,'Artifact outside original job'
            step=uploads[index];step_start=transfer.stamp(step['started_at']);step_end=transfer.stamp(step['completed_at'])
            assert step['status']=='completed' and step['conclusion']=='success' and start<=step_start<=step_end<=end
            assert step_start<=created<=step_end+dt.timedelta(seconds=2),'Artifact outside successful original upload'
            row[kind]=artifact;row['uploadTimestampBindings'][kind]={'stepNumber':step['number'],'offsetSeconds':(created-step_end).total_seconds(),'maxEndOffsetSeconds':2,'startToleranceSeconds':0,'jobBoundsStrict':True}
        selected[game]=row
    return {'selected':selected,'originalRunConclusion':run.get('conclusion')}

def safe_extract(archive,destination,max_total=2000000000):
    archive=Path(archive);destination=Path(destination)
    assert archive.is_file() and not archive.is_symlink() and not destination.exists()
    assert not any(p.is_symlink() for p in [destination.parent,*destination.parents])
    records={};nodes={};explicit=set();total=0
    with zipfile.ZipFile(archive) as source:
        entries=source.infolist();assert 0<len(entries)<=20000,'Archive entry limit'
        for item in entries:
            directory=item.is_dir();name=item.filename[:-1] if directory else item.filename;parts=safe_name(name)
            assert item.filename not in explicit,'Duplicate ZIP entry';explicit.add(item.filename)
            mode=stat.S_IFMT(item.external_attr>>16)
            assert mode in (0,stat.S_IFDIR if directory else stat.S_IFREG),'ZIP link or special file'
            assert not item.flag_bits&1 and item.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED),'Encrypted or unsupported ZIP'
            for count in range(1,len(parts)+1):
                path='/'.join(parts[:count]);kind='directory' if count<len(parts) or directory else 'file';fold=path.casefold()
                if fold in nodes:assert nodes[fold]==(path,kind) and kind=='directory','Case or file/directory collision'
                else:nodes[fold]=(path,kind)
            total+=item.file_size;assert total<=max_total,'Archive byte limit'
        destination.mkdir(parents=True,exist_ok=False)
        for item in entries:
            if item.is_dir():continue
            target=destination.joinpath(*safe_name(item.filename));target.parent.mkdir(parents=True,exist_ok=True)
            size=0;sha=hashlib.sha256()
            with source.open(item) as stream,target.open('xb') as output:
                while block:=stream.read(1024*1024):
                    size+=len(block);assert size<=item.file_size,'ZIP entry exceeds declared bytes';sha.update(block);output.write(block)
            assert size==item.file_size,'ZIP entry truncated';records[item.filename]={'bytes':size,'sha256':sha.hexdigest()}
    return records

def package_export_plan(packages,artifact):
    assert isinstance(packages,dict) and packages
    result={'included':{},'references':{}}
    for name,item in packages.items():
        assert len(safe_name(name))==1 and name.endswith(('.zip','.exe'))
        assert type(item['bytes']) is int and 0<item['bytes']<128000000 and re.fullmatch('[a-f0-9]{64}',item['sha256'])
        if item['bytes']<GIT_FILE_LIMIT:result['included'][name]=dict(item)
        else:result['references'][name]=dict(item,artifactId=artifact['id'],artifactName=artifact['name'],artifactDigest=artifact['digest'],sourceRunId=artifact['workflow_run']['id'],sourceCommit=artifact['workflow_run']['head_sha'],artifactUrl=f'https://github.com/{REPO}/actions/runs/{artifact["workflow_run"]["id"]}/artifacts/{artifact["id"]}',gitBytesIncluded=False,publicPackageDeliveryComplete=False)
    return result

def environment():
    assert os.environ['GITHUB_REPOSITORY']==REPO
    request={'run':int(os.environ['SOURCE_RUN']),'attempt':int(os.environ['SOURCE_ATTEMPT']),'source':os.environ['SOURCE_SHA'],'games':json.loads(os.environ['REQUESTED_GAMES'])}
    assert re.fullmatch('[a-f0-9]{40}',os.environ['GITHUB_SHA'])
    assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
    return request,Path(os.environ['RUNNER_TEMP'])/'windows-reexport'

def fetch():
    request,out=environment();out.mkdir(exist_ok=False);provenance=out/'export/provenance'
    client=transfer.GitHub(os.environ.get('GH_TOKEN'));base=f'/repos/{REPO}'
    run=client.get(f'{base}/actions/runs/{request["run"]}/attempts/{request["attempt"]}')
    jobs=client.pages(f'{base}/actions/runs/{request["run"]}/attempts/{request["attempt"]}/jobs','jobs')
    artifacts=client.pages(f'{base}/actions/runs/{request["run"]}/artifacts','artifacts')
    registry,registry_proof=transfer.source_registry(client,request['source'])
    selection=validate_selection(run,jobs,artifacts,request,registry)
    write(provenance/'original-run.json',run);write(provenance/'original-jobs.json',jobs);write(provenance/'original-artifacts.json',artifacts);write(provenance/'original-registry-proof.json',registry_proof)
    paths=set();downloads=[];(out/'archives').mkdir()
    for game,row in selection['selected'].items():
        for kind in ('evidence','packages'):
            original=row[kind];artifact=client.get(f'{base}/actions/artifacts/{original["id"]}');assert artifact==original,'Original artifact changed'
            archive=out/'archives'/f'{artifact["id"]}.zip';size,sha=client.download(artifact['id'],archive,artifact['size_in_bytes'])
            assert size==artifact['size_in_bytes'] and sha==transfer.sha(artifact['digest']),'Original ZIP digest mismatch'
            folder=out/'original'/artifact['name'];records=safe_extract(archive,folder)
            downloads.append({'game':game,'kind':kind,'artifactId':artifact['id'],'bytes':size,'sha256':sha,'originalZipRepacked':False,'files':records})
        manifest=json.loads((out/'original'/row['packages']['name']/'build-manifest.json').read_text(encoding='utf-8'))
        assert manifest['sourceCommit']==request['source'] and manifest['game']==game and manifest['inputFiles']
        for name in manifest['inputFiles']:safe_name(name);paths.add(name)
        # The frozen Windows selector inspects Android distributions before
        # excluding their bytes from the Windows build inputs.
        paths.add(f'joystick-games/{game}/*.apk')
    write(provenance/'original-selection.json',selection);write(provenance/'original-downloads.json',downloads)
    write(out/'request.json',request)
    sparse='\n'.join('/'+name for name in sorted(paths))
    with open(os.environ['GITHUB_OUTPUT'],'a') as output:output.write('source_paths<<PURETV_ORIGINAL_SOURCE_PATHS\n'+sparse+'\nPURETV_ORIGINAL_SOURCE_PATHS\n')

def git_inventory(root,source):
    data=subprocess.check_output(['git','-C',str(root),'ls-tree','-rz','--full-tree',source]);result={}
    for row in data.split(b'\0'):
        if not row:continue
        header,name=row.split(b'\t',1);mode,kind,oid=header.split(b' ');name=name.decode('utf-8');result[name]={'mode':mode.decode(),'kind':kind.decode(),'sha':oid.decode()}
    return result

def verify_game(root,source,game,run,attempt,evidence,packages,source_scope):
    def same(path,item):assert path.is_file() and not path.is_symlink() and path.stat().st_size==item['bytes'] and digest(path)==item['sha256'],str(path)
    receipt=json.loads((evidence/'evidence-manifest.json').read_text(encoding='utf-8'))
    assert receipt['sourceCommit']==source and receipt['game']==game and receipt['runId']==str(run) and receipt['runAttempt']==str(attempt) and receipt['sourceScopeComplete']
    for name,item in receipt['files'].items():same(evidence.joinpath(*safe_name(name)),item)
    assert {p.relative_to(evidence).as_posix() for p in evidence.rglob('*') if p.is_file()}==set(receipt['files'])|{'evidence-manifest.json'}
    meta=json.loads((packages/'build-manifest.json').read_text(encoding='utf-8'))
    assert meta['sourceCommit']==source and meta['game']==game and meta['committedInputsVerified'] and meta['architecture']=='x86_64' and meta['authenticodeSigned'] is False
    selection=source_scope.select(game,root=root);assert source_scope.file_records(selection)==meta['inputFiles'],'Original source closure mismatch'
    inventory=git_inventory(root,source);source_scope.verify_complete_git_selection(selection,inventory)
    for name,item in meta['inputFiles'].items():
        path=root.joinpath(*safe_name(name));same(path,item);entry=inventory[name]
        assert entry['kind']=='blob' and entry['mode'] in ('100644','100755')
        raw=path.read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==entry['sha'],'Original Git blob differs'
    assert type(meta['packageByteLimit']) is int and 0<meta['packageByteLimit']<=128000000
    for name,item in meta['packages'].items():
        assert len(safe_name(name))==1 and item['bytes']<meta['packageByteLimit'];same(packages/name,item)
    assert {p.relative_to(packages).as_posix() for p in packages.rglob('*') if p.is_file()}==set(meta['packages'])|{'build-manifest.json'}
    assert (evidence/'build-manifest.json').read_bytes()==(packages/'build-manifest.json').read_bytes(),'Evidence/package manifest differs'
    installed=json.loads((evidence/'package-verification.json').read_text(encoding='utf-8'))
    assert installed['status']=='passed' and installed['game']==game and installed['sourceCommit']==source
    assert installed['installedBytesMatchPortable'] and installed['completeFileSetVerified'] and installed['uninstallPreservesUnrelatedFiles'] and installed['uninstallRemovesOnlyPackagedFiles']
    assert installed['packageHashesVerified'] and installed['zipCrcVerified'] and installed['silentInstallerExecuted']
    assert installed['peMachine']=='AMD64' and installed['authenticodeSigned'] is False and installed['packages']==meta['packages']
    assert installed['binarySha256']==meta['appFiles']['PureTVGame.exe']['sha256']
    archives=[name for name in meta['packages'] if name.endswith('-windows-x64.zip')];installers=[name for name in meta['packages'] if name.endswith('-windows-x64-setup.exe')]
    assert len(archives)==len(installers)==1 and len(meta['packages'])==2
    unpacked=packages.parent/('reader-portable-'+game);portable_records=safe_extract(packages/archives[0],unpacked)
    roots={name.split('/')[0] for name in portable_records};assert len(roots)==1;folder=next(iter(roots))
    assert {name[len(folder)+1:]:record for name,record in portable_records.items()}==meta['appFiles'],'Original portable app file set differs'
    binary=(unpacked/folder/'PureTVGame.exe').read_bytes();assert binary[:2]==b'MZ';pe=int.from_bytes(binary[60:64],'little')
    assert binary[pe:pe+4]==b'PE\0\0' and int.from_bytes(binary[pe+4:pe+6],'little')==0x8664
    expected_tests=['Native DPI-scaled minimum and initial viewport','DNS-SD resolves actual listener and TXT','Official SDK and single controller seat','Actual gameplay and pause model freeze','Three minimize and restore cycles keep endpoint stable','Disconnect and held-sync reconnect remain paused','Normal gameplay saves reach native store','Every SDK message receives exact sequence ACK','Normal close releases TCP','Real save restored with fresh browser cache']
    modes={}
    for mode in ('runtime-normal','runtime-occupied'):
        report_path=evidence/mode/'report.json';report=json.loads(report_path.read_text(encoding='utf-8'))
        assert report['status']=='passed' and report['game']==game and report['qaSourceCommit']==source and report['binarySha256']==installed['binarySha256']
        assert [test['name'] for test in report['tests']]==expected_tests and all(test['status']=='passed' for test in report['tests'])
        assert report['qaPlan']==json.loads((root/'joystick-games'/game/'qa-plan.json').read_text(encoding='utf-8'))
        details=[test['details'] for test in report['tests']]
        assert details[0]['minimumViewport']==[960,540] and details[0]['restoredViewport']==[1280,720]
        assert details[2]['nineInitialSyncs'] and details[2]['secondControllerRejected'] and details[2]['independentBusyRejections']==3
        assert len(details[4]['cycles'])==3
        for cycle in details[4]['cycles']:
            assert all(cycle[key] is True for key in ['samePort','sameSocket','sameSession','heldSuppressed','restoredPollingVerified','freshStartRequired'])
            assert cycle['backgroundPingAck']>0 and cycle['backgroundStability']['samples']>=4 and cycle['backgroundStability']['realSeconds']>=.5
        assert details[5]['sameIdentity'] and details[5]['heldSyncNoResume'] and details[5]['disconnectBarrierAck']>0
        assert details[7]['messages']>0 and details[7]['matchingAcks']==details[7]['messages']
        assert details[8]['normalExit'] and details[8]['tcpClosed']
        storage=report['storageRestart'];assert storage['initialHydrationEqual'] and storage['cleanBrowserCacheVerified']
        if report['qaPlan'].get('storageRestartRequired'):assert storage['status']=='passed' and storage['nativeSavedAfterQuit']
        assert report['nativeDisplay']['originalModeRestored'],'Original display was not restored'
        assert len(report['screenshots'])>=6
        for shot in report['screenshots']:same((evidence/mode).joinpath(*safe_name(shot['path'])),shot)
        paths=exporter.verify_source_hashes(root,source,report['sourceHashes'],meta['inputFiles'])
        normalized=exporter.canonical_source_hashes(report['sourceHashes'])
        expected_sources={'joystick-games/tools/'+name for name in ['windows-verify.py','macos-verify.py','qa-plan.py','windows-display.py','windows-observation.py']}|{'puretv-joystick/joystick_sdk.py',f'joystick-games/{game}/qa-plan.json'}
        assert set(normalized)==expected_sources
        for name in normalized:same(evidence/mode/('executed-'+Path(name).name),meta['inputFiles'][name])
        modes[mode]={'originalStatus':report['status'],'originalReportSha256':digest(report_path),'originalTestsPassed':len(report['tests']),'sourcePathNormalizations':paths}
    return {'manifest':meta,'binarySha256':installed['binarySha256'],'originalSourceFilesVerified':len(meta['inputFiles']),'originalPortableFilesVerified':len(portable_records),'modes':modes}

def verify():
    request,out=environment();assert json.loads((out/'request.json').read_text())==request
    original_root=Path(os.environ['ORIGINAL_ROOT']).resolve();assert subprocess.check_output(['git','-C',str(original_root),'rev-parse','HEAD'],text=True).strip()==request['source']
    # This import is the exact original Git source selector, never an artifact's code.
    source_scope=module('frozen_windows_inputs',original_root/'joystick-games/tools/windows-inputs.py')
    provenance=out/'export/provenance';selection=json.loads((provenance/'original-selection.json').read_text());results={}
    for game in request['games']:
        row=selection['selected'][game];evidence=out/'original'/row['evidence']['name'];packages=out/'original'/row['packages']['name']
        result=verify_game(original_root,request['source'],game,request['run'],request['attempt'],evidence,packages,source_scope)
        package_plan=package_export_plan(result['manifest']['packages'],row['packages']);result.pop('manifest');result['packageExport']=package_plan;results[game]=result
        shutil.copytree(evidence,out/'export'/row['evidence']['name']);target=out/'export'/row['packages']['name'];target.mkdir()
        shutil.copy2(packages/'build-manifest.json',target/'build-manifest.json')
        for name in package_plan['included']:shutil.copy2(packages/name,target/name)
    for path in [Path(__file__),Path(__file__).with_name('windows-export.py'),Path(__file__).with_name('artifact-draft-transfer.py'),ROOT/READER_WORKFLOW,ROOT/'joystick-games/shared/windows/tests/reexport.test.py']:
        target=provenance/'reader-source'/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
    files={}
    for path in sorted((out/'export').rglob('*')):
        assert not path.is_symlink()
        if path.is_file():assert path.stat().st_size<GIT_FILE_LIMIT;files[path.relative_to(out/'export').as_posix()]={'bytes':path.stat().st_size,'sha256':digest(path)}
    record={'schemaVersion':1,'sourceCommit':request['source'],'artifactRunId':request['run'],'artifactRunAttempt':request['attempt'],'originalRunConclusion':selection['originalRunConclusion'],'readerSourceCommit':os.environ['GITHUB_SHA'],'readerRunId':int(os.environ['GITHUB_RUN_ID']),'readerRunAttempt':int(os.environ['GITHUB_RUN_ATTEMPT']),'selectedGames':request['games'],'verifiedSelectedGames':list(results),'results':results,'gamesLaunched':False,'packagesBuilt':False,'originalReportsModified':False,'originalZipsRepacked':False,'releaseCreatedOrPublished':False,'authenticodeSigned':False,'physicalControllerTested':False,'allSelectedPackageBytesIncludedInGit':all(not result['packageExport']['references'] for result in results.values()),'files':files}
    write(out/'export/export-manifest.json',record)

def publish():
    request,out=environment();directory=out/'export';record=json.loads((directory/'export-manifest.json').read_text());assert record['readerSourceCommit']==os.environ['GITHUB_SHA'] and record['verifiedSelectedGames']==request['games']
    for name,item in record['files'].items():
        path=directory.joinpath(*safe_name(name));assert path.is_file() and not path.is_symlink() and path.stat().st_size==item['bytes'] and digest(path)==item['sha256']
    assert {p.relative_to(directory).as_posix() for p in directory.rglob('*') if p.is_file()}==set(record['files'])|{'export-manifest.json'}
    branch=f'build-assets/joystick-catalog-windows-reexport-{os.environ["GITHUB_RUN_ID"]}-attempt-{os.environ["GITHUB_RUN_ATTEMPT"]}';remote='https://github.com/'+REPO+'.git'
    assert not subprocess.check_output(['git','ls-remote','--heads',remote,'refs/heads/'+branch],text=True).strip()
    def git(*args):subprocess.run(['git','-C',str(directory),*args],check=True)
    git('init','-b','export');git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');git('add','.');git('commit','-m','Preserve verified original Windows packages without rerunning games [skip ci]');subprocess.run(['gh','auth','setup-git'],check=True);git('remote','add','origin',remote);git('push','--force-with-lease=refs/heads/'+branch+':','origin','HEAD:refs/heads/'+branch)

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=('fetch','verify','publish'));args=parser.parse_args()
    try:globals()[args.command]();return 0
    except Exception as error:
        # Exceptions from signed blob requests may contain private redirect URLs.
        target=Path(os.environ['RUNNER_TEMP'])/'windows-reexport/failure.json'
        locations=[{'file':Path(frame.filename).name,'function':frame.name,'line':frame.lineno} for frame in traceback.extract_tb(error.__traceback__)]
        write(target,{'phase':args.command,'status':'failed','errorType':type(error).__name__,'tracebackLocations':locations,'gamesLaunched':False,'packagesBuilt':False});print('Read-only Windows recovery failed: '+type(error).__name__,file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
