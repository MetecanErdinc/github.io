/* ==========================================================================
   rapor.js — haftalık rapor
   --------------------------------------------------------------------------
   Girilen işaretlerden haftanın tablosunu çıkarır ve üstüne yorum yazar.
   Rakamı göstermek yetmiyor: "ortalama 2340 kcal" kendi başına bir bilgi
   değil, hedefin 340 üstünde olduğunu ve bunun haftada ~0,3 kg eksik kayıp
   demek olduğunu söylemek bilgi.

   Yorumlar kural tabanlı ve burada duruyor — uygulama çevrimdışıyken de,
   hiçbir servise bağlanmadan da aynı raporu üretiyor.
   ========================================================================== */

export const BUILD = '2026-09-21b';

import { dateKey, addDays, haftaBasi, haftaEtiketi, yaz, GUN_ADI } from './util.js';
import { HEDEF, OGUNLER, TAKVIYELER, ANTRENMANLAR, setSayisi, hareketAnahtari } from './plan.js';

/** 1 kg yağ ≈ 7700 kcal. Kalori farkını kiloya çevirirken kullanılır. */
const KG_KCAL = 7700;

const say = (n) => Math.round(Number(n) || 0);

/* ------------------------------------------------------------ ham veriler */

function haftaninGunleri(days, bas) {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = addDays(bas, i);
    const dk = dateKey(d);
    return { d, dk, g: days.get(dk) || null };
  });
}

/** Bir günde işaretlenen öğün satırlarının kalorisi ve yaklaşık proteini. */
function ogunToplami(g) {
  let kcal = 0;
  let protein = 0;
  for (const o of OGUNLER) {
    let oKcal = 0;
    for (const s of o.satirlar) {
      if (g?.diet?.[`${o.key}.${s.key}`]) oKcal += s.kcal;
    }
    kcal += oKcal;
    /*  Protein satır bazında değil öğün bazında biliniyor; yenen kalorinin
        öğün içindeki payıyla orantılanıyor. Yaklaşık olduğu raporda yazıyor —
        satır başına protein uydurmaktansa yöntemi söylemek doğru. */
    if (oKcal) protein += (o.protein * oKcal) / o.kcal;
  }
  return { kcal, protein };
}

function ekstraToplami(g) {
  const liste = Array.isArray(g?.ekstra) ? g.ekstra : [];
  return liste.reduce((t, x) => ({
    kcal: t.kcal + (Number(x.kcal) || 0),
    p: t.p + (Number(x.p) || 0),
    adet: t.adet + 1,
  }), { kcal: 0, p: 0, adet: 0 });
}

/** Bir hareketin o haftaki en iyi seti: önce ağırlık, eşitse tekrar. */
function haftaninEnIyisi(gunler, hKey) {
  let en = null;
  for (const { g } of gunler) {
    const kayit = g?.wo?.[hKey];
    const setler = Array.isArray(kayit?.setler)
      ? kayit.setler
      : (Number(kayit?.kg) || Number(kayit?.rep) ? [{ kg: kayit.kg, rep: kayit.rep }] : []);
    for (const s of setler) {
      const kg = Number(s?.kg) || 0;
      const rep = Number(s?.rep) || 0;
      if (!kg && !rep) continue;
      if (!en || kg > en.kg || (kg === en.kg && rep > en.rep)) en = { kg, rep };
    }
  }
  return en;
}

const setYazi = (s) => (s ? (s.kg ? `${yaz(s.kg)} kg × ${s.rep || '?'}` : `${s.rep} tekrar`) : '—');

/* ------------------------------------------------------------------ rapor */

