# English previews

The English resource index uses `launcher-<slug>.png` and `app-<slug>.png` from this directory. Display names, author credits, descriptions, and paths are defined in [the English index configuration](../../../tools/resource-index.en.json). The Chinese index continues to use each resource's own `thumb.png`.

First-party previews show the actual application UI in English with test app or media data. Native interfaces are rendered with Robolectric native graphics; Tank TV's bundled canvas game is rendered in Chromium with a simulated native room bridge. These are not photographs of a television. The resource build pipeline supplies these captures; it does not translate text by editing screenshot pixels. [native-captures.json](native-captures.json) records the renderer, exact source commit, successful build, software version, dimensions, and SHA-256 digest for each capture.

## Unmodified upstream screenshots

| Preview | Author | Exact source | Project license |
| --- | --- | --- | --- |
| [TV Bro 2.1.6](app-tvbro.png) | Fedir Tsapana (truefedex) | [Official English screenshot at v2.1.6](https://raw.githubusercontent.com/truefedex/tv-bro/v2.1.6/metadata/en-US/images/tvScreenshots/2.png) | [TV Bro redistribution license](../../../resource/apps/tvbro/LICENSE), [upstream copy](https://github.com/truefedex/tv-bro/blob/v2.1.6/LICENSE.md) |
| [Jellyfin for Android TV 0.19.10](app-jellyfin-tv.png) | Jellyfin contributors | [Official English screenshot at v0.19.10](https://raw.githubusercontent.com/jellyfin/jellyfin-androidtv/v0.19.10/fastlane/metadata/android/en-US/images/tvScreenshots/1.png) | [GPL-2.0](../../../resource/apps/jellyfin-tv/LICENSE), [upstream copy](https://github.com/jellyfin/jellyfin-androidtv/blob/v0.19.10/LICENSE) |

These two files are byte-for-byte copies of official upstream screenshots from the APKs' release tags. They were not captured or modified by pureTV. [upstream-sources.json](upstream-sources.json) records their source URLs, release references, sizes, SHA-256 digests, and license references. Depicted third-party artwork and content retain their respective rights; these files are not relicensed under pureTV's MIT license.
