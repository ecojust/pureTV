#!/usr/bin/env python3
"""Update 20 Android app READMEs after controller-status artifacts are staged.

Default: read-only plan and in-memory idempotence checks. --preview DIR writes
reviewable drafts/diff outside the repository, without claiming artifacts exist.
--write and --check first require staged signed-APK/status evidence and both new
Neon Mac packages. No build, commit, network, version, or Mac README mutation.
"""
import argparse
import difflib
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- controller-client-status:start -->'
END = '<!-- controller-client-status:end -->'
HISTORY_START = '<!-- controller-client-status-history:start -->'
HISTORY_END = '<!-- controller-client-status-history:end -->'
SCOPE = 'controller client status acceptance'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_file(path):
    require(path.is_file() and not path.is_symlink() and path.stat().st_size > 0,
            f'Missing/empty staged artifact: {path}')
    return path


def validate_artifacts(rollout):
    """Check staging assertions and exact linked bytes; signing stays in release.py."""
    for game in rollout['games']:
        app = ROOT / 'resource/apps' / game['id']
        release = app / 'docs/releases' / game['version']
        metadata = read_json(app / 'resource.json')
        verification = read_json(checked_file(release / 'verification.json'))
        recording = read_json(checked_file(release / 'controller-status.json'))
        apk = checked_file(app / game['apk'])
        image = checked_file(release / 'connected.png')
        video = checked_file(release / 'controller-status.mp4')
        require(metadata['version'] == game['version'] and metadata['versionCode'] == game['versionCode']
                and metadata['apk'] == game['apk'], f"Metadata not staged: {game['id']}")
        require(metadata['sha256'] == sha(apk) == verification['apk']['sha256'] == recording['apkSha256'],
                f"APK hash mismatch: {game['id']}")
        require(verification['status'] == 'passed' and verification['scope'] == SCOPE
                and verification['game'] == game['id'] and verification['version'] == game['version'],
                f"Wrong verification scope/version: {game['id']}")
        for key in ['signatureVerified', 'sourceAssetsMatchApk', 'inPlaceUpgradeInstalled',
                    'controllerClientStatusAcceptancePassed', 'actualAndroidEmulator']:
            require(verification.get(key) is True, f"Unverified {key}: {game['id']}")
        require(verification.get('fullGameplayAcceptancePerformedInThisUpdate') is False,
                f"Unexpected gameplay scope: {game['id']}")
        require(verification['connectedCaptureSha256'] == sha(image)
                and image.read_bytes().startswith(bytes.fromhex('89504e470d0a1a0a')),
                f"Screenshot mismatch: {game['id']}")
        require(recording['file'] == 'controller-status.mp4' and recording['scope'] == SCOPE
                and recording['sha256'] == sha(video) and recording['bytes'] == video.stat().st_size
                and recording.get('fullDecodeVerified') is True,
                f"Recording mismatch: {game['id']}")
        for key in ['physicalTvTested', 'physicalPhoneTested', 'physicalEsp32Tested']:
            require(verification.get(key) is False, f"Review physical-device wording: {game['id']}/{key}")
    mac = ROOT / 'resource/apps/neon-rush/macos'
    for extension in ['dmg', 'zip']:
        checked_file(mac / f"NeonRush-{rollout['macos']['version']}-macos-universal.{extension}")


def history_text(text, game, language):
    """Keep prior claims/data/links, but make their temporal scope explicit."""
    text = re.sub(r'<!-- apk-resource:(?:start|end) -->\n?', '', text)
    baseline = 'docs/controller-status-baseline/' + game['previousVersion']
    text = text.replace('(resource.json)', f'({baseline}/resource.json)')
    text = text.replace('(SHA256SUMS.txt)', f'({baseline}/SHA256SUMS.txt)')
    replacements = [('当前版本', '历史版本'), ('本版本', '该历史版本'), ('本版 APK', '该历史版 APK'),
                    ('本轮', '当时'), ('Current version', 'Historical version'),
                    ('This version', 'That historical version'), ('this version', 'that historical version'),
                    ('This update', 'That earlier update'), ('this update', 'that earlier update'),
                    ('This release', 'That historical release'), ('this release', 'that historical release'),
                    ('current twenty-game', 'historical twenty-game'), ('current rollout', 'historical rollout')]
    for old, new in replacements:
        text = text.replace(old, new)
    return text.strip()


