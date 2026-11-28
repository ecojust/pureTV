//! One LAN receiver for the active game. Wire format is shared with puretv-joystick.
mod websocket;

use mdns_sd::{ServiceDaemon, ServiceInfo};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use socket2::{Domain, Socket, Type};
use std::io::{self, Read, Write};
use std::net::{Ipv4Addr, SocketAddrV4, TcpListener, TcpStream};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

const PORT: u16 = 63485;
pub const KEYS: [&str; 9] = ["UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"];
const MAX_LINE: usize = 1024;
const IDLE_LIMIT: Duration = Duration::from_secs(15);

#[derive(Deserialize)]
struct Message {
    #[serde(rename = "type")]
    kind: String,
    seq: u64,
    controller_id: String,
    key: Option<String>,
    pressed: Option<bool>,
    action: Option<String>,
    #[serde(default, rename = "duration_ms")]
    _duration: u64,
}

#[derive(Default)]
struct Seat {
    controller: String,
    owner: Option<u64>,
    epoch: u64,
    sequence: Option<u64>,
    held: [bool; 9],
    blocked: [bool; 9],
    counts: [u64; 9],
}

impl Seat {
    fn button(&mut self, msg: &Message) -> Result<bool, &'static str> {
        let key = KEYS
            .iter()
            .position(|key| Some(*key) == msg.key.as_deref())
            .ok_or("invalid_key")?;
        let pressed = msg.pressed.ok_or("invalid_button")?;
        let action = msg.action.as_deref().ok_or("invalid_button")?;
        match (action, pressed) {
            ("sync", _)
            | ("down" | "long_press", true)
            | ("up" | "tap" | "long_release", false) => (),
            _ => return Err("invalid_button"),
        }
        if pressed == self.held[key] {
            return Ok(false);
        }
        self.held[key] = pressed;
        if action == "down" {
            self.counts[key] += 1;
        }
        // A held action observed during reconnect is not a new button press.
        self.blocked[key] = pressed && (action == "long_press" || (action == "sync" && key >= 4));
        Ok(true)
    }

    fn snapshot(&self, number: usize) -> Value {
        let mut buttons = serde_json::Map::new();
        let mut counters = serde_json::Map::new();
        for (i, key) in KEYS.iter().enumerate() {
            buttons.insert(key.to_string(), json!(self.held[i] && !self.blocked[i]));
            counters.insert(key.to_string(), json!(self.counts[i]));
        }
        json!({
            "id": number, "connected": self.owner.is_some(), "controllerId": self.controller,
            "session": self.epoch.to_string(), "transport": "wifi", "inputActive": true,
            "cancelSeq": self.epoch, "buttons": buttons, "buttonCounters": counters
        })
    }
}

struct Room {
    session: String,
    revision: u64,
    seats: Vec<Seat>,
}

impl Room {
    fn handle(&mut self, connection: u64, msg: &Message) -> Result<(), &'static str> {
        let id = &msg.controller_id;
        if id.is_empty()
            || id.len() > 96
            || !id.as_bytes()[0].is_ascii_alphanumeric()
            || !id
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b":._-".contains(&b))
            || msg.seq > (1u64 << 53) - 1
        {
            return Err("invalid_message");
        }
        let assigned = self
            .seats
            .iter()
            .position(|seat| seat.owner == Some(connection));
        let seat = match assigned {
            Some(index) if self.seats[index].controller == *id => &mut self.seats[index],
            Some(_) => return Err("identity_changed"),
            None if msg.kind == "hello" => {
                let index = self
                    .seats
                    .iter()
                    .position(|seat| seat.controller == *id)
                    .or_else(|| self.seats.iter().position(|seat| seat.owner.is_none()))
                    .ok_or("controller_busy")?;
                let seat = &mut self.seats[index];
                *seat = Seat {
                    owner: Some(connection),
                    epoch: seat.epoch + 1,
                    controller: id.clone(),
                    ..Seat::default()
                };
                self.revision += 1;
                seat
            }
            None => return Err("hello_required"),
        };
        if seat.sequence.is_some_and(|last| msg.seq <= last) {
            return Ok(());
        }
        match msg.kind.as_str() {
            "hello" | "ping" => (),
            "button" => self.revision += u64::from(seat.button(msg)?),
            _ => return Err("invalid_message"),
        }
        seat.sequence = Some(msg.seq);
        Ok(())
    }

    fn leave(&mut self, connection: u64) {
        if let Some(seat) = self
            .seats
            .iter_mut()
            .find(|seat| seat.owner == Some(connection))
        {
            seat.owner = None;
            seat.held.fill(false);
            seat.blocked.fill(false);
            seat.epoch += 1;
            self.revision += 1;
        }
    }

    fn snapshot(&self) -> Value {
        let players: Vec<_> = self
            .seats
            .iter()
            .enumerate()
            .filter(|(_, s)| !s.controller.is_empty())
            .map(|(i, s)| s.snapshot(i + 1))
            .collect();
        json!({"session": self.session, "revision": self.revision, "inputEnabled": true,
            "connections": self.seats.iter().filter(|s| s.owner.is_some()).count(), "players": players})
    }
}

