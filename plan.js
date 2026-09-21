/* ==========================================================================
   plan.js — programın kendisi
   --------------------------------------------------------------------------
   Burada hesap yok, yalnızca veri var: öğünler gramajıyla, antrenman günleri
   set ve tekrarıyla. Program dışarıdan geliyor ve sabit; uygulamanın işi onu
   hesaplamak değil, takip edilebilir hale getirmek.

   Her satırın kalıcı bir anahtarı var. İşaretler ve girilen ağırlıklar bu
   anahtara yazılıyor, sıra numarasına değil — programda bir satır değişirse
   geçmiş kayıtlar yerinde kalsın diye.
   ========================================================================== */

export const BUILD = '2026-09-22b';

export const BASLIK = "126'dan 105'e";

/* --------------------------------------------------------------- hedefler */

export const HEDEF = {
  kcal: 2000,
  protein: 194,
  haftalikKg: 1,
  hafta: 22,
  suL: 3.5,
  suTik: 7,                 // her tik 500 ml
  adimMin: 8000,
  adimMax: 10000,
  adimTik: 10,              // her tik 1.000 adım
};

/* Günün besin değerleri — öğünlerin toplamı, referans değerleriyle. */
export const TOPLAM = [
  ['Kalori',        '1971 kcal', '/ 2000', true],
  ['Protein',       '197 g',     '/ 190',  false],
  ['Karbonhidrat',  '176 g',     '/ 180',  false],
  ['Yağ',           '57 g',      '/ 58',   true],
  ['Lif',           '~19,5 g',   '/ 25-30', false],
  ['Kalsiyum',      '~925 mg',   '/ 1000', false],
  ['Su',            '3,5 L',     '',       false],
];

/* ---------------------------------------------------------------- öğünler */

export const OGUNLER = [
  {
    key: 'kahvalti', ad: 'Kahvaltı', emoji: '🍳',
    kcal: 418, protein: 45,
    satirlar: [
      { key: 'cream', ad: 'Cream of rice',   gram: '40 g',  not: 'kuru',       kcal: 146 },
      { key: 'sut',   ad: 'Yarım yağlı süt', gram: '200 ml', not: '',          kcal: 92 },
      { key: 'whey',  ad: 'Whey protein',    gram: '45 g',  not: '1,5 ölçek',  kcal: 180 },
    ],
    not: "Whey'i OCAKTAN ALDIKTAN SONRA çırpıp sos olarak üstüne dök — "
       + 'kaynarken atarsan topaklanır. Pişmiş toplam ~220 g.',
  },
  {
    key: 'oglen', ad: 'Öğlen', emoji: '🍗',
    kcal: 772, protein: 77,
    satirlar: [
      { key: 'bulgur',    ad: 'Bulgur',       gram: '140 g pişmiş', not: '50 g çiğ',  kcal: 171 },
      { key: 'tavuk',     ad: 'Tavuk göğsü',  gram: '200 g pişmiş', not: '265 g çiğ', kcal: 305 },
      { key: 'salatalik', ad: 'Salatalık',    gram: '1 adet',       not: '~200 g',    kcal: 30 },
      { key: 'domates',   ad: 'Domates',      gram: '1 adet',       not: '~120 g',    kcal: 22 },
      { key: 'lahana',    ad: 'Mor lahana',   gram: '100 g',        not: '',          kcal: 31 },
      { key: 'zeytinyag', ad: 'Zeytinyağı',   gram: '15 g',         not: '1 yemek kaşığı', kcal: 135 },
      { key: 'yogurt',    ad: 'Yoğurt',       gram: '150 g',        not: '',          kcal: 78 },
    ],
    not: 'Zeytinyağını TART, göz kararı dökme. Günlük yağının çoğu buradan geliyor.',
  },
  {
    key: 'aksam', ad: 'Akşam', emoji: '🐟',
    kcal: 781, protein: 74,
    satirlar: [
      { key: 'basmati',   ad: 'Basmati pirinç', gram: '150 g pişmiş', not: '50 g çiğ',  kcal: 180 },
      { key: 'tavuk',     ad: 'Tavuk göğsü',    gram: '200 g pişmiş', not: '265 g çiğ', kcal: 305 },
      { key: 'salatalik', ad: 'Salatalık',      gram: '1 adet',       not: '~200 g',    kcal: 30 },
      { key: 'domates',   ad: 'Domates',        gram: '1 adet',       not: '~120 g',    kcal: 22 },
      { key: 'lahana',    ad: 'Mor lahana',     gram: '100 g',        not: '',          kcal: 31 },
      { key: 'zeytinyag', ad: 'Zeytinyağı',     gram: '15 g',         not: '1 yemek kaşığı', kcal: 135 },
      { key: 'yogurt',    ad: 'Yoğurt',         gram: '150 g',        not: '',          kcal: 78 },
    ],
    not: 'Öğlenle aynı, tek fark bulgur yerine basmati. Zeytinyağı yine tartılacak.',
  },
];

