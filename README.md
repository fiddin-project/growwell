# GrowWell

GrowWell adalah aplikasi web dan Android native untuk skrining awal kesehatan mental dan perilaku anak. Aplikasi memisahkan akses menjadi dua peran:

- **Admin** mengelola pengguna, anak, skala, pertanyaan, ambang batas, materi edukasi, dan data psikolog.
- **Pengasuh** mengelola data anak, mengisi skrining, melihat hasil dan riwayat perkembangan, membaca materi edukasi, serta menghubungi psikolog.

> GrowWell merupakan alat skrining awal, bukan pengganti diagnosis atau konsultasi profesional.

## Teknologi

| Area | Teknologi |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Axios, i18next, Recharts |
| Backend | Node.js, Fastify, JWT, Prisma ORM |
| Database | MySQL 8 |
| Android | Kotlin, Jetpack Compose, Retrofit/OkHttp, Room, WorkManager, Android Keystore |
| Testing | Vitest, Testing Library |
| Deployment | Docker Compose, Nginx |

## Struktur proyek

```text
growwell/
|-- backend/
|   |-- prisma/             # Schema, migration, dan data seed
|   |-- src/
|   |   |-- lib/            # Prisma, autentikasi, upload, dan konfigurasi bersama
|   |   |-- routes/
|   |   |   |-- auth/       # Login dan sesi pengguna
|   |   |   |-- admin/      # API khusus admin
|   |   |   `-- pengasuh/   # API khusus pengasuh
|   |   |-- services/       # Logika domain, termasuk perhitungan skor
|   |   `-- index.js        # Entry point Fastify
|   `-- uploads/            # File edukasi pada development
|-- frontend/
|   |-- src/
|   |   |-- api/            # Client dan wrapper endpoint API
|   |   |-- components/     # Komponen UI bersama
|   |   |-- context/        # State autentikasi
|   |   |-- i18n/           # Terjemahan Bahasa Indonesia dan Inggris
|   |   |-- layouts/        # Layout berdasarkan peran
|   |   |-- pages/          # Halaman admin, pengasuh, dan login
|   |   `-- router.jsx      # Definisi route dan proteksi akses
|   `-- vite.config.js      # Dev server dan proxy API
|-- android/                # Aplikasi Android native untuk pengasuh
|   |-- app/src/            # UI Compose, API client, Room, dan sinkronisasi
|   `-- gradlew             # Gradle Wrapper project
|-- deploy/                 # Konfigurasi Nginx dan panduan production
|-- docker-compose.yml      # MySQL, backend, frontend, dan phpMyAdmin
|-- GrowWell_PRD.md         # Product requirements
`-- DESIGN.md               # Pedoman desain antarmuka
```

## Arsitektur singkat

```text
Browser
  |
  v
React / Vite (:5173)
  |  /api dan /uploads
  v
Fastify (:3001)
  |
  v
Prisma ORM
  |
  v
MySQL 8

Android Native
  |
  | HTTPS /api
  v
Fastify -> Prisma ORM -> MySQL 8
```

Frontend menyimpan access token berumur pendek hanya di memori. Refresh token web dikirim sebagai cookie `HttpOnly`, dirotasi setiap kali dipakai, dan dapat dicabut melalui logout. Axios menyertakan access token pada request API; backend memverifikasi autentikasi dan peran sebelum menjalankan route admin atau pengasuh.

Saat skrining dikirim, backend menghitung skor tiap jawaban, menjumlahkannya per skala, menentukan kategori berdasarkan ambang batas, lalu menyimpan skrining, hasil skala, dan jawaban dalam satu transaksi database.

## Menjalankan secara lokal

### Prasyarat

- Node.js 20 atau lebih baru
- npm
- MySQL 8, atau Docker untuk menjalankan MySQL

### 1. Jalankan database

Cara termudah adalah menjalankan hanya service MySQL dari Docker Compose:

```sh
cp .env.example .env
docker compose up -d mysql
```

Sesuaikan nilai `MYSQL_ROOT_PASSWORD` dan `JWT_SECRET` di `.env` sebelum digunakan. MySQL tersedia di `localhost:3307` dan database awal bernama `growwell`.

### 2. Siapkan backend

Buat file `backend/.env`:

```env
DATABASE_URL="mysql://root:your_secure_password_here@localhost:3307/growwell"
JWT_SECRET="your_jwt_secret_here"
PORT=3001
UPLOAD_DIR=uploads
ALLOWED_ORIGINS=http://localhost:5173
```

Nilai password pada `DATABASE_URL` harus sama dengan `MYSQL_ROOT_PASSWORD` di file `.env` root.

Kemudian instal dependency dan siapkan database:

```sh
cd backend
npm ci
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend berjalan di `http://localhost:3001`.

