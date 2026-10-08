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

## Debt editing and summary reports

- Debt & Credit activity now has Edit links. Corrections preserve reference and attachments, record before/after audit snapshots, reject stale edits and validate currency/account relationships. Reducing or moving a loan checks affected repayments; worsening an overpaid position requires confirmation.
- Reports offers Monthly (Cash / Bank / Total), Yearly (January–December), Custom date range and Complete (all-time) views. Choose category roll-up or separate subcategory rows; direct parent entries remain separately identifiable in subcategory mode.
- Filters cover year/month/dates, currency, account/type, income/expense, parent/subcategory (including parent only), description/notes/reference, amount range and zero categories. Currencies remain separate. Split-account filters include only matching allocations; amount bounds apply to the original whole entry.
- Summary CSV and Entries CSV use the same filters. All matching entries contribute to totals/exports; the expandable entry list shows 50 per page. Reports exclude transfers, currency exchange, debt movements and account opening balances; report net is income minus expense, not a wallet balance.
- No schema migration or new environment variables. 69 automated tests pass, including financial aggregates, date boundaries, CSV safety, protected endpoints and debt correction confirmation. Desktop/mobile preview checks use fictional data; live Hostinger/MySQL integration is not verified locally.

## Void debt entries

- Debt edit screens include a confirmed Void debt entry action. It marks the record VOIDED, preserves the original data and before/after audit history, and removes the entry from active activity and balance calculations. No physical deletion or database migration.
- Version checks prevent stale or concurrent requests from voiding newer corrections. Voiding a loan that leaves excess repayments requires additional confirmation.

## Excel imports, checkbox filters and empty states

- Entries provides Download Excel and Import Excel. Templates include active accounts (with currency/type), entry types, type-dependent parent categories and parent-dependent subcategories. Fill up to 200 transactions per .xlsx file (2 MB maximum). Optional second-account splits, transfers and currency exchanges are supported. Debt entries remain in Debt & Credit.
- Uploads have a read-only preview, row-specific errors and an explicit confirmation. The complete batch is saved in one serializable database transaction using normal entry validation, allocations and audit logging. Stable template Import IDs prevent retries from duplicating entries, including edited/voided imports. IDs do not detect manually entered duplicates or transactions copied into a different fresh template: omit those rows. Existing entries are never overwritten by imports.
- Preview confirmation is signed with the existing AUTH_SECRET, expires after 15 minutes and is bound to the parsed file. Upload size and decompressed ZIP size are bounded. Formula/error/link cells are rejected. No database migration is needed.
- Report dropdowns support multiple currencies, account types, accounts, income/expense types, parents and subcategories. Entry journal type/status filters also support multiple selections. Selections use OR within each dropdown and AND between dropdowns, persist in pagination/CSV exports, and count only matching split allocations.
- Reset filters now navigates to a fresh unfiltered page, clearing both unsaved and applied selections. Category/currency changes clear dependent choices.
- Dashboard, Reports and Debt & Credit show descriptive zero-value messages. Reports use None for zero table amounts; downloads keep numeric zeros for calculations. Negative balances remain visible.
- Validation: 90 automated tests, desktop/mobile browser checks for checkbox selection, reset before/after Apply, filtered export links and import preview. XLSX save/reopen checks cover named ranges, dropdown rules, Excel dates, splits, transfers, exchanges and validation failures. A native Excel interaction check and live Hostinger/MySQL import remain unverified locally.

## Entry deletion and recovery

- Bulk selection and Delete selected were removed from Entries to reduce accidental deletion. The old bulk endpoint returns 410, including for stale browser sessions.
- Entries > Deleted entries > Review & restore opens the original record. Restore entry requires confirmation and restores its effect on balances and reports, preserving reference, allocations, attachments and history.
- Restoration checks the displayed version and VOIDED status atomically and writes a RESTORE audit. No schema migration is required. No production entries were restored automatically.
- Individual deletion remains on the detail page with confirmation. Import IDs stay reserved after deletion; restoring the original avoids creating a replacement duplicate.
