use super::*;

// These are synthetic command/capability fixtures, using AOSP output formats.
// They are not captures from a physical television and establish no brand claim.
fn legacy_identity(tv: &mut FakeTv, sdk: &str, user: u32) {
    tv.user = user;
    tv.home_failure = true;
    shell_output(tv, &["am", "get-current-user"], 1, KITKAT_AM_USAGE);
    shell_output(tv, &["cmd", "activity", "get-current-user"], 127, "/system/bin/sh: cmd: not found\n");
    shell_output(tv, &["getprop", "ro.build.version.sdk"], 0, sdk);
    shell_output(tv, &["getprop"], 0, &format!("[ro.build.version.sdk]: [{sdk}]\n"));
    let release = match sdk { "21" => "5.0", "22" => "5.1", "23" => "6.0", _ => unreachable!() };
    shell_output(tv, &["getprop", "ro.build.version.release"], 0, release);
    shell_output(
        tv,
        &["dumpsys", "activity", "processes"],
        0,
        &format!("ACTIVITY MANAGER RUNNING PROCESSES\n  mStartedUserArray: [0, {user}, 12]\n  mUserLru: [12, 0, {user}]\n"),
    );
}

fn write_calls(tv: &FakeTv) -> Vec<&Vec<String>> {
    tv.calls.iter().filter(|call| {
        call.get(2).is_some_and(|arg| arg == "install")
            || (call.get(2).is_some_and(|arg| arg == "shell")
                && call.iter().any(|arg| matches!(arg.as_str(),
                    "enable" | "default-state" | "disable-user" | "uninstall"
                    | "install-existing" | "set-home-activity")))
    }).collect()
}

#[test]
fn api21_to_23_reads_current_user_instead_of_background_or_owner_user() {
    for sdk in ["21", "22", "23"] {
        let (mut manager, tv) = fixture();
        legacy_identity(&mut tv.lock().unwrap(), sdk, 10);
        let state = connect(&mut manager);
        assert_eq!(state.device.unwrap().user_id, 10, "SDK {sdk}");
        assert_eq!(state.system_info.unwrap().sdk_version.as_deref(), Some(sdk));
        assert_eq!(state.packages.iter().filter(|p| p.installed).count(), 6);
        let tv = tv.lock().unwrap();
        let lists: Vec<_> = tv.calls.iter().filter(|call| {
            call.len() >= 6 && call[3..6] == ["pm", "list", "packages"]
        }).collect();
        assert_eq!(lists.len(), 4);
        assert!(lists.iter().all(|call| call[call.len() - 2..] == ["--user", "10"]));
        assert!(write_calls(&tv).is_empty());
    }
}

#[test]
fn api21_to_23_user_switch_blocks_writes_until_the_new_user_is_scanned() {
    for sdk in ["21", "22", "23"] {
        let (mut manager, tv) = fixture();
        legacy_identity(&mut tv.lock().unwrap(), sdk, 10);
        connect(&mut manager);
        legacy_identity(&mut tv.lock().unwrap(), sdk, 11);
        let error = manager.execute(Request::SetEnabled {
            packages: vec!["com.user.app".into()], enabled: true,
        }).unwrap_err();
        assert!(error.contains("用户已改变"), "SDK {sdk}: {error}");
        assert!(write_calls(&tv.lock().unwrap()).is_empty());
        let state = manager.execute(Request::Scan).unwrap();
        assert_eq!(state.device.unwrap().user_id, 11);
        assert_eq!(state.packages.iter().filter(|p| p.installed).count(), 6);
    }
}

#[test]
fn api21_to_23_rejects_ambiguous_or_invalid_current_user_history() {
    for sdk in ["21", "22", "23"] {
        for dump in [
            "mStartedUserArray: [0, 10]\n",
            "mUserLru: [0, 10]\nmUserLru: [10, 0]\n",
            "mUserLru: [0, -1]\n",
            "mUserLru: [0, 2147483648]\n",
        ] {
            let (mut manager, tv) = fixture();
            {
                let mut tv = tv.lock().unwrap();
                legacy_identity(&mut tv, sdk, 10);
                shell_output(&mut tv, &["dumpsys", "activity", "processes"], 0, dump);
            }
            assert!(manager.execute(Request::Connect {
                host: "192.168.1.50".into(), port: 5555,
            }).unwrap_err().contains("无法确认电视的当前用户"), "SDK {sdk}: {dump}");
            assert!(manager.snapshot().system_info.is_some());
            assert!(manager.snapshot().packages.is_empty());
            let tv = tv.lock().unwrap();
            assert!(!tv.calls.iter().any(|call| call.iter().any(|arg| arg == "packages")));
            assert!(write_calls(&tv).is_empty());
        }
    }
}

