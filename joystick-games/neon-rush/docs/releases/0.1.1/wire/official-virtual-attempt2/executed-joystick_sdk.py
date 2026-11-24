"""Python client for the pureTV Wi-Fi controller TCP protocol."""
import json
import socket
import threading
import uuid


KEYS = ("UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y")


class JoystickClient:
    def __init__(self, host, port=8765):
        self.target = (host, port)
        self.identity = f"virtual-{uuid.uuid4().hex[:12]}"
        self.lock = threading.RLock()
        self.sock = None
        self.seq = 0

    def send(self, kind, **fields):
        with self.lock:
            if self.sock is None:
                raise ConnectionError("Game TCP is not connected")
            self.seq += 1
            event = dict(type=kind, seq=self.seq, controller_id=self.identity, **fields)
            try:
                self.sock.sendall(json.dumps(event).encode() + b"\n")
            except OSError:
                self.disconnect()
                raise

    def ping(self):
        self.send("ping")

    def button(self, key, action, duration=0):
        self.send("button", key=key, action=action,
                  pressed=action in ("down", "long_press"), duration_ms=duration)

    def disconnect(self):
        with self.lock:
            if self.sock is not None:
                sock, self.sock = self.sock, None
                try:
                    sock.shutdown(socket.SHUT_RDWR)
                except OSError:
                    pass
                sock.close()

    def connect(self):
        with self.lock:
            self.disconnect()
            sock = socket.create_connection(self.target, timeout=2)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            self.sock = sock
            self.send("hello")
            for key in KEYS:
                self.button(key, "sync")
            threading.Thread(target=self.drain_replies, args=(sock,), daemon=True).start()

    def drain_replies(self, sock):
        while True:
            try:
                if not sock.recv(4096):
                    break
            except socket.timeout:
                continue
            except OSError:
                break
        with self.lock:
            if self.sock is sock:
                self.disconnect()
