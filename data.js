/* ==========================================================================
   data.js — yapılandırma, Firebase bağlantısı ve veri depoları
   --------------------------------------------------------------------------
   İki depo (store) vardır ve ikisi de aynı arayüzü sunar:
     • CloudStore : Firebase Firestore — hesap + cihazlar arası anlık senkron
     • LocalStore : yalnızca bu cihazın tarayıcısı (yedek / deneme modu)
   ========================================================================== */

import { dateKey, addDays, today, uid } from './util.js';

/* ---------------------------------------------------------------- ayarlar */

const LS = {
  config:  'habits.firebaseConfig',
  mode:    'habits.mode',          // 'cloud' | 'local'
  prefs:   'habits.prefs',
  habits:  'habits.local.habits',
  entries: 'habits.local.entries',
  tasks:   'habits.local.tasks',
  lists:   'habits.local.lists',
};

/** Giriş ekranına kadar geriye dönük yüklenecek gün sayısı. */
export const WINDOW_DAYS = 180;

/* ------------------------------------------------------- yapılandırma ---- */

/** config.js dosyasındaki değerler; boşsa cihazda saklanan değer kullanılır. */
export async function resolveConfig() {
  let fromFile = null;
  try {
    const mod = await import('./config.js');
    fromFile = mod.firebaseConfig || null;
  } catch { /* config.js yoksa sorun değil */ }

  if (isUsableConfig(fromFile)) return { config: fromFile, source: 'file' };

  const stored = readStoredConfig();
  if (isUsableConfig(stored)) return { config: stored, source: 'device' };

  return { config: null, source: null };
}

export function isUsableConfig(c) {
  return !!(c && typeof c === 'object' && c.apiKey && c.projectId &&
            !String(c.apiKey).includes('BURAYA'));
}

export function readStoredConfig() {
  try { return JSON.parse(localStorage.getItem(LS.config) || 'null'); }
  catch { return null; }
}

export function storeConfig(c) {
  localStorage.setItem(LS.config, JSON.stringify(c));
}

export function clearStoredConfig() {
  localStorage.removeItem(LS.config);
}

/**
 * Firebase konsolundan kopyalanan metni ayrıştırır.
 * Hem saf JSON hem de `const firebaseConfig = { apiKey: "…" };` biçimini kabul eder.
 */
export function parseConfigText(text) {
  const src = String(text || '');
  const start = src.indexOf('{');
  const end = src.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  const body = src.slice(start + 1, end);

  const out = {};
  const re = /["']?([A-Za-z_$][\w$]*)["']?\s*:\s*["']([^"']*)["']/g;
  let m;
  while ((m = re.exec(body))) out[m[1]] = m[2];

  return Object.keys(out).length ? out : null;
}

/* ------------------------------------------------------- tercihler ------- */

const DEFAULT_PREFS = { theme: 'system', remember: true, lastEmail: '' };

export function getPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(LS.prefs) || '{}') }; }
  catch { return { ...DEFAULT_PREFS }; }
}

export function setPrefs(p) {
  localStorage.setItem(LS.prefs, JSON.stringify(p));
}

export function getMode() { return localStorage.getItem(LS.mode) || ''; }
export function setMode(m) { localStorage.setItem(LS.mode, m); }

/* ------------------------------------------------- Firebase SDK yükleme -- */

/* Bir sürüm bulunamazsa sıradakine geçilir; böylece CDN'de sürüm
   değişse bile uygulama açılmaya devam eder. */
const SDK_VERSIONS = ['11.6.0', '11.0.2', '10.14.1', '10.12.2'];

let sdkPromise = null;

export function loadSdk() {
  if (!sdkPromise) sdkPromise = loadSdkOnce();
  return sdkPromise;
}

