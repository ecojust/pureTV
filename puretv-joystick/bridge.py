"""Serve a virtual controller locally and relay its events to a game over TCP."""
import argparse
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from joystick_sdk import KEYS, JoystickClient


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
                        bridge.ping()
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
        server.bridge = JoystickClient(args.host, args.port)
        print(f"http://127.0.0.1:{server.server_port}/ → {args.host}:{args.port}", flush=True)
        server.serve_forever()
