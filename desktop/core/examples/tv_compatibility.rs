//! E3 integration harness for disposable, isolated GitHub Actions emulators.
//! APK inputs must be the fixtures produced and verified by the CI fixture builder.
//! This is not a general-purpose device test and never certifies physical TVs.
use puretv_core::{Manager, Request, Snapshot};
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::env;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::{atomic::AtomicBool, mpsc, Arc};
use std::thread;
use std::time::{Duration, Instant};

const EMULATOR: &str = "emulator-5554";
const TARGET: &str = "127.0.0.1:5555";
const FIXTURE: &str = "org.puretv.compatfixture";
const KITKAT_DALVIK_WARNING: &str = "WARNING: linker: libdvm.so has text relocations. This is wasting memory and is a security risk. Please fix.";
const OUTPUT_LIMIT: usize = 2 * 1024 * 1024;
type Check<T> = Result<T, String>;

struct Options {
    adb: PathBuf,
    sdk: u32,
    v1: PathBuf,
    v2: PathBuf,
    report: PathBuf,
}

fn require(condition: bool, message: &str) -> Check<()> {
    if condition { Ok(()) } else { Err(message.into()) }
}

fn options() -> Check<Options> {
    let mut values = std::collections::BTreeMap::new();
    let mut args = env::args_os().skip(1);
    while let Some(key) = args.next() {
        let key = key.into_string().map_err(|_| "Invalid argument name")?;
        require(
            ["--adb", "--expected-sdk", "--fixture-v1", "--fixture-v2", "--report"].contains(&key.as_str()),
            "Unknown argument; provide --adb, --expected-sdk, --fixture-v1, --fixture-v2, --report",
        )?;
        let value = args.next().ok_or("Missing argument value")?;
        require(values.insert(key, value).is_none(), "Duplicate argument")?;
    }
    let mut take = |name| values.remove(name).ok_or_else(|| format!("Missing {name}"));
    let adb = PathBuf::from(take("--adb")?);
    let sdk = take("--expected-sdk")?.into_string().map_err(|_| "Invalid SDK")?;
    require(["19", "23", "30"].contains(&sdk.as_str()), "Only SDK19, SDK23 and SDK30 are eligible")?;
    Ok(Options {
        adb,
        sdk: sdk.parse().map_err(|_| "Invalid SDK")?,
        v1: PathBuf::from(take("--fixture-v1")?),
        v2: PathBuf::from(take("--fixture-v2")?),
        report: PathBuf::from(take("--report")?),
    })
}

fn output_reader(mut pipe: impl Read + Send + 'static) -> mpsc::Receiver<Check<Vec<u8>>> {
    let (sender, receiver) = mpsc::sync_channel(1);
    thread::spawn(move || {
        let mut bytes = Vec::new();
        let result = pipe.by_ref().take((OUTPUT_LIMIT + 1) as u64).read_to_end(&mut bytes)
            .map_err(|_| "Could not read ADB output".into())
            .and_then(|_| {
                require(bytes.len() <= OUTPUT_LIMIT, "ADB output exceeded 2 MiB")?;
                Ok(bytes)
            });
        // This reader owns and closes its pipe; no cross-thread close or join.
        let _ = sender.send(result);
    });
    receiver
}

fn adb(options: &Options, args: &[&str]) -> Check<String> {
    let mut child = Command::new(&options.adb).args(args).stdin(Stdio::null())
        .stdout(Stdio::piped()).stderr(Stdio::piped()).spawn()
        .map_err(|e| format!("Could not start selected ADB: {e}"))?;
    let stdout = output_reader(child.stdout.take().ok_or("Missing ADB stdout")?);
    let stderr = output_reader(child.stderr.take().ok_or("Missing ADB stderr")?);
    let deadline = Instant::now() + Duration::from_secs(20);
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if Instant::now() < deadline => thread::sleep(Duration::from_millis(20)),
            state => {
                let _ = child.kill();
                // Reap without an unbounded wait, even on a broken host.
                let reap_deadline = Instant::now() + Duration::from_secs(1);
                while matches!(child.try_wait(), Ok(None)) && Instant::now() < reap_deadline {
                    thread::sleep(Duration::from_millis(20));
                }
                return Err(if state.is_err() { "Could not poll ADB" } else { "ADB read timed out" }.into());
            }
        }
    };
    let receive = |receiver: mpsc::Receiver<Check<Vec<u8>>>| -> Check<String> {
        let bytes = receiver.recv_timeout(Duration::from_millis(300))
            .map_err(|_| "ADB output pipe did not close within the bound")??;
        String::from_utf8(bytes).map_err(|_| "ADB returned invalid UTF-8".into())
    };
    let output = receive(stdout)?;
    let error = receive(stderr)?;
    require(status.success(), &format!("ADB command failed: {}", error.chars().take(600).collect::<String>()))?;
    Ok(output)
}

