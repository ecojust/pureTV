use std::collections::BTreeSet;
use std::net::IpAddr;

pub(crate) fn package(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 255
        && value.split('.').all(|part| {
            !part.is_empty()
                && part.as_bytes()[0].is_ascii_alphabetic()
                && part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_')
        })
}
pub(crate) fn component(value: &str) -> bool {
    let Some((pkg, class)) = value.split_once('/') else {
        return false;
    };
    package(pkg)
        && !class.is_empty()
        && class.len() <= 512
        && class
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'.' | b'_' | b'$'))
        && class.bytes().any(|b| b.is_ascii_alphabetic())
}
/// Match Android ComponentName.unflattenFromString: a leading dot is
/// relative to the package. Shell query variants may use either spelling.
pub(crate) fn normalize_component(value: &str) -> Option<String> {
    if !component(value) {
        return None;
    }
    let (pkg, class) = value.split_once('/')?;
    Some(if class.starts_with('.') {
        format!("{pkg}/{pkg}{class}")
    } else {
        value.to_string()
    })
}
pub(crate) fn component_arg(value: &str) -> String {
    // ADB assembles remote shell arguments. Dollar signs in Android nested class
    // names must remain literal even though the local process uses argv arrays.
    format!("'{value}'")
}
pub(crate) fn endpoint(host: &str, port: u16) -> Result<String, String> {
    let host = host.trim();
    if port == 0 || host.is_empty() || host.len() > 253 {
        return Err("请输入有效的电视 IP／主机名和端口".into());
    }
    let normalized = host
        .strip_prefix('[')
        .and_then(|s| s.strip_suffix(']'))
        .unwrap_or(host);
    if let Ok(ip) = normalized.parse::<IpAddr>() {
        return Ok(match ip {
            IpAddr::V4(_) => format!("{ip}:{port}"),
            IpAddr::V6(_) => format!("[{ip}]:{port}"),
        });
    }
    if host.split('.').any(|part| {
        part.is_empty()
            || part.len() > 63
            || part.starts_with('-')
            || part.ends_with('-')
            || !part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
    }) {
        return Err("电视地址只能是 IP 或有效主机名，不能包含命令字符".into());
    }
    Ok(format!("{host}:{port}"))
}
pub(crate) fn packages(output: &str) -> Result<BTreeSet<String>, String> {
    // AOSP android-4.4_r1 bionic linker.cpp/linker.h emits this non-fatal
    // libdvm diagnostic on stderr. Legacy ADB shell merges it into pm output.
    // Match the observed complete line, never arbitrary linker warnings/errors.
    const KITKAT_DALVIK_WARNING: &str = "WARNING: linker: libdvm.so has text relocations. This is wasting memory and is a security risk. Please fix.";
    let mut values = BTreeSet::new();
    for line in output.lines().map(str::trim).filter(|s| !s.is_empty()) {
        if line == KITKAT_DALVIK_WARNING {
            continue;
        }
        let Some(name) = line.strip_prefix("package:") else {
            return Err(format!("无法识别应用列表：{}", short(line, 160)));
        };
        if !package(name) {
            return Err("设备返回了无效包名".into());
        }
        values.insert(name.to_string());
        if values.len() > 10000 {
            return Err("设备应用数量超过 10,000 项上限".into());
        }
    }
    // Empty filtered lists (for example pm list packages -d) are valid.
    // Manager::read_catalogue separately rejects an empty installed catalogue.
    Ok(values)
}

#[cfg(test)]
mod package_list_tests {
    use super::*;

    const WARNING: &str = "WARNING: linker: libdvm.so has text relocations. This is wasting memory and is a security risk. Please fix.";

    #[test]
    fn kitkat_linker_diagnostic_does_not_hide_real_package_records() {
        let output = format!("{WARNING}\r\npackage:android\r\n{WARNING}\r\npackage:com.example.app\r\npackage:android\r\n");
        assert_eq!(packages(&output).unwrap(), BTreeSet::from([
            "android".into(), "com.example.app".into(),
        ]));
    }

    #[test]
    fn package_filters_preserve_empty_results_with_known_diagnostic() {
        for output in ["".to_string(), " \r\n".into(), format!("{WARNING}\n{WARNING}\n")] {
            assert!(packages(&output).unwrap().is_empty());
        }
    }

