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

export function createDrivingGate() {
  const blocked = {};
  return (frame, menuFrame) => {
    const result = { ...frame, buttons: {}, pressed: {}, released: {} };
    for (const key of ['UP','DOWN','LEFT','RIGHT','START','A','B','X','Y']) {
      const held = !!frame.buttons?.[key];
      if (!held) blocked[key] = false;
      if (menuFrame && held) blocked[key] = true;
      const active = !menuFrame && !frame.cancelled && !blocked[key];
      result.buttons[key] = active && held;
      result.pressed[key] = active && !!frame.pressed?.[key];
      result.released[key] = active && !!frame.released?.[key];
    }
    return result;
  };
}

// Render frames can be shorter than the original 1/120 simulation step.
export function createActionLatch() {
  let pending = false;
  return { press(value) { pending ||= !!value; }, peek() { return pending; }, clear() { pending = false; } };
}