fn shell(options: &Options, serial: &str, command: &[&str]) -> Check<String> {
    let mut args = vec!["-s", serial, "shell"];
    args.extend(command);
    adb(options, &args)
}

fn property(options: &Options, serial: &str, name: &str) -> Check<String> {
    let value = shell(options, serial, &["getprop", name])?;
    let value = value.trim();
    require(!value.is_empty() && value.len() <= 200 && !value.chars().any(char::is_control), "Invalid property value")?;
    Ok(value.into())
}

fn verify_devices(options: &Options, connected: bool) -> Check<()> {
    let output = adb(options, &["devices", "-l"])?;
    let mut lines = output.lines().map(str::trim).filter(|line| !line.is_empty());
    require(lines.next() == Some("List of devices attached"), "Unrecognized ADB device list")?;
    let mut seen = BTreeSet::new();
    for line in lines {
        let fields = line.split_whitespace().collect::<Vec<_>>();
        require(fields.len() >= 2 && fields[1] == "device", "An ADB target is not authorized and online")?;
        require(fields[0] == EMULATOR || (connected && fields[0] == TARGET), "Unexpected ADB device; refusing any manager operation")?;
        require(seen.insert(fields[0]), "Duplicate ADB device")?;
    }
    require(seen.contains(if connected { TARGET } else { EMULATOR }), "Expected emulator transport is absent")
}

fn verify_emulator(options: &Options, serial: &str) -> Check<()> {
    require(property(options, serial, "ro.kernel.qemu")? == "1", "Target is not a QEMU emulator")?;
    require(property(options, serial, "ro.build.version.sdk")? == options.sdk.to_string(), "Actual SDK differs from --expected-sdk")
}

fn verify_user_zero(options: &Options) -> Check<&'static str> {
    if options.sdk == 30 {
        require(shell(options, TARGET, &["am", "get-current-user"])?.trim() == "0", "Actual current Android user is not exactly 0")?;
        return Ok("am get-current-user");
    }
    let output = shell(options, TARGET, &["dumpsys", "activity", "processes"])?;
    let fields = output.lines().filter_map(|line| line.trim().strip_prefix("mUserLru:")).collect::<Vec<_>>();
    require(fields.len() == 1, "Legacy user identity is absent or ambiguous")?;
    let list = fields[0].trim().strip_prefix('[').and_then(|value| value.strip_suffix(']')).ok_or("Invalid mUserLru")?;
    let mut seen = BTreeSet::new();
    let mut last = None;
    for token in list.split(',') {
        let token = token.trim();
        require(!token.is_empty() && token.bytes().all(|b| b.is_ascii_digit()) && token.len() <= 10, "Invalid user ID")?;
        let user: u32 = token.parse().map_err(|_| "Invalid user ID")?;
        require(user <= i32::MAX as u32 && seen.len() < 1024 && seen.insert(user), "Ambiguous user list")?;
        last = Some(user);
    }
    require(last == Some(0), "Actual legacy current Android user is not 0")?;
    Ok("SDK19/23 dumpsys activity processes mUserLru")
}

fn guard_mutation(options: &Options) -> Check<()> {
    verify_devices(options, true)?;
    verify_emulator(options, TARGET)?;
    verify_user_zero(options)?;
    Ok(())
}

fn fixture_installed(options: &Options) -> Check<bool> {
    let output = shell(options, TARGET, &["pm", "list", "packages", "--user", "0", FIXTURE])?;
    fixture_listing(&output, options.sdk)
}

