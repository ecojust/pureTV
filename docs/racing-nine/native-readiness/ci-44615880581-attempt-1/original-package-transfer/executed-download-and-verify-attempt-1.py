from pathlib import Path
import hashlib,json,os,re,stat,subprocess,urllib.parse,zipfile

OUT=Path('/dev/shm/root-mac03-v3-transfer')
ROOT=Path('/dev/shm/puretv-submit')
SOURCE='6c7cb4fdb99dce236b634c842326bae6aed5f232'
RUN=44615880581
ARTIFACT=14575925502
SIZE=8448180
DIGEST='9f28f623a7577ced8fce67fef84093fc0edd42dedf4c812cf197347ed2b66a7a'
GAMES=('turbo-kart-rush','kart-rush','kart-royale')

def write(name,data):(OUT/name).write_text(json.dumps(data,indent=2)+'\n')
def sig(path):
    digest=hashlib.sha256();size=0
    with path.open('rb') as stream:
        while block:=stream.read(1024*1024):digest.update(block);size+=len(block)
    return {'bytes':size,'sha256':digest.hexdigest()}
def redact_urls(text):
    def replace(match):
        parsed=urllib.parse.urlsplit(match.group(0))
        return urllib.parse.urlunsplit((parsed.scheme,parsed.netloc,parsed.path,'',''))
    return re.sub(r'https?://[^\s<>\"\']+',replace,text)

receipt=json.loads((OUT/'original-transfer-receipt.json').read_text())
assert receipt['status']=='passed' and receipt['request']['source']==SOURCE and receipt['request']['run']==RUN and receipt['request']['artifact']==ARTIFACT
asset=json.loads((OUT/'release-asset-metadata.json').read_text())
assert asset['id']==receipt['assetId']==769385152 and asset['size']==SIZE and asset['digest']=='sha256:'+DIGEST
wrapper=OUT/('artifact-'+str(ARTIFACT)+'.zip')
assert not wrapper.exists()
with wrapper.open('xb') as output:
    result=subprocess.run(['gh','api','repos/ecojust/pureTV/releases/assets/'+str(asset['id']),'-H','Accept: application/octet-stream'],stdout=output,stderr=subprocess.PIPE,timeout=180)
write('download-status.json',{'returncode':result.returncode,'stderr':redact_urls(result.stderr.decode('utf-8',errors='replace')),'assetId':asset['id'],'signedDownloadUrlRecorded':False})
assert result.returncode==0,'Draft asset GET failed; original response status retained'
assert sig(wrapper)=={'bytes':SIZE,'sha256':DIGEST},'Full original wrapper size/SHA256 mismatch'
registry=json.loads(subprocess.check_output(['git','show',SOURCE+':joystick-games/catalog-registry.json'],cwd=ROOT))
assert registry['batches']['racing-03']==list(GAMES)
expected=set()
for game in GAMES:
    meta=json.loads(subprocess.check_output(['git','show',SOURCE+':joystick-games/'+game+'/game.json'],cwd=ROOT))
    stem=registry['games'][game]['appName']+'-'+meta['version']+'-macos-universal'
    expected.update(game+'/'+name for name in (stem+'.zip',stem+'.dmg','build-manifest.json','SHA256SUMS.txt'))
destination=OUT/'packages';assert not destination.exists()
records=[]
with zipfile.ZipFile(wrapper) as archive:
    entries=archive.infolist();assert 12<=len(entries)<=15
    names=set();actual_files=set();expanded=0
    for item in entries:
        name=item.filename;assert name and not name.startswith(('/','\\')) and '\\' not in name
        parts=name.rstrip('/').split('/');assert len(parts) in (1,2) and parts[0] in GAMES
        assert all(re.fullmatch('[A-Za-z0-9][A-Za-z0-9_.-]*',part) and part not in ('.','..') and not part.endswith('.') for part in parts)
        assert name.casefold() not in names;names.add(name.casefold())
        mode=stat.S_IFMT(item.external_attr>>16)
        assert not item.flag_bits&1 and item.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED)
        if item.is_dir():assert len(parts)==1 and mode in (0,stat.S_IFDIR);continue
        assert len(parts)==2 and name in expected and mode in (0,stat.S_IFREG)
        assert 0<item.file_size<=32000000
        expanded+=item.file_size;assert expanded<=64000000
        actual_files.add(name)
    assert actual_files==expected,'Outer artifact file set differs from frozen three-game package list'
    destination.mkdir()
    for item in entries:
        if item.is_dir():continue
        target=destination/item.filename;target.parent.mkdir(exist_ok=True)
        digest=hashlib.sha256();size=0
        with archive.open(item) as source,target.open('xb') as output:
            while block:=source.read(1024*1024):
                size+=len(block);assert size<=item.file_size
                digest.update(block);output.write(block)
        assert size==item.file_size
        records.append({'path':item.filename,'bytes':size,'sha256':digest.hexdigest(),'compressedBytes':item.compress_size})
write('verified-wrapper.json',{'assetId':asset['id'],'draftReleaseId':451967756,'draftStillUnpublished':True,
    'sourceRunId':RUN,'sourceCommit':SOURCE,'originalArtifactId':ARTIFACT,'bytes':SIZE,'sha256':DIGEST,
    'fullGetVerified':True,'originalWrapperNotRepacked':True,'fileCount':len(records),'files':records})
packages=[]
for game in GAMES:
    folder=destination/game;meta=json.loads((folder/'build-manifest.json').read_text())
    assert meta['game']==game and meta['sourceCommit']==SOURCE and meta['committedInputsVerified'] is True
    assert meta['bundleIdentifier']==registry['games'][game]['packageName'] and meta['appName']==registry['games'][game]['appName']+'.app'
    assert set(meta['architectures'])=={'arm64','x86_64'} and meta['signature']=='ad-hoc' and meta['appleNotarized'] is False
    assert len(meta['packages'])==2 and {Path(n).suffix for n in meta['packages']}=={'.zip','.dmg'}
    checksum={}
    for line in (folder/'SHA256SUMS.txt').read_text().splitlines():
        digest,name=line.split('  ',1);assert name not in checksum;checksum[name]=digest
    assert checksum=={n:s['sha256'] for n,s in meta['packages'].items()}
    for name,record in meta['packages'].items():
        assert game+'/'+name in expected and sig(folder/name)==record
        packages.append(dict(file=game+'/'+name,**record))
write('extracted-package-verification.json',{'status':'archive_and_package_hashes_passed','sourceCommit':SOURCE,'sourceRunId':RUN,
    'transferRunId':44622059122,'receiptExportCommit':'95f7dfb56d1b3d1897922acedfafe1414e19420c','archiveSha256':DIGEST,
    'packageFiles':packages,'nativeRuntimeStatus':'separate_not_assumed','completeSourceClosureStatus':'pending_native_agent_independent_audit',
    'innerAppMachOAndResourceVerification':'pending_native_agent_independent_audit','releasePublished':False,'gameMetadataModified':False})
print(json.dumps({'status':'original_wrapper_and_six_package_hashes_passed','directory':str(destination),'wrapperBytes':SIZE,'files':len(records),'packages':len(packages)}))
