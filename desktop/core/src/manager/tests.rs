use super::*;
use std::collections::BTreeMap;
use std::sync::Mutex;

#[derive(Default)]
struct FakeTv {
    installed: BTreeSet<String>,
    system: BTreeSet<String>,
    disabled: BTreeSet<String>,
    default: String,
    launchers: Vec<String>,
    user: u32,
    status: String,
    failure: Option<String>,
    connect_auth_failure: bool,
    connect_error: Option<String>,
    home_failure: bool,
    home_cancelled: bool,
    ignore_change: bool,
    calls: Vec<Vec<String>>,
    prior: BTreeMap<String, u8>,
    launcher_layout: Option<serde_json::Value>,
    layout_provider: bool,
}
struct FakeRunner {
    tv: Arc<Mutex<FakeTv>>,
    cancel_after_change: Option<Arc<AtomicBool>>,
}
impl Runner for FakeRunner {
    fn run(
        &mut self,
        _: &Path,
        args: &[String],
        input: Option<&str>,
        cancel: &AtomicBool,
        _: Duration,
    ) -> Result<Output, String> {
        if cancel.load(Ordering::Relaxed) {
            return Err("操作已取消".into());
        }
        let mut tv = self.tv.lock().unwrap();
        tv.calls.push(args.to_vec());
        let text = match args[0].as_str() {
            "version" => "Android Debug Bridge version 1.0.41".into(),
            "devices" => format!(
                "List of devices attached\n192.168.1.50:5555\t{} model:TV\n",
                tv.status
            ),
            "connect" => {
                if let Some(error) = tv.connect_error.clone() {
                    return Ok(Output {
                        code: 1,
                        text: error,
                    });
                }
                if tv.connect_auth_failure {
                    return Ok(Output {
                        code: 1,
                        text: "failed to authenticate to 192.168.1.50:5555".into(),
                    });
                }
                "connected to 192.168.1.50:5555".into()
            }
            "disconnect" => "disconnected".into(),
            "kill-server" => String::new(),
            "pair" => {
                assert_eq!(input, Some("123456\n"));
                "Successfully paired to 192.168.1.50:33111".into()
            }
            "-s" => {
                assert_eq!(args[1], "192.168.1.50:5555");
                if args[2] == "pull" {
                    use base64::Engine;
                    let bytes=base64::engine::general_purpose::STANDARD.decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII=").unwrap();
                    fs::write(args.last().unwrap(), bytes).unwrap();
                    "pulled".into()
                } else if args[2] == "install" {
                    assert!(Path::new(args.last().unwrap()).is_absolute());
                    if tv.failure.as_deref() == args.last().map(String::as_str) {
                        return Ok(Output {
                            code: 0,
                            text: "Failure [INSTALL_FAILED]".into(),
                        });
                    }
                    tv.installed.insert("com.imported.app".into());
                    "Success".into()
                } else {
                    let a = &args[3..];
                    match a[0].as_str() {
                        "am" => if a[1]=="start" {"Starting HOME".into()} else {tv.user.to_string()},
                        "screencap" | "rm" => "".into(),
                        "content" => {
                            if !tv.layout_provider {return Ok(Output{code:1,text:"No content provider".into()})}
                            use base64::Engine;
                            let method=&a[a.iter().position(|arg|arg=="--method").unwrap()+1];
                            let defaults:serde_json::Value=serde_json::from_str(include_str!("../../../public/layout-v3.json")).unwrap();
                            if method=="apply" {let arg=&a[a.iter().position(|arg|arg=="--arg").unwrap()+1];tv.launcher_layout=Some(serde_json::from_slice(&base64::engine::general_purpose::STANDARD.decode(arg).unwrap()).unwrap());}
                            else if method=="reset" {tv.launcher_layout=None;}
                            let layout=tv.launcher_layout.clone().unwrap_or(defaults);
                            let value=serde_json::json!({"supported":true,"version":layout["version"],"custom":tv.launcher_layout.is_some(),"layout":layout,"apps":[{"packageName":"com.ecojust.puretv","label":"pureTV"}]});
                            format!("Bundle[{{result={}}}]",base64::engine::general_purpose::STANDARD.encode(value.to_string()))
                        },
                        "cat" => if a[1]=="/proc/meminfo" {"MemTotal: 4096 kB\nMemAvailable: 1024 kB".into()}else{"3600.25 20.0".into()},
                        "df"=>"Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/data 4096 1024 3072 25% /data".into(),
                        "wm"=>"Physical size: 1920x1080".into(),
                        "getprop" if a.len()==1 => "[ro.product.manufacturer]: [Test Maker]\n[ro.product.brand]: [Test]\n[ro.build.version.sdk]: [33]\n[ro.build.version.security_patch]: [2026-10-01]\n[ro.board.platform]: [test-cpu]\n[ro.product.cpu.abi]: [arm64-v8a]".into(),
                        "getprop" => if a[1] == "ro.product.model" {
                            "Test TV"
                        } else {
                            "13"
                        }
                        .into(),
                        "dumpsys" => format!(
                            "Packages:\n  User {}: installed=true hidden=false enabled={}\n",
                            tv.user,
                            tv.prior.get(&a[2]).copied().unwrap_or(0)
                        ),
                        "sh" => {
                            let script=&a[2];
                            if let Some(names)=script.split("for p in ").nth(1).and_then(|v|v.split("; do").next()) {
                                names.split_whitespace().map(|name|format!("@@puretv@@{name}\npackage:/data/app/{name}/base.apk\npackage:/data/app/{name}/split.apk\n")).collect::<String>()
                            } else {
                                script.split("@@puretv@@").skip(1).map(|tail|{let name=tail.split('\\').next().unwrap();format!("@@puretv@@{name}\n1024\n2048\n")}).collect::<String>()
                            }
                        },
                        "stat" => "1024\n2048".into(),
                        "pm" if a[1] == "path" => "package:/data/app/example/base.apk\npackage:/data/app/example/split.apk".into(),
                        "pm" if a[1] == "list" => {
                            if tv.failure.as_deref() == Some("scan") {
                                return Ok(Output {
                                    code: 0,
                                    text: "Error: scan denied".into(),
                                });
                            }
                            let data = if a.iter().any(|s| s == "-s") {
                                tv.system.clone()
                            } else if a.iter().any(|s| s == "-d") {
                                tv.disabled.clone()
                            } else if a.iter().any(|s| s == "-u") {
                                tv.installed.union(&tv.system).cloned().collect()
                            } else {
                                tv.installed.clone()
                            };
                            data.iter()
                                .map(|s| format!("package:{s}\n"))
                                .collect::<String>()
                        }
                        "pm" => {
                            let target = a.last().unwrap();
                            if tv.failure.as_deref() == Some(target) {
                                "Failure [DELETE_FAILED_INTERNAL_ERROR]".into()
                            } else {
                                if !tv.ignore_change {
                                    match a[1].as_str() {
                                        "disable-user" => {
                                            tv.disabled.insert(target.clone());
                                        }
                                        "enable" | "default-state" => {
                                            tv.disabled.remove(target);
                                        }
                                        "uninstall" => {
                                            tv.installed.remove(target);
                                        }
                                        _ => panic!("unexpected pm command {a:?}"),
                                    }
                                }
                                if let Some(flag) = &self.cancel_after_change {
                                    flag.store(true, Ordering::Relaxed);
                                }
                                if a[1] == "uninstall" {
                                    "Success"
                                } else {
                                    "new state: changed"
                                }
                                .into()
                            }
                        }
                        "cmd" => {
                            if a[2] == "query-activities" && tv.home_failure {
                                if tv.home_cancelled {
                                    return Err("操作已取消".into());
                                }
                                return Ok(Output {
                                    code: 1,
                                    text: "Unknown command: query-activities".into(),
                                });
                            }
                            match a[2].as_str() {
                                "query-activities" => tv.launchers.join("\n"),
                                "resolve-activity" => tv.default.clone(),
                                "set-home-activity" => {
                                    if !tv.ignore_change {
                                        tv.default =
                                            a.last().unwrap().trim_matches('\'').to_string();
                                    }
                                    "Success".into()
                                }
                                "install-existing" => {
                                    tv.installed.insert(a.last().unwrap().clone());
                                    "Package installed for user".into()
                                }
                                _ => panic!("unexpected command {a:?}"),
                            }
                        }
                        _ => panic!("unexpected shell {a:?}"),
                    }
                }
            }
            _ => panic!("unexpected argv {args:?}"),
        };
        Ok(Output { code: 0, text })
    }
}
fn fixture() -> (Manager, Arc<Mutex<FakeTv>>) {
    let dir = std::env::temp_dir().join(format!(
        "puretv-test-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir_all(&dir).unwrap();
    let adb = dir.join(if cfg!(windows) { "adb.exe" } else { "adb" });
    fs::write(&adb, "fake").unwrap();
    let mut manager = Manager::new(dir, Arc::new(AtomicBool::new(false)));
    manager.saved.adb_path = Some(adb.to_string_lossy().into_owned());
    manager.locate_adb();
    let tv = Arc::new(Mutex::new(FakeTv {
        installed: [
            "android",
            "com.android.systemui",
            "com.stock.home",
            "com.ecojust.puretv",
            "com.vendor.ads",
            "com.user.app",
        ]
        .into_iter()
        .map(str::to_string)
        .collect(),
        system: [
            "android",
            "com.android.systemui",
            "com.stock.home",
            "com.vendor.ads",
            "com.vendor.removed",
        ]
        .into_iter()
        .map(str::to_string)
        .collect(),
        disabled: ["com.user.app"].into_iter().map(str::to_string).collect(),
        default: "com.stock.home/.Main".into(),
        launchers: vec![
            "com.stock.home/.Main".into(),
            "com.ecojust.puretv/.MainActivity".into(),
        ],
        user: 0,
        status: "device".into(),
        ..FakeTv::default()
    }));
    manager.runner = Box::new(FakeRunner {
        tv: tv.clone(),
        cancel_after_change: None,
    });
    (manager, tv)
}
fn connect(manager: &mut Manager) -> Snapshot {
    manager
        .execute(Request::Connect {
            host: "192.168.1.50".into(),
            port: 5555,
        })
        .unwrap()
}
#[test]
fn remote_arguments_reject_shell_injection() {
    for pkg in [
        "com.foo;reboot",
        "com.foo$(id)",
        "-k",
        "com..foo",
        "com/foo",
        "foo bar",
        "com.1bad",
    ] {
        assert!(!parse::package(pkg), "{pkg}");
    }
    for host in [
        "127.0.0.1; reboot",
        "$(id)",
        "-host",
        "abc\nreboot",
        "1.1.1.1:5555",
    ] {
        assert!(parse::endpoint(host, 5555).is_err(), "{host}");
    }
    assert_eq!(parse::endpoint("::1", 5555).unwrap(), "[::1]:5555");
    assert!(parse::component("com.foo/.Main$Inner"));
    assert_eq!(
        parse::component_arg("com.foo/.Main$Inner"),
        "'com.foo/.Main$Inner'"
    );
}
#[test]
fn scans_classification_recovery_and_protection() {
    let (mut m, _) = fixture();
    let state = connect(&mut m);
    assert_eq!(state.device.unwrap().model, "Test TV");
    assert_eq!(state.packages.iter().filter(|p| p.installed).count(), 6);
    let removed = state
        .packages
        .iter()
        .find(|p| p.package_name == "com.vendor.removed")
        .unwrap();
    assert!(!removed.installed && removed.system);
    assert!(
        !state
            .packages
            .iter()
            .find(|p| p.package_name == "com.user.app")
            .unwrap()
            .enabled
    );
    assert!(state
        .packages
        .iter()
        .find(|p| p.package_name == "com.stock.home")
        .unwrap()
        .protected_reason
        .is_some());
    assert_eq!(state.launchers.len(), 2);
}
#[test]
fn connect_waits_for_authorization_and_never_scans() {
    let (mut m, tv) = fixture();
    tv.lock().unwrap().status = "unauthorized".into();
    let state = connect(&mut m);
    assert_eq!(state.device.unwrap().status, "unauthorized");
    assert!(state.packages.is_empty());
    assert!(m
        .execute(Request::Uninstall {
            packages: vec!["com.vendor.ads".into()]
        })
        .is_err());
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"uninstall".into())));
}
#[test]
fn user_change_blocks_mutation_until_rescan() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    tv.lock().unwrap().user = 10;
    assert!(m
        .execute(Request::Uninstall {
            packages: vec!["com.vendor.ads".into()]
        })
        .unwrap_err()
        .contains("用户已改变"));
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"uninstall".into())));
    assert_eq!(
        m.execute(Request::Scan).unwrap().device.unwrap().user_id,
        10
    );
}
#[test]
fn protected_packages_and_fresh_home_are_never_removed() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    tv.lock().unwrap().default = "com.ecojust.puretv/.MainActivity".into();
    let state = m
        .execute(Request::Uninstall {
            packages: vec!["com.android.systemui".into(), "com.ecojust.puretv".into()],
        })
        .unwrap();
    assert!(state.history.iter().all(|h| !h.success));
    assert_eq!(state.history.len(), 2);
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"uninstall".into())));
}
#[test]
fn unknown_home_blocks_cleanup() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    tv.lock().unwrap().default = "No activities found".into();
    let state = m
        .execute(Request::SetEnabled {
            packages: vec!["com.vendor.ads".into()],
            enabled: false,
        })
        .unwrap();
    assert!(!state.history[0].success);
    assert!(state.history[0].message.contains("默认桌面"));
}
#[test]
fn disabling_then_enabling_restores_default_state() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    let state = m
        .execute(Request::SetEnabled {
            packages: vec!["com.vendor.ads".into()],
            enabled: false,
        })
        .unwrap();
    assert!(
        !state
            .packages
            .iter()
            .find(|p| p.package_name == "com.vendor.ads")
            .unwrap()
            .enabled
    );
    assert_eq!(m.saved.enabled_states[0].state, 0);
    m.execute(Request::SetEnabled {
        packages: vec!["com.vendor.ads".into()],
        enabled: true,
    })
    .unwrap();
    assert!(tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"default-state".into())));
    assert!(m.saved.enabled_states.is_empty());
}
#[test]
fn zero_exit_failure_and_unverified_changes_are_not_successes() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    tv.lock().unwrap().failure = Some("com.vendor.ads".into());
    let state = m
        .execute(Request::Uninstall {
            packages: vec!["com.vendor.ads".into(), "com.user.app".into()],
        })
        .unwrap();
    assert_eq!(state.history.iter().filter(|h| h.success).count(), 1);
    assert_eq!(state.history.iter().filter(|h| !h.success).count(), 1);
    tv.lock().unwrap().failure = None;
    tv.lock().unwrap().ignore_change = true;
    let state = m
        .execute(Request::SetEnabled {
            packages: vec!["com.vendor.ads".into()],
            enabled: false,
        })
        .unwrap();
    assert!(!state.history[0].success);
    assert!(state.history[0].message.contains("复查"));
}
#[test]
fn cancellation_finishes_current_change_and_skips_rest() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    m.runner = Box::new(FakeRunner {
        tv: tv.clone(),
        cancel_after_change: Some(m.cancel.clone()),
    });
    let state = m
        .execute(Request::Uninstall {
            packages: vec!["com.vendor.ads".into(), "com.user.app".into()],
        })
        .unwrap();
    assert_eq!(state.history.len(), 1);
    assert!(state.history[0].success);
    assert!(state.message.contains("未执行 1"));
    assert!(tv.lock().unwrap().installed.contains("com.user.app"));
}
#[test]
fn switching_home_saves_first_home_and_restores_it() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    let state = m
        .execute(Request::SetHome {
            component: "com.ecojust.puretv/.MainActivity".into(),
        })
        .unwrap();
    assert_eq!(
        state.original_home.as_deref(),
        Some("com.stock.home/com.stock.home.Main")
    );
    assert_eq!(m.saved.homes.len(), 1);
    let restarted = read_saved(&m.data_dir);
    assert_eq!(
        restarted.homes[0].component,
        "com.stock.home/com.stock.home.Main"
    );
    let state = m.execute(Request::RestoreHome).unwrap();
    assert_eq!(state.default_home, state.original_home);
    assert_eq!(
        tv.lock().unwrap().default,
        "com.stock.home/com.stock.home.Main"
    );
}
#[test]
fn home_command_success_requires_resolve_verification() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    tv.lock().unwrap().ignore_change = true;
    assert!(m
        .execute(Request::SetHome {
            component: "com.ecojust.puretv/.MainActivity".into()
        })
        .is_err());
    assert!(!m.state.history[0].success);
}
#[test]
fn local_apk_import_preserves_space_path_and_refreshes() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    let path = m.data_dir.join("my app.APK");
    fs::write(&path, b"APK sample").unwrap();
    let state = m
        .execute(Request::Install {
            paths: vec![path.to_string_lossy().into_owned()],
        })
        .unwrap();
    assert!(state.history[0].success);
    assert!(state
        .packages
        .iter()
        .any(|p| p.package_name == "com.imported.app"));
    let tv = tv.lock().unwrap();
    let call = tv
        .calls
        .iter()
        .find(|args| args.get(2).is_some_and(|s| s == "install"))
        .unwrap();
    assert_eq!(&call[3..6], &["--user", "0", "-r"]);
    assert!(call.last().unwrap().contains("my app.APK"));
    assert!(validate_apk("relative.apk").is_err());
    assert!(validate_apk(&m.data_dir.to_string_lossy()).is_err());
}
#[test]
fn restore_only_includes_system_recovery_candidates() {
    let (mut m, _) = fixture();
    connect(&mut m);
    let state = m
        .execute(Request::Restore {
            packages: vec!["com.vendor.removed".into()],
        })
        .unwrap();
    assert!(
        state
            .packages
            .iter()
            .find(|p| p.package_name == "com.vendor.removed")
            .unwrap()
            .installed
    );
    assert!(state.history[0].success);
}
#[test]
fn pairing_code_is_not_in_argv_or_persistent_state() {
    let (mut m, tv) = fixture();
    m.execute(Request::Pair {
        host: "192.168.1.50".into(),
        port: 33111,
        code: "123456".into(),
    })
    .unwrap();
    assert!(tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .flatten()
        .all(|s| !s.contains("123456")));
    m.persist().unwrap();
    assert!(!fs::read_to_string(m.data_dir.join("state.json"))
        .unwrap()
        .contains("123456"));
}
#[test]
fn malformed_outputs_and_missing_saved_file_recover_safely() {
    assert!(parse::packages("Error: permission denied").is_err());
    assert!(parse::packages("package:com.good\npackage:com.bad;id").is_err());
    assert!(check_output(Output {
        code: 0,
        text: "Failure [INSTALL_FAILED]".into()
    })
    .is_err());
    assert!(check_output(Output {
        code: 0,
        text: "java.lang.SecurityException: denied".into()
    })
    .is_err());
    let (mut m, _) = fixture();
    m.persist().unwrap();
    m.persist().unwrap();
    fs::write(m.data_dir.join("state.json"), "bad json").unwrap();
    assert!(read_saved(&m.data_dir).adb_path.is_some());
}
#[test]
fn adb_path_change_keeps_previous_tool_when_configuration_cannot_be_saved() {
    let (mut m, _) = fixture();
    m.persist().unwrap();
    let previous = m.state.adb_path.clone();
    let next = m.data_dir.join(if cfg!(windows) {
        "next-adb.exe"
    } else {
        "next-adb"
    });
    fs::write(&next, "fake").unwrap();
    // A directory at the temporary filename deterministically makes writes fail,
    // including when the test runner has administrator/root privileges.
    fs::create_dir(m.data_dir.join("state.new")).unwrap();
    let error = m
        .execute(Request::SetAdbPath {
            path: next.to_string_lossy().into_owned(),
        })
        .unwrap_err();
    assert!(error.contains("无法写入"));
    assert_eq!(m.saved.adb_path, previous);
    assert_eq!(m.state.adb_path, previous);
    assert_eq!(read_saved(&m.data_dir).adb_path, previous);
    assert!(m.state.adb_available);
    fs::remove_dir_all(&m.data_dir).unwrap();
}
#[test]
fn bridge_contract_uses_camelcase_and_rejects_unknown_actions() {
    let r: Request =
        serde_json::from_str(r#"{"action":"setAdbPath","path":"/usr/bin/adb"}"#).unwrap();
    assert!(matches!(r, Request::SetAdbPath { .. }));
    assert!(
        serde_json::from_str::<Request>(r#"{"action":"executeShell","command":"id"}"#).is_err()
    );
    assert!(
        serde_json::from_str::<Request>(r#"{"action":"connect","host":"x","port":70000}"#).is_err()
    );
    let state = serde_json::to_value(Snapshot::default()).unwrap();
    assert!(state.get("adbPath").is_some());
    assert!(state.get("originalHome").is_some());
}
#[cfg(unix)]
#[test]
fn process_timeout_returns_when_descendant_keeps_pipe_open() {
    let mut runner = ProcessRunner;
    let now = std::time::Instant::now();
    let result = runner.run(
        Path::new("/bin/sh"),
        &["-c".into(), "sleep 3".into()],
        None,
        &AtomicBool::new(false),
        Duration::from_millis(80),
    );
    assert!(result.is_err());
    assert!(now.elapsed() < Duration::from_secs(2));
}

#[test]
fn failed_scan_after_user_change_never_keeps_previous_user_catalogue() {
    let (mut m, tv) = fixture();
    connect(&mut m);
    {
        let mut tv = tv.lock().unwrap();
        tv.user = 10;
        tv.failure = Some("scan".into());
    }
    assert!(m.execute(Request::Scan).is_err());
    assert_eq!(m.state.device.as_ref().unwrap().user_id, 10);
    assert!(m.state.packages.is_empty());
    assert!(m.state.launchers.is_empty());
    assert!(m.state.default_home.is_none());
}
#[test]
fn history_is_bounded_and_saved_without_pairing_data() {
    let (mut m, _) = fixture();
    connect(&mut m);
    for i in 0..205 {
        m.record("test", &format!("com.test.app{i}"), true, "done");
    }
    assert_eq!(m.state.history.len(), 200);
    assert_eq!(read_saved(&m.data_dir).history.len(), 200);
}
#[cfg(unix)]
#[test]
fn process_output_limit_rejects_oversized_stdout() {
    let mut runner = ProcessRunner;
    let result = runner.run(
        Path::new("/bin/sh"),
        &["-c".into(), "head -c 5000000 /dev/zero".into()],
        None,
        &AtomicBool::new(false),
        Duration::from_secs(5),
    );
    assert!(result.unwrap_err().contains("4 MiB"));
}
#[test]
fn real_adb_version_when_explicit_probe_path_is_supplied() {
    let Some(path) = std::env::var_os("PURETV_TEST_ADB") else {
        return;
    };
    let mut runner = ProcessRunner;
    let output = runner
        .run(
            Path::new(&path),
            &["version".into()],
            None,
            &AtomicBool::new(false),
            Duration::from_secs(8),
        )
        .unwrap();
    assert_eq!(output.code, 0);
    assert!(output.text.contains("Android Debug Bridge version"));
}

#[test]
fn failed_connection_to_another_target_drops_old_selected_device() {
    let (mut manager, _) = fixture();
    connect(&mut manager);
    assert!(manager
        .execute(Request::Connect {
            host: "192.168.1.99".into(),
            port: 5555
        })
        .is_err());
    assert!(manager.state.device.is_none());
    assert!(manager.state.packages.is_empty());
}

#[test]
fn authentication_failure_still_shows_device_awaiting_tv_approval() {
    let (mut manager, tv) = fixture();
    {
        let mut tv = tv.lock().unwrap();
        tv.status = "unauthorized".into();
        tv.connect_auth_failure = true;
    }
    let snapshot = connect(&mut manager);
    assert_eq!(snapshot.device.unwrap().status, "unauthorized");
    assert!(snapshot.message.contains("等待电视授权"));
    assert!(snapshot.packages.is_empty());
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"shell".into())));
}

