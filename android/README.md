# GrowWell Android Native

Aplikasi Android native untuk peran `PENGASUH`, dibuat dengan Kotlin dan Jetpack Compose. Admin tetap memakai aplikasi web. Semua pengasuh melihat data anak global; identitas pembuat hanya ditampilkan sebagai audit.

## Build debug

Debug saat ini memakai backend VPS di `https://www.growwell.id/api/`. Untuk pengembangan backend lokal, ubah `API_BASE_URL` varian debug ke `http://10.0.2.2:3001/api/`.

```powershell
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\android-sdk'
.\gradlew.bat :app:assembleDebug
```

APK dibuat di `app/build/outputs/apk/debug/app-debug.apk`.

## Bahasa aplikasi

Aplikasi mendukung Bahasa Indonesia (default) dan English. Pilihan bahasa tersedia pada layar login dan toolbar utama, diterapkan tanpa perlu login ulang, serta disimpan lokal dengan Preferences DataStore. Teks UI berada di `app/src/main/res/values/strings.xml` dan `app/src/main/res/values-en/strings.xml`; nilai kontrak API seperti `L`, `P`, `tidak_benar`, dan kode kategori tidak diterjemahkan saat dikirim ke server.

Konten bilingual dari API (`*_en`) dipilih sesuai bahasa aktif dengan fallback ke Bahasa Indonesia. Jalankan pemeriksaan berikut setelah mengubah resource atau pemetaan konten:

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug assembleRelease
```

## Build production

API production wajib HTTPS dan URL harus diakhiri `/`:

```powershell
.\gradlew.bat :app:bundleRelease -PGROWWELL_API_BASE_URL=https://www.growwell.id/api/
```

HTTPS di VPS tetap ditangani reverse proxy/TLS. Sisi Android hanya perlu menggunakan URL HTTPS tersebut; cleartext HTTP diblokir pada manifest production. HTTP hanya diizinkan oleh manifest varian debug untuk emulator lokal.

## Keamanan sesi

- Access token hanya disimpan di memori.
- Refresh token Android dikirim pada body sesuai kontrak API, dienkripsi AES-GCM dengan kunci pada Android Keystore, dan dirotasi setiap refresh.
- Respons `401` memicu satu refresh tersinkronisasi lalu request diulang satu kali.
- Logout merevoke refresh session di server dan menghapus token lokal.

Jangan menyimpan signing key atau credential API di repository.
