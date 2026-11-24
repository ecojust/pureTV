/* Original local engine, tire and mechanical synthesis; no external recordings. */
(function(root){'use strict';
  function UsedCarAudio(){this.context=null;this.master=null;this.engine=[];this.gains=[];this.muted=false;this.paused=true;this.disposed=false;this.lastEvent=0;}
  UsedCarAudio.prototype.unlock=function(){
    if(this.disposed)return Promise.resolve();var C=root.AudioContext||root.webkitAudioContext;if(!C)return Promise.resolve();
    if(!this.context){var c=this.context=new C();this.master=c.createGain();this.master.gain.value=.17;this.master.connect(c.destination);
      var filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;filter.Q.value=.7;filter.connect(this.master);this.filter=filter;
      for(var i=0;i<3;i++){var o=c.createOscillator(),g=c.createGain();o.type=i===2?'triangle':'sawtooth';o.frequency.value=30;g.gain.value=0;o.connect(g);g.connect(filter);o.start();this.engine.push(o);this.gains.push(g);}
      var buffer=c.createBuffer(1,c.sampleRate*2,c.sampleRate),data=buffer.getChannelData(0),last=0;for(i=0;i<data.length;i++){last=(last+Math.random()*2-1)*.5;data[i]=last;}
      this.noise=c.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;var hiss=c.createBiquadFilter();hiss.type='bandpass';hiss.frequency.value=1400;hiss.Q.value=.8;this.noiseGain=c.createGain();this.noiseGain.gain.value=0;this.noise.connect(hiss);hiss.connect(this.noiseGain);this.noiseGain.connect(this.master);this.noise.start();
    }
    return this.context.state==='suspended'?this.context.resume():Promise.resolve();
  };
  UsedCarAudio.prototype.effect=function(frequency,duration){if(!this.context||this.paused||this.muted)return;var c=this.context,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type='triangle';o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,frequency*.28),t+duration);g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.03);o.onended=function(){o.disconnect();g.disconnect();};};
  UsedCarAudio.prototype.pause=function(value){this.paused=!!value;if(this.master)this.master.gain.setTargetAtTime(this.paused||this.muted?0:.17,this.context.currentTime,.035);};
  UsedCarAudio.prototype.update=function(state){if(!this.context||this.disposed)return;this.pause(state.phase!=='race'&&state.phase!=='countdown');if(this.paused||this.muted)return;var car=state.players[0],t=car.telemetry,c=this.context,base=Math.max(20,t.rpm/30);for(var i=0;i<3;i++){this.engine[i].frequency.setTargetAtTime(base*(i+1)+(i===1?1.2:0),c.currentTime,.055);this.gains[i].gain.setTargetAtTime((.13+t.throttle*.16)/(i+1),c.currentTime,.04);}this.filter.frequency.setTargetAtTime(500+t.throttle*1000+t.rpm*.06,c.currentTime,.06);this.noiseGain.gain.setTargetAtTime(Math.min(.38,Math.abs(t.slipAngle)*.6+(t.locked?.2:0)+Math.pow(t.speedKmh/200,2)*.025),c.currentTime,.06);
    for(i=0;i<state.events.length;i++){var e=state.events[i];if(e.id<=this.lastEvent)continue;if(e.kind==='pedal-break')this.effect(620,.4);else if(e.kind==='collision')this.effect(95,.16);else if(e.kind==='go')this.effect(850,.22);this.lastEvent=e.id;}
  };
  UsedCarAudio.prototype.dispose=function(){if(this.disposed)return;this.disposed=true;this.engine.forEach(function(o){try{o.stop();o.disconnect();}catch(_){}});if(this.noise){try{this.noise.stop();this.noise.disconnect();}catch(_){}}if(this.context&&this.context.state!=='closed')this.context.close().catch(function(){});};
  root.UsedCarAudio=UsedCarAudio;
})(window);
