// Isolated adapter/input contract test: no game model, renderer, stage clock or assets.
import { configurePureTv } from '../src/upstream/src/puretv';
import { Controls } from '../src/upstream/src/input/controls';
const w = window as any;
const result = { scope: 'Adapter-only fixture using actual Controls/puretv source with a mock stage; no game renderer/model loaded, not gameplay/native acceptance', checks: [] as any[], errors: [] as string[], passed: false };
let paused = false;
const controls = new Controls();
window.addEventListener('keydown', e => { if (e.code === 'Escape' && !e.repeat) paused = !paused; });
configurePureTv({ phase: () => paused ? 'menu' : 'play', ready: () => true, pause: () => { paused = true; }, clear: () => controls.cancel(), paused: () => paused, audio: () => 'fixture', observe: () => ({phase: 'fixture'}) });
const frames = async (n = 3) => { for (let i = 0; i < n; i++) await new Promise<void>(r => requestAnimationFrame(() => r())); };
const check = (name: string, pass: boolean) => { result.checks.push({name, pass}); if (!pass) throw Error(name); };
(async () => { try {
 await frames(); w.__fixtureInput.buttons = {START:true}; await frames(); check('START enters pause', paused);
 await frames(55); check('held START does not resume', paused); w.__fixtureInput.buttons={}; await frames(); w.__fixtureInput.buttons={START:true}; await frames(55); check('resume then hold START >800ms stays running', !paused);
 w.__fixtureInput.buttons={}; await frames(); w.PureGame.focus(false); await frames(); check('focus loss pauses', paused); w.PureGame.focus(false); await frames(); w.__fixtureInput.buttons={START:true}; await frames(55); check('already-paused focus loss does not re-pause explicit resume', !paused);
 w.__fixtureInput.buttons={}; await frames(); controls.poll(); w.__fixtureInput.buttons={UP:true,RIGHT:true,A:true,B:true,X:true,Y:true}; await frames(); const input=controls.poll(); check('six independent simultaneous driving/action buttons',input.input.throttle===1 && input.input.steer===1 && input.input.handbrake && ['recover','camera','assist'].every(x=>input.actions.has(x as any)));
 w.__fixtureInput.online=false; await frames(); const cancelled=controls.poll(); check('disconnect pauses and clears held and pending inputs',paused && cancelled.input.throttle===0 && cancelled.input.steer===0 && !cancelled.input.handbrake && cancelled.actions.size===0);
 w.__fixtureInput.online=true; w.__fixtureInput.buttons={START:true,A:true,B:true,X:true,Y:true}; await frames(55); check('held reconnect does not resume or trigger actions',paused && controls.poll().actions.size===0);
 w.__fixtureInput.buttons={}; await frames(); w.__fixtureInput.buttons={START:true}; await frames(55); check('fresh START after reconnect resumes once',!paused);
 check('one native snapshot per adapter poll',w.__fixtureInput.calls===w.JoystickGameQA.snapshot().controller.pollCount); result.passed=true;
 } catch(e) {result.errors.push(String(e));} w.fixtureResult=result;
})();
