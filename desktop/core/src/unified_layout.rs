use serde_json::{json, Value};
use std::collections::BTreeSet;
const FIELDS: [&str; 9] = [
    "id",
    "name",
    "frame",
    "action",
    "text",
    "visible",
    "icon",
    "color",
    "backgroundColor",
];
pub(crate) fn svg(text: &str) -> Result<(), String> {
    if text.len() > 8192 {
        return Err("SVG 图标超过 8 KiB".into());
    }
    let doc = roxmltree::Document::parse(text).map_err(|_| "SVG 图标格式无效")?;
    if doc.root_element().tag_name().name() != "svg" {
        return Err("图标应为 SVG".into());
    }
    for n in doc.descendants().filter(|n| n.is_element()) {
        if n.tag_name()
            .namespace()
            .is_some_and(|ns| ns != "http://www.w3.org/2000/svg")
        {
            return Err("SVG 命名空间无效".into());
        }
        if ![
            "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
        ]
        .contains(&n.tag_name().name())
        {
            return Err("SVG 含不支持的元素".into());
        }
        for a in n.attributes() {
            if ![
                "viewBox",
                "width",
                "height",
                "x",
                "y",
                "x1",
                "y1",
                "x2",
                "y2",
                "cx",
                "cy",
                "r",
                "rx",
                "ry",
                "d",
                "points",
                "fill",
                "stroke",
                "stroke-width",
                "stroke-linecap",
                "stroke-linejoin",
                "fill-rule",
                "clip-rule",
                "opacity",
                "fill-opacity",
                "stroke-opacity",
                "transform",
                "color",
            ]
            .contains(&a.name())
                || a.namespace().is_some()
            {
                return Err("SVG 含不支持的属性".into());
            }
            let value = a.value().to_ascii_lowercase();
            if [
                "url",
                "javascript:",
                "http:",
                "https:",
                "data:",
                "@import",
                "<",
                ">",
            ]
            .iter()
            .any(|s| value.contains(s))
            {
                return Err("SVG 不支持脚本或外部资源".into());
            }
        }
    }
    Ok(())
}
pub(crate) fn validate(d: &Value) -> Result<(), String> {
    let root = d.as_object().ok_or("布局应为对象")?;
    if root.len() != 4
        || root
            .keys()
            .any(|k| !["version", "screen", "home", "apps"].contains(&k.as_str()))
        || d["version"] != 4
        || d.to_string().len() > 90 * 1024
    {
        return Err("layout.json 版本或大小无效".into());
    }
    let s = d["screen"].as_object().ok_or("缺少屏幕基准")?;
    if s.len() != 2 || s.keys().any(|k| !["width", "height"].contains(&k.as_str())) {
        return Err("屏幕基准字段无效".into());
    }
    let width = d["screen"]["width"]
        .as_u64()
        .filter(|n| (320..=7680).contains(n))
        .ok_or("屏幕宽度应为 320–7680")?;
    let height = d["screen"]["height"]
        .as_u64()
        .filter(|n| (320..=7680).contains(n))
        .ok_or("屏幕高度应为 320–7680")?;
    for page in ["home", "apps"] {
        let p = d[page].as_object().ok_or("缺少布局页面")?;
        if p.len() != 4
            || p.keys()
                .any(|k| !["users", "system", "background", "navigation"].contains(&k.as_str()))
        {
            return Err("页面应包含 users 和 system".into());
        }
        let bg = d[page]["background"].as_object().ok_or("页面缺少背景")?;
        if bg.keys().any(|k| !["color", "image"].contains(&k.as_str())) {
            return Err("背景字段无效".into());
        }
        let color = d[page]["background"]["color"]
            .as_str()
            .ok_or("背景颜色无效")?;
        if color.len() != 7
            || !color.starts_with('#')
            || !color[1..].bytes().all(|b| b.is_ascii_hexdigit())
        {
            return Err("背景颜色无效".into());
        }
        if let Some(image) = bg.get("image") {
            let value = image.as_str().ok_or("背景图片无效")?;
            if value.len() > 33000
                || ![
                    "data:image/png;base64,",
                    "data:image/jpeg;base64,",
                    "data:image/webp;base64,",
                ]
                .iter()
                .any(|prefix| value.starts_with(prefix))
            {
                return Err("背景图片无效".into());
            }
            use base64::Engine;
            base64::engine::general_purpose::STANDARD
                .decode(value.split_once(',').ok_or("背景图片无效")?.1)
                .map_err(|_| "背景图片编码无效")?;
        }
        let nav = d[page]["navigation"]
            .as_object()
            .ok_or("页面缺少导航定义")?;
        if nav.iter().any(|(k, v)| {
            !["up", "down", "left", "right"].contains(&k.as_str())
                || !v.as_str().is_some_and(|v| ["home", "apps"].contains(&v))
        }) {
            return Err("页面导航无效".into());
        }
        let mut ids = BTreeSet::new();
        let mut packages = BTreeSet::new();
        for kind in ["users", "system"] {
            let nodes = d[page][kind].as_array().ok_or("组件应为列表")?;
            if nodes.len()
                > if kind == "system" {
                    32
                } else if page == "home" {
                    24
                } else {
                    100
                }
            {
                return Err("布局应用数量超出限制".into());
            }
            for n in nodes {
                let fields = n.as_object().ok_or("组件应为对象")?;
                if fields.len() != FIELDS.len()
                    || fields.keys().any(|k| !FIELDS.contains(&k.as_str()))
                {
                    return Err("组件字段无效".into());
                }
                let id = n["id"].as_str().ok_or("组件 id 无效")?;
                if id.is_empty()
                    || id.len() > 100
                    || !id
                        .bytes()
                        .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_')
                    || !ids.insert(id)
                {
                    return Err("组件 id 无效或重复".into());
                }
                for key in ["name", "text"] {
                    if n[key].as_str().is_none_or(|s| s.chars().count() > 100) {
                        return Err("组件文案无效".into());
                    }
                }
                let action = n["action"].as_str().ok_or("组件 action 无效")?;
                if !crate::parse::package(action) {
                    return Err("组件 action 应为应用标识".into());
                }
                if kind == "users" && !packages.insert(action) {
                    return Err("布局中有重复应用".into());
                }
                if !n["visible"].is_boolean() {
                    return Err("组件显示状态无效".into());
                }
                for key in ["color", "backgroundColor"] {
                    let c = n[key].as_str().ok_or("组件颜色无效")?;
                    if c.len() != 7
                        || !c.starts_with('#')
                        || !c[1..].bytes().all(|b| b.is_ascii_hexdigit())
                    {
                        return Err("组件颜色无效".into());
                    }
                }
                svg(n["icon"].as_str().ok_or("图标应为 SVG 文本")?)?;
                let f = n["frame"].as_object().ok_or("组件缺少坐标尺寸")?;
                if f.len() != 4
                    || f.keys()
                        .any(|k| !["x", "y", "width", "height"].contains(&k.as_str()))
                {
                    return Err("frame 字段无效".into());
                }
                let x = n["frame"]["x"].as_u64().ok_or("位置应为非负整数")?;
                let y = n["frame"]["y"].as_u64().ok_or("位置应为非负整数")?;
                let w = n["frame"]["width"].as_u64().ok_or("尺寸应为正整数")?;
                let h = n["frame"]["height"].as_u64().ok_or("尺寸应为正整数")?;
                if x > width || y > height || w == 0 || h == 0 || w > width - x || h > height - y {
                    return Err("组件超出屏幕基准范围".into());
                }
            }
        }
    }
    Ok(())
}
pub(crate) fn locked(next: &Value, current: &Value) -> Result<(), String> {
    if next["version"] != 4 || current["version"] != 4 {
        return Err("请先读取新版启动器布局".into());
    }
    for page in ["home", "apps"] {
        let mut expected = current[page]["system"].clone();
        for n in expected.as_array_mut().ok_or("系统组件不可用")? {
            for (field, axis) in [
                ("x", "width"),
                ("width", "width"),
                ("y", "height"),
                ("height", "height"),
            ] {
                let v = n["frame"][field].as_f64().ok_or("系统坐标无效")?;
                let scaled = (v * next["screen"][axis].as_f64().ok_or("屏幕基准无效")?
                    / current["screen"][axis].as_f64().ok_or("屏幕基准无效")?)
                .round() as u64;
                n["frame"][field] = json!(if field == "width" || field == "height" {
                    scaled.max(1)
                } else {
                    scaled
                });
            }
        }
        if next[page]["system"] != expected {
            return Err("系统组件只读，不能修改属性或位置".into());
        }
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> Value {
        serde_json::from_str(include_str!("../../public/layout.json")).unwrap()
    }
    fn user() -> Value {
        json!({"id":"app-user","name":"电视应用","text":"打开电视应用","action":"com.example.tv","frame":{"x":40,"y":220,"width":200,"height":150},"visible":true,"icon":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M0 0L24 24\"/></svg>","color":"#FFFFFF","backgroundColor":"#123456"})
    }
    #[test]
    fn v4_user_components_are_validated_and_system_changes_are_rejected() {
        let original = sample();
        validate(&original).unwrap();
        let mut next = original.clone();
        next["home"]["users"] = json!([user()]);
        validate(&next).unwrap();
        locked(&next, &original).unwrap();
        for field in ["name", "action", "text", "icon", "visible", "frame"] {
            let mut bad = next.clone();
            bad["home"]["system"][0][field] = json!("changed");
            assert!(locked(&bad, &original).is_err());
        }
        let mut bad = next.clone();
        bad["home"]["users"][0]["action"] = json!("com.app;reboot");
        assert!(validate(&bad).is_err());
        let mut bad = next.clone();
        bad["home"]["users"][0]["frame"]["width"] = json!(10000);
        assert!(validate(&bad).is_err());
        let mut bad = next.clone();
        bad["home"]["users"][0]["icon"] =
            json!("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>");
        assert!(validate(&bad).is_err());
        let mut scaled = original.clone();
        scaled["screen"] = json!({"width":1920,"height":1080});
        for page in ["home", "apps"] {
            for node in scaled[page]["system"].as_array_mut().unwrap() {
                for key in ["x", "y", "width", "height"] {
                    node["frame"][key] = json!(node["frame"][key].as_u64().unwrap() * 2);
                }
            }
        }
        validate(&scaled).unwrap();
        locked(&scaled, &original).unwrap();
    }
    #[test]
    fn svg_rejects_embedded_scripts_network_resources_and_dtd() {
        for text in [
            "<svg xmlns=\"http://evil\"/>",
            "<svg><image href=\"https://evil\"/></svg>",
            "<svg onload=\"alert(1)\"/>",
            "<!DOCTYPE svg [<!ENTITY x \"hi\">]><svg>&x;</svg>",
            "<svg><path fill=\"url(http://evil)\"/></svg>",
        ] {
            assert!(svg(text).is_err(), "{text}");
        }
    }
}
