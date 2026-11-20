from pathlib import Path
import ast,json,hashlib,subprocess,datetime,os
root=Path('/dev/shm/puretv-submit');out=root/'joystick-games/shared/windows/docs/royale-job-budget-1';out.mkdir(exist_ok=False)
sha=lambda b:hashlib.sha256(b).hexdigest()
workflow='.github/workflows/joystick-catalog-windows.yml';current=(root/workflow).read_bytes();before=current.replace(b"    timeout-minutes: ${{ matrix.game == 'kart-royale' && 180 || 55 }}",b'    timeout-minutes: 55');assert current!=before and before==subprocess.check_output(['git','show','HEAD:'+workflow],cwd=root);assert sha(before)=='6227b95ac5aca470699fbb5366accbea303445e8d23e6dbbb230d9b8b5e0ed5a'
(out/'original-workflow.yml').write_bytes(before);(out/'candidate-workflow.yml').write_bytes(current);diff=subprocess.check_output(['git','diff','--',workflow],cwd=root);(out/'workflow.diff').write_bytes(diff);assert len([l for l in diff.decode().splitlines() if l.startswith('+') and not l.startswith('+++')])==1
paths=['joystick-games/tools/windows-verify.py','joystick-games/tools/macos-verify.py','joystick-games/tools/windows-observation.py','joystick-games/tools/windows-packages.py','joystick-games/tools/windows-build.py','joystick-games/shared/windows/tests/navigation-storage.test.py','puretv-joystick/joystick_sdk.py','joystick-games/kart-royale/qa-plan.json'];sources={};methods={}
for name in paths:
 p=root/name;b=p.read_bytes();q=out/'fixed-source'/name;q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(b);sources[name]={'bytes':len(b),'sha256':sha(b)}
 if name.endswith('.py'):
  t=ast.parse(b)
  for c in t.body:
   if isinstance(c,ast.ClassDef):
    for f in c.body:
     if isinstance(f,ast.FunctionDef):methods[name+':'+c.name+'.'+f.name]={'line':f.lineno,'endLine':f.end_lineno}
plan=json.loads((root/paths[-1]).read_text());steps=plan['steps'];assert len(steps)==20
conditional=0;extra=0;hold=0;rows=[]
for i,s in enumerate(steps):
 startup=s.get('windowsStartupWait');release=s.get('windowsReleaseWait');kind='startup' if startup else 'held-until-expect' if s.get('windowsHoldUntilExpect') else 'menuTap' if s.get('menuTap') else 'ordinary'
 condition=startup['timeoutSeconds'] if startup else s['timeoutSeconds'];after=release['timeoutSeconds'] if release else 0;wait=25 if kind=='menuTap' else 50 if kind=='ordinary' else 0;fixed=.016 if kind=='menuTap' else s['holdMs']/1000 if kind=='ordinary' else 0
 conditional+=condition+after;extra+=wait;hold+=fixed;rows.append({'index':i,'name':s['name'],'kind':kind,'actionOrExpectationSeconds':condition,'releaseObservationSeconds':after,'additionalInputOrSettleUntilSeconds':wait,'fixedHoldOutsideTheseDeadlinesSeconds':fixed})
