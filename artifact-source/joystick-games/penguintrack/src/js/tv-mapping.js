// Every Wi-Fi key is independent; simultaneous gas/brake/steering is legal.
export function raceInput(frame, enabled) {
    const b = enabled && !frame.cancelled ? frame.buttons || {} : {};
    const p = enabled && !frame.cancelled ? frame.pressed || {} : {};
    return { held: { gas: !!(b.UP || b.A), brake: !!(b.DOWN || b.B), left: !!b.LEFT, right: !!b.RIGHT }, edges: [p.X && 'respawn', p.Y && 'cameraCycle'].filter(Boolean) };
}
export function makeRepeater() {
    const next = new Map();
    return { clear() { next.clear(); }, read(frame, now) {
        const events = [];
        for (const key of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
            if (!frame.buttons[key] || frame.cancelled) { next.delete(key); continue; }
            if (frame.pressed[key] || !next.has(key)) { events.push(key); next.set(key, now + 380); }
            else if (now >= next.get(key)) { events.push(key); next.set(key, now + 130); }
        }
        return events;
    } };
}
