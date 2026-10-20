---
title: "İç İçe Borulu Isı Değiştiricisi Deney Raporu"
subtitle: "MAK 4097 – Ölçüm ve Analiz Laboratuvarı · DEÜ Makina Mühendisliği Bölümü"
lang: tr
---

# İç İçe Borulu Isı Değiştiricisi Deney Raporu

**Ders:** MAK 4097 – Ölçüm ve Analiz Laboratuvarı
**Bölüm:** Dokuz Eylül Üniversitesi, Makina Mühendisliği
**Deney:** İç İçe (Çift) Borulu Isı Değiştiricisi

> **Önce okuyun: varsayılan değerler.** Föyün fotoğraflanan sayfalarında üç geometrik değer yok. Raporda bunlar için aşağıdaki değerler kabul edildi. Gerçek değerleri föyün Şekil 1'inden veya düzenek üzerinden alıp `hesap.py` dosyasının başındaki satırlara yazarsanız tüm sonuçlar aynı yöntemle yeniden hesaplanır:
>
> | Büyüklük | Kabul edilen değer | Not |
> |---|---|---|
> | Hava venturisi giriş/boğaz çapı $D_A/D_B$ | 40 mm / 20 mm | Föy Şekil 1'den alınmalı |
> | Isı değiştirici boyu $L$ | 1,0 m | Düzenekten ölçülmeli |
> | İç boru et kalınlığı $t$ | 1 mm | $D_1 = 16-2\cdot1 = 14$ mm |
>
> Hocanın notuna göre ısı değiştiricisinde **kovan iç çapı $D_3 = 26$ mm** ve **iç boru dış çapı $D_2 = 16$ mm** alınmıştır.

---

## 1. Amaç

Bu deneyde ters akışlı, iç içe borulu bir ısı değiştiricisinde şu adımlar izlenir:

- İç borudan akan sıcak havanın verdiği ısı ve kovandan (dış halka) akan suyun aldığı ısı hesaplanır.
- Logaritmik ortalama sıcaklık farkı (LMTD) kullanılarak toplam ısı geçiş katsayısı $U$ **deneysel olarak** bulunur.
- Reynolds ve Nusselt sayıları ile taşınım katsayıları ($h_{iç}$, $h_{dış}$) belirlenir ve $U$ **teorik (ampirik) olarak** hesaplanır.
- İki $U$ değeri karşılaştırılır ve farkın nedenleri tartışılır.

## 2. Teori

### 2.1 Venturimetre ile debi ölçümü

Sıkıştırılamaz ve sürtünmesiz, yatay bir akış için Bernoulli denklemi şöyledir:

$$\tfrac12\rho V^2 + p = \text{sabit} \qquad (1)$$

Bu denklem venturinin giriş (A) ve boğaz (B) kesitlerine yazılır:

$$\tfrac12\rho V_A^2 + p_A = \tfrac12\rho V_B^2 + p_B \qquad (2)$$

Süreklilik denklemi şudur:

$$\rho A_A V_A = \rho A_B V_B \;\Rightarrow\; V_A = \left(\frac{D_B}{D_A}\right)^2 V_B \qquad (3),(4)$$

(4) denklemi (2)'de yerine konur ve sürtünme kayıpları $C_D$ venturi katsayısıyla düzeltilir. Böylece boğaz hızı elde edilir:

$$V_B = C_D\sqrt{\frac{2\,\Delta p}{\rho\,(1-\beta^4)}}, \qquad \beta = \frac{D_B}{D_A},\quad C_D\approx 0{,}98 \qquad (5)$$

Kütlesel debi $\dot m = \rho A_B V_B$ bağıntısıyla bulunur. Havanın yoğunluğu, föydeki nota göre venturi giriş sıcaklığında ve standart atmosfer basıncında ideal gaz bağıntısından hesaplanır: $\rho = P/(RT)$.

### 2.2 Aktarılan ısı

Kinetik ve potansiyel enerji değişimleri ihmal edilir. Ayrıca sabit özgül ısı kabul edilirse aktarılan ısı şöyle yazılır:

$$q_{hava} = \dot m_{hava}\,c_{p,hava}\,(T_{giriş}-T_{çıkış})_{hava} \qquad (6)$$
$$q_{su} = \dot m_{su}\,c_{p,su}\,(T_{çıkış}-T_{giriş})_{su} \qquad (7)$$

Föye göre iki değer farklı çıkarsa sonraki hesaplarda **hava tarafındaki değer** esas alınır.

### 2.3 Deneysel toplam ısı geçiş katsayısı

