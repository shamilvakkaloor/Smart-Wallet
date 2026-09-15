# Smart Wallet
## V1 System Architecture & Product Specification — Hostinger Edition

**Platform:** Hostinger Node.js Web App Hosting  
**Framework:** Next.js + TypeScript  
**Database:** MySQL  
**Authentication:** Google Account Login  
**Initial currencies:** OMR + INR  
**Language:** English  
**UI:** Responsive — Mobile + Tablet + Desktop

---

# 1. Executive Summary

Smart Wallet V1 is a personal, single-user income and expense tracker rebuilt from the original Google Sheets + Google Apps Script concept into a production web application hosted on Hostinger.

The most important architectural change is:

> **MySQL becomes the authoritative database.**

Google Sheets is no longer the live source of truth. It can remain an optional import/export and spreadsheet-analysis tool.

The application is designed around four normal financial activities:

1. **Income**
2. **Expense**
3. **Transfer**
4. **Exchange**

A separate **Debt & Credit** module manages money given to and borrowed from other people.

The central financial distinction is:

> **Balance = money you own**  
> **Actual Balance = money currently available for you to transact with**

Currencies remain separate internally. Currency conversion is performed only when the application needs a combined display or report.

---

# 2. Big-Picture Architecture

```text
                        ┌──────────────────────────┐
                        │       User Browser       │
                        │ Desktop / Tablet / Mobile│
                        └────────────┬─────────────┘
                                     │ HTTPS
                                     ▼
                        ┌──────────────────────────┐
                        │        Next.js App       │
                        │ Frontend + Backend       │
                        ├──────────────────────────┤
                        │ Pages / Components       │
                        │ API / Server Actions     │
                        │ Authentication           │
                        │ Validation               │
                        │ Business Logic           │
                        │ Reporting / Calculations │
                        └────────────┬─────────────┘
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
               ▼                     ▼                     ▼
      ┌────────────────┐    ┌──────────────────┐   ┌─────────────────┐
      │ Hostinger MySQL│    │ Google Services  │   │ File / Email    │
      │ Source of Truth│    │ Optional         │   │ Services        │
      ├────────────────┤    ├──────────────────┤   ├─────────────────┤
      │ Accounts       │    │ Google OAuth     │   │ Attachments     │
      │ Transactions   │    │ Google Sheets    │   │ Backups         │
      │ Categories     │    │ Import / Export  │   │ Email alerts    │
      │ Budgets        │    └──────────────────┘   └─────────────────┘
      │ People         │
      │ Debts          │
      │ Exchange Rates │
      │ Audit Logs     │
      └────────────────┘
```

---

# 3. Architectural Principles

## 3.1 MySQL is the single source of truth

All financial records are stored in MySQL. The system must not depend on dashboard cells, cached totals, or duplicated financial ledgers. Derived values are calculated from source records.

## 3.2 No base currency

OMR and INR remain separate. Only combined views perform conversion. Combined views can display equivalent values in both currencies.

## 3.3 Preserve original currency

Transactions are always stored in their original currency.

## 3.4 Preserve financial history

Transactions are edited through version/audit history and are voided rather than destructively deleted.

## 3.5 Balance and Actual Balance are separate

These concepts must never be merged.

## 3.6 Debt & Credit is a separate UI module

Debt/Credit is not an option in the normal Income/Expense entry screen.

## 3.7 Server-side validation is authoritative

Client-side validation improves UX, but all financial rules are enforced on the server as well.

---

# 4. Technology Stack

| Layer | Technology |
|---|---|
| Hosting | Hostinger Node.js Web App Hosting |
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Database | MySQL |
| ORM | Prisma |
| Validation | Zod |
| Authentication | Google OAuth |
| Charts | React-compatible chart library |
| Source Control | GitHub |
| Deployment | Hostinger Node.js deployment |
| File Storage | Hostinger storage / configured storage |
| Email | SMTP or transactional email provider |
| Google Integration | Google OAuth + optional Sheets API |
| Currency Data | Current/historical exchange-rate service |

