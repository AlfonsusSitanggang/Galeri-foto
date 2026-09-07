import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika sesi Firebase masih diverifikasi, cegah rendering form sementara
  if (loading) {
    return null;
  }

  // Jika pengguna sudah login, langsung alihkan ke /dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Reset error saat pengguna mulai mengetik ulang
    if (error) setError("");
  };

  const validateForm = () => {
    const { email, password } = formData;

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid.");
      return false;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setError("");
    setIsSubmitting(true);

    try {
      // Memanggil fungsi login dari useAuth() (tanpa Firebase logic langsung)
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (err) {
      // Pemetaan kode error autentikasi ke pesan berbahasa Indonesia yang jelas
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Email atau password yang Anda masukkan salah.");
          break;
        case "auth/user-disabled":
          setError("Akun ini telah dinonaktifkan. Silakan hubungi admin.");
          break;
        case "auth/too-many-requests":
          setError("Terlalu banyak percobaan login gagal. Coba lagi beberapa saat lagi.");
          break;
        case "auth/invalid-email":
          setError("Format email tidak valid.");
          break;
        case "auth/network-request-failed":
          setError("Koneksi gagal. Periksa jaringan internet Anda.");
          break;
        default:
          setError(err.message || "Gagal masuk ke akun. Silakan coba lagi.");
          break;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Selamat Datang</h2>
        <p style={styles.subtitle}>Masuk ke akun Personal Photo Gallery Anda</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Masukkan password Anda"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.button,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Sedang Masuk..." : "Masuk"}
          </button>
        </form>

        <p style={styles.footerText}>
          Belum punya akun?{" "}
          <Link to="/register" style={styles.link}>
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
};

// Konsistensi desain mengikuti styling Register.jsx
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    color: "#f8fafc",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 24px 0",
    fontSize: "14px",
    color: "#94a3b8",
    textAlign: "center",
  },
  errorAlert: {
    backgroundColor: "#ef444420",
    color: "#f87171",
    border: "1px solid #ef444450",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#cbd5e1",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "6px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    marginTop: "8px",
    padding: "12px",
    borderRadius: "6px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    border: "none",
    transition: "background-color 0.2s",
  },
  footerText: {
    marginTop: "24px",
    fontSize: "14px",
    color: "#94a3b8",
    textAlign: "center",
  },
  link: {
    color: "#60a5fa",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Login;
