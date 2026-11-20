//! Fixed HTTPS directory source shared by the market and desktop updater.
//! Directory/HTTP fingerprints identify a snapshot, not the file's content hash.
use reqwest::{blocking::RequestBuilder, header, header::HeaderMap, Url};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeSet,
    sync::atomic::{AtomicBool, Ordering},
};

pub const SOURCE_URL: &str = "https://apps.b14f.com";
const ROOTS: [&str; 4] = ["game", "launcher", "media", "client"];
const MAX_PAGE: usize = 4 * 1024 * 1024;
const MAX_ENTRIES: usize = 8192;
const MAX_DIRECTORIES: usize = 256;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DirectoryEntry {
    pub path: String,
    pub directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    pub bytes: u64,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
}

pub fn valid_path(path: &str) -> bool {
    !path.is_empty()
        && path.len() <= 2048
        && !path.contains(['\\', '\0'])
        && !path.chars().any(char::is_control)
        && ROOTS.contains(&path.split('/').next().unwrap_or_default())
        && path
            .split('/')
            .all(|part| !part.is_empty() && part != "." && part != ".." && part.len() <= 255)
}

pub fn file_url(path: &str) -> Result<String, String> {
    let trailing = path.ends_with('/');
    let path = path.strip_suffix('/').unwrap_or(path);
    if !valid_path(path) {
        return Err("应用服务器文件路径无效".into());
    }
    let mut url = Url::parse(SOURCE_URL).expect("fixed application source");
    {
        let mut segments = url.path_segments_mut().expect("HTTPS source");
        for part in path.split('/') {
            segments.push(part);
        }
        if trailing {
            segments.push("");
        }
    }
    Ok(url.into())
}

fn unescape_percent(value: &str) -> Option<String> {
    let input = value.as_bytes();
    let mut output = Vec::with_capacity(input.len());
    let mut i = 0;
    while i < input.len() {
        if input[i] == b'%' {
            let a = (*input.get(i + 1)? as char).to_digit(16)?;
            let b = (*input.get(i + 2)? as char).to_digit(16)?;
            output.push((a * 16 + b) as u8);
            i += 3;
        } else {
            output.push(input[i]);
            i += 1;
        }
    }
    String::from_utf8(output).ok()
}

pub fn allowed_url(url: &Url) -> bool {
    if url.scheme() != "https"
        || url.host_str() != Some("apps.b14f.com")
        || url.port().is_some_and(|p| p != 443)
        || !url.username().is_empty()
        || url.password().is_some()
        || url.fragment().is_some()
        || url.query().is_some()
    {
        return false;
    }
    let encoded = url.path().strip_prefix('/').unwrap_or_default();
    let encoded = encoded.strip_suffix('/').unwrap_or(encoded);
    let mut decoded = Vec::new();
    for part in encoded.split('/') {
        let Some(part) = unescape_percent(part) else {
            return false;
        };
        if part.contains('/') {
            return false;
        }
        decoded.push(part);
    }
    valid_path(&decoded.join("/"))
}

fn html_unescape(value: &str) -> Option<String> {
    let mut output = String::new();
    let mut rest = value;
    while let Some(index) = rest.find('&') {
        output.push_str(&rest[..index]);
        rest = &rest[index + 1..];
        let end = rest.find(';')?;
        if end > 16 {
            return None;
        }
        let entity = &rest[..end];
        let character = match entity {
            "amp" => '&',
            "quot" => '"',
            "apos" | "#39" => '\'',
            "lt" => '<',
            "gt" => '>',
            _ if entity.starts_with("#x") || entity.starts_with("#X") => {
                char::from_u32(u32::from_str_radix(&entity[2..], 16).ok()?)?
            }
            _ if entity.starts_with('#') => char::from_u32(entity[1..].parse().ok()?)?,
            _ => return None,
        };
        output.push(character);
        rest = &rest[end + 1..];
    }
    output.push_str(rest);
    Some(output)
}

