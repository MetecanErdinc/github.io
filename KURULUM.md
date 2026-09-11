# Alışkanlıklarım — Kurulum Kılavuzu

iPhone'unuzdan, Android tabletinizden ve Windows bilgisayarınızdan aynı anda
kullanabileceğiniz, birinde yaptığınız değişikliğin diğerlerine anında yansıdığı
bir alışkanlık takip uygulaması.

**Tamamen ücretsizdir.** Kullanılan her şey ücretsiz seviyede kalır:

| Parça | Servis | Ücret |
|---|---|---|
| Uygulamanın barındırılması | GitHub Pages | Ücretsiz, sınırsız |
| Hesap / giriş sistemi | Firebase Authentication | Ücretsiz (Spark planı) |
| Veritabanı ve senkron | Cloud Firestore | Ücretsiz (Spark planı) |

Firebase'in **Spark** planı kredi kartı istemez ve kendiliğinden ücretli plana
geçmez. Günlük ücretsiz sınır 50.000 okuma / 20.000 yazma'dır; kişisel kullanımda
günde birkaç yüzü geçmezsiniz.

---

## Hazırlık: Toplam ne kadar sürer?

Tek seferlik yaklaşık **10–15 dakika**. Bir kez yaptıktan sonra üç cihazınızda da
sadece giriş yapmanız yeter.

---

## Adım 1 — Siteyi yayına alın (GitHub Pages) ✅ yapıldı

Bu adım tamamlandı. Pages, `claude/funny-dirac-j59wrx` dalından yayın yapacak
şekilde ayarlandı; uygulamanın adresi:

```
https://metecanerdinc.github.io/github.io/
```

> İlk yayın birkaç dakika sürebilir. Settings → Pages ekranının üstünde
> "Your site is live at …" yazısı çıkınca hazırdır.
>
> Bu dala her yeni değişiklik gönderildiğinde site kendiliğinden güncellenir.
> İleride çalışmayı `main` dalına birleştirirseniz Pages kaynağını da `main`
> olarak geri değiştirebilirsiniz — zorunlu değil.

Depodaki diğer uygulamanız (Mühendislik Analiz Yorumlayıcı) silinmedi, yalnızca
bir alt adrese taşındı ve çalışmaya devam ediyor:

```
https://metecanerdinc.github.io/github.io/muhendislik/
```

---

## Adım 2 — Firebase projesi oluşturun

1. <https://console.firebase.google.com> adresine Google hesabınızla girin
2. **Create a project** (Proje oluştur)
3. Proje adı: `aliskanliklarim` (istediğinizi yazabilirsiniz)
4. Google Analytics sorulursa **kapatın** — gerekmiyor
5. **Create project** → oluşması birkaç saniye sürer

---

## Adım 3 — Giriş sistemini açın (Authentication)

1. Sol menü → **Build → Authentication** → **Get started**
2. **Sign-in method** sekmesi → listeden **Email/Password**
3. Üstteki **Enable** anahtarını açın (alttaki "Email link" kapalı kalsın)
4. **Save**

### 3b — Alan adınızı yetkilendirin

Firebase, kendi adresleri dışındaki alan adlarını "yetkili" listesinde tutar.
GitHub Pages adresinizi eklemeniz gerekir:

1. **Authentication → Settings** sekmesi → **Authorized domains**
2. **Add domain** → şunu yazın (yol kısmı olmadan, sadece alan adı):

```
metecanerdinc.github.io
```

3. **Add**

> E-posta/şifre ile normal giriş bu adım olmadan da genelde çalışır; ancak
> **şifre sıfırlama bağlantıları** ve ileride ekleyebileceğiniz Google ile giriş
> bu liste olmadan çalışmaz. 30 saniyelik iş, atlamayın.

---

## Adım 4 — Veritabanını oluşturun (Firestore)