#[test]
fn immediate_cancel_is_not_reset_by_manager_and_caller_can_start_next_task() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    let before = tv.lock().unwrap().calls.len();
    manager.cancel.store(true, Ordering::Relaxed);
    assert!(manager.execute(Request::Scan).unwrap_err().contains("取消"));
    assert_eq!(tv.lock().unwrap().calls.len(), before);
    assert!(manager.cancel.load(Ordering::Relaxed));
    manager.cancel.store(false, Ordering::Relaxed);
    assert!(manager.execute(Request::Scan).is_ok());
}

#[test]
fn full_and_relative_home_components_compare_as_same_activity() {
    let (mut manager, tv) = fixture();
    tv.lock().unwrap().default = "com.stock.home/com.stock.home.Main".into();
    let snapshot = connect(&mut manager);
    assert!(
        snapshot
            .launchers
            .iter()
            .find(|l| l.package_name == "com.stock.home")
            .unwrap()
            .is_default
    );
    assert_eq!(
        parse::components("com.test/.Main\ncom.test/com.test.Main\n"),
        vec!["com.test/com.test.Main"]
    );
    let snapshot = manager
        .execute(Request::SetHome {
            component: "com.ecojust.puretv/.MainActivity".into(),
        })
        .unwrap();
    assert_eq!(
        snapshot.default_home.as_deref(),
        Some("com.ecojust.puretv/com.ecojust.puretv.MainActivity")
    );
    assert!(
        snapshot
            .launchers
            .iter()
            .find(|l| l.package_name == "com.ecojust.puretv")
            .unwrap()
            .is_default
    );
}

