/* ==========================================================================
   plan.js — kişiye özel diyet ve antrenman programı hesabı
   --------------------------------------------------------------------------
   Girdi: profil (cinsiyet, yaş, boy, kilo, hareket, antrenman günü, hedef,
   hız, kaçınılan besinler). Çıktı: kalori, makrolar, gramajlı öğünler,
   antrenman bölünmesi ve günlük hedefler.

   Buradaki her sayının bir dayanağı var; sihir yok:

   - Bazal metabolizma  : Mifflin-St Jeor (obezitede en az sapan denklem)
   - Yürüyüş            : ~0,5 kcal/kg/km, 1 km ≈ 1300 adım, net pay ~%70
   - Antrenman          : ~3,5 kcal/kg (bir saatlik ağırlık seansı)
   - Açık               : hem haftalık kilo yüzdesinden hem de TDEE yüzdesinden
                          hesaplanır, küçük olan kazanır — yağ oranı yüksekken
                          hızlı vermek güvenli, zayıfken aynı hız kas yakar
   - Protein            : 2,0 g/kg (kas hedefinde 2,2) — vücut ağırlığı değil,
                          BKİ 25'e denk gelen ağırlık üzerinden. Obezitede
                          gerçek kiloyla çarpmak anlamsız yüksek sayı verir
   - Yağ                : 0,8 g/kg (aynı referans), en az kalorinin %20'si
   - Lif                : 14 g / 1000 kcal
   - Su                 : 30 ml/kg
   ========================================================================== */

/* Sürüm damgası — app.js karışık sürüm yüklenmesini bununla yakalar. */
export const BUILD = '2026-09-17a';


/* ---------------------------------------------------------------- besinler */
/* 100 g çiğ/ham başına: kcal, protein, karbonhidrat, yağ, lif (gram) */

const F = (kcal, p, c, f, fib = 0) => ({ kcal, p, c, f, fib });

export const FOODS = {
  yogurt:      { ad: 'yoğurt (yarım yağlı)',        ...F(60, 5.5, 7, 1.5) },
  kefir:       { ad: 'kefir',                        ...F(55, 3.8, 4.5, 2) },
  yulaf:       { ad: 'yulaf',                        ...F(389, 13.5, 66, 7, 10) },
  whey:        { ad: 'whey protein',                 ...F(385, 80, 8, 4) },
  bitkiselProtein: { ad: 'bitkisel protein tozu (bezelye/soya)', ...F(380, 75, 8, 5, 3) },
  keten:       { ad: 'öğütülmüş keten/chia',         ...F(534, 18, 29, 42, 27) },
  meyve:       { ad: 'meyve (çilek, kivi, elma)',    ...F(45, 0.8, 10, 0.3, 2) },
  tavuk:       { ad: 'tavuk göğsü',                  ...F(110, 23, 0, 1.5) },
  hindi:       { ad: 'hindi göğsü',                  ...F(112, 24, 0, 1.5) },
  balik:       { ad: 'somon / uskumru',              ...F(200, 20, 0, 13) },
  kiyma:       { ad: 'dana kıyma (%10 yağlı)',       ...F(190, 20, 0, 12) },
  mercimek:    { ad: 'kuru mercimek',                ...F(350, 25, 60, 1, 30) },
  nohut:       { ad: 'kuru nohut',                   ...F(364, 19, 61, 6, 17) },
  yumurta:     { ad: 'yumurta',                      ...F(143, 12.5, 0.7, 10) },
  yumurtaAk:   { ad: 'yumurta beyazı',               ...F(52, 11, 0.7, 0.2) },
  bulgur:      { ad: 'bulgur',                       ...F(345, 12, 76, 1.5, 18) },
  pirinc:      { ad: 'pirinç',                       ...F(360, 7, 79, 0.6, 1.5) },
  patates:     { ad: 'patates',                      ...F(77, 2, 17, 0.1, 2) },
  salata:      { ad: 'salata (marul, domates, salatalık)', ...F(20, 1.2, 3.5, 0.2, 1.5) },
  sebze:       { ad: 'sebze yemeği',                 ...F(40, 2, 6, 0.5, 3) },
  zeytinyagi:  { ad: 'zeytinyağı',                   ...F(900, 0, 0, 100) },
  kakao:       { ad: 'şekersiz toz kakao',           ...F(230, 20, 58, 14, 33) },
  ceviz:       { ad: 'ceviz / badem',                ...F(640, 18, 14, 60, 7) },
};

/* --------------------------------------------------------------- seçenekler */

