/* ==========================================================================
   Alışkanlıklarım — ana uygulama
   ========================================================================== */

import {
  DAY_SHORT, MONTHS, dateKey, parseKey, today, addDays, startOfWeek, diffDays, humanDate,
  dayLabel, isScheduled, targetOf, perWeekOf, scheduleLabel, streakInfo,
  completionRate, dayProgress, esc,
} from './util.js';

import {
  resolveConfig, isUsableConfig, storeConfig, clearStoredConfig, parseConfigText,
  getPrefs, setPrefs, getMode, setMode, initFirebase, authErrorMessage,
  CloudStore, LocalStore, WINDOW_DAYS,
} from './data.js';

/* ------------------------------------------------------------------ durum */

const state = {
  fb: null,
  user: null,
  store: null,
  habits: [],
  entries: new Map(),
  view: 'today',
  date: today(),
  prefs: getPrefs(),
  online: navigator.onLine,
  fromCache: false,
  installPrompt: null,
};

const COLORS = ['#4f8ef7', '#6c63ff', '#4fcf8e', '#f7b24f', '#f75f5f',
                '#ef6ec3', '#42c8d4', '#9b8cff', '#7ec24f', '#c98a5b'];

const EMOJIS = ['✅', '💪', '📚', '🏃', '💧', '🧘', '🥗', '😴', '🦷', '💊', '🚭', '✍️',
                '🎯', '🧹', '🌱', '🎸', '🧠', '☀️', '🙏', '💰', '📵', '🚶', '🏋️', '🎨'];

const VIEW_TITLES = { today: 'Bugün', habits: 'Alışkanlıklar', stats: 'İstatistik', settings: 'Ayarlar' };

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

/* ---------------------------------------------------------------- modal */

