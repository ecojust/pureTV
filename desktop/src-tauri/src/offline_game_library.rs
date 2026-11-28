//! Fetch the library index independently of game payloads. A revision's files
//! keep their published relative layout for the desktop player and APK assembler.
use reqwest::{
    blocking::{Client, Response},
    redirect::Policy,
    StatusCode,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    fs::{self, File},
    io::{self, Read, Write},
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};
use tauri::Manager;
use tempfile::NamedTempFile;

const SOURCE: &str = "https://apps.b14f.com/game-library/";
const INDEX_LIMIT: u64 = 4 * 1024 * 1024;
// Receipts for servers still exposing the web/ directory without a manifest.
const ORIGINAL_INDEX: &[u8] = include_bytes!("../../../game-library/web/catalog.json");
const INVALID: &str = "游戏库清单无效";

#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Catalog {
    version: u32,
    groups: Vec<Group>,
    shared: Vec<Asset>,
    games: Vec<Game>,
}
#[derive(Debug, Deserialize, Serialize)]
struct Group {
    id: String,
    zh: String,
    en: String,
}
#[derive(Debug, Deserialize, Serialize)]
struct Labels {
    zh: String,
    en: String,
}
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Game {
    pub id: String,
    pub(crate) zh: String,
    pub(crate) en: String,
    category: String,
    pub kind: String,
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    downloaded: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    controls: Option<Labels>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub apk: Option<Apk>,
    pub(crate) files: Vec<Asset>,
}
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Apk {
    pub file_name: String,
    pub bytes: u64,
    pub sha256: String,
}
#[derive(Debug, Deserialize, Serialize)]
pub(crate) struct Asset {
    pub(crate) path: String,
    bytes: u64,
    sha256: String,
}

impl Game {
    fn has_web_entry(&self) -> bool {
        let entry = format!("web/{}/tv.html", self.id);
        self.files
            .iter()
            .any(|file| file.path == entry && file.bytes > 0)
    }
}

fn safe_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 100
        && id
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

fn safe_name(name: &str) -> bool {
    let stem = name.split('.').next().unwrap_or("").to_ascii_uppercase();
    !stem.is_empty()
        && !name.ends_with('.')
        && name.len() <= 255
        && name
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b".-_".contains(&b))
        && !matches!(stem.as_str(), "CON" | "AUX" | "NUL" | "PRN")
        && !(stem.len() == 4
            && (stem.starts_with("COM") || stem.starts_with("LPT"))
            && stem.as_bytes()[3].is_ascii_digit())
}

fn digest_valid(digest: &str) -> bool {
    digest.len() == 64
        && digest
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

impl Catalog {
    pub(crate) fn game(&self, id: &str) -> Result<&Game, String> {
        self.games
            .iter()
            .find(|game| game.id == id)
            .ok_or_else(|| "游戏不在目录中".into())
    }

    fn parse(bytes: &[u8]) -> Result<Self, String> {
        let catalog: Self = serde_json::from_slice(bytes).map_err(|_| INVALID)?;
        let mut groups = HashSet::new();
        let mut ids = HashSet::new();
        let mut paths = HashSet::new();
        if catalog.version != 1
            || catalog
                .groups
                .iter()
                .any(|g| !safe_id(&g.id) || !groups.insert(&g.id))
        {
            return Err(INVALID.into());
        }
        let mut valid_asset = |file: &Asset| {
            file.path.len() <= 1024
                && file.path.split('/').all(safe_name)
                && digest_valid(&file.sha256)
                && paths.insert(file.path.to_ascii_lowercase())
        };
        for asset in &catalog.shared {
            if !asset
                .path
                .strip_prefix("web/")
                .is_some_and(|name| !name.contains('/'))
                || !valid_asset(asset)
            {
                return Err(INVALID.into());
            }
        }
        for game in &catalog.games {
            if !safe_id(&game.id)
                || !safe_name(&game.id)
                || !ids.insert(&game.id)
                || !groups.contains(&game.category)
                || !matches!(game.kind.as_str(), "project" | "online" | "hosted")
            {
                return Err(INVALID.into());
            }
            if let Some(apk) = &game.apk {
                if !safe_name(&apk.file_name)
                    || !apk.file_name.ends_with(".apk")
                    || apk.bytes == 0
                    || !digest_valid(&apk.sha256)
                {
                    return Err(INVALID.into());
                }
            } else if game.kind == "online" {
                return Err(INVALID.into());
            }
            let overlay = format!("web/{}/", game.id);
            if game
                .files
                .iter()
                .any(|file| !file.path.starts_with(&overlay) || !valid_asset(file))
            {
                return Err(INVALID.into());
            }
            if game.kind == "project"
                && ["tv.html", "android-entry.html"].iter().any(|name| {
                    !game
                        .files
                        .iter()
                        .any(|file| file.path == format!("{overlay}{name}"))
                })
            {
                return Err(INVALID.into());
            }
        }
        Ok(catalog)
    }
}

fn client() -> Result<Client, String> {
    Client::builder()
        .https_only(true)
        .redirect(Policy::none())
        .connect_timeout(Duration::from_secs(8))
        .timeout(Duration::from_secs(300))
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "无法准备游戏下载".into())
}

