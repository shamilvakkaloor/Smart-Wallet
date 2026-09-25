# Smart Wallet — simple Hostinger setup

Sign-in now uses your own **user ID and password**. Google setup is no longer needed.

## 1. Set your login in Hostinger

Open your website's environment-variable settings and enter:

| Name | What to enter |
|---|---|
| `LOGIN_USER` | Your chosen user ID |
| `LOGIN_PASSWORD` | Your chosen password, at least 12 characters |
| `AUTH_SECRET` | A long random secret used to protect login sessions |
| `AUTH_TRUST_HOST` | `true` |
| `DATABASE_URL` | Your Hostinger MySQL connection URL |

Keep these values private in Hostinger. There is no default password. Do not add real credentials to GitHub. Old `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and `ALLOWED_EMAIL` settings can be removed.

If you need a new `AUTH_SECRET`, run this on a computer with Node.js and paste the output into Hostinger:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

## 2. Set up the wallet database once

The app still needs MySQL to store your transactions. Create a database and database user in Hostinger, then set `DATABASE_URL` using those details:

```text
mysql://USERNAME:PASSWORD@HOST:3306/DATABASE
```

Use Hostinger's actual hostname and full database/user names. URL-encode special characters in the database username/password. These database credentials are separate from your app login.

In a terminal with this project, its dependencies, and the database environment variable, run:

```sh
npm run db:deploy
npm run db:seed
```

Use Hostinger SSH/application terminal if your plan provides it. If it does not, the same commands need to run in an environment allowed to connect to your database. Connecting GitHub alone does not create the database tables.

## 3. Redeploy and sign in

Use the repository root, Next.js, Node.js 22, and the build command `npm run build`. Redeploy the latest `main` commit after saving the variables. Open your website and enter the user ID/password from step 1.

For uploaded receipts, also configure `UPLOAD_DIR` to a durable writable directory outside public web files.

## Changing or resetting your password

Change `LOGIN_PASSWORD` in Hostinger and redeploy. Existing login sessions will stop working. You can change `LOGIN_USER` the same way. There is no email reset flow or public registration.

After ten unsuccessful login attempts, wait five minutes. Attempt limits are per server process; a deployment with multiple instances should also have a shared rate limit at the proxy/service layer.

## Local development

Copy `.env.example` to `.env`, fill in the values, then run `npm ci`, `npm run db:generate`, the two database commands above, and `npm run dev`. Never commit `.env`.

## What changed

Authentication now uses an eight-hour signed/encrypted session and server-side credential validation. User ID matching is case-sensitive (outer whitespace is ignored); passwords are matched exactly. Missing login settings prevent sign-in. No database schema changes are needed for switching from Google to password login; existing wallet data is preserved. Legacy Google authentication tables can remain unused.

Original supplied architecture/setup documents are retained under `docs/` as historical references. Their Google instructions no longer apply. Other financial feature limitations remain documented in `ARCHITECTURE_REVIEW.md`.
