/* ==========================================================================
   Alışkanlıklarım — ana uygulama
   ========================================================================== */

import { processImage, stampLabel, dataUrlBytes } from './photo.js';

/*  Karışık sürüm koruması.
    --------------------------------------------------------------------------
    Service worker uygulama kodunu "önce ağ, olmazsa önbellek" ile ve her dosya
    için AYRI AYRI sunuyor. Bağlantı zayıfken bazı dosyalar ağdan (yeni), bazıları
    önbellekten (eski) gelebiliyor; ortaya yeni app.js + eski data.js gibi
    tutarsız bir karışım çıkıyor ve yeni kodun beklediği fonksiyon bulunamıyor.

    Her modül kendi sürümünü taşır, açılışta karşılaştırılır. Damga ADLI İTHALLE
    değil ad alanı (namespace) ithaliyle okunur: eski bir dosyada bu dışa aktarım
    hiç yoktur ve adlı ithal bağlanma anında SyntaxError verip uygulamayı hiç
    açmazdı — kontrolün kendisi çökme sebebi olamaz. */
import * as PhotoNS from './photo.js';
import * as UtilNS from './util.js';
import * as DataNS from './data.js';
import * as PlanNS from './plan.js';
import * as ProgramNS from './program.js';
import * as FoodsNS from './foods.js';

const BUILD = '2026-09-11g';

import {
  DAY_SHORT, MONTHS, dateKey, parseKey, today, addDays, startOfWeek, diffDays, humanDate,
  dayLabel, isScheduled, targetOf, perWeekOf, scheduleLabel, streakInfo,
  completionRate, dayProgress, esc, modeOf, formatDuration, formatClock, targetLabel, uid,
  derivedValue, derivedLabel, derivedDone, MONTHS as MONTH_NAMES, shortDate,
} from './util.js';

import { PROGRAM_GROUP, buildHabits, buildLists, eskiAdUyuyor } from './program.js';

import {
  buildPlan, fiberRamp, CINSIYET, HAREKET, HEDEF, HIZ, KACIN,
} from './plan.js';

import {
  lookupBarcode, searchFoods, kcalFor, startScanner, kameraVar, testConnection,
} from './foods.js';

import {
  resolveConfig, isUsableConfig, storeConfig, clearStoredConfig, parseConfigText,
  getPrefs, setPrefs, getMode, setMode, initFirebase, authErrorMessage, setAuthPersistence,
  CloudStore, LocalStore, WINDOW_DAYS,
} from './data.js';

/* ------------------------------------------------------------------ durum */

const state = {
  fb: null,
  user: null,
  store: null,
  habits: [],
  entries: new Map(),
  tasks: new Map(),
  openTasks: new Set(),
  lists: [],
  profile: null,
  foodlog: new Map(),        // tarih anahtarı -> [{id,name,g,kcal,...}]
  openList: null,
  albums: new Map(),
  buildAt: null,
  photoCache: new Map(),
  view: 'today',
  date: today(),
  prefs: getPrefs(),
  online: navigator.onLine,
  fromCache: false,
  installPrompt: null,
  configSource: null,
};

const COLORS = ['#4f8ef7', '#6c63ff', '#4fcf8e', '#f7b24f', '#f75f5f',
                '#ef6ec3', '#42c8d4', '#9b8cff', '#7ec24f', '#c98a5b'];

const EMOJIS = ['✅', '💪', '📚', '🏃', '💧', '🧘', '🥗', '😴', '🦷', '💊', '🚭', '✍️',
                '🎯', '🧹', '🌱', '🎸', '🧠', '☀️', '🙏', '💰', '📵', '🚶', '🏋️', '🎨',
                '⚖️', '🍳', '🍗', '🐟', '🍰', '📏', '📋', '🛒'];

const VIEW_TITLES = { today: 'Bugün', program: 'Program', habits: 'Alışkanlıklar',
                      lists: 'Listeler', stats: 'İstatistik', settings: 'Ayarlar' };

const LIST_EMOJIS = ['📝', '🛒', '🧺', '📦', '🏠', '🚗', '💼', '🎁', '🧹', '🍽️',
                     '💊', '🔧', '📞', '💡', '✈️', '🎬'];

/* -------------------------------------------------------------- yardımcı */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function showScreen(id) {
  ['screen-loading', 'screen-setup', 'screen-auth', 'screen-app']
    .forEach((s) => $('#' + s).classList.toggle('hidden', s !== id));
}

function toast(msg, ms = 2600) {
  $$('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/**
 * Cihaz türünü kök öğeye yazar: data-device="phone|tablet|desktop".
 * CSS medya sorguları genişliğe bakar; bu ise dokunmatik olup olmadığını da
 * ayırt eder — tablet ile dar pencere açılmış masaüstü aynı şey değildir.
 */
function detectDevice() {
  const root = document.documentElement;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);

  root.dataset.device = !coarse ? 'desktop' : (shortSide < 600 ? 'phone' : 'tablet');
  root.dataset.standalone = String(
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

function applyTheme() {
  const t = state.prefs.theme || 'system';
  const dark = t === 'dark' || (t === 'system' &&
    !window.matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function entryValue(habitId, d = state.date) {
  return state.entries.get(`${dateKey(d)}_${habitId}`)?.value || 0;
}

/** Bir alışkanlığın tüm günlük değerleri: Map<tarih, değer>. Sonuç önbelleğe alınır. */
function valuesOf(habitId) {
  if (!_index) {
    _index = new Map();
    for (const e of state.entries.values()) {
      let m = _index.get(e.habitId);
      if (!m) { m = new Map(); _index.set(e.habitId, m); }
      m.set(e.date, e.value);
    }
  }
  return _index.get(habitId) || EMPTY_VALUES;
}

const EMPTY_VALUES = new Map();

const activeHabits = () => state.habits.filter((h) => !h.archived);

const isProgramHabit = (h) => (h.group || '').trim() === PROGRAM_GROUP;

/*  Program alışkanlıkları Bugün ekranından ve günlük yüzdeden ayrı tutulur:
    öğün ve su takibi kendi sekmesinde yaşar, kişinin kendi kurduğu
    alışkanlıkların oranını on bir kalemle boğmasın. Alışkanlıklar sekmesi ve
    tek tek istatistikler ikisini de gösterir — orada amaç yönetim, ölçüm değil. */
const personalHabits = () => activeHabits().filter((h) => !isProgramHabit(h));
const programHabits = () => activeHabits().filter(isProgramHabit);

/** Kullanımdaki bölüm adları — editördeki öneri listesi için. */
function groupNames() {
  const seen = [];
  for (const h of state.habits) {
    const g = (h.group || '').trim();
    if (g && !seen.includes(g)) seen.push(g);
  }
  return seen.sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * Alışkanlıkları bölümlere ayırır. Bölümsüzler her zaman başta ve başlıksız
 * durur; bölümler sıralamayı ilk üyelerinin sırasından alır, böylece
 * yukarı/aşağı düğmeleri bölümleri de taşır.
 */
function byGroup(list) {
  const out = [{ name: '', items: [] }];
  for (const h of list) {
    const g = (h.group || '').trim();
    if (!g) { out[0].items.push(h); continue; }
    let bucket = out.find((x) => x.name === g);
    if (!bucket) { bucket = { name: g, items: [] }; out.push(bucket); }
    bucket.items.push(h);
  }
  return out.filter((x) => x.items.length);
}

/* ------------------------------------------------- yapılacaklar listesi -- */

/**
 * Belirli bir günün listesi.
 *
 * Günlük listelerde her gün kendi kaydına sahiptir. Sabit listelerde ise o gün
 * için henüz kayıt yoksa alışkanlığın şablonu boş (işaretsiz) olarak gösterilir;
 * ilk dokunuşta o güne kopyalanır. Böylece maddeler her gün gelir ama işaretler
 * güne özel kalır ve geçmiş günler bozulmaz.
 */
function tasksFor(habitId, d = state.date) {
  const stored = state.tasks.get(`${dateKey(d)}_${habitId}`)?.items;
  if (stored) return stored;

  const h = state.habits.find((x) => x.id === habitId);
  if (h?.hasTasks && h.taskMode === 'fixed' && Array.isArray(h.taskTemplate)) {
    return h.taskTemplate.map((t) => ({ id: t.id, text: t.text, done: false }));
  }
  return [];
}

/** Sabit listelerde madde metinleri alışkanlıkta saklanır. */
function templateOf(items) {
  return items.map(({ id, text }) => ({ id, text }));
}

/** Geriye doğru, listesi dolu olan en yakın günü bulur (kopyalama teklifi için). */
function previousTaskDay(habitId, d = state.date) {
  for (let i = 1; i <= 30; i++) {
    const day = addDays(d, -i);
    const items = state.tasks.get(`${dateKey(day)}_${habitId}`)?.items;
    if (items && items.length) return { day, items };
  }
  return null;
}

async function writeTasks(habitId, items) {
  const dk = dateKey(state.date);
  const k = `${dk}_${habitId}`;
  if (items.length) state.tasks.set(k, { habitId, date: dk, items });
  else state.tasks.delete(k);

  const habit = state.habits.find((h) => h.id === habitId);

  /*  Sabit listede maddeler alışkanlığa aittir: metin eklendiğinde,
      düzenlendiğinde veya silindiğinde şablon da güncellenir ki ertesi gün
      aynı liste gelsin. İşaretler şablona yazılmaz, güne özeldir. */
  if (habit?.taskMode === 'fixed') {
    const tpl = templateOf(items);
    if (JSON.stringify(tpl) !== JSON.stringify(habit.taskTemplate || [])) {
      const next = { ...habit, taskTemplate: tpl };
      state.habits = state.habits.map((h) => (h.id === habitId ? next : h));
      state.store.saveHabit(next).catch(() => toast('Sabit liste kaydedilemedi'));
    }
  }

  // Liste alışkanlığı besliyorsa günün değeri buradan yeniden doğar.
  const derived = habit?.hasTasks && habit?.driveFromTasks
    ? derivedValue(habit, items)
    : null;

  if (derived !== null) {
    if (derived) state.entries.set(k, { habitId, date: dk, value: derived });
    else state.entries.delete(k);
    invalidateIndex();
  }

  render();

  try {
    await state.store.setTasks(dk, habitId, items);
    if (derived !== null) await state.store.setEntry(dk, habitId, derived);
  } catch (err) {
    toast('Kaydedilemedi: ' + (err?.message || err));
  }
}

/** Listeye bağlı bir alışkanlığın bugünkü değerini listeden tazeler. */
async function syncDerived(habit) {
  if (!habit?.hasTasks || !habit?.driveFromTasks) return;
  const v = derivedValue(habit, tasksFor(habit.id));
  if (v !== null) await setValue(habit.id, v);
}

/* ------------------------------------------------------------ fotoğraf -- */

/** Albüm kimliği: alışkanlıkta güne, listede listeye bağlıdır. */
function albumIdOf(meta) {
  return meta.ownerType === 'habit'
    ? `h_${meta.ownerId}_${meta.date}`
    : `l_${meta.ownerId}`;
}

function albumItems(meta) {
  return state.albums.get(albumIdOf(meta))?.items || [];
}

/** Dosya seçtirir; telefonda kamera ve galeri seçeneklerini tarayıcı sunar. */
function pickPhotos(onPick) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.hidden = true;
  document.body.appendChild(input);
  input.addEventListener('change', () => {
    const files = [...(input.files || [])];
    input.remove();
    if (files.length) onPick(files);
  }, { once: true });
  input.click();
}

/*  Önizlemeler sahibinin belgesinde durur ve Firestore'un belge sınırı 1 MiB'dir.
    Tanesi ~2-8 KB olduğundan 60 fotoğraf rahat sığar; ötesinde yazma sessizce
    başarısız olmasın diye burada durduruyoruz. */
const ALBUM_MAX = 60;

async function addPhotos(meta, files) {
  const albumId = albumIdOf(meta);
  const existing = state.albums.get(albumId)?.items.length || 0;

  if (existing + files.length > ALBUM_MAX) {
    toast(`Bir yere en çok ${ALBUM_MAX} fotoğraf eklenebilir (şu an ${existing} var).`, 5000);
    return;
  }

  if (files.length > 1) toast(`${files.length} fotoğraf işleniyor…`);

  for (const file of files) {
    try {
      const { full, thumb, w, h, bytes } = await processImage(file);
      const id = uid('p');
      const createdAt = new Date().toISOString();

      await state.store.savePhoto(id, full);

      const prev = state.albums.get(albumId);
      const next = { ...meta, items: [...(prev?.items || []), { id, createdAt, thumb, w, h, bytes }] };
      state.albums.set(albumId, next);
      state.photoCache.set(id, full);
      render();

      await state.store.saveAlbum(albumId, next);
    } catch (err) {
      toast('Eklenemedi: ' + (err?.message || err), 6000);
      return;
    }
  }
  toast('Fotoğraf eklendi 📷');
}

async function removePhoto(meta, photoId) {
  const albumId = albumIdOf(meta);
  const prev = state.albums.get(albumId);
  if (!prev) return;

  const items = prev.items.filter((p) => p.id !== photoId);
  if (items.length) state.albums.set(albumId, { ...prev, items });
  else state.albums.delete(albumId);
  state.photoCache.delete(photoId);
  render();

  try {
    await state.store.saveAlbum(albumId, { ...prev, items });
    await state.store.deletePhoto(photoId);
  } catch (err) {
    toast('Silinemedi: ' + (err?.message || err));
  }
}

/** Tam boyutlu görsel yalnızca burada indirilir; önce küçük hâli gösterilir. */
function photoViewer(meta, photoId) {
  const item = albumItems(meta).find((p) => p.id === photoId);
  if (!item) return;

  const cached = state.photoCache.get(photoId);

  openModal(`
    <div class="modal-head">
      <h3 class="truncate">${esc(stampLabel(item.createdAt))}</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>
    <div class="photo-view">
      <img id="pv-img" class="${cached ? '' : 'loading'}" src="${esc(cached || item.thumb)}" alt="" />
    </div>
    <p class="tiny muted center" style="margin-top:10px" id="pv-note">
      ${cached ? '' : 'Tam boyut yükleniyor…'}
    </p>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Kapat</button>
      <button class="btn btn-danger" data-x="del">Fotoğrafı sil</button>
    </div>`, (m) => {
    m.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]')?.dataset.x !== 'del') return;
      closeModal();
      const ok = await confirmDialog('Fotoğraf silinsin mi?',
        'Bu fotoğraf kalıcı olarak silinecek.');
      if (ok) removePhoto(meta, photoId);
    });

    if (cached) return;
    state.store.getPhoto(photoId)
      .then((data) => {
        const img = $('#pv-img', m);
        if (!img || !data) throw new Error('bulunamadı');
        state.photoCache.set(photoId, data);
        img.src = data;
        img.classList.remove('loading');
        $('#pv-note', m).textContent = '';
      })
      .catch(() => {
        const note = $('#pv-note', m);
        if (note) note.textContent = 'Tam boyutlu görsel açılamadı (çevrimdışı olabilirsiniz).';
      });
  });
}

function photoStripHtml(meta, { compact = false } = {}) {
  const items = albumItems(meta);
  const attrs = `data-otype="${esc(meta.ownerType)}" data-oid="${esc(meta.ownerId)}" `
              + `data-odate="${esc(meta.date || '')}"`;

  return `
  <div class="photo-strip ${compact ? 'compact' : ''}">
    ${items.map((p) => `
      <button class="photo-thumb" data-act="photo-open" data-pid="${esc(p.id)}" ${attrs}
              aria-label="fotoğrafı aç">
        <img src="${esc(p.thumb)}" alt="" />
        <span class="pt-stamp">${esc(stampLabel(p.createdAt))}</span>
      </button>`).join('')}
    <button class="photo-add" data-act="photo-add" ${attrs} aria-label="fotoğraf ekle">
      <span class="pa-ico">📷</span>
      <span class="pa-txt">${items.length ? 'Ekle' : 'Fotoğraf'}</span>
    </button>
  </div>`;
}

/* ---------------------------------------------------------------- modal */

/*  Kip kapanırken çalışacak temizlik. Kamera gibi bırakılması gereken
    kaynaklar için: kullanıcı ✕'e de bassa, arka plana da dokunsa, Esc'e de
    bassa tek çıkış noktası burası. */
let modalCleanup = null;

function openModal(html, bind, cleanup) {
  closeModal();
  modalCleanup = cleanup || null;
  // Açık bir bildirim kipin üstüne binip alanları kapatabiliyor.
  $$('.toast').forEach((t) => t.remove());
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) closeModal(); });
  $('#modal-root').appendChild(wrap);
  document.body.style.overflow = 'hidden';
  bind?.($('.modal', wrap), wrap);
  return wrap;
}

function closeModal() {
  const temizle = modalCleanup;
  modalCleanup = null;
  if (temizle) { try { temizle(); } catch (err) { console.error(err); } }
  $('#modal-root').innerHTML = '';
  document.body.style.overflow = '';
}

function confirmDialog(title, body, okLabel = 'Evet, sil', danger = true) {
  return new Promise((resolve) => {
    openModal(`
      <div class="modal-head"><h3>${esc(title)}</h3></div>
      <p class="small muted">${body}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-x="no">Vazgeç</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-x="yes">${esc(okLabel)}</button>
      </div>`, (m) => {
      m.addEventListener('click', (e) => {
        const b = e.target.closest('[data-x]');
        if (!b) return;
        closeModal();
        resolve(b.dataset.x === 'yes');
      });
    });
  });
}

/* ==========================================================================
   Kurulum ekranı (Firebase yapılandırması yokken)
   ========================================================================== */