$$q = U A\,\Delta T_{lm} \;\Rightarrow\; U = \frac{q}{(2\pi r_2 L)\,\Delta T_{lm}} \qquad (8)\text{–}(10)$$

Burada $A = 2\pi r_2 L$, iki akışkanın birbirine ısı verdiği **iç borunun dış yüzey alanıdır**. Sıcaklık farkı akış boyunca değiştiği için ortalama sürücü kuvvet olarak logaritmik ortalama sıcaklık farkı kullanılır. Ters akışta bu fark şöyle tanımlanır:

$$\Delta T_{lm} = \frac{\Delta T_1-\Delta T_2}{\ln(\Delta T_1/\Delta T_2)},\qquad \Delta T_1 = T_{h,g}-T_{s,ç},\quad \Delta T_2 = T_{h,ç}-T_{s,g} \qquad (11)$$

Ters akışta sıcaklık farkı boru boyunca daha düzgün ve ortalamada daha yüksek kalır. Bu nedenle aynı giriş sıcaklıklarında paralel akışa göre daha fazla ısı aktarılır.

### 2.4 Ampirik bağıntılar

Reynolds sayısı atalet kuvvetlerinin viskoz kuvvetlere oranıdır. Nusselt sayısı ise yüzeydeki boyutsuz sıcaklık gradyanıdır:

$$Re_D = \frac{\rho V D_h}{\mu} \quad (12) \qquad Nu_D = \frac{h D_h}{k} \quad (13)$$

Tam gelişmiş türbülanslı akış için Dittus–Boelter bağıntısı kullanılır:

$$Nu_D = 0{,}023\,Re_D^{4/5}\,Pr^{n},\quad n=0{,}4\ (\text{ısıtma}),\ n=0{,}3\ (\text{soğutma}) \qquad (14)$$

Bağıntının geçerlilik koşulları: $0{,}6\le Pr\le160$, $Re_D\ge10\,000$, $L/D_h\ge10$.

Dairesel kesitte hidrolik çap borunun iç çapına eşittir ($D_h = D_1$). Halkasal bölgede (kovan) hidrolik çap şöyledir:

$$D_h = D_d - D_i = D_3 - D_2 \qquad (15)$$

Isıl direnç devresi kullanılarak aktarılan ısı ve iç borunun dış yüzeyine göre tanımlı toplam ısı geçiş katsayısı yazılır:

$$q = \frac{2\pi L\,\Delta T_{lm}}{\dfrac{1}{h_{iç} r_1}+\dfrac{1}{k_{çelik}}\ln\dfrac{r_2}{r_1}+\dfrac{1}{h_{dış} r_2}} \qquad (16)$$

$$U_{toplam} = \frac{1}{\dfrac{r_2}{r_1 h_{iç}}+\dfrac{r_2}{k_{çelik}}\ln\dfrac{r_2}{r_1}+\dfrac{1}{h_{dış}}} \qquad (17)$$

## 3. Deney Düzeneği

![Deney düzeneği şeması](sema.png)

**Şekil 1.** Deney düzeneğinin şematik gösterimi. *(Föyde istenen şema elle de çizilecek. Bileşen adları, sensörler, borular, su ve hava akış yönleri şekil üzerinde işaretlenmelidir.)*

| No | Ekipman | Görevi |
|---|---|---|
| 1 | Fan | Havayı sisteme basar |
| 2 | Hava venturisi | Basınç farkından hava debisini ölçmeyi sağlar |
| 3 | Elektronik (dijital) fark basınç ölçer | Hava venturisindeki $\Delta p$'yi Pa cinsinden ölçer |
| 4 | Elektrikli ısıtıcı | Havayı ısıtır (hava akışı başladıktan **sonra** açılır) |
| 5 | Isı değiştiricisi | İç boru (çelik): sıcak hava; dış boru (kovan): su; ters akış |
| 6 | Su deposu | Ortam sıcaklığındaki suyu sağlar |
| 7 | Pompa | Suyu dolaştırır |
| 8 | Su venturisi ($D_A=26$ mm, $D_B=16$ mm) | Su debisini ölçmeyi sağlar |
| 9 | U-manometre | Su venturisindeki $\Delta p$'yi mmSS cinsinden ölçer |
| T1–T4 | Isıl çiftler (termokupl) ve dijital gösterge | Hava ve suyun giriş/çıkış sıcaklıkları |

## 4. Deneyin Yapılışı