export const TAKVIYELER = [
  { key: 'omega3', ad: 'Omega 3', ne: 'Öğlen veya akşam',
    not: 'Hedef günde 1-2 g EPA + DHA. Etiketteki "balık yağı" rakamına değil, '
       + 'EPA ve DHA rakamlarına bak — 1000 mg\'lık kapsülde genelde 300 mg EPA+DHA olur.' },
  { key: 'd3k2', ad: 'D3 + K2', ne: 'Öğlen veya akşam',
    not: 'Yağda çözünür, zeytinyağlı öğünle al. Kahvaltıda sadece 6 g yağ var, '
       + 'orada emilimi düşük kalır.' },
  /* Kullandığın magnezyum sabah ve akşam ayrı tablet; ikisi ayrı işaretlenir. */
  { key: 'magSabah', ad: 'Magnezyum — sabah', ne: 'Sabah',
    not: 'Sitrat + taurat + malat, yanında B6 (P-5-P), folik asit ve B12. '
       + 'Sitrat bağırsağı da rahatlatır.' },
  { key: 'magAksam', ad: 'Magnezyum — akşam', ne: 'Akşam · yatmadan 1 saat önce',
    not: 'Bisglisinat (oksitsiz) + B6 (P-5-P). Oksit formundan kaçın, emilimi düşük.' },
];

export const CIG_PISMIS = [
  ['Bulgur (öğlen)',        '50 g çiğ → 140 g'],
  ['Basmati (akşam)',       '50 g çiğ → 150 g'],
  ['Tavuk göğsü',           '265 g çiğ → 200 g'],
  ['Cream of rice + süt',   '40 g + 200 ml → ~220 g'],
];

export const ALISVERIS_GUNLUK = [
  ['Tavuk göğsü', '530 g'], ['Bulgur · basmati', '50 + 50 g'],
  ['Cream of rice', '40 g'], ['Yarım yağlı süt', '200 ml'],
  ['Yoğurt', '300 g'], ['Whey', '45 g'],
  ['Salatalık · domates', '2 + 2 adet'], ['Mor lahana', '200 g'],
  ['Zeytinyağı', '30 g'],
];

export const ALISVERIS_HAFTALIK = [
  ['Tavuk göğsü', '3,7 kg'], ['Bulgur · basmati', '350 + 350 g'],
  ['Cream of rice', '280 g'], ['Yarım yağlı süt', '1,4 L'],
  ['Yoğurt', '2,1 kg'], ['Whey', '~315 g'],
  ['Salatalık · domates', '14 + 14 adet'], ['Mor lahana', '1,4 kg'],
  ['Zeytinyağı', '210 ml'],
];

