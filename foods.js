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
export const BUILD = '2026-09-11k';

/*  Birden fazla sunucu denenir. world.* coğrafyaya göre ülke alan adına
    yönlendirebiliyor; yönlendirilen yanıt CORS başlığı taşımazsa istek
    "ağa ulaşılamadı" diye düşüyor ve kullanıcı bunu internet hatası sanıyor.
    İlki olmazsa ikincisi doğrudan denenir. */
const SUNUCULAR = ['https://world.openfoodfacts.org', 'https://tr.openfoodfacts.org'];
const ZAMAN_ASIMI = 9000;
const ARAMA_ZAMAN_ASIMI = 20000;   // arama uç noktası kayda değer biçimde yavaş

/* İstenen alanlar: yanıtı küçük tutmak telefonda gözle görülür fark yaratır. */
const ALANLAR = 'code,product_name,product_name_tr,generic_name,brands,nutriments,image_small_url';

/**
 * Zaman aşımlı fetch.
 *
 * Hata türleri ayrıştırılır, çünkü hepsine "internet yok" demek yanıltıcı:
 * bağlantı varken de CORS reddi ya da sunucu hatası olabiliyor ve kullanıcı
 * neyi düzelteceğini bilemiyor. İstek başlıksız gider — Accept eklemek
 * bazı vekil sunucularda gereksiz ön kontrol tetikleyebiliyor.
 */
async function getirTek(url, sure = ZAMAN_ASIMI) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), sure);
  try {
    const res = await fetch(url, { signal: ctrl.signal, mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`sunucu ${res.status} döndü`);
    return await res.json();
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error(`${Math.round(sure / 1000)} sn içinde yanıt gelmedi`);
    if (err instanceof TypeError) throw new Error('sunucuya ulaşılamadı (CORS ya da bağlantı)');
    throw err;
  } finally {
    clearTimeout(t);
  }
}

/** Sunucuları sırayla dener; hepsi düşerse son hatayı bildirir. */
async function getir(yol, sure) {
  let sonHata;
  for (const kok of SUNUCULAR) {
    try {
      return await getirTek(kok + yol, sure);
    } catch (err) {
      sonHata = err;
    }
  }
  throw sonHata || new Error('bilinmeyen hata');
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

  /*  Önce alan süzgeciyle (yanıt küçük olsun), olmazsa süzgeçsiz: bazı
      sunucular tanımadığı alan adında hata döndürüyor. */
  let data;
  try {
    data = await getir(`/api/v2/product/${temiz}.json?fields=${ALANLAR}`);
  } catch {
    data = await getir(`/api/v2/product/${temiz}.json`);
  }
  if (!data || data.status === 0 || !data.product) return null;
  return urunDenNesne({ ...data.product, code: data.product.code || temiz });
}

/** İsimle arama. En çok taranan ürünler önce gelir. */
export async function searchFoods(q) {
  const terim = String(q || '').trim();
  if (terim.length < 2) return [];

  const yol = `/cgi/search.pl?search_terms=${encodeURIComponent(terim)}`
            + `&search_simple=1&action=process&json=1&page_size=24`
            + `&sort_by=unique_scans_n&lc=tr&fields=${ALANLAR}`;

  const data = await getir(yol, ARAMA_ZAMAN_ASIMI);
  return (data?.products || []).map(urunDenNesne).filter(Boolean).slice(0, 20);
}

/** Gramaja düşen kalori. */
export function kcalFor(per100, gram) {
  const p = Number(per100), g = Number(gram);
  if (!Number.isFinite(p) || !Number.isFinite(g)) return 0;
  return Math.round((p * g) / 100);
}

/**
 * Bağlantı sınaması.
 *
 * "İnternet hatası" kullanıcı için de geliştirici için de işe yaramaz bir
 * bilgi: bağlantı varken CORS reddi, yönlendirme, sunucu hatası ya da
 * yavaşlık da aynı şekilde görünüyor. Bu işlev her sunucuyu tek tek deneyip
 * ne olduğunu açıkça yazar.
 */
export async function testConnection() {
  const sonuclar = [];
  for (const kok of SUNUCULAR) {
    const bas = Date.now();
    try {
      const d = await getirTek(`${kok}/api/v2/product/737628064502.json?fields=code,product_name`, 12000);
      sonuclar.push({
        kok, ok: true,
        not: `${Date.now() - bas} ms · ${d?.status === 1 ? 'ürün geldi' : 'yanıt geldi, ürün yok'}`,
      });
    } catch (err) {
      sonuclar.push({ kok, ok: false, not: `${Date.now() - bas} ms · ${err?.message || err}` });
    }
  }
  return sonuclar;
}

/* ------------------------------------------------------------ barkod okuma */

const FORMATLAR = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];

export function nativeScannerVar() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export function kameraVar() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/*  iOS Safari'de BarcodeDetector yok, o yüzden bir kütüphane gerekiyor. İki
    paket de denenir: @zxing/browser tarayıcı için yazılmış olan, @zxing/library
    ise eski sürümlerde aynı sınıfları taşıyan. Global adları farklı olduğu için
    ikisi de aranır ve hangi yöntem varsa o kullanılır — sürümler arasında API
    değiştiği için varsayım yapmak yerine çalışma anında bakılıyor. */
