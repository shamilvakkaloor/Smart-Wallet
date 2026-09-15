# Smart Wallet — Architecture and Code Evaluation

Reviewed: 15 September 2026.

## Conclusion

The archive is a useful V1 foundation, but it does **not** yet meet the architecture's V1 acceptance criteria and should not be treated as production-ready. The core entities and transaction structure broadly match the design. Authentication wiring, financial safeguards, and recovery need correction before real data is entered; several required workflows remain unimplemented.

The application was extracted directly into `D:\CODING\Codex\Smart Wallet`, without the archive's extra `smart-wallet` wrapper. The three supplied documents are preserved in `docs/`. Application source and the original implementation-status claims have been preserved so this evaluation can be compared with the original delivery. Document setup/deployment instructions were treated as reference material, not authorization to deploy or operate a database.

## Priority findings

### 1. High — OAuth adapter targets the wallet model

Evidence: `lib/auth.ts:8`, `prisma/schema.prisma:73`, `prisma/schema.prisma:128`.

`PrismaAdapter(db)` expects the Prisma `account` delegate to represent an OAuth account, with `provider_providerAccountId` and a `user` relation. Here those fields belong to `AuthAccount` (`db.authAccount`), while `db.account` represents a financial wallet. The adapter therefore queries the wrong model during Google sign-in. A successful TypeScript build would not establish that login works.

The installed `@auth/prisma-adapter` version 2.11.3 confirms this delegate contract in `node_modules/@auth/prisma-adapter/index.js:8–20`; see also the [official adapter source](https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-prisma/src/index.ts). This is a source-level integration finding; an actual OAuth callback was not executed.

Fix: rename the wallet Prisma model while preserving its database table mapping, or explicitly implement the adapter's OAuth-account methods using `db.authAccount`. Test first login and subsequent login with a real test database and permitted Google account.

### 2. High — Negative balances save without confirmation

Evidence: `validation/finance.ts:15,28,40`, `services/transaction-service.ts`, `services/debt-service.ts`, `components/entry-form.tsx`.

`confirmNegative` exists in three schemas but is never checked by the services. Neither normal entry UI nor debt UI implements the required negative-balance warning. An expense, transfer, exchange, lending, or repayment can overdraw an account immediately. This violates architecture section 32.

Fix: calculate affected account balances on the server before saving, require a confirmation retry when necessary, and protect the check/write sequence against concurrent requests. Apply the policy to corrections and voids as well.

### 3. High — Overpayment retry and accounting are incomplete

Evidence: `components/debt-form.tsx:8`, `services/debt-service.ts:13–16`, `services/balance-service.ts`.

The UI awaits the server response and then recursively reuses the React event to construct another `FormData(e.currentTarget)`. The event's `currentTarget` is only valid during event dispatch; capture the form or payload before awaiting and resend that payload instead. This is a source-level failure path, not a browser-tested result.

Even a direct API request with `confirmOverpayment: true` simply records the full repayment. Lending 100 and recording 120 returned produces receivable −20; it does not ask how to classify the excess as required by section 23. Two concurrent repayments can also both pass the outstanding-balance read because there is no explicit serialization/locking strategy.

Fix: provide an explicit excess-handling choice, record its financial effect transparently, and serialize repayment checks for each person/currency/direction.

### 4. High — Amount validation does not guarantee exact stored allocations

Evidence: `validation/finance.ts:3,17–18`, `prisma/schema.prisma` Decimal fields, `services/calculation.ts`.

All positive finite JavaScript numbers are accepted, without currency precision or database magnitude limits. Allocation comparison permits differences up to 0.0001. For example, total 0.0001 with two allocations of 0.00005 passes validation; rounding each allocation to four decimal places yields a combined 0.0002. Extremely small positive values can become zero at storage precision. Calculations also convert database decimals back to binary floating-point numbers.

Fix: validate supported currency precision and amount limits, use decimal arithmetic or integer minor units, and compare exact values at the precision actually stored.

### 5. Medium — Record eligibility and master-data validation are inconsistent

Evidence: `services/transaction-service.ts:35–39`, `services/debt-service.ts:9–10`, `app/actions.ts:12–60`.

