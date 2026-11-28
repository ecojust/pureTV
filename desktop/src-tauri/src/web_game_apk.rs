//! Prepare the TV package for a game in the built-in desktop catalog.
use crate::market::Progress;
use crate::web_game_template::{embedded_game, EmbeddedGame};
use reqwest::{blocking::Response, redirect, Url};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Read, Seek, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tempfile::NamedTempFile;

const CATALOG: &str = include_str!("../../../tools/pc-games/catalog.json");
// The desktop web catalog also feeds the online PC player. Resolve its branch links
// against the repository revision that contains these exact versioned APKs.
const APK_REVISION: &str = env!("PURETV_GAME_APK_REVISION");
const CATALOG_URL_PREFIX: &str =
    "https://github.com/ecojust/pureTV/raw/refs/heads/master/joystick-games/";

#[derive(Deserialize)]
struct CatalogGame {
    id: String,
    url: String,
    bytes: u64,
    sha256: String,
}

enum Source {
    Download(Url),
    Embedded(EmbeddedGame),
}

struct Game {
    file_name: String,
    sha256: String,
    bytes: u64,
    source: Source,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameApk {
    pub path: String,
    pub package_name: Option<String>,
    pub sha256: String,
}

fn lookup(id: &str) -> Result<Game, String> {
    if let Some(entry) = embedded_game(id) {
        return Ok(Game {
            file_name: entry.file_name.into(),
            sha256: entry.sha256.into(),
            bytes: entry.bytes,
            source: Source::Embedded(entry),
        });
    }
    let entries: Vec<CatalogGame> =
        serde_json::from_str(CATALOG).map_err(|_| "游戏目录无效，请更新管理器")?;
    let entry = entries
        .into_iter()
        .find(|entry| entry.id == id)
        .ok_or("游戏不在客户端目录中")?;
    let name = entry
        .url
        .strip_prefix(CATALOG_URL_PREFIX)
        .and_then(|path| path.split_once('/'))
        .filter(|(folder, name)| {
            *folder == id
                && name.ends_with(".apk")
                && name
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b"-_.".contains(&b))
        })
        .map(|(_, name)| name)
        .ok_or("游戏 APK 清单地址无效")?;
    let url = Url::parse(&format!(
        "https://github.com/ecojust/pureTV/raw/{APK_REVISION}/joystick-games/{id}/{name}"
    ))
    .map_err(|_| "游戏 APK 清单地址无效")?;
    Ok(Game {
        file_name: name.into(),
        sha256: entry.sha256,
        bytes: entry.bytes,
        source: Source::Download(url),
    })
}

pub fn file_name(game_id: &str) -> Result<String, String> {
    Ok(lookup(game_id)?.file_name)
}

fn cache_path(directory: &Path, game: &Game) -> PathBuf {
    directory
        .join("game-apks")
        .join(&game.sha256)
        .join(&game.file_name)
}

fn check_cancel(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Acquire) {
        Err("游戏 APK 操作已取消".into())
    } else {
        Ok(())
    }
}

fn allowed_redirect(url: &Url) -> bool {
    url.scheme() == "https"
        && url.port().is_none()
        && url.username().is_empty()
        && url.password().is_none()
        && matches!(
            url.host_str(),
            Some("raw.githubusercontent.com" | "media.githubusercontent.com")
        )
}

fn fetch(url: &Url, expected: u64) -> Result<Response, String> {
    let client = reqwest::blocking::Client::builder()
        .https_only(true)
        .redirect(redirect::Policy::custom(|attempt| {
            if attempt.previous().len() <= 3 && allowed_redirect(attempt.url()) {
                attempt.follow()
            } else {
                attempt.error("游戏 APK 下载重定向无效")
            }
        }))
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|_| "无法准备游戏下载")?;
    let response = client
        .get(url.clone())
        .header(reqwest::header::ACCEPT_ENCODING, "identity")
        .send()
        .map_err(|_| "无法连接游戏 APK 下载服务器")?;
    if response.status() != reqwest::StatusCode::OK {
        return Err(format!(
            "游戏 APK 下载服务器返回 HTTP {}",
            response.status().as_u16()
        ));
    }
    if response
        .content_length()
        .is_some_and(|length| length != expected)
    {
        return Err("游戏 APK 大小与清单不符".into());
    }
    Ok(response)
}