def extract_old_release(body, game, language):
    chunks = []
    apk = re.search(r'<!-- apk-resource:start -->.*?<!-- apk-resource:end -->', body, re.S)
    if apk:
        chunks.append(apk.group(0))
        body = body[:apk.start()] + body[apk.end():]
    previous = re.escape(game['previousVersion'])
    if game['host'] == 'legacy':
        match = re.search(r'^## ' + previous + r' pureTV (?:手柄更新|controller update)\n\n'
                          r'[^\n]+\n\n[^\n]+\n\n[^\n]+', body, re.M)
    else:
        prefix = r'^\*\*Android ' if game['id'] == 'neon-rush' else r'^\*\*'
        match = re.search(prefix + previous + r'.*?^!\[[^\n]+\]\(docs/releases/'
                          + previous + r'/menu\.png\)', body, re.M | re.S)
    require(match is not None, f"Unrecognized previous release block: {game['id']}/{language}")
    chunks.append(match.group(0))
    body = body[:match.start()] + body[match.end():]
    return body, chunks


def update_body(body, game, language, chunks):
    old, new = game['previousVersion'], game['version']
    blocks = body.strip().split('\n\n')
    output = []
    for block in blocks:
        # The mixed Used Car introduction also contains old upgrade assertions.
        # Keep it in history and replace it with current package facts only.
        if game['id'] == 'used-car-racing' and re.match(r'(?:当前版本|Current version)', block) and old in block:
            chunks.append(block)
            if language == 'en':
                block = f"Current version **{new} / versionCode {game['versionCode']}** requires Android 8.0 or later. Package: `{game['packageName']}`. See [resource metadata](resource.json) for the signed APK and source."
            else:
                block = f"当前版本为 **{new} / versionCode {game['versionCode']}**，包名 `{game['packageName']}`，适用于 Android 8.0 及以上电视。签名安装包与来源见 [resource.json](resource.json)。"
        elif old in block and (re.match(r'(?:当前版本(?:为)?|Current version|Version)\s*\*\*', block)
                               or re.search(r'^- 版本：', block, re.M)
                               or block.startswith('原创双键传送线装配游戏')):
            block = block.replace(old, new).replace('versionCode ' + str(game['previousVersionCode']),
                                                   'versionCode ' + str(game['versionCode']))
        if game['id'] == 'jackal' and ('本目录 APK 版本为' in block or 'The APK version is' in block):
            block = block.replace(f'`{old}`', f'`{new}`')
            block = block.replace('本轮记录', '[本次版本验证](docs/releases/' + new + '/verification.json)')
            block = block.replace('this round’s record', '[this release verification](docs/releases/' + new + '/verification.json)')
        if game['id'] == 'neon-rush':
            block = block.replace('这些计数不代表本轮重新执行', '这些历史计数不代表本次连接标识更新重新执行')
            block = block.replace(old + ' 已完成的', '历史 Android ' + old + ' 已完成的')
            block = block.replace('本轮验证范围见', '历史 Android ' + old + ' 的验证范围见')
            block = block.replace('不作为新包转向修复的证据', '不作为 Android ' + old + ' 转向修复的证据')
            block = block.replace('those counts do not claim a new run for this update', 'those historical counts do not claim a new run for the controller-identity update')
            block = block.replace('they do not validate the new steering fix', 'they do not validate the steering fix introduced in Android ' + old)
            block = block.replace('Android ' + old + ' 提供', 'Android 客户端自 ' + old + ' 起提供')
            block = block.replace('Android ' + old + ' provides', 'Since Android ' + old + ', the client has provided')
        # Existing certificate/upgrade facts remain about their original release.
        block = block.replace(old + ' 已沿用', '历史 ' + old + ' 已沿用')
        block = block.replace('Version ' + old + ' uses', 'Historical version ' + old + ' used')
        block = block.replace('Version ' + old + ' retains', 'Historical version ' + old + ' retained')
        if old in block and ('历史 ' + old in block or 'Historical version ' + old in block):
            block = block.replace('本轮已在', '当时已在')
        if 'docs/readme-controller-support/' in block:
            block = block.replace('本轮', '历史手柄接入').replace('current rollout', 'historical rollout')
            block = block.replace('current twenty-game', 'historical twenty-game')
            block = block.replace('for this update', 'for the previous controller-input release')
        lines = []
        for line in block.splitlines():
            old_apks = [target for target in re.findall(r'\]\(([^)]+\.apk(?:\?[^)]*)?)\)', line)
                        if target.split('?')[0] != game['apk']]
            if old_apks and '历史' not in line and 'Historical' not in line:
                require(not line.lstrip().startswith('|'), 'Review historical APK table before updating')
                line = ('Historical package: ' if language == 'en' else '历史安装包：') + line
            lines.append(line)
        output.append('\n'.join(lines))
    return re.sub(r'\n{3,}', '\n\n', '\n\n'.join(output)).strip()


