#!/usr/bin/env python3
"""Compile and exercise the real loopback server on macOS (no game mutation)."""
import json
import hashlib
import os
from pathlib import Path
import platform
import select
import socket
import subprocess
import tempfile
import unittest
from urllib.parse import urlsplit

SOURCE = Path(__file__).resolve().parents[1] / 'Sources/LocalAssetServer.swift'
HARNESS = r'''
import Foundation
import Darwin
let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let policy: Any? = CommandLine.arguments.count > 2
    ? try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) : nil
let server = LocalAssetServer(root: root, policy: policy)
server.start { result in
    switch result {
    case .success(let url): print("READY " + url.absoluteString); fflush(stdout)
    case .failure(let error): print("ERROR " + error.localizedDescription); fflush(stdout); exit(2)
    }
}
RunLoop.main.run()
'''


@unittest.skipUnless(platform.system() == 'Darwin', 'Requires actual macOS Network framework and Swift compiler')
class NativeLocalAssets(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.compilation = tempfile.TemporaryDirectory(prefix='native-assets-build-')
        root = Path(cls.compilation.name)
        (root / 'main.swift').write_text(HARNESS)
        cls.binary = root / 'asset-server-test'
        command = ['xcrun', 'swiftc', '-swift-version', '5', '-O', str(SOURCE),
                   str(root / 'main.swift'), '-framework', 'Network', '-o', str(cls.binary)]
        context = {'method': 'Compile actual LocalAssetServer and make real loopback HTTP requests',
                   'architecture': platform.machine(), 'system': platform.platform(), 'command': command,
                   'swiftVersion': subprocess.check_output(['xcrun', 'swiftc', '--version'], text=True),
                   'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                   'testSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                   'harnessSha256': hashlib.sha256(HARNESS.encode()).hexdigest(), 'status': 'compiling'}
        evidence = Path(os.environ['PURETV_ASSET_TEST_EVIDENCE']) if os.environ.get('PURETV_ASSET_TEST_EVIDENCE') else None
        if evidence:
            evidence.mkdir(parents=True, exist_ok=False)
            (evidence / 'main.swift').write_text(HARNESS)
            (evidence / 'compile-context.json').write_text(json.dumps(context, indent=2) + '\n')
        print(json.dumps(context), flush=True)
        try:
            subprocess.run(command, check=True)
            context.update(status='compiled', binarySha256=hashlib.sha256(cls.binary.read_bytes()).hexdigest())
        except Exception:
            context.update(status='compile_failed')
            raise
        finally:
            if evidence: (evidence / 'compile-context.json').write_text(json.dumps(context, indent=2) + '\n')

    @classmethod
    def tearDownClass(cls):
        cls.compilation.cleanup()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='native-assets-http-')
        self.root = Path(self.temp.name) / 'Web'; self.root.mkdir()
        (self.root / 'tv.html').write_bytes(b'<!doctype html><title>Real server boundary test</title>')
        self.processes = []
        self.first_lines = {}
        self.case_evidence = None
        if os.environ.get('PURETV_ASSET_TEST_EVIDENCE'):
            self.case_evidence = Path(os.environ['PURETV_ASSET_TEST_EVIDENCE']) / 'cases' / self._testMethodName
            self.case_evidence.mkdir(parents=True, exist_ok=False)
        self.policy = {'schemaVersion': 1, 'maxAssetBytes': 64 * 1024 * 1024,
                       'maxTotalBytes': 128 * 1024 * 1024, 'maxApkBytes': 99_000_000}

    def tearDown(self):
        for index, process in enumerate(self.processes):
            if process.poll() is None: process.terminate()
            stdout, stderr = process.communicate(timeout=10)
            if self.case_evidence:
                (self.case_evidence / (str(index) + '-stdout.log')).write_bytes(self.first_lines.get(process.pid, b'') + stdout)
                (self.case_evidence / (str(index) + '-stderr.log')).write_bytes(stderr)
                (self.case_evidence / (str(index) + '-process.json')).write_text(json.dumps({
                    'command': process.args, 'exitCode': process.returncode,
                    'terminationAfterTestIsExpected': True,
                }, indent=2) + '\n')
        self.temp.cleanup()

    def start(self, policy=None, success=True):
        args = [str(self.binary), str(self.root)]
        if policy is not None:
            path = self.root.parent / ('policy-' + str(len(self.processes)) + '.json')
            path.write_text(json.dumps(policy)); args.append(str(path))
        process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.processes.append(process)
        self.assertTrue(select.select([process.stdout], [], [], 15)[0], 'Native asset server did not start')
        raw_line = process.stdout.readline(); self.first_lines[process.pid] = raw_line
        line = raw_line.decode('utf-8', errors='replace').strip()
        if not success:
            self.assertTrue(line.startswith('ERROR '), line)
            self.assertEqual(process.wait(timeout=10), 2)
            return None
        self.assertTrue(line.startswith('READY '), line)
        return urlsplit(line[6:]).port

    def request(self, port, target='/tv.html', method='GET', headers=None):
        fields = {'Host': f'127.0.0.1:{port}', **(headers or {})}
        wire = f'{method} {target} HTTP/1.1\r\n' + ''.join(f'{key}: {value}\r\n' for key, value in fields.items()) + '\r\n'
        with socket.create_connection(('127.0.0.1', port), timeout=10) as connection:
            connection.sendall(wire.encode('ascii'))
            response = bytearray()
            while True:
                data = connection.recv(65536)
                if not data: break
                response.extend(data)
        header, body = bytes(response).split(b'\r\n\r\n', 1)
        lines = header.decode('ascii').split('\r\n')
        status = int(lines[0].split(' ')[1])
        fields = dict(line.split(': ', 1) for line in lines[1:])
        if method != 'HEAD': self.assertEqual(len(body), int(fields['Content-Length']))
        return status, fields, body

    def test_multiple_chunks_preserve_binary_and_3d_mime(self):
        data = bytes(range(256)) * 1024 + b'\xff\0last-chunk'
        for name in ['car.glb', 'track.bin', 'decoder.wasm', 'sky.hdr', 'texture.ktx2']:
            (self.root / name).write_bytes(data)
        port = self.start(self.policy)
        for name, mime in [('car.glb', 'model/gltf-binary'), ('track.bin', 'application/octet-stream'),
                           ('decoder.wasm', 'application/wasm'), ('sky.hdr', 'application/octet-stream'),
                           ('texture.ktx2', 'image/ktx2')]:
            status, headers, body = self.request(port, '/' + name)
            self.assertEqual(status, 200); self.assertEqual(body, data)
            self.assertEqual(headers['Content-Type'], mime)
            self.assertEqual(headers['Accept-Ranges'], 'bytes')

    def test_head_and_single_ranges_use_exact_lengths(self):
        data = bytes(range(256)) * 1000
        (self.root / 'music.mp3').write_bytes(data)
        port = self.start()
        status, headers, body = self.request(port, '/music.mp3', 'HEAD', {'Range': 'bytes=0-1'})
        self.assertEqual((status, body, int(headers['Content-Length'])), (200, b'', len(data)))
        for value, lower, upper in [('bytes=100-69999', 100, 70000), ('bytes=65536-', 65536, len(data)),
                                     ('bytes=-17', len(data) - 17, len(data)),
                                     ('bytes=-999999', 0, len(data)), ('bytes=2-999999', 2, len(data))]:
            status, headers, body = self.request(port, '/music.mp3', headers={'Range': value})
            self.assertEqual((status, body), (206, data[lower:upper]))
            self.assertEqual(headers['Content-Range'], f'bytes {lower}-{upper-1}/{len(data)}')
        status, _, body = self.request(port, '/music.mp3', headers={'Range': 'bytes=0-1', 'If-Range': '"unknown"'})
        self.assertEqual((status, body), (200, data))

    def test_bad_ranges_and_empty_file_are_unsatisfiable(self):
        (self.root / 'music.mp3').write_bytes(b'0123456789')
        (self.root / 'empty.mp3').write_bytes(b'')
        port = self.start()
        for value in ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,4-6',
                      'bytes=0-1-2', 'items=0-1', 'bytes=+0-1', 'bytes=0- 1', 'bytes=999999999999999999999-']:
            status, headers, _ = self.request(port, '/music.mp3', headers={'Range': value})
            self.assertEqual(status, 416, value)
            self.assertEqual(headers['Content-Range'], 'bytes */10')
        self.assertEqual(self.request(port, '/empty.mp3', headers={'Range': 'bytes=0-'})[0], 416)

    def test_paths_host_method_and_body_boundaries(self):
        port = self.start()
        for target in ['/../tv.html', '//tv.html', '/nested/tv.html', '/%74v.html', '/%2e%2e/tv.html',
                       '/tv.html?x=1', '/tv.html#x', '/tv\\.html', '/.hidden']:
            self.assertIn(self.request(port, target)[0], [400, 404], target)
        self.assertEqual(self.request(port, headers={'Host': 'attacker.invalid'})[0], 403)
        self.assertEqual(self.request(port, method='POST')[0], 405)
        self.assertEqual(self.request(port, headers={'Content-Length': '1'})[0], 400)
        self.assertEqual(self.request(port, headers={'Transfer-Encoding': 'chunked'})[0], 400)

    def test_symlinks_and_changed_file_size_cannot_escape_index(self):
        (self.root / 'music.mp3').write_bytes(b'original')
        port = self.start()
        (self.root / 'music.mp3').write_bytes(b'changed-length')
        self.assertEqual(self.request(port, '/music.mp3')[0], 404)
        (self.root / 'music.mp3').unlink()
        outside = self.root.parent / 'outside.mp3'; outside.write_bytes(b'original')
        (self.root / 'music.mp3').symlink_to(outside)
        self.assertEqual(self.request(port, '/music.mp3')[0], 404)
        self.start(success=False)

    def test_old_default_limits_remain_and_explicit_large_asset_streams(self):
        path = self.root / 'large.js'
        with path.open('wb') as file: file.truncate(11 * 1024 * 1024)
        self.start(success=False)
        port = self.start(self.policy)
        status, _, body = self.request(port, '/large.js', headers={'Range': 'bytes=65530-65540'})
        self.assertEqual((status, body), (206, b'\0' * 11))
        path.unlink()
        for index in range(4):
            with (self.root / (str(index) + '.js')).open('wb') as file: file.truncate(9 * 1024 * 1024)
        self.start(success=False)

    def test_unknown_nested_and_undeclared_model_assets_fail_startup(self):
        for name in ['bad.exe', '.hidden.js', 'car.glb', 'bad%20.js']:
            path = self.root / name; path.write_bytes(b'x')
            self.start(success=False); path.unlink()
        (self.root / 'nested').mkdir(); self.start(self.policy, success=False)

    def test_malformed_or_unbounded_policy_fails_closed(self):
        for policy in [True, {}, dict(self.policy, schemaVersion=True), dict(self.policy, schemaVersion=1.0),
                       dict(self.policy, maxAssetBytes=-1), dict(self.policy, maxAssetBytes=67_108_865),
                       dict(self.policy, maxTotalBytes=268_435_457), dict(self.policy, maxApkBytes=100_000_001),
                       dict(self.policy, maxTotalBytes=1024), dict(self.policy, unknown=1)]:
            self.start(policy, success=False)


if __name__ == '__main__':
    unittest.main(verbosity=2)
