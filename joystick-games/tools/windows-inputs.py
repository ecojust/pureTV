#!/usr/bin/env python3
"""Explicit Windows build/derivation/QA closure, excluding historical outputs."""
import hashlib,json,os,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
HOST='joystick-games/shared/windows'
TOOLS=('windows-inputs.py','windows-build.py','windows-packages.py','windows-verify.py','windows-evidence.py','windows-export.py','macos-verify.py','qa-plan.py','asset-policy.py')
WORKFLOW='.github/workflows/joystick-catalog-windows.yml'
GAME_REQUIRED=('game.json','package.json','package-lock.json','build.mjs','qa-plan.json','NOTICE.md')
GAME_DIRS={'src','dist','test','tests','qa','assets','public','vendor'}
CACHE={'node_modules','__pycache__','.cache','.git'}
PLATFORMS={'windows','macos','android'}

def regular(root,path):
    path=Path(os.path.abspath(path));root=Path(os.path.abspath(root))
    assert path.is_relative_to(root),'Input escapes repository: '+str(path)
    assert not any(p.is_symlink() for p in [path,*path.parents]),'Symlink source traversal: '+str(path)
    assert path.is_file(),'Required source file missing: '+str(path)
    data=path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

class Scope:
    def __init__(self,root):self.root=Path(os.path.abspath(root));self.paths={};self.excluded={};self.local_seen=set()
    def add(self,path,role):
        path=Path(os.path.abspath(path));regular(self.root,path)
        self.paths.setdefault(path,set()).add(role)
    def exclude(self,path,reason):self.excluded[Path(path).relative_to(self.root).as_posix()]=reason
    def tree(self,path,role):
        path=Path(path);assert path.is_dir() and not path.is_symlink(),'Required source directory missing or symlinked: '+str(path)
        for item in sorted(path.iterdir()):
            if item.name in CACHE:
                assert role!='packaged-assets','Cache or dependency directory inside packaged assets: '+str(item)
                self.exclude(item,'installed dependency or cache');continue
            assert not item.is_symlink(),'Symlink in source tree: '+str(item)
            if item.is_dir():self.tree(item,role)
            else:self.add(item,role)
    def local_package(self,path):
        path=Path(os.path.abspath(path));assert path.is_relative_to(self.root),'Local dependency escapes repository'
        assert not any(p.is_symlink() for p in [path,*path.parents]),'Symlink local dependency'
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
    outputs=release_outputs(scope,game)
    for name in outputs:scope.exclude(game/name,'published artifact declared by platform release descriptor')
    for path in sorted(game.iterdir()):
        if path.name in CACHE or path.name=='docs':scope.exclude(path,'installed dependency/cache' if path.name in CACHE else 'historical evidence');continue
        if path.name in outputs:scope.exclude(path,'published artifact declared by platform release descriptor');continue
        assert not path.is_symlink(),'Symlink game input: '+str(path)
        if path.is_dir():
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
