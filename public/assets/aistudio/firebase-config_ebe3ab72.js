/* Tetapan Misi SENSAVOUR. Edit fail ini sahaja selepas cipta projek Firebase. */

// 1) Tampal config "Web app" dari Firebase Console (Project settings > Your apps).
window.FIREBASE_CONFIG = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI",
  appId: "GANTI"
};

// 2) Tetapan aplikasi.
window.APP_CONFIG = {
  SENSAVOUR_URL: "https://borneosensorywheel.netlify.app",
  // Masa minimum meneroka (saat). MESTI sama dengan nilai dalam firestore.rules (duration.value(300, 's')).
  MIN_EXPLORE_SECONDS: 300
};
