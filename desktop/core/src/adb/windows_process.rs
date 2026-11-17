//! Stop only the same current-user ADB process observed during enumeration.
//! Keeping a native handle prevents a recycled PID from redirecting termination.
use std::{
    mem::{size_of, zeroed},
    ptr::null_mut,
    sync::atomic::{AtomicBool, Ordering},
    time::{Duration, Instant},
};
use windows_sys::Win32::{
    Foundation::{
        CloseHandle, GetLastError, ERROR_INSUFFICIENT_BUFFER, ERROR_INVALID_PARAMETER, FILETIME,
        HANDLE, WAIT_OBJECT_0, WAIT_TIMEOUT,
    },
    Security::{EqualSid, GetTokenInformation, IsValidSid, TokenUser, TOKEN_QUERY, TOKEN_USER},
    System::Threading::{
        GetCurrentProcess, GetCurrentProcessId, GetProcessTimes, OpenProcess, OpenProcessToken,
        QueryFullProcessImageNameW, TerminateProcess, WaitForSingleObject,
        PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_SYNCHRONIZE, PROCESS_TERMINATE,
    },
};

struct OwnedHandle(HANDLE);
impl Drop for OwnedHandle {
    fn drop(&mut self) {
        unsafe { CloseHandle(self.0) };
    }
}

fn error(pid: u32, operation: &str, code: u32) -> String {
    format!("无法清理 ADB 残留进程 {pid}（{operation}，Windows 错误 {code}）")
}

fn cancelled(cancel: &AtomicBool) -> Result<(), String> {
    if cancel.load(Ordering::Relaxed) {
        Err("操作已取消".into())
    } else {
        Ok(())
    }
}

// Vec<usize> supplies the alignment needed by TOKEN_USER. Its SID pointer is
// valid only while this allocation remains alive; callers retain both buffers.
fn user_token(process: HANDLE, pid: u32) -> Result<Vec<usize>, String> {
    let mut token = null_mut();
    if unsafe { OpenProcessToken(process, TOKEN_QUERY, &mut token) } == 0 {
        return Err(error(pid, "读取进程所有者", unsafe {
            GetLastError()
        }));
    }
    let token = OwnedHandle(token);
    let mut bytes = 0;
    let result = unsafe { GetTokenInformation(token.0, TokenUser, null_mut(), 0, &mut bytes) };
    if result != 0 || unsafe { GetLastError() } != ERROR_INSUFFICIENT_BUFFER {
        return Err(error(pid, "读取进程所有者", unsafe {
            GetLastError()
        }));
    }
    if !(size_of::<TOKEN_USER>()..=64 * 1024).contains(&(bytes as usize)) {
        return Err(format!("无法确认 ADB 残留进程 {pid} 的所有者"));
    }
    let mut data = vec![0usize; (bytes as usize).div_ceil(size_of::<usize>())];
    if unsafe {
        GetTokenInformation(
            token.0,
            TokenUser,
            data.as_mut_ptr().cast(),
            bytes,
            &mut bytes,
        )
    } == 0
    {
        return Err(error(pid, "读取进程所有者", unsafe {
            GetLastError()
        }));
    }
    let sid = unsafe { (*(data.as_ptr().cast::<TOKEN_USER>())).User.Sid };
    if unsafe { IsValidSid(sid) } == 0 {
        return Err(format!("无法确认 ADB 残留进程 {pid} 的所有者"));
    }
    Ok(data)
}