export const CINSIYET = [['erkek', 'Erkek'], ['kadin', 'Kadın']];

export const HAREKET = [
  ['cokAz', 'Çok az',  'Masabaşı, günde 3.000 adımın altı',        1.15, 2500],
  ['az',    'Az',      'Biraz yürüyorum, 3.000-6.000 adım',        1.20, 5000],
  ['orta',  'Orta',    'Düzenli yürüyorum, 6.000-10.000 adım',     1.25, 8000],
  ['cok',   'Çok',     'Ayakta iş / bol yürüyüş, 10.000 üstü',     1.32, 11000],
];

export const HEDEF = [
  ['ver',  'Kilo vermek'],
  ['koru', 'Kiloyu korumak'],
  ['kas',  'Kas yapmak'],
];

export const HIZ = [
  ['yavas',  'Yavaş',  'Rahat ilerler, sosyal hayatı en az bozar'],
  ['normal', 'Normal', 'Çoğu kişi için en iyi denge'],
  ['hizli',  'Hızlı',  'En yüksek güvenli hız — disiplin ister'],
];

export const KACIN = [
  ['balik',   'Balık yemem'],
  ['kirmizi', 'Kırmızı et yemem'],
  ['sut',     'Süt ürünü yemem'],
  ['vejeteryan', 'Et ve balık yemem (vejetaryen)'],
];

/* ------------------------------------------------------------- yardımcılar */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round5 = (v) => Math.round(v / 5) * 5;

/**
 * Porsiyonlar 5 g'a, 100 g'ı geçenler 10 g'a yuvarlanır — mutfakta 187 g
 * tartılmaz. 3 gramın altı hiç yazılmaz: "5 g bulgur" satırı tabağa bir şey
 * katmaz ama günde dört öğünde toplanınca hesabı kaydırır.
 */
function roundPortion(g) {
  if (g < 3) return 0;
  if (g >= 100) return Math.round(g / 10) * 10;
  if (g >= 20) return round5(g);
  return Math.round(g);
}

const kcalOf = (food, g) => (food.kcal * g) / 100;
const macroOf = (food, g, key) => (food[key] * g) / 100;

/* ------------------------------------------------------------------ hesap */

/**
 * Profilden günlük hedefleri çıkarır.
 * @param {{cinsiyet,yas,boy,kilo,hareket,antrenmanGun,hedef,hiz,kacin[]}} p
 */
