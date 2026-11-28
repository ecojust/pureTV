//! Download the two catalog APKs supplied separately from the desktop installation.
use reqwest::{blocking::Response, redirect::Policy, StatusCode, Url};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::LazyLock;
use std::time::Duration;

// Both official APKs in the 0.7.0 master tree match the current catalog receipts.
const REVISION: &str = "91da348a470b2dc45a86662c3d972bebf0d23e70";
static ONLINE_IDS: LazyLock<[&str; 2]> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../../../tools/pc-games/online-only.json"))
        .expect("the bundled online-only catalog must contain two game IDs")
});

pub(crate) fn is_online_only(id: &str) -> bool {
    ONLINE_IDS.contains(&id)
}

fn official_url(id: &str, file: &str) -> Result<Url, String> {
    if !is_online_only(id)
        || !file.starts_with(&format!("{id}-"))
        || !file.ends_with(".apk")
        || !file
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"-._".contains(&c))
    {
        return Err("游戏没有可用的官方 APK 下载地址".into());
    }
    format!(
        "https://raw.githubusercontent.com/ecojust/pureTV/{REVISION}/joystick-games/{id}/{file}"
    )
    .parse()
    .map_err(|_| "游戏 APK 清单地址无效".into())
}

pub(crate) fn download(
    id: &str,
    file: &str,
    expected: u64,
    cancel: &AtomicBool,
) -> Result<Response, String> {
    if cancel.load(Ordering::Acquire) {
        return Err("游戏 APK 操作已取消".into());
    }
    let url = official_url(id, file)?;
    // These versioned Git blobs have a final raw URL and do not require a redirect.
    let response = reqwest::blocking::Client::builder()
        .https_only(true)
        .redirect(Policy::none())
        .user_agent(concat!("pureTV-Manager/", env!("CARGO_PKG_VERSION")))
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|_| "无法准备游戏下载")?
        .get(url)
        .header(reqwest::header::ACCEPT_ENCODING, "identity")
        .send()
        .map_err(|_| "无法连接游戏 APK 下载服务器")?;
    if response.status() != StatusCode::OK {
        return Err(format!(
            "游戏 APK 下载服务器返回 HTTP {}",
            response.status().as_u16()
        ));
    }
    if response
        .content_length()
        .is_some_and(|length| length != expected)
    {
        return Err("游戏 APK 大小与清单不符".into());
    }
    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_the_two_official_game_downloads_are_addressable() {
        assert_eq!(ONLINE_IDS.len(), 2);
        for id in ["kart-rush", "cf-transport-ship"] {
            let file = format!("{id}-0.1.3.apk");
            let url = official_url(id, &file).unwrap();
            assert_eq!(url.host_str(), Some("raw.githubusercontent.com"));
            assert_eq!(
                url.path(),
                format!("/ecojust/pureTV/{REVISION}/joystick-games/{id}/{file}")
            );
        }
        assert!(official_url("turbo-kart-rush", "turbo-kart-rush-0.1.3.apk").is_err());
        assert!(official_url("kart-rush", "kart-rush-../other.apk").is_err());
        assert!(official_url("kart-rush", "kart-rush-%2e%2e.apk").is_err());
        assert!(official_url("kart-rush", "https://example.org/kart-rush-0.1.3.apk").is_err());
    }

    #[test]
    fn cancelled_download_does_not_open_the_network() {
        assert!(download(
            "kart-rush",
            "kart-rush-0.1.3.apk",
            1,
            &AtomicBool::new(true)
        )
        .unwrap_err()
        .contains("取消"));
    }
}
