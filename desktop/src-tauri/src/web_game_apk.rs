//! Prepare the TV package for a game in the built-in desktop catalog.
use crate::market::Progress;
use crate::web_game_template::{embedded_game, EmbeddedGame};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, BufReader, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tempfile::NamedTempFile;

const CATALOG: &str = include_str!("../../../tools/pc-games/catalog.json");
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
    Project,
    Online,
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
    Ok(Game {
        file_name: name.into(),
        sha256: entry.sha256,
        bytes: entry.bytes,
        source: if crate::remote_game_apk::is_online_only(id) {
            Source::Online
        } else {
            Source::Project
        },
    })
}

pub(crate) fn verify_library(path: &Path) -> Result<(), String> {
    let mut pack = crate::offline_game_library::open(path)?;
    if pack
        .file_names()
        .flatten()
        .any(|name| name.ends_with(".apk"))
    {
        return Err("本地游戏库中包含成品 APK".into());
    }
    let entries: Vec<CatalogGame> = serde_json::from_str(CATALOG).map_err(|_| "游戏目录无效")?;
    for entry in entries {
        let game = lookup(&entry.id)?;
        if matches!(game.source, Source::Online) {
            let prefix = format!("projects/{}/", entry.id);
            let web = format!("web/{}/", entry.id);
            if pack.file_names().flatten().any(|name| {
                name.starts_with(&prefix)
                    || name
                        .strip_prefix(&web)
                        .is_some_and(|file| !matches!(file, "thumb.png" | "thumb.webp"))
            }) {
                return Err(format!("离线库中包含未授权的游戏项目: {}", entry.id));
            }
            continue;
        }
        if !assemble_project(
            &mut pack,
            &entry.id,
            &game,
            io::sink(),
            &AtomicBool::new(false),
            |_| Ok(()),
        )? {
            return Err(format!("游戏项目组装后的 APK 校验失败: {}", entry.id));
        }
        let page = format!("web/{}/tv.html", entry.id);
        if pack.by_name(&page).is_err() {
            return Err(format!("缺少 {page}"));
        }
    }
    Ok(())
}