fn read_index(source: impl Read) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    source
        .take(INDEX_LIMIT + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "无法读取游戏库清单")?;
    if bytes.len() as u64 > INDEX_LIMIT {
        return Err(INVALID.into());
    }
    Ok(bytes)
}

fn from_listing(bytes: &[u8]) -> Result<Catalog, String> {
    let html = std::str::from_utf8(bytes).map_err(|_| INVALID)?;
    let mut ids = HashSet::new();
    let lower = html.to_ascii_lowercase();
    for (i, _) in lower.match_indices("<a") {
        let start = i + 2;
        if !html
            .as_bytes()
            .get(start)
            .is_some_and(u8::is_ascii_whitespace)
        {
            continue;
        }
        let (attrs, _) = html[start..].split_once('>').ok_or(INVALID)?;
        if let Some(id) = crate::app_store::href_attribute(attrs)
            .and_then(|href| href.strip_suffix('/'))
            .filter(|id| safe_id(id))
        {
            ids.insert(id);
        }
    }
    if ids.is_empty() {
        return Err("游戏服务器未返回可识别的游戏列表".into());
    }
    let mut catalog = Catalog::parse(ORIGINAL_INDEX)?;
    catalog.games.retain(|game| ids.contains(game.id.as_str()));
    Ok(catalog)
}

fn remote_catalog(client: &Client, base: &str) -> Result<Catalog, String> {
    let get = |name: &str| {
        client
            .get(format!("{base}{name}"))
            .timeout(Duration::from_secs(15))
            .send()
            .map_err(|_| "无法连接游戏库服务器")
    };
    let response = get("web/catalog.json")?;
    if response.status() == StatusCode::NOT_FOUND {
        let listing = get("web/")?
            .error_for_status()
            .map_err(|_| "无法读取游戏目录")?;
        return from_listing(&read_index(listing)?);
    }
    let response = response
        .error_for_status()
        .map_err(|_| "无法读取游戏库清单")?;
    Catalog::parse(&read_index(response)?)
}

fn saved(directory: &Path) -> Result<Catalog, String> {
    let file =
        File::open(directory.join("game-library/catalog.json")).map_err(|_| "本地尚无游戏目录")?;
    Catalog::parse(&read_index(file)?)
}

fn refresh(directory: &Path, remote: Result<Catalog, String>) -> Result<Catalog, String> {
    let index = match remote {
        Ok(index) => index,
        Err(error) => return saved(directory).map_err(|_| error),
    };
    let directory = directory.join("game-library");
    fs::create_dir_all(&directory).map_err(|_| "无法创建游戏缓存目录")?;
    let mut temporary = NamedTempFile::new_in(&directory).map_err(|_| "无法创建游戏目录缓存")?;
    serde_json::to_writer(&mut temporary, &index).map_err(|_| "无法写入游戏目录缓存")?;
    temporary
        .persist(directory.join("catalog.json"))
        .map_err(|_| "无法保存游戏目录缓存")?;
    Ok(index)
}

pub(crate) fn catalog(directory: &Path) -> Result<Catalog, String> {
    saved(directory).or_else(|_| refresh(directory, remote_catalog(&client()?, SOURCE)))
}

