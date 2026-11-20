#!/usr/bin/env python3
"""Rebuild an isolated observation host; never modify original apps or game bytes."""
import argparse
import difflib
import hashlib
import json
import os
import plistlib
import shutil
import subprocess
import time
import traceback
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def files(root):
    result = {}
    for path in sorted(root.rglob('*')):
        assert not path.is_symlink(), path
        if path.is_file():
            result[path.relative_to(root).as_posix()] = {'bytes': path.stat().st_size, 'sha256': digest(path)}
    return result


def patch_main(original, observer):
    anchor = '        content.removeAllUserScripts()'
    replacement = anchor + '\n        content.addUserScript(WKUserScript(source: ' + json.dumps(observer, ensure_ascii=False) + ', injectionTime: .atDocumentStart, forMainFrameOnly: true))'
    assert original.count(anchor) == 1
    patched = original.replace(anchor, replacement)
    anchor = 'return {game:window.JoystickGameQA?.snapshot()||null,storage,document:'
    replacement = "return {startupObservation:{records:window.__pureTVStartupObservation||[],readyState:document.readyState,userAgent:navigator.userAgent,scripts:Array.from(document.scripts).map(s=>({type:s.type,src:s.src})),gameQaType:typeof window.JoystickGameQA},game:window.JoystickGameQA?.snapshot()||null,storage,document:"
    assert patched.count(anchor) == 1
    return patched.replace(anchor, replacement)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--original-app', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--host-cache', type=Path, required=True)
    args = parser.parse_args()
    assert os.environ.get('GITHUB_ACTIONS') == 'true' and os.environ.get('RUNNER_OS') == 'macOS'
    source = args.source.resolve()
    original_app = args.original_app.resolve()
    out = args.output.resolve()
    assert not out.exists() and not out.is_relative_to(source) and not out.is_relative_to(original_app)
    out.mkdir(parents=True)
    meta = json.loads(args.manifest.read_text())
    assert meta['sourceCommit'] == 'a73a1976e7d38ff27b8e457b933519ea66eaa949'
    assert files(original_app) == meta['appFiles']
    before = files(original_app)
    report = {'method': 'Diagnostic rebuilt host, not an original installation package runtime test', 'originalPackageSource': meta['sourceCommit'], 'workflowSourceCommit': os.environ['GITHUB_SHA'], 'game': meta['game'], 'status': 'running', 'gameAssetsChanged': False, 'gameplayVerified': False, 'originalAppModified': False, 'observations': [], 'commands': []}
    processes = []
    streams = []

    def save():
        (out/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')

    def command(argv, name):
        report['commands'].append({'name': name, 'argv': list(map(str, argv))});save()
        result = subprocess.run(list(map(str, argv)), capture_output=True, timeout=180)
        (out/(name+'.log')).write_bytes(result.stdout+result.stderr)
        assert result.returncode == 0, name+' returned '+str(result.returncode)
        return result.stdout.decode().strip()

    save()
    try:
        original_sources = source/'joystick-games/shared/macos/Sources'
        local_sources = out/'executed-sources';local_sources.mkdir()
        observer = Path(__file__).with_name('mac-startup-observer.js').read_text()
        shutil.copy2(Path(__file__), out/'executed-mac-startup-diagnostic.py')
        shutil.copy2(Path(__file__).with_name('mac-startup-observer.js'), out/'executed-mac-startup-observer.js')
        original_main = (original_sources/'main.swift').read_text()
        patched = patch_main(original_main, observer)
        for path in original_sources.glob('*.swift'):
            assert digest(path) == meta['inputFiles']['joystick-games/shared/macos/Sources/'+path.name]['sha256']
            shutil.copy2(path, local_sources/path.name)
        (local_sources/'main.swift').write_text(patched)
        (out/'main-swift-observation.patch').write_text(''.join(difflib.unified_diff(original_main.splitlines(True), patched.splitlines(True), fromfile='frozen/main.swift', tofile='diagnostic/main.swift')))
        report['originalHostSources'] = files(original_sources)
        report['diagnosticHostSources'] = files(local_sources)
        cache = args.host_cache.resolve();cache.mkdir(parents=True, exist_ok=True)
        sdk = command(['xcrun','--sdk','macosx','--show-sdk-path'], 'sdk')
        report['swiftVersion'] = command(['xcrun','swiftc','--version'], 'swift-version')
        cache_inputs={'sources':report['diagnosticHostSources'],'architecture':os.uname().machine,'sdk':sdk,'swiftVersion':report['swiftVersion']}
        cache_key = hashlib.sha256(json.dumps(cache_inputs, sort_keys=True).encode()).hexdigest()
        binary = cache/(cache_key+'-host')
        report['diagnosticHostCache']={'key':cache_key,'reused':binary.exists(),'inputs':cache_inputs}
        if not binary.exists():
            command(['xcrun','swiftc','-swift-version','5','-O','-module-name','JoystickGame','-target',os.uname().machine+'-apple-macos11.0','-sdk',sdk,'-framework','AppKit','-framework','WebKit','-framework','Network',*sorted(local_sources.glob('*.swift')),'-o',binary], 'compile-diagnostic-host')
        report['diagnosticBinarySha256'] = digest(binary)
        app = out/(meta['appName'][:-4]+' Startup Diagnostic.app')
        shutil.copytree(original_app, app)
        contents = app/'Contents';info = plistlib.loads((contents/'Info.plist').read_bytes())
        info['CFBundleIdentifier'] += '.startupdiagnostic'
        info['CFBundleName'] += ' Startup Diagnostic'
        info['CFBundleDisplayName'] = info['CFBundleName']
        (contents/'Info.plist').write_bytes(plistlib.dumps(info))
        shutil.copy2(binary, contents/'MacOS'/info['CFBundleExecutable'])
        if (contents/'_CodeSignature').exists():shutil.rmtree(contents/'_CodeSignature')
        command(['codesign','--force','--sign','-','--timestamp=none',app], 'sign-diagnostic-copy')
        web = contents/'Resources/Web'
        assert files(web) == meta['webFiles'], 'Original Web bytes changed'
        report['webFiles'] = files(web)
        report['diagnosticAppFiles'] = files(app)
        report['diagnosticInfoPlist'] = info
        diagnostics = out/'diagnostics';diagnostics.mkdir()
        helper = source/'joystick-games/shared/macos/tools/allow-local-network.py'
        shutil.copy2(helper,out/'executed-allow-local-network.py')
        prompt_stream = (out/'network-prompts.txt').open('w');streams.append(prompt_stream)
        processes.append(subprocess.Popen(['python3',str(helper),str(app)],stdout=prompt_stream,stderr=subprocess.STDOUT))
        domain = 'com.ecojust.joystick.startupdiagnostic.'+meta['game']+'.'+os.environ['GITHUB_RUN_ID']+'.'+os.uname().machine
        report['diagnosticPreferencesDomain'] = domain
        app_stream = (out/'app.log').open('w');streams.append(app_stream)
        processes.append(subprocess.Popen([str(contents/'MacOS'/info['CFBundleExecutable']),'--diagnostics-dir',str(diagnostics),'--preferences-domain',domain,'--language','zh'],stdout=app_stream,stderr=subprocess.STDOUT))
        started = time.monotonic()
        for elapsed in [2, 10, 30]:
            while time.monotonic()-started < elapsed:time.sleep(0.2)
            state = diagnostics/'state.json'
            if state.is_file():
                shutil.copy2(state,out/('state-at-'+str(elapsed)+'s.json'))
                observed=json.loads(state.read_text());report['observations'].append({'elapsedSeconds':elapsed,'ready':observed.get('ready'),'active':observed.get('active'),'gamePresent':observed.get('game') is not None,'startupObservation':observed.get('startupObservation')})
            (diagnostics/'screenshot-request.txt').write_text('startup-'+str(elapsed)+'s.png')
            save()
        time.sleep(3)
        assert len(report['observations']) == 3, 'Startup state observations are missing'
        report['screenshots'] = {name: row for name, row in files(diagnostics).items() if name.endswith('.png')}
        assert 'startup-30s.png' in report['screenshots'], 'Final startup screenshot is missing'
        report['foregroundObserved'] = any(row['active'] is True for row in report['observations'])
        report['status']='observed'
    except Exception:
        report.update(status='failed',error=traceback.format_exc())
    finally:
        for process in reversed(processes):
            process.terminate()
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait()
        for stream in streams:stream.close()
        assert files(original_app)==before, 'Original installed application changed'
        # Diagnostic binaries and copied applications are not exported as packages.
        for app in out.glob('*.app'):shutil.rmtree(app)
        save()
    print(json.dumps({'game':meta['game'],'status':report['status'],'gameplayVerified':False}))
    raise SystemExit(0 if report['status']=='observed' else 1)


if __name__ == '__main__':main()
