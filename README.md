# Alışkanlıklarım

iPhone, Android tablet ve Windows arasında senkron çalışan, hesap tabanlı
alışkanlık takip uygulaması. Progressive Web App (PWA) — her üç cihaza da
uygulama olarak kurulur ve çevrimdışı çalışır.

**Kurulum için: [KURULUM.md](KURULUM.md)**

Bu depoda iki uygulama var:

| Adres | Uygulama |
|---|---|
| `/` | Alışkanlıklarım (bu uygulama) |
| `/muhendislik/` | Mühendislik Analiz Yorumlayıcı |

## Özellikler

- E-posta + şifreyle hesap; her hesap yalnızca kendi alışkanlıklarını görür
- Cihazlar arası anlık senkron (bir cihazdaki değişiklik diğerlerine düşer)
- Çevrimdışı çalışma; bağlantı gelince kendiliğinden gönderim
- Üç takip şekli:
  - *yaptım / yapmadım* — tek dokunuş
  - *sayaç* — günde 8 bardak su gibi adet
  - *süre* — günde 3 saat ders gibi; hızlı düğmelerle (+15dk, +30dk, +1sa) ya da
    saat/dakika yazarak girilir, istatistikte toplam saat olarak da görünür
- Alışkanlık başına **yapılacaklar listesi**, iki türde:
  - *her gün yeni* — gün boş başlar, önceki günün listesi tek dokunuşla kopyalanır
  - *sabit* — maddeler her gün aynı gelir (vitaminler, sabah rutini gibi)
  - her iki türde de işaretler güne özeldir; geçmiş günler sıfırlanmaz
- Liste alışkanlığı besleyebilir (isteğe bağlı), takip şekline göre:
  sayaçta tikler sayacı ilerletir, sürede madde süreleri toplanır,
  işaretlemelide hepsi bitince tamamlanır
- **Listeler sekmesi**: alışkanlıklardan ve tarihten bağımsız listeler — market
  alışverişi, gün içinde halledilecek tek seferlik işler. İstediğiniz kadar liste
  açar, tamamlananları tek dokunuşla temizlersiniz; her listenin yanında
  oluşturulma tarihi görünür
- **Bölümler**: alışkanlıklara isteğe bağlı bölüm adı verilir; aynı bölümdekiler
  Bugün ve Alışkanlıklar ekranlarında tek başlık altında toplanır
- **Program sekmesi — kişiye özel diyet ve spor planı**: cinsiyet, yaş, boy,
  kilo, hareket düzeyi, antrenman günü, hedef, hız ve yemediklerini sorar;
  hesaba özel kalori, makro, gramajlı öğün, akşam protein rotasyonu ve
  antrenman bölünmesi üretir. Tek dokunuşla alışkanlıklara kurulur: öğünler
  gramajlı sabit liste, su ve adım sayaç, antrenman haftada N kez; yanında
  anti-kaçak kuralları ve plandan hesaplanmış haftalık alışveriş listesi.
  Bilgi değişince yenilenir — alışkanlıklar kalıcı anahtarla eşleştiği için
  kopya çıkmaz, işaretler ve geçmiş korunur
  - Kalori: Mifflin-St Jeor + hareket + antrenman; açık hem haftalık kilo
    yüzdesinden hem günlük yakım yüzdesinden hesaplanır, güvenli olan kazanır
  - Protein ve yağ gerçek kiloyla değil boya denk sağlıklı ağırlıkla çarpılır
  - Vejetaryen, sütsüz, balıksız ve kırmızı etsiz düzenler desteklenir
- **Günlük kalori sayacı**: Program sekmesinin başında o gün kalan kalori
  yazar. Öğün maddeleri işaretlendikçe her kalem kendi payınca düşer; hedef
  aşılırsa sayaç kırmızıya döner
- **Barkod ve ürün arama**: Program sekmesinden yiyecek eklenir. Barkod
  kamerayla okutulur (ya da elle yazılır), ürün adıyla aranır, kalorisi
  bilinmeyen bir şey için 100 gramdaki değer elle girilir. Gramaj yazılınca
  kalori hesaplanır ve günün sayacına eklenir. Ürün bilgisi Open Food
  Facts'ten gelir; ağ ya da kamera çalışmasa da elle giriş hep açıktır