---

# 5. Authentication

The application is single-user.

```text
Google Account
      ↓
Google OAuth
      ↓
Next.js authentication layer
      ↓
Verify allowed Google account
      ↓
Smart Wallet
```

There is no user registration system in V1.

The application maintains a configured allowed account/email.

---

# 6. Currency Architecture

## 6.1 Initial currencies

- OMR — Omani Rial
- INR — Indian Rupee
- Additional currencies can be added later.

## 6.2 Currency setup

Each currency contains:

```text
Currency ID
Currency Code
Currency Name
Symbol
Decimal Places
Status
Created At
Updated At
```

Adding a currency automatically creates its Cash Wallet. No default bank account is created.

## 6.3 Currency status

If a currency has no historical records, it may be deleted. If it has financial history, it may only be deactivated. Historical reports remain available.

## 6.4 Decimal places

Default precision is based on the currency, but the user may customize it.

## 6.5 Currency display

The user may choose:

- Currency code
- Symbol
- Code + symbol

---

# 7. Exchange-Rate Architecture

The application distinguishes three concepts.

## 7.1 Current valuation rate

Used for current dashboard valuation and current combined values.

## 7.2 Historical rate

Used for historical reports based on the applicable historical period.

## 7.3 Actual exchange rate

A real currency exchange permanently stores the rate used at that moment.

Example:

```text
100 OMR
Rate = 247
Calculated destination = ₹24,700
Actual received = ₹24,680
```

The actual received amount is authoritative for wallet balances.

## 7.4 No exchange gain/loss in V1

V1 does not implement a formal currency gain/loss accounting system.

---

# 8. Accounts and Wallets

All places where money is held are Accounts.

Account types:

```text
CASH
BANK
```

## 8.1 Cash

There is exactly one Cash account per currency.

Examples:

```text
OMR Cash
INR Cash
```

## 8.2 Bank accounts

Every bank account has exactly one currency.

Fields:

```text
Account ID
Type
Bank Name
Account Name
Currency ID
Status
Created At
Updated At
```

## 8.3 Account status

An account with no transaction history may be deleted. An account with history can only be deactivated.

---

# 9. Opening Balances

Every account may have an opening balance.

Example:

```text
Bank Muscat
Opening Balance = 500 OMR
Opening Date = 30-Aug-2026
```

Opening balance:

- Establishes the starting position
- Is not Income
- Is not Expense
- Appears as a special account-history record

Opening balances are editable, with audit history.

---

# 10. Normal Transaction Architecture

Normal Entries contain exactly four transaction types:

```text
INCOME
EXPENSE
TRANSFER
EXCHANGE
```

Debt/Credit is outside this normal-entry system.

---

# 11. Transactions Table

Core fields:

```text
Transaction ID
Reference
Type
Transaction Date
Description
Notes
Status
Created At
Updated At
```

Status:

```text
ACTIVE
VOIDED
```

Each transaction has a technical unique ID and a short user-friendly reference.

---

# 12. Income

Income represents money earned or received as your own money.

Example:

```text
Salary
800 OMR
Bank Muscat
```

Effects:

```text
Balance ↑
Actual Balance ↑
```

Income supports category/subcategory, currency, split allocations, description, notes, multiple attachments, transaction date, and automatic creation timestamp.

---

# 13. Expense

Expense represents money spent and not expected back.

Example:

```text
Food
20 OMR
```

Effects:

```text
Balance ↓
Actual Balance ↓
```

Expense supports category/subcategory, currency, split allocations, description, notes, multiple attachments, transaction date, and automatic creation timestamp.

---

# 14. Split Income / Expense Allocations

One Income or Expense may be split across multiple accounts of the same currency.

Example:

```text
Expense = 20 OMR

OMR Cash = 12
OMR Bank = 8
```

This remains one Expense transaction.

