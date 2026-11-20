#!/usr/bin/env python3
"""Build registered upstream games as standalone universal macOS clients."""
import argparse, hashlib, importlib.util, json, platform, plistlib, re, shutil, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'joystick-games/shared/macos'
LEGACY_GAMES={'cf-transport-ship':('CF Transport Ship','CFTransportShip','CF'), 'qq-speed':('QQ Speed','QQSpeed','QQ')}
REGISTRY=ROOT/'joystick-games/catalog-registry.json'
POLICY_PATH='joystick-games/tools/asset-policy.py'
policy_spec=importlib.util.spec_from_file_location('macos_asset_policy',Path(__file__).with_name('asset-policy.py'))
asset_policy=importlib.util.module_from_spec(policy_spec);policy_spec.loader.exec_module(asset_policy)
def registry_data(raw):
    def unique(pairs):
        result={}
        for key,value in pairs:
            assert key not in result,'Duplicate registry JSON key: '+key
            result[key]=value
        return result
    return json.loads(raw,object_pairs_hook=unique)

def registry_games():
    if not REGISTRY.exists():return {}
    raw=registry_data(REGISTRY.read_text());assert raw['schemaVersion']==1 and isinstance(raw['games'],dict)
    games=raw['games'];packages={'com.ecojust.joystickcf','com.ecojust.joystickqqspeed'};executables={v[1] for v in LEGACY_GAMES.values()};names={v[0] for v in LEGACY_GAMES.values()}
    for slug,meta in games.items():
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) and slug not in LEGACY_GAMES,slug
        assert isinstance(meta,dict) and all(isinstance(meta.get(k),str) for k in ['packageName','appName','executable','initials']),slug
        assert re.fullmatch(r'[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)+',meta['packageName']),slug
        assert re.fullmatch(r'[A-Za-z][A-Za-z0-9 ]{0,79}',meta['appName']),slug
        assert re.fullmatch(r'[A-Za-z][A-Za-z0-9]{0,63}',meta['executable']),slug
        assert re.fullmatch(r'[A-Z0-9]{1,4}',meta['initials']),slug
        assert meta['packageName'] not in packages and meta['executable'] not in executables and meta['appName'] not in names,'Duplicate application identity'
        packages.add(meta['packageName']);executables.add(meta['executable']);names.add(meta['appName'])
    assert isinstance(raw['batches'],dict)
    for name,slugs in raw['batches'].items():
        assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',name) and isinstance(slugs,list) and slugs and len(set(slugs))==len(slugs),name
        assert all(slug in games for slug in slugs),name
    return games

def game_identity(slug,meta):
    if slug in LEGACY_GAMES:return LEGACY_GAMES[slug]
    registered=registry_games()[slug];assert meta['packageName']==registered['packageName'],'Game package differs from registry'
    return tuple(registered[k] for k in ['appName','executable','initials'])
def resource_policy(slug,meta):
    registered=None if slug in LEGACY_GAMES else registry_games()[slug]
    return asset_policy.declaration(meta,registered),asset_policy.limits(meta,registered,'macos')

def web_asset_paths(root,explicit=False):
    """Validate every path before copying; never flatten or silently omit nodes."""
    assert root.is_dir() and not any(p.is_symlink() for p in [root,*root.parents]),'Invalid distribution directory'
    result=[];seen=set();nodes=0
    def walk(folder):
        nonlocal nodes
        for path in sorted(folder.iterdir()):
            relative=path.relative_to(root);name=relative.as_posix();nodes+=1
            assert nodes<=4096,'Too many bundled asset nodes'
            assert len(name)<=1024 and len(relative.parts)<=16,'Bundled asset path exceeds limit: '+name
            assert re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*',path.name),'Unsafe bundled asset path: '+name
            stem=path.name.split('.')[0].upper()
            assert not path.name.endswith('.') and stem not in {'CON','PRN','AUX','NUL',*(f'COM{i}' for i in range(1,10)),*(f'LPT{i}' for i in range(1,10))},'Nonportable bundled asset path: '+name
            assert path.name not in ('node_modules','__pycache__'),'Cache directory in bundled assets: '+name
            assert not path.is_symlink(),'Symlink in bundled assets: '+name
            assert name.casefold() not in seen,'Case-insensitive bundled asset collision: '+name
            seen.add(name.casefold())
            if path.is_dir():
                assert explicit,'Nested bundled assets require explicit assetPolicy: '+name
                walk(path)
            else:
                assert path.is_file(),'Not a regular bundled asset: '+name
                result.append(path)
                assert len(result)<=asset_policy.MAX_FILES,'Too many bundled assets'
    walk(root)
    assert len(json.dumps([p.relative_to(root).as_posix() for p in result],separators=(',',':')).encode())<=asset_policy.MAX_INDEX_BYTES,'Bundled asset path index exceeds limit'
    return result

