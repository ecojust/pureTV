"""Build Windows icon updates using the exact payloads from the released installers."""
import argparse
import ctypes
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from urllib.request import urlopen

import build_standalone_windows as standalone

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
from game_icons import save_ico
from verify_windows_icons import verify_icons

SPEC = importlib.util.spec_from_file_location('joystick_windows', ROOT / 'joystick-games/tools/windows-build.py')
joystick = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(joystick)


def run(*cmd, **kwargs):
    return subprocess.run(list(map(str, cmd)), check=True, **kwargs)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def tracked(relative):
    return subprocess.check_output(['git', 'show', 'HEAD:' + relative], cwd=ROOT)


def original(row, path):
    url = row['windows']
    if url.startswith('https://'):
        for attempt in range(4):
            try:
                with urlopen(url, timeout=120) as response, path.open('wb') as file:
                    shutil.copyfileobj(response, file)
                break
            except OSError:
                if attempt == 3:
                    raise
                time.sleep(2 + attempt * 2)
    else:
        path.write_bytes(tracked(url.split('?')[0]))
    if sha(path) != row['windowsSha256']:
        raise ValueError('Original installer digest mismatch for ' + row['id'])


def read_document(path):
    return json.loads(tracked(path))


def frozen_host(row, work, icon):
    directory = row['gameDir']
    try:
        meta = read_document(directory + '/packages.json')['windows']
    except (subprocess.CalledProcessError, KeyError):
        meta = read_document(directory + '/windows-release.json')
    rev = meta.get('sourceCommit')
    if not rev:
        rev = read_document(directory + '/' + meta['verification'])['sourceCommit']
    if not re.fullmatch('[0-9a-f]{40}', rev):
        raise ValueError('No frozen Windows source commit for ' + row['id'])
    # Historical games shipped several different host versions. Recompile the
    # original Sources with the same SDK lock, changing the icon resource only.
    shared = 'joystick-games/shared/windows'
    sink = work / 'host-source'
    run('git', 'fetch', '--quiet', '--no-tags', '--depth=1', '--filter=blob:none', 'origin', rev, cwd=ROOT)
    names = subprocess.check_output([
        'git', 'ls-tree', '-r', '--name-only', rev, '--', shared + '/Sources',
        shared + '/tests', shared + '/CMakeLists.txt', shared + '/dependencies.json'
    ], cwd=ROOT, text=True).splitlines()
    needed = [n for n in names if '/tests/' not in n or n.endswith(('.cpp', '.hpp', '.h'))]
    # One archive request batches lazy retrieval in the partial checkout.
    archive = work / 'source.zip'
    run('git', 'archive', '--format=zip', '-o', archive, rev, '--', *needed, cwd=ROOT)
    with zipfile.ZipFile(archive) as frozen:
        for item in needed:
            output = sink / Path(item).relative_to(shared)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(frozen.read(item))
    if json.loads((sink / 'dependencies.json').read_text()) != json.loads((joystick.SHARED / 'dependencies.json').read_text()):
        raise ValueError('Historical Windows SDK lock differs; use its pinned SDK')
    main = sink / 'Sources/main.cpp'
    source = main.read_text(encoding='utf-8')
    default = 'cls.hIcon=LoadIconW(nullptr,IDI_APPLICATION)'
    if source.count(default) != 1:
        raise ValueError('Review icon initialization in frozen source ' + rev)
    main.write_text(source.replace(default, 'cls.hIcon=LoadIconW(instance,MAKEINTRESOURCEW(101))'), encoding='utf-8')
    rc = joystick.icon_resource(icon)
    cmake = sink / 'CMakeLists.txt'
    with cmake.open('a', encoding='utf-8') as file:
        file.write('\nenable_language(RC)\ntarget_sources(PureTVGame PRIVATE "' + rc.as_posix() + '")\n')
    build = work / 'build'
    deps = work.parent / 'dependencies'
    if not (deps / 'webview2/build/native/include/WebView2.h').is_file():
        joystick.dependencies(deps)
    run('cmake', '-S', sink, '-B', build, '-A', 'x64', '-DPURETV_DEPS=' + str(deps))
    run('cmake', '--build', build, '--config', 'Release', '--target', 'PureTVGame')
    return build / 'Release/PureTVGame.exe', rev