struct Peer {
    id: u64,
    socket: TcpStream,
    buffer: Vec<u8>,
    last_message: Instant,
    joined: bool,
}

impl Peer {
    fn poll(&mut self, room: &mut Room) -> io::Result<()> {
        if self.last_message.elapsed() >= IDLE_LIMIT
            || (self.joined && !room.seats.iter().any(|s| s.owner == Some(self.id)))
        {
            return Err(io::ErrorKind::ConnectionAborted.into());
        }
        let mut input = [0; 2048];
        let n = match self.socket.read(&mut input) {
            Ok(0) => return Err(io::ErrorKind::UnexpectedEof.into()),
            Ok(n) => n,
            Err(e) if e.kind() == io::ErrorKind::WouldBlock => return Ok(()),
            Err(e) => return Err(e),
        };
        for part in input[..n].split_inclusive(|byte| *byte == b'\n') {
            if self.buffer.len() + part.len() > MAX_LINE {
                return Err(io::ErrorKind::InvalidData.into());
            }
            self.buffer.extend(part);
            if self.buffer.last() != Some(&b'\n') {
                continue;
            }
            let parsed: Result<Message, _> = serde_json::from_slice(&self.buffer);
            self.buffer.clear();
            let result = parsed.map_err(|_| "invalid_json").and_then(|msg| {
                room.handle(self.id, &msg)?;
                Ok(msg.seq)
            });
            match result {
                Ok(seq) => {
                    self.joined = true;
                    self.last_message = Instant::now();
                    self.socket
                        .write_all(format!("{{\"type\":\"ack\",\"seq\":{seq}}}\n").as_bytes())?;
                }
                Err(error) => {
                    writeln!(self.socket, "{}", json!({"type":"error", "message":error}))?;
                    return Err(io::ErrorKind::InvalidData.into());
                }
            }
        }
        Ok(())
    }
}

#[derive(Clone, Serialize)]
pub struct Info {
    pub port: u16,
    pub session: String,
    pub addresses: Vec<String>,
    pub discovery: bool,
    #[serde(rename = "webSocketUrl", skip_serializing_if = "Option::is_none")]
    pub web_socket_url: Option<String>,
    #[serde(rename = "localGameId", skip_serializing_if = "Option::is_none")]
    pub local_game_id: Option<String>,
}

struct Discovery {
    daemon: ServiceDaemon,
    fullname: String,
}

impl Discovery {
    fn announce(info: &Info) -> Option<Self> {
        if info.addresses.is_empty() {
            return None;
        }
        let name = format!("pureTV-Manager-{}", &info.session[..8]);
        let svc = ServiceInfo::new(
            "_puretv._tcp.local.",
            &name,
            &format!("{name}.local."),
            info.addresses.join(","),
            info.port,
            &[("version", "1")][..],
        )
        .ok()?;
        let fullname = svc.get_fullname().to_owned();
        let daemon = ServiceDaemon::new().ok()?;
        if daemon.register(svc).is_err() {
            let _ = daemon.shutdown();
            return None;
        }
        Some(Self { daemon, fullname })
    }
}

impl Drop for Discovery {
    fn drop(&mut self) {
        let _ = self.daemon.unregister(&self.fullname);
        let _ = self.daemon.shutdown();
    }
}

pub struct Server {
    pub info: Info,
    room: Arc<Mutex<Room>>,
    browser: Option<Arc<Mutex<websocket::BrowserSocket>>>,
    stop: std::sync::mpsc::Sender<()>,
    worker: Option<JoinHandle<()>>,
    _discovery: Option<Discovery>,
}

