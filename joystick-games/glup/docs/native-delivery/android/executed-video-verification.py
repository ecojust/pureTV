import pathlib,json,subprocess,hashlib
r=pathlib.Path('/dev/shm/adventure-recovery');out=[]
for g in ['glup','emberbrood']:
 paths=list((r/('glup-android' if g=='glup' else 'android-original')).glob('**/'+g+'-*/controller-gameplay.mp4'))
 for v in paths:
  log=r/(v.parent.name+'-demux-timebase-decode.log')
  cmd=['ffmpeg','-v','error','-xerror','-err_detect','explode','-i',str(v),'-map','0:v:0','-vsync','0','-enc_time_base','-1','-f','rawvideo','-y','/dev/null']
  result=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);log.write_bytes(result.stdout)
  info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,width,height,nb_frames','-of','json',str(v)]))
  out.append({'game':g,'mode':v.parent.name,'path':str(v.relative_to(r)), 'sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'bytes':v.stat().st_size,'fullDecodeExitCode':result.returncode,'diagnosticBytes':len(result.stdout),'metadata':info,'decodeCommand':cmd[0:7]+['<original-video>']+cmd[8:]});print(v.parent.name,result.returncode,len(result.stdout),info,flush=True)
(r/'video-decode-final.json').write_text(json.dumps({'status':'passed' if all(x['fullDecodeExitCode']==0 and x['diagnosticBytes']==0 for x in out) else 'failed','method':'Decode every original frame to the rawvideo sink, timestamp passthrough; no modified video is created. Initial default timebase sinks reported rounded duplicate DTS while exiting zero; retained separately. Preserve the demuxer time base for this final full decode; no codec errors or device-FPS claims.','videos':out},indent=2)+'\n')
assert all(x['fullDecodeExitCode']==0 and x['diagnosticBytes']==0 for x in out)
