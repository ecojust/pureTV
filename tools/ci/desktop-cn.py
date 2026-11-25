import hashlib
import importlib.util
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import time

root = Path.cwd()
slug = os.environ['GAME']
mode = os.environ['BUILD_MODE']
source = os.environ['FROZEN']
temp = Path(os.environ['RUNNER_TEMP'])
out = temp / 'localized'
out.mkdir()
scratch = temp / 'localization-build'
scratch.mkdir()
game = root / 'joystick-games' / slug
pc = root / 'tools/pc-games'
joystick = root / 'joystick-games/tools'
sys.path[:0] = [str(pc), str(root / 'tools')]
system = 'macos' if sys.platform == 'darwin' else 'windows'
name = slug + ('-macos.dmg' if system == 'macos' else '-windows-x64-setup.exe')
target = out / name
report = {'id':slug,'sourceCommit':source,'platform':system,'workflowRun':os.environ['GITHUB_RUN_ID']}
assert re.fullmatch('[a-f0-9]{40}',source) and re.fullmatch('[a-z0-9-]+',slug) and mode in ('apk','native','neon')
def run(*args,**kwargs):
    return subprocess.run([str(a) for a in args],check=True,**kwargs)
def read(p):
    return json.loads(p.read_text(encoding='utf-8'))
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def module(name,file):
    spec = importlib.util.spec_from_file_location(name,file)
    m=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m
def sparse(*patterns):
    run('git','sparse-checkout','add','--stdin',input='\n'.join(patterns)+'\n',text=True)
def frozen_paths():
    return {p.relative_to(game/'dist').as_posix():sha(p) for p in (game/'dist').rglob('*') if p.is_file()}
def windows_launch(exe):
    # The native host has a documented read-only --diagnostics interface.
    # Use a dedicated probe on the installed scratch copy, leaving every game asset intact.
    # Some historical versions of diagnostics.js omit the document language.
    probe=exe.parent/'Web/diagnostics.js'
    original=probe.read_bytes()
    script='''(() => {
        const game = window.JoystickGameQA?.snapshot() || {};
        return {game, document:{language:document.documentElement.lang, title:document.title,
                 text:document.body.innerText.slice(0,180)}};
    })()'''
    diag=scratch/'probe'
    env={**os.environ,'WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS':'--enable-unsafe-swiftshader --use-angle=swiftshader'}
    try:
        probe.write_text(script,encoding='utf-8')
        proc=subprocess.Popen([str(exe),'--diagnostics',str(diag),'--profile',str(scratch/'verify-profile')],env=env)
        try:
            deadline=time.monotonic()+150;state={}
            while proc.poll() is None and time.monotonic()<deadline:
                try: state=read(diag/'state.json')
                except (OSError,ValueError): time.sleep(.4);continue
                d=state.get('document',{});g=state.get('game') or {}
                stage=g.get('stage') or g.get('phase')
                if g.get('error') or g.get('webglError') or stage=='error':
                    raise RuntimeError('Rendering failed: '+str(g)[:1200])
                if state.get('ready') and stage not in (None,'loading') and d.get('language','').startswith('zh'):
                    return {'lang':d['language'],'title':d['title'],'stage':stage,'renderer':g.get('renderer')}
                time.sleep(.4)
            raise RuntimeError('Installed game failed to render Chinese: '+json.dumps({'ready':state.get('ready'),'document':state.get('document'),'game':state.get('game'),'exit':proc.poll()},ensure_ascii=False)[:1800])
        finally:
            if proc.poll() is None: proc.terminate()
            proc.wait(timeout=20)
    finally:
        probe.write_bytes(original)

assert run('git','rev-parse','HEAD',capture_output=True,text=True).stdout.strip()==source

if mode=='apk':
    import prepare_standalone as prep
    selected=next(x for x in read(pc/'catalog.json') if x['id']==slug)
    apk_name=selected['url'].split('/')[-1]
    if (game/'game.json').exists():
        assert apk_name==f"{slug}-{read(game/'game.json')['version']}.apk"
    else:
        assert apk_name==f"{slug}-{read(game/'resource.json')['version']}.apk"
    relative=f'joystick-games/{slug}/{apk_name}'
    sparse('/'+relative)
    if (game/apk_name).read_bytes().startswith(b'version https://git-lfs'):
        run('git','lfs','pull','--include',relative)
    inputs=scratch/'inputs'
    prep.prepare(selected,'joystick-games/'+slug,relative,inputs)
    source_info=read(inputs/slug/'game.json')
    report.update(version=source_info['version'],apkSha256=sha(inputs/slug/'game.apk'))
    run(sys.executable,pc/f'build_standalone_{system}.py','--inputs',inputs,'--output',out)
    run(sys.executable,pc/'verify_standalone_packages.py','--platform',system,'--inputs',inputs,'--packages',out,'--report',scratch/'verified.json', *(['--browser-channel','msedge'] if system=='windows' else []))
    report['installed']=read(scratch/'verified.json')
