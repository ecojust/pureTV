#!/usr/bin/env python3
"""Prepare a signed public launcher resource from verified Android CI staging outputs."""
import argparse,hashlib,json,os,re,shutil,subprocess,tempfile
from pathlib import Path
from resource_catalog import apk_info,digest,launcher_source_tree,LAUNCHER_INPUTS

parser=argparse.ArgumentParser()
parser.add_argument('--stage-branch',required=True)
parser.add_argument('--source-sha',required=True)
parser.add_argument('--build-tools',required=True,type=Path)
args=parser.parse_args()
assert re.fullmatch(r'build-assets/resources-\d+',args.stage_branch)
assert re.fullmatch(r'[0-9a-f]{40}',args.source_sha)
root=Path(__file__).resolve().parents[1]
def git(*arguments):return subprocess.check_output(['git','-C',str(root),*arguments])
git('fetch','origin',args.stage_branch)
metadata=json.loads(git('show','FETCH_HEAD:release-staging/release-metadata.json'))['launcher']
assert metadata['sourceSha']==args.source_sha and metadata['packageName']=='com.ecojust.puretv'
assert re.fullmatch(r'\d+\.\d+\.\d+',metadata['versionName'])
source_tree=launcher_source_tree(root,args.source_sha)
assert metadata['sourceTreeSha']==source_tree
expected_cert=(root/'tools/puretv-release-certificate.sha256').read_text().strip()
with tempfile.TemporaryDirectory(prefix='puretv-resource-') as temporary:
    temporary=Path(temporary)
    unsigned=temporary/'input.apk';unsigned.write_bytes(git('show','FETCH_HEAD:release-staging/'+metadata['releaseName']))
    assert digest(unsigned)==metadata['sha256'] and unsigned.stat().st_size==metadata['bytes']
    signed=temporary/metadata['releaseName']
    if metadata['requiresSigning']:
        key=os.environ.get('PURETV_KEYSTORE_PATH')
        assert key and os.environ.get('PURETV_KEYSTORE_PASSWORD'),'Set PURETV_KEYSTORE_PATH and PURETV_KEYSTORE_PASSWORD locally before signing'
        aligned=temporary/'aligned.apk'
        subprocess.run([str(args.build_tools/'zipalign'),'-f','4',str(unsigned),str(aligned)],check=True)
        subprocess.run([str(args.build_tools/'apksigner'),'sign','--ks',key,'--ks-key-alias','puretv','--ks-pass','env:PURETV_KEYSTORE_PASSWORD','--key-pass','env:PURETV_KEYSTORE_PASSWORD','--out',str(signed),str(aligned)],check=True)
    else:shutil.copyfile(unsigned,signed)
    info=apk_info(signed,args.build_tools)
    assert info['packageName']==metadata['packageName'] and info['versionName']==metadata['versionName'] and info['versionCode']==metadata['versionCode']
    assert info['certificateSha256']==expected_cert
    subprocess.run([str(args.build_tools/'zipalign'),'-c','4',str(signed)],check=True)
    previews={}
    for name in ['home-render.png','apps-render.png']:
        data=git('show','FETCH_HEAD:release-staging/'+name)
        assert data.startswith(b'\x89PNG\r\n\x1a\n') and len(data)<4*1024*1024
        previews[name]=data
    source=temporary/'source.tar.gz'
    with source.open('wb') as output:subprocess.run(['git','-C',str(root),'archive','--format=tar.gz',args.source_sha,*['resource/launcher/puretv/'+name for name in LAUNCHER_INPUTS],'resource/apps/music/build.gradle','resource/apps/shortvideo/build.gradle','resource/apps/webtv/build.gradle','resource/apps/music/src','resource/apps/shortvideo/src','resource/apps/webtv/src','LICENSE','NOTICE.md'],stdout=output,check=True)
    folder=root/'resource/launcher/puretv';folder.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(signed,folder/signed.name)
    shutil.copyfile(source,folder/'source.tar.gz')
    (folder/'thumb.png').write_bytes(previews['home-render.png']);(folder/'apps.png').write_bytes(previews['apps-render.png'])
    for name in ['LICENSE','NOTICE.md']:(folder/name).write_bytes(git('show',args.source_sha+':'+name))
    for previous in folder.glob('pureTV-*.apk'):
        if previous.name!=signed.name:previous.unlink()
    resource={'kind':'launcher','name':'pureTV Launcher','author':'ecojust / 桔子桑','version':info['versionName'],'packageName':info['packageName'],'versionCode':info['versionCode'],'apk':signed.name,'apkBytes':info['bytes'],'sha256':info['sha256'],'certificateSha256':info['certificateSha256'],'supportsLayoutJson':True,'layoutJsonVersion':json.loads(git('show',args.source_sha+':resource/launcher/puretv/app/src/main/assets/layout.json'))['version'],'cover':'thumb.png','coverSource':'Actual launcher UI rendered by Robolectric; not a physical TV capture','license':'MIT; see NOTICE for upstream credits','description':'支持 layout.json 画布编辑的 Android TV 启动器','upstream':'https://github.com/ecojust/pureTV','upstreamRelease':'https://github.com/ecojust/pureTV/tree/master/resource/launcher/puretv','sourceArchive':'source.tar.gz','sourceArchiveSha256':digest(folder/'source.tar.gz'),'sourceCommit':args.source_sha,'sourceTreeSha':source_tree,'buildRun':'https://github.com/ecojust/pureTV/actions/runs/'+args.stage_branch.rsplit('-',1)[1]}
    (folder/'resource.json').write_text(json.dumps(resource,ensure_ascii=False,indent=2)+'\n')
    (folder/'SHA256SUMS.txt').write_text(''.join(f'{digest(folder/name)}  {name}\n' for name in [signed.name,'source.tar.gz','thumb.png','apps.png']))
    (folder/'README.md').write_text(f'''# pureTV Launcher {info['versionName']}

作者：ecojust / 桔子桑。包名 com.ecojust.puretv，沿用 0.2.0 发布证书，可直接升级。

[下载 APK]({signed.name}?raw=1) · [对应源码](source.tar.gz) · [layout.json 示例](layout.example.json) · [规范与画面对照](../../README-development.md#layoutjson-协议规范与画面对照) · [SHA256](SHA256SUMS.txt)

支持 pureTV 管理器的 layout.json 版本 2 接口，home/apps 页面分别设置列数、顺序、名称、图标和颜色。只允许添加已安装可启动的用户应用，不兼容旧版 apps.json。

![首页渲染示例](thumb.png)

![其他应用页渲染示例](apps.png)

图片由对应版本的实际 Android 页面在 Robolectric 原生图形环境中渲染，非实机录屏。源代码树、构建记录、APK 哈希与发布证书见 [resource.json](resource.json)。许可证及上游致谢见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。
''')
    subprocess.run(['python',str(root/'tools/update-resource-index.py')],cwd=root,check=True)
    print(json.dumps({'version':info['versionName'],'apk':str((folder/signed.name).relative_to(root)),'bytes':info['bytes'],'sha256':info['sha256'],'sourceTreeSha':source_tree},indent=2))
