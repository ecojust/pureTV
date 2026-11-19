from pathlib import Path
import ast,hashlib,json,os,subprocess,datetime
ROOT=Path('/dev/shm/puretv-submit');HOST=Path('joystick-games/shared/windows')
DOC=ROOT/HOST/'docs/startup-diagnostics-1';DOC.mkdir(exist_ok=False)
SOURCE='039d210cfa4cc65f59adf0859a777f3591853a70';EXPORT='f559a71e99ff27c8f262ed2a82a70674ee90f9dc'
paths=[HOST/x for x in ('Sources/main.cpp','Sources/DiagnosticLog.hpp','CMakeLists.txt','tests/diagnostic-log.test.cpp','tests/navigation-storage.test.py','tests/navigation-observation.py','tests/navigation-observation.test.py','tests/diagnostic-suspend.test.mjs')]
def sig(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def write(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def git(ref,path):return subprocess.check_output(['git','show',ref+':'+path],cwd=ROOT)
inventory={}
for path in paths:
 data=(ROOT/path).read_bytes();inventory[path.as_posix()]=sig(data)
 target=DOC/'executed-source'/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
scope='joystick-windows-evidence-ponpoko-kart';manifest=json.loads(git(EXPORT,scope+'/evidence-manifest.json'));original={}
for name in ['evidence-manifest.json','runtime-bootstrap/report.json','runtime-bootstrap.log','runtime-bootstrap/native-preferences-after-run.json','runtime-bootstrap/native.log','package-verification.json']:
 data=git(EXPORT,scope+'/'+name)
 if name!='evidence-manifest.json':assert sig(data)==manifest['files'][name]
 target=DOC/'original-pon'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);original[scope+'/'+name]=sig(data)
old=git(SOURCE,(HOST/'tests/navigation-storage.test.py').as_posix());(DOC/'original-navigation-storage.test.py').write_bytes(old)
before=ast.parse(old);after=ast.parse((ROOT/HOST/'tests/navigation-storage.test.py').read_text())
def page(module):return next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='PAGE' for t in n.targets))
def checks(module):return [ast.dump(n,include_attributes=False) for n in ast.walk(module) if isinstance(n,ast.Assert)]
def deadline(module):return [ast.dump(n.value,include_attributes=False) for n in ast.walk(module) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='deadline' for t in n.targets)]
assert page(before)==page(after) and checks(before)==checks(after) and deadline(before)==deadline(after)
assert len(checks(before))==7 and len(deadline(before))==1
commands=[['g++','-std=c++17','-Wall','-Wextra','-pedantic',str(HOST/'tests/diagnostic-log.test.cpp'),'-o','/dev/shm/windows-host-tmp/diagnostic-log-test'],['/dev/shm/windows-host-tmp/diagnostic-log-test'],['python','-B',str(HOST/'tests/navigation-observation.test.py')],['node','--test',str(HOST/'tests/diagnostic-suspend.test.mjs')],['git','diff','--check','--',*[p.as_posix() for p in paths]]]
executions=[]
for number,command in enumerate(commands):
 result=subprocess.run(command,cwd=ROOT,env={**os.environ,'TMPDIR':'/dev/shm/windows-host-tmp','PYTHONDONTWRITEBYTECODE':'1'},stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 name=f'validation-{number+1}.log';(DOC/name).write_bytes(result.stdout);executions.append({'command':command,'returncode':result.returncode,'log':name,**sig(result.stdout)})
 assert result.returncode==0,result.stdout.decode(errors='replace')
for name in ('navigation-storage.test.py','navigation-observation.py','navigation-observation.test.py'):ast.parse((ROOT/HOST/'tests'/name).read_text())
record={'status':'local_boundary_checks_passed_native_cause_still_unknown','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'originalRunId':44621752383,'originalSourceCommit':SOURCE,'originalExportCommit':EXPORT,'originalFiles':original,
 'originalPonFacts':{'fixtureStatus':'failed','timeoutSeconds':60,'lastState':None,'hostHadNotExitedAtDeadline':True,'nativeLogBytes':0,'diagnosticStateAbsentFromOriginalManifest':True,'nativePreferencesRemainInitial':True,'installationPackageVerification':'passed','rootCauseProven':False},
 'changes':'Optional bounded native phase/HRESULT/foreground/suspend-document observation, and bounded own-process fixture window observation. Existing HRESULT control flow, original error dialogs, document checks and gameplay cancellation remain unchanged.',
 'limits':{'nativeTraceEntries':256,'nativeTraceLineBytes':8192,'nativeTraceFileBytes':1048576,'fixtureWindowSeconds':3,'fixtureOwnedTopWindows':16,'fixtureStaticChildren':64,'fixtureVisitedWindows':4096,'windowTextCharacters':1024,'textRequestMilliseconds':100},
 'frozenFixturePageUnchanged':True,'allSevenOriginalAssertAstsUnchanged':True,'original60SecondDeadlineAstUnchanged':True,'nativeWindowsExecuted':False,'msvcCompiled':False,'gameClockOrRulesChanged':False,'automaticResumeAdded':False,'newWorkflowDispatched':False,
 'testGroups':{'portableCpp':8,'injectedWindowApi':6,'actualDiagnosticJavaScriptExpression':4},'commands':executions,'sourceInventory':inventory}
write(DOC/'result.json',record)
(DOC/'README.md').write_text('''# Windows 启动与跨文档取消的诊断补充

原 Windows 运行 `44621752383` / `039d210c` 的 Pon 文档夹具在原 60 秒时限失败，最后状态为 null；进程尚未退出、原 native.log 为 0 字节、preferences 保持初始值。原 evidence manifest 中没有 state.json，安装/便携包验收已通过。这些事实不足以证明 WebView2 缺失、创建失败、错误弹窗或超时的具体原因。原文件从不可变导出 `f559a71e` 恢复并逐原 manifest 校验，失败结论未改。

Back 原两模式在加载后进入 ready / paused / intro，不能再归为单纯 warmup 未结束。原 adapter/菜单/bridge 的独立真实 RAF 夹具证明晚 suspend 或同 session 的 cancelSeq 变化可以产生同形状态，但原生触发源尚未知；本修改不自动按 START、不自动恢复、不放宽任何游戏判据。

仅显式 diagnostics 模式记录阶段、原 HRESULT、导航 epoch、前台变化原因、异步 suspend 实际执行文档。记录不消费手柄快照、不读取存档值、环境或命令行，不复制任意异常文本；日志或只读观察错误不阻止原应用流程与原取消。原有 HRESULT 失败行为与错误弹窗不变。日志最多 256 条、每条 8192 字节、总文件 1 MiB。

原文档夹具仍保留相同 60 秒时限、四个页面脚本及全部七个断言。失败后、终止进程前，只读观察该 fixture PID 的窗口及 Static 错误框文本；不查看别的进程窗口内容，不点击、关闭弹窗或改变前台。最多 3 秒、16 个本进程顶层窗口、64 个静态子控件、4096 个枚举节点；每条文本最多 1024 字符、单次读取最多 100 ms。读取错误只保留有界首尾样本。

18 组本地边界验证通过：8 组便携 C++ 文件预算、6 组注入窗口 API、4 组实际诊断 JS 表达式。这些不是 Win32、MSVC、真实焦点事件或原生游戏通过结果。下一步须用冻结源运行实际 Windows，依据新增原始阶段/窗口记录定位原因，再决定是否需要生产修复。
''')
os.link(Path(__file__),DOC/'executed-freeze-validation.py')
os.link('/dev/shm/windows-host-tmp/cleanup-20261119-2224.json',DOC/'scratch-cleanup.json')
files={p.relative_to(ROOT).as_posix():sig(p.read_bytes()) for p in DOC.rglob('*') if p.is_file()}
out=Path('/dev/shm/windows-host-tmp/startup-diagnostics-freeze.json');write(out,{'status':'stable_for_independent_review','sourceFiles':inventory,'evidenceFiles':files,'nativeCauseProven':False})
print(json.dumps({'sourceFiles':len(inventory),'evidenceFiles':len(files),'evidenceBytes':sum(v['bytes'] for v in files.values()),'freeze':str(out),'freezeHash':sig(out.read_bytes())['sha256']},indent=2))
