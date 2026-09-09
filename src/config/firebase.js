import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// DEBUG: Verifikasi nilai konfigurasi yang terbaca dari .env
console.log("🔧 [Firebase Config] projectId:", firebaseConfig.projectId);
console.log("🔧 [Firebase Config] authDomain:", firebaseConfig.authDomain);
console.log("🔧 [Firebase Config] appId:", firebaseConfig.appId);

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan Firebase Authentication dan dapatkan referensinya
export const auth = getAuth(app);

// Inisialisasi layanan Cloud Firestore Database
// Explicit database ID '(default)' memastikan SDK mengarah ke database yang benar
export const db = getFirestore(app, "(default)");

// Ekspor app jika nantinya butuh layanan lain (misal Storage)
export default app;
