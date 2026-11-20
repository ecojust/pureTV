"""Run an installed game's original APK Web assets in a local desktop browser."""

import argparse
import contextlib
import hashlib
import http.server
import ipaddress
import json
import mimetypes
import os
from pathlib import Path, PurePosixPath
import re
import socket
import socketserver
import sys
import threading
from urllib.parse import unquote, urlsplit
import uuid
import webbrowser
from zipfile import BadZipFile, ZipFile

KEYS = ("UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y")
SAFE_ID = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9:._-]{0,95}\Z")
ALIASES = {
    "tank": "TankHost",
    "super-mario": "MarioHost",
    "jackal": "JackalHost",
    "adventure-island": "AdventureHost",
    "bomb-jack": "BombJackHost",
    "tetris": "TetrisHost",
    "jewel": "JewelHost",
    "coast-kart": "CoastKartHost",
    "alien-shooter": "AlienShooterHost",
    "used-car-racing": "UsedCarHost",
}


class Seat:
    """State for one physical controller and its independently cancellable session."""

    def __init__(self, room, number):
        self.room = room
        self.number = number
        self.condition = room.condition
        self.owner = None
        self.identity = ""
        self.session = ""
        self.epoch = 0
        self.sequence = -1
        self.held = set()
        self.blocked = set()
        self.counts = dict.fromkeys(KEYS, 0)

    def changed(self):
        self.room.revision += 1
        self.condition.notify_all()

    def release(self, owner):
        with self.condition:
            if self.owner is owner:
                self.owner = None
                self.held.clear()
                self.blocked.clear()
                self.epoch += 1
                self.changed()

    def sample(self):
        with self.condition:
            buttons = {
                key: key in self.held and key not in self.blocked for key in KEYS
            }
            player = dict(
                id=self.number,
                connected=self.owner is not None,
                controllerId=self.identity,
                session=self.session,
                transport="wifi",
                inputActive=True,
                cancelSeq=self.epoch,
                buttons=buttons,
                buttonCounters=dict(self.counts),
            )
            return player

    def handle(self, connection, event):
        ident, seq, kind = (event.get(k) for k in ("controller_id", "seq", "type"))
        if (
            not isinstance(ident, str)
            or not SAFE_ID.fullmatch(ident)
            or type(seq) is not int
            or not 0 <= seq <= 2**53 - 1
        ):
            raise ValueError("invalid_message")
        with self.condition:
            if kind == "hello" and self.owner is not connection:
                if self.owner is not None:
                    if self.identity != ident:
                        raise ValueError("controller_busy")
                    with contextlib.suppress(OSError):
                        self.owner.shutdown(socket.SHUT_RDWR)
                self.owner, self.identity = connection, ident
                self.session, self.sequence = uuid.uuid4().hex, -1
                self.epoch += 1
                self.held.clear()
                self.blocked.clear()
                self.counts = dict.fromkeys(KEYS, 0)
            if self.owner is not connection or ident != self.identity:
                raise ValueError("hello_required")
            if seq <= self.sequence:
                return
            if kind == "button":
                key, action, down = (event.get(k) for k in ("key", "action", "pressed"))
                duration = event.get("duration_ms", 0)
                if (
                    key not in KEYS
                    or type(down) is not bool
                    or type(duration) is not int
                    or duration < 0
                ):
                    raise ValueError("invalid_button")
                if action not in (
                    "down",
                    "up",
                    "tap",
                    "long_press",
                    "long_release",
                    "sync",
                ):
                    raise ValueError("invalid_button")
                if action != "sync" and down != (action in ("down", "long_press")):
                    raise ValueError("invalid_button")
                if action == "down" and key not in self.held:
                    self.counts[key] += 1
                if down:
                    if (
                        action in ("sync", "long_press")
                        and key not in self.held
                        and (
                            key in ("A", "B", "X", "Y", "START")
                            or action == "long_press"
                        )
                    ):
                        self.blocked.add(key)
                    self.held.add(key)
                else:
                    self.held.discard(key)
                    self.blocked.discard(key)
            elif kind not in ("hello", "ping"):
                raise ValueError("invalid_message")
            self.sequence = seq
            self.changed()


