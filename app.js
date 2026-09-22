/* ==========================================================================
   app.js — Diyet ve Spor
   --------------------------------------------------------------------------
   İki sekme var, başka da olmayacak: Diyet ve Spor. Program plan.js'te sabit
   duruyor; buranın işi onu güne bağlamak — neyi yedim, neyi kaldırdım.
   ========================================================================== */

/*  Karışık sürüm koruması. Service worker uygulama kodunu dosya dosya
    sunuyor; bağlantı zayıfken bazıları ağdan (yeni), bazıları önbellekten
    (eski) gelebiliyor. Her modül kendi damgasını taşır, açılışta karşılaştırılır.
    Damga AD ALANI ithaliyle okunur: eski bir dosyada bu dışa aktarım hiç yoktur
    ve adlı ithal bağlanma anında SyntaxError verip uygulamayı hiç açmazdı. */
import * as UtilNS from './util.js';
import * as PlanNS from './plan.js';
import * as StoreNS from './store.js';
import * as RaporNS from './rapor.js';

const BUILD = '2026-09-22c';

import {
  today, dateKey, parseKey, addDays, diffDays, gunEtiketi, kisaTarih, esc, sayi, yaz,
  haftaBasi, haftaEtiketi,
} from './util.js';

import { haftalikRapor, raporMetni } from './rapor.js';

import {
  BASLIK, HEDEF, TOPLAM, OGUNLER, TAKVIYELER, CIG_PISMIS, ALISVERIS_GUNLUK,
  ALISVERIS_HAFTALIK, KURALLAR, YOL_HARITASI, YOL_NOT, LIF_NOTU, SU_NOTU,
  ANTRENMANLAR, HAFTA, ANTRENMAN_NOTU, ISINMA, ISINMA_NOTU, SOGUMA,
  ILK_IKI_HAFTA, CIFT_ILERLEME, ARTIS, ILERLEME_NOTU, DELOAD, FOOTER,
  GUNLUK_KCAL, GUNLUK_MAKRO, ogunMakro, makroTopla,
  gununAntrenmani, hareketAnahtari, setSayisi,
  KARDIYO_TURLERI, KARDIYO_NOTU, kardiyoAdi, WATCH_NOTU,
} from './plan.js';

import {
  resolveConfig, initFirebase, authErrorMessage, getMode, setMode, getTema, setTema,
  CloudStore, LocalStore,
} from './store.js';

/* ------------------------------------------------------------------ durum */

const state = {
  fb: null,
  user: null,
  store: null,
  days: new Map(),           // 'YYYY-AA-GG' -> gün belgesi
  view: 'diyet',             // 'diyet' | 'spor'
  date: today(),
  woKey: null,               // Spor sekmesinde açık antrenman
  odak: null,                // çizimden sonra odaklanılacak set alanı
  acik: new Set(),           // açılmış referans bölümleri
  online: navigator.onLine,
  fromCache: false,
  config: null,
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Bugünün belgesi yoksa boş bir iskelet — okuyan taraf hep aynı şekli görsün. */
const BOS_GUN = { diet: {}, takviye: {}, wo: {}, ekstra: [], kardiyo: [],
                  watch: null, su: 0, adim: 0, tarti: 0 };

function gun(d = state.date) {
  return state.days.get(dateKey(d)) || BOS_GUN;
}

async function patch(p, d = state.date) {
  const dk = dateKey(d);

  /*  İyimser yazım: tik anında görünsün. Salonda ve mutfakta bağlantı çoğu
      zaman zayıf; sunucunun dönmesini beklemek uygulamayı kullanılmaz yapar. */
  const eski = state.days.get(dk) || { ...BOS_GUN, date: dk };
  const yeni = { ...eski, date: dk };
  for (const [k, v] of Object.entries(p)) {
    yeni[k] = (v && typeof v === 'object' && !Array.isArray(v))
      ? { ...(eski[k] || {}), ...v } : v;
  }
  state.days.set(dk, yeni);
  render();

  try {
    await state.store.patchDay(dk, p);
  } catch (err) {
    toast('Kaydedilemedi: ' + (err?.message || err), 5000);
  }
}

/* ---------------------------------------------------------------- bildirim */

let toastTimer = null;
function toast(msg, ms = 2600) {
  $$('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

/* ==========================================================================
   Diyet
   ========================================================================== */

/** "36 P · 3,6 K · 2,7 Y · 0,5 lif" — sıfır olan lif yazılmaz. */
function makroSatiri(x) {
  const p = [`${yaz(Math.round(x.p * 10) / 10)} P`,
             `${yaz(Math.round(x.k * 10) / 10)} K`,
             `${yaz(Math.round(x.y * 10) / 10)} Y`];
  if (x.lif) p.push(`${yaz(Math.round(x.lif * 10) / 10)} lif`);
  return p.join(' · ');
}

/** O gün işaretlenen öğün satırlarının makro toplamı. */
function yenenMakro(d = state.date) {
  const isaret = gun(d).diet;
  const satirlar = [];
  for (const o of OGUNLER) {
    for (const s of o.satirlar) {
      if (isaret[`${o.key}.${s.key}`]) satirlar.push(s);
    }
  }
  const t = makroTopla(satirlar);

  /*  Kaçamakların makroları da sayılır: gün içinde ne aldığını gösteren
      çubuk, planın dışında yenenleri saymazsa yanıltır. Kaçamakta lif
      sorulmuyor, o yüzden lif yalnızca plandan gelir. */
  const ek = ekstraToplam(ekstralar(d));
  return { kcal: t.kcal + ek.kcal, p: t.p + ek.p, k: t.k + ek.k, y: t.y + ek.y, lif: t.lif };
}

/** O gün işaretlenen öğün satırlarının kalorisi. */
function ogunKcal(d = state.date) {
  const isaret = gun(d).diet;
  let sum = 0;
  for (const o of OGUNLER) {
    for (const s of o.satirlar) {
      if (isaret[`${o.key}.${s.key}`]) sum += s.kcal;
    }
  }
  return sum;
}

/* ------------------------------------------------------------ Apple Watch */

/**
 * Telefondaki Kısayol otomasyonunun yazdığı günlük toplamlar.
 *
 * Uygulama bu alana yazmaz, yalnızca okur: yazan taraf Kısayol, Firestore'un
 * REST arayüzünden. Bu yüzden hiç gelmemiş olabilir ve her okuma buna hazır.
 */
function watchVerisi(d = state.date) {
  const w = gun(d).watch;
  return (w && (w.kcal || w.adim)) ? w : null;
}

/** Saatin adımının sayaç karşılığı — her tik 1.000 adım. */
function watchTik(w) {
  return w ? Math.min(HEDEF.adimTik, Math.round(w.adim / 1000)) : 0;
}

/**
 * Sayacın ekranda görünen değeri.
 *
 * Adım sayacı elle dokunulmadıysa saatten okunur; elle bir değer girildiği an
 * (g.adim > 0) o kazanır — otomatik veri kullanıcının kendi girdisini ezmemeli.
 */
function sayacDegeri(alan, g = gun()) {
  if (alan !== 'adim') return Number(g[alan]) || 0;
  return Number(g.adim) || watchTik(watchVerisi());
}

/* ------------------------------------------------------ kaçamak / ekstra */

/**
 * Plan dışı yenenler.
 *
 * Planı işaretlemek tek başına yetmiyor: asıl kilo aldıran şey listede
 * olmayan. Kaçamağı yazacak yer olmayınca insan ya hiç yazmıyor ya da
 * "bugün olmadı" deyip günü boş bırakıyor; ikisi de kaydı işe yaramaz
 * yapıyor. Kaloriyi ve varsa makroları buraya girip sayaca dahil ediyoruz.
 */
function ekstralar(d = state.date) {
  const x = gun(d).ekstra;
  return Array.isArray(x) ? x : [];
}

function ekstraToplam(liste) {
  return liste.reduce((t, x) => ({
    kcal: t.kcal + (Number(x.kcal) || 0),
    p: t.p + (Number(x.p) || 0),
    k: t.k + (Number(x.k) || 0),
    y: t.y + (Number(x.y) || 0),
  }), { kcal: 0, p: 0, k: 0, y: 0 });
}

function ekstraYaz(liste, d = state.date) {
  return patch({ ekstra: liste }, d);
}

const yeniId = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Öğün tikleri + kaçamaklar. Sayaç bu rakama göre düşer. */
function yenenKcal(d = state.date) {
  return ogunKcal(d) + ekstraToplam(ekstralar(d)).kcal;
}

/** " · 12 P · 40 K · 11 Y" — hiç makro girilmediyse boş döner. */
function makroYazi(t) {
  if (!t.p && !t.k && !t.y) return '';
  return ` · ${t.p} P · ${t.k} K · ${t.y} Y`;
}

/**
 * Kaçamak giriş penceresi.
 *
 * Kalori dışındaki alanlar isteğe bağlı: paketin arkasını okuyacak hâlde
 * olmayan biri en azından kaloriyi girsin, hiç girmemekten iyidir.
 */
function ekstraDialog(mevcut) {
  const x = mevcut || { ad: '', kcal: '', p: '', k: '', y: '' };
  const v = (n) => (n === '' || n === undefined || n === null || n === 0) ? '' : yaz(n);

  openModal(`
    <div class="modal-head"><h3>${mevcut ? 'Kaçamağı düzenle' : 'Kaçamak ekle'}</h3>
      <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button></div>

    <div class="stack">
      <label class="field"><span>Ne yedin</span>
        <input id="ex-ad" class="input" maxlength="60" placeholder="Pizza, 2 dilim"
               value="${esc(x.ad || '')}" /></label>

      <label class="field"><span>Kalori</span>
        <input id="ex-kcal" class="input" inputmode="decimal" placeholder="0"
               value="${v(x.kcal)}" /></label>

      <div class="makro-3">
        <label class="field"><span>Protein (g)</span>
          <input id="ex-p" class="input" inputmode="decimal" placeholder="—" value="${v(x.p)}" /></label>
        <label class="field"><span>Karb. (g)</span>
          <input id="ex-k" class="input" inputmode="decimal" placeholder="—" value="${v(x.k)}" /></label>
        <label class="field"><span>Yağ (g)</span>
          <input id="ex-y" class="input" inputmode="decimal" placeholder="—" value="${v(x.y)}" /></label>
      </div>

      <p class="tiny-note">Yalnızca kaloriyi bilsen de yeter, diğerleri boş kalabilir.</p>
    </div>

    <div class="modal-actions">
      <button class="btn ghost" data-x="kapat">Vazgeç</button>
      <button class="btn primary" data-x="kaydet">Kaydet</button>
    </div>`, (m) => {
    $('#ex-ad', m)?.focus();

    m.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('[data-x="kaydet"]', m).click(); }
    });

    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x !== 'kaydet') return closeModal();

      const kcal = Math.round(sayi($('#ex-kcal', m).value));
      if (kcal <= 0) { toast('Kaç kalori olduğunu yaz'); return; }
      if (kcal > 10000) { toast('Kalori 10.000\'den küçük olmalı'); return; }

      const kayit = {
        id: mevcut?.id || yeniId(),
        ad: $('#ex-ad', m).value.trim().slice(0, 60) || 'Kaçamak',
        kcal,
        p: Math.round(sayi($('#ex-p', m).value)),
        k: Math.round(sayi($('#ex-k', m).value)),
        y: Math.round(sayi($('#ex-y', m).value)),
      };

      const liste = ekstralar();
      const i = liste.findIndex((z) => z.id === kayit.id);
      if (i >= 0) liste[i] = kayit; else liste.push(kayit);

      closeModal();
      ekstraYaz(liste);
    });
  });
}

