//! Serve catalog downloads and user-selected folders on separate loopback origins.
use std::collections::HashMap;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex, RwLock};
use tauri::Manager;
use tiny_http::{Header, Method, Request, Response, Server};
#[derive(Clone, Copy, PartialEq)]
enum Source {
    Downloaded,
    UserFolder,
}

impl Source {
    fn ports(self) -> [u16; 4] {
        match self {
            Self::Downloaded => [48731, 48732, 48733, 48734],
            Self::UserFolder => [48735, 48736, 48737, 48738],
        }
    }
}
const PROJECT_CSP: &str = "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' data: blob: ws://127.0.0.1:*; object-src 'none'; base-uri 'self'; form-action 'none'";
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
    player.mount(game_id, root, &preference, Source::Downloaded)
}

pub(super) fn random_token() -> Result<String, String> {
    let mut secret = [0; 16];
    getrandom::fill(&mut secret).map_err(|e| e.to_string())?;
    Ok(secret.iter().map(|byte| format!("{byte:02x}")).collect())
}

impl Player {
    pub(super) fn mount_project(
        &self,
        game_id: String,
        root: PathBuf,
        preference: &Path,
    ) -> Result<String, String> {
        self.mount(game_id, root, preference, Source::UserFolder)
    }

    pub(super) fn release_project(&self, url: Option<&str>) {
        let Ok(running) = self.0.lock() else { return };
        if let Some(server) = running.as_ref() {
            if let Ok(mut mounts) = server.mounts.write() {
                mounts.retain(|token, _| {
                    url.is_some_and(|entry| {
                        entry != format!("{}/games/{token}/index.html", server.origin)
                    })
                });
            }
        }
    }

    fn mount(
        &self,
        game_id: String,
        root: PathBuf,
        preference: &Path,
        source: Source,
    ) -> Result<String, String> {
        let mut running = self.0.lock().map_err(|_| "本地游戏资源暂不可用。")?;
        let server = match running.as_ref() {
            Some(server) => server,
            None => running.insert(start(preference, source)?),
        };
        let mut mounts = server
            .mounts
            .write()
            .map_err(|_| "本地游戏资源暂不可用。")?;
        if source == Source::Downloaded {
            if let Some((token, _)) = mounts
                .iter()
                .find(|(_, m)| m.id == game_id && m.root == root)
            {
                return Ok(format!("{}/games/{token}/", server.origin));
            }
        }
        // Each mounted revision serves its own overlay, project and shared scripts together.
        let token = random_token()?;
        if source == Source::UserFolder {
            mounts.clear();
        }
        mounts.insert(token.clone(), Arc::new(MountedGame { id: game_id, root }));
        Ok(format!("{}/games/{token}/", server.origin))
    }
}

fn start(preference: &Path, source: Source) -> Result<GameServer, String> {
    // Local storage belongs to the game's origin. Keep the last usable port on restart.
    let available = source.ports();
    let preferred = std::fs::read_to_string(preference)
        .ok()
        .and_then(|value| value.trim().parse::<u16>().ok())
        .filter(|port| available.contains(port));
    let ports = preferred.into_iter().chain(
        available
            .into_iter()
            .filter(|port| Some(*port) != preferred),
    );
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
                serve(request, &mounts, &address, source);
            }
        });
    }
    Ok(GameServer {
        origin: format!("http://{address}"),
        mounts,
    })
}

// Windows resolves DOS device names independently of their directory or extension.
fn valid_project_component(part: &str) -> bool {
    if part.is_empty()
        || part.starts_with('.')
        || part.contains(['\\', ':'])
        || part.chars().any(char::is_control)
    {
        return false;
    }
    if cfg!(windows) {
        if part.ends_with(['.', ' ']) || part.contains(['<', '>', '"', '|', '?', '*']) {
            return false;
        }
        let stem = part
            .split('.')
            .next()
            .unwrap_or_default()
            .trim_end()
            .to_ascii_uppercase();
        if matches!(
            stem.as_str(),
            "CON" | "PRN" | "AUX" | "NUL" | "CONIN$" | "CONOUT$"
        ) {
            return false;
        }
        if stem
            .strip_prefix("COM")
            .or_else(|| stem.strip_prefix("LPT"))
            .is_some_and(|suffix| {
                matches!(
                    suffix,
                    "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
                )
            })
        {
            return false;
        }
    }
    true
}

