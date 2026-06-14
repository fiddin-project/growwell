# GrowWell — Product Requirements Document

> Version 2.1 | Last Updated: 2026-06-12

---

## 1. Product Overview

**GrowWell** is a web-based health monitoring application designed for caregivers (*pengasuh*) to conduct early detection of emotional and behavioral problems in children and adolescents. The detection is performed using the internationally validated **Strength and Difficulties Questionnaire (SDQ)**, administered periodically so that each child maintains a longitudinal screening history.

### 1.1 Problem Statement

Caregivers in clinical or community settings often lack a structured, digital tool to:
- Administer standardized SDQ questionnaires consistently.
- Track a child's emotional and behavioral development over time.
- Access psychoeducation resources and psychological support.

GrowWell addresses all three gaps in a single, accessible web application.

### 1.2 Goals

| Goal | Description |
|---|---|
| Structured Screening | Digitize the SDQ process to reduce human error and manual paperwork |
| Longitudinal Monitoring | Enable caregivers to view score history and developmental trends per child |
| Psychoeducation | Provide curated PDF and YouTube resources for caregivers |
| Psychological Support | Connect caregivers to psychologists via WhatsApp |
| Multilingual Access | Support both Bahasa Indonesia and English in-app |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS v4 (CSS-first `@theme` config in `index.css`) |
| Backend | Node.js + Fastify |
| Database | MySQL |
| ORM | Prisma |
| i18n | react-i18next |
| Charts | Recharts |
| File Storage | Server-side (PDF uploads stored under `uploads/edukasi/` on the server filesystem) |

### 2.1 Design System

