//! Read-only posts from the public store's Gitee Issues. Forum reads have their
//! own bounded cache and never reserve the ADB operation lock.
use reqwest::{blocking::Client, header, redirect, StatusCode, Url};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashSet, VecDeque},
    io::Read,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const SOURCE_URL: &str = "https://gitee.com/juzisang331/pure-tv-store/issues";
const API: &str = "https://gitee.com/api/v5/repos/juzisang331/pure-tv-store/issues";
const PER_PAGE: usize = 20;
const MAX_PAGE: u32 = 1000;
const MAX_BODY: u64 = 4 * 1024 * 1024;
const CACHE_TTL: Duration = Duration::from_secs(60);
const MAX_CACHED_PAGES: usize = 10;
const INVALID_DATA: &str = "论坛返回的帖子数据无效，请稍后重试";
const NETWORK_ERROR: &str = "无法连接论坛，请检查网络或系统代理后重试";
const STALE_WARNING: &str = "论坛暂时无法刷新，当前显示的是此前读取的帖子。";

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Post {
    pub number: String,
    pub title: String,
    pub author: String,
    pub state: String,
    pub comments: u32,
    pub updated_at: String,
    pub labels: Vec<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    pub posts: Vec<Post>,
    pub page: u32,
    pub has_more: bool,
    pub fetched_at: u64,
    pub source_url: &'static str,
    pub stale: bool,
    pub warning: Option<String>,
}

struct Cached {
    ticket: u64,
    received: Instant,
    page: Page,
}

#[derive(Default)]
pub struct State {
    next_request: AtomicU64,
    pages: Mutex<VecDeque<Cached>>,
}

fn check_open(closing: &AtomicBool) -> Result<(), String> {
    if closing.load(Ordering::Acquire) {
        Err("管理器正在退出".into())
    } else {
        Ok(())
    }
}

impl State {
    pub fn list(&self, page: u32, refresh: bool, closing: &AtomicBool) -> Result<Page, String> {
        self.list_with(page, refresh, closing, || {
            let client = Client::builder()
                .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
                .connect_timeout(Duration::from_secs(8))
                .timeout(Duration::from_secs(25))
                .https_only(true)
                .redirect(redirect::Policy::none())
                .build()
                .map_err(|_| NETWORK_ERROR.to_string())?;
            fetch(&client, API, page, closing)
        })
    }

    fn list_with(
        &self,
        page: u32,
        refresh: bool,
        closing: &AtomicBool,
        fetch_page: impl FnOnce() -> Result<Page, String>,
    ) -> Result<Page, String> {
        check_open(closing)?;
        if !(1..=MAX_PAGE).contains(&page) {
            return Err("论坛页码无效".into());
        }
        if !refresh {
            let pages = self.pages.lock().map_err(|_| "论坛状态不可用")?;
            if let Some(cached) = pages.iter().find(|entry| entry.page.page == page) {
                if cached.received.elapsed() < CACHE_TTL {
                    return Ok(cached.page.clone());
                }
            }
        }
        // Network requests never hold the cache lock. A slow page does not
        // block another cached page or any device operation.
        let ticket = self.next_request.fetch_add(1, Ordering::Relaxed);
        let result = fetch_page();
        check_open(closing)?;
        let mut pages = self.pages.lock().map_err(|_| "论坛状态不可用")?;
        // Leaving and returning to the page can start another request while
        // the first one is still pending. A late success or failure must not
        // replace or mark stale a newer successful response for that page.
        if let Some(cached) = pages
            .iter()
            .find(|entry| entry.page.page == page && entry.ticket > ticket)
        {
            return Ok(cached.page.clone());
        }
        match result {
            Ok(value) => {
                pages.retain(|entry| entry.page.page != page);
                pages.push_front(Cached {
                    ticket,
                    received: Instant::now(),
                    page: value.clone(),
                });
                pages.truncate(MAX_CACHED_PAGES);
                Ok(value)
            }
            Err(error) => {
                if let Some(cached) = pages.iter_mut().find(|entry| entry.page.page == page) {
                    cached.page.stale = true;
                    cached.page.warning = Some(STALE_WARNING.into());
                    Ok(cached.page.clone())
                } else {
                    Err(error)
                }
            }
        }
    }
}