#[test]
fn unavailable_home_queries_keep_apps_but_disable_cleanup() {
    let (mut manager, tv) = fixture();
    tv.lock().unwrap().home_failure = true;
    let snapshot = connect(&mut manager);
    assert_eq!(snapshot.packages.iter().filter(|p| p.installed).count(), 6);
    assert!(snapshot.default_home.is_none());
    assert!(snapshot.launchers.is_empty());
    assert!(snapshot.message.contains("停用／卸载暂不可用"));
    let snapshot = manager
        .execute(Request::Uninstall {
            packages: vec!["com.vendor.ads".into()],
        })
        .unwrap();
    assert!(!snapshot.history[0].success);
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"uninstall".into())));
}

#[test]
fn cancellation_during_home_query_propagates_instead_of_becoming_fallback() {
    let (mut manager, tv) = fixture();
    {
        let mut tv = tv.lock().unwrap();
        tv.home_failure = true;
        tv.home_cancelled = true;
    }
    assert!(manager
        .execute(Request::Connect {
            host: "192.168.1.50".into(),
            port: 5555
        })
        .unwrap_err()
        .contains("取消"));
    assert!(manager.state.packages.is_empty());
}

#[test]
fn exception_in_normal_package_name_is_not_an_adb_error() {
    let (mut manager, tv) = fixture();
    tv.lock()
        .unwrap()
        .installed
        .insert("com.example.exceptionhandler".into());
    let snapshot = connect(&mut manager);
    assert!(snapshot
        .packages
        .iter()
        .any(|p| p.package_name == "com.example.exceptionhandler"));
    assert!(check_output(Output {
        code: 0,
        text: "java.lang.SecurityException: denied".into()
    })
    .is_err());
    assert!(check_output(Output {
        code: 0,
        text: "Exception occurred while executing command".into()
    })
    .is_err());
}