// Nginx autoindex uses quoted href attributes. Read the href, never the visible
// (possibly truncated) label or its rounded human-readable file size.
fn href_attribute(tag: &str) -> Option<&str> {
    let bytes = tag.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        let start = i;
        while i < bytes.len()
            && (bytes[i].is_ascii_alphanumeric() || matches!(bytes[i], b'-' | b'_'))
        {
            i += 1;
        }
        if i == start {
            i += 1;
            continue;
        }
        let name = &tag[start..i];
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        if bytes.get(i) != Some(&b'=') {
            continue;
        }
        i += 1;
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        let quote = *bytes.get(i)?;
        if quote != b'"' && quote != b'\'' {
            return None;
        }
        i += 1;
        let start = i;
        while i < bytes.len() && bytes[i] != quote {
            i += 1;
        }
        if i == bytes.len() {
            return None;
        }
        if name.eq_ignore_ascii_case("href") {
            return Some(&tag[start..i]);
        }
        i += 1;
    }
    None
}

pub fn parse_directory(bytes: &[u8], directory: &str) -> Result<Vec<DirectoryEntry>, String> {
    let directory = directory.strip_suffix('/').unwrap_or(directory);
    if !valid_path(directory) || bytes.len() > MAX_PAGE {
        return Err("应用服务器目录无效或过大".into());
    }
    let html = std::str::from_utf8(bytes).map_err(|_| "无法解析应用服务器目录")?;
    let lower = html.to_ascii_lowercase();
    if !lower.contains("<title>index of ") || !lower.contains("<pre>") || !lower.contains("</pre>")
    {
        return Err("应用服务器未返回可识别的文件目录".into());
    }
    let mut entries = BTreeSet::new();
    let mut from = 0;
    let mut links = 0;
    while let Some(offset) = lower[from..].find("<a") {
        let start = from + offset + 2;
        from = start;
        if !lower
            .as_bytes()
            .get(start)
            .is_some_and(u8::is_ascii_whitespace)
        {
            continue;
        }
        let Some(end) = lower[start..].find('>') else {
            return Err("无法解析应用服务器目录".into());
        };
        from = start + end + 1;
        links += 1;
        if links > MAX_ENTRIES {
            return Err("应用服务器目录条目过多".into());
        }
        let Some(href) = href_attribute(&html[start..start + end]).and_then(html_unescape) else {
            continue;
        };
        let is_directory = href.ends_with('/');
        let leaf = href.strip_suffix('/').unwrap_or(&href);
        // Only direct relative children, never parent links, queries or hosts.
        if leaf.is_empty() || leaf.contains(['/', '?', '#', ':', '\\']) {
            continue;
        }
        let Some(leaf) = unescape_percent(leaf) else {
            continue;
        };
        if leaf.starts_with('.') || leaf.contains('/') {
            continue;
        }
        let path = format!("{directory}/{leaf}");
        if !valid_path(&path) {
            continue;
        }
        entries.insert((path, is_directory));
    }
    Ok(entries
        .into_iter()
        .map(|(path, directory)| DirectoryEntry { path, directory })
        .collect())
}

/// Enumerate category files and files in direct application folders. Source/docs
/// subdirectories are not catalogs and are deliberately not traversed.
pub fn list_files_with(
    roots: &[&str],
    cancel: &AtomicBool,
    mut fetch: impl FnMut(&str) -> Result<Vec<u8>, String>,
) -> Result<Vec<String>, String> {
    let mut files = BTreeSet::new();
    let mut folders = BTreeSet::new();
    for root in roots {
        if !ROOTS.contains(root) {
            return Err("应用服务器目录无效或过大".into());
        }
        if cancel.load(Ordering::Acquire) {
            return Err("应用服务器请求已取消".into());
        }
        let bytes = fetch(&file_url(&format!("{root}/"))?)?;
        for entry in parse_directory(&bytes, root)? {
            if entry.directory {
                folders.insert(entry.path);
            } else {
                files.insert(entry.path);
            }
        }
    }
    if folders.len() > MAX_DIRECTORIES {
        return Err("应用服务器目录条目过多".into());
    }
    for folder in folders {
        if cancel.load(Ordering::Acquire) {
            return Err("应用服务器请求已取消".into());
        }
        let bytes = fetch(&file_url(&format!("{folder}/"))?)?;
        for entry in parse_directory(&bytes, &folder)? {
            if !entry.directory {
                files.insert(entry.path);
            }
        }
        if files.len() > MAX_ENTRIES {
            return Err("应用服务器目录条目过多".into());
        }
    }
    if files.len() > MAX_ENTRIES {
        return Err("应用服务器目录条目过多".into());
    }
    if cancel.load(Ordering::Acquire) {
        return Err("应用服务器请求已取消".into());
    }
    Ok(files.into_iter().collect())
}

