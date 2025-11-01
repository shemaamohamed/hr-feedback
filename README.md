# HR Feedback System

## Project Profile

### Project name
HR Feedback System

### Some Screens
<img width="1893" height="842" alt="Screenshot 2025-11-01 215333" src="https://github.com/user-attachments/assets/70451b76-3cde-46f7-a36b-a5292681ae48" />
<img width="1899" height="855" alt="Screenshot 2025-11-01 215254" src="https://github.com/user-attachments/assets/3be09fcc-1c96-4acc-976c-986dbcfd0cd0" />
<img width="1908" height="856" alt="Screenshot 2025-11-01 215313" src="https://github.com/user-attachments/assets/f33a520f-0c9e-4873-9a8a-487416944b56" />




### Short description
A lightweight HR feedback and employee-management web application built with Next.js (App Router) and TypeScript. The system lets HR teams add/manage employees, create and manage feedback and ratings, visualize KPIs (pie charts and trends), chat with employees (with file/link previews), and export reports as PDF or Excel. Files and document previews (including PDFs) are served securely via Backblaze B2 presigned URLs.
Target users: HR administrators, managers, and employees in small-to-mid sized organizations.

### Features
- **Authentication & user management**
  - Firebase client SDK for front-end auth and firebase-admin for server-side user management.
- **Employee management**
  - Add  employees;
- **Feedback lifecycle**
  - Create, edit, delete, and view feedback entries and ratings per employee.
- **Export reports**
  - Export single feedback items or aggregated reports as PDF (jspdf + html2canvas) and Excel (xlsx).
- **KPI & charts**
  - KPI visualizations (pie charts, distributions, trend charts) using Nivo.
- **In-app chat**
  - Real-time chat between HR and employees, message history, reply previews.
- **File & image uploads, links & previews**
  - Attach files and images to messages or uploads; display link previews (title, description, thumbnail) where available.
  - Support for secure previews of PDFs and arbitrary file types via Backblaze B2 presigned URLs.
- **Admin APIs**
  - Server endpoints for get-presigned-url, upload, createuser, download-file, etc.

### Tech stack & tools
- **Frameworks / language**
  - Next.js 14 (App Router), React 18, TypeScript
- **Styling & UI**
  - Tailwind CSS, Ant Design, Radix UI, Framer Motion
- **Auth & backend**
  - Firebase (client SDK) + firebase-admin
- **File storage & media**
  - Backblaze B2 (presigned URLs; primary for PDFs/docs and secure storage)
  - Cloudinary (optional — image transforms & CDN; note: Cloudinary does not generate PDF previews)
- **Charts & visualization**
  - Nivo
- **Upload & parsing**
  - Formidable (where needed for multipart parsing)
- **Utilities**
  - clsx, mime-types, xlsx, jspdf, html2canvas
- **Dev & testing**
  - TypeScript, ESLint, Vitest, tsx

### Project structure (high level)
- `app/` — Next.js App Router pages + API routes
- `app/api/admin/` — admin endpoints (upload, get-presigned-url, createuser, download-file, etc.)
- `src/components/` — UI components (HR-specific and shared)
- `src/contexts/` — React contexts (AuthContext, ChatContext, FeedbackContext)
- `src/lib/firebase/` — firebase helper modules
  - `backblazeAuth.ts` — (example) in-memory cache for B2 authorize
- `public/` — static assets
- `serviceAccountKey.json` — firebase-admin service account (local dev only; DO NOT commit to public repos)

### Environment variables
Copy `env.example` → `.env.local`. Typical variables used:

