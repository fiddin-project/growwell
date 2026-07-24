# GrowWell — Execution Plan for API Hardening and Native Android

Status: implemented; retained as architecture, security, and regression reference
Repository baseline: React/Vite web, Fastify 5 backend, Prisma 6, MySQL 8
Primary goal: add a native Android application for the `PENGASUH` role without removing or regressing any existing web function.

Implementation note (2026-07): the native caregiver journey, rotating Android sessions, Room cache/drafts, idempotent WorkManager submission queue, bilingual UI, monitoring, education, and psychologist contact flow are implemented. Use the phase gates below as regression requirements for future changes rather than as an indication that the Android client is still unbuilt.

This document is intentionally explicit. An implementation agent must follow the phases in order, complete the tests and acceptance criteria for one phase, and only then continue to the next phase. Do not combine phases into a large rewrite.

## 1. Locked product decisions

These decisions are requirements, not suggestions.

1. The existing web application remains available.
2. Admin functions remain on the web. The first Android application supports the complete `PENGASUH` journey.
3. The web and Android applications share the existing Fastify backend and MySQL database.
4. Production traffic uses HTTPS. HTTP is allowed only for controlled local development as described in section 4.
5. Authentication uses short-lived access tokens plus rotating, revocable refresh tokens.
6. Mock authentication and silent mock-data fallback must never run in production.
7. All authenticated admins and caregivers can see all children.
8. All authenticated caregivers can create, update, screen, monitor, and—subject to the existing history safeguard—delete any child.
9. `Anak.created_by` is audit metadata only. It must never be used as an authorization or visibility condition.
10. `Skrining.pengasuh_id` is audit metadata identifying who performed a screening. It must never limit visibility of a child's screening history.
11. The backend remains the sole authority for scoring and result categories. Android and web may display results but must not independently persist calculated scores.
12. Existing API paths and response fields remain compatible until both current clients have migrated. Do not make an unannounced breaking API change.
13. Offline mode supports cached reads, questionnaire drafts, and reliable queued screening submission. Child mutations and admin operations remain online-only in the first native release.
14. Bahasa Indonesia and English remain supported.

## 2. Meaning of “no functions lost”

The whole GrowWell system must retain these functions after every production deployment.

### Web admin functions that must remain

- Login, session restore, logout, and role protection.
- Dashboard statistics and charts.
- User list/search/filter/pagination/create/edit/delete.
- Child list/search/create/edit/delete and creator display.
- Scale list/search/create/edit/delete.
- Question list/filter/create/edit/delete, bilingual text, order, and scoring values.
- Threshold list/edit/reset.
- Education list/filter/search/create/edit/delete for PDF, image, and YouTube content.
- Psychologist list/search/create/edit/delete.
- Bahasa Indonesia and English.

### Caregiver functions required on web and Android

- Login, restore session, refresh session, logout.
- Dashboard with recent screening activity.
- View the global child list.
- Add, edit, and delete a child. Deletion remains blocked if screening history exists.
- Select any child and complete all screening questions.
- Submit answers once and receive the server-calculated result.
- View result totals, categories, and per-scale details.
- View all history for a child, regardless of which caregiver performed it.
- View the score trend chart and threshold bands.
- Browse/search/filter education content: PDF, image, YouTube, all.
- Open PDF/image content and external YouTube links.
- Browse psychologist contacts and open WhatsApp with the localized default message.
- Switch between Indonesian and English.
- Show explicit loading, empty, offline, validation, authentication-expired, and server-error states.

## 3. Target architecture

```text
Web React/Vite --------------------+
                                   |
Native Android/Kotlin -------------+--> HTTPS --> Fastify API --> Prisma --> MySQL
                                   |                    |
                                   |                    +--> persistent uploads
                                   |
                                   +--> Android Room cache + offline submission queue
```

Backend responsibilities:

- Authentication, authorization by role, refresh-session lifecycle.
- Validation and canonical API response shapes.
- Child and screening persistence.
- Scoring, threshold selection, and categories.
- Idempotency for offline screening sync.
- Asset URL generation.
- OpenAPI generation.

Client responsibilities:

- UI state, navigation, local language, and accessible presentation.
- Secure credential handling.
- Network retry behavior that never duplicates a screening.
- Local read cache and draft/queue state on Android.

## 4. HTTPS policy for production and development

### Direct answer

The developer machine does not need a publicly trusted HTTPS certificate for normal browser development. `http://localhost:5173` and `http://localhost:3001` may remain available in development. Production and release Android builds must use only the VPS HTTPS URL.

### Required configuration

Backend environments:

- `PUBLIC_BASE_URL=http://localhost:3001` for local backend development.
- `PUBLIC_BASE_URL=https://<production-domain>` on the VPS.
- `COOKIE_SECURE=false` only in local development.
- `COOKIE_SECURE=true` in production.
- Configure Fastify `trustProxy` in production so secure-cookie and client-IP behavior is correct behind host Nginx.
- Preserve the current browser CORS allowlist. Native Android HTTP clients are not governed by browser CORS.

Web development:

- Keep the Vite `/api` and `/uploads` proxy.
- Keep URLs same-origin in the browser.
- Test the production build against a staging HTTPS hostname before release.

