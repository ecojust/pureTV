// Story scripts wait for active animation time, including scene transitions.
let elapsed = 0;
let pending = [];
export function activeTaleTime() { return elapsed; }
export function advanceTaleClock(milliseconds) {
    elapsed += milliseconds;
    const ready = pending.filter(entry => entry.at <= elapsed);
    pending = pending.filter(entry => entry.at > elapsed);
    for (const entry of ready) entry.resume();
}
export function waitInTale(milliseconds) {
    return new Promise(resume => pending.push({ at: elapsed + milliseconds, resume }));
}