- **Color Palette**: Teal-centric professional palette (`#004349` primary) with a clean white/neutral canvas
- **Design Style**: Modern Material Design 3 inspired — clean UI with gradient headers, soft card borders, and accessible forms
- **Gradient System**: Subtle teal gradients applied to high-impact surfaces (PageHeader, stat cards, sidebar, login, pagination buttons)
- **Card System**: Consistent `border-[rgba(0,67,73,0.08)]` borders, `radius-xl` corners, subtle shadows, and hover lift effects. Responsive padding: `16px` on mobile (< 640px), `24px` on desktop
- **Badge System**: Token-based utility classes (`badge-success`, `badge-neutral`, `badge-info`, `badge-error`) for all status indicators
- **Languages**: Bahasa Indonesia (default) + English — togglable at any time via a language switcher in the navbar
- **Mobile Responsiveness**: All layouts use Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`). Desktop experience is identical or improved (larger tap targets). Mobile-specific adaptations include column hiding in DataTables, stacked form fields, responsive card padding, and stacked modal buttons

### 2.2 Development Configuration

- Backend runs on port **3001** (configurable via `PORT` env var)
- Frontend dev server defaults to **http://localhost:5173**
- CORS origin is configured via `ALLOWED_ORIGINS` env var (defaults to `http://localhost:5173`)
- JWT expires in **8 hours**; secret set via `JWT_SECRET` env var (required — server won't start without it)
- Upload directory configured via `UPLOAD_DIR` env var (defaults to `uploads/`)
- PDF uploads served at `/uploads/` prefix via `@fastify/static`

---

## 3. User Roles

| Role | Internal Value | Description |
|---|---|---|
| **Admin** | `ADMIN` | System administrator. Manages users, children, questionnaire master data, educational resources, and psychologist contacts. Full system access. |
| **Pengasuh** (Caregiver) | `PENGASUH` | A caregiver responsible for one or more children. Conducts screenings, monitors progress, accesses education, and contacts psychologists. |

> Children/patients do **not** have their own login. All child data is managed through the caregiver's account.

---

## 4. Authentication

### 4.1 Login

- Single login page (`/login`) for both roles; role is determined by credentials.
- Passwords hashed with **bcrypt** (10 salt rounds) — never stored as plaintext.
- Decorative background circles are responsive: smaller on mobile (200px/250px), larger on desktop (400px/500px).
- Demo credentials (seeded):

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `123` |
| Pengasuh | `pengasuh_1` | `123` |
| Pengasuh | `pengasuh_2` | `123` |

- Session managed via **JWT** stored in `localStorage` under the keys `growwell_token` and `growwell_user`.
- Token payload contains: `{ id, role, nama_lengkap }`.
- After login, the user is redirected to their role-specific dashboard:
  - `ADMIN` → `/admin/dashboard`
  - `PENGASUH` → `/pengasuh/dashboard`
- On app load, if a non-mock token exists in `localStorage`, the frontend calls `GET /api/auth/me` to validate and restore the session; if validation fails, the token is cleared.
- **Rate limiting**: Login endpoint is rate-limited to **5 attempts per 5 minutes** (via `@fastify/rate-limit`). Global rate limit is **100 requests per minute**.
- **Offline/mock fallback**: If the API call fails, the frontend falls back to a hardcoded mock user list to support development without a live backend. Mock sessions use tokens prefixed with `mock-`.

### 4.2 Logout

- Available in the sidebar for both roles.
- Opens a confirmation dialog (primary variant) before logging out.
- Clears `growwell_token` and `growwell_user` from `localStorage` and redirects to `/login`.
- Modal footer buttons stack vertically on very small screens.

### 4.3 Route Protection

- `ProtectedRoute` component wraps all role-specific routes and enforces role matching.
- Unauthenticated requests to protected routes redirect to `/login`.
- All backend API routes require a valid JWT in the `Authorization: Bearer <token>` header, verified via `authenticate` + `requireRole` middleware.
- All `/:id` routes use `validateIdParam` middleware to reject non-numeric IDs with HTTP 400.

---

## 5. Admin Module

### 5.1 Admin Dashboard

A data-rich summary page queried via `GET /api/admin/dashboard`.

| Widget | Description |
|---|---|
| **Total Pengasuh Card** | Count of all `PENGASUH` role accounts |
| **Total Screenings Card** | Total number of SDQ submissions (`Skrining` rows) ever |
| **Screenings This Month Card** | Count of screenings in the current calendar month |
| **% Abnormal Card** | Percentage of all screenings with `kategori_total = 'Abnormal'` |
| **Screenings Per Month Chart** | Bar chart of skrining activity over the last **6 months** (raw SQL `DATE_FORMAT` grouping) |
| **Category Distribution Chart** | Donut (PieChart) showing distribution of `kategori_total` values (Normal / Borderline / Abnormal) across all screenings |

**Note:** The `$queryRaw` result for monthly screening data returns `BigInt` for `COUNT(*)`, which is serialized to `Number` before sending to the frontend. Month labels are localized via i18n keys (`month_jan`..`month_dec`). The page displays an error state if the API call fails.

---

### 5.2 Master User (CRUD)

Route: `/admin/users` | API prefix: `/api/admin/users`

Manages **Pengasuh** accounts only (Admin cannot demote themselves or change their own role).

**Table columns:** `Nama Lengkap`, `Username`, `Registration Date` (hidden on mobile), `Actions`

**Mobile behavior:** Registration Date column is hidden on small screens via `hideOnMobile` prop. Action buttons use 44px tap targets. Modal form fields stack vertically on mobile.

**API features:**
- **GET** supports `search` (OR match on `username` + `nama_lengkap`), `role` filter, `page`, and `limit` query params; returns `{ data, total, page, limit }`.
- **POST** creates a `PENGASUH` user; validates unique `username`; hashes password.
- **PUT** updates `nama_lengkap`, `username` (unique check), and optionally resets `password` (re-hashed).
- **DELETE** prevents deleting the currently authenticated admin's own account (uses `Number()` comparison to handle JWT string IDs).

---

### 5.3 Master Anak (Children Master) — *Admin-managed*

Route: `/admin/anak` | API prefix: `/api/admin/anak`

Admin can view and manage **all children** across the system (not scoped to a single caregiver).

**Table columns:** `Nama`, `Tanggal Lahir`, `Usia`, `Jenis Kelamin`, `Created By` (caregiver name), `Actions`

**Filter:** Gender toggle buttons (All / Laki-laki / Perempuan)

**Data model fields:** `nama`, `tanggal_lahir`, `jenis_kelamin` (`L`/`P`), `created_by` (FK → User), `created_by_admin` (BOOLEAN)

**Operations:**
- **GET**: All children; supports optional `nama` query filter.
- **POST**: Creates a child with `created_by_admin: true`, linked to the admin's user ID.
- **PUT**: Updates `nama`, `tanggal_lahir`, `jenis_kelamin`. All `:id` params validated via `validateIdParam`.
- **DELETE**: Blocked if the child has any existing `Skrining` records (returns HTTP 400).

**Frontend behavior:** On API failure, no optimistic data is created. The user sees a toast error and the modal stays open for retry. Modal footer buttons stack vertically on very small screens.

---

### 5.4 Master Skala (Scale Master)

Route: `/admin/skala` | API prefix: `/api/admin/skala`

Manages SDQ scales used to categorize questions.

**Data model:**

| Field | Type | Description |
|---|---|---|
| `id_skala` | VARCHAR (PK) | Short code, e.g., `'E'`, `'C'`, `'H'`, `'P'`, `'Pro'` |
| `nama_skala` | VARCHAR | Full name in Bahasa Indonesia |
| `nama_skala_en` | VARCHAR | Full name in English |

**Default seeded data:**

| id_skala | nama_skala | nama_skala_en |
|---|---|---|
| E | Gejala Emosional | Emotional Symptoms |
| C | Masalah Perilaku | Conduct Problems |
| H | Hiperaktivitas | Hyperactivity |
| P | Masalah Teman Sebaya | Peer Problems |
| Pro | Perilaku Prososial | Prosocial Behaviour |

**Operations:** Full CRUD via a simple form-table interface. DELETE is blocked if the scale still has linked questions (returns HTTP 400). **GET** supports `search` query param that filters on `id_skala`, `nama_skala`, and `nama_skala_en`. Modal footer buttons stack vertically on very small screens.

---

### 5.5 Master Pertanyaan (Question Master)

Route: `/admin/pertanyaan` | API prefix: `/api/admin/pertanyaan`

Manages the SDQ question bank, linked to scales.

**Data model:**

| Field | Type | Description |
|---|---|---|
| `id` | INT (PK, Auto-increment) | |
| `urutan` | INT | Display order (default `0`); questions are fetched sorted by `urutan ASC` |
| `teks_pertanyaan` | TEXT | Question text in Bahasa Indonesia |
| `teks_pertanyaan_en` | TEXT | English translation |
| `id_skala` | VARCHAR (FK → Skala) | |
| `skor_tidak_benar` | INT | Score if answer is "Tidak Benar / Not True" — `0` or `2` |
| `skor_agak_benar` | INT | Score if answer is "Agak Benar / Somewhat True" — always `1` |
| `skor_selalu_benar` | INT | Score if answer is "Selalu Benar / Certainly True" — `2` or `0` |

> **Note:** The current database uses a single unified question set for all ages (25 questions). No age-group differentiation exists in the schema.

> **Note:** Questions are filterable by `id_skala` via query param on both admin and pengasuh endpoints.

**Operations:** Full CRUD. `urutan` field supports custom ordering. Admin can filter by `id_skala`.

**Mobile behavior:** On small screens, the following columns are hidden: No. (row number), Question EN (redundant with ID), TT/AB/SB score columns. Only Question ID, Scale, and Actions remain visible. Action buttons use 44px tap targets.

**Seeded question set (25 items):**

The seed file pre-populates the full standard SDQ question set with `urutan` 1–25. Reverse-scored items (e.g., items 7, 11, 14, 21, 25) have `skor_tidak_benar: 2` and `skor_selalu_benar: 0`.

---

### 5.6 Master Ambang Batas (Threshold Master)

Route: `/admin/ambang-batas` | API prefix: `/api/admin/ambang-batas`

Manages SDQ scoring cutoff thresholds that determine **Normal / Borderline / Abnormal** risk categories. Fully configurable from the Admin UI — no code changes required.

**Data model:**

| Field | Type | Description |
|---|---|---|
| `id` | INT (PK) | |
| `id_skala` | VARCHAR (FK → Skala), nullable | `NULL` = applies to Total Difficulties Score |
| `batas_normal_max` | INT | Upper bound of Normal range (inclusive) |
| `batas_borderline_max` | INT | Upper bound of Borderline range (inclusive); anything above = Abnormal |
| `is_reversed` | BOOLEAN | `false` for difficulty scales (higher = worse); `true` for Prosocial (lower = worse) |

**UI behavior:** The table is locked by default (read-only). Clicking **Edit** enables inline editing of threshold values. **Save**, **Cancel**, and **Reset Defaults** buttons appear only in edit mode. The Scale column displays bilingual names (e.g., "Gejala Emosional / Emotional Symptoms (E)"). Table includes a screen-reader-only `<caption>` element for accessibility.

**Scoring logic at runtime:**
```
// Standard scales (is_reversed = false, higher score = more concerning)
IF score <= batas_normal_max      → "Normal"
IF score <= batas_borderline_max  → "Borderline"
IF score >  batas_borderline_max  → "Abnormal"

// Reversed scale (is_reversed = true, e.g. Prosocial — lower score = more concerning)
IF score >  batas_borderline_max  → "Normal"
IF score >  batas_normal_max      → "Borderline"
IF score <= batas_normal_max      → "Abnormal"
```

**Admin API:**
- `GET /api/admin/ambang-batas` — returns all thresholds with `skala` relation included.
- `PUT /api/admin/ambang-batas/:id` — updates `batas_normal_max` and `batas_borderline_max` for a specific row.
- `POST /api/admin/ambang-batas/reset` — deletes all rows and re-seeds from the `defaultThresholds` constant (wrapped in a Prisma `$transaction`).

**Default seeded values (from `defaultThresholds.js`):**

| id_skala | batas_normal_max | batas_borderline_max | is_reversed |
|---|---|---|---|
| NULL (Total) | 13 | 16 | false |
| E | 3 | 4 | false |
| C | 2 | 3 | false |
| H | 5 | 6 | false |
| P | 2 | 3 | false |
| Pro | 4 | 5 | true |

> **Fallback behavior:** If a threshold row is not found for a given scale during scoring, the category defaults to `'Unknown'` (no hardcoded fallback currently; the scoring service uses `determineKategori` from `src/services/scoring.js`).

---

### 5.7 Master Edukasi (Education Master)

Route: `/admin/edukasi` | API prefix: `/api/admin/edukasi`

Manages educational content accessible to Pengasuh.

**Data model:**

| Field | Type | Description |
|---|---|---|
| `id` | INT (PK) | |
| `judul` | VARCHAR(255) | Title in Bahasa Indonesia |
| `judul_en` | VARCHAR(255) | Title in English |
| `deskripsi` | TEXT | Short description in Bahasa Indonesia |
| `deskripsi_en` | TEXT | Short description in English |
| `tipe` | VARCHAR(10) | `'pdf'` or `'youtube'` |
| `url_atau_file` | VARCHAR(500) | YouTube URL or server file path for PDF (e.g., `/uploads/edukasi/<uuid>.pdf`) |
| `created_at` | DATETIME | |
| `is_active` | BOOLEAN | Default `true`; soft visibility toggle |

**Operations:**
- **Create PDF**: Multipart form upload; file saved to `uploads/edukasi/` with a UUID filename; `tipe` set to `'pdf'` automatically. **Field allowlisting**: only `judul`, `deskripsi`, `tipe`, `url_atau_file`, `is_active` are accepted from multipart form fields — all other fields are ignored.
- **Create YouTube**: JSON body with `url_atau_file` (YouTube URL) and `tipe: 'youtube'`.
- **Read**: List of all records (admin sees all regardless of `is_active`).
- **Update**: Multipart or JSON; if a new file is uploaded, the old file is deleted from disk.
- **Delete**: Removes the database record; also deletes the file from disk if `tipe === 'pdf'`.

**Frontend behavior:** Admin EdukasiPage displays bilingual descriptions based on active language. On API failure, no optimistic data is created. Modal footer buttons stack vertically on very small screens.

---

### 5.8 Master Psikolog (Psychologist Master)

Route: `/admin/psikolog` | API prefix: `/api/admin/psikolog`

Manages psychologist contact directory.

**Data model:**

| Field | Type | Description |
|---|---|---|
| `id` | INT (PK) | |
| `nama` | VARCHAR(100) | Full name |
| `spesialisasi` | VARCHAR(200) | Specialization in Bahasa Indonesia |
| `spesialisasi_en` | VARCHAR(200) | Specialization in English |
| `nomor_whatsapp` | VARCHAR(20) | WhatsApp number in international format, e.g., `628123456789` |
| `pesan_default` | TEXT | Pre-filled WhatsApp message template (Bahasa Indonesia) |
| `pesan_default_en` | TEXT | Pre-filled WhatsApp message template (English) |
| `is_active` | BOOLEAN | Default `true` |

**Validation:** `nama`, `spesialisasi`, and `nomor_whatsapp` are required on create.

**Operations:** Full CRUD via modal form. Admin PsikologPage displays bilingual specialization based on active language. Modal footer buttons stack vertically on very small screens.

---

## 6. Pengasuh (Caregiver) Module

### 6.1 Pengasuh Dashboard

Route: `/pengasuh/dashboard` | API: `GET /api/pengasuh/dashboard`

A greeting-based landing page displaying the caregiver's name and app tagline, followed by:

1. **Four navigation cards/tiles:**

| Menu | Description |
|---|---|
| 🩺 **Skrining (Screening)** | Start a new SDQ questionnaire for a child |
| 📚 **Edukasi** | Access PDF and YouTube educational resources |
| 📈 **Monitoring Perkembangan** | View screening history and progress charts per child |
| 💬 **Halo Psikolog** | Contact a psychologist via WhatsApp |

2. **Recent Activity** — the last 3 screenings (child name, date, risk category badge), clickable to navigate to the child's monitoring page.

The API returns `{ recentScreenings: [...] }` containing the last 5 screening records for the logged-in caregiver (with child name included).

---

### 6.2 Screening Flow

#### Step 1 — Child Selection or Registration

Route: `/pengasuh/screening` | API: `GET /api/pengasuh/anak`

- Displays a list of children belonging to the logged-in pengasuh (`created_by = req.user.id`), ordered by `created_at DESC`.
- A **"+ Tambah Anak Baru"** button navigates to `/pengasuh/screening/new-child`.

**Registering a new child** (`POST /api/pengasuh/anak`):

| Field | Validation |
|---|---|
| `nama` | Required |
| `tanggal_lahir` | Required; stored as `DATE` |
| `jenis_kelamin` | Required; must be `'L'` or `'P'` |

Child is created with `created_by: req.user.id` and `created_by_admin: false`.

**Pengasuh can also edit their own children** via `PUT /api/pengasuh/anak/:id` (name, DOB, gender). Ownership is verified — pengasuh can only edit children where `created_by === req.user.id`. There is no delete endpoint on the pengasuh side.

> Admin-created children (where `created_by` is the admin's ID) are **not** shown in the pengasuh's child list because the filter is `created_by = req.user.id`. Assignment of admin-created children to a specific pengasuh is not currently implemented.

> On API failure when creating a new child, the user is redirected to the child list (no phantom data created).

#### Step 2 — Questionnaire Display

Route: `/pengasuh/screening/:childId` | API: `GET /api/pengasuh/pertanyaan`

- All questions are fetched sorted by `urutan ASC`. **All 25 questions** are presented to every child regardless of age.
- The page displays the child's name and calculated age.
- Questions are displayed as a **scrollable single-page list** (max-height `55vh` with overflow scroll) — not paginated or split by scale.
- Each question shows three answer buttons:
  - **Tidak Benar** / Not True (`tidak_benar`)
  - **Agak Benar** / Somewhat True (`agak_benar`)
  - **Selalu Benar** / Certainly True (`selalu_benar`)
- A **progress bar** and `answered/total` counter updates in real-time as answers are selected. Progress bar is responsive: full-width on mobile, fixed 200px on desktop.
- A success indicator (green checkmark) appears when all questions are answered.
- The **Submit** button is disabled until all questions are answered.
- If the API call fails, the page falls back to mock question data.

#### Step 3 — Submission & Instant Result

Route: `/pengasuh/screening/:childId/result/:skriningId` | API: `POST /api/pengasuh/skrining`

**Submission payload:**
```json
{
  "anak_id": 1,
  "jawaban": [
    { "id_pertanyaan": 1, "jawaban": "tidak_benar" },
    ...
  ]
}
```

**Backend scoring process:**
1. Verifies the child belongs to the requesting pengasuh (`anak.created_by === req.user.id`); returns 403 otherwise.
2. Fetches all `AmbangBatas` rows.
3. Fetches all submitted `Pertanyaan` rows (with their `Skala`).
4. Calculates `skor_diberikan` per answer using the question's score fields.
5. Sums scores by `id_skala` → `skalaScores`.
6. Computes `totalScore` = sum of all scales **except** `'Pro'`.
7. Determines `kategori` for each scale using `determineKategori(skor, ambang, ambang.is_reversed)`.
8. Determines `kategoriTotal` using the threshold row where `id_skala IS NULL`.
9. Saves all records in a single Prisma **transaction**: `Skrining` → `HasilSkala[]` → `Jawaban[]`.
10. Returns: `{ id, anak_id, total_score, kategori_total, per_skala[], jawaban[] }`.

**Result screen** shows:
- Child's name and screening date
- Table of per-scale scores with category badges (Normal / Borderline / Abnormal)
- Total Difficulties Score with overall category badge
- Interpretive text based on `kategori_total` (from i18n keys: `interp_normal`, `interp_borderline`, `interp_abnormal`)
- Two action buttons: **"Lihat Riwayat"** (→ monitoring) and **"Skrining Lagi"** (→ new screening for same child)
- Page is constrained to `max-w-2xl` (672px) and centered — works well on all screen sizes

---

### 6.3 Edukasi

Route: `/pengasuh/edukasi` | API: `GET /api/pengasuh/edukasi`

- Returns only records where `is_active = true`.
- Filter tabs: **PDF** | **YouTube** | **Semua (All)**
- **PDF items**: "Buka / Open" button opens the file URL in a new tab.
- **YouTube items**: "Tonton / Watch" link opens in a new tab.
- Supports bilingual titles and descriptions based on active language.

---

### 6.4 Monitoring Perkembangan (Progress Monitoring)

**Select screen:** `/pengasuh/monitoring` — lists the pengasuh's children; clicking one navigates to the detail page.

**Detail page:** `/pengasuh/monitoring/:childId` | API: `GET /api/pengasuh/monitoring/:anakId`

- Verifies the child belongs to the requesting pengasuh (`anak.created_by === req.user.id`); returns 404 otherwise.
- Response shape:
  ```json
  {
    "anak": { "nama", "tanggal_lahir", "jenis_kelamin" },
    "riwayat": [
      {
        "id", "tanggal_skrining", "total_score", "kategori_total",
        "per_skala": [{ "id_skala", "skor", "kategori", "nama_skala" }]
      }
    ]
  }
  ```
- **Screening History Table**: Date, Total Score, Risk Category badge, with an "eye" action button to open per-scale detail in a modal. All columns visible on mobile (only 3 columns). Action button uses 44px tap target.
- **Line Chart** (Recharts `LineChart`):
  - X-axis: screening date (ISO string date)
  - Y-axis: Total Difficulties Score (domain `0–40`)
  - Reference lines at `y=13` (Normal/Borderline boundary) and `y=19` (Borderline/Abnormal boundary) — currently hardcoded in the chart component
- The chart legend displays fixed ranges: "Normal (0-13)", "Borderline (14-19)", "Abnormal (20-40)" which do not update with configurable thresholds
  - Data sorted ascending by date before rendering
- **Scale Detail Modal** (size `lg`): Table showing each scale's score and category badge for the selected screening session.
- Falls back to mock data if the API call fails.

---

### 6.5 Halo Psikolog

Route: `/pengasuh/psikolog` | API: `GET /api/pengasuh/psikolog`

- Returns only psikolog records where `is_active = true`.
- Each card shows: Name, Specialization (bilingual based on active language).
- **"Chat via WhatsApp"** button opens:
  `https://wa.me/{nomor_whatsapp}?text={pesan_default or pesan_default_en}`
  in a new tab.

---

## 7. SDQ Scoring Logic

### 7.1 Score Calculation

After all 25 answers are submitted, the backend calculates scores as follows:

1. **Per-question score**: Uses `skor_tidak_benar`, `skor_agak_benar`, or `skor_selalu_benar` from the `Pertanyaan` row based on the submitted answer key.
2. **Sub-score per scale**: Sums question scores grouped by `id_skala`.
3. **Total Difficulties Score**: Sum of sub-scores for E + C + H + P. Prosocial (`Pro`) is **excluded** from the total (hardcoded exclusion list: `['Pro']`).

### 7.2 Threshold Lookup (`determineKategori`)

Implemented in `backend/src/services/scoring.js`:

```js
// Standard (is_reversed = false)
if (score <= ambang.batas_normal_max)     → 'Normal'
if (score <= ambang.batas_borderline_max) → 'Borderline'
else                                      → 'Abnormal'

// Reversed (is_reversed = true, e.g. Prosocial — lower score = more concerning)
if (score > ambang.batas_borderline_max)  → 'Normal'
if (score > ambang.batas_normal_max)      → 'Borderline'
else                                      → 'Abnormal'
```

The scoring service looks up the threshold at runtime from `AmbangBatas` using `id_skala` match. For the Total Difficulties Score, it finds the row where `id_skala === null`. If no matching row is found, `kategori` is set to `'Unknown'`.

> **Note:** A single threshold row applies per scale regardless of the child's age. No age-group differentiation exists in the system.

### 7.3 Default Seed Values

Source: `backend/src/lib/defaultThresholds.js`

| id_skala | batas_normal_max | batas_borderline_max | is_reversed |
|---|---|---|---|
| NULL (Total) | 13 | 16 | false |
| E | 3 | 4 | false |
| C | 2 | 3 | false |
| H | 5 | 6 | false |
| P | 2 | 3 | false |
| Pro | 4 | 5 | true |

---

## 8. Data Models

Full Prisma schema (`backend/prisma/schema.prisma`):

```prisma
model User {
  id            Int        @id @default(autoincrement())
  username      String     @unique @db.VarChar(50)
  password_hash String     @db.VarChar(255)
  nama_lengkap  String     @db.VarChar(100)
  role          String     @db.VarChar(10)   // 'ADMIN' | 'PENGASUH'
  created_at    DateTime   @default(now())
  skrining      Skrining[]
  anak          Anak[]
}

model Anak {
  id              Int        @id @default(autoincrement())
  nama            String     @db.VarChar(100)
  tanggal_lahir   DateTime   @db.Date
  jenis_kelamin   String     @db.VarChar(1)  // 'L' | 'P'
  created_by      Int?
  created_by_admin Boolean   @default(false)
  created_at      DateTime   @default(now())
  skrining        Skrining[]
  pembuat         User?      @relation(fields: [created_by], references: [id], onDelete: SetNull)
}

model Skala {
  id_skala      String       @id @db.VarChar(10)
  nama_skala    String       @db.VarChar(100)
  nama_skala_en String       @db.VarChar(100)
  pertanyaan    Pertanyaan[]
  ambangBatas   AmbangBatas[]
  hasilSkala    HasilSkala[]
}

model Pertanyaan {
  id                 Int      @id @default(autoincrement())
  urutan             Int      @default(0)
  teks_pertanyaan    String   @db.Text
  teks_pertanyaan_en String   @db.Text
  id_skala           String   @db.VarChar(10)
  skor_tidak_benar   Int
  skor_agak_benar    Int
  skor_selalu_benar  Int
  skala              Skala    @relation(fields: [id_skala], references: [id_skala])
  jawaban            Jawaban[]
}

model AmbangBatas {
  id                   Int     @id @default(autoincrement())
  id_skala             String? @db.VarChar(10)   // NULL = Total Difficulties
  batas_normal_max     Int
  batas_borderline_max Int
  is_reversed          Boolean @default(false)
  skala                Skala?  @relation(fields: [id_skala], references: [id_skala])
}

model Skrining {
  id               Int        @id @default(autoincrement())
  anak_id          Int
  pengasuh_id      Int
  tanggal_skrining DateTime   @default(now())
  total_score      Int
  kategori_total   String     @db.VarChar(20)
  anak             Anak       @relation(fields: [anak_id], references: [id], onDelete: Restrict)
  pengasuh         User       @relation(fields: [pengasuh_id], references: [id], onDelete: Restrict)
  hasilSkala       HasilSkala[]
  jawaban          Jawaban[]
}

model HasilSkala {
  id          Int      @id @default(autoincrement())
  skrining_id Int
  id_skala    String   @db.VarChar(10)
  skor        Int
  kategori    String   @db.VarChar(20)
  skrining    Skrining @relation(fields: [skrining_id], references: [id], onDelete: Cascade)
  skala       Skala    @relation(fields: [id_skala], references: [id_skala])
}

model Jawaban {
  id             Int        @id @default(autoincrement())
  skrining_id    Int
  id_pertanyaan  Int
  jawaban        String     @db.VarChar(20)   // 'tidak_benar' | 'agak_benar' | 'selalu_benar'
  skor_diberikan Int
  skrining       Skrining   @relation(fields: [skrining_id], references: [id], onDelete: Cascade)
  pertanyaan     Pertanyaan @relation(fields: [id_pertanyaan], references: [id])
}

model Edukasi {
  id            Int      @id @default(autoincrement())
  judul         String   @db.VarChar(255)
  judul_en      String   @db.VarChar(255)
  deskripsi     String   @db.Text
  deskripsi_en  String   @db.Text
  tipe          String   @db.VarChar(10)    // 'pdf' | 'youtube'
  url_atau_file String   @db.VarChar(500)
  created_at    DateTime @default(now())
  is_active     Boolean  @default(true)
}

model Psikolog {
  id               Int     @id @default(autoincrement())
  nama             String  @db.VarChar(100)
  spesialisasi     String  @db.VarChar(200)
  spesialisasi_en  String  @db.VarChar(200)
  nomor_whatsapp   String  @db.VarChar(20)
  pesan_default    String  @db.Text
  pesan_default_en String  @db.Text
  is_active        Boolean @default(true)
}
```

---

## 9. API Route Map

### Auth
```
POST /api/auth/login          → Login, returns { token, user } (rate-limited: 5 attempts/5 min)
GET  /api/auth/me             → Validate token, returns current user
```

### Admin (all require ADMIN role)
```
GET    /api/admin/dashboard
GET    /api/admin/users       ?search=&role=&page=&limit=
POST   /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id

GET    /api/admin/anak        ?nama=
POST   /api/admin/anak
PUT    /api/admin/anak/:id
DELETE /api/admin/anak/:id

GET    /api/admin/skala       ?search=
POST   /api/admin/skala
PUT    /api/admin/skala/:id
DELETE /api/admin/skala/:id

GET    /api/admin/pertanyaan  ?id_skala=
POST   /api/admin/pertanyaan
PUT    /api/admin/pertanyaan/:id
DELETE /api/admin/pertanyaan/:id

GET    /api/admin/ambang-batas
PUT    /api/admin/ambang-batas/:id
POST   /api/admin/ambang-batas/reset    (transactional)

GET    /api/admin/edukasi
POST   /api/admin/edukasi     (multipart/form-data for PDF, field-allowlisted)
PUT    /api/admin/edukasi/:id (multipart/form-data for PDF, field-allowlisted)
DELETE /api/admin/edukasi/:id

GET    /api/admin/psikolog
POST   /api/admin/psikolog
PUT    /api/admin/psikolog/:id
DELETE /api/admin/psikolog/:id
```

### Pengasuh (all require PENGASUH role)
```
GET  /api/pengasuh/dashboard
GET  /api/pengasuh/anak
POST /api/pengasuh/anak
PUT  /api/pengasuh/anak/:id          (ownership verified)

GET  /api/pengasuh/pertanyaan   ?id_skala=

GET  /api/pengasuh/skrining/:anakId  (ownership verified)
GET  /api/pengasuh/skrining/detail/:id (ownership verified)
POST /api/pengasuh/skrining           (ownership verified on child)

GET  /api/pengasuh/monitoring/:anakId

GET  /api/pengasuh/edukasi
GET  /api/pengasuh/psikolog
```

### Shared Middleware
```
validateIdParam    → Validates :id params are positive integers; returns 400 otherwise
authenticate       → Verifies JWT in Authorization header
requireRole(role)  → Enforces role match
rate-limit         → Global: 100 req/min; Login: 5 attempts/5 min
```

---

## 10. Frontend Route Map

### Admin Routes
```
/login
/admin/dashboard
/admin/users              → Master User
/admin/anak               → Master Anak
/admin/skala              → Master Skala
/admin/pertanyaan         → Master Pertanyaan
/admin/ambang-batas       → Master Ambang Batas
/admin/edukasi            → Master Edukasi
/admin/psikolog           → Master Psikolog
```

### Pengasuh Routes
```
/login
/pengasuh/dashboard
/pengasuh/screening                          → Child selection
/pengasuh/screening/new-child                → Register new child
/pengasuh/screening/:childId                 → Questionnaire form
/pengasuh/screening/:childId/result/:skriningId → Instant result screen
/pengasuh/edukasi                            → Education content
/pengasuh/monitoring                         → Select child for monitoring
/pengasuh/monitoring/:childId                → Score history + line chart
/pengasuh/psikolog                           → Psychologist contact list
```

### Layout

- **Sidebar**: Fixed left sidebar (280px) with deep teal gradient background (`from-primary to-[#003a3d]`), navigation links, and logout button. No notification icon. No settings menu.
- **Header**: Sticky top header with mobile menu toggle, language toggle, and user avatar initial.
- **Mobile**: Responsive sidebar with overlay; collapses on small screens. Sidebar CSS breakpoint aligned with Tailwind `md:` (768px). Hamburger button visible below 768px, sidebar slides in as overlay with backdrop.
- **Content Padding**: Responsive — `p-4` on mobile, `p-lg` on tablet, `px-xl` on desktop.
- **Grid Layouts**: All dashboard grids use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for stat cards and `grid-cols-1 lg:grid-cols-2` for charts — stacking on mobile, multi-column on desktop.

---

## 11. Internationalization (i18n)

- Language toggle (ID / EN) available in the **header** at all times.
- Default language: **Bahasa Indonesia**.
- Implemented via **react-i18next** (`frontend/src/i18n/`).
- All UI labels, buttons, messages, form placeholders, error messages, month names, and chart labels are translated.
- Question text served bilingually from the database (`teks_pertanyaan` + `teks_pertanyaan_en`); the active `i18n.language` value determines which field to display.
- Educational content titles/descriptions: bilingual (`judul`/`judul_en`, `deskripsi`/`deskripsi_en`).
- Psychologist specialization: bilingual (`spesialisasi`/`spesialisasi_en`).
- WhatsApp pre-filled message: `pesan_default` (ID) or `pesan_default_en` (EN).
- Dashboard month labels: localized via i18n keys (`month_jan`..`month_dec`).
- Language detection handles region codes (e.g., `id-ID` matches as Indonesian via `startsWith('id')`).

---

## 12. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Passwords hashed with bcrypt (10 rounds); JWT-based auth (8h expiry); role guards on all backend routes via `authenticate` + `requireRole` middleware; CORS restricted to configured origins; ownership checks on all pengasuh data access; rate limiting on login (5/5min) and globally (100/min); field allowlisting on multipart uploads; ID parameter validation on all `/:id` routes |
| **Performance** | Dashboard uses aggregated queries and raw SQL for monthly grouping; paginated user list (server-side `skip`/`take`) |
| **File Validation** | PDF upload: max 10MB enforced by `@fastify/multipart`; UUID-named files to prevent collisions; field allowlisting prevents injection |
| **Data Integrity** | Reset thresholds wrapped in Prisma `$transaction`; BigInt from `$queryRaw` serialized to Number; no optimistic mutations on API failure |
| **Responsive Design** | Mobile-first responsive layout using Tailwind breakpoints (`sm:640px`, `md:768px`, `lg:1024px`). Sidebar collapses to hamburger menu below 768px with overlay backdrop. DataTable columns support `hideOnMobile` prop to hide non-essential columns on small screens. Form grids stack vertically on mobile (`grid-cols-1 sm:grid-cols-2`). Card/stat-card padding responsive (16px mobile, 24px desktop). Modal footer buttons stack vertically on very small screens. Touch targets meet WCAG 44px minimum (pagination, action buttons, search clear). Questionnaire progress bar responsive width. Login decorative circles resize on mobile. PageHeader stacks vertically on mobile. Questionnaire answer buttons full-width with 48px min-height |
| **Error Handling** | Friendly error messages in the active language; toast notifications for all CRUD actions; API failures show error states (not silent fallbacks); modal stays open on save failure for retry |
| **Accessibility** | ARIA labels on action buttons; `aria-busy` on loading DataTables; `role="status"` on badges; `aria-label` on search inputs; semantic `<caption>` on tables; focus trap in modals with dynamic element re-querying |
| **Offline Fallback** | Frontend includes mock data for all entities, enabling UI development without a running backend |
| **Scalability** | Prisma ORM enables schema migrations; MySQL supports multi-tenancy growth |

---

## 13. Seed Data (Initial State)

The seed script (`backend/prisma/seed.js`) provisions the following on first deployment:

- **3 Users**: `admin` (ADMIN), `pengasuh_1` (PENGASUH — Siti Nurhaliza), `pengasuh_2` (PENGASUH — Budi Santoso)
- **5 Scales**: E, C, H, P, Pro
- **6 Threshold rows** (from `defaultThresholds.js`)
- **25 Questions**: Full standard SDQ question set with bilingual text and scoring values
- **3 Children**: Andi Pratama (M, 2016), Sari Dewi (F, 2012) — both under `pengasuh_1`; Rizky Maulana (M, 2014) — created by admin
- **3 Edukasi items**: 2 PDFs + 1 YouTube
- **2 Psikolog contacts**: Dr. Maya Sari (Child Psychology) + Dr. Andi Rahman (Adolescent Psychology)

---

## 14. Out of Scope (v1.0)

- Email/SMS notifications
- Caregiver self-registration (admin creates accounts only)
- Report export (PDF/Excel of screening results)
- Multi-institution / multi-tenancy
- Children's self-login accounts
- Push notifications
- Admin assignment of admin-created children to specific pengasuh accounts
- Pengasuh ability to delete children records

---

*End of Document*
