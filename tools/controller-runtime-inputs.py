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
import hashlib
import zipfile
from resource_catalog import apk_info,digest

ROOT=Path(__file__).resolve().parents[1]
def module(name,path):
    spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
release=module('controller_release',ROOT/'tools/controller-release.py')
fetch=module('gamekit_fetch',ROOT/'resource/game-kit/fetch-signed.py')
def source_bindings(manifest,slug,receipt,observer):
    assert slug in release.ALL_SLUGS, 'Only the twenty README games are accepted'
    kit_source=manifest['sourceSha'];legacy_source=manifest.get('legacySourceSha',kit_source)
    assert re.fullmatch('[a-f0-9]{40}',kit_source) and re.fullmatch('[a-f0-9]{40}',legacy_source)
    artifact_source=kit_source if slug in release.KIT_SLUGS else legacy_source
    assert receipt['sourceSha']==artifact_source, 'Game APK receipt is bound to the wrong source group'
    assert observer['sourceSha']==legacy_source, 'Observer must match the exact legacy signing source'
    assert receipt['packageName']==observer['targetPackage'], 'Observer targets another package'
    return artifact_source,legacy_source

def main():
    p=argparse.ArgumentParser();p.add_argument('--manifest',type=Path,required=True);p.add_argument('--group',choices=['arcade','worlds','kit'],required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--build-tools',type=Path,required=True);a=p.parse_args()
    manifest=json.loads(a.manifest.read_text());source=manifest['sourceSha'];assert re.fullmatch('[a-f0-9]{40}',source)
    legacy_source=manifest.get('legacySourceSha',source);assert re.fullmatch('[a-f0-9]{40}',legacy_source)
    run=str(manifest['legacyRunId']);attempt=int(manifest.get('legacyAttempt',1));assert re.fullmatch('[1-9][0-9]*',run) and attempt>=1
    scope = manifest.get('scope', 'all')
    assert set(manifest['kitRuns']) == set(release.scoped_games(release.KIT_SLUGS, scope))
    for value in manifest['kitRuns'].values():assert re.fullmatch('[1-9][0-9]*',str(value))
    original=fetch.github_read('actions/runs/'+run)
    assert original['head_sha']==legacy_source and original['conclusion']=='success' and original['status']=='completed'
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
    assert exported_metadata['sourceSha']==legacy_source and str(exported_metadata['runId'])==run and exported_metadata['signResult']=='success'
    assert exported_metadata.get('scope', 'all') == scope, 'Legacy export has another signing selection'
    for name,item in exported_metadata['files'].items():
        if name.startswith(('packages/','observers/')):
            path=a.output/name
            assert path.is_file() and not path.is_symlink() and path.stat().st_size==item['bytes'] and digest(path)==item['sha256']
    pin=(ROOT/'tools/puretv-release-certificate-v2.sha256').read_text().strip()
    groups=release.scoped_games(release.KIT_SLUGS if a.group=='kit' else release.GROUPS[a.group], scope)
    if a.group=='kit':
        for slug in groups:
            bundle=fetch.fetch_bundle(fetch.github_read,run_id=str(manifest['kitRuns'][slug]),slug=slug,source_sha=source,build_tools=a.build_tools,expected_cert=pin)
            fetch.store_bundle(bundle,a.output/'packages'/slug)
    for artifact_source in sorted({source,legacy_source}):
        subprocess.run(['git','fetch','--depth=1','--no-tags','origin',artifact_source],cwd=ROOT,check=True)
    def committed(ref,path):
        return subprocess.check_output(['git','show',ref+':'+path],cwd=ROOT)
    results=[]
    for slug in groups:
        directory=a.output/'packages'/slug;apks=list(directory.glob('*.apk'));assert len(apks)==1
        identity=apk_info(apks[0],a.build_tools)
        receipt=json.loads((directory/'signing-receipt.json').read_text())
        observer=json.loads((a.output/'observers'/slug/'observer-signing-receipt.json').read_text())
        artifact_source,_=source_bindings(manifest,slug,receipt,observer)
        assert identity['certificateSha256']==pin and identity['sha256']==receipt['sha256']
        assert identity['packageName']==observer['targetPackage'] and observer['modelWrites'] is False
        observed=apk_info(a.output/'observers'/slug/observer['apk'],a.build_tools)
        assert observed==observer['apkIdentity'] and observed['certificateSha256']==pin
        observer_apk=a.output/'observers'/slug/observer['apk']
        observer_manifest=subprocess.check_output([str(a.build_tools/'aapt'),'dump','xmltree',str(observer_apk),'AndroidManifest.xml'],text=True)
        observer_badging=subprocess.check_output([str(a.build_tools/'aapt'),'dump','badging',str(observer_apk)],text=True)
        contract=release.observer_contract(observer_manifest,observer_badging,identity['packageName'])
        assert all(observer[key]==value for key,value in contract.items())
        for name,value in observer['sourceFiles'].items():
            assert not Path(name).is_absolute() and '..' not in Path(name).parts
            data=committed(legacy_source,name);assert value=={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            # Preserve the observer's actual signing source, which may differ
            # from the later QA workflow commit. Do not relabel current Java as
            # the source of an independently signed observation APK.
            archived=a.output/'observer-source'/slug/name
            archived.parent.mkdir(parents=True,exist_ok=True);archived.write_bytes(data)
        (a.output/'observer-source'/slug/'source-manifest.json').write_text(json.dumps({'sourceSha':legacy_source,'observerSha256':observed['sha256'],'files':observer['sourceFiles']},indent=2)+'\n')
        native=receipt['nativeSourceSha256'] if slug in release.KIT_SLUGS else receipt['inputFiles']
        for name,value in native.items():
            data=committed(artifact_source,name);fingerprint=hashlib.sha256(data).hexdigest()
            assert value==fingerprint if isinstance(value,str) else value=={'bytes':len(data),'sha256':fingerprint}
        prefixes=['resource/apps/'+slug+'/src/main/assets/']
        if slug in release.KIT_SLUGS:prefixes.append('resource/game-kit/web/')
        paths=subprocess.check_output(['git','ls-tree','-r','--name-only',artifact_source,'--',*prefixes],cwd=ROOT,text=True).splitlines()
        expected={}
        for name in paths:
            prefix=next(p for p in prefixes if name.startswith(p));relative=name[len(prefix):]
            assert relative not in expected;expected[relative]=committed(artifact_source,name)
        if slug in release.KIT_SLUGS:
            metadata=json.loads(committed(artifact_source,'resource/apps/'+slug+'/game.json'))
            expected['game-config.json']=(json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+'\n').encode()
            expected['assets-index.json']=(json.dumps(sorted(expected),separators=(',',':'))+'\n').encode()
        with zipfile.ZipFile(apks[0]) as package:
            actual={name[7:]:package.read(name) for name in package.namelist() if name.startswith('assets/') and not name.endswith('/')}
        assert all(actual.get(name)==data for name,data in expected.items())
        extra=set(actual)-set(expected);assert not extra or (slug=='jackal' and all(name.startswith('art/') for name in extra))
        results.append({'slug':slug,'artifactSourceSha':artifact_source,'observerSourceSha':legacy_source,'package':identity,'observerSha256':observed['sha256'],'committedAssetFilesChecked':len(expected),'nativeSourceReceiptMatchesCommit':True})
    (a.output/'input-verification.json').write_text(json.dumps({'status':'passed','sourceSha':source,'legacySourceSha':legacy_source,'legacyExportCommit':exported,'group':a.group,'packages':results},indent=2)+'\n')
    print(json.dumps({'status':'passed','group':a.group,'games':len(results)}))
if __name__=='__main__':main()