pub fn post_url(number: &str) -> Result<String, String> {
    if number.is_empty() || number.len() > 32 || !number.bytes().all(|c| c.is_ascii_alphanumeric())
    {
        return Err("无效的论坛帖子编号".into());
    }
    Ok(format!("{SOURCE_URL}/{number}"))
}

#[derive(Deserialize)]
struct ApiUser {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    login: Option<String>,
}

#[derive(Deserialize)]
struct ApiLabel {
    name: String,
}

#[derive(Deserialize)]
struct ApiIssue {
    number: String,
    title: String,
    state: String,
    #[serde(default)]
    user: Option<ApiUser>,
    #[serde(default)]
    comments: u32,
    #[serde(default)]
    updated_at: Option<String>,
    #[serde(default)]
    created_at: Option<String>,
    #[serde(default)]
    labels: Vec<ApiLabel>,
}

fn bounded_text(value: &str, max: usize) -> String {
    value.trim().chars().take(max).collect()
}

fn parse_posts(bytes: &[u8]) -> Result<Vec<Post>, String> {
    let issues: Vec<ApiIssue> = serde_json::from_slice(bytes).map_err(|_| INVALID_DATA)?;
    if issues.len() > PER_PAGE {
        return Err(INVALID_DATA.into());
    }
    let mut seen = HashSet::new();
    issues
        .into_iter()
        .map(|issue| {
            if post_url(&issue.number).is_err()
                || !seen.insert(issue.number.clone())
                || issue.title.trim().is_empty()
            {
                return Err(INVALID_DATA.into());
            }
            let author = issue
                .user
                .and_then(|user| {
                    user.name
                        .filter(|name| !name.trim().is_empty())
                        .or(user.login)
                })
                .unwrap_or_default();
            Ok(Post {
                number: issue.number,
                title: bounded_text(&issue.title, 500),
                author: bounded_text(&author, 128),
                state: match issue.state.as_str() {
                    "open" | "progressing" | "closed" | "rejected" => issue.state,
                    _ => "unknown".into(),
                },
                comments: issue.comments,
                updated_at: bounded_text(
                    &issue.updated_at.or(issue.created_at).unwrap_or_default(),
                    64,
                ),
                labels: issue
                    .labels
                    .into_iter()
                    .take(32)
                    .map(|label| bounded_text(&label.name, 80))
                    .filter(|name| !name.is_empty())
                    .collect(),
            })
        })
        .collect()
}

