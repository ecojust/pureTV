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
    # These are the frozen inputs from the base README and its November 21 release receipts.
    release_digests={'adventure-island': 'c9d28eb60eb282d35f30a2f965e587db74eab631a31e7e664e595afb9de00f47', 'alchemists-lattice': '3b692f5055fa4569c461f148f37cd995dbc707d58017aa96b8f98508936df218', 'alien-shooter': '45bae02268ce130ce178ae70cb3cceb7109474e49c6b81d4b96a7b6073d9ee98', 'atlas-of-ink': 'e41e1afc41961179b2805151b7bd3af70bf3242f80fc73455fcbad911283ab0a', 'backroad-rally': 'd0bc840e7457cedf57cc5cad3fdf7729f26e4e96619b8fa5b04d6e70f41b8328', 'bomb-jack': '48d4b2467f301e02507198f034ab37cb7a7ae3228120f3b8ded89fa0556d878f', 'bumble-basket': '639d99f277725be852ccd3c9bf51876bf6fd0a02d4989cabbeb4f5aa64335778', 'cf-transport-ship': '2376f985b1f7273f64d04572d73e07bca2bb665796032998d01415d63781bfb3', 'clawd-pop': 'e28458fa4c61741865c2278c8be91ebdcd734e3595a31b814b1f1bc672609a9e', 'coast-kart': '89f7fce8b76c0aa12b1d6f0054096cec46e9dfb6d467dab91956c15167974280', 'dirt-crown': '08adfc27110a4847d81aa534a40d32baa8350b899f2383e59ead8c69d9fd4db1', 'emberbrood': '8f8042af81d3eadf0d890301f5ac003cf02da96c79129a712f5bb6cbd61265fa', 'glup': '49fb1380f71bebe0319a10d1e6d95fe4c68f3671e1856ac56106139a67679b38', 'jackal': '3b2a69a8c88e1f560302359d24e922bfeaea9a1433b0909a557501eb0177d7ac', 'jewel': '803636aa2b0095e4850cbae46d74df231734eb978b8be1bf9f229517f72334b3', 'kart-royale': '53fe03b3d3c99ef31c63ba1b16325ccd89cde2e592979b1efeb8fa3962a95347', 'kart-rush': '7ac4f0516a9f98a9e9975135d42483d0db8057f974a1e0fce69ff01f326d89fa', 'last-track': '8640575ca68830cb1d4c95011d0fde3782bcd13adcc71d23ab9da2827e89f9e2', 'lumenrift': '74b58766cab6f3ba4cc2595edfcb9c8c59a802d11c09c061377bc68aaeb22957', 'neon-arcana': '9d98dbaf0f035cddef214427c077d95d9db13141128a6ab7504c18bae980df04', 'neon-rush': '790fd4ef4ddf8d4b4de4b4b842eb9a388a17d3e0067ea91e18209ee37453861b', 'night-racer': '49f434e89b6a36e5ee46247bc17816e0d15272fee3fde754b1fd816663ad2437', 'nova-lancer': '1c6a193fed731c02a818dcb6dcbee65575db4ccc08bddab651fa8adcc0081017', 'oathstones': '50a1a657cbe3c28fa940ca05454ae3087c8bbe992eb4c70f0d7ec8dca4f3308d', 'operation-ironhold': 'fb413f5970c377de11d8d4a721c5990aa399869792ad6dfc4999f19c7d4a7415', 'penguintrack': '4f8011af0a9b44712416e2f0ad3198f00fa14ee1b236575842ea830e72adf950', 'ponpoko-kart': 'a265f77831b6fcb0360936f7884a92c012634d11e406f2616d36b6c97b563a9f', 'qq-speed': '0ee47dd5dc6d2e5fe0ef4bbf883666fe41395fe4363b9dad94fb904436a40817', 'saber-magic-tower': 'b9faee05bd679e1ce41edeff7806004b3cd65f96de17a4729c61aed243153c7a', 'solder-and-rain': '0a20438caf8df6bece1d6e4bf338319787b25090e34e0fa3cc07631fd4c9e772', 'starbase-spooky': '2ee4744560fe4b31512264a8683a498b349663b1e4d9ffc85ede03087a708ed0', 'starsling': 'd64a1e38d47554cd140ba11f508ddfb74f71ab52c6b445a4ba9d7ebfef19f91c', 'story-thief': '24d91851d4a1e6721c4f311ec05c316f18fb47a4ed4cca54d4e2d524cd74c7f1', 'sugarplum-drop': 'a9424ff78e647c8daac5c5f918dadef2468501fcd947d633060f9e88b1c27b05', 'super-mario': '2a495d0263ca1e36afdf4655bc76e19738d78eaa3f5088223af7682d73680884', 'tank': '6b85540e5a5ce29fa5a479ac4d1a2661f3a0eeb64b5f97d1afeec29d57156627', 'tetris': '5d75bf0240e915915ae5393daba49b635672223ffdbd038d6b79fbfdfb4ee57a', 'tower-overlap': '2ae7ff42fd2e499431663a1e93ce08fc57e9ec731763482990db9021148e83f4', 'turbo-kart-rally': 'a94edb2c0313837599c7e9549f399ba12d9529262d6a24597db9e78a13681bc0', 'turbo-kart-rush': '3b3201ba0a15091a14e2923fefe23fa21b2b8e0f6e57450315066260eecaf000', 'used-car-racing': '3c504ebc90fa656b15dcd1974af708b2f37ec5098b2b702f06fd710ca31549d1'}
    if slug in release_digests:
        run('gh','release','download','gameplay-icons-2026.11.21','--pattern',name,'--output',old)
        assert sha(old)==release_digests[slug], 'Historical installer digest mismatch'
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