export function computeTargets(p) {
  const kilo = Number(p.kilo), boy = Number(p.boy), yas = Number(p.yas);
  const erkek = p.cinsiyet !== 'kadin';
  const boyM = boy / 100;
  const bki = kilo / (boyM * boyM);

  const bmr = Math.round(10 * kilo + 6.25 * boy - 5 * yas + (erkek ? 5 : -161));

  const hareket = HAREKET.find((h) => h[0] === p.hareket) || HAREKET[0];
  const [, , , tabanCarpan, mevcutAdim] = hareket;

  /* Hedef adım: bulunduğu yerden ~3.000 fazlası, 8-12 bin arasında.
     Kimseye ilk gün 12.000 yazmıyoruz; ulaşılmayan hedef hedef değildir. */
  const adimHedef = clamp(Math.round((mevcutAdim + 3000) / 1000) * 1000, 8000, 12000);

  /* Yürüyüşün net katkısı: 0,5 kcal/kg/km, 1 km ≈ 1300 adım, %70 net. */
  const yuruyus = Math.round(adimHedef * kilo * 0.00027);

  const antrenmanGun = clamp(Number(p.antrenmanGun) || 0, 0, 7);
  const antrenman = Math.round((antrenmanGun * 3.5 * kilo) / 7);

  const tdee = Math.round(bmr * tabanCarpan + yuruyus + antrenman);

  /* --- açık / fazla ------------------------------------------------------ */

  const uyarilar = [];
  let kcal, haftalikKg;

  if (p.hedef === 'kas') {
    kcal = Math.round(tdee * 1.10);
    haftalikKg = 0.25;
  } else if (p.hedef === 'koru') {
    kcal = tdee;
    haftalikKg = 0;
  } else {
    /* Haftalık yüzde tavanı: yağ oranı yükseldikçe hızlı vermek güvenlidir,
       zayıfken aynı hız kasa mal olur. */
    const oranTavan = bki >= 30 ? 0.010 : bki >= 25 ? 0.0075 : 0.005;
    const secilen = oranTavan * ({ yavas: 0.55, normal: 0.8, hizli: 1 }[p.hiz] ?? 0.8);

    const oranAcik = (secilen * kilo * 7700) / 7;

    /* TDEE yüzdesi tavanı — mutlak sayı büyük olsa da oransal açık sınırlı. */
    const yuzdeTavan = bki >= 35 ? 0.30 : bki >= 30 ? 0.27 : bki >= 25 ? 0.22 : 0.18;
    const yuzdeAcik = tdee * yuzdeTavan;

    let acik = Math.min(oranAcik, yuzdeAcik);
    if (acik < oranAcik - 40) {
      uyarilar.push('Seçtiğin hız güvenli sınırın üzerindeydi; açık, kas kaybını '
                  + 'önlemek için düşürüldü. Yavaş verilen kilo geri gelmeyen kilodur.');
    }

    kcal = Math.round(tdee - acik);

    const taban = erkek ? 1600 : 1300;
    if (kcal < taban) {
      kcal = taban;
      uyarilar.push(`Hesap ${taban} kcal'in altına indiği için tabana çekildi. `
                  + 'Bu kalorinin altında mikro besinleri karşılamak mümkün değil.');
    }
    haftalikKg = Math.round(((tdee - kcal) * 7 / 7700) * 100) / 100;
  }

  /* --- makrolar ---------------------------------------------------------- */

  /* Protein ve yağ referansı gerçek kilo değil, BKİ 25'e denk ağırlık:
     130 kiloluk birine 130 × 2 = 260 g protein yazmak anlamsızdır. */
  const refKilo = Math.min(kilo, boyM * boyM * 25);

  /* Protein hem kiloya hem kaloriye bağlıdır. Sadece kiloya bakmak, kısa boylu
     ama yüksek kalori alan birinde (referans ağırlık küçük çıkar) tabaktaki
     yemeğin doğal proteininin bile altında bir hedef üretir. Kalorinin %18'i
     bu durumda devreye girip hedefi gerçekçi seviyeye çeker. */
  const protein = Math.round(Math.max(
    refKilo * (p.hedef === 'kas' ? 2.2 : 2.0),
    (kcal * 0.18) / 4,
  ));
  const yag = Math.round(Math.max(refKilo * 0.8, (kcal * 0.20) / 9));
  const karb = Math.max(50, Math.round((kcal - protein * 4 - yag * 9) / 4));
  const lif = clamp(Math.round((kcal / 1000) * 14), 25, 40);
  const suL = clamp(Math.round((kilo * 30) / 500) / 2, 2, 4.5);   // 0,5 L adımlarla

  if (bki < 20 && p.hedef === 'ver') {
    uyarilar.push('Kilon zaten normalin altında. Buradan kilo vermek sağlık kazancı '
                + 'getirmez; hedefini "kiloyu korumak" veya "kas yapmak" olarak '
                + 'değiştirmeni öneririm.');
  }

  if (bki >= 30) {
    uyarilar.push('Başlamadan kan tahlili yaptır: açlık glukoz + açlık insülini '
                + '(HOMA-IR), HbA1c, TSH, D vitamini, B12, lipid, ALT/AST. '
                + 'İnsülin direnci veya tiroit yavaşlığı varsa aynı program '
                + 'çalışır ama beklentini doğru ayarlarsın.');
  }

  return {
    bmr, tdee, kcal, protein, yag, karb, lif, suL,
    adimHedef, antrenmanGun, bki: Math.round(bki * 10) / 10,
    haftalikKg, aylikKg: Math.round(haftalikKg * 4.3 * 10) / 10,
    refKilo: Math.round(refKilo), uyarilar,
  };
}

/* ------------------------------------------------------------------ öğünler */

/** Öğün başına en fazla bu kadar konur — 300 g mercimek kimsenin tabağına sığmaz. */
const TAVAN = {
  whey: 40, yumurtaAk: 250, yumurta: 150, tavuk: 250, hindi: 250,
  balik: 220, kiyma: 220, mercimek: 90, nohut: 90, yogurt: 300,
  bitkiselProtein: 45,
};

