# 🏠 Rent Manager — คู่มือติดตั้งสำหรับมิ้ง

## สิ่งที่จะได้
- เว็บแอพเปิดจากมือถือได้เลย (ไม่ต้องลง App Store)
- Add to Home Screen ใช้เหมือนแอพ
- ข้อมูลเก็บในเครื่อง ไม่ต้องมี server database
- ฟรี ไม่มีค่าใช้จ่าย

---

## วิธีที่ 1: Deploy ผ่าน Vercel (แนะนำ — ง่ายที่สุด)

### Step 1: สมัคร GitHub
1. เข้า https://github.com → สมัครสมาชิก (ถ้ายังไม่มี)
2. กด **New repository** → ตั้งชื่อ `rent-manager` → กด **Create repository**

### Step 2: อัพโหลดโค้ดขึ้น GitHub
**วิธี A: ผ่านหน้าเว็บ (ง่ายสุด)**
1. เข้า repo ที่เพิ่งสร้าง
2. กด **uploading an existing file**
3. ลากไฟล์ทั้ง folder ที่โหลดมาใส่ (ยกเว้น node_modules)
4. กด **Commit changes**

**วิธี B: ผ่าน Terminal (ถ้าใช้ Mac/มี git)**
```bash
cd ~/Downloads/rent-deploy
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/ชื่อuser/rent-manager.git
git push -u origin main
```

### Step 3: สมัคร Vercel แล้ว Deploy
1. เข้า https://vercel.com → **Sign Up with GitHub**
2. กด **Add New Project**
3. เลือก repo `rent-manager` → กด **Import**
4. Framework Preset: เลือก **Vite**
5. กด **Deploy** → รอ 1-2 นาที
6. ได้ URL เช่น `https://rent-manager-xxx.vercel.app` ← **นี่คือแอพของมิ้ง!**

### Step 4: เปิดบนมือถือ + Add to Home Screen

**iPhone:**
1. เปิด Safari → ไปที่ URL ของแอพ
2. กดปุ่ม Share (กล่องมีลูกศร) → **"เพิ่มไปที่หน้าจอโฮม"**
3. จะได้ icon แอพบนหน้าจอเหมือนแอพจริง

**Android:**
1. เปิด Chrome → ไปที่ URL ของแอพ
2. กดจุด 3 จุด มุมขวาบน → **"เพิ่มไปยังหน้าจอหลัก"**
3. จะได้ icon แอพบนหน้าจอ

---

## วิธีที่ 2: Deploy ผ่าน Netlify (ทางเลือก)

1. เข้า https://app.netlify.com → **Sign Up with GitHub**
2. กด **Add new site** → **Import an existing project**
3. เลือก repo `rent-manager`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. กด **Deploy site**

---

## อยากใช้โดเมนเอง (ไม่บังคับ)

ถ้ามิ้งอยากได้ URL สวยๆ เช่น `rent.mingbusiness.com`:
1. ซื้อโดเมนจาก Namecheap / Cloudflare (~฿350/ปี)
2. ใน Vercel → Settings → Domains → เพิ่มโดเมน
3. ไปตั้ง DNS ตามที่ Vercel บอก
4. เสร็จ!

---

## โครงสร้างไฟล์ที่โหลดมา

```
rent-deploy/
├── index.html          ← หน้าหลัก
├── package.json        ← ข้อมูลโปรเจค
├── vite.config.js      ← ตั้งค่า build tool
├── .gitignore
├── public/
│   ├── manifest.json   ← ตั้งค่า PWA
│   ├── sw.js           ← Service Worker (ใช้ offline)
│   ├── icon-192.png    ← icon แอพ
│   ├── icon-512.png    ← icon แอพ ใหญ่
│   └── vite.svg
└── src/
    ├── main.jsx        ← entry point
    └── App.jsx         ← โค้ดแอพทั้งหมด
```

---

## การอัพเดตแอพทีหลัง

1. แก้ไฟล์ใน `src/App.jsx`
2. Push ขึ้น GitHub
3. Vercel จะ auto deploy ใหม่ให้เอง (ภายใน 1 นาที)

---

## หมายเหตุสำคัญ

- **ข้อมูลเก็บใน localStorage ของ browser** — ถ้าล้าง cache ข้อมูลจะหาย
- ถ้าต้องการ sync ข้อมูลข้ามเครื่อง ต้องเพิ่ม database ทีหลัง (เช่น Firebase, Supabase)
- รูปภาพที่แนบจะ compress เป็น JPEG เก็บเป็น base64 ใน localStorage (มี limit ~5-10MB ต่อ domain)
- ถ้าเก็บรูปเยอะมากๆ แนะนำ upgrade เป็นเก็บใน cloud storage ทีหลัง
