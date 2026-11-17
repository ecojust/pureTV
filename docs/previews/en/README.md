# English previews

The English resource index uses `launcher-<slug>.png` and `app-<slug>.png` from this directory. Display names, author credits, descriptions, and paths are defined in [the English index configuration](../../../tools/resource-index.en.json). The Chinese index continues to use each resource's own `thumb.png`.

First-party previews show the actual application UI in English with test app or media data. Native interfaces are rendered with Robolectric native graphics; Tank TV's bundled canvas game is rendered in Chromium with a simulated native room bridge. These are not photographs of a television. The resource build pipeline supplies these captures; it does not translate text by editing screenshot pixels. [native-captures.json](native-captures.json) records the renderer, exact source commit, successful build, software version, dimensions, and SHA-256 digest for each capture.
