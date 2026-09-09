/**
 * Helper untuk memformat berbagai tipe timestamp (Firestore Timestamp, Date, string, atau number)
 * menjadi format tanggal berbahasa Indonesia yang mudah dibaca.
 */
const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  try {
    const date = typeof dateVal.toDate === "function" ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

/**
 * Komponen presentasional murni untuk menampilkan satu kartu foto.
 *
 * @param {object} props
 * @param {string} props.imageUrl - URL sumber gambar untuk ditampilkan.
 * @param {string} props.title - Judul foto.
 * @param {object|string|number|Date} props.createdAt - Waktu upload foto (Firestore Timestamp / Date).
 */
const PhotoCard = ({ imageUrl, title, createdAt }) => {
  return (
    <div className="bg-slate-800 border border-slate-700/70 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-slate-600 transition-all duration-300 flex flex-col group">
      {/* 1. Preview Gambar */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-950">
        <img
          src={imageUrl}
          alt={title || "Foto galeri"}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback halus jika URL gambar rusak atau gagal dimuat
            e.currentTarget.src =
              "https://placehold.co/600x400/1e293b/94a3b8?text=Gambar+Tidak+Tersedia";
          }}
        />
      </div>

      {/* 2. Informasi Metadata Foto */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2">
        <h3
          className="text-slate-100 font-semibold text-base leading-snug line-clamp-1 group-hover:text-blue-400 transition-colors"
          title={title}
        >
          {title || "Tanpa Judul"}
        </h3>

        <div className="flex items-center text-xs text-slate-400 font-normal">
          <svg
            className="w-3.5 h-3.5 mr-1.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;
