#!/usr/bin/env python3
"""Verify ZIP and mounted DMG bytes, then install exactly the verified Mac app."""
import argparse,hashlib,importlib.util,json,os,plistlib,subprocess
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--directory',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--artifact-source-checkout',type=Path);a=p.parse_args()
root=a.directory.resolve();meta=json.loads((root/'build-manifest.json').read_text());provenance={'artifactSourceCommit':meta['sourceCommit'],'qaSourceCommit':os.environ['GITHUB_SHA']}
if a.artifact_source_checkout:
 spec=importlib.util.spec_from_file_location('reuse',Path(__file__).with_name('macos-reuse.py'));reuse=importlib.util.module_from_spec(spec);spec.loader.exec_module(reuse)
 provenance=reuse.verify_source(meta,a.artifact_source_checkout.resolve(),Path(__file__).resolve().parents[2])
else:assert meta['sourceCommit']==os.environ['GITHUB_SHA']
assert set(meta['architectures'])=={'arm64','x86_64'}
for name,v in meta['packages'].items():
 f=root/name;assert f.stat().st_size==v['bytes'];assert hashlib.sha256(f.read_bytes()).hexdigest()==v['sha256']
def check(app):
 info=plistlib.loads((app/'Contents/Info.plist').read_bytes());assert info['CFBundleShortVersionString']==meta['version'];assert info['CFBundleVersion']==meta['buildVersion'];assert info['CFBundleIdentifier']==meta['bundleIdentifier']
 for name,v in meta['appFiles'].items():
  f=app/name;assert f.stat().st_size==v['bytes'],name;assert hashlib.sha256(f.read_bytes()).hexdigest()==v['sha256'],name
 subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
zipfile=next(root/n for n in meta['packages'] if n.endswith('.zip'));dmg=next(root/n for n in meta['packages'] if n.endswith('.dmg'))
subprocess.run(['ditto','-x','-k',str(zipfile),str(root/'zip-copy')],check=True);check(root/'zip-copy'/meta['appName'])
mount=root/'mount';mount.mkdir();subprocess.run(['hdiutil','attach','-readonly','-nobrowse','-mountpoint',str(mount),str(dmg)],check=True)
try:
 check(mount/meta['appName']);assert (mount/'Applications').is_symlink();subprocess.run(['ditto',str(mount/meta['appName']),str(root/'installed'/meta['appName'])],check=True)
finally:subprocess.run(['hdiutil','detach',str(mount)],check=True)
check(root/'installed'/meta['appName']);a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps({'status':'passed',**provenance,'sourceCommit':meta['sourceCommit'],'game':meta['game'],'version':meta['version'],'buildVersion':meta['buildVersion'],'zipDmgAndInstalledCopyVerified':True,'signature':'ad-hoc','appleNotarized':False},indent=2)+'\n')