Mandatory validation:

```text
SUM(allocation amounts) = transaction amount
```

If they do not match, the transaction cannot be saved.

---

# 15. Transfers

Transfer means moving money between your own wallets/accounts without changing the currency.

```text
One source
    ↓
One destination
```

Rules:

- Source and destination must have the same currency
- Source and destination cannot be the same account
- Transfer is not Income
- Transfer is not Expense

Transfer fees are recorded separately as normal Expenses.

---

# 16. Currency Exchange

Exchange means moving value between different currencies.

Rules:

- Source and destination must be different currencies
- Any eligible source account can exchange to any eligible destination account
- Actual destination amount is authoritative
- Rate is stored
- Calculated destination amount is retained
- Exchange itself is not Income or Expense

Exchange fees are separate Expense entries.

---

# 17. Balance Model

This is the central financial model.

## 17.1 Balance

> **Balance = Money you own**

Per currency:

```text
Cash + Bank + Receivables
```

Payables do not reduce Balance.

## 17.2 Actual Balance

> **Actual Balance = Money currently available for you to transact with**

Example:

```text
Own money in accounts = 500
Money lent out        = 200
Money borrowed        = 100

Actual Balance
= 500 - 200 + 100
= 400
```

Therefore:

```text
Balance        = 500
Actual Balance = 400
Receivable     = 200
Payable        = 100
```

## 17.3 Multi-currency

Balances are calculated independently per currency. Combined views convert only for display/reporting.

---

# 18. Debt & Credit Module

Debt & Credit is a completely separate main navigation section.

It has its own:

- People
- Debt/Credit categories
- Transactions
- Receivable balances
- Payable balances
- Due dates
- History
- Attachments

---

# 19. People

People are a master list similar to Categories.

Fields:

```text
Person ID
Name
Contact
Status
Created At
Updated At
```

A person may have both Receivable and Payable, and each direction may exist in multiple currencies.

People can be managed from Debt & Credit and Settings.

---

# 20. Debt/Credit Categories

Debt/Credit has its own customizable categories, for example:

```text
Personal Loan
Paid on Behalf
Borrowed Money
Shared Expense
Other
```

Categories can be added, renamed, reordered, and deactivated.

---

# 21. Debt/Credit Actions

## Money Given

You give/lend your own money.

```text
Account ↓
Receivable ↑
Balance unchanged
Actual Balance ↓
```

## Money Received Back

Someone returns money they owe you.

```text
Account ↑
Receivable ↓
Balance unchanged
Actual Balance ↑
```

## Money Borrowed

You receive borrowed money.

```text
Account ↑
Payable ↑
Balance unchanged
Actual Balance ↑
```

## Money Paid Back

You return borrowed money.

```text
Account ↓
Payable ↓
Balance unchanged
Actual Balance ↓
```

Every Debt/Credit action must specify the wallet/account involved.

---

# 22. Debt/Credit History

Each person has a complete chronological history. Partial repayment is supported.

---

# 23. Overpayment

If repayment exceeds the outstanding amount, the application detects the excess and asks the user how it should be handled. It must not silently reinterpret the extra amount.

---

# 24. Debt Settlement / Adjustment

A debt is never silently erased. Any settlement, forgiveness, adjustment, or correction must be represented by an explicit Debt/Credit transaction.

---

# 25. Due Dates

Money Given and Money Borrowed can optionally have a due date.

The application can show:

```text
Due in 10 days
Due today
Overdue by 5 days
```

Due dates are optional.

---

# 26. Budgets

Budgets are a separate main module.

The system supports:

- Default/repeating budgets
- Monthly overrides
- Parent-category budgets
- Optional subcategory budgets
- OMR-only budgets
- INR-only budgets
- Combined budgets

A parent budget always includes spending from all its subcategories.

---

# 27. Budget Currency

A budget may operate as:

```text
OMR only
INR only
Combined
```

