//! Desktop update discovery and downloads from the fixed public client directory.
//! This module never starts an installer; the caller owns the application lifecycle.
use base64::{engine::general_purpose::STANDARD, read::DecoderReader};
use reqwest::{
    blocking::{Client, Response},
    header, redirect, Url,
};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use sha2::Sha256;
use std::{
    borrow::Cow,
    collections::HashSet,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const SOURCE_URL: &str = "https://gitee.com/juzisang331/pure-tv-store";
const API: &str = "https://gitee.com/api/v5/repos/juzisang331/pure-tv-store";
const MAX_JSON: u64 = 16 * 1024 * 1024;
const MAX_PACKAGE: u64 = 256 * 1024 * 1024;
const MAX_BLOB: u64 = 32 * 1024 * 1024;
const BLOB_ENVELOPE: u64 = 8192;
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
    pub blob_sha: String,
    pub sha256: String,
    pub revision: String,
}
#[derive(Clone, Debug)]
struct Candidate {
    version: String,
    platform: String,
    file_name: String,
    bytes: u64,
    blob_sha: String,
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
#[derive(Deserialize)]
struct Repository {
    default_branch: String,
}
#[derive(Deserialize)]
struct Branch {
    commit: Commit,
}
#[derive(Deserialize)]
struct Commit {
    sha: String,
}
#[derive(Deserialize)]
struct Tree {
    tree: Vec<TreeEntry>,
    #[serde(default)]
    truncated: bool,
}
#[derive(Deserialize)]
struct TreeEntry {
    path: String,
    #[serde(rename = "type")]
    kind: String,
    mode: String,
    sha: String,
    size: Option<u64>,
}
#[derive(Deserialize)]
struct Blob<'a> {
    sha: String,
    size: u64,
    encoding: String,
    #[serde(borrow)]
    content: Cow<'a, str>,
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
    value.len() == 40
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}
fn valid_branch(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 255
        && !value.contains(['\\', '\0'])
        && !value.chars().any(char::is_control)
        && value
            .split('/')
            .all(|part| !part.is_empty() && part != "." && part != "..")
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
fn api_path(suffix: &str, component: &str) -> String {
    let mut url = Url::parse(&format!("{API}/{suffix}")).expect("fixed API URL");
    url.path_segments_mut().expect("HTTPS URL").push(component);
    url.into()
}
fn raw_url(candidate: &Candidate) -> String {
    format!(
        "{SOURCE_URL}/raw/{}/client/{}",
        candidate.revision, candidate.file_name
    )
}
fn allowed_url(url: &Url) -> bool {
    url.scheme() == "https"
        && matches!(
            url.host_str(),
            Some("gitee.com" | "raw.giteeusercontent.com")
        )
        && url.port().is_none_or(|p| p == 443)
        && url.username().is_empty()
        && url.password().is_none()
        && url.fragment().is_none()
        && (url.path().starts_with("/juzisang331/pure-tv-store/")
            || url.host_str() == Some("gitee.com")
                && (url.path() == "/api/v5/repos/juzisang331/pure-tv-store"
                    || url
                        .path()
                        .starts_with("/api/v5/repos/juzisang331/pure-tv-store/")))
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
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<Response, String> {
    let mut url = Url::parse(address).map_err(|_| "客户端更新地址无效")?;
    for hop in 0..=5 {
        active(cancel, deadline)?;
        if !allowed_url(&url) {
            return Err("客户端更新返回了不受支持的下载地址".into());
        }
        let value = client
            .get(url.clone())
            .header(header::ACCEPT_ENCODING, "identity")
            .send()
            .map_err(|_| {
                check_cancel(cancel)
                    .err()
                    .unwrap_or_else(|| "无法连接客户端更新仓库，请检查网络后重试".into())
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
fn fetch_json(
    client: &Client,
    url: &str,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<Vec<u8>, String> {
    let response = require_ok(response(client, url, cancel, deadline)?)?;
    if response.content_length().is_some_and(|n| n > MAX_JSON) {
        return Err("客户端更新目录过大".into());
    }
    read_bounded(response, MAX_JSON, cancel, deadline)
}
fn parse_tree(bytes: &[u8], revision: &str, target: &str) -> Result<Option<Candidate>, String> {
    if !valid_sha(revision) || bytes.len() as u64 > MAX_JSON {
        return Err("客户端更新目录无效".into());
    }
    let tree: Tree = serde_json::from_slice(bytes).map_err(|_| "无法解析客户端更新目录")?;
    if tree.truncated || tree.tree.len() > 50_000 {
        return Err("客户端更新目录不完整，请稍后重试".into());
    }
    let suffix = suffix(target).ok_or("当前平台不支持自动更新")?;
    let mut selected: Option<Candidate> = None;
    let mut seen = HashSet::new();
    for item in tree.tree {
        let Some(file_name) = item.path.strip_prefix("client/") else {
            continue;
        };
        let Some(value) = file_name
            .strip_prefix("pureTV-Manager-")
            .and_then(|s| s.strip_suffix(&format!("-{suffix}")))
        else {
            continue;
        };
        let Some(parsed) = version(value) else {
            continue;
        };
        if !seen.insert(file_name.to_owned())
            || item.kind != "blob"
            || !matches!(item.mode.as_str(), "100644" | "100755")
            || !valid_sha(&item.sha)
            || item.size.is_none_or(|size| size == 0 || size > MAX_PACKAGE)
        {
            return Err("客户端安装包目录信息无效，请稍后重试".into());
        }
        let candidate = Candidate {
            version: value.into(),
            platform: target.into(),
            file_name: file_name.into(),
            bytes: item.size.unwrap(),
            blob_sha: item.sha,
            revision: revision.into(),
        };
        if selected
            .as_ref()
            .is_none_or(|old| parsed > version(&old.version).unwrap())
        {
            selected = Some(candidate);
        }
    }
    Ok(selected)
}
fn discover(
    target: &str,
    cancel: &AtomicBool,
    mut fetch: impl FnMut(&str) -> Result<Vec<u8>, String>,
) -> Result<(String, Option<Candidate>), String> {
    check_cancel(cancel)?;
    let repository: Repository =
        serde_json::from_slice(&fetch(API)?).map_err(|_| "无法解析客户端更新仓库")?;
    if !valid_branch(&repository.default_branch) {
        return Err("客户端更新默认分支无效".into());
    }
    check_cancel(cancel)?;
    let branch: Branch =
        serde_json::from_slice(&fetch(&api_path("branches", &repository.default_branch))?)
            .map_err(|_| "无法解析客户端更新版本")?;
    if !valid_sha(&branch.commit.sha) {
        return Err("客户端更新提交版本无效".into());
    }
    check_cancel(cancel)?;
    let selected = parse_tree(
        &fetch(&format!(
            "{}?recursive=1",
            api_path("git/trees", &branch.commit.sha)
        ))?,
        &branch.commit.sha,
        target,
    )?;
    check_cancel(cancel)?;
    Ok((branch.commit.sha, selected))
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
        bytes: candidate.map(|c| c.bytes),
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
    if !metadata.is_file() || metadata.len() != candidate.bytes {
        return Ok(None);
    }
    let mut input = File::open(path).map_err(|_| "无法读取客户端更新缓存")?;
    let mut git = Sha1::new();
    git.update(format!("blob {}\0", candidate.bytes).as_bytes());
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
        if count > candidate.bytes {
            return Ok(None);
        }
        git.update(&buffer[..n]);
        sha.update(&buffer[..n]);
    }
    if count != candidate.bytes || format!("{:x}", git.finalize()) != candidate.blob_sha {
        return Ok(None);
    }
    Ok(Some(format!("{:x}", sha.finalize())))
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
    let mut git = Sha1::new();
    git.update(format!("blob {}\0", candidate.bytes).as_bytes());
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
        if downloaded + count as u64 > candidate.bytes {
            return Err("客户端安装包大小与目录不一致".into());
        }
        output
            .write_all(&buffer[..count])
            .map_err(|_| "无法保存客户端安装包")?;
        git.update(&buffer[..count]);
        sha.update(&buffer[..count]);
        downloaded += count as u64;
        if last.elapsed() >= Duration::from_millis(150) {
            report(Progress {
                stage,
                downloaded: if stage == "verifying" {
                    candidate.bytes
                } else {
                    downloaded
                },
                total: candidate.bytes,
            })?;
            last = Instant::now();
        }
    }
    check_cancel(cancel)?;
    if downloaded != candidate.bytes || format!("{:x}", git.finalize()) != candidate.blob_sha {
        return Err("客户端安装包校验失败，请重新检查更新".into());
    }
    output.flush().map_err(|_| "无法保存客户端安装包")?;
    report(Progress {
        stage: "verifying",
        downloaded,
        total: candidate.bytes,
    })?;
    Ok(format!("{:x}", sha.finalize()))
}
fn copy_blob(
    input: impl Read,
    output: impl Write,
    candidate: &Candidate,
    cancel: &AtomicBool,
    deadline: Instant,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<String, String> {
    if candidate.bytes > MAX_BLOB {
        return Err("客户端备用下载仅支持不超过 32 MB 的安装包，请从仓库手动下载".into());
    }
    let encoded = candidate.bytes.div_ceil(3) * 4;
    // Raw JSON bytes are not installation bytes; avoid presenting Base64 or JSON
    // overhead as a fabricated install-package completion percentage.
    report(Progress {
        stage: "downloading",
        downloaded: 0,
        total: candidate.bytes,
    })?;
    let bytes = read_bounded(input, encoded + BLOB_ENVELOPE, cancel, deadline)?;
    let blob: Blob<'_> = serde_json::from_slice(&bytes).map_err(|_| "客户端备用下载数据无效")?;
    if blob.sha != candidate.blob_sha
        || blob.size != candidate.bytes
        || blob.encoding != "base64"
        || blob.content.len() as u64 != encoded
    {
        return Err("客户端备用下载信息与目录不一致".into());
    }
    report(Progress {
        stage: "verifying",
        downloaded: candidate.bytes,
        total: candidate.bytes,
    })?;
    copy_verified(
        DecoderReader::new(blob.content.as_bytes(), &STANDARD),
        output,
        candidate,
        cancel,
        deadline,
        report,
        "verifying",
    )
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
        response(&client, url, cancel, deadline)
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
    if raw.status() == reqwest::StatusCode::FORBIDDEN {
        if candidate.bytes > MAX_BLOB {
            return Err("客户端备用下载仅支持不超过 32 MB 的安装包，请从仓库手动下载".into());
        }
        drop(raw);
        let blob = require_ok(fetch(&api_path("git/blobs", &candidate.blob_sha))?)?;
        active(cancel, deadline)?;
        if blob
            .content_length()
            .is_some_and(|n| n > candidate.bytes.div_ceil(3) * 4 + BLOB_ENVELOPE)
        {
            return Err("客户端备用下载数据超过大小限制".into());
        }
        copy_blob(blob, output, candidate, cancel, deadline, report)
    } else {
        let raw = require_ok(raw)?;
        if raw.content_length().is_some_and(|n| n != candidate.bytes) {
            return Err("客户端安装包大小与目录不一致".into());
        }
        report(Progress {
            stage: "downloading",
            downloaded: 0,
            total: candidate.bytes,
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
            |url, deadline| fetch_json(&client()?, url, cancel, deadline),
        )
    }
    fn check_with(
        &self,
        target: &str,
        current: &str,
        cancel: &AtomicBool,
        mut report: impl FnMut(Progress) -> Result<(), String>,
        mut fetch: impl FnMut(&str, Instant) -> Result<Vec<u8>, String>,
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
        let (revision, latest) = discover(target, cancel, |url| {
            active(cancel, deadline)?;
            fetch(url, deadline)
        })?;
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
            .join("client-updates/packages")
            .join(&candidate.revision);
        fs::create_dir_all(&root).map_err(|_| "无法创建客户端更新目录")?;
        let path = root.join(&candidate.file_name);
        report(Progress {
            stage: "verifying",
            downloaded: 0,
            total: candidate.bytes,
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
            sha
        };
        check_cancel(cancel)?;
        report(Progress {
            stage: "verifying",
            downloaded: candidate.bytes,
            total: candidate.bytes,
        })?;
        Ok(Downloaded {
            path,
            version: candidate.version,
            platform: candidate.platform,
            file_name: candidate.file_name,
            bytes: candidate.bytes,
            blob_sha: candidate.blob_sha,
            sha256,
            revision: candidate.revision,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::Engine;
    use serde_json::{json, Value};
    const REV: &str = "1111111111111111111111111111111111111111";
    const REV2: &str = "2222222222222222222222222222222222222222";
    fn cancelled() -> AtomicBool {
        AtomicBool::new(false)
    }
    fn git_sha(bytes: &[u8]) -> String {
        let mut sha = Sha1::new();
        sha.update(format!("blob {}\0", bytes.len()));
        sha.update(bytes);
        format!("{:x}", sha.finalize())
    }
    fn entry(name: &str, bytes: &[u8]) -> Value {
        json!({"path":format!("client/{name}"),"type":"blob","mode":"100644","sha":git_sha(bytes),"size":bytes.len()})
    }
    fn tree(entries: Vec<Value>) -> Vec<u8> {
        serde_json::to_vec(&json!({"tree":entries,"truncated":false})).unwrap()
    }
    fn candidate(bytes: &[u8]) -> Candidate {
        Candidate {
            version: "0.4.11".into(),
            platform: "windows-x64".into(),
            file_name: "pureTV-Manager-0.4.11-windows-x64-setup.exe".into(),
            bytes: bytes.len() as u64,
            blob_sha: git_sha(bytes),
            revision: REV.into(),
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
    fn fetch_fixture(url: &str) -> Result<Vec<u8>, String> {
        if url == API {
            Ok(br#"{"default_branch":"master"}"#.to_vec())
        } else if url.ends_with("/branches/master") {
            Ok(serde_json::to_vec(&json!({"commit":{"sha":REV}})).unwrap())
        } else if url == format!("{API}/git/trees/{REV}?recursive=1") {
            Ok(tree(vec![entry(
                "pureTV-Manager-0.4.11-windows-x64-setup.exe",
                b"installer",
            )]))
        } else {
            panic!("Unexpected URL {url}")
        }
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
        let mut entries = vec![
            entry("pureTV-Manager-0.4.9-windows-x64-setup.exe", b"a"),
            entry("pureTV-Manager-0.4.10-windows-x64-setup.exe", b"b"),
        ];
        for name in [
            "pureTV-Manager-9.0.0-windows-x64-portable.exe",
            "pureTV-Manager-9.0.0-macos-arm64.dmg",
            "pureTV-Manager-9.0.0-windows-x64-setup.exe.exe",
            "../pureTV-Manager-9.0.0-windows-x64-setup.exe",
            "nested/pureTV-Manager-9.0.0-windows-x64-setup.exe",
        ] {
            entries.push(entry(name, b"ignore"));
        }
        let selected = parse_tree(&tree(entries), REV, "windows-x64")
            .unwrap()
            .unwrap();
        assert_eq!(selected.version, "0.4.10");
        assert_eq!(
            selected.file_name,
            "pureTV-Manager-0.4.10-windows-x64-setup.exe"
        );
        assert!(parse_tree(
            &tree(vec![entry("pureTV-Manager-0.4.10-macos-arm64.dmg", b"a")]),
            REV,
            "linux-x64"
        )
        .unwrap()
        .is_none());
    }
    #[test]
    fn discovery_pins_branch_commit_and_rejects_untrusted_or_truncated_metadata() {
        let (revision, value) = discover("windows-x64", &cancelled(), fetch_fixture).unwrap();
        assert_eq!(revision, REV);
        assert_eq!(value.unwrap().revision, REV);
        for field in [
            json!({"mode":"120000"}),
            json!({"sha":"wrong"}),
            json!({"size":0}),
            json!({"size":MAX_PACKAGE+1}),
            json!({"type":"tree"}),
        ] {
            let mut value = entry("pureTV-Manager-0.4.11-windows-x64-setup.exe", b"a");
            for (key, value2) in field.as_object().unwrap() {
                value[key] = value2.clone();
            }
            assert!(parse_tree(&tree(vec![value]), REV, "windows-x64").is_err());
        }
        assert!(parse_tree(br#"{"tree":[],"truncated":true}"#, REV, "windows-x64").is_err());
        let duplicate = entry("pureTV-Manager-0.4.11-windows-x64-setup.exe", b"a");
        assert!(parse_tree(
            &tree(vec![duplicate.clone(), duplicate]),
            REV,
            "windows-x64"
        )
        .is_err());
        assert!(parse_tree(b"bad", REV, "windows-x64").is_err());
        assert!(discover("windows-x64", &cancelled(), |_| Ok(
            br#"{"default_branch":"../other"}"#.to_vec()
        ))
        .is_err());
    }
    #[test]
    fn no_matching_platform_is_distinct_from_up_to_date_and_never_downgrades() {
        let c = candidate(b"a");
        assert_eq!(
            info("windows-x64", "0.4.10", Some(REV.into()), Some(&c))
                .unwrap()
                .status,
            "available"
        );
        for current in ["0.4.11", "0.4.12", "1.0.0"] {
            let value = info("windows-x64", current, Some(REV.into()), Some(&c)).unwrap();
            assert!(!value.available);
            assert_eq!(value.status, "upToDate");
        }
        let no_package = info("linux-x64", "0.4.10", Some(REV.into()), None).unwrap();
        assert_eq!(no_package.status, "notPublished");
        assert!(no_package.supported);
        let unsupported = info("unknown", "0.4.10", None, None).unwrap();
        assert_eq!(unsupported.status, "unsupported");
        assert!(!unsupported.supported);
    }
    #[test]
    fn failed_checks_clear_previous_candidates_and_downloads_require_displayed_revision() {
        let dir = TemporaryDirectory::new();
        let state = State::new(dir.0.clone());
        let cancel = cancelled();
        let value = state
            .check_with(
                "windows-x64",
                "0.4.10",
                &cancel,
                |_| Ok(()),
                |url, _| fetch_fixture(url),
            )
            .unwrap();
        assert!(value.available);
        assert!(state
            .download_with(
                "0.4.12",
                REV,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("must not download")
            )
            .is_err());
        assert!(state
            .download_with(
                "0.4.11",
                REV2,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("must not download")
            )
            .is_err());
        assert!(state
            .check_with(
                "windows-x64",
                "0.4.10",
                &cancel,
                |_| Ok(()),
                |_, _| Err("offline".into())
            )
            .is_err());
        assert!(state
            .download_with(
                "0.4.11",
                REV,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("failed check cannot authorize download")
            )
            .is_err());
        state
            .check_with(
                "windows-x64",
                "0.4.12",
                &cancel,
                |_| Ok(()),
                |url, _| fetch_fixture(url),
            )
            .unwrap();
        assert!(state
            .download_with(
                "0.4.11",
                REV,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("cannot downgrade")
            )
            .is_err());
    }
    #[test]
    fn exact_bytes_and_git_hash_are_required_before_download_is_accepted() {
        let bytes = b"MZ example installer fixture";
        let c = candidate(bytes);
        let cancel = cancelled();
        let deadline = Instant::now() + Duration::from_secs(2);
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
            b"xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
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
        let mut plain_hash = c.clone();
        plain_hash.blob_sha = format!("{:x}", Sha1::digest(bytes));
        assert!(copy_verified(
            &bytes[..],
            Vec::new(),
            &plain_hash,
            &cancel,
            deadline,
            |_| Ok(()),
            "downloading"
        )
        .is_err());
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
    }
    #[test]
    fn blob_fallback_checks_metadata_and_decoded_bytes_with_independent_size_bound() {
        let bytes = b"installer bytes";
        let c = candidate(bytes);
        let cancel = cancelled();
        let deadline = Instant::now() + Duration::from_secs(2);
        let blob = json!({"sha":c.blob_sha,"size":c.bytes,"encoding":"base64","content":STANDARD.encode(bytes)});
        let mut output = Vec::new();
        let mut progress = Vec::new();
        copy_blob(
            serde_json::to_vec(&blob).unwrap().as_slice(),
            &mut output,
            &c,
            &cancel,
            deadline,
            |p| {
                progress.push(p);
                Ok(())
            },
        )
        .unwrap();
        assert_eq!(output, bytes);
        assert!(progress.iter().all(|p| p.downloaded <= p.total));
        for field in [
            json!({"sha":REV2}),
            json!({"size":bytes.len()+1}),
            json!({"encoding":"utf-8"}),
            json!({"content":STANDARD.encode(b"incorrect bytes")}),
        ] {
            let mut changed = blob.clone();
            for (key, value) in field.as_object().unwrap() {
                changed[key] = value.clone();
            }
            assert!(copy_blob(
                serde_json::to_vec(&changed).unwrap().as_slice(),
                Vec::new(),
                &c,
                &cancel,
                deadline,
                |_| Ok(())
            )
            .is_err());
        }
        let mut large = c.clone();
        large.bytes = MAX_BLOB + 1;
        assert!(copy_blob(&[][..], Vec::new(), &large, &cancel, deadline, |_| Ok(())).is_err());
    }
    fn http_response(status: u16, bytes: &[u8]) -> Response {
        use std::net::TcpListener;
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let bytes = bytes.to_vec();
        let worker = std::thread::spawn(move || {
            let (mut socket, _) = listener.accept().unwrap();
            socket
                .set_read_timeout(Some(Duration::from_secs(2)))
                .unwrap();
            let mut buffer = [0; 2048];
            socket.read(&mut buffer).unwrap();
            write!(
                socket,
                "HTTP/1.1 {status} Test\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                bytes.len()
            )
            .unwrap();
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
    fn only_raw_403_uses_the_same_immutable_blob_and_cancel_never_retries() {
        let bytes = b"fixture installer";
        let candidate = candidate(bytes);
        let cancel = cancelled();
        let deadline = Instant::now() + Duration::from_secs(10);
        let blob = serde_json::to_vec(&json!({"sha":candidate.blob_sha,"size":candidate.bytes,"encoding":"base64","content":STANDARD.encode(bytes)})).unwrap();
        let mut urls = Vec::new();
        let mut output = Vec::new();
        transfer_with(
            &candidate,
            &mut output,
            &cancel,
            |_| Ok(()),
            deadline,
            |url| {
                urls.push(url.to_string());
                Ok(if urls.len() == 1 {
                    http_response(403, b"login required")
                } else {
                    http_response(200, &blob)
                })
            },
        )
        .unwrap();
        assert_eq!(output, bytes);
        assert_eq!(
            urls,
            [
                raw_url(&candidate),
                api_path("git/blobs", &candidate.blob_sha)
            ]
        );
        for status in [401, 404, 500] {
            let mut requests = 0;
            assert!(transfer_with(
                &candidate,
                Vec::new(),
                &cancel,
                |_| Ok(()),
                deadline,
                |_| {
                    requests += 1;
                    Ok(http_response(status, b"unavailable"))
                }
            )
            .is_err());
            assert_eq!(requests, 1);
        }
        let mut requests = 0;
        assert!(transfer_with(
            &candidate,
            Vec::new(),
            &cancel,
            |_| Ok(()),
            deadline,
            |_| {
                requests += 1;
                cancel.store(true, Ordering::Release);
                Ok(http_response(403, b"cancelled"))
            }
        )
        .is_err());
        assert_eq!(requests, 1);
        cancel.store(false, Ordering::Release);
        let mut large = candidate.clone();
        large.bytes = MAX_BLOB + 1;
        requests = 0;
        assert!(transfer_with(
            &large,
            Vec::new(),
            &cancel,
            |_| Ok(()),
            deadline,
            |_| {
                requests += 1;
                Ok(http_response(403, b"too large for fallback"))
            }
        )
        .is_err());
        assert_eq!(requests, 1);
    }
    #[test]
    fn cached_packages_are_rehashed_and_failed_transfers_leave_no_partial_file() {
        let dir = TemporaryDirectory::new();
        let state = State::new(dir.0.clone());
        let cancel = cancelled();
        let bytes = b"verified installer";
        let c = candidate(bytes);
        state.selection.lock().unwrap().candidate = Some(c.clone());
        let first = state
            .download_with(
                &c.version,
                REV,
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
            .unwrap();
        assert_eq!(fs::read(&first.path).unwrap(), bytes);
        assert_eq!(first.sha256, format!("{:x}", Sha256::digest(bytes)));
        state
            .download_with(
                &c.version,
                REV,
                &cancel,
                |_| Ok(()),
                |_, _, _, _| panic!("verified cache must avoid network"),
            )
            .unwrap();
        fs::write(&first.path, b"broken cache").unwrap();
        let failed = state.download_with(
            &c.version,
            REV,
            &cancel,
            |_| Ok(()),
            |_, out, _, _| {
                out.write_all(b"partial").unwrap();
                Err("interrupted".into())
            },
        );
        assert!(failed.is_err());
        assert!(fs::read_dir(first.path.parent().unwrap())
            .unwrap()
            .all(|p| !p.unwrap().file_name().to_string_lossy().ends_with(".part")));
        let fixed = state
            .download_with(
                &c.version,
                REV,
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
            .unwrap();
        assert_eq!(fs::read(fixed.path).unwrap(), bytes);
    }
    #[test]
    fn download_addresses_cannot_escape_fixed_https_repository() {
        for good in [API.to_string(),format!("{SOURCE_URL}/raw/{REV}/client/pureTV-Manager-0.4.11-windows-x64-setup.exe"),format!("https://raw.giteeusercontent.com/juzisang331/pure-tv-store/raw/{REV}/client/a.exe?signature=abc")] {
            assert!(allowed_url(&Url::parse(&good).unwrap()));
        }
        for bad in [
            "http://gitee.com/juzisang331/pure-tv-store/a",
            "https://gitee.com.evil.example/juzisang331/pure-tv-store/a",
            "https://gitee.com/other/repo/a",
            "https://gitee.com/juzisang331/pure-tv-store/../../other/a",
            "https://user:secret@gitee.com/juzisang331/pure-tv-store/a",
            "https://gitee.com:8443/juzisang331/pure-tv-store/a",
            "https://gitee.com/juzisang331/pure-tv-store/a#fragment",
        ] {
            assert!(!allowed_url(&Url::parse(bad).unwrap()), "{bad}");
        }
    }
    #[test]
    #[ignore = "downloads one public client package into an isolated temporary directory"]
    fn live_gitee_discovery_and_verified_client_download() {
        let directory = TemporaryDirectory::new();
        let state = State::new(directory.0.clone());
        let cancel = cancelled();
        let value = state
            .check_with(
                "windows-x64",
                "0.0.0",
                &cancel,
                |_| Ok(()),
                |url, deadline| fetch_json(&client()?, url, &cancel, deadline),
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
        println!(
            "Verified Gitee client {} {} bytes, Git blob {}, SHA256 {}",
            result.version, result.bytes, result.blob_sha, result.sha256
        );
    }
}
