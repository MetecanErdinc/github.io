/* ==========================================================================
   program.js — hesaplanan planı alışkanlıklara ve listelere çevirir
   --------------------------------------------------------------------------
   plan.js sayıları üretir, burası onları uygulamanın veri modeline yazar:
   öğünler gramajlı sabit listeler, su ve adım sayaç, antrenman haftada N kez.

   Alışveriş listesi de plandan türetilir — günlük gramajlar yediye katlanır,
   akşam rotasyonu kendi günlerine göre toplanır.
   ========================================================================== */

/* Sürüm damgası — app.js karışık sürüm yüklenmesini bununla yakalar. */
export const BUILD = '2026-09-11m';


import { FOODS } from './plan.js';

export const PROGRAM_GROUP = 'Spor ve Diyet';

/* Bunlar kişiye göre değişmez: ölçüm disiplini herkeste aynı. */
export const ANTI_KACAK = [
  '1. HER ŞEY ÇİĞ TARTILIR — pişmiş tartmak yasak',
  '2. YAĞ ŞİŞEDEN DÖKÜLMEZ, TARTILIR',
  '3. PİLAV VE TEREYAĞI YASAK — bulgura geç, 3 kat lif',
  '4. TAVA + YAĞ YASAK — fırın, air fryer, ızgara, haşlama',
  '5. SIVI KALORİ YASAK — şekersiz gazoz serbest',
  '6. HAFTA SONU DİYE BİR ŞEY YOK — 7 gün aynı',
  '7. "BİR LOKMA" DİYE BİR ŞEY YOK — tatmak da sayılır',
  '8. UYGULAMAYA GİRMEYEN ŞEY YOK — tahmin yok, tartı var',
];

/**
 * Anahtar öncesi sürümde kurulmuş alışkanlıkları tanır.
 *
 * İlk sürüm alışkanlıkları yalnızca adla eşleştiriyordu. Sonradan ad, hesabın
 * çıktısına bağlandı ("Su — 4 litre" kilo düşünce "Su — 3,5 litre" olur), o
 * yüzden kalıcı anahtara geçildi. Eski kurulumlar anahtarsız olduğu için
 * burada adlarından tanınıp sahiplenilir — yoksa her biri ikinci kez eklenir
 * ve kullanıcı aynı öğünü iki kez görür. Sonu "…" olan kayıtlar ön ek eşleşir.
 */
export const ESKI_ADLAR = {
  tarti: ['Sabah tartısı'],
  ogun0: ['Kahvaltı'],
  ogun1: ['Öğle yemeği'],
  ogun2: ['Akşam yemeği'],
  ogun3: ['Ara öğün / protein kek', 'Ara öğün…'],
  su: ['Su —…'],
  adim: ['Adım —…'],
  antrenman: ['Full body antrenman', 'Full body…', 'Üst / Alt…', 'İtiş / Çekiş…'],
  takviye: ['Takviyeler'],
  kayit: ['Kalori kaydı'],
  olcum: ['Haftalık ölçüm'],
};

/** Bir alışkanlık adı, verilen anahtarın eski adlarından birine uyuyor mu? */
export function eskiAdUyuyor(key, name) {
  return (ESKI_ADLAR[key] || []).some((kalip) => kalip.endsWith('…')
    ? name.startsWith(kalip.slice(0, -1))
    : name === kalip);
}

const ogunEmoji = ['🍳', '🍗', '🐟', '🍰'];
const ogunRenk = ['#f7b24f', '#4fcf8e', '#42c8d4', '#ef6ec3'];

/** Bir öğün satırını liste maddesine çevirir: "200 g yoğurt — ÇİĞ tartılacak" */
function satirMetni(s) {
  return `${s.g} g ${s.ad}${s.not ? ` — ${s.not}` : ''}`;
}

