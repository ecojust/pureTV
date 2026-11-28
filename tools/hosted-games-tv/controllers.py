"""Exercise the TV's real phone WebSocket and Wi-Fi TCP listener through ADB forwarding."""
from contextlib import contextmanager
import http.client
import json
import re
import socket
import threading
import time
from urllib.parse import urlsplit

import websocket


@contextmanager
def forwarded(device, port):
    local = int(device.adb('forward', 'tcp:0', f'tcp:{port}'))
    try:
        yield local
    finally:
        device.adb('forward', '--remove', f'tcp:{local}')


def panel(device, contains):
    return device.until('controller connection status', lambda tree: next(
        (n.get('text') for n in tree.iter('node') if contains in n.get('text', '')), None))


def phone_input(device, titles):
    address = urlsplit(re.search(r'http://[^\s]+', panel(device, '?room=')).group())
    with forwarded(device, address.port) as port:
        # ADB connects to the loopback listener. Use the matching local Host and Origin.
        host = f'127.0.0.1:{address.port}'
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=6)
        try:
            connection.request('GET', '/?' + address.query, headers={'Host': host})
            response = connection.getresponse()
            if response.status != 200 or b'controller.js' not in response.read():
                raise RuntimeError('Pairing URL did not serve the phone controller')
        finally:
            connection.close()
        ws = websocket.create_connection(f'ws://127.0.0.1:{port}/ws?{address.query}',
                                         host=host, origin='http://' + host, timeout=6)
        stop = threading.Event()

        def heartbeat():
            while not stop.wait(.8):
                try:
                    ws.send('{"type":"ping"}')
                except (OSError, websocket.WebSocketException):
                    return

        try:
            ws.send('{"type":"hello"}')
            if json.loads(ws.recv()).get('type') != 'welcome':
                raise RuntimeError('TV did not welcome the phone controller')
            thread = threading.Thread(target=heartbeat, daemon=True)
            thread.start()
            panel(device, '手机手柄 已连接')
            for seq, y in ((1, 1), (2, 0)):
                ws.send(json.dumps(dict(type='input', seq=seq, x=0, y=y, a=False, b=False)))
                time.sleep(.14)
            device.focused(titles[1])
        finally:
            stop.set()
            ws.close()
    panel(device, '手机手柄 同一网络扫码连接')
    return {'transport': 'phone WebSocket through ADB', 'welcome': True, 'focusedAfterDown': titles[1],
            'disconnectionObserved': True}


@contextmanager
def wifi_controller(device):
    port = int(re.search(r'TCP (\d+)', panel(device, 'TCP ')).group(1))
    with forwarded(device, port) as local, socket.create_connection(('127.0.0.1', local), timeout=6) as tcp:
        with tcp.makefile('r', encoding='utf-8') as incoming:
            seq = 0

            def send(kind, **fields):
                nonlocal seq
                seq += 1
                msg = dict(type=kind, seq=seq, controller_id='hosted-tv-emulator', **fields)
                tcp.sendall((json.dumps(msg) + '\n').encode())
                ack = json.loads(incoming.readline())
                if ack.get('type') != 'ack' or ack.get('seq') != seq:
                    raise RuntimeError('Unexpected Wi-Fi controller acknowledgement')

            def tap(key, duration=.14):
                send('button', key=key, action='down', pressed=True, duration_ms=0)
                time.sleep(duration)
                send('button', key=key, action='tap', pressed=False, duration_ms=round(duration * 1000))

            send('hello')
            panel(device, 'Wi-Fi 手柄 已连接')
            yield tap


def wifi_input(device, titles):
    with wifi_controller(device) as tap:
        tap('DOWN')
        device.focused(titles[1])
    device.until('Wi-Fi controller disconnected', lambda tree: any(
        'TCP ' in n.get('text', '') and 'Wi-Fi 手柄 已连接' not in n.get('text', '')
        for n in tree.iter('node')))
    return {'transport': 'Wi-Fi TCP through ADB', 'acknowledgements': 3, 'focusedAfterDown': titles[1],
            'disconnectionObserved': True}


def wifi_play(device, title):
    """Exercise the same TCP seat through TV help, play and back to the original game."""
    device.key('KEYCODE_MENU')
    device.label(title + ' · 操作说明')
    with wifi_controller(device) as tap:
        tap('START')
        before = device.label('游戏光标').get('bounds')
        tap('RIGHT', .22)
        after = device.until('Wi-Fi cursor movement in author game', lambda tree: next((
            n.get('bounds') for n in tree.iter('node') if n.get('content-desc') == '游戏光标'
            and n.get('bounds') != before), None))
        tap('START')
        device.label(title + ' · 操作说明')
        tap('START')
        device.label('游戏光标')
    return {'transport': 'Wi-Fi TCP through ADB', 'cursorBefore': before, 'cursorAfter': after,
            'guideOpenedAndClosedFromGame': True}
