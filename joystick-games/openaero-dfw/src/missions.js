// Mission catalogue. Approaches and takeoffs are defined by a real runway end (airports.js);
// tours spawn a few km south of their landmark (landmarks.js), heading straight at it. The
// <select> and mission loader are built from this table.
import { DOWNTOWN_DALLAS, ATT_STADIUM } from './landmarks.js';
import { latLonToSimMeters } from './geo.js';
import { TIME_MODES } from './sun.js';

// Drills away from the airports start over Grapevine Lake (32°58'N 97°04'W, Wikipedia), north
// of DFW: a fixed point anyone can see from 4,500 ft.
const GRAPEVINE_LAKE = latLonToSimMeters(32.967, -97.067);
// The dead-stick challenge (0036) starts abeam the middle of Addison's runway, 2 NM east: a
// left downwind for 16 (heading 340), the runway off the left wing (tests/unit/deadStick.test.js
// checks it against the runway's surveyed ends).
const ADS_ABEAM = latLonToSimMeters(32.97991, -96.79924);
// The traffic pattern (0048, pattern.js) starts on a left downwind for Addison 16: 0.75 NM east
// of the centreline, 0.5 NM before abeam the (displaced) threshold, heading the reciprocal
// (tests/unit/pattern.test.js checks it against the runway's surveyed ends).
const ADS_DOWNWIND = latLonToSimMeters(32.97173, -96.82205);
// Joining the pattern (0187, pattern.js entryLeg): 4 NM out on the 45° line to the downwind's middle
// (abeam the runway's midpoint, 0.75 NM east), heading it (295°: a right turn onto the 340° downwind).
const ADS_ENTRY = latLonToSimMeters(32.94468, -96.75069);
// The power-off 180 (0189, power180.js): a left downwind for 16 half a mile east of the centreline, abeam the
// spot (the 1,000 ft aiming-point marking past the displaced threshold; tests/unit/power180.test.js checks it).
const ADS_ABEAM_SPOT = latLonToSimMeters(32.97555, -96.82898);
// Turns around a point (0211): fields west of Justin, ~7.5 NM north of Alliance (KAFW, 32.99N 97.32W) and away from
// its towered airspace, inside the terrain's DEM (terrain.js: ±48 km east-west, ±42 km north-south).
const AROUND_POINT = latLonToSimMeters(33.115, -97.345);