/** Kaçınılan besinlere göre öğünlerin protein kaynaklarını seçer. */
function proteinKaynaklari(kacin = []) {
  const yok = (x) => kacin.includes(x);
  const vejeteryan = yok('vejeteryan');
  const sutsuz = yok('sut');

  const etler = [];
  if (!vejeteryan) {
    if (!yok('balik')) etler.push('balik');
    if (!yok('kirmizi')) etler.push('kiyma');
    etler.push('tavuk', 'hindi');
  } else {
    etler.push('mercimek', 'nohut');
  }

  /* Yedek kaynak: birincil tavana dayandığında proteini tamamlar. Yağsız ve
     yoğun olmalı, yoksa kaloriyi doldurur. Sütsüzde bitkisel toz: bezelye ve
     soya sütsüz, vejetaryen ve baklagilin aksine karbonhidrat taşımaz. */
  const yedek = sutsuz ? 'bitkiselProtein' : 'whey';

  return {
    vejeteryan, sutsuz, yedek,
    kahvaltiTaban: sutsuz ? 'yumurta' : 'yogurt',
    kahvaltiProtein: sutsuz ? 'bitkiselProtein' : 'whey',
    ogle: vejeteryan ? 'mercimek' : 'tavuk',
    aksamRotasyon: etler,
    araProtein: sutsuz ? 'bitkiselProtein' : 'whey',
  };
}

/**
 * Öğünleri kurar.
 *
 * Tek geçişte çözülmez, çünkü kalemler birbirini etkiler: karbonhidrat kaynağı
 * da protein taşır (bulgurun 100 g'ı 12 g), mercimek gibi bir kaynak ise hem
 * protein hem karbonhidrattır. Bu yüzden protein çapası → yağ → karbonhidrat
 * sırası birkaç kez yinelenir; her turda bir öncekinin sonucu bilindiği için
 * sapma hızla kapanır.
 *
 * Sabit kalemler (sebze, salata, yoğurt, keten) ölçeklenmez — onlar zaten
 * doğru miktarda ve porsiyonu kişiye göre oynatmanın anlamı yok.
 */
