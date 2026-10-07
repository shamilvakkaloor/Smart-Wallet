# Smart Wallet — Calm Ledger

The live app uses the Calm Ledger visual system. All financial values on production pages continue to come from the database. The preview below uses fictional fixtures, clearly isolated under `design/preview`; it never connects to MySQL.

## Design system

| Element | Treatment |
| --- | --- |
| Brand | Emerald #059669, hover/button #047857; wallet/S symbol; SW initials in the wordmark |
| Income / expense | Emerald and rose, paired with direction arrows and signed amounts |
| Receivable / payable | Blue and amber, with written labels and direction arrows |
| Light | Canvas #F6F8F7, white cards, border #E5EBE8, ink #0F172A |
| Dark | Canvas #0B1412, cards #111C19, text #E6F0EC |
| Type | Locally bundled Inter Variable, tabular numbers; 28px page title; 18px section title; 14px body |
| Amounts | OMR 3 decimals; INR 2 decimals with Indian digit grouping; independent chart scales |
| Surfaces | 20px card corners, 12px controls, restrained shadows, 44px primary touch targets |
| Entry row | Amount alone is pale yellow; Category and optional Subcategory share its row |
| Interaction | Visible focus, modal focus containment and Escape dismissal, reduced-motion rules, native decimal keyboard |

## Applied layouts

- Sidebar with line icons, active state, collapse control, theme choices, and sign-out.
- Mobile navigation: Home, Entries, Add, Wallets, More. More contains every section, Backup & Restore, Appearance, and Sign out.
- Home: grouped currency cards, real balance-formula help, currency selector, monthly activity filter, independent income/expense charts, debt position, and recent entries. Cards and charts swipe horizontally on phones. Current balances always remain labeled as current when filtering monthly activity.
- All existing screens share the new typography, surfaces, spacing, controls, tables and dark palette. Wallets and Reports have new currency/account presentations. Mobile Settings has direct section links.
- Budgets retain their existing rule model; no invented progress percentages or conversions. Existing entry pages retain their real fields and correction controls. Device decimal keyboards are used instead of a custom keypad.
- No assumed data or placeholder blocks are inserted into production screens. The provided prompt's missing details were resolved from the app's code.

## Assets and review

- `public/icons/`: vector master, 1024/512/192/180 PNGs, separate maskable 512 icon, 32 favicon, 24/48 legibility samples, horizontal wordmark, white/dark mono symbols.
- `design/screenshots/`: actual component previews at desktop 1440×900 and phone 390×844, with Home and Add Entry in both themes, every screen in light mode, and the mobile More menu. Full-page captures extend vertically beyond the viewport.
- `design/preview/brand.html`: design sheet, logo checks, phone home-screen and browser-tab mockups.

To inspect locally, run `npm run design:preview`, then open `http://127.0.0.1:4173`. The `/brand.html` page shows the identity board. `npm run design:check` captures the pages using installed Google Chrome and checks mobile navigation and horizontal overflow. These tools never deploy changes or modify production records.

The production deployment requires no new environment variables or schema changes. Existing installed PWAs may refresh their icon on the browser's own update schedule.

## Reports and debt corrections

With the preview running, `node scripts/check-reports.mjs` captures monthly, yearly, subcategory and debt-edit views on desktop/mobile and checks overflow, report headings and debt prefill. Screenshots use fictional fixture data; the preview database does not execute production query filters. Query and calculation behavior is covered separately by the report tests.

`node scripts/check-import-filters.mjs` checks checkbox filters, Reset before/after applying, and import preview on desktop/mobile. Upload responses in this isolated preview use test fixtures; import parsing and authenticated API paths are tested separately.
