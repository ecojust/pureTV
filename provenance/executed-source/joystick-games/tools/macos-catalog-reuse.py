#!/usr/bin/env python3
"""Bind catalog QA to successful immutable builds without rebuilding an app."""
import argparse
import importlib.util
import json
import os
import re
import subprocess
from pathlib import Path

REPO = 'ecojust/pureTV'
WORKFLOW = '.github/workflows/joystick-catalog-macos.yml'
ROOT = Path(__file__).resolve().parents[2]
LEGACY = {'cf-transport-ship', 'qq-speed'}
QA_FILES = {
    'joystick-games/tools/macos-verify.py',
    'joystick-games/tools/macos-packages.py',
    'joystick-games/tools/macos-catalog-reuse.py',
    'joystick-games/tools/qa-plan.py',
    # Executed only by the CI verifier; never copied into the shipped .app.
    'joystick-games/shared/macos/tools/allow-local-network.py',
    '.github/workflows/joystick-catalog-macos-runtime.yml',
    '.github/workflows/joystick-catalog-macos-evidence.yml',
}


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


def git_head(directory):
    return subprocess.check_output(['git', '-C', str(directory), 'rev-parse', 'HEAD'], text=True).strip()


def qa_only(name, games):
    return name in QA_FILES or name.startswith('joystick-games/shared/macos/tests/') or name in {
        'joystick-games/' + game + '/qa-plan.json' for game in games
    }


def validate_run(run, jobs, artifacts, source, run_id, attempt, batches):
    assert re.fullmatch('[a-f0-9]{40}', source)
    assert run_id > 0 and attempt > 0
    assert run['id'] == run_id and run['head_sha'] == source and run['run_attempt'] == attempt
    assert run['path'] == WORKFLOW and run['event'] == 'workflow_dispatch'
    assert run['repository']['full_name'] == run['head_repository']['full_name'] == REPO
    # The overall run may be cancelled after successful build jobs. Reusing
    # those original bytes does not inherit any cancelled/failed runtime pass.
    def artifact(name, job=None):
        selected = [a for a in artifacts if a['name'] == name and not a['expired']]
        assert len(selected) == 1, 'Expected exactly one available artifact: ' + name
        value = selected[0]
        assert value['workflow_run']['id'] == run_id and value['workflow_run']['head_sha'] == source
        if job:
            assert job['started_at'] <= value['created_at'] <= job['completed_at'], 'Artifact is from a different job attempt'
        return value
    plan_jobs = [job for job in jobs if job['name'] == 'plan']
    assert len(plan_jobs) == 1 and plan_jobs[0]['status'] == 'completed' and plan_jobs[0]['conclusion'] == 'success'
    plan_artifact = artifact('joystick-catalog-macos-plan', plan_jobs[0])
    selected = []
    for batch in batches:
        name = batch['batch']
        matches = [job for job in jobs if job['name'].startswith('build (' + name + ',')]
        assert len(matches) == 1 and matches[0]['status'] == 'completed' and matches[0]['conclusion'] == 'success', 'Original build did not pass: ' + name
        job = matches[0]
        package_name = 'joystick-catalog-macos-packages-' + name
        build_name = 'joystick-catalog-macos-build-' + name
        package = artifact(package_name, job)
        build = artifact(build_name, job)
        selected.append(dict(batch, packageArtifactId=package['id'], packageArtifactName=package_name,
                             buildArtifactId=build['id'], buildArtifactName=build_name, originalBuildJobId=job['id']))
    return plan_artifact['id'], selected