**Firebase (client)**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_USE_TEST_FIREBASE` (optional)

**Backblaze B2**
- `B2_KEY_ID` or `NEXT_PUBLIC_B2_KEY_ID`
- `B2_APPLICATION_KEY` or `NEXT_PUBLIC_B2_APPLICATION_KEY`
- `NEXT_PUBLIC_B2_BUCKET_ID` or `B2_BUCKET_ID`
- `NEXT_PUBLIC_B2_BUCKET_NAME`
- (optional) `B2_AUTH_TTL_MS` — TTL for caching b2_authorize_account (ms)

**Cloudinary (if used)**
- `CLOUDINARY_URL` or the usual Cloudinary ENV keys

**Security note:** Do not commit production secrets or `serviceAccountKey.json`. Use platform secret stores.

### File preview capabilities (Firebase Storage vs Backblaze B2)
- **Firebase Storage**
  - Works great for images; the client SDK and storage URLs make image previewing simple.
  - For PDFs and other document types, client preview is possible if you generate signed download URLs server-side, but Firebase does not offer a dedicated, convenient presigned-document-preview flow out of the box.
- **Backblaze B2**
  - Supports presigned URLs and server-issued download authorizations for any file type (images, PDFs, docs).
  - You can generate short-lived secure links for previewing PDFs or other documents in the client — ideal when you need server-controlled, temporary access.

### Practical guidance
- Use Cloudinary or Firebase for direct image previews and transforms (fast client-side flows).
- Use Backblaze B2 for secure presigned previews of PDFs and arbitrary file types (server-controlled temporary access).
- This project uses Backblaze B2 for secure PDF/document preview and Cloudinary where image transforms/CDN are needed.

### Running the project locally
- **Clone and install:**
  - Create `.env.local` from `env.example` and fill in Firebase & Backblaze credentials.
- **Start dev server:**
  - `npm run dev`
  - Open http://localhost:3000
- **Run tests:**
  - `npm test`

### Operational notes & best practices
- **Backblaze B2 transaction caps**
  - B2 can return `{"code":"transaction_cap_exceeded", ...}` when caps are reached.
  - **Mitigations:**
    - Cache `b2_authorize_account` responses in-memory (or Redis for multi-instance) so you don't call authorize on every request.
    - Cache presigned download/upload tokens where safe (short TTL).
    - Add retry logic with exponential backoff for transient failures.
    - Implement server-side rate limiting or queueing for bulk uploads.
    - Increase transaction cap in Backblaze account as required.
- **Caching & scaling**
  - In-memory cache is fine for single-instance dev/staging. Use Redis (or another shared cache) for scaled deployments.
- **Secrets & deployment**
  - Use the host's secret manager (Vercel, Netlify Secrets, AWS Secrets Manager) instead of embedded JSON files.

### Troubleshooting tips
- **Transaction cap exceeded (B2)**
  - Symptoms: 403 with code `transaction_cap_exceeded`.
  - Fixes: raise cap, cache authorize responses, reduce request rate, add retries/backoff.
- **File upload failures**
  - Check server logs (API endpoints log B2 responses). Test the admin endpoints directly with Postman to reproduce.
- **Preview issues**
  - Confirm presigned token generation (`b2_get_download_authorization`) and token TTLs.
- **TypeScript / dev issues**
  - Ensure dev dependencies installed: `npm install`.
  - Validate with: `npx tsc --noEmit` and `npm run lint`.
  - If `npx tsc` can't be found, run `npm ci` or `npm install` to ensure TypeScript is available.

### Next steps / recommended improvements
- Use Redis for B2 auth caching for production / multi-instance deployments.
- Add robust retry strategies (exponential backoff with jitter) around network and B2 calls.
- Migrate `serviceAccountKey.json` usage to runtime environment secrets for production deployments.
- Add Vitest unit/integration tests for API routes and B2 error-handling paths.
- Add monitoring/alerts for B2 error rates and transaction usage.

### Security & advantages of Backblaze B2
- **Secure:** supports server-side authorization tokens and short-lived presigned URLs.
- **Flexible previews:** supports presigned access to any file type (including PDFs) enabling secure client-side previewing of documents.
- **Cost-effective and scalable storage** for large file workloads.
- **Complementary to Cloudinary:** use Cloudinary for image CDN/transforms, and Backblaze B2 for secure document storage and preview.