function buildMeals(t, kacin) {
  const K = proteinKaynaklari(kacin);
  const sut = !K.sutsuz;

  const sablon = [
    { ad: 'Kahvaltı', emoji: '🍳', kcalPay: 0.22, pPay: 0.20, karb: 'yulaf',
      birincil: K.kahvaltiProtein,
      sabit: [...(sut ? [['yogurt', 200]] : [['yumurta', 100]]), ['keten', 10], ['meyve', 100]] },

    { ad: 'Öğle yemeği', emoji: '🍗', kcalPay: 0.29, pPay: 0.32, karb: 'bulgur',
      birincil: K.ogle,
      sabit: [['salata', 300], ...(sut ? [['yogurt', 150]] : [])] },

    { ad: 'Akşam yemeği', emoji: '🐟', kcalPay: 0.33, pPay: 0.32, karb: 'pirinc',
      birincil: K.aksamRotasyon[0],
      sabit: [['sebze', 300], ...(sut ? [['yogurt', 150]] : [])] },

    { ad: 'Ara öğün', emoji: '🍰', kcalPay: 0.16, pPay: 0.16, karb: 'yulaf',
      birincil: K.araProtein,
      sabit: [['kakao', 10]] },
  ];

  const karbPay = [0.22, 0.32, 0.34, 0.12];
  const uyarilar = [];

  /* Sabit kalemlerin katkısı turlar boyunca değişmez, bir kez hesapla. */
  const sabitler = sablon.map((m) => {
    const satir = m.sabit.map(([key, g]) => ({ key, g }));
    const top = (k) => satir.reduce((s, x) => s + macroOf(FOODS[x.key], x.g, k), 0);
    return { satir, kcal: satir.reduce((s, x) => s + kcalOf(FOODS[x.key], x.g), 0),
             p: top('p'), f: top('f') };
  });

  let birincil = sablon.map(() => 0);
  let yedek = sablon.map(() => 0);
  let karb = sablon.map(() => 0);
  let yag = 0;

  for (let tur = 0; tur < 6; tur++) {
    /* 1) Protein çapaları — karbonhidrat kaynağının proteini de düşülür. */
    sablon.forEach((m, i) => {
      const karbP = macroOf(FOODS[m.karb], karb[i], 'p');
      const acik = t.protein * m.pPay - sabitler[i].p - karbP;
      const bFood = FOODS[m.birincil];
      birincil[i] = clamp((acik / bFood.p) * 100, 0, TAVAN[m.birincil] ?? 250);

      const kalan = acik - macroOf(bFood, birincil[i], 'p');
      const yFood = FOODS[K.yedek];
      yedek[i] = kalan > 3 ? clamp((kalan / yFood.p) * 100, 0, TAVAN[K.yedek]) : 0;
    });

    /* 2) Yağ açığı zeytinyağıyla kapanır, öğle ve akşama bölünür. */
    const yagVar = sablon.reduce((s, m, i) => s + sabitler[i].f
      + macroOf(FOODS[m.birincil], birincil[i], 'f')
      + macroOf(FOODS[K.yedek], yedek[i], 'f')
      + macroOf(FOODS[m.karb], karb[i], 'f'), 0);
    yag = clamp(((t.yag - yagVar) / FOODS.zeytinyagi.f) * 100, 0, 45);

    /* 3) Kalan kalori karbonhidrat çapalarına dağılır. */
    const proteinKcal = sablon.reduce((s, m, i) => s + sabitler[i].kcal
      + kcalOf(FOODS[m.birincil], birincil[i])
      + kcalOf(FOODS[K.yedek], yedek[i]), 0) + kcalOf(FOODS.zeytinyagi, yag);

    const kalanKcal = t.kcal - proteinKcal;
    sablon.forEach((m, i) => {
      karb[i] = clamp((Math.max(0, kalanKcal) * karbPay[i] / FOODS[m.karb].kcal) * 100, 0, 260);
    });

    /* Protein kaynağı kalori hedefini tek başına aşıyorsa (yoğun baklagil
       diyetlerinde olur) çapaları kırp — proteini %12'den fazla feda etmeden. */
    if (kalanKcal < -20) {
      const oran = Math.max(0.80, t.kcal / proteinKcal);
      birincil = birincil.map((g) => g * oran);
      yedek = yedek.map((g) => g * oran);
      yag *= oran;   // yağ hedefi de bütçeye tabi; kalori sınırı önce gelir
      if (tur === 5) {
        uyarilar.push('Seçtiğin besin kısıtlarıyla protein hedefini kalori sınırında '
                    + 'tutturmak zor. Porsiyonlar dengeye çekildi; protein biraz '
                    + 'hedefin altında kalabilir.');
      }
    }
  }

  /* Yuvarla ve okunur satırlara çevir. */
  const ogunler = sablon.map((m, i) => {
    const satirlar = [];
    const ekle = (key, g, not = '') => {
      const gr = roundPortion(g);
      if (gr > 0) {
        satirlar.push({
          key, g: gr, ad: FOODS[key].ad, not,
          kcal: Math.round(kcalOf(FOODS[key], gr)),   // günlük sayaç bunu okur
        });
      }
    };

    sabitler[i].satir.forEach((x) => ekle(x.key, x.g));
    ekle(m.birincil, birincil[i], i === 2 ? 'ÇİĞ — rotasyona göre değiştir' : 'ÇİĞ tartılacak');
    if (yedek[i] >= 5 && K.yedek !== m.birincil) ekle(K.yedek, yedek[i]);
    ekle(m.karb, karb[i], 'ÇİĞ tartılacak');
    if (i === 1 || i === 2) ekle('zeytinyagi', yag / 2, 'TARTIYLA, şişeden dökme');

    return { ad: m.ad, emoji: m.emoji, satirlar, rotasyon: i === 2 ? m.birincil : null };
  });

  reconcile(ogunler, t.kcal);

  ogunler.forEach((o) => {
    const top = (k) => o.satirlar.reduce((s, x) => s + macroOf(FOODS[x.key], x.g, k), 0);
    o.kcal = Math.round(o.satirlar.reduce((s, x) => s + kcalOf(FOODS[x.key], x.g), 0));
    o.p = Math.round(top('p'));
    o.lif = Math.round(top('fib'));
  });

  return { ogunler, uyarilar };
}

/**
 * Yuvarlamadan sonra kalan sapmayı kapatır.
 *
 * Her porsiyon 5-10 grama yuvarlandığı için günde dört öğünde 100 kcal'e varan
 * kayma birikebilir. Burada fark, en az zarar veren kalemden kapatılır:
 * önce karbonhidrat (hedefin artığı zaten oradan geliyor), sonra zeytinyağı,
 * en son protein kaynağı — protein en değerli makro olduğu için en son ve
 * yalnızca %15'e kadar kırpılır.
 */
