//! Persist bounded layout-compatible SVGs by the package identity in an APK.
use serde_json::Value;
use std::{
    fs,
    io::Read,
    path::Path,
    sync::atomic::{AtomicU64, Ordering},
};

pub const MAX_LOGO: usize = 8192;
const MAX_MANIFEST: u64 = 4 * 1024 * 1024;
static NEXT_TEMP: AtomicU64 = AtomicU64::new(1);

fn valid_package(value: &str) -> bool {
    value.len() <= 255
        && value.contains('.')
        && value.split('.').all(|part| {
            !part.is_empty()
                && part
                    .as_bytes()
                    .first()
                    .is_some_and(|c| c.is_ascii_alphabetic() || *c == b'_')
                && part.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'_')
        })
}

fn u16_at(data: &[u8], offset: usize) -> Option<u16> {
    Some(u16::from_le_bytes(
        data.get(offset..offset.checked_add(2)?)?.try_into().ok()?,
    ))
}
fn u32_at(data: &[u8], offset: usize) -> Option<u32> {
    Some(u32::from_le_bytes(
        data.get(offset..offset.checked_add(4)?)?.try_into().ok()?,
    ))
}
fn length8(data: &[u8], offset: &mut usize) -> Option<usize> {
    let first = *data.get(*offset)? as usize;
    *offset += 1;
    if first & 0x80 == 0 {
        Some(first)
    } else {
        let second = *data.get(*offset)? as usize;
        *offset += 1;
        Some(((first & 0x7f) << 8) | second)
    }
}
fn length16(data: &[u8], offset: &mut usize) -> Option<usize> {
    let first = u16_at(data, *offset)? as usize;
    *offset += 2;
    if first & 0x8000 == 0 {
        Some(first)
    } else {
        let second = u16_at(data, *offset)? as usize;
        *offset += 2;
        Some(((first & 0x7fff) << 16) | second)
    }
}
fn strings(data: &[u8]) -> Option<Vec<String>> {
    let header = u16_at(data, 2)? as usize;
    let count = u32_at(data, 8)? as usize;
    let start = u32_at(data, 20)? as usize;
    let utf8 = u32_at(data, 16)? & 0x100 != 0;
    if header < 28
        || count > 65_536
        || start < header.checked_add(count.checked_mul(4)?)?
        || start > data.len()
    {
        return None;
    }
    let mut result = Vec::with_capacity(count);
    let mut decoded_bytes = 0usize;
    for index in 0..count {
        let mut at = start.checked_add(u32_at(data, header + index * 4)? as usize)?;
        let text = if utf8 {
            length8(data, &mut at)?; // UTF-16 code-unit count precedes UTF-8 byte count.
            let len = length8(data, &mut at)?;
            let end = at.checked_add(len)?;
            if *data.get(end)? != 0 {
                return None;
            }
            decoded_bytes = decoded_bytes.checked_add(len)?;
            if decoded_bytes > MAX_MANIFEST as usize {
                return None;
            }
            std::str::from_utf8(data.get(at..end)?).ok()?.to_owned()
        } else {
            let len = length16(data, &mut at)?;
            decoded_bytes = decoded_bytes.checked_add(len.checked_mul(3)?)?;
            if decoded_bytes > MAX_MANIFEST as usize {
                return None;
            }
            let end = at.checked_add(len.checked_mul(2)?)?;
            if u16_at(data, end)? != 0 {
                return None;
            }
            let units: Vec<_> = data
                .get(at..end)?
                .chunks_exact(2)
                .map(|part| u16::from_le_bytes([part[0], part[1]]))
                .collect();
            String::from_utf16(&units).ok()?
        };
        result.push(text);
    }
    Some(result)
}