fn fixture_listing(output: &str, sdk: u32) -> Check<bool> {
    let mut installed = false;
    for line in output.lines().map(str::trim).filter(|line| !line.is_empty()) {
        // Android 4.4's verified Dalvik diagnostic is emitted even when this
        // filtered package query succeeds. No other warning or SDK is exempt.
        if sdk == 19 && line == KITKAT_DALVIK_WARNING { continue; }
        let package = line.strip_prefix("package:").ok_or("Unrecognized package listing")?;
        require(package.split('.').all(|part| !part.is_empty() && part.as_bytes()[0].is_ascii_alphabetic()
            && part.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'_')), "Invalid package listing")?;
        installed |= package == FIXTURE;
    }
    Ok(installed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kitkat_fixture_oracle_accepts_only_the_verified_dalvik_diagnostic() {
        assert_eq!(fixture_listing(KITKAT_DALVIK_WARNING, 19).unwrap(), false);
        assert_eq!(fixture_listing(&format!("{KITKAT_DALVIK_WARNING}\npackage:{FIXTURE}\n"), 19).unwrap(), true);
        assert_eq!(fixture_listing(&format!("{KITKAT_DALVIK_WARNING}\npackage:{FIXTURE}.other\n"), 19).unwrap(), false);
        assert!(fixture_listing(KITKAT_DALVIK_WARNING, 23).is_err());
        for warning in [
            "WARNING: something unexpected",
            "Error: package manager unavailable",
            "package:",
            "WARNING: linker: libother.so has text relocations. This is wasting memory and is a security risk. Please fix.",
        ] {
            assert!(fixture_listing(&format!("{KITKAT_DALVIK_WARNING}\n{warning}\npackage:{FIXTURE}"), 19).is_err());
        }
    }
}

fn fixture_dump(options: &Options, version: u32, enabled: bool) -> Check<Value> {
    let output = shell(options, TARGET, &["dumpsys", "package", FIXTURE])?;
    let header = format!("Package [{FIXTURE}] (");
    let mut sections = 0;
    let mut inside = false;
    let mut indent = 0;
    let mut versions = Vec::new();
    let mut users = Vec::new();
    for line in output.lines().filter(|line| !line.trim().is_empty()) {
        let trimmed = line.trim_start();
        let current_indent = line.len() - trimmed.len();
        if trimmed.starts_with(&header) {
            sections += 1;
            inside = true;
            indent = current_indent;
            continue;
        }
        if current_indent <= indent { inside = false; }
        if inside && trimmed.starts_with("versionCode=") {
            versions.push(trimmed.split_whitespace().next().unwrap_or_default());
        }
        if inside && trimmed.starts_with("User 0:") { users.push(trimmed); }
    }
    require(sections == 1 && versions == [format!("versionCode={version}")], "Fixture versionCode readback is missing, ambiguous or incorrect")?;
    require(users.len() == 1, "Fixture user-0 readback is missing or ambiguous")?;
    let fields = users[0].split_whitespace().collect::<Vec<_>>();
    require(fields.contains(&"installed=true"), "Fixture is not installed for user 0")?;
    let states = fields.iter().filter_map(|field| field.strip_prefix("enabled=")).collect::<Vec<_>>();
    require(states.len() == 1 && if enabled { ["0", "1"].contains(&states[0]) } else { states[0] == "3" }, "Fixture enabled state does not match the requested state")?;
    Ok(json!({"package": FIXTURE, "versionCode": version, "userId": 0, "installed": true, "enabledState": states[0]}))
}

fn snapshot_facts(snapshot: &Snapshot) -> Value {
    json!({"device": snapshot.device, "systemInfo": snapshot.system_info,
        "installedPackageCount": snapshot.packages.iter().filter(|package| package.installed).count(),
        "catalogueCount": snapshot.packages.len(), "launcherCount": snapshot.launchers.len(),
        "defaultHome": snapshot.default_home})
}

fn verify_snapshot(snapshot: &Snapshot, options: &Options) -> Check<Value> {
    let device = snapshot.device.as_ref().ok_or("Manager has no device")?;
    require(device.serial == TARGET && device.status == "device" && device.user_id == 0, "Manager did not verify the expected transport and user")?;
    require(device.model == property(options, TARGET, "ro.product.model")?
        && device.android_version == property(options, TARGET, "ro.build.version.release")?,
        "Manager device identity disagrees with actual emulator properties")?;
    let info = snapshot.system_info.as_ref().ok_or("Manager has no system information")?;
    require(info.sdk_version.as_deref() == Some(options.sdk.to_string().as_str()), "Manager SDK differs from actual SDK")?;
    for (total, available) in [(info.memory_total_bytes, info.memory_available_bytes), (info.storage_total_bytes, info.storage_available_bytes)] {
        require(total.is_some_and(|n| n > 0) && available.zip(total).is_some_and(|(free, all)| free <= all), "Manager memory or /data information is missing or invalid")?;
    }
    let installed = snapshot.packages.iter().filter(|package| package.installed).count();
    require(installed > 0, "Manager returned an empty installed catalogue")?;
    Ok(snapshot_facts(snapshot))
}

