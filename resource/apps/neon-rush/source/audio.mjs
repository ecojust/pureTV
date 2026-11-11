// Original, locally synthesized sound. No downloaded recordings or autoplay.
export class RushAudio {
  constructor(){this.context=null;this.voice=null;this.master=null;this.lastEvent='';this.effects=new Set();}
  unlock(){
    if(!this.context){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context=new Audio();const c=this.context;this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);const tone=c.createOscillator(),filter=c.createBiquadFilter();tone.type='sawtooth';tone.frequency.value=55;filter.type='lowpass';filter.frequency.value=420;tone.connect(filter);filter.connect(this.master);tone.start();this.voice=tone;}catch{return;}}
    if(this.context.state==='suspended')this.context.resume().catch(()=>{});
  }
  update(state,active,enabled){
    if(!this.context){if(enabled)this.unlock();return;}
    const c=this.context,t=c.currentTime,p=state.player||state.cars[0];
    if(!enabled||!active)this.stopEffects();
    this.master.gain.setTargetAtTime(enabled&&active&&state.countdown<=0?0.026:0,t,0.05);
    this.voice.frequency.setTargetAtTime(42+Math.max(0,p.speed)*2.5+(p.boostTime>0?35:0),t,0.08);
    const tag=String(state.stats?.nitros||0)+'/'+String(state.stats?.miniBoosts||0);
    if(enabled&&active&&state.countdown<=0&&state.raceTime>0&&tag!==this.lastEvent&&this.lastEvent){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(280,t);o.frequency.exponentialRampToValueAtTime(700,t+.18);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g);g.connect(c.destination);this.effects.add(o);o.onended=()=>{this.effects.delete(o);o.disconnect();g.disconnect();};o.start();o.stop(t+.26);}
    this.lastEvent=tag;
  }
  stopEffects(){for(const effect of this.effects){try{effect.stop();}catch{}}this.effects.clear();}
  silence(){this.stopEffects();if(this.master&&this.context)this.master.gain.setTargetAtTime(0,this.context.currentTime,.02);}
  dispose(){this.silence();if(this.context)this.context.close().catch(()=>{});this.context=null;}
}