    #[test]
    fn package_diagnostics_do_not_mask_errors_or_unrecognized_warnings() {
        for invalid in [
            "usage: pm list packages",
            "Error: permission denied",
            "java.lang.SecurityException: Permission Denial",
            "WARNING: linker: could not load library libdvm.so",
            "WARNING: linker: libother.so has text relocations. This is wasting memory and is a security risk. Please fix.",
            "package:com.invalid;name",
            &format!("{WARNING} Permission Denial"),
        ] {
            assert!(packages(&format!("{WARNING}\npackage:android\n{invalid}\n")).is_err(), "{invalid}");
        }
    }
}
pub(crate) fn components(output: &str) -> Vec<String> {
    let mut values = BTreeSet::new();
    for line in output.lines().map(str::trim) {
        if let Some(value) = normalize_component(line) {
            values.insert(value);
        }
    }
    values.into_iter().collect()
}
pub(crate) fn default_home(output: &str) -> Option<String> {
    // A resolve result must identify one HOME. Picking the first candidate
    // could mark another active launcher as safe to disable or uninstall.
    let values = components(output);
    if values.len() != 1 {
        return None;
    }
    values.into_iter().next().filter(|value| {
        !value.contains("ResolverActivity") && !value.contains("ChooserActivity")
    })
}
pub(crate) fn devices(output: &str) -> Vec<(String, String)> {
    output
        .lines()
        .filter_map(|line| {
            let mut items = line.split_whitespace();
            let serial = items.next()?;
            let state = items.next()?;
            if matches!(state, "device" | "offline" | "unauthorized") {
                Some((serial.to_string(), state.to_string()))
            } else {
                None
            }
        })
        .collect()
}
pub(crate) fn short(value: &str, count: usize) -> String {
    value.chars().take(count).collect()
}
pub(crate) fn label(pkg: &str) -> String {
    match pkg {
        "com.ecojust.puretv" => "pureTV",
        "com.ecojust.cleanyourtv" => "pureTV（旧版）",
        "com.ecojust.music" => "Music TV",
        "com.ecojust.shortvideo" => "ShortVideo TV",
        "com.ecojust.webtv" => "WebTV",
        "com.gathin.tvhome" => "CleanYourTV",
        "com.android.tv.settings" | "com.android.settings" => "系统设置",
        "com.android.systemui" => "系统界面",
        "com.google.android.tvlauncher" => "Android TV 桌面",
        "com.google.android.apps.tv.launcherx" => "Google TV 桌面",
        _ => pkg,
    }
    .to_string()
}
pub(crate) fn core_package(pkg: &str) -> bool {
    matches!(
        pkg,
        "android"
            | "com.android.systemui"
            | "com.android.settings"
            | "com.android.tv.settings"
            | "com.android.providers.settings"
            | "com.android.permissioncontroller"
            | "com.google.android.permissioncontroller"
            | "com.android.packageinstaller"
            | "com.google.android.packageinstaller"
            | "com.android.providers.downloads"
            | "com.android.providers.media"
            | "com.android.providers.media.module"
            | "com.android.externalstorage"
            | "com.android.shell"
            | "com.android.providers.telephony"
            | "com.android.phone"
            | "com.google.android.gms"
            | "com.google.android.gsf"
            | "com.android.networkstack"
            | "com.google.android.networkstack"
            | "com.android.inputmethod.latin"
            | "com.google.android.inputmethod.latin"
            | "com.google.android.inputmethod.latin.tv"
            | "com.android.bluetooth"
            | "com.android.documentsui"
    )
}

/// Only absolute, ordinary APK paths can be interpolated into the remote shell.
pub(crate) fn apk_paths(output: &str) -> Option<Vec<String>> {
    let mut paths = BTreeSet::new();
    for line in output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let path = line.strip_prefix("package:")?;
        if path.len() > 4096
            || !path.starts_with('/')
            || !path.ends_with(".apk")
            || !path
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"/._-+~=".contains(&b))
            || path.split('/').any(|part| part == "..")
        {
            return None;
        }
        paths.insert(path.to_string());
        if paths.len() > 64 {
            return None;
        }
    }
    if paths.is_empty() {
        None
    } else {
        Some(paths.into_iter().collect())
    }
}
pub(crate) fn apk_size(output: &str, expected: usize) -> Option<u64> {
    let sizes: Vec<_> = output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();
    if sizes.len() != expected || expected == 0 {
        return None;
    }
    sizes.into_iter().try_fold(0u64, |sum, line| {
        if !line.bytes().all(|b| b.is_ascii_digit()) {
            return None;
        }
        let bytes = line.parse::<u64>().ok()?;
        if bytes == 0 {
            None
        } else {
            sum.checked_add(bytes)
        }
    })
}
#[cfg(test)]
mod size_tests {
    use super::*;
    #[test]
    fn default_home_requires_one_unambiguous_non_resolver_component() {
        assert_eq!(default_home("com.vendor.home/.Home\n"), Some("com.vendor.home/com.vendor.home.Home".into()));
        assert_eq!(default_home("com.vendor.home/.Home\ncom.vendor.home/com.vendor.home.Home\n"), Some("com.vendor.home/com.vendor.home.Home".into()));
        for output in [
            "", "No activity found", "android/com.android.internal.app.ResolverActivity",
            "com.vendor.home/.Home\ncom.other.home/.Home\n",
            "android/com.android.internal.app.ResolverActivity\ncom.vendor.home/.Home\n",
            "android/com.android.internal.app.ChooserActivity\ncom.vendor.home/.Home\n",
        ] {
            assert_eq!(default_home(output), None, "{output}");
        }
    }

