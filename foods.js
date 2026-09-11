/* ==========================================================================
   foods.js — barkod okuma ve ürün arama
   --------------------------------------------------------------------------
   Ürün bilgisi Open Food Facts'ten gelir: açık veri, anahtar istemez, Türk
   ürünlerinin büyük kısmı kayıtlıdır. Ağ yoksa ya da ürün bulunamazsa elle
   giriş her zaman açıktır — bu ekran hiçbir durumda çıkmaz sokak olmamalı.

   Barkod okuma iki yoldan denenir:
     1. Tarayıcının kendi BarcodeDetector'ı (Android/Chrome'da var)
     2. Yoksa ZXing kütüphanesi (iOS Safari için; CDN'den, istendiğinde)
   İkisi de olmazsa kullanıcı barkodu elle yazar.
   ========================================================================== */

/* Sürüm damgası — app.js karışık sürüm yüklenmesini bununla yakalar. */
export const BUILD = '2026-09-11f';

const API = 'https://world.openfoodfacts.org';
const ZAMAN_ASIMI = 9000;

/* İstenen alanlar: yanıtı küçük tutmak telefonda gözle görülür fark yaratır. */
const ALANLAR = 'code,product_name,product_name_tr,generic_name,brands,nutriments,image_small_url';

/** Zaman aşımlı fetch — mobil ağda yanıtsız kalan istek kullanıcıyı kilitler. */
async function getir(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ZAMAN_ASIMI);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Sunucu ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * 100 gramdaki kaloriyi çıkarır.
 * Kayıtların bir kısmında kcal yok, yalnızca kJ var; o zaman çevrilir.
 */
function per100Of(n) {
  const kcal = Number(n?.['energy-kcal_100g']);
  if (Number.isFinite(kcal) && kcal > 0) return Math.round(kcal);

  const kj = Number(n?.['energy-kj_100g'] ?? n?.energy_100g);
  if (Number.isFinite(kj) && kj > 0) return Math.round(kj / 4.184);

  return null;
}

const sayi = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null;
};

/** Ham kaydı uygulamanın kullandığı sade şekle çevirir. */
function urunDenNesne(p) {
  if (!p) return null;
  const per100 = per100Of(p.nutriments);
  if (!per100) return null;               // kalorisi bilinmeyen kayıt işe yaramaz

  const ad = (p.product_name_tr || p.product_name || p.generic_name || '').trim();
  if (!ad) return null;

  return {
    barcode: String(p.code || ''),
    name: ad.slice(0, 80),
    brand: (p.brands || '').split(',')[0].trim().slice(0, 40),
    per100,
    protein100: sayi(p.nutriments?.proteins_100g),
    image: p.image_small_url || '',
  };
}

/** Barkoddan ürün. Bulunamazsa null döner, hata fırlatmaz. */
export async function lookupBarcode(code) {
  const temiz = String(code || '').replace(/\D/g, '');
  if (temiz.length < 6) throw new Error('Barkod en az 6 haneli olmalı');

  const data = await getir(`${API}/api/v2/product/${temiz}.json?fields=${ALANLAR}`);
  if (!data || data.status === 0 || !data.product) return null;
  return urunDenNesne({ ...data.product, code: data.product.code || temiz });
}

/** İsimle arama. En çok taranan ürünler önce gelir. */
export async function searchFoods(q) {
  const terim = String(q || '').trim();
  if (terim.length < 2) return [];

  const url = `${API}/cgi/search.pl?search_terms=${encodeURIComponent(terim)}`
            + `&search_simple=1&action=process&json=1&page_size=24`
            + `&sort_by=unique_scans_n&lc=tr&fields=${ALANLAR}`;

  const data = await getir(url);
  return (data?.products || []).map(urunDenNesne).filter(Boolean).slice(0, 20);
}

/** Gramaja düşen kalori. */
export function kcalFor(per100, gram) {
  const p = Number(per100), g = Number(gram);
  if (!Number.isFinite(p) || !Number.isFinite(g)) return 0;
  return Math.round((p * g) / 100);
}

/* ------------------------------------------------------------ barkod okuma */

const FORMATLAR = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];

export function nativeScannerVar() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export function kameraVar() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
let zxingYuklendi = null;

/** ZXing'i yalnızca gerektiğinde indirir; inmezse çağıran elle girişe düşer. */
function zxingYukle() {
  if (zxingYuklendi) return zxingYuklendi;
  zxingYuklendi = new Promise((ok, hata) => {
    if (window.ZXing) return ok(window.ZXing);
    const s = document.createElement('script');
    s.src = ZXING_URL;
    s.async = true;
    s.onload = () => (window.ZXing ? ok(window.ZXing) : hata(new Error('ZXing yüklenemedi')));
    s.onerror = () => hata(new Error('Barkod kütüphanesi indirilemedi'));
    document.head.appendChild(s);
  }).catch((e) => { zxingYuklendi = null; throw e; });
  return zxingYuklendi;
}

/**
 * Kamerayı açar ve barkod okumaya başlar.
 *
 * Geriye durdurma işlevi döner — çağıran bunu MUTLAKA çağırmalı, yoksa kamera
 * açık kalır ve telefonun ışığı yanmaya devam eder.
 *
 * @param {HTMLVideoElement} video
 * @param {(code:string)=>void} onCode  okunan ilk barkodda çağrılır
 */
export async function startScanner(video, onCode) {
  if (!kameraVar()) throw new Error('Bu tarayıcı kamerayı kullanmaya izin vermiyor');

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
    audio: false,
  });

  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');   // iOS yoksa videoyu tam ekrana alır
  await video.play().catch(() => {});

  let durduruldu = false;
  let zxingReader = null;

  const kapat = () => {
    durduruldu = true;
    try { zxingReader?.reset(); } catch {}
    stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
    if (video) video.srcObject = null;
  };

  if (nativeScannerVar()) {
    let detector;
    try {
      detector = new window.BarcodeDetector({ formats: FORMATLAR });
    } catch {
      detector = new window.BarcodeDetector();       // format listesi desteklenmiyorsa
    }

    const tara = async () => {
      if (durduruldu) return;
      try {
        const bulunan = await detector.detect(video);
        const kod = bulunan?.[0]?.rawValue;
        if (kod) { kapat(); onCode(String(kod)); return; }
      } catch { /* kare okunamadı, sonrakine bak */ }
      if (!durduruldu) setTimeout(tara, 220);
    };
    tara();
    return kapat;
  }

  /* Yerleşik okuyucu yok (iOS Safari): ZXing'e düş. */
  const ZXing = await zxingYukle().catch((e) => { kapat(); throw e; });
  zxingReader = new ZXing.BrowserMultiFormatReader();
  zxingReader.decodeFromVideoElement(video, (sonuc) => {
    if (durduruldu || !sonuc) return;
    const kod = sonuc.getText?.() || sonuc.text;
    if (kod) { kapat(); onCode(String(kod)); }
  });

  return kapat;
}
