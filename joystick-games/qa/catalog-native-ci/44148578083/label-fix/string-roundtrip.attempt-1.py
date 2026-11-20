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
            assert labels == ["application-label:'" + name + "'"], {'expected': name, 'actual': labels}
            results.append({'name': name, 'decodedLabel': labels[0], 'status': 'passed'})
    print(json.dumps({'status': 'passed', 'scope': 'Real aapt2 compile/link and aapt decoded labels',
                      'cases': results}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