function viewDiyet() {
  const g = gun();
  const w = watchVerisi();
  const adimDeger = sayacDegeri('adim', g);
  const ek = ekstralar();
  const ekTop = ekstraToplam(ek);
  const makro = yenenMakro();
  const yenen = yenenKcal();
  const kalan = HEDEF.kcal - yenen;
  const asti = kalan < 0;
  const oran = Math.min(100, Math.round((yenen / HEDEF.kcal) * 100));
  const pazartesi = state.date.getDay() === 1;

  const ogunHtml = (o) => {
    const toplamSatir = o.satirlar.length;
    const yapilan = o.satirlar.filter((s) => g.diet[`${o.key}.${s.key}`]).length;
    return `
    <section class="card">
      <div class="card-head">
        <div class="ch-title">${o.emoji} ${esc(o.ad)}</div>
        <div class="ch-meta">${o.kcal} kcal · ${makroSatiri(ogunMakro(o))} · ${yapilan}/${toplamSatir}</div>
      </div>
      ${o.satirlar.map((s) => {
        const k = `${o.key}.${s.key}`;
        const on = !!g.diet[k];
        return `
        <div class="row ${on ? 'on' : ''}">
          <button class="tick ${on ? 'on' : ''}" data-act="diet" data-k="${esc(k)}"
                  aria-pressed="${on}" aria-label="${esc(s.ad)} işaretle">✓</button>
          <div class="grow">
            <div class="r-name">${esc(s.ad)}</div>
            <div class="r-sub"><b>${esc(s.gram)}</b>${s.not ? ` · ${esc(s.not)}` : ''}</div>
            <div class="r-makro">${makroSatiri(s)}</div>
          </div>
          <div class="r-kcal">${s.kcal}</div>
        </div>`;
      }).join('')}
      <div class="card-note">${esc(o.not)}</div>
    </section>`;
  };

  const sayacHtml = (etiket, ikon, alan, deger, hedefTik, altYazi, ek) => `
    <section class="card">
      <div class="counter-row">
        <div class="grow">
          <div class="r-name">${ikon} ${esc(etiket)}</div>
          <div class="r-sub">${esc(altYazi)}</div>
          ${ek || ''}
        </div>
        <div class="counter">
          <button data-act="say-" data-alan="${alan}" aria-label="azalt">−</button>
          <span class="cval ${deger >= hedefTik ? 'full' : ''}">${deger} / ${hedefTik}</span>
          <button data-act="say+" data-alan="${alan}" aria-label="artır">+</button>
        </div>
      </div>
    </section>`;

  return `
    <section class="kcal-head">
      <div class="kcal-big ${asti ? 'over' : ''}">${Math.abs(kalan).toLocaleString('tr-TR')}
        <span>kcal ${asti ? 'aşıldı' : 'kaldı'}</span></div>
      <div class="bar"><i style="width:${oran}%" class="${asti ? 'over' : ''}"></i></div>
      <div class="makro-bar">
        ${[['p', 'protein'], ['k', 'karb.'], ['y', 'yağ'], ['lif', 'lif']].map(([alan, ad]) => {
          const alinan = Math.round(makro[alan]);
          const hedefM = Math.round(GUNLUK_MAKRO[alan]);
          const oranM = hedefM ? Math.min(100, Math.round((alinan / hedefM) * 100)) : 0;
          return `
            <div class="mb">
              <div class="mb-say">${alinan}<span>/${hedefM} g</span></div>
              <div class="mb-cizgi"><i style="width:${oranM}%"></i></div>
              <div class="mb-ad">${ad}</div>
            </div>`;
        }).join('')}
      </div>

      <div class="kcal-sub">Hedef ${HEDEF.kcal.toLocaleString('tr-TR')} ·
        yenen ${yenen.toLocaleString('tr-TR')}${ekTop.kcal
          ? ` (öğün ${ogunKcal().toLocaleString('tr-TR')} + kaçamak ${ekTop.kcal.toLocaleString('tr-TR')})`
          : ''} · planın tamamı ${GUNLUK_KCAL.toLocaleString('tr-TR')} kcal</div>
    </section>

    ${OGUNLER.map(ogunHtml).join('')}

    <section class="card">
      <div class="card-head ekstra-head">
        <div class="ch-title">🍫 Kaçamak ve ekstralar</div>
        <div class="ch-meta">${ek.length
          ? `${ekTop.kcal.toLocaleString('tr-TR')} kcal${makroYazi(ekTop)}`
          : 'plan dışı ne yediysen'}</div>
      </div>

      ${ek.map((x) => `
        <div class="row">
          <div class="grow" data-act="ekstra-duzenle" data-id="${esc(x.id)}" style="cursor:pointer">
            <div class="r-name">${esc(x.ad || 'Kaçamak')}</div>
            <div class="r-sub">${(Number(x.p) || Number(x.k) || Number(x.y))
              ? `${Number(x.p) || 0} g P · ${Number(x.k) || 0} g K · ${Number(x.y) || 0} g Y`
              : 'besin değeri girilmedi'}</div>
          </div>
          <div class="r-kcal">${(Number(x.kcal) || 0).toLocaleString('tr-TR')}</div>
          <button class="set-del" data-act="ekstra-sil" data-id="${esc(x.id)}"
                  aria-label="${esc(x.ad || 'kaçamak')} sil">✕</button>
        </div>`).join('')}

      <button class="btn ghost btn-block" data-act="ekstra-ekle">＋ Kaçamak ekle</button>
      ${ek.length ? '' : `
        <div class="card-note">Planda olmayan her şey buraya: çayın şekeri, bir dilim
          pizza, kuruyemiş. Yazmadığın kalori, olmayan kalori değil.</div>`}
    </section>

    ${sayacHtml('Su', '💧', 'su', g.su, HEDEF.suTik, `Her tik 500 ml · hedef ${yaz(HEDEF.suL)} L`)}
    ${sayacHtml('Adım', '🚶', 'adim', adimDeger, HEDEF.adimTik,
        `Her tik 1.000 adım · hedef ${HEDEF.adimMin / 1000}-${HEDEF.adimMax / 1000} bin`,
        w && w.adim ? `<div class="watch-line">⌚ ${w.adim.toLocaleString('tr-TR')} adım${
          g.adim ? ' · sayacı elle değiştirdin' : ' · sayaç buradan doluyor'}</div>` : '')}

    <section class="card">
      <div class="card-head"><div class="ch-title">💊 Takviyeler</div></div>
      ${TAKVIYELER.map((t) => {
        const on = !!g.takviye[t.key];
        return `
        <div class="row ${on ? 'on' : ''}">
          <button class="tick ${on ? 'on' : ''}" data-act="takviye" data-k="${esc(t.key)}"
                  aria-pressed="${on}" aria-label="${esc(t.ad)} işaretle">✓</button>
          <div class="grow">
            <div class="r-name">${esc(t.ad)}</div>
            <div class="r-sub">${esc(t.ne)}</div>
            <div class="r-note">${esc(t.not)}</div>
          </div>
        </div>`;
      }).join('')}
    </section>

    <section class="card ${pazartesi ? 'accent' : ''}">
      <div class="counter-row">
        <div class="grow">
          <div class="r-name">⚖️ Sabah tartısı</div>
          <div class="r-sub">${pazartesi
            ? 'Bugün tartı günü — aç karnına, tuvalet sonrası, aynı tartıda.'
            : 'Tartı günü pazartesi. Yine de girmek istersen buraya yaz.'}</div>
        </div>
        <div class="num">
          <input class="input mini" inputmode="decimal" placeholder="kg"
                 value="${g.tarti ? yaz(g.tarti) : ''}"
                 data-change="tarti" aria-label="kilo" />
        </div>
      </div>
    </section>

    ${katlanir('toplam', '📊 Günlük besin değerleri', () => `
      <div class="pairs">
        ${TOPLAM.map(([k, v, t, kalin]) => `
          <div class="pair ${kalin ? 'thick' : ''}">
            <span>${esc(k)}</span><span class="v">${esc(v)} <em>${esc(t)}</em></span>
          </div>`).join('')}
      </div>
      <p class="tiny-note">Planın tamamı yendiğinde. Bugün işaretlediğin kadarı değil.</p>
      ${ekTop.kcal ? `
        <div class="pairs">
          <div class="pair head"><b>Bugünkü kaçamak</b><span class="v">bunun üstüne</span></div>
          <div class="pair"><span>Kalori</span>
            <span class="v">+${ekTop.kcal.toLocaleString('tr-TR')} kcal</span></div>
          <div class="pair"><span>Protein · karbonhidrat · yağ</span>
            <span class="v">+${ekTop.p} · +${ekTop.k} · +${ekTop.y} g</span></div>
        </div>` : ''}
      <p class="flag">${esc(LIF_NOTU)}</p>`)}

    ${katlanir('cig', '⚖️ Çiğ ↔ Pişmiş', () => `
      <div class="pairs">
        ${CIG_PISMIS.map(([k, v]) => `
          <div class="pair"><span>${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
      </div>
      <p class="flag">${esc(SU_NOTU)}</p>`)}

    ${katlanir('alisveris', '🛒 Alışveriş', () => `
      <div class="pairs">
        <div class="pair head"><b>Günlük</b><span class="v">çiğ ağırlık</span></div>
        ${ALISVERIS_GUNLUK.map(([k, v]) => `
          <div class="pair"><span>${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
      </div>
      <div class="pairs" style="margin-top:10px">
        <div class="pair head"><b>Haftalık</b><span class="v">7 gün</span></div>
        ${ALISVERIS_HAFTALIK.map(([k, v]) => `
          <div class="pair"><span>${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
      </div>`)}

    ${katlanir('kurallar', '📋 Kurallar', () => `
      <ol class="rules">${KURALLAR.map((k) => `<li>${esc(k)}</li>`).join('')}</ol>`)}

    ${katlanir('yol', '🗺️ Yol haritası', () => `
      <div class="pairs">
        ${YOL_HARITASI.map(([k, v], i) => `
          <div class="pair ${i === YOL_HARITASI.length - 1 ? 'head' : ''}">
            <span>${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
      </div>
      <p class="flag">${esc(YOL_NOT)}</p>`)}

    <p class="footer">${esc(FOOTER)}</p>`;
}

/* ==========================================================================
   Spor
   ========================================================================== */

/* ------------------------------------------------------------- kardiyo -- */

function kardiyolar(d = state.date) {
  const x = gun(d).kardiyo;
  return Array.isArray(x) ? x : [];
}

function kardiyoYaz(liste, d = state.date) {
  return patch({ kardiyo: liste }, d);
}

/** "32 dk · 5,5 km/s · %8" — girilmeyen alanlar yazılmaz. */
function kardiyoYazi(x) {
  const p = [`${Number(x.dk) || 0} dk`];
  if (Number(x.hiz)) p.push(`${yaz(x.hiz)} km/s`);
  if (Number(x.egim)) p.push(`%${yaz(x.egim)}`);
  return p.join(' · ');
}

function kardiyoDialog(mevcut) {
  const x = mevcut || { tur: 'bant', dk: '', hiz: '', egim: '' };
  const v = (n) => (!n ? '' : yaz(n));

  openModal(`
    <div class="modal-head"><h3>${mevcut ? 'Kardiyoyu düzenle' : 'Kardiyo ekle'}</h3>
      <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button></div>

    <div class="stack">
      <div class="field"><span>Ne yaptın</span>
        <div class="chips" id="kd-tur">
          ${KARDIYO_TURLERI.map(([k, ad]) => `
            <button type="button" class="chip" data-v="${k}"
                    aria-pressed="${k === x.tur}">${esc(ad)}</button>`).join('')}
        </div>
      </div>

      <label class="field"><span>Süre (dakika)</span>
        <input id="kd-dk" class="input" inputmode="numeric" placeholder="30"
               value="${v(x.dk)}" /></label>

      <div class="makro-3" style="grid-template-columns:1fr 1fr">
        <label class="field"><span>Hız (km/s)</span>
          <input id="kd-hiz" class="input" inputmode="decimal" placeholder="—" value="${v(x.hiz)}" /></label>
        <label class="field"><span>Eğim (%)</span>
          <input id="kd-egim" class="input" inputmode="decimal" placeholder="—" value="${v(x.egim)}" /></label>
      </div>

      <p class="tiny-note">Hız ve eğim isteğe bağlı — bisiklette ya da elipstikte
        boş bırakabilirsin. Zorunlu olan tek alan süre.</p>
    </div>

    <div class="modal-actions">
      <button class="btn ghost" data-x="kapat">Vazgeç</button>
      <button class="btn primary" data-x="kaydet">Kaydet</button>
    </div>`, (m) => {
    $('#kd-dk', m)?.focus();

    $('#kd-tur', m).addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      $$('[data-v]', $('#kd-tur', m)).forEach((z) => z.setAttribute('aria-pressed', String(z === b)));
    });

    m.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); $('[data-x="kaydet"]', m).click(); }
    });

    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x !== 'kaydet') return closeModal();

      const dk = Math.round(sayi($('#kd-dk', m).value));
      if (dk <= 0) { toast('Kaç dakika yaptığını yaz'); return; }
      if (dk > 300) { toast('Süre 300 dakikadan kısa olmalı'); return; }

      const hiz = sayi($('#kd-hiz', m).value);
      const egim = sayi($('#kd-egim', m).value);
      if (hiz < 0 || hiz > 30) { toast('Hız 0-30 km/s arasında olmalı'); return; }
      if (egim < 0 || egim > 30) { toast('Eğim 0-30 arasında olmalı'); return; }

      const kayit = {
        id: mevcut?.id || yeniId(),
        tur: $('#kd-tur [aria-pressed="true"]', m)?.dataset.v || 'bant',
        dk, hiz, egim,
      };

      const liste = kardiyolar();
      const i = liste.findIndex((z) => z.id === kayit.id);
      if (i >= 0) liste[i] = kayit; else liste.push(kayit);

      closeModal();
      kardiyoYaz(liste);
    });
  });
}

