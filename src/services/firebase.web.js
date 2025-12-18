import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlKWQ7Zx3LwNWdDmCqs4rZbx_qxCYsjHg",
  authDomain: "smidigfrostbyte.firebaseapp.com",
  projectId: "smidigfrostbyte",
  storageBucket: "smidigfrostbyte.firebasestorage.app",
  messagingSenderId: "322106194752",
  appId: "1:322106194752:web:ec8547775101f3b5b918a5",
  measurementId: "G-8JEQH84GN3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