fn failure_diagnostics(options: &Options) -> Value {
    // A failed Manager command must not send diagnostics to an unverified or
    // changed device. These extra reads are fixed, bounded and never mutate it.
    if let Err(error) = guard_mutation(options) {
        return json!({"status": "NOT_RUN", "reason": error.chars().take(600).collect::<String>()});
    }
    let mut diagnostics = json!({"status": "COLLECTED", "targetVerified": true});
    for (name, command) in [
        ("dfK", vec!["df", "-k", "/data"]),
        ("df", vec!["df", "/data"]),
        ("statFs", vec!["stat", "-f", "-c", "%S:%b:%a", "/data"]),
        ("memory", vec!["cat", "/proc/meminfo"]),
        ("packages", vec!["pm", "list", "packages", "--user", "0"]),
    ] {
        diagnostics[name] = match shell(options, TARGET, &command) {
            Err(error) => json!({"error": error.chars().take(600).collect::<String>()}),
            Ok(text) if name == "packages" => {
                let lines = text.lines().map(str::trim).filter(|line| !line.is_empty()).collect::<Vec<_>>();
                let warnings = lines.iter().filter(|line| line.starts_with("WARNING: linker:"))
                    .take(4).map(|line| line.chars().take(300).collect::<String>()).collect::<Vec<_>>();
                json!({"lineCount": lines.len(), "packageLineCount": lines.iter().filter(|line| line.starts_with("package:")).count(),
                    "nonPackageLineCount": lines.iter().filter(|line| !line.starts_with("package:")).count(), "linkerWarnings": warnings})
            }
            Ok(text) if name == "memory" => {
                let fields = text.lines().filter(|line| ["MemTotal:", "MemAvailable:", "MemFree:", "Buffers:", "Cached:"]
                    .iter().any(|prefix| line.starts_with(prefix)))
                    .take(8).map(|line| line.chars().take(100).collect::<String>()).collect::<Vec<_>>();
                json!({"selectedFields": fields})
            }
            Ok(text) => json!({"output": text.chars().take(2000).collect::<String>(), "truncated": text.chars().count() > 2000}),
        };
    }
    diagnostics
}

fn fixture_state(snapshot: &Snapshot, installed: bool, enabled: bool) -> Check<()> {
    let package = snapshot.packages.iter().find(|package| package.package_name == FIXTURE);
    require(if installed { package.is_some_and(|p| p.installed && p.enabled == enabled && !p.system) }
        else { package.is_none_or(|p| !p.installed) }, "Manager fixture state did not match readback")
}

fn record(report: &mut Value, name: &str, status: &str, data: Value) {
    report["steps"].as_array_mut().expect("report steps").push(json!({"name": name, "status": status, "data": data}));
}

fn install(options: &Options, manager: &mut Manager, path: &Path) -> Check<Snapshot> {
    guard_mutation(options)?;
    let snapshot = manager.execute(Request::Install { paths: vec![path.to_str().ok_or("Non-UTF-8 fixture path")?.into()] })?;
    require(snapshot.install_results.len() == 1, "Manager did not return exactly one install result")?;
    Ok(snapshot)
}

fn fixture_action(options: &Options, manager: &mut Manager, request: Request, expected_success: bool) -> Check<Snapshot> {
    guard_mutation(options)?;
    let previous = manager.snapshot().history.iter().map(|entry| entry.id.clone()).collect::<BTreeSet<_>>();
    let snapshot = manager.execute(request)?;
    let added = snapshot.history.iter().filter(|entry| !previous.contains(&entry.id)).collect::<Vec<_>>();
    require(added.len() == 1 && added[0].target == FIXTURE && added[0].success == expected_success,
        &format!("Manager did not record the expected fixture action result: {added:?}"))?;
    if !expected_success {
        require(added[0].message.contains("无法确认当前默认桌面"), "Action failed for a reason other than the HOME protection")?;
    }
    Ok(snapshot)
}

