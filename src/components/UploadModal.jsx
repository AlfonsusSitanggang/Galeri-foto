import { useState, useRef, useEffect, useCallback } from "react";
import { uploadMultiplePhotos, MAX_MULTIPLE_PHOTOS } from "../services/photoService";

// ─── Icon Components ──────────────────────────────────────────────────────────

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconUploadCloud = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const IconCheck = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Helper: format bytes ──────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ─── UploadModal ──────────────────────────────────────────────────────────────

/**
 * Modal upload foto dengan fitur:
 * - Drag & drop atau pilih file via input
 * - Preview miniatur tiap foto
 * - Input title dan description (berlaku untuk semua foto dalam sesi ini)
 * - Upload hingga 10 foto sekaligus
 * - Tampilan progress real-time per file
 * - Pesan error yang jelas tanpa membocorkan detail internal
 * - Blokir close saat proses upload sedang berjalan
 *
 * @param {boolean} isOpen - Apakah modal ditampilkan.
 * @param {Function} onClose - Callback saat modal ditutup.
 * @param {Function} [onUploadSuccess] - Callback dipanggil setelah upload selesai
 *   (sebelum modal ditutup), digunakan Dashboard untuk refresh gallery.
 */
const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** Array of { file: File, previewUrl: string } */
  const [selectedFiles, setSelectedFiles] = useState([]);

  /** Metadata yang sama untuk semua foto dalam satu sesi */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  /** Status upload */
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);

  /** Hasil setelah upload selesai */
  const [uploadDone, setUploadDone] = useState(false);

  /** Pesan error yang ditampilkan ke user */
  const [errorMsg, setErrorMsg] = useState("");

  /** Drag active indicator */
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // ── Cleanup object URLs saat unmount ──────────────────────────────────────

  useEffect(() => {
    return () => {
      selectedFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reset state ketika modal dibuka ulang ──────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles((prev) => {
        prev.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        return [];
      });
      setTitle("");
      setDescription("");
      setUploading(false);
      setProgress(null);
      setUploadDone(false);
      setErrorMsg("");
    }
  }, [isOpen]);

  // ── Tambah file ke daftar ──────────────────────────────────────────────────

  const addFiles = useCallback((incoming) => {
    setErrorMsg("");
    const incomingArr = Array.from(incoming);
    if (incomingArr.length === 0) return;

    setSelectedFiles((prev) => {
      const combined = [...prev];

      for (const file of incomingArr) {
        const isDuplicate = combined.some(
          (item) => item.file.name === file.name && item.file.size === file.size
        );
        if (!isDuplicate) {
          combined.push({ file, previewUrl: URL.createObjectURL(file) });
        }
      }

      if (combined.length > MAX_MULTIPLE_PHOTOS) {
        setErrorMsg(`Maksimal ${MAX_MULTIPLE_PHOTOS} foto dalam sekali upload.`);
        const excess = combined.splice(MAX_MULTIPLE_PHOTOS);
        excess.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
      }

      return combined;
    });
  }, []);

  // ── Hapus satu file dari daftar ────────────────────────────────────────────

  const removeFile = (index) => {
    setSelectedFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
    setErrorMsg("");
  };

  // ── Drag & Drop handlers ───────────────────────────────────────────────────

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (uploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) addFiles(files);
  };

  // ── Input file change handler ──────────────────────────────────────────────

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) addFiles(files);
    e.target.value = "";
  };

  // ── Tombol close ──────────────────────────────────────────────────────────

  const handleClose = () => {
    if (uploading) return;
    selectedFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    onClose();
  };

  // ── Eksekusi upload ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    setErrorMsg("");
    if (selectedFiles.length === 0) { setErrorMsg("Foto belum dipilih."); return; }

    setUploading(true);
    setUploadDone(false);
    setProgress({ completed: 0, total: selectedFiles.length, percent: 0, currentFile: "" });

    try {
      const files = selectedFiles.map((item) => item.file);
      await uploadMultiplePhotos(files, {
        title: title.trim() || undefined,
        description: description.trim(),
        onProgress: (p) => setProgress(p),
      });

      // ── Upload & Firestore metadata SELESAI ───────────────────────────────
      // Beri tahu Dashboard untuk refresh gallery SEBELUM tampilkan success state.
      // Jika onUploadSuccess melempar error, kita tetap tampilkan success karena
      // upload sudah berhasil — Dashboard menangani refresh error-nya sendiri.
      if (typeof onUploadSuccess === "function") {
        try {
          onUploadSuccess();
        } catch (refreshErr) {
          // Refresh error ditangani Dashboard; tidak perlu aksi tambahan di sini.
          console.warn("[UploadModal] onUploadSuccess callback error:", refreshErr);
        }
      }

      setUploadDone(true);
    } catch (err) {
      console.error("[UploadModal] Upload error:", err);
      const msg = err?.message || "";

      // 1. Tidak ada file
      if (msg.includes("Foto belum dipilih")) {
        setErrorMsg("Foto belum dipilih.");
      // 2. Lebih dari 10 file
      } else if (msg.includes("Maximum 10") || msg.includes("Maksimal 10")) {
        setErrorMsg("Maksimal 10 foto dalam sekali upload.");
      // 3. Item bukan File valid
      } else if (msg.includes("File foto tidak valid")) {
        setErrorMsg("Terdapat file yang tidak valid.");
      // 4. Format file tidak didukung
      } else if (msg.includes("Format file") || msg.includes("tidak didukung")) {
        setErrorMsg("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.");
      // 5. Ukuran file > 10 MB
      } else if (msg.includes("10 MB") || msg.includes("Ukuran file")) {
        setErrorMsg("Ukuran foto maksimal 10 MB.");
      // 6. User belum login
      } else if (msg.includes("not authenticated") || msg.includes("login")) {
        setErrorMsg("Silakan login terlebih dahulu.");
      // 7. Firebase Storage gagal (network / kuota / rules)
      } else if (
        msg.includes("storage") ||
        msg.includes("Storage") ||
        msg.includes("upload") ||
        err?.code?.startsWith("storage/")
      ) {
        setErrorMsg("Upload foto gagal. Silakan coba lagi.");
      // 8. Firestore gagal simpan metadata
      } else if (
        msg.includes("firestore") ||
        msg.includes("Firestore") ||
        err?.code?.startsWith("firestore/") ||
        err?.code === "permission-denied"
      ) {
        setErrorMsg("Gagal menyimpan data foto. Silakan coba lagi.");
      // 9. Error tidak diketahui
      } else {
        setErrorMsg("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Early return jika modal tidak terbuka ─────────────────────────────────

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 flex-shrink-0">
          <h2 id="upload-modal-title" className="text-lg font-bold text-slate-100">
            Upload Foto
          </h2>
          <button
            id="upload-modal-close-btn"
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Tutup modal upload"
          >
            <IconClose />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Drop Zone */}
          {!uploadDone && (
            <div
              id="upload-modal-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={[
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all select-none",
                isDragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-blue-500/60 hover:bg-slate-800/60",
                uploading ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              <span className="text-blue-400"><IconUploadCloud /></span>
              <div className="text-center">
                <p className="font-semibold text-slate-200">
                  {isDragActive ? "Lepaskan file di sini" : "Seret foto ke sini"}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  atau <span className="text-blue-400 font-medium underline">klik untuk memilih</span>
                </p>
              </div>
              <p className="text-xs text-slate-500">
                JPG, PNG, WEBP · Maks 10 MB per file · Maks {MAX_MULTIPLE_PHOTOS} foto
              </p>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="upload-modal-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            disabled={uploading}
            aria-hidden="true"
          />

          {/* Daftar File Terpilih */}
          {selectedFiles.length > 0 && !uploadDone && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {selectedFiles.length} foto dipilih
              </p>
              <ul className="space-y-2">
                {selectedFiles.map(({ file, previewUrl }, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 pr-3"
                  >
                    <img
                      src={previewUrl}
                      alt={`Preview ${file.name}`}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate font-medium">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                    {!uploading ? (
                      <button
                        id={`upload-modal-remove-file-${index}`}
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex-shrink-0"
                        aria-label={`Hapus ${file.name} dari daftar`}
                      >
                        <IconTrash />
                      </button>
                    ) : (
                      <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Metadata */}
          {selectedFiles.length > 0 && !uploadDone && (
            <div className="space-y-3">
              <div>
                <label htmlFor="upload-modal-title-input" className="block text-sm font-medium text-slate-300 mb-1">
                  Judul Foto <span className="text-slate-500 font-normal">(opsional)</span>
                </label>
                <input
                  id="upload-modal-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Liburan Bali 2025"
                  maxLength={120}
                  disabled={uploading}
                  className="w-full bg-slate-800/70 border border-slate-600/60 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/40 transition disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="upload-modal-description-input" className="block text-sm font-medium text-slate-300 mb-1">
                  Deskripsi <span className="text-slate-500 font-normal">(opsional)</span>
                </label>
                <textarea
                  id="upload-modal-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tambahkan deskripsi singkat untuk foto..."
                  rows={2}
                  maxLength={500}
                  disabled={uploading}
                  className="w-full bg-slate-800/70 border border-slate-600/60 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/40 transition resize-none disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Progress Upload */}
          {uploading && progress && (
            <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Mengunggah{" "}
                  <span className="text-slate-200 font-medium truncate max-w-[200px] inline-block align-bottom">
                    {progress.currentFile}
                  </span>
                </span>
                <span>{progress.completed}/{progress.total} foto</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-right text-xs text-blue-400 font-semibold">{progress.percent}%</p>
            </div>
          )}

          {/* State Sukses */}
          {uploadDone && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400">
                <IconCheck />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-100">Upload Berhasil!</p>
                <p className="text-sm text-slate-400 mt-1">
                  {selectedFiles.length} foto berhasil diunggah ke galeri Anda.
                </p>
              </div>
              <button
                id="upload-modal-close-success-btn"
                onClick={handleClose}
                className="mt-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Pesan Error */}
          {errorMsg && (
            <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0 font-bold">!</span>
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {!uploadDone && (
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-700/60 flex-shrink-0 bg-slate-900/80">
            <button
              id="upload-modal-cancel-btn"
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              id="upload-modal-submit-btn"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Foto` : "Foto"}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
