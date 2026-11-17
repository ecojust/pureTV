#!/usr/bin/env python3
"""Refresh public APK table versions and sizes from the files in resource/."""
import json,re
from pathlib import Path
from resource_catalog import child
root=Path(__file__).resolve().parents[1]
p=root/'README.md';text=p.read_text();start=text.index('<!-- resource-index:start -->');end=text.index('<!-- resource-index:end -->',start)
lines=text[start:end].splitlines();output=[];columns=0
for line in lines:
    if line.startswith('| 名称 |'):
        if 'APK 大小' not in line:line=line.replace('| 版本 |','| 版本 | APK 大小 |')
        columns=line.count('|')-1
    elif line.startswith('| ---') and columns:
        line='| '+' | '.join(['---']*columns)+' |'
    elif line.startswith('| ['):
        match=re.search(r'\]\((resource/[^)]+)\)',line)
        assert match,line
        directory=root/match[1];info=json.loads(child(directory,'resource.json').read_text());apk=child(directory,info['apk']);size=apk.stat().st_size;assert size==info['apkBytes']
        display=f'{size/1024/1024:.2f} MB' if size>=1024*1024 else f'{size/1024:.1f} KB'
        label=f'{display}';cells=[v.strip() for v in line.strip('|').split('|')]
        if len(cells)==columns-1:cells.insert(3,label)
        else:assert len(cells)==columns;cells[3]=label
        cells[2]=info['version'];line='| '+' | '.join(cells)+' |'
    output.append(line)
p.write_text(text[:start]+'\n'.join(output)+'\n\n'+text[end:])
print('Updated APK versions and exact file sizes in README tables.')