/// Read only the root manifest's unnamespaced literal package attribute.
/// No resources, dex, application code, or files outside the ZIP are evaluated.
fn manifest_package(data: &[u8]) -> Option<String> {
    if u16_at(data, 0)? != 3 || u16_at(data, 2)? != 8 || u32_at(data, 4)? as usize != data.len() {
        return None;
    }
    let mut pool = None;
    let mut offset = 8usize;
    while offset < data.len() {
        let kind = u16_at(data, offset)?;
        let header = u16_at(data, offset + 2)? as usize;
        let size = u32_at(data, offset + 4)? as usize;
        if header < 8 || size < header {
            return None;
        }
        let end = offset.checked_add(size)?;
        let chunk = data.get(offset..end)?;
        if kind == 1 {
            if pool.is_some() {
                return None;
            }
            pool = Some(strings(chunk)?);
        } else if kind == 0x0102 {
            let pool = pool.as_ref()?;
            if header != 16
                || u32_at(chunk, 16)? != u32::MAX
                || pool.get(u32_at(chunk, 20)? as usize)? != "manifest"
            {
                return None;
            }
            let start = 16usize.checked_add(u16_at(chunk, 24)? as usize)?;
            let stride = u16_at(chunk, 26)? as usize;
            let count = u16_at(chunk, 28)? as usize;
            if start < 36
                || stride < 20
                || start.checked_add(count.checked_mul(stride)?)? > chunk.len()
            {
                return None;
            }
            let mut found = None;
            for index in 0..count {
                let attr = start + stride * index;
                if u32_at(chunk, attr)? != u32::MAX
                    || pool.get(u32_at(chunk, attr + 4)? as usize)? != "package"
                {
                    continue;
                }
                if found.is_some() {
                    return None;
                }
                let raw = u32_at(chunk, attr + 8)?;
                let value = if raw != u32::MAX {
                    pool.get(raw as usize)?
                } else {
                    if u16_at(chunk, attr + 12)? != 8 || *chunk.get(attr + 15)? != 3 {
                        return None;
                    }
                    pool.get(u32_at(chunk, attr + 16)? as usize)?
                };
                if !valid_package(value) {
                    return None;
                }
                found = Some(value.clone());
            }
            return found;
        }
        offset = end;
    }
    None
}

pub fn package_name(apk: &Path) -> Option<String> {
    let file = fs::File::open(apk).ok()?;
    if file.metadata().ok()?.len() > 512 * 1024 * 1024 {
        return None;
    }
    let mut archive = zip::ZipArchive::new(file).ok()?;
    let entry = archive.by_name("AndroidManifest.xml").ok()?;
    if entry.size() > MAX_MANIFEST {
        return None;
    }
    let mut data = Vec::new();
    entry.take(MAX_MANIFEST + 1).read_to_end(&mut data).ok()?;
    if data.len() as u64 > MAX_MANIFEST {
        return None;
    }
    manifest_package(&data)
}

pub fn valid_svg(data: &[u8]) -> Option<&str> {
    if data.is_empty() || data.len() > MAX_LOGO {
        return None;
    }
    let value = std::str::from_utf8(data).ok()?;
    puretv_core::validate_svg_icon(value).ok()?;
    Some(value)
}
fn read_svg(path: &Path) -> Option<String> {
    let meta = fs::symlink_metadata(path).ok()?;
    if !meta.is_file() || meta.len() > MAX_LOGO as u64 {
        return None;
    }
    let mut data = Vec::new();
    fs::File::open(path)
        .ok()?
        .take(MAX_LOGO as u64 + 1)
        .read_to_end(&mut data)
        .ok()?;
    Some(valid_svg(&data)?.to_owned())
}
pub fn save(directory: &Path, apk: &Path, svg: &str) -> Result<(), String> {
    valid_svg(svg.as_bytes()).ok_or("应用图标格式无效")?;
    let package = package_name(apk).ok_or("无法读取应用图标对应的包名")?;
    let root = directory.join("application-logos");
    fs::create_dir_all(&root).map_err(|_| "无法创建应用图标目录")?;
    let target = root.join(format!("{package}.svg"));
    let temporary = root.join(format!(
        ".logo-{}-{}.tmp",
        std::process::id(),
        NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
    ));
    let result = (|| {
        use std::io::Write;
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)
            .map_err(|_| "无法保存应用图标")?;
        file.write_all(svg.as_bytes())
            .map_err(|_| "无法保存应用图标")?;
        file.sync_all().map_err(|_| "无法保存应用图标")?;
        drop(file);
        // Windows cannot rename over an existing file.
        if target.exists() {
            fs::remove_file(&target).map_err(|_| "无法更新应用图标")?;
        }
        fs::rename(&temporary, &target).map_err(|_| "无法保存应用图标")
    })();
    let _ = fs::remove_file(temporary);
    result.map_err(String::from)
}

