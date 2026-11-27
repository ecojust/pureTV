"""浏览器实玩验收。安装 Chromium、FFmpeg 和 Python playwright，从游戏目录运行
python qa/play.py /tmp/tanks-qa。加 --apk path/to/game.apk 可直接验证安装包内资源。
"""
from math import hypot
from pathlib import Path
import sys
from time import monotonic
from PIL import Image, ImageStat

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools/pc-games/qa'))
from record_port import gamepad_stick, gameplay_video, held, run, state, tcp_press, wait


def scene_image(page, path):
    # The HUD is HTML and still paints when a resized WebGL canvas is blank.
    for _ in range(4):
        wait(page, 's.frames >= arg + 3', state(page)['frames'])
        page.screenshot(path=path)
        with Image.open(path) as image:
            w, h = image.size
            middle = image.convert('RGB').crop((w // 3, h // 3, 2 * w // 3, 2 * h // 3))
            if max(ImageStat.Stat(middle).stddev) > 12:
                return
    raise AssertionError(f'The center of the game scene remained blank in {path.name}')


def play(page, client, out, tmp):
    assert page.locator('html').get_attribute('lang').lower().startswith('zh')
    menu_action = page.locator('.cot-battle')
    assert '开始' in menu_action.text_content()
    print('Chinese garage is ready. Starting the match.', flush=True)
    deployed = monotonic()
    with held(client, 'START'):
        wait(page, "s.stage !== 'menu'")
    wait(page, "s.stage === 'playing'")
    deploy_seconds = monotonic() - deployed
    speed = page.locator('[data-drive-speed]')
    print('Match started after', round(deploy_seconds, 2), 's', flush=True)
    initial = state(page)['gameplay']
    (out / 'hud-text.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
    wait(page, "!document.querySelector('.cot-bl.on, .cot-bl.leaving, .cot-prebattle.on')")
    moved = 'Math.hypot(s.gameplay.x - arg.x, s.gameplay.z - arg.z) > 1'
    with gameplay_video(page, out, tmp):
        page.keyboard.down('KeyW')
        try:
            wait(page, moved, initial)
        finally:
            page.keyboard.up('KeyW')
        keyboard_position = state(page)['gameplay']
        print('Keyboard movement observed:', keyboard_position, flush=True)
        with held(client, 'UP'):
            wait(page, 's.controller.buttons.UP && ' + moved, keyboard_position)
            before_turn = state(page)['gameplay']
            tcp_press(page, client, 'LEFT', 'Math.abs(s.gameplay.yaw - arg) > 0.05', before_turn['yaw'])
        wait(page, '!s.controller.buttons.UP')
        print('TCP movement observed:', state(page)['gameplay'], flush=True)
        speed.wait_for()
        scene_image(page, out / 'playing-960.png')
        yaw = state(page)['gameplay']['yaw']
        with gamepad_stick(page, 0.8, 0):
            wait(page, 'Math.abs(s.gameplay.yaw - arg) > 0.06', yaw)
        page.set_viewport_size({'width': 1280, 'height': 720})
        scene_image(page, out / 'playing-1280.png')
        (out / 'hud-text.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
        sample_start = page.evaluate('({ms: performance.now(), frames: JoystickGameQA.snapshot().frames})')
        wait(page, 's.frames >= arg + 5', sample_start['frames'])
        sample_end = page.evaluate('({ms: performance.now(), frames: JoystickGameQA.snapshot().frames})')
        final = state(page)['gameplay']
        tcp_press(page, client, 'START', "s.stage === 'paused'")
    page.screenshot(path=out / 'paused.png')
    (out / 'pause-text.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
    paused = state(page)['gameplay']
    page.wait_for_timeout(400)
    assert state(page)['gameplay'] == paused
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    client.button('UP', 'down')
    wait(page, 's.controller.buttons.UP')
    client.disconnect()
    wait(page, "s.stage === 'paused' && !s.controller.connected && !s.controller.buttons.UP")
    client.connect()
    wait(page, "s.stage === 'paused' && s.controller.connected && !s.controller.buttons.UP")
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    return {'softwareBrowserDeploySeconds': round(deploy_seconds, 2),
            'browserFramesObserved': sample_end['frames'] - sample_start['frames'],
            'browserSampleSeconds': round((sample_end['ms'] - sample_start['ms']) / 1000, 3),
            'distanceFromKeyboard': hypot(initial['x'] - keyboard_position['x'], initial['z'] - keyboard_position['z']),
            'before': initial, 'after': final, 'pausedPhysicsStable': True, 'tcpDisconnectClearedHeldUp': True}


if __name__ == '__main__':
    run('claude-of-tanks', play)