def copy_web_assets(source,web,limits,explicit=False):
    types={'.html','.js','.css','.json','.txt','.svg','.png','.webp','.jpg','.jpeg','.ico','.woff','.woff2','.ttf','.otf','.ogg','.wav','.mp3'}
    if explicit:types.update(asset_policy.EXTRA_EXTENSIONS)
    paths=web_asset_paths(source,explicit)
    assert not any(p.name.casefold() in ('bridge.js','game-config.json') for p in source.iterdir()),'Reserved root distribution asset'
    total=0
    for path in paths:
        name=path.relative_to(source).as_posix()
        notice=re.fullmatch(r'(?:[A-Za-z0-9][A-Za-z0-9_-]*_)?(?:LICENSE|NOTICE|COPYING)',path.name)
        assert path.suffix.lower() in types or (explicit and notice),'Unsupported distribution asset: '+name
        assert name.casefold() not in ('bridge.js','game-config.json'),'Reserved distribution asset: '+name
        size=path.stat().st_size
        assert (size<=limits['maxAssetBytes'] if explicit else size<limits['maxAssetBytes']),path
        total+=size
        assert total<=limits['maxTotalBytes'],'Resources exceed total budget'
    for path in paths:
        target=web/path.relative_to(source);target.parent.mkdir(parents=True,exist_ok=True)
        assert not any(p.is_symlink() for p in [target,*target.parents]),'Symlinked copy target'
        shutil.copy2(path,target)
    assert (web/'tv.html').is_file(),'Missing TV entry page'

def verify_web_budget(web,limits,explicit=False):
    paths=web_asset_paths(web,explicit)
    assert all(p.stat().st_size<=limits['maxAssetBytes'] for p in paths),'Generated resource exceeds asset budget'
    assert sum(p.stat().st_size for p in paths)<=limits['maxTotalBytes'],'Resources exceed total budget'
def storage_keys(slug,meta):
    if slug in LEGACY_GAMES and 'storageKeys' not in meta:return None
    value=meta.get('storageKeys')
    maximum=64
    if 'assetPolicy' in meta:
        declaration,_=resource_policy(slug,meta)
        assert declaration is not None and meta.get('id')==slug,'Expanded storage keys require the registered game resource policy'
        maximum=512
    assert isinstance(value,list) and len(value)<=maximum,'Catalog game.json must declare bounded exact storageKeys (empty if unused)'
    assert all(isinstance(key,str) and re.fullmatch(r'[A-Za-z0-9_.:%-]{1,128}',key) and key not in ['joystick.language','__proto__'] for key in value),'Invalid storage key'
    assert len(set(value))==len(value),'Duplicate storage key'
    return value
GAMES={**LEGACY_GAMES,**registry_games()}
def run(*args,**kwargs):
    return subprocess.run([str(a) for a in args],check=True,**kwargs)
def capture(*args):return subprocess.check_output([str(a) for a in args],text=True).strip()
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def regular_input(p):
    assert p.is_file() and not any(q.is_symlink() for q in [p,*p.parents]), 'Input must be a regular file without symlink traversal: '+str(p)
    return {'bytes':p.stat().st_size,'sha256':digest(p)}
def verify_committed(root,items,commit):
    assert re.fullmatch('[a-f0-9]{40}',commit)
    for name,item in items.items():
        p=root/name
        assert regular_input(p)==item, 'Input changed before committed-source check: '+name
        data=subprocess.check_output(['git','-C',str(root),'show',commit+':'+name],stderr=subprocess.PIPE)
        assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'], 'Input differs from frozen Git commit: '+name