/// Only decorate applications already returned by the launcher's installed-app query.
pub fn enrich(directory: &Path, result: &mut Value) {
    if let Some(apps) = result.get_mut("apps").and_then(Value::as_array_mut) {
        for app in apps {
            let Some(package) = app
                .get("packageName")
                .and_then(Value::as_str)
                .filter(|p| valid_package(p))
            else {
                continue;
            };
            let value = read_svg(
                &directory
                    .join("application-logos")
                    .join(format!("{package}.svg")),
            );
            if let (Some(logo), Some(object)) = (value, app.as_object_mut()) {
                object.insert("logoSvg".into(), Value::String(logo));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    const SVG: &str = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\" viewBox=\"0 0 64 64\"><path fill=\"#FFC000\" d=\"M0 0H64V64H0Z\"/></svg>";

    #[test]
    fn cached_logos_are_bounded_safe_and_scoped_to_installed_package_identity() {
        let root = std::env::temp_dir().join(format!(
            "puretv-logo-test-{}",
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir_all(root.join("application-logos")).unwrap();
        fs::write(root.join("application-logos/com.example.tv.svg"), SVG).unwrap();
        fs::write(
            root.join("application-logos/com.evil.tv.svg"),
            "<svg onload=\"alert(1)\"/>",
        )
        .unwrap();
        let mut value = json!({"apps":[{"packageName":"com.example.tv","label":"TV"},{"packageName":"com.evil.tv"},{"packageName":"../outside"},{"packageName":"com.missing.tv"}]});
        enrich(&root, &mut value);
        assert_eq!(value["apps"][0]["logoSvg"], SVG);
        for index in 1..4 {
            assert!(value["apps"][index].get("logoSvg").is_none());
        }
        for invalid in [
            "<svg><script/></svg>",
            "<svg><image href=\"https://example.com/x\"/></svg>",
            "<!DOCTYPE svg [<!ENTITY x 'y'>]><svg>&x;</svg>",
        ] {
            assert!(valid_svg(invalid.as_bytes()).is_none());
        }
        assert!(valid_svg(&vec![b' '; MAX_LOGO + 1]).is_none());
        fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn shipped_apks_bind_persisted_logos_to_real_package_names() {
        // Existing shipped APKs cover AAPT variants, UTF-8/UTF-16 string pools,
        // and both project apps and third-party manifests without duplicating ZIPs.
        let root = std::env::var_os("PURETV_RESOURCE_APPS")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| {
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../resource/apps")
            });
        let cache = std::env::temp_dir().join(format!(
            "puretv-logo-apks-{}-{}",
            std::process::id(),
            NEXT_TEMP.fetch_add(1, Ordering::Relaxed)
        ));
        let mut apps = Vec::new();
        let mut expected = Vec::new();
        let mut count = 0;
        for entry in fs::read_dir(root).unwrap().flatten() {
            let metadata = entry.path().join("resource.json");
            if !metadata.exists() {
                continue;
            }
            let value: Value = serde_json::from_slice(&fs::read(metadata).unwrap()).unwrap();
            let apk = entry.path().join(value["apk"].as_str().unwrap());
            assert_eq!(
                package_name(&apk).as_deref(),
                value["packageName"].as_str(),
                "{}",
                apk.display()
            );
            let svg = fs::read_to_string(entry.path().join("logo.svg")).unwrap();
            save(&cache, &apk, &svg).unwrap();
            apps.push(json!({"packageName":value["packageName"]}));
            expected.push(svg);
            count += 1;
        }
        assert!(count >= 9);
        let mut result = json!({"apps":apps});
        enrich(&cache, &mut result);
        for (app, expected) in result["apps"].as_array().unwrap().iter().zip(expected) {
            assert_eq!(app["logoSvg"].as_str(), Some(expected.as_str()));
        }
        fs::remove_dir_all(cache).unwrap();
    }
    #[test]
    fn repeated_string_offsets_cannot_amplify_manifest_memory() {
        let count = 130usize;
        let start = 28 + count * 4;
        let mut pool = vec![0u8; start];
        pool[0..2].copy_from_slice(&1u16.to_le_bytes());
        pool[2..4].copy_from_slice(&28u16.to_le_bytes());
        pool[8..12].copy_from_slice(&(count as u32).to_le_bytes());
        pool[16..20].copy_from_slice(&0x100u32.to_le_bytes());
        pool[20..24].copy_from_slice(&(start as u32).to_le_bytes());
        // Every entry points at the same 32 KiB string; the compact input would
        // otherwise allocate one full string for each alias in the offset table.
        pool.extend_from_slice(&[0xff, 0xff, 0xff, 0xff]);
        pool.extend(std::iter::repeat_n(b'x', 32_767));
        pool.push(0);
        let size = pool.len() as u32;
        pool[4..8].copy_from_slice(&size.to_le_bytes());
        assert!(pool.len() < 40 * 1024);
        assert!(strings(&pool).is_none());
    }
    #[test]
    fn rejects_malformed_binary_manifest_without_panics() {
        for data in [
            vec![],
            vec![3, 0, 8, 0, 8, 0, 0, 0],
            vec![3, 0, 8, 0, 16, 0, 0, 0, 1, 0, 28, 0, 255, 255, 255, 255],
        ] {
            assert!(manifest_package(&data).is_none());
        }
        for name in [
            "../escape",
            "com.example/evil",
            "com.example..app",
            "com.example.app\0",
            "android",
        ] {
            assert!(!valid_package(name));
        }
    }
}
