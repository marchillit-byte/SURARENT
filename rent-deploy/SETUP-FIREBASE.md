# 🔥 คู่มือ Setup Firebase สำหรับ Rent Manager

## ใช้เวลาประมาณ 10 นาที

---

## Step 1: สร้าง Firebase Project

1. เปิด https://console.firebase.google.com
2. Login ด้วย Gmail
3. กด **"Create a project"** (สร้างโปรเจค)
4. ตั้งชื่อ: `rent-manager` → กด Continue
5. ปิด Google Analytics (ไม่จำเป็น) → กด **Create Project**
6. รอสร้างเสร็จ → กด **Continue**

---

## Step 2: สร้าง Web App

1. ในหน้า Project Overview กดไอคอน **</>** (Web)
2. ตั้งชื่อ: `rent-web` → กด **Register app**
3. จะเห็น Firebase config แบบนี้:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "rent-manager-xxxxx.firebaseapp.com",
  projectId: "rent-manager-xxxxx",
  storageBucket: "rent-manager-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

4. **ก๊อปปี้ config นี้ไว้!** (จะใช้ใน Step 4)
5. กด **Continue to console**

---

## Step 3: สร้าง Firestore Database

1. ในเมนูซ้าย กด **Build** → **Firestore Database**
2. กด **Create database**
3. เลือก Location: `asia-southeast1` (Singapore - ใกล้ไทย)
4. เลือก **Start in test mode** → กด **Create**

⚠️ **สำคัญ**: Test mode ให้ทุกคนอ่าน/เขียนได้ 30 วัน
หลังจากใช้งานจริงแล้วค่อยมาตั้ง Security Rules ทีหลัง

---

## Step 4: ใส่ Config ในโค้ด

1. เปิดไฟล์ `src/firebase.js`
2. แทนที่ `"ใส่ตรงนี้"` ด้วย config จาก Step 2:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← วางค่าจริงตรงนี้
  authDomain: "rent-manager-xxxxx.firebaseapp.com",
  projectId: "rent-manager-xxxxx",
  storageBucket: "rent-manager-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

3. Save แล้ว push ขึ้น GitHub

---

## Step 5: Deploy บน Vercel

1. ไป Vercel → Add New Project → เลือก repo
2. Framework: **Vite**
3. กด **Deploy**
4. เปิด URL ที่ได้ → ลองเพิ่มผู้เช่า → เปิดอีกเครื่อง → เห็นข้อมูลเหมือนกัน!

---

## ⚠️ หลังใช้งาน 30 วัน: ตั้ง Security Rules

เข้า Firebase Console → Firestore → Rules → แก้เป็น:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rentData/{doc} {
      allow read, write: if true;
    }
  }
}
```

กด **Publish** — จะให้อ่าน/เขียนได้เฉพาะ collection `rentData` เท่านั้น

(ถ้าต้องการเพิ่ม login ทีหลังก็แก้ rules ได้)

---

## สรุปไฟล์ที่ต้องแก้

แก้แค่ไฟล์เดียว: `src/firebase.js` → ใส่ config 6 บรรทัด แค่นั้น!
