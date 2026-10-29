# 游戏与手机手柄升级（源码）

本轮覆盖九款手机手柄及 2026-10-28 新增的七款游戏。现有下载 APK 尚未更新；以下改动需要重新构建安装。浏览器验证使用模拟电视原生桥接与实际手机控制页面，不代表电视、iOS 或微信浏览器实机验收。

## 不看手机的操作分区

左侧三分之二使用浮动摇杆；右侧三分之一从屏幕顶部到底部全部接受动作触控。坦克与钻石方块只有一种主要动作，整块区域分别用于开火、换序。其余游戏右上半区为 B、右下半区为 A；无需点中字母或说明文字。START／SELECT 独立置于左侧底部。

操作区阻止文字选择、长按菜单与拖拽。每根手指独立按下、释放，跨区拖动保留最初动作；取消触控、失焦、旋转、切后台或断线时释放输入。坦克选关支持摇杆双向调整，合并开火区后仍能往回选关。

| 游戏 | 本轮玩法完善 |
| --- | --- |
| 俄罗斯方块 | B-TYPE 25 行挑战、固定等级、预填障碍高度、双人同棋盘与通关反馈；默认 A-TYPE 保留 |
| 钻石方块 | 消除后逐格坠落，落稳后再判断连锁；魔法列奖励进度 |
| 炸弹杰克 | 空中再次按跳跃制动悬停，木乃伊预警后变身飞行追击 |
| 冒险岛 | 破蛋后道具弹出、落地及接触拾取，滑板滚动与飞鸟俯冲 |
| 超级马里奥 | 蹲滑碰撞、低顶阻止站起、移动平台承载、连续踩敌与龟壳连杀递增奖励 |
| 海岸卡丁车 | 三级漂移火花、尾流超车与音效；修复离路或刹车后错误发放漂移奖励 |
| 悠岛生活 | 昼夜鱼种、试探咬钩、尺寸记录、共享图鉴和首次发现奖励，兼容旧存档 |

详细规则及独立实现的差异见各游戏 `docs/reference.md`；本轮不宣称已完成逐帧复刻。

## 复现验证

本轮验证结果：220 项模型测试、131 项手柄回归全部通过；九款游戏各 4 个兼容场景与中英文两套页面集成场景通过。最新九份手柄脚本通过 Chrome 61 语法检查，`git diff --check` 通过。

在仓库根目录安装浏览器测试依赖：

```sh
npm ci --prefix desktop
export CHROMIUM_PATH=/usr/bin/chromium
python resource/apps/jackal/tools/extract-artwork.py --output /tmp/puretv-jackal-art
export JACKAL_ART_DIR=/tmp/puretv-jackal-art
node --test resource/apps/{tank,jackal,jewel,tetris,bomb-jack,adventure-island,super-mario,coast-kart,cozy-island}/tests/*.test.cjs
```

每款游戏另运行 `tests/controller.mjs`、`tests/compatibility.mjs` 和 `tests/capture.mjs`。共享的 `tools/tests/controller-zones.mjs` 通过真实触屏事件覆盖分区边缘、同时按键、跨区拖动、长按和指针捕获失败后的释放；capture 用例覆盖中英文、双手机连接、暂停／重连、四种电视尺寸和退出清理。建议串行运行浏览器用例，避免大量 Chromium 实例竞争导致短时动作检测超时。
