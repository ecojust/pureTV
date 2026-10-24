"""Verify public APK resource identities, original certificates, sources and hashes."""
import hashlib,json,re,subprocess
from pathlib import Path

def digest(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def apk_info(path,tools,allow_unsigned=False):
    badging=subprocess.check_output([str(tools/'aapt'),'dump','badging',str(path)],text=True)
    identity=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging)
    assert identity,f'Cannot read APK metadata: {path}'
    signing=subprocess.run([str(tools/'apksigner'),'verify','--print-certs',str(path)],capture_output=True,text=True)
    certificate=re.search(r'Signer #1 certificate SHA-256 digest: (\S+)',signing.stdout)
    if not allow_unsigned:assert signing.returncode==0 and certificate,f'Invalid APK signature: {path}'
    return {'packageName':identity[1],'versionCode':int(identity[2]),'versionName':identity[3],'certificateSha256':certificate[1].lower() if certificate else None,'bytes':path.stat().st_size,'sha256':digest(path)}
def child(directory,name):
    assert isinstance(name,str) and name and name not in ('.','..') and '/' not in name and '\\' not in name,'Invalid resource filename'
    path=directory/name;assert path.is_file() and not path.is_symlink(),f'Missing regular resource file: {path}'
    return path

# Only build inputs participate in the source fingerprint; APKs and resource metadata do not.
LAUNCHER_INPUTS=('FONT-LICENSE-OFL.txt','app','build-and-install.ps1','build-and-install.sh','build.gradle','gradle.properties','gradle','gradlew','gradlew.bat','settings.gradle')
def launcher_source_tree(root,ref='HEAD'):
    source_path='resource/launcher/puretv'
    if subprocess.run(['git','cat-file','-e',ref+':'+source_path],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
        source_path='resource/launcher' # Historical APK provenance before per-launcher folders.
    tree=subprocess.check_output(['git','ls-tree',ref+':'+source_path],cwd=root)
    selected=b''.join(line+b'\n' for line in tree.splitlines() if line.split(b'\t',1)[1].decode() in LAUNCHER_INPUTS)
    assert len(selected.splitlines())==len(LAUNCHER_INPUTS),'Missing launcher build inputs'
    return subprocess.check_output(['git','mktree'],cwd=root,input=selected).decode().strip()

def catalog_directories(root):
    assert {p.name for p in (root/'resource').iterdir() if p.is_dir()}=={'launcher','apps'},'Classify software under resource/launcher or resource/apps'
    for category in ('launcher','apps'):
        parent=root/'resource'/category
        assert parent.is_dir(),f'Missing resource/{category}'
        for directory in sorted(parent.iterdir()):
            if directory.is_dir() and not directory.name.startswith('.'):
                yield directory

def verify_catalog(root,tools):
    entries=[]
    for directory in catalog_directories(root):
        info=json.loads(child(directory,'resource.json').read_text())
        assert info['kind']==('launcher' if directory.parent.name=='launcher' else 'app') and info['name'] and info['author']
        assert isinstance(info['supportsLayoutJson'],bool)
        apk=child(directory,info['apk']);assert apk.suffix=='.apk' and 0<apk.stat().st_size<100*1024*1024
        actual=apk_info(apk,tools)
        for key in ('packageName','versionCode','certificateSha256','sha256'):assert actual[key]==info[key],f'{directory.name}: {key} mismatch'
        assert actual['versionName']==info['version'] and actual['bytes']==info['apkBytes']
        if info.get('sourceArchive'):
            source=child(directory,info['sourceArchive']);assert digest(source)==info['sourceArchiveSha256']
        else:assert (directory/'src').is_dir(),'Provide corresponding source or an archive'
        child(directory,'LICENSE');child(directory,'README.md')
        if info.get('cover'):child(directory,info['cover'])
        if actual['packageName'] in ('com.ecojust.puretv','com.ecojust.music','com.ecojust.shortvideo','com.ecojust.webtv'):
            assert actual['certificateSha256']==(root/'tools/puretv-release-certificate.sha256').read_text().strip()
        if actual['packageName']=='com.ecojust.puretv':
            assert info.get('sourceTreeSha') and info.get('sourceCommit')
        info['path']=str(apk.relative_to(root));entries.append(info)
    assert entries,'No APK resources found'
    return entries
if __name__=='__main__':
    import argparse,os
    parser=argparse.ArgumentParser();parser.add_argument('--build-tools',type=Path,default=Path(os.environ.get('ANDROID_HOME','/opt/android-sdk'))/'build-tools/34.0.0');args=parser.parse_args()
    root=Path(__file__).resolve().parents[1]
    print(json.dumps([{'name':info['name'],'version':info['version'],'bytes':info['apkBytes'],'signatureVerified':True} for info in verify_catalog(root,args.build_tools)],ensure_ascii=False,indent=2))
