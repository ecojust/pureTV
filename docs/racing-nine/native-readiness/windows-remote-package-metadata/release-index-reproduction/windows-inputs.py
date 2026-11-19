#!/usr/bin/env python3
"""Explicit Windows build/derivation/QA closure, excluding historical outputs."""
import hashlib,json,os,re,stat,struct,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
HOST='joystick-games/shared/windows'
TOOLS=('windows-inputs.py','windows-build.py','windows-packages.py','windows-verify.py','windows-display.py','windows-observation.py','windows-evidence.py','windows-export.py','macos-verify.py','qa-plan.py','asset-policy.py')
WORKFLOW='.github/workflows/joystick-catalog-windows.yml'
GAME_REQUIRED=('game.json','package.json','package-lock.json','build.mjs','qa-plan.json','NOTICE.md')
GAME_DIRS={'src','dist','test','tests','qa','assets','public','vendor'}
CACHE={'node_modules','__pycache__','.cache','.git'}
PLATFORMS={'windows','macos','android'}

def is_link(path):return path.is_symlink() or (getattr(path,'is_junction',lambda:False)())

def regular(root,path):
    path=Path(os.path.abspath(path));root=Path(os.path.abspath(root))
    assert path.is_relative_to(root),'Input escapes repository: '+str(path)
    assert not any(is_link(p) for p in [path,*path.parents]),'Symlink source traversal: '+str(path)
    assert path.is_file(),'Required source file missing: '+str(path)
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

class Scope:
    def __init__(self,root):self.root=Path(os.path.abspath(root));self.paths={};self.excluded={};self.local_seen=set();self.remote_packages={}
    def add(self,path,role):
        path=Path(os.path.abspath(path));regular(self.root,path)
        self.paths.setdefault(path,set()).add(role)
    def exclude(self,path,reason):self.excluded[Path(path).relative_to(self.root).as_posix()]=reason
    def tree(self,path,role):
        path=Path(path);assert path.is_dir() and not is_link(path),'Required source directory missing or symlinked: '+str(path)
        for item in sorted(path.iterdir()):
            if item.name in CACHE:
                assert role!='packaged-assets','Cache or dependency directory inside packaged assets: '+str(item)
                self.exclude(item,'installed dependency or cache');continue
            assert not is_link(item),'Symlink in source tree: '+str(item)
            if item.is_dir():self.tree(item,role)
            else:self.add(item,role)
    def local_package(self,path):
        path=Path(os.path.abspath(path));assert path.is_relative_to(self.root),'Local dependency escapes repository'
        assert not any(is_link(p) for p in [path,*path.parents]),'Symlink local dependency'
        if path in self.local_seen:return
        self.local_seen.add(path)
        if path.is_file():self.add(path,'local-dependency');return
        assert (path/'package.json').is_file(),'Local package missing package.json: '+str(path)
        self.tree(path,'local-dependency');self.dependencies(path)
    def dependencies(self,package):
        manifest=json.loads((package/'package.json').read_text(encoding='utf-8'))
        for kind in ('dependencies','devDependencies','optionalDependencies','peerDependencies'):
            for spec in manifest.get(kind,{}).values():
                if not isinstance(spec,str):raise AssertionError('Invalid dependency version')
                if spec.startswith('file:'):
                    assert spec[5:],'Empty file dependency'
                    self.local_package(package/spec[5:])
                elif spec.startswith(('link:','workspace:')):raise AssertionError('Unsupported local dependency form: '+spec)
        lock=package/'package-lock.json'
        if lock.is_file():
            data=json.loads(lock.read_text(encoding='utf-8'))
            def records(value):
                if isinstance(value,dict):
                    yield value
                    for child in value.values():yield from records(child)
                elif isinstance(value,list):
                    for child in value:yield from records(child)
            for item in records(data):
                resolved=item.get('resolved','')
                if item.get('link'):
                    assert isinstance(resolved,str) and resolved and not re.match(r'[a-z]+:',resolved),'Invalid lock local link'
                    self.local_package(package/resolved)
                elif isinstance(resolved,str) and resolved.startswith('file:'):self.local_package(package/resolved[5:])
    def result(self):
        return {'schemaVersion':1,'files':{p.relative_to(self.root).as_posix():dict(regular(self.root,p),roles=sorted(roles)) for p,roles in sorted(self.paths.items())},'excluded':dict(sorted(self.excluded.items()))}