#[test]
fn api24_and_25_use_am_without_probing_legacy_history_or_cmd() {
    for sdk in ["24", "25"] {
        let (mut manager, tv) = fixture();
        {
            let mut tv = tv.lock().unwrap();
            tv.user = 10;
            shell_output(&mut tv, &["getprop"], 0, &format!("[ro.build.version.sdk]: [{sdk}]\n"));
            shell_output(&mut tv, &["getprop", "ro.build.version.release"], 0, if sdk == "24" { "7.0" } else { "7.1" });
            shell_output(&mut tv, &["cmd", "activity", "get-current-user"], 0, "99\n");
            shell_output(&mut tv, &["dumpsys", "activity", "processes"], 0, "mUserLru: [0, 99]\n");
        }
        assert_eq!(connect(&mut manager).device.unwrap().user_id, 10);
        let tv = tv.lock().unwrap();
        assert!(!tv.calls.iter().any(|call| is_shell_call(call, &["cmd", "activity", "get-current-user"])));
        assert!(!tv.calls.iter().any(|call| is_shell_call(call, &["getprop", "ro.build.version.sdk"])));
        assert!(!tv.calls.iter().any(|call| is_shell_call(call, &["dumpsys", "activity", "processes"])));
    }
}

#[test]
fn modern_cmd_user_capability_recovers_from_unsupported_am_without_legacy_dump() {
    // Capability boundaries and a middle release, not a claim about every OEM.
    for sdk in ["26", "30", "36"] {
        let (mut manager, tv) = fixture();
        {
            let mut tv = tv.lock().unwrap();
            tv.user = 10;
            shell_output(&mut tv, &["getprop"], 0, &format!("[ro.build.version.sdk]: [{sdk}]\n"));
            let release = match sdk { "26" => "8.0", "30" => "11", "36" => "16", _ => unreachable!() };
            shell_output(&mut tv, &["getprop", "ro.build.version.release"], 0, release);
            shell_output(&mut tv, &["am", "get-current-user"], 0, KITKAT_AM_USAGE);
            shell_output(&mut tv, &["cmd", "activity", "get-current-user"], 0, "10\n");
            shell_output(&mut tv, &["dumpsys", "activity", "processes"], 0, "mUserLru: [0, 99]\n");
        }
        assert_eq!(connect(&mut manager).device.unwrap().user_id, 10, "SDK {sdk}");
        let tv = tv.lock().unwrap();
        let am = tv.calls.iter().position(|call| is_shell_call(call, &["am", "get-current-user"])).unwrap();
        let cmd = tv.calls.iter().position(|call| is_shell_call(call, &["cmd", "activity", "get-current-user"])).unwrap();
        assert!(am < cmd);
        assert!(!tv.calls.iter().any(|call| is_shell_call(call, &["dumpsys", "activity", "processes"])));
    }
}