assert conditional==1785 and extra==625 and abs(hold-6.536)<1e-8
stages=[
 ('initial launch',120,'90 renderer +30 foreground','WindowsCheck.launch'),
 ('minimum/restore viewport',111.5,'2 x25 until +1 x(1.5 delay +60 PNG)','WindowsCheck.window_bounds/screenshot'),
 ('DNS-SD',55,'40 registration +15 service resolution','WindowsCheck.discovery'),
 ('SDK connection and3 busy rejections',279.5,'4 x2 SDK connect +4 x25 owner until +3 x25 identity display +3 x5 busy +2 x10 ACK +1 x61.5 PNG','Check.connect/CatalogCheck.connect/WindowsCheck.connect'),
 ('20-step plan',conditional+extra+hold,'1785 condition/release +625 input/settle +6.536 fixed holds; detailed rows below','WindowsCheck.gameplay/bounded_gameplay_step; CatalogCheck.menu_tap'),
 ('gameplay prefix and post-plan pause',368,'8 x25 until +2 x61.5 PNG +45 pause (ensure_playing is already-playing path)','WindowsCheck.gameplay; Check.start_transition; CatalogCheck.ensure_playing'),
 ('3 minimize/restore cycles',840,'3 x(9 x25 until +45 background pause +10 ACK)','WindowsCheck.focus'),
 ('disconnect and held-sync reconnect',395,'10 x25 until +2 x10 ACK +2 SDK connect +2 x61.5 PNG','Check.reconnect'),
 ('capture native storage',25,'1 x25 until','CatalogCheck.capture_storage'),
 ('final ACK barrier',15,'5 heartbeat join +10 ACK','Check.acks'),
 ('normal close',21,'20 process wait +1 closed TCP probe','WindowsCheck.quit'),
 ('fresh browser storage restart',154,'14 x1 retry sleep +90 renderer +30 foreground +20 close','WindowsCheck.restart_storage/launch')]
per=sum(x[1] for x in stages);assert abs(per-4800.536)<1e-8
origin=root/'joystick-games/shared/windows/docs/attempts/44636807407';origjobs=origin/'jobs-20261120T001349Z.json';jobs=json.loads(origjobs.read_text())['jobs'];job=next(j for j in jobs if j['name']=='verify (kart-royale)');sdk=next(s for s in job['steps'] if s['name']=='Actual original SDK gameplay normal and occupied port');dt=lambda x:datetime.datetime.fromisoformat(x.replace('Z','+00:00'))
originalModes=[]
for mode in ['normal','occupied']:
 p=origin/f'original-small-export/joystick-windows-evidence-kart-royale/runtime-{mode}/report.json';r=json.loads(p.read_text());originalModes.append({'mode':mode,'originalReport':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes()),'status':r['status'],'elapsedSeconds':(dt(r['finishedAt'])-dt(r['startedAt'])).total_seconds(),'completedTopLevelChecks':sum(x['status']=='passed' for x in r['tests']),'failedCheck':next(x['name'] for x in r['tests'] if x['status']=='failed')})
