#!/usr/bin/env python3
"""Verify the fresh build and publish only a signed resource with identical launcher sources."""
import hashlib,json,os,re,shutil,subprocess,sys,traceback
from pathlib import Path
from resource_catalog import apk_info,verify_catalog,launcher_source_tree

def report_error(kind,value,tb):
    message=''.join(traceback.format_exception(kind,value,tb))
    print('::error::'+message.replace('%','%25').replace('\r','%0D').replace('\n','%0A'),flush=True)
    sys.__excepthook__(kind,value,tb)
sys.excepthook=report_error
root=Path(__file__).resolve().parents[1];tools=Path(os.environ['ANDROID_HOME'])/'build-tools/34.0.0'
paths=list((root/'resource/launcher/puretv/app/build/outputs/apk/release').glob('*.apk'));assert len(paths)==1,paths
built=apk_info(paths[0],tools,allow_unsigned=True);assert built['packageName']=='com.ecojust.puretv'
gradle=(root/'resource/launcher/puretv/app/build.gradle').read_text()
assert built['versionName']==re.search(r"versionName '([^']+)'",gradle)[1]
assert built['versionCode']==int(re.search(r'versionCode (\d+)',gradle)[1])
assert built['bytes']<=5*1024*1024
key_path=os.environ.get('PURETV_KEYSTORE_PATH')
if key_path:
    certificate=subprocess.check_output(['keytool','-exportcert','-alias','puretv','-keystore',key_path,'-storepass:env','PURETV_KEYSTORE_PASSWORD'])
    assert built['certificateSha256']==hashlib.sha256(certificate).hexdigest()
else:assert built['certificateSha256'] is None,'Unexpected build signing certificate'
# A first build must precede signing the new app's resource.json and resource APK.
# This exception belongs only to build verification; publishers remain strict.
entries=verify_catalog(root,tools,allow_unpublished_used_car=True)
source_tree=launcher_source_tree(root)
resource=next((entry for entry in entries if entry['packageName']==built['packageName'] and entry['version']==built['versionName'] and entry['sourceTreeSha']==source_tree),None)
selected=root/resource['path'] if resource else paths[0]
info=apk_info(selected,tools,allow_unsigned=not bool(resource))
assert info['bytes']<=5*1024*1024
info.update(requiresSigning=not bool(info['certificateSha256']),sourceSha=os.environ.get('GITHUB_SHA'),sourceTreeSha=source_tree,buildSourceSha=resource['sourceCommit'] if resource else os.environ.get('GITHUB_SHA'),releaseName=f"pureTV-{built['versionName']}.apk")
output=root/'resource/launcher/puretv/release-output';output.mkdir(exist_ok=True);shutil.copyfile(selected,output/info['releaseName'])
(root/'resource/launcher/puretv/release-metadata.json').write_text(json.dumps({'launcher':info},indent=2)+'\n')
print(json.dumps(info,ensure_ascii=False))
