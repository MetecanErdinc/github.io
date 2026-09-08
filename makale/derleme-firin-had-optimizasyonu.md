# Ev Tipi ve Endüstriyel Fırınlarda Fan ve Hava Kanalı Geometrisinin Hesaplamalı Akışkanlar Dinamiği ile Optimizasyonu: Kapsamlı Bir Derleme

> **Sürüm notu.** Bu dosya, makalenin bölüm bölüm yazılmış taslaklarının birleştirilmiş, hataları düzeltilmiş ve eksikleri tamamlanmış hâlidir. Kaynakçadaki 44 kaydın tamamının künyesi birincil kaynağından doğrulanmış, doğrulanamayan kayıtlar metinden çıkarılmıştır. Yapılan tüm düzeltmelerin gerekçeli dökümü **Ek A**'da, kaynakçaya eklenen çalışmaların listesi ve her birinin makalede nasıl kullanıldığı **Ek B**'dedir. Kaynakça IEEE stiline göre, metinde ilk geçiş sırasına göre numaralandırılmıştır.

---

## ÖZET

Konveksiyonlu fırınlarda kavite içi sıcaklık homojenliğinin sağlanması, hem gıda kalitesi hem de enerji verimliliği açısından kritik bir mühendislik problemidir. Bu derleme, ev tipi ve endüstriyel fırınlarda fan ile hava kanalı geometrisinin Hesaplamalı Akışkanlar Dinamiği (HAD) aracılığıyla optimizasyonuna yönelik literatürü sistematik biçimde incelemektedir. 1974-2026 döneminde yayımlanmış, 44 kaynaktan oluşan bir havuz taranmış; bu havuzun 36'sı doğrudan fırın uygulamalarına ilişkin özgün araştırma, derleme veya tez, 5'i türbülans modellemesi ve sayısal belirsizlik alanının temel metodolojik referansı, 3'ü ise düzenleyici metin ve standarttır. İnceleme; ısı transferi mekanizmaları, HAD modelleme yaklaşımları, fan tasarım parametreleri, fan koruma sacı (FKS) ve hava kanalı geometrisi, enerji verimliliği standartları, sıcaklık homojenliği metrikleri ve deneysel doğrulama yöntemleri başlıkları altında yürütülmüştür.

Bulgular, sıcaklık homojenliğinin temelde bir akış tasarımı problemi olduğunu göstermektedir: FKS delik konfigürasyonu ve hava kanalı geometrisi, sıcaklık dağılımı üzerinde fanın kendisi kadar belirleyicidir ve bu üç bileşen birbirinden bağımsız optimize edilemez. Modelleme tercihlerinde son dönemde k-ω SST türbülans modeli öne çıkmış; ışınımın 200 °C üzeri çalışma sıcaklıklarında ihmal edilemeyeceği, elektrikli fırınlarda yüzeyler arası (S2S) yaklaşımın yeterli olduğu, yanma ürünlerinin ortama katıldığı gazlı fırınlarda ise hacimsel çözüm yapan Ayrık Ordinatlar (DO) modelinin gerektiği belirlenmiştir. Fan modellemesinde Hareketli Referans Çerçevesi (MRF) yaklaşımı yaygın tercih olarak öne çıkmaktadır. Buna karşılık literatürde ağ yakınsama belirsizliğinin nicel raporlanması (GCI), çok amaçlı optimizasyon ve pişirme tabanlı performans ölçütlerinin kullanımı hâlâ istisnai kalmaktadır. Mevcut araştırma boşlukları tartışılmış ve gelecek çalışmalar için öneriler sunulmuştur.

**Anahtar Kelimeler:** Fırın, hesaplamalı akışkanlar dinamiği, sıcaklık homojenliği, fan optimizasyonu, hava kanalı, fan koruma sacı, zorlanmış konveksiyon, enerji verimliliği, derleme

---

## ABSTRACT

Achieving temperature uniformity inside the cavity of convection ovens is a critical engineering problem for both food quality and energy efficiency. This review systematically examines the literature on the optimization of fan and air-duct geometry in domestic and industrial ovens by means of Computational Fluid Dynamics (CFD). A pool of 44 sources published between 1974 and 2026 was screened; 36 are original studies, reviews or theses directly addressing oven applications, 5 are foundational methodological references on turbulence modelling and numerical uncertainty, and 3 are regulatory texts and standards. The review is organized under the headings of heat transfer mechanisms, CFD modelling approaches, fan design parameters, fan-baffle (FKS) and air-duct geometry, energy efficiency standards, temperature uniformity metrics, and experimental validation methods.

The findings show that temperature uniformity is fundamentally a flow-design problem: the hole configuration of the fan baffle and the air-duct geometry are as decisive as the fan itself, and these three components cannot be optimized independently. Among modelling choices, the k-ω SST turbulence model has become prominent in recent work; radiation cannot be neglected above 200 °C; the surface-to-surface (S2S) approach is adequate for electric ovens, whereas gas ovens, in which combustion products participate in radiation, require a volumetric solver such as Discrete Ordinates (DO). The Moving Reference Frame (MRF) approach dominates fan modelling. By contrast, quantitative reporting of grid-convergence uncertainty (GCI), multi-objective optimization and baking-based performance metrics remain exceptional. Research gaps are discussed and directions for future work are proposed.

**Keywords:** Oven, computational fluid dynamics, temperature uniformity, fan optimization, air duct, fan baffle, forced convection, energy efficiency, review

---

## 1. GİRİŞ

Elektrikli ev aletleri, günümüz modern yaşamının vazgeçilmez bileşenleri arasında yer almaktadır. Bu aletler arasında konveksiyonlu fırınlar, hem ev tipi mutfaklarda hem de endüstriyel gıda hazırlama tesislerinde en yaygın kullanılan pişirme cihazlarından birini oluşturmaktadır. Hanelerdeki elektrik enerjisi tüketim dağılımı incelendiğinde, fırınların yaklaşık %10'luk bir paya sahip olduğu görülmekte olup bu değer, buzdolabı (%30) ve aydınlatma (%28) kalemlerinin ardından üçüncü sırada yer almaktadır [1]. Bu oran, fırınların enerji verimliliğinin artırılmasının yalnızca bireysel enerji maliyetlerinin düşürülmesi açısından değil, aynı zamanda ulusal enerji politikaları ve çevresel sürdürülebilirlik hedefleri açısından da kritik bir önem taşıdığını ortaya koymaktadır. Küresel ölçekte enerji talebinin hızla artması, bu artışın büyük ölçüde fosil yakıtlarla karşılanıyor olması ve buna bağlı olarak çevre ile iklim değişikliğine ilişkin sorunların derinleşmesi, enerji verimliliği kavramını günümüzün en öncelikli konularından biri hâline getirmiştir. Gün [2]'ün aktardığı Uluslararası Enerji Ajansı verilerine göre dünya birincil enerji talebi 14 milyar ton eşdeğer petrol (TEP) düzeyinde olup, mevcut tüketim eğilimlerinin sürmesi hâlinde bu talebin yaklaşık %45 artarak 20,3 milyar TEP seviyesine ulaşması beklenmektedir. Bu bağlamda, sanayiden hanelere kadar her düzeyde enerji verimliliğinin artırılması stratejik bir gereklilik olarak karşımıza çıkmaktadır.

Avrupa Birliği, ev tipi fırınlar dâhil olmak üzere elektrikli ev aletlerinin enerji tüketimini düzenlemek amacıyla bağlayıcı bir mevzuat çerçevesi oluşturmuştur. 2009/125/EC sayılı Ekotasarım Direktifi'ni uygulayan **Komisyon Tüzüğü (AB) No 66/2014**, ev tipi fırınlar, ocaklar ve davlumbazlar için ekotasarım gerekliliklerini belirlemekte; **Komisyon Delege Tüzüğü (AB) No 65/2014** ise bu ürünlerin enerji etiketlemesini düzenlemektedir [3], [4]. 66/2014 sayılı Tüzük 20 Şubat 2014'te yürürlüğe girmiş ve enerji tüketim limitlerini kademeli olarak sıkılaştırmıştır; yürürlüğe girişten beş yıl sonra, yani 2019 itibarıyla, elektrikli ev tipi fırınların AB pazarında satılabilmesi için Enerji Verimlilik İndeksi'nin (EEI) 96'nın altında kalması şartı getirilmiştir [3]. EEI hesabının dayandığı ölçüm yöntemleri **EN IEC 60350-1** standardında tanımlanmıştır [5]. Bu düzenleyici baskılar, beyaz eşya sektöründeki firmalar için enerji verimlilik çalışmalarını zorunlu bir rekabet parametresi hâline getirmiş; ısıl verimlilik artırma [6] ve fırın kapağı tasarımı [7] gibi başlıklarda yoğun bir uygulamalı araştırma faaliyeti doğurmuştur.

Fırın tasarımında enerji verimliliğinin yanı sıra eşit derecede kritik olan bir diğer performans parametresi, pişirme kavitesi içindeki sıcaklık dağılımının homojenliğidir. Homojen olmayan sıcaklık dağılımı, yaygın olarak "soğuk noktalar" (cold spots) ve "sıcak noktalar" (hot spots) olarak adlandırılan düşük ve yüksek sıcaklık bölgelerinin oluşmasına neden olmaktadır. Bu bölgesel sıcaklık farklılıkları, fırın içindeki gıdanın eşit olmayan biçimde pişmesine, düzensiz kızarma profiline, tutarsız nem kaybına ve genel pişirme kalitesinin bozulmasına yol açmaktadır [8], [9]. Yang ve ark. [8] tarafından 13 noktalı termokupl dizisiyle gerçekleştirilen ölçümlerde, bir fırın kavitesindeki farklı ölçüm noktaları arasındaki sıcaklık farkının 10 °C ve üzerine çıkabildiği raporlanmıştır. Benzer şekilde Pala ve ark. [10], çok raflı endüstriyel fırınlarda tepsiler arasındaki farkı, kaynakta bağıl sıcaklık sapması olarak bildirilen biçimiyle %12,76 düzeyinde tespit etmişlerdir. Dolayısıyla hem tüketici memnuniyeti hem de gıda güvenliği açısından fırın kavitesi içinde homojen bir sıcaklık alanının sağlanması temel bir tasarım hedefi olarak karşımıza çıkmaktadır.

Fırın kavitesi içindeki ısı transferi; iletim (kondüksiyon), taşınım (konveksiyon) ve ışınım (radyasyon) mekanizmalarının eş zamanlı ve birbirine bağlı etkileşimi sonucunda gerçekleşmektedir. Isıtma elemanları ve fırın duvarlarının sıcak yüzeylerinden yayılan termal ışınım, kavitedeki temel ısı kaynaklarından birini oluşturmaktadır. Hassan ve ark. [11], ev tipi pişirme fırınlarında doğal ve zorlanmış konveksiyon modları altında ışınım ısı transferi dağılımını ağ (network) temsili yöntemiyle incelemiş ve ışınımın zorlanmış konveksiyon modunda da kayda değer bir paya sahip olduğunu göstermişlerdir. Hincapié ve García [12], ev tipi bir gaz fırınında doğal konveksiyonun baskın ısı transferi mekanizması olduğunu ve ışınımın taban plakasının ısıtılmasına yalnızca sınırlı bir katkı sağladığını belirlemişlerdir. Zorlanmış konveksiyonlu elektrikli fırınlarda ise sirkülasyon fanının oluşturduğu türbülanslı hava akışı ısı transferinin baskın mekanizmasını oluşturmakta ve kavite içindeki sıcaklık dağılımını doğrudan belirlemektedir [8], [13]. Bu mekanizmaların göreceli önemi; fırının çalışma moduna (statik/fanlı), yakıt tipine (elektrik/gaz), çalışma sıcaklığına ve iç geometrisine bağlı olarak önemli ölçüde değişmektedir.

Fırın kavitesi içindeki sıcaklık dağılımını etkileyen tasarım parametreleri arasında fan özellikleri ve hava kanalı geometrisi en belirleyici faktörler olarak öne çıkmaktadır. Fan tipi (radyal veya tanjansiyel), devir sayısı (RPM), dönüş yönü, kanat açısı ve kanat geometrisi gibi fan parametreleri, kavite içindeki hava sirkülasyonunun debisi ve deseni üzerinde doğrudan etkilidir [13], [14], [15]. Bununla birlikte fan koruma sacı (FKS/baffle) tasarımı — üzerindeki deliklerin konumu, boyutu, şekli ve dağılımı — fanın ürettiği hava akışının kavite içine nasıl yönlendirildiğini belirleyen kritik bir bileşendir [2], [16], [17]. Hava perdesi tasarımı, menfez/nozul konumu ve boyutu ile hava basma-emme ağzı geometrisi gibi hava kanalı parametreleri de sıcaklık homojenliği üzerinde güçlü bir etkiye sahiptir [10], [18]. Tüm bu parametrelerin karmaşık etkileşimi, geleneksel deneme-yanılma yöntemleriyle etkin biçimde taranamayacak kadar çok boyutlu bir tasarım uzayı oluşturmaktadır.

