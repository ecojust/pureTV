//! Read-only package reference lookup. Community descriptions are data, never
//! device policy: the ADB core remains responsible for every protected operation.
use reqwest::{blocking::Client, header, redirect, Url};
use serde::{Deserialize, Serialize};
use std::{
    collections::BTreeMap,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::Mutex,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const DATA_URL: &str = "https://raw.githubusercontent.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/main/resources/assets/uad_lists.json";
const SOURCE_URL: &str = "https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/blob/main/resources/assets/uad_lists.json";
const LICENSE_URL: &str = "https://github.com/Universal-Debloater-Alliance/universal-android-debloater-next-generation/blob/main/LICENSE";
const MAX_BYTES: usize = 8 * 1024 * 1024;
const MAX_PACKAGES: usize = 50_000;
const CACHE_AGE_MS: u64 = 24 * 60 * 60 * 1000;
const NETWORK_TIMEOUT: Duration = Duration::from_secs(10);
const TOTAL_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Clone, Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Insight {
    pub package_name: String,
    pub found: bool,
    pub description: Option<String>,
    pub removal: Option<String>,
    pub risk: &'static str,
    pub list: Option<String>,
    pub source_name: &'static str,
    pub source_url: &'static str,
    pub license_url: &'static str,
    pub fetched_at: u64,
    pub stale: bool,
    pub warning: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
struct Entry {
    description: String,
    removal: String,
    list: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Catalog {
    version: u8,
    fetched_at: u64,
    packages: BTreeMap<String, Entry>,
}

#[derive(Default)]
struct Cache {
    loaded: bool,
    catalog: Option<Catalog>,
    // Concurrent callers share even a failed refresh instead of serially
    // repeating the same request. This mutex never owns the ADB manager lock.
    last_attempt: Option<(Instant, Result<Option<String>, String>)>,
}

pub struct State {
    directory: PathBuf,
    cache: Mutex<Cache>,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .try_into()
        .unwrap_or(u64::MAX)
}

// Match the ADB core's package grammar, including Android's "android" package
// and valid single-segment OEM package names. These values never reach a shell.
fn valid_package(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 255
        && value.split('.').all(|part| {
            !part.is_empty()
                && part.as_bytes()[0].is_ascii_alphabetic()
                && part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_')
        })
}

fn validate_package(value: &str) -> Result<(), String> {
    if valid_package(value) {
        Ok(())
    } else {
        Err("应用包名无效".into())
    }
}

fn validate_entries(entries: &BTreeMap<String, Entry>) -> Result<(), String> {
    if entries.is_empty()
        || entries.len() > MAX_PACKAGES
        || entries.iter().any(|(name, entry)| {
            !valid_package(name)
                || entry.description.len() > 16_384
                || entry.removal.len() > 64
                || entry.list.len() > 64
        })
    {
        return Err("包名资料格式无效，请稍后重试".into());
    }
    Ok(())
}

fn parse_list(bytes: &[u8], fetched_at: u64) -> Result<Catalog, String> {
    if bytes.len() > MAX_BYTES {
        return Err("包名资料文件过大".into());
    }
    let packages =
        serde_json::from_slice(bytes).map_err(|_| "包名资料格式无效，请稍后重试".to_string())?;
    validate_entries(&packages)?;
    Ok(Catalog {
        version: 1,
        fetched_at,
        packages,
    })
}

fn risk(removal: &str) -> &'static str {
    // UAD-ng's "Recommended" is a removal category, not a recommendation to
    // uninstall on every device. The UI preserves this category and its source.
    match removal {
        "Recommended" => "low",
        "Advanced" => "medium",
        "Expert" => "high",
        "Unsafe" => "critical",
        _ => "unknown",
    }
}

fn result(catalog: &Catalog, package: &str, stale: bool, warning: Option<String>) -> Insight {
    let entry = catalog.packages.get(package);
    Insight {
        package_name: package.into(),
        found: entry.is_some(),
        description: entry
            .map(|entry| entry.description.trim())
            .filter(|text| !text.is_empty())
            .map(str::to_owned),
        removal: entry.map(|entry| entry.removal.clone()),
        risk: entry.map_or("unknown", |entry| risk(&entry.removal)),
        list: entry.map(|entry| entry.list.clone()),
        source_name: "Universal Android Debloater Next Generation (UAD-ng)",
        source_url: SOURCE_URL,
        license_url: LICENSE_URL,
        fetched_at: catalog.fetched_at,
        stale,
        warning,
    }
}

fn read_cache(directory: &Path) -> Option<Catalog> {
    let path = directory.join("catalog-v1.json");
    let metadata = fs::symlink_metadata(&path).ok()?;
    if !metadata.is_file() || metadata.len() > MAX_BYTES as u64 {
        return None;
    }
    let mut bytes = Vec::new();
    File::open(path)
        .ok()?
        .take(MAX_BYTES as u64 + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() > MAX_BYTES {
        return None;
    }
    let catalog: Catalog = serde_json::from_slice(&bytes).ok()?;
    if catalog.version != 1 || catalog.fetched_at == 0 {
        return None;
    }
    validate_entries(&catalog.packages).ok()?;
    Some(catalog)
}

fn write_cache(directory: &Path, catalog: &Catalog) -> Result<(), String> {
    let write = || -> Result<(), Box<dyn std::error::Error>> {
        fs::create_dir_all(directory)?;
        let nonce = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let temporary = directory.join(format!("catalog-{}-{nonce}.part", std::process::id()));
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)?;
        let saved = (|| -> Result<(), Box<dyn std::error::Error>> {
            file.write_all(&serde_json::to_vec(catalog)?)?;
            file.sync_all()?;
            drop(file);
            fs::rename(&temporary, directory.join("catalog-v1.json"))?;
            Ok(())
        })();
        if saved.is_err() {
            let _ = fs::remove_file(temporary);
        }
        saved
    };
    write().map_err(|_| "包名资料已更新，但无法保存本地缓存。".into())
}

fn download() -> Result<Vec<u8>, String> {
    let client = Client::builder()
        .https_only(true)
        .redirect(redirect::Policy::none())
        .connect_timeout(NETWORK_TIMEOUT)
        .timeout(NETWORK_TIMEOUT)
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "无法准备包名资料 HTTPS 连接".to_string())?;
    let started = Instant::now();
    let mut response = client
        .get(DATA_URL)
        .header(header::ACCEPT_ENCODING, "identity")
        .send()
        .map_err(|_| "无法连接包名资料源，请检查网络后重试".to_string())?;
    if response.status() != reqwest::StatusCode::OK {
        return Err(format!(
            "包名资料服务器返回 HTTP {}，请稍后重试",
            response.status().as_u16()
        ));
    }
    if response
        .content_length()
        .is_some_and(|size| size > MAX_BYTES as u64)
    {
        return Err("包名资料文件过大".into());
    }
    let mut bytes = Vec::new();
    let mut buffer = [0u8; 16_384];
    loop {
        if started.elapsed() > TOTAL_TIMEOUT {
            return Err("包名资料下载超时，请稍后重试".into());
        }
        let count = response
            .read(&mut buffer)
            .map_err(|_| "包名资料下载中断，请检查网络后重试".to_string())?;
        if started.elapsed() > TOTAL_TIMEOUT {
            return Err("包名资料下载超时，请稍后重试".into());
        }
        if count == 0 {
            return Ok(bytes);
        }
        if bytes.len() + count > MAX_BYTES {
            return Err("包名资料文件过大".into());
        }
        bytes.extend_from_slice(&buffer[..count]);
    }
}

impl State {
    pub fn new(data_directory: PathBuf) -> Self {
        Self {
            directory: data_directory.join("package-insights"),
            cache: Mutex::new(Cache::default()),
        }
    }

    pub fn lookup(&self, package: &str, refresh: bool) -> Result<Insight, String> {
        self.lookup_with(package, refresh, download)
    }

    fn lookup_with(
        &self,
        package: &str,
        refresh: bool,
        fetch: impl FnOnce() -> Result<Vec<u8>, String>,
    ) -> Result<Insight, String> {
        validate_package(package)?;
        let requested_at = Instant::now();
        let mut cache = self.cache.lock().map_err(|_| "包名资料缓存不可用")?;
        if !cache.loaded {
            cache.catalog = read_cache(&self.directory);
            cache.loaded = true;
        }
        let now = now_ms();
        if !refresh {
            if let Some(catalog) = &cache.catalog {
                if now >= catalog.fetched_at && now - catalog.fetched_at < CACHE_AGE_MS {
                    return Ok(result(catalog, package, false, None));
                }
            }
        }
        let shared = cache
            .last_attempt
            .as_ref()
            .filter(|(completed, _)| *completed >= requested_at)
            .map(|(_, outcome)| outcome.clone());
        let outcome = shared.unwrap_or_else(|| {
            let outcome = fetch()
                .and_then(|bytes| parse_list(&bytes, now_ms()))
                .map(|catalog| {
                    let warning = write_cache(&self.directory, &catalog).err();
                    cache.catalog = Some(catalog);
                    warning
                });
            cache.last_attempt = Some((Instant::now(), outcome.clone()));
            outcome
        });
        match outcome {
            Ok(warning) => cache
                .catalog
                .as_ref()
                .map(|catalog| result(catalog, package, false, warning))
                .ok_or_else(|| "包名资料不可用，请重试".into()),
            Err(error) => match &cache.catalog {
                Some(catalog) => Ok(result(
                    catalog,
                    package,
                    true,
                    Some(format!("包名资料更新失败，正在显示上次缓存。{error}")),
                )),
                None => Err(error),
            },
        }
    }
}

pub fn resource_url(package: &str, resource: &str) -> Result<String, String> {
    validate_package(package)?;
    match resource {
        "source" => Ok(SOURCE_URL.into()),
        "search" => {
            let mut url =
                Url::parse("https://www.bing.com/search").map_err(|_| "无法生成包名搜索地址")?;
            url.query_pairs_mut()
                .append_pair("q", &format!("\"{package}\" Android package uninstall"));
            Ok(url.into())
        }
        _ => Err("不支持的包名资料入口".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{
        atomic::{AtomicUsize, Ordering},
        Arc, Barrier,
    };

    // Hand-written fixtures; no upstream GPL descriptions are bundled.
    const FIXTURE: &[u8] = br#"{
      "android":{"description":"Platform fixture","removal":"Unsafe","list":"Aosp"},
      "com.example.video":{"description":"<b>Video fixture</b>","removal":"Recommended","list":"Misc","suggestions":[]},
      "com.example.advanced":{"description":"Optional integration","removal":"Advanced","list":"Oem"},
      "com.example.expert":{"description":"Important feature","removal":"Expert","list":"Google"},
      "androidhwext":{"description":"","removal":"FutureCategory","list":"Oem"}
    }"#;

    struct Temporary(PathBuf);
    impl Temporary {
        fn new() -> Self {
            Self(std::env::temp_dir().join(format!(
                    "puretv-insight-{}-{}",
                    std::process::id(),
                    SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_nanos()
                )))
        }
    }
    impl Drop for Temporary {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn exact_package_lookup_preserves_plain_text_and_category() {
        let catalog = parse_list(FIXTURE, 1234).unwrap();
        let value = result(&catalog, "com.example.video", false, None);
        assert_eq!(value.risk, "low");
        assert_eq!(value.removal.as_deref(), Some("Recommended"));
        assert_eq!(value.description.as_deref(), Some("<b>Video fixture</b>"));
        for name in [
            "com.example",
            "com.example.video.extra",
            "COM.example.video",
            "com.unknown",
        ] {
            let absent = result(&catalog, name, false, None);
            assert!(!absent.found);
            assert_eq!(absent.risk, "unknown");
            assert!(absent.description.is_none());
        }
    }

    #[test]
    fn all_risk_categories_and_unknown_values_are_explicit() {
        let catalog = parse_list(FIXTURE, 1).unwrap();
        for (package, expected) in [
            ("android", "critical"),
            ("com.example.video", "low"),
            ("com.example.advanced", "medium"),
            ("com.example.expert", "high"),
            ("androidhwext", "unknown"),
        ] {
            assert_eq!(result(&catalog, package, false, None).risk, expected);
        }
        let empty = result(&catalog, "androidhwext", false, None);
        assert!(empty.found);
        assert!(empty.description.is_none());
        for category in ["", "All", "Unlisted", "recommended"] {
            assert_eq!(risk(category), "unknown");
        }
    }

    #[test]
    fn package_validation_and_external_links_reject_injection() {
        for package in ["android", "androidzte", "com.example_app.tv"] {
            assert!(valid_package(package));
            let url = Url::parse(&resource_url(package, "search").unwrap()).unwrap();
            assert_eq!(url.host_str(), Some("www.bing.com"));
            assert_eq!(
                url.query_pairs().next().unwrap().1,
                format!("\"{package}\" Android package uninstall")
            );
            assert_eq!(resource_url(package, "source").unwrap(), SOURCE_URL);
        }
        for package in [
            "",
            "com..example",
            "com.example;rm",
            "com.example&x=1",
            "https://x.test",
            "com.example\n",
            "android/../x",
            ".android",
            "9android",
        ] {
            assert!(!valid_package(package));
            assert!(resource_url(package, "search").is_err());
        }
        assert!(!valid_package(&"a".repeat(256)));
        assert!(resource_url("android", "https://evil.test").is_err());
    }

    #[test]
    fn malformed_or_oversized_lists_never_become_unknown_results() {
        for bytes in [
            b"{}".as_slice(),
            b"[]",
            b"not json",
            br#"{"com.example":{"description":true,"removal":"Unsafe","list":"Aosp"}}"#,
            br#"{"com.example":{"description":"missing fields"}}"#,
        ] {
            assert!(parse_list(bytes, 1).is_err());
        }
        assert!(parse_list(&vec![b' '; MAX_BYTES + 1], 1).is_err());
        let bad_name =
            br#"{"com.example;echo":{"description":"x","removal":"Unsafe","list":"Aosp"}}"#;
        assert!(parse_list(bad_name, 1).is_err());
    }

    #[test]
    fn fresh_disk_cache_is_reused_without_network_and_refresh_updates_it() {
        let temporary = Temporary::new();
        let state = State::new(temporary.0.clone());
        let first = state
            .lookup_with("com.example.video", false, || Ok(FIXTURE.into()))
            .unwrap();
        assert!(!first.stale);
        let reloaded = State::new(temporary.0.clone());
        assert_eq!(
            reloaded
                .lookup_with("com.example.video", false, || panic!(
                    "fresh cache used network"
                ))
                .unwrap(),
            first
        );
        let updated = reloaded
            .lookup_with("com.example.video", true, || {
                Ok(String::from_utf8(FIXTURE.to_vec())
                    .unwrap()
                    .replace("Recommended", "Unsafe")
                    .into_bytes())
            })
            .unwrap();
        assert_eq!(updated.risk, "critical");
        assert!(!updated.stale);
        assert_eq!(
            State::new(temporary.0.clone())
                .lookup_with("com.example.video", false, || panic!(
                    "updated cache used network"
                ))
                .unwrap()
                .risk,
            "critical"
        );
    }

    #[test]
    fn stale_and_failed_refreshes_keep_reference_with_explicit_warning() {
        let temporary = Temporary::new();
        let state = State::new(temporary.0.clone());
        write_cache(
            &state.directory,
            &parse_list(FIXTURE, now_ms() - CACHE_AGE_MS - 1).unwrap(),
        )
        .unwrap();
        let stale = state
            .lookup_with("android", false, || Err("offline fixture".into()))
            .unwrap();
        assert!(stale.stale);
        assert_eq!(stale.risk, "critical");
        assert!(stale.warning.unwrap().contains("offline fixture"));
        let unknown = state
            .lookup_with("com.missing", true, || Err("offline fixture".into()))
            .unwrap();
        assert!(unknown.stale);
        assert!(!unknown.found);
        assert_eq!(unknown.risk, "unknown");
    }

    #[test]
    fn initial_failure_or_corrupt_cache_is_not_a_not_found_response() {
        let temporary = Temporary::new();
        let state = State::new(temporary.0.clone());
        fs::create_dir_all(&state.directory).unwrap();
        fs::write(state.directory.join("catalog-v1.json"), b"broken cache").unwrap();
        assert_eq!(
            state
                .lookup_with("com.missing", false, || Err("offline fixture".into()))
                .unwrap_err(),
            "offline fixture"
        );
        assert!(state
            .lookup_with("com.missing", false, || Ok(b"{}".to_vec()))
            .is_err());
        assert!(state
            .lookup_with("com.missing", false, || Ok(FIXTURE.into()))
            .is_ok());
    }

    #[test]
    fn concurrent_refresh_requests_share_one_download() {
        let temporary = Temporary::new();
        let state = Arc::new(State::new(temporary.0.clone()));
        let barrier = Arc::new(Barrier::new(2));
        let requests = AtomicUsize::new(0);
        std::thread::scope(|scope| {
            for _ in 0..2 {
                let state = state.clone();
                let barrier = barrier.clone();
                let requests = &requests;
                scope.spawn(move || {
                    barrier.wait();
                    assert!(
                        state
                            .lookup_with("android", true, || {
                                requests.fetch_add(1, Ordering::SeqCst);
                                std::thread::sleep(Duration::from_millis(100));
                                Ok(FIXTURE.into())
                            })
                            .unwrap()
                            .found
                    );
                });
            }
        });
        assert_eq!(requests.load(Ordering::SeqCst), 1);
    }

    #[test]
    #[ignore = "downloads the public UAD-ng list; no list is bundled"]
    fn live_source_has_known_android_entry_and_exact_unknown_lookup() {
        let catalog = parse_list(&download().unwrap(), now_ms()).unwrap();
        let settings = result(&catalog, "com.android.tv.settings", false, None);
        assert!(settings.found);
        assert!(settings.description.is_some());
        assert!(
            !result(
                &catalog,
                "com.ecojust.nonexistent_reference_fixture",
                false,
                None
            )
            .found
        );
        println!(
            "Verified {} package entries from fixed UAD-ng HTTPS source",
            catalog.packages.len()
        );
    }
}
