import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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
    // Reset error saat user mulai mengetik ulang
    if (error) setError("");
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return false;
    }

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return false;
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid.");
      return false;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return false;
    }

    if (password.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password.");
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
      // Mengirimkan email dan password ke fungsi register dari useAuth()
      // Catatan: name disertakan sebagai argumen ketiga jika arsitektur auth nantinya diperluas
      await register(formData.email, formData.password, formData.name);
      navigate("/dashboard");
    } catch (err) {
      // Mapping kode error dari Firebase menjadi pesan yang ramah pengguna
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Email ini sudah terdaftar. Silakan gunakan email lain atau login.");
          break;
        case "auth/invalid-email":
          setError("Alamat email tidak valid.");
          break;
        case "auth/weak-password":
          setError("Password terlalu lemah. Gunakan minimal 6 karakter.");
          break;
        case "auth/network-request-failed":
          setError("Koneksi gagal. Periksa jaringan internet Anda.");
          break;
        default:
          setError(err.message || "Gagal melakukan pendaftaran. Silakan coba lagi.");
          break;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Daftar Akun Baru</h2>
        <p style={styles.subtitle}>Buat akun Personal Photo Gallery Anda</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="name" style={styles.label}>
              Nama Lengkap
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Masukkan nama Anda"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              style={styles.input}
            />
          </div>

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
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Ulangi password Anda"
              value={formData.confirmPassword}
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
            {isSubmitting ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p style={styles.footerText}>
          Sudah punya akun?{" "}
          <Link to="/login" style={styles.link}>
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
};

// Styling dasar terisolasi untuk memastikan tampilan rapi dan responsif
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

export default Register;
