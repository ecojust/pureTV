//! Read-only HTTPS directory catalog and APK cache. Server validators identify a
//! selected file; locally computed SHA256 receipts detect cached-file corruption.
//! HTTP ETags are not advertised as publisher-supplied content hashes.
use crate::app_store::{self, FileMetadata};
use reqwest::{
    blocking::{Client, Response},
    header, redirect, Method,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{HashMap, HashSet},
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::atomic::{AtomicBool, AtomicU64, Ordering},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const SOURCE_URL: &str = app_store::SOURCE_URL;
const CACHE_NAME: &str = "catalog-http-v1.json";
const CACHE_AGE_MS: u64 = 5 * 60 * 1000;
const MAX_DIRECTORY: u64 = 4 * 1024 * 1024;
const MAX_CATALOG: usize = 256 * 1024;
const MAX_APK: u64 = 512 * 1024 * 1024;
const MAX_ITEMS: usize = 1024;
const MAX_MANIFEST: u64 = 64 * 1024;
const MAX_PROVIDER_BYTES: usize = 512;
const METADATA_TIMEOUT: Duration = Duration::from_secs(45);
const NETWORK_TIMEOUT: Duration = Duration::from_secs(10);
const TRANSFER_TIMEOUT: Duration = Duration::from_secs(15 * 60);
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub kind: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    pub version: Option<String>,
    pub file_name: String,
    pub bytes: u64,
    /// Legacy IPC name: opaque SHA256 fingerprint of path and HTTP metadata,
    /// not a Git blob hash or a publisher-supplied APK checksum.
    pub blob_sha: String,
    pub download_metadata: FileMetadata,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_sha256: Option<String>,
    pub folder_url: String,
    pub cover_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub logo_url: Option<String>,
    /// Legacy IPC name: SHA256 of the bounded SVG fetched with this catalog.
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
#[derive(Serialize, Deserialize)]
struct Receipt {
    id: String,
    identity: String,
    bytes: u64,
    sha256: String,
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
    value.len() == 64
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
    if path.starts_with("game/") || path.starts_with("media/") {
        Some("app")
    } else if path.starts_with("launcher/") {
        Some("launcher")
    } else {
        None
    }
}
fn name_version(file_name: &str) -> (String, Option<String>) {
    let stem = &file_name[..file_name.len() - 4];
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
            file_name.into()
        } else {
            stem.into()
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
fn valid_provider(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= MAX_PROVIDER_BYTES
        && value.trim() == value
        && !value.chars().any(char::is_control)
}
fn provider_from_manifest(bytes: &[u8]) -> Option<String> {
    if bytes.len() as u64 > MAX_MANIFEST {
        return None;
    }
    let value: serde_json::Value = serde_json::from_slice(bytes).ok()?;
    let provider = value.get("provider")?.as_str()?.trim();
    valid_provider(provider).then(|| provider.to_owned())
}
fn checksum_from_manifest(bytes: &[u8], file_name: &str, file_bytes: u64) -> Option<String> {
    if bytes.len() as u64 > MAX_MANIFEST {
        return None;
    }
    let value: serde_json::Value = serde_json::from_slice(bytes).ok()?;
    let packages = value.get("packages")?.as_array()?;
    let mut expected: Option<String> = None;
    for package in packages {
        if package.get("file").and_then(|v| v.as_str()) != Some(file_name)
            || package.get("bytes").and_then(|v| v.as_u64()) != Some(file_bytes)
        {
            continue;
        }
        let digest = package.get("sha256")?.as_str()?.to_ascii_lowercase();
        if !valid_sha(&digest) {
            return None;
        }
        if expected
            .as_ref()
            .is_some_and(|previous| previous != &digest)
        {
            return None;
        }
        expected = Some(digest);
    }
    expected
}
fn catalog_revision(items: &[Item]) -> Result<String, String> {
    let mut identity: Vec<_> = items
        .iter()
        .map(|item| (&item.id, &item.blob_sha))
        .collect();
    identity.sort_unstable();
    let bytes = serde_json::to_vec(&identity).map_err(|_| "无法编码市场目录")?;
    Ok(format!("{:x}", Sha256::digest(bytes)))
}
fn metadata_valid(metadata: &FileMetadata) -> bool {
    let mut headers = header::HeaderMap::new();
    let Ok(length) = header::HeaderValue::from_str(&metadata.bytes.to_string()) else {
        return false;
    };
    headers.insert(header::CONTENT_LENGTH, length);
    for (key, value) in [
        (header::ETAG, metadata.etag.as_ref()),
        (header::LAST_MODIFIED, metadata.last_modified.as_ref()),
    ] {
        if let Some(value) = value {
            let Ok(value) = header::HeaderValue::from_str(value) else {
                return false;
            };
            headers.insert(key, value);
        }
    }
    app_store::metadata_from_headers(&headers, MAX_APK).is_ok_and(|parsed| parsed == *metadata)
}
fn build_catalog(
    paths: Vec<String>,
    cancel: &AtomicBool,
    mut inspect: impl FnMut(&str) -> Result<FileMetadata, String>,
    mut fetch: impl FnMut(&str, u64) -> Result<Vec<u8>, String>,
) -> Result<Catalog, String> {
    let mut unique = HashSet::new();
    if paths.len() > 50_000
        || paths
            .iter()
            .any(|p| !valid_path(p) || !unique.insert(p.clone()))
    {
        return Err("市场目录包含无效或重复的路径".into());
    }
    let mut apks: Vec<_> = paths
        .iter()
        .filter(|path| apk_kind(path).is_some())
        .collect();
    apks.sort();
    if apks.len() > MAX_ITEMS {
        return Err("市场应用数量超过支持的上限".into());
    }
    let mut items = Vec::new();
    for path in apks {
        check_cancel(cancel)?;
        let metadata = inspect(&app_store::file_url(path)?)?;
        if !metadata_valid(&metadata) {
            return Err("市场 APK 校验信息无效".into());
        }
        let (folder, file_name) = path.rsplit_once('/').ok_or("市场 APK 路径无效")?;
        let (name, version) = name_version(file_name);
        let cover = cover_paths(folder, file_name)
            .into_iter()
            .find(|p| unique.contains(p));
        items.push(Item {
            id: path.clone(),
            kind: apk_kind(path).unwrap().into(),
            name,
            provider: None,
            version,
            file_name: file_name.into(),
            bytes: metadata.bytes,
            blob_sha: app_store::fingerprint(path, &metadata),
            download_metadata: metadata,
            content_sha256: None,
            folder_url: format!("{}/", app_store::file_url(folder)?),
            cover_url: cover.map(|p| app_store::file_url(&p)).transpose()?,
            logo_url: None,
            logo_blob_sha: None,
            logo_bytes: None,
        });
    }
    // Optional per-folder metadata is read once across multiple APK versions.
    // A broken/absent manifest or SVG must not hide an otherwise valid APK.
    let mut manifests: HashMap<String, Option<Vec<u8>>> = HashMap::new();
    let mut logos: HashMap<String, Option<(String, u64)>> = HashMap::new();
    let started = Instant::now();
    for item in &mut items {
        check_cancel(cancel)?;
        let folder = item.id.rsplit_once('/').unwrap().0;
        let manifest = format!("{folder}/manifest.json");
        if unique.contains(&manifest)
            && !manifests.contains_key(folder)
            && started.elapsed() < METADATA_TIMEOUT
        {
            let value = fetch(&app_store::file_url(&manifest)?, MAX_MANIFEST)
                .ok()
                .filter(|bytes| bytes.len() as u64 <= MAX_MANIFEST);
            check_cancel(cancel)?;
            manifests.insert(folder.into(), value);
        }
        if let Some(Some(bytes)) = manifests.get(folder) {
            item.provider = provider_from_manifest(bytes);
            item.content_sha256 = checksum_from_manifest(bytes, &item.file_name, item.bytes);
        }
        let logo = format!("{folder}/logo.svg");
        if unique.contains(&logo)
            && !logos.contains_key(folder)
            && started.elapsed() < METADATA_TIMEOUT
        {
            let value = fetch(
                &app_store::file_url(&logo)?,
                crate::app_logos::MAX_LOGO as u64,
            )
            .ok()
            .and_then(|bytes| {
                crate::app_logos::valid_svg(&bytes)?;
                Some((format!("{:x}", Sha256::digest(&bytes)), bytes.len() as u64))
            });
            check_cancel(cancel)?;
            logos.insert(folder.into(), value);
        }
        if let Some(Some((digest, bytes))) = logos.get(folder) {
            item.logo_url = Some(app_store::file_url(&logo)?);
            item.logo_blob_sha = Some(digest.clone());
            item.logo_bytes = Some(*bytes);
        }
    }
    let catalog = Catalog {
        source_url: SOURCE_URL.into(),
        revision: catalog_revision(&items)?,
        fetched_at: now_ms(),
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
        || catalog_revision(&catalog.items).ok().as_ref() != Some(&catalog.revision)
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
        let covers = cover_paths(folder, file_name).map(|path| app_store::file_url(&path).ok());
        let logo_valid = match (&item.logo_url, &item.logo_blob_sha, item.logo_bytes) {
            (None, None, None) => true,
            (Some(url), Some(sha), Some(bytes)) => {
                app_store::file_url(&format!("{folder}/logo.svg"))
                    .ok()
                    .as_ref()
                    == Some(url)
                    && valid_sha(sha)
                    && bytes > 0
                    && bytes <= crate::app_logos::MAX_LOGO as u64
            }
            _ => false,
        };
        ids.insert(&item.id)
            && item.provider.as_deref().is_none_or(valid_provider)
            && item.content_sha256.as_deref().is_none_or(valid_sha)
            && logo_valid
            && item.kind == kind
            && item.name == name
            && item.version == version
            && item.file_name == file_name
            && metadata_valid(&item.download_metadata)
            && item.bytes == item.download_metadata.bytes
            && app_store::fingerprint(&item.id, &item.download_metadata) == item.blob_sha
            && app_store::file_url(folder)
                .ok()
                .map(|url| format!("{url}/"))
                .as_ref()
                == Some(&item.folder_url)
            && item
                .cover_url
                .as_ref()
                .is_none_or(|url| covers.iter().any(|p| p.as_ref() == Some(url)))
    })
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
fn read_cache(directory: &Path) -> Option<Catalog> {
    let path = directory.join("market").join(CACHE_NAME);
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
fn write_cache(directory: &Path, catalog: &Catalog) -> Result<(), String> {
    let root = directory.join("market");
    fs::create_dir_all(&root).map_err(|_| "无法创建市场缓存目录")?;
    write_json(&root.join(CACHE_NAME), catalog)
}
fn write_json(path: &Path, value: &impl Serialize) -> Result<(), String> {
    let temporary = Temporary(temporary_path(
        path.parent().ok_or("无法保存市场缓存")?,
        "json",
    ));
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary.0)
        .map_err(|_| "无法写入市场缓存")?;
    serde_json::to_writer(&mut file, value).map_err(|_| "无法写入市场缓存")?;
    file.sync_all().map_err(|_| "无法保存市场缓存")?;
    drop(file);
    fs::rename(&temporary.0, path).map_err(|_| "无法保存市场缓存".into())
}
fn client() -> Result<Client, String> {
    Client::builder()
        .https_only(true)
        .redirect(redirect::Policy::none())
        .connect_timeout(NETWORK_TIMEOUT)
        .timeout(NETWORK_TIMEOUT)
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "无法准备市场 HTTPS 连接".into())
}
fn response(
    client: &Client,
    method: Method,
    address: &str,
    metadata: Option<&FileMetadata>,
    cancel: &AtomicBool,
) -> Result<Response, String> {
    let mut url = reqwest::Url::parse(address).map_err(|_| "市场下载地址无效")?;
    for hop in 0..=5 {
        check_cancel(cancel)?;
        if !app_store::allowed_url(&url) {
            return Err("市场服务器返回了不受支持的下载地址".into());
        }
        let request = client
            .request(method.clone(), url.clone())
            .header(header::ACCEPT_ENCODING, "identity");
        let request = if let Some(metadata) = metadata {
            app_store::apply_conditions(request, metadata)
        } else {
            request
        };
        let response = request.send().map_err(|_| {
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
        return require_ok(response);
    }
    Err("市场下载失败".into())
}
fn require_ok(response: Response) -> Result<Response, String> {
    if response.status() == reqwest::StatusCode::PRECONDITION_FAILED {
        return Err("市场目录已更新，请刷新市场后重试".into());
    }
    if response.status() != reqwest::StatusCode::OK {
        return Err(format!(
            "市场服务器返回 HTTP {}，请稍后重试",
            response.status().as_u16()
        ));
    }
    Ok(response)
}
fn fetch_bytes(
    client: &Client,
    address: &str,
    cancel: &AtomicBool,
    maximum: u64,
) -> Result<Vec<u8>, String> {
    let mut response = response(client, Method::GET, address, None, cancel)?;
    if response.content_length().is_some_and(|n| n > maximum) {
        return Err("市场目录文件过大".into());
    }
    let started = Instant::now();
    let deadline = if maximum <= MAX_MANIFEST {
        NETWORK_TIMEOUT
    } else {
        Duration::from_secs(45)
    };
    let mut bytes = Vec::new();
    let mut buffer = [0u8; 16_384];
    loop {
        check_cancel(cancel)?;
        if started.elapsed() > deadline {
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
        if bytes.len() as u64 + count as u64 > maximum {
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
    mut discover: impl FnMut() -> Result<Vec<String>, String>,
    inspect: impl FnMut(&str) -> Result<FileMetadata, String>,
    fetch: impl FnMut(&str, u64) -> Result<Vec<u8>, String>,
) -> Result<Catalog, String> {
    check_cancel(cancel)?;
    // Never load legacy Gitee catalog-v2/v3. A source migration starts a new cache.
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
        let catalog = build_catalog(discover()?, cancel, inspect, fetch)?;
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
    catalog_with(
        directory,
        refresh,
        cancel,
        report,
        || {
            app_store::list_files_with(&["launcher", "media", "game"], cancel, |url| {
                fetch_bytes(&client, url, cancel, MAX_DIRECTORY)
            })
        },
        |url| {
            let response = response(&client, Method::HEAD, url, None, cancel)?;
            app_store::metadata_from_headers(response.headers(), MAX_APK)
        },
        |url, maximum| fetch_bytes(&client, url, cancel, maximum),
    )
}
fn sha256_reader(mut input: impl Read, size: u64, cancel: &AtomicBool) -> Result<String, String> {
    let mut digest = Sha256::new();
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
    let receipt_path = path.with_extension("receipt.json");
    if fs::symlink_metadata(&receipt_path)
        .ok()
        .is_none_or(|m| !m.is_file() || m.len() > 4096)
    {
        return Ok(false);
    }
    let Some(receipt) = fs::read(&receipt_path)
        .ok()
        .and_then(|bytes| serde_json::from_slice::<Receipt>(&bytes).ok())
    else {
        return Ok(false);
    };
    if receipt.id != item.id
        || receipt.identity != item.blob_sha
        || receipt.bytes != item.bytes
        || !valid_sha(&receipt.sha256)
        || item
            .content_sha256
            .as_ref()
            .is_some_and(|expected| expected != &receipt.sha256)
    {
        return Ok(false);
    }
    Ok(sha256_reader(
        File::open(path).map_err(|_| "无法读取市场 APK 缓存")?,
        item.bytes,
        cancel,
    )? == receipt.sha256)
}
fn cache_file_name(file_name: &str) -> String {
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
) -> Result<String, String> {
    let start = Instant::now();
    let mut last = Instant::now() - Duration::from_secs(1);
    let mut downloaded = 0u64;
    let mut prefix = Vec::new();
    let mut digest = Sha256::new();
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
    output.flush().map_err(|_| "无法保存市场 APK")?;
    let sha256 = format!("{:x}", digest.finalize());
    if item
        .content_sha256
        .as_ref()
        .is_some_and(|expected| expected != &sha256)
    {
        return Err("市场 APK 校验失败，请刷新市场后重试".into());
    }
    Ok(sha256)
}
fn download_apk_with(
    output: impl Write,
    item: &Item,
    cancel: &AtomicBool,
    report: impl FnMut(Progress) -> Result<(), String>,
    mut fetch: impl FnMut(&str, &FileMetadata) -> Result<Response, String>,
) -> Result<String, String> {
    check_cancel(cancel)?;
    let response = require_ok(fetch(
        &app_store::file_url(&item.id)?,
        &item.download_metadata,
    )?)?;
    app_store::check_response_metadata(response.headers(), &item.download_metadata)?;
    copy_apk(response, output, item, cancel, report)
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
    let root = directory.join("market/apks-http-v1").join(&item.blob_sha);
    fs::create_dir_all(&root).map_err(|_| "无法创建市场下载目录")?;
    let target = root.join(cache_file_name(&item.file_name));
    report(Progress {
        stage: "verifying".into(),
        downloaded: 0,
        total: item.bytes,
        item_id: Some(item.id.clone()),
    })?;
    if !verified_file(&target, &item, cancel)? {
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
        let sha256 =
            download_apk_with(&mut output, &item, cancel, &mut report, |url, metadata| {
                response(&client, Method::GET, url, Some(metadata), cancel)
            })?;
        output.sync_all().map_err(|_| "无法保存市场 APK")?;
        drop(output);
        check_cancel(cancel)?;
        // A complete verified replacement is ready before touching a corrupt cache.
        if target.exists() {
            fs::remove_file(&target).map_err(|_| "无法完成市场 APK 下载")?;
        }
        fs::rename(&temporary.0, &target).map_err(|_| "无法完成市场 APK 下载")?;
        write_json(
            &target.with_extension("receipt.json"),
            &Receipt {
                id: item.id.clone(),
                identity: item.blob_sha.clone(),
                bytes: item.bytes,
                sha256,
            },
        )?;
    }
    report(Progress {
        stage: "verifying".into(),
        downloaded: item.bytes,
        total: item.bytes,
        item_id: Some(item.id.clone()),
    })?;
    check_cancel(cancel)?;
    save_optional_logo(directory, &target, &item, cancel);
    Ok(Download {
        item,
        path: target.to_string_lossy().into_owned(),
        home_background: None,
        home_background_color: None,
    })
}
fn logo_matches(bytes: &[u8], item: &Item, cancel: &AtomicBool) -> bool {
    !cancel.load(Ordering::Acquire)
        && item.logo_bytes == Some(bytes.len() as u64)
        && crate::app_logos::valid_svg(bytes).is_some()
        && item.logo_blob_sha.as_deref() == Some(format!("{:x}", Sha256::digest(bytes)).as_str())
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
        if let Ok(bytes) = fs::read(&target) {
            if logo_matches(&bytes, item, cancel) {
                return Ok(String::from_utf8(bytes).ok());
            }
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
        fetch_bytes(&client, address, cancel, crate::app_logos::MAX_LOGO as u64)
    });
    if let Ok(Some(svg)) = result {
        let _ = crate::app_logos::save(directory, apk, &svg);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::io::Cursor;
    const APK: &[u8] = b"PK\x03\x04test APK content";
    const SVG: &[u8] = br##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#fff" d="M0 0h64v64H0z"/></svg>"##;
    struct TestDirectory(PathBuf);
    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn temp() -> TestDirectory {
        let path = std::env::temp_dir().join(format!(
            "puretv-http-market-{}-{}",
            std::process::id(),
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(&path).unwrap();
        TestDirectory(path)
    }
    fn cancel() -> AtomicBool {
        AtomicBool::new(false)
    }
    fn metadata(bytes: &[u8]) -> FileMetadata {
        FileMetadata {
            bytes: bytes.len() as u64,
            etag: Some(format!("\"{:x}\"", Sha256::digest(bytes))),
            last_modified: Some("Sun, 15 Nov 2026 09:30:00 GMT".into()),
        }
    }
    fn build(paths: &[&str]) -> Catalog {
        build_catalog(
            paths.iter().map(|p| p.to_string()).collect(),
            &cancel(),
            |_| Ok(metadata(APK)),
            |_, _| Err("offline optional data".into()),
        )
        .unwrap()
    }
    fn item() -> Item {
        build(&["media/example/Example-1.2.3.apk"]).items.remove(0)
    }
    #[test]
    fn discovers_three_categories_multiple_versions_and_named_covers() {
        let result = build(&[
            "launcher/home/Home-1.0.apk",
            "game/中国游戏/中国游戏-2.0.apk",
            "media/music/Music-1.0.apk",
            "media/music/Music-2.0.APK",
            "media/music/Music-1.0.thumb.png",
            "media/music/thumb.png",
            "client/not-an-app.exe",
        ]);
        assert_eq!(result.items.len(), 4);
        assert!(validate_catalog(&result));
        let game = result
            .items
            .iter()
            .find(|i| i.id.starts_with("game/"))
            .unwrap();
        assert_eq!(game.kind, "app");
        assert_eq!(game.name, "中国游戏");
        assert!(game.folder_url.starts_with("https://apps.b14f.com/game/"));
        let launcher = result
            .items
            .iter()
            .find(|i| i.id.starts_with("launcher/"))
            .unwrap();
        assert_eq!(launcher.kind, "launcher");
        let music = result
            .items
            .iter()
            .find(|i| i.version.as_deref() == Some("1.0") && i.name == "Music")
            .unwrap();
        assert!(music
            .cover_url
            .as_ref()
            .unwrap()
            .ends_with("Music-1.0.thumb.png"));
        assert_ne!(
            music.blob_sha,
            format!("{:x}", Sha256::digest(APK)),
            "HTTP identity is not falsely presented as APK content hash"
        );
    }
    #[test]
    fn bounded_provider_and_logo_metadata_is_read_once_per_exact_folder() {
        let paths = [
            "media/music/Music-1.0.apk",
            "media/music/Music-2.0.apk",
            "media/music/manifest.json",
            "media/music/logo.svg",
            "game/other/Other.apk",
            "media/manifest.json",
        ];
        let mut requests = Vec::new();
        let result = build_catalog(
            paths.iter().map(|s| s.to_string()).collect(),
            &cancel(),
            |_| Ok(metadata(APK)),
            |url, maximum| {
                requests.push(url.to_string());
                if url.ends_with("/music/manifest.json") {
                    assert_eq!(maximum, MAX_MANIFEST);
                    Ok("{\"provider\":\"  桔子桑  \"}".as_bytes().to_vec())
                } else if url.ends_with("/music/logo.svg") {
                    assert_eq!(maximum, crate::app_logos::MAX_LOGO as u64);
                    Ok(SVG.to_vec())
                } else {
                    panic!("Unexpected optional URL {url}")
                }
            },
        )
        .unwrap();
        assert_eq!(requests.len(), 2);
        for selected in result
            .items
            .iter()
            .filter(|i| i.id.starts_with("media/music/"))
        {
            assert_eq!(selected.provider.as_deref(), Some("桔子桑"));
            assert_eq!(
                selected.logo_blob_sha.as_deref(),
                Some(format!("{:x}", Sha256::digest(SVG)).as_str())
            );
            assert_eq!(selected.logo_bytes, Some(SVG.len() as u64));
        }
        assert_eq!(
            result
                .items
                .iter()
                .find(|i| i.id.starts_with("game/"))
                .unwrap()
                .provider,
            None
        );
        assert!(validate_catalog(&result));
        for value in [
            json!({"provider":""}),
            json!({"provider":123}),
            json!({"provider":"bad\nprovider"}),
            json!({"provider":"a".repeat(MAX_PROVIDER_BYTES+1)}),
        ] {
            assert!(provider_from_manifest(&serde_json::to_vec(&value).unwrap()).is_none());
        }
        assert_eq!(
            provider_from_manifest(br#"{"provider":"Other & <name>"}"#).as_deref(),
            Some("Other & <name>")
        );
        assert!(provider_from_manifest(&vec![b'a'; MAX_MANIFEST as usize + 1]).is_none());
    }
    #[test]
    fn optional_provider_logo_and_checksum_availability_do_not_change_apk_revision() {
        let paths = vec![
            "media/test/Test-1.0.apk".into(),
            "media/test/manifest.json".into(),
            "media/test/logo.svg".into(),
        ];
        let absent = build_catalog(
            paths.clone(),
            &cancel(),
            |_| Ok(metadata(APK)),
            |_, _| Err("optional unavailable".into()),
        )
        .unwrap();
        let manifest = serde_json::to_vec(&json!({"provider":"Name", "packages":[{"file":"Test-1.0.apk", "bytes":APK.len(), "sha256":format!("{:x}", Sha256::digest(APK))}]})).unwrap();
        let present = build_catalog(
            paths,
            &cancel(),
            |_| Ok(metadata(APK)),
            |url, _| {
                Ok(if url.ends_with("logo.svg") {
                    SVG.to_vec()
                } else {
                    manifest.clone()
                })
            },
        )
        .unwrap();
        assert_eq!(absent.revision, present.revision);
        assert!(present.items[0].provider.is_some());
        assert!(present.items[0].logo_url.is_some());
        assert!(present.items[0].content_sha256.is_some());
        let mut changed = present.items.clone();
        changed[0].download_metadata.etag = Some("\"new\"".into());
        changed[0].blob_sha = app_store::fingerprint(&changed[0].id, &changed[0].download_metadata);
        assert_ne!(catalog_revision(&changed).unwrap(), present.revision);
    }
    #[test]
    fn manifest_checksum_matches_exact_file_and_bytes_and_is_verified_for_download_and_cache() {
        let mut selected = item();
        let digest = format!("{:x}", Sha256::digest(APK));
        let manifest = json!({"packages":[
            {"file":"Other.apk", "bytes":APK.len(), "sha256":"0".repeat(64)},
            {"file":selected.file_name, "bytes":APK.len()+1, "sha256":"1".repeat(64)},
            {"file":selected.file_name, "bytes":APK.len(), "sha256":digest.to_uppercase()}
        ]});
        selected.content_sha256 = checksum_from_manifest(
            &serde_json::to_vec(&manifest).unwrap(),
            &selected.file_name,
            selected.bytes,
        );
        assert_eq!(selected.content_sha256.as_deref(), Some(digest.as_str()));
        assert!(copy_apk(APK, Vec::new(), &selected, &cancel(), |_| Ok(())).is_ok());
        let root = temp();
        let path = cache_fixture(&root.0, &selected, APK);
        assert!(verified_file(&path, &selected, &cancel()).unwrap());
        selected.content_sha256 = Some("f".repeat(64));
        assert!(copy_apk(APK, Vec::new(), &selected, &cancel(), |_| Ok(()))
            .unwrap_err()
            .contains("校验失败"));
        assert!(!verified_file(&path, &selected, &cancel()).unwrap());
        assert!(
            checksum_from_manifest(br#"{"packages":[]}"#, &selected.file_name, selected.bytes)
                .is_none()
        );
    }
    #[test]
    fn rejects_bad_paths_duplicate_entries_invalid_sizes_and_missing_validators() {
        for paths in [
            vec!["media/a.apk", "media/a.apk"],
            vec!["media/../a.apk"],
            vec!["media/a\\b.apk"],
            vec!["media//a.apk"],
        ] {
            assert!(build_catalog(
                paths.into_iter().map(str::to_string).collect(),
                &cancel(),
                |_| Ok(metadata(APK)),
                |_, _| Ok(vec![])
            )
            .is_err());
        }
        for bad in [
            FileMetadata {
                bytes: 0,
                ..metadata(APK)
            },
            FileMetadata {
                bytes: MAX_APK + 1,
                ..metadata(APK)
            },
            FileMetadata {
                bytes: 10,
                etag: None,
                last_modified: None,
            },
        ] {
            assert!(build_catalog(
                vec!["media/a.apk".into()],
                &cancel(),
                |_| Ok(bad.clone()),
                |_, _| Ok(vec![])
            )
            .is_err());
        }
        assert_eq!(apk_kind("apps/game/old.apk"), None);
        assert_eq!(apk_kind("client/a.apk"), None);
    }
    #[test]
    fn cached_catalog_rejects_changed_urls_source_and_metadata() {
        let original = build(&["game/a/A-1.0.apk", "game/a/thumb.png"]);
        for mutate in [0, 1, 2, 3, 4] {
            let mut value = original.clone();
            match mutate {
                0 => value.source_url = "https://gitee.com/juzisang331/pure-tv-store".into(),
                1 => value.items[0].folder_url = "https://evil.invalid/".into(),
                2 => value.items[0].cover_url = Some("https://apps.b14f.com/client/a.png".into()),
                3 => value.items[0].download_metadata.etag = Some("\"different\"".into()),
                _ => value.items[0].provider = Some("bad\nname".into()),
            }
            value.revision = catalog_revision(&value.items).unwrap();
            assert!(!validate_catalog(&value), "mutation {mutate}");
        }
    }
    #[test]
    fn new_cache_is_fresh_or_explicitly_stale_and_never_uses_legacy_gitee_data() {
        let root = temp();
        let cached = build(&["media/a.apk"]);
        write_cache(&root.0, &cached).unwrap();
        let result = catalog_with(
            &root.0,
            false,
            &cancel(),
            |_| Ok(()),
            || panic!("fresh cache requested network"),
            |_| unreachable!(),
            |_, _| unreachable!(),
        )
        .unwrap();
        assert_eq!(result.revision, cached.revision);
        assert!(!result.stale);
        let failed = catalog_with(
            &root.0,
            true,
            &cancel(),
            |_| Ok(()),
            || Err("network offline".into()),
            |_| unreachable!(),
            |_, _| unreachable!(),
        )
        .unwrap();
        assert!(failed.stale);
        assert!(failed.warning.unwrap().contains("network offline"));
        fs::rename(
            root.0.join("market").join(CACHE_NAME),
            root.0.join("market/catalog-v3.json"),
        )
        .unwrap();
        assert!(catalog_with(
            &root.0,
            false,
            &cancel(),
            |_| Ok(()),
            || Err("network offline".into()),
            |_| unreachable!(),
            |_, _| unreachable!()
        )
        .is_err());
    }
    #[test]
    fn cancellation_during_optional_fetch_preserves_cache_and_does_not_return_stale_success() {
        let root = temp();
        let cached = build(&["media/a.apk"]);
        write_cache(&root.0, &cached).unwrap();
        let cancelled = cancel();
        let result = catalog_with(
            &root.0,
            true,
            &cancelled,
            |_| Ok(()),
            || {
                Ok(vec![
                    "media/new/a.apk".into(),
                    "media/new/manifest.json".into(),
                ])
            },
            |_| Ok(metadata(APK)),
            |_, _| {
                cancelled.store(true, Ordering::Release);
                Err("interrupted".into())
            },
        );
        assert!(result.unwrap_err().contains("取消"));
        assert_eq!(read_cache(&root.0).unwrap().revision, cached.revision);
        assert!(catalog_with(
            &root.0,
            false,
            &cancelled,
            |_| Ok(()),
            || unreachable!(),
            |_| unreachable!(),
            |_, _| unreachable!()
        )
        .is_err());
    }
    #[test]
    fn displayed_revision_is_required_and_invalid_ids_fail_before_network() {
        let root = temp();
        let cached = build(&["media/a.apk"]);
        write_cache(&root.0, &cached).unwrap();
        assert!(download(
            &root.0,
            "media/a.apk",
            Some(&"a".repeat(64)),
            &cancel(),
            |_| Ok(())
        )
        .unwrap_err()
        .contains("目录已更新"));
        for id in [
            "../a.apk",
            "apps/old/a.apk",
            "client/a.apk",
            "media//a.apk",
            "media/a.exe",
        ] {
            assert!(download(&root.0, id, None, &cancel(), |_| Ok(()))
                .unwrap_err()
                .contains("标识无效"));
        }
        assert!(
            download(&root.0, "media/a.apk", Some("bad"), &cancel(), |_| Ok(()))
                .unwrap_err()
                .contains("版本无效")
        );
    }
    #[test]
    fn copy_checks_size_and_apk_prefix_and_calculates_local_sha256() {
        let selected = item();
        let mut output = Vec::new();
        let sha = copy_apk(Cursor::new(APK), &mut output, &selected, &cancel(), |_| {
            Ok(())
        })
        .unwrap();
        assert_eq!(output, APK);
        assert_eq!(sha, format!("{:x}", Sha256::digest(APK)));
        for bytes in [
            &APK[..APK.len() - 1],
            b"PK\x03\x04test APK content extra",
            b"<html>Server error</html>",
        ] {
            assert!(copy_apk(bytes, Vec::new(), &selected, &cancel(), |_| Ok(())).is_err());
        }
    }
    fn mock_response(status: u16, body: Vec<u8>, etag: Option<&str>) -> Response {
        let server = tiny_http::Server::http("127.0.0.1:0").unwrap();
        let url = format!("http://{}", server.server_addr());
        let etag = etag.map(str::to_string);
        std::thread::spawn(move || {
            let request = server.recv().unwrap();
            let mut response = tiny_http::Response::from_data(body).with_status_code(status);
            if let Some(etag) = etag {
                response =
                    response.with_header(tiny_http::Header::from_bytes("ETag", etag).unwrap());
            }
            response = response.with_header(
                tiny_http::Header::from_bytes("Last-Modified", "Sun, 15 Nov 2026 09:30:00 GMT")
                    .unwrap(),
            );
            let _ = request.respond(response);
        });
        Client::builder()
            .no_proxy()
            .build()
            .unwrap()
            .get(url)
            .send()
            .unwrap()
    }
    #[test]
    fn direct_download_checks_selected_http_metadata_and_never_uses_a_gitee_fallback() {
        let selected = item();
        let mut calls = 0;
        let mut output = Vec::new();
        let sha = download_apk_with(
            &mut output,
            &selected,
            &cancel(),
            |_| Ok(()),
            |url, meta| {
                calls += 1;
                assert_eq!(url, "https://apps.b14f.com/media/example/Example-1.2.3.apk");
                assert_eq!(meta, &selected.download_metadata);
                Ok(mock_response(200, APK.to_vec(), meta.etag.as_deref()))
            },
        )
        .unwrap();
        assert_eq!(calls, 1);
        assert_eq!(output, APK);
        assert_eq!(sha, format!("{:x}", Sha256::digest(APK)));
        for status in [403, 404, 412, 500] {
            let mut calls = 0;
            let result = download_apk_with(
                Vec::new(),
                &selected,
                &cancel(),
                |_| Ok(()),
                |_, _| {
                    calls += 1;
                    Ok(mock_response(
                        status,
                        APK.to_vec(),
                        selected.download_metadata.etag.as_deref(),
                    ))
                },
            );
            assert!(result.is_err());
            assert_eq!(calls, 1);
        }
        for etag in [None, Some("\"changed\"")] {
            assert!(download_apk_with(
                Vec::new(),
                &selected,
                &cancel(),
                |_| Ok(()),
                |_, _| Ok(mock_response(200, APK.to_vec(), etag))
            )
            .is_err());
        }
    }
    #[test]
    fn direct_http_download_streams_an_apk_larger_than_32_mib() {
        let mut bytes = vec![b'a'; 33 * 1024 * 1024];
        bytes[..4].copy_from_slice(b"PK\x03\x04");
        let selected = build_catalog(
            vec!["media/large/Large-1.0.apk".into()],
            &cancel(),
            |_| Ok(metadata(&bytes)),
            |_, _| unreachable!(),
        )
        .unwrap()
        .items
        .remove(0);
        let expected = format!("{:x}", Sha256::digest(&bytes));
        let mut body = Some(bytes);
        let mut stages = Vec::new();
        let sha = download_apk_with(
            std::io::sink(),
            &selected,
            &cancel(),
            |p| {
                stages.push(p);
                Ok(())
            },
            |_, m| Ok(mock_response(200, body.take().unwrap(), m.etag.as_deref())),
        )
        .unwrap();
        assert_eq!(sha, expected);
        let last = stages.last().unwrap();
        assert_eq!(last.downloaded, selected.bytes);
        assert_eq!(last.stage, "verifying");
    }
    fn cache_fixture(root: &Path, selected: &Item, bytes: &[u8]) -> PathBuf {
        let path = root.join(cache_file_name(&selected.file_name));
        fs::write(&path, bytes).unwrap();
        write_json(
            &path.with_extension("receipt.json"),
            &Receipt {
                id: selected.id.clone(),
                identity: selected.blob_sha.clone(),
                bytes: selected.bytes,
                sha256: format!("{:x}", Sha256::digest(bytes)),
            },
        )
        .unwrap();
        path
    }
    #[test]
    fn cached_apk_is_rehashed_and_requires_the_matching_receipt() {
        let root = temp();
        let selected = item();
        let path = cache_fixture(&root.0, &selected, APK);
        assert!(verified_file(&path, &selected, &cancel()).unwrap());
        let mut corrupt = APK.to_vec();
        corrupt[5] ^= 1;
        fs::write(&path, &corrupt).unwrap();
        assert!(!verified_file(&path, &selected, &cancel()).unwrap());
        fs::write(&path, APK).unwrap();
        let mut changed = selected.clone();
        changed.blob_sha = "a".repeat(64);
        assert!(!verified_file(&path, &changed, &cancel()).unwrap());
        fs::remove_file(path.with_extension("receipt.json")).unwrap();
        assert!(!verified_file(&path, &selected, &cancel()).unwrap());
    }
    #[test]
    fn cancellation_and_progress_errors_remove_partial_files() {
        for should_cancel in [true, false] {
            let root = temp();
            let selected = item();
            let cancellation = cancel();
            let partial = temporary_path(&root.0, "part");
            {
                let guard = Temporary(partial.clone());
                let mut file = File::create(&guard.0).unwrap();
                let result = copy_apk(APK, &mut file, &selected, &cancellation, |_| {
                    if should_cancel {
                        cancellation.store(true, Ordering::Release);
                        Ok(())
                    } else {
                        Err("progress disconnected".into())
                    }
                });
                assert!(result.is_err());
                drop(file);
            }
            assert!(!partial.exists());
        }
    }
    #[test]
    fn optional_svg_cache_uses_catalog_content_digest_and_rejects_changed_artwork() {
        let root = temp();
        let mut selected = item();
        selected.logo_url = Some("https://apps.b14f.com/media/example/logo.svg".into());
        selected.logo_blob_sha = Some(format!("{:x}", Sha256::digest(SVG)));
        selected.logo_bytes = Some(SVG.len() as u64);
        let actual = cache_logo_with(&root.0, &selected, &cancel(), |_| Ok(SVG.to_vec()))
            .unwrap()
            .unwrap();
        assert!(actual.starts_with("<svg"));
        assert!(cache_logo_with(&root.0, &selected, &cancel(), |_| panic!(
            "valid cache must be reused"
        ))
        .unwrap()
        .is_some());
        fs::write(root.0.join("logo.svg"), b"broken").unwrap();
        assert!(cache_logo_with(&root.0, &selected, &cancel(), |_| Ok(
            b"<svg>broken</svg>".to_vec()
        ))
        .is_err());
        assert!(
            cache_logo_with(&root.0, &selected, &cancel(), |_| Ok(SVG.to_vec()))
                .unwrap()
                .is_some()
        );
        let mut changed = selected.clone();
        changed.logo_blob_sha = Some("a".repeat(64));
        assert!(cache_logo_with(&root.0, &changed, &cancel(), |_| Ok(SVG.to_vec())).is_err());
    }
    #[test]
    fn filenames_remain_safe_and_recognizable_across_platforms() {
        for name in [
            "CON.apk",
            "COM1.apk",
            "LPT9.apk",
            "A:B?.apk",
            " .apk",
            "你好.apk",
            "NUL.test.apk",
        ] {
            let result = cache_file_name(name);
            assert!(result.ends_with(".apk"));
            assert!(!result.contains(['/', '\\', ':', '?']));
            assert!(!["CON.apk", "COM1.apk", "LPT9.apk", "NUL.test.apk"].contains(&result.as_str()));
        }
        assert_eq!(cache_file_name("你好.apk"), "你好.apk");
        assert!(cache_file_name(&format!("{}.apk", "中".repeat(100))).len() <= 164);
    }
    #[test]
    #[ignore = "downloads the live HTTPS catalog and representative APKs and verifies cache reuse"]
    fn live_store_catalog_and_download() {
        let root = temp();
        let cancellation = cancel();
        let result = catalog(&root.0, true, &cancellation, |_| Ok(())).unwrap();
        assert!(validate_catalog(&result));
        assert!(!result.stale);
        assert!(!result.items.is_empty());
        if let Ok(path) = std::env::var("PURETV_MARKET_CATALOG_OUTPUT") {
            fs::write(path, serde_json::to_vec_pretty(&result).unwrap()).unwrap();
        }
        let mut samples: Vec<_> = ["app", "launcher"]
            .iter()
            .filter_map(|kind| {
                result
                    .items
                    .iter()
                    .filter(|i| i.kind == *kind)
                    .min_by_key(|i| i.bytes)
            })
            .collect();
        samples.extend(
            result
                .items
                .iter()
                .filter(|i| i.bytes > 32 * 1024 * 1024)
                .max_by_key(|i| i.bytes),
        );
        samples.sort_by_key(|i| &i.id);
        samples.dedup_by_key(|i| &i.id);
        for selected in samples {
            let downloaded = download(
                &root.0,
                &selected.id,
                Some(&result.revision),
                &cancellation,
                |_| Ok(()),
            )
            .unwrap();
            assert_eq!(&downloaded.item, selected);
            assert!(verified_file(Path::new(&downloaded.path), selected, &cancellation).unwrap());
            let mut archive = zip::ZipArchive::new(File::open(&downloaded.path).unwrap()).unwrap();
            assert!(archive.by_name("AndroidManifest.xml").unwrap().size() > 0);
            drop(archive);
            let reused = download(
                &root.0,
                &selected.id,
                Some(&result.revision),
                &cancellation,
                |p| {
                    assert_ne!(p.stage, "downloading");
                    Ok(())
                },
            )
            .unwrap();
            assert_eq!(reused.path, downloaded.path);
            eprintln!("HTTPS direct APK {}: {} bytes; HTTP metadata matched; local SHA256 receipt and cache reuse verified", selected.id, selected.bytes);
        }
    }
}