result={'status':'read-only-budget-analysis-and-one-line-workflow-change','createdAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sources':sources,'methodLocations':methods,'perModeStages':[{'stage':n,'nominalSeconds':s,'arithmetic':a,'sourceMethods':m} for n,s,a,m in stages],'planRows':rows,'perModeNominalSeconds':per,'twoModeNominalSeconds':2*per,'twoModeNominalMinutes':2*per/60,'conditionalEnsurePlayingResume':{'callsPerMode':6,'additionalUntilSecondsPerCall':55,'meaning':'Only if ensure_playing sees a non-playing stage, its existing START transition can add30 target +25 release; expected successful plan/focus transitions already leave playing.','twoModeAdditionalNominalMinutes':11,'twoModeNominalWithEveryConditionalResumeMinutes':(2*per+660)/60},'outsideRuntimeJobCosts':{'installUninstallReinstallExplicitTimeoutsSeconds':360,'fourDocumentObservationAndExitTimeoutsSeconds':75,'fourDocumentFailureCleanupTimeoutSeconds':10,'newControllerBindCTestTimeoutSeconds':20,'actualOriginalJobPreSdkSeconds':(dt(sdk['started_at'])-dt(job['started_at'])).total_seconds(),'uncappedOrSeparateCosts':['Runner allocation/checkout/dependency download/CMake+MSVC/build/source and package hashing.','OS display/window calls, synchronous SDK/file calls, per-until last read can overshoot slightly; these are not a mathematical hard global bound.','Failure cleanup, evidence collection/compression/upload; artifact export is a separate job.']},'originalV6':{'runId':44636807407,'source':'d750c0c68c430503be06d18fe5b76af825c72e58','export':'09167e91d63bfea2a069dbb62ba6127db238a9f7','conclusion':job['conclusion'],'jobElapsedSeconds':(dt(job['completed_at'])-dt(job['started_at'])).total_seconds(),'sdkStepElapsedSeconds':(dt(sdk['completed_at'])-dt(sdk['started_at'])).total_seconds(),'modes':originalModes,'notJobTimeout':True},'roughCalculationCorrection':'Initial message used468 seconds for gameplay prefix/post-plan; summing its actual 8x25+2x61.5+45 terms gives368. The provisional163.35-minute number is superseded by160.0178667 minutes (before optional resumes).','decision':{'royaleVerifyJobMinutes':180,'otherGameVerifyJobMinutes':55,'reason':'100/120 would be below the enumerated sequential nominal waits.180 leaves about20 minutes over the prescribed160.02-minute path, or about9 over171.02 if all six conditional resumes occur in each mode. Prior setup actually took201 seconds; build/install and OS variability remain explicit. This is a reasonable outer ceiling, not a guaranteed mathematical cap on uncapped OS/tool operations.','noGameActionOrObservationDeadlineChangedByThisPatch':True,'noPredicatesChanged':True,'oldV6FailuresPreserved':True,'workflowDispatches':0}}
(out/'budget.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(out/'actionlint-output.log').write_bytes(b'');validation={'command':['/dev/shm/racing-tooling/actionlint',workflow],'exitCode':0,'combinedToolOutputBytes':0,'outputSha256':sha(b''),'toolVersion':'1.7.7; go1.23.4 linux/amd64','toolBinarySha256':sha(Path('/dev/shm/racing-tooling/actionlint').read_bytes()),'sourceSha256':sha(current),'validationPerformedOnce':True,'oneLineChangeVerified':True,'originalWorkflowSha256':sha(before),'notNativeValidation':True};(out/'validation.json').write_text(json.dumps(validation,indent=2)+'\n')
(out/'README.md').write_text('''# Royale Windows 外层运行预算\n\n当前两个原生模式的逐函数名义等待为160.02分钟；若每次 `ensure_playing` 的条件恢复分支都执行，另有最多11分钟名义额度。这些是各段可用等待之和，不是必需实耗，也不能把无独立上限的系统/构建调用变为数学硬界。详细调用次数与当前源码哈希见 [budget.json](budget.json)。\n\n只把 Royale 的 verify job 外层改为180分钟，其他游戏仍55分钟；plan/export等其他job不变。单步60、释放45、暂停45、全部原谓词和失败记录均不变。v6实际SDK步骤47分04秒/整job50分34秒后返回failure，并非外层timeout。\n\n初步粗表把 gameplay 外围写成468秒/模式，复核8×25+2×61.5+45后应为368秒；因此163.35分钟粗值已明确修正为160.02。180为父任务选定的合理外层余量，不保证所有系统调用同时耗尽时仍可完成。\n\n本次只有一行工作流变化，actionlint1.7.7通过；未重跑已通过检查、未派发流程。原代码/QA冻结清单保持不变。\n''',encoding='utf-8')
os.link(Path(__file__),out/'executed-budget-analysis.py')
records=[{'path':workflow,'bytes':len(current),'sha256':sha(current)}]
for p in sorted(out.rglob('*')):
 if p.is_file():records.append({'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())})
f={'status':'frozen-one-line-Royale-only-job-budget','files':records,'fileCount':len(records),'bytes':sum(r['bytes'] for r in records)};(out/'freeze.json').write_text(json.dumps(f,indent=2)+'\n')
print(json.dumps({'freeze':str((out/'freeze.json').relative_to(root)),'freezeSha256':sha((out/'freeze.json').read_bytes()),'fileCount':len(records),'bytes':f['bytes'],'workflowSha256':sha(current),'twoModeMinutes':2*per/60},indent=2))
