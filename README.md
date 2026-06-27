# Shopee Product Image Downloader

Aplikasi web untuk mengambil dan mengunduh semua foto produk Shopee — satu per satu atau sekaligus dalam file ZIP.

## ✨ Fitur

- 🔗 Input URL produk Shopee (semua format didukung)
- 🖼️ Tampilkan semua foto produk dalam grid
- 📥 Download foto satu per satu
- 📦 Download semua foto sekaligus dalam file ZIP
- 🔍 Preview foto fullscreen dengan lightbox
- 📋 Salin link gambar ke clipboard
- 📊 Progress bar saat membuat ZIP
- 🌑 Dark mode
- 📱 Responsive (mobile-friendly)

## 🛠️ Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS v4**
- **JSZip** — untuk membuat file ZIP
- **Lucide React** — ikon

## 📁 Struktur Project

```
├── app/
│   ├── page.tsx              # Halaman utama
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       ├── scrape/
│       │   └── route.ts      # POST /api/scrape
│       └── proxy-image/
│           └── route.ts      # GET /api/proxy-image
├── components/
│   ├── UrlInput.tsx          # Input URL + drag & drop
│   ├── ProductGallery.tsx    # Grid foto + lightbox + toast
│   ├── DownloadButton.tsx    # Tombol download individual
│   └── Loading.tsx           # Spinner + Skeleton
├── lib/
│   ├── parser.ts             # Parsing URL Shopee
│   ├── shopee.ts             # Fetch Shopee API
│   └── downloader.ts         # Download logic + JSZip
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 🚀 Cara Install & Menjalankan Lokal

### 1. Clone atau ekstrak project

```bash
# Jika dari ZIP, ekstrak dulu, lalu masuk ke folder
cd shopee-image-downloader
```

### 2. Install dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### 4. Build untuk production

```bash
npm run build
npm start
```

## ☁️ Deploy ke Vercel

### Opsi A: Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ikuti prompt:
# - Set up and deploy? Y
# - Which scope? (pilih akun kamu)
# - Link to existing project? N
# - Project name: shopee-image-downloader
# - In which directory? ./
# - Override settings? N
```

### Opsi B: Via GitHub + Vercel Dashboard

1. Push project ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/username/shopee-downloader.git
   git push -u origin main
   ```

2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repository dari GitHub
4. Klik **Deploy** — selesai! 🎉

### Opsi C: Drag & Drop di Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Drag folder project ke area upload
3. Klik Deploy

## 🔧 Konfigurasi

Tidak diperlukan environment variable apapun. Aplikasi langsung berjalan.

## 📝 Format URL yang Didukung

| Format | Contoh |
|--------|--------|
| URL slug | `https://shopee.co.id/nama-produk-i.15443373.28229444664` |
| URL direct | `https://shopee.co.id/product/15443373/28229444664` |

## ⚠️ Catatan

- Aplikasi mengambil data langsung dari Shopee API publik
- Shopee dapat membatasi request — jika gagal, coba beberapa saat lagi
- Gambar diproxy melalui `/api/proxy-image` untuk menghindari CORS
- Tidak ada database, tidak ada penyimpanan data pengguna

## 📄 License

MIT
