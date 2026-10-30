//! Native handoff for a verified Manager update. No webview paths or commands
//! enter this module: downloads and destination discovery are native-owned.
use crate::client_updates::Downloaded;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    ffi::OsString,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};

#[cfg(target_os = "macos")]
const APP_ID: &str = "com.ecojust.puretv.manager";
#[cfg(target_os = "macos")]
const APP_NAME: &str = "pureTV Manager.app";
const HELPER_FLAG: &str = "--apply-client-update";
const JOBS: &str = "client-update-install";
const MAX_PACKAGE: u64 = 512 * 1024 * 1024;

#[derive(Debug)]
pub struct Prepared {
    pub version: String,
    pub platform: String,
    pub method: &'static str,
    pub destination: String,
    directory: PathBuf,
    handed_off: AtomicBool,
}
impl Drop for Prepared {
    fn drop(&mut self) {
        discard(self);
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Plan {
    format: u8,
    version: String,
    platform: String,
    bytes: u64,
    sha256: String,
    original_executable: PathBuf,
    target: Option<PathBuf>,
    previous_version: Option<String>,
    staged_executable_sha256: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct InstallResult {
    pub version: String,
    pub success: bool,
    pub message: String,
}

fn check_cancel(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Acquire) {
        Err("客户端更新已取消，当前版本未更改".into())
    } else {
        Ok(())
    }
}

fn valid_version(version: &str) -> bool {
    let parts: Vec<_> = version.split('.').collect();
    parts.len() == 3
        && parts.iter().all(|part| {
            !part.is_empty()
                && part.len() <= 9
                && part.bytes().all(|b| b.is_ascii_digit())
                && (part.len() == 1 || !part.starts_with('0'))
        })
}

fn platform() -> &'static str {
    if cfg!(target_os = "windows") && cfg!(target_arch = "x86_64") {
        "windows-x64"
    } else if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        "macos-arm64"
    } else if cfg!(target_os = "macos") && cfg!(target_arch = "x86_64") {
        "macos-x64"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "x86_64") {
        "linux-x64"
    } else {
        "unsupported"
    }
}

fn extension(platform: &str) -> Result<&'static str, String> {
    match platform {
        "windows-x64" => Ok("exe"),
        "macos-arm64" | "macos-x64" => Ok("dmg"),
        "linux-x64" => Ok("deb"),
        _ => Err("当前平台暂不支持自动安装客户端更新".into()),
    }
}

fn helper_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "puretv-update-helper.exe"
    } else {
        "puretv-update-helper"
    }
}

fn hash_file(
    path: &Path,
    expected_bytes: Option<u64>,
    cancel: &AtomicBool,
) -> Result<String, String> {
    let meta = fs::symlink_metadata(path).map_err(|_| "无法读取客户端更新文件")?;
    if !meta.is_file() || meta.len() == 0 || meta.len() > MAX_PACKAGE {
        return Err("客户端更新文件大小或类型无效".into());
    }
    if expected_bytes.is_some_and(|size| size != meta.len()) {
        return Err("客户端更新文件大小已变化，请重新下载".into());
    }
    let mut file = File::open(path).map_err(|_| "无法读取客户端更新文件")?;
    let mut hash = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    let mut total = 0;
    loop {
        check_cancel(cancel)?;
        let n = file
            .read(&mut buffer)
            .map_err(|_| "读取客户端更新文件失败")?;
        if n == 0 {
            break;
        }
        total += n as u64;
        if total > MAX_PACKAGE {
            return Err("客户端更新文件过大".into());
        }
        hash.update(&buffer[..n]);
    }
    if total != meta.len() {
        return Err("客户端更新文件读取不完整".into());
    }
    Ok(format!("{:x}", hash.finalize()))
}

fn private_directory(path: &Path) -> Result<(), String> {
    fs::create_dir(path).map_err(|_| "无法创建客户端更新准备目录")?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o700))
            .map_err(|_| "无法保护客户端更新目录")?;
    }
    Ok(())
}

fn write_json(path: &Path, value: &impl Serialize) -> Result<(), String> {
    let bytes = serde_json::to_vec(value).map_err(|_| "无法生成客户端安装记录")?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|_| "无法保存客户端安装记录")?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        file.set_permissions(fs::Permissions::from_mode(0o600))
            .map_err(|_| "无法保护客户端安装记录")?;
    }
    file.write_all(&bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| "无法保存客户端安装记录".into())
}

// Bounded native commands; fixed executable names and separate arguments only.
// Reader channels prevent a descendant holding a pipe open from blocking exit.
fn run(command: &mut Command, timeout: Duration, cancel: &AtomicBool) -> Result<String, String> {
    check_cancel(cancel)?;
    let mut child = command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("无法启动客户端安装工具：{e}"))?;
    let (tx, rx) = std::sync::mpsc::channel();
    for mut pipe in [
        child
            .stdout
            .take()
            .map(|s| Box::new(s) as Box<dyn Read + Send>),
        child
            .stderr
            .take()
            .map(|s| Box::new(s) as Box<dyn Read + Send>),
    ]
    .into_iter()
    .flatten()
    {
        let tx = tx.clone();
        std::thread::spawn(move || {
            let mut bytes = Vec::new();
            let result = pipe.by_ref().take(65_537).read_to_end(&mut bytes);
            let _ = tx.send((result.is_ok(), bytes));
        });
    }
    drop(tx);
    let started = Instant::now();
    let status = loop {
        if cancel.load(Ordering::Acquire) || started.elapsed() > timeout {
            let _ = child.kill();
            let _ = child.wait();
            return Err(if cancel.load(Ordering::Acquire) {
                "客户端更新已取消，当前版本未更改"
            } else {
                "客户端安装工具超时，请重试"
            }
            .into());
        }
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) => std::thread::sleep(Duration::from_millis(25)),
            Err(error) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(format!("无法读取客户端安装结果：{error}"));
            }
        }
    };
    let mut text = String::new();
    for _ in 0..2 {
        let (ok, bytes) = rx
            .recv_timeout(Duration::from_secs(2))
            .map_err(|_| "客户端安装工具未关闭输出")?;
        if !ok || bytes.len() > 65_536 {
            return Err("客户端安装工具输出无效".into());
        }
        text.push_str(&String::from_utf8_lossy(&bytes));
    }
    if status.success() {
        Ok(text.trim().into())
    } else {
        Err(format!(
            "客户端安装工具执行失败：{}",
            text.chars().take(1200).collect::<String>()
        ))
    }
}

