from pathlib import Path
import json,hashlib,os
r=Path('/dev/shm/puretv-submit');b=Path(__file__).resolve().parent;out=r/'docs/racing-nine/windows-failures-44621752383';out.mkdir(exist_ok=True,parents=True)
def link(p,q):
 q.parent.mkdir(parents=True,exist_ok=True)
 if q.exists():assert q.read_bytes()==p.read_bytes()
 else:os.link(p,q)
for game in ['ponpoko-kart','backroad-rally','kart-royale']:
 old=b/'original-small-export'/('joystick-windows-evidence-'+game)
 for p in old.rglob('*'):
  if p.is_file():link(p,out/'original-reports'/game/p.relative_to(old))
for p in (b/'original-small-export/retention-provenance').iterdir():link(p,out/'original-provenance'/p.name)
for n in ['original-export-manifest.json','original-export-ref.json','original-export-tree.json','original-small-export-verification.json','original-report-findings.json','original-job-log-recovery.json','completed.json','readonly-reexport-request.json','readonly-failure-evidence-requests.json']:
 link(b/n,out/n)
for n in ['analyze-reports.py','recover-small-export.py','archive-failures.py']:link(b/n,out/'executed-local'/n)
for game in ['backroad-rally','ponpoko-kart','kart-royale','export']:
 for suffix in ['-original-job.log','-original-job.stderr']:link(b/(game+suffix),out/'original-cli-logs'/(game+suffix))
(out/'README.md').write_text('''# Windows 原失败证据 · 44621752383

原源码 `039d210cfa4cc65f59adf0859a777f3591853a70`、attempt1；原不可变导出 `f559a71e99ff27c8f262ed2a82a70674ee90f9dc`。整流程失败但 export 成功，Turbo 两模式成功；本文三款原失败不因此改写。

- Ponpoko：安装校验成功，但文档启动测试 `Document fixture timed out: null`；没有进入 SDK 验收，原报告不能单独解释缺少状态的原因。
- Backroad：两模式通过安装、文档测试和 SDK 连接，在最后启动菜单步骤失败。240秒后的实际状态是 paused、phase=intro、ready=true、menuFocus=resume；触发暂停的具体原因待独立定位，不能只归软件GPU慢。
- Kart Royale：normal 的角色页已在60秒末显示 `Start race`，但合格poll仅62/63，未满足基线后两帧稳定；occupied 的六次Y导航只有“仍处于Controls”谓词，标为Left的步骤实际释放时仍在Steer buttons，后续A选择Right。两模式都没有到达600秒自然倒计时步骤。

具体原状态、时间和SHA见 [诊断汇总](original-report-findings.json)。原代码与报告均未修改，未重复运行游戏、构建或派发恢复流程。原已成功的Git导出足够恢复证据，`readonly-*-request.json`仅保留已准备但未派发的后备请求。

`original-reports/`保留三款选定小报告、终态、每款evidence-manifest与原日志，逐Git blob SHA1、顶层export SHA256及每款manifest核对；未声称恢复整个大导出。42文件的恢复回执还包含Turbo部分，Turbo完整116原件单独归档在游戏的 `docs/windows-delivery/original-export/`。

CLI日志是 `gh run view` 读取的原日志文本，不声称与API原ZIP字节格式相同。Pon那一次读取失败，0字节log及 `zip: not a valid zip file` 原stderr如实保留；其原bootstrap报告已从固定Git导出恢复。
''')
files={}
for p in out.rglob('*'):
 if p.is_file():data=p.read_bytes();files[p.relative_to(r).as_posix()]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
(b/'failure-archive-freeze.json').write_text(json.dumps({'status':'frozen','files':files},indent=2)+'\n');print(json.dumps({'files':len(files),'logicalBytes':sum(v['bytes'] for v in files.values())}))
