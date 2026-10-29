//! Read-only Gitee catalog and verified APK cache. The repository tree is the catalog;
//! no launcher names or application IDs are compiled into the manager.
use base64::{engine::general_purpose::STANDARD, read::DecoderReader};
use reqwest::{
    blocking::{Client, Response},
    header, redirect, Url,
};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::{
    borrow::Cow,
    collections::{HashMap, HashSet},
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, AtomicU64, Ordering},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const SOURCE_URL: &str = "https://gitee.com/juzisang331/pure-tv-store";
const API: &str = "https://gitee.com/api/v5/repos/juzisang331/pure-tv-store";
const CACHE_AGE_MS: u64 = 5 * 60 * 1000;
const MAX_JSON: u64 = 16 * 1024 * 1024;
// MCP includes both a JSON value and its escaped textual representation.
const MAX_CATALOG: usize = 256 * 1024;
const MAX_APK: u64 = 512 * 1024 * 1024;
// The JSON API expands APKs to Base64. Keep fallback memory bounded independently
// of the streamed raw download limit, and decode without a second APK-sized buffer.
const MAX_BLOB_APK: u64 = 32 * 1024 * 1024;
const BLOB_METADATA_BYTES: u64 = 8192;
const MAX_ITEMS: usize = 1024;
const NETWORK_TIMEOUT: Duration = Duration::from_secs(10);
const TRANSFER_TIMEOUT: Duration = Duration::from_secs(15 * 60);
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub kind: String,
    pub name: String,
    pub version: Option<String>,
    pub file_name: String,
    pub bytes: u64,
    pub blob_sha: String,
    pub folder_url: String,
    pub cover_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logo_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logo_blob_sha: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logo_bytes: Option<u64>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Catalog {
    pub source_url: String,
    pub revision: String,
    pub fetched_at: u64,
    pub stale: bool,
    pub warning: Option<String>,
    pub items: Vec<Item>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub stage: String,
    pub downloaded: u64,
    pub total: u64,
    pub item_id: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Download {
    pub item: Item,
    pub path: String,
    pub home_background: Option<String>,
    pub home_background_color: Option<String>,
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

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .min(u64::MAX as u128) as u64
}
fn check_cancel(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Acquire) {
        Err("市场操作已取消".into())
    } else {
        Ok(())
    }
}
fn valid_sha(value: &str) -> bool {
    value.len() == 40
        && value
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn valid_path(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 1024
        && !value.contains(['\\', '\0'])
        && !value.chars().any(char::is_control)
        && value
            .split('/')
            .all(|part| !part.is_empty() && part != "." && part != ".." && part.len() <= 255)
}
fn apk_kind(path: &str) -> Option<&'static str> {
    if !valid_path(path) || !path.to_ascii_lowercase().ends_with(".apk") {
        return None;
    }
    if path.starts_with("apps/") {
        Some("app")
    } else if path.starts_with("launcher/") {
        Some("launcher")
    } else {
        None
    }
}
fn repository_url(mode: &str, revision: &str, path: &str) -> String {
    let mut url = Url::parse(SOURCE_URL).expect("constant repository URL");
    let mut segments = url.path_segments_mut().expect("HTTPS base URL");
    segments.push(mode).push(revision);
    for part in path.split('/') {
        if !part.is_empty() {
            segments.push(part);
        }
    }
    drop(segments);
    url.to_string()
}
fn api_path(suffix: &str, component: &str) -> String {
    let mut url = Url::parse(&format!("{API}/{suffix}")).expect("constant API URL");
    url.path_segments_mut()
        .expect("HTTPS base URL")
        .push(component);
    url.to_string()
}
fn name_version(file_name: &str) -> (String, Option<String>) {
    let stem = &file_name[..file_name.len() - 4];
    // A filename is a fallback only; actual Android package metadata is read after download.
    if let Some((name, version)) = stem.rsplit_once('-') {
        let pieces: Vec<_> = version.split('.').collect();
        if !name.is_empty()
            && (2..=4).contains(&pieces.len())
            && pieces
                .iter()
                .all(|s| !s.is_empty() && s.len() <= 10 && s.bytes().all(|c| c.is_ascii_digit()))
        {
            return (name.into(), Some(version.into()));
        }
    }
    (
        if stem.is_empty() {
            file_name.to_string()
        } else {
            stem.to_string()
        },
        None,
    )
}
fn cover_paths(folder: &str, file_name: &str) -> [String; 3] {
    let stem = &file_name[..file_name.len() - 4];
    [
        format!("{folder}/{stem}.thumb.png"),
        format!("{folder}/{file_name}.thumb.png"),
        format!("{folder}/thumb.png"),
    ]
}
fn item_from_entry(
    entry: &TreeEntry,
    revision: &str,
    paths: &HashSet<String>,
    files: &HashMap<&str, &TreeEntry>,
) -> Result<Item, String> {
    let kind = apk_kind(&entry.path).ok_or("市场 APK 路径无效")?;
    let bytes = entry
        .size
        .filter(|size| *size > 0 && *size <= MAX_APK)
        .ok_or("市场 APK 大小无效或超过 512 MB")?;
    if !valid_sha(&entry.sha) {
        return Err("市场 APK 校验信息无效".into());
    }
    let (folder, file_name) = entry.path.rsplit_once('/').ok_or("市场 APK 路径无效")?;
    let (name, version) = name_version(file_name);
    let cover = cover_paths(folder, file_name)
        .into_iter()
        .find(|path| paths.contains(path));
    // A shared logo belongs to this exact APK folder and repository commit.
    let logo_path = format!("{folder}/logo.svg");
    let logo = files.get(logo_path.as_str()).filter(|entry| {
        valid_sha(&entry.sha)
            && entry
                .size
                .is_some_and(|n| n > 0 && n <= crate::app_logos::MAX_LOGO as u64)
    });
    Ok(Item {
        id: entry.path.clone(),
        kind: kind.into(),
        name,
        version,
        file_name: file_name.into(),
        bytes,
        blob_sha: entry.sha.clone(),
        folder_url: repository_url("tree", revision, folder),
        cover_url: cover.map(|path| repository_url("raw", revision, &path)),
        logo_url: logo.map(|_| repository_url("raw", revision, &logo_path)),
        logo_blob_sha: logo.map(|entry| entry.sha.clone()),
        logo_bytes: logo.and_then(|entry| entry.size),
    })
}
fn parse_tree(bytes: &[u8], revision: &str, fetched_at: u64) -> Result<Catalog, String> {
    if !valid_sha(revision) {
        return Err("市场提交版本无效".into());
    }
    let tree: Tree = serde_json::from_slice(bytes).map_err(|_| "无法解析市场目录")?;
    if tree.truncated {
        return Err("市场目录过大，Gitee 返回了不完整的列表，请稍后重试".into());
    }
    if tree.tree.len() > 50_000 {
        return Err("市场目录超过支持的大小".into());
    }
    let files: Vec<_> = tree
        .tree
        .iter()
        .filter(|entry| entry.kind == "blob" && ["100644", "100755"].contains(&entry.mode.as_str()))
        .collect();
    let mut paths = HashSet::new();
    for file in &files {
        if !valid_path(&file.path) || !paths.insert(file.path.clone()) {
            return Err("市场目录包含无效或重复的路径".into());
        }
    }
    let mut items = Vec::new();
    let files_by_path = files
        .iter()
        .map(|entry| (entry.path.as_str(), *entry))
        .collect();
    for entry in files {
        if apk_kind(&entry.path).is_some() {
            items.push(item_from_entry(entry, revision, &paths, &files_by_path)?);
            if items.len() > MAX_ITEMS {
                return Err("市场应用数量超过支持的上限".into());
            }
        }
    }
    items.sort_by(|a, b| a.id.cmp(&b.id));
    let catalog = Catalog {
        source_url: SOURCE_URL.into(),
        revision: revision.into(),
        fetched_at,
        stale: false,
        warning: None,
        items,
    };
    if serde_json::to_vec(&catalog)
        .map_err(|_| "无法编码市场目录")?
        .len()
        > MAX_CATALOG
    {
        return Err("市场目录超过支持的大小，请联系市场维护者".into());
    }
    Ok(catalog)
}
fn validate_catalog(catalog: &Catalog) -> bool {
    if catalog.source_url != SOURCE_URL
        || !valid_sha(&catalog.revision)
        || catalog.items.len() > MAX_ITEMS
        || catalog.fetched_at == 0
    {
        return false;
    }
    let mut ids = HashSet::new();
    catalog.items.iter().all(|item| {
        let Some(kind) = apk_kind(&item.id) else {
            return false;
        };
        let Some((folder, file_name)) = item.id.rsplit_once('/') else {
            return false;
        };
        let (name, version) = name_version(file_name);
        let covers = cover_paths(folder, file_name)
            .map(|path| repository_url("raw", &catalog.revision, &path));
        let logo_valid = match (&item.logo_url, &item.logo_blob_sha, item.logo_bytes) {
            (None, None, None) => true,
            (Some(url), Some(sha), Some(bytes)) => {
                *url == repository_url("raw", &catalog.revision, &format!("{folder}/logo.svg"))
                    && valid_sha(sha)
                    && bytes > 0
                    && bytes <= crate::app_logos::MAX_LOGO as u64
            }
            _ => false,
        };
        ids.insert(&item.id)
            && logo_valid
            && item.kind == kind
            && item.file_name == file_name
            && item.name == name
            && item.version == version
            && item.bytes > 0
            && item.bytes <= MAX_APK
            && valid_sha(&item.blob_sha)
            && item.folder_url == repository_url("tree", &catalog.revision, folder)
            && item
                .cover_url
                .as_ref()
                .is_none_or(|cover| covers.contains(cover))
    })
}
fn read_cache(directory: &Path) -> Option<Catalog> {
    // Versioned cache forces the first upgraded client to discover logo metadata.
    let path = directory.join("market/catalog-v2.json");
    if fs::symlink_metadata(&path)
        .ok()
        .is_none_or(|m| !m.is_file() || m.len() > MAX_CATALOG as u64)
    {
        return None;
    }
    let mut catalog: Catalog = serde_json::from_slice(&fs::read(path).ok()?).ok()?;
    if !validate_catalog(&catalog) {
        return None;
    }
    catalog.stale = false;
    catalog.warning = None;
    Some(catalog)
}
fn temporary_path(directory: &Path, extension: &str) -> PathBuf {
    directory.join(format!(
        ".market-{}-{}-{}.{}",
        std::process::id(),
        now_ms(),
        NEXT_TEMP.fetch_add(1, Ordering::Relaxed),
        extension
    ))
}
struct Temporary(PathBuf);
impl Drop for Temporary {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}
fn write_cache(directory: &Path, catalog: &Catalog) -> Result<(), String> {
    let root = directory.join("market");
    fs::create_dir_all(&root).map_err(|_| "无法创建市场缓存目录")?;
    let temporary = Temporary(temporary_path(&root, "json"));
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary.0)
        .map_err(|_| "无法写入市场缓存")?;
    serde_json::to_writer(&mut file, catalog).map_err(|_| "无法写入市场缓存")?;
    file.sync_all().map_err(|_| "无法保存市场缓存")?;
    drop(file);
    fs::rename(&temporary.0, root.join("catalog-v2.json")).map_err(|_| "无法保存市场缓存")?;
    Ok(())
}
fn client() -> Result<Client, String> {
    // For reqwest::blocking this bounds send and each Read::read call separately;
    // it does not set async ClientBuilder's whole-response timeout. The loops below
    // enforce overall JSON/APK deadlines while checking cancellation between reads.
    Client::builder()
        .https_only(true)
        .redirect(redirect::Policy::none())
        .connect_timeout(NETWORK_TIMEOUT)
        .timeout(NETWORK_TIMEOUT)
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "无法准备市场 HTTPS 连接".into())
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
fn response_with_status(
    client: &Client,
    address: &str,
    cancel: &AtomicBool,
) -> Result<Response, String> {
    let mut url = Url::parse(address).map_err(|_| "市场下载地址无效")?;
    for hop in 0..=5 {
        check_cancel(cancel)?;
        if !allowed_url(&url) {
            return Err("市场服务器返回了不受支持的下载地址".into());
        }
        let response = client
            .get(url.clone())
            .header(header::ACCEPT_ENCODING, "identity")
            .send()
            .map_err(|_| {
                check_cancel(cancel)
                    .err()
                    .unwrap_or_else(|| "无法连接市场，请检查网络后重试".into())
            })?;
        check_cancel(cancel)?;
        if response.status().is_redirection() {
            if hop == 5 {
                return Err("市场下载重定向过多".into());
            }
            let location = response
                .headers()
                .get(header::LOCATION)
                .and_then(|h| h.to_str().ok())
                .ok_or("市场下载重定向无效")?;
            url = url.join(location).map_err(|_| "市场下载重定向无效")?;
            continue;
        }
        return Ok(response);
    }
    Err("市场下载失败".into())
}
fn require_ok(response: Response) -> Result<Response, String> {
    if response.status() != reqwest::StatusCode::OK {
        return Err(format!(
            "市场服务器返回 HTTP {}，请稍后重试",
            response.status().as_u16()
        ));
    }
    Ok(response)
}
fn response(client: &Client, address: &str, cancel: &AtomicBool) -> Result<Response, String> {
    require_ok(response_with_status(client, address, cancel)?)
}
fn fetch_json(client: &Client, address: &str, cancel: &AtomicBool) -> Result<Vec<u8>, String> {
    let mut response = response(client, address, cancel)?;
    if response.content_length().is_some_and(|n| n > MAX_JSON) {
        return Err("市场目录文件过大".into());
    }
    let started = Instant::now();
    let mut bytes = Vec::new();
    let mut buffer = [0u8; 16_384];
    loop {
        check_cancel(cancel)?;
        if started.elapsed() > Duration::from_secs(45) {
            return Err("读取市场目录超时".into());
        }
        let count = response.read(&mut buffer).map_err(|_| {
            check_cancel(cancel)
                .err()
                .unwrap_or_else(|| "读取市场目录失败".into())
        })?;
        if count == 0 {
            break;
        }
        if bytes.len() as u64 + count as u64 > MAX_JSON {
            return Err("市场目录文件过大".into());
        }
        bytes.extend_from_slice(&buffer[..count]);
    }
    Ok(bytes)
}
fn catalog_with(
    directory: &Path,
    refresh: bool,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
    mut fetch: impl FnMut(&str) -> Result<Vec<u8>, String>,
) -> Result<Catalog, String> {
    check_cancel(cancel)?;
    let cached = read_cache(directory);
    let now = now_ms();
    if !refresh {
        if let Some(cached) = &cached {
            if now >= cached.fetched_at && now - cached.fetched_at < CACHE_AGE_MS {
                return Ok(cached.clone());
            }
        }
    }
    report(Progress {
        stage: "catalog".into(),
        downloaded: 0,
        total: 0,
        item_id: None,
    })?;
    let latest = (|| {
        let repository: Repository =
            serde_json::from_slice(&fetch(API)?).map_err(|_| "无法解析市场仓库信息")?;
        if !valid_path(&repository.default_branch) {
            return Err("市场默认分支无效".into());
        }
        check_cancel(cancel)?;
        let branch: Branch =
            serde_json::from_slice(&fetch(&api_path("branches", &repository.default_branch))?)
                .map_err(|_| "无法解析市场版本")?;
        if !valid_sha(&branch.commit.sha) {
            return Err("市场提交版本无效".into());
        }
        check_cancel(cancel)?;
        let catalog = parse_tree(
            &fetch(&format!(
                "{}?recursive=1",
                api_path("git/trees", &branch.commit.sha)
            ))?,
            &branch.commit.sha,
            now_ms(),
        )?;
        check_cancel(cancel)?;
        write_cache(directory, &catalog)?;
        Ok::<_, String>(catalog)
    })();
    match latest {
        Ok(catalog) => Ok(catalog),
        Err(error) => {
            check_cancel(cancel)?;
            if let Some(mut cached) = cached {
                cached.stale = true;
                cached.warning = Some(format!("市场更新失败，正在显示上次缓存。{error}"));
                Ok(cached)
            } else {
                Err(error)
            }
        }
    }
}
pub fn catalog(
    directory: &Path,
    refresh: bool,
    cancel: &AtomicBool,
    report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<Catalog, String> {
    let client = client()?;
    catalog_with(directory, refresh, cancel, report, |url| {
        fetch_json(&client, url, cancel)
    })
}
fn git_hash_reader(mut input: impl Read, size: u64, cancel: &AtomicBool) -> Result<String, String> {
    let mut digest = Sha1::new();
    digest.update(format!("blob {size}\0").as_bytes());
    let mut count = 0u64;
    let mut buffer = [0u8; 65_536];
    loop {
        check_cancel(cancel)?;
        let read = input.read(&mut buffer).map_err(|_| "无法校验市场 APK")?;
        if read == 0 {
            break;
        }
        count += read as u64;
        if count > size {
            return Err("市场 APK 大小与目录不一致".into());
        }
        digest.update(&buffer[..read]);
    }
    if count != size {
        return Err("市场 APK 下载不完整".into());
    }
    Ok(format!("{:x}", digest.finalize()))
}
fn verified_file(path: &Path, item: &Item, cancel: &AtomicBool) -> Result<bool, String> {
    let Ok(meta) = fs::symlink_metadata(path) else {
        return Ok(false);
    };
    if !meta.is_file() || meta.len() != item.bytes {
        return Ok(false);
    }
    Ok(git_hash_reader(
        File::open(path).map_err(|_| "无法读取市场 APK 缓存")?,
        item.bytes,
        cancel,
    )? == item.blob_sha)
}
fn cache_file_name(file_name: &str) -> String {
    // Repository paths are not local paths. Keep recognizable names on every OS,
    // including Windows, while the parent blob SHA provides the cache identity.
    let mut stem: String = file_name[..file_name.len() - 4]
        .chars()
        .map(|c| {
            if c.is_control() || "<>:\"/\\|?*".contains(c) {
                '_'
            } else {
                c
            }
        })
        .collect();
    stem = stem.trim_matches([' ', '.']).to_string();
    while stem.len() > 160 {
        stem.pop();
    }
    let device = stem
        .split('.')
        .next()
        .unwrap_or_default()
        .to_ascii_uppercase();
    if matches!(device.as_str(), "CON" | "PRN" | "AUX" | "NUL")
        || ["COM", "LPT"].iter().any(|prefix| {
            device.strip_prefix(prefix).is_some_and(|n| {
                matches!(
                    n,
                    "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "¹" | "²" | "³"
                )
            })
        })
    {
        stem.insert(0, '_');
    }
    if stem.is_empty() {
        stem = "application".into();
    }
    format!("{stem}.apk")
}
fn copy_apk(
    mut input: impl Read,
    mut output: impl Write,
    item: &Item,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<(), String> {
    let start = Instant::now();
    let mut last = Instant::now() - Duration::from_secs(1);
    let mut downloaded = 0u64;
    let mut prefix = Vec::new();
    let mut digest = Sha1::new();
    digest.update(format!("blob {}\0", item.bytes).as_bytes());
    let mut buffer = [0u8; 65_536];
    loop {
        check_cancel(cancel)?;
        if start.elapsed() > TRANSFER_TIMEOUT {
            return Err("市场 APK 下载超时".into());
        }
        let count = input.read(&mut buffer).map_err(|_| {
            check_cancel(cancel)
                .err()
                .unwrap_or_else(|| "市场 APK 下载中断".into())
        })?;
        if count == 0 {
            break;
        }
        if downloaded + count as u64 > item.bytes {
            return Err("市场 APK 大小与目录不一致".into());
        }
        prefix.extend_from_slice(&buffer[..count.min(4usize.saturating_sub(prefix.len()))]);
        if prefix.len() == 4 && prefix != b"PK\x03\x04" {
            return Err("市场下载内容不是 APK 文件".into());
        }
        output
            .write_all(&buffer[..count])
            .map_err(|_| "无法保存市场 APK，请检查磁盘空间")?;
        digest.update(&buffer[..count]);
        downloaded += count as u64;
        if last.elapsed() >= Duration::from_millis(150) {
            report(Progress {
                stage: "downloading".into(),
                downloaded,
                total: item.bytes,
                item_id: Some(item.id.clone()),
            })?;
            last = Instant::now();
        }
    }
    check_cancel(cancel)?;
    report(Progress {
        stage: "verifying".into(),
        downloaded,
        total: item.bytes,
        item_id: Some(item.id.clone()),
    })?;
    if downloaded != item.bytes || prefix != b"PK\x03\x04" {
        return Err("市场 APK 下载不完整".into());
    }
    if format!("{:x}", digest.finalize()) != item.blob_sha {
        return Err("市场 APK 校验失败，请刷新市场后重试".into());
    }
    output.flush().map_err(|_| "无法保存市场 APK")?;
    Ok(())
}
#[derive(Deserialize)]
struct Blob<'a> {
    sha: String,
    size: u64,
    encoding: String,
    #[serde(borrow)]
    content: Cow<'a, str>,
}
fn copy_blob(
    mut input: impl Read,
    output: impl Write,
    item: &Item,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<(), String> {
    check_cancel(cancel)?;
    if item.bytes > MAX_BLOB_APK {
        return Err("市场备用下载仅支持不超过 32 MB 的 APK，请从发布页下载后手动安装".into());
    }
    let encoded_bytes = item.bytes.div_ceil(3) * 4;
    let maximum = encoded_bytes + BLOB_METADATA_BYTES;
    let started = Instant::now();
    let mut last = Instant::now() - Duration::from_secs(1);
    let mut json = Vec::new();
    let mut buffer = [0u8; 65_536];
    loop {
        check_cancel(cancel)?;
        if started.elapsed() > TRANSFER_TIMEOUT {
            return Err("市场 APK 下载超时".into());
        }
        let count = input.read(&mut buffer).map_err(|_| {
            check_cancel(cancel)
                .err()
                .unwrap_or_else(|| "市场 APK 下载中断".into())
        })?;
        if count == 0 {
            break;
        }
        if json.len() as u64 + count as u64 > maximum {
            return Err("市场备用下载数据超过预期大小".into());
        }
        json.extend_from_slice(&buffer[..count]);
        if last.elapsed() >= Duration::from_millis(150) {
            report(Progress {
                stage: "downloading".into(),
                downloaded: ((json.len() as u64).saturating_sub(BLOB_METADATA_BYTES) / 4 * 3)
                    .min(item.bytes),
                total: item.bytes,
                item_id: Some(item.id.clone()),
            })?;
            last = Instant::now();
        }
    }
    check_cancel(cancel)?;
    let blob: Blob<'_> = serde_json::from_slice(&json).map_err(|_| "市场备用下载数据无效")?;
    if blob.sha != item.blob_sha
        || blob.size != item.bytes
        || blob.encoding != "base64"
        || blob.content.len() as u64 != encoded_bytes
    {
        return Err("市场备用下载信息与目录不一致".into());
    }
    // Contents API truncates files at 10 MiB, even while reporting the original size.
    // Only Git blobs is used; decoded bytes still pass exact size and Git SHA checks.
    copy_apk(
        DecoderReader::new(blob.content.as_bytes(), &STANDARD),
        output,
        item,
        cancel,
        |mut progress| {
            // Network transfer has completed. Decoding/hash verification must not make
            // the download indicator jump backwards to the first decoded chunk.
            progress.stage = "verifying".into();
            progress.downloaded = item.bytes;
            report(progress)
        },
    )
}
fn download_apk_with(
    output: impl Write,
    item: &Item,
    revision: &str,
    cancel: &AtomicBool,
    report: impl FnMut(Progress) -> Result<(), String>,
    mut fetch: impl FnMut(&str) -> Result<Response, String>,
) -> Result<(), String> {
    check_cancel(cancel)?;
    let raw = fetch(&repository_url("raw", revision, &item.id))?;
    check_cancel(cancel)?;
    if raw.status() == reqwest::StatusCode::FORBIDDEN {
        // Public Gitee raw endpoints require login for large files. The public Git
        // blob endpoint addresses the identical immutable bytes without credentials.
        drop(raw);
        if item.bytes > MAX_BLOB_APK {
            return Err("市场备用下载仅支持不超过 32 MB 的 APK，请从发布页下载后手动安装".into());
        }
        let blob = require_ok(fetch(&api_path("git/blobs", &item.blob_sha))?)?;
        let maximum = item.bytes.div_ceil(3) * 4 + BLOB_METADATA_BYTES;
        if blob.content_length().is_some_and(|bytes| bytes > maximum) {
            return Err("市场备用下载数据超过预期大小".into());
        }
        copy_blob(blob, output, item, cancel, report)
    } else {
        let raw = require_ok(raw)?;
        if raw
            .content_length()
            .is_some_and(|bytes| bytes != item.bytes)
        {
            return Err("市场 APK 大小与目录不一致".into());
        }
        copy_apk(raw, output, item, cancel, report)
    }
}
pub fn download(
    directory: &Path,
    id: &str,
    revision: Option<&str>,
    cancel: &AtomicBool,
    mut report: impl FnMut(Progress) -> Result<(), String>,
) -> Result<Download, String> {
    if apk_kind(id).is_none() {
        return Err("市场 APK 标识无效".into());
    }
    if revision.is_some_and(|r| !valid_sha(r)) {
        return Err("市场提交版本无效".into());
    }
    check_cancel(cancel)?;
    let catalog = catalog(directory, false, cancel, &mut report)?;
    if revision.is_some_and(|revision| revision != catalog.revision) {
        return Err("市场目录已更新，请刷新市场后重试".into());
    }
    let item = catalog
        .items
        .into_iter()
        .find(|item| item.id == id)
        .ok_or("市场中没有找到此 APK，请刷新市场")?;
    let root = directory.join("market/apks").join(&item.blob_sha);
    fs::create_dir_all(&root).map_err(|_| "无法创建市场下载目录")?;
    let target = root.join(cache_file_name(&item.file_name));
    report(Progress {
        stage: "verifying".into(),
        downloaded: 0,
        total: item.bytes,
        item_id: Some(item.id.clone()),
    })?;
    if verified_file(&target, &item, cancel)? {
        report(Progress {
            stage: "verifying".into(),
            downloaded: item.bytes,
            total: item.bytes,
            item_id: Some(item.id.clone()),
        })?;
        check_cancel(cancel)?;
        save_optional_logo(directory, &target, &item, cancel);
        return Ok(Download {
            item,
            path: target.to_string_lossy().into_owned(),
            home_background: None,
            home_background_color: None,
        });
    }
    check_cancel(cancel)?;
    let temporary = Temporary(temporary_path(&root, "part"));
    let mut output = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary.0)
        .map_err(|_| "无法创建市场下载文件")?;
    report(Progress {
        stage: "downloading".into(),
        downloaded: 0,
        total: item.bytes,
        item_id: Some(item.id.clone()),
    })?;
    let client = client()?;
    download_apk_with(
        &mut output,
        &item,
        &catalog.revision,
        cancel,
        &mut report,
        |address| response_with_status(&client, address, cancel),
    )?;
    output.sync_all().map_err(|_| "无法保存市场 APK")?;
    drop(output);
    check_cancel(cancel)?;
    fs::rename(&temporary.0, &target).map_err(|_| "无法完成市场 APK 下载")?;
    save_optional_logo(directory, &target, &item, cancel);
    Ok(Download {
        item,
        path: target.to_string_lossy().into_owned(),
        home_background: None,
        home_background_color: None,
    })
}

fn logo_matches(bytes: &[u8], item: &Item, cancel: &AtomicBool) -> bool {
    item.logo_bytes == Some(bytes.len() as u64)
        && crate::app_logos::valid_svg(bytes).is_some()
        && git_hash_reader(std::io::Cursor::new(bytes), bytes.len() as u64, cancel)
            .ok()
            .as_ref()
            == item.logo_blob_sha.as_ref()
}
fn cache_logo_with(
    root: &Path,
    item: &Item,
    cancel: &AtomicBool,
    mut fetch: impl FnMut(&str) -> Result<Vec<u8>, String>,
) -> Result<Option<String>, String> {
    let Some(address) = item.logo_url.as_deref() else {
        return Ok(None);
    };
    check_cancel(cancel)?;
    let target = root.join("logo.svg");
    if fs::symlink_metadata(&target)
        .ok()
        .is_some_and(|m| m.is_file() && m.len() <= crate::app_logos::MAX_LOGO as u64)
    {
        let mut bytes = Vec::new();
        if File::open(&target)
            .and_then(|file| {
                file.take(crate::app_logos::MAX_LOGO as u64 + 1)
                    .read_to_end(&mut bytes)
            })
            .is_ok()
            && logo_matches(&bytes, item, cancel)
        {
            return Ok(String::from_utf8(bytes).ok());
        }
    }
    let bytes = fetch(address)?;
    check_cancel(cancel)?;
    if !logo_matches(&bytes, item, cancel) {
        return Err("应用 logo.svg 校验失败".into());
    }
    let temporary = Temporary(temporary_path(root, "svg"));
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary.0)
        .map_err(|_| "无法保存应用图标")?;
    file.write_all(&bytes).map_err(|_| "无法保存应用图标")?;
    file.sync_all().map_err(|_| "无法保存应用图标")?;
    drop(file);
    check_cancel(cancel)?;
    if target.exists() {
        fs::remove_file(&target).map_err(|_| "无法更新应用图标")?;
    }
    fs::rename(&temporary.0, &target).map_err(|_| "无法保存应用图标")?;
    Ok(String::from_utf8(bytes).ok())
}
fn save_optional_logo(directory: &Path, apk: &Path, item: &Item, cancel: &AtomicBool) {
    if item.logo_url.is_none() || cancel.load(Ordering::Acquire) {
        return;
    }
    let Some(root) = apk.parent() else {
        return;
    };
    let result = cache_logo_with(root, item, cancel, |address| {
        let client = Client::builder()
            .https_only(true)
            .redirect(redirect::Policy::none())
            .connect_timeout(Duration::from_secs(3))
            .timeout(Duration::from_secs(3))
            .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
            .build()
            .map_err(|_| "无法准备图标下载")?;
        let mut stream = response(&client, address, cancel)?;
        if stream
            .content_length()
            .is_some_and(|n| n > crate::app_logos::MAX_LOGO as u64)
        {
            return Err("应用图标过大".into());
        }
        let start = Instant::now();
        let mut bytes = Vec::new();
        let mut buffer = [0; 1024];
        loop {
            check_cancel(cancel)?;
            if start.elapsed() > Duration::from_secs(10) {
                return Err("应用图标下载超时".into());
            }
            let count = stream.read(&mut buffer).map_err(|_| "无法读取应用图标")?;
            if count == 0 {
                break;
            }
            if bytes.len() + count > crate::app_logos::MAX_LOGO {
                return Err("应用图标过大".into());
            }
            bytes.extend_from_slice(&buffer[..count]);
        }
        Ok(bytes)
    });
    // Optional artwork must never turn a verified APK download into a failure.
    if let Ok(Some(svg)) = result {
        let _ = crate::app_logos::save(directory, apk, &svg);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::io::Cursor;
    const REV: &str = "06f4b4d782be0d0a82b915b64ca0587fa6f703bf";
    fn temp() -> Temporary {
        let path = std::env::temp_dir().join(format!(
            "puretv-market-tests-{}-{}",
            std::process::id(),
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).unwrap();
        Temporary(path)
    }
    fn tree(paths: &[&str]) -> Vec<u8> {
        serde_json::to_vec(&json!({"sha":"master","truncated":false,"tree":paths.iter().map(|path|json!({"path":path,"type":"blob","mode":"100644","size":25,"sha":"a".repeat(40)})).collect::<Vec<_>>()})).unwrap()
    }
    fn item(bytes: &[u8]) -> Item {
        let cancel = AtomicBool::new(false);
        Item {
            id: "apps/example/Example-1.2.3.apk".into(),
            kind: "app".into(),
            name: "Example".into(),
            version: Some("1.2.3".into()),
            file_name: "Example-1.2.3.apk".into(),
            bytes: bytes.len() as u64,
            blob_sha: git_hash_reader(Cursor::new(bytes), bytes.len() as u64, &cancel).unwrap(),
            folder_url: repository_url("tree", REV, "apps/example"),
            cover_url: None,
            logo_url: None,
            logo_blob_sha: None,
            logo_bytes: None,
        }
    }
    #[test]
    fn discovers_commit_pinned_folder_logos_and_rejects_cache_url_tampering() {
        let catalog = parse_tree(
            &tree(&[
                "apps/example/Example-1.0.0.apk",
                "apps/example/Example-2.0.0.apk",
                "apps/example/logo.svg",
                "apps/other/Other.apk",
                "launcher/home/Home.apk",
                "launcher/home/logo.svg",
                "apps/logo.svg",
            ]),
            REV,
            1,
        )
        .unwrap();
        assert!(validate_catalog(&catalog));
        let first = &catalog.items[0];
        assert_eq!(first.logo_bytes, Some(25));
        assert_eq!(
            first.logo_blob_sha.as_deref(),
            Some("a".repeat(40).as_str())
        );
        assert_eq!(first.logo_url, catalog.items[1].logo_url);
        assert_eq!(
            first.logo_url,
            Some(repository_url("raw", REV, "apps/example/logo.svg"))
        );
        assert!(catalog.items[2].logo_url.is_none());
        assert!(catalog.items[3]
            .logo_url
            .as_ref()
            .unwrap()
            .ends_with("launcher/home/logo.svg"));
        let mut tampered = catalog.clone();
        tampered.items[0].logo_url = Some("https://evil.example/icon.svg".into());
        assert!(!validate_catalog(&tampered));
        tampered = catalog;
        tampered.items[0].logo_blob_sha = None;
        assert!(!validate_catalog(&tampered));
    }
    #[test]
    fn optional_logo_cache_checks_hash_content_and_revision_before_reuse() {
        let root = temp();
        let cancel = AtomicBool::new(false);
        let bytes = b"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><path d=\"M0 0H64V64H0Z\"/></svg>";
        let mut selected = item(b"PK\x03\x04test apk");
        assert_eq!(
            cache_logo_with(&root.0, &selected, &cancel, |_| panic!(
                "No logo should not fetch"
            ))
            .unwrap(),
            None
        );
        selected.logo_url = Some(repository_url("raw", REV, "apps/example/logo.svg"));
        selected.logo_bytes = Some(bytes.len() as u64);
        selected.logo_blob_sha =
            Some(git_hash_reader(Cursor::new(bytes), bytes.len() as u64, &cancel).unwrap());
        let result = cache_logo_with(&root.0, &selected, &cancel, |_| Ok(bytes.to_vec()))
            .unwrap()
            .unwrap();
        assert_eq!(result.as_bytes(), bytes);
        assert_eq!(fs::read(root.0.join("logo.svg")).unwrap(), bytes);
        assert!(cache_logo_with(&root.0, &selected, &cancel, |_| panic!(
            "Verified cache must not fetch"
        ))
        .unwrap()
        .is_some());
        fs::write(root.0.join("logo.svg"), b"<svg onload='evil()'/>").unwrap();
        assert!(cache_logo_with(&root.0, &selected, &cancel, |_| Err("offline".into())).is_err());
        assert!(cache_logo_with(&root.0, &selected, &cancel, |_| Ok(b"<svg/>".to_vec())).is_err());
        let unsafe_svg = b"<svg onload='evil()'/>";
        selected.logo_bytes = Some(unsafe_svg.len() as u64);
        selected.logo_blob_sha = Some(
            git_hash_reader(Cursor::new(unsafe_svg), unsafe_svg.len() as u64, &cancel).unwrap(),
        );
        assert!(cache_logo_with(&root.0, &selected, &cancel, |_| Ok(unsafe_svg.to_vec())).is_err());
        cancel.store(true, Ordering::Release);
        assert!(cache_logo_with(&root.0, &selected, &cancel, |_| panic!(
            "Cancelled logo should not fetch"
        ))
        .is_err());
        fs::remove_dir_all(root.0.clone()).unwrap();
    }
    #[test]
    fn old_catalog_cache_is_refetched_once_to_discover_logos() {
        let root = temp();
        let value = parse_tree(&tree(&["apps/example/Example.apk"]), REV, now_ms()).unwrap();
        fs::create_dir_all(root.0.join("market")).unwrap();
        fs::write(
            root.0.join("market/catalog.json"),
            serde_json::to_vec(&value).unwrap(),
        )
        .unwrap();
        assert!(read_cache(&root.0).is_none());
        write_cache(&root.0, &value).unwrap();
        assert!(read_cache(&root.0).is_some());
        fs::remove_dir_all(root.0.clone()).unwrap();
    }
    #[test]
    fn scans_both_roots_and_keeps_multiple_apks_without_hardcoded_names() {
        let catalog = parse_tree(
            &tree(&[
                "apps/new app/TV App-1.2.3.apk",
                "apps/new app/TV App-1.2.4.apk",
                "apps/new app/thumb.png",
                "launcher/new/Sample.apk",
                "launcher/new/Sample.apk.thumb.png",
                "docs/ignored.apk",
            ]),
            REV,
            1,
        )
        .unwrap();
        assert_eq!(catalog.items.len(), 3);
        assert_eq!(catalog.items[0].name, "TV App");
        assert_eq!(catalog.items[0].version.as_deref(), Some("1.2.3"));
        assert!(catalog.items[0]
            .cover_url
            .as_ref()
            .unwrap()
            .contains("new%20app/thumb.png"));
        assert_eq!(catalog.items[2].kind, "launcher");
        assert!(catalog.items[2]
            .cover_url
            .as_ref()
            .unwrap()
            .ends_with("Sample.apk.thumb.png"));
        assert!(validate_catalog(&catalog));
    }
    #[test]
    fn named_thumbnail_wins_and_catalog_never_silently_truncates() {
        let catalog = parse_tree(
            &tree(&[
                "launcher/new/Sample.apk",
                "launcher/new/Sample.thumb.png",
                "launcher/new/Sample.apk.thumb.png",
                "launcher/new/thumb.png",
            ]),
            REV,
            1,
        )
        .unwrap();
        assert!(catalog.items[0]
            .cover_url
            .as_ref()
            .unwrap()
            .ends_with("Sample.thumb.png"));
        assert!(validate_catalog(&catalog));
        let paths: Vec<String> = (0..MAX_ITEMS)
            .map(|n| format!("apps/application/{n:04}-{}.apk", "x".repeat(180)))
            .collect();
        assert!(parse_tree(
            &tree(&paths.iter().map(String::as_str).collect::<Vec<_>>()),
            REV,
            1
        )
        .unwrap_err()
        .contains("目录超过"));
    }
    #[test]
    fn cache_names_remain_recognizable_without_windows_devices_or_path_escape() {
        assert_eq!(cache_file_name("hifini-0.1.3.apk"), "hifini-0.1.3.apk");
        assert_eq!(cache_file_name("音乐-1.2.apk"), "音乐-1.2.apk");
        assert_eq!(cache_file_name("CON.apk"), "_CON.apk");
        for name in [
            "../evil.apk",
            "..\\evil.apk",
            "a:b?.apk",
            "LPT1.apk",
            ".apk",
        ] {
            let safe = cache_file_name(name);
            assert!(!safe.contains(['/', '\\', ':', '?']));
            assert_eq!(Path::new(&safe).components().count(), 1);
            assert!(!safe.starts_with('.'));
        }
    }
    #[test]
    fn rejects_truncated_duplicate_unsafe_and_invalid_catalogs() {
        assert!(parse_tree(br#"{"tree":[],"truncated":true}"#, REV, 1).is_err());
        for paths in [
            &["apps/a/../outside.apk"][..],
            &["apps/a.apk", "apps/a.apk"][..],
        ] {
            assert!(parse_tree(&tree(paths), REV, 1).is_err());
        }
        let mut catalog = parse_tree(&tree(&["apps/ok.apk"]), REV, 1).unwrap();
        catalog.items[0].folder_url = "https://evil.example/".into();
        assert!(!validate_catalog(&catalog));
        assert_eq!(
            parse_tree(&tree(&["other/only.apk"]), REV, 1)
                .unwrap()
                .items
                .len(),
            0
        );
    }
    #[test]
    fn branch_name_uses_one_encoded_api_segment_and_commit_is_not_tree_response_sha() {
        assert!(api_path("branches", "release/stable").ends_with("branches/release%2Fstable"));
        let catalog = parse_tree(&tree(&["launcher/new/name.apk"]), REV, 1).unwrap();
        assert_eq!(catalog.revision, REV);
        assert!(catalog.items[0].folder_url.contains(REV));
    }
    #[test]
    fn cancellation_never_falls_back_to_stale_catalog() {
        let root = temp();
        let cancel = AtomicBool::new(false);
        write_cache(
            &root.0,
            &parse_tree(&tree(&["apps/a.apk"]), REV, now_ms()).unwrap(),
        )
        .unwrap();
        let result = catalog_with(
            &root.0,
            true,
            &cancel,
            |_| Ok(()),
            |_| {
                cancel.store(true, Ordering::Release);
                Err("network cancelled".into())
            },
        );
        assert!(result.unwrap_err().contains("取消"));
        fs::remove_dir_all(&root.0).unwrap();
    }
    #[test]
    fn fresh_cache_avoids_network_refresh_updates_and_failure_marks_stale() {
        let root = temp();
        let cancel = AtomicBool::new(false);
        let original = parse_tree(&tree(&["apps/first.apk"]), REV, now_ms()).unwrap();
        write_cache(&root.0, &original).unwrap();
        let value = catalog_with(
            &root.0,
            false,
            &cancel,
            |_| Ok(()),
            |_| panic!("fresh cache contacted server"),
        )
        .unwrap();
        assert!(!value.stale);
        let stale = catalog_with(
            &root.0,
            true,
            &cancel,
            |_| Ok(()),
            |_| Err("offline".into()),
        )
        .unwrap();
        assert!(stale.stale);
        assert_eq!(stale.items, original.items);
        assert!(stale.warning.unwrap().contains("offline"));
        let mut addresses = Vec::new();
        let updated = catalog_with(
            &root.0,
            true,
            &cancel,
            |_| Ok(()),
            |url| {
                addresses.push(url.to_string());
                Ok(match addresses.len() {
                    1 => br#"{"default_branch":"master"}"#.to_vec(),
                    2 => serde_json::to_vec(&json!({"commit":{"sha":REV}})).unwrap(),
                    _ => tree(&["apps/new.apk", "launcher/new.apk"]),
                })
            },
        )
        .unwrap();
        assert_eq!(updated.items.len(), 2);
        assert!(addresses[2].contains(REV));
        assert_eq!(read_cache(&root.0).unwrap().items, updated.items);
        fs::remove_dir_all(&root.0).unwrap();
    }
    #[test]
    fn downloads_check_git_blob_hash_not_plain_sha1_and_accept_chunked_data() {
        let bytes = b"PK\x03\x04actual APK fixture";
        let item = item(bytes);
        let cancel = AtomicBool::new(false);
        let mut output = Vec::new();
        let mut stages = Vec::new();
        copy_apk(Cursor::new(bytes), &mut output, &item, &cancel, |p| {
            stages.push(p);
            Ok(())
        })
        .unwrap();
        assert_eq!(output, bytes);
        assert_ne!(item.blob_sha, format!("{:x}", Sha1::digest(bytes)));
        assert_eq!(stages.last().unwrap().stage, "verifying");
        for bad in [
            &bytes[..8],
            b"PK\x03\x04actual APK fixturE",
            b"<html>sign in page",
        ] {
            assert!(copy_apk(Cursor::new(bad), Vec::new(), &item, &cancel, |_| Ok(())).is_err());
        }
        let mut oversized = bytes.to_vec();
        oversized.push(0);
        assert!(
            copy_apk(Cursor::new(oversized), Vec::new(), &item, &cancel, |_| Ok(
                ()
            ))
            .is_err()
        );
    }
    fn blob_json(bytes: &[u8], item: &Item) -> Vec<u8> {
        use base64::Engine;
        serde_json::to_vec(&json!({"sha":item.blob_sha,"size":item.bytes,
            "encoding":"base64","content":STANDARD.encode(bytes)}))
        .unwrap()
    }
    fn mock_response(status: u16, body: Vec<u8>) -> Response {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut request = [0; 4096];
            stream.read(&mut request).unwrap();
            write!(
                stream,
                "HTTP/1.1 {status} Test\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                body.len()
            )
            .unwrap();
            let _ = stream.write_all(&body);
        });
        Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(2))
            .build()
            .unwrap()
            .get(format!("http://{address}"))
            .send()
            .unwrap()
    }
    #[test]
    fn forbidden_raw_uses_only_the_selected_git_blob_and_verifies_decoded_apk() {
        let bytes = b"PK\x03\x04large public APK fixture";
        let item = item(bytes);
        let cancel = AtomicBool::new(false);
        let mut addresses = Vec::new();
        let mut output = Vec::new();
        let mut stages = Vec::new();
        download_apk_with(
            &mut output,
            &item,
            REV,
            &cancel,
            |p| {
                stages.push(p);
                Ok(())
            },
            |address| {
                addresses.push(address.to_owned());
                Ok(if addresses.len() == 1 {
                    mock_response(403, b"large file require login for access.".to_vec())
                } else {
                    mock_response(200, blob_json(bytes, &item))
                })
            },
        )
        .unwrap();
        assert_eq!(
            addresses,
            vec![
                repository_url("raw", REV, &item.id),
                api_path("git/blobs", &item.blob_sha)
            ]
        );
        assert_eq!(output, bytes);
        assert!(stages
            .windows(2)
            .all(|pair| pair[0].downloaded <= pair[1].downloaded));
        assert_eq!(stages.last().unwrap().stage, "verifying");
        assert_eq!(stages.last().unwrap().downloaded, item.bytes);
    }
    #[test]
    fn successful_raw_and_non_forbidden_failures_never_use_blob_api() {
        let bytes = b"PK\x03\x04raw fixture";
        let item = item(bytes);
        let cancel = AtomicBool::new(false);
        for status in [200, 401, 404, 429, 500] {
            let mut addresses = Vec::new();
            let mut output = Vec::new();
            let result = download_apk_with(
                &mut output,
                &item,
                REV,
                &cancel,
                |_| Ok(()),
                |address| {
                    addresses.push(address.to_owned());
                    Ok(mock_response(status, bytes.to_vec()))
                },
            );
            assert_eq!(addresses, vec![repository_url("raw", REV, &item.id)]);
            if status == 200 {
                assert_eq!(output, bytes);
                result.unwrap();
            } else {
                assert!(result.unwrap_err().contains(&format!("HTTP {status}")));
            }
        }
        let mut calls = 0;
        assert!(download_apk_with(
            Vec::new(),
            &item,
            REV,
            &cancel,
            |_| Ok(()),
            |_| {
                calls += 1;
                Err("offline".into())
            }
        )
        .unwrap_err()
        .contains("offline"));
        assert_eq!(calls, 1);
        let mut large = item.clone();
        large.bytes = MAX_BLOB_APK + 1;
        assert_eq!(
            download_apk_with(
                Vec::new(),
                &large,
                REV,
                &cancel,
                |_| Ok(()),
                |_| { Ok(mock_response(403, Vec::new())) }
            )
            .unwrap_err(),
            "市场备用下载仅支持不超过 32 MB 的 APK，请从发布页下载后手动安装"
        );
        assert_eq!(
            download_apk_with(
                Vec::new(),
                &large,
                REV,
                &cancel,
                |_| Ok(()),
                |_| { Ok(mock_response(200, bytes.to_vec())) }
            )
            .unwrap_err(),
            "市场 APK 大小与目录不一致",
            "Raw downloads retain their independent 512 MB limit"
        );
    }
    #[test]
    fn blob_api_rejects_metadata_truncation_invalid_base64_and_wrong_content() {
        use base64::Engine;
        let bytes = b"PK\x03\x04blob fixture";
        let item = item(bytes);
        let cancel = AtomicBool::new(false);
        let original: serde_json::Value = serde_json::from_slice(&blob_json(bytes, &item)).unwrap();
        for (field, value) in [
            ("sha", json!("0".repeat(40))),
            ("size", json!(item.bytes + 1)),
            ("encoding", json!("utf-8")),
            ("content", json!(STANDARD.encode(&bytes[..4]))),
            (
                "content",
                json!("!".repeat(item.bytes.div_ceil(3) as usize * 4)),
            ),
            ("content", json!(STANDARD.encode(b"PK\x03\x04blob fixturE"))),
        ] {
            let mut bad = original.clone();
            bad[field] = value;
            assert!(
                copy_blob(
                    Cursor::new(serde_json::to_vec(&bad).unwrap()),
                    Vec::new(),
                    &item,
                    &cancel,
                    |_| Ok(())
                )
                .is_err(),
                "Accepted bad {field}"
            );
        }
        assert!(copy_blob(
            Cursor::new(b"<html>login</html>"),
            Vec::new(),
            &item,
            &cancel,
            |_| Ok(())
        )
        .is_err());
        let oversized =
            std::io::repeat(b' ').take(item.bytes.div_ceil(3) * 4 + BLOB_METADATA_BYTES + 1);
        assert_eq!(
            copy_blob(oversized, Vec::new(), &item, &cancel, |_| Ok(())).unwrap_err(),
            "市场备用下载数据超过预期大小"
        );
    }
    #[test]
    fn blob_fallback_cancellation_and_errors_leave_no_partial_apk() {
        let root = temp();
        let bytes = b"PK\x03\x04cancelled blob fixture";
        let item = item(bytes);
        let cancel = AtomicBool::new(false);
        let partial = temporary_path(&root.0, "part");
        {
            let guard = Temporary(partial.clone());
            let mut output = File::create(&guard.0).unwrap();
            let mut calls = 0;
            let error = download_apk_with(
                &mut output,
                &item,
                REV,
                &cancel,
                |_| {
                    cancel.store(true, Ordering::Release);
                    Ok(())
                },
                |_| {
                    calls += 1;
                    Ok(if calls == 1 {
                        mock_response(403, Vec::new())
                    } else {
                        mock_response(200, blob_json(bytes, &item))
                    })
                },
            )
            .unwrap_err();
            assert!(error.contains("取消"));
            assert_eq!(calls, 2);
        }
        assert!(!partial.exists());
        assert!(download_apk_with(
            Vec::new(),
            &item,
            REV,
            &cancel,
            |_| Ok(()),
            |_| { panic!("Cancelled download must not request another endpoint") }
        )
        .is_err());
        cancel.store(false, Ordering::Release);
        let mut calls = 0;
        let error = download_apk_with(
            Vec::new(),
            &item,
            REV,
            &cancel,
            |_| Ok(()),
            |_| {
                calls += 1;
                cancel.store(true, Ordering::Release);
                Ok(mock_response(403, Vec::new()))
            },
        )
        .unwrap_err();
        assert!(error.contains("取消"));
        assert_eq!(
            calls, 1,
            "Cancellation after raw response must prevent the API request"
        );
        cancel.store(false, Ordering::Release);
        let mut calls = 0;
        let error = download_apk_with(
            Vec::new(),
            &item,
            REV,
            &cancel,
            |_| Ok(()),
            |_| {
                calls += 1;
                Ok(mock_response(
                    if calls == 1 { 403 } else { 500 },
                    Vec::new(),
                ))
            },
        )
        .unwrap_err();
        assert!(error.contains("HTTP 500"));
        assert_eq!(calls, 2);
        fs::remove_dir_all(&root.0).unwrap();
    }
    #[test]
    fn cache_hits_are_rehashed_and_cancelled_downloads_drop_partials() {
        let root = temp();
        let cancel = AtomicBool::new(false);
        let bytes = b"PK\x03\x04sample file";
        let item = item(bytes);
        let path = root.0.join("cache.apk");
        fs::write(&path, bytes).unwrap();
        assert!(verified_file(&path, &item, &cancel).unwrap());
        fs::write(&path, b"PK\x03\x04sample filE").unwrap();
        assert!(!verified_file(&path, &item, &cancel).unwrap());
        let partial = temporary_path(&root.0, "part");
        {
            let guard = Temporary(partial.clone());
            let mut output = File::create(&guard.0).unwrap();
            assert!(
                copy_apk(Cursor::new(bytes), &mut output, &item, &cancel, |_| {
                    cancel.store(true, Ordering::Release);
                    Ok(())
                })
                .is_err()
            );
        }
        assert!(!partial.exists());
        fs::remove_dir_all(&root.0).unwrap();
    }
    #[test]
    fn invalid_ids_and_revisions_fail_before_touching_network_or_disk() {
        let root = temp();
        let cancel = AtomicBool::new(false);
        for id in [
            "",
            "../x.apk",
            "apps/../../x.apk",
            "https://evil.example/app.apk",
            "launcher/x.txt",
        ] {
            assert!(download(&root.0, id, Some(REV), &cancel, |_| Ok(())).is_err());
        }
        assert!(download(&root.0, "apps/a.apk", Some("master"), &cancel, |_| Ok(())).is_err());
        assert!(!root.0.join("market").exists());
        fs::remove_dir_all(&root.0).unwrap();
    }
    #[test]
    fn redirects_only_allow_fixed_repository_on_gitee_https_hosts() {
        for url in [API.into(),format!("{SOURCE_URL}/raw/{REV}/apps/a.apk"),format!("https://raw.giteeusercontent.com/juzisang331/pure-tv-store/raw/{REV}/apps/a.apk?metadata=abc&signature=def")] {assert!(allowed_url(&Url::parse(&url).unwrap()));}
        for url in [
            "http://gitee.com/juzisang331/pure-tv-store/raw/master/a.apk",
            "https://gitee.com/other/repo/raw/master/a.apk",
            "https://raw.giteeusercontent.com.evil.example/juzisang331/pure-tv-store/a.apk",
            "https://user:password@gitee.com/juzisang331/pure-tv-store/a.apk",
        ] {
            assert!(!allowed_url(&Url::parse(url).unwrap()));
        }
    }
    #[test]
    fn blocking_timeout_is_per_read_not_whole_download() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let server = std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut request = [0; 1024];
            stream.read(&mut request).unwrap();
            stream
                .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 8\r\nConnection: close\r\n\r\n")
                .unwrap();
            for _ in 0..8 {
                std::thread::sleep(Duration::from_millis(100));
                stream.write_all(b"a").unwrap();
                stream.flush().unwrap();
            }
        });
        let client = Client::builder()
            .no_proxy()
            .timeout(Duration::from_millis(500))
            .build()
            .unwrap();
        let start = Instant::now();
        let mut response = client.get(format!("http://{address}")).send().unwrap();
        let mut bytes = Vec::new();
        response.read_to_end(&mut bytes).unwrap();
        assert_eq!(bytes, b"aaaaaaaa");
        assert!(start.elapsed() > Duration::from_millis(500));
        server.join().unwrap();
    }
    #[test]
    #[ignore = "downloads the public catalog, small and large APKs, and reuses verified cache"]
    fn live_store_catalog_and_download() {
        let root = temp();
        let cancel = AtomicBool::new(false);
        let catalog = catalog(&root.0, true, &cancel, |_| Ok(())).unwrap();
        assert!(valid_sha(&catalog.revision));
        assert!(!catalog.stale);
        if let Ok(path) = std::env::var("PURETV_MARKET_CATALOG_OUTPUT") {
            fs::write(path, serde_json::to_vec_pretty(&catalog).unwrap()).unwrap();
        }
        eprintln!(
            "public Gitee revision {}, {} APKs",
            catalog.revision,
            catalog.items.len()
        );
        let mut samples: Vec<_> = ["app", "launcher"]
            .iter()
            .map(|kind| {
                catalog
                    .items
                    .iter()
                    .filter(|i| i.kind == *kind)
                    .min_by_key(|i| i.bytes)
                    .unwrap()
            })
            .collect();
        // Raw downloads of APKs above 10 MiB can require login; exercise that
        // production path too instead of passing with only the smallest files.
        samples.extend(
            catalog
                .items
                .iter()
                .filter(|i| i.bytes >= 10 * 1024 * 1024 && i.bytes <= MAX_BLOB_APK),
        );
        samples.sort_by_key(|i| &i.id);
        samples.dedup_by_key(|i| &i.id);
        for item in samples {
            let result = download(&root.0, &item.id, Some(&catalog.revision), &cancel, |_| {
                Ok(())
            })
            .unwrap();
            assert_eq!(&result.item, item);
            assert_eq!(fs::metadata(&result.path).unwrap().len(), item.bytes);
            assert!(verified_file(Path::new(&result.path), item, &cancel).unwrap());
            let mut archive = zip::ZipArchive::new(File::open(&result.path).unwrap()).unwrap();
            assert!(archive.by_name("AndroidManifest.xml").unwrap().size() > 0);
            drop(archive);
            let modified = fs::metadata(&result.path).unwrap().modified().unwrap();
            let reused = download(
                &root.0,
                &item.id,
                Some(&catalog.revision),
                &cancel,
                |progress| {
                    assert_ne!(progress.stage, "downloading", "cache was not reused");
                    Ok(())
                },
            )
            .unwrap();
            assert_eq!(result.path, reused.path);
            assert_eq!(
                fs::metadata(&reused.path).unwrap().modified().unwrap(),
                modified
            );
            eprintln!(
                "verified {} {}: {} bytes, Git blob {}, cache reused",
                item.kind, item.id, item.bytes, item.blob_sha
            );
        }
        fs::remove_dir_all(&root.0).unwrap();
    }
}
