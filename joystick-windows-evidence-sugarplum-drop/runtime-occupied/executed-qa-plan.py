#!/usr/bin/env python3
"""Data-only native QA plans. No expressions, script evaluation or model writes."""
import json
import math
import re
from pathlib import Path

KEYS = frozenset(['UP', 'DOWN', 'LEFT', 'RIGHT', 'START', 'A', 'B', 'X', 'Y'])
OPERATORS = frozenset(['eq', 'gt', 'lt', 'gte', 'lte', 'changed', 'increased'])
PATH = re.compile(r'(?:stage|paused|frames|gameplay(?:\.[A-Za-z_][A-Za-z0-9_]*|\.[0-9]+)+)\Z')


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)


def read_path(snapshot, path):
    """Missing observations fail closed, including comparisons against null."""
    assert isinstance(path, str) and PATH.fullmatch(path), 'Unsupported observation path: ' + str(path)
    current = snapshot
    for component in path.split('.'):
        if isinstance(current, dict):
            if component not in current:
                raise ValueError('Missing observation: ' + path)
            current = current[component]
        elif isinstance(current, list) and component.isdecimal() and int(component) < len(current):
            current = current[int(component)]
        else:
            raise ValueError('Missing observation: ' + path)
    if current is None:
        raise ValueError('Null observation: ' + path)
    return current


def accepted_renderers(plan):
    primary = plan['renderer']
    assert primary in ['canvas2d', 'webgl1', 'webgl2', 'dom'], 'Unknown renderer'
    if 'compatibleRenderers' not in plan:
        return [primary]
    renderers = plan['compatibleRenderers']
    assert isinstance(renderers, list) and renderers and len(renderers) == len(set(renderers))
    assert primary in renderers and set(renderers) <= {'webgl1', 'webgl2'}, 'Only actual WebGL version fallback is supported'
    return list(renderers)


def validate_plan(plan):
    assert isinstance(plan, dict) and plan.get('schemaVersion') == 1
    accepted_renderers(plan)
    if 'storageRestartRequired' in plan:assert type(plan['storageRestartRequired']) is bool
    stable = plan.get('pauseStablePaths')
    assert isinstance(stable, list) and stable and len(set(stable)) == len(stable), 'Explicit pauseStablePaths required'
    assert all(isinstance(path, str) and PATH.fullmatch(path) and path.startswith('gameplay.') for path in stable)
    steps = plan.get('steps')
    assert isinstance(steps, list) and steps and len(steps) <= 100
    meaningful = False
    for step in steps:
        assert isinstance(step, dict) and isinstance(step.get('name'), str) and step['name'].strip()
        keys = step.get('keys')
        assert isinstance(keys, list) and keys and len(keys) == len(set(keys)) and set(keys) <= KEYS
        assert type(step.get('holdMs')) is int and 16 <= step['holdMs'] <= 10000
        assert numeric(step.get('timeoutSeconds', 15)) and 0 < step.get('timeoutSeconds', 15) <= 240
        expectations = step.get('expect')
        assert isinstance(expectations, list) and expectations
        for item in expectations:
            assert isinstance(item, dict) and isinstance(item.get('path'), str) and PATH.fullmatch(item['path'])
            assert item.get('op') in OPERATORS
            op = item['op']
            if op not in ['changed', 'increased']:
                assert 'value' in item and item['value'] is not None
            if op in ['gt', 'lt', 'gte', 'lte']:
                assert numeric(item['value']), 'Ordered expectation must be finite number'
            clock_fields = {'time', 'tick', 'ticks', 't', 'frame', 'frames', 'tickcount', 'framecount', 'elapsed', 'elapsedtime', 'elapsedseconds', 'elapsedms', 'duration'}
            core_path = item['path'].startswith('gameplay.') and not any(part.lower() in clock_fields for part in item['path'].split('.')[1:])
            if core_path and op in ['changed', 'increased'] and any(key != 'START' for key in keys):
                meaningful = True
    assert meaningful, 'A gameplay plan must observe a non-clock model change after an actual action key'
    return plan


def load_plan(path):
    return validate_plan(json.loads(Path(path).read_text()))


def matches(expectations, snapshot, before):
    for item in expectations:
        try:
            value = read_path(snapshot, item['path'])
            op = item['op']
            expected = read_path(before, item['path']) if op in ['changed', 'increased'] else item['value']
        except (ValueError, KeyError, TypeError, AssertionError):
            return False
        if op in ['gt', 'lt', 'gte', 'lte', 'increased'] and not (numeric(value) and numeric(expected)):
            return False
        if op == 'eq' and (type(value) is not type(expected) or value != expected):
            return False
        if op == 'changed' and value == expected:
            return False
        if op in ['gt', 'increased'] and not value > expected:
            return False
        if op == 'lt' and not value < expected:
            return False
        if op == 'gte' and not value >= expected:
            return False
        if op == 'lte' and not value <= expected:
            return False
    return True
