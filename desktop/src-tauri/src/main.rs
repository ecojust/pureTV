#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod launcher_covers;
mod market;
mod mcp;
mod platform_tools;
mod ui_preferences;

use puretv_core::{LauncherRequest, Manager as TvManager, Request, Snapshot};
use serde::Serialize;
use serde_json::{json, Value};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Clone)]
struct Bridge {
    closing: Arc<AtomicBool>,
    manager: Arc<Mutex<TvManager>>,
    cancel: Arc<AtomicBool>,
    running: Arc<AtomicBool>,
    snapshot: Arc<Mutex<Snapshot>>,
    progress: Arc<Mutex<Option<platform_tools::Progress>>>,
    market_progress: Arc<Mutex<Option<market::Progress>>>,
}

// Keep the shared operation reservation alive even if a command task exits early.
struct OperationGuard(Arc<AtomicBool>);
impl Drop for OperationGuard {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

fn begin_market_operation(bridge: &Bridge) -> Result<OperationGuard, String> {
    if bridge.closing.load(Ordering::Acquire) {
        return Err("管理器正在退出".into());
    }
    if bridge
        .running
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("已有操作正在执行，请等待完成或取消".into());
    }
    let guard = OperationGuard(bridge.running.clone());
    bridge.cancel.store(false, Ordering::Release);
    if bridge.closing.load(Ordering::Acquire) {
        bridge.cancel.store(true, Ordering::Release);
        return Err("管理器正在退出".into());
    }
    *bridge.progress.lock().map_err(|_| "进度不可用")? = None;
    *bridge
        .market_progress
        .lock()
        .map_err(|_| "市场进度不可用")? = None;
    Ok(guard)
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct MarketResult {
    operation: &'static str,
    download: market::Download,
    #[serde(skip_serializing_if = "Option::is_none")]
    snapshot: Option<Snapshot>,
    installed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Default)]
struct Shutdown {
    started: Arc<AtomicBool>,
    complete: AtomicBool,
}
// Returns true while shutdown is pending; callers then prevent the default exit.
fn request_shutdown(app: &tauri::AppHandle) -> bool {
    let Some(state) = app.try_state::<Arc<Shutdown>>() else {
        return false;
    };
    let shutdown = state.inner().clone();
    if shutdown.complete.load(Ordering::Acquire) {
        return false;
    }
    let Some(state) = app.try_state::<Bridge>() else {
        return false;
    };
    let bridge = state.inner().clone();
    if shutdown
        .started
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_ok()
    {
        bridge.cancel.store(true, Ordering::Release);
        for window in app.webview_windows().values() {
            let _ = window.hide();
        }
        let app = app.clone();
        tauri::async_runtime::spawn_blocking(move || {
            // Market downloads do not hold the ADB manager mutex. Let their
            // cancellation remove temporary files before terminating the process.
            if !wait_for_operation(&bridge.running, std::time::Duration::from_secs(30)) {
                eprintln!("Manager shutdown: operation cancellation timed out");
            }
            let result = bridge
                .manager
                .lock()
                .map_err(|_| "ADB shutdown state unavailable".to_string())
                .and_then(|mut manager| {
                    let result = manager.shutdown_adb();
                    if let Ok(mut cache) = bridge.snapshot.lock() {
                        *cache = manager.snapshot();
                    }
                    result
                });
            if let Err(error) = result {
                eprintln!("ADB shutdown: {error}");
            }
            shutdown.complete.store(true, Ordering::Release);
            app.exit(0);
        });
    }
    true
}

fn wait_for_operation(running: &AtomicBool, timeout: std::time::Duration) -> bool {
    let deadline = std::time::Instant::now() + timeout;
    while running.load(Ordering::Acquire) {
        if std::time::Instant::now() >= deadline {
            return false;
        }
        std::thread::sleep(std::time::Duration::from_millis(25));
    }
    true
}