/**
 * Bir hareketin en son girilen ağırlığı — bugünden geriye doğru ilk kayıt.
 *
 * Geçen seferki rakamın hareketin yanında yazması şart: çift ilerleme kuralı
 * ancak "geçen hafta ne kaldırdım" bilinirse işler, salonda kimse defter
 * karıştırmaz.
 */
function sonKayit(hKey, oncesi = state.date) {
  const sinir = dateKey(oncesi);
  const gunler = [...state.days.entries()]
    .filter(([dk]) => dk < sinir)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1));

  for (const [dk, g] of gunler) {
    const setler = setleriOku(g.wo?.[hKey]);
    if (setler.length) return { dk, setler };
  }
  return null;
}

/**
 * Bir hareketin o günkü setleri.
 *
 * Tek set tutan ilk biçim ({kg, rep}) de okunur: kayıt anahtarı aynı kaldığı
 * için eski günlerin verisi olduğu yerde duruyor, onu da göstermek gerekiyor.
 * Yeni yazımlar hep `setler` dizisine gider.
 */
function setleriOku(kayit) {
  if (Array.isArray(kayit?.setler)) {
    return kayit.setler
      .map((x) => ({ kg: Number(x?.kg) || 0, rep: Number(x?.rep) || 0 }))
      .filter((x) => x.kg || x.rep);
  }
  const kg = Number(kayit?.kg) || 0;
  const rep = Number(kayit?.rep) || 0;
  return (kg || rep) ? [{ kg, rep }] : [];
}