const KUTUPHANELER = [
  { url: 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js', global: 'ZXingBrowser' },
  { url: 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/umd/index.min.js', global: 'ZXing' },
];

let kutuphane = null;

function betikYukle(url) {
  return new Promise((ok, hata) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = ok;
    s.onerror = () => hata(new Error('indirilemedi'));
    document.head.appendChild(s);
    setTimeout(() => hata(new Error('zaman aşımı')), 15000);
  });
}

/** Okuyucu kütüphanesini indirir; ilkini indiremezse ikincisini dener. */
async function okuyucuYukle() {
  if (kutuphane) return kutuphane;
  const hatalar = [];

  for (const { url, global } of KUTUPHANELER) {
    try {
      if (!window[global]) await betikYukle(url);
      const ns = window[global];
      if (ns?.BrowserMultiFormatReader) {
        kutuphane = { ns, ad: global };
        return kutuphane;
      }
      hatalar.push(`${global}: sınıf bulunamadı`);
    } catch (err) {
      hatalar.push(`${global}: ${err.message}`);
    }
  }
  throw new Error('okuyucu yüklenemedi (' + hatalar.join(', ') + ')');
}

/** Şu an hangi okuyucunun kullanıldığı — ekranda gösterilip teşhise yarıyor. */
export function okuyucuAdi() {
  if (nativeScannerVar()) return 'tarayıcının kendi okuyucusu';
  return kutuphane ? kutuphane.ad : 'ZXing (indirilecek)';
}

/**
 * Kamerayı açar ve barkod okumaya başlar.
 *
 * Kütüphane yolunda kamerayı KÜTÜPHANE açar, biz değil. Önceki sürümde akışı
 * kendimiz alıp hazır <video> öğesini devrediyorduk; ZXing o durumda kendi
 * çözümleme döngüsünü kuramıyor ve hiçbir barkod okunmuyordu.
 *
 * Geriye durdurma işlevi döner; çağıran bunu mutlaka çağırmalı.
 */
export async function startScanner(video, onCode) {
  if (!kameraVar()) throw new Error('bu tarayıcı kamerayı kullanmaya izin vermiyor');

  video.setAttribute('playsinline', 'true');   // iOS yoksa videoyu tam ekrana alır
  video.setAttribute('autoplay', 'true');
  video.muted = true;

  /* --- 1. yol: tarayıcının kendi okuyucusu (Android/Chrome) --------------- */
  if (nativeScannerVar()) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play().catch(() => {});

    let durduruldu = false;
    const kapat = () => {
      durduruldu = true;
      stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
      video.srcObject = null;
    };

    let detector;
    try { detector = new window.BarcodeDetector({ formats: FORMATLAR }); }
    catch { detector = new window.BarcodeDetector(); }

    const tara = async () => {
      if (durduruldu) return;
      try {
        const bulunan = await detector.detect(video);
        const kod = bulunan?.[0]?.rawValue;
        if (kod) { kapat(); onCode(String(kod)); return; }
      } catch { /* kare okunamadı */ }
      if (!durduruldu) setTimeout(tara, 200);
    };
    tara();
    return kapat;
  }

  /* --- 2. yol: ZXing kamerayı kendisi açsın (iOS Safari) ------------------ */
  const { ns } = await okuyucuYukle();
  const reader = new ns.BrowserMultiFormatReader();
  const kisitlar = { video: { facingMode: { ideal: 'environment' } }, audio: false };

  let bitti = false;
  const bulundu = (sonuc) => {
    if (bitti || !sonuc) return;
    const kod = sonuc.getText?.() ?? sonuc.text;
    if (!kod) return;
    bitti = true;
    onCode(String(kod));
  };

  /*  Sürümler arasında yöntem adı değişiyor: yenisi kontrol nesnesi döndürür,
      eskisi döndürmez ve reset() ile kapatılır. Hangisi varsa o kullanılır. */
  let kontrol = null;
  if (typeof reader.decodeFromConstraints === 'function') {
    kontrol = await reader.decodeFromConstraints(kisitlar, video, bulundu);
  } else if (typeof reader.decodeFromVideoDevice === 'function') {
    kontrol = await reader.decodeFromVideoDevice(undefined, video, bulundu);
  } else {
    throw new Error('okuyucuda beklenen yöntem yok');
  }

  return () => {
    bitti = true;
    try { kontrol?.stop?.(); } catch {}
    try { reader.reset?.(); } catch {}
    const s = video.srcObject;
    if (s?.getTracks) s.getTracks().forEach((t) => { try { t.stop(); } catch {} });
    video.srcObject = null;
  };
}

/**
 * Fotoğraftan barkod okur.
 *
 * iOS'ta canlı video üzerinden okuma zayıf kalabiliyor; telefonun kamera
 * uygulamasıyla çekilen tek kare hem çok daha net hem de kullanıcı barkodu
 * istediği gibi çerçeveleyebiliyor. Canlı okuma tutmazsa çıkış yolu bu.
 */
export async function decodeImageFile(file) {
  if (!file) throw new Error('dosya yok');

  if (nativeScannerVar() && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      let detector;
      try { detector = new window.BarcodeDetector({ formats: FORMATLAR }); }
      catch { detector = new window.BarcodeDetector(); }
      const bulunan = await detector.detect(bitmap);
      bitmap.close?.();
      if (bulunan?.[0]?.rawValue) return String(bulunan[0].rawValue);
    } catch { /* kütüphaneye düş */ }
  }

  const { ns } = await okuyucuYukle();
  const reader = new ns.BrowserMultiFormatReader();
  const url = URL.createObjectURL(file);
  try {
    const sonuc = await reader.decodeFromImageUrl(url);
    const kod = sonuc?.getText?.() ?? sonuc?.text;
    if (!kod) throw new Error('barkod bulunamadı');
    return String(kod);
  } catch (err) {
    throw new Error('fotoğrafta barkod okunamadı — barkodun tamamı kareye girsin ve net olsun');
  } finally {
    URL.revokeObjectURL(url);
    try { reader.reset?.(); } catch {}
  }
}