def files(root):return {p.relative_to(root).as_posix():{'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(root.rglob('*')) if p.is_file()}
def inputs(game):
    selected=[]
    folders=[SHARED,ROOT/'joystick-games/shared/web',game/'src',game/'dist']
    if game.name not in LEGACY_GAMES:
        folders.extend(p for p in (ROOT/'joystick-games/shared').iterdir() if p.is_dir() and p.name not in ['macos','web','android'])
        folders.extend(p for p in [game/'tests',game/'test',game/'qa'] if p.exists())
    for folder in folders:
        assert folder.is_dir() and not folder.is_symlink(), 'Missing or symlinked source directory: '+str(folder)
        for p in folder.rglob('*'):
            if '__pycache__' in p.parts:continue
            assert not p.is_symlink(), 'Symlink in source tree: '+str(p)
            if p.is_file():selected.append(p)
    # Installed dependencies are outside the source inventory, including a
    # developer's root node_modules symlink. Lockfiles and vendored code remain.
    selected.extend(p for p in game.iterdir() if p.name!='node_modules' and (p.is_file() or p.is_symlink()))
    selected.extend(p for p in (ROOT/'joystick-games/tools').glob('macos-*') if p.is_file())
    selected.append(ROOT/'.github/workflows/joystick-games-macos.yml')
    selected.append(ROOT/POLICY_PATH)
    audio_fixtures=ROOT/'joystick-games/tools/fixtures/audio'
    if audio_fixtures.exists():selected.extend(p for p in audio_fixtures.rglob('*') if p.is_file() or p.is_symlink())
    if game.name not in LEGACY_GAMES:
        selected.extend([REGISTRY,ROOT/'joystick-games/tools/qa-plan.py',ROOT/'puretv-joystick/joystick_sdk.py'])
        selected.extend((ROOT/'.github/workflows').glob('joystick-catalog-macos*.yml'))
    return {p.relative_to(ROOT).as_posix():regular_input(p) for p in sorted(set(selected))}
def host_cache_inputs(sdk):
    source={p.relative_to(ROOT).as_posix():regular_input(p) for p in sorted((SHARED/'Sources').glob('*.swift'))}
    # Toolchain and compiler options are part of the key, not just app sources.
    return {'schemaVersion':1,'sources':source,'builder':regular_input(Path(__file__)),
        'swiftVersion':capture('xcrun','swiftc','--version'),'swiftCompiler':regular_input(Path(capture('xcrun','--find','swiftc')).resolve()),
        'sdkPath':str(sdk),'sdkVersion':capture('xcrun','--sdk','macosx','--show-sdk-version'),
        'sdkBuildVersion':capture('xcrun','--sdk','macosx','--show-sdk-build-version'),
        'sdkSettings':regular_input(Path(sdk)/'SDKSettings.json'),
        'architectures':['arm64','x86_64'],'target':'apple-macos11.0',
        'compilerArguments':['-swift-version','5','-O','-module-name','JoystickGame','-framework','AppKit','-framework','WebKit','-framework','Network']}

def validate_cached_host(cache,expected):
    assert cache.is_dir() and not any(p.is_symlink() for p in [cache,*cache.parents]),'Host cache must not traverse symlinks'
    assert {p.name for p in cache.iterdir()}=={'JoystickGame','host-manifest.json'},'Unexpected host cache files'
    manifest=json.loads((cache/'host-manifest.json').read_text())
    assert manifest['inputs']==expected,'Host cache inputs differ'
    assert regular_input(cache/'JoystickGame')==manifest['binary'],'Host cache binary changed'
    assert (cache/'JoystickGame').stat().st_mode & 0o111,'Host cache lost executable mode'
    assert set(capture('lipo','-archs',cache/'JoystickGame').split())=={'arm64','x86_64'},'Host cache architecture mismatch'
    return manifest

def compile_host(work,sdk,cache_root=None):
    expected=host_cache_inputs(sdk);key=hashlib.sha256(json.dumps(expected,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    cache=None
    if cache_root is not None:
        assert not any(p.is_symlink() for p in [cache_root,*cache_root.parents]),'Host cache must not traverse symlinks'
        cache_root=cache_root.resolve();assert not cache_root.is_relative_to(ROOT),'Host cache must be outside repository'
        cache_root.mkdir(parents=True,exist_ok=True);cache=cache_root/key
        if cache.exists():return cache/'JoystickGame',dict(validate_cached_host(cache,expected),cacheKey=key,reused=True)
    binaries=[]
    for arch in expected['architectures']:
        target=work/('JoystickGame-'+arch)
        run('xcrun','swiftc','-target',arch+'-'+expected['target'],'-sdk',sdk,*expected['compilerArguments'],*sorted((SHARED/'Sources').glob('*.swift')),'-o',target);binaries.append(target)
    universal=work/'JoystickGame';run('lipo','-create',*binaries,'-output',universal)
    assert set(capture('lipo','-archs',universal).split())=={'arm64','x86_64'}
    assert host_cache_inputs(sdk)==expected,'Host compiler inputs changed during compilation'
    manifest={'inputs':expected,'binary':regular_input(universal)}
    if cache is not None:
        # Write once; existing entries are verified and never silently replaced.
        cache.mkdir();shutil.copy2(universal,cache/'JoystickGame');(cache/'host-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        validate_cached_host(cache,expected)
    return universal,dict(manifest,cacheKey=key,reused=False)

def make_icon(work,resources,initials):
    source=work/'icon.swift'
    source.write_text('''import AppKit
let image=NSImage(size:NSSize(width:1024,height:1024))
image.lockFocus()
NSColor(calibratedRed:0.06,green:0.12,blue:0.20,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:70,y:70,width:884,height:884),xRadius:190,yRadius:190).fill()
let symbol=NSImage(systemSymbolName:"gamecontroller.fill",accessibilityDescription:nil)!
let tinted=NSImage(size:symbol.size)
tinted.lockFocus();NSColor(calibratedRed:0.45,green:0.89,blue:0.84,alpha:1).setFill()
NSRect(origin:.zero,size:symbol.size).fill();symbol.draw(at:.zero,from:.zero,operation:.destinationIn,fraction:1);tinted.unlockFocus()
tinted.draw(in:NSRect(x:220,y:400,width:584,height:420))
let label="'''+initials+'''" as NSString
label.draw(at:NSPoint(x:355,y:180),withAttributes:[.font:NSFont.boldSystemFont(ofSize:160),.foregroundColor:NSColor.white])
image.unlockFocus()
let bitmap=NSBitmapImageRep(data:image.tiffRepresentation!)!
try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:CommandLine.arguments[1]))
''')
    renderer=work/'icon';run('xcrun','swiftc','-swift-version','5',source,'-o',renderer)
    png=work/'icon.png';run(renderer,png)
    iconset=work/'Game.iconset';iconset.mkdir()
    for points in [16,32,128,256,512]:
        for scale in [1,2]:
            name=f'icon_{points}x{points}'+('@2x' if scale==2 else '')+'.png'
            run('sips','-z',points*scale,points*scale,png,'--out',iconset/name,stdout=subprocess.DEVNULL)
    run('iconutil','-c','icns',iconset,'-o',resources/'Game.icns')
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--game',choices=GAMES,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--host-cache',type=Path);args=parser.parse_args()
    if platform.system()!='Darwin':parser.error('Requires macOS with Xcode Command Line Tools')
    game=ROOT/'joystick-games'/args.game;meta=registry_data((game/'game.json').read_text());name,executable,initials=game_identity(args.game,meta);persistent_keys=storage_keys(args.game,meta)
    source_commit=capture('git','-C',ROOT,'rev-parse','HEAD');source_inputs=inputs(game);verify_committed(ROOT,source_inputs,source_commit)
    assert meta['id']==args.game and re.fullmatch(r'\d+\.\d+\.\d+',meta['version'])
    assert meta['players']==1 and isinstance(meta['versionCode'],int) and meta['versionCode']>0
    out=args.output.resolve();assert not out.is_relative_to(ROOT),'Use an output outside the repository'
    out.mkdir(parents=True,exist_ok=True);assert not any(out.iterdir()),'Retain previous builds; select a fresh output'
    app=out/(name+'.app');contents=app/'Contents';resources=contents/'Resources';web=resources/'Web';binary=contents/'MacOS';web.mkdir(parents=True);binary.mkdir()
    declaration,limits=resource_policy(args.game,meta)
    copy_web_assets(game/'dist',web,limits,explicit=declaration is not None)
    assert not (web/'bridge.js').exists();shutil.copy2(SHARED/'Web/bridge.js',web/'bridge.js')
    (web/'game-config.json').write_text(json.dumps(meta,ensure_ascii=False)+'\n')
    verify_web_budget(web,limits,explicit=declaration is not None)
    for p in [game/'NOTICE.md',game/'LICENSE',game/'LICENSE.txt',game/'UPSTREAM.md',game/'upstream.json']:
        if p.is_file():shutil.copy2(p,resources/p.name)
    info={'CFBundleName':name,'CFBundleDisplayName':meta['name'],'CFBundleIdentifier':meta['packageName'],'CFBundleExecutable':executable,'CFBundlePackageType':'APPL','CFBundleShortVersionString':meta['version'],'CFBundleVersion':str(meta['versionCode']),'CFBundleIconFile':'Game','LSMinimumSystemVersion':'11.0','NSHighResolutionCapable':True,'NSSupportsAutomaticGraphicsSwitching':True,'NSPrincipalClass':'NSApplication','NSLocalNetworkUsageDescription':'Connect the pureTV Wi-Fi controller to this game on your Mac.','NSBonjourServices':['_puretv._tcp'],'NSAppTransportSecurity':{'NSAllowsLocalNetworking':True},'PureTVUpstreamAttribution':meta.get('upstreamAttribution',meta.get('upstream','See bundled source notices')),'NSHumanReadableCopyright':'Upstream authors; pureTV controller adaptation. See bundled source and license notices.'}
    if persistent_keys is not None:info['PureTVStorageKeys']=persistent_keys
    if declaration is not None:info['PureTVAssetPolicy']=declaration
    (contents/'Info.plist').write_bytes(plistlib.dumps(info));(contents/'PkgInfo').write_bytes(b'APPL????')
    sdk=Path(capture('xcrun','--sdk','macosx','--show-sdk-path')).resolve()
    with tempfile.TemporaryDirectory(dir=out,prefix='build-') as temporary:
        work=Path(temporary);make_icon(work,resources,initials)
        host,host_manifest=compile_host(work,sdk,args.host_cache);shutil.copy2(host,binary/executable)
    assert set(capture('lipo','-archs',binary/executable).split())=={'arm64','x86_64'}
    run('codesign','--force','--sign','-','--timestamp=none',app);run('codesign','--verify','--deep','--strict',app);run('plutil','-lint',contents/'Info.plist')
    stem=f'{executable}-{meta["version"]}-macos-universal';zipfile=out/(stem+'.zip');dmg=out/(stem+'.dmg')
    run('ditto','-c','-k','--sequesterRsrc','--keepParent',app,zipfile)
    with tempfile.TemporaryDirectory(dir=out,prefix='dmg-') as temporary:
        staging=Path(temporary);run('ditto',app,staging/app.name);(staging/'Applications').symlink_to('/Applications')
        run('hdiutil','create','-volname',name,'-srcfolder',staging,'-format','UDZO','-ov',dmg)
    run('hdiutil','verify',dmg)
    package_limit=asset_policy.desktop_package_limit(meta,None if args.game in LEGACY_GAMES else registry_games()[args.game])
    assert all(0<p.stat().st_size<package_limit for p in [zipfile,dmg]),'Package exceeds declared desktop budget: '+str(package_limit)
    packages={p.name:{'bytes':p.stat().st_size,'sha256':digest(p)} for p in [zipfile,dmg]}
    assert capture('git','-C',ROOT,'rev-parse','HEAD')==source_commit, 'HEAD changed during build'
    assert inputs(game)==source_inputs, 'Source files or input set changed during build'
    manifest={'game':args.game,'version':meta['version'],'buildVersion':str(meta['versionCode']),'appName':app.name,'bundleIdentifier':meta['packageName'],'sourceCommit':source_commit,'committedInputsVerified':True,'architectures':['arm64','x86_64'],'minimumMacOS':'11.0','signature':'ad-hoc','appleNotarized':False,'physicalControllerTested':False,'sdkVersion':capture('xcrun','--sdk','macosx','--show-sdk-version'),'swiftVersion':capture('xcrun','swiftc','--version'),'hostBuild':host_manifest,'inputFiles':source_inputs,'appFiles':files(app),'webFiles':files(web),'packages':packages}
    (out/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(out/'SHA256SUMS.txt').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in sorted(packages.items())))
    print(json.dumps({'app':str(app),'packages':packages},indent=2))
if __name__=='__main__':main()
