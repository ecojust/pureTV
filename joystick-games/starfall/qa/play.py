"""从游戏目录运行 python qa/play.py /tmp/starfall-qa [--order-only] [--apk 游戏.apk]。"""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools/pc-games/qa'))
from record_port import gamepad_stick, held, run, state, tcp_press, wait


def observe_command(page, client):
    # Capture native order changes in the same event dispatch so that autonomous
    # harvesting on the next simulation update cannot overwrite the observation.
    page.evaluate("""() => {
        const canvas = document.querySelector('#viewport');
        const world = window.__starfall.world;
        const order = () => structuredClone(world.ships.get(world.selection[0]).order);
        const log = window.__orderObservation = {};
        canvas.addEventListener('pointerdown', e => {
            if (e.button === 2) log.before = order();
        }, {capture: true, once: true});
        canvas.addEventListener('pointerup', e => {
            if (e.button === 2) {
                log.after = order();
                log.point = [e.clientX, e.clientY];
            }
        }, {once: true});
    }""")
    with held(client, 'B'):
        wait(page, 'window.__orderObservation.after')
    observed = page.evaluate('window.__orderObservation')
    assert observed['after'] != observed['before'], observed
    assert observed['after'].get('manual') is True, observed
    return observed


def prove_order(page, client, out, tmp):
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    tcp_press(page, client, 'X', 's.gameplay.selected === 1')
    ship = state(page)['gameplay']['ship']
    with held(client, 'RIGHT'):
        wait(page, 's.gameplay.cursorX > 620')
    with held(client, 'DOWN'):
        wait(page, 's.gameplay.cursorY > 370')
    return {'ship': ship, 'source': 'Native canvas listeners observed before and after a real SDK B press',
            'order': observe_command(page, client)}


def play(page, client, out, tmp):
    assert page.locator('#launch').inner_text() == '开始指挥'
    wait(page, "s.renderer === 'webgl2' && s.gameplay.ships > 2")
    page.screenshot(path=out / 'menu.png')
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    page.keyboard.press('Control+a')
    wait(page, 's.gameplay.selected > 1')
    all_ships = state(page)['gameplay']['selected']
    tcp_press(page, client, 'X', 's.gameplay.selected === 1')
    initial = state(page)['gameplay']
    with held(client, 'RIGHT'):
        wait(page, 's.gameplay.cursorX > arg + 110', initial['cursorX'])
    with held(client, 'DOWN'):
        wait(page, 's.gameplay.cursorY > arg + 32', initial['cursorY'])
    order = observe_command(page, client)
    wait(page, 'Math.hypot(s.gameplay.x - arg.x, s.gameplay.y - arg.y, s.gameplay.z - arg.z) > 3', initial)
    moved = state(page)['gameplay']
    page.screenshot(path=out / 'playing.png')
    with gamepad_stick(page, -1, 0):
        wait(page, 's.gameplay.cursorX < arg - 3', moved['cursorX'])
    tcp_press(page, client, 'START', "s.stage === 'paused'")
    paused = state(page)['gameplay']
    page.wait_for_timeout(400)
    assert state(page)['gameplay'] == paused
    page.screenshot(path=out / 'paused.png')
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    with held(client, 'LEFT'):
        wait(page, 's.controller.buttons.LEFT')
        client.disconnect()
        wait(page, "s.stage === 'paused' && !s.controller.connected && !s.controller.buttons.LEFT")
        client.connect()
        wait(page, "s.stage === 'paused' && s.controller.connected && !s.controller.buttons.LEFT")
    tcp_press(page, client, 'START', "s.stage === 'playing'")
    return {'keyboardFleetSize': all_ships, 'selectedShip': moved['ship'], 'order': order,
            'before': initial, 'after': moved, 'pausedSimulationStable': True, 'disconnectClearsInput': True}


if __name__ == '__main__':
    if '--order-only' in sys.argv:
        sys.argv.remove('--order-only')
        run('starfall', prove_order)
    else:
        run('starfall', play)