#[test]
fn home_retry_cannot_skip_failed_recovery_record_write() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    let blocked = manager.data_dir.join("not-a-directory");
    fs::write(&blocked, "blocked").unwrap();
    manager.data_dir = blocked;
    for _ in 0..2 {
        assert!(manager
            .execute(Request::SetHome {
                component: "com.ecojust.puretv/.MainActivity".into()
            })
            .is_err());
    }
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.contains(&"set-home-activity".into())));
    assert_eq!(tv.lock().unwrap().default, "com.stock.home/.Main");
}

#[test]
fn snapshot_revisions_advance_on_success_and_failure_without_changing_old_snapshots() {
    let (mut manager, _) = fixture();
    let initial = manager.snapshot();
    let state = manager.execute(Request::GetState).unwrap();
    assert!(state.revision > initial.revision);
    assert!(manager
        .execute(Request::Connect {
            host: "invalid;host".into(),
            port: 5555
        })
        .is_err());
    assert!(manager.snapshot().revision > state.revision);
    assert_eq!(initial.revision, 0);
}

#[test]
fn scanning_reports_installed_app_and_launcher_apk_sizes() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    let state = manager.snapshot();
    assert_eq!(
        state
            .packages
            .iter()
            .find(|p| p.package_name == "com.user.app")
            .unwrap()
            .apk_size_bytes,
        Some(3072)
    );
    assert_eq!(
        state
            .packages
            .iter()
            .find(|p| p.package_name == "android")
            .unwrap()
            .apk_size_bytes,
        Some(3072)
    );
    assert!(manager
        .snapshot()
        .launchers
        .iter()
        .all(|home| home.apk_size_bytes == Some(3072)));
    assert!(!tv
        .lock()
        .unwrap()
        .calls
        .iter()
        .any(|args| args.windows(2).any(|pair| pair == ["path", "android"])));
}