fn asset(game: &MountedGame, relative: &str, source: Source) -> Option<File> {
    let file = match source {
        Source::Downloaded => {
            if relative
                .split('/')
                .any(|part| matches!(part, "" | "." | ".."))
                || !relative
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"./-+_()".contains(&b))
                || relative
                    .split_once('/')
                    .is_some_and(|(id, _)| id != game.id)
            {
                return None;
            }
            game.root.join("web").join(relative)
        }
        Source::UserFolder => {
            // Decode before checking components. In particular Windows treats backslashes
            // and drive prefixes as syntax even though the browser sends URL paths.
            let path = percent_encoding::percent_decode_str(relative)
                .decode_utf8()
                .ok()?;
            if !path.split('/').all(valid_project_component) {
                return None;
            }
            let resolved = game.root.join(path.as_ref()).canonicalize().ok()?;
            if !resolved.starts_with(&game.root) {
                return None;
            }
            resolved
        }
    };
    if !std::fs::symlink_metadata(&file).ok()?.is_file() {
        return None;
    }
    File::open(file).ok()
}

fn mime(path: &str) -> &'static str {
    let decoded = percent_encoding::percent_decode_str(path).decode_utf8_lossy();
    let extension = decoded
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase();
    match extension.as_str() {
        "htm" | "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "application/javascript",
        "css" => "text/css",
        "json" => "application/json",
        "webmanifest" => "application/manifest+json",
        "png" => "image/png",
        "avif" => "image/avif",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "ico" => "image/x-icon",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "wav" => "audio/wav",
        "woff" => "font/woff",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "mp3" => "audio/mpeg",
        "ogg" | "opus" => "audio/ogg",
        "m4a" => "audio/mp4",
        "woff2" => "font/woff2",
        "otf" => "font/otf",
        "ttf" => "font/ttf",
        "wasm" => "application/wasm",
        "gltf" => "model/gltf+json",
        "glb" => "model/gltf-binary",
        "md" | "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

fn header(name: &'static str, value: &str) -> Header {
    Header::from_bytes(name, value).expect("valid game response header")
}

// Media elements request closed, open-ended and suffix byte ranges.
fn byte_range(value: &str, len: u64) -> Option<(u64, u64)> {
    let (first, last) = value.strip_prefix("bytes=")?.split_once('-')?;
    if len == 0 {
        return None;
    }
    if first.is_empty() {
        let suffix = last.parse::<u64>().ok()?;
        return (suffix > 0).then(|| (len.saturating_sub(suffix), len - 1));
    }
    let start = first.parse::<u64>().ok()?;
    let end = if last.is_empty() {
        len - 1
    } else {
        last.parse::<u64>().ok()?.min(len - 1)
    };
    (start <= end).then_some((start, end))
}

fn serve(
    request: Request,
    mounts: &RwLock<HashMap<String, Arc<MountedGame>>>,
    address: &str,
    source: Source,
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
    let Some((token, relative)) = path
        .strip_prefix("/games/")
        .and_then(|path| path.split_once('/'))
    else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let game = mounts
        .read()
        .ok()
        .and_then(|mounts| mounts.get(token).cloned());
    let Some(mut file) = game.and_then(|game| asset(&game, relative, source)) else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let Ok(metadata) = file.metadata() else {
        let _ = request.respond(Response::empty(404));
        return;
    };
    let len = metadata.len();
    let mut response =
        if let Some(range) = request.headers().iter().find(|h| h.field.equiv("Range")) {
            let Some((start, end)) = byte_range(range.value.as_str(), len) else {
                let _ = request.respond(
                    Response::empty(416)
                        .with_header(header("Content-Range", &format!("bytes */{len}"))),
                );
                return;
            };
            if file.seek(SeekFrom::Start(start)).is_err() {
                let _ = request.respond(Response::empty(500));
                return;
            }
            let count = end - start + 1;
            Response::new(
                206.into(),
                vec![header(
                    "Content-Range",
                    &format!("bytes {start}-{end}/{len}"),
                )],
                file.take(count),
                usize::try_from(count).ok(),
                None,
            )
        } else {
            Response::new(
                200.into(),
                Vec::new(),
                file.take(len),
                usize::try_from(len).ok(),
                None,
            )
        };
    for (name, value) in [
        ("Content-Type", mime(relative)),
        (
            "Content-Security-Policy",
            if source == Source::UserFolder {
                PROJECT_CSP
            } else {
                GAME_CSP
            },
        ),
        ("Accept-Ranges", "bytes"),
        ("X-Content-Type-Options", "nosniff"),
        ("Referrer-Policy", "no-referrer"),
        ("Cache-Control", "no-cache"),
    ] {
        response.add_header(header(name, value));
    }
    let _ = request.respond(response);
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn project_http_streams_files_and_releases_only_the_matching_session() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().canonicalize().unwrap();
        std::fs::write(root.join("index.html"), "game").unwrap();
        std::fs::write(root.join("字体.WOFF2"), "font").unwrap();
        let preference = root.join("port");
        let player = Player::default();
        let base = player
            .mount_project("id".into(), root.clone(), &preference)
            .unwrap();
        let client = reqwest::blocking::Client::builder()
            .no_proxy()
            .build()
            .unwrap();
        let entry = format!("{base}index.html");
        let response = client.get(&entry).send().unwrap();
        assert_eq!(response.status(), 200);
        assert!(response.headers()["Content-Security-Policy"]
            .to_str()
            .unwrap()
            .contains("ws://127.0.0.1:*"));
        assert_eq!(response.text().unwrap(), "game");
        let font = format!("{base}%E5%AD%97%E4%BD%93.WOFF2");
        let response = client
            .get(&font)
            .header("Range", "bytes=1-2")
            .send()
            .unwrap();
        assert_eq!(response.status(), 206);
        assert_eq!(response.headers()["Content-Type"], "font/woff2");
        assert_eq!(response.text().unwrap(), "on");
        assert_eq!(
            client
                .get(&entry)
                .header("Host", "elsewhere.invalid")
                .send()
                .unwrap()
                .status(),
            403
        );
        assert_eq!(client.post(&entry).send().unwrap().status(), 405);
        let next = format!(
            "{}index.html",
            player
                .mount_project("id".into(), root, &preference)
                .unwrap()
        );
        assert_ne!(entry, next);
        player.release_project(Some(&entry));
        assert_eq!(client.get(&entry).send().unwrap().status(), 404);
        assert_eq!(client.get(&next).send().unwrap().status(), 200);
        player.release_project(Some(&next));
        assert_eq!(client.get(&next).send().unwrap().status(), 404);
    }

    #[test]
    fn user_folder_assets_decode_web_paths_and_stay_inside_project() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("project");
        std::fs::create_dir_all(root.join("assets")).unwrap();
        std::fs::write(root.join("assets/画 面.js"), "").unwrap();
        std::fs::write(temp.path().join("outside"), "private").unwrap();
        std::fs::write(root.join(".env"), "private").unwrap();
        let game = MountedGame {
            id: "example".into(),
            root: root.canonicalize().unwrap(),
        };
        assert!(asset(&game, "assets/%E7%94%BB%20%E9%9D%A2.js", Source::UserFolder).is_some());
        for path in [
            "../outside",
            "%2e%2e/outside",
            "assets/%2e%2e/%2e%2e/outside",
            "%2eenv",
            "assets%5c..%5coutside",
            "C:/outside",
            "/outside",
            "assets/",
        ] {
            assert!(asset(&game, path, Source::UserFolder).is_none(), "{path}");
        }
        #[cfg(windows)]
        for name in [
            "NuL",
            "COM1.js",
            "prn .txt",
            "Lpt²",
            "trailing.",
            "trailing ",
            "a?b",
        ] {
            assert!(!valid_project_component(name), "{name}");
        }
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(temp.path(), root.join("link")).unwrap();
            assert!(asset(&game, "link/outside", Source::UserFolder).is_none());
        }
    }
}