Android development:

- Define API base URLs through Gradle build variants; never hardcode a server URL in Kotlin source.
- `debug`: use `http://10.0.2.2:3001/` for the standard Android emulator, or `adb reverse tcp:3001 tcp:3001` and `http://localhost:3001/`.
- A physical device may use the development computer's LAN address only in a trusted development network.
- Allow cleartext only in the debug source set with a debug-only Network Security Configuration.
- `release`: use `https://<production-domain>/`, set `usesCleartextTraffic=false`, and do not include debug trust anchors.
- Never disable TLS certificate validation and never add an “accept all certificates” trust manager.

VPS:

- Keep TLS termination on host Nginx if it is already working.
- Add an HTTP-to-HTTPS redirect and HSTS after HTTPS is verified.
- Forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
- Confirm `/api`, `/uploads`, and the SPA all work through the HTTPS hostname.

HTTPS acceptance checks:

- `curl -I http://<domain>` redirects to HTTPS.
- `curl -I https://<domain>` succeeds with a valid chain.
- `curl https://<domain>/api/health` returns a successful health response.
- A release Android build contains no HTTP production URL and cannot make cleartext requests.

## 5. Execution protocol for a low-cost implementation model

For every task below, the implementing model must use this loop:

1. Read every file named in the task before editing.
2. Search the repository for all usages of any field, endpoint, or function being changed.
3. Change the smallest coherent set of files.
4. Add or update tests in the same change.
5. Run the task-specific tests.
6. Run the phase regression gate.
7. Inspect `git diff --check` and `git diff`; remove accidental edits and secrets.
8. Record the completed checkbox and test result in the pull request or implementation log.
9. Stop on a failed gate. Fix it before starting another phase.

Never do the following:

- Do not rewrite working modules solely for style.
- Do not remove an old response field merely because a new field exists.
- Do not move scoring to a client.
- Do not use mock data after a real API error in production.
- Do not hide API errors by returning sample data.
- Do not run `prisma migrate reset` or the destructive seed script against non-test data.
- Do not edit an already-applied migration. Create a new migration.
- Do not store raw refresh tokens in MySQL or logs.
- Do not log passwords, access tokens, refresh tokens, cookies, or complete health-screening payloads.
- Do not continue to a later phase while tests in the current phase fail.

## 6. Phase 0 — Baseline, safe test environment, and inventory

### 0.1 Create a reproducible test database

Files to inspect/change:

- `docker-compose.yml`
- `backend/vitest.config.js`
- `backend/tests/helper.js`
- `backend/src/lib/prisma.js`
- `backend/package.json`
- `.env.example`

Tasks:

1. Add a separate MySQL test service or `docker-compose.test.yml` using a database named `growwell_test`.
2. Add `backend/.env.test.example`; never commit real passwords.
3. Add a test bootstrap guard that refuses destructive cleanup unless the parsed database name ends in `_test`.
4. Make integration tests deterministic. Because route suites share database state, either run database suites serially or give each worker an isolated schema. Prefer serial execution first because it is simpler and safer.
5. Add scripts:
   - `test:unit`
   - `test:integration`
   - `test:all`
6. Ensure Prisma disconnects after a test suite.
7. Document exact Windows/PowerShell and Linux commands.

Acceptance criteria:

- A fresh developer can create only the test database and run all backend tests.
- Tests fail immediately with a clear message if `DATABASE_URL` points to `growwell` instead of `growwell_test`.
- Two consecutive full test runs have identical results.
- Existing frontend tests remain 29/29 or higher.

### 0.2 Add a health endpoint

Add `GET /api/health` with no authentication.

Response:

```json
{
  "status": "ok",
  "database": "ok"
}
```

Rules:

- Return `200` when the API and database are ready.
- Return `503` when the database check fails.
- Do not expose stack traces, connection strings, versions, or secrets.
- Add tests for 200 and simulated database failure.

### 0.3 Capture the baseline

Before feature edits:

- Run backend and frontend test suites.
- Run frontend lint and production build.
- Save route inventory and feature-parity checklist in the implementation log.
- Manually smoke test login for both roles, one admin CRUD flow, one caregiver screening, education upload/open, monitoring, and WhatsApp link generation.

Phase 0 gate:

