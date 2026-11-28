/* Independently written score scheduler and Web Audio instruments.
 * Original compositions: Konami. Transcribed score data is supplied separately
 * for local testing; no ROM, original recording, DMC sample or CPU runtime.
 * See docs/reference-audio.md for source tables and synthesis limitations.
 */
(function(root){
'use strict';
const CPU=1789773,FPS=60.0988;
const NOISE_PERIODS=[4,8,16,32,64,96,128,160,202,254,380,508,762,1016,2034,4068];
const EFFECTS={'gun':'gun','grenade':'grenade','rocket':'rocket','explosion':'explosion','jeep-explosion':'jeep-explosion','barracks':'barracks','pow-pickup':'pow-pickup','pow-boarded':'pow-unload','upgrade':'upgrade','extra-life':'extra-life','tally':'text','select':'text','water':'water','bullet-hit':'bullet-hit','impact':'impact','rocket-impact':'rocket-impact','squish':'squish','helicopter':'helicopter','bomber':'bomber','laser':'laser','flame':'flame','portrait':'portrait','mission-text':'mission-text'};
const PERCUSSION=['percussion-tick','percussion-tick2','percussion-cymbal','percussion-short','percussion-short','percussion-short','percussion-drum','percussion-drum','explosion','jeep-explosion'];
function envelopeValues(note,envelopes){
 const [,frames,,attenuation,,env,gate,,control]=note;
 if(env===-1)return new Float32Array([attenuation/15,attenuation/15]);
 if(env===-2){const length=(gate&128)?frames:Math.min(frames,Math.max(1,(gate&127)/4));return new Float32Array(Array.from({length:Math.max(2,frames+1)},(_,i)=>i<length?1:0));}
 const output=new Float32Array(Math.max(2,frames+1)),table=envelopes[env]||[15,255];let index=1,volume=(env&128)?(control&15):table[0],delay=env&15,decay=0;
 const threshold=Math.floor(frames*(gate&15)/16),period=gate>>4;
 for(let i=0;i<=frames;i++){
  if(i){
   if(frames-i>=threshold){
    if(env&128){if(delay>0)delay--;else volume=Math.max(1,volume-1);}
    else{let next=table[index];if(next===254){index=table[index+1]||0;next=table[index];}if(next!==255&&next!==undefined){volume=next;index++;}}
   }else{if(decay>0)decay--;if(decay===0){decay=period;volume=Math.max(1,volume-1);}}
  }
  output[i]=Math.max(0,volume-attenuation)/15;
 }
 return output;
}
class JackalAudio{
 constructor(options={}){
  this.url=options.scoreUrl||'art/data/audio-score.json';this.context=null;this.master=null;this.musicGain=null;this.effectGain=null;this.data=null;this.loading=null;this.failed=null;this.sources=new Set();this.waves=[];this.noiseBuffers=new Map();this.lastEvents=null;this.eventIndex=0;this.lastPhase='';this.lastStage=0;this.lastGame=null;this.music=null;this.timer=null;this.paused=false;this.gamePaused=false;this.disposed=false;this.pending=[];this.lastEffect=new Map();this.suspendedMusic=null;this.cinematicMarks=new Set();this.cinematicKey='';this.cinematicIndex=0;this.cinematicTick=-1;this.debug={scheduledNotes:0,scheduledEffects:0,musicKey:null};
 }
 async load(){
  if(this.data)return this.data;if(this.disposed)return null;
  if(!this.loading)this.loading=fetch(this.url,{cache:'force-cache'}).then(response=>{if(!response.ok)throw new Error('Jackal audio score: HTTP '+response.status);return response.json();}).then(data=>{if(data.schema!=='puretv.jackal.audio-score.v1'||!data.scores||!Array.isArray(data.envelopes))throw new Error('Unsupported Jackal audio score');if(!this.disposed){this.data=data;if(this.context&&!this.paused)this.syncPhase(this.lastGame,true);}return data;}).catch(error=>{this.failed=error.message;return null;});
  return this.loading;
 }
 async unlock(){
  if(this.disposed)return false;const AudioContext=root.AudioContext||root.webkitAudioContext;if(!AudioContext)return false;
  if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.48;this.master.connect(this.context.destination);this.musicGain=this.context.createGain();this.musicGain.gain.value=.32;this.musicGain.connect(this.master);this.effectGain=this.context.createGain();this.effectGain.gain.value=.48;this.effectGain.connect(this.master);this.makeWaves();}
  this.paused=false;try{await this.context.resume();}catch(error){return false;}
  this.load();this.ensureTimer();if(this.data){const saved=this.suspendedMusic;if(saved&&!this.gamePaused){this.suspendedMusic=null;this.startMusic(saved.key,saved.offset,saved.follow);}else this.syncPhase(this.lastGame,true);}return true;
 }
 makeWaves(){
  for(const duty of [.125,.25,.5,.75]){const real=new Float32Array(65),imag=new Float32Array(65);for(let n=1;n<65;n++){real[n]=Math.sin(2*Math.PI*n*duty)/(Math.PI*n);imag[n]=(1-Math.cos(2*Math.PI*n*duty))/(Math.PI*n);}this.waves.push(this.context.createPeriodicWave(real,imag));}
 }
 noise(period){
  if(this.noiseBuffers.has(period))return this.noiseBuffers.get(period);
  const rate=this.context.sampleRate,size=Math.ceil(rate*.35),buffer=this.context.createBuffer(1,size,rate),samples=buffer.getChannelData(0);let register=1,clock=0;const step=CPU/NOISE_PERIODS[period&15]/rate;
  for(let i=0;i<size;i++){clock+=step;while(clock>=1){const bit=(register^(register>>1))&1;register=(register>>1)|(bit<<14);clock--;}samples[i]=(register&1)?-.5:.5;}
  this.noiseBuffers.set(period,buffer);return buffer;
 }
 attach(source,gain,group,end){
  source._group=group;this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};source.stop(end);
 }
 scheduleNote(channel,note,when,scale,group='music'){
  if(!this.context||this.disposed||this.paused)return;
  const time=Math.max(this.context.currentTime,when),duration=Math.max(.003,note[1]*scale/FPS),end=time+duration;
  if(channel===6){this.drum(note[2],time,group);return;}
  const gain=this.context.createGain(),destination=group==='music'?this.musicGain:this.effectGain;gain.connect(destination);
  const source=channel===3?this.context.createBufferSource():this.context.createOscillator();
  if(channel===3){source.buffer=this.noise(note[2]);source.loop=true;gain.gain.setValueAtTime(note[3]/15*.45,time);gain.gain.setValueAtTime(0,end);}
  else{
   const triangle=channel===2,timer=note[2];if(timer<8||timer>2047){gain.disconnect();return;}
   if(triangle)source.type='triangle';else source.setPeriodicWave(this.waves[note[4]&3]);
   const frequency=CPU/((triangle?32:16)*(timer+1));source.frequency.setValueAtTime(frequency,time);
   const sweep=note[7]||0;if(!triangle&&(sweep&128)&&(sweep&7)){let current=timer;const period=((sweep>>4)&7)+1;for(let frame=period/2;frame<note[1];frame+=period/2){const delta=current>>(sweep&7);current+=(sweep&8)?-delta-(channel===0||channel===4?1:0):delta;if(current<8||current>2047)break;source.frequency.setValueAtTime(CPU/(16*(current+1)),time+frame*scale/FPS);}}
   const envelope=envelopeValues(note,this.data.envelopes),amplitude=triangle?.43:.55;
   if(envelope.length>2){const curve=new Float32Array(envelope.length);for(let i=0;i<curve.length;i++)curve[i]=envelope[i]*amplitude;gain.gain.setValueCurveAtTime(curve,time,duration*.995);}
   else gain.gain.setValueAtTime(envelope[0]*amplitude,time);
   gain.gain.setValueAtTime(0,end);
  }
  source.connect(gain);source.start(time);this.attach(source,gain,group,end+.002);this.debug.scheduledNotes++;
 }
 drum(id,time,group){
  // Original sample instruments A/B and the sample layer of 3/4 are replaced
  // by newly synthesized drum transients; their score timing is preserved.
  if(id===10||id===11||id===3||id===4){
   const ctx=this.context,gain=ctx.createGain(),osc=ctx.createOscillator();gain.connect(group==='music'?this.musicGain:this.effectGain);osc.type='triangle';const low=id===10||id===3;osc.frequency.setValueAtTime(low?145:230,time);osc.frequency.exponentialRampToValueAtTime(low?42:70,time+.085);gain.gain.setValueAtTime(.45,time);gain.gain.exponentialRampToValueAtTime(.0001,time+.11);osc.connect(gain);osc.start(time);this.attach(osc,gain,group,time+.12);
   if(id===11||id===4)this.scheduleNote(3,[0,7,5,11,0,-1,0,0],time,1,group);
  }
  if(id<10){const key=PERCUSSION[id],score=this.data.scores[key];if(score)for(const channel of score.channels)for(const note of channel.notes)this.scheduleNote(channel.channel,note,time+note[0]/FPS,1,group);}
 }
 effect(key){
  if(!this.data||!this.context||this.paused||this.disposed){if(!this.disposed)this.pending.push({key,at:Date.now()});return;}
  const score=this.data.scores[key];if(!score)return;const now=this.context.currentTime,previous=this.lastEffect.get(key);if(previous!==undefined&&now-previous<.035)return;this.lastEffect.set(key,now);this.debug.scheduledEffects++;
  for(const channel of score.channels)for(const note of channel.notes)this.scheduleNote(channel.channel,note,now+.005+note[0]/FPS,score.tempoScale||1,'effect');
 }
 ensureTimer(){if(this.timer||this.disposed||this.paused||!this.context)return;this.timer=setInterval(()=>this.pump(),25);}
 stopGroup(group){for(const source of this.sources)if(!group||source._group===group){try{source.stop();}catch(error){}this.sources.delete(source);}}
 stopMusic(save=false){
  if(save&&this.music)this.suspendedMusic={key:this.music.key,offset:Math.max(0,this.context.currentTime-this.music.start),follow:this.music.follow};
  this.stopGroup('music');this.music=null;this.debug.musicKey=null;
 }
 startMusic(key,offset=0,follow=null){
  if(!key){this.stopMusic();return;}if(!this.data||!this.context||this.paused)return;
  const score=this.data.scores[key];if(!score)return;const scale=score.tempoScale||1,transition=(score.followAtFrame||Math.max(...score.channels.map(channel=>channel.frames)))*scale/FPS;if(follow&&offset>=transition){this.startMusic(follow,offset-transition);return;}this.stopMusic();
  this.music={key,score,start:this.context.currentTime-offset+.02,follow,channels:score.channels.map(channel=>({channel,index:0,iteration:0,done:false,offset:0}))};this.debug.musicKey=key;
  for(const state of this.music.channels){const channel=state.channel,loop=channel.loopFrame,length=channel.frames;
   if(loop!==null&&offset>length*scale/FPS){state.iteration=Math.floor((offset*FPS/scale-loop)/(length-loop));state.offset=state.iteration*(length-loop);state.index=channel.notes.findIndex(note=>note[0]>=loop);if(state.index<0)state.done=true;}
   while(!state.done&&state.index<channel.notes.length&&(channel.notes[state.index][0]+state.offset)*scale/FPS<offset-.01)state.index++;
  }
  this.ensureTimer();this.pump();
 }
 pump(){
  if(this.disposed||this.paused||!this.context||!this.data)return;
  const pending=this.pending;this.pending=[];for(const item of pending)if(Date.now()-item.at<300)this.effect(item.key);
  const music=this.music;if(!music||this.gamePaused)return;const now=this.context.currentTime,horizon=now+.16,scale=music.score.tempoScale||1;
  for(const state of music.channels){let limit=512;while(!state.done&&limit--){const channel=state.channel;if(state.index>=channel.notes.length){if(channel.loopFrame===null){state.done=true;break;}state.offset+=channel.frames-channel.loopFrame;state.index=channel.notes.findIndex(note=>note[0]>=channel.loopFrame);if(state.index<0){state.done=true;break;}}
    const note=channel.notes[state.index],time=music.start+(note[0]+state.offset)*scale/FPS;if(time>horizon)break;state.index++;if(time+note[1]*scale/FPS>=now-.015)this.scheduleNote(channel.channel,note,Math.max(now,time),scale,'music');
   }
  }
  const end=(music.score.followAtFrame||Math.max(...music.score.channels.map(channel=>channel.frames)))*scale/FPS;
  if((music.follow||music.channels.every(state=>state.done))&&now>=music.start+end){const next=music.follow;this.stopMusic();if(next)this.startMusic(next);}
 }
 syncPhase(game,force=false){
  if(!game||!this.context||!this.data||this.paused)return;const phase=game.phase,changed=phase!==this.lastPhase,stageChanged=game.stage!==this.lastStage;
  if(phase==='paused'){
   if(!this.gamePaused){this.stopMusic(true);this.gamePaused=true;this.effect('pause');}
   this.lastPhase=phase;return;
  }
  if(this.gamePaused){this.gamePaused=false;const saved=this.suspendedMusic;this.suspendedMusic=null;if(saved)this.startMusic(saved.key,saved.offset,saved.follow);this.lastPhase=phase;this.lastStage=game.stage;return;}
  if(force&&!changed&&!stageChanged&&this.music)return;
  if(changed||force||stageChanged){
   let key=null,follow=null;const stageKey='stage'+(((game.stage||1)-1)%3+1);
   if(phase==='attract')key='story';
   else if(phase==='intro'){key=this.data.cinematics?null:'intro';follow='stage1';}
   else if(phase==='deployment'){
    if(this.data.cinematics&&String(game.cinematicKey||'').startsWith('intro_')){this.lastPhase=phase;this.lastStage=game.stage;return;}
    if(this.music&&(this.music.key==='intro'||this.music.key===stageKey)){this.lastPhase=phase;this.lastStage=game.stage;return;}key=stageKey;
   }
   else if(phase==='playing'){
    key=game.bossActive?'boss':stageKey;
    if(this.music&&(this.music.key===key||this.music.key==='intro'||(game.bossActive&&['boss-warning','final-boss'].includes(this.music.key)))){this.lastPhase=phase;this.lastStage=game.stage;return;}
   }
   else if(phase==='stageclear')key='victory';
   else if(phase==='continue'||phase==='gameover')key='gameover';
   else if(phase==='ending'){key=game.endingRestart?null:(this.data.cinematics?'victory':'ending');}
   if(!force||!this.music||this.music.key!==key)this.startMusic(key);
   if(changed)this.cinematicMarks.clear();
  }
  this.lastPhase=phase;this.lastStage=game.stage;
 }
 cinematic(game){
  if(!this.data||!this.data.cinematics||!this.context||this.paused||game.phase==='playing'||game.phase==='paused'||game.phase==='continue')return;
  const key=game.cinematicKey||(game.phase==='title'?'title_'+(game.selectedPlayers||1)+'p':game.phase==='stageclear'?'stage_clear_'+String(game.stage).padStart(2,'0'):game.phase==='gameover'?'game_over':game.phase),timeline=this.data.cinematics[key];if(!timeline)return;
  const tick=Number(game.cinematicKey?game.cinematicFrame:game.phaseFrame)||0;
  if(key!==this.cinematicKey||tick<this.cinematicTick){this.cinematicKey=key;this.cinematicIndex=0;}
  this.cinematicTick=tick;
  while(this.cinematicIndex<timeline.commands.length&&timeline.commands[this.cinematicIndex][0]<=tick){
   const [at,id]=timeline.commands[this.cinematicIndex++];if(id===89){this.stopMusic();continue;}
   const entry=Object.entries(this.data.scores).find(([,score])=>score.soundId===id);if(!entry)continue;const [name]=entry;
   if(id>=48&&id<=87||id===40){if(!this.music||this.music.key!==name)this.startMusic(name,Math.max(0,tick-at)/FPS,id===52?'stage1':null);}
   else if(tick-at<4)this.effect(name);
  }
 }
 update(game){
  if(!game||this.disposed)return;this.lastGame=game;this.syncPhase(game);this.cinematic(game);
  const events=game.events||[];if(events!==this.lastEvents){this.lastEvents=events;this.eventIndex=0;}
  for(;this.eventIndex<events.length;this.eventIndex++){
   const raw=events[this.eventIndex],type=typeof raw==='string'?raw:raw.type;
   if(EFFECTS[type])this.effect(EFFECTS[type]);
   if(type==='boss'&&this.data&&this.context){this.startMusic('boss-warning',0,'boss');}
   if(type==='final-boss-music'&&this.data&&this.context)this.startMusic('final-boss');
   if(type==='final-destruction')this.effect('final-destruction');
  }
  if(game.phase==='playing'&&this.data&&this.context){
   const helicopter=(game.helicopters||[]).some(h=>h.alive&&h.state!=='waiting');const mark=Math.floor((game.frame||0)/9);if(helicopter&&mark!==this.rotorMark){this.rotorMark=mark;this.effect('helicopter');}
  }
  this.pending=this.pending.filter(item=>Date.now()-item.at<300).slice(-24);this.pump();
 }
 pause(value=true){
  if(this.disposed)return;this.paused=!!value;if(!this.context)return;
  if(value){this.stopMusic(true);this.stopGroup();this.pending=[];if(this.timer){clearInterval(this.timer);this.timer=null;}this.context.suspend().catch(()=>{});}
  else{this.context.resume().catch(()=>{});const saved=this.suspendedMusic;if(saved&&!this.gamePaused){this.suspendedMusic=null;this.startMusic(saved.key,saved.offset,saved.follow);}else this.syncPhase(this.lastGame,true);this.ensureTimer();}
 }
 dispose(){if(this.disposed)return;this.pause(true);this.disposed=true;this.data=null;this.pending=[];this.noiseBuffers.clear();if(this.master)this.master.disconnect();if(this.musicGain)this.musicGain.disconnect();if(this.effectGain)this.effectGain.disconnect();if(this.context)this.context.close().catch(()=>{});}
}
root.JackalAudio=JackalAudio;
if(typeof module!=='undefined'&&module.exports)module.exports={JackalAudio,envelopeValues,NOISE_PERIODS,EFFECTS,CPU,FPS};
})(typeof window!=='undefined'?window:globalThis);