class Room:
    def __init__(self, seats=1):
        self.condition = threading.Condition()
        self.revision = 0
        self.seats = [Seat(self, index + 1) for index in range(seats)]

    def sample(self):
        with self.condition:
            players = [s.sample() for s in self.seats if s.identity]
            return dict(
                revision=self.revision,
                inputEnabled=True,
                connections=sum(p["connected"] for p in players),
                players=players,
            )

    def handle(self, connection, event):
        with self.condition:
            seat = next((s for s in self.seats if s.owner is connection), None)
            if not seat and event.get("type") == "hello":
                identity = event.get("controller_id")
                seat = next((s for s in self.seats if s.identity == identity), None)
                if not seat:
                    seat = next((s for s in self.seats if s.owner is None), None)
                if not seat:
                    raise ValueError("controller_busy")
            if not seat:
                raise ValueError("hello_required")
            seat.handle(connection, event)

    def release(self, connection):
        with self.condition:
            for seat in self.seats:
                seat.release(connection)


class PadHandler(socketserver.StreamRequestHandler):
    def handle(self):
        self.connection.settimeout(15)
        try:
            while line := self.rfile.readline(1025):
                if len(line) > 1024 or not line.endswith(b"\n"):
                    break
                try:
                    msg = json.loads(line)
                    if not isinstance(msg, dict):
                        raise ValueError("invalid_message")
                    self.server.room.handle(self.connection, msg)
                except (ValueError, UnicodeError, TypeError) as e:
                    self.wfile.write(
                        (json.dumps(dict(type="error", message=str(e))) + "\n").encode()
                    )
                    break
                self.wfile.write(
                    (json.dumps(dict(type="ack", seq=msg["seq"])) + "\n").encode()
                )
        except OSError:
            pass
        finally:
            self.server.room.release(self.connection)