impl Server {
    pub fn start(
        players: usize,
        addresses: Vec<String>,
        local_game: Option<(&str, &str)>,
        publish: impl Fn(Value) + Send + 'static,
    ) -> Result<Self, String> {
        Self::listen(players, addresses, PORT, local_game, publish)
    }

    fn listen(
        players: usize,
        addresses: Vec<String>,
        port: u16,
        local_game: Option<(&str, &str)>,
        publish: impl Fn(Value) + Send + 'static,
    ) -> Result<Self, String> {
        if !(1..=2).contains(&players) {
            return Err("invalid player count".into());
        }
        // Permit immediate replay after stopping. On Windows SO_REUSEADDR would allow competing listeners.
        let socket = Socket::new(Domain::IPV4, Type::STREAM, None).map_err(|e| e.to_string())?;
        #[cfg(unix)]
        socket.set_reuse_address(true).map_err(|e| e.to_string())?;
        let bind = |port| socket.bind(&SocketAddrV4::new(Ipv4Addr::UNSPECIFIED, port).into());
        if let Err(error) = bind(port) {
            // Windows also reports WSAEACCES for ports held by an exclusive listener.
            if port == 0
                || !(error.kind() == io::ErrorKind::AddrInUse
                    || (cfg!(windows) && error.raw_os_error() == Some(10013)))
            {
                return Err(format!("TCP {port}: {error}"));
            }
            bind(0).map_err(|e| e.to_string())?;
        }
        socket.listen(8).map_err(|e| e.to_string())?;
        socket.set_nonblocking(true).map_err(|e| e.to_string())?;
        let listener: TcpListener = socket.into();
        let port = listener.local_addr().map_err(|e| e.to_string())?.port();
        let mut bytes = [0u8; 8];
        getrandom::fill(&mut bytes).map_err(|e| e.to_string())?;
        let session = format!("{:016x}", u64::from_be_bytes(bytes));
        let mut info = Info {
            port,
            addresses,
            session: session.clone(),
            discovery: false,
            web_socket_url: None,
            local_game_id: local_game.map(|(id, _)| id.to_owned()),
        };
        let discovery = Discovery::announce(&info);
        info.discovery = discovery.is_some();
        let room = Arc::new(Mutex::new(Room {
            session,
            revision: 0,
            seats: (0..players).map(|_| Seat::default()).collect(),
        }));
        let browser = local_game
            .map(|(_, origin)| {
                websocket::BrowserSocket::start(origin, room.lock().unwrap().snapshot())
            })
            .transpose()?;
        info.web_socket_url = browser.as_ref().map(|b| b.url.clone());
        let browser = browser.map(|b| Arc::new(Mutex::new(b)));
        let subscribers = browser.clone();
        let state = room.clone();
        let (stop, stopping) = std::sync::mpsc::channel();
        let worker = thread::Builder::new()
            .name("game-controllers".into())
            .spawn(move || {
                let mut peers: Vec<Peer> = Vec::new();
                let mut next_id: u64 = 0;
                loop {
                    if let Ok((socket, _)) = listener.accept() {
                        if peers.len() < 8 && socket.set_nonblocking(true).is_ok() {
                            let _ = socket.set_nodelay(true);
                            next_id += 1;
                            peers.push(Peer {
                                id: next_id,
                                socket,
                                buffer: Vec::new(),
                                last_message: Instant::now(),
                                joined: false,
                            });
                        }
                    }
                    let changed = {
                        let mut room = state.lock().unwrap();
                        let revision = room.revision;
                        peers.retain_mut(|peer| {
                            if peer.poll(&mut room).is_ok() {
                                return true;
                            }
                            room.leave(peer.id);
                            false
                        });
                        (revision != room.revision).then(|| room.snapshot())
                    };
                    if let Some(ref subscribers) = subscribers {
                        let mut subscribers = subscribers.lock().unwrap();
                        if let Some(ref snapshot) = changed {
                            subscribers.publish(snapshot.clone());
                        }
                        subscribers.poll();
                    }
                    if let Some(snapshot) = changed {
                        publish(snapshot);
                    }
                    if !matches!(
                        stopping.recv_timeout(Duration::from_millis(6)),
                        Err(std::sync::mpsc::RecvTimeoutError::Timeout)
                    ) {
                        break;
                    }
                }
            })
            .map_err(|e| e.to_string())?;
        Ok(Self {
            info,
            room,
            browser,
            stop,
            worker: Some(worker),
            _discovery: discovery,
        })
    }

