import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getUserPhotos } from "../services/photoService";
import PhotoGrid from "../components/PhotoGrid";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPhotos = async () => {
      // Pastikan user.uid sudah tersedia dari useAuth
      if (!user?.uid) return;

      setLoadingPhotos(true);
      setError("");

      try {
        console.log("🔍 [Dashboard] Meminta foto untuk user UID:", user.uid);
        const data = await getUserPhotos(user.uid);
        console.log("📸 [Dashboard] Hasil data foto yang diterima dari Firestore:", data);
        if (isMounted) {
          setPhotos(data);
        }
      } catch (err) {
        console.error("Gagal mengambil foto:", err);
        if (isMounted) {
          if (err.code === "permission-denied") {
            setError("Akses ditolak. Periksa aturan keamanan (Security Rules) Firestore Anda.");
          } else {
            setError("Gagal memuat galeri foto. Silakan muat ulang halaman.");
          }
        }
      } finally {
        if (isMounted) {
          setLoadingPhotos(false);
        }
      }
    };

    fetchPhotos();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Koleksi Foto Saya</h2>
            <p className="text-sm text-slate-400 mt-1">
              Semua foto pribadi yang terhubung dengan akun Anda
            </p>
          </div>
        </div>

        {/* State A: Sedang Mengambil Data dari Firestore */}
        {loadingPhotos && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-sm text-slate-400">Memuat galeri foto Anda...</p>
          </div>
        )}

        {/* State B: Error Firestore */}
        {!loadingPhotos && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center text-red-400 text-sm">
            <p className="font-semibold mb-1">Terjadi Kesalahan</p>
            <p>{error}</p>
          </div>
        )}

        {/* State C: Empty State (User belum memiliki foto) */}
        {!loadingPhotos && !error && photos.length === 0 && (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-12 text-center max-w-md mx-auto my-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

        {/* State D: Data Foto Berhasil Dimuat */}
        {!loadingPhotos && !error && photos.length > 0 && (
          <PhotoGrid photos={photos} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