```powershell
cd backend
npm.cmd run test:all
cd ..\frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

## 7. Phase 1 — Refactor backend bootstrap without behavior changes

Purpose: production and tests must instantiate the same Fastify application so OpenAPI, cookies, schemas, and middleware cannot diverge.

Files:

- Create `backend/src/app.js`.
- Keep `backend/src/index.js` as the process entry point.
- Update `backend/tests/helper.js` to import the production app factory.

Tasks:

1. Move Fastify creation, plugin registration, middleware, and route registration into `buildApp(options)` in `app.js`.
2. Keep `listen()` and process-exit behavior only in `index.js`.
3. Permit test injection of logger settings, Prisma dependency where practical, upload root, and auth secret.
4. Preserve route order and current behavior.
5. Add a test proving every expected route is registered by the production factory.

Acceptance criteria:

- Production still starts with `npm start`.
- Tests no longer maintain a duplicate route-registration list.
- No endpoint payload or status code changes in this phase.
- Phase 0 gate passes.

## 8. Phase 2 — Rotating refresh tokens, revoke, and logout

### 2.1 Database model

Add a new Prisma model named `RefreshSession` and a new migration. Recommended fields:

```prisma
model RefreshSession {
  id             String    @id @default(uuid()) @db.VarChar(36)
  family_id      String    @db.VarChar(36)
  user_id        Int
  token_hash     String    @unique @db.Char(64)
  expires_at     DateTime
  revoked_at     DateTime?
  replaced_by_id String?   @db.VarChar(36)
  created_at     DateTime  @default(now())
  last_used_at   DateTime?
  user_agent     String?   @db.VarChar(255)
  ip_address     String?   @db.VarChar(64)
  user           User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([family_id])
  @@index([expires_at])
}
```

Add the reverse `refresh_sessions RefreshSession[]` relation to `User`.

Rules:

- Generate an opaque refresh token with a cryptographically secure random generator.
- Store only SHA-256 of the refresh token.
- Default access-token lifetime: 15 minutes.
- Default refresh-session lifetime: 30 days.
- Make both lifetimes configurable through environment variables with validated defaults.
- Keep `id`, `role`, and `nama_lengkap` in the access-token payload for compatibility; add `type: "access"` and a JWT ID.
- `authenticate` must reject a JWT whose `type` is not `access`.

### 2.2 Auth API contract

Preserve `POST /api/auth/login` and `GET /api/auth/me`. Add:

- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`

Login request:

```json
{
  "username": "pengasuh_1",
  "password": "secret",
  "client_type": "web"
}
```

`client_type` is optional, accepts `web` or `android`, and defaults to `web` for backward compatibility.

Successful login response:

```json
{
  "token": "<access-token-compatibility-alias>",
  "access_token": "<access-token>",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": 2,
    "username": "pengasuh_1",
    "nama_lengkap": "Siti Nurhaliza",
    "role": "PENGASUH"
  }
}
```

Compatibility rule: keep `token` equal to `access_token` for the current web client. Mark `token` deprecated in OpenAPI, but do not remove it in this implementation.

Refresh-token delivery:

- For `web`, set `growwell_refresh` as an HttpOnly cookie with `Path=/api/auth`, appropriate SameSite setting, environment-controlled Secure, and explicit Max-Age.
- For `android`, include `refresh_token` in the JSON response. The Android client must immediately place it in Keystore-backed encrypted storage.
- Never return the web refresh token to browser JavaScript.

Refresh request:

- Web sends the HttpOnly cookie.
- Android sends `{ "refresh_token": "..." }`.
- Rotate on every successful refresh: revoke the old row and create a replacement in one Prisma transaction.
- Return a new access token and, for Android, the new refresh token.
- If an already-revoked token is reused, revoke every active session in the same `family_id` and return 401.

Logout behavior:

- `/logout` revokes only the presented refresh session, clears the web cookie, and returns 204.
- `/logout-all` requires a valid access token, revokes all refresh sessions for that user, clears the web cookie, and returns 204.
- Logout is idempotent: a missing or already-revoked refresh token still clears local state and returns 204.

### 2.3 Web authentication migration

Files:

- `frontend/src/api/client.js`
- `frontend/src/api/auth.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/pages/LoginPage.jsx`
- Add a small in-memory access-token store if needed.

Tasks:

1. Set Axios `withCredentials: true`.
2. On login, request `client_type: "web"` and store access token in memory.
3. On page reload, call `/auth/refresh`, then restore the user. Do not depend on an unexpired access token in `localStorage`.
4. Implement a single-flight refresh interceptor: simultaneous 401 responses trigger one refresh request, queue pending requests, then retry each request once.
5. Never retry login, refresh, or logout recursively.
6. On refresh failure, clear state and navigate to login once.
7. Make logout call the API first and then always clear local state in `finally`.
8. Remove silent mock login from normal operation.
9. If mock development is still needed, require `VITE_ENABLE_MOCKS=true`; default it to false and fail the production build if true.
10. Remove page-level substitution of mock health data after API failures. Show an explicit error with retry. Design-time fixtures may remain in tests and Storybook-like development only.

Auth tests:

- Valid and invalid login.
- Access token expires independently of refresh session.
- Refresh rotation.
- Old refresh-token reuse revokes the family.
- Current-session logout.
- Logout all devices.
- Deleted user cannot refresh; if a future `is_active` account field is introduced, an inactive user must also be rejected.
- Role guard still works after refresh.
- Cookie attributes differ correctly between development and production.
- Web interceptor makes only one refresh call for multiple concurrent 401s.
- Production cannot authenticate with `mockUsers`.

Phase 2 gate:

- All baseline tests pass.
- Auth tests pass.
- Manual browser reload restores the session.
- Logout invalidates the server-side refresh session.
- A copied, revoked refresh token cannot obtain another access token.

## 9. Phase 3 — Global child and screening visibility

### 3.1 Required access matrix

