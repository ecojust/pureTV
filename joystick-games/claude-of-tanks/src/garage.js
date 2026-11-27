const mapNames = {
  random: '随机地图', verdant: '翠绿山谷', desert: '沙丘', winter: '冬日湖畔', urban: '街区',
  coastal: '海岸', autumn: '秋林', steppe: '草原', railyard: '铁路货场', frontier: '边境',
  fjord: '峡湾', delta: '三角洲', badlands: '荒地', monsoon: '季风', alpine: '高山',
  caldera: '火山口', foundry: '铸造厂', ruinspires: '废墟尖塔', blackglass: '黑曜原',
  titan_gorge: '泰坦峡谷', skybridge: '天桥',
};

export function createGarage({specs, maps, onSelect, onBattle}) {
  const root = document.getElementById('garage');
  const tank = root.querySelector('[name=vehicle]');
  const map = root.querySelector('[name=map]');
  const battle = root.querySelector('.cot-battle');
  for (const spec of specs) tank.add(new Option(spec.label?.displayName || spec.name, spec.id));
  for (const scene of maps) map.add(new Option(mapNames[scene.id] || scene.name, scene.id));
  map.value = 'verdant';
  tank.addEventListener('change', () => onSelect(tank.value));
  const error = root.querySelector('.garage-error');
  battle.addEventListener('click', () => {
    error.hidden = true;
    onBattle(tank.value, map.value);
  });
  return {
    get isOpen() { return !root.hidden; },
    show(id) {
      this.setSelected(id);
      root.hidden = false;
      battle.focus({preventScroll: true});
    },
    hide() { root.hidden = true; },
    getSelected: () => tank.value,
    getSelectedMap: () => map.value,
    setSelected(id) {
      if (specs.some(spec => spec.id === id)) tank.value = id;
      onSelect(tank.value);
    },
    attachSettingsControl(control) { root.querySelector('.settings-slot').append(control); },
    showEntryError() {
      error.textContent = '未能载入战场。请重新开始，或在车库设置中调低画质后重试。';
      error.hidden = false;
    },
    setRoomStatus() {},
  };
}
