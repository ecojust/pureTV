use crate::{
    adb::{self, Output, ProcessRunner, Runner},
    parse, ConnectionAddress, Device, HistoryEntry, InstallResult, LauncherInfo, PackageInfo,
    Request, Snapshot, SystemInfo,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

const LIMIT_HISTORY: usize = 200;
#[derive(Default, Serialize, Deserialize)]
#[serde(default)]
struct Saved {
    last_connection: Option<ConnectionAddress>,
    adb_path: Option<String>,
    homes: Vec<Home>,
    enabled_states: Vec<EnabledState>,
    history: Vec<HistoryEntry>,
}
#[derive(Serialize, Deserialize)]
struct EnabledState {
    key: String,
    package: String,
    state: u8,
}
#[derive(Serialize, Deserialize)]
struct Home {
    key: String,
    component: String,
}
#[derive(Clone, Copy)]
enum Action {
    Enable,
    Disable,
    Uninstall,
    Restore,
}
impl Action {
    fn label(self) -> &'static str {
        match self {
            Self::Enable => "启用",
            Self::Disable => "停用",
            Self::Uninstall => "为当前用户卸载",
            Self::Restore => "恢复安装",
        }
    }
}

#[path = "launcher.rs"]
mod launcher;

pub struct Manager {
    data_dir: PathBuf,
    saved: Saved,
    state: Snapshot,
    runner: Box<dyn Runner>,
    cancel: Arc<AtomicBool>,
    defer_cancel: bool,
}
impl Manager {
    pub fn new(data_dir: PathBuf, cancel: Arc<AtomicBool>) -> Self {
        let saved = read_saved(&data_dir);
        let state = Snapshot {
            local_network: crate::network::read(),
            history: saved.history.clone(),
            last_connection: saved.last_connection.clone(),
            message: "选择 ADB 后连接电视；首次连接请在电视上授权".into(),
            ..Snapshot::default()
        };
        let mut manager = Self {
            data_dir,
            saved,
            state,
            runner: Box::new(ProcessRunner),
            cancel,
            defer_cancel: false,
        };
        manager.locate_adb();
        manager
    }
    pub fn snapshot(&self) -> Snapshot {
        self.state.clone()
    }

    /// Called during GUI shutdown or update handoff, after any in-flight operation completes.
    /// Cancellation must not prevent the final bounded kill-server command.
    pub fn shutdown_adb(&mut self) -> Result<(), String> {
        self.locate_adb();
        if !self.state.adb_available {
            return Ok(());
        }
        let path = self.state.adb_path.as_ref().ok_or("未找到 ADB")?;
        let uncancelled = AtomicBool::new(false);
        let output = self.runner.run(
            Path::new(path),
            &["kill-server".into()],
            None,
            &uncancelled,
            Duration::from_secs(8),
        )?;
        // `kill-server` succeeds when the daemon is already stopped, even though
        // adb prints "cannot connect to daemon ... Connection refused". Unlike
        // device commands, its exit status is sufficient to identify failure.
        if output.code != 0 {
            check_output(output)?;
        }
        self.state.device = None;
        self.state.system_info = None;
        self.state.packages.clear();
        self.state.launchers.clear();
        self.state.default_home = None;
        self.state.original_home = None;
        Ok(())
    }