1. Venturilerdeki basınç prizlerinin bağlantıları, manometrelerin terazide olduğu ve sıfır ayarları kontrol edildi.
2. Isıl çiftlerin hava giriş-çıkış ve su giriş-çıkış noktalarına doğru bağlandığı kontrol edildi.
3. Fan ve pompa çalıştırıldı. Hava akışının oluştuğundan emin olunduktan **sonra** ısıtıcılar açıldı. Hava akmazken ısıtıcıyı çalıştırmak rezistansın aşırı ısınmasına yol açar.
4. Sıcaklıkların kararlı hale (sürekli rejim) gelmesi için sistem yaklaşık 10 dakika çalıştırıldı.
5. Basınç farkları ve dört sıcaklık denge durumunda okunup Tablo 1'e işlendi.

## 5. Ölçüm Sonuçları

**Tablo 1.** Deney verileri

| Büyüklük | Değer | Büyüklük | Değer |
|---|---|---|---|
| $T_{hava,giriş}$ | 76,5 °C | $T_{hava,çıkış}$ | 50,2 °C |
| $T_{su,giriş}$ | 22,1 °C | $T_{su,çıkış}$ | 24,7 °C |
| $\Delta p_{hava}$ | 328,7 Pa | $\Delta p_{su}$ | 40 mmSS |
| Su venturisi $D_A$ | 26 mm | Su venturisi $D_B$ | 16 mm |
| $\dot m_{hava}$ | 0,00819 kg/s (hesap) | $\dot m_{su}$ | 0,1884 kg/s (hesap) |

**Tablo 2.** Hesaplarda kullanılan geometri ve sabitler

| Büyüklük | Değer | Kaynak |
|---|---|---|
| $D_1$ (iç boru iç çapı) | 14 mm | $D_2-2t$, $t=1$ mm kabul |
| $D_2$ (iç boru dış çapı) | 16 mm | Hoca notu |
| $D_3$ (kovan iç çapı) | 26 mm | Hoca notu |
| $L$ | 1,0 m | **Kabul** |
| $k_{çelik}$ | 60,5 W/m·K | Sade karbon çeliği, 300 K [1, Tablo A.1] |
| $C_D$ | 0,98 | Föy |
| $P_{atm}$, $R_{hava}$ | 101 325 Pa, 287 J/kg·K | Standart atmosfer |

## 6. Hesaplamalar

### 6.1 Termofiziksel özellikler

Özellikler akışkanların **ortalama sıcaklıklarında**, kaynak [1]'in tablolarından doğrusal enterpolasyonla alınmıştır.

**Hava** için ortalama sıcaklık $T_m = (76{,}5+50{,}2)/2 = 63{,}35\ °C = 336{,}5$ K'dir. Değerler Tablo A.4'te 300 K ile 350 K arasından enterpole edildi (oran $= 36{,}5/50 = 0{,}73$):

- $c_p = 1007 + 0{,}73\,(1009-1007) = 1008{,}5$ J/kg·K
- $\mu = [184{,}6 + 0{,}73\,(208{,}2-184{,}6)]\times10^{-7} = 201{,}8\times10^{-7}$ N·s/m²
- $k = [26{,}3 + 0{,}73\,(30{,}0-26{,}3)]\times10^{-3} = 29{,}0\times10^{-3}$ W/m·K
- $Pr = 0{,}707 + 0{,}73\,(0{,}700-0{,}707) = 0{,}702$
- $\rho_m = \dfrac{101325}{287\times336{,}5} = 1{,}049$ kg/m³ (ideal gaz)

**Su** için ortalama sıcaklık $T_m = (22{,}1+24{,}7)/2 = 23{,}4\ °C = 296{,}55$ K'dir. Değerler Tablo A.6'da 295 K ile 300 K arasından enterpole edildi (oran $=0{,}31$):

- $c_p = 4180$ J/kg·K
- $\mu = [959 - 0{,}31\,(959-855)]\times10^{-6} = 926{,}8\times10^{-6}$ N·s/m²
- $k = 0{,}606 + 0{,}31\,(0{,}613-0{,}606) = 0{,}608$ W/m·K
- $Pr = 6{,}62 - 0{,}31\,(6{,}62-5{,}83) = 6{,}375$
- $\rho = 997{,}7$ kg/m³

### 6.2 Hava debisinin hesabı

Venturi giriş sıcaklığında ($76{,}5\ °C = 349{,}65$ K) hava yoğunluğu ideal gaz bağıntısından bulunur:

$$\rho_{hava} = \frac{P_{atm}}{R\,T} = \frac{101325}{287\times349{,}65} = 1{,}0097\ \text{kg/m}^3$$

