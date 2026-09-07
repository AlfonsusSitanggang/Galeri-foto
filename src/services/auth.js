import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { auth } from "../config/firebase";

/**
 * Mendaftarkan pengguna baru dengan email, password, dan nama lengkap.
 * @param {string} email - Email pengguna
 * @param {string} password - Password pengguna
 * @param {string} [name] - Nama lengkap pengguna
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export const registerUser = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (name && userCredential.user) {
    await updateProfile(userCredential.user, {
      displayName: name,
    });
  }
  return userCredential;
};

/**
 * Masuk/login pengguna yang sudah terdaftar dengan email dan password.
 * @param {string} email - Email pengguna
 * @param {string} password - Password pengguna
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Mengeluarkan/logout pengguna yang saat ini sedang login.
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  return await signOut(auth);
};
