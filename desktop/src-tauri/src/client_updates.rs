//! Desktop update discovery and downloads from the fixed public client directory.
//! This module never starts an installer; the caller owns the application lifecycle.
use crate::app_store::{self, FileMetadata};
use reqwest::{
    blocking::{Client, Response},
    header, redirect, Method, Url,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const SOURCE_URL: &str = "https://apps.b14f.com/client/";
const MAX_JSON: u64 = 16 * 1024 * 1024;
const MAX_PACKAGE: u64 = 512 * 1024 * 1024;
const METADATA_TIMEOUT: Duration = Duration::from_secs(60);
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(15 * 60);
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Info {
    pub current_version: String,
    pub platform: String,
    pub supported: bool,
    pub status: &'static str,
    pub available: bool,
    pub latest_version: Option<String>,
    pub revision: Option<String>,
    pub file_name: Option<String>,
    pub bytes: Option<u64>,
    pub source_url: &'static str,
    pub checked_at: u64,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub stage: &'static str,
    pub downloaded: u64,
    pub total: u64,
}
/// An installer receives only this verified, backend-created value, never paths
/// or hashes supplied by the webview. It should recheck SHA256 before execution.
#[derive(Clone, Debug)]
pub struct Downloaded {
    pub path: PathBuf,
    pub version: String,
    pub platform: String,
    pub file_name: String,
    pub bytes: u64,
    /// Retained for installer fixture compatibility; HTTP packages have no Git blob SHA.
    pub blob_sha: String,
    pub sha256: String,
    pub revision: String,
}
#[derive(Clone, Debug)]
struct Candidate {
    version: String,
    platform: String,
    file_name: String,
    metadata: FileMetadata,
    revision: String,
}
#[derive(Default)]
struct Selection {
    candidate: Option<Candidate>,
}
pub struct State {
    directory: PathBuf,
    selection: Mutex<Selection>,
}
/// A local receipt detects later cache corruption. It is not a server signature.
#[derive(Serialize, Deserialize)]
struct Receipt {
    revision: String,
    bytes: u64,
    sha256: String,
}

pub fn platform() -> &'static str {
    if cfg!(all(target_os = "windows", target_arch = "x86_64")) {
        "windows-x64"
    } else if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        "macos-arm64"
    } else if cfg!(all(target_os = "macos", target_arch = "x86_64")) {
        "macos-x64"
    } else if cfg!(all(target_os = "linux", target_arch = "x86_64")) {
        "linux-x64"
    } else {
        "unsupported"
    }
}
fn suffix(platform: &str) -> Option<&'static str> {
    match platform {
        "windows-x64" => Some("windows-x64-setup.exe"),
        "macos-arm64" => Some("macos-arm64.dmg"),
        "macos-x64" => Some("macos-x64.dmg"),
        "linux-x64" => Some("linux-x64.deb"),
        _ => None,
    }
}
fn version(value: &str) -> Option<[u64; 3]> {
    let mut result = [0; 3];
    let parts: Vec<_> = value.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    for (index, part) in parts.iter().enumerate() {
        if part.is_empty()
            || part.len() > 10
            || (part.len() > 1 && part.starts_with('0'))
            || !part.bytes().all(|byte| byte.is_ascii_digit())
        {
            return None;
        }
        result[index] = part.parse().ok()?;
    }
    Some(result)
}
fn valid_sha(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}
fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .min(u64::MAX as u128) as u64
}
fn check_cancel(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Acquire) {
        Err("客户端更新已取消，当前版本未更改".into())
    } else {
        Ok(())
    }
}
fn active(cancel: &AtomicBool, deadline: Instant) -> Result<(), String> {
    check_cancel(cancel)?;
    if Instant::now() >= deadline {
        Err("客户端更新请求超时，请重试".into())
    } else {
        Ok(())
    }
}
fn raw_url(candidate: &Candidate) -> String {
    app_store::file_url(&format!("client/{}", candidate.file_name)).expect("validated package name")
}
fn allowed_url(url: &Url) -> bool {
    app_store::allowed_url(url) && url.path().starts_with("/client/")
}
fn client() -> Result<Client, String> {
    Client::builder()
        .https_only(true)
        .redirect(redirect::Policy::none())
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(10))
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "无法准备客户端更新连接".into())
}
fn response(
    client: &Client,
    address: &str,
    method: Method,
    expected: Option<&FileMetadata>,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<Response, String> {
    let mut url = Url::parse(address).map_err(|_| "客户端更新地址无效")?;
    for hop in 0..=5 {
        active(cancel, deadline)?;
        if !allowed_url(&url) {
            return Err("客户端更新返回了不受支持的下载地址".into());
        }
        // The blocking client's timeout bounds send/each Read separately. Do not
        // set RequestBuilder::timeout: it also becomes an async whole-body limit.
        // The explicit deadline below bounds the complete transfer independently.
        let mut request = client
            .request(method.clone(), url.clone())
            .header(header::ACCEPT_ENCODING, "identity");
        if let Some(metadata) = expected {
            request = app_store::apply_conditions(request, metadata);
        }
        let value = request.send().map_err(|_| {
            check_cancel(cancel)
                .err()
                .unwrap_or_else(|| "无法连接客户端更新服务器，请检查网络后重试".into())
        })?;
        active(cancel, deadline)?;
        if value.status().is_redirection() {
            if hop == 5 {
                return Err("客户端更新重定向过多".into());
            }
            let location = value
                .headers()
                .get(header::LOCATION)
                .and_then(|v| v.to_str().ok())
                .ok_or("客户端更新重定向无效")?;
            url = url.join(location).map_err(|_| "客户端更新重定向无效")?;
        } else {
            return Ok(value);
        }
    }
    Err("客户端更新下载失败".into())
}
fn require_ok(response: Response) -> Result<Response, String> {
    if response.status() == reqwest::StatusCode::OK {
        Ok(response)
    } else {
        Err(format!(
            "客户端更新服务器返回 HTTP {}，请稍后重试",
            response.status().as_u16()
        ))
    }
}
fn read_bounded(
    mut input: impl Read,
    maximum: u64,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    let mut buffer = [0; 65_536];
    loop {
        active(cancel, deadline)?;
        let count = input.read(&mut buffer).map_err(|_| {
            check_cancel(cancel)
                .err()
                .unwrap_or_else(|| "客户端更新数据读取中断，请重试".into())
        })?;
        active(cancel, deadline)?;
        if count == 0 {
            break;
        }
        if bytes.len() as u64 + count as u64 > maximum {
            return Err("客户端更新数据超过大小限制".into());
        }
        bytes.extend_from_slice(&buffer[..count]);
    }
    Ok(bytes)
}
fn fetch_directory(
    client: &Client,
    url: &str,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<Vec<u8>, String> {
    let response = require_ok(response(client, url, Method::GET, None, cancel, deadline)?)?;
    if response.content_length().is_some_and(|n| n > MAX_JSON) {
        return Err("客户端更新目录过大".into());
    }
    read_bounded(response, MAX_JSON, cancel, deadline)
}
fn fetch_metadata(
    client: &Client,
    url: &str,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<FileMetadata, String> {
    let value = require_ok(response(client, url, Method::HEAD, None, cancel, deadline)?)?;
    app_store::metadata_from_headers(value.headers(), MAX_PACKAGE)
}
fn select_file(bytes: &[u8], target: &str) -> Result<Option<(String, String)>, String> {
    let ending = suffix(target).ok_or("当前平台不支持自动更新")?;
    let entries = app_store::parse_directory(bytes, "client")?;
    let mut selected: Option<(String, String)> = None;
    for entry in entries {
        if entry.directory {
            continue;
        }
        let Some(file_name) = entry.path.strip_prefix("client/") else {
            continue;
        };
        if file_name.contains('/') {
            continue;
        }
        let Some(value) = file_name
            .strip_prefix("pureTV-Manager-")
            .and_then(|s| s.strip_suffix(&format!("-{ending}")))
        else {
            continue;
        };
        let Some(parsed) = version(value) else {
            continue;
        };
        if selected
            .as_ref()
            .is_none_or(|(old, _)| parsed > version(old).unwrap())
        {
            selected = Some((value.into(), file_name.into()));
        }
    }
    Ok(selected)
}
fn discover(
    target: &str,
    cancel: &AtomicBool,
    mut fetch: impl FnMut(&str) -> Result<Vec<u8>, String>,
    mut head: impl FnMut(&str) -> Result<FileMetadata, String>,
) -> Result<(String, Option<Candidate>), String> {
    check_cancel(cancel)?;
    let listing = fetch(SOURCE_URL)?;
    if listing.len() as u64 > MAX_JSON {
        return Err("客户端更新目录过大".into());
    }
    let Some((version, file_name)) = select_file(&listing, target)? else {
        return Ok((format!("{:x}", Sha256::digest(&listing)), None));
    };
    check_cancel(cancel)?;
    let path = format!("client/{file_name}");
    let metadata = head(&app_store::file_url(&path)?)?;
    if metadata.bytes == 0 || metadata.bytes > MAX_PACKAGE {
        return Err("客户端安装包目录信息无效，请稍后重试".into());
    }
    let revision = app_store::fingerprint(&path, &metadata);
    check_cancel(cancel)?;
    Ok((
        revision.clone(),
        Some(Candidate {
            version,
            platform: target.into(),
            file_name,
            metadata,
            revision,
        }),
    ))
}
fn info(
    target: &str,
    current: &str,
    revision: Option<String>,
    candidate: Option<&Candidate>,
) -> Result<Info, String> {
    let current_number = version(current).ok_or("当前客户端版本无效，无法检查更新")?;
    let supported = suffix(target).is_some();
    let available =
        candidate.is_some_and(|c| version(&c.version).is_some_and(|v| v > current_number));
    Ok(Info {
        current_version: current.into(),
        platform: target.into(),
        supported,
        status: if !supported {
            "unsupported"
        } else if candidate.is_none() {
            "notPublished"
        } else if available {
            "available"
        } else {
            "upToDate"
        },
        available,
        latest_version: candidate.map(|c| c.version.clone()),
        revision,
        file_name: candidate.map(|c| c.file_name.clone()),
        bytes: candidate.map(|c| c.metadata.bytes),
        source_url: SOURCE_URL,
        checked_at: now_ms(),
    })
}
fn hash_file(
    path: &Path,
    candidate: &Candidate,
    cancel: &AtomicBool,
) -> Result<Option<String>, String> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => return Err("无法读取客户端更新缓存".into()),
    };
    if !metadata.is_file() || metadata.len() != candidate.metadata.bytes {
        return Ok(None);
    }
    let mut input = File::open(path).map_err(|_| "无法读取客户端更新缓存")?;
    let mut sha = Sha256::new();
    let mut count = 0;
    let mut buffer = [0; 65_536];
    loop {
        check_cancel(cancel)?;
        let n = input
            .read(&mut buffer)
            .map_err(|_| "无法校验客户端更新缓存")?;
        if n == 0 {
            break;
        }
        count += n as u64;
        if count > candidate.metadata.bytes {
            return Ok(None);
        }
        sha.update(&buffer[..n]);
    }
    if count != candidate.metadata.bytes {
        return Ok(None);
    }
    let digest = format!("{:x}", sha.finalize());
    let receipt_path = path.with_extension("receipt.json");
    let receipt = match fs::symlink_metadata(&receipt_path) {
        Ok(metadata) if metadata.is_file() && metadata.len() <= 4096 => fs::read(&receipt_path)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Receipt>(&bytes).ok()),
        _ => None,
    };
    Ok(receipt
        .filter(|r| r.revision == candidate.revision && r.bytes == count && r.sha256 == digest)
        .map(|_| digest))
}
fn copy_verified(
    mut input: impl Read,
    mut output: impl Write,
    candidate: &Candidate,
    cancel: &AtomicBool,
    deadline: Instant,
    mut report: impl FnMut(Progress) -> Result<(), String>,
    stage: &'static str,
) -> Result<String, String> {
    let mut sha = Sha256::new();
    let mut downloaded = 0;
    let mut buffer = [0; 65_536];
    let mut last = Instant::now() - Duration::from_secs(1);
    loop {
        active(cancel, deadline)?;
        let count = input.read(&mut buffer).map_err(|_| {
            check_cancel(cancel)
                .err()
                .unwrap_or_else(|| "客户端安装包下载中断，请重试".into())
        })?;
        active(cancel, deadline)?;
        if count == 0 {
            break;
        }
        if downloaded + count as u64 > candidate.metadata.bytes {
            return Err("客户端安装包大小与目录不一致".into());
        }
        output
            .write_all(&buffer[..count])
            .map_err(|_| "无法保存客户端安装包")?;
        sha.update(&buffer[..count]);
        downloaded += count as u64;
        if last.elapsed() >= Duration::from_millis(150) {
            report(Progress {
                stage,
                downloaded: if stage == "verifying" {
                    candidate.metadata.bytes
                } else {
                    downloaded
                },
                total: candidate.metadata.bytes,
            })?;
            last = Instant::now();
        }
    }
    check_cancel(cancel)?;
    if downloaded != candidate.metadata.bytes {
        return Err("客户端安装包校验失败，请重新检查更新".into());
    }
    output.flush().map_err(|_| "无法保存客户端安装包")?;
    report(Progress {
        stage: "verifying",
        downloaded,
        total: candidate.metadata.bytes,
    })?;
    Ok(format!("{:x}", sha.finalize()))
}
fn transfer(
    candidate: &Candidate,
    output: impl Write,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<String, String> {
    let client = client()?;
    let deadline = Instant::now() + DOWNLOAD_TIMEOUT;
    transfer_with(candidate, output, cancel, &mut report, deadline, |url| {
        response(
            &client,
            url,
            Method::GET,
            Some(&candidate.metadata),
            cancel,
            deadline,
        )
    })
}
fn transfer_with(
    candidate: &Candidate,
    output: impl Write,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
    deadline: Instant,
    mut fetch: impl FnMut(&str) -> Result<Response, String>,
) -> Result<String, String> {
    active(cancel, deadline)?;
    let raw = fetch(&raw_url(candidate))?;
    active(cancel, deadline)?;
    if raw.status() == reqwest::StatusCode::PRECONDITION_FAILED {
        return Err("客户端更新目录已变化，请重新检查更新".into());
    }
    let raw = require_ok(raw)?;
    app_store::check_response_metadata(raw.headers(), &candidate.metadata)?;
    report(Progress {
        stage: "downloading",
        downloaded: 0,
        total: candidate.metadata.bytes,
    })?;
    copy_verified(
        raw,
        output,
        candidate,
        cancel,
        deadline,
        &mut report,
        "downloading",
    )
}
fn save_receipt(path: &Path, candidate: &Candidate, sha256: &str) -> Result<(), String> {
    let receipt = Receipt {
        revision: candidate.revision.clone(),
        bytes: candidate.metadata.bytes,
        sha256: sha256.into(),
    };
    let temporary = Temporary(path.with_extension(format!(
        "receipt-{}-{}.part",
        std::process::id(),
        NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
    )));
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temporary.0)
        .map_err(|_| "无法保存客户端更新校验记录")?;
    serde_json::to_writer(&mut file, &receipt).map_err(|_| "无法保存客户端更新校验记录")?;
    file.sync_all().map_err(|_| "无法保存客户端更新校验记录")?;
    drop(file);
    fs::rename(&temporary.0, path.with_extension("receipt.json"))
        .map_err(|_| "无法保存客户端更新校验记录".into())
}
struct Temporary(PathBuf);
impl Drop for Temporary {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

impl State {
    pub fn new(directory: PathBuf) -> Self {
        Self {
            directory,
            selection: Mutex::new(Selection::default()),
        }
    }
    pub fn check(
        &self,
        cancel: &AtomicBool,
        mut report: impl FnMut(Progress) -> Result<(), String>,
    ) -> Result<Info, String> {
        self.check_with(
            platform(),
            env!("CARGO_PKG_VERSION"),
            cancel,
            &mut report,
            |url, deadline| fetch_directory(&client()?, url, cancel, deadline),
            |url, deadline| fetch_metadata(&client()?, url, cancel, deadline),
        )
    }
    fn check_with(
        &self,
        target: &str,
        current: &str,
        cancel: &AtomicBool,
        mut report: impl FnMut(Progress) -> Result<(), String>,
        mut fetch: impl FnMut(&str, Instant) -> Result<Vec<u8>, String>,
        mut head: impl FnMut(&str, Instant) -> Result<FileMetadata, String>,
    ) -> Result<Info, String> {
        let mut selection = self.selection.lock().map_err(|_| "客户端更新状态不可用")?;
        selection.candidate = None;
        check_cancel(cancel)?;
        report(Progress {
            stage: "checking",
            downloaded: 0,
            total: 0,
        })?;
        if suffix(target).is_none() {
            return info(target, current, None, None);
        }
        let deadline = Instant::now() + METADATA_TIMEOUT;
        let (revision, latest) = discover(
            target,
            cancel,
            |url| {
                active(cancel, deadline)?;
                fetch(url, deadline)
            },
            |url| {
                active(cancel, deadline)?;
                head(url, deadline)
            },
        )?;
        let value = info(target, current, Some(revision), latest.as_ref())?;
        if value.available {
            selection.candidate = latest;
        }
        Ok(value)
    }
    pub fn download(
        &self,
        expected_version: &str,
        expected_revision: &str,
        cancel: &AtomicBool,
        report: impl FnMut(Progress) -> Result<(), String>,
    ) -> Result<Downloaded, String> {
        self.download_with(
            expected_version,
            expected_revision,
            cancel,
            report,
            |candidate, output, cancel, report| transfer(candidate, output, cancel, report),
        )
    }
    fn download_with(
        &self,
        expected_version: &str,
        expected_revision: &str,
        cancel: &AtomicBool,
        mut report: impl FnMut(Progress) -> Result<(), String>,
        mut transfer: impl FnMut(
            &Candidate,
            &mut File,
            &AtomicBool,
            &mut dyn FnMut(Progress) -> Result<(), String>,
        ) -> Result<String, String>,
    ) -> Result<Downloaded, String> {
        check_cancel(cancel)?;
        if version(expected_version).is_none() || !valid_sha(expected_revision) {
            return Err("客户端更新版本信息无效，请重新检查更新".into());
        }
        let candidate = self
            .selection
            .lock()
            .map_err(|_| "客户端更新状态不可用")?
            .candidate
            .clone()
            .ok_or("没有已确认的客户端更新，请先检查更新")?;
        if candidate.version != expected_version || candidate.revision != expected_revision {
            return Err("客户端更新目录已变化，请重新检查更新".into());
        }
        let root = self
            .directory
            .join("client-updates/http-packages")
            .join(&candidate.revision);
        fs::create_dir_all(&root).map_err(|_| "无法创建客户端更新目录")?;
        let path = root.join(&candidate.file_name);
        report(Progress {
            stage: "verifying",
            downloaded: 0,
            total: candidate.metadata.bytes,
        })?;
        let sha256 = if let Some(sha) = hash_file(&path, &candidate, cancel)? {
            sha
        } else {
            let nonce = NEXT_TEMP.fetch_add(1, Ordering::Relaxed);
            let temporary = Temporary(root.join(format!(
                "download-{}-{}-{nonce}.part",
                std::process::id(),
                now_ms()
            )));
            let mut output = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temporary.0)
                .map_err(|_| "无法创建客户端更新临时文件")?;
            let sha = transfer(&candidate, &mut output, cancel, &mut report)?;
            output.sync_all().map_err(|_| "无法保存客户端安装包")?;
            drop(output);
            check_cancel(cancel)?;
            fs::rename(&temporary.0, &path).map_err(|_| "无法完成客户端安装包下载")?;
            save_receipt(&path, &candidate, &sha)?;
            sha
        };
        check_cancel(cancel)?;
        report(Progress {
            stage: "verifying",
            downloaded: candidate.metadata.bytes,
            total: candidate.metadata.bytes,
        })?;
        Ok(Downloaded {
            path,
            version: candidate.version,
            platform: candidate.platform,
            file_name: candidate.file_name,
            bytes: candidate.metadata.bytes,
            blob_sha: String::new(),
            sha256,
            revision: candidate.revision,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const DATE: &str = "Sun, 15 Nov 2026 09:21:53 GMT";
    fn cancelled() -> AtomicBool {
        AtomicBool::new(false)
    }
    fn metadata(bytes: u64) -> FileMetadata {
        FileMetadata {
            bytes,
            etag: Some("\"release-a\"".into()),
            last_modified: Some(DATE.into()),
        }
    }
    fn listing(names: &[&str]) -> Vec<u8> {
        format!("<html><head><title>Index of /client/</title></head><body><h1>Index of /client/</h1><hr><pre><a href=\"../\">../</a>\n{}</pre><hr></body></html>", names.iter().map(|s| format!("<a href=\"{s}\">{s}</a> 15-Nov-2026 09:21 2M\n")).collect::<String>()).into_bytes()
    }
    fn candidate(bytes: &[u8]) -> Candidate {
        let file_name = "pureTV-Manager-0.4.11-windows-x64-setup.exe".to_string();
        let metadata = metadata(bytes.len() as u64);
        Candidate {
            version: "0.4.11".into(),
            platform: "windows-x64".into(),
            revision: app_store::fingerprint(&format!("client/{file_name}"), &metadata),
            file_name,
            metadata,
        }
    }
    struct TemporaryDirectory(PathBuf);
    impl TemporaryDirectory {
        fn new() -> Self {
            Self(std::env::temp_dir().join(format!(
                "puretv-client-test-{}-{}-{}",
                std::process::id(),
                now_ms(),
                NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
            )))
        }
    }
    impl Drop for TemporaryDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn fixture_check(state: &State, current: &str) -> Info {
        state
            .check_with(
                "windows-x64",
                current,
                &cancelled(),
                |_| Ok(()),
                |url, _| {
                    assert_eq!(url, SOURCE_URL);
                    Ok(listing(&["pureTV-Manager-0.4.11-windows-x64-setup.exe"]))
                },
                |_, _| Ok(metadata(9)),
            )
            .unwrap()
    }
    #[test]
    fn versions_are_numeric_and_only_exact_stable_platform_files_are_selected() {
        assert!(version("0.4.10") > version("0.4.9"));
        for value in [
            "1.2",
            "1.2.3.4",
            "1.02.3",
            "v1.2.3",
            "1.2.3-beta",
            "1.2.3+meta",
            "1.2.-3",
            "999999999999999999999999.0.0",
            "1.2.3/../../x",
        ] {
            assert!(version(value).is_none(), "{value}");
        }
        let entries = listing(&[
            "pureTV-Manager-0.4.9-windows-x64-setup.exe",
            "pureTV-Manager-0.4.10-windows-x64-setup.exe",
            "pureTV-Manager-9.0.0-windows-x64-portable.exe",
            "pureTV-Manager-9.0.0-macos-arm64.dmg",
            "pureTV-Manager-9.0.0-windows-x64-setup.exe.exe",
            "nested/",
        ]);
        assert_eq!(
            select_file(&entries, "windows-x64").unwrap().unwrap().0,
            "0.4.10"
        );
        assert!(select_file(&entries, "linux-x64").unwrap().is_none());
    }
    #[test]
    fn discovery_heads_only_latest_matching_package_and_uses_exact_metadata() {
        let mut heads = Vec::new();
        let (revision, value) = discover(
            "windows-x64",
            &cancelled(),
            |url| {
                assert_eq!(url, SOURCE_URL);
                Ok(listing(&[
                    "pureTV-Manager-0.4.10-windows-x64-setup.exe",
                    "pureTV-Manager-0.4.11-windows-x64-setup.exe",
                    "pureTV-Manager-0.4.12-macos-arm64.dmg",
                ]))
            },
            |url| {
                heads.push(url.to_string());
                Ok(metadata(2_273_072))
            },
        )
        .unwrap();
        let c = value.unwrap();
        assert_eq!(heads, [raw_url(&c)]);
        assert_eq!(c.version, "0.4.11");
        assert_eq!(c.metadata.bytes, 2_273_072); // Do not use rounded HTML's "2M".
        assert!(valid_sha(&revision));
        assert_eq!(revision, c.revision);
        assert_eq!(
            revision,
            app_store::fingerprint(&format!("client/{}", c.file_name), &c.metadata)
        );
        let mut changed = c.metadata.clone();
        changed.etag = Some("\"replacement\"".into());
        assert_ne!(
            revision,
            app_store::fingerprint(&format!("client/{}", c.file_name), &changed)
        );
    }
    #[test]
    fn missing_platform_does_not_head_files_and_invalid_sizes_are_rejected() {
        assert!(discover(
            "linux-x64",
            &cancelled(),
            |_| Ok(listing(&[])),
            |_| panic!("no matching package")
        )
        .unwrap()
        .1
        .is_none());
        for bytes in [0, MAX_PACKAGE + 1] {
            assert!(discover(
                "windows-x64",
                &cancelled(),
                |_| Ok(listing(&["pureTV-Manager-0.4.11-windows-x64-setup.exe"])),
                |_| Ok(metadata(bytes))
            )
            .is_err());
        }
        let value = discover(
            "windows-x64",
            &cancelled(),
            |_| Ok(listing(&["pureTV-Manager-0.4.11-windows-x64-setup.exe"])),
            |_| Ok(metadata(320 * 1024 * 1024)),
        )
        .unwrap()
        .1
        .unwrap();
        assert_eq!(value.metadata.bytes, 320 * 1024 * 1024);
        assert!(discover(
            "windows-x64",
            &AtomicBool::new(true),
            |_| panic!("cancelled"),
            |_| panic!("cancelled")
        )
        .is_err());
    }
    #[test]
    fn no_matching_platform_is_distinct_from_up_to_date_and_never_downgrades() {
        let c = candidate(b"a");
        assert_eq!(
            info("windows-x64", "0.4.10", Some(c.revision.clone()), Some(&c))
                .unwrap()
                .status,
            "available"
        );
        for current in ["0.4.11", "0.4.12", "1.0.0"] {
            let value = info("windows-x64", current, Some(c.revision.clone()), Some(&c)).unwrap();
            assert!(!value.available);
            assert_eq!(value.status, "upToDate");
        }
        assert_eq!(
            info("linux-x64", "0.4.10", None, None).unwrap().status,
            "notPublished"
        );
        assert!(!info("unknown", "0.4.10", None, None).unwrap().supported);
    }
    #[test]
    fn failed_checks_clear_previous_candidates_and_downloads_require_displayed_revision() {
        let dir = TemporaryDirectory::new();
        let state = State::new(dir.0.clone());
        let cancel = cancelled();
        let value = fixture_check(&state, "0.4.10");
        assert!(value.available);
        let revision = value.revision.unwrap();
        for (version, revision) in [
            ("0.4.12", revision.as_str()),
            ("0.4.11", "0".repeat(64).as_str()),
        ] {
            assert!(state
                .download_with(
                    version,
                    revision,
                    &cancel,
                    |_| Ok(()),
                    |_, _, _, _| panic!("must not download")
                )
                .is_err());
        }
        assert!(state
            .check_with(
                "windows-x64",
                "0.4.10",
                &cancel,
                |_| Ok(()),
                |_, _| Err("offline".into()),
                |_, _| panic!("offline")
            )
            .is_err());
        assert!(state
            .download_with(
                "0.4.11",
                &revision,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("failed check cannot authorize download")
            )
            .is_err());
        fixture_check(&state, "0.4.12");
        assert!(state
            .download_with(
                "0.4.11",
                &revision,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("cannot downgrade")
            )
            .is_err());
    }
    #[test]
    fn unsupported_platform_and_invalid_selection_never_touch_network_or_disk() {
        let dir = TemporaryDirectory::new();
        let state = State::new(dir.0.clone());
        let cancel = cancelled();
        assert_eq!(
            state
                .check_with(
                    "unknown",
                    "0.4.10",
                    &cancel,
                    |_| Ok(()),
                    |_, _| panic!("unsupported"),
                    |_, _| panic!("unsupported")
                )
                .unwrap()
                .status,
            "unsupported"
        );
        for revision in ["../a", "x", "0".repeat(40).as_str()] {
            assert!(state
                .download_with(
                    "0.4.11",
                    revision,
                    &cancel,
                    |_| Ok(()),
                    |_, _, _, _| panic!("invalid input")
                )
                .is_err());
        }
        assert!(!dir.0.exists());
    }
    #[test]
    fn transfers_enforce_exact_length_calculate_sha256_and_honor_cancel_and_timeout() {
        let bytes = b"MZ example installer fixture";
        let c = candidate(bytes);
        let cancel = cancelled();
        let deadline = Instant::now() + Duration::from_secs(3);
        let mut output = Vec::new();
        let mut progress = Vec::new();
        let sha = copy_verified(
            &bytes[..],
            &mut output,
            &c,
            &cancel,
            deadline,
            |p| {
                progress.push(p);
                Ok(())
            },
            "downloading",
        )
        .unwrap();
        assert_eq!(output, bytes);
        assert_eq!(sha, format!("{:x}", Sha256::digest(bytes)));
        assert_eq!(progress.last().unwrap().downloaded, bytes.len() as u64);
        for corrupt in [
            &bytes[..bytes.len() - 1],
            b"MZ example installer fixture extra",
        ] {
            assert!(copy_verified(
                corrupt,
                Vec::new(),
                &c,
                &cancel,
                deadline,
                |_| Ok(()),
                "downloading"
            )
            .is_err());
        }
        assert!(copy_verified(
            &bytes[..],
            Vec::new(),
            &c,
            &AtomicBool::new(true),
            deadline,
            |_| Ok(()),
            "downloading"
        )
        .is_err());
        assert!(copy_verified(
            &bytes[..],
            Vec::new(),
            &c,
            &cancel,
            Instant::now(),
            |_| Ok(()),
            "downloading"
        )
        .is_err());
        assert!(copy_verified(
            &bytes[..],
            Vec::new(),
            &c,
            &cancel,
            deadline,
            |_| Err("closed progress channel".into()),
            "downloading"
        )
        .is_err());
    }
    fn http_response(status: u16, bytes: &[u8], etag: Option<&str>) -> Response {
        use std::net::TcpListener;
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let bytes = bytes.to_vec();
        let etag = etag.map(str::to_owned);
        let worker = std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            socket
                .set_read_timeout(Some(Duration::from_secs(2)))
                .unwrap();
            let mut buffer = [0; 2048];
            socket.read(&mut buffer).unwrap();
            write!(
                socket,
                "HTTP/1.1 {status} Test\r\nContent-Length: {}\r\nLast-Modified: {DATE}\r\n",
                bytes.len()
            )
            .unwrap();
            if let Some(etag) = etag {
                write!(socket, "ETag: {etag}\r\n").unwrap();
            }
            socket.write_all(b"Connection: close\r\n\r\n").unwrap();
            socket.write_all(&bytes).unwrap();
        });
        let response = Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(2))
            .build()
            .unwrap()
            .get(format!("http://{address}"))
            .send()
            .unwrap();
        worker.join().unwrap();
        response
    }
    #[test]
    fn direct_download_requires_selected_http_metadata_and_never_falls_back_to_gitee() {
        let bytes = b"fixture installer";
        let c = candidate(bytes);
        let cancel = cancelled();
        let deadline = Instant::now() + Duration::from_secs(10);
        let mut output = Vec::new();
        let mut urls = Vec::new();
        transfer_with(
            &c,
            &mut output,
            &cancel,
            |_| Ok(()),
            deadline,
            |url| {
                urls.push(url.to_owned());
                Ok(http_response(200, bytes, Some("\"release-a\"")))
            },
        )
        .unwrap();
        assert_eq!(output, bytes);
        assert_eq!(urls, [raw_url(&c)]);
        for status in [401, 403, 404, 412, 500] {
            let mut requests = 0;
            assert!(transfer_with(
                &c,
                Vec::new(),
                &cancel,
                |_| Ok(()),
                deadline,
                |_| {
                    requests += 1;
                    Ok(http_response(status, b"unavailable", None))
                }
            )
            .is_err());
            assert_eq!(requests, 1);
        }
        for etag in [Some("\"replaced\""), None] {
            let mut output = Vec::new();
            assert!(transfer_with(
                &c,
                &mut output,
                &cancel,
                |_| Ok(()),
                deadline,
                |_| Ok(http_response(200, bytes, etag))
            )
            .is_err());
            assert!(output.is_empty());
        }
        let mut output = Vec::new();
        assert!(transfer_with(
            &c,
            &mut output,
            &cancel,
            |_| Ok(()),
            deadline,
            |_| Ok(http_response(200, b"short", Some("\"release-a\"")))
        )
        .is_err());
        assert!(output.is_empty());
        let mut requests = 0;
        assert!(transfer_with(
            &c,
            Vec::new(),
            &cancel,
            |_| Ok(()),
            deadline,
            |_| {
                requests += 1;
                cancel.store(true, Ordering::Release);
                Ok(http_response(200, bytes, Some("\"release-a\"")))
            }
        )
        .is_err());
        assert_eq!(requests, 1);
    }
    #[test]
    fn cached_packages_require_matching_receipt_and_are_rehashed_before_reuse() {
        let dir = TemporaryDirectory::new();
        let state = State::new(dir.0.clone());
        let cancel = cancelled();
        let bytes = b"verified installer";
        let c = candidate(bytes);
        state.selection.lock().unwrap().candidate = Some(c.clone());
        let download = |state: &State| {
            state
                .download_with(
                    &c.version,
                    &c.revision,
                    &cancel,
                    |_| Ok(()),
                    |c, out, cancel, report| {
                        copy_verified(
                            &bytes[..],
                            out,
                            c,
                            cancel,
                            Instant::now() + Duration::from_secs(2),
                            report,
                            "downloading",
                        )
                    },
                )
                .unwrap()
        };
        let first = download(&state);
        assert_eq!(fs::read(&first.path).unwrap(), bytes);
        assert!(first.blob_sha.is_empty());
        state
            .download_with(
                &c.version,
                &c.revision,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("verified cache must avoid network"),
            )
            .unwrap();
        fs::write(&first.path, vec![b'x'; bytes.len()]).unwrap(); // Same size corruption must not pass.
        assert!(hash_file(&first.path, &c, &cancel).unwrap().is_none());
        download(&state);
        fs::remove_file(first.path.with_extension("receipt.json")).unwrap();
        assert!(hash_file(&first.path, &c, &cancel).unwrap().is_none());
        download(&state);
        let mut changed = c.clone();
        changed.revision = "0".repeat(64);
        assert!(hash_file(&first.path, &changed, &cancel).unwrap().is_none());
        fs::write(
            first.path.with_extension("receipt.json"),
            b"invalid receipt",
        )
        .unwrap();
        assert!(hash_file(&first.path, &c, &cancel).unwrap().is_none());
    }
    #[test]
    fn failed_or_cancelled_transfers_leave_no_partial_files_or_valid_receipt() {
        let dir = TemporaryDirectory::new();
        let state = State::new(dir.0.clone());
        let cancel = cancelled();
        let c = candidate(b"installer");
        state.selection.lock().unwrap().candidate = Some(c.clone());
        for cancelled_transfer in [false, true] {
            cancel.store(false, Ordering::Release);
            assert!(state
                .download_with(
                    &c.version,
                    &c.revision,
                    &cancel,
                    |_| Ok(()),
                    |_, out, cancel, _| {
                        out.write_all(b"partial").unwrap();
                        if cancelled_transfer {
                            cancel.store(true, Ordering::Release);
                        }
                        Err("interrupted".into())
                    }
                )
                .is_err());
            let root = dir.0.join("client-updates/http-packages").join(&c.revision);
            assert!(fs::read_dir(root).unwrap().next().is_none());
        }
    }
    #[test]
    fn download_addresses_cannot_escape_fixed_https_client_directory() {
        for good in [
            SOURCE_URL.to_owned(),
            "https://apps.b14f.com/client/pureTV-Manager-0.4.11-windows-x64-setup.exe".to_owned(),
        ] {
            assert!(allowed_url(&Url::parse(&good).unwrap()));
        }
        for bad in [
            "http://apps.b14f.com/client/a",
            "https://apps.b14f.com.evil.example/client/a",
            "https://apps.b14f.com/media/a",
            "https://apps.b14f.com/client/../media/a",
            "https://user:secret@apps.b14f.com/client/a",
            "https://apps.b14f.com:8443/client/a",
            "https://apps.b14f.com/client/a#fragment",
            "https://gitee.com/juzisang331/pure-tv-store/raw/master/client/a",
        ] {
            assert!(!allowed_url(&Url::parse(bad).unwrap()), "{bad}");
        }
    }
    #[test]
    #[ignore = "downloads one public client package into an isolated temporary directory"]
    fn live_http_discovery_and_verified_client_download() {
        let directory = TemporaryDirectory::new();
        let state = State::new(directory.0.clone());
        let cancel = cancelled();
        let value = state
            .check_with(
                "windows-x64",
                "0.0.0",
                &cancel,
                |_| Ok(()),
                |url, deadline| fetch_directory(&client()?, url, &cancel, deadline),
                |url, deadline| fetch_metadata(&client()?, url, &cancel, deadline),
            )
            .unwrap();
        assert!(value.available);
        let result = state
            .download(
                value.latest_version.as_deref().unwrap(),
                value.revision.as_deref().unwrap(),
                &cancel,
                |_| Ok(()),
            )
            .unwrap();
        assert!(fs::read(&result.path).unwrap().starts_with(b"MZ"));
        println!("Verified HTTP client {} {} bytes, HTTP metadata revision {}, locally computed SHA256 {}", result.version, result.bytes, result.revision, result.sha256);
    }
}