fn strong_etag(value: &str) -> bool {
    value.len() >= 2
        && value.len() <= 512
        && value.starts_with('"')
        && value.ends_with('"')
        && value.as_bytes()[1..value.len() - 1]
            .iter()
            .all(|b| *b >= 0x21 && *b != b'"' && *b != 0x7f)
}

fn last_modified(value: &str) -> bool {
    // Nginx emits RFC 7231 IMF-fixdate. Accept this unambiguous format only.
    let b = value.as_bytes();
    value.is_ascii()
        && b.len() == 29
        && b[3..5] == *b", "
        && b[7] == b' '
        && b[11] == b' '
        && b[16] == b' '
        && b[19] == b':'
        && b[22] == b':'
        && b[25..] == *b" GMT"
        && ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].contains(&&value[..3])
        && [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ]
        .contains(&&value[8..11])
        && [5, 6, 12, 13, 14, 15, 17, 18, 20, 21, 23, 24]
            .iter()
            .all(|i| b[*i].is_ascii_digit())
        && (1..=31).contains(&value[5..7].parse::<u8>().unwrap_or(0))
        && value[17..19].parse::<u8>().unwrap_or(255) < 24
        && value[20..22].parse::<u8>().unwrap_or(255) < 60
        && value[23..25].parse::<u8>().unwrap_or(255) <= 60
}

fn identity_encoding(headers: &HeaderMap) -> bool {
    headers
        .get(header::CONTENT_ENCODING)
        .is_none_or(|v| v.as_bytes().eq_ignore_ascii_case(b"identity"))
}

pub fn metadata_from_headers(headers: &HeaderMap, maximum: u64) -> Result<FileMetadata, String> {
    if !identity_encoding(headers) {
        return Err("应用服务器返回了不支持的文件编码".into());
    }
    let bytes = headers
        .get(header::CONTENT_LENGTH)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.parse::<u64>().ok())
        .filter(|v| *v > 0 && *v <= maximum)
        .ok_or("应用服务器未提供有效的文件大小")?;
    let etag = headers
        .get(header::ETAG)
        .and_then(|v| v.to_str().ok())
        .filter(|v| strong_etag(v))
        .map(str::to_owned);
    let last_modified = headers
        .get(header::LAST_MODIFIED)
        .and_then(|v| v.to_str().ok())
        .filter(|v| last_modified(v))
        .map(str::to_owned);
    if etag.is_none() && last_modified.is_none() {
        return Err("应用服务器未提供文件变更校验信息".into());
    }
    Ok(FileMetadata {
        bytes,
        etag,
        last_modified,
    })
}

pub fn fingerprint(path: &str, metadata: &FileMetadata) -> String {
    let payload =
        serde_json::to_vec(&(SOURCE_URL, path, metadata)).expect("serializable file metadata");
    format!("{:x}", Sha256::digest(payload))
}

pub fn apply_conditions(request: RequestBuilder, metadata: &FileMetadata) -> RequestBuilder {
    if let Some(etag) = metadata.etag.as_deref().filter(|v| strong_etag(v)) {
        request.header(header::IF_MATCH, etag)
    } else if let Some(modified) = metadata
        .last_modified
        .as_deref()
        .filter(|v| last_modified(v))
    {
        request.header(header::IF_UNMODIFIED_SINCE, modified)
    } else {
        request
    }
}

