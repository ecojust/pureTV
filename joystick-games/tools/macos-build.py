#!/usr/bin/env python3
"""Build two upstream game adaptations as standalone universal macOS clients."""
import argparse, hashlib, json, platform, plistlib, re, shutil, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SHARED=ROOT/'joystick-games/shared/macos'
GAMES={'cf-transport-ship':('CF Transport Ship','CFTransportShip','CF'), 'qq-speed':('QQ Speed','QQSpeed','QQ')}
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
    for folder in [SHARED,ROOT/'joystick-games/shared/web',game/'src',game/'dist']:
        assert folder.is_dir() and not folder.is_symlink(), 'Missing or symlinked source directory: '+str(folder)
        for p in folder.rglob('*'):
            if '__pycache__' in p.parts:continue
            assert not p.is_symlink(), 'Symlink in source tree: '+str(p)
            if p.is_file():selected.append(p)
    selected.extend(p for p in game.iterdir() if p.is_file() or p.is_symlink())
    selected.extend(p for p in (ROOT/'joystick-games/tools').glob('macos-*') if p.is_file())
    selected.append(ROOT/'.github/workflows/joystick-games-macos.yml')
    return {p.relative_to(ROOT).as_posix():regular_input(p) for p in sorted(set(selected))}
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
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--game',choices=GAMES,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    if platform.system()!='Darwin':parser.error('Requires macOS with Xcode Command Line Tools')
    game=ROOT/'joystick-games'/args.game;meta=json.loads((game/'game.json').read_text());name,executable,initials=GAMES[args.game]
    source_commit=capture('git','-C',ROOT,'rev-parse','HEAD');source_inputs=inputs(game);verify_committed(ROOT,source_inputs,source_commit)
    assert meta['id']==args.game and re.fullmatch(r'\d+\.\d+\.\d+',meta['version'])
    out=args.output.resolve();assert not out.is_relative_to(ROOT),'Use an output outside the repository'
    out.mkdir(parents=True,exist_ok=True);assert not any(out.iterdir()),'Retain previous builds; select a fresh output'
    app=out/(name+'.app');contents=app/'Contents';resources=contents/'Resources';web=resources/'Web';binary=contents/'MacOS';web.mkdir(parents=True);binary.mkdir()
    source=game/'dist';assert (source/'tv.html').is_file(),'Build game web assets first'
    for path in source.iterdir():
        assert path.is_file() and not path.is_symlink() and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*',path.name),path
        assert path.stat().st_size<10*1024*1024,path
        shutil.copy2(path,web/path.name)
    assert not (web/'bridge.js').exists();shutil.copy2(SHARED/'Web/bridge.js',web/'bridge.js')
    (web/'game-config.json').write_text(json.dumps(meta,ensure_ascii=False)+'\n')
    for p in [game/'NOTICE.md',game/'LICENSE',game/'UPSTREAM.md']:
        if p.is_file():shutil.copy2(p,resources/p.name)
    info={'CFBundleName':name,'CFBundleDisplayName':meta['name'],'CFBundleIdentifier':meta['packageName'],'CFBundleExecutable':executable,'CFBundlePackageType':'APPL','CFBundleShortVersionString':meta['version'],'CFBundleVersion':str(meta['versionCode']),'CFBundleIconFile':'Game','LSMinimumSystemVersion':'11.0','NSHighResolutionCapable':True,'NSSupportsAutomaticGraphicsSwitching':True,'NSPrincipalClass':'NSApplication','NSLocalNetworkUsageDescription':'Connect the pureTV Wi-Fi controller to this game on your Mac.','NSBonjourServices':['_puretv._tcp'],'NSAppTransportSecurity':{'NSAllowsLocalNetworking':True},'NSHumanReadableCopyright':'Upstream riba2534; pureTV controller adaptation. See bundled notices.'}
    (contents/'Info.plist').write_bytes(plistlib.dumps(info));(contents/'PkgInfo').write_bytes(b'APPL????')
    sdk=capture('xcrun','--sdk','macosx','--show-sdk-path')
    with tempfile.TemporaryDirectory(dir=out,prefix='build-') as temporary:
        work=Path(temporary);make_icon(work,resources,initials);binaries=[]
        for arch in ['arm64','x86_64']:
            target=work/(executable+'-'+arch)
            run('xcrun','swiftc','-swift-version','5','-O','-target',arch+'-apple-macos11.0','-sdk',sdk,'-module-name','JoystickGame','-framework','AppKit','-framework','WebKit','-framework','Network',*sorted((SHARED/'Sources').glob('*.swift')),'-o',target);binaries.append(target)
        run('lipo','-create',*binaries,'-output',binary/executable)
    assert set(capture('lipo','-archs',binary/executable).split())=={'arm64','x86_64'}
    run('codesign','--force','--sign','-','--timestamp=none',app);run('codesign','--verify','--deep','--strict',app);run('plutil','-lint',contents/'Info.plist')
    stem=f'{executable}-{meta["version"]}-macos-universal';zipfile=out/(stem+'.zip');dmg=out/(stem+'.dmg')
    run('ditto','-c','-k','--sequesterRsrc','--keepParent',app,zipfile)
    with tempfile.TemporaryDirectory(dir=out,prefix='dmg-') as temporary:
        staging=Path(temporary);run('ditto',app,staging/app.name);(staging/'Applications').symlink_to('/Applications')
        run('hdiutil','create','-volname',name,'-srcfolder',staging,'-format','UDZO','-ov',dmg)
    run('hdiutil','verify',dmg)
    packages={p.name:{'bytes':p.stat().st_size,'sha256':digest(p)} for p in [zipfile,dmg]}
    assert capture('git','-C',ROOT,'rev-parse','HEAD')==source_commit, 'HEAD changed during build'
    assert inputs(game)==source_inputs, 'Source files or input set changed during build'
    manifest={'game':args.game,'version':meta['version'],'buildVersion':str(meta['versionCode']),'appName':app.name,'bundleIdentifier':meta['packageName'],'sourceCommit':source_commit,'committedInputsVerified':True,'architectures':['arm64','x86_64'],'minimumMacOS':'11.0','signature':'ad-hoc','appleNotarized':False,'physicalControllerTested':False,'sdkVersion':capture('xcrun','--sdk','macosx','--show-sdk-version'),'swiftVersion':capture('xcrun','swiftc','--version'),'inputFiles':source_inputs,'appFiles':files(app),'webFiles':files(web),'packages':packages}
    (out/'build-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(out/'SHA256SUMS.txt').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in sorted(packages.items())))
    print(json.dumps({'app':str(app),'packages':packages},indent=2))
if __name__=='__main__':main()
