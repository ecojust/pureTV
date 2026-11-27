// Localize the original HUD and settings without changing identifiers or keyboard bindings.
(() => {
  'use strict';
  document.documentElement.lang = 'zh-CN';
  const labels = {
    'Claude of Tanks': '克劳德坦克', 'Press any key to continue': '按任意键继续', 'Retry loading': '重新加载',
    'Starting engine': '正在启动引擎', 'Initialising renderer': '正在启动渲染器',
    'Baking sky and atmosphere': '正在生成天空', 'Placing sun and shadow cascades': '正在布置光照',
    'Assembling the garage bay': '正在准备车库', 'Painting your vehicle': '正在绘制车辆',
    'Building combat interface': '正在加载游戏界面', 'Loading vehicle roster': '正在载入车辆列表',
    'Priming audio engine': '正在启动音频', 'Compiling post-processing chain': '正在准备画面效果',
    'Standing by': '准备就绪', 'Garage ready': '车库已就绪', 'Ready': '就绪',
    'Battlefield': '地图', 'Random Battle · Standard': '随机对局 · 标准模式', 'Standard Battle': '标准对局',
    'Solo vs bots': '单人对战电脑', 'Garage': '车库', 'Battle': '对战', 'Battle!': '开始！',
    'Battle begins in': '开局倒计时', 'ROLL OUT!': '出发！', 'Loading battlefield': '正在载入地图',
    'Surveying terrain': '正在准备地形', 'Assembling rosters': '正在安排双方阵容',
    'Painting vehicles': '正在绘制车辆', 'Preparing deployment': '正在准备开局',
    'Preparing allied vehicles': '正在载入我方车辆', 'Preparing opposing vehicles': '正在载入对方车辆',
    'Finishing camouflage': '正在完成涂装', 'Warming suspension terrain': '正在准备地形交互',
    'Priming wreck variants': '正在加载场景物件', 'Priming combat effects': '正在加载游戏特效',
    'Compiling combat shaders': '正在编译画面效果', 'Preparing the next round': '正在准备下一局',
    'Next battle': '下一局', 'Leaving battle': '正在离开本局', 'Regrouping': '正在返回',
    'Allies': '我方', 'Enemy': '对方', 'Enemies': '对方', 'Time': '时间', 'Spotted': '已被发现',
    'VS': '对', 'KM/H': '千米/时', 'Destroyed': '已击毁', 'Unknown vehicle': '未知车辆',
    'RICOCHET': '弹开', 'NO PENETRATION': '未造成伤害', 'ABSORBED': '伤害被抵消', 'CRIT': '暴击',
    'Battle paused': '游戏已暂停', 'Click to resume — Esc for settings': '点击继续，按 Esc 打开设置',
    'Settings': '设置', 'Settings Menu': '设置菜单', 'Paused': '已暂停', 'Resume': '继续游戏', 'Leave Battle': '离开对局',
    'Close': '关闭', 'Menu': '菜单', 'Action': '操作', 'Primary': '主键', 'Secondary': '备用键', 'Pad': '手柄',
    'Swap': '交换', 'Cancel': '取消', 'Reset to defaults': '恢复默认设置', 'Graphics': '画面',
    'Gameplay': '玩法', 'Controls': '按键', 'Sound': '声音', 'Mouse': '鼠标', 'Controller': '手柄',
    'Movement': '行驶', 'Move': '移动', 'Move Forward': '前进', 'Move Back': '倒车', 'Steer Left': '向左转',
    'Steer Right': '向右转', 'Handbrake': '手刹', 'Combat': '动作', 'Aim': '瞄准', 'Fire Gun': '射击',
    'Fire': '射击', 'Sniper': '放大视野', 'Sniper Mode': '放大视野', 'Reload Magazine': '装填',
    'Special Action': '特殊动作', 'Consumables': '道具', 'Repair Kit': '修理包', 'First Aid Kit': '急救包',
    'Fire Extinguisher': '灭火器', 'Camera': '视角', 'Aim / Free Look (RMB)': '瞄准／自由视角（鼠标右键）',
    'Free Look (Hold)': '自由视角（按住）', 'Free Look': '自由视角', 'Zoom In': '拉近', 'Zoom Out': '拉远',
    'Minimap Zoom': '缩放小地图', 'Interface': '界面', 'Performance Overlay': '性能信息', 'Shot Info Log': '游戏事件记录',
    'Mouse sensitivity': '鼠标灵敏度', 'Sniper sensitivity scale': '放大视野时的灵敏度',
    'Aim smoothing (0% = raw input)': '视角平滑度（0% 为原始输入）', 'Invert vertical aim (Y axis)': '反转垂直视角',
    'Right click (RMB)': '鼠标右键', 'hold-to-aim': '按住瞄准', 'toggle-aim': '切换瞄准',
    'AI difficulty (next battle)': '电脑难度（下一局生效）', 'Easy': '简单', 'Normal': '普通', 'Hard': '困难',
    'Controller aim sensitivity': '手柄视角灵敏度', 'Off': '关', 'On': '开', 'Graphics quality': '画质',
    'No controller detected. Plug in any standard gamepad and press a button.': '标准双摇杆手柄可用左摇杆驾驶、右摇杆调整视角。',
    'Controller detected — left stick drives, right stick aims (squared response for fine aim).': '标准双摇杆手柄可用左摇杆驾驶、右摇杆调整视角。',
    'hold Esc': '长按 Esc', 'What': '可在玩法选项中设置', 'PRESS PAD…': '请按手柄键…',
    'PRESS KEY…': '请按键…', 'HOLD FOR ESC…': '长按可绑定 Esc…',
    'Quality': '画质优先', 'Auto': '自动', 'Ultra': '极高', 'High': '高', 'Medium': '中', 'Low': '低',
    'Performance': '流畅优先', 'Balanced': '均衡', 'Volume': '音量', 'Master volume': '总音量',
    'Engine & mechanical volume': '车辆音量', 'Gunfire & impacts volume': '对战音效音量',
    'Ambience volume (wind, birds, garage)': '环境音量（风声、鸟鸣、车库）', 'Interface & music volume': '界面和音乐音量',
    'Crew voices & alarms volume': '语音和提示音量', 'Alarms': '提示音', 'Critical-damage heartbeat pulse': '低生命值心跳提示',
    'After action report': '对局结算', 'Victory': '胜利', 'Defeat': '失败', 'Draw': '平局', 'Battle over': '对局结束',
    'Your performance': '个人表现', 'Battle outcome': '对局结果', 'Best shot': '最佳一击', 'Vehicles destroyed': '击毁车辆',
    'Your team': '我方队伍', 'Enemy team': '对方队伍', 'Combatant': '玩家', 'YOU': '你', 'Commander': '车长',
    'Damage': '伤害', 'Kills': '击毁数', 'Damage dealt': '造成伤害', 'Damage blocked': '抵挡伤害',
    'Damage received': '受到伤害', 'Penetrations': '有效命中', 'Hits': '命中', 'Battle again': '再来一局',
    'Return to garage': '返回车库', 'No kills this battle.': '本局没有击毁记录。',
    'No kills credited — your team finished them.': '本局的击毁由队友完成。', 'No combatants recorded.': '暂无玩家记录。',
    'Your team carried the field after you fell.': '你的车辆退出后，队友赢得了比赛。', 'Enemy force destroyed. The field is yours.': '对方车辆已全部退出，我方获胜。',
    'Your force was wiped out. The field is lost.': '我方车辆已全部退出，对方获胜。', 'Battle timer expired. No side held the field.': '对局时间已到，本局平局。',
    'Neither side held the field.': '双方打成平局。', 'The match connection was interrupted. No result was recorded.': '对局连接中断，本局未计入成绩。',
    'Amberford': '琥珀渡口', 'Glacier Pass': '冰川隘口', 'Blackglass District': '黑曜街区', 'Redrock Divide': '红岩分水岭',
    'Obsidian Caldera': '黑曜火山口', 'Jade River Delta': '翠河三角洲', 'Saltmere Bay': '盐湖湾', 'Nordhavn Fjord': '北港峡湾',
    'Frontier Basin': '边境盆地', 'Sirocco Wadi': '热风旱谷', 'Ironworks': '钢铁厂', 'Ruinspires': '废墟尖塔',
    'Tarkhan Steppe': '塔尔汗草原', 'Titan Gorge': '巨人峡谷', 'Monsoon Ridge': '季风山脊', 'Cinder Junction': '煤渣车站',
    'Skybridge Chasm': '天桥裂谷', 'Steinburg': '施泰因堡', 'Verdant Fields': '翠绿田野', 'Frosthollow': '霜谷'
  };
  const phrases = new Map(Object.entries(labels).map(([key, value]) => [key.toLowerCase(), value]));
  const sentences = [
    [/^Hold-to-aim: hold RMB/i, '可用鼠标右键切换放大视野或自由观察。按 Shift 可切换视角。'],
    [/^Easy bots aim slower/i, '选择电脑对手的难度。设置在下一局开始时生效。'],
    [/^Auto uses adaptive High quality/i, '自动模式会根据显卡性能调整场景分辨率，界面文字保持清晰。设置立即生效。'],
    [/^Performance, Balanced and Quality stay/i, '可选择流畅、均衡或画质优先，设置会立即生效。'],
    [/^Effects, engines and music are synthesized/i, '总音量控制所有声音。可单独调整各类音效，松开滑块可试听。心跳提示会在车辆生命值低于四分之一时响起。'],
    [/^Sniper sensitivity stacks/i, '可在数字框中输入灵敏度，精确调整放大视野后的操控速度。'],
    [/^Click a chip, then press/i, '点选键位后，按键盘、鼠标或手柄按钮重新绑定。轻按 Esc 取消，'],
    [/^to bind Escape itself/i, '可以把 Esc 设为快捷键。右击键位可清除绑定。'],
    [/^does \(hold-to-aim/i, '的操作方式。'],
    [/^always locks the gun independently/i, '可单独转动视角。手柄的 START 键可打开此菜单。'],
    [/^Shell Slot (\d)$/i, (_, n) => '弹种栏 ' + n],
    [/^(\d+) vs (\d+)$/i, (_, a, b) => a + ' 对 ' + b],
    [/^(\d+[.,\d]*)% of hits$/i, (_, pct) => '命中占比 ' + pct + '%'],
    [/^(\d+\s*\/\s*\d+) survived · ([\d,.]+) damage$/i, (_, alive, score) => '存活 ' + alive + ' · 伤害 ' + score]
  ];
  function translate(value) {
    if (!/[a-z]/i.test(value)) return value;
    const clean = value.trim();
    const base = clean.replace(/^—\s*/, '');
    let translated = phrases.get(base.toLowerCase());
    if (!translated) {
      for (const [pattern, replacement] of sentences) {
        if (pattern.test(base)) {
          translated = typeof replacement === 'string' ? replacement : base.replace(pattern, replacement);
          break;
        }
      }
    }
    return translated ? value.replace(clean, (base !== clean ? '— ' : '') + translated) : value;
  }
  const attrs = ['title', 'aria-label', 'placeholder', 'alt'];
  function localizeAttribute(element, key) {
    const old = element.getAttribute(key);
    if (old === null) return;
    const next = translate(old);
    if (next !== old) element.setAttribute(key, next);
  }
  function localize(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.parentElement || node.parentElement.closest('style, script, svg, textarea')) return;
      const next = translate(node.data);
      if (next !== node.data) node.data = next;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches('style, script, svg, textarea')) return;
    for (const key of attrs) localizeAttribute(node, key);
    for (const child of node.childNodes) localize(child);
  }
  document.addEventListener('DOMContentLoaded', () => {
    localize(document.body);
    new MutationObserver(changes => {
      for (const change of changes) {
        if (change.type === 'childList') {
          for (const child of change.addedNodes) localize(child);
        } else if (change.type === 'attributes') {
          localizeAttribute(change.target, change.attributeName);
        } else localize(change.target);
      }
    }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attrs});
  }, {once:true});
})();
