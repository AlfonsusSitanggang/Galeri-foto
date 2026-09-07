import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Personal Photo Gallery</h1>
        <div style={styles.userSection}>
          <span style={styles.greeting}>
            Halo, <strong>{user?.displayName || user?.email}</strong>
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2>Dashboard Galeri</h2>
          <p style={styles.desc}>
            Selamat datang di area privat galeri foto Anda. Fitur autentikasi telah aktif dan rute ini dilindungi oleh <code>ProtectedRoute</code>.
          </p>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: "#1e293b",
    borderBottom: "1px solid #334155",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "#60a5fa",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  greeting: {
    fontSize: "14px",
    color: "#cbd5e1",
  },
  logoutBtn: {
    padding: "8px 16px",
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  content: {
    padding: "32px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  welcomeCard: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #334155",
  },
  desc: {
    color: "#94a3b8",
    marginTop: "8px",
    lineHeight: "1.6",
  },
};

export default Dashboard;