async function loadSdkOnce() {
  let lastErr = null;
  for (const v of SDK_VERSIONS) {
    const base = `https://www.gstatic.com/firebasejs/${v}/`;
    try {
      const [app, auth, store] = await Promise.all([
        import(/* @vite-ignore */ `${base}firebase-app.js`),
        import(/* @vite-ignore */ `${base}firebase-auth.js`),
        import(/* @vite-ignore */ `${base}firebase-firestore.js`),
      ]);
      return { app, auth, store, version: v };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error('Firebase kütüphanesi yüklenemedi. İnternet bağlantınızı kontrol edin. ' +
                  (lastErr?.message || ''));
}

/** Uygulamayı başlatır; { sdk, app, auth, db } döner. */
export async function initFirebase(config) {
  const sdk = await loadSdk();
  const app = sdk.app.initializeApp(config);
  const auth = sdk.auth.getAuth(app);

  let db;
  const S = sdk.store;
  try {
    if (S.persistentLocalCache && S.initializeFirestore) {
      db = S.initializeFirestore(app, {
        localCache: S.persistentLocalCache(
          S.persistentMultipleTabManager ? { tabManager: S.persistentMultipleTabManager() } : {}
        ),
      });
    } else {
      db = S.getFirestore(app);
      if (S.enableIndexedDbPersistence) await S.enableIndexedDbPersistence(db).catch(() => {});
    }
  } catch {
    db = S.getFirestore(app);           // çevrimdışı önbellek açılamadıysa yine de çalış
  }

  try {
    await sdk.auth.setPersistence(auth, sdk.auth.browserLocalPersistence);
  } catch { /* bazı gizli sekmelerde desteklenmez */ }

  return { sdk, app, auth, db };
}

/**
 * Oturumun ne kadar hatırlanacağını belirler.
 *   remember = true  -> tarayıcı kapatılsa da açık kalır (varsayılan)
 *   remember = false -> yalnızca bu sekme kapanana kadar
 * Giriş denemesinden hemen ÖNCE çağrılmalıdır.
 */
export async function setAuthPersistence(fb, remember) {
  const A = fb.sdk.auth;
  const mode = remember ? A.browserLocalPersistence : A.browserSessionPersistence;
  if (!mode) return;
  try { await A.setPersistence(fb.auth, mode); } catch { /* gizli sekmede desteklenmeyebilir */ }
}

/* --------------------------------------------------- hata mesajları ------ */

const AUTH_ERRORS = {
  'auth/invalid-email':            'E-posta adresi geçersiz görünüyor.',
  'auth/user-disabled':            'Bu hesap devre dışı bırakılmış.',
  'auth/user-not-found':           'Bu e-posta ile kayıtlı bir hesap yok.',
  'auth/wrong-password':           'Şifre hatalı.',
  'auth/invalid-credential':       'E-posta veya şifre hatalı.',
  'auth/email-already-in-use':     'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.',
  'auth/weak-password':            'Şifre en az 6 karakter olmalı.',
  'auth/missing-password':         'Şifre alanı boş olamaz.',
  'auth/too-many-requests':        'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.',
  'auth/network-request-failed':   'İnternet bağlantısı kurulamadı.',
  'auth/operation-not-allowed':    'Firebase projenizde "E-posta/Şifre" giriş yöntemi açık değil. ' +
                                   'Firebase konsolu → Authentication → Sign-in method → Email/Password → Etkinleştir.',
  'auth/configuration-not-found':  'Firebase projenizde Authentication kurulmamış. ' +
                                   'Firebase konsolu → Authentication → Get started → Email/Password → Etkinleştir.',
  'auth/invalid-api-key':          'Firebase apiKey değeri hatalı. Ayarlardan yapılandırmayı yeniden yapıştırın.',
  'auth/api-key-not-valid':        'Firebase apiKey değeri hatalı. Ayarlardan yapılandırmayı yeniden yapıştırın.',
  'auth/unauthorized-domain':      'Bu adres Firebase projesinde yetkili değil. ' +
                                   'Authentication → Settings → Authorized domains bölümüne alan adınızı ekleyin.',
};

export function authErrorMessage(err) {
  const code = err?.code || '';
  if (AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  const msg = String(err?.message || 'Bilinmeyen bir hata oluştu.');
  if (msg.includes('api-key-not-valid')) return AUTH_ERRORS['auth/invalid-api-key'];
  return msg.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '');
}

/* ================================================================ CloudStore */

export class CloudStore {
  constructor(fb, user) {
    this.fb = fb;
    this.user = user;
    this.S = fb.sdk.store;
    this.db = fb.db;
    this.unsubs = [];
    this.handlers = {};
  }

  get mode() { return 'cloud'; }
  get label() { return this.user.email || 'Hesap'; }

  _col(name) {
    return this.S.collection(this.db, 'users', this.user.uid, name);
  }

  _doc(name, id) {
    return this.S.doc(this.db, 'users', this.user.uid, name, id);
  }

  start(handlers) {
    this.handlers = handlers;
    const S = this.S;
    const cutoff = dateKey(addDays(today(), -WINDOW_DAYS));

    this.unsubs.push(S.onSnapshot(
      this._col('habits'),
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) ||
                            String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
        handlers.habits?.(list);
        handlers.status?.({ fromCache: snap.metadata.fromCache });
      },
      (err) => handlers.error?.(err)
    ));

    this.unsubs.push(S.onSnapshot(
      S.query(this._col('entries'), S.where('date', '>=', cutoff)),
      (snap) => {
        const map = new Map();
        snap.forEach((d) => {
          const v = d.data();
          if (v && v.date && v.habitId) map.set(`${v.date}_${v.habitId}`, { ...v, id: d.id });
        });
        handlers.entries?.(map);
        handlers.status?.({ fromCache: snap.metadata.fromCache });
      },
      (err) => handlers.error?.(err)
    ));

    // Alışkanlıklardan bağımsız listeler (market, tek seferlik işler…)
    this.unsubs.push(S.onSnapshot(
      this._col('lists'),
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) ||
                            String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
        handlers.lists?.(rows);
      },
      (err) => handlers.error?.(err)
    ));

    // Günlük yapılacaklar listeleri — her gün için ayrı belge, geçmiş korunur
    this.unsubs.push(S.onSnapshot(
      S.query(this._col('tasks'), S.where('date', '>=', cutoff)),
      (snap) => {
        const map = new Map();
        snap.forEach((d) => {
          const v = d.data();
          if (v && v.date && v.habitId) {
            map.set(`${v.date}_${v.habitId}`, { ...v, items: Array.isArray(v.items) ? v.items : [] });
          }
        });
        handlers.tasks?.(map);
      },
      (err) => handlers.error?.(err)
    ));
  }

  stop() {
    this.unsubs.forEach((u) => { try { u(); } catch {} });
    this.unsubs = [];
  }

  async saveHabit(habit) {
    const id = habit.id || uid();
    const data = { ...habit, updatedAt: new Date().toISOString() };
    delete data.id;
    if (!data.createdAt) data.createdAt = data.updatedAt;
    await this.S.setDoc(this._doc('habits', id), data, { merge: true });
    return id;
  }

  async deleteHabit(id) {
    const S = this.S;
    await S.deleteDoc(this._doc('habits', id));
    // İlgili günlük kayıtları ve yapılacak listelerini de temizle
    try {
      for (const name of ['entries', 'tasks']) {
        const snap = await S.getDocs(S.query(this._col(name), S.where('habitId', '==', id)));
        const refs = [];
        snap.forEach((d) => refs.push(d.ref));
        for (let i = 0; i < refs.length; i += 400) {
          const batch = S.writeBatch(this.db);
          refs.slice(i, i + 400).forEach((r) => batch.delete(r));
          await batch.commit();
        }
      }
    } catch { /* çevrimdışıysa kayıtlar kalabilir, alışkanlık yine de silinir */ }
  }

  async setEntry(dk, habitId, value) {
    const id = `${dk}_${habitId}`;
    const ref = this._doc('entries', id);
    if (!value) {
      await this.S.deleteDoc(ref);
      return;
    }
    await this.S.setDoc(ref, {
      habitId, date: dk, value: Number(value) || 0, updatedAt: new Date().toISOString(),
    });
  }

  async saveList(list) {
    const id = list.id || uid('l');
    const data = { ...list, updatedAt: new Date().toISOString() };
    delete data.id;
    if (!data.createdAt) data.createdAt = data.updatedAt;
    await this.S.setDoc(this._doc('lists', id), data);
    return id;
  }

  async deleteList(id) {
    await this.S.deleteDoc(this._doc('lists', id));
  }

  async setTasks(dk, habitId, items) {
    const ref = this._doc('tasks', `${dk}_${habitId}`);
    if (!items || items.length === 0) {
      await this.S.deleteDoc(ref);
      return;
    }
    await this.S.setDoc(ref, {
      habitId, date: dk, items, updatedAt: new Date().toISOString(),
    });
  }

  async saveOrder(list) {
    const S = this.S;
    const batch = S.writeBatch(this.db);
    list.forEach((h, i) => batch.set(this._doc('habits', h.id), { order: i }, { merge: true }));
    await batch.commit();
  }

  async importData({ habits = [], entries = [], tasks = [], lists = [] }) {
    const S = this.S;
    const ops = [];
    habits.forEach((h) => {
      const { id, ...rest } = h;
      ops.push([this._doc('habits', id || uid()), rest]);
    });
    entries.forEach((e) => {
      if (!e?.date || !e?.habitId || !e?.value) return;
      ops.push([this._doc('entries', `${e.date}_${e.habitId}`),
                { habitId: e.habitId, date: e.date, value: Number(e.value) || 0 }]);
    });
    tasks.forEach((t) => {
      if (!t?.date || !t?.habitId || !Array.isArray(t.items) || !t.items.length) return;
      ops.push([this._doc('tasks', `${t.date}_${t.habitId}`),
                { habitId: t.habitId, date: t.date, items: t.items }]);
    });
    lists.forEach((l) => {
      if (!l?.name) return;
      const { id, ...rest } = l;
      ops.push([this._doc('lists', id || uid('l')), rest]);
    });
    for (let i = 0; i < ops.length; i += 400) {
      const batch = S.writeBatch(this.db);
      ops.slice(i, i + 400).forEach(([ref, data]) => batch.set(ref, data, { merge: true }));
      await batch.commit();
    }
  }

  async wipe() {
    const S = this.S;
    for (const name of ['tasks', 'entries', 'habits', 'lists']) {
      const snap = await S.getDocs(this._col(name));
      const refs = [];
      snap.forEach((d) => refs.push(d.ref));
      for (let i = 0; i < refs.length; i += 400) {
        const batch = S.writeBatch(this.db);
        refs.slice(i, i + 400).forEach((r) => batch.delete(r));
        await batch.commit();
      }
    }
  }
}