Transfers check active accounts, but exchanges and debt entries do not. Normal entries check category type but not category status. Master-data server actions largely cast raw form values: currency precision, exchange-rate positivity/pair validity, parent-category type/depth, and budget consistency are not authoritatively validated. Hidden or filtered UI options do not enforce these rules against direct requests.

Fix: use domain schemas and active-record checks consistently for every mutation. Add an allowed-session guard inside mutation entry points as defense in depth; current server actions rely on middleware rather than checking the caller themselves. No middleware-bypass exploit was established in this review.

### 6. Medium — Deactivation can change financial position

Evidence: `services/balance-service.ts:6`.

Only active accounts/currencies are included in financial position. If an account with funds is marked inactive, those funds disappear from totals, while currency debt rows can remain. Deactivation administration is not yet exposed, but this behavior must be corrected before enabling it. Financial history must remain included independently of whether an account is available for new entries.

The balance query also has no as-of date and includes all active source records, including future-dated opening balances and entries. Define and enforce the intended date cutoff for current versus historical balances.

### 7. Medium — CSV loses currency for transfers and exchanges

Evidence: `app/api/export/route.ts:10–12`.

Export gets currency only from the first allocation. Transfer/exchange entries have no allocations, so their currency cell is empty. Exchange destination value/currency is also absent. The export covers normal transactions only and does not apply the full architecture filter set.

Fix: resolve source currency from the transaction/account relationship and include both exchange legs explicitly. Add export tests for all four entry types.

### 8. Medium — Backups do not restore the whole application

Evidence: `app/api/backup/route.ts`, `scripts/backup-db.sh`, `scripts/restore-db.sh`.

JSON backup omits attachment metadata and file contents, and its independent queries are not a consistent transactional snapshot. SQL backup covers database records but not uploaded receipt files. Restoring SQL on a fresh host can leave attachment links pointing to missing files.

The restore script checks file existence and requires confirmation, then creates a safety SQL backup. It does not validate application/schema compatibility, automatically run health checks, or record a restore audit event. Scheduled execution and retention remain external manual configuration.

Fix: back up the database and upload directory together with a manifest; test recovery in a separate environment. Complete validation and post-restore checks before calling recovery functional end to end.

### 9. Medium — Local start command is incompatible with Windows

Evidence: `package.json:8`.

`next start -p ${PORT:-3000}` uses POSIX shell expansion, which Windows npm's default shell does not support. The supplied project is now in a Windows workspace. Use a portable startup command or Node launcher. Verify the chosen startup method against the configured standalone build and Hostinger process configuration.

### 10. Medium — Schema invariants are weaker than the architecture

Evidence: `prisma/schema.prisma:146,169`.

The account unique key includes the account name, so two differently named CASH accounts in one currency are allowed by the database. Current creation/seed paths aim to create only one, but the invariant is not enforced. `Transaction.currencyId` is a nullable scalar without a Currency relation/foreign key, allowing inconsistent records outside the normal service path.

Fix: enforce one cash wallet per currency and a valid transaction currency using appropriate database constraints/migrations and service checks. Preserve support for multiple bank accounts.

## Architecture coverage

“Present” means visible in source, not verified end to end against MySQL/OAuth.

| Architecture requirement | Evaluation |
|---|---|
| Next.js, TypeScript, Tailwind, MySQL/Prisma | Present; appropriate overall structure. No shadcn/ui component layer evident. |
| Single allowed Google account | Allow-list callback present; adapter mismatch blocks confidence in login. |
| Currency creation and automatic cash wallet | Present; database invariant needs strengthening. |
| Banks and opening balances | Creation present; cash opening-balance editing, audit and account history/detail page missing. |
| Four normal entry types and same-currency splits | Present; safeguards and precision incomplete. |
| Exchange stores rate, calculated and actual values | Present; balances use actual destination value. |
| Balance versus Actual Balance | Core arithmetic present; see specification ambiguity below. |
| Separate Debt & Credit and partial repayment | Present; due dates stored, but due/overdue presentation and full person detail/history missing. Recent activity is limited to 100 rows. |
| Settlement/adjustment and debt correction | Enum/schema hooks only; no complete workflow or debt void/edit route. |
| Budgets | Rule storage/listing only; no effective-rule resolution, actual spend, remaining budget, parent aggregation or progress. |
| Current/historical exchange valuation | Manual rate storage only; no combined valuation/report engine. |
| Entry detail and audit | Detail page and normal transaction create/void audit exist. No financial editing, old/new-value viewer or quick view. |
| Search/filtering | Journal has type and description/notes/reference search; limited to 200 rows without pagination. Most specified filters missing. |
| Dashboard and reports | Basic current-month dashboard and date-range report. No multi-month trend, chart drill-down, combined toggle, category chart or historical position. Debt cards are always shown. |
| Attachments | Normal-entry upload/download present; debt UI missing although API/schema include a debt target. |
| Data Health | Several relationship/allocation checks present; invalid values, attachment integrity and other specified checks missing. |
| Export/backup/restore | CSV and partial JSON/SQL workflows present; Excel/PDF, browser restore and complete recovery absent. |
| Notifications/preferences | Schema hooks; no scheduler/delivery workflow. |
| Themes/responsive/English | Source supports these; device/browser validation not performed. |
| Save confirmation/unsaved changes | Form redirects after save; required follow-up choices and unsaved-change guard missing. |
| Optional Sheets integration | Not implemented; correctly not used as a live database. |

