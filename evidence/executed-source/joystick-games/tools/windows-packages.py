#!/usr/bin/env python3
"""Verify ZIP bytes, complete app file set and actual silent installer output."""
import argparse,hashlib,importlib.util,json,os,shutil,subprocess,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
scope_spec=importlib.util.spec_from_file_location('windows_inputs',Path(__file__).with_name('windows-inputs.py'));source_scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(source_scope)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def verify(args):
    assert sys.platform=='win32'
    source=args.source.resolve();manifest=json.loads((source/'build-manifest.json').read_text(encoding='utf-8'));assert manifest['sourceCommit']==subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    assert source_scope.file_records(source_scope.select(manifest['game']))==manifest['inputFiles'],'Complete source closure differs from package'
    for name,item in manifest['inputFiles'].items():
        assert (ROOT/name).stat().st_size==item['bytes'] and sha(ROOT/name)==item['sha256'],name
    for name,item in manifest['packages'].items():assert (source/name).stat().st_size==item['bytes'] and sha(source/name)==item['sha256'],name
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True);assert not any(out.iterdir())
    portable=out/'portable';portable.mkdir();archive=next(source.glob('*-windows-x64.zip'))
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        for item in z.infolist():assert not Path(item.filename).is_absolute() and '..' not in Path(item.filename).parts
        z.extractall(portable)
    app=next(portable.iterdir());assert app.is_dir()
    def check(folder,installer=False):
        files={p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file()}
        assert files==set(manifest['appFiles'])|({'Uninstall.exe'} if installer else set())
        for name,item in manifest['appFiles'].items():assert (folder/name).stat().st_size==item['bytes'] and sha(folder/name)==item['sha256'],name
    check(app)
    installed=out/'installed';installer=next(source.glob('*-setup.exe'))
    subprocess.run([str(installer),'/S','/D='+str(installed)],check=True,timeout=120);check(installed,True)
    # Exercise the actual uninstaller against unrelated files in both the root
    # and a nested directory. Never remove a chosen install directory recursively.
    sentinels=[installed/'unrelated-user-file.txt',installed/'Web'/'unrelated-user-file.txt']
    for path in sentinels:path.write_text('preserve unrelated user content',encoding='utf-8')
    uninstaller=out/'qa-uninstaller.exe';shutil.copy2(installed/'Uninstall.exe',uninstaller)
    subprocess.run([str(uninstaller),'/S','_?='+str(installed)],check=True,timeout=120)
    assert all(path.read_text(encoding='utf-8')=='preserve unrelated user content' for path in sentinels)
    assert all(not (installed/name).exists() for name in manifest['appFiles']),'Packaged file left after uninstall'
    for path in sentinels:path.unlink()
    subprocess.run([str(installer),'/S','/D='+str(installed)],check=True,timeout=120);check(installed,True)
    # Confirm the actual executable PE machine is AMD64, not an x86 launcher.
    binary=(installed/'PureTVGame.exe').read_bytes();assert binary[:2]==b'MZ';pe=int.from_bytes(binary[60:64],'little');assert binary[pe:pe+4]==b'PE\0\0' and int.from_bytes(binary[pe+4:pe+6],'little')==0x8664
    report={'status':'passed','game':manifest['game'],'sourceCommit':manifest['sourceCommit'],'packageHashesVerified':True,'zipCrcVerified':True,'completeFileSetVerified':True,'silentInstallerExecuted':True,'uninstallPreservesUnrelatedFiles':True,'uninstallRemovesOnlyPackagedFiles':True,'installedBytesMatchPortable':True,'peMachine':'AMD64','authenticodeSigned':False,'installedApp':str(installed),'binarySha256':sha(installed/'PureTVGame.exe'),'packages':manifest['packages']}
    (out/'package-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(installed)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True,type=Path);p.add_argument('--output',required=True,type=Path);verify(p.parse_args())