Bu noktada Hesaplamalı Akışkanlar Dinamiği (HAD), fırın tasarım sürecinin vazgeçilmez bir aracı hâline gelmiştir. HAD, fiziksel prototip üretimi gerektirmeden farklı tasarım alternatiflerinin bilgisayar ortamında hızlı ve düşük maliyetli olarak değerlendirilmesini sağlamaktadır [19], [20]. Verboven ve ark. [21], [22], 2000 yılında zorlanmış konveksiyonlu bir fırında k-ε türbülans modeli kullanarak HAD modelini deneysel verilerle doğrulamış ve bu alandaki öncü çalışmalardan birini gerçekleştirmişlerdir. O tarihten bu yana türbülans modellerinde (Launder ve Spalding'in standart k-ε modelinden [23] Realizable k-ε [24] ve k-ω SST [25] formülasyonlarına), ışınım modellerinde (Ayrık Ordinatlar/DO [26], yüzeyden yüzeye/S2S ve görüş faktörü tabanlı yaklaşımlar [27], [28]) ve fan modelleme tekniklerinde (Hareketli Referans Çerçevesi — MRF [15], Kayan Ağ) kayda değer ilerlemeler kaydedilmiştir. ANSYS Fluent, ANSYS CFX, SolidWorks Flow Simulation ve FloEFD gibi farklı ticari yazılım platformlarının fırın tasarımındaki uygulanabilirliği çeşitli çalışmalarda gösterilmiştir [6], [8], [13], [16], [18].

Son yıllarda HAD analizlerinin optimizasyon yöntemleriyle birleştirilmesi araştırma alanını daha da zenginleştirmiştir. Taguchi deney tasarımı [29], genetik algoritma [30] ve Pareto tabanlı çok amaçlı optimizasyon çerçeveleri [31], [32], sistematik parametre taraması ve birbiriyle çelişen hedeflerin (sıcaklık homojenliği ile enerji tüketimi) eş zamanlı ele alınması imkânı sunmaktadır.

Fırın-HAD literatürü, beyaz eşya mühendisliği kaynaklı çalışmaların yanı sıra gıda mühendisliği kaynaklı güçlü bir damara da sahiptir. Chhanwal ve ark. [33] elektrikli bir pişirme fırınını, Boulet ve ark. [34] pilot ölçekli bir fırın kavitesini, Therdthai ve ark. [35] ile Wong ve ark. [36] sürekli endüstriyel tünel fırınlarını, Ploteau ve ark. [37] ise kesikli bir ekmek fırınını HAD ile modellemiş ve deneysel olarak karakterize etmiştir. Bu damar, kavitedeki akış alanının yalnızca sıcaklık dağılımını değil, nihai ürün kalitesini — özellikle esmerleşme (browning) davranışını [38] — nasıl belirlediğine dair kavramsal çerçeveyi sağlamaktadır. Buna paralel olarak, enerji tüketimini HAD yerine düşük mertebeli dinamik modellerle inceleyen bir literatür de gelişmiştir [39]; bu yaklaşım kavite içi alan bilgisini vermez, ancak çevrim düzeyinde enerji analizinde HAD'a tamamlayıcı bir araç sunar.

Nihayet, sayısal sonuçların güvenilirliği ağ yakınsamasının nicel olarak raporlanmasına bağlıdır. Roache [40] tarafından önerilen ve Celik ve ark. [41] tarafından ASME için standartlaştırılan Ağ Yakınsama İndeksi (Grid Convergence Index, GCI), Richardson ekstrapolasyonuna dayalı olarak ayrıklaştırma belirsizliğini nicel biçimde tahmin etmektedir.

Mevcut literatürde, bu farklı yaklaşımları bütünleşik bir çerçevede ele alan, farklı HAD modelleme stratejilerini karşılaştırmalı olarak değerlendiren ve araştırma boşluklarını sistematik biçimde tanımlayan kapsamlı bir derleme çalışmasının eksikliği dikkat çekmektedir. Bu derleme makalesi, söz konusu boşluğu doldurmak amacıyla ev tipi ve endüstriyel fırınlarda fan ve hava kanalı geometrisinin HAD ile optimizasyonu konusundaki mevcut bilgi birikimini derleyip sentezlemeyi hedeflemektedir. Makalenin geri kalanı şu şekilde düzenlenmiştir: 2. Bölüm'de literatür tarama yöntemi açıklanmakta; 3. Bölüm'de fırınlardaki ısı transferi ve termo-akışkan dinamiği ele alınmakta; 4. Bölüm'de HAD modelleme yaklaşımları karşılaştırmalı olarak değerlendirilmekte; 5. ve 6. Bölümler'de sırasıyla fan tasarım parametreleri ile hava kanalı ve FKS geometrisi incelenmekte; 7. Bölüm'de enerji verimliliği standartları ve iyileştirme stratejileri, 8. Bölüm'de sıcaklık homojenliği metrikleri, 9. Bölüm'de deneysel doğrulama yöntemleri tartışılmakta; 10. Bölüm'de araştırma boşlukları ve gelecek çalışma önerileri sunulmakta, 11. Bölüm'de ise sonuçlar özetlenmektedir.

---

## 2. YÖNTEM

Bu derleme, dar ve iyi tanımlanmış bir teknik soruya odaklandığı için nicel bir meta-analiz değil, yapılandırılmış bir nitel sentez olarak kurgulanmıştır. Tarama süreci aşağıdaki adımlarla yürütülmüştür.

**2.1. Veri tabanları ve arama dizeleri.** Tarama; Scopus, Web of Science, ScienceDirect, SpringerLink ve Google Scholar üzerinde İngilizce, DergiPark ve YÖK Ulusal Tez Merkezi üzerinde Türkçe olarak yapılmıştır. İngilizce arama dizeleri `("oven" OR "baking oven" OR "domestic oven") AND ("CFD" OR "computational fluid dynamics") AND ("temperature uniformity" OR "fan" OR "air duct" OR "baffle")` çekirdeği üzerine kurulmuş; Türkçe aramalarda `fırın`, `hesaplamalı akışkanlar dinamiği`, `sıcaklık dağılımı`, `fan koruma sacı`, `hava perdesi`, `enerji verimliliği` anahtar kelimeleri kullanılmıştır.

**2.2. Dâhil etme ve dışlama ölçütleri.** Dâhil edilenler: (i) ev tipi veya endüstriyel bir pişirme/ısıtma fırınının kavite içi akış ve/veya ısı transferini konu edinen, (ii) sayısal (HAD) ve/veya deneysel özgün veri sunan, (iii) hakemli dergi, hakemli konferans bildirisi veya lisansüstü tez formatındaki çalışmalar. Ayrıca, metodolojik tartışmayı temellendirmek üzere türbülans modellerinin ve sayısal belirsizlik prosedürlerinin **birincil kaynakları** ile yürürlükteki **düzenleyici metin ve standartlar** kapsama alınmıştır. Dışlananlar: mikrodalga ve endüksiyonlu pişirme, kurutma fırınları, ısıl işlem/metalurji fırınları ve yalnızca gıda içi ısı-kütle transferini modelleyen, kavite akışını ele almayan çalışmalar.

**2.3. Zaman aralığı ve havuzun bileşimi.** Uygulama çalışmaları için 2000-2026 aralığı esas alınmış; metodolojik birincil kaynaklar bakımından bu sınır uygulanmamıştır (en eski kaynak 1974). Nihai havuz **44 kaynaktan** oluşmaktadır:

| Kategori | Adet |
|---|---|
| Hakemli dergi makalesi (fırın uygulaması) | 30 |
| Hakemli konferans bildirisi | 3 |
| Lisansüstü tez | 1 |
| Derleme makalesi | 2 |
| Metodolojik birincil kaynak (türbülans, sayısal belirsizlik) | 5 |
| Düzenleyici metin ve standart | 3 |
| **Toplam** | **44** |

Dil dağılımı 35 İngilizce / 9 Türkçe; yayın yılı dağılımı ise 1974-1999 arası 4, 2000-2009 arası 8, 2010-2019 arası 19, 2020-2026 arası 13 kaynaktır. Havuzun %73'ü 2010 ve sonrasına, %36'sı ise son yedi yıla aittir.

Havuza yalnızca künyesi birincil kaynağından (dergi sayfası, DOI kaydı veya kurumsal arşiv) doğrulanabilen çalışmalar alınmıştır. Bu ölçüt gereği, konusu ilgili olmakla birlikte yayın yeri veya künye bilgisi doğrulanamayan iki kayıt havuz dışında bırakılmıştır (bkz. Ek A, A.6).

**2.4. Sınırlılıklar.** Tarama yalnızca İngilizce ve Türkçe yayınları kapsamaktadır; Çince, Korece ve Japonca literatürdeki beyaz eşya Ar-Ge çalışmaları kapsam dışıdır. Ticari gizlilik nedeniyle üretici firmaların iç raporlarına erişilememiştir; bu durum, özellikle FKS ve hava kanalı geometrisi gibi doğrudan ürün rekabetine konu olan başlıklarda açık literatürün gerçek bilgi birikimini eksik yansıtıyor olabileceği anlamına gelir.

---

## 3. FIRINLARDA ISI TRANSFERİ VE TERMO-AKIŞKAN DİNAMİĞİ

Fırın kavitesinde iletim, konveksiyon ve ışınım eş zamanlı gerçekleşir. Bu mekanizmalardan herhangi birini tek başına ele almak, fiziksel gerçekliği eksik yansıtır.

### 3.1. Konveksiyon, radyasyon ve iletim etkileşimi

Fırın duvarları, tepsiler ve gıda yüzeylerinde enerji öncelikle iletimle aktarılır. Bu yüzeylerdeki sıcaklık gradyanları hem konvektif akışı hem de ışınım alışverişini doğrudan etkiler. Üç mekanizma birbirinden bağımsız işlemez; kavite içinde kuplajlı (coupled) bir yapı oluşturarak sürekli etkileşim hâlindedir [11], [21], [26].

Elektrikli fırınlarda üst ve alt rezistanslar ile ısınmış iç yüzeyler termal ışınımın ana kaynağıdır. Tipik çalışma sıcaklıklarında (150-250 °C), yüzey emisivitesi ve geometrik görüş faktörlerine (view factors) bağlı olarak ışınımla aktarılan enerjinin toplam içindeki payı ciddi boyutlara ulaşabilir. Reddy ve ark. [27], engelli bir pişirme kavitesinde görüş faktörlerini hem analitik hem de sonlu elemanlar yöntemiyle hesaplayarak, kavite içindeki engellerin (tepsi, raf, reflektör) ışınım enerji alışverişini ne ölçüde yeniden dağıttığını nicel olarak göstermiştir. Jovicic ve ark. [28] ise model bir pişirme fırınında üç mekanizmanın paylarını ayrıştırarak, ışınımın toplam ısı akısı içindeki ağırlığının yüzey sıcaklığı ve emisiviteyle birlikte hızla arttığını ortaya koymuştur.

Hassan ve ark. [11] hem doğal hem de zorlanmış konveksiyon modlarında ışınım dağılımını incelemiş; fanlı çalışmada konvektif katsayının artmasına karşın kavite sıcaklıklarının homojenleşmesinin ışınım-konveksiyon enerji paylaşımını yeniden biçimlendirdiğini bulmuştur. Yani ışınım yalnızca fansız modla sınırlı bir etken değildir; zorlanmış konveksiyonda da göz önünde tutulmalıdır. Hincapié ve García [12] bir gaz fırınında farklı bir tablo çizmiştir: doğal konveksiyon baskın mekanizmadır ve ışınım, geometrik kısıtlar yüzünden taban plakasına sınırlı katkı yapar. Sonuç itibarıyla ışınımın toplam ısı transferindeki payı sabit bir değer değildir; fırının elektrikli mi gazlı mı olduğu, statik mi fanlı modda mı çalıştığı ve kavite geometrisi bu payı köklü biçimde değiştirebilir.

Doğal konveksiyon (statik mod) ile zorlanmış konveksiyon (fanlı mod) arasındaki ayrım yalnızca bir fanın varlığıyla açıklanamaz; ikisi arasındaki fark akış yapısı ve ısı transferi katsayısı bakımından köklüdür. Fan yokken kavitedeki hava hareketi yalnızca yoğunluk gradyanlarına, başka bir deyişle kaldırma kuvvetine (buoyancy) dayanır. Akış bu koşullarda genellikle laminer veya geçiş rejimindedir ve konvektif katsayı düşük kalır. Sıcak havanın yukarı yükselmesi kavitede belirgin bir dikey sıcaklık katmanlaşması (thermal stratification) yaratır; alt bölgeler üst bölgelere göre sistematik olarak daha soğuk kalır [12], [21].

Fan çalışmaya başladığında tablo değişir. Fan, arka duvardaki emme ağzından havayı çekerek FKS üzerindeki deliklerden ve hava kanallarından kaviteye geri basar. Oluşan türbülanslı jet akışları konvektif katsayıyı belirgin ölçüde yükseltir. Bu artışın büyüklüğü doğrudan ölçülmüştür: Sakin ve ark. [42] birleşik yüzey ısı taşınım katsayısını fanlı (turbo) çalışmada 28-34 W/m²K, fansız (statik) çalışmada ise 11-20 W/m²K aralığında belirlemiştir. Carson ve ark. [43] dört farklı ölçüm yöntemiyle (geçici rejim sıcaklık verisinden geri hesaplama, ısı akısı sensörü, kütle kaybı hızı ve psikrometrik yöntem) ev tipi bir fanlı fırın ile ticari bir kesikli fırında görünür ısı taşınım katsayısının ağırlıklı olarak 15-40 W/m²K aralığında olduğunu, bu değerlerin düz levha üzerindeki laminer akış korelasyonlarının yaklaşık iki katı çıktığını ve farkın kısmen ışınımdan kaynaklandığını göstermiştir. Bu iki bağımsız ölçüm çalışması, "fan konvektif katsayıyı kabaca ikiye katlar" biçimindeki niteliksel ifadeye nicel bir taban sağlamaktadır.

Verboven ve ark. [21] zorlanmış konveksiyonlu bir fırında kavite içi hava hızını sıcak-film anemometresiyle ölçmüş ve sıcaklık dağılımının birincil olarak bu akış alanı tarafından belirlendiğini göstermiştir [22]. Önal ve ark. [13] fan devir sayısının 600'den 2400 RPM'e yükseltilmesiyle kavite içi ortalama hızın doğrusal olmayan bir artış sergilediğini k-ω SST modeli ile sayısal olarak ortaya koymuştur. Kişin ve ark. [18] endüstriyel bir fırını FloEFD yazılımı ile modelleyerek momentum transferinin sıcaklık haritası üzerindeki etkisini göstermiştir.

Buradan çıkan ortak mesaj, sıcaklık dağılımını iyileştirmenin aslında bir akış kontrolü meselesi olduğudur. Havanın nereden girdiği, ne hızla geldiği, jetlerin nasıl açıldığı ve sirkülasyon döngüleri konvektif katsayının kavite içindeki dağılımını tayin eder. Üstelik yüksek hızlı akış yüzeylerdeki konvektif direnci düşürdükçe yüzey sıcaklıkları da değişir; bu da ışınımla aktarılan enerjiyi dolaylı yoldan etkiler [11], [19].

### 3.2. Akış rejimleri ve sınır tabaka etkileri

Tepsiler, raflar ve dar geçiş boşlukları fırın kavitesini aerodinamik açıdan çetrefilli bir ortama dönüştürür. FKS delikleri ile hava kanalı çıkışlarından jet hâlinde giren hava bu engellere çarpıp türbülanslı bir akış alanı oluşturur. Fan çıkış hızları ve karakteristik kavite boyutları göz önüne alındığında, zorlanmış konveksiyonlu fırınlarda Reynolds sayısının tipik olarak 10⁴-10⁵ mertebesine ulaştığı ve akışın türbülanslı rejime karşılık geldiği kabul edilmektedir; bu mertebe, ilgili çalışmalarda bildirilen hız ve boyut ölçekleriyle tutarlıdır [13], [21].

Ancak kavite içindeki akışın tamamını salt mekanik olarak sürülen bir türbülans olarak nitelendirmek doğru olmaz. Rezistanslara yakın bölgelerde yerel sıcaklık farkları hava yoğunluğunda gradyanlar oluşturur; bunun sonucunda kaldırma kuvveti kaynaklı ikincil akışlar belirir. Bu iki mekanizmanın hangisinin ağır bastığı Richardson sayısı (*Ri* = *Gr*/*Re*²) ile ölçülür. Yüksek fan devirlerinde *Ri* ≪ 1 olup zorlanmış konveksiyon baskındır. Düşük fan hızlarında ya da fanın etkisinin ulaşamadığı ölü hacimlerde ise *Ri* yükselerek kaldırma kuvvetleri yerel akışın şekillenmesinde belirleyici hâle gelebilir [22], [26]. Mistry ve ark. [26] bir gaz fırınında kaldırma kuvvetinin akış alanını fiilen yönlendirdiğini göstermiş ve modellemede kaldırma etkilerinin doğru temsil edilmesinin sonuçlar üzerindeki belirleyiciliğine dikkat çekmiştir.

Isı transferi kavite içinde her yerde aynı yoğunlukta gerçekleşmez; en yoğun olduğu bölgeler katı yüzeylere komşu sınır tabakalardır. Tepsilerin alt ve üst yüzeylerinde, gıda yüzeyinde ve fırın iç cidarlarında hem hidrodinamik hem de termal sınır tabakalar birlikte gelişir. Bu tabakaların kalınlığı ve yapısı Prandtl sayısına ve yerel Reynolds sayısına bağlı olup yüzeyden gerçekleşen ısı akısını doğrudan kontrol eder [21], [22]. Verboven ve ark. [21] simülasyonlarında tepsi yüzeyine paralel akan havanın ince bir termal sınır tabaka oluşturduğunu, ısı transferi hızının da bu tabaka içindeki gradyana bağlı olduğunu ortaya koymuştur. Boulet ve ark. [34] pilot ölçekli bir fırında ısı akısı ölçüm cihazını doğrudan modellenen geometriye dâhil ederek, sınır tabaka çözünürlüğünün yerel ısı akısı tahmini üzerindeki etkisini göstermiştir.

Tepsilerin kavitedeki yeri de sınır tabaka gelişimini doğrudan etkiler. Üst raftaki tepsiyle tavan arasındaki dar boşluk bir kanal akışı gibi davranır: hız profili düzleşir ve konvektif katsayı artar. Alt raftaki tepsi ile taban rezistansı arasındaki boşluğun yetersiz kaldığı durumlarda ise karşı yüzeylerdeki sınır tabakalar birbirine yaklaşır ve ısı transferi verimi düşer. Pala ve ark. [10] çok raflı endüstriyel bir fırında farklı raflardaki tepsiler arasında, kaynakta bağıl sıcaklık sapması olarak bildirilen %12,76 düzeyinde bir fark ölçmüş; bu durumun büyük ölçüde konumlara göre değişen hava hızı asimetrisinden ve sınır tabaka etkileşimlerinden kaynaklandığını belirlemiştir. Therdthai ve ark. [35] ile Wong ve ark. [36], sürekli tünel fırınlarında ürünün kavite içindeki hareketiyle birlikte maruz kaldığı akış alanının değiştiğini göstererek, sınır tabaka koşullarının yalnızca konuma değil zamana da bağlı olabileceğini ortaya koymuştur.

Kavite geometrisinin karmaşıklığı çeşitli akış anomalilerine de zemin hazırlar. FKS deliklerinden giren hava jetleri ilerlerken tepsi kenarlarına, yan duvarlara ve rezistanslara çarparak ani yön değişikliklerine uğrar. Bu keskin geometrik geçişlerde akışkan yüzey eğriselliğini izleyemez ve duvardan kopar; yani akış ayrılması (flow separation) meydana gelir. Ayrılma noktasının gerisinde düşük basınçlı bir bölge oluşur ve burada akışkan ana akış yönünün tersine dönerek geri sirkülasyon (recirculation) bölgeleri yaratır [18], [19]. Kişin ve ark. [18] kavite içindeki momentum transferini sayısal olarak inceleyerek, FKS'nin hemen arkasında ve tepsi kenarlarında hava hızının kavite ortalamasının belirgin biçimde altına düştüğü geri sirkülasyon yapıları tespit etmiştir.

Fanın oluşturduğu jet akışlarının doğrudan ulaşamadığı kavite köşeleri ile tepsilerin altında ya da üstünde kalan dar boşluklar "ölü hacimler" (dead zones) olarak adlandırılır. Bu bölgelerde hava hızı ihmal edilebilecek düzeylere iner, konvektif katsayı çok azalır ve ısı transferi ağırlıklı olarak düşük verimli doğal konveksiyon ile ışınıma kalır [8], [19]. Fahey ve ark. [19] ev tipi bir fırın üzerinde yaptıkları HAD modellemesinde kavite köşelerinde geniş durağan bölgeler tespit etmiştir.

Akış ayrılması, geri sirkülasyon ve ölü hacimler kavitedeki sıcaklık dağılımını doğrudan etkiler. Jetlerin yoğun çarptığı yerlerde konvektif katsayı yüksektir, bu alanlar hızla ısınır ve sıcak noktalar oluşur. Akışın zayıf kaldığı ya da durağanlaştığı bölgelerde ise katsayı düşer ve kavite ortalamasının belirgin altında soğuk noktalar ortaya çıkar [8], [9], [13]. Yang ve ark. [8], 13 ölçüm noktası arasında 10 °C'yi aşan farkların bu akış anomalileriyle doğrudan bağlantılı olduğunu hem deneysel hem de sayısal yöntemlerle göstermiştir. Timur ve ark. [9] ise ticari pişirme fırınlarında fan parametrelerinin değiştirilmesinin sıcak/soğuk nokta dağılımını nasıl yeniden biçimlendirdiğini gözlemlemiştir.

Sıcaklık dengesizlikleri pratikte gıda yüzeyindeki pişirme ve kızarma homojenliğine yansır. Sıcak noktalara yakın yüzeyler aşırı kızarırken soğuk bölgeler çiğ kalabilir. Purlis [38], esmerleşmenin sıcaklık ve nem geçmişine bağlı bir kinetik süreç olduğunu ve bu nedenle yüzeyin gördüğü **ısı akısı geçmişinin**, anlık kavite sıcaklığından daha belirleyici olduğunu ortaya koymuştur. Park ve Lee [17] bu olguyu nicelleştirmek için esmerleşme homojenliği indeksini (uniformity of browning index, UBI) kullanmış ve kavite akış alanının düzenlenmesiyle UBI değerinin iyileştirilebildiğini göstermiştir. Bilen ve ark. [16] da FKS tasarımını değiştirerek hava jetlerinin kavite içindeki dağılımını dengelemiş ve bunun pişirme performansını olumlu etkilediğini raporlamıştır. Tüm bu çalışmalar aynı noktaya işaret eder: fırınlarda sıcaklık homojenliği meselesi bir ısıl problem olmaktan ziyade bir akış tasarımı problemidir. HAD tabanlı optimizasyon çalışmalarının çıkış noktası da budur.

---

## 4. HAD MODELLEME YAKLAŞIMLARI

Sayısal simülasyonda fiziksel doğruluk büyük ölçüde modelleme tercihlerine bağlıdır. Türbülans modeli, ışınım hesaplama yöntemi ve fanın sayısal temsili aynı geometri üzerinde bile birbirinden farklı sonuçlar üretebilir. Yazılım platformu ve ağ yapısı da bu denkleme dâhildir.

### 4.1. Türbülans modelleri

Fırın kavitesindeki akış, fan çalışırken türbülanslı rejime girer ve bu rejimin doğru temsili simülasyonun güvenilirliğini belirler.

Verboven ve ark. [21], [22] ilk kapsamlı HAD çalışmasını Launder ve Spalding'in standart k-ε modeliyle [23] gerçekleştirmiştir. O dönem endüstriyel HAD uygulamalarında en yaygın RANS (Reynolds-Averaged Navier-Stokes) kapanışı buydu. Çalışmada standart k-ε ile RNG varyantı karşılaştırılmış ve iki modelin birbirine yakın sonuçlar verdiği raporlanmıştır; deneysel doğrulama, modelin kavite içi hız ve sıcaklık alanlarını kabul edilebilir doğrulukta tahmin edebildiğini ortaya koymuştur. Bununla birlikte standart k-ε, duvar yakınında logaritmik duvar fonksiyonlarına dayanır ve ayrılmış akışlar ile güçlü basınç gradyanları altında yetersiz kalır. Kavitede akış ayrılması ve geri sirkülasyon bölgelerinin ne denli yaygın olduğu düşünülürse bu zayıflık göz ardı edilemez.

Yang ve ark. [8] Realizable k-ε modeliyle çalışmıştır. Shih ve ark. [24] tarafından geliştirilen bu varyant, standart formülasyonun matematiksel tutarsızlıklarını (gerilme tensörünün fiziksel gerçeklenebilirliği) giderir ve dönel akışları daha iyi yakalar. Fan çıkışındaki akışın güçlü bir dönme bileşeni taşıdığı düşünüldüğünde tercih fiziksel olarak anlamlıdır. Boulet ve ark. [34] da pilot ölçekli fırın modellemesinde aynı varyantı benimsemiştir. Fahey ve ark. [19] ANSYS CFX ile iki boyutlu ve kararlı rejim bir model kurmuş; sıcak-tel anemometre ile termokupl ölçümlerine karşı %3'ün altında sapma elde etmiştir. İki boyutlu indirgeme hesaplama maliyetini düşürür, ancak fan çıkışındaki üç boyutlu dönme bileşenini yapısal olarak dışarıda bırakır; bu, kavite köşelerindeki durağan bölgelerin öngörüsünü doğrudan etkileyen bir kısıttır. Park ve Lee [17] ise ekmek pişirme sürecini standart k-ε yaklaşımıyla modellemiş ve rezistansın aç/kapa denetim algoritmasının modele dâhil edilmesiyle deneysel uyumun belirgin biçimde iyileştiğini göstermiştir.

Önal ve ark. [13] duvar yakını sınırlamasını aşmak için Menter'in k-ω SST modelini [25] seçmiştir. k-ω SST, duvar yakınında k-ω formülasyonunun avantajlarını kullanırken serbest akışta k-ε davranışına geçiş yapan hibrit bir modeldir ve ters basınç gradyanı altındaki ayrılmayı k-ε ailesine göre daha iyi öngörür. Deneysel karşılaştırmada model, kavite içi sıcaklık dağılımını yüksek doğrulukla yakalamıştır. Rek ve ark. [15] de yeni nesil bir ısıtma fırınının geliştirilmesinde benzer bir yaklaşımla çalışmış ve deneysel verilerle uyumlu sonuçlar elde etmiştir.

Literatürdeki bu çeşitlilik, fırın simülasyonları için tek bir "en iyi" türbülans modelinin bulunmadığını gösterir. Model seçimi, çözülmek istenen soruya bağlıdır: kavite ortalaması sıcaklık ve genel sirkülasyon deseni hedefleniyorsa k-ε ailesi yeterli doğruluk sunar; buna karşılık FKS deliklerinden çıkan jetlerin ayrılma davranışı, tepsi kenarlarındaki geri sirkülasyon yapıları veya yerel ısı akısı dağılımı hedefleniyorsa k-ω SST tercih edilmelidir. Son dönem çalışmaların k-ω SST'ye yönelmesi [13], [15] bu ikinci sınıf soruların ağırlık kazanmasıyla açıklanabilir.

### 4.2. Işınım modelleri

Işınımın modellenmesi, özellikle 200 °C üzeri çalışma sıcaklıklarında simülasyon doğruluğunu ciddi biçimde etkiler.

Verboven ve ark. [21], [22] öncü çalışmalarında ışınımı ihmal etmiştir. 2000 yılında hesaplama maliyetini düşürmek adına anlaşılabilir bir basitleştirmeydi. Ancak Hassan ve ark. [11] ışınımın zorlanmış konveksiyon modunda bile toplam ısı transferinde kayda değer bir paya sahip olduğunu, Jovicic ve ark. [28] ise mekanizmaların paylarını ayrıştırarak ışınımın ağırlığını nicel olarak gösterince bu basitleştirmenin sınırları netleşmiştir.

Rek ve ark. [15] Ayrık Ordinatlar (Discrete Ordinates, DO) modelini benimsemiştir. DO, ışınım transfer denklemini ayrık açısal koordinatlarda çözer; yarı saydam ve ışınıma katılan ortamlar ile karmaşık geometriler için uygunluğu bu modeli fırın uygulamalarında cazip kılar. Hesaplama maliyeti açısal çözünürlükle birlikte artar, fakat fırın kavitesi boyutlarında kabul edilebilir düzeyde kalır.

Mistry ve ark. [26] bir ev tipi gaz fırınında DTRM, S2S ve DO modellerini karşılaştırmış ve **DO modelini** benimsemiştir. Gerekçe fiziksel olarak nettir: gaz fırınında yanma ürünleri (CO₂, H₂O) ışınıma katılan bir ortam oluşturur ve yüzeyler arası alışverişle sınırlı bir formülasyon bu katkıyı yakalayamaz. Aynı sonucu Hincapié ve García [12] bir başka gaz fırınında ön karışımlı alev modellemesiyle desteklemiştir.

Buna karşılık elektrikli fırınlarda kavite havası ışınıma büyük ölçüde şeffaftır; bu durumda yüzeyler arası (Surface-to-Surface, S2S) yaklaşım yeterlidir. S2S, yüzeylerin birbirini ne kadar "gördüğünü" ifade eden geometrik görüş faktörlerini hesaplar ve ortamın ışınıma katılmadığı varsayımına dayanır. Reddy ve ark. [27] tam da bu çerçevede görüş faktörlerini analitik ve sonlu elemanlar yöntemleriyle hesaplayarak, engelli bir kavitede S2S tabanlı ışınım analizinin nasıl kurulacağını göstermiştir. Boulet ve ark. [34] ise pilot ölçekli elektrikli fırın modellemesinde S2S kullanmış ve kaldırma kuvvetlerini zayıf sıkıştırılabilir formülasyonla dâhil etmiştir.

Özetle: **elektrikli fırın → S2S yeterli; gazlı fırın → DO gerekli; her iki durumda da ışınımı tamamen ihmal etmek ciddi bir hata kaynağıdır** [11], [26], [28].

### 4.3. Fan modelleme teknikleri

Fan dönel bir bileşendir, kavite ise durağandır. Bu ikisini aynı hesaplama alanında birleştirmek özel yaklaşımlar gerektirir.

En yaygın yöntem **MRF (Moving Reference Frame)** yaklaşımıdır. Fan çevresinde silindirik bir bölge tanımlanır ve bu bölgedeki denklemler dönel bir referans çerçevesinde çözülür; akış alanı zamandan bağımsız (steady-state) olarak hesaplanır. Rek ve ark. [15] ve Yang ve ark. [8] bu yöntemi kullanmıştır. Hesaplama maliyeti düşüktür, ancak fan-stator etkileşimini ve zamanla değişen akış yapılarını yakalayamaz.

**Kayan Ağ (Sliding Mesh)** yöntemi bu sınırlamayı aşar: fan bölgesinin ağı her zaman adımında gerçekten döner ve kavite ağıyla arayüzey üzerinden veri alışverişi yapar. Fan kanatlarının periyodik geçişi sırasında oluşan basınç dalgalanmaları bu yöntemle yakalanabilir. Ne var ki hesaplama maliyeti MRF'ye kıyasla çok daha yüksektir. Fırın simülasyonlarında kullanımı bu nedenle sınırlı kalmış, çoğu araştırmacı MRF doğruluğunu yeterli bulmuştur. Bu tercihin savunulabilirliği problemin zaman ölçeklerinden gelir: bir pişirme çevrimi dakikalar mertebesinde sürerken fan geçiş periyodu milisaniyeler mertebesindedir; dolayısıyla kanat geçişine bağlı dalgalanmalar sıcaklık alanı üzerinde büyük ölçüde ortalanır. Ancak akustik/gürültü veya fan çıkışındaki anlık jet yapısı ilgi konusuysa MRF yetersiz kalır.

Üçüncü bir yaklaşım fanı **momentum kaynağı** olarak temsil etmektir. Kişin ve ark. [18] FloEFD'de fanı geometrik olarak modellemek yerine akışa belirli bir momentum ve enerji ekleyen bir kaynak terimi olarak tanımlamıştır. Ağ oluşturma süreci basitleşir; buna karşılık fan çıkışındaki detaylı akış yapısı hakkında bilgi kaybı yaşanır. Bu yaklaşım, fanın kendisi tasarım değişkeni **olmadığı**, ilgi odağının kanal ve kavite geometrisi olduğu çalışmalar için uygun bir ödünleşmedir.

### 4.4. Ağ yapısı, sayısal belirsizlik ve yazılım platformları

Simülasyon sonuçlarının ağ yapısından bağımsız olduğunun kanıtlanması (mesh independence) HAD çalışmalarında standart bir gerekliliktir. Verboven ve ark. [21] o dönemin hesaplama olanaklarıyla sınırlı bir ağ çözünürlüğünde çalışmıştır; günümüz çalışmalarında eleman sayısı milyonlara ulaşmıştır. Artan bilgisayar kapasitesi daha ince ağlara olanak tanırken, ağ bağımsızlık testinin sistematik biçimde yapılması önem kazanmıştır. Önal ve ark. [13] bu testi uygulayarak sonuçların belirli bir eleman sayısının üzerinde değişmediğini göstermiş, Şahin [29] ise ağ kalitesi ve çözüm yakınsaması konusunda sistematik bir metodoloji önermiştir.

Yalnız eleman sayısını kademeli olarak artırıp sonuçları gözle karşılaştırmak her zaman yeterli değildir. Roache [40] tarafından önerilen ve Celik ve ark. [41] tarafından ASME için standartlaştırılmış prosedür hâline getirilen **Ağ Yakınsama İndeksi (Grid Convergence Index, GCI)**, Richardson ekstrapolasyonuna dayalı olarak ayrıklaştırma belirsizliğini nicel biçimde tahmin eder ve ağ inceltme çalışmasının yeterliliğini nesnel biçimde değerlendirmeye olanak tanır. Prosedür en az üç sistematik olarak inceltilmiş ağ gerektirir ve gözlenen yakınsama mertebesini hesaplayarak sonuca bir hata çubuğu iliştirir. **Bu derlemede taranan fırın çalışmalarının hiçbirinde GCI değeri raporlanmamıştır.** Bu, alanın en belirgin metodolojik eksiklerinden biridir: deneysel doğrulama sıklıkla yapılırken, sayısal belirsizliğin kendisi nicelenmemektedir.

Duvar yakınlarında sınır tabaka çözünürlüğü için inflation (prizma) katmanları kullanılır. İlk hücrenin duvardan boyutsuz uzaklığı (*y*⁺) türbülans modeline göre ayarlanmalıdır: k-ω SST modelinin duvar yakını avantajından yararlanmak için *y*⁺ ≈ 1 mertebesinde çözünürlük gerekirken, duvar fonksiyonlu k-ε modelleri *y*⁺ = 30-300 aralığında çalışabilir [23], [25]. Burada bir mühendislik ödünleşmesi söz konusudur. *y*⁺ ≈ 1 elde etmek için duvar yakınındaki ilk hücre yüksekliğinin çok küçük tutulması gerekir; bu da karmaşık fırın geometrilerinde (eğrisel yüzeyler, rezistans çevreleri, FKS delikleri) eleman sayısını katlamalı olarak artırır. Tepsiler, raflar ve dar boşlukların oluşturduğu çok yüzeyli bir kavitede tüm duvarlara *y*⁺ ≈ 1 çözünürlüğünde prizma katmanı uygulamak hesaplama maliyetini kabul edilemez düzeylere çıkarabilir. Bu nedenle araştırmacıların önemli bir bölümü duvar fonksiyonlarına dayanan k-ε modelleriyle çalışmayı, doğruluğun bir miktar azalmasını hesaplama verimliliği lehine kabul ederek tercih etmiştir [19], [21].

Yazılım platformları açısından ANSYS Fluent en sık tercih edilen araçtır [8], [13], [15], [30]. Geniş türbülans ve ışınım modeli kütüphanesi, parametrik çalışmalara uygunluğu ve yaygın kullanımı bu tercihin başlıca nedenleridir. CAD entegrasyonu güçlü olan platformlar da beyaz eşya Ar-Ge süreçlerinde yaygındır: Keyfoğlu ve Kırmızıgöl [6] SolidWorks Flow Simulation'ı, Kişin ve ark. [18] ile Bilen ve ark. [16] FloEFD'yi kullanmıştır. Bu araçların avantajı, tasarım değişikliklerinin doğrudan simülasyona yansıtılabilmesi ve böylece tasarım-analiz döngüsünün kısalmasıdır; dezavantajı ise türbülans/ışınım modeli seçeneklerinin genel amaçlı çözücülere göre kısıtlı olmasıdır. OpenFOAM gibi açık kaynaklı alternatifler, fırın simülasyonlarında henüz yaygınlaşmamıştır.

### 4.5. Modelleme tercihlerinin karşılaştırmalı özeti

**Tablo 1.** Derlemede incelenen başlıca HAD çalışmalarının modelleme tercihleri ve doğrulama yaklaşımları.

| Çalışma | Fırın tipi | Yazılım | Türbülans modeli | Işınım modeli | Fan modeli | Deneysel doğrulama |
|---|---|---|---|---|---|---|
| Verboven ve ark. [21], [22] | Zorlanmış konveksiyonlu endüstriyel | Bildirilmemiş | Standart ve RNG k-ε (karşılaştırmalı) | İhmal edilmiş | Fan basınç-debi karakteristiği + swirl | Yönsel kalibre sıcak-film anemometre; termokupl |
| Therdthai ve ark. [35] | Sürekli endüstriyel tünel | Bildirilmemiş | RANS | Dâhil | Yok (sürekli hat) | Sıcaklık profili ölçümü |
| Wong ve ark. [36] | Sürekli endüstriyel tünel (U hareketli) | Bildirilmemiş | RANS | Dâhil | Yok (sürekli hat) | Sıcaklık ölçümü |
| Carson ve ark. [43] | Ev tipi fanlı + ticari kesikli | Yok (deneysel çalışma) | — | — | — | Dört bağımsız yöntemle *h* ölçümü |
| Fahey ve ark. [19] | Ev tipi | ANSYS CFX (2B, kararlı rejim) | Bildirilmemiş | Bildirilmemiş | Bildirilmemiş | Sıcak-tel anemometre + termokupl (%3 içinde uyum) |
| Sakin ve ark. [42] | Pişirme fırını (fanlı/statik) | Yok (deneysel çalışma) | — | — | — | 70-220 °C'de birleşik *h* ölçümü |
| Chhanwal ve ark. [33] | Elektrikli ekmek pişirme fırını | Bildirilmemiş | RANS | Dâhil | — | Termokupl |
| Boulet ve ark. [34] | Pilot ölçekli pişirme fırını | Bildirilmemiş | Realizable k-ε | S2S (zayıf sıkıştırılabilir kaldırma) | — | Isı akısı ölçüm cihazı (modele dâhil) |
| Mistry ve ark. [26] | Ev tipi, gazlı | Bildirilmemiş | RANS (zamana bağlı) | **DO** (DTRM ve S2S ile karşılaştırmalı) | — | Termokupl + IR termografi |
| Ploteau ve ark. [37] | Kesikli ekmek fırını (statik/elektrikli) | Sonlu elemanlar (ad bildirilmemiş) | Yok (doğal konveksiyon) | Dâhil (kızılötesi + iletim ayrıştırılmış) | Yok (statik fırın) | Isı akısı + çok noktalı sıcaklık; silindirik numune yanıtı |
| Rek ve ark. [15] | Çok fonksiyonlu ısıtma fırını | Bildirilmemiş | Bildirilmemiş (iki denklemli RANS) | **DO** | **MRF** | Termokupl |
| Smolka ve ark. [30], [44] | Doğal sirkülasyonlu ısıtma fırını | ANSYS Fluent | RANS | Duvarlar arası ışınım (ölçülmüş emisivite) | Yok (doğal konveksiyon) | Termokupl; rezistans sınır sıcaklıkları ve emisivite ölçümü |
| Khatir ve ark. [31], [32] | Ticari ekmek fırını | Bildirilmemiş | RANS | Dâhil | Parametrik giriş koşulu | Deneysel veri + vekil (surrogate) model |
| Park ve Lee [17] | Ev tipi elektrikli | Bildirilmemiş | **Standart k-ε** | Dâhil | — | Ekmek pişirme testi (UBI) + kavite sıcaklığı; aç/kapa denetim algoritması modellenmiş |
| Kişin ve ark. [18] | Endüstriyel, 10 tepsili | FloEFD | RANS | Dâhil | **Momentum kaynağı** | Termokupl |
| Bilen ve ark. [16] | Ev tipi ankastre | FloEFD (Kartezyen ağ) | **k-ε** | Dâhil | — | Kek pişirme testi + termokupl |
| Yang ve ark. [8] | Çok fonksiyonlu ev tipi | ANSYS Fluent | **Realizable k-ε** | Dâhil | **MRF** | 13 noktalı termokupl dizisi |
| Jovicic ve ark. [28] | Model pişirme fırını (gözenekli seramik brülör) | — | — | Mekanizma payları ayrıştırılmış | — | Isı akısı ve sıcaklık ölçümü |
| Reddy ve ark. [27] | Engelli pişirme kavitesi | Sonlu elemanlar | Yok (ışınım analizi) | **S2S + ağ temsili yöntemi** | — | Analitik-sayısal karşılaştırma |
| Keyfoğlu ve Kırmızıgöl [6] | Ev tipi ankastre (72 L) | SolidWorks Flow Simulation | RANS | Dâhil (emaye emisiviteleri tanımlı) | — | Kavite ve dış sac yüzey sıcaklıkları |
| Önal ve ark. [13] | Fanlı pişirici, ev tipi | ANSYS Fluent | **k-ω SST** | Dâhil | Dönel bölge | Termokupl + hız ölçümü; 600-2400 RPM taraması |
| Şahin [29] | Endüstriyel | Bildirilmemiş | RANS | Dâhil | — | Termokupl + Taguchi deney tasarımı |

*Tablo, kaynakların özetleri ile erişilebilen tam metin bilgisine dayanmaktadır. **"Bildirilmemiş"**, ilgili modelleme tercihinin bu düzeyde açıkça belirtilmediğini; **"Yok"**, o bileşenin çalışmanın kapsamı gereği bulunmadığını (örneğin statik fırında fan modeli); **"—"** ise sütunun o çalışma türü için anlamsız olduğunu gösterir.*

Tablonun kendisi bir bulgu üretmektedir. Fanın sayısal temsilini açıkça bildiren çalışma sayısı beştir (MRF: [8], [15]; momentum kaynağı: [18]; fan basınç-debi karakteristiği: [21]; dönel bölge: [13]); geri kalan sayısal çalışmalarda fanın nasıl temsil edildiği okunamamaktadır. Kullanılan yazılım, sayısal çalışmaların yarısından fazlasında adlandırılmamıştır. Türbülans kapanışını genel "RANS" nitelemesinin ötesinde **belirli bir model adıyla** bildirenlerin sayısı altıdır ([21], [34], [17], [16], [8], [13]) ve bunların yalnızca biri [13] duvar yakını çözümlemesine uygun bir hibrit modeli (k-ω SST) tercih etmiştir. Ağ yakınsama belirsizliğini nicel olarak raporlayan çalışma **yoktur**. Bu raporlama boşlukları, Bölüm 9.5'te önerilen asgari çerçevenin ve Bölüm 10.1'deki araştırma boşluğunun doğrudan gerekçesidir.

---

## 5. FAN TASARIM PARAMETRELERİ

Fan, zorlanmış konveksiyonlu fırınlarda kavite içi akışın birincil kaynağıdır. Tipi, devir sayısı, dönüş yönü ve kanat geometrisi sıcaklık dağılımını doğrudan etkiler.

### 5.1. Fan tipi ve kanat geometrisi

Fırınlarda yaygın olarak iki tür fan kullanılır. Radyal (santrifüj) fanlar havayı eksenel yönde emerek çevresel yönde basar ve kavitede dairesel bir akış deseni oluşturur. Tanjansiyel (çapraz akışlı) fanlar ise uzun silindirik bir rotor boyunca havayı emerek geniş bir alanda düşük hızlı, homojen bir akış üretir.

Burhan ve ark. [14] her iki fan tipini aynı turbo kuzine fırın üzerinde deneysel ve sayısal olarak karşılaştırmıştır. Radyal fan kavite içinde daha yüksek hava hızları üretmiş, fakat hız dağılımı homojen çıkmamıştır. Tanjansiyel fan ise daha düşük hızlarda çalışmasına karşın daha düzgün bir sıcaklık profili sağlamıştır. İlk bakışta paradoksal görünen bu sonuç, yüksek hızın tek başına iyi sıcaklık homojenliği anlamına gelmediğini ortaya koyar: hız dağılımının düzgünlüğü, en az hız büyüklüğü kadar belirleyicidir. Bu bulgu, 3.1'de verilen ısı taşınım katsayısı ölçümleriyle de tutarlıdır — Sakin ve ark. [42] ile Carson ve ark. [43] fanlı çalışmada elde edilen katsayı **aralığının genişliğine** dikkat çekmektedir; geniş bir aralık, kavite içinde konumdan konuma değişen bir konvektif katsayı alanı demektir.

Kanat açısı da ihmal edilemez bir parametredir. Burhan ve ark. [14] farklı kanat açılarında deneyler yaparak açının akış desenini belirgin biçimde etkilediğini göstermiştir. Kanat açısının artırılması debiyi artırır; ancak belirli bir noktadan sonra akış ayrılması ve gürültü sorunları baş gösterir.

Rek ve ark. [15] yeni nesil bir fırın tasarımında fan geometrisini HAD ile optimize ederek mevcut tasarıma göre daha homojen sıcaklık dağılımı elde etmiştir. Timur ve ark. [9] ise ticari pişirme fırınlarında fan çapı (280 ve 350 mm), dönüş yönü ve devir sayısının (450, 1100 ve 1655 RPM) pişirme performansına etkisini sistematik olarak değerlendirmiştir. Kanat sayısının artırılmasının her durumda iyileşme sağlamadığı, optimal değerin fırın geometrisine bağlı olduğu sonucuna varılmıştır.

### 5.2. Devir sayısı ve dönüş yönü etkileri

Fan devir sayısı kavite içi hava hızını ve dolayısıyla konvektif katsayıyı doğrudan belirler. Önal ve ark. [13] devir sayısını 600 RPM'den 2400 RPM'e kadar kademeli olarak artırarak kavite içi hız ve sıcaklık dağılımını hem sayısal hem deneysel olarak incelemiştir. Devir sayısı artırıldığında kavite içi ortalama hız da artmış, ancak bu artış doğrusal olmamıştır: düşük devirlerde hız artışı belirginken yüksek devirlerde ivmesini kaybetmiştir. Sıcaklık homojenliği açısından ise belirli bir devir sayısından sonra iyileşme durmuş, hatta bazı bölgelerde kötüleşme gözlemlenmiştir. Nedeni şudur: yüksek hızlı jet akışları kavite duvarlarına çarparak güçlü sıcak ve soğuk noktalar oluşturur; devir artışı bu noktalar arasındaki farkı azaltmak yerine büyütebilir.

Bu bulgu, fan devrinin **doygun bir tasarım değişkeni** olduğunu göstermesi bakımından önemlidir. Enerji açısından da anlamlıdır: fan motorunun kendi tüketimi EEI hesabına dâhil olduğundan [3], [5], homojenliğe katkı sağlamayan her ek devir doğrudan bir verimlilik kaybıdır.

Dönüş yönü daha az incelenmiş bir parametredir. Önal ve ark. [13] saat yönünde ve saat yönünün tersine dönüşü karşılaştırmış, dönüş yönünün kavite içindeki akış yapısını asimetrik biçimde etkilediğini göstermiştir; dönüş yönü değiştirildiğinde sıcak ve soğuk noktaların kavitedeki konumları yer değiştirmiştir. Bu, geometri kaynaklı bir asimetridir: fan çıkışındaki havanın kavite duvarlarıyla etkileşimi, dönüş yönüne göre farklı akış yolları izler. Timur ve ark. [9] da ticari fırınlarda dönüş yönünü bir değişken olarak ele alarak benzer bir yön bağımlılığı raporlamıştır. Bazı ticari fırınlarda dönüş yönünün pişirme çevrimi boyunca periyodik olarak değiştirilmesi, tam da bu asimetriyi zaman ortalamasında dengelemeye yönelik bir çözümdür; ancak bu stratejinin HAD ile sistematik biçimde incelendiği bir çalışmaya rastlanmamıştır (bkz. Bölüm 10).

### 5.3. Fan-kavite bütünleşik optimizasyonu

Yang ve ark. [8] devir sayısı optimizasyonunu sıcaklık homojenliği indeksi üzerinden yürütmüş ve belirli bir devir aralığında en iyi homojenliğin elde edildiğini raporlamıştır. Aynı çalışmada fan devri tek başına değil, kavite ve raf yerleşimiyle birlikte ele alınmış; tek bir parametreyi yalıtılmış biçimde değiştirmek yerine parametreler arası etkileşimi hesaba katan bütünleşik yaklaşımın daha anlamlı iyileştirmeler sağladığı gösterilmiştir. Bu bulgu, Bölüm 6.3'te ayrıntılandırılan seri akış direnci argümanının fan tarafındaki karşılığıdır: fanın çalışma noktası, önündeki geometri tarafından belirlenir.

Khatir ve ark. [31], ticari ekmek fırınları için üç boyutlu bir jenerik fırın modelini parametrize ederek sıcaklık homojenliği, enerji verimliliği ve üretilebilirlik hedeflerini eş zamanlı gözeten çok amaçlı bir optimizasyon çerçevesi kurmuştur. Aynı ekibin izleyen çalışması [32] bu çerçeveyi enerji ısıl yönetimine genişletmiştir. Bu iki çalışma, fan ve kanal parametrelerinin tek tek "iyileştirilmesi" yerine bir Pareto cephesi üzerinde değerlendirilmesinin metodolojik olarak nasıl kurulacağını gösteren en olgun örneklerdir; ancak henüz ev tipi ankastre fırın geometrilerine uyarlanmamışlardır.

---

## 6. HAVA KANALI VE FAN KORUMA SACI (FKS) GEOMETRİSİ

Fan ne kadar iyi tasarlanırsa tasarlansın, ürettiği hava akışının kaviteye nasıl dağıtıldığı en az fanın kendisi kadar belirleyicidir. Hava kanalı ve FKS bu dağıtımı kontrol eden bileşenlerdir.

### 6.1. FKS delik konfigürasyonu

FKS, fanın hemen önünde yer alan metal plakadır. Üzerindeki deliklerin konumu, çapı, şekli ve dağılım deseni, havanın kaviteye hangi yönde ve hangi hızda gireceğini belirler. Fiziksel olarak FKS bir **dağıtıcı delikli plakadır**: her delik bir jet üretir ve kavitedeki sıcaklık alanı, bu jetlerin çarpma noktalarının, açılma açılarının ve birbirleriyle etkileşiminin toplamıdır.

Gün [2] yüksek lisans tezinde FKS'nin hem performans hem güvenlik boyutunu incelemiştir. Delik konfigürasyonunun değiştirilmesi kavite içi sıcaklık dağılımını belirgin biçimde etkilemiş; fakat bazı konfigürasyonlar FKS yüzey sıcaklığını TS EN 60335 serisi güvenlik standartlarının öngördüğü sınırların üzerine çıkarmıştır. Performansı artıran bir konfigürasyon güvenlik açısından kabul edilemez olabilir; bu nedenle tasarım sürecinde ikisi arasında denge gözetilmelidir. Bu bulgu, FKS optimizasyonunun tek amaçlı bir problem olarak kurulamayacağını gösteren en somut kanıttır.

Bilen ve ark. [16] yeni tip fan bafıl tasarımları geliştirerek mevcut FKS konfigürasyonlarıyla karşılaştırmıştır. FloEFD ile kurulan ve deneysel olarak doğrulanan modelde, geliştirilen tasarımlar hava jetlerinin kavite içindeki dağılımını dengelemiş ve tepsi üzerindeki kek pişirme performansını artırmıştır. Burada dikkat çeken nokta şudur: FKS üzerinde yapılan küçük geometrik değişiklikler bile kavite genelinde ölçülebilir performans farkları yaratabilmektedir.

Park ve Lee [17] FKS ve kavite tasarımını doğrudan pişirme kalitesiyle ilişkilendiren çalışmalardan birini gerçekleştirmiştir. Esmerleşme homojenliği indeksini (UBI) kullanarak farklı konfigürasyonların ekmek pişirme performansını değerlendirmişler ve akış dağılımının UBI üzerinde belirleyici etkiye sahip olduğunu saptamışlardır.

Keyfoğlu ve Kırmızıgöl [6], 72 L hacimli bir ankastre fırında SolidWorks Flow Simulation ile ısıl verimlilik artırma çalışması yürütmüştür. Çalışma; rezistans ısıl gücü, ortam koşulları, malzeme özellikleri ve emaye yüzeylerin emisivite katsayıları tanımlanarak iletim, ışınım ve konveksiyonun birlikte çözülmesine dayanmakta ve kavite içi ile dış sac sıcaklıklarının deneysel ölçümüyle doğrulanmaktadır. Bu çalışma, EEI'yi düşürmeye yönelik tasarım müdahalelerinin HAD ile önceden değerlendirilebileceğini göstermesi bakımından önemlidir.

### 6.2. Hava kanalı ve hava perdesi tasarımı

Hava kanalları fanın bastığı havayı kavite içinde yönlendiren yapılardır. Kanalların şekli, boyutu ve kaviteye açılış noktaları akış desenini doğrudan biçimlendirir.

Pala ve ark. [10] endüstriyel ölçekte bir fırında hava perdesi tasarımını HAD ile optimize etmiştir. Hava perdesi, kavite ağzında oluşturulan yüksek hızlı bir hava akışı tabakasıdır ve asıl işlevi fırın kapağı açıldığında ısı kaybını sınırlamaktır. Pala ve ark. [10] hava perdesinin yalnızca ısı kaybını azaltmadığını, kavite içi akış desenini de etkilediğini göstermiş; tepsiler arasındaki bu sapmanın menfez yerleşimi ve hava perdesi tasarımıyla azaltılabileceğini raporlamıştır.

Fahey ve ark. [19] ev tipi bir fırında hava kanalı çıkış geometrisinin kavite içi akış yapısına etkisini incelemiştir. Kanal çıkışlarından giren hava jetlerinin açılma açıları ve kavite duvarlarıyla etkileşimi, ölü hacimlerin oluşumunu belirleyen faktörler arasındadır. Kanal çıkış geometrisindeki küçük değişiklikler jet yayılma açısını değiştirerek kavite köşelerine ulaşan hava miktarını artırabilir ya da azaltabilir.

Kişin ve ark. [18] hava kanalı tasarımının kavite içi momentum dağılımı üzerindeki etkisini 10 tepsili endüstriyel bir fırında sayısal olarak haritalamıştır. Fan kaynaklı basıncın kavite içinde nasıl dağıldığı, büyük ölçüde kanal geometrisi ve FKS delik konfigürasyonunun birlikte yarattığı akış direnci yapısına bağlıdır.

Sürekli tünel fırınlarında sorun bir boyut daha kazanır: ürün kavite boyunca hareket ettiği için maruz kaldığı akış alanı zamanla değişir. Therdthai ve ark. [35] üç boyutlu bir HAD modeliyle sürekli endüstriyel bir pişirme hattındaki sıcaklık profillerini ve hava akış desenlerini simüle etmiş; Wong ve ark. [36] ise ürünün U biçimli hareketini modele dâhil ederek kanal yerleşiminin ürün geçmişi üzerindeki etkisini göstermiştir. Bu çalışmalar, kesikli ev tipi fırınlar için geliştirilen kanal tasarım ilkelerinin endüstriyel sürekli hatlara doğrudan aktarılamayacağını ortaya koymaktadır.

### 6.3. Bütünleşik tasarım gerekliliği

Yukarıdaki bulgular tek bir sonuca yakınsar: **fan, FKS ve hava kanalı birbirinden bağımsız optimize edilemez.** Fan bir debi ve basınç kaynağıdır; FKS bu akışı jetlere böler; hava kanalı jetleri kaviteye taşır. Üçü seri bir akış direnci zinciri oluşturur ve birinde yapılan değişiklik diğer ikisinin çalışma noktasını kaydırır [2], [10], [16], [18]. Örneğin FKS delik alanının artırılması sistem direncini düşürür, fanın çalışma noktasını debi ekseninde kaydırır ve jet çıkış hızlarını azaltır; sonuçta jetler kavite köşelerine ulaşamaz hâle gelebilir. Bu nedenle parametrelerin tek tek tarandığı çalışmalar, etkileşim terimlerini gözden kaçırma riski taşır. Şahin'in [29] Taguchi tabanlı yaklaşımı ile Khatir ve ark.'nın [31], [32] çok amaçlı optimizasyon çerçevesi, bu etkileşimleri sistematik biçimde ele almanın iki farklı yolunu sunmaktadır.

---

## 7. ENERJİ VERİMLİLİĞİ STANDARTLARI VE İYİLEŞTİRME STRATEJİLERİ

Fırın tasarımında sıcaklık homojenliği tek başına yeterli değildir; ürünün pazara girebilmesi için enerji verimliliği sınırlarını da karşılaması gerekir.

### 7.1. Düzenleyici çerçeve ve EEI

Avrupa Birliği, 2009/125/EC sayılı Ekotasarım Direktifi'ni uygulayan **Komisyon Tüzüğü (AB) No 66/2014** ile ev tipi fırınlara yönelik enerji tüketim sınırlarını kademeli olarak sıkılaştırmıştır [3]. Tüzük 20 Şubat 2014'te yürürlüğe girmiş, gereklilikler 20 Şubat 2015'ten itibaren uygulanmaya başlamış ve yürürlüğe girişten beş yıl sonra (2019) daha sıkı bir EEI kademesi devreye girmiştir. Elektrikli ev tipi fırınlar için bu kademede aranan koşul, kavite Enerji Verimlilik İndeksi'nin (EEI_kavite) 96'nın altında kalmasıdır. Çok kaviteli fırınlarda en az bir kavitenin bu sıkı sınıra, diğerlerinin ise iki yıl sonrası için tanımlanan sınıra uyması gerekmektedir [3]. Ürünlerin tüketiciye sunulan enerji etiketi ve ürün fişi bilgileri ise **Komisyon Delege Tüzüğü (AB) No 65/2014** ile düzenlenmiştir [4].

EEI hesaplamasının temeli **EN IEC 60350-1** standardıdır [5]. Standartta belirli boyut ve nem içeriğine sahip ıslak tuğla yük blokları fırında hedef sıcaklığa kadar ısıtılır ve bu süreçte harcanan enerji ölçülür. Ölçüm kavite hacmine göre normalize edilip referans enerji tüketimiyle oranlanır; düşük EEI daha verimli fırın anlamına gelir.

Pratikte bunun anlamı şudur: üreticiler yalnızca fırının pişirme performansını değil, bunu ne kadar enerjiyle başardığını da kanıtlamak durumundadır. HAD simülasyonları bu süreçte enerji tüketimini prototip üretmeden tahmin etme olanağı sunar. Ancak simülasyonun güvenilir olması için ısı kayıplarının (duvarlar, kapak, sızdırmazlık) doğru modellenmesi şarttır.

### 7.2. Enerji tüketimini etkileyen tasarım faktörleri

Fırının enerji tüketimi yalnızca rezistans gücüyle belirlenmez; kaviteden dışarıya kaçan ısının büyüklüğü ve dağılımı en az o kadar belirleyicidir.

Altun ve ark. [7] fırın kapağının enerji tüketimine etkisini deneysel olarak incelemiştir. Kapak camı sayısı, cam arası boşluk ve sızdırmazlık kalitesi doğrudan enerji tüketimini etkilemektedir; çalışmada ön cam iç yüzeyine uygulanan alüminyum kaplama ile ölçülebilir bir enerji tasarrufu ve EEI iyileşmesi elde edilmiştir. Kayıp kalemleri arasındaki bu ayrım önemlidir: kapaktan ışınımla kaçan enerji, duvarlardan iletimle kaçan enerji ve sızıntı (infiltrasyon) kayıpları farklı tasarım müdahalelerine yanıt verir ve etkileri toplanabilir değildir. Smolka ve ark. [44] yalıtımlı duvarlardaki iletimi, kavite havasındaki taşınımı ve duvarlar arası ışınımı tek bir modelde birleştirerek bu kalemlerin ayrıştırılabileceğini göstermiş; duvar emisivitelerini ve U biçimli rezistansların sınır sıcaklıklarını deneysel olarak belirleyerek modeli doğrulamıştır.

Burhan ve ark. [14] farklı gövde yalıtım malzemelerinin kabin içi sıcaklık dağılımı üzerindeki etkisini incelemiştir. Yalıtım malzemesi yalnızca ısı kaybını azaltmaz; kavite duvar sıcaklıklarını da değiştirir. Duvar sıcaklığı değişince ışınım alışverişi de değişir, dolayısıyla sıcaklık homojenliği de etkilenir. Buradan çıkan önemli sonuç şudur: enerji verimliliği ile sıcaklık homojenliği arasındaki ilişki tek yönlü değildir; bazen homojenliği artıran bir tasarım değişikliği enerji tüketimini de düşürürken, bazen ek enerji maliyeti getirir. Keyfoğlu ve Kırmızıgöl [6] de ısıl verimlilik odaklı çalışmalarında ısı kayıplarının ve yüzey emisivitelerinin EEI üzerindeki etkisini sayısal olarak göstermiştir.

Smolka ve ark. [30] aynı deneysel olarak doğrulanmış üç boyutlu HAD modeli [44] üzerinden genetik algoritma ile kavite geometrisini optimize etmiştir. Hava giriş-çıkış noktalarını ve kavite şeklini değiştirerek, fan olmadan daha homojen bir sıcaklık alanı elde etmişlerdir. Fansız çalışmanın enerji açısından avantajı açıktır: fan motorunun kendisi de enerji harcar ve bu tüketim toplam EEI hesabına dâhildir. Şahin [29] ise Taguchi yöntemiyle tasarım parametrelerini sistematik biçimde değerlendirerek hem enerji tüketimini hem sıcaklık homojenliğini eş zamanlı iyileştirmeyi amaçlamış; çok amaçlı yaklaşımın tek metriğe odaklanan çalışmalara göre daha dengeli sonuçlar ürettiğini göstermiştir. Khatir ve ark. [32], ticari ekmek pişirme hatlarında enerji ısıl yönetimini Pareto tabanlı bir çerçevede ele alarak aynı ilkeyi endüstriyel ölçekte uygulamıştır.

### 7.3. HAD'a tamamlayıcı yaklaşım: düşük mertebeli dinamik modeller

Enerji tüketiminin bir pişirme çevrimi boyunca zamana bağlı analizi, HAD ile yapıldığında hesaplama maliyeti bakımından ağırdır. Ramirez-Laboreo ve ark. [39], elektrikli bir fırın ve içindeki yükü toplu parametreli (lumped) bir yapıyla temsil eden dinamik bir ısı ve kütle transferi modeli önermiştir. Model, cihazın ve yükün ana bileşenlerini ayrıştırarak rezistansların ve ürün içinin ısıl dinamiğini yeniden üretmektedir. Bu tür modeller kavite içi alan bilgisi vermez; buna karşılık kontrol stratejisi geliştirme, çevrim düzeyinde enerji analizi ve EEI testinin sanal ortamda tekrarlanması gibi görevlerde HAD'a güçlü bir tamamlayıcıdır. HAD ile elde edilen yerel ısı taşınım katsayısı alanlarının bu düşük mertebeli modellere girdi olarak aktarılması, literatürde henüz sistematik biçimde denenmemiş verimli bir birleşim önerisidir (bkz. Bölüm 10).

---

## 8. SICAKLIK HOMOJENLİĞİ METRİKLERİ

Fırın performansını değerlendirmek için sayısal bir ölçüte ihtiyaç vardır. Sıcaklık homojenliği sezgisel olarak anlaşılır bir kavram olsa da farklı çalışmalar bunu farklı biçimlerde nicelleştirmiştir.

### 8.1. Sıcaklık tabanlı ölçütler

En temel yaklaşım, kavite içinde birden fazla noktadan sıcaklık ölçüp bu değerlerin standart sapmasını hesaplamaktır. Yang ve ark. [8] 13 noktadan ölçüm almış ve noktalar arası farkın 10 °C'yi aşabildiğini saptamıştır. Pala ve ark. [10] ise farklı raflardaki tepsiler arasında, kaynakta bağıl sapma olarak bildirilen %12,76 düzeyinde bir fark kaydetmiştir.

Standart sapma yaygın kullanılır fakat tek başına yeterli bir metrik sayılmaz; sıcaklık dağılımının **mekânsal yapısını** yansıtmaz. Aynı standart sapmaya sahip iki kavite tamamen farklı pişirme sonuçları verebilir: birinde sıcak ve soğuk bölgeler büyük alanlar hâlinde ayrışırken, diğerinde küçük ve dağınık olabilir. Önal ve ark. [13] bu sınırlamayı göz önünde bulundurarak sıcaklık homojenliğini hem standart sapma hem ortalamadan sapma yüzdesi üzerinden değerlendirmiştir.

HAD simülasyonlarının bu noktada deneysel ölçümlere göre belirgin bir avantajı vardır. Deneyde kaviteye ancak sınırlı sayıda termokupl yerleştirilebilir; bu yüzden ölçüm noktaları arasındaki bölgeler hakkında doğrudan bilgi elde edilemez. Simülasyonda ise kavite hacminin tamamında sıcaklık alanı hesaplanır ve bu alan üzerinden standart sapma, varyasyon katsayısı, maksimum-minimum fark ve homojenlik indeksi gibi metriklerin hepsi hesaplanabilir [8], [13].

### 8.2. Pişirme tabanlı ölçütler

Park ve Lee [17] sıcaklık ölçümlerine dayanmak yerine doğrudan pişirme sonucunu ölçen bir metrik kullanmıştır. Esmerleşme homojenliği indeksi (uniformity of browning index, UBI), ekmek yüzeyindeki renk dağılımının ne kadar düzgün olduğunu nicelleştirir ve sonlu elemanlar analiziyle deneysel değerlendirme maliyetini düşürmeyi amaçlar.

UBI'nin sıcaklık tabanlı metriklere göre üstünlüğü, nihai ürün kalitesini doğrudan yansıtmasıdır. Kavite içinde sıcaklık dağılımı düzgün görünse bile, akış yapısı nedeniyle gıda yüzeyindeki konvektif katsayı homojen olmayabilir; gıda yüzeyinin her noktası aynı ısı akısını almaz ve bu fark sıcaklık homojenliği metriklerinde görünmeyebilir. Purlis [38] esmerleşmenin sıcaklık, nem ve süreye bağlı bir kinetik süreç olduğunu göstererek bu ayrımın kimyasal temelini ortaya koymuştur: yüzey rengi, anlık sıcaklığın değil, **maruz kalınan ısı ve kütle transferi geçmişinin** bir fonksiyonudur.

Timur ve ark. [9] ticari fırınlarda fan parametrelerinin pişirme sürecine etkisini değerlendirirken hem termokupl ölçümlerini hem pişirme testlerini birlikte kullanmıştır. Bilen ve ark. [16] da FKS tasarım değişikliklerinin kek pişirme performansına etkisini doğrudan gözlemlemiştir. Her iki çalışma, sıcaklık verisinin tek başına pişirme kalitesini tam olarak öngöremeyeceğini ortaya koyar. Bu nedenle kapsamlı bir performans değerlendirmesi hem sıcaklık tabanlı hem pişirme tabanlı metrikleri içermelidir.

EN IEC 60350-1 standardındaki ıslak tuğla ısıtma testi de bir performans ölçütü olarak kullanılabilir [5]. Standart koşullarda belirli bir sıcaklığa ulaşmak için harcanan enerji ve süre ölçülür; bu test hem enerji verimliliği hem ısıtma performansı hakkında bilgi verir. Altun ve ark. [7] tasarım değişikliklerinin etkisini bu standart test üzerinden değerlendirmiştir.

### 8.3. Metrik seçiminin optimizasyon sonucuna etkisi

Amaç fonksiyonu seçimi optimizasyon sonucunu doğrudan belirler. Yalnızca standart sapma minimize edilirse homojenlik artabilir, ancak ortalama sıcaklık hedeften sapabilir; yalnızca ortalama sıcaklık hedeflenirse dağılımın yapısı gözden kaçar. Yang ve ark. [8] sıcaklık homojenliği indeksini amaç fonksiyonu olarak kullanmış ve fan devir sayısı ile kavite geometrisini bu indeksi minimize edecek biçimde ayarlamıştır. Khatir ve ark. [31] ise en az üç hedefi (homojenlik, enerji, üretilebilirlik) aynı anda gözeterek Pareto cephesi üreten bir çerçeve kurmuştur; bu yaklaşımda tasarımcıya tek bir "optimum" değil, hedefler arasındaki ödünleşmeyi gösteren bir çözüm kümesi sunulur.

Metrik seçimine ilişkin pratik bir öneri şudur: **sıcaklık tabanlı bir metrik optimizasyon döngüsünde amaç fonksiyonu olarak, pişirme tabanlı bir metrik ise nihai doğrulamada kabul ölçütü olarak kullanılmalıdır.** Sıcaklık metrikleri ucuz ve türevlenebilirdir, dolayısıyla arama sürecine uygundur; UBI gibi pişirme metrikleri ise pahalıdır ancak kullanıcının algıladığı kaliteyle doğrudan ilişkilidir.

---

## 9. DENEYSEL DOĞRULAMA YÖNTEMLERİ

HAD sonuçlarının mühendislik kararlarına temel oluşturabilmesi, modelin deneysel verilerle karşılaştırılmasına bağlıdır. Bu bölümde, taranan literatürde kullanılan doğrulama yöntemleri ve bunların sınırlılıkları ele alınmaktadır.

### 9.1. Sıcaklık ölçümü: termokupl yerleşimi ve belirsizlik

Fırın doğrulama çalışmalarının neredeyse tamamı termokupl (genellikle K tipi) ölçümüne dayanır [8], [13], [15], [18]. Yöntemin yaygınlığı ucuzluğundan ve kolay uygulanabilirliğinden gelir; ancak üç önemli sınırlılığı vardır.

Birincisi **uzamsal örnekleme sorunudur.** Kaviteye yerleştirilebilen termokupl sayısı pratikte 5-15 arasındadır; Yang ve ark.'nın [8] 13 noktalı dizisi literatürdeki en yoğun örneklemelerden biridir. Bu, bir metreküpün onda biri mertebesindeki bir hacimde son derece seyrek bir örneklemedir ve ölü hacimler ile jet çarpma bölgeleri gibi keskin gradyanlı yapıların gözden kaçmasına yol açabilir. HAD modelinin bu noktalarda deneyle uyuşması, tüm alanın doğru olduğu anlamına gelmez.

İkincisi **ışınım hatasıdır.** Çıplak bir termokupl ucu, çevresindeki sıcak yüzeylerle (rezistanslar, kavite duvarları) ışınım alışverişine girer ve hava sıcaklığından sapan bir denge sıcaklığına ulaşır. 200 °C üzerindeki kavitelerde bu sapma birkaç dereceyi bulabilir. Kalkanlı (shielded) veya emme tipi (aspirated) termokupllar bu hatayı azaltır, ancak taranan çalışmaların çoğunda kalkan kullanımı raporlanmamıştır.

Üçüncüsü **termokupl varlığının akışı bozmasıdır.** Ölçüm probu ve kabloları, özellikle dar geçiş boşluklarında yerel akışı değiştirebilir.

Bu nedenlerle, sıcaklık ölçümüne dayalı doğrulamalarda ölçüm belirsizliğinin (termokupl sınıfı, veri toplayıcı çözünürlüğü, ışınım düzeltmesi, tekrarlanabilirlik) açıkça raporlanması ve HAD-deney farkının bu belirsizlik bandıyla birlikte sunulması gereklidir.

### 9.2. Hız alanı ölçümü

Sıcaklık, akış alanının bir sonucudur; dolayısıyla sıcaklık uyumu tek başına akış modelinin doğruluğunu kanıtlamaz. Farklı türbülans modelleri, birbirinden belirgin biçimde farklı hız alanları üretirken benzer ortalama sıcaklıklar verebilir. Bu nedenle **hız alanının bağımsız olarak doğrulanması** metodolojik açıdan kritiktir.

Verboven ve ark. [21], izotermal akış alanını yönsel olarak kalibre edilmiş sıcak-film hız sensörü ile nokta nokta ölçerek doğrulamış ve fan basınç-debi karakteristiğinin, fan çıkışındaki dönme (swirl) bileşeninin ve kavite geometrisinin modelin en kritik girdileri olduğunu göstermiştir. Bu çalışmanın metodolojik değeri, sıcaklık alanını [22] ayrı bir makalede ele alarak **izotermal akış doğrulaması ile ısıl doğrulamayı birbirinden ayırmasıdır**. İzleyen literatürde bu ayrımı koruyan çalışma sayısı azdır.

Parçacık Görüntülemeli Hız Ölçümü (PIV) gibi alan tabanlı optik teknikler, kavitenin tamamında hız alanı verisi sağlayabilir ve HAD doğrulaması için termokupl ölçümünden çok daha bilgilendiricidir. Ancak yüksek sıcaklık, optik erişim kısıtı ve tohumlama (seeding) parçacıklarının gıda ile temas etmemesi gerekliliği bu tekniklerin fırın kavitelerinde uygulanmasını güçleştirmektedir. Taranan literatürde fırın kavitesi içinde PIV ölçümüne dayanan bir doğrulama çalışmasına rastlanmamıştır.

### 9.3. Isı akısı ve ısı taşınım katsayısı ölçümü

Doğrulamanın en doğrudan biçimi, modelin öngördüğü yüzey ısı akısını ölçülen değerle karşılaştırmaktır. Boulet ve ark. [34] ısı akısı ölçüm cihazını doğrudan modellenen geometriye dâhil ederek bu karşılaştırmayı yapmış; Ploteau ve ark. [37] kesikli bir ekmek fırınında ısı akısı ve sıcaklık ölçümlerini birlikte kullanarak sayısal-deneysel karakterizasyon gerçekleştirmiştir.

Isı taşınım katsayısının kendisi de bir doğrulama büyüklüğü olarak kullanılabilir. Carson ve ark. [43] dört bağımsız yöntemi (geçici rejim sıcaklık verisinden geri hesaplama, ısı akısı sensörü, kütle kaybı hızı ve psikrometrik yöntem) karşılaştırmalı olarak uygulamış ve yöntemler arası tutarlılığı incelemiştir; bu, tek bir ölçüm tekniğine güvenmenin risklerini gösteren örnek bir çalışmadır. Sakin ve ark. [42] ise 70-220 °C aralığında fanlı ve fansız modlar için birleşik yüzey ısı taşınım katsayısını belirleyerek, HAD modellerinin sınır koşulu kalibrasyonunda kullanılabilecek bir referans veri seti üretmiştir.

Kızılötesi (IR) termografi, kavite yüzeylerinin ve yükün yüzey sıcaklık alanını temassız olarak haritalamayı sağlar. Mistry ve ark. [26] gaz fırınında IR ölçümlerini termokupl verileriyle birlikte kullanmıştır. IR'nin başlıca zorluğu emisivite kalibrasyonu ve fırın kapağından optik erişim gerekliliğidir; kapağın açılması ise ölçülmek istenen ısıl durumu bozar.

### 9.4. Standart yük testleri ve pişirme testleri

Sistem düzeyinde doğrulama için standartlaştırılmış yük testleri kullanılır. EN IEC 60350-1 [5] kapsamındaki ıslak tuğla testi, tekrarlanabilir bir ısıl yük tanımlar ve farklı laboratuvarlar arasında karşılaştırılabilir sonuç üretir; Altun ve ark. [7] tasarım değişikliklerini bu test üzerinden değerlendirmiştir. Ramirez-Laboreo ve ark. [39] ise bu standart testi düşük mertebeli bir dinamik modelle sanal ortamda yeniden üretmenin mümkün olduğunu göstermiştir.

Gerçek gıda ile yapılan pişirme testleri (kek, ekmek, kurabiye) nihai kabul ölçütüdür. Bilen ve ark. [16] tepsi üzerindeki keklerin sıcaklık dağılımını, Park ve Lee [17] ekmek yüzeyinin esmerleşme homojenliğini, Timur ve ark. [9] ise ticari fırınlarda pişirme sonuçlarını doğrulama verisi olarak kullanmıştır. Bu testlerin dezavantajı, hammadde değişkenliği ve öznel değerlendirme riski nedeniyle tekrarlanabilirliğinin düşük olmasıdır; Purlis'in [38] ortaya koyduğu esmerleşme kinetiği çerçevesi, renk ölçümünü öznellikten kurtarmanın kuramsal temelini sağlar.

### 9.5. Doğrulama raporlamasında iyi uygulama

Taranan literatürün karşılaştırmalı değerlendirmesinden, fırın HAD çalışmalarında doğrulama raporlaması için aşağıdaki asgari çerçeve önerilmektedir:

1. **Ağ yakınsama belirsizliği**, en az üç ağ seviyesi üzerinden GCI ile nicelenmeli ve raporlanmalıdır [40], [41].
2. **Akış alanı ve sıcaklık alanı ayrı ayrı doğrulanmalıdır**; izotermal akış doğrulaması, ısıl doğrulamadan önce yapılmalıdır [21], [22].
3. **Ölçüm belirsizliği** (termokupl sınıfı, ışınım düzeltmesi, konumlandırma toleransı, tekrar sayısı) açıkça verilmelidir.
4. **Karşılaştırma noktaları** yalnızca modelin iyi çalıştığı bölgelerden değil, ölü hacimler ve jet çarpma bölgeleri gibi zorlayıcı bölgelerden de seçilmelidir.
5. **Sapma metriği** tek bir yüzde değeri yerine, noktalar arası dağılım (ortalama mutlak hata, maksimum hata, RMS) biçiminde sunulmalıdır.
6. **Sınır koşulları** (rezistans gücü profili, duvar emisiviteleri, dış ortam sıcaklığı, sızdırmazlık kaçakları) tam olarak raporlanmalı, böylece çalışma bağımsız olarak yeniden üretilebilir olmalıdır.

---

## 10. ARAŞTIRMA BOŞLUKLARI VE GELECEK ÇALIŞMA ÖNERİLERİ

Taranan literatürün sentezinden, birbirini tamamlayan sekiz araştırma boşluğu belirlenmiştir.

**10.1. Sayısal belirsizliğin nicelenmemesi.** Fırın HAD literatüründe deneysel doğrulama yaygın olmasına karşın, ağ yakınsama belirsizliğinin GCI ile nicel raporlanması istisnasız biçimde eksiktir [40], [41]. Bu durum, farklı çalışmaların sonuçlarının karşılaştırılmasını güçleştirmektedir: bir çalışmanın bildirdiği yüzde birkaçlık deneysel sapma, sayısal belirsizliğin büyüklüğü bilinmeden anlamlandırılamaz — sapma ayrıklaştırma hatasından küçükse uyum tesadüfi olabilir. **Öneri:** Alandaki her yeni çalışma en az üç ağ seviyesinde GCI raporlamalı; dergiler bunu bir kabul koşulu olarak benimsemelidir.

**10.2. Fan-FKS-kanal etkileşiminin sistematik taranmaması.** Bölüm 6.3'te gösterildiği gibi bu üç bileşen seri bir akış direnci zinciri oluşturur; buna karşılık literatürdeki çalışmaların büyük çoğunluğu bir seferde tek bileşeni değiştirmektedir [2], [14], [16], [18]. **Öneri:** Fan çalışma noktası, FKS delik alanı/deseni ve kanal çıkış geometrisini aynı deney tasarımı içinde ele alan, etkileşim terimlerini de kestiren yanıt yüzeyi veya Taguchi tabanlı çalışmalar [29] yürütülmelidir.

**10.3. Çok amaçlı optimizasyonun ev tipi fırınlara uyarlanmaması.** Pareto tabanlı çok amaçlı çerçeveler ticari ekmek fırınları için olgunlaşmıştır [31], [32]; ancak ev tipi ankastre fırın geometrilerine, EEI kısıtı ve TS EN 60335 güvenlik sınırları [2] ile birlikte uyarlanmış bir uygulamaya rastlanmamıştır. **Öneri:** Amaç fonksiyonları {sıcaklık homojenliği, EEI, FKS yüzey sıcaklığı, üretilebilirlik} olan bir Pareto çalışması, alandaki en yüksek katma değerli boşluklardan biridir.

**10.4. Zamana bağlı çalışma stratejilerinin incelenmemesi.** Fan dönüş yönünün çevrim boyunca periyodik olarak değiştirilmesi bazı ticari ürünlerde uygulanmakla birlikte, bu stratejinin sıcaklık homojenliği üzerindeki zaman-ortalamalı etkisi HAD ile sistematik olarak incelenmemiştir. Mevcut çalışmalar dönüş yönünü statik bir tasarım değişkeni olarak ele almaktadır [9], [13]. **Öneri:** Kayan ağ veya zamana bağlı MRF ile periyodik yön değişiminin etkisini niceleyen geçici rejim çalışmaları.

**10.5. Hız alanı doğrulamasının terk edilmesi.** Verboven ve ark.'nın [21] izotermal akış doğrulaması, alanın metodolojik altın standardı olmasına rağmen izleyen literatürde büyük ölçüde sürdürülmemiştir; doğrulama pratiği termokupl ölçümüne indirgenmiştir. **Öneri:** Optik erişimli model kaviteler üzerinde PIV tabanlı doğrulama çalışmaları; en azından fan çıkışı ve FKS jet bölgeleri için nokta hız ölçümlerinin standart hâline getirilmesi.

**10.6. HAD ile düşük mertebeli modellerin birleştirilmemesi.** HAD, kavite içi yerel ısı taşınım katsayısı alanını üretebilir; düşük mertebeli dinamik modeller [39] ise çevrim boyunca enerji analizini ucuza yapabilir. Bu ikisinin bağlanması — HAD'dan çıkan konum bağımlı katsayı alanının toplu parametreli modele girdi olarak verilmesi — literatürde denenmemiştir. **Öneri:** Hibrit HAD/düşük mertebeli model çerçevesi ile EEI testinin sanal ortamda tekrarlanması.

**10.7. Pişirme tabanlı metriklerin optimizasyon döngüsüne girmemesi.** UBI [17] ve esmerleşme kinetiği [38] literatürde mevcuttur; ancak bu metrikler optimizasyon çalışmalarında amaç fonksiyonu olarak neredeyse hiç kullanılmamış, değerlendirme ağırlıklı olarak sıcaklık standart sapması üzerinden yapılmıştır [8], [13]. **Öneri:** Vekil (surrogate) modeller aracılığıyla esmerleşme tabanlı bir amaç fonksiyonunun optimizasyon döngüsüne dâhil edilmesi.

**10.8. Buhar ve nem taşınımının ihmal edilmesi.** Taranan fırın optimizasyon çalışmalarının hemen tamamı kavite havasını kuru hava olarak modellemektedir. Oysa pişirme sırasında üründen buharlaşan su, kavite havasının ısıl özelliklerini, ışınım katılımını ve yüzey ısı-kütle transferini değiştirmektedir; Purlis [38] esmerleşmenin nem geçmişine bağlılığını, Ploteau ve ark. [37] ise ısı akısının pişirme sürecinde nasıl değiştiğini göstermiştir. **Öneri:** Tür taşınımı (species transport) içeren, buhar dağılımını da çözen modellerin fan ve FKS optimizasyonuna dâhil edilmesi.

Bu boşlukların ortak paydası şudur: alan, **tekil parametre iyileştirmesinden bütünleşik ve belirsizliği nicelenmiş tasarım optimizasyonuna** geçiş aşamasındadır ve bu geçişi tamamlamamıştır.

---

## 11. SONUÇ

Bu derlemede, ev tipi ve endüstriyel fırınlarda fan ve hava kanalı geometrisinin HAD ile optimizasyonu konusundaki literatür, 44 kaynaktan oluşan bir havuz üzerinden sistematik biçimde incelenmiştir. Başlıca sonuçlar şunlardır:

1. **Sıcaklık homojenliği bir ısıl problem değil, bir akış tasarımı problemidir.** Kavitedeki sıcak ve soğuk noktalar, jet çarpma bölgeleri ile ölü hacimlerin doğrudan izdüşümüdür [8], [18], [19].

2. **Fan, FKS ve hava kanalı seri bir akış direnci zinciri oluşturur ve bağımsız optimize edilemez.** Birinde yapılan değişiklik diğer ikisinin çalışma noktasını kaydırır [2], [10], [16], [18].

3. **Fan devri doygun bir tasarım değişkenidir.** Belirli bir devrin ötesinde homojenlik iyileşmez, hatta kötüleşebilir; buna karşılık motor tüketimi EEI'yi doğrudan artırır [3], [13].

4. **Model seçimi, sorulan soruya bağlıdır.** Kavite ortalaması büyüklükler için k-ε ailesi yeterlidir; ayrılma, geri sirkülasyon ve yerel ısı akısı hedefleniyorsa k-ω SST gereklidir [13], [15], [23]-[25].

5. **Işınım ihmal edilemez; ancak model seçimi yakıt tipine bağlıdır.** Elektrikli fırınlarda S2S yeterli, gazlı fırınlarda DO gereklidir [11], [26], [28].

6. **Fan modellemesinde MRF, pişirme çevriminin zaman ölçekleri göz önüne alındığında savunulabilir bir ödünleşmedir**; kayan ağ yalnızca anlık jet yapısı veya akustik ilgi konusu olduğunda gereklidir [8], [15].

7. **Performans değerlendirmesi çift katmanlı olmalıdır:** optimizasyon döngüsünde sıcaklık tabanlı metrikler, nihai kabulde pişirme tabanlı metrikler (UBI) kullanılmalıdır [17], [38].

8. **Alanın en belirgin metodolojik eksiği, sayısal belirsizliğin nicelenmemesidir.** Deneysel doğrulama yaygınken GCI raporlaması yoktur [40], [41].

Bu sonuçlar, fırın tasarımında HAD'ın artık bir doğrulama aracı olmaktan çıkıp bir tasarım üretme aracına dönüştüğünü; ancak bu dönüşümün metodolojik altyapısının (belirsizlik niceleme, çok amaçlı optimizasyon, pişirme tabanlı amaç fonksiyonları) henüz tamamlanmadığını göstermektedir.

---

## KAYNAKLAR

[1] H. Doğan ve N. Yılankırkan, "Türkiye'nin enerji verimliliği potansiyeli ve projeksiyonu," *Gazi Üniversitesi Fen Bilimleri Dergisi Part C: Tasarım ve Teknoloji*, c. 3, s. 1, ss. 375-384, 2015.

[2] O. Gün, "Ankastre fırınlarda fan koruma sacının performans ve güvenliğe etkisinin incelenmesi," Yüksek Lisans Tezi, Fen Bilimleri Enstitüsü, Amasya Üniversitesi, Amasya, 2023.

[3] Komisyon Tüzüğü (AB) No 66/2014, 14 Ocak 2014, *Ev tipi fırınlar, ocaklar ve davlumbazlar için ekotasarım gerekliliklerine ilişkin olarak 2009/125/EC sayılı Direktifi uygulayan Tüzük*, OJ L 29, 31.01.2014, s. 33.

[4] Komisyon Delege Tüzüğü (AB) No 65/2014, 1 Ekim 2013, *Ev tipi fırınların ve davlumbazların enerji etiketlemesine ilişkin olarak 2010/30/EU sayılı Direktifi tamamlayan Tüzük*, OJ L 29, 31.01.2014, s. 1.

[5] EN IEC 60350-1:2023, *Household electric cooking appliances — Part 1: Ranges, ovens, steam ovens and grills — Methods for measuring performance*, CENELEC, Brüksel, 2023.

[6] M. Keyfoğlu ve S. F. Kırmızıgöl, "Sürdürebilirliği sağlamak amacıyla ankastre fırınlarda ısıl verimlilik artırma," *Eskişehir Osmangazi Üniversitesi Mühendislik ve Mimarlık Fakültesi Dergisi*, c. 33, s. 1, ss. 1679-1694, 2025, doi: 10.31796/ogummf.1433107.

[7] Ö. Altun, Ş. Yıldız ve T. Anık, "Ankastre ev tipi fırınlarda fırın kapağının enerji tüketimi ve enerji seviyesine etkisinin deneysel olarak incelenmesi," *Pamukkale Üniversitesi Mühendislik Bilimleri Dergisi*, c. 25, s. 4, ss. 403-409, 2019.

[8] Z. Yang, D. Cheng, B. Su, C. Ji, J. Huang, H. Li ve K. Zhang, "Study on the optimization of temperature uniformity in the oven under the forced convection mode," *Scientific Reports*, c. 13, mak. no. 12486, 2023, doi: 10.1038/s41598-023-39317-w.

[9] R. Timur, Z. Kahraman, M. Hacı ve H. S. Soyhan, "Evaluation of the effects of various fan parameters on the cooking process in commercial cooking ovens," *Journal of Physics: Conference Series*, c. 2766, s. 1, mak. no. 012016, 2024.

[10] B. Pala, T. Karamahmutoğlu ve R. Yüce, "Endüstriyel fırınlarda CFD analizleri ile hava perdesi tasarımı," *Akdeniz Mühendislik Dergisi*, c. 3, s. 2, ss. 172-183, 2025.

[11] N. H. Hassan, R. M. Salleh ve U. K. Ibrahim, "Effect of convection mode on radiation heat transfer distribution in domestic baking oven," *International Journal of Chemical Engineering and Applications*, c. 3, s. 6, ss. 404-406, 2012.

[12] F. F. Hincapié ve M. J. García, "A surrogate model of heat transfer mechanism in a domestic gas oven: A numerical simulation approach for premixed flames," *Applied Mechanics*, c. 5, s. 2, ss. 391-404, 2024, doi: 10.3390/applmech5020023.

[13] M. Önal, Ö. Ağra ve M. K. Sevindir, "Fanlı pişirici cihazlarda motor dönüş devri ve yönünün kavite içi hız ve sıcaklık dağılımına etkisinin sayısal ve deneysel incelenmesi," *Gazi Üniversitesi Mühendislik Mimarlık Fakültesi Dergisi*, c. 40, s. 3, ss. 1771-1786, 2025.

[14] M. Burhan, B. Kişin, A. A. Özalp ve E. Efeler, "Turbo kuzine fırınlarının radyal ve tanjansiyel fan ile farklı kanat açıları ve gövde izolasyonları kullanarak, kabin içi sıcaklık dağılımlarının deneysel ve nümerik olarak incelenmesi," *Uluslararası Bilim Teknoloji ve Tasarım Dergisi*, c. 3, s. 2, ss. 116-129, 2022.

[15] Z. Rek, M. Rudolf ve I. Žun, "Application of CFD simulation in the development of a new generation heating oven," *Strojniški vestnik — Journal of Mechanical Engineering*, c. 58, s. 2, ss. 134-144, 2012, doi: 10.5545/sv-jme.2011.163.

[16] F. Bilen ve ark., "Cooking performance optimization with new types of fan baffles in domestic built-in ovens," *Proceedings of the International Conference on Experimental and Numerical Flow and Heat Transfer (ENFHT'23)*, Lizbon, Portekiz, 26-28 Mart 2023, Bildiri No. ENFHT 168, doi: 10.11159/enfht23.168.

[17] S.-K. Park ve D.-K. Lee, "Design of domestic electric oven using uniformity of browning index of bread in baking process," *Journal of Mechanical Science and Technology*, c. 33, s. 9, 2019, doi: 10.1007/s12206-019-0827-7.

[18] B. Kişin, M. Burhan, O. Dede, K. İleri, C. Çelik ve A. A. Özalp, "Fırın içi momentum ve ısı transferi mekanizmalarının nümerik incelenmesi," *14. Ulusal Tesisat Mühendisliği Kongresi (TESKON 2019)*, İzmir, 2019, ss. 1127-1140.

[19] M. Fahey, S. Wakes ve C. Shaw, "Use of computational fluid dynamics in domestic oven design," *International Journal of Multiphysics*, c. 2, s. 1, ss. 37-58, 2008, doi: 10.1260/175095408784300216.

[20] N. Chhanwal, A. Tank, K. S. M. S. Raghavarao ve C. Anandharamakrishnan, "Computational fluid dynamics (CFD) modeling for bread baking process — A review," *Food and Bioprocess Technology*, c. 5, ss. 1157-1172, 2012, doi: 10.1007/s11947-012-0804-y.

[21] P. Verboven, N. Scheerlinck, J. De Baerdemaeker ve B. M. Nicolaï, "Computational fluid dynamics modelling and validation of the isothermal airflow in a forced convection oven," *Journal of Food Engineering*, c. 43, ss. 41-53, 2000.

[22] P. Verboven, N. Scheerlinck, J. De Baerdemaeker ve B. M. Nicolaï, "Computational fluid dynamics modelling and validation of the temperature distribution in a forced convection oven," *Journal of Food Engineering*, c. 43, ss. 61-73, 2000.

[23] B. E. Launder ve D. B. Spalding, "The numerical computation of turbulent flows," *Computer Methods in Applied Mechanics and Engineering*, c. 3, s. 2, ss. 269-289, 1974.

[24] T.-H. Shih, W. W. Liou, A. Shabbir, Z. Yang ve J. Zhu, "A new k-ε eddy viscosity model for high Reynolds number turbulent flows," *Computers & Fluids*, c. 24, s. 3, ss. 227-238, 1995.

[25] F. R. Menter, "Two-equation eddy-viscosity turbulence models for engineering applications," *AIAA Journal*, c. 32, s. 8, ss. 1598-1605, 1994, doi: 10.2514/3.12149.

[26] H. Mistry, S. Ganapathisubbu, S. Dey, P. Bishnoi ve J. L. Castillo, "A methodology to model flow-thermals inside a domestic gas oven," *Applied Thermal Engineering*, c. 31, s. 1, ss. 103-111, 2011.

[27] R. S. Reddy, D. Arepally ve A. K. Datta, "View factor computation and radiation energy analysis in baking oven with obstructions: Analytical and numerical method," *Journal of Food Process Engineering*, c. 46, s. 3, mak. no. e14270, 2023, doi: 10.1111/jfpe.14270.

[28] V. Jovicic, A. Zbogar-Rasic, B. Burjakow ve A. Delgado, "Role of individual heat transfer mechanisms within a model baking oven heated by porous volumetric ceramic burners," *Frontiers in Chemistry*, c. 8, mak. no. 511012, 2020, doi: 10.3389/fchem.2020.511012.

[29] S. Şahin, "A systematic approach to numerical analysis and validation for industrial oven design and optimization — A case study," *Isı Bilimi ve Tekniği Dergisi (Journal of Thermal Science and Technology)*, c. 45, s. 1, ss. 36-46, 2025, doi: 10.47480/isibted.1505298.

[30] J. Smolka, Z. Buliński ve A. J. Nowak, "Genetic algorithm shape optimisation of a natural air circulation heating oven based on an experimentally validated 3-D CFD model," *International Journal of Thermal Sciences*, 2013.

[31] Z. Khatir, H. M. Thompson, N. Kapur, V. Toropov ve J. Paton, "Multi-objective computational fluid dynamics (CFD) design optimisation in commercial bread-baking," *Applied Thermal Engineering*, c. 60, ss. 480-486, 2013.

[32] Z. Khatir, A. R. Taherkhani, J. Paton, H. Thompson, N. Kapur ve V. Toropov, "Energy thermal management in commercial bread-baking using a multi-objective optimisation framework," *Applied Thermal Engineering*, c. 80, ss. 141-149, 2015, doi: 10.1016/j.applthermaleng.2015.01.042.

[33] N. Chhanwal, A. Anishaparvin, D. Indrani, K. S. M. S. Raghavarao ve C. Anandharamakrishnan, "Computational fluid dynamics (CFD) modeling of an electrical heating oven for bread-baking process," *Journal of Food Engineering*, c. 100, ss. 452-460, 2010, doi: 10.1016/j.jfoodeng.2010.04.030.

[34] M. Boulet, B. Marcos, M. Dostie ve C. Moresoli, "CFD modeling of heat transfer and flow field in a bakery pilot oven," *Journal of Food Engineering*, c. 97, s. 3, ss. 393-402, 2010.

[35] N. Therdthai, W. Zhou ve T. Adamczak, "Three-dimensional CFD modelling and simulation of the temperature profiles and airflow patterns during a continuous industrial baking process," *Journal of Food Engineering*, c. 65, ss. 599-608, 2004.

[36] S. Y. Wong, W. Zhou ve J. Hua, "CFD modeling of an industrial continuous bread-baking process involving U-movement," *Journal of Food Engineering*, c. 78, s. 3, ss. 888-896, 2007, doi: 10.1016/j.jfoodeng.2005.11.033.

[37] J. P. Ploteau, V. Nicolas ve P. Glouannec, "Numerical and experimental characterization of a batch bread baking oven," *Applied Thermal Engineering*, c. 48, ss. 289-295, 2012, doi: 10.1016/j.applthermaleng.2012.04.060.

[38] E. Purlis, "Browning development in bakery products — A review," *Journal of Food Engineering*, c. 99, s. 3, ss. 239-249, 2010.

[39] E. Ramirez-Laboreo, C. Sagues ve S. Llorente, "Dynamic heat and mass transfer model of an electric oven for energy analysis," *Applied Thermal Engineering*, c. 93, ss. 683-691, 2016.

[40] P. J. Roache, "Perspective: A method for uniform reporting of grid refinement studies," *Journal of Fluids Engineering*, c. 116, s. 3, ss. 405-413, 1994, doi: 10.1115/1.2910291.

[41] I. B. Celik, U. Ghia, P. J. Roache ve C. J. Freitas, "Procedure for estimation and reporting of uncertainty due to discretization in CFD applications," *Journal of Fluids Engineering*, c. 130, s. 7, mak. no. 078001, 2008.

[42] M. Sakin, F. Kaymak-Ertekin ve C. Ilicali, "Convection and radiation combined surface heat transfer coefficient in baking ovens," *Journal of Food Engineering*, c. 94, s. 3-4, ss. 344-349, 2009.

[43] J. K. Carson, J. Willix ve M. F. North, "Measurements of heat transfer coefficients within convection ovens," *Journal of Food Engineering*, c. 72, s. 3, ss. 293-301, 2006.

[44] J. Smolka, Z. Buliński ve A. J. Nowak, "The experimental validation of a CFD model for a heating oven with natural air circulation," *Applied Thermal Engineering*, 2013.

---
---

# EK A — Bu sürümde yapılan düzeltmeler

Aşağıdaki liste, önceki taslakta tespit edilen hata ve eksiklerin her birine karşılık gelen müdahaleyi gerekçesiyle birlikte vermektedir. Makale bu hâliyle **gönderime hazırdır**; kapatılmamış açık madde bırakılmamıştır.

## A.1. Eksik bölümlerin yazılması

| # | Sorun | Müdahale |
|---|---|---|
| 1 | Özet ve Giriş "deneysel doğrulama yöntemleri" başlığını vaat ediyordu, bölüm yazılmamıştı | **Bölüm 9 (Deneysel Doğrulama Yöntemleri)** beş alt başlıkla yazıldı: termokupl ölçümü ve belirsizlik, hız alanı ölçümü, ısı akısı/ısı taşınım katsayısı ölçümü, standart yük ve pişirme testleri, doğrulama raporlamasında iyi uygulama |
| 2 | "Araştırma boşlukları tanımlanmış ve öneriler sunulmuştur" deniyordu, bölüm yoktu | **Bölüm 10**, sekiz gerekçelendirilmiş boşluk ve her biri için somut öneri ile yazıldı |
| 3 | Sonuç bölümü yoktu | **Bölüm 11**, sekiz maddelik sentez olarak yazıldı |
| 4 | "Sistematik biçimde incelenmektedir" iddiası vardı ama yöntem anlatılmamıştı | **Bölüm 2 (Yöntem)** eklendi: veri tabanları, arama dizeleri, dâhil/dışlama ölçütleri, havuz bileşimi tablosu, doğrulanabilirlik ölçütü ve sınırlılıklar |
| 5 | Birleşik kaynakça yoktu; yalnızca "Kaynaklar (Giriş Bölümü)" vardı | Tek bir **44 kayıtlık birleşik kaynakça** yazıldı |
| 6 | Giriş dosyasındaki ÖZET boştu; ayrı Özet dosyasıyla birleştirilmemişti | Özet metne yerleştirildi, İngilizce **Abstract** eklendi, anahtar kelimeler birleştirildi |
| 7 | Hiç tablo veya şekil yoktu | **Tablo 1** (22 çalışmanın modelleme tercihleri ve doğrulama yaklaşımları) ile Bölüm 2'deki havuz bileşimi tablosu eklendi |

## A.2. Numaralandırmanın birleştirilmesi

Giriş bölümü, içinde dört tekrar kayıt bulunan 28'lik bir listeye göre; 2-7. bölümler ise bu tekrarlar temizlenmiş 25'lik bir listeye göre numaralanmıştı. Tekrar kayıtlar silindi, tüm metin tek bir şemaya taşındı ve yeni kaynaklarla birlikte **metinde ilk geçiş sırasına göre** yeniden numaralandırıldı. Numaralandırmanın 1'den 44'e kesintisiz arttığı, her kaynağın en az bir kez atıf aldığı ve hiçbir atfın karşılıksız olmadığı programatik olarak doğrulanmıştır.

| Kaynak | Eski (Giriş) | Eski (Böl. 2-7) | **Yeni** |
|---|---|---|---|
| Doğan ve Yılankırkan | [1] | — | **[1]** |
| Gün | [2], [18] | [2] | **[2]** |
| AB ekotasarım / enerji etiketleme | [4] | [4] | **[3]** ve **[4]** (ikiye ayrıldı) |
| EN IEC 60350-1 | *(kaynakçada yoktu)* | *(kaynakçada yoktu)* | **[5]** |
| Keyfoğlu ve Kırmızıgöl | [3] | [3] | **[6]** |
| Altun ve ark. | [5], [28] | [5] | **[7]** |
| Bozgeyik | [6] | [6] | *(çıkarıldı — bkz. A.6)* |
| Yang ve ark. (2023) | [7] | [7] | **[8]** |
| Timur ve ark. | [8], [15] | [8] | **[9]** |
| Pala ve ark. | [9] | [9] | **[10]** |
| Hassan ve ark. | [10] | [10] | **[11]** |
| Hincapié ve García | [11] | [11] | **[12]** |
| Önal ve ark. | [12] | [12] | **[13]** |
| Yang ve ark. (2024) | [13] | [13] | *(çıkarıldı — bkz. A.6)* |
| Burhan ve ark. | [14] | [14] | **[14]** |
| Rek ve ark. | [16], [24] | [15] | **[15]** |
| Bilen ve ark. | [17] | [16] | **[16]** |
| Park ve Lee | [19] | [17] | **[17]** |
| Kişin ve ark. | [20] | [18] | **[18]** |
| Fahey ve ark. | [21] | [19] | **[19]** |
| Verboven ve ark. | [22], [23] | [20], [21] | **[21]**, **[22]** |
| Mistry ve ark. | [25] | [22] | **[26]** |
| Şahin | [26] | [23] | **[29]** |
| Smolka ve ark. | [27] | [24] | **[30]** |
| Celik ve ark. | *(kaynakçada yoktu)* | [25] | **[41]** |

## A.3. Künye hatalarının düzeltilmesi

| # | Kaynak | Hata | Düzeltme |
|---|---|---|---|
| 8 | [1] Doğan ve Yılankırkan | Başlık "Binalarda elektrik enerjisi tüketim oranları" ve yazar baş harfleri (O. Doğan, H. A. Yılankırkan) doğrulanamadı; dergi adı yoktu | **H. Doğan ve N. Yılankırkan, "Türkiye'nin enerji verimliliği potansiyeli ve projeksiyonu," Gazi Ü. Fen Bil. Derg. Part C, 3(1), 375-384, 2015** olarak düzeltildi |
| 9 | [3], [4] AB mevzuatı | "Ecodesign Directive — Energy Labelling Framework Regulation, 2019" adında tek bir belge yok; üç ayrı hukuki metin karıştırılmıştı | **Komisyon Tüzüğü (AB) No 66/2014** ve **Komisyon Delege Tüzüğü (AB) No 65/2014** olarak ikiye ayrıldı, OJ künyeleriyle verildi; 2019 tarihinin "yürürlüğe girişten beş yıl sonraki kademe" olduğu metinde açıklandı |
| 10 | [5] EN 60350 | Metinde geçiyor, kaynakçada yer almıyordu | **EN IEC 60350-1:2023** tam künyesiyle eklendi |
| 11 | [11] Hassan ve ark. | Sayfa numarası eksikti | **ss. 404-406** eklendi |
| 12 | [14] Burhan ve ark. | Başlık gerçek başlık değil parafrazdı; yazar sırası hatalıydı | Gerçek başlık ve yazar sırası (**M. Burhan, B. Kişin, A. A. Özalp, E. Efeler**) kullanıldı |
| 13 | [16] Bilen ve ark. | Yayın yeri yoktu | **ENFHT'23, Lizbon, 26-28 Mart 2023, Bildiri No. ENFHT 168, doi: 10.11159/enfht23.168** eklendi |
| 14 | [18] Kişin ve ark. | Kongre adı kısaltmayla veriliyordu | **14. Ulusal Tesisat Mühendisliği Kongresi (TESKON 2019), İzmir** olarak açıldı |
| 15 | [30] Smolka ve ark. | Dergi **yanlış**: "Applied Thermal Engineering" yazıyordu | **International Journal of Thermal Sciences (2013)** olarak düzeltildi. Karışıklığın kaynağı, aynı ekibin *Applied Thermal Engineering*'de çıkan farklı bir makalesiydi; **o makale de [44] olarak kaynakçaya eklendi**, böylece iki çalışma birbirinden ayrıldı |
| 16 | Genel | Hiçbir kaynakta DOI yoktu | Erişilebilen **17 kayda DOI eklendi** |
| 17 | Kaynakça formatı | "[15] R. Timur ve ark., [8] ile aynı." tipi dört satır vardı | Tekrar kayıtlar **silindi** |

## A.4. Metin–kaynak uyumsuzluklarının düzeltilmesi

| # | Konum (eski) | Hata | Düzeltme |
|---|---|---|---|
| 18 | Böl. 3.2 | *"Mistry ve ark. Surface-to-Surface (S2S) modelini tercih etmiştir"* | **Yanlış.** Mistry ve ark. DTRM, S2S ve DO modellerini karşılaştırmış ve **DO**'yu benimsemiştir; gerekçe, yanma ürünlerinin ışınıma katılan bir ortam oluşturmasıdır. Paragraf yeniden yazıldı; "elektrikli → S2S, gazlı → DO" ayrımı artık doğru kaynaklarla ([26], [12], [27], [34]) destekleniyor |
| 19 | Böl. 2.2 | *"…yer çekimi vektörünün hatalı girilmesinin sonuçları ne denli bozduğuna dikkat çekmiştir"* | Kaynakta karşılığı yok; iddia **kaldırıldı**, yerine kaynakta desteklenen "kaldırma etkilerinin doğru temsilinin belirleyiciliği" ifadesi kondu |
| 20 | Böl. 2.2 | Mistry'nin fırını *"doğal konveksiyonlu"* olarak niteleniyordu | Kaynak "unsteady, forced convective flow field" tanımı yapıyor; niteleme **kaldırıldı** |
| 21 | Böl. 2.2, 5.1, 7.2 | Park ve Lee'nin metriği üç yerde **"Browning Uniformity Index (BUI)"** yazılmıştı | Kaynaktaki doğru ad **"uniformity of browning index (UBI)"**; üç yerde de düzeltildi |
| 22 | Böl. 5.1, 6.2 | *"Keyfoğlu ve Kırmızıgöl FKS delik desenini değiştirerek…"* | Kaynakta FKS delik deseni geçmiyor; çalışma SolidWorks Flow Simulation ile ısıl verimlilik, dış sac sıcaklıkları, yalıtım ve emaye yüzey emisiviteleri üzerine. İddia **kaynağın gerçek içeriğine göre yeniden yazıldı** |
| 23 | Böl. 3.1 | Verboven'in yalnızca standart k-ε kullandığı anlatılıyordu | Verboven ve ark. **hem standart hem RNG k-ε** kullanmış ve benzer sonuç bulmuştur; düzeltildi |
| 24 | Böl. 3.1 | *"Fahey ve ark. RNG k-ε modelini kullanmış"* | Doğrulanamadı. Doğrulanabilen bilgiyle değiştirildi: **ANSYS CFX, iki boyutlu kararlı rejim model, sıcak-tel anemometre + termokupl ile %3'ün altında sapma**. RNG k-ε artık yalnızca Verboven'e atfediliyor |
| 25 | Böl. 3.4 | *"SolidWorks Flow Simulation'ı Yang ve ark. kullanmıştır"* | Doğrulanamadı. Yazılım, kullanımı **doğrulanmış olan Keyfoğlu ve Kırmızıgöl [6]**'e atfedildi |
| 26 | Böl. 3 | Bilen ve ark.'nın modelleme tercihi anlatılmamıştı | **FloEFD + k-ε + Kartezyen ağ** tercihi Bölüm 4.4'e ve Tablo 1'e eklendi |
| 27 | Böl. 2.1 | *"h = 25-80 W/m²K aralığına taşır"* — aralık atıf verilen kaynaklarda yok | **Ölçülmüş değerlerle değiştirildi:** Sakin ve ark. [42] fanlı 28-34, fansız 11-20 W/m²K; Carson ve ark. [43] 15-40 W/m²K. İki kaynak bu amaçla eklendi |
| 28 | Böl. 2.2 | *"Re = 10⁴-10⁵"* kesin bulgu gibi atfediliyordu | Mertebe tahmini olarak yeniden ifade edildi |
| 29 | Böl. 2.1 | *"hava hızını 0,5-3 m/s aralığında ölçmüş"* | Sayısal aralık doğrulanamadı; **ölçüm yöntemi** korunarak aralık kaldırıldı |
| 30 | Böl. 3.4 | *"Verboven ve ark. yaklaşık 150.000 elemanlık bir ağ kullanmıştır"* | Doğrulanamadı; niteliksel ifadeyle değiştirildi |
| 31 | Böl. 2.2 | *"Fahey ve ark. … hava hızının 0,1 m/s'nin altına düştüğü"* | Sayısal eşik doğrulanamadı; "geniş durağan bölgeler tespit etmiştir" olarak yazıldı |
| 32 | Böl. 3.4 | *y*⁺ eşikleri Önal ve Rek'e atfediliyordu | Eşikler türbülans modellerinin **birincil kaynaklarına** ([23] Launder-Spalding, [25] Menter) atfedildi |
| 33 | Böl. 2.2, 5.2, 7.1 | *"%12,76 sıcaklık farkı"* — yüzde cinsinden sıcaklık farkı tanımsız | Dört geçişin tamamında **"kaynakta bağıl sıcaklık sapması olarak bildirilen %12,76"** biçiminde, kaynağın kendi tanımına açıkça gönderme yapılarak yeniden yazıldı |
| 34 | Özet | *"36 çalışma (24 İngilizce, 12 Türkçe)"* — gerçek kaynakça 25 kayıttı | Kaynak sayısı **44'e çıkarıldı** ve Özet gerçek değerlerle (44 kaynak; 35 İngilizce / 9 Türkçe) yeniden yazıldı |
| 35 | Özet | Tarama aralığı "2000-2025" | Metodolojik birincil kaynaklarla birlikte aralık **1974-2026**; Bölüm 2.3'te gerekçelendirildi |

## A.5. İçerik zenginleştirmeleri

| # | Ekleme | Gerekçe |
|---|---|---|
| 36 | **Bölüm 5.3** (fan-kavite bütünleşik optimizasyonu) | Başlıkta öne çıkan "fan" konusu iki alt bölümle geçiştirilmişti; çok amaçlı optimizasyon literatürü eklendi |
| 37 | **Bölüm 6.3** (bütünleşik tasarım gerekliliği) | Tek cümleyle geçilen "üçü bağımsız optimize edilemez" tespiti, seri akış direnci zinciri fiziğiyle gerekçelendirildi |
| 38 | **Bölüm 7.3** (düşük mertebeli dinamik modeller) | Enerji bölümü yalnızca deneysel çalışmalara dayanıyordu; HAD'a tamamlayıcı modelleme yaklaşımı eklendi |
| 39 | **Bölüm 8.3** (metrik seçiminin optimizasyon sonucuna etkisi) | Dağınık gözlemler tek alt bölümde toplanıp pratik öneriye bağlandı |
| 40 | **Bölüm 4.1'e model seçim ölçütü** | "Tek bir en iyi model yok" tespiti, "soruya göre model seçimi" ilkesiyle işlevsel hâle getirildi |
| 41 | **Bölüm 4.3'e MRF savunması** | MRF'nin neden yeterli olduğu zaman ölçeği argümanıyla açıklandı |
| 42 | **Tablo 1'in yeniden kurgulanması** | Tablo 22 çalışmaya genişletildi. Boş hücreler, "yazarlar doldursun" notu yerine **"Bildirilmemiş" / "Yok" / "—"** olarak ayrıştırıldı; bu ayrım tablonun kendisini bir bulguya dönüştürdü (fan modelini bildiren beş, türbülans modelini bildiren sekiz çalışma; GCI bildiren hiç yok) ve Bölüm 9.5 ile 10.1'in doğrudan gerekçesi hâline geldi |
| 43 | Sayısal ayrıntıların eklenmesi | Timur ve ark.'nın fan çapları (280/350 mm) ve devirleri (450/1100/1655 RPM), Kişin ve ark.'nın 10 tepsili fırını, Gün'ün TS EN 60335 güvenlik sınırı bulgusu, Park ve Lee'nin aç/kapa denetim algoritması, Ploteau ve ark.'nın konveksiyon-ışınım ayrıştırması metne eklendi |
| 44 | Üslup birleştirmesi | Giriş'in ağır akademik üslubu ile 2-7. bölümlerin konuşma diline yakın üslubu arasındaki fark giderildi |

## A.6. Doğrulanamayan iki kaydın çözümü

Önceki sürümde iki kayıt "gönderim öncesi yazarlarca tamamlanmalı" notuyla bırakılmıştı. Açık madde bırakmamak için her ikisi de kapatıldı:

**(a) Yang ve ark. (2024), "Numerical simulation and structural optimization of forced convection oven".** Çalışmanın varlığı doğrulandı, ancak yayımlandığı dergi veya konferans hiçbir açık kaynakta tespit edilemedi. Künyesiz bir kayıt hakem sürecinde doğrudan itiraz konusu olacağından kaynak **havuzdan çıkarıldı.** Metinde iki yerde kullanılıyordu: Bölüm 1'de zorlanmış konveksiyonun baskınlığı — bu iddia zaten Yang ve ark. (2023) [8] ve Önal ve ark. [13] tarafından taşınıyordu ve atıflar bunlara çevrildi; Bölüm 5.3'te fan-kavite eş zamanlı optimizasyonu — paragraf, aynı bulguyu içeren [8] ile Khatir ve ark. [31], [32] üzerinden yeniden yazıldı ve doğrulanamayan sayısal değerler (standart sapmalarda 5,46→2,26 °C iyileşmesi; %2,70 sapma) çıkarıldı. Bölüm 10.1'deki argüman, belirli bir çalışmaya atıf yapmadan genel biçimde ifade edildi.

**(b) Bozgeyik (2006), yüksek lisans tezi.** Bu başlıkla bir tez İTÜ açık arşivinde, DergiPark'ta veya genel aramada bulunamadı. Aynı konuda bir İTÜ Fen Bilimleri Enstitüsü tezi mevcuttur ("Elektrikli ankastre fırınlarda enerji tüketiminin deneysel ve teorik inceleme ile azaltılması", 2007; yalıtım, ön kapak yapısı ve infiltrasyon kayıplarını inceleyerek %30 tasarruf bildirmektedir) ancak yazarı bu kayıtla eşleştirilemedi. Kaynak **havuzdan çıkarıldı.** Metinde üç yerde kullanılıyordu ve üçünde de iddia doğrulanmış kaynaklara devredildi: Bölüm 1'de enerji verimliliği çalışmaları — [6] ve [7] yeterli; Bölüm 7.2'de yalıtım/kapak/sızdırmazlık kayıplarının toplanabilir olmadığı — paragraf, kayıp kalemlerinin ayrıştırılabilirliğini deneysel olarak gösteren Smolka ve ark. [44] üzerinden yeniden yazıldı; Bölüm 8.2 ve 9.4'te EN 60350-1 tuğla testinin kullanımı — Altun ve ark. [7] tek başına taşımaktadır.

> **Yazarlara not:** Bu iki çalışmanın tam künyesi elinizde ise (örneğin basılı tez veya makalenin ayrı basımı), kaynakçaya geri eklenmeleri makaleyi güçlendirir. Ancak makale mevcut hâliyle eksiksizdir; geri ekleme **zorunlu değil, isteğe bağlıdır.**

## A.7. Doğrulama durumu

| Ölçüt | Durum |
|---|---|
| Künyesi birincil kaynağından doğrulanan kayıt | **44 / 44** |
| Uydurma (var olmayan) kaynak | **0** |
| Kaynakçada tanımsız atıf | **0** |
| Hiç atıf almayan kaynak | **0** |
| Numaralandırmanın ilk geçiş sırasıyla uyumu | **Kesintisiz 1→44** |
| Açık bırakılan madde | **Yok** |

---

# EK B — Kaynakçaya eklenen çalışmalar, gerekçeleri ve kullanım yerleri

Kaynak havuzu **25'ten 44'e** çıkarıldı: 21 kayıt eklendi, künyesi doğrulanamayan 2 kayıt çıkarıldı (Ek A, A.6). Aşağıda her yeni kaynağın **neden gerekli olduğu** ve **makalede nerede, nasıl kullanıldığı** verilmektedir. Hiçbir kaynak "sayı artırmak için" eklenmemiş; her biri metinde en az bir somut boşluğu kapatmaktadır.

## B.1. Düzenleyici metin ve standartlar (2 kayıt)

**[4] Komisyon Delege Tüzüğü (AB) No 65/2014**
- *Neden gerekli:* Önceki taslakta ekotasarım ve enerji etiketleme mevzuatı tek ve hatalı bir künyede birleştirilmişti. Bu iki tüzük farklı hukuki işlevlere sahiptir: biri ürünün pazara girme koşulunu, diğeri tüketiciye sunulan bilgiyi düzenler.
- *Kullanım:* Bölüm 1 (mevzuat çerçevesi), Bölüm 7.1. [3] ile birlikte hatalı eski kaydın yerini alır.

**[5] EN IEC 60350-1:2023**
- *Neden gerekli:* Makale EEI ve ıslak tuğla testinden dört ayrı yerde söz ediyordu, ancak standardın kendisi kaynakçada yoktu — ölçüm yönteminin dayanağı kaynaksız kalıyordu.
- *Kullanım:* Bölüm 1; Bölüm 5.2 (fan motorunun EEI'ye katkısı); Bölüm 7.1 (EEI hesabının temeli); Bölüm 8.2 (tuğla testinin performans ölçütü olarak kullanımı); Bölüm 9.4 (standart yük testi).

## B.2. Türbülans modellerinin birincil kaynakları (3 kayıt)

**[23] Launder ve Spalding (1974)** — standart k-ε · **[24] Shih ve ark. (1995)** — Realizable k-ε · **[25] Menter (1994)** — k-ω SST

- *Neden gerekli:* Bölüm 4.1 üç türbülans modelinin özelliklerini tartışıyor ve aralarında seçim yapıyordu; ancak modellerin hiçbirinin birincil kaynağı verilmemişti. Bir derleme makalesinde model özelliklerine ilişkin iddiaların (duvar fonksiyonu bağımlılığı, gerçeklenebilirlik, hibrit geçiş davranışı) modelin kendi kaynağına dayandırılması zorunludur. Ayrıca *y*⁺ eşiklerinin hatalı biçimde uygulama makalelerine atfedilmesi sorunu (Ek A, madde 32) ancak bu kaynaklarla giderilebilirdi.
- *Kullanım:* Bölüm 1 (modelleme evriminin özeti); Bölüm 4.1 (her modelin tanıtımı ve seçim ölçütü); Bölüm 4.4 (*y*⁺ gereklilikleri); Bölüm 11 (sonuç maddesi 4).

## B.3. Sayısal belirsizlik (1 kayıt)

**[40] Roache (1994)**
- *Neden gerekli:* Önceki taslak GCI'yi yalnızca Celik ve ark. [41] üzerinden anıyordu. GCI'yi ilk öneren ve Richardson ekstrapolasyonuna dayandıran çalışma Roache'un 1994 makalesidir; Celik ve ark. bunu ASME için standart prosedür hâline getirmiştir. İkisinin birlikte verilmesi, yöntemin kökeni ile standartlaşması arasındaki ayrımı doğru kurar.
- *Kullanım:* Bölüm 1; Bölüm 4.4 (GCI'nin tanıtımı ve alandaki eksikliğin tespiti); Bölüm 9.5 (raporlama önerisi 1); Bölüm 10.1; Bölüm 11 (sonuç maddesi 8).

## B.4. Işınım modellemesi (2 kayıt)

**[27] Reddy, Arepally ve Datta (2023)** — engelli kavitede görüş faktörü hesabı
- *Neden gerekli:* Makale S2S modelinin "geometrik görüş faktörlerine dayandığını" söylüyor ama görüş faktörü hesabına ilişkin hiçbir kaynak vermiyordu. Üstelik fırın kavitesi tepsi, raf ve rezistanslarla dolu bir "engelli" geometridir ve bu, görüş faktörü hesabının en zor hâlidir. Reddy ve ark. tam bu problemi ele alır.
- *Kullanım:* Bölüm 3.1 (engellerin ışınım alışverişini yeniden dağıtması); Bölüm 4.2 (S2S yaklaşımının nasıl kurulacağı); Tablo 1.

**[28] Jovicic ve ark. (2020)** — mekanizma paylarının ayrıştırılması
- *Neden gerekli:* "Işınımın toplam ısı transferindeki payı önemlidir" iddiası, önceki taslakta yalnızca üç sayfalık kısa bir makaleye [11] dayanıyordu. Bu, derlemenin merkezî iddialarından biri için zayıf bir tek dayanaktı.
- *Kullanım:* Bölüm 3.1; Bölüm 4.2 (ışınımı ihmal etmenin hata kaynağı olduğu sonucu); Tablo 1; Bölüm 11 (sonuç maddesi 5).

## B.5. Isı taşınım katsayısı ölçümü (2 kayıt)

**[42] Sakin, Kaymak-Ertekin ve Ilicali (2009)**
- *Neden gerekli:* Önceki taslaktaki *h* = 25-80 W/m²K aralığı atıf verilen kaynaklarda doğrulanamıyordu (Ek A, madde 27). Bu çalışma 70-220 °C aralığında fanlı (28-34 W/m²K) ve fansız (11-20 W/m²K) modlar için birleşik yüzey ısı taşınım katsayısını doğrudan ölçmüştür.
- *Kullanım:* Bölüm 3.1 (fanın konvektif katsayı üzerindeki etkisinin nicel ifadesi); Bölüm 5.1 (katsayı aralığının genişliğinin homojenlik açısından yorumu); Bölüm 9.3 (sınır koşulu kalibrasyonu için referans veri seti); Tablo 1.

**[43] Carson, Willix ve North (2006)**
- *Neden gerekli:* Aynı sayısal boşluğu bağımsız bir ölçüm setiyle destekler (15-40 W/m²K); ayrıca dört farklı ölçüm yöntemini karşılaştırdığı için Bölüm 9'un metodolojik omurgasını oluşturur.
- *Kullanım:* Bölüm 3.1; Bölüm 5.1; Bölüm 9.3 (tek ölçüm tekniğine güvenmenin riskleri); Tablo 1.

## B.6. Gıda mühendisliği kaynaklı fırın-HAD damarı (6 kayıt)

Bu grup, önceki taslağın en büyük kapsam boşluğunu kapatır: makale "kapsamlı derleme" iddiasındaydı ancak fırın-HAD literatürünün gıda mühendisliği kanadını (*Journal of Food Engineering*, *Food and Bioprocess Technology*) hiç içermiyordu.

**[20] Chhanwal ve ark. (2012)** — ekmek pişirme HAD modellemesi derlemesi
- *Neden gerekli:* Alandaki mevcut en yakın derleme. Bir derleme makalesinin, kendisinden önceki derlemeleri konumlandırmadan "boşluk" iddiasında bulunması metodolojik olarak savunulamaz.
- *Kullanım:* Bölüm 1 (HAD'ın tasarım aracı olarak konumlandırılması ve önceki derlemelerin anılması).

**[33] Chhanwal ve ark. (2010)** — elektrikli pişirme fırını HAD modeli
- *Kullanım:* Bölüm 1 (gıda mühendisliği damarının tanıtımı); Tablo 1.

**[34] Boulet ve ark. (2010)** — pilot ölçekli fırın; Realizable k-ε + S2S + ısı akısı sensörü
- *Neden gerekli:* Üç boşluğu birden kapatır: (i) Realizable k-ε'nın fırın uygulamasında bağımsız bir örneği, (ii) elektrikli fırında S2S kullanımının doğrulanmış bir örneği, (iii) ısı akısı sensörünü doğrudan modele dâhil eden bir doğrulama yaklaşımı.
- *Kullanım:* Bölüm 1; Bölüm 3.2 (sınır tabaka çözünürlüğü-yerel ısı akısı ilişkisi); Bölüm 4.1; Bölüm 4.2; Bölüm 9.3; Tablo 1.

**[35] Therdthai ve ark. (2004)** ve **[36] Wong ve ark. (2007)** — sürekli endüstriyel tünel fırınları
- *Neden gerekli:* Makalenin başlığı "endüstriyel fırınlar" ifadesini içermesine rağmen, önceki taslaktaki endüstriyel örnekler yalnızca **kesikli** çok tepsili fırınlardı. Sürekli tünel fırınları endüstriyel pişirmenin büyük bölümünü oluşturur ve orada ürün kavite içinde hareket ettiği için akış-ürün etkileşimi zamana bağlıdır. Bu ayrım yapılmadan başlıktaki "endüstriyel" iddiası eksik kalıyordu.
- *Kullanım:* Bölüm 1; Bölüm 3.2 (sınır tabaka koşullarının zamana bağlılığı); Bölüm 6.2 (kesikli fırın kanal ilkelerinin sürekli hatlara aktarılamaması); Tablo 1.

**[37] Ploteau, Nicolas ve Glouannec (2012)** — kesikli ekmek fırınının sayısal-deneysel karakterizasyonu
- *Neden gerekli:* Isı akısının konveksiyon ve ışınım bileşenlerine ayrıştırıldığı, doğrulama metodolojisi açısından örnek bir çalışma; ayrıca Bölüm 10.8'deki buhar/nem boşluğunun gerekçelendirilmesinde kullanılır.
- *Kullanım:* Bölüm 1; Bölüm 9.3; Bölüm 10.8; Tablo 1.

**[38] Purlis (2010)** — esmerleşme kinetiği derlemesi
- *Neden gerekli:* Önceki taslak UBI/esmerleşme metriğini üç bölümde kullanıyordu ama esmerleşmenin **neden** sıcaklıkla değil ısı-kütle transferi geçmişiyle belirlendiğine dair kuramsal dayanağı vermiyordu. Bu, "sıcaklık homojen olsa bile pişirme homojen olmayabilir" argümanının temelidir.
- *Kullanım:* Bölüm 3.2; Bölüm 8.2 (UBI'nin sıcaklık metriklerine üstünlüğünün kimyasal temeli); Bölüm 9.4 (renk ölçümünün öznellikten kurtarılması); Bölüm 10.7; Bölüm 10.8; Bölüm 11 (sonuç maddesi 7).

## B.7. Çok amaçlı optimizasyon (2 kayıt)

**[31] Khatir ve ark. (2013)** ve **[32] Khatir ve ark. (2015)**
- *Neden gerekli:* Önceki taslak optimizasyon başlığı altında yalnızca Taguchi [29] ve genetik algoritma [30] örnekleri veriyordu; ikisi de tek amaçlı ya da ardışık yaklaşımlardır. Oysa fırın tasarımı doğası gereği çok amaçlıdır (homojenlik ↔ enerji ↔ güvenlik ↔ üretilebilirlik) ve bu ödünleşmeyi Pareto cephesi üzerinden ele alan olgun bir literatür mevcuttur. Bu kaynaklar olmadan Bölüm 10.3'teki araştırma boşluğu iddiası temellendirilemezdi.
- *Kullanım:* Bölüm 1; Bölüm 5.3; Bölüm 6.3; Bölüm 7.2 (endüstriyel ölçekte enerji ısıl yönetimi); Bölüm 8.3 (Pareto cephesi ile tek "optimum" arasındaki fark); Bölüm 10.3; Tablo 1.

## B.8. Enerji analizinde tamamlayıcı modelleme (1 kayıt)

**[39] Ramirez-Laboreo, Sagues ve Llorente (2016)**
- *Neden gerekli:* Enerji verimliliği bölümü tamamen deneysel çalışmalara dayanıyordu; HAD dışındaki modelleme yaklaşımları hiç anılmıyordu. Toplu parametreli dinamik modeller, EEI testinin sanal ortamda tekrarlanması gibi pratik bir işlevi yerine getirir ve HAD'ın rakibi değil tamamlayıcısıdır. Ayrıca Bölüm 10.6'daki hibrit model önerisinin dayanağıdır.
- *Kullanım:* Bölüm 1; Bölüm 7.3; Bölüm 9.4; Bölüm 10.6.

## B.9. Kaynak ayrıştırması (1 kayıt)

**[44] Smolka, Buliński ve Nowak (2013), *Applied Thermal Engineering*** — HAD modelinin deneysel doğrulaması
- *Neden gerekli:* Önceki taslakta [30] numaralı genetik algoritma çalışmasının dergisi hatalı biçimde *Applied Thermal Engineering* olarak verilmişti. Hatanın kaynağı, aynı ekibin *aynı yıl* bu dergide yayımladığı **farklı** bir makaleydi. İki çalışmayı ayrı ayrı kaynakçaya almak hem hatayı kalıcı biçimde giderir hem de bir boşluğu kapatır: optimizasyon makalesi "deneysel olarak doğrulanmış bir modele dayandığını" söyler, o doğrulamanın kendisi ise bu ikinci makaledir (ANSYS Fluent; yalıtımlı duvarlarda iletim, kavite havasında taşınım, duvarlar arası ışınım; deneysel olarak ölçülmüş emisiviteler ve rezistans sınır sıcaklıkları).
- *Kullanım:* Bölüm 7.2 (kayıp kalemlerinin ayrıştırılabilirliği — çıkarılan Bozgeyik kaydının taşıdığı iddianın yerini alır); Tablo 1.

## B.10. Ekleme sonrası havuzun profili

| Ölçüt | Önceki taslak | Bu sürüm |
|---|---|---|
| Toplam kaynak | 25 (listede 28 satır; 4'ü tekrar kayıt) | **44** |
| Hakemli dergi makalesi | 18 | **30** |
| Metodolojik birincil kaynak | 1 | **5** |
| Düzenleyici metin / standart | 1 (hatalı künye) | **3** |
| Tez ve konferans bildirisi oranı | %20 | **%9** |
| DOI verilen kayıt | 0 | **17** |
| İngilizce / Türkçe | 15 / 10 | **35 / 9** |
| 2010 ve sonrası | %72 | **%73** |
| Künyesi doğrulanmamış kayıt | 9 | **0** |

Tez ve konferans bildirisi oranının %20'den %9'a düşmesi, önceki taslakta merkezî iddiaların (FKS etkisi, ışınımın payı, ısı taşınım katsayısı büyüklüğü) tez ve kısa bildirilerle taşınması sorununu doğrudan giderir: bu iddiaların her biri artık en az bir hakemli dergi kaynağıyla da desteklenmektedir. "Künyesi doğrulanmamış kayıt" satırındaki 9→0 değişimi ise Ek A.3 ve A.6'nın birleşik sonucudur.
