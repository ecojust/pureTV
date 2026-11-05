#!/usr/bin/env python3
"""Normalize external app logos without changing their drawing or APK assets.

By default this only reports proposed changes. --write updates logo.svg and its
existing SHA256SUMS.txt entry. Unsupported drawing features require manual work;
this tool never silently removes them or replaces their colors.
"""
import argparse
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
TAGS = {'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'}
ATTRS = set('viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points fill stroke stroke-width stroke-linecap stroke-linejoin fill-rule clip-rule opacity fill-opacity stroke-opacity transform color'.split())
NUMBER = r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'


def local(tag):
    return tag.removeprefix('{' + NS + '}')


def decimal_text(value):
    return format(value, 'f').rstrip('0').rstrip('.') if '.' in format(value, 'f') else str(value)


def compact_circle(element):
    """Replace only an exact isolated full circle described by two half arcs."""
    if local(element.tag) != 'path':
        return False
    tokens = re.findall('[A-Za-z]|' + NUMBER, element.get('d', ''))
    if len(tokens) != 20 or [tokens[i] for i in (0, 3, 11, 19)] != ['M', 'A', 'A', 'Z']:
        return False
    try:
        n = {i: Decimal(token) for i, token in enumerate(tokens) if i not in (0, 3, 11, 19)}
    except ArithmeticError:
        return False
    if not (n[4] > 0 and n[4] == n[5] == n[12] == n[13]
            and all(n[i] == 0 for i in (6, 8, 14, 16))
            and n[7] == n[15] == 1 and n[1] == n[17]
            and n[2] == n[10] == n[18] and n[9] - n[1] == 2 * n[4]):
        return False
    element.tag = '{' + NS + '}circle'
    del element.attrib['d']
    element.set('cx', decimal_text(n[1] + n[4]))
    element.set('cy', decimal_text(n[2]))
    element.set('r', decimal_text(n[4]))
    return True


def normalize(data):
    if re.search(rb'<!DOCTYPE|<!ENTITY', data, re.I):
        raise ValueError('document declarations require manual review')
    root = ET.fromstring(data)
    if root.tag != '{' + NS + '}svg':
        raise ValueError('nonstandard SVG root or namespace')
    changed = []
    metadata = []
    for element in root.iter():
        tag = local(element.tag)
        if tag in ('title', 'desc'):
            if list(element):
                raise ValueError('nested description content')
            metadata.append(element)
        elif tag not in TAGS:
            raise ValueError('drawing element ' + tag)
        for key, value in element.attrib.items():
            description_attribute = tag in ('title', 'desc') and key == 'id'
            if key not in ATTRS and key != 'role' and not re.fullmatch(r'aria-[a-z][a-z0-9-]*', key) and not description_attribute:
                raise ValueError('drawing attribute ' + key)
            if key in ATTRS and re.search(r'url|javascript:|http:|https:|data:|@import|[<>]', value, re.I):
                raise ValueError('resource reference in ' + key)
    for parent in root.iter():
        for element in list(parent):
            if element in metadata:
                parent.remove(element)
    stripped = bool(metadata)
    for element in root.iter():
        for key in list(element.attrib):
            if key == 'role' or key.startswith('aria-'):
                del element.attrib[key]
                stripped = True
    if stripped:
        changed.append('remove nonvisual accessibility metadata')
    dimensions = [root.get(key) for key in ('width', 'height', 'viewBox')]
    if dimensions != ['64', '64', '0 0 64 64']:
        parts = re.split(r'[ ,]+', root.get('viewBox', '').strip())
        if len(parts) != 4:
            raise ValueError('missing or malformed viewBox')
        x, y, width, height = map(Decimal, parts)
        if x != 0 or y != 0 or width <= 0 or width != height:
            raise ValueError('non-square or shifted viewBox requires review')
        if width != 64:
            group = ET.Element('{' + NS + '}g', {'transform': 'scale(' + format(64 / float(width), '.17g') + ')'})
            group.extend(list(root))
            for element in list(root):
                root.remove(element)
            root.append(group)
            changed.append('scale original ' + str(width) + ' square geometry into 64px viewBox')
        else:
            changed.append('declare 64px intrinsic dimensions')
        root.set('width', '64')
        root.set('height', '64')
        root.set('viewBox', '0 0 64 64')
    if len(data) > 8192:
        circles = sum(compact_circle(element) for element in root.iter())
        for element in root.iter():
            if 'd' in element.attrib:
                element.set('d', re.sub(r'\s*([A-Za-z])\s*', r'\1', element.get('d')))
        changed.append(f'losslessly compact path command spacing and {circles} exact two-arc circles')
    if not changed:
        return data, []
    for element in root.iter():
        if element.text is not None and not element.text.strip():
            element.text = None
        if element.tail is not None and not element.tail.strip():
            element.tail = None
    result = ET.tostring(root, encoding='utf-8', short_empty_elements=True).replace(b' />', b'/>') + b'\n'
    if len(result) > 8192:
        raise ValueError(f'still over 8KiB after lossless normalization ({len(result)} bytes)')
    return result, changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    rows = []
    manual = []
    for path in sorted((ROOT / 'resource/apps').glob('*/logo.svg')):
        before = path.read_bytes()
        try:
            after, methods = normalize(before)
        except ValueError as error:
            manual.append({'id': path.parent.name, 'reason': str(error)})
            continue
        if before == after:
            continue
        before_hash = hashlib.sha256(before).hexdigest()
        after_hash = hashlib.sha256(after).hexdigest()
        checksum = path.parent / 'SHA256SUMS.txt'
        old_sums = checksum.read_text()
        lines = old_sums.splitlines(keepends=True)
        matches = [i for i, line in enumerate(lines) if re.fullmatch(r'[a-f0-9]{64}  logo\.svg\n?', line)]
        if len(matches) != 1 or not lines[matches[0]].startswith(before_hash + '  '):
            raise ValueError(f'{checksum}: existing logo checksum does not match')
        if args.write:
            lines[matches[0]] = after_hash + '  logo.svg\n'
            path.write_bytes(after)
            checksum.write_text(''.join(lines))
        rows.append({'id': path.parent.name, 'beforeSha256': before_hash, 'afterSha256': after_hash,
                     'beforeBytes': len(before), 'afterBytes': len(after), 'methods': methods})
    report = {'written': args.write, 'normalized': rows, 'manualReview': manual}
    if args.report:
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'written': args.write, 'normalized': len(rows), 'manualReview': manual}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
