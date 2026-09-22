/* ==========================================================================
   store.js — Firebase bağlantısı ve günlük kayıt deposu
   --------------------------------------------------------------------------
   İki depo aynı arayüzü sunar:
     • CloudStore : Firestore — hesap + cihazlar arası senkron
     • LocalStore : yalnızca bu tarayıcı (hesapsız deneme)

   Veri modeli tek tip: gün başına bir belge.
     users/<uid>/days/2026-09-20
       { date, diet:{satirAnahtari:true}, takviye:{...}, su:3, adim:8,
         tarti:126, wo:{ "ustA:dbbench": {ok:true, kg:40, rep:8} } }

   Her şeyin tek belgede olması bilerek: bir antrenman sırasında onlarca küçük
   yazma oluyor ve hepsi aynı güne ait. Ayrı koleksiyonlar telefonun zayıf
   bağlantısında sıra sıra gecikirdi.
   ========================================================================== */

export const BUILD = '2026-09-23a';

import { dateKey, addDays, today } from './util.js';

const LS = {
  mode: 'diyet.mode',            // 'cloud' | 'local'
  days: 'diyet.local.days',
  tema: 'diyet.tema',
};

/** Giriş ekranına kadar geriye dönük yüklenecek gün sayısı. */
export const WINDOW_DAYS = 180;

export function getMode() { return localStorage.getItem(LS.mode) || ''; }
export function setMode(m) { localStorage.setItem(LS.mode, m); }

export function getTema() { return localStorage.getItem(LS.tema) || 'auto'; }
export function setTema(t) { localStorage.setItem(LS.tema, t); }

/* ------------------------------------------------------------ Firebase -- */

const SDK_VERSIONS = ['11.6.0', '11.0.2', '10.14.1'];

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
    } catch (e) { lastErr = e; }
  }
  throw new Error('Firebase kütüphanesi yüklenemedi. İnternet bağlantını kontrol et. '
                + (lastErr?.message || ''));
}

export async function resolveConfig() {
  try {
    const mod = await import('./config.js');
    const c = mod.firebaseConfig;
    if (c && c.apiKey && c.projectId && !String(c.apiKey).includes('BURAYA')) return c;
  } catch { /* config.js yoksa hesapsız moda düşeriz */ }
  return null;
}

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
    }
  } catch {
    db = S.getFirestore(app);          // çevrimdışı önbellek açılamadıysa yine de çalış
  }

  try { await sdk.auth.setPersistence(auth, sdk.auth.browserLocalPersistence); }
  catch { /* bazı gizli sekmelerde desteklenmez */ }

  return { sdk, app, auth, db };
}

const AUTH_ERRORS = {
  'auth/invalid-email':          'E-posta adresi geçersiz görünüyor.',
  'auth/user-not-found':         'Bu e-posta ile kayıtlı bir hesap yok.',
  'auth/wrong-password':         'Şifre hatalı.',
  'auth/invalid-credential':     'E-posta veya şifre hatalı.',
  'auth/email-already-in-use':   'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.',
  'auth/weak-password':          'Şifre en az 6 karakter olmalı.',
  'auth/missing-password':       'Şifre alanı boş olamaz.',
  'auth/too-many-requests':      'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.',
  'auth/network-request-failed': 'İnternet bağlantısı kurulamadı.',
  'auth/operation-not-allowed':  'Firebase projende "E-posta/Şifre" giriş yöntemi açık değil.',
};

export function authErrorMessage(err) {
  return AUTH_ERRORS[err?.code] || err?.message || 'Bilinmeyen bir hata oldu.';
}

/* ------------------------------------------------------------- depolar -- */

/**
 * Gün belgesini normalleştirir — eksik alanlar hep aynı şekilde boş gelsin.
 *
 * Alanlar tek tek sayılır, belge olduğu gibi geçirilmez: okuyan taraf her
 * günde aynı şekli görsün ve eski/bozuk bir belge arayüzü patlatmasın diye.
 * Bunun bedeli, yeni bir alan eklerken BURAYA DA eklemeyi unutmak — unutulursa
 * değer yazılır ama okunurken sessizce düşer.
 */