/** Bir setin okunur hâli: "50 × 10", kilosuz girildiyse "10 tekrar". */
function setYazi(x) {
  if (!x.kg) return `${x.rep} tekrar`;
  return `${yaz(x.kg)}${x.rep ? ` × ${x.rep}` : ' kg'}`;
}

/*  Kaydın tamamı yazılır, parçası değil: yerel depo ile bulut deposunun iç içe
    birleştirme davranışı aynı kalsın diye. */
function setleriYaz(k, setler, ok) {
  return patch({ wo: { [k]: { ok: !!ok, setler } } });
}

/**
 * Bir set satırının bir alanını yazar.
 *
 * Son satır her zaman boştur ve dizide karşılığı yoktur; oraya bir değer
 * girilince dizinin sonuna yeni set eklenir, böylece altında bir boş satır
 * daha açılır. İki alanı da boşaltılan satır listeden düşer — yanlış girilen
 * seti silmenin en kısa yolu.
 */
function satirYaz(k, i, alan, ham) {
  const kayit = gun().wo[k] || {};
  const setler = setleriOku(kayit);

  const v = alan === 'kg' ? sayi(ham) : Math.round(sayi(ham));
  if (alan === 'kg' && (v < 0 || v > 500)) { toast('Ağırlık 0-500 kg arasında olmalı'); return; }
  if (alan === 'rep' && (v < 0 || v > 100)) { toast('Tekrar 0-100 arasında olmalı'); return; }

  if (i < setler.length) {
    setler[i] = { ...setler[i], [alan]: v };
    if (!setler[i].kg && !setler[i].rep) setler.splice(i, 1);
  } else if (v > 0) {
    setler.push({ kg: 0, rep: 0, [alan]: v });
  } else {
    return;                            // boş satırda boş değer: yazacak bir şey yok
  }

  setleriYaz(k, setler, kayit.ok);
}

