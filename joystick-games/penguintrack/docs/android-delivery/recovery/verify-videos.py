import pathlib,json,subprocess,hashlib,time
p=pathlib.Path(__file__).parent
out=p/'video-review';out.mkdir(exist_ok=True)
rows=[]
for mode in ['normal','occupied']:
 f=p/'original-export/evidence/joystick-android-runtime-penguintrack'/('penguintrack-'+mode)/'controller-gameplay.mp4'
 probe=json.loads((p/('video-probe-'+mode+'.json')).read_text())
 cmd=['nice','-n','19','ffmpeg','-v','error','-threads','1','-i',str(f),'-map','0:v:0','-f','null','-']
 t=time.monotonic();r=subprocess.run(cmd,capture_output=True,timeout=90)
 (out/(mode+'-full-decode.log')).write_bytes(r.stderr)
 row={'mode':mode,'video':str(f.relative_to(p)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'probe':probe,'decodeCommand':cmd,'decodeExitCode':r.returncode,'decodeSeconds':time.monotonic()-t,'samples':[]}
 assert r.returncode==0
 for sec in [5,60,120,175]:
  image=out/(mode+'-'+str(sec)+'s.png')
  cmd=['nice','-n','19','ffmpeg','-v','error','-threads','1','-ss',str(sec),'-i',str(f),'-frames:v','1','-threads','1',str(image)]
  r=subprocess.run(cmd,capture_output=True,timeout=30);assert r.returncode==0,r.stderr
  row['samples'].append({'seconds':sec,'path':str(image.relative_to(p)),'bytes':image.stat().st_size,'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),'command':cmd})
 rows.append(row)
 (out/'verification.json').write_text(json.dumps({'scope':'Full original video bitstream decode and four sampled original frames per mode; recording cadence is not game FPS; not proof of full acceptance or full track completion.','videos':rows},indent=2)+'\n')
 print(mode,'decoded',flush=True)