export function haftalikRapor(days, tarih) {
  const bas = haftaBasi(tarih);
  const gunler = haftaninGunleri(days, bas);
  const oncekiBas = addDays(bas, -7);
  const onceki = haftaninGunleri(days, oncekiBas);

  /* ---------------------------------------------------------------- diyet */

  const gunlukler = gunler.map(({ d, dk, g }) => {
    const o = ogunToplami(g);
    const e = ekstraToplami(g);
    return {
      d, dk, gunAd: GUN_ADI[d.getDay()],
      ogunKcal: o.kcal, protein: o.protein,
      ekstraKcal: e.kcal, ekstraAdet: e.adet, ekstraP: e.p,
      toplam: o.kcal + e.kcal,
      su: Number(g?.su) || 0,
      adim: Number(g?.adim) || 0,
      tarti: Number(g?.tarti) || 0,
      takviye: TAKVIYELER.filter((t) => g?.takviye?.[t.key]).length,
      dolu: !!g,
    };
  });

  /*  Ortalama YALNIZCA kayıt girilen günlerden alınır. Boş günü sıfır saymak
      "ortalama 900 kcal" gibi, kimsenin işine yaramayan bir rakam üretirdi. */
  const yazilan = gunlukler.filter((x) => x.toplam > 0);
  const ort = (f) => (yazilan.length ? yazilan.reduce((s, x) => s + f(x), 0) / yazilan.length : 0);

  const planKcal = OGUNLER.reduce((s, o) => s + o.kcal, 0);
  const planProtein = OGUNLER.reduce((s, o) => s + o.protein, 0);

  const diyet = {
    yazilanGun: yazilan.length,
    ortKcal: say(ort((x) => x.toplam)),
    ortOgunKcal: say(ort((x) => x.ogunKcal)),
    ortProtein: say(ort((x) => x.protein + x.ekstraP)),
    hedefKcal: HEDEF.kcal,
    planProtein: say(planProtein),
    tutma: planKcal ? Math.round((ort((x) => x.ogunKcal) / planKcal) * 100) : 0,
    ekstraKcal: say(gunlukler.reduce((s, x) => s + x.ekstraKcal, 0)),
    ekstraAdet: gunlukler.reduce((s, x) => s + x.ekstraAdet, 0),
    ekstraGun: gunlukler.filter((x) => x.ekstraKcal > 0).length,
    ortSu: Math.round(ort((x) => x.su) * 10) / 10,
    ortAdim: Math.round(ort((x) => x.adim) * 10) / 10,
    takviyeOran: yazilan.length
      ? Math.round((gunlukler.reduce((s, x) => s + x.takviye, 0) / (yazilan.length * TAKVIYELER.length)) * 100)
      : 0,
  };

  /* ----------------------------------------------------------- antrenman */

  const antrenmanlar = ANTRENMANLAR.map((a) => {
    let setAdet = 0;
    let tamam = 0;
    let gunAd = null;

    for (const { d, g } of gunler) {
      for (const h of a.hareketler) {
        const kayit = g?.wo?.[hareketAnahtari(a.key, h.key)];
        if (!kayit) continue;
        const n = Array.isArray(kayit.setler) ? kayit.setler.length
                : (Number(kayit.kg) || Number(kayit.rep) ? 1 : 0);
        if (n) { setAdet += n; gunAd = gunAd || GUN_ADI[d.getDay()]; }
        if (kayit.ok) tamam++;
      }
    }
    return {
      key: a.key, ad: a.ad, gunAd,
      setAdet, tamam, hareketSayisi: a.hareketler.length,
      hedefSet: a.hareketler.reduce((s, h) => s + setSayisi(h.set), 0),
      yapildi: setAdet > 0,
    };
  });

  const hareketler = [];
  for (const a of ANTRENMANLAR) {
    for (const h of a.hareketler) {
      const k = hareketAnahtari(a.key, h.key);
      const bu = haftaninEnIyisi(gunler, k);
      if (!bu) continue;
      const gecen = haftaninEnIyisi(onceki, k);

      let durum = 'yeni';
      if (gecen) {
        if (bu.kg > gecen.kg || (bu.kg === gecen.kg && bu.rep > gecen.rep)) durum = 'arttı';
        else if (bu.kg < gecen.kg || (bu.kg === gecen.kg && bu.rep < gecen.rep)) durum = 'düştü';
        else durum = 'aynı';
      }
      hareketler.push({ ad: h.ad, gun: a.ad, bu, gecen, durum });
    }
  }

  const antrenman = {
    yapilan: antrenmanlar.filter((x) => x.yapildi).length,
    hedef: ANTRENMANLAR.length,
    gunler: antrenmanlar,
    toplamSet: antrenmanlar.reduce((s, x) => s + x.setAdet, 0),
    hedefSet: antrenmanlar.reduce((s, x) => s + x.hedefSet, 0),
    hareketler,
  };

  /* --------------------------------------------------------------- tartı */

  const tartilar = gunlukler.filter((x) => x.tarti > 0).map((x) => ({ gunAd: x.gunAd, kg: x.tarti }));
  const oncekiTarti = onceki.map(({ g }) => Number(g?.tarti) || 0).filter(Boolean);

  const tarti = {
    kayitlar: tartilar,
    ilk: tartilar[0]?.kg || 0,
    son: tartilar[tartilar.length - 1]?.kg || 0,
    oncekiSon: oncekiTarti[oncekiTarti.length - 1] || 0,
  };
  /*  Haftalık değişim, geçen haftanın SON tartısıyla bu haftanınki arasından
      okunur. Aynı hafta içindeki iki tartının farkı su ve bağırsak
      oynamasıdır, kilo değil. */
  tarti.degisim = (tarti.son && tarti.oncekiSon) ? Math.round((tarti.son - tarti.oncekiSon) * 10) / 10 : null;

  const rapor = {
    bas, etiket: haftaEtiketi(bas),
    gunlukler, diyet, antrenman, tarti,
    bitti: dateKey(addDays(bas, 6)) < dateKey(new Date()),
  };
  rapor.yorumlar = yorumla(rapor, days, bas);
  return rapor;
}