Combined budgets use appropriate exchange-rate conversion.

---

# 28. Entries Page

Main transaction interface:

```text
All Transactions
Income
Expense
Transfer
Exchange
```

The user can see everything in a chronological unified journal or filter by transaction type.

---

# 29. Transaction Viewing

Two levels:

## Quick View

Compact modal containing key details.

## Full Details

Complete transaction page containing:

- All fields
- Allocation lines
- Attachments
- Notes
- Created timestamp
- Audit history
- Void history
- Related records

---

# 30. Editing

Transactions are editable. Current data shows the corrected value while audit history preserves the old version.

---

# 31. Voiding

Transactions are marked `VOIDED` rather than destructively deleted once they have financial history.

Voided transactions:

- Do not affect balances
- Do not affect normal reports
- Remain available in history/audit views

---

# 32. Negative Balances

Negative account balances are allowed, but the application must warn the user and require explicit confirmation.

---

# 33. Search and Filtering

Entries and reports support:

- Date
- Date range
- Year
- Month
- Transaction type
- Category
- Subcategory
- Currency
- Wallet
- Bank account
- Person
- Amount range
- Free-text search

Multiple filters can be combined.

Search covers Description, Notes, Category, Subcategory, Account, Person, and other relevant metadata.

---

# 34. Summary / Reports

Summary is structured as:

```text
Overview
    ↓
Analysis
    ↓
Transactions
```

## Overview

Shows:

- Income
- Expenses
- Net
- Balance
- Actual Balance
- Budget status

## Analysis

Analyze by category, subcategory, currency, account, month, date range, and other supported dimensions.

## Transactions

Every report total can drill down to the underlying transactions.

---

# 35. Currency Report Mode

Reports have a:

```text
Separate ↔ Combined
```

toggle.

Separate keeps original currency figures. Combined converts and shows equivalent values in both currencies.

---

# 36. Home Dashboard

Home is the main dashboard.

## Financial Position

```text
Balance
Actual Balance
```

Receivables and Payables are optional dashboard cards and are not forced onto Home.

## Monthly Performance

Defaults to the current month and supports another month or a custom date range.

## Charts

### Income vs Expense

Supports:

- Multi-month trend
- Selected-period comparison
- Drill-down

### Expense by Category

Supports:

- Parent Category view
- Subcategory view
- Drill-down

## Recent Transactions

Show the latest 5–10 transactions with View All.

---

# 37. Wallets & Banks Page

Single combined section grouped by currency.

Example:

```text
OMR
├── OMR Cash
├── Bank Muscat
└── NBO

INR
├── INR Cash
└── SBI
```

Each currency displays a total, and each account shows its current balance.

---

# 38. Account Details Page

Each account provides:

## Account Summary

- Current Balance
- Actual Balance
- Currency
- Opening Balance
- Opening Date
- Account information

## Activity

- Transactions
- Date filters
- Type filters
- Category filters
- Search
- Income/Expense totals

---

# 39. Debt & Credit Dashboard

The Debt & Credit page shows:

```text
Total Receivable
Total Payable
Net Position
```

Then the People list. Each person displays a compact current summary, and clicking the person opens full history.

---

# 40. Settings

Settings use a hybrid structure.

Simple preferences remain together. Complex master-data sections get dedicated pages:

```text
Currencies
Categories
People
Budgets
Exchange Rates
App Preferences
```

---

# 41. Application Navigation

```text
HOME

ENTRIES
├── All Transactions
├── Income
├── Expense
├── Transfer
└── Exchange

WALLETS & BANKS

DEBT & CREDIT

BUDGETS

SUMMARY / REPORTS

SETTINGS

DATA HEALTH

BACKUP / EXPORT
```

---

# 42. Responsive UI

The application must work equally well on desktop, tablet, and mobile.

Desktop/tablet can show direct actions:

```text
+ Income
+ Expense
↔ Transfer
⇄ Exchange
```