    #[test]
    fn apk_sizes_include_splits_and_reject_untrusted_or_incomplete_output() {
        assert_eq!(apk_paths("package:/data/app/~~a+b==/example/base.apk\npackage:/data/app/~~a+b==/example/split.apk").unwrap().len(),2);
        for path in [
            "package:/data/app/a';touch /tmp/pwn;.apk",
            "package:/data/../secret.apk",
            "package:relative.apk",
            "Error: permission denied",
            "",
        ] {
            assert!(apk_paths(path).is_none());
        }
        assert_eq!(apk_size("1024\n2048\n", 2), Some(3072));
        for (output, count) in [
            ("1024", 2),
            ("0", 1),
            ("-1", 1),
            ("Error", 1),
            ("18446744073709551615\n1", 2),
        ] {
            assert_eq!(apk_size(output, count), None);
        }
    }
}

pub(crate) fn memory_info(output: &str) -> Option<(u64, u64)> {
    let get = |key: &str| -> Option<u64> {
        let value = output.lines().find_map(|line| line.strip_prefix(key))?;
        let mut fields = value.split_whitespace();
        let number = fields.next()?.parse::<u64>().ok()?;
        if fields.next() != Some("kB") {
            return None;
        }
        number.checked_mul(1024)
    };
    let total = get("MemTotal:")?;
    let available = get("MemAvailable:").or_else(|| {
        get("MemFree:")?
            .checked_add(get("Buffers:")?)?
            .checked_add(get("Cached:")?)
    })?;
    if total == 0 || available > total {
        None
    } else {
        Some((total, available))
    }
}
pub(crate) fn disk_info(output: &str) -> Option<(u64, u64)> {
    fn unsigned(value: &str) -> Option<u64> {
        if value.is_empty() || !value.bytes().all(|byte| byte.is_ascii_digit()) {
            return None;
        }
        value.parse().ok()
    }
    // Android 4.4 toolbox df prints one decimal place and an explicit binary
    // K/M/G unit, even without -h. It has no percentage column or -k option:
    // platform/system/core, android-4.4_r1, toolbox/df.c.
    fn toolbox_size(value: &str) -> Option<u64> {
        let (number, unit) = [
            ('K', 1024u64),
            ('M', 1024u64.pow(2)),
            ('G', 1024u64.pow(3)),
        ]
        .into_iter()
        .find_map(|(suffix, unit)| value.strip_suffix(suffix).map(|number| (number, unit)))?;
        let (whole, fraction) = number.split_once('.')?;
        if fraction.len() != 1 {
            return None;
        }
        unsigned(whole)?
            .checked_mul(unit)?
            .checked_add(unsigned(fraction)?.checked_mul(unit)? / 10)
    }
    let lines: Vec<_> = output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();
    if lines
        .first()?
        .split_whitespace()
        .eq(["Filesystem", "Size", "Used", "Free", "Blksize"])
    {
        // `df /data` emits exactly a header and a row. Extra diagnostics must
        // not turn a failed query (for example `df -k`) into a plausible value.
        if lines.len() != 2 {
            return None;
        }
        let fields: Vec<_> = lines[1].split_whitespace().collect();
        if fields.len() != 5 || fields[0] != "/data" {
            return None;
        }
        let total = toolbox_size(fields[1])?;
        let used = toolbox_size(fields[2])?;
        let available = toolbox_size(fields[3])?;
        let block_size = unsigned(fields[4])?;
        // Printed capacities are rounded independently, so their sum need not
        // equal the printed total. Each individual value must still be sane.
        return (total > 0
            && used <= total
            && available <= total
            && block_size > 0
            && block_size <= i32::MAX as u64)
            .then_some((total, available));
    }
    output.lines().rev().find_map(|line| {
        let fields: Vec<_> = line.split_whitespace().collect();
        let percent = fields.iter().position(|field| {
            field
                .strip_suffix('%')
                .and_then(unsigned)
                .is_some_and(|number| number <= 100)
        })?;
        if !(3..=4).contains(&percent)
            || fields.len() != percent + 2
            || fields.last() != Some(&"/data")
        {
            return None;
        }
        let total = unsigned(fields[percent - 3])?.checked_mul(1024)?;
        let used = unsigned(fields[percent - 2])?.checked_mul(1024)?;
        let available = unsigned(fields[percent - 1])?.checked_mul(1024)?;
        if total == 0 || used.checked_add(available)? > total {
            None
        } else {
            Some((total, available))
        }
    })
}
#[cfg(test)]
mod system_tests {
    use super::*;
    #[test]
    fn memory_and_disk_values_require_real_units_and_sane_capacity() {
        assert_eq!(
            memory_info("MemTotal: 4096 kB\nMemAvailable: 1024 kB"),
            Some((4194304, 1048576))
        );
        assert_eq!(
            memory_info("MemTotal: 4096 kB\nMemFree: 512 kB\nBuffers: 256 kB\nCached: 256 kB"),
            Some((4194304, 1048576))
        );
        assert_eq!(memory_info("MemTotal: 1 kB\nMemAvailable: 2 kB"), None);
        assert_eq!(disk_info("Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/block/data 4096 1024 3072 25% /data"),Some((4194304,3145728)));
        assert_eq!(
            disk_info("/dev/long-name\n4096 1024 3072 25% /data"),
            Some((4194304, 3145728))
        );
        assert_eq!(disk_info("permission denied"), None);
    }

