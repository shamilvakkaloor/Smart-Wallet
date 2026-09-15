# Smart Wallet — Hostinger Edition

Smart Wallet is a responsive, single-user, multi-currency personal finance application built with Next.js, TypeScript, Prisma, and MySQL. MySQL is the source of truth; Google OAuth restricts access to one configured email.

## Working modules

- OMR and INR, extensible currency master, and automatic cash wallet creation
- Cash and bank accounts with opening balances
- Income and expense with same-currency split allocations
- Same-currency transfers and cross-currency exchanges
- Actual exchange amount and stored rate
- Separate Debt & Credit module with people, categories, four actions, due dates, partial repayment, and overpayment confirmation
- Balance versus Actual Balance calculation
- Default and monthly budget records
- Dashboard, journal, filters, detail view, reports, CSV export, audit trail, voiding, JSON export, SQL backup/restore scripts, and Data Health checks
- Google single-account login and light/dark/system themes

Production services requiring operator configuration—Google OAuth, MySQL, SMTP, storage retention, and cron—are covered in `SETUP.md`.

## Quick start

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Read `SETUP.md` before production deployment.
