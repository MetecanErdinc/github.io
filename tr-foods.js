/* ==========================================================================
   tr-foods.js — uygulamaya gömülü Türk yiyecekleri tablosu
   --------------------------------------------------------------------------
   Barkod veritabanları paketli ürünleri tutar. Türkiye'de günlük yenenlerin
   büyük kısmının barkodu yoktur: simit, döner, mercimek çorbası, ev yemeği.
   Bunlar hiçbir barkod sorgusunda çıkmaz, o yüzden burada duruyorlar.

   Tablo uygulamanın içinde: arama anında, çevrimdışı ve ağdan bağımsız çalışır.

   DEĞERLER YAKLAŞIKTIR. 100 gram üzerinden, ortalama pişirme biçimine göre.
   Ev yemeklerinde yağ miktarı kişiden kişiye ikiye katlanabilir; tam ölçüm
   isteyen kendi tarifini "Elle" sekmesinden girip deftere kaydetsin.

   Alanlar: [ad, kcal/100g, protein/100g, porsiyon gramı (varsa), porsiyon adı]
   ========================================================================== */

/* Sürüm damgası — app.js karışık sürüm yüklenmesini bununla yakalar. */
export const BUILD = '2026-09-11j';

const T = (ad, kcal, p, pg, pad) => ({ ad, kcal, p, pg: pg || null, pad: pad || '' });

