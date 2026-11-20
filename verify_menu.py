"""Run the published controller verifier once its first Clawd Pop menu has rendered."""
import os
from pathlib import Path
import sys

project = Path(os.environ['GITHUB_WORKSPACE']) / 'project'
sys.path.insert(0, str(project / 'joystick-games/qa/controller-input'))
import pc

original_wait = pc.wait_for
def wait_for_menu(page, predicate, timeout):
    if '.pollCount > 2' in predicate:
        original_wait(page, f"() => {{ const s={pc.SNAPSHOT}; return ['menu','error'].includes(s?.stage) || s?.webglError; }}", timeout)
    return original_wait(page, predicate, timeout)

pc.wait_for = wait_for_menu
sys.exit(pc.main())