function renderSetup(errorMsg) {
  showScreen('screen-setup');
  $('#screen-setup').innerHTML = `
    <div class="card-panel wide">
      <div class="brand">
        <img src="./icons/icon-192.png" alt="" />
        <h1>Kurulum</h1>
        <p>Cihazlar arası senkron için ücretsiz bir Firebase projesi bağlayın.
           Kredi kartı istemez, ücretli plana geçmeden çalışır.</p>
      </div>

      ${errorMsg ? `<div class="error-box" style="margin-bottom:16px">${esc(errorMsg)}</div>` : ''}

      <ol class="steps">
        <li><div class="st-body"><b>console.firebase.google.com</b> adresine Google hesabınızla girin,
            <b>Create a project</b> ile yeni proje açın (ör. <code>aliskanliklarim</code>).</div></li>
        <li><div class="st-body">Sol menüden <b>Build → Authentication → Get started</b>,
            <b>Email/Password</b> yöntemini seçip <b>Enable</b> deyin.</div></li>
        <li><div class="st-body"><b>Build → Firestore Database → Create database</b>,
            konum seçip <b>production mode</b> ile oluşturun.</div></li>
        <li><div class="st-body"><b>Rules</b> sekmesine <code>firestore.rules</code> dosyasındaki kuralları
            yapıştırıp <b>Publish</b> deyin.</div></li>
        <li><div class="st-body">Proje ayarları (⚙️) → <b>Your apps → Web (&lt;/&gt;)</b> ile bir web uygulaması
            ekleyin ve çıkan <code>firebaseConfig</code> bloğunu kopyalayın.</div></li>
      </ol>

      <div class="field mt">
        <label for="cfg">Kopyaladığınız yapılandırmayı buraya yapıştırın</label>
        <textarea id="cfg" class="input mono" rows="8" spellcheck="false"
          placeholder='const firebaseConfig = {&#10;  apiKey: "AIza…",&#10;  authDomain: "proje.firebaseapp.com",&#10;  projectId: "proje",&#10;  appId: "1:…"&#10;};'></textarea>
      </div>
      <div id="cfg-err" class="error-box hidden" style="margin-top:10px"></div>

      <button class="btn btn-primary btn-block mt" data-x="save-config">Kaydet ve bağlan</button>

      <div class="info-box mt">
        Bu adımı bir kez yapıp değerleri depodaki <code>config.js</code> dosyasına yazarsanız
        diğer cihazlarınızda tekrar sormaz.
      </div>

      <div class="center mt">
        <button class="btn btn-ghost btn-sm" data-x="local">Şimdilik sadece bu cihazda kullan</button>
        <p class="tiny muted" style="margin-top:8px">Yerel modda veriler senkronlanmaz, yalnızca bu tarayıcıda kalır.</p>
      </div>
    </div>`;

  $('#screen-setup').onclick = async (e) => {
    const b = e.target.closest('[data-x]');
    if (!b) return;

    if (b.dataset.x === 'local') {
      setMode('local');
      await startLocal();
      return;
    }
    if (b.dataset.x !== 'save-config') return;

    const err = $('#cfg-err');
    const parsed = parseConfigText($('#cfg').value);
    if (!isUsableConfig(parsed)) {
      err.textContent = 'Yapılandırma okunamadı. En azından apiKey ve projectId değerlerini içeren ' +
                        'bloğun tamamını yapıştırdığınızdan emin olun.';
      err.classList.remove('hidden');
      return;
    }
    err.classList.add('hidden');
    storeConfig(parsed);
    setMode('cloud');
    location.reload();
  };
}

/* ==========================================================================
   Çevrimdışı açılış ekranı
   ========================================================================== */

function renderOffline() {
  showScreen('screen-setup');
  $('#screen-setup').innerHTML = `
    <div class="card-panel center">
      <div class="brand">
        <img src="./icons/icon-192.png" alt="" />
        <h1>Çevrimdışısınız</h1>
        <p>Uygulama açıldı ama hesabınıza bağlanmak için internet gerekiyor.
           Bağlantı gelince kendiliğinden devam edecek.</p>
      </div>
      <button class="btn btn-primary btn-block" data-x="retry">Yeniden dene</button>
      <p class="tiny muted" style="margin-top:14px">
        Daha önce giriş yaptıysanız bağlantı gelir gelmez alışkanlıklarınız yerine gelir.
      </p>
    </div>`;

  $('#screen-setup').onclick = (e) => {
    if (e.target.closest('[data-x]')?.dataset.x === 'retry') location.reload();
  };
  window.addEventListener('online', () => location.reload(), { once: true });
}

/* ==========================================================================
   Giriş / kayıt ekranı
   ========================================================================== */

let authTab = 'login';

function renderAuth(msg) {
  showScreen('screen-auth');
  const isLogin = authTab === 'login';

  $('#screen-auth').innerHTML = `
    <div class="card-panel">
      <div class="brand">
        <img src="./icons/icon-192.png" alt="" />
        <h1>Alışkanlıklarım</h1>
        <p>Hesabınızla girin; alışkanlıklarınız tüm cihazlarınızda aynı olsun.</p>
      </div>

      <div class="tabs" role="tablist">
        <button role="tab" data-tab="login"    aria-selected="${isLogin}">Giriş yap</button>
        <button role="tab" data-tab="register" aria-selected="${!isLogin}">Hesap oluştur</button>
      </div>

      <form id="auth-form" class="stack" novalidate>
        ${isLogin ? '' : `
        <div class="field">
          <label for="au-name">Adınız <span class="muted">(isteğe bağlı)</span></label>
          <input id="au-name" class="input" type="text" autocomplete="name" placeholder="Metecan" />
        </div>`}
        <div class="field">
          <label for="au-mail">E-posta</label>
          <input id="au-mail" class="input" type="email" required autocomplete="email"
                 inputmode="email" autocapitalize="none" spellcheck="false"
                 value="${esc(state.prefs.lastEmail || '')}" placeholder="ornek@eposta.com" />
        </div>
        <div class="field">
          <label for="au-pass">Şifre</label>
          <input id="au-pass" class="input" type="password" required minlength="6"
                 autocomplete="${isLogin ? 'current-password' : 'new-password'}"
                 placeholder="En az 6 karakter" />
        </div>

        <label class="check-row" for="au-remember">
          <input id="au-remember" type="checkbox" ${state.prefs.remember === false ? '' : 'checked'} />
          <span>
            <b>Beni hatırla</b>
            <em>Bir daha e-posta ve şifre sormayalım; bu cihazda açık kalsın.</em>
          </span>
        </label>

        <div id="auth-err" class="error-box hidden"></div>
        ${msg ? `<div class="info-box">${esc(msg)}</div>` : ''}

        <button class="btn btn-primary btn-block" type="submit" id="auth-submit">
          ${isLogin ? 'Giriş yap' : 'Hesabı oluştur'}
        </button>
      </form>

      <div class="center mt">
        ${isLogin
          ? '<button class="btn btn-ghost btn-sm" data-x="reset">Şifremi unuttum</button>'
          : `<p class="tiny muted">Kurulum gerektirmez — e-posta ve şifre yeter. Alışkanlıklarınız yalnızca
             sizin hesabınızda görünür; aynı bilgilerle diğer cihazlarınızdan da girebilirsiniz.</p>`}
      </div>

      <div class="center row" style="margin-top:18px;border-top:1px solid var(--border);
                  padding-top:14px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" data-act="diagnose">Kurulum kontrolü</button>
        ${state.configSource === 'file' ? '' :
          '<button class="btn btn-ghost btn-sm" data-x="setup">Bulut ayarlarını değiştir</button>'}
      </div>
    </div>`;

  const errBox = $('#auth-err');
  const fail = (m) => { errBox.textContent = m; errBox.classList.remove('hidden'); };

  $('#screen-auth').onclick = async (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { authTab = tab.dataset.tab; renderAuth(); return; }

    const x = e.target.closest('[data-x]')?.dataset.x;
    if (x === 'setup') {
      renderSetup();
      return;
    }
    if (x === 'reset') {
      const mail = $('#au-mail').value.trim();
      if (!mail) return fail('Önce e-posta adresinizi yazın, sonra bu düğmeye basın.');
      try {
        await state.fb.sdk.auth.sendPasswordResetEmail(state.fb.auth, mail);
        toast('Şifre sıfırlama bağlantısı e-postanıza gönderildi.');
        errBox.classList.add('hidden');
      } catch (err) { fail(authErrorMessage(err)); }
    }
  };

  $('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const A = state.fb.sdk.auth;
    const auth = state.fb.auth;
    const mail = $('#au-mail').value.trim();
    const pass = $('#au-pass').value;
    const name = $('#au-name')?.value.trim();
    const remember = $('#au-remember')?.checked !== false;
    const btn = $('#auth-submit');

    if (!mail) return fail('E-posta adresi gerekli.');
    if (pass.length < 6) return fail('Şifre en az 6 karakter olmalı.');

    btn.disabled = true;
    btn.textContent = 'Lütfen bekleyin…';
    errBox.classList.add('hidden');

    // Tercihi giriş denemesinden ÖNCE uygula, yoksa bu oturuma yansımaz.
    state.prefs = { ...state.prefs, remember, lastEmail: remember ? mail : '' };
    setPrefs(state.prefs);
    await setAuthPersistence(state.fb, remember);

    try {
      if (authTab === 'login') {
        await A.signInWithEmailAndPassword(auth, mail, pass);
      } else {
        const cred = await A.createUserWithEmailAndPassword(auth, mail, pass);
        if (name) await A.updateProfile(cred.user, { displayName: name }).catch(() => {});
      }
      // Devamı onAuthStateChanged ile gelir.
    } catch (err) {
      btn.disabled = false;
      btn.textContent = authTab === 'login' ? 'Giriş yap' : 'Hesabı oluştur';
      fail(authErrorMessage(err));
    }
  };
}

/* ==========================================================================
   Depo bağlantısı
   ========================================================================== */

function attachStore(store) {
  state.store?.stop();
  state.store = store;
  state.habits = [];
  state.entries = new Map();
  state.tasks = new Map();
  state.lists = [];
  state.profile = null;
  state.foodlog = new Map();
  state.openList = null;
  state.albums = new Map();
  state.view = 'today';          // yeni oturum her zaman Bugün ile başlar
  state.date = today();
  invalidateIndex();

  store.start({
    habits: (list) => { state.habits = list; render(); },
    entries: (map)  => { state.entries = map; invalidateIndex(); render(); },
    tasks:   (map)  => { state.tasks = map; render(); },
    lists:   (rows) => { state.lists = rows; render(); },
    albums:  (map)  => { state.albums = map; render(); },
    profile: (p)    => { state.profile = p || readMirror(); if (p) mirrorProfile(p); render(); },
    foodlog: (map)  => { state.foodlog = map; render(); },
    status:  (s)    => { state.fromCache = !!s.fromCache; updateSyncBadge(); },
    error:   (err)  => {
      console.error(err);
      if (String(err?.code) === 'permission-denied') {
        toast('Firestore kuralları verilerinize izin vermiyor. firestore.rules dosyasını yükleyin.', 6000);
      } else {
        toast('Veriler alınamadı: ' + (err?.message || err), 5000);
      }
    },
  });

  showScreen('screen-app');
  render();
  updateSyncBadge();
}

async function startLocal() {
  state.user = null;
  attachStore(new LocalStore());
}

function updateSyncBadge() {
  const dot = $('#sync-dot');
  const txt = $('#sync-text');
  if (!dot) return;

  if (state.store?.mode === 'local') {
    dot.className = 'sync-dot local';
    txt.textContent = 'yerel';
    dot.title = 'Yerel mod — veriler yalnızca bu cihazda';
  } else if (!state.online) {
    dot.className = 'sync-dot offline';
    txt.textContent = 'çevrimdışı';
    dot.title = 'Çevrimdışı — değişiklikler bağlantı gelince gönderilecek';
  } else {
    dot.className = 'sync-dot';
    txt.textContent = '';
    dot.title = 'Senkron';
  }
}

/* ==========================================================================
   Ortak parçalar
   ========================================================================== */

let _index = null;
const invalidateIndex = () => { _index = null; };