Mobile can use a compact `+` menu with the same actions.

---

# 43. Themes

Supported:

```text
Light
Dark
System
```

---

# 44. Language

V1 is:

> **English only**

---

# 45. Save Workflow

```text
Save
  ↓
Confirmation
  ↓
Add Another / View Entry / Go to Entries
```

Leaving with unsaved changes requires confirmation.

---

# 46. Data Model

Recommended MySQL/Prisma entities:

```text
Currency
Account
OpeningBalance

Transaction
TransactionAllocation

Transfer
Exchange

Category
Budget

Person
DebtCategory
DebtTransaction

Attachment
AuditLog

Notification
NotificationPreference

SyncLog
AppSetting
```

---

# 47. Recommended Relational Structure

```text
Currency
   │
   ├── Accounts
   │      │
   │      ├── OpeningBalances
   │      ├── TransactionAllocations
   │      ├── Transfers
   │      ├── Exchanges
   │      └── DebtTransactions
   │
   └── ExchangeRates

Transaction
   ├── TransactionAllocations
   ├── Transfer
   └── Exchange

Category
   └── Parent / Subcategory

Person
   └── DebtTransactions

DebtCategory
   └── DebtTransactions

Any record
   └── Attachments
   └── AuditLog
```

---

# 48. Recommended Core Tables

## `currencies`

```text
id
code
name
symbol
decimal_places
status
created_at
updated_at
```

## `accounts`

```text
id
type
currency_id
bank_name
account_name
status
created_at
updated_at
```

## `opening_balances`

```text
id
account_id
amount
opening_date
created_at
updated_at
```

## `transactions`

```text
id
reference
type
transaction_date
description
notes
status
created_at
updated_at
```

## `transaction_allocations`

```text
id
transaction_id
account_id
amount
```

## `transfers`

```text
id
transaction_id
source_account_id
destination_account_id
amount
```

## `exchanges`

```text
id
transaction_id
source_account_id
destination_account_id
source_amount
exchange_rate
calculated_destination_amount
actual_destination_amount
created_at
```

## `categories`

```text
id
type
parent_id
name
sort_order
status
created_at
updated_at
```

## `budgets`

```text
id
category_id
subcategory_id
currency_mode
amount
effective_month
is_default
status
created_at
updated_at
```

## `people`

```text
id
name
contact
status
created_at
updated_at
```

## `debt_categories`

```text
id
name
status
created_at
updated_at
```

## `debt_transactions`

```text
id
person_id
category_id
action
currency_id
account_id
amount
transaction_date
due_date
description
notes
status
created_at
updated_at
```

## `attachments`

```text
id
record_type
record_id
file_name
storage_path
mime_type
file_size
uploaded_at
```

## `audit_logs`

```text
id
record_type
record_id
action
before_data
after_data
changed_at
changed_by
```

## `notifications`

```text
id
type
related_id
status
scheduled_at
sent_at
created_at
```

## `notification_preferences`

```text
id
notification_type
enabled
threshold
timing
in_app_enabled
email_enabled
```

## `sync_logs`

```text
id
source
timestamp
result
issues_found
```

## `app_settings`

```text
key
value
updated_at
```

---

# 49. Backend Service Architecture

Recommended service boundaries:

```text
TransactionService
ExpenseService
IncomeService

TransferService
ExchangeService

DebtService
BudgetService

BalanceService
ReportService

CurrencyService
ExchangeRateService

AttachmentService
AuditService

NotificationService
BackupService

HealthService
ExportService
ImportService
```

---

# 50. Backend Layers

```text
Presentation
     ↓
API / Server Actions
     ↓
Domain Services
     ↓
Validation
     ↓
Data Access Layer
     ↓
MySQL
```

The domain layer owns all financial rules.

---

# 51. Financial Calculation Engine

The calculation engine must be able to regenerate derived values from source records.

It calculates:

