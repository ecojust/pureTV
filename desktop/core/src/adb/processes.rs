//! Local ADB cleanup before an explicit connection. No shell command matching,
//! elevated privileges, process trees or unrelated users are involved.
use std::{
    collections::HashSet,
    ffi::OsStr,
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::{Duration, Instant},
};
use sysinfo::{
    Pid, Process, ProcessRefreshKind, ProcessStatus, ProcessesToUpdate, System, Uid, UpdateKind,
};

fn refresh(system: &mut System, processes: ProcessesToUpdate<'_>) {
    system.refresh_processes_specifics(
        processes,
        true,
        ProcessRefreshKind::nothing()
            .with_user(UpdateKind::Always)
            .with_exe(UpdateKind::Always)
            .without_tasks(),
    );
}

fn is_adb_name(name: &OsStr) -> bool {
    if cfg!(windows) {
        name.to_str()
            .is_some_and(|name| name.eq_ignore_ascii_case("adb.exe"))
    } else {
        name == "adb"
    }
}

fn is_adb_process(process: &Process) -> bool {
    // Use the executable filename, rather than argv or a changeable process
    // title. Linux appends this suffix to an executable removed while running.
    process
        .exe()
        .and_then(|path| path.file_name())
        .is_some_and(|name| {
            is_adb_name(name) || (cfg!(target_os = "linux") && name == "adb (deleted)")
        })
}

fn check(cancel: &AtomicBool, deadline: Instant) -> Result<(), String> {
    if cancel.load(Ordering::Relaxed) {
        Err("操作已取消".into())
    } else if Instant::now() >= deadline {
        Err("等待残留 ADB 进程退出超时".into())
    } else {
        Ok(())
    }
}

fn ancestors(system: &System, current: Pid) -> HashSet<Pid> {
    let mut result = HashSet::new();
    let mut next = Some(current);
    while let Some(pid) = next {
        if !result.insert(pid) {
            break;
        }
        next = system.process(pid).and_then(|process| process.parent());
    }
    result
}

#[cfg(target_os = "linux")]
fn process_handle(pid: Pid) -> Result<Option<std::os::fd::OwnedFd>, String> {
    use std::os::fd::FromRawFd;
    // Hold the process identity across refresh and signaling. A later reuse of
    // its numeric PID cannot redirect pidfd_send_signal to another process.
    let descriptor = unsafe { libc::syscall(libc::SYS_pidfd_open, pid.as_u32(), 0u32) };
    if descriptor >= 0 {
        return Ok(Some(unsafe {
            std::os::fd::OwnedFd::from_raw_fd(descriptor as i32)
        }));
    }
    match std::io::Error::last_os_error().raw_os_error() {
        Some(libc::ESRCH) => Ok(None),
        Some(libc::ENOSYS) => Err("当前 Linux 内核不支持安全清理 ADB 进程".into()),
        _ => Err("无法打开残留 ADB 进程的安全句柄".into()),
    }
}

fn candidates(
    system: &System,
    owner: &Uid,
    protected: &HashSet<Pid>,
) -> Result<Vec<(Pid, u64)>, String> {
    let mut result = Vec::new();
    for process in system.processes().values() {
        if process.user_id() != Some(owner)
            || protected.contains(&process.pid())
            || process.status() == ProcessStatus::Zombie
        {
            continue;
        }
        if process.exe().is_none() && is_adb_name(process.name()) {
            return Err("无法确认残留 ADB 进程身份".into());
        }
        if is_adb_process(process) {
            if process.start_time() == 0 {
                return Err("无法确认残留 ADB 进程身份".into());
            }
            result.push((process.pid(), process.start_time()));
        }
    }
    Ok(result)
}