export const KURALLAR = [
  'Ölçü daima ÇİĞ/KURU ağırlıktan. Pişmiş gram sadece porsiyonlamak için.',
  'ZEYTİNYAĞINI TART. Bir fazla yemek kaşığı 124 kcal — günde iki fazla kaşık, '
    + 'haftada 1 kg yerine 0,8 kg.',
  'SIVI KALORİ YOK. Çay ve kahve şekersiz, gazlı ve meyve suyu yok.',
  'Günde 3,5 L su.',
  'Günde 8-10 bin adım. Hesabın içinde var, atmazsan açık 1100 değil 850 olur.',
  'Antrenmana en yakın öğün kahvaltı olsun — cream of rice + whey hızlı sindirilir, '
    + 'mideyi ağırlaştırmaz. Saati kaydıramıyorsan boş ver, kaloriye etkisi yok.',
  'Tartı haftada bir: PAZARTESİ SABAH, aç karnına, tuvalet sonrası, aynı tartıda.',
  'Toplu pişirilen cream of rice 3 günü geçmesin; pişince 2 saat içinde buzdolabına, '
    + 'ayrı kaplara porsiyonlanmış halde.',
  'Tartı her hafta düzgün 1,0 kg inmez. 2-3 HAFTALIK ORTALAMAYA bak, tek haftaya değil.',
];

export const YOL_HARITASI = [
  ['126 → 117 kg', '2000 kcal · ~1,0 kg/hafta'],
  ['117 → 108 kg', '~1900 kcal · ~0,8 kg/hafta'],
  ['108 → 105 kg', '~1850 kcal · ~0,7 kg/hafta'],
  ['105 kg · koruma', '~2600 kcal'],
];

export const YOL_NOT = '117 kiloya inince haber ver. O noktada yağ deponun günlük '
  + 'verebileceği enerji düşer; 1 kg/haftada ısrar edersek fark kastan gelmeye başlar. '
  + 'Kaloriyi yeniden hesaplarız.';

export const LIF_NOTU = 'Öğlen bulgur, akşam basmati. Bulgurun 50 g\'ında 9,2 g lif var, '
  + 'basmatinin 0,7 g. Bir öğünü bulgura çevirmek lifi 11\'den 19,5 g\'a çıkardı — '
  + 'bedava, kalori aynı, üstüne 3 g fazla protein.';

export const SU_NOTU = 'Su kalori eklemez. 150 g pişmiş pilavın kalorisi, içindeki '
  + '50 g çiğ pirincin kalorisidir. Hesap her zaman çiğden yürür.';

/* -------------------------------------------------------------- antrenman */

