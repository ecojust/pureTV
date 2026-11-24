"""Find the Android app modules and game artwork needed by the launcher Gradle build."""
import json
import posixpath
import re
from pathlib import PurePosixPath


def launcher_projects(git, commit):
    settings = git('show', commit + ':resource/launcher/puretv/settings.gradle').decode()
    assigned = re.findall(r"project\('(:[^']+)'\)\.projectDir\s*=\s*file\('([^']+)'\)", settings)
    assert {name for name, _ in assigned} | {':app'} == set(re.findall(r"include\s+'(:[^']+)'", settings))
    modules = []
    for name, relative in assigned:
        path = posixpath.normpath('resource/launcher/puretv/' + relative)
        slug = name.removeprefix(':')
        assert re.fullmatch('[a-z0-9-]+', slug) and path in ('resource/apps/' + slug, 'joystick-games/' + slug)
        modules.append(path)
    games = [path for path in modules if path.startswith('joystick-games/')]
    shared = []
    if games:
        shared = ['resource/game-kit/legacy-controller-native/integration.gradle',
                  'resource/game-kit/legacy-controller-native/src/main/java',
                  'resource/game-kit/android/src/main/java', 'tools/game_icons.py',
                  'tools/game-icon-sources.json', 'tools/game-icon-crops.json']
        sources = json.loads(git('show', commit + ':tools/game-icon-sources.json'))
        for game in games:
            image = sources.get(game, game + '/thumb.png')
            path = PurePosixPath(image)
            assert not path.is_absolute() and '..' not in path.parts and path.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')
            shared.append(image)
    return modules, shared
