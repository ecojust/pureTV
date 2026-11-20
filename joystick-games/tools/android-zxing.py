#!/usr/bin/env python3
"""Verify the pinned ZXing 3.5.3 archive, or fetch it from Maven Central."""
import argparse
import hashlib
import json
import os
import shutil
from pathlib import Path
import subprocess
import tempfile

URLS = (
    'https://repo.maven.apache.org/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar',
    'https://repo1.maven.org/maven2/com/google/zxing/core/3.5.3/core-3.5.3.jar',
)
EXPECTED_BYTES = 607650
EXPECTED_SHA256 = '8d8064c1636fdaef7189dd9055c7d59950a8940a12f2293956446ec3c109fd82'


def download(output, receipt, run=None, archive=None):
    """At most two requests; reject HTTP errors, truncation, excess bytes and wrong content."""
    run = run or subprocess.run
    output, receipt = Path(output), Path(receipt)
    if output.resolve() == receipt.resolve():
        raise ValueError('Output and receipt must be distinct')
    for path in (output, receipt):
        if path.exists() or path.is_symlink():
            raise ValueError('Refusing to replace an existing output or receipt')
        path.parent.mkdir(parents=True, exist_ok=True)
    result = {'schemaVersion': 1, 'dependency': 'com.google.zxing:core:3.5.3',
              'expectedBytes': EXPECTED_BYTES, 'expectedSha256': EXPECTED_SHA256,
              'status': 'failed', 'attempts': []}
    sources = [Path(archive)] if archive is not None else URLS
    for source in sources:
        attempt = {'status': 'failed'}
        attempt['archive' if archive is not None else 'url'] = str(source)
        result['attempts'].append(attempt)
        fd, temporary = tempfile.mkstemp(prefix='.zxing-', suffix='.download', dir=output.parent)
        os.close(fd)
        temporary = Path(temporary)
        try:
            if archive is not None:
                if source.stat().st_size != EXPECTED_BYTES:
                    attempt['error'] = 'Unexpected byte count'
                    continue
                shutil.copyfile(source, temporary)
            else:
                command = ['curl', '--fail', '--silent', '--show-error', '--location',
                           '--max-redirs', '2', '--proto', '=https', '--proto-redir', '=https',
                           '--connect-timeout', '10', '--max-time', '30',
                           '--max-filesize', str(EXPECTED_BYTES), '--output', str(temporary),
                           '--write-out', '%{http_code}', source]
                completed = run(command, capture_output=True, text=True, timeout=35, check=False)
                attempt['exitCode'] = completed.returncode
                attempt['httpStatus'] = completed.stdout.strip()
                if completed.returncode != 0 or attempt['httpStatus'] != '200':
                    attempt['error'] = 'HTTP download failed'
                    attempt['detail'] = completed.stderr[-2000:]
                    continue
            size = temporary.stat().st_size
            attempt['bytes'] = size
            if size != EXPECTED_BYTES:
                attempt['error'] = 'Unexpected byte count'
                continue
            digest = hashlib.sha256(temporary.read_bytes()).hexdigest()
            attempt['sha256'] = digest
            if digest != EXPECTED_SHA256:
                attempt['error'] = 'SHA-256 mismatch'
                continue
            # Same-directory hard link publishes the verified bytes atomically
            # and refuses a destination created since the initial check.
            os.link(temporary, output)
            attempt['status'] = 'passed'
            result.update(status='passed', bytes=size, sha256=digest)
            result['selectedArchive' if archive is not None else 'selectedUrl'] = str(source)
            break
        except subprocess.TimeoutExpired:
            attempt['error'] = '35 second process deadline exceeded'
        except OSError as error:
            attempt['error'] = type(error).__name__
        finally:
            temporary.unlink(missing_ok=True)
    with receipt.open('x', encoding='utf-8') as target:
        target.write(json.dumps(result, indent=2) + '\n')
    if result['status'] != 'passed':
        raise RuntimeError('No verified ZXing input was available; see the receipt')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--receipt', required=True, type=Path)
    parser.add_argument('--archive', type=Path, help='Use the locally archived Maven Central JAR')
    args = parser.parse_args()
    print(json.dumps(download(args.output, args.receipt, archive=args.archive), indent=2))


if __name__ == '__main__':
    main()