def package_json(raw):
    def unique(pairs):
        value={}
        for key,item in pairs:
            assert key not in value,'Duplicate packages.json key: '+key
            value[key]=item
        return value
    return json.loads(raw,object_pairs_hook=unique)

def pe_header(stream,size):
    assert size>=64 and stream.read(2)==b'MZ','Published EXE is not PE'
    stream.seek(60);offset=struct.unpack('<I',stream.read(4))[0]
    assert 64<=offset<=min(size-6,1_048_576),'Invalid published PE header offset'
    stream.seek(offset);assert stream.read(4)==b'PE\0\0','Published EXE is not PE'

def published_format(path,platform):
    if path.suffix=='.exe':
        with path.open('rb') as stream:pe_header(stream,path.stat().st_size)
    elif path.suffix=='.dmg':
        assert path.stat().st_size>=512,'Published DMG is truncated'
        with path.open('rb') as stream:stream.seek(-512,2);assert stream.read(4)==b'koly','Published DMG lacks UDIF trailer'
    else:
        try:
            with zipfile.ZipFile(path) as archive:
                items=archive.infolist();names=set();files={}
                for item in items:
                    name=item.filename;parts=name.rstrip('/').split('/')
                    assert name and not name.startswith('/') and '\\' not in name and all(p not in ('','..','.') for p in parts),'Unsafe published archive path'
                    assert name.casefold() not in names and not item.flag_bits&1 and not stat.S_ISLNK(item.external_attr>>16),'Aliased/encrypted/symlinked published archive'
                    names.add(name.casefold())
                    if not item.is_dir():files[name]=item
                if platform=='android':
                    assert 'AndroidManifest.xml' in files and 'classes.dex' in files,'Published APK lacks Android payload'
                    with archive.open('classes.dex') as stream:assert stream.read(4)==b'dex\n','Published APK lacks DEX payload'
                elif platform=='macos':
                    binaries=[name for name in files if re.fullmatch(r'[^/]+\.app/Contents/MacOS/[^/]+',name)]
                    assert len(binaries)==1 and binaries[0].split('/Contents/')[0]+'/Contents/Info.plist' in files,'Published Mac ZIP lacks app payload'
                    with archive.open(binaries[0]) as stream:assert stream.read(4) in (b'\xca\xfe\xba\xbe',b'\xbe\xba\xfe\xca',b'\xca\xfe\xba\xbf',b'\xcf\xfa\xed\xfe',b'\xfe\xed\xfa\xcf'),'Published Mac ZIP lacks Mach-O payload'
                else:
                    binaries=[name for name in files if name.split('/')[-1]=='PureTVGame.exe']
                    assert len(binaries)==1,'Published Windows ZIP lacks host payload'
                    with archive.open(binaries[0]) as stream:pe_header(stream,files[binaries[0]].file_size)
        except (OSError,zipfile.BadZipFile,RuntimeError) as error:raise AssertionError('Invalid published archive: '+str(path)) from error

