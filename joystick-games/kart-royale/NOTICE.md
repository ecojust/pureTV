# Kart Royale 来源与许可

非官方 pureTV 适配，固定来源 ryancampbell/kart-royale 的 036c0efb025f5ecf8fc31c405e9d818c61e03e21。原103文件/依赖锁完整保留；线上后来改成 homie 多人版，不属于此移植。

根 LICENSE 是 MIT，Copyright (c) 2026 Ryan Campbell；原 package.json 标为 ISC，两份事实原样保留。运行依赖 Three.js 0.185.1、n8ao 2.0.0、postprocessing 6.39.3、simplex-noise 4.0.3 均按原锁精确版本，分发中保留相应 LICENSE。

保留原赛道、轮胎/悬架物理、AI、道具与漂移阈值/奖励。原作者披露的多数漂移未兑现与收益集中单弯问题没有擅自改规则掩盖；连接取消仅调用原 forfeitDrift 路径，不触发释放奖励。暂停必须明确恢复，移除原油门自动恢复出口。
