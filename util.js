/* ==========================================================================
   util.js — tarih ve küçük yardımcılar
   ========================================================================== */

export const BUILD = '2026-09-21a';

const pad2 = (n) => String(n).padStart(2, '0');

export const GUN_ADI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const AY_ADI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** Yerel gece yarısına ayarlı bugün. */
export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseKey(k) {
  const [y, m, g] = String(k).split('-').map(Number);
  return new Date(y, (m || 1) - 1, g || 1);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** İki tarih arasındaki tam gün farkı (a - b). */
export function diffDays(a, b) {
  return Math.round((a.setHours ? new Date(a).setHours(0, 0, 0, 0) : a)
                  - (b.setHours ? new Date(b).setHours(0, 0, 0, 0) : b)) / 86400000;
}

/** "20 Eylül Cumartesi" — bugün ve dün özel yazılır. */
export function gunEtiketi(d) {
  const fark = diffDays(d, today());
  if (fark === 0) return 'Bugün';
  if (fark === -1) return 'Dün';
  if (fark === 1) return 'Yarın';
  return `${d.getDate()} ${AY_ADI[d.getMonth()]} ${GUN_ADI[d.getDay()]}`;
}

export function kisaTarih(d) {
  const fark = diffDays(d, today());
  if (fark === 0) return 'bugün';
  if (fark === -1) return 'dün';
  return `${d.getDate()} ${AY_ADI[d.getMonth()].slice(0, 3)}`;
}

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Türkçe klavyede ondalık virgülle yazılır; "62,5" -> 62.5 */
export function sayi(x) {
  const n = Number(String(x ?? '').trim().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** 62.5 -> "62,5" */
export function yaz(n) {
  return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}
