import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../config/firebase";

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
  const photos = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Kompatibilitas pembacaan komponen UI galeri
      imageUrl: data.imageUrl || data.image_url,
      createdAt: data.createdAt || data.created_at,
    };
  });

  return photos;
};

// Batasan format MIME type dan ukuran maksimum (10 MB)
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Memvalidasi apakah file yang diberikan memenuhi persyaratan foto galeri:
 * 1. File wajib ada.
 * 2. MIME type harus image/jpeg, image/png, atau image/webp.
 * 3. Ukuran file maksimal 10 MB.
 *
 * @param {File} file - Objek file dari input browser.
 * @returns {boolean} - True jika file valid.
 * @throws {Error} - Error dengan pesan yang jelas jika file tidak memenuhi syarat.
 */
export const validatePhotoFile = (file) => {
  // 1. Validasi keberadaan file
  if (!file) {
    throw new Error("File tidak ditemukan.");
  }

  // 2. Validasi format MIME type (image/jpeg, image/png, image/webp)
  const fileType = file.type?.toLowerCase();
  if (!ALLOWED_PHOTO_TYPES.includes(fileType)) {
    throw new Error("Format file tidak didukung. Hanya file JPG, PNG, atau WEBP yang diperbolehkan.");
  }

  // 3. Validasi ukuran file (maksimal 10 MB)
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("Ukuran file maksimal 10 MB.");
  }

  return true;
};

/**
 * Mengunggah satu file foto ke Firebase Storage pada path terisolasi:
 * photos/{userId}/{uniqueId}_{originalFileName}
 *
 * @param {File} file - Objek file gambar yang akan diunggah.
 * @returns {Promise<{
 *   downloadURL: string,
 *   storagePath: string,
 *   fileName: string,
 *   originalFileName: string,
 *   fileSize: number,
 *   contentType: string
 * }>}
 */
export const uploadPhoto = async (file) => {
  // 1. Validasi file foto
  validatePhotoFile(file);

  // 2. Pastikan user sedang login & ambil UID dari auth.currentUser
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }
  const userId = currentUser.uid;

  // 2. Buat unique ID (prioritaskan crypto.randomUUID dengan fallback)
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);

  // 3. Sanitasi nama file asli agar aman di Storage path (tanpa merusak ekstensi)
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueFileName = `${uniqueId}_${sanitizedFileName}`;

  // 4. Buat Storage path sesuai standar Task 3.3
  const storagePath = `photos/${userId}/${uniqueFileName}`;

  // 5. Buat referensi Storage
  const storageRef = ref(storage, storagePath);

  // 6. Jalankan uploadBytes
  const snapshot = await uploadBytes(storageRef, file);

  // 7. Dapatkan download URL publik
  const downloadURL = await getDownloadURL(snapshot.ref);

  // 8. Kembalikan informasi upload untuk digunakan pada Task 3.5
  return {
    downloadURL,
    storagePath,
    fileName: uniqueFileName,
    originalFileName: file.name,
    fileSize: file.size,
    contentType: file.type || snapshot.metadata?.contentType || "application/octet-stream",
  };
};

/**
 * Menyimpan metadata satu foto ke Cloud Firestore pada collection 'photos'.
 *
 * @param {object} params
 * @param {string} params.title - Judul foto.
 * @param {string} [params.description=""] - Deskripsi opsional foto.
 * @param {string} params.image_url - URL download file dari Storage (hasil Task 3.4).
 * @param {string} params.file_name - Nama unik file Storage (hasil Task 3.4).
 * @param {number} params.file_size - Ukuran file dalam bytes.
 * @returns {Promise<{
 *   id: string,
 *   userId: string,
 *   title: string,
 *   description: string,
 *   image_url: string,
 *   file_name: string,
 *   file_size: number,
 *   created_at: any,
 *   updated_at: any
 * }>}
 */
