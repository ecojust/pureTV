use super::Manager;
use std::collections::BTreeSet;
use std::sync::atomic::Ordering;

fn user_id(value: &str) -> Option<u32> {
    let value = value.trim();
    if value.is_empty() || !value.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    value.parse::<u32>().ok().filter(|id| *id <= i32::MAX as u32)
}

/// Android 4.4 AMS documents mUserLru as current-user history with the current
/// user at the end. Use only for SDK 19, never as a generic Android heuristic.
/// https://github.com/aosp-mirror/platform_frameworks_base/blob/android-4.4_r1/services/java/com/android/server/am/ActivityManagerService.java#L557
fn kitkat_current_user(output: &str) -> Option<u32> {
    let mut fields = output.lines().map(str::trim).filter_map(|line| {
        line.strip_prefix("mUserLru:").map(str::trim)
    });
    let list = fields.next()?;
    if fields.next().is_some() {
        return None;
    }
    let list = list.strip_prefix('[')?.strip_suffix(']')?;
    let mut seen = BTreeSet::new();
    let mut current = None;
    for value in list.split(',') {
        let id = user_id(value)?;
        if !seen.insert(id) || seen.len() > 1024 {
            return None;
        }
        current = Some(id);
    }
    current
}

impl Manager {
    fn user_probe(&mut self, serial: &str, args: &[&str]) -> Result<Option<String>, String> {
        let result = self.shell(serial, args);
        if !self.defer_cancel && self.cancel.load(Ordering::Relaxed) {
            return Err("操作已取消".into());
        }
        match result {
            Ok(output) => Ok(Some(output)),
            Err(error) if error.contains("操作已取消") => Err(error),
            // Unsupported commands often print a full usage page. They do not
            // establish any identity; try another read-only, explicit source.
            Err(_) => Ok(None),
        }
    }

    pub(super) fn current_user(&mut self, serial: &str) -> Result<u32, String> {
        for args in [
            &["am", "get-current-user"][..],
            &["cmd", "activity", "get-current-user"][..],
        ] {
            if let Some(id) = self.user_probe(serial, args)?.as_deref().and_then(user_id) {
                return Ok(id);
            }
        }
        let sdk = self.user_probe(serial, &["getprop", "ro.build.version.sdk"])?;
        if sdk.as_deref().map(str::trim) == Some("19") {
            if let Some(id) = self
                .user_probe(serial, &["dumpsys", "activity", "processes"])?
                .as_deref()
                .and_then(kitkat_current_user)
            {
                return Ok(id);
            }
        }
        Err("无法确认电视的当前用户，已停止操作".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_ids_require_one_bounded_unsigned_decimal() {
        assert_eq!(user_id("10\n"), Some(10));
        assert_eq!(user_id("0"), Some(0));
        for invalid in ["", "+0", "-1", "2147483648", "4294967296", "0\n10", "usage: am", "UserInfo{0:Owner:13}"] {
            assert_eq!(user_id(invalid), None, "{invalid}");
        }
    }

    #[test]
    fn kitkat_user_history_identifies_the_current_user_without_guessing() {
        assert_eq!(kitkat_current_user("ACTIVITY MANAGER RUNNING PROCESSES\n  mUserLru: [0, 10]\n"), Some(10));
        assert_eq!(kitkat_current_user("  mUserLru: [10, 0]\n"), Some(0));
        for invalid in [
            "", "Users: UserInfo{0:Owner:13} running", "mResumedActivity: ActivityRecord{a u0 pkg/.Home}",
            "mUserLru: []", "mUserLru: [0,]", "mUserLru: [-1]", "mUserLru: [+0]",
            "mUserLru: [0, 0]", "mUserLru: [2147483648]", "mUserLru: [0] trailing",
            "mUserLru: [0]\nmUserLru: [0]", "mUserLru: [0]\nmUserLru: [10]",
        ] {
            assert_eq!(kitkat_current_user(invalid), None, "{invalid}");
        }
    }
}