function viewSpor() {
  const g = gun();
  const bugunku = gununAntrenmani(state.date);
  const secili = ANTRENMANLAR.find((a) => a.key === state.woKey)
              || bugunku || ANTRENMANLAR[0];

  const hafta = `
    <div class="week">
      ${HAFTA.map((h) => {
        const a = ANTRENMANLAR.find((x) => x.gunNo === h.gunNo);
        const bugun = h.gunNo === state.date.getDay();
        return `
        <button class="day ${a ? 'train' : ''} ${bugun ? 'now' : ''}"
                ${a ? `data-act="wo-day" data-k="${a.key}"` : 'disabled'}>
          <span class="d">${h.kisa}</span>
          <span class="m">${h.ikon}</span>
          <span class="e">${esc(h.etiket)}</span>
        </button>`;
      }).join('')}
    </div>`;

  const yapilan = secili.hareketler.filter((h) => g.wo[hareketAnahtari(secili.key, h.key)]?.ok).length;
  const kardiyo = kardiyolar();
  const kardiyoDk = kardiyo.reduce((t, x) => t + (Number(x.dk) || 0), 0);
  const w = watchVerisi();

  const hareketHtml = (h) => {
    const k = hareketAnahtari(secili.key, h.key);
    const kayit = g.wo[k] || {};
    const on = !!kayit.ok;
    const setler = setleriOku(kayit);
    const hedefSet = setSayisi(h.set);
    const son = sonKayit(k);

    /*  Listenin sonunda her zaman boş bir satır durur: bir set girilir
        girilmez altında bir sonraki için yer açılmış olur, "set ekle"
        düğmesine basmaya gerek kalmaz. */
    const satir = (i, deger) => {
      const bos = !deger;
      return `
      <div class="set-row ${bos ? 'bos' : ''}">
        <span class="sn">${i + 1}</span>
        <input class="input" inputmode="decimal" placeholder="kg"
               value="${deger && deger.kg ? yaz(deger.kg) : ''}"
               data-set="1" data-k="${esc(k)}" data-i="${i}" data-f="kg"
               aria-label="${esc(h.ad)} ${i + 1}. set ağırlık" />
        <span class="x">×</span>
        <input class="input" inputmode="numeric" placeholder="tekrar"
               value="${deger && deger.rep ? esc(String(deger.rep)) : ''}"
               data-set="1" data-k="${esc(k)}" data-i="${i}" data-f="rep"
               aria-label="${esc(h.ad)} ${i + 1}. set tekrar" />
        ${bos
          ? '<span class="set-del-yer"></span>'
          : `<button class="set-del" data-act="set-del" data-k="${esc(k)}" data-i="${i}"
                     aria-label="${i + 1}. seti sil">✕</button>`}
      </div>`;
    };

    return `
    <div class="ex ${on ? 'on' : ''}">
      <div class="ex-top">
        <div class="grow">
          <div class="r-name">${esc(h.ad)}</div>
          <div class="r-sub"><b>${esc(h.set)}</b> · ${esc(h.dk)} dinlenme</div>
        </div>
        <div class="set-say ${hedefSet && setler.length >= hedefSet ? 'full' : ''}">
          ${setler.length}${hedefSet ? ` / ${hedefSet}` : ''} <span>set</span>
        </div>
      </div>

      <div class="sets">
        ${setler.map((x, i) => satir(i, x)).join('')}
        ${satir(setler.length, null)}
      </div>

      <button class="all-done ${on ? 'on' : ''}" data-act="wo-ok" data-k="${esc(k)}"
              aria-pressed="${on}">
        <span class="box">${on ? '✓' : ''}</span>
        <span>Tüm setleri yaptım</span>
      </button>

      <div class="last">${son
        ? `geçen (${esc(kisaTarih(parseKey(son.dk)))}) — ${
            son.setler.map((x) => esc(setYazi(x))).join(' · ')}`
        : '<span class="muted">bu harekette ilk kaydın</span>'}</div>

      ${h.alt ? `<div class="ex-note alt">${esc(h.alt)}</div>` : ''}
      ${h.form ? `<div class="ex-note">${esc(h.form)}</div>` : ''}
    </div>`;
  };

  return `
    ${hafta}

    ${bugunku
      ? ''
      : `<p class="flag">Bugün antrenman günü değil — ${state.date.getDay() === 3
          ? 'yürüyüş günü, 8-10 bin adımı tamamla.' : 'dinlenme günü.'}
         İstersen yukarıdan bir gün seçip yine de çalışabilirsin.</p>`}

    <section class="card wo">
      <div class="card-head wo-head">
        <div class="ch-title">🏋️ ${esc(secili.ad)}</div>
        <div class="ch-meta">${esc(secili.gunAd)} · ${esc(secili.meta)} ·
          ${yapilan}/${secili.hareketler.length}</div>
      </div>
      ${secili.hareketler.map(hareketHtml).join('')}
    </section>

    ${w ? `
      <section class="card">
        <div class="card-head watch-head">
          <div class="ch-title">⌚ Apple Watch</div>
          <div class="ch-meta">${w.guncel ? `${esc(saatDk(w.guncel))} güncellendi` : 'bugün'}</div>
        </div>
        <div class="watch-grid">
          <div><b>${w.kcal ? w.kcal.toLocaleString('tr-TR') : '—'}</b><span>aktif kcal</span></div>
          <div><b>${w.adim ? w.adim.toLocaleString('tr-TR') : '—'}</b><span>adım</span></div>
        </div>
        <div class="card-note">${esc(WATCH_NOTU)}</div>
      </section>` : ''}

    <section class="card">
      <div class="card-head kardiyo-head">
        <div class="ch-title">🏃 Kardiyo</div>
        <div class="ch-meta">${kardiyo.length
          ? `${kardiyoDk} dk · ${kardiyo.length} kayıt`
          : 'bugün kardiyo yok'}</div>
      </div>

      ${kardiyo.map((x) => `
        <div class="row">
          <div class="grow" data-act="kardiyo-duzenle" data-id="${esc(x.id)}" style="cursor:pointer">
            <div class="r-name">${esc(kardiyoAdi(x.tur))}</div>
            <div class="r-sub">${esc(kardiyoYazi(x))}</div>
          </div>
          <button class="set-del" data-act="kardiyo-sil" data-id="${esc(x.id)}"
                  aria-label="${esc(kardiyoAdi(x.tur))} sil">✕</button>
        </div>`).join('')}

      <button class="btn ghost btn-block" data-act="kardiyo-ekle">＋ Kardiyo ekle</button>
      ${kardiyo.length ? '' : `<div class="card-note">${esc(KARDIYO_NOTU)}</div>`}
    </section>

    <p class="flag">${esc(ANTRENMAN_NOTU)}</p>

    ${katlanir('isinma', '🔥 Isınma — 8-10 dk', () => `
      <ol class="steps">${ISINMA.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
      <p class="flag">${esc(ISINMA_NOTU)}</p>`)}

    ${katlanir('soguma', '🧊 Soğuma — 5 dk', () => `
      <ol class="steps">${SOGUMA.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`)}

    ${katlanir('ilerleme', '📈 İlerleme', () => `
      <div class="box">
        <h3>${esc(ILK_IKI_HAFTA.baslik)}</h3>
        <p>${esc(ILK_IKI_HAFTA.giris)}</p>
        <ol class="steps">${ILK_IKI_HAFTA.adimlar.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>
        <p>${esc(ILK_IKI_HAFTA.kapanis)}</p>
      </div>
      <div class="box">
        <h3>Çift ilerleme kuralı</h3>
        <p>${esc(CIFT_ILERLEME)}</p>
      </div>
      <div class="pairs">
        ${ARTIS.map(([k, v]) => `
          <div class="pair"><span>${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}
      </div>
      <p class="flag">${esc(ILERLEME_NOTU)}</p>`)}

    ${katlanir('deload', '🪫 Deload', () => `<p class="box-p">${esc(DELOAD)}</p>`)}`;
}

/* ------------------------------------------------------ açılır bölümler -- */

/** Referans metinleri katlanır tutulur: ekran her gün lazım olanla açılsın. */
function katlanir(key, baslik, icerik) {
  const acik = state.acik.has(key);
  return `
    <section class="fold ${acik ? 'open' : ''}">
      <button class="fold-head" data-act="fold" data-k="${esc(key)}" aria-expanded="${acik}">
        <span>${esc(baslik)}</span><span class="caret">${acik ? '▴' : '▾'}</span>
      </button>
      ${acik ? `<div class="fold-body">${icerik()}</div>` : ''}
    </section>`;
}

/* ==========================================================================
   Çizim
   ========================================================================== */

let bekleyenCizim = false;
let cizimPlanli = false;
let zorlaCizim = false;

/**
 * Çizim isteği. Asıl iş bir sonraki kareye bırakılır.
 *
 * Erteleme şart: yazı alanları odak DEĞİŞİRKEN `change` üretiyor ve o an
 * document.activeElement henüz yeni alan değil, gövde. Hemen çizersek
 * kullanıcının dokunmak üzere olduğu alanı DOM'dan söküp atıyoruz —
 * dokunuş boşa gidiyor, yazdığı sayı kayboluyor. Bir kare sonra odak
 * yerine oturmuş oluyor ve aşağıdaki koruma doğru kararı verebiliyor.
 * Yan fayda: arka arkaya gelen yazımlar tek çizimde toplanıyor.
 */
function render(zorla) {
  if (!state.store) return;
  if (zorla) { zorlaCizim = true; bekleyenCizim = false; }
  if (cizimPlanli) return;
  cizimPlanli = true;
  requestAnimationFrame(() => { cizimPlanli = false; cizim(); });
}

function cizim() {
  if (!state.store) return;

  const zorla = zorlaCizim;
  zorlaCizim = false;

  /*  Kullanıcı bir alana yazarken yeniden çizmek yazdığını siler: senkron
      anlık ve başka cihazdan da gelebiliyor. Odak bir girişteyse çizim
      odak kaybına ertelenir — Enter'la yeni set satırı açmak gibi, çizimin
      kendisi istenen sonuç olduğunda hariç. */
  const odak = document.activeElement;
  if (!zorla && odak && odak.tagName === 'INPUT' && odak.closest('#view')) {
    if (!bekleyenCizim) {
      bekleyenCizim = true;
      odak.addEventListener('focusout', () => { bekleyenCizim = false; render(); }, { once: true });
    }
    return;
  }

  const y = window.scrollY;
  $('#view').innerHTML = state.view === 'diyet' ? viewDiyet() : viewSpor();
  $('#day-label').textContent = gunEtiketi(state.date);
  $('#day-sub').textContent = state.view === 'diyet'
    ? `${yenenKcal()} / ${HEDEF.kcal} kcal`
    : (gununAntrenmani(state.date)?.ad || 'antrenman yok');

  $$('.navbar [data-view]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.view === state.view));
  });
  $('#go-today').hidden = diffDays(state.date, today()) === 0;

  window.scrollTo(0, y);
  odakYerlestir();
  senkronRozeti();
}

/** Çizim DOM'u baştan kurduğu için odak elle geri konur (Enter'dan sonra). */
function odakYerlestir() {
  const o = state.odak;
  state.odak = null;
  if (!o) return;

  const el = $(`[data-set][data-k="${o.k}"][data-i="${o.i}"][data-f="${o.f}"]`);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.select?.();
  el.scrollIntoView({ block: 'nearest' });
}

function senkronRozeti() {
  const el = $('#sync');
  if (!el) return;
  const yerel = state.store?.mode === 'local';
  el.textContent = yerel ? 'yalnız bu cihaz' : (state.online ? '' : 'çevrimdışı');
  el.className = 'sync' + (yerel ? ' warn' : (state.online ? ' ok' : ' warn'));
}

function showScreen(id) {
  ['screen-loading', 'screen-auth', 'screen-app'].forEach((s) => {
    $('#' + s).classList.toggle('hidden', s !== id);
  });
}

/* ==========================================================================
   Olaylar
   ========================================================================== */

function bindApp() {
  $('#screen-app').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act], [data-view]');
    if (!b) return;

    if (b.dataset.view) {
      state.view = b.dataset.view;
      window.scrollTo(0, 0);
      return render();
    }

    const k = b.dataset.k;
    const g = gun();

    switch (b.dataset.act) {
      case 'diet':
        return patch({ diet: { [k]: !g.diet[k] } });

      case 'takviye':
        return patch({ takviye: { [k]: !g.takviye[k] } });

      /*  Artış ekranda YAZAN değerden devam eder. Adım sayacı saatten dolmuş
          olabiliyor; ham alanı temel alsaydık 9'u gören kullanıcı +'ya basınca
          1'e düşerdi. Sıfıra kadar azaltmak sayacı saate geri bırakır. */
      case 'say+': {
        const alan = b.dataset.alan;
        const tavan = alan === 'su' ? HEDEF.suTik : HEDEF.adimTik;
        return patch({ [alan]: Math.min(tavan, sayacDegeri(alan, g) + 1) });
      }
      case 'say-': {
        const alan = b.dataset.alan;
        return patch({ [alan]: Math.max(0, sayacDegeri(alan, g) - 1) });
      }

      case 'wo-day':
        state.woKey = k;
        return render();

      case 'wo-ok': {
        const eski = g.wo[k] || {};
        return setleriYaz(k, setleriOku(eski), !eski.ok);
      }

      case 'set-del': {
        const eski = g.wo[k] || {};
        const setler = setleriOku(eski);
        setler.splice(Number(b.dataset.i), 1);
        return setleriYaz(k, setler, eski.ok);
      }

      case 'kardiyo-ekle':
        return kardiyoDialog(null);

      case 'kardiyo-duzenle':
        return kardiyoDialog(kardiyolar().find((x) => x.id === b.dataset.id) || null);

      case 'kardiyo-sil':
        return kardiyoYaz(kardiyolar().filter((x) => x.id !== b.dataset.id));

      case 'ekstra-ekle':
        return ekstraDialog(null);

      case 'ekstra-duzenle':
        return ekstraDialog(ekstralar().find((x) => x.id === b.dataset.id) || null);

      case 'ekstra-sil':
        return ekstraYaz(ekstralar().filter((x) => x.id !== b.dataset.id));

      case 'fold':
        if (state.acik.has(k)) state.acik.delete(k); else state.acik.add(k);
        return render();

      case 'prev-day': state.date = addDays(state.date, -1); return render();
      case 'next-day': state.date = addDays(state.date, 1);  return render();
      case 'go-today': state.date = today(); state.woKey = null; return render();

      case 'menu': return menuAc();
      default:
    }
  });

  /*  Sayı alanları hem yazarken (gecikmeli) hem de alandan çıkarken yazılır.
      Yalnızca `change`e güvenmek kırılgan: kullanıcı kiloyu yazıp doğrudan
      tike basarsa alan odak kaybıyla birlikte yeniden çizimde sökülebiliyor
      ve bekleyen `change` hiç ateşlenmiyordu. Yazarken kaydedince kaybedilecek
      bir değer kalmıyor. */
  let yazmaTimer = null;
  const kaydet = (el) => {
    if (el.dataset.set) return satirYaz(el.dataset.k, Number(el.dataset.i), el.dataset.f, el.value);

    if (el.dataset.change === 'tarti') {
      const v = sayi(el.value);
      if (v && (v < 30 || v > 400)) { toast('Kilo 30-400 arasında olmalı'); return; }
      return patch({ tarti: v });
    }
  };

  const alan = (e) => e.target.closest?.('[data-set], [data-change]');

  $('#screen-app').addEventListener('input', (e) => {
    const el = alan(e);
    if (!el) return;
    clearTimeout(yazmaTimer);
    yazmaTimer = setTimeout(() => { yazmaTimer = null; kaydet(el); }, 400);
  });

  $('#screen-app').addEventListener('change', (e) => {
    const el = alan(e);
    if (!el) return;
    clearTimeout(yazmaTimer);
    yazmaTimer = null;
    kaydet(el);
  });

  /*  Odak alandan çıkarken bekleyen gecikmeli yazımı hemen boşalt — kullanıcı
      yazdıktan 100 ms sonra tike basarsa değeri beklemeden kaydetmiş olalım. */
  $('#screen-app').addEventListener('focusout', (e) => {
    const el = alan(e);
    if (!el || !yazmaTimer) return;
    clearTimeout(yazmaTimer);
    yazmaTimer = null;
    kaydet(el);
  });

  /*  Enter: kilodan tekrara, tekrardan bir alttaki setin kilosuna geçer.
      Böylece "50 enter 10 enter" ile set set ilerlenebiliyor, aradaki her
      dokunuşu ekranda aramak gerekmiyor. */
  $('#screen-app').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const el = e.target.closest?.('[data-set]');
    if (!el) return;
    e.preventDefault();

    clearTimeout(yazmaTimer);
    yazmaTimer = null;
    kaydet(el);

    const i = Number(el.dataset.i);
    state.odak = el.dataset.f === 'kg'
      ? { k: el.dataset.k, i, f: 'rep' }
      : { k: el.dataset.k, i: i + 1, f: 'kg' };

    /*  Odak bir alanın içindeyken çizim normalde erteleniyor; burada yeni
        satırın görünmesi işin kendisi, o yüzden zorlanıyor. */
    render(true);
  });

  window.addEventListener('online',  () => { state.online = true;  senkronRozeti(); });
  window.addEventListener('offline', () => { state.online = false; senkronRozeti(); });
}

/* ------------------------------------------------------------------ menü */

function menuAc() {
  const tema = getTema();
  const yerel = state.store?.mode === 'local';

  openModal(`
    <div class="modal-head"><h3>Ayarlar</h3>
      <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button></div>

    <div class="pairs">
      <div class="pair"><span>Hesap</span>
        <span class="v">${yerel ? 'yalnız bu cihaz' : esc(state.user?.email || '')}</span></div>
      <div class="pair"><span>Sürüm</span><span class="v">${esc(BUILD)}</span></div>
    </div>

    <div class="seg" style="margin-top:14px">
      ${[['auto', 'Sistem'], ['light', 'Açık'], ['dark', 'Koyu']].map(([v, l]) => `
        <button data-tema="${v}" aria-pressed="${tema === v}">${l}</button>`).join('')}
    </div>

    <button class="btn primary btn-wide" data-x="rapor" style="margin-top:14px">
      📈 Haftalık rapor
    </button>
    <button class="btn btn-wide" data-x="watch" style="margin-top:8px">
      ⌚ Apple Watch bağlantısı
    </button>

    <div class="modal-actions">
      ${yerel ? '' : '<button class="btn ghost" data-x="cikis">Çıkış yap</button>'}
      <button class="btn" data-x="kapat">Kapat</button>
    </div>`, (m) => {
    m.addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tema]');
      if (t) {
        setTema(t.dataset.tema);
        temaUygula();
        $$('[data-tema]', m).forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
        return;
      }
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x === 'rapor') { closeModal(); return raporAc(haftaBasi(state.date)); }
      if (b.dataset.x === 'watch') { closeModal(); return watchDialog(); }
      if (b.dataset.x === 'cikis') {
        closeModal();
        await state.fb?.sdk.auth.signOut(state.fb.auth);
        return;
      }
      closeModal();
    });
  });
}

/* ==========================================================================
   Apple Watch bağlantısı
   ========================================================================== */

/**
 * Kısayol otomasyonunun ihtiyaç duyduğu değerler.
 *
 * Sağlık verisine yalnızca cihaza kurulu uygulamalar erişebiliyor; bir web
 * sayfası Ana Ekrana eklenmiş olsa da erişemiyor. Bu yüzden veriyi telefondaki
 * Kısayol taşıyor: Firebase'in REST arayüzünden bu hesapla giriş yapıp günün
 * belgesine yazıyor. Yeni bir sunucu, yeni bir güvenlik kuralı ya da ücretli
 * plan gerekmiyor — mevcut kural (kendi users/<uid> klasörün) yeterli.
 */
function watchDialog() {
  const cfg = state.config;
  const uid = state.user?.uid;

  if (!cfg || !uid) {
    openModal(`
      <div class="modal-head"><h3>⌚ Apple Watch bağlantısı</h3>
        <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button></div>
      <p class="tiny-note">Bu bağlantı hesapla girilen modda çalışıyor. Şu an
        hesapsız moddasın; veriyi taşıyacak Kısayol'un yazacağı bir hesap yok.</p>
      <div class="modal-actions"><button class="btn" data-x="kapat">Kapat</button></div>`,
    (m) => m.addEventListener('click', (e) => { if (e.target.closest('[data-x]')) closeModal(); }));
    return;
  }

  const girisUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`;
  const girisGovde = `{"email":"${state.user.email}","password":"ŞİFREN","returnSecureToken":true}`;
  const yazUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}`
    + `/databases/(default)/documents/users/${uid}/days/`;
  const yazKuyruk = '?updateMask.fieldPaths=watch&updateMask.fieldPaths=date';
  const yazGovde = '{"fields":{"date":{"stringValue":"TARIH"},"watch":{"mapValue":{"fields":{'
    + '"kcal":{"doubleValue":KALORI},"adim":{"doubleValue":ADIM},'
    + '"guncel":{"stringValue":"ZAMAN"}}}}}}';

  const satir = (baslik, deger, aciklama) => `
    <div class="kopya">
      <div class="kopya-ust">
        <span>${esc(baslik)}</span>
        <button class="chip" data-kopya="${esc(deger)}">kopyala</button>
      </div>
      <code>${esc(deger)}</code>
      ${aciklama ? `<p class="tiny-note">${aciklama}</p>` : ''}
    </div>`;

  openModal(`
    <div class="modal-head"><h3>⌚ Apple Watch bağlantısı</h3>
      <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button></div>

    <p class="tiny-note">Sağlık verisine yalnızca cihaza kurulu uygulamalar
      erişebiliyor, web sayfaları erişemiyor. Bu yüzden veriyi telefonundaki
      <b>Kısayollar</b> uygulaması taşıyor: günde bir çalışıp aktif kaloriyi ve
      adımı buraya yazıyor. Tıkla tıkla kurulum <b>APPLE-WATCH.md</b> dosyasında;
      aşağıdakiler o kurulumun senin hesabına ait değerleri.</p>

    <div class="section-h" style="margin-top:12px">1 · Giriş isteği</div>
    ${satir('URL (POST)', girisUrl)}
    ${satir('Gövde', girisGovde, 'ŞİFREN yazan yere kendi şifreni yaz. '
      + 'Bu metin yalnızca senin telefonundaki Kısayol\'un içinde durur.')}

    <div class="section-h" style="margin-top:12px">2 · Yazma isteği</div>
    ${satir('URL (PATCH) — sonuna tarih eklenecek', yazUrl + 'TARIH' + yazKuyruk,
      'TARIH yerine Kısayol\'daki <b>yyyy-MM-dd</b> biçimli tarih gelecek.')}
    ${satir('Gövde', yazGovde,
      'KALORI, ADIM ve ZAMAN yerine Kısayol değişkenleri gelecek.')}

    <p class="tiny-note" style="margin-top:12px">Kısayol senin hesabınla giriş
      yapıp yalnızca kendi klasörüne yazıyor; mevcut güvenlik kuralları aynen
      geçerli. Yeni bir sunucu ya da ücretli plan gerekmiyor.</p>

    <div class="modal-actions"><button class="btn" data-x="kapat">Kapat</button></div>`,
  (m) => {
    m.addEventListener('click', async (e) => {
      const k = e.target.closest('[data-kopya]');
      if (k) {
        try { await navigator.clipboard.writeText(k.dataset.kopya); toast('Kopyalandı'); }
        catch { toast('Kopyalanamadı — metni seçip elle kopyala', 4000); }
        return;
      }
      if (e.target.closest('[data-x]')) closeModal();
    });
  });
}

/* ==========================================================================
   Haftalık rapor
   ========================================================================== */

/**
 * Haftanın raporu.
 *
 * Yorumlar rapor.js'te kural olarak duruyor; uygulama çevrimdışıyken de,
 * hiçbir servise bağlanmadan da aynı raporu üretiyor. "Kopyala" düğmesi ham
 * rakamlarla birlikte düz metni panoya alır — daha derin bir okuma için
 * birine göndermek üzere.
 */
function raporAc(bas) {
  const r = haftalikRapor(state.days, bas);
  const buHafta = dateKey(bas) === dateKey(haftaBasi(today()));

  const ikon = { iyi: '✅', uyari: '⚠️', kotu: '⛔' };

  const gunSatiri = (g) => `
    <div class="pair ${g.toplam ? '' : 'sonuk'}">
      <span>${esc(g.gunAd)}</span>
      <span class="v">${g.toplam
        ? `${g.toplam.toLocaleString('tr-TR')} kcal${g.ekstraKcal ? ` <em>+${g.ekstraKcal} kaçamak</em>` : ''}`
        : '<em>kayıt yok</em>'}${g.tarti ? ` <em>· ${yaz(g.tarti)} kg</em>` : ''}</span>
    </div>`;

  const hareketSatiri = (h) => `
    <div class="pair">
      <span>${esc(h.ad)}<br><em class="mini">${esc(h.gun)}</em></span>
      <span class="v ${h.durum === 'arttı' ? 'iyi' : h.durum === 'düştü' ? 'kotu' : ''}">
        ${esc(setSetYazi(h.bu))}
        <em>${h.gecen ? `geçen ${esc(setSetYazi(h.gecen))}` : 'ilk hafta'}</em>
      </span>
    </div>`;

  openModal(`
    <div class="modal-head">
      <button class="icon-btn" data-x="onceki" aria-label="önceki hafta">‹</button>
      <h3 style="text-align:center">📈 ${esc(r.etiket)}
        <span class="mini">${r.bitti ? 'hafta bitti' : 'hafta sürüyor'}</span></h3>
      <button class="icon-btn" data-x="sonraki" aria-label="sonraki hafta"
              ${buHafta ? 'disabled style="opacity:.3"' : ''}>›</button>
      <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button>
    </div>

    <div class="rapor">
      <div class="rapor-ozet">
        <div><b>${r.diyet.ortKcal.toLocaleString('tr-TR')}</b><span>ort. kcal/gün</span></div>
        <div><b>${r.antrenman.yapilan}/${r.antrenman.hedef}</b>
          <span>antrenman · ${r.antrenman.toplamSet}/${r.antrenman.hedefSet} set</span></div>
        <div><b>${r.tarti.degisim === null ? '—' : `${r.tarti.degisim > 0 ? '+' : ''}${yaz(r.tarti.degisim)}`}</b><span>kg değişim</span></div>
      </div>

      <div class="section-h">Değerlendirme</div>
      <div class="yorumlar">
        ${r.yorumlar.map((v) => `
          <div class="yorum ${esc(v.tip)}"><span>${ikon[v.tip]}</span><p>${esc(v.metin)}</p></div>`).join('')}
      </div>

      <div class="section-h">Gün gün</div>
      <div class="pairs">${r.gunlukler.map(gunSatiri).join('')}</div>

      <div class="section-h">Diyet</div>
      <div class="pairs">
        <div class="pair"><span>Kayıt girilen gün</span><span class="v">${r.diyet.yazilanGun} / 7</span></div>
        <div class="pair"><span>Plan tutturma</span><span class="v">%${r.diyet.tutma}</span></div>
        <div class="pair"><span>Protein</span>
          <span class="v">${r.diyet.ortProtein} g <em>/ ${r.diyet.planProtein}</em></span></div>
        <div class="pair"><span>Karbonhidrat · yağ · lif</span>
          <span class="v">${r.diyet.ortKarb} · ${r.diyet.ortYag} · ${r.diyet.ortLif} g
            <em>/ ${r.diyet.planKarb} · ${r.diyet.planYag} · ${r.diyet.planLif}</em></span></div>
        <div class="pair"><span>Kaçamak</span>
          <span class="v">${r.diyet.ekstraKcal.toLocaleString('tr-TR')} kcal <em>${r.diyet.ekstraAdet} adet</em></span></div>
        <div class="pair"><span>Su · adım</span>
          <span class="v">${yaz(r.diyet.ortSu)} tik · ${yaz(r.diyet.ortAdim)} bin</span></div>
        <div class="pair"><span>Takviye</span><span class="v">%${r.diyet.takviyeOran}</span></div>
      </div>

      <div class="section-h">Antrenman</div>
      <div class="pairs">
        ${r.antrenman.gunler.map((g) => `
          <div class="pair ${g.yapildi ? '' : 'sonuk'}">
            <span>${esc(g.ad)}</span>
            <span class="v">${g.yapildi
              ? `${g.setAdet} / ${g.hedefSet} set <em>${esc(g.gunAd)}</em>`
              : '<em>yapılmadı</em>'}</span>
          </div>`).join('')}
      </div>

      ${r.watch.gun ? `
        <div class="section-h">Apple Watch</div>
        <div class="pairs">
          <div class="pair"><span>Ortalama aktif kalori</span>
            <span class="v">${r.watch.ortKcal.toLocaleString('tr-TR')} kcal
              <em>${r.watch.gun} günde</em></span></div>
          <div class="pair"><span>Ortalama adım</span>
            <span class="v">${r.watch.ortAdim.toLocaleString('tr-TR')}</span></div>
        </div>
        <p class="tiny-note">Bu kalori günlük hedefe eklenmiyor.</p>` : ''}

      ${r.kardiyo.toplamDk ? `
        <div class="section-h">Kardiyo</div>
        <div class="pairs">
          <div class="pair"><span>Toplam</span>
            <span class="v">${r.kardiyo.toplamDk} dk
              <em>${r.kardiyo.gun} günde ${r.kardiyo.seans} seans${r.kardiyo.oncekiDk
                ? ` · geçen hafta ${r.kardiyo.oncekiDk} dk` : ''}</em></span></div>
          ${r.kardiyo.kayitlar.map((x) => `
            <div class="pair"><span>${esc(x.gunAd)}<br><em class="mini">${esc(kardiyoAdi(x.tur))}</em></span>
              <span class="v">${Number(x.dk) || 0} dk
                <em>${Number(x.hiz) ? `${yaz(x.hiz)} km/s` : ''}${
                  Number(x.hiz) && Number(x.egim) ? ' · ' : ''}${
                  Number(x.egim) ? `%${yaz(x.egim)}` : ''}</em></span></div>`).join('')}
        </div>` : ''}

      ${r.antrenman.hareketler.length ? `
        <div class="section-h">En iyi setler</div>
        <div class="pairs">${r.antrenman.hareketler.map(hareketSatiri).join('')}</div>` : ''}

      <p class="tiny-note">Kalori ve makro ortalamaları yalnızca yemek kaydı
        girilen günlerden; su ve adım ise herhangi bir kaydı olan günlerden
        alınıyor.</p>
    </div>

    <div class="modal-actions">
      <button class="btn ghost" data-x="kopyala">Kopyala</button>
      <button class="btn" data-x="kapat">Kapat</button>
    </div>`, (m) => {
    m.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-x]');
      if (!b || b.disabled) return;

      if (b.dataset.x === 'onceki') return raporAc(addDays(bas, -7));
      if (b.dataset.x === 'sonraki') return raporAc(addDays(bas, 7));

      if (b.dataset.x === 'kopyala') {
        const metin = raporMetni(r);
        try {
          await navigator.clipboard.writeText(metin);
          toast('Rapor kopyalandı');
        } catch {
          /*  Pano izni yoksa (iOS'ta kullanıcı hareketi dışında çağrılırsa
              oluyor) metni seçilebilir hâlde göster — kopyalamak yine mümkün. */
          openModal(`
            <div class="modal-head"><h3>Raporu kopyala</h3>
              <button class="icon-btn" data-x="kapat" aria-label="kapat">✕</button></div>
            <p class="tiny-note">Pano izni alınamadı. Aşağıdaki metni seçip kopyala.</p>
            <textarea class="input" rows="14" readonly
                      style="font-family:var(--mono);font-size:12px">${esc(metin)}</textarea>
            <div class="modal-actions"><button class="btn" data-x="kapat">Kapat</button></div>`,
          (m2) => {
            $('textarea', m2).select();
            m2.addEventListener('click', (e2) => {
              if (e2.target.closest('[data-x="kapat"]')) closeModal();
            });
          });
        }
        return;
      }
      closeModal();
    });
  });
}

/** ISO zaman damgasından "18:04" — bozuksa boş döner. */
function saatDk(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** Rapordaki set gösterimi: "62,5 kg × 8" */
function setSetYazi(x) {
  if (!x) return '—';
  return x.kg ? `${yaz(x.kg)} kg${x.rep ? ` × ${x.rep}` : ''}` : `${x.rep} tekrar`;
}

/* ----------------------------------------------------------------- kip -- */

function openModal(html, bind) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.className = 'backdrop';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) closeModal(); });
  $('#modal-root').appendChild(wrap);
  document.body.style.overflow = 'hidden';
  bind?.($('.modal', wrap));
}

function closeModal() {
  $('#modal-root').innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ==========================================================================
   Giriş ekranı
   ========================================================================== */

function renderAuth(hata) {
  showScreen('screen-auth');
  $('#screen-auth').innerHTML = `
    <div class="auth">
      <div class="brand">
        <img src="./icons/icon-192.png" alt="" />
        <h1>${esc(BASLIK)}</h1>
        <p class="muted">Diyet ve antrenman takibi. Telefon ve bilgisayar arasında senkron.</p>
      </div>

      ${hata ? `<div class="error">${esc(hata)}</div>` : ''}

      <form id="auth-form" class="stack">
        <label class="field"><span>E-posta</span>
          <input id="au-mail" class="input" type="email" autocomplete="email" required /></label>
        <label class="field"><span>Şifre</span>
          <input id="au-pass" class="input" type="password" autocomplete="current-password"
                 minlength="6" required /></label>
        <button class="btn primary" type="submit" id="au-submit">Giriş yap</button>
      </form>

      <div class="auth-alt">
        <button class="btn ghost" id="au-signup">Hesap oluştur</button>
        <button class="btn ghost" id="au-local">Hesapsız dene (yalnız bu cihaz)</button>
      </div>
    </div>`;

  let kayit = false;
  const form = $('#auth-form');

  $('#au-signup').onclick = () => {
    kayit = !kayit;
    $('#au-submit').textContent = kayit ? 'Hesap oluştur' : 'Giriş yap';
    $('#au-signup').textContent = kayit ? 'Zaten hesabım var' : 'Hesap oluştur';
    $('#au-pass').autocomplete = kayit ? 'new-password' : 'current-password';
  };

  $('#au-local').onclick = () => { setMode('local'); startLocal(); };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const mail = $('#au-mail').value.trim();
    const pass = $('#au-pass').value;
    const btn = $('#au-submit');
    btn.disabled = true;
    btn.textContent = 'Bekle…';
    try {
      const A = state.fb.sdk.auth;
      if (kayit) await A.createUserWithEmailAndPassword(state.fb.auth, mail, pass);
      else await A.signInWithEmailAndPassword(state.fb.auth, mail, pass);
    } catch (err) {
      renderAuth(authErrorMessage(err));
    }
  };
}

/* ==========================================================================
   Başlatma
   ========================================================================== */

function temaUygula() {
  const t = getTema();
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

function baglaStore(store) {
  state.store?.stop?.();
  state.store = store;
  state.days = new Map();
  state.view = 'diyet';
  state.date = today();
  state.woKey = null;

  store.start({
    days: (map) => { state.days = map; render(); },
    status: (s) => { state.fromCache = !!s.fromCache; senkronRozeti(); },
    error: (err) => {
      console.error(err);
      toast(String(err?.code) === 'permission-denied'
        ? 'Firestore kuralları verilerine izin vermiyor.'
        : 'Veriler alınamadı: ' + (err?.message || err), 5000);
    },
  });

  showScreen('screen-app');
  render();
}

function startLocal() { baglaStore(new LocalStore()); }

/** Modüllerden biri eski sürümde kaldıysa uygulamayı açmadan önce tazele. */
function surumUyusmazligi() {
  const m = {
    'util.js': UtilNS.BUILD, 'plan.js': PlanNS.BUILD,
    'store.js': StoreNS.BUILD, 'rapor.js': RaporNS.BUILD,
  };
  return Object.entries(m).filter(([, v]) => v !== BUILD).map(([k]) => k);
}

const KURTARMA = 'diyet.build.recovered';

async function guardBuild() {
  const eksik = surumUyusmazligi();
  if (!eksik.length) return true;
  console.warn('Karışık sürüm:', eksik.join(', '));

  let denendi = false;
  try { denendi = sessionStorage.getItem(KURTARMA) === '1'; } catch {}
  if (denendi) return true;          // bir kez denedik, kilitlenmektense çalış

  try { sessionStorage.setItem(KURTARMA, '1'); } catch {}
  $('#loading-text').textContent = 'Güncelleme tamamlanıyor…';
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = await caches?.keys?.() || [];
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
  location.reload();
  return false;
}

async function boot() {
  temaUygula();
  bindApp();
  if (!await guardBuild()) return;

  try { sessionStorage.removeItem(KURTARMA); } catch {}

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  if (getMode() === 'local') { startLocal(); return; }

  const config = await resolveConfig();
  if (!config) {
    renderAuth('Firebase yapılandırması bulunamadı (config.js). '
             + 'Hesapsız modda devam edebilirsin.');
    return;
  }

  state.config = config;

  try {
    state.fb = await initFirebase(config);
  } catch (err) {
    renderAuth(err?.message || 'Firebase başlatılamadı.');
    return;
  }

  state.fb.sdk.auth.onAuthStateChanged(state.fb.auth, (user) => {
    if (user) {
      state.user = user;
      setMode('cloud');
      baglaStore(new CloudStore(state.fb, user.uid));
    } else {
      state.user = null;
      state.store?.stop?.();
      state.store = null;
      renderAuth();
    }
  });
}

boot();
