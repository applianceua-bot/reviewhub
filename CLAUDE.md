@AGENTS.md

# Project context

Landing site of the SERM agency RatingRise plus a client cabinet (`/cabinet`) and admin panel (`/admin`), branch `feature/client-cabinet`. Setup steps for a new machine are in README.md.

- Data: SQLite via `node:sqlite` (`lib/db`), queries in `lib/data`. Only these two folders should change when moving to Supabase later.
- Auth: scrypt hashes, sessions in DB, httpOnly cookie (`lib/auth`). Every page and server action re-checks the role; clients only see brands linked in `client_brands`.
- UI: SalesOps-style dark dashboard with burgundy accent, scoped under `.dash` in `app/globals.css`; font Onest (DM Sans has no Cyrillic).
- Admin sections: portfolio, clients, brands, data entry, reviews, «Проверка на удаление» (`/admin/removal`), mentions, integrations, work plan, calculator, reports, expenses.

## Decisions already made with the user

- «Проверка на удаление» is a plain removal journal (table `removal_checks`): link, platform, brand, process, type real/fake/unknown, link status, reviewer email (admin-only). CSV import drops passwords (anything after `:` in Mail) and the Posted column; they are never stored.
- The calculator counts reviews from real customers (invitations, required average, star-distribution scenario, risk scenario, quarter budget). It deliberately has no star-mix-per-batch output, per-publication pricing, contractor split or publication planner, and there is no storage of posting accounts or pre-written review texts.
- Demo data is fictional and marked «Демо».
- Commit only when the user asks.
