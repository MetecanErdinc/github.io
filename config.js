/* ==========================================================================
   config.js — Firebase yapılandırması
   --------------------------------------------------------------------------
   Firebase konsolundan aldığınız bilgileri buraya yapıştırın; böylece TÜM
   cihazlarınız (iPhone, Android tablet, Windows) aynı ayarla açılır.

   Adım adım anlatım için: KURULUM.md

   NOT: Bu değerler gizli bilgi DEĞİLDİR, herkese açık olacak şekilde
   tasarlanmışlardır. Verilerinizi koruyan şey firestore.rules dosyasındaki
   güvenlik kurallarıdır — o kuralları mutlaka yükleyin.
   ========================================================================== */

export const firebaseConfig = {
  apiKey:            "BURAYA_APIKEY",
  authDomain:        "BURAYA_PROJE.firebaseapp.com",
  projectId:         "BURAYA_PROJE",
  storageBucket:     "BURAYA_PROJE.appspot.com",
  messagingSenderId: "BURAYA_SENDER_ID",
  appId:             "BURAYA_APP_ID",
};
