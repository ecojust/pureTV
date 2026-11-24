/* Local Battle City cues plus an independently synthesized engine.
 * Cue attribution and per-file hashes: docs/reference-art-audio.md and
 * docs/reference-audio-manifest.json. No ROM, emulator, or network music service.
 */
(function(root){
'use strict';
const CUES={stage_start:'stage_start',fire:'bullet_shot',hit_brick:'bullet_hit_1',hit_steel:'bullet_hit_2',enemy_explosion:'explosion_1',player_explosion:'explosion_2',powerup_appear:'powerup_appear',powerup_pick:'powerup_pick',extra_life:'powerup_pick',statistics:'statistics_1',game_over:'game_over',pause:'pause'};
const FILES=Array.from(new Set(Object.values(CUES)));
class TankAudio{
 constructor(){this.context=null;this.master=null;this.buffers=new Map();this.sources=new Set();this.seen=new WeakSet();this.pending=[];this.loading=null;this.disposed=false;this.paused=false;this.failed=[];this.engine=null;this.lastPhase='';this.lastTally=-1;this.lastCueAt=new Map();this.introUntil=0;}
 async unlock(){
  if(this.disposed)return false;
  const AudioContext=root.AudioContext||root.webkitAudioContext;if(!AudioContext)return false;
  if(!this.context){
   this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.45;this.master.connect(this.context.destination);this.makeEngine();
   this.loading=Promise.all(FILES.map(async name=>{
    try{const response=await fetch('audio/'+name+'.ogg',{cache:'force-cache'});if(!response.ok)throw new Error('HTTP '+response.status);const bytes=await response.arrayBuffer();const buffer=await this.context.decodeAudioData(bytes);if(this.disposed)return;this.buffers.set(name,buffer);this.flush(name);}catch(error){if(!this.disposed)this.failed.push(name);}
   }));
  }
  this.paused=false;
  try{await this.context.resume();}catch(error){return false;}
  return true;
 }
 makeEngine(){
  const ctx=this.context;
  // A short periodic, band-limited pulse train approximates the original engine
  // texture. This is authored synthesis, not a dumped NES APU stream.
  const real=new Float32Array(33),imag=new Float32Array(33),duty=.125;
  for(let n=1;n<33;n++){real[n]=Math.sin(2*Math.PI*n*duty)/(Math.PI*n);imag[n]=(1-Math.cos(2*Math.PI*n*duty))/(Math.PI*n);}
  const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),gate=ctx.createOscillator(),gateGain=ctx.createGain();
  osc.setPeriodicWave(ctx.createPeriodicWave(real,imag));osc.frequency.value=48;
  filter.type='lowpass';filter.frequency.value=1800;filter.Q.value=.2;gain.gain.value=0;
  gate.type='square';gate.frequency.value=17;gateGain.gain.value=0;
  gate.connect(gateGain);gateGain.connect(gain.gain);osc.connect(filter);filter.connect(gain);gain.connect(this.master);osc.start();gate.start();
  this.engine={osc,gain,filter,gate,gateGain};
 }
 setEngine(active,moving){
  if(!this.engine||this.disposed)return;const now=this.context.currentTime,target=active&&!this.paused&&now>=this.introUntil?(moving?.07:.035):0;
  this.engine.gain.gain.setTargetAtTime(target,now,.025);this.engine.gateGain.gain.setTargetAtTime(target*.45,now,.025);
  this.engine.osc.frequency.setTargetAtTime(moving?78:48,now,.03);this.engine.gate.frequency.setTargetAtTime(moving?28:17,now,.03);
 }
 flush(name){const now=Date.now(),queue=this.pending;this.pending=[];for(const cue of queue){if(now-cue.at>(cue.name==='stage_start'?1800:400))continue;if(name&&cue.name!==name)this.pending.push(cue);else this.play(cue.name,false);}}
 play(name,queue=true){
  if(this.disposed||this.paused)return;
  if(!this.context||!this.buffers.has(name)){if(queue){this.pending.push({name,at:Date.now()});if(this.pending.length>16)this.pending.shift();}return;}
  const now=this.context.currentTime,previous=this.lastCueAt.get(name);if(previous!==undefined&&now-previous<.025)return;
  this.lastCueAt.set(name,now);const buffer=this.buffers.get(name),source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;
  gain.gain.value=name==='bullet_shot'?.55:name==='statistics_1'?.65:1;source.connect(gain);gain.connect(this.master);this.sources.add(source);
  source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};source.start();if(name==='stage_start')this.introUntil=now+buffer.duration;
 }
 update(game){
  if(!game||this.disposed)return;
  for(const event of game.events||[]){if(!event||typeof event!=='object'||this.seen.has(event))continue;this.seen.add(event);const name=CUES[event.type];if(name&&Math.max(0,(game.frame||0)-(event.frame||0))<(event.type==='stage_start'?120:30))this.play(name);}
  if(game.phase==='results'){
   const tally=TankAudio.tally(game);if(this.lastPhase==='results'&&tally>this.lastTally)this.play('statistics_1');this.lastTally=tally;
  }else this.lastTally=-1;
  const players=(game.players||[]).filter(p=>p.alive&&p.joined!==false);this.setEngine(game.phase==='playing'&&players.length>0,players.some(p=>p.moving));this.lastPhase=game.phase;
 }
 static tally(game){let elapsed=Math.max(0,(game.phaseFrames||0)-30),counted=0;for(const type of ['basic','fast','power','armor']){const stats=game.stats||[],maximum=Math.max(Number((stats[0]||{})[type])||0,game.selectedPlayers===2?Number((stats[1]||{})[type])||0:0),shown=Math.min(maximum,Math.floor(elapsed/5));counted+=shown;if(shown<maximum)break;elapsed=Math.max(0,elapsed-maximum*5-24);if(elapsed===0)break;}return counted;}
 pause(value=true){
  this.paused=!!value;if(!this.context||this.disposed)return;this.setEngine(false,false);
  if(this.paused){this.pending=[];for(const source of this.sources){try{source.stop();}catch(error){}}this.sources.clear();this.context.suspend().catch(()=>{});}else this.context.resume().catch(()=>{});
 }
 dispose(){
  if(this.disposed)return;this.pause(true);this.disposed=true;this.pending=[];this.buffers.clear();
  if(this.engine){try{this.engine.osc.stop();this.engine.gate.stop();}catch(error){}Object.values(this.engine).forEach(node=>{try{node.disconnect();}catch(error){}});this.engine=null;}
  if(this.master)this.master.disconnect();if(this.context)this.context.close().catch(()=>{});
 }
}
root.TankAudio=TankAudio;if(typeof module!=='undefined'&&module.exports)module.exports={TankAudio,CUES,FILES};
})(typeof window!=='undefined'?window:globalThis);
