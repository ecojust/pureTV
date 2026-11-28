//! Read-only, session-scoped browser subscribers for an imported game's controller room.
use serde_json::{json, Value};
use std::{
    io::ErrorKind,
    net::{Ipv4Addr, Shutdown, TcpListener, TcpStream},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{sync_channel, RecvTimeoutError, SyncSender},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::Duration,
};
use tungstenite::{
    handshake::server::{ErrorResponse, Request, Response},
    protocol::WebSocketConfig,
    Message,
};

const MAX_VIEWERS: usize = 4;

struct Feed {
    latest: Value,
    viewers: Vec<(u64, SyncSender<Value>)>,
}

pub(super) struct BrowserSocket {
    pub(super) url: String,
    listener: TcpListener,
    origin: String,
    path: String,
    host: String,
    feed: Arc<Mutex<Feed>>,
    stopping: Arc<AtomicBool>,
    workers: Vec<(TcpStream, JoinHandle<()>)>,
    next_viewer: u64,
}

impl BrowserSocket {
    pub(super) fn start(origin: &str, initial: Value) -> Result<Self, String> {
        if !(48735..=48738).any(|port| origin == format!("http://127.0.0.1:{port}")) {
            return Err("Invalid local game origin".into());
        }
        let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).map_err(|e| e.to_string())?;
        listener.set_nonblocking(true).map_err(|e| e.to_string())?;
        let host = listener
            .local_addr()
            .map_err(|e| e.to_string())?
            .to_string();
        let mut bytes = [0; 16];
        getrandom::fill(&mut bytes).map_err(|e| e.to_string())?;
        let path = format!("/controller/{:032x}", u128::from_be_bytes(bytes));
        Ok(Self {
            url: format!("ws://{host}{path}"),
            listener,
            origin: origin.into(),
            path,
            host,
            feed: Arc::new(Mutex::new(Feed {
                latest: initial,
                viewers: Vec::new(),
            })),
            stopping: Arc::new(AtomicBool::new(false)),
            workers: Vec::new(),
            next_viewer: 0,
        })
    }

    pub(super) fn count(&self) -> usize {
        self.feed.lock().unwrap().viewers.len()
    }

    pub(super) fn publish(&self, state: Value) {
        let mut feed = self.feed.lock().unwrap();
        // Disconnect a slow viewer rather than blocking controller input.
        feed.viewers
            .retain(|(_, tx)| tx.try_send(state.clone()).is_ok());
        feed.latest = state;
    }

    pub(super) fn poll(&mut self) {
        self.workers.retain(|(_, worker)| !worker.is_finished());
        let Ok((stream, _)) = self.listener.accept() else {
            return;
        };
        if self.workers.len() >= MAX_VIEWERS {
            return;
        }
        let Ok(control) = stream.try_clone() else {
            return;
        };
        self.next_viewer += 1;
        let id = self.next_viewer;
        let (host, path, origin) = (self.host.clone(), self.path.clone(), self.origin.clone());
        let feed = Arc::clone(&self.feed);
        let stopping = Arc::clone(&self.stopping);
        if let Ok(worker) = thread::Builder::new()
            .name("local-game-websocket".into())
            .spawn(move || {
                serve(stream, &host, &path, &origin, id, &feed, &stopping);
                feed.lock().unwrap().viewers.retain(|(n, _)| *n != id);
            })
        {
            self.workers.push((control, worker));
        }
    }
}

impl Drop for BrowserSocket {
    fn drop(&mut self) {
        self.stopping.store(true, Ordering::Release);
        for (control, worker) in self.workers.drain(..) {
            let _ = control.shutdown(Shutdown::Both);
            let _ = worker.join();
        }
    }
}

fn serve(
    stream: TcpStream,
    host: &str,
    path: &str,
    origin: &str,
    id: u64,
    feed: &Mutex<Feed>,
    stopping: &AtomicBool,
) {
    let timeout = Some(Duration::from_secs(1));
    if stream.set_read_timeout(timeout).is_err() || stream.set_write_timeout(timeout).is_err() {
        return;
    }
    let verify = |req: &Request, response: Response| {
        if req.uri().path_and_query().map(|v| v.as_str()) == Some(path)
            && req.headers().get("Host").and_then(|v| v.to_str().ok()) == Some(host)
            && req.headers().get("Origin").and_then(|v| v.to_str().ok()) == Some(origin)
        {
            Ok(response)
        } else {
            let mut error = ErrorResponse::new(None);
            *error.status_mut() = tungstenite::http::StatusCode::FORBIDDEN;
            Err(error)
        }
    };
    let config = WebSocketConfig::default()
        .max_message_size(Some(1024))
        .max_frame_size(Some(1024));
    let Ok(mut ws) = tungstenite::accept_hdr_with_config(stream, verify, Some(config)) else {
        return;
    };
    if ws.get_mut().set_nonblocking(true).is_err() {
        return;
    }
    let _ = ws.get_mut().set_nodelay(true);
    let (tx, rx) = sync_channel(64);
    {
        let mut feed = feed.lock().unwrap();
        let _ = tx.try_send(feed.latest.clone());
        feed.viewers.push((id, tx));
    }
    while !stopping.load(Ordering::Acquire) {
        match rx.recv_timeout(Duration::from_millis(16)) {
            Ok(state) => {
                let event = json!({"type":"puretv:controller-state","state":state});
                if ws.send(Message::text(event.to_string())).is_err() {
                    break;
                }
            }
            Err(RecvTimeoutError::Disconnected) => break,
            Err(RecvTimeoutError::Timeout) => (),
        }
        match ws.read() {
            Ok(Message::Ping(_)) => {
                if ws.flush().is_err() {
                    break;
                }
            }
            Ok(Message::Pong(_)) => (),
            Err(tungstenite::Error::Io(e)) if e.kind() == ErrorKind::WouldBlock => (),
            _ => break,
        }
    }
    let _ = ws.close(None);
}