#[tauri::command]
async fn execute(request: Request, bridge: tauri::State<'_, Bridge>) -> Result<Snapshot, String> {
    if bridge.closing.load(Ordering::Acquire) {
        return Err("管理器正在退出".into());
    }
    if bridge
        .running
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("已有操作正在执行，请等待完成或取消".into());
    }
    bridge.cancel.store(false, Ordering::Release);
    if bridge.closing.load(Ordering::Acquire) {
        bridge.cancel.store(true, Ordering::Release);
        bridge.running.store(false, Ordering::Release);
        return Err("管理器正在退出".into());
    }
    let closing = bridge.closing.clone();
    let manager = bridge.manager.clone();
    let cache = bridge.snapshot.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        let mut manager = manager
            .lock()
            .map_err(|_| "管理状态不可用，请重新打开程序".to_string())?;
        if closing.load(Ordering::Acquire) {
            return Err("管理器正在退出".into());
        }
        let result = manager.execute(request);
        *cache.lock().map_err(|_| "状态缓存不可用")? = manager.snapshot();
        result
    })
    .await;
    bridge.running.store(false, Ordering::Release);
    result.map_err(|_| "操作任务异常结束，请重新扫描设备状态".to_string())?
}

#[tauri::command]
fn get_local_network() -> puretv_core::LocalNetwork {
    puretv_core::read_local_network()
}

#[tauri::command]
fn get_interface_preferences(app: tauri::AppHandle) -> Result<ui_preferences::Preferences, String> {
    app.state::<ui_preferences::Settings>().get()
}
#[tauri::command]
fn set_interface_preferences(
    preferences: Value,
    only_if_unset: Option<bool>,
    app: tauri::AppHandle,
) -> Result<ui_preferences::Preferences, String> {
    let settings = app.state::<ui_preferences::Settings>();
    let value = if only_if_unset == Some(true) {
        settings.seed(preferences)?
    } else {
        settings.set(preferences)?
    };
    let _ = app.emit("interface-preferences", &value);
    Ok(value)
}
fn dialog_text(app: &tauri::AppHandle, zh: &str, tw: &str, en: &str) -> String {
    app.state::<ui_preferences::Settings>().text(zh, tw, en)
}

#[tauri::command]
fn get_launcher_covers(app: tauri::AppHandle) -> Result<Value, String> {
    launcher_covers::covers(&app.path().app_data_dir().map_err(|_| "无法定位数据目录")?)
}
#[tauri::command]
async fn choose_launcher_cover(
    key: String,
    path: Option<String>,
    apk_path: Option<String>,
    remove: Option<bool>,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
        if remove == Some(true) {
            return launcher_covers::set(&directory, &key, None);
        }
        if let Some(apk) = apk_path {
            let path = launcher_covers::sidecar_path(std::path::Path::new(&apk))
                .ok_or("未找到有效的 thumb 图片")?;
            return launcher_covers::set(&directory, &key, Some(&path));
        }
        let path = match path {
            Some(path) => std::path::PathBuf::from(path),
            None => {
                let Some(file) = app
                    .dialog()
                    .file()
                    .set_title(dialog_text(
                        &app,
                        "选择启动器背景图",
                        "選擇啟動器背景圖",
                        "Choose launcher background",
                    ))
                    .add_filter("封面图片", &["png", "jpg", "jpeg", "webp"])
                    .blocking_pick_file()
                else {
                    return launcher_covers::covers(&directory);
                };
                file.into_path().map_err(|_| "请选择本地图片")?
            }
        };
        launcher_covers::set(&directory, &key, Some(&path))
    })
    .await
    .map_err(|_| "封面任务异常结束".to_string())?
}
#[tauri::command]
async fn choose_launcher_apks(app: tauri::AppHandle) -> Result<Value, String> {
    tauri::async_runtime::spawn_blocking(move || {
        Ok(json!(pick_apks(&app)?
            .into_iter()
            .map(|path| {
                let apk = std::path::Path::new(&path);
                let background = launcher_covers::apk_home_background(apk);
                json!({
                    "cover": launcher_covers::sidecar(apk),
                    "homeBackground": background.as_ref().and_then(|value| value.image.as_deref()),
                    "homeBackgroundColor": background.as_ref().map(|value| value.color.as_str()),
                    "path": path
                })
            })
            .collect::<Vec<_>>()))
    })
    .await
    .map_err(|_| "无法读取启动器 APK".to_string())?
}