/* gunNo: JS'in getDay() değeri — 1 Pazartesi, 5 Cuma. */
export const ANTRENMANLAR = [
  {
    key: 'ustA', ad: 'Üst A', gunNo: 1, gunAd: 'Pazartesi',
    meta: '18 set · ~60 dk',
    hareketler: [
      { key: 'dbbench', ad: 'Dambıl bench press, 15° eğim', set: '4 × 6-8', dk: '2-3 dk',
        alt: 'yoksa: göğüs press makinesi → bar bench (güvenlik barlı rack\'te)',
        form: 'Dirsekler gövdeyle 45-60°, asla 90°. Dipte göğse değdirme, biraz yukarıda dur.' },
      { key: 'latpull', ad: 'Lat pulldown, geniş tutuş', set: '4 × 8-10', dk: '2 dk',
        form: 'Göğsü yukarı çıkar, barı köprücük kemiğine çek. Geriye yatma.' },
      { key: 'omuzpress', ad: 'Omuz press, oturarak', set: '3 × 8-10', dk: '2 dk',
        alt: 'dambıl → yoksa: omuz press makinesi',
        form: 'Sırtını desteğe yasla, bel boşluğu bırakma.' },
      { key: 'dbrow', ad: 'Tek kol dambıl row, sehpa destekli', set: '3 × 10-12', dk: '90 sn',
        alt: 'yoksa: göğüs destekli row makinesi',
        form: 'Dirseği kalçaya doğru çek, gövdeyi döndürme.' },
      { key: 'pushdown', ad: 'Triceps pushdown', set: '2 × 12', dk: '60 sn',
        form: 'Dirsekler gövdede sabit.' },
      { key: 'curl', ad: 'Biceps curl', set: '2 × 12', dk: '60 sn',
        form: 'Belden sallama yok.' },
    ],
  },
  {
    key: 'altA', ad: 'Alt A', gunNo: 2, gunAd: 'Salı',
    meta: 'arka zincir · 17 set',
    hareketler: [
      { key: 'legpress', ad: 'Leg press', set: '3 × 10-12', dk: '2-3 dk',
        form: 'Kalça minderden kalkmaya başladığı yer senin alt sınırın. Dizi kilitleme.' },
      { key: 'backext', ad: '45° back extension', set: '3 × 12', dk: '2 dk',
        alt: 'hiper bench → yoksa: kısıtlı ROM dambıl RDL (diz kapağının hemen altına kadar)',
        form: 'Sırt nötr, hareket kalçadan. Bel yuvarlanırsa dur.' },
      { key: 'legcurl', ad: 'Leg curl, yatarak', set: '3 × 12', dk: '90 sn',
        alt: 'yoksa: oturarak leg curl',
        form: 'Kalçayı yerinden kaldırma.' },
      { key: 'legext', ad: 'Leg extension', set: '2 × 12-15', dk: '60 sn',
        form: 'Tepede 1 saniye sık.' },
      { key: 'calf', ad: 'Calf raise, ayakta', set: '3 × 15', dk: '45 sn',
        alt: 'yoksa: leg press makinesinde calf',
        form: 'Kontrollü in, zıplama yok. Aşil tendonuna saygı.' },
      { key: 'deadbug', ad: 'Dead bug', set: '3 × 8-10', dk: '45 sn',
        alt: 'taraf başına',
        form: 'Bel yere yapışık kalsın. Kalkarsa hareketi kısalt.' },
    ],
  },
  {
    key: 'ustB', ad: 'Üst B', gunNo: 4, gunAd: 'Perşembe',
    meta: 'hacim / açı · 18 set',
    hareketler: [
      { key: 'incline', ad: 'Incline dambıl press, 30°', set: '4 × 8-10', dk: '2 dk',
        alt: 'yoksa: eğimli göğüs press makinesi',
        form: 'Dirsek açısı yine 45-60°.' },
      { key: 'cablerow', ad: 'Seated cable row', set: '4 × 10-12', dk: '2 dk',
        alt: 'yoksa: göğüs destekli row makinesi',
        form: 'Kürekleri birleştir, gövdeyi sallama.' },
      { key: 'lateral', ad: 'Lateral raise', set: '3 × 15', dk: '60 sn',
        form: 'Hafif ağırlık, dirsek hafif bükülü, omuz seviyesini geçme.' },
      { key: 'facepull', ad: 'Face pull', set: '3 × 15', dk: '60 sn',
        alt: 'yoksa: reverse pec deck',
        form: 'Halatı alına doğru çek, dirsekler yüksek.' },
      { key: 'hammer', ad: 'Hammer curl', set: '2 × 12', dk: '60 sn' },
      { key: 'overheadtri', ad: 'Overhead triceps extension', set: '2 × 12', dk: '60 sn',
        alt: 'halat veya dambıl',
        form: 'Dirsekler kulak hizasında sabit.' },
    ],
  },
  {
    key: 'altB', ad: 'Alt B', gunNo: 5, gunAd: 'Cuma',
    meta: 'ön zincir + kalça · 16 set',
    hareketler: [
      { key: 'hack', ad: 'Hack squat makinesi', set: '4 × 10-12', dk: '2-3 dk',
        alt: 'yoksa: Smith machine squat → topuk yükseltilmiş goblet squat (2-3 cm plaka üstünde)',
        form: 'Belin desteği bırakmaya başladığı yer alt sınırın. Zorla derine inme.' },
      { key: 'hipthrust', ad: 'Hip thrust', set: '3 × 10-12', dk: '2 dk',
        alt: 'makine → yoksa: sehpaya yaslanıp barla, kalın ped şart',
        form: 'Tepede kalçayı sık, beli aşırı germe. Çene göğse yakın.' },
      { key: 'legcurlo', ad: 'Leg curl, oturarak', set: '3 × 12', dk: '90 sn',
        alt: 'yoksa: yatarak leg curl' },
      { key: 'calfo', ad: 'Calf raise, oturarak', set: '3 × 15', dk: '45 sn',
        alt: 'yoksa: ayakta calf, hafif' },
      { key: 'cablecrunch', ad: 'Cable crunch, dizüstü', set: '3 × 12-15', dk: '60 sn',
        alt: 'yoksa: reverse crunch (dizler bükülü, kalçayı yerden kaldır)',
        form: 'Karnı kıvır, kalçadan bükülme.' },
    ],
  },
];