export const MISSIONS = [
  { key: 'kdfw_35c_final', label: "KDFW 35C 跑道：4 海里仪表进近", blurb: "距跑道 4 海里，航向已对准 35C。跟随绿色速度矢量和四灯坡度指示器（PAPI）下降。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 4 },
  { key: 'kdfw_35c_flare', label: "KDFW 35C：最后 1 海里拉平挑战", blurb: "距跑道 1 海里，高度 300 英尺。把握拉平时机，让飞机轻柔接地。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 1 },
  { key: 'kdfw_takeoff', label: "KDFW 35C：起飞滑跑", blurb: "踩住刹车，设定起飞推力，再松刹车。听到 Vr 报速后抬轮。", kind: 'takeoff', airport: 'KDFW', rwy: '35C' },
  // Go-around drill (0047): spawned 20 kt fast and one glideslope dot high on purpose.
  { key: 'go_around_drill', label: "KDFW 35C：复飞训练", blurb: "飞机起始速度和高度偏高。听到 500 英尺稳定进近检查提示时即可复飞，也可提前决定。加推力、爬升、收襟翼和起落架；若能重新建立稳定进近，也可继续着陆。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 4, fastKts: 20, highDots: 1, goAround: true },
  // Rejected takeoff drill (0107, rto.js): the 737's engine fire warning comes below V1 on the roll.
  { key: 'kdfw_35c_rto', label: "KDFW 35C：737 中断起飞", blurb: "沿 35C 全推力滑跑，V1 前将出现发动机火警。收至慢车，使用刹车和反推，在跑道内停稳。", kind: 'takeoff', airport: 'KDFW', rwy: '35C', aircraft: 'b738', rto: true },
  // Microburst windshear drill (0112, windshear.js): the 737 meets a microburst at 600 ft on a 3 NM final.
  { key: 'kdfw_35c_windshear', label: "KDFW 35C：737 风切变脱离", blurb: "短五边有微下击暴流。听到风切变警报时加至全推力，保持机头上仰 15°，避免低头追赶损失的空速。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 3, aircraft: 'b738', windshear: true },
  // Night and dusk (0060): `sun` flies that When? preset for the mission's run only (missionSun).
  // Low-ceiling ILS (0092, lowIfr.js): a scripted LIFR report (400 ft broken, 2 SM), the Weather group.
  { key: 'kdfw_35c_low_ifr', label: "KDFW 35C：低云仪表进近（5 海里）", blurb: "云底 400 英尺，薄雾中能见度 2 英里。跟随 ILS 指引下降。到达 200 英尺决断高度后，看到跑道灯光可继续着陆，否则复飞。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 5, lowIfr: true, group: 'weather' },
  { key: 'kdfw_35c_night', label: "KDFW 35C：夜间仪表进近（4 海里）", blurb: "循进近灯的顺序闪光和 PAPI，引导飞机降落在亮灯的跑道上。结束后恢复原先的时段设置。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 4, sun: 'Night' },
  // Wake turbulence (0115, wake.js): the Cessna behind the traffic 737 (traffic.js) landing on the same runway;
  // flown at midday (the jet has no lights yet: none after dark). AIM 7-4-6's procedure is graded, no vortex is flown.
  { key: 'kdfw_35c_wake', label: "KDFW 35C：塞斯纳尾流避让", blurb: "一架 737 在前方进近，尾流会下沉。保持在它的航迹上方，观察它的接地点并在更远处着陆。入门模式自动辅助；任务按飞行轨迹评分，不施加尾流推力。固定正午光照，结束后恢复。", kind: 'final', airport: 'KDFW', rwy: '35C', distNm: 5, aircraft: 'c172', wake: true, sun: 'Noon' },
  { key: 'kdfw_17c_final', label: "KDFW 17C：南向进近（4 海里）", blurb: "从北侧进近中央跑道，体验达拉斯—沃思堡遇南风时的着陆方向。", kind: 'final', airport: 'KDFW', rwy: '17C', distNm: 4 },
  { key: 'kdfw_36l_final', label: "KDFW 36L：西侧进近（6 海里）", blurb: "从南面飞入机场西侧，体验较长的 6 海里五边。", kind: 'final', airport: 'KDFW', rwy: '36L', distNm: 6 },
  { key: 'kdfw_13r_final', label: "KDFW 13R：斜向跑道进近（5 海里）", blurb: "进近机场西侧的斜向跑道，体验偏离主跑道南北轴线的航向。", kind: 'final', airport: 'KDFW', rwy: '13R', distNm: 5 },
  { key: 'kdal_31r_final', label: "KDAL 达拉斯爱田机场：31R 进近", blurb: "从东南方向飞越机场附近的达拉斯街区，进入爱田机场。", kind: 'final', airport: 'KDAL', rwy: '31R', distNm: 4 },
  { key: 'kdal_31r_dusk', label: "KDAL 爱田机场：黄昏 31R 进近", blurb: "从东南方飞入，西边夕阳低垂。任务结束后恢复原先的时段设置。", kind: 'final', airport: 'KDAL', rwy: '31R', distNm: 4, sun: 'Dusk' },
  { key: 'kdal_13l_final', label: "KDAL 爱田机场：13L 进近", blurb: "从西北侧进近，可在前方看到达拉斯市区天际线。", kind: 'final', airport: 'KDAL', rwy: '13L', distNm: 5 },
  { key: 'kads_16_final', label: "KADS 艾迪生 16：短跑道进近", blurb: "从 3 海里外向艾迪生进近，跑道两侧是北达拉斯的办公楼群。", kind: 'final', airport: 'KADS', rwy: '16', distNm: 3 },
  // Dead-stick challenge (0036, deadStick.js): the Cessna's engine has quit, 3,500 ft up.
  { key: 'deadstick_kads_16', label: "KADS 艾迪生：塞斯纳无动力滑翔", blurb: "距艾迪生 2 海里时发动机停止。保持 68 节滑翔，按教练提示转向跑道并着陆。", kind: 'drill', airport: 'KADS', rwy: '16', aircraft: 'c172', pos: [ADS_ABEAM.x, ADS_ABEAM.z], aglFt: 3500, kias: 75, hdg: 340, deadStick: true },
  // Traffic pattern (0048, pattern.js): downwind, base and final, coached; the landing graded as usual.
  { key: 'pattern_kads_16', label: "KADS 艾迪生：塞斯纳起落航线", blurb: "在机场上方 1,000 英尺进入下风边，依次转入四边、五边并着陆。", kind: 'drill', airport: 'KADS', rwy: '16', aircraft: 'c172', pos: [ADS_DOWNWIND.x, ADS_DOWNWIND.z], aglFt: 1000, kias: 85, hdg: 340, pattern: true },
  // Joining the pattern (0187, pattern.js entryLeg): the 45° entry to that downwind, then the circuit; the join is graded on the card.
  { key: 'pattern_entry_kads', label: "KADS 艾迪生：塞斯纳加入起落航线", blurb: "从 4 海里外保持场高 1,000 英尺，以 45° 切入下风边，在跑道中部旁右转加入，随后着陆。加入时保持 70–100 节并平飞；跳过下风边最高只能得 C。", kind: 'drill', airport: 'KADS', rwy: '16', aircraft: 'c172', pos: [ADS_ENTRY.x, ADS_ENTRY.z], aglFt: 1000, kias: 90, hdg: 295, pattern: true, entry: true },
  // Power-off 180 (0189, power180.js, the dead-stick's machinery): the engine quits abeam the spot, 1,000 ft up; land on it.
  { key: 'pad_180_kads_16', label: "KADS 艾迪生：180° 无动力定点着陆", blurb: "发动机在 16 跑道下风边停车，此时距地 1,000 英尺，正侧方是白色标志块。以 68 节滑翔转弯，接地点应在标志块或其后 200 英尺内，不能提前接地。", kind: 'drill', airport: 'KADS', rwy: '16', aircraft: 'c172', pos: [ADS_ABEAM_SPOT.x, ADS_ABEAM_SPOT.z], aglFt: 1000, kias: 85, hdg: 340, deadStick: true, power180: true, group: 'drills' },
  // Engine failure after takeoff (0104, engineOut.js): the Cessna's engine quits in the climb out of 16.
  // POH normal takeoff (flaps 0°) from the start of the pavement (16's displaced 979 ft is usable for it).
  // Short-field landing (0181, shortField.js): the POH's technique to Addison 16's numbers, graded against Fig. 5-11's roll.
  { key: 'kads_16_short_field', label: "KADS 艾迪生：塞斯纳短距着陆", blurb: "3 海里外以 70 节、襟翼收起进近。放全襟翼后循 PAPI 保持 61 节；跑道入口收慢车，在 1,000 英尺白色标志块前接地，立即制动。滑跑距离将与手册值比较。", kind: 'final', airport: 'KADS', rwy: '16', distNm: 3, aircraft: 'c172', kias: 70, flaps: 0, shortField: true, group: 'drills' },
  // No-flap landing (0210, noFlap.js): the flap lever stuck at 0°; POH Section 4's flaps-up 65-75 KIAS, a flatter, faster final and a longer float.
  { key: 'kads_16_no_flap', label: "KADS 艾迪生：塞斯纳无襟翼着陆", blurb: "襟翼卡在收起位。距跑道 4 海里时循 PAPI 保持 70 节（手册范围 65–75 节）。机头较高，拉平后的飘距较长，让飞机自然接地再刹车。成绩卡也显示襟翼 30° 的估算滑跑距离。", kind: 'final', airport: 'KADS', rwy: '16', distNm: 4, aircraft: 'c172', kias: 70, flaps: 0, noFlap: true, group: 'drills' },
  // Wing-low crosswind landing (0188, wingLow.js): AFH ch. 9 (pp. 9-15 to 9-17), the upwind wheel first; Addison's METAR when it blows across, else a scenario wind.
  { key: 'kads_crosswind_wing_low', label: "KADS 艾迪生：低翼侧风着陆", blurb: "迎风翼稍低抑制侧移，用方向舵将机头对准 16 跑道。拉平时保持修正，让迎风侧主轮先接地。若当地风适合则使用实时侧风，否则使用右侧 12 节风；触屏可用油门旁的方向舵按钮。", kind: 'final', airport: 'KADS', rwy: '16', distNm: 2, aircraft: 'c172', kias: 70, flaps: 1, wingLow: true, group: 'drills' },
  // Short-field takeoff (0225, shortTakeoff.js): POH Section 4's checklist, graded against Fig. 5-5 for the day's air.
  { key: 'kads_16_short_field_takeoff', label: "KADS 艾迪生：塞斯纳短距起飞", blurb: "襟翼 10°，踩住刹车加全推力后松开。45 节轻拉，保持微抬前轮，约 51 节离地。爬升至 50 英尺前保持 56 节越障，再加速到 74 节。按当天条件对照手册距离评分。", kind: 'takeoff', airport: 'KADS', rwy: '16', aircraft: 'c172', flaps: 1, fullLength: true, shortTakeoff: true, group: 'drills' },
  // Hot-day takeoff (0226, shortTakeoff.js hot): the same lesson on a scenario 38 °C day, density altitude ~3,500 ft; Fig. 5-5 and 5-6 beside a cool day's.
  { key: 'kads_16_hot_takeoff', label: "KADS 艾迪生：炎热天气起飞", blurb: "夏日 38°C、静风、高度表 29.92，密度高度约 3,500 英尺。按短距程序起飞，超过 60 节收襟翼，以 74 节爬升。比较凉爽与炎热天气的滑跑距离和爬升表现。", kind: 'takeoff', airport: 'KADS', rwy: '16', aircraft: 'c172', flaps: 1, fullLength: true, shortTakeoff: true, hot: true, group: 'drills' },
  // Soft-field takeoff (0182, softField.js): flaps 10, the stick back through the roll on a soft surface's drag (a game surface).
  { key: 'kads_16_soft_field', label: "KADS 艾迪生：塞斯纳松软跑道起飞", blurb: "在模拟松软地面上保持滑行，减轻前轮负荷。飞机离地后贴近跑道利用地效加速，再建立爬升；成绩卡将检查滑跑、离地和爬升。", kind: 'takeoff', airport: 'KADS', rwy: '16', aircraft: 'c172', flaps: 1, fullLength: true, softField: true, group: 'drills' },
  // Crosswind takeoff (0220, xwTakeoff.js): AFH ch. 6 (pp. 6-6 to 6-9), aileron into the wind, the rudder on the line, then a crab; the wing-low lesson's wind.
  { key: 'kads_crosswind_takeoff', label: "KADS 艾迪生：塞斯纳侧风起飞", blurb: "在 16 跑道迎风侧打副翼，用方向舵保持中线，加速时逐渐减小修正。离地后向风中修正航向，维持跑道延长线航迹。", kind: 'takeoff', airport: 'KADS', rwy: '16', aircraft: 'c172', flaps: 0, fullLength: true, xwTakeoff: true, group: 'drills' },
  { key: 'efato_kads_16_300', label: "KADS 艾迪生：300 英尺发动机故障", blurb: "在 16 跑道全推力起飞，55 节抬轮。发动机在 300 英尺停车，建立 68 节滑翔，在前方选择着陆区。", kind: 'takeoff', airport: 'KADS', rwy: '16', aircraft: 'c172', flaps: 0, fullLength: true, engineOutFt: 300 },
  { key: 'efato_kads_16_700', label: "KADS 艾迪生：700 英尺发动机故障", blurb: "在 16 跑道起飞，发动机在 700 英尺停车。按 74 节爬升的实际表现和当时风况判断能否返场，留意教练对转弯的提示。", kind: 'takeoff', airport: 'KADS', rwy: '16', aircraft: 'c172', flaps: 0, fullLength: true, engineOutFt: 700 },
  { key: 'kafw_34l_final', label: "KAFW 联盟机场：34L 进近", blurb: "前往沃思堡以北的联盟机场，体验繁忙货运机场宽长的跑道。", kind: 'final', airport: 'KAFW', rwy: '34L', distNm: 5 },
  { key: 'kftw_16_final', label: "KFTW 米查姆机场：16 跑道", blurb: "米查姆是沃思堡历史悠久的机场，就在沃思堡市中心以北。", kind: 'final', airport: 'KFTW', rwy: '16', distNm: 4 },
  { key: 'kgky_34_final', label: "KGKY 阿灵顿机场：34 跑道", blurb: "从 3 海里外飞入阿灵顿市立机场，球场就在机场北侧。", kind: 'final', airport: 'KGKY', rwy: '34', distNm: 3 },
  // Stall recovery drill (0087, stallDrill.js): the Cessna, clean, at 90 KIAS and cruise power.
  { key: 'c172_stall_recovery', label: "塞斯纳：失速改出", blurb: "在格雷普韦恩湖上空收至慢车，抬头直至失速。降低机头，保持机翼水平，加全推力，恢复爬升。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 4500, kias: 90, hdg: 0, stallDrill: true },
  // Power-on (departure) stall (0191, powerOnStall.js): flaps 10 at lift-off speed (AFH pp. 5-17/5-18), then full power and the nose up.
  { key: 'c172_power_on_stall', label: "塞斯纳：有动力失速训练", blurb: "模拟起飞后的低速状态。襟翼 10°、全推力，机头上仰 20° 并保持航向直至失速。随后降低机头、平翼，保持推力，收襟翼爬升。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 4500, kias: 60, flaps: 1, hdg: 0, stallDrill: true, powerOn: true },
  // Steep turns (0161, steepTurns.js): the Cessna, clean, at 95 KIAS (under its 105 KIAS VA), level.
  { key: 'steep_turns', label: "塞斯纳：大坡度盘旋", blurb: "在格雷普韦恩湖上空保持 45° 坡度盘旋一周，再向另一侧盘旋，保持高度（±100 英尺）和速度。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 3000, kias: 95, hdg: 0, steepTurns: true },
  // Slow flight (0164, slowFlight.js): the Cessna, clean, at 95 KIAS, slows to just above its stall warning.
  { key: 'c172_slow_flight', label: "塞斯纳：慢飞训练", blurb: "收油门、抬机头，减速至接近失速警告。再加推力，在警告不响的前提下保持高度（±100 英尺）与航向（±10°）45 秒。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 4500, kias: 95, hdg: 0, slowFlight: true },
  // Emergency descent (0209, emergencyDescent.js): smoke in the cockpit; idle, a 30-45° bank and VA (105 KIAS) down 3,000 ft.
  { key: 'c172_emergency_descent', label: "塞斯纳：紧急下降", blurb: "座舱出现烟雾，需快速下降 3,000 英尺。收慢车，坡度 30–45°，保持 95–105 节，不得超过 163 节；在教练指定高度平飞（±100 英尺）。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 5000, kias: 100, hdg: 0, emergencyDescent: true },
  // Turns around a point (0211, aroundPoint.js): a lit pole in the fields north-west of Alliance; the Cessna 1,000 ft above
  // them at 90 KIAS on the downwind entry (AFH ch. 7), half a mile before abeam the pole, the circle's 1,500 ft off its left wing.
  { key: 'turns_around_point', label: "塞斯纳：绕地标盘旋", blurb: "南风 12 节，标杆位于左前方。当杆到左翼尖侧方时向左盘旋两周，半径保持 1,500 英尺。顺风时坡度较大，迎风时减小，最大 45°；保持 1,000 英尺和 90 节。航向条下方显示方位及距离。", kind: 'drill', aircraft: 'c172', pos: [AROUND_POINT.x + 1500 * 0.3048, AROUND_POINT.z + 926], point: [AROUND_POINT.x, AROUND_POINT.z], radiusFt: 1500, wind: [180, 12], aglFt: 1000, kias: 90, hdg: 0, aroundPoint: true },
  // The rectangular course (0223, rectCourse.js): the same fields, a 1/2 by 3/4 mile field with a lit pole at each corner; the
  // Cessna 1,000 ft above them at 90 KIAS on the downwind leg (AFH ch. 7), 2,640 ft east of the field, half a statute mile short of abeam it.
  { key: 'rectangular_course', label: "塞斯纳：矩形地面航线", blurb: "南风 12 节，四根标杆围成一块田地。向左绕行两圈，始终与田地边缘保持半英里；用航向修正侧风，顺风转弯坡度较大，最大 45°。保持 1,000 英尺（±100）和 90 节（±10）。", kind: 'drill', aircraft: 'c172', pos: [AROUND_POINT.x + (1320 + 2640) * 0.3048, AROUND_POINT.z + (1980 + 2640) * 0.3048], field: [AROUND_POINT.x, AROUND_POINT.z], fieldFt: [2640, 3960], distFt: 2640, wind: [180, 12], aglFt: 1000, kias: 90, hdg: 0, rectCourse: true },
  // S-turns across a road (0224, sTurns.js): the same fields, an east-west line of five lit poles 3,000 ft apart as the road (the
  // crossings of four 1,500 ft half-circles going west); the Cessna 1,000 ft above them at 90 KIAS, downwind (AFH ch. 7),
  // 1,200 m south of the first pole and heading north across the road, the 12 kt south wind behind it.
  { key: 's_turns_road', label: "塞斯纳：跨道路 S 形转弯", blurb: "五根相距 3,000 英尺的标杆代表东西向道路，南风 12 节。平翼飞越第一根，交替左右飞四个半圆，半径 1,500 英尺，每次越过下一标杆时恢复平翼。保持 1,000 英尺和 90 节，坡度不超过 45°。", kind: 'drill', aircraft: 'c172', pos: [AROUND_POINT.x + 4 * 1500 * 0.3048, AROUND_POINT.z + 1200], road: [AROUND_POINT.x + 4 * 1500 * 0.3048, AROUND_POINT.z], radiusFt: 1500, wind: [180, 12], aglFt: 1000, kias: 90, hdg: 0, sTurns: true },
  // Unusual attitudes (0174, upset.js): level at 100 KIAS, then the instructor hands it over nose-high or nose-low.
  { key: 'upset_nose_high', label: "塞斯纳：大仰角异常姿态", blurb: "教练将机头拉高、让飞机减速后交给你。加全推力，把机头降向地平线并恢复平翼。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 5000, kias: 100, hdg: 0, upset: 'high' },
  { key: 'upset_nose_low', label: "塞斯纳：大俯角异常姿态", blurb: "教练将飞机带入大坡度下降转弯后交给你。先收慢车、平翼，再抬头改出，避免带坡度拉起。", kind: 'drill', aircraft: 'c172', pos: [GRAPEVINE_LAKE.x, GRAPEVINE_LAKE.z], aglFt: 5000, kias: 100, hdg: 0, upset: 'low' },
  { key: 'downtown_skyline', label: "达拉斯市中心天际线观光", blurb: "飞越达拉斯市中心的美国银行广场与重逢塔。", kind: 'tour', pos: [DOWNTOWN_DALLAS.x, 520, DOWNTOWN_DALLAS.z + 3200], speedMps: 108, hdg: 0, throttle: 0.65 },
  { key: 'att_stadium', label: "阿灵顿 AT&T 体育场观光", blurb: "低空飞越阿灵顿，游览 AT&T 体育场及旁边的棒球场。", kind: 'tour', pos: [ATT_STADIUM.x, 480, ATT_STADIUM.z + 2900], speedMps: 100, hdg: 0, throttle: 0.62 },
];

// `extra`: missions that exist only some days (today's crosswind challenge).
export const missionByKey = (key, extra = []) =>
  extra.find((m) => m.key === key) || MISSIONS.find((m) => m.key === key) || MISSIONS[0];

// Night and dusk missions (0060): a mission with `sun` flies under that When? preset (an index
// into TIME_MODES) for its run only. `before` is the player's own choice it replaced, kept through
// FLY AGAIN and other sun missions and given back by the next mission without one; a choice the
// player makes in between is theirs (main.js drops `before`). Pure.
export function missionSun(mission, mode, before) {
  const i = mission.sun ? TIME_MODES.indexOf(mission.sun) : -1;
  if (i >= 0) return { mode: i, before: before ?? mode };
  return before == null ? { mode, before: null } : { mode: before, before: null };
}

export const CROSSWIND_KEY = 'crosswind_today';

// The start screen's mission picker (ticket 0029) is generated from MISSIONS: the recommended
// first flight on top, then one group per airport in this order (an airport not listed here
// gets its own group after them), then the weather missions (`group: 'weather'`, 0092), then the drills flown away from an
// airport (and `group: 'drills'`, 0181's short-field, 0182's soft-field and 0210's no-flap lessons), then the tours. Every key appears once; empty groups drop.
export const RECOMMENDED_KEY = 'kdfw_35c_final';
const AIRPORT_ORDER = ['KDFW', 'KDAL', 'KADS', 'KAFW', 'KFTW', 'KGKY'];

export function groupMissions(missions) {
  const groups = [{ id: 'recommended', missions: [] }, ...AIRPORT_ORDER.map((id) => ({ id, missions: [] }))];
  const weather = { id: 'weather', missions: [] };
  const drills = { id: 'drills', missions: [] };
  const tours = { id: 'tours', missions: [] };
  const byId = new Map(groups.map((g) => [g.id, g]));
  for (const m of missions) {
    if (m.key === RECOMMENDED_KEY) { byId.get('recommended').missions.push(m); continue; }
    if (m.group === 'weather') { weather.missions.push(m); continue; }
    if (m.group === 'drills' || (m.kind === 'drill' && !m.airport)) { drills.missions.push(m); continue; }
    if (m.kind === 'tour' || !m.airport) { tours.missions.push(m); continue; }
    let g = byId.get(m.airport);
    if (!g) { g = { id: m.airport, missions: [] }; byId.set(m.airport, g); groups.push(g); }
    g.missions.push(m);
  }
  return [...groups, weather, drills, tours].filter((g) => g.missions.length);
}