function openModal(html, bind) {
  closeModal();
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
        Bu adımı bir kez yapıp değerleri depodaki <code>habits/config.js</code> dosyasına yazarsanız
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
                 inputmode="email" placeholder="ornek@eposta.com" />
        </div>
        <div class="field">
          <label for="au-pass">Şifre</label>
          <input id="au-pass" class="input" type="password" required minlength="6"
                 autocomplete="${isLogin ? 'current-password' : 'new-password'}"
                 placeholder="En az 6 karakter" />
        </div>

        <div id="auth-err" class="error-box hidden"></div>
        ${msg ? `<div class="info-box">${esc(msg)}</div>` : ''}

        <button class="btn btn-primary btn-block" type="submit" id="auth-submit">
          ${isLogin ? 'Giriş yap' : 'Hesabı oluştur'}
        </button>
      </form>

      <div class="center mt">
        ${isLogin
          ? '<button class="btn btn-ghost btn-sm" data-x="reset">Şifremi unuttum</button>'
          : '<p class="tiny muted">Hesabı oluşturduğunuzda diğer cihazlarınızda aynı e-posta ve şifreyle girin.</p>'}
      </div>

      <div class="center" style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px">
        <button class="btn btn-ghost btn-sm" data-x="setup">Bulut ayarlarını değiştir</button>
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
    const btn = $('#auth-submit');

    if (!mail) return fail('E-posta adresi gerekli.');
    if (pass.length < 6) return fail('Şifre en az 6 karakter olmalı.');

    btn.disabled = true;
    btn.textContent = 'Lütfen bekleyin…';
    errBox.classList.add('hidden');

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
  invalidateIndex();

  store.start({
    habits: (list) => { state.habits = list; render(); },
    entries: (map)  => { state.entries = map; invalidateIndex(); render(); },
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
  const done = val >= target;
  const counter = target > 1;
  const color = h.color || COLORS[0];
  const st = streakInfo(h, valuesOf(h.id));

  const meta = [];
  if (st.current > 0) meta.push(`<span class="flame">🔥 ${st.current} ${st.unit}</span>`);
  meta.push(esc(scheduleLabel(h)));

  return `
  <div class="habit-card ${done ? 'done' : ''}" data-habit="${esc(h.id)}">
    <div class="h-emoji" style="background:${color}22;color:${color}">${esc(h.emoji || '✅')}</div>
    <div class="grow">
      <div class="h-name truncate">${esc(h.name)}</div>
      <div class="h-meta">${meta.join('<span class="muted">·</span>')}</div>
      ${counter ? `<div class="progress-line"><i style="width:${Math.min(100, (val / target) * 100)}%;background:${color}"></i></div>` : ''}
    </div>
    ${counter ? `
      <div class="counter">
        <button data-act="dec" data-id="${esc(h.id)}" aria-label="azalt">−</button>
        <span class="cval ${done ? 'full' : ''}">${val} / ${target}</span>
        <button data-act="inc" data-id="${esc(h.id)}" aria-label="artır">+</button>
      </div>`
    : `
      <button class="check-btn ${done ? 'on' : ''}" data-act="toggle" data-id="${esc(h.id)}"
              aria-label="${done ? 'geri al' : 'tamamlandı işaretle'}">✓</button>`}
  </div>`;
}

/* ==========================================================================
   Görünüm: Bugün
   ========================================================================== */

function viewToday() {
  const d = state.date;
  const list = activeHabits();
  const prog = dayProgress(list, state.entries, d);
  const isToday = diffDays(d, today()) === 0;
  const future = diffDays(d, today()) > 0;

  const scheduled = list.filter((h) => isScheduled(h, d));
  const other = list.filter((h) => !isScheduled(h, d));

  if (list.length === 0) {
    return `
      <div class="empty">
        <div class="big">🌱</div>
        <h3>Henüz alışkanlık yok</h3>
        <p class="small">Küçük başlayın: günde bir alışkanlık bile fark yaratır.</p>
        <button class="btn btn-primary mt" data-act="new-habit">İlk alışkanlığını ekle</button>
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
      ? `<div class="habit-list">${scheduled.map((h) => habitCardHtml(h, d)).join('')}</div>`
      : '<div class="empty"><div class="big">🎉</div><h3>Bugün planlı alışkanlık yok</h3><p class="small">Dinlenme günü.</p></div>'}

    ${other.length ? `
      <div class="section-title">Bugün planlı değil</div>
      <div class="habit-list" style="opacity:.72">${other.map((h) => habitCardHtml(h, d)).join('')}</div>` : ''}

    <button class="btn btn-ghost btn-block mt" data-act="new-habit">+ Yeni alışkanlık</button>`;
}

function weekStripHtml(d) {
  const start = startOfWeek(d, 1);
  const t = today();
  const cells = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    const p = dayProgress(activeHabits(), state.entries, day);
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
          ${targetOf(h) > 1 ? `<span class="muted">·</span>günde ${targetOf(h)}` : ''}
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

  return `
    <button class="btn btn-primary btn-block" data-act="new-habit">+ Yeni alışkanlık</button>

    ${list.length ? `
      <div class="section-title">Aktif (${list.length})</div>
      <div class="panel">${list.map((h, i) => rowHtml(h, i, list.length, false)).join('')}</div>`
    : `<div class="empty"><div class="big">📋</div><h3>Liste boş</h3>
         <p class="small">Yukarıdaki düğmeyle ilk alışkanlığınızı ekleyin.</p></div>`}

    ${archived.length ? `
      <div class="section-title">Arşiv (${archived.length})</div>
      <div class="panel" style="opacity:.75">${archived.map((h) => rowHtml(h, 0, 1, true)).join('')}</div>` : ''}`;
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
  const todayP = dayProgress(list, state.entries, t);

  // Bu haftanın ortalaması (bugüne kadar)
  const wStart = startOfWeek(t, 1);
  let wSum = 0, wDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(wStart, i);
    if (d > t) break;
    const p = dayProgress(list, state.entries, d);
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
    const p = dayProgress(list, state.entries, d);
    return p.total === 0 ? 0 : p.done / p.total;
  }, 'var(--accent)');

  const habitPanels = list.map((h) => {
    const vals = valuesOf(h.id);
    const st = streakInfo(h, vals);
    const r30 = completionRate(h, vals, 30);
    const color = h.color || COLORS[0];
    const target = targetOf(h);
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

    <div class="section-title">Uygulama olarak kur</div>
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
        <button class="btn btn-sm btn-ghost" data-act="reset-config">Değiştir</button>
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
  const isCounter = targetOf(h) > 1;

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
          <button type="button" class="chip" data-t="check" aria-pressed="${!isCounter}">Yaptım / yapmadım</button>
          <button type="button" class="chip" data-t="count" aria-pressed="${isCounter}">Sayaç</button>
        </div>
      </div>

      <div class="field ${isCounter ? '' : 'hidden'}" id="hb-target-wrap">
        <label for="hb-target">Günlük hedef (kaç kez?)</label>
        <input id="hb-target" class="input" type="number" min="2" max="99" inputmode="numeric"
               value="${isCounter ? targetOf(h) : 8}" />
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
        <label for="hb-note">Not <span class="muted">(isteğe bağlı)</span></label>
        <textarea id="hb-note" class="input" maxlength="200"
                  placeholder="Kendinize küçük bir hatırlatma">${esc(h.note || '')}</textarea>
      </div>

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

      const target = type === 'count'
        ? Math.max(2, Math.min(99, Number($('#hb-target', m).value) || 2))
        : 1;

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
        target,
        schedule,
        note: $('#hb-note', m).value.trim(),
        archived: !!h.archived,
      };
      if (isNew) payload.order = state.habits.length;

      try {
        await state.store.saveHabit(payload);
        closeModal();
        toast(isNew ? 'Alışkanlık eklendi 🎉' : 'Kaydedildi');
      } catch (err) {
        const box = $('#hb-err', m);
        box.textContent = 'Kaydedilemedi: ' + (err?.message || err);
        box.classList.remove('hidden');
      }
    });
  });
}

