# HAQMS Audit & Optimization Report

## 🚀 Setup & Infrastructure Decisions
* **Local Database Workaround**: The host system's primary PostgreSQL service had corrupted catalog tables (`base/5/1255` missing errors). To resolve this cleanly without admin rights, we initialized a fresh, passwordless database cluster inside the workspace (`pgdata_temp/`) on port **`5433`** using `initdb`.
* **Services**: The Node/Express API runs on port `5000` and the Next.js frontend runs on port `3000`.

---

## 🔒 1. Security Fixes

### Credential Logging
* **Issue**: The registration and login endpoints logged raw request payloads (including plain-text passwords) to the console.
* **Fix**: Redacted plain-text passwords from all terminal logs in `backend/src/routes/auth.js`.

### JWT Vulnerabilities & Expiry
* **Issue**: JWT verification in `backend/src/middleware/auth.js` bypassed expiration checks with `{ ignoreExpiration: true }`. Furthermore, the default login signed tokens with a `365d` lifespan, and the error handler leaked raw validation error stacks to the client.
* **Fix**: Removed the `ignoreExpiration` bypass, limited token lifespan to a secure `24h` window, and sanitized verbose token verification error messages.

### SQL Injection
* **Issue**: The physician lookup search in `backend/src/routes/doctors.js` concatenated raw search strings directly into a `$queryRawUnsafe` statement.
* **Fix**: Rewrote the search query to use Prisma's safe, parameterized `findMany` ORM query builder.

### Bypassed Authorization
* **Issue**: The `authorizeAdminOnlyLegacy` middleware in `backend/src/middleware/auth.js` had the actual role check commented out, allowing any user to perform admin actions (like deleting patients).
* **Fix**: Restored the active role verification check to ensure only authenticated users with the `ADMIN` role are authorized.

---

## ⚡ 2. Performance & Concurrency Optimizations

### N+1 Queries
* **Issue**: Listing appointments triggered separate sequential select queries for the patient and doctor details in a loop for every row.
* **Fix**: Refactored the query in `backend/src/routes/appointments.js` using Prisma's `include` API, fetching all relations in a single database SQL join.

### Event-Loop Blocking
* **Issue**: The doctor dashboard stats endpoint resolved independent counts and averages sequentially using `await`, blocking the event loop.
* **Fix**: Wrapped the database calls in a parallel `Promise.all` block in `backend/src/routes/doctors.js`.

### Slow Aggregation Reporting
* **Issue**: The `/doctor-stats` reporting route performed `5 * N` sequential database queries inside a loop for `N` doctors, accompanied by an artificial 80ms delay.
* **Fix**: Replaced the loop queries with parallel database aggregation (`groupBy`) queries. This reduced the database roundtrips from `1 + 5 * N` to exactly **3 queries** and eliminated the sleep delay.

### Check-in Token Race Condition
* **Issue**: Token generation fetched the daily maximum token number and incremented it before inserting, leaving a wide race condition window (augmented by a 350ms delay) that assigned identical token numbers to concurrent arrivals.
* **Fix**: Wrapped the calculation and generation in an atomic transaction inside `backend/src/routes/queue.js` using a transaction-level PostgreSQL advisory lock (`pg_advisory_xact_lock`) on the `doctorId`. This ensures concurrent check-ins for the same doctor queue sequentially without performance overhead on other queues.

---

## 💾 3. Database & Pagination Optimizations

### In-Memory Pagination
* **Issue**: The patient lookup directory fetched the entire database table in memory and performed slicing (`.slice()`) on the array.
* **Fix**: Shifted the pagination, gender filter, and search logic to the database engine using Prisma's `take`, `skip`, and `where` operators in `backend/src/routes/patients.js`.

---

## 🖥️ 4. Frontend & React Optimizations

### Memory Leak in Public Board
* **Issue**: The live polling board (`frontend/src/app/queue/page.js`) created a `setInterval` timer without returning a clearInterval cleanup callback, piling up intervals on navigation.
* **Fix**: Added a cleanup function returning `clearInterval(intervalId)` and isolated state logging to prevent stale closures.

### Dashboard Re-renders
* **Issue**: Typing in the patient lookup search field instantly updated the parent state, triggering full dashboard re-renders and API fetch requests on every keystroke.
* **Fix**: Split the input field state and debounced the API search query trigger by 300ms using a timeout inside `frontend/src/app/dashboard/page.js`.

### NULL Value Crash
* **Issue**: Patients registered with empty medical histories caused the Doctor dashboard modal to crash while attempting to read `.toUpperCase()` on a `null` field.
* **Fix**: Implemented optional chaining (`?.`) and fallback text to handle blank histories. Imported the missing Next.js `Link` component.

---

## 🏗️ 5. Missing Feature Implementation
* **Diagnostic Records Page**: Designed and implemented the missing archived reports view at `frontend/src/app/patients/[id]/history-records/page.js`. The page renders a modern, glassmorphic layout detailing laboratory panels, radiology findings, and cardiac reports securely mapped from the database patient ID.

---

## ⚠️ Remaining Known Issues
* **CORS Policy**: The backend currently uses `cors()` with default settings, exposing all endpoints to public origins. This should be narrowed down to the client domain in production.
* **Sensitive Session Storage**: Next.js client stores the JWT in `localStorage` directly. A more secure method (e.g. `httpOnly` secure cookies) is recommended for production.
