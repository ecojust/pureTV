import { createController, BUTTONS } from '../../../shared/web/input.js';

export function attachTV({ stage, observe, act, suspend }) {
    const host = createController({width: 174, onSuspend: suspend, onCancel: suspend});
    let frames = 0;
    const errors = [];
    const keyboard = new Set(), pulses = new Set();
    const keys = {ArrowLeft:'LEFT', ArrowRight:'RIGHT', ArrowUp:'UP', ArrowDown:'DOWN',
        Enter:'A', z:'A', x:'B', c:'X', v:'Y', p:'START'};
    window.addEventListener('keydown', event => {
        const key = keys[event.key];
        if (!key || event.ctrlKey || event.altKey || event.metaKey) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (!event.repeat && !keyboard.has(key)) pulses.add(key);
        keyboard.add(key);
    }, true);
    window.addEventListener('keyup', event => keyboard.delete(keys[event.key]), true);
    const gamepadButtons={A:0,B:1,X:2,Y:3,START:9,UP:12,DOWN:13,LEFT:14,RIGHT:15};
    let prior = {}, blocked = false, previousPad = null;
    function clear() { keyboard.clear(); pulses.clear(); blocked=true; }
    window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',()=>{if(document.hidden) clear();});
    window.addEventListener('error', event => errors.push(String(event.message)));
    window.addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));
    const snapshot=()=>({game:'story-thief',stage:stage(),paused:stage()==='paused',renderer:'canvas2d',webglVersion:null,
        frames,gameplay:observe(),controller:host.peek(),errors:[...errors]});
    Object.defineProperty(window,'JoystickGameQA',{value:Object.freeze({snapshot})});
    return () => {
        frames++;
        const frame=host.poll();
        host.setPlaying(stage()!=='menu');
        const pad=Array.from(navigator.getGamepads?.() || []).find(value=>value?.connected);
        const identity=pad ? pad.index+':'+pad.id : null;
        if(previousPad!==null && previousPad!==identity){clear();suspend();}
        previousPad=identity;
        const axes=pad?.axes || [];
        const axis={LEFT:axes[0]<-.55, RIGHT:axes[0]>.55, UP:axes[1]<-.55, DOWN:axes[1]>.55};
        const held={}, presses={};
        for(const key of BUTTONS){
            held[key]=!!(pad?.buttons[gamepadButtons[key]]?.pressed || axis[key] || keyboard.has(key));
            presses[key]=frame.pressed[key] || (!blocked && (pulses.has(key) || (held[key] && !prior[key])));
        }
        prior=held; pulses.clear();
        if(blocked && !Object.values(held).some(Boolean)) blocked=false;
        if(frame.cancelled){clear();return;}
        act(presses);
    };
}