Çap oranı:

$$\beta = \frac{D_B}{D_A} = \frac{20}{40} = 0{,}5 \;\Rightarrow\; \beta^4 = 0{,}0625$$

Boğaz hızı, Denklem (5) ile:

$$V_B = 0{,}98\sqrt{\frac{2\times328{,}7}{1{,}0097\times(1-0{,}0625)}} = 0{,}98\sqrt{694{,}5} = 0{,}98\times26{,}35 = 25{,}83\ \text{m/s}$$

Boğaz kesit alanı:

$$A_B = \frac{\pi D_B^2}{4} = \frac{\pi\,(0{,}020)^2}{4} = 3{,}142\times10^{-4}\ \text{m}^2$$

Kütlesel debi:

$$\dot m_{hava} = \rho A_B V_B = 1{,}0097\times3{,}142\times10^{-4}\times25{,}83 = \mathbf{8{,}19\times10^{-3}\ kg/s}$$

### 6.3 Su debisinin hesabı

Manometre okuması Pa'ya çevrilir ($1\ \text{mmSS} = \rho_{su} g h = 1000\times9{,}81\times0{,}001 = 9{,}81$ Pa):

$$\Delta p_{su} = 40\times9{,}81 = 392{,}4\ \text{Pa}$$

Çap oranı:

$$\beta = \frac{16}{26} = 0{,}6154 \;\Rightarrow\; \beta^4 = 0{,}1434$$

