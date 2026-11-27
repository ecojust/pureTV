"""Run after building dist/, or pass --apk to verify the released assets."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools/pc-games/qa'))
from record_port import gamepad_stick, gameplay_video, held, run, state, tcp_press, wait


def play(page, client, out, tmp):
    menu = page.locator('#onboardingModal')
    start = page.locator('#btnStartFlight')
    assert '飞' in start.inner_text()
    for width, height in [(1280, 720), (960, 540)]:
        page.set_viewport_size({'width': width, 'height': height})
        rect = start.bounding_box()
        assert rect and rect['y'] >= 0 and rect['y'] + rect['height'] <= height + 1, rect
        page.screenshot(path=out / f'menu-{width}.png')
    page.locator('[data-assist="pilot"]').click()
    page.locator('[data-time="2"]').click()
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    assert menu.is_hidden()
    initial = state(page)['gameplay']
    with gameplay_video(page, out, tmp):
        page.keyboard.press('KeyC')
        page.keyboard.down('KeyD')
        try:
            wait(page, 's.gameplay.rollInput > 0.5')
            page.wait_for_function('openaeroDebug().bankRightDeg > 8', polling=150)
            right_bank = page.evaluate('openaeroDebug().bankRightDeg')
        finally:
            page.keyboard.up('KeyD')
        wait(page, 'Math.abs(s.gameplay.rollInput) < 0.1')
        page.screenshot(path=out / 'playing-960.png')
        with held(client, 'LEFT'):
            wait(page, 's.gameplay.rollInput < -0.5')
            page.wait_for_function('arg => openaeroDebug().bankRightDeg < arg - 4', arg=right_bank, polling=150)
        wait(page, 'Math.abs(s.gameplay.rollInput) < 0.1')
        tcp_press(page, client, 'A', 's.gameplay.throttle > arg + 0.03', state(page)['gameplay']['throttle'])
        tcp_press(page, client, 'X', 's.gameplay.flapsIndex !== arg', initial['flapsIndex'])
        with held(client, 'A'), held(client, 'B'):
            wait(page, 's.controller.buttons.A && s.controller.buttons.B && s.gameplay.brakesOn !== arg', initial['brakesOn'])
            page.wait_for_timeout(300)
            assert state(page)['gameplay']['brakesOn'] != initial['brakesOn']
        wait(page, '!s.controller.buttons.A && !s.controller.buttons.B')
        with gamepad_stick(page, 0.8, 0):
            wait(page, 's.gameplay.rollInput > 0.5')
        page.set_viewport_size({'width': 1280, 'height': 720})
        wait(page, 's.canvasWidth > 0 && s.canvasHeight > 0')
        page.locator('#toast').wait_for(state='hidden')
        page.screenshot(path=out / 'playing-1280.png')
        flight = state(page)['gameplay']
    tcp_press(page, client, 'START', "s.stage === 'paused'")
    paused = state(page)['gameplay']
    page.wait_for_timeout(400)
    assert state(page)['gameplay'] == paused
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    client.button('RIGHT', 'down')
    wait(page, 's.gameplay.rollInput > 0.5')
    client.disconnect()
    wait(page, "s.stage === 'paused' && !s.controller.connected && !s.controller.buttons.RIGHT")
    client.connect()
    wait(page, "s.stage === 'paused' && s.controller.connected && !s.controller.buttons.RIGHT")
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    return {'keyboardRightBankDegrees': right_bank, 'before': initial, 'after': flight,
            'brakeChordToggledOnce': True, 'pausedPhysicsStable': True, 'tcpDisconnectClearedHeldRight': True}


if __name__ == '__main__':
    run('openaero-dfw', play)
