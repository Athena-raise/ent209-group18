# Backend Auth Server

This project now includes an Express auth backend in `server/` backed by Supabase.

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/health`

## Local run

1. Install dependencies.
2. Fill in Supabase and email env vars.
3. Start the backend with `npm run server`.
4. Start the frontend with `npm run dev`.

The Vite dev server proxies `/api` to `http://localhost:3000` by default.
For Vercel deployment, `api/[...path].js` exposes the same Express app as a serverless function.

## Vercel deployment

Recommended Vercel env vars:

- Required
  - `APP_BASE_URL=https://your-project.vercel.app`
  - `JWT_SECRET=<a long random secret>`
  - `SUPABASE_URL=<your Supabase project url>`
  - `SUPABASE_SERVICE_ROLE_KEY=<your service role key>`
  - `GEMINI_API_KEY=<your Gemini API key>`
- Recommended
  - `GEMINI_MODEL=gemini-2.5-flash-lite`
  - `ENABLE_EMAIL_VERIFICATION=false`
- Optional Boohee food data API
  - `BOOHEE_APP_ID=<your Boohee app id>`
  - `BOOHEE_APP_KEY=<your Boohee app key>`
  - `BOOHEE_IMAGE_BASE_URL=https://your-project.vercel.app`
  - `BOOHEE_IMAGE_STORAGE_BUCKET=boohee-food-images`
  - `BOOHEE_API_BASE_URL=https://fc.boohee.com`
  - `BOOHEE_IMAGE_API_BASE_URL=https://api.boohee.com`
- Optional MuscleWiki exercise media API
  - `MUSCLEWIKI_API_KEY=<your MuscleWiki API key>`
  - `MUSCLEWIKI_API_BASE_URL=https://api.musclewiki.com`
  - `MUSCLEWIKI_API_DISABLED=false`
- Optional email setup
  - `RESEND_API_KEY=<your Resend key>`
  - `EMAIL_FROM=Health Tracker <no-reply@yourdomain.com>`
  - `EMAIL_REPLY_TO=<support address>`
  - Or use the `SMTP_*` variables documented below

Frontend env vars on Vercel:

- `VITE_API_BASE_URL` should usually be left empty so the app uses same-origin `/api`
- `VITE_API_PROXY_TARGET` is local-dev only and is not needed on Vercel
- `VITE_USE_MOCK_EXERCISES=false` uses MuscleWiki-backed exercise results; set it to `true` only for placeholder data

Important Vercel note for food photo uploads:

- Vercel Functions have a request body size limit, so this project compresses meal photos in the browser before sending them to `/api/nutrition/analyze`
- Keep using the built-in upload flow; sending original phone photos directly to the API is not reliable on Vercel
- Boohee photo recognition accepts a public `image_url`, not raw image bytes. When Supabase server credentials are configured, the backend temporarily uploads the compressed image to a public storage bucket and removes it after recognition. Without Supabase, it exposes the image briefly at `/api/nutrition/images/:id`; set `BOOHEE_IMAGE_BASE_URL` or `APP_BASE_URL` to the deployed public origin so Boohee can read it.

## Notes

- Supabase schema is in `supabase/schema.sql`.
- Run that SQL in your Supabase SQL editor before using the app.
- If you already created the old tables, run the updated schema again so `users.email_verified_at`
  and `email_verification_codes` are added before testing registration.
- Set `JWT_SECRET` in your shell before starting the backend for a real secret.
- Leave `ENABLE_EMAIL_VERIFICATION=false` if you do not have a verified sending domain yet.
- Set `ENABLE_EMAIL_VERIFICATION=true` only after your email provider is working in production.
- Configure these env vars for password reset email:
  - `APP_BASE_URL`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY` and `EMAIL_FROM` for the preferred Vercel/Resend setup
  - Or `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` for SMTP fallback

- By default, registration does not require email verification.
- When `ENABLE_EMAIL_VERIFICATION=true`, registration also sends email verification codes through the same email provider configuration.
- Common provider presets are documented in [EMAIL_PROVIDERS.md](./EMAIL_PROVIDERS.md)