// Use the same check during download, cache reuse, and export. A destination
// only receives verified bytes when its neighboring temporary file is committed.
fn copy_verified(
    mut from: impl Read,
    mut to: impl Write,
    game: &Game,
    cancel: &AtomicBool,
    mut progress: impl FnMut(u64) -> Result<(), String>,
) -> Result<bool, String> {
    let mut hash = Sha256::new();
    let mut total = 0;
    let start = Instant::now();
    let mut last = start;
    let mut buffer = [0; 64 * 1024];
    loop {
        check_cancel(cancel)?;
        if start.elapsed() > Duration::from_secs(15 * 60) {
            return Err("游戏 APK 传输超时，请重试".into());
        }
        let count = from.read(&mut buffer).map_err(|_| "读取游戏 APK 失败")?;
        if count == 0 {
            break;
        }
        total += count as u64;
        if total > game.bytes {
            return Ok(false);
        }
        hash.update(&buffer[..count]);
        to.write_all(&buffer[..count])
            .map_err(|_| "保存游戏 APK 失败，请检查磁盘空间")?;
        if last.elapsed() >= Duration::from_millis(200) {
            progress(total)?;
            last = Instant::now();
        }
    }
    check_cancel(cancel)?;
    Ok(total == game.bytes && format!("{:x}", hash.finalize()) == game.sha256)
}

fn cached_file(path: &Path, game: &Game) -> Result<Option<File>, String> {
    match fs::symlink_metadata(path) {
        Ok(m) if m.is_file() && m.len() == game.bytes => File::open(path)
            .map(Some)
            .map_err(|_| "无法打开游戏 APK 缓存".into()),
        Ok(_) => Ok(None),
        Err(e) if e.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(_) => Err("无法读取游戏 APK 缓存".into()),
    }
}

fn publish(file: NamedTempFile, path: &Path, cancel: &AtomicBool) -> Result<(), String> {
    file.as_file()
        .sync_all()
        .map_err(|_| "无法写入完整的游戏 APK")?;
    check_cancel(cancel)?;
    file.persist(path)
        .map_err(|_| "无法保存游戏 APK，请检查目录权限")?;
    Ok(())
}