fn revision_directory(directory: &Path, shared: &[Asset], game: &Game) -> Result<PathBuf, String> {
    let revision = serde_json::to_vec(&(shared, &game.files)).map_err(|_| INVALID)?;
    Ok(directory
        .join("game-library/games")
        .join(&game.id)
        .join(format!("{:x}", Sha256::digest(revision))))
}

fn with_download_status(directory: &Path, mut catalog: Catalog) -> Result<Catalog, String> {
    for game in &mut catalog.games {
        if game.has_web_entry() {
            let root = revision_directory(directory, &catalog.shared, game)?;
            // Downloads publish verified files by rename. Inspect their sizes
            // here; the player and APK builder verify hashes on actual use.
            game.downloaded = Some(catalog.shared.iter().chain(&game.files).all(|file| {
                fs::metadata(root.join(&file.path))
                    .is_ok_and(|info| info.is_file() && info.len() == file.bytes)
            }));
        }
    }
    Ok(catalog)
}

#[tauri::command]
pub(crate) async fn game_library_catalog(app: tauri::AppHandle) -> Result<Catalog, String> {
    let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
    tauri::async_runtime::spawn_blocking(move || {
        let catalog = refresh(
            &directory,
            client().and_then(|client| remote_catalog(&client, SOURCE)),
        )?;
        with_download_status(&directory, catalog)
    })
    .await
    .map_err(|_| "游戏目录任务异常结束")?
}

#[tauri::command]
pub(crate) async fn download_library_game(
    app: tauri::AppHandle,
    game_id: String,
) -> Result<(), String> {
    let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
    tauri::async_runtime::spawn_blocking(move || {
        ensure(&directory, &game_id, &AtomicBool::new(false)).map(|_| ())
    })
    .await
    .map_err(|_| "游戏下载任务异常结束")?
}

fn check_cancel(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Acquire) {
        Err("游戏下载已取消".into())
    } else {
        Ok(())
    }
}

fn verified_copy(
    mut input: impl Read,
    mut output: impl Write,
    asset: &Asset,
    cancel: &AtomicBool,
) -> Result<bool, String> {
    let mut sha = Sha256::new();
    let mut bytes = 0u64;
    let mut chunk = [0u8; 64 * 1024];
    loop {
        check_cancel(cancel)?;
        let size = input.read(&mut chunk).map_err(|_| "游戏文件读取中断")?;
        if size == 0 {
            break;
        }
        bytes += size as u64;
        if bytes > asset.bytes {
            return Ok(false);
        }
        sha.update(&chunk[..size]);
        output
            .write_all(&chunk[..size])
            .map_err(|_| "无法写入本地游戏文件")?;
    }
    Ok(bytes == asset.bytes && format!("{:x}", sha.finalize()) == asset.sha256)
}

fn response(client: &Client, file: &Asset) -> Result<Response, String> {
    let response = client
        .get(format!("{SOURCE}{}", file.path))
        .header(reqwest::header::ACCEPT_ENCODING, "identity")
        .send()
        .map_err(|_| "无法连接游戏库服务器")?;
    if response.status() != StatusCode::OK {
        return Err(format!(
            "游戏文件下载失败 (HTTP {})",
            response.status().as_u16()
        ));
    }
    if response
        .content_length()
        .is_some_and(|bytes| bytes != file.bytes)
    {
        return Err("游戏文件大小与清单不符".into());
    }
    Ok(response)
}

fn cached_file_matches(path: &Path, asset: &Asset, cancel: &AtomicBool) -> Result<bool, String> {
    let Ok(file) = File::open(path) else {
        return Ok(false);
    };
    if !file
        .metadata()
        .is_ok_and(|meta| meta.is_file() && meta.len() == asset.bytes)
    {
        return Ok(false);
    }
    verified_copy(file, io::sink(), asset, cancel)
}