def declared_package_outputs(scope,game):
    path=game/'packages.json'
    if not path.exists():return {}
    scope.add(path,'scope-configuration');meta=package_json(path.read_text(encoding='utf-8'))
    assert type(meta.get('schemaVersion')) is int and meta['schemaVersion']==1 and meta.get('game')==game.name,'Invalid packages.json identity'
    endings={'android':('.apk',),'macos':('-macos-universal.zip','-macos-universal.dmg'),'windows':('-windows-x64.zip','-windows-x64-setup.exe')}
    result={};aliases=set()
    for platform in ('android','macos','windows'):
        if platform not in meta:continue
        descriptor=meta[platform];assert isinstance(descriptor,dict),'Invalid platform package descriptor'
        if descriptor.get('status')=='pending':
            assert 'files' not in descriptor and 'file' not in descriptor,'Pending platform declares artifacts';continue
        if platform=='android':
            assert 'files' not in descriptor,'Android package uses its exact file record';items=[descriptor]
        else:
            assert 'file' not in descriptor and isinstance(descriptor.get('files'),list) and descriptor['files'],'Platform package files missing';items=descriptor['files']
        for item in items:
            assert isinstance(item,dict),'Invalid published package record'
            name=item.get('file');assert isinstance(name,str),'Published package path missing'
            parts=name.split('/')
            assert len(parts) in (1,2) and (len(parts)==1 or parts[0]==platform) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]*',parts[-1]),'Unsafe published package path'
            assert parts[-1].endswith(endings[platform]),'Published package platform suffix mismatch'
            assert name.casefold() not in aliases,'Duplicate published package path';aliases.add(name.casefold())
            size=item.get('bytes');digest=item.get('sha256')
            assert type(size) is int and size>0 and isinstance(digest,str) and re.fullmatch('[a-f0-9]{64}',digest),'Invalid published package size/hash'
            if 'storage' in item:
                # A published release asset is metadata, not a local build
                # output. Never add its name to the exclusion set: otherwise a
                # remote declaration could conceal a missing tracked input.
                assert item['storage']=='github-release-asset','Unsupported published package storage'
                tag=descriptor.get('releaseTag');version=descriptor.get('version')
                assert isinstance(version,str) and re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',version),'Invalid remote release version'
                assert tag=='joystick-'+game.name+'-v'+version,'Remote release tag differs from game/version'
                assert len(parts)==1,'Remote package name must be a basename'
                assert item.get('url')=='https://github.com/ecojust/pureTV/releases/download/'+tag+'/'+name,'Remote package URL differs from exact release identity'
                assert all(type(value) is int and 0<value<2**63 for value in (descriptor.get('releaseId'),item.get('assetId'))),'Invalid remote release/asset ID'
                target=game/name
                assert not target.exists() and not is_link(target),'Remote package declaration conflicts with a local node'
                scope.remote_packages[platform+'/'+name]={'bytes':size,'sha256':digest}
                continue
            target=game/name;assert target.is_file() and not any(is_link(p) for p in [target,*target.parents]),'Missing or symlinked published package'
            assert target.stat().st_size==size,'Published package size mismatch: '+name
            h=hashlib.sha256()
            with target.open('rb') as stream:
                for block in iter(lambda:stream.read(1024*1024),b''):h.update(block)
            assert h.hexdigest()==digest,'Published package hash mismatch: '+name
            published_format(target,platform);result[name]={'bytes':size,'sha256':digest}
    return result

def published_directory(scope,game,path,declared):
    """Verify local payloads or an exact remote index; keep index bytes bound."""
    expected={name:record for name,record in declared.items() if name.startswith(path.name+'/')}
    remote={name:record for name,record in scope.remote_packages.items() if name.startswith(path.name+'/')}
    assert expected or remote,'Unclassified game root directory: '+str(path)
    assert not ({Path(n).name.casefold() for n in expected}&{Path(n).name.casefold() for n in remote}),'Ambiguous local and remote package basename'
    if remote:assert (path/'SHA256SUMS.txt').is_file(),'Remote package index requires exact checksum list'
    for item in sorted(path.iterdir()):
        assert item.is_file() and not is_link(item),'Unexpected node in published package directory: '+str(item)
        name=item.relative_to(game).as_posix()
        if name in expected:scope.exclude(item,'published artifact verified by packages.json');continue
        if remote and item.name=='README.md':scope.add(item,'scope-configuration');continue
        assert item.name=='SHA256SUMS.txt','Undeclared file in published package directory: '+name
        lines=item.read_text(encoding='utf-8').splitlines();checks={}
        for line in lines:
            match=re.fullmatch(r'([a-f0-9]{64})  ([A-Za-z0-9][A-Za-z0-9_.-]*)',line)
            assert match and match[2] not in checks,'Invalid published checksum list'
            checks[match[2]]=match[1]
        assert checks=={Path(name).name:r['sha256'] for name,r in {**expected,**remote}.items()},'Published checksum list differs from packages.json'
        scope.add(item,'scope-configuration')

def release_outputs(scope,game):
    outputs=set()
    for platform in ('android','macos','windows'):
        path=game/(platform+'-release.json')
        if not path.exists():continue
        scope.add(path,'scope-configuration');meta=json.loads(path.read_text(encoding='utf-8'));assert meta.get('game')==game.name,'Release descriptor game mismatch'
        items=[meta['apk']['file']] if platform=='android' else list(meta.get('packages',{}))
        for name in items:
            assert isinstance(name,str) and Path(name).name==name and '/' not in name and '\\' not in name,'Unsafe release output name'
            endings={'android':('.apk',),'macos':('-macos-universal.zip','-macos-universal.dmg'),'windows':('-windows-x64.zip','-windows-x64-setup.exe')}
            assert name.endswith(endings[platform]),'Unrecognized release output: '+name
            outputs.add(name)
    return outputs