export const TR_FOODS = [
  /* --- ekmek ve unlular ------------------------------------------------- */
  T('Beyaz ekmek', 265, 8.5, 25, '1 dilim'),
  T('Tam buğday ekmeği', 247, 9.5, 30, '1 dilim'),
  T('Simit', 310, 9, 100, '1 adet'),
  T('Poğaça', 350, 7, 70, '1 adet'),
  T('Açma', 330, 7.5, 80, '1 adet'),
  T('Lavaş', 275, 8, 60, '1 adet'),
  T('Pide (sade)', 275, 8.5, 150, '1 çeyrek'),
  T('Bazlama', 280, 8, 90, '1 adet'),
  T('Peynirli börek', 280, 9, 120, '1 dilim'),
  T('Kıymalı börek', 300, 10, 120, '1 dilim'),
  T('Gözleme (peynirli)', 250, 9, 180, '1 adet'),
  T('Galeta / grissini', 400, 11, 0, ''),

  /* --- kahvaltılık ------------------------------------------------------ */
  T('Beyaz peynir', 260, 17, 30, '1 dilim'),
  T('Kaşar peyniri', 350, 25, 30, '1 dilim'),
  T('Tulum peyniri', 350, 24, 0, ''),
  T('Lor peyniri', 100, 13, 0, ''),
  T('Siyah zeytin', 150, 1.5, 20, '5 adet'),
  T('Yeşil zeytin', 145, 1, 20, '5 adet'),
  T('Tereyağı', 740, 0.8, 10, '1 tatlı kaşığı'),
  T('Bal', 300, 0.3, 20, '1 yemek kaşığı'),
  T('Reçel', 250, 0.4, 20, '1 yemek kaşığı'),
  T('Tahin', 595, 17, 20, '1 yemek kaşığı'),
  T('Pekmez', 290, 0.5, 20, '1 yemek kaşığı'),
  T('Tahin-pekmez', 440, 9, 25, '1 yemek kaşığı'),
  T('Helva (tahin)', 500, 12, 30, '1 dilim'),
  T('Sucuk', 430, 22, 30, '3 dilim'),
  T('Pastırma', 240, 35, 20, '3 dilim'),
  T('Salam', 310, 14, 20, '2 dilim'),
  T('Sosis', 300, 12, 50, '1 adet'),
  T('Yumurta', 143, 12.5, 50, '1 adet'),
  T('Menemen', 100, 6, 250, '1 porsiyon'),

  /* --- süt ürünleri ----------------------------------------------------- */
  T('Süt (tam yağlı)', 61, 3.2, 200, '1 bardak'),
  T('Süt (yarım yağlı)', 47, 3.4, 200, '1 bardak'),
  T('Yoğurt (tam yağlı)', 61, 3.5, 200, '1 kâse'),
  T('Yoğurt (yarım yağlı)', 60, 5.5, 200, '1 kâse'),
  T('Süzme yoğurt', 97, 8.6, 150, '1 kâse'),
  T('Kefir', 55, 3.8, 200, '1 bardak'),
  T('Ayran', 37, 1.8, 200, '1 bardak'),
  T('Labne', 230, 6, 30, '1 yemek kaşığı'),
  T('Kaymak', 420, 5, 30, '1 porsiyon'),

  /* --- et, tavuk, balık -------------------------------------------------- */
  T('Dana kıyma (%20 yağlı)', 250, 18, 0, ''),
  T('Dana kıyma (%10 yağlı)', 190, 20, 0, ''),
  T('Dana bonfile', 150, 22, 0, ''),
  T('Kuzu pirzola', 280, 18, 0, ''),
  T('Tavuk göğsü (derisiz)', 110, 23, 0, ''),
  T('Tavuk but (derili)', 215, 18, 0, ''),
  T('Hindi göğsü', 112, 24, 0, ''),
  T('Hamsi', 130, 20, 0, ''),
  T('Levrek', 97, 19, 0, ''),
  T('Çupra', 115, 20, 0, ''),
  T('Somon', 208, 20, 0, ''),
  T('Uskumru', 205, 19, 0, ''),
  T('Ton balığı (konserve, suda)', 116, 26, 80, '1 kutu'),

  /* --- bakliyat ve tahıl (çiğ) ------------------------------------------ */
  T('Pirinç (çiğ)', 360, 7, 0, ''),
  T('Bulgur (çiğ)', 345, 12, 0, ''),
  T('Kırmızı mercimek (çiğ)', 350, 25, 0, ''),
  T('Nohut (çiğ)', 364, 19, 0, ''),
  T('Kuru fasulye (çiğ)', 330, 21, 0, ''),
  T('Makarna (çiğ)', 360, 12, 0, ''),
  T('Yulaf ezmesi', 389, 13.5, 0, ''),

  /* --- çorbalar (pişmiş) ------------------------------------------------- */
  T('Mercimek çorbası', 60, 3, 250, '1 kâse'),
  T('Ezogelin çorbası', 70, 3.5, 250, '1 kâse'),
  T('Yayla çorbası', 55, 2.5, 250, '1 kâse'),
  T('Tarhana çorbası', 55, 2, 250, '1 kâse'),
  T('İşkembe çorbası', 90, 7, 250, '1 kâse'),
  T('Domates çorbası', 65, 2, 250, '1 kâse'),

  /* --- ana yemekler (pişmiş) --------------------------------------------- */
  T('Pilav (tereyağlı)', 180, 3.5, 150, '1 porsiyon'),
  T('Bulgur pilavı', 145, 4, 150, '1 porsiyon'),
  T('Kuru fasulye yemeği', 130, 7, 250, '1 porsiyon'),
  T('Nohut yemeği', 140, 7, 250, '1 porsiyon'),
  T('Etli türlü / güveç', 120, 8, 250, '1 porsiyon'),
  T('Karnıyarık', 130, 5, 200, '1 adet'),
  T('İmambayıldı', 120, 2, 200, '1 adet'),
  T('Zeytinyağlı yaprak sarma', 150, 3, 150, '5 adet'),
  T('Etli lahana sarma', 130, 6, 200, '1 porsiyon'),
  T('Mantı (yoğurtlu)', 180, 8, 250, '1 porsiyon'),
  T('Makarna (domates soslu)', 150, 5, 250, '1 porsiyon'),
  T('İçli köfte', 240, 9, 100, '1 adet'),
  T('Köfte (ızgara)', 250, 18, 150, '1 porsiyon'),
  T('Tavuk şiş', 160, 26, 150, '1 porsiyon'),
  T('Adana kebap', 280, 17, 150, '1 porsiyon'),
  T('İskender', 230, 14, 300, '1 porsiyon'),
  T('Et döner', 215, 18, 120, '1 porsiyon'),
  T('Tavuk döner', 190, 19, 120, '1 porsiyon'),
  T('Dürüm (tavuk)', 210, 14, 250, '1 adet'),
  T('Lahmacun', 240, 10, 120, '1 adet'),
  T('Pizza (karışık)', 265, 11, 150, '2 dilim'),
  T('Hamburger', 250, 13, 200, '1 adet'),
  T('Tost (kaşarlı)', 300, 13, 150, '1 adet'),
  T('Kumpir', 190, 5, 350, '1 adet'),
  T('Tantuni', 200, 14, 200, '1 adet'),
  T('Kokoreç', 280, 16, 150, '1 porsiyon'),
  T('Midye dolma', 145, 4, 20, '1 adet'),
  T('Çiğ köfte (etsiz)', 190, 5, 100, '1 porsiyon'),

  /* --- tatlılar ---------------------------------------------------------- */
  T('Baklava', 430, 6, 60, '1 dilim'),
  T('Künefe', 290, 7, 150, '1 porsiyon'),
  T('Sütlaç', 130, 3.5, 150, '1 kâse'),
  T('Kazandibi', 160, 4, 150, '1 porsiyon'),
  T('Tulumba tatlısı', 380, 3, 80, '4 adet'),
  T('Revani', 320, 4, 100, '1 dilim'),
  T('Şekerpare', 350, 4, 60, '2 adet'),
  T('Dondurma', 200, 3.5, 100, '2 top'),
  T('Sütlü çikolata', 535, 7, 25, '5 kare'),
  T('Bitter çikolata (%70)', 600, 8, 25, '5 kare'),
  T('Gofret', 480, 6, 35, '1 adet'),
  T('Kek (sade)', 380, 6, 60, '1 dilim'),
  T('Kurabiye / bisküvi', 480, 6, 30, '4 adet'),
  T('Lokum', 330, 0.3, 20, '2 adet'),

  /* --- atıştırmalık ------------------------------------------------------ */
  T('Patates cipsi', 530, 6, 30, '1 küçük paket'),
  T('Mısır cipsi', 500, 6, 30, '1 küçük paket'),
  T('Leblebi', 370, 20, 30, '1 avuç'),
  T('Fındık', 630, 15, 25, '1 avuç'),
  T('Ceviz', 654, 15, 25, '1 avuç'),
  T('Badem', 575, 21, 25, '1 avuç'),
  T('Antep fıstığı', 560, 20, 25, '1 avuç'),
  T('Ay çekirdeği', 580, 21, 30, '1 avuç'),
  T('Kuru üzüm', 300, 3, 30, '1 avuç'),
  T('Kuru kayısı', 240, 3.4, 30, '4 adet'),
  T('Kuru erik', 240, 2.2, 30, '4 adet'),

  /* --- içecekler --------------------------------------------------------- */
  T('Çay (şekersiz)', 1, 0, 200, '1 bardak'),
  T('Türk kahvesi (sade)', 2, 0.1, 70, '1 fincan'),
  T('Sütlü kahve (latte)', 55, 3, 250, '1 bardak'),
  T('Kola', 42, 0, 330, '1 kutu'),
  T('Şekersiz kola', 0.3, 0, 330, '1 kutu'),
  T('Meyve suyu', 45, 0.3, 200, '1 bardak'),
  T('Şalgam suyu', 15, 0.6, 300, '1 bardak'),
  T('Boza', 90, 1.5, 250, '1 bardak'),
  T('Limonata', 40, 0.1, 250, '1 bardak'),
  T('Bira', 43, 0.5, 330, '1 şişe'),
  T('Rakı', 240, 0, 50, '1 duble'),

  /* --- meyve ve sebze ---------------------------------------------------- */
  T('Elma', 52, 0.3, 150, '1 adet'),
  T('Muz', 89, 1.1, 120, '1 adet'),
  T('Portakal', 47, 0.9, 180, '1 adet'),
  T('Mandalina', 53, 0.8, 90, '1 adet'),
  T('Üzüm', 67, 0.6, 150, '1 salkım'),
  T('Karpuz', 30, 0.6, 300, '1 dilim'),
  T('Kavun', 34, 0.8, 200, '1 dilim'),
  T('Çilek', 33, 0.7, 150, '1 kâse'),
  T('Kivi', 61, 1.1, 75, '1 adet'),
  T('Armut', 57, 0.4, 150, '1 adet'),
  T('Şeftali', 39, 0.9, 150, '1 adet'),
  T('Domates', 18, 0.9, 120, '1 adet'),
  T('Salatalık', 15, 0.7, 100, '1 adet'),
  T('Havuç', 41, 0.9, 80, '1 adet'),
  T('Haşlanmış patates', 87, 2, 150, '1 adet'),
  T('Patates kızartması', 310, 3.4, 150, '1 porsiyon'),
  T('Zeytinyağı', 900, 0, 10, '1 yemek kaşığı'),
];

/** Aramada kullanılacak sadeleştirme: büyük/küçük ve Türkçe harf farkı önemsiz. */
function sadelestir(x) {
  return String(x || '').toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
}

/**
 * Tabloda arar.
 * Adın başında geçenler önce gelir: "elma" yazınca "Elma" üstte olsun,
 * "Kuru elma" değil.
 */
export function searchTrFoods(q, limit = 10) {
  const t = sadelestir(q).trim();
  if (t.length < 2) return [];

  const bulunan = TR_FOODS
    .map((f) => ({ f, i: sadelestir(f.ad).indexOf(t) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i || a.f.ad.length - b.f.ad.length)
    .slice(0, limit);

  return bulunan.map(({ f }) => ({
    barcode: '',
    name: f.ad,
    brand: 'Türk mutfağı',
    per100: f.kcal,
    protein100: f.p,
    porsiyon: f.pg,
    porsiyonAd: f.pad,
  }));
}