fn fetch(client: &Client, endpoint: &str, page: u32, closing: &AtomicBool) -> Result<Page, String> {
    check_open(closing)?;
    let mut url = Url::parse(endpoint).map_err(|_| INVALID_DATA)?;
    url.query_pairs_mut()
        .append_pair("state", "all")
        .append_pair("sort", "updated")
        .append_pair("direction", "desc")
        .append_pair("page", &page.to_string())
        .append_pair("per_page", &PER_PAGE.to_string());
    let response = client
        .get(url)
        .header(header::ACCEPT, "application/json")
        .header(header::ACCEPT_ENCODING, "identity")
        .send()
        .map_err(|error| {
            if error.is_timeout() {
                "论坛读取超时，请稍后重试"
            } else {
                NETWORK_ERROR
            }
        })?;
    check_open(closing)?;
    if response.status() == StatusCode::TOO_MANY_REQUESTS {
        return Err("论坛访问频率过高，请稍后重试".into());
    }
    if response.status() != StatusCode::OK {
        return Err(format!(
            "论坛暂时无法访问（HTTP {}），请稍后重试",
            response.status().as_u16()
        ));
    }
    if response
        .content_length()
        .is_some_and(|length| length > MAX_BODY)
    {
        return Err("论坛返回的内容过大，请稍后重试".into());
    }
    let total_pages = response
        .headers()
        .get("total_page")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse::<u32>().ok());
    let mut bytes = Vec::new();
    response
        .take(MAX_BODY + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| NETWORK_ERROR)?;
    check_open(closing)?;
    if bytes.len() as u64 > MAX_BODY {
        return Err("论坛返回的内容过大，请稍后重试".into());
    }
    let posts = parse_posts(&bytes)?;
    // Gitee reports total_page, including when the final page has exactly 20
    // posts. If a proxy strips that optional header, a full page can be followed
    // once more; a successful empty response then ends pagination normally.
    let has_more = !posts.is_empty()
        && page < MAX_PAGE
        && total_pages
            .filter(|total| *total >= page)
            .map_or(posts.len() == PER_PAGE, |total| page < total);
    Ok(Page {
        posts,
        page,
        has_more,
        fetched_at: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64,
        source_url: SOURCE_URL,
        stale: false,
        warning: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::{
        io::{BufRead, BufReader, Write},
        net::TcpListener,
        thread,
    };

    fn issue(number: &str) -> serde_json::Value {
        json!({"number":number,"title":"大家可以在这里提交反馈哦","state":"open","user":{"name":"桔子桑","login":"juzisang331"},"comments":3,"updated_at":"2026-11-01T13:42:23+08:00","labels":[{"name":"讨论"}],"html_url":"https://untrusted.invalid/ignored"})
    }

    fn http_page(status: u16, headers: &[(&str, &str)], body: &str) -> Result<Page, String> {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let endpoint = format!("http://{}/issues", listener.local_addr().unwrap());
        let length = if headers
            .iter()
            .any(|(key, _)| key.eq_ignore_ascii_case("Content-Length"))
        {
            String::new()
        } else {
            format!("Content-Length: {}\r\n", body.len())
        };
        let headers = headers
            .iter()
            .map(|(key, value)| format!("{key}: {value}\r\n"))
            .collect::<String>();
        let response =
            format!("HTTP/1.1 {status} Test\r\n{headers}{length}Connection: close\r\n\r\n{body}");
        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            let mut reader = BufReader::new(&stream);
            let mut line = String::new();
            reader.read_line(&mut line).unwrap();
            for parameter in [
                "state=all",
                "sort=updated",
                "direction=desc",
                "page=1",
                "per_page=20",
            ] {
                assert!(line.contains(parameter), "{line}");
            }
            loop {
                line.clear();
                if reader.read_line(&mut line).unwrap() == 0 || line == "\r\n" {
                    break;
                }
            }
            let _ = stream.write_all(response.as_bytes());
        });
        let client = Client::builder()
            .no_proxy()
            .redirect(redirect::Policy::none())
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap();
        let result = fetch(&client, &endpoint, 1, &AtomicBool::new(false));
        server.join().unwrap();
        result
    }

    #[test]
    fn response_uses_public_fields_and_never_remote_links() {
        let page = http_page(
            200,
            &[("total_page", "1")],
            &json!([issue("IKS14W")]).to_string(),
        )
        .unwrap();
        assert_eq!(page.posts[0].author, "桔子桑");
        assert_eq!(page.posts[0].comments, 3);
        assert_eq!(page.posts[0].labels, ["讨论"]);
        assert_eq!(page.source_url, SOURCE_URL);
        assert!(!page.has_more && !page.stale);
        assert_eq!(
            post_url(&page.posts[0].number).unwrap(),
            format!("{SOURCE_URL}/IKS14W")
        );
        assert!(!serde_json::to_string(&page)
            .unwrap()
            .contains("untrusted.invalid"));
    }

    #[test]
    fn final_full_page_and_empty_page_stop_pagination() {
        let full = (0..PER_PAGE)
            .map(|index| issue(&format!("I{index}")))
            .collect::<Vec<_>>();
        let body = serde_json::to_string(&full).unwrap();
        assert!(
            !http_page(200, &[("total_page", "1")], &body)
                .unwrap()
                .has_more
        );
        assert!(
            http_page(200, &[("total_page", "2")], &body)
                .unwrap()
                .has_more
        );
        assert!(http_page(200, &[], &body).unwrap().has_more);
        assert!(!http_page(200, &[], "[]").unwrap().has_more);
    }

    #[test]
    fn denied_throttled_and_malformed_responses_are_not_empty_successes() {
        assert!(http_page(403, &[], "[]").unwrap_err().contains("HTTP 403"));
        assert!(http_page(429, &[], "[]").unwrap_err().contains("频率过高"));
        assert!(http_page(200, &[], "{\"message\":\"not an issue list\"}").is_err());
        assert!(http_page(200, &[], "<html>sign in</html>").is_err());
        assert!(
            http_page(302, &[("Location", "https://untrusted.invalid/")], "")
                .unwrap_err()
                .contains("HTTP 302")
        );
        assert!(http_page(200, &[("Content-Length", "4194305")], "")
            .unwrap_err()
            .contains("内容过大"));
    }

    #[test]
    fn missing_authors_are_supported_but_invalid_identity_is_rejected() {
        let mut post = issue("I1");
        post["user"] = json!(null);
        post["state"] = json!("custom");
        let posts = parse_posts(&json!([post]).to_string().into_bytes()).unwrap();
        assert_eq!(posts[0].author, "");
        assert_eq!(posts[0].state, "unknown");
        for number in [
            "",
            "../x",
            "%2f",
            "I1?token=x",
            "https://example.com",
            "中",
            "I1\n",
        ] {
            assert!(post_url(number).is_err(), "{number:?}");
        }
        assert!(parse_posts(&json!([issue("../x")]).to_string().into_bytes()).is_err());
        assert!(parse_posts(&json!([issue("I1"), issue("I1")]).to_string().into_bytes()).is_err());
    }

    #[test]
    fn stale_cache_is_page_specific_bounded_and_does_not_hide_shutdown() {
        let state = State::default();
        let closing = AtomicBool::new(false);
        let original = http_page(200, &[], &json!([issue("I1")]).to_string()).unwrap();
        state
            .list_with(1, true, &closing, || Ok(original.clone()))
            .unwrap();
        state
            .list_with(1, false, &closing, || {
                panic!("fresh cache should be reused")
            })
            .unwrap();
        let cached = state
            .list_with(1, true, &closing, || Err("unavailable".into()))
            .unwrap();
        assert!(cached.stale && cached.warning.is_some());
        assert_eq!(cached.fetched_at, original.fetched_at);
        assert!(state
            .list_with(2, true, &closing, || Err("unavailable".into()))
            .is_err());
        assert!(state
            .list_with(0, true, &closing, || panic!("invalid page"))
            .is_err());
        assert!(state
            .list_with(MAX_PAGE + 1, true, &closing, || panic!("invalid page"))
            .is_err());
        closing.store(true, Ordering::Release);
        assert_eq!(
            state
                .list_with(1, false, &closing, || panic!("shutting down"))
                .unwrap_err(),
            "管理器正在退出"
        );
        closing.store(false, Ordering::Release);
        for page in 2..=12 {
            let mut value = original.clone();
            value.page = page;
            state.list_with(page, true, &closing, || Ok(value)).unwrap();
        }
        assert_eq!(state.pages.lock().unwrap().len(), MAX_CACHED_PAGES);
        assert!(state
            .list_with(1, true, &closing, || Err("evicted".into()))
            .is_err());
    }

    #[test]
    fn late_success_or_failure_cannot_replace_a_newer_successful_page() {
        use std::sync::{mpsc, Arc};
        for old_fails in [false, true] {
            let state = Arc::new(State::default());
            let original = http_page(200, &[], &json!([issue("I1")]).to_string()).unwrap();
            let mut newer = original.clone();
            newer.posts[0].title = "Newer response".into();
            newer.fetched_at = original.fetched_at + 1;
            let old_state = state.clone();
            let (started_sender, started_receiver) = mpsc::channel();
            let (release_sender, release_receiver) = mpsc::channel();
            let old = thread::spawn(move || {
                old_state.list_with(1, true, &AtomicBool::new(false), || {
                    started_sender.send(()).unwrap();
                    release_receiver
                        .recv_timeout(Duration::from_secs(5))
                        .unwrap();
                    if old_fails {
                        Err("Older request failed".into())
                    } else {
                        Ok(original)
                    }
                })
            });
            started_receiver
                .recv_timeout(Duration::from_secs(5))
                .unwrap();
            let latest = state
                .list_with(1, true, &AtomicBool::new(false), || Ok(newer))
                .unwrap();
            release_sender.send(()).unwrap();
            let late_result = old.join().unwrap().unwrap();
            let cached = state
                .list_with(1, false, &AtomicBool::new(false), || {
                    panic!("new response should remain cached")
                })
                .unwrap();
            for page in [late_result, cached] {
                assert_eq!(page.posts[0].title, "Newer response");
                assert_eq!(page.fetched_at, latest.fetched_at);
                assert!(!page.stale);
                assert!(page.warning.is_none());
            }
        }
    }

    #[test]
    #[ignore = "reads the live public Gitee API; run explicitly"]
    fn live_public_gitee_issues() {
        let page = State::default()
            .list(1, true, &AtomicBool::new(false))
            .unwrap();
        assert_eq!(page.page, 1);
        assert_eq!(page.source_url, SOURCE_URL);
        assert!(!page.stale);
        println!("{}", serde_json::to_string_pretty(&page).unwrap());
    }
}