#[tauri::command]
async fn launcher_execute(
    request: LauncherRequest,
    bridge: tauri::State<'_, Bridge>,
) -> Result<Value, String> {
    if bridge
        .running
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("已有操作正在执行，请等待完成或取消".into());
    }
    bridge.cancel.store(false, Ordering::Release);
    if bridge.closing.load(Ordering::Acquire) {
        bridge.cancel.store(true, Ordering::Release);
        bridge.running.store(false, Ordering::Release);
        return Err("管理器正在退出".into());
    }
    let closing = bridge.closing.clone();
    let manager = bridge.manager.clone();
    let cache = bridge.snapshot.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        let mut manager = manager.lock().map_err(|_| "管理状态不可用")?;
        if closing.load(Ordering::Acquire) {
            return Err("管理器正在退出".into());
        }
        let result = manager.execute_launcher(request);
        *cache.lock().map_err(|_| "状态缓存不可用")? = manager.snapshot();
        result
    })
    .await;
    bridge.running.store(false, Ordering::Release);
    result.map_err(|_| "启动器操作异常结束，请重新读取状态".to_string())?
}

#[tauri::command]
async fn choose_launcher_json(app: tauri::AppHandle) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || pick_launcher_json(&app))
        .await
        .map_err(|_| "无法读取布局文件".to_string())?
}
fn pick_launcher_json(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    let Some(file) = app
        .dialog()
        .file()
        .set_title(dialog_text(
            app,
            "导入 layout.json 布局",
            "匯入 layout.json 佈局",
            "Import layout.json",
        ))
        .add_filter("JSON", &["json"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    read_launcher_json(&file.into_path().map_err(|_| "请选择本地 JSON 文件")?).map(Some)
}
fn read_launcher_json(path: &std::path::Path) -> Result<String, String> {
    use std::io::Read;
    if !path.is_absolute()
        || !path
            .extension()
            .is_some_and(|v| v.eq_ignore_ascii_case("json"))
    {
        return Err("请选择本地 JSON 文件完整路径".into());
    }
    let mut data = Vec::new();
    std::fs::File::open(path)
        .map_err(|_| "无法打开布局文件")?
        .take(90 * 1024 + 1)
        .read_to_end(&mut data)
        .map_err(|_| "无法读取布局文件")?;
    if data.len() > 90 * 1024 {
        return Err("layout.json 不能超过 90 KiB".into());
    }
    String::from_utf8(data).map_err(|_| "layout.json 应使用 UTF-8 编码".into())
}

#[tauri::command]
fn cancel(bridge: tauri::State<'_, Bridge>) {
    bridge.cancel.store(true, Ordering::Release);
}

#[tauri::command]
fn platform_tools_info(app: tauri::AppHandle) -> Result<platform_tools::Info, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|_| "无法定位应用数据目录")?;
    platform_tools::info(&directory)
}

#[tauri::command]
async fn get_market_catalog(
    refresh: Option<bool>,
    on_progress: tauri::ipc::Channel<market::Progress>,
    app: tauri::AppHandle,
    bridge: tauri::State<'_, Bridge>,
) -> Result<market::Catalog, String> {
    let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
    let guard = begin_market_operation(&bridge)?;
    let bridge = bridge.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = guard;
        market::catalog(
            &directory,
            refresh.unwrap_or(false),
            &bridge.cancel,
            |progress| {
                cache_market_progress(&bridge, progress.clone())?;
                on_progress
                    .send(progress)
                    .map_err(|_| "市场目录界面已关闭，请重试".to_string())?;
                Ok(())
            },
        )
    })
    .await
    .map_err(|_| "市场目录任务异常结束，请重试".to_string())?
}

#[tauri::command]
async fn download_market_item(
    id: String,
    revision: Option<String>,
    on_progress: tauri::ipc::Channel<market::Progress>,
    app: tauri::AppHandle,
    bridge: tauri::State<'_, Bridge>,
) -> Result<MarketResult, String> {
    execute_market_item(id, revision, false, on_progress, app, bridge).await
}

