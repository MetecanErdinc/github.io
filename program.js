/* ==========================================================================
   program.js — "Spor ve Diyet" hazır paketi
   --------------------------------------------------------------------------
   Ayarlar → Spor ve Diyet ekranındaki "Kur" düğmesi bu tanımı okuyup
   alışkanlıkları ve listeleri hesaba yazar. Tanım burada durur ki program
   değiştiğinde tek dosya güncellensin.

   Hedef: günde ~2.030 kcal · 184 g protein · 38 g lif · 12.000 adım
          → haftada ~1 kg, ayda 4-5 kg

   Bütün gramajlar ÇİĞ ağırlıktır. Pişmiş tartmak hesabı bozar.
   ========================================================================== */

export const PROGRAM_GROUP = 'Spor ve Diyet';

/** Paketin kısa tanıtımı — Ayarlar ekranında ve kurulum onayında görünür. */
export const PROGRAM_SUMMARY = {
  title: 'Spor ve Diyet',
  target: '~2.030 kcal · 184 g protein · 38 g lif · 12.000 adım',
  goal: 'Haftada ~1 kg (ayda 4-5 kg)',
};

/**
 * Paketteki alışkanlıklar.
 *
 * tasks[] verilen alışkanlıklar "sabit liste" olur: maddeler her gün aynı
 * gelir, işaretler güne özeldir. driveFromTasks ile liste alışkanlığı besler —
 * bütün maddeler işaretlenince öğün tamamlanmış sayılır.
 */
export const PROGRAM_HABITS = [
  {
    name: 'Sabah tartısı',
    emoji: '⚖️',
    color: '#4f8ef7',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: 'Tuvaletten sonra, aç karnına, iç çamaşırıyla, hep aynı tartıda. '
        + 'Günlük değere BAKMA — sadece 7 günün ortalamasını takip et.',
  },

  {
    name: 'Kahvaltı',
    emoji: '🍳',
    color: '#f7b24f',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: '~510 kcal · 40 g protein. Whey yoksa: 4 yumurta beyazı + 1 tam yumurta.',
    tasks: [
      '200 g yoğurt (yarım yağlı)',
      '40 g yulaf — ÇİĞ tartılacak',
      '30 g whey protein (veya 4 yumurta beyazı + 1 tam yumurta)',
      '10 g öğütülmüş keten veya chia',
      '100 g meyve (çilek, kivi, böğürtlen)',
    ],
  },

  {
    name: 'Öğle yemeği',
    emoji: '🍗',
    color: '#4fcf8e',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: '~660 kcal · 59 g protein. PİLAV YOK, BULGUR VAR — tereyağlı pilavın '
        + 'yağı tartıda görünmez, 100 g\'ı 130 değil 180 kcal olur.',
    tasks: [
      '200 g tavuk göğsü — ÇİĞ tartılacak',
      '60 g bulgur — ÇİĞ tartılacak (pilav değil)',
      '300 g salata: marul, roka, domates, salatalık, turp',
      '10 g zeytinyağı — TARTIYLA, şişeden dökme',
      '150 g yoğurt',
    ],
  },

  {
    name: 'Akşam yemeği',
    emoji: '🐟',
    color: '#42c8d4',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: '~620 kcal · 55 g protein. Protein rotasyonu: Pzt somon/uskumru · '
        + 'Sal dana kıyma %10 · Çar tavuk · Per balık · Cum hindi · Cmt dana '
        + 'bonfile · Paz mercimek. Haftada 2 gün balık şart (omega-3).',
    tasks: [
      'Protein: 180 g balık / 180 g kıyma / 200 g tavuk (çiğ, rotasyona göre)',
      '50 g bulgur veya pirinç (çiğ) — ya da 200 g patates',
      '300 g sebze yemeği — yağı tartılmış, en fazla 10 g',
      '150 g yoğurt',
    ],
  },

  {
    name: 'Ara öğün / protein kek',
    emoji: '🍰',
    color: '#ef6ec3',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: '~285 kcal · 33 g protein. Pirinç unu ve "şekersiz çikolata" YOK — '
        + 'şekersiz çikolatada şekerin yerini yağ alır, 100 g\'ı çoğu zaman '
        + '550+ kcal. Kek yapmayacaksan: 200 g yoğurt + 25 g whey + tarçın.',
    tasks: [
      '1 tam yumurta + 3 yumurta beyazı',
      '25 g whey protein',
      '20 g yulaf — blenderdan geçir',
      '10 g şekersiz toz kakao + tatlandırıcı',
      'Kabartma tozu',
    ],
  },

  {
    name: 'Su — 4 litre',
    emoji: '💧',
    color: '#4f8ef7',
    mode: 'count',
    target: 8,
    schedule: { kind: 'daily' },
    note: 'Her tik = 500 ml. Lif artarken su artmazsa kabızlık kötüleşir — '
        + 'lif suyu emip jel yapar, su yoksa beton yapar.',
  },

  {
    name: 'Adım — 12.000',
    emoji: '🚶',
    color: '#7ec24f',
    mode: 'count',
    target: 12,
    schedule: { kind: 'daily' },
    note: 'Her tik = 1.000 adım. Antrenman günü 10.000 yeterli. Senin kilonda '
        + '12.000 adım ~450 kcal, yani ayda 1,7 kilo. Diyetin yarısı burada.',
  },

  {
    name: 'Full body antrenman',
    emoji: '🏋️',
    color: '#6c63ff',
    mode: 'check',
    target: 1,
    schedule: { kind: 'perWeek', perWeek: 3 },
    note: 'Her hafta bir harekette ya 1 tekrar ya 2,5 kg ekle. Diyetteyken kas '
        + 'korumanın tek yolu ağırlığın düşmemesi. Koşma — bu kiloda dizlerini '
        + 'zorlar, kardiyoyu yürüyüşle hallet.',
  },

  {
    name: 'Takviyeler',
    emoji: '💊',
    color: '#f75f5f',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: 'Kabızlık sürerse akşama AYRI magnezyum sitrat ekle (200 mg elementel, '
        + 'gerekirse 300). Mevcut ürünün gece tableti bisglisinat — uyku için '
        + 'iyi, bağırsağa etkisi yok.',
    tasks: [
      'Sabah: Haver Mag (sitrat + taurat + malat)',
      'D3 + K2',
      'Omega-3 — 2 g EPA+DHA (kutudaki "balık yağı" değil, EPA+DHA rakamı)',
      'Akşam: Haver Mag (bisglisinat)',
      'Kreatin 5 g',
    ],
  },

  {
    name: 'Kalori kaydı',
    emoji: '✍️',
    color: '#c98a5b',
    mode: 'check',
    target: 1,
    schedule: { kind: 'daily' },
    note: 'Ağzına giren her şey uygulamaya girer: çayın şekeri, sos, "bir lokma", '
        + 'misafirlikteki kurabiye. Geçen ay başarısız olan şey diyet değil, ölçümdü.',
  },

  {
    name: 'Haftalık ölçüm',
    emoji: '📏',
    color: '#9b8cff',
    mode: 'check',
    target: 1,
    schedule: { kind: 'days', days: [0] },
    note: 'Pazar sabahı aç karnına: göbek çevresi (göbek deliği hizası), göğüs, '
        + 'kalça, uyluk + fotoğraf (ön/yan/arka). Tartı takıldığında mezura hâlâ '
        + 'ilerliyor olabilir.',
  },
];