pub fn prepare(
    directory: &Path,
    game_id: &str,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<GameApk, String> {
    check_cancel(cancel)?;
    let game = lookup(game_id)?;
    let target = cache_path(directory, &game);
    let mut progress = |stage: &str, downloaded| {
        report(Progress {
            stage: stage.into(),
            downloaded,
            total: game.bytes,
            item_id: Some(game_id.into()),
        })
    };
    progress("verifying", 0)?;
    let valid = match cached_file(&target, &game)? {
        Some(file) => copy_verified(file, io::sink(), &game, cancel, |n| {
            progress("verifying", n)
        })?,
        None => false,
    };
    if !valid {
        let dir = target.parent().ok_or("游戏 APK 缓存目录无效")?;
        fs::create_dir_all(dir).map_err(|_| "无法创建游戏 APK 缓存目录")?;
        let mut output = NamedTempFile::new_in(dir).map_err(|_| "无法创建游戏 APK 临时文件")?;
        let matches = match &game.source {
            Source::Embedded(entry) => {
                check_cancel(cancel)?;
                entry
                    .write_to(output.as_file_mut())
                    .map_err(|_| "组装游戏 APK 失败")?;
                output.rewind().map_err(|_| "无法读取组装后的游戏 APK")?;
                copy_verified(&mut output, io::sink(), &game, cancel, |n| {
                    progress("verifying", n)
                })?
            }
            Source::Download(url) => {
                progress("downloading", 0)?;
                let response = fetch(url, game.bytes)?;
                copy_verified(response, &mut output, &game, cancel, |n| {
                    progress("downloading", n)
                })?
            }
        };
        if !matches {
            return Err("游戏 APK 校验失败，请重试".into());
        }
        publish(output, &target, cancel)?;
    }
    check_cancel(cancel)?;
    progress("verifying", game.bytes)?;
    Ok(GameApk {
        path: target.to_str().ok_or("游戏 APK 缓存路径无法表示")?.into(),
        package_name: match game.source {
            Source::Embedded(entry) => Some(entry.package_name.into()),
            Source::Download(_) => crate::app_logos::package_name(&target),
        },
        sha256: game.sha256,
    })
}

// Only the native save dialog supplies the destination. The source is always
// derived from the catalog ID and checked again against the built-in digest.
pub fn export(
    directory: &Path,
    game_id: &str,
    destination: &Path,
    cancel: &AtomicBool,
) -> Result<(), String> {
    check_cancel(cancel)?;
    if !destination.is_absolute()
        || !destination
            .extension()
            .is_some_and(|e| e.eq_ignore_ascii_case("apk"))
    {
        return Err("请选择 APK 保存路径".into());
    }
    let game = lookup(game_id)?;
    let source = cached_file(&cache_path(directory, &game), &game)?.ok_or("请先准备游戏 APK")?;
    let parent = destination.parent().ok_or("APK 保存路径无效")?;
    let mut temp = NamedTempFile::new_in(parent).map_err(|_| "无法创建游戏 APK 导出文件")?;
    if !copy_verified(source, &mut temp, &game, cancel, |_| Ok(()))? {
        return Err("游戏 APK 缓存校验失败，请重新准备".into());
    }
    publish(temp, destination, cancel)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use tempfile::tempdir;

    fn cancel() -> AtomicBool {
        AtomicBool::new(false)
    }

    #[test]
    fn catalog_ids_resolve_only_to_their_pinned_packages() {
        let entries: Vec<CatalogGame> = serde_json::from_str(CATALOG).unwrap();
        for entry in entries {
            let game = lookup(&entry.id).unwrap();
            assert_eq!(game.sha256.len(), 64);
            assert!(game.sha256.bytes().all(|b| b.is_ascii_hexdigit()));
            assert!(game.bytes > 0);
            let Source::Download(url) = game.source else {
                panic!("wrong source for {}", entry.id)
            };
            assert_eq!(url.host_str(), Some("github.com"));
            assert_eq!(
                url.path(),
                format!(
                    "/ecojust/pureTV/raw/{APK_REVISION}/joystick-games/{}/{}",
                    entry.id, game.file_name
                )
            );
        }
        for unknown in [
            "",
            "https://example.org/tank.apk",
            "../tank",
            "Tank",
            "tank/../jackal",
        ] {
            assert!(lookup(unknown).is_err());
        }
        for address in [
            "https://example.org/file.apk",
            "http://raw.githubusercontent.com/file.apk",
            "https://raw.githubusercontent.com.example/file",
            "https://media.githubusercontent.com:123/file",
        ] {
            assert!(!allowed_redirect(&Url::parse(address).unwrap()));
        }
    }

    #[test]
    fn corrupt_cache_or_cancelled_export_preserves_previous_file() {
        let directory = tempdir().unwrap();
        let game = lookup("tank").unwrap();
        let cache = cache_path(directory.path(), &game);
        fs::create_dir_all(cache.parent().unwrap()).unwrap();
        fs::write(cache, vec![0; game.bytes as usize]).unwrap();
        let target = directory.path().join("game.apk");
        fs::write(&target, b"previous export").unwrap();
        assert!(export(directory.path(), "tank", &target, &cancel()).is_err());
        assert!(export(directory.path(), "tank", &target, &AtomicBool::new(true)).is_err());
        assert_eq!(fs::read(&target).unwrap(), b"previous export");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 2);
    }

    #[test]
    fn embedded_packages_prepare_offline_and_repair_corrupt_cache() {
        let directory = tempdir().unwrap();
        let root = directory.path();
        for id in [
            "bandit",
            "noir-extreme",
            "daejeon-campus",
            "vespertine",
            "fish-loop",
            "struggle-bus",
        ] {
            let entry = embedded_game(id).unwrap();
            let first = prepare(root, id, &cancel(), |p| {
                assert_ne!(p.stage, "downloading");
                Ok(())
            })
            .unwrap();
            assert_eq!(first.package_name.as_deref(), Some(entry.package_name));
            let target = root.join(entry.file_name);
            export(root, id, &target, &cancel()).unwrap();
            let expected = fs::read(&target).unwrap();
            assert_eq!(expected.len() as u64, entry.bytes);
            assert_eq!(format!("{:x}", Sha256::digest(&expected)), entry.sha256);
            fs::write(&first.path, vec![0; expected.len()]).unwrap();
            thread::scope(|scope| {
                for _ in 0..2 {
                    scope.spawn(|| prepare(root, id, &cancel(), |_| Ok(())).unwrap());
                }
            });
            assert_eq!(fs::read(first.path).unwrap(), expected);
        }
    }

    #[test]
    #[ignore = "downloads an official game APK from the frozen public repository"]
    fn native_catalog_download_cache_and_export() {
        let directory = tempdir().unwrap();
        let id = std::env::var("PURETV_TEST_GAME_APK_ID").unwrap_or_else(|_| "tank".into());
        let first = prepare(directory.path(), &id, &cancel(), |_| Ok(())).unwrap();
        let cached = prepare(directory.path(), &id, &cancel(), |p| {
            assert_ne!(p.stage, "downloading");
            Ok(())
        })
        .unwrap();
        assert_eq!(first.path, cached.path);
        assert!(first.package_name.is_some());
        let target = directory.path().join(file_name(&id).unwrap());
        export(directory.path(), &id, &target, &cancel()).unwrap();
        let game = lookup(&id).unwrap();
        assert_eq!(fs::metadata(&target).unwrap().len(), game.bytes);
        assert!(copy_verified(
            File::open(&target).unwrap(),
            io::sink(),
            &game,
            &cancel(),
            |_| Ok(())
        )
        .unwrap());
        println!(
            "Verified {} ({} bytes), SHA-256 {}",
            game.file_name, game.bytes, game.sha256
        );
    }
}