```text
Account Balance
Account Actual Balance

Currency Balance
Currency Actual Balance

Receivable
Payable

Budget Actual
Budget Remaining

Report Totals
Chart Data
```

Never treat cached dashboard numbers as authoritative.

---

# 52. Database Transactions and Concurrency

Financial operations should use database transactions.

For example, an Exchange must atomically create:

```text
Exchange record
Source-side effect
Destination-side effect
Audit record
```

If a critical step fails, the complete operation should roll back.

The same principle applies to split expenses, split income, transfers, and debt repayments.

---

# 53. Audit System

Audit events include:

```text
CREATE
UPDATE
VOID
RESTORE
ADJUST
```

The audit log preserves record type, record ID, previous state, new state, timestamp, and user identity.

---

# 54. Data Health

The application validates structural consistency.

Examples:

```text
Allocation total != transaction total
Transfer currencies don't match
Exchange currencies aren't different
Exchange source/destination invalid
Broken debt relation
Missing currency
Missing account
Invalid amount
Missing attachment reference
```

Safe issues may be repaired automatically. Unsafe issues are flagged.

Home can show:

```text
⚠ 2 data issues need attention
```

The Data Health page provides details.

---

# 55. Google Sheets Role After Migration

Because MySQL is authoritative:

```text
MySQL
   ↓
Application
```

Google Sheets becomes optional:

```text
Google Sheets
      ↕
Import / Export
```

V1 should avoid two-way live synchronization between MySQL and Google Sheets.

Google Sheets may be used for:

- Importing historical data
- Exporting transactions
- Spreadsheet analysis
- Manual archival

---

# 56. Export System

Filtered reports/transactions can be exported as:

```text
Excel
CSV
PDF
```

The user chooses dataset, date range, filters, and currency mode.

A full-data export can include accounts, transactions, categories, budgets, people, Debt/Credit, exchange rates, and audit records.

---

# 57. Backup Architecture

Two layers are recommended.

## 57.1 Hostinger backup

Use Hostinger's backup facilities according to the selected hosting plan.

## 57.2 Application-level backup

The application should additionally create database backup/export files.

Recommended behavior:

```text
Daily backup
+
Configurable retention
+
Manual Backup Now
```

---

# 58. Restore

Restore should be possible from the application and manually from stored backup files.

Before restoring:

1. Validate the backup
2. Create a safety backup of the current state
3. Require explicit confirmation
4. Restore
5. Run Data Health checks
6. Log the restoration

---

# 59. Notifications

General notification system supports:

- Debt due soon
- Debt overdue
- Budget nearing limit
- Budget exceeded
- Backup completed
- Data inconsistency
- Important system errors

Delivery:

```text
In-app
Email
```

Each notification type can be enabled/disabled individually, with configurable timing/thresholds.

Email defaults to the authenticated Google account but may use another configured email address.

---

# 60. File Attachments

Transactions and Debt/Credit records may have multiple attachments.

Examples:

- Receipt
- Invoice
- Screenshot
- Supporting document

Store file metadata/reference rather than large binary content in MySQL.

---

# 61. Deployment Architecture

Recommended workflow:

```text
Developer PC
     ↓
GitHub
     ↓
Hostinger Node.js Application
     ↓
Production
```

Recommended project structure:

```text
smart-wallet/
├── app/
├── components/
├── lib/
├── server/
├── services/
├── db/
├── prisma/
├── types/
├── validation/
├── public/
├── tests/
├── package.json
└── .env.example
```

---

# 62. Environment Variables

Sensitive values must not be hardcoded.

Example:

```env
DATABASE_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ALLOWED_EMAIL=...
APP_URL=...

EMAIL_HOST=...
EMAIL_USER=...
EMAIL_PASSWORD=...
```

Production secrets should be configured in Hostinger's environment settings.

---

# 63. V1 Functional Scope

### Account and Access
- Single user
- Google Account login
- Responsive UI
- English
- Light/Dark/System theme

