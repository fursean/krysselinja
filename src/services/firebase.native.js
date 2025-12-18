// src/services/firebase.native.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBlKWQ7Zx3LwNWdDmCqs4rZbx_qxCYsjHg",
  authDomain: "smidigfrostbyte.firebaseapp.com",
  projectId: "smidigfrostbyte",
  storageBucket: "smidigfrostbyte.firebasestorage.app",
  messagingSenderId: "322106194752",
  appId: "1:322106194752:web:ec8547775101f3b5b918a5",
  measurementId: "G-8JEQH84GN3",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Fallback-sikker auth for RN/Expo
let auth;
try {
  // Dynamisk require så Metro ikke kræsjer hvis path ikke finnes
  const { initializeAuth } = require("firebase/auth");
  const { getReactNativePersistence } = require("firebase/auth/react-native");
  const AsyncStorage = require("@react-native-async-storage/async-storage").default;

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Hvis firebase/auth/react-native ikke finnes i din firebase-versjon:
  auth = getAuth(app);
}

export { auth };
export default app;