#[test]
fn launcher_customization_requires_a_verified_current_adapter_and_reads_back_changes() {
    use crate::LauncherRequest;
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    assert_eq!(
        manager
            .execute_launcher(LauncherRequest::GetLayout)
            .unwrap()["supported"],
        false
    );
    let layout: serde_json::Value =
        serde_json::from_str(include_str!("../../../public/layout-v3.json")).unwrap();
    assert!(manager
        .execute_launcher(LauncherRequest::ApplyLayout {
            layout: layout.clone()
        })
        .is_err());
    tv.lock().unwrap().default = "com.ecojust.puretv/.MainActivity".into();
    assert_eq!(
        manager
            .execute_launcher(LauncherRequest::GetLayout)
            .unwrap()["supported"],
        false
    );
    tv.lock().unwrap().layout_provider = true;
    let status = manager
        .execute_launcher(LauncherRequest::GetLayout)
        .unwrap();
    assert_eq!(status["supported"], true);
    let mut draft = layout;
    draft["home"]["columns"] = serde_json::json!(3);
    assert_eq!(
        manager
            .execute_launcher(LauncherRequest::ApplyLayout {
                layout: draft.clone()
            })
            .unwrap()["layout"],
        draft
    );
    assert_eq!(
        manager
            .execute_launcher(LauncherRequest::GetLayout)
            .unwrap()["layout"]["home"]["columns"],
        3
    );
    assert_eq!(
        manager
            .execute_launcher(LauncherRequest::ResetLayout)
            .unwrap()["custom"],
        false
    );
    assert_eq!(manager.snapshot().history[0].action, "启动器布局");
}
#[test]
fn connected_device_system_info_is_available_and_cleared_on_disconnect() {
    let (mut manager, _) = fixture();
    connect(&mut manager);
    let info = manager.snapshot().system_info.unwrap();
    assert_eq!(info.memory_total_bytes, Some(4194304));
    assert_eq!(info.storage_available_bytes, Some(3145728));
    assert_eq!(info.manufacturer.as_deref(), Some("Test Maker"));
    manager.execute(Request::Disconnect).unwrap();
    assert!(manager.snapshot().system_info.is_none());
}