#[tauri::command]
async fn install_market_item(
    id: String,
    revision: Option<String>,
    on_progress: tauri::ipc::Channel<market::Progress>,
    app: tauri::AppHandle,
    bridge: tauri::State<'_, Bridge>,
) -> Result<MarketResult, String> {
    execute_market_item(id, revision, true, on_progress, app, bridge).await
}

async fn execute_market_item(
    id: String,
    revision: Option<String>,
    install: bool,
    on_progress: tauri::ipc::Channel<market::Progress>,
    app: tauri::AppHandle,
    bridge: tauri::State<'_, Bridge>,
) -> Result<MarketResult, String> {
    let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
    let guard = begin_market_operation(&bridge)?;
    let bridge = bridge.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = guard;
        run_market_item(
            &directory,
            &bridge,
            &id,
            revision.as_deref(),
            install,
            |progress| {
                cache_market_progress(&bridge, progress.clone())?;
                on_progress
                    .send(progress)
                    .map_err(|_| "市场下载界面已关闭，请重试".to_string())?;
                Ok(())
            },
        )
    })
    .await
    .map_err(|_| "市场任务异常结束，请重试".to_string())?
}

fn cache_market_progress(bridge: &Bridge, progress: market::Progress) -> Result<(), String> {
    *bridge
        .market_progress
        .lock()
        .map_err(|_| "市场进度不可用")? = Some(progress);
    Ok(())
}

fn run_market_item(
    directory: &std::path::Path,
    bridge: &Bridge,
    id: &str,
    revision: Option<&str>,
    install: bool,
    mut report: impl FnMut(market::Progress) -> Result<(), String>,
) -> Result<MarketResult, String> {
    let mut download = market::download(directory, id, revision, &bridge.cancel, &mut report)?;
    if download.item.kind == "launcher" {
        if let Some(background) =
            launcher_covers::apk_home_background(std::path::Path::new(&download.path))
        {
            download.home_background = background.image;
            download.home_background_color = Some(background.color);
        }
    }
    let mut result = MarketResult {
        operation: if install { "install" } else { "download" },
        download,
        snapshot: None,
        installed: false,
        error: None,
    };
    if !install {
        return Ok(result);
    }
    // Preserve a verified local APK even when the device rejects its installation.
    let outcome = (|| -> Result<(), String> {
        if bridge.closing.load(Ordering::Acquire) {
            return Err("管理器正在退出，APK 已下载，尚未安装".into());
        }
        if bridge.cancel.load(Ordering::Acquire) {
            return Err("安装已取消，APK 已保留在待安装列表".into());
        }
        report(market::Progress {
            stage: "installing".into(),
            downloaded: 0,
            total: 1,
            item_id: Some(result.download.item.id.clone()),
        })?;
        let mut manager = bridge.manager.lock().map_err(|_| "管理状态不可用")?;
        if bridge.closing.load(Ordering::Acquire) {
            return Err("管理器正在退出，APK 已下载，尚未安装".into());
        }
        let execution = manager.execute(Request::Install {
            paths: vec![result.download.path.clone()],
        });
        let snapshot = manager.snapshot();
        *bridge.snapshot.lock().map_err(|_| "状态缓存不可用")? = snapshot.clone();
        result.snapshot = Some(snapshot.clone());
        execution?;
        confirm_market_install(&snapshot, &result.download.path)?;
        result.installed = true;
        Ok(())
    })();
    result.error = outcome.err();
    Ok(result)
}

fn confirm_market_install(snapshot: &Snapshot, path: &str) -> Result<(), String> {
    let installed = snapshot
        .install_results
        .iter()
        .find(|entry| entry.path == path)
        .ok_or("安装未执行，APK 已保留在待安装列表")?;
    if installed.success {
        Ok(())
    } else {
        Err(installed.message.clone())
    }
}