/* ================================================================ LocalStore */

export class LocalStore {
  constructor() {
    this.handlers = {};
  }

  get mode() { return 'local'; }
  get label() { return 'Bu cihaz'; }

  _readHabits() {
    try { return JSON.parse(localStorage.getItem(LS.habits) || '[]'); } catch { return []; }
  }

  _readEntries() {
    try { return JSON.parse(localStorage.getItem(LS.entries) || '{}'); } catch { return {}; }
  }

  _readTasks() {
    try { return JSON.parse(localStorage.getItem(LS.tasks) || '{}'); } catch { return {}; }
  }

  _readLists() {
    try { return JSON.parse(localStorage.getItem(LS.lists) || '[]'); } catch { return []; }
  }

  _writeHabits(list) { localStorage.setItem(LS.habits, JSON.stringify(list)); }
  _writeEntries(obj) { localStorage.setItem(LS.entries, JSON.stringify(obj)); }
  _writeTasks(obj)   { localStorage.setItem(LS.tasks, JSON.stringify(obj)); }
  _writeLists(list)  { localStorage.setItem(LS.lists, JSON.stringify(list)); }

  _emit() {
    const list = this._readHabits()
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const raw = this._readEntries();
    const map = new Map();
    for (const [k, v] of Object.entries(raw)) {
      if (v && v.date && v.habitId) map.set(k, v);
    }
    const tmap = new Map();
    for (const [k, v] of Object.entries(this._readTasks())) {
      if (v && v.date && v.habitId) tmap.set(k, { ...v, items: Array.isArray(v.items) ? v.items : [] });
    }

    this.handlers.habits?.(list);
    this.handlers.entries?.(map);
    this.handlers.tasks?.(tmap);
    this.handlers.lists?.(this._readLists().slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    this.handlers.status?.({ fromCache: true });
  }

  start(handlers) {
    this.handlers = handlers;
    this._onStorage = (e) => {
      if ([LS.habits, LS.entries, LS.tasks, LS.lists].includes(e.key)) this._emit();
    };
    window.addEventListener('storage', this._onStorage);
    this._emit();
  }

  stop() {
    if (this._onStorage) window.removeEventListener('storage', this._onStorage);
  }

  async saveHabit(habit) {
    const list = this._readHabits();
    const id = habit.id || uid();
    const now = new Date().toISOString();
    const i = list.findIndex((h) => h.id === id);
    const next = { ...(i >= 0 ? list[i] : {}), ...habit, id, updatedAt: now };
    if (!next.createdAt) next.createdAt = now;
    if (i >= 0) list[i] = next; else list.push(next);
    this._writeHabits(list);
    this._emit();
    return id;
  }

  async deleteHabit(id) {
    this._writeHabits(this._readHabits().filter((h) => h.id !== id));

    const raw = this._readEntries();
    for (const k of Object.keys(raw)) if (raw[k]?.habitId === id) delete raw[k];
    this._writeEntries(raw);

    const tsk = this._readTasks();
    for (const k of Object.keys(tsk)) if (tsk[k]?.habitId === id) delete tsk[k];
    this._writeTasks(tsk);

    this._emit();
  }

  async setEntry(dk, habitId, value) {
    const raw = this._readEntries();
    const k = `${dk}_${habitId}`;
    if (!value) delete raw[k];
    else raw[k] = { habitId, date: dk, value: Number(value) || 0, updatedAt: new Date().toISOString() };
    this._writeEntries(raw);
    this._emit();
  }

  async saveList(list) {
    const id = list.id || uid('l');
    const data = { ...list, updatedAt: new Date().toISOString() };
    delete data.id;
    if (!data.createdAt) data.createdAt = data.updatedAt;
    await this.S.setDoc(this._doc('lists', id), data);
    return id;
  }

  async deleteList(id) {
    await this.S.deleteDoc(this._doc('lists', id));
  }

  async saveList(list) {
    const rows = this._readLists();
    const id = list.id || uid('l');
    const now = new Date().toISOString();
    const i = rows.findIndex((l) => l.id === id);
    const next = { ...(i >= 0 ? rows[i] : {}), ...list, id, updatedAt: now };
    if (!next.createdAt) next.createdAt = now;
    if (i >= 0) rows[i] = next; else rows.push(next);
    this._writeLists(rows);
    this._emit();
    return id;
  }

  async deleteList(id) {
    this._writeLists(this._readLists().filter((l) => l.id !== id));
    this._emit();
  }

  async setTasks(dk, habitId, items) {
    const raw = this._readTasks();
    const k = `${dk}_${habitId}`;
    if (!items || items.length === 0) delete raw[k];
    else raw[k] = { habitId, date: dk, items, updatedAt: new Date().toISOString() };
    this._writeTasks(raw);
    this._emit();
  }

  async saveOrder(list) {
    const byId = new Map(this._readHabits().map((h) => [h.id, h]));
    list.forEach((h, i) => { const t = byId.get(h.id); if (t) t.order = i; });
    this._writeHabits([...byId.values()]);
    this._emit();
  }

  async importData({ habits = [], entries = [], tasks = [], lists = [] }) {
    const cur = new Map(this._readHabits().map((h) => [h.id, h]));
    habits.forEach((h) => { if (h?.id) cur.set(h.id, { ...cur.get(h.id), ...h }); });
    this._writeHabits([...cur.values()]);

    const raw = this._readEntries();
    entries.forEach((e) => {
      if (!e?.date || !e?.habitId || !e?.value) return;
      raw[`${e.date}_${e.habitId}`] = { habitId: e.habitId, date: e.date, value: Number(e.value) || 0 };
    });
    this._writeEntries(raw);

    const tsk = this._readTasks();
    tasks.forEach((t) => {
      if (!t?.date || !t?.habitId || !Array.isArray(t.items) || !t.items.length) return;
      tsk[`${t.date}_${t.habitId}`] = { habitId: t.habitId, date: t.date, items: t.items };
    });
    this._writeTasks(tsk);

    const curLists = new Map(this._readLists().map((l) => [l.id, l]));
    lists.forEach((l) => { if (l?.id) curLists.set(l.id, { ...curLists.get(l.id), ...l }); });
    this._writeLists([...curLists.values()]);

    this._emit();
  }

  async wipe() {
    localStorage.removeItem(LS.habits);
    localStorage.removeItem(LS.entries);
    localStorage.removeItem(LS.tasks);
    localStorage.removeItem(LS.lists);
    this._emit();
  }
}
