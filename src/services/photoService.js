import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Mengambil semua foto milik pengguna tertentu dari Cloud Firestore.
 *
 * @param {string} userId - Firebase Authentication UID milik pengguna.
 * @returns {Promise<Array<object>>} - Array berisi data foto beserta document ID.
 */
export const getUserPhotos = async (userId) => {
  if (!userId) {
    throw new Error("userId wajib disertakan untuk mengambil data foto.");
  }

  // 1. Buat referensi ke collection 'photos'
  const photosRef = collection(db, "photos");

  // 2. Buat query dengan filter berdasarkan userId
  const q = query(photosRef, where("userId", "==", userId));

  // 3. Eksekusi query untuk mendapatkan snapshot dokumen
  const querySnapshot = await getDocs(q);

  // 4. Petakan dokumen snapshot ke dalam bentuk array object yang menyertakan doc.id
  const photos = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return photos;
};
