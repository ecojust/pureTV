from pathlib import Path
import datetime,hashlib,importlib.util,json,os,subprocess
ROOT=Path('/dev/shm/puretv-submit');DOC=ROOT/'joystick-games/shared/windows/docs/remote-mac-source-scope-1';DOC.mkdir(exist_ok=False)
SOURCE='232d544079a472aa0ffb259c1bc73c692b94504d';paths=['joystick-games/tools/windows-inputs.py','joystick-games/shared/windows/tests/source-scope.test.py']
def sig(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
inventory={}
for name in paths+['joystick-games/shared/windows/tests/source-inputs.test.py']:
 data=(ROOT/name).read_bytes();target=DOC/'executed-source'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 if name in paths:inventory[name]=sig(data)
original={}
for name in ['joystick-games/tools/windows-inputs.py','joystick-games/backroad-rally/packages.json','joystick-games/backroad-rally/macos/README.md','joystick-games/backroad-rally/macos/SHA256SUMS.txt']:
 data=subprocess.check_output(['git','show',SOURCE+':'+name],cwd=ROOT);target=DOC/'original-232d'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);original[name]=sig(data)
prior=Path('/dev/shm/windows-host-tmp/three-diagnostics-232d/backroad-source-scope-reproduction.json');(DOC/'original-local-reproduction.json').write_bytes(prior.read_bytes())
commands=[]
for name,count in [('source-scope.test.py',32),('source-inputs.test.py',2)]:
 command=['python','-B','joystick-games/shared/windows/tests/'+name];result=subprocess.run(command,cwd=ROOT,env={**os.environ,'TMPDIR':'/dev/shm/windows-host-tmp','PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 (DOC/(name+'.log')).write_bytes(result.stdout);commands.append({'command':command,'returncode':result.returncode,'tests':count,'log':name+'.log',**sig(result.stdout)});assert result.returncode==0
p=ROOT/paths[0];spec=importlib.util.spec_from_file_location('verified_source_scope',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
selection=m.select('backroad-rally');blobs={name:{} for name in subprocess.check_output(['git','ls-tree','-r','--name-only',SOURCE],cwd=ROOT).decode().splitlines()};m.verify_complete_git_selection(selection,blobs)
remote=json.loads((ROOT/'joystick-games/backroad-rally/packages.json').read_text())['macos']['files'];assert all('joystick-games/backroad-rally/'+r['file'] not in selection['excluded'] for r in remote)
result={'status':'passed','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalSourceCommit':SOURCE,'originalWindowsRun':44628818020,'originalLocalReproduction':'original-local-reproduction.json','sourceInventory':inventory,'originalSourceInputs':original,'commands':commands,
 'actualBackroadScope':{'selectedFiles':len(selection['files']),'distFiles':len([p for p in selection['files'] if p.startswith('joystick-games/backroad-rally/dist/')]),'completeFrozenGitPathSetVerified':True,'remoteNamesNotExcluded':[r['file'] for r in remote],'remoteIndexInputs':{p:selection['files'][p] for p in ['joystick-games/backroad-rally/macos/README.md','joystick-games/backroad-rally/macos/SHA256SUMS.txt']}},
 'scope':'Source-selection correction only. Remote metadata is not downloaded or re-audited as a native package; all local package SHA/size/structure checks remain. No excluded output is created for a remote filename.',
 'intermediateLocalObservation':'After the first remote-record-only draft, the exact Backroad scan exposed macos/README.md plus SHA256SUMS.txt as an unclassified directory. That local failure was reported before adding the exact, hash-bound remote index. The original Windows build log is not yet available while the run is in progress.',
 'nativeWindowsExecutedForFix':False,'remoteArtifactsDownloaded':False,'newWorkflowDispatched':False}
write(DOC/'result.json',result)
(DOC/'README.md').write_text('''# 远端 Mac 发布包不应阻断 Windows 源选择

固定源 `232d5440` 的 Backroad 已将超过 Git 大小限制的 Mac 包放在明确的 GitHub Release 资产中。本地执行该固定源的原 windows-inputs.py 必然在“Missing or symlinked published package”停止，因为它仍要求源码目录里存在两份远端包。原 Windows run 44628818020 的 Backroad build 已失败，但整体运行进行中时原 build.log 尚未可取；本记录不把本地复现冒称已读到原 CI 首个错误。

修复仅用于显式 `storage: github-release-asset` 的 Mac 项：原文件名、扩展、别名、大小、SHA 校验仍先执行；releaseTag 必须匹配本游戏/version，URL 必须是本仓库该 tag 下的精确文件，releaseId/assetId 为正整数。本地若出现同名文件、目录或链接则拒绝。远端文件名不会加入任何 output 排除集合，因此不能隐藏 checkout 中缺失的原 Git 文件。

若存在 macos 索引目录，只接受 README.md 与逐项匹配全部声明的 SHA256SUMS.txt，以及原本已严格校验的本地包。两份索引自身作为源配置参与哈希；未知脚本、未声明二进制、链接、缺失/错误校验行仍拒绝。未下载或重验远端 Mac 包，不把其历史交付状态变成新 Windows 验收。

32 个 source-scope 边界和 2 个真实 Git 输入测试通过；实际 Backroad 928 文件（含 333 个 dist 文件）的完整固定 Git 路径集合检查通过。原本地失败、原元数据与实际执行源码/日志均保留；下一次只需重建 Backroad，本次 Pon/Royale 原运行保持。
''')
os.link(Path(__file__),DOC/'executed-freeze-validation.py')
files={p.relative_to(ROOT).as_posix():sig(p.read_bytes()) for p in DOC.rglob('*') if p.is_file()}
freeze=Path('/dev/shm/windows-host-tmp/remote-mac-source-scope-freeze.json');write(freeze,{'sourceFiles':inventory,'evidenceFiles':files,'status':'stable_for_independent_review'})
print(json.dumps({'sourceFiles':inventory,'evidenceFiles':len(files),'evidenceBytes':sum(v['bytes'] for v in files.values()),'freeze':str(freeze),'freezeSha256':sig(freeze.read_bytes())['sha256']},indent=2))