| Operation | ADMIN | PENGASUH |
| --- | --- | --- |
| List/read all children | Allow | Allow |
| Create child | Allow | Allow |
| Update any child | Allow | Allow |
| Delete child without history | Allow | Allow |
| Delete child with history | Deny 400 | Deny 400 |
| Start screening | Not in current admin UI | Allow for any child |
| Read all screenings for a child | Existing admin reporting only | Allow |
| Read screening detail | Existing admin reporting only | Allow |
| Monitor all history for a child | Existing admin reporting only | Allow |

The creator/performer remains visible as audit information but grants no special privilege.

### 3.2 Backend changes

Files to change and exact behavior:

- `backend/src/routes/pengasuh/anak.js`
  - GET: remove the `created_by`/`created_by_admin` filter; order consistently by `created_at DESC, id DESC`.
  - POST: continue setting `created_by=req.user.id`.
  - PUT: keep existence check; remove creator ownership check.
  - DELETE: keep existence and screening-count checks; remove creator ownership check.
- `backend/src/routes/pengasuh/skrining.js`
  - List by child: require only that the child exists; remove `pengasuh_id` filter so all history is returned.
  - Detail: remove the performer ownership check.
  - Submit: require only that the child exists; always store the current user in `pengasuh_id` as performer audit metadata.
- `backend/src/routes/pengasuh/monitoring.js`
  - Require only that the child exists.
  - Remove `pengasuh_id` from the screening query.
  - Include performer summary `{id, nama_lengkap}` in each history row.
- `backend/src/routes/pengasuh/dashboard.js`
  - Remove the performer filter so “recent screenings” represents global recent activity.
  - Include performer name for audit display.
- `backend/src/routes/admin/anak.js`
  - Preserve global visibility.
  - Return creator summary consistently with the caregiver endpoint.

Compatibility handling for `created_by_admin`:

- Keep the database column and response field during this implementation so old clients and tests do not break.
- Stop using it in authorization and visibility decisions.
- Continue populating it consistently on creation for compatibility.
- Mark it deprecated in OpenAPI. A later API-major migration may remove it after all clients stop reading it.

Recommended child response addition:

```json
{
  "id": 1,
  "nama": "Andi",
  "tanggal_lahir": "2016-03-15T00:00:00.000Z",
  "jenis_kelamin": "L",
  "created_by": 2,
  "created_by_admin": false,
  "created_at": "...",
  "creator": {
    "id": 2,
    "nama_lengkap": "Siti Nurhaliza",
    "role": "PENGASUH"
  }
}
```

Do not expose creator username, password hash, or tokens in child responses.

### 3.3 Tests to rewrite/add

Remove tests whose expected result encodes old ownership behavior. Replace them with:

- Two different caregivers receive the same complete child ID set.
- Both admin-created and caregiver-created children appear to every caregiver.
- A second caregiver can update a child created by the first caregiver.
- A second caregiver can delete a history-free child created by the first caregiver.
- Neither role can delete a child with screening history.
- Any caregiver can screen any child.
- A caregiver sees screenings performed by multiple caregivers for that child.
- Any caregiver can open any screening detail.
- Monitoring contains all screenings and identifies the performer.
- Dashboard shows global recent screening activity.
- Unauthenticated and wrong-role requests are still denied.

Phase 3 gate:

- The access-matrix tests pass.
- Existing web admin child creator display still works.
- Manual test with two caregiver accounts confirms identical child/history visibility.

## 10. Phase 4 — Formal OpenAPI contract and validation

### 4.1 OpenAPI tooling

Add packages compatible with Fastify 5:

- `@fastify/swagger` version line compatible with Fastify 5.
- `@fastify/swagger-ui` compatible version.
- `@fastify/cookie` for refresh-cookie support if not already added in Phase 2.

Register Swagger before all routes in `backend/src/app.js`.

Configuration:

- OpenAPI 3.x.
- API title `GrowWell API`.
- Bearer access-token security scheme.
- Cookie refresh scheme documented on auth endpoints.
- Tags: `Health`, `Auth`, `Admin`, `Pengasuh`.
- Serve JSON at `/documentation/json`.
- Serve UI at `/documentation` only when `ENABLE_API_DOCS=true` or in non-production.
- Production default for interactive documentation is off.

### 4.2 Reusable schemas

Create `backend/src/schemas/` with small modules, for example:

- `common.js`: positive ID params, pagination, localized error, health.
- `auth.js`: user, login request/response, refresh request/response.
- `anak.js`
- `skrining.js`
- `masterData.js`: skala, pertanyaan, thresholds.
- `edukasi.js`
- `psikolog.js`
- `dashboard.js`

Every route must declare:

- `operationId` that is unique and stable.
- Summary, tags, and security.
- Params, query, and body schema where applicable.
- Every expected success response.
- Expected 400, 401, 403, 404, 409, 413, 429, and 500 responses as applicable.
- Multipart content and allowed types for education upload.

Do not change a response merely to make schema writing easier. The schema must first represent current compatible behavior, then deliberate changes may be made with client updates and tests.

### 4.3 Compatible error envelope

Current clients read `response.data.error` as a string. Preserve it and add stable fields:

