use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{fs, io::Read, path::Path};

pub fn image(path: &Path) -> Result<String, String> {
    let mut data = Vec::new();
    fs::File::open(path)
        .map_err(|_| "无法打开封面图片")?
        .take(4 * 1024 * 1024 + 1)
        .read_to_end(&mut data)
        .map_err(|_| "无法读取封面图片")?;
    if data.len() > 4 * 1024 * 1024 {
        return Err("封面图片不能超过 4 MiB".into());
    }
    let mime = if data.starts_with(b"\x89PNG\r\n\x1a\n") {
        "image/png"
    } else if data.starts_with(b"\xff\xd8\xff") {
        "image/jpeg"
    } else if data.len() > 12 && &data[..4] == b"RIFF" && &data[8..12] == b"WEBP" {
        "image/webp"
    } else {
        return Err("请选择 PNG、JPEG 或 WebP 图片".into());
    };
    Ok(format!("data:{mime};base64,{}", STANDARD.encode(data)))
}
pub fn sidecar_path(path: &Path) -> Option<std::path::PathBuf> {
    let parent = path.parent()?;
    let stem = path.file_stem()?.to_str()?;
    for ext in ["png", "jpg", "jpeg", "webp"] {
        for name in [format!("{stem}.thumb.{ext}"), format!("thumb.{ext}")] {
            let candidate = parent.join(name);
            if image(&candidate).is_ok() {
                return Some(candidate);
            }
        }
    }
    None
}
pub fn sidecar(path: &Path) -> Option<String> {
    image(&sidecar_path(path)?).ok()
}
pub fn covers(directory: &Path) -> Result<Value, String> {
    let directory = directory.join("launcher-covers");
    let mut result = serde_json::Map::new();
    if !directory.exists() {
        return Ok(Value::Object(result));
    }
    for entry in fs::read_dir(directory)
        .map_err(|_| "无法读取启动器封面")?
        .take(200)
    {
        let entry = entry.map_err(|_| "无法读取封面")?;
        if entry.path().extension().is_some_and(|ext| ext == "json") {
            let data = fs::read(entry.path()).map_err(|_| "无法读取封面")?;
            if data.len() > 6 * 1024 * 1024 {
                continue;
            }
            if let Ok(value) = serde_json::from_slice::<Value>(&data) {
                if let (Some(key), Some(image)) = (value["key"].as_str(), value["image"].as_str()) {
                    result.insert(key.into(), json!(image));
                }
            }
        }
    }
    Ok(Value::Object(result))
}
pub fn set(directory: &Path, key: &str, path: Option<&Path>) -> Result<Value, String> {
    if key.is_empty() || key.len() > 600 {
        return Err("启动器标识无效".into());
    }
    let directory = directory.join("launcher-covers");
    fs::create_dir_all(&directory).map_err(|_| "无法保存封面")?;
    let target = directory.join(format!("{:x}.json", Sha256::digest(key.as_bytes())));
    match path {
        Some(path) => {
            let value = json!({"key":key,"image":image(path)?});
            let temp = target.with_extension("tmp");
            fs::write(&temp, value.to_string()).map_err(|_| "无法保存封面")?;
            if target.exists() {
                fs::remove_file(&target).map_err(|_| "无法更新封面")?;
            }
            fs::rename(temp, target).map_err(|_| "无法保存封面")?;
        }
        None => {
            if target.exists() {
                fs::remove_file(target).map_err(|_| "无法移除封面")?;
            }
        }
    }
    covers(directory.parent().unwrap())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_images_and_scopes_persisted_covers() {
        let directory = std::env::temp_dir().join(format!("puretv-covers-{}", std::process::id()));
        fs::create_dir_all(&directory).unwrap();
        let path = directory.join("thumb.png");
        fs::write(&path, b"\x89PNG\r\n\x1a\nexample").unwrap();
        assert!(sidecar(&directory.join("launcher.apk")).is_some());
        let result = set(&directory, "com.example/.Home", Some(&path)).unwrap();
        assert!(result["com.example/.Home"]
            .as_str()
            .unwrap()
            .starts_with("data:image/png;base64,"));
        assert_eq!(
            set(&directory, "com.example/.Home", None).unwrap(),
            json!({})
        );
        fs::write(path, b"not an image").unwrap();
        assert!(sidecar(&directory.join("launcher.apk")).is_none());
        let _ = fs::remove_dir_all(directory);
    }
}

/// Read only the bounded layout asset; never extract or execute files from an APK.
pub fn apk_home_background(path: &Path) -> Option<String> {
    let file = fs::File::open(path).ok()?;
    if file.metadata().ok()?.len() > 256 * 1024 * 1024 {
        return None;
    }
    let mut archive = zip::ZipArchive::new(file).ok()?;
    let entry = archive.by_name("assets/layout.json").ok()?;
    if entry.size() > 90 * 1024 {
        return None;
    }
    let mut data = Vec::new();
    entry.take(90 * 1024 + 1).read_to_end(&mut data).ok()?;
    if data.len() > 90 * 1024 {
        return None;
    }
    let layout: Value = serde_json::from_slice(&data).ok()?;
    let value = layout["home"]["background"]["image"]
        .as_str()
        .or_else(|| layout["home"]["scene"]["background"]["image"].as_str())?;
    if value.len() > 33000 {
        return None;
    }
    let (mime, encoded) = value.split_once(',')?;
    let bytes = STANDARD.decode(encoded).ok()?;
    let valid = match mime {
        "data:image/png;base64" => bytes.starts_with(b"\x89PNG\r\n\x1a\n"),
        "data:image/jpeg;base64" => bytes.starts_with(b"\xff\xd8\xff"),
        "data:image/webp;base64" => bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP"),
        _ => false,
    };
    valid.then(|| value.to_string())
}

#[cfg(test)]
mod home_background_tests {
    use super::*;
    use std::io::Write;
    #[test]
    fn apk_home_background_is_bounded_and_never_follows_external_urls() {
        let directory =
            std::env::temp_dir().join(format!("puretv-home-cover-{}", std::process::id()));
        fs::create_dir_all(&directory).unwrap();
        let path = directory.join("launcher.apk");
        let png = format!(
            "data:image/png;base64,{}",
            STANDARD.encode(b"\x89PNG\r\n\x1a\nfixture")
        );
        for (image, expected) in [
            (&*png, Some(png.clone())),
            ("https://example.com/cover.png", None),
            ("data:image/svg+xml;base64,PHN2Zz4=", None),
        ] {
            let mut archive = zip::ZipWriter::new(fs::File::create(&path).unwrap());
            archive
                .start_file(
                    "assets/layout.json",
                    zip::write::SimpleFileOptions::default(),
                )
                .unwrap();
            archive
                .write_all(
                    json!({"version":4,"home":{"background":{"image":image}}})
                        .to_string()
                        .as_bytes(),
                )
                .unwrap();
            archive.finish().unwrap();
            assert_eq!(apk_home_background(&path), expected);
        }
        let mut archive = zip::ZipWriter::new(fs::File::create(&path).unwrap());
        archive
            .start_file(
                "assets/layout.json",
                zip::write::SimpleFileOptions::default(),
            )
            .unwrap();
        archive.write_all(&vec![b' '; 90 * 1024 + 1]).unwrap();
        archive.finish().unwrap();
        assert!(apk_home_background(&path).is_none());
        let _ = fs::remove_dir_all(directory);
    }
}