elif system=='macos':
    meta=read(game/'game.json')
    report['version']=meta['version']
    if mode=='neon':
        sparse(f'/joystick-games/{slug}/macos/Sources/',f'/joystick-games/{slug}/macos/Web/',f'/joystick-games/{slug}/macos/tools/',f'/joystick-games/{slug}/macos/build.py','/resource/game-kit/build.py','/resource/game-kit/web/')
        run(sys.executable,game/'macos/build.py','--output',scratch)
    else:
        run(sys.executable,joystick/'macos-build.py','--game',slug,'--output',scratch)
    dmg,=scratch.glob('*.dmg')
    mounted=scratch/'mounted';mounted.mkdir()
    run('hdiutil','attach','-readonly','-nobrowse','-mountpoint',mounted,dmg)
    try:
        app,=mounted.glob('*.app')
        run('codesign','--verify','--deep','--strict',app)
        info=plistlib.loads((app/'Contents/Info.plist').read_bytes());assert info['CFBundleShortVersionString']==meta['version']
        exe=app/'Contents/MacOS'/info['CFBundleExecutable']
        run('lipo',exe,'-verify_arch','arm64','x86_64')
        web=app/'Contents/Resources/Web'
        if mode=='native':
            for path,digest in frozen_paths().items():
                assert sha(web/path)==digest,path
        diag=scratch/'probe'
        proc=subprocess.Popen([str(exe),'--diagnostics-dir',str(diag),'--preferences-domain','ecojust.game-language-smoke'])
        try:
            deadline=time.monotonic()+120;state={}
            while time.monotonic()<deadline and proc.poll() is None:
                if (diag/'state.json').is_file():
                    state=read(diag/'state.json')
                    if state.get('ready') and state.get('game') and state.get('document',{}).get('language','').startswith('zh'):
                        break
                time.sleep(0.5)
            else:
                raise RuntimeError('Game launch or language verification failed: '+str(state)[:3500])
            report['nativeLaunch']={'ready':state['ready'],'lang':state['document']['language'],'title':state['document'].get('title'),'architecture':state['processArchitecture']}
        finally:
            proc.terminate()
            try: proc.wait(timeout=6)
            except subprocess.TimeoutExpired: proc.kill();proc.wait()
    finally:run('hdiutil','detach',mounted)
    shutil.copy2(dmg,target)
else:
    import refresh_windows_icons as windows
    pack=windows.joystick
    meta=read(game/'game.json');registry=read(root/'joystick-games/catalog-registry.json')['games'][slug]
    report['version']=meta['version']
    # Reuse the released x64 executable, shortcut name and package identity.
    # The README in the base revision identifies each game's current desktop installer.
    old=scratch/'released.exe'
    relative=f'joystick-games/{slug}/windows/'
    file_candidates=run('git','ls-tree','-r','--name-only','HEAD','--',relative,capture_output=True,text=True).stdout.splitlines()
    local=[p for p in file_candidates if p.endswith('-setup.exe')]
    docs=(root/'README.md').read_text(encoding='utf-8')
    if f'href="https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/{slug}-windows-x64-setup.exe"' in docs or not local:
        run('gh','release','download','gameplay-icons-2026.11.21','--pattern',name,'--output',old)
    else:
        assert len(local)==1,local
        sparse('/'+local[0])
        if Path(local[0]).read_bytes().startswith(b'version https://git-lfs'):
            run('git','lfs','pull','--include',local[0])
        shutil.copy2(local[0],old)
    folder=scratch/'payload'
    run(old,'/S','/D='+str(folder),timeout=180)
    (folder/'Uninstall.exe').unlink()
    assert (folder/'PureTVGame.exe').is_file() and read(folder/'game.json')['id']==slug
    report['hostSha256']=sha(folder/'PureTVGame.exe');report['originalInstallerSha256']=sha(old)
    web=folder/'Web'
    bridges={name:(web/name).read_bytes() for name in ('bridge.js','bootstrap.js','diagnostics.js') if (web/name).is_file()}
    shutil.rmtree(web);pack.copy_web_assets(game/'dist',web,meta,registry)
    for filename,data in bridges.items():(web/filename).write_bytes(data)
    shutil.copy2(game/'game.json',folder/'game.json')
    package_script=scratch/'installer.nsi'
    package_script.write_text(pack.installer_text(meta,registry,folder,target,pack.inventory(folder)),encoding='utf-8')
    run(Path(os.environ['ProgramFiles(x86)'])/'NSIS/makensis.exe','/V2',package_script)
    dest=scratch/'verify';run(target,'/S','/D='+str(dest),timeout=180)
    for path,digest in frozen_paths().items():assert sha(dest/'Web'/path)==digest,path
    assert read(dest/'game.json')==meta and sha(dest/'PureTVGame.exe')==report['hostSha256']
    report['nativeLaunch']=windows_launch(dest/'PureTVGame.exe')
    remove=scratch/'remove.exe';shutil.copy2(dest/'Uninstall.exe',remove);run(remove,'/S','_?='+str(dest))
    assert not (dest/'PureTVGame.exe').exists()
assert target.is_file() and target.stat().st_size>0
report.update(file=name,bytes=target.stat().st_size,sha256=sha(target))
(out/f'{slug}-{system}-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