// Refresh identity immediately before terminating a PID to detect reuse and
// exclude other users, ourselves and a parent of Manager.
fn stop(
    system: &mut System,
    pid: Pid,
    started: u64,
    owner: &Uid,
    protected: &HashSet<Pid>,
    cancel: &AtomicBool,
    deadline: Instant,
) -> Result<(), String> {
    check(cancel, deadline)?;
    #[cfg(target_os = "linux")]
    let Some(handle) = process_handle(pid)?
    else {
        return Ok(());
    };
    refresh(system, ProcessesToUpdate::Some(&[pid]));
    let Some(process) = system.process(pid) else {
        return Ok(());
    };
    if !is_adb_process(process)
        || process.user_id() != Some(owner)
        || process.start_time() != started
        || protected.contains(&pid)
        || process.status() == ProcessStatus::Zombie
    {
        return Ok(());
    }
    check(cancel, deadline)?;
    #[cfg(windows)]
    {
        super::windows_process::terminate_adb_process(
            pid.as_u32(),
            started,
            cancel,
            deadline.saturating_duration_since(Instant::now()),
        )?;
    }
    #[cfg(target_os = "linux")]
    {
        use std::os::fd::AsRawFd;
        let result = unsafe {
            libc::syscall(
                libc::SYS_pidfd_send_signal,
                handle.as_raw_fd(),
                libc::SIGKILL,
                std::ptr::null::<libc::siginfo_t>(),
                0u32,
            )
        };
        if result < 0 && std::io::Error::last_os_error().raw_os_error() != Some(libc::ESRCH) {
            return Err("无法结束残留 ADB 进程".into());
        }
    }
    #[cfg(all(unix, not(target_os = "linux")))]
    {
        // Unlike sysinfo's Windows implementation, this is a direct bounded
        // kill syscall, not a spawned taskkill command.
        if process.kill_with(sysinfo::Signal::Kill) != Some(true) {
            refresh(system, ProcessesToUpdate::Some(&[pid]));
            if system.process(pid).is_some_and(|process| {
                process.start_time() == started && process.status() != ProcessStatus::Zombie
            }) {
                return Err("无法结束残留 ADB 进程".into());
            }
        }
    }
    Ok(())
}