    pub fn snapshot(&self) -> Value {
        let mut state = self.room.lock().unwrap().snapshot();
        if let Some(ref browser) = self.browser {
            state["webSocketClients"] = json!(browser.lock().unwrap().count());
            state["localGameId"] = json!(self.info.local_game_id);
        }
        state
    }

    /// Exercise the same socket, seat assignment and state broadcast as a wireless pad.
    pub fn test_button(&self, session: &str, key: &str) -> Result<Value, String> {
        use std::io::{BufRead, BufReader};
        if session != self.info.session || self.browser.is_none() {
            return Err("Local game controller session is no longer active".into());
        }
        if !KEYS.contains(&key) {
            return Err("Invalid controller key".into());
        }
        let mut random = [0u8; 16];
        getrandom::fill(&mut random).map_err(|e| e.to_string())?;
        let id = format!("mcp-test-{:032x}", u128::from_be_bytes(random));
        let timeout = Duration::from_secs(2);
        let address = SocketAddrV4::new(Ipv4Addr::LOCALHOST, self.info.port);
        let stream =
            TcpStream::connect_timeout(&address.into(), timeout).map_err(|e| e.to_string())?;
        stream
            .set_read_timeout(Some(timeout))
            .map_err(|e| e.to_string())?;
        stream
            .set_write_timeout(Some(timeout))
            .map_err(|e| e.to_string())?;
        let mut pad = BufReader::new(stream);
        let mut send = |seq: u64, mut msg: Value| -> Result<(), String> {
            msg["controller_id"] = json!(id);
            msg["seq"] = json!(seq);
            writeln!(pad.get_mut(), "{msg}").map_err(|e| e.to_string())?;
            let mut line = String::new();
            pad.read_line(&mut line).map_err(|e| e.to_string())?;
            let reply: Value = serde_json::from_str(&line).map_err(|e| e.to_string())?;
            if reply["type"] == "ack" && reply["seq"] == seq {
                Ok(())
            } else {
                Err(reply["message"]
                    .as_str()
                    .unwrap_or("Missing controller acknowledgement")
                    .into())
            }
        };
        send(1, json!({"type":"hello"}))?;
        send(
            2,
            json!({"type":"button","key":key,"pressed":true,"action":"down"}),
        )?;
        let after_press = self.snapshot();
        send(
            3,
            json!({"type":"button","key":key,"pressed":false,"action":"up"}),
        )?;
        let after_release = self.snapshot();
        Ok(
            json!({"controllerId":id,"key":key,"afterPress":after_press,"afterRelease":after_release}),
        )
    }
}