function ringHtml(pct, size = 58, stroke = 6, color = 'var(--success)') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<div class="ring" style="width:${size}px;height:${size}px;flex-basis:${size}px">
    <svg width="${size}" height="${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
              stroke="var(--surface3)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
              stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
              stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg>
    <div class="ring-label">${Math.round(pct)}%</div>
  </div>`;
}

function habitCardHtml(h, d) {
  const val = entryValue(h.id, d);
  const target = targetOf(h);
  const mode = modeOf(h);
  const done = val >= target;
  const color = h.color || COLORS[0];
  const st = streakInfo(h, valuesOf(h.id));

  const meta = [];
  if (st.current > 0) meta.push(`<span class="flame">🔥 ${st.current} ${st.unit}</span>`);
  meta.push(esc(scheduleLabel(h)));

  const items = h.hasTasks ? tasksFor(h.id, d) : [];
  const open = state.openTasks.has(h.id);
  const doneCount = items.filter((i) => i.done).length;
  const driven = !!(h.hasTasks && h.driveFromTasks && items.length);

  const shown = driven ? (derivedValue(h, items) ?? 0) : val;
  const barDone = driven ? derivedDone(h, items) : done;
  const bar = mode === 'check' ? '' : `
      <div class="progress-line">
        <i style="width:${Math.min(100, (shown / target) * 100)}%;background:${barDone ? 'var(--success)' : color}"></i>
      </div>`;

  let control;
  if (driven) {
    // Değer listeden gelir; elle giriş yerine denetim listeyi açar.
    const dDone = derivedDone(h, items);
    control = `
      <button class="time-btn ${dDone ? 'on' : ''}" data-act="task-panel" data-id="${esc(h.id)}"
              aria-label="listeyi aç">
        <span class="tb-val">${esc(derivedLabel(h, items))}</span>
        ${mode === 'time'
          ? `<span class="tb-tgt">${formatClock(target)}</span>`
          : '<span class="tb-sub">listeden</span>'}
      </button>`;
  } else if (mode === 'time') {
    control = `
      <button class="time-btn ${done ? 'on' : ''}" data-act="time-edit" data-id="${esc(h.id)}"
              aria-label="süre gir — ${formatDuration(val)} / ${formatDuration(target)}">
        <span class="tb-val">${val ? formatClock(val) : '+'}</span>
        <span class="tb-tgt">${formatClock(target)}</span>
      </button>`;
  } else if (mode === 'count') {
    control = `
      <div class="counter">
        <button data-act="dec" data-id="${esc(h.id)}" aria-label="azalt">−</button>
        <span class="cval ${done ? 'full' : ''}">${val} / ${target}</span>
        <button data-act="inc" data-id="${esc(h.id)}" aria-label="artır">+</button>
      </div>`;
  } else {
    control = `
      <button class="check-btn ${done ? 'on' : ''}" data-act="toggle" data-id="${esc(h.id)}"
              aria-label="${done ? 'geri al' : 'tamamlandı işaretle'}">✓</button>`;
  }

  const photoMeta = { ownerType: 'habit', ownerId: h.id, date: dateKey(d) };
  const photoCount = albumItems(photoMeta).length;

  const badge = [
    h.hasTasks ? `☑ ${doneCount}/${items.length}` : '',
    photoCount ? `📷 ${photoCount}` : '',
  ].filter(Boolean).join(' · ') || '📷 +';

  const taskToggle = `
      <button class="task-toggle ${open ? 'on' : ''}" data-act="task-panel" data-id="${esc(h.id)}"
              aria-expanded="${open}">
        ${badge}<span class="tt-caret">${open ? '▴' : '▾'}</span>
      </button>`;

  return `
  <div class="habit-block">
    <div class="habit-card ${(driven ? derivedDone(h, items) : done) ? 'done' : ''} ${open ? 'has-panel' : ''}"
         data-habit="${esc(h.id)}">
      <div class="h-emoji" style="background:${color}22;color:${color}">${esc(h.emoji || '✅')}</div>
      <div class="grow">
        <div class="h-name truncate">${esc(h.name)}</div>
        <div class="h-meta">${meta.join('<span class="muted">·</span>')}${taskToggle}</div>
        ${bar}
      </div>
      ${control}
    </div>
    ${open ? habitPanelHtml(h, items, d) : ''}
  </div>`;
}

function habitPanelHtml(h, items, d) {
  const meta = { ownerType: 'habit', ownerId: h.id, date: dateKey(d) };
  return `
  <div class="task-panel">
    ${photoStripHtml(meta)}
    ${h.hasTasks ? taskPanelHtml(h, items, d) : ''}
  </div>`;
}

function taskPanelHtml(h, items, d) {
  const prev = items.length === 0 ? previousTaskDay(h.id, d) : null;
  const timeDriven = h.driveFromTasks && modeOf(h) === 'time';
  const total = items.reduce((sum, it) => sum + (Number(it.minutes) || 0), 0);

  return `
  <div class="task-section">
    ${items.length ? `<div class="task-list">${items.map((it) => `
      <div class="task-item ${it.done ? 'done' : ''}">
        <button class="task-check ${it.done ? 'on' : ''}" data-act="task-check"
                data-id="${esc(h.id)}" data-tid="${esc(it.id)}"
                aria-label="${it.done ? 'geri al' : 'tamamlandı'}">✓</button>
        <input class="task-text" value="${esc(it.text)}" maxlength="140"
               data-change="task-text" data-id="${esc(h.id)}" data-tid="${esc(it.id)}"
               aria-label="madde metni" />
        ${timeDriven ? `
          <button class="task-min ${it.minutes ? 'has' : ''}" data-act="task-time"
                  data-id="${esc(h.id)}" data-tid="${esc(it.id)}"
                  aria-label="süre gir">${it.minutes ? formatDuration(it.minutes) : '+ süre'}</button>` : ''}
        <button class="icon-btn task-del" data-act="task-del"
                data-id="${esc(h.id)}" data-tid="${esc(it.id)}" aria-label="sil">✕</button>
      </div>`).join('')}</div>` : ''}

    <form class="task-add" data-hid="${esc(h.id)}">
      <input class="input" placeholder="Yeni madde…" maxlength="140" aria-label="yeni madde" />
      <button class="btn btn-sm btn-primary" type="submit">Ekle</button>
    </form>

    ${prev ? `
      <button class="btn btn-sm btn-ghost btn-block" style="margin-top:8px"
              data-act="task-copy" data-id="${esc(h.id)}">
        ${esc(dayLabel(prev.day))} listesini kopyala (${prev.items.length} madde)
      </button>` : ''}

    ${items.length && timeDriven ? `<p class="tiny center" style="margin-top:10px">
      <b>Toplam ${esc(formatDuration(total))}</b>
      <span class="muted">/ hedef ${esc(formatDuration(targetOf(h)))}</span></p>` : ''}

    ${items.length ? `<p class="tiny muted center" style="margin-top:8px">
      ${h.taskMode === 'fixed'
        ? 'Sabit liste — maddeler her gün gelir, işaretler yalnızca ' + esc(dayLabel(d).toLowerCase()) + ' için.'
        : 'Bu liste yalnızca ' + esc(dayLabel(d).toLowerCase()) + ' için. Diğer günler olduğu gibi kalır.'}</p>` : ''}
  </div>`;
}

/* ---------------------------------------------------- süre giriş kipi --- */

/**
 * Süre girme penceresi. Hem bir alışkanlığın günlük toplamı hem de listedeki
 * tek bir madde için kullanılır.
 * target verilmezse ilerleme çubuğu ve "kaldı" notu gösterilmez.
 */
function durationDialog({ title, subtitle, minutes: initial, target = 0, color, onSave }) {
  let minutes = Number(initial) || 0;
  const bar = target > 0;

  openModal(`
    <div class="modal-head">
      <h3 class="truncate">${esc(title)}</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>
    ${subtitle ? `<p class="small muted center" style="margin-bottom:14px">${esc(subtitle)}</p>` : ''}

    <div class="time-display">
      <div class="td-big" id="td-big">${formatDuration(minutes)}</div>
      ${bar ? `
        <div class="progress-line" style="margin-top:10px">
          <i id="td-bar" style="width:${Math.min(100, (minutes / target) * 100)}%;
             background:${color || COLORS[0]}"></i>
        </div>
        <div class="tiny muted" id="td-note" style="margin-top:8px">&nbsp;</div>` : ''}
    </div>

    <div class="chips" style="justify-content:center;margin:16px 0 6px">
      <button type="button" class="chip" data-add="15">+15dk</button>
      <button type="button" class="chip" data-add="30">+30dk</button>
      <button type="button" class="chip" data-add="60">+1sa</button>
      <button type="button" class="chip" data-add="-15">−15dk</button>
    </div>

    <div class="row" style="gap:8px;align-items:flex-end">
      <div class="field grow">
        <label for="td-h">Saat</label>
        <input id="td-h" class="input" type="number" min="0" max="23" step="1"
               inputmode="numeric" value="${Math.floor(minutes / 60)}" />
      </div>
      <div class="field grow">
        <label for="td-m">Dakika</label>
        <input id="td-m" class="input" type="number" min="0" max="59" step="5"
               inputmode="numeric" value="${minutes % 60}" />
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" data-x="clear">Temizle</button>
      <button class="btn btn-primary" data-x="save">Kaydet</button>
    </div>`, (m) => {

    const hIn = $('#td-h', m), mIn = $('#td-m', m);
    const read = () => (Number(hIn.value) || 0) * 60 + (Number(mIn.value) || 0);

    const paint = () => {
      minutes = Math.max(0, Math.min(24 * 60, read()));
      $('#td-big', m).textContent = formatDuration(minutes);
      if (!bar) return;
      $('#td-bar', m).style.width = Math.min(100, (minutes / target) * 100) + '%';
      const left = target - minutes;
      $('#td-note', m).textContent = minutes === 0 ? '\u00a0'
        : left > 0 ? `${formatDuration(left)} kaldı`
        : left === 0 ? 'Hedef tamamlandı 🎉'
        : `Hedefi ${formatDuration(-left)} aştınız 💪`;
    };

    const write = (total) => {
      const t = Math.max(0, Math.min(24 * 60, total));
      hIn.value = Math.floor(t / 60);
      mIn.value = t % 60;
      paint();
    };

    hIn.addEventListener('input', paint);
    mIn.addEventListener('input', paint);
    paint();

    m.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) { write(read() + Number(add.dataset.add)); return; }

      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'clear') { closeModal(); onSave(0); return; }
      if (x === 'save')  { closeModal(); onSave(Math.max(0, Math.min(24 * 60, read()))); }
    });
  });
}

/** Alışkanlığın günlük süresini elle girme. */
function timeDialog(habit) {
  durationDialog({
    title: `${habit.emoji || '⏱'} ${habit.name}`,
    subtitle: `${dayLabel(state.date)} · hedef ${formatDuration(targetOf(habit))}`,
    minutes: entryValue(habit.id, state.date),
    target: targetOf(habit),
    color: habit.color || COLORS[0],
    onSave: (mins) => setValue(habit.id, mins),
  });
}

/** Listedeki tek bir maddeye harcanan süre. */
function taskTimeDialog(habit, item) {
  durationDialog({
    title: item.text,
    subtitle: 'Bu maddeye ne kadar süre ayırdınız?',
    minutes: Number(item.minutes) || 0,
    onSave: (mins) => {
      const items = tasksFor(habit.id).map((it) =>
        it.id === item.id ? { ...it, minutes: mins } : it);
      writeTasks(habit.id, items);
    },
  });
}

/* ==========================================================================
   Görünüm: Bugün
   ========================================================================== */

function viewToday() {
  const d = state.date;
  const list = personalHabits();
  const prog = dayProgress(list, state.entries, d);
  const isToday = diffDays(d, today()) === 0;
  const future = diffDays(d, today()) > 0;

  const scheduled = list.filter((h) => isScheduled(h, d));
  const other = list.filter((h) => !isScheduled(h, d));

  if (list.length === 0) {
    const programVar = programHabits().length > 0;
    return `
      <div class="empty">
        <div class="big">🌱</div>
        <h3>Henüz alışkanlık yok</h3>
        <p class="small">Küçük başlayın: günde bir alışkanlık bile fark yaratır.</p>
        <button class="btn btn-primary mt" data-act="new-habit">İlk alışkanlığını ekle</button>
        ${programVar ? `<p class="small" style="margin-top:14px">Diyet ve spor
          takibin <b>Program</b> sekmesinde.</p>` : ''}
      </div>`;
  }

  return `
    <div class="day-head">
      ${ringHtml(prog.pct)}
      <div class="grow">
        <div class="dh-title">${esc(dayLabel(d))}</div>
        <div class="dh-sub truncate">${d.getDate()} ${MONTHS[d.getMonth()]} · ${prog.done}/${prog.total} tamamlandı</div>
      </div>
      <button class="icon-btn" data-act="prev-day" aria-label="önceki gün">‹</button>
      ${isToday ? '' : '<button class="btn btn-sm btn-ghost" data-act="go-today">Bugün</button>'}
      <button class="icon-btn" data-act="next-day" aria-label="sonraki gün">›</button>
    </div>

    ${weekStripHtml(d)}

    ${future ? '<div class="info-box" style="margin-bottom:12px">Bu gün henüz gelmedi — ileri tarihe işaret koyabilirsiniz ama seriler bugüne göre hesaplanır.</div>' : ''}

    ${scheduled.length
      ? byGroup(scheduled).map((sec) => `
          ${sec.name ? `<div class="section-title">${esc(sec.name)}</div>` : ''}
          <div class="habit-list">${sec.items.map((h) => habitCardHtml(h, d)).join('')}</div>`).join('')
      : '<div class="empty"><div class="big">🎉</div><h3>Bugün planlı alışkanlık yok</h3><p class="small">Dinlenme günü.</p></div>'}

    ${other.length ? `
      <div class="section-title">Bugün planlı değil</div>
      <div class="habit-list" style="opacity:.72">${other.map((h) => habitCardHtml(h, d)).join('')}</div>` : ''}

    <button class="btn btn-ghost btn-block mt push-bottom" data-act="new-habit">+ Yeni alışkanlık</button>`;
}

function weekStripHtml(d) {
  const start = startOfWeek(d, 1);
  const t = today();
  const cells = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const p = dayProgress(personalHabits(), state.entries, day);
    const sel = dateKey(day) === dateKey(d);
    cells.push(`
      <button data-act="pick-day" data-date="${dateKey(day)}" aria-selected="${sel}"
              class="${dateKey(day) === dateKey(t) ? 'is-today' : ''}">
        <span class="ws-day">${DAY_SHORT[day.getDay()].toUpperCase()}</span>
        <span class="ws-num">${day.getDate()}</span>
        <span class="ws-bar"><i style="width:${p.pct}%"></i></span>
      </button>`);
  }
  return `<div class="week-strip">${cells.join('')}</div>`;
}

/* ==========================================================================
   Görünüm: Alışkanlıklar
   ========================================================================== */

function viewHabits() {
  const list = activeHabits();
  const archived = state.habits.filter((h) => h.archived);

  const rowHtml = (h, i, total, arch) => {
    const color = h.color || COLORS[0];
    const st = streakInfo(h, valuesOf(h.id));
    return `
    <div class="list-row">
      <div class="h-emoji" style="background:${color}22;color:${color}">${esc(h.emoji || '✅')}</div>
      <div class="grow" style="cursor:pointer" data-act="edit-habit" data-id="${esc(h.id)}">
        <div class="h-name truncate">${esc(h.name)}</div>
        <div class="h-meta">
          ${esc(scheduleLabel(h))}
          ${targetLabel(h) ? `<span class="muted">·</span>${esc(targetLabel(h))}` : ''}
          ${st.best > 0 ? `<span class="muted">·</span>rekor ${st.best} ${st.unit}` : ''}
        </div>
      </div>
      ${arch ? `
        <button class="btn btn-sm btn-ghost" data-act="unarchive" data-id="${esc(h.id)}">Geri al</button>
        <button class="icon-btn" data-act="del-habit" data-id="${esc(h.id)}" aria-label="sil">🗑</button>`
      : `
        <button class="icon-btn" data-act="move-up" data-id="${esc(h.id)}" ${i === 0 ? 'disabled style="opacity:.25"' : ''} aria-label="yukarı">↑</button>
        <button class="icon-btn" data-act="move-down" data-id="${esc(h.id)}" ${i === total - 1 ? 'disabled style="opacity:.25"' : ''} aria-label="aşağı">↓</button>
        <button class="icon-btn" data-act="edit-habit" data-id="${esc(h.id)}" aria-label="düzenle">✏️</button>`}
    </div>`;
  };

  /*  Ekleme düğmesi Bugün'deki gibi en altta: hem iki ekran aynı deseni
      izliyor hem de kısa listede içerik alt menüye kadar iniyor, ortada
      yüzlerce piksel ölü alan kalmıyor. */
  return `
    ${list.length
      ? byGroup(list).map((sec) => `
          <div class="section-title">${sec.name ? esc(sec.name) : 'Aktif'} (${sec.items.length})</div>
          <div class="panel">${sec.items
            .map((h) => rowHtml(h, list.indexOf(h), list.length, false)).join('')}</div>`).join('')
      : `<div class="empty"><div class="big">📋</div><h3>Liste boş</h3>
         <p class="small">Yukarıdaki düğmeyle ilk alışkanlığınızı ekleyin.</p></div>`}

    ${archived.length ? `
      <div class="section-title">Arşiv (${archived.length})</div>
      <div class="panel" style="opacity:.75">${archived.map((h) => rowHtml(h, 0, 1, true)).join('')}</div>` : ''}

    <button class="btn btn-primary btn-block mt push-bottom"
            data-act="new-habit">+ Yeni alışkanlık</button>`;
}

/* ==========================================================================
   Görünüm: Listeler — alışkanlıklardan bağımsız, tarihe bağlı değil
   ========================================================================== */

async function writeListItems(listId, items) {
  const list = state.lists.find((l) => l.id === listId);
  if (!list) return;
  const next = { ...list, items };
  state.lists = state.lists.map((l) => (l.id === listId ? next : l));
  render();
  try {
    await state.store.saveList(next);
  } catch (err) {
    toast('Kaydedilemedi: ' + (err?.message || err));
  }
}

function listEditor(list) {
  const isNew = !list;
  const l = list || { name: '', emoji: '📝', items: [] };

  openModal(`
    <div class="modal-head">
      <h3>${isNew ? 'Yeni liste' : 'Listeyi düzenle'}</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>
    <div class="stack">
      <div class="field">
        <label for="ls-name">Liste adı</label>
        <input id="ls-name" class="input" type="text" maxlength="50" value="${esc(l.name)}"
               placeholder="Örn. Market, Bugün yapılacaklar" />
      </div>
      <div class="field">
        <label>Simge</label>
        <div class="emoji-grid" id="ls-emoji">
          ${LIST_EMOJIS.map((e) => `<button type="button" data-e="${e}"
             aria-pressed="${e === (l.emoji || '📝')}">${e}</button>`).join('')}
        </div>
      </div>
      <div id="ls-err" class="error-box hidden"></div>
    </div>
    ${l.createdAt ? `<p class="tiny muted center" style="margin-top:12px">
      Oluşturuldu: ${esc(stampLabel(l.createdAt))}</p>` : ''}
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Vazgeç</button>
      <button class="btn btn-primary" data-x="save">${isNew ? 'Oluştur' : 'Kaydet'}</button>
    </div>`, (m) => {
    $('#ls-emoji', m).addEventListener('click', (e) => {
      const b = e.target.closest('[data-e]');
      if (!b) return;
      $$('[data-e]', $('#ls-emoji', m)).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    setTimeout(() => $('#ls-name', m)?.focus(), 60);

    m.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]')?.dataset.x !== 'save') return;
      const name = $('#ls-name', m).value.trim();
      if (!name) {
        const err = $('#ls-err', m);
        err.textContent = 'Listeye bir ad verin.';
        err.classList.remove('hidden');
        return;
      }
      const payload = {
        ...(list || {}),
        name,
        emoji: $('#ls-emoji [aria-pressed="true"]', m)?.dataset.e || '📝',
        items: l.items || [],
      };
      if (isNew) payload.order = state.lists.length;
      try {
        const id = await state.store.saveList(payload);
        closeModal();
        if (isNew) { state.openList = payload.id || id; render(); }
        toast(isNew ? 'Liste oluşturuldu' : 'Kaydedildi');
      } catch (err) {
        const box = $('#ls-err', m);
        box.textContent = 'Kaydedilemedi: ' + (err?.message || err);
        box.classList.remove('hidden');
      }
    });
  });
}

/** Son tarih etiketi: "Bugün" / "Yarın" / "3 gün geçti" / "15 Eylül" */
function dueLabel(due, todayD = today()) {
  const d = parseKey(due);
  if (isNaN(d)) return '';
  const n = diffDays(d, todayD);
  if (n === 0) return 'Bugün';
  if (n === 1) return 'Yarın';
  if (n === -1) return 'Dün';
  if (n < 0) return `${-n} gün geçti`;
  if (n < 7) return `${n} gün sonra`;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function dueClass(due, todayD = today()) {
  const n = diffDays(parseKey(due), todayD);
  return n < 0 ? 'overdue' : n === 0 ? 'today' : '';
}

/** Bir liste maddesine son tarih verme penceresi. */
function dueDialog(listId, item) {
  const t = today();
  const quick = [
    ['Bugün', dateKey(t)],
    ['Yarın', dateKey(addDays(t, 1))],
    ['Hafta sonu', dateKey(addDays(startOfWeek(t, 1), 5))],
    ['Gelecek hafta', dateKey(addDays(startOfWeek(t, 1), 7))],
  ];

  openModal(`
    <div class="modal-head">
      <h3 class="truncate">${esc(item.text)}</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>
    ${item.createdAt ? `<p class="tiny muted center" style="margin-bottom:14px">
      Eklendi: ${esc(stampLabel(item.createdAt))}</p>` : ''}

    <div class="chips" style="justify-content:center;margin-bottom:14px">
      ${quick.map(([label, v]) => `<button type="button" class="chip" data-q="${v}">${label}</button>`).join('')}
    </div>

    <div class="field">
      <label for="dd-date">Son tarih</label>
      <input id="dd-date" class="input" type="date" value="${esc(item.due || '')}" />
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" data-x="clear">Tarihi kaldır</button>
      <button class="btn btn-primary" data-x="save">Kaydet</button>
    </div>`, (m) => {
    const apply = (due) => {
      const l = state.lists.find((x) => x.id === listId);
      if (!l) return;
      closeModal();
      writeListItems(listId, (l.items || []).map((it) =>
        it.id === item.id ? { ...it, due: due || null } : it));
    };

    m.addEventListener('click', (e) => {
      const q = e.target.closest('[data-q]');
      if (q) { apply(q.dataset.q); return; }
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'clear') apply('');
      if (x === 'save') apply($('#dd-date', m).value);
    });
  });
}

function viewLists() {
  const open = state.openList ? state.lists.find((l) => l.id === state.openList) : null;
  return open ? listDetailHtml(open) : listIndexHtml();
}

function listIndexHtml() {
  if (state.lists.length === 0) {
    return `
      <div class="empty">
        <div class="big">📝</div>
        <h3>Henüz liste yok</h3>
        <p class="small">Market alışverişi ya da bugün halletmen gereken işler için
           bir liste aç. Bunlar alışkanlıklardan bağımsızdır, günlere bağlı değildir.</p>
        <button class="btn btn-primary mt" data-act="new-list">İlk listeyi oluştur</button>
      </div>`;
  }

  return `
    <button class="btn btn-primary btn-block push-bottom" data-act="new-list">+ Yeni liste</button>
    <div class="section-title">Listelerim (${state.lists.length})</div>
    <div class="habit-list">
      ${state.lists.map((l) => {
        const items = l.items || [];
        const done = items.filter((i) => i.done).length;
        const all = items.length > 0 && done === items.length;
        return `
        <button class="habit-card list-card ${all ? 'done' : ''}" data-act="open-list" data-id="${esc(l.id)}">
          <div class="h-emoji" style="background:var(--surface3)">${esc(l.emoji || '📝')}</div>
          <div class="grow" style="text-align:left;min-width:0">
            <div class="h-name truncate">${esc(l.name)}</div>
            <div class="h-meta">
              ${items.length ? `${done}/${items.length} tamamlandı` : 'boş liste'}
              ${l.createdAt ? `<span class="muted">·</span>
                <span class="list-date" title="Oluşturulma tarihi">${esc(shortDate(l.createdAt))}</span>` : ''}
            </div>
            ${items.length ? `<div class="progress-line">
              <i style="width:${(done / items.length) * 100}%;background:var(--accent)"></i></div>` : ''}
          </div>
          <span class="list-caret">›</span>
        </button>`;
      }).join('')}
    </div>`;
}

function listDetailHtml(l) {
  const items = l.items || [];
  const done = items.filter((i) => i.done).length;

  return `
    <div class="list-head">
      <button class="icon-btn" data-act="close-list" aria-label="geri">‹</button>
      <div class="h-emoji" style="background:var(--surface3)">${esc(l.emoji || '📝')}</div>
      <div class="grow" style="min-width:0">
        <div class="h-name truncate">${esc(l.name)}</div>
        <div class="h-meta">
          ${items.length ? `${done}/${items.length} tamamlandı` : 'boş liste'}
          ${l.createdAt ? `<span class="muted">·</span>
            <span class="list-date" title="Oluşturulma tarihi">${esc(shortDate(l.createdAt))}</span>` : ''}
        </div>
      </div>
      <button class="icon-btn" data-act="edit-list" data-id="${esc(l.id)}" aria-label="düzenle">✏️</button>
      <button class="icon-btn" data-act="del-list" data-id="${esc(l.id)}" aria-label="sil">🗑</button>
    </div>

    ${photoStripHtml({ ownerType: 'list', ownerId: l.id })}

    <form class="task-add list-add" data-lid="${esc(l.id)}" style="margin-bottom:14px">
      <input class="input" id="list-add-input" placeholder="Yeni madde…" maxlength="140"
             autocomplete="off" aria-label="yeni madde" />
      <button class="btn btn-primary" type="submit">Ekle</button>
    </form>

    ${items.length ? `
      <div class="panel">
        <div class="task-list" style="margin-bottom:0">
          ${items.map((it) => `
            <div class="task-item ${it.done ? 'done' : ''}">
              <button class="task-check ${it.done ? 'on' : ''}" data-act="li-check"
                      data-id="${esc(l.id)}" data-tid="${esc(it.id)}"
                      aria-label="${it.done ? 'geri al' : 'tamamlandı'}">✓</button>
              <input class="task-text" value="${esc(it.text)}" maxlength="140"
                     data-change="li-text" data-id="${esc(l.id)}" data-tid="${esc(it.id)}"
                     aria-label="madde metni" />
              <button class="li-due ${it.due ? 'has ' + dueClass(it.due) : ''}" data-act="li-date"
                      data-id="${esc(l.id)}" data-tid="${esc(it.id)}"
                      aria-label="son tarih">${it.due ? esc(dueLabel(it.due)) : '📅'}</button>
              <button class="icon-btn task-del" data-act="li-del"
                      data-id="${esc(l.id)}" data-tid="${esc(it.id)}" aria-label="sil">✕</button>
            </div>`).join('')}
        </div>
      </div>
      ${done ? `<button class="btn btn-ghost btn-block mt" data-act="li-clear" data-id="${esc(l.id)}">
        Tamamlanan ${done} maddeyi temizle</button>` : ''}`
    : `<div class="empty" style="padding:32px 16px">
         <div class="big">🧾</div>
         <h3>Liste boş</h3>
         <p class="small">Yukarıdaki kutuya yazıp Ekle deyin.</p>
       </div>`}`;
}

/* ==========================================================================
   Görünüm: İstatistik
   ========================================================================== */

const HEAT_WEEKS = 13;

function heatHtml(getLevel, color) {
  const end = startOfWeek(today(), 1);
  const start = addDays(end, -7 * (HEAT_WEEKS - 1));
  const t = today();
  const cells = [];

  for (let w = 0; w < HEAT_WEEKS; w++) {
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, w * 7 + i);
      if (d > t) { cells.push('<i class="off"></i>'); continue; }
      const lvl = getLevel(d);                       // 0 … 1
      const style = lvl > 0
        ? `background:${color};opacity:${(0.22 + lvl * 0.78).toFixed(2)}`
        : '';
      cells.push(`<i style="${style}" title="${humanDate(d)}"></i>`);
    }
  }
  return `<div class="heat-wrap"><div class="heat" style="min-width:${HEAT_WEEKS * 16}px">${cells.join('')}</div></div>`;
}

function viewStats() {
  const list = activeHabits();
  if (list.length === 0) {
    return `<div class="empty"><div class="big">📊</div><h3>Gösterecek veri yok</h3>
      <p class="small">Alışkanlık ekleyip birkaç gün işaretledikten sonra buraya dönün.</p>
      <button class="btn btn-primary mt" data-act="new-habit">Alışkanlık ekle</button></div>`;
  }

  const t = today();

  /*  Oranlar yalnızca kişinin kendi alışkanlıklarından hesaplanır; program
      kalemleri kendi sekmesinde sayılır. Aşağıdaki tek tek paneller ise
      hepsini gösterir — seri ve ısı haritası öğünler için de anlamlı. */
  const oranList = personalHabits();
  const todayP = dayProgress(oranList, state.entries, t);

  // Bu haftanın ortalaması (bugüne kadar)
  const wStart = startOfWeek(t, 1);
  let wSum = 0, wDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(wStart, i);
    if (d > t) break;
    const p = dayProgress(oranList, state.entries, d);
    if (p.total > 0) { wSum += p.pct; wDays += 1; }
  }
  const weekPct = wDays ? Math.round(wSum / wDays) : 0;

  let bestStreak = 0, bestUnit = 'gün', totalDone = 0;
  for (const h of list) {
    const st = streakInfo(h, valuesOf(h.id));
    if (st.best > bestStreak) { bestStreak = st.best; bestUnit = st.unit; }
  }
  for (const e of state.entries.values()) {
    const h = state.habits.find((x) => x.id === e.habitId);
    if (h && e.value >= targetOf(h)) totalDone += 1;
  }

  const overallHeat = heatHtml((d) => {
    const p = dayProgress(oranList, state.entries, d);
    return p.total === 0 ? 0 : p.done / p.total;
  }, 'var(--accent)');

  const habitPanels = list.map((h) => {
    const vals = valuesOf(h.id);
    const st = streakInfo(h, vals);
    const r30 = completionRate(h, vals, 30);
    const color = h.color || COLORS[0];
    const target = targetOf(h);
    const isTime = modeOf(h) === 'time';

    // Süre alışkanlıklarında toplam, oran kadar anlamlı: "30 günde kaç saat?"
    let total30 = 0;
    if (isTime) {
      for (let i = 0; i < 30; i++) total30 += vals.get(dateKey(addDays(t, -i))) || 0;
    }
    return `
      <div class="panel" style="margin-top:10px">
        <div class="row" style="margin-bottom:12px">
          <div class="h-emoji" style="background:${color}22;color:${color}">${esc(h.emoji || '✅')}</div>
          <div class="grow">
            <div class="h-name truncate">${esc(h.name)}</div>
            <div class="h-meta">${esc(scheduleLabel(h))}</div>
          </div>
          ${ringHtml(r30, 46, 5, color)}
        </div>
        <div class="stat-grid" style="margin-bottom:12px">
          <div class="stat-box"><div class="sv" style="color:${color}">${st.current}</div><div class="sl">seri (${st.unit})</div></div>
          <div class="stat-box"><div class="sv">${st.best}</div><div class="sl">rekor (${st.unit})</div></div>
          <div class="stat-box"><div class="sv">${r30}%</div><div class="sl">son 30 gün</div></div>
          ${isTime ? `<div class="stat-box">
            <div class="sv">${(total30 / 60).toFixed(1).replace('.', ',')}</div>
            <div class="sl">saat · 30 gün</div></div>` : ''}
        </div>
        ${heatHtml((d) => {
          if (!isScheduled(h, d)) return 0;
          const v = vals.get(dateKey(d)) || 0;
          return Math.min(1, v / target);
        }, color)}
      </div>`;
  }).join('');

  return `
    <div class="stat-grid">
      <div class="stat-box"><div class="sv" style="color:var(--success)">${todayP.pct}%</div><div class="sl">bugün</div></div>
      <div class="stat-box"><div class="sv">${weekPct}%</div><div class="sl">bu hafta</div></div>
      <div class="stat-box"><div class="sv">${list.length}</div><div class="sl">alışkanlık</div></div>
      <div class="stat-box"><div class="sv" style="color:var(--warn)">${bestStreak}</div><div class="sl">rekor (${bestUnit})</div></div>
    </div>

    <div class="section-title">Son ${HEAT_WEEKS} hafta (genel)</div>
    <div class="panel">
      ${overallHeat}
      <div class="row-between" style="margin-top:10px">
        <span class="tiny muted">Toplam ${totalDone} tamamlama</span>
        <span class="heat-legend">az
          <i style="background:var(--accent);opacity:.3"></i>
          <i style="background:var(--accent);opacity:.55"></i>
          <i style="background:var(--accent);opacity:.8"></i>
          <i style="background:var(--accent)"></i>çok</span>
      </div>
    </div>

    <div class="section-title">Alışkanlık bazında</div>
    ${habitPanels}`;
}

/* ==========================================================================
   Görünüm: Ayarlar
   ========================================================================== */

function viewSettings() {
  const local = state.store?.mode === 'local';
  const themes = [['system', 'Sistem'], ['dark', 'Koyu'], ['light', 'Açık']];
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;

  return `
    <div class="section-title">Hesap</div>
    <div class="panel">
      ${local ? `
        <div class="list-row">
          <div class="h-emoji" style="background:var(--surface3)">📱</div>
          <div class="grow"><div class="h-name">Yerel mod</div>
            <div class="h-meta">Veriler yalnızca bu cihazda. Diğer cihazlarla senkron yok.</div></div>
        </div>
        <div class="list-row">
          <div class="grow small muted">Cihazlar arası senkron için ücretsiz Firebase bağlayın.</div>
          <button class="btn btn-sm btn-primary" data-act="to-cloud">Buluta geç</button>
        </div>`
      : `
        <div class="list-row">
          <div class="h-emoji" style="background:rgba(79,142,247,.16);color:var(--accent)">👤</div>
          <div class="grow" style="min-width:0">
            <div class="h-name truncate">${esc(state.user?.displayName || state.user?.email || '')}</div>
            <div class="h-meta truncate">${esc(state.user?.email || '')}</div>
          </div>
        </div>
        <div class="list-row">
          <div class="grow small muted">Aynı e-posta ve şifreyle diğer cihazlarınızdan da girebilirsiniz.</div>
        </div>
        <div class="list-row">
          <div class="grow"><div class="h-name">Beni hatırla</div>
            <div class="h-meta">${state.prefs.remember === false
              ? 'Tarayıcı kapanınca çıkış yapılır.'
              : 'Oturum bu cihazda açık kalır, tekrar şifre sorulmaz.'}</div></div>
          <button class="btn btn-sm ${state.prefs.remember === false ? 'btn-ghost' : 'btn-primary'}"
                  data-act="toggle-remember">${state.prefs.remember === false ? 'Kapalı' : 'Açık'}</button>
        </div>
        <div class="list-row">
          <button class="btn btn-sm btn-ghost" data-act="pass-reset">Şifreyi değiştir</button>
          <span class="grow"></span>
          <button class="btn btn-sm btn-danger" data-act="logout">Çıkış yap</button>
        </div>`}
    </div>

    <div class="section-title">Görünüm</div>
    <div class="panel">
      <div class="row-between">
        <span class="small">Tema</span>
        <div class="chips">
          ${themes.map(([v, l]) => `<button class="chip" data-act="theme" data-v="${v}"
             aria-pressed="${(state.prefs.theme || 'system') === v}">${l}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="section-title">Uygulama</div>
    <div class="panel">
      <div class="list-row">
        <div class="grow"><div class="h-name">Yüklü sürüm</div>
          <div class="h-meta" id="build-stamp">${state.buildAt ? esc(stampLabel(state.buildAt)) : 'okunuyor…'}</div></div>
        <button class="btn btn-sm btn-primary" data-act="check-update">Güncelle</button>
      </div>
      <div class="list-row">
        <div class="grow small muted">Yeni bir özellik görünmüyorsa bu düğme önbelleği
          temizleyip uygulamayı yeniden yükler.</div>
      </div>
    </div>

    <div class="section-title">Ana ekrana ekle</div>
    <div class="panel">
      ${installed ? '<div class="small muted">✅ Uygulama olarak kurulu.</div>' : (
        iOS ? `<div class="small muted">
                 <b>iPhone / iPad:</b> Safari'de bu sayfayı açın → alttaki <b>Paylaş</b> düğmesi
                 → <b>Ana Ekrana Ekle</b>.
               </div>`
            : `<div class="row-between wrap">
                 <span class="small muted">Ana ekrana / masaüstüne ekleyin, tam ekran çalışsın.</span>
                 <button class="btn btn-sm btn-primary" data-act="install"
                   ${state.installPrompt ? '' : 'disabled'}>Kur</button>
               </div>
               ${state.installPrompt ? '' : `<div class="tiny muted" style="margin-top:8px">
                 Tarayıcı menüsünden de kurabilirsiniz: Chrome/Edge → ⋮ → "Uygulamayı yükle".</div>`}`
      )}
    </div>

    <div class="section-title">Veriler</div>
    <div class="panel">
      <div class="list-row">
        <div class="grow"><div class="h-name">Yedek al</div>
          <div class="h-meta">Tüm alışkanlıklar ve kayıtlar JSON dosyası olarak.</div></div>
        <button class="btn btn-sm btn-ghost" data-act="export">İndir</button>
      </div>
      <div class="list-row">
        <div class="grow"><div class="h-name">Yedekten geri yükle</div>
          <div class="h-meta">Mevcut verilerin üzerine ekler.</div></div>
        <button class="btn btn-sm btn-ghost" data-act="import">Yükle</button>
      </div>
      <div class="list-row">
        <div class="grow"><div class="h-name" style="color:var(--danger)">Tüm verileri sil</div>
          <div class="h-meta">Bu hesabın bütün alışkanlık ve kayıtları silinir.</div></div>
        <button class="btn btn-sm btn-danger" data-act="wipe">Sil</button>
      </div>
    </div>

    ${local ? '' : `
    <div class="section-title">Bulut bağlantısı</div>
    <div class="panel">
      <div class="list-row">
        <div class="grow"><div class="h-name">Firebase projesi</div>
          <div class="h-meta truncate">${esc(state.fb?.app?.options?.projectId || '—')}
            · SDK ${esc(state.fb?.sdk?.version || '')}</div></div>
        ${state.configSource === 'file' ? ''
          : '<button class="btn btn-sm btn-ghost" data-act="reset-config">Değiştir</button>'}
      </div>
      <div class="list-row">
        <div class="grow"><div class="h-name">Kurulum kontrolü</div>
          <div class="h-meta">Giriş, kurallar ve gizlilik ayarlarını test eder.</div></div>
        <button class="btn btn-sm btn-ghost" data-act="diagnose">Çalıştır</button>
      </div>
      <div class="list-row">
        <div class="grow small muted">Son ${WINDOW_DAYS} günün kayıtları yüklenir; eski kayıtlar bulutta korunur.</div>
      </div>
    </div>`}

    <p class="tiny muted center" style="margin-top:24px">
      Alışkanlıklarım · tamamen ücretsiz · verileriniz size ait
    </p>`;
}

/* ==========================================================================
   Alışkanlık ekleme / düzenleme
   ========================================================================== */

function openHabitEditor(habit) {
  const isNew = !habit;
  const h = habit || {
    name: '', emoji: '✅', color: COLORS[0], target: 1,
    schedule: { kind: 'daily', days: [1, 2, 3, 4, 5], perWeek: 3 },
    note: '',
  };
  const kind = h.schedule?.kind || 'daily';
  const days = Array.isArray(h.schedule?.days) ? h.schedule.days : [1, 2, 3, 4, 5];
  const hMode = modeOf(h);
  const timeTarget = hMode === 'time' ? targetOf(h) : 180;   // varsayılan 3 saat

  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  openModal(`
    <div class="modal-head">
      <h3>${isNew ? 'Yeni alışkanlık' : 'Alışkanlığı düzenle'}</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>

    <div class="stack">
      <div class="field">
        <label for="hb-name">Ne yapmak istiyorsunuz?</label>
        <input id="hb-name" class="input" type="text" maxlength="60" value="${esc(h.name)}"
               placeholder="Örn. 30 dakika kitap oku" />
      </div>

      <div class="field">
        <label>Simge</label>
        <div class="emoji-grid" id="hb-emoji">
          ${EMOJIS.map((e) => `<button type="button" data-e="${e}"
             aria-pressed="${e === (h.emoji || '✅')}">${e}</button>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>Renk</label>
        <div class="swatches" id="hb-color">
          ${COLORS.map((c) => `<button type="button" class="swatch" data-c="${c}"
             style="background:${c}" aria-pressed="${c === (h.color || COLORS[0])}"></button>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>Takip şekli</label>
        <div class="chips" id="hb-type">
          <button type="button" class="chip" data-t="check" aria-pressed="${hMode === 'check'}">Yaptım / yapmadım</button>
          <button type="button" class="chip" data-t="count" aria-pressed="${hMode === 'count'}">Sayaç</button>
          <button type="button" class="chip" data-t="time"  aria-pressed="${hMode === 'time'}">Süre</button>
        </div>
        <p class="tiny muted" style="margin-top:6px">
          <b>Sayaç:</b> günde 8 bardak su gibi adet sayarsınız.
          <b>Süre:</b> günde 3 saat ders gibi süre girersiniz.
        </p>
      </div>

      <div class="field ${hMode === 'count' ? '' : 'hidden'}" id="hb-target-wrap">
        <label for="hb-target">Günlük hedef (kaç kez?)</label>
        <input id="hb-target" class="input" type="number" min="2" max="99" inputmode="numeric"
               value="${hMode === 'count' ? targetOf(h) : 8}" />
      </div>

      <div class="field ${hMode === 'time' ? '' : 'hidden'}" id="hb-time-wrap">
        <label>Günlük hedef süre</label>
        <div class="row" style="gap:8px">
          <input id="hb-th" class="input grow" type="number" min="0" max="23" step="1"
                 inputmode="numeric" aria-label="saat" value="${Math.floor(timeTarget / 60)}" />
          <span class="small muted">saat</span>
          <input id="hb-tm" class="input grow" type="number" min="0" max="59" step="5"
                 inputmode="numeric" aria-label="dakika" value="${timeTarget % 60}" />
          <span class="small muted">dakika</span>
        </div>
      </div>

      <div class="field">
        <label>Ne sıklıkta?</label>
        <div class="chips" id="hb-kind">
          <button type="button" class="chip" data-k="daily"   aria-pressed="${kind === 'daily'}">Her gün</button>
          <button type="button" class="chip" data-k="days"    aria-pressed="${kind === 'days'}">Belirli günler</button>
          <button type="button" class="chip" data-k="perWeek" aria-pressed="${kind === 'perWeek'}">Haftada N kez</button>
        </div>
      </div>

      <div class="field ${kind === 'days' ? '' : 'hidden'}" id="hb-days-wrap">
        <label>Hangi günler?</label>
        <div class="chips" id="hb-days">
          ${dayOrder.map((n) => `<button type="button" class="chip" data-d="${n}"
             aria-pressed="${days.includes(n)}">${DAY_SHORT[n]}</button>`).join('')}
        </div>
      </div>

      <div class="field ${kind === 'perWeek' ? '' : 'hidden'}" id="hb-week-wrap">
        <label for="hb-perweek">Haftada kaç kez?</label>
        <input id="hb-perweek" class="input" type="number" min="1" max="7" inputmode="numeric"
               value="${perWeekOf(h)}" />
      </div>

      <div class="field">
        <label for="hb-group">Bölüm <span class="muted">(isteğe bağlı)</span></label>
        <input id="hb-group" class="input" type="text" maxlength="40" list="hb-groups"
               placeholder="örn. Spor ve Diyet" value="${esc(h.group || '')}" />
        <datalist id="hb-groups">
          ${groupNames().map((g) => `<option value="${esc(g)}"></option>`).join('')}
        </datalist>
        <div class="tiny muted" style="margin-top:6px">Aynı bölüm adını verdiğiniz
          alışkanlıklar Bugün ve Alışkanlıklar ekranlarında birlikte görünür.</div>
      </div>

      <div class="field">
        <label for="hb-note">Not <span class="muted">(isteğe bağlı)</span></label>
        <textarea id="hb-note" class="input" maxlength="200"
                  placeholder="Kendinize küçük bir hatırlatma">${esc(h.note || '')}</textarea>
      </div>

      <label class="check-row" for="hb-tasks">
        <input id="hb-tasks" type="checkbox" ${h.hasTasks ? 'checked' : ''} />
        <span>
          <b>Yapılacaklar listesi</b>
          <em>Kartın altında her gün için ayrı bir liste açılır. Geçmiş günlerin
              listeleri olduğu gibi kalır, sıfırlanmaz.</em>
        </span>
      </label>

      <div class="field ${h.hasTasks ? '' : 'hidden'}" id="hb-tasktype-row" style="margin-top:2px">
        <label>Liste türü</label>
        <div class="chips" id="hb-tasktype">
          <button type="button" class="chip" data-tm="daily"
                  aria-pressed="${(h.taskMode || 'daily') !== 'fixed'}">Her gün yeni liste</button>
          <button type="button" class="chip" data-tm="fixed"
                  aria-pressed="${h.taskMode === 'fixed'}">Sabit liste</button>
        </div>
        <p class="tiny muted" style="margin-top:6px">
          <b>Her gün yeni:</b> gün boş başlar; istersen dünkünü tek dokunuşla kopyalarsın.<br />
          <b>Sabit:</b> aynı maddeler her gün gelir. İşaretler yine güne özeldir —
          bugün işaretlemen dünü değiştirmez.
        </p>
      </div>

      <label class="check-row ${h.hasTasks ? '' : 'hidden'}" id="hb-drive-row" for="hb-drive">
        <input id="hb-drive" type="checkbox" ${h.driveFromTasks ? 'checked' : ''} />
        <span>
          <b>İlerlemeyi liste belirlesin</b>
          <em>
            <b>Sayaç:</b> işaretledikçe sayaç ilerler, hepsi bitince alışkanlık tamamlanır.<br />
            <b>Süre:</b> her maddenin yanına çalıştığınız süreyi girersiniz, toplam alışkanlığa işlenir.<br />
            <b>Yaptım/yapmadım:</b> bütün maddeler bitince tamamlanmış sayılır.
          </em>
        </span>
      </label>

      <div id="hb-err" class="error-box hidden"></div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Vazgeç</button>
      <button class="btn btn-primary" data-x="save">${isNew ? 'Ekle' : 'Kaydet'}</button>
    </div>

    ${isNew ? '' : `
      <div class="row" style="margin-top:14px;gap:10px">
        <button class="btn btn-ghost btn-sm grow" data-x="archive">
          ${h.archived ? 'Arşivden çıkar' : 'Arşivle'}</button>
        <button class="btn btn-danger btn-sm grow" data-x="delete">Kalıcı olarak sil</button>
      </div>
      <p class="tiny muted center" style="margin-top:8px">
        Arşivlenen alışkanlık listeden kalkar, geçmişi durur.</p>`}
  `, (m) => {
    const pressGroup = (sel, attr, multi = false) => {
      $(sel, m).addEventListener('click', (e) => {
        const b = e.target.closest(`[data-${attr}]`);
        if (!b) return;
        if (multi) {
          b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true');
        } else {
          $$(`[data-${attr}]`, $(sel, m)).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        }
        if (attr === 't') {
          $('#hb-target-wrap', m).classList.toggle('hidden', b.dataset.t !== 'count');
          $('#hb-time-wrap', m).classList.toggle('hidden', b.dataset.t !== 'time');
        }
        if (attr === 'k') {
          $('#hb-days-wrap', m).classList.toggle('hidden', b.dataset.k !== 'days');
          $('#hb-week-wrap', m).classList.toggle('hidden', b.dataset.k !== 'perWeek');
        }
      });
    };
    pressGroup('#hb-emoji', 'e');
    pressGroup('#hb-color', 'c');
    pressGroup('#hb-type', 't');
    pressGroup('#hb-kind', 'k');
    pressGroup('#hb-days', 'd', true);
    pressGroup('#hb-tasktype', 'tm');

    $('#hb-tasks', m).addEventListener('change', (e) => {
      $('#hb-drive-row', m).classList.toggle('hidden', !e.target.checked);
      $('#hb-tasktype-row', m).classList.toggle('hidden', !e.target.checked);
    });

    setTimeout(() => { if (isNew) $('#hb-name', m)?.focus(); }, 60);

    m.addEventListener('click', async (e) => {
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (!x) return;

      if (x === 'delete') {
        const ok = await confirmDialog('Alışkanlık silinsin mi?',
          `<b>${esc(h.name)}</b> ve tüm geçmiş kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz.`);
        if (!ok) return;
        await state.store.deleteHabit(h.id);
        closeModal();
        toast('Alışkanlık silindi');
        return;
      }

      if (x === 'archive') {
        await state.store.saveHabit({ ...h, archived: !h.archived });
        closeModal();
        toast(h.archived ? 'Arşivden çıkarıldı' : 'Arşivlendi');
        return;
      }

      if (x !== 'save') return;

      const name = $('#hb-name', m).value.trim();
      if (!name) {
        const err = $('#hb-err', m);
        err.textContent = 'Alışkanlığa bir isim verin.';
        err.classList.remove('hidden');
        return;
      }

      const sel = (sel2, attr) => $(`${sel2} [aria-pressed="true"]`, m)?.dataset[attr];
      const type = sel('#hb-type', 't') || 'check';
      const kindSel = sel('#hb-kind', 'k') || 'daily';
      const chosenDays = $$('#hb-days [aria-pressed="true"]', m).map((b) => Number(b.dataset.d));

      let target = 1;
      if (type === 'count') {
        target = Math.max(2, Math.min(99, Number($('#hb-target', m).value) || 2));
      } else if (type === 'time') {
        const mins = (Number($('#hb-th', m).value) || 0) * 60 + (Number($('#hb-tm', m).value) || 0);
        target = Math.max(5, Math.min(24 * 60, mins || 180));   // en az 5dk, boşsa 3 saat
      }

      const schedule = { kind: kindSel };
      if (kindSel === 'days') schedule.days = chosenDays.length ? chosenDays : [1, 2, 3, 4, 5];
      if (kindSel === 'perWeek') {
        schedule.perWeek = Math.max(1, Math.min(7, Number($('#hb-perweek', m).value) || 3));
      }

      const payload = {
        ...(habit || {}),
        name,
        emoji: sel('#hb-emoji', 'e') || '✅',
        color: sel('#hb-color', 'c') || COLORS[0],
        mode: type,
        target,
        schedule,
        note: $('#hb-note', m).value.trim(),
        group: $('#hb-group', m).value.trim(),
        hasTasks: $('#hb-tasks', m).checked,
        taskMode: sel('#hb-tasktype', 'tm') || 'daily',
        driveFromTasks: $('#hb-tasks', m).checked && $('#hb-drive', m).checked,
        archived: !!h.archived,
      };
      if (isNew) payload.order = state.habits.length;

      // Sabit listeye geçiliyorsa ve şablon boşsa bugünkü listeyi temel al.
      if (payload.hasTasks && payload.taskMode === 'fixed') {
        const existing = Array.isArray(h.taskTemplate) ? h.taskTemplate : [];
        payload.taskTemplate = existing.length
          ? existing
          : templateOf(h.id ? tasksFor(h.id, state.date) : []);
      }

      try {
        const savedId = await state.store.saveHabit(payload);
        closeModal();
        toast(isNew ? 'Alışkanlık eklendi 🎉' : 'Kaydedildi');
        // Seçenek yeni açıldıysa bugünün değeri listeden hemen doğsun.
        await syncDerived({ ...payload, id: payload.id || savedId });
      } catch (err) {
        const box = $('#hb-err', m);
        box.textContent = 'Kaydedilemedi: ' + (err?.message || err);
        box.classList.remove('hidden');
      }
    });
  });
}

/* ==========================================================================
   Görünüm: Program — kişiye özel diyet ve spor planı
   ========================================================================== */

/* ------------------------------------------------------- kalori sayacı -- */

/**
 * Bir öğünün o gün yenen kalorisi.
 *
 * Liste varsa madde madde sayılır: kullanıcı tabağındaki her kalemi ayrı
 * işaretliyor, sayaç da o hızda düşmeli. Öğünün tamamlanmasını beklemek,
 * yarısını yiyip bırakan birine hiçbir şey yememiş gibi davranırdı.
 *
 * taskKcal ile taskTemplate aynı sırada üretilir; eşleşme madde kimliğinden
 * kurulur, sıra numarasından değil — kullanıcı listeye kendi maddesini
 * eklediğinde kaymasın diye. Kimliği şablonda olmayan madde 0 sayılır.
 */
function mealCalories(h, d, plan) {
  /*  Kalori alanları sonradan eklendi: daha önce kurulmuş alışkanlıklarda
      yoklar. Kullanıcıyı "Yenile"ye basmaya zorlamak yerine değerler plandan
      okunur — öğün anahtarı (ogun0..3) plandaki sırayla birebir eşleşir. */
  const i = /^ogun(\d)$/.exec(h.progKey || '');
  const planOgun = i ? plan?.ogunler?.[Number(i[1])] : null;

  const toplam = Number(h.kcal) || planOgun?.kcal || 0;
  if (!toplam) return 0;

  const per = Array.isArray(h.taskKcal) && h.taskKcal.length
    ? h.taskKcal
    : planOgun?.satirlar?.map((x) => x.kcal) || null;
  const tpl = Array.isArray(h.taskTemplate) ? h.taskTemplate : null;

  if (h.hasTasks && per && tpl && per.length === tpl.length) {
    let sum = 0;
    for (const it of tasksFor(h.id, d)) {
      if (!it.done) continue;
      const i = tpl.findIndex((t) => t.id === it.id);
      if (i >= 0) sum += Number(per[i]) || 0;
    }
    return sum;
  }

  /* Listesiz öğün: ya tamamen yendi ya hiç. */
  return entryValue(h.id, d) >= targetOf(h) ? toplam : 0;
}

/** O gün elle/barkodla eklenen yiyecekler. */
function foodsFor(d = state.date) {
  return state.foodlog.get(dateKey(d)) || [];
}

/** O günün kalori tablosu: hedef, yenen, kalan. Plan yoksa null. */
function dayCalories(d) {
  const plan = currentPlan();
  if (!plan) return null;

  const ogunler = activeHabits().filter((h) => (h.group || '').trim() === PROGRAM_GROUP
    && (Number(h.kcal) > 0 || /^ogun\d$/.test(h.progKey || '')));

  const ekstra = foodsFor(d).reduce((s, f) => s + (Number(f.kcal) || 0), 0);
  if (!ogunler.length && !ekstra) return null;

  const ogun = ogunler.reduce((s, h) => s + mealCalories(h, d, plan), 0);
  const hedef = plan.hedef.kcal;
  const yenen = Math.round(ogun + ekstra);
  return { hedef, yenen, kalan: Math.round(hedef - yenen), ogun: Math.round(ogun), ekstra };
}

/** Günün yiyecek listesini yazar; ekran iyimser güncellenir. */
async function writeFoods(d, items) {
  const dk = dateKey(d);
  if (items.length) state.foodlog.set(dk, items); else state.foodlog.delete(dk);
  render();
  try {
    await state.store.setFoodLog(dk, items);
  } catch (err) {
    toast('Kaydedilemedi: ' + (err?.message || err));
  }
}

/*  Profilin yerel yedeği.
    Buluta yazım başarısız olsa bile plan cihazda kalsın diye tutulur; depo boş
    dönerse buradan okunur. Yeniden yükleme profili silmiş gibi görünmez. */
const PROFIL_YEDEK = 'habits.profile.backup';

function mirrorProfile(p) {
  try { localStorage.setItem(PROFIL_YEDEK, JSON.stringify(p)); } catch {}
}

function readMirror() {
  try { return JSON.parse(localStorage.getItem(PROFIL_YEDEK) || 'null'); } catch { return null; }
}

/** Profilden planı üretir; bozuk profilde çökmek yerine null döner. */
function currentPlan() {
  if (!state.profile?.kilo || !state.profile?.boy) return null;
  try { return buildPlan(state.profile); } catch (err) { console.error(err); return null; }
}

function viewProgram() {
  const plan = currentPlan();

  if (!plan) {
    return `
      <div class="empty">
        <div class="big">🥗</div>
        <h3>Program henüz hazır değil</h3>
        <p class="small">Birkaç soruya cevap ver; kalorini, makrolarını, gramajlı
          öğünlerini ve antrenman bölünmeni hesaplayıp buraya yazayım.</p>
        <button class="btn btn-primary mt" data-act="edit-profile">Bilgilerimi gir</button>
      </div>

      <div class="section-title">Neye göre hesaplanır</div>
      <div class="panel">
        <div class="list-row"><div class="grow small muted">
          Bazal metabolizman Mifflin-St Jeor denklemiyle, günlük yakımın hareket
          düzeyin ve antrenman günlerinle bulunur. Açık, hem haftalık kilo
          yüzdesinden hem de günlük yakımının yüzdesinden hesaplanır; hangisi
          daha güvenliyse o kazanır. Protein ve yağ, gerçek kilonla değil
          boyuna denk gelen sağlıklı ağırlıkla çarpılır.
        </div></div>
      </div>`;
  }

  const t = plan.hedef;
  const kurulu = state.habits.some((h) => (h.group || '').trim() === PROGRAM_GROUP);
  const p = state.profile;
  const hedefAd = (HEDEF.find((x) => x[0] === p.hedef) || [])[1] || '';

  const ogunHtml = (o) => `
    <div class="section-title">${o.emoji} ${esc(o.ad)}
      <span class="muted" style="font-weight:500">· ${o.kcal} kcal · ${o.p} g protein</span></div>
    <div class="panel">
      ${o.satirlar.map((x) => `
        <div class="list-row">
          <div class="pg-gram">${x.g} g</div>
          <div class="grow" style="min-width:0">
            <div class="h-name">${esc(x.ad)}</div>
            ${x.not ? `<div class="h-meta">${esc(x.not)}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>`;

  const d = state.date;
  const kal = dayCalories(d);
  const gunun = programHabits();
  const yiyecekler = foodsFor(d);
  const ekstraKcal = yiyecekler.reduce((sum, f) => sum + (Number(f.kcal) || 0), 0);
  const planli = gunun.filter((h) => isScheduled(h, d));
  const digerleri = gunun.filter((h) => !isScheduled(h, d));

  /*  Başlıktaki büyük rakam program kurulduysa KALAN kaloridir, kurulmadıysa
      günlük hedef. Kullanıcının gün içinde bakıp merak ettiği şey hedef değil,
      "daha ne yiyebilirim" sorusunun cevabı. */
  const asti = kal ? kal.kalan < 0 : false;
  const oran = kal ? Math.min(100, Math.round((kal.yenen / kal.hedef) * 100)) : 0;

  return `
    <div class="panel pg-head">
      ${kal ? `
        <div class="pg-kcal ${asti ? 'over' : ''}">${Math.abs(kal.kalan).toLocaleString('tr-TR')}
          <span>kcal ${asti ? 'aşıldı' : 'kaldı'}</span></div>
        <div class="kcal-bar" style="margin:14px 0 8px">
          <i style="width:${oran}%" class="${asti ? 'over' : ''}"></i>
        </div>
        <div class="pg-tdee">Hedef ${kal.hedef.toLocaleString('tr-TR')} ·
          yenen ${kal.yenen.toLocaleString('tr-TR')} kcal${kal.ekstra
            ? ` (öğün ${kal.ogun.toLocaleString('tr-TR')} + eklenen ${kal.ekstra.toLocaleString('tr-TR')})`
            : ''}</div>`
      : `
        <div class="pg-kcal">${t.kcal.toLocaleString('tr-TR')}<span>kcal / gün</span></div>`}
      <div class="pg-sub">
        ${esc(hedefAd)}${t.haftalikKg > 0
          ? ` · haftada ~${t.haftalikKg.toLocaleString('tr-TR')} kg (ayda ~${t.aylikKg.toLocaleString('tr-TR')} kg)`
          : t.haftalikKg < 0 ? ` · haftada ~${Math.abs(t.haftalikKg)} kg alım` : ''}
      </div>
      <div class="pg-tdee">Günlük yakımın ~${t.tdee.toLocaleString('tr-TR')} kcal
        · açık ${(t.tdee - t.kcal).toLocaleString('tr-TR')} kcal · BKİ ${t.bki}</div>
    </div>

    <!-- Program alışkanlıkları henüz kurulmamış olsa da yiyecek eklenebilmeli:
         plan varsa hedef bellidir, sayaç da eklenenlerle çalışmaya başlar. -->
    <button class="btn btn-primary btn-block" data-act="add-food"
            style="margin-bottom:4px">＋ Yiyecek ekle (barkod / arama)</button>

    ${yiyecekler.length ? `
      <div class="section-title">Gün içinde eklediklerin
        <span class="muted" style="font-weight:500">· ${ekstraKcal.toLocaleString('tr-TR')} kcal</span></div>
      <div class="panel">
        ${yiyecekler.map((f) => `
          <div class="list-row">
            <div class="grow" style="min-width:0">
              <div class="h-name truncate">${esc(f.name)}</div>
              <div class="h-meta">${f.g} g · ${f.per100 ? `100 g = ${f.per100} kcal` : ''}</div>
            </div>
            <div class="pg-gram">${f.kcal}</div>
            <button class="icon-btn" data-act="del-food" data-fid="${esc(f.id)}" aria-label="sil">🗑</button>
          </div>`).join('')}
      </div>` : ''}

    ${planli.length ? `
      <div class="section-title">Bugün</div>
      <div class="habit-list">${planli.map((h) => habitCardHtml(h, d)).join('')}</div>` : ''}

    ${digerleri.length ? `
      <div class="section-title">Bugün planlı değil</div>
      <div class="habit-list" style="opacity:.72">${digerleri.map((h) => habitCardHtml(h, d)).join('')}</div>` : ''}

    <div class="section-title">Günlük hedefler</div>
    <div class="stat-grid">
      <div class="stat-box"><div class="sv" style="color:var(--success)">${t.protein}</div><div class="sl">protein (g)</div></div>
      <div class="stat-box"><div class="sv">${t.karb}</div><div class="sl">karbonhidrat (g)</div></div>
      <div class="stat-box"><div class="sv">${t.yag}</div><div class="sl">yağ (g)</div></div>
      <div class="stat-box"><div class="sv">${t.lif}</div><div class="sl">lif (g)</div></div>
      <div class="stat-box"><div class="sv">${t.suL.toLocaleString('tr-TR')}</div><div class="sl">su (litre)</div></div>
      <div class="stat-box"><div class="sv">${(t.adimHedef / 1000)}b</div><div class="sl">adım</div></div>
    </div>

    ${t.uyarilar.map((u) => `<div class="info-box mt">${esc(u)}</div>`).join('')}

    <div class="panel mt">
      <div class="list-row">
        <div class="h-emoji" style="background:rgba(79,207,142,.16);color:var(--success)">✅</div>
        <div class="grow" style="min-width:0">
          <div class="h-name">${kurulu ? 'Program alışkanlıklarında kurulu' : 'Alışkanlıklara kur'}</div>
          <div class="h-meta">${kurulu
            ? 'Bilgilerini değiştirdiysen yenile; işaretlerin ve geçmişin korunur.'
            : 'Öğünler gramajlı liste, su ve adım sayaç olarak Bugün ekranına düşer.'}</div>
        </div>
        <button class="btn btn-sm ${kurulu ? 'btn-ghost' : 'btn-primary'}"
                data-act="install-program">${kurulu ? 'Yenile' : 'Kur'}</button>
      </div>
      <div class="list-row">
        <div class="grow"><div class="h-name">Bilgilerim</div>
          <div class="h-meta">${esc(p.cinsiyet === 'kadin' ? 'Kadın' : 'Erkek')} ·
            ${p.yas} yaş · ${p.boy} cm · ${p.kilo} kg ·
            haftada ${t.antrenmanGun} gün spor</div></div>
        <button class="btn btn-sm btn-ghost" data-act="edit-profile">Güncelle</button>
      </div>
    </div>

    ${plan.ogunler.map(ogunHtml).join('')}

    <div class="section-title">🔁 Akşam protein rotasyonu</div>
    <div class="panel">
      ${plan.rotasyon.map((r) => `
        <div class="list-row">
          <div class="pg-gun">${esc(r.kisa)}</div>
          <div class="grow"><div class="h-name">${esc(r.ad)}</div></div>
          <div class="pg-gram">${r.g} g</div>
        </div>`).join('')}
      <div class="list-row"><div class="grow tiny muted">Çiğ ağırlıklar. Akşam
        yemeğindeki protein satırının yerine bu tablodaki günü koy.</div></div>
    </div>

    ${t.antrenmanGun > 0 ? `
      <div class="section-title">🏋️ ${esc(plan.antrenman.ad)}</div>
      <div class="panel">
        ${plan.antrenman.gunler.map((g) => `
          <div class="list-row" style="display:block">
            <div class="h-name" style="margin-bottom:4px">${esc(g.ad)}</div>
            <div class="h-meta">${g.hareketler.map(esc).join(' · ')}</div>
          </div>`).join('')}
        <div class="list-row"><div class="grow tiny muted">${esc(plan.antrenman.not)}
          Her set 6-12 tekrar, son 2 tekrar zorlanacak şekilde.</div></div>
      </div>` : `
      <div class="info-box mt">Antrenman günü girmemişsin. Diyette kas kaybını
        önleyen tek şey ağırlık antrenmanıdır — haftada 2-3 güne çıkarsan
        verdiğin kilonun daha büyük kısmı yağ olur.</div>`}

    <div class="section-title">🌱 Lifi kademeli artır</div>
    <div class="panel">
      <div class="list-row"><div class="grow small muted">${t.lif} grama bir günde
        çıkmak şişkinlik ve kramp yapar. Sebzeyi haftalara yayarak artır,
        suyu da birlikte artır.</div></div>
      ${fiberRamp(t.lif).map(([h, v]) => `
        <div class="list-row">
          <div class="grow"><div class="h-name" style="font-weight:600">${esc(h)}</div>
            <div class="h-meta">${esc(v)}</div></div>
        </div>`).join('')}
    </div>`;
}

/* ------------------------------------------------------ yiyecek ekleme -- */

/**
 * Yiyecek ekleme ekranı: barkod okut, isimle ara ya da elle yaz.
 *
 * Üç yol da aynı yere çıkar: bir ürün seçilir, gramaj girilir, kalori
 * hesaplanır. Ağ ya da kamera çalışmasa bile elle giriş hep açıktır —
 * kullanıcının kalori takibi dış bir servisin ayakta olmasına bağlı olmamalı.
 */
function foodDialog() {
  let mod = 'ara';                 // 'barkod' | 'ara' | 'elle'
  let secili = null;               // seçilen ürün
  let durdur = null;               // kamerayı kapatan işlev

  const gunluk = foodsFor(state.date);

  openModal(`
    <div class="modal-head">
      <h3>Yiyecek ekle</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>

    <div class="chips" id="fd-mod" style="margin-bottom:14px">
      <button type="button" class="chip" data-v="barkod" aria-pressed="false">📷 Barkod</button>
      <button type="button" class="chip" data-v="ara" aria-pressed="true">🔍 Ara</button>
      <button type="button" class="chip" data-v="elle" aria-pressed="false">✏️ Elle</button>
    </div>

    <div class="stack">
      <!-- BARKOD -->
      <div id="fd-barkod" hidden>
        <div class="fd-cam"><video id="fd-video" muted playsinline></video>
          <div class="fd-hedef"></div></div>
        <div class="tiny muted" id="fd-cam-not" style="margin:8px 0 12px">
          Barkodu çerçeveye getir.</div>
        <div class="field">
          <label for="fd-kod">Barkodu elle yaz</label>
          <div style="display:flex;gap:8px">
            <input id="fd-kod" class="input" type="text" inputmode="numeric"
                   autocomplete="off" placeholder="8690..." />
            <button class="btn btn-primary" data-x="kod-bul">Bul</button>
          </div>
        </div>
      </div>

      <!-- ARAMA -->
      <div id="fd-ara">
        <div class="field">
          <label for="fd-q">Ürün adı</label>
          <div style="display:flex;gap:8px">
            <input id="fd-q" class="input" type="text" autocomplete="off"
                   placeholder="örn. sütaş yoğurt" />
            <button class="btn btn-primary" data-x="ara">Ara</button>
          </div>
        </div>
        <div id="fd-sonuc" class="fd-liste"></div>
      </div>

      <!-- ELLE -->
      <div id="fd-elle" hidden>
        <div class="field">
          <label for="fd-ad">Yiyeceğin adı</label>
          <input id="fd-ad" class="input" type="text" maxlength="60" placeholder="örn. simit" />
        </div>
        <div class="field">
          <label for="fd-p100">100 gramda kaç kalori?</label>
          <input id="fd-p100" class="input" type="text" inputmode="numeric"
                 autocomplete="off" placeholder="280" />
          <div class="tiny muted">Paketin arkasında yazar.</div>
        </div>
      </div>

      <!-- SEÇİLEN ÜRÜN + GRAMAJ -->
      <div id="fd-secim" hidden>
        <div class="panel" style="margin-bottom:12px">
          <div class="list-row">
            <div class="grow" style="min-width:0">
              <div class="h-name" id="fd-secim-ad"></div>
              <div class="h-meta" id="fd-secim-alt"></div>
            </div>
            <button class="btn btn-sm btn-ghost" data-x="vazgec">Değiştir</button>
          </div>
        </div>
        <div class="field">
          <label for="fd-g">Kaç gram yedin?</label>
          <input id="fd-g" class="input" type="text" inputmode="decimal"
                 autocomplete="off" value="100" />
        </div>
        <div class="fd-toplam" id="fd-toplam">0 kcal</div>
      </div>

      <div id="fd-err" class="error-box hidden"></div>
      <div id="fd-tani" class="tiny muted hidden" style="white-space:pre-line"></div>
      <button class="btn btn-sm btn-ghost" data-x="tani" style="align-self:flex-start">
        Bağlantıyı sına</button>
    </div>

    ${gunluk.length ? `
      <div class="section-title">Bugün eklediklerin</div>
      <div class="panel">
        ${gunluk.map((f) => `
          <div class="list-row">
            <div class="grow" style="min-width:0">
              <div class="h-name truncate">${esc(f.name)}</div>
              <div class="h-meta">${f.g} g · ${f.kcal} kcal</div>
            </div>
            <button class="icon-btn" data-x="sil" data-fid="${esc(f.id)}" aria-label="sil">🗑</button>
          </div>`).join('')}
      </div>` : ''}

    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Kapat</button>
      <button class="btn btn-primary" data-x="ekle" id="fd-ekle" disabled>Ekle</button>
    </div>`, (m) => {

    const $$$ = (sel) => $(sel, m);
    const hata = (msg) => {
      const box = $$$('#fd-err');
      box.textContent = msg;
      box.classList.toggle('hidden', !msg);
    };

    /* --- mod değiştirme ------------------------------------------------- */
    const modGoster = () => {
      $$$('#fd-barkod').hidden = mod !== 'barkod';
      $$$('#fd-ara').hidden = mod !== 'ara';
      $$$('#fd-elle').hidden = mod !== 'elle';
      $$$('#fd-secim').hidden = !secili;
      if (secili) { $$$('#fd-barkod').hidden = true; $$$('#fd-ara').hidden = true; $$$('#fd-elle').hidden = true; }
      $$$('#fd-ekle').disabled = !secili && mod !== 'elle';
    };

    const kamerayiKapat = () => { try { durdur?.(); } catch {} durdur = null; };

    const kamerayiAc = async () => {
      if (durdur) return;
      const not = $$$('#fd-cam-not');
      if (!kameraVar()) {
        not.textContent = 'Bu tarayıcı kamerayı kullanmıyor — barkodu elle yaz ya da isimle ara.';
        return;
      }
      not.textContent = 'Kamera açılıyor…';
      try {
        durdur = await startScanner($$$('#fd-video'), (kod) => {
          kamerayiKapat();
          $$$('#fd-kod').value = kod;
          barkoddanBul(kod);
        });
        not.textContent = 'Barkodu çerçeveye getir.';
      } catch (err) {
        not.textContent = 'Kamera açılamadı (' + (err?.message || err)
                        + '). Barkodu elle yazabilir ya da isimle arayabilirsin.';
      }
    };

    $$$('#fd-mod').addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      $$('[data-v]', $$$('#fd-mod')).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      mod = b.dataset.v;
      secili = null;
      hata('');
      if (mod === 'barkod') kamerayiAc(); else kamerayiKapat();
      modGoster();
    });

    /* --- ürün seçimi ---------------------------------------------------- */
    const toplamiCiz = () => {
      const g = Number(String($$$('#fd-g').value || '').replace(',', '.')) || 0;
      const kcal = kcalFor(secili?.per100 || 0, g);
      $$$('#fd-toplam').textContent = `${kcal.toLocaleString('tr-TR')} kcal`;
      $$$('#fd-ekle').disabled = !(secili && g > 0);
    };

    const urunSec = (u) => {
      secili = u;
      $$$('#fd-secim-ad').textContent = u.name + (u.brand ? ` · ${u.brand}` : '');
      $$$('#fd-secim-alt').textContent = `100 g = ${u.per100} kcal`
        + (u.protein100 != null ? ` · ${u.protein100} g protein` : '');
      hata('');
      modGoster();
      toplamiCiz();
      setTimeout(() => $$$('#fd-g')?.select(), 60);
    };

    $$$('#fd-g').addEventListener('input', toplamiCiz);

    /* --- barkod --------------------------------------------------------- */
    const barkoddanBul = async (kod) => {
      hata('');
      $$$('#fd-cam-not').textContent = 'Ürün aranıyor…';
      try {
        const u = await lookupBarcode(kod);
        if (!u) {
          hata('Bu barkod veritabanında yok ya da kalorisi kayıtlı değil. '
             + '"Elle" sekmesinden kendin girebilirsin.');
          $$$('#fd-cam-not').textContent = 'Barkodu çerçeveye getir.';
          return;
        }
        urunSec(u);
      } catch (err) {
        /* Sebep neyse onu yaz: her hatayı "internet yok" diye göstermek
           kullanıcıyı olmayan bir sorunu aramaya yolluyor. */
        hata('Ürün bilgisi alınamadı — ' + (err?.message || err)
           + '. "Elle" sekmesinden kendin girebilirsin.');
        $$$('#fd-cam-not').textContent = 'Barkodu çerçeveye getir.';
      }
    };

    /* --- arama ---------------------------------------------------------- */
    const araYap = async () => {
      const q = $$$('#fd-q').value.trim();
      const kutu = $$$('#fd-sonuc');
      if (q.length < 2) return hata('En az iki harf yaz.');
      hata('');
      kutu.innerHTML = '<div class="tiny muted">Aranıyor…</div>';
      try {
        const liste = await searchFoods(q);
        if (!liste.length) {
          kutu.innerHTML = '<div class="tiny muted">Sonuç yok. "Elle" sekmesinden '
                         + 'kendin girebilirsin.</div>';
          return;
        }
        kutu.innerHTML = liste.map((u, i) => `
          <button type="button" class="fd-satir" data-i="${i}">
            <span class="fd-ad">${esc(u.name)}${u.brand ? ` <em>${esc(u.brand)}</em>` : ''}</span>
            <span class="fd-kcal">${u.per100} <i>kcal/100g</i></span>
          </button>`).join('');
        $$('[data-i]', kutu).forEach((b) => {
          b.addEventListener('click', () => urunSec(liste[Number(b.dataset.i)]));
        });
      } catch (err) {
        kutu.innerHTML = '';
        hata('Arama yapılamadı — ' + (err?.message || err)
           + '. "Elle" sekmesinden kendin girebilirsin.');
      }
    };

    /* --- tıklamalar ----------------------------------------------------- */
    m.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      const x = b.dataset.x;

      if (x === 'tani') {
        const kutu = $$$('#fd-tani');
        kutu.classList.remove('hidden');
        kutu.textContent = 'Sınanıyor…';
        const r = await testConnection();
        kutu.textContent = r.map((x2) => `${x2.ok ? '✅' : '❌'} ${x2.kok.replace('https://', '')}\n   ${x2.not}`).join('\n');
        return;
      }

      if (x === 'ara') return araYap();
      if (x === 'kod-bul') return barkoddanBul($$$('#fd-kod').value);
      if (x === 'vazgec') { secili = null; modGoster(); if (mod === 'barkod') kamerayiAc(); return; }

      if (x === 'sil') {
        const kalan = foodsFor(state.date).filter((f) => f.id !== b.dataset.fid);
        await writeFoods(state.date, kalan);
        kamerayiKapat();
        closeModal();
        foodDialog();                       // liste güncel gelsin
        return;
      }

      if (x === 'ekle') {
        if (mod === 'elle' && !secili) {
          const ad = $$$('#fd-ad').value.trim();
          const p100 = Number(String($$$('#fd-p100').value || '').replace(',', '.'));
          if (!ad) return hata('Yiyeceğe bir ad ver.');
          if (!(p100 > 0 && p100 < 1000)) return hata('100 gramdaki kaloriyi gir (1-999).');
          urunSec({ barcode: '', name: ad, brand: '', per100: Math.round(p100), protein100: null });
          return;
        }
        const g = Number(String($$$('#fd-g').value || '').replace(',', '.'));
        if (!(g > 0 && g <= 5000)) return hata('Gramajı gir (1-5000).');

        const kayit = {
          id: uid('f'),
          name: secili.name + (secili.brand ? ` · ${secili.brand}` : ''),
          g: Math.round(g),
          kcal: kcalFor(secili.per100, g),
          per100: secili.per100,
          barcode: secili.barcode || '',
        };
        await writeFoods(state.date, [...foodsFor(state.date), kayit]);
        kamerayiKapat();
        closeModal();
        toast(`${kayit.name.slice(0, 24)} eklendi · ${kayit.kcal} kcal`);
      }
    });

    modGoster();
    setTimeout(() => $$$('#fd-q')?.focus(), 60);
  }, () => { try { durdur?.(); } catch {} durdur = null; });
}

