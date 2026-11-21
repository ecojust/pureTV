"""Gameplay checks driven by the connected controller. Snapshots are read-only."""
from time import monotonic, sleep


def run_gameplay(slug, tv, touch, snapshot):
    """Exercise the normal start and a game-specific action on the connected controller."""
    steps = []

    def observe(label, predicate, fields, timeout=60):
        deadline = monotonic() + timeout
        while monotonic() < deadline:
            state = snapshot()
            game = state['gameplay']
            if predicate(state, game):
                steps.append({'action': label, 'stage': state['stage'],
                              **{field: game.get(field) for field in fields}})
                return game
            sleep(.15)
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
        raise ValueError(f'Unrecognized phone gameplay route: {slug}')
    return {'steps': steps}
