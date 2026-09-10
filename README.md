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
- İki takip şekli: *yaptım / yapmadım* ve *sayaç* (ör. günde 8 bardak su)
- Üç plan tipi: her gün, belirli günler, haftada N kez
- Seri (streak) ve rekor takibi, 30 günlük başarı oranı, 13 haftalık ısı haritası
- Geçmiş günleri geriye dönük işaretleme
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
| `app.css` | Stiller (koyu/açık tema, mobil + masaüstü) |
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