#[tauri::command]
async fn install_platform_tools(
    accepted_license: bool,
    force_download: Option<bool>,
    on_progress: tauri::ipc::Channel<platform_tools::Progress>,
    app: tauri::AppHandle,
    bridge: tauri::State<'_, Bridge>,
) -> Result<Snapshot, String> {
    if bridge.closing.load(Ordering::Acquire) {
        return Err("管理器正在退出".into());
    }
    if !accepted_license {
        return Err("请先阅读并同意 Android SDK 许可协议".into());
    }
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|_| "无法定位应用数据目录")?;
    if bridge
        .running
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("已有操作正在执行，请等待完成或取消".into());
    }
    bridge.cancel.store(false, Ordering::Release);
    if bridge.closing.load(Ordering::Acquire) {
        bridge.cancel.store(true, Ordering::Release);
        bridge.running.store(false, Ordering::Release);
        return Err("管理器正在退出".into());
    }
    let closing = bridge.closing.clone();
    let manager = bridge.manager.clone();
    let cancel = bridge.cancel.clone();
    let cache = bridge.snapshot.clone();
    let progress_cache = bridge.progress.clone();
    *progress_cache.lock().map_err(|_| "进度不可用")? = None;
    let result = tauri::async_runtime::spawn_blocking(move || {
        let mut manager = manager
            .lock()
            .map_err(|_| "管理状态不可用，请重新打开程序")?;
        if closing.load(Ordering::Acquire) {
            return Err("管理器正在退出".into());
        }
        if manager.execute(Request::GetState)?.device.is_some() {
            return Err("请先断开当前电视，再准备或更换 ADB".into());
        }
        let result = platform_tools::install(
            &directory,
            &cancel,
            force_download.unwrap_or(false),
            |progress| {
                *progress_cache.lock().map_err(|_| "进度不可用")? = Some(progress.clone());
                on_progress
                    .send(progress)
                    .map_err(|_| "下载界面已关闭，请重试".to_string())
            },
            |path| {
                manager.execute(Request::SetAdbPath {
                    path: path.to_string_lossy().into_owned(),
                })
            },
        );
        *cache.lock().map_err(|_| "状态缓存不可用")? = manager.snapshot();
        result
    })
    .await;
    bridge.running.store(false, Ordering::Release);
    result.map_err(|_| "工具安装任务异常结束，请重试".to_string())?
}

#[tauri::command]
async fn choose_apks(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || pick_apks(&app))
        .await
        .map_err(|_| "无法打开文件选择器".to_string())?
}
fn pick_apks(app: &tauri::AppHandle) -> Result<Vec<String>, String> {
    app.dialog()
        .file()
        .set_title(dialog_text(
            app,
            "选择安装到电视的 APK",
            "選擇安裝到電視的 APK",
            "Choose APKs to install on the TV",
        ))
        .add_filter("Android APK", &["apk"])
        .blocking_pick_files()
        .unwrap_or_default()
        .into_iter()
        .map(|file| {
            file.into_path()
                .map(|path| path.to_string_lossy().into_owned())
                .map_err(|_| "请选择本地 APK 文件".to_string())
        })
        .collect()
}

#[tauri::command]
async fn choose_adb(app: tauri::AppHandle) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || pick_adb(&app))
        .await
        .map_err(|_| "无法打开文件选择器".to_string())?
}
fn pick_adb(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    app.dialog()
        .file()
        .set_title(dialog_text(
            app,
            "选择 Android Platform Tools 中的 adb 或 adb.exe",
            "選擇 Android Platform Tools 中的 adb 或 adb.exe",
            "Choose adb or adb.exe from Platform Tools",
        ))
        .blocking_pick_file()
        .map(|file| {
            file.into_path()
                .map(|path| path.to_string_lossy().into_owned())
                .map_err(|_| "请选择本地 ADB 程序".to_string())
        })
        .transpose()
}

#[tauri::command]
fn open_resource(resource: &str, app: tauri::AppHandle) -> Result<(), String> {
    let url = match resource {
        "repository" => "https://github.com/ecojust/pureTV",
        "catalog" => "https://github.com/ecojust/pureTV/tree/master/resource",
        "releases" => "https://github.com/ecojust/pureTV/releases",
        "market" => "https://gitee.com/juzisang331/pure-tv-store",
        "platformTools" => "https://developer.android.com/tools/releases/platform-tools",
        "platformToolsLicense" => "https://developer.android.com/studio/terms",
        _ => return Err("不支持的资源".into()),
    };
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|_| "无法打开浏览器".into())
}