function reconcile(ogunler, hedefKcal) {
  const oncelik = ['yulaf', 'bulgur', 'pirinc', 'patates', 'zeytinyagi',
                   'mercimek', 'nohut', 'tavuk', 'hindi', 'balik', 'kiyma',
                   'whey', 'bitkiselProtein', 'yumurtaAk'];

  for (let tur = 0; tur < 8; tur++) {
    const toplam = ogunler.reduce((s, o) => s
      + o.satirlar.reduce((a, x) => a + kcalOf(FOODS[x.key], x.g), 0), 0);
    const fark = toplam - hedefKcal;
    if (Math.abs(fark) <= Math.max(25, hedefKcal * 0.012)) return;

    /* Sapmayı kapatabilecek, öncelik sırasında en önde gelen kalemi bul. */
    let hedefSatir = null;
    for (const key of oncelik) {
      const adaylar = ogunler.flatMap((o) => o.satirlar.filter((x) => x.key === key));
      if (!adaylar.length) continue;
      hedefSatir = adaylar.sort((a, b) => b.g - a.g)[0];
      break;
    }
    if (!hedefSatir) return;

    const food = FOODS[hedefSatir.key];
    const taban = ['whey', 'bitkiselProtein', 'tavuk', 'hindi', 'balik', 'kiyma',
                   'mercimek', 'nohut', 'yumurtaAk'].includes(hedefSatir.key)
      ? hedefSatir.g * 0.85 : 0;

    const yeni = clamp(hedefSatir.g - (fark / food.kcal) * 100, taban, hedefSatir.g * 1.6);
    const yuvarlanmis = roundPortion(yeni);
    if (yuvarlanmis === hedefSatir.g) return;      // daha ileri gidemiyoruz

    hedefSatir.g = yuvarlanmis;
    const yer = ogunler.find((o) => o.satirlar.includes(hedefSatir));
    if (yuvarlanmis === 0) yer.satirlar = yer.satirlar.filter((x) => x !== hedefSatir);
  }
}

/* -------------------------------------------------------------- antrenman */

/**
 * Hareket adları, kalıcı anahtarlarıyla.
 *
 * Anahtar ağırlık kaydının kimliğidir: hareketin adı değişse ya da başka bir
 * bölünmede başka bir günde geçse bile geçmiş kayıt aynı anahtarda durur.
 * O yüzden buradaki anahtarlar bir kez yazılır, bir daha değişmez.
 */
const HRK_AD = {
  squatpress:  'Squat veya Leg press',
  legpress:    'Leg press',
  squat:       'Squat',
  goblet:      'Goblet squat veya Hack squat',
  rdl:         'Romanian deadlift',
  hipthrust:   'Hip thrust',
  legcurl:     'Leg curl (yatarak)',
  legcurlo:    'Leg curl (oturarak)',
  legext:      'Leg extension',
  calf:        'Calf raise (ayakta)',
  calfo:       'Calf raise (oturarak)',

  bench:       'Bench press',
  dbbench:     'Dumbbell bench press',
  incline:     'Incline dumbbell press (30°)',
  omuzpress:   'Omuz press (oturarak)',
  lateral:     'Lateral raise',
  pushdown:    'Triceps pushdown',
  overheadtri: 'Overhead triceps extension',

  latpull:     'Lat pulldown',
  cablerow:    'Seated cable row',
  dbrow:       'Dumbbell row (tek kol)',
  barrow:      'Barbell row',
  facepull:    'Face pull',
  curl:        'Biceps curl',
  hammer:      'Hammer curl',

  plank:       'Plank',
  legraise:    'Lying leg raise',
};

/** Bir antrenman satırı: hangi hareket, kaç set, kaç tekrar, ne kadar dinlenme. */
function g(key, set, tekrar, dk) {
  const ad = HRK_AD[key];
  if (!ad) throw new Error(`plan.js: bilinmeyen hareket anahtarı "${key}"`);
  return { key, ad, set, tekrar, dk };
}

/*  Set ve tekrar aralıkları hareketin işine göre: bileşik hareketlerde az
    tekrar–çok dinlenme (yük taşımak için), izolasyonda çok tekrar–az dinlenme
    (eklem yerine kası yormak için). Diyetteyken hacim değil, ağırlığın
    düşmemesi korur — bu yüzden ilk hareket hep en ağır olanı. */