def verify_shortcut(folder, relative, executable):
    # WScript can return the 8.3 spelling for a file under the runner's temp
    # directory. Test the file identity, including redirected shell folders.
    env = {**os.environ, 'ICON_SHELL_FOLDER': folder, 'ICON_SHORTCUT': relative}
    command = """
        $ErrorActionPreference='Stop'
        $shell=New-Object -ComObject WScript.Shell
        $path=Join-Path $shell.SpecialFolders.Item($env:ICON_SHELL_FOLDER) $env:ICON_SHORTCUT
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing shortcut $path" }
        Write-Output ($shell.CreateShortcut($path).TargetPath)
    """
    result = run('powershell', '-NoProfile', '-Command', command, env=env, capture_output=True, text=True)
    target = Path(result.stdout.strip())
    if not target.is_file() or not target.samefile(executable):
        raise ValueError(f'Shortcut {relative!r} targets {target!s}; expected {executable!s}')


def smoke_native(app, work):
    diag = work / 'diagnostic'
    user = ctypes.windll.user32
    proc = subprocess.Popen([str(app), '--diagnostics', str(diag), '--profile', str(work / 'profile')])
    handle = None
    try:
        deadline = time.monotonic() + 150
        while proc.poll() is None and time.monotonic() < deadline:
            try:
                state = json.loads((diag / 'state.json').read_text(encoding='utf-8'))
            except (OSError, ValueError):
                time.sleep(.25)
                continue
            game = state.get('game') or {}
            phase = game.get('stage') or game.get('phase')
            if game.get('error') or phase == 'error':
                raise ValueError(str(game))
            if not state.get('ready') or not phase or phase == 'loading':
                time.sleep(.25)
                continue
            def find_window(hwnd, _):
                owner = ctypes.c_ulong()
                user.GetWindowThreadProcessId(ctypes.c_void_p(hwnd), ctypes.byref(owner))
                if owner.value == proc.pid and user.IsWindowVisible(ctypes.c_void_p(hwnd)):
                    nonlocal handle
                    handle = hwnd
                    return False
                return True
            callback = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)(find_window)
            user.EnumWindows(callback, 0)
            if handle:
                user.GetClassLongPtrW.restype = ctypes.c_void_p
                if not user.GetClassLongPtrW(ctypes.c_void_p(handle), -14):
                    raise ValueError('Missing window class icon')
                return {'stage': phase, 'renderer': game.get('renderer'), 'windowClassIcon': True}
            time.sleep(.25)
        raise RuntimeError('Installed game did not render: ' + str(app))
    finally:
        if handle:
            user.PostMessageW(ctypes.c_void_p(handle), 0x0010, 0, 0)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.terminate()
            proc.wait(timeout=15)


