#!/usr/bin/env python3
"""Sign a successful Nova CI artifact and publish verifiable APK/source/preview metadata.

Use: python tools/prepare-nova-resource.py RUN_ID SOURCE_SHA --build-tools DIR --keystore FILE
Set PURETV_KEYSTORE_PASSWORD in the environment; the key alias is puretv.
The unsigned artifact is fetched from build-assets/nova-RUN_ID.
"""
import argparse,hashlib,io,json,os,re,subprocess,tarfile,tempfile
from pathlib import Path
from resource_catalog import apk_info,digest
from resource_previews import write_english_previews

parser=argparse.ArgumentParser()
parser.add_argument('run_id');parser.add_argument('source_sha')
parser.add_argument('--build-tools',type=Path,required=True)
parser.add_argument('--keystore',type=Path,required=True)
args=parser.parse_args()
assert args.run_id.isdigit() and len(args.source_sha)==40
root=Path(__file__).resolve().parents[1]
auth=os.environ.get('PURETV_GITHUB_HEADER')
def git(*argv):
    prefix=['git','-C',str(root)]+(['-c','http.extraHeader='+auth] if auth else [])
    return subprocess.check_output(prefix+list(argv))
status=json.loads(subprocess.check_output(['gh','api']+(['-H',auth] if auth else [])+[f'repos/ecojust/pureTV/actions/runs/{args.run_id}']))
assert status['conclusion']=='success' and status['head_sha']==args.source_sha
branch='build-assets/nova-'+args.run_id;stage_ref='refs/remotes/origin/'+branch;git('fetch','origin','refs/heads/'+branch+':'+stage_ref)
def artifact(name):return git('show',stage_ref+':release-staging/nova/'+name)
info=json.loads(artifact('metadata.json'));assert info['sourceSha']==args.source_sha
assert info['packageName']=='com.ecojust.novatv'
version=info['versionName'];code=info['versionCode'];assert re.fullmatch(r'\d+\.\d+\.\d+',version) and isinstance(code,int) and code>0
gradle=git('show',args.source_sha+':resource/launcher/nova/app/build.gradle').decode()
assert re.search(r"versionName '([^']+)'",gradle)[1]==version and int(re.search(r'versionCode (\d+)',gradle)[1])==code
folder=root/'resource/launcher/nova';apk=folder/f'NovaTV-{version}.apk'
with tempfile.TemporaryDirectory(prefix='nova-sign-') as temporary:
    temporary=Path(temporary);unsigned=temporary/'unsigned.apk';unsigned.write_bytes(artifact('nova.apk'))
    assert digest(unsigned)==info['sha256']
    aligned=temporary/'aligned.apk'
    subprocess.run([str(args.build_tools/'zipalign'),'-f','4',str(unsigned),str(aligned)],check=True)
    subprocess.run([str(args.build_tools/'apksigner'),'sign','--v4-signing-enabled','false','--ks',str(args.keystore),'--ks-key-alias','puretv','--ks-pass','env:PURETV_KEYSTORE_PASSWORD','--key-pass','env:PURETV_KEYSTORE_PASSWORD','--out',str(apk),str(aligned)],check=True)
actual=apk_info(apk,args.build_tools)
assert actual['packageName']==info['packageName'] and actual['versionCode']==code and actual['versionName']==version
assert actual['certificateSha256']==(root/'tools/puretv-release-certificate.sha256').read_text().strip()
subprocess.run([str(args.build_tools/'zipalign'),'-c','4',str(apk)],check=True)
for source,target in [('home-render.png','thumb.png'),('apps-render.png','apps.png')]:
    data=artifact(source);assert data.startswith(b'\x89PNG');(folder/target).write_bytes(data)
write_english_previews(root,'launcher','nova',version,args.source_sha,status['html_url'],artifact('home-render.en.png'),artifact('apps-render.en.png'))
# Archive the exact build revision, excluding generated catalog artifacts.
archive=git('archive','--format=tar',args.source_sha,'resource/launcher/nova')
with tarfile.open(fileobj=io.BytesIO(archive)) as source,tarfile.open(folder/'source.tar.gz','w:gz') as target:
    for member in source:
        if member.name.endswith(('.apk','source.tar.gz','resource.json','SHA256SUMS.txt','thumb.png','apps.png')):continue
        target.addfile(member,source.extractfile(member) if member.isfile() else None)
metadata={'kind':'launcher','name':'Nova TV','author':'ecojust / 桔子桑','version':version,'packageName':actual['packageName'],'versionCode':code,'apk':apk.name,'apkBytes':actual['bytes'],'sha256':actual['sha256'],'certificateSha256':actual['certificateSha256'],'supportsLayoutJson':True,'layoutJsonVersion':5,'languages':['zh','en'],'cover':'thumb.png','coverSource':'Actual Nova TV Android UI rendered by Robolectric with test apps; not a physical TV capture','license':'MIT; see NOTICE.md for upstream credits','description':'Apple TV 风格的深色桌面，支持 layout.json v5 自定义布局','upstream':'https://github.com/ecojust/pureTV','upstreamRelease':'https://github.com/ecojust/pureTV/tree/master/resource/launcher/nova','sourceArchive':'source.tar.gz','sourceArchiveSha256':digest(folder/'source.tar.gz'),'sourceCommit':args.source_sha,'buildRun':status['html_url']}
(folder/'resource.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
(folder/'SHA256SUMS.txt').write_text(''.join(f'{digest(folder/name)}  {name}\n' for name in [apk.name,'source.tar.gz','thumb.png','apps.png','layout.example.json','layout.example.en.json']))
for old in folder.glob('NovaTV-*.apk'):
    if old!=apk:old.unlink()
print(json.dumps({'apk':apk.name,'bytes':actual['bytes'],'sha256':actual['sha256'],'sourceCommit':args.source_sha}))
