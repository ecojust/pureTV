// The offline edition keeps the main game's health, team scores and results HUD.
export function createShotInfo() {
  return {root: document.createElement('div'), reset() {}, setPlayer() {}, hideStats() {}, warmSchematics() {}};
}
export function createDamagePanel() {
  return {
    root: document.createElement('div'),
    setTank() {}, setEquipment() {}, setPose() {}, update() {},
  };
}
export function createKillCam() {
  return {
    spectate: {active: false, targetId: null, startObserver: () => false, stop() {}},
    fxTimeScale: 1, lastBeginWallMs: 0, isActive: () => false,
    playForResult: () => false, cancel() {}, bindBus() {}, update() {},
  };
}