#[tauri::command]
fn mcp_info(info: tauri::State<'_, mcp::Info>) -> mcp::Info {
    info.inner().clone()
}

fn mcp_call(
    app: &tauri::AppHandle,
    bridge: &Bridge,
    name: &str,
    args: Value,
) -> Result<Value, String> {
    if bridge.closing.load(Ordering::Acquire) {
        return Err("管理器正在退出".into());
    }
    if name == "close_manager" {
        if args["confirmShutdown"] != true {
            return Err("请先确认关闭管理器会停止当前 ADB 服务".into());
        }
        app.exit(0);
        return Ok(json!({"closing":true}));
    }
    if name == "get_interface_preferences" {
        return Ok(json!(get_interface_preferences(app.clone())?));
    }
    if name == "set_interface_preferences" {
        return Ok(json!(set_interface_preferences(args, None, app.clone())?));
    }
    if name == "get_state" {
        return serde_json::to_value(bridge.snapshot.lock().map_err(|_| "状态不可用")?.clone())
            .map_err(|e| e.to_string());
    }
    if name == "get_status" {
        return Ok(
            json!({"running":bridge.running.load(Ordering::Acquire),"cancelling":bridge.running.load(Ordering::Acquire) && bridge.cancel.load(Ordering::Acquire),"progress":bridge.progress.lock().map_err(|_| "进度不可用")?.clone(),"marketProgress":bridge.market_progress.lock().map_err(|_| "市场进度不可用")?.clone(),"snapshot":bridge.snapshot.lock().map_err(|_| "状态不可用")?.clone()}),
        );
    }
    if name == "cancel" {
        bridge.cancel.store(true, Ordering::Release);
        return Ok(json!({"requested":true}));
    }
    if name == "platform_tools_info" {
        return serde_json::to_value(platform_tools_info(app.clone())?).map_err(|e| e.to_string());
    }
    if bridge
        .running
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("已有操作正在执行，请等待完成或取消".into());
    }
    struct Busy<'a>(&'a AtomicBool);
    impl Drop for Busy<'_> {
        fn drop(&mut self) {
            self.0.store(false, Ordering::Release);
        }
    }
    let guard = Busy(&bridge.running);
    bridge.cancel.store(false, Ordering::Release);
    if bridge.closing.load(Ordering::Acquire) {
        bridge.cancel.store(true, Ordering::Release);
        bridge.running.store(false, Ordering::Release);
        return Err("管理器正在退出".into());
    }
    *bridge.progress.lock().map_err(|_| "进度不可用")? = None;
    *bridge
        .market_progress
        .lock()
        .map_err(|_| "市场进度不可用")? = None;
    let _ = app.emit("mcp-operation", json!({"running":true,"tool":name}));
    let mut market_result = None;
    let result = (|| -> Result<Value, String> {
        match name {
            "get_market_catalog" => {
                let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
                let catalog = market::catalog(
                    &directory,
                    args["refresh"].as_bool().unwrap_or(false),
                    &bridge.cancel,
                    |progress| {
                        cache_market_progress(bridge, progress.clone())?;
                        let _ = app.emit("mcp-market-progress", progress);
                        Ok(())
                    },
                )?;
                let value = serde_json::to_value(catalog).map_err(|error| error.to_string())?;
                market_result = Some(json!({"operation":"catalog","catalog":value}));
                return Ok(value);
            }
            "download_market_item" | "install_market_item" => {
                let directory = app.path().app_data_dir().map_err(|_| "无法定位数据目录")?;
                let result = run_market_item(
                    &directory,
                    bridge,
                    args["id"].as_str().ok_or("缺少市场应用标识")?,
                    args["revision"].as_str(),
                    name == "install_market_item",
                    |progress| {
                        cache_market_progress(bridge, progress.clone())?;
                        let _ = app.emit("mcp-market-progress", progress);
                        Ok(())
                    },
                )?;
                let mut value = serde_json::to_value(result).map_err(|error| error.to_string())?;
                market_result = Some(value.clone());
                // Embedded launcher artwork is useful to the GUI but can exceed the
                // MCP transport's message limit. Agents receive its local APK path.
                if let Some(download) = value.get_mut("download").and_then(Value::as_object_mut) {
                    download.remove("homeBackground");
                }
                return Ok(value);
            }
            "get_launcher_covers" => return get_launcher_covers(app.clone()),
            "set_launcher_cover" => {
                return launcher_covers::set(
                    &app.path().app_data_dir().map_err(|_| "无法定位数据目录")?,
                    args["key"].as_str().ok_or("缺少启动器标识")?,
                    args["path"].as_str().map(std::path::Path::new),
                )
            }
            "choose_launcher_json" => return Ok(json!(pick_launcher_json(app)?)),
            "choose_apks" => return Ok(json!(pick_apks(app)?)),
            "choose_adb" => return Ok(json!(pick_adb(app)?)),
            "open_resource" => {
                open_resource(args["resource"].as_str().ok_or("资源无效")?, app.clone())?;
                return Ok(json!({"opened":true}));
            }
            _ => {}
        }
        let mut manager = bridge.manager.lock().map_err(|_| "管理状态不可用")?;
        if bridge.closing.load(Ordering::Acquire) {
            return Err("管理器正在退出".into());
        }
        if let Some(request) = mcp::launcher_request(name, args.clone())? {
            let result = manager.execute_launcher(request);
            *bridge.snapshot.lock().map_err(|_| "状态不可用")? = manager.snapshot();
            return result;
        }
        let prior_ids: std::collections::BTreeSet<_> = manager
            .snapshot()
            .history
            .iter()
            .map(|entry| entry.id.clone())
            .collect();
        let result = if name == "install_platform_tools" {
            if args["acceptedLicense"] != true {
                return Err("请先阅读并同意 Android SDK 许可协议".into());
            }
            if manager.snapshot().device.is_some() {
                return Err("请先断开当前电视，再准备或更换 ADB".into());
            }
            let directory = app
                .path()
                .app_data_dir()
                .map_err(|_| "无法定位应用数据目录")?;
            platform_tools::install(
                &directory,
                &bridge.cancel,
                args.get("forceDownload")
                    .and_then(Value::as_bool)
                    .unwrap_or(false),
                |progress| {
                    *bridge.progress.lock().map_err(|_| "进度不可用")? = Some(progress.clone());
                    let _ = app.emit("mcp-progress", progress);
                    Ok(())
                },
                |path| {
                    manager.execute(Request::SetAdbPath {
                        path: path.to_string_lossy().into_owned(),
                    })
                },
            )
        } else {
            let request = mcp::core_request(name, args)?;
            manager.execute(request)
        };
        *bridge.snapshot.lock().map_err(|_| "状态不可用")? = manager.snapshot();
        result.and_then(|snapshot| {
            let failed: Vec<_> = snapshot
                .history
                .iter()
                .filter(|entry| !entry.success && !prior_ids.contains(&entry.id))
                .cloned()
                .collect();
            if failed.is_empty() {
                serde_json::to_value(snapshot).map_err(|e| e.to_string())
            } else {
                Ok(json!({"snapshot":snapshot,"failedTargets":failed}))
            }
        })
    })();
    let snapshot = bridge.snapshot.lock().map_err(|_| "状态不可用")?.clone();
    let _ = app.emit(
        "mcp-operation",
        json!({"running":false,"tool":name,"snapshot":snapshot,"error":result.as_ref().err(),"launcherResult":if ["get_launcher_layout","get_launcher_backgrounds","apply_launcher_layout","reset_launcher_layout"].contains(&name){result.as_ref().ok()}else{None},"marketResult":market_result}),
    );
    drop(guard);
    result
}

