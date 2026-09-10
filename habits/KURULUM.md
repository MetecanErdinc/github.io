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
https://metecanerdinc.github.io/github.io/habits/
```

> İlk yayın birkaç dakika sürebilir. Settings → Pages ekranının üstünde
> "Your site is live at …" yazısı çıkınca hazırdır.
>
> Bu dala her yeni değişiklik gönderildiğinde site kendiliğinden güncellenir.
> İleride çalışmayı `main` dalına birleştirirseniz Pages kaynağını da `main`
> olarak geri değiştirebilirsiniz — zorunlu değil.

Depodaki mevcut siteniz (Mühendislik Analiz Yorumlayıcı) etkilenmez; o da aynı
dalda duruyor ve `https://metecanerdinc.github.io/github.io/` adresinde çalışmaya
devam eder.

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
2. İçerideki her şeyi silip bu depodaki `habits/firestore.rules` dosyasının
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

1. GitHub'da depoyu açın → `habits/config.js` dosyasına girin
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

1. Uygulamayı açın: `https://metecanerdinc.github.io/github.io/habits/`
2. **Hesap oluştur** sekmesi → e-posta + şifre (en az 6 karakter) → **Hesabı oluştur**
3. Diğer cihazlarınızda **aynı e-posta ve şifreyle** *Giriş yap* deyin.

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

**Sayfa eski hâlini gösteriyor**
Service worker eski sürümü önbelleklemiş olabilir. Sayfayı kapatıp açın; Windows'ta
`Ctrl + Shift + R` ile zorla yenileyin.

**Şifremi unuttum**
Giriş ekranında **Şifremi unuttum** → e-postanıza sıfırlama bağlantısı gelir.

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