### Currencies
- OMR
- INR
- Additional currencies later
- No base currency
- Current/historical exchange-rate concepts
- Configurable decimal places/display

### Accounts
- One Cash wallet per currency
- Multiple bank accounts
- One currency per bank account
- Opening balances
- Account activation/deactivation

### Entries
- Income
- Expense
- Transfer
- Exchange
- Split allocations
- Description
- Notes
- Attachments
- Search
- Filters
- Edit
- Void
- Audit history

### Debt & Credit
- People
- Categories
- Money Given
- Money Received Back
- Money Borrowed
- Money Paid Back
- Multiple currencies
- Partial repayment
- Overpayment handling
- Due dates
- History
- Attachments

### Budgets
- Default budgets
- Monthly overrides
- Parent budgets
- Optional subcategory budgets
- OMR-only
- INR-only
- Combined mode
- Budget vs Actual

### Reports
- Overview
- Analysis
- Transactions
- Separate/Combined currency mode
- Interactive charts
- Drill-down

### Dashboard
- Balance
- Actual Balance
- Current period
- Custom period
- Income vs Expense
- Expense by Category
- Recent Transactions
- Optional debt/credit cards

### System
- Data Health
- Backups
- Restore
- Notifications
- Email
- Excel/CSV/PDF exports
- Google Sheets import/export

---

# 64. V1 Acceptance Criteria

V1 is complete when:

- Google authentication works for the authorized account.
- OMR and INR accounts can be created and managed.
- Cash wallet is automatically created per currency.
- Bank accounts are one-currency accounts.
- Opening balances work correctly.
- Income changes Balance and Actual Balance correctly.
- Expense changes Balance and Actual Balance correctly.
- Split income/expense allocations reconcile exactly.
- Transfers move money between same-currency accounts without changing net ownership.
- Exchanges move value between different currencies and preserve actual received amounts.
- Exchange fees and transfer fees can be recorded as separate Expenses.
- Balance and Actual Balance remain correct per currency.
- Receivables and payables work by person and currency.
- Debt repayments update outstanding amounts correctly.
- Budgets calculate correctly by selected currency mode.
- Monthly overrides work.
- Historical exchange-rate reporting works.
- Current valuation uses current exchange rates.
- Transaction editing creates audit history.
- Voiding removes the transaction from active calculations without destroying history.
- Negative balances require explicit confirmation.
- Charts drill into underlying transactions.
- Reports support multiple filters.
- Data Health identifies inconsistencies.
- Backups and restore workflows are functional.
- Export to Excel, CSV, and PDF works.
- Application is responsive on desktop, tablet, and mobile.

---

# 65. Recommended Development Order

## Phase 1 — Foundation

```text
Next.js
Authentication
MySQL
Prisma
Database schema
Environment configuration
```

## Phase 2 — Accounts and Currencies

```text
Currencies
Cash wallets
Bank accounts
Opening balances
```

## Phase 3 — Core Transactions

```text
Income
Expense
Split allocations
Transfers
```

## Phase 4 — Exchange

```text
Exchange accounts
Rate logic
Historical rates
Actual received amount
```

## Phase 5 — Balance Engine

```text
Balance
Actual Balance
Per-currency calculations
```

## Phase 6 — Debt & Credit

```text
People
Debt categories
Four actions
Repayments
Due dates
History
```

## Phase 7 — Budgets

```text
Defaults
Monthly overrides
Subcategory budgets
Currency modes
```

## Phase 8 — Reports & Dashboard

```text
Overview
Analysis
Transactions
Charts
Drill-down
```

## Phase 9 — System Features

```text
Audit
Data Health
Attachments
Notifications
Export
Backup
Restore
```

## Phase 10 — Hardening

```text
Validation
Security review
Performance
Mobile testing
Failure/recovery testing
Production deployment
```

---

# 66. Important Design Decisions Carried Forward

The following business rules remain unchanged:

