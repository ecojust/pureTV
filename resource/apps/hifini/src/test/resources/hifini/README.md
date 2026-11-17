# HiFiNi adapter evidence and fixtures

`musicparse-search.html` is a minimal, anonymized excerpt of the real HTML supplied by the user on 2026-10-25. It keeps three results from the observed PHP `print_r` arrays: two NetEase entries (including one with `tid = 0`) and one Kuwo entry. Personal account information and unrelated page content are omitted. `search.html` and `player.html` are synthetic forum/parser fixtures: their song names, artists and `example.invalid` media URLs are invented, and those media URLs are never fetched by tests.

## Current catalog contracts

The user supplied these routes:

- Search: `https://www.hifini.net/musicparse-search.htm?keyword=%E5%8B%87%E6%B0%94` for `勇气`. Its HTML contains provider arrays with `source`, `source_id`, `title`, `artist`, `album`, `cover_url`, `duration`, `topic_id`, `topic_url` and `tid`.
- Playback: `https://www.hifini.net/musicparse-play.htm?source=netease&id=254485`. The user confirmed playback can use `source` and `source_id` directly; the adapter accepts the observed `netease` / `kuwo` providers and positive decimal IDs only.

Catalog identity is `source:source_id`. A missing forum association is valid: entries with `tid = 0` remain searchable and playable. Forum IDs are never invented from provider IDs. Each playback creates the URL from the stable identity and retains the search result's title, artist, cover and duration; it does not wait for a forum page. The parser reads bounded PHP array text as data, never executes PHP or JavaScript, and does not assume an unobserved JSON response shape.

The HTTP cover host `p1.music.126.net` is upgraded to HTTPS because an ordinary HEAD request for the user's actual sample cover returned HTTP 200, `image/jpg`, 181484 bytes on 2026-10-25. This exception applies only to that exact hostname. Other HTTP cover hosts are not silently rewritten or accepted.

Search requires login. The official-site WebView lets the user complete sign-in; its session cookies are sent only by manually controlled HTTPS requests to official HiFiNi origins. Login pages and redirects produce a login-required result, not an empty list. Cookie presence is not proof of authentication. Cookies are not passed to the Android media player or third-party cover hosts.

The app does not request, parse or display lyrics. An `lrc` value deliberately remains in the synthetic player fixture to verify that metadata/audio resolution ignores it and issues no additional request.

## Live verification limits

On 2026-10-25, ordinary HTTPS requests from the development environment to `www.hifini.net` and `hifini.net` returned HTTP 503 (`upstream connect error or disconnect/reset before headers`). The user-supplied detail page `https://www.hifini.net/thread-6544.htm` also failed via ordinary HTTPS and a standard Chromium navigation; an independent public reader returned `ERR_EMPTY_RESPONSE`. Requests to the new catalog search and `plugin/xn_musicparse/static/mp-thread.js?v=14` also failed from this environment.

The catalog fixtures and URL contracts are grounded in the user's supplied page and playback example. Unit tests verify parsing, identities, URL construction and boundaries; they are **not evidence of successful live search or streaming**. No unobserved response formats, parsing services or authentication bypasses are substituted for the unavailable live site.

## Separate forum compatibility

The user also supplied the older authenticated forum search URL `https://www.hifini.net/search-_E5_8B_87_E6_B0_94-1.htm`. The separate `forumSearch` method encodes non-alphanumeric UTF-8 bytes as `_XX`, including route delimiters. It is not an automatic fallback for catalog search. The UI shuffles current search results; it does not depend on a guessed random-song API.

These older public references were inspected read-only for forum link and static player conventions:

- [wliqi495-create/jaychou123 — 音乐磁场[听].js](https://github.com/wliqi495-create/jaychou123/blob/537fc7311c1b3bf6778a1004b37bf4f417a42381/yingshi/js/音乐磁场%5B听%5D.js), Git blob `0a1699136d20e9dd61c546dde8862be8c01b7a29`: `.net` origin, `.subject` thread links and literal player `url`. Its search route is superseded by the user's examples.
- [jak0099/dr — 音乐磁场[音].js](https://github.com/jak0099/dr/blob/f2aa3691d11a6e198714fe14d445341576cba193/js/音乐/音乐磁场%5B音%5D.js), Git blob `651645506d880764f1e14b1b26d6480b18301602`: independent evidence of the same forum links and player conventions.
- [Lxxxxxxy/HifiniRandomMusic — MusicService.java](https://github.com/Lxxxxxxy/HifiniRandomMusic/blob/master/src/main/java/cn/lixingyu/hifinirandommusic/service/MusicService.java): older APlayer spellings `music`, `title`, `author` and `pic`.

Official `thread-N.htm` URLs can still be entered as search input. Only stable metadata survives the lookup, and playback reads the thread again for a fresh audio URL. Forum candidates must have song-title brackets or explicit music-format markers; arbitrary navigation links and plain announcements are excluded. Static APlayer strings or HTML audio metadata are accepted without script execution. The implementation is original and does not embed the referenced projects' code.