/** Paketle birlikte kurulan, tarihten bağımsız listeler. */
export const PROGRAM_LISTS = [
  {
    name: 'Anti-kaçak kuralları',
    emoji: '📋',
    items: [
      '1. HER ŞEY ÇİĞ TARTILIR — pişmiş tartmak yasak',
      '2. YAĞ ŞİŞEDEN DÖKÜLMEZ, TARTILIR — günlük bütçe 20 g',
      '3. PİLAV VE TEREYAĞI YASAK — bulgura geç, 3 kat lif',
      '4. TAVA + YAĞ YASAK — fırın, air fryer, ızgara, haşlama',
      '5. SIVI KALORİ YASAK — şekersiz kola serbest',
      '6. HAFTA SONU DİYE BİR ŞEY YOK — 7 gün aynı',
      '7. "BİR LOKMA" DİYE BİR ŞEY YOK — tatmak da sayılır',
      '8. UYGULAMAYA GİRMEYEN ŞEY YOK — tahmin yok, tartı var',
    ],
  },
  {
    name: 'Haftalık alışveriş',
    emoji: '🛒',
    items: [
      'Tavuk göğsü — 1,5 kg',
      'Dana kıyma %10 yağlı — 400 g',
      'Dana bonfile / kuşbaşı — 200 g',
      'Somon / uskumru / levrek — 400 g',
      'Hindi göğüs — 200 g',
      'Yumurta — 30\'luk koli',
      'Yoğurt (yarım yağlı) — 3,5 kg',
      'Whey protein (ayda 1)',
      'Kuru mercimek — 500 g',
      'Bulgur — 1 kg',
      'Yulaf ezmesi — 1 kg',
      'Pirinç — 500 g',
      'Patates — 1 kg',
      'Marul, roka, maydanoz',
      'Domates, salatalık, biber, turp',
      'Brokoli, ıspanak, kabak, taze fasulye',
      'Çilek / böğürtlen (donuk) — 1 kg',
      'Kivi / elma — 7 adet',
      'Zeytinyağı',
      'Keten tohumu / chia',
      'Şekersiz toz kakao',
      'Tatlandırıcı (stevia / eritritol)',
      'Kuru erik (kabızlık için)',
      'Kefir',
      'Şekersiz kola',
      '— ALMAYACAKLARIN: tereyağı, şekersiz çikolata, pirinç unu, ekmek, '
        + 'sos/mayonez/ketçap, meyve suyu, cips',
    ],
  },
];

/**
 * Lif artışı kademeli olmalı: 10 g'dan 38 g'a bir günde çıkmak şişkinlik ve
 * kramp yapar, insan da "bu diyet bana dokundu" deyip bırakır.
 */
export const FIBER_RAMP = [
  ['1. hafta', '15-18 g — sebzeyi yarım porsiyon başlat'],
  ['2. hafta', '22-25 g'],
  ['3. hafta', '30 g'],
  ['4. hafta', '35-38 g — tam porsiyon'],
];