/*  Kardiyo türleri. Hız ve eğim yalnızca bantta ve dışarıda anlamlı; diğer
    ikisinde boş bırakılabilsin diye alanların hiçbiri zorunlu değil. */
export const KARDIYO_TURLERI = [
  ['bant',     'Yürüyüş bandı'],
  ['disarida', 'Dışarıda yürüyüş'],
  ['bisiklet', 'Bisiklet'],
  ['eliptik',  'Eliptik'],
];

export function kardiyoAdi(tur) {
  return (KARDIYO_TURLERI.find((x) => x[0] === tur) || [])[1] || 'Kardiyo';
}

export const KARDIYO_NOTU = 'Kardiyonun yaktığı kalori günlük hedefe EKLENMEZ. '
  + 'Adım hedefi zaten hesabın içinde ve yakılanı geri yemek, açığı kapatmanın '
  + 'en hızlı yolu. Burası ne yaptığını takip etmek için, izin almak için değil.';

export const WATCH_NOTU = 'Saatin yazdığı aktif kalori günlük hedefe EKLENMEZ. '
  + 'İki sebep: Apple Watch koşu dışındaki işlerde tipik olarak %20-40 yüksek '
  + 'sayıyor, ve 8-10 bin adım zaten 2000 kcal hesabının içinde. Üstüne eklemek '
  + 'aynı kaloriyi iki kez saymak olur. Burası ne yaptığını görmek için.';

/* Haftanın günleri — getDay() sırasıyla, Pazar 0. */
export const HAFTA = [
  { gunNo: 1, kisa: 'PZT', ikon: '⚖️', etiket: 'ÜST A' },
  { gunNo: 2, kisa: 'SAL', ikon: '🏋️', etiket: 'ALT A' },
  { gunNo: 3, kisa: 'ÇAR', ikon: '🚶', etiket: 'YÜRÜ' },
  { gunNo: 4, kisa: 'PER', ikon: '🏋️', etiket: 'ÜST B' },
  { gunNo: 5, kisa: 'CUM', ikon: '🏋️', etiket: 'ALT B' },
  { gunNo: 6, kisa: 'CMT', ikon: '·',  etiket: '' },
  { gunNo: 0, kisa: 'PAZ', ikon: '·',  etiket: '' },
];

export const ANTRENMAN_NOTU = 'Haftalık toplam 69 set. Vaktin yoksa İLK 3 HAREKETİ YAP, '
  + 'gerisini at — kas koruyan şey bileşik hareketlerdir.';

export const ISINMA = [
  'Bisiklet/eliptik 5 dk, hafif terleyene kadar',
  'Kol daireleri — 10 ileri, 10 geri',
  'Bel rotasyonu — 10 (taraf başına)',
  'Duvara diz değdirme (ayak bileği) — 10 (taraf başına)',
  'Diz üstü lunge esnetme (kalça ön) — 20 sn (taraf başına)',
  'Günün ilk hareketinde 2 hazırlık seti — çok hafif 10 tekrar, sonra orta 5 tekrar. '
    + 'Çalışma seti sayılmaz.',
];

export const ISINMA_NOTU = 'Senin kilonda ısınmadan ilk sete girmek, eklem ağrısının '
  + 'bir numaralı sebebi. Atlama.';

