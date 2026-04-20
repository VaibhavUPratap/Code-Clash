import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  projectId: "code-clash-107",
  appId: "1:681506257207:web:16cfeda5121ff3c39042b2",
  storageBucket: "code-clash-107.firebasestorage.app",
  apiKey: "AIzaSyCRbJNcPC2SPo064VcVlBHi0Y60IJtaRA4",
  authDomain: "code-clash-107.firebaseapp.com",
  messagingSenderId: "681506257207",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
