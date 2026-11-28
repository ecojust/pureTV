//! Prepare the TV package for a game in the current game library catalog.
use crate::market::Progress;
use crate::web_game_template::{embedded_game, EmbeddedGame};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tempfile::NamedTempFile;

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

fn lookup(directory: &Path, id: &str) -> Result<Game, String> {
    let catalog = crate::offline_game_library::catalog(directory)?;
    let entry = catalog.game(id)?;
    if entry.kind == "hosted" {
        let template = embedded_game(id).ok_or("游戏没有可用的电视 APK 模板")?;
        return Ok(Game {
            file_name: template.file_name.into(),
            sha256: template.sha256.into(),
            bytes: template.bytes,
            source: Source::Embedded(template),
        });
    }
    let apk = entry.apk.as_ref().ok_or("游戏 APK 清单无效")?;
    let source = match entry.kind.as_str() {
        "online" => Source::Online,
        "project" => Source::Project,
        _ => return Err("未知游戏类型".into()),
    };
    Ok(Game {
        file_name: apk.file_name.clone(),
        bytes: apk.bytes,
        sha256: apk.sha256.clone(),
        source,
    })
}

// Rebuild the official signed APK from the same unsigned Android project used
// by the desktop player. Only signatures and central records are held in RAM.
fn assemble_project(
    root: &Path,
    id: &str,
    game: &Game,
    output: impl Write,
    cancel: &AtomicBool,
    progress: impl FnMut(u64) -> Result<(), String>,
) -> Result<bool, String> {
    const RECORD_LIMIT: u64 = 16 * 1024 * 1024;
    let invalid = "本地游戏项目或签名资料无效";
    let project_dir = root.join("projects").join(id);
    let mut signature =
        File::open(project_dir.join("signing.bin")).map_err(|_| "缺少游戏的签名资料")?;
    if !(32..=RECORD_LIMIT).contains(&signature.metadata().map_err(|_| invalid)?.len()) {
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
    let mut project =
        File::open(project_dir.join("project.zip")).map_err(|_| "未找到可读取的本地游戏项目")?;
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

pub fn file_name(directory: &Path, game_id: &str) -> Result<String, String> {
    Ok(lookup(directory, game_id)?.file_name)
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
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<GameApk, String> {
    check_cancel(cancel)?;
    let game = lookup(directory, game_id)?;
    let target = cache_path(directory, &game);
    let mut progress = |stage: &str, downloaded| {
        report(Progress {
            stage: stage.into(),
            downloaded,
            total: if stage == "downloading" && matches!(game.source, Source::Project) {
                0 // Project assets and the final APK have different sizes.
            } else {
                game.bytes
            },
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
                progress("downloading", 0)?;
                let root = crate::offline_game_library::ensure(directory, game_id, cancel)?;
                progress("preparing", 0)?;
                assemble_project(&root, game_id, &game, &mut output, cancel, |n| {
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
// derived from the catalog ID and checked again against the catalog digest.
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
    let game = lookup(directory, game_id)?;
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

    fn seed_catalog(directory: &Path) {
        let library = directory.join("game-library");
        fs::create_dir_all(&library).unwrap();
        fs::write(
            library.join("catalog.json"),
            include_bytes!("../../../game-library/catalog.json"),
        )
        .unwrap();
    }

    #[test]
    fn corrupt_cache_or_cancelled_export_preserves_previous_file() {
        let directory = tempdir().unwrap();
        seed_catalog(directory.path());
        let game = lookup(directory.path(), "tank").unwrap();
        let cache = cache_path(directory.path(), &game);
        fs::create_dir_all(cache.parent().unwrap()).unwrap();
        fs::write(cache, vec![0; game.bytes as usize]).unwrap();
        let target = directory.path().join("game.apk");
        fs::write(&target, b"previous export").unwrap();
        assert!(export(directory.path(), "tank", &target, &cancel()).is_err());
        assert!(export(directory.path(), "tank", &target, &AtomicBool::new(true)).is_err());
        assert_eq!(fs::read(&target).unwrap(), b"previous export");
        assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 3);
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
        seed_catalog(root);
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
    #[ignore = "requires the complete game-library checkout, including LFS objects"]
    fn published_projects_reconstruct_the_official_signed_apks() {
        let library = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../game-library");
        let catalog: serde_json::Value =
            serde_json::from_slice(&fs::read(library.join("catalog.json")).unwrap()).unwrap();
        for entry in catalog["games"].as_array().unwrap() {
            if entry["kind"] != "project" {
                continue;
            }
            let id = entry["id"].as_str().unwrap();
            let apk = &entry["apk"];
            let game = Game {
                file_name: apk["fileName"].as_str().unwrap().into(),
                bytes: apk["bytes"].as_u64().unwrap(),
                sha256: apk["sha256"].as_str().unwrap().into(),
                source: Source::Project,
            };
            assert!(
                assemble_project(&library, id, &game, io::sink(), &cancel(), |_| Ok(())).unwrap(),
                "{id}"
            );
        }
    }

    #[test]
    fn reconstructs_an_apk_from_downloaded_project_and_signatures() {
        let temp = tempdir().unwrap();
        let dir = temp.path().join("projects/new-title");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("project.zip"), b"payloadcentralunsigned-tail").unwrap();
        let mut signing = b"PTVSIG01".to_vec();
        for size in [7u64, 7, 5] {
            signing.extend(size.to_le_bytes());
        }
        signing.extend(b"blocksignatures");
        fs::write(dir.join("signing.bin"), signing).unwrap();
        let expected = b"payloadblockcentralsignatures";
        let game = Game {
            file_name: "new-title.apk".into(),
            bytes: expected.len() as u64,
            sha256: format!("{:x}", Sha256::digest(expected)),
            source: Source::Project,
        };
        let mut apk = Vec::new();
        assert!(assemble_project(
            temp.path(),
            "new-title",
            &game,
            &mut apk,
            &cancel(),
            |_| Ok(())
        )
        .unwrap());
        assert_eq!(apk, expected);
        fs::write(dir.join("signing.bin"), b"incomplete").unwrap();
        assert!(assemble_project(
            temp.path(),
            "new-title",
            &game,
            io::sink(),
            &cancel(),
            |_| Ok(())
        )
        .is_err());
    }
}
