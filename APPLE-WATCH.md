# Apple Watch verisini uygulamaya bağlama

Apple Watch'ın topladığı **aktif kalori** ve **adım** verisini günde bir kez
uygulamaya yazan bir Kısayol (Shortcut) kurulumu. Kod yazmıyorsun, geliştirici
hesabı gerekmiyor, ücretli bir plan gerekmiyor. Kurulum bir defalık, ~10 dakika.

## Neden Kısayol?

Sağlık (HealthKit) verisine yalnızca cihaza kurulu **yerel uygulamalar**
erişebiliyor. Bu uygulama bir web sayfası; Ana Ekrana eklenmiş olsa bile
Safari'nin içinde çalışıyor ve Sağlık'a erişemiyor. Apple'ın Health verisi için
genel bir bulut API'si de yok, yani sunucu tarafından da çekilemiyor.

Kısayollar uygulaması ise hem Sağlık'ı okuyabiliyor hem de internete istek
atabiliyor. Yani veriyi taşıyan köprü o.

**Bu gerçek zamanlı değildir.** Kısayol ne zaman çalışırsa o anki toplamı yazar.
Günde bir kez (akşam) ya da birkaç kez çalıştırmak pratikte yeterli.

## Kalori neden hedefe eklenmiyor

Saatin yazdığı aktif kalori uygulamada **görünür ama günlük 2000 kcal hedefine
eklenmez**. İki sebep:

1. Apple Watch, koşu dışındaki aktivitelerde aktif enerjiyi tipik olarak
   **%20-40 yüksek** tahmin ediyor.
2. Günlük 8-10 bin adım zaten 2000 kcal hesabının içinde. Saatin yaktığını
   üstüne eklemek aynı kaloriyi iki kez saymak olur ve açığı sessizce küçültür.

Adım farklı: o programın bir parçası, o yüzden **adım sayacı saatten
kendiliğinden doluyor**. Sayaca elle dokunduğun gün senin girdiğin değer geçerli
olur.

## Kurulum

### Hazırlık — kendi değerlerini al

Uygulamada **⚙ → ⌚ Apple Watch bağlantısı**. Orada sana ait iki URL ve iki gövde
metni var, her birinin yanında **kopyala** düğmesi. Aşağıdaki adımlarda bunları
yapıştıracaksın.

### 1. Yeni kısayol

Kısayollar uygulaması → **+** → adını `Sağlık → Diyet` koy.

### 2. Aktif kaloriyi oku

1. **Sağlık Örneklerini Bul** (Find Health Samples) ekle
   - Tür: **Aktif Enerji**
   - Filtre ekle: **Başlangıç Tarihi** → **bugün**
2. **İstatistik Hesapla** (Calculate Statistics) ekle
   - İşlem: **Toplam**
   - Girdi: bir önceki adımın çıktısı
3. Sonucu **Değişkene Ayarla** (Set Variable) → adı `KALORI`

### 3. Adımı oku

Aynı üçlüyü tekrarla, tek fark:

- Tür: **Adım**
- Değişken adı: `ADIM`

### 4. Tarihi ve zamanı hazırla

1. **Geçerli Tarih** (Current Date) ekle
2. **Tarihi Biçimlendir** (Format Date)
   - Biçim: **Özel**
   - Kalıp: `yyyy-MM-dd`
   - **Değişkene Ayarla** → `TARIH`
3. Tekrar **Geçerli Tarih** → **Tarihi Biçimlendir**
   - Kalıp: `yyyy-MM-dd'T'HH:mm:ssZ`
   - **Değişkene Ayarla** → `ZAMAN`

### 5. Giriş yap

1. **Metin** (Text) ekle, içine uygulamadaki **1 · Giriş isteği → Gövde**
   metnini yapıştır. `ŞİFREN` yazan yere kendi şifreni yaz.
2. **URL İçeriğini Al** (Get Contents of URL) ekle
   - URL: uygulamadaki **1 · Giriş isteği → URL**
   - Yöntem: **POST**
   - Başlıklar: `Content-Type` = `application/json`
   - İstek Gövdesi: **Dosya** → bir önceki Metin adımının çıktısı
3. **Sözlük Değeri Al** (Get Dictionary Value)
   - Anahtar: `idToken`
   - **Değişkene Ayarla** → `TOKEN`

### 6. Yaz

1. **Metin** ekle, içine **2 · Yazma isteği → Gövde** metnini yapıştır.
   İçindeki `KALORI`, `ADIM` ve `ZAMAN` kelimelerini silip yerlerine aynı adlı
   **değişkenleri** ekle (tırnak işaretlerine dokunma).
2. **URL İçeriğini Al** ekle
   - URL: **2 · Yazma isteği → URL**. İçindeki `TARIH` kelimesini silip yerine
     `TARIH` değişkenini koy.
   - Yöntem: **PATCH**
   - Başlıklar:
     - `Content-Type` = `application/json`
     - `Authorization` = `Bearer ` + `TOKEN` değişkeni *(Bearer'dan sonra bir
       boşluk var, unutma)*
   - İstek Gövdesi: **Dosya** → bir önceki Metin adımının çıktısı

### 7. Dene

Kısayolu elle çalıştır. Hata çıkmazsa uygulamayı aç: **Spor** sekmesinde
**⌚ Apple Watch** kartı görünmeli, **Diyet** sekmesinde adım sayacı dolmuş
olmalı.

### 8. Otomatiğe bağla

Kısayollar → **Otomasyon** → **+** → **Günün Saati**
- Saat: akşam bir vakit (örn. 22:30)
- Tekrar: **Günlük**
- Eylem: `Sağlık → Diyet` kısayolunu çalıştır
- **Çalıştırmadan Önce Sor** kapalı olsun

Günde birkaç kez güncellensin istersen aynı otomasyondan birkaç tane kur.

## Güvenlik

Kısayol, Firebase'in REST arayüzünden **senin hesabınla** giriş yapıp yalnızca
kendi `users/<uid>` klasörüne yazıyor. Mevcut güvenlik kuralları aynen geçerli;
yeni bir kural, yeni bir sunucu ya da ücretli plan gerekmiyor.

Şifren yalnızca senin telefonundaki Kısayol'un içinde duruyor. Kısayolu
başkasıyla paylaşırsan şifren de gider — paylaşma.

## Sorun giderme

| Belirti | Sebep |
|---|---|
| `INVALID_LOGIN_CREDENTIALS` | Giriş gövdesindeki e-posta ya da şifre yanlış |
| `403` / `PERMISSION_DENIED` | `Authorization` başlığı eksik, ya da `Bearer` ile token arasında boşluk yok |
| İstek geçiyor ama uygulamada görünmüyor | Yazma URL'sindeki tarih `yyyy-MM-dd` biçiminde değil, ya da `updateMask` kuyruğu URL'den düşmüş |
| Kalori 0 geliyor | Sağlık Örneklerini Bul adımında filtre "bugün" değil, ya da İstatistik Hesapla adımı **Toplam** değil |
| Uygulama eski değeri gösteriyor | Kısayol o gün henüz çalışmamış; elle bir kez çalıştır |
