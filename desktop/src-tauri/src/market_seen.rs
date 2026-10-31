//! Names and versions from the last APK market visit, independent of catalog caching.
//! Only the UI acknowledges a successfully displayed catalog. Background catalog or
//! MCP queries must never consume the user's new-content indicators.
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};

const MAX_ENTRIES: usize = 4096;
const MAX_JSON: u64 = 16 * 1024 * 1024;
const INVALID: &str = "APK 市场浏览记录格式无效。";
pub const READ_FAILED: &str = "无法读取本地 APK 市场浏览记录，本次无法比较更新。";
pub const SAVE_FAILED: &str = "无法保存 APK 市场浏览记录，请检查本地数据目录后重试。";
const DAMAGED: &str = "本地 APK 市场浏览记录已损坏，本次无法比较更新。";
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);
static STORE_LOCK: Mutex<()> = Mutex::new(());

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct Entry {
    /// The UI's existing resource-group key, including kind, folder and file stem.
    pub id: String,
    pub name: String,
    pub version: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Snapshot {
    pub entries: Option<Vec<Entry>>,
    pub warning: Option<String>,
}

impl Snapshot {
    fn unavailable(warning: Option<&str>) -> Self {
        Self {
            entries: None,
            warning: warning.map(str::to_owned),
        }
    }
}

fn valid_text(value: &str, maximum: usize) -> bool {
    !value.trim().is_empty() && value.len() <= maximum && !value.chars().any(char::is_control)
}

fn valid(entries: &[Entry]) -> bool {
    let mut ids = HashSet::new();
    entries.len() <= MAX_ENTRIES
        && entries.iter().all(|entry| {
            valid_text(&entry.id, 2048)
                && valid_text(&entry.name, 512)
                && entry
                    .version
                    .as_ref()
                    .is_none_or(|version| valid_text(version, 128))
                && ids.insert(&entry.id)
        })
}

pub fn load(directory: &Path) -> Snapshot {
    let Ok(_guard) = STORE_LOCK.lock() else {
        return Snapshot::unavailable(Some(READ_FAILED));
    };
    let path = directory.join("market/seen-apps.json");
    let metadata = match fs::symlink_metadata(&path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Snapshot::unavailable(None);
        }
        Err(_) => return Snapshot::unavailable(Some(READ_FAILED)),
    };
    if !metadata.is_file() || metadata.len() > MAX_JSON {
        return Snapshot::unavailable(Some(DAMAGED));
    }
    let mut bytes = Vec::new();
    if File::open(&path)
        .and_then(|file| file.take(MAX_JSON + 1).read_to_end(&mut bytes))
        .is_err()
    {
        return Snapshot::unavailable(Some(READ_FAILED));
    }
    if bytes.len() as u64 > MAX_JSON {
        return Snapshot::unavailable(Some(DAMAGED));
    }
    match serde_json::from_slice::<Vec<Entry>>(&bytes) {
        Ok(entries) if valid(&entries) => Snapshot {
            entries: Some(entries),
            warning: None,
        },
        _ => Snapshot::unavailable(Some(DAMAGED)),
    }
}