pub fn check_response_metadata(headers: &HeaderMap, expected: &FileMetadata) -> Result<(), String> {
    if !identity_encoding(headers) {
        return Err("应用服务器返回了不支持的文件编码".into());
    }
    if let Some(length) = headers.get(header::CONTENT_LENGTH) {
        if length.to_str().ok().and_then(|v| v.parse::<u64>().ok()) != Some(expected.bytes) {
            return Err("服务器文件已变化，请刷新后重试".into());
        }
    }
    if let Some(etag) = expected.etag.as_deref().filter(|v| strong_etag(v)) {
        if headers.get(header::ETAG).and_then(|v| v.to_str().ok()) != Some(etag) {
            return Err("服务器文件已变化，请刷新后重试".into());
        }
    } else if let Some(modified) = expected
        .last_modified
        .as_deref()
        .filter(|v| last_modified(v))
    {
        if headers
            .get(header::LAST_MODIFIED)
            .and_then(|v| v.to_str().ok())
            != Some(modified)
        {
            return Err("服务器文件已变化，请刷新后重试".into());
        }
    } else {
        return Err("应用服务器未提供文件变更校验信息".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn page(links: &str) -> Vec<u8> {
        format!("<html><title>Index of /game/</title><pre>{links}</pre></html>").into_bytes()
    }
    fn headers() -> HeaderMap {
        let mut h = HeaderMap::new();
        h.insert(header::CONTENT_LENGTH, "83318".parse().unwrap());
        h.insert(header::ETAG, "\"691789d9-14576\"".parse().unwrap());
        h.insert(
            header::LAST_MODIFIED,
            "Sun, 15 Nov 2026 08:00:00 GMT".parse().unwrap(),
        );
        h
    }
    #[test]
    fn autoindex_uses_encoded_links_not_truncated_labels_or_rounded_sizes() {
        let bytes = page("<a href=\"../\">../</a><a href=\"BBLL5%E6%94%B91.5.2.apk\">short...</a> 9M <a href='A%26B.apk'>x</a> 10M <a href=\"foo/\">foo/</a>");
        let values = parse_directory(&bytes, "media/bbll/").unwrap();
        assert_eq!(
            values,
            vec![
                DirectoryEntry {
                    path: "media/bbll/A&B.apk".into(),
                    directory: false
                },
                DirectoryEntry {
                    path: "media/bbll/BBLL5改1.5.2.apk".into(),
                    directory: false
                },
                DirectoryEntry {
                    path: "media/bbll/foo".into(),
                    directory: true
                }
            ]
        );
        assert!(file_url(&values[1].path).unwrap().contains("%E6%94%B9"));
    }
    #[test]
    fn index_drops_parent_cross_origin_traversal_and_hidden_links() {
        let bytes = page("<a href=\"../\">p</a><a href=\"https://evil/a.apk\">x</a><a href=\"%2e%2e/\">p</a><a href=\"a%2fb.apk\">x</a><a href=\"a%5cb.apk\">x</a><a href=\".DS_Store\">x</a><a href=\"a.apk?x=1\">x</a><a href=\"%zz.apk\">x</a><a href=\"safe.apk\">x</a>");
        let values = parse_directory(&bytes, "game").unwrap();
        assert_eq!(values.len(), 1);
        assert_eq!(values[0].path, "game/safe.apk");
        assert!(parse_directory(b"<html>login</html>", "game").is_err());
        assert!(parse_directory(&vec![b'x'; MAX_PAGE + 1], "game").is_err());
    }
    #[test]
    fn entity_links_and_duplicate_links_are_handled() {
        let values = parse_directory(&page("<a class='x' HREF=\"a&amp;b.apk\">x</a><a href='a%26b.apk'>again</a><a href=\"%F0%9F%93%BA.apk\">tv</a>"), "media").unwrap();
        assert_eq!(values.len(), 2);
        assert_eq!(values[0].path, "media/a&b.apk");
    }
    #[test]
    fn only_fixed_https_origin_and_category_paths_are_allowed() {
        for value in [
            "game/",
            "media/bbll/BBLL5改1.5.2.apk",
            "client/a.exe",
            "launcher/a/logo.svg",
        ] {
            assert!(allowed_url(&Url::parse(&file_url(value).unwrap()).unwrap()));
        }
        for value in [
            "http://apps.b14f.com/game/a.apk",
            "https://apps.b14f.com.evil/game/a.apk",
            "https://apps.b14f.com:8443/game/a.apk",
            "https://user:pass@apps.b14f.com/game/a.apk",
            "https://apps.b14f.com/other/a.apk",
            "https://apps.b14f.com/game/a.apk?x=1",
            "https://apps.b14f.com/game/a.apk#x",
            "https://apps.b14f.com/game/a%2fb.apk",
            "https://gitee.com/game/a.apk",
        ] {
            assert!(!allowed_url(&Url::parse(value).unwrap()), "{value}");
        }
    }
    #[test]
    fn listing_stops_before_source_directories_and_checks_cancel() {
        let cancel = AtomicBool::new(false);
        let mut calls = Vec::new();
        let files = list_files_with(&["game"], &cancel, |url| {
            calls.push(url.to_owned());
            Ok(if url.ends_with("/game/") {
                page("<a href='test/'>test</a>")
            } else {
                page("<a href='test.apk'>app</a><a href='src/'>src</a>")
            })
        })
        .unwrap();
        assert_eq!(files, vec!["game/test/test.apk"]);
        assert_eq!(calls.len(), 2);
        cancel.store(true, Ordering::Release);
        assert!(list_files_with(&["game"], &cancel, |_| panic!(
            "must not fetch after cancellation"
        ))
        .is_err());
    }
    #[test]
    fn precise_size_and_validator_are_required() {
        let mut h = headers();
        let value = metadata_from_headers(&h, 100_000).unwrap();
        assert_eq!(value.bytes, 83318);
        assert!(metadata_from_headers(&h, 10).is_err());
        h.remove(header::CONTENT_LENGTH);
        assert!(metadata_from_headers(&h, 100_000).is_err());
        h.insert(header::CONTENT_LENGTH, "83K".parse().unwrap());
        assert!(metadata_from_headers(&h, 100_000).is_err());
        h.insert(header::CONTENT_LENGTH, "83318".parse().unwrap());
        h.remove(header::ETAG);
        h.remove(header::LAST_MODIFIED);
        assert!(metadata_from_headers(&h, 100_000).is_err());
    }
    #[test]
    fn weak_etag_requires_valid_last_modified_fallback() {
        let mut h = headers();
        h.insert(header::ETAG, "W/\"abc\"".parse().unwrap());
        let value = metadata_from_headers(&h, 100_000).unwrap();
        assert_eq!(value.etag, None);
        h.insert(header::LAST_MODIFIED, "bad date".parse().unwrap());
        assert!(metadata_from_headers(&h, 100_000).is_err());
    }
    #[test]
    fn conditional_request_uses_etag_then_timestamp() {
        let client = reqwest::blocking::Client::new();
        let mut value = metadata_from_headers(&headers(), 100_000).unwrap();
        let request = apply_conditions(client.get(file_url("game/a.apk").unwrap()), &value)
            .build()
            .unwrap();
        assert_eq!(
            request.headers()[header::IF_MATCH],
            value.etag.as_deref().unwrap()
        );
        value.etag = None;
        let request = apply_conditions(client.get(file_url("game/a.apk").unwrap()), &value)
            .build()
            .unwrap();
        assert!(request.headers().contains_key(header::IF_UNMODIFIED_SINCE));
    }
    #[test]
    fn responses_reject_changed_size_validator_and_encoding() {
        let mut h = headers();
        let expected = metadata_from_headers(&h, 100_000).unwrap();
        assert!(check_response_metadata(&h, &expected).is_ok());
        h.remove(header::CONTENT_LENGTH);
        assert!(check_response_metadata(&h, &expected).is_ok());
        h.insert(header::ETAG, "\"changed\"".parse().unwrap());
        assert!(check_response_metadata(&h, &expected).is_err());
        h = headers();
        h.insert(header::CONTENT_LENGTH, "83319".parse().unwrap());
        assert!(check_response_metadata(&h, &expected).is_err());
        h = headers();
        h.insert(header::CONTENT_ENCODING, "gzip".parse().unwrap());
        assert!(check_response_metadata(&h, &expected).is_err());
    }
    #[test]
    fn metadata_fingerprint_changes_with_source_path_size_and_validator() {
        let mut value = metadata_from_headers(&headers(), 100_000).unwrap();
        let a = fingerprint("game/a.apk", &value);
        assert_eq!(a.len(), 64);
        assert_ne!(a, fingerprint("media/a.apk", &value));
        value.bytes += 1;
        assert_ne!(a, fingerprint("game/a.apk", &value));
        value.bytes -= 1;
        value.etag = Some("\"changed\"".into());
        assert_ne!(a, fingerprint("game/a.apk", &value));
    }
}