fn main() {
    let args: Vec<_> = std::env::args_os().collect();
    if args.get(1).is_some_and(|arg| arg == "--mcp") {
        let result = args
            .get(2)
            .ok_or_else(|| "用法：puretv-desktop --mcp <管理器显示的会话文件路径>".to_string())
            .and_then(|path| mcp::relay(std::path::Path::new(path)));
        if let Err(error) = result {
            eprintln!("{error}");
            std::process::exit(1)
        }
        return;
    }
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let directory = app.path().app_data_dir()?;
            let cancel = Arc::new(AtomicBool::new(false));
            std::fs::create_dir_all(&directory)?;
            let lock = std::fs::OpenOptions::new()
                .read(true)
                .write(true)
                .create(true)
                .truncate(false)
                .open(directory.join("manager.lock"))?;
            lock.try_lock()
                .map_err(|_| "pureTV 管理器已运行，请使用已有窗口")?;
            app.manage(lock);
            app.manage(ui_preferences::Settings::load(directory.clone()));
            let shutdown = Arc::new(Shutdown::default());
            app.manage(shutdown.clone());
            let manager = TvManager::new(directory.clone(), cancel.clone());
            let snapshot = manager.snapshot();
            let snapshot = Arc::new(Mutex::new(snapshot));
            let bridge = Bridge {
                closing: shutdown.started.clone(),
                manager: Arc::new(Mutex::new(manager)),
                cancel,
                running: Arc::new(AtomicBool::new(false)),
                snapshot: snapshot.clone(),
                progress: Arc::new(Mutex::new(None)),
                market_progress: Arc::new(Mutex::new(None)),
            };
            let handle = app.handle().clone();
            let service = bridge.clone();
            let info = mcp::start(
                &directory,
                Arc::new(move |name, args| mcp_call(&handle, &service, name, args)),
            )?;
            app.manage(info);
            app.manage(bridge);
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if request_shutdown(window.app_handle()) {
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            execute,
            get_local_network,
            get_interface_preferences,
            set_interface_preferences,
            get_launcher_covers,
            choose_launcher_cover,
            choose_launcher_apks,
            launcher_execute,
            choose_launcher_json,
            cancel,
            choose_apks,
            choose_adb,
            platform_tools_info,
            install_platform_tools,
            get_market_catalog,
            download_market_item,
            install_market_item,
            open_resource,
            mcp_info
        ])
        .build(tauri::generate_context!())
        .expect("无法启动 pureTV 电视管理器")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                if request_shutdown(app) {
                    api.prevent_exit();
                }
            }
        });
}

