from pathlib import Path
import datetime, hashlib, importlib.util, json, os, re, subprocess

ROOT=Path('/dev/shm/puretv-submit')
SCRATCH=Path('/dev/shm/windows-host-tmp')
ORIGINAL=Path('/dev/shm/root-windows-four')
games=['night-racer','penguintrack','last-track','dirt-crown']
before=json.loads((SCRATCH/'windows-four-materialization.json').read_text())
summary=json.loads((ORIGINAL/'summary.json').read_text())

def sig(p):
    data=p.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')

def hardlink(src,dst):
    assert src.is_file() and not dst.exists()
    os.link(src,dst)
    assert os.path.samefile(src,dst)

spec=importlib.util.spec_from_file_location('windows_inputs',ROOT/'joystick-games/tools/windows-inputs.py')
scope=importlib.util.module_from_spec(spec);spec.loader.exec_module(scope)
all_files={}
for game in games:
    folder=ROOT/'joystick-games'/game;docs=folder/'docs/windows-delivery'
    source_review=ROOT/'docs/racing-nine/native-readiness'/('windows-four-independent-visual-review.json' if game in ('night-racer','penguintrack') else 'windows-last-dirt-visual-review.json')
    original_review=json.loads(source_review.read_text())
    hardlink(source_review,docs/'original-visual-review.json')
    review=json.loads((docs/'visual-review.json').read_text())
    if game in ('last-track','dirt-crown'):
        matching={n.removeprefix('original-files/'):r for n,r in original_review['images'].items() if '/joystick-windows-evidence-'+game+'/' in n}
        assert len(matching)==8 and all(r['actuallyViewed'] for r in matching.values())
        review.update(status='reviewed',reviewer='root',originalScreenshotsActuallyViewed=[dict(path=n,**r) for n,r in matching.items()],observations=original_review['findings'][game],limitations=original_review['limitations'])
    else:review['reviewer']='racing_windows_host'
    review['originalReview']='original-visual-review.json';review['originalReviewSha256']=sig(source_review)['sha256']
    assert len(review['originalScreenshotsActuallyViewed'])==8 and review['status']=='reviewed'
    for image in review['originalScreenshotsActuallyViewed']:
        name=image['path'].split('/',1)[1]
        assert sig(docs/'original-evidence'/name)=={k:image[k] for k in ('bytes','sha256')}
    write(docs/'visual-review.json',review)
    if game=='dirt-crown':
        android_preparation=folder/'docs/android-runtime-44608423645/delivery-preparation.json'
        frozen=subprocess.check_output(['git','show','f57e091:'+android_preparation.relative_to(ROOT).as_posix()],cwd=ROOT)
        assert android_preparation.read_bytes()==frozen
        text=(docs/'README.md').read_text()
        text+='\n此前 Android [delivery-preparation.json](../android-runtime-44608423645/delivery-preparation.json) 保留交付提交 `f57e091` 当时的准备文件哈希；本次新增 Windows 下载后根 README/packages.json 有追加，该旧准备记录不用于声称当前全部平台入口未变。原 Android APK、平台元数据及旧证据保持原样。\n'
        (docs/'README.md').write_text(text)
    hardlink(SCRATCH/'windows-four-materialize.py',docs/'executed-delivery-materialization.py')
    hardlink(Path(__file__),docs/'executed-delivery-finalization-validation.py')
    meta=json.loads((folder/'packages.json').read_text());release=json.loads((folder/'windows-release.json').read_text())
    previous=before[game]['otherPlatformsBefore']
    if previous is not None:assert {k:v for k,v in meta.items() if k!='windows'}==previous
    assert meta['windows']['status']=='verified' and meta['windows']['packages']==release['packages']==summary['games'][game]['packages']
    assert release['sourceCommit']=='6c7cb4fdb99dce236b634c842326bae6aed5f232'
    assert release['originalRunConclusion']=='failure' and release['selectedOriginalVerifyJobConclusion']=='success'
    assert release['authenticodeSigned'] is False and release['dpiScalesTested']==[96] and release['additionalDpiScalesTested'] is False
    original_packages=ORIGINAL/'original-files'/('joystick-windows-packages-'+game)
    for name,expected in release['packages'].items():
        assert sig(folder/name)==expected and os.path.samefile(folder/name,original_packages/name)
    # Exercise the declared-output parser only, not the 1,177-source derivation audit.
    declared=scope.declared_package_outputs(scope.Scope(ROOT),folder)
    assert all(declared[name]==item for name,item in release['packages'].items())
    records={}
    for line in (folder/'SHA256SUMS.txt').read_text().splitlines():
        digest,name=line.split('  ',1);assert name not in records
        records[name]=digest;assert sig(folder/name)['sha256']==digest
    assert all(records[name]==item['sha256'] for name,item in release['packages'].items())
    for path in [folder/'README.md',docs/'README.md']:
        for destination in re.findall(r'\]\(([^)]+)\)',path.read_text()):
            if '://' in destination or destination.startswith('#'):continue
            assert (path.parent/destination.split('#')[0]).exists(),(path,destination)
    retained=json.loads((docs/'retained-original-files.json').read_text())
    for item in retained['files']:
        assert sig(docs/item['path'])=={k:item[k] for k in ('bytes','sha256')}
    own_files=[folder/name for name in before[game]['rootFiles']]+sorted(p for p in docs.rglob('*') if p.is_file())
    records={p.relative_to(ROOT).as_posix():sig(p) for p in own_files}
    preparation={'status':'prepared_in_worktree_not_committed_or_pushed','preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'game':game,'originalSourceCommit':release['sourceCommit'],'originalRunId':44615299245,
        'originalExportCommit':release['exportCommit'],'originalOverallRunConclusion':'failure','selectedGameRuntimeStatus':'passed',
        'rootPackageHardlinksVerified':True,'declaredPackageOutputParserPassed':True,'checksumsAndReadmeLinksPassed':True,
        'originalRetainedEvidenceChecksPassed':True,'actualScreenshotsReviewed':8,'otherPlatformsMetadataUnchanged':True if previous is not None else 'no_previous_manifest',
        'nativeTestsRerun':False,'sourceAuditRepeated':False,'packageBytesRebuilt':False,'files':records,
        'scope':'These exact prepared files only; this record excludes itself. Earlier platform delivery preparations remain unchanged at their original commit.'}
    write(docs/'delivery-preparation.json',preparation)
    records[(docs/'delivery-preparation.json').relative_to(ROOT).as_posix()]=sig(docs/'delivery-preparation.json')
    all_files.update(records)

record={'status':'stable_ready_for_root_review_commit','preparedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourceRunId':44615299245,'gameCount':4,'packageCount':8,'allPackagesHardlinked':True,
    'screenshotsRetained':48,'screenshotsActuallyReviewed':32,'files':all_files}
write(SCRATCH/'windows-four-freeze.json',record)
print(json.dumps({'manifest':str(SCRATCH/'windows-four-freeze.json'),'files':len(all_files),'bytes':sum(v['bytes'] for v in all_files.values()),'sha256':sig(SCRATCH/'windows-four-freeze.json')['sha256']},indent=2))
