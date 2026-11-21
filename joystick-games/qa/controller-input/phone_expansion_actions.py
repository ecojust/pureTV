"""Exercise normal player actions on the phone using the games' checked-in QA plans."""
import importlib.util
from pathlib import Path
import time


GAMES = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('qa_plan', GAMES / 'tools' / 'qa-plan.py')
qa_plan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa_plan)

# Stop after a verified gameplay action. Later steps may require simultaneous inputs.
LAST_STEP = {
    'turbo-kart-rally': 'Accelerate in the original physics simulation',
    'clawd-pop': 'Fire the cannon',
    'operation-ironhold': 'Change loadout',
}


def observe(snapshot, expectations):
    observations = {}
    for expectation in expectations:
        path = expectation['path']
        try:
            observations[path] = qa_plan.read_path(snapshot, path)
        except ValueError:
            observations[path] = None
    return observations


def run_gameplay(slug, tv, touch, snapshot):
    plan = qa_plan.load_plan(GAMES / slug / 'qa-plan.json')
    last = LAST_STEP[slug]
    steps = []
    for step in plan['steps']:
        key, = step['keys']
        before = snapshot()
        checks = step['expect']
        print(f'{slug}: {step["name"]}', flush=True)

        def wait_for_result():
            deadline = time.monotonic() + step.get('timeoutSeconds', 30)
            while True:
                current = snapshot()
                if qa_plan.matches(checks, current, before):
                    return current
                if time.monotonic() >= deadline:
                    raise AssertionError(f'{step["name"]}: expected {checks}, observed {observe(current, checks)}')
                time.sleep(.15)

        result = {}
        if key == 'UP':
            # The kart's speed can drop again once the driver releases throttle.
            def while_held():
                result.update(wait_for_result())
            touch(key, step['holdMs'], while_held)
        else:
            touch(key, step['holdMs'])
            result = wait_for_result()
        steps.append({
            'step': step['name'], 'key': key, 'expect': checks,
            'before': observe(before, checks), 'after': observe(result, checks),
        })
        if step['name'] == last:
            return {'plan': f'joystick-games/{slug}/qa-plan.json', 'steps': steps}

    raise ValueError(f'Unrecognized final gameplay step for {slug}: {last}')
