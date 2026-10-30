# Deployment Guide: Next.js on Your Own Web Server (Node.js / VPS / Cloud)

โปรเจกต์นี้เป็น **Next.js (App Router)** ซึ่งต้องการสภาพแวดล้อมที่รองรับ **Node.js 18+ หรือ 20+** ในการรันเซิร์ฟเวอร์ และมีโฟลเดอร์สำหรับเขียนไฟล์อัปโหลด (`data/uploads`)

---

## 1. รายการไฟล์และโฟลเดอร์ที่ต้องอัปโหลดขึ้นเซิร์ฟเวอร์

### ✅ โฟลเดอร์และไฟล์ที่ "ต้องอัปโหลด" (Required)
```text
aiks/
├── frontend/
│   ├── .next/                  <-- โฟลเดอร์ build จาก npm run build (สำคัญมาก)
│   ├── public/                 <-- รูปภาพและ static assets ทั้งหมด
│   ├── src/                    <-- ซอร์สโค้ดของแอป
│   ├── data/                   <-- โฟลเดอร์เก็บข้อมูล uploads และ JSON caches
│   │   └── uploads/
│   ├── .env.local              <-- ตัวแปร Environment (API Key)
│   ├── package.json            <-- รายชื่อ dependencies
│   ├── package-lock.json       <-- lockfile
│   ├── next.config.ts          <-- config ของ Next.js
│   └── tsconfig.json           <-- config ของ TypeScript
└── data/                       <-- ไฟล์ CSV ฐานข้อมูลจำลอง (ถ้ามีใช้)
```

### ❌ โฟลเดอร์ที่ไม่ต้องอัปโหลด (ห้ามอัปโหลด)
- `node_modules/` (เพราะมีขนาดใหญ่มาก ให้อัปโหลดเฉพาะ `package.json` แล้วสั่ง `npm install --omit=dev` บนเซิร์ฟเวอร์แทน)
- `.git/` (ประวัติ commit)
- `.DS_Store` (ไฟล์แคชของ macOS)

---

## 2. วิธีเตรียมและรันบนเซิร์ฟเวอร์ (Step-by-Step)

### ขั้นตอนที่ 1: Build โปรเจกต์ในเครื่องก่อน (หรือสั่ง build บนเซิร์ฟเวอร์)
ในเครื่อง local ทำการ build ล่าสุด:
```bash
cd /Applications/MAMP/htdocs/aiks/frontend
npm run build
```

### ขั้นตอนที่ 2: ติดตั้ง Node.js บนเซิร์ฟเวอร์ของคุณ
ตรวจสอบว่าเซิร์ฟเวอร์มี Node.js v18.x ขึ้นไป (แนะนำ v20.x LTS):
```bash
node -v
npm -v
```

### ขั้นตอนที่ 3: สั่งรันบนเซิร์ฟเวอร์
เข้าไปที่โฟลเดอร์ `frontend` บนเซิร์ฟเวอร์:
```bash
cd frontend
npm install --omit=dev
npm run start
```
*Next.js จะรันบนพอร์ต 3000 (`http://localhost:3000`)*

---

## 3. การรันเบื้องหลังแบบ Production (Background Service ด้วย PM2)

เพื่อไม่ให้เว็บดับเวลาเราปิดหน้าต่าง Terminal แนะนำให้ใช้ **PM2**:

1. ติดตั้ง PM2:
   ```bash
   npm install -g pm2
   ```

2. สั่งรันด้วย PM2:
   ```bash
   cd frontend
   pm2 start npm --name "lxvii-hospitality" -- start
   ```

3. ให้เปิดตัวเองอัตโนมัติเวลารีสตาร์ตเซิร์ฟเวอร์:
   ```bash
   pm2 save
   pm2 startup
   ```

---

## 4. ตัวอย่างการตั้งค่า Nginx Reverse Proxy (เชื่อมโดเมนและ SSL)

สร้างไฟล์คอนฟิกใน Nginx (เช่น `/etc/nginx/sites-available/lxvii`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M; # รองรับการอัปโหลดไฟล์ขนาดใหญ่

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
จากนั้นรัน Certbot เพื่อเปิดใช้ HTTPS ฟรี:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 5. การตั้งสิทธิ์โฟลเดอร์สำหรับเขียนไฟล์ (File Permissions)
เนื่องจากเซิร์ฟเวอร์ของคุณจะมีการเขียนไฟล์อัปโหลดลงโฟลเดอร์ `frontend/data/uploads` ต้องแน่ใจว่า process ของ Node.js มีสิทธิ์เขียนโฟลเดอร์นี้:
```bash
chmod -R 775 frontend/data/uploads
```