pub(super) fn clear(cancel: &AtomicBool, timeout: Duration) -> Result<(), String> {
    let deadline = Instant::now() + timeout;
    check(cancel, deadline)?;
    let current = sysinfo::get_current_pid().map_err(|_| "无法识别当前进程的用户")?;
    let mut system = System::new();
    refresh(&mut system, ProcessesToUpdate::All);
    let owner = system
        .process(current)
        .and_then(|process| process.user_id())
        .cloned()
        .ok_or("无法识别当前进程的用户")?;
    let protected = ancestors(&system, current);
    loop {
        check(cancel, deadline)?;
        let targets = candidates(&system, &owner, &protected)?;
        if targets.is_empty() {
            return Ok(());
        }
        for (pid, started) in targets {
            stop(
                &mut system,
                pid,
                started,
                &owner,
                &protected,
                cancel,
                deadline,
            )?;
        }
        // Re-enumerate until every current-user ADB has exited, including a
        // daemon that another tool restarted while cleanup was running.
        thread::sleep(Duration::from_millis(35));
        refresh(&mut system, ProcessesToUpdate::All);
        if system
            .process(current)
            .and_then(|process| process.user_id())
            != Some(&owner)
        {
            return Err("无法识别当前进程的用户".into());
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
        time::SystemTime,
    };

    #[test]
    fn exact_adb_name_does_not_match_other_programs() {
        assert!(is_adb_name(OsStr::new(if cfg!(windows) {
            "adb.exe"
        } else {
            "adb"
        })));
        for name in [
            "adb-helper",
            "adb-helper.exe",
            "my-adb",
            "puretv-desktop",
            "sh",
            "adb shell",
        ] {
            assert!(!is_adb_name(OsStr::new(name)), "{name}");
        }
    }

    #[test]
    fn cancelled_cleanup_never_enumerates_or_kills_processes() {
        assert_eq!(
            clear(&AtomicBool::new(true), Duration::from_secs(5)),
            Err("操作已取消".into())
        );
        assert_eq!(
            clear(&AtomicBool::new(false), Duration::ZERO),
            Err("等待残留 ADB 进程退出超时".into())
        );
    }

    #[test]
    #[ignore = "subprocess fixture; only the parent cleanup test launches this"]
    fn process_fixture() {
        assert_eq!(
            std::env::var("PURETV_CORE_PROCESS_FIXTURE").as_deref(),
            Ok("1")
        );
        thread::sleep(Duration::from_secs(60));
    }

    struct Fixture {
        directory: PathBuf,
        children: Vec<Child>,
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            for child in &mut self.children {
                let _ = child.kill();
                let _ = child.wait();
            }
            let _ = fs::remove_dir_all(&self.directory);
        }
    }
    impl Fixture {
        fn launch(&mut self, name: &str) -> Pid {
            let path = self.directory.join(name);
            fs::copy(std::env::current_exe().unwrap(), &path).unwrap();
            let mut command = Command::new(path);
            command
                .args([
                    "--ignored",
                    "--exact",
                    "adb::processes::tests::process_fixture",
                    "--nocapture",
                ])
                .env("PURETV_CORE_PROCESS_FIXTURE", "1")
                .stdout(Stdio::null())
                .stderr(Stdio::null());
            #[cfg(windows)]
            {
                use std::os::windows::process::CommandExt;
                command.creation_flags(0x08000000);
            }
            let child = command.spawn().unwrap();
            let pid = Pid::from_u32(child.id());
            self.children.push(child);
            pid
        }
    }

    #[test]
    fn cleanup_terminates_only_the_selected_adb_child_after_identity_checks() {
        let stamp = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let mut fixture = Fixture {
            directory: std::env::temp_dir().join(format!(
                "puretv-process-cleanup-{}-{stamp}",
                std::process::id()
            )),
            children: Vec::new(),
        };
        fs::create_dir(&fixture.directory).unwrap();
        let adb = fixture.launch(if cfg!(windows) { "adb.exe" } else { "adb" });
        let unrelated = fixture.launch(if cfg!(windows) {
            "adb-helper.exe"
        } else {
            "adb-helper"
        });
        let mut system = System::new();
        refresh(&mut system, ProcessesToUpdate::All);
        let current = sysinfo::get_current_pid().unwrap();
        let owner = system.process(current).unwrap().user_id().unwrap().clone();
        let mut protected = ancestors(&system, current);
        let started = system.process(adb).unwrap().start_time();
        assert!(candidates(&system, &owner, &protected)
            .unwrap()
            .contains(&(adb, started)));
        assert!(!candidates(&system, &owner, &protected)
            .unwrap()
            .iter()
            .any(|(pid, _)| *pid == unrelated));
        #[cfg(unix)]
        let other_owner = Uid::try_from(u32::MAX as usize).unwrap();
        #[cfg(windows)]
        let other_owner: Uid = "S-1-5-19".parse().unwrap();
        assert_ne!(owner, other_owner);
        assert!(!candidates(&system, &other_owner, &protected)
            .unwrap()
            .iter()
            .any(|(pid, _)| *pid == adb));
        let cancel = AtomicBool::new(false);
        let deadline = Instant::now() + Duration::from_secs(5);
        // A changed identity and a protected PID must both remain untouched.
        stop(
            &mut system,
            adb,
            started.saturating_add(1),
            &owner,
            &protected,
            &cancel,
            deadline,
        )
        .unwrap();
        assert!(fixture.children[0].try_wait().unwrap().is_none());
        protected.insert(adb);
        stop(
            &mut system,
            adb,
            started,
            &owner,
            &protected,
            &cancel,
            deadline,
        )
        .unwrap();
        assert!(fixture.children[0].try_wait().unwrap().is_none());
        protected.remove(&adb);
        stop(
            &mut system,
            adb,
            started,
            &owner,
            &protected,
            &cancel,
            deadline,
        )
        .unwrap();
        loop {
            if fixture.children[0].try_wait().unwrap().is_some() {
                break;
            }
            assert!(Instant::now() < deadline, "ADB fixture did not exit");
            thread::sleep(Duration::from_millis(20));
        }
        assert!(fixture.children[1].try_wait().unwrap().is_none());
        // Already gone is a successful cleanup, not an error.
        stop(
            &mut system,
            adb,
            started,
            &owner,
            &protected,
            &cancel,
            deadline,
        )
        .unwrap();
    }
}