#[cfg(test)]
mod market_integration_tests {
    use super::*;

    #[test]
    fn successful_dispatch_does_not_mask_an_install_rejection_or_cancellation() {
        let mut snapshot = Snapshot::default();
        snapshot.install_results.push(puretv_core::InstallResult {
            path: "/cache/tv.apk".into(),
            success: false,
            message: "INSTALL_FAILED_VERSION_DOWNGRADE".into(),
        });
        assert_eq!(
            confirm_market_install(&snapshot, "/cache/tv.apk"),
            Err("INSTALL_FAILED_VERSION_DOWNGRADE".into())
        );
        // An earlier successful install must not count as this item's completion.
        snapshot.install_results[0].success = true;
        assert!(confirm_market_install(&snapshot, "/cache/other.apk").is_err());
        assert!(confirm_market_install(&snapshot, "/cache/tv.apk").is_ok());
        snapshot.install_results.clear();
        assert!(confirm_market_install(&snapshot, "/cache/tv.apk").is_err());
    }

    #[test]
    fn shutdown_waits_for_cancelled_worker_cleanup_and_has_a_deadline() {
        let running = Arc::new(AtomicBool::new(true));
        let cancel = Arc::new(AtomicBool::new(false));
        let cleaned = Arc::new(AtomicBool::new(false));
        let worker_running = running.clone();
        let worker_cancel = cancel.clone();
        let worker_cleaned = cleaned.clone();
        let worker = std::thread::spawn(move || {
            let _guard = OperationGuard(worker_running);
            while !worker_cancel.load(Ordering::Acquire) {
                std::thread::yield_now();
            }
            worker_cleaned.store(true, Ordering::Release);
        });
        cancel.store(true, Ordering::Release);
        assert!(wait_for_operation(
            &running,
            std::time::Duration::from_secs(2)
        ));
        assert!(cleaned.load(Ordering::Acquire));
        worker.join().unwrap();
        assert!(!wait_for_operation(
            &AtomicBool::new(true),
            std::time::Duration::ZERO
        ));
    }
}