pub fn prepare(
    download: &Downloaded,
    data_dir: &Path,
    cancel: &AtomicBool,
) -> Result<Prepared, String> {
    let executable = std::env::current_exe().map_err(|_| "无法定位当前客户端")?;
    prepare_at(download, data_dir, cancel, &executable, &executable)
}

fn prepare_at(
    download: &Downloaded,
    data_dir: &Path,
    cancel: &AtomicBool,
    executable: &Path,
    helper_source: &Path,
) -> Result<Prepared, String> {
    check_cancel(cancel)?;
    if !valid_version(&download.version) || download.platform != platform() {
        return Err("客户端更新版本或平台不匹配".into());
    }
    if hash_file(&download.path, Some(download.bytes), cancel)? != download.sha256 {
        return Err("客户端更新文件校验失败，请重新下载".into());
    }
    let executable = executable
        .canonicalize()
        .map_err(|_| "无法定位当前客户端")?;
    let data = data_dir
        .canonicalize()
        .map_err(|_| "无法定位客户端数据目录")?;
    let jobs = data.join(JOBS);
    fs::create_dir_all(&jobs).map_err(|_| "无法创建客户端更新目录")?;
    let mut random = [0u8; 16];
    getrandom::fill(&mut random).map_err(|_| "无法创建客户端更新标识")?;
    let directory = jobs.join(
        random
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<String>(),
    );
    private_directory(&directory)?;
    let mut prepared = Prepared {
        version: download.version.clone(),
        platform: download.platform.clone(),
        method: "",
        destination: String::new(),
        directory,
        handed_off: AtomicBool::new(false),
    };
    let payload = prepared
        .directory
        .join(format!("payload.{}", extension(&download.platform)?));
    fs::copy(&download.path, &payload).map_err(|_| "无法准备客户端安装包")?;
    if hash_file(&payload, Some(download.bytes), cancel)? != download.sha256 {
        return Err("客户端安装包复制校验失败".into());
    }
    #[allow(unused_mut)] // macOS fills its verified destination and bundle identity.
    let mut plan = Plan {
        format: 1,
        version: download.version.clone(),
        platform: download.platform.clone(),
        bytes: download.bytes,
        sha256: download.sha256.clone(),
        original_executable: executable.clone(),
        target: None,
        previous_version: None,
        staged_executable_sha256: None,
    };
    #[cfg(target_os = "windows")]
    {
        verify_windows(&payload, &download.version, cancel)?;
        prepared.method = "windowsInstaller";
        prepared.destination = "Windows 安装版（便携版将安装为标准版）".into();
    }
    #[cfg(target_os = "macos")]
    {
        let target = installed_bundle(&executable)?;
        if plist(&target, "CFBundleIdentifier", cancel)? != APP_ID {
            return Err("当前 macOS 客户端标识不匹配".into());
        }
        plan.previous_version = Some(plist(&target, "CFBundleShortVersionString", cancel)?);
        let staged = prepare_macos(
            &payload,
            &prepared.directory,
            &download.version,
            &download.platform,
            cancel,
        )?;
        plan.staged_executable_sha256 = Some(hash_file(
            &staged.join("Contents/MacOS/puretv-desktop"),
            None,
            cancel,
        )?);
        plan.target = Some(target.clone());
        prepared.method = "macosBundle";
        prepared.destination = target.to_string_lossy().into_owned();
    }
    #[cfg(target_os = "linux")]
    {
        verify_deb(&payload, &download.version, cancel)?;
        if !Path::new("/usr/bin/pkexec").is_file() {
            return Err("此系统缺少图形授权工具，无法自动安装 DEB 更新".into());
        }
        prepared.method = "linuxDeb";
        prepared.destination = "系统 DEB 软件包".into();
    }
    check_cancel(cancel)?;
    fs::copy(helper_source, prepared.directory.join(helper_name()))
        .map_err(|_| "无法准备独立客户端安装工具")?;
    write_json(&prepared.directory.join("plan.json"), &plan)?;
    Ok(prepared)
}

pub fn discard(prepared: &Prepared) {
    if !prepared.handed_off.load(Ordering::Acquire) {
        #[cfg(target_os = "macos")]
        {
            let mount = prepared.directory.join("mount");
            if fs::read_dir(&mount).is_ok_and(|mut entries| entries.next().is_some())
                && run(
                    Command::new("/usr/bin/hdiutil").arg("detach").arg(&mount),
                    Duration::from_secs(30),
                    &AtomicBool::new(false),
                )
                .is_err()
            {
                return;
            }
        }
        let _ = fs::remove_dir_all(&prepared.directory);
    }
}