def current_block(game, rollout, language):
    version, code, apk = game['version'], game['versionCode'], game['apk']
    release = 'docs/releases/' + version
    if language == 'en':
        body = f'''## {version} · Connected controller identity

<!-- apk-resource:start -->
[Download signed APK]({apk}?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and source](resource.json) · [Source](src/) · [Icon](logo.svg)
<!-- apk-resource:end -->

Android **{version} / versionCode {code}** shows a controller icon, player seat (1P/2P where supported), and the connected device's complete ID in the side area. Disconnected devices disappear. The default TCP port remains **63485**. Current controller firmware does not report RSSI, so signal strength is not displayed.

[Connected screenshot]({release}/connected.png) · [Controller-status recording]({release}/controller-status.mp4?raw=1) · [Version verification]({release}/verification.json) · [Twenty-game update record](../../../docs/controller-client-status/README.md)

The APK uses the existing release certificate. This update verifies connection identity, disconnect/reconnect status and in-place installation in an Android TV emulator; the capture and video show the menu status checks. It does not repeat full gameplay acceptance. Unchanged model evidence is reused by exact hash, with previous reports retained below. Physical TVs, phones, ESP32 devices and upgrades containing existing user saves remain untested.

![Android {version}: connected controller ID]({release}/connected.png)'''
        if game['id'] == 'used-car-racing':
            body += '\n\nThe previous full Android gameplay run was blocked by an emulator RenderThread crash. This menu-status update does not resolve or close that limitation.'
    else:
        body = f'''## {version} · 手柄连接标识

<!-- apk-resource:start -->
[下载签名 APK]({apk}?raw=1) · [校验值](SHA256SUMS.txt) · [签名与来源](resource.json) · [源码](src/) · [图标](logo.svg)
<!-- apk-resource:end -->

Android **{version} / versionCode {code}**：手柄连接后，侧边显示手柄图标、玩家席位（按游戏人数显示 1P/2P）和设备完整连接 ID；断开后隐藏。默认 TCP 端口仍为 **63485**。当前手柄固件未上报 RSSI，因此不显示信号强弱。

[连接截图]({release}/connected.png) · [连接状态专项录像]({release}/controller-status.mp4?raw=1) · [版本验证]({release}/verification.json) · [20 款更新记录](../../../docs/controller-client-status/README.md)

安装包沿用原发布证书。本轮在 Android TV 模拟器中验证连接身份、断开／重连状态及同证书覆盖安装；截图和录像记录菜单中的连接状态专项，没有重做完整玩法验收。未改规则模型按精确哈希复用历史依据，旧版报告继续保留。尚未验证实体电视、手机、ESP32 或带已有存档的升级与数据保留。

![Android {version} 手柄已连接及完整 ID]({release}/connected.png)'''
        if game['id'] == 'used-car-racing':
            body += '\n\n此前完整 Android 玩法检查受模拟器宿主 RenderThread 崩溃阻塞；本次菜单状态专项不代表该限制已解决。'
    if game['id'] == 'neon-rush':
        mac = rollout['macos']['version']
        dmg = f'macos/NeonRush-{mac}-macos-universal.dmg'
        zip_name = f'macos/NeonRush-{mac}-macos-universal.zip'
        if language == 'en':
            body += f'\n\n**macOS {mac}:** [Universal DMG]({dmg}?raw=1) · [Universal ZIP]({zip_name}?raw=1) · [Installation and controller guide](macos/README.md). Requires macOS 11+ and WebGL. The controller ID stays visible during races and when the menu/pause controller panel is closed.'
        else:
            body += f'\n\n**macOS {mac}：** [通用 DMG]({dmg}?raw=1) · [通用 ZIP]({zip_name}?raw=1) · [安装与手柄说明](macos/README.md)。需要 macOS 11+ 和 WebGL；比赛中以及菜单／暂停时收起操作栏后，仍显示连接手柄的 ID。'
    return START + '\n' + body + '\n' + END


