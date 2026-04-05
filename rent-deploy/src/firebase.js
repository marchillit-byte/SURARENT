import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ===========================================
// 🔧 ใส่ Firebase config ของมิ้งตรงนี้
// (ดูวิธีได้ใน SETUP-FIREBASE.md)
// ===========================================
const firebaseConfig = {
apiKey: "AIzaSyDr_cwkESsJHhw_akop6tRzI9Ib6wWl7cw",
  authDomain: "surarent.firebaseapp.com",
  projectId: "surarent",
  storageBucket: "surarent.firebasestorage.app",
  messagingSenderId: "250193050542",
  appId: "1:250193050542:web:551b263831e473ede2663f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DOC_ID = "main"; // เก็บข้อมูลทั้งหมดใน document เดียว

export async function loadFromCloud() {
  try {
    const snap = await getDoc(doc(db, "rentData", DOC_ID));
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    console.error("Load error:", e);
    return null;
  }
}

export async function saveToCloud(data) {
  try {
    await setDoc(doc(db, "rentData", DOC_ID), data);
  } catch (e) {
    console.error("Save error:", e);
  }
}