> **Perhatian:** `npm run seed` menghapus seluruh data aplikasi sebelum memasukkan data contoh. Jalankan hanya pada database development atau database yang memang boleh di-reset.

### 3. Siapkan frontend

Buka terminal lain:

```sh
cd frontend
npm ci
npm run dev
```

Buka `http://localhost:5173`. Vite meneruskan request `/api` dan `/uploads` ke backend pada port `3001`.

### Akun data seed

| Peran | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `123` |
| Pengasuh | `pengasuh_1` | `123` |
| Pengasuh | `pengasuh_2` | `123` |

Akun tersebut hanya untuk development. Ganti kredensial sebelum lingkungan dapat diakses publik.

### 4. Menjalankan aplikasi Android

Prasyarat Android:

- Android Studio dengan Android SDK Platform 36 dan Build-Tools 35.0.0.
- JDK 17 atau Embedded JDK Android Studio yang kompatibel.
- Emulator atau perangkat Android API 23 ke atas.

Di Android Studio pilih **Open**, lalu buka folder `android/` secara langsung. Gunakan Android SDK milik Android Studio pada `android/local.properties`; file ini bersifat lokal dan tidak masuk Git.

Build debug saat ini terhubung ke API VPS:

```text
https://www.growwell.id/api/
```

Untuk menggunakan backend lokal dari Android Emulator, ubah `API_BASE_URL` varian `debug` pada `android/app/build.gradle.kts` menjadi `http://10.0.2.2:3001/api/`.

Build dari terminal:

```powershell
cd android
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:assembleDebug
```

APK debug tersedia di `android/app/build/outputs/apk/debug/app-debug.apk`. Dokumentasi lebih lengkap tersedia di [`android/README.md`](android/README.md).

## Menjalankan dengan Docker Compose

Isi `.env` di root proyek, lalu jalankan semua service:

```sh
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

Untuk instalasi development baru yang membutuhkan data contoh:

```sh
docker compose exec backend npm run seed
```

Service yang tersedia:

| Service | Alamat host |
| --- | --- |
| Frontend | `http://127.0.0.1:8081` |
| phpMyAdmin | `http://localhost:8080` |
| MySQL | `localhost:3307` |

Backend tidak diekspos langsung ke host pada konfigurasi Compose. Nginx di container frontend meneruskan request API ke service backend.

Untuk deployment server dengan host Nginx, ikuti panduan di [`deploy/README.md`](deploy/README.md). Sebelum production, sesuaikan `ALLOWED_ORIGINS` pada `docker-compose.yml` dengan domain aplikasi.

### Memperbarui production `www.growwell.id`

Setelah perubahan sudah di-push ke `main`, jalankan pada VPS dari direktori repository:

```sh
git pull --ff-only origin main
docker compose build backend frontend
docker compose up -d --force-recreate backend frontend
docker compose exec backend npx prisma migrate deploy
docker compose ps
docker compose logs --tail=100 backend frontend
```

Root `.env` production harus menggunakan origin HTTPS:

```env
PUBLIC_BASE_URL=https://www.growwell.id
ALLOWED_ORIGINS=https://www.growwell.id
```

Verifikasi setelah deployment:

```sh
curl https://www.growwell.id/api/health
```