const HAREKETLER = {
  fullBodyA: [
    g('squatpress', 3, '8-10', '2-3 dk'), g('bench', 3, '6-8', '2-3 dk'),
    g('latpull', 3, '8-10', '2 dk'), g('rdl', 3, '10', '2 dk'),
    g('omuzpress', 3, '10', '90 sn'), g('plank', 3, '30-45 sn', '45 sn'),
  ],
  fullBodyB: [
    g('legpress', 3, '10-12', '2-3 dk'), g('incline', 3, '8-10', '2 dk'),
    g('cablerow', 3, '10-12', '2 dk'), g('legcurl', 3, '12', '90 sn'),
    g('lateral', 3, '15', '60 sn'), g('curl', 3, '12', '60 sn'),
  ],
  fullBodyC: [
    g('goblet', 3, '10-12', '2-3 dk'), g('dbbench', 3, '8-10', '2 dk'),
    g('barrow', 3, '8-10', '2 dk'), g('legext', 3, '15', '60 sn'),
    g('omuzpress', 3, '10', '90 sn'), g('pushdown', 3, '12', '60 sn'),
  ],

  ustA: [
    g('bench', 4, '6-8', '2-3 dk'), g('latpull', 4, '8-10', '2 dk'),
    g('omuzpress', 3, '8-10', '2 dk'), g('dbrow', 3, '10-12', '90 sn'),
    g('pushdown', 3, '12', '60 sn'), g('curl', 3, '12', '60 sn'),
  ],
  altA: [
    g('legpress', 4, '10-12', '2-3 dk'), g('rdl', 3, '8-10', '2 dk'),
    g('legcurl', 3, '12', '90 sn'), g('legext', 3, '12-15', '60 sn'),
    g('calf', 4, '15', '45 sn'), g('plank', 3, '30-45 sn', '45 sn'),
  ],
  ustB: [
    g('incline', 4, '8-10', '2 dk'), g('cablerow', 4, '10-12', '2 dk'),
    g('lateral', 3, '15', '60 sn'), g('facepull', 3, '15', '60 sn'),
    g('hammer', 3, '12', '60 sn'), g('overheadtri', 3, '12', '60 sn'),
  ],
  altB: [
    g('goblet', 4, '10-12', '2-3 dk'), g('hipthrust', 3, '10-12', '2 dk'),
    g('legcurlo', 3, '12', '90 sn'), g('legext', 3, '15', '60 sn'),
    g('calfo', 4, '15', '45 sn'), g('legraise', 3, '12', '60 sn'),
  ],

  itis: [
    g('bench', 4, '6-8', '2-3 dk'), g('omuzpress', 4, '8-10', '2 dk'),
    g('incline', 3, '10', '2 dk'), g('lateral', 3, '15', '60 sn'),
    g('pushdown', 3, '12', '60 sn'),
  ],
  cekis: [
    g('latpull', 4, '8-10', '2 dk'), g('barrow', 4, '8-10', '2 dk'),
    g('cablerow', 3, '10-12', '90 sn'), g('facepull', 3, '15', '60 sn'),
    g('curl', 3, '12', '60 sn'), g('hammer', 3, '12', '60 sn'),
  ],
  bacak: [
    g('squatpress', 4, '8-10', '2-3 dk'), g('rdl', 4, '8-10', '2 dk'),
    g('legpress', 3, '12', '90 sn'), g('legcurl', 3, '12', '90 sn'),
    g('calf', 4, '15', '45 sn'),
  ],
};

/** Bir hareket satırının okunur hâli: "Bench press — 4 × 6-8 · 2-3 dk" */
export function hareketMetni(x) {
  return `${x.ad} — ${x.set} × ${x.tekrar} · ${x.dk}`;
}

/*  İlerleme kuralı her bölünmede aynı, o yüzden tek yerde duruyor. Sayısı
    yazılı bir hedefi olmayan program takip edilmez: "ağır çalış" ölçülemez,
    "geçen hafta 8 tekrar yaptıysan bu hafta 2,5 kg ekle" ölçülür. */
export const ILERLEME = 'Çift ilerleme: tekrar aralığının üst ucunu tüm setlerde '
  + 'tamamladığın hafta ağırlığa 2,5 kg ekle, tekrarlar alt uca düşsün, oradan '
  + 'tekrar tırman. Setleri başarısızlığa götürme — rezervde 1-2 tekrar kalsın; '
  + 'yalnızca izolasyon hareketlerinin son setinde sonuna kadar git.';

