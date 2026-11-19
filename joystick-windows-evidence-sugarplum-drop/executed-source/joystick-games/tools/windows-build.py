#!/usr/bin/env python3
"""Build the original Windows x64 host, exact frozen web assets and NSIS installer."""
import argparse, hashlib, json, os, platform, re, shutil, subprocess, sys, urllib.request, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'joystick-games/shared/windows'
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def inventory(folder):return {p.relative_to(folder).as_posix():{'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(folder.rglob('*')) if p.is_file()}
def run(*cmd):subprocess.run([str(x) for x in cmd],check=True)
def dependencies(output):
    output.mkdir(parents=True,exist_ok=True)
    lock=json.loads((SHARED/'dependencies.json').read_text(encoding='utf-8'))
    for name,item in lock.items():
        p=output/name
        if not p.is_file() or digest(p)!=item['sha256']:
            with urllib.request.urlopen(item['url'],timeout=60) as response:p.write_bytes(response.read())
        assert p.stat().st_size==item['bytes'] and digest(p)==item['sha256'],name
    with zipfile.ZipFile(output/'webview2.nupkg') as package:
        assert package.testzip() is None
        for member in package.infolist():
            assert not Path(member.filename).is_absolute() and '..' not in Path(member.filename).parts
        package.extractall(output/'webview2')
    return lock

def committed_blobs(source):
    # Passing <sha>:<path> to `git show` can hit Windows path probing limits
    # before Git parses the revision, even when Python can read that file.
    # Resolve the unchanged complete input set to object IDs first instead.
    tree=subprocess.check_output(['git','ls-tree','-r','-z',source],cwd=ROOT)
    result={}
    for row in tree.split(b'\0'):
        if not row:continue
        metadata,name=row.split(b'\t',1);mode,kind,oid=metadata.decode('ascii').split()
        if kind=='blob':result[name.decode('utf-8')]={'mode':mode,'oid':oid}
    return result

def committed_bytes(source_blobs,name):
    item=source_blobs.get(name)
    assert item is not None and item['mode'] in ('100644','100755'),'Not a committed regular file: '+name
    return subprocess.check_output(['git','cat-file','blob',item['oid']],cwd=ROOT)

def installer_text(meta,identity,folder,installer,app_files):
    def quote(value):return str(value).replace('$','$$').replace('"','$\\"')
    lines=[]
    for name in sorted(app_files):
        relative=name.replace('/', chr(92));lines.append('Delete "$INSTDIR'+chr(92)+quote(relative)+'"')
    lines.append('Delete "$INSTDIR'+chr(92)+'Uninstall.exe"')
    directories={str(parent).replace(chr(92),'/') for name in app_files for parent in Path(name).parents if str(parent)!='.'}
    for directory in sorted(directories,key=lambda name:(len(name.split('/')),name),reverse=True):
        lines.append('RMDir "$INSTDIR'+chr(92)+quote(directory.replace('/',chr(92)))+'"')
    lines.append('RMDir "$INSTDIR"')
    removal='\n'.join(lines)
    return '''Unicode true
!include "MUI2.nsh"
Name "'''+quote(meta['name'])+'''"
OutFile "'''+quote(installer)+'''"
InstallDir "$LOCALAPPDATA\\pureTV\\Games\\'''+meta['packageName']+'''"
RequestExecutionLevel user
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "SimpChinese"
Section
SetOutPath "$INSTDIR"
File /r "'''+quote(folder)+'''\\*"
CreateShortcut "$DESKTOP\\'''+quote(identity['appName'])+'''.lnk" "$INSTDIR\\PureTVGame.exe"
WriteUninstaller "$INSTDIR\\Uninstall.exe"
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'''+meta['packageName']+'''" "DisplayName" "'''+quote(meta['name'])+'''"
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'''+meta['packageName']+'''" "UninstallString" '"$INSTDIR\\Uninstall.exe"'
SectionEnd
Section "Uninstall"
Delete "$DESKTOP\\'''+quote(identity['appName'])+'''.lnk"
'''+removal+'''
DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'''+meta['packageName']+'''"
SectionEnd
'''

def toolchain(work,nsis):
    records=list(work.glob('CMakeFiles/*/CMakeCXXCompiler.cmake'))
    assert len(records)==1,'Expected one generated C++ compiler record'
    text=records[0].read_text(encoding='utf-8')
    def value(name):
        result=re.search(r'set\('+re.escape(name)+r' "([^"\n]+)"\)',text)
        assert result,'Missing compiler observation: '+name
        return result.group(1)
    compiler=Path(value('CMAKE_CXX_COMPILER'))
    assert compiler.is_file(),'Observed compiler executable missing'
    project=ET.parse(work/'PureTVGame.vcxproj')
    sdk=next((item.text for item in project.iter() if item.tag.rsplit('}',1)[-1]=='WindowsTargetPlatformVersion'),None)
    assert sdk,'Generated Visual Studio project did not record Windows SDK version'
    return {'cmakeVersion':subprocess.check_output(['cmake','--version'],text=True).splitlines()[0],
            'compilerId':value('CMAKE_CXX_COMPILER_ID'),'compilerVersion':value('CMAKE_CXX_COMPILER_VERSION'),
            'compilerPath':str(compiler),'compilerSha256':digest(compiler),
            'compilerRecordSha256':digest(records[0]),'windowsSdkVersion':sdk,
            'nsisVersion':subprocess.check_output([nsis,'/VERSION'],text=True).strip(),'nsisExecutableSha256':digest(Path(nsis))}

def build(args):
    assert sys.platform=='win32' and platform.machine().lower() in ('amd64','x86_64'),'Requires Windows x64 with MSVC'
    registry=json.loads((ROOT/'joystick-games/catalog-registry.json').read_text(encoding='utf-8'));assert args.game in registry['games']
    game=ROOT/'joystick-games'/args.game;meta=json.loads((game/'game.json').read_text(encoding='utf-8'));identity=registry['games'][args.game]
    assert meta['packageName']==identity['packageName'] and re.fullmatch(r'[A-Za-z0-9_.-]+',meta['packageName'])
    assert re.fullmatch(r'\d+\.\d+\.\d+',meta['version'])
    assert isinstance(meta['storageKeys'],list) and len(meta['storageKeys'])<=64
    assert all(isinstance(k,str) and re.fullmatch(r'[A-Za-z0-9_.:%-]{1,128}',k) and k not in ('__proto__','joystick.language') for k in meta['storageKeys'])
    assert len(set(meta['storageKeys']))==len(meta['storageKeys'])
    selected=[Path(__file__),ROOT/'joystick-games/catalog-registry.json']
    for directory in [SHARED,game,ROOT/'joystick-games/shared/web']:
        for p in directory.rglob('*'):
            if 'node_modules' in p.relative_to(directory).parts:continue
            assert not p.is_symlink(),p
            if p.is_file():selected.append(p)
    source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    source_files={};source_blobs=committed_blobs(source)
    for p in sorted(set(selected)):
        name=p.relative_to(ROOT).as_posix();raw=p.read_bytes()
        assert raw==committed_bytes(source_blobs,name),'Uncommitted build input: '+name
        source_files[name]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    out=args.output.resolve();assert not out.exists() or not any(out.iterdir()),'Output must be new/empty';out.mkdir(parents=True,exist_ok=True)
    deps=args.dependencies.resolve();lock=dependencies(deps)
    work=out/'build';run('cmake','-S',SHARED,'-B',work,'-A','x64','-DPURETV_DEPS='+str(deps));run('cmake','--build',work,'--config','Release');run('ctest','--test-dir',work,'-C','Release','--output-on-failure')
    folder=out/(identity['executable']+'-'+meta['version']+'-windows-x64');folder.mkdir();shutil.copy2(work/'Release/PureTVGame.exe',folder/'PureTVGame.exe');shutil.copy2(game/'game.json',folder/'game.json');shutil.copytree(game/'dist',folder/'Web')
    for p in (SHARED/'Web').iterdir():
        assert not (folder/'Web'/p.name).exists();shutil.copy2(p,folder/'Web'/p.name)
    for name in ('LICENSE','NOTICE.md','upstream.json'):
        if (game/name).is_file():shutil.copy2(game/name,folder/name)
    notices=folder/'Host-Licenses';notices.mkdir();shutil.copy2(deps/'json-LICENSE.MIT',notices/'nlohmann-json-MIT.txt')
    for p in (deps/'webview2').iterdir():
        if p.is_file() and re.search(r'license|notice',p.name,re.I):shutil.copy2(p,notices/p.name)
    (folder/'README.txt').write_text(meta['name']+'\nWindows 10 1903+ / Windows 11 x64. Requires Microsoft Edge WebView2 Runtime.\nRun PureTVGame.exe. The Web folder and game.json must remain beside it.\nThe game uses the pureTV Wi-Fi controller on TCP 63485 and DNS-SD _puretv._tcp.\nAllow this application on your private network when Windows Firewall asks.\nRuntime download: https://developer.microsoft.com/microsoft-edge/webview2/\nUnsigned community build. See bundled upstream notices.\n',encoding='utf-8')
    archive=out/(folder.name+'.zip')
    with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(folder.rglob('*')):
            if p.is_file():z.write(p,p.relative_to(out))
    installer=out/(folder.name+'-setup.exe');nsis=shutil.which('makensis') or str(Path(os.environ.get('ProgramFiles(x86)','C:/Program Files (x86)'))/'NSIS/makensis.exe');assert Path(nsis).is_file(),'NSIS must be installed'
    script=out/'installer.nsi';script.write_text(installer_text(meta,identity,folder,installer,inventory(folder)),encoding='utf-8');run(nsis,'/V2',script)
    assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==source
    for name,item in source_files.items():assert digest(ROOT/name)==item['sha256']
    manifest={'game':args.game,'version':meta['version'],'sourceCommit':source,'committedInputsVerified':True,'platform':'windows','architecture':'x86_64','minimumWindows':'10 1903','webView2Runtime':'Microsoft Edge WebView2 Evergreen, must be installed','authenticodeSigned':False,'physicalControllerTested':False,'toolchain':toolchain(work,nsis),'dependencies':lock,'inputFiles':source_files,'appFiles':inventory(folder),'packages':{p.name:{'bytes':p.stat().st_size,'sha256':digest(p)} for p in (archive,installer)}}
    (out/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'game':args.game,'output':str(out),'packages':list(manifest['packages'])}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--game',required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--dependencies',type=Path,required=True);build(p.parse_args())
