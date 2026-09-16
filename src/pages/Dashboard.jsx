import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserPhotos } from "../services/photoService";
import PhotoGrid from "../components/PhotoGrid";
import UploadModal from "../components/UploadModal";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [photos, setPhotos] = useState([]);

  /**
   * true → sedang melakukan initial fetch (pertama kali atau saat uid berubah).
   * Digunakan untuk menampilkan skeleton/spinner penuh di area galeri.
   */
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  /**
   * true → sedang me-refresh gallery setelah upload berhasil.
   * Dipisah dari loadingPhotos agar galeri lama tidak hilang saat refresh.
   */
  const [isRefreshing, setIsRefreshing] = useState(false);

  /** Error saat initial load atau refresh gallery */
  const [error, setError] = useState("");

  /**
   * Pesan khusus kasus upload berhasil TAPI refresh gallery gagal.
   * Upload tidak boleh dilaporkan sebagai gagal dalam kasus ini.
   */
  const [galleryRefreshError, setGalleryRefreshError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Fungsi ambil foto dari Firestore ──────────────────────────────────────

  /**
   * Mengambil semua foto user dari Firestore dan memperbarui state photos.
   *
   * @param {"initial"|"refresh"} mode
   *   "initial" → tampilkan spinner penuh (loadingPhotos).
   *   "refresh" → tampilkan indikator refresh kecil (isRefreshing),
   *               pertahankan data lama jika gagal.
   */
  const fetchPhotos = useCallback(
    async (mode = "initial") => {
      if (!user?.uid) return;

      if (mode === "initial") {
        setLoadingPhotos(true);
        setError("");
      } else {
        setIsRefreshing(true);
        setGalleryRefreshError("");
      }

      try {
        console.log(`🔍 [Dashboard] Fetch foto (${mode}) untuk uid:`, user.uid);
        const data = await getUserPhotos(user.uid);
        console.log("📸 [Dashboard] Data foto diterima:", data);
        setPhotos(data);
      } catch (err) {
        console.error("[Dashboard] Gagal mengambil foto:", err);

        if (mode === "initial") {
          // Error initial load → tampilkan di area galeri
          if (err.code === "permission-denied") {
            setError("Akses ditolak. Periksa aturan keamanan (Security Rules) Firestore Anda.");
          } else {
            setError("Gagal memuat galeri foto. Silakan muat ulang halaman.");
          }
        } else {
          // Error refresh → foto lama TETAP ditampilkan, tampilkan banner khusus
          setGalleryRefreshError(
            "Foto berhasil diupload, tetapi gallery gagal diperbarui. Silakan muat ulang halaman."
          );
        }
      } finally {
        if (mode === "initial") {
          setLoadingPhotos(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [user?.uid]
  );

  // ── Initial fetch saat uid tersedia / berubah ──────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!user?.uid) return;
      if (!isMounted) return;
      await fetchPhotos("initial");
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, fetchPhotos]);

  // ── Callback setelah upload berhasil ──────────────────────────────────────

  /**
   * Dipanggil oleh UploadModal setelah uploadMultiplePhotos() berhasil penuh.
   * Dashboard mengambil ulang data gallery tanpa full page reload.
   */
  const handleUploadSuccess = useCallback(() => {
    fetchPhotos("refresh");
  }, [fetchPhotos]);

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* 1. Header Navigasi */}
      <header className="flex justify-between items-center px-6 py-4 bg-slate-800/80 backdrop-blur border-b border-slate-700/60 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-400 m-0">
          Personal Photo Gallery
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">
            Halo, <strong className="text-white">{user?.displayName || user?.email}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 2. Konten Utama Galeri */}
      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {/* Judul seksi + tombol Upload */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Koleksi Foto Saya</h2>
            <p className="text-sm text-slate-400 mt-1">
              Semua foto pribadi yang terhubung dengan akun Anda
            </p>
          </div>
          <button
            id="dashboard-upload-btn"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Upload Foto
          </button>
        </div>

        {/* Banner: refresh gallery gagal (upload tetap berhasil) */}
        {galleryRefreshError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300"
          >
            <span className="mt-0.5 flex-shrink-0 font-bold">!</span>
            <span>{galleryRefreshError}</span>
          </div>
        )}

        {/* Indikator refreshing kecil (tidak menyembunyikan galeri) */}
        {isRefreshing && (
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
            <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            <span>Memperbarui galeri...</span>
          </div>
        )}

        {/* State A: Initial loading */}
        {loadingPhotos && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-sm text-slate-400">Memuat galeri foto Anda...</p>
          </div>
        )}

        {/* State B: Error saat initial load */}
        {!loadingPhotos && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center text-red-400 text-sm">
            <p className="font-semibold mb-1">Terjadi Kesalahan</p>
            <p>{error}</p>
          </div>
        )}

        {/* State C: Empty State */}
        {!loadingPhotos && !error && photos.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-12 text-center max-w-md mx-auto my-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Belum Ada Foto</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Galeri Anda masih kosong. Foto yang Anda unggah nantinya akan langsung tampil di halaman ini.
            </p>
          </div>
        )}

        {/* State D: Data foto berhasil dimuat */}
        {!loadingPhotos && !error && photos.length > 0 && (
          <PhotoGrid photos={photos} />
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Dashboard;
