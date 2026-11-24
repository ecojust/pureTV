import './arena-core.js';
import { createController } from '../../shared/web/standard-gamepad.js';
import { navigateMenu, navigateAccessibility } from './menu.js';
import * as THREE from 'three';
window.__glGuard && __glGuard.started(); // three.js loaded: the load-failure watchdog (head guard script) stands down

/* =====================================================================================================
   DOLMUŞ  -  single file Three.js arcade minibus game
   Built by Claude Sonnet 5.5 with Claude Code from one prompt (see prompts/dolmus.md)
   ===================================================================================================== */

// ---------------------------------------------------------------- utils
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const wrapAng = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const hyp = Math.hypot;
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const Q = new URLSearchParams(location.search);
const FLAG = { auto: Q.has('auto'), debug: Q.has('debug'), low: Q.has('low'), noaudio: Q.has('noaudio'), touch: Q.has('touch'), noassets: Q.has('noassets') };
const SIM_PRE = parseFloat(Q.get('sim')) || 0;
const SEED = parseInt(Q.get('seed') || '7', 10);
const START_LEVEL = parseInt(Q.get('level') || '0', 10);
let WR = mulberry(1234);            // world-generation rng
const DR = mulberry(2024);            // district / decoration rng (separate stream)
let R = mulberry(SEED);             // gameplay rng
const rr = (a, b) => a + R() * (b - a);
const pick = arr => arr[Math.floor(R() * arr.length)];
const wr = (a, b) => a + WR() * (b - a);
const wpick = arr => arr[Math.floor(WR() * arr.length)];

// ---------------------------------------------------------------- i18n
const STOPS = {
  balat: ['Balat', 'Balat'], galata: ['Galata', 'Galata'], meydan: ['Cami Meydanı', 'Mosque Square'],
  besiktas: ['Beşiktaş', 'Beşiktaş'], tram: ['Tramvay Durağı', 'Tram Stop'], carsi: ['Çarşı', 'Bazaar'],
  kopru: ['Köprü Başı', 'Bridge End'], iskele: ['Vapur İskelesi', 'Ferry Pier'], kadikoy: ['Kadıköy', 'Kadıköy'],
  karakoy: ['Karaköy', 'Karaköy'], eminonu: ['Eminönü', 'Eminönü'], fener: ['Fener', 'Fener'],
};
const STR = {
  tr: {
    subtitle: 'İstanbul sokaklarında dolmuş sür, yolcuları al, bırak, kazan.',
    howtoTouch: 'Direksiyonu çubukla çevir. Sağdaki pedal kaydırıcısını yukarı çek: gaz, aşağı çek: fren. Sarı halkada kapı düğmesiyle dur ve yolcuları al. Kırmızıda geçme!',
    howto: 'Yön tuşlarıyla sür. Sarı halkada A ile dur ve kapıyı aç. X korna. Yolcuların sabrı sınırlı, kırmızıda geçme!',
    loading: 'Yükleniyor… {0}/{1}', play: 'Oyna', continue: 'Devam', newGame: 'Yeni oyun', newGameSure: 'Kayıt silinsin mi? Tekrar bas', bubMood: '{0} {1}, lütfen.', endless: 'Sonsuz mod', settings: 'Ayarlar',
    language: 'Dil', paused: 'Duraklatıldı', resume: 'Devam et', restart: 'Yeniden başla', menu: 'Ana menü',
    startShift: 'Vardiyayı başlat', master: 'Genel ses', music: 'Müzik', effects: 'Efektler', quality: 'Kalite',
    low: 'Düşük', high: 'Yüksek', mapMode: 'Mini harita', mapHead: 'Yöne göre', mapNorth: 'Kuzey üstte', fullscreen: 'Tam ekran', toggle: 'Aç / kapat', back: 'Geri',
    keysHelp: 'START duraklat · A kapı · B fren · X korna · Y harita',
    keysHelpTouch: 'Üst çubuk: duraklat, ses, dil · KAPI düğmesi dur / kapı · KORNA düğmesi korna',
    pGas: 'GAZ', pBrake: 'FREN', pDoor: 'KAPI', pHorn: 'KORNA', aGas: 'Gaz', aBrake: 'Fren', aDoor: 'Kapı', aHorn: 'Korna',
    aPedal: 'Gaz / Fren', pedalMode: 'Pedal', pedSlider: 'Kaydırıcı', pedSep: 'Ayrı',   // unified mobile pedal
    retry: 'Tekrar dene', next: 'Sonraki seviye', nextShift: 'Sonraki vardiya', playAgain: 'Tekrar oyna',
    level: 'Seviye', shift: 'Vardiya', fares: 'Hasılat', seats: 'Koltuk', dents: 'Hasar', pause: 'Duraklat', sound: 'Ses', tl: 'TL',
    bestLine: 'En iyi: {0} TL · {1}/24 yıldız · Sonsuz: {2} TL', bestNone: 'Henüz rekor yok.',
    news: 'Yenilikler', verTag: 'v2.1 · Kasım 2026', others: 'Diğer oyunlar', newsH: 'Bu güncellemede',
    newsList: ['Yenilikler penceresi ve sürüm etiketi (bu ekran).', 'Yerel rekor tablosu: en iyi 5 vardiyan bu cihazda saklanır.', 'Rozetler: kusursuz vardiya, üç yıldız, ıslak yol ustası, günün vardiyası ve hat veteranı.', 'Açılış ekranında "Diğer oyunlar" bağlantısı; Türkçe sayfa açıklaması, paylaşım kartı ve 404 sayfası.'],
    boardH: 'En iyi 5 vardiya', boardNone: 'Henüz kayıtlı vardiya yok. Bir vardiyayı yıldızla bitir, burada görünsün.', badgesH: 'Rozetler', badgeNew: 'Yeni rozet: {0}',
    bgClean: 'Kusursuz vardiya', bgCleanD: 'Çarpışma, kırmızıda geçme ve sert fren olmadan yıldız al', bg3: 'Üç yıldız', bg3D: 'Bir vardiyayı 3 yıldızla bitir',
    bgRain: 'Islak yol ustası', bgRainD: 'Yağmurlu bir seviyeyi (3, 5 ya da 8) çarpmadan bitir', bgDaily: 'Günün vardiyası', bgDailyD: 'Günün Meydan Okuması\'nı bitir',
    bg10: 'Hat veteranı', bg10D: '10 vardiya bitir ({0}/10)', bgOn: 'Kazanıldı',
    lv1: 'Ana cadde turu', lv2: 'Köprü ve tramvay', lv3: 'Yağmur başlıyor', lv4: 'Dar sokaklar', lv5: 'Trafik kilitlendi',
    lv6: 'Vapur iskelesi', lv7: 'Akşam telaşı', lv8: 'Gece vardiyası', lvE: 'Sonsuz vardiya {0}',
    d1: 'Sabah işe gidenlerle dolu ana cadde. Isın, yolcuları al ve doğru durakta indir.',
    d2: 'Yeni yollar: köprü ve sahil. Cadde ortasında tramvay çalışıyor, raylara dikkat.',
    d3: 'Yağmur geliyor: yol kayganlaşır, duraklar dolar. Teslimat kamyoneti şeridi tıkıyor.',
    d4: 'Arabaların kaldırıma park ettiği dar sokaklar. Önemli bir yolcu (VIP) seni arıyor.',
    d5: 'Ana caddede trafik kilitlenebilir. Sabırlı ol, yolcular da sabırlı olsun.',
    d6: 'Sahil yolu ve vapur iskelesi: vapur gelince duraklar kalabalıklaşır.',
    d7: 'Akşam hava kararıyor. Yağmur, trafik, VIP: hepsi bir arada.',
    d8: 'Gece vardiyası. Işıklar yanıyor, yollar ıslak, işin zor.',
    dE: 'Bitmeyen vardiya: her tur biraz daha zor. Aracın dağılana ya da hedefi kaçırana kadar sür.',
    f_traffic: 'Işıklar, zebra geçitleri ve trafik', f_tram: 'Tramvay hattı', f_bridge: 'Köprü ve sahil yolu', f_rain: 'Yağmur: kaygan yol, dolu duraklar',
    f_van: 'Çift park eden teslimat kamyoneti', f_side: 'Dar sokaklar, kaldırıma park', f_vip: 'VIP yolcu', f_jam: 'Trafik sıkışıklığı olayı', f_night: 'Gece sürüşü',
    f_pier: 'Vapur iskelesi durağı', f_stops: '{0} durak', f_bus: 'Otobüs durakta bekler',
    tgt: 'Hedef', star1: '1 yıldız', star2: '2 yıldız', star3: '3 yıldız',
    toastAutoLow: 'Akıcı oynanış için kalite Düşük’e alındı (Ayarlar’dan değiştirilebilir).', toastStart: 'Vardiya başladı! Sarı halkalara git.', toastNoBiz: 'Burada kimse yok.', toastFull: 'Dolmuş dolu!',
    penRed: 'Kırmızı ışık! -{0} TL', penHit: 'Çarpışma! -{0} TL', penBrake: 'Sebepsiz sert fren, yolcular şikayetçi -{0} TL', penSkip: 'El sallayan yolcuyu geçtin -{0} TL',
    penLeft: 'Yolcu sabretmedi -{0} TL', penPed: 'Yayaya çarptın! -{0} TL', missed: 'Durağı kaçırdın!', vipAboard: 'VIP yolcu bindi! Hızlı git.',
    vipSpawn: 'VIP yolcu bekliyor: {0}', jamOn: 'Ana caddede trafik kilitlendi!', jamOff: 'Trafik açıldı.', rainOn: 'Yağmur başladı: yol kaygan.', rainOff: 'Yağmur dindi.',
    vanOn: 'Teslimat kamyoneti şeridi kapattı.', tramBell: 'Tramvay geliyor!', wrecked: 'Dolmuş perte çıktı!',
    fareAdd: '+{0}', tipAdd: '+{0} TL bahşiş',
    endClear: 'Vardiya bitti', endFail: 'Hedefe ulaşamadın', endWreck: 'Dolmuş hurdaya döndü', endWin: 'Tebrikler, usta!', endEndless: 'Sonsuz mod bitti',
    subClear: 'Harika sürüş!', subFail: 'Yarım yıldız bile yok: tekrar dene.', subWreck: 'Hasar yüzde 100’e ulaştı.', subWin: '8 vardiyayı bitirdin. Şehir senin.', subEndless: 'Toplam hasılat: {0} TL',
    sFares: 'Ücretler', sTips: 'Bahşişler', sPen: 'Cezalar', sNet: 'Net hasılat', sPass: 'Taşınan yolcu', sDent: 'Hasar', sTotal: 'Toplam', sWave: 'Vardiya',
    newRecord: 'Yeni rekor!', hintStop: 'Dur / kapı', hintSpace: '<b>A</b> dur + kapı · <b>X</b> korna', hintDoor: 'Kapı açık…',
    guideTo: '{0}', guideDrop: 'İndir', guidePick: 'Yolcu al', guideCruise: 'Sonraki durak', guideM: '{0} m',
    bubVip: 'Acelem var! {0}, hemen!',
    // passenger voices (flavour only): one group per passenger type, plus the "anywhere" riders; {0} is the destination
    voice: {
      student: ['Dersim var, {0}’a yetiştir abi!', 'Kaptan, {0}! Sınava geç kalıyorum.', '{0}, öğrenci var abi!', 'Abi, {0}’da inerim, yavaş git.'],
      grandmother: ['Evladım, {0}’a gider misin?', 'Yavaş git oğlum, {0}.', 'Allah razı olsun, {0} lütfen.', 'Torunlara gidiyorum, {0}…'],
      shopkeeper: ['Dükkânı açacağım, {0}!', '{0}, kolay gelsin usta!', 'Mal bekliyor, {0} diyelim.', 'Çay benden, {0}’a bırak!'],
      tourist: ['Bu araç {0}’a gider mi? Çok güzel!', 'Excuse me… {0}? Tamam?', 'Şehir harika! {0}, lütfen.', 'Fotoğraf çekiyorum, {0}!'],
      commuter: ['Acelem var, {0}!', '{0}, toplantıya yetişmem lazım!', 'Hızlı ama güvenli, {0}.', '{0}, çabuk olalım kaptan!'],
      any: ['Müsait bir yerde! {0} civarı yeter.', '{0} yakınında müsait bir yerde, usta!', 'Şurada müsait bir yer olunca, {0} dolayları.', 'Müsait yerde bırak, {0} civarı!', 'Uygun bir yerde dur, {0} yakını olsun!', 'Müsait bir yerde, kaptan! {0} tarafı.'],
    },
    close: 'Kapat', go: 'Hadi!',
    coach: 'İlk durak hemen burada: halkanın yanında dur, A düğmesine bas',
    coachTouch: 'İlk durak hemen burada: halkanın yanında dur, KAPI düğmesine dokun',
    f_any: 'Müsait bir yerde: kapıdaki halka ✓ yeşilse güvenli, ! turuncuysa geçide/kavşağa çok yakın',
    penBadStop: 'Tehlikeli yerde indirdin -{0} TL', easyStop: '+{0} TL kolay iniş',
    penBadStop_zebra: 'Yaya geçidine çok yakın ({1} m, en az 9 m) -{0} TL', penBadStop_junction: 'Kavşağa çok yakın ({1} m, en az 10 m) -{0} TL',
    brakeOk_ped: 'Acil fren: yaya. Ceza yok.', brakeOk_car: 'Acil fren: önde araç. Ceza yok.', brakeOk_light: 'Işıkta fren. Ceza yok.',
    tipLost: 'Para üstü zinciri bitmeden kalktın: -{0} TL bahşiş',
    anyNo_zebra: 'Zebra geçidinde yolcu indirilmez!', anyNo_junction: 'Kavşakta durma! Trafik korna çalıyor.', anyNo_signal: 'Işık kuyruğunda durma! Trafik korna çalıyor.',
    anyNo_lane: 'Şeridi kapatıyorsun, kenara çek.', anyNo_bridge: 'Köprüde durulmaz.', anyNo_curb: 'Burada kaldırım yok.',
    tip_brakes: 'Yolcular varken sert fren {0} TL kaybettirdi: frene daha erken bas.',
    tip_reds: 'Kırmızıda geçmek {0} TL kaybettirdi: sarıda yavaşla, kırmızıda dur.',
    tip_skips: 'El sallayan yolcuları geçmek {0} TL kaybettirdi: durağa yaklaşırken yavaşla.',
    tip_hits: 'Çarpışmalar {0} TL kaybettirdi: öndeki araçla mesafeni koru.',
    tip_ped: 'Yayaya çarpmak {0} TL kaybettirdi: zebra geçitlerinde yavaşla.',
    tip_gaveUp: 'Sabrı taşan yolcular {0} TL kaybettirdi: bekleyenleri çok bekletme.',
    tip_badStop: 'Kavşağa ya da geçide yakın indirmek {0} TL kaybettirdi: müsait yeri seç.',
    tip_tipsLost: 'Para üstü zinciri bitmeden kalkmak {0} TL bahşiş kaybettirdi: son parayı bekle.',
    tipClean: 'Temiz vardiya: ceza ve kayıp bahşiş yok.', bestTipLine: 'En iyi bahşiş: {0} TL', anyDropsLine: 'Müsait yerde inen yolcu: {0}', thx: ['Sağ ol kaptan!', 'Eline sağlık!', 'Allah razı olsun!', 'Kolay gelsin!'], angry: ['Çok bekledim!', 'Bu ne yavaşlık!', 'İneceğim!'],
    keyHelp: '↑ gaz · ↓ fren · ←/→ direksiyon · A kapı · X korna',
    pausedAuto: 'Sekme gizlendi, oyun duraklatıldı.', autoOn: 'Otomatik pilot açık',
    hatTitle: 'Hat Ustası', hatSub: 'Vardiyadan önce hattını kur: 3 durak seç, radyoyu ayarla.',
    hatStops: 'Hat durakları ({0}/3)', hatStopsHelp: 'Hat duraklarında yolcu daha sık birikir, diğer duraklarda daha seyrek. Hiç seçmezsen klasik vardiya.',
    hatRadio: 'Radyo / kaset', hatGo: 'Kontağı çevir', hatNeed3: 'Ya 3 durak seç ya hiç seçme',
    ch_off: 'Kapalı', ch_arabesk: 'Arabesk', ch_pop: 'Pop', ch_haber: 'Haberler', ch_turku: 'Türkü',
    chd_off: 'Radyo kapalı: yolcu karışımı her zamanki gibi.',
    chd_arabesk: 'Esnaf gelir: sabırlı, bahşişi bol. Turistler sıkılır.',
    chd_pop: 'Öğrenciler ve turistler: daha çok yolcu, öğrenci indirimli ve az bahşiş, sabırları kısa. Teyzeler sıkılır.',
    chd_haber: 'İşe gidenler: daha çok yolcu, biraz fazla öder, sabırsızdır. Öğrenciler sıkılır.',
    chd_turku: 'Teyzeler gelir: çok sabırlı ama az bahşiş, yolcu biraz seyrek. İşe gidenler sıkılır.',
    hatToast: 'Hat: {0} · Radyo: {1}', hatClassic: 'klasik',
    hatLine: 'Hat: {0} · Radyo: {1}', hatProfit: 'Hat kârı: {0} TL = hasılat {1} + bahşiş {2} − yakıt {3} − rölanti {4}',
    hatBest: 'Bu seviyenin en iyi hattı: {0} TL ({1} · {2})', hatNewBest: 'Yeni hat rekoru: {0} TL!',
    daily: 'Günün Meydan Okuması', lvD: 'Günün Meydan Okuması', dD: 'Bugünün vardiyası herkes için aynı: aynı trafik, aynı yolcular, aynı hava. Bitir, seriyi sürdür.',
    dailyLine: 'Günlük seri: {0} gün · en iyi: {1}', dailyDone: 'Bugünkü vardiya tamam', a11y: 'Erişilebilirlik', a11yOpen: 'Aç',
    share: 'Paylaş', another: 'Başka oyun', shareStars: '{0}/3 yıldız · net {1} TL', awFirst: 'İlk vardiya', awCampaign: '8 seviyenin hepsi', awAllStars: '24 yıldızın hepsi',
    moodLike: ['Aç şu sesi kaptan!', 'Bu şarkı benim!'], moodDislike: ['Kıs şunu biraz...', 'Başka kanal yok mu?'],
  },
  en: {
    subtitle: 'Drive a dolmuş through Istanbul streets: pick up, drop off, earn.',
    howtoTouch: 'Steer with the slider. On the right, slide the pedal up for gas and down to brake. At a yellow ring tap the door button to stop and load passengers. Never run a red light!',
    howto: 'Steer with the D-pad. Press A at a yellow ring to stop and open the door. Sound the horn with X. Passengers are impatient, never run a red light!',
    loading: 'Loading… {0}/{1}', play: 'Play', continue: 'Continue', newGame: 'New game', newGameSure: 'Erase save? Tap again', bubMood: '{0} {1}, please.', endless: 'Endless mode', settings: 'Settings',
    language: 'Language', paused: 'Paused', resume: 'Resume', restart: 'Restart', menu: 'Main menu',
    startShift: 'Start shift', master: 'Master volume', music: 'Music', effects: 'Effects', quality: 'Quality',
    low: 'Low', high: 'High', mapMode: 'Minimap', mapHead: 'Heading up', mapNorth: 'North up', fullscreen: 'Fullscreen', toggle: 'Toggle', back: 'Back',
    keysHelp: 'START pause · A door · B brake · X horn · Y map',
    keysHelpTouch: 'Top bar: pause, sound, language · DOOR button stop / door · HORN button horn',
    pGas: 'GAS', pBrake: 'BRAKE', pDoor: 'DOOR', pHorn: 'HORN', aGas: 'Gas', aBrake: 'Brake', aDoor: 'Door', aHorn: 'Horn',
    aPedal: 'Gas / Brake', pedalMode: 'Pedal', pedSlider: 'Slider', pedSep: 'Separate',   // unified mobile pedal
    retry: 'Try again', next: 'Next level', nextShift: 'Next shift', playAgain: 'Play again',
    level: 'Level', shift: 'Shift', fares: 'Fares', seats: 'Seats', dents: 'Dents', pause: 'Pause', sound: 'Sound', tl: 'TL',
    bestLine: 'Best: {0} TL · {1}/24 stars · Endless: {2} TL', bestNone: 'No record yet.',
    news: "What's new", verTag: 'v2.1 · November 2026', others: 'More games', newsH: 'In this update',
    newsList: ["What's new window and a version tag (this screen).", 'Local leaderboard: your 5 best shifts are kept on this device.', 'Badges: flawless shift, three stars, wet-road master, daily shift and line veteran.', 'A "More games" link on the title screen; a proper page description, share card and 404 page.'],
    boardH: '5 best shifts', boardNone: 'No shifts recorded yet. Finish a shift with a star and it shows up here.', badgesH: 'Badges', badgeNew: 'New badge: {0}',
    bgClean: 'Flawless shift', bgCleanD: 'Earn a star with no crashes, red lights or hard braking', bg3: 'Three stars', bg3D: 'Finish a shift with 3 stars',
    bgRain: 'Wet-road master', bgRainD: 'Finish a rainy level (3, 5 or 8) without a crash', bgDaily: 'Shift of the day', bgDailyD: 'Finish the daily challenge',
    bg10: 'Line veteran', bg10D: 'Finish 10 shifts ({0}/10)', bgOn: 'Earned',
    lv1: 'Main street run', lv2: 'Bridge and tram', lv3: 'Here comes the rain', lv4: 'Narrow streets', lv5: 'Gridlock',
    lv6: 'The ferry pier', lv7: 'Evening rush', lv8: 'Night shift', lvE: 'Endless shift {0}',
    d1: 'Main street full of morning commuters. Warm up, pick people up and drop them at the right stop.',
    d2: 'New roads: the bridge and the seaside. A tram runs down the middle of the street, watch the tracks.',
    d3: 'Rain is coming: slippery roads and crowded stops. A delivery van blocks a lane.',
    d4: 'Narrow streets with cars parked on the pavement. An important passenger (VIP) is looking for you.',
    d5: 'The main street can lock up. Be patient, and hope the passengers are too.',
    d6: 'Seaside road and the ferry pier: stops fill up when the ferry arrives.',
    d7: 'Evening falls. Rain, traffic and a VIP all at once.',
    d8: 'Night shift. Lights on, wet roads, tough job.',
    dE: 'The shift that never ends: every round is a little harder. Drive until the dolmuş falls apart or you miss the target.',
    f_traffic: 'Lights, zebra crossings and traffic', f_tram: 'Tram line', f_bridge: 'Bridge and seaside road', f_rain: 'Rain: slippery road, crowded stops',
    f_van: 'Double-parked delivery van', f_side: 'Narrow streets, pavement parking', f_vip: 'VIP passenger', f_jam: 'Traffic jam event', f_night: 'Night driving',
    f_pier: 'Ferry pier stop', f_stops: '{0} stops', f_bus: 'Buses wait at their stops',
    tgt: 'Target', star1: '1 star', star2: '2 stars', star3: '3 stars',
    toastAutoLow: 'Quality set to Low for smoother play (change it in Settings).', toastStart: 'Shift started! Head for the yellow rings.', toastNoBiz: 'Nobody to serve here.', toastFull: 'The dolmuş is full!',
    penRed: 'Red light! -{0} TL', penHit: 'Collision! -{0} TL', penBrake: 'Hard braking for no reason, complaints -{0} TL', penSkip: 'You skipped a waving passenger -{0} TL',
    penLeft: 'A passenger gave up -{0} TL', penPed: 'You hit a pedestrian! -{0} TL', missed: 'You missed the stop!', vipAboard: 'VIP aboard! Drive fast.',
    vipSpawn: 'VIP waiting at {0}', jamOn: 'Traffic jam on the main street!', jamOff: 'Traffic is moving again.', rainOn: 'Rain started: slippery road.', rainOff: 'The rain eased.',
    vanOn: 'A delivery van blocks the lane.', tramBell: 'Tram coming!', wrecked: 'The dolmuş is wrecked!',
    fareAdd: '+{0}', tipAdd: '+{0} TL tip',
    endClear: 'Shift complete', endFail: 'Target missed', endWreck: 'Dolmuş wrecked', endWin: 'Congratulations, driver!', endEndless: 'Endless mode over',
    subClear: 'Great driving!', subFail: 'Not even one star: try again.', subWreck: 'Dent meter hit 100%.', subWin: 'You finished all 8 shifts. The city is yours.', subEndless: 'Total fares: {0} TL',
    sFares: 'Fares', sTips: 'Tips', sPen: 'Penalties', sNet: 'Net fares', sPass: 'Passengers carried', sDent: 'Damage', sTotal: 'Total', sWave: 'Shift',
    newRecord: 'New record!', hintStop: 'Stop / door', hintSpace: '<b>A</b> stop + door · <b>X</b> horn', hintDoor: 'Door open…',
    guideTo: '{0}', guideDrop: 'Drop off', guidePick: 'Pick up', guideCruise: 'Next stop', guideM: '{0} m',
    bubVip: 'I am in a hurry! {0}, now!',
    voice: {
      student: ['I have class, {0} please!', 'Exam today! {0}, driver!', '{0}, student here, thanks!', 'Drop me at {0}, I’m late for lectures.'],
      grandmother: ['Dear, could you take me to {0}?', 'Slowly please, son, {0}.', 'Bless you, {0} please.', 'Off to see the grandkids, {0}…'],
      shopkeeper: ['Got to open the shop, {0}!', '{0}, easy does it, boss!', 'Deliveries waiting, {0} please.', 'Tea is on me, drop me at {0}!'],
      tourist: ['Is this going to {0}? Lovely!', 'Excuse me, {0}, yes?', 'Beautiful city! {0}, please.', 'Taking photos! {0}, thanks.'],
      commuter: ['In a rush, {0}!', '{0}, I have a meeting at nine!', 'Quick but safe, {0}.', 'Let’s be quick, {0}, driver!'],
      any: ['Anywhere safe near {0}, please!', 'Pull over anywhere good by {0}!', 'Somewhere handy near {0} is fine!', 'Drop me wherever it’s safe near {0}!', 'Anywhere free around {0}, driver!', 'Whenever there’s room, near {0}!'],
    },
    close: 'Close', go: 'Go!',
    coach: 'First stop is right here: stop near the ring, press A to open the door',
    coachTouch: 'First stop is right here: stop near the ring, tap the DOOR button',
    f_any: 'Anywhere riders: door ring ✓ green = safe curb, ! amber = too close to a crossing/junction',
    penBadStop: 'Unsafe drop-off -{0} TL', easyStop: '+{0} TL easy stop',
    penBadStop_zebra: 'Too close to the crossing ({1} m, need 9 m) -{0} TL', penBadStop_junction: 'Too close to the junction ({1} m, need 10 m) -{0} TL',
    brakeOk_ped: 'Emergency stop: pedestrian. No penalty.', brakeOk_car: 'Emergency stop: vehicle ahead. No penalty.', brakeOk_light: 'Braking for the light. No penalty.',
    tipLost: 'You left before the fare chain ended: -{0} TL tip',
    anyNo_zebra: 'No drop-offs on a crossing!', anyNo_junction: 'Not in the junction! Traffic honks.', anyNo_signal: 'Do not stop in the signal queue! Traffic honks.',
    anyNo_lane: 'You are blocking the lane, pull to the curb.', anyNo_bridge: 'No stopping on the bridge.', anyNo_curb: 'No curb here.',
    tip_brakes: 'Hard braking with passengers aboard cost you {0} TL: ease off earlier.',
    tip_reds: 'Running red lights cost you {0} TL: slow down on amber and stop on red.',
    tip_skips: 'Passing waving passengers cost you {0} TL: slow down as you near a stop.',
    tip_hits: 'Collisions cost you {0} TL: keep your distance from traffic ahead.',
    tip_ped: 'Hitting pedestrians cost you {0} TL: slow down at crossings.',
    tip_gaveUp: 'Passengers who gave up waiting cost you {0} TL: do not keep people waiting.',
    tip_badStop: 'Dropping riders near a crossing or junction cost you {0} TL: pick a safe curb.',
    tip_tipsLost: 'Pulling away before the fare chain finished lost {0} TL in tips: wait for the last coin.',
    tipClean: 'Clean shift: no penalties and no lost tips.', bestTipLine: 'Best tip: {0} TL', anyDropsLine: 'Anywhere drops: {0}', thx: ['Thanks, driver!', 'Well done!', 'God bless you!', 'Take care!'], angry: ['Waited too long!', 'So slow!', 'Let me out!'],
    keyHelp: '↑ gas · ↓ brake · ←/→ steer · A door · X horn',
    pausedAuto: 'Tab hidden, game paused.', autoOn: 'Autopilot on',
    hatTitle: 'Route Master', hatSub: 'Set up your line before the shift: pick 3 stops and tune the radio.',
    hatStops: 'Route stops ({0}/3)', hatStopsHelp: 'Riders gather faster at your route stops and slower at the others. Pick none for a classic shift.',
    hatRadio: 'Radio / cassette', hatGo: 'Start the engine', hatNeed3: 'Pick 3 stops or none',
    ch_off: 'Off', ch_arabesk: 'Arabesk', ch_pop: 'Pop', ch_haber: 'News', ch_turku: 'Türkü (folk)',
    chd_off: 'Radio off: the usual passenger mix.',
    chd_arabesk: 'Shopkeepers ride: patient, generous tippers. Tourists get bored.',
    chd_pop: 'Students and tourists: more riders, student discount and small tips, short patience. Grannies get bored.',
    chd_haber: 'Commuters: more riders, pay a bit more, impatient. Students get bored.',
    chd_turku: 'Grannies ride: very patient but small tips, a few fewer riders. Commuters get bored.',
    hatToast: 'Route: {0} · Radio: {1}', hatClassic: 'classic',
    hatLine: 'Route: {0} · Radio: {1}', hatProfit: 'Route profit: {0} TL = fares {1} + tips {2} − fuel {3} − idling {4}',
    hatBest: 'Best route on this level: {0} TL ({1} · {2})', hatNewBest: 'New route record: {0} TL!',
    daily: 'Daily challenge', lvD: 'Daily challenge', dD: "Today's shift is the same for everyone: same traffic, same riders, same weather. Finish it to keep your streak.",
    dailyLine: 'Daily streak: {0} · best: {1}', dailyDone: "Today's shift is done", a11y: 'Accessibility', a11yOpen: 'Open',
    share: 'Share', another: 'Another game', shareStars: '{0}/3 stars · net {1} TL', awFirst: 'First shift', awCampaign: 'All 8 levels', awAllStars: 'All 24 stars',
    moodLike: ['Turn it up, driver!', 'That is my song!'], moodDislike: ['Turn that down a bit...', 'Any other station?'],
  },
};
let LANG = 'tr';
function t(k, ...a) {
  let s = (STR[LANG] && STR[LANG][k]);
  if (s === undefined) s = STR.en[k];
  if (s === undefined) return k;
  if (Array.isArray(s)) return s;
  return s.replace(/\{(\d)\}/g, (_, i) => (a[+i] === undefined ? '' : a[+i]));
}
const stopName = key => (STOPS[key] ? STOPS[key][LANG === 'tr' ? 0 : 1] : key);
const fmt = n => Math.round(Number.isFinite(Number(n)) ? Number(n) : 0).toLocaleString(LANG === 'tr' ? 'tr-TR' : 'en-US');

// ---------------------------------------------------------------- settings / save (all in try/catch)
const KEY_SET = 'arena.dolmus.settings', KEY_SAVE = 'arena.dolmus.save';
const isPhone = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || (matchMedia && matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 800);
const settings = { master: 0.8, music: 0.6, sfx: 0.8, lang: String(navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en', quality: isPhone ? 'low' : 'high', qualityManual: false, mapRot: true, mobileUnifiedPedal: true };   // mobileUnifiedPedal: touch gas/brake as one vertical slider (false = the two separate pedals)
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
(function loadSettings() {
  const s = lsGet(KEY_SET);
  if (s && typeof s === 'object') for (const k of Object.keys(settings)) if (s[k] !== undefined) settings[k] = s[k];
  LANG = (Q.get('lang') === 'en' || Q.get('lang') === 'tr') ? Q.get('lang') : settings.lang;   // URL override is not saved
})();
const saveSettings = () => lsSet(KEY_SET, settings);
// arena.dolmus.save = { best: {...}, run: {level,total,stars} | null }
const LEVEL_COUNT = 8;
const _rawSaved = lsGet(KEY_SAVE);
const SAVED = (_rawSaved && typeof _rawSaved === 'object' && !Array.isArray(_rawSaved)) ? _rawSaved : {};
const _rawBest = (SAVED.best && typeof SAVED.best === 'object' && !Array.isArray(SAVED.best)) ? SAVED.best : {};
// Validate and pad level arrays to LEVEL_COUNT finite numbers (replace non-finite with 0)
const sanitizeLevelArr = arr => {
  const src = Array.isArray(arr) ? arr : [];
  const out = [];
  for (let i = 0; i < LEVEL_COUNT; i++) {
    const v = src[i];
    const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
    out.push(Number.isFinite(n) ? n : 0);
  }
  return out;
};
const best = Object.assign({ total: 0, stars: sanitizeLevelArr(null), endless: 0, fares: sanitizeLevelArr(null) }, _rawBest, {
  total: Number.isFinite(Number(_rawBest.total)) ? Number(_rawBest.total) : 0,
  endless: Number.isFinite(Number(_rawBest.endless)) ? Number(_rawBest.endless) : 0,
  stars: sanitizeLevelArr(_rawBest.stars),
  fares: sanitizeLevelArr(_rawBest.fares),
});
// Treat runSave as null if not an object with expected fields (level, total, stars)
const validateRunSave = r => {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  if (!('level' in r && 'total' in r && 'stars' in r)) return null;
  const level = Number(r.level), total = Number(r.total);
  if (!Number.isFinite(level) || !Number.isFinite(total) || !Array.isArray(r.stars)) return null;
  return Object.assign({}, r, {
    level: Math.round(level),
    total,
    stars: r.stars.map(s => { const n = Number(s); return Number.isFinite(n) ? n : 0; }),
  });
};
let runSave = validateRunSave(SAVED.run);
const writeSave = () => lsSet(KEY_SAVE, { best, run: runSave });
const saveBest = writeSave;

// ---------------------------------------------------------------- audio (everything synthesised with Web Audio)
settings.musicOn = settings.musicOn !== false; settings.sfxOn = settings.sfxOn !== false; settings.mute = !!settings.mute;
const AUD = (() => {
  let ctx = null, master, musicBus, sfxBus, noiseBuf, comp;
  let eng = null, rain = null, amb = null, hornNodes = null, skid = null, timer = 0, nextT = 0, step = 0;
  const SC = [0, 1, 4, 5, 7, 8, 10];
  const degSemi = d => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return SC[i] + 12 * o; };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const MEL = [4, -1, 3, 2, 1, 2, 3, 4, 5, -1, 4, 3, 2, -1, 1, -1, 2, 3, 4, -1, 5, 4, 3, 2, 1, -1, 0, -1, -1, -1, -1, -1,
    7, -1, 6, 5, 4, 5, 6, 7, 8, -1, 7, 6, 5, -1, 4, -1, 5, 4, 3, 2, 3, 4, 5, 6, 4, 3, 2, 1, 0, -1, -1, -1];
  const BASS = [0, 0, 1, 0, 3, 4, 1, 0];
  const CHORDS = [[0, 4, 7], [1, 5, 8], [5, 8, 12], [7, 11, 14]]; // semitones above D (D, Eb, Gm, A)
  const STEPDUR = 60 / 98 / 2;

  function applyGains() {
    if (!ctx) return;
    const m = settings.mute ? 0 : settings.master;
    master.gain.setTargetAtTime(m, ctx.currentTime, 0.03);
    musicBus.gain.setTargetAtTime(settings.musicOn ? settings.music * 0.55 : 0, ctx.currentTime, 0.05);
    sfxBus.gain.setTargetAtTime(settings.sfxOn ? settings.sfx : 0, ctx.currentTime, 0.05);
  }
  function init() {
    if (ctx || FLAG.noaudio) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;   // wait for a real gesture
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return; }
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
    master = ctx.createGain(); musicBus = ctx.createGain(); sfxBus = ctx.createGain();
    musicBus.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
    const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // engine
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; lp.frequency.value = 500; g.gain.value = 0;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(sfxBus); o1.start(); o2.start();
    eng = { o1, o2, lp, g };
    // rain
    const rs = ctx.createBufferSource(); rs.buffer = noiseBuf; rs.loop = true;
    const rf = ctx.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 4200; rf.Q.value = 0.6;
    const rg = ctx.createGain(); rg.gain.value = 0; rs.connect(rf); rf.connect(rg); rg.connect(sfxBus); rs.start();
    rain = { g: rg };
    // street ambience (low murmur)
    const as = ctx.createBufferSource(); as.buffer = noiseBuf; as.loop = true;
    const af = ctx.createBiquadFilter(); af.type = 'lowpass'; af.frequency.value = 380;
    const ag = ctx.createGain(); ag.gain.value = 0.05; as.connect(af); af.connect(ag); ag.connect(sfxBus); as.start();
    amb = { g: ag, f: af };
    // skid
    const ss = ctx.createBufferSource(); ss.buffer = noiseBuf; ss.loop = true;
    const sf = ctx.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1700; sf.Q.value = 4;
    const sg = ctx.createGain(); sg.gain.value = 0; ss.connect(sf); sf.connect(sg); sg.connect(sfxBus); ss.start();
    skid = { g: sg };
    applyGains(); decodeAll();
    nextT = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(sched, 90);
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  }
  function resume() { if (ctx && ctx.state === 'suspended' && !document.hidden) ctx.resume(); }

  function env(g, t0, a, d, peak, end = 0.0001) {
    g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(end, t0 + a + d);
  }
  function tone(bus, type, f0, f1, t0, dur, vol, lpf) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    let last = o;
    if (lpf) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lpf; o.connect(f); last = f; }
    last.connect(g); g.connect(bus); env(g, t0, 0.008, dur, vol); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(bus, t0, dur, vol, freq, q, type = 'bandpass') {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q; s.connect(f); f.connect(g); g.connect(bus);
    env(g, t0, 0.004, dur, vol); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  function sched() {
    if (!ctx || ctx.state !== 'running') return;
    while (nextT < ctx.currentTime + 0.25) { playStep(step % 64, nextT); step++; nextT += STEPDUR; }
  }
  function playStep(i, t0) {
    const bar = i >> 3, st = i & 7;
    // darbuka (maqsum): dum tek . tek dum . tek .
    const pat = ['D', 'T', '', 'T', 'D', '', 'T', ''];
    const p = bar % 4 === 3 && st === 7 ? 'T' : pat[st];
    if (p === 'D') { tone(musicBus, 'sine', 150, 55, t0, 0.18, 0.55); }
    else if (p === 'T') { noise(musicBus, t0, 0.07, 0.22, 3400, 1.2); }
    if (st === 5 && (bar & 1)) noise(musicBus, t0, 0.05, 0.1, 5200, 1);
    // bass
    if (st === 0 || st === 2 || st === 4 || st === 6) {
      const root = 38 + degSemi(BASS[bar]) - (BASS[bar] > 6 ? 12 : 0);
      const m = st === 4 ? root + 7 : root;
      tone(musicBus, 'sawtooth', mtof(m), mtof(m), t0, STEPDUR * 1.7, 0.2, 380);
    }
    // pad
    if (i % 16 === 0) {
      const ch = CHORDS[(i >> 4) % 4];
      for (const s of ch) for (const dt of [-6, 6]) {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = mtof(50 + s); o.detune.value = dt; f.type = 'lowpass'; f.frequency.value = 900;
        o.connect(f); f.connect(g); g.connect(musicBus);
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.035, t0 + 0.5); g.gain.linearRampToValueAtTime(0.0001, t0 + STEPDUR * 15.5);
        o.start(t0); o.stop(t0 + STEPDUR * 16);
      }
    }
    // lead (saz-like pluck with vibrato)
    const d = MEL[i];
    if (d >= 0) {
      const m = 62 + degSemi(d), f = mtof(m);
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lf = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * 0.008; lfo.connect(lg); lg.connect(o.frequency);
      lf.type = 'lowpass'; lf.frequency.setValueAtTime(3200, t0); lf.frequency.exponentialRampToValueAtTime(700, t0 + 0.5);
      o.connect(lf); o2.connect(lf); lf.connect(g); g.connect(musicBus);
      env(g, t0, 0.01, STEPDUR * 1.9, 0.2);
      o.start(t0); o2.start(t0); lfo.start(t0); o.stop(t0 + STEPDUR * 2 + 0.1); o2.stop(t0 + STEPDUR * 2 + 0.1); lfo.stop(t0 + STEPDUR * 2 + 0.1);
    }
  }
  // ---- optional recorded one-shots (CC0). Fetched after the first frame, decoded once the audio context exists; the
  // synthesised versions below stay as the fallback when a file is missing or ?noassets is set.
  const raw = {}, buf = {}, SGAIN = { coin1: 0.9, coin2: 2.4, door_open: 0.8, door_close: 0.8, crash1: 0.9, crash2: 0.9, thud1: 0.8, thud2: 0.8, click1: 0.5, click2: 0.5 };
  function decodeAll() {
    if (!ctx) return;
    for (const k of Object.keys(raw)) {
      if (buf[k] || raw[k] === 'busy') continue;
      const ab = raw[k]; raw[k] = 'busy';
      ctx.decodeAudioData(ab.slice ? ab.slice(0) : ab).then(b => { buf[k] = b; ASSETS.snd = Object.keys(buf).length; }).catch(() => { delete raw[k]; });
    }
  }
  function smp(names, vol = 1) {
    if (!ctx) return false;
    const n = names[(Math.random() * names.length) | 0], b = buf[n];
    if (!b) return false;
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = 0.96 + Math.random() * 0.08;
    g.gain.value = vol * (SGAIN[n] || 1); s.connect(g); g.connect(sfxBus); s.start();
    return true;
  }
  const api = {
    init, resume, applyGains,
    loadSamples(files) {   // files: { name: arrayBuffer }
      Object.assign(raw, files); decodeAll();
    },
    get ready() { return !!ctx; },
    get state() { return ctx ? ctx.state + ' t=' + ctx.currentTime.toFixed(2) + ' steps=' + step : 'none'; },
    update(sp, thr, load, rainA, wet, active, skidA) {
      if (!ctx) return;
      const tt = ctx.currentTime;
      const rpmN = 0.2 + 0.5 * ((sp % 6) / 6) + 0.22 * thr + 0.05 * Math.min(1, sp / 18);
      const f = 36 + rpmN * 90 * (1 - 0.12 * load);
      eng.o1.frequency.setTargetAtTime(f, tt, 0.05); eng.o2.frequency.setTargetAtTime(f * 0.5, tt, 0.05);
      eng.lp.frequency.setTargetAtTime(260 + rpmN * 900 + thr * 400, tt, 0.06);
      eng.g.gain.setTargetAtTime(active ? 0.05 + 0.08 * thr + 0.02 * Math.min(1, sp / 15) : 0, tt, 0.08);
      rain.g.gain.setTargetAtTime(rainA * 0.16, tt, 0.4);
      amb.g.gain.setTargetAtTime(active ? 0.04 + 0.03 * Math.min(1, sp / 15) : 0.02, tt, 0.3);
      skid.g.gain.setTargetAtTime(active ? skidA * 0.09 : 0, tt, 0.05);
    },
    hornStart() {
      if (!ctx || hornNodes) return;
      const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      const a = ctx.createOscillator(), b = ctx.createOscillator(); a.type = b.type = 'sawtooth'; a.frequency.value = 392; b.frequency.value = 494;
      a.connect(lp); b.connect(lp); lp.connect(g); g.connect(sfxBus);
      g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.03);
      a.start(); b.start(); hornNodes = { a, b, g };
    },
    hornStop() {
      if (!ctx || !hornNodes) return; const h = hornNodes; hornNodes = null; const tt = ctx.currentTime;
      h.g.gain.cancelScheduledValues(tt); h.g.gain.setValueAtTime(h.g.gain.value, tt); h.g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.08);
      h.a.stop(tt + 0.1); h.b.stop(tt + 0.1);
    },
    honk(f = 330, dur = 0.25, vol = 0.07) { // distant traffic honk
      if (!ctx) return; const t0 = ctx.currentTime; tone(sfxBus, 'sawtooth', f, f, t0, dur, vol, 1200); tone(sfxBus, 'sawtooth', f * 1.26, f * 1.26, t0, dur, vol * 0.8, 1200);
    },
    door(kind) { if (!ctx) return; if (smp([kind === 'close' ? 'door_close' : 'door_open'])) return; const t0 = ctx.currentTime; noise(sfxBus, t0, 0.28, 0.35, 900, 0.8); tone(sfxBus, 'sine', 260, 110, t0 + 0.02, 0.2, 0.14); },
    coin() { if (!ctx) return; if (smp(['coin1', 'coin2'])) return; const t0 = ctx.currentTime; tone(sfxBus, 'square', 988, 988, t0, 0.09, 0.08, 4000); tone(sfxBus, 'square', 1319, 1319, t0 + 0.08, 0.2, 0.08, 4000); },
    bell() { if (!ctx) return; const t0 = ctx.currentTime; for (let k = 0; k < 4; k++) { tone(sfxBus, 'sine', 1760, 1740, t0 + k * 0.17, 0.5, 0.1); tone(sfxBus, 'sine', 2640, 2600, t0 + k * 0.17, 0.3, 0.04); } },
    thud(v = 1) { if (!ctx) return; const t0 = ctx.currentTime; if (smp(['thud1', 'thud2'], v)) { tone(sfxBus, 'sine', 120, 45, t0, 0.25, 0.3 * v); return; } tone(sfxBus, 'sine', 140, 40, t0, 0.3, 0.5 * v); noise(sfxBus, t0, 0.2, 0.4 * v, 700, 0.5); },
    crash(v = 1) { if (!ctx) return; const t0 = ctx.currentTime; if (smp(['crash1', 'crash2'], v)) { tone(sfxBus, 'sine', 110, 35, t0, 0.45, 0.4 * v); noise(sfxBus, t0 + 0.05, 0.3, 0.12 * v, 1800, 0.4); return; } tone(sfxBus, 'sine', 120, 35, t0, 0.4, 0.55 * v); noise(sfxBus, t0, 0.45, 0.5 * v, 1800, 0.4); noise(sfxBus, t0 + 0.05, 0.3, 0.3 * v, 5000, 0.7); },
    pop() { if (!ctx) return; const t0 = ctx.currentTime; tone(sfxBus, 'sine', 500, 900, t0, 0.09, 0.14); },
    good() { if (!ctx) return; const t0 = ctx.currentTime; tone(sfxBus, 'triangle', 660, 660, t0, 0.1, 0.12); tone(sfxBus, 'triangle', 880, 880, t0 + 0.09, 0.16, 0.12); },
    bad() { if (!ctx) return; const t0 = ctx.currentTime; tone(sfxBus, 'square', 300, 300, t0, 0.12, 0.08, 1400); tone(sfxBus, 'square', 210, 210, t0 + 0.1, 0.2, 0.08, 1400); },
    click() { if (!ctx) return; if (smp(['click1', 'click2'])) return; tone(sfxBus, 'triangle', 700, 500, ctx.currentTime, 0.06, 0.09); },
    ferry() { if (!ctx) return; const t0 = ctx.currentTime; tone(sfxBus, 'sawtooth', 98, 92, t0, 1.4, 0.12, 400); tone(sfxBus, 'sawtooth', 123, 117, t0, 1.4, 0.08, 400); },
    star() { if (!ctx) return; const t0 = ctx.currentTime; [523, 659, 784, 1047].forEach((f, k) => tone(sfxBus, 'triangle', f, f, t0 + k * 0.1, 0.3, 0.12)); },
  };
  return api;
})();

// ---------------------------------------------------------------- geometry builder (merged, vertex coloured, flat shaded)
const colCache = new Map();
function cc(hex) {
  let v = colCache.get(hex);
  if (!v) { const c = new THREE.Color(hex); v = [c.r, c.g, c.b]; colCache.set(hex, v); }
  return v;
}
class Mesher {
  constructor(uv = false, jit = 0.07) { this.p = []; this.c = []; this.uv = uv ? [] : null; this.jit = jit; }
  tri(a, b, c, col, rnd = WR) {
    const k = cc(col), j = 1 + (rnd() - 0.5) * this.jit;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) this.c.push(k[0] * j, k[1] * j, k[2] * j);
    if (this.uv) this.uv.push(0, 0, 0, 0, 0, 0);
  }
  quad(a, b, c, d, col, uv) {
    const k = cc(col), j = 1 + (WR() - 0.5) * this.jit;
    this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    for (let i = 0; i < 6; i++) this.c.push(k[0] * j, k[1] * j, k[2] * j);
    if (this.uv) {
      if (uv) this.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[1], uv[2], uv[3], uv[0], uv[3]);
      else this.uv.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  }
  /** box centred at (cx,cy,cz); optional pitch rx and yaw ry */
  box(cx, cy, cz, sx, sy, sz, col, ry = 0, rx = 0, skipBottom = true) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, cr = Math.cos(ry), sr = Math.sin(ry), cp = Math.cos(rx), sp = Math.sin(rx);
    const T = (x, y, z) => { const y1 = y * cp - z * sp, z1 = y * sp + z * cp; return [cx + x * cr + z1 * sr, cy + y1, cz - x * sr + z1 * cr]; };
    const P = [];
    for (const x of [-hx, hx]) for (const y of [-hy, hy]) for (const z of [-hz, hz]) P.push(T(x, y, z));
    // index = (x?4:0)+(y?2:0)+(z?1:0)
    const v = (x, y, z) => P[x * 4 + y * 2 + z];
    this.quad(v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1), col);
    this.quad(v(0, 0, 1), v(0, 1, 1), v(0, 1, 0), v(0, 0, 0), col);
    this.quad(v(0, 1, 0), v(0, 1, 1), v(1, 1, 1), v(1, 1, 0), col);
    if (!skipBottom) this.quad(v(0, 0, 1), v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), col);
    this.quad(v(1, 0, 1), v(1, 1, 1), v(0, 1, 1), v(0, 0, 1), col);
    this.quad(v(0, 0, 0), v(0, 1, 0), v(1, 1, 0), v(1, 0, 0), col);
  }
  boxB(cx, y0, cz, sx, sy, sz, col, ry = 0, rx = 0, skipBottom = true) { this.box(cx, y0 + sy / 2, cz, sx, sy, sz, col, ry, rx, skipBottom); }
  /** vertical cylinder / cone from y0 up by h */
  cyl(cx, y0, cz, rb, rt, h, n, col, capTop = true, sy = 1, ry = 0, capBot = false) {
    const a = i => (i / n) * TAU + ry;
    const pb = i => [cx + Math.cos(a(i)) * rb, y0, cz + Math.sin(a(i)) * rb];
    const pt = i => [cx + Math.cos(a(i)) * rt, y0 + h, cz + Math.sin(a(i)) * rt];
    for (let i = 0; i < n; i++) {
      const b0 = pb(i), b1 = pb(i + 1), t0 = pt(i), t1 = pt(i + 1);
      if (rt < 0.001) this.tri(b1, b0, t0, col); else this.quad(b1, b0, t0, t1, col);
      if (capTop && rt >= 0.001) this.tri([cx, y0 + h, cz], t1, t0, col);
      if (capBot) this.tri([cx, y0, cz], b0, b1, col);
    }
  }
  /** ellipsoid / dome (phi range [p0,p1] in 0..PI) */
  sphere(cx, cy, cz, rx, ry, rz, nw, nh, col, p0 = 0, p1 = Math.PI) {
    const P = (i, j) => {
      const ph = p0 + (p1 - p0) * (j / nh), th = (i / nw) * TAU;
      return [cx + rx * Math.sin(ph) * Math.cos(th), cy + ry * Math.cos(ph), cz + rz * Math.sin(ph) * Math.sin(th)];
    };
    for (let j = 0; j < nh; j++) for (let i = 0; i < nw; i++) {
      const A = P(i, j), B = P(i + 1, j), C = P(i + 1, j + 1), D = P(i, j + 1);
      if (j === 0 && p0 === 0) this.tri(A, C, D, col); else if (j === nh - 1 && p1 === Math.PI) this.tri(A, B, C, col); else this.quad(A, B, C, D, col);
    }
  }
  /** gable roof, ridge along the longer side */
  gable(cx, cz, sx, sz, y, h, col, colG, over = 0.35) {
    const alongX = sx >= sz, hx = (alongX ? sx : sz) / 2 + over, hz = (alongX ? sz : sx) / 2 + over;
    const T = (x, yy, z) => (alongX ? [cx + x, yy, cz + z] : [cx + z, yy, cz - x]);
    const A = T(-hx, y, -hz), B = T(hx, y, -hz), C = T(hx, y, hz), D = T(-hx, y, hz), R1 = T(-hx + over, y + h, 0), R2 = T(hx - over, y + h, 0);
    this.quad(A, B, R2, R1, col); this.quad(D, C, R2, R1, col);
    this.tri(A, D, R1, colG); this.tri(C, B, R2, colG);
  }
  /** horizontal slab under a polyline-ish quad strip: (x0,z0)-(x1,z1) lateral width w, flat top at y */
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (this.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

// ---------------------------------------------------------------- terrain functions
const edgeMask = (x, z) => sstep(185, 160, Math.abs(x)) * sstep(-130, -105, z);
function hillH(x, z) {
  const m = sstep(54, 26, z) * edgeMask(x, z);
  return m * (3.9 + 2.4 * Math.sin(0.03 * x + 0.5) + 1.2 * Math.sin(0.05 * z + x * 0.01) + 0.03 * Math.max(0, -z));
}
const BRIDGE_X = [0, 100];
function bridgeY(x, z) {
  if (z < 51 || z > 79) return 0;
  const ax = Math.min(Math.abs(x - BRIDGE_X[0]), Math.abs(x - BRIDGE_X[1]));
  if (ax > 8) return 0;
  return 1.4 * Math.sin(Math.PI * (z - 51) / 28) * sstep(8, 6.5, ax);
}
const yAt = (x, z) => hillH(x, z) + bridgeY(x, z);
const canalDip = z => 2.6 * clamp((8.8 - Math.abs(z - 65)) / 2.2, 0, 1);
const seaDip = z => 2.6 * clamp((z - 131) / 3.5, 0, 1);
const groundH = (x, z) => hillH(x, z) - canalDip(z) - seaDip(z);
const SEA_Y = -0.4;

// ---------------------------------------------------------------- road network
const ROADS = [
  { id: 'main', a: [-150, 0], b: [150, 0], w: 18, lane: 5, vmax: 14, name: 'main' },
  { id: 'north', a: [-100, -90], b: [100, -90], w: 10, lane: 2.5, vmax: 11 },
  { id: 'v0', a: [0, -90], b: [0, 120], w: 12, lane: 3, vmax: 12 },
  { id: 'v1', a: [-100, -90], b: [-100, 50], w: 8, lane: 2, vmax: 8, narrow: true },
  { id: 'v2', a: [100, -90], b: [100, 120], w: 10, lane: 2.5, vmax: 11 },
  { id: 'sea', a: [-60, 120], b: [150, 120], w: 12, lane: 3, vmax: 11 },
  { id: 'sideW', a: [-100, -45], b: [-35, -45], w: 8, lane: 2, vmax: 8, narrow: true },
  { id: 'sideE', a: [35, -45], b: [100, -45], w: 8, lane: 2, vmax: 8, narrow: true },
  { id: 'plazaX', a: [-35, -45], b: [35, -45], w: 8, lane: 2, vmax: 7, virtual: true },
];
for (const r of ROADS) { r.h = r.w / 2; r.horiz = r.a[1] === r.b[1]; r.len = hyp(r.b[0] - r.a[0], r.b[1] - r.a[1]); }
const PAVE = 3.5;
const NODES = {
  A: [-100, -90], B: [0, -90], C: [100, -90], D: [-100, 0], E: [0, 0], F: [100, 0], I: [0, 120], K: [100, 120],
  P: [-100, -45], Pp: [-35, -45], Qp: [35, -45], Q: [100, -45],
};
function roadFor(p, q) {
  for (const r of ROADS) {
    if (r.horiz && p[1] === r.a[1] && q[1] === r.a[1]) {
      const lo = Math.min(r.a[0], r.b[0]), hi = Math.max(r.a[0], r.b[0]);
      if (p[0] >= lo - 0.01 && p[0] <= hi + 0.01 && q[0] >= lo - 0.01 && q[0] <= hi + 0.01) return r;
    } else if (!r.horiz && p[0] === r.a[0] && q[0] === r.a[0]) {
      const lo = Math.min(r.a[1], r.b[1]), hi = Math.max(r.a[1], r.b[1]);
      if (p[1] >= lo - 0.01 && p[1] <= hi + 0.01 && q[1] >= lo - 0.01 && q[1] <= hi + 0.01) return r;
    }
  }
  return null;
}
/** is world point (x,z) on the asphalt of some real road (returns the road) */
function roadAt(x, z, pad = 0) {
  for (const r of ROADS) {
    if (r.virtual) continue;
    if (r.horiz) { if (Math.abs(z - r.a[1]) <= r.h + pad && x >= Math.min(r.a[0], r.b[0]) - r.h * 0 && x <= Math.max(r.a[0], r.b[0])) return r; }
    else if (Math.abs(x - r.a[0]) <= r.h + pad && z >= Math.min(r.a[1], r.b[1]) && z <= Math.max(r.a[1], r.b[1])) return r;
  }
  return null;
}
// crossings between real roads
const CROSS = []; // {x,z,a:road,b:road}
(function () {
  for (let i = 0; i < ROADS.length; i++) for (let j = i + 1; j < ROADS.length; j++) {
    const a = ROADS[i], b = ROADS[j];
    if (a.virtual || b.virtual || a.horiz === b.horiz) continue;
    const H = a.horiz ? a : b, V = a.horiz ? b : a;
    const x = V.a[0], z = H.a[1];
    const inH = x >= Math.min(H.a[0], H.b[0]) - 0.01 && x <= Math.max(H.a[0], H.b[0]) + 0.01;
    const inV = z >= Math.min(V.a[1], V.b[1]) - 0.01 && z <= Math.max(V.a[1], V.b[1]) + 0.01;
    if (inH && inV) CROSS.push({ x, z, H, V });
  }
})();

// ---------------------------------------------------------------- static obstacles (spatial hash)
const OB_CELL = 16;
const obGrid = new Map();
const obAll = [];
function obAdd(o) {
  obAll.push(o);
  const x0 = Math.floor((o.type === 'c' ? o.x - o.r : o.x0) / OB_CELL), x1 = Math.floor((o.type === 'c' ? o.x + o.r : o.x1) / OB_CELL);
  const z0 = Math.floor((o.type === 'c' ? o.z - o.r : o.z0) / OB_CELL), z1 = Math.floor((o.type === 'c' ? o.z + o.r : o.z1) / OB_CELL);
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
    const k = i + ',' + j; let arr = obGrid.get(k); if (!arr) obGrid.set(k, arr = []); arr.push(o);
  }
}
const obBox = (x0, z0, x1, z1, hard = 1) => obAdd({ type: 'b', x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), hard });
const obCirc = (x, z, r, hard = 1) => obAdd({ type: 'c', x, z, r, hard });
/** circle-vs-static collision. returns array of {nx,nz,pen,hard} */
const _hits = [];
function staticHits(x, z, r) {
  staticHits._q++; _hits.length = 0;
  const i0 = Math.floor((x - r) / OB_CELL), i1 = Math.floor((x + r) / OB_CELL), j0 = Math.floor((z - r) / OB_CELL), j1 = Math.floor((z + r) / OB_CELL);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const arr = obGrid.get(i + ',' + j); if (!arr) continue;
    for (const o of arr) {
      if (o._q === staticHits._q) continue; o._q = staticHits._q;
      if (o.type === 'c') {
        const dx = x - o.x, dz = z - o.z, d = hyp(dx, dz), m = r + o.r;
        if (d < m) { const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0; _hits.push({ nx, nz, pen: m - d, hard: o.hard }); }
      } else {
        const px = clamp(x, o.x0, o.x1), pz = clamp(z, o.z0, o.z1);
        let dx = x - px, dz = z - pz, d = hyp(dx, dz);
        if (d < r) {
          if (d < 1e-4) { // centre inside the box: push out along the shortest axis
            const l = x - o.x0, rgt = o.x1 - x, tp = z - o.z0, bt = o.z1 - z, m = Math.min(l, rgt, tp, bt);
            if (m === l) { dx = -1; dz = 0; } else if (m === rgt) { dx = 1; dz = 0; } else if (m === tp) { dx = 0; dz = -1; } else { dx = 0; dz = 1; }
            _hits.push({ nx: dx, nz: dz, pen: r + m, hard: o.hard });
          } else _hits.push({ nx: dx / d, nz: dz / d, pen: r - d, hard: o.hard });
        }
      }
    }
  }
  return _hits;
}
staticHits._q = 0;

// ---------------------------------------------------------------- traffic signals and zebra crossings (data)
const SIGNALS = [
  { x: -100, z: 0, hx: 9, hz: 4, off: 0 },
  { x: 0, z: 0, hx: 9, hz: 6, off: 8 },
  { x: 100, z: 0, hx: 9, hz: 5, off: 16 },
];
const CYCLE = 32;
let sigClock = 0;
/** state of a signal for traffic moving along `axis` ('x' = east-west, 'z' = north-south): 'g','y','r' (plus 'a' = all red) */
function sigState(sig, axis) {
  const t = (sigClock + sig.off) % CYCLE;
  if (t < 14) return axis === 'x' ? 'g' : 'r';
  if (t < 17) return axis === 'x' ? 'y' : 'r';
  if (t < 18.5) return 'r';
  if (t < 27.5) return axis === 'z' ? 'g' : 'r';
  if (t < 30.5) return axis === 'z' ? 'y' : 'r';
  return 'r';
}
/** seconds until the given axis turns green (0 if green now) */
function sigTimeToGreen(sig, axis) {
  const t = (sigClock + sig.off) % CYCLE;
  const start = axis === 'x' ? 0 : 18.5;
  if (sigState(sig, axis) === 'g') return 0;
  return (start - t + CYCLE) % CYCLE;
}
const STOP_OFF = 4.5;      // stop line distance from the crossed road's edge
// approaches: stop lines the traffic must respect
const APPROACHES = [];
for (let i = 0; i < SIGNALS.length; i++) {
  const s = SIGNALS[i];
  APPROACHES.push({ sig: i, axis: 'x', dx: 1, dz: 0, lx: s.x - (s.hz + STOP_OFF), lz0: s.z, lz1: s.z + s.hx, ox: s.x - (s.hz + STOP_OFF), oz: s.z + s.hx + 0.9 });
  APPROACHES.push({ sig: i, axis: 'x', dx: -1, dz: 0, lx: s.x + (s.hz + STOP_OFF), lz0: s.z - s.hx, lz1: s.z, ox: s.x + (s.hz + STOP_OFF), oz: s.z - s.hx - 0.9 });
  APPROACHES.push({ sig: i, axis: 'z', dx: 0, dz: 1, lz: s.z - (s.hx + STOP_OFF), lx0: s.x - s.hz, lx1: s.x, ox: s.x - s.hz - 0.9, oz: s.z - (s.hx + STOP_OFF) });
  APPROACHES.push({ sig: i, axis: 'z', dx: 0, dz: -1, lz: s.z + (s.hx + STOP_OFF), lx0: s.x, lx1: s.x + s.hz, ox: s.x + s.hz + 0.9, oz: s.z + (s.hx + STOP_OFF) });
}
// zebra crossings: walking direction 'z' (across an east-west road) or 'x'
const ZEBRAS = [];
for (let i = 0; i < SIGNALS.length; i++) {
  const s = SIGNALS[i];
  ZEBRAS.push({ x: s.x - (s.hz + 2.4), z: s.z, dir: 'z', half: s.hx + 1.6, sig: i, block: 'x' });
  ZEBRAS.push({ x: s.x + (s.hz + 2.4), z: s.z, dir: 'z', half: s.hx + 1.6, sig: i, block: 'x' });
  ZEBRAS.push({ x: s.x, z: s.z - (s.hx + 2.4), dir: 'x', half: s.hz + 1.6, sig: i, block: 'z' });
  ZEBRAS.push({ x: s.x, z: s.z + (s.hx + 2.4), dir: 'x', half: s.hz + 1.6, sig: i, block: 'z' });
}
ZEBRAS.push({ x: 0, z: -30, dir: 'x', half: 7.6, sig: -1, block: 'z' });
ZEBRAS.push({ x: 75, z: 120, dir: 'z', half: 7.6, sig: -1, block: 'x' });

// ---------------------------------------------------------------- lane paths (closed loops, 1 m resampled)
const PATH_DS = 1;
function buildPath(names, name = '') {
  const n = names.length, P = names.map(k => NODES[k]);
  const segs = [];
  for (let i = 0; i < n; i++) {
    const p = P[i], q = P[(i + 1) % n], r = roadFor(p, q);
    if (!r) throw new Error('no road for ' + names[i] + '->' + names[(i + 1) % n]);
    const l = hyp(q[0] - p[0], q[1] - p[1]), fx = (q[0] - p[0]) / l, fz = (q[1] - p[1]) / l, rx = -fz, rz = fx;
    segs.push({ r, fx, fz, ax: p[0] + rx * r.lane, az: p[1] + rz * r.lane, bx: q[0] + rx * r.lane, bz: q[1] + rz * r.lane, len: l });
  }
  const dense = [];
  const add = (x, z) => { const l = dense[dense.length - 1]; if (!l || hyp(l[0] - x, l[1] - z) > 1e-4) dense.push([x, z]); };
  // vertex at junction between seg i-1 and i
  for (let i = 0; i < n; i++) {
    const s0 = segs[(i + n - 1) % n], s1 = segs[i];
    const cr = s0.fx * s1.fz - s0.fz * s1.fx, dt = s0.fx * s1.fx + s0.fz * s1.fz;
    if (Math.abs(cr) < 0.01) { // straight
      add(s0.bx, s0.bz); add(s1.ax, s1.az); continue;
    }
    // intersection of the two lane lines
    const den = s0.fx * s1.fz - s0.fz * s1.fx;
    const tt = ((s1.ax - s0.ax) * s1.fz - (s1.az - s0.az) * s1.fx) / den;
    const vx = s0.ax + s0.fx * tt, vz = s0.az + s0.fz * tt;
    let rad = cr > 0 ? 4.5 : 8;
    rad = Math.min(rad, s0.len * 0.45, s1.len * 0.45);
    const Ax = vx - s0.fx * rad, Az = vz - s0.fz * rad, Bx = vx + s1.fx * rad, Bz = vz + s1.fz * rad;
    for (let k = 0; k <= 10; k++) {
      const u = k / 10, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
      add(a * Ax + b * vx + c * Bx, a * Az + b * vz + c * Bz);
    }
  }
  // arclength resample (closed)
  const D = dense.length, cum = [0];
  for (let i = 1; i <= D; i++) { const a = dense[i - 1], b = dense[i % D]; cum.push(cum[i - 1] + hyp(b[0] - a[0], b[1] - a[1])); }
  const L = cum[D], N = Math.round(L / PATH_DS), ds = L / N;
  const X = new Float32Array(N), Z = new Float32Array(N);
  let j = 0;
  for (let i = 0; i < N; i++) {
    const s = i * ds;
    while (j < D - 1 && cum[j + 1] < s) j++;
    const a = dense[j], b = dense[(j + 1) % D], seg = cum[j + 1] - cum[j], f = seg > 0 ? (s - cum[j]) / seg : 0;
    X[i] = a[0] + (b[0] - a[0]) * f; Z[i] = a[1] + (b[1] - a[1]) * f;
  }
  const HX = new Float32Array(N), HZ = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const i2 = (i + 2) % N, i0 = (i + N - 1) % N, dx = X[i2] - X[i0], dz = Z[i2] - Z[i0], l = hyp(dx, dz) || 1;
    HX[i] = dx / l; HZ[i] = dz / l;
  }
  // speed limits: road limit + curvature, then braking-ramp smoothing
  const V = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let v = 99;
    for (const r of ROADS) {
      if (r.virtual) continue;
      const inX = r.horiz ? (X[i] >= Math.min(r.a[0], r.b[0]) - r.h && X[i] <= Math.max(r.a[0], r.b[0]) + r.h) && Math.abs(Z[i] - r.a[1]) <= r.h + 0.5
        : (Z[i] >= Math.min(r.a[1], r.b[1]) - r.h && Z[i] <= Math.max(r.a[1], r.b[1]) + r.h) && Math.abs(X[i] - r.a[0]) <= r.h + 0.5;
      if (inX) v = Math.min(v, r.vmax);
    }
    if (v > 90) v = 7;
    const ia = (i + N - 4) % N, ib = (i + 4) % N, th = Math.abs(wrapAng(Math.atan2(HX[ib], HZ[ib]) - Math.atan2(HX[ia], HZ[ia])));
    const k = th / (8 * ds);
    v = Math.min(v, Math.sqrt(3.2 / Math.max(k, 1e-3)));
    V[i] = Math.max(3.2, v);
  }
  for (let rep = 0; rep < 2; rep++) for (let i = N * 2 - 1; i >= 0; i--) {
    const a = i % N, b = (i + 1) % N;
    V[a] = Math.min(V[a], Math.sqrt(V[b] * V[b] + 2 * 3.2 * ds));
  }
  const path = { name, N, L, ds, X, Z, HX, HZ, V, lights: [], names, segs };
  // stop lines crossed by this path
  for (let ai = 0; ai < APPROACHES.length; ai++) {
    const ap = APPROACHES[ai];
    for (let i = 0; i < N; i++) {
      const i2 = (i + 1) % N;
      if (HX[i] * ap.dx + HZ[i] * ap.dz < 0.8) continue;
      if (ap.axis === 'x') {
        if (X[i] < ap.lx && X[i2] >= ap.lx && Z[i] >= ap.lz0 - 0.2 && Z[i] <= ap.lz1 + 0.2 && ap.dx > 0) path.lights.push({ s: (i + (ap.lx - X[i]) / (X[i2] - X[i] || 1)) * ds, ap });
        else if (X[i] > ap.lx && X[i2] <= ap.lx && Z[i] >= ap.lz0 - 0.2 && Z[i] <= ap.lz1 + 0.2 && ap.dx < 0) path.lights.push({ s: (i + (X[i] - ap.lx) / (X[i] - X[i2] || 1)) * ds, ap });
      } else {
        if (Z[i] < ap.lz && Z[i2] >= ap.lz && X[i] >= ap.lx0 - 0.2 && X[i] <= ap.lx1 + 0.2 && ap.dz > 0) path.lights.push({ s: (i + (ap.lz - Z[i]) / (Z[i2] - Z[i] || 1)) * ds, ap });
        else if (Z[i] > ap.lz && Z[i2] <= ap.lz && X[i] >= ap.lx0 - 0.2 && X[i] <= ap.lx1 + 0.2 && ap.dz < 0) path.lights.push({ s: (i + (Z[i] - ap.lz) / (Z[i] - Z[i2] || 1)) * ds, ap });
      }
    }
  }
  path.lights.sort((a, b) => a.s - b.s);
  return path;
}
const _pp = { x: 0, z: 0, hx: 0, hz: 1, i: 0 };
function pathAt(p, s, out = _pp) {
  let u = s / p.ds; u = ((u % p.N) + p.N) % p.N;
  const i = Math.floor(u), f = u - i, j = (i + 1) % p.N;
  out.x = p.X[i] + (p.X[j] - p.X[i]) * f; out.z = p.Z[i] + (p.Z[j] - p.Z[i]) * f;
  let hx = p.HX[i] + (p.HX[j] - p.HX[i]) * f, hz = p.HZ[i] + (p.HZ[j] - p.HZ[i]) * f; const l = hyp(hx, hz) || 1;
  out.hx = hx / l; out.hz = hz / l; out.i = i; return out;
}
const pathV = (p, s) => { let u = s / p.ds; u = ((u % p.N) + p.N) % p.N; return p.V[Math.floor(u)]; };
function projectOnPath(p, x, z, near = -1, win = 80) {
  let bi = 0, bd = 1e9;
  const test = i => { const d = (p.X[i] - x) ** 2 + (p.Z[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } };
  if (near < 0) for (let i = 0; i < p.N; i++) test(i);
  else { const c = Math.round(near / p.ds); for (let k = -win; k <= win; k++) test(((c + k) % p.N + p.N) % p.N); }
  return { s: bi * p.ds, d: Math.sqrt(bd) };
}

const PATHS = {};
const CIRCUIT_DEFS = {
  A: ['D', 'A', 'C', 'F'],
  B: ['D', 'A', 'B', 'C', 'F', 'K', 'I', 'E'],
  C: ['D', 'P', 'Pp', 'Qp', 'Q', 'F', 'K', 'I', 'E'],
  rB: ['E', 'I', 'K', 'F', 'C', 'B', 'A', 'D'],
  g: ['E', 'F', 'C', 'B'], rg: ['B', 'C', 'F', 'E'],
  h: ['P', 'Pp', 'Qp', 'Q', 'C', 'A'], rh: ['A', 'C', 'Q', 'Qp', 'Pp', 'P'],
};
for (const k of Object.keys(CIRCUIT_DEFS)) PATHS[k] = buildPath(CIRCUIT_DEFS[k], k);

// ---------------------------------------------------------------- routes, stops, levels
const ROUTE_STOPS = {
  A: [['balat', -100, -55], ['galata', -55, -90], ['meydan', 20, -90], ['besiktas', 100, -55], ['tram', 60, 0], ['carsi', -45, 0]],
  B: [['balat', -100, -55], ['galata', -55, -90], ['meydan', 20, -90], ['besiktas', 100, -55], ['kopru', 100, 95], ['iskele', 60, 120],
    ['kadikoy', 25, 120], ['karakoy', 0, 95], ['eminonu', 0, 30], ['tram', -50, 0]],
  C: [['balat', -100, -20], ['fener', -65, -45], ['meydan', -12, -45], ['galata', 65, -45], ['besiktas', 100, -20], ['iskele', 60, 120],
    ['karakoy', 0, 95], ['eminonu', 0, 30]],
};
const LEVELS = [
  { route: 'A', stops: null, h0: 7.0, h1: 9.5, tram: false, bus: 0, van: false, rain: [], vip: [], jam: null, cars: 8, peds: 12, pInt: 38, pat: 70, target: 210, feat: ['f_traffic', 'f_stops:6'] },
  { route: 'B', stops: ['balat', 'meydan', 'besiktas', 'iskele', 'karakoy', 'eminonu', 'tram'], h0: 8.5, h1: 11.5, tram: true, bus: 1, van: false, rain: [], vip: [], jam: null, cars: 11, peds: 14, pInt: 36, pat: 66, target: 200, feat: ['f_bridge', 'f_tram', 'f_bus', 'f_any', 'f_stops:7'] },
  { route: 'B', stops: ['balat', 'galata', 'meydan', 'besiktas', 'iskele', 'karakoy', 'eminonu', 'tram'], h0: 11, h1: 14.5, tram: true, bus: 1, van: true, rain: [[60, 130], [165, 215]], vip: [], jam: null, cars: 12, peds: 15, pInt: 34, pat: 62, target: 200, feat: ['f_rain', 'f_van', 'f_stops:8'] },
  { route: 'C', stops: null, h0: 13.5, h1: 17, tram: true, bus: 1, van: true, rain: [], vip: [65], jam: null, cars: 12, peds: 16, pInt: 32, pat: 60, target: 210, feat: ['f_side', 'f_vip', 'f_stops:8'] },
  { route: 'C', stops: null, h0: 15.5, h1: 18.5, tram: true, bus: 1, van: true, rain: [[35, 100]], vip: [50], jam: [[95, 140]], cars: 14, peds: 16, pInt: 31, pat: 58, target: 160, feat: ['f_jam', 'f_rain', 'f_stops:8'] },
  { route: 'B', stops: ['balat', 'galata', 'meydan', 'besiktas', 'kopru', 'iskele', 'kadikoy', 'karakoy', 'tram'], h0: 16, h1: 19.5, tram: true, bus: 2, van: true, rain: [[30, 85], [150, 210]], vip: [110], jam: null, cars: 16, peds: 18, pInt: 30, pat: 56, target: 225, feat: ['f_pier', 'f_rain', 'f_vip', 'f_stops:9'] },
  { route: 'B', stops: null, h0: 17.5, h1: 21, tram: true, bus: 2, van: true, rain: [[120, 190]], vip: [50, 170], jam: [[75, 125]], cars: 18, peds: 18, pInt: 28, pat: 54, target: 245, feat: ['f_jam', 'f_rain', 'f_vip', 'f_stops:10'] },
  { route: 'B', stops: null, h0: 19.5, h1: 23.5, tram: true, bus: 2, van: true, rain: [[140, 215]], vip: [40, 150, 205], jam: [[60, 110]], cars: 18, peds: 16, pInt: 27, pat: 52, target: 250, feat: ['f_night', 'f_jam', 'f_vip', 'f_stops:10'] },
];
LEVELS.forEach((l, i) => { l.id = i + 1; l.t2 = Math.round(l.target * 1.4); l.t3 = Math.round(l.target * 1.85); });
function endlessLevel(wave) { // wave >= 1
  const w = wave - 1, h0 = (7 + w * 3.3) % 24;
  return {
    id: 100 + wave, endless: true, wave, route: 'B', stops: null, h0, h1: h0 + 3.3, tram: true, bus: Math.min(2, 1 + (w > 1 ? 1 : 0)), van: true,
    rain: w % 2 ? [[40, 110]] : (w > 1 ? [[150, 210]] : []), vip: w > 0 ? [60 + (w % 3) * 30] : [], jam: w % 3 === 2 ? [[80, 130]] : null,
    cars: Math.min(24, 14 + w * 2), peds: 16, pInt: Math.max(20, 30 - w * 1.5), pat: Math.max(36, 56 - w * 2), target: 240 + w * 30, t2: 0, t3: 0, feat: [],
  };
}

// ---------------------------------------------------------------- world construction (static, merged)
const mProp = new Mesher(false, 0.07), mPark = new Mesher(false, 0.07), mStatic = new Mesher(false, 0.07), mRoad = new Mesher(false, 0.035), mWinL = new Mesher(false, 0), mWinD = new Mesher(false, 0), mSign = new Mesher(true, 0);
const WORLD = { shopPools: [], lamps: [], sigHeads: [], shelters: [], vendors: [], parked: [], shelterInst: [], carts: [], zebraPts: [], treeCount: 0, buildingCount: 0, signCells: {} };
// orient a quad so its geometric normal points toward (wx,wy,wz)
Mesher.prototype.quadTo = function (a, b, c, d, col, wx, wy, wz, uv) {
  const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = c[0] - b[0], e2y = c[1] - b[1], e2z = c[2] - b[2];
  const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
  if (nx * wx + ny * wy + nz * wz >= 0) this.quad(a, b, c, d, col, uv); else this.quad(a, d, c, b, col, uv && [uv[0], uv[1], uv[2], uv[3]]);
};
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const h = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
}
const PAL_WALL = [0xe9d6ae, 0xdca36a, 0xa0522d, 0xc46a45, 0xeedfc0, 0xb9c9ab, 0x86a9bf, 0xe8b49a, 0xf1e6d2, 0xb5623f, 0xd4b483, 0x9a4a2b];   // plaster, ochre and Istanbul brick
const PAL_ROOF = [0xb8482e, 0x5c6370, 0x8a4a34, 0xc65a38, 0x6a5a7a];
const PAL_AWN = [[0xe5484d, 0xfff3e0], [0x2b8cc4, 0xfff3e0], [0x3fae6a, 0xfff3e0], [0xf2a33a, 0xfff3e0], [0x7a4fb5, 0xfff3e0]];
const SIGN_TXT = ['BAKKAL', 'FIRIN', 'ÇAY EVİ', 'ECZANE', 'KEBAP', 'SİMİT', 'KUAFÖR', 'MANAV', 'ÇİÇEK', 'LOKANTA', 'KAHVE', 'DÖNER', 'TATLI', 'BALIK', 'TERZİ', 'KIRTASİYE', 'CAFE', 'MARKET', 'GİYİM', 'KUYUMCU', 'DOLMUŞ', 'DURAK', 'İSKELE', 'TRAMVAY', 'CAMİ', 'OTEL'];
const SIGN_BG = [0xb23a48, 0xd98a2b, 0x2d6a4f, 0x1f7a8c, 0x8a3b12, 0xc97b1b, 0x5a3e85, 0x4c9a2a, 0xc2477a, 0x7a2e2e, 0x4a3426, 0xa0301f, 0xd1568b, 0x1d5b8f, 0x445b73, 0x2b6f6b, 0x6b4aa0, 0x2f7f5a, 0x9a4f96, 0x8b6b1b, 0xFACC15, 0x1f5fae, 0x0f7a8a, 0xc9302c, 0x2f6b4f, 0x1d3f6b];
function makeSignTexture() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const g = cv.getContext('2d');
  g.fillStyle = '#333'; g.fillRect(0, 0, 1024, 512);
  SIGN_TXT.forEach((txt, i) => {
    const c = i % 4, r = Math.floor(i / 4), x = c * 256, y = r * 64;
    g.fillStyle = '#' + SIGN_BG[i].toString(16).padStart(6, '0'); g.fillRect(x + 2, y + 2, 252, 60);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, 244, 52);
    g.fillStyle = i === 20 ? '#1a1a1a' : '#fff7e0'; g.font = '900 ' + (txt.length > 7 ? 30 : 38) + 'px "Trebuchet MS",Arial,sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x + 128, y + 34);
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 2; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
const signUV = i => { const c = i % 4, r = Math.floor(i / 4); return [c / 4 + 0.004, 1 - (r + 1) / 8 + 0.004, (c + 1) / 4 - 0.004, 1 - r / 8 - 0.004]; };
const lamp = (x, y, z) => WORLD.lamps.push([x, y, z]);

/** vertical quad on a facade. F = facade centre, n = outward normal (x,z), du = offset along u, w = width, y0..y1 */
function facadeQuad(M, Fx, Fz, nx, nz, du, w, y0, y1, col, eps = 0.03, uv) {
  const ux = nz, uz = -nx, h = w / 2;
  const P = (d, y) => [Fx + ux * (du + d) + nx * eps, y, Fz + uz * (du + d) + nz * eps];
  M.quad(P(-h, y0), P(h, y0), P(h, y1), P(-h, y1), col, uv);
}
function windowsFacade(Fx, Fz, nx, nz, Lf, yBase, yTop, firstFloor) {
  const cols = Math.max(1, Math.floor(Lf / 3.1)), cw = Lf / cols, ux = nz, uz = -nx;
  for (let f = firstFloor; ; f++) {
    const y0 = yBase + f * 3.3 + 0.95;
    if (y0 + 1.5 > yTop - 0.4) break;
    for (let i = 0; i < cols; i++) {
      const du = -Lf / 2 + (i + 0.5) * cw;
      const lit = WR() < 0.42;
      facadeQuad(lit ? mWinL : mWinD, Fx, Fz, nx, nz, du, 1.05, y0, y0 + 1.45, 0xffffff, 0.04);
      if (DECOR) xscope(() => windowDecor(Fx, Fz, nx, nz, du, y0, f, CURB.front));
      if (WR() < 0.35) { // balcony / sill
        const cx = Fx + ux * du + nx * 0.35, cz = Fz + uz * du + nz * 0.35;
        mStatic.boxB(cx, y0 - 0.12, cz, Math.abs(ux) > 0.5 ? 1.5 : 0.8, 0.14, Math.abs(ux) > 0.5 ? 0.8 : 1.5, 0xd8d0c4);
        if (DECOR && f >= 1 && CURB.front) xscope(() => { if (XR() < 0.5) balconyDecor(Fx, Fz, nx, nz, du, y0); });
      }
    }
  }
}
function shopFront(Fx, Fz, nx, nz, Lf, yG, cellOv) {
  const units = clamp(Math.round(Lf / 4.6), 1, 3), uw = Lf / units, ux = nz, uz = -nx;
  const awn = wpick(PAL_AWN);
  for (let k = 0; k < units; k++) {
    const du = -Lf / 2 + (k + 0.5) * uw;
    facadeQuad(mWinL, Fx, Fz, nx, nz, du, uw - 0.9, yG + 0.35, yG + 2.2, 0xffffff, 0.05);   // shop glass shares the lit-window mesh: sky blue by day, warm at night
    if (DR() < 0.55) WORLD.shopPools.push([Fx + ux * du + nx * 2.2, Fz + uz * du + nz * 2.2]);
    facadeQuad(mStatic, Fx, Fz, nx, nz, du + uw * 0.3, 1.05, yG, yG + 2.15, 0x6b4a32, 0.07);
    // awning (striped, sloped)
    const aw = uw - 0.4, segs = 4;
    for (let sI = 0; sI < segs; sI++) {
      const a0 = du - aw / 2 + (sI * aw) / segs, a1 = a0 + aw / segs, col = awn[sI & 1];
      const PT = (d, out, y) => [Fx + ux * d + nx * out, y, Fz + uz * d + nz * out];
      mStatic.quadTo(PT(a0, 0.05, yG + 2.7), PT(a1, 0.05, yG + 2.7), PT(a1, 1.6, yG + 2.25), PT(a0, 1.6, yG + 2.25), col, 0, 1, 0);
      mStatic.quadTo(PT(a0, 1.6, yG + 2.25), PT(a1, 1.6, yG + 2.25), PT(a1, 1.6, yG + 1.95), PT(a0, 1.6, yG + 1.95), col, nx, 0, nz);
    }
    const cell0 = Math.floor(WR() * 20), cell = cellOv === undefined ? cell0 : cellOv;
    facadeQuad(mSign, Fx, Fz, nx, nz, du, Math.min(uw - 0.5, 3.4), yG + 2.8, yG + 3.4, 0xffffff, 0.06, signUV(cell));
  }
}
// ---------------- redesign: facade decoration. Own random stream (XR) and own meshes: it never touches WR / DR / R, so the
// city layout, the colliders and the gameplay streams stay exactly as they were. One merged mesh per city block (frustum culled).
let XR = mulberry(4711);
const xr = (a, b) => a + XR() * (b - a);
const xpick = a => a[Math.floor(XR() * a.length)];
let DECOR = null, CURB = null;          // decor mesher of the block being built, style of the building being built
const DEC_CH = new Map();   // 64 m chunks of decor geometry
function decorChunk(x, z) { const k = Math.floor(x / 64) + ',' + Math.floor(z / 64); let m = DEC_CH.get(k); if (!m) { m = new Mesher(false, 0.05); DEC_CH.set(k, m); } return m; }
const mNeon = new Mesher(true, 0);
const TRIM_COLS = [0xf4efe4, 0xe9dfc9, 0xd9cfbd, 0x8a7a66];
const SHUT_COLS = [0x3f6b4f, 0x6b4a32, 0x3b5f86, 0x8a3b2a, 0x2f5f5a];
const FRAME_COLS = [0xf4efe4, 0xf4efe4, 0x4b3a2e, 0x2f3b4a];
const NEON_COLS = [0x00BFA6, 0xff3d81, 0xffb02e, 0x4ad7ff, 0xff5a4a, 0x7dff9e];
const NEON_TXT = ['ÇAY', 'KEBAP', 'OTEL', 'KAHVE', 'PİDE', 'CAFE', 'BAR', 'ÇİÇEK', 'DÖNER', 'TATLI', 'ECZANE', 'BALIK', 'LOKANTA', 'KUAFÖR', 'SİMİT', 'OPEN'];
const FRUIT_COLS = [0xe5484d, 0xf2a33a, 0x7cc25e, 0xf2d24a, 0xc2477a];
WORLD.neonGlow = []; WORLD.reflSrc = []; WORLD.neonPool = [];
function xscope(fn) { const s = WR; WR = XR; try { fn(); } finally { WR = s; } }
function makeNeonTexture() {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const g = cv.getContext('2d');
  g.fillStyle = '#0b0e14'; g.fillRect(0, 0, 1024, 512);
  NEON_TXT.forEach((txt, i) => {
    const c = i % 4, r = Math.floor(i / 4), x = c * 256, y = r * 128, col = '#' + NEON_COLS[i % NEON_COLS.length].toString(16).padStart(6, '0');
    g.fillStyle = '#10141c'; g.fillRect(x + 4, y + 4, 248, 120);
    g.strokeStyle = col; g.lineWidth = 4; g.shadowColor = col; g.shadowBlur = 14; g.strokeRect(x + 12, y + 12, 232, 104);
    g.fillStyle = '#ffffff'; g.font = '900 ' + (txt.length > 6 ? 42 : 54) + 'px "Bahnschrift","Arial Narrow","Trebuchet MS",Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = col; g.strokeText(txt, x + 128, y + 66); g.shadowBlur = 6; g.fillText(txt, x + 128, y + 66); g.shadowBlur = 0;
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
const neonUV = i => { const c = i % 4, r = Math.floor(i / 4); return [c / 4 + 0.004, 1 - (r + 1) / 4 + 0.004, (c + 1) / 4 - 0.004, 1 - r / 4 - 0.004]; };
/** flat quad of width w x height h facing (Nx,Nz); the viewer in front of it sees the texture the right way round */
function quadFace(M, cx, cy, cz, Nx, Nz, w, h, col, uv) {
  const Rx = Nz, Rz = -Nx, hw = w / 2, hh = h / 2;
  M.quad([cx - Rx * hw, cy - hh, cz - Rz * hw], [cx + Rx * hw, cy - hh, cz + Rz * hw], [cx + Rx * hw, cy + hh, cz + Rz * hw], [cx - Rx * hw, cy + hh, cz - Rz * hw], col, uv);
}
/** box measured on a facade: from o0 to o1 off the wall, w wide (along the wall, centred at du), y0..y1 */
function fbox(M, Fx, Fz, nx, nz, du, o0, o1, w, y0, y1, col) {
  const ux = nz, uz = -nx, o = o1 - o0, oc = (o0 + o1) / 2, ax = Math.abs(nx) > 0.5;
  M.boxB(Fx + ux * du + nx * oc, y0, Fz + uz * du + nz * oc, ax ? o : w, y1 - y0, ax ? w : o, col);
}
/** thin trim: only the faces a player can see (front and top, optionally the underside) */
function fslab(M, Fx, Fz, nx, nz, du, o0, o1, w, y0, y1, col, under = false) {
  const ux = nz, uz = -nx, P = (d, o, y) => [Fx + ux * (du + d) + nx * o, y, Fz + uz * (du + d) + nz * o];
  facadeQuad(M, Fx, Fz, nx, nz, du, w, y0, y1, col, o1);
  M.quadTo(P(-w / 2, o0, y1), P(w / 2, o0, y1), P(w / 2, o1, y1), P(-w / 2, o1, y1), col, 0, 1, 0);
  if (under) M.quadTo(P(-w / 2, o0, y0), P(w / 2, o0, y0), P(w / 2, o1, y0), P(-w / 2, o1, y0), col, 0, -1, 0);
}
function neonAt(x, y, z, hex, pool) {
  if (WORLD.neonGlow.length < 260) WORLD.neonGlow.push([x, y, z, hex]);
  WORLD.reflSrc.push([x, z, hex, y]);
  if (pool) WORLD.neonPool.push([pool[0], pool[1], hex]);
}
function windowDecor(Fx, Fz, nx, nz, du, y0, f, front) {
  const M = DECOR, B = CURB;
  facadeQuad(M, Fx, Fz, nx, nz, du, 1.3, y0 - 0.12, y0 + 1.58, B.frame, 0.03);
  fslab(M, Fx, Fz, nx, nz, du, 0, 0.2, 1.5, y0 - 0.2, y0 - 0.06, B.trim);              // sill
  if (!front) return;
  if (B.lintel || f > 0) facadeQuad(M, Fx, Fz, nx, nz, du, 1.42, y0 + 1.5, y0 + 1.68, B.trim, 0.07);   // lintel
  facadeQuad(M, Fx, Fz, nx, nz, du, 0.05, y0, y0 + 1.45, B.frame, 0.065);                     // mullion
  facadeQuad(M, Fx, Fz, nx, nz, du, 1.05, y0 + 0.88, y0 + 0.93, B.frame, 0.065);             // transom
  const r = XR();
  if (r < B.shutP) {                                                                           // wooden shutters
    facadeQuad(M, Fx, Fz, nx, nz, du - 0.8, 0.44, y0 - 0.02, y0 + 1.5, B.shutter, 0.08);
    facadeQuad(M, Fx, Fz, nx, nz, du + 0.8, 0.44, y0 - 0.02, y0 + 1.5, B.shutter, 0.08);
  } else if (r < B.shutP + B.flowerP) {                                                         // flower box
    fslab(M, Fx, Fz, nx, nz, du, 0.02, 0.3, 1.1, y0 - 0.42, y0 - 0.2, 0x6b4a32);
    fslab(M, Fx, Fz, nx, nz, du, 0.04, 0.28, 1.0, y0 - 0.2, y0 - 0.02, xpick([0x4caf50, 0xe5484d, 0xf2a33a, 0xe86aa0, 0x8f5fd1]));
  } else if (r < B.shutP + B.flowerP + 0.1 && f >= 1) {                                         // air conditioner
    fbox(M, Fx, Fz, nx, nz, du + 0.1, 0, 0.42, 0.8, y0 + 1.78, y0 + 2.3, 0xdadee4);
    facadeQuad(M, Fx, Fz, nx, nz, du + 0.1, 0.6, y0 + 1.9, y0 + 2.18, 0x8c929c, 0.45);
  }
}
function balconyDecor(Fx, Fz, nx, nz, du, y0) {
  const M = DECOR, o1 = 0.78, dark = CURB.rail;
  fslab(M, Fx, Fz, nx, nz, du, o1 - 0.05, o1 + 0.01, 1.54, y0 + 0.72, y0 + 0.78, dark);        // top rail
  fslab(M, Fx, Fz, nx, nz, du - 0.74, 0.0, o1, 0.05, y0 + 0.72, y0 + 0.78, dark); fslab(M, Fx, Fz, nx, nz, du + 0.74, 0.0, o1, 0.05, y0 + 0.72, y0 + 0.78, dark);
  for (const d of [-0.58, -0.2, 0.2, 0.58]) facadeQuad(M, Fx, Fz, nx, nz, du + d, 0.035, y0 + 0.0, y0 + 0.72, dark, o1);
  if (XR() < 0.3) { /* laundry on the rail */ facadeQuad(M, Fx, Fz, nx, nz, du, 0.9, y0 + 0.2, y0 + 0.68, xpick([0xe5484d, 0x2b8cc4, 0xf6dd8c, 0xffffff]), o1 + 0.01); }
}
function bayWindow(Fx, Fz, nx, nz, du, yb, wall, trim) {      // cumba: an upper-floor box that juts out over the street
  const M = DECOR, w = 2.3, o = 0.95;
  fbox(M, Fx, Fz, nx, nz, du, 0, o, w, yb, yb + 2.9, wall);
  fbox(M, Fx, Fz, nx, nz, du, 0, o + 0.18, w + 0.3, yb + 2.9, yb + 3.08, trim);
  fbox(M, Fx, Fz, nx, nz, du, 0, o - 0.2, w - 0.5, yb - 0.4, yb, trim);
  const lit = XR() < 0.45, G = lit ? mWinL : mWinD;
  for (const d of [-0.7, 0, 0.7]) { facadeQuad(M, Fx, Fz, nx, nz, du + d, 0.58, yb + 0.7, yb + 2.4, CURB.frame, o + 0.02); facadeQuad(G, Fx, Fz, nx, nz, du + d, 0.46, yb + 0.8, yb + 2.3, 0xffffff, o + 0.035); }
  const ux = nz, uz = -nx;
  for (const s of [-1, 1]) { // side lights
    const cx = Fx + ux * (du + s * (w / 2 + 0.01)) + nx * (o / 2), cz = Fz + uz * (du + s * (w / 2 + 0.01)) + nz * (o / 2);
    G.quadTo([cx - nx * 0.3, yb + 0.8, cz - nz * 0.3], [cx + nx * 0.3, yb + 0.8, cz + nz * 0.3], [cx + nx * 0.3, yb + 2.3, cz + nz * 0.3], [cx - nx * 0.3, yb + 2.3, cz - nz * 0.3], 0xffffff, s * ux, 0, s * uz);
  }
}
function neonBlade(Fx, Fz, nx, nz, du, yc, cell, hex) {
  const ux = nz, uz = -nx, ox = Fx + ux * du, oz = Fz + uz * du, bx = ox + nx * 1.05, bz = oz + nz * 1.05;
  fbox(DECOR, Fx, Fz, nx, nz, du, 0, 1.8, 0.06, yc + 0.34, yc + 0.4, 0x2a2f38);               // bracket arm
  fbox(DECOR, Fx, Fz, nx, nz, du, 0.28, 1.82, 0.05, yc - 0.37, yc + 0.37, 0x161a22);           // sign board
  const uv = neonUV(cell);
  quadFace(mNeon, bx + ux * 0.03, yc, bz + uz * 0.03, ux, uz, 1.5, 0.72, 0xffffff, uv);
  quadFace(mNeon, bx - ux * 0.03, yc, bz - uz * 0.03, -ux, -uz, 1.5, 0.72, 0xffffff, uv);
  neonAt(bx, yc, bz, hex, [Fx + ux * du + nx * 3.0, Fz + uz * du + nz * 3.0]);
}
function shopDecor(Fx, Fz, nx, nz, Lf, yG) {
  const units = clamp(Math.round(Lf / 4.6), 1, 3), uw = Lf / units, M = DECOR, B = CURB;
  for (let k = 0; k < units; k++) {
    const du = -Lf / 2 + (k + 0.5) * uw;
    facadeQuad(M, Fx, Fz, nx, nz, du + uw * 0.3, 1.3, yG, yG + 2.3, B.frame, 0.045);               // door surround
    fslab(M, Fx, Fz, nx, nz, du, 0, 0.1, uw - 0.4, yG + 0.0, yG + 0.35, 0x6e665a);                          // stall riser
    fslab(M, Fx, Fz, nx, nz, du, 0, 0.14, uw - 0.4, yG + 2.19, yG + 2.35, 0x2f3238, true);                  // shutter box
    const r = XR();
    if (r < 0.4) {                                                                                           // produce crates
      for (let c = 0; c < 3; c++) {
        const d = du + (c - 1) * 0.8, ox = 0.1, o1 = 0.8;
        fbox(M, Fx, Fz, nx, nz, d, ox, o1, 0.7, yG, yG + 0.5, 0x8a5a3a);
        fbox(M, Fx, Fz, nx, nz, d, ox + 0.04, o1 - 0.04, 0.62, yG + 0.5, yG + 0.62, xpick(FRUIT_COLS));
      }
    } else if (r < 0.62) {                                                                                   // cafe table and two stools
      const ux = nz, uz = -nx, tx = Fx + ux * du + nx * 1.7, tz = Fz + uz * du + nz * 1.7, y = hillH(tx, tz) + 0.14;
      M.cyl(tx, y, tz, 0.4, 0.4, 0.06, 8, 0xf4efe4, true); M.cyl(tx, y, tz, 0.05, 0.05, 0.7, 5, 0x3d4350);
      M.cyl(tx, y + 0.7, tz, 0.42, 0.42, 0.06, 8, xpick([0xe5484d, 0x2b8cc4, 0x3fae6a, 0xf2a33a]), true);
      for (const s of [-1, 1]) M.cyl(tx + ux * s * 0.7, y, tz + uz * s * 0.7, 0.2, 0.17, 0.42, 6, 0x6b4a32, true);
    }
    if (XR() < 0.6) neonBlade(Fx, Fz, nx, nz, du + uw * 0.28, yG + 4.15 + xr(0, 0.3), Math.floor(XR() * 16), NEON_COLS[Math.floor(XR() * NEON_COLS.length)]);
  }
}
function roofDecor(cx, cz, sx, sz, top, gable, gh) {
  const M = DECOR, r = XR();
  if (gable) {
    if (r < 0.5) { const alongX = sx >= sz, px = cx + (alongX ? xr(-sx * 0.3, sx * 0.3) : 0), pz = cz + (alongX ? 0 : xr(-sz * 0.3, sz * 0.3)); M.boxB(px, top + gh * 0.45, pz, 0.7, gh * 0.55 + 1.2, 0.7, 0xa04a30); M.boxB(px, top + gh + 1.15, pz, 0.9, 0.18, 0.9, 0x6b6e76); }
    return;
  }
  const y = top + 0.45, ax = sx / 2 - 1.3, az = sz / 2 - 1.3;
  if (ax < 0.5 || az < 0.5) return;
  if (r < 0.34) { const px = cx + xr(-ax, ax), pz = cz + xr(-az, az); M.cyl(px, y, pz, 0.8, 0.8, 1.2, 8, xpick([0x7a8794, 0x8a5a44, 0x4c6a8a])); M.cyl(px, y + 1.2, pz, 0.8, 0.05, 0.35, 8, 0x4a4f58); }
  else if (r < 0.6) { const px = cx + xr(-ax, ax), pz = cz + xr(-az, az); M.cyl(px, y, pz, 0.04, 0.04, 3.4, 5, 0x3d4350); for (const h of [1.8, 2.5, 3.1]) M.boxB(px, y + h, pz, 0.04, 0.04, 1.1 - h * 0.18, 0x3d4350); }
  else if (r < 0.82) { const px = cx + xr(-ax, ax), pz = cz + xr(-az, az); M.sphere(px, y + 0.5, pz, 0.55, 0.28, 0.55, 7, 3, 0xe8ecf0, 0, Math.PI / 2); M.cyl(px, y, pz, 0.04, 0.04, 0.55, 5, 0x3d4350); }
  if (XR() < 0.4) { const px = cx + xr(-ax, ax), pz = cz + xr(-az, az); M.boxB(px, y, pz, 1.0, 0.7, 0.7, 0xdadee4); M.boxB(px + 0.1, y + 0.7, pz, 0.6, 0.1, 0.6, 0x8c929c); }
}
function buildingDecor(x0, z0, x1, z1, nx, nz, top, floors, D) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sx = x1 - x0, sz = z1 - z0, M = DECOR, B = CURB;
  const Lf = Math.abs(nx) > 0.5 ? sz : sx, Fx = cx + nx * sx / 2, Fz = cz + nz * sz / 2, yG = hillH(Fx, Fz);
  // belt courses between the floors, a heavier cornice under the roof, stone plinth and corner quoins
  for (let f = 1; f < floors; f++) fslab(M, Fx, Fz, nx, nz, 0, 0, 0.14, Lf, yG + f * 3.3 + 0.18, yG + f * 3.3 + 0.34, B.trim);
  fslab(M, Fx, Fz, nx, nz, 0, 0, 0.42, Lf + 0.2, top - 0.38, top, B.trim, true); fslab(M, Fx, Fz, nx, nz, 0, 0, 0.24, Lf, top - 0.62, top - 0.38, B.corn);
  fslab(M, Fx, Fz, nx, nz, 0, 0, 0.09, Lf, yG - 0.4, yG + 0.7, 0x756b5c);
  for (const s of [-1, 1]) fslab(M, Fx, Fz, nx, nz, s * (Lf / 2 - 0.25), 0, 0.1, 0.5, yG, top - 0.62, B.trim);
  // cumba bay windows on the upper floors
  if (floors >= 4 && Lf > 6.5 && (D === DIST.balat || D === DIST.galata || XR() < 0.3)) {
    const n = Lf > 10 ? 2 : 1;
    for (let i = 0; i < n; i++) { const f = 2 + Math.floor(XR() * (floors - 2.2)), du = n === 1 ? xr(-Lf * 0.2, Lf * 0.2) : (i ? 1 : -1) * Lf * 0.25; if (f < floors) bayWindow(Fx, Fz, nx, nz, du, yG + f * 3.3 + 0.35, B.bay, B.trim); }
  }
}

// ---------------- redesign: masonry detail on every wall (world-space tri-planar, one 256 px tile): brick courses on brick-coloured
// surfaces, stucco mottling everywhere. No UVs needed, so the merged vertex-coloured meshes keep working.
const WALLU = { tWall: { value: null } };
function makeWallTexture() {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), img = g.createImageData(S, S), d = img.data, rnd = mulberry(9001);
  const bh = S / 24, bw = S / 8, tone = []; for (let r = 0; r < 24; r++) { tone[r] = []; for (let c = 0; c < 9; c++) tone[r][c] = 0.9 + rnd() * 0.14; }
  const waves = []; for (let i = 0; i < 7; i++) waves.push([1 + Math.floor(rnd() * 5), 1 + Math.floor(rnd() * 5), rnd() * TAU, 0.015 + rnd() * 0.02]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const r = Math.floor(y / bh), off = (r & 1) * bw / 2, xx = (x + off) % S, c = Math.floor(xx / bw);
    const mortar = (y % bh) < 1.5 || (xx % bw) < 1.5;
    const brick = mortar ? 0.7 : tone[r][c] * (0.97 + rnd() * 0.05);
    let n = 1; for (const [a, b, ph, am] of waves) n += am * Math.sin(TAU * (a * x + b * y) / S + ph);
    const i = (y * S + x) * 4; d[i] = Math.min(255, brick * 255); d[i + 1] = Math.min(255, (n * 0.98 + (rnd() - 0.5) * 0.05) * 255); d[i + 2] = 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}
function patchWall(mat) {
  mat.onBeforeCompile = sh => {
    if (lowQ()) return;   // the Low tier keeps the plain flat-shaded walls
    sh.uniforms.tWall = WALLU.tWall;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform sampler2D tWall;')
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec3 wn = normalize(cross(dFdx(vWP), dFdy(vWP)));
  vec2 wuv = abs(wn.y) > 0.6 ? vWP.xz : (abs(wn.x) > abs(wn.z) ? vWP.zy : vWP.xy);
  vec3 tw = texture2D(tWall, wuv / 1.92).rgb;
  float brickM = smoothstep(2.6, 3.4, vColor.r / (vColor.g + 0.02));
  float leaf = step(vColor.r + 0.02, vColor.g);
  diffuseColor.rgb *= mix(1.0, tw.r, brickM * 0.9) * mix(1.0, tw.g, mix(0.9, 0.45, leaf)); }`);
  };
  mat.customProgramCacheKey = () => 'wall' + (lowQ() ? 'l' : 'h');
}

function building(x0, z0, x1, z1, nx, nz, shop, opts = {}) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, sx = x1 - x0, sz = z1 - z0;
  const gs = [hillH(x0, z0), hillH(x1, z0), hillH(x0, z1), hillH(x1, z1), hillH(cx, cz)];
  const gmin = Math.min(...gs), gmax = Math.max(...gs);
  const D = opts.dist || null, dp = a => a[Math.floor(DR() * a.length)];
  const floors = opts.floors || (D ? dp(D.floors) : wpick([2, 3, 3, 4, 4, 5])), h = floors * 3.3 + 0.6;
  const wall = opts.wall || (D ? dp(D.wall) : wpick(PAL_WALL)), top = gmax + h;
  mStatic.boxB(cx, gmin - 0.9, cz, sx, top - gmin + 0.9, sz, wall);
  let isGable = false;
  if (WR() < (D ? D.gable : 0.58)) { mStatic.gable(cx, cz, sx, sz, top, wr(1.8, 3), D && D.roof ? dp(D.roof) : wpick(PAL_ROOF), wall); isGable = true; }
  else {
    mStatic.boxB(cx, top, cz, sx + 0.3, 0.45, sz + 0.3, 0xe9e2d6);
    if (WR() < 0.6) mStatic.boxB(cx + wr(-sx / 4, sx / 4), top + 0.45, cz + wr(-sz / 4, sz / 4), wr(1.4, 2.4), wr(1, 1.8), wr(1.4, 2.4), wpick([0x8f98a3, 0xb0703c, 0xd6d1c7]));
  }
  obBox(x0, z0, x1, z1);
  WORLD.buildingCount++;
  DECOR = decorChunk(cx, cz);
  XR = mulberry(Math.imul(Math.floor(x0 * 37.1 + 1000), 73856093) ^ Math.imul(Math.floor(z0 * 41.3 + 1000), 19349663));
  CURB = { frame: xpick(FRAME_COLS), trim: xpick(TRIM_COLS), shutter: xpick(SHUT_COLS), rail: xpick([0x2a2f38, 0x3d4350, 0x4b3a2e]), shutP: D === DIST.balat ? 0.45 : 0.2, flowerP: 0.16, lintel: XR() < 0.5, bay: wall, corn: new THREE.Color(wall).multiplyScalar(0.8).getHex(), front: true };
  if (DECOR) xscope(() => roofDecor(cx, cz, sx, sz, top, isGable, 2.4));
  if (opts.plain) return;
  // facades: front + two lateral sides
  const sides = [[nx, nz], [nz, -nx], [-nz, nx]];
  sides.forEach(([mx, mz], k) => {
    const Fx = cx + mx * sx / 2, Fz = cz + mz * sz / 2, Lf = Math.abs(mx) > 0.5 ? sz : sx;
    const isFront = k === 0 && shop;
    const yG = hillH(Fx, Fz);
    CURB.front = k === 0;
    windowsFacade(Fx, Fz, mx, mz, Lf, yG, top, isFront ? 1 : 0);
    if (isFront) shopFront(Fx, Fz, mx, mz, Lf, yG);
    if (k === 0 && DECOR) xscope(() => { buildingDecor(x0, z0, x1, z1, mx, mz, top, floors, D); if (isFront) shopDecor(Fx, Fz, mx, mz, Lf, yG); });
    else if (k === 0) { // house door
      facadeQuad(mStatic, Fx, Fz, mx, mz, wr(-Lf / 4, Lf / 4), 1.1, yG, yG + 2.1, 0x6b4a32, 0.06);
    }
  });
}
function tree(x, z, s = 1, kind = 0) {
  const y = hillH(x, z);
  if (kind === 1) { // cypress
    mStatic.cyl(x, y, z, 0.18 * s, 0.14 * s, 0.9 * s, 5, 0x6b4a32);
    mStatic.cyl(x, y + 0.7 * s, z, 1.0 * s, 0.05, 6.5 * s, 7, wpick([0x2f6b3a, 0x2a5f35, 0x356f40]));
  } else {
    mStatic.cyl(x, y, z, 0.2 * s, 0.14 * s, 2.3 * s, 6, 0x7a5236);
    const g = wpick([0x58a64a, 0x6fb858, 0x4c9a45, 0x7cc25e, 0x8bc34a]);
    mStatic.sphere(x, y + 3.2 * s, z, 1.7 * s, 1.5 * s, 1.7 * s, 7, 5, g);
    if (WR() < 0.6) mStatic.sphere(x + wr(-0.9, 0.9) * s, y + 4.2 * s, z + wr(-0.9, 0.9) * s, 1.1 * s, 1.0 * s, 1.1 * s, 6, 4, g);
  }
  obCirc(x, z, 0.35);
  WORLD.treeCount++;
}
function lampPost(x, z, dirx, dirz) { // arm points toward (dirx,dirz)
  const y = hillH(x, z);
  mStatic.cyl(x, y, z, 0.1, 0.07, 5.4, 6, 0x3d4350);
  mStatic.boxB(x + dirx * 0.55, y + 5.35, z + dirz * 0.55, Math.abs(dirx) > 0.5 ? 1.2 : 0.12, 0.1, Math.abs(dirz) > 0.5 ? 1.2 : 0.12, 0x3d4350);
  lamp(x + dirx * 1.1, y + 5.2, z + dirz * 1.1);
  obCirc(x, z, 0.22);
}
function bench(x, z, ry) {
  const y = hillH(x, z);
  mStatic.box(x, y + 0.5, z, 1.8, 0.1, 0.5, 0x8a5a3a, ry);
  mStatic.box(x - Math.sin(ry + Math.PI / 2) * 0.22 * 0, y + 0.8, z, 1.8, 0.4, 0.08, 0x8a5a3a, ry);
  mStatic.box(x, y + 0.25, z, 1.6, 0.5, 0.35, 0x4b4f58, ry);
  obCirc(x, z, 0.7, 0);
}
function parkedCar(x, z, ry, long) {
  const y = hillH(x, z), col = wpick([0xd94f4f, 0x3d7fc4, 0xe8e2d0, 0x2f2f35, 0x7a9d5a, 0xe0a030, 0x8c8f99, 0xf2f2f2]);
  mPark.boxB(x, y + 0.35, z, 1.8, 0.6, 4.1, col, ry);
  mPark.boxB(x, y + 0.95, z, 1.6, 0.55, 2.3, col, ry);
  mPark.boxB(x, y + 1.0, z, 1.64, 0.4, 2.0, 0x27323f, ry);
  WORLD.parked.push({ x, y, z, ry, col });
  const ax = Math.abs(Math.sin(ry)) > 0.5;
  obBox(x - (ax ? 2.05 : 0.95), z - (ax ? 0.95 : 2.05), x + (ax ? 2.05 : 0.95), z + (ax ? 0.95 : 2.05));
}
function shelterAt(x, z, hx, hz, label) {
  // (hx,hz) is the travel direction of the road at the stop. Shelter faces the road (left of travel = -right).
  const y = hillH(x, z), rx = -hz, rz = hx, ry = Math.atan2(hx, hz);
  const P = (a, l) => [x + hx * a + rx * l, z + hz * a + rz * l]; // a along road, l lateral (toward kerb positive)
  const back = P(0, 0.75);
  WORLD.shelterInst.push({ x, y, z, ry });
  mProp.box(back[0], y + 1.2, back[1], 0.1, 2.0, 3.0, 0x4d7f8f, ry + Math.PI / 2 * 0 + 0 );
  // The panels are built with box(): local z = along road, local x = lateral
  const roof = P(0, 0);
  mProp.box(roof[0], y + 2.45, roof[1], 1.7, 0.14, 3.5, 0xe5484d, ry);
  for (const a of [-1.55, 1.55]) { const p = P(a, 0.1); mProp.cyl(p[0], y, p[1], 0.06, 0.06, 2.4, 5, 0x3d4350); }
  const bp = P(0, 0.45); mProp.box(bp[0], y + 0.5, bp[1], 0.5, 0.1, 2.2, 0x9a6a42, ry);
  // sign pole + DURAK plate facing oncoming traffic
  const sp = P(-2.4, -0.2); mStatic.cyl(sp[0], y, sp[1], 0.05, 0.05, 2.9, 5, 0x3d4350);
  facadeQuad(mSign, sp[0], sp[1], -hx, -hz, 0, 0.9, y + 2.35, y + 2.75, 0xffffff, 0.08, signUV(21));
  facadeQuad(mSign, sp[0], sp[1], hx, hz, 0, 0.9, y + 2.35, y + 2.75, 0xffffff, 0.08, signUV(21));
  const ex = Math.abs(hx) * 1.9 + Math.abs(rx) * 0.9, ez = Math.abs(hz) * 1.9 + Math.abs(rz) * 0.9;
  obBox(roof[0] - ex, roof[1] - ez, roof[0] + ex, roof[1] + ez);
}

// ---------------- ground (indexed, vertex coloured)
function buildGroundMesh() {
  const x0 = -190, x1 = 190, z0 = -135, z1 = 140, cs = 2.5;
  const nx = Math.round((x1 - x0) / cs), nz = Math.round((z1 - z0) / cs);
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array((nx + 1) * (nz + 1) * 3), idx = new Uint32Array(nx * nz * 6);
  const cA = new THREE.Color(0x6fb35f), cB = new THREE.Color(0x98d070), cDry = new THREE.Color(0xb3c47a), cStone = new THREE.Color(0xb7aea0), cSand = new THREE.Color(0xe8d6a6), cWet = new THREE.Color(0x9c8c64), tmp = new THREE.Color();
  let k = 0;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + i * cs, z = z0 + j * cs, y = groundH(x, z), v = (j * (nx + 1) + i);
    pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
    const n = vnoise(x * 0.06, z * 0.06) * 0.6 + vnoise(x * 0.23, z * 0.23) * 0.4;
    tmp.copy(cA).lerp(cB, n);
    const far = sstep(150, 190, Math.abs(x)) + sstep(-100, -130, z); tmp.lerp(cDry, clamp(far * 0.7, 0, 1));
    if (y < SEA_Y + 0.15) tmp.copy(cWet); else if (canalDip(z) > 0.05 && z > 40 && z < 90) tmp.copy(cStone); else if (z > 124) tmp.lerp(cSand, sstep(124, 129, z));
    col[v * 3] = tmp.r; col[v * 3 + 1] = tmp.g; col[v * 3 + 2] = tmp.b;
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + (nx + 1), d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}

// ---------------- roads, markings, pavements
function crossIntervals(r) {
  const out = [];
  for (const c of CROSS) {
    if (c.H !== r && c.V !== r) continue;
    const o = c.H === r ? c.V : c.H, t = r.horiz ? c.x : c.z;
    const wider = r.w > o.w || (r.w === o.w && ROADS.indexOf(r) < ROADS.indexOf(o));
    const ext = wider ? o.h : o.h + PAVE + 0.2;
    out.push([t - ext, t + ext, o.h]);
  }
  return out;
}
const inAny = (t, iv, pad = 0) => iv.some(([a, b]) => t > a - pad && t < b + pad);
function buildRoads() {
  for (const r of ROADS) {
    if (r.virtual) continue;
    const ax = r.horiz ? 0 : 1, lo = Math.min(r.a[ax], r.b[ax]), hi = Math.max(r.a[ax], r.b[ax]);
    let eLo = 0, eHi = 0;
    for (const c of CROSS) {
      if (c.H !== r && c.V !== r) continue;
      const o = c.H === r ? c.V : c.H, t = r.horiz ? c.x : c.z;
      if (Math.abs(t - lo) < 0.5) eLo = Math.max(eLo, o.h);
      if (Math.abs(t - hi) < 0.5) eHi = Math.max(eHi, o.h);
    }
    r.t0 = lo - eLo; r.t1 = hi + eHi;
    const P = (t, lat, up = 0.04) => { const x = r.horiz ? t : r.a[0] + lat, z = r.horiz ? r.a[1] + lat : t; return [x, yAt(x, z) + up, z]; };
    const iv = crossIntervals(r), step = 3;
    const bridge = (t) => !r.horiz && (r.id === 'v0' || r.id === 'v2') && t > 49 && t < 81;
    for (let t = r.t0; t < r.t1 - 1e-6; t += step) {
      const ta = t, tb = Math.min(t + step, r.t1);
      for (const [l0, l1] of [[-r.h, 0], [0, r.h]]) mRoad.quadTo(P(ta, l0), P(tb, l0), P(tb, l1), P(ta, l1), 0x373a41, 0, 1, 0);
    }
    // markings
    const mk = (ta, tb, l0, l1, col) => mRoad.quadTo(P(ta, l0, 0.06), P(tb, l0, 0.06), P(tb, l1, 0.06), P(ta, l1, 0.06), col, 0, 1, 0);
    if (r.id === 'main') {
      for (let t = r.t0; t < r.t1; t += 6) { if (inAny(t + 3, iv, 3)) continue; mk(t, t + 3.5, -r.h + 0.35, -r.h + 0.6, 0xf3efe0); mk(t, t + 3.5, r.h - 0.6, r.h - 0.35, 0xf3efe0); }
      for (let t = r.t0; t < r.t1; t += 5) { if (inAny(t + 2, iv, 2)) continue; mk(t, t + 2.5, 3.0, 3.18, 0xf3efe0); mk(t, t + 2.5, -3.18, -3.0, 0xf3efe0); }
    } else {
      const d = r.narrow ? 4 : 6, on = r.narrow ? 2 : 3;
      for (let t = r.t0 + 1; t < r.t1 - on; t += d) { if (inAny(t + on / 2, iv, 1.5) || bridge(t) && false) continue; mk(t, t + on, -0.12, 0.12, r.narrow ? 0xf3efe0 : 0xf7d84a); }
    }
    // pavements
    if (r.id === 'v0' || r.id === 'v2') { /* handled with a gap on the bridge */ }
    for (const side of [-1, 1]) {
      for (let t = r.t0; t < r.t1 - 1e-6; t += 3) {
        const ta = t, tb = Math.min(t + 3, r.t1), tm = (ta + tb) / 2;
        if (inAny(tm, iv)) continue;
        if (bridge(tm)) continue;
        if (r.t0 !== lo && tm < lo) continue; if (r.t1 !== hi && tm > hi) continue;
        const l0 = side * r.h, l1 = side * (r.h + PAVE), ph = 0.14;
        const c = ((Math.floor(ta / 3) & 1) ? 0xc4b9a6 : 0xcec3af);
        mRoad.quadTo(P(ta, l0, ph), P(tb, l0, ph), P(tb, l1, ph), P(ta, l1, ph), c, 0, 1, 0);
        mRoad.quadTo(P(ta, l0, 0.04), P(tb, l0, 0.04), P(tb, l0, ph), P(ta, l0, ph), 0xa79f92, -side * (r.horiz ? 0 : 1), 0, -side * (r.horiz ? 1 : 0));
      }
    }
  }
  // zebra crossings + stop lines
  for (const zc of ZEBRAS) {
    const y = (x, z) => yAt(x, z) + 0.06;
    for (let k = -zc.half + 0.9; k <= zc.half - 0.9; k += 1.0) {
      if (Math.abs(k) < 0.01 && zc.sig < 0 && false) continue;
      if (zc.dir === 'z') { const x0 = zc.x - 1.2, x1 = zc.x + 1.2, z0 = zc.z + k - 0.25, z1 = zc.z + k + 0.25; mRoad.quadTo([x0, y(x0, z0), z0], [x1, y(x1, z0), z0], [x1, y(x1, z1), z1], [x0, y(x0, z1), z1], 0xf5f1e4, 0, 1, 0); }
      else { const z0 = zc.z - 1.2, z1 = zc.z + 1.2, x0 = zc.x + k - 0.25, x1 = zc.x + k + 0.25; mRoad.quadTo([x0, y(x0, z0), z0], [x1, y(x1, z0), z0], [x1, y(x1, z1), z1], [x0, y(x0, z1), z1], 0xf5f1e4, 0, 1, 0); }
    }
  }
  for (const ap of APPROACHES) {
    const s = SIGNALS[ap.sig];
    if (ap.axis === 'x') {
      const lane = 5, zc = ap.dx > 0 ? s.z + lane : s.z - lane, x0 = ap.lx - 0.2, x1 = ap.lx + 0.2;
      mRoad.quadTo([x0, yAt(x0, zc) + 0.06, zc - 2], [x1, yAt(x1, zc) + 0.06, zc - 2], [x1, yAt(x1, zc) + 0.06, zc + 2], [x0, yAt(x0, zc) + 0.06, zc + 2], 0xf5f1e4, 0, 1, 0);
    } else {
      const lane = s.hz / 2, xc = ap.dz > 0 ? s.x - lane : s.x + lane, z0 = ap.lz - 0.2, z1 = ap.lz + 0.2;
      mRoad.quadTo([xc - 2, yAt(xc, z0) + 0.06, z0], [xc + 2, yAt(xc, z0) + 0.06, z0], [xc + 2, yAt(xc, z1) + 0.06, z1], [xc - 2, yAt(xc, z1) + 0.06, z1], 0xf5f1e4, 0, 1, 0);
    }
  }
  // plaza paving
  const PZ = { x0: -35, x1: 35, z0: -81, z1: -13 };
  for (let x = PZ.x0; x < PZ.x1; x += 3.5) for (let z = PZ.z0; z < PZ.z1; z += 3.5) {
    const xa = x, xb = Math.min(x + 3.5, PZ.x1), za = z, zb = Math.min(z + 3.5, PZ.z1);
    const c = ((Math.floor((x - PZ.x0) / 3.5) + Math.floor((z - PZ.z0) / 3.5)) & 1) ? 0xc9ab80 : 0xd9c29a;
    const Pq = (a, b) => [a, yAt(a, b) + 0.07, b];
    mRoad.quadTo(Pq(xa, za), Pq(xb, za), Pq(xb, zb), Pq(xa, zb), c, 0, 1, 0);
  }
  // quay walkway along the canal's north bank and promenade
  for (let x = -170; x < 170; x += 6) for (const [za, zb, c] of [[49.8, 56.2, 0xc9c1b3], [129.5, 131.2, 0xd9d1c3], [73.8, 79, 0xc9c1b3]]) {
    const xb = x + 6, Pq = (a, b) => [a, yAt(a, b) + 0.1, b];
    if (za > 70 || za > 120) { if (Math.abs(x + 3) < 16 || Math.abs(x + 3 - 100) < 16 && za < 100) { /* bridge heads handled by road */ } }
    if (za < 60 && (Math.abs(x + 3) < 6.5 || Math.abs(x + 3 - 100) < 6.5)) continue;
    if (za > 70 && za < 80 && (Math.abs(x + 3) < 6.5 || Math.abs(x + 3 - 100) < 6.5)) continue;
    mRoad.quadTo(Pq(x, za), Pq(xb, za), Pq(xb, zb), Pq(x, zb), c, 0, 1, 0);
  }
  // tram tracks on the main street
  const mainR = ROADS[0];
  for (const zc of [-1.6, 1.6]) {
    for (let x = -150; x < 150; x += 3) {
      for (const dz of [-0.72, 0.72]) {
        const xa = x, xb = x + 3, za = zc + dz - 0.05, zb = zc + dz + 0.05;
        mRoad.quadTo([xa, yAt(xa, za) + 0.075, za], [xb, yAt(xb, za) + 0.075, za], [xb, yAt(xb, zb) + 0.075, zb], [xa, yAt(xa, zb) + 0.075, zb], 0x9296a0, 0, 1, 0);
      }
    }
    for (let x = -150; x < 150; x += 1.3) mRoad.quadTo([x, yAt(x, zc - 1.1) + 0.056, zc - 1.1], [x + 0.25, yAt(x, zc - 1.1) + 0.056, zc - 1.1], [x + 0.25, yAt(x, zc + 1.1) + 0.056, zc + 1.1], [x, yAt(x, zc + 1.1) + 0.056, zc + 1.1], 0x5b4a3d, 0, 1, 0);
  }
  // tram platforms (median islands)
  for (const px of [-50, 60]) {
    const y = yAt(px, 0);
    mStatic.boxB(px, y + 0.02, 0, 16, 0.3, 1.0, 0xcfc7b9);
    mStatic.boxB(px, y + 0.3, 0, 12, 0.08, 0.7, 0xf0c53a);
    facadeQuad(mSign, px, 0, 0, -1, -4, 1.4, y + 1.9, y + 2.3, 0xffffff, 0.2, signUV(23));
    mStatic.cyl(px - 4, y, 0, 0.05, 0.05, 2.1, 5, 0x3d4350);
  }
}

// ---------------- bridges, canal walls, pier
function buildBridgesAndWalls() {
  for (const bx of BRIDGE_X) {
    const r = bx === 0 ? ROADS.find(q => q.id === 'v0') : ROADS.find(q => q.id === 'v2'), hw = r.h;
    for (let z = 51; z < 79; z += 2) {
      const z2 = z + 2, yA = yAt(bx, z), yB = yAt(bx, z2);
      for (const side of [-1, 1]) {
        const x = bx + side * hw;
        mStatic.quadTo([x, yA + 0.04, z], [x, yB + 0.04, z2], [x, yB - 0.9, z2], [x, yA - 0.9, z], 0xb9ad98, side, 0, 0);
        mStatic.box(x + side * 0.3, (yA + yB) / 2 + 0.5, z + 1, 0.5, 0.9, 2.05, 0xcdbfa6);
        mStatic.box(x + side * 0.3, (yA + yB) / 2 + 1.0, z + 1, 0.6, 0.12, 2.1, 0x9a8a70);
      }
      mStatic.quadTo([bx - hw, yA - 0.9, z], [bx + hw, yA - 0.9, z], [bx + hw, yB - 0.9, z2], [bx - hw, yB - 0.9, z2], 0x7b7466, 0, -1, 0);
    }
    for (const side of [-1, 1]) for (let z = 52; z < 79; z += 4) obBox(bx + side * hw - 0.1 + (side > 0 ? 0 : -0.7), z, bx + side * hw + 0.7 + (side > 0 ? 0 : -0.1) - 0.0, z + 4, 2);
    // piers / arches on the water
    for (const pz of [58.5, 71.5]) mStatic.boxB(bx, -1.4, pz, hw * 2 + 0.6, yAt(bx, pz) + 0.6, 1.4, 0xa89f8c);
  }
  // quay walls along the canal (gaps at the bridges)
  for (const zq of [56.2, 73.8]) {
    for (let x = -186; x < 186; x += 4) {
      const xc = x + 2;
      if (Math.abs(xc) < 7 || Math.abs(xc - 100) < 7) continue;
      mStatic.boxB(xc, -1.2, zq, 4.02, 1.45 + hillH(xc, zq), 0.7, 0xa8a090);
      mStatic.boxB(xc, 0.2 + hillH(xc, zq), zq, 4.02, 0.12, 0.8, 0x8c8474);
      obBox(xc - 2, zq - 0.4, xc + 2, zq + 0.4, 2);
    }
  }
  // water edge walls near the sea (promenade)
  for (let x = -186; x < 186; x += 4) {
    mStatic.boxB(x + 2, -1.2, 131.4, 4.02, 1.55, 0.6, 0xa8a090); mStatic.boxB(x + 2, 0.35, 131.4, 4.02, 0.12, 0.7, 0x8c8474);
  }
  obBox(-190, 131.0, 190, 132, 2);
  // map boundary (invisible walls) and road-end barriers
  obBox(-190, -105, 190, -104, 2); obBox(-157, -110, -156, 135, 2); obBox(156, -110, 157, 135, 2);
  for (const sx of [-1, 1]) for (let z = -8; z <= 8; z += 4) { mStatic.boxB(sx * 153, yAt(sx * 153, z), z, 2, 1.0, 3.6, 0xcbc4b6); mStatic.boxB(sx * 153, yAt(sx * 153, z) + 1, z, 2.1, 0.25, 3.7, 0xe5484d); }
  // dead-end barrier of the western side street at the canal
  mStatic.boxB(-100, 0.0, 51.5, 7.6, 1.1, 0.8, 0xcbc4b6); obBox(-104, 51, -96, 52, 2);
  // pier + ferry
  mStatic.boxB(60, 0.15, 146, 8, 0.45, 38, 0x9c7a55);
  for (let z = 133; z < 163; z += 4) for (const dx of [-3.6, 3.6]) { mStatic.cyl(60 + dx, -2.4, z, 0.3, 0.3, 2.9, 6, 0x5b4a3d); mStatic.boxB(60 + dx, 0.3, z, 0.4, 0.5, 0.4, 0xe5484d); }
  for (let z = 131; z < 165; z += 3) for (const dx of [-3.85, 3.85]) mStatic.boxB(60 + dx, 0.55, z, 0.16, 0.9, 0.16, 0x3d4350);
  mStatic.boxB(60, 0.6, 165, 8, 0.9, 0.5, 0xe5484d);
  obBox(55.7, 126, 56.1, 165, 2); obBox(63.9, 126, 64.3, 165, 2); obBox(55.7, 165, 64.3, 166, 2);
  for (const z of [140, 150]) {
    mStatic.boxB(60, 0.6, z, 6, 0.12, 3, 0x6fa7d9); facadeQuad(mSign, 60, z - 1.5, 0, -1, 0, 3.2, 3.2, 3.9, 0xffffff, 0.05, signUV(22));
    mStatic.cyl(58.5, 0.6, z - 1.5, 0.08, 0.08, 3.2, 5, 0x3d4350); mStatic.cyl(61.5, 0.6, z - 1.5, 0.08, 0.08, 3.2, 5, 0x3d4350);
    mStatic.boxB(60, 3.6, z - 1.5, 6.4, 0.14, 0.2, 0xe5484d); break;
  }
  // tea-garden kiosks on the promenade
  for (const kx of [-20, 30, 120]) {
    mStatic.boxB(kx, 0.1, 126.4, 5, 2.6, 3, 0xf3e3c3); mStatic.gable(kx, 126.4, 5, 3, 2.7, 1.2, 0xc1583c, 0xf3e3c3, 0.4);
    facadeQuad(mSign, kx, 126.4, 0, -1, 0, 3.4, 1.9, 2.5, 0xffffff, 0.06, signUV(wpick([0, 2, 10, 13, 16]))); obBox(kx - 2.5, 124.9, kx + 2.5, 127.9);
  }
}
function buildFerry() {
  const M = new Mesher(false, 0.05);
  M.boxB(0, 0, 0, 6.6, 2.2, 22, 0xf2f2f2); M.boxB(0, 2.2, 0, 6.8, 0.25, 22.2, 0x1d5b8f);
  M.boxB(0, 0, 0, 6.7, 0.7, 22.1, 0x1d5b8f);
  M.cyl(0, 0, -11, 3.3, 0.15, 2.2, 8, 0xf2f2f2); // bow
  M.boxB(0, 2.45, 0.5, 5.2, 2.0, 15, 0xfbfbf6); M.boxB(0, 4.45, 0.5, 5.4, 0.2, 15.2, 0xe5484d);
  for (const sx of [-1, 1]) for (let z = -6; z <= 7; z += 1.7) M.boxB(sx * 2.62, 3.1, z, 0.06, 0.9, 1.2, 0x27324a);
  M.boxB(0, 4.65, -3, 4, 1.8, 4, 0xfbfbf6); M.boxB(0, 5.1, -3, 4.1, 0.7, 4.1, 0x27324a);
  M.cyl(0, 4.65, 4, 0.9, 0.8, 2.8, 8, 0xe5484d); M.cyl(0, 7.4, 4, 0.82, 0.82, 0.5, 8, 0x1d1d1d);
  return M.build();
}

// ---------------- city blocks
const BLOCKS = [
  { x0: -170, x1: 170, z0: -128, z1: -99.5, shop: { s: false } },
  { x0: -92.5, x1: -36, z0: -81, z1: -52.5, shop: { n: false, e: false } },
  { x0: -92.5, x1: -36, z0: -37.5, z1: -12.8, shop: { s: true } },
  { x0: 36, x1: 91.5, z0: -81, z1: -52.5, shop: {} },
  { x0: 36, x1: 91.5, z0: -37.5, z1: -12.8, shop: { s: true } },
  { x0: -170, x1: -107.5, z0: -99.5, z1: -12.8, shop: { s: true } },
  { x0: 108.5, x1: 170, z0: -99.5, z1: -12.8, shop: { s: true } },
  { x0: -170, x1: -107.5, z0: 12.8, z1: 49.5, shop: { n: true } },
  { x0: -92.5, x1: -9.5, z0: 12.8, z1: 49.5, shop: { n: true } },
  { x0: 9.5, x1: 91.5, z0: 12.8, z1: 49.5, shop: { n: true } },
  { x0: 108.5, x1: 170, z0: 12.8, z1: 49.5, shop: { n: true } },
  { x0: -170, x1: -9.5, z0: 79, z1: 110.5, shop: { s: true } },
  { x0: 9.5, x1: 91.5, z0: 79, z1: 110.5, shop: { s: true } },
  { x0: 108.5, x1: 170, z0: 79, z1: 110.5, shop: { s: true } },
];
// per-district identity: Balat = tall narrow colourful houses, Galata / Karaköy = stone and cream, Kadıköy pier = pastel low-rise
const DIST = {
  balat: { wall: [0xe8836f, 0xf2c14e, 0x5fb3a5, 0xd9677e, 0x7fa6d6, 0xe9a35c, 0xa0522d, 0xc46a45, 0xb98ad1, 0xf08a4b], roof: [0xb5503a, 0x7a6a8a, 0x8a5a44, 0x4f6b8a], floors: [4, 4, 5, 5, 6], wMin: 5.2, wMax: 8, gable: 0.85 },
  galata: { wall: [0xdcd0b8, 0xd8c3a0, 0xcdbf9f, 0xa0522d, 0xc2b79d, 0xd6a878, 0xb5623f], roof: [0x8a8f99, 0x6b7280, 0x9a8a78], floors: [4, 5, 5, 6], wMin: 9, wMax: 14, gable: 0.18 },
  kadikoy: { wall: [0xf7d6d0, 0xd6ecd9, 0xd3e3f6, 0xfbeec2, 0xe7d6f3, 0xf9e0c4], roof: [0xd9835f, 0xc1583c, 0x9bb7d4], floors: [2, 2, 3], wMin: 7, wMax: 12, gable: 0.75 },
};
function districtAt(x, z) {
  if (z > 62) return x < 20 ? DIST.galata : DIST.kadikoy;
  if (x < -55) return DIST.balat;
  if (x < 45) return DIST.galata;
  return null;   // Beşiktaş keeps the mixed palette
}
function buildBlock(b) {
  const w = b.x1 - b.x0, d = b.z1 - b.z0;
  const dN = Math.min(wr(11, 15), d * 0.46), dS = Math.min(wr(11, 15), d * 0.46), dW = Math.min(wr(10, 14), w * 0.46), dE = Math.min(wr(10, 14), w * 0.46);
  const posAt = (side, a) => side === 'n' ? [a, b.z0] : side === 's' ? [a, b.z1] : side === 'w' ? [b.x0, a] : [b.x1, a];
  const row = (side, a0, a1, fn) => {
    let a = a0;
    while (a < a1 - 2.5) {
      const D = districtAt(...posAt(side, a));
      let ww = Math.min(D ? wr(D.wMin, D.wMax) : wr(7, 13), a1 - a); if (a1 - (a + ww) < 5) ww = a1 - a;
      fn(a, a + ww, D); a += ww;
    }
  };
  const sh = (k) => b.shop[k] !== undefined ? b.shop[k] : false;
  row('n', b.x0, b.x1, (a0, a1, D) => building(a0, b.z0, a1, b.z0 + dN, 0, -1, sh('n'), { dist: D }));
  row('s', b.x0, b.x1, (a0, a1, D) => building(a0, b.z1 - dS, a1, b.z1, 0, 1, sh('s'), { dist: D }));
  row('w', b.z0 + dN, b.z1 - dS, (a0, a1, D) => building(b.x0, a0, b.x0 + dW, a1, -1, 0, sh('w'), { dist: D }));
  row('e', b.z0 + dN, b.z1 - dS, (a0, a1, D) => building(b.x1 - dE, a0, b.x1, a1, 1, 0, sh('e'), { dist: D }));
  const ix0 = b.x0 + dW, ix1 = b.x1 - dE, iz0 = b.z0 + dN, iz1 = b.z1 - dS;
  if (ix1 - ix0 > 5 && iz1 - iz0 > 5) building(ix0, iz0, ix1, iz1, 0, 1, false, { plain: true, floors: wpick([4, 5, 6]), dist: districtAt((ix0 + ix1) / 2, (iz0 + iz1) / 2) });
}
/** three small stalls with striped awnings and bakery / tea / simit signs beside stops (merged into the static meshes) */
function stopStalls() {
  for (const [key, cell] of [['balat', 1], ['karakoy', 2], ['iskele', 5]]) {
    const d = STOPDEF.B.find(q => q.key === key); if (!d) continue;
    const y = hillH(d.sx, d.sz), cx = d.sx + d.hx * 7 + d.rx * 0.9, cz = d.sz + d.hz * 7 + d.rz * 0.9, ry = Math.atan2(d.hx, d.hz);
    mStatic.box(cx, y + 1.45, cz, 1.4, 2.9, 3.2, 0xefe3c9, ry);
    mStatic.box(cx, y + 2.97, cz, 1.6, 0.14, 3.4, 0xc1583c, ry);
    shopFront(cx - d.rx * 0.7, cz - d.rz * 0.7, -d.rx, -d.rz, 3.2, y, cell);
    const ex = Math.abs(d.hx) > 0.5 ? 1.7 : 0.8, ez = Math.abs(d.hx) > 0.5 ? 0.8 : 1.7;
    obBox(cx - ex, cz - ez, cx + ex, cz + ez);
    WORLD.shelters.push({ x: cx, z: cz, hx: d.hx, hz: d.hz });   // keeps trees, lamps and parked cars away
  }
}
/** flat puddles on the lanes: invisible and not drawn while it is dry, they fade in with the rain */
function buildPuddles() {
  const M = new Mesher(false, 0), rnd = mulberry(31337);
  for (const r of ROADS) {
    if (r.virtual) continue;
    const iv = crossIntervals(r);
    for (let t = r.t0 + 8; t < r.t1 - 8; t += 11 + rnd() * 9) {
      if (inAny(t, iv, 4)) continue;
      if (!r.horiz && (r.id === 'v0' || r.id === 'v2') && t > 46 && t < 84) continue;
      const lat = (rnd() < 0.5 ? -1 : 1) * (r.lane + (rnd() - 0.5) * 1.6), rx = 0.9 + rnd() * 1.3, rz = 0.6 + rnd() * 0.8, rot = rnd() * Math.PI, n = 9;
      const cx = r.horiz ? t : r.a[0] + lat, cz = r.horiz ? r.a[1] + lat : t, cy = yAt(cx, cz) + 0.085;
      const P = a => [cx + Math.cos(a) * rx * Math.cos(rot) - Math.sin(a) * rz * Math.sin(rot), cy, cz + Math.cos(a) * rx * Math.sin(rot) + Math.sin(a) * rz * Math.cos(rot)];
      for (let k = 0; k < n; k++) M.tri([cx, cy, cz], P((k + 1) / n * TAU), P(k / n * TAU), 0xcfe0ee, rnd);
    }
  }
  return M.build();
}
function buildProps() {
  // trees and lamps along roads
  const stopSpots = WORLD.shelters;
  for (const r of ROADS) {
    if (r.virtual) continue;
    const iv = crossIntervals(r), ax = r.horiz ? 0 : 1, lo = r.t0, hi = r.t1;
    let k = 0;
    for (let t = lo + 10; t < hi - 8; t += 18, k++) {
      if (inAny(t, iv, 3)) continue;
      if (!r.horiz && (r.id === 'v0' || r.id === 'v2') && t > 46 && t < 84) continue;
      for (const side of [-1, 1]) {
        const lat = side * (r.h + 0.9), x = r.horiz ? t : r.a[0] + lat, z = r.horiz ? r.a[1] + lat : t;
        if (r.id === 'v0' && z > -83 && z < -11 && Math.abs(x) < 8) { /* plaza section, lamps ok */ }
        if (stopSpots.some(s => hyp(s.x - x, s.z - z) < 5.5)) continue;
        if (inZebra(x, z, 4)) continue;
        if (((k + (side > 0 ? 1 : 0)) & 1) === 0) lampPost(x, z, r.horiz ? 0 : -side, r.horiz ? -side : 0);
        else if (r.id !== 'main' || (k % 3 === 0)) {
          const tl = side * (r.h + 2.7), tx = r.horiz ? t : r.a[0] + tl, tz = r.horiz ? r.a[1] + tl : t;
          if (!stopSpots.some(s => hyp(s.x - tx, s.z - tz) < 5.5) && !inZebra(tx, tz, 4)) tree(tx, tz, wr(0.85, 1.15), WR() < 0.2 ? 1 : 0);
        }
      }
    }
  }
  // parked cars on the narrow streets (half on the pavement)
  for (const r of ROADS) {
    if (!r.narrow) continue;
    const iv = crossIntervals(r);
    for (let t = r.t0 + 16; t < r.t1 - 16; t += wr(11, 17)) {
      if (inAny(t, iv, 6)) continue;
      const side = WR() < 0.5 ? -1 : 1, lat = side * (r.h + 0.6);
      const x = r.horiz ? t : r.a[0] + lat, z = r.horiz ? r.a[1] + lat : t;
      if (WORLD.shelters.some(s => hyp(s.x - x, s.z - z) < 8) || inZebra(x, z, 4)) continue;
      parkedCar(x, z, r.horiz ? Math.PI / 2 : 0);
    }
  }
  // a few cars parked along the main street shops
  for (const [x, z] of [[-65, 7.3], [-30, -7.3], [35, 7.3], [75, -7.3], [-125, 7.3], [125, -7.3], [-20, -8.6]]) if (!inZebra(x, z, 3) && !WORLD.shelters.some(s => hyp(s.x - x, s.z - z) < 8)) parkedCar(x, z, Math.PI / 2);
  // park next to the sea road + along the promenade
  for (let i = 0; i < 26; i++) { const x = wr(-160, -70), z = wr(114, 126); tree(x, z, wr(0.9, 1.3), WR() < 0.25 ? 1 : 0); }
  for (let x = -150; x < -72; x += 14) bench(x, 129, 0);
  for (let x = -40; x < 150; x += 24) bench(x, 130.6, 0);
  for (let x = -166; x < 166; x += 12) if (Math.abs(x) > 12 && Math.abs(x - 100) > 12) { tree(x, wr(52, 54.5), wr(0.8, 1), 1); }
  // plaza: mosque, fountain, trees, benches, vendors
  buildMosque(-14, -62);
  const fz = -58, fx = 16;
  mStatic.cyl(fx, yAt(fx, fz), fz, 3.2, 3.0, 0.7, 12, 0xd6cdbd); mStatic.cyl(fx, yAt(fx, fz) + 0.5, fz, 2.7, 2.7, 0.15, 12, 0x7fd0f0);
  mStatic.cyl(fx, yAt(fx, fz), fz, 0.5, 0.35, 2.0, 8, 0xd6cdbd); mStatic.cyl(fx, yAt(fx, fz) + 1.6, fz, 1.3, 0.4, 0.4, 8, 0xd6cdbd);
  mStatic.sphere(fx, yAt(fx, fz) + 2.3, fz, 0.35, 0.35, 0.35, 6, 4, 0x9fe0ff);
  obCirc(fx, fz, 3.3);
  for (const [x, z] of [[-30, -17], [30, -17], [-30, -76], [30, -76], [-3.5, -17], [3.5, -17], [26, -35], [-26, -35], [8, -76], [-33, -45], [33, -45], [-2, -48]]) {
    if (Math.abs(x) < 4 && Math.abs(z + 45) < 4) continue; tree(x, z, wr(0.9, 1.2), WR() < 0.3 ? 1 : 0);
  }
  for (const [x, z, ry] of [[10, -50, 0], [22, -50, 0], [10, -66, 0], [22, -66, 0], [-26, -22, Math.PI / 2], [26, -22, Math.PI / 2], [-26, -40, 0], [26, -40, 0]]) bench(x, z, ry);
  // vendors: simit cart (red) and chestnut seller (dark)
  vendorCart(27, -28, 0xc0392b, true); vendorCart(-27, -28, 0x4b3a2f, false);
  vendorCart(52, -34.2 + 0, 0xc0392b, true);
  // lamps in the plaza
  for (const [x, z] of [[-18, -20], [18, -20], [-18, -40], [18, -40], [-30, -60], [30, -60], [-8, -76], [8, -76]]) lampPost(x, z, 0, 1);
  // signal poles
  for (const ap of APPROACHES) buildSignalHead(ap);
  // far skyline + hills ring (outside the playable area)
  buildFar();
}
function inZebra(x, z, pad) {
  for (const zc of ZEBRAS) {
    const hx = zc.dir === 'z' ? 1.2 + pad : zc.half + pad, hz = zc.dir === 'z' ? zc.half + pad : 1.2 + pad;
    if (Math.abs(x - zc.x) < hx && Math.abs(z - zc.z) < hz) return true;
  }
  return false;
}
function vendorCart(x, z, col, simit) {
  const y = hillH(x, z);
  mProp.boxB(x, y + 0.5, z, 1.7, 0.8, 1.0, col); mProp.boxB(x, y + 1.3, z, 1.6, 0.6, 0.9, simit ? 0x9fd6e8 : 0x2b2b2b);
  mProp.cyl(x - 0.7, y + 0.3, z - 0.6, 0.32, 0.32, 0.1, 8, 0x2b2b2b); mProp.cyl(x + 0.7, y + 0.3, z - 0.6, 0.32, 0.32, 0.1, 8, 0x2b2b2b);
  if (simit) {
    mProp.cyl(x, y + 1.9, z, 0.05, 0.05, 1.3, 5, 0x3d4350);
    for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU; mProp.tri([x, y + 3.5, z], [x + Math.cos(a1) * 1.9, y + 3.0, z + Math.sin(a1) * 1.9], [x + Math.cos(a0) * 1.9, y + 3.0, z + Math.sin(a0) * 1.9], i & 1 ? 0xe5484d : 0xfff3e0); }
    for (let i = 0; i < 4; i++) mProp.cyl(x - 0.6 + i * 0.4, y + 1.6, z, 0.17, 0.17, 0.08, 7, 0xd9902f);
  } else {
    mProp.cyl(x + 0.5, y + 1.6, z, 0.12, 0.1, 1.0, 6, 0x3d4350);
  }
  // vendor (static person, facing the cart)
  mProp.cyl(x, y, z + 1.0, 0.26, 0.2, 1.15, 7, simit ? 0x2f5f8f : 0x6b4a32); mProp.sphere(x, y + 1.45, z + 1.0, 0.19, 0.19, 0.19, 6, 4, 0xe6b48f);
  mProp.cyl(x, y + 1.55, z + 1.0, 0.2, 0.2, 0.12, 7, simit ? 0xf0e6d2 : 0x3a3a3a);
  WORLD.carts.push({ x, y, z, simit });
  obBox(x - 1.0, z - 0.7, x + 1.0, z + 1.4);
  WORLD.vendors.push({ x, z, y, smoke: !simit });
}
function buildMosque(cx, cz) {
  const y = yAt(cx, cz);
  mStatic.boxB(cx, y - 0.6, cz, 18, 10, 18, 0xf3ead6);
  mStatic.boxB(cx, y + 9.4, cz, 18.6, 0.5, 18.6, 0xe2d6bb);
  mStatic.sphere(cx, y + 9.9, cz, 7.6, 6.2, 7.6, 14, 7, 0x9fb2c7, 0, Math.PI / 2);
  mStatic.cyl(cx, y + 16.0, cz, 0.12, 0.05, 2.4, 6, 0xd9b44a); mStatic.sphere(cx, y + 17.2, cz, 0.35, 0.35, 0.35, 6, 4, 0xd9b44a);
  for (const [dx, dz] of [[-6.6, -6.6], [6.6, -6.6], [-6.6, 6.6], [6.6, 6.6]]) mStatic.sphere(cx + dx, y + 9.7, cz + dz, 2.6, 2.4, 2.6, 8, 4, 0xaabbd0, 0, Math.PI / 2);
  // portico + arches (south side faces the plaza)
  mStatic.boxB(cx, y - 0.4, cz + 10.5, 11, 5.2, 3.2, 0xefe3c9); mStatic.boxB(cx, y + 4.8, cz + 10.5, 11.4, 0.4, 3.6, 0xd9c9a8);
  for (let i = -2; i <= 2; i++) facadeQuad(mStatic, cx, cz + 12.1, 0, 1, i * 2.1, 1.5, y, y + 3.2, 0x40505f, 0.04);
  facadeQuad(mStatic, cx, cz + 9, 0, 1, 0, 14, y + 6.4, y + 8.6, 0x3f6b86, 0.05);
  for (const sx of [-1, 1]) for (const f of [0, 1, 2]) { facadeQuad(mWinL, cx + sx * 9, cz, sx, 0, (f - 1) * 5, 1.4, y + 3.4, y + 6.6, 0xffffff, 0.05); }
  for (let i = -2; i <= 2; i++) facadeQuad(mWinL, cx, cz - 9, 0, -1, i * 3, 1.4, y + 3.4, y + 6.6, 0xffffff, 0.05);
  obBox(cx - 9, cz - 9, cx + 9, cz + 9); obBox(cx - 5.5, cz + 9, cx + 5.5, cz + 12.2);
  for (const [mx, mz] of [[cx - 12.5, cz - 8], [cx - 12.5, cz + 8]]) {
    const my = yAt(mx, mz);
    mStatic.cyl(mx, my, mz, 1.5, 1.3, 1.5, 8, 0xefe3c9); mStatic.cyl(mx, my + 1.5, mz, 0.8, 0.7, 19, 10, 0xf6eedc);
    mStatic.cyl(mx, my + 14.0, mz, 1.35, 1.35, 0.35, 10, 0xd9c9a8); mStatic.cyl(mx, my + 19.0, mz, 1.15, 1.0, 0.35, 10, 0xd9c9a8);
    mStatic.cyl(mx, my + 20.5, mz, 0.95, 0.05, 4.4, 10, 0x9fb2c7); mStatic.sphere(mx, my + 25.2, mz, 0.3, 0.3, 0.3, 5, 3, 0xd9b44a);
    obCirc(mx, mz, 1.6);
  }
}
function buildSignalHead(ap) {
  const x = ap.ox, z = ap.oz, y = hillH(x, z) + 0.14;
  mStatic.cyl(x, y, z, 0.07, 0.07, 4.6, 6, 0x3d4350);
  // head housing faces the approaching driver (opposite to travel direction)
  const fx = -ap.dx, fz = -ap.dz;
  const yawv = Math.atan2(fx, fz);
  mStatic.box(x + fx * 0.05, y + 4.0, z + fz * 0.05, 0.45, 1.25, 0.35, 0x252a33, yawv);
  mStatic.box(x + fx * 0.16, y + 4.0, z + fz * 0.16, 0.3, 1.05, 0.05, 0x14171d, yawv);
  const cols = [[0xff3b30, 4.45], [0xffcc00, 4.0], [0x34c759, 3.55]];
  const heads = [];
  cols.forEach(([c, hh]) => { heads.push({ x: x + fx * 0.22, y: y + hh, z: z + fz * 0.22, c }); });
  WORLD.sigHeads.push({ ap, lamps: heads });
  obCirc(x, z, 0.2);
}
function buildFar() {
  const rnd = mulberry(99);
  for (let i = 0; i < 90; i++) {
    const side = rnd(), x = side < 0.3 ? -(200 + rnd() * 140) : side < 0.6 ? 200 + rnd() * 140 : (rnd() - 0.5) * 360, z = side < 0.6 ? -150 + rnd() * 300 - 30 : -(150 + rnd() * 200);
    if (z > 125 && Math.abs(x) < 200) continue;
    const w = 14 + rnd() * 26, h = 10 + rnd() * 26, col = [0xcdbfae, 0xd8b6a0, 0xb8c6d4, 0xe0d4b8, 0xc8a99a][Math.floor(rnd() * 5)];
    mStatic.boxB(x, -0.2, z, w, h, w * (0.7 + rnd() * 0.6), col);
    if (rnd() < 0.5) mStatic.gable(x, z, w, w * 0.8, h - 0.2, 4 + rnd() * 3, 0xb5503a, col);
  }
  for (let i = 0; i < 6; i++) { // distant mosques
    const x = (i < 3 ? -1 : 1) * (230 + rnd() * 70), z = -120 - rnd() * 140;
    mStatic.boxB(x, -0.2, z, 24, 16, 24, 0xe8dfc9); mStatic.sphere(x, 15.6, z, 11, 9, 11, 10, 5, 0xa9b9cc, 0, Math.PI / 2);
    for (const d of [-16, 16]) { mStatic.cyl(x + d, -0.2, z + 14, 1.2, 1.0, 36, 8, 0xf4ecdb); mStatic.cyl(x + d, 35.8, z + 14, 1.1, 0.05, 8, 8, 0x9fb2c7); }
  }
  for (let i = 0; i < 14; i++) { // green hills ring
    const a = Math.PI + rnd() * Math.PI, rad = 380 + rnd() * 120, x = Math.cos(a) * rad * 1.2, z = Math.sin(a) * rad * 0.9 - 40;
    mStatic.cyl(x, -2, z, 90 + rnd() * 90, 25, 40 + rnd() * 50, 8, [0x7ea86a, 0x8fb274, 0x6e9b62][Math.floor(rnd() * 3)]);
  }
  // a Galata-Tower-like silhouette on the far northern skyline (stone drum, gallery, conical cap) with a few houses at its feet
  {
    const tx = -70, tz = -255, y0 = -0.2;
    mStatic.cyl(tx, y0, tz, 6.6, 6.0, 46, 12, 0xd7cbb1); mStatic.cyl(tx, y0 + 46, tz, 8.3, 8.3, 2.2, 12, 0xb9ac8f);
    mStatic.cyl(tx, y0 + 48.2, tz, 6.3, 6.3, 7, 12, 0xe0d5bd); mStatic.cyl(tx, y0 + 55.2, tz, 8.0, 0.1, 13, 12, 0x6b7280);
    for (let k = 0; k < 7; k++) { const ang = k / 7 * TAU + 0.4, rad = 20 + (k % 3) * 7; mStatic.boxB(tx + Math.cos(ang) * rad, y0, tz + Math.sin(ang) * rad, 12 + (k % 2) * 5, 9 + (k % 3) * 4, 12, [0xe8836f, 0xf2c14e, 0xdcd0b8, 0xd9677e][k % 4]); }
  }
  // outer ground
  const gcol = 0xa6c476, oy = -0.02;
  const quad = (x0, z0, x1, z1) => mStatic.quadTo([x0, oy, z0], [x1, oy, z0], [x1, oy, z1], [x0, oy, z1], gcol, 0, 1, 0);
  quad(-700, -700, 700, -135); quad(-700, -135, -190, 140); quad(190, -135, 700, 140);
}

// ---------------- stops from routes
const STOPDEF = {};   // per route key: array of stop objects (geometry only)
function stopGeometry(routeKey, key, cx, cz) {
  const P = PATHS[routeKey], pr = projectOnPath(P, cx, cz), a = pathAt(P, pr.s, { x: 0, z: 0, hx: 0, hz: 1, i: 0 });
  const rx = -a.hz, rz = a.hx;
  const rd = roadAt(cx, cz, 0.5), toCurb = rd ? rd.h - rd.lane : 2.2;
  return { key, s: pr.s, x: a.x + rx * 1.1, z: a.z + rz * 1.1, hx: a.hx, hz: a.hz, rx, rz, sx: a.x + rx * (toCurb + 1.5), sz: a.z + rz * (toCurb + 1.5), cx, cz, off: pr.d };
}
(function computeStops() {
  const seen = new Set();
  for (const rk of ['A', 'B', 'C']) {
    STOPDEF[rk] = ROUTE_STOPS[rk].map(([k, x, z]) => stopGeometry(rk, k, x, z));
    for (const s of STOPDEF[rk]) { const id = Math.round(s.sx) + ',' + Math.round(s.sz); if (!seen.has(id)) { seen.add(id); WORLD.shelters.push({ x: s.sx, z: s.sz, hx: s.hx, hz: s.hz }); } }
  }
})();

function buildWorldGeometry(stage) {
  switch (stage) {
    case 0: WORLD.groundGeo = buildGroundMesh(); break;
    case 1: buildRoads(); break;
    case 2: BLOCKS.forEach(buildBlock); break;
    case 3: WR = mulberry(777); buildBridgesAndWalls(); for (const s of WORLD.shelters) shelterAt(s.x, s.z, s.hx, s.hz); stopStalls(); buildProps(); break;
    case 4:
      WORLD.staticGeo = mStatic.build(); WORLD.propGeo = mProp.build(); WORLD.parkGeo = mPark.build(); WORLD.roadGeo = mRoad.build(); WORLD.winLGeo = mWinL.build(); WORLD.winDGeo = mWinD.build(); WORLD.signGeo = mSign.build(); WORLD.decorGeos = [...DEC_CH.values()].map(m => m.build()); WORLD.neonGeo = mNeon.build(); WORLD.ferryGeo = buildFerry(); WORLD.puddleGeo = buildPuddles();
      break;
  }
}

// ---------------------------------------------------------------- simulation state
const HOOK = { toast() { }, float() { }, bubble() { }, snd() { }, shake() { }, hurt() { }, levelEnd() { } };
/** arena-kit "reduce motion": no camera shake, a soft hurt vignette, markers stop pulsing. Read live (visual layer only, the sim never reads it). */
const calm = () => !!(window.Arena && Arena.settings && Arena.settings.reducedMotion);
const CAR_COLS = [0xd94f4f, 0x3d7fc4, 0xe8e2d0, 0x39393f, 0x7a9d5a, 0xe0a030, 0x8c8f99, 0xf2f2f2, 0x7a4fb5, 0x2f9e9a, 0xe27b3b];
const SKINS = [0xf0c8a0, 0xe0ac80, 0xc68b5e, 0x8d5a3a, 0xf5d6b5];
const SHIRTS = [0xe5484d, 0x2b8cc4, 0x3fae6a, 0xf2a33a, 0x7a4fb5, 0xf0e6d2, 0x2d3b55, 0xd1568b, 0x56b3a8, 0x9aa3ad];
// Cosmetic rng: passenger types, voices, drop-off spots and thank-you lines use it, never the gameplay rng R, so adding
// flavour does not change how a seeded shift plays out.
let CR = mulberry(4711);
const cpick = arr => arr[Math.floor(CR() * arr.length)];
// every passenger type has its own shirts (all taken from SHIRTS) and body scale
const PTYPES = {
  student: { shirts: [0x2b8cc4, 0x7a4fb5, 0x56b3a8, 0xd1568b], scale: [0.86, 0.95] },
  grandmother: { shirts: [0x9aa3ad, 0x7a4fb5, 0xf0e6d2], scale: [0.82, 0.88] },
  shopkeeper: { shirts: [0x3fae6a, 0xf2a33a, 0xf0e6d2], scale: [0.95, 1.05] },
  tourist: { shirts: [0xe5484d, 0xf2a33a, 0x56b3a8, 0xd1568b], scale: [1.0, 1.12] },
  commuter: { shirts: [0x2d3b55, 0x9aa3ad, 0x2b8cc4], scale: [0.98, 1.08] },
};
const PTYPE_KEYS = Object.keys(PTYPES);
function styleByType(p) { const ty = PTYPES[p.ptype]; p.shirt = cpick(ty.shirts); p.scale = ty.scale[0] + CR() * (ty.scale[1] - ty.scale[0]); }

// ---- Hat Ustası (Route Master): before a shift the player picks 3 of the level's stops and a radio channel.
// Route stops gather riders faster (HAT_ON) and the others slower (HAT_OFF). The channel weights the passenger
// type mix toward the types it attracts; each type has its own patience / tip / fare behaviour (PTRAIT), and
// seated riders drain patience slower when they like the channel and faster when they dislike it (mood icon on
// the seat chip). Channel 'off' with no stops is the classic shift and plays exactly as before.
const PTRAIT = {
  student: { pat: 0.72, tip: 0.6, fare: 0.85 }, grandmother: { pat: 1.35, tip: 0.75, fare: 1 }, shopkeeper: { pat: 1.15, tip: 1.4, fare: 1 },
  tourist: { pat: 0.85, tip: 1.5, fare: 1.1 }, commuter: { pat: 0.75, tip: 1, fare: 1.15 },
};
const CHANNELS = {
  off: { mix: null, dislike: null, rate: 1 },
  arabesk: { mix: { shopkeeper: 4 }, dislike: 'tourist', rate: 1 },
  pop: { mix: { student: 3, tourist: 2 }, dislike: 'grandmother', rate: 0.85 },
  haber: { mix: { commuter: 4 }, dislike: 'student', rate: 0.9 },
  turku: { mix: { grandmother: 4 }, dislike: 'commuter', rate: 1.1 },
};
const CH_KEYS = Object.keys(CHANNELS);
const HAT_ON = 1.6, HAT_OFF = 0.8;                  // stop spawn-timer speed on / off the chosen route
const MOOD_PAT = { like: 1.15, dislike: 0.8 }, MOOD_DRAIN = { like: 0.8, dislike: 1.25 };
const FUEL_TL_M = 0.06, IDLE_TL_S = 0.25;           // route profit: fuel per metre driven, cost per second idling in traffic
const KEY_HAT = 'dolmus.hat';                        // { [level id]: { profit, stops: [keys], ch } } best route per level
let PLAN = { stops: [], ch: 'off' };                 // the player's current choice (kept between shifts)
const planFits = lv => !!lv && !lv.endless && lv.id >= 2;   // level 1 (coached) and endless shifts keep the classic rules
/** stop keys of a level in route order (same as makeStops) */
function levelStopKeys(lv) { let defs = STOPDEF[lv.route].slice(); if (lv.stops) defs = defs.filter(d => lv.stops.includes(d.key)); return defs.sort((a, b) => a.s - b.s).map(d => d.key); }
/** the plan a shift really uses: the player's choice where it fits the level, else classic */
function planFor(lv) {
  if (!planFits(lv)) return { stops: [], ch: 'off' };
  const keys = levelStopKeys(lv), stops = PLAN.stops.filter(k => keys.includes(k));
  return { stops: stops.length === 3 ? stops : [], ch: CHANNELS[PLAN.ch] ? PLAN.ch : 'off' };
}
/** passenger type: one CR draw, like cpick, so the classic shift keeps its exact random stream */
function pickPtype() {
  const mix = SIM.plan && CHANNELS[SIM.plan.ch].mix;
  if (!mix) return cpick(PTYPE_KEYS);
  let tot = 0; for (const k of PTYPE_KEYS) tot += mix[k] || 1;
  let r = CR() * tot; for (const k of PTYPE_KEYS) { r -= mix[k] || 1; if (r < 0) return k; }
  return PTYPE_KEYS[PTYPE_KEYS.length - 1];
}
/** 'like' | 'dislike' | '' for a passenger type under the current channel */
function moodOf(ptype) {
  const ch = SIM.plan && CHANNELS[SIM.plan.ch]; if (!ch || !ch.mix) return '';
  return ch.mix[ptype] ? 'like' : ch.dislike === ptype ? 'dislike' : '';
}
const radioOn = () => !!(SIM.plan && SIM.plan.ch !== 'off');
/** patience multiplier for a new waiting passenger (type trait x mood); 1 with the radio off */
function patMul(ptype) { if (!radioOn()) return 1; const m = moodOf(ptype); return PTRAIT[ptype].pat * (m ? MOOD_PAT[m] : 1); }
function stopRate(st) { const h = SIM.plan && SIM.plan.stops; return h && h.length ? (h.includes(st.key) ? HAT_ON : HAT_OFF) : 1; }
const SIM = {
  lv: null, lvIdx: 0, t: 0, hour: 8, rain: 0, rainTarget: 0, jam: false, running: false, over: false, overKind: '',
  cars: [], peds: [], stops: [], hailers: [], pigeons: [], tram: null, van: null, nextId: 1,
  score: null, route: null, stopDefs: null, rs: 0,
  nextHail: 10, nextVip: [], vipDone: 0, flags: {}, hornT: 0, honkT: 5, ferryT: 30,
};
const player = {
  x: 0, z: 0, hd: 0, vx: 0, vz: 0, steer: 0, y: 0, pitch: 0, roll: 0, ax: 0, load: 0, dent: 0, speed: 0, vf: 0, vl: 0,
  door: { state: 'closed', t: 0 }, stopReq: false, seats: [], boarding: 0, hornOn: false, brakeFlag: 0, hitT: 0, skid: 0, thr: 0,
  brkHold: 0, hardT: 0,   // brake pedal hold time (s) for the ramp, time spent above the hard-brake limit (s)
  routeS: 0, nearStop: -1, actT: 0, wheel: 0, lastPen: 0, redT: 0, camHd: 0, chain: [], anyDrop: false,
};
const input = { throttle: 0, brake: 0, steer: 0, door: false, horn: false };
const AG = [];   // dynamic collision circles (reused in place to avoid per-frame GC allocations)
let agN = 0;
function pushAgent(x, z, r, kind, owner) {
  let a = AG[agN];
  if (!a) { a = { x, z, r, kind, owner }; AG[agN] = a; }
  else { a.x = x; a.z = z; a.r = r; a.kind = kind; a.owner = owner; }
  agN++;
}
const PLAYER_CIRCLES = [-1.7, 0, 1.7];
const CAR_GAP_LOOKS = [1.2, 2.5, 3.6, 5, 7.5, 12, 17, 24];
let AG_BY_CELL = null;

// ---------------------------------------------------------------- AI vehicles
const VEH = {
  car: { len: 4.3, circles: [-1.2, 1.2], r: 1.05 }, bus: { len: 11.5, circles: [-4.4, -2.2, 0, 2.2, 4.4], r: 1.4 }, van: { len: 5.6, circles: [-1.4, 1.4], r: 1.2 },
};
function addCar(kind, pathKey, s, opts = {}) {
  const path = PATHS[pathKey], def = VEH[kind];
  const c = {
    id: SIM.nextId++, kind, path, s, v: 0, len: def.len, def, vk: 0.8 + R() * 0.2, col: kind === 'bus' ? 0xe85d3a : kind === 'van' ? 0xf4f4f0 : pick(CAR_COLS),
    x: 0, z: 0, hx: 0, hz: 1, ghost: 0, stuck: 0, hitT: 0, dwell: 0, stopList: null, nextStop: 0, mode: 'cruise', timer: 0, hazard: false, y: 0, pitch: 0, gap: 1e9, gapKind: '',
  };
  Object.assign(c, opts); pathAt(path, s, _pp); c.x = _pp.x; c.z = _pp.z; c.hx = _pp.hx; c.hz = _pp.hz;
  SIM.cars.push(c); return c;
}
const _tp = { x: 0, z: 0, hx: 0, hz: 1, i: 0 };
function fwdDist(L, from, to) { let d = (to - from) % L; if (d < 0) d += L; return d; }
function carGap(c) {
  const P = c.path, L = P.L;
  let gap = 1e9, kind = '';
  // traffic lights
  for (const li of P.lights) {
    let d = fwdDist(L, c.s, li.s);
    if (d > L - 3) d -= L;
    const dd = d - c.len / 2;
    if (dd < -1.0 || dd > 48) continue;
    const st = sigState(SIGNALS[li.ap.sig], li.ap.axis);
    if (st === 'r' || (st === 'y' && dd > c.v * c.v / (2 * 4.0) + 1.5)) { if (dd < gap) { gap = Math.max(dd, 0.2); kind = 'light'; } }
  }
  // dynamic agents ahead along the path
  const lead = c.len / 2;
  for (const k of CAR_GAP_LOOKS) {
    if (k - 1.0 >= gap) break;
    pathAt(P, c.s + lead + k, _tp);
    for (let i = 0; i < AG.length; i++) {
      const a = AG[i]; if (a.owner === c) continue;
      const dx = a.x - _tp.x, dz = a.z - _tp.z, rr = a.r + 1.15;
      if (dx * dx + dz * dz > rr * rr) continue;
      if (a.kind === 'car') {
        if (c.ghost > 0) continue;
        const o = a.owner, same = o.hx * c.hx + o.hz * c.hz > 0.6;
        if (!same && o.id > c.id) continue;
      }
      gap = k - 1.0; kind = a.kind; break;
    }
    if (kind && kind !== 'light') break;
  }
  // scheduled stop (bus stop / double parking)
  if (c.stopTarget !== undefined && c.stopTarget !== null) {
    const d = fwdDist(L, c.s, c.stopTarget);
    if (d < 70) { if (d < gap) { gap = d; kind = 'stop'; } c.stopDist = d; } else c.stopDist = 1e9;
  }
  c.gap = gap; c.gapKind = kind;
  return gap;
}
function updateCar(c, dt) {
  const P = c.path;
  if (c.hitT > 0) { c.hitT -= dt; c.v = Math.max(0, c.v - 14 * dt); }
  else {
    const gap = carGap(c);
    let vd = pathV(P, c.s + 4) * c.vk;
    if (SIM.jam && Math.abs(c.x) < 85 && Math.abs(c.z) < 24) vd = Math.min(vd, 2.0);
    if (c.kind === 'bus') vd *= 0.85;
    const minGap = c.gapKind === 'stop' ? 0.0 : 1.4;
    let vt = vd;
    if (gap < 1e8) vt = Math.min(vt, Math.sqrt(2 * 5.0 * Math.max(gap - minGap, 0)));
    if (c.dwell > 0) vt = 0;
    const acc = c.kind === 'bus' ? 1.6 : 2.6;
    c.v += clamp(vt - c.v, -8 * dt, acc * dt);
    if (c.v < 0.02 && vt === 0) c.v = 0;
    c.s += c.v * dt;
    // stuck breaker
    if (c.v < 0.3 && gap < 8 && c.gapKind === 'car' || c.gapKind === 'ped') c.stuck += dt; else c.stuck = 0;
    if (c.stuck > 14) { c.ghost = 4; c.stuck = 0; }
    if (c.ghost > 0) c.ghost -= dt;
    // scheduled stops
    if (c.stopTarget !== undefined && c.stopTarget !== null && c.stopDist < 1.2 && c.v < 0.5 && c.dwell <= 0) {
      if (c.kind === 'bus') { c.dwell = 6.5; c.stopTarget = c.stopList[(c.nextStop = (c.nextStop + 1) % c.stopList.length)]; }
      else if (c.kind === 'van') { c.dwell = 24 + R() * 6; c.hazard = true; c.stopTarget = null; c.mode = 'parked'; HOOK.vanParked && HOOK.vanParked(c); }
    }
    if (c.dwell > 0) {
      c.dwell -= dt;
      if (c.dwell <= 0 && c.kind === 'van') { c.hazard = false; c.mode = 'cruise'; c.timer = 35 + R() * 25; }
    }
    if (c.kind === 'van' && c.mode === 'cruise' && c.dwell <= 0) {
      c.timer -= dt;
      if (c.timer <= 0 && c.stopTarget === null) {
        const cand = c.parkSpots, ahead = cand.filter(s => { const d = fwdDist(P.L, c.s, s); return d > 60 && d < 260; });
        if (ahead.length) c.stopTarget = ahead[Math.floor(R() * ahead.length)]; else c.timer = 5;
      }
    }
  }
  pathAt(P, c.s, _tp); c.x = _tp.x; c.z = _tp.z; c.hx = _tp.hx; c.hz = _tp.hz;
  c.y = yAt(c.x, c.z);
  const f = c.len * 0.4; c.pitch = Math.atan2(yAt(c.x + c.hx * f, c.z + c.hz * f) - yAt(c.x - c.hx * f, c.z - c.hz * f), 2 * f);
}
function spawnTraffic(lv) {
  SIM.cars.length = 0;
  const rings = ['rB', 'B', 'g', 'rg', 'h', 'rh'], counts = new Array(rings.length).fill(0);
  const n = lv.cars;
  for (let i = 0; i < n; i++) counts[i % rings.length]++;
  const startPos = { x: player.x, z: player.z };
  rings.forEach((rk, ri) => {
    const P = PATHS[rk], k = counts[ri];
    for (let i = 0; i < k; i++) {
      for (let tries = 0; tries < 30; tries++) {
        const s = ((i + R() * 0.8) / k) * P.L; pathAt(P, s, _tp);
        if (hyp(_tp.x - startPos.x, _tp.z - startPos.z) < 35) continue;
        if (SIM.cars.some(o => hyp(o.x - _tp.x, o.z - _tp.z) < 9)) continue;
        // not inside an intersection box with a stop line right ahead: fine, they just stop
        addCar('car', rk, s); break;
      }
    }
  });
  for (let b = 0; b < lv.bus; b++) {
    const rk = b === 0 ? 'B' : 'C', P = PATHS[rk], defs = STOPDEF[rk];
    const list = defs.filter((_, i) => i % 2 === (b === 0 ? 1 : 0)).map(d => d.s).sort((a, c) => a - c);
    const s = P.L * (b === 0 ? 0.62 : 0.25);
    const bus = addCar('bus', rk, s, { stopList: list, nextStop: 0, vk: 0.95 });
    let bi = list.findIndex(x => x > s); if (bi < 0) bi = 0; bus.nextStop = bi; bus.stopTarget = list[bi];
  }
  if (lv.van) {
    const P = PATHS.rB, spots = [];
    for (let i = 0; i < P.N; i += 2) if (Math.abs(P.Z[i] - 5) < 0.3 && P.X[i] > -85 && P.X[i] < -22 && Math.abs(P.HX[i] - 1) < 0.05) spots.push(i * P.ds);
    const van = addCar('van', 'rB', P.L * 0.05, { parkSpots: spots, stopTarget: null, mode: 'cruise', timer: 22 + R() * 15, vk: 0.9 });
    SIM.van = van;
  } else SIM.van = null;
}

// ---------------------------------------------------------------- tram
function newTram() { return { x: -130, dir: 1, v: 0, dwell: 0, len: 22.4, lane: 1.6, mode: 'run', turn: 0, z: 1.6, bell: 0, lastPlat: '' }; }
const TRAM_STOPS = [-50, 60];
function updateTram(tr, dt) {
  const dir = tr.dir, front = tr.x + dir * tr.len / 2;
  let gap = 1e9;
  // signals
  for (let i = 0; i < SIGNALS.length; i++) {
    const s = SIGNALS[i], lx = dir > 0 ? s.x - (s.hz + STOP_OFF) : s.x + (s.hz + STOP_OFF), d = (lx - front) * dir;
    if (d < -0.8 || d > 40) continue;
    const st = sigState(s, 'x');
    if (st === 'r' || (st === 'y' && d > tr.v * tr.v / (2 * 3) + 2)) gap = Math.min(gap, Math.max(d, 0.1));
  }
  // platforms: stop with the centre on the platform
  for (const px of TRAM_STOPS) {
    const d = (px - tr.x) * dir, key = px + '|' + dir;
    if (key === tr.lastPlat) continue;
    if (d > 0.3 && d < 60) gap = Math.min(gap, d);
    if (Math.abs(d) < 1.0 && tr.v < 0.5 && tr.dwell <= 0) { tr.dwell = 6; tr.lastPlat = key; HOOK.tramStop && HOOK.tramStop(tr); }
  }
  // anything in front
  for (const k of [4, 9, 15]) {
    const fx = front + dir * k;
    for (const a of AG) { if (a.owner === tr || a.kind === 'ped') continue; if (Math.abs(a.z - tr.z) < 1.9 + a.r * 0.6 && (a.x - fx) * (a.x - fx) < 9 && (a.x - front) * dir > 0) { gap = Math.min(gap, k - 2); if (tr.bell <= 0) { tr.bell = 3; HOOK.snd('bell'); } } }
  }
  if (tr.turn > 0) { tr.turn -= dt; tr.v = 0; if (tr.turn <= 0) { tr.lastPlat = ''; tr.dir = -dir; tr.lane = tr.dir > 0 ? 1.6 : -1.6; tr.z = tr.lane; } }
  else {
    let vt = 9;
    if (gap < 1e8) vt = Math.min(vt, Math.sqrt(2 * 2.2 * Math.max(gap - 0.3, 0)));
    if (tr.dwell > 0) { tr.dwell -= dt; vt = 0; if (tr.dwell <= 0) { tr.bell = 0; HOOK.snd('bell'); } }
    tr.v += clamp(vt - tr.v, -3 * dt, 1.1 * dt);
    tr.x += dir * tr.v * dt;
    if ((tr.x > 134 && dir > 0) || (tr.x < -134 && dir < 0)) tr.turn = 4;
  }
  tr.bell -= dt;
  tr.y = yAt(tr.x, tr.z);
}

// ---------------------------------------------------------------- pedestrians
function newPed(kind, x, z, o = {}) {
  const p = Object.assign({
    id: SIM.nextId++, kind, x, z, hd: 0, st: 'idle', t: 0, shirt: pick(SHIRTS), skin: pick(SKINS), wave: false, ph: R() * 6.28, spd: 0, alive: true,
    y: 0, tx: x, tz: z, scale: 0.92 + R() * 0.2, hit: 0,
  }, o);
  SIM.peds.push(p); return p;
}
const pedOnRoad = (x, z) => !!roadAt(x, z, -0.3);
function zebraEnds(zc) { return zc.dir === 'z' ? [[zc.x, zc.z - zc.half], [zc.x, zc.z + zc.half]] : [[zc.x - zc.half, zc.z], [zc.x + zc.half, zc.z]]; }
function zebraFree(zc) {
  const R2 = zc.sig >= 0 ? 12 : 24;
  if (zc.sig >= 0) {
    const S = SIGNALS[zc.sig];
    if (sigState(S, zc.block) !== 'r') return false;
    const ttg = sigTimeToGreen(S, zc.block);
    if (ttg <= (2 * zc.half) / 1.7 + 1.8) return false;
  }
  for (const a of AG) {
    if (a.kind === 'ped' || a.kind === 'tram') continue;
    if (Math.abs(a.x - zc.x) < R2 && Math.abs(a.z - zc.z) < R2) { const sp = a.owner === player ? Math.abs(player.speed) : (a.owner.v || 0); if (sp > 0.8) return false; }
  }
  return true;
}
function spawnPeds(lv) {
  SIM.peds.length = 0;
  // zebra crossers
  const zs = ZEBRAS.slice().sort(() => R() - 0.5);
  let n = 0;
  for (const zc of zs) {
    if (n >= lv.peds) break;
    const [e0, e1] = zebraEnds(zc), end = R() < 0.5 ? 0 : 1, e = end ? e1 : e0, j = (R() - 0.5) * 1.8;
    const x = e[0] + (zc.dir === 'z' ? j : 0), z = e[1] + (zc.dir === 'x' ? j : 0);
    newPed('cross', x, z, { zc, end, j, st: 'wait', t: R() * 6 }); n++;
  }
  // pavement strollers
  let tries = 0, made = 0;
  while (made < Math.round(lv.peds * 0.75) && tries++ < 200) {
    const r = ROADS[Math.floor(R() * 6)];
    if (r.virtual) continue;
    const side = R() < 0.5 ? -1 : 1, lat = side * (r.h + 1.7);
    const lo = r.t0 + 6, hi = r.t1 - 6, t0 = lo + R() * (hi - lo), len = 14 + R() * 30, t1 = Math.min(hi, t0 + len);
    const iv = crossIntervals(r);
    let ok = t1 - t0 > 10;
    for (let t = t0; t <= t1 && ok; t += 3) {
      const x = r.horiz ? t : r.a[0] + lat, z = r.horiz ? r.a[1] + lat : t;
      if (inAny(t, iv, 1) || inZebra(x, z, 2.5) || WORLD.shelters.some(s => hyp(s.x - x, s.z - z) < 4) || (r.id === 'v0' || r.id === 'v2') && t > 46 && t < 84) ok = false;
    }
    if (!ok) continue;
    const a = r.horiz ? [t0, r.a[1] + lat] : [r.a[0] + lat, t0], b = r.horiz ? [t1, r.a[1] + lat] : [r.a[0] + lat, t1];
    newPed('walk', a[0], a[1], { a, b, toB: true, spd: 1.0 + R() * 0.5, st: 'walk', pause: 0 }); made++;
  }
  // plaza strollers
  for (const [ax, az, bx, bz] of [[-31, -20, -31, -74], [31, -20, 31, -74], [-30, -78, 30, -78], [-20, -17, 20, -17], [-8, -30, 8, -30]]) {
    if (R() < 0.7) newPed('walk', ax, az, { a: [ax, az], b: [bx, bz], toB: true, spd: 0.8 + R() * 0.4, st: 'walk', pause: 0 });
  }
}
function updatePeds(dt) {
  const peds = SIM.peds;
  for (let i = peds.length - 1; i >= 0; i--) {
    const p = peds[i];
    if (p.hit > 0) {
      p.hit -= dt; p.x += p.hvx * dt; p.z += p.hvz * dt; p.hvx *= 0.92; p.hvz *= 0.92;
      if (p.hit <= 0 && p.kind === 'cross') { const e = zebraEnds(p.zc)[p.end]; p.x = e[0]; p.z = e[1]; p.st = 'wait'; p.t = 3; }
      continue;
    }
    p.ph += dt * 6.5;
    if (p.kind === 'cross') {
      if (p.st === 'wait') {
        p.t -= dt; p.spd = 0;
        if (p.t <= 0 && zebraFree(p.zc)) { p.st = 'go'; }
      } else if (p.st === 'go') {
        const e = zebraEnds(p.zc)[1 - p.end], tx = e[0] + (p.zc.dir === 'z' ? p.j : 0), tz = e[1] + (p.zc.dir === 'x' ? p.j : 0);
        const dx = tx - p.x, dz = tz - p.z, d = hyp(dx, dz);
        p.spd = 1.7;
        if (d < 0.3) { p.end = 1 - p.end; p.st = 'wait'; p.t = 3 + R() * 7; p.spd = 0; }
        else { p.x += dx / d * 1.7 * dt; p.z += dz / d * 1.7 * dt; p.hd = Math.atan2(dx, dz); }
      }
    } else if (p.kind === 'walk') {
      if (p.pause > 0) { p.pause -= dt; p.spd = 0; continue; }
      const T = p.toB ? p.b : p.a, dx = T[0] - p.x, dz = T[1] - p.z, d = hyp(dx, dz);
      if (d < 0.25) { p.toB = !p.toB; p.pause = 1 + R() * 5; }
      else { p.x += dx / d * p.spd * dt; p.z += dz / d * p.spd * dt; p.hd = Math.atan2(dx, dz); }
    } else if (p.kind === 'board') {
      // walk to the dolmuş door, then board
      const door = doorPos(), dx = door.x - p.x, dz = door.z - p.z, d = hyp(dx, dz);
      p.t += dt; p.spd = 2.0;
      if (d < 0.6 || p.t > 3.5) { finishBoard(p); peds.splice(i, 1); continue; }
      p.x += dx / d * 2.0 * dt; p.z += dz / d * 2.0 * dt; p.hd = Math.atan2(dx, dz);
    } else if (p.kind === 'alight') {
      p.t += dt; p.spd = 1.6;
      const dx = p.tx - p.x, dz = p.tz - p.z, d = hyp(dx, dz);
      if (d > 0.3) { p.x += dx / d * 1.6 * dt; p.z += dz / d * 1.6 * dt; p.hd = Math.atan2(dx, dz); } else { p.spd = 0; }
      if (p.t > 6) { peds.splice(i, 1); continue; }
    } else if (p.kind === 'pax' || p.kind === 'hail') {
      p.spd = 0;
      const dpx = p.x - player.x, dpz = p.z - player.z, dd = hyp(dpx, dpz);
      p.wave = dd < 42 && p.st !== 'left';
      p.pat -= dt * (dd > 130 ? 0.4 : 1);
      if (p.st === 'left') {
        p.t += dt; const dx = p.tx - p.x, dz = p.tz - p.z, d = hyp(dx, dz); p.spd = 1.7;
        if (d > 0.3) { p.x += dx / d * 1.7 * dt; p.z += dz / d * 1.7 * dt; p.hd = Math.atan2(dx, dz); }
        if (p.t > 5) { peds.splice(i, 1); continue; }
        continue;
      }
      if (p.pat <= 0) { givesUp(p); continue; }
    }
  }
}

// ---------------------------------------------------------------- pigeons
function spawnPigeons() {
  SIM.pigeons.length = 0;
  for (let i = 0; i < 16; i++) {
    const x = -10 + R() * 40 - 10, z = -70 + R() * 40;
    SIM.pigeons.push({ x, z, tx: x, tz: z, hd: R() * 6.28, st: 'peck', t: R() * 3, fly: 0, fy: 0, ph: R() * 6 });
  }
}
function updatePigeons(dt) {
  for (const b of SIM.pigeons) {
    b.ph += dt * 8;
    const d = hyp(b.x - player.x, b.z - player.z);
    if (b.st !== 'fly' && (d < 9 + player.speed * 0.25 && player.speed > 0.5 || (player.hornOn && d < 22))) {
      b.st = 'fly'; b.fly = 0; b.t = 1.4 + R() * 0.8;
      const a = R() * TAU, r = 10 + R() * 14; b.tx = clamp(b.x + Math.cos(a) * r, -30, 30); b.tz = clamp(b.z + Math.sin(a) * r, -76, -18);
      b.hd = Math.atan2(b.tx - b.x, b.tz - b.z); b.x0 = b.x; b.z0 = b.z;
    }
    if (b.st === 'fly') {
      b.fly += dt; const u = Math.min(1, b.fly / b.t);
      b.x = b.x0 + (b.tx - b.x0) * u; b.z = b.z0 + (b.tz - b.z0) * u; b.fy = Math.sin(u * Math.PI) * 3.2;
      if (u >= 1) { b.st = 'peck'; b.fy = 0; b.t = 1 + R() * 3; }
    } else {
      b.t -= dt;
      if (b.t <= 0) {
        if (b.st === 'peck') { b.st = 'walk'; b.t = 1 + R() * 2; const a = R() * TAU; b.tx = clamp(b.x + Math.cos(a) * 2, -33, 33); b.tz = clamp(b.z + Math.sin(a) * 2, -79, -15); b.hd = Math.atan2(b.tx - b.x, b.tz - b.z); }
        else { b.st = 'peck'; b.t = 1 + R() * 3; }
      }
      if (b.st === 'walk') { const dx = b.tx - b.x, dz = b.tz - b.z, dd = hyp(dx, dz); if (dd > 0.1) { b.x += dx / dd * 0.7 * dt; b.z += dz / dd * 0.7 * dt; } }
    }
  }
}

// ---------------------------------------------------------------- agent circles (for collisions / AI)
function buildAgents() {
  agN = 0;
  for (const c of SIM.cars) for (const o of c.def.circles) pushAgent(c.x + c.hx * o, c.z + c.hz * o, c.def.r, 'car', c);
  const tr = SIM.tram;
  if (tr) for (let o = -tr.len / 2 + 1.3; o <= tr.len / 2 - 1.2; o += 2.6) pushAgent(tr.x + tr.dir * o, tr.z, 1.4, 'tram', tr);
  const fx = Math.sin(player.hd), fz = Math.cos(player.hd);
  for (const o of PLAYER_CIRCLES) pushAgent(player.x + fx * o, player.z + fz * o, 1.12, 'player', player);
  for (const p of SIM.peds) if (p.kind === 'cross' && p.st === 'go') pushAgent(p.x, p.z, 0.45, 'ped', p);
  AG.length = agN;
}

// ---------------------------------------------------------------- scoring, stops and passengers
let SC = null;
const netScore = () => SC.fares + SC.tips - SC.pen;
const SHIFT = 240;
const SEATS = 12;
function newScore() { return { fares: 0, tips: 0, pen: 0, pass: 0, hits: 0, reds: 0, brakes: 0, skips: 0, gaveUp: 0, ped: 0, badStop: 0, tipsLost: 0, tipsLostN: 0, anyDrops: 0, bestTip: 0, cost: {}, dist: 0, idle: 0 }; }
function logEv(kind, extra) { if (typeof G !== 'undefined') { G.events.push(Object.assign({ t: +SIM.t.toFixed(1), kind, x: +player.x.toFixed(1), z: +player.z.toFixed(1), v: +player.speed.toFixed(1) }, extra || {})); if (G.events.length > 300) G.events.shift(); } }
/** every penalty shows its reason as a toast; extra args fill {1}, {2}… of the message */
function penalize(amount, msgKey, kind, ...args) {
  logEv(kind, { amount });
  SC.pen += amount; SC[kind] = (SC[kind] || 0) + 1; SC.cost[kind] = (SC.cost[kind] || 0) + amount;
  HOOK.toast(t(msgKey, amount, ...args), 'bad'); HOOK.float('-' + amount, true); HOOK.snd('bad');
}
function rough() { for (const s of player.seats) s.smooth = false; }
const rightOf = (hx, hz) => ({ x: -hz, z: hx });
function doorPos() { const fx = Math.sin(player.hd), fz = Math.cos(player.hd); return { x: player.x - Math.cos(player.hd) * 1.45 + fx * 0.9, z: player.z + Math.sin(player.hd) * 1.45 + fz * 0.9 }; }

function makeStops(lv) {
  let defs = STOPDEF[lv.route].slice();
  if (lv.stops) defs = defs.filter(d => lv.stops.includes(d.key));
  defs.sort((a, b) => a.s - b.s);
  SIM.stops = defs.map((d, i) => ({ idx: i, key: d.key, def: d, wait: [], timer: lv.pInt * rr(0.2, 1.0) }));
}
function standSpot(stop, k) {
  const d = stop.def, off = -1.7 + (k % 5) * 0.8 + (k >= 5 ? 0.4 : 0), lat = k >= 5 ? -0.5 : 0;
  return { x: d.sx - d.rx * (0.9 + lat) + d.hx * off, z: d.sz - d.rz * (0.9 + lat) + d.hz * off };
}
function spawnPax(stop, vip = false) {
  const maxW = SIM.rain > 0.5 ? 6 : 4;
  if (stop.wait.length >= maxW && !vip) return null;
  let k = 0; while (stop.wait.some(p => p.slot === k)) k++;
  const sp = standSpot(stop, k), d = stop.def;
  const pat = SIM.lv.pat * rr(0.8, 1.2) * (SIM.rain > 0.5 ? 0.8 : 1) * (vip ? 0.8 : 1);
  const p = newPed('pax', sp.x, sp.z, { st: 'wait', stop: stop.idx, slot: k, pat, patMax: pat, vip, hd: Math.atan2(d.rx, d.rz), shirt: vip ? 0xFACC15 : pick(SHIRTS), scale: vip ? 1.12 : 0.92 + R() * 0.2 });
  if (vip) p.ptype = 'commuter'; else { p.ptype = pickPtype(); styleByType(p); const m = patMul(p.ptype); p.pat *= m; p.patMax *= m; }
  stop.wait.push(p); return p;
}
function spawnHailer(ahead) {
  const P = SIM.route;
  for (let tries = 0; tries < 40; tries++) {
    const s = ahead ? (player.routeS + 45 + R() * 190) % P.L : R() * P.L; pathAt(P, s, _tp);
    const r = roadAt(_tp.x, _tp.z, 0.6); if (!r || r.virtual) continue;
    if (SIM.stops.some(st => Math.abs(fwdDist(P.L, st.def.s, s)) < 28 || fwdDist(P.L, s, st.def.s) < 24)) continue;
    const rt = rightOf(_tp.hx, _tp.hz), toCurb = r.h - r.lane, x = _tp.x + rt.x * (toCurb + 1.1), z = _tp.z + rt.z * (toCurb + 1.1);
    if (inZebra(x, z, 4) || (r.id === 'v0' || r.id === 'v2') && z > 44 && z < 86) continue;
    if (CROSS.some(c => hyp(c.x - x, c.z - z) < 20)) continue;
    if (SIM.hailers.some(h => hyp(h.x - x, h.z - z) < 30)) continue;
    if (hyp(x - player.x, z - player.z) < 25) continue;
    // previous stop index
    let from = -1; for (const st of SIM.stops) if (st.def.s <= s) from = st.idx;
    if (from < 0) from = SIM.stops.length - 1;
    const pat = SIM.lv.pat * rr(0.8, 1.1) * (SIM.rain > 0.5 ? 0.8 : 1);
    const h = newPed('hail', x, z, { st: 'wait', from, s, pat, patMax: pat, hd: Math.atan2(rt.x, rt.z), hail: true });
    h.ptype = pickPtype(); styleByType(h); { const m = patMul(h.ptype); h.pat *= m; h.patMax *= m; }
    SIM.hailers.push(h); return h;
  }
  return null;
}
function removeWaiting(p) {
  if (p.kind === 'hail') { const i = SIM.hailers.indexOf(p); if (i >= 0) SIM.hailers.splice(i, 1); }
  else { const st = SIM.stops[p.stop]; if (st) { const i = st.wait.indexOf(p); if (i >= 0) st.wait.splice(i, 1); } }
}
function givesUp(p) {
  removeWaiting(p); p.st = 'left'; p.t = 0; p.wave = false;
  const rt = rightOf(Math.cos(p.hd + Math.PI / 2), 0); p.tx = p.x + Math.sin(p.hd + 1.2) * 8; p.tz = p.z + Math.cos(p.hd + 1.2) * 8;
  if (p.kind === 'pax' || p.kind === 'hail') { p.kind = p.kind === 'pax' ? 'pax' : 'hail'; }
  penalize(1, 'penLeft', 'gaveUp');
}
function nearestBusiness(maxD = 13) {
  // returns {stop, hail, drop[], wait[]} for the area around the dolmuş
  let best = null, bd = 1e9;
  for (const st of SIM.stops) { const d = hyp(st.def.x - player.x, st.def.z - player.z); if (d < maxD && d < bd) { bd = d; best = st; } }
  const out = { stop: best, drop: [], wait: [], hail: [] };
  if (best) {
    out.drop = player.seats.filter(s => s.dest === best.idx);
    out.wait = best.wait.filter(p => p.st === 'wait');
  }
  for (const h of SIM.hailers) if (h.st === 'wait' && hyp(h.x - player.x, h.z - player.z) < maxD - 3) out.hail.push(h);
  return out;
}
function hasBusiness() {
  const b = nearestBusiness();
  return b.drop.length > 0 || ((b.wait.length > 0 || b.hail.length > 0) && player.seats.length + player.boarding < SEATS);
}
function startBoard(p) {
  removeWaiting(p);
  p.kind = 'board'; p.st = 'board'; p.t = 0; p.wave = false; player.boarding++;
}
function finishBoard(p) {
  player.boarding = Math.max(0, player.boarding - 1);
  const n = SIM.stops.length, from = p.from !== undefined ? p.from : p.stop;
  const dest = (from + 1 + Math.floor(R() * Math.min(4, n - 1))) % n;
  const dst = SIM.stops[dest];
  const boardS = p.s !== undefined ? p.s : SIM.stops[from].def.s, dist = Math.max(60, fwdDist(SIM.route.L, boardS, dst.def.s));
  const expT = dist / 8 + 10;
  const seat = { shirt: p.shirt, skin: p.skin, dest, vip: p.vip, dist, boardT: SIM.t, expT, smooth: true, ridePat: p.patMax * 0.9 + expT * 0.6, ridePatMax: p.patMax * 0.9 + expT * 0.6, scale: p.scale, missedPass: false, seatIdx: freeSeatIdx(), ptype: p.ptype || 'commuter', any: !p.vip && SIM.lv.id >= 2 && CR() < 0.34 };
  seat.mood = p.vip ? '' : moodOf(seat.ptype);   // how this rider feels about the radio channel (seat chip icon, patience drain)
  player.seats.push(seat);
  HOOK.snd('pop');
  const txt = p.vip ? t('bubVip', stopName(dst.key)) : seat.mood ? t('bubMood', cpick(t(seat.mood === 'like' ? 'moodLike' : 'moodDislike')), stopName(dst.key)) : voiceLine(seat, stopName(dst.key));   // mood riders still say their stop (same single cpick, CR stream unchanged)
  HOOK.bubble(txt);
  if (p.vip) HOOK.toast(t('vipAboard'), 'info');
}
// no-repeat window: a line cannot come back until 12 other lines were used (24 lines per language)
const VOICE_WINDOW = 12, voiceRecent = [];
function voiceLine(seat, name) {
  const V = (STR[LANG] && STR[LANG].voice) || STR.en.voice, own = seat.any ? 'any' : seat.ptype;
  const ids = k => V[k].map((_, i) => k + ':' + i);
  let c = ids(own).filter(id => !voiceRecent.includes(id));
  if (!c.length) c = Object.keys(V).flatMap(ids).filter(id => !voiceRecent.includes(id));
  const id = cpick(c); voiceRecent.push(id); if (voiceRecent.length > VOICE_WINDOW) voiceRecent.shift();
  const [k, i] = id.split(':');
  (G.voices || (G.voices = [])).push(id); if (G.voices.length > 400) G.voices.shift();   // QA: which lines were spoken, in order
  return V[k][+i].replace('{0}', name);
}
function freeSeatIdx() { for (let i = 0; i < SEATS; i++) if (!player.seats.some(s => s.seatIdx === i)) return i; return 0; }
const HOP_T = 0.25, ANY_RANGE = 70;   // seconds per hop of the fare chain; metres before or after the stop where an "anywhere" rider may get off
function alight(seat, stopIdx, opts = {}) {
  const P = player, i = P.seats.indexOf(seat); if (i < 0) return;
  P.seats.splice(i, 1);
  const base = Math.round(6 + seat.dist / 28);
  const tr = radioOn() && !seat.vip ? PTRAIT[seat.ptype] : null;   // passenger type behaviour applies with the radio on
  let fare = seat.vip ? base * 3 + 10 : tr ? Math.round(base * tr.fare) : base;
  if (opts.early > 0) fare = Math.max(1, Math.round(fare * clamp(1 - opts.early / Math.max(seat.dist, 60), 0.7, 1)));   // got off before the stop: shorter ride
  let tip = 0, easy = 0;
  const ride = SIM.t - seat.boardT;
  if (seat.ridePat > 0) {
    const speedy = ride <= seat.expT * 1.15 ? 0.4 : (ride <= seat.expT * 1.5 ? 0.15 : 0), smooth = seat.smooth ? 0.3 : 0;
    tip = Math.round(fare * (speedy + smooth) * clamp(seat.ridePat / seat.ridePatMax * 1.4, 0.3, 1) * (seat.vip ? 1.5 : 1) * (tr ? tr.tip : 1));
  }
  const got = seat.ridePat > 0 ? fare : Math.round(fare * 0.6);
  if (opts.any) {
    SC.anyDrops++;
    if (opts.bad) { tip = 0; penalize(4, opts.badWhy ? 'penBadStop_' + opts.badWhy : 'penBadStop', 'badStop', opts.badDist); HOOK.honk && HOOK.honk(); }   // too close to a crossing or junction
    else easy = seat.vip ? 3 : 2;                                                                  // safe curb: small "easy stop" tip
  }
  // the fare is passed forward along the occupied seats (0.25 s per hop) and credited when the coin reaches the driver
  const row = seat.seatIdx >> 1;
  const ahead = P.seats.filter(q => (q.seatIdx >> 1) > row).sort((a, b) => a.seatIdx - b.seatIdx).map(q => q.seatIdx).slice(0, 6);
  P.chain.push({ got, tip, easy, path: [seat.seatIdx, ...ahead, 12], t: 0, dur: (ahead.length + 1) * HOP_T });
  logEv('alight', { atStop: !opts.any, any: !!opts.any, bad: !!opts.bad, stop: stopIdx, fare: got, tip: tip + easy });
  const st = SIM.stops[stopIdx], door = doorPos();
  let tx, tz;
  if (opts.any) { const rt = rightOf(Math.sin(P.hd), Math.cos(P.hd)), side = 3 + CR() * 2.5, along = (CR() - 0.5) * 3; tx = door.x + rt.x * side + Math.sin(P.hd) * along; tz = door.z + rt.z * side + Math.cos(P.hd) * along; }
  else { const d = st.def, sp = standSpot(st, Math.floor(R() * 5)); tx = sp.x + d.hx * rr(-3, 3); tz = sp.z + d.hz * rr(-3, 3); }
  newPed('alight', door.x, door.z, { st: 'alight', tx, tz, shirt: seat.shirt, skin: seat.skin, hd: P.hd, t: 0, scale: seat.scale });
}
function landCoin(c) {
  const tot = (c.tip || 0) + (c.easy || 0);
  if (!SC) SC = newScore();
  SC.fares += (c.got || 0); SC.tips += tot; SC.pass++;
  if (tot > SC.bestTip) SC.bestTip = tot;
  HOOK.float('+' + ((c.got || 0) + tot), false); HOOK.snd('coin'); HOOK.sparkle && HOOK.sparkle();
  // Camera micro-shake on fare collection; extra noticeable when earning a tip
  if (HOOK.shake) HOOK.shake(tot > 0 ? 0.48 : 0.22);
  // Short haptic feedback via navigator.vibrate([30, 20, 30]) if supported
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([30, 20, 30]); } catch (e) { /* ignore */ }
  }
  logEv('coin', { amount: c.got || 0, tip: tot });
  if (c.tip > 0) HOOK.toast(t('tipAdd', c.tip) + ' · ' + cpick(t('thx')), 'good');
  if (c.easy > 0) HOOK.toast(t('easyStop', c.easy), 'good');
}
function updateChain(dt) {
  const ch = player.chain;
  for (let i = ch.length - 1; i >= 0; i--) { const c = ch[i]; c.t += dt; if (c.t >= c.dur) { ch.splice(i, 1); landCoin(c); } }
}
/** the player left (door forced shut, or drove off) before the chain ended: the fares still arrive, the tips are lost */
function forfeitChain() {
  const ch = player.chain.splice(0);
  for (const c of ch) {
    const lost = c.tip + c.easy; c.tip = 0; c.easy = 0; landCoin(c);
    if (lost > 0) {
      SC.tipsLost += lost; SC.tipsLostN++; SC.cost.tipsLost = (SC.cost.tipsLost || 0) + lost;
      logEv('tipLost', { amount: lost }); HOOK.float('-' + lost, true); HOOK.toast(t('tipLost', lost), 'bad'); HOOK.snd('bad');
    }
  }
}

// ---- "anywhere" riders: they may get off at any legal curb spot within ANY_RANGE metres (path distance) of their stop
function anywhereRiders() {
  const P = player, L = SIM.route.L, out = [];
  for (const sEat of P.seats) {
    if (!sEat.any) continue;
    let d = fwdDist(L, P.routeS, SIM.stops[sEat.dest].def.s); if (d > L / 2) d -= L;
    if (Math.abs(d) <= ANY_RANGE) out.push({ seat: sEat, early: Math.max(0, d) });
  }
  return out;
}
function distToRect(x, z, cx, cz, hx, hz) { return Math.hypot(Math.max(Math.abs(x - cx) - hx, 0), Math.max(Math.abs(z - cz) - hz, 0)); }
const _cp = { x: 0, z: 0, hx: 0, hz: 1, i: 0 };
const BAD_ZEBRA = 9, BAD_JUNC = 10;   // metres: closer than this to a zebra / junction box is an unsafe drop-off
/** can riders get off where the dolmuş stands? { ok, why, honk } when refused, { ok, bad } when allowed (bad = close to a crossing or junction) */
function curbCheck() {
  const P = player, fx = Math.sin(P.hd), fz = Math.cos(P.hd), road = roadAt(P.x, P.z, 0.5);
  if (!road) return { ok: false, why: 'curb' };
  if ((road.id === 'v0' || road.id === 'v2') && P.z > 49 && P.z < 81) return { ok: false, why: 'bridge' };
  if (road.id === 'main' && Math.abs(P.z) < 3.4) return { ok: false, why: 'lane', honk: true };      // tram tracks
  const pr = projectOnPath(SIM.route, P.x, P.z, P.routeS, 40); pathAt(SIM.route, pr.s, _cp);
  const lat = (P.x - _cp.x) * -_cp.hz + (P.z - _cp.z) * _cp.hx;                                       // + = right of the lane centre
  if (pr.d > 3.2 || lat < -1.3) return { ok: false, why: 'lane', honk: true };                          // standing in the oncoming lane
  let nearZ = 1e9, nearJ = 1e9;
  for (const o of [-2.4, 0, 2.4]) {
    const x = P.x + fx * o, z = P.z + fz * o;
    for (const zc of ZEBRAS) nearZ = Math.min(nearZ, distToRect(x, z, zc.x, zc.z, zc.dir === 'z' ? 1.2 : zc.half, zc.dir === 'z' ? zc.half : 1.2));
    for (const c of CROSS) nearJ = Math.min(nearJ, distToRect(x, z, c.x, c.z, c.V.h, c.H.h));
  }
  if (nearZ < 1.6) return { ok: false, why: 'zebra' };
  if (nearJ < 1.5) return { ok: false, why: 'junction', honk: true };
  for (const ap of APPROACHES) {                                                                      // queue zone in front of a signal
    if (fx * ap.dx + fz * ap.dz < 0.5) continue;
    const al = ap.axis === 'x' ? (ap.lx - P.x) * ap.dx : (ap.lz - P.z) * ap.dz;
    const lat2 = ap.axis === 'x' ? P.z > ap.lz0 - 2 && P.z < ap.lz1 + 2 : P.x > ap.lx0 - 2 && P.x < ap.lx1 + 2;
    if (al > -1 && al < 22 && lat2) return { ok: false, why: 'signal', honk: true };
  }
  // allowed, but too close to a crossing (< BAD_ZEBRA m) or junction (< BAD_JUNC m): no tip and a penalty; the curb marker shows it in amber
  const badZ = nearZ < BAD_ZEBRA, badJ = nearJ < BAD_JUNC, why = badZ && (!badJ || nearZ - BAD_ZEBRA < nearJ - BAD_JUNC) ? 'zebra' : badJ ? 'junction' : null;
  return { ok: true, bad: !!why, badWhy: why, badDist: why ? Math.max(1, Math.round(why === 'zebra' ? nearZ : nearJ)) : 0 };
}
function curbRefuse(chk) {
  HOOK.toast(t('anyNo_' + chk.why), 'bad'); HOOK.snd('bad');
  if (chk.honk && HOOK.honk) HOOK.honk();
  logEv('anyRefused', { why: chk.why });
}

// ---------------------------------------------------------------- player vehicle
function resetPlayer(lv) {
  const P = SIM.route, s0 = (SIM.stops[0].def.s - 34 + P.L) % P.L;
  pathAt(P, s0, _tp);
  Object.assign(player, { x: _tp.x, z: _tp.z, hd: Math.atan2(_tp.hx, _tp.hz), vx: 0, vz: 0, steer: 0, speed: 0, vf: 0, vl: 0, dent: 0, seats: [], boarding: 0, stopReq: false, hornOn: false, hitT: 0, redT: 0, thr: 0, skid: 0, load: 0, chain: [], anyDrop: false, brkHold: 0, hardT: 0, brakeFlag: 0 });
  player.door.state = 'closed'; player.door.t = 0; player.camHd = player.hd; player.routeS = s0; player.y = yAt(player.x, player.z);
}
// ---- brakes: the service brake builds up while the pedal is held, like a real air-braked minibus.
// A tap slows gently (BRAKE_A0); holding it reaches full braking (BRAKE_A1) after BRAKE_RAMP seconds.
// Analog input (gamepad trigger, a half-pressed pedal) scales the whole curve proportionally.
const BRAKE_A0 = 4, BRAKE_A1 = 13, BRAKE_RAMP = 0.8;
/** forward deceleration (m/s², positive) for brake input brk (0..1) held for hold seconds */
function brakeDecel(brk, hold) { return brk * lerp(BRAKE_A0, BRAKE_A1, clamp(hold / BRAKE_RAMP, 0, 1)); }
// hard braking with passengers aboard costs money only when it is sustained (HARD_T s above HARD_DEC)
// and nothing ahead justifies it: an emergency stop for a pedestrian, a vehicle or a red light is free.
const HARD_DEC = 10.2, HARD_T = 0.3;
/** is there a reason to brake hard ahead? pedestrian, vehicle or a red / yellow light within ~2 s of travel */
function brakeHazard() {
  const P = player, fx = Math.sin(P.hd), fz = Math.cos(P.hd), v = Math.max(P.vf, 0);
  const reach = 8 + v * 2.0;                                  // front bumper is ~2.6 m ahead of the centre
  const inPath = (x, z, r) => {
    const al = (x - P.x) * fx + (z - P.z) * fz, lat = (x - P.x) * -fz + (z - P.z) * fx;
    return al > 0 && al < reach + 2.6 && Math.abs(lat) < 1.6 + r;
  };
  for (const a of AG) if (a.kind !== 'player' && inPath(a.x, a.z, a.r)) return a.kind === 'ped' ? 'ped' : 'car';
  for (const p of SIM.peds) if (p.hit <= 0 && (p.kind === 'cross' || p.kind === 'walk' || p.kind === 'alight') && inPath(p.x, p.z, 0.5)) return 'ped';
  for (const ap of APPROACHES) {
    if (fx * ap.dx + fz * ap.dz < 0.7) continue;               // only stop lines we are driving towards
    const al = ap.axis === 'x' ? (ap.lx - P.x) * ap.dx : (ap.lz - P.z) * ap.dz;
    const lat = ap.axis === 'x' ? P.z > ap.lz0 - 1 && P.z < ap.lz1 + 1 : P.x > ap.lx0 - 1 && P.x < ap.lx1 + 1;
    if (lat && al > -1 && al < reach + 2.6 && sigState(SIGNALS[ap.sig], ap.axis) !== 'g') return 'light';
  }
  return null;
}
function updatePlayer(dt) {
  const P = player, fx = Math.sin(P.hd), fz = Math.cos(P.hd), rx = -fz, rz = fx;
  let vf = P.vx * fx + P.vz * fz, vl = P.vx * rx + P.vz * rz;
  const wet = SIM.rain, load = P.seats.length / SEATS;
  P.load = load;
  const vmaxF = 19 * (1 - 0.1 * load) * (P.dent > 70 ? 0.9 : 1), vmaxR = 5;
  // door / stop assist
  const ds = P.door.state;
  let thr = input.throttle, brk = input.brake;
  if (P.stopReq) {
    if (thr > 0.5 && Math.abs(vf) > 0.5) P.stopReq = false; // driver changes their mind
    else { thr = 0; brk = 0; }
  }
  if (ds === 'opening' || ds === 'open' || ds === 'closing') { if (Math.abs(vf) > 2.2) closeDoor(true); }
  // steering
  P.steer += (input.steer - P.steer) * clamp(dt * 7.5, 0, 1);
  const maxAng = lerp(0.62, 0.15, clamp(Math.abs(vf) / 17, 0, 1));
  const delta = P.steer * maxAng;
  // longitudinal
  let a = 0;
  const slope = (yAt(P.x + fx * 1.6, P.z + fz * 1.6) - yAt(P.x - fx * 1.6, P.z - fz * 1.6)) / 3.2;
  if (thr > 0) {
    if (vf > -0.3) a += 5.9 * (1 - 0.4 * load) * thr * clamp(1 - vf / vmaxF, 0, 1);
    else a += 12 * thr;
  }
  if (brk > 0.02 && vf > 0.5) P.brkHold += dt; else P.brkHold = 0;   // ramp restarts each time the pedal is released
  if (brk > 0) {
    if (vf > 0.5) a -= brakeDecel(brk, P.brkHold);
    else if (vf > -vmaxR) a -= 4.2 * brk;
  }
  if (P.stopReq) { if (vf > 0.2) a -= Math.min(9, vf / dt * 0.5 + 2); else if (vf < -0.2) a += 6; }
  if (thr === 0 && brk === 0 && !P.stopReq) a -= Math.sign(vf) * (1.3 + 0.015 * Math.abs(vf) * Math.abs(vf) * 0.2);
  a -= 9.8 * slope * 0.5;
  // rolling resistance
  a -= Math.sign(vf) * 0.5;
  const vfPrev = vf;
  vf += a * dt;
  if (!thr && !brk && !P.stopReq && Math.abs(vf) < 0.25) vf = 0;
  if (P.stopReq && Math.abs(vf) < 0.3) vf = 0;
  if (vf > vmaxF) vf -= (vf - vmaxF) * 0.5 * dt * 4;
  // hard-brake detection (not for the automatic stop): only sustained braking near the top of the ramp counts,
  // and none at all when a hazard ahead makes it an emergency stop
  const dec = (vfPrev - vf) / dt;
  if (!P.stopReq && dec > HARD_DEC && vfPrev > 6) P.hardT += dt; else P.hardT = 0;
  if (P.hardT > HARD_T && P.brakeFlag <= 0 && P.seats.length > 0) {
    const why = brakeHazard();
    P.brakeFlag = 1.4; P.hardT = 0;
    if (why) { logEv('brakeOk', { why }); HOOK.toast(t('brakeOk_' + why), 'info'); }   // justified: riders understand, no penalty, tips kept
    else { rough(); penalize(3, 'penBrake', 'brakes'); }
  }
  P.brakeFlag -= dt;
  // yaw (turning right decreases heading), lateral grip
  P.hd += -(vf / 3.4) * Math.tan(delta) * dt;
  const fx2 = Math.sin(P.hd), fz2 = Math.cos(P.hd), rx2 = -fz2, rz2 = fx2;
  let vx = fx * 0 + (P.vx), vz = P.vz;
  // world velocity from old frame, then decompose in the new frame
  vx = fx * vf + rx * vl; vz = fz * vf + rz * vl;
  let nvf = vx * fx2 + vz * fz2, nvl = vx * rx2 + vz * rz2;
  const grip = lerp(11, 3.4, wet) * (Math.abs(nvf) < 1 ? 2 : 1);
  nvl *= Math.exp(-grip * dt);
  P.skid = clamp((Math.abs(nvl) - 0.8) / 2.5, 0, 1) * (Math.abs(nvf) > 4 ? 1 : 0);
  P.vx = fx2 * nvf + rx2 * nvl; P.vz = fz2 * nvf + rz2 * nvl;
  P.x += P.vx * dt; P.z += P.vz * dt;
  P.vf = nvf; P.vl = nvl; P.speed = hyp(P.vx, P.vz) * (nvf < 0 ? -1 : 1);
  P.ax += (a - P.ax) * clamp(dt * 6, 0, 1);
  P.thr = thr;
  collidePlayer(dt);
  // visuals
  P.y = yAt(P.x, P.z);
  const f = 2.2; P.pitch += (Math.atan2(yAt(P.x + fx2 * f, P.z + fz2 * f) - yAt(P.x - fx2 * f, P.z - fz2 * f), 2 * f) - P.ax * 0.006 - P.pitch) * clamp(dt * 8, 0, 1);
  P.roll += (-P.steer * 0.07 * clamp(Math.abs(P.vf) / 12, 0, 1) - P.roll) * clamp(dt * 6, 0, 1);
  P.wheel += P.vf * dt / 0.38;
  // door state machine
  if (ds === 'opening') { P.door.t += dt / 0.4; if (P.door.t >= 1) { P.door.t = 1; P.door.state = 'open'; P.actT = 0.3; } }
  else if (ds === 'closing') { P.door.t -= dt / 0.4; if (P.door.t <= 0) { P.door.t = 0; P.door.state = 'closed'; } }
  if (P.stopReq && Math.abs(vf) < 0.3 && P.door.state === 'closed') { P.stopReq = false; P.door.state = 'opening'; HOOK.snd('door', 'open'); }
  // horn
  if (input.horn !== P.hornOn) { P.hornOn = input.horn; if (P.hornOn) HOOK.snd('hornOn'); else HOOK.snd('hornOff'); }
  if (P.hitT > 0) P.hitT -= dt;
}
/** closing waits until the last coin of the fare chain has landed; force = the player shut the door or drove off, which forfeits the tips still on the way */
function closeDoor(force = false) {
  const P = player;
  if (P.door.state !== 'open' && P.door.state !== 'opening') return;
  if (P.chain.length) { if (!force) return; forfeitChain(); }
  P.anyDrop = false; P.door.state = 'closing'; HOOK.snd('door', 'close');
}
function doorPress() {
  const P = player;
  if (P.door.state === 'open' || P.door.state === 'opening') { closeDoor(true); P.stopReq = false; P.anyDrop = false; return; }
  if (P.door.state === 'closing') return;
  if (P.stopReq) { P.stopReq = false; P.anyDrop = false; return; }
  if (!hasBusiness()) {
    if (anywhereRiders().length) {                       // nobody to serve at a stop, but a rider is happy to get off at a safe curb here
      const chk = curbCheck();
      if (chk.ok) { P.stopReq = true; P.anyDrop = true; } else curbRefuse(chk);
      return;
    }
    const b = nearestBusiness();
    HOOK.toast((b.wait.length || b.hail.length) && P.seats.length + P.boarding >= SEATS ? t('toastFull') : t('toastNoBiz'), 'info'); return;
  }
  P.stopReq = true; P.anyDrop = false;
}
let lastDentSnd = 0;
function addDent(amount, kind) {
  player.dent = Math.min(100, player.dent + amount);
  HOOK.hurt(amount);
}
function collidePlayer(dt) {
  const P = player, fx = Math.sin(P.hd), fz = Math.cos(P.hd);
  let impactMax = 0;
  for (const off of PLAYER_CIRCLES) {
    const cx = P.x + fx * off, cz = P.z + fz * off;
    const hits = staticHits(cx, cz, 1.12);
    for (const h of hits) {
      P.x += h.nx * h.pen; P.z += h.nz * h.pen;
      const vn = P.vx * h.nx + P.vz * h.nz;
      if (vn < 0) { impactMax = Math.max(impactMax, -vn * (h.hard === 0 ? 0.2 : 1)); P.vx -= (1.2) * vn * h.nx; P.vz -= (1.2) * vn * h.nz; }
    }
  }
  if (impactMax > 3 && P.hitT <= 0) {
    P.hitT = 0.7; logEv('static', { imp: +impactMax.toFixed(1) }); addDent(impactMax * 0.9, 'static'); rough(); HOOK.snd('crash', clamp(impactMax / 10, 0.3, 1.2)); HOOK.shake(clamp(impactMax / 12, 0.2, 1));
  }
  // vs AI vehicles and the tram
  for (const a of AG) {
    if (a.kind === 'player' || a.kind === 'ped') continue;
    for (const off of PLAYER_CIRCLES) {
      const cx = P.x + fx * off, cz = P.z + fz * off, dx = cx - a.x, dz = cz - a.z, m = 1.12 + a.r, d2 = dx * dx + dz * dz;
      if (d2 >= m * m) continue;
      const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, pen = m - d;
      P.x += nx * pen; P.z += nz * pen;
      const o = a.owner, ovx = a.kind === 'tram' ? o.dir * o.v : (o.hx || 0) * (o.v || 0), ovz = a.kind === 'tram' ? 0 : (o.hz || 0) * (o.v || 0);
      const rvn = (P.vx - ovx) * nx + (P.vz - ovz) * nz;
      if (rvn < 0) {
        P.vx -= 1.1 * rvn * nx; P.vz -= 1.1 * rvn * nz;
        if (-rvn > 1.5 && P.hitT <= 0) {
          P.hitT = 0.9; const imp = -rvn; logEv('carhit', { who: a.kind, path: o.path && o.path.name, cv: +(o.v || 0).toFixed(1), cs: o.s && +o.s.toFixed(0), gap: o.gap && +o.gap.toFixed(1), gk: o.gapKind, cx: +a.x.toFixed(1), cz: +a.z.toFixed(1), imp: +imp.toFixed(1) });
          addDent(clamp(imp * 1.5 + 1, 2, 28), 'car'); rough();
          penalize(Math.round(clamp(imp * 0.8 + 3, 4, 14)), 'penHit', 'hits');
          HOOK.snd('crash', clamp(imp / 8, 0.4, 1.3)); HOOK.shake(clamp(imp / 9, 0.3, 1));
          if (a.kind === 'car') { o.hitT = 2.5; HOOK.honk && HOOK.honk(); }
        }
      }
    }
  }
  // pedestrians
  for (const p of SIM.peds) {
    if (p.hit > 0 || (p.kind !== 'cross' && p.kind !== 'walk' && p.kind !== 'alight')) continue;
    const dx = p.x - P.x, dz = p.z - P.z; if (dx * dx + dz * dz > 25) continue;
    for (const off of PLAYER_CIRCLES) {
      const cx = P.x + fx * off, cz = P.z + fz * off, d = hyp(p.x - cx, p.z - cz);
      if (d < 1.12 + 0.3) {
        if (Math.abs(P.speed) > 2.2) {
          p.hit = 2.2; const l = hyp(P.vx, P.vz) || 1; p.hvx = P.vx / l * 3 + (p.x - cx) * 1.5; p.hvz = P.vz / l * 3 + (p.z - cz) * 1.5;
          penalize(25, 'penPed', 'ped'); addDent(3, 'ped'); rough(); HOOK.shake(0.5); HOOK.snd('thud', 0.8);
        } else { const nx = (p.x - cx) / (d || 1), nz = (p.z - cz) / (d || 1); p.x += nx * 0.05; p.z += nz * 0.05; }
        break;
      }
    }
  }
}
function checkRedLights(px, pz) {
  const P = player;
  if (P.redT > 0) return;
  for (const ap of APPROACHES) {
    if (ap.axis === 'x') {
      if (!((px - ap.lx) * (P.x - ap.lx) <= 0) || px === P.x) continue;
      if ((P.x - px) * ap.dx <= 0 || P.z < ap.lz0 - 0.5 || P.z > ap.lz1 + 0.5) continue;
    } else {
      if (!((pz - ap.lz) * (P.z - ap.lz) <= 0) || pz === P.z) continue;
      if ((P.z - pz) * ap.dz <= 0 || P.x < ap.lx0 - 0.5 || P.x > ap.lx1 + 0.5) continue;
    }
    if (sigState(SIGNALS[ap.sig], ap.axis) === 'r' && Math.abs(P.speed) > 2) {
      P.redT = 3; rough(); penalize(15, 'penRed', 'reds'); return;
    }
  }
}

// ---------------------------------------------------------------- servicing the door
function serviceDoor(dt) {
  const P = player;
  if (P.door.state !== 'open') return;
  P.actT -= dt;
  if (P.actT > 0) return;
  const b = nearestBusiness(14), gap = 0.3 + 0.25 * P.load;   // a fuller van unloads slower
  // alight first
  if (b.drop.length) { alight(b.drop[0], b.stop.idx); P.actT = gap; P.idle = 0; return; }
  if (P.anyDrop) {
    const ar = anywhereRiders();
    if (ar.length) {
      const chk = curbCheck();
      if (!chk.ok) { curbRefuse(chk); P.anyDrop = false; closeDoor(); return; }
      alight(ar[0].seat, ar[0].seat.dest, { any: true, bad: chk.bad, badWhy: chk.badWhy, badDist: chk.badDist, early: ar[0].early }); P.actT = gap; P.idle = 0; return;
    }
    P.anyDrop = false;
  }
  if (P.seats.length + P.boarding < SEATS) {
    const cand = [];
    for (const p of b.wait) cand.push(p);
    for (const h of b.hail) cand.push(h);
    cand.sort((a, c) => hyp(a.x - P.x, a.z - P.z) - hyp(c.x - P.x, c.z - P.z));
    if (cand.length) { startBoard(cand[0]); P.actT = 0.3; P.idle = 0; return; }
  } else if (b.wait.length || b.hail.length) {
    if (!P.fullToast || SIM.t - P.fullToast > 6) { P.fullToast = SIM.t; HOOK.toast(t('toastFull'), 'info'); }
  }
  P.idle = (P.idle || 0) + dt;
  if (P.boarding === 0 && !P.chain.length && P.idle > 0.6) { P.idle = 0; closeDoor(); }
}

// ---------------------------------------------------------------- per-step passenger bookkeeping and events
function updateStops(dt) {
  const lv = SIM.lv, P = player;
  const rainMul = 1 + SIM.rain * 0.5;
  for (const st of SIM.stops) {
    st.timer -= dt * rainMul * stopRate(st);
    if (st.timer <= 0) {
      const ahead = fwdDist(SIM.route.L, P.routeS, st.def.s);
      if (ahead < 45 || ahead > 230) { st.timer = 2; continue; }   // only appear on stops the dolmuş is about to reach
      st.timer = lv.pInt * rr(0.7, 1.4) * CHANNELS[SIM.plan.ch].rate; spawnPax(st);
    }
  }
  SIM.nextHail -= dt * (1 + SIM.rain * 0.5);
  if (SIM.nextHail <= 0) { SIM.nextHail = lv.pInt * rr(1.3, 2.2); if (SIM.hailers.length < 2 + (SIM.rain > 0.5 ? 1 : 0)) spawnHailer(true); }
  // VIP
  if (SIM.nextVip.length && SIM.t >= SIM.nextVip[0]) {
    SIM.nextVip.shift();
    let best = null, bd = 1e9;
    for (const st of SIM.stops) { const d = fwdDist(SIM.route.L, P.routeS, st.def.s); if (d > 120 && d < bd) { bd = d; best = st; } }
    if (!best) best = SIM.stops[Math.floor(R() * SIM.stops.length)];
    const p = spawnPax(best, true); if (p) HOOK.toast(t('vipSpawn', stopName(best.key)), 'info');
  }
  // skip detection
  if (P.door.state === 'closed' && !P.stopReq && P.seats.length + P.boarding < SEATS && Math.abs(P.speed) > 6) {
    const check = p => {
      if (p.st !== 'wait' || p.skipped) return;
      const d = hyp(p.x - P.x, p.z - P.z);
      if (d < 7) { p.near = (p.near || 0) + dt; if (p.near > 0.1 && !(COACH.on && !FLAG.auto)) { p.skipped = true; p.pat *= 0.5; penalize(4, 'penSkip', 'skips'); } }
    };
    for (const st of SIM.stops) for (const p of st.wait) check(p);
    for (const h of SIM.hailers) check(h);
  }
  // seats: ridePat, missed stop
  for (const s of P.seats) {
    s.ridePat -= dt * (s.mood ? MOOD_DRAIN[s.mood] : 1);
    if (s.ridePat <= 0 && !s.angry) { s.angry = true; HOOK.toast(pick(t('angry')), 'bad'); }
    const dst = SIM.stops[s.dest], d = hyp(dst.def.x - P.x, dst.def.z - P.z);
    if (d < 14 && P.door.state === 'closed' && !P.stopReq && Math.abs(P.speed) > 5 && !s.passing) { s.passing = true; }
    if (d > 28 && s.passing) { s.passing = false; if (!s.missedPass) { s.missedPass = true; s.ridePat -= 12; HOOK.toast(t('missed'), 'bad'); } }
    if (d < 10 && P.door.state !== 'closed') s.passing = false;
  }
}
function updateWeatherAndEvents(dt) {
  const lv = SIM.lv; let tgt = 0;
  for (const [a, b] of lv.rain) if (SIM.t >= a && SIM.t <= b) tgt = 1;
  const before = SIM.rain;
  SIM.rain += clamp(tgt - SIM.rain, -dt / 6, dt / 6);
  if (before < 0.5 && SIM.rain >= 0.5) HOOK.toast(t('rainOn'), 'info');
  if (before >= 0.5 && SIM.rain < 0.5) HOOK.toast(t('rainOff'), 'info');
  let jam = false;
  if (lv.jam) for (const [a, b] of lv.jam) if (SIM.t >= a && SIM.t <= b) jam = true;
  if (jam !== SIM.jam) { SIM.jam = jam; HOOK.toast(t(jam ? 'jamOn' : 'jamOff'), jam ? 'bad' : 'info'); }
  SIM.hour = lerp(lv.h0, lv.h1, SIM.t / SHIFT);
}

function initLevel(lv, idx) {
  R = lv.daily ? mulberry(lv.seed) : mulberry(SEED + lv.id * 131 + (lv.attempt || 0) * 17);
  CR = lv.daily ? mulberry(lv.seed * 7 + 11) : mulberry(SEED * 7 + lv.id * 31 + (lv.attempt || 0) * 5 + 11);
  SIM.lv = lv; SIM.lvIdx = idx; SIM.t = 0; SIM.over = false; SIM.overKind = ''; SIM.rain = 0; SIM.jam = false; SIM.nextId = 1;
  SIM.route = PATHS[lv.route]; makeStops(lv); SIM.plan = planFor(lv);
  updateRoofSign();
  SC = newScore(); SIM.score = SC;
  SIM.peds.length = 0; SIM.hailers.length = 0;
  resetPlayer(lv);
  sigClock = R() * CYCLE;
  spawnTraffic(lv); spawnPeds(lv); spawnPigeons();
  SIM.tram = lv.tram ? newTram() : null;
  if (SIM.tram) { SIM.tram.x = rr(-120, 40); }
  SIM.nextHail = 8; SIM.nextVip = lv.vip.slice(); SIM.hour = lv.h0;
  for (const st of SIM.stops) { const n = R() < 0.7 ? (R() < 0.4 ? 2 : 1) : 0; for (let i = 0; i < n; i++) spawnPax(st); }
  spawnHailer();
  // the coached first stop of level 1 always has someone waiting (own rng, so the gameplay stream stays untouched)
  if (lv.id === 1 && !SIM.stops[0].wait.length) { const Rk = R; R = mulberry(991); spawnPax(SIM.stops[0]); R = Rk; }
  SIM.running = true;
  input.throttle = input.brake = 0; input.steer = 0; input.door = false; input.horn = false;
}

function stepSim(dt) {
  if (!SIM.running || SIM.over) return;
  SIM.t += dt; sigClock += dt;
  updateWeatherAndEvents(dt);
  buildAgents();
  for (const c of SIM.cars) updateCar(c, dt);
  if (SIM.tram) updateTram(SIM.tram, dt);
  updatePigeons(dt);
  buildAgents();
  const px = player.x, pz = player.z;
  updatePlayer(dt);
  { const v = Math.abs(player.speed); SC.dist += v * dt; if (v < 0.5 && player.door.state === 'closed' && !player.boarding) SC.idle += dt; }   // route profit: fuel and idling
  checkRedLights(px, pz);
  player.redT -= dt;
  // route progress
  const pr = projectOnPath(SIM.route, player.x, player.z, player.routeS, 70);
  player.routeS = pr.d > 22 ? projectOnPath(SIM.route, player.x, player.z).s : pr.s;
  updatePeds(dt);
  serviceDoor(dt);
  updateChain(dt);
  updateStops(dt);
  if (player.dent >= 100) { endShift('wreck'); return; }
  if (SIM.t >= SHIFT) endShift('time');
}
function endShift(kind) {
  if (SIM.over) return;
  SIM.over = true; SIM.running = false; SIM.overKind = kind;
  for (const c of player.chain.splice(0)) landCoin(c);   // coins still in the air count
  const net = netScore(), lv = SIM.lv;
  let stars = 0;
  if (kind !== 'wreck') { if (net >= lv.target) stars = 1; if (net >= lv.t2) stars = 2; if (net >= lv.t3) stars = 3; }
  const fuel = SC.dist * FUEL_TL_M, idleC = SC.idle * IDLE_TL_S;
  const route = { stops: SIM.plan.stops.slice(), ch: SIM.plan.ch, fares: SC.fares, tips: SC.tips, fuel, idle: idleC, profit: SC.fares + SC.tips - fuel - idleC, dist: SC.dist, idleS: SC.idle };
  SIM.result = { kind, stars, net, score: Object.assign({}, SC), dent: player.dent, lv, route };
  HOOK.levelEnd(SIM.result);
}

// ---------------------------------------------------------------- rendering: renderer, scene, lights, models
const canvas = $('#gl');
let renderer, glFail = false;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false }); }
catch (e) { glFail = true; renderer = __glGuard.stub(canvas); } // no WebGL: boot() shows the notice and stops
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 1400);
// Software WebGL on low-end TV boxes still renders the full game at a smaller internal resolution.
const gl = renderer.getContext?.();
const gpuInfo = gl?.getExtension?.('WEBGL_debug_renderer_info');
const gpuName = gpuInfo ? gl.getParameter(gpuInfo.UNMASKED_RENDERER_WEBGL) : '';
const softwareGpu = /swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(gpuName);
const pixelRatio = low => Math.min(window.devicePixelRatio || 1, softwareGpu ? Math.min(1, 560 / window.innerWidth) : low ? 1 : 1.5);
let autoLow = softwareGpu;   // session-only: set once by the fps watchdog, never saved
const lowQ = () => settings.quality === 'low' || FLAG.low || autoLow;
function applyQuality() {
  renderer.setPixelRatio(pixelRatio(lowQ()));
  renderer.shadowMap.enabled = !lowQ();
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.castShadow = !lowQ();
  scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  applyAssetTier();
  if (ASSETS.started && !lowQ()) loadAssets();
  resize();
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (FX) FX.setSize(w, h);
  FXU.uScale.value = renderer.domElement.height / (2 * Math.tan(camera.fov * Math.PI / 360));
  FXU.uPix.value = renderer.getPixelRatio();
  updateBarH();
}
function updateBarH() { const bar = document.getElementById('topbar'); if (bar && bar.offsetHeight > 0) document.documentElement.style.setProperty('--barh', bar.offsetHeight + 'px'); }
// the top bar wraps on phones and its height changes with text/fonts: keep --barh live so the minimap/speed gauge sit below it
{ const bar = document.getElementById('topbar'); if (bar && window.ResizeObserver) new ResizeObserver(updateBarH).observe(bar, { box: 'border-box' }); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { updateBarH(); updateRoofSign(); }, () => {}); }
const hemi = new THREE.HemisphereLight(0xe3ecf6, 0x8a7a62, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d6, 2.0);
sun.shadow.mapSize.set(1024, 1024);
const SH = 52; sun.shadow.camera.left = -SH; sun.shadow.camera.right = SH; sun.shadow.camera.top = SH; sun.shadow.camera.bottom = -SH;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 260; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.35;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog(0xcbe6f7, 80, 430);
// arena-core v2 render preset: neutral tone mapping, CSS vignette + grain, grade. No composer and no room light: this is
// the heaviest scene of the series and its own fps watchdog drops to Low below 45 fps, so the frame renders directly.
const FX = window.ArenaCore && !glFail ? ArenaCore.render.setup(renderer, scene, camera, { tonlama: 'neutral', pozlama: 1.12, ortam: 0, bloom: false, vinyet: 0.18, grain: 0.03, renk: { doygunluk: 1.1, kontrast: 1.06 } }) : null;

const FXU = { uScale: { value: 700 }, uPix: { value: 1 } };
function pointsMaterial(atten, additive = false) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: FXU.uScale, uPix: FXU.uPix, uAtten: { value: atten ? 1 : 0 }, uOpacity: { value: 1 } },
    vertexShader: 'attribute float aSize; attribute float aAlpha; attribute vec3 aCol; uniform float uScale; uniform float uPix; uniform float uAtten; varying vec3 vC; varying float vA;\n' +
      'void main(){ vC=aCol; vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize = uAtten>0.5 ? aSize*uScale/max(-mv.z,0.5) : aSize*uPix; }',
    fragmentShader: `varying vec3 vC; varying float vA; uniform float uOpacity; void main(){ float d=length(gl_PointCoord-0.5)*2.0; float a=smoothstep(1.0,0.2,d)*vA*uOpacity; if(a<0.01) discard; gl_FragColor=vec4(vC,a);
#include <colorspace_fragment>
 }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}
class Particles {
  constructor(max, atten, additive) {
    this.max = max; this.n = 0; this.cur = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.age = new Float32Array(max); this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max);
    this.g = new Float32Array(max);
    const geo = this.geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1)); geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.obj = new THREE.Points(geo, pointsMaterial(atten, additive)); this.obj.frustumCulled = false; this.obj.renderOrder = 8;
    this.life.fill(0);
  }
  spawn(x, y, z, vx, vy, vz, life, s0, s1, hex, a0, g = 0) {
    const i = this.cur; this.cur = (this.cur + 1) % this.max;
    const c = cc(hex);
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.age[i] = 0; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a0; this.g[i] = g;
    this.col[i * 3] = c[0]; this.col[i * 3 + 1] = c[1]; this.col[i * 3 + 2] = c[2];
    this.size[i] = s0; this.alpha[i] = a0;
  }
  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.age[i] += dt; const u = this.age[i] / this.life[i];
      if (u >= 1) { this.life[i] = 0; this.alpha[i] = 0; continue; }
      this.vel[i * 3 + 1] -= this.g[i] * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = lerp(this.s0[i], this.s1[i], u); this.alpha[i] = this.a0[i] * (1 - u) * Math.min(1, u * 8);
    }
    const g = this.geo.attributes; g.position.needsUpdate = g.aSize.needsUpdate = g.aAlpha.needsUpdate = g.aCol.needsUpdate = true;
  }
}

// ---------------- materials
const matLam = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
const matRoad = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
const matDol = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x5a4600 });
const emissiveMat = (hex, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: 0x000000, emissive: hex }, o));
const matWinL = emissiveMat(0x9fc6e0), matWinD = emissiveMat(0x6f93b3);
const matWall = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
let matNeon = null, glowPts = null;
let signTex = null, matSign = null;
let roofSignCanvas = null, roofSignTex = null, roofSignMat = null, currentRoofRoute = '';
const SKY = { top: new THREE.Color(), hor: new THREE.Color(), tmp: new THREE.Color(), tmp2: new THREE.Color() };
let skyU, skyMesh, sunDisc, moonDisc, stars, cloudGroup, seaMesh, ferryMesh;
const WORLD_OBJ = {};

// ---------------- model builders
function wheelGeo(r, w) {
  const m = new Mesher(false, 0); m.cyl(0, -w / 2, 0, r, r, w, 9, 0x1d1f26, true, 1, 0, true); m.cyl(0, -w / 2 - 0.01, 0, r * 0.55, r * 0.55, w + 0.02, 9, 0xc9ced8, true, 1, 0, true);
  const g = m.build(); g.rotateZ(Math.PI / 2); return g;
}
function dolmusGeo() {
  const m = new Mesher(false, 0.025), d = new Mesher(false, 0.02), Y = 0xF2C200, Y2 = 0xffd21f;
  m.boxB(0, 0.38, 0, 2.1, 1.0, 5.2, Y);
  m.boxB(0, 1.38, -0.15, 2.0, 0.85, 4.75, Y2);
  m.boxB(0, 2.22, -0.15, 1.9, 0.12, 4.65, 0xfff0b0);
  d.boxB(0, 0.88, 0, 2.14, 0.13, 5.24, 0x1d1d1d);
  d.boxB(0, 0.22, 2.65, 2.14, 0.38, 0.25, 0x30343d); d.boxB(0, 0.22, -2.65, 2.14, 0.38, 0.25, 0x30343d);
  d.boxB(0, 0.52, 2.62, 1.2, 0.35, 0.1, 0x20232a);   // grille
  for (const sx of [-1, 1]) for (const z of [-1.9, -0.7, 0.5, 1.6]) d.box(sx * 1.01, 1.55, z - 0.15, 0.04, 0.55, 1.0, 0x27324a);
  d.box(0, 1.55, 2.2, 1.7, 0.55, 0.05, 0x2f3b55, 0, -0.35);
  d.box(0, 1.55, -2.53, 1.7, 0.5, 0.05, 0x27324a);
  d.box(0, 1.0, 2.62, 1.0, 0.06, 0.02, 0xffffff);   // plate holder
  d.box(1.18, 1.32, 2.0, 0.05, 0.3, 0.2, 0x20232a); d.box(-1.18, 1.32, 2.0, 0.05, 0.3, 0.2, 0x20232a); // mirrors
  m.boxB(0, 2.34, 0.6, 1.2, 0.34, 0.5, 0xfff7e0);   // roof sign box
  d.box(-0.99, 1.2, 0.75, 0.05, 1.5, 1.25, 0x1f232d); // door opening (dark) behind the sliding door
  return [m.build(), d.build()];
}
// Roof sign text in capitals. A plain toUpperCase() turns the Turkish i into I (BEŞIKTAŞ, EMINÖNÜ); Turkish names
// (every TR label, and EN labels that keep the Turkish name such as Beşiktaş) use the tr-TR rules, other EN labels en-US.
function signStop(key) {
  const tr = LANG === 'tr' || (STOPS[key] && STOPS[key][0] === STOPS[key][1]);
  return stopName(key).toLocaleUpperCase(tr ? 'tr-TR' : 'en-US');
}
const signPair = (a, b) => signStop(a) + ' – ' + signStop(b);
function getRouteSignName() {
  if (SIM.plan && SIM.plan.stops && SIM.plan.stops.length >= 2) {
    const s0 = SIM.plan.stops[0], s1 = SIM.plan.stops[SIM.plan.stops.length - 1];
    return signPair(s0, s1);
  }
  if (SIM.stops && SIM.stops.length >= 2) {
    const n = SIM.stops.length;
    const keys = SIM.stops.map(s => s.key);
    if (keys.includes('kadikoy') && keys.includes('besiktas')) return signPair('kadikoy', 'besiktas');
    if (keys.includes('kadikoy') && keys.includes('karakoy')) return signPair('kadikoy', 'karakoy');
    if (keys.includes('balat') && keys.includes('besiktas')) return signPair('balat', 'besiktas');
    const s0 = SIM.stops[0].key, s1 = SIM.stops[Math.floor(n / 2)].key;
    if (s0 !== s1) return signPair(s0, s1);
    return signPair(s0, SIM.stops[n - 1].key);
  }
  return 'KADIKÖY – TAKSİM';
}
function initRoofSignTexture() {
  if (roofSignCanvas) return;
  roofSignCanvas = document.createElement('canvas'); roofSignCanvas.width = 512; roofSignCanvas.height = 128;
  roofSignTex = new THREE.CanvasTexture(roofSignCanvas); roofSignTex.colorSpace = THREE.SRGBColorSpace; roofSignTex.anisotropy = 4;
  roofSignMat = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: roofSignTex, map: roofSignTex });
  updateRoofSign();
}
function updateRoofSign(customName) {
  if (!roofSignCanvas) return;
  const name = customName || getRouteSignName();
  currentRoofRoute = name;
  const g = roofSignCanvas.getContext('2d'), w = roofSignCanvas.width, h = roofSignCanvas.height;
  g.fillStyle = '#fffef4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d92727'; g.fillRect(0, 0, w, 18);
  g.fillStyle = '#181b22'; g.fillRect(0, h - 8, w, 8);
  g.fillStyle = '#f59e0b'; g.fillRect(8, 24, 12, h - 38); g.fillRect(w - 20, 24, 12, h - 38);
  g.fillStyle = '#11151c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 46; g.font = '900 ' + fs + 'px "Trebuchet MS","Segoe UI",Arial,sans-serif';
  let tw = g.measureText(name).width;
  while (tw > w - 56 && fs > 20) { fs -= 2; g.font = '900 ' + fs + 'px "Trebuchet MS","Segoe UI",Arial,sans-serif'; tw = g.measureText(name).width; }
  g.fillText(name, w / 2, h / 2 + 6);
  roofSignTex.needsUpdate = true;
}
function dolmusSignGeo() {
  const m = new Mesher(true, 0);
  const u = [0, 0, 1, 1];
  m.quad([-0.6, 2.38, 0.86], [0.6, 2.38, 0.86], [0.6, 2.64, 0.86], [-0.6, 2.64, 0.86], 0xffffff, u);
  m.quad([0.6, 2.38, 0.34], [-0.6, 2.38, 0.34], [-0.6, 2.64, 0.34], [0.6, 2.64, 0.34], 0xffffff, u);
  return m;
}
function buildMuavinGroup() {
  const grp = new THREE.Group(); grp.name = 'muavin';
  const m = new Mesher(false, 0);
  const SKIN = 0xdcb896, VEST = 0x1e2738, SHIRT = 0xf5f7fb, PANTS = 0x222630, SHOES = 0x16181d, CAP = 0x2b303c, POUCH = 0x5c3826;
  m.boxB(-0.08, 0, 0.02, 0.12, 0.08, 0.22, SHOES); m.boxB(0.08, 0, 0.02, 0.12, 0.08, 0.22, SHOES);
  m.boxB(-0.08, 0.08, 0, 0.11, 0.44, 0.13, PANTS); m.boxB(0.08, 0.08, 0, 0.11, 0.44, 0.13, PANTS);
  m.boxB(0, 0.50, 0, 0.32, 0.08, 0.18, 0x111317);
  m.boxB(0, 0.58, 0, 0.34, 0.40, 0.22, SHIRT);
  m.boxB(-0.09, 0.58, 0.01, 0.15, 0.39, 0.22, VEST); m.boxB(0.09, 0.58, 0.01, 0.15, 0.39, 0.22, VEST); m.boxB(0, 0.58, -0.02, 0.32, 0.39, 0.18, VEST);
  m.boxB(0.05, 0.52, 0.11, 0.14, 0.12, 0.06, POUCH); m.boxB(0.05, 0.58, 0.11, 0.04, 0.06, 0.03, 0xd4af37);
  m.cyl(0, 0.98, 0, 0.06, 0.06, 0.08, 6, SKIN);
  m.sphere(0, 1.2, 0, 0.2, 0.2, 0.19, 10, 7, SKIN);   // stil-3d: chibi head, moustache, flat cap
  m.sphere(0, 1.13, 0.17, 0.09, 0.03, 0.04, 8, 4, 0x1f1914);
  m.sphere(0, 1.27, -0.01, 0.215, 0.13, 0.215, 10, 4, CAP, 0, Math.PI * 0.5);
  m.box(0, 1.27, 0.2, 0.2, 0.025, 0.1, CAP, 0, 0.2);
  m.boxB(-0.21, 0.60, 0.06, 0.09, 0.36, 0.09, SHIRT); m.boxB(-0.21, 0.52, 0.12, 0.08, 0.10, 0.08, SKIN);
  const bodyMesh = new THREE.Mesh(m.build(), matLam); bodyMesh.castShadow = true; grp.add(bodyMesh);
  const armPiv = new THREE.Group(); armPiv.position.set(0.20, 0.94, 0.02);
  const armM = new Mesher(false, 0); armM.boxB(0, -0.32, 0, 0.085, 0.32, 0.085, SHIRT); armM.boxB(0, -0.42, 0.02, 0.08, 0.10, 0.08, SKIN);
  const armMesh = new THREE.Mesh(armM.build(), matLam); armMesh.castShadow = true; armPiv.add(armMesh); grp.add(armPiv);
  grp.userData.armPivot = armPiv;
  grp.position.set(-0.88, 0.38, 0.82); grp.rotation.y = -Math.PI / 2 - 0.25; grp.visible = false;
  return grp;
}
function lightsGeo(front) {
  const m = new Mesher(false, 0);
  if (front) { for (const sx of [-1, 1]) m.box(sx * 0.82, 0.62, 2.64, 0.38, 0.2, 0.08, 0xfff8d0); }
  else { for (const sx of [-1, 1]) m.box(sx * 0.9, 0.7, -2.63, 0.3, 0.22, 0.08, 0xff3b30); }
  return m.build();
}
function beamGeo() {
  const g = new THREE.BufferGeometry(), N = 8, pos = [], col = [];
  for (let i = 0; i < N; i++) {
    const z0 = 2.9 + i * 3.2, z1 = z0 + 3.2, w0 = 1.1 + i * 0.7, w1 = w0 + 0.7, a0 = Math.pow(1 - i / N, 1.6), a1 = Math.pow(1 - (i + 1) / N, 1.6);
    const P = [[-w0, 0, z0, a0], [w0, 0, z0, a0], [w1, 0, z1, a1], [-w1, 0, z1, a1]];
    for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(P[k][0], P[k][1], P[k][2]); col.push(1, 0.95, 0.7, P[k][3]); }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); return g;
}
function carGeoPair(kind) {
  const b = new Mesher(false, 0.02), d = new Mesher(false, 0);
  if (kind === 'car') {
    b.boxB(0, 0.28, 0, 1.8, 0.62, 4.3, 0xffffff); b.boxB(0, 0.88, -0.25, 1.62, 0.5, 2.3, 0xffffff);
    b.boxB(0, 0.62, 1.0, 1.7, 0.1, 1.5, 0xffffff);
    d.box(0, 1.1, -0.25, 1.66, 0.34, 2.0, 0x1f2a38); d.box(0, 1.1, 0.9, 1.5, 0.34, 0.06, 0x1f2a38, 0, -0.5);
    d.box(0.68, 0.62, 2.16, 0.4, 0.18, 0.06, 0xfff4c0); d.box(-0.68, 0.62, 2.16, 0.4, 0.18, 0.06, 0xfff4c0);
    d.box(0.68, 0.62, -2.16, 0.4, 0.16, 0.06, 0xb01010); d.box(-0.68, 0.62, -2.16, 0.4, 0.16, 0.06, 0xb01010);
    for (const sx of [-0.9, 0.9]) for (const z of [-1.35, 1.35]) { const cy = new Mesher(false, 0); cy.cyl(0, -0.15, 0, 0.34, 0.34, 0.3, 8, 0x16181d, true, 1, 0, true); const g = cy.build(); g.rotateZ(Math.PI / 2); g.translate(sx, 0.34, z); d.p.push(...g.attributes.position.array); d.c.push(...g.attributes.color.array); }
  } else if (kind === 'bus') {
    b.boxB(0, 0.45, 0, 2.5, 2.7, 11.5, 0xffffff); b.boxB(0, 3.15, 0, 2.4, 0.1, 11.3, 0xffffff);
    d.box(0, 1.9, 0, 2.54, 0.85, 10.4, 0x1f2a38); d.box(0, 1.7, 5.76, 2.2, 1.1, 0.06, 0x1f2a38);
    d.boxB(0, 0.15, 5.78, 2.3, 0.3, 0.1, 0x30343d); d.box(0.9, 0.85, 5.78, 0.4, 0.2, 0.06, 0xfff4c0); d.box(-0.9, 0.85, 5.78, 0.4, 0.2, 0.06, 0xfff4c0);
    d.box(0, 2.6, 5.8, 1.6, 0.3, 0.05, 0xffb020); d.boxB(0, 0.2, -5.78, 2.3, 0.3, 0.1, 0x30343d);
    for (const sx of [-1.26, 1.26]) for (const z of [-3.6, 3.6]) { const cy = new Mesher(false, 0); cy.cyl(0, -0.15, 0, 0.5, 0.5, 0.3, 8, 0x16181d, true, 1, 0, true); const g = cy.build(); g.rotateZ(Math.PI / 2); g.translate(sx, 0.5, z); d.p.push(...g.attributes.position.array); d.c.push(...g.attributes.color.array); }
  }
  return [b.build(), d.build()];
}
function vanGeo() {
  const m = new Mesher(false, 0.02);
  m.boxB(0, 0.4, -0.5, 2.1, 2.4, 4.3, 0xf4f4f0); m.boxB(0, 0.4, 2.1, 2.0, 1.25, 1.5, 0xf4f4f0); m.boxB(0, 0.3, 0, 2.14, 0.35, 5.6, 0x8a8f99);
  m.box(0, 1.85, 2.55, 1.7, 0.7, 0.05, 0x27324a, 0, -0.4); m.box(1.02, 1.7, 2.1, 0.04, 0.5, 0.9, 0x27324a); m.box(-1.02, 1.7, 2.1, 0.04, 0.5, 0.9, 0x27324a);
  m.boxB(0, 1.0, -2.67, 1.8, 1.0, 0.04, 0xd6d9df);
  m.box(0.75, 0.72, 2.84, 0.4, 0.2, 0.06, 0xfff4c0); m.box(-0.75, 0.72, 2.84, 0.4, 0.2, 0.06, 0xfff4c0);
  m.box(0, 2.6, -0.5, 2.12, 0.18, 4.32, 0x1d5b8f); m.box(1.06, 1.35, -0.5, 0.04, 0.6, 3.6, 0xC62828);
  for (const sx of [-1.0, 1.0]) for (const z of [-1.7, 1.8]) { const cy = new Mesher(false, 0); cy.cyl(0, -0.15, 0, 0.4, 0.4, 0.3, 8, 0x16181d, true, 1, 0, true); const g = cy.build(); g.rotateZ(Math.PI / 2); g.translate(sx, 0.4, z); m.p.push(...g.attributes.position.array); m.c.push(...g.attributes.color.array); }
  return m.build();
}
function tramGeo() {
  const m = new Mesher(false, 0.02);
  m.boxB(0, 0.55, 0, 2.5, 2.4, 10.6, 0xf4efe6); m.boxB(0, 0.55, 0, 2.54, 0.7, 10.64, 0xC62828); m.boxB(0, 3.0, 0, 2.3, 0.18, 10.2, 0x8a8f99);
  for (const sx of [-1, 1]) for (let z = -4.6; z <= 4.7; z += 1.55) m.box(sx * 1.27, 2.0, z, 0.05, 0.9, 1.15, 0x27324a);
  m.box(0, 1.9, 5.32, 2.1, 1.1, 0.05, 0x27324a); m.box(0, 1.9, -5.32, 2.1, 1.1, 0.05, 0x27324a);
  m.box(0.8, 0.9, 5.33, 0.35, 0.2, 0.05, 0xfff4c0); m.box(-0.8, 0.9, 5.33, 0.35, 0.2, 0.05, 0xfff4c0);
  m.boxB(0, 3.1, 1.0, 1.4, 0.12, 1.6, 0x555b66); m.boxB(0, 3.1, 1.0, 0.1, 0.5, 0.1, 0x555b66);
  m.boxB(0, 0.2, 3.4, 2.2, 0.4, 1.8, 0x30343d); m.boxB(0, 0.2, -3.4, 2.2, 0.4, 1.8, 0x30343d);
  return m.build();
}
// pedestrians: torso + head are one instance each; the two legs and the two arms are instanced limbs hinged at the hip / shoulder,
// so the walk cycle swings them in opposition (2 instances per person). Limb colours: legs = trousers, arms = sleeves.
const PANTS = [0x2b2f3a, 0x3a4252, 0x4a3a2e, 0x1f2a38, 0x5a5a62, 0x6b5a46, 0x33404f];
// stil-3d (23.11): chibi people as in the song video: big round head with hair cap, eyes and cheeks, short round body,
// short limbs; smooth normals so the soft light reads as clay. Hip / shoulder pivots: PED_HIP / PED_SH.
const PED_HIP = 0.42, PED_SH = 0.86;
function smoothGeo(g) {
  const pos = g.attributes.position.array, nor = g.attributes.normal.array, acc = new Map(), key = i => Math.round(pos[i] * 1e4) + ',' + Math.round(pos[i + 1] * 1e4) + ',' + Math.round(pos[i + 2] * 1e4);
  for (let i = 0; i < pos.length; i += 3) { const k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0, 0]); a[0] += nor[i]; a[1] += nor[i + 1]; a[2] += nor[i + 2]; }
  for (let i = 0; i < pos.length; i += 3) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; nor[i] = a[0] / l; nor[i + 1] = a[1] / l; nor[i + 2] = a[2] / l; }
  g.attributes.normal.needsUpdate = true; return g;
}
function pedGeos() {
  const b = new Mesher(false, 0), h = new Mesher(false, 0), a = new Mesher(false, 0), l = new Mesher(false, 0);
  // body (instance colour = shirt): round barrel torso and a darker belt/trouser top
  b.sphere(0, 0.47, 0, 0.215, 0.11, 0.19, 12, 6, 0x6a6a72);
  b.sphere(0, 0.66, 0, 0.245, 0.27, 0.215, 12, 8, 0xffffff);
  // head (instance colour = skin): big round head, hair cap, eyes, rosy cheeks, little nose
  h.sphere(0, 1.2, 0, 0.31, 0.29, 0.29, 14, 10, 0xffffff);
  h.sphere(0, 1.235, -0.03, 0.325, 0.3, 0.31, 14, 6, 0x2a2018, 0, Math.PI * 0.52);
  for (const sx of [-1, 1]) {
    h.sphere(sx * 0.105, 1.19, 0.262, 0.045, 0.055, 0.03, 8, 5, 0x161210);
    h.sphere(sx * 0.17, 1.1, 0.225, 0.055, 0.04, 0.03, 8, 4, 0xffb4a8);
  }
  h.sphere(0, 1.13, 0.29, 0.035, 0.03, 0.03, 6, 4, 0xf4c6b0);
  // arm (instance colour = shirt): sleeve and a round hand
  a.cyl(0, -0.33, 0, 0.062, 0.07, 0.33, 8, 0xffffff); a.sphere(0, -0.37, 0, 0.075, 0.075, 0.075, 8, 5, 0xd8b090);
  // leg (instance colour = trousers): short round leg and a big soft shoe
  l.cyl(0, -0.36, 0, 0.08, 0.085, 0.36, 8, 0xffffff); l.sphere(0, -0.38, 0.04, 0.095, 0.065, 0.135, 8, 5, 0x30302f);
  return [smoothGeo(b.build()), smoothGeo(h.build()), smoothGeo(a.build()), smoothGeo(l.build())];
}
function umbrellaGeo() {
  const m = new Mesher(false, 0);
  m.cyl(0, 1.15, 0, 0.018, 0.018, 0.85, 5, 0x2a2a30);
  m.cyl(0, 1.92, 0, 0.62, 0.03, 0.26, 9, 0xffffff);
  return m.build();
}
const UMB_COLS = [0xe5484d, 0x2b8cc4, 0xf2a33a, 0x3fae6a, 0x7a4fb5, 0xd1568b, 0x2d3b55];
function pigeonGeo() {
  const m = new Mesher(false, 0);
  m.sphere(0, 0.22, 0, 0.14, 0.12, 0.2, 6, 4, 0x8f97a3); m.sphere(0, 0.36, 0.16, 0.07, 0.07, 0.07, 5, 3, 0x6e7686); m.box(0, 0.35, 0.24, 0.02, 0.02, 0.06, 0xe8b04a);
  m.box(0, 0.22, -0.22, 0.12, 0.03, 0.16, 0x6e7686); m.box(0, 0.24, 0, 0.3, 0.02, 0.14, 0xa3abb8);
  return m.build();
}
function ringGeo() {
  const m = new Mesher(false, 0), N = 28, ri = 3.5, ro = 4.1;
  for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU; m.quadTo([Math.cos(a0) * ri, 0, Math.sin(a0) * ri], [Math.cos(a0) * ro, 0, Math.sin(a0) * ro], [Math.cos(a1) * ro, 0, Math.sin(a1) * ro], [Math.cos(a1) * ri, 0, Math.sin(a1) * ri], 0xffffff, 0, 1, 0); }
  return m.build();
}
/** curb marker symbol (second channel next to the ring colour, colour-blind safe): 'ok' check, 'bad' exclamation, 'no' cross */
function curbIconMat(kind, col) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.fillStyle = 'rgba(14,15,18,0.82)'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#' + col.toString(16).padStart(6, '0'); g.stroke();
  g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  if (kind === 'ok') { g.moveTo(19, 33); g.lineTo(28, 42); g.lineTo(45, 23); }
  else if (kind === 'bad') { g.moveTo(32, 17); g.lineTo(32, 35); g.moveTo(32, 46); g.lineTo(32, 46.5); }
  else { g.moveTo(22, 22); g.lineTo(42, 42); g.moveTo(42, 22); g.lineTo(22, 42); }
  g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }); m.userData.kind = kind; return m;
}
function beamCylGeo() {
  const g = new THREE.CylinderGeometry(0.9, 2.6, 16, 14, 1, true); g.translate(0, 8, 0); return g;
}
function cloudGeo() {
  const m = new Mesher(false, 0.03);
  for (let i = 0; i < 16; i++) {
    const cx = (WR() - 0.5) * 900, cz = -300 + WR() * 600, cy = 130 + WR() * 50, n = 3 + Math.floor(WR() * 3);
    for (let k = 0; k < n; k++) m.sphere(cx + k * 22 - n * 11, cy + WR() * 6, cz + WR() * 14, 22 + WR() * 14, 9 + WR() * 4, 16 + WR() * 8, 7, 4, 0xffffff);
  }
  return m.build();
}
function softTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------- scene objects (created by buildScene)
const OBJ = {};
let rain = null, fx = null, pips = null, tick = 0, puddleMat = null, wetLevel = 0, NEONB = 0.5, splashT = 0;
const _o = new THREE.Object3D(), _c = new THREE.Color(), _m4 = new THREE.Matrix4();
const MAXP = 150;
// On a software GPU, cull nearby city blocks before submitting the upstream merged mesh.
// All visible triangles keep their original vertices, UVs, normals, and material.
function softwareCityBlocks(geometry, material) {
  const position = geometry.getAttribute('position');
  if (!softwareGpu || geometry.index || position.count < 12000) return new THREE.Mesh(geometry, material);
  const blocks = new Map();
  const point = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 3) {
    const x = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3;
    const z = (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3;
    const key = Math.floor(x / 48) + ',' + Math.floor(z / 48);
    let block = blocks.get(key);
    if (!block) {
      block = { indices: [], bounds: new THREE.Box3() };
      blocks.set(key, block);
    }
    block.indices.push(i, i + 1, i + 2);
    for (let n = i; n < i + 3; n++) block.bounds.expandByPoint(point.fromBufferAttribute(position, n));
  }
  const group = new THREE.Group();
  for (const { indices, bounds } of blocks.values()) {
    const part = new THREE.BufferGeometry();
    for (const [key, attribute] of Object.entries(geometry.attributes)) part.setAttribute(key, attribute);
    part.setIndex(indices);
    part.boundingBox = bounds;
    part.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
    group.add(new THREE.Mesh(part, material));
  }
  return group;
}
function buildScene() {
  signTex = makeSignTexture();
  matSign = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: signTex, map: signTex });
  const add = (geo, mat, o = {}) => { const m = geo === WORLD.groundGeo ? new THREE.Mesh(geo, mat) : softwareCityBlocks(geo, mat); m.castShadow = !!o.cast; m.receiveShadow = !!o.recv; m.frustumCulled = o.cull !== false && false; scene.add(m); return m; };
  patchDetail(matRoad, false);
  OBJ.ground = add(WORLD.groundGeo, matRoad, { recv: true });
  WALLU.tWall.value = makeWallTexture(); patchWall(matWall);
  OBJ.static = add(WORLD.staticGeo, matWall, { cast: true, recv: true });
  OBJ.decor = WORLD.decorGeos.map(g => { const m = new THREE.Mesh(g, matWall); m.receiveShadow = true; scene.add(m); return m; });
  matNeon = new THREE.MeshBasicMaterial({ map: makeNeonTexture(), color: 0x808080 }); OBJ.neon = add(WORLD.neonGeo, matNeon);
  OBJ.props = add(WORLD.propGeo, matLam, { cast: true, recv: true }); OBJ.parkedProc = add(WORLD.parkGeo, matLam, { cast: true, recv: true });
  OBJ.road = add(WORLD.roadGeo, matRoad, { recv: true });
  OBJ.winL = add(WORLD.winLGeo, matWinL); OBJ.winD = add(WORLD.winDGeo, matWinD);
  OBJ.sign = add(WORLD.signGeo, matSign, { recv: true });
  // sea
  seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x4aa3c9, transparent: true, opacity: 0.93 }));
  seaMesh.position.set(0, SEA_Y, 0); seaMesh.receiveShadow = false; scene.add(seaMesh);
  // sky dome
  skyU = { uTop: { value: new THREE.Color(0x5ea9ea) }, uHor: { value: new THREE.Color(0xcbe6f7) }, uCloud: { value: new THREE.Color(0xffffff) }, uSky: { value: 0 }, uShift: { value: 0 }, uTex: { value: null }, uArt: { value: 0 }, uArtTex: { value: null } };
  skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 18, 12), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying float vY; varying vec3 vDir; void main(){ vDir = normalize(position); vY = vDir.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uCloud; uniform float uSky; uniform float uShift; uniform sampler2D uTex; uniform float uArt; uniform sampler2D uArtTex; varying float vY; varying vec3 vDir;
void main(){ vec3 c = vY>0.0 ? mix(uHor,uTop,pow(vY,0.55)) : uHor*0.8;
  if (uSky > 0.001 && vY > 0.0) {
    vec3 d = normalize(vDir); vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5 + uShift, 1.0 - acos(clamp(d.y, -1.0, 1.0)) / 3.1415927);
    vec3 t = texture2D(uTex, uv).rgb;
    float m = smoothstep(0.12, 0.55, t.r) * smoothstep(0.02, 0.22, vY) * uSky;
    float sh = mix(0.72, 1.06, smoothstep(0.2, 0.9, dot(t, vec3(0.333))));
    c = mix(c, uCloud * sh, m);
  }
  if (uArt > 0.001) {   // stil-3d: painted clay-cloud sky (assets/3d/gok.webp), mirrored around the horizon
    vec3 d = normalize(vDir); vec2 uv = vec2((atan(d.z, d.x) / 6.2831853 + 0.5) * 4.0, 0.3 + 0.7 * clamp(vY / 0.5, 0.0, 1.0));
    c = mix(c, texture2D(uArtTex, uv).rgb, uArt * smoothstep(-0.03, 0.03, vY));
  }
  gl_FragColor=vec4(c,1.0);
#include <colorspace_fragment>
 }`,
  })); skyMesh.renderOrder = -10; skyMesh.frustumCulled = false; scene.add(skyMesh);
  sunDisc = new THREE.Mesh(new THREE.SphereGeometry(26, 12, 8), emissiveMat(0xfff1b0, { fog: false })); sunDisc.frustumCulled = false; scene.add(sunDisc);
  moonDisc = new THREE.Mesh(new THREE.SphereGeometry(16, 12, 8), emissiveMat(0xe8eefc, { fog: false })); moonDisc.frustumCulled = false; scene.add(moonDisc);
  const cl = new THREE.Mesh(cloudGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.9, fog: false, flatShading: true })); cl.frustumCulled = false; cloudGroup = cl; scene.add(cl);
  // stars
  stars = new Particles(260, false, false); stars.obj.material.uniforms.uOpacity.value = 0; scene.add(stars.obj);
  for (let i = 0; i < 260; i++) { const a = R() * TAU, e = 0.12 + R() * 1.4, r = 950; stars.spawn(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r, 0, 0, 0, 1e9, 1.8 + R() * 1.6, 1.8, 0xffffff, 0.5 + R() * 0.5); }
  stars.update(0); for (let i = 0; i < 260; i++) stars.alpha[i] = stars.a0[i]; stars.obj.renderOrder = -9;   // update(0) leaves age 0 = alpha 0: set the twinkle alphas by hand
  // ferry
  ferryMesh = new THREE.Mesh(WORLD.ferryGeo, matLam); ferryMesh.position.set(69.5, SEA_Y, 150); ferryMesh.rotation.y = Math.PI; ferryMesh.castShadow = true; scene.add(ferryMesh);

  // player
  OBJ.pl = new THREE.Group(); scene.add(OBJ.pl);
  const [dgY, dgD] = dolmusGeo();
  const body = new THREE.Mesh(dgY, matDol); body.castShadow = true; body.receiveShadow = true; OBJ.pl.add(body);
  const bodyD = new THREE.Mesh(dgD, matLam); bodyD.castShadow = true; bodyD.receiveShadow = true; OBJ.pl.add(bodyD);
  OBJ.plBody = body; OBJ.plDet = bodyD;
  initRoofSignTexture();
  const signM = new THREE.Mesh(dolmusSignGeo().build(), roofSignMat); OBJ.roofSign = signM; OBJ.pl.add(signM);
  OBJ.muavin = buildMuavinGroup(); OBJ.pl.add(OBJ.muavin);
  OBJ.headL = new THREE.Mesh(lightsGeo(true), emissiveMat(0xfff8d0)); OBJ.pl.add(OBJ.headL);
  OBJ.tailL = new THREE.Mesh(lightsGeo(false), emissiveMat(0x8a1410)); OBJ.pl.add(OBJ.tailL);
  OBJ.beam = new THREE.Mesh(beamGeo(), new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute vec4 color; varying vec4 vC; void main(){ vC=color; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uOp; varying vec4 vC; void main(){ gl_FragColor=vec4(vC.rgb*vC.a*uOp,1.0); }',
  })); OBJ.beam.renderOrder = 6; OBJ.beam.frustumCulled = false; OBJ.beam.position.y = 0.35; OBJ.pl.add(OBJ.beam);
  { // wiper arm hinged at the foot of the windscreen, swings while it rains
    const wm = new Mesher(false, 0); wm.quadTo([0, -0.025, 0], [0.95, -0.025, 0], [0.95, 0.025, 0], [0, 0.025, 0], 0x111318, 0, 0, 1);
    OBJ.wiper = new THREE.Mesh(wm.build(), matLam); OBJ.wiper.position.set(0.8, 1.3, 2.33); OBJ.wiper.rotation.x = -0.35; OBJ.wiper.visible = false; OBJ.pl.add(OBJ.wiper);
  }
  const wg = wheelGeo(0.4, 0.3); OBJ.wheels = [];
  for (const [sx, z] of [[1, 1.65], [-1, 1.65], [1, -1.6], [-1, -1.6]]) {
    const piv = new THREE.Group(); piv.position.set(sx * 1.0, 0.4, z); const w = new THREE.Mesh(wg, matLam); w.castShadow = true; piv.add(w); OBJ.pl.add(piv); OBJ.wheels.push({ piv, w, front: z > 0 });
  }
  const doorG = new Mesher(false, 0.02); doorG.box(0, 0, 0, 0.06, 1.55, 1.3, 0xf3c514); doorG.box(-0.04, 0.2, 0, 0.03, 0.55, 1.0, 0x27324a);
  OBJ.door = new THREE.Mesh(doorG.build(), matDol); OBJ.door.castShadow = true; OBJ.pl.add(OBJ.door);
  OBJ.heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 7, 5), new THREE.MeshLambertMaterial({ color: 0xffffff }), SEATS); OBJ.heads.count = 0; OBJ.heads.frustumCulled = false; OBJ.pl.add(OBJ.heads);
  for (let i = 0; i < SEATS; i++) OBJ.heads.setColorAt(i, _c.set(0xffffff));

  // AI vehicles (instanced: tinted body + untinted detail)
  const [carB, carD] = carGeoPair('car'), [busB, busD] = carGeoPair('bus');
  const inst = (geo, mat, n, cast = true) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false; m.count = 0; scene.add(m); return m; };
  const tintMat = OBJ.tintMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  OBJ.carB = inst(carB, tintMat, 40); OBJ.carD = inst(carD, matLam, 40);
  OBJ.busB = inst(busB, tintMat, 4); OBJ.busD = inst(busD, matLam, 4);
  OBJ.van = inst(vanGeo(), matLam, 1); OBJ.tram = inst(tramGeo(), matLam, 2);
  OBJ.hazard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), emissiveMat(0xffa000)); OBJ.hazard.visible = false; scene.add(OBJ.hazard);
  // people
  const [pb, ph, pa, pl] = pedGeos();
  const pedMat = OBJ.pedMat = new THREE.MeshLambertMaterial({ vertexColors: true });   // stil-3d: smooth clay shading
  OBJ.pedB = inst(pb, pedMat, MAXP, true); OBJ.pedH = inst(ph, pedMat, MAXP, false); OBJ.pedA = inst(pa, pedMat, MAXP * 2, false); OBJ.pedLeg = inst(pl, pedMat, MAXP * 2, false);
  OBJ.pig = inst(pigeonGeo(), matLam, 20, false);
  OBJ.umb = inst(umbrellaGeo(), tintMat, MAXP, false);   // umbrellas: only drawn while it rains
  // wet roads: puddles that fade in with the rain
  puddleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  OBJ.puddles = new THREE.Mesh(WORLD.puddleGeo, puddleMat); OBJ.puddles.frustumCulled = false; OBJ.puddles.renderOrder = 2; OBJ.puddles.visible = false; scene.add(OBJ.puddles);
  // markers
  const ringMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x333333, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide });
  OBJ.rings = inst(ringGeo(), ringMat, 20, false); OBJ.rings.renderOrder = 4;
  const beamMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x222222, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  OBJ.beams = inst(beamCylGeo(), beamMat, 20, false); OBJ.beams.renderOrder = 5;
  // curb marker at the door: shows whether a "müsait bir yerde" drop-off here is safe (green), allowed but too close to a crossing / junction (amber) or refused (red)
  OBJ.curb = new THREE.Mesh(ringGeo(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  OBJ.curb.scale.set(0.32, 1, 0.32); OBJ.curb.renderOrder = 4; OBJ.curb.visible = false; scene.add(OBJ.curb);
  OBJ.curbMats = { ok: curbIconMat('ok', CURB_OK), bad: curbIconMat('bad', CURB_BAD), no: curbIconMat('no', CURB_NO) };
  OBJ.curbIcon = new THREE.Sprite(OBJ.curbMats.ok); OBJ.curbIcon.name = 'curbIcon'; OBJ.curbIcon.scale.set(1.1, 1.1, 1); OBJ.curbIcon.renderOrder = 6; OBJ.curbIcon.visible = false; scene.add(OBJ.curbIcon);
  // lamps, pools, signals
  const lampN = WORLD.lamps.length;
  OBJ.lamps = inst(new THREE.SphereGeometry(0.3, 6, 4), emissiveMat(0xcfd3da), lampN, false);
  OBJ.lamps.count = lampN; WORLD.lamps.forEach((l, i) => { _o.position.set(l[0], l[1], l[2]); _o.rotation.set(0, 0, 0); _o.scale.set(1, 0.5, 1); _o.updateMatrix(); OBJ.lamps.setMatrixAt(i, _o.matrix); });
  const poolTex = softTex();
  // light pools at night: street lamps, a glow around every stop shelter, and shop fronts
  const poolList = [...WORLD.lamps.map(l => [l[0], l[2], 1]), ...WORLD.shelterInst.map(o => [o.x, o.z, 0.95]), ...WORLD.shopPools.map(q => [q[0], q[1], 0.5])], poolN = poolList.length;
  OBJ.pools = inst(new THREE.PlaneGeometry(11, 11).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x000000, emissive: 0xffd9a0, emissiveMap: poolTex, map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), poolN, false);
  OBJ.pools.count = poolN; OBJ.pools.renderOrder = 3;
  poolList.forEach((q, i) => { _o.position.set(q[0], hillH(q[0], q[1]) + 0.2, q[1]); _o.scale.set(q[2], 1, q[2]); _o.updateMatrix(); OBJ.pools.setMatrixAt(i, _o.matrix); });
  // tinted light pools under the neon signs + streaks of light on wet asphalt (mirror images of lamps and signs, placed each frame)
  const noN = Math.max(1, WORLD.neonPool.length);
  OBJ.neonPools = inst(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }), noN, false);
  OBJ.neonPools.count = WORLD.neonPool.length; OBJ.neonPools.renderOrder = 3;
  WORLD.neonPool.forEach((q, i) => { _o.position.set(q[0], hillH(q[0], q[1]) + 0.22, q[1]); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); OBJ.neonPools.setMatrixAt(i, _o.matrix); OBJ.neonPools.setColorAt(i, _c.setHex(q[2])); });
  if (!OBJ.neonPools.instanceColor) OBJ.neonPools.setColorAt(0, _c.setHex(0xffffff));
  {
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; const g = cv.getContext('2d'), img = g.createImageData(32, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 32; x++) { const a = Math.exp(-(((y - 63.5) / 38) ** 2)) * Math.exp(-(((x - 15.5) / 5.5) ** 2)), i = (y * 32 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255 * a; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    OBJ.refl = inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), 170, false);
    OBJ.refl.renderOrder = 3; OBJ.refl.visible = false; OBJ.refl.setColorAt(0, _c.setHex(0xffffff));
  }
  const nl = WORLD.sigHeads.length * 3;
  OBJ.sig = inst(new THREE.SphereGeometry(0.17, 6, 4), new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x303030 }), nl, false); OBJ.sig.count = nl;
  let li = 0; for (const h of WORLD.sigHeads) for (const l of h.lamps) { _o.position.set(l.x, l.y, l.z); _o.scale.set(1, 1, 0.5); _o.updateMatrix(); OBJ.sig.setMatrixAt(li++, _o.matrix); }
  // fx
  fx = new Particles(lowQ() ? 220 : 420, true, false); scene.add(fx.obj);
  { // neon glow halos: additive sprites at every neon sign, visible only at night
    const n = WORLD.neonGlow.length + WORLD.lamps.length; glowPts = new Particles(Math.max(1, n), true, true); glowPts.obj.renderOrder = 7;
    WORLD.neonGlow.forEach(q => glowPts.spawn(q[0], q[1], q[2], 0, 0, 0, 1e9, 3.4, 3.4, q[3], 0.5));
    WORLD.lamps.forEach(l => glowPts.spawn(l[0], l[1] + 0.1, l[2], 0, 0, 0, 1e9, 2.4, 2.4, 0xffd9a0, 0.42));
    glowPts.obj.material.uniforms.uOpacity.value = 0; scene.add(glowPts.obj);
  }
  rain = new Particles(lowQ() ? 420 : 900, true, false); scene.add(rain.obj);
  rain.obj.material.uniforms.uOpacity.value = 0;
  for (let i = 0; i < rain.max; i++) rain.spawn(0, -100, 0, 0, 0, 0, 1e9, 0.075, 0.075, 0xe6f1ff, 0.85);
  pips = new Particles(40, false, false); scene.add(pips.obj); pips.obj.renderOrder = 9;
  // dummy matrices to keep instanced meshes valid
  resize();
}

// ---------------- sky / lighting by hour
let lastSkyHour = -99, lastSkyRain = -9;
function updateSky(hour, rainA) {
  const L = sstep(5.0, 6.6, hour) * sstep(21.0, 18.8, hour);
  const dayT = clamp((hour - 6.0) / 13.5, 0, 1), elev = Math.sin(Math.PI * dayT), warm = clamp(1 - elev * 2.2, 0, 1) * L;
  const night = 1 - L; SKY.L = L;
  const sunDir = _c; // reuse temp as vector holder not needed
  let dx, dy, dz;
  if (L > 0.02) { dx = -Math.cos(Math.PI * dayT); dy = Math.max(0.12, elev * 0.95 + 0.08); dz = 0.38; }
  else { dx = 0.4; dy = 0.75; dz = -0.4; }
  const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
  SIM.sunDir = [dx, dy, dz];
  const gray = 1 - 0.5 * rainA;
  sun.color.setHex(0x8ea6e8).lerp(_c.setHex(0xffe9c4), L).lerp(_c.setHex(0xff8f4a), warm * 0.85);
  sun.intensity = lerp(0.8, 2.1 + 1.0 * elev, L) * (1 - 0.55 * rainA);
  hemi.color.setHex(0x5a6ab0).lerp(_c.setHex(0xdbe6f2), L); hemi.groundColor.setHex(0x1b1f2e).lerp(_c.setHex(0x9a7f64), L);
  hemi.intensity = lerp(0.95, 1.02, L) * (1 + 0.2 * rainA);
  SKY.top.setHex(0x0a1030).lerp(_c.setHex(0x4a98e2), L).lerp(_c.setHex(0x7a6fb0), warm * 0.15).lerp(_c.setHex(0x7c8794), rainA * 0.8);
  SKY.hor.setHex(0x1c2448).lerp(_c.setHex(0xd6e5ee), L).lerp(_c.setHex(0xff9a6a), warm * 0.38).lerp(_c.setHex(0x9ba6b1), rainA * 0.8 * Math.max(L, 0.25));
  const artF = ASSETS.art ? L * (1 - 0.85 * rainA) : 0;   // stil-3d: warm painted sky by day, fog and fill light follow its horizon
  if (artF > 0) { SKY.hor.lerp(ART.hor, artF * 0.75); hemi.color.lerp(_c.setHex(0xf6e4cf), artF * 0.6); sun.color.lerp(_c.setHex(0xffdcae), artF * 0.35); }
  skyU.uArt.value = artF; if (ASSETS.art) cloudGroup.visible = !(ASSETS.sky && !lowQ()) && artF < 0.5;
  skyU.uTop.value.copy(SKY.top); skyU.uHor.value.copy(SKY.hor);
  scene.fog.color.copy(SKY.hor); scene.fog.near = lerp(80, 35, rainA); scene.fog.far = lerp(430, 230, rainA);
  seaMesh.material.color.setHex(0x1d4a6e).lerp(_c.setHex(0x4aa3c9), L).lerp(_c.setHex(0x6b8da3), rainA * 0.5);
  sunDisc.material.emissive.setHex(0xfff1b0).lerp(_c.setHex(0xff9050), warm); sunDisc.visible = L > 0.05 && rainA < 0.8;
  moonDisc.visible = night > 0.5; stars.obj.material.uniforms.uOpacity.value = clamp((night - 0.4) * 1.6, 0, 1) * (1 - rainA);
  cloudGroup.material.color.setHex(0xffffff).lerp(_c.setHex(0x20263e), night * 0.9).lerp(_c.setHex(0x8e99a5), rainA * 0.6); cloudGroup.material.opacity = 0.55 + 0.4 * rainA;
  matWinD.emissive.setHex(0x1b2640).lerp(_c.setHex(0x6f93b3), L);
  matWinL.emissive.setHex(0xffd479).lerp(_c.setHex(0x9fc6e0), L);
  OBJ.lamps.material.emissive.setHex(0xfff0c0).lerp(_c.setHex(0xcfd3da), L);
  OBJ.pools.material.opacity = clamp(night * 1.2 - 0.1, 0, 0.55);
  NEONB = 0.5 + 0.5 * night; glowPts.obj.material.uniforms.uOpacity.value = clamp(night * 1.4 - 0.15, 0, 1); OBJ.neonPools.material.opacity = clamp(night * 1.2 - 0.1, 0, 0.6);
  WET.uSkyH.value.copy(SKY.hor); WET.uSkyT.value.copy(SKY.top); WET.uNight.value = night;
  OBJ.beam.material.uniforms.uOp.value = clamp(night * 1.4 - 0.1, 0, 0.8);
  OBJ.headL.material.emissive.setHex(0xfff8d0).multiplyScalar(0.8 + 0.4 * night);
  OBJ.road && (matRoad.color.setScalar(1 - 0.22 * rainA)); if (OBJ.matGround) OBJ.matGround.color.setScalar(1 - 0.22 * rainA);
  skyU.uCloud.value.copy(cloudGroup.material.color); skyU.uSky.value = ASSETS.sky && !lowQ() ? (0.15 + 0.85 * L) * (1 - 0.45 * rainA) : 0;
  if (ASSETS.env) { const ei = 0.04 + 0.42 * L * (1 - 0.7 * rainA); for (const m of VMAT.list) m.envMapIntensity = ei; }
  lastSkyHour = hour; lastSkyRain = rainA;
}

// ---------------------------------------------------------------- optional assets (GLB models, textures, sky, samples)
// Everything below loads after the first frame. The procedural versions above stay in place until a file arrives, and
// they stay for good when a file is missing (file://, offline, 404) or when the page is opened with ?noassets.
const ASSETS = { loaded: [], failed: [], tex: false, sky: false, env: false, snd: 0, enabled: !FLAG.noassets };
const ASSET_SET = Q.get('assets') ? new Set(Q.get('assets').split(',')) : null;   // QA: ?assets=models,tex,sky,snd loads only those groups
const wants = k => !ASSET_SET || ASSET_SET.has(k);
const assetFail = (what, e) => { ASSETS.failed.push(what); console.warn('asset', what, e && e.message || e); };
let GLTFLoaderC = null, BGU = null;
/** Merge all meshes under the named node of a loaded glTF into one flat-shaded, vertex-coloured geometry (game axes). */
function glbGeo(gltf, name, center = false, local = false) {
  gltf.scene.updateMatrixWorld(true);
  const geos = [], rnd = mulberry(4242);
  gltf.scene.traverse(o => {
    if (o.name !== name) return;
    o.traverse(m => {
      if (!m.isMesh) return;
      let g = local ? m.geometry.clone() : m.geometry.clone().applyMatrix4(m.matrixWorld);
      if (g.index) g = g.toNonIndexed();
      for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
      const n = g.attributes.position.count, col = new Float32Array(n * 3), c = m.material.color || { r: 1, g: 1, b: 1 };
      for (let i = 0; i < n; i += 3) { const j = 1 + (rnd() - 0.5) * 0.04; for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r * j; col[(i + k) * 3 + 1] = c.g * j; col[(i + k) * 3 + 2] = c.b * j; } }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geos.push(g);
    });
  });
  if (!geos.length) return null;
  const g = geos.length === 1 ? geos[0] : BGU.mergeGeometries(geos, false);
  if (center) { g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()); g.translate(-c.x, -c.y, -c.z); }
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
// every model swap keeps the procedural geometry, so the Low tier (and a switch back to Low) uses the original light meshes
const MODEL_SWAP = [];
const swapGeo = (mesh, g) => { if (!g) return false; MODEL_SWAP.push({ mesh, orig: mesh.geometry, mod: g }); mesh.geometry = g; return true; };
async function loadModels() {
  const load = n => GLTFLoaderC.loadAsync('assets/models/' + n + '.glb').then(g => { ASSETS.loaded.push(n); return g; }).catch(e => { assetFail(n, e); return null; });
  const [dol, car, bus, van, tram, shel, carts] = await Promise.all(['dolmus', 'car', 'bus', 'van', 'tram', 'shelter', 'carts'].map(load));
  if (dol) {
    const wg = glbGeo(dol, 'wheel', true);
    swapGeo(OBJ.plBody, glbGeo(dol, 'body')); swapGeo(OBJ.plDet, glbGeo(dol, 'detail')); swapGeo(OBJ.door, glbGeo(dol, 'door', true));
    if (wg) for (const w of OBJ.wheels) swapGeo(w.w, wg);
  }
  if (car) { swapGeo(OBJ.carB, glbGeo(car, 'body')); swapGeo(OBJ.carD, glbGeo(car, 'detail')); }
  if (bus) { swapGeo(OBJ.busB, glbGeo(bus, 'body')); swapGeo(OBJ.busD, glbGeo(bus, 'detail')); }
  if (van) swapGeo(OBJ.van, glbGeo(van, 'van'));
  if (tram) swapGeo(OBJ.tram, glbGeo(tram, 'tram'));
  placeProps(shel, carts, !!car);
}
/** swap the merged procedural props (stops, vendors, parked cars) for instanced model versions */
function placeProps(shel, carts, parkedOk) {
  const mk = (geo, mat, list, setter, cast = true) => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false;
    list.forEach((o, i) => { setter(o, i, m); }); m.count = list.length; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; scene.add(m); return m;
  };
  const place = o => { _o.position.set(o.x, o.y, o.z); _o.rotation.set(0, o.ry || 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); return _o.matrix; };
  const sg = shel && glbGeo(shel, 'shelter'), cg = carts && glbGeo(carts, 'simit_cart', false, true), kg = carts && glbGeo(carts, 'chestnut_cart', false, true);
  if (sg && cg && kg) {
    OBJ.shelters = mk(sg, matLam, WORLD.shelterInst, (o, i, m) => m.setMatrixAt(i, place(o)));
    OBJ.simitCarts = mk(cg, matLam, WORLD.carts.filter(c => c.simit), (o, i, m) => m.setMatrixAt(i, place(o)));
    OBJ.nutCarts = mk(kg, matLam, WORLD.carts.filter(c => !c.simit), (o, i, m) => m.setMatrixAt(i, place(o)));
  } else ASSETS.failed.push('props:shelter/carts');
  if (parkedOk) {
    OBJ.parkB = mk(OBJ.carB.geometry, OBJ.tintMat, WORLD.parked, (o, i, m) => { m.setMatrixAt(i, place(o)); m.setColorAt(i, _c.setHex(o.col)); });
    OBJ.parkD = mk(OBJ.carD.geometry, matLam, WORLD.parked, (o, i, m) => m.setMatrixAt(i, place(o)));
  }
}
// ---- detail textures: grey-scale JPGs projected from above in world space (no UVs needed), picked per vertex colour class.
// Road class: dark asphalt-coloured vertices. Pavement class: light, low-saturation vertices (pavement, plaza, quay). Ground: grass.
const DETAIL = { u: { tAsph: { value: null }, tPave: { value: null }, tGrass: { value: null }, uAvg: { value: new THREE.Vector3(0.5, 0.5, 0.5) }, uAmt: { value: new THREE.Vector3(0.7, 0.6, 0.5) }, uTexOn: { value: 0 } } };
// wet roads: rain darkens the asphalt and a fake mirror (sky gradient, horizon silhouette, light columns at night) fades in at grazing angles
const WET = { uWet: { value: 0 }, uSkyH: { value: new THREE.Color(0xd6e5ee) }, uSkyT: { value: new THREE.Color(0x4a98e2) }, uNight: { value: 0 } };
function patchDetail(mat, ground) {
  mat.onBeforeCompile = sh => {
    const tex = !lowQ();   // the Low tier skips the detail textures but keeps the wet look
    Object.assign(sh.uniforms, DETAIL.u, WET);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    const body = ground
      ? (tex ? `vec2 p = vWP.xz; float g = 0.5 * (texture2D(tGrass, p * 0.19).r + texture2D(tGrass, p * 0.61 + 0.5).r) / uAvg.z; diffuseColor.rgb *= 1.0 + (g - 1.0) * uAmt.z * uTexOn;` : '')
      : `float lum = dot(vColor, vec3(0.2126, 0.7152, 0.0722)), sat = vColor.r - vColor.b;
         float wA = 1.0 - smoothstep(0.12, 0.2, lum), wP = smoothstep(0.42, 0.5, lum) * (1.0 - smoothstep(0.76, 0.84, lum)) * (1.0 - smoothstep(0.45, 0.6, sat));
         ${tex ? `vec2 p = vWP.xz;
         float a = 0.5 * (texture2D(tAsph, p * 0.16).r + texture2D(tAsph, p * 0.5 + 0.37).r) / uAvg.x, c = 0.5 * (texture2D(tPave, p * 0.22).r + texture2D(tPave, p * 0.71 + 0.11).r) / uAvg.y;
         diffuseColor.rgb *= 1.0 + (wA * (a - 1.0) * uAmt.x + wP * (c - 1.0) * uAmt.y) * uTexOn;` : ''}
         gWet = uWet * (wA + 0.3 * wP); diffuseColor.rgb *= 1.0 - 0.4 * gWet;`;
    const refl = ground ? '' : `if (gWet > 0.001) {
      vec3 Vd = normalize(cameraPosition - vWP); float fr = 0.12 + 0.88 * pow(1.0 - clamp(Vd.y, 0.0, 1.0), 1.8);
      vec3 Rd = reflect(-Vd, vec3(0.0, 1.0, 0.0)); float e = clamp(Rd.y, 0.0, 1.0);
      vec3 sky = mix(uSkyH, uSkyT, pow(e, 0.6)); sky = mix(sky, uSkyH * 0.5, (1.0 - smoothstep(0.02, 0.3, e)) * 0.75);
      float ang = atan(Rd.z, Rd.x) * 11.0, hh = fract(sin(floor(ang) * 91.7 + 12.3) * 43758.5);
      float streak = smoothstep(0.4, 0.0, abs(fract(ang) - 0.5)) * step(0.6, hh) * (1.0 - smoothstep(0.0, 0.5, e)) * uNight;
      vec3 lights = mix(vec3(1.0, 0.78, 0.45), vec3(0.0, 0.75, 0.65), step(0.5, fract(hh * 7.0))) * streak;
      outgoingLight += gWet * fr * (sky * 0.8 + lights * 1.1);
    }`;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform sampler2D tAsph, tPave, tGrass; uniform vec3 uAvg, uAmt, uSkyH, uSkyT; uniform float uTexOn, uWet, uNight; float gWet = 0.0;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ ' + body + ' }')
      .replace('#include <opaque_fragment>', refl + '\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => (lowQ() ? 'l' : 'h') + (ground ? 'g' : 'r');
  mat.needsUpdate = true;
}
function texAvg(tex) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.drawImage(tex.image, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i];
  return Math.max(0.05, sum / (d.length / 4) / 255);
}
async function loadTextures() {
  const tl = new THREE.TextureLoader(), names = { tAsph: 'asphalt', tPave: 'pavement', tGrass: 'grass' };
  const texs = await Promise.all(Object.entries(names).map(([k, n]) => tl.loadAsync('assets/textures/' + n + '.jpg').then(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return [k, t]; })));
  const avg = DETAIL.u.uAvg.value;
  texs.forEach(([k, t], i) => { DETAIL.u[k].value = t; avg.setComponent(i, texAvg(t)); });
  OBJ.matGround = matRoad.clone(); OBJ.ground.material = OBJ.matGround;
  patchDetail(matRoad, false); patchDetail(OBJ.matGround, true); DETAIL.u.uTexOn.value = 1;
  ASSETS.tex = true; lastSkyHour = -99;
}
// ---- sky: Poly Haven "Kloofendal 48d partly cloudy (pure sky)" 1k, as an LDR sky strip. Clouds on the dome + reflections on the vehicles (High tier)
const VMAT = { list: [], dol: null, det: null, tint: null };
async function loadSky() {
  const tex = await new THREE.TextureLoader().loadAsync('assets/sky/sky.jpg');
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromEquirectangular(tex).texture; pm.dispose();   // throws when the image cannot be uploaded (file://), then nothing below is applied
  skyU.uTex.value = tex;
  const std = o => { const m = new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, flatShading: true, envMap: env, envMapIntensity: 0.6, metalness: 0.08 }, o)); VMAT.list.push(m); return m; };
  VMAT.dol = std({ roughness: 0.55, emissive: 0x5a4600 }); VMAT.tint = std({ roughness: 0.55 }); VMAT.det = std({ roughness: 0.4 });
  ASSETS.sky = true; ASSETS.env = true; lastSkyHour = -99;
}
// ---- stil-3d: painted sky (Leonardo AI, see CREDITS.md); its horizon colour also tints the fog by day
const ART = { hor: new THREE.Color(0xf0d2c4) };
async function loadArtSky() {
  const tex = await new THREE.TextureLoader().loadAsync('assets/3d/gok.webp');
  tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.MirroredRepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  try {   // average colour of the row the horizon samples (70 % down the picture)
    const im = tex.image, c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 64, 32);
    const d = g.getImageData(0, 22, 64, 1).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
    ART.hor.setRGB(r / 64 / 255, gg / 64 / 255, b / 64 / 255, THREE.SRGBColorSpace);
  } catch (e) {}
  skyU.uArtTex.value = tex; ASSETS.art = true; lastSkyHour = -99;
}
/** switch the optional High-tier looks on or off (called after assets arrive and whenever the quality setting changes) */
function applyAssetTier() {
  if (!OBJ.plBody) return;
  const model = !lowQ();
  for (const e of MODEL_SWAP) e.mesh.geometry = model ? e.mod : e.orig;
  if (OBJ.shelters) { OBJ.shelters.visible = OBJ.simitCarts.visible = OBJ.nutCarts.visible = model; OBJ.props.visible = !model; }
  if (OBJ.parkB) { OBJ.parkB.visible = OBJ.parkD.visible = model; OBJ.parkedProc.visible = !model; }
  const hi = model && ASSETS.env;
  OBJ.plBody.material = hi ? VMAT.dol : matDol; OBJ.plDet.material = hi ? VMAT.det : matLam;
  if (OBJ.parkB) { OBJ.parkB.material = hi ? VMAT.tint : OBJ.tintMat; OBJ.parkD.material = hi ? VMAT.det : matLam; }
  OBJ.carB.material = OBJ.busB.material = hi ? VMAT.tint : OBJ.tintMat; OBJ.carD.material = OBJ.busD.material = OBJ.van.material = OBJ.tram.material = hi ? VMAT.det : matLam;
  cloudGroup.visible = !(ASSETS.sky && !lowQ());   // the textured sky has its own clouds; the low-poly puffs stay on Low and without assets
  lastSkyHour = -99;
}
async function loadSounds() {
  const names = ['door_open', 'door_close', 'coin1', 'coin2', 'crash1', 'crash2', 'thud1', 'thud2', 'click1', 'click2'], files = {};
  await Promise.all(names.map(n => fetch('assets/sfx/' + n + '.mp3').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b => { files[n] = b; }).catch(e => assetFail('sfx:' + n, e))));
  AUD.loadSamples(files);
}
async function loadAssets() {
  if (!ASSETS.enabled || ASSETS.busy) return;
  ASSETS.busy = true; ASSETS.started = true;
  try { await loadAssetsInner(); } finally { ASSETS.busy = false; }
}
async function loadAssetsInner() {
  if (wants('sky') && !ASSETS.art) try { await loadArtSky(); } catch (e) { assetFail('art-sky', e); }
  if (!GLTFLoaderC && !lowQ()) try {
    const [a, b] = await Promise.all([import('three/addons/loaders/GLTFLoader.js'), import('three/addons/utils/BufferGeometryUtils.js')]);
    GLTFLoaderC = new a.GLTFLoader(); BGU = b;
  } catch (e) { assetFail('loaders', e); if (wants('snd') && !ASSETS.sndLoaded) { ASSETS.sndLoaded = true; try { await loadSounds(); } catch (e2) { assetFail('sounds', e2); } } return; }
  // models, textures and sky belong to the High tier only: the Low tier never downloads them (and gets them later if switched to High)
  if (!lowQ() && wants('models') && !ASSETS.models) try { ASSETS.models = true; await loadModels(); } catch (e) { assetFail('models', e); }
  if (!lowQ() && wants('tex') && !ASSETS.tex) try { await loadTextures(); } catch (e) { assetFail('textures', e); }
  if (!lowQ() && wants('sky') && !ASSETS.sky) try { await loadSky(); } catch (e) { assetFail('sky', e); }
  applyAssetTier();
  if (wants('snd') && !ASSETS.sndLoaded) try { ASSETS.sndLoaded = true; await loadSounds(); } catch (e) { assetFail('sounds', e); }
}

// ---------------------------------------------------------------- per-frame render sync
_o.rotation.order = 'YXZ';
const _m6 = new THREE.Matrix4(), _q3 = new THREE.Quaternion(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _s = new THREE.Vector3(), _m5 = new THREE.Matrix4(), _e = new THREE.Euler();
const sigCache = [];
let exT = 0, smokeT = 0, vendT = 0;
const camState = { x: 0, y: 8, z: 0, shake: 0, mode: 'play', orbit: 0, dist: 11 };
const DEST_COL = 0x5ee08a, PICK_COL = 0xFACC15, VIP_COL = 0xffe066, IDLE_COL = 0x8a93a6;
const CURB_OK = 0x5ee08a, CURB_BAD = 0xff9f1a, CURB_NO = 0xff3b30;   // curb marker: safe / too close to a crossing or junction / refused
let curbT = 0;

function setInst(mesh, i, x, y, z, yaw, pitch, scale = 1) {
  _o.position.set(x, y, z); _o.rotation.set(-pitch, yaw, 0); _o.scale.set(scale, scale, scale); _o.updateMatrix(); mesh.setMatrixAt(i, _o.matrix);
}
function syncRender(dt) {
  tick += dt;
  const P = player, hour = SIM.hour, still = calm();
  if (Math.abs(hour - lastSkyHour) > 0.01 || Math.abs(SIM.rain - lastSkyRain) > 0.02) updateSky(hour, SIM.rain);
  // decor chunks and neon boards are not drawn beyond 230 m (the fog hides them anyway)
  for (const m of OBJ.decor) { const bs = m.geometry.boundingSphere; m.visible = hyp(bs.center.x - camera.position.x, bs.center.z - camera.position.z) < (softwareGpu ? 46 : 230) + bs.radius; }
  // ---- player
  OBJ.pl.position.set(P.x, P.y, P.z); OBJ.pl.rotation.order = 'YXZ'; OBJ.pl.rotation.set(-P.pitch, P.hd, P.roll);
  for (const w of OBJ.wheels) { w.w.rotation.x = P.wheel; if (w.front) w.piv.rotation.y = -P.steer * 0.5; }
  const dt01 = P.door.t, ease = dt01 * dt01 * (3 - 2 * dt01);
  OBJ.door.position.set(-1.07 - 0.13 * ease, 1.2, 0.75 - 1.45 * ease);
  if (OBJ.muavin) {
    const doorOpen = dt01 > 0.04 || P.door.state !== 'closed';
    OBJ.muavin.visible = doorOpen;
    if (doorOpen) {
      const arm = OBJ.muavin.userData.armPivot;
      if (arm) {
        if (P.boarding > 0) {
          arm.rotation.x = -1.1 + Math.sin(tick * 9) * 0.45;
          arm.rotation.z = 0.35 + Math.cos(tick * 9) * 0.25;
          arm.rotation.y = Math.sin(tick * 7) * 0.2;
        } else {
          arm.rotation.x = -0.2 + Math.sin(tick * 2) * 0.06;
          arm.rotation.z = 0.15;
          arm.rotation.y = 0;
        }
      }
      OBJ.muavin.position.x = -0.88 - 0.06 * ease;
      OBJ.muavin.rotation.z = P.boarding > 0 ? 0.06 * Math.sin(tick * 8) : 0;
    }
  }
  OBJ.tailL.material.emissive.setHex(input.brake > 0 && P.vf > 0.5 || P.stopReq ? 0xff3b30 : 0x8a1410);
  let hn = 0;
  for (const s of P.seats) {
    const idx = s.seatIdx, side = idx % 2, row = idx >> 1;
    _o.position.set(side ? -0.985 : 0.985, 1.62, -1.8 + row * 0.72); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix();
    OBJ.heads.setMatrixAt(hn, _o.matrix); OBJ.heads.setColorAt(hn, _c.setHex(s.skin)); hn++;
  }
  OBJ.heads.count = hn; OBJ.heads.instanceMatrix.needsUpdate = true; if (OBJ.heads.instanceColor) OBJ.heads.instanceColor.needsUpdate = true;

  // ---- AI vehicles
  let nc = 0, nb = 0;
  for (const c of SIM.cars) {
    const yaw = Math.atan2(c.hx, c.hz);
    if (c.kind === 'car') { setInst(OBJ.carB, nc, c.x, c.y, c.z, yaw, c.pitch); setInst(OBJ.carD, nc, c.x, c.y, c.z, yaw, c.pitch); OBJ.carB.setColorAt(nc, _c.setHex(c.col)); nc++; }
    else if (c.kind === 'bus') { setInst(OBJ.busB, nb, c.x, c.y, c.z, yaw, c.pitch); setInst(OBJ.busD, nb, c.x, c.y, c.z, yaw, c.pitch); OBJ.busB.setColorAt(nb, _c.setHex(c.col)); nb++; }
    else if (c.kind === 'van') {
      _o.position.set(c.x, c.y, c.z); _o.rotation.set(-c.pitch, yaw, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); OBJ.van.setMatrixAt(0, _o.matrix);
      OBJ.hazard.visible = c.hazard && (Math.floor(tick * 2.5) & 1) === 0;
      OBJ.hazard.position.set(c.x - c.hx * 2.9 - c.hz * 0.8, c.y + 0.9, c.z - c.hz * 2.9 + c.hx * 0.8); OBJ.hazard.rotation.y = yaw;
    }
  }
  OBJ.carB.count = OBJ.carD.count = nc; OBJ.busB.count = OBJ.busD.count = nb; OBJ.van.count = SIM.van ? 1 : 0;
  for (const m of [OBJ.carB, OBJ.carD, OBJ.busB, OBJ.busD, OBJ.van]) m.instanceMatrix.needsUpdate = true;
  if (OBJ.carB.instanceColor) OBJ.carB.instanceColor.needsUpdate = true; if (OBJ.busB.instanceColor) OBJ.busB.instanceColor.needsUpdate = true;
  if (!SIM.van) OBJ.hazard.visible = false;
  const tr = SIM.tram;
  if (tr) {
    const yaw = tr.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    for (let k = 0; k < 2; k++) { const cx = tr.x + tr.dir * (k ? -5.65 : 5.65); setInst(OBJ.tram, k, cx, yAt(cx, tr.z), tr.z, yaw, 0); }
    OBJ.tram.count = 2; OBJ.tram.instanceMatrix.needsUpdate = true;
  } else OBJ.tram.count = 0;

  // ---- people
  let np = 0, pn = 0, nu = 0;
  const rainU = SIM.rain > 0.45, pa = pips.alpha, pc = pips.col, pp = pips.pos, ps = pips.size;
  for (const p of SIM.peds) {
    if (np >= MAXP) break;
    const moving = p.spd > 0.1, sc = p.scale || 1;
    p.wk = (p.wk || 0) + ((moving ? 1 : 0) - (p.wk || 0)) * Math.min(1, dt * 9);         // 0 = standing, 1 = full stride
    const wk = p.wk, sw = Math.sin(p.ph) * 0.8 * wk, bob = Math.abs(Math.cos(p.ph)) * 0.05 * wk, idle = (1 - wk) * Math.sin(tick * 1.4 + p.id * 1.7);
    const y = yAt(p.x, p.z) + (pedOnRoad(p.x, p.z) ? 0.04 : 0.14) + bob;
    _v.set(p.x, y, p.z); _s.set(sc, sc, sc);
    const fall = p.hit > 0 ? -1.35 : 0;
    _e.set(fall + 0.07 * wk + 0.012 * idle, p.hd, 0.05 * Math.sin(p.ph) * wk + 0.02 * idle, 'YXZ'); _q.setFromEuler(_e); _m4.compose(_v, _q, _s);
    _e.set(fall, p.hd, 0, 'YXZ'); _q2.setFromEuler(_e); _m6.compose(_v, _q2, _s);
    OBJ.pedB.setMatrixAt(np, _m4); OBJ.pedH.setMatrixAt(np, _m4);
    if (rainU && p.hit <= 0) { setInst(OBJ.umb, nu, p.x, y, p.z, p.hd, 0, sc); OBJ.umb.setColorAt(nu, _c.setHex(UMB_COLS[p.id % UMB_COLS.length])); nu++; }
    OBJ.pedB.setColorAt(np, _c.setHex(p.shirt)); OBJ.pedH.setColorAt(np, _c.setHex(p.skin));
    // legs hinged at the hip, arms at the shoulder; right arm waves when the person is hailing the dolmus
    const pm = (mesh, i, lx, ly, rx, rz, base) => { _e.set(rx, 0, rz, 'XYZ'); _q3.setFromEuler(_e); _v2.set(lx, ly, 0); _s.set(1, 1, 1); _m5.compose(_v2, _q3, _s); _m5.premultiply(base); mesh.setMatrixAt(i, _m5); };
    pm(OBJ.pedLeg, np * 2, -0.11, PED_HIP, sw, 0, _m6); pm(OBJ.pedLeg, np * 2 + 1, 0.11, PED_HIP, -sw, 0, _m6);
    const pants = PANTS[p.id % PANTS.length]; OBJ.pedLeg.setColorAt(np * 2, _c.setHex(pants)); OBJ.pedLeg.setColorAt(np * 2 + 1, _c.setHex(pants));
    pm(OBJ.pedA, np * 2, -0.28, PED_SH, -sw * 0.8 + 0.05 * idle, -0.07, _m4);
    if (p.wave) pm(OBJ.pedA, np * 2 + 1, 0.28, PED_SH, 0, 2.55 + 0.45 * Math.sin(tick * 9 + p.id), _m4);
    else pm(OBJ.pedA, np * 2 + 1, 0.28, PED_SH, sw * 0.8 - 0.05 * idle, 0.07, _m4);
    OBJ.pedA.setColorAt(np * 2, _c.setHex(p.shirt)); OBJ.pedA.setColorAt(np * 2 + 1, _c.setHex(p.shirt));
    np++;
    if ((p.kind === 'pax' || p.kind === 'hail') && p.st === 'wait' && pn < 40) {
      const fr = clamp(p.pat / p.patMax, 0, 1);
      pp[pn * 3] = p.x; pp[pn * 3 + 1] = y + (rainU ? 2.6 : 1.95) * sc; pp[pn * 3 + 2] = p.z;
      _c.setHex(fr > 0.5 ? 0x5ee08a : fr > 0.25 ? 0xFACC15 : 0xff5a4a); pc[pn * 3] = _c.r; pc[pn * 3 + 1] = _c.g; pc[pn * 3 + 2] = _c.b;
      ps[pn] = p.vip ? 13 : 8 + (fr < 0.25 ? (still ? 2 : 2 * Math.abs(Math.sin(tick * 8))) : 0); pa[pn] = 0.95; pn++;
    }
  }
  for (let i = pn; i < 40; i++) pa[i] = 0;
  const pg = pips.geo.attributes; pg.position.needsUpdate = pg.aSize.needsUpdate = pg.aAlpha.needsUpdate = pg.aCol.needsUpdate = true;
  OBJ.pedB.count = OBJ.pedH.count = np; OBJ.pedA.count = OBJ.pedLeg.count = np * 2;
  OBJ.umb.count = nu; OBJ.umb.instanceMatrix.needsUpdate = true; if (OBJ.umb.instanceColor) OBJ.umb.instanceColor.needsUpdate = true;
  // wet roads and the wiper
  { const want = Math.max(SIM.rain, SIM.lv && SIM.lv.id === 8 ? 0.6 : 0); wetLevel += clamp(want - wetLevel, -dt / 45, dt / 4); WET.uWet.value = clamp(wetLevel, 0, 1); }
  OBJ.puddles.visible = wetLevel > 0.08; puddleMat.opacity = clamp(wetLevel, 0, 1) * 0.55; puddleMat.color.setScalar(0.4 + 0.6 * (SKY.L === undefined ? 1 : SKY.L));
  OBJ.wiper.visible = SIM.rain > 0.3; if (OBJ.wiper.visible) OBJ.wiper.rotation.z = Math.PI - 1.15 * (0.5 + 0.5 * Math.sin(tick * 5.5));
  for (const m of [OBJ.pedB, OBJ.pedH, OBJ.pedA, OBJ.pedLeg]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  // pigeons
  let nb2 = 0;
  for (const b of SIM.pigeons) {
    const pitch = b.st === 'peck' ? 0.55 * Math.abs(Math.sin(b.ph * 0.6)) : 0;
    setInst(OBJ.pig, nb2++, b.x, yAt(b.x, b.z) + 0.1 + (b.fy || 0), b.z, b.hd, pitch + (b.st === 'fly' ? -0.3 : 0), 1.4);
  }
  OBJ.pig.count = nb2; OBJ.pig.instanceMatrix.needsUpdate = true;

  // ---- stop markers
  let nm = 0;
  const hasSeatDest = idx => { for (let i = 0; i < P.seats.length; i++) if (P.seats[i].dest === idx) return true; return false; };
  const free = P.seats.length + P.boarding < SEATS;
  const pulse = still ? 1 : 1 + 0.07 * Math.sin(tick * 5);
  const mark = (x, z, colHex, sc, beam) => {
    const y = yAt(x, z) + 0.16;
    _o.position.set(x, y, z); _o.rotation.set(0, tick * 0.4, 0); _o.scale.set(sc * pulse, 1, sc * pulse); _o.updateMatrix(); OBJ.rings.setMatrixAt(nm, _o.matrix);
    OBJ.rings.setColorAt(nm, _c.setHex(colHex));
    _o.rotation.set(0, 0, 0); _o.scale.set(beam ? sc : 0.0001, beam ? 1 : 0.0001, beam ? sc : 0.0001); _o.updateMatrix(); OBJ.beams.setMatrixAt(nm, _o.matrix); OBJ.beams.setColorAt(nm, _c.setHex(colHex));
    nm++;
  };
  for (const st of SIM.stops) {
    const hasVip = st.wait.some(p => p.vip);
    if (hasSeatDest(st.idx)) mark(st.def.x, st.def.z, DEST_COL, 1, true);
    else if (st.wait.length && free) mark(st.def.x, st.def.z, hasVip ? VIP_COL : PICK_COL, (hasVip ? 1.15 : 1) * (COACH.on && st.idx === 0 ? 1.28 + (still ? 0 : 0.1 * Math.sin(tick * 8)) : 1), true);
    else mark(st.def.x, st.def.z, IDLE_COL, 0.7, false);
  }
  if (free) for (const h of SIM.hailers) mark(h.x, h.z, PICK_COL, 0.55, true);
  OBJ.rings.count = nm; OBJ.beams.count = nm;
  OBJ.rings.instanceMatrix.needsUpdate = OBJ.beams.instanceMatrix.needsUpdate = true;
  if (OBJ.rings.instanceColor) { OBJ.rings.instanceColor.needsUpdate = true; OBJ.beams.instanceColor.needsUpdate = true; }
  OBJ.beams.material.opacity = still ? 0.16 : 0.16 + 0.05 * Math.sin(tick * 4);
  // ---- curb marker (only while an "anywhere" rider is aboard near their stop and the van is slow); the check runs ~7 times a second
  const curbOn = G.state === 'play' && P.door.state === 'closed' && Math.abs(P.speed) < 9 && anywhereRiders().length > 0;
  OBJ.curb.visible = OBJ.curbIcon.visible = curbOn;
  if (curbOn) {
    curbT -= dt;
    if (curbT <= 0) { curbT = 0.15; const c = curbCheck(), k = !c.ok ? 'no' : c.bad ? 'bad' : 'ok'; OBJ.curb.material.color.setHex(k === 'no' ? CURB_NO : k === 'bad' ? CURB_BAD : CURB_OK); OBJ.curbIcon.material = OBJ.curbMats[k]; }
    const d = doorPos(); OBJ.curb.position.set(d.x, yAt(d.x, d.z) + 0.18, d.z); OBJ.curbIcon.position.set(d.x, yAt(d.x, d.z) + 1.7, d.z);
    OBJ.curb.material.opacity = still ? 0.8 : 0.65 + 0.2 * Math.sin(tick * 6);
  } else curbT = 0;
  // ---- traffic lights
  let li = 0;
  WORLD.sigHeads.forEach((h, hi) => {
    const st = sigState(SIGNALS[h.ap.sig], h.ap.axis), key = st === 'a' ? 'r' : st;
    if (sigCache[hi] !== key) {
      sigCache[hi] = key;
      const act = key === 'r' ? 0 : key === 'y' ? 1 : 2;
      for (let k = 0; k < 3; k++) { const hex = h.lamps[k].c; _c.setHex(hex); if (k !== act) _c.multiplyScalar(0.16); OBJ.sig.setColorAt(hi * 3 + k, _c); }
      if (OBJ.sig.instanceColor) OBJ.sig.instanceColor.needsUpdate = true;
    }
  });
  // ferry bobbing
  ferryMesh.position.y = SEA_Y + Math.sin(tick * 0.9) * 0.08; ferryMesh.rotation.z = Math.sin(tick * 0.7) * 0.012; ferryMesh.rotation.y = Math.PI;
  cloudGroup.position.x = (tick * 1.2) % 400 - 200; skyU.uShift.value = tick * 0.0012;

  // ---- particles
  exT -= dt; smokeT -= dt; vendT -= dt;
  const fxN = lowQ() ? 2 : 1, fx0 = Math.sin(P.hd), fz0 = Math.cos(P.hd);
  if (exT <= 0 && SIM.running) {
    exT = 0.07 * fxN;
    if (P.thr > 0.2 || Math.abs(P.vf) < 3) fx.spawn(P.x - fx0 * 2.7 + (R() - 0.5) * 0.4, P.y + 0.5, P.z - fz0 * 2.7 + (R() - 0.5) * 0.4, (R() - 0.5) * 0.6 - fx0 * 0.6, 0.5 + R() * 0.4, (R() - 0.5) * 0.6 - fz0 * 0.6, 0.9, 0.3, 1.0, 0xb7bbc4, 0.28);
    if (P.skid > 0.25) for (const o of [-1.6, 1.6]) fx.spawn(P.x - fx0 * 1.6 + (-fz0) * o * 0.6, P.y + 0.2, P.z - fz0 * 1.6 + fx0 * o * 0.6, (R() - 0.5), 0.6, (R() - 0.5), 0.8, 0.5, 1.6, 0xe6e2d8, 0.4);
  }
  if (P.dent > 55 && smokeT <= 0) { smokeT = 0.1 * fxN; fx.spawn(P.x + fx0 * 2.2, P.y + 1.4, P.z + fz0 * 2.2, (R() - 0.5) * 0.4, 1.4, (R() - 0.5) * 0.4, 1.4, 0.4, 1.8, P.dent > 80 ? 0x25262b : 0x6a6d75, 0.45); }
  if (vendT <= 0) { vendT = 0.22 * fxN; for (const v of WORLD.vendors) if (v.smoke && hyp(v.x - P.x, v.z - P.z) < 90) fx.spawn(v.x + 0.5, v.y + 2.2, v.z, (R() - 0.5) * 0.3 + 0.2, 1.1, (R() - 0.5) * 0.3, 2.2, 0.25, 1.1, 0xd0d3d9, 0.3); }
  fx.update(dt);
  // rain
  const ra = SIM.rain; rain.obj.material.uniforms.uOpacity.value = clamp(ra * 1.4, 0, 1); rain.obj.visible = ra > 0.02;
  if (ra > 0.02) {
    const pr = rain.pos, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, n = Math.floor(rain.max * clamp(ra + 0.1, 0, 1));
    for (let i = 0; i < rain.max; i++) {
      if (i >= n) { pr[i * 3 + 1] = -100; continue; }
      let y = pr[i * 3 + 1] - 30 * dt;
      if (y < cy - 12 || pr[i * 3 + 1] < -50 || Math.abs(pr[i * 3] - cx) > 38) { pr[i * 3] = cx + (Math.random() - 0.5) * 70; pr[i * 3 + 2] = cz + (Math.random() - 0.5) * 70; y = cy + 4 + Math.random() * 24; }
      pr[i * 3 + 1] = y; pr[i * 3] += 3 * dt;
    }
    rain.geo.attributes.position.needsUpdate = true; rain.geo.attributes.aAlpha.needsUpdate = false;
  }
  updateCamera(dt);
  matNeon.color.setScalar(NEONB * (!still && Math.sin(tick * 7.3) * Math.sin(tick * 3.1 + 1) > 0.94 ? 0.6 : 1));   // an occasional neon flicker
  updateReflections();
  splashT -= dt;
  if (SIM.rain > 0.2 && splashT <= 0 && SIM.running) {   // rain splashes on the road ahead of the dolmus
    splashT = 0.03 * fxN;
    for (let k = 0; k < 3; k++) { const a = Math.random(), x = P.x + fx0 * (4 + a * 16) + (Math.random() - 0.5) * 18, z = P.z + fz0 * (4 + a * 16) + (Math.random() - 0.5) * 18; if (roadAt(x, z, -0.4)) fx.spawn(x, yAt(x, z) + 0.1, z, 0, 0.35, 0, 0.3, 0.06, 0.5, 0xdfeaf8, 0.5, 0); }
  }
  // sun follows the player (snapped to avoid shimmering)
  const sd = SIM.sunDir || [0.4, 0.8, 0.3], sx = Math.round(camera.position.x / 4) * 4, sz = Math.round(camera.position.z / 4) * 4;
  sun.target.position.set(P.x, 0, P.z); sun.position.set(P.x + sd[0] * 120, sd[1] * 120, P.z + sd[2] * 120);
  sun.target.updateMatrixWorld();
  skyMesh.position.copy(camera.position);
    sunDisc.position.set(camera.position.x + sd[0] * 850, sd[1] * 850, camera.position.z + sd[2] * 850);
  moonDisc.position.set(camera.position.x + 0.4 * 850, 0.75 * 850, camera.position.z - 0.4 * 850);
  stars.obj.position.copy(camera.position);
}

/** wet asphalt: mirror images of lamps and neon signs. A light at height h seen from the camera at height hc is reflected where the ray to its image meets the road: hc/(hc+h) of the way to it. */
function updateReflections() {
  const night = 1 - (SKY.L === undefined ? 1 : SKY.L), vis = wetLevel > 0.12 && night > 0.25;
  OBJ.refl.visible = vis; if (!vis) return;
  const cx = camera.position.x, cz = camera.position.z, hc = Math.max(1.5, camera.position.y - yAt(cx, cz));
  OBJ.refl.material.opacity = clamp(night * 1.3 - 0.2, 0, 1) * clamp(wetLevel * 1.4, 0, 1) * 0.5;
  let n = 0;
  const put = (x, z, hex, h) => {
    if (n >= 170) return;
    const dx = x - cx, dz = z - cz, d = hyp(dx, dz); if (d < 9 || d > 85) return;
    const f = hc / (hc + h), px = cx + dx * f, pz = cz + dz * f;
    if (!roadAt(px, pz, -0.4)) return;
    _o.position.set(px, yAt(px, pz) + 0.1, pz); _o.rotation.set(0, Math.atan2(dx, dz), 0); _o.scale.set(0.4 + 0.008 * d, 1, 1.4 + d * 0.07); _o.updateMatrix();
    OBJ.refl.setMatrixAt(n, _o.matrix); OBJ.refl.setColorAt(n, _c.setHex(hex)); n++;
  };
  for (const q of WORLD.reflSrc) put(q[0], q[1], q[2], q[3]);
  for (const l of WORLD.lamps) put(l[0], l[2], 0xffd9a0, l[1]);
  OBJ.refl.count = n; OBJ.refl.instanceMatrix.needsUpdate = true; if (OBJ.refl.instanceColor) OBJ.refl.instanceColor.needsUpdate = true;
}

// ---------------------------------------------------------------- camera
const DBG = { cam: null, noCamFix: Q.has('nocamfix') };   // QA hooks: DBG.cam = {x,y,z,tx,ty,tz} pins the camera
const CAMQ = Q.get('cam'), CAMD = parseFloat(Q.get('camd')) || 34, CAMA = parseFloat(Q.get('cama')) || 0.8, CAMH = parseFloat(Q.get('camh')) || 14;
/** distance along the unit direction (dx,dz) from (px,pz) before a hard obstacle (wall, tree trunk, lamp post near the end) blocks the view */
function camClear(px, pz, dx, dz, maxD) {
  let best = maxD; const q = ++camClear._q;
  for (let t = 0; t <= maxD + 3.9; t += 4) {
    const tt0 = Math.min(t, maxD), arr = obGrid.get(Math.floor((px + dx * tt0) / OB_CELL) + ',' + Math.floor((pz + dz * tt0) / OB_CELL));
    if (!arr) continue;
    for (const o of arr) {
      if (o._cq === q || !o.hard) continue; o._cq = q;
      let hit = -1;
      if (o.type === 'b') {
        const M = 1.0; let t0 = 0, t1 = maxD, ok = true;
        if (Math.abs(dx) < 1e-6) { if (px < o.x0 - M || px > o.x1 + M) ok = false; }
        else { let a = (o.x0 - M - px) / dx, b = (o.x1 + M - px) / dx; if (a > b) { const w = a; a = b; b = w; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
        if (ok) {
          if (Math.abs(dz) < 1e-6) { if (pz < o.z0 - M || pz > o.z1 + M) ok = false; }
          else { let a = (o.z0 - M - pz) / dz, b = (o.z1 + M - pz) / dz; if (a > b) { const w = a; a = b; b = w; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); }
        }
        if (ok && t0 <= t1 && t0 > 0.01) hit = t0;   // t0 = 0: the dolmus already stands inside the margin, ignore that box
      } else {
        const R = o.r + 0.7, ox = o.x - px, oz = o.z - pz, proj = ox * dx + oz * dz;
        if (proj > 0) { const d2 = ox * ox + oz * oz - proj * proj; if (d2 < R * R) { const h = proj - Math.sqrt(R * R - d2); if (h > 0.01 && (o.r >= 0.3 || h > maxD - 2.6)) hit = h; } }
      }
      if (hit > 0 && hit < best) best = hit;
    }
  }
  return best;
}
camClear._q = 0;
function updateCamera(dt) {
  const P = player, cs = camState;
  if (DBG.cam) { const c = DBG.cam; camera.position.set(c.x, c.y, c.z); camera.lookAt(c.tx, c.ty, c.tz); if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); } return; }
  if (CAMQ && cs.mode !== 'orbit') {   // QA spectator camera (?cam=tram|van|bus|mosque|pier|bridge|plaza|main|x,z)
    let tx = P.x, tz = P.z;
    if (CAMQ === 'tram' && SIM.tram) { tx = SIM.tram.x; tz = SIM.tram.z; } else if (CAMQ === 'van' && SIM.van) { tx = SIM.van.x; tz = SIM.van.z; }
    else if (CAMQ === 'bus') { const b = SIM.cars.find(c => c.kind === 'bus'); if (b) { tx = b.x; tz = b.z; } }
    else if (CAMQ === 'mosque') { tx = -14; tz = -52; } else if (CAMQ === 'pier') { tx = 62; tz = 132; } else if (CAMQ === 'bridge') { tx = 0; tz = 62; }
    else if (CAMQ === 'plaza') { tx = 0; tz = -45; } else if (CAMQ === 'main') { tx = 0; tz = 0; } else if (CAMQ.includes(',')) { const q = CAMQ.split(',').map(Number); tx = q[0]; tz = q[1]; }
    camera.position.set(tx + Math.cos(CAMA) * CAMD, yAt(tx, tz) + CAMH, tz + Math.sin(CAMA) * CAMD); camera.lookAt(tx, yAt(tx, tz) + 2, tz);
    if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); } return;
  }
  if (cs.mode === 'orbit') {
    cs.orbit += dt * 0.07;
    const cx = -4, cz = -40, r = 78, a = cs.orbit;
    camera.position.set(cx + Math.cos(a) * r, 26 + yAt(cx, cz) + Math.sin(a * 1.7) * 3, cz + Math.sin(a) * r * 0.72);
    camera.lookAt(cx, 4, cz); camera.fov = 52; camera.updateProjectionMatrix(); return;
  }
  let dh = wrapAng(P.hd - P.camHd); P.camHd += dh * (1 - Math.exp(-dt * (Math.abs(P.vf) < 1 ? 1.5 : 4.2)));
  const sp = Math.abs(P.vf), back = 11 + sp * 0.32, up = 5.6 + sp * 0.09;
  const fx = Math.sin(P.camHd), fz = Math.cos(P.camHd);
  // keep the camera out of buildings, trees and lamp posts: shorten the follow distance (fast in, slow out) and lift it a little
  const want = DBG.noCamFix ? back : clamp(camClear(P.x, P.z, -fx, -fz, back + 1.2) - 1.2, 3.2, back);
  cs.dist += (want - cs.dist) * (1 - Math.exp(-dt * (want < cs.dist ? 10 : 2.2)));
  const tx = P.x - fx * cs.dist, tz = P.z - fz * cs.dist, ty = P.y + up + (back - cs.dist) * 0.3;
  const k = 1 - Math.exp(-dt * 9);
  cs.x += (tx - cs.x) * k; cs.y += (ty - cs.y) * k; cs.z += (tz - cs.z) * k;
  if (!isFinite(cs.x) || hyp(cs.x - P.x, cs.z - P.z) > 40) { cs.x = tx; cs.y = ty; cs.z = tz; }
  cs.shake *= Math.exp(-dt * 5);
  const sh = calm() ? 0 : cs.shake * 0.5;
  camera.position.set(cs.x + (Math.random() - 0.5) * sh, Math.max(cs.y, yAt(cs.x, cs.z) + 1.8) + (Math.random() - 0.5) * sh, cs.z + (Math.random() - 0.5) * sh);
  camera.lookAt(P.x + fx * 6, P.y + 1.6, P.z + fz * 6);
  const fov = 55 + clamp(sp, 0, 22) * 0.45; if (Math.abs(fov - camera.fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

// ---------------------------------------------------------------- minimap
let mmBase = null;
const _wantDest = new Set(), _anyDest = new Set();
const MM = { x0: -170, z0: -112, k: 1.2353 };
const mmx = x => (x - MM.x0) * MM.k, mmz = z => (z - MM.z0) * MM.k;
function buildMinimapBase() {
  const c = document.createElement('canvas'); c.width = 420; c.height = 316; const g = c.getContext('2d');
  g.fillStyle = '#26352f'; g.fillRect(0, 0, 420, 316);
  g.fillStyle = '#1f5f84'; g.fillRect(0, mmz(131), 420, 316 - mmz(131));
  g.fillRect(0, mmz(58.5), 420, 13 * MM.k);
  g.fillStyle = '#3a4a42'; for (const b of BLOCKS) g.fillRect(mmx(b.x0), mmz(b.z0), (b.x1 - b.x0) * MM.k, (b.z1 - b.z0) * MM.k);
  g.fillStyle = '#6b6a5a'; g.fillRect(mmx(-35), mmz(-81), 70 * MM.k, 68 * MM.k);
  g.lineCap = 'butt';
  for (const r of ROADS) { if (r.virtual) continue; g.strokeStyle = '#6b7590'; g.lineWidth = r.w * MM.k * 0.85; g.beginPath(); g.moveTo(mmx(r.a[0]), mmz(r.a[1])); g.lineTo(mmx(r.b[0]), mmz(r.b[1])); g.stroke(); }
  g.strokeStyle = '#6b7590'; g.lineWidth = 8 * MM.k * 0.85; g.beginPath(); g.moveTo(mmx(-35), mmz(-45)); g.lineTo(mmx(35), mmz(-45)); g.stroke();
  g.fillStyle = '#8fa0b8'; g.fillRect(mmx(-23), mmz(-71), 18 * MM.k, 18 * MM.k);
  mmBase = c;
}
function drawMinimap() {
  const cv = $('#minimap'), g = cv.getContext('2d');
  if (!mmBase) buildMinimapBase();
  const rot = settings.mapRot !== false, px = mmx(player.x), pz = mmz(player.z), ang = rot ? player.hd - Math.PI : 0;   // heading-up: rotate the map so the dolmus points up
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#26352f'; g.fillRect(0, 0, 420, 316);   // same colour as the map ground, so the area outside the city does not look empty
  g.save();
  if (rot) { g.translate(210, 190); g.scale(1.5, 1.5); g.rotate(ang); g.translate(-px, -pz); }
  g.drawImage(mmBase, 0, 0);
  const P = SIM.route;
  if (P) {
    g.strokeStyle = 'rgba(250,204,21,.8)'; g.lineWidth = 3.2; g.setLineDash([9, 6]); g.beginPath();
    for (let i = 0; i <= P.N; i += 3) { const j = i % P.N; if (i === 0) g.moveTo(mmx(P.X[j]), mmz(P.Z[j])); else g.lineTo(mmx(P.X[j]), mmz(P.Z[j])); }
    g.stroke(); g.setLineDash([]);
    _wantDest.clear(); _anyDest.clear();
    for (let i = 0; i < player.seats.length; i++) { const s = player.seats[i]; _wantDest.add(s.dest); if (s.any) _anyDest.add(s.dest); }
    if (_anyDest.size) {
      g.save(); g.strokeStyle = 'rgba(94,224,138,.6)'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const di of _anyDest) { const c0 = SIM.stops[di].def.s; g.beginPath(); for (let k = -ANY_RANGE; k <= ANY_RANGE; k += 5) { pathAt(P, c0 + k, _tp); if (k === -ANY_RANGE) g.moveTo(mmx(_tp.x), mmz(_tp.z)); else g.lineTo(mmx(_tp.x), mmz(_tp.z)); } g.stroke(); }
      g.restore();
    }
    const guide = SIM.guide;
    g.font = '700 12px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const st of SIM.stops) {
      const x = mmx(st.def.x), z = mmz(st.def.z), drop = _wantDest.has(st.idx), wait = st.wait.length > 0, vip = st.wait.some(p => p.vip);
      const col = drop ? '#5ee08a' : (wait ? (vip ? '#ffe066' : '#FACC15') : '#9aa3b5');
      g.save(); g.translate(x, z); g.rotate(-ang);   // keep the stop badges upright
      if (guide && guide.stop === st) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 12 + (calm() ? 0 : 2 * Math.sin(tick * 6)), 0, TAU); g.stroke(); }
      if (SIM.plan && SIM.plan.stops.includes(st.key)) { g.strokeStyle = '#ff9f1a'; g.lineWidth = 2.4; g.beginPath(); g.arc(0, 0, 11.5, 0, TAU); g.stroke(); }   // Route Master stop
      g.fillStyle = '#12161f'; g.beginPath(); g.arc(0, 0, 8.5, 0, TAU); g.fill();
      g.strokeStyle = col; g.lineWidth = 2.6; g.stroke();
      g.fillStyle = col; g.fillText(String(st.idx + 1) + (_anyDest.has(st.idx) ? '?' : ''), 0, 0.5);
      if (wait) { g.fillStyle = vip ? '#ffe066' : '#fff'; g.beginPath(); g.arc(9, -9, 3.4 + Math.min(st.wait.length, 4) * 0.35, 0, TAU); g.fill(); }
      g.restore();
    }
    for (const h of SIM.hailers) { g.fillStyle = '#FACC15'; g.beginPath(); g.arc(mmx(h.x), mmz(h.z), 3.8, 0, TAU); g.fill(); g.strokeStyle = '#12161f'; g.lineWidth = 1.5; g.stroke(); }
    if (SIM.tram) { g.fillStyle = '#e5484d'; g.fillRect(mmx(SIM.tram.x) - 6, mmz(SIM.tram.z) - 2, 12, 4); }
  }
  if (!rot) {
    g.save(); g.translate(px, pz); g.rotate(Math.PI - player.hd); g.fillStyle = '#FACC15'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3.5); g.lineTo(-6.5, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  g.restore();
  if (rot) {
    g.save(); g.translate(210, 190); g.scale(1.5, 1.5); g.fillStyle = '#FACC15'; g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6.5, 7); g.lineTo(0, 3.5); g.lineTo(-6.5, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
    // compass: a small N on the rim, pointing at map north
    const sx = Math.sin(ang), sy = -Math.cos(ang), k = Math.min(Math.abs(sx) > 1e-6 ? (210 - 18) / Math.abs(sx) : 1e9, sy < 0 ? (190 - 18) / Math.max(-sy, 1e-6) : (316 - 190 - 18) / Math.max(sy, 1e-6));
    g.fillStyle = 'rgba(18,22,31,.85)'; g.beginPath(); g.arc(210 + sx * k, 190 + sy * k, 11, 0, TAU); g.fill();
    g.strokeStyle = '#e5484d'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.font = '800 13px "Trebuchet MS",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 210 + sx * k, 190 + sy * k + 0.5);
  }
}

// ---------------------------------------------------------------- guidance (also used by the bot)
function guideTarget() {
  const P = player, L = SIM.route.L; let best = null, bd = 1e9;
  const free = P.seats.length + P.boarding < SEATS;
  const consider = (obj, x, z, s, kind) => { const d = fwdDist(L, P.routeS, s); const dd = d > L - 12 ? d - L : d; if (dd < bd && dd > -12) { bd = dd; best = { stop: obj.stop || null, x, z, kind, d: dd, obj }; } };
  for (const st of SIM.stops) {
    if (player.seats.some(s => s.dest === st.idx)) consider({ stop: st }, st.def.x, st.def.z, st.def.s, 'drop');
    else if (free && st.wait.length) consider({ stop: st }, st.def.x, st.def.z, st.def.s, 'pick');
  }
  if (free) for (const h of SIM.hailers) consider({ stop: null, h }, h.x, h.z, h.s, 'pick');
  if (!best) { for (const st of SIM.stops) consider({ stop: st }, st.def.x, st.def.z, st.def.s, 'cruise'); }
  return best;
}

// ---------------------------------------------------------------- UI, game flow
let loadN = 0, loadTotal = 8;
const COACH = { on: false }, coinEls = [];
const G = { state: 'loading', horns: 0, mode: 'campaign', lvIdx: 0, wave: 1, total: 0, stars: [], endlessTotal: 0, retries: 0, log: [], done: false, settingsFrom: 'title', errors: [], events: [] };
const el = {};
['sTitle', 'sPause', 'sSettings', 'sEnd', 'hud', 'bPlay', 'playTxt', 'bCont', 'bEndless', 'bestLine', 'lvCard', 'cdTitle', 'cdDesc', 'cdList', 'cdTarget', 'countdown', 'cdNum', 'cdSub', 'mascot', 'mascotImg', 'enTips', 'enTitle', 'enSub', 'enStars', 'enStats', 'enRec', 'nextTxt', 'bNext', 'bRetry',
  'stLevel', 'stClock', 'stFare', 'fareBar', 'stSeats', 'dentBar', 'toasts', 'floaters', 'bubbles', 'seatsStrip', 'spVal', 'spArc', 'spNeedle', 'guideBox', 'guideArrow', 'guideTxt', 'hint', 'hurt', 'dbg', 'touch', 'steer', 'pGas', 'pBrake', 'tDoor', 'tHorn',
  'rMaster', 'rMusic', 'rSfx', 'oMaster', 'oMusic', 'oSfx', 'bTR', 'bEN', 'bQLow', 'bQHigh', 'bMapH', 'bMapN', 'bSound', 'langTxt', 'sRoute', 'hatLv', 'hatStopsH', 'hatStops', 'hatCh', 'hatChd', 'hatBestLine', 'bHatGo', 'hatGoTxt'].forEach(id => { el[id] = document.getElementById(id); });
const SCREENS = ['sTitle', 'sPause', 'sSettings', 'sEnd', 'sRoute', 'sNews'];
for (const id of ['sNews', 'bNews', 'bNewsBack', 'newsList', 'boardList', 'badgeList', 'bDaily', 'dailyLine', 'bA11y', 'bShare', 'aOther', 'pUni', 'bPedU', 'bPedS']) el[id] = document.getElementById(id);
function showScreen(id) { for (const s of SCREENS) el[s].classList.toggle('show', s === id); if (id) { const b = el[id].querySelector('.btn.primary:not([disabled])') || el[id].querySelector('.btn'); if (b && id !== 'sTitle') setTimeout(() => b.focus({ preventScroll: true }), 30); } }

function applyLang() {
  document.documentElement.lang = LANG;
  if (window.Arena) Arena.lang(LANG);
  const touch = document.body.classList.contains('touch');   // touch devices: no keyboard keys in the help texts
  $$('[data-i]').forEach(n => { const k = n.dataset.i; n.textContent = t(touch && (k === 'howto' || k === 'keysHelp') ? k + 'Touch' : k, 0, 0); });
  $$('[data-t]').forEach(n => { const s = t(n.dataset.t); n.title = s; n.setAttribute('aria-label', s); });
  el.steer.setAttribute('aria-label', LANG === 'tr' ? 'Direksiyon' : 'Steering');
  el.langTxt.textContent = LANG === 'tr' ? 'TR · EN' : 'EN · TR';
  el.hint.innerHTML = t('hintSpace');
  el.bTR.classList.toggle('sel', LANG === 'tr'); el.bEN.classList.toggle('sel', LANG === 'en');
  el.bQLow.classList.toggle('sel', lowQ()); el.bQHigh.classList.toggle('sel', !lowQ());
  document.title = 'Dolmuş';
  updateRoofSign();
  if (G.state === 'title' || G.state === 'loading') refreshTitle();
  if (el.sNews && el.sNews.classList.contains('show')) fillNews();
  if (G.state === 'loading') el.playTxt.textContent = t('loading', loadN, loadTotal);
}
function setLang(l) { LANG = settings.lang = l; saveSettings(); applyLang(); if (G.state === 'countdown' || G.state === 'play' || G.state === 'paused') fillCard(); if (G.state === 'end') fillEnd(G.lastResult); if (G.state === 'route') fillRoute(); }
function refreshTitle() {
  el.bCont.classList.toggle('hidden', !runSave);
  // with a save, "Continue" is the big primary button and "New game" sits under it and asks before erasing the save
  el.bCont.classList.toggle('primary', !!runSave); el.bPlay.classList.toggle('primary', !runSave);
  if (runSave) el.bPlay.before(el.bCont); else el.bCont.before(el.bPlay);
  newArm = 0;
  const stars = (Array.isArray(best.stars) ? best.stars : []).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const total = Number.isFinite(best.total) ? best.total : 0;
  const endless = Number.isFinite(best.endless) ? best.endless : 0;
  el.bestLine.textContent = total || stars || endless ? t('bestLine', fmt(total), stars, fmt(endless)) : t('bestNone');
  if (window.Arena) { const d = Arena.daily(); el.dailyLine.textContent = (d.done ? t('dailyDone') + ' · ' : '') + t('dailyLine', d.streak, d.best); } else el.bDaily.classList.add('hidden');
  if (G.state !== 'loading') el.playTxt.textContent = t(runSave ? 'newGame' : 'play');
}
var newArm = 0;   // time of the first "New game" tap while a save exists, 0 = not armed (second tap within 4 s confirms)
let lastToast = { t: '', at: 0 };
function toast(text, kind = 'info') {
  const now = performance.now(); if (lastToast.t === text && now - lastToast.at < 1800) return; lastToast = { t: text, at: now };
  const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = text; el.toasts.appendChild(d);
  while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
  setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3000);
}
function worldToScreen(x, y, z) {
  _v.set(x, y, z).project(camera);
  return { x: (_v.x * 0.5 + 0.5) * window.innerWidth, y: (-_v.y * 0.5 + 0.5) * window.innerHeight, ok: _v.z < 1 };
}
function floater(text, neg) {
  const p = worldToScreen(player.x, player.y + 3.2, player.z); if (!p.ok) return;
  const d = document.createElement('div'); d.className = 'floater' + (neg ? ' neg' : ''); d.textContent = text + ' ' + t('tl');
  d.style.left = (p.x + (Math.random() - 0.5) * 40) + 'px'; d.style.top = p.y + 'px'; el.floaters.appendChild(d); setTimeout(() => d.remove(), 1500);
}
const bubbles = [];
function bubble(text) {
  const d = document.createElement('div'); d.className = 'bubble'; d.textContent = text; el.bubbles.appendChild(d);
  bubbles.push({ d, t: 3.0 }); if (bubbles.length > 3) { const b = bubbles.shift(); b.d.remove(); }
}
function updateBubbles(dt) {
  const p = worldToScreen(player.x, player.y + 3.4, player.z);
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; b.t -= dt; if (b.t < 0.4) b.d.classList.add('out'); if (b.t <= 0) { b.d.remove(); bubbles.splice(i, 1); continue; }
  }
  bubbles.forEach((b, i) => { b.d.style.left = Math.max(80, Math.min(window.innerWidth - 80, p.x)) + 'px'; b.d.style.top = (p.y - (bubbles.length - 1 - i) * 34 - 6) + 'px'; });
}

// hooks from the simulation
HOOK.toast = (txt, kind) => { toast(txt, kind); if (kind === 'good') AUD.good(); };
HOOK.float = floater;
HOOK.bubble = bubble;
HOOK.honk = () => AUD.honk(300 + Math.random() * 60, 0.35, 0.12);
HOOK.shake = a => { if (!calm()) camState.shake = Math.max(camState.shake, a * 2.2); };
HOOK.hurt = a => {
  const c = calm();
  if (el.hurt) {
    el.hurt.style.transition = 'opacity 0.05s ease-out';
    el.hurt.style.opacity = c ? '0.18' : String(clamp(0.4 + (a || 0) / 20, 0.5, 0.95));
    setTimeout(() => {
      if (el.hurt) {
        el.hurt.style.transition = 'opacity 0.35s ease-out';
        el.hurt.style.opacity = '0';
      }
    }, c ? 400 : 120);
  }
  if (!c && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([30, 20, 30]); } catch (e) { /* ignore */ }
  }
};
HOOK.tramStop = () => { if (SIM.tram && hyp(SIM.tram.x - player.x, SIM.tram.z - player.z) < 80) AUD.bell(); };
HOOK.vanParked = () => { toast(t('vanOn'), 'info'); };
HOOK.sparkle = () => { for (let i = 0; i < 12; i++) fx.spawn(player.x + (Math.random() - 0.5) * 1.2, player.y + 2.6, player.z + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2, 2 + Math.random() * 2.5, (Math.random() - 0.5) * 2, 0.9, 0.5, 0.1, 0xFACC15, 0.95, 4); };
HOOK.snd = (name, a) => {
  switch (name) {
    case 'door': AUD.door(a); break; case 'coin': AUD.coin(); break; case 'bell': if (SIM.tram && hyp(SIM.tram.x - player.x, SIM.tram.z - player.z) < 80) { AUD.bell(); if (G.state === 'play' && hyp(SIM.tram.x - player.x, SIM.tram.z - player.z) < 45) toast(t('tramBell'), 'info'); } break; case 'pop': AUD.pop(); break; case 'bad': AUD.bad(); break;
    case 'crash': AUD.crash(a || 1); break; case 'thud': AUD.thud(a || 1); break; case 'hornOn': G.horns++; AUD.hornStart(); break; case 'hornOff': AUD.hornStop(); break;
  }
};

// ---- level helpers
function curLevel() {
  if (G.mode === 'campaign') return LEVELS[G.lvIdx];
  if (G.mode === 'daily') return dailyLevel(G.daily);
  const lv = endlessLevel(G.wave); lv.t2 = Math.round(lv.target * 1.4); lv.t3 = Math.round(lv.target * 1.85); return lv;
}
function levelName(lv) { return lv.daily ? t('lvD') : lv.endless ? t('lvE', lv.wave) : t('lv' + lv.id); }
// Daily challenge (arena-kit): an endless-style shift whose wave (1-4) and gameplay rng come from the UTC day seed
// (same for everyone that day, ?d=YYYYMMDD replays a day). It never touches the campaign save or the endless record.
function dailyLevel(d) {
  const lv = endlessLevel(1 + d.seed % 4); lv.t2 = Math.round(lv.target * 1.4); lv.t3 = Math.round(lv.target * 1.85);
  return Object.assign(lv, { daily: d.day, seed: d.seed });
}
function startDaily() { if (!window.Arena) return; AUD.init(); G.mode = 'daily'; G.daily = Arena.daily(); G.dailyRec = null; G.retries = 0; enterIntro(); }
/** the level card: a dismissable corner card (new-feature list); it never blocks the shift */
function fillCard() {
  const lv = curLevel();
  el.cdTitle.textContent = lv.endless ? levelName(lv) : t('level') + ' ' + lv.id + ': ' + levelName(lv);
  el.cdDesc.textContent = t(lv.daily ? 'dD' : lv.endless ? 'dE' : 'd' + lv.id);
  el.cdList.innerHTML = '';
  const feats = lv.endless ? ['f_traffic', 'f_rain', 'f_vip', 'f_any', 'f_stops:10'] : lv.feat;
  for (const f of feats) { const [k, a] = f.split(':'); const li = document.createElement('li'); li.textContent = t(k, a); el.cdList.appendChild(li); }
  const star = n => '<svg class="ic fill" style="width:14px;height:14px;vertical-align:-2px;color:#FACC15"><use href="#i-star"/></svg>'.repeat(n);
  el.cdTarget.innerHTML = [[1, lv.target], [2, lv.t2], [3, lv.t3]].map(([n, v]) => '<span>' + star(n) + ' ' + fmt(v) + ' ' + t('tl') + '</span>').join('');
}
const showCard = on => el.lvCard.classList.toggle('show', !!on);
function showCountdown(n) {
  const lv = SIM.lv;
  el.countdown.classList.add('show'); el.cdNum.textContent = n;
  el.cdSub.textContent = lv ? (lv.endless ? levelName(lv) : t('level') + ' ' + lv.id + ': ' + levelName(lv)) : '';
  el.cdNum.style.animation = 'none'; void el.cdNum.offsetWidth; el.cdNum.style.animation = '';
  G.cdShown = n;
}
function hideCountdown() { el.countdown.classList.remove('show'); G.cdShown = 0; }
function setHud(show) { el.hud.classList.toggle('hidden', !show); if (show) updateBarH(); }
function showcase() {
  G.state = 'title'; camState.mode = 'orbit';
  initLevel(LEVELS[0], 0); SIM.hour = 8.6; lastSkyHour = -99;
  setHud(false); showCard(false); hideCountdown(); showScreen('sTitle'); refreshTitle();
}
function startCampaign(fromSave) {
  AUD.init(); G.mode = 'campaign'; G.retries = 0;
  if (fromSave && runSave) { G.lvIdx = clamp(runSave.level, 0, 7); G.total = runSave.total || 0; G.stars = runSave.stars || []; } else { G.lvIdx = START_LEVEL > 0 ? START_LEVEL - 1 : 0; G.total = 0; G.stars = []; runSave = null; writeSave(); }
  enterIntro();
}
function startEndless() { AUD.init(); G.mode = 'endless'; G.wave = 1; G.endlessTotal = 0; enterIntro(); }
/** before a shift: the Route Master picker where the level fits it, else straight to the countdown */
function enterIntro() {
  const lv = curLevel();
  if (planFits(lv) && !(SIM_PRE > 0 && !FLAG.auto)) { G.state = 'route'; G.pickLv = lv; showCard(false); hideCountdown(); setHud(false); fillRoute(); showScreen('sRoute'); return; }
  setupShift();
}
const hatRec = () => { const r = lsGet(KEY_HAT); return r && typeof r === 'object' ? r : {}; };
const routeName = stops => stops.length ? stops.map(stopName).join(' → ') : t('hatClassic');
function fillRoute() {
  const lv = G.pickLv || curLevel(), keys = levelStopKeys(lv);
  PLAN.stops = PLAN.stops.filter(k => keys.includes(k));
  el.hatLv.textContent = t('level') + ' ' + lv.id + ': ' + levelName(lv);
  el.hatStopsH.textContent = t('hatStops', PLAN.stops.length);
  el.hatStops.innerHTML = ''; el.hatCh.innerHTML = '';
  keys.forEach((k, i) => {
    const b = document.createElement('button'); b.className = 'btn' + (PLAN.stops.includes(k) ? ' sel' : ''); b.dataset.stop = k;
    b.setAttribute('aria-pressed', String(PLAN.stops.includes(k))); b.innerHTML = '<b>' + (i + 1) + '</b>'; b.appendChild(document.createTextNode(stopName(k)));
    b.addEventListener('click', () => { AUD.click(); const j = PLAN.stops.indexOf(k); if (j >= 0) PLAN.stops.splice(j, 1); else if (PLAN.stops.length < 3) PLAN.stops.push(k); fillRoute(); });
    el.hatStops.appendChild(b);
  });
  for (const c of CH_KEYS) {
    const b = document.createElement('button'); b.className = 'btn' + (PLAN.ch === c ? ' sel' : ''); b.dataset.ch = c; b.textContent = t('ch_' + c);
    b.setAttribute('aria-pressed', String(PLAN.ch === c));
    b.addEventListener('click', () => { AUD.click(); PLAN.ch = c; fillRoute(); });
    el.hatCh.appendChild(b);
  }
  el.hatChd.textContent = t('chd_' + PLAN.ch);
  const r = hatRec()[lv.id];
  el.hatBestLine.textContent = r ? t('hatBest', fmt(r.profit), routeName(r.stops), t('ch_' + r.ch)) : '';
  const ok = PLAN.stops.length === 0 || PLAN.stops.length === 3;
  el.bHatGo.disabled = !ok; el.hatGoTxt.textContent = t(ok ? 'hatGo' : 'hatNeed3');
}
/** the picker's start button: lock the plan in and start the countdown */
function confirmRoute() { if (G.state !== 'route') return; if (PLAN.stops.length !== 0 && PLAN.stops.length !== 3) return; G.pickLv = null; setupShift(); }
/** sets the shift up and starts the 3-2-1 countdown (there is no blocking intro screen any more) */
function setupShift() {
  G.state = 'countdown'; camState.mode = 'play';
  const lv = curLevel(); lv.attempt = G.retries; initLevel(lv, G.lvIdx); SIM.running = false;
  camSnap(); fillCard(); showCard(lv.endless || lv.id >= 2); G.cardT = 0;
  setHud(true); updateHudStatic(); showScreen(null); lastSkyHour = -99;
  G.cd = 3; showCountdown(3);
}
function camSnap() { const P = player, fx = Math.sin(P.hd), fz = Math.cos(P.hd); camState.x = P.x - fx * 11; camState.y = P.y + 5.6; camState.z = P.z - fz * 11; camState.dist = 11; P.camHd = P.hd; }
function beginShift() {
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  hideCountdown(); G.cd = 0;
  G.state = 'play'; SIM.running = true; showScreen(null); camState.mode = 'play'; AUD.resume();
  COACH.on = G.mode === 'campaign' && !!SIM.lv && SIM.lv.id === 1;   // level 1: the first stop is coached
  G.cardT = el.lvCard.classList.contains('show') ? 9 : 0;           // the level card fades out after 9 s of driving
  toast(t('toastStart'), 'info'); el.bubbles.innerHTML = ''; bubbles.length = 0;
  if (SIM.plan && (SIM.plan.stops.length || SIM.plan.ch !== 'off')) toast(t('hatToast', routeName(SIM.plan.stops), t('ch_' + SIM.plan.ch)), 'info');
}
function pauseGame() { if (G.state !== 'play') return; G.state = 'paused'; showScreen('sPause'); input.horn = false; AUD.hornStop(); }
function resumeGame() { if (G.state !== 'paused') return; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); G.state = 'play'; showScreen(null); AUD.resume(); }
function retryCurrent() {
  G.retries++;
  if (G.mode === 'endless' && (G.lastResult && (G.lastResult.stars === 0 || G.lastResult.kind === 'wreck'))) { G.wave = 1; G.endlessTotal = 0; }
  enterIntro();
}
function toMenu() { showcase(); }
HOOK.levelEnd = res => {
  G.lastResult = res; G.state = 'end';
  let rec = false;
  const lv = res.lv, idx = G.lvIdx;
  if (G.mode === 'campaign') {
    if (res.stars > 0) {
      G.total += Math.round(res.net); G.stars[idx] = Math.max(G.stars[idx] || 0, res.stars);
      if (res.stars > (best.stars[idx] || 0)) best.stars[idx] = res.stars;
      if (res.net > (best.fares[idx] || 0)) { best.fares[idx] = Math.round(res.net); rec = true; }
      best.total = Math.max(best.total, G.total);
      runSave = idx >= 7 ? null : { level: idx + 1, total: G.total, stars: G.stars };
      writeSave();
    }
  } else if (G.mode === 'daily') {
    if (res.stars > 0 && res.kind !== 'wreck' && G.daily) G.dailyRec = G.daily.complete(Math.round(res.net));
  } else {
    if (res.stars > 0) G.endlessTotal += Math.round(res.net);
    else if (res.kind !== 'wreck') G.endlessTotal += Math.max(0, Math.round(res.net));
    if (res.stars === 0 || res.kind === 'wreck') { if (G.endlessTotal > best.endless) { best.endless = G.endlessTotal; rec = true; } writeSave(); }
  }
  // Route Master: best route profit per level (only shifts that used a 3-stop route and did not end in a wreck)
  const ro = res.route; G.hatRecord = false;
  if (ro && ro.stops.length === 3 && res.kind !== 'wreck') {
    const all = hatRec(), prev = all[lv.id];
    if (!prev || ro.profit > prev.profit) { all[lv.id] = { profit: Math.round(ro.profit), stops: ro.stops, ch: ro.ch }; lsSet(KEY_HAT, all); G.hatRecord = true; }
  }
  G.log.push({ route: ro ? ro.stops.join('>') : '', ch: ro ? ro.ch : 'off', profit: ro ? Math.round(ro.profit) : 0, dist: ro ? Math.round(ro.dist) : 0, mode: G.mode, level: lv.id, kind: res.kind, stars: res.stars, net: Math.round(res.net), fares: res.score.fares, tips: res.score.tips, pen: res.score.pen, pass: res.score.pass, dent: Math.round(res.dent), hits: res.score.hits, reds: res.score.reds, brakes: res.score.brakes, skips: res.score.skips, gaveUp: res.score.gaveUp, ped: res.score.ped, anyDrops: res.score.anyDrops, tipsLost: res.score.tipsLost });
  if (window.Arena && res.stars > 0 && res.kind !== 'wreck') {
    Arena.award('dolmus:first-shift', t('awFirst'));
    if (G.mode === 'campaign' && idx >= 7) Arena.award('dolmus:campaign', t('awCampaign'));
    if (best.stars.every(v => v >= 3)) Arena.award('dolmus:all-stars', t('awAllStars'));
  }
  let newBadges = []; try { newBadges = recordRun(res); } catch (e) { /* the leaderboard must never break the end screen */ }
  G.record = rec; fillEnd(res); for (const nb of newBadges) { const li = document.createElement('li'); li.textContent = '🏅 ' + t('badgeNew', nb); el.enTips.appendChild(li); } showScreen('sEnd'); input.horn = false; AUD.hornStop();
  if (window.Arena && Arena.complete) Arena.complete({ mount: $('#sEnd .col') });   // arena-kit v1.1: <game>/complete event + one-tap 👍/👎 under the end buttons (nothing on ?auto)
  if (res.stars > 0) setTimeout(() => AUD.star(), 300);
};
function fillEnd(res) {
  if (!res) return;
  const lv = res.lv, camp = G.mode === 'campaign', daily = G.mode === 'daily', last = camp && G.lvIdx >= 7;
  let title, sub, nextKey = null;
  if (res.kind === 'wreck') { title = t('endWreck'); sub = t('subWreck'); }
  else if (res.stars === 0) { title = t('endFail'); sub = t('subFail'); }
  else if (camp && last) { title = t('endWin'); sub = t('subWin'); nextKey = 'endless'; }
  else if (camp) { title = t('endClear'); sub = t('subClear'); nextKey = 'next'; }
  else if (daily) { title = t('endClear'); sub = G.dailyRec ? t('daily') + ' · ' + t('dailyLine', G.dailyRec.streak, G.dailyRec.best) : t('subClear'); }
  else { title = t('endClear'); sub = t('subClear'); nextKey = 'nextShift'; }
  if (!camp && !daily && (res.stars === 0 || res.kind === 'wreck')) { title = t('endEndless'); sub = t('subEndless', fmt(G.endlessTotal)); }
  el.enTitle.textContent = title; el.enSub.textContent = sub;
  el.enStars.innerHTML = [1, 2, 3].map(n => '<svg viewBox="0 0 24 24" class="' + (res.stars >= n ? 'on' : '') + '" style="animation-delay:' + (n * 0.25) + 's"><use href="#i-star"/></svg>').join('');
  const sc = res.score, rows = [[t('sFares'), fmt(sc.fares) + ' ' + t('tl'), 'pos'], [t('sTips'), fmt(sc.tips) + ' ' + t('tl'), 'pos'], [t('sPen'), (sc.pen > 0 ? '-' : '') + fmt(sc.pen) + ' ' + t('tl'), sc.pen > 0 ? 'neg' : ''], [t('sNet'), fmt(res.net) + ' ' + t('tl'), ''], [t('sPass'), String(sc.pass), ''], [t('sDent'), Math.round(res.dent) + '%', '']];
  if (daily) { /* one shift: no running total */ }
  else if (!camp) rows.push([t('sTotal'), fmt(G.endlessTotal) + ' ' + t('tl'), '']);
  else rows.push([t('sTotal'), fmt(G.total) + ' ' + t('tl'), '']);
  el.enStats.innerHTML = rows.map(r => '<span>' + r[0] + '</span><span class="' + r[2] + '">' + r[1] + '</span>').join('');
  // what cost the most, in plain words, plus the best tip and the number of "anywhere" drop-offs
  const costs = Object.entries(sc.cost || {}).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2), tl = [];
  if (costs.length) for (const [k, v] of costs) tl.push([t('tip_' + k, fmt(v)), 0]); else tl.push([t('tipClean'), 1]);
  if (sc.bestTip > 0) tl.push([t('bestTipLine', fmt(sc.bestTip)), 1]);
  if (lv.id >= 2) tl.push([t('anyDropsLine', sc.anyDrops), 1]);
  const ro = res.route;
  if (ro && planFits(lv)) {
    tl.push([t('hatLine', routeName(ro.stops), t('ch_' + ro.ch)), 1]);
    tl.push([t('hatProfit', fmt(ro.profit), fmt(ro.fares), fmt(ro.tips), fmt(ro.fuel), fmt(ro.idle)), ro.profit > 0 ? 1 : 0]);
    const r = hatRec()[lv.id];
    if (G.hatRecord && r) tl.push([t('hatNewBest', fmt(r.profit)), 1]);
    else if (r) tl.push([t('hatBest', fmt(r.profit), routeName(r.stops), t('ch_' + r.ch)), 1]);
  }
  el.enTips.innerHTML = tl.map(([txt, ok]) => '<li class="' + (ok ? 'ok' : '') + '">' + txt + '</li>').join('');
  // the white Turkish Van kitten naps on the back seat; awake and cheering on 3 stars (not loaded with ?noassets)
  if (ASSETS.enabled) { el.mascot.classList.remove('hidden'); el.mascotImg.onerror = () => el.mascot.classList.add('hidden'); el.mascotImg.src = 'assets/mascot/' + (res.stars >= 3 ? 'kedi-kutlama.png' : 'kedi-uyuyor.png'); } else el.mascot.classList.add('hidden');
  el.enRec.classList.toggle('hidden', !G.record); el.enRec.textContent = t('newRecord');
  el.bNext.classList.toggle('hidden', !nextKey); if (nextKey) el.nextTxt.textContent = t(nextKey);
  el.bRetry.querySelector('span').textContent = t(!camp && !daily && (res.stars === 0 || res.kind === 'wreck') ? 'playAgain' : 'retry');
  if (window.Arena) { const others = Arena.games.filter(g => g !== Arena.game); el.aOther.href = 'https://furkiozknn.github.io/' + others[(G.log.length * 7 + Math.max(0, Math.round(res.net))) % others.length] + '/'; }
}
function nextAction() {
  const res = G.lastResult; if (!res || res.stars === 0 || res.kind === 'wreck') return;
  G.retries = 0;
  if (G.mode === 'campaign') {
    if (G.lvIdx >= 7) { startEndless(); return; }
    G.lvIdx++; enterIntro();
  } else { G.wave++; enterIntro(); }
}

// ---- settings UI
function syncSettingsUI() {
  el.rMaster.value = Math.round(settings.master * 100); el.rMusic.value = Math.round(settings.music * 100); el.rSfx.value = Math.round(settings.sfx * 100);
  el.oMaster.textContent = el.rMaster.value + '%'; el.oMusic.textContent = el.rMusic.value + '%'; el.oSfx.textContent = el.rSfx.value + '%';
  el.bTR.classList.toggle('sel', LANG === 'tr'); el.bEN.classList.toggle('sel', LANG === 'en');
  el.bQLow.classList.toggle('sel', lowQ()); el.bQHigh.classList.toggle('sel', !lowQ());
  el.bMapH.classList.toggle('sel', settings.mapRot !== false); el.bMapN.classList.toggle('sel', settings.mapRot === false);
  el.bPedU.classList.toggle('sel', settings.mobileUnifiedPedal !== false); el.bPedS.classList.toggle('sel', settings.mobileUnifiedPedal === false);
  const ic = settings.mute || (!settings.sfxOn && !settings.musicOn) ? '#i-sfx-off' : '#i-sfx';
  el.bSound.querySelector('use').setAttribute('href', ic);
}
// ---------------------------------------------------------------- v2.1: local leaderboard + badges (own keys, old saves untouched)
const KEY_BOARD = 'arena.dolmus.board', KEY_BADGE = 'arena.dolmus.rozet';
const BADGES = ['clean', '3', 'rain', 'daily', '10'];
const badgeKey = id => id === 'clean' ? 'Clean' : id === 'rain' ? 'Rain' : id === 'daily' ? 'Daily' : id;
const boardGet = () => { const b = lsGet(KEY_BOARD); return Array.isArray(b) ? b.filter(r => r && Number.isFinite(r.net) && Number.isFinite(r.stars)).slice(0, 5) : []; };
const badgeGet = () => { const b = lsGet(KEY_BADGE); return b && typeof b === 'object' && !Array.isArray(b) ? b : {}; };
/** after a finished shift: leaderboard entry + badge checks; returns the names of badges earned right now */
function recordRun(res) {
  if (!(res.stars > 0 && res.kind !== 'wreck')) return [];
  const lv = res.lv, sc = res.score || {};
  const b = boardGet(); b.push({ net: Math.round(res.net), stars: res.stars, lv: lv.daily ? 'D' : lv.endless ? 'E' + lv.wave : String(lv.id), d: new Date().toISOString().slice(0, 10) });
  b.sort((x, y) => y.net - x.net); lsSet(KEY_BOARD, b.slice(0, 5));
  const bd = badgeGet(), got = [], n = (Number(bd.shifts) || 0) + 1; bd.shifts = n;
  const earn = id => { if (!bd[id]) { bd[id] = Date.now(); got.push(t('bg' + badgeKey(id))); } };
  if (!sc.hits && !sc.reds && !sc.brakes) earn('clean');
  if (res.stars >= 3) earn('3');
  if (!sc.hits && !lv.daily && !lv.endless && (lv.id === 3 || lv.id === 5 || lv.id === 8)) earn('rain');
  if (lv.daily) earn('daily');
  if (n >= 10) earn('10');
  lsSet(KEY_BADGE, bd);
  return got;
}
function levelLabel(c) { return c === 'D' ? t('daily') : String(c).startsWith('E') ? t('endless') + ' ' + String(c).slice(1) : t('level') + ' ' + c; }
function fillNews() {
  el.newsList.innerHTML = ''; for (const x of t('newsList')) { const li = document.createElement('li'); li.textContent = x; el.newsList.appendChild(li); }
  const b = boardGet(); el.boardList.innerHTML = '';
  if (!b.length) { const p = document.createElement('p'); p.className = 'none'; p.textContent = t('boardNone'); el.boardList.appendChild(p); }
  b.forEach((r, i) => { const li = document.createElement('li'), l = document.createElement('span'), v = document.createElement('b');
    l.textContent = (i + 1) + '. ' + levelLabel(r.lv) + ' · ' + r.d; v.textContent = fmt(r.net) + ' TL ' + '★'.repeat(Math.max(0, Math.min(3, r.stars))); li.append(l, v); el.boardList.appendChild(li); });
  const bd = badgeGet(); el.badgeList.innerHTML = '';
  for (const id of BADGES) {
    const key = badgeKey(id), li = document.createElement('li'), d = document.createElement('span'), nm = document.createElement('b'), sm = document.createElement('small');
    li.className = bd[id] ? 'on' : 'off'; nm.textContent = (bd[id] ? '🏅 ' : '🔒 ') + t('bg' + key); sm.textContent = t('bg' + key + 'D', Math.min(10, Number(bd.shifts) || 0));
    d.append(nm, sm); li.appendChild(d); if (bd[id]) { const k = document.createElement('span'); k.textContent = t('bgOn'); li.appendChild(k); } el.badgeList.appendChild(li);
  }
}
function openNews() { fillNews(); showScreen('sNews'); }
function closeNews() { showScreen('sTitle'); }
function openSettings(from) { G.settingsFrom = from; syncSettingsUI(); showScreen('sSettings'); }
function closeSettings() { saveSettings(); showScreen(G.settingsFrom === 'pause' ? 'sPause' : 'sTitle'); }
function toggleMusic() { settings.musicOn = !settings.musicOn; saveSettings(); AUD.applyGains(); toast((LANG === 'tr' ? 'Müzik ' : 'Music ') + (settings.musicOn ? (LANG === 'tr' ? 'açık' : 'on') : (LANG === 'tr' ? 'kapalı' : 'off')), 'info'); syncSettingsUI(); }
function toggleSfx() { settings.sfxOn = !settings.sfxOn; saveSettings(); AUD.applyGains(); toast((LANG === 'tr' ? 'Efektler ' : 'Effects ') + (settings.sfxOn ? (LANG === 'tr' ? 'açık' : 'on') : (LANG === 'tr' ? 'kapalı' : 'off')), 'info'); syncSettingsUI(); }
function toggleFullscreen() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { /* ignore */ } }

// ---- HUD
let hudT = 0;
function updateHudStatic() {
  const lv = SIM.lv; if (!lv) return;
  el.stLevel.textContent = lv.daily ? 'D' : lv.endless ? 'E' + lv.wave : String(lv.id);
  const bars = el.fareBar.querySelectorAll('u'); bars[0].style.left = (lv.target / lv.t3 * 100) + '%'; bars[1].style.left = (lv.t2 / lv.t3 * 100) + '%';
  buildSeatStrip();
}
function buildSeatStrip() {
  el.seatsStrip.innerHTML = '';
  for (let i = 0; i < SEATS; i++) { const d = document.createElement('div'); d.className = 'seat'; d.innerHTML = '<span></span><i></i><b class="mood"></b><em class="pf"></em>'; el.seatsStrip.appendChild(d); }
  const dv = document.createElement('div'); dv.className = 'seat drv' + (faces3dOk ? ' face3d' : ''); dv.innerHTML = '<svg class="ic"><use href="#i-wheel"/></svg>' + (faces3dOk ? '<img class="f3d" src="assets/3d/sofor-yuz.webp" alt="">' : ''); el.seatsStrip.appendChild(dv);   // the coins of the fare chain end here
  coinEls.length = 0;
}
const chipCenter = i => { const c = el.seatsStrip.children[i]; return c ? { x: c.offsetLeft + c.offsetWidth / 2, y: c.offsetTop + c.offsetHeight / 2 } : { x: 0, y: 0 }; };
/** each frame: place the coins of the fare chain; they hop from seat chip to seat chip toward the driver */
function updateCoins() {
  const ch = player.chain;
  while (coinEls.length < ch.length) { const d = document.createElement('i'); d.className = 'coin'; el.seatsStrip.appendChild(d); coinEls.push(d); }
  for (let i = 0; i < coinEls.length; i++) {
    const d = coinEls[i], c = ch[i];
    if (!c) { if (d.style.display !== 'none') d.style.display = 'none'; continue; }
    const hops = c.path.length - 1, f = clamp(c.t / c.dur, 0, 0.999) * hops, h = Math.floor(f), fr = f - h, a = chipCenter(c.path[h]), b = chipCenter(c.path[h + 1]);
    d.style.display = 'block'; d.style.left = (a.x + (b.x - a.x) * fr) + 'px'; d.style.top = (a.y + (b.y - a.y) * fr - Math.sin(fr * Math.PI) * 12) + 'px';
  }
}
function updateHUD(dt) {
  hudT -= dt; const P = player; if (!SC) return;
  // speedo each frame
  const kmh = Math.round(Math.abs(P.speed) * 3.6); el.spVal.textContent = kmh;
  el.spArc.setAttribute('stroke-dasharray', (198 * clamp(Math.abs(P.speed) / 21, 0, 1)).toFixed(1) + ' 264');
  el.spNeedle.setAttribute('transform', 'rotate(' + (-135 + 270 * clamp(Math.abs(P.speed) / 21, 0, 1)).toFixed(1) + ' 50 50)');
  if (hudT > 0) return; hudT = 0.1;
  const lv = SIM.lv, left = Math.max(0, SHIFT - SIM.t), m = Math.floor(left / 60), s = Math.floor(left % 60);
  const hh = Math.floor(SIM.hour % 24), mm = Math.floor((SIM.hour % 1) * 60);
  el.stClock.textContent = m + ':' + String(s).padStart(2, '0') + ' · ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  const net = Math.round(netScore());
  el.stFare.innerHTML = '<span class="lcd">' + fmt(net) + '</span><span class="of">/ ' + fmt(lv.target) + ' ' + t('tl') + '</span>';
  el.fareBar.firstElementChild.style.width = clamp(net / lv.t3 * 100, 0, 100) + '%';
  el.stSeats.textContent = (P.seats.length + P.boarding) + '/' + SEATS;
  el.dentBar.firstElementChild.style.width = P.dent + '%';
  const seatEls = el.seatsStrip.children;
  for (let i = 0; i < SEATS; i++) {
    const se = player.seats.find(q => q.seatIdx === i), d = seatEls[i];
    if (!d) continue;
    const num = d.children[0], bar = d.children[1], mood = d.children[2], pf = d.children[3], mk = se && se.mood ? se.mood : '';
    if (pf && pf.tagName === 'EM') { const fk = faces3dOk && se ? FACE3D[se.vip ? 'vip' : se.ptype] || '' : ''; if (pf.dataset.f !== fk) { pf.dataset.f = fk; pf.classList.toggle('has', !!fk); pf.style.backgroundImage = fk ? 'url(assets/3d/' + fk + '-yuz.webp)' : ''; } }
    if (mood && mood.dataset.m !== mk) { mood.dataset.m = mk; mood.className = 'mood ' + mk; mood.textContent = mk === 'like' ? '\u266B' : mk === 'dislike' ? '\u2639' : ''; }   // radio mood: note = likes the channel, frown = dislikes it
    if (se) {
      d.classList.add('on'); d.style.background = '#' + (se.vip ? 0xFACC15 : se.shirt).toString(16).padStart(6, '0'); num.textContent = String(se.dest + 1) + (se.any ? '?' : '');
      const fr = clamp(se.ridePat / se.ridePatMax, 0, 1); bar.style.background = fr > 0.5 ? '#5ee08a' : fr > 0.25 ? '#FACC15' : '#ff5a4a'; bar.style.right = (3 + (1 - fr) * 20) + 'px';
    } else { d.classList.remove('on'); d.style.background = ''; num.textContent = ''; bar.style.right = '100%'; }
  }
  // guide
  if (G.cardT > 0 && G.state === 'play') { G.cardT -= 0.1; if (G.cardT <= 0) showCard(false); }
  if (COACH.on && (P.seats.length || P.boarding || SC.pass || SIM.t > 90)) COACH.on = false;
  const g = guideTarget(); SIM.guide = g;
  const coachNow = !!(COACH.on && g && g.stop && g.stop.idx === 0 && g.kind !== 'cruise');
  el.guideBox.classList.toggle('coach', coachNow);
  if (g && G.state === 'play') {
    el.guideBox.style.display = 'flex';
    const dx = g.x - P.x, dz = g.z - P.z, fx = Math.sin(P.camHd), fz = Math.cos(P.camHd), ang = Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz);
    el.guideArrow.style.transform = 'rotate(' + ang + 'rad)';
    const name = g.stop ? stopName(g.stop.key) : (LANG === 'tr' ? 'El sallayan yolcu' : 'Waving passenger');
    el.guideTxt.innerHTML = name + '<small>' + (coachNow ? t(document.body.classList.contains('touch') ? 'coachTouch' : 'coach') : t(g.kind === 'drop' ? 'guideDrop' : g.kind === 'pick' ? 'guidePick' : 'guideCruise') + ' · ' + t('guideM', Math.round(hyp(dx, dz)))) + '</small>';
  } else el.guideBox.style.display = 'none';
}

// ---- input
const keys = {};
let touchSteer = 0, touchGas = 0, touchBrake = 0, touchHorn = false;
function readInput() {
  if (FLAG.auto && G.state === 'play') return;
  let st = 0;
  if (keys.ArrowLeft || keys.KeyA) st -= 1; if (keys.ArrowRight || keys.KeyD) st += 1;
  const o = { steer: st + touchSteer, throttle: (keys.ArrowUp || keys.KeyW ? 1 : 0), brake: (keys.ArrowDown || keys.KeyS ? 1 : 0), horn: !!keys.KeyH || touchHorn };
  o.throttle = Math.max(o.throttle, touchGas); o.brake = Math.max(o.brake, touchBrake);
  if (tvFrame.buttons.LEFT) o.steer -= 1;
  if (tvFrame.buttons.RIGHT) o.steer += 1;
  if (tvFrame.buttons.UP) o.throttle = 1;
  if (tvFrame.buttons.DOWN || tvFrame.buttons.B) o.brake = 1;
  o.horn ||= tvFrame.buttons.X;
  input.steer = clamp(o.steer, -1, 1); input.throttle = o.throttle; input.brake = o.brake; input.horn = o.horn;
}
window.addEventListener('keydown', e => {
  if (document.querySelector('.arena-modal')) return;   // the arena-kit panel handles its own keys (Esc closes it)
  // modal focus trap for active screens (#sPause, #sSettings, #sEnd, #sTitle) and #lvCard when focused
  if (e.key === 'Tab') {
    const sc = document.querySelector('.screen.show') || (el.lvCard.classList.contains('show') && el.lvCard.contains(document.activeElement) ? el.lvCard : null);
    if (sc) {
      const f = [...sc.querySelectorAll('button:not([disabled]):not(.hidden),input:not([disabled]),a[href]')].filter(n => n.offsetParent !== null);
      if (f.length) {
        const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
      }
      return;
    }
  }
  if (e.repeat && e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') { if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault(); return; }
  const tgt = e.target && e.target.tagName;
  if (e.code === 'Space') { if (G.state === 'play') { e.preventDefault(); doorPress(); } else if (G.state === 'countdown') { e.preventDefault(); beginShift(); } return; }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && G.state === 'play') e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (G.state === 'play') pauseGame(); else if (G.state === 'paused') resumeGame(); else if (G.state === 'title' && el.sSettings.classList.contains('show')) closeSettings();
    else if (el.sSettings.classList.contains('show')) closeSettings();
    else if (el.sNews.classList.contains('show')) closeNews();
  }
  else if (e.code === 'KeyM') toggleMusic(); else if (e.code === 'KeyX') toggleSfx(); else if (e.code === 'KeyL') setLang(LANG === 'tr' ? 'en' : 'tr'); else if (e.code === 'KeyN') { setMapMode(settings.mapRot === false); toast(t(settings.mapRot === false ? 'mapNorth' : 'mapHead'), 'info'); }
  else if (e.code === 'Enter' && G.state === 'countdown' && tgt !== 'BUTTON') beginShift();
  AUD.init(); AUD.resume();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; input.horn = false; AUD.hornStop(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') pauseGame(); });
// arena-kit: the same pause when the tab is hidden (the game's own listener stays); on 'resume' the pause menu stays up.
// No Arena.perf.attach here: the game's own fps watchdog (qualityWatch) already drops the resolution on slow GPUs.
// The game has no reduced-motion flag of its own to map.
if (window.Arena) Arena.on('pause', () => { if (G.state === 'play') pauseGame(); });
if (window.Arena) Arena.on('settings', () => { if (calm()) { camState.shake = 0; el.hurt.style.opacity = 0; } });   // "reduce motion" switched on mid-shift: stop a running shake now
window.addEventListener('pointerdown', () => { AUD.init(); AUD.resume(); }, { once: false });
function enableTouch() { document.body.classList.add('touch'); applyLang(); resize(); }
window.addEventListener('touchstart', () => enableTouch(), { once: true, passive: true });
if (FLAG.touch || (matchMedia && matchMedia('(pointer:coarse)').matches)) enableTouch();   // touch devices get the touch controls (and no keyboard hint) before the first tap
(function touchUI() {
  const st = el.steer, knob = st.firstElementChild;
  // slider ARIA range attributes for #steer
  st.setAttribute('aria-valuemin', '-100'); st.setAttribute('aria-valuemax', '100'); st.setAttribute('aria-valuenow', '0');
  const setS = clientX => { const r = st.getBoundingClientRect(), u = clamp((clientX - r.left - r.width / 2) / (r.width / 2 - 26), -1, 1); touchSteer = Math.abs(u) < 0.06 ? 0 : u; knob.style.marginLeft = (u * (r.width / 2 - 26) - 26) + 'px'; st.setAttribute('aria-valuenow', String(Math.round(touchSteer * 100))); };
  st.addEventListener('pointerdown', e => { st.setPointerCapture(e.pointerId); setS(e.clientX); e.preventDefault(); });
  st.addEventListener('pointermove', e => { if (st.hasPointerCapture(e.pointerId)) setS(e.clientX); });
  const rel = e => { touchSteer = 0; knob.style.marginLeft = '-26px'; st.setAttribute('aria-valuenow', '0'); };
  st.addEventListener('pointerup', rel); st.addEventListener('pointercancel', rel);
  const pedal = (node, on, off) => { node.addEventListener('pointerdown', e => { node.setPointerCapture(e.pointerId); node.classList.add('on'); on(); e.preventDefault(); }); const f = () => { node.classList.remove('on'); off(); }; node.addEventListener('pointerup', f); node.addEventListener('pointercancel', f); node.addEventListener('lostpointercapture', f); };
  pedal(el.pGas, () => { touchGas = 1; }, () => { touchGas = 0; });
  pedal(el.pBrake, () => { touchBrake = 1; }, () => { touchBrake = 0; });
  pedal(el.tHorn, () => { touchHorn = true; }, () => { touchHorn = false; });
  // unified pedal (settings.mobileUnifiedPedal): one vertical slider drives the same touchGas / touchBrake the two pedals used.
  // Track centre = neutral, up = gas, down = brake; analog, full power at ~80% of the travel; lifting the thumb returns to neutral.
  const pu = el.pUni, puKnob = pu.querySelector('i'), PU_DEAD = 0.08, PU_FULL = 0.8;
  let puRect = null, puHalf = 1, puMode = '';
  const setP = clientY => {
    const u = clamp((puRect.top + puRect.height / 2 - clientY) / puHalf, -1, 1), a = Math.abs(u);
    const mag = a < PU_DEAD ? 0 : Math.min(1, (a - PU_DEAD) / (PU_FULL - PU_DEAD));
    touchGas = u > 0 ? mag : 0; touchBrake = u < 0 ? mag : 0;
    puKnob.style.transform = 'translateY(' + (-u * puHalf).toFixed(1) + 'px)';
    const m = touchBrake > 0 ? 'brake' : touchGas > 0 ? 'gas' : '';
    if (m !== puMode) { puMode = m; pu.classList.toggle('brake', m === 'brake'); }
    pu.setAttribute('aria-valuenow', String(Math.round(u * 100)));
  };
  pu.addEventListener('pointerdown', e => { puRect = pu.getBoundingClientRect(); puHalf = Math.max(1, puRect.height / 2 - 30); pu.setPointerCapture(e.pointerId); pu.classList.add('drag'); setP(e.clientY); e.preventDefault(); });
  pu.addEventListener('pointermove', e => { if (puRect && pu.hasPointerCapture(e.pointerId)) setP(e.clientY); });
  const puRel = () => { touchGas = 0; touchBrake = 0; puRect = null; puMode = ''; pu.classList.remove('drag', 'brake'); puKnob.style.transform = ''; pu.setAttribute('aria-valuenow', '0'); };
  pu.addEventListener('pointerup', puRel); pu.addEventListener('pointercancel', puRel); pu.addEventListener('lostpointercapture', puRel);
  const applyPedalMode = () => { document.body.classList.toggle('uped', settings.mobileUnifiedPedal !== false); puRel(); el.pGas.classList.remove('on'); el.pBrake.classList.remove('on'); };
  applyPedalMode();
  for (const [btn, v] of [[el.bPedU, true], [el.bPedS, false]]) btn.addEventListener('click', () => { AUD.init(); AUD.click(); settings.mobileUnifiedPedal = v; saveSettings(); applyPedalMode(); syncSettingsUI(); });
  el.tDoor.addEventListener('pointerdown', e => { el.tDoor.classList.add('on'); if (G.state === 'play') doorPress(); e.preventDefault(); });
  el.tDoor.addEventListener('pointerup', () => el.tDoor.classList.remove('on'));
})();

// ---- buttons
const on = (id, fn) => document.getElementById(id).addEventListener('click', e => { AUD.init(); AUD.click(); fn(e); });
on('bPlay', () => { const now = performance.now(); if (runSave && !(newArm && now - newArm < 4000)) { newArm = now; el.playTxt.textContent = t('newGameSure'); setTimeout(() => { if (G.state === 'title' && newArm === now) refreshTitle(); }, 4000); return; } newArm = 0; startCampaign(false); }); on('bCont', () => startCampaign(true)); on('bEndless', () => startEndless());
on('bNews', () => openNews()); on('bNewsBack', () => closeNews()); on('bSettingsT', () => openSettings('title')); on('bLangT', () => setLang(LANG === 'tr' ? 'en' : 'tr'));
on('bCardX', () => showCard(false));
on('bPause', () => { if (G.state === 'play') pauseGame(); else if (G.state === 'paused') resumeGame(); });
on('bSound', () => { settings.mute = !settings.mute; saveSettings(); AUD.applyGains(); syncSettingsUI(); });
on('bLang', () => setLang(LANG === 'tr' ? 'en' : 'tr'));
on('bResume', () => resumeGame()); on('bRestart', () => { G.retries++; setupShift(); beginShift(); });   // restart keeps the chosen route and channel
on('bHatGo', () => confirmRoute()); on('bMenuR', () => toMenu());
on('bSettingsP', () => openSettings('pause')); on('bMenuP', () => toMenu());
on('bSetBack', () => closeSettings());
on('bTR', () => { setLang('tr'); syncSettingsUI(); }); on('bEN', () => { setLang('en'); syncSettingsUI(); });
on('bQLow', () => { settings.quality = 'low'; settings.qualityManual = true; autoLow = false; saveSettings(); applyQuality(); syncSettingsUI(); }); on('bQHigh', () => { settings.quality = 'high'; settings.qualityManual = true; autoLow = false; saveSettings(); applyQuality(); syncSettingsUI(); });
on('bFull', () => toggleFullscreen());
function setMapMode(rot) { settings.mapRot = rot; saveSettings(); syncSettingsUI(); if (G.state === 'play' || G.state === 'paused' || G.state === 'countdown') drawMinimap(); }
on('bMapH', () => setMapMode(true)); on('bMapN', () => setMapMode(false));
document.getElementById('minimap').addEventListener('click', () => { AUD.init(); AUD.click(); setMapMode(settings.mapRot === false); toast(t(settings.mapRot === false ? 'mapNorth' : 'mapHead'), 'info'); });
// Portals (arena-kit v1.3 Arena.portal): an interstitial may play between shifts, on the end screen where the game
// already waits. On the game's own site midgame() resolves false at once and nothing changes. One tap = one action.
let endBusy = false;
const afterBreak = (f) => () => {
  if (!(window.Arena && Arena.portal && Arena.portal.name !== 'none')) return f(); // own site: synchronous, as before
  if (endBusy) return; endBusy = true;
  const ad = Arena.portal.midgame();
  ad.catch(() => false).then(() => { endBusy = false; f(); });
};
on('bNext', afterBreak(() => nextAction())); on('bRetry', afterBreak(() => retryCurrent())); on('bMenuE', () => toMenu());
on('bDaily', () => startDaily()); on('bA11y', () => { if (window.Arena) Arena.openSettings(); }); on('bShare', () => shareResult());
function shareResult() {
  const r = G.lastResult; if (!r || !window.Arena) return;
  const lv = r.lv, name = lv.daily ? t('lvD') + ' ' + lv.daily : lv.endless ? levelName(lv) : t('level') + ' ' + lv.id + ': ' + levelName(lv);
  return Arena.share({ title: 'Dolmuş', lines: [name, t('shareStars', r.stars, fmt(r.net))], url: 'https://furkiozknn.github.io/dolmus/' + (lv.daily ? '?d=' + lv.daily : '') });
}
for (const [id, key, out] of [['rMaster', 'master', 'oMaster'], ['rMusic', 'music', 'oMusic'], ['rSfx', 'sfx', 'oSfx']]) {
  el[id].addEventListener('input', () => { settings[key] = el[id].value / 100; el[out].textContent = el[id].value + '%'; AUD.applyGains(); saveSettings(); });
}
window.addEventListener('resize', () => resize());
window.addEventListener('orientationchange', () => setTimeout(resize, 100));

// ---------------------------------------------------------------- autopilot (?auto): a real driver that uses the same controls and rules
const BOT = { uiT: 0, stuck: 0, rev: 0, revSteer: 1, waitT: 0 };
const BOT_GAP_LOOKS = [4, 8, 13, 19, 27];
function botGap(path, s) {
  const L = path.L; let gap = 1e9;
  for (const li of path.lights) {
    const d = fwdDist(L, s, li.s), dd = (d > L - 3 ? d - L : d) - 2.6;
    if (dd < -1 || dd > 55) continue;
    const st = sigState(SIGNALS[li.ap.sig], li.ap.axis);
    if (st === 'r' || (st === 'y' && dd > player.vf * player.vf / (2 * 4.5) + 2)) gap = Math.min(gap, Math.max(dd, 0));
  }
  for (const k of BOT_GAP_LOOKS) {
    if (k - 1 >= gap) break;
    pathAt(path, s + 2.4 + k, _tp);
    let hit = false;
    for (const a of AG) {
      if (a.kind === 'player') continue;
      const dx = a.x - _tp.x, dz = a.z - _tp.z, rr = a.r + 1.5;
      if (dx * dx + dz * dz < rr * rr) { hit = true; break; }
    }
    if (hit) { gap = Math.min(gap, k - 1); break; }
  }
  return gap;
}
/** the autopilot's Route Master choice: 3 stops spread around the loop and Arabesk (?ch=<channel> picks another, ?plan=off plays classic) */
function botPlan(lv) {
  if (Q.get('plan') === 'off') return { stops: [], ch: 'off' };
  const keys = levelStopKeys(lv), n = keys.length;
  return { stops: [keys[0], keys[Math.floor(n / 3)], keys[Math.floor(2 * n / 3)]], ch: CHANNELS[Q.get('ch')] ? Q.get('ch') : 'arabesk' };
}
function botTick(dt) {
  if (BOT.lastState !== G.state) { BOT.lastState = G.state; BOT.uiT = 0; }
  BOT.uiT += dt;
  const act = (th, fn) => { if (BOT.uiT > th) { BOT.uiT = 0; fn(); } };
  if (G.done) return;
  if (G.state === 'title') { act(0.8, () => { if (Q.get('mode') === 'daily' && window.Arena) startDaily(); else startCampaign(false); }); return; }
  if (G.state === 'countdown') { beginShift(); return; }
  if (G.state === 'route') { act(0.5, () => { PLAN = botPlan(G.pickLv || curLevel()); fillRoute(); confirmRoute(); }); return; }
  if (G.state === 'paused') { resumeGame(); return; }
  if (G.state === 'end') {
    act(1.2, () => {
      const r = G.lastResult;
      if (G.mode === 'campaign' && G.lvIdx >= 7 && r.stars > 0) { G.done = true; return; }
      if (G.mode === 'daily' && r.stars > 0 && r.kind !== 'wreck') { G.done = true; return; }
      if (Q.has('cal')) { if (G.lvIdx >= 7) { G.done = true; return; } G.lvIdx++; G.retries = 0; enterIntro(); return; }
      if (r.stars > 0 && r.kind !== 'wreck') nextAction();
      else { if (G.retries >= 3) { G.done = true; G.failed = true; return; } retryCurrent(); }
    });
    return;
  }
  if (G.state !== 'play') return;
  const P = player, path = SIM.route, sp = P.vf;
  input.horn = false;
  if (BOT.rev > 0) { BOT.rev -= dt; input.throttle = 0; input.brake = 1; input.steer = BOT.revSteer; return; }
  if (P.door.state !== 'closed' || P.stopReq || P.boarding > 0) { input.throttle = 0; input.brake = 0; input.steer = 0; BOT.stuck = 0; return; }
  const look = 6 + Math.abs(sp) * 0.5;
  pathAt(path, P.routeS + look, _tp);
  const ang = wrapAng(Math.atan2(_tp.x - P.x, _tp.z - P.z) - P.hd);
  input.steer = clamp(-ang * 2.2, -1, 1);
  let vT = Math.min(pathV(path, P.routeS + look * 1.5) * 1.1, 16) * (SIM.rain > 0.4 ? 0.82 : 1);
  const gap = botGap(path, P.routeS);
  if (gap < 1e8) vT = Math.min(vT, Math.sqrt(2 * 4 * Math.max(gap - 1.0, 0)));
  const g = guideTarget();
  if (g && g.kind !== 'cruise' && g.d < 90) {
    vT = Math.min(vT, Math.sqrt(2 * 3.5 * Math.max(g.d - 3, 0)) + 2.0);
    if (g.d < 16 && sp < 11 && hasBusiness()) doorPress();
  }
  const e = vT - sp;
  input.throttle = e > 0.2 ? clamp(e * 0.6, 0, 1) : 0;
  input.brake = e < -0.8 ? clamp((-e - 0.8) * 0.3, 0, 0.7) : 0;
  if (gap < 7 && sp > 3 && vT < sp - 3) input.brake = Math.max(input.brake, 0.9);
  if (Math.abs(sp) < 0.4 && gap > 4 && vT > 1) BOT.stuck += dt; else BOT.stuck = 0;
  if (BOT.stuck > 6) { BOT.stuck = 0; BOT.rev = 1.5; BOT.revSteer = (R() < 0.5 ? -1 : 1); }
}

// ---------------------------------------------------------------- main loop
let lastT = performance.now(), acc = 0, fpsS = 60, ambT = 6, frameN = 0;
// quality watchdog: on High, average the real frame rate over ~4 s of play (after a 1 s warm-up); below 45 fps drop to Low once per session and say so.
// A quality the player picked by hand (settings.qualityManual) is never overridden.
const QW = { done: false, t: 0, n: 0, t0: 0 };
function qualityWatch(now, dt) {
  if (QW.done || G.state !== 'play') return;
  if (lowQ() || settings.qualityManual || document.hidden) { QW.done = true; return; }
  QW.t += dt;
  if (QW.t < 1) return;
  if (!QW.t0) { QW.t0 = now; QW.n = 0; return; }
  QW.n++;
  if (now - QW.t0 < 4000) return;
  QW.done = true;
  const fps = QW.n / ((now - QW.t0) / 1000);
  G.qwFps = fps;
  if (fps < 45) { autoLow = true; applyQuality(); syncSettingsUI(); toast(t('toastAutoLow'), 'info'); }
}
const FIXED = 1 / 60;
// START offers a quick shift; A keeps the upstream route picker and title options available.
function suspendTv() {
  for (const key of Object.keys(keys)) keys[key] = false;
  if (G.state === 'play') pauseGame();
}
const tvPad = createController({ keyboard: true, width: 160, top: '92px', onSuspend: suspendTv, onCancel: suspendTv });
let tvFrame = tvPad.peek(), tvFrames = 0;
const tvGl = renderer?.getContext?.(), tvVersion = tvGl?.getParameter(tvGl.VERSION) || '';
function tvSnapshot() {
  return { game: 'dolmus', renderer: 'webgl2', webglVersion: tvVersion, ready: !!window.__dolmusReady, loading: !window.__dolmusReady, errors: [...G.errors], frames: tvFrames,
    canvasWidth: tvGl?.drawingBufferWidth || 0, canvasHeight: tvGl?.drawingBufferHeight || 0,
    stage: ({ play: 'playing', paused: 'paused', end: 'ended' })[G.state] || 'menu', paused: G.state === 'paused', controller: tvPad.peek(),
    gameplay: { x: player.x, z: player.z, speed: player.speed, steer: player.steer, passengers: player.seats.length, horns: G.horns, door: player.door.state, horn: player.hornOn } };
}
window.JoystickGameQA = { snapshot: tvSnapshot };
function pollTv() {
  tvFrames++;
  tvFrame = tvPad.poll();
  const p = tvFrame.pressed;
  if (tvFrame.cancelled || navigateAccessibility(tvFrame)) return;
  const menu = document.querySelector('.screen.show');
  if (G.state === 'play') {
    if (p.START) pauseGame();
    else if (p.A) doorPress();
    if (p.Y) setMapMode(settings.mapRot === false);
  } else if (menu?.id === 'sTitle' && p.START && window.__dolmusReady) {
    startCampaign(!!runSave);
    if (G.state === 'route') el.bHatGo.click();
    if (G.state === 'countdown') beginShift();
  } else if (G.state === 'countdown' && (p.START || p.A)) {
    beginShift();
  } else if (menu) {
    const primary = menu.querySelector('.btn.primary:not(:disabled)') || menu.querySelector('button:not(:disabled)');
    const back = { sTitle: () => window.PureGameHost?.exit?.(), sPause: resumeGame, sSettings: closeSettings, sNews: closeNews,
      sRoute: () => el.bMenuR.click(), sEnd: () => el.bMenuE.click() }[menu.id];
    navigateMenu(tvFrame, menu, primary, back);
  }
  tvPad.setPlaying(G.state === 'play');
  if (tvFrames % 6 === 0 && window.PureGameHost?.publish) {
    // The phone state channel is capped at 4096 bytes. Room QR data belongs to the local panel.
    const { game, stage, paused, gameplay } = tvSnapshot();
    window.PureGameHost.publish(JSON.stringify({ game, stage, paused, gameplay }));
  }
}

function frame(now) {
  pollTv();
  requestAnimationFrame(frame);
  let dt = (now - lastT) / 1000; lastT = now; if (!(dt > 0)) dt = 0.016; dt = Math.min(dt, 0.1);
  if (document.hidden) return;
  if (G.state === 'loading') return;
  fpsS += (1 / Math.max(dt, 1e-3) - fpsS) * 0.05;
  qualityWatch(now, dt);
  if (FLAG.auto) botTick(dt); else readInput();
  if (G.state === 'countdown') { G.cd -= dt; const n = Math.ceil(G.cd); if (n > 0 && n !== G.cdShown) showCountdown(n); if (G.cd <= 0) beginShift(); }
  if (G.state === 'play' || G.state === 'title') {
    acc += dt; let n = 0;
    while (acc >= FIXED && n < 4) { stepSim(FIXED); acc -= FIXED; n++; }
    if (acc > FIXED * 4) acc = 0;
  }
  const active = G.state === 'play';
  AUD.update(Math.abs(player.vf), active ? player.thr : 0, player.load, SIM.rain, 0, active, player.skid);
  if (active) { ambT -= dt; if (ambT <= 0) { ambT = 6 + Math.random() * 9; AUD.honk(280 + Math.random() * 120, 0.25, 0.035); if (Math.random() < 0.15) AUD.ferry(); } }
  syncRender(G.state === 'paused' ? 0 : dt);
  if (G.state !== 'title') { updateHUD(dt); updateBubbles(dt); updateCoins(); } else updateBubbles(dt);
  if (G.state === 'play' || G.state === 'paused' || G.state === 'countdown') { if ((frameN++ & 1) === 0) drawMinimap(); }
  if (FX) FX.render(); else renderer.render(scene, camera);
  if (FLAG.debug) debugOverlay();
}
function debugOverlay() {
  const i = renderer.info.render;
  el.dbg.style.display = 'block';
  el.dbg.textContent = 'fps ' + fpsS.toFixed(0) + ' · calls ' + i.calls + ' · tris ' + i.triangles + ' · pts ' + i.points + '\n' +
    'state ' + G.state + ' · lv ' + (SIM.lv ? SIM.lv.id : '-') + ' · t ' + SIM.t.toFixed(1) + ' · net ' + (SC ? Math.round(netScore()) : 0) + '/' + (SIM.lv ? SIM.lv.target : 0) + ' · dent ' + Math.round(player.dent) + '\n' +
    'cars ' + SIM.cars.length + ' peds ' + SIM.peds.length + ' seats ' + player.seats.length + ' rain ' + SIM.rain.toFixed(2) + '\n' +
    'results ' + G.log.map(r => r.level + ':' + r.stars + '★/' + r.net).join(' ') + (G.done ? ' · DONE' : '') + '\n' +
    'errors ' + G.errors.length + (G.errors.length ? '\n' + G.errors.slice(-3).join('\n') : '');
}
window.addEventListener('error', e => { G.errors.push((e.message || 'error') + ' @' + (e.lineno || '?') + ':' + (e.colno || '?')); });
window.addEventListener('unhandledrejection', e => { G.errors.push('promise: ' + (e.reason && e.reason.message || e.reason)); });

// fast-forward without rendering
window.dolmusSim = function (seconds) {
  const dt = 1 / 30, n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    if (G.done) break;
    if (FLAG.auto) botTick(dt); else if (G.state === 'play') readInput();
    if (G.state === 'play' || G.state === 'title') stepSim(dt);
  }
  return window.dolmus;
};
window.dolmus = {
  G, SIM, player, input, AUD, STR, WORLD, ASSETS, DBG, camClear, camState, staticHits, obAll, scene, renderer, camera, COACH, voiceRecent, curbCheck, anywhereRiders, doorPress, closeDoor, forfeitChain, landCoin, HOOK,
  get state() { return G.state; }, get level() { return SIM.lv && SIM.lv.id; }, get time() { return SIM.t; },
  get muavin() { return OBJ.muavin; }, get roofSign() { return OBJ.roofSign; }, get routeSignName() { return currentRoofRoute; },
  get net() { return SC ? netScore() : 0; }, get score() { return SC; }, get seats() { return player.seats.length; }, get dent() { return player.dent; },
  get speed() { return player.speed; }, get log() { return G.log; }, get done() { return G.done; }, get errors() { return G.errors; },
  get hour() { return SIM.hour; }, get rain() { return SIM.rain; },
  start(lv) { if (lv) G.lvIdx = lv - 1; startCampaign(false); if (lv) { G.lvIdx = lv - 1; enterIntro(); } if (G.state === 'route') confirmRoute(); beginShift(); },
  get plan() { return PLAN; }, set plan(p) { PLAN = { stops: (p && p.stops || []).slice(), ch: p && CHANNELS[p.ch] ? p.ch : 'off' }; }, get simPlan() { return SIM.plan; },
  CHANNELS, PTRAIT, levelStopKeys, confirmRoute, fillRoute, KEY_HAT,
  get gpu() { try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (err) { return '?'; } },
  stats() { return { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, fps: fpsS, cars: SIM.cars.length, peds: SIM.peds.length }; },
};

// arena-core v2 test contract: window.__game.read() / step(seconds) for bots, gates and ?capture recordings
if (window.ArenaCore) ArenaCore.test.kur({ read: () => ({ fps: fpsS, state: G.state, done: G.done, errors: G.errors.slice(), fx: FX && FX.info }), step: s => window.dolmusSim(s) });

// ---- stil-3d: chibi pictures from the song video's world (assets/3d, Leonardo AI). Missing files keep the SVG / plain look.
const FACE3D = { student: 'ogrenci', grandmother: 'nine', shopkeeper: 'esnaf', tourist: 'turist', commuter: 'memur', vip: 'memur' };
let faces3dOk = false;
function load3dFaces() {
  document.body.classList.add('a3d');
  for (const im of document.querySelectorAll('img.f3d[data-src]')) {
    im.onload = () => { im.hidden = false; if (im.dataset.swap === 'prev' && im.previousElementSibling) im.previousElementSibling.style.display = 'none'; };
    im.onerror = () => { im.hidden = true; };
    im.src = im.dataset.src;
  }
  const probe = new Image(); probe.onload = () => { faces3dOk = true; if (el.seatsStrip.children.length) buildSeatStrip(); }; probe.src = 'assets/3d/sofor-yuz.webp';
}
// ---------------------------------------------------------------- boot
async function boot() {
  const stages = [0, 1, 2, 3, 4];
  loadTotal = stages.length + 3;
  const yieldUI = () => new Promise(r => setTimeout(r, 0));
  const step = async fn => { fn(); loadN++; el.playTxt.textContent = t('loading', loadN, loadTotal); await yieldUI(); };
  applyLang(); syncSettingsUI();
  if (glFail) { el.playTxt.textContent = t('play'); el.bPlay.disabled = true; G.errors.push('WebGL unavailable'); __glGuard.fail('gl', LANG); return; }
  WR = mulberry(1234);
  for (const s of stages) await step(() => buildWorldGeometry(s));
  await step(() => { buildScene(); applyQuality(); });
  await step(() => { buildMinimapBase(); });
  await step(() => { for (const k of ['carB', 'busB', 'pedB', 'pedH', 'pedA', 'pedLeg', 'rings', 'beams', 'umb']) { OBJ[k].setColorAt(0, _c.setHex(0xffffff)); } for (let i = 0; i < WORLD.sigHeads.length * 3; i++) OBJ.sig.setColorAt(i, _c.setHex(0x333333)); });
  if (ASSETS.enabled) load3dFaces();
  G.state = 'title'; el.bPlay.disabled = false; window.__dolmusReady = true; if (!lsGet(KEY_SET)) saveSettings();
  showcase(); applyLang();
  if (FLAG.auto || SIM_PRE > 0) {
    if (G.state === 'title') { if (Q.get('mode') === 'endless') startEndless(); else if (Q.get('mode') === 'daily' && window.Arena) startDaily(); else startCampaign(false); if (G.state === 'countdown') beginShift(); }
    if (SIM_PRE > 0) window.dolmusSim(SIM_PRE);
    lastSkyHour = -99;
  }
  if (window.ArenaCore) ArenaCore.kabuk.onceDerle(renderer, scene, camera); // shader warm-up (Intel: no parallel compile)
  lastT = performance.now(); requestAnimationFrame(frame);
  setTimeout(loadAssets, 60);
}
boot().catch(err => { G.errors.push('boot: ' + (err && err.stack || err)); const m = document.getElementById('playTxt'); if (m) m.textContent = 'Error: ' + (err && err.message); console.error(err); if (el.dbg) { el.dbg.style.display = 'block'; el.dbg.textContent = String(err && err.stack || err); } });
