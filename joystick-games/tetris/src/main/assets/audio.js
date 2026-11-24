/* Original short synthesized effects and an original 8-bit accompaniment. */
(function(root){
  "use strict";
  function TetrisAudio(){
    this.context=null;this.master=null;this.nodes=new Set();this.paused=false;this.disposed=false;
    this.lastEvent=0;this.musicStep=0;this.nextBeat=0;this.musicEnabled=true;
  }
  TetrisAudio.prototype.unlock=function(){
    if(this.disposed)return Promise.resolve();
    var Audio=root.AudioContext||root.webkitAudioContext;
    if(!Audio)return Promise.resolve();
    if(!this.context){
      try{
        this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=.09;
        this.master.connect(this.context.destination);
      }catch(_){return Promise.resolve();}
    }
    if(this.paused)return this.context.state==="running"?this.context.suspend():Promise.resolve();
    return this.context.state==="suspended"?this.context.resume():Promise.resolve();
  };
  TetrisAudio.prototype.tone=function(note,time,length,wave,volume,music){
    var ctx=this.context,self=this;
    if(!ctx||this.disposed||this.paused||note===null||this.nodes.size>=24)return;
    var oscillator=ctx.createOscillator(),gain=ctx.createGain();
    var record={oscillator:oscillator,gain:gain,music:!!music};this.nodes.add(record);
    oscillator.type=wave||"square";oscillator.frequency.setValueAtTime(440*Math.pow(2,(note-69)/12),time);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume||.22,time+.004);
    gain.gain.setValueAtTime(volume||.22,time+Math.max(.005,length*.7));gain.gain.linearRampToValueAtTime(0,time+length);
    oscillator.connect(gain);gain.connect(this.master);
    oscillator.onended=function(){self.nodes.delete(record);try{oscillator.disconnect();gain.disconnect();}catch(_){}};
    oscillator.start(time);oscillator.stop(time+length+.01);
  };
  TetrisAudio.prototype.stop=function(musicOnly){
    this.nodes.forEach(function(record){
      if(!musicOnly||record.music){try{record.oscillator.stop();}catch(_){}try{record.gain.disconnect();}catch(_){}}
    });
    if(!musicOnly)this.nodes.clear();
  };
  TetrisAudio.prototype.pause=function(value){
    value=!!value;if(this.paused===value||this.disposed)return;this.paused=value;this.nextBeat=0;
    if(!this.context)return;
    if(value){this.stop(false);if(this.context.state==="running")this.context.suspend().catch(function(){});}
    else if(this.context.state==="suspended")this.context.resume().catch(function(){});
  };
  TetrisAudio.prototype.effect=function(event){
    if(!this.context||this.context.state!=="running"||this.paused)return;
    var now=this.context.currentTime,self=this;
    if(event.type==="move")this.tone(53,now,.025,"square",.12,false);
    else if(event.type==="rotate")this.tone(70,now,.045,"triangle",.33,false);
    else if(event.type==="lock"){
      this.tone(42,now,.06,"square",.25,false);this.tone(35,now+.04,.06,"triangle",.3,false);
    }else if(event.type==="clear"){
      var notes=event.lines===4?[72,76,79,84,88]:[72,76,79];
      notes.forEach(function(note,index){self.tone(note,now+index*.045,.1,"square",.2,false);});
    }else if(event.type==="level"||event.type==="start"){
      [60,64,67,72].forEach(function(note,index){self.tone(note,now+index*.06,.12,"triangle",.4,false);});
    }else if(event.type==="gameover"){
      [60,55,51,48].forEach(function(note,index){self.tone(note,now+index*.13,.2,"square",.19,false);});
    }
  };
  TetrisAudio.prototype.update=function(game){
    if(this.disposed)return;
    var events=game.events||[];
    for(var i=0;i<events.length;i++)if(events[i].id>this.lastEvent){this.effect(events[i]);this.lastEvent=events[i].id;}
    var enabled=game.music!==false&&game.phase==="playing";
    if(!enabled){if(this.musicEnabled)this.stop(true);this.nextBeat=0;this.musicEnabled=false;return;}
    this.musicEnabled=true;
    var ctx=this.context;if(!ctx||ctx.state!=="running"||this.paused)return;
    var now=ctx.currentTime;if(!this.nextBeat||this.nextBeat<now-.2)this.nextBeat=now+.025;
    // Newly composed C-major arpeggio sequence; no soundtrack data or recordings.
    var melody=[72,null,76,79,74,null,77,81,79,76,72,null,74,69,71,null,
      76,null,79,84,81,77,74,null,79,76,72,67,69,71,74,null];
    var bass=[48,48,53,53,55,55,48,48];
    while(this.nextBeat<now+.12){
      var step=this.musicStep%melody.length;
      this.tone(melody[step],this.nextBeat,.13,"square",.11,true);
      if(step%4===0)this.tone(bass[Math.floor(step/4)],this.nextBeat,.28,"triangle",.36,true);
      this.musicStep++;this.nextBeat+=.16;
    }
  };
  TetrisAudio.prototype.dispose=function(){
    if(this.disposed)return;this.disposed=true;this.stop(false);
    if(this.context&&this.context.state!=="closed")this.context.close().catch(function(){});
    this.master=null;
  };
  root.TetrisAudio=TetrisAudio;
  if(typeof module!=="undefined"&&module.exports)module.exports={TetrisAudio:TetrisAudio};
})(typeof window!=="undefined"?window:global);
