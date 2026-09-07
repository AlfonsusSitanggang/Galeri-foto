import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Komponen pelindung rute untuk membatasi akses halaman privat.
 * Hanya pengguna yang sudah terautentikasi yang diizinkan masuk.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Komponen anak opsional (jika tidak menggunakan Outlet)
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Tampilkan state loading jika Firebase auth state listener masih memverifikasi sesi
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Memverifikasi sesi...</p>
      </div>
    );
  }

  // 2. Jika belum login (user === null), redirect ke halaman /login
  // Menyimpan lokasi asal di state agar nantinya bisa diarahkan kembali setelah login jika diinginkan
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Jika sudah login, tampilkan konten (mendukung children atau Outlet untuk nested routes)
  return children ? children : <Outlet />;
};

const styles = {
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#f8fafc",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #334155",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#94a3b8",
  },
};

export default ProtectedRoute;
