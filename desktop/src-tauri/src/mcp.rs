//! Local MCP transport. The stdio process relays to the running GUI's service.
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    fs,
    io::{BufRead, Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};
const LIMIT: u64 = 1024 * 1024;

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Endpoint {
    url: String,
    token: String,
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Info {
    pub config: Value,
    pub session_path: PathBuf,
}

fn schema(properties: Value, required: &[&str]) -> Value {
    json!({"type":"object","properties":properties,"required":required,"additionalProperties":false})
}
fn tool(
    name: &str,
    description: &str,
    properties: Value,
    required: &[&str],
    read_only: bool,
) -> Value {
    json!({"name":name,"description":description,"inputSchema":schema(properties,required),
        "annotations":{"readOnlyHint":read_only,"destructiveHint":!read_only,"openWorldHint":false}})
}
pub fn tools() -> Vec<Value> {
    let packages = json!({"type":"array","items":{"type":"string"},"minItems":1,"maxItems":100});
    vec![
        tool("close_manager","Close the open manager after cancelling pending work and stopping the configured ADB server. In-flight mutations finish first. This interrupts connections using that ADB server; explicit user confirmation is required. A stdio disconnection during shutdown is expected.",json!({"confirmShutdown":{"type":"boolean","const":true}}),&["confirmShutdown"],false),
        tool("get_local_network","Refresh this computer's active LAN IPv4 addresses, adapter names and subnet prefixes. Returns the shared snapshot; no ADB or TV connection required.",json!({}),&[],true),
        tool("get_interface_preferences","Get the open manager's interface language and theme preferences.",json!({}),&[],true),
        tool("set_interface_preferences","Change and persist the open manager's interface language and theme. Device state is unchanged.",json!({"locale":{"type":"string","enum":["zh-CN","zh-TW","en"]},"theme":{"type":"string","enum":["emerald","ocean","graphite"]}}),&[],false),
        tool("refresh_system_info","Refresh connected TV manufacturer, Android SDK/security patch, CPU/ABI, RAM, /data storage, resolution and uptime. Unavailable values remain null.",json!({}),&[],true),
        tool("get_launcher_covers","Read locally saved, user-provided launcher background images. No TV screenshots.",json!({}),&[],true),
        tool("set_launcher_cover","Set a launcher card background from a local PNG/JPEG/WebP image (max 4 MiB), or remove it when path is omitted. Key is the launcher component.",json!({"key":{"type":"string"},"path":{"type":"string"}}),&["key"],false),
        tool("choose_launcher_json","Open the manager's layout.json file picker and return UTF-8 configuration text; does not apply it.",json!({}),&[],true),
        tool("get_launcher_backgrounds","Read Home background images for installed supported launchers without activating them. Returns component-keyed images, device serial and user id; no TV screenshots.",json!({}),&[],true),
        tool("get_launcher_layout","Read the CURRENT default launcher's verified layout.json capability, layout and launchable apps with icons. Unsupported launchers remain read-only.",json!({}),&[],true),
        tool("apply_launcher_layout","Apply a data-only layout.json layout to the current supported launcher, then read it back. Layout is a JSON string; v4 defines screen, users, immutable system, independent page backgrounds and navigation. Components use package-style actions, frames and SVG icons. Legacy v2/v3 remain supported. Home supports 0–24 user apps, Apps 0–100. No shell, arbitrary intents or remote icon URLs.",json!({"layoutJson":{"type":"string"}}),&["layoutJson"],false),
        tool("reset_launcher_layout","Remove the supported current launcher's layout.json override and verify defaults. Does not reset wallpaper or other settings.",json!({}),&[],false),
        tool("get_state","Get current TV, apps, launchers and history. Cached state remains available during operations.",json!({}),&[],true),
        tool("get_status","Get operation busy/cancellation state, download progress and latest snapshot.",json!({}),&[],true),
        tool("set_adb_path","Select a local adb executable. Empty path automatically discovers ADB; disconnect TV first.",json!({"path":{"type":"string"}}),&["path"],false),
        tool("connect","Connect to an Android TV and scan when authorized. Accept the TV's authorization prompt if needed.",json!({"host":{"type":"string"},"port":{"type":"integer","minimum":1,"maximum":65535}}),&["host","port"],false),
        tool("disconnect","Disconnect the selected TV.",json!({}),&[],false),
        tool("scan","Refresh apps, recovery candidates, current Android user and HOME launchers.",json!({}),&[],true),
        tool("set_enabled","Enable or disable explicit package names. Core components and current HOME remain protected.",json!({"packages":packages,"enabled":{"type":"boolean"}}),&["packages","enabled"],false),
        tool("uninstall","Uninstall explicit packages for current Android user, retaining data. Does not delete system partition APKs.",json!({"packages":packages}),&["packages"],false),
        tool("restore","Restore packages still available on the device using install-existing.",json!({"packages":packages}),&["packages"],false),
        tool("install","Install local single APK files in order, reporting each result. APKS/XAPK are unsupported.",json!({"paths":{"type":"array","items":{"type":"string"},"minItems":1,"maxItems":10}}),&["paths"],false),
        tool("set_home","Set an installed HOME component as TV launcher and record previous HOME for recovery.",json!({"component":{"type":"string"}}),&["component"],false),
        tool("restore_home","Restore the recorded original launcher for this TV/user.",json!({}),&[],false),
        tool("clear_history","Clear the saved operation history.",json!({}),&[],false),
        tool("cancel","Cancel download/scan or stop subsequent batch items. An in-flight mutation finishes and is checked.",json!({}),&[],false),
        tool("platform_tools_info","Get pinned ADB version, sizes, platform support and managed cache availability; no download.",json!({}),&[],true),
        tool("install_platform_tools","Download/verify/configure ADB or reuse verified offline cache. Set forceDownload=true to fetch a new verified copy even when the cache is valid. Google with Tencent fallback. Requires explicit Android SDK license acceptance; disconnect TV first.",json!({"forceDownload":{"type":"boolean","description":"Force a fresh download; preserve current ADB on cancellation or failure."},"acceptedLicense":{"type":"boolean","const":true,"description":"Set true only after the user accepts https://developer.android.com/studio/terms"}}),&["acceptedLicense"],false),
        tool("choose_apks","Open the manager's native multi-APK picker. Returns paths; does not install.",json!({}),&[],true),
        tool("choose_adb","Open the manager's native executable picker. Returns path; does not configure it.",json!({}),&[],true),
        tool("open_resource","Open the allowlisted APK resource catalog, project, Platform Tools or Android SDK license page in the user's browser.",json!({"resource":{"type":"string","enum":["catalog","releases","platformTools","platformToolsLicense"]}}),&["resource"],false),
    ]
}
fn error(id: Value, code: i64, message: &str) -> Value {
    json!({"jsonrpc":"2.0","id":id,"error":{"code":code,"message":message}})
}
fn valid_arguments(tool: &Value, arguments: &Value) -> bool {
    let Some(args) = arguments.as_object() else {
        return false;
    };
    let input = &tool["inputSchema"];
    if input["required"]
        .as_array()
        .unwrap()
        .iter()
        .any(|k| !args.contains_key(k.as_str().unwrap()))
    {
        return false;
    }
    args.iter().all(|(key, v)| {
        let Some(rule) = input["properties"].get(key) else {
            return false;
        };
        let typed = match rule["type"].as_str() {
            Some("string") => v.is_string(),
            Some("boolean") => v.is_boolean(),
            Some("integer") => v.as_u64().is_some_and(|n| {
                n >= rule["minimum"].as_u64().unwrap_or(0)
                    && n <= rule["maximum"].as_u64().unwrap_or(u64::MAX)
            }),
            Some("array") => v.as_array().is_some_and(|a| {
                a.len() >= rule["minItems"].as_u64().unwrap_or(0) as usize
                    && a.len() <= rule["maxItems"].as_u64().unwrap_or(u64::MAX) as usize
                    && a.iter().all(Value::is_string)
            }),
            _ => false,
        };
        typed
            && rule.get("const").is_none_or(|c| c == v)
            && rule
                .get("enum")
                .is_none_or(|e| e.as_array().unwrap().contains(v))
    })
}

pub fn launcher_request(
    name: &str,
    args: Value,
) -> Result<Option<puretv_core::LauncherRequest>, String> {
    use puretv_core::LauncherRequest;
    Ok(match name {
        "get_launcher_layout" => Some(LauncherRequest::GetLayout),
        "get_launcher_backgrounds" => Some(LauncherRequest::GetBackgrounds),
        "apply_launcher_layout" => {
            let text = args["layoutJson"]
                .as_str()
                .ok_or("layoutJson 应为 JSON 字符串")?;
            if text.len() > 90 * 1024 {
                return Err("layout.json 不能超过 90 KiB".into());
            }
            Some(LauncherRequest::ApplyLayout {
                layout: serde_json::from_str(text).map_err(|_| "layout.json 格式无效")?,
            })
        }
        "reset_launcher_layout" => Some(LauncherRequest::ResetLayout),
        _ => None,
    })
}

pub fn core_request(name: &str, mut args: Value) -> Result<puretv_core::Request, String> {
    let action = match name {
        "get_state" => "getState",
        "refresh_system_info" => "refreshSystemInfo",
        "get_local_network" => "refreshLocalNetwork",
        "set_adb_path" => "setAdbPath",
        "set_enabled" => "setEnabled",
        "set_home" => "setHome",
        "restore_home" => "restoreHome",
        "clear_history" => "clearHistory",
        "connect" | "pair" | "disconnect" | "scan" | "uninstall" | "restore" | "install" => name,
        _ => return Err("未知 MCP 工具".into()),
    };
    args["action"] = json!(action);
    serde_json::from_value(args).map_err(|_| "工具参数无效".into())
}

pub fn dispatch(
    message: Value,
    call: &dyn Fn(&str, Value) -> Result<Value, String>,
) -> Option<Value> {
    let id = message.get("id").cloned();
    if message["jsonrpc"] != "2.0"
        || !message["method"].is_string()
        || id
            .as_ref()
            .is_some_and(|id| !id.is_string() && !id.is_number())
    {
        return Some(error(
            id.unwrap_or(Value::Null),
            -32600,
            "Invalid JSON-RPC request",
        ));
    }
    let method = message["method"].as_str().unwrap();
    let Some(id) = id else {
        return None;
    };
    let result = match method {
        "initialize" => {
            let requested = message["params"]["protocolVersion"].as_str().unwrap_or("");
            let version = if ["2024-11-05", "2025-03-26", "2025-06-18"].contains(&requested) {
                requested
            } else {
                "2025-06-18"
            };
            json!({"protocolVersion":version,"capabilities":{"tools":{"listChanged":false}},"serverInfo":{"name":"pureTV Manager","version":env!("CARGO_PKG_VERSION")},"instructions":"Controls the open pureTV Manager. All operations use its current TV and Android user; get_state/get_status show actual results. Protected core components cannot be disabled/uninstalled. SDK download requires user license acceptance."})
        }
        "ping" => json!({}),
        "tools/list" => json!({"tools":tools()}),
        "tools/call" => {
            let name = message["params"]["name"].as_str().unwrap_or("");
            let list = tools();
            let Some(tool) = list.iter().find(|t| t["name"] == name) else {
                return Some(error(id, -32602, "Unknown tool"));
            };
            let args = message["params"]
                .get("arguments")
                .cloned()
                .unwrap_or(json!({}));
            if !valid_arguments(tool, &args) {
                return Some(error(id, -32602, "Invalid tool arguments"));
            }
            match call(name, args) {
                Ok(value) => {
                    if let Some(image) = value["image"]
                        .as_str()
                        .and_then(|s| s.strip_prefix("data:image/png;base64,"))
                    {
                        let image = image.to_string();
                        let mut metadata = value;
                        metadata.as_object_mut().unwrap().remove("image");
                        return Some(
                            json!({"jsonrpc":"2.0","id":id,"result":{"content":[{"type":"image","mimeType":"image/png","data":image},{"type":"text","text":metadata.to_string()}],"structuredContent":{"result":metadata},"isError":false}}),
                        );
                    }
                    let failed = value
                        .get("failedTargets")
                        .and_then(Value::as_array)
                        .is_some_and(|failed| !failed.is_empty());
                    json!({"content":[{"type":"text","text":value.to_string()}],"structuredContent":{"result":value},"isError":failed})
                }
                Err(message) => json!({"content":[{"type":"text","text":message}],"isError":true}),
            }
        }
        _ => return Some(error(id, -32601, "Method not found")),
    };
    Some(json!({"jsonrpc":"2.0","id":id,"result":result}))
}

pub fn start(
    directory: &Path,
    call: Arc<dyn Fn(&str, Value) -> Result<Value, String> + Send + Sync>,
) -> Result<Info, String> {
    let server = tiny_http::Server::http("127.0.0.1:0").map_err(|_| "无法启动本地 MCP 服务")?;
    let mut secret = [0u8; 32];
    getrandom::fill(&mut secret).map_err(|_| "无法生成 MCP 凭据")?;
    let token: String = secret.iter().map(|b| format!("{b:02x}")).collect();
    let endpoint = Endpoint {
        url: format!("http://{}/mcp", server.server_addr()),
        token: token.clone(),
    };
    fs::create_dir_all(directory).map_err(|_| "无法创建 MCP 配置目录")?;
    let path = directory.join("mcp-session.json");
    let temp = directory.join(format!(".mcp-session-{}", std::process::id()));
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(&temp).map_err(|_| "无法创建 MCP 会话文件")?;
    file.write_all(&serde_json::to_vec(&endpoint).unwrap())
        .map_err(|_| "无法保存 MCP 会话")?;
    drop(file);
    // Windows rename does not replace existing files. The single-instance lock is held by the GUI.
    if path.exists() {
        fs::remove_file(&path).map_err(|_| "无法更新 MCP 会话")?;
    }
    fs::rename(&temp, &path).map_err(|_| "无法保存 MCP 会话")?;
    let active = Arc::new(AtomicUsize::new(0));
    std::thread::spawn(move || {
        for mut request in server.incoming_requests() {
            if request.headers().iter().any(|h| h.field.equiv("Origin"))
                || !request.headers().iter().any(|h| {
                    h.field.equiv("Authorization") && h.value.as_str() == format!("Bearer {token}")
                })
            {
                let _ = request.respond(tiny_http::Response::empty(403));
                continue;
            }
            if request.url() != "/mcp" || request.method() != &tiny_http::Method::Post {
                let _ = request.respond(tiny_http::Response::empty(405));
                continue;
            }
            if request.body_length().is_some_and(|n| n > LIMIT as usize)
                || active.load(Ordering::Acquire) >= 32
            {
                let _ = request.respond(tiny_http::Response::empty(413));
                continue;
            }
            let mut body = Vec::new();
            if request
                .as_reader()
                .take(LIMIT + 1)
                .read_to_end(&mut body)
                .is_err()
                || body.len() as u64 > LIMIT
            {
                let _ = request.respond(tiny_http::Response::empty(413));
                continue;
            }
            let call = call.clone();
            let active = active.clone();
            active.fetch_add(1, Ordering::AcqRel);
            std::thread::spawn(move || {
                let response = match serde_json::from_slice(&body) {
                    Ok(value) => dispatch(value, call.as_ref()),
                    Err(_) => Some(error(Value::Null, -32700, "Parse error")),
                };
                let response = match response {
                    Some(value) => tiny_http::Response::from_string(value.to_string()).with_header(
                        tiny_http::Header::from_bytes("Content-Type", "application/json").unwrap(),
                    ),
                    None => tiny_http::Response::from_string("").with_status_code(202),
                };
                let _ = request.respond(response);
                active.fetch_sub(1, Ordering::AcqRel);
            });
        }
    });
    let exe = std::env::current_exe().map_err(|_| "无法定位 MCP 程序")?;
    Ok(Info {
        config: json!({"mcpServers":{"puretv":{"command":exe,"args":["--mcp",path]}}}),
        session_path: path,
    })
}

/// A separate stdio process attaches to the GUI; never creates another Manager.
pub fn relay(path: &Path) -> Result<(), String> {
    let mut data = Vec::new();
    fs::File::open(path)
        .map_err(|_| "请先打开 pureTV 管理器，再连接 MCP")?
        .take(8193)
        .read_to_end(&mut data)
        .map_err(|_| "无法读取 MCP 会话文件")?;
    if data.len() > 8192 {
        return Err("MCP 会话文件无效".into());
    }
    let endpoint: Endpoint = serde_json::from_slice(&data).map_err(|_| "MCP 会话文件无效")?;
    let url = reqwest::Url::parse(&endpoint.url).map_err(|_| "MCP 地址无效")?;
    if url.scheme() != "http"
        || url.host_str() != Some("127.0.0.1")
        || url.port().is_none()
        || url.path() != "/mcp"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || endpoint.token.len() != 64
        || !endpoint.token.bytes().all(|b| b.is_ascii_hexdigit())
    {
        return Err("MCP 会话地址无效".into());
    }
    let client = reqwest::blocking::Client::builder()
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(3))
        .timeout(Duration::from_secs(3600))
        .build()
        .map_err(|_| "无法创建 MCP 连接")?;
    let output = Arc::new(Mutex::new(std::io::stdout()));
    let mut workers = Vec::new();
    let mut input = std::io::stdin().lock();
    loop {
        let mut line = String::new();
        if input
            .by_ref()
            .take(LIMIT + 1)
            .read_line(&mut line)
            .map_err(|_| "无法读取 MCP 输入")?
            == 0
        {
            break;
        }
        if line.len() as u64 > LIMIT {
            return Err("MCP 消息超过大小限制".into());
        }
        let Ok(message) = serde_json::from_str::<Value>(&line) else {
            writeln!(
                output.lock().unwrap(),
                "{}",
                error(Value::Null, -32700, "Parse error")
            )
            .map_err(|_| "无法写入 MCP 输出")?;
            continue;
        };
        workers.retain(|worker: &std::thread::JoinHandle<()>| !worker.is_finished());
        if workers.len() >= 32 {
            return Err("MCP 并发请求过多".into());
        }
        let client = client.clone();
        let url = url.clone();
        let token = endpoint.token.clone();
        let output = output.clone();
        workers.push(std::thread::spawn(move || {
            let id = message.get("id").cloned();
            let result = (|| -> Result<Option<Value>, String> {
                let response = client
                    .post(url)
                    .bearer_auth(token)
                    .header("Content-Type", "application/json")
                    .body(message.to_string())
                    .send()
                    .map_err(|_| "管理器已关闭或 MCP 会话已过期，请重新连接")?;
                if response.status() == reqwest::StatusCode::ACCEPTED {
                    return Ok(None);
                }
                if !response.status().is_success() {
                    return Err("MCP 会话失效，请重新连接已打开的管理器".into());
                }
                let bytes = response.bytes().map_err(|_| "无法读取管理器响应")?;
                serde_json::from_slice(&bytes)
                    .map(Some)
                    .map_err(|_| "管理器 MCP 响应无效".into())
            })();
            let value = match result {
                Ok(v) => v,
                Err(e) => id.map(|id| error(id, -32603, &e)),
            };
            if let Some(value) = value {
                let mut out = output.lock().unwrap();
                let _ = writeln!(out, "{value}");
                let _ = out.flush();
            }
        }));
    }
    for worker in workers {
        let _ = worker.join();
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn protocol_validates_and_covers_all_actions() {
        let call = |name: &str, args: Value| Ok(json!({"tool":name,"arguments":args}));
        let response=dispatch(json!({"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}),&call).unwrap();
        assert_eq!(response["result"]["protocolVersion"], "2025-03-26");
        assert_eq!(tools().len(), 31);
        for tool in tools() {
            let mut args = json!({});
            for key in tool["inputSchema"]["required"].as_array().unwrap() {
                let key = key.as_str().unwrap();
                let rule = &tool["inputSchema"]["properties"][key];
                args[key] = match rule["type"].as_str().unwrap() {
                    "string" => {
                        if key == "resource" {
                            json!("releases")
                        } else {
                            json!("test")
                        }
                    }
                    "integer" => json!(5555),
                    "boolean" => json!(true),
                    "array" => json!(["test"]),
                    _ => unreachable!(),
                };
            }
            let r=dispatch(json!({"jsonrpc":"2.0","id":"call","method":"tools/call","params":{"name":tool["name"],"arguments":args}}),&call).unwrap();
            assert_eq!(r["result"]["isError"], false, "{}", tool["name"]);
            if [
                "get_state",
                "set_adb_path",
                "connect",
                "pair",
                "disconnect",
                "scan",
                "set_enabled",
                "uninstall",
                "restore",
                "install",
                "set_home",
                "restore_home",
                "clear_history",
            ]
            .contains(&tool["name"].as_str().unwrap())
            {
                assert!(core_request(
                    tool["name"].as_str().unwrap(),
                    r["result"]["structuredContent"]["result"]["arguments"].clone()
                )
                .is_ok());
            }
        }
        for args in [
            json!({"host":"tv","port":0}),
            json!({"host":"tv","port":65536}),
            json!({"host":"tv","port":5555,"shell":"evil"}),
        ] {
            let r=dispatch(json!({"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"connect","arguments":args}}),&call).unwrap();
            assert_eq!(r["error"]["code"], -32602);
        }
        assert!(dispatch(
            json!({"jsonrpc":"2.0","method":"notifications/initialized"}),
            &call
        )
        .is_none());
        let r = dispatch(
            json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"scan"}}),
            &|_, _| Err("电视未授权".into()),
        )
        .unwrap();
        assert_eq!(r["result"]["isError"], true);
    }
    #[test]
    fn transport_authentication_origin_and_parallel_cancel() {
        let directory = std::env::temp_dir().join(format!(
            "puretv-mcp-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let cancelled = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let flag = cancelled.clone();
        let info = start(
            &directory,
            Arc::new(move |name, _| {
                if name == "cancel" {
                    flag.store(true, Ordering::Release);
                    return Ok(json!({"requested":true}));
                }
                if name == "scan" {
                    for _ in 0..100 {
                        if flag.load(Ordering::Acquire) {
                            return Err("cancelled".into());
                        }
                        std::thread::sleep(Duration::from_millis(10));
                    }
                }
                Ok(json!({"tool":name}))
            }),
        )
        .unwrap();
        let endpoint: Endpoint =
            serde_json::from_slice(&fs::read(&info.session_path).unwrap()).unwrap();
        let client = reqwest::blocking::Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap();
        let initialize = json!({"jsonrpc":"2.0","id":1,"method":"initialize"});
        assert_eq!(
            client
                .post(&endpoint.url)
                .body(initialize.to_string())
                .send()
                .unwrap()
                .status()
                .as_u16(),
            403
        );
        assert_eq!(
            client
                .post(&endpoint.url)
                .bearer_auth(&endpoint.token)
                .header("Origin", "http://untrusted.test")
                .body(initialize.to_string())
                .send()
                .unwrap()
                .status()
                .as_u16(),
            403
        );
        let response = client
            .post(&endpoint.url)
            .bearer_auth(&endpoint.token)
            .body(initialize.to_string())
            .send()
            .unwrap();
        let value: Value = serde_json::from_slice(&response.bytes().unwrap()).unwrap();
        assert_eq!(value["result"]["serverInfo"]["name"], "pureTV Manager");
        let url = endpoint.url.clone();
        let token = endpoint.token.clone();
        let other = client.clone();
        let worker = std::thread::spawn(move || {
            other
                .post(url)
                .bearer_auth(token)
                .body(
                    json!({"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"scan"}})
                        .to_string(),
                )
                .send()
                .unwrap()
                .bytes()
                .unwrap()
        });
        let result = client
            .post(&endpoint.url)
            .bearer_auth(&endpoint.token)
            .body(
                json!({"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"cancel"}})
                    .to_string(),
            )
            .send()
            .unwrap();
        assert!(result.status().is_success());
        let value: Value = serde_json::from_slice(&worker.join().unwrap()).unwrap();
        assert_eq!(value["result"]["isError"], true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                fs::metadata(&info.session_path)
                    .unwrap()
                    .permissions()
                    .mode()
                    & 0o777,
                0o600
            );
        }
        fs::remove_dir_all(directory).unwrap();
    }
    #[test]
    fn layout_tools_accept_json_and_removed_features_are_unavailable() {
        let layout = serde_json::json!({"version":2,"home":{"columns":4,"items":[]},"apps":{"columns":3,"items":[]}});
        assert!(launcher_request(
            "apply_launcher_layout",
            json!({"layoutJson":layout.to_string()})
        )
        .unwrap()
        .is_some());
        assert!(
            launcher_request("apply_launcher_layout", json!({"layoutJson":"invalid"})).is_err()
        );
        for name in ["capture_launcher_preview", "start_live_view", "pair"] {
            assert!(tools().iter().all(|tool| tool["name"] != name));
        }
    }
}