/* --------------------------------------------------------- bilgi formu -- */

/**
 * Program için gereken bilgileri sorar.
 *
 * Sayısal alanlar inputmode="numeric" ile açılır — telefonda harf klavyesi
 * gelmesi form doldurmayı bırakmanın en yaygın sebebi.
 */
function profileDialog() {
  const p = state.profile || {
    cinsiyet: 'erkek', yas: '', boy: '', kilo: '',
    hareket: 'cokAz', antrenmanGun: 3, hedef: 'ver', hiz: 'normal', kacin: [],
  };
  const kacin = Array.isArray(p.kacin) ? p.kacin : [];

  const chips = (id, secenekler, secili) => `
    <div class="chips" id="${id}">
      ${secenekler.map(([v, l]) => `<button type="button" class="chip" data-v="${v}"
         aria-pressed="${String(v) === String(secili)}">${esc(l)}</button>`).join('')}
    </div>`;

  openModal(`
    <div class="modal-head">
      <h3>${state.profile ? 'Bilgilerimi güncelle' : 'Programı oluştur'}</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button>
    </div>
    <div class="stack">
      <div class="field">
        <label>Cinsiyet</label>
        ${chips('pf-cinsiyet', CINSIYET, p.cinsiyet)}
      </div>

      <div class="pg-3">
        <div class="field">
          <label for="pf-yas">Yaş</label>
          <input id="pf-yas" class="input" type="text" inputmode="numeric"
                 autocomplete="off" value="${esc(String(p.yas ?? ''))}" placeholder="24" />
        </div>
        <div class="field">
          <label for="pf-boy">Boy (cm)</label>
          <input id="pf-boy" class="input" type="text" inputmode="numeric"
                 autocomplete="off" value="${esc(String(p.boy ?? ''))}" placeholder="178" />
        </div>
        <div class="field">
          <label for="pf-kilo">Kilo (kg)</label>
          <input id="pf-kilo" class="input" type="text" inputmode="decimal"
                 autocomplete="off" value="${esc(String(p.kilo ?? ''))}" placeholder="85" />
        </div>
      </div>

      <div class="field">
        <label>Spor dışında günlük hareketin</label>
        ${chips('pf-hareket', HAREKET.map((h) => [h[0], h[1]]), p.hareket)}
        <div class="tiny muted" id="pf-hareket-not">${esc(
          (HAREKET.find((h) => h[0] === p.hareket) || HAREKET[0])[2])}</div>
      </div>

      <div class="field">
        <label for="pf-gun">Haftada kaç gün ağırlık antrenmanı yapıyorsun?</label>
        <input id="pf-gun" class="input" type="text" inputmode="numeric"
               autocomplete="off" value="${esc(String(p.antrenmanGun ?? 3))}" />
        <div class="tiny muted">Hiç yapmıyorsan 0 yaz — program yine çıkar ama
          verdiğin kilonun daha büyük kısmı kas olur.</div>
      </div>

      <div class="field">
        <label>Hedefin</label>
        ${chips('pf-hedef', HEDEF, p.hedef)}
      </div>

      <div class="field" id="pf-hiz-alan">
        <label>Hız</label>
        ${chips('pf-hiz', HIZ.map((h) => [h[0], h[1]]), p.hiz)}
        <div class="tiny muted" id="pf-hiz-not">${esc(
          (HIZ.find((h) => h[0] === p.hiz) || HIZ[1])[2])}</div>
      </div>

      <div class="field">
        <label>Yemediklerin <span class="muted">(isteğe bağlı)</span></label>
        <div class="stack" id="pf-kacin" style="gap:8px">
          ${KACIN.map(([v, l]) => `
            <label class="check-row" style="margin:0">
              <input type="checkbox" data-v="${v}" ${kacin.includes(v) ? 'checked' : ''} />
              <span><b>${esc(l)}</b></span>
            </label>`).join('')}
        </div>
      </div>

      <div id="pf-err" class="error-box hidden"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Vazgeç</button>
      <button class="btn btn-primary" data-x="save">Hesapla</button>
    </div>`, (m) => {

    /* Chip grupları: tek seçim, seçilen aria-pressed ile işaretlenir. */
    const sec = (id) => $(`#${id} [aria-pressed="true"]`, m)?.dataset.v;
    ['pf-cinsiyet', 'pf-hareket', 'pf-hedef', 'pf-hiz'].forEach((id) => {
      $(`#${id}`, m).addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        $$('[data-v]', $(`#${id}`, m)).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));

        /* Açıklama satırları seçimle birlikte güncellenir. */
        if (id === 'pf-hareket') {
          $('#pf-hareket-not', m).textContent = (HAREKET.find((h) => h[0] === b.dataset.v) || [])[2] || '';
        }
        if (id === 'pf-hiz') {
          $('#pf-hiz-not', m).textContent = (HIZ.find((h) => h[0] === b.dataset.v) || [])[2] || '';
        }
        /* Hız yalnızca kilo verirken anlamlı. */
        if (id === 'pf-hedef') {
          $('#pf-hiz-alan', m).hidden = b.dataset.v !== 'ver';
        }
      });
    });
    $('#pf-hiz-alan', m).hidden = p.hedef !== 'ver';

    /* Vejetaryen işaretlenince balık/kırmızı et zaten kapsanır. */
    const kacinKutu = $('#pf-kacin', m);
    kacinKutu.addEventListener('change', () => {
      const vej = $('[data-v="vejeteryan"]', kacinKutu).checked;
      ['balik', 'kirmizi'].forEach((v) => {
        const el = $(`[data-v="${v}"]`, kacinKutu);
        el.disabled = vej;
        el.closest('.check-row').style.opacity = vej ? '.45' : '';
      });
    });
    kacinKutu.dispatchEvent(new Event('change'));

    setTimeout(() => $('#pf-yas', m)?.focus(), 60);

    m.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]')?.dataset.x !== 'save') return;

      /*  Türkçe klavyede ondalık ayırıcı virgüldür ve "85,5" değeri
          type="number" alanından boş string olarak döner — telefonda form
          sebepsiz reddedilmiş gibi görünür. Alanlar metin, ayrıştırma burada. */
      const sayi = (sel) => {
        const ham = String($(sel, m).value || '').trim().replace(',', '.');
        const n = Number(ham.replace(/[^\d.]/g, ''));
        return Number.isFinite(n) ? n : NaN;
      };
      const yas = sayi('#pf-yas');
      const boy = sayi('#pf-boy');
      const kilo = sayi('#pf-kilo');
      const gun = sayi('#pf-gun');

      const hata = (msg) => {
        const box = $('#pf-err', m);
        box.textContent = msg;
        box.classList.remove('hidden');
      };

      if (!(yas >= 14 && yas <= 90)) return hata('Yaşı 14 ile 90 arasında gir.');
      if (!(boy >= 120 && boy <= 230)) return hata('Boyu santimetre olarak gir (120-230).');
      if (!(kilo >= 35 && kilo <= 300)) return hata('Kiloyu kilogram olarak gir (35-300).');
      if (!(gun >= 0 && gun <= 7)) return hata('Antrenman günü 0 ile 7 arasında olmalı.');

      const profile = {
        cinsiyet: sec('pf-cinsiyet') || 'erkek',
        yas, boy, kilo,
        hareket: sec('pf-hareket') || 'cokAz',
        antrenmanGun: gun,
        hedef: sec('pf-hedef') || 'ver',
        hiz: sec('pf-hiz') || 'normal',
        kacin: $$('input[type="checkbox"]', kacinKutu)
          .filter((x) => x.checked && !x.disabled).map((x) => x.dataset.v),
      };

      if (typeof state.store?.saveProfile !== 'function') {
        return hata('Uygulamanın bir parçası eski sürümde kalmış. '
                  + 'Ayarlar → Uygulama → Güncelle ile yenile, sonra tekrar dene.');
      }

      /*  Plan hemen gösterilir, bulut yazımı arkada sürer. Bu ekranda kullanıcı
          zaten bütün bilgiyi girdi; kaydın sunucuya ulaşmasını beklemek, zayıf
          bağlantıda formu sebepsiz reddedilmiş gibi gösteriyordu. Yazım
          tutmazsa profil yerel yedekten okunur ve durum toast ile bildirilir. */
      mirrorProfile(profile);
      state.profile = profile;
      closeModal();
      go('program');

      try {
        await state.store.saveProfile(profile);
        toast('Program hesaplandı 🎉');
      } catch (err) {
        toast('Program hesaplandı ama buluta kaydedilemedi: '
            + (err?.message || err) + ' — bu cihazda duruyor.', 6000);
      }
    });
  });
}

