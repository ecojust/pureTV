export const CARS = [
  { id: 'wasp', name: 'Wasp', blurb: 'Fast, nimble and paper-thin. One gun, no excuses.', price: 0, color: 8,
    base: { maxSpeed: 62, accel: 24, brake: 40, grip: 1.0, turn: 1.0, mass: 1100, armor: 130, slots: 1 },
    startWeapons: [{ id: 'machinegun', ammo: 200 }] },
  { id: 'hammer', name: 'Hammer', blurb: 'Muscle with a roof-mounted arsenal. Three slots of hurt.', price: 0, color: 9,
    base: { maxSpeed: 56, accel: 20, brake: 36, grip: 0.95, turn: 0.9, mass: 1500, armor: 125, slots: 3 },
    startWeapons: [{ id: 'machinegun', ammo: 200 }] },
  { id: 'bulwark', name: 'Bulwark', blurb: 'An armoured brick. Slow, stubborn, hard to kill.', price: 0, color: 3,
    base: { maxSpeed: 55, accel: 19, brake: 36, grip: 0.92, turn: 0.88, mass: 2000, armor: 190, slots: 2 },
    startWeapons: [{ id: 'machinegun', ammo: 200 }] },
  { id: 'gullwing', name: 'Gullwing', blurb: 'Brushed steel and gull-wing doors. The fastest thing left on the road, and nothing to spare: three slots, thin skin.', price: 0, color: 11,
    base: { maxSpeed: 68, accel: 26, brake: 42, grip: 1.02, turn: 1.04, mass: 1050, armor: 95, slots: 3 },
    startWeapons: [{ id: 'machinegun', ammo: 200 }], defaultSpikes: { front: 1, rear: 1 } },
  { id: 'rhino', name: 'Rhino', blurb: 'A military 4x4 with a roll cage, a winch and a bull bar. Slow and heavy, but it keeps its line in the mud.', price: 0, color: 6,
    base: { maxSpeed: 46, accel: 15, brake: 32, grip: 1.0, turn: 0.78, mass: 2600, armor: 240, slots: 2, offroad: 0.85 },
    startWeapons: [{ id: 'machinegun', ammo: 200 }], defaultSpikes: { front: 1, rear: 1 } },
];
export function getCar(id) {
  return CARS.find((c) => c.id === id) || null;
}
