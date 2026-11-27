export function createBootScreen() {
  const boot = document.getElementById('cot-boot');
  const progress = boot.querySelector('progress');
  const status = boot.querySelector('p');
  const labels = {renderer:'启动画面', sky:'生成天空', lighting:'布置灯光', garage:'准备车库', vehicle:'装载车辆',
    hud:'装载仪表', ui:'准备菜单', audio:'载入声音', post:'应用画质', ready:'进入车库'};
  const stages = new Set();
  return {
    begin(key) { status.textContent = (labels[key] || '准备游戏') + '…'; },
    sub() {}, note() {},
    end(key) {
      stages.add(key);
      progress.max = Object.keys(labels).length;
      progress.value = stages.size;
    },
    ready() { boot.hidden = true; return Promise.resolve(); },
    dismiss() { boot.hidden = true; },
    get gated() { return false; },
  };
}