/** Planın alışkanlıkları. Tümü PROGRAM_GROUP bölümüne girer. */
export function buildHabits(plan) {
  const t = plan.hedef;
  const kiloVer = plan.profile.hedef !== 'koru';
  const h = [];

  if (kiloVer) {
    h.push({
      key: 'tarti', name: 'Sabah tartısı', emoji: '⚖️', color: '#4f8ef7',
      mode: 'check', target: 1, schedule: { kind: 'daily' },
      note: 'Tuvaletten sonra, aç karnına, iç çamaşırıyla, hep aynı tartıda. '
          + 'Günlük değere BAKMA — sadece 7 günün ortalamasını takip et.',
    });
  }

  plan.ogunler.forEach((o, i) => {
    const notlar = [`~${o.kcal} kcal · ${o.p} g protein · ${o.lif} g lif.`];
    if (i === 1) notlar.push('Pilav değil bulgur: tereyağlı pilavın yağı tartıda görünmez.');
    if (i === 2) notlar.push('Protein kaynağını her gün değiştir — rotasyon Program sekmesinde.');
    if (i === 3) notlar.push('Antrenman günü antrenmandan sonra ye.');

    h.push({
      key: `ogun${i}`, name: o.ad, emoji: ogunEmoji[i], color: ogunRenk[i],
      mode: 'check', target: 1, schedule: { kind: 'daily' },
      note: notlar.join(' '),
      tasks: o.satirlar.map(satirMetni),

      /*  Kalori sayacı bu iki alandan okunur; not metnindeki "~451 kcal"
          insan içindir, ayrıştırılmaz. taskKcal, tasks ile aynı sırada:
          madde tek tek işaretlendikçe sayaç kendi payınca düşsün diye
          satır satır tutulur, yoksa öğün ancak son maddede sayılırdı. */
      kcal: o.kcal,
      taskKcal: o.satirlar.map((x) => Math.round((FOODS[x.key].kcal * x.g) / 100)),
    });
  });

  h.push({
    key: 'su', name: `Su — ${t.suL.toLocaleString('tr-TR')} litre`, emoji: '💧', color: '#4f8ef7',
    mode: 'count', target: Math.round(t.suL * 2), schedule: { kind: 'daily' },
    note: 'Her tik = 500 ml. Lif artarken su artmazsa kabızlık kötüleşir: '
        + 'lif suyu emip jel yapar, su yoksa beton yapar.',
  });

  h.push({
    key: 'adim', name: `Adım — ${t.adimHedef.toLocaleString('tr-TR')}`, emoji: '🚶', color: '#7ec24f',
    mode: 'count', target: Math.round(t.adimHedef / 1000), schedule: { kind: 'daily' },
    note: `Her tik = 1.000 adım. Bu hedef günde yaklaşık `
        + `${Math.round(t.adimHedef * plan.profile.kilo * 0.00027)} kcal eder — `
        + 'programın en ucuz parçası burası.',
  });

  if (t.antrenmanGun > 0) {
    h.push({
      key: 'antrenman', name: plan.antrenman.ad, emoji: '🏋️', color: '#6c63ff',
      mode: 'check', target: 1,
      schedule: { kind: 'perWeek', perWeek: t.antrenmanGun },
      note: 'Her hafta bir harekette ya 1 tekrar ya 2,5 kg ekle. Diyetteyken kas '
          + 'korumanın tek yolu ağırlığın düşmemesi. ' + plan.antrenman.not,
    });
  }

  const takviye = [
    'D3 + K2',
    plan.profile.kacin?.includes('balik') || plan.profile.kacin?.includes('vejeteryan')
      ? 'Omega-3 — alg yağı (balık yemediğin için EPA+DHA gıdadan gelmiyor)'
      : 'Omega-3 — 2 g EPA+DHA (kutudaki "balık yağı" değil, EPA+DHA rakamı)',
    'Magnezyum — kabızlık varsa sitrat formu, akşam',
  ];
  if (t.antrenmanGun >= 2) takviye.push('Kreatin 5 g');
  if (plan.profile.kacin?.includes('vejeteryan')) takviye.push('B12 — vejetaryen beslenmede şart');

  h.push({
    key: 'takviye', name: 'Takviyeler', emoji: '💊', color: '#f75f5f',
    mode: 'check', target: 1, schedule: { kind: 'daily' },
    note: 'Hiçbiri zorunlu değil, hepsi eksiği kapatır. Dozları kan tahlilinden sonra netleştir.',
    tasks: takviye,
  });

  h.push({
    key: 'kayit', name: 'Kalori kaydı', emoji: '✍️', color: '#c98a5b',
    mode: 'check', target: 1, schedule: { kind: 'daily' },
    note: 'Ağzına giren her şey uygulamaya girer: çayın şekeri, sos, "bir lokma". '
        + 'Diyetlerin çoğu yanlış diyetten değil, yanlış ölçümden başarısız olur.',
  });

  if (kiloVer) {
    h.push({
      key: 'olcum', name: 'Haftalık ölçüm', emoji: '📏', color: '#9b8cff',
      mode: 'check', target: 1, schedule: { kind: 'days', days: [0] },
      note: 'Pazar sabahı aç karnına: göbek çevresi, göğüs, kalça, uyluk + '
          + 'fotoğraf (ön/yan). Tartı takıldığında mezura hâlâ ilerliyor olabilir.',
    });
  }

  return h;
}

/* ------------------------------------------------------- alışveriş listesi */

/** Miktarı okunur birime çevirir: 8400 g → "8,4 kg", 350 g → "350 g" */
function miktar(g) {
  if (g >= 1000) return `${(Math.round(g / 100) / 10).toLocaleString('tr-TR')} kg`;
  return `${Math.round(g / 10) * 10} g`;
}

const ALINMAYACAK = 'ALMAYACAKLARIN: tereyağı, şekersiz çikolata, pirinç unu, '
                  + 'hazır sos/mayonez/ketçap, meyve suyu, cips';

/**
 * Haftalık alışveriş listesi — plandaki gramajlardan hesaplanır.
 *
 * Akşam proteini her gün değiştiği için günlük gramajla değil, rotasyonun
 * kendi günleriyle toplanır: haftada iki gün balık yiyen birinin listesinde
 * yedi günlük balık yazmaz.
 */
export function buildShoppingList(plan) {
  const toplam = new Map();
  const ekle = (key, g) => toplam.set(key, (toplam.get(key) || 0) + g);

  plan.ogunler.forEach((o) => {
    o.satirlar.forEach((s) => {
      if (s.key === o.rotasyon) return;        // akşam proteini aşağıda
      ekle(s.key, s.g * 7);
    });
  });

  /* Akşam rotasyonu: her gün kendi kaynağından bir porsiyon. Aynı besin
     öğlen de geçiyorsa (tavuk gibi) tek satırda toplanır — listede iki ayrı
     "tavuk" satırı görmek markette işe yaramaz. */
  plan.rotasyon.forEach((r) => ekle(r.key, r.g));

  const buyukHarf = (x) => x.charAt(0).toLocaleUpperCase('tr-TR') + x.slice(1);

  const satirlar = [...toplam.entries()]
    .filter(([, g]) => g > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, g]) => `${buyukHarf(FOODS[key].ad)} — ${miktar(g)}`);

  return [...satirlar, ALINMAYACAK];
}

/** Planın listeleri: ölçüm kuralları ve alışveriş. */
export function buildLists(plan) {
  return [
    { name: 'Anti-kaçak kuralları', emoji: '📋', items: ANTI_KACAK },
    { name: 'Haftalık alışveriş', emoji: '🛒', items: buildShoppingList(plan) },
  ];
}
