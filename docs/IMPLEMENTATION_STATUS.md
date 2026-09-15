# Implementation Status

This repository is a tested, deployable Smart Wallet V1 core implementation based on the supplied Hostinger architecture.

## Implemented end to end

- Next.js responsive application and standalone production build
- Google OAuth with an exact single-email allow-list
- MySQL/Prisma schema, initial migration, and idempotent seed
- OMR/INR and extensible currency setup with one automatic cash wallet per currency
- Bank accounts and opening balances
- Income and expense with multi-account split allocations
- Same-currency transfer and cross-currency exchange
- Actual received exchange value and stored calculated value/rate
- Balance versus Actual Balance engine
- Separate Debt & Credit workflow, partial repayment, due dates, and overpayment confirmation
- People and category master data
- Budget rule storage (default and monthly override)
- Dashboard, journal, search/type filters, full entry details, and audit history
- Transaction voiding
- Basic period/category reports and CSV export
- Receipt/document attachments on normal transactions
- JSON application backup, SQL backup/restore scripts, and Data Health checks
- Light, dark, and system themes
- Calculation unit tests, TypeScript verification, and successful production build

## Production configuration required

- Google OAuth credentials and callback URLs
- Hostinger MySQL credentials
- Durable `UPLOAD_DIR` for attachments
- Hostinger cron for daily SQL backup
- SMTP credentials if email delivery is added

## Architecture hooks present but not completed in this delivery

These parts need a later implementation cycle because they require additional product rules or third-party/service configuration:

- Full financial-field transaction editing UI (current safe correction workflow is void and recreate)
- Excel and PDF exports (CSV and JSON are implemented)
- Google Sheets import/export
- Automated exchange-rate provider and full combined-currency report conversion
- Budget actual/progress notifications
- In-app/email notification scheduler and SMTP delivery
- Debt-entry attachments (normal transaction attachments are implemented)
- JSON restore through the browser (guarded SQL restore is implemented)
- Account/category/person deactivate/delete administration

The database schema already contains the stable entities needed for these extensions. No parallel financial ledger should be introduced when adding them.