pub fn handoff(prepared: &Prepared) -> Result<(), String> {
    if prepared.handed_off.load(Ordering::Acquire) {
        return Err("客户端安装已开始".into());
    }
    let data_dir = prepared
        .directory
        .parent()
        .and_then(Path::parent)
        .ok_or("客户端安装目录无效")?;
    let mut child = Command::new(prepared.directory.join(helper_name()))
        .arg(HELPER_FLAG)
        .arg(prepared.directory.join("plan.json"))
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|_| "无法启动独立客户端安装工具")?;
    let deadline = Instant::now() + Duration::from_secs(8);
    loop {
        let status = match child.try_wait() {
            Ok(status) => status,
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("无法读取安装工具状态".into());
            }
        };
        if status.is_none() && prepared.directory.join("ready").is_file() {
            // The helper is still blocked by the parent's instance lock. Clear
            // the previous notification before the installer can relaunch us.
            if let Err(error) = fs::remove_file(data_dir.join("client-update-result.json")) {
                if error.kind() != std::io::ErrorKind::NotFound {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err("无法清理上次客户端更新通知，更新未开始".into());
                }
            }
            prepared.handed_off.store(true, Ordering::Release);
            return Ok(());
        }
        if status.is_some() || Instant::now() >= deadline {
            let _ = child.kill();
            let _ = child.wait();
            return Err("客户端安装工具未就绪，当前版本未更改".into());
        }
        std::thread::sleep(Duration::from_millis(25));
    }
}

pub fn read_result(data_dir: &Path) -> Result<Option<InstallResult>, String> {
    let path = data_dir.join("client-update-result.json");
    if !path.exists() {
        return Ok(None);
    }
    let meta = fs::symlink_metadata(&path).map_err(|_| "无法读取客户端更新结果")?;
    if !meta.is_file() || meta.len() > 8192 {
        return Err("客户端更新结果文件无效".into());
    }
    let bytes = fs::read(&path).map_err(|_| "无法读取客户端更新结果")?;
    let result = serde_json::from_slice(&bytes).map_err(|_| "客户端更新结果文件无效")?;
    fs::remove_file(path).map_err(|_| "无法确认客户端更新结果已读取")?;
    Ok(Some(result))
}

fn save_result(data_dir: &Path, result: &InstallResult) {
    // One consumable notification and one last-result receipt. The latter
    // survives a startup notification read and never accumulates history.
    for name in [
        "client-update-last-result.json",
        "client-update-result.json",
    ] {
        let temp = data_dir.join(format!("{name}.pending"));
        let _ = fs::remove_file(&temp);
        if write_json(&temp, result).is_ok() {
            let target = data_dir.join(name);
            if fs::rename(&temp, &target).is_err() {
                let _ = fs::remove_file(&target);
                let _ = fs::rename(temp, target);
            }
        }
    }
}

pub fn helper_entry(args: &[OsString]) -> Option<i32> {
    if args.get(1).is_none_or(|arg| arg != HELPER_FLAG) {
        return None;
    }
    let result = args
        .get(2)
        .filter(|_| args.len() == 3)
        .ok_or_else(|| "客户端安装交接参数无效".to_string())
        .and_then(|path| apply_plan(Path::new(path)));
    if let Err(error) = result {
        eprintln!("Client update: {error}");
        Some(1)
    } else {
        Some(0)
    }
}

