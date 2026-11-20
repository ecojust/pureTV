import test from 'node:test';
import assert from 'node:assert/strict';
import {Audio} from '../src/js/audio.js';

test('pause stops every crossfading track and voice; explicit resume keeps the selected track position and volume', async () => {
    const audio = new Audio();
    const gain = () => ({value:1,setTargetAtTime(){},setValueAtTime(value){this.value=value;}});
    audio.output={gain:gain()};audio.sfx={gain:gain()};audio.music={gain:gain()};audio.voice={gain:gain()};
    audio.ctx={state:'running',currentTime:12, async suspend(){this.state='suspended';}, async resume(){this.state='running';}};
    function track(t) { return {el:{currentTime:t,paused:false,pause(){this.paused=true;},async play(){this.paused=false;}}}; }
    audio.tracks={title:track(14),station:track(27)};audio.theme='station';
    audio.setVolumes({voice:0.4,music:0.3,sfx:0});
    let stopped=false;
    audio.voiceSrc={stop(){stopped=true;}};audio.voiceId='line';
    audio.pause();audio.init();audio.play('fixit');audio.say('delayed-line');
    assert.equal(audio.ctx.state,'suspended');assert.equal(audio.output.gain.value,0);
    assert.ok(stopped);assert.equal(audio.voiceId,null);
    assert.ok(audio.tracks.title.el.paused);assert.ok(audio.tracks.station.el.paused);
    assert.equal(audio.theme,'station');
    audio.resume();
    assert.equal(audio.ctx.state,'running');assert.equal(audio.output.gain.value,1);
    assert.ok(audio.tracks.title.el.paused);assert.equal(audio.tracks.station.el.paused,false);
    assert.equal(audio.tracks.station.el.currentTime,27);assert.deepEqual(audio.vol,{voice:0.4,music:0.3,sfx:0});
});