export const SOGUMA = [
  'Hafif bisiklet 5-10 dk (isteğe bağlı, toparlanmaya yardım eder)',
  'Diz üstü lunge esnetme — 30 sn × 2 taraf',
  'Ayak bileği esnetme — 30 sn × 2 taraf',
  'Foam roller sırtüstü, göğüs açma — 30 sn',
];

export const ILK_IKI_HAFTA = {
  baslik: 'İlk 2 hafta — ağırlık arama, ağırlık BUL',
  giris: 'Her harekette üst sınır tekrarını rahatça yapabildiğin bir ağırlıkla başla. '
       + 'Set bittiğinde "3-4 tekrar daha yapabilirdim" demelisin. Bilmiyorsan: '
       + 'makinede en hafif kademe, dambılda 8-10 kg, barda boş bar.',
  adimlar: [
    '5+ tekrar yedekte kaldıysa → BİR SONRAKİ SETTE ağırlığı artır, çekinme',
    '3-4 tekrar yedekte kaldıysa → doğru ağırlık, orada kal',
    'Forma hakim olamıyorsan → ağırlık fazla, düşür',
  ],
  kapanis: 'Bu iki hafta hareketleri öğrenme haftası. 3. HAFTADAN İTİBAREN '
         + 'çift ilerleme kuralına geç.',
};

export const CIFT_ILERLEME = 'Bütün setlerde üst sınır tekrarı, iki antrenman üst üste, '
  + '1-2 tekrar yedekte kalacak şekilde tutturursan → ağırlığı artır.';

export const ARTIS = [
  ['Üst vücut bileşik (press, row, pulldown)', '+2,5 kg'],
  ['Üst vücut izolasyon', '+1-2 kg'],
  ['Alt vücut bileşik (leg press, hack squat, hip thrust)', '+5 kg'],
  ['Alt vücut izolasyon', '+2,5 kg'],
];

export const ILERLEME_NOTU = 'Hiçbir sette başarısızlığa gitme — her zaman 1-2 tekrar '
  + 'yedekte kalsın. 6 tekrarın altına inme, 1RM denemesi yok. Takılırsan (aynı ağırlıkta '
  + '3 antrenman üst üste ilerleyemediysen) %10 hafiflet, baştan tırman.';

export const DELOAD = 'Her 6 haftada bir, 1 hafta: bütün hareketlerde set sayısını yarıya '
  + 'indir, ağırlıkları aynı tut. Erken deload: aynı ağırlıkta tekrarlar 2 antrenman üst '
  + 'üste düşüyorsa, kas ağrısı 72 saati geçiyorsa, veya EKLEM ağrısı (kas değil) '
  + 'başladıysa — o haftayı deload yap.';

export const FOOTER = 'Bu plan gerçek bir diyetisyen muayenesinin yerini tutmaz. Tiroid, '
  + 'insülin direnci, ilaç kullanımı gibi bir durumun varsa plan aynı kalır ama bir hekim '
  + 'görüşü şart. Ayrıca bir kere kan tahlili yaptır: açlık şekeri, HbA1c, lipid paneli, '
  + 'karaciğer enzimleri, TSH, D vitamini.';

/* -------------------------------------------------------------- yardımcılar */

/** Bir günün öğün satırlarının toplam kalorisi (hepsi işaretlenirse). */
export const GUNLUK_KCAL = OGUNLER.reduce((s, o) => s + o.kcal, 0);

/** Tarihin antrenman günü; yoksa null. */
export function gununAntrenmani(d) {
  return ANTRENMANLAR.find((a) => a.gunNo === d.getDay()) || null;
}

/** "4 × 6-8" -> 4. Programın kaç set öngördüğü; sayaçta hedef olarak yazılır. */
export function setSayisi(metin) {
  const m = /^\s*(\d+)/.exec(String(metin || ''));
  return m ? Number(m[1]) : 0;
}

/** "ustA:dbbench" — işaret ve ağırlık kayıtlarının anahtarı. */
export function hareketAnahtari(antrenmanKey, hareketKey) {
  return `${antrenmanKey}:${hareketKey}`;
}
