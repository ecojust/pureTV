// The nine physical pureTV buttons stay independent; X/Y are not A/B aliases.
export function mapController(frame, dt, settings = {}) {
  const b = frame.buttons || {}, p = frame.pressed || {};
  const fine = !!b.B, horizontal = Number(!!b.RIGHT) - Number(!!b.LEFT);
  const vertical = Number(!!b.UP) - Number(!!b.DOWN);
  if (frame.cancelled) return neutral();
  return {
    ...neutral(),
    forward: fine ? 0 : vertical,
    strafe: !fine && settings.strafe ? horizontal : 0,
    yawDelta: horizontal && (fine || !settings.strafe) ? -horizontal * Math.min(.1, Math.max(0, dt)) * (fine ? .55 : 1.65) : 0,
    pitchDelta: fine ? vertical * Math.min(.1, Math.max(0, dt)) * .55 : 0,
    fire: !!b.A, firePressed: !!p.A, jump: !fine && !!b.Y,
    reload: !fine && !!p.X, cycle: fine && !!p.X,
    alt: fine && !!b.Y, altPressed: fine && !!p.Y,
    crouch: !!settings.crouch,
  };
}
export function neutral() {
  return { forward: 0, strafe: 0, yawDelta: 0, pitchDelta: 0, fire: false, firePressed: false,
    jump: false, reload: false, cycle: false, alt: false, altPressed: false, crouch: false };
}