impl Drop for Server {
    fn drop(&mut self) {
        let _ = self.stop.send(());
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{BufRead, BufReader};

    struct Pad(BufReader<TcpStream>);

    impl Pad {
        fn connect(port: u16) -> Self {
            let socket = TcpStream::connect((Ipv4Addr::LOCALHOST, port)).unwrap();
            socket
                .set_read_timeout(Some(Duration::from_secs(3)))
                .unwrap();
            Self(BufReader::new(socket))
        }
        fn send(&mut self, json: Value) -> Value {
            writeln!(self.0.get_mut(), "{json}").unwrap();
            let mut line = String::new();
            self.0.read_line(&mut line).unwrap();
            serde_json::from_str(&line).unwrap()
        }
        fn join(&mut self, id: &str) -> Value {
            self.send(json!({"type":"hello","seq":1,"controller_id":id}))
        }
        fn button(&mut self, seq: u64, key: &str, pressed: bool, action: &str) -> Value {
            self.send(
                json!({"type":"button","seq":seq,"controller_id":"pad-1","key":key,
                "action":action,"pressed":pressed,"duration_ms":0}),
            )
        }
    }

    #[test]
    fn two_controllers_quick_taps_reconnect_and_shutdown() {
        let (tx, events) = std::sync::mpsc::channel();
        let server = Server::listen(2, vec![], 0, None, move |state| {
            let _ = tx.send(state);
        })
        .unwrap();
        let port = server.info.port;
        let mut p1 = Pad::connect(port);
        let mut p2 = Pad::connect(port);
        assert_eq!(p1.join("pad-1"), json!({"type":"ack","seq":1}));
        assert_eq!(p2.join("pad-2")["type"], "ack");
        assert_eq!(
            Pad::connect(port).join("pad-3")["message"],
            "controller_busy"
        );
        assert_eq!(p1.button(2, "A", true, "down")["seq"], 2);
        assert_eq!(p1.button(3, "A", false, "tap")["seq"], 3);
        p1.button(2, "A", true, "down");
        let state = server.snapshot();
        assert_eq!(state["connections"], 2);
        assert_eq!(state["players"][0]["buttons"]["A"], false);
        assert_eq!(state["players"][0]["buttonCounters"]["A"], 1);
        let mut rejoined = Pad::connect(port);
        assert_eq!(rejoined.join("pad-1")["type"], "ack");
        rejoined.button(2, "A", true, "sync");
        rejoined.button(3, "RIGHT", true, "sync");
        let state = server.snapshot();
        assert_eq!(state["players"][0]["buttons"]["A"], false);
        assert_eq!(state["players"][0]["buttons"]["RIGHT"], true);
        assert_eq!(state["players"][0]["buttonCounters"]["A"], 0);
        assert_eq!(state["players"][1]["controllerId"], "pad-2");
        drop(rejoined);
        loop {
            let sample = events.recv_timeout(Duration::from_secs(3)).unwrap();
            if sample["players"][0]["connected"] == false {
                assert_eq!(sample["players"][0]["buttons"]["RIGHT"], false);
                assert_eq!(sample["players"][1]["connected"], true);
                break;
            }
        }
        drop(server);
        assert!(TcpStream::connect((Ipv4Addr::LOCALHOST, port)).is_err());
    }

    #[test]
    fn browser_receives_test_pad_over_the_real_socket() {
        use tungstenite::client::IntoClientRequest;
        let origin = "http://127.0.0.1:48735";
        let server = Server::listen(1, vec![], 0, Some(("custom", origin)), |_| {}).unwrap();
        let url = server.info.web_socket_url.clone().unwrap();
        let request = |url: &str, source: &str| {
            let mut req = url.into_client_request().unwrap();
            req.headers_mut().insert("Origin", source.parse().unwrap());
            req
        };
        assert!(tungstenite::connect(request(&url, "https://other.example")).is_err());
        assert!(tungstenite::connect(request(&(url.clone() + "x"), origin)).is_err());
        let req = request(&url, origin);
        let stream = TcpStream::connect(req.uri().authority().unwrap().as_str()).unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(3)))
            .unwrap();
        let (mut ws, _) = tungstenite::client(req, stream).unwrap();
        let mut state = || {
            let event: Value = serde_json::from_str(ws.read().unwrap().to_text().unwrap()).unwrap();
            assert_eq!(event["type"], "puretv:controller-state");
            event["state"].clone()
        };
        assert_eq!(state()["connections"], 0);
        assert_eq!(server.snapshot()["webSocketClients"], 1);
        let session = &server.info.session;
        assert!(server.test_button("old-session", "A").is_err());
        assert!(server.test_button(session, "Z").is_err());
        let tested = server.test_button(session, "A").unwrap();
        assert_eq!(tested["afterPress"]["players"][0]["buttons"]["A"], true);
        assert_eq!(tested["afterRelease"]["players"][0]["buttons"]["A"], false);
        let joined = state();
        assert_eq!(joined["players"][0]["controllerId"], tested["controllerId"]);
        let down = state();
        assert_eq!(down["players"][0]["buttons"]["A"], true);
        let up = state();
        assert_eq!(up["players"][0]["buttons"]["A"], false);
        assert_eq!(up["players"][0]["buttonCounters"]["A"], 1);
        assert_eq!(state()["connections"], 0);
        let mut real_pad = Pad::connect(server.info.port);
        assert_eq!(real_pad.join("physical")["type"], "ack");
        assert_eq!(state()["connections"], 1);
        assert_eq!(
            server.test_button(session, "A").unwrap_err(),
            "controller_busy"
        );
        assert_eq!(server.snapshot()["players"][0]["controllerId"], "physical");
    }

    #[test]
    fn preferred_port_busy_reports_the_actual_listener() {
        let occupied = TcpListener::bind((Ipv4Addr::UNSPECIFIED, 0)).unwrap();
        let preferred = occupied.local_addr().unwrap().port();
        let server = Server::listen(1, vec![], preferred, None, |_| {}).unwrap();
        assert_ne!(server.info.port, preferred);
        let mut pad = Pad::connect(server.info.port);
        assert_eq!(pad.join("pad-1")["type"], "ack");
        assert_eq!(pad.button(2, "A", false, "down")["type"], "error");
        assert_eq!(server.snapshot()["connections"], 0);
    }
}
