# Implementation Status

This repository is a tested, deployable Smart Wallet V1 core implementation based on the supplied Hostinger architecture.

## Implemented end to end

- Next.js responsive application and standalone production build
- Private user-ID/password login configured through server environment variables
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

- `LOGIN_USER`, `LOGIN_PASSWORD` (12+ characters), and `AUTH_SECRET`
- Hostinger MySQL credentials
- Durable `UPLOAD_DIR` for attachments
- Hostinger cron for daily SQL backup
- SMTP credentials if email delivery is added

## Architecture hooks present but not completed in this delivery

These parts need a later implementation cycle because they require additional product rules or third-party/service configuration:

- Debt-entry editing and corrections (income, expense, transfer, and exchange editing are implemented)
- Excel and PDF exports (CSV and JSON are implemented)
- Google Sheets import/export
- Automated exchange-rate provider and full combined-currency report conversion
- Budget actual/progress notifications
- In-app/email notification scheduler and SMTP delivery
- Debt-entry attachments (normal transaction attachments are implemented)
- JSON restore through the browser (guarded SQL restore is implemented)
- Account/person deactivate/delete administration (normal and debt category rename/delete are implemented)

The database schema already contains the stable entities needed for these extensions. No parallel financial ledger should be introduced when adding them.


## October 2026 entry and category update

- Entries can be edited from the journal or detail page. Changes preserve the original reference, attachments, and before/after audit snapshots. Concurrent stale edits are rejected.
- Delete removes an entry from balances/reports and the default journal; choose Deleted entries in the journal to review history.
- Settings supports category and debt-category renaming/deletion. Referenced categories are archived, preserving existing entry relationships. Delete active subcategories before their parent.
- Entry forms offer a parent category first and an optional dropdown of its children. Saving without a child assigns the parent category.
- One account requires one amount. For a 20 OMR entry split between accounts, enter total 20 and account amounts such as cash 12 plus bank 8. These are parts of the same 20, not additional charges.
- Starter data seeding skips an initialized database so deployments preserve renamed/deleted starter categories. No schema migration is needed for these features.
- Tests cover financial validation, entry/category service behavior with mocked database transactions, and interactive entry forms. A live MySQL integration test remains outstanding.


## Calm Ledger interface update

- Locally bundled Inter typography, shared light/dark colors, line icons, responsive cards, table styling and accessible focus states.
- Collapsible desktop sidebar and a complete mobile More menu, including theme controls, sign-out and Backup & Restore; mobile Add sheet exposes all four existing entry types.
- Dashboard currency selection, independent currency charts, balance explanations using the implemented formula, and monthly activity selection. Account balances are explicitly current, regardless of the activity month.
- Refreshed wallet cards, reports, entry forms, Settings navigation and login screen. Only the entry amount remains tinted, with category and optional subcategory alongside it.
- New vector logo and PWA icon package; Chrome-native install behavior remains intact. Generic loading/error/offline states.
- Design documentation and isolated sample-data preview in design/README.md. Browser checks cover desktop/mobile overflow, complete mobile navigation, sidebar collapse, themes and entry-field alignment. Live MySQL integration was not exercised by the visual preview.
