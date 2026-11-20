"""Observe return traffic while the repository SDK sends its normal TCP messages."""
import json
from pathlib import Path
import socket
import sys
import threading
import time

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'puretv-joystick'))
from joystick_sdk import JoystickClient


def wait_for(page, predicate, timeout):
    """Poll a read-only CDP expression without compiling a predicate in the game page."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if page.evaluate(predicate):
            return
        page.wait_for_timeout(150)
    raise TimeoutError(f'Game did not satisfy {predicate} within {timeout}s')


class MeasuredClient(JoystickClient):
    def __init__(self, port):
        super().__init__('127.0.0.1', port)
        self.replies = []
        self.stop_pings = threading.Event()
        self.pinger = None

    def connect(self):
        super().connect()
        self.stop_pings.clear()
        self.pinger = threading.Thread(target=self.heartbeat, daemon=True)
        self.pinger.start()

    def heartbeat(self):
        while not self.stop_pings.wait(3):
            try:
                self.ping()
            except (ConnectionError, OSError):
                return

    def stop_heartbeat(self):
        self.stop_pings.set()
        if self.pinger and self.pinger is not threading.current_thread():
            self.pinger.join(timeout=3)

    def disconnect(self):
        self.stop_heartbeat()
        super().disconnect()

    def drain_replies(self, sock):
        pending = b''
        while self.sock is sock:
            try:
                chunk = sock.recv(4096)
            except socket.timeout:
                continue
            except OSError:
                break
            if not chunk:
                break
            pending += chunk
            while b'\n' in pending:
                message, pending = pending.split(b'\n', 1)
                self.replies.append(json.loads(message))

    def acknowledged(self):
        self.stop_heartbeat()
        deadline = time.monotonic() + 8
        while len(self.replies) < self.seq and time.monotonic() < deadline:
            time.sleep(.02)
        assert all(reply.get('type') == 'ack' for reply in self.replies), self.replies
        assert [reply['seq'] for reply in self.replies] == list(range(1, self.seq + 1)), self.replies
        return len(self.replies)
