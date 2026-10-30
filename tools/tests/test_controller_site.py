"""The public controller site must preserve release assets and copy no other files."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


TOOLS = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('controller_site', TOOLS / 'build-controller-site.py')
site = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(site)
HTML = (b'<!doctype html><html><head><link rel="icon" href="data:,">'
        b'<link rel="stylesheet" href="controller.css"></head><body>'
        b'<script src="secure-controller.js"></script><script src="steering.js"></script>'
        b'<script src="controller.js"></script></body></html>')


class ControllerSiteTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='controller-site-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repo'
        self.root.mkdir()
        self.output = Path(self.temp.name) / 'site'
        self.git('init', '-q')
        self.git('config', 'user.name', 'Controller Site Test')
        self.git('config', 'user.email', 'controller-site@example.invalid')
        self.write_version('0.1.1')
        self.commit()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, stderr=subprocess.PIPE)

    def write_version(self, version, marker='first'):
        app = self.root / site.APP
        assets = self.root / site.ASSETS
        assets.mkdir(parents=True, exist_ok=True)
        (app / 'build.gradle').write_text("android {\n versionName '" + version + "'\n}\n")
        for name in site.FILES:
            (assets / name).write_bytes(HTML if name == 'controller.html' else
                                       b'body{color:#fff}' if name.endswith('.css') else
                                       ('/* ' + marker + ' ' + name + ' */\n').encode())
        (assets / 'secure-controller.js').write_text(
            "var ORIGIN='https://ecojust.github.io';\nvar VERSION='" + version + "',"
            "PATH='/pureTV/controller/used-car/'+VERSION+'/';\nvar PAGE=ORIGIN+PATH;\n"
            "var secureChild=location.origin===ORIGIN&&location.pathname===PATH;\n"
            '/* ' + marker + ' */\n')

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')
        return self.git('rev-parse', 'HEAD').decode().strip()

    def test_current_exact_assets_and_allowlist_exclude_other_files(self):
        assets = self.root / site.ASSETS
        (assets / 'private-password.txt').write_text('not-for-pages')
        (self.root / site.APP / 'secret.jks').write_bytes(b'private-key')
        (self.root / site.APP / 'game.apk').write_bytes(b'apk-not-for-pages')
        manifest = site.build_site(self.root, self.output)
        self.assertEqual([v['version'] for v in manifest['versions']], ['0.1.1'])
        release = manifest['versions'][0]
        self.assertFalse(release['workingTreeModified'])
        expected = {'index.html', '404.html', '.nojekyll', 'manifest.json'}
        for entry in release['assets']:
            expected.add(entry['path'])
            data = (self.output / entry['path']).read_bytes()
            self.assertEqual(data, (self.root / entry['source']).read_bytes())
            self.assertEqual(hashlib.sha256(data).hexdigest(), entry['sha256'])
        actual = {p.relative_to(self.output).as_posix() for p in self.output.rglob('*') if p.is_file()}
        self.assertEqual(actual, expected)
        self.assertEqual(json.loads((self.output / 'manifest.json').read_text()), manifest)
        self.assertNotIn(b'script', (self.output / '404.html').read_bytes())

    def test_preserves_old_tag_and_adds_current_without_rewriting_old_client(self):
        old_commit = self.git('rev-parse', 'HEAD').decode().strip()
        self.git('tag', '-a', 'android-used-car-v0.1.1', '-m', 'release')
        old_js = (self.root / site.ASSETS / 'controller.js').read_bytes()
        self.write_version('0.1.2', 'new-controller')
        self.commit()
        manifest = site.build_site(self.root, self.output)
        self.assertEqual([v['version'] for v in manifest['versions']], ['0.1.1', '0.1.2'])
        self.assertEqual(manifest['versions'][0]['sourceCommit'], old_commit)
        self.assertEqual((self.output / 'controller/used-car/0.1.1/controller.js').read_bytes(), old_js)
        self.assertNotEqual((self.output / 'controller/used-car/0.1.2/controller.js').read_bytes(), old_js)

    def test_legacy_without_bridge_is_skipped(self):
        self.write_version('0.1.0')
        (self.root / site.ASSETS / 'secure-controller.js').unlink()
        self.commit()
        self.git('tag', 'android-used-car-v0.1.0')
        self.write_version('0.1.1')
        self.commit()
        manifest = site.build_site(self.root, self.output)
        self.assertEqual([v['version'] for v in manifest['versions']], ['0.1.1'])

    def test_published_version_collision_fails_before_writing(self):
        self.git('tag', 'android-used-car-v0.1.1')
        (self.root / site.ASSETS / 'controller.js').write_bytes(b'changed\n')
        with self.assertRaisesRegex(ValueError, 'version collision'):
            site.build_site(self.root, self.output)
        self.assertFalse(self.output.exists())

    def test_adding_bridge_to_already_published_legacy_version_requires_bump(self):
        (self.root / site.ASSETS / 'secure-controller.js').unlink()
        self.commit()
        self.git('tag', 'android-used-car-v0.1.1')
        self.write_version('0.1.1')
        with self.assertRaisesRegex(ValueError, 'version collision'):
            site.build_site(self.root, self.output)
        self.assertFalse(self.output.exists())

    def test_identical_published_version_uses_release_provenance(self):
        original = self.git('rev-parse', 'HEAD').decode().strip()
        self.git('tag', 'android-used-car-v0.1.1')
        (self.root / 'README.md').write_text('metadata-only update\n')
        self.commit()
        manifest = site.build_site(self.root, self.output)
        self.assertEqual(len(manifest['versions']), 1)
        self.assertEqual(manifest['versions'][0]['sourceCommit'], original)
        self.assertEqual(manifest['versions'][0]['sourceTag'], 'android-used-car-v0.1.1')

    def test_rejects_absolute_remote_and_traversal_asset_urls(self):
        for target in ('/controller.js', 'https://example.com/controller.js', '../controller.js', '//example.com/controller.js'):
            with self.subTest(target=target):
                path = self.root / site.ASSETS / 'controller.html'
                path.write_bytes(HTML.replace(b'src="controller.js"', ('src="' + target + '"').encode()))
                with self.assertRaisesRegex(ValueError, 'relative filenames'):
                    site.build_site(self.root, self.output)
                self.assertFalse(self.output.exists())

    def test_rejects_partial_tag_symlink_and_existing_output_contents(self):
        path = self.root / site.ASSETS / 'steering.js'
        path.unlink()
        self.commit()
        self.git('tag', 'android-used-car-v0.1.1')
        self.write_version('0.1.2')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'missing controller source'):
            site.build_site(self.root, self.output)
        self.git('tag', '-d', 'android-used-car-v0.1.1')
        path.unlink()
        path.symlink_to('controller.js')
        with self.assertRaisesRegex(ValueError, 'symlinks'):
            site.build_site(self.root, self.output)
        path.unlink()
        path.write_bytes(b'/* restored */')
        self.output.mkdir()
        (self.output / 'private.txt').write_text('must-not-be-deployed')
        with self.assertRaisesRegex(ValueError, 'new or empty'):
            site.build_site(self.root, self.output)

    def test_modified_checkout_is_marked_in_manifest(self):
        (self.root / site.ASSETS / 'controller.js').write_bytes(b'/* local-change */')
        manifest = site.build_site(self.root, self.output)
        self.assertTrue(manifest['versions'][0]['workingTreeModified'])

    def test_application_only_version_bump_rejects_stale_bridge(self):
        (self.root / site.APP / 'build.gradle').write_text("android {\n versionName '0.1.2'\n}\n")
        with self.assertRaisesRegex(ValueError, 'Secure controller version must match'):
            site.build_site(self.root, self.output)
        self.assertFalse(self.output.exists())

    def test_correct_constant_cannot_hide_stale_target_or_child_path(self):
        path = self.root / site.ASSETS / 'secure-controller.js'
        original = path.read_text()
        for changed in (original.replace('var PAGE=ORIGIN+PATH;', "var PAGE=ORIGIN+'/pureTV/controller/used-car/0.1.0/';"),
                        original.replace('location.pathname===PATH', "location.pathname==='/pureTV/controller/used-car/0.1.0/'")):
            with self.subTest(source=changed):
                path.write_text(changed)
                with self.assertRaisesRegex(ValueError, 'must share the versioned PATH'):
                    site.build_site(self.root, self.output)
                self.assertFalse(self.output.exists())

    def test_historic_release_bridge_version_is_also_validated(self):
        path = self.root / site.ASSETS / 'secure-controller.js'
        path.write_text(path.read_text().replace("VERSION='0.1.1'", "VERSION='0.1.0'"))
        self.commit()
        self.git('tag', 'android-used-car-v0.1.1')
        self.write_version('0.1.2')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'Secure controller version must match'):
            site.build_site(self.root, self.output)
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