fn install(
    directory: &Path,
    catalog: &Catalog,
    id: &str,
    cancel: &AtomicBool,
    mut fetch: impl FnMut(&Asset) -> Result<Box<dyn Read>, String>,
) -> Result<PathBuf, String> {
    let game = catalog.game(id)?;
    if !game.has_web_entry() {
        return Err("暂无可下载的游戏包".into());
    }
    let root = revision_directory(directory, &catalog.shared, game)?;
    for asset in catalog.shared.iter().chain(&game.files) {
        check_cancel(cancel)?;
        let target = root.join(&asset.path);
        if cached_file_matches(&target, asset, cancel)? {
            continue;
        }
        let parent = target.parent().ok_or(INVALID)?;
        fs::create_dir_all(parent).map_err(|_| "无法创建游戏缓存目录")?;
        let mut pending = NamedTempFile::new_in(parent).map_err(|_| "无法创建游戏缓存文件")?;
        if !verified_copy(fetch(asset)?, &mut pending, asset, cancel)? {
            return Err(format!("游戏文件校验失败 ({})", asset.path));
        }
        // Windows can reject replacement when another player has already
        // opened the identical file downloaded by a concurrent request.
        if pending.persist(&target).is_err() && !cached_file_matches(&target, asset, cancel)? {
            return Err("无法保存游戏缓存文件".into());
        }
    }
    Ok(root)
}

pub(crate) fn ensure(directory: &Path, id: &str, cancel: &AtomicBool) -> Result<PathBuf, String> {
    check_cancel(cancel)?;
    ensure_with_catalog(directory, &catalog(directory)?, id, cancel)
}