def render(original, game, rollout, language, filename):
    current = current_block(game, rollout, language)
    if START in original:
        require(original.count(START) == original.count(END) == 1, 'Duplicate current block')
        require('docs/releases/' + game['version'] + '/verification.json' in original.split(START, 1)[1].split(END, 1)[0],
                'This updater handles only the current rollout; review a different release separately')
        result = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: current, original, flags=re.S)
    else:
        require(original.startswith('# '), f'No README title: {filename}')
        title, body = original.split('\n', 1)
        body, chunks = extract_old_release(body, game, language)
        body = update_body(body, game, language, chunks)
        previous = game['previousVersion']
        original_url = f"https://github.com/ecojust/pureTV/blob/{rollout['baseCommit']}/resource/apps/{game['id']}/{filename}"
        if language == 'en':
            history = f'<details>\n<summary>Historical {previous} download and acceptance record</summary>\n\nThe following describes the previous release; its tests and media do not validate the new controller-ID UI. [Original README at the previous source]({original_url}).'
        else:
            history = f'<details>\n<summary>历史 {previous} 安装包与验收记录</summary>\n\n以下为旧版发布记录，其测试与画面不代表本次连接 ID 界面验收。[原提交中的完整说明]({original_url})。'
        history += '\n\n' + '\n\n'.join(history_text(chunk, game, language) for chunk in chunks) + '\n\n</details>'
        # Keep a language/reference line ahead of the generated release block.
        preamble = ''
        first, separator, rest = body.partition('\n\n')
        if first.startswith('[') and ('README.en.md' in first or 'README.md' in first):
            preamble, body = first + '\n\n', rest
        result = (title + '\n\n' + preamble + current + '\n\n' + body.strip() + '\n\n'
                  + HISTORY_START + '\n' + history + '\n' + HISTORY_END + '\n')
    validate_readme(result, game, rollout)
    return result