#[test]
fn install_results_distinguish_original_paths_even_when_basenames_match() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    let first = manager.data_dir.join("first/app.apk");
    let second = manager.data_dir.join("second/app.apk");
    for path in [&first, &second] {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, b"test APK").unwrap();
    }
    let paths = vec![
        first.to_string_lossy().into_owned(),
        second.to_string_lossy().into_owned(),
    ];
    tv.lock().unwrap().failure = Some(
        second
            .canonicalize()
            .unwrap()
            .to_string_lossy()
            .into_owned(),
    );
    let state = manager
        .execute(Request::Install {
            paths: paths.clone(),
        })
        .unwrap();
    assert_eq!(state.install_results.len(), 2);
    assert_eq!(state.install_results[0].path, paths[0]);
    assert_eq!(state.install_results[1].path, paths[1]);
    assert!(state.install_results[0].success);
    assert!(!state.install_results[1].success);
}

#[test]
fn layout_writes_reject_system_disabled_or_missing_user_apps() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    {
        let mut tv = tv.lock().unwrap();
        tv.default = "com.ecojust.puretv/.MainActivity".into();
        tv.layout_provider = true;
    }
    let mut layout: serde_json::Value =
        serde_json::from_str(include_str!("../../../public/layout-v3.json")).unwrap();
    for package in ["com.vendor.ads", "com.user.app", "com.example.missing"] {
        layout["home"]["items"] = serde_json::json!([{"packageName":package}]);
        assert!(manager
            .execute_launcher(crate::LauncherRequest::ApplyLayout {
                layout: layout.clone()
            })
            .is_err());
        assert!(tv.lock().unwrap().launcher_layout.is_none());
    }
    layout["home"]["items"] = serde_json::json!([{"packageName":"com.ecojust.puretv"}]);
    assert!(manager
        .execute_launcher(crate::LauncherRequest::ApplyLayout { layout })
        .is_ok());
}

