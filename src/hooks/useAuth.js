import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Custom hook untuk mengakses nilai dan aksi dari AuthContext.
 * @returns {{
 *   user: import("firebase/auth").User | null,
 *   loading: boolean,
 *   login: (email: string, password: string) => Promise<import("firebase/auth").UserCredential>,
 *   register: (email: string, password: string, name?: string) => Promise<import("firebase/auth").UserCredential>,
 *   logout: () => Promise<void>
 * }}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }

  return context;
};

export default useAuth;
