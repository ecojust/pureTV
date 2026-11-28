use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::{BufReader, Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    sync::OnceLock,
};
use tauri::Manager;

static VERIFIED: OnceLock<PathBuf> = OnceLock::new();

fn matches(path: &Path, size: u64, digest: &str, portable: bool) -> bool {
    let Ok(mut file) = File::open(path) else {
        return false;
    };
    let Ok(metadata) = file.metadata() else {
        return false;
    };
    if !metadata.is_file() || metadata.len() < size || (!portable && metadata.len() != size) {
        return false;
    }
    let offset = metadata.len() - size;
    if file.seek(SeekFrom::Start(offset)).is_err() {
        return false;
    }
    let mut sha = Sha256::new();
    let mut buffer = [0; 64 * 1024];
    loop {
        match file.read(&mut buffer) {
            Ok(0) => break,
            Ok(count) => sha.update(&buffer[..count]),
            Err(_) => return false,
        }
    }
    format!("{:x}", sha.finalize()) == digest
}

fn library_size() -> Result<u64, String> {
    env!("PURETV_GAME_LIBRARY_BYTES")
        .parse()
        .map_err(|_| "游戏资源信息无效".into())
}

pub(crate) fn project_member(id: &str) -> String {
    format!("projects/{id}/project.zip")
}

// The same ZIP is either a standalone file or appended to the PE. Its offset
// is known, so avoid scanning embedded APK signatures across hundreds of MiB.
pub(crate) fn open(path: &Path) -> Result<zip::ZipArchive<BufReader<File>>, String> {
    use zip::read::{ArchiveOffset, Config};
    let file = File::open(path).map_err(|_| "无法打开本地游戏资源")?;
    let length = file.metadata().map_err(|_| "无法读取本地游戏资源")?.len();
    let offset = length
        .checked_sub(library_size()?)
        .ok_or("本地游戏资源不完整")?;
    zip::ZipArchive::with_config(
        Config {
            archive_offset: ArchiveOffset::Known(offset),
        },
        BufReader::new(file),
    )
    .map_err(|_| "无法读取本地游戏资源".into())
}

fn resolve(package: &tauri::PackageInfo, env: &tauri::Env) -> Result<PathBuf, String> {
    if let Some(path) = VERIFIED.get() {
        return Ok(path.clone());
    }
    let size = library_size()?;
    let digest = env!("PURETV_GAME_LIBRARY_SHA256");
    let installed = tauri::utils::platform::resource_dir(package, env)
        .map_err(|_| "无法定位本地游戏资源")?
        .join("game-library.zip");
    let found = if matches(&installed, size, digest, false) {
        installed
    } else if cfg!(windows) {
        let exe = std::env::current_exe().map_err(|_| "无法定位便携版游戏资源")?;
        if !matches(&exe, size, digest, true) {
            return Err("本地游戏资源缺失或已损坏，请重新安装客户端".into());
        }
        exe
    } else {
        return Err("本地游戏资源缺失或已损坏，请重新安装客户端".into());
    };
    Ok(VERIFIED.get_or_init(|| found).clone())
}

pub(crate) fn path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    resolve(app.package_info(), &app.env())
}

pub(crate) fn verify(package: &tauri::PackageInfo) -> Result<(), String> {
    let path = resolve(package, &tauri::Env::default())?;
    crate::web_game_apk::verify_library(&path)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn portable_checks_only_its_expected_library_suffix() {
        let file = tempfile::NamedTempFile::new().unwrap();
        let payload = b"game library";
        let digest = format!("{:x}", Sha256::digest(payload));
        std::fs::write(file.path(), [b"MZ executable".as_slice(), payload].concat()).unwrap();
        assert!(matches(file.path(), payload.len() as u64, &digest, true));
        assert!(!matches(file.path(), payload.len() as u64, &digest, false));
        assert!(!matches(file.path(), 2, &digest, true));
        std::fs::write(file.path(), payload).unwrap();
        assert!(matches(file.path(), payload.len() as u64, &digest, false));
    }
}
