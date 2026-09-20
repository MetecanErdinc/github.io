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

const BUILD = '2026-09-20b';

import {
  today, dateKey, parseKey, addDays, diffDays, gunEtiketi, kisaTarih, esc, sayi, yaz,
} from './util.js';

import {
  BASLIK, HEDEF, TOPLAM, OGUNLER, TAKVIYELER, CIG_PISMIS, ALISVERIS_GUNLUK,
  ALISVERIS_HAFTALIK, KURALLAR, YOL_HARITASI, YOL_NOT, LIF_NOTU, SU_NOTU,
  ANTRENMANLAR, HAFTA, ANTRENMAN_NOTU, ISINMA, ISINMA_NOTU, SOGUMA,
  ILK_IKI_HAFTA, CIFT_ILERLEME, ARTIS, ILERLEME_NOTU, DELOAD, FOOTER,
  GUNLUK_KCAL, gununAntrenmani, hareketAnahtari, setSayisi,
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
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Bugünün belgesi yoksa boş bir iskelet — okuyan taraf hep aynı şekli görsün. */
const BOS_GUN = { diet: {}, takviye: {}, wo: {}, su: 0, adim: 0, tarti: 0 };

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

/** O gün işaretlenen öğün satırlarının kalorisi. */
function yenenKcal(d = state.date) {
  const isaret = gun(d).diet;
  let sum = 0;
  for (const o of OGUNLER) {
    for (const s of o.satirlar) {
      if (isaret[`${o.key}.${s.key}`]) sum += s.kcal;
    }
  }
  return sum;
}

function viewDiyet() {
  const g = gun();
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
        <div class="ch-meta">${o.kcal} kcal · ${o.protein} g protein · ${yapilan}/${toplamSatir}</div>
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
          </div>
          <div class="r-kcal">${s.kcal}</div>
        </div>`;
      }).join('')}
      <div class="card-note">${esc(o.not)}</div>
    </section>`;
  };

  const sayacHtml = (etiket, ikon, alan, deger, hedefTik, altYazi) => `
    <section class="card">
      <div class="counter-row">
        <div class="grow">
          <div class="r-name">${ikon} ${esc(etiket)}</div>
          <div class="r-sub">${esc(altYazi)}</div>
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
      <div class="kcal-sub">Hedef ${HEDEF.kcal.toLocaleString('tr-TR')} ·
        yenen ${yenen.toLocaleString('tr-TR')} · planın tamamı ${GUNLUK_KCAL.toLocaleString('tr-TR')} kcal</div>
    </section>

    ${OGUNLER.map(ogunHtml).join('')}

    ${sayacHtml('Su', '💧', 'su', g.su, HEDEF.suTik, `Her tik 500 ml · hedef ${yaz(HEDEF.suL)} L`)}
    ${sayacHtml('Adım', '🚶', 'adim', g.adim, HEDEF.adimTik,
        `Her tik 1.000 adım · hedef ${HEDEF.adimMin / 1000}-${HEDEF.adimMax / 1000} bin`)}

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

      case 'say+': {
        const alan = b.dataset.alan;
        const tavan = alan === 'su' ? HEDEF.suTik : HEDEF.adimTik;
        return patch({ [alan]: Math.min(tavan, (g[alan] || 0) + 1) });
      }
      case 'say-': {
        const alan = b.dataset.alan;
        return patch({ [alan]: Math.max(0, (g[alan] || 0) - 1) });
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
      if (b.dataset.x === 'cikis') {
        closeModal();
        await state.fb?.sdk.auth.signOut(state.fb.auth);
        return;
      }
      closeModal();
    });
  });
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
  const m = { 'util.js': UtilNS.BUILD, 'plan.js': PlanNS.BUILD, 'store.js': StoreNS.BUILD };
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