/* ---------------------------------------------------------------- yorumlar */

function yorumla(r, days, bas) {
  const y = [];
  const ekle = (tip, metin) => y.push({ tip, metin });

  const { diyet: d, antrenman: a, tarti: t } = r;

  if (!d.yazilanGun) {
    ekle('kotu', 'Bu hafta hiç kayıt girilmemiş. Rapor çıkaracak veri yok — '
      + 'diyetlerin çoğu yanlış diyetten değil, yanlış ölçümden başarısız olur.');
    return y;
  }

  if (d.yazilanGun < 5) {
    ekle('uyari', `7 günün ${d.yazilanGun}'inde kayıt var. Geri kalan günler hesaba `
      + 'girmiyor, yani aşağıdaki ortalamalar iyimser. Yazılmayan kalori, olmayan kalori değil.');
  }

  /* --- kalori */
  const fark = d.ortKcal - d.hedefKcal;
  const haftalikKg = Math.round((Math.abs(fark) * 7 / KG_KCAL) * 100) / 100;

  if (fark > 100) {
    ekle('kotu', `Ortalama ${d.ortKcal.toLocaleString('tr-TR')} kcal — hedefin `
      + `${fark} üstünde. Bu, haftada yaklaşık ${yaz(haftalikKg)} kg eksik kayıp demek.`);
  } else if (fark < -350) {
    ekle('uyari', `Ortalama ${d.ortKcal.toLocaleString('tr-TR')} kcal — hedefin `
      + `${Math.abs(fark)} altında. Açığı büyütmek kaybı hızlandırmıyor, `
      + 'kaybın kastan gelen payını büyütüyor.');
  } else {
    ekle('iyi', `Ortalama ${d.ortKcal.toLocaleString('tr-TR')} kcal — hedefin üstünde duruyorsun.`);
  }

  /* --- kaçamak */
  if (d.ekstraKcal > 0) {
    const haftalikAcik = (d.hedefKcal ? (2600 - d.hedefKcal) : 600) * 7;   // koruma - hedef
    const pay = Math.round((d.ekstraKcal / haftalikAcik) * 100);
    ekle(pay >= 40 ? 'kotu' : 'uyari',
      `${d.ekstraGun} günde ${d.ekstraAdet} kaçamak, toplam `
      + `${d.ekstraKcal.toLocaleString('tr-TR')} kcal — haftalık açığının yaklaşık %${pay}'i. `
      + (pay >= 40
        ? 'Bu kadarı haftanın kazancının büyük kısmını geri veriyor.'
        : 'Kaydetmen iyi; asıl mesele bunu haftada bir-iki ile sınırlamak.'));
  } else {
    ekle('iyi', 'Bu hafta hiç kaçamak girilmemiş.');
  }

  /* --- protein */
  if (d.ortProtein < d.planProtein * 0.85) {
    ekle('uyari', `Protein ortalaması ~${d.ortProtein} g (hedef ${d.planProtein}). `
      + 'Diyetteyken kası koruyan tek makro bu — kalori açığından önce burayı kapat.');
  } else {
    ekle('iyi', `Protein ~${d.ortProtein} g/gün. Yeterli.`);
  }

  /* --- plan tutturma */
  if (d.tutma < 70) {
    ekle('uyari', `Planın günlük ortalama %${d.tutma}'ini işaretlemişsin. `
      + 'Ya yemiyorsun ya yazmıyorsun; ikisi de sonuçta ne olduğunu bilmemekle bitiyor.');
  }

  /* --- su ve adım */
  if (d.ortSu < HEDEF.suTik - 1.5) {
    ekle('uyari', `Su ortalaması ${yaz(d.ortSu)}/${HEDEF.suTik} tik. `
      + 'Lif artarken su artmazsa kabızlık kötüleşir.');
  }
  if (d.ortAdim < HEDEF.adimMin / 1000) {
    ekle('uyari', `Adım ortalaması ${yaz(d.ortAdim)} bin — hedef ${HEDEF.adimMin / 1000}-`
      + `${HEDEF.adimMax / 1000} bin. Adım hesabın içinde: atmazsan günlük açık 1100 değil 850 oluyor.`);
  } else if (d.ortAdim > 0) {
    ekle('iyi', `Adım ortalaması ${yaz(d.ortAdim)} bin.`);
  }

  /* --- antrenman */
  if (a.yapilan === 0) {
    ekle('kotu', 'Bu hafta hiç antrenman kaydı yok. Kalori açığı tek başına kilo verdirir '
      + 'ama verdiğin kilonun ne kadarının yağ olacağını ağırlık antrenmanı belirler.');
  } else if (a.yapilan < a.hedef) {
    const eksik = a.gunler.filter((x) => !x.yapildi).map((x) => x.ad).join(', ');
    ekle('uyari', `${a.hedef} antrenmanın ${a.yapilan}'i yapılmış. Eksik: ${eksik}.`);
  } else {
    ekle('iyi', `Dört antrenmanın dördü de yapılmış — ${a.toplamSet} set.`);
  }

  /*  Güne girmiş olmak yetmiyor: programın 69 setinin sekizi kayıtlıysa o gün
      ya yarım bırakılmış ya yazılmamıştır. Gün sayısına bakıp "tam hafta"
      demek, ikisini de görünmez yapardı. */
  if (a.yapilan > 0 && a.hedefSet) {
    const setOran = Math.round((a.toplamSet / a.hedefSet) * 100);
    if (setOran < 60) {
      ekle('uyari', `Programın ${a.hedefSet} setinin ${a.toplamSet}'i kayıtlı (%${setOran}). `
        + 'Ya setleri yarım bırakıyorsun ya da girmiyorsun — ikisi de ilerlemeyi '
        + 'takip edilemez yapıyor, çünkü ağırlık artışı kayda dayanıyor.');
    } else if (setOran < 85) {
      ekle('uyari', `Set tamamlama %${setOran}. Vaktin yoksa kuralı hatırla: `
        + 'ilk 3 hareketi yap, gerisini at — kas koruyan şey bileşik hareketlerdir.');
    }
  }

  const dusen = a.hareketler.filter((x) => x.durum === 'düştü');
  const artan = a.hareketler.filter((x) => x.durum === 'arttı');
  const takilan = a.hareketler.filter((x) => x.durum === 'aynı');

  if (artan.length) {
    ekle('iyi', `${artan.length} harekette ağırlık ya da tekrar arttı: `
      + artan.slice(0, 4).map((x) => x.ad).join(', ') + (artan.length > 4 ? '…' : '') + '.');
  }
  if (dusen.length >= 3) {
    ekle('kotu', `${dusen.length} harekette geçen haftanın altına düşülmüş. `
      + 'Tek tek bakma — bu kadarı birlikte düşüyorsa sebep hareket değil: '
      + 'açık fazla, uyku az ya da protein düşük.');
  } else if (dusen.length) {
    ekle('uyari', `Geriye giden: ${dusen.map((x) => `${x.ad} (${setYazi(x.gecen)} → ${setYazi(x.bu)})`).join(', ')}.`);
  }

  /* Üst üste üç hafta aynı kalan hareket: programın kendi kuralı devreye girer. */
  const uzunTakilan = takilan.filter((x) => ucHaftaAyni(days, bas, x));
  if (uzunTakilan.length) {
    ekle('uyari', `Üç antrenmandır ilerlemeyen: ${uzunTakilan.map((x) => x.ad).join(', ')}. `
      + 'Programın kuralı: %10 hafiflet, baştan tırman.');
  }

  /* --- tartı */
  if (!t.kayitlar.length) {
    ekle('uyari', 'Bu hafta tartıya çıkmamışsın. Tartı pazartesi sabah, aç karnına, '
      + 'tuvalet sonrası, aynı tartıda.');
  } else if (t.degisim === null) {
    ekle('uyari', `Tartı girilmiş (${yaz(t.son)} kg) ama geçen haftanınki yok, `
      + 'karşılaştıracak bir şey çıkmıyor.');
  } else if (t.degisim <= -1.6) {
    ekle('uyari', `Hafta içinde ${yaz(Math.abs(t.degisim))} kg düşmüş — hedeflenenden hızlı. `
      + 'Bir hafta tek başına yanıltır, ama iki hafta böyle giderse kalori yukarı çekilir.');
  } else if (t.degisim <= -0.5) {
    ekle('iyi', `Tartı ${yaz(Math.abs(t.degisim))} kg düşmüş (${yaz(t.oncekiSon)} → ${yaz(t.son)}). Hedefte.`);
  } else if (t.degisim < 0.3) {
    ekle('uyari', `Tartı neredeyse yerinde (${yaz(t.oncekiSon)} → ${yaz(t.son)} kg). `
      + (fark > 100
        ? 'Kalori zaten hedefin üstünde; önce orayı düzelt.'
        : 'Tek haftaya bakma — 2-3 haftalık ortalama hâlâ inmiyorsa kaloriyi yeniden hesaplarız.'));
  } else {
    ekle('kotu', `Tartı ${yaz(t.degisim)} kg çıkmış (${yaz(t.oncekiSon)} → ${yaz(t.son)}). `
      + 'Tek hafta su tutmasından olabilir; ama kayıtta kaçamak varsa cevabı orada ara.');
  }

  return y;
}

