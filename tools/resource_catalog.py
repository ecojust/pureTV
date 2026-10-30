"""Verify public APK resource identities, original certificates, sources and hashes."""
import hashlib,json,re,subprocess
from pathlib import Path

# These applications and launchers migrate to the new certificate at 0.5.0.
# Thresholds are the first unpublished version codes after the legacy releases;
# matching by exact package and code prevents unrelated apps or historical APKs
# from accepting either certificate indiscriminately.
RELEASE_CERTIFICATE_CUTOVERS = {
    'com.ecojust.puretv': 14,
    'com.ecojust.novatv': 4,
    'com.ecojust.formatv': 3,
    'com.ecojust.mosstv': 3,
    'com.ecojust.astertv': 3,
    'com.ecojust.soltv': 3,
    'com.ecojust.monotv': 3,
    'com.ecojust.pixeltv': 3,
    'com.ecojust.circuittv': 3,
    'com.ecojust.drifttv': 3,
    'com.ecojust.music': 5,
    'com.ecojust.hifinitv': 6,
    'com.ecojust.cctvlive': 2,
    'com.ecojust.webtv': 3,
    'com.ecojust.shortvideo': 3,
    'com.ecojust.tanktv': 7,
    'com.ecojust.jackaltv': 4,
    'com.ecojust.jeweltv': 2,
    'com.ecojust.tetristv': 2,
    'com.ecojust.bombjacktv': 2,
    'com.ecojust.adventureislandtv': 2,
    'com.ecojust.supermariotv': 2,
    'com.ecojust.coastkarttv': 2,
    'com.ecojust.cozyislandtv': 2,
}

# New applications launched after the certificate rotation have no legacy signer.
# Register exact package IDs; similar or unknown packages must not inherit this pin.
NEW_RELEASE_CERTIFICATE_PACKAGES = {'com.ecojust.usedcartv'}

def expected_release_certificate(root, identity):
    """Return the single certificate pinned for an APK's package and version."""
    package = identity['packageName']
    assert package.startswith('com.ecojust.'), 'Release certificate pins apply only to pureTV packages'
    pin = 'puretv-release-certificate.sha256'
    if package in NEW_RELEASE_CERTIFICATE_PACKAGES:
        assert identity['versionCode'] >= 1, f'{package}: invalid initial version code'
        version = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)(?:-preview\.\d+)?', identity['versionName'])
        assert version and tuple(map(int, version.groups())) >= (0, 1, 0), f'{package}: invalid release version'
        pin = 'puretv-release-certificate-v2.sha256'
    elif package in RELEASE_CERTIFICATE_CUTOVERS:
        version = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)(?:-preview\.\d+)?', identity['versionName'])
        assert version, f'{package}: invalid version name for certificate selection'
        new_version = tuple(map(int, version.groups())) >= (0, 5, 0)
        new_code = identity['versionCode'] >= RELEASE_CERTIFICATE_CUTOVERS[package]
        assert new_version == new_code, f'{package}: version name and code disagree at the 0.5.0 certificate cutover'
        if new_code:
            pin = 'puretv-release-certificate-v2.sha256'
    certificate = (root / 'tools' / pin).read_text().strip()
    assert re.fullmatch(r'[a-f0-9]{64}', certificate), f'Invalid release certificate fingerprint: {pin}'
    return certificate

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
        child(directory,'LICENSE');child(directory,'README.md')
        if info.get('cover'):child(directory,info['cover'])
        if actual['packageName'].startswith('com.ecojust.'):
            assert actual['certificateSha256']==expected_release_certificate(root,actual),f'{directory.name}: unexpected release signing certificate'
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