/* ==========================================================================
   Hazır paket: Spor ve Diyet
   ========================================================================== */

/**
 * Planı alışkanlıklara ve listelere yazar.
 *
 * Yeniden çalıştırıldığında kopya üretmez. Eşleştirme kalıcı anahtar üzerinden
 * yapılır, ad üzerinden değil: kilo düşünce "Su — 4 litre" alışkanlığı
 * "Su — 3,5 litre" olur, adla eşleştirseydik her güncellemede yeni bir
 * alışkanlık doğar, eskisinin serisi ölürdü. Anahtar sabit kaldığı için
 * kimlik de sabit kalır ve kayıtlar, seriler, ısı haritası yerinde durur.
 *
 * Sabit liste maddelerinde metni değişmeyenlerin kimliği korunur — yoksa o
 * günün işaretleri şablonla eşleşmez ve tikler sessizce kaybolurdu.
 *
 * Listeler yalnızca yoksa oluşturulur; alışveriş listesindeki maddeler
 * işaretlenmiş olabilir, üzerine yazmak o emeği siler.
 */
async function installProgram() {
  const plan = currentPlan();
  if (!plan) { toast('Önce bilgilerini gir'); return; }

  const specs = buildHabits(plan);
  const already = state.habits.some((h) => (h.group || '').trim() === PROGRAM_GROUP);

  const ok = await confirmDialog(
    already ? 'Program yenilensin mi?' : 'Program alışkanlıklara kurulsun mu?',
    already
      ? `${specs.length} alışkanlık yeni hesaba göre güncellenir. İşaretlerin, `
        + 'serilerin ve geçmiş kayıtların korunur; kendi eklediğin alışkanlıklara '
        + 'dokunulmaz.'
      : `${specs.length} alışkanlık ve 2 liste "${PROGRAM_GROUP}" bölümüne eklenir. `
        + 'Mevcut alışkanlıklarına dokunulmaz.',
    already ? 'Yenile' : 'Kur', false);
  if (!ok) return;

  const bolumde = (h) => (h.group || '').trim() === PROGRAM_GROUP;
  const bul = (spec) => state.habits.find((h) => bolumde(h) && h.progKey === spec.key)
    || state.habits.find((h) => bolumde(h) && !h.progKey && eskiAdUyuyor(spec.key, h.name));

  let base = state.habits.length;
  let eklenen = 0, guncellenen = 0;

  try {
    for (const spec of specs) {
      const mevcut = bul(spec);
      const hasTasks = Array.isArray(spec.tasks) && spec.tasks.length > 0;

      const payload = {
        ...(mevcut || {}),
        progKey: spec.key,
        name: spec.name,
        emoji: spec.emoji,
        color: spec.color,
        mode: spec.mode,
        target: spec.target,
        schedule: spec.schedule,
        note: spec.note || '',
        group: PROGRAM_GROUP,
        hasTasks,
        taskMode: hasTasks ? 'fixed' : 'daily',
        driveFromTasks: hasTasks,
        archived: false,
        kcal: spec.kcal || 0,
        taskKcal: Array.isArray(spec.taskKcal) ? spec.taskKcal : [],
      };

      if (hasTasks) {
        const eski = Array.isArray(mevcut?.taskTemplate) ? mevcut.taskTemplate : [];
        payload.taskTemplate = spec.tasks.map((text) => ({
          id: eski.find((t) => t.text === text)?.id || uid('t'),
          text,
        }));
      } else {
        delete payload.taskTemplate;
      }

      if (mevcut) guncellenen++;
      else { payload.order = base++; eklenen++; }

      const savedId = await state.store.saveHabit(payload);
      await syncDerived({ ...payload, id: payload.id || savedId });
    }

    /* Program küçüldüyse (antrenman günü 0'a indi, hedef "koru" oldu) artık
       üretilmeyen alışkanlıklar arşivlenir — silmiyoruz, geçmişi duruyor. */
    const anahtarlar = new Set(specs.map((x) => x.key));
    for (const h of state.habits) {
      if ((h.group || '').trim() !== PROGRAM_GROUP || h.archived) continue;
      if (h.progKey && !anahtarlar.has(h.progKey)) {
        await state.store.saveHabit({ ...h, archived: true });
      }
    }

    for (const spec of buildLists(plan)) {
      if (state.lists.some((l) => l.name === spec.name)) continue;
      await state.store.saveList({
        name: spec.name,
        emoji: spec.emoji,
        order: state.lists.length,
        items: spec.items.map((text) => ({ id: uid('i'), text, done: false })),
      });
    }

    toast(eklenen && guncellenen ? `${eklenen} eklendi, ${guncellenen} güncellendi 🎉`
        : eklenen ? 'Program kuruldu 🎉'
        : `${guncellenen} alışkanlık güncellendi`);
  } catch (err) {
    toast('Program kurulamadı: ' + (err?.message || err));
  }
}

