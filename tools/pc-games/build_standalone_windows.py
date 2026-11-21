"""Build and verify individual, offline Windows x64 game installers on Windows."""
import argparse
import json
import os
import platform
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path

SOURCE = Path(__file__).resolve().parent


def inno_compiler():
    on_path = shutil.which('ISCC.exe')
    if on_path:
        return Path(on_path)
    for variable in ('ProgramFiles(x86)', 'ProgramFiles'):
        if variable in os.environ:
            candidate = Path(os.environ[variable]) / 'Inno Setup 6' / 'ISCC.exe'
            if candidate.is_file():
                return candidate
    raise SystemExit('Install Inno Setup 6 or add ISCC.exe to PATH.')


def build_runtime(work):
    subprocess.run([
        sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onedir',
        '--contents-directory', '.', '--name', 'puretv-runtime',
        '--add-data', f'{SOURCE / "pc-bridge.js"}{os.pathsep}.',
        '--collect-all', 'zeroconf', '--recursive-copy-metadata', 'zeroconf',
        '--specpath', str(work), '--distpath', str(work / 'dist'),
        '--workpath', str(work / 'build'), str(SOURCE / 'standalone.py')
    ], cwd=work, check=True)
    runtime = work / 'dist' / 'puretv-runtime'
    with (runtime / 'puretv-runtime.exe').open('rb') as exe:
        exe.seek(0x3c)
        exe.seek(struct.unpack('<I', exe.read(4))[0])
        if exe.read(6) != b'PE\x00\x00\x64\x86':
            raise ValueError('The bundled application requires a Windows AMD64 executable')
    return runtime


def build_game(compiler, runtime, source, output, work):
    game = json.loads((source / 'game.json').read_text(encoding='utf-8'))
    slug = game['id']
    version = game['version']
    if slug != source.name or not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,70}', slug):
        raise ValueError(f'Invalid game directory or ID: {source}')
    if not re.fullmatch(r'\d+(?:\.\d+){1,3}', version):
        raise ValueError(f'Invalid version for {slug}: {version}')
    title = game['en']
    if not title or any(c in title for c in '\r\n"{}\\/:*?<>|'):
        raise ValueError(f'Invalid Windows shortcut title for {slug}: {title!r}')
    app_id = uuid.uuid5(uuid.NAMESPACE_URL, f'https://github.com/ecojust/pureTV/games/{slug}')
    script = work / (slug + '.iss')
    script.write_text(f"""[Setup]
AppId={{{{{app_id}}}
AppName={title}
AppVersion={version}
AppPublisher=pureTV
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
DefaultDirName={{localappdata}}\\Programs\\pureTV\\{slug}
DisableProgramGroupPage=yes
UninstallDisplayIcon={{app}}\\{slug}.exe
OutputDir={output}
OutputBaseFilename={slug}-windows-x64-setup
Compression=lzma2/fast
SolidCompression=yes
WizardStyle=modern

[Files]
Source: "{runtime}\\*"; Excludes: "puretv-runtime.exe"; DestDir: "{{app}}"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "{runtime}\\puretv-runtime.exe"; DestDir: "{{app}}"; DestName: "{slug}.exe"; Flags: ignoreversion
Source: "{source}\\game.json"; DestDir: "{{app}}"; Flags: ignoreversion
Source: "{source}\\game.apk"; DestDir: "{{app}}"; Flags: ignoreversion

[Icons]
Name: "{{userprograms}}\\pureTV\\{title}"; Filename: "{{app}}\\{slug}.exe"; WorkingDir: "{{app}}"

[Run]
Filename: "{{app}}\\{slug}.exe"; Description: "Play {title}"; Flags: nowait postinstall skipifsilent
""", encoding='utf-8-sig')
    subprocess.run([str(compiler), '/Qp', str(script)], check=True)
    return output / (slug + '-windows-x64-setup.exe')


def verify_install(installer, source, work):
    # Exercise the same installed binary as the Start Menu shortcut.
    installed = work / 'installed' / source.name
    subprocess.run([str(installer), '/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART',
                    '/SP-', '/DIR=' + str(installed)], check=True, timeout=180)
    try:
        original = json.loads((source / 'game.json').read_text(encoding='utf-8'))
        run = subprocess.run([str(installed / (source.name + '.exe')), '--smoke-test'],
                             check=True, capture_output=True, text=True, timeout=120)
        identity = json.loads(run.stdout)
        if identity != {'id': source.name, 'version': original['version']}:
            raise ValueError(f'Installed application identity mismatch: {identity}')
    finally:
        subprocess.run([str(installed / 'unins000.exe'), '/VERYSILENT',
                        '/SUPPRESSMSGBOXES', '/NORESTART'], check=True, timeout=180)
    print(f'Installed, verified and uninstalled {installer.name}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inputs', type=Path, required=True,
                        help='Directory with <game-id>/game.apk and game.json')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--game', action='append', help='Only build this game ID (repeatable)')
    args = parser.parse_args()
    if sys.platform != 'win32' or platform.machine().upper() not in ('AMD64', 'X86_64') or struct.calcsize('P') != 8:
        parser.error('Use x64 Python on Windows x64 to build and test the installers')
    compiler = inno_compiler()
    root = args.inputs.resolve(strict=True)
    games = [root / slug for slug in args.game] if args.game else sorted(p for p in root.iterdir() if p.is_dir())
    if not games or any(game.parent != root for game in games):
        parser.error('Select at least one game directory directly inside --inputs')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        work = Path(temporary)
        runtime = build_runtime(work)
        for game in games:
            installer = build_game(compiler, runtime, game, output, work)
            verify_install(installer, game, work)


if __name__ == '__main__':
    main()
