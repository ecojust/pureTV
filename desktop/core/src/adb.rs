use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    mpsc, Arc,
};
use std::thread;
use std::time::{Duration, Instant};

const OUTPUT_LIMIT: usize = 4 * 1024 * 1024;
mod processes;
#[cfg(windows)]
mod windows_process;
#[derive(Debug)]
pub(crate) struct Output {
    pub code: i32,
    pub text: String,
}
pub(crate) trait Runner: Send {
    fn clear_adb_processes(&mut self, cancel: &AtomicBool, timeout: Duration)
        -> Result<(), String>;

    fn run(
        &mut self,
        program: &Path,
        args: &[String],
        stdin: Option<&str>,
        cancel: &AtomicBool,
        timeout: Duration,
    ) -> Result<Output, String>;
}
pub(crate) struct ProcessRunner;
fn collect(mut reader: impl Read, overflow: Arc<AtomicBool>, limit: usize) -> Vec<u8> {
    let mut data = Vec::new();
    let mut bytes = [0u8; 8192];
    loop {
        match reader.read(&mut bytes) {
            Ok(0) | Err(_) => break,
            Ok(count) => {
                let remaining = limit.saturating_sub(data.len());
                data.extend_from_slice(&bytes[..count.min(remaining)]);
                if count > remaining {
                    overflow.store(true, Ordering::Relaxed);
                }
            }
        }
    }
    data
}
impl ProcessRunner {
    fn run_raw(
        &mut self,
        program: &Path,
        args: &[String],
        stdin: Option<&str>,
        cancel: &AtomicBool,
        timeout: Duration,
        limit: usize,
    ) -> Result<(i32, Vec<u8>, Vec<u8>), String> {
        if cancel.load(Ordering::Relaxed) {
            return Err("操作已取消".into());
        }
        let mut command = Command::new(program);
        command
            .args(args)
            .stdin(if stdin.is_some() {
                Stdio::piped()
            } else {
                Stdio::null()
            })
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command
            .spawn()
            .map_err(|_| "无法启动 ADB，请选择可执行的官方 Platform Tools 中的 adb".to_string())?;
        if let Some(secret) = stdin {
            let input = child
                .stdin
                .take()
                .ok_or_else(|| "无法写入 ADB 输入".to_string());
            match input.and_then(|mut pipe| {
                pipe.write_all(secret.as_bytes())
                    .map_err(|_| "无法写入 ADB 输入".to_string())
            }) {
                Ok(()) => (),
                Err(error) => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(error);
                }
            }
        }
        let overflow = Arc::new(AtomicBool::new(false));
        let stdout = child.stdout.take().ok_or("无法读取 ADB 输出")?;
        let stderr = child.stderr.take().ok_or("无法读取 ADB 输出")?;
        let out_overflow = overflow.clone();
        let err_overflow = overflow.clone();
        let (out_sender, out_receiver) = mpsc::sync_channel(1);
        let (err_sender, err_receiver) = mpsc::sync_channel(1);
        thread::spawn(move || {
            let _ = out_sender.send(collect(stdout, out_overflow, limit));
        });
        thread::spawn(move || {
            let _ = err_sender.send(collect(stderr, err_overflow, limit));
        });
        let started = Instant::now();
        let mut failure = None;
        let status = loop {
            if cancel.load(Ordering::Relaxed) {
                failure = Some("操作已取消");
            } else if started.elapsed() >= timeout {
                failure = Some("ADB 操作超时，请检查电视连接后重试");
            } else if overflow.load(Ordering::Relaxed) {
                failure = Some("ADB 输出超过 4 MiB 上限");
            }
            if failure.is_some() {
                let _ = child.kill();
                break child.wait().ok();
            }
            match child.try_wait() {
                Ok(Some(value)) => break Some(value),
                Ok(None) => thread::sleep(Duration::from_millis(35)),
                Err(_) => {
                    failure = Some("无法读取 ADB 进程状态");
                    let _ = child.kill();
                    break child.wait().ok();
                }
            }
        };
        // A descendant can inherit a pipe after the ADB client exits. Never join
        // readers indefinitely: timeout/cancellation still has a bounded return.
        let out = out_receiver.recv_timeout(Duration::from_millis(300));
        let err = err_receiver.recv_timeout(Duration::from_millis(300));
        if let Some(error) = failure {
            return Err(error.into());
        }
        let out = out.map_err(|_| "ADB 输出未正常关闭，请重试")?;
        let err = err.map_err(|_| "ADB 输出未正常关闭，请重试")?;
        if overflow.load(Ordering::Relaxed) {
            return Err(format!("ADB 输出超过 {} MiB 上限", limit / 1024 / 1024));
        }
        Ok((status.and_then(|s| s.code()).unwrap_or(-1), out, err))
    }
}
impl Runner for ProcessRunner {
    fn clear_adb_processes(
        &mut self,
        cancel: &AtomicBool,
        timeout: Duration,
    ) -> Result<(), String> {
        processes::clear(cancel, timeout)
    }

    fn run(
        &mut self,
        program: &Path,
        args: &[String],
        stdin: Option<&str>,
        cancel: &AtomicBool,
        timeout: Duration,
    ) -> Result<Output, String> {
        let (code, out, err) = self.run_raw(program, args, stdin, cancel, timeout, OUTPUT_LIMIT)?;
        let stdout = String::from_utf8_lossy(&out);
        let stderr = String::from_utf8_lossy(&err);
        let text = if stderr.trim().is_empty() {
            stdout.into_owned()
        } else {
            format!("{stdout}\n{stderr}")
        };
        Ok(Output { code, text })
    }
}
pub(crate) fn discover(configured: Option<&str>) -> Option<PathBuf> {
    if let Some(value) = configured.filter(|s| !s.is_empty()) {
        let path = PathBuf::from(value);
        return path.is_file().then_some(path);
    }
    let exe = if cfg!(windows) { "adb.exe" } else { "adb" };
    let mut candidates = Vec::new();
    if let Some(value) = std::env::var_os("PURETV_ADB") {
        candidates.push(PathBuf::from(value));
    }
    if let Ok(current) = std::env::current_exe() {
        if let Some(parent) = current.parent() {
            candidates.push(parent.join(exe));
            candidates.push(parent.join("platform-tools").join(exe));
        }
    }
    if let Some(path) = std::env::var_os("PATH") {
        candidates.extend(std::env::split_paths(&path).map(|dir| dir.join(exe)));
    }
    for key in ["ANDROID_HOME", "ANDROID_SDK_ROOT"] {
        if let Some(value) = std::env::var_os(key) {
            candidates.push(PathBuf::from(value).join("platform-tools").join(exe));
        }
    }
    if let Some(home) = std::env::var_os("HOME") {
        let home = PathBuf::from(home);
        candidates.push(home.join("Android/Sdk/platform-tools").join(exe));
        candidates.push(home.join("Library/Android/sdk/platform-tools").join(exe));
    }
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        candidates.push(
            PathBuf::from(local)
                .join("Android/Sdk/platform-tools")
                .join(exe),
        );
    }
    candidates.into_iter().find(|path| path.is_file())
}