```json
{
  "error": "Data anak tidak ditemukan",
  "code": "CHILD_NOT_FOUND",
  "details": [],
  "request_id": "..."
}
```

Rules:

- `error` remains a localized or user-displayable string during compatibility period.
- `code` is stable, uppercase English snake case and is what clients should branch on.
- `details` contains field-validation information and defaults to an empty array.
- `request_id` correlates client reports with server logs.
- Never return raw Prisma errors or stack traces.

### 4.4 API stability and versioning decision

- Treat the current `/api` routes as API version 1.
- Do not rename every route to `/api/v1` during this project because it increases regression risk without delivering mobile value.
- Publish the generated OpenAPI document as `backend/openapi/growwell-v1.json` in CI.
- Any future breaking change must use `/api/v2` or a negotiated migration plan.
- Add `Deprecation`/description metadata for compatibility-only fields such as `token` and `created_by_admin`.

### 4.5 Contract testing

Add tests that:

- Generate OpenAPI successfully.
- Assert all registered public routes have schemas and stable `operationId`s.
- Assert required paths and response fields exist.
- Validate representative real responses against their declared schemas.
- Store a reviewed OpenAPI snapshot; require intentional review for changes.
- Optionally generate Android DTOs later, but do not make Android build depend on an unavailable network service.

Phase 4 gate:

- Every route appears in `/documentation/json` except deliberately hidden internal routes.
- No duplicate `operationId`.
- Contract tests pass.
- Current web application still works against the documented API.

## 11. Phase 5 — Canonical mobile-oriented reads and asset URLs

### 5.1 Screening-form endpoint

Add `GET /api/pengasuh/screening-form` to eliminate multiple inconsistent client calls.

Response:

```json
{
  "instrument_revision": "sha256:<hex>",
  "scales": [],
  "questions": [],
  "thresholds": [],
  "answer_options": ["tidak_benar", "agak_benar", "selalu_benar"]
}
```

Rules:

- Questions are ordered by `urutan ASC, id ASC`.
- Revision is a deterministic hash of all fields that affect scoring: question IDs/order/scale/score values plus thresholds and reversal flags.
- The endpoint requires `PENGASUH`.
- Keep existing skala, pertanyaan, and threshold endpoints for web compatibility.
- Update the web questionnaire to use this endpoint only after the endpoint tests pass.

This also fixes the current monitoring behavior that attempts to fetch `/api/admin/ambang-batas` as a caregiver and then silently falls back to mock thresholds.

### 5.2 Monitoring response

Add to the existing monitoring response without removing old fields:

```json
{
  "anak": {},
  "threshold_total": {
    "batas_normal_max": 13,
    "batas_borderline_max": 16
  },
  "riwayat": []
}
```

Web and Android charts must use `threshold_total`; neither client may hardcode the bands.

### 5.3 Stable asset URLs

For education responses:

- Preserve `url_atau_file` exactly for compatibility.
- Add `asset_url`.
- For YouTube, `asset_url` equals the validated external URL.
- For uploaded PDF/image, construct an absolute HTTPS URL using validated `PUBLIC_BASE_URL` plus the stored relative path.
- Do not derive a public origin directly from an untrusted `Host` header.
- Android uses `asset_url`; current web may continue using the relative field until migrated.

Tests:

- Development and production base URL generation.
- No double slash or missing path.
- External YouTube URL remains external.
- An untrusted Host header cannot change `asset_url`.

Phase 5 gate:

- Web questionnaire, results, and monitoring show the same values as before.
- Monitoring no longer calls an admin-only endpoint.
- Uploaded PDFs and images open through web and Android test client URLs.

## 12. Phase 6 — Screening integrity and idempotent offline submission

### 6.1 Schema additions

Create a migration adding nullable fields to `Skrining`:

- `client_submission_id String? @unique @db.VarChar(36)`
- `instrument_revision String? @db.VarChar(80)`

Keep both nullable so historic rows and current web submissions remain valid.

### 6.2 Submission contract

Enhanced request:

```json
{
  "anak_id": 1,
  "client_submission_id": "3d57f24d-0ec1-45d8-bca9-d679c7598c21",
  "instrument_revision": "sha256:<hex>",
  "jawaban": [
    { "id_pertanyaan": 1, "jawaban": "tidak_benar" }
  ]
}
```

Validation rules:

1. `anak_id` must be a positive integer and the child must exist.
2. `jawaban` must contain exactly one answer for every currently active question returned by the screening form.
3. Reject duplicate question IDs.
4. Reject unknown or missing question IDs.
5. Reject answer values outside the three documented enum values.
6. If supplied revision differs from the current revision, return `409 INSTRUMENT_REVISION_STALE`; do not save a partial screening.
7. If `client_submission_id` was already processed, return the existing complete result instead of creating a duplicate.
8. The same idempotency key with a materially different payload returns `409 IDEMPOTENCY_CONFLICT`.
9. Calculate and save screening, answers, and per-scale results in one transaction.
10. Preserve legacy web submissions without idempotency/revision only until the web has migrated; log a structured deprecation warning without logging answers.

Recommended idempotency response:

- First creation: 201.
- Replay of the same successful request: 200 with `replayed: true` and the original result.

### 6.3 Scoring regression tests

