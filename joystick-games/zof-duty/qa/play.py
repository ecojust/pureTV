"""通过桌面宿主、真实回环 TCP 和浏览器输入完成一局。运行 python qa/play.py /tmp/zof-qa。"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tools/pc-games/qa'))
from record_port import gamepad_stick, gameplay_video, held, run, state, tcp_press, wait


def play(page, client, out, tmp):
    assert page.locator('#title').inner_text() == '光球挑战'
    for w, h in [(1280, 720), (960, 540)]:
        page.set_viewport_size({'width':w, 'height':h})
        button = page.locator('#primary').bounding_box()
        assert button and button['x'] >= 0 and button['y'] + button['height'] <= h
        page.screenshot(path=out / f'menu-{w}.png')
    tcp_press(page,client,'START',"s.stage === 'playing'")
    with gameplay_video(page, out, tmp):
        tcp_press(page, client, 'A', 's.gameplay.hits === 1 && s.gameplay.score === 100')
        with held(client, 'RIGHT'):
            wait(page, 's.gameplay.cursorX > 0.53')
        tcp_press(page, client, 'Y', 'Math.abs(s.gameplay.cursorX - 0.5) < 0.001')
        tcp_press(page, client, 'X', 's.gameplay.zoomed')
        tcp_press(page, client, 'X', '!s.gameplay.zoomed')
        page.keyboard.down('ArrowLeft')
        try: wait(page,'s.gameplay.cursorX < 0.47')
        finally: page.keyboard.up('ArrowLeft')
        pause = state(page)['gameplay']
        tcp_press(page,client,'START',"s.stage === 'paused'")
        paused = state(page)['gameplay']
        page.wait_for_timeout(220)
        assert state(page)['gameplay'] == paused and pause['hits']==1
        page.screenshot(path=out/'paused-960.png')
        tcp_press(page,client,'START',"s.stage === 'playing'")
        client.button('RIGHT','down')
        wait(page,'s.controller.buttons.RIGHT')
        client.disconnect()
        wait(page,"s.stage === 'paused' && !s.controller.buttons.RIGHT")
        with gamepad_stick(page, 0.8, 0):
            wait(page,"s.controller.transport === 'gamepad' && s.controller.buttons.RIGHT")
        client.connect()
        wait(page,"s.stage === 'paused' && s.controller.connected && !s.controller.buttons.RIGHT")
        tcp_press(page,client,'START',"s.stage === 'playing'")
        page.screenshot(path=out/'playing-960.png')
        page.set_viewport_size({'width':1280,'height':720})
        wait(page,'s.canvasWidth === 1280')
        page.screenshot(path=out/'playing-1280.png')
        # Project the upstream three-dimensional sphere centres into this viewport, then use
        # browser clicks. The camera ray, intersections and scores run in the actual game.
        layout = page.evaluate("""async () => (await import(new URL('core.js', location.href))).TARGET_SPECS""")
        scale = 360 / math.tan(math.radians(15))
        seen = 1
        for i, sphere in enumerate(layout):
            if i == 2: continue  # the TCP button already collected this one
            x = 640 + sphere['x'] * scale / (5.2-sphere['z'])
            y = 360 - (sphere['y']-1.62) * scale / (5.2-sphere['z'])
            page.mouse.click(x,y)
            seen += 1
            wait(page,'s.gameplay.hits === arg',seen)
        wait(page,"s.stage === 'ended' && s.gameplay.remaining === 0")
    result = state(page)['gameplay']
    assert result['activations']==15 and result['combo']==15 and result['accuracy']==100
    page.screenshot(path=out/'result-1280.png')
    tcp_press(page,client,'A',"s.stage === 'playing' && s.gameplay.round === 2 && s.gameplay.score === 0")
    return {'result':result,'initialCenterPulsePoints':100,'pauseStable':True,
            'disconnectClearedInput':True,'retryResetRound':True}


if __name__ == '__main__':
    run('zof-duty', play)