1. Sol menü → **Build → Firestore Database** → **Create database**
2. Konum olarak **eur3 (europe-west)** seçin (Türkiye'ye en yakını)
3. **Production mode** seçin → **Create**

### 4b — Güvenlik kurallarını yükleyin ⚠️

Bu, verilerinizi koruyan asıl adımdır. Her hesabın yalnızca kendi verisini
görmesini sağlar.

1. Firestore ekranında **Rules** sekmesine geçin
2. İçerideki her şeyi silip bu depodaki `firestore.rules` dosyasının
   içeriğini yapıştırın:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Publish**

---

## Adım 5 — Web uygulaması ekleyip ayarları kopyalayın

1. Sol üstteki ⚙️ → **Project settings**
2. Sayfanın altında **Your apps** → **`</>`** (Web) simgesine tıklayın
3. Takma ad: `alışkanlıklar` → **Register app**
   (Firebase Hosting kutusunu **işaretlemeyin**, gerekmiyor)
4. Ekrana şuna benzer bir blok gelir — **tamamını kopyalayın**:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aliskanliklarim-xxxx.firebaseapp.com",
  projectId: "aliskanliklarim-xxxx",
  storageBucket: "aliskanliklarim-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

> Bu değerler **gizli bilgi değildir**; tarayıcıda görünmek üzere tasarlanmışlardır.
> Verilerinizi koruyan şey Adım 4b'deki güvenlik kurallarıdır.

---

## Adım 6 — Ayarları uygulamaya girin

İki yolu var. **A yolunu öneririm** — bir kez yapar, üç cihazda da hazır bulursunuz.

### A) `config.js` dosyasını düzenleyin (önerilen)

1. GitHub'da depoyu açın → `config.js` dosyasına girin
2. Sağ üstteki **kalem (✏️)** simgesine basın
3. `BURAYA_...` yazan yerleri Adım 5'te kopyaladığınız değerlerle değiştirin:

```js
export const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "aliskanliklarim-xxxx.firebaseapp.com",
  projectId:         "aliskanliklarim-xxxx",
  storageBucket:     "aliskanliklarim-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

4. **Commit changes** → 1–2 dakika içinde site güncellenir

### B) Uygulamanın içinden yapıştırın

Uygulamayı açtığınızda çıkan kurulum ekranındaki kutuya Adım 5'te kopyaladığınız
bloğu yapıştırıp **Kaydet ve bağlan** deyin. Bu yöntemde ayarı **her cihazda ayrı
ayrı** yapmanız gerekir.

---

## Adım 7 — Hesabınızı oluşturun

1. Uygulamayı açın: `https://metecanerdinc.github.io/github.io/`
2. **Hesap oluştur** sekmesi → e-posta + şifre (en az 6 karakter) → **Hesabı oluştur**
3. Diğer cihazlarınızda **aynı e-posta ve şifreyle** *Giriş yap* deyin.

Giriş ekranındaki **Beni hatırla** açık olduğu sürece (varsayılan) o cihazda bir
daha şifre sorulmaz — tarayıcıyı veya uygulamayı kapatıp açsanız da oturum
açık kalır. Kapatmak isterseniz: **Ayarlar → Hesap → Beni hatırla**. Ortak
kullanılan bir bilgisayarda bu kutuyu işaretlemeyin; o zaman oturum yalnızca
sekme kapanana kadar sürer.

Farklı bir e-postayla giriş yaparsanız o hesabın kendi alışkanlıkları görünür;
hesaplar birbirinin verisini göremez.

---

## Adım 7b — Kurulum kontrolü ile doğrulayın

Uygulamada **Ayarlar → Bulut bağlantısı → Kurulum kontrolü → Çalıştır** deyin
(giriş yapmadan önce, giriş ekranının altındaki **Kurulum kontrolü** düğmesiyle
de çalışır).

Şunları tek tek test edip sonucu listeler:

| Kontrol | Ne anlama gelir |
|---|---|
| Firebase ayarları | `config.js` doğru okunuyor mu |
| E-posta/Şifre girişi | Adım 3'ü yaptınız mı |
| Yetkili alan adı | Adım 3b hatırlatması |
| Kendi verinize erişim | Adım 4b'deki kurallar yayınlandı mı |
| Başkasının verisi kapalı mı? | Kurallar gerçekten koruyor mu |

Eksik olan her satırın altında **Firebase konsolundaki tam sayfaya doğrudan
bağlantı** çıkar — menülerde gezinmenize gerek kalmaz. Hepsi ✅ olduğunda
kurulum bitmiştir.

> Son satır özellikle önemli: eğer "Kurallar fazla açık" uyarısı çıkarsa
> Firestore'u *test mode* ile kurmuşsunuz demektir ve o hâlde **başkaları
> verinizi okuyabilir**. Adım 4b'yi mutlaka yapın.

---

## Adım 8 — Üç cihaza da uygulama olarak kurun

### 📱 iPhone
1. **Safari** ile adresi açın (Chrome ile değil — iOS'ta yalnızca Safari kurabilir)
2. Alttaki **Paylaş** düğmesi (kutudan çıkan ok)
3. **Ana Ekrana Ekle** → **Ekle**

### 📱 Android tablet
1. **Chrome** ile adresi açın
2. Sağ üstteki **⋮** menüsü
3. **Uygulamayı yükle** (veya *Ana ekrana ekle*)

### 💻 Windows
1. **Chrome** veya **Edge** ile adresi açın
2. Adres çubuğunun sağındaki **kurulum** simgesi (⊕ / monitör simgesi)
   ya da **⋮ → Uygulamalar → Bu siteyi uygulama olarak yükle**
3. Masaüstünüze ve Başlat menüsüne kısayol eklenir

Uygulama olarak kurulduğunda tam ekran açılır, çevrimdışı da çalışır.

---

## Nasıl çalışıyor?

- Bir cihazda işaret koyduğunuzda değişiklik **saniyeler içinde** diğerlerine düşer
  (sayfayı yenilemenize gerek yok).
- **İnternet yokken de** işaretleyebilirsiniz; bağlantı gelince kendiliğinden
  gönderilir.
- Veriler Firestore'da `users/<hesap-kimliğiniz>/` altında tutulur. Güvenlik
  kuralları sayesinde başka hiçbir hesap oraya erişemez.

---

## Sorun giderme

> Önce **Kurulum kontrolü**'nü çalıştırın (Adım 7b) — çoğu sorunu adıyla söyler
> ve düzeltme bağlantısını verir.

**"Bu adres Firebase projesinde yetkili değil"**
Adım 3b'yi yapmadınız. Authentication → Settings → Authorized domains →
`metecanerdinc.github.io` ekleyin.

**"Firebase projenizde E-posta/Şifre giriş yöntemi açık değil"**
Adım 3'ü yapın.

**"Firestore kuralları verilerinize izin vermiyor"**
Adım 4b'deki kuralları yapıştırıp **Publish** demeyi unutmuşsunuz.

**"Firebase apiKey değeri hatalı"**
`config.js` içindeki değerler eksik ya da yanlış. Adım 5'teki bloğu yeniden
kopyalayıp Adım 6'yı tekrarlayın.

**Adres 404 veriyor: "There isn't a GitHub Pages site here"**
Bu, dosyanın değil *sitenin* bulunamadığı anlamına gelir; neredeyse her zaman
yayın (deployment) takılmıştır. Pages kaynak dalını değiştirdiğinizde iki yayın
yarışırsa olur.

1. **Actions** sekmesini açın
2. "pages build and deployment" koşularına bakın; biri hâlâ dönüyorsa
   (`deploy` adımı `updating_pages` satırını tekrarlıyorsa) onu açıp
   sağ üstten **Cancel workflow** deyin
3. Sonra en son başarısız koşuda **Re-run all jobs** deyin, ya da dala yeni
   bir commit gönderin

Takılı yayın diğer bütün yayınları
`Deployment request failed … due to in progress deployment` hatasıyla reddettirir.

**Sayfa eski hâlini gösteriyor**
Service worker eski sürümü önbelleklemiş olabilir. Sayfayı kapatıp açın; Windows'ta
`Ctrl + Shift + R` ile zorla yenileyin.

**Şifremi unuttum**
Giriş ekranında **Şifremi unuttum** → e-postanıza sıfırlama bağlantısı gelir.

---

## Fotoğraf ekleme

Hem alışkanlıklara hem de Listeler sekmesindeki listelere fotoğraf ekleyebilirsiniz.
Alışkanlık kartındaki rozete dokunup açılan panelde, listelerde ise listenin
üstündeki şeritte **📷** düğmesi bulunur. Telefonda kamera ile çekme veya
galeriden seçme seçeneklerini tarayıcı sunar.

- Her fotoğrafın altında **ne zaman eklendiği** yazar ("Bugün 14:32", "Dün 09:05",
  "3 gün önce", eskiler için "1 Eylül 07:45")
- Alışkanlık fotoğrafları **güne bağlıdır**: bugün eklediğiniz fotoğraf bugünde
  kalır, tarih oklarıyla geçmiş günlerin fotoğraflarına bakabilirsiniz
- Liste fotoğrafları listeye bağlıdır, tarihten bağımsızdır
- Fotoğrafa dokununca tam boyutlu hâli açılır; oradan silebilirsiniz
- Bir yere en fazla 60 fotoğraf eklenebilir

### Neden Firebase Storage kullanılmıyor?

Firebase'in dosya depolama servisi (Cloud Storage) **ücretsiz planda kapalıdır**,
kredi kartı bağlamanızı ister. Ücretsiz kalmak için fotoğraflar tarayıcınızda
küçültülüp (uzun kenar 1280 piksel) Firestore veritabanına yazılıyor. Tipik bir
fotoğraf 150-400 KB yer kaplar; ücretsiz 1 GB alan birkaç bin fotoğraf demektir.

> Yedek dosyasına fotoğrafların yalnızca küçük önizlemeleri girer. Tam boyutlu
> hâlleri dosyayı çok büyüteceği için dışarıda bırakılır; onlar hesabınızda durur.

---

## Listeler sekmesi

Alt menüdeki **Listeler**, alışkanlıklarla hiç ilgisi olmayan serbest listeler
içindir: market alışverişi, bugün halletmeniz gereken tek seferlik işler,
unutmamanız gerekenler.

- İstediğiniz kadar liste açarsınız (Market, Bugün, Tamir edilecekler…)
- Her listenin yanında **oluşturulma tarihi** yazar: aynı günse "Bugün", bir
  önceki günse "Dün", daha eskiyse "19 Ağustos" gibi. Listeyi düzenleme
  penceresinde saatiyle birlikte tam hâli görünür.
- Her listenin kendi simgesi ve adı vardır
- **Tarihe bağlı değildir.** Alışkanlık listeleri günden güne değişir; buradakiler
  siz silene kadar olduğu gibi durur. Günü değiştirmek bunları etkilemez.
- Her maddeye **son tarih** verebilirsiniz: maddenin yanındaki 📅 düğmesine dokunup
  Bugün / Yarın / Hafta sonu gibi hazır seçeneklerden birini ya da takvimden bir
  gün seçin. Tarih geçmişse kırmızı, bugünse mavi görünür. Pencerede maddenin ne
  zaman eklendiği de yazar.
- Tamamladığınız maddeleri **Tamamlanan N maddeyi temizle** ile toplu silersiniz
- Maddenin üstüne dokunup metnini değiştirebilirsiniz

Bu listeler de hesabınıza kaydedilir, cihazlar arasında senkronlanır ve
yedeklemeye dahildir.

---

## Günlük yapılacaklar listesi

Bir alışkanlığı düzenlerken **Yapılacaklar listesi** kutusunu işaretlerseniz kartın
altında o alışkanlığa ait bir liste açılır.

- **Her günün listesi ayrıdır.** Bugün yazdığınız maddeler yalnızca bugüne aittir;
  yarın kart boş bir listeyle açılır ve **dünkü liste dünde olduğu gibi durur** —
  işaretleriyle birlikte.
- Geçmiş bir güne gitmek için Bugün ekranındaki `‹` `›` oklarını veya hafta
  şeridindeki günü kullanın.
- Liste boş olan bir günde, daha önceki en yakın dolu günün listesini tek
  dokunuşla kopyalayabilirsiniz. Metinler gelir, işaretler sıfırlanır.
- Maddenin üstüne dokunup metnini değiştirebilir, metni tamamen silerseniz madde
  listeden kalkar.

### İki liste türü

Düzenleyicide **Liste türü** ile seçersiniz:

**Her gün yeni liste** (varsayılan) — Gün boş başlar, o güne ne yazarsanız orada
kalır. Boş bir günde önceki günün listesini tek dokunuşla kopyalayabilirsiniz.
Ders planı gibi her gün değişen listeler için.

**Sabit liste** — Maddeler her gün aynı gelir; yeniden yazmanız gerekmez.
Vitaminler, sabah rutini gibi tekrar eden listeler için.

> Sabit listede de **işaretler güne özeldir**: bugün hepsini işaretlemeniz dünü
> değiştirmez, yarın liste yeniden işaretsiz gelir.

Sabit listede madde ekler, adını değiştirir veya silerseniz bu değişiklik
alışkanlığa yazılır ve sonraki günlere yansır. Daha önce işaretlediğiniz günler
o günkü hâliyle kalır — geçmiş kaydınız bozulmaz.

### Liste alışkanlığı besleyebilir

Düzenleyicide **İlerlemeyi liste belirlesin** seçeneğini açarsanız listedeki
hareketler doğrudan alışkanlığa işlenir. Takip şekline göre düzenek değişir:

| Takip şekli | Düzenek |
|---|---|
| **Sayaç** | İşaretledikçe sayaç ilerler. Örn. 4 maddelik vitamin listesinde her tik sayacı bir artırır, dördü de işaretlenince alışkanlık tamamlanır. |
| **Süre** | Her maddenin yanında bir süre düğmesi çıkar. Girdiğiniz süreler toplanıp alışkanlığa yazılır. Örn. Matematik 1sa 30dk + Fizik 1sa + Kimya 30dk = 3sa, hedef 3 saatse alışkanlık tamamlanır. |
| **Yaptım / yapmadım** | Bütün maddeler işaretlenince tamamlanmış sayılır. |

Seçenek kapalıyken liste yalnızca bir not defteridir; alışkanlığı elle
işaretlersiniz. Listesi boş olan günlerde elle giriş yine açıktır.

Listeler de yedeklemeye dahildir ve cihazlar arasında senkronlanır.

---

## Uygulamayı başkasıyla paylaşma

Kurulum bir kez yapıldı; **paylaştığınız kişinin Firebase ile hiçbir işi yok.**
Yapmaları gereken tek şey adresi açıp kendi hesaplarını oluşturmak:

```
https://metecanerdinc.github.io/github.io/
```

- Firebase ayarları `config.js` içinde depoda durduğu için herkes hazır bağlantıyla açar
- Herkes kendi e-postası ve şifresiyle kendi hesabını açar
- `firestore.rules` her hesabı kendi `users/<uid>` klasörüne hapseder; **kimse
  başkasının alışkanlıklarını göremez** — bu, arayüzde değil sunucuda zorunlu
- Firebase'e ait ayar düğmeleri, yapılandırma depodan geldiğinde uygulamada
  görünmez; paylaştığınız kişi bir kurulum ekranıyla karşılaşmaz

Ücretsiz sınırlar (günde 50.000 okuma / 20.000 yazma) birkaç kişilik kullanımın
çok üzerindedir; kişi ekledikçe ücretli plana geçme riski yoktur.

### Sizin için tek ek adım yok

Yeni kişi eklediğinizde Firebase konsolunda bir şey yapmanız gerekmez. Hesaplar
kendiliğinden oluşur; **Authentication → Users** listesinde görünürler.

---

## Firebase'siz denemek

Kurulumu şimdi yapmak istemiyorsanız, açılış ekranındaki
**"Şimdilik sadece bu cihazda kullan"** ile hemen başlayabilirsiniz. Veriler o
tarayıcıda kalır, senkron olmaz. Sonradan **Ayarlar → Buluta geç** dediğinizde
o cihazdaki verileri hesabınıza aktarmayı teklif eder.

---

## Yedekleme

**Ayarlar → Veriler → Yedek al** ile her şeyi bir JSON dosyasına indirebilir,
**Yedekten geri yükle** ile geri alabilirsiniz. Verileriniz size aittir.