- All 25 expected answers create one screening, 25 answer rows, and one result per scale.
- Missing, duplicate, invalid, and unknown answers do not write any rows.
- Prosocial remains excluded from total difficulties.
- Reversed threshold behavior remains correct.
- Each category boundary is tested exactly below, at, and above the threshold.
- Concurrent duplicate idempotency keys create only one screening.
- Stale revision creates nothing and returns 409.

Phase 6 gate:

- Existing scoring fixtures produce exactly the same totals and categories.
- Retry after a simulated lost response does not duplicate a screening.
- Phase 0 gate passes.

## 13. Phase 7 — Create the Android project foundation

Create a new top-level `android/` Gradle project. Do not place Android source inside `frontend/`.

### 7.1 Technology choices

- Kotlin.
- Jetpack Compose with Material 3.
- Android Navigation Compose.
- ViewModel, StateFlow, and lifecycle-aware state collection.
- Retrofit and OkHttp for HTTP.
- Kotlin serialization or Moshi; choose one and use it consistently.
- Room for cache, draft, and queue.
- WorkManager for queued submission sync.
- Android Keystore-backed encryption for the Android refresh token.
- A maintained Compose-compatible chart library, or a small custom Canvas line chart if dependency review rejects available libraries.
- Coil for education images if a maintained version is selected.

Pin dependency versions in the version catalog and commit the Gradle lock/configuration. Do not use dynamic `+` versions.

### 7.2 Recommended package structure

```text
android/app/src/main/java/<package>/
  GrowWellApp.kt
  MainActivity.kt
  core/
    designsystem/
    navigation/
    network/
    database/
    security/
    model/
    util/
  data/
    auth/
    child/
    screening/
    education/
    psychologist/
    dashboard/
  feature/
    auth/
    dashboard/
    children/
    screening/
    result/
    monitoring/
    education/
    psychologist/
    settings/
  sync/
```

Each feature uses:

```text
Route composable -> stateless Screen composable -> ViewModel -> Repository -> API/Room
```

Do not call Retrofit or Room directly from a composable.

### 7.3 Build variants and secrets

- `debug` API URL points to local development.
- Optional `staging` points to staging HTTPS.
- `release` reads the production HTTPS URL from a non-secret Gradle property or CI configuration.
- Server URLs are configuration, not secrets.
- Signing credentials are never committed.
- Release manifest disallows cleartext.

### 7.4 Core state conventions

Every screen exposes a single immutable UI state containing only needed fields, for example:

```kotlin
data class ChildrenUiState(
    val loading: Boolean = false,
    val items: List<ChildUiModel> = emptyList(),
    val error: UiError? = null,
    val offline: Boolean = false
)
```

Rules:

- One-shot actions such as navigation are explicit events, not booleans that can fire twice after rotation.
- Network DTOs, Room entities, and UI models are separate types with explicit mapping functions.
- API `code` determines client behavior; localized `error` is display fallback.
- Dates use ISO-8601 at the network boundary and typed date/time objects internally.
- Never use floating point for integer screening scores.

Foundation acceptance criteria:

- Debug and release variants compile.
- Release has no cleartext permission.
- A fake repository can render every navigation destination in Compose tests.
- Rotation/process recreation does not repeat login or submission actions.

## 14. Phase 8 — Android authentication and networking

### 8.1 Network layer

Implement:

- Base URL from `BuildConfig`.
- JSON content negotiation.
- Bearer access-token interceptor.
- Authenticator/single-flight refresh behavior.
- Request ID propagation for support diagnostics.
- Timeouts appropriate for mobile networks.
- Redacted debug logging: never log auth headers, cookies, passwords, or screening answers.

Retry rules:

- GET may be retried with bounded backoff for transient connection failures.
- Do not automatically retry non-idempotent POST/PUT/DELETE.
- Screening POST may be safely retried only because it has `client_submission_id`.
- A request is refreshed and retried at most once after 401.

### 8.2 Secure session handling

- Keep access token in memory.
- Store only Android refresh token and minimal non-sensitive session metadata in Keystore-backed encrypted storage.
- On app start, attempt refresh before showing authenticated navigation.
- On refresh reuse/revocation/expiry, clear encrypted session and Room user-scoped data, then show login.
- On logout, call server revoke, then clear local credentials even if the network call fails.
- Reject `ADMIN` login in the native application with a localized message directing the user to the admin web application. Do not silently show caregiver screens to an admin.

Authentication acceptance criteria:

- Fresh login works.
- App restart restores session through refresh.
- Expired access token refreshes once without user-visible failure.
- Revoked refresh token returns to login.
- Logout prevents subsequent refresh.
- Secrets are absent from Logcat and app backups.

## 15. Phase 9 — Android caregiver feature implementation

Implement in this order. Complete unit and Compose tests for one feature before starting the next.

### 9.1 App shell and localization

- Authenticated bottom navigation or adaptive navigation for Dashboard, Screening/Children, Monitoring, Education, and Psychologist.
- Indonesian default and English toggle.
- Persist language in DataStore.
- Match `DESIGN.md` color, typography, spacing, and accessibility intent; adapt layouts to native conventions rather than copying desktop sidebar UI.
- Minimum touch target 48dp, readable contrast, content descriptions, dynamic font scaling, and TalkBack order.