/* ==========================================================================
   Çizim
   ========================================================================== */

function render() {
  if (!state.store) return;
  const y = window.scrollY;

  const html = state.view === 'habits'   ? viewHabits()
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
  if (view === 'today') state.date = today();
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

    case 'install': return doInstall();

    case 'logout': return confirmDialog('Çıkış yapılsın mı?',
      'Verileriniz hesabınızda kalır; tekrar giriş yaptığınızda geri gelir.',
      'Çıkış yap', false).then((ok) => ok && state.fb.sdk.auth.signOut(state.fb.auth));

    case 'pass-reset': return sendPasswordReset();

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
  };
}

function exportDialog() {
  const json = JSON.stringify(buildBackup(), null, 2);
  const name = `aliskanliklarim-${dateKey(today())}.json`;

  openModal(`
    <div class="modal-head"><h3>Yedek al</h3>
      <button class="icon-btn" data-act="close-modal" aria-label="kapat">✕</button></div>
    <p class="small muted">${state.habits.length} alışkanlık, ${state.entries.size} kayıt.</p>
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
        await state.store.importData({ habits: data.habits, entries: data.entries || [] });
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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Yeni sürüm hazır — sayfayı yenileyin.', 5000);
          }
        });
      });
    }).catch(() => {});
  });
}

async function boot() {
  applyTheme();
  bindGlobal();
  registerSW();

  if (getMode() === 'local') {
    await startLocal();
    return;
  }

  $('#loading-text').textContent = 'Bulut bağlantısı hazırlanıyor…';

  const { config } = await resolveConfig();
  if (!config) { renderSetup(); return; }

  try {
    state.fb = await initFirebase(config);
  } catch (err) {
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
      closeModal();
      renderAuth();
    }
  });
}

boot().catch((err) => {
  console.error(err);
  renderSetup('Beklenmeyen bir hata oluştu: ' + (err?.message || err));
});