/** Antrenman günü sayısına göre bölünme. */
export function buildTraining(gun) {
  const n = clamp(Number(gun) || 0, 0, 7);
  if (n <= 1) {
    return { ad: 'Haftada 1 gün yetmez', gunler: [{ ad: 'Full body', hareketler: HAREKETLER.fullBodyA }],
             not: 'Kas korumak için haftada en az 2, tercihen 3 gün gerekir. '
                + 'Şimdilik full body ile başla, üçüncü güne çık.' };
  }
  if (n === 2) {
    return { ad: 'Full body ×2', gunler: [
      { ad: 'Full body A', hareketler: HAREKETLER.fullBodyA },
      { ad: 'Full body B', hareketler: HAREKETLER.fullBodyB },
    ], not: 'İki gün arasında en az 2 gün olsun.' };
  }
  if (n === 3) {
    return { ad: 'Full body ×3', gunler: [
      { ad: 'Full body A', hareketler: HAREKETLER.fullBodyA },
      { ad: 'Full body B', hareketler: HAREKETLER.fullBodyB },
      { ad: 'Full body C', hareketler: HAREKETLER.fullBodyC },
    ], not: 'Diyetteyken en verimli bölünme bu: her kas grubu haftada 3 kez uyarılır. '
          + 'Pazartesi–Çarşamba–Cuma gibi aralarında birer gün olacak şekilde dağıt.' };
  }
  if (n === 4) {
    return { ad: 'Üst / Alt ×2', gunler: [
      { ad: 'Üst A', hareketler: HAREKETLER.ustA },
      { ad: 'Alt A', hareketler: HAREKETLER.altA },
      { ad: 'Üst B', hareketler: HAREKETLER.ustB },
      { ad: 'Alt B', hareketler: HAREKETLER.altB },
    ], not: 'Pazartesi Üst A, Salı Alt A, Perşembe Üst B, Cuma Alt B. '
          + 'Arka arkaya iki üst ya da iki alt gün gelmesin; her kas haftada 2 kez çalışır.' };
  }
  return { ad: 'İtiş / Çekiş / Bacak', gunler: [
    { ad: 'İtiş A', hareketler: HAREKETLER.itis },
    { ad: 'Çekiş A', hareketler: HAREKETLER.cekis },
    { ad: 'Bacak A', hareketler: HAREKETLER.bacak },
    { ad: 'İtiş B', hareketler: HAREKETLER.itis },
    { ad: 'Çekiş B', hareketler: HAREKETLER.cekis },
    ...(n >= 6 ? [{ ad: 'Bacak B', hareketler: HAREKETLER.bacak }] : []),
  ], not: 'Bu hacim toparlanma ister: uyku 7+ saat olmazsa 4 güne düş.' };
}

/* --------------------------------------------------------------- rotasyon */

const ROT_AD = {
  balik: 'Somon / uskumru / levrek', kiyma: 'Dana kıyma (%10 yağlı)',
  tavuk: 'Tavuk göğsü', hindi: 'Hindi göğsü', mercimek: 'Mercimek yemeği',
};

function aksamRotasyonu(kacin, gram) {
  const K = proteinKaynaklari(kacin);
  const gunler = [['Pazartesi', 'Pzt'], ['Salı', 'Sal'], ['Çarşamba', 'Çar'],
                  ['Perşembe', 'Per'], ['Cuma', 'Cum'], ['Cumartesi', 'Cmt'], ['Pazar', 'Paz']];
  const kaynaklar = K.aksamRotasyon;
  return gunler.map(([gun, kisa], i) => {
    const key = kaynaklar[i % kaynaklar.length];
    const oran = FOODS[kaynaklar[0]].p / FOODS[key].p;
    return { gun, kisa, key, ad: ROT_AD[key] || FOODS[key].ad, g: roundPortion(gram * oran) };
  });
}

/* ------------------------------------------------------------------- plan */

/** Profilden tam programı üretir. */
export function buildPlan(profile) {
  const t = computeTargets(profile);
  const { ogunler, uyarilar } = buildMeals(t, profile.kacin || []);
  t.uyarilar = [...t.uyarilar, ...uyarilar];
  const antrenman = buildTraining(profile.antrenmanGun);

  const aksam = ogunler[2];
  const aksamProtein = aksam.satirlar.find((x) => x.key === aksam.rotasyon);
  const rotasyon = aksamRotasyonu(profile.kacin || [], aksamProtein?.g || 180);

  const toplam = {
    kcal: ogunler.reduce((s, o) => s + o.kcal, 0),
    p: ogunler.reduce((s, o) => s + o.p, 0),
    lif: ogunler.reduce((s, o) => s + o.lif, 0),
  };

  return { profile, hedef: t, ogunler, antrenman, rotasyon, toplam };
}

/** Lif rampası — hedefe bir günde çıkmak şişkinlik ve kramp yapar. */
export function fiberRamp(hedefLif) {
  const bas = 15;
  const adim = (hedefLif - bas) / 3;
  return [1, 2, 3, 4].map((h) => [`${h}. hafta`,
    `${Math.round(bas + adim * (h - 1))} g${h === 1 ? ' — sebzeyi yarım porsiyon başlat' : ''}`]);
}