fn run(options: &Options, report: &mut Value) -> Check<()> {
    report["activeStep"] = json!("isolated-emulator-guard");
    require(env::var("PURETV_EMULATOR_TEST").as_deref() == Ok("1") && env::var("GITHUB_ACTIONS").as_deref() == Ok("true"), "Requires PURETV_EMULATOR_TEST=1 and GITHUB_ACTIONS=true; no device commands were run")?;
    require(cfg!(target_os = "linux"), "This harness is restricted to the isolated Linux CI emulator job")?;
    for name in ["ADB_SERVER_SOCKET", "ANDROID_ADB_SERVER_ADDRESS", "ANDROID_ADB_SERVER_PORT", "ADB_SERVER_PORT"] {
        require(env::var_os(name).is_none(), "Custom ADB server configuration is not permitted")?;
    }
    require(options.adb.is_file(), "Selected ADB is not a file")?;
    for fixture in [&options.v1, &options.v2] {
        let metadata = fs::metadata(fixture).map_err(|_| "Fixture APK is missing")?;
        require(metadata.is_file() && metadata.len() > 0 && metadata.len() <= 1024 * 1024 && fixture.extension().is_some_and(|ext| ext == "apk"), "Expected a small CI fixture APK")?;
    }
    require(fs::canonicalize(&options.v1).map_err(|e| e.to_string())? != fs::canonicalize(&options.v2).map_err(|e| e.to_string())?, "Fixture versions must be separate files")?;
    verify_devices(options, false)?;
    verify_emulator(options, EMULATOR)?;
    record(report, "isolated-emulator-guard", "PASS", json!({"initialSerial": EMULATOR, "qemu": "1", "sdk": options.sdk}));

    let data_dir = options.report.with_extension("manager-state");
    fs::create_dir(&data_dir).map_err(|e| format!("Manager requires a fresh isolated state directory: {e}"))?;
    let mut manager = Manager::new(data_dir, Arc::new(AtomicBool::new(false)));
    report["activeStep"] = json!("manager-connect");
    manager.execute(Request::SetAdbPath { path: options.adb.to_str().ok_or("Non-UTF-8 ADB path")?.into() })?;
    // Preflight already established an actual QEMU target and SDK. Record E3
    // when the real production operation starts, even if its parser later fails.
    report["emulatorTested"] = json!(true);
    report["evidenceLevel"] = json!("E3");
    let connected = manager.execute(Request::Connect { host: "127.0.0.1".into(), port: 5555 });
    report["latestManagerSnapshot"] = snapshot_facts(&manager.snapshot());
    let snapshot = connected?;
    guard_mutation(options)?;
    report["device"] = verify_snapshot(&snapshot, options)?;
    record(report, "manager-connect", "PASS", json!({"currentUserSource": verify_user_zero(options)?, "currentUser": 0}));

    for (name, request) in [("manager-scan", Request::Scan), ("manager-refresh-system-info", Request::RefreshSystemInfo)] {
        report["activeStep"] = json!(name);
        let refreshed = manager.execute(request);
        report["latestManagerSnapshot"] = snapshot_facts(&manager.snapshot());
        let snapshot = refreshed?;
        record(report, name, "PASS", verify_snapshot(&snapshot, options)?);
    }
    require(!fixture_installed(options)?, "Fixture already exists; emulator is not a fresh test sample")?;
    fixture_state(&manager.snapshot(), false, false)?;
    report["activeStep"] = json!("fixture-install-v1");
    let snapshot = install(options, &mut manager, &options.v1)?;
    report["installV1"] = json!(snapshot.install_results);
    if options.sdk == 19 {
        let result = &snapshot.install_results[0];
        require(!result.success && result.message.contains("--user") && result.message.to_ascii_lowercase().contains("unknown option"),
            &format!("SDK19 must explicitly reject --user installation; actual result: {}", result.message))?;
        require(!fixture_installed(options)?, "SDK19 unexpectedly installed the fixture despite rejection")?;
        fixture_state(&snapshot, false, false)?;
        record(report, "fixture-install-v1", "EXPECTED_REJECTION", json!({"reason": result.message, "installed": false}));
        record(report, "fixture-upgrade-and-actions", "NOT_RUN", json!({"reason": "SDK19 scoped install is unsupported; no fixture was installed"}));
        report["limitations"].as_array_mut().unwrap().push(json!("SDK19 install --user is unsupported; no unscoped fallback was attempted"));
        return Ok(());
    }
    require(snapshot.install_results[0].success, &format!("Fixture installation failed: {}", snapshot.install_results[0].message))?;
    fixture_state(&snapshot, true, true)?;
    require(fixture_installed(options)?, "Independent package listing did not find fixture v1")?;
    record(report, "fixture-install-v1", "PASS", fixture_dump(options, 1, true)?);

    report["activeStep"] = json!("fixture-upgrade-v2");
    let snapshot = install(options, &mut manager, &options.v2)?;
    report["installV2"] = json!(snapshot.install_results);
    require(snapshot.install_results[0].success, &format!("Fixture upgrade failed: {}", snapshot.install_results[0].message))?;
    fixture_state(&snapshot, true, true)?;
    record(report, "fixture-upgrade-v2", "PASS", fixture_dump(options, 2, true)?);

    let home_known = snapshot.default_home.is_some();
    report["homeProtection"] = json!({"defaultHomeIdentified": home_known, "defaultHome": snapshot.default_home});
    for (name, request, installed, enabled) in [
        ("fixture-disable", Request::SetEnabled { packages: vec![FIXTURE.into()], enabled: false }, true, false),
        ("fixture-enable", Request::SetEnabled { packages: vec![FIXTURE.into()], enabled: true }, true, true),
        ("fixture-uninstall", Request::Uninstall { packages: vec![FIXTURE.into()] }, false, false),
    ] {
        if !home_known && name == "fixture-enable" {
            record(report, name, "NOT_RUN", json!({"reason": "Fixture remains enabled after protected disable refusal"}));
            continue;
        }
        report["activeStep"] = json!(name);
        let snapshot = fixture_action(options, &mut manager, request, home_known)?;
        let (installed, enabled) = if home_known { (installed, enabled) } else { (true, true) };
        fixture_state(&snapshot, installed, enabled)?;
        require(fixture_installed(options)? == installed, "Independent listing disagrees with fixture action")?;
        let details = if installed { fixture_dump(options, 2, enabled)? } else { json!({"installed": false, "userId": 0}) };
        record(report, name, if home_known { "PASS" } else { "EXPECTED_PROTECTION" }, details);
    }
    if !home_known {
        report["limitations"].as_array_mut().unwrap().push(json!("HOME could not be identified; disable/uninstall were correctly refused and the disposable fixture remains installed"));
    }
    Ok(())
}

