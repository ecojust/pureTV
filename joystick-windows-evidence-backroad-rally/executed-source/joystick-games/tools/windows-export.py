#!/usr/bin/env python3
"""Validate native Windows results and export an immutable, explicit partial result."""
import argparse,datetime as dt,hashlib,importlib.util,json,os,re,shutil,subprocess
from pathlib import Path
def canonical_source_hashes(values):
    """Accept original Windows separators without accepting path aliases."""
    assert isinstance(values,dict) and values,'Missing original source hashes'
    result={};folded=set()
    for original,digest in values.items():
        assert isinstance(original,str) and 0<len(original)<=1024,'Invalid source path'
        assert not ('/' in original and '\\' in original),'Mixed source separators'
        name=original.replace('\\','/');parts=name.split('/')
        assert 1<=len(parts)<=16 and all(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*',part) and not part.endswith('.') for part in parts),'Unsafe source path: '+original
        assert name not in result and name.casefold() not in folded,'Source path collision: '+original
        assert isinstance(digest,str) and re.fullmatch(r'[a-f0-9]{64}',digest),'Invalid source hash: '+original
        result[name]={'reportedPath':original,'sha256':digest};folded.add(name.casefold())
    return result


def verify_source_hashes(root,source,values,frozen_inputs):
    """Keep original report bytes; bind each canonical path to the frozen Git blob."""
    assert isinstance(source,str) and re.fullmatch(r'[a-f0-9]{40}',source),'Invalid frozen source commit'
    assert isinstance(frozen_inputs,dict),'Missing frozen source input manifest'
    root=Path(root).absolute();normalizations=[]
    for name,record in canonical_source_hashes(values).items():
        assert name in frozen_inputs,'QA source outside original input manifest: '+name
        expected=frozen_inputs[name]
        assert type(expected.get('bytes')) is int and expected['bytes']>=0 and expected.get('sha256')==record['sha256'],'QA source differs from original input manifest: '+name
        tree=subprocess.check_output(['git','-C',str(root),'ls-tree','-z',source,'--',name])
        rows=tree.split(b'\0');assert len(rows)==2 and rows[1]==b'','Frozen source path is not one Git entry: '+name
        header,git_path=rows[0].split(b'\t',1);mode,kind,oid=header.split(b' ')
        assert mode in (b'100644',b'100755') and kind==b'blob' and git_path==name.encode('ascii'),'Frozen QA source is not a regular blob: '+name
        blob=subprocess.check_output(['git','-C',str(root),'cat-file','blob',oid.decode('ascii')])
        assert len(blob)==expected['bytes'] and hashlib.sha256(blob).hexdigest()==record['sha256'],'QA source hash differs from frozen Git bytes: '+name
        path=root/name
        assert not any(part.is_symlink() for part in [path,*path.parents]),'Symlink source traversal: '+name
        assert path.is_file() and path.read_bytes()==blob,'Checkout differs from frozen QA source: '+name
        if record['reportedPath']!=name:normalizations.append(dict(record,canonicalPath=name,bytes=len(blob)))
    return normalizations


REPO='ecojust/pureTV'
WORKFLOW='.github/workflows/joystick-catalog-windows.yml'
BUILD_STEP='Build frozen app and installation packages'
GIT_FILE_LIMIT=100000000
MAX_PACKAGE_BYTES=128000000

def safe_relative(name):
    assert isinstance(name,str) and 0<len(name)<=1024 and '\\' not in name,'Unsafe evidence/package path'
    parts=name.split('/')
    assert len(parts)<=32 and all(re.fullmatch(r'[A-Za-z0-9_.-]+',part) and part not in ('.','..') and not part.endswith('.') for part in parts),'Unsafe evidence/package path'
    return name

def sha(path):
    value=hashlib.sha256()
    with path.open('rb') as stream:
        while block:=stream.read(1024*1024):value.update(block)
    return value.hexdigest()

def same(path,item):
    assert type(item.get('bytes')) is int and item['bytes']>=0 and isinstance(item.get('sha256'),str) and re.fullmatch('[a-f0-9]{64}',item['sha256']),'Invalid byte/hash record'
    assert path.is_file() and not any(p.is_symlink() for p in [path,*path.parents]),'Missing or symlink original file'
    assert path.stat().st_size==item['bytes'] and sha(path)==item['sha256'],'Original bytes differ: '+str(path)

def stamp(value):
    parsed=dt.datetime.fromisoformat(value.replace('Z','+00:00'));assert parsed.tzinfo is not None
    return parsed

def retained_artifact(run,jobs,artifacts,game,source,run_id,attempt,now=None):
    """A failed verify job may retain bytes; only its build/upload must succeed."""
    now=now or dt.datetime.now(dt.timezone.utc)
    assert type(run_id) is int and run_id>0 and type(attempt) is int and attempt>0
    assert re.fullmatch('[a-f0-9]{40}',source) and re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',game)
    assert run['id']==run_id and run['run_attempt']==attempt and run['head_sha']==source
    assert run['path']==WORKFLOW and run['event']=='workflow_dispatch' and run['status'] in ('in_progress','completed')
    assert run['repository']['full_name']==run['head_repository']['full_name']==REPO
    repository_id=run['repository']['id'];assert type(repository_id) is int and repository_id>0 and run['head_repository']['id']==repository_id
    matches=[j for j in jobs if j['name']==f'verify ({game})'];assert len(matches)==1,'Original verify job is not unique'
    job=matches[0];assert job['run_id']==run_id and job['run_attempt']==attempt and job['head_sha']==source and job['status']=='completed'
    assert type(job['id']) is int and job['id']>0
    builds=[s for s in job['steps'] if s['name']==BUILD_STEP];assert len(builds)==1 and builds[0]['status']=='completed' and builds[0]['conclusion']=='success','Original build did not succeed'
    uploads=[s for s in job['steps'] if s['name']=='Run actions/upload-artifact@v4'];assert len(uploads)==2 and builds[0]['number']<uploads[0]['number']<uploads[1]['number'],'Original upload layout changed'
    upload=uploads[1];assert upload['status']=='completed' and upload['conclusion']=='success','Original package upload did not succeed'
    matches=[a for a in artifacts if a['name']==f'joystick-windows-packages-{game}'];assert len(matches)==1,'Original package artifact is not unique'
    artifact=matches[0];assert type(artifact['id']) is int and artifact['id']>0 and artifact['expired'] is False and stamp(artifact['expires_at'])>now
    assert type(artifact['size_in_bytes']) is int and 0<artifact['size_in_bytes']<=1000000000
    assert isinstance(artifact.get('digest'),str) and re.fullmatch('sha256:[a-f0-9]{64}',artifact['digest']),'Missing original artifact digest'
    link=artifact['workflow_run'];assert link['id']==run_id and link['head_sha']==source and link['head_branch']==run['head_branch']
    assert link['repository_id']==link['head_repository_id']==repository_id
    started,ended,created=stamp(job['started_at']),stamp(job['completed_at']),stamp(artifact['created_at'])
    upload_start,upload_end=stamp(upload['started_at']),stamp(upload['completed_at'])
    build_start,build_end=stamp(builds[0]['started_at']),stamp(builds[0]['completed_at'])
    assert started<=build_start<=build_end<=upload_start<=upload_end<=ended and started<=created<=ended
    # Same bounded registration timestamp tolerance as the existing transfer tool.
    assert upload_start<=created<=upload_end+dt.timedelta(seconds=2),'Artifact outside original successful upload'
    return {'artifactId':artifact['id'],'artifactName':artifact['name'],'artifactDigest':artifact['digest'],'artifactBytes':artifact['size_in_bytes'],
            'sourceRunId':run_id,'sourceRunAttempt':attempt,'sourceCommit':source,'producerJobId':job['id'],'producerJobConclusion':job.get('conclusion'),
            'buildStepNumber':builds[0]['number'],'uploadStepNumber':upload['number'],'artifactCreatedAt':artifact['created_at'],
            'uploadEndOffsetSeconds':(created-upload_end).total_seconds(),'maximumUploadEndOffsetSeconds':2,
            'artifactUrl':f'https://github.com/{REPO}/actions/runs/{run_id}/artifacts/{artifact["id"]}',
            'expiresAt':artifact['expires_at'],'retentionIsNotRuntimeVerification':True}

def package_export_plan(packages,artifact,limit=MAX_PACKAGE_BYTES):
    assert type(limit) is int and 0<limit<=MAX_PACKAGE_BYTES and isinstance(packages,dict) and len(packages)==2
    archives=[n for n in packages if n.endswith('-windows-x64.zip')];installers=[n for n in packages if n.endswith('-windows-x64-setup.exe')]
    assert len(archives)==len(installers)==1 and archives[0][:-4]+'-setup.exe'==installers[0],'Unexpected original package filenames'
    included={};references={}
    for name,item in packages.items():
        assert '/' not in safe_relative(name) and re.fullmatch('[A-Za-z0-9][A-Za-z0-9_.-]*',name)
        assert type(item.get('bytes')) is int and 0<item['bytes']<limit and isinstance(item.get('sha256'),str) and re.fullmatch('[a-f0-9]{64}',item['sha256'])
        if item['bytes']<GIT_FILE_LIMIT:included[name]=dict(item)
        else:references[name]=dict(item,**artifact,gitBytesIncluded=False,publicPackageDeliveryComplete=False)
    return {'included':included,'references':references}

def assess_reports(game,source,binary_sha,installed,reports,job_conclusion):
    """Preserve an ordinary QA failure as unverified; reject contradictory identities."""
    reasons=[];normalizations_needed=[]
    if installed is None:reasons.append('installation_report_missing')
    else:
        assert installed['game']==game and installed['sourceCommit']==source,'Installation report identity differs'
        assert installed['status'] in ('passed','failed','running'),'Unknown installation status'
        if installed['status']!='passed':reasons.append('installation_'+installed['status'])
        else:
            assert installed['binarySha256']==binary_sha,'Installed executable differs from original package'
            assert all(installed.get(k) is True for k in ('installedBytesMatchPortable','completeFileSetVerified','uninstallPreservesUnrelatedFiles','uninstallRemovesOnlyPackagedFiles')),'Incomplete successful installation checks'
    for mode in ('runtime-normal','runtime-occupied'):
        report=reports.get(mode)
        if report is None:reasons.append(mode+'_report_missing');continue
        assert report['game']==game and report['qaSourceCommit']==source and report['binarySha256']==binary_sha,'Runtime report identity differs'
        assert report['status'] in ('passed','failed','running'),'Unknown runtime status'
        # Even failed reports retain their own exact executed source binding.
        assert isinstance(report.get('sourceHashes'),dict) and report['sourceHashes'],'Missing original QA source hashes'
        normalizations_needed.append(mode)
        if report['status']!='passed':reasons.append(mode+'_'+report['status']);continue
        assert len(report['tests'])==10 and all(t['status']=='passed' for t in report['tests']),'Incomplete successful runtime checks'
        storage=report['storageRestart'];assert storage['initialHydrationEqual'] is True and storage['cleanBrowserCacheVerified'] is True
        if report['qaPlan'].get('storageRestartRequired'):assert storage['status']=='passed' and storage['nativeSavedAfterQuit'] is True
    if job_conclusion!='success':reasons.append('producer_job_'+str(job_conclusion))
    return {'status':'built-unverified' if reasons else 'runtime-verified','runtimeVerified':not reasons,'unverifiedReasons':reasons,'sourceReports':normalizations_needed,'publicPackageDeliveryComplete':False}

def stage_export(original,destination,omitted):
    """Keep downloads untouched; omit only exact validated large package paths from Git."""
    original=Path(original).resolve();destination=Path(destination).absolute()
    assert not destination.exists() and not destination.is_relative_to(original) and not original.is_relative_to(destination)
    files={};omitted=set(omitted);seen=set()
    for name in omitted:
        parts=safe_relative(name).split('/')
        assert len(parts)==2 and re.fullmatch(r'joystick-windows-packages-[a-z0-9]+(?:-[a-z0-9]+)*',parts[0]) and parts[1].endswith(('-windows-x64.zip','-windows-x64-setup.exe')),'Only original package binaries may be referenced outside Git'
    for path in sorted(original.rglob('*')):
        assert not path.is_symlink(),'Symlink in original artifacts'
        if not path.is_file():continue
        name=safe_relative(path.relative_to(original).as_posix())
        if name in omitted:
            assert path.stat().st_size>=GIT_FILE_LIMIT,'Small file cannot be silently omitted';seen.add(name);continue
        assert path.stat().st_size<GIT_FILE_LIMIT,'Non-package evidence exceeds Git limit'
        files[name]={'bytes':path.stat().st_size,'sha256':sha(path)}
    assert seen==omitted,'Missing referenced original large package'
    destination.mkdir(parents=True)
    for name,item in files.items():
        target=destination/name;target.parent.mkdir(parents=True,exist_ok=True)
        try:os.link(original/name,target)
        except OSError:shutil.copy2(original/name,target)
        same(target,item)
    return files

def api(path):
    # gh handles repository-scoped authentication. Never log token or signed URLs.
    result=subprocess.run(['gh','api',path],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
    assert len(result.stdout)<=16*1024*1024,'API JSON exceeds bound'
    return json.loads(result.stdout)

def pages(path,field):
    values=[]
    for page in range(1,21):
        result=api(path+('?page=' if '?' not in path else '&page=')+str(page)+'&per_page=100')[field]
        assert isinstance(result,list);values.extend(result)
        if len(result)<100:return values
    raise AssertionError('API pagination exceeds bound')

def validate_download_layout(original,games):
    """Do not silently include an unrelated downloaded artifact or file."""
    original=Path(original)
    assert original.is_dir() and not original.is_symlink(),'Missing original artifact directory'
    required={'joystick-windows-evidence-'+game for game in games}
    allowed=required|{'joystick-windows-packages-'+game for game in games}
    entries={path.name:path for path in original.iterdir()}
    assert required<=set(entries)<=allowed,'Missing evidence or unrelated downloaded artifact'
    assert all(path.is_dir() and not path.is_symlink() for path in entries.values()),'Artifact root must be a real directory'

def main():
    p=argparse.ArgumentParser();p.add_argument('--directory',type=Path,required=True);args=p.parse_args()
    root=Path(__file__).resolve().parents[2];original=args.directory.resolve();out=original.with_name(original.name+'-git')
    source=os.environ['GITHUB_SHA'];run_id=int(os.environ['GITHUB_RUN_ID']);attempt=int(os.environ['GITHUB_RUN_ATTEMPT']);games=json.loads(os.environ['REQUESTED_GAMES'])
    assert os.environ['GITHUB_REPOSITORY']==REPO and re.fullmatch('[a-f0-9]{40}',source)
    assert subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()==source
    registry=json.loads((root/'joystick-games/catalog-registry.json').read_text())['games']
    assert isinstance(games,list) and 1<=len(games)<=9 and len(set(games))==len(games) and all(isinstance(g,str) and g in registry and re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',g) for g in games)
    validate_download_layout(original,games)
    scope_spec=importlib.util.spec_from_file_location('windows_inputs',Path(__file__).with_name('windows-inputs.py'));source_scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(source_scope)
    base=f'repos/{REPO}';run=api(f'{base}/actions/runs/{run_id}/attempts/{attempt}');jobs=pages(f'{base}/actions/runs/{run_id}/attempts/{attempt}/jobs','jobs');artifacts=pages(f'{base}/actions/runs/{run_id}/artifacts','artifacts')
    passed=[];path_normalizations=[];results={};omitted=[]
    for game in games:
        evidence=original/('joystick-windows-evidence-'+game);packages=original/('joystick-windows-packages-'+game)
        receipt=json.loads((evidence/'evidence-manifest.json').read_text(encoding='utf-8'));assert receipt['sourceCommit']==source and receipt['game']==game and receipt['runId']==str(run_id) and receipt['runAttempt']==str(attempt)
        for name,item in receipt['files'].items():same(evidence/safe_relative(name),item)
        assert {p.relative_to(evidence).as_posix() for p in evidence.rglob('*') if p.is_file()}==set(receipt['files'])|{'evidence-manifest.json'},'Unexpected evidence files'
        if not packages.is_dir():
            assert not any(a['name']==f'joystick-windows-packages-{game}' for a in artifacts),'Uploaded package artifact was not downloaded'
            results[game]={'status':'no-retained-package','runtimeVerified':False,'publicPackageDeliveryComplete':False};continue
        artifact=retained_artifact(run,jobs,artifacts,game,source,run_id,attempt)
        direct=api(f'{base}/actions/artifacts/{artifact["artifactId"]}');assert direct==next(a for a in artifacts if a['id']==artifact['artifactId']),'Original artifact metadata changed'
        manifest=json.loads((packages/'build-manifest.json').read_text(encoding='utf-8'));assert manifest['sourceCommit']==source and manifest['game']==game and manifest['committedInputsVerified'] is True and manifest['architecture']=='x86_64'
        assert (evidence/'build-manifest.json').read_bytes()==(packages/'build-manifest.json').read_bytes(),'Original evidence/package manifest differs'
        selection=source_scope.select(game);assert receipt['sourceScopeComplete'] is True and source_scope.file_records(selection)==manifest['inputFiles'],'Complete source closure differs from artifact'
        tree=subprocess.check_output(['git','-C',str(root),'ls-tree','-rz','--full-tree',source]);inventory={}
        for row in tree.split(b'\0'):
            if not row:continue
            header,name=row.split(b'\t',1);mode,kind,oid=header.split(b' ');inventory[name.decode()]={'mode':mode.decode(),'kind':kind.decode(),'sha':oid.decode()}
        source_scope.verify_complete_git_selection(selection,inventory)
        for name,item in manifest['inputFiles'].items():
            path=root/safe_relative(name);same(path,item);entry=inventory[name];assert entry['kind']=='blob' and entry['mode'] in ('100644','100755')
            raw=path.read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==entry['sha'],'Input differs from fixed Git blob'
        export_plan=package_export_plan(manifest['packages'],artifact,manifest['packageByteLimit'])
        for name,item in manifest['packages'].items():same(packages/name,item)
        assert {p.relative_to(packages).as_posix() for p in packages.rglob('*') if p.is_file()}==set(manifest['packages'])|{'build-manifest.json'},'Unexpected package files'
        installed_path=evidence/'package-verification.json';installed=json.loads(installed_path.read_text(encoding='utf-8')) if installed_path.is_file() else None
        reports={mode:json.loads((evidence/mode/'report.json').read_text(encoding='utf-8')) if (evidence/mode/'report.json').is_file() else None for mode in ('runtime-normal','runtime-occupied')}
        result=assess_reports(game,source,manifest['appFiles']['PureTVGame.exe']['sha256'],installed,reports,artifact['producerJobConclusion'])
        for mode in result.pop('sourceReports'):
            normalizations=verify_source_hashes(root,source,reports[mode]['sourceHashes'],manifest['inputFiles'])
            if normalizations:path_normalizations.append({'game':game,'mode':mode,'paths':normalizations})
        if result['runtimeVerified']:passed.append(game)
        results[game]=dict(result,artifact=artifact,packages=export_plan,originalManifestSha256=sha(packages/'build-manifest.json'),sourceInputsVerified=len(manifest['inputFiles']))
        omitted.extend(packages.name+'/'+name for name in export_plan['references'])
    provenance=original/'retention-provenance';provenance.mkdir(exist_ok=False)
    for name,value in [('run',run),('jobs',jobs),('artifacts',artifacts)]:
        (provenance/(name+'.json')).write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
    files=stage_export(original,out,omitted)
    branch=f'build-assets/joystick-catalog-windows-{run_id}-attempt-{attempt}'
    report={'sourceCommit':source,'runId':run_id,'runAttempt':attempt,'requestedGames':games,'verifiedGames':passed,'allGamesVerified':set(passed)==set(games),
            'builtUnverifiedGames':[g for g,r in results.items() if r['status']=='built-unverified'],'packageRetention':results,
            'allRetainedPackageBytesIncludedInGit':not omitted,'retentionIsNotPublication':True,'publicPackageDeliveryComplete':False,
            'nativePlatform':'windows-x64','authenticodeSigned':False,'physicalControllerTested':False,'sourceHashPathNormalizations':path_normalizations,'files':files}
    (out/'export-manifest.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    def git(*argv):subprocess.run(['git','-C',str(out),*argv],check=True)
    git('init','-b','export');git('config','core.autocrlf','false');git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');git('add','.');git('commit','-m','Preserve original Windows build bytes and explicit QA status [skip ci]')
    subprocess.run(['gh','auth','setup-git'],check=True);remote='https://github.com/ecojust/pureTV.git';git('remote','add','origin',remote)
    assert not subprocess.check_output(['git','ls-remote','--heads',remote,'refs/heads/'+branch],text=True).strip(),'Immutable export already exists'
    git('push','--force-with-lease=refs/heads/'+branch+':','origin','HEAD:refs/heads/'+branch)

if __name__=='__main__':main()
