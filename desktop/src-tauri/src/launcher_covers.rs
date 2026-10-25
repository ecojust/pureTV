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

#[derive(Debug, PartialEq)]
pub struct HomeBackground {
    pub color: String,
    pub image: Option<String>,
}

/// Read only the bounded layout asset; never extract or execute files from an APK.
pub fn apk_home_background(path: &Path) -> Option<HomeBackground> {
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
    let background = match layout["version"].as_u64()? {
        3 => &layout["home"]["scene"]["background"],
        4 | 5 => &layout["home"]["background"],
        _ => return None,
    };
    let fields = background.as_object()?;
    let color = fields.get("color")?.as_str()?;
    if color.len() != 7
        || !color.starts_with('#')
        || !color[1..].bytes().all(|b| b.is_ascii_hexdigit())
    {
        return None;
    }
    let image = match fields.get("image") {
        Some(value) => Some(background_image(value.as_str()?)?),
        None => None,
    };
    Some(HomeBackground {
        color: color.to_string(),
        image,
    })
}

fn background_image(value: &str) -> Option<String> {
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

    fn write_apk(path: &Path, data: &[u8]) {
        let mut archive = zip::ZipWriter::new(fs::File::create(path).unwrap());
        archive
            .start_file(
                "assets/layout.json",
                zip::write::SimpleFileOptions::default(),
            )
            .unwrap();
        archive.write_all(data).unwrap();
        archive.finish().unwrap();
    }

    fn fixture(name: &str) -> std::path::PathBuf {
        let directory =
            std::env::temp_dir().join(format!("puretv-home-cover-{name}-{}", std::process::id()));
        fs::create_dir_all(&directory).unwrap();
        directory.join("launcher.apk")
    }

    #[test]
    fn apk_home_background_reads_images_and_solid_colors_without_modifying_apks() {
        let path = fixture("versions");
        let png = format!(
            "data:image/png;base64,{}",
            STANDARD.encode(b"\x89PNG\r\n\x1a\nfixture")
        );
        for version in [3, 4, 5] {
            for with_image in [true, false] {
                let mut background = json!({"color":"#12abCD"});
                if with_image {
                    background["image"] = json!(png);
                }
                let home = if version == 3 {
                    json!({"scene":{"background":background}})
                } else {
                    json!({"background":background})
                };
                write_apk(
                    &path,
                    json!({"version":version,"home":home})
                        .to_string()
                        .as_bytes(),
                );
                let before = fs::read(&path).unwrap();
                assert_eq!(
                    apk_home_background(&path),
                    Some(HomeBackground {
                        color: "#12abCD".into(),
                        image: with_image.then(|| png.clone()),
                    })
                );
                assert_eq!(fs::read(&path).unwrap(), before);
                assert_eq!(fs::read_dir(path.parent().unwrap()).unwrap().count(), 1);
            }
        }
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }

    #[test]
    fn apk_home_background_rejects_bad_colors_versions_and_external_urls() {
        let path = fixture("invalid");
        let background = json!({"color":"#123456"});
        let mut invalid = vec![
            json!({"version":2,"home":{"background":background}}),
            json!({"version":6,"home":{"background":background}}),
            json!({"version":"5","home":{"background":background}}),
            json!({"version":3,"home":{"background":background}}),
            json!({"version":5,"home":{"scene":{"background":background}}}),
            json!({"version":5,"home":{"background":{}}}),
        ];
        for color in [
            json!("#fff"),
            json!("#12345678"),
            json!("#12gg45"),
            json!("red"),
            json!("url(https://example.com)"),
            json!(123456),
            json!(null),
        ] {
            invalid.push(json!({"version":5,"home":{"background":{"color":color}}}));
        }
        for image in [
            json!("https://example.com/cover.png"),
            json!("file:///tmp/cover.png"),
            json!("data:image/svg+xml;base64,PHN2Zz4="),
            json!("data:image/png;base64,ZmFrZQ=="),
            json!(format!(
                "data:image/jpeg;base64,{}",
                STANDARD.encode(b"\x89PNG\r\n\x1a\nfixture")
            )),
            json!("data:image/png;base64,!bad!"),
            json!(format!("data:image/png;base64,{}", "A".repeat(33000))),
            json!(null),
        ] {
            invalid
                .push(json!({"version":5,"home":{"background":{"color":"#123456","image":image}}}));
        }
        for layout in invalid {
            write_apk(&path, layout.to_string().as_bytes());
            let before = fs::read(&path).unwrap();
            assert_eq!(apk_home_background(&path), None, "{layout}");
            assert_eq!(fs::read(&path).unwrap(), before);
        }
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }

    #[test]
    fn apk_home_background_enforces_archive_and_asset_size_bounds() {
        let path = fixture("bounds");
        write_apk(&path, &vec![b' '; 90 * 1024 + 1]);
        assert!(apk_home_background(&path).is_none());
        write_apk(&path, b"not JSON");
        assert!(apk_home_background(&path).is_none());
        fs::File::create(&path)
            .unwrap()
            .set_len(256 * 1024 * 1024 + 1)
            .unwrap();
        assert!(apk_home_background(&path).is_none());
        fs::remove_dir_all(path.parent().unwrap()).unwrap();
    }
}
