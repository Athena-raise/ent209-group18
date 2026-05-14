# Email Provider Presets

Use one provider block at a time in your `.env`.

## Gmail

Recommended only for testing or small internal use.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=Health Tracker <yourname@gmail.com>
```

Notes:

- Gmail app passwords require 2-Step Verification on your Google account.
- For new projects, OAuth 2.0 is preferred over basic SMTP auth.

Official references:

- [Google app passwords](https://support.google.com/accounts/answer/2461835?hl=en)
- [Nodemailer Gmail guide](https://nodemailer.com/guides/using-gmail)

## Outlook.com / Microsoft 365

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@outlook.com
SMTP_PASS=your-password-or-app-password
SMTP_FROM=Health Tracker <yourname@outlook.com>
```

Notes:

- Microsoft documents Outlook.com SMTP settings and notes that Outlook.com prefers Modern Auth / OAuth2.
- If your account blocks basic SMTP auth, you may need an app password or a different mail provider.

Official reference:

- [Microsoft Outlook SMTP settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-for-outlook-com-d088b986-291d-42b8-9564-9c414e2aa040)

## Resend

Best option for Vercel deployments. Prefer the HTTP API over SMTP.

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=Health Tracker <no-reply@yourdomain.com>
# Optional
EMAIL_REPLY_TO=support@yourdomain.com
```

Notes:

- You need a Resend API key.
- Verify your sending domain in Resend before using your own `EMAIL_FROM`.
- This project still supports SMTP fallback, but the HTTP API is the cleaner production path on Vercel.

Official references:

- [Resend API docs](https://resend.com/docs/api-reference/emails/send-email)
- [Resend docs overview](https://resend.com/docs)

## Which one to choose

- `Resend`: best for production and easiest to debug
- `Gmail`: acceptable for quick local testing
- `Outlook`: workable, but more likely to run into auth-policy friction

## SMTP fallback

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=Health Tracker <no-reply@example.com>
```

## Project reminder

This project uses these env vars for password reset mail:

```env
APP_BASE_URL=http://localhost:5173
RESEND_API_KEY=...
EMAIL_FROM=...
# or SMTP fallback vars
```
