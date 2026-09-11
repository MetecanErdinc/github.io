/* ==========================================================================
   util.js — tarih, planlama ve seri (streak) hesaplamaları
   ========================================================================== */

export const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
export const DAY_FULL  = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const MONTHS     = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                           'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/* ---------- tarih yardımcıları (hepsi yerel saat dilimine göre) ---------- */

export const pad2 = (n) => String(n).padStart(2, '0');

/** Date -> "YYYY-AA-GG" */
export function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "YYYY-AA-GG" -> yerel gece yarısına ayarlı Date */
export function parseKey(k) {
  const [y, m, d] = String(k).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function today() {
  return startOfDay(new Date());
}

export function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

/** Haftanın başlangıcı. firstDay: 1 = Pazartesi, 0 = Pazar */
export function startOfWeek(d, firstDay = 1) {
  const x = startOfDay(d);
  const diff = (x.getDay() - firstDay + 7) % 7;
  return addDays(x, -diff);
}

export function diffDays(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

/** "10 Eylül Perşembe" */
export function humanDate(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${DAY_FULL[d.getDay()]}`;
}

/**
 * Kart üzerinde yer kaplamayan kısa tarih: "Bugün" / "Dün" / "11 Eylül"
 * (başka yıldaysa yıl da eklenir). Saat göstermez.
 */
export function shortDate(input, now = new Date()) {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d)) return '';

  const n = diffDays(d, now);
  if (n === 0) return 'Bugün';
  if (n === -1) return 'Dün';
  if (n === 1) return 'Yarın';

  const sameYear = d.getFullYear() === now.getFullYear();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${sameYear ? '' : ' ' + d.getFullYear()}`;
}

/** "Bugün" / "Dün" / "Yarın" / "10 Eylül Perşembe" */
export function dayLabel(d, ref = today()) {
  const n = diffDays(d, ref);
  if (n === 0) return 'Bugün';
  if (n === -1) return 'Dün';
  if (n === 1) return 'Yarın';
  return humanDate(d);
}

/* ---------- alışkanlık planlaması ---------- */

/** Günlük hedef (işaretlemeli: 1, sayaç: adet, süre: dakika). */
export function targetOf(habit) {
  const t = Number(habit?.target);
  return Number.isFinite(t) && t > 0 ? Math.round(t) : 1;
}

/**
 * Takip şekli: 'check' (yaptım/yapmadım), 'count' (adet), 'time' (dakika).
 * Alan yoksa eski kayıtlardan çıkarılır — süre kipi sonradan eklendiği için
 * o kayıtlarda hedefi 1'den büyük olan her şey sayaçtır.
 */
export function modeOf(habit) {
  const m = habit?.mode;
  if (m === 'check' || m === 'count' || m === 'time') return m;
  return targetOf(habit) > 1 ? 'count' : 'check';
}

/** Dakikayı okunur süreye çevirir: 90 -> "1sa 30dk" */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}dk`;
  if (m === 0) return `${h}sa`;
  return `${h}sa ${m}dk`;
}

/** Kart üzerinde yer dar olduğunda kullanılan kısa biçim: 90 -> "1:30" */
export function formatClock(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  return `${Math.floor(total / 60)}:${pad2(total % 60)}`;
}

/** Bu alışkanlık verilen günde yapılması gerekiyor mu? */
export function isScheduled(habit, d) {
  const s = habit?.schedule || { kind: 'daily' };
  if (s.kind === 'days') {
    const days = Array.isArray(s.days) ? s.days : [];
    return days.length === 0 ? true : days.includes(d.getDay());
  }
  // 'daily' ve 'perWeek' -> her gün gösterilir
  return true;
}

/** Haftada N kez hedefi (esnek plan). */
export function perWeekOf(habit) {
  const n = Number(habit?.schedule?.perWeek);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 3;
}

/**
 * Listeye bağlı alışkanlıklarda günün değerini listeden hesaplar.
 * Her takip şeklinin kendi düzeneği vardır:
 *
 *   check : bütün maddeler işaretlenince alışkanlık tamamlanır
 *   count : işaretlenen madde oranı hedefe ölçeklenir; hepsi işaretlenince
 *           değer hedefe ulaşır (4 madde / 4 hedef durumunda birebir örtüşür)
 *   time  : maddelerin yanına girilen süreler toplanır
 *
 * Liste boşsa null döner — o gün elle girişe dokunulmaz.
 */
export function derivedValue(habit, items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  const mode = modeOf(habit);
  const target = targetOf(habit);

  if (mode === 'time') {
    return items.reduce((sum, it) => sum + (Number(it.minutes) || 0), 0);
  }

  const checked = items.filter((it) => it.done).length;
  if (mode === 'check') return checked === items.length ? 1 : 0;
  return Math.round((target * checked) / items.length);
}

/** Listeye bağlı alışkanlık kartında gösterilecek ilerleme metni. */
export function derivedLabel(habit, items) {
  const mode = modeOf(habit);
  const checked = items.filter((it) => it.done).length;
  if (mode === 'time') {
    return formatClock(items.reduce((s, it) => s + (Number(it.minutes) || 0), 0));
  }
  return `${checked}/${items.length}`;
}

/** Listeye bağlı bir alışkanlık o gün tamamlanmış mı? */
export function derivedDone(habit, items) {
  if (!Array.isArray(items) || items.length === 0) return false;
  const mode = modeOf(habit);
  if (mode === 'time') {
    return items.reduce((s, it) => s + (Number(it.minutes) || 0), 0) >= targetOf(habit);
  }
  return items.every((it) => it.done);
}

/** Hedefin insan diliyle özeti: "günde 8" / "günde 3sa" */
export function targetLabel(habit) {
  const mode = modeOf(habit);
  if (mode === 'check') return '';
  if (mode === 'time') return `günde ${formatDuration(targetOf(habit))}`;
  return `günde ${targetOf(habit)}`;
}

export function isDone(habit, value) {
  return (Number(value) || 0) >= targetOf(habit);
}

/** Planın insan diliyle özeti. */
export function scheduleLabel(habit) {
  const s = habit?.schedule || { kind: 'daily' };
  if (s.kind === 'perWeek') return `Haftada ${perWeekOf(habit)} kez`;
  if (s.kind === 'days') {
    const days = Array.isArray(s.days) ? [...s.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)) : [];
    if (days.length === 0 || days.length === 7) return 'Her gün';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((x) => days.includes(x))) return 'Hafta içi';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Hafta sonu';
    return days.map((x) => DAY_SHORT[x]).join(', ');
  }
  return 'Her gün';
}

/* ---------- seriler (streak) ---------- */

const MAX_LOOKBACK = 400;

function habitStart(habit, values) {
  let start = null;
  if (habit?.createdAt) {
    const d = new Date(habit.createdAt);
    if (!isNaN(d)) start = startOfDay(d);
  }
  // İçe aktarılan veya eski kayıtlar için: ilk giriş tarihini de dikkate al
  for (const k of values.keys()) {
    const d = parseKey(k);
    if (!isNaN(d) && (!start || d < start)) start = d;
  }
  const floor = addDays(today(), -MAX_LOOKBACK);
  if (!start || start < floor) start = floor;
  return start;
}

/**
 * @param {object} habit
 * @param {Map<string, number>} values  tarih anahtarı -> değer
 * @returns {{current:number, best:number, unit:string}}
 */
export function streakInfo(habit, values, todayD = today()) {
  const s = habit?.schedule || { kind: 'daily' };
  if (s.kind === 'perWeek') return weekStreak(habit, values, todayD);

  const target = targetOf(habit);
  const start = habitStart(habit, values);
  const todayK = dateKey(todayD);

  // En uzun seri: ileri doğru tara
  let best = 0, run = 0;
  for (let d = new Date(start); d <= todayD; d = addDays(d, 1)) {
    if (!isScheduled(habit, d)) continue;
    const k = dateKey(d);
    const v = values.get(k) || 0;
    if (v >= target) {
      run += 1;
      if (run > best) best = run;
    } else if (k !== todayK) {
      run = 0;                 // bugün henüz yapılmadıysa seriyi kırmıyoruz
    }
  }

  // Güncel seri: geriye doğru tara
  let cur = 0;
  let d = new Date(todayD);
  if (isScheduled(habit, d) && (values.get(dateKey(d)) || 0) < target) d = addDays(d, -1);
  for (let guard = 0; guard < MAX_LOOKBACK + 10; guard++) {
    if (d < start) break;
    if (!isScheduled(habit, d)) { d = addDays(d, -1); continue; }
    if ((values.get(dateKey(d)) || 0) >= target) { cur += 1; d = addDays(d, -1); }
    else break;
  }

  return { current: cur, best: Math.max(best, cur), unit: 'gün' };
}

function weekStreak(habit, values, todayD) {
  const per = perWeekOf(habit);
  const target = targetOf(habit);
  const thisWeek = startOfWeek(todayD, 1);
  const weeks = [];

  for (let i = 0; i < 60; i++) {
    const ws = addDays(thisWeek, -7 * i);
    let count = 0;
    for (let j = 0; j < 7; j++) {
      const d = addDays(ws, j);
      if (d > todayD) break;
      if ((values.get(dateKey(d)) || 0) >= target) count += 1;
    }
    weeks.push({ met: count >= per, started: i === 0 });
  }

  let cur = 0;
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].met) { cur += 1; continue; }
    if (i === 0) continue;          // içinde bulunulan hafta henüz bitmedi
    break;
  }

  let best = 0, run = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].met) { run += 1; if (run > best) best = run; }
    else if (i !== 0) run = 0;
  }

  return { current: cur, best: Math.max(best, cur), unit: 'hafta' };
}

/** Bir alışkanlığın son N gündeki tamamlanma oranı (%) */
export function completionRate(habit, values, days = 30, todayD = today()) {
  const target = targetOf(habit);
  let planned = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(todayD, -i);
    if (!isScheduled(habit, d)) continue;
    planned += 1;
    if ((values.get(dateKey(d)) || 0) >= target) done += 1;
  }
  return planned === 0 ? 0 : Math.round((done / planned) * 100);
}

/** Belirli bir günün genel ilerlemesi */
export function dayProgress(habits, entries, d) {
  const k = dateKey(d);
  let total = 0, done = 0;
  for (const h of habits) {
    if (h.archived) continue;
    if (!isScheduled(h, d)) continue;
    total += 1;
    if ((entries.get(`${k}_${h.id}`)?.value || 0) >= targetOf(h)) done += 1;
  }
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/* ---------- çeşitli ---------- */

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function uid(prefix = 'h') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function plural(n, word) {
  return `${n} ${word}`;
}
