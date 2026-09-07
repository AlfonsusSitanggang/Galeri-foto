import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { registerUser, loginUser, logoutUser } from "../services/auth";

// 1. Membuat Context
export const AuthContext = createContext(null);

// 2. Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listener perubahan status autentikasi dari Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error("Firebase Auth State Error:", error);
        setUser(null);
        setLoading(false);
      }
    );

    // Cleanup subscription saat unmount
    return () => unsubscribe();
  }, []);

  // Wrapper fungsi auth service
  const register = async (email, password, name) => {
    const userCredential = await registerUser(email, password, name);
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
    return userCredential;
  };

  const login = (email, password) => {
    return loginUser(email, password);
  };

  const logout = () => {
    return logoutUser();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from "../hooks/useAuth";