## Specification ambiguity: Balance

Section 17.1 says “Cash + Bank + Receivables” and “Payables do not reduce Balance.” Sections 17.2 and 21 say borrowing increases available funds while leaving owned Balance unchanged. If cash/bank means actual account holdings, those statements conflict.

The code and supplied setup guide implement:

`Balance = Actual Balance + Receivable − Payable`

For available funds 400, receivables 200 and payables 100, this gives the architecture's example result of 500. This is consistent with the action examples. Clarify section 17.1 to distinguish owned cash from actual holdings; do not remove the payable subtraction merely to follow that sentence literally.

## Implementation-status corrections

The supplied status file acknowledges many feature omissions, but its opening description (“tested, deployable”) is too strong for the evidence. In particular:

- Google login cannot be considered end-to-end complete with the adapter/model mismatch.
- Overpayment confirmation needs both a reliable UI retry and explicit excess treatment.
- Due-date storage is not a due-date workflow.
- Budget rule storage is not a working budget engine or monthly override resolution.
- SQL/JSON export is not proof of complete backup/recovery.
- Three arithmetic unit tests do not cover services, database persistence, authorization, UI, or deployment.

## Validation and limits

- Inspected source, Prisma schema/migration, UI/API/service code, scripts and all supplied reference documents.
- Verified **62 imported files** match the archive byte for byte before build checks.
- `npm ci --ignore-scripts`: **passed** after retrying with network access; locked dependencies installed. Initial sandbox attempts failed to access the npm registry.
- `npm test`: **3 tests passed** in `tests/calculation.test.ts`. The same assertions also passed when run directly with Node 24.
- `npm run db:generate`: **passed**, Prisma Client 6.19.3 generated after allowing its Windows engine download. This does not connect to or migrate a database.
- Ran the excess-precision example through the actual Zod schema: **accepted**, confirming the validation gap in finding 4.
- `npm run typecheck`: **passed**.
- `npm run build`: **passed**, Next.js 15.5.25 completed compilation, type validation, page generation and standalone packaging. Warnings reported `CompressionStream`/`DecompressionStream` usage through the `jose` → Auth.js dependency chain in the Edge runtime; validate authentication middleware behavior before deployment. Prisma also reported deprecation of `package.json#prisma` configuration for a future major version.
- Rechecked the archive contents after the checks: all imported application files remain unchanged. Generated dependencies/build artifacts are local verification outputs.
- No MySQL credentials, Google OAuth credentials or production host were configured. Database migrations, login, financial persistence, attachment recovery and browser responsiveness remain unverified.
- No production database, deployment, restore or notification actions were performed.

## Recommended implementation order

1. Correct OAuth adapter mapping and portable startup; prove login, migrations and seed with a test database.
2. Correct monetary precision, active-record validation, negative-balance confirmation, overpayment handling and concurrency.
3. Add integration tests for all four normal types, each debt action, rollback, voiding, splits and historical balances.
4. Complete editing/audit, opening balances, account/person history, lifecycle administration and explicit debt adjustments.
5. Implement budget calculations, combined/historical reports, filters, pagination and drill-down.
6. Complete attachment recovery, export formats, notifications and a tested restore workflow.

V2-only features such as recurring transactions, OCR, offline/PWA and family mode are not counted as V1 omissions.