class Pads(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = os.name != "nt"


def addresses():
    hosts = set()
    with contextlib.suppress(OSError):
        hosts.update(socket.gethostbyname_ex(socket.gethostname())[2])
    with contextlib.suppress(OSError), socket.socket(
        socket.AF_INET, socket.SOCK_DGRAM
    ) as probe:
        probe.connect(("192.0.2.1", 9))
        hosts.add(probe.getsockname()[0])
    return sorted(
        ip
        for ip in hosts
        if not ipaddress.ip_address(ip).is_loopback and ip != "0.0.0.0"
    )


@contextlib.contextmanager
def discovery(slug, addresses, port):
    service = None
    client = None
    service_name = "pureTV-" + slug
    try:
        try:
            from zeroconf import ServiceInfo, Zeroconf, IPVersion

            if addresses:
                client = Zeroconf(ip_version=IPVersion.V4Only)
                kind = "_puretv._tcp.local."
                service = ServiceInfo(
                    kind,
                    service_name + "." + kind,
                    addresses=[socket.inet_aton(ip) for ip in addresses],
                    port=port,
                    properties={"version": "1"},
                    server="puretv-" + uuid.uuid4().hex[:12] + ".local.",
                )
                client.register_service(service, allow_name_change=True)
                service_name = service.name.removesuffix("." + kind)
        except (ImportError, OSError, RuntimeError) as exc:
            print(
                "mDNS discovery unavailable: " + str(exc), file=sys.stderr, flush=True
            )
            service = None
        yield service_name, service is not None
    finally:
        if client:
            try:
                if service:
                    client.unregister_service(service)
            finally:
                client.close()


class GamePage(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def log_message(self, *_):
        pass

    def reply(self, content, mime):
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        if (
            self.headers.get("Host") != self.server.authority
            or self.headers.get("Sec-Fetch-Site") == "cross-site"
        ):
            self.send_error(403)
            return
        path = unquote(urlsplit(self.path).path)
        if path == "/__puretv/bridge.js":
            self.reply(self.server.bridge, "application/javascript")
            return
        if path == "/__puretv/events":
            self.events()
            return
        if path == "/":
            path = "/tv.html"
        if (
            not path.startswith("/")
            or ".." in PurePosixPath(path).parts
            or "\\" in path
            or path.startswith("//")
        ):
            self.send_error(404)
            return
        try:
            data = self.server.archive.read("assets" + path)
        except KeyError:
            self.send_error(404)
            return
        if path == "/tv.html":
            data = self.server.html
        mime = {
            ".js": "application/javascript",
            ".mjs": "application/javascript",
            ".wasm": "application/wasm",
            ".glb": "model/gltf-binary",
        }.get(PurePosixPath(path).suffix)
        self.reply(
            data, mime or mimetypes.guess_type(path)[0] or "application/octet-stream"
        )

    def events(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        rev = -1
        try:
            self.wfile.write(b": pureTV controller stream\n\n")
            self.wfile.flush()
            while not self.server.stopped.is_set():
                room = self.server.room
                with room.condition:
                    room.condition.wait_for(
                        lambda: room.revision != rev or self.server.stopped.is_set(),
                        timeout=4,
                    )
                    state = room.sample()
                payload = b": heartbeat\n\n"
                if state["revision"] != rev:
                    rev = state["revision"]
                    payload = (
                        "data: " + json.dumps(state, separators=(",", ":")) + "\n\n"
                    ).encode()
                self.wfile.write(payload)
                self.wfile.flush()
        except OSError:
            pass


@contextlib.contextmanager
def listen(factory, address, preferred, fallback):
    try:
        server = factory((address, preferred))
    except OSError:
        if not fallback or not preferred:
            raise
        server = factory((address, 0))
    try:
        yield server
    finally:
        server.server_close()


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--apk", type=Path, required=True)
    p.add_argument("--game", required=True)
    p.add_argument("--no-browser", action="store_true")
    p.add_argument("--language", choices=["zh", "en"], default="zh")
    p.add_argument("--http-port", type=int)
    p.add_argument("--controller-port", type=int, default=63485)
    args = p.parse_args(argv)
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,70}", args.game):
        p.error("invalid game ID")
    if any(
        n is not None and not 0 <= n <= 65535
        for n in (args.controller_port, args.http_port)
    ):
        p.error("invalid port")
    try:
        with contextlib.ExitStack() as stack:
            archive = stack.enter_context(ZipFile(args.apk))
            original = archive.read("assets/tv.html").decode("utf-8-sig")
            entry, n = re.subn(
                r"<head(?:\s[^>]*)?>",
                lambda m: m.group() + '<script src="/__puretv/bridge.js"></script>',
                original,
                count=1,
                flags=re.I,
            )
            if not n:
                raise ValueError("APK assets/tv.html has no head element")
            room = Room(
                2 if args.game in ALIASES and args.game != "alien-shooter" else 1
            )
            pads = stack.enter_context(
                listen(
                    lambda addr: Pads(addr, PadHandler),
                    "0.0.0.0",
                    args.controller_port,
                    True,
                )
            )
            pads.room = room
            http_port = (
                34000
                + int.from_bytes(hashlib.sha256(args.game.encode()).digest()[:2], "big")
                % 24000
                if args.http_port is None
                else args.http_port
            )
            web = stack.enter_context(
                listen(
                    lambda addr: http.server.ThreadingHTTPServer(addr, GamePage),
                    "127.0.0.1",
                    http_port,
                    args.http_port is None,
                )
            )
            web.authority = f"127.0.0.1:{web.server_port}"
            ips = addresses()
            name, advertised = stack.enter_context(
                discovery(args.game, ips, pads.server_address[1])
            )
            info = dict(
                platform="pc",
                language=args.language,
                url="",
                qr="",
                addresses=ips,
                wifiController=dict(
                    state="available" if advertised else "unavailable",
                    version="1",
                    serviceType="_puretv._tcp",
                    serviceName=name,
                    addresses=ips,
                    port=pads.server_address[1],
                    inputEnabled=True,
                ),
            )
            config = dict(
                info=info,
                alias=ALIASES.get(args.game),
                gameKit=args.game in {"neon-rush", "tower-overlap"},
            )
            web.bridge = (
                "const pureTVPCConfig=" + json.dumps(config, ensure_ascii=True) + ";\n"
            ).encode() + Path(__file__).with_name("pc-bridge.js").read_bytes()
            web.archive, web.html, web.room, web.stopped = (
                archive,
                entry.encode(),
                room,
                threading.Event(),
            )
            threading.Thread(target=pads.serve_forever, daemon=True).start()
            stack.callback(pads.shutdown)
            url = "http://" + web.authority + "/tv.html"
            print("Game: " + url, flush=True)
            print(
                "Controller: TCP "
                + str(pads.server_address[1])
                + " ("
                + ", ".join(ips)
                + ")",
                flush=True,
            )
            if not args.no_browser:
                webbrowser.open(url)
            try:
                web.serve_forever()
            except KeyboardInterrupt:
                pass
            finally:
                web.stopped.set()
                with room.condition:
                    room.condition.notify_all()
        return 0
    except (BadZipFile, OSError, KeyError, ValueError) as e:
        print("pureTV PC: " + str(e), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
