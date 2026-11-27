"""Run after building dist/, or pass --apk to verify the released assets."""
from math import hypot
from pathlib import Path
import sys
from time import monotonic

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools/pc-games/qa'))
from record_port import gamepad_stick, gameplay_video, held, run, state, tcp_press, wait


def play(page, client, out, tmp):
    assert page.locator('html').get_attribute('lang').lower().startswith('zh')
    menu_action = page.locator('.cot-battle')
    menu_action.wait_for()
    assert any('\u4e00' <= c <= '\u9fff' for c in menu_action.inner_text()), menu_action.inner_text()
    for width, height in [(1280, 720), (960, 540)]:
        page.set_viewport_size({'width': width, 'height': height})
        rect = menu_action.bounding_box()
        assert rect and 0 <= rect['x'] and rect['x'] + rect['width'] <= width + 1, rect
        page.screenshot(path=out / f'menu-{width}.png')
    deployed = monotonic()
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    deploy_seconds = monotonic() - deployed
    speed = page.locator('[data-drive-speed]')
    speed.wait_for()
    initial = state(page)['gameplay']
    moved = 'Math.hypot(s.gameplay.x - arg.x, s.gameplay.z - arg.z) > 1'
    with gameplay_video(page, out, tmp):
        page.keyboard.down('KeyW')
        try:
            wait(page, moved, initial)
        finally:
            page.keyboard.up('KeyW')
        keyboard_position = state(page)['gameplay']
        page.screenshot(path=out / 'playing-960.png')
        with held(client, 'UP'):
            wait(page, 's.controller.buttons.UP && ' + moved, keyboard_position)
            before_turn = state(page)['gameplay']
            tcp_press(page, client, 'LEFT', 'Math.abs(s.gameplay.yaw - arg) > 0.05', before_turn['yaw'])
        wait(page, '!s.controller.buttons.UP')
        yaw = state(page)['gameplay']['yaw']
        with gamepad_stick(page, 0.8, 0):
            wait(page, 'Math.abs(s.gameplay.yaw - arg) > 0.06', yaw)
        page.set_viewport_size({'width': 1280, 'height': 720})
        page.screenshot(path=out / 'playing-1280.png')
        (out / 'hud-text.txt').write_text(page.locator('body').inner_text(), encoding='utf-8')
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
            'distanceFromKeyboard': hypot(initial['x'] - keyboard_position['x'], initial['z'] - keyboard_position['z']),
            'before': initial, 'after': final, 'pausedPhysicsStable': True, 'tcpDisconnectClearedHeldUp': True}


if __name__ == '__main__':
    run('claude-of-tanks', play)
