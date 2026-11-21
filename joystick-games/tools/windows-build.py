#!/usr/bin/env python3
"""Build the original Windows x64 host, exact frozen web assets and NSIS installer."""
import argparse, hashlib, importlib.util, json, os, platform, re, shutil, subprocess, sys, urllib.request, zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'joystick-games/shared/windows'
scope_spec=importlib.util.spec_from_file_location('windows_inputs',Path(__file__).with_name('windows-inputs.py'));source_scope=importlib.util.module_from_spec(scope_spec);scope_spec.loader.exec_module(source_scope)
policy_spec=importlib.util.spec_from_file_location('asset_policy',Path(__file__).with_name('asset-policy.py'));asset_policy=importlib.util.module_from_spec(policy_spec);policy_spec.loader.exec_module(asset_policy)
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
!define MUI_ICON "'''+quote(Path(folder)/'game.ico')+'''"
!define MUI_UNICON "'''+quote(Path(folder)/'game.ico')+'''"
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
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'''+meta['packageName']+'''" "DisplayIcon" "$INSTDIR\\PureTVGame.exe,0"
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

def asset_relative_path(name):
    assert isinstance(name,str) and len(name)<=1024 and '\\' not in name and '%' not in name,'Unsafe relative asset path'
    parts=name.split('/');assert 1<=len(parts)<=16,'Asset path exceeds depth limit'
    reserved={'CON','PRN','AUX','NUL',*(f'COM{i}' for i in range(1,10)),*(f'LPT{i}' for i in range(1,10))}
    assert all(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*',part) and not part.endswith('.') and part.split('.')[0].upper() not in reserved for part in parts),'Unsafe asset path: '+name
    assert not any(part in source_scope.CACHE for part in parts),'Cache or dependency directory inside packaged assets'
    return parts

def verify_web_assets(folder,meta,identity,with_host=False):
    folder=Path(os.path.abspath(folder))
    assert folder.is_dir() and not any(source_scope.is_link(p) for p in [folder,*folder.parents]),'Invalid or symlinked distribution directory'
    explicit=asset_policy.declaration(meta,identity);limits=asset_policy.limits(meta,identity,'windows')
    types={'.html','.js','.css','.json','.txt','.svg','.png','.webp','.jpg','.jpeg','.ico','.woff','.woff2','.ttf','.otf','.ogg','.wav','.mp3'}
    if explicit:types.update(asset_policy.EXTRA_EXTENSIONS)
    paths=list(folder.rglob('*'));assert len(paths)<=4096,'Too many asset files/directories'
    files={};seen=set()
    for path in paths:
        assert not source_scope.is_link(path),'Symlink distribution asset: '+str(path)
        relative=path.relative_to(folder).as_posix();parts=asset_relative_path(relative)
        assert relative.casefold() not in seen,'Case-insensitive asset path collision: '+relative
        seen.add(relative.casefold())
        assert explicit or (len(parts)==1 and path.is_file()),'Nested distribution requires explicit assetPolicy'
        if path.is_dir():continue
        assert path.is_file(),'Non-regular distribution asset: '+relative
        text_notice=explicit is not None and re.fullmatch(r'(?:[A-Za-z0-9][A-Za-z0-9_-]*_)?(?:LICENSE|NOTICE|COPYING)',path.name) is not None
        assert path.suffix.lower() in types or text_notice,'Unsupported distribution asset: '+relative
        assert with_host or relative.casefold() not in ('bridge.js','bootstrap.js','diagnostics.js'),'Reserved host asset: '+relative
        assert path.stat().st_size<=limits['maxAssetBytes'],'Asset exceeds declared budget: '+relative
        files[relative]={'bytes':path.stat().st_size,'sha256':digest(path)}
    assert 'tv.html' in files,'Missing exact TV entry page'
    assert len(files)<=asset_policy.MAX_FILES,'Too many distribution assets'
    total=sum(item['bytes'] for item in files.values());assert total<=limits['maxTotalBytes'],'Web assets exceed declared total budget'
    index=json.dumps(files,sort_keys=True,separators=(',',':')).encode('utf-8');assert len(index)<=asset_policy.MAX_INDEX_BYTES,'Asset inventory exceeds index byte budget'
    return {'explicit':explicit is not None,'limits':limits,'files':len(files),'nodes':len(paths),'totalBytes':total,'indexBytes':len(index),'assetFiles':dict(sorted(files.items())),'resourceServing':'WebView2 virtual-host folder mapping; browser MIME detection','expectedAudioMimeTypes':{'.opus':'audio/ogg','.m4a':'audio/mp4'} if explicit else {},'expectedExtraMimeTypes':{'.md':'text/plain','extensionlessNotices':'text/plain','.webmanifest':'application/manifest+json'} if explicit else {}}

def copy_web_assets(source,destination,meta,identity):
    before=verify_web_assets(source,meta,identity)
    destination=Path(os.path.abspath(destination))
    assert not destination.exists() and not any(source_scope.is_link(p) for p in [destination,*destination.parents]),'Web destination must be new without symlink traversal'
    destination.mkdir(parents=True)
    for name in before['assetFiles']:
        origin=source/name;assert not any(source_scope.is_link(p) for p in [origin,*origin.parents]),'Source asset changed into symlink'
        target=destination/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(origin,target)
    after=verify_web_assets(destination,meta,identity)
    assert after['assetFiles']==before['assetFiles'],'Copied Web tree differs from frozen relative paths or bytes'
    assert verify_web_assets(source,meta,identity)['assetFiles']==before['assetFiles'],'Source assets changed while copying'
    return before

def storage_keys(meta,identity):
    explicit=asset_policy.declaration(meta,identity)
    keys=meta.get('storageKeys');assert isinstance(keys,list) and len(keys)<=(512 if explicit else 64),'Invalid declared storage key count'
    assert all(isinstance(k,str) and re.fullmatch(r'[A-Za-z0-9_.:%-]{1,128}',k) and k not in ('__proto__','joystick.language') for k in keys),'Invalid exact storage key'
    assert len(set(keys))==len(keys),'Duplicate storage key'
    return keys

def icon_resource(icon_path):
    rc = icon_path.with_suffix('.rc')
    rc.write_text('101 ICON "' + icon_path.resolve().as_posix().replace('"', '\\"') + '"\n', encoding='utf-8')
    return rc

def build(args):
    assert sys.platform=='win32' and platform.machine().lower() in ('amd64','x86_64'),'Requires Windows x64 with MSVC'
    registry=json.loads((ROOT/'joystick-games/catalog-registry.json').read_text(encoding='utf-8'));assert args.game in registry['games']
    game=ROOT/'joystick-games'/args.game;meta=json.loads((game/'game.json').read_text(encoding='utf-8'));identity=registry['games'][args.game]
    assert meta['packageName']==identity['packageName'] and re.fullmatch(r'[A-Za-z0-9_.-]+',meta['packageName'])
    assert re.fullmatch(r'\d+\.\d+\.\d+',meta['version'])
    storage_keys(meta,identity)
    verify_web_assets(game/'dist',meta,identity)
    selection=source_scope.select(args.game);selected=[ROOT/name for name in selection['files']]
    source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    source_files={};source_blobs=committed_blobs(source)
    source_scope.verify_complete_git_selection(selection,source_blobs)
    for p in sorted(set(selected)):
        name=p.relative_to(ROOT).as_posix();raw=p.read_bytes()
        assert raw==committed_bytes(source_blobs,name),'Uncommitted build input: '+name
        source_files[name]={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
    out=args.output.resolve();assert not out.exists() or not any(out.iterdir()),'Output must be new/empty';out.mkdir(parents=True,exist_ok=True)
    sys.path.insert(0,str(ROOT/'tools'))
    from game_icons import save_ico
    icon=out/'game.ico';save_ico(game,icon);rc=icon_resource(icon)
    deps=args.dependencies.resolve();lock=dependencies(deps)
    work=out/'build';run('cmake','-S',SHARED,'-B',work,'-A','x64','-DPURETV_DEPS='+str(deps),'-DPURETV_GAME_ICON_RC='+str(rc));run('cmake','--build',work,'--config','Release');run('ctest','--test-dir',work,'-C','Release','--output-on-failure')
    folder=out/(identity['executable']+'-'+meta['version']+'-windows-x64');folder.mkdir();shutil.copy2(work/'Release/PureTVGame.exe',folder/'PureTVGame.exe');shutil.copy2(game/'game.json',folder/'game.json');copy_web_assets(game/'dist',folder/'Web',meta,identity)
    shutil.copyfile(icon,folder/'game.ico')
    for p in (SHARED/'Web').iterdir():
        assert not (folder/'Web'/p.name).exists();shutil.copy2(p,folder/'Web'/p.name)
    web_policy=verify_web_assets(folder/'Web',meta,identity,with_host=True)
    for name in ('LICENSE','LICENSE.txt','NOTICE.md','upstream.json'):
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
    package_limit=asset_policy.desktop_package_limit(meta,identity)
    assert all(p.stat().st_size<package_limit for p in (archive,installer)),'Desktop package exceeds declared limit'
    assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()==source
    assert source_scope.file_records(source_scope.select(args.game))==source_files,'Source file set or bytes changed during build'
    manifest={'game':args.game,'version':meta['version'],'sourceCommit':source,'committedInputsVerified':True,'platform':'windows','architecture':'x86_64','minimumWindows':'10 1903','webView2Runtime':'Microsoft Edge WebView2 Evergreen, must be installed','authenticodeSigned':False,'physicalControllerTested':False,'toolchain':toolchain(work,nsis),'dependencies':lock,'webAssets':web_policy,'packageByteLimit':package_limit,'inputFiles':source_files,'inputScope':selection,'appFiles':inventory(folder),'packages':{p.name:{'bytes':p.stat().st_size,'sha256':digest(p)} for p in (archive,installer)}}
    (out/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'game':args.game,'output':str(out),'packages':list(manifest['packages'])}))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--game',required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--dependencies',type=Path,required=True);build(p.parse_args())
