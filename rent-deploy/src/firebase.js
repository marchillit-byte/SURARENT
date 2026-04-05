import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ===========================================
// 🔧 ใส่ Firebase config ของมิ้งตรงนี้
// (ดูวิธีได้ใน SETUP-FIREBASE.md)
// ===========================================
const firebaseConfig = {
  apiKey: "ใส่ตรงนี้",
  authDomain: "ใส่ตรงนี้",
  projectId: "ใส่ตรงนี้",
  storageBucket: "ใส่ตรงนี้",
  messagingSenderId: "ใส่ตรงนี้",
  appId: "ใส่ตรงนี้",
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
