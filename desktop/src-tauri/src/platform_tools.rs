//! Pinned official tools, installed in private version directories outside the app bundle.
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const MAX_ARCHIVE: u64 = 32 * 1024 * 1024;
const MAX_UNPACKED: u64 = 128 * 1024 * 1024;
const MAX_FILES: usize = 128;

#[derive(Deserialize)]
struct Manifest {
    version: String,
    archives: BTreeMap<String, Archive>,
}
#[derive(Clone, Deserialize)]
struct Archive {
    url: String,
    #[serde(default, rename = "fallbackUrls")]
    fallback_urls: Vec<String>,
    bytes: u64,
    sha256: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Info {
    version: String,
    platform: &'static str,
    download_bytes: u64,
    installed: bool,
    supported: bool,
    message: String,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    stage: &'static str,
    downloaded: u64,
    total: u64,
}
#[derive(Serialize, Deserialize)]
struct Installed {
    archive_sha256: String,
    files: Vec<InstalledFile>,
}
#[derive(Serialize, Deserialize)]
struct InstalledFile {
    path: String,
    bytes: u64,
    sha256: String,
}
#[derive(Serialize, Deserialize)]
struct Pointer {
    directory: String,
}

type Report<'a> = &'a mut dyn FnMut(Progress) -> Result<(), String>;

fn manifest() -> Result<Manifest, String> {
    serde_json::from_str(include_str!("../platform-tools.json"))
        .map_err(|_| "官方工具清单无效，请更新管理器".into())
}
fn supported() -> bool {
    cfg!(all(target_os = "windows", target_arch = "x86_64"))
        || cfg!(all(target_os = "linux", target_arch = "x86_64"))
        || cfg!(all(
            target_os = "macos",
            any(target_arch = "aarch64", target_arch = "x86_64")
        ))
}
fn adb_name() -> &'static str {
    if cfg!(windows) {
        "adb.exe"
    } else {
        "adb"
    }
}
fn cancelled(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Acquire) {
        Err("下载已取消，原有 ADB 配置未更改".into())
    } else {
        Ok(())
    }
}
fn progress(
    report: Report<'_>,
    stage: &'static str,
    downloaded: u64,
    total: u64,
) -> Result<(), String> {
    report(Progress {
        stage,
        downloaded,
        total,
    })
}
fn nonce() -> String {
    format!(
        "{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
    )
}
fn read_small(path: &Path, limit: u64) -> Result<Vec<u8>, String> {
    let meta = fs::symlink_metadata(path).map_err(|_| "无法读取工具缓存".to_string())?;
    if !meta.is_file() || meta.len() > limit {
        return Err("工具缓存记录无效".into());
    }
    let mut bytes = Vec::new();
    File::open(path)
        .and_then(|file| file.take(limit + 1).read_to_end(&mut bytes))
        .map_err(|_| "无法读取工具缓存".to_string())?;
    if bytes.len() as u64 > limit {
        return Err("工具缓存记录过大".into());
    }
    Ok(bytes)
}
fn relative_path(name: &str) -> Result<PathBuf, String> {
    if name.is_empty() || name.len() > 240 || name.contains(['\\', ':', '\0']) {
        return Err("压缩包包含不安全的文件路径".into());
    }
    let clean = name.trim_end_matches('/');
    let parts: Vec<_> = clean.split('/').collect();
    if parts.first() != Some(&"platform-tools")
        || parts
            .iter()
            .any(|p| p.is_empty() || *p == "." || *p == ".." || p.ends_with(['.', ' ']))
    {
        return Err("压缩包包含越界文件路径".into());
    }
    Ok(parts.iter().collect())
}
fn required_files(files: &[InstalledFile]) -> bool {
    let names: BTreeSet<_> = files.iter().map(|f| f.path.as_str()).collect();
    names.contains(format!("platform-tools/{}", adb_name()).as_str())
        && names.contains("platform-tools/NOTICE.txt")
        && names.contains("platform-tools/source.properties")
        && (!cfg!(windows)
            || (names.contains("platform-tools/AdbWinApi.dll")
                && names.contains("platform-tools/AdbWinUsbApi.dll")))
}
fn file_digest(path: &Path, expected: u64, cancel: &AtomicBool) -> Result<String, String> {
    let mut file = File::open(path).map_err(|_| "无法读取工具文件".to_string())?;
    let mut hasher = Sha256::new();
    let mut count = 0;
    let mut buffer = [0; 65536];
    loop {
        cancelled(cancel)?;
        let n = file
            .read(&mut buffer)
            .map_err(|_| "读取工具文件失败".to_string())?;
        if n == 0 {
            break;
        }
        count += n as u64;
        if count > expected {
            return Err("工具文件大小不符".into());
        }
        hasher.update(&buffer[..n]);
    }
    if count != expected {
        return Err("工具文件不完整".into());
    }
    Ok(format!("{:x}", hasher.finalize()))
}
fn cached(
    tools: &Path,
    spec: &Manifest,
    archive: &Archive,
    verify_hash: bool,
    cancel: &AtomicBool,
) -> Result<Option<PathBuf>, String> {
    cancelled(cancel)?;
    let result = (|| {
        let pointer: Pointer = serde_json::from_slice(&read_small(
            &tools.join(format!("current-{}.json", spec.version)),
            4096,
        )?)
        .map_err(|_| "缓存指针无效")?;
        if !pointer
            .directory
            .starts_with(&format!("platform-tools-{}-", spec.version))
            || !pointer
                .directory
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'.')
        {
            return Err("缓存目录无效".to_string());
        }
        let root = tools.join(pointer.directory);
        if !fs::symlink_metadata(&root)
            .map_err(|_| "缓存目录不存在")?
            .is_dir()
        {
            return Err("缓存目录无效".into());
        }
        let installed: Installed =
            serde_json::from_slice(&read_small(&root.join("installed.json"), 128 * 1024)?)
                .map_err(|_| "缓存清单无效")?;
        if installed.archive_sha256 != archive.sha256
            || installed.files.is_empty()
            || installed.files.len() > MAX_FILES
            || !required_files(&installed.files)
        {
            return Err("缓存清单不完整".into());
        }
        let mut total = 0u64;
        let mut names = BTreeSet::new();
        for file in &installed.files {
            cancelled(cancel)?;
            let relative = relative_path(&file.path)?;
            if !names.insert(file.path.to_lowercase()) || file.sha256.len() != 64 {
                return Err("缓存清单无效".into());
            }
            total = total.checked_add(file.bytes).ok_or("缓存文件过大")?;
            if total > MAX_UNPACKED {
                return Err("缓存文件过大".into());
            }
            // Check each component so an altered cache cannot redirect outside the private folder.
            let mut path = root.clone();
            for component in &relative {
                path.push(component);
                if fs::symlink_metadata(&path)
                    .map_err(|_| "缓存文件不存在")?
                    .file_type()
                    .is_symlink()
                {
                    return Err("缓存包含符号链接".into());
                }
            }
            let meta = fs::metadata(&path).map_err(|_| "缓存文件不存在")?;
            if !meta.is_file() || meta.len() != file.bytes {
                return Err("缓存文件大小不符".into());
            }
            if verify_hash && file_digest(&path, file.bytes, cancel)? != file.sha256 {
                return Err("缓存文件校验失败".into());
            }
        }
        let adb = root.join("platform-tools").join(adb_name());
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if fs::metadata(&adb)
                .map_err(|_| "缓存缺少 ADB")?
                .permissions()
                .mode()
                & 0o111
                == 0
            {
                return Err("ADB 不可执行".into());
            }
        }
        Ok(adb)
    })();
    cancelled(cancel)?;
    Ok(result.ok())
}
pub fn info(data_dir: &Path) -> Result<Info, String> {
    let spec = manifest()?;
    let archive = spec.archives.get(std::env::consts::OS);
    let installed = archive
        .map(|a| {
            cached(
                &data_dir.join("tools"),
                &spec,
                a,
                false,
                &AtomicBool::new(false),
            )
            .ok()
            .flatten()
            .is_some()
        })
        .unwrap_or(false);
    Ok(Info {
        version: spec.version,
        platform: std::env::consts::OS,
        download_bytes: archive.map(|a| a.bytes).unwrap_or(0),
        installed,
        supported: supported() && archive.is_some(),
        message: if !supported() {
            "此电脑架构暂不支持自动下载，请手动选择 ADB"
        } else if installed {
            "已下载官方工具，使用前会再次校验"
        } else {
            "从 Google 官方下载并自动配置，仅需准备一次"
        }
        .into(),
    })
}

