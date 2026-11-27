// The offline edition keeps the main game's health, team scores and results HUD.
export function createShotInfo() {
  return {root: document.createElement('div'), reset() {}, setPlayer() {}, hideStats() {}, warmSchematics() {}};
}
export function createDamagePanel() {
  return {root: document.createElement('div'), setTank() {}, setEquipment() {}, update() {}};
}
export function createKillCam() {
  return {
    spectate: {active: false}, fxTimeScale: 1, isActive: () => false,
    playForResult: () => false, cancel() {}, bindBus() {},
  };
}