    #[test]
    fn kitkat_toolbox_disk_values_have_explicit_binary_units_and_data_mount() {
        // Formats and units from Android 4.4_r1 toolbox/df.c. These fixtures
        // represent command output, not measurements from a physical device.
        let header = "Filesystem               Size     Used     Free   Blksize\n";
        assert_eq!(
            disk_info(&format!("{header}/data 4.0G 1.0G 3.0G 4096\n")),
            Some((4 * 1024u64.pow(3), 3 * 1024u64.pow(3)))
        );
        assert_eq!(
            disk_info(&format!("{header}/data 512.0M 256.0M 256.0M 4096\n")),
            Some((512 * 1024u64.pow(2), 256 * 1024u64.pow(2)))
        );
        assert_eq!(
            disk_info(&format!("{header}/data 4.0K 1.0K 3.0K 1024\n")),
            Some((4096, 3072))
        );
        // The toolbox rounds each column to a tenth of its unit independently.
        assert_eq!(
            disk_info(&format!("{header}/data 1.0G 512.1M 512.1M 4096\n")),
            Some((1024u64.pow(3), 536975769))
        );
        for row in [
            "/cache 4.0G 1.0G 3.0G 4096",
            "/data 4096 1024 3072 4096",
            "/data -4.0G 1.0G 3.0G 4096",
            "/data +4.0G 1.0G 3.0G 4096",
            "/data 4.0G -1.0G 3.0G 4096",
            "/data 4.0G 1.0G -3.0G 4096",
            "/data 18446744073709551615.0G 1.0G 3.0G 4096",
            "/data 0.0G 0.0G 0.0G 4096",
            "/data 4.0G 5.0G 3.0G 4096",
            "/data 4.0G 1.0G 5.0G 4096",
            "/data 4.00G 1.0G 3.0G 4096",
            "/data 4.0G 1.0G 3.0G 0",
            "/data 4.0G 1.0G 3.0G -4096",
            "/data 4.0G 1.0G 3.0G 4096\n-k: No such file or directory",
            "/data: Permission denied",
        ] {
            assert_eq!(disk_info(&format!("{header}{row}\n")), None, "{row}");
        }
        assert_eq!(disk_info("/data 4.0G 1.0G 3.0G 4096"), None);
        for row in [
            "/dev/data 4096 1024 3072 25% /cache",
            "/dev/data -4096 1024 3072 25% /data",
            "/dev/data 4096 -1024 3072 25% /data",
            "/dev/data 4096 1024 -3072 25% /data",
            "/dev/data 4096 1024 3072 101% /data",
            "/dev/data 4096 1024 4096 25% /data",
            "/dev/data 18446744073709551615 1024 3072 25% /data",
        ] {
            assert_eq!(disk_info(row), None, "{row}");
        }
    }
}

pub(crate) fn package_blocks(output: &str) -> std::collections::BTreeMap<String, String> {
    let mut blocks = std::collections::BTreeMap::new();
    let mut current = None;
    for line in output.lines() {
        if let Some(name) = line
            .trim()
            .strip_prefix("@@puretv@@")
            .filter(|name| package(name))
        {
            current = Some(name.to_string());
            blocks.insert(name.to_string(), String::new());
        } else if let Some(name) = &current {
            let block = blocks.get_mut(name).unwrap();
            block.push_str(line);
            block.push('\n');
        }
    }
    blocks
}