def validate_readme(text, game, rollout):
    require(text.count(START) == text.count(END) == text.count(HISTORY_START) == text.count(HISTORY_END) == 1,
            f"Missing generated/history marker: {game['id']}")
    current = text.split(START, 1)[1].split(END, 1)[0]
    targets = re.findall(r'\]\(([^)]+\.apk(?:\?[^)]*)?)\)', text)
    require(targets and targets[0].split('?')[0] == game['apk'], f"Stale first APK link: {game['id']}")
    require(re.findall(r'\]\(([^)]+\.apk(?:\?[^)]*)?)\)', current) == [game['apk'] + '?raw=1'],
            f"Stale/duplicate main APK link: {game['id']}")
    require(text.count('<!-- apk-resource:start -->') == text.count('<!-- apk-resource:end -->') == 1,
            f"Duplicate APK primary block: {game['id']}")
    without_history = re.sub(re.escape(HISTORY_START) + r'.*?' + re.escape(HISTORY_END), '', text, flags=re.S)
    for line in without_history.splitlines():
        for target in re.findall(r'\]\(([^)]+\.apk(?:\?[^)]*)?)\)', line):
            require(target.split('?')[0] == game['apk'] or '历史' in line or 'Historical' in line,
                    f"Old APK outside explicitly historical context: {game['id']}: {line}")
    for name in ['connected.png', 'controller-status.mp4', 'verification.json']:
        require('docs/releases/' + game['version'] + '/' + name in current, f'Missing current {name}')
    if game['id'] == 'neon-rush':
        mac = rollout['macos']['version']
        for extension in ['dmg', 'zip']:
            require(f'NeonRush-{mac}-macos-universal.{extension}' in current, 'Stale Mac main link')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--preview', type=Path, help='Write reviewable drafts and a unified diff outside the repo')
    mode.add_argument('--write', action='store_true', help='Update READMEs only after staged-artifact checks pass')
    mode.add_argument('--check', action='store_true', help='Require staged artifacts and current README content')
    args = parser.parse_args()
    rollout = read_json(ROOT / 'docs/controller-client-status/rollout.json')
    games = rollout['games']
    require(len(games) == len({g['id'] for g in games}) == 20, 'Expected exactly twenty rollout games')
    require(re.fullmatch('[0-9a-f]{40}', rollout['baseCommit']), 'Invalid baseline commit')
    for game in games:
        require(re.fullmatch('[a-z0-9-]+', game['id']), 'Invalid slug')
        require(re.fullmatch(r'\d+\.\d+\.\d+', game['version']), 'Invalid version')
        require(game['apk'] == game['id'] + '-' + game['version'] + '.apk', 'Unexpected APK path')
    planned = []
    for game in games:
        for filename, language in [('README.md', 'zh'), ('README.en.md', 'en')]:
            path = ROOT / 'resource/apps' / game['id'] / filename
            if not path.exists():
                require(language == 'en', f'Missing {path}')
                continue
            before = path.read_text(encoding='utf-8')
            after = render(before, game, rollout, language, filename)
            old_links = set(re.findall(r'\]\(([^)]+)\)', before))
            new_links = set(re.findall(r'\]\(([^)]+)\)', after))
            require(old_links <= new_links, f'Historical links removed: {path}: {old_links - new_links}')
            require(render(after, game, rollout, language, filename) == after, f'Not idempotent: {path}')
            planned.append((path, before, after))
    if args.write or args.check:
        validate_artifacts(rollout)  # Validate every app before any README write.
    if args.preview:
        output = args.preview.resolve()
        require(not output.is_relative_to(ROOT), 'Preview must be outside the repository')
        output.mkdir(parents=True, exist_ok=False)
        diff = []
        for path, before, after in planned:
            name = str(path.relative_to(ROOT))
            target = output / name; target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(after, encoding='utf-8')
            diff.extend(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                                             fromfile='a/' + name, tofile='b/' + name))
        (output / 'readme-update.patch').write_text(''.join(diff), encoding='utf-8')
    changed = [str(path.relative_to(ROOT)) for path, before, after in planned if before != after]
    if args.check:
        require(not changed, 'READMEs need update: ' + ', '.join(changed))
    if args.write:
        for path, before, after in planned:
            # Fail if a concurrent editor changed a README after the read phase.
            require(path.read_text(encoding='utf-8') == before, f'Concurrent README edit: {path}')
        for path, before, after in planned:
            if before != after:
                path.write_text(after, encoding='utf-8')
    report = {'games': len(games), 'readmes': len(planned), 'changed': changed,
              'idempotenceChecked': True, 'artifactsValidated': bool(args.write or args.check),
              'repositoryReadmesWritten': bool(args.write), 'macosReadmeChanged': False}
    if args.preview:
        (args.preview / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
