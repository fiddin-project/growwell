# GrowWell Android Native

Aplikasi Android native untuk peran `PENGASUH`, dibuat dengan Kotlin dan Jetpack Compose. Admin tetap memakai aplikasi web. Semua pengasuh melihat data anak dan riwayat screening global; `created_by` serta `pengasuh_id` tetap dipertahankan backend sebagai audit metadata dan bukan pembatas akses.

## Fitur utama

- Login pengasuh, restore session, rotating refresh token, dan logout terkonfirmasi.
- Dashboard dengan kartu Total Children dan Recent Activity yang membuka menu terkait.
- Daftar anak, pencarian, tambah/edit dengan date picker, serta penghapusan dengan history safeguard.
- Kuesioner SDQ dengan confirmation, floating progress, draft lokal, dan hasil resmi dari server.
- Hasil screening berupa total score, kategori, breakdown per skala, rekomendasi, dan riwayat profesional.
- Monitoring anak dengan grafik tren dan detail screening yang dapat diperluas.
- Materi edukasi dan akses kontak psikolog melalui WhatsApp.
- Bahasa Indonesia dan English.
- Cached read, indikator offline, retry, dan antrean submission screening melalui WorkManager.

Bottom navigation berisi Home, Children, Screening, Monitoring, dan Education. Menu bantuan psikolog tersedia melalui ikon Help pada topbar. Launcher, splash, loading state, dan login memakai ikon Eco yang sama.

## Design system

- Primary teal: `#004349`
- Secondary teal: `#0D5C63`
- Background: `#F9F9FF`
- Surface: putih
- Font: Plus Jakarta Sans, dibundel lokal pada `app/src/main/res/font/`
- Spacing horizontal layar: `24dp`
- Heading halaman: `28sp`

Lisensi Plus Jakarta Sans disimpan pada `PLUS_JAKARTA_SANS_LICENSE.txt`.

## Build debug

Debug saat ini memakai backend VPS di `https://www.growwell.id/api/`. Untuk pengembangan backend lokal, ubah `API_BASE_URL` varian debug ke `http://10.0.2.2:3001/api/`.

```powershell
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\android-sdk'
.\gradlew.bat :app:assembleDebug
```

APK dibuat di `app/build/outputs/apk/debug/app-debug.apk`.

Gate lokal lengkap:

```powershell
.\gradlew.bat testDebugUnitTest lintDebug assembleDebug assembleRelease
```

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
- Gangguan jaringan atau error server sementara tidak menghapus refresh session.
- Cached user minimal dapat memulihkan UI ketika perangkat offline.
- Logout merevoke refresh session di server dan menghapus token lokal.

Jangan menyimpan signing key atau credential API di repository.

## Cache, draft, dan antrean offline

Room database versi 2 menyimpan profil anak, payload dashboard/edukasi/psikolog/form/monitoring, draft jawaban, dan pending screening. Migrasi `1 -> 2` bersifat eksplisit agar upgrade aplikasi tidak menghapus data lokal.

Screening offline memakai UUID `client_submission_id`. Repository menyimpan request sebelum WorkManager menjalankan unique work. Setelah sinkronisasi berhasil, ViewModel mengambil hasil resmi dari backend. Submission terminal yang gagal dapat ditinjau kembali tanpa menghapus draft jawaban.

Logout membersihkan token, cache, draft, serta pending data lokal milik session.

## Release

Release build hanya menerima URL API HTTPS yang diakhiri `/`:

```powershell
.\gradlew.bat assembleRelease -PGROWWELL_API_BASE_URL=https://www.growwell.id/api/
.\gradlew.bat bundleRelease -PGROWWELL_API_BASE_URL=https://www.growwell.id/api/
```

`assembleRelease` menghasilkan `app-release-unsigned.apk`. Signing key, password, dan signed artifact harus dibuat melalui konfigurasi release/pipeline di luar repository.
