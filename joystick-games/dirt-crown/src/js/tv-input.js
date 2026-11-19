// Nine independent pureTV buttons; no auto-throttle and no synthesized key releases.
export const DRIVE = Object.freeze({UP:'gas',DOWN:'brake',LEFT:'left',RIGHT:'right',A:'drift',B:'nitro'});
export function drivingHeld(buttons) { return new Set(Object.entries(DRIVE).filter(([key])=>buttons[key]).map(([,action])=>action)); }
export function edges(buttons, previous) { return Object.fromEntries(Object.keys(buttons).map(key=>[key,!!buttons[key]&&!previous[key]])); }
