# 126'dan 105'e — Diyet ve Spor

Sabit bir diyet ve antrenman programını günlük takip eden, hesap tabanlı bir
Progressive Web App. iPhone, Android ve Windows'a uygulama olarak kurulur,
çevrimdışı çalışır, cihazlar arasında anında senkron olur.

**Kurulum için: [KURULUM.md](KURULUM.md)**

Bu depoda iki uygulama var:

| Adres | Uygulama |
|---|---|
| `/` | Diyet ve Spor (bu uygulama) |
| `/muhendislik/` | Mühendislik Analiz Yorumlayıcı |

## İki sekme

**Diyet** — üç öğün, her satır gramajıyla ve kalorisiyle. Yedikçe işaretlenir,
tepedeki sayaç kalan kaloriyi gösterir. Altında **kaçamak** bölümü: plan dışı
yenenin adı, kalorisi ve istenirse protein/karbonhidrat/yağı girilir, aynı
sayaçtan düşer. Sonra su ve adım sayaçları, takviyeler ve haftalık tartı alanı. Referans bölümleri (besin değerleri, çiğ↔pişmiş
karşılıkları, alışveriş listesi, kurallar, yol haritası) katlanmış durur.

**Spor** — haftanın antrenman günleri (Üst A / Alt A / Üst B / Alt B). Gün
şeridinden seçilir, o günkü gün kendiliğinden açılır. Her harekette:

- istenen sayıda **set satırı** — `kg × tekrar`. Listenin sonunda hep bir boş
  satır durur; oraya bir değer girilince altında yenisi açılır. Enter kilodan
  tekrara, tekrardan bir alttaki setin kilosuna geçirir
- girilen set sayısı, programın öngördüğü sayıya karşı (`3 / 4 set`)
- **Tüm setleri yaptım** kutusu
- geçen sefer aynı harekette girilen setler

Geçen seferki rakamın görünmesi programın ilerleme kuralının işlemesi için
şart: "bütün setlerde üst sınır tekrarı iki antrenman üst üste tutarsa ağırlığı
artır" kuralı ancak kayıt tutulursa çalışır.

Saat verisi geldiği gün üstte **⌚ Apple Watch** kartı çıkar: günün aktif
kalorisi ve adımı. Bu kalori günlük hedefe eklenmez (bkz. `APPLE-WATCH.md`).

Altında **kardiyo** bölümü: tür (bant, dışarıda, bisiklet, eliptik), süre ve
istenirse hız ile eğim. Yakılan kalori günlük hedefe eklenmez — adım hedefi
zaten hesabın içinde ve yakılanı geri yemek açığı kapatmanın en hızlı yolu.

Isınma, soğuma, ilerleme ve deload bölümleri de katlanmış olarak burada.

**Haftalık rapor** (⚙ menüsünden) — haftanın kayıtlarını çözümler: ortalama
kalori, plan tutturma, yaklaşık protein, kaçamak toplamı, su/adım, yapılan
antrenman ve set oranı, hareket başına en iyi setin geçen haftaya göre durumu,
kardiyo süresi, tartı değişimi. Üstüne değerlendirme yazar: rakam tek başına bilgi değil,
"hedefin 340 üstünde, bu haftada ~0,3 kg eksik kayıp demek" bilgi.

Değerlendirme kuralları `rapor.js` içinde duruyor; rapor çevrimdışıyken de,
hiçbir servise bağlanmadan da çıkar. **Kopyala** düğmesi ham rakamlarla
birlikte düz metni panoya alır — daha derin bir okuma için birine göndermek
üzere.

## Veri

Gün başına tek belge:

```
users/<uid>/days/2026-09-20
  { date, diet:{...}, takviye:{...}, su, adim, tarti,
    ekstra:[{id, ad, kcal, p, k, y}, …],
    kardiyo:[{id, tur, dk, hiz, egim}, …],
    watch:{kcal, adim, guncel} | null,
    wo:{ "ustA:dbbench": { ok, setler:[{kg, rep}, …] } } }
```

Bir antrenman sırasında onlarca küçük yazma oluyor ve hepsi aynı güne ait;
ayrı koleksiyonlar telefonun zayıf bağlantısında sıra sıra gecikirdi. Yazmalar
kısmi (`merge`) gider, yani iki cihaz aynı anda açıkken biri diğerinin
işaretini ezmez.

İşaretler ve ağırlıklar hareketin **kalıcı anahtarına** yazılır, sıra numarasına
değil — programda bir satır değişse bile geçmiş kayıtlar yerinde kalır.

`store.js` içindeki `normalize()` gün belgesinin alanlarını tek tek sayar; yeni
bir alan eklerken oraya da eklemek gerekir, yoksa değer yazılır ama okunurken
sessizce düşer.

## Dosyalar

| Dosya | İş |
|---|---|
| `plan.js` | Programın kendisi: öğünler, antrenman günleri, kurallar. Hesap yok, sadece veri |
| `rapor.js` | Haftalık raporun hesabı ve değerlendirme kuralları |
| `store.js` | Firebase bağlantısı, giriş ve gün belgesi deposu (bulut + yerel) |
| `util.js` | Tarih ve küçük yardımcılar |
| `app.js` | Arayüz: iki sekme, çizim, olaylar |
| `app.css` | Görünüm; açık/koyu tema |
| `sw.js` | Service worker — uygulama kodu için önce ağ, Firebase SDK için önce önbellek |
| `config.js` | Firebase ayarları (gizli değildir, tarayıcıda görünür) |
| `firestore.rules` | Her hesap yalnızca kendi `users/<uid>` klasörüne erişir |
| `APPLE-WATCH.md` | Sağlık verisini taşıyan Kısayol otomasyonunun kurulumu |
| `habits/index.html` | Eski adresten köke yönlendirme |

## Notlar

- **Apple Watch**: Sağlık verisine yalnızca yerel uygulamalar erişebildiği için
  veriyi telefondaki Kısayollar otomasyonu taşıyor; Firestore'un REST arayüzünden
  hesaba giriş yapıp gün belgesindeki `watch` alanını yazıyor. Uygulama bu alana
  hiç yazmaz, yalnızca okur. Kurulum `APPLE-WATCH.md` dosyasında; ⚙ menüsündeki
  "Apple Watch bağlantısı" hesaba ait URL ve gövdeleri kopyalanabilir gösterir.
- **Hesapsız mod**: giriş ekranındaki "Hesapsız dene" seçeneği veriyi yalnızca o
  tarayıcıda tutar. Senkron yok, başka cihazda görünmez.
- **Karışık sürüm koruması**: her modül bir `BUILD` damgası taşır. Service worker
  dosyaları tek tek sunduğu için bağlantı zayıfken yeni `app.js` + eski `plan.js`
  karışımı oluşabiliyor; açılışta damgalar karşılaştırılır, uyuşmazsa önbellek
  temizlenip bir kez yenilenir.
- **Alt menü** sabit (`fixed`) değil, akışın içinde `sticky`. iOS Safari'de sabit
  elemanlar görsel viewport'a değil layout viewport'una göre yerleşiyor ve sayfa
  kaydırılamadığında menü ekranın ortasına yapışıyordu.
- Program tıbbi tavsiye değildir; dosyanın sonundaki uyarı uygulamada da yazılı.