#[test]
fn unsupported_legacy_shell_writes_never_drop_user_scope_or_change_command() {
    for sdk in ["19", "23"] {
      for operation in ["restore", "default-state", "uninstall"] {
        let (mut manager, tv) = fixture();
        {
            let mut tv = tv.lock().unwrap();
            if sdk == "19" { kitkat(&mut tv, 10); } else { legacy_identity(&mut tv, sdk, 10); }
            // Synthetic hybrid capability: readable HOME with old write commands.
            // This exercises the write check independently of the HOME guard.
            tv.home_failure = false;
        }
        connect(&mut manager);
        let (request, args, code, response) = match operation {
            "restore" => (
                Request::Restore { packages: vec!["com.vendor.removed".into()] },
                vec!["cmd", "package", "install-existing", "--user", "10", "com.vendor.removed"],
                127, "/system/bin/sh: cmd: not found\n",
            ),
            "default-state" => {
                manager.saved.enabled_states.push(EnabledState {
                    key: device_key(manager.state.device.as_ref().unwrap()),
                    package: "com.user.app".into(), state: 0,
                });
                (
                    Request::SetEnabled { packages: vec!["com.user.app".into()], enabled: true },
                    vec!["pm", "default-state", "--user", "10", "com.user.app"],
                    0, "Error: unknown command 'default-state'\n",
                )
            }
            _ => (
                Request::Uninstall { packages: vec!["com.vendor.ads".into()] },
                vec!["pm", "uninstall", "-k", "--user", "10", "com.vendor.ads"],
                0, "Error: Unknown option: --user\n",
            ),
        };
        let (installed, disabled) = {
            let mut tv = tv.lock().unwrap();
            shell_output(&mut tv, &args, code, response);
            (tv.installed.clone(), tv.disabled.clone())
        };
        let state = manager.execute(request).unwrap();
        assert!(!state.history[0].success, "{operation}");
        let tv = tv.lock().unwrap();
        assert_eq!(tv.installed, installed);
        assert_eq!(tv.disabled, disabled);
        let writes = write_calls(&tv);
        assert_eq!(writes.len(), 1, "No fallback write is permitted: {operation}");
        assert!(is_shell_call(writes[0], &args));
        if operation == "default-state" {
            assert!(manager.saved.enabled_states.iter().any(|entry| entry.package == "com.user.app"));
        }
      }
    }
}

#[test]
fn api23_install_with_user_scope_is_verified_without_activating_a_home() {
    let (mut manager, tv) = fixture();
    legacy_identity(&mut tv.lock().unwrap(), "23", 10);
    connect(&mut manager);
    let path = manager.data_dir.join("compatible.apk");
    fs::write(&path, b"synthetic install-capable APK fixture").unwrap();
    tv.lock().unwrap().calls.clear();
    let state = manager.execute(Request::Install {
        paths: vec![path.to_string_lossy().into_owned()],
    }).unwrap();
    assert!(state.install_results[0].success);
    assert!(state.history[0].success);
    assert_eq!(state.history[0].user_id, 10);
    assert_eq!(state.device.unwrap().user_id, 10);
    assert!(state.packages.iter().any(|p| p.package_name == "com.imported.app" && p.installed));
    assert!(state.default_home.is_none());
    assert!(state.launchers.is_empty());
    let tv = tv.lock().unwrap();
    let writes = write_calls(&tv);
    assert_eq!(writes.len(), 1, "Installation must not change HOME or disable another package");
    assert_eq!(writes[0][2..6], ["install", "--user", "10", "-r"]);
    let installed_at = tv.calls.iter().position(|call| call.get(2).is_some_and(|arg| arg == "install")).unwrap();
    let after = &tv.calls[installed_at + 1..];
    assert!(after.iter().any(|call| is_shell_call(call, &["dumpsys", "activity", "processes"])));
    let refreshed: Vec<_> = after.iter().filter(|call| {
        call.len() >= 6 && call[3..6] == ["pm", "list", "packages"]
    }).collect();
    assert_eq!(refreshed.len(), 4);
    assert!(refreshed.iter().all(|call| call[call.len() - 2..] == ["--user", "10"]));
    assert!(!tv.calls.iter().any(|call| call.len() >= 5 && call[3..5] == ["am", "start"]));
}

#[test]
fn api23_missing_package_path_keeps_catalogue_without_stale_or_invented_sizes() {
    let (mut manager, tv) = fixture();
    legacy_identity(&mut tv.lock().unwrap(), "23", 10);
    let initial = connect(&mut manager);
    assert!(initial.packages.iter().filter(|p| p.installed).all(|p| p.apk_size_bytes.is_some()));
    let path_calls: Vec<_> = tv.lock().unwrap().calls.iter().filter(|call| {
        call.get(3).is_some_and(|arg| arg == "sh")
            && call.last().is_some_and(|script| script.contains("pm path"))
    }).cloned().collect();
    assert!(!path_calls.is_empty());
    {
        let mut tv = tv.lock().unwrap();
        for call in &path_calls {
            tv.shell_responses.insert(call[3..].to_vec(), Ok((0, "Error: unknown command 'path'\n".into())));
        }
        tv.calls.clear();
    }
    let state = manager.execute(Request::Scan).unwrap();
    assert_eq!(state.device.unwrap().user_id, 10);
    assert_eq!(state.packages.iter().filter(|p| p.installed).count(), 6);
    assert!(state.system_info.is_some());
    assert!(state.packages.iter().all(|p| p.apk_size_bytes.is_none()));
    let tv = tv.lock().unwrap();
    assert_eq!(tv.calls.iter().filter(|call| call.last().is_some_and(|script| script.contains("pm path"))).count(), path_calls.len());
    for call in &tv.calls {
        if call.last().is_some_and(|script| script.contains("pm path")) {
            assert!(call.last().unwrap().contains("pm path --user 10"));
        }
        assert!(!(call.len() >= 5 && call[3..5] == ["pm", "path"]), "No unscoped path fallback");
        assert!(!call.last().is_some_and(|script| script.contains("stat -c")));
    }
    assert!(write_calls(&tv).is_empty());
}

