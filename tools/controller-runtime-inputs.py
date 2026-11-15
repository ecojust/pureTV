#!/usr/bin/env python3
"""Fetch previously signed APKs and observers; never rebuild game binaries."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
from resource_catalog import apk_info,digest

ROOT=Path(__file__).resolve().parents[1]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
release=module('controller_release',ROOT/'tools/controller-release.py')
fetch=module('gamekit_fetch',ROOT/'resource/game-kit/fetch-signed.py')
def main():
    p=argparse.ArgumentParser();p.add_argument('--manifest',type=Path,required=True);p.add_argument('--group',choices=['arcade','worlds','kit'],required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--build-tools',type=Path,required=True);a=p.parse_args()
    manifest=json.loads(a.manifest.read_text());source=manifest['sourceSha'];assert re.fullmatch('[a-f0-9]{40}',source)
    run=str(manifest['legacyRunId']);attempt=int(manifest.get('legacyAttempt',1));assert re.fullmatch('[1-9][0-9]*',run) and attempt>=1
    assert set(manifest['kitRuns'])==set(release.KIT_SLUGS)
    for value in manifest['kitRuns'].values():assert re.fullmatch('[1-9][0-9]*',str(value))
    original=fetch.github_read('actions/runs/'+run)
    assert original['head_sha']==source and original['conclusion']=='success' and original['status']=='completed'
    assert original['path']=='.github/workflows/controller-games.yml'
    assert original['repository']['full_name']==original['head_repository']['full_name']=='ecojust/pureTV'
    branch='build-assets/controller-games-'+run+'-attempt-'+str(attempt)
    subprocess.run(['git','fetch','--no-tags','origin','refs/heads/'+branch],cwd=ROOT,check=True)
    exported=subprocess.check_output(['git','rev-parse','FETCH_HEAD'],cwd=ROOT,text=True).strip()
    a.output.mkdir(parents=True,exist_ok=False)
    archive=a.output/'legacy-export.tar'
    with archive.open('wb') as stream:subprocess.run(['git','archive',exported,'packages','observers','export-manifest.json'],cwd=ROOT,stdout=stream,check=True)
    with tarfile.open(archive) as package:package.extractall(a.output,filter='data')
    archive.unlink()
    exported_metadata=json.loads((a.output/'export-manifest.json').read_text())
    assert exported_metadata['sourceSha']==source and str(exported_metadata['runId'])==run and exported_metadata['signResult']=='success'
    for name,item in exported_metadata['files'].items():
        if name.startswith(('packages/','observers/')):
            path=a.output/name
            assert path.is_file() and not path.is_symlink() and path.stat().st_size==item['bytes'] and digest(path)==item['sha256']
    pin=(ROOT/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    groups=release.KIT_SLUGS if a.group=='kit' else release.GROUPS[a.group]
    if a.group=='kit':
        for slug in groups:
            bundle=fetch.fetch_bundle(fetch.github_read,run_id=str(manifest['kitRuns'][slug]),slug=slug,source_sha=source,build_tools=a.build_tools,expected_cert=pin)
            fetch.store_bundle(bundle,a.output/'packages'/slug)
    results=[]
    for slug in groups:
        directory=a.output/'packages'/slug;apks=list(directory.glob('*.apk'));assert len(apks)==1
        identity=apk_info(apks[0],a.build_tools)
        receipt=json.loads((directory/'signing-receipt.json').read_text())
        observer=json.loads((a.output/'observers'/slug/'observer-signing-receipt.json').read_text())
        assert receipt['sourceSha']==observer['sourceSha']==source
        assert identity['certificateSha256']==pin and identity['sha256']==receipt['sha256']
        assert identity['packageName']==observer['targetPackage'] and observer['modelWrites'] is False
        observed=apk_info(a.output/'observers'/slug/observer['apk'],a.build_tools)
        assert observed==observer['apkIdentity'] and observed['certificateSha256']==pin
        results.append({'slug':slug,'package':identity,'observerSha256':observed['sha256']})
    (a.output/'input-verification.json').write_text(json.dumps({'status':'passed','sourceSha':source,'legacyExportCommit':exported,'group':a.group,'packages':results},indent=2)+'\n')
    print(json.dumps({'status':'passed','group':a.group,'games':len(results)}))
if __name__=='__main__':main()
