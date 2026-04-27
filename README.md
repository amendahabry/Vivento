# Vivento

Event RSVP and guest photo workflow: **Angular** frontend and **Node.js (Express)** backend with SQLite, optional AWS S3, Google Drive, email, and WhatsApp-related tooling under `backend/wppconnect`.

## Security before you push to GitHub

- **Do not commit** `backend/.env`, `backend/google-credentials.json`, or any file that contains real passwords, API keys, or private keys.
- This repository is set up so `backend/.gitignore` excludes `.env` and `google-credentials.json`. Use **`backend/.env.example`** and **`backend/google-credentials.example.json`** as templates only.
- A cleanup pass removed hardcoded secrets from the codebase (AWS keys, Gmail app passwords, service account material, Gemini API keys, weak JWT defaults, and hardcoded personal notification targets). If you ever stored real secrets in a local tree or an old commit, **rotate them** in [Google Cloud](https://console.cloud.google.com/), [AWS IAM](https://console.aws.amazon.com/iam/), and your Google Account (App Passwords), and issue a new service account key if the old JSON was exposed.

## Requirements

- **Node.js 18+** recommended (Angular CLI and some dependencies expect a current Node release).
- **npm**

## Backend API

1. Open a terminal in `backend`.
2. Copy the environment template and edit the copy:
   - **macOS / Linux:** `cp .env.example .env`
   - **Windows (PowerShell):** `Copy-Item .env.example .env`
3. Set **`JWT_SECRET`** to a long random string (the server will not start without it). For example:
   - **PowerShell:** `[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))`
   - **OpenSSL (if installed):** `openssl rand -hex 32`
4. Fill in any other variables you need from `.env.example` (S3, Google Drive folder ID, SMTP for contact emails, optional admin WhatsApp queue phone, etc.).
5. For Google Drive, copy `google-credentials.example.json` to `google-credentials.json` and replace its contents with a real **service account** JSON key from Google Cloud (keep that file out of git).
6. Install and run:

```bash
npm install
npm run dev
```

The API listens on **`http://localhost:3000`** by default (`PORT` in `.env`).

## Frontend

1. Open a terminal in `frontend`.
2. `npm install`
3. Start the dev server:

```bash
ng serve
```

4. Open **`http://localhost:4200`**.
5. Point the app at your API by editing:
   - `frontend/src/environments/environment.ts` — local development (`apiUrl`).
   - `frontend/src/environments/environment.prod.ts` — production build.

## Optional: WhatsApp example (`wppconnect`)

The bot example under `backend/wppconnect/examples/basic` loads environment variables from **`backend/.env`**. Install dependencies there, set `GOOGLE_API_KEY`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_NOTIFY_EMAIL`, and `ADMIN_WHATSAPP_JID` as needed, then follow `backend/wppconnect/examples/basic/README.md` and the main `backend/wppconnect/README.md` for build and run steps.

## Docs

End-user guides live in **`docs/`** (`how-to-use.en.md`, `.he.md`, `.ar.md`).
