#!/usr/bin/env python3
"""Transcribe documented Jackal score tables into flat, inspectable note events.
Reads declarative db/dw/SoundDefinition statements only. Does not assemble or
execute 6502 instructions, read ROMs, synthesize PCM, or ship a bytecode runtime.
Usage: python transcribe-audio.py '/path/to/ASM Source/Code/Bank0.ASM' output.json
"""
from pathlib import Path
import sys,re,json,hashlib
source=Path(sys.argv[1]);text=source.read_text();lines=text.splitlines()
labels={};tokens=[];headers=[];fade_labels=[]
for number,line in enumerate(lines,1):
 code=line.split(';')[0].strip()
 match=re.match(r'SoundDefinition\s+(\d+),(\d+),(\w+)',code)
 if match:headers.append(tuple([int(match[1]),int(match[2]),match[3]]))
 if number<1162 or number>=2326:continue
 label=re.match(r'^([A-Za-z_][A-Za-z0-9_]*):?$',code)
 if label:labels[label[1]]=len(tokens);continue
 if code.startswith('db '):
  for item in code[3:].split(','):
   item=item.strip();tokens.append((int(item[1:],16) if item.startswith('$') else int(item),number))
 elif code.startswith('dw '):
  for item in code[3:].split(','):tokens.append((item.strip(),number))

PERIODS=[0x6ae,0x64e,0x5f4,0x59e,0x54e,0x501,0x4b9,0x476,0x436,0x3f9,0x3c0,0x38a]

def compile_channel(label,channel):
 pc=labels[label];start=pc;mode=(tokens[pc][0]&0xf0)!=0;clock=0;default=1;reg=0x30;sweep=0x88;envelope=0;gate=0;octave=4;detune=False;repeatbase=pc;repeat=0;call=None;notes=[];visited={};loop=None
 def read():
  nonlocal pc
  value=tokens[pc][0];pc+=1;return value
 def note(timer,volume,duty=0,env=-1,cut=0,sw=0,kind=None):
  notes.append([clock,default,timer,volume,duty,env,cut,sw])
 steps=0
 while steps<100000:
  steps+=1;visited.setdefault(pc,clock);cmd=read()
  if not isinstance(cmd,int):raise ValueError((label,'pointer outside command',pc,cmd))
  if cmd in (0xfb,0xfc):repeatbase=pc;continue
  if cmd==0xfd:target=read();call=pc;pc=labels[target];continue
  if cmd==0xfe:
   count=read()
   if count==0xff:
    target=labels[read()]
    if target in visited:loop=visited[target];break
    pc=target;continue
   repeat+=1
   if repeat!=count:pc=repeatbase
   else:repeat=0
   continue
  if cmd==0xff:
   if call is not None:pc=call;call=None;continue
   break
  if mode:
   hi=cmd>>4;lo=cmd&15
   if hi==13:
    default=lo
    if channel!=6:
     reg=read()
     if channel!=2:envelope=read();gate=read()
    continue
   if cmd==0xe8:detune=not detune;continue
   if hi==14:octave=lo;continue
   if hi==15:reg=(reg&0xf0)|lo;continue
   duration=default*(lo+1)
   if hi<12:
    if channel==6:notes.append([clock,duration,hi,0,0,-1,0,0])
    else:
     assert 0<=octave<=4,(label,octave)
     timer=(PERIODS[hi]>>(4-octave))+(1 if detune else 0)
     notes.append([clock,duration,timer,reg&15,(reg>>6)&3,envelope if channel!=2 else -2,gate if channel!=2 else reg,sweep])
   clock+=duration
   continue
  # Raw period/volume effects. A leading zero on noise explicitly escapes a
  # following value >=FB, which otherwise has score-control meaning.
  if channel==3:
   if cmd==0:cmd=read()
   elif cmd<16:default=cmd;continue
   notes.append([clock,default,cmd&15,cmd>>4,0,-1,0,0]);clock+=default;continue
  if cmd<16:
   default=cmd or read();reg=read();sweep=read();continue
  if cmd==0xf8:read();detune=True;continue
  timer=((cmd&7)<<8)|read();timer+=int(detune)
  notes.append([clock,default,timer,cmd>>4,(reg>>6)&3,-1,0,sweep]);clock+=default
 else:raise ValueError((label,'unbounded repeat'))
 return {'channel':channel,'sourceLabel':label,'sourceLine':tokens[start][1],'frames':clock,'loopFrame':loop,'notes':notes}

names={3:'percussion-cymbal',4:'percussion-tick',5:'percussion-tick2',6:'percussion-short',7:'percussion-drum',8:'water',9:'gun',10:'bomber',11:'laser',12:'helicopter',16:'bullet-hit',17:'grenade',18:'squish',19:'rocket',21:'impact',22:'rocket-impact',23:'explosion',25:'flame',27:'barracks',29:'pow-pickup',31:'pow-unload',33:'upgrade',35:'boss-warning',37:'jeep-explosion',38:'extra-life',39:'final-destruction',40:'ending-helicopter',42:'portrait',45:'text',46:'mission-text',48:'story',52:'intro',56:'stage1',60:'stage2',64:'stage3',68:'boss',72:'final-boss',76:'victory',80:'gameover',84:'ending',88:'pause'}
scores={}
for sound,name in names.items():
 extra,_,_=headers[sound-1];channels=[]
 for offset in range(extra+1):
  _,channel,label=headers[sound-1+offset];channels.append(compile_channel(label,channel))
 scores[name]={'soundId':sound,'tempoScale':9/8 if sound==52 else 21/20 if sound==84 else 1,'channels':channels}
 if sound==52:scores[name]['followAtFrame']=min(c['frames'] for c in channels)
 print(f'{name:18} '+', '.join("{}:{}f/{} notes loop={}".format(c["channel"],c["frames"],len(c["notes"]),c["loopFrame"]) for c in channels))
fades=[]
for index in range(36):
 pc=labels[f'tblPulseNoteFade{index:02X}'];values=[]
 while len(values)<128:
  value=tokens[pc][0];pc+=1;values.append(value)
  if value==255:break
  if value==254:values.append(tokens[pc][0]);break
 fades.append(values)
out={'schema':'puretv.jackal.audio-score.v1','clockHz':1789773,'frameRate':60.0988,'source':{'repository':'https://github.com/RayofJay/NES-Jackal_Disassembly_Fully_Commented','file':'ASM Source/Code/Bank0.ASM','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'method':'Independent offline transcription of declarative sound tables to timer/duration events, not CPU emulation. Original compositions remain credited to Konami; see docs/reference-audio.md.'},'noteColumns':['frame','frames','timerOrDrum','volumeOrAttenuation','duty','envelope','gate','sweep'],'envelopes':fades,'scores':scores}
if len(sys.argv)>3:
 cinematic_dir=Path(sys.argv[3]);out['cinematics']={}
 for path in sorted(cinematic_dir.glob('*/timeline.json')):
  timeline=json.loads(path.read_text());out['cinematics'][path.parent.name]={'frames':timeline['duration_ticks'],'commands':timeline.get('sound_commands',[]),'source':timeline.get('source'),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
Path(sys.argv[2]).write_text(json.dumps(out,separators=(',',':'))+'\n')