fn apply_plan(path: &Path) -> Result<(), String> {
    let executable = std::env::current_exe()
        .and_then(|p| p.canonicalize())
        .map_err(|_| "无法定位独立安装工具")?;
    let directory = executable.parent().ok_or("客户端安装目录无效")?;
    if executable
        .file_name()
        .is_none_or(|name| name != helper_name())
        || directory
            .parent()
            .and_then(Path::file_name)
            .is_none_or(|name| name != JOBS)
        || path.canonicalize().ok().as_deref() != Some(directory.join("plan.json").as_path())
    {
        return Err("客户端安装交接路径无效".into());
    }
    let data_dir = directory
        .parent()
        .and_then(Path::parent)
        .ok_or("客户端安装目录无效")?;
    let meta = fs::symlink_metadata(path).map_err(|_| "客户端安装交接记录不存在")?;
    if !meta.is_file() || meta.len() > 16_384 {
        return Err("客户端安装交接记录无效".into());
    }
    let plan: Plan =
        serde_json::from_slice(&fs::read(path).map_err(|_| "无法读取客户端安装交接记录")?)
            .map_err(|_| "客户端安装交接记录无效")?;
    if plan.format != 1
        || plan.platform != platform()
        || !valid_version(&plan.version)
        || !plan.original_executable.is_absolute()
    {
        return Err("客户端安装交接信息无效".into());
    }
    let cancel = AtomicBool::new(false);
    let payload = directory.join(format!("payload.{}", extension(&plan.platform)?));
    if hash_file(&payload, Some(plan.bytes), &cancel)? != plan.sha256 {
        return Err("交接后的客户端安装包校验失败".into());
    }
    // Parent still owns this lock. A ready acknowledgement never authorizes
    // modifying its installation; replacement starts only after normal exit.
    let lock = OpenOptions::new()
        .read(true)
        .write(true)
        .open(data_dir.join("manager.lock"))
        .map_err(|_| "无法等待客户端安全退出")?;
    File::create(directory.join("ready")).map_err(|_| "无法确认客户端安装工具就绪")?;
    let deadline = Instant::now() + Duration::from_secs(120);
    loop {
        if lock.try_lock().is_ok() {
            break;
        }
        if Instant::now() >= deadline {
            return Err("当前客户端未退出，更新未安装".into());
        }
        std::thread::sleep(Duration::from_millis(50));
    }
    let installed: Result<(), String>;
    #[cfg(target_os = "windows")]
    {
        // /R starts the new Manager before NSIS exits; never retain its lock.
        drop(lock);
        installed = install_windows(&payload, &plan.version, &cancel);
    }
    #[cfg(target_os = "macos")]
    {
        let changed = install_macos(directory, &plan, &cancel);
        drop(lock);
        installed = changed.and_then(|change| finish_macos(change, &cancel));
    }
    #[cfg(target_os = "linux")]
    {
        installed = install_deb(&payload, &plan.version, &cancel);
        drop(lock);
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        drop(lock);
        installed = Err("当前平台暂不支持自动安装客户端更新".into());
    }
    let result = InstallResult {
        version: plan.version.clone(),
        success: installed.is_ok(),
        message: match &installed {
            Ok(()) => "客户端更新已安装".into(),
            Err(error) => format!("客户端更新未完成：{error}"),
        },
    };
    save_result(data_dir, &result);
    #[cfg(target_os = "macos")]
    {
        if installed.is_err() {
            if let (Some(target), Some(previous)) = (&plan.target, &plan.previous_version) {
                // A failed update/restore must never launch an unverified new
                // bundle. Only a verified original version is auto-reopened.
                if verify_bundle(target, previous, &plan.platform, &cancel).is_ok() {
                    let _ = Command::new("/usr/bin/open").arg("-n").arg(target).spawn();
                }
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        if !cfg!(target_os = "windows") || installed.is_err() {
            let _ = Command::new(&plan.original_executable).spawn();
        }
    }
    // Keep payload/result on failure so a retry or manual recovery is possible.
    if installed.is_ok() {
        let _ = fs::remove_dir_all(directory);
    }
    installed
}

#[cfg(target_os = "windows")]
fn powershell() -> Result<Command, String> {
    let root = std::env::var_os("SystemRoot").ok_or("无法定位 Windows 系统目录")?;
    let path = PathBuf::from(root).join("System32/WindowsPowerShell/v1.0/powershell.exe");
    if !path.is_file() {
        return Err("无法定位 Windows 安装验证工具".into());
    }
    let mut command = Command::new(path);
    command.args(["-NoProfile", "-NonInteractive", "-Command"]);
    Ok(command)
}

#[cfg(target_os = "windows")]
fn verify_windows(payload: &Path, version: &str, cancel: &AtomicBool) -> Result<(), String> {
    let mut command = powershell()?;
    command.arg("$ErrorActionPreference='Stop'; $v=[Diagnostics.FileVersionInfo]::GetVersionInfo($env:PURETV_UPDATE_PAYLOAD); if($v.ProductName -ne 'pureTV Manager' -or $v.ProductVersion -notin @($env:PURETV_UPDATE_VERSION,($env:PURETV_UPDATE_VERSION+'.0'))){throw 'Installer identity or version mismatch'}")
        .env("PURETV_UPDATE_PAYLOAD", payload).env("PURETV_UPDATE_VERSION", version);
    run(&mut command, Duration::from_secs(30), cancel).map(|_| ())
}

#[cfg(target_os = "windows")]
fn install_windows(payload: &Path, version: &str, cancel: &AtomicBool) -> Result<(), String> {
    verify_windows(payload, version, cancel)?;
    // NSIS /R may pass inherited handles to its restarted app. No output pipe
    // may be used to decide whether the installer itself finished.
    let status = Command::new(payload)
        .args(["/P", "/UPDATE", "/R"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|e| format!("无法启动 Windows 客户端安装程序：{e}"))?;
    if !status.success() {
        return Err("Windows 客户端安装程序未确认成功".into());
    }
    let mut command = powershell()?;
    command.arg("$ErrorActionPreference='Stop'; $p=Get-ItemProperty -LiteralPath 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\pureTV Manager'; if($p.DisplayVersion -ne $env:PURETV_UPDATE_VERSION){throw 'Installed version was not confirmed'}")
        .env("PURETV_UPDATE_VERSION", version);
    run(&mut command, Duration::from_secs(30), cancel).map(|_| ())
}

#[cfg(target_os = "macos")]
fn installed_bundle(executable: &Path) -> Result<PathBuf, String> {
    let bundle = executable
        .ancestors()
        .find(|p| p.file_name().is_some_and(|n| n == APP_NAME))
        .ok_or("请从已安装的 pureTV Manager.app 检查更新")?;
    if bundle.starts_with("/Volumes")
        || bundle
            .components()
            .any(|p| p.as_os_str() == "AppTranslocation")
    {
        return Err("请先将 pureTV Manager 移入 Applications，再进行自动更新".into());
    }
    if executable != bundle.join("Contents/MacOS/puretv-desktop")
        || fs::symlink_metadata(bundle)
            .map_err(|_| "无法读取当前客户端")?
            .is_symlink()
    {
        return Err("当前客户端安装位置无效".into());
    }
    Ok(bundle.to_path_buf())
}

#[cfg(target_os = "macos")]
fn plist(bundle: &Path, key: &str, cancel: &AtomicBool) -> Result<String, String> {
    run(
        Command::new("/usr/libexec/PlistBuddy")
            .args(["-c", &format!("Print :{key}")])
            .arg(bundle.join("Contents/Info.plist")),
        Duration::from_secs(20),
        cancel,
    )
}

#[cfg(target_os = "macos")]
fn verify_bundle(
    bundle: &Path,
    version: &str,
    platform: &str,
    cancel: &AtomicBool,
) -> Result<(), String> {
    if !fs::symlink_metadata(bundle).is_ok_and(|m| m.is_dir() && !m.is_symlink())
        || plist(bundle, "CFBundleIdentifier", cancel)? != APP_ID
        || plist(bundle, "CFBundleShortVersionString", cancel)? != version
        || plist(bundle, "CFBundleExecutable", cancel)? != "puretv-desktop"
    {
        return Err("macOS 更新包的应用标识或版本不匹配".into());
    }
    let architecture = if platform == "macos-arm64" {
        "arm64"
    } else {
        "x86_64"
    };
    let arch = run(
        Command::new("/usr/bin/lipo")
            .arg("-archs")
            .arg(bundle.join("Contents/MacOS/puretv-desktop")),
        Duration::from_secs(20),
        cancel,
    )?;
    if !arch.split_whitespace().any(|s| s == architecture) {
        return Err("macOS 更新包的处理器架构不匹配".into());
    }
    run(
        Command::new("/usr/bin/codesign")
            .args(["--verify", "--deep", "--strict"])
            .arg(bundle),
        Duration::from_secs(60),
        cancel,
    )
    .map(|_| ())
}

#[cfg(target_os = "macos")]
fn prepare_macos(
    payload: &Path,
    directory: &Path,
    version: &str,
    platform: &str,
    cancel: &AtomicBool,
) -> Result<PathBuf, String> {
    run(
        Command::new("/usr/bin/hdiutil").arg("verify").arg(payload),
        Duration::from_secs(90),
        cancel,
    )?;
    let mount = directory.join("mount");
    fs::create_dir(&mount).map_err(|_| "无法创建更新映像挂载目录")?;
    if let Err(error) = run(
        Command::new("/usr/bin/hdiutil")
            .args([
                "attach",
                "-readonly",
                "-nobrowse",
                "-noautoopen",
                "-mountpoint",
            ])
            .arg(&mount)
            .arg(payload),
        Duration::from_secs(90),
        cancel,
    ) {
        let _ = run(
            Command::new("/usr/bin/hdiutil").arg("detach").arg(&mount),
            Duration::from_secs(30),
            &AtomicBool::new(false),
        );
        return Err(error);
    }
    let result = (|| {
        let source = mount.join(APP_NAME);
        verify_bundle(&source, version, platform, cancel)?;
        let staged = directory.join(APP_NAME);
        run(
            Command::new("/usr/bin/ditto").arg(&source).arg(&staged),
            Duration::from_secs(90),
            cancel,
        )?;
        verify_bundle(&staged, version, platform, cancel)?;
        Ok(staged)
    })();
    let detached = run(
        Command::new("/usr/bin/hdiutil").arg("detach").arg(&mount),
        Duration::from_secs(30),
        &AtomicBool::new(false),
    );
    if result.is_ok() {
        detached?;
    }
    result
}

#[cfg(any(target_os = "macos", test))]
fn replace_bundle(staged: &Path, target: &Path, backup: &Path) -> Result<(), String> {
    if backup.exists() {
        return Err("客户端备份位置已存在，未替换当前版本".into());
    }
    fs::rename(target, backup).map_err(|e| format!("无法备份当前客户端：{e}"))?;
    if let Err(error) = fs::rename(staged, target) {
        return match fs::rename(backup, target) {
            Ok(()) => Err(format!("客户端替换失败，已恢复原版本：{error}")),
            Err(restore) => Err(format!(
                "客户端替换失败，原版本保留在 {}；恢复失败：{restore}",
                backup.display()
            )),
        };
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn shell_quote(path: &Path) -> Result<String, String> {
    let value = path.to_str().ok_or("客户端安装路径无法表示")?;
    Ok(format!("'{}'", value.replace('\'', "'\\''")))
}

#[cfg(target_os = "macos")]
fn install_macos(directory: &Path, plan: &Plan, cancel: &AtomicBool) -> Result<MacChange, String> {
    let target = plan.target.as_ref().ok_or("macOS 更新目标无效")?;
    if !target.is_absolute()
        || target.file_name().is_none_or(|n| n != APP_NAME)
        || fs::symlink_metadata(target)
            .map_err(|_| "当前客户端不存在")?
            .is_symlink()
    {
        return Err("macOS 更新目标无效".into());
    }
    let incoming = directory.join(APP_NAME);
    verify_bundle(&incoming, &plan.version, &plan.platform, cancel)?;
    if plan.staged_executable_sha256.as_deref()
        != Some(&hash_file(
            &incoming.join("Contents/MacOS/puretv-desktop"),
            None,
            cancel,
        )?)
    {
        return Err("macOS 更新准备文件已变化".into());
    }
    let parent = target.parent().ok_or("macOS 更新目录无效")?;
    let suffix = directory
        .file_name()
        .and_then(|s| s.to_str())
        .ok_or("客户端更新标识无效")?;
    let staged = parent.join(format!(".puretv-new-{suffix}.app"));
    let backup = parent.join(format!(".puretv-backup-{suffix}.app"));
    let old_version = plan
        .previous_version
        .clone()
        .filter(|s| valid_version(s))
        .ok_or("当前 macOS 客户端版本无效")?;
    verify_bundle(target, &old_version, &plan.platform, cancel)?;
    let mut privileged = false;
    if staged.exists() || backup.exists() {
        return Err("客户端更新临时位置已存在".into());
    }
    let direct = run(
        Command::new("/usr/bin/ditto").arg(&incoming).arg(&staged),
        Duration::from_secs(90),
        cancel,
    )
    .and_then(|_| verify_bundle(&staged, &plan.version, &plan.platform, cancel))
    .and_then(|_| replace_bundle(&staged, target, &backup));
    if direct.is_err() {
        // Authorize only the fixed copy/rename sequence, preserving quarantine.
        // If a direct replacement already made a backup, do not run it twice.
        if backup.exists() {
            return Err(direct.unwrap_err());
        }
        let _ = fs::remove_dir_all(&staged);
        privileged = true;
        let script = format!("set -eu; test -d {target}; test ! -L {target}; test ! -e {backup}; test ! -e {staged}; /usr/bin/ditto {incoming} {staged}; /usr/bin/codesign --verify --deep --strict {staged}; /bin/mv {target} {backup}; if /bin/mv {staged} {target}; then exit 0; else /bin/mv {backup} {target}; exit 1; fi", target=shell_quote(target)?, backup=shell_quote(&backup)?, staged=shell_quote(&staged)?, incoming=shell_quote(&incoming)?);
        let apple =
            "on run argv\ndo shell script (item 1 of argv) with administrator privileges\nend run";
        let authorized = run(
            Command::new("/usr/bin/osascript").args(["-e", apple, &script]),
            Duration::from_secs(300),
            cancel,
        );
        if let Err(error) = authorized {
            if !backup.exists()
                && verify_bundle(target, &plan.version, &plan.platform, cancel).is_err()
            {
                return Err(error);
            }
        }
    }
    let change = MacChange {
        target: target.clone(),
        backup,
        staged,
        old_version,
        platform: plan.platform.clone(),
        privileged,
    };
    if let Err(error) = verify_bundle(target, &plan.version, &plan.platform, cancel) {
        return match rollback_macos(&change, cancel) {
            Ok(()) => Err(format!("新客户端校验失败，已恢复原版本：{error}")),
            Err(restore) => Err(format!("新客户端校验失败：{error}；{restore}")),
        };
    }
    Ok(change)
}

#[cfg(target_os = "macos")]
struct MacChange {
    target: PathBuf,
    backup: PathBuf,
    staged: PathBuf,
    old_version: String,
    platform: String,
    privileged: bool,
}

#[cfg(any(target_os = "macos", test))]
fn restore_with_authorization(
    target: &Path,
    backup: &Path,
    failed: &Path,
    privileged: bool,
    authorize: impl FnOnce() -> Result<(), String>,
) -> Result<(), String> {
    if !backup.is_dir() || (target.exists() && failed.exists()) {
        return Err(format!(
            "无法自动恢复，原版本备份保留在 {}",
            backup.display()
        ));
    }
    let direct = if privileged {
        Err("需要系统授权恢复客户端".into())
    } else if !target.exists() {
        fs::rename(backup, target).map_err(|e| e.to_string())
    } else {
        fs::rename(target, failed)
            .map_err(|e| e.to_string())
            .and_then(|_| {
                if let Err(error) = fs::rename(backup, target) {
                    if fs::rename(failed, target).is_err() {
                        return Err(format!("恢复失败，原版本备份保留在 {}", backup.display()));
                    }
                    Err(error.to_string())
                } else {
                    Ok(())
                }
            })
    };
    if direct.is_ok() {
        return Ok(());
    }
    // Only authorize a known, intact state. Never repeat moves after an
    // ambiguous partial restore or overwrite an existing recovery directory.
    if !backup.is_dir() || (target.exists() && (!target.is_dir() || failed.exists())) {
        return Err(format!(
            "无法自动恢复，原版本备份保留在 {}",
            backup.display()
        ));
    }
    authorize().map_err(|error| {
        format!(
            "无法自动恢复，原版本备份保留在 {}：{error}",
            backup.display()
        )
    })
}

#[cfg(target_os = "macos")]
fn rollback_macos(change: &MacChange, cancel: &AtomicBool) -> Result<(), String> {
    verify_bundle(
        &change.backup,
        &change.old_version,
        &change.platform,
        cancel,
    )
    .map_err(|error| format!("无法核对原版本备份 {}：{error}", change.backup.display()))?;
    let restore = restore_with_authorization(
        &change.target,
        &change.backup,
        &change.staged,
        change.privileged,
        || {
            let script = format!("set -eu; test -d {backup}; test ! -L {target}; moved=0; if test -e {target}; then test -d {target}; test ! -e {failed}; /bin/mv {target} {failed}; moved=1; fi; if /bin/mv {backup} {target}; then exit 0; else if test \"$moved\" = 1; then /bin/mv {failed} {target}; fi; exit 1; fi", target=shell_quote(&change.target)?,backup=shell_quote(&change.backup)?,failed=shell_quote(&change.staged)?);
            run(Command::new("/usr/bin/osascript").args(["-e", "on run argv\ndo shell script (item 1 of argv) with administrator privileges\nend run", &script]), Duration::from_secs(300), cancel).map(|_| ())
        },
    );
    let verified = verify_bundle(
        &change.target,
        &change.old_version,
        &change.platform,
        cancel,
    );
    if verified.is_ok() {
        let _ = fs::remove_dir_all(&change.staged);
        return Ok(());
    }
    restore?;
    Err(format!(
        "系统未确认恢复原版本，备份位置为 {}",
        change.backup.display()
    ))
}

#[cfg(any(target_os = "macos", test))]
fn launch_or_restore(
    backup: &Path,
    launch: impl FnOnce() -> Result<(), String>,
    restore: impl FnOnce() -> Result<(), String>,
) -> Result<(), String> {
    if let Err(error) = launch() {
        if let Err(restore_error) = restore() {
            return Err(format!("新客户端未能启动：{error}；{restore_error}"));
        }
        return Err(format!("新客户端未能启动，已恢复原版本：{error}"));
    }
    let _ = fs::remove_dir_all(backup);
    Ok(())
}

#[cfg(target_os = "macos")]
fn finish_macos(change: MacChange, cancel: &AtomicBool) -> Result<(), String> {
    launch_or_restore(
        &change.backup,
        || {
            run(
                Command::new("/usr/bin/open")
                    .args(["-n"])
                    .arg(&change.target),
                Duration::from_secs(30),
                cancel,
            )
            .map(|_| ())
        },
        || rollback_macos(&change, cancel),
    )
}

#[cfg(target_os = "linux")]
fn verify_deb(payload: &Path, version: &str, cancel: &AtomicBool) -> Result<(), String> {
    let package = run(
        Command::new("/usr/bin/dpkg-deb")
            .args(["--field"])
            .arg(payload)
            .arg("Package"),
        Duration::from_secs(30),
        cancel,
    )?;
    let actual = run(
        Command::new("/usr/bin/dpkg-deb")
            .args(["--field"])
            .arg(payload)
            .arg("Version"),
        Duration::from_secs(30),
        cancel,
    )?;
    let arch = run(
        Command::new("/usr/bin/dpkg-deb")
            .args(["--field"])
            .arg(payload)
            .arg("Architecture"),
        Duration::from_secs(30),
        cancel,
    )?;
    if package != "pure-tv-manager" || actual != version || arch != "amd64" {
        return Err("DEB 更新包的应用标识、版本或架构不匹配".into());
    }
    Ok(())
}

#[cfg(target_os = "linux")]
fn install_deb(payload: &Path, version: &str, cancel: &AtomicBool) -> Result<(), String> {
    verify_deb(payload, version, cancel)?;
    run(
        Command::new("/usr/bin/pkexec")
            .args(["/usr/bin/dpkg", "--install"])
            .arg(payload),
        Duration::from_secs(600),
        cancel,
    )?;
    let actual = run(
        Command::new("/usr/bin/dpkg-query").args([
            "--show",
            "--showformat=${Version} ${Status}",
            "pure-tv-manager",
        ]),
        Duration::from_secs(30),
        cancel,
    )?;
    if actual != format!("{version} install ok installed") {
        return Err("系统未确认客户端 DEB 更新成功".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!(
                "puretv-install-test-{}-{}",
                std::process::id(),
                SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            fs::create_dir(&path).unwrap();
            Self(path)
        }
    }
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn bundle(path: &Path, data: &str) {
        fs::create_dir(path).unwrap();
        fs::write(path.join("marker"), data).unwrap();
    }

    #[test]
    fn package_integrity_rejects_changed_size_hash_and_cancellation() {
        let root = Temp::new();
        let path = root.0.join("payload");
        fs::write(&path, b"fixture").unwrap();
        assert_eq!(
            hash_file(&path, Some(7), &AtomicBool::new(false)).unwrap(),
            format!("{:x}", Sha256::digest(b"fixture"))
        );
        assert!(hash_file(&path, Some(8), &AtomicBool::new(false)).is_err());
        assert!(hash_file(&path, None, &AtomicBool::new(true)).is_err());
        #[cfg(unix)]
        {
            let link = root.0.join("link");
            std::os::unix::fs::symlink(&path, &link).unwrap();
            assert!(hash_file(&link, None, &AtomicBool::new(false)).is_err());
        }
    }

    #[test]
    fn versions_and_platforms_never_become_shell_arguments() {
        assert!(valid_version("0.4.11"));
        for version in [
            "",
            "1.2",
            "1.2.3.4",
            "1.2.03",
            "1.2.3;open",
            "1.2.3\n",
            "../1.2.3",
        ] {
            assert!(!valid_version(version));
        }
        assert!(extension("other;cmd").is_err());
    }

    #[test]
    fn replacement_failure_restores_the_original_bundle() {
        let root = Temp::new();
        let target = root.0.join("current.app");
        let backup = root.0.join("backup.app");
        bundle(&target, "old");
        let error = replace_bundle(&root.0.join("missing.app"), &target, &backup).unwrap_err();
        assert!(error.contains("已恢复原版本"));
        assert_eq!(fs::read_to_string(target.join("marker")).unwrap(), "old");
        assert!(!backup.exists());
    }

    #[test]
    fn a_preexisting_backup_is_never_overwritten() {
        let root = Temp::new();
        let target = root.0.join("current.app");
        let backup = root.0.join("backup.app");
        let staged = root.0.join("new.app");
        bundle(&target, "old");
        bundle(&backup, "previous");
        bundle(&staged, "new");
        assert!(replace_bundle(&staged, &target, &backup).is_err());
        assert_eq!(fs::read_to_string(target.join("marker")).unwrap(), "old");
        assert_eq!(
            fs::read_to_string(backup.join("marker")).unwrap(),
            "previous"
        );
    }

    #[test]
    fn launch_failure_rolls_back_and_success_keeps_the_new_bundle() {
        let root = Temp::new();
        let target = root.0.join("current.app");
        let backup = root.0.join("backup.app");
        let failed = root.0.join("failed.app");
        bundle(&target, "new");
        bundle(&backup, "old");
        assert!(launch_or_restore(
            &backup,
            || Err("fixture launch failure".into()),
            || restore_with_authorization(&target, &backup, &failed, false, || panic!(
                "Writable fixture does not need authorization"
            ))
        )
        .is_err());
        assert_eq!(fs::read_to_string(target.join("marker")).unwrap(), "old");
        assert!(!backup.exists());
        fs::remove_dir_all(&failed).unwrap();
        fs::rename(&target, &backup).unwrap();
        bundle(&target, "new");
        launch_or_restore(
            &backup,
            || Ok(()),
            || panic!("A successful launch must not roll back"),
        )
        .unwrap();
        assert_eq!(fs::read_to_string(target.join("marker")).unwrap(), "new");
        assert!(!backup.exists());
    }

    #[test]
    fn privileged_restore_uses_authorization_and_denial_preserves_both_versions() {
        let root = Temp::new();
        let target = root.0.join("current.app");
        let backup = root.0.join("backup.app");
        let failed = root.0.join("failed.app");
        bundle(&target, "new");
        bundle(&backup, "old");
        assert!(
            restore_with_authorization(&target, &backup, &failed, true, || Err(
                "authorization cancelled".into()
            ))
            .is_err()
        );
        assert_eq!(fs::read_to_string(target.join("marker")).unwrap(), "new");
        assert_eq!(fs::read_to_string(backup.join("marker")).unwrap(), "old");
        assert!(!failed.exists());
        let called = AtomicBool::new(false);
        restore_with_authorization(&target, &backup, &failed, true, || {
            called.store(true, Ordering::SeqCst);
            fs::rename(&target, &failed).unwrap();
            fs::rename(&backup, &target).unwrap();
            Ok(())
        })
        .unwrap();
        assert!(called.load(Ordering::SeqCst));
        assert_eq!(fs::read_to_string(target.join("marker")).unwrap(), "old");
        assert_eq!(fs::read_to_string(failed.join("marker")).unwrap(), "new");
    }

    #[test]
    fn abandoned_preparation_is_cleaned_without_touching_other_files() {
        let root = Temp::new();
        let job = root.0.join("job");
        fs::create_dir(&job).unwrap();
        fs::write(job.join("payload"), b"fixture").unwrap();
        fs::write(root.0.join("keep"), b"keep").unwrap();
        let prepared = Prepared {
            version: "0.4.11".into(),
            platform: platform().into(),
            method: "test",
            destination: "test".into(),
            directory: job.clone(),
            handed_off: AtomicBool::new(false),
        };
        drop(prepared);
        assert!(!job.exists());
        assert!(root.0.join("keep").exists());
    }

    #[test]
    fn handoff_failure_does_not_mark_a_preparation_as_dispatched() {
        let root = Temp::new();
        let prepared = Prepared {
            version: "0.4.11".into(),
            platform: platform().into(),
            method: "test",
            destination: "test".into(),
            directory: root.0.join("missing-helper"),
            handed_off: AtomicBool::new(false),
        };
        assert!(handoff(&prepared).is_err());
        assert!(!prepared.handed_off.load(Ordering::Acquire));
    }

    #[test]
    fn update_result_is_bounded_and_consumed_once() {
        let root = Temp::new();
        let result = InstallResult {
            version: "0.4.11".into(),
            success: true,
            message: "fixture".into(),
        };
        save_result(&root.0, &result);
        assert!(read_result(&root.0).unwrap().unwrap().success);
        assert!(read_result(&root.0).unwrap().is_none());
        let receipt = root.0.join("client-update-last-result.json");
        let saved: InstallResult = serde_json::from_slice(&fs::read(&receipt).unwrap()).unwrap();
        assert_eq!(saved.version, "0.4.11");
        let updated = InstallResult {
            version: "0.4.12".into(),
            ..result
        };
        save_result(&root.0, &updated);
        let saved: InstallResult = serde_json::from_slice(&fs::read(&receipt).unwrap()).unwrap();
        assert_eq!(saved.version, "0.4.12");
        assert_eq!(read_result(&root.0).unwrap().unwrap().version, "0.4.12");
        fs::write(root.0.join("client-update-result.json"), vec![b'x'; 8193]).unwrap();
        assert!(read_result(&root.0).is_err());
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn installation_shell_quotes_are_single_literal_arguments() {
        let path = Path::new("/tmp/one 'two' $(touch nope) `x`\n.app");
        let quoted = shell_quote(path).unwrap();
        let mut command = Command::new("/bin/sh");
        command.args(["-c", &format!("printf '%s' {quoted}")]);
        assert_eq!(
            run(
                &mut command,
                Duration::from_secs(5),
                &AtomicBool::new(false)
            )
            .unwrap(),
            path.to_str().unwrap()
        );
    }

    // Runs after CI has built the real installer. Only this test can override
    // the current installation/helper source; product commands cannot do so.
    #[test]
    #[ignore = "requires an actual current-platform release package and isolated installation"]
    fn native_update_package_preparation() {
        let payload =
            PathBuf::from(std::env::var_os("PURETV_TEST_UPDATE_PACKAGE").expect("package"));
        let executable = PathBuf::from(
            std::env::var_os("PURETV_TEST_UPDATE_EXECUTABLE").expect("current executable"),
        );
        let helper = PathBuf::from(
            std::env::var_os("PURETV_TEST_UPDATE_HELPER").expect("new helper executable"),
        );
        let data = PathBuf::from(
            std::env::var_os("PURETV_TEST_UPDATE_DATA_DIR").expect("isolated data directory"),
        );
        let output = PathBuf::from(
            std::env::var_os("PURETV_TEST_UPDATE_PLAN_OUTPUT").expect("output manifest"),
        );
        let version = std::env::var("PURETV_TEST_UPDATE_VERSION")
            .unwrap_or_else(|_| env!("CARGO_PKG_VERSION").into());
        assert!(data.is_dir() && executable.is_file() && helper.is_file());
        let cancel = AtomicBool::new(false);
        #[cfg(not(target_os = "linux"))]
        let download = Downloaded {
            path: payload.clone(),
            version: version.clone(),
            platform: platform().into(),
            file_name: payload.file_name().unwrap().to_string_lossy().into_owned(),
            bytes: fs::metadata(&payload).unwrap().len(),
            blob_sha: "0".repeat(40),
            sha256: hash_file(&payload, None, &cancel).unwrap(),
            revision: "0".repeat(40),
        };
        #[cfg(target_os = "linux")]
        {
            verify_deb(&payload, &version, &cancel).unwrap();
            fs::write(output, serde_json::to_vec(&serde_json::json!({"metadataOnly":true,"version":version,"platform":platform()})).unwrap()).unwrap();
        }
        #[cfg(not(target_os = "linux"))]
        {
            let prepared = prepare_at(&download, &data, &cancel, &executable, &helper).unwrap();
            let manifest = serde_json::json!({"planPath":prepared.directory.join("plan.json"),"helperPath":prepared.directory.join(helper_name()),"readyPath":prepared.directory.join("ready"),"resultPath":data.join("client-update-last-result.json"),"dataDir":data,"method":prepared.method,"destination":prepared.destination,"version":version});
            fs::write(output, serde_json::to_vec(&manifest).unwrap()).unwrap();
            prepared.handed_off.store(true, Ordering::Release); // Retain for the external CI helper process.
        }
    }
}