### 9.2 Dashboard

- Global recent screenings from caregiver dashboard API.
- Child name, screening date, total, category, and performer when provided.
- Pull to refresh, cached state, empty state, offline badge, error/retry.

### 9.3 Children

- Global list for all caregivers.
- Search by child name locally over the loaded list; add server search later if volume requires it.
- Display name, age/date of birth, gender, creator, and latest screening summary where available.
- Add and edit forms with the same validation as API.
- Delete confirmation.
- Show the server error when history prevents deletion.
- Never filter list by current caregiver.

### 9.4 Questionnaire

- Load `screening-form` and selected child.
- Preserve question order.
- Provide exactly three localized answer choices.
- Progress indicator is answered count / total count.
- Save a local draft after each answer.
- Disable final submit until every question is answered once.
- Show a confirmation before submission.
- Generate one UUID `client_submission_id` and reuse it for every retry of that submission.
- Navigate to result only after a confirmed server response or mark it clearly queued when offline.
- Never calculate a persisted “official” result locally.

### 9.5 Result

- Show child, date, total score, total category, per-scale score/category, and localized interpretation.
- Actions: view history and screen again.
- For an offline queued screening, do not invent a result. Show pending-sync state until the backend returns the official result.

### 9.6 Monitoring

- Global screening history for the chosen child.
- Chronological line chart with total score.
- Threshold lines and legend from `threshold_total`, never constants.
- History list with date, total, category, performer, and per-scale detail.
- Make chart information available as an accessible text/table alternative.

### 9.7 Education

- Search and filters: all, PDF, image, YouTube.
- Localized title and description.
- Use `asset_url`.
- Render image preview.
- Open PDF through a safe external viewer or in-app viewer with clear failure handling.
- Open YouTube using an Android intent with browser fallback.
- Do not execute arbitrary URL schemes returned by the API.

### 9.8 Psychologist

- Localized specialization and default message.
- Normalize phone number exactly as the web/API contract defines.
- Open `https://wa.me/<number>?text=<encoded>` with WhatsApp/browser fallback.
- Encode the message once; add tests for spaces, punctuation, and Indonesian characters.

Phase 9 parity gate:

- Run the caregiver parity checklist in section 2 on both web and Android against the same staging backend.
- Values and categories for the same screening are identical.
- Two caregiver accounts see the same children and complete child history.

## 16. Phase 10 — Offline cache, draft, and sync

### 10.1 Room tables

Recommended entities:

- `CachedChild`
- `CachedScreeningForm` plus question/scale/threshold child tables
- `CachedMonitoring`
- `CachedEducation`
- `CachedPsychologist`
- `ScreeningDraft`
- `PendingScreeningSubmission`

Pending submission minimum fields:

- Local UUID / `client_submission_id`.
- Child ID.
- Instrument revision.
- Serialized validated answers.
- Created time.
- State: `PENDING`, `SYNCING`, `FAILED_RETRYABLE`, `FAILED_STALE`, `SUCCEEDED`.
- Attempt count and last non-sensitive error code.

### 10.2 Cache rules

- Show cached data immediately, then refresh when online.
- Mark cached screens as offline/stale; do not present them as freshly synchronized.
- Cache content metadata, not protected PDF/image bytes by default.
- Drafts survive process death and app restart.
- Scope or clear cache on account logout so one device user cannot see another user's cached health data.

### 10.3 WorkManager rules

- Require network connectivity.
- One unique work chain per `client_submission_id`.
- Use exponential backoff for network/5xx failures.
- Do not retry 400/401/403/404/409 automatically.
- On 401, attempt the normal single refresh once; if it fails, require login and keep the pending draft.
- On `INSTRUMENT_REVISION_STALE`, keep answers, mark `FAILED_STALE`, fetch the new form, and ask the user to review before generating a new submission ID.
- On success, store the official result, mark the queue item succeeded, remove its draft, and refresh monitoring/dashboard caches.

Offline acceptance criteria:

- Previously loaded children and content are readable in airplane mode.
- A questionnaire draft survives force-stop and restart.
- Offline submit creates one pending item and no invented score.
- Reconnection creates exactly one backend screening.
- Killing the app during sync and restarting still creates at most one screening.
- A changed instrument never submits silently with stale scoring metadata.
- Logout removes or cryptographically isolates cached health data.

## 17. Phase 11 — Web client cleanup and parity

After the backend contract is stable:

1. Update web screening to send `instrument_revision` and `client_submission_id`.
2. Update web monitoring to use `threshold_total` and remove the admin endpoint import.
3. Update education to prefer `asset_url` with compatible fallback to `url_atau_file` during rollout.
4. Use API error `code` for branching while displaying `error` as fallback.
5. Remove all runtime imports of `frontend/src/data/mockData.js` from production page/context code.
6. Keep fixture data under tests or an explicitly enabled development-only module.
7. Add visible error/retry states everywhere that previously substituted mock data.
8. Confirm PWA service worker still excludes `/api` and `/uploads` from health-data caching.

