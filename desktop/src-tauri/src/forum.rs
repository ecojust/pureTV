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
pub const NEW_POST_URL: &str = "https://gitee.com/juzisang331/pure-tv-store/issues/new";
const API: &str = "https://gitee.com/api/v5/repos/juzisang331/pure-tv-store/issues";
const PER_PAGE: usize = 20;
const MAX_PAGE: u32 = 1000;
const MAX_BODY: u64 = 4 * 1024 * 1024;
const MAX_TEXT_BYTES: usize = 256 * 1024;
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

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PostBody {
    #[serde(flatten)]
    pub post: Post,
    pub body: String,
    pub created_at: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Detail {
    pub post: PostBody,
    pub fetched_at: u64,
    pub stale: bool,
    pub warning: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Reply {
    // Keep API integer IDs exact when they cross the JavaScript boundary.
    pub id: String,
    pub body: String,
    pub author: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepliesPage {
    pub number: String,
    pub replies: Vec<Reply>,
    pub page: u32,
    pub has_more: bool,
    pub fetched_at: u64,
    pub stale: bool,
    pub warning: Option<String>,
}

trait CacheResponse: Clone {
    fn mark_stale(&mut self);
}
impl CacheResponse for Page {
    fn mark_stale(&mut self) {
        self.stale = true;
        self.warning = Some(STALE_WARNING.into());
    }
}
impl CacheResponse for Detail {
    fn mark_stale(&mut self) {
        self.stale = true;
        self.warning = Some("帖子内容暂时无法刷新，当前显示的是此前读取的内容。".into());
    }
}
impl CacheResponse for RepliesPage {
    fn mark_stale(&mut self) {
        self.stale = true;
        self.warning = Some("回复暂时无法刷新，当前显示的是此前读取的回复。".into());
    }
}

struct Cached<T> {
    key: String,
    ticket: u64,
    received: Instant,
    value: T,
}
struct Cache<T> {
    next_request: AtomicU64,
    entries: Mutex<VecDeque<Cached<T>>>,
}
impl<T> Default for Cache<T> {
    fn default() -> Self {
        Self {
            next_request: AtomicU64::new(0),
            entries: Mutex::new(VecDeque::new()),
        }
    }
}

#[derive(Default)]
pub struct State {
    pages: Cache<Page>,
    details: Cache<Detail>,
    replies: Cache<RepliesPage>,
}

fn check_open(closing: &AtomicBool) -> Result<(), String> {
    if closing.load(Ordering::Acquire) {
        Err("管理器正在退出".into())
    } else {
        Ok(())
    }
}
fn check_page(page: u32) -> Result<(), String> {
    if !(1..=MAX_PAGE).contains(&page) {
        Err("论坛页码无效".into())
    } else {
        Ok(())
    }
}
fn client() -> Result<Client, String> {
    Client::builder()
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(Duration::from_secs(8))
        .timeout(Duration::from_secs(25))
        .https_only(true)
        .redirect(redirect::Policy::none())
        .build()
        .map_err(|_| NETWORK_ERROR.to_string())
}
impl State {
    pub fn list(&self, page: u32, refresh: bool, closing: &AtomicBool) -> Result<Page, String> {
        self.list_with(page, refresh, closing, || {
            fetch(&client()?, API, page, closing)
        })
    }
    fn list_with(
        &self,
        page: u32,
        refresh: bool,
        closing: &AtomicBool,
        fetch_page: impl FnOnce() -> Result<Page, String>,
    ) -> Result<Page, String> {
        check_page(page)?;
        self.pages
            .read(&page.to_string(), refresh, closing, fetch_page)
    }
    pub fn detail(
        &self,
        number: &str,
        refresh: bool,
        closing: &AtomicBool,
    ) -> Result<Detail, String> {
        self.detail_with(number, refresh, closing, || {
            fetch_detail(&client()?, API, number, closing)
        })
    }
    fn detail_with(
        &self,
        number: &str,
        refresh: bool,
        closing: &AtomicBool,
        fetch_detail: impl FnOnce() -> Result<Detail, String>,
    ) -> Result<Detail, String> {
        post_url(number)?;
        self.details.read(number, refresh, closing, fetch_detail)
    }
    pub fn replies(
        &self,
        number: &str,
        page: u32,
        refresh: bool,
        closing: &AtomicBool,
    ) -> Result<RepliesPage, String> {
        self.replies_with(number, page, refresh, closing, || {
            fetch_replies(&client()?, API, number, page, closing)
        })
    }
    fn replies_with(
        &self,
        number: &str,
        page: u32,
        refresh: bool,
        closing: &AtomicBool,
        fetch_replies: impl FnOnce() -> Result<RepliesPage, String>,
    ) -> Result<RepliesPage, String> {
        post_url(number)?;
        check_page(page)?;
        self.replies
            .read(&format!("{number}:{page}"), refresh, closing, fetch_replies)
    }
}

impl<T: CacheResponse> Cache<T> {
    fn read(
        &self,
        key: &str,
        refresh: bool,
        closing: &AtomicBool,
        fetch_value: impl FnOnce() -> Result<T, String>,
    ) -> Result<T, String> {
        check_open(closing)?;
        if !refresh {
            let entries = self.entries.lock().map_err(|_| "论坛状态不可用")?;
            if let Some(cached) = entries.iter().find(|entry| entry.key == key) {
                if cached.received.elapsed() < CACHE_TTL {
                    return Ok(cached.value.clone());
                }
            }
        }
        // Independent keys can load concurrently without blocking the cache or
        // any ADB operation. Only the latest successful request for this exact
        // key may replace it; a late error cannot spoil that newer response.
        let ticket = self.next_request.fetch_add(1, Ordering::Relaxed);
        let result = fetch_value();
        check_open(closing)?;
        let mut entries = self.entries.lock().map_err(|_| "论坛状态不可用")?;
        if let Some(cached) = entries
            .iter()
            .find(|entry| entry.key == key && entry.ticket > ticket)
        {
            return Ok(cached.value.clone());
        }
        match result {
            Ok(value) => {
                entries.retain(|entry| entry.key != key);
                entries.push_front(Cached {
                    key: key.into(),
                    ticket,
                    received: Instant::now(),
                    value: value.clone(),
                });
                entries.truncate(MAX_CACHED_PAGES);
                Ok(value)
            }
            Err(error) => {
                if let Some(cached) = entries.iter_mut().find(|entry| entry.key == key) {
                    cached.value.mark_stale();
                    Ok(cached.value.clone())
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
    #[serde(default)]
    body: Option<String>,
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

fn author_name(user: Option<ApiUser>) -> String {
    bounded_text(
        &user
            .and_then(|user| {
                user.name
                    .filter(|name| !name.trim().is_empty())
                    .or(user.login)
            })
            .unwrap_or_default(),
        128,
    )
}
fn normalize_post(issue: ApiIssue) -> Result<Post, String> {
    if post_url(&issue.number).is_err() || issue.title.trim().is_empty() {
        return Err(INVALID_DATA.into());
    }
    Ok(Post {
        number: issue.number,
        title: bounded_text(&issue.title, 500),
        author: author_name(issue.user),
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
            if !seen.insert(issue.number.clone()) {
                return Err(INVALID_DATA.into());
            }
            normalize_post(issue)
        })
        .collect()
}
fn readable_body(value: Option<String>) -> Result<String, String> {
    let value = value.unwrap_or_default();
    // Preserve the full source text, including whitespace and Markdown. This
    // module never interprets HTML; the UI renders it as text. Oversized bodies
    // fail visibly rather than displaying a silently truncated conversation.
    if value.len() > MAX_TEXT_BYTES {
        Err("帖子或回复内容过长，暂时无法显示".into())
    } else {
        Ok(value)
    }
}
fn parse_detail(bytes: &[u8], number: &str) -> Result<PostBody, String> {
    let invalid = "论坛返回的帖子详情无效，请稍后重试";
    let mut issue: ApiIssue = serde_json::from_slice(bytes).map_err(|_| invalid)?;
    if issue.number != number {
        return Err(invalid.into());
    }
    let body = readable_body(issue.body.take())?;
    let created_at = bounded_text(issue.created_at.as_deref().unwrap_or_default(), 64);
    let post = normalize_post(issue).map_err(|_| invalid)?;
    Ok(PostBody {
        post,
        body,
        created_at,
    })
}

#[derive(Deserialize)]
struct ApiReplyIssue {
    number: String,
}
#[derive(Deserialize)]
struct ApiReplyTarget {
    #[serde(default)]
    issue: Option<ApiReplyIssue>,
}
#[derive(Deserialize)]
struct ApiReply {
    id: u64,
    #[serde(default)]
    body: Option<String>,
    #[serde(default)]
    user: Option<ApiUser>,
    #[serde(default)]
    created_at: Option<String>,
    #[serde(default)]
    updated_at: Option<String>,
    #[serde(default)]
    target: Option<ApiReplyTarget>,
}
fn parse_replies(bytes: &[u8], number: &str) -> Result<Vec<Reply>, String> {
    let invalid = "论坛返回的回复数据无效，请稍后重试";
    let mut replies: Vec<ApiReply> = serde_json::from_slice(bytes).map_err(|_| invalid)?;
    if replies.len() > PER_PAGE {
        return Err(invalid.into());
    }
    replies.sort_by_key(|reply| reply.id);
    let mut seen = HashSet::new();
    replies
        .into_iter()
        .map(|reply| {
            if reply.id == 0
                || !seen.insert(reply.id)
                || reply
                    .target
                    .and_then(|target| target.issue)
                    .is_some_and(|issue| issue.number != number)
            {
                return Err(invalid.into());
            }
            Ok(Reply {
                id: reply.id.to_string(),
                body: readable_body(reply.body)?,
                author: author_name(reply.user),
                created_at: bounded_text(reply.created_at.as_deref().unwrap_or_default(), 64),
                updated_at: bounded_text(
                    &reply.updated_at.or(reply.created_at).unwrap_or_default(),
                    64,
                ),
            })
        })
        .collect()
}

fn fetch_bytes(
    client: &Client,
    url: Url,
    closing: &AtomicBool,
) -> Result<(Vec<u8>, Option<u32>), String> {
    check_open(closing)?;
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
    Ok((bytes, total_pages))
}
fn fetched_at() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
fn has_more(page: u32, count: usize, total_pages: Option<u32>) -> bool {
    count > 0
        && page < MAX_PAGE
        && total_pages
            .filter(|total| *total >= page)
            .map_or(count == PER_PAGE, |total| page < total)
}
fn issue_url(endpoint: &str, number: &str, comments: bool) -> Result<Url, String> {
    post_url(number)?;
    Url::parse(&format!(
        "{endpoint}/{number}{}",
        if comments { "/comments" } else { "" }
    ))
    .map_err(|_| INVALID_DATA.into())
}
fn fetch_detail(
    client: &Client,
    endpoint: &str,
    number: &str,
    closing: &AtomicBool,
) -> Result<Detail, String> {
    let (bytes, _) = fetch_bytes(client, issue_url(endpoint, number, false)?, closing)?;
    Ok(Detail {
        post: parse_detail(&bytes, number)?,
        fetched_at: fetched_at(),
        stale: false,
        warning: None,
    })
}
fn fetch_replies(
    client: &Client,
    endpoint: &str,
    number: &str,
    page: u32,
    closing: &AtomicBool,
) -> Result<RepliesPage, String> {
    check_page(page)?;
    let mut url = issue_url(endpoint, number, true)?;
    url.query_pairs_mut()
        .append_pair("page", &page.to_string())
        .append_pair("per_page", &PER_PAGE.to_string())
        .append_pair("order", "asc");
    let (bytes, total_pages) = fetch_bytes(client, url, closing)?;
    let replies = parse_replies(&bytes, number)?;
    Ok(RepliesPage {
        number: number.into(),
        has_more: has_more(page, replies.len(), total_pages),
        replies,
        page,
        fetched_at: fetched_at(),
        stale: false,
        warning: None,
    })
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
    let (bytes, total_pages) = fetch_bytes(client, url, closing)?;
    let posts = parse_posts(&bytes)?;
    // Gitee reports total_page, including when the final page has exactly 20
    // posts. If a proxy strips that optional header, a full page can be followed
    // once more; a successful empty response then ends pagination normally.
    let has_more = has_more(page, posts.len(), total_pages);
    Ok(Page {
        posts,
        page,
        has_more,
        fetched_at: fetched_at(),
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

    fn http_response<T>(
        status: u16,
        headers: &[(&str, &str)],
        body: &str,
        expected_path: &str,
        request: impl FnOnce(&Client, &str) -> Result<T, String>,
    ) -> Result<T, String> {
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
        let expected = format!("GET {expected_path} HTTP/1.1");
        let server = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            let mut reader = BufReader::new(&stream);
            let mut line = String::new();
            reader.read_line(&mut line).unwrap();
            assert_eq!(line.trim_end(), expected);
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
        let result = request(&client, &endpoint);
        server.join().unwrap();
        result
    }

    fn http_page(status: u16, headers: &[(&str, &str)], body: &str) -> Result<Page, String> {
        http_response(
            status,
            headers,
            body,
            "/issues?state=all&sort=updated&direction=desc&page=1&per_page=20",
            |client, endpoint| fetch(client, endpoint, 1, &AtomicBool::new(false)),
        )
    }

    fn http_detail(status: u16, body: &str) -> Result<Detail, String> {
        http_response(status, &[], body, "/issues/IKS14W", |client, endpoint| {
            fetch_detail(client, endpoint, "IKS14W", &AtomicBool::new(false))
        })
    }

    fn http_replies(
        status: u16,
        headers: &[(&str, &str)],
        body: &str,
        page: u32,
    ) -> Result<RepliesPage, String> {
        http_response(
            status,
            headers,
            body,
            &format!("/issues/IKS14W/comments?page={page}&per_page=20&order=asc"),
            |client, endpoint| {
                fetch_replies(client, endpoint, "IKS14W", page, &AtomicBool::new(false))
            },
        )
    }

    fn reply(id: u64) -> serde_json::Value {
        json!({"id":id,"body":"我来测试一下","user":{"name":"桔子桑","login":"juzisang331"},"created_at":"2026-11-01T14:24:13+08:00","updated_at":"2026-11-01T14:24:13+08:00","target":{"issue":{"number":"IKS14W"}}})
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
    fn detail_keeps_complete_body_and_rejects_a_different_post() {
        let mut value = issue("IKS14W");
        let body = "  正文\n\n<img src=x onerror=alert(1)>\n[链接](javascript:alert(1))\n  ";
        value["body"] = json!(body);
        value["created_at"] = json!("2026-11-01T13:42:23+08:00");
        let detail = http_detail(200, &value.to_string()).unwrap();
        assert_eq!(detail.post.body, body);
        let serialized = serde_json::to_value(&detail).unwrap();
        assert_eq!(serialized["post"]["number"], "IKS14W");
        assert_eq!(serialized["post"]["body"], body);
        assert_eq!(serialized["post"]["createdAt"], value["created_at"]);
        assert!(serialized["post"].get("post").is_none());
        assert!(!detail.stale && detail.warning.is_none());
        assert!(detail.fetched_at > 0);

        value["number"] = json!("OTHER");
        assert!(http_detail(200, &value.to_string())
            .unwrap_err()
            .contains("帖子详情无效"));
        value["number"] = json!("iks14w");
        assert!(http_detail(200, &value.to_string()).is_err());
        assert!(http_detail(404, "{\"message\":\"not found\"}")
            .unwrap_err()
            .contains("HTTP 404"));
        assert!(http_detail(200, "[]").is_err());
    }

    #[test]
    fn bodies_are_never_silently_truncated_and_missing_text_is_supported() {
        let mut value = issue("IKS14W");
        value["body"] = json!("x".repeat(MAX_TEXT_BYTES));
        assert_eq!(
            parse_detail(&serde_json::to_vec(&value).unwrap(), "IKS14W")
                .unwrap()
                .body
                .len(),
            MAX_TEXT_BYTES
        );
        // The limit is bytes, including for multilingual forum content.
        value["body"] = json!("龙".repeat(MAX_TEXT_BYTES / 3 + 1));
        assert!(parse_detail(&serde_json::to_vec(&value).unwrap(), "IKS14W")
            .unwrap_err()
            .contains("内容过长"));
        let mut comment = reply(1);
        comment["body"] = value["body"].clone();
        assert!(
            parse_replies(&serde_json::to_vec(&[comment]).unwrap(), "IKS14W")
                .unwrap_err()
                .contains("内容过长")
        );
        value["body"] = json!(null);
        value["user"] = json!(null);
        let post = parse_detail(&serde_json::to_vec(&value).unwrap(), "IKS14W").unwrap();
        assert_eq!(post.body, "");
        assert_eq!(post.post.author, "");
        let comments = parse_replies(br#"[{"id":1}]"#, "IKS14W").unwrap();
        assert_eq!(comments[0].body, "");
        assert_eq!(comments[0].author, "");
    }

    #[test]
    fn replies_preserve_exact_ids_text_and_conversation_order() {
        let mut last = reply(u64::MAX);
        let body = "  回复\n<script>alert('x')</script>\n ";
        last["body"] = json!(body);
        let page = http_replies(
            200,
            &[("total_page", "2")],
            &json!([last, reply(51952113)]).to_string(),
            1,
        )
        .unwrap();
        assert_eq!(page.number, "IKS14W");
        assert_eq!(page.replies[0].id, "51952113");
        assert_eq!(page.replies[1].id, "18446744073709551615");
        assert_eq!(page.replies[1].body, body);
        assert_eq!(page.replies[0].author, "桔子桑");
        assert!(page.has_more && !page.stale && page.warning.is_none());
        let serialized = serde_json::to_value(&page).unwrap();
        assert!(serialized["replies"][0]["id"].is_string());
        assert_eq!(
            serialized["replies"][0]["createdAt"],
            "2026-11-01T14:24:13+08:00"
        );

        let full = (1..=PER_PAGE as u64).map(reply).collect::<Vec<_>>();
        let body = serde_json::to_string(&full).unwrap();
        assert!(
            !http_replies(200, &[("total_page", "2")], &body, 2)
                .unwrap()
                .has_more
        );
        assert!(http_replies(200, &[], &body, 1).unwrap().has_more);
        assert!(!http_replies(200, &[], "[]", 2).unwrap().has_more);
        assert!(http_replies(403, &[], "[]", 1)
            .unwrap_err()
            .contains("HTTP 403"));
    }

    #[test]
    fn replies_reject_wrong_post_duplicate_ids_and_invalid_payloads() {
        let mut wrong_post = reply(1);
        wrong_post["target"]["issue"]["number"] = json!("OTHER");
        let mut different_case = reply(1);
        different_case["target"]["issue"]["number"] = json!("iks14w");
        for invalid in [
            json!([wrong_post]),
            json!([different_case]),
            json!([reply(1), reply(1)]),
            json!([reply(0)]),
            json!({"message":"not comments"}),
            json!([{"id":"51952113"}]),
        ] {
            assert!(
                parse_replies(&serde_json::to_vec(&invalid).unwrap(), "IKS14W")
                    .unwrap_err()
                    .contains("回复数据无效")
            );
        }
        let oversized = (1..=PER_PAGE as u64 + 1).map(reply).collect::<Vec<_>>();
        assert!(parse_replies(&serde_json::to_vec(&oversized).unwrap(), "IKS14W").is_err());
    }

    #[test]
    fn detail_and_reply_caches_never_leak_between_posts_or_pages() {
        let state = State::default();
        let closing = AtomicBool::new(false);
        let detail = http_detail(200, &issue("IKS14W").to_string()).unwrap();
        let replies = http_replies(200, &[], &json!([reply(1)]).to_string(), 1).unwrap();
        state
            .detail_with("IKS14W", true, &closing, || Ok(detail.clone()))
            .unwrap();
        state
            .replies_with("IKS14W", 1, true, &closing, || Ok(replies.clone()))
            .unwrap();
        let cached_detail = state
            .detail_with("IKS14W", true, &closing, || Err("offline".into()))
            .unwrap();
        let cached_replies = state
            .replies_with("IKS14W", 1, true, &closing, || Err("offline".into()))
            .unwrap();
        assert!(cached_detail.stale && cached_replies.stale);
        assert_eq!(cached_detail.fetched_at, detail.fetched_at);
        assert_eq!(cached_replies.fetched_at, replies.fetched_at);
        assert!(cached_detail.warning.unwrap().contains("此前读取的内容"));
        assert!(cached_replies.warning.unwrap().contains("此前读取的回复"));
        assert!(state
            .detail_with("OTHER", true, &closing, || Err("offline".into()))
            .is_err());
        // Gitee documents issue numbers as case sensitive; changing case must
        // never cause a request for another identity to reuse this cache.
        assert!(state
            .detail_with("iks14w", false, &closing, || Err("not found".into()))
            .is_err());
        assert!(state
            .replies_with("iks14w", 1, false, &closing, || Err("not found".into()))
            .is_err());
        assert!(state
            .replies_with("OTHER", 1, true, &closing, || Err("offline".into()))
            .is_err());
        assert!(state
            .replies_with("IKS14W", 2, true, &closing, || Err("offline".into()))
            .is_err());
        assert!(state
            .detail_with("../x", true, &closing, || panic!("invalid number"))
            .is_err());
        assert!(state
            .replies_with("IKS14W", 0, true, &closing, || panic!("invalid page"))
            .is_err());
        closing.store(true, Ordering::Release);
        assert_eq!(
            state
                .detail_with("IKS14W", false, &closing, || panic!("closing"))
                .unwrap_err(),
            "管理器正在退出"
        );
        assert_eq!(
            state
                .replies_with("IKS14W", 1, false, &closing, || panic!("closing"))
                .unwrap_err(),
            "管理器正在退出"
        );
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
        assert_eq!(state.pages.entries.lock().unwrap().len(), MAX_CACHED_PAGES);
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
    fn late_reply_error_cannot_spoil_a_newer_reply_page_or_another_post() {
        use std::sync::{mpsc, Arc};
        let state = Arc::new(State::default());
        let old_state = state.clone();
        let (started_sender, started_receiver) = mpsc::channel();
        let (release_sender, release_receiver) = mpsc::channel();
        let old = thread::spawn(move || {
            old_state.replies_with("IKS14W", 1, true, &AtomicBool::new(false), || {
                started_sender.send(()).unwrap();
                release_receiver
                    .recv_timeout(Duration::from_secs(5))
                    .unwrap();
                Err("Older request failed".into())
            })
        });
        started_receiver
            .recv_timeout(Duration::from_secs(5))
            .unwrap();
        let newer = http_replies(200, &[], &json!([reply(2)]).to_string(), 1).unwrap();
        state
            .replies_with("IKS14W", 1, true, &AtomicBool::new(false), || {
                Ok(newer.clone())
            })
            .unwrap();
        let mut unrelated = newer.clone();
        unrelated.number = "OTHER".into();
        unrelated.replies[0].body = "Other post".into();
        state
            .replies_with("OTHER", 1, true, &AtomicBool::new(false), || Ok(unrelated))
            .unwrap();
        release_sender.send(()).unwrap();
        let late = old.join().unwrap().unwrap();
        assert_eq!(late.number, "IKS14W");
        assert_eq!(late.replies[0].id, "2");
        assert!(!late.stale && late.warning.is_none());
        let cached = state
            .replies_with("OTHER", 1, false, &AtomicBool::new(false), || {
                panic!("cached")
            })
            .unwrap();
        assert_eq!(cached.replies[0].body, "Other post");
        assert!(!cached.stale);
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

    #[test]
    #[ignore = "reads the live public Gitee API; run explicitly"]
    fn live_public_gitee_detail_and_replies() {
        let state = State::default();
        let closing = AtomicBool::new(false);
        let page = state.list(1, true, &closing).unwrap();
        let number = &page.posts.first().expect("public forum has a post").number;
        let detail = state.detail(number, true, &closing).unwrap();
        let replies = state.replies(number, 1, true, &closing).unwrap();
        assert_eq!(&detail.post.post.number, number);
        assert_eq!(&replies.number, number);
        assert!(!detail.stale && !replies.stale);
        println!(
            "{}",
            serde_json::to_string_pretty(&json!({"detail":detail,"replies":replies})).unwrap()
        );
    }
}
