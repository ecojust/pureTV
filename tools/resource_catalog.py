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
NEW_RELEASE_CERTIFICATE_PACKAGES = {'com.ecojust.operatv', 'com.ecojust.putrtvstore', 'com.ecojust.bilitv', 'com.ecojust.logicworkbenchtv', 'com.ecojust.twentyfourtv', 'com.ecojust.wordladdertv', 'com.ecojust.rooftoprunnertv', 'com.ecojust.riverhoppertv', 'com.ecojust.starformationtv', 'com.ecojust.orbitturrettv', 'com.ecojust.pocketgolftv', 'com.ecojust.lanebowlingtv', 'com.ecojust.rookrescuetv', 'com.ecojust.binaryweavetv', 'com.ecojust.tetroislandstv', 'com.ecojust.rectangleatlastv', 'com.ecojust.colorpathstv', 'com.ecojust.fleetledgertv', 'com.ecojust.lightchamberstv', 'com.ecojust.islandinktv', 'com.ecojust.shadeduplicatestv', 'com.ecojust.sumcrossingstv', 'com.ecojust.quadrantfivetv', 'com.ecojust.libertystonestv', 'com.ecojust.pocketsolitairetv', 'com.ecojust.tilegardentv', 'com.ecojust.dominochaintv', 'com.ecojust.nimorbittv', 'com.ecojust.sortingwirestv', 'com.ecojust.torchbridgetv', 'com.ecojust.riverguardtv', 'com.ecojust.trafficescapetv', 'com.ecojust.dotsboxestv', 'com.ecojust.seedmancalatv', 'com.ecojust.hexconnectiontv', 'com.ecojust.draughtstrailtv', 'com.ecojust.fourinrowtv', 'com.ecojust.mergetilestv', 'com.ecojust.brickpaddletv', 'com.ecojust.toweroverlaptv', 'com.ecojust.orchardsnaketv', 'com.ecojust.skylinenumberstv', 'com.ecojust.codebreakertv', 'com.ecojust.memorygallerytv', 'com.ecojust.minesurveytv', 'com.ecojust.pixelcluestv', 'com.ecojust.queenconstellationtv', 'com.ecojust.knightcircuittv', 'com.ecojust.ringtowerstv', 'com.ecojust.slidingordertv', 'com.ecojust.trianglepegstv', 'com.ecojust.stonebaytv', 'com.ecojust.reversirelaytv', 'com.ecojust.measurepourtv', 'com.ecojust.colorfrontiertv', 'com.ecojust.usedcartv', 'com.ecojust.alienshootertv', 'com.ecojust.gravitycouriertv', 'com.ecojust.prismrelaytv', 'com.ecojust.switchyardminutetv', 'com.ecojust.tidelocktv', 'com.ecojust.tensionspantv', 'com.ecojust.echocartographertv', 'com.ecojust.magneticwarehousetv', 'com.ecojust.lanternrhythmtv', 'com.ecojust.glassfoldtv', 'com.ecojust.thermalglidertv', 'com.ecojust.pathglyphstv', 'com.ecojust.weightledgertv', 'com.ecojust.paritygardentv', 'com.ecojust.hiddencorridorstv', 'com.ecojust.islanddominoestv', 'com.ecojust.adjacencyforgetv', 'com.ecojust.looporchardtv', 'com.ecojust.numberdunestv', 'com.ecojust.triangulartesseratv', 'com.ecojust.arrowharvesttv', 'com.ecojust.solarshifttv', 'com.ecojust.greenhousedialstv', 'com.ecojust.airlockbudgettv', 'com.ecojust.firebreakplannertv', 'com.ecojust.assemblykitchentv', 'com.ecojust.batteryexchangetv', 'com.ecojust.harborcounterweighttv', 'com.ecojust.sandglasssplittv', 'com.ecojust.pollinatorcontracttv', 'com.ecojust.reservoirseasonstv', 'com.ecojust.resonancebridgetv', 'com.ecojust.clockworkaligntv', 'com.ecojust.shadowshuttertv', 'com.ecojust.conveyorwindowtv', 'com.ecojust.pulsevaulttv', 'com.ecojust.beatbraidtv', 'com.ecojust.metronomegatestv', 'com.ecojust.rotorlocksmithtv', 'com.ecojust.frostbraketv', 'com.ecojust.pressuresealtv', 'com.ecojust.parallaxskylinetv', 'com.ecojust.shadowfoundrytv', 'com.ecojust.cableunweavertv', 'com.ecojust.moireateliertv', 'com.ecojust.kaleidokeystv', 'com.ecojust.packingsculptortv', 'com.ecojust.lensdistancetv', 'com.ecojust.stackdispatchtv'}

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
    # New launcher builds compile this sibling source tree. Historical refs do
    # not have it and keep their original source fingerprint unchanged.
    shared=subprocess.run(['git','rev-parse','--verify',ref+':resource/launcher/shared'],cwd=root,capture_output=True,text=True)
    if shared.returncode==0:
        selected+=('040000 tree '+shared.stdout.strip()+'\tshared\n').encode()
    return subprocess.check_output(['git','mktree'],cwd=root,input=selected).decode().strip()

def catalog_directories(root):
    directories={p.name for p in (root/'resource').iterdir() if p.is_dir()}
    assert {'launcher','apps'} <= directories <= {'launcher','apps','game-kit'},'Classify software under resource/launcher or resource/apps'
    # Shared game source/build tools are infrastructure, never a catalog item.
    kit=root/'resource/game-kit'
    if kit.exists():
        assert kit.is_dir() and not kit.is_symlink(),'Game Kit must be a regular source directory'
        assert not (kit/'resource.json').exists() and not any(kit.glob('*.apk')),'Publish Game Kit applications under resource/apps'
    for category in ('launcher','apps'):
        parent=root/'resource'/category
        assert parent.is_dir(),f'Missing resource/{category}'
        for directory in sorted(parent.iterdir()):
            if directory==root/'resource/launcher/shared':
                assert directory.is_dir() and not directory.is_symlink(),'Shared launcher sources must be a regular directory'
                assert not (directory/'resource.json').exists() and not any(directory.glob('*.apk')),'Publish launcher APKs under their own directories'
                continue
            if directory.is_dir() and not directory.name.startswith('.'):
                yield directory

def verify_catalog(root,tools,*,allow_unpublished_used_car=False,allow_unpublished_alien_shooter=False,allow_unpublished_putrtv_store=False):
    """Verify every published resource; builds may bootstrap registered new apps.

    Generated APKs under build/ are build inputs, not catalog resources. Only the
    exact new app directory can lack both metadata and top-level resource APKs.
    Publication callers keep the strict default, including the first release.
    """
    entries=[]
    for directory in catalog_directories(root):
        metadata=directory/'resource.json'
        source_only = ((allow_unpublished_used_car and directory==root/'resource/apps/used-car-racing')
                       or (allow_unpublished_alien_shooter and directory==root/'resource/apps/alien-shooter')
                       or (allow_unpublished_putrtv_store and directory==root/'resource/apps/putrtv-store'))
        if (source_only
                and not directory.is_symlink()
                and not metadata.exists() and not metadata.is_symlink()
                and not any(path.suffix.lower()=='.apk' for path in directory.iterdir())):
            continue
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