function normalize(v, dk) {
  return {
    date: dk,
    diet: (v && typeof v.diet === 'object' && v.diet) || {},
    takviye: (v && typeof v.takviye === 'object' && v.takviye) || {},
    wo: (v && typeof v.wo === 'object' && v.wo) || {},
    ekstra: Array.isArray(v?.ekstra) ? v.ekstra : [],
    kardiyo: Array.isArray(v?.kardiyo) ? v.kardiyo : [],
    /*  Apple Watch'tan gelen günlük toplamlar. Uygulama buraya yazmıyor;
        telefondaki Kısayol otomasyonu Firestore'un REST arayüzünden
        dolduruyor. Bu yüzden alanlar savunmacı okunuyor. */
    watch: (v && typeof v.watch === 'object' && v.watch) ? {
      kcal: Number(v.watch.kcal) || 0,
      adim: Number(v.watch.adim) || 0,
      guncel: String(v.watch.guncel || ''),
    } : null,
    su: Number(v?.su) || 0,
    adim: Number(v?.adim) || 0,
    tarti: Number(v?.tarti) || 0,
  };
}

export class CloudStore {
  constructor(fb, uid) {
    this.mode = 'cloud';
    this.fb = fb;
    this.S = fb.sdk.store;
    this.db = fb.db;
    this.uid = uid;
    this.unsubs = [];
  }

  _col() { return this.S.collection(this.db, 'users', this.uid, 'days'); }
  _doc(dk) { return this.S.doc(this.db, 'users', this.uid, 'days', dk); }

  start(handlers) {
    const S = this.S;
    const cutoff = dateKey(addDays(today(), -WINDOW_DAYS));

    this.unsubs.push(S.onSnapshot(
      S.query(this._col(), S.where('date', '>=', cutoff)),
      (snap) => {
        const map = new Map();
        snap.forEach((d) => {
          const v = d.data();
          if (v?.date) map.set(v.date, normalize(v, v.date));
        });
        handlers.days?.(map);
        handlers.status?.({ fromCache: snap.metadata?.fromCache });
      },
      (err) => handlers.error?.(err)
    ));
  }

  stop() {
    this.unsubs.forEach((u) => { try { u(); } catch {} });
    this.unsubs = [];
  }

  /*  Kısmi yazma: yalnızca değişen alanlar gönderilir. Salonda her tik ve her
      ağırlık ayrı bir yazma; tüm günü her seferinde göndermek hem pahalı hem
      de iki cihaz aynı anda açıkken birinin diğerinin işaretini ezmesi demek. */
  async patchDay(dk, patch) {
    await this.S.setDoc(this._doc(dk),
      { date: dk, ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async wipe() {
    const S = this.S;
    const snap = await S.getDocs(this._col());
    const refs = [];
    snap.forEach((d) => refs.push(d.ref));
    for (let i = 0; i < refs.length; i += 400) {
      const batch = S.writeBatch(this.db);
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
  }
}

export class LocalStore {
  constructor() { this.mode = 'local'; this.handlers = {}; }

  _read() {
    try { return JSON.parse(localStorage.getItem(LS.days) || '{}'); } catch { return {}; }
  }
  _write(obj) { localStorage.setItem(LS.days, JSON.stringify(obj)); }

  _emit() {
    const map = new Map();
    for (const [dk, v] of Object.entries(this._read())) map.set(dk, normalize(v, dk));
    this.handlers.days?.(map);
    this.handlers.status?.({ fromCache: true });
  }

  start(handlers) {
    this.handlers = handlers;
    this._onStorage = (e) => { if (e.key === LS.days) this._emit(); };
    window.addEventListener('storage', this._onStorage);
    this._emit();
  }

  stop() {
    if (this._onStorage) window.removeEventListener('storage', this._onStorage);
  }

  async patchDay(dk, patch) {
    const all = this._read();
    const eski = all[dk] || {};
    /*  Bulut tarafındaki merge davranışını taklit et: iç içe nesneler tamamen
        değil, alan alan birleşir. Firestore daha derine de iner; burası tek
        seviye. Fark etmemesi için uygulama bir harekete yazarken kaydın
        tamamını ({ok, kg, rep}) gönderir, parçasını değil. */
    const next = { ...eski, date: dk };
    for (const [k, v] of Object.entries(patch)) {
      next[k] = (v && typeof v === 'object' && !Array.isArray(v))
        ? { ...(eski[k] || {}), ...v }
        : v;
    }
    all[dk] = next;
    this._write(all);
    this._emit();
  }

  async wipe() { localStorage.removeItem(LS.days); this._emit(); }
}
