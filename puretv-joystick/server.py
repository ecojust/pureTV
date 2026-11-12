"""Temporary LAN receiver for the ESP32 TCP connectivity test."""
import argparse
import json
import socketserver
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


controllers = {}
state_lock = threading.Lock()


class Monitor(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            body = Path(__file__).with_name("monitor.html").read_bytes()
            content_type = "text/html; charset=utf-8"
        elif self.path == "/state":
            with state_lock:
                body = json.dumps({
                    identity: {
                        "online": state["owner"] is not None,
                        "pressed": sorted(state["pressed"]),
                    }
                    for identity, state in controllers.items()
                }).encode()
            content_type = "application/json"
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


class Receiver(socketserver.StreamRequestHandler):
    def handle(self):
        print(f"connected {self.client_address}", flush=True)
        pressed = set()
        owner = object()
        controller_id = f"{self.client_address[0]}:{self.client_address[1]}"
        self.connection.settimeout(15)
        try:
            while line := self.rfile.readline(1025):
                if len(line) > 1024 or not line.endswith(b"\n"):
                    break
                try:
                    event = json.loads(line)
                    if not isinstance(event, dict):
                        raise ValueError("expected an object")
                    kind, seq = event["type"], event["seq"]
                    if type(seq) is not int or seq < 1:
                        raise ValueError("invalid seq")
                    identity = event.get("controller_id", controller_id)
                    if not isinstance(identity, str) or not identity or len(identity) > 64:
                        raise ValueError("invalid controller_id")
                    if kind == "button":
                        key = event.get("key")
                        if key not in ("UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"):
                            raise ValueError("invalid key")
                        if type(event.get("pressed")) is not bool:
                            raise ValueError("invalid button state")
                        action = event.get("action", "down" if event["pressed"] else "up")
                        if action not in ("down", "up", "tap", "long_press", "long_release", "sync"):
                            raise ValueError("invalid action")
                        if event["pressed"]:
                            pressed.add(key)
                        else:
                            pressed.discard(key)
                        event["action"] = action
                    elif kind not in ("hello", "ping"):
                        raise ValueError("unknown type")
                    reply = {"type": "ack", "seq": seq}
                    controller_id = identity
                    event["controller_id"] = controller_id
                    with state_lock:
                        state = controllers.get(identity)
                        if state is None or kind == "hello":
                            state = {"owner": owner, "pressed": set()}
                            controllers[identity] = state
                        if state["owner"] is owner:
                            state["pressed"] = pressed.copy()
                    print(json.dumps(event), flush=True)
                except (ValueError, KeyError) as exc:
                    reply = {"type": "error", "message": str(exc)}
                self.wfile.write(json.dumps(reply).encode() + b"\n")
        except OSError as exc:
            print(f"connection ended: {exc}", flush=True)
        finally:
            with state_lock:
                state = controllers.get(controller_id)
                if state is not None and state["owner"] is owner:
                    state.update(owner=None, pressed=set())
            for key in sorted(pressed):
                print(json.dumps({"type": "button", "controller_id": controller_id,
                                  "key": key, "pressed": False, "action": "disconnect_release"}),
                      flush=True)
            print(f"disconnected {self.client_address}", flush=True)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--monitor-port", type=int, default=8766)
    args = parser.parse_args()
    with Server((args.host, args.port), Receiver) as server:
        print(f"listening on {args.host}:{server.server_address[1]}", flush=True)
        with ThreadingHTTPServer(("127.0.0.1", args.monitor_port), Monitor) as monitor:
            thread = threading.Thread(target=monitor.serve_forever, daemon=True)
            thread.start()
            print(f"monitor on http://127.0.0.1:{monitor.server_port}/", flush=True)
            try:
                server.serve_forever()
            finally:
                monitor.shutdown()