    pub fn execute(&mut self, request: Request) -> Result<Snapshot, String> {
        // The caller resets cancellation once, before dispatching the task.
        // Resetting here could swallow an immediate cancel queued before lock acquisition.
        self.defer_cancel = false;
        let result = match request {
            Request::RefreshLocalNetwork => {
                self.state.local_network = crate::network::read();
                match self.state.local_network.error.clone() {
                    Some(error) => Err(error),
                    None => {
                        self.state.message = if self.state.local_network.addresses.is_empty() {
                            "未检测到可用的局域网 IPv4 地址"
                        } else {
                            "本机局域网地址已刷新"
                        }
                        .into();
                        Ok(())
                    }
                }
            }
            Request::RefreshSystemInfo => {
                let device = self.ensure_device(true)?;
                self.refresh_system_info(&device);
                if self.cancel.load(Ordering::Relaxed) {
                    Err("操作已取消".into())
                } else {
                    self.state.message = "电视系统信息已刷新".into();
                    Ok(())
                }
            }
            Request::GetState => {
                self.locate_adb();
                Ok(())
            }
            Request::SetAdbPath { path } => self.set_adb(path),
            Request::Connect { host, port } => self.connect(&host, port),
            Request::Pair { host, port, code } => self.pair(&host, port, &code),
            Request::Disconnect => self.disconnect(),
            Request::Scan => self.scan(),
            Request::SetEnabled { packages, enabled } => self.batch(
                packages,
                if enabled {
                    Action::Enable
                } else {
                    Action::Disable
                },
            ),
            Request::Uninstall { packages } => self.batch(packages, Action::Uninstall),
            Request::Restore { packages } => self.batch(packages, Action::Restore),
            Request::Install { paths } => self.install(paths),
            Request::SetHome { component } => self.set_home(&component, false),
            Request::RestoreHome => {
                let home = self.state.original_home.clone();
                match home {
                    Some(value) => self.set_home(&value, true),
                    None => Err("此电视用户尚无已记录的原桌面".into()),
                }
            }
            Request::ClearHistory => {
                self.state.history.clear();
                self.state.message = "操作记录已清空".into();
                self.persist()
            }
        };
        self.defer_cancel = false;
        self.state.revision = self.state.revision.saturating_add(1);
        match result {
            Ok(()) => Ok(self.state.clone()),
            Err(error) => {
                self.state.message = error.clone();
                Err(error)
            }
        }
    }
    fn locate_adb(&mut self) {
        let path = adb::discover(self.saved.adb_path.as_deref());
        self.state.adb_available = path.is_some();
        self.state.adb_path = path
            .map(|p| p.to_string_lossy().into_owned())
            .or_else(|| self.saved.adb_path.clone());
    }
    fn run(
        &mut self,
        args: Vec<String>,
        input: Option<&str>,
        seconds: u64,
    ) -> Result<String, String> {
        self.run_output(args, input, seconds).and_then(check_output)
    }
    fn run_output(
        &mut self,
        args: Vec<String>,
        input: Option<&str>,
        seconds: u64,
    ) -> Result<Output, String> {
        let path = self
            .state
            .adb_path
            .as_ref()
            .ok_or("未找到 ADB，请选择 Platform Tools 中的 adb")?;
        let deferred = AtomicBool::new(false);
        let flag = if self.defer_cancel {
            &deferred
        } else {
            self.cancel.as_ref()
        };
        self.runner.run(
            Path::new(path),
            &args,
            input,
            flag,
            Duration::from_secs(seconds),
        )
    }
    fn shell(&mut self, serial: &str, args: &[&str]) -> Result<String, String> {
        let mut values = vec!["-s".to_string(), serial.to_string(), "shell".to_string()];
        values.extend(args.iter().map(|s| s.to_string()));
        self.run(values, None, 25)
    }
    fn verify_adb(&mut self) -> Result<(), String> {
        self.locate_adb();
        if !self.state.adb_available {
            return Err("未找到 ADB，请选择 Platform Tools 中的 adb".into());
        }
        let output = self.run(vec!["version".into()], None, 8)?;
        if !output.contains("Android Debug Bridge version") {
            return Err("所选文件不是有效的 Android Debug Bridge".into());
        }
        Ok(())
    }
    fn set_adb(&mut self, path: String) -> Result<(), String> {
        if self.state.device.is_some() {
            return Err("请先断开当前电视，再更换 ADB".into());
        }
        let path = path.trim();
        if path.len() > 4096 {
            return Err("ADB 路径过长".into());
        }
        let old = self.saved.adb_path.clone();
        self.saved.adb_path = (!path.is_empty()).then(|| path.to_string());
        if let Err(error) = self.verify_adb().and_then(|_| self.persist()) {
            self.saved.adb_path = old;
            self.locate_adb();
            return Err(error);
        }
        self.state.message = "ADB 已就绪".into();
        Ok(())
    }
    fn connect(&mut self, host: &str, port: u16) -> Result<(), String> {
        let serial = parse::endpoint(host, port)?;
        self.state.local_network = crate::network::read();
        let address = ConnectionAddress {
            host: host.trim().to_string(),
            port,
        };
        let previous = self.saved.last_connection.replace(address.clone());
        if let Err(error) = self.persist() {
            self.saved.last_connection = previous;
            return Err(error);
        }
        self.state.last_connection = Some(address);
        self.verify_adb()?;
        // Selecting another target never leaves the previous television active
        // behind a failed connection attempt.
        self.state.device = None;
        self.state.system_info = None;
        self.state.packages.clear();
        self.state.launchers.clear();
        self.state.default_home = None;
        self.state.original_home = None;
        // Reset only verified current-user processes on this computer. A
        // kill-server request can affect another user's or a remote daemon.
        // The subsequent connect starts a fresh ADB server automatically.
        if self.cancel.load(Ordering::Relaxed) {
            return Err("操作已取消".into());
        }
        self.runner
            .clear_adb_processes(self.cancel.as_ref(), Duration::from_secs(5))
            .map_err(|error| format!("连接前清理 ADB 失败：{error}"))?;
        let connection = self
            .run(vec!["connect".into(), serial.clone()], None, 20)
            .map_err(|error| connection_error(&serial, error));
        // ADB can report "failed to authenticate" while it adds an unauthorized
        // device and the television is showing its approval dialog.
        let status = match self.device_status(&serial)? {
            Some(status) => status,
            None => {
                return Err(connection
                    .err()
                    .unwrap_or_else(|| "电视未出现在 ADB 列表，请检查 IP、端口与调试设置".into()))
            }
        };
        self.state.device = Some(Device {
            serial: serial.clone(),
            model: "Android TV".into(),
            android_version: String::new(),
            user_id: 0,
            status: status.clone(),
        });
        self.state.packages.clear();
        self.state.launchers.clear();
        self.state.default_home = None;
        self.state.original_home = None;
        if status != "device" {
            self.state.message = if status == "unauthorized" {
                "等待电视授权：请在电视上允许此电脑进行调试"
            } else {
                "电视离线，请检查连接后重新连接"
            }
            .into();
            return Ok(());
        }
        self.scan()
    }
    fn pair(&mut self, host: &str, port: u16, code: &str) -> Result<(), String> {
        let endpoint = parse::endpoint(host, port)?;
        if code.len() != 6 || !code.bytes().all(|b| b.is_ascii_digit()) {
            return Err("请输入电视显示的六位配对码".into());
        }
        self.verify_adb()?;
        // Never put a pairing code in argv, logs or persisted configuration.
        let result = self.run(
            vec!["pair".into(), endpoint],
            Some(&format!("{code}\n")),
            30,
        );
        match result {
            Ok(output) if output.contains("Successfully paired") => {
                self.state.message =
                    "配对成功，请使用电视显示的调试端口连接（可能与配对端口不同）".into();
                Ok(())
            }
            Ok(_) => Err("配对未成功，请检查配对端口及电视上的六位配对码".into()),
            Err(_) => Err("配对失败或已取消，请检查配对端口及配对码后重试".into()),
        }
    }
    fn disconnect(&mut self) -> Result<(), String> {
        if let Some(device) = self.state.device.clone() {
            self.run(vec!["disconnect".into(), device.serial], None, 10)?;
        }
        self.state.device = None;
        self.state.system_info = None;
        self.state.packages.clear();
        self.state.launchers.clear();
        self.state.default_home = None;
        self.state.original_home = None;
        self.state.message = "已断开电视".into();
        Ok(())
    }
    fn device_status(&mut self, serial: &str) -> Result<Option<String>, String> {
        let devices = self.run(vec!["devices".into(), "-l".into()], None, 10)?;
        Ok(parse::devices(&devices)
            .into_iter()
            .find(|(id, _)| id == serial)
            .map(|(_, status)| status))
    }
    fn ensure_device(&mut self, same_user: bool) -> Result<Device, String> {
        let old = self.state.device.clone().ok_or("请先连接电视")?;
        let status = self
            .device_status(&old.serial)?
            .unwrap_or_else(|| "offline".into());
        if let Some(current) = self.state.device.as_mut() {
            current.status = status.clone();
        }
        if status != "device" {
            return Err(if status == "unauthorized" {
                "电视尚未授权，请在电视上允许连接"
            } else {
                "电视已离线，请重新连接"
            }
            .into());
        }
        let user = self
            .shell(&old.serial, &["am", "get-current-user"])?
            .trim()
            .parse::<u32>()
            .map_err(|_| "无法确认电视的当前用户，已停止操作")?;
        if user > i32::MAX as u32 {
            return Err("电视返回了无效用户 ID".into());
        }
        if same_user && old.user_id != user {
            return Err("电视当前用户已改变，请重新扫描并确认操作目标".into());
        }
        if !same_user && old.user_id != user {
            // Never associate a previous user's catalogue with the new identity,
            // even if a later read fails or scanning is cancelled.
            self.state.packages.clear();
            self.state.system_info = None;
            self.state.launchers.clear();
            self.state.default_home = None;
            self.state.original_home = None;
        }
        let current = self.state.device.as_mut().ok_or("电视连接已失效")?;
        current.user_id = user;
        Ok(current.clone())
    }
    fn list(&mut self, device: &Device, flags: &[&str]) -> Result<BTreeSet<String>, String> {
        let user = device.user_id.to_string();
        let mut args = vec!["pm", "list", "packages"];
        args.extend(flags);
        args.extend(["--user", user.as_str()]);
        parse::packages(&self.shell(&device.serial, &args)?)
    }
    fn homes(&mut self, device: &Device) -> Result<(Vec<String>, Option<String>), String> {
        let user = device.user_id.to_string();
        let list = self.shell(
            &device.serial,
            &[
                "cmd",
                "package",
                "query-activities",
                "--components",
                "--user",
                &user,
                "-a",
                "android.intent.action.MAIN",
                "-c",
                "android.intent.category.HOME",
            ],
        )?;
        let current = self.shell(
            &device.serial,
            &[
                "cmd",
                "package",
                "resolve-activity",
                "--brief",
                "--user",
                &user,
                "-a",
                "android.intent.action.MAIN",
                "-c",
                "android.intent.category.HOME",
            ],
        )?;
        Ok((parse::components(&list), parse::default_home(&current)))
    }
    fn read_catalogue(&mut self, device: &Device) -> Result<(), String> {
        let installed = self.list(device, &[])?;
        if installed.is_empty() {
            return Err("电视未返回已安装应用，旧列表已保留".into());
        }
        let system = self.list(device, &["-s", "-u"])?;
        let disabled = self.list(device, &["-d"])?;
        let known = self.list(device, &["-u"])?;
        let (homes, default) = match self.homes(device) {
            Ok(values) => values,
            Err(error)
                if (!self.defer_cancel && self.cancel.load(Ordering::Relaxed))
                    || error.contains("操作已取消") =>
            {
                return Err(error)
            }
            // Some firmware restricts HOME queries while allowing package
            // inspection. Keep the useful catalogue; cleanup stays fail-closed.
            Err(_) => (Vec::new(), None),
        };
        let home_pkg = default
            .as_deref()
            .and_then(|s| s.split_once('/'))
            .map(|(p, _)| p);
        let all: BTreeSet<_> = installed
            .iter()
            .cloned()
            .chain(known.intersection(&system).cloned())
            .collect();
        let sizes: BTreeMap<_, _> = self
            .state
            .packages
            .iter()
            .map(|p| (p.package_name.clone(), p.apk_size_bytes))
            .collect();
        let packages = all
            .into_iter()
            .map(|pkg| {
                let protected_reason = if parse::core_package(&pkg) {
                    Some("核心系统组件".into())
                } else if home_pkg == Some(pkg.as_str()) {
                    Some("当前默认桌面，请先切换到其他启动器".into())
                } else {
                    None
                };
                PackageInfo {
                    apk_size_bytes: if installed.contains(&pkg) {
                        sizes.get(&pkg).copied().flatten()
                    } else {
                        None
                    },
                    label: parse::label(&pkg),
                    system: system.contains(&pkg),
                    enabled: !disabled.contains(&pkg),
                    installed: installed.contains(&pkg),
                    package_name: pkg,
                    protected_reason,
                }
            })
            .collect();
        self.state.launchers = homes
            .into_iter()
            .map(|component| {
                let package_name = component.split('/').next().unwrap_or_default().to_string();
                LauncherInfo {
                    apk_size_bytes: sizes.get(&package_name).copied().flatten(),
                    label: parse::label(&package_name),
                    package_name,
                    is_default: default.as_ref() == Some(&component),
                    component,
                }
            })
            .collect();
        self.state.default_home = default;
        self.state.packages = packages;
        let key = device_key(device);
        self.state.original_home = self
            .saved
            .homes
            .iter()
            .find(|h| h.key == key)
            .map(|h| h.component.clone());
        Ok(())
    }
    fn refresh_system_info(&mut self, device: &Device) {
        let query = |manager: &mut Self, args: &[&str]| -> Option<String> {
            let mut values = vec!["-s".into(), device.serial.clone(), "shell".into()];
            values.extend(args.iter().map(|s| s.to_string()));
            manager.run(values, None, 6).ok()
        };
        let properties = query(self, &["getprop"]).unwrap_or_default();
        let property = |key: &str| -> Option<String> {
            properties
                .lines()
                .find_map(|line| {
                    line.strip_prefix(&format!("[{key}]: ["))
                        .and_then(|value| value.strip_suffix(']'))
                        .map(|value| parse::short(value, 160))
                })
                .filter(|value| !value.is_empty())
        };
        let memory =
            query(self, &["cat", "/proc/meminfo"]).and_then(|output| parse::memory_info(&output));
        let storage =
            query(self, &["df", "-k", "/data"]).and_then(|output| parse::disk_info(&output));
        let display_resolution = query(self, &["wm", "size"]).and_then(|output| {
            output.lines().rev().find_map(|line| {
                line.split_once(':')
                    .map(|(_, value)| value.trim().to_string())
                    .filter(|value| {
                        value.len() < 32
                            && value.split_once('x').is_some_and(|(width, height)| {
                                width.parse::<u32>().is_ok_and(|n| n > 0 && n <= 16384)
                                    && height.parse::<u32>().is_ok_and(|n| n > 0 && n <= 16384)
                            })
                    })
            })
        });
        let uptime_seconds = query(self, &["cat", "/proc/uptime"]).and_then(|output| {
            output
                .split_whitespace()
                .next()?
                .split('.')
                .next()?
                .parse::<u64>()
                .ok()
        });
        self.state.system_info = Some(SystemInfo {
            manufacturer: property("ro.product.manufacturer"),
            brand: property("ro.product.brand"),
            sdk_version: property("ro.build.version.sdk"),
            security_patch: property("ro.build.version.security_patch"),
            cpu: property("ro.soc.model")
                .or_else(|| property("ro.board.platform"))
                .or_else(|| property("ro.hardware")),
            cpu_abi: property("ro.product.cpu.abilist").or_else(|| property("ro.product.cpu.abi")),
            memory_total_bytes: memory.map(|pair| pair.0),
            memory_available_bytes: memory.map(|pair| pair.1),
            storage_total_bytes: storage.map(|pair| pair.0),
            storage_available_bytes: storage.map(|pair| pair.1),
            display_resolution,
            uptime_seconds,
            queried_at: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        });
    }
    fn metadata_batch(
        &mut self,
        device: &Device,
        script: String,
    ) -> Option<BTreeMap<String, String>> {
        if script.len() > 48 * 1024 || script.contains('\'') {
            return None;
        }
        let args = vec![
            "-s".into(),
            device.serial.clone(),
            "shell".into(),
            "sh".into(),
            "-c".into(),
            format!("'{script}'"),
        ];
        let program = self.state.adb_path.as_ref()?;
        let output = self
            .runner
            .run(
                Path::new(program),
                &args,
                None,
                &self.cancel,
                Duration::from_secs(12),
            )
            .ok()?;
        Some(parse::package_blocks(&output.text))
    }
    fn refresh_package_sizes(&mut self, device: &Device) {
        // One ADB round-trip for each group, rather than two round-trips per app.
        let homes: BTreeSet<_> = self
            .state
            .launchers
            .iter()
            .map(|home| home.package_name.clone())
            .collect();
        let mut targets: Vec<_> = self
            .state
            .packages
            .iter()
            .filter(|p| p.installed)
            .map(|p| {
                (
                    if homes.contains(&p.package_name) {
                        0
                    } else if !p.system {
                        1
                    } else {
                        2
                    },
                    p.package_name.clone(),
                )
            })
            .collect();
        targets.sort();
        for package in &mut self.state.packages {
            package.apk_size_bytes = None;
        }
        let started = Instant::now();
        for chunk in targets.chunks(40) {
            if self.cancel.load(Ordering::Relaxed) || started.elapsed() > Duration::from_secs(30) {
                break;
            }
            let names = chunk
                .iter()
                .map(|(_, name)| name.as_str())
                .collect::<Vec<_>>()
                .join(" ");
            if chunk.iter().any(|(_, name)| !parse::package(name)) {
                continue;
            }
            let script=format!("for p in {names}; do printf \"\\n@@puretv@@%s\\n\" \"$p\"; pm path --user {} \"$p\"; done",device.user_id);
            let Some(paths) = self.metadata_batch(device, script) else {
                continue;
            };
            let mut groups: Vec<(String, Vec<(String, usize)>)> = Vec::new();
            let mut script = String::new();
            let mut counts = Vec::new();
            for (_, name) in chunk {
                let Some(paths) = paths.get(name).and_then(|text| parse::apk_paths(text)) else {
                    continue;
                };
                let block = format!(
                    "printf \"\\n@@puretv@@{name}\\n\"; stat -c %s -- {}; ",
                    paths.join(" ")
                )
                .replace("\\\"", "\"");
                if block.len() > 48 * 1024 {
                    continue;
                }
                if script.len() + block.len() > 48 * 1024 {
                    groups.push((script, counts));
                    script = String::new();
                    counts = Vec::new();
                }
                script.push_str(&block);
                counts.push((name.clone(), paths.len()));
            }
            if !script.is_empty() {
                groups.push((script, counts));
            }
            for (script, counts) in groups {
                if self.cancel.load(Ordering::Relaxed) {
                    break;
                }
                if let Some(sizes) = self.metadata_batch(device, script) {
                    for (name, count) in counts {
                        let size = sizes
                            .get(&name)
                            .and_then(|text| parse::apk_size(text, count));
                        if let Some(package) = self
                            .state
                            .packages
                            .iter_mut()
                            .find(|p| p.package_name == name)
                        {
                            package.apk_size_bytes = size;
                        }
                    }
                }
            }
        }
        let sizes: BTreeMap<_, _> = self
            .state
            .packages
            .iter()
            .map(|p| (p.package_name.clone(), p.apk_size_bytes))
            .collect();
        for home in &mut self.state.launchers {
            home.apk_size_bytes = sizes.get(&home.package_name).copied().flatten();
        }
    }
    fn scan(&mut self) -> Result<(), String> {
        let mut device = self.ensure_device(false)?;
        device.model = parse::short(
            self.shell(&device.serial, &["getprop", "ro.product.model"])?
                .trim(),
            120,
        );
        device.android_version = parse::short(
            self.shell(&device.serial, &["getprop", "ro.build.version.release"])?
                .trim(),
            40,
        );
        self.state.device = Some(device.clone());
        self.read_catalogue(&device)?;
        self.refresh_system_info(&device);
        self.refresh_package_sizes(&device);
        if self.cancel.load(Ordering::Relaxed) {
            return Err("操作已取消".into());
        }
        self.state.message = format!(
            "扫描完成：{} 个已安装应用{}",
            self.state.packages.iter().filter(|p| p.installed).count(),
            if self.state.default_home.is_none() {
                "；无法确认默认桌面，停用／卸载暂不可用"
            } else {
                ""
            }
        );
        Ok(())
    }
    fn batch(&mut self, packages: Vec<String>, action: Action) -> Result<(), String> {
        let targets = validate_targets(packages)?;
        let device = self.ensure_device(true)?;
        self.read_catalogue(&device)?;
        let mut success = 0;
        let mut failed = 0;
        for target in &targets {
            if self.cancel.load(Ordering::Relaxed) {
                break;
            }
            let result = self.change_one(target, action);
            self.defer_cancel = false;
            match &result {
                Ok(_) => success += 1,
                Err(_) => failed += 1,
            }
            self.record(
                action.label(),
                target,
                result.is_ok(),
                result.as_deref().unwrap_or_else(|e| e),
            );
            if self
                .state
                .device
                .as_ref()
                .is_none_or(|d| d.status != "device")
            {
                break;
            }
        }
        let skipped = targets.len() - success - failed;
        self.state.message = format!(
            "{}完成：成功 {success} 项，失败 {failed} 项，未执行 {skipped} 项",
            action.label()
        );
        self.persist()?;
        Ok(())
    }
    fn change_one(&mut self, target: &str, action: Action) -> Result<String, String> {
        let device = self.ensure_device(true)?;
        self.read_catalogue(&device)?; // Re-read HOME and installed state before every mutation.
        let package = self
            .state
            .packages
            .iter()
            .find(|p| p.package_name == target)
            .cloned()
            .ok_or("应用不在当前设备列表中，请重新扫描")?;
        if matches!(action, Action::Disable | Action::Uninstall) {
            if self.state.default_home.is_none() {
                return Err("无法确认当前默认桌面，已停止停用／卸载操作".into());
            }
            if let Some(reason) = package.protected_reason {
                return Err(format!("无法操作：{reason}"));
            }
        }
        if !matches!(action, Action::Restore) && !package.installed {
            return Err("应用已不在当前用户中安装".into());
        }
        if matches!(action, Action::Restore) && (package.installed || !package.system) {
            return Err("此应用不是可恢复的系统应用".into());
        }
        if matches!(action, Action::Disable) && !package.enabled {
            return Ok("应用已停用，未重复修改".into());
        }
        // A cancellation skips the remaining targets; it never kills a package
        // mutation halfway through or skips verification of the current target.
        let key = device_key(&device);
        if matches!(action, Action::Disable) && package.enabled {
            let dump = self.shell(&device.serial, &["dumpsys", "package", target])?;
            let prior = enabled_state(&dump, device.user_id)
                .ok_or("无法确认应用原始启用状态，已停止停用操作")?;
            self.saved
                .enabled_states
                .retain(|s| !(s.key == key && s.package == target));
            if self.saved.enabled_states.len() >= 200 {
                self.saved.enabled_states.remove(0);
            }
            self.saved.enabled_states.push(EnabledState {
                key: key.clone(),
                package: target.to_string(),
                state: prior,
            });
            self.persist()?;
        }
        self.defer_cancel = true;
        let user = device.user_id.to_string();
        let restore_default = self
            .saved
            .enabled_states
            .iter()
            .any(|s| s.key == key && s.package == target && s.state == 0);
        let output = match action {
            Action::Enable => self.shell(
                &device.serial,
                &[
                    "pm",
                    if restore_default {
                        "default-state"
                    } else {
                        "enable"
                    },
                    "--user",
                    &user,
                    target,
                ],
            ),
            Action::Disable => self.shell(
                &device.serial,
                &["pm", "disable-user", "--user", &user, target],
            ),
            Action::Uninstall => self.shell(
                &device.serial,
                &["pm", "uninstall", "-k", "--user", &user, target],
            ),
            Action::Restore => self.shell(
                &device.serial,
                &[
                    "cmd",
                    "package",
                    "install-existing",
                    "--user",
                    &user,
                    target,
                ],
            ),
        }
        .map_err(uncertain)?;
        if matches!(action, Action::Uninstall) && !output.lines().any(|l| l.trim() == "Success") {
            return Err(format!(
                "电视未确认卸载成功：{}",
                parse::short(&output, 250)
            ));
        }
        self.ensure_device(true).map_err(uncertain)?;
        self.read_catalogue(&device).map_err(uncertain)?;
        let updated = self
            .state
            .packages
            .iter()
            .find(|p| p.package_name == target);
        let verified = match action {
            Action::Enable => updated.is_some_and(|p| p.installed && p.enabled),
            Action::Disable => updated.is_some_and(|p| p.installed && !p.enabled),
            Action::Uninstall => updated.is_none_or(|p| !p.installed),
            Action::Restore => updated.is_some_and(|p| p.installed),
        };
        if !verified {
            return Err("命令已返回，但复查未确认预期状态；请重新扫描".into());
        }
        if matches!(action, Action::Enable) {
            self.saved
                .enabled_states
                .retain(|s| !(s.key == key && s.package == target));
        }
        Ok(format!("{}成功，已复查设备状态", action.label()))
    }
    fn install(&mut self, paths: Vec<String>) -> Result<(), String> {
        if paths.is_empty() || paths.len() > 10 {
            return Err("每次请选择 1–10 个 APK 文件".into());
        }
        let files: Vec<PathBuf> = paths
            .iter()
            .map(|s| validate_apk(s))
            .collect::<Result<_, _>>()?;
        self.state.install_results.clear();
        let mut succeeded = 0;
        let mut failed = 0;
        for (source, file) in paths.iter().zip(&files) {
            if self.cancel.load(Ordering::Relaxed) {
                break;
            }
            let result = self.install_one(file);
            self.defer_cancel = false;
            if result.is_ok() {
                succeeded += 1;
            } else {
                failed += 1;
            }
            self.state.install_results.push(InstallResult {
                path: source.clone(),
                success: result.is_ok(),
                message: result.as_deref().unwrap_or_else(|e| e).to_string(),
            });
            self.record(
                "安装 APK",
                &file.file_name().unwrap_or_default().to_string_lossy(),
                result.is_ok(),
                result.as_deref().unwrap_or_else(|e| e),
            );
            if self
                .state
                .device
                .as_ref()
                .is_none_or(|d| d.status != "device")
            {
                break;
            }
        }
        if let Some(device) = self.state.device.clone().filter(|d| d.status == "device") {
            // An APK update can replace any user package; invalidate old sizes before refreshing.
            for package in &mut self.state.packages {
                if !package.system {
                    package.apk_size_bytes = None;
                }
            }
            self.refresh_package_sizes(&device);
        }
        self.state.message = format!(
            "安装完成：成功 {succeeded} 项，失败 {failed} 项，未执行 {} 项",
            files.len() - succeeded - failed
        );
        self.persist()?;
        Ok(())
    }
    fn install_one(&mut self, file: &Path) -> Result<String, String> {
        let device = self.ensure_device(true)?;
        let file = validate_apk(&file.to_string_lossy())?;
        self.defer_cancel = true;
        let output = self
            .run_output(
                vec![
                    "-s".into(),
                    device.serial.clone(),
                    "install".into(),
                    "--user".into(),
                    device.user_id.to_string(),
                    "-r".into(),
                    file.to_string_lossy().into_owned(),
                ],
                None,
                180,
            )
            .map_err(uncertain)?;
        // A package-manager rejection is definitive, even when adb exits zero.
        // Inspect the raw output before generic diagnostics truncate long paths.
        if let Some((code, detail)) = install_rejection(&output.text) {
            let detail = parse::short(detail, 500);
            return Err(if code == "INSTALL_FAILED_UPDATE_INCOMPATIBLE" {
                format!("安装失败：应用签名不一致，无法覆盖安装。请在电视系统设置中卸载旧版并删除数据后重装；这会清除存档和本地数据。如需保留数据，请先备份或使用原签名版本。原始错误：{detail}")
            } else {
                format!("安装失败：{detail}")
            });
        }
        let output = check_output(output).map_err(uncertain)?;
        if !output.lines().any(|l| l.trim() == "Success") {
            return Err(format!(
                "电视未确认安装成功：{}",
                parse::short(&output, 250)
            ));
        }
        self.ensure_device(true).map_err(uncertain)?;
        self.read_catalogue(&device).map_err(uncertain)?;
        Ok("电视已确认安装成功，已刷新应用列表".into())
    }
    fn set_home(&mut self, component: &str, restore: bool) -> Result<(), String> {
        let normalized = parse::normalize_component(component).ok_or("启动器组件格式无效")?;
        let component = normalized.as_str();
        let device = self.ensure_device(true)?;
        self.read_catalogue(&device)?;
        if !self
            .state
            .launchers
            .iter()
            .any(|l| l.component == component)
        {
            return Err("所选应用未提供可用的 HOME 启动器，请先安装／启用后重新扫描".into());
        }
        let key = device_key(&device);
        if !restore && !self.saved.homes.iter().any(|h| h.key == key) {
            if let Some(old) = self.state.default_home.clone() {
                if old != component {
                    if self.saved.homes.len() >= 8 {
                        self.saved.homes.remove(0);
                    }
                    self.saved.homes.push(Home {
                        key,
                        component: old.clone(),
                    });
                    self.state.original_home = Some(old);
                }
            }
        }
        // Every attempt, including a retry after a failed write, must ensure
        // recovery information reached disk before changing the television.
        self.persist()?;
        let action = if restore {
            "恢复原桌面"
        } else {
            "设置默认桌面"
        };
        self.defer_cancel = true;
        let user = device.user_id.to_string();
        let quoted = parse::component_arg(component);
        let result = self
            .shell(
                &device.serial,
                &[
                    "cmd",
                    "package",
                    "set-home-activity",
                    "--user",
                    &user,
                    &quoted,
                ],
            )
            .and_then(|_| {
                self.ensure_device(true)?;
                self.read_catalogue(&device)?;
                if self.state.default_home.as_deref() == Some(component) {
                    Ok("默认桌面设置成功，已核对 HOME 组件".to_string())
                } else {
                    Err("电视未采用所选默认桌面，可能受到厂商固件限制".to_string())
                }
            });
        self.defer_cancel = false;
        self.record(
            action,
            component,
            result.is_ok(),
            result.as_deref().unwrap_or_else(|e| e),
        );
        self.persist()?;
        self.state.message = result?;
        Ok(())
    }
    fn record(&mut self, action: &str, target: &str, success: bool, message: &str) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default();
        let (device, user_id) = self
            .state
            .device
            .as_ref()
            .map(|d| (d.serial.clone(), d.user_id))
            .unwrap_or_default();
        self.state.history.insert(
            0,
            HistoryEntry {
                id: now.as_nanos().to_string(),
                timestamp: now.as_secs(),
                action: action.to_string(),
                target: parse::short(target, 512),
                device,
                user_id,
                success,
                message: parse::short(message, 500),
            },
        );
        self.state.history.truncate(LIMIT_HISTORY);
        if let Err(error) = self.persist() {
            self.state.message = error;
        }
    }
    fn persist(&mut self) -> Result<(), String> {
        self.saved.history = self.state.history.clone();
        fs::create_dir_all(&self.data_dir).map_err(|_| "无法创建本地配置目录")?;
        let body = serde_json::to_vec(&self.saved).map_err(|_| "无法保存本地配置")?;
        let temporary = self.data_dir.join("state.new");
        let destination = self.data_dir.join("state.json");
        let backup = self.data_dir.join("state.backup.json");
        fs::write(&temporary, body).map_err(|_| "无法写入本地配置与操作记录")?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(&temporary, fs::Permissions::from_mode(0o600));
        }
        if destination.exists() {
            let _ = fs::remove_file(&backup);
            fs::rename(&destination, &backup).map_err(|_| "无法更新本地配置备份")?;
        }
        if fs::rename(&temporary, &destination).is_err() {
            let _ = fs::rename(&backup, &destination);
            return Err("无法保存本地配置，已尝试恢复旧配置".into());
        }
        Ok(())
    }
}
fn enabled_state(output: &str, user: u32) -> Option<u8> {
    let prefix = format!("User {user}:");
    output
        .lines()
        .map(str::trim)
        .find(|line| line.starts_with(&prefix))?
        .split_whitespace()
        .find_map(|field| {
            field
                .strip_prefix("enabled=")
                .and_then(|s| s.parse::<u8>().ok())
                .filter(|v| *v <= 4)
        })
}
fn device_key(device: &Device) -> String {
    format!("{}#{}", device.serial, device.user_id)
}
fn uncertain(error: String) -> String {
    format!("执行结果未确认，操作可能已生效，请重新扫描：{error}")
}
fn install_rejection(output: &str) -> Option<(&str, &str)> {
    output.lines().find_map(|line| {
        let line = line.trim();
        let detail = line.strip_prefix("Failure [").or_else(|| {
            line.strip_prefix("adb: failed to install ")?
                .rsplit_once(": Failure [")
                .map(|(_, detail)| detail)
        })?;
        let detail = detail.strip_suffix(']')?;
        let code = detail.split(':').next()?.trim();
        if (code == "INSTALL_FAILED"
            || code.starts_with("INSTALL_FAILED_")
            || code.starts_with("INSTALL_PARSE_FAILED_"))
            && code
                .bytes()
                .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit() || b == b'_')
        {
            Some((code, detail))
        } else {
            None
        }
    })
}
fn connection_error(serial: &str, error: String) -> String {
    let lower = error.to_ascii_lowercase();
    if ["no route to host", "unreachable", "(10065)", "(10051)"]
        .iter()
        .any(|text| lower.contains(text))
    {
        format!("无法通过局域网到达 {serial}。请确认电视在线、IP 正确、电脑与电视在同一网络，并检查 VPN、防火墙和访客网络隔离。macOS 请在系统设置 → 隐私与安全性 → 本地网络中允许 pureTV。原始错误：{error}")
    } else if lower.contains("refused") || lower.contains("(10061)") {
        format!("{serial} 拒绝了 ADB 连接。请开启电视的网络调试，并使用电视显示的调试端口（不一定是 5555）。原始错误：{error}")
    } else if lower.contains("timed out")
        || lower.contains("timeout")
        || lower.contains("(10060)")
        || error.contains("超时")
    {
        format!("连接 {serial} 超时。请确认电视在线、地址和端口正确，并检查局域网、防火墙或网络隔离设置。原始错误：{error}")
    } else {
        error
    }
}
fn check_output(output: Output) -> Result<String, String> {
    let lower = output.text.to_ascii_lowercase();
    let failure = output.code != 0
        || lower.contains("failure [")
        || lower.lines().any(|l| {
            let l = l.trim();
            let exception_head = l.split(':').next().unwrap_or_default();
            let exception = l.contains(':')
                && exception_head.ends_with("exception")
                && exception_head
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'$'));
            exception
                || l.starts_with("exception occurred")
                || l.starts_with("error:")
                || l.starts_with("error ")
                || l.starts_with("unknown command")
                || l.starts_with("adb: error")
                || l.starts_with("failed to")
                || l.starts_with("cannot connect")
        });
    if failure {
        let mut seen = BTreeSet::new();
        let detail = output
            .text
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty() && seen.insert(*line))
            .collect::<Vec<_>>()
            .join("\n");
        Err(format!("ADB 操作失败：{}", parse::short(&detail, 500)))
    } else {
        Ok(output.text)
    }
}
fn validate_targets(values: Vec<String>) -> Result<Vec<String>, String> {
    if values.is_empty() || values.len() > 100 {
        return Err("每次请选择 1–100 个应用".into());
    }
    let mut seen = BTreeSet::new();
    let mut result = Vec::new();
    for value in values {
        if !parse::package(&value) {
            return Err("应用包名格式无效".into());
        }
        if seen.insert(value.clone()) {
            result.push(value);
        }
    }
    Ok(result)
}
fn validate_apk(value: &str) -> Result<PathBuf, String> {
    if value.len() > 4096 || value.contains('\0') {
        return Err("APK 路径无效".into());
    }
    let path = PathBuf::from(value);
    if !path.is_absolute()
        || !path
            .extension()
            .is_some_and(|s| s.eq_ignore_ascii_case("apk"))
    {
        return Err("请选择本地 APK 文件的完整路径（不支持 XAPK／APKS）".into());
    }
    let metadata = path.metadata().map_err(|_| "APK 文件不存在或无法访问")?;
    if !metadata.is_file() || metadata.len() == 0 || metadata.len() > 2 * 1024 * 1024 * 1024 {
        return Err("APK 必须是非空普通文件，且不超过 2 GiB".into());
    }
    path.canonicalize()
        .map_err(|_| "无法读取 APK 的完整路径".into())
}
fn read_saved(directory: &Path) -> Saved {
    for name in ["state.json", "state.backup.json"] {
        let path = directory.join(name);
        if !path
            .metadata()
            .is_ok_and(|m| m.is_file() && m.len() <= 1024 * 1024)
        {
            continue;
        }
        if let Ok(body) = fs::read(path) {
            if let Ok(mut saved) = serde_json::from_slice::<Saved>(&body) {
                if saved
                    .last_connection
                    .as_ref()
                    .is_some_and(|address| parse::endpoint(&address.host, address.port).is_err())
                {
                    saved.last_connection = None;
                }
                saved.history.truncate(LIMIT_HISTORY);
                saved
                    .homes
                    .retain(|h| h.key.len() <= 300 && parse::component(&h.component));
                saved.homes.truncate(8);
                for home in &mut saved.homes {
                    if let Some(component) = parse::normalize_component(&home.component) {
                        home.component = component;
                    }
                }
                saved
                    .enabled_states
                    .retain(|s| s.key.len() <= 300 && parse::package(&s.package) && s.state <= 4);
                saved.enabled_states.truncate(200);
                if saved.adb_path.as_ref().is_some_and(|p| p.len() > 4096) {
                    saved.adb_path = None;
                }
                return saved;
            }
        }
    }
    Saved::default()
}

#[cfg(test)]
mod tests;