def verify_source(meta, frozen, current):
    """Require original Git inputs and unchanged complete production inventories."""
    frozen = Path(frozen).resolve()
    current = Path(current).resolve()
    source = os.environ['ARTIFACT_SOURCE_COMMIT']
    run_id = os.environ['ARTIFACT_SOURCE_RUN']
    attempt = os.environ['ARTIFACT_SOURCE_ATTEMPT']
    qa_source = os.environ['GITHUB_SHA']
    assert re.fullmatch('[a-f0-9]{40}', source) and re.fullmatch('[a-f0-9]{40}', qa_source)
    assert re.fullmatch('[1-9][0-9]*', run_id) and re.fullmatch('[1-9][0-9]*', attempt)
    assert git_head(frozen) == source and git_head(current) == qa_source
    assert meta['sourceCommit'] == source and meta['committedInputsVerified'] is True
    game = meta['game']
    assert game not in LEGACY and re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*', game)
    original = module('original_catalog_builder', frozen / 'joystick-games/tools/macos-build.py')
    latest = module('current_catalog_builder', current / 'joystick-games/tools/macos-build.py')
    registry = original.registry_games()
    assert game in registry and latest.registry_games() == registry, 'Catalog identities changed'
    assert meta['bundleIdentifier'] == registry[game]['packageName'] and meta['appName'] == registry[game]['appName'] + '.app'
    before = original.inputs(frozen / 'joystick-games' / game)
    assert meta['inputFiles'] == before, 'Original package input set or bytes differ'
    original.verify_committed(frozen, before, source)
    after = latest.inputs(current / 'joystick-games' / game)
    latest.verify_committed(current, after, qa_source)
    old_production = {name: item for name, item in before.items() if not qa_only(name, registry)}
    new_production = {name: item for name, item in after.items() if not qa_only(name, registry)}
    assert old_production == new_production, 'Production files changed; build a new package instead'
    changed_qa = sorted(name for name in set(before) | set(after) if before.get(name) != after.get(name))
    assert all(qa_only(name, registry) for name in changed_qa)
    return {'artifactSourceCommit': source, 'artifactRunId': int(run_id), 'artifactRunAttempt': int(attempt),
            'qaSourceCommit': qa_source, 'productionInputFilesVerified': len(old_production),
            'changedQaFiles': changed_qa, 'originalPackageBytesReused': True}


def plan(args):
    frozen = args.artifact_source_checkout.resolve()
    assert git_head(frozen) == args.source_sha
    qa_source = git_head(ROOT)
    assert qa_source == os.environ['GITHUB_SHA']
    builder = module('plan_original_catalog_builder', frozen / 'joystick-games/tools/macos-build.py')
    registry = builder.registry_data((frozen / 'joystick-games/catalog-registry.json').read_text())
    builder.registry_games()
    selected = list(registry['batches']) if args.batches == 'all' else [item.strip() for item in args.batches.split(',')]
    assert selected and len(selected) == len(set(selected)) and all(name in registry['batches'] for name in selected)
    batches = [{'batch': name, 'games': registry['batches'][name]} for name in selected]
    games = [game for batch in batches for game in batch['games']]
    assert len(games) == len(set(games)) and not set(games) & LEGACY
    def api(path):
        return json.loads(subprocess.check_output(['gh', 'api', 'repos/' + REPO + '/' + path]))
    run = api('actions/runs/' + str(args.source_run))
    jobs = api(f'actions/runs/{args.source_run}/attempts/{args.source_attempt}/jobs?per_page=100')['jobs']
    artifacts = api(f'actions/runs/{args.source_run}/artifacts?per_page=100')['artifacts']
    plan_id, batches = validate_run(run, jobs, artifacts, args.source_sha, args.source_run, args.source_attempt, batches)
    provenance = {'schemaVersion': 1, 'artifactSourceCommit': args.source_sha, 'artifactRunId': args.source_run,
                  'artifactRunAttempt': args.source_attempt, 'qaSourceCommit': qa_source, 'repository': REPO,
                  'originalWorkflow': WORKFLOW, 'planArtifactId': plan_id, 'batches': batches, 'games': sorted(games),
                  'originalRunConclusion': run['conclusion'], 'originalRunStatus': run['status']}
    matrix = {'include': [{key: value for key, value in dict(batch, runner=runner).items() if key != 'originalBuildJobId'}
                          for batch in batches for runner in ['macos-latest', 'macos-15-intel']]}
    args.output.mkdir(parents=True, exist_ok=False)
    for name, value in [('source-provenance', provenance), ('matrix', matrix), ('original-run', run),
                        ('original-jobs', jobs), ('original-artifacts', artifacts)]:
        (args.output / (name + '.json')).write_text(json.dumps(value, indent=2) + '\n')
    print(json.dumps({'artifactSourceCommit': args.source_sha, 'qaSourceCommit': qa_source, 'games': len(games),
                      'planArtifactId': plan_id, 'matrix': matrix}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    command = commands.add_parser('plan')
    command.add_argument('--source-run', type=int, required=True)
    command.add_argument('--source-sha', required=True)
    command.add_argument('--source-attempt', type=int, required=True)
    command.add_argument('--batches', required=True)
    command.add_argument('--artifact-source-checkout', type=Path, required=True)
    command.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    plan(args)