/* ==========================================================================
   Çizim
   ========================================================================== */

function render() {
  if (!state.store) return;
  const y = window.scrollY;

  const html = state.view === 'program'  ? viewProgram()
             : state.view === 'lists'    ? viewLists()
             : state.view === 'habits'   ? viewHabits()
             : state.view === 'stats'    ? viewStats()
             : state.view === 'settings' ? viewSettings()
             :                             viewToday();

  $('#view').innerHTML = html;
  $('#topbar-title').textContent = VIEW_TITLES[state.view] || 'Alışkanlıklarım';
  $$('#navbar [data-view]').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.view === state.view)));

  window.scrollTo(0, y);
}

function go(view) {
  state.view = view;
  /*  Her iki ekran da "bugün"ü gösterir. Program sekmesinde tarih ileri geri
      gezilmiyor; işaretler state.date'e yazıldığı için burada sıfırlanmazsa
      Bugün'de geçmiş bir güne bakıp Program'a geçen kişi o eski güne
      işaret koymuş olurdu. */
  if (view === 'today' || view === 'program') state.date = today();
  window.scrollTo(0, 0);
  render();
}

/* ==========================================================================
   Eylemler
   ========================================================================== */

async function setValue(habitId, value) {
  const dk = dateKey(state.date);
  const k = `${dk}_${habitId}`;
  if (!value) state.entries.delete(k);
  else state.entries.set(k, { habitId, date: dk, value });
  invalidateIndex();
  render();
  try {
    await state.store.setEntry(dk, habitId, value);
  } catch (err) {
    toast('Kaydedilemedi: ' + (err?.message || err));
  }
}

