//! Serve the downloaded game's web assets on a separate, stable loopback origin.
//! Desktop overlays and TV package assembly share the same cached web files.
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex, RwLock};
use tauri::Manager;
use tiny_http::{Header, Method, Request, Response, Server};
const PORTS: [u16; 4] = [48731, 48732, 48733, 48734];
const GAME_CSP: &str = "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'none'";

#[derive(Default)]
pub struct Player(Mutex<Option<GameServer>>);

struct MountedGame {
    id: String,
    root: PathBuf,
}

struct GameServer {
    origin: String,
    mounts: Arc<RwLock<HashMap<String, Arc<MountedGame>>>>,
}

#[tauri::command]
pub async fn local_game_base(
    game_id: String,
    app: tauri::AppHandle,
    player: tauri::State<'_, Player>,
) -> Result<String, String> {
    let directory = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let preference = directory.join("game-player-port");
    let id = game_id.clone();
    let root = tauri::async_runtime::spawn_blocking(move || {
        crate::offline_game_library::ensure(&directory, &id, &AtomicBool::new(false))
    })
    .await
    .map_err(|e| e.to_string())??;
    player.mount(game_id, root, &preference)
}

impl Player {
    fn mount(&self, game_id: String, root: PathBuf, preference: &Path) -> Result<String, String> {
        let mut running = self.0.lock().map_err(|_| "本地游戏资源暂不可用。")?;
        let server = match running.as_ref() {
            Some(server) => server,
            None => running.insert(start(preference)?),
        };
        let mut mounts = server
            .mounts
            .write()
            .map_err(|_| "本地游戏资源暂不可用。")?;
        if let Some((token, _)) = mounts
            .iter()
            .find(|(_, m)| m.id == game_id && m.root == root)
        {
            return Ok(format!("{}/games/{token}/", server.origin));
        }
        // Each mounted revision serves its own overlay, project and shared scripts together.
        let mut secret = [0; 16];
        getrandom::fill(&mut secret).map_err(|e| e.to_string())?;
        let token: String = secret.iter().map(|byte| format!("{byte:02x}")).collect();
        mounts.insert(token.clone(), Arc::new(MountedGame { id: game_id, root }));
        Ok(format!("{}/games/{token}/", server.origin))
    }
}

fn start(preference: &Path) -> Result<GameServer, String> {
    // Local storage belongs to the game's origin. Keep the last usable port on restart.
    let preferred = std::fs::read_to_string(preference)
        .ok()
        .and_then(|value| value.trim().parse::<u16>().ok())
        .filter(|port| PORTS.contains(port));
    let ports = preferred
        .into_iter()
        .chain(PORTS.into_iter().filter(|port| Some(*port) != preferred));
    let (port, server) = ports
        .filter_map(|port| {
            Server::http(("127.0.0.1", port))
                .ok()
                .map(|server| (port, server))
        })
        .next()
        .ok_or("本地游戏资源暂不可用。")?;
    let _ = std::fs::write(preference, port.to_string());
    let address = format!("127.0.0.1:{port}");
    let server = Arc::new(server);
    let mounts = Arc::new(RwLock::new(HashMap::new()));
    for _ in 0..4 {
        let server = Arc::clone(&server);
        let mounts = Arc::clone(&mounts);
        let address = address.clone();
        std::thread::spawn(move || {
            for request in server.incoming_requests() {
                serve(request, &mounts, &address);
            }
        });
    }
    Ok(GameServer {
        origin: format!("http://{address}"),
        mounts,
    })
}

fn asset(game: &MountedGame, relative: &str) -> Option<Vec<u8>> {
    if relative
        .split_once('/')
        .is_some_and(|(id, _)| id != game.id)
    {
        return None;
    }
    let file = game.root.join("web").join(relative);
    std::fs::symlink_metadata(&file)
        .ok()?
        .is_file()
        .then(|| std::fs::read(file).ok())
        .flatten()
}

fn mime(path: &str) -> &'static str {
    match path.rsplit('.').next().unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "application/javascript",
        "css" => "text/css",
        "json" => "application/json",
        "webmanifest" => "application/manifest+json",
        "png" => "image/png",
        "webp" => "image/webp",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "mp3" => "audio/mpeg",
        "ogg" | "opus" => "audio/ogg",
        "m4a" => "audio/mp4",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "wasm" => "application/wasm",
        "glb" => "model/gltf-binary",
        "md" | "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

fn header(name: &'static str, value: &str) -> Header {
    Header::from_bytes(name, value).expect("valid game response header")
}

// Media elements request closed, open-ended and suffix byte ranges.
fn byte_range(value: &str, len: usize) -> Option<(usize, usize)> {
    let (first, last) = value.strip_prefix("bytes=")?.split_once('-')?;
    if len == 0 {
        return None;
    }
    if first.is_empty() {
        let suffix = last.parse::<usize>().ok()?;
        return (suffix > 0).then(|| (len.saturating_sub(suffix), len - 1));
    }
    let start = first.parse::<usize>().ok()?;
    let end = if last.is_empty() {
        len - 1
    } else {
        last.parse::<usize>().ok()?.min(len - 1)
    };
    (start <= end).then_some((start, end))
}

fn serve(request: Request, mounts: &RwLock<HashMap<String, Arc<MountedGame>>>, address: &str) {
    if !matches!(request.method(), Method::Get | Method::Head) {
        let _ = request.respond(Response::empty(405));
        return;
    }
    let host = request.headers().iter().find(|h| h.field.equiv("Host"));
    if !host.is_some_and(|h| h.value.as_str() == address) {
        let _ = request.respond(Response::empty(403));
        return;
    }
    let path = request.url().split('?').next().unwrap_or("");
    let Some((token, relative)) = path
        .strip_prefix("/games/")
        .and_then(|path| path.split_once('/'))
        .filter(|(_, p)| {
            !p.split('/').any(|part| matches!(part, "" | "." | ".."))
                && p.bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"./-+_()".contains(&b))
        })
    else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let game = mounts
        .read()
        .ok()
        .and_then(|mounts| mounts.get(token).cloned());
    let Some(bytes) = game.and_then(|game| asset(&game, relative)) else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let len = bytes.len();
    let mut response =
        if let Some(range) = request.headers().iter().find(|h| h.field.equiv("Range")) {
            let Some((start, end)) = byte_range(range.value.as_str(), len) else {
                let _ = request.respond(
                    Response::empty(416)
                        .with_header(header("Content-Range", &format!("bytes */{len}"))),
                );
                return;
            };
            Response::from_data(bytes[start..=end].to_vec())
                .with_status_code(206)
                .with_header(header(
                    "Content-Range",
                    &format!("bytes {start}-{end}/{len}"),
                ))
        } else {
            Response::from_data(bytes)
        };
    for (name, value) in [
        ("Content-Type", mime(relative)),
        ("Content-Security-Policy", GAME_CSP),
        ("Accept-Ranges", "bytes"),
        ("X-Content-Type-Options", "nosniff"),
        ("Referrer-Policy", "no-referrer"),
        ("Cache-Control", "no-cache"),
    ] {
        response.add_header(header(name, value));
    }
    let _ = request.respond(response);
}