Respons yang diharapkan adalah `{"status":"ok","database":"ok"}`. Jangan menjalankan `npm run seed` pada VPS karena seed menghapus data aplikasi sebelum membuat data contoh.

## Pengujian dan pemeriksaan kode

Backend:

```sh
cd backend
npm test
npm run test:coverage
```

Integration test backend wajib memakai database terpisah yang namanya berakhiran
`_test`. Runner akan menolak database lain untuk mencegah seed atau pembersihan data
production secara tidak sengaja:

```powershell
Copy-Item backend/.env.test.example backend/.env.test
cd backend
npm.cmd run test:db:up
npm.cmd run test:db:prepare
npm.cmd run test:all
```

Perintah yang sama pada Linux/macOS menggunakan `cp` dan `npm` sebagai pengganti
`Copy-Item` dan `npm.cmd`. Database test berjalan pada `127.0.0.1:3308` dan disimpan
di `tmpfs`, terpisah dari volume database development/production.

Frontend:

```sh
cd frontend
npm test
npm run lint
npm run build
```

Android:

```powershell
cd android
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:assembleDebug
.\gradlew.bat :app:bundleRelease -PGROWWELL_API_BASE_URL=https://www.growwell.id/api/
```

## Progressive Web App (PWA)

Frontend GrowWell dapat di-install sebagai PWA pada browser yang mendukung. Service worker melakukan pre-cache terhadap app shell dan aset statis agar halaman yang pernah dimuat tetap dapat dibuka ketika koneksi terputus.

Untuk menjaga privasi, request `/api` dan file pada `/uploads` tidak disimpan ke Cache Storage. Login, data anak, dashboard, pengisian skrining, dan perubahan data tetap memerlukan koneksi internet. Aplikasi menampilkan indikator offline dan menawarkan pembaruan saat service worker versi baru tersedia.

PWA hanya aktif pada build production dan membutuhkan HTTPS, kecuali saat dijalankan melalui `localhost`:

```sh
cd frontend
npm run build
npm run preview
```

Icon PWA dapat dibuat ulang setelah desainnya diubah:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
```

Setelah deployment, verifikasi manifest, instalasi, mode offline, dan pembaruan service worker melalui panel **Application** dan audit **Lighthouse** di browser developer tools.

## Model data utama

- `User` menyimpan akun admin dan pengasuh.
- `Anak` menyimpan profil anak yang akan diskrining.
- `Skala`, `Pertanyaan`, dan `AmbangBatas` membentuk instrumen skrining.
- `Skrining`, `Jawaban`, dan `HasilSkala` menyimpan proses serta hasil penilaian.
- `Edukasi` menyimpan materi berupa PDF atau tautan eksternal.
- `Psikolog` menyimpan informasi kontak profesional.

## Konfigurasi environment backend

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Connection string MySQL untuk Prisma |
| `JWT_SECRET` | Ya | Secret penandatanganan token JWT; backend gagal start jika kosong |
| `PORT` | Tidak | Port backend, default `3001` |
| `UPLOAD_DIR` | Tidak | Direktori penyimpanan upload, default `uploads` |
| `ALLOWED_ORIGINS` | Tidak | Daftar origin CORS dipisahkan koma; default `http://localhost:5173` |
| `PUBLIC_BASE_URL` | Ya di production | Origin HTTPS publik untuk URL upload, misalnya `https://www.growwell.id` |
| `ACCESS_TOKEN_TTL_SECONDS` | Tidak | Masa berlaku access token, default production `900` detik |
| `REFRESH_TOKEN_TTL_DAYS` | Tidak | Masa berlaku refresh session, default production `30` hari |

## Dokumen terkait

- [`GrowWell_PRD.md`](GrowWell_PRD.md) menjelaskan kebutuhan produk dan ruang lingkup fitur.
- [`DESIGN.md`](DESIGN.md) menjelaskan arah visual dan komponen UI.
- [`deploy/README.md`](deploy/README.md) menjelaskan prosedur deployment production dan verifikasi upload PDF.
- [`android/README.md`](android/README.md) menjelaskan build, konfigurasi API, dan keamanan aplikasi Android.