#[test]
fn connection_addresses_survive_failed_attempts_restart_and_validation() {
    let (mut manager, tv) = fixture();
    tv.lock().unwrap().connect_error =
        Some("failed to connect to '192.168.0.191:5555': No route to host".into());
    let error = manager
        .execute(Request::Connect {
            host: " 192.168.0.191 ".into(),
            port: 5555,
        })
        .unwrap_err();
    assert!(
        error.contains("无法通过局域网到达 192.168.0.191:5555")
            && error.contains("本地网络")
            && error.contains("No route to host"),
        "{error}"
    );
    assert!(manager.snapshot().device.is_none());
    let reloaded = Manager::new(manager.data_dir.clone(), Arc::new(AtomicBool::new(false)));
    let address = reloaded.snapshot().last_connection.unwrap();
    assert_eq!(address.host, "192.168.0.191");
    assert_eq!(address.port, 5555);
    assert!(
        reloaded.snapshot().device.is_none(),
        "Restoring an address never auto-connects"
    );
    assert!(manager
        .execute(Request::Connect {
            host: "new-tv.local".into(),
            port: 37777
        })
        .is_err());
    assert!(manager
        .execute(Request::Connect {
            host: "bad;host".into(),
            port: 5555
        })
        .is_err());
    assert!(manager
        .execute(Request::Connect {
            host: "other-tv.local".into(),
            port: 0
        })
        .is_err());
    let reloaded = Manager::new(manager.data_dir.clone(), Arc::new(AtomicBool::new(false)));
    let address = reloaded.snapshot().last_connection.unwrap();
    assert_eq!(address.host, "new-tv.local");
    assert_eq!(address.port, 37777);
    let calls = &tv.lock().unwrap().calls;
    assert_eq!(calls.iter().filter(|a| a[0] == "connect").count(), 2);
}
#[test]
fn remembered_address_survives_disconnect_and_invalid_saved_address_is_ignored() {
    let (mut manager, _) = fixture();
    connect(&mut manager);
    manager.execute(Request::Disconnect).unwrap();
    let reloaded = Manager::new(manager.data_dir.clone(), Arc::new(AtomicBool::new(false)));
    assert_eq!(
        reloaded.snapshot().last_connection.unwrap().host,
        "192.168.1.50"
    );
    assert!(reloaded.snapshot().device.is_none());
    let path = manager.data_dir.join("state.json");
    let mut saved: serde_json::Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
    saved["last_connection"] = serde_json::json!({"host":"bad;host","port":5555});
    fs::write(&path, saved.to_string()).unwrap();
    let reloaded = Manager::new(manager.data_dir.clone(), Arc::new(AtomicBool::new(false)));
    assert!(reloaded.snapshot().last_connection.is_none());
    assert_eq!(reloaded.saved.adb_path, manager.saved.adb_path);
}
#[test]
fn connection_failures_explain_network_port_and_timeout_without_hiding_details() {
    for (error, expected) in [
        ("No route to host", "无法通过局域网到达"),
        ("unreachable host. (10065)", "无法通过局域网到达"),
        ("Connection refused", "拒绝了 ADB 连接"),
        ("Connection timed out", "超时"),
    ] {
        let message = connection_error("tv.local:5555", error.into());
        assert!(
            message.contains(expected)
                && message.contains("tv.local:5555")
                && message.ends_with(error),
            "{message}"
        );
    }
    assert_eq!(
        connection_error(
            "tv.local:10065",
            "failed to authenticate to tv.local:10065".into()
        ),
        "failed to authenticate to tv.local:10065"
    );
    assert_eq!(
        connection_error("tv.local:5555", "操作已取消".into()),
        "操作已取消"
    );
}