def nsis(row, old, work, output, icon):
    folder = work / 'payload'
    install_dir = work / 'installed'
    run(old, '/S', '/D=' + str(folder), timeout=180)
    (folder / 'Uninstall.exe').unlink()
    exe = folder / 'PureTVGame.exe'
    original_inventory = {p.relative_to(folder): sha(p) for p in folder.rglob('*') if p.is_file() and p != exe}
    metadata = json.loads((folder / 'game.json').read_text(encoding='utf-8'))
    if metadata['id'] != row['id']:
        raise ValueError('Wrong NSIS payload: ' + str(metadata))
    host, revision = frozen_host(row, work, icon)
    shutil.copyfile(host, exe)
    shutil.copyfile(icon, folder / 'game.ico')
    registry = read_document('joystick-games/catalog-registry.json')['games'][row['id']]
    package = output / (row['id'] + '-windows-x64-setup.exe')
    portable = output / (row['id'] + '-windows-x64.zip')
    original_root = registry['executable'] + '-' + metadata['version'] + '-windows-x64'
    with zipfile.ZipFile(portable, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(folder.rglob('*')):
            if file.is_file():
                archive.write(file, original_root + '/' + file.relative_to(folder).as_posix())
    script = work / 'game.nsi'
    script.write_text(joystick.installer_text(metadata, registry, folder, package, joystick.inventory(folder)), encoding='utf-8')
    compiler = shutil.which('makensis') or Path(os.environ['ProgramFiles(x86)']) / 'NSIS/makensis.exe'
    run(compiler, '/V2', script)
    run(package, '/S', '/D=' + str(install_dir), timeout=180)
    actual = install_dir / exe.name
    try:
        for rel, expected in original_inventory.items():
            if sha(install_dir / rel) != expected:
                raise ValueError(f'Original game file changed: {rel}')
        if sha(install_dir / 'game.ico') != sha(icon):
            raise ValueError('Installed icon mismatch')
        verify_shortcut('Desktop', registry['appName'] + '.lnk', actual)
        with zipfile.ZipFile(portable) as archive:
            for entry in archive.infolist():
                file = install_dir / Path(entry.filename).relative_to(original_root)
                if archive.read(entry) != file.read_bytes():
                    raise ValueError('Portable and installed payload differ: ' + entry.filename)
        icons = verify_icons(icon, [actual, package, install_dir / 'Uninstall.exe'])
        started = smoke_native(actual, work)
    finally:
        uninstaller = work / 'remove.exe'
        shutil.copyfile(install_dir / 'Uninstall.exe', uninstaller)
        run(uninstaller, '/S', '_?=' + str(install_dir), timeout=180)
    if actual.exists():
        raise ValueError('Native application remained after uninstall')
    return package, dict(hostSourceCommit=revision, preservedFiles=len(original_inventory),
                         installedIcons=icons, normalLaunch=started, version=metadata['version'],
                         portable={'file': portable.name, 'sha256': sha(portable), 'bytes': portable.stat().st_size})


def inno(row, old, work, output, icon, runtime_work):
    slug = row['id']
    original_app = work / 'original'
    quiet = ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART']
    run(old, *quiet, '/SP-', '/DIR=' + str(original_app), timeout=180)
    source = work / slug
    try:
        source.mkdir()
        for name in ('game.json', 'game.apk'):
            shutil.copyfile(original_app / name, source / name)
        shutil.copytree(original_app / 'licenses/game', source / 'licenses')
    finally:
        run(original_app / 'unins000.exe', *quiet, timeout=180)
    metadata = json.loads((source / 'game.json').read_text(encoding='utf-8'))
    if metadata['id'] != slug or metadata['sha256'] != sha(source / 'game.apk'):
        raise ValueError('Wrong released game inside Inno installer ' + slug)
    runtime = standalone.build_runtime(runtime_work, icon)
    package = standalone.build_game(standalone.inno_compiler(), runtime, source, output, work, icon)
    installed = work / 'installed'
    run(package, *quiet, '/SP-', '/DIR=' + str(installed), timeout=180)
    actual = installed / (slug + '.exe')
    try:
        identity = json.loads(run(actual, '--smoke-test', capture_output=True, text=True, timeout=90).stdout)
        if identity != {'id': slug, 'version': metadata['version']} or sha(installed / 'game.apk') != metadata['sha256']:
            raise ValueError('Installed game identity mismatch')
        if sha(installed / 'game.ico') != sha(icon):
            raise ValueError('Installed ICO mismatch')
        verify_shortcut('Programs', 'pureTV/' + metadata['en'] + '.lnk', actual)
        icons = verify_icons(icon, [actual, package, installed / 'unins000.exe'])
        # Exercise the installed HTTP server, including the favicon route of the game tab.
        proc = subprocess.Popen([str(actual), '--no-browser', '--http-port', '0', '--controller-port', '0'], stdout=subprocess.PIPE, text=True)
        try:
            line = proc.stdout.readline().strip()
            if not re.fullmatch(r'Game: http://127\.0\.0\.1:\d+/tv.html', line):
                raise ValueError('Installed host failed to start: ' + line)
            url = line.removeprefix('Game: ')
            with urlopen(url, timeout=10) as page, urlopen(url.replace('tv.html', 'favicon.ico'), timeout=10) as result:
                if b'/__puretv/bridge.js' not in page.read() or result.read() != icon.read_bytes():
                    raise ValueError('Game page or browser favicon mismatch')
        finally:
            proc.terminate()
            proc.wait(timeout=15)
    finally:
        run(installed / 'unins000.exe', *quiet, timeout=180)
    if actual.exists():
        raise ValueError('Standalone application remained after uninstall')
    return package, dict(apkSha256=metadata['sha256'], installedIcons=icons, browserEntry=True, version=metadata['version'])


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--shard', type=int, required=True)
    p.add_argument('--count', type=int, required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    rows = [row for row in json.loads((ROOT / 'tools/game-client-icon-inputs.json').read_text(encoding='utf-8')) if row.get('windows')]
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        runtime_work = root / 'pyinstaller'
        runtime_work.mkdir()
        for row in sorted(rows, key=lambda r: r['id'])[args.shard::args.count]:
            with tempfile.TemporaryDirectory(dir=root) as tmp:
                work = Path(tmp)
                game = ROOT / row['gameDir']
                icon = work / (row['id'] + '.ico')
                save_ico(game, icon)
                old = work / 'original-setup.exe'
                original(row, old)
                if '/standalone-games-' in row['windows']:
                    package, checks = inno(row, old, work, output, icon, runtime_work)
                else:
                    package, checks = nsis(row, old, work, output, icon)
                report = dict(id=row['id'], sourceInstallerSha256=sha(old), installer=package.name,
                              bytes=package.stat().st_size, sha256=sha(package), iconSha256=sha(icon), **checks)
                (output / (row['id'] + '-windows-icon-verification.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
                print('Verified ' + row['id'] + ': ' + report['sha256'], flush=True)


if __name__ == '__main__':
    main()
