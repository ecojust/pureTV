"""Serve a virtual controller locally and relay its events to a game over TCP."""
import argparse
import json
import socket
import threading
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

KEYS = ("UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y")


class Bridge:
    def __init__(self, target):
        self.target = target
        self.identity = f"virtual-{uuid.uuid4().hex[:12]}"
        self.lock = threading.Lock()
        self.sock = None
        self.seq = 0

    def send(self, kind, **fields):
        self.seq += 1
        event = dict(type=kind, seq=self.seq, controller_id=self.identity, **fields)
        self.sock.sendall(json.dumps(event).encode() + b"\n")

    def button(self, key, action, duration=0):
        self.send("button", key=key, action=action,
                  pressed=action in ("down", "long_press"), duration_ms=duration)

    def disconnect(self):
        if self.sock is not None:
            self.sock.close()
            self.sock = None

    def connect(self):
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


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/":
            self.send_error(404)
            return
        self.reply(200, Path(__file__).with_name("virtual.html").read_bytes(),
                   "text/html; charset=utf-8")

    def do_POST(self):
        if self.path != "/event" or self.headers.get_content_type() != "application/json":
            self.send_error(400)
            return
        bridge = self.server.bridge
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 1024:
                raise ValueError("invalid message size")
            event = json.loads(self.rfile.read(length))
            if not isinstance(event, dict):
                raise ValueError("expected object")
            action = event.get("action")
            with bridge.lock:
                try:
                    if action == "connect":
                        bridge.connect()
                    elif action == "disconnect":
                        bridge.disconnect()
                    elif bridge.sock is None:
                        raise ConnectionError("游戏 TCP 未连接")
                    elif action == "ping":
                        bridge.send("ping")
                    else:
                        key, duration = event.get("key"), event.get("duration_ms", 0)
                        if (key not in KEYS or action not in ("down", "tap", "long_press", "long_release")
                                or type(duration) is not int or not 0 <= duration <= 2**32 - 1):
                            raise ValueError("invalid button event")
                        bridge.button(key, action, duration)
                except OSError:
                    bridge.disconnect()
                    raise
                result = {"connected": bridge.sock is not None, "id": bridge.identity}
            self.reply(200, json.dumps(result).encode())
        except (ValueError, OSError) as exc:
            self.reply(400, json.dumps({"error": str(exc)}).encode())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("host", help="Game TCP host or IPv4 address")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--web-port", type=int, default=8767)
    args = parser.parse_args()
    with HTTPServer(("127.0.0.1", args.web_port), Handler) as server:
        server.bridge = Bridge((args.host, args.port))
        print(f"http://127.0.0.1:{server.server_port}/ → {args.host}:{args.port}", flush=True)
        server.serve_forever()