def select(game,root=ROOT):
    assert re.fullmatch('[a-z0-9-]+',game),'Invalid game slug'
    scope=Scope(root);root=scope.root;game=root/'joystick-games'/game;host=root/HOST
    for name in ('CMakeLists.txt','dependencies.json','README.md','.gitattributes','.gitignore'):scope.add(host/name,'host-build')
    for name in ('Sources','Web','tests'):scope.tree(host/name,'host-build' if name!='tests' else 'qa')
    if (host/'docs').exists():scope.exclude(host/'docs','historical evidence; preserved at original source/run')
    for name in TOOLS:scope.add(root/'joystick-games/tools'/name,'qa' if name not in ('windows-build.py','windows-inputs.py') else 'host-build')
    for name in (WORKFLOW,'joystick-games/catalog-registry.json','puretv-joystick/joystick_sdk.py'):scope.add(root/name,'qa')
    shared=root/'joystick-games/shared';assert (shared/'web').is_dir(),'Required shared/web missing'
    for directory in sorted(shared.iterdir()):
        if directory.name in PLATFORMS or directory.name=='docs':continue
        if directory.is_dir():scope.tree(directory,'shared-derivation')
        else:scope.add(directory,'shared-derivation')
    for name in GAME_REQUIRED:scope.add(game/name,'game-metadata' if name=='game.json' else 'game-derivation')
    for name in ('src','dist'):assert (game/name).is_dir(),'Required game tree missing: '+name
    licenses=[game/name for name in ('LICENSE','LICENSE.txt') if (game/name).exists()];assert len(licenses)==1,'Exactly one original LICENSE required'
    declared=declared_package_outputs(scope,game);outputs=release_outputs(scope,game)|set(declared)
    for name in outputs:scope.exclude(game/name,'published artifact declared by platform release descriptor')
    for path in sorted(game.iterdir()):
        if path.name in CACHE or path.name=='docs':scope.exclude(path,'installed dependency/cache' if path.name in CACHE else 'historical evidence');continue
        if path.name in outputs:scope.exclude(path,'published artifact declared by platform release descriptor');continue
        assert not is_link(path),'Symlink game input: '+str(path)
        if path.is_dir():
            if path.name in PLATFORMS and any(name.startswith(path.name+'/') for name in [*declared,*scope.remote_packages]):
                published_directory(scope,game,path,declared);continue
            assert path.name in GAME_DIRS,'Unclassified game root directory: '+str(path)
            scope.tree(path,'packaged-assets' if path.name=='dist' else 'game-derivation')
        else:scope.add(path,'game-derivation')
    scope.local_seen.add(game);scope.dependencies(game)
    result=scope.result();result['game']=game.name;result['localDependencyRoots']=[p.relative_to(root).as_posix() for p in sorted(scope.local_seen) if p!=game]
    return result

def file_records(selection):return {name:{'bytes':item['bytes'],'sha256':item['sha256']} for name,item in selection['files'].items()}

def executed_sources(selection):
    """Code actually executed by native CI; asset bytes stay Git/hash-bound."""
    return [name for name,item in selection['files'].items() if any(role in ('host-build','qa','scope-configuration') for role in item['roles']) or name.endswith(('/qa-plan.json','/build.mjs','/package.json','/package-lock.json'))]

def verify_complete_git_selection(selection,source_blobs):
    """Reject tracked deletions too, not only dirty bytes of remaining files."""
    selected=set(selection['files']);game='joystick-games/'+selection['game']+'/'
    shared='joystick-games/shared/';expected=set()
    for name in source_blobs:
        if name in selected:expected.add(name);continue
        parts=Path(name).parts
        if any(part in CACHE for part in parts) and not name.startswith(game+'dist/'):continue
        include=False
        if name.startswith(game):
            relative=name[len(game):];include=relative.split('/')[0]!='docs' and name not in selection['excluded']
        elif name.startswith(shared):
            relative=name[len(shared):];family=relative.split('/')[0]
            include=family not in PLATFORMS and family!='docs'
            if family=='windows':include=relative.split('/')[1:2] in (['Sources'],['Web'],['tests'])
        if any(name==local or name.startswith(local+'/') for local in selection['localDependencyRoots']):include=True
        if include:expected.add(name)
    assert expected==selected, 'Frozen source closure missing or adds files: '+str({'missing':sorted(expected-selected),'untracked':sorted(selected-expected)})