struct Temporary(PathBuf);
impl Drop for Temporary {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

pub fn save(directory: &Path, entries: &[Entry]) -> Result<(), String> {
    if !valid(entries) {
        return Err(INVALID.into());
    }
    let mut bytes = serde_json::to_vec_pretty(entries).map_err(|_| INVALID)?;
    bytes.push(b'\n');
    if bytes.len() as u64 > MAX_JSON {
        return Err(INVALID.into());
    }
    let _guard = STORE_LOCK.lock().map_err(|_| SAVE_FAILED)?;
    let root = directory.join("market");
    fs::create_dir_all(&root).map_err(|_| SAVE_FAILED)?;
    let temporary = Temporary(root.join(format!(
        ".seen-apps-{}-{}-{}.tmp",
        std::process::id(),
        SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos(),
        NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
    )));
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&temporary.0)
        .map_err(|_| SAVE_FAILED)?;
    file.write_all(&bytes).map_err(|_| SAVE_FAILED)?;
    file.sync_all().map_err(|_| SAVE_FAILED)?;
    drop(file);
    // Same-directory rename replaces the previous snapshot atomically. Do not
    // remove the old target first: a failed save must keep the last comparison.
    fs::rename(&temporary.0, root.join("seen-apps.json")).map_err(|_| SAVE_FAILED)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    struct Directory(PathBuf);
    impl Directory {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "puretv-market-seen-{}-{}",
                std::process::id(),
                NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
            ));
            fs::create_dir_all(&path).unwrap();
            Self(path)
        }
        fn snapshot(&self) -> PathBuf {
            self.0.join("market/seen-apps.json")
        }
    }
    impl Drop for Directory {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn entry(id: &str, name: &str, version: Option<&str>) -> Entry {
        Entry {
            id: id.into(),
            name: name.into(),
            version: version.map(str::to_owned),
        }
    }
    fn apps() -> Vec<Entry> {
        vec![
            entry(
                r#"["app","apps/racing","used-car"]"#,
                "极品二手车",
                Some("0.1.3"),
            ),
            entry(r#"["launcher","launcher/demo","demo"]"#, "演示", None),
            entry(r#"["app","apps/demo","demo"]"#, "演示", Some("1.0")),
        ]
    }

    #[test]
    fn missing_snapshot_does_not_create_data_or_claim_an_empty_previous_visit() {
        let directory = Directory::new();
        let result = load(&directory.0);
        assert!(result.entries.is_none());
        assert!(result.warning.is_none());
        assert!(!directory.0.join("market").exists());
    }

    #[test]
    fn snapshot_round_trips_unicode_unknown_versions_and_same_names_as_plain_json() {
        let directory = Directory::new();
        let entries = apps();
        save(&directory.0, &entries).unwrap();
        let loaded = load(&directory.0);
        assert_eq!(loaded.entries, Some(entries.clone()));
        assert!(loaded.warning.is_none());
        let data: serde_json::Value =
            serde_json::from_slice(&fs::read(directory.snapshot()).unwrap()).unwrap();
        assert_eq!(data, json!(entries));
        assert!(data
            .as_array()
            .unwrap()
            .iter()
            .all(|item| item.as_object().unwrap().len() == 3));
        // A fresh read sees the replacement, and [] remains a real known baseline.
        save(&directory.0, &entries[..1]).unwrap();
        assert_eq!(load(&directory.0).entries, Some(entries[..1].to_vec()));
        save(&directory.0, &[]).unwrap();
        assert_eq!(load(&directory.0).entries, Some(vec![]));
        assert_eq!(fs::read_dir(directory.0.join("market")).unwrap().count(), 1);
    }

    #[test]
    fn damaged_snapshot_is_reported_and_kept_for_the_caller_to_handle() {
        let directory = Directory::new();
        fs::create_dir_all(directory.0.join("market")).unwrap();
        for bytes in [
            b"{".as_slice(),
            br#"{"entries":[]}"#.as_slice(),
            br#"[{"id":"x","name":"name","version":null,"url":"https://example.com"}]"#.as_slice(),
            br#"[{"id":"x","name":"name","version":false}]"#.as_slice(),
            br#"[{"id":"x","name":"name","version":null},{"id":"x","name":"other","version":"2"}]"#
                .as_slice(),
        ] {
            fs::write(directory.snapshot(), bytes).unwrap();
            let result = load(&directory.0);
            assert!(result.entries.is_none());
            assert_eq!(result.warning.as_deref(), Some(DAMAGED));
            assert_eq!(fs::read(directory.snapshot()).unwrap(), bytes);
        }
    }

    #[test]
    fn oversized_and_non_file_snapshots_are_not_accepted_as_a_first_visit() {
        let directory = Directory::new();
        fs::create_dir_all(directory.0.join("market")).unwrap();
        File::create(directory.snapshot())
            .unwrap()
            .set_len(MAX_JSON + 1)
            .unwrap();
        assert_eq!(load(&directory.0).warning.as_deref(), Some(DAMAGED));
        fs::remove_file(directory.snapshot()).unwrap();
        fs::create_dir(directory.snapshot()).unwrap();
        assert_eq!(load(&directory.0).warning.as_deref(), Some(DAMAGED));
    }

    #[test]
    fn invalid_entries_never_replace_a_valid_baseline() {
        let directory = Directory::new();
        save(&directory.0, &apps()).unwrap();
        let previous = fs::read(directory.snapshot()).unwrap();
        let invalid = vec![
            vec![entry("", "app", Some("1"))],
            vec![entry("x", " \t", Some("1"))],
            vec![entry("x", "app", Some(""))],
            vec![entry("x", "app", Some("1\n2"))],
            vec![entry(&"x".repeat(2049), "app", None)],
            vec![entry("x", &"x".repeat(513), None)],
            vec![entry("x", "app", Some(&"x".repeat(129)))],
            vec![entry("x", "app", None), entry("x", "other", Some("2"))],
            (0..=MAX_ENTRIES)
                .map(|i| entry(&i.to_string(), "app", Some("1")))
                .collect(),
        ];
        for entries in invalid {
            assert_eq!(save(&directory.0, &entries).unwrap_err(), INVALID);
            assert_eq!(fs::read(directory.snapshot()).unwrap(), previous);
        }
        assert_eq!(fs::read_dir(directory.0.join("market")).unwrap().count(), 1);
    }

    #[test]
    fn failed_atomic_replacement_cleans_temporary_file_and_leaves_target_untouched() {
        let directory = Directory::new();
        fs::create_dir_all(directory.snapshot()).unwrap();
        fs::write(directory.snapshot().join("keep"), b"previous content").unwrap();
        assert_eq!(save(&directory.0, &apps()).unwrap_err(), SAVE_FAILED);
        assert_eq!(
            fs::read(directory.snapshot().join("keep")).unwrap(),
            b"previous content"
        );
        assert_eq!(fs::read_dir(directory.0.join("market")).unwrap().count(), 1);
    }

    #[test]
    fn reading_or_saving_seen_apps_does_not_change_catalog_cache() {
        let directory = Directory::new();
        fs::create_dir_all(directory.0.join("market")).unwrap();
        let catalog = directory.0.join("market/catalog-v2.json");
        fs::write(&catalog, b"catalog cache owned by market.rs").unwrap();
        assert!(load(&directory.0).entries.is_none());
        save(&directory.0, &apps()).unwrap();
        assert_eq!(
            fs::read(&catalog).unwrap(),
            b"catalog cache owned by market.rs"
        );
        assert_eq!(load(&directory.0).entries, Some(apps()));
    }
}
