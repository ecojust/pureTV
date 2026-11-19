export function drivingInput(frame, keyboard) {
  const b = frame?.buttons || {}, p = frame?.pressed || {};
  return {
    throttle: !!(b.UP || keyboard.throttle), brake: !!(b.DOWN || keyboard.brake),
    steer: b.LEFT || b.RIGHT ? Number(!!b.RIGHT) - Number(!!b.LEFT) : keyboard.steer,
    drift: !!(b.A || keyboard.drift), nitroPressed: !!(p.B || keyboard.nitroPressed)
  };
}
export function cancelDrift(car) {
  // Disconnect is not a rewarded release. Do not change speed, position or fuel.
  car.drifting = false; car.driftTime = 0; car.driftDir = 0;
}
