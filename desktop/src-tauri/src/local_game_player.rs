//! Serve the installed game's web assets on a separate, stable loopback origin.
//! The archive contains thin desktop overlays and the same signed APKs deployed to TVs.
use serde::Deserialize;
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufReader, Read};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tiny_http::{Header, Method, Request, Response, Server};
use zip::{
    read::{ArchiveOffset, Config},
    ZipArchive,
};

const PORTS: [u16; 4] = [48731, 48732, 48733, 48734];
const CATALOG: &str = include_str!("../../../tools/pc-games/catalog.json");
const GAME_CSP: &str = "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'none'";

#[derive(Default)]
pub struct Player(Mutex<Option<String>>);

#[tauri::command]
pub async fn local_game_base(
    app: tauri::AppHandle,
    player: tauri::State<'_, Player>,
) -> Result<String, String> {
    let player = player.inner();
    if let Some(base) = player
        .0
        .lock()
        .map_err(|_| "本地游戏资源暂不可用。")?
        .clone()
    {
        return Ok(base);
    }
    let preference = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("game-player-port");
    // Verifying the installed archive on first access can involve hundreds of MiB.
    let library =
        tauri::async_runtime::spawn_blocking(move || crate::offline_game_library::path(&app))
            .await
            .map_err(|e| e.to_string())??;
    let mut running = player.0.lock().map_err(|_| "本地游戏资源暂不可用。")?;
    if let Some(base) = running.as_ref() {
        return Ok(base.clone());
    }
    let base = start(library, &preference)?;
    *running = Some(base.clone());
    Ok(base)
}

#[derive(Deserialize)]
struct Game {
    id: String,
    url: String,
}

pub(crate) fn start(library: PathBuf, preference: &Path) -> Result<String, String> {
    let entries: Vec<Game> = serde_json::from_str(CATALOG).map_err(|e| e.to_string())?;
    let apks: HashMap<_, _> = entries
        .into_iter()
        .map(|game| {
            let filename = game.url.rsplit('/').next().unwrap_or_default();
            let member = format!("apks/{}/{filename}", game.id);
            (game.id, member)
        })
        .collect();
    let mut secret = [0; 16];
    getrandom::fill(&mut secret).map_err(|e| e.to_string())?;
    let token: String = secret.iter().map(|byte| format!("{byte:02x}")).collect();
    let prefix = format!("/games/{token}/");
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
    let base = format!("http://{address}{prefix}");
    let server = Arc::new(server);
    let mut readers = Vec::new();
    for _ in 0..4 {
        readers.push(crate::offline_game_library::open(&library)?);
    }
    let assets = Arc::new((apks, prefix, address));
    for mut archive in readers {
        let server = server.clone();
        let assets = assets.clone();
        std::thread::spawn(move || {
            for request in server.incoming_requests() {
                serve(request, &mut archive, &assets.0, &assets.1, &assets.2);
            }
        });
    }
    Ok(base)
}

fn asset(
    library: &mut ZipArchive<BufReader<File>>,
    apks: &HashMap<String, String>,
    relative: &str,
) -> Option<Vec<u8>> {
    let overlay = format!("web/{relative}");
    let mut bytes = Vec::new();
    if let Some(index) = library.index_for_name(&overlay) {
        library.by_index(index).ok()?.read_to_end(&mut bytes).ok()?;
    } else {
        let (game, name) = relative.split_once('/')?;
        let apk = library.by_name_seek(apks.get(game)?).ok()?;
        let mut archive = ZipArchive::with_config(
            Config {
                archive_offset: ArchiveOffset::Known(0),
            },
            BufReader::new(apk),
        )
        .ok()?;
        archive
            .by_name(&format!("assets/{name}"))
            .ok()?
            .read_to_end(&mut bytes)
            .ok()?;
    }
    Some(bytes)
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

fn serve(
    request: Request,
    library: &mut ZipArchive<BufReader<File>>,
    apks: &HashMap<String, String>,
    prefix: &str,
    address: &str,
) {
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
    let Some(relative) = path.strip_prefix(prefix).filter(|p| {
        !p.split('/').any(|part| matches!(part, "" | "." | ".."))
            && p.bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"./-+_()".contains(&b))
    }) else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let Some(bytes) = asset(library, apks, relative) else {
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