Boğaz hızı ($\rho_{su}$ = 997,8 kg/m³, 22,1 °C'de):

$$V_B = 0{,}98\sqrt{\frac{2\times392{,}4}{997{,}8\times(1-0{,}1434)}} = 0{,}98\sqrt{0{,}9182} = 0{,}9391\ \text{m/s}$$

Boğaz kesit alanı:

$$A_B = \frac{\pi\,(0{,}016)^2}{4} = 2{,}011\times10^{-4}\ \text{m}^2$$

Kütlesel debi:

$$\dot m_{su} = 997{,}8\times2{,}011\times10^{-4}\times0{,}9391 = \mathbf{0{,}1884\ kg/s}$$

Hacimsel olarak bu debi $1{,}89\times10^{-4}$ m³/s ≈ 11,3 L/dk eder.

### 6.4 Hava ve su tarafında aktarılan ısı (İstenen 2)

Hava tarafı:

$$q_{hava} = 8{,}19\times10^{-3}\times1008{,}5\times(76{,}5-50{,}2) = 8{,}19\times10^{-3}\times1008{,}5\times26{,}3 = \mathbf{217{,}3\ W}$$

Su tarafı:

$$q_{su} = 0{,}1884\times4180\times(24{,}7-22{,}1) = 0{,}1884\times4180\times2{,}6 = \mathbf{2047{,}7\ W}$$

İki değerin oranı $q_{su}/q_{hava} \approx 9{,}4$'tür. Suyun çektiği ısı, havanın verdiği ısıdan yaklaşık 9 kat büyük hesaplanmıştır. Föy gereği sonraki hesaplarda $q = q_{hava} = 217{,}3$ W esas alınmıştır.

### 6.5 İki değer arasındaki farkın nedenleri (İstenen 3)

Fiziksel olarak sıcak hava iç borudadır ve dış ortamla doğrudan temas etmez. Bu nedenle ideal durumda havanın verdiği ısının tamamı suya geçer ve $q_{hava} \approx q_{su}$ olmalıdır. Hesaplanan büyük farkın başlıca nedenleri şunlardır:

1. **Su tarafındaki sıcaklık farkı çok küçük.** Su debisi yüksek, ısıl kapasite oranı ise $C_{su}/C_{hava} = 787{,}6/8{,}26 \approx 95$'tir. Bu yüzden su yalnızca 2,6 K ısınmıştır. Isıl çiftlerin tipik doğruluğu ±0,5–1 K mertebesindedir. Ölçülen 2,6 K'lik fark, bu belirsizlikle aynı mertebededir; tek bir ısıl çiftteki 1 K'lik hata, $q_{su}$'yu ~%40 değiştirir. Enerji dengesinin sağlanması için suyun yalnızca $\Delta T = 217{,}3/(0{,}1884\times4180) = 0{,}28$ K ısınması yeterliydi. Yani su tarafı ölçümü bu debide hassas değildir. Föyün hava tarafını esas almasının nedeni de budur: havada $\Delta T = 26{,}3$ K olduğundan bağıl ölçüm hatası çok küçüktür.
2. **Kovanın çevreyle ısı alışverişi.** Su ortam sıcaklığına yakındır (22–25 °C). Kovan yalıtımsızsa su, ortamdan ve ısıtıcı/fan çevresindeki sıcak yüzeylerden de ısı alabilir. Bu ek ısı da $q_{su}$'ya eklenir.
3. **Pompa işi ve su deposu.** Pompanın verdiği enerjinin bir kısmı sürtünmeyle ısıya dönüşür. Ayrıca kapalı devrede depo sıcaklığı zamanla yükselebilir. Giriş sıcaklığı ölçüm sırasında sabit değilse sürekli rejim kabulü bozulur.
4. **Kararlı hale tam ulaşılamaması.** 10 dakikalık bekleme süresi, kovan ve borunun ısıl kütlesi için yetersiz kalmış olabilir. Bu durumda okunan sıcaklıklar anlık değerlerdir.
5. **Isıl çiftlerin konumu.** Isıl çift akış merkezinde değil de boru cidarına yakın veya metal bağlantı parçasına temas eden bir konumdaysa, ölçülen değer karışım (bulk) sıcaklığını tam yansıtmaz.
6. **Debi ölçümündeki belirsizlikler.**
   - $C_D = 0{,}98$ standart venturi için yaklaşık bir değerdir.
   - U-manometrede ±1 mmSS okuma hatası $\dot m_{su}$'da ~%1,3 hata yapar.
   - Hava venturisi boyutları raporda kabul edilmiştir. Bu boyutlar $\dot m_{hava}$'yı ve dolayısıyla $q_{hava}$'yı doğrudan etkiler. Gerçek boyutlar girildiğinde fark değişecektir.
7. **Hava yoğunluğu hesabı.** Gerçek atmosfer basıncı ve hattaki statik basınç standart değerden farklıdır. Havanın nemi de ihmal edilmiştir.

### 6.6 Logaritmik ortalama sıcaklık farkı ve deneysel U (İstenen 4)

Ters akış için uç sıcaklık farkları:

$$\Delta T_1 = T_{hava,g} - T_{su,ç} = 76{,}5 - 24{,}7 = 51{,}8\ \text{K}$$
$$\Delta T_2 = T_{hava,ç} - T_{su,g} = 50{,}2 - 22{,}1 = 28{,}1\ \text{K}$$

Logaritmik ortalama sıcaklık farkı:

$$\Delta T_{lm} = \frac{51{,}8-28{,}1}{\ln(51{,}8/28{,}1)} = \frac{23{,}7}{\ln 1{,}8434} = \frac{23{,}7}{0{,}6116} = \mathbf{38{,}75\ K}$$

Isı transfer alanı (iç borunun dış yüzeyi):

$$A_2 = 2\pi r_2 L = \pi D_2 L = \pi\times0{,}016\times1{,}0 = 0{,}05027\ \text{m}^2$$

Deneysel toplam ısı geçiş katsayısı, hava tarafındaki ısı esas alınarak:

$$U_{deneysel} = \frac{q_{hava}}{A_2\,\Delta T_{lm}} = \frac{217{,}3}{0{,}05027\times38{,}75} = \mathbf{111{,}6\ W/m^2K}$$

Karşılaştırma için: $q_{su}$ esas alınsaydı $U = 2047{,}7/(0{,}05027\times38{,}75) \approx 1051$ W/m²K çıkardı. Bu değer, hava-su ısı değiştiricisi için fiziksel olarak mümkün değildir, çünkü hava tarafı direnci $U$'yu sınırlar (bkz. 6.9). Bu da hava tarafının esas alınmasının doğru olduğunu gösterir.

### 6.7 Reynolds sayıları (İstenen 5)

**Hava (iç boru, dairesel kesit, $D_h = D_1 = 14$ mm).**

Kesit alanı:

$$A_1 = \frac{\pi D_1^2}{4} = \frac{\pi\,(0{,}014)^2}{4} = 1{,}539\times10^{-4}\ \text{m}^2$$

Ortalama hız:

$$V_{hava} = \frac{\dot m}{\rho_m A_1} = \frac{8{,}19\times10^{-3}}{1{,}049\times1{,}539\times10^{-4}} = 50{,}7\ \text{m/s}$$

Reynolds sayısı:

$$Re_{hava} = \frac{\rho V D_1}{\mu} = \frac{4\dot m}{\pi D_1 \mu} = \frac{4\times8{,}19\times10^{-3}}{\pi\times0{,}014\times201{,}8\times10^{-7}} = \mathbf{36\,900}$$

Akış türbülanslıdır.

**Su (halkasal bölge).** Hidrolik çap ve kesit alanı:

$$D_h = D_3 - D_2 = 26 - 16 = 10\ \text{mm}$$
$$A_{halka} = \frac{\pi}{4}(D_3^2 - D_2^2) = \frac{\pi}{4}(0{,}026^2-0{,}016^2) = 3{,}299\times10^{-4}\ \text{m}^2$$

Ortalama hız:

$$V_{su} = \frac{0{,}1884}{997{,}7\times3{,}299\times10^{-4}} = 0{,}572\ \text{m/s}$$

Reynolds sayısı:

$$Re_{su} = \frac{997{,}7\times0{,}572\times0{,}010}{926{,}8\times10^{-6}} = \mathbf{6\,160}$$

$2300 < Re < 10\,000$ olduğundan akış **geçiş bölgesindedir**.

### 6.8 Nusselt sayıları ve taşınım katsayıları (İstenen 6)

**İç boru, hava soğuyor → $n = 0{,}3$:**

$$Nu_{hava} = 0{,}023\,(36\,900)^{0{,}8}(0{,}702)^{0{,}3} = 0{,}023\times4506\times0{,}8995 = \mathbf{93{,}2}$$

$$h_{iç} = \frac{Nu\,k}{D_1} = \frac{93{,}2\times0{,}0290}{0{,}014} = \mathbf{193\ W/m^2K}$$

**Halka, su ısınıyor → $n = 0{,}4$:**

$$Nu_{su} = 0{,}023\,(6\,160)^{0{,}8}(6{,}375)^{0{,}4} = 0{,}023\times1076\times2{,}098 = \mathbf{51{,}9}$$

$$h_{dış} = \frac{Nu\,k}{D_h} = \frac{51{,}9\times0{,}608}{0{,}010} = \mathbf{3158\ W/m^2K}$$

Su tarafında $Re<10\,000$ olduğu için, kontrol amacıyla geçiş bölgesinde de geçerli olan Gnielinski bağıntısı da uygulanmıştır ($3000\le Re\le5\times10^6$) [1, Denk. 8.62]. Sürtünme faktörü:

$$f = (0{,}790\ln Re - 1{,}64)^{-2} = 0{,}0362$$

Nusselt sayısı:

$$Nu = \frac{(f/8)(Re-1000)Pr}{1+12{,}7\sqrt{f/8}\,(Pr^{2/3}-1)} = 48{,}3$$

Buradan $h_{dış} = 2940$ W/m²K bulunur. Bu değer Dittus–Boelter sonucundan yalnızca ~%7 farklıdır.

### 6.9 Teorik toplam ısı geçiş katsayısı (İstenen 7)

Yarıçaplar: $r_1 = 7$ mm, $r_2 = 8$ mm. Denklem (17)'deki terimler (iç borunun dış yüzeyine göre, m²K/W):

| Direnç terimi | Hesap | Değer | Pay |
|---|---|---|---|
| İç taşınım $\dfrac{r_2}{r_1h_{iç}}$ | $\dfrac{0{,}008}{0{,}007\times193}$ | $5{,}920\times10^{-3}$ | %94,7 |
| Cidar iletimi $\dfrac{r_2}{k}\ln\dfrac{r_2}{r_1}$ | $\dfrac{0{,}008}{60{,}5}\ln\dfrac{8}{7}$ | $1{,}77\times10^{-5}$ | %0,3 |
| Dış taşınım $\dfrac{1}{h_{dış}}$ | $\dfrac{1}{3158}$ | $3{,}167\times10^{-4}$ | %5,1 |
| **Toplam** | | $6{,}254\times10^{-3}$ | |

$$U_{teorik} = \frac{1}{6{,}254\times10^{-3}} = \mathbf{159{,}9\ W/m^2K}$$

Su tarafında Gnielinski kullanılırsa $U_{teorik} = 159{,}3$ W/m²K bulunur; sonuç neredeyse değişmez. Denklem (16) ile teorik ısı akışı:

$$q_{teorik} = U A_2 \Delta T_{lm} = 159{,}9\times0{,}05027\times38{,}75 = 311\ \text{W}$$

**Bağıntı koşullarının kontrolü:**

| Koşul | Hava (iç boru) | Su (halka) |
|---|---|---|
| $0{,}6\le Pr\le160$ | $Pr=0{,}702$ ✔ | $Pr=6{,}375$ ✔ |
| $Re\ge10\,000$ | $Re=36\,900$ ✔ | $Re=6\,160$ ✘ (geçiş bölgesi) |
| $L/D_h\ge10$ | $L/D_1 = 1/0{,}014 = 71$ ✔ | $L/D_h = 1/0{,}010 = 100$ ✔ |

Hava tarafı Dittus–Boelter'in tüm koşullarını sağlar. Su tarafında Reynolds koşulu **sağlanmamaktadır**. Su debisi düşük, halkanın hidrolik çapı küçük ve suyun viskozitesi yüksek olduğu için akış tam türbülanslı değildir. Dittus–Boelter bu bölgede taşınım katsayısını genelde olduğundan büyük tahmin eder. Ancak su tarafının toplam dirence katkısı yalnızca %5 olduğundan, bu hatanın $U_{teorik}$ üzerindeki etkisi küçüktür (Gnielinski ile fark %0,4). Ayrıca Dittus–Boelter dairesel boru için türetilmiştir. Halkasal kesitte hidrolik çap yaklaşımı yaklaşık sonuç verir; özellikle iç çeper ısıtıldığında halkada gerçek Nu değeri farklı olabilir [1, Bölüm 8.6].

**Deneysel ve teorik U'nun karşılaştırılması:**

$$\frac{U_{teorik}-U_{deneysel}}{U_{teorik}} = \frac{159{,}9-111{,}6}{159{,}9} = \%30$$

Deneysel değer teorik değerden ~%30 düşüktür. Olası nedenler:

- **Kirlilik (fouling) direnci:** Kullanılmış bir düzenekte çelik borunun su tarafında kireç/pas, hava tarafında is/toz birikir. Bu ek dirençler teorik hesapta yoktur.
- **Giriş bölgesi ve tam gelişmemiş akış:** Bağıntılar tam gelişmiş akış içindir. Bu fark normalde girişte $h$'yi artırır, ancak giriş ağzındaki akış düzensizlikleri ve bağlantı parçaları belirsizlik yaratır.
- **Ampirik bağıntıların belirsizliği:** Dittus–Boelter'in kendi hata payı ±%25 mertebesindedir [1]. Su tarafında geçiş bölgesi koşulu da sağlanmamaktadır.
- **Özellik değişimi:** Hava 26 K soğurken $\mu$, $k$ ve $\rho$ değişir. Ortalama sıcaklıkta özellik almak bir yaklaşımdır. Ayrıca cidar ile akışkan arasındaki sıcaklık farkı büyük olduğundan, özellik değişimi düzeltmesi (Sieder–Tate gibi) ihmal edilmiştir.
- **Ölçüm hataları:** $U_{deneysel}$ doğrudan $\dot m_{hava}$'ya bağlıdır. Hava venturisi boyutları ve $C_D$ kabulü, ısıl çift hataları ve $L$ kabulü bu değeri etkiler. Örneğin gerçek $L$ 1 m'den kısaysa $U_{deneysel}$ artar ve fark kapanır.
- **Isı kayıpları:** Havanın venturi/ısıtıcı ile ısı değiştirici arasındaki borularda çevreye ısı vermesi ve uçlardaki eksenel iletim, gerçek ısı geçişini etkiler.
- **Yüzey pürüzlülüğü ve geometri:** Bağıntılar düzgün, eş merkezli borular içindir. İç borunun kovan içinde tam merkezde olmaması (eksantriklik) halka tarafındaki taşınımı değiştirir.

### 6.10 Sistemin uygulanabilirliği (İstenen 8)

- **Hava tarafı kontrol eder.** Toplam direncin ~%95'i hava tarafındadır ($h_{iç}\approx193 \ll h_{dış}\approx3160$ W/m²K). Bu nedenle $U$, $h_{iç}$'nin biraz altında kalır. Su debisini artırmak ısı geçişini neredeyse hiç iyileştirmez; yalnızca pompa gücünü artırır. Cidar direnci (%0,3) ihmal edilebilir, yani boru malzemesini (ör. bakıra) değiştirmek de anlamlı bir kazanç sağlamaz.
- **Etkinlik düşüktür.** $C_{min} = C_{hava} = 8{,}26$ W/K ve $C_r = 0{,}0105$'tir. Etkinlik $\varepsilon = q/[C_{min}(T_{h,g}-T_{s,g})] = 217{,}3/(8{,}26\times54{,}4) = 0{,}48$, $NTU = UA/C_{min} = 0{,}68$'dir. Hava, suyun sıcaklığına yaklaşamadan (50 °C) çıkmaktadır.
- **Gereken alan büyüktür.** $U\approx110$–160 W/m²K değerleri, gaz-sıvı ısı değiştiricileri için literatürdeki tipik aralıkla (10–250 W/m²K [1, Tablo 11.2]) uyumludur. Ancak çift borulu yapı birim hacim başına az alan sunar. Örneğin $\varepsilon=0{,}9$ için $NTU\approx2{,}3$ gerekir, bu da yaklaşık 3,4 kat daha uzun bir boru demektir.
- **İyileştirme önerileri:**
  - Hava tarafına kanat (fin) eklemek ya da iç boruya türbülatör/burgulu şerit yerleştirmek $h_{iç}$'yi ve alanı artırır.
  - Hava hızı artırılabilir; ancak 50 m/s civarındaki mevcut hız zaten yüksektir ve basınç kaybı ile fan gücü hızla artar.
  - Daha az su debisi kullanılabilir. Su tarafı zaten kontrol etmediği için bu hem pompa gücünü azaltır hem de su $\Delta T$'sini büyütür; su tarafı ölçüm hassasiyeti artar ve enerji dengesi daha güvenilir kontrol edilir.
  - Kovanın dışı yalıtılmalı, ölçümler daha uzun bir dengeye ulaşma süresinden sonra yapılmalıdır.
- **Sonuç:** Mevcut sistem, küçük ısıl yüklerde (yüzlerce W) gazdan sıvıya ısı geri kazanımı veya eğitim amaçlı kullanım için uygundur. Yüksek kapasiteli endüstriyel hava-su uygulamaları için ise kanatlı borulu veya plakalı/gövde-borulu ısı değiştiriciler daha uygundur.

## 7. Sonuç Tablosu

| Büyüklük | Değer |
|---|---|
| $\dot m_{hava}$ | 8,19×10⁻³ kg/s |
| $\dot m_{su}$ | 0,1884 kg/s |
| $q_{hava}$ / $q_{su}$ | 217,3 W / 2047,7 W |
| $\Delta T_{lm}$ | 38,75 K |
| $Re_{hava}$ / $Re_{su}$ | 36 900 / 6 160 |
| $Nu_{hava}$ / $Nu_{su}$ | 93,2 / 51,9 |
| $h_{iç}$ / $h_{dış}$ | 193 / 3158 W/m²K |
| $U_{deneysel}$ | 111,6 W/m²K |
| $U_{teorik}$ | 159,9 W/m²K |
| Fark | %30 |
| Etkinlik $\varepsilon$ / NTU | 0,48 / 0,68 |

Deneyde hava tarafından 217 W ısı suya aktarılmış, deneysel toplam ısı geçiş katsayısı 112 W/m²K bulunmuştur. Ampirik bağıntılarla hesaplanan teorik değer 160 W/m²K'dir. Aradaki ~%30'luk fark kirlilik direnci, bağıntı belirsizlikleri, su tarafının geçiş rejiminde olması ve ölçüm/kabul belirsizlikleriyle açıklanabilir. Su tarafı ısı hesabındaki büyük sapma, yüksek su debisi nedeniyle çok küçük kalan sıcaklık farkının (2,6 K) ısıl çift hassasiyetine yakın olmasından kaynaklanır. Isı değiştiricinin performansını hava tarafı taşınımı belirlemektedir.

## 8. Kaynakça

[1] Incropera, F. P., DeWitt, D. P., Bergman, T. L., & Lavine, A. S. (2007). *Fundamentals of Heat and Mass Transfer* (6th ed.). John Wiley & Sons. Tablo A.1 (çelik), A.4 (hava), A.6 (doymuş su), Denk. 8.60 (Dittus–Boelter), Denk. 8.62 (Gnielinski), Tablo 11.2 (tipik U değerleri).

[2] DEÜ Makina Mühendisliği Bölümü, *MAK 4097 Ölçüm ve Analiz Laboratuvarı – İç İçe Borulu Isı Değiştiricisi Deney Föyü*.

[3] Çengel, Y. A., & Ghajar, A. J. (2015). *Heat and Mass Transfer: Fundamentals and Applications* (5th ed.). McGraw-Hill. Bölüm 11 (Isı değiştiricileri), Bölüm 8 (boru içi akış).

---

*Not: Tüm sayısal sonuçlar `hesap.py` betiğiyle üretilmiştir. Varsayılan geometrik değerler değiştirildiğinde betiği `python3 hesap.py` ile yeniden çalıştırıp çıktıdaki değerleri rapora aktarın.*
