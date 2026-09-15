# Smart Wallet V1 — Setup and Hostinger Deployment Guide

This guide takes the application from a fresh download to a production deployment. Smart Wallet uses one Next.js process for the user interface and backend, Prisma for safe database access, MySQL as the authoritative data store, and Google OAuth for private single-user access.

## 1. Prerequisites

- A Hostinger plan that supports **Node.js applications**, not PHP-only shared hosting
- Node.js 20 or newer (Node.js 22 LTS is recommended)
- MySQL 8 or compatible MariaDB service
- A Google account and access to Google Cloud Console
- A domain or subdomain with HTTPS
- Git and npm on your development computer

## 2. Project flow

```text
Browser → Next.js UI/API → Domain validation → Prisma → MySQL
              ↓
         Google OAuth
```

The database stores original-currency records. Dashboard and report values are recalculated from active source records; voided records remain only for audit history.

## 3. Local installation

Extract the project, open a terminal in `smart-wallet`, and run:

```bash
npm install
cp .env.example .env
```

Create an empty MySQL database using phpMyAdmin or MySQL:

```sql
CREATE DATABASE smart_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Edit `.env`:

```env
DATABASE_URL="mysql://smart_wallet_user:strong_password@127.0.0.1:3306/smart_wallet"
AUTH_SECRET="a-long-random-secret"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"
ALLOWED_EMAIL="your-google-email@gmail.com"
APP_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Never commit `.env` or paste its secrets into source files.

## 4. Google OAuth configuration

1. Open Google Cloud Console and create/select a project.
2. Open **APIs & Services → OAuth consent screen**.
3. Choose External for an ordinary Gmail account or Internal for a managed Workspace organization.
4. Enter the application name, support email, and developer email.
5. While the app is in Testing, add your `ALLOWED_EMAIL` as a test user.
6. Open **Credentials → Create credentials → OAuth client ID → Web application**.
7. Add these authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://wallet.yourdomain.com/api/auth/callback/google
```

8. Copy the client ID and secret to the matching environment variables.

Only the exact `ALLOWED_EMAIL` can sign in. Google authentication alone is not sufficient; the server performs the email allow-list check.

## 5. Create the database structure

For local development:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

The seed creates OMR, INR, their cash wallets, starter income/expense categories, debt categories, and app defaults. It is idempotent and can be safely run again.

For production, create and commit the generated `prisma/migrations` directory locally. On Hostinger run:

```bash
npm run db:deploy
npm run db:seed
```

Do not use `prisma migrate dev` against production.

## 6. Verify locally

```bash
npm run typecheck
npm test
npm run build
npm start
```

Open `http://localhost:3000`, sign in, and perform this smoke test:

1. Add one OMR bank account and one INR bank account.
2. Add opening balances.
3. Add an income split between two OMR accounts.
4. Add an OMR expense.
5. Transfer between OMR Cash and the OMR bank.
6. Exchange OMR to INR and enter the actual INR received.
7. Add a person, record Money Given, and record a partial Money Received Back.
8. Confirm Wallet totals, Dashboard Balance/Actual Balance, Reports, and Data Health.
9. Void a test transaction and confirm it stops affecting totals while remaining visible.

## 7. Deploy to Hostinger

### Option A — Git deployment

1. Push the project to a private GitHub repository.
2. In hPanel, create a Node.js application and connect the repository.
3. Select Node.js 22 if available.
4. Set the build command to:

```text
npm ci && npm run build && npm run db:deploy
```

5. Set the start command to:

```text
npm start
```

6. Add every production environment variable in hPanel. Set `APP_URL` to the final HTTPS origin.
7. Attach the domain/subdomain and enable SSL.
8. Deploy, then run `npm run db:seed` once through Hostinger SSH or the application console.

### Option B — SSH deployment

```bash
git clone YOUR_PRIVATE_REPOSITORY_URL smart-wallet
cd smart-wallet
npm ci
npm run build
npm run db:deploy
npm run db:seed
npm start
```

Use Hostinger's application process manager; do not keep production alive with an ordinary SSH terminal.

## 8. Hostinger environment variables