struct Directory {
    path: PathBuf,
    keep: bool,
}
impl Drop for Directory {
    fn drop(&mut self) {
        if !self.keep {
            let _ = fs::remove_dir_all(&self.path);
        }
    }
}
fn private_directory(path: &Path) -> Result<(), String> {
    fs::create_dir(path).map_err(|_| "无法创建工具目录，请检查磁盘空间和权限".to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if fs::set_permissions(path, fs::Permissions::from_mode(0o700)).is_err() {
            let _ = fs::remove_dir(path);
            return Err("无法设置工具目录权限".into());
        }
    }
    Ok(())
}
fn clean_abandoned_downloads(tools: &Path) -> Result<(), String> {
    for entry in fs::read_dir(tools).map_err(|_| "无法读取工具目录")? {
        let entry = entry.map_err(|_| "无法读取工具目录")?;
        let name = entry.file_name();
        let Some((pid, timestamp)) = name
            .to_str()
            .and_then(|s| s.strip_prefix(".download-"))
            .and_then(|s| s.split_once('-'))
        else {
            continue;
        };
        if !pid.is_empty()
            && pid.bytes().all(|b| b.is_ascii_digit())
            && pid.parse::<u32>().is_ok()
            && !timestamp.is_empty()
            && timestamp.bytes().all(|b| b.is_ascii_digit())
            && timestamp.parse::<u128>().is_ok()
            && entry
                .file_type()
                .map_err(|_| "无法读取临时目录类型")?
                .is_dir()
        {
            // The cross-process lock guarantees that no active download owns this folder.
            fs::remove_dir_all(entry.path())
                .map_err(|_| "无法清理上次中断的下载，请检查目录权限")?;
        }
    }
    Ok(())
}
fn copy_download(
    reader: &mut impl Read,
    output: &mut File,
    archive: &Archive,
    cancel: &AtomicBool,
    report: Report<'_>,
) -> Result<(), String> {
    let mut digest = Sha256::new();
    let mut downloaded = 0;
    let mut buffer = [0u8; 65536];
    let started = Instant::now();
    let mut reported = Instant::now();
    progress(report, "downloading", 0, archive.bytes)?;
    loop {
        cancelled(cancel)?;
        if started.elapsed() > Duration::from_secs(600) {
            return Err("下载超时，请检查网络后重试".into());
        }
        let n = reader.read(&mut buffer).map_err(|_| {
            cancelled(cancel)
                .err()
                .unwrap_or_else(|| "下载中断或超时，请检查网络后重试".to_string())
        })?;
        cancelled(cancel)?;
        if n == 0 {
            break;
        }
        downloaded += n as u64;
        if downloaded > archive.bytes || downloaded > MAX_ARCHIVE {
            return Err("下载大小超出官方清单，已停止".into());
        }
        output
            .write_all(&buffer[..n])
            .map_err(|_| "无法保存下载，请检查磁盘空间".to_string())?;
        digest.update(&buffer[..n]);
        if reported.elapsed() >= Duration::from_millis(100) {
            progress(report, "downloading", downloaded, archive.bytes)?;
            reported = Instant::now();
        }
    }
    progress(report, "verifying", downloaded, archive.bytes)?;
    if downloaded != archive.bytes {
        return Err("下载文件不完整，请重试".into());
    }
    if format!("{:x}", digest.finalize()) != archive.sha256 {
        return Err("下载 SHA256 校验失败，未使用此文件，请重试".into());
    }
    output
        .sync_all()
        .map_err(|_| "无法保存完整下载文件".to_string())
}
fn download(
    path: &Path,
    archive: &Archive,
    cancel: &AtomicBool,
    report: Report<'_>,
) -> Result<(), String> {
    download_with(path, archive, cancel, report, download_one)
}