fn save_report(file: &mut File, report: &Value) -> Check<()> {
    serde_json::to_writer_pretty(&mut *file, report).map_err(|e| e.to_string())?;
    file.write_all(b"\n").and_then(|_| file.sync_all()).map_err(|e| e.to_string())
}

fn main() {
    let options = match options() {
        Ok(value) => value,
        Err(error) => { eprintln!("{error}"); std::process::exit(2); }
    };
    if let Some(parent) = options.report.parent().filter(|path| !path.as_os_str().is_empty()) {
        if let Err(error) = fs::create_dir_all(parent) { eprintln!("Cannot create report directory: {error}"); std::process::exit(2); }
    }
    let mut output = match OpenOptions::new().write(true).create_new(true).open(&options.report) {
        Ok(file) => file,
        Err(error) => { eprintln!("Cannot create a new report: {error}"); std::process::exit(2); }
    };
    let started = Instant::now();
    let mut report = json!({"schemaVersion": 1, "evidenceLevel": "E0", "attemptedEvidenceLevel": "E3", "emulatorTested": false,
        "physicalTvTested": false, "fullPhysicalCompatibilityVerified": false, "expectedSdk": options.sdk,
        "fixturePackage": FIXTURE, "scope": "Production Manager API on an isolated Android emulator; not a Xiaomi or physical TV test",
        "sourceCommit": env::var("GITHUB_SHA").ok(), "steps": [], "limitations": [], "status": "RUNNING"});
    let result = run(&options, &mut report);
    if result.is_err() && report["emulatorTested"] == true {
        report["failureDiagnostics"] = failure_diagnostics(&options);
    }
    report["elapsedSeconds"] = json!(started.elapsed().as_secs_f64());
    report["status"] = json!(if result.is_ok() { "PASS" } else { "FAIL" });
    report["assertionsPassed"] = json!(result.is_ok());
    report["testedScopeCompatibility"] = json!(if result.is_err() { "NOT_CONFIRMED" }
        else if report["limitations"].as_array().unwrap().is_empty() { "TESTED_SCOPE_ONLY" } else { "LIMITED" });
    if let Err(error) = &result { report["failure"] = json!(error); }
    if let Err(error) = save_report(&mut output, &report) { eprintln!("Cannot save report: {error}"); std::process::exit(2); }
    match result {
        Ok(()) => println!("Emulator assertions passed; physical television compatibility remains unverified."),
        Err(error) => { eprintln!("Emulator verification failed: {error}"); std::process::exit(1); }
    }
}
