#!/usr/bin/env python3
"""Validate native Windows results and export an immutable, explicit partial result."""
import argparse,hashlib,importlib.util,json,os,re,subprocess
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


def main():
    p=argparse.ArgumentParser();p.add_argument('--directory',type=Path,required=True);args=p.parse_args()
    root=Path(__file__).resolve().parents[2];out=args.directory.resolve();source=os.environ['GITHUB_SHA'];games=json.loads(os.environ['REQUESTED_GAMES']);passed=[];path_normalizations=[]
    scope_spec=importlib.util.spec_from_file_location('windows_inputs',Path(__file__).with_name('windows-inputs.py'));source_scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(source_scope)
    def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
    def same(path,item):assert path.stat().st_size==item['bytes'] and sha(path)==item['sha256'],path
    for game in games:
        evidence=out/('joystick-windows-evidence-'+game);packages=out/('joystick-windows-packages-'+game)
        receipt=json.loads((evidence/'evidence-manifest.json').read_text(encoding='utf-8'));assert receipt['sourceCommit']==source and receipt['game']==game and receipt['runId']==os.environ['GITHUB_RUN_ID'] and receipt['runAttempt']==os.environ['GITHUB_RUN_ATTEMPT']
        for name,item in receipt['files'].items():same(evidence/name,item)
        if not packages.is_dir():continue
        manifest=json.loads((packages/'build-manifest.json').read_text(encoding='utf-8'));assert manifest['sourceCommit']==source and manifest['game']==game and manifest['committedInputsVerified'] and manifest['architecture']=='x86_64'
        assert receipt['sourceScopeComplete'] and source_scope.file_records(source_scope.select(game))==manifest['inputFiles'],'Complete source closure differs from artifact'
        for name,item in manifest['inputFiles'].items():same(root/name,item)
        for name,item in manifest['packages'].items():same(packages/name,item)
        installed=json.loads((evidence/'package-verification.json').read_text(encoding='utf-8'));assert installed['status']=='passed' and installed['sourceCommit']==source and installed['installedBytesMatchPortable'] and installed['completeFileSetVerified'] and installed['uninstallPreservesUnrelatedFiles'] and installed['uninstallRemovesOnlyPackagedFiles']
        for mode in ['runtime-normal','runtime-occupied']:
            report=json.loads((evidence/mode/'report.json').read_text(encoding='utf-8'));assert report['status']=='passed' and report['game']==game and report['qaSourceCommit']==source and report['binarySha256']==installed['binarySha256']
            assert len(report['tests'])==10 and all(t['status']=='passed' for t in report['tests'])
            assert report['storageRestart']['initialHydrationEqual'] and report['storageRestart']['cleanBrowserCacheVerified']
            if report['qaPlan'].get('storageRestartRequired'):assert report['storageRestart']['status']=='passed' and report['storageRestart']['nativeSavedAfterQuit']
            normalizations=verify_source_hashes(root,source,report['sourceHashes'],manifest['inputFiles'])
            if normalizations:path_normalizations.append({'game':game,'mode':mode,'paths':normalizations})
        passed.append(game)
    files={}
    for path in sorted(out.rglob('*')):
        assert not path.is_symlink()
        if path.is_file():
            assert path.stat().st_size<100000000,'Git export needs a smaller package or a release-asset transport: '+str(path)
            files[path.relative_to(out).as_posix()]={'bytes':path.stat().st_size,'sha256':sha(path)}
    branch=f"build-assets/joystick-catalog-windows-{os.environ['GITHUB_RUN_ID']}-attempt-{os.environ['GITHUB_RUN_ATTEMPT']}"
    report={'sourceCommit':source,'runId':int(os.environ['GITHUB_RUN_ID']),'runAttempt':int(os.environ['GITHUB_RUN_ATTEMPT']),'requestedGames':games,'verifiedGames':passed,'allGamesVerified':set(passed)==set(games),'nativePlatform':'windows-x64','authenticodeSigned':False,'physicalControllerTested':False,'sourceHashPathNormalizations':path_normalizations,'files':files}
    (out/'export-manifest.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    assert os.environ['GITHUB_REPOSITORY']=='ecojust/pureTV'
    def git(*argv):subprocess.run(['git','-C',str(out),*argv],check=True)
    git('init','-b','export');git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');git('add','.');git('commit','-m','Preserve original Windows joystick packages and evidence [skip ci]')
    subprocess.run(['gh','auth','setup-git'],check=True);remote='https://github.com/ecojust/pureTV.git';git('remote','add','origin',remote)
    assert not subprocess.check_output(['git','ls-remote','--heads',remote,'refs/heads/'+branch],text=True).strip(),'Immutable export already exists'
    git('push','--force-with-lease=refs/heads/'+branch+':','origin','HEAD:refs/heads/'+branch)

if __name__=='__main__':main()