pub(crate) fn ensure_with_catalog(
    directory: &Path,
    index: &Catalog,
    id: &str,
    cancel: &AtomicBool,
) -> Result<PathBuf, String> {
    let mut connection = None;
    install(directory, index, id, cancel, |asset| {
        let connection = match &connection {
            Some(client) => client,
            None => connection.insert(client()?),
        };
        Ok(Box::new(response(connection, asset)?))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn directory_fallback_only_lists_current_relative_game_links() {
        let index = from_listing(br#"<a href="../">back</a><a HREF='tetris/'>T</a><a href="https://example.org/jewel/">J</a><a href="thumb.png">image</a>"#).unwrap();
        assert_eq!(index.games.len(), 1);
        assert_eq!(index.games[0].id, "tetris");
        assert!(from_listing(b"<html>login</html>").is_err());
    }

    #[test]
    fn remote_index_accepts_new_games_without_requesting_payloads() {
        let mut release = from_listing(br#"<a href="tetris/">T</a>"#).unwrap();
        let game = &mut release.games[0];
        game.id = "new-game".into();
        for asset in &mut game.files {
            asset.path = asset.path.replace("/tetris/", "/new-game/");
        }
        let body = serde_json::to_vec(&release).unwrap();
        let server = tiny_http::Server::http("127.0.0.1:0").unwrap();
        let base = format!("http://{}/game-library/", server.server_addr());
        let responder = std::thread::spawn(move || {
            let request = server
                .recv_timeout(Duration::from_secs(5))
                .unwrap()
                .unwrap();
            assert_eq!(request.url(), "/game-library/web/catalog.json");
            request
                .respond(tiny_http::Response::from_data(body))
                .unwrap();
        });
        let http = Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap();
        let index = remote_catalog(&http, &base).unwrap();
        assert_eq!(index.games.len(), 1);
        assert_eq!(index.games[0].id, "new-game");
        responder.join().unwrap();
    }

    #[test]
    fn unsafe_or_cross_game_file_paths_are_rejected() {
        for path in [
            "../a",
            "web/tetris/../a",
            "web/tetris/%2Foutside",
            "web/tetris/nul.txt",
            "web/jewel/cover.png",
            "https://example.org/file",
            "web/tetris/C:tmp",
        ] {
            let mut catalog = from_listing(br#"<a href="tetris/">T</a>"#).unwrap();
            catalog.games[0].files[0].path = path.into();
            assert!(
                Catalog::parse(&serde_json::to_vec(&catalog).unwrap()).is_err(),
                "{path}"
            );
        }
    }

    #[test]
    fn download_requires_a_web_entry_independent_of_apk_kind() {
        let directory = tempfile::tempdir().unwrap();
        let mut catalog =
            from_listing(br#"<a href="kart-rush/">K</a><a href="fish-loop/">F</a>"#).unwrap();
        catalog.shared.clear();
        assert_eq!(catalog.games.len(), 2);
        for game in &mut catalog.games {
            let path = format!("web/{}/tv.html", game.id);
            game.files = vec![Asset {
                path,
                bytes: 4,
                sha256: format!("{:x}", Sha256::digest(b"game")),
            }];
        }
        let catalog = with_download_status(directory.path(), catalog).unwrap();
        let cancel = AtomicBool::new(false);
        for game in &catalog.games {
            assert_eq!(game.downloaded, Some(false));
            install(directory.path(), &catalog, &game.id, &cancel, |_| {
                Ok(Box::new(Cursor::new(b"game")))
            })
            .unwrap();
        }
        let mut catalog = with_download_status(directory.path(), catalog).unwrap();
        for game in &mut catalog.games {
            assert_eq!(game.downloaded, Some(true));
            // Previous online/hosted catalog revisions listed only the cover.
            game.files[0].path = format!("web/{}/thumb.png", game.id);
        }
        let legacy = with_download_status(
            directory.path(),
            Catalog::parse(&serde_json::to_vec(&catalog).unwrap()).unwrap(),
        )
        .unwrap();
        for game in &legacy.games {
            assert_eq!(game.downloaded, None);
            assert_eq!(
                install(directory.path(), &legacy, &game.id, &cancel, |_| panic!(
                    "cover-only download"
                ))
                .unwrap_err(),
                "暂无可下载的游戏包"
            );
        }
    }

    #[test]
    fn install_verifies_each_selected_file_and_reuses_it_offline() {
        let dir = tempfile::tempdir().unwrap();
        let mut catalog = Catalog::parse(ORIGINAL_INDEX).unwrap();
        let selected = catalog
            .games
            .iter_mut()
            .find(|game| game.id == "tetris")
            .unwrap();
        let count = selected.files.len() + catalog.shared.len();
        let content = |asset: &Asset| asset.path.as_bytes().to_vec();
        for file in selected.files.iter_mut().chain(&mut catalog.shared) {
            file.bytes = content(file).len() as u64;
            file.sha256 = format!("{:x}", Sha256::digest(content(file)));
        }
        let catalog =
            with_download_status(dir.path(), refresh(dir.path(), Ok(catalog)).unwrap()).unwrap();
        assert_eq!(catalog.game("tetris").unwrap().downloaded, Some(false));
        let cancel = AtomicBool::new(false);
        let mut requests = 0;
        let root = install(dir.path(), &catalog, "tetris", &cancel, |asset| {
            assert!(asset.path.starts_with("web/tetris/") || asset.path.split('/').count() == 2);
            requests += 1;
            Ok(Box::new(Cursor::new(content(asset))))
        })
        .unwrap();
        assert_eq!(requests, count);
        let cached = refresh(dir.path(), Err("offline".into())).unwrap();
        assert!(cached.game("tetris").unwrap().downloaded.is_none());
        let offline = with_download_status(dir.path(), cached).unwrap();
        assert_eq!(offline.game("tetris").unwrap().downloaded, Some(true));
        assert_eq!(
            install(dir.path(), &offline, "tetris", &cancel, |_| panic!(
                "unnecessary network request"
            ))
            .unwrap(),
            root
        );

        // A partial response cannot overwrite a file. A retry requests only
        // the damaged item and restores the player's original directory.
        let target = root.join("web/tetris/android-entry.html");
        fs::write(&target, b"damaged").unwrap();
        assert!(
            install(dir.path(), &offline, "tetris", &cancel, |_| Ok(Box::new(
                Cursor::new(b"partial")
            )))
            .is_err()
        );
        assert_eq!(fs::read(&target).unwrap(), b"damaged");
        let repaired = install(dir.path(), &offline, "tetris", &cancel, |file| {
            assert_eq!(file.path, "web/tetris/android-entry.html");
            Ok(Box::new(Cursor::new(content(file))))
        })
        .unwrap();
        assert_eq!(repaired, root);
        cancel.store(true, Ordering::Release);
        assert!(
            install(dir.path(), &offline, "tetris", &cancel, |_| panic!())
                .unwrap_err()
                .contains("取消")
        );
    }
}