#[test]
fn local_network_refresh_needs_no_adb_and_does_not_change_tv_state() {
    let (mut manager, tv) = fixture();
    manager.saved.adb_path = Some("/missing/adb".into());
    manager.state.adb_available = false;
    let before = manager.snapshot();
    let updated = manager.execute(Request::RefreshLocalNetwork).unwrap();
    assert!(tv.lock().unwrap().calls.is_empty());
    assert!(updated.device.is_none());
    assert_eq!(updated.history.len(), before.history.len());
    assert!(updated.local_network.error.is_none());
    assert!(updated.revision > before.revision);
    assert!(updated
        .local_network
        .addresses
        .iter()
        .all(|address| !address.ip.starts_with("127.") && address.prefix_length <= 32));
}

#[test]
fn duplicate_error_lines_are_shown_once_without_changing_successful_data() {
    let line = "failed to connect to '192.168.0.191:5555': No route to host";
    let error = check_output(Output {
        code: 1,
        text: format!("{line}\n{line}\nMore information"),
    })
    .unwrap_err();
    assert_eq!(error.matches("No route to host").count(), 1);
    assert!(error.contains("More information"));
    let data = "1024\n1024\n";
    assert_eq!(
        check_output(Output {
            code: 0,
            text: data.into()
        })
        .unwrap(),
        data
    );
}

#[test]
fn closing_cleans_adb_even_after_cancellation_and_preserves_saved_address() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    let before = manager.snapshot().last_connection.unwrap();
    manager.cancel.store(true, Ordering::Release);
    manager.shutdown_adb().unwrap();
    assert_eq!(
        tv.lock().unwrap().calls.last().unwrap(),
        &vec!["kill-server".to_string()]
    );
    assert!(manager.snapshot().device.is_none());
    assert!(manager.snapshot().packages.is_empty());
    let reloaded = Manager::new(manager.data_dir.clone(), Arc::new(AtomicBool::new(false)));
    assert_eq!(
        reloaded.snapshot().last_connection.unwrap().host,
        before.host
    );
}