- Barkod okuma üç yoldan denenir: tarayıcının kendi okuyucusu (Android),
  ZXing (iOS Safari, istendiğinde indirilir) ve **fotoğraftan okuma** —
  canlı görüntü tutmadığında tek kare çok daha güvenilir sonuç verir
- **Gömülü Türk mutfağı tablosu**: simit, döner, mercimek çorbası, ayran gibi
  barkodu olmayan ~150 yiyecek uygulamanın içinde. Arama anında ve çevrimdışı
  çalışır, paketli ürün veritabanı hiç yanıt vermese bile. Porsiyon karşılığı
  olanlarda gramaj hazır gelir ("1 simit ≈ 100 g"). Değerler yaklaşıktır
- **Ürün defteri**: barkod veritabanlarında Türk ürünlerinin bir kısmı kayıtlı
  değil. Bulunamayan ürün bir kez elle girilince barkoduyla deftere yazılır;
  ikinci okutmada ağa hiç çıkmadan, anında gelir. Sık kullanılanlar ekleme
  ekranının başında tek dokunuşla durur, isim araması da önce defteri tarar
- Program alışkanlıkları **Bugün ekranında görünmez ve günlük tamamlama
  oranına katılmaz** — öğün, su ve adım takibi Program sekmesinde yaşar,
  Bugün kişinin kendi kurduğu alışkanlıklara ayrılmıştır. Alışkanlıklar
  sekmesi ve tek tek istatistikler ikisini de gösterir
- **Fotoğraf ekleme**: alışkanlıklara (güne bağlı) ve listelere; her fotoğrafın
  altında eklenme zamanı yazar. Görseller tarayıcıda küçültülüp Firestore'da
  saklanır — Firebase Storage ücretsiz planda kapalı olduğu için
- Liste maddelerine **son tarih**; geçmiş tarihler kırmızı, bugün mavi
- Üç plan tipi: her gün, belirli günler, haftada N kez
- Seri (streak) ve rekor takibi, 30 günlük başarı oranı, 13 haftalık ısı haritası
- Geçmiş günleri geriye dönük işaretleme
- "Beni hatırla": oturum cihazda açık kalır, e-posta bir sonraki girişte hazır gelir
- Telefona göre ayarlanmış yerleşim: dokunmatik hedefler büyütülür, iOS'un form
  alanına dokununca yakınlaştırma davranışı engellenir, yatay mod ve çentik
  boşlukları gözetilir
- Paylaşıma hazır: yeni kullanıcının Firebase ile hiçbir işi olmaz, sadece hesap açar
- Koyu / açık / sistem teması
- JSON olarak yedek alma ve geri yükleme
- Firebase kurmadan denemek için yerel mod
- Kurulum kontrolü: eksik Firebase ayarlarını tespit edip konsolda tam sayfaya bağlantı verir

## Dosyalar

| Dosya | İşlevi |
|---|---|
| `index.html` | Uygulama iskeleti |
| `app.js` | Arayüz, görünümler, eylemler |
| `data.js` | Firebase bağlantısı, bulut ve yerel veri depoları |
| `util.js` | Tarih, plan ve seri hesaplamaları |
| `photo.js` | Görsel küçültme/sıkıştırma ve zaman damgası biçimi |
| `app.css` | Stiller (koyu/açık tema, mobil + masaüstü) |
| `plan.js` | Kalori, makro, öğün ve antrenman hesabı |
| `foods.js` | Barkod okuma ve Open Food Facts sorguları |
| `tr-foods.js` | Gömülü Türk yiyecekleri tablosu |
| `program.js` | Planı alışkanlık ve listelere çeviren katman |
| `config.js` | **Firebase ayarlarınızı buraya yazın** |
| `firestore.rules` | Firestore güvenlik kuralları — konsola yapıştırın |
| `sw.js` | Service worker (çevrimdışı önbellek) |
| `manifest.json` | PWA tanımı |
| `habits/index.html` | Eski adresten köke yönlendirme |
| `muhendislik/` | Ayrı uygulama — bu projeyle ilgisi yok |

## Maliyet

Sıfır. GitHub Pages ücretsiz; Firebase Spark planı kredi kartı istemez ve
kendiliğinden ücretli plana geçmez. Günlük ücretsiz sınırlar (50.000 okuma /
20.000 yazma) kişisel kullanımın çok üzerindedir.