pub(super) fn terminate_adb_process(
    pid: u32,
    expected_start: u64,
    cancel: &AtomicBool,
    timeout: Duration,
) -> Result<bool, String> {
    cancelled(cancel)?;
    if pid == 0 || pid == unsafe { GetCurrentProcessId() } {
        return Ok(false);
    }
    if expected_start == 0 {
        return Err(format!("无法确认 ADB 残留进程 {pid} 的启动时间"));
    }
    let started = Instant::now();
    let raw = unsafe {
        OpenProcess(
            PROCESS_QUERY_LIMITED_INFORMATION | PROCESS_TERMINATE | PROCESS_SYNCHRONIZE,
            0,
            pid,
        )
    };
    if raw.is_null() {
        let code = unsafe { GetLastError() };
        return if code == ERROR_INVALID_PARAMETER {
            // This PID no longer names a process. Access-denied is deliberately
            // not treated as disappearance: it must stop the connection attempt.
            Ok(false)
        } else {
            Err(error(pid, "打开进程", code))
        };
    }
    let process = OwnedHandle(raw);
    if unsafe { WaitForSingleObject(process.0, 0) } == WAIT_OBJECT_0 {
        return Ok(false);
    }

    let mut path = vec![0u16; 32_768];
    let mut length = path.len() as u32;
    if unsafe { QueryFullProcessImageNameW(process.0, 0, path.as_mut_ptr(), &mut length) } == 0 {
        let code = unsafe { GetLastError() };
        if unsafe { WaitForSingleObject(process.0, 0) } == WAIT_OBJECT_0 {
            return Ok(false);
        }
        return Err(error(pid, "确认进程文件", code));
    }
    let path = String::from_utf16_lossy(&path[..length as usize]);
    if !path
        .rsplit(['\\', '/'])
        .next()
        .is_some_and(|name| name.eq_ignore_ascii_case("adb.exe"))
    {
        return Ok(false);
    }

    let (mut creation, mut exit, mut kernel, mut user): (FILETIME, FILETIME, FILETIME, FILETIME) =
        unsafe { zeroed() };
    if unsafe { GetProcessTimes(process.0, &mut creation, &mut exit, &mut kernel, &mut user) } == 0
    {
        return Err(error(pid, "确认进程启动时间", unsafe {
            GetLastError()
        }));
    }
    let ticks = (u64::from(creation.dwHighDateTime) << 32) | u64::from(creation.dwLowDateTime);
    let start = (ticks / 10_000_000).checked_sub(11_644_473_600);
    if start != Some(expected_start) {
        return Ok(false);
    }

    let target_user = match user_token(process.0, pid) {
        Ok(value) => value,
        Err(error) => {
            return if unsafe { WaitForSingleObject(process.0, 0) } == WAIT_OBJECT_0 {
                Ok(false)
            } else {
                Err(error)
            };
        }
    };
    let current_user = user_token(unsafe { GetCurrentProcess() }, pid)?;
    let target_sid = unsafe { (*(target_user.as_ptr().cast::<TOKEN_USER>())).User.Sid };
    let current_sid = unsafe { (*(current_user.as_ptr().cast::<TOKEN_USER>())).User.Sid };
    if unsafe { EqualSid(target_sid, current_sid) } == 0 {
        return Ok(false);
    }
    cancelled(cancel)?;
    if started.elapsed() >= timeout {
        return Err("清理 ADB 残留进程超时，请重试".into());
    }
    if unsafe { TerminateProcess(process.0, 1) } == 0 {
        let code = unsafe { GetLastError() };
        if unsafe { WaitForSingleObject(process.0, 0) } == WAIT_OBJECT_0 {
            return Ok(false);
        }
        return Err(error(pid, "结束进程", code));
    }
    loop {
        cancelled(cancel)?;
        let remaining = timeout.saturating_sub(started.elapsed());
        if remaining.is_zero() {
            return Err("清理 ADB 残留进程超时，请重试".into());
        }
        let wait = remaining.as_millis().clamp(1, 40) as u32;
        match unsafe { WaitForSingleObject(process.0, wait) } {
            WAIT_OBJECT_0 => return Ok(true),
            WAIT_TIMEOUT => (),
            _ => return Err(error(pid, "等待进程退出", unsafe { GetLastError() })),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        fs,
        path::PathBuf,
        process::{Child, Command, Stdio},
        time::{SystemTime, UNIX_EPOCH},
    };

    struct TestProcess {
        child: Child,
        directory: PathBuf,
    }
    impl Drop for TestProcess {
        fn drop(&mut self) {
            let _ = self.child.kill();
            let _ = self.child.wait();
            let _ = fs::remove_dir_all(&self.directory);
        }
    }
    impl TestProcess {
        fn start(name: &str) -> Self {
            let stamp = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let directory = std::env::temp_dir().join(format!(
                "puretv-windows-adb-process-{}-{stamp}",
                std::process::id()
            ));
            fs::create_dir(&directory).unwrap();
            let path = directory.join(name);
            fs::copy(std::env::current_exe().unwrap(), &path).unwrap();
            let child = Command::new(path)
                .args(["windows_process::tests::child_process", "--ignored"])
                .env("PURETV_ADB_CLEANUP_TEST_CHILD", "1")
                .stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .unwrap();
            Self { child, directory }
        }

        fn start_time(&self) -> u64 {
            let handle =
                unsafe { OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, self.child.id()) };
            assert!(!handle.is_null());
            let handle = OwnedHandle(handle);
            let (mut created, mut exited, mut kernel, mut user) = unsafe { zeroed() };
            assert_ne!(
                unsafe {
                    GetProcessTimes(handle.0, &mut created, &mut exited, &mut kernel, &mut user)
                },
                0
            );
            let ticks =
                (u64::from(created.dwHighDateTime) << 32) | u64::from(created.dwLowDateTime);
            ticks / 10_000_000 - 11_644_473_600
        }
    }

    #[test]
    #[ignore = "Only launched as the owned process fixture for native cleanup tests"]
    fn child_process() {
        if std::env::var("PURETV_ADB_CLEANUP_TEST_CHILD").as_deref() == Ok("1") {
            std::thread::sleep(Duration::from_secs(60));
        }
    }

    #[test]
    fn native_cleanup_rechecks_identity_and_waits_for_own_adb_process() {
        let mut adb = TestProcess::start("adb.exe");
        let mut other = TestProcess::start("not-adb.exe");
        let cancel = AtomicBool::new(false);
        let timeout = Duration::from_secs(3);
        let start = adb.start_time();
        assert!(!terminate_adb_process(adb.child.id(), start + 1, &cancel, timeout).unwrap());
        assert!(adb.child.try_wait().unwrap().is_none());
        assert!(
            !terminate_adb_process(other.child.id(), other.start_time(), &cancel, timeout).unwrap()
        );
        assert!(other.child.try_wait().unwrap().is_none());
        assert!(terminate_adb_process(adb.child.id(), start, &cancel, timeout).unwrap());
        assert!(adb.child.try_wait().unwrap().is_some());
        assert!(other.child.try_wait().unwrap().is_none());
    }

    #[test]
    fn native_cleanup_cancel_and_deadline_do_not_terminate_a_process() {
        let mut adb = TestProcess::start("adb.exe");
        let start = adb.start_time();
        let cancel = AtomicBool::new(true);
        assert!(
            terminate_adb_process(adb.child.id(), start, &cancel, Duration::from_secs(3)).is_err()
        );
        assert!(adb.child.try_wait().unwrap().is_none());
        cancel.store(false, Ordering::Relaxed);
        assert!(terminate_adb_process(adb.child.id(), start, &cancel, Duration::ZERO).is_err());
        assert!(adb.child.try_wait().unwrap().is_none());
    }
}