- Single-user application
- Google Account login
- OMR + INR initially
- Additional currencies later
- No base currency
- Combined values shown in both currencies
- One cash wallet per currency
- One currency per bank account
- Any same-currency account-to-account transfer
- Any different-currency account-to-account exchange
- Rate-based exchange plus editable actual destination amount
- Separate fee Expenses
- Split Income/Expense transactions
- Parent + optional subcategories
- Flexible budgets with monthly overrides
- Separate Debt & Credit module
- People master list
- Receivable/payable tracked separately
- Currency-specific debt balances
- Partial repayments
- Due dates
- Balance vs Actual Balance
- Audit history
- Void instead of destructive deletion
- Interactive reports and charts
- Responsive interface
- Light/Dark/System theme
- English V1

---

# 67. V2 Optional Features / Future Backlog

The following features are intentionally outside V1.

## Recurring Transactions

Useful for salary, rent, subscriptions, and repeat bills.

## Advanced Budget Carry-Forward

Allow unused budget to roll into future periods.

## Envelope Budgeting

Allocate money into envelopes/categories across periods.

## Exchange Gain/Loss Tracking

Formal tracking of valuation gains/losses caused by exchange-rate movements.

## Receipt / Document Intelligence

OCR, receipt recognition, document previews, receipt indexing, and improved metadata.

## Advanced Notifications

More event types, notification digests, escalation rules, and richer reminder sequences.

## External Exchange-Rate API

Use an external currency provider as a fallback or replacement when appropriate.

## Expanded Currency Support

Support more currencies and provider-specific conversion rules.

## Advanced Analytics

Savings trends, cash-flow forecasting, financial health metrics, and predictive spending analysis.

## Advanced Chart Customization

Configurable chart types, layouts, dashboard cards, and visualization preferences.

## Advanced Debt Automation

Scheduled reminder sequences, escalation, and richer overdue workflows.

## Advanced Debt Settlement

Netting, restructuring, complex settlement models, and sophisticated adjustments.

## Spreadsheet Administration Console

A dedicated safe interface for inspecting and repairing database/import issues.

## Advanced Audit and Versioning

Field-level change history, version comparison, and individual record restore.

## Offline / PWA

Offline transaction entry, local temporary storage, and sync when connectivity returns.

## Additional Languages

Arabic, Malayalam, and a full localization framework.

## Advanced Search / Saved Filters

Saved report presets, smart searches, and reusable filter views.

## Multiple User / Family Mode

Only if the product later evolves beyond the personal single-user model.

## Account Statement Imports

Bank CSV imports, financial statement mapping, duplicate detection, and automated transaction categorization.

---

# 68. V2 Design Constraint

V2 should extend the V1 domain model rather than create parallel financial systems.

Stable foundations:

```text
Currencies
Accounts
Transactions
TransactionAllocations
Transfers
Exchanges
Categories
Budgets
People
DebtCategories
DebtTransactions
Attachments
AuditLogs
Notifications
```

Future features should build on these entities.

---

# 69. Final Architecture Statement

> **Smart Wallet V1 is a single-user full-stack Next.js application hosted on Hostinger, using Hostinger MySQL as the authoritative financial database, Google OAuth for secure access, Prisma and server-side business services for financial logic, responsive React/Tailwind UI for the frontend, and optional Google Sheets integration for import/export rather than live database synchronization.**

The core model is:

```text
                SMART WALLET
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
     Entries     Debt & Credit  Budgets
        │            │            │
  ┌─────┼─────┐      │            │
  ▼     ▼     ▼      ▼            ▼
Income Expense Transfer/Exchange People/Currencies
        │            │
        └──────┬─────┘
               ▼
         Balance Engine
               │
       ┌───────┴────────┐
       ▼                ▼
   Balance        Actual Balance
   Owned Money    Usable Money
```

This is the recommended V1 architecture for moving Smart Wallet from **Google Sheets + Apps Script** to a **Hostinger-hosted web application**.