Required:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma MySQL connection URL |
| `AUTH_SECRET` | Encrypts/signs authentication data |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ALLOWED_EMAIL` | The one account permitted to enter |
| `APP_URL` | Final public HTTPS origin |
| `AUTH_TRUST_HOST` | Set to `true` behind Hostinger's proxy |

For SQL backup scripts also configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in the SSH/cron environment. Do not expose these as public frontend variables.

## 9. Backups

There are three complementary layers:

- Hostinger's managed database/site backup
- `/backup` → JSON application export
- `scripts/backup-db.sh` → restorable SQL backup

Manual SQL backup:

```bash
DB_HOST=... DB_NAME=... DB_USER=... DB_PASSWORD=... bash scripts/backup-db.sh
```

Schedule it from Hostinger cron, for example once daily. Store copies outside the live application directory and set a retention policy.

Restore is destructive, so the script requires an explicit flag and automatically creates a safety backup first:

```bash
CONFIRM_RESTORE=YES DB_HOST=... DB_NAME=... DB_USER=... DB_PASSWORD=... \
  bash scripts/restore-db.sh /absolute/path/smart-wallet-backup.sql.gz
```

After restore, open `/data-health` and verify all checks.

## 10. Security checklist

- Keep the GitHub repository private.
- Use a dedicated MySQL user with access only to this database.
- Use a long unique database password and `AUTH_SECRET`.
- Keep `ALLOWED_EMAIL` exact and lowercase.
- Require HTTPS; never use production OAuth over HTTP.
- Do not expose `.env`, backups, or uploaded receipts under `public/`.
- Restrict SSH and hPanel accounts with strong passwords and two-factor authentication.
- Review OAuth test/publishing status before relying on long-lived sign-in.
- Test a restore periodically; an untested backup is not a recovery plan.

## 11. Updating the application

Before every production update:

```bash
bash scripts/backup-db.sh
git pull
npm ci
npm run build
npm run db:deploy
```

Restart the Node.js application in hPanel. Prisma migrations are forward database changes; review generated SQL before production deployment.

## 12. Financial rules implemented

- Income and expense allocations must total exactly the entry amount.
- Every allocation belongs to the entry currency.
- Transfers require two different accounts with the same currency.
- Exchanges require accounts with different currencies and preserve both calculated and actual destination amounts.
- Debt actions always name a person, currency, and wallet.
- Repayment above the current outstanding amount requires explicit confirmation.
- Voiding never deletes financial history.
- `Actual Balance` is cash currently available in accounts.
- `Balance` is `Actual Balance + Receivable − Payable`, representing money owned.

## 13. Troubleshooting

### Google returns `redirect_uri_mismatch`

The URI in Google Cloud must exactly match `https://YOUR_DOMAIN/api/auth/callback/google`, including scheme, hostname, path, and absence/presence of `www`.

### Login returns Access Denied

Check `ALLOWED_EMAIL`, OAuth test users, and whether Google returned the same email address.

### Prisma cannot connect

Verify the MySQL hostname, port, database name, credentials, IP allow-list, and URL-encoding of special password characters. For example, `@` in a password becomes `%40` inside `DATABASE_URL`.

### Tables do not exist

Run `npm run db:deploy`, then `npm run db:seed`.

### Build succeeds but the site does not start

Confirm Hostinger runs `npm start`, passes its `PORT` variable, uses a supported Node.js version, and has all server environment variables.

### Dashboard numbers look wrong

Open Data Health first. Then inspect the relevant account and transaction details. Remember: borrowed money increases Actual Balance but also creates a payable, so it does not increase Balance.

## 14. Production handover checklist

- [ ] Production MySQL database and limited database user created
- [ ] Migrations deployed and seed completed
- [ ] Google OAuth production callback added
- [ ] Only the intended Google email can sign in
- [ ] HTTPS enabled
- [ ] All four normal entry types tested
- [ ] Debt partial repayment and overpayment warning tested
- [ ] Balance and Actual Balance verified manually
- [ ] CSV and JSON exports downloaded successfully
- [ ] Daily SQL backup scheduled
- [ ] Restore tested in a non-production database
- [ ] Data Health shows no errors
- [ ] Mobile and desktop layouts checked
