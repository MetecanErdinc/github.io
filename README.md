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
tepedeki sayaç kalan kaloriyi gösterir. Altında su ve adım sayaçları, takviyeler
ve haftalık tartı alanı. Referans bölümleri (besin değerleri, çiğ↔pişmiş
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

Isınma, soğuma, ilerleme ve deload bölümleri de katlanmış olarak burada.

## Veri

Gün başına tek belge:

```
users/<uid>/days/2026-09-20
  { date, diet:{...}, takviye:{...}, su, adim, tarti,
    wo:{ "ustA:dbbench": { ok, setler:[{kg, rep}, …] } } }
```

Bir antrenman sırasında onlarca küçük yazma oluyor ve hepsi aynı güne ait;
ayrı koleksiyonlar telefonun zayıf bağlantısında sıra sıra gecikirdi. Yazmalar
kısmi (`merge`) gider, yani iki cihaz aynı anda açıkken biri diğerinin
işaretini ezmez.

İşaretler ve ağırlıklar hareketin **kalıcı anahtarına** yazılır, sıra numarasına
değil — programda bir satır değişse bile geçmiş kayıtlar yerinde kalır.

## Dosyalar

| Dosya | İş |
|---|---|
| `plan.js` | Programın kendisi: öğünler, antrenman günleri, kurallar. Hesap yok, sadece veri |
| `store.js` | Firebase bağlantısı, giriş ve gün belgesi deposu (bulut + yerel) |
| `util.js` | Tarih ve küçük yardımcılar |
| `app.js` | Arayüz: iki sekme, çizim, olaylar |
| `app.css` | Görünüm; açık/koyu tema |
| `sw.js` | Service worker — uygulama kodu için önce ağ, Firebase SDK için önce önbellek |
| `config.js` | Firebase ayarları (gizli değildir, tarayıcıda görünür) |
| `firestore.rules` | Her hesap yalnızca kendi `users/<uid>` klasörüne erişir |
| `habits/index.html` | Eski adresten köke yönlendirme |

## Notlar

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