async function move(id, delta) {
  const list = activeHabits();
  const i = list.findIndex((h) => h.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((h, k) => { h.order = k; });
  state.habits = [...list, ...state.habits.filter((h) => h.archived)];
  render();
  try { await state.store.saveOrder(list); } catch (err) { toast('Sıralama kaydedilemedi'); }
}

function handleAction(act, el) {
  const id = el.dataset.id;
  const habit = id ? state.habits.find((h) => h.id === id) : null;

  switch (act) {
    case 'close-modal': return closeModal();

    case 'new-habit':  return openHabitEditor(null);
    case 'edit-habit': return habit && openHabitEditor(habit);
    case 'time-edit':  return habit && timeDialog(habit);

    case 'task-panel': {
      if (state.openTasks.has(id)) state.openTasks.delete(id);
      else state.openTasks.add(id);
      return render();
    }
    case 'task-check': {
      const items = tasksFor(id).map((it) =>
        it.id === el.dataset.tid ? { ...it, done: !it.done } : it);
      navigator.vibrate?.(8);
      return writeTasks(id, items);
    }
    case 'task-del':
      return writeTasks(id, tasksFor(id).filter((it) => it.id !== el.dataset.tid));

    case 'photo-add': {
      const meta = { ownerType: el.dataset.otype, ownerId: el.dataset.oid,
                     date: el.dataset.odate || null };
      return pickPhotos((files) => addPhotos(meta, files));
    }
    case 'photo-open': {
      const meta = { ownerType: el.dataset.otype, ownerId: el.dataset.oid,
                     date: el.dataset.odate || null };
      return photoViewer(meta, el.dataset.pid);
    }

    case 'new-list':   return listEditor(null);
    case 'open-list':  { state.openList = id; window.scrollTo(0, 0); return render(); }
    case 'close-list': { state.openList = null; window.scrollTo(0, 0); return render(); }
    case 'edit-list':  return listEditor(state.lists.find((l) => l.id === id));

    case 'del-list': {
      const l = state.lists.find((x) => x.id === id);
      if (!l) return;
      return confirmDialog('Liste silinsin mi?',
        `<b>${esc(l.name)}</b> ve içindeki ${(l.items || []).length} madde silinecek.`)
        .then(async (ok) => {
          if (!ok) return;
          state.openList = null;
          const album = state.albums.get(`l_${id}`);
          await state.store.deleteList(id);
          if (album) {
            await state.store.saveAlbum(`l_${id}`, { items: [] }).catch(() => {});
            for (const p of album.items) await state.store.deletePhoto(p.id).catch(() => {});
          }
          toast('Liste silindi');
        });
    }

    case 'li-check': {
      const l = state.lists.find((x) => x.id === id);
      if (!l) return;
      navigator.vibrate?.(8);
      return writeListItems(id, (l.items || []).map((it) =>
        it.id === el.dataset.tid ? { ...it, done: !it.done } : it));
    }
    case 'li-date': {
      const l = state.lists.find((x) => x.id === id);
      const item = l?.items?.find((it) => it.id === el.dataset.tid);
      return item && dueDialog(id, item);
    }
    case 'li-del': {
      const l = state.lists.find((x) => x.id === id);
      if (!l) return;
      return writeListItems(id, (l.items || []).filter((it) => it.id !== el.dataset.tid));
    }
    case 'li-clear': {
      const l = state.lists.find((x) => x.id === id);
      if (!l) return;
      const kept = (l.items || []).filter((it) => !it.done);
      toast(`${(l.items || []).length - kept.length} madde temizlendi`);
      return writeListItems(id, kept);
    }

    case 'task-time': {
      const item = tasksFor(id).find((it) => it.id === el.dataset.tid);
      return habit && item && taskTimeDialog(habit, item);
    }

    case 'task-copy': {
      const prev = previousTaskDay(id);
      if (!prev) return;
      // Metinler kopyalanır, işaretler sıfırlanır — yeni bir gün başlıyor.
      const items = prev.items.map((it) => ({ id: uid('t'), text: it.text, done: false }));
      toast(`${items.length} madde kopyalandı`);
      return writeTasks(id, items);
    }

    case 'toggle': {
      if (!habit) return;
      const done = entryValue(habit.id) >= targetOf(habit);
      navigator.vibrate?.(done ? 6 : 12);
      return setValue(habit.id, done ? 0 : targetOf(habit));
    }
    case 'inc': {
      if (!habit) return;
      navigator.vibrate?.(8);
      return setValue(habit.id, Math.min(targetOf(habit), entryValue(habit.id) + 1));
    }
    case 'dec': {
      if (!habit) return;
      return setValue(habit.id, Math.max(0, entryValue(habit.id) - 1));
    }

    case 'prev-day': state.date = addDays(state.date, -1); return render();
    case 'next-day': state.date = addDays(state.date, 1);  return render();
    case 'go-today': state.date = today();                 return render();
    case 'pick-day': state.date = parseKey(el.dataset.date); return render();

    case 'move-up':   return move(id, -1);
    case 'move-down': return move(id, 1);

    case 'unarchive': return habit && state.store.saveHabit({ ...habit, archived: false });

    case 'del-habit': return habit && confirmDialog(
      'Alışkanlık silinsin mi?',
      `<b>${esc(habit.name)}</b> ve tüm kayıtları kalıcı olarak silinecek.`
    ).then((ok) => ok && state.store.deleteHabit(id).then(() => toast('Silindi')));

    case 'theme': {
      state.prefs = { ...state.prefs, theme: el.dataset.v };
      setPrefs(state.prefs);
      applyTheme();
      return render();
    }

    case 'toggle-remember': {
      const remember = state.prefs.remember === false;      // tersine çevir
      state.prefs = { ...state.prefs, remember };
      if (!remember) state.prefs.lastEmail = '';
      setPrefs(state.prefs);
      setAuthPersistence(state.fb, remember);
      toast(remember ? 'Oturum bu cihazda açık kalacak'
                     : 'Tarayıcı kapanınca çıkış yapılacak');
      return render();
    }

    case 'install': return doInstall();
    case 'check-update': return forceUpdate();

    case 'diagnose': return diagnosticsDialog();

    case 'logout': return confirmDialog('Çıkış yapılsın mı?',
      'Verileriniz hesabınızda kalır; tekrar giriş yaptığınızda geri gelir.',
      'Çıkış yap', false).then((ok) => ok && state.fb.sdk.auth.signOut(state.fb.auth));

    case 'pass-reset': return sendPasswordReset();

    case 'install-program': return installProgram();
    case 'edit-profile':    return profileDialog();
    case 'add-food':        return foodDialog();
    case 'del-food': {
      const fid = el.dataset.fid;
      return writeFoods(state.date, foodsFor(state.date).filter((f) => f.id !== fid));
    }

    case 'export': return exportDialog();
    case 'import': return importDialog();

    case 'wipe': return confirmDialog('Tüm veriler silinsin mi?',
      'Bütün alışkanlıklar ve geçmiş kayıtlar silinecek. Bu işlem geri alınamaz.')
      .then(async (ok) => {
        if (!ok) return;
        await state.store.wipe();
        toast('Tüm veriler silindi');
      });

    case 'to-cloud': return confirmDialog('Buluta geçilsin mi?',
      'Ücretsiz Firebase kurulumundan sonra hesap açacaksınız. Bu cihazdaki veriler ' +
      'korunur ve giriş yaptığınızda hesabınıza aktarmayı teklif ederiz.',
      'Devam et', false).then((ok) => {
        if (!ok) return;
        try {
          const raw = localStorage.getItem('habits.local.habits');
          const ent = localStorage.getItem('habits.local.entries');
          if (raw && raw !== '[]') {
            localStorage.setItem('habits.pendingImport', JSON.stringify({
              habits: JSON.parse(raw),
              entries: Object.values(JSON.parse(ent || '{}')),
            }));
          }
        } catch {}
        setMode('cloud');
        location.reload();
      });

    case 'reset-config': return confirmDialog('Bulut ayarları sıfırlansın mı?',
      'Firebase yapılandırmasını yeniden gireceksiniz. Buluttaki verileriniz silinmez.',
      'Sıfırla', false).then((ok) => {
        if (!ok) return;
        clearStoredConfig();
        setMode('');
        location.reload();
      });
  }
}

async function sendPasswordReset() {
  const mail = state.user?.email;
  if (!mail) return;
  try {
    await state.fb.sdk.auth.sendPasswordResetEmail(state.fb.auth, mail);
    toast('Şifre değiştirme bağlantısı ' + mail + ' adresine gönderildi.', 4200);
  } catch (err) {
    toast(authErrorMessage(err), 5000);
  }
}

/* ------------------------------------------------------ yedekle / yükle -- */

function buildBackup() {
  return {
    app: 'aliskanliklarim',
    version: 1,
    exportedAt: new Date().toISOString(),
    habits: state.habits.map((h) => ({ ...h })),
    entries: [...state.entries.values()].map(({ habitId, date, value }) => ({ habitId, date, value })),
    tasks: [...state.tasks.values()].map(({ habitId, date, items }) => ({ habitId, date, items })),
    lists: state.lists.map((l) => ({ ...l })),
    albums: [...state.albums.entries()].map(([id, a]) => ({ id, ...a })),
  };
}

function exportDialog() {
  const json = JSON.stringify(buildBackup(), null, 2);
  const name = `aliskanliklarim-${dateKey(today())}.json`;

  openModal(`
    <div class="modal-head"><h3>Yedek al</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button></div>
    <p class="small muted">${state.habits.length} alışkanlık, ${state.entries.size} kayıt,
       ${state.tasks.size} günlük liste, ${state.lists.length} bağımsız liste,
       ${[...state.albums.values()].reduce((n, a) => n + a.items.length, 0)} fotoğraf.</p>
    <div class="info-box" style="margin-top:10px">
      Fotoğrafların yalnızca <b>küçük önizlemeleri</b> bu dosyaya girer; tam boyutlu
      hâlleri dosyayı çok büyüteceği için dışarıda bırakılır. Onlar hesabınızda
      durmaya devam eder.
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-x="copy">Panoya kopyala</button>
      <button class="btn btn-primary" data-x="download">Dosyayı indir</button>
    </div>`, (m) => {
    m.addEventListener('click', async (e) => {
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (x === 'copy') {
        try { await navigator.clipboard.writeText(json); toast('Panoya kopyalandı'); }
        catch { toast('Kopyalanamadı, dosya indirmeyi deneyin'); }
        closeModal();
      } else if (x === 'download') {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        closeModal();
      }
    });
  });
}

function importDialog() {
  openModal(`
    <div class="modal-head"><h3>Yedekten geri yükle</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button></div>
    <div class="stack">
      <div class="field">
        <label for="imp-file">Yedek dosyası</label>
        <input id="imp-file" class="input" type="file" accept=".json,application/json" />
      </div>
      <div class="field">
        <label for="imp-text">…veya JSON metnini yapıştırın</label>
        <textarea id="imp-text" class="input mono" rows="5" spellcheck="false"></textarea>
      </div>
      <div id="imp-err" class="error-box hidden"></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Vazgeç</button>
      <button class="btn btn-primary" data-x="go">Geri yükle</button>
    </div>`, (m) => {
    $('#imp-file', m).addEventListener('change', async (e) => {
      const f = e.target.files?.[0];
      if (f) $('#imp-text', m).value = await f.text();
    });

    m.addEventListener('click', async (e) => {
      if (e.target.closest('[data-x]')?.dataset.x !== 'go') return;
      const err = $('#imp-err', m);
      let data;
      try { data = JSON.parse($('#imp-text', m).value); } catch { data = null; }
      if (!data || !Array.isArray(data.habits)) {
        err.textContent = 'Dosya okunamadı. Bu uygulamadan alınmış bir yedek olmalı.';
        err.classList.remove('hidden');
        return;
      }
      try {
        await state.store.importData({
          habits: data.habits, entries: data.entries || [],
          tasks: data.tasks || [], lists: data.lists || [], albums: data.albums || [],
        });
        closeModal();
        toast(`${data.habits.length} alışkanlık geri yüklendi`);
      } catch (e2) {
        err.textContent = 'Yüklenemedi: ' + (e2?.message || e2);
        err.classList.remove('hidden');
      }
    });
  });
}

/** Yerel moddan buluta geçerken bekletilen veriyi aktarmayı teklif eder. */
function maybeOfferMigration() {
  let pending;
  try { pending = JSON.parse(localStorage.getItem('habits.pendingImport') || 'null'); }
  catch { pending = null; }
  if (!pending?.habits?.length) return;

  openModal(`
    <div class="modal-head"><h3>Bu cihazdaki veriler</h3></div>
    <p class="small muted">Yerel modda tuttuğunuz <b>${pending.habits.length}</b> alışkanlık ve
      <b>${(pending.entries || []).length}</b> kayıt bulundu. Hesabınıza aktaralım mı?</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-x="skip">Hayır</button>
      <button class="btn btn-primary" data-x="do">Aktar</button>
    </div>`, (m) => {
    m.addEventListener('click', async (e) => {
      const x = e.target.closest('[data-x]')?.dataset.x;
      if (!x) return;
      localStorage.removeItem('habits.pendingImport');
      closeModal();
      if (x !== 'do') return;
      try {
        await state.store.importData(pending);
        toast('Veriler hesabınıza aktarıldı');
      } catch (err) {
        toast('Aktarılamadı: ' + (err?.message || err), 5000);
      }
    });
  });
}

/* ==========================================================================
   Kurulum kontrolü — neyin eksik olduğunu tespit eder ve konsolda tam
   sayfaya bağlantı verir.
   ========================================================================== */

const CHECK_ICON = { ok: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };

function consoleLinks(pid) {
  const base = `https://console.firebase.google.com/project/${encodeURIComponent(pid)}`;
  return {
    providers:    `${base}/authentication/providers`,
    authSettings: `${base}/authentication/settings`,
    rules:        `${base}/firestore/rules`,
    data:         `${base}/firestore/data`,
    general:      `${base}/settings/general`,
  };
}

/**
 * Var olmayan bir hesapla giriş denemesi yapar; dönen hata koduna bakarak
 * "E-posta/Şifre yöntemi açık mı?" sorusunu yanıtlar. Hiçbir hesap oluşturmaz.
 */
async function probeAuth(fb) {
  const rnd = Math.random().toString(36).slice(2, 10);
  try {
    await fb.sdk.auth.signInWithEmailAndPassword(
      fb.auth, `kurulum-testi-${rnd}@example.com`, `pw-${rnd}-${rnd}`);
    return 'unexpected-success';
  } catch (e) {
    return e?.code || 'bilinmeyen';
  }
}

async function runDiagnostics() {
  const out = [];
  const fb = state.fb;
  const pid = fb?.app?.options?.projectId;

  if (!fb || !pid) {
    out.push({ s: 'fail', t: 'Firebase ayarları',
               d: 'Yapılandırma yok. config.js dosyasını doldurun ya da kurulum ekranından yapıştırın.' });
    return out;
  }

  out.push({ s: 'ok', t: 'Firebase ayarları', d: `Proje: ${pid}`, link: consoleLinks(pid).general,
             linkText: 'Proje ayarları' });

  const L = consoleLinks(pid);

  /* --- 1. E-posta/Şifre yöntemi ------------------------------------------ */
  if (state.user) {
    out.push({ s: 'ok', t: 'E-posta/Şifre girişi', d: 'Çalışıyor — şu an giriş yapmış durumdasınız.' });
  } else {
    const code = await probeAuth(fb);
    if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
      out.push({ s: 'fail', t: 'E-posta/Şifre girişi',
                 d: 'Kapalı. Açmadan hesap oluşturamazsınız.',
                 link: L.providers, linkText: 'Authentication → Sign-in method' });
    } else if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
      out.push({ s: 'fail', t: 'E-posta/Şifre girişi',
                 d: 'apiKey değeri geçersiz. Yapılandırmayı yeniden kopyalayın.',
                 link: L.general, linkText: 'Proje ayarları' });
    } else if (code === 'auth/unauthorized-domain') {
      out.push({ s: 'fail', t: 'E-posta/Şifre girişi',
                 d: `Bu adres (${location.hostname}) yetkili alan adları listesinde değil.`,
                 link: L.authSettings, linkText: 'Authentication → Settings' });
    } else if (code === 'auth/network-request-failed') {
      out.push({ s: 'warn', t: 'E-posta/Şifre girişi', d: 'İnternet bağlantısı kurulamadı, kontrol edilemedi.' });
    } else if (code === 'auth/too-many-requests') {
      out.push({ s: 'warn', t: 'E-posta/Şifre girişi',
                 d: 'Çok fazla deneme yapıldı; birkaç dakika sonra tekrar kontrol edin.' });
    } else {
      out.push({ s: 'ok', t: 'E-posta/Şifre girişi', d: 'Açık — hesap oluşturabilirsiniz.' });
    }
  }

  /* --- 2. Yetkili alan adı ----------------------------------------------- */
  out.push({ s: 'info', t: 'Yetkili alan adı',
             d: `Şifre sıfırlama bağlantılarının çalışması için "${location.hostname}" ` +
                'listede olmalı. Eklediğinizden emin olun.',
             link: L.authSettings, linkText: 'Authorized domains' });

  /* --- 3. Firestore ve güvenlik kuralları -------------------------------- */
  if (!state.user) {
    out.push({ s: 'info', t: 'Firestore kuralları',
               d: 'Giriş yaptıktan sonra kontrol edilebilir.' });
    return out;
  }

  const S = fb.sdk.store;
  const fetchOne = (path) => {
    const q = S.query(S.collection(fb.db, ...path), S.limit(1));
    return (S.getDocsFromServer || S.getDocs)(q);
  };

  try {
    await fetchOne(['users', state.user.uid, 'habits']);
    out.push({ s: 'ok', t: 'Kendi verinize erişim', d: 'Okuma/yazma çalışıyor.' });
  } catch (e) {
    if (e?.code === 'permission-denied') {
      out.push({ s: 'fail', t: 'Kendi verinize erişim',
                 d: 'Firestore kuralları engelliyor. firestore.rules içeriğini yapıştırıp Publish deyin.',
                 link: L.rules, linkText: 'Firestore → Rules' });
    } else if (String(e?.code).includes('unavailable')) {
      out.push({ s: 'warn', t: 'Kendi verinize erişim', d: 'Sunucuya ulaşılamadı (çevrimdışı olabilirsiniz).' });
    } else {
      out.push({ s: 'fail', t: 'Kendi verinize erişim',
                 d: e?.message || String(e), link: L.rules, linkText: 'Firestore → Rules' });
    }
  }

  try {
    await fetchOne(['users', '__kurulum_testi__', 'habits']);
    out.push({ s: 'warn', t: 'Başkasının verisi kapalı mı?',
               d: 'DİKKAT: Kurallar fazla açık — başka bir hesabın klasörü okunabiliyor. ' +
                  'Muhtemelen "test mode" kuralları duruyor. firestore.rules içeriğiyle değiştirin.',
               link: L.rules, linkText: 'Firestore → Rules' });
  } catch (e) {
    if (e?.code === 'permission-denied') {
      out.push({ s: 'ok', t: 'Başkasının verisi kapalı mı?',
                 d: 'Evet — başka hesapların verisi size kapalı. Kurallar doğru.' });
    } else if (String(e?.code).includes('unavailable')) {
      out.push({ s: 'warn', t: 'Başkasının verisi kapalı mı?', d: 'Sunucuya ulaşılamadı.' });
    } else {
      out.push({ s: 'warn', t: 'Başkasının verisi kapalı mı?', d: e?.message || String(e) });
    }
  }

  return out;
}