/** Bir hareket son üç haftadır aynı en iyi sette mi duruyor? */
function ucHaftaAyni(days, bas, hareket) {
  const k = anahtarBul(hareket);
  if (!k) return false;

  const haftalar = [0, -7, -14].map((n) => haftaninEnIyisi(haftaninGunleri(days, addDays(bas, n)), k));
  if (haftalar.some((x) => !x)) return false;
  return haftalar.every((x) => x.kg === haftalar[0].kg && x.rep === haftalar[0].rep);
}

function anahtarBul(hareket) {
  for (const a of ANTRENMANLAR) {
    if (a.ad !== hareket.gun) continue;
    const h = a.hareketler.find((x) => x.ad === hareket.ad);
    if (h) return hareketAnahtari(a.key, h.key);
  }
  return null;
}

/* ----------------------------------------------------------- metin çıktısı */

/**
 * Raporun düz metin hâli — panoya kopyalanıp birine gönderilmek için.
 * Ekrandaki yorumların yanında ham rakamları da taşır ki karşı taraf
 * kendi değerlendirmesini yapabilsin.
 */
export function raporMetni(r) {
  const s = [];
  const d = r.diyet;
  const a = r.antrenman;

  s.push(`HAFTALIK RAPOR — ${r.etiket}${r.bitti ? '' : ' (hafta henüz bitmedi)'}`);
  s.push('');
  s.push('DİYET');
  s.push(`  Kayıt girilen gün: ${d.yazilanGun}/7`);
  s.push(`  Ortalama alınan: ${d.ortKcal} kcal/gün (hedef ${d.hedefKcal})`);
  s.push(`  Bunun ${d.ortOgunKcal} kcal'i plandan, kalanı kaçamaktan`);
  s.push(`  Plan tutturma: %${d.tutma}`);
  s.push(`  Protein (yaklaşık): ${d.ortProtein} g/gün (plan ${d.planProtein})`);
  s.push(`  Kaçamak: ${d.ekstraGun} günde ${d.ekstraAdet} adet, ${d.ekstraKcal} kcal`);
  s.push(`  Su: ${yaz(d.ortSu)}/${HEDEF.suTik} tik · Adım: ${yaz(d.ortAdim)} bin · Takviye: %${d.takviyeOran}`);
  s.push('');
  s.push('ANTRENMAN');
  s.push(`  Yapılan: ${a.yapilan}/${a.hedef} · toplam ${a.toplamSet} set (program ${a.hedefSet})`);
  for (const g of a.gunler) {
    s.push(`  ${g.ad}: ${g.yapildi ? `${g.gunAd}, ${g.setAdet} set` : 'yapılmadı'}`);
  }
  if (a.hareketler.length) {
    s.push('');
    s.push('  En iyi setler (geçen haftaya göre):');
    for (const h of a.hareketler) {
      s.push(`    ${h.ad}: ${setYazi(h.bu)}`
        + (h.gecen ? ` (geçen ${setYazi(h.gecen)} — ${h.durum})` : ' (ilk hafta)'));
    }
  }
  s.push('');
  s.push('TARTI');
  s.push(r.tarti.kayitlar.length
    ? `  ${r.tarti.kayitlar.map((x) => `${x.gunAd} ${yaz(x.kg)} kg`).join(' · ')}`
      + (r.tarti.degisim === null ? '' : ` · geçen haftaya göre ${yaz(r.tarti.degisim)} kg`)
    : '  kayıt yok');
  s.push('');
  s.push('GÜN GÜN');
  for (const g of r.gunlukler) {
    s.push(`  ${g.gunAd.padEnd(10)} ${g.toplam ? `${g.toplam} kcal` : 'kayıt yok'}`
      + (g.ekstraKcal ? ` (kaçamak ${g.ekstraKcal})` : '')
      + (g.tarti ? ` · tartı ${yaz(g.tarti)}` : ''));
  }
  s.push('');
  s.push('DEĞERLENDİRME');
  for (const v of r.yorumlar) s.push(`  - ${v.metin}`);

  return s.join('\n');
}
