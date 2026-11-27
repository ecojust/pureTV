"""Controller-driven gameplay checks for adapted games."""
import importlib.util
from pathlib import Path
import time


GAMES = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('qa_plan', GAMES / 'tools' / 'qa-plan.py')
qa_plan = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa_plan)

# Stop after a verified gameplay action. Later steps may require simultaneous inputs.
LAST_STEP = {
    'claude-of-tanks': '转动车身',
    'openaero-dfw': '切换襟翼挡位',
    'turbo-kart-rally': 'Accelerate in the original physics simulation',
    'clawd-pop': 'Fire the cannon',
    'operation-ironhold': 'Change loadout',
}


def observed_fields(snapshot, expectations):
    observations = {}
    for expectation in expectations:
        path = expectation['path']
        try:
            observations[path] = qa_plan.read_path(snapshot, path)
        except ValueError:
            observations[path] = None
    return observations


def run_plan(slug, touch, snapshot):
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
                    raise AssertionError(f'{step["name"]}: expected {checks}, observed {observed_fields(current, checks)}')
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
            'before': observed_fields(before, checks), 'after': observed_fields(result, checks),
        })
        if step['name'] == last:
            return {'plan': f'joystick-games/{slug}/qa-plan.json', 'steps': steps}

    raise ValueError(f'Unrecognized final gameplay step for {slug}: {last}')


def run_gameplay(slug, tv, touch, snapshot):
    """Exercise the normal start and a game-specific action on the connected controller."""
    if slug in LAST_STEP:
        return run_plan(slug, touch, snapshot)

    steps = []

    def observe(label, predicate, fields, timeout=60):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            state = snapshot()
            game = state['gameplay']
            if predicate(state, game):
                steps.append({'action': label, 'stage': state['stage'],
                              **{field: game.get(field) for field in fields}})
                return game
            time.sleep(.15)
        observed = {field: game.get(field) for field in fields}
        raise AssertionError(f'{slug}: timed out at {label}: {state["stage"]}, {observed}')

    if slug == 'kart-royale':
        fields = ['menu', 'focus', 'circuit', 'phase', 'speed', 'position']
        observe('Title screen', lambda s, g: g['menu'] == 'title', fields)
        touch('A')
        observe('A opens the roster', lambda s, g: g['menu'] == 'select', fields)
        touch('A')
        grid = observe('A starts the race and the countdown finishes',
                       lambda s, g: g['phase'] == 'racing', fields, timeout=360)
        touch('UP', while_held=lambda: observe(
            'Hold the stick forward to drive off the grid',
            lambda s, g: g['speed'] > 1 and g['position'] != grid['position'], fields,
            timeout=90))
        touch('START')
        observe('START pauses the race', lambda s, g: s['paused'], fields)
    elif slug == 'saber-magic-tower':
        fields = ['overlay', 'floor', 'steps', 'position', 'mode', 'kills', 'duelHealth']
        observe('Tower entrance menu', lambda s, g: g['overlay'] == 'title', fields)
        touch('A')
        observe('A enters the first floor', lambda s, g: s['stage'] == 'playing'
                and g['floor'] == 1 and g['position'] == [1, 9], fields)
        touch('RIGHT', while_held=lambda: observe(
            'Follow the entrance corridor to its east wall',
            lambda s, g: g['position'] == [3, 9] and g['steps'] >= 2, fields))
        touch('UP', while_held=lambda: observe(
            'Approach the guardian and enter a duel',
            lambda s, g: g['mode'] == 'duel' and g['duelHealth'] > 0, fields))
        touch('A', while_held=lambda: observe(
            'Hold A to strike and defeat the guardian',
            lambda s, g: g['kills'] >= 1 and g['mode'] == 'explore', fields))
    elif slug == 'lumenrift':
        fields = ['realm', 'toolbar', 'placing', 'buildings', 'wave', 'money', 'phase']
        observe('Campaign menu', lambda s, g: s['stage'] == 'menu', fields)
        touch('START')
        start = observe('START enters the campaign', lambda s, g: s['stage'] == 'playing', fields)
        touch('X')
        observe('X opens the build bar', lambda s, g: g['toolbar'], fields)
        touch('A')
        observe('A selects a wall', lambda s, g: g['placing'] == 'wall', fields)
        touch('A')
        observe('A builds the wall', lambda s, g: g['buildings'] == start['buildings'] + 1
                and g['money'] < start['money'], fields)
        touch('Y')
        observe('Y calls the first wave', lambda s, g: g['wave'] > start['wave'], fields)
    else:
        raise ValueError(f'Unrecognized game: {slug}')
    return {'steps': steps}
