#!/usr/bin/env python3
"""Publish a successfully tested collection as signed APKs, source archives and real previews.

python tools/prepare-launcher-collection.py RUN_ID SOURCE_SHA --build-tools DIR --keystore FILE
Credentials: PURETV_KEYSTORE_PASSWORD. Optional GitHub transport header: PURETV_GITHUB_HEADER.
"""
import argparse,io,json,os,re,subprocess,tarfile,tempfile
from pathlib import Path
from resource_catalog import apk_info,digest
from resource_previews import write_english_previews
p=argparse.ArgumentParser();p.add_argument('run_id');p.add_argument('source_sha');p.add_argument('--build-tools',type=Path,required=True);p.add_argument('--keystore',type=Path,required=True);args=p.parse_args()
assert args.run_id.isdigit() and re.fullmatch('[0-9a-f]{40}',args.source_sha)
root=Path(__file__).resolve().parents[1];auth=os.environ.get('PURETV_GITHUB_HEADER')
def git(*argv):return subprocess.check_output(['git','-C',str(root)]+(['-c','http.extraHeader='+auth] if auth else [])+list(argv))
status=json.loads(subprocess.check_output(['gh','api']+(['-H',auth] if auth else [])+[f'repos/ecojust/pureTV/actions/runs/{args.run_id}']))
assert status['conclusion']=='success' and status['head_sha']==args.source_sha
names=json.loads(git('show',args.source_sha+':tools/launcher-builds.json'));assert len(names)==8 and len(set(names))==8
assert all(re.fullmatch('[a-z][a-z0-9-]*',name) for name in names)
branch='build-assets/collection-'+args.run_id;stage_ref='refs/remotes/origin/'+branch;git('fetch','origin','refs/heads/'+branch+':'+stage_ref)
certificate=(root/'tools/puretv-release-certificate.sha256').read_text().strip()
for name in names:
    folder=root/'resource/launcher'/name;source_path='resource/launcher/'+name
    previous=json.loads((folder/'resource.json').read_text()) if (folder/'resource.json').exists() else None
    descriptor=json.loads(git('show',args.source_sha+':'+source_path+'/build-resource.json'))
    apk_name=descriptor['apk'];assert Path(apk_name).name==apk_name and apk_name.endswith('.apk')
    def artifact(filename):return git('show',stage_ref+':release-staging/collection/'+name+'/'+filename)
    info=json.loads(artifact('metadata.json'));assert info['sourceSha']==args.source_sha
    assert info['packageName']==descriptor['packageName'] and info['versionName']==descriptor['version']
    example=git('show',args.source_sha+':'+source_path+'/layout.example.json');assert example==(folder/'layout.example.json').read_bytes()
    apk=folder/apk_name
    with tempfile.TemporaryDirectory(prefix='launcher-sign-') as temporary:
        temporary=Path(temporary);unsigned=temporary/'unsigned.apk';unsigned.write_bytes(artifact(apk_name));assert digest(unsigned)==info['sha256']
        aligned=temporary/'aligned.apk'
        subprocess.run([str(args.build_tools/'zipalign'),'-f','4',str(unsigned),str(aligned)],check=True)
        subprocess.run([str(args.build_tools/'apksigner'),'sign','--v4-signing-enabled','false','--ks',str(args.keystore),'--ks-key-alias','puretv','--ks-pass','env:PURETV_KEYSTORE_PASSWORD','--key-pass','env:PURETV_KEYSTORE_PASSWORD','--out',str(apk),str(aligned)],check=True)
    actual=apk_info(apk,args.build_tools)
    for field in ['packageName','versionCode','versionName']:assert actual[field]==info[field]
    assert actual['certificateSha256']==certificate
    subprocess.run([str(args.build_tools/'zipalign'),'-c','4',str(apk)],check=True)
    for before,after in [('home-render.png','thumb.png'),('apps-render.png','apps.png')]:
        data=artifact(before);assert data.startswith(b'\x89PNG');(folder/after).write_bytes(data)
    write_english_previews(root,'launcher',name,actual['versionName'],args.source_sha,status['html_url'],artifact('home-render.en.png'),artifact('apps-render.en.png'))
    archive=git('archive','--format=tar',args.source_sha,source_path)
    with tarfile.open(fileobj=io.BytesIO(archive)) as source,tarfile.open(folder/'source.tar.gz','w:gz') as target:
        for member in source:
            if member.name.endswith(('.apk','source.tar.gz','resource.json','SHA256SUMS.txt','thumb.png','apps.png')):continue
            target.addfile(member,source.extractfile(member) if member.isfile() else None)
    metadata={'kind':'launcher','name':descriptor['name'],'author':descriptor['author'],'version':actual['versionName'],'packageName':actual['packageName'],'versionCode':actual['versionCode'],'apk':apk_name,'apkBytes':actual['bytes'],'sha256':actual['sha256'],'certificateSha256':certificate,'supportsLayoutJson':True,'layoutJsonVersion':5,'languages':['zh','en'],'cover':'thumb.png','coverSource':'Actual Android launcher UI rendered by Robolectric with test apps; not a physical TV capture','license':'MIT; see NOTICE.md for upstream credits','description':descriptor['description'],'upstream':'https://github.com/ecojust/pureTV','upstreamRelease':'https://github.com/ecojust/pureTV/tree/master/'+source_path,'sourceArchive':'source.tar.gz','sourceArchiveSha256':digest(folder/'source.tar.gz'),'sourceCommit':args.source_sha,'buildRun':status['html_url']}
    (folder/'resource.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
    (folder/'SHA256SUMS.txt').write_text(''.join(f'{digest(folder/file)}  {file}\n' for file in [apk_name,'source.tar.gz','thumb.png','apps.png','layout.example.json','layout.example.en.json']))
    if previous and previous['apk']!=apk_name:
        old=folder/previous['apk'];assert old.parent==folder and old.suffix=='.apk'
        old.unlink(missing_ok=True)
    print(json.dumps({'name':descriptor['name'],'apk':apk_name,'bytes':actual['bytes'],'sha256':actual['sha256']}),flush=True)
