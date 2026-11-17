use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf, sync::Mutex};

#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Preferences {
    pub locale: Option<String>,
    pub theme: Option<String>,
}
pub struct Settings {
    directory: PathBuf,
    inner: Mutex<Preferences>,
}
fn valid(value: &Preferences) -> bool {
    value
        .locale
        .as_deref()
        .is_none_or(|value| ["zh-CN", "zh-TW", "en"].contains(&value))
        && value
            .theme
            .as_deref()
            .is_none_or(|value| ["emerald", "ocean", "graphite"].contains(&value))
}
impl Settings {
    pub fn load(directory: PathBuf) -> Self {
        let path = directory.join("interface-preferences.json");
        let prefs = fs::metadata(&path)
            .ok()
            .filter(|meta| meta.len() <= 4096)
            .and_then(|_| fs::read(path).ok())
            .and_then(|bytes| serde_json::from_slice::<Preferences>(&bytes).ok())
            .filter(valid)
            .unwrap_or_default();
        Self {
            directory,
            inner: Mutex::new(prefs),
        }
    }
    pub fn get(&self) -> Result<Preferences, String> {
        Ok(self
            .inner
            .lock()
            .map_err(|_| "Interface preferences unavailable")?
            .clone())
    }
    pub fn set(&self, patch: Value) -> Result<Preferences, String> {
        self.update(patch, false)
    }
    pub fn seed(&self, patch: Value) -> Result<Preferences, String> {
        self.update(patch, true)
    }
    fn update(&self, patch: Value, only_missing: bool) -> Result<Preferences, String> {
        let patch = patch.as_object().ok_or("Invalid interface preferences")?;
        if patch
            .keys()
            .any(|key| !["locale", "theme"].contains(&key.as_str()))
        {
            return Err("Invalid interface preferences".into());
        }
        let mut current = self
            .inner
            .lock()
            .map_err(|_| "Interface preferences unavailable")?;
        let mut next = current.clone();
        if let Some(value) = patch.get("locale") {
            if !only_missing || next.locale.is_none() {
                next.locale = Some(
                    value
                        .as_str()
                        .ok_or("Unsupported interface language")?
                        .into(),
                );
            }
        }
        if let Some(value) = patch.get("theme") {
            if !only_missing || next.theme.is_none() {
                next.theme = Some(value.as_str().ok_or("Unsupported interface theme")?.into());
            }
        }
        if !valid(&next) {
            return Err("Unsupported interface language or theme".into());
        }
        fs::create_dir_all(&self.directory).map_err(|_| "Could not save interface preferences")?;
        let target = self.directory.join("interface-preferences.json");
        let temp = target.with_extension("tmp");
        fs::write(
            &temp,
            serde_json::to_vec(&next).map_err(|_| "Invalid interface preferences")?,
        )
        .map_err(|_| "Could not save interface preferences")?;
        if target.exists() {
            fs::remove_file(&target).map_err(|_| "Could not save interface preferences")?;
        }
        fs::rename(temp, target).map_err(|_| "Could not save interface preferences")?;
        *current = next.clone();
        Ok(next)
    }
    pub fn text(&self, zh: &str, tw: &str, en: &str) -> String {
        match self.get().ok().and_then(|prefs| prefs.locale).as_deref() {
            Some("zh-CN") => zh,
            Some("zh-TW") => tw,
            _ => en,
        }
        .into()
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn preferences_validate_persist_and_do_not_store_device_data() {
        let directory =
            std::env::temp_dir().join(format!("puretv-preferences-{}", std::process::id()));
        let settings = Settings::load(directory.clone());
        assert!(settings.get().unwrap().locale.is_none());
        assert!(settings.set(json!({"host":"192.168.1.1"})).is_err());
        assert!(settings.set(json!({"theme":"unknown"})).is_err());
        settings
            .set(json!({"locale":"zh-TW","theme":"graphite"}))
            .unwrap();
        settings
            .seed(json!({"locale":"en","theme":"emerald"}))
            .unwrap();
        let reloaded = Settings::load(directory.clone());
        assert_eq!(reloaded.get().unwrap().theme.as_deref(), Some("graphite"));
        assert_eq!(reloaded.text("设置", "設定", "Settings"), "設定");
        let text = fs::read_to_string(directory.join("interface-preferences.json")).unwrap();
        assert!(!text.contains("host"));
        let _ = fs::remove_dir_all(directory);
    }
}