fn download_with(
    path: &Path,
    archive: &Archive,
    cancel: &AtomicBool,
    report: Report<'_>,
    mut fetch: impl FnMut(&Path, &Archive, &AtomicBool, Report<'_>) -> Result<(), String>,
) -> Result<(), String> {
    let mut errors = Vec::new();
    for url in std::iter::once(&archive.url).chain(archive.fallback_urls.iter()) {
        cancelled(cancel)?;
        progress(report, "downloading", 0, archive.bytes)?;
        let mut source = archive.clone();
        source.url = url.clone();
        match fetch(path, &source, cancel, report) {
            Ok(()) => return Ok(()),
            Err(error) => {
                cancelled(cancel)?;
                // Every source starts from a fresh file, including after a checksum failure.
                if path.exists() {
                    fs::remove_file(path).map_err(|_| "无法清理下载文件，已停止重试")?;
                }
                errors.push(error);
            }
        }
    }
    Err(format!(
        "Google 和备用镜像均下载失败，请检查网络或手动选择 ADB：{}",
        errors.join("；")
    ))
}

fn download_one(
    path: &Path,
    archive: &Archive,
    cancel: &AtomicBool,
    report: Report<'_>,
) -> Result<(), String> {
    let url = reqwest::Url::parse(&archive.url).map_err(|_| "官方地址无效")?;
    if url.scheme() != "https"
        || !match url.host_str() {
            Some("dl.google.com") => url
                .path()
                .starts_with("/android/repository/platform-tools_r"),
            Some("mirrors.cloud.tencent.com") => {
                url.path().starts_with("/AndroidSDK/platform-tools_r")
            }
            _ => false,
        }
        || url.port().is_some()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || !url.path().ends_with(".zip")
        || archive.bytes == 0
        || archive.bytes > MAX_ARCHIVE
    {
        return Err("只允许下载内置清单中的官方工具或腾讯镜像".into());
    }
    cancelled(cancel)?;
    // Blocking reqwest applies this timeout to connecting/receiving headers and each body read.
    // Keep the overall transfer bounded separately in copy_download.
    let client = reqwest::blocking::Client::builder()
        .https_only(true)
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(10))
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "无法准备 HTTPS 下载".to_string())?;
    let mut response = client
        .get(url)
        .header(reqwest::header::ACCEPT_ENCODING, "identity")
        .send()
        .map_err(|_| {
            cancelled(cancel)
                .err()
                .unwrap_or_else(|| "无法连接下载服务器".to_string())
        })?;
    cancelled(cancel)?;
    if response.status() != reqwest::StatusCode::OK {
        return Err(format!(
            "下载服务器返回 HTTP {}，请稍后重试",
            response.status().as_u16()
        ));
    }
    if response
        .content_length()
        .is_some_and(|n| n != archive.bytes)
    {
        return Err("服务器文件大小与官方清单不符，已停止下载".into());
    }
    let mut output = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|_| "无法创建下载文件".to_string())?;
    copy_download(&mut response, &mut output, archive, cancel, report)
}
fn extract(path: &Path, destination: &Path, cancel: &AtomicBool) -> Result<Installed, String> {
    let file = File::open(path).map_err(|_| "无法打开下载文件".to_string())?;
    let mut zip = zip::ZipArchive::new(file).map_err(|_| "下载文件不是有效的 ZIP".to_string())?;
    if zip.is_empty() || zip.len() > MAX_FILES {
        return Err("压缩包文件数量异常".into());
    }
    let mut files = Vec::new();
    let mut names = BTreeSet::new();
    let mut expanded = 0u64;
    for index in 0..zip.len() {
        cancelled(cancel)?;
        let mut entry = zip
            .by_index(index)
            .map_err(|_| "无法读取压缩包".to_string())?;
        let name = entry.name().map_err(|_| "ZIP 文件名编码无效")?.into_owned();
        let relative = relative_path(&name)?;
        if !names.insert(name.trim_end_matches('/').to_lowercase()) {
            return Err("压缩包包含重复路径".into());
        }
        let mode = entry
            .unix_mode()
            .unwrap_or(if entry.is_dir() { 0o40755 } else { 0o100644 });
        let kind = mode & 0o170000;
        if entry.is_symlink()
            || (kind != 0 && kind != 0o100000 && kind != 0o40000)
            || entry.is_dir() != (kind == 0o40000 || name.ends_with('/'))
        {
            return Err("压缩包包含不支持的链接或特殊文件".into());
        }
        let target = destination.join(&relative);
        if entry.is_dir() {
            fs::create_dir_all(&target).map_err(|_| "无法创建解压目录".to_string())?;
            continue;
        }
        expanded = expanded.checked_add(entry.size()).ok_or("解压大小异常")?;
        if expanded > MAX_UNPACKED {
            return Err("解压大小超出上限".into());
        }
        fs::create_dir_all(target.parent().ok_or("解压路径无效")?)
            .map_err(|_| "无法创建解压目录".to_string())?;
        let mut output = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&target)
            .map_err(|_| "无法创建工具文件".to_string())?;
        let mut digest = Sha256::new();
        let mut count = 0u64;
        let mut buffer = [0; 65536];
        loop {
            cancelled(cancel)?;
            let n = entry
                .read(&mut buffer)
                .map_err(|_| "ZIP 数据或 CRC 校验失败".to_string())?;
            if n == 0 {
                break;
            }
            count += n as u64;
            if count > entry.size() || count > MAX_UNPACKED {
                return Err("解压文件大小异常".into());
            }
            output
                .write_all(&buffer[..n])
                .map_err(|_| "解压失败，请检查磁盘空间".to_string())?;
            digest.update(&buffer[..n]);
        }
        if count != entry.size() {
            return Err("解压文件不完整".into());
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(
                &target,
                fs::Permissions::from_mode(if mode & 0o111 != 0 { 0o755 } else { 0o644 }),
            )
            .map_err(|_| "无法设置工具执行权限".to_string())?;
        }
        files.push(InstalledFile {
            path: name,
            bytes: count,
            sha256: format!("{:x}", digest.finalize()),
        });
    }
    if !required_files(&files) {
        return Err("官方工具包缺少 ADB、许可或运行库文件".into());
    }
    Ok(Installed {
        archive_sha256: String::new(),
        files,
    })
}
fn write_pointer(path: &Path, contents: &[u8]) -> Result<(), String> {
    let temporary = path.with_extension(format!("{}.tmp", nonce()));
    let result = (|| {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)
            .map_err(|_| "无法创建工具缓存记录")?;
        file.write_all(contents)
            .and_then(|_| file.sync_all())
            .map_err(|_| "无法保存工具缓存记录")?;
        fs::rename(&temporary, path).map_err(|_| "无法更新工具缓存记录")
    })();
    if result.is_err() {
        let _ = fs::remove_file(temporary);
    }
    result.map_err(str::to_string)
}