function diagnosticsDialog() {
  const body = (rows, busy) => `
    <div class="modal-head"><h3>Kurulum kontrolü</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button></div>
    ${busy ? '<div class="stack center" style="padding:24px 0"><div class="spinner"></div>' +
             '<p class="small muted">Firebase kontrol ediliyor…</p></div>' : ''}
    <div class="panel ${busy ? 'hidden' : ''}">
      ${rows.map((r) => `
        <div class="list-row" style="align-items:flex-start">
          <span style="font-size:17px;line-height:1.3">${CHECK_ICON[r.s] || 'ℹ️'}</span>
          <div class="grow">
            <div class="h-name" style="font-size:14px">${esc(r.t)}</div>
            <div class="h-meta" style="display:block">${esc(r.d)}</div>
            ${r.link ? `<a class="small" href="${esc(r.link)}" target="_blank" rel="noopener"
                          style="display:inline-block;margin-top:6px">${esc(r.linkText || 'Konsolu aç')} ↗</a>` : ''}
          </div>
        </div>`).join('')}
    </div>
    ${busy ? '' : `<div class="modal-actions">
      <button class="btn btn-ghost" data-act="close-modal">Kapat</button>
      <button class="btn btn-primary" data-x="again">Tekrar kontrol et</button>
    </div>`}`;

  const wrap = openModal(body([], true), (m) => {
    m.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]')?.dataset.x === 'again') diagnosticsDialog();
    });
  });

  runDiagnostics()
    .then((rows) => {
      const m = $('.modal', wrap);
      if (!m) return;                       // kip bu arada kapatılmışsa
      m.innerHTML = body(rows, false);
    })
    .catch((err) => {
      const m = $('.modal', wrap);
      if (m) m.innerHTML = body([{ s: 'fail', t: 'Kontrol yapılamadı', d: err?.message || String(err) }], false);
    });
}

/* ------------------------------------------------- sürüm ve güncelleme -- */

/*  Hangi sürümün çalıştığını görebilmek için app.js dosyasının sunucudaki
    değiştirilme zamanını okuyoruz. Elle sürüm numarası tutmaktan daha güvenilir:
    yayınlanan dosya neyse tarih odur. HEAD isteği olduğu için service worker
    araya girmez, doğrudan ağa gider. */
async function loadBuildStamp() {
  try {
    const res = await fetch('./app.js', { method: 'HEAD', cache: 'no-store' });
    const lm = res.headers.get('last-modified');
    if (!lm || isNaN(new Date(lm))) return;
    state.buildAt = new Date(lm).toISOString();
    if (state.view === 'settings') render();
  } catch { /* çevrimdışıysa sürüm gösterilmez */ }
}

/*  Tarayıcı menülerine gitmeden zorla tazeleme. Eski bir service worker
    "önce önbellek" kuralıyla takılı kaldıysa tek dokunuşla çıkış yolu. */
async function forceUpdate() {
  toast('Güncelleme denetleniyor…');
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith('aliskanliklarim')).map((k) => caches.delete(k))
      );
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update().catch(() => {})));
    }
  } catch { /* yine de yeniliyoruz */ }
  setTimeout(() => location.reload(), 400);
}

/* ------------------------------------------------------------- kurulum -- */

async function doInstall() {
  const p = state.installPrompt;
  if (!p) return toast('Tarayıcı menüsünden "Uygulamayı yükle" seçeneğini kullanın.', 4000);
  state.installPrompt = null;
  p.prompt();
  const res = await p.userChoice.catch(() => null);
  if (res?.outcome === 'accepted') toast('Kuruldu 🎉');
  render();
}

/* ==========================================================================
   Başlangıç
   ========================================================================== */

function bindGlobal() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled) { handleAction(el.dataset.act, el); return; }
    const nav = e.target.closest('#navbar [data-view]');
    if (nav) go(nav.dataset.view);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Madde metni düzenleme (odak kaybında veya Enter'da tetiklenir)
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change="task-text"]');
    if (!el) return;
    const text = el.value.trim();
    const items = tasksFor(el.dataset.id)
      .map((it) => (it.id === el.dataset.tid ? { ...it, text } : it))
      .filter((it) => it.text);              // boşaltılan madde silinir
    writeTasks(el.dataset.id, items);
  });

  // Bağımsız liste maddesinin metnini düzenleme
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change="li-text"]');
    if (!el) return;
    const l = state.lists.find((x) => x.id === el.dataset.id);
    if (!l) return;
    const text = el.value.trim();
    writeListItems(l.id, (l.items || [])
      .map((it) => (it.id === el.dataset.tid ? { ...it, text } : it))
      .filter((it) => it.text));
  });

  // Yeni madde ekleme (hem alışkanlık listeleri hem bağımsız listeler)
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form.task-add');
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    if (form.dataset.lid) {
      const l = state.lists.find((x) => x.id === form.dataset.lid);
      if (!l) return;
      writeListItems(l.id, [...(l.items || []),
        { id: uid('i'), text, done: false, createdAt: new Date().toISOString() }]);
      // Art arda madde girmek yaygın; odak kutuda kalsın.
      $('#list-add-input')?.focus();
      return;
    }

    writeTasks(form.dataset.hid, [...tasksFor(form.dataset.hid),
                                  { id: uid('t'), text, done: false }]);
  });

  const onResize = () => detectDevice();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  const sync = () => { state.online = navigator.onLine; updateSyncBadge(); };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);

  window.matchMedia('(prefers-color-scheme: light)')
    .addEventListener?.('change', () => { if ((state.prefs.theme || 'system') === 'system') applyTheme(); });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    if (state.view === 'settings') render();
  });

  // Gece yarısını geçerse "bugün"ü tazele
  let lastDay = dateKey(today());
  setInterval(() => {
    const now = dateKey(today());
    if (now === lastDay) return;
    const wasOnLastToday = dateKey(state.date) === lastDay;
    lastDay = now;
    if (wasOnLastToday) state.date = today();
    invalidateIndex();
    render();
  }, 30000);
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  const hadController = !!navigator.serviceWorker.controller;
  const startedAt = Date.now();
  let handled = false;

  /*  Yeni bir service worker devri aldığında sayfa eski kodla kalmasın.
      Açılıştan hemen sonraysa kendiliğinden yenilenir; kullanıcı bir süredir
      uygulamanın içindeyse yenilemeyi ona bırakırız — bir kipi doldururken
      sayfanın ayağının altından çekilmesi iyi olmaz. */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || handled) return;      // ilk kurulumda yenilemeye gerek yok
    handled = true;
    if (Date.now() - startedAt < 10000) location.reload();
    else toast('Yeni sürüm hazır — sayfayı yenileyin.', 6000);
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => reg.update?.().catch(() => {}))
      .catch(() => {});
  });
}

/**
 * Yüklenen modüllerin sürümleri tutuyor mu?
 *
 * Tutmuyorsa karışık sürüm yüklenmiş demektir. Önbelleği temizleyip bir kez
 * yeniden yükleriz; ikinci kez aynı duruma düşersek döngüye girmemek için
 * kullanıcıya elle çıkış yolunu gösteririz.
 */
function buildMismatch() {
  const moduller = {
    'util.js': UtilNS.BUILD, 'data.js': DataNS.BUILD, 'plan.js': PlanNS.BUILD,
    'program.js': ProgramNS.BUILD, 'photo.js': PhotoNS.BUILD, 'foods.js': FoodsNS.BUILD,
  };
  return Object.entries(moduller).filter(([, v]) => v !== BUILD).map(([k]) => k);
}

const KURTARMA = 'habits.build.recovered';

async function guardBuild() {
  const eksik = buildMismatch();
  if (!eksik.length) return true;
  console.warn('Karışık sürüm yüklendi:', eksik.join(', '));

  let denendi = false;
  try { denendi = sessionStorage.getItem(KURTARMA) === '1'; } catch {}

  if (!denendi) {
    try { sessionStorage.setItem(KURTARMA, '1'); } catch {}
    $('#loading-text').textContent = 'Eksik güncelleme bulundu, yenileniyor…';
    await forceUpdate();
    return false;
  }

  /* Otomatik kurtarma tutmadı: kullanıcıya net bir çıkış bırak. */
  showScreen('screen-setup');
  $('#screen-setup').innerHTML = `
    <div class="brand"><h1>Güncelleme yarım kaldı</h1></div>
    <div class="panel" style="max-width:420px;margin:0 auto">
      <div class="list-row"><div class="grow small">
        Uygulamanın bazı dosyaları eski sürümde kaldı
        (${esc(eksik.join(', '))}). Bu genelde güncelleme sırasında bağlantının
        zayıflamasından olur. İnternete bağlan ve aşağıdaki düğmeye bas.
      </div></div>
      <div class="list-row">
        <button class="btn btn-primary btn-block" data-x="yenile">Şimdi yenile</button>
      </div>
    </div>`;
  $('#screen-setup').onclick = (e) => {
    if (e.target.closest('[data-x]')?.dataset.x !== 'yenile') return;
    try { sessionStorage.removeItem(KURTARMA); } catch {}
    forceUpdate();
  };
  return false;
}

async function boot() {
  detectDevice();
  if (!await guardBuild()) return;
  loadBuildStamp();
  applyTheme();
  bindGlobal();
  registerSW();

  if (getMode() === 'local') {
    await startLocal();
    return;
  }

  $('#loading-text').textContent = 'Bulut bağlantısı hazırlanıyor…';

  const { config, source } = await resolveConfig();
  if (!config) { renderSetup(); return; }
  state.configSource = source;

  try {
    state.fb = await initFirebase(config);
  } catch (err) {
    // Çevrimdışıyken kurulum sihirbazını göstermek yanıltıcı olur:
    // kurulumda bir sorun yok, sadece kütüphane indirilemedi.
    if (!navigator.onLine) { renderOffline(); return; }
    renderSetup('Firebase başlatılamadı: ' + (err?.message || err));
    return;
  }

  state.fb.sdk.auth.onAuthStateChanged(state.fb.auth, (user) => {
    if (user) {
      state.user = user;
      attachStore(new CloudStore(state.fb, user));
      maybeOfferMigration();
    } else {
      state.store?.stop();
      state.store = null;
      state.user = null;
      authTab = 'login';
      state.prefs = getPrefs();      // e-posta ön dolgusu için tazele
      closeModal();
      renderAuth();
    }
  });
}

boot().catch((err) => {
  console.error(err);
  renderSetup('Beklenmeyen bir hata oluştu: ' + (err?.message || err));
});
