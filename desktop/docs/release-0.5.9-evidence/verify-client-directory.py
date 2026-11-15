"""Read the public client index without uploading or downloading installers."""
import datetime
import hashlib
import json
import re
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

URL = 'https://apps.b14f.com/client/'
OUT = Path(__file__).resolve().parent

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.files = set()
    def handle_starttag(self, tag, attrs):
        if tag != 'a':
            return
        href = dict(attrs).get('href', '')
        resolved = urllib.parse.urljoin(URL, href)
        if not resolved.startswith(URL):
            return
        filename = urllib.parse.unquote(resolved[len(URL):])
        if re.fullmatch(r'pureTV-Manager-[0-9]+\.[0-9]+\.[0-9]+-(?:windows-x64-(?:setup|portable)\.exe|macos-(?:arm64|x64)\.dmg|linux-x64\.deb)', filename):
            self.files.add(filename)

with urllib.request.urlopen(urllib.request.Request(URL, headers={'User-Agent': 'pureTV-release-verification'}), timeout=30) as response:
    assert response.status == 200 and response.url == URL
    body = response.read(4 * 1024 * 1024 + 1)
    assert len(body) <= 4 * 1024 * 1024
parser = Links()
parser.feed(body.decode('utf-8'))
files = sorted(parser.files)
assert files, 'No recognized client packages in the public listing'
result = {
    'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'url': URL, 'httpStatus': 200, 'listingBytes': len(body),
    'listingSha256': hashlib.sha256(body).hexdigest(), 'files': files,
    'versions': sorted({re.search(r'Manager-([0-9.]+)-', name)[1] for name in files}),
    'version059Present': any('-0.5.9-' in name for name in files),
    'uploadPerformed': False,
    'scope': 'Read-only directory listing; not another complete download verification',
}
(OUT / 'client-directory-after.html').write_bytes(body)
(OUT / 'client-directory-after.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