export const createPhotoMetadata = async ({
  title,
  description = "",
  image_url,
  file_name,
  file_size,
}) => {
  // 1. Pastikan user sudah login & ambil UID dari Firebase Authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }
  const userId = currentUser.uid;

  if (!title || !title.trim()) {
    throw new Error("Judul foto wajib diisi.");
  }

  if (!image_url) {
    throw new Error("image_url wajib disertakan.");
  }

  // 2. Bentuk objek dokumen metadata foto
  const photoData = {
    userId,
    title: title.trim(),
    description: description ? description.trim() : "",
    image_url,
    file_name: file_name || "",
    file_size: typeof file_size === "number" ? file_size : Number(file_size) || 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  // 3. Simpan ke koleksi 'photos' menggunakan auto-generated ID dari addDoc
  const photosRef = collection(db, "photos");
  const docRef = await addDoc(photosRef, photoData);

  // 4. Kembalikan ID dokumen beserta data yang disimpan
  return {
    id: docRef.id,
    ...photoData,
  };
};

/**
 * Mengunggah satu file foto secara end-to-end:
 * 1. Validasi file foto via validatePhotoFile (Task 3.7)
 * 2. Validasi status autentikasi user
 * 3. Upload file ke Firebase Storage via uploadPhoto (Task 3.4)
 * 4. Simpan metadata ke Cloud Firestore via createPhotoMetadata (Task 3.5)
 *
 * @param {File} file - Objek file gambar dari browser.
 * @param {object} [metadata={}] - Metadata opsional (title, description).
 * @param {string} [metadata.title] - Judul foto (default: nama file asli).
 * @param {string} [metadata.description=""] - Deskripsi opsional foto.
 * @returns {Promise<{
 *   id: string,
 *   downloadURL: string,
 *   storagePath: string,
 *   fileName: string,
 *   originalFileName: string,
 *   userId: string,
 *   title: string,
 *   description: string,
 *   file_size: number,
 *   created_at: any,
 *   updated_at: any
 * }>}
 */
export const uploadOnePhoto = async (file, metadata = {}) => {
  // 1. Validasi file foto SEBELUM proses upload dan penyimpanan metadata
  validatePhotoFile(file);

  // 2. Pastikan user sudah login
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }

  // 3. Upload file ke Firebase Storage (Task 3.4)
  const uploadResult = await uploadPhoto(file);

  // 4. Simpan metadata ke Cloud Firestore (Task 3.5)
  const title = metadata?.title?.trim() || file.name;
  const description = metadata?.description?.trim() || "";

  const savedMetadata = await createPhotoMetadata({
    title,
    description,
    image_url: uploadResult.downloadURL,
    file_name: uploadResult.fileName,
    file_size: file.size || uploadResult.fileSize,
  });

  // 5. Kembalikan hasil gabungan lengkap
  return {
    id: savedMetadata.id,
    downloadURL: uploadResult.downloadURL,
    storagePath: uploadResult.storagePath,
    fileName: uploadResult.fileName,
    originalFileName: uploadResult.originalFileName,
    ...savedMetadata,
  };
};

// Batasan maksimum jumlah foto dalam sekali upload
export const MAX_MULTIPLE_PHOTOS = 10;

/**
 * Mengunggah banyak file foto sekaligus (1 hingga 10 file) dengan validasi ketat
 * sebelum proses upload dimulai, serta menyediakan pelaporan progress (Task 3.8 + 3.9).
 *
 * @param {FileList|Array<File>} files - Koleksi file foto yang akan diunggah.
 * @param {Function} [onProgress] - Callback progress ({ completed, total, percent, currentFile }).
 * @returns {Promise<Array<object>>} - Array berisi hasil upload masing-masing foto.
 */
export const uploadMultiplePhotos = async (files, onProgress) => {
  // 1. Cek input ada atau tidak (null, undefined, atau bukan koleksi)
  if (!files) {
    throw new Error("Foto belum dipilih.");
  }

  // 2. Normalisasi koleksi ke bentuk Array murni
  let fileList;
  if (Array.isArray(files)) {
    fileList = files;
  } else if (typeof files === "object" && typeof files[Symbol.iterator] === "function") {
    fileList = Array.from(files);
  } else if (typeof files === "object" && typeof files.length === "number") {
    fileList = Array.from(files);
  } else {
    throw new Error("Foto belum dipilih.");
  }

  // 3. Cek jumlah file > 0
  if (fileList.length === 0) {
    throw new Error("Foto belum dipilih.");
  }

  // 4. Cek jumlah maksimal 10 file
  if (fileList.length > MAX_MULTIPLE_PHOTOS) {
    throw new Error("Maximum 10 foto dalam sekali upload.");
  }

  // 5. Cek setiap item adalah File / Blob yang valid
  for (const file of fileList) {
    if (
      !file ||
      typeof file !== "object" ||
      typeof file.name !== "string" ||
      typeof file.size !== "number"
    ) {
      throw new Error("File foto tidak valid.");
    }
  }

  // 6. Validasi format dan ukuran SEMUA file sebelum upload pertama dimulai (Task 3.7)
  for (const file of fileList) {
    validatePhotoFile(file);
  }

  // 7. Cek autentikasi sebelum memulai upload
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User is not authenticated");
  }

  // 8. Progress baru dimulai setelah SEMUA validasi lolos dan upload benar-benar berjalan
  if (typeof onProgress === "function") {
    onProgress({
      completed: 0,
      total: fileList.length,
      percent: 0,
      currentFile: fileList[0].name,
    });
  }

  // 9. Eksekusi upload dan penyimpanan metadata secara berurutan
  const results = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const uploadResult = await uploadOnePhoto(file);
    results.push(uploadResult);

    if (typeof onProgress === "function") {
      const completed = i + 1;
      const percent = Math.round((completed / fileList.length) * 100);
      onProgress({
        completed,
        total: fileList.length,
        percent,
        currentFile: file.name,
      });
    }
  }

  return results;
};

