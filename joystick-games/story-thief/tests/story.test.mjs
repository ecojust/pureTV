import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTaleClock, waitInTale } from '../src/js/tale-clock.js';
import { state } from '../src/js/state.js';
import { SCENES } from '../src/js/scenes/index.js';

test('story transitions wait for active game time',async () => {
    let done=false;const wait=waitInTale(150).then(()=>done=true);
    advanceTaleClock(100);await Promise.resolve();assert.equal(done,false);
    advanceTaleClock(50);await wait;assert.equal(done,true);
});
test('using the cottage cake runs the original pickup and scoring rule',async () => {
    state.reset();
    const cake=SCENES.cottage.hotspots.find(spot=>spot.id==='cake');
    const script={set:key=>state.set(key),give:key=>state.give(key),award:key=>state.award(key),say:async()=>{}};
    assert.equal(cake.when(state),true);await cake.use(script);
    assert.equal(cake.when(state),false);assert.equal(state.has('cake'),true);assert.ok(state.score>0);
    assert.equal(Object.keys(SCENES).length,10);
});

test('pausing silences the sound bus without changing the saved volume choice', async () => {
    const {initAudio, setAudioPaused, setSound, soundOn, sfx} = await import('../src/js/sounds.js');
    const buses = [];
    let ctx;
    class Context {
        constructor() { ctx=this; this.state='running';this.currentTime=0; }
        createGain() {
            const gain={value:0, cancelScheduledValues(){}, setValueAtTime(value){this.value=value;}, setTargetAtTime(value){this.value=value;}};
            buses.push(gain);return {gain,connect(){}};
        }
        async suspend(){this.state='suspended';}
        async resume(){this.state='running';}
    }
    const windowBefore=globalThis.window;
    globalThis.window={AudioContext:Context};
    try {
        initAudio();
        setAudioPaused(true);initAudio();sfx.click();
        assert.equal(ctx.state,'suspended');assert.equal(buses[0].value,0);
        assert.equal(soundOn(),true);
        setSound(false);setAudioPaused(false);
        assert.equal(ctx.state,'running');assert.equal(buses[0].value,0);
        setSound(true);assert.equal(buses[0].value,0.5);
    } finally { globalThis.window=windowBefore; }
});