// Rebuild the official signed APK from the same unsigned Android project used
// by the desktop player. Only signatures and central records are held in RAM.
fn assemble_project(
    pack: &mut zip::ZipArchive<BufReader<File>>,
    id: &str,
    game: &Game,
    output: impl Write,
    cancel: &AtomicBool,
    progress: impl FnMut(u64) -> Result<(), String>,
) -> Result<bool, String> {
    const RECORD_LIMIT: u64 = 16 * 1024 * 1024;
    let invalid = "本地游戏项目或签名资料无效";
    let mut signature = pack
        .by_name(&format!("projects/{id}/signing.bin"))
        .map_err(|_| "缺少游戏的签名资料")?;
    if !(32..=RECORD_LIMIT).contains(&signature.size()) {
        return Err(invalid.into());
    }
    let mut magic = [0; 8];
    signature.read_exact(&mut magic).map_err(|_| invalid)?;
    if &magic != b"PTVSIG01" {
        return Err(invalid.into());
    }
    let mut number = || {
        let mut bytes = [0; 8];
        signature.read_exact(&mut bytes).map_err(|_| invalid)?;
        Ok::<u64, &str>(u64::from_le_bytes(bytes))
    };
    let prefix = number()?;
    let directory_size = number()?;
    let local_signatures = number()?;
    let mut records = Vec::new();
    signature.read_to_end(&mut records).map_err(|_| invalid)?;
    drop(signature);
    let signed_bytes = records.len() as u64;
    if local_signatures > signed_bytes
        || directory_size > RECORD_LIMIT
        || prefix
            .checked_add(directory_size)
            .and_then(|n| n.checked_add(signed_bytes))
            != Some(game.bytes)
    {
        return Err(invalid.into());
    }
    let mut project = pack
        .by_name_seek(&crate::offline_game_library::project_member(id))
        .map_err(|_| "未找到可读取的本地游戏项目")?;
    project.seek(SeekFrom::Start(prefix)).map_err(|_| invalid)?;
    let mut directory = vec![0; directory_size as usize];
    project.read_exact(&mut directory).map_err(|_| invalid)?;
    project.rewind().map_err(|_| invalid)?;
    let (local, trailer) = records.split_at(local_signatures as usize);
    let signed = project
        .take(prefix)
        .chain(local)
        .chain(&directory[..])
        .chain(trailer);
    copy_verified(signed, output, game, cancel, progress)
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

// Use the same check during extraction, cache reuse, and export. A destination
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

fn publish(
    mut file: NamedTempFile,
    path: &Path,
    cancel: &AtomicBool,
    cache: Option<&Game>,
) -> Result<(), String> {
    file.as_file()
        .sync_all()
        .map_err(|_| "无法写入完整的游戏 APK")?;
    let mut retries = 0;
    loop {
        check_cancel(cancel)?;
        let conflict = match file.persist(path) {
            Ok(_) => return Ok(()),
            Err(err) => err,
        };
        let failure = || format!("无法保存游戏 APK: {}", conflict.error);
        let Some(game) = cache else {
            return Err(failure());
        };
        // Another process can finish repairing this cache entry while we are writing it.
        if let Ok(Some(winner)) = cached_file(path, game) {
            if copy_verified(winner, io::sink(), game, cancel, |_| Ok(()))? {
                return Ok(());
            }
        }
        // On Windows an open destination can temporarily deny MoveFileExW
        // with ACCESS_DENIED, SHARING_VIOLATION or LOCK_VIOLATION.
        if !cfg!(windows)
            || !matches!(conflict.error.raw_os_error(), Some(5 | 32 | 33))
            || retries == 6
        {
            return Err(failure());
        }
        file = conflict.file;
        std::thread::sleep(Duration::from_millis(20 << retries));
        retries += 1;
    }
}

pub fn prepare(
    directory: &Path,
    game_id: &str,
    library: impl FnOnce() -> Result<PathBuf, String>,
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
            Source::Project => {
                progress("preparing", 0)?;
                let mut archive = crate::offline_game_library::open(&library()?)?;
                assemble_project(&mut archive, game_id, &game, &mut output, cancel, |n| {
                    progress("preparing", n)
                })?
            }
            Source::Online => {
                progress("downloading", 0)?;
                let response =
                    crate::remote_game_apk::download(game_id, &game.file_name, game.bytes, cancel)?;
                copy_verified(response, &mut output, &game, cancel, |n| {
                    progress("downloading", n)
                })?
            }
        };
        if !matches {
            return Err("游戏 APK 校验失败，请重试".into());
        }
        publish(output, &target, cancel, Some(&game))?;
    }
    check_cancel(cancel)?;
    progress("verifying", game.bytes)?;
    Ok(GameApk {
        path: target.to_str().ok_or("游戏 APK 缓存路径无法表示")?.into(),
        package_name: match game.source {
            Source::Embedded(entry) => Some(entry.package_name.into()),
            Source::Project | Source::Online => crate::app_logos::package_name(&target),
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
    publish(temp, destination, cancel, None)
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
            assert_eq!(
                matches!(game.source, Source::Online),
                crate::remote_game_apk::is_online_only(&entry.id)
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
    fn failed_cache_rename_accepts_only_a_verified_winner() {
        let dir = tempdir().unwrap();
        let target = dir.path().join("game.apk");
        let game = Game {
            file_name: "game.apk".into(),
            bytes: 4,
            sha256: format!("{:x}", Sha256::digest(b"good")),
            source: Source::Project,
        };
        // A missing temporary pathname forces the rename to fail on every OS.
        let pending = || {
            NamedTempFile::from_parts(
                tempfile::tempfile_in(dir.path()).unwrap(),
                tempfile::TempPath::try_from_path(dir.path().join("missing")).unwrap(),
            )
        };
        fs::write(&target, b"good").unwrap();
        assert!(publish(pending(), &target, &cancel(), Some(&game)).is_ok());
        assert!(publish(pending(), &target, &cancel(), None).is_err());
        assert!(publish(pending(), &target, &AtomicBool::new(true), Some(&game)).is_err());
        fs::write(&target, b"evil").unwrap();
        assert!(publish(pending(), &target, &cancel(), Some(&game)).is_err());
        assert_eq!(fs::read(&target).unwrap(), b"evil");
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
            let first = prepare(
                root,
                id,
                || panic!("standalone template opened the library"),
                &cancel(),
                |p| {
                    assert_ne!(p.stage, "downloading");
                    Ok(())
                },
            )
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
                    scope.spawn(|| {
                        prepare(
                            root,
                            id,
                            || panic!("standalone template opened the library"),
                            &cancel(),
                            |_| Ok(()),
                        )
                        .unwrap()
                    });
                }
            });
            assert_eq!(fs::read(first.path).unwrap(), expected);
        }
    }

    #[test]
    fn catalog_games_prepare_from_local_zip_and_export_exact_bytes() {
        let archive = Path::new(env!("CARGO_MANIFEST_DIR")).join("offline-assets/game-library.zip");
        let entries: Vec<CatalogGame> = serde_json::from_str(CATALOG).unwrap();
        for entry in entries {
            if crate::remote_game_apk::is_online_only(&entry.id) {
                continue;
            }
            let directory = tempdir().unwrap();
            let game = prepare(
                directory.path(),
                &entry.id,
                || Ok(archive.clone()),
                &cancel(),
                |_| Ok(()),
            )
            .unwrap();
            let cached = prepare(
                directory.path(),
                &entry.id,
                || panic!("opened library on cache hit"),
                &cancel(),
                |_| Ok(()),
            )
            .unwrap();
            assert_eq!(game.path, cached.path);
            assert!(game.package_name.is_some(), "{}", entry.id);
            let target = directory.path().join(file_name(&entry.id).unwrap());
            export(directory.path(), &entry.id, &target, &cancel()).unwrap();
            assert_eq!(fs::metadata(&target).unwrap().len(), entry.bytes);
            assert_eq!(
                format!("{:x}", Sha256::digest(fs::read(target).unwrap())),
                entry.sha256
            );
        }
    }
}