#[test]
fn unsupported_legacy_install_user_option_preserves_apk_without_unscoped_retry() {
    for code in [0, 1] {
        let (mut manager, tv) = fixture();
        kitkat(&mut tv.lock().unwrap(), 10);
        connect(&mut manager);
        let path = manager.data_dir.join("incompatible.apk");
        fs::write(&path, b"synthetic APK fixture").unwrap();
        let installed = tv.lock().unwrap().installed.clone();
        tv.lock().unwrap().install_response = Some(Ok((code, "Error: Unknown option: --user\n".into())));
        let state = manager.execute(Request::Install {
            paths: vec![path.to_string_lossy().into_owned()],
        }).unwrap();
        assert!(!state.install_results[0].success);
        assert!(state.install_results[0].message.contains("Unknown option: --user"));
        assert_eq!(state.install_results[0].path, path.to_string_lossy());
        assert!(path.is_file());
        let tv = tv.lock().unwrap();
        assert_eq!(tv.installed, installed);
        let writes = write_calls(&tv);
        assert_eq!(writes.len(), 1);
        assert_eq!(writes[0][2..6], ["install", "--user", "10", "-r"]);
    }
}

#[test]
fn home_policy_denial_preserves_factory_home_and_does_not_try_other_writes() {
    let (mut manager, tv) = fixture();
    connect(&mut manager);
    let args = ["cmd", "package", "set-home-activity", "--user", "0", "'com.ecojust.puretv/com.ecojust.puretv.MainActivity'"];
    shell_output(&mut tv.lock().unwrap(), &args, 0, "java.lang.SecurityException: Changing HOME is not allowed by policy\n");
    assert!(manager.execute(Request::SetHome {
        component: "com.ecojust.puretv/.MainActivity".into(),
    }).is_err());
    let state = manager.snapshot();
    assert!(!state.history[0].success);
    assert_eq!(state.default_home.as_deref(), Some("com.stock.home/com.stock.home.Main"));
    assert!(state.packages.iter().find(|p| p.package_name == "com.stock.home").unwrap().protected_reason.is_some());
    let tv = tv.lock().unwrap();
    let writes = write_calls(&tv);
    assert_eq!(writes.len(), 1);
    assert!(is_shell_call(writes[0], &args));
}

#[test]
fn ambiguous_home_keeps_catalogue_but_blocks_disable_and_uninstall() {
    for response in [
        "com.stock.home/.Main\ncom.ecojust.puretv/.MainActivity\n",
        "android/ResolverActivity\ncom.stock.home/.Main\n",
    ] {
        let (mut manager, tv) = fixture();
        shell_output(&mut tv.lock().unwrap(), &[
            "cmd", "package", "resolve-activity", "--brief", "--user", "0",
            "-a", "android.intent.action.MAIN", "-c", "android.intent.category.HOME",
        ], 0, response);
        let state = connect(&mut manager);
        assert_eq!(state.packages.iter().filter(|p| p.installed).count(), 6);
        assert!(state.default_home.is_none());
        for request in [
            Request::SetEnabled { packages: vec!["com.vendor.ads".into()], enabled: false },
            Request::Uninstall { packages: vec!["com.vendor.ads".into()] },
        ] {
            let state = manager.execute(request).unwrap();
            assert!(!state.history[0].success);
            assert!(state.history[0].message.contains("默认桌面"));
        }
        assert!(write_calls(&tv.lock().unwrap()).is_empty());
    }
}
