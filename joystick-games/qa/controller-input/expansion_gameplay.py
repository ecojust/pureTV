"""Player actions for Kart Royale and the five November expansion titles."""
from phone_expansion_actions import LAST_STEP, run_gameplay as run_plan
from phone_gameplay_ksl import run_gameplay as run_route


def run_gameplay(slug, tv, touch, snapshot):
    if slug in LAST_STEP:
        return run_plan(slug, tv, touch, snapshot)
    return run_route(slug, tv, touch, snapshot)
