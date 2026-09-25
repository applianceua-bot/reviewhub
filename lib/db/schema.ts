/**
 * SQLite schema. Every statement is idempotent, so it runs on each start.
 * Kept free of imports so scripts/*.mjs can load it with plain Node.
 *
 * Mirrors the repcontrol Supabase tables where they overlap (entries,
 * mentions, brand_keywords, connections, subscriptions, expenses), with
 * brands moved into their own table so clients can be tied to them.
 */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  login         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Only a SHA-256 of the session token is stored; the token lives in the cookie.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brands (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  domain        TEXT,
  niche         TEXT,
  target_rating REAL NOT NULL DEFAULT 4.5,
  is_demo       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS client_brands (
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, brand_id)
);

-- Admin-edited overrides for the landing page's per-platform publication
-- price (lib/site.ts's basePrice is the fallback for anything not in here).
CREATE TABLE IF NOT EXISTS platform_prices (
  platform   TEXT PRIMARY KEY,
  price      REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Which platforms a brand is tracked on, and in what order the admin picked
-- (drag-to-reorder in the brands page). A brand with no rows here falls back
-- to whatever platforms already have data (see lib/data/brand-platforms.ts).
CREATE TABLE IF NOT EXISTS brand_platforms (
  brand_id   INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform   TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (brand_id, platform)
);

-- Known competitors and the email addresses they tend to post fake reviews
-- from. removal_checks.competitor_id (added below via MIGRATIONS) is a
-- manual override; without one, a row is matched to a competitor by
-- reviewer_email at read time (see lib/data/lists.ts).
CREATE TABLE IF NOT EXISTS competitors (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competitor_emails (
  competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  PRIMARY KEY (competitor_id, email)
);

-- Weekly snapshot of a brand's public profile on one platform.
-- review_count is the cumulative total shown on the platform that week;
-- new reviews for a period are the difference between snapshots.
CREATE TABLE IF NOT EXISTS entries (
  id           INTEGER PRIMARY KEY,
  brand_id     INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,
  week_start   TEXT NOT NULL,
  rating       REAL NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (brand_id, platform, week_start)
);

-- Reviews that appeared on a brand's profiles. "suspicious" flags reviews
-- that look fake or spammy (e.g. advertising another resource) so their
-- removal can be tracked in removal_checks.
CREATE TABLE IF NOT EXISTS reviews (
  id                INTEGER PRIMARY KEY,
  brand_id          INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  author            TEXT,
  rating            INTEGER CHECK (rating BETWEEN 1 AND 5),
  text              TEXT,
  url               TEXT,
  published_at      TEXT NOT NULL,
  sentiment         TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  suspicious        INTEGER NOT NULL DEFAULT 0,
  suspicion_reason  TEXT,
  reply_status      TEXT NOT NULL DEFAULT 'none' CHECK (reply_status IN ('none', 'draft', 'approved', 'published')),
  reply_text        TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- "Проверка на удаление": reviews being watched to see whether the platform
-- removed them. review_type says whether a real customer wrote it or it is a
-- fake the brand is fighting; link_status is the result of the last check.
DROP TABLE IF EXISTS complaints;
CREATE TABLE IF NOT EXISTS removal_checks (
  id           INTEGER PRIMARY KEY,
  brand_id     INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  date         TEXT NOT NULL,
  link         TEXT NOT NULL UNIQUE,
  platform     TEXT NOT NULL,
  process_raw  TEXT,
  review_type  TEXT NOT NULL DEFAULT 'unknown' CHECK (review_type IN ('real', 'fake', 'unknown')),
  link_status  TEXT NOT NULL DEFAULT 'unknown' CHECK (link_status IN ('live', 'removed', 'unknown')),
  last_checked TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brand_keywords (
  id       INTEGER PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  keyword  TEXT NOT NULL,
  active   INTEGER NOT NULL DEFAULT 1,
  UNIQUE (brand_id, keyword)
);

CREATE TABLE IF NOT EXISTS mentions (
  id              INTEGER PRIMARY KEY,
  brand_id        INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  url             TEXT,
  title           TEXT NOT NULL,
  date            TEXT NOT NULL,
  sentiment       TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  status          TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('needs_response', 'responded', 'monitoring', 'resolved')),
  matched_keyword TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- api_key is admin-only and is never sent to the browser.
CREATE TABLE IF NOT EXISTS connections (
  id          INTEGER PRIMARY KEY,
  brand_id    INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  connected   INTEGER NOT NULL DEFAULT 0,
  business_id TEXT,
  api_key     TEXT,
  last_sync   TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (brand_id, platform)
);

-- Invitation campaigns: real customers asked to leave a review.
CREATE TABLE IF NOT EXISTS campaigns (
  id               INTEGER PRIMARY KEY,
  brand_id         INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  name             TEXT NOT NULL,
  start_date       TEXT NOT NULL,
  invites_sent     INTEGER NOT NULL DEFAULT 0,
  reviews_received INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned', 'active', 'finished')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Work plan: what the team does for a brand and when.
CREATE TABLE IF NOT EXISTS tasks (
  id         INTEGER PRIMARY KEY,
  brand_id   INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform   TEXT,
  kind       TEXT NOT NULL CHECK (kind IN ('invitations', 'replies', 'complaints', 'content', 'monitoring', 'other')),
  title      TEXT NOT NULL,
  due_date   TEXT,
  assignee   TEXT,
  status     TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id            INTEGER PRIMARY KEY,
  brand_id      INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  platform      TEXT,
  name          TEXT NOT NULL,
  amount        REAL NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_renewal  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY,
  date        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('subscription', 'contractor', 'other')),
  brand_id    INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount      REAL NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'USD',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS entries_brand_idx    ON entries (brand_id, week_start);
CREATE INDEX IF NOT EXISTS reviews_brand_idx    ON reviews (brand_id, published_at);
CREATE INDEX IF NOT EXISTS removal_brand_idx   ON removal_checks (brand_id, date);
CREATE INDEX IF NOT EXISTS mentions_brand_idx   ON mentions (brand_id, date);
CREATE INDEX IF NOT EXISTS tasks_brand_idx      ON tasks (brand_id, status);
CREATE INDEX IF NOT EXISTS sessions_user_idx    ON sessions (user_id);
`

/** Columns added after the first release: [table, column, definition]. Applied if missing. */
export const MIGRATIONS: [string, string, string][] = [
  // Reviewer's email as shown in the platform's business account (e.g. invited reviews on Trustpilot).
  ['removal_checks', 'reviewer_email', 'TEXT'],
  // Manual competitor tag; overrides the email-based match when set.
  ['removal_checks', 'competitor_id', 'INTEGER REFERENCES competitors(id) ON DELETE SET NULL'],
]