Acceptance criteria:

- Searching production frontend output finds no mock usernames, mock password, or `mock-jwt-token`.
- An API outage is shown as an outage, not sample patient data.
- Every existing admin and caregiver function in section 2 still passes manual smoke testing.

## 18. Phase 12 — CI, staging, deployment, and release

### 12.1 CI gates

Required jobs:

- Backend install, Prisma validation/generation, unit tests, integration tests, and OpenAPI snapshot.
- Frontend install, tests, lint, and build.
- Android lint, unit tests, Compose tests, debug APK build, and release compilation without signing.
- Secret scan and dependency audit with reviewed exceptions.

Do not deploy if any required job fails.

### 12.2 Safe database deployment order

1. Back up production MySQL and verify restore procedure.
2. Deploy additive nullable schema migrations first.
3. Run `prisma migrate deploy`; never use `migrate dev` or reset in production.
4. Deploy backward-compatible backend.
5. Smoke test current web.
6. Deploy migrated web.
7. Test Android against staging, then production.
8. Remove compatibility fields only in a separate future major-version project.

### 12.3 VPS environment checklist

- Strong `JWT_SECRET` or dedicated access-token signing secret.
- `PUBLIC_BASE_URL=https://<domain>`.
- `COOKIE_SECURE=true`.
- Explicit production `ALLOWED_ORIGINS` using HTTPS origin.
- `ENABLE_API_DOCS=false` unless intentionally protected/enabled.
- Access and refresh TTL variables.
- Persistent upload volume.
- TLS renewal monitoring.
- Database backup schedule.
- Logs redact credentials and health payloads.

### 12.4 Staging smoke suite

Use two caregiver accounts and one admin:

1. Admin creates a child; both caregivers see it.
2. Caregiver A creates a child; caregiver B and admin see it.
3. Caregiver B edits that child; all clients see the update.
4. Caregiver A performs a screening.
5. Caregiver B sees the screening in history, detail, monitoring, and dashboard.
6. Chart thresholds match server configuration.
7. Delete is blocked because screening history exists.
8. PDF/image/YouTube and WhatsApp actions work.
9. Access-token expiry refreshes without duplicate requests.
10. Logout revokes refresh.
11. Android offline submission synchronizes exactly once.
12. Web/API outage shows errors and never sample health records.

## 19. Required automated test matrix

| Area | Unit | API integration | Web/Compose UI | Manual staging |
| --- | --- | --- | --- | --- |
| Login/refresh/logout | Yes | Yes | Yes | Yes |
| Refresh replay/revoke | Yes | Yes | No | Yes |
| Role authorization | Yes | Yes | Yes | Yes |
| Global child visibility | No | Yes | Yes | Yes |
| Child CRUD safeguards | Yes | Yes | Yes | Yes |
| Screening validation/scoring | Yes | Yes | Yes | Yes |
| Idempotent submission | Yes | Yes/concurrent | Yes | Yes |
| Monitoring thresholds | Yes | Yes | Yes | Yes |
| Education upload/assets | Yes | Yes | Yes | Yes |
| i18n | Yes | Representative | Yes | Yes |
| Offline cache/draft/sync | Yes | Idempotency API | Yes | Yes |
| OpenAPI contract | Snapshot | Response validation | DTO parsing | No |
| HTTPS/cleartext policy | Config test | Health URL | Release manifest test | Yes |

## 20. Final definition of done

The project is complete only when all statements are true:

- Production web and Android communicate through HTTPS.
- Local browser development still works over localhost HTTP without production weakening.
- Release Android rejects cleartext.
- Access tokens are short-lived.
- Refresh tokens rotate, can be revoked, are stored hashed on the server, and are not exposed to browser JavaScript.
- Mock login and silent mock-data fallback are absent from production.
- Admin and every caregiver see the same child set.
- Caregivers see the complete screening history for every child.
- Creator and performer remain available as audit metadata only.
- Every existing web function listed in section 2 remains operational.
- Android implements every caregiver function listed in section 2.
- The backend is the only scoring authority.
- Duplicate mobile retries cannot duplicate screenings.
- Offline drafts survive restart and stale instruments cannot silently submit.
- Monitoring uses server-provided thresholds.
- Education assets have stable absolute mobile URLs while old fields remain compatible.
- Every API route has a tested OpenAPI schema and stable operation ID.
- Backend, frontend, and Android CI gates are green.
- Database backup and rollback steps have been rehearsed before production migration.

## 21. Implementation handoff format

Give a low-cost implementation model only one numbered phase at a time. Use this prompt template:

```text
Implement Phase <N> from IMPLEMENTATION_PLAN_ANDROID_NATIVE.md.
Read the full phase and every referenced file before editing.
Do not implement later phases.
Preserve all compatibility rules and locked product decisions.
Add/update the required tests, run the phase gate, inspect the diff, and report:
1. files changed,
2. migrations/config added,
3. tests run and exact results,
4. acceptance criteria satisfied,
5. any blocker or deviation.
Stop if the gate fails; do not claim completion.
```

For large phases, issue one subsection at a time—for example Phase 9.1, then 9.2—while retaining the full locked decisions as context.
