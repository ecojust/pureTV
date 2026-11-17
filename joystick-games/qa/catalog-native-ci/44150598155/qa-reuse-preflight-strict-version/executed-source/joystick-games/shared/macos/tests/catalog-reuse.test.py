#!/usr/bin/env python3
"""Reject stale build artifacts and committed production changes during QA reuse."""
import copy
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[4]
spec = importlib.util.spec_from_file_location('catalog_reuse', ROOT / 'joystick-games/tools/macos-catalog-reuse.py')
reuse = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reuse)


class CatalogReuse(unittest.TestCase):
    def run_fixture(self):
        source = 'a' * 40
        run = {'id': 123, 'head_sha': source, 'run_attempt': 1, 'path': reuse.WORKFLOW, 'event': 'workflow_dispatch',
               'repository': {'full_name': reuse.REPO}, 'head_repository': {'full_name': reuse.REPO},
               'status': 'completed', 'conclusion': 'cancelled'}
        jobs = [{'id': 1, 'name': 'plan', 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-17T01:00:00Z', 'completed_at': '2026-11-17T01:01:00Z'},
                {'id': 2, 'name': 'build (sample-01, sample)', 'status': 'completed', 'conclusion': 'success', 'started_at': '2026-11-17T01:02:00Z', 'completed_at': '2026-11-17T01:03:00Z'}]
        names = ['joystick-catalog-macos-plan', 'joystick-catalog-macos-packages-sample-01', 'joystick-catalog-macos-build-sample-01']
        artifacts = [{'id': 100 + index, 'name': name, 'expired': False, 'workflow_run': {'id': 123, 'head_sha': source},
                      'created_at': '2026-11-17T01:00:30Z' if index == 0 else '2026-11-17T01:02:30Z'} for index, name in enumerate(names)]
        return source, run, jobs, artifacts, [{'batch': 'sample-01', 'games': ['sample']}]

    def test_only_successful_builds_allow_cancelled_run_reuse(self):
        source, run, jobs, artifacts, batches = self.run_fixture()
        plan_id, selected = reuse.validate_run(run, jobs, artifacts, source, 123, 1, batches)
        self.assertEqual(plan_id, 100)
        self.assertEqual(selected[0]['packageArtifactId'], 101)
        for conclusion in ['failure', 'cancelled', 'skipped']:
            bad = copy.deepcopy(jobs)
            bad[1]['conclusion'] = conclusion
            with self.assertRaises(AssertionError):
                reuse.validate_run(run, bad, artifacts, source, 123, 1, batches)

    def test_exact_source_attempt_artifact_identity_and_time_are_required(self):
        source, run, jobs, artifacts, batches = self.run_fixture()
        for field, value in [('head_sha', 'b' * 40), ('run_attempt', 2), ('path', 'unrelated.yml'), ('event', 'pull_request')]:
            bad = dict(run, **{field: value})
            with self.assertRaises(AssertionError):
                reuse.validate_run(bad, jobs, artifacts, source, 123, 1, batches)
        for mutate in ['expired', 'source', 'time', 'duplicate', 'missing']:
            bad = copy.deepcopy(artifacts)
            if mutate == 'expired': bad[1]['expired'] = True
            if mutate == 'source': bad[1]['workflow_run']['head_sha'] = 'b' * 40
            if mutate == 'time': bad[1]['created_at'] = '2026-11-17T00:59:00Z'
            if mutate == 'duplicate': bad.append(copy.deepcopy(bad[1]))
            if mutate == 'missing': bad.pop(1)
            with self.subTest(mutation=mutate), self.assertRaises(AssertionError):
                reuse.validate_run(run, jobs, bad, source, 123, 1, batches)

    def test_committed_qa_only_changes_reuse_but_complete_production_changes_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory).resolve()
            frozen = base / 'original'
            frozen.mkdir()
            registry = {'schemaVersion': 1, 'games': {'sample': {'packageName': 'com.example.sample', 'appName': 'Sample', 'executable': 'Sample', 'initials': 'S'}}, 'batches': {'sample-01': ['sample']}}
            names = ['joystick-games/shared/macos/Sources/main.swift', 'joystick-games/shared/macos/tests/example.test.py',
                     'joystick-games/shared/web/input.js', 'joystick-games/sample/src/main.js', 'joystick-games/sample/dist/tv.html',
                     'joystick-games/sample/game.json', 'joystick-games/sample/qa-plan.json', 'puretv-joystick/joystick_sdk.py',
                     'joystick-games/tools/qa-plan.py', 'joystick-games/tools/macos-verify.py', 'joystick-games/tools/macos-packages.py',
                     '.github/workflows/joystick-games-macos.yml', '.github/workflows/joystick-catalog-macos.yml']
            for name in names:
                path = frozen / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(name + '\n')
            (frozen / 'joystick-games/catalog-registry.json').write_text(json.dumps(registry))
            shutil.copy2(ROOT / 'joystick-games/tools/macos-build.py', frozen / 'joystick-games/tools/macos-build.py')
            def git(root, *args):
                return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.DEVNULL, text=True).strip()
            def commit(root, message):
                git(root, 'add', '.')
                git(root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', message)
                return git(root, 'rev-parse', 'HEAD')
            git(frozen, 'init', '-q')
            source = commit(frozen, 'original')
            builder = reuse.module('fixture_original_builder', frozen / 'joystick-games/tools/macos-build.py')
            meta = {'game': 'sample', 'sourceCommit': source, 'committedInputsVerified': True,
                    'bundleIdentifier': 'com.example.sample', 'appName': 'Sample.app',
                    'inputFiles': builder.inputs(frozen / 'joystick-games/sample')}
            current = base / 'qa'
            shutil.copytree(frozen, current)
            (current / 'joystick-games/tools/macos-verify.py').write_text('corrected read-only QA\n')
            (current / 'joystick-games/tools/macos-catalog-reuse.py').write_text('new read-only package audit\n')
            (current / '.github/workflows/joystick-catalog-macos-runtime.yml').write_text('reuse original package\n')
            (current / 'joystick-games/shared/macos/tests/example.test.py').write_text('QA regression\n')
            qa_source = commit(current, 'QA only')
            env = {'ARTIFACT_SOURCE_COMMIT': source, 'ARTIFACT_SOURCE_RUN': '123', 'ARTIFACT_SOURCE_ATTEMPT': '1', 'GITHUB_SHA': qa_source}
            with patch.dict(os.environ, env):
                verified = reuse.verify_source(meta, frozen, current)
                self.assertTrue(verified['originalPackageBytesReused'])
                self.assertEqual(len(verified['changedQaFiles']), 4)
            for name in ['joystick-games/sample/src/main.js', 'joystick-games/shared/macos/Sources/main.swift',
                         'puretv-joystick/joystick_sdk.py', 'joystick-games/sample/game.json',
                         'joystick-games/sample/dist/injected.js']:
                changed = base / ('mutation-' + str(len(list(base.iterdir()))))
                shutil.copytree(current, changed)
                (changed / name).write_text('committed production mutation\n')
                mutation_sha = commit(changed, 'production changed')
                with self.subTest(path=name), patch.dict(os.environ, dict(env, GITHUB_SHA=mutation_sha)), self.assertRaises(AssertionError):
                    reuse.verify_source(meta, frozen, changed)
            bad = copy.deepcopy(meta)
            bad['inputFiles'].pop('joystick-games/sample/dist/tv.html')
            with patch.dict(os.environ, env), self.assertRaises(AssertionError):
                reuse.verify_source(bad, frozen, current)


if __name__ == '__main__':
    unittest.main()
