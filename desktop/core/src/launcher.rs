use super::*;
use crate::LauncherRequest;
use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::{json, Value};
const PACKAGE: &str = "com.ecojust.puretv";
const URI: &str = "content://com.ecojust.puretv.layout";
const LAYOUT_LIMIT: usize = 48 * 1024;

pub(crate) fn validate_layout(layout: &Value) -> Result<(), String> {
    if (layout["version"] == 4 || layout["version"] == 5) {
        return crate::unified_layout::validate(layout);
    }
    let object = layout.as_object().ok_or("layout.json 应为对象")?;
    if object
        .keys()
        .any(|key| !["version", "home", "apps"].contains(&key.as_str()))
        || ![json!(2), json!(3)].contains(&layout["version"])
        || layout.to_string().len() > LAYOUT_LIMIT
    {
        return Err("layout.json 版本或大小无效".into());
    }
    for (section, max) in [("home", 24), ("apps", 100)] {
        let page = layout[section]
            .as_object()
            .ok_or("home/apps 应为页面对象")?;
        if page
            .keys()
            .any(|key| !["columns", "items", "scene"].contains(&key.as_str()))
            || !layout[section]["columns"]
                .as_u64()
                .is_some_and(|n| (1..=6).contains(&n))
        {
            return Err("页面列数应为 1–6".into());
        }
        if layout["version"] == 3 {
            validate_scene(&layout[section]["scene"], section)?;
        } else if layout[section].get("scene").is_some() {
            return Err("旧版布局不支持 scene".into());
        }
        let entries = layout[section]["items"]
            .as_array()
            .ok_or("items 应为列表")?;
        if entries.len() > max {
            return Err("布局应用数量超出限制".into());
        }
        let mut seen = BTreeSet::new();
        for entry in entries {
            let fields = entry.as_object().ok_or("布局项应为对象")?;
            if fields.keys().any(|key| {
                ![
                    "action",
                    "packageName",
                    "label",
                    "icon",
                    "color",
                    "frame",
                    "visible",
                    "zIndex",
                ]
                .contains(&key.as_str())
            }) {
                return Err("布局含未知字段".into());
            }
            validate_geometry(entry)?;
            let action = entry
                .get("action")
                .map(|v| v.as_str().ok_or("action 应为字符串"))
                .transpose()?
                .unwrap_or("app");
            if ![
                "app",
                "music",
                "bilibili",
                "files",
                "apps",
                "shortvideo",
                "webtv",
                "placeholder",
            ]
            .contains(&action)
            {
                return Err("布局操作不支持".into());
            }
            let key = if action == "app" {
                let package = entry["packageName"].as_str().ok_or("请指定应用包名")?;
                if !parse::package(package) {
                    return Err("应用包名无效".into());
                }
                package
            } else {
                if entry.get("packageName").is_some() {
                    return Err("内置入口不能指定 packageName".into());
                }
                action
            };
            if action != "placeholder" && !seen.insert(key) {
                return Err("布局中有重复应用".into());
            }
            if entry
                .get("label")
                .is_some_and(|v| v.as_str().is_none_or(|s| s.chars().count() > 100))
            {
                return Err("显示名称无效".into());
            }
            if entry.get("icon").is_some_and(|v| {
                v.as_str().is_none_or(|s| {
                    ![
                        "app", "music", "video", "files", "apps", "picture", "settings", "input",
                    ]
                    .contains(&s)
                })
            }) {
                return Err("图标类型无效".into());
            }
            if entry.get("color").is_some_and(|v| {
                v.as_str().is_none_or(|s| {
                    s.len() != 7
                        || !s.starts_with('#')
                        || !s[1..].bytes().all(|b| b.is_ascii_hexdigit())
                })
            }) {
                return Err("卡片颜色应为 #RRGGBB".into());
            }
        }
    }
    Ok(())
}
fn validate_geometry(node: &Value) -> Result<(), String> {
    if node.get("visible").is_some_and(|v| !v.is_boolean())
        || node
            .get("zIndex")
            .is_some_and(|v| !v.as_u64().is_some_and(|n| n <= 20))
    {
        return Err("布局显示属性无效".into());
    }
    if let Some(f) = node.get("frame") {
        let fields = f.as_object().ok_or("frame 应为对象")?;
        if fields.len() != 4
            || fields
                .keys()
                .any(|k| !["x", "y", "width", "height"].contains(&k.as_str()))
        {
            return Err("frame 字段无效".into());
        }
        let x = f["x"].as_u64().ok_or("位置应为非负整数")?;
        let y = f["y"].as_u64().ok_or("位置应为非负整数")?;
        let w = f["width"].as_u64().ok_or("尺寸应为正整数")?;
        let h = f["height"].as_u64().ok_or("尺寸应为正整数")?;
        if w == 0 || h == 0 || x > 960 || y > 540 || w > 960 - x || h > 540 - y {
            return Err("元素超出 960×540 画布".into());
        }
    }
    Ok(())
}
fn validate_scene(scene: &Value, section: &str) -> Result<(), String> {
    let fields = scene.as_object().ok_or("scene 应为对象")?;
    if fields
        .keys()
        .any(|k| !["background", "elements"].contains(&k.as_str()))
    {
        return Err("scene 含未知字段".into());
    }
    let bg = &scene["background"];
    let fields = bg.as_object().ok_or("背景应为对象")?;
    if fields
        .keys()
        .any(|k| !["frame", "visible", "zIndex", "color", "image"].contains(&k.as_str()))
    {
        return Err("背景含未知字段".into());
    }
    if bg.get("frame").is_none() {
        return Err("背景缺少 frame".into());
    }
    validate_geometry(bg)?;
    let c = bg["color"].as_str().ok_or("背景颜色无效")?;
    if c.len() != 7 || !c.starts_with('#') || !c[1..].bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err("背景颜色无效".into());
    }
    if let Some(image) = bg.get("image") {
        let text = image.as_str().ok_or("背景图片无效")?;
        let (prefix, data) = text.split_once(',').ok_or("背景图片无效")?;
        if text.len() > 33000
            || ![
                "data:image/png;base64",
                "data:image/jpeg;base64",
                "data:image/webp;base64",
            ]
            .contains(&prefix)
        {
            return Err("背景图片无效".into());
        }
        let bytes = STANDARD.decode(data).map_err(|_| "背景图片编码无效")?;
        if !(bytes.starts_with(b"\x89PNG\r\n\x1a\n")
            || bytes.starts_with(b"\xff\xd8\xff")
            || (bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP")))
        {
            return Err("背景图片格式无效".into());
        }
    }
    let elements = scene["elements"].as_array().ok_or("elements 应为列表")?;
    let mut seen = BTreeSet::new();
    let allowed = if section == "home" {
        vec![
            "clock",
            "date",
            "weather",
            "wallpaper",
            "favourites",
            "inputs",
            "network",
            "settings",
            "allApps",
        ]
    } else {
        vec!["title", "subtitle", "backHome"]
    };
    for node in elements {
        let fields = node.as_object().ok_or("元素应为对象")?;
        let id = node["id"].as_str().ok_or("元素 id 无效")?;
        if !allowed.contains(&id)
            || !seen.insert(id)
            || !fields.contains_key("frame")
            || fields
                .keys()
                .any(|k| !["id", "frame", "visible", "zIndex"].contains(&k.as_str()))
        {
            return Err("元素 id 或字段无效".into());
        }
        validate_geometry(node)?;
    }
    Ok(())
}
fn provider_result(output: &str) -> Result<Value, String> {
    let encoded = output
        .split("result=")
        .nth(1)
        .ok_or("启动器未返回布局接口结果")?
        .chars()
        .take_while(|c| c.is_ascii_alphanumeric() || matches!(c, '+' | '/' | '='))
        .collect::<String>();
    let bytes = STANDARD
        .decode(encoded)
        .map_err(|_| "启动器布局响应编码无效")?;
    if bytes.len() > 2 * 1024 * 1024 {
        return Err("启动器布局响应过大".into());
    }
    let mut value: Value = serde_json::from_slice(&bytes).map_err(|_| "启动器布局响应无效")?;
    if value["supported"] != true
        || ![json!(2), json!(3), json!(4), json!(5)].contains(&value["version"])
    {
        return Err("启动器布局接口版本不支持".into());
    }
    validate_layout(&value["layout"])?;
    if value["version"] != value["layout"]["version"] {
        return Err("启动器布局接口与配置版本不一致".into());
    }
    if (value["layout"]["version"] == 4 || value["layout"]["version"] == 5) {
        let baseline = crate::unified_layout::basis(&value)?;
        validate_layout(&baseline)?;
        crate::unified_layout::locked(&value["layout"], &baseline)?;
    }
    let apps = value["apps"].as_array().ok_or("启动器应用列表无效")?;
    if apps.len() > 100 {
        return Err("启动器应用列表超过限制".into());
    }
    let mut clean = Vec::new();
    for app in apps {
        let package = app["packageName"].as_str().ok_or("应用包名无效")?;
        if !parse::package(package) {
            return Err("应用包名无效".into());
        }
        let label: String = app["label"]
            .as_str()
            .unwrap_or(package)
            .chars()
            .take(200)
            .collect();
        let mut entry = json!({"packageName":package,"label":label});
        if let Some(encoded) = app["iconPng"].as_str().filter(|s| s.len() <= 12000) {
            if STANDARD
                .decode(encoded)
                .is_ok_and(|data| data.len() <= 8192 && data.starts_with(b"\x89PNG\r\n\x1a\n"))
            {
                entry["iconPng"] = json!(encoded);
            }
        }
        clean.push(entry);
    }
    value["apps"] = json!(clean);
    Ok(value)
}
impl Manager {
    fn layout_provider(
        &mut self,
        device: &Device,
        method: &str,
        arg: Option<String>,
    ) -> Result<Value, String> {
        let mut args = vec![
            "-s".into(),
            device.serial.clone(),
            "shell".into(),
            "content".into(),
            "call".into(),
            "--uri".into(),
            URI.into(),
            "--user".into(),
            device.user_id.to_string(),
            "--method".into(),
            method.into(),
        ];
        if let Some(arg) = arg {
            args.extend(["--arg".into(), arg]);
        }
        provider_result(&self.run(args, None, 20)?)
    }
    pub fn execute_launcher(&mut self, request: LauncherRequest) -> Result<Value, String> {
        let device = self.ensure_device(true)?;
        self.read_catalogue(&device)?;
        if matches!(request, LauncherRequest::GetBackgrounds) {
            let mut backgrounds = serde_json::Map::new();
            if self
                .state
                .launchers
                .iter()
                .any(|l| l.package_name == PACKAGE)
            {
                if let Ok(value) = self.layout_provider(&device, "status", None) {
                    let layout = &value["layout"];
                    let image = if (layout["version"] == 4 || layout["version"] == 5) {
                        layout["home"]["background"]["image"].as_str()
                    } else {
                        layout["home"]["scene"]["background"]["image"].as_str()
                    };
                    if let Some(image) = image {
                        for launcher in &self.state.launchers {
                            if launcher.package_name == PACKAGE {
                                backgrounds.insert(launcher.component.clone(), json!(image));
                            }
                        }
                    }
                }
            }
            return Ok(
                json!({"supported":true,"serial":device.serial,"userId":device.user_id,"backgrounds":backgrounds}),
            );
        }
        let component = self
            .state
            .default_home
            .clone()
            .ok_or("无法确认当前默认启动器")?;
        if component.split('/').next() != Some(PACKAGE) {
            if !matches!(request, LauncherRequest::GetLayout) {
                return Err("当前启动器未接入可验证的布局接口，未修改配置".into());
            }
            return Ok(
                json!({"supported":false,"component":component,"message":"此启动器尚未接入可验证的布局接口，请使用它自身的自定义设置。管理器不会尝试改写未知格式。"}),
            );
        }
        let value = match self.layout_provider(&device, "status", None) {
            Ok(mut value) => {
                value["component"] = json!(component);
                value["serial"] = json!(device.serial);
                value["userId"] = json!(device.user_id);
                value
            }
            Err(error) => {
                if matches!(request, LauncherRequest::GetLayout) {
                    return Ok(
                        json!({"supported":false,"component":component,"message":format!("当前 pureTV 未开放布局接口或设备限制访问；请安装支持 layout.json 的新版启动器。{error}")}),
                    );
                }
                return Err("无法读取布局接口，未修改启动器配置".into());
            }
        };
        if matches!(request, LauncherRequest::GetLayout) {
            return Ok(value);
        }
        let (method, arg, expected) = match request {
            LauncherRequest::ApplyLayout { layout } => {
                validate_layout(&layout)?;
                if (layout["version"] == 4 || layout["version"] == 5) {
                    crate::unified_layout::locked(&layout, &crate::unified_layout::basis(&value)?)?;
                }
                for section in ["home", "apps"] {
                    let unified = (layout["version"] == 4 || layout["version"] == 5);
                    for entry in layout[section][if unified { "users" } else { "items" }]
                        .as_array()
                        .unwrap()
                    {
                        if let Some(package) =
                            entry[if unified { "action" } else { "packageName" }].as_str()
                        {
                            if !self.state.packages.iter().any(|app| {
                                app.package_name == package
                                    && app.installed
                                    && !app.system
                                    && app.enabled
                            }) || !value["apps"]
                                .as_array()
                                .unwrap()
                                .iter()
                                .any(|app| app["packageName"] == package)
                            {
                                return Err("布局只能选择当前用户已安装、可启动的用户应用".into());
                            }
                        }
                    }
                }
                (
                    "apply",
                    Some(STANDARD.encode(layout.to_string())),
                    Some(layout),
                )
            }
            LauncherRequest::ResetLayout => ("reset", None, None),
            _ => unreachable!(),
        };
        // Recheck target/user and HOME immediately before writing.
        self.ensure_device(true)?;
        self.read_catalogue(&device)?;
        if self.state.default_home.as_deref() != Some(component.as_str()) {
            return Err("默认启动器已改变，请重新读取布局".into());
        }
        self.defer_cancel = true;
        let result = (|| {
            let returned = self.layout_provider(&device, method, arg)?;
            if expected
                .as_ref()
                .is_some_and(|layout| &returned["layout"] != layout)
                || (method == "reset" && returned["custom"] != false)
            {
                return Err("启动器未确认预期布局，请重新读取核对".into());
            }
            let reread = self.layout_provider(&device, "status", None)?;
            if returned["layout"] != reread["layout"] {
                return Err("布局写入后复查不一致".into());
            }
            let mut reread = reread;
            reread["component"] = json!(component);
            reread["serial"] = json!(device.serial);
            reread["userId"] = json!(device.user_id);
            reread["message"] = json!(if method == "reset" {
                "默认布局已恢复并复查"
            } else {
                "布局已应用并复查"
            });
            Ok(reread)
        })();
        self.defer_cancel = false;
        self.record(
            "启动器布局",
            &component,
            result.is_ok(),
            if result.is_ok() {
                "布局已应用并复查"
            } else {
                "布局应用失败，请重新读取核对"
            },
        );
        self.state.revision = self.state.revision.saturating_add(1);
        self.persist()?;
        result
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn layout_validation_and_provider_response_are_bounded_and_data_only() {
        let valid: Value =
            serde_json::from_str(include_str!("../../public/layout-v3.json")).unwrap();
        validate_layout(&valid).unwrap();
        for update in [
            json!({"home":{"columns":7,"items":[]}}),
            json!({"version":1}),
            json!({"home":[{"packageName":"x;reboot"}]}),
            json!({"home":[{"packageName":"com.example.app","command":"reboot"}]}),
            json!({"home":[{"packageName":"com.example.app","icon":"https://untrusted/icon"}]}),
        ] {
            let mut bad = valid.clone();
            for (key, value) in update.as_object().unwrap() {
                bad[key] = value.clone();
            }
            assert!(validate_layout(&bad).is_err());
        }
        let value = json!({"supported":true,"version":valid["version"],"layout":valid,"apps":[]});
        assert_eq!(
            provider_result(&format!(
                "Bundle[{{result={}}}]",
                STANDARD.encode(value.to_string())
            ))
            .unwrap(),
            value
        );
        assert!(provider_result("Permission denial").is_err());
    }
    #[test]
    fn scene_geometry_and_fixed_control_ids_are_validated_before_writes() {
        let valid: Value =
            serde_json::from_str(include_str!("../../public/layout-v3.json")).unwrap();
        validate_layout(&valid).unwrap();
        for invalid in [
            json!({"x":950,"y":0,"width":200,"height":65}),
            json!({"x":0,"y":-1,"width":200,"height":65}),
            json!({"x":0,"y":0,"width":0,"height":65}),
            json!({"x":0.5,"y":0,"width":200,"height":65}),
            json!({"x":18446744073709551615u64,"y":0,"width":200,"height":65}),
        ] {
            let mut bad = valid.clone();
            bad["home"]["scene"]["elements"][0]["frame"] = invalid;
            assert!(validate_layout(&bad).is_err());
        }
        let mut bad = valid.clone();
        bad["home"]["scene"]["elements"][0]["id"] = json!("shell");
        assert!(validate_layout(&bad).is_err());
        let mut bad = valid.clone();
        bad["home"]["scene"]["background"]["image"] = json!("https://example.com/background.png");
        assert!(validate_layout(&bad).is_err());
        let mut bad = valid.clone();
        bad["home"]["items"][0]["visible"] = json!("false");
        assert!(validate_layout(&bad).is_err());
        let mut bad = valid.clone();
        bad["home"]["scene"]["elements"][1] = bad["home"]["scene"]["elements"][0].clone();
        assert!(validate_layout(&bad).is_err());
    }
}
