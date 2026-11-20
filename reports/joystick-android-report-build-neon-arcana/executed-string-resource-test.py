#!/usr/bin/env python3
"""Round-trip app names through real Android resource compilation and linking."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('gamekit_build', HERE / 'build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sdk', type=Path, required=True)
    args = parser.parse_args()
    tools = args.sdk / 'build-tools/34.0.0'
    platform = args.sdk / 'platforms/android-35/android.jar'
    names = ["STARBLAZER '86", '运输船 CF', 'CF Transport Ship',
             'Say "go" & <play>', r'Literal\n\u0041\path',
             '@string/missing', '?attr/missing', '@null', '  Two  spaces  ']
    results = []
    with tempfile.TemporaryDirectory(prefix='gamekit-string-roundtrip-') as tmp:
        root = Path(tmp)
        manifest = root / 'AndroidManifest.xml'
        manifest.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" '
                            'package="com.ecojust.stringfixture"><application '
                            'android:label="@string/app_name"/></manifest>')
        for index, name in enumerate(names):
            folder = root / str(index)
            resources = folder / 'res/values'
            resources.mkdir(parents=True)
            tree = ET.Element('resources')
            ET.SubElement(tree, 'string', {'name': 'app_name'}).text = build.android_string_literal(name)
            ET.ElementTree(tree).write(resources / 'strings.xml', encoding='utf-8', xml_declaration=True)
            compiled = folder / 'resources.zip'
            apk = folder / 'resources.apk'
            subprocess.run([str(tools / 'aapt2'), 'compile', '--dir', str(folder / 'res'),
                            '-o', str(compiled)], check=True)
            subprocess.run([str(tools / 'aapt2'), 'link', '-I', str(platform),
                            '--manifest', str(manifest), '-o', str(apk), str(compiled)], check=True)
            dump = subprocess.check_output([str(tools / 'aapt'), 'dump', 'badging', str(apk)], text=True)
            labels = [line for line in dump.splitlines() if line.startswith('application-label:')]
            assert len(labels) == 1 and labels[0].startswith("application-label:'") and labels[0].endswith("'")
            # aapt badging escapes double quotes and backslashes inside its
            # single-quote delimiters. Decode that representation before comparison.
            decoded = json.loads('"' + labels[0][len("application-label:'"):-1] + '"')
            assert decoded == name, {'expected': name, 'actual': decoded, 'badging': labels[0]}
            results.append({'name': name, 'decodedLabel': decoded, 'badging': labels[0], 'status': 'passed'})
    sources = {name: {'bytes': (HERE / name).stat().st_size, 'sha256': build.digest(HERE / name)}
               for name in ('build.py', 'build-strings-test.py')}
    print(json.dumps({'status': 'passed', 'scope': 'Real aapt2 compile/link and aapt decoded labels',
                      'executedSources': sources,
                      'cases': results}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