pub fn install<T>(
    data_dir: &Path,
    cancel: &AtomicBool,
    force_download: bool,
    report: impl FnMut(Progress) -> Result<(), String>,
    activate: impl FnOnce(&Path) -> Result<T, String>,
) -> Result<T, String> {
    if !supported() {
        return Err("此电脑架构不支持自动下载，请手动选择 ADB".into());
    }
    let spec = manifest()?;
    let archive = spec
        .archives
        .get(std::env::consts::OS)
        .ok_or("此系统没有官方工具包")?;
    install_with_mode(
        data_dir,
        &spec,
        archive,
        cancel,
        force_download,
        report,
        activate,
        download,
    )
}

#[cfg(test)]
fn install_with<T>(
    data_dir: &Path,
    spec: &Manifest,
    archive: &Archive,
    cancel: &AtomicBool,
    report: impl FnMut(Progress) -> Result<(), String>,
    activate: impl FnOnce(&Path) -> Result<T, String>,
    fetch: impl FnOnce(&Path, &Archive, &AtomicBool, Report<'_>) -> Result<(), String>,
) -> Result<T, String> {
    install_with_mode(
        data_dir, spec, archive, cancel, false, report, activate, fetch,
    )
}

fn install_with_mode<T>(
    data_dir: &Path,
    spec: &Manifest,
    archive: &Archive,
    cancel: &AtomicBool,
    force_download: bool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
    activate: impl FnOnce(&Path) -> Result<T, String>,
    fetch: impl FnOnce(&Path, &Archive, &AtomicBool, Report<'_>) -> Result<(), String>,
) -> Result<T, String> {
    let tools = data_dir.join("tools");
    fs::create_dir_all(&tools).map_err(|_| "无法创建工具存储目录".to_string())?;
    let lock = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(tools.join("install.lock"))
        .map_err(|_| "无法打开工具安装锁".to_string())?;
    lock.try_lock()
        .map_err(|_| "另一个管理器正在准备 ADB，请稍后重试".to_string())?;
    clean_abandoned_downloads(&tools)?;
    progress(&mut report, "verifying", 0, archive.bytes)?;
    if !force_download {
        if let Some(path) = cached(&tools, spec, archive, true, cancel)? {
            progress(&mut report, "checking", archive.bytes, archive.bytes)?;
            cancelled(cancel)?;
            return activate(&path);
        }
    }
    let id = nonce();
    let stage_path = tools.join(format!(".download-{id}"));
    private_directory(&stage_path)?;
    let mut stage = Directory {
        path: stage_path,
        keep: false,
    };
    let zip = stage.path.join("download.zip");
    fetch(&zip, archive, cancel, &mut report)?;
    progress(&mut report, "extracting", archive.bytes, archive.bytes)?;
    let mut installed = extract(&zip, &stage.path, cancel)?;
    installed.archive_sha256 = archive.sha256.clone();
    fs::remove_file(zip).map_err(|_| "无法清理下载缓存".to_string())?;
    fs::write(
        stage.path.join("installed.json"),
        serde_json::to_vec(&installed).map_err(|_| "无法生成工具记录")?,
    )
    .map_err(|_| "无法保存工具记录")?;
    cancelled(cancel)?;
    let name = format!("platform-tools-{}-{id}", spec.version);
    let completed = tools.join(&name);
    fs::rename(&stage.path, &completed).map_err(|_| "无法完成工具安装".to_string())?;
    stage.path = completed;
    let pointer_path = tools.join(format!("current-{}.json", spec.version));
    // A cache pointer is a disposable hint. An oversized/corrupt hint must not prevent repair.
    let previous = read_small(&pointer_path, 4096).ok();
    let pointer =
        serde_json::to_vec(&Pointer { directory: name }).map_err(|_| "无法生成缓存指针")?;
    write_pointer(&pointer_path, &pointer)?;
    let result = (|| {
        progress(&mut report, "checking", archive.bytes, archive.bytes)?;
        cancelled(cancel)?;
        activate(&stage.path.join("platform-tools").join(adb_name()))
    })();
    match result {
        Ok(value) => {
            stage.keep = true;
            Ok(value)
        }
        Err(error) => {
            let rollback = if let Some(bytes) = previous {
                write_pointer(&pointer_path, &bytes)
            } else {
                fs::remove_file(&pointer_path).map_err(|_| "无法恢复工具缓存指针".to_string())
            };
            if rollback.is_err() {
                // Retain the complete directory if its pointer could not be rolled back.
                stage.keep = true;
                return Err(format!(
                    "{error}；缓存记录恢复失败，原有 ADB 配置未更改，可重试"
                ));
            }
            Err(error)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    use std::sync::{atomic::AtomicU64, Arc};
    use zip::{write::SimpleFileOptions, CompressionMethod, ZipWriter};

    fn directory() -> Directory {
        static NEXT_DIRECTORY_ID: AtomicU64 = AtomicU64::new(0);
        let id = NEXT_DIRECTORY_ID.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!("puretv-tools-test-{}-{id}", nonce()));
        private_directory(&path).unwrap();
        Directory { path, keep: false }
    }
    fn fake_zip(extra: Option<(&str, bool)>) -> Vec<u8> {
        let mut zip = ZipWriter::new(Cursor::new(Vec::new()));
        let options = SimpleFileOptions::default()
            .compression_method(CompressionMethod::Deflated)
            .unix_permissions(0o755);
        let mut names = vec![
            format!("platform-tools/{}", adb_name()),
            "platform-tools/NOTICE.txt".into(),
            "platform-tools/source.properties".into(),
        ];
        if cfg!(windows) {
            names.extend([
                "platform-tools/AdbWinApi.dll".into(),
                "platform-tools/AdbWinUsbApi.dll".into(),
            ]);
        }
        for name in names {
            zip.start_file(name, options).unwrap();
            zip.write_all(b"verified test data").unwrap();
        }
        if let Some((name, symlink)) = extra {
            if symlink {
                zip.add_symlink(name, "../../outside", options).unwrap();
            } else {
                zip.start_file(name, options).unwrap();
                zip.write_all(b"bad").unwrap();
            }
        }
        zip.finish().unwrap().into_inner()
    }
    fn test_archive(bytes: &[u8]) -> Archive {
        Archive {
            url: "https://dl.google.com/android/repository/platform-tools_r37.0.1-test.zip".into(),
            fallback_urls: vec![],
            bytes: bytes.len() as u64,
            sha256: format!("{:x}", Sha256::digest(bytes)),
        }
    }
    fn local_fetch<'a>(
        bytes: &'a [u8],
    ) -> impl FnOnce(&Path, &Archive, &AtomicBool, Report<'_>) -> Result<(), String> + 'a {
        move |path, archive, cancel, report| {
            let mut file = File::create(path).unwrap();
            copy_download(&mut Cursor::new(bytes), &mut file, archive, cancel, report)
        }
    }
    fn pointer_path(root: &Path) -> PathBuf {
        root.join("tools/current-37.0.1.json")
    }
    fn installed_dirs(root: &Path) -> usize {
        fs::read_dir(root.join("tools"))
            .unwrap()
            .flatten()
            .filter(|entry| entry.file_type().unwrap().is_dir())
            .count()
    }
    #[test]
    fn fallback_discards_partial_or_corrupt_download_before_retry() {
        let root = directory();
        let path = root.path.join("download.zip");
        for bad in [b"partial".as_slice(), b"tampered"] {
            let mut archive = test_archive(b"complete");
            archive.fallback_urls.push(
                "https://mirrors.cloud.tencent.com/AndroidSDK/platform-tools_r37.0.1-test.zip"
                    .into(),
            );
            let mut calls = Vec::new();
            download_with(
                &path,
                &archive,
                &AtomicBool::new(false),
                &mut |_| Ok(()),
                |path, source, cancel, report| {
                    assert!(!path.exists(), "A retry must not reuse the previous file");
                    calls.push(source.url.clone());
                    let bytes = if calls.len() == 1 { bad } else { b"complete" };
                    let mut output = File::create(path).unwrap();
                    copy_download(&mut Cursor::new(bytes), &mut output, source, cancel, report)
                },
            )
            .unwrap();
            assert_eq!(calls, vec![archive.url, archive.fallback_urls[0].clone()]);
            assert_eq!(fs::read(&path).unwrap(), b"complete");
            fs::remove_file(&path).unwrap();
        }
    }

    #[test]
    fn fallback_stops_after_cancellation_and_reports_exhausted_sources() {
        let root = directory();
        let path = root.path.join("download.zip");
        let mut archive = test_archive(b"complete");
        archive.fallback_urls.push(
            "https://mirrors.cloud.tencent.com/AndroidSDK/platform-tools_r37.0.1-test.zip".into(),
        );
        for should_cancel in [false, true] {
            let cancel = AtomicBool::new(false);
            let mut calls = 0;
            let result = download_with(
                &path,
                &archive,
                &cancel,
                &mut |_| Ok(()),
                |_, _, cancel, _| {
                    calls += 1;
                    cancel.store(should_cancel, Ordering::Release);
                    Err("network unavailable".into())
                },
            );
            assert!(result.is_err());
            assert_eq!(calls, if should_cancel { 1 } else { 2 });
            assert!(result.unwrap_err().contains(if should_cancel {
                "取消"
            } else {
                "均下载失败"
            }));
        }
    }

    #[test]
    fn download_rejects_truncation_oversize_bad_hash_and_cancellation() {
        let root = directory();
        let archive = test_archive(b"complete");
        for bytes in [b"complet".as_slice(), b"complete!", b"tampered"] {
            let mut output = File::create(root.path.join("test.zip")).unwrap();
            assert!(copy_download(
                &mut Cursor::new(bytes),
                &mut output,
                &archive,
                &AtomicBool::new(false),
                &mut |_| Ok(())
            )
            .is_err());
        }
        let mut output = File::create(root.path.join("test.zip")).unwrap();
        assert!(copy_download(
            &mut Cursor::new(b"complete"),
            &mut output,
            &archive,
            &AtomicBool::new(true),
            &mut |_| Ok(())
        )
        .unwrap_err()
        .contains("取消"));
    }
    #[test]
    fn extraction_rejects_traversal_absolute_windows_paths_and_symlinks() {
        for (name, symlink) in [
            ("platform-tools/../../escape", false),
            ("/outside", false),
            ("platform-tools\\..\\outside", false),
            ("platform-tools/evil:ads", false),
            ("platform-tools/link", true),
        ] {
            let root = directory();
            let zip = root.path.join("download.zip");
            fs::write(&zip, fake_zip(Some((name, symlink)))).unwrap();
            assert!(
                extract(&zip, &root.path, &AtomicBool::new(false)).is_err(),
                "Rejected {name}"
            );
        }
    }
    #[test]
    fn complete_cache_is_reused_offline_and_all_runtime_files_are_retained() {
        let root = directory();
        let bytes = fake_zip(None);
        let archive = test_archive(&bytes);
        let spec = manifest().unwrap();
        let cancel = AtomicBool::new(false);
        let first = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            local_fetch(&bytes),
        )
        .unwrap();
        let second = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            |_, _, _, _| panic!("Complete cache must work offline"),
        )
        .unwrap();
        assert_eq!(first, second);
        assert_eq!(installed_dirs(&root.path), 1);
        assert!(first.parent().unwrap().join("NOTICE.txt").is_file());
        if cfg!(windows) {
            assert!(first.parent().unwrap().join("AdbWinApi.dll").is_file());
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_ne!(fs::metadata(first).unwrap().permissions().mode() & 0o111, 0);
        }
    }
    #[test]
    fn forced_download_bypasses_valid_cache_and_keeps_previous_binary() {
        let root = directory();
        let bytes = fake_zip(None);
        let spec = manifest().unwrap();
        let archive = test_archive(&bytes);
        let cancel = AtomicBool::new(false);
        let first = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            local_fetch(&bytes),
        )
        .unwrap();
        let fetched = std::cell::Cell::new(false);
        let second = install_with_mode(
            &root.path,
            &spec,
            &archive,
            &cancel,
            true,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            |path, archive, cancel, report| {
                fetched.set(true);
                local_fetch(&bytes)(path, archive, cancel, report)
            },
        )
        .unwrap();
        assert!(
            fetched.get(),
            "A valid cache must not suppress a requested re-download"
        );
        assert_ne!(first, second);
        assert_eq!(fs::read(&first).unwrap(), fs::read(&second).unwrap());
        assert_eq!(installed_dirs(&root.path), 2);
        let reused = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            |_, _, _, _| panic!("Freshly downloaded tools should be reusable offline"),
        )
        .unwrap();
        assert_eq!(reused, second);
    }
    #[test]
    fn failed_or_cancelled_forced_download_preserves_old_cache_and_configuration() {
        for failure in ["download", "cancel", "activate"] {
            let root = directory();
            let bytes = fake_zip(None);
            let spec = manifest().unwrap();
            let archive = test_archive(&bytes);
            let cancel = AtomicBool::new(false);
            let first = install_with(
                &root.path,
                &spec,
                &archive,
                &cancel,
                |_| Ok(()),
                |path| Ok(path.to_path_buf()),
                local_fetch(&bytes),
            )
            .unwrap();
            let previous = fs::read(pointer_path(&root.path)).unwrap();
            let result: Result<(), String> = install_with_mode(
                &root.path,
                &spec,
                &archive,
                &cancel,
                true,
                |_| Ok(()),
                |_| {
                    assert_eq!(failure, "activate");
                    Err("activation failed".into())
                },
                |path, archive, cancel, report| {
                    if failure == "download" {
                        return Err("download failed".into());
                    }
                    local_fetch(&bytes)(path, archive, cancel, report)?;
                    if failure == "cancel" {
                        cancel.store(true, Ordering::Release);
                    }
                    Ok(())
                },
            );
            assert!(result.is_err());
            assert_eq!(fs::read(pointer_path(&root.path)).unwrap(), previous);
            assert_eq!(fs::read(first).unwrap(), b"verified test data");
            assert_eq!(installed_dirs(&root.path), 1);
        }
    }
    #[test]
    fn damaged_cache_repairs_in_new_directory_and_failed_activation_rolls_back() {
        let root = directory();
        let bytes = fake_zip(None);
        let archive = test_archive(&bytes);
        let spec = manifest().unwrap();
        let cancel = AtomicBool::new(false);
        let first = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            local_fetch(&bytes),
        )
        .unwrap();
        let previous = fs::read(pointer_path(&root.path)).unwrap();
        fs::write(&first, b"corrupted test dat").unwrap();
        let failed: Result<(), String> = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |_| Err("Cannot save ADB configuration".into()),
            local_fetch(&bytes),
        );
        assert!(failed.is_err());
        assert_eq!(fs::read(pointer_path(&root.path)).unwrap(), previous);
        assert_eq!(
            installed_dirs(&root.path),
            1,
            "Failed install leaves no fresh or staging directories"
        );
        let second = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            local_fetch(&bytes),
        )
        .unwrap();
        assert_ne!(first, second);
        assert_eq!(
            fs::read(first).unwrap(),
            b"corrupted test dat",
            "Never overwrite a previously configured binary"
        );
        assert_eq!(fs::read(second).unwrap(), b"verified test data");
    }
    #[test]
    fn oversized_pointer_does_not_prevent_cache_repair() {
        let root = directory();
        fs::create_dir(root.path.join("tools")).unwrap();
        fs::write(pointer_path(&root.path), vec![b'x'; 5000]).unwrap();
        let bytes = fake_zip(None);
        let path = install_with(
            &root.path,
            &manifest().unwrap(),
            &test_archive(&bytes),
            &AtomicBool::new(false),
            |_| Ok(()),
            |path| Ok(path.to_path_buf()),
            local_fetch(&bytes),
        )
        .unwrap();
        assert!(path.is_file());
        assert!(fs::metadata(pointer_path(&root.path)).unwrap().len() < 4096);
    }
    #[test]
    fn cancel_or_bad_archive_cleans_partial_files_without_activation() {
        for cancel_after_download in [false, true] {
            let root = directory();
            let bytes = fake_zip(None);
            let mut archive = test_archive(&bytes);
            if !cancel_after_download {
                archive.sha256 = "0".repeat(64);
            }
            let cancel = AtomicBool::new(false);
            let result: Result<(), String> = install_with(
                &root.path,
                &manifest().unwrap(),
                &archive,
                &cancel,
                |p| {
                    if p.stage == "extracting" {
                        cancel.store(true, Ordering::Release);
                    }
                    Ok(())
                },
                |_| panic!("Canceled or untrusted archive must never activate"),
                local_fetch(&bytes),
            );
            assert!(result.is_err());
            assert_eq!(installed_dirs(&root.path), 0);
            assert!(!pointer_path(&root.path).exists());
        }
    }
    #[test]
    fn a_second_installer_cannot_download_while_lock_is_held() {
        let root = directory();
        fs::create_dir(root.path.join("tools")).unwrap();
        let lock = File::create(root.path.join("tools/install.lock")).unwrap();
        lock.lock().unwrap();
        let bytes = fake_zip(None);
        let result: Result<(), String> = install_with(
            &root.path,
            &manifest().unwrap(),
            &test_archive(&bytes),
            &AtomicBool::new(false),
            |_| Ok(()),
            |_| Ok(()),
            |_, _, _, _| panic!("Lock must precede download"),
        );
        assert!(result.unwrap_err().contains("另一个管理器"));
    }
    #[test]
    fn interrupted_download_cleanup_only_removes_our_temporary_directories() {
        let root = directory();
        let abandoned = root.path.join(".download-123-456");
        let unrelated = root.path.join(".download-other-project");
        let installed = root.path.join("platform-tools-37.0.1-123-456");
        for path in [&abandoned, &unrelated, &installed] {
            fs::create_dir(path).unwrap();
        }
        fs::write(abandoned.join("download.zip"), b"partial").unwrap();
        #[cfg(unix)]
        {
            std::os::unix::fs::symlink(&unrelated, root.path.join(".download-111-222")).unwrap();
        }
        clean_abandoned_downloads(&root.path).unwrap();
        assert!(!abandoned.exists());
        assert!(unrelated.exists());
        assert!(installed.exists());
        #[cfg(unix)]
        {
            assert!(fs::symlink_metadata(root.path.join(".download-111-222"))
                .unwrap()
                .file_type()
                .is_symlink());
        }
    }
    #[test]
    #[ignore = "Downloads the pinned Tencent mirror package and executes adb version; no device commands"]
    fn mirror_download_and_adb_check() {
        let root = directory();
        let cancel = Arc::new(AtomicBool::new(false));
        let mut manager = puretv_core::Manager::new(root.path.clone(), cancel.clone());
        let spec = manifest().unwrap();
        let mut archive = spec.archives.get(std::env::consts::OS).unwrap().clone();
        archive.url = archive.fallback_urls.remove(0);
        let state = install_with(
            &root.path,
            &spec,
            &archive,
            &cancel,
            |_| Ok(()),
            |path| {
                manager.execute(puretv_core::Request::SetAdbPath {
                    path: path.to_string_lossy().into_owned(),
                })
            },
            download,
        )
        .unwrap();
        assert!(state.adb_available);
        assert!(state.device.is_none());
    }

    #[test]
    #[ignore = "Downloads the pinned Google package and executes adb version; no device commands"]
    fn official_download_and_offline_reuse() {
        let root = directory();
        let cancel = Arc::new(AtomicBool::new(false));
        let mut manager = puretv_core::Manager::new(root.path.clone(), cancel.clone());
        let state = install(
            &root.path,
            &cancel,
            false,
            |p| {
                if p.stage != "downloading" {
                    println!("Platform Tools: {}", p.stage);
                }
                Ok(())
            },
            |path| {
                manager.execute(puretv_core::Request::SetAdbPath {
                    path: path.to_string_lossy().into_owned(),
                })
            },
        )
        .unwrap();
        assert!(state.adb_available);
        assert!(state.device.is_none());
        let spec = manifest().unwrap();
        let reused = install_with(
            &root.path,
            &spec,
            spec.archives.get(std::env::consts::OS).unwrap(),
            &cancel,
            |_| Ok(()),
            |path| {
                manager.execute(puretv_core::Request::SetAdbPath {
                    path: path.to_string_lossy().into_owned(),
                })
            },
            |_, _, _, _| panic!("Verified official cache must reuse offline"),
        )
        .unwrap();
        assert_eq!(state.adb_path, reused.adb_path);
        let mut reopened = puretv_core::Manager::new(root.path.clone(), cancel);
        assert_eq!(
            reopened
                .execute(puretv_core::Request::GetState)
                .unwrap()
                .adb_path,
            state.adb_path
        );
        println!("Official tools download, adb version, persistence and offline reuse passed");
    }
}
