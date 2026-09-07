import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Konfigurasi Firebase Anda yang diambil dari environment variables (.env)
// Di Vite, prefix VITE_ digunakan untuk mengekspos variabel ke client-side.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan Firebase Authentication dan dapatkan referensinya
export const auth = getAuth(app);

// Ekspor app jika nantinya butuh layanan lain (misal Firestore/Storage)
export default app;
