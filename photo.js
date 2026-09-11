/* ==========================================================================
   photo.js — fotoğrafı tarayıcıda küçültüp saklanabilir hâle getirir
   --------------------------------------------------------------------------
   Neden: Firebase Storage ücretsiz (Spark) planda kapalıdır, kredi kartı ister.
   Bu yüzden görseller Firestore belgelerinde saklanıyor. Firestore'un belge
   sınırı 1 MiB olduğundan telefondan gelen 3-5 MB'lık fotoğrafı olduğu gibi
   yazmak mümkün değil; burada ölçek küçültülüp JPEG kalitesi hedefe inene
   kadar kademeli düşürülüyor.

   Üretilenler:
     full  — görüntüleyicide açılan sürüm (uzun kenar 1280px, ~150-400 KB)
     thumb — listede görünen küçük sürüm (uzun kenar 160px, ~4-8 KB)

   thumb, sahibinin belgesinde saklanacak kadar küçüktür; full ayrı bir belgeye
   yazılır ve yalnızca fotoğrafa dokunulduğunda indirilir.
   ========================================================================== */

/* Sürüm damgası — app.js karışık sürüm yüklenmesini bununla yakalar. */
export const BUILD = '2026-09-11k';


const FULL_EDGE  = 1280;
const THUMB_EDGE = 160;
const FULL_MAX_BYTES = 600 * 1024;   // base64 hâliyle; Firestore sınırı 1 MiB

/** data URL'in yaklaşık bayt boyutu (base64 çözülmüş hâli değil, yazılan hâli). */
export function dataUrlBytes(url) {
  return Math.ceil((String(url).length - (String(url).indexOf(',') + 1)) * 0.75);
}

async function loadBitmap(file) {
  // createImageBitmap EXIF dönüşünü de uygular; desteklenmezse <img>'e düşeriz.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* aşağıdaki yedek yol */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('Görsel okunamadı'));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function scaleTo(bitmap, maxEdge) {
  const w = bitmap.width || bitmap.naturalWidth;
  const h = bitmap.height || bitmap.naturalHeight;
  const ratio = Math.min(1, maxEdge / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * ratio)), h: Math.max(1, Math.round(h * ratio)) };
}

function render(bitmap, w, h, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';                 // saydam PNG'ler siyah çıkmasın
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * @param {File} file
 * @returns {Promise<{full:string, thumb:string, w:number, h:number, bytes:number}>}
 */
export async function processImage(file) {
  if (!file || !String(file.type).startsWith('image/')) {
    throw new Error('Bu dosya bir görsel değil.');
  }

  const bitmap = await loadBitmap(file);

  const big = scaleTo(bitmap, FULL_EDGE);
  let quality = 0.72;
  let full = render(bitmap, big.w, big.h, quality);

  // Hedefin altına inene kadar önce kaliteyi, sonra ölçeği düşür.
  let edge = FULL_EDGE;
  let guard = 0;
  while (dataUrlBytes(full) > FULL_MAX_BYTES && guard++ < 6) {
    if (quality > 0.4) {
      quality -= 0.12;
    } else {
      edge = Math.round(edge * 0.8);
    }
    const s = scaleTo(bitmap, edge);
    full = render(bitmap, s.w, s.h, Math.max(0.35, quality));
  }

  const small = scaleTo(bitmap, THUMB_EDGE);
  const thumb = render(bitmap, small.w, small.h, 0.5);

  bitmap.close?.();

  return { full, thumb, w: big.w, h: big.h, bytes: dataUrlBytes(full) };
}

/** "11 Eylül 14:32" — fotoğrafın yanında görünen zaman damgası. */
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function stampLabel(iso, now = new Date()) {
  const d = new Date(iso);
  if (isNaN(d)) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today - day) / 86400000);

  if (diff === 0) return `Bugün ${time}`;
  if (diff === 1) return `Dün ${time}`;
  if (diff < 7 && diff > 0) return `${diff} gün önce ${time}`;

  const sameYear = d.getFullYear() === now.getFullYear();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()} ${time}`;
}
