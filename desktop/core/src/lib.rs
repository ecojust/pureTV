//! A small, GUI-independent ADB manager. All device mutations are scoped to a
//! verified serial and Android user. No arbitrary shell execution is exposed.
mod adb;
mod manager;
mod network;
mod parse;
pub use network::{read as read_local_network, LocalAddress, LocalNetwork};

pub use manager::Manager;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(
    tag = "action",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum Request {
    GetState,
    RefreshSystemInfo,
    RefreshLocalNetwork,
    SetAdbPath {
        path: String,
    },
    Connect {
        host: String,
        port: u16,
    },
    Pair {
        host: String,
        port: u16,
        code: String,
    },
    Disconnect,
    Scan,
    SetEnabled {
        packages: Vec<String>,
        enabled: bool,
    },
    Uninstall {
        packages: Vec<String>,
    },
    Restore {
        packages: Vec<String>,
    },
    Install {
        paths: Vec<String>,
    },
    SetHome {
        component: String,
    },
    RestoreHome,
    ClearHistory,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub local_network: LocalNetwork,
    pub last_connection: Option<ConnectionAddress>,
    pub install_results: Vec<InstallResult>,
    pub system_info: Option<SystemInfo>,
    pub revision: u64,
    pub adb_path: Option<String>,
    pub adb_available: bool,
    pub device: Option<Device>,
    pub packages: Vec<PackageInfo>,
    pub launchers: Vec<LauncherInfo>,
    pub default_home: Option<String>,
    pub original_home: Option<String>,
    pub history: Vec<HistoryEntry>,
    pub message: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionAddress {
    pub host: String,
    pub port: u16,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub serial: String,
    pub model: String,
    pub android_version: String,
    pub user_id: u32,
    pub status: String,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageInfo {
    /// Sum of installed base/split APK bytes; excludes private data and cache.
    pub apk_size_bytes: Option<u64>,
    pub package_name: String,
    pub label: String,
    pub system: bool,
    pub enabled: bool,
    pub installed: bool,
    pub protected_reason: Option<String>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherInfo {
    pub apk_size_bytes: Option<u64>,
    pub component: String,
    pub package_name: String,
    pub label: String,
    pub is_default: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub timestamp: u64,
    pub action: String,
    pub target: String,
    pub device: String,
    pub user_id: u32,
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(
    tag = "action",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum LauncherRequest {
    GetLayout,
    GetBackgrounds,
    ApplyLayout { layout: serde_json::Value },
    ResetLayout,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub manufacturer: Option<String>,
    pub brand: Option<String>,
    pub sdk_version: Option<String>,
    pub security_patch: Option<String>,
    pub cpu: Option<String>,
    pub cpu_abi: Option<String>,
    pub memory_total_bytes: Option<u64>,
    pub memory_available_bytes: Option<u64>,
    pub storage_total_bytes: Option<u64>,
    pub storage_available_bytes: Option<u64>,
    pub display_resolution: Option<String>,
    pub uptime_seconds: Option<u64>,
    pub queried_at: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub path: String,
    pub success: bool,
    pub message: String,
}

mod unified_layout;

/// Validate the same bounded SVG subset accepted by launcher layout icons.
pub fn validate_svg_icon(value: &str) -> Result<(), String> {
    unified_layout::svg(value)
}
