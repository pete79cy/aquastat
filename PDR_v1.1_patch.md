# Aquastat — PDR v1.1 Patch

**Base:** `swimming_performance_tracker_final_pdr.md` (v1.0)
**Date:** 2026-05-16
**Scope:** Strategic decisions + 8 gap fixes + GDPR + forgot password + bilingual + multi-club tenancy

This file overrides/extends v1.0. Where v1.0 conflicts with this patch, v1.1 wins.

> **Independence statement.** Aquastat is an independent product for swimming clubs and is **not** affiliated with, endorsed by, or operating under the auspices of any swimming federation (including the Cyprus Swimming Federation / ΚΟΕΚ). It is a private platform that clubs can adopt voluntarily. Any references in v1.0 to "the federation" should be read as "the platform's governing body" — i.e. the Aquastat operator. Terminology like "federation_admin" is kept only as an internal technical identifier; the user-facing label is "Platform Admin".

---

## A. Strategic Decisions (locked)

| Decision | Choice | Implication |
|---|---|---|
| Product name | **Aquastat** | Single brand across login, dashboards, emails, exports. Replace all "HydroMetric" / "Performance Hub" / "AquaTrack" references. |
| Language strategy | **Bilingual (el + en) from v1** | i18n infrastructure required in Phase 1, not Phase 2. |
| Tenancy | **Multi-club from v1** | `clubs` table + scoped RBAC. Federation-level data (seasons, standards, competitions) shared; club-level data (athletes, users, training results) isolated. |
| Relays | **Out of MVP** | `swim_events.relay` boolean remains for forward-compat; no relay_results table, no relay declaration UI. |
| Splits | **Out of MVP** | Single `result_time_ms` per result. Phase 2+ may add `result_splits` table. |

---

## B. Schema Patches (against §9)

### B.1 New: `clubs` (multi-club tenancy)

```
id              UUID PK
name            text
short_name      text          -- e.g. "ΝΟΛ", "ΟΚΟΑΛ"
federation_code text nullable -- registration code with governing body, if available
country         text default 'CY'
is_active       boolean
created_at      timestamp
```

### B.2 `users` — add club scope + roles

Add columns:
- `club_id UUID FK clubs.id nullable` — null for `federation_admin` role; required for `club_admin`, `coach`, `parent`.
- `role enum` extended: **`federation_admin, club_admin, coach, parent`** (replaces single `admin`).
- `preferred_locale enum: el, en` default `el`.

Rule: `federation_admin` is the **internal identifier** for the platform-wide operator role (display label: "Platform Admin" / "Διαχειριστής Πλατφόρμας"). `club_admin` replaces v1.0's per-club `admin`. The "Admin" role from v1.0 §4.1 splits accordingly — see §F below.

> The legacy enum name `federation_admin` is kept for backward compatibility. Aquastat is an independent product and does **not** represent any swimming federation. The role identifies the platform operator who can see across all participating clubs — nothing more.

### B.3 `athletes` — multi-club + computed category

- Add: `club_id UUID FK clubs.id NOT NULL`.
- **Remove** stored `category` from §5.1. Category is a **derived** value: function `compute_age_category(athlete.date_of_birth, season_id) -> age_category_id`. Always computed at read time; never persisted.
- Replace free-text `club` field (§9.2) with `club_id` FK.

### B.4 `seasons` — federation-wide

Seasons remain platform-level (one season covers all clubs). No `club_id`.

### B.5 `competitions` — federation-wide

No `club_id`. All clubs see the same competition calendar (per season). Internal/club-only meets, if any, can be added later via a `scope enum: federation, club` field — out of MVP.

### B.6 `qualification_standards` — federation-wide

No `club_id`. Standards come from the season proclamation and apply to all clubs on the platform.

### B.7 `competition_results` — pool_type authority

Today `competition_results.pool_type` exists (§9.9). Make it **authoritative**, not a copy of `competitions.pool_type`. Allow mixed-pool meets. PB calculation (§11.2) joins on `competition_results.pool_type`, not `competitions.pool_type`.

### B.8 `training_results` — add club scope

Add: `club_id UUID FK clubs.id NOT NULL` (denormalized from athlete for query speed and tenant isolation).

### B.9 `swim_events` — uniqueness

Add UNIQUE constraint: `(distance_m, stroke, gender, relay)`.

### B.10 `documents` — federation vs club scope

Add: `scope enum: federation, club` and `club_id UUID FK clubs.id nullable`.

- Season proclamation / standards / records → `scope = federation`, `club_id = null`.
- Internal club uploads (e.g., training plans, if added later) → `scope = club`, `club_id = X`.

### B.11 `parent_athlete_links` — implicit club inheritance

Parent's `club_id` is derived from the linked athlete(s)' club. A parent linked to athletes from multiple clubs (rare: divorced parents in different clubs) is allowed — frontend just shows children grouped by club.

### B.12 New: `consent_records` (see §C below)

### B.13 New: `password_reset_tokens` (see §D below)

### B.14 New: `i18n_strings` — optional, **not used in MVP**

Skip a DB-driven translation table. All static strings live in JSON locale files (`/locales/el.json`, `/locales/en.json`). User-generated content (athlete names, competition names) is stored as-is in whatever language it was entered. See §E.

### B.15 `age_categories` — bilingual labels

- Add: `name_el text NOT NULL`, `name_en text NOT NULL`. Drop generic `name`.
- Example seed for 2025–2026: `{name_el: 'Παμπαίδες Α´', name_en: 'Boys 12'}`.

---

## C. New Section — GDPR / Privacy (between §13 and §14)

### C.1 Legal context

Athletes are predominantly minors. Aquastat processes special-category-adjacent personal data (health-adjacent performance data, biometric-related ages). GDPR + Cyprus Law 125(I)/2018 apply. Each participating club is a joint controller with the platform operator; Aquastat itself is a processor. Aquastat is an independent product and is not affiliated with, endorsed by, or operating under the auspices of any swimming federation.

### C.2 Consent model

- A `consent_records` table:
  ```
  id              UUID PK
  athlete_id      UUID FK
  consent_type    enum: data_processing, photo_usage, performance_publishing, ai_extraction
  granted_by      UUID FK users.id        -- parent or guardian
  granted_at      timestamp
  revoked_at      timestamp nullable
  document_id     UUID FK documents.id nullable  -- scanned signed form if uploaded
  ```
- An athlete profile cannot be activated without at least `data_processing` consent.
- Photo display in UI requires `photo_usage` consent — otherwise show initials avatar (as in current Stitch mockups).

### C.3 Data subject rights

Endpoints:
- `GET  /api/me/data-export` — parent or athlete (when of age) requests JSON+PDF export of all their data.
- `POST /api/athletes/:id/erasure-request` — initiates a soft-delete; federation admin reviews within 30 days; on approval, hard-deletes results, training data, notes; retains anonymized aggregates only.

### C.4 Retention

- Active athlete data: kept while athlete is active + 2 competitive seasons after deactivation (for historical reference).
- Audit logs: 12 months.
- AI extraction raw JSON: 90 days after final approval/rejection.
- Uploaded documents: federation proclamations indefinitely; results PDFs 5 years; club internal uploads per club admin choice (default 2 seasons).

### C.5 Data minimization in UI

- Parent UI: never shows other athletes' data, even in dropdowns or aggregates.
- Coach UI: never shows non-assigned athletes' personal data.
- Admin search results redact email/phone from list views; full details only on detail pages with an audit log entry.

### C.6 Security additions to §13

11. All consent state changes audit-logged with actor + timestamp + IP.
12. Personal data fields encrypted at rest (Postgres column-level via pgcrypto): `users.email`, `athletes.registration_number`, `athletes.date_of_birth`.
13. Backups must be encrypted and stored in EU region (compliance with Cyprus DPA).

---

## D. Forgot Password — moved to MVP

Override §6.1 v1.0: forgot-password flow ships in Phase 1.

### D.1 New table: `password_reset_tokens`

```
id           UUID PK
user_id      UUID FK users.id
token_hash   text          -- store hash, never raw token
expires_at   timestamp     -- 60 min from creation
used_at      timestamp nullable
created_at   timestamp
```

### D.2 Endpoints

- `POST /api/auth/forgot-password { email }` — always responds 204 (no user-enumeration leak). Internally generates token, emails magic link.
- `POST /api/auth/reset-password { token, new_password }` — validates token, marks used, updates `password_hash`, invalidates all sessions.

### D.3 Email transport

Phase 1: transactional email via Resend or Postmark. Configurable SMTP fallback. No SMS in MVP (consistent with §3.3).

---

## E. Bilingual (i18n) Implementation

### E.1 Stack

- **Library:** `react-i18next` + `i18next-browser-languagedetector`.
- **Files:** `/locales/el.json`, `/locales/en.json`. Namespaces: `common`, `nav`, `dashboard`, `athlete`, `competition`, `ai_review`, `errors`.
- **Default locale:** `el`. Fallback: `en`.
- **Switcher:** top-right of header on every page; persisted to `users.preferred_locale`.

### E.2 What is translated vs stored as-is

| Content | Strategy |
|---|---|
| UI chrome (buttons, labels, tabs, status badges) | i18n keys |
| Enum display labels (stroke, training_type, training_context, round_type, etc.) | i18n keys, computed from enum value |
| Age categories | DB columns `name_el`, `name_en` |
| Standard types | i18n keys |
| Athlete names | stored as entered; never translated |
| Competition names | stored as entered (typically Greek); no translation |
| Club names | DB columns `name_el`, `name_en` (optional; falls back to `name` for clubs without English variants) |
| Coach notes | stored as entered |
| AI extracted JSON | preserved as-is from source document |

### E.3 Date/number formatting

- Use `Intl.DateTimeFormat` with locale.
- Time format (`1:05.23`) is **locale-independent** — always `M:SS.hh`. Do not localize swimming times.

---

## F. Multi-Club RBAC (overrides §4)

### F.1 Roles

| Role | Scope |
|---|---|
| `federation_admin` (display: Platform Admin) | Platform-wide. All clubs visible. Manages seasons, standards, platform-scoped documents, platform-wide AI review. |
| `club_admin` | Single club. Manages users/athletes/coaches/parents within their club. Uploads club-scoped documents. Reviews AI extractions for results PDFs of their club. |
| `coach` | Single club, subset of athletes. As v1.0 §4.2. |
| `parent` | Single or multiple athletes across clubs (rare). As v1.0 §4.3. |

### F.2 Tenant isolation rules (backend-enforced)

1. Every query touching `athletes`, `training_results`, `coach_notes`, `parent_athlete_links` MUST filter by `club_id IN (user's accessible clubs)` unless role is `federation_admin`.
2. Cross-club result aggregation is allowed only for `federation_admin` and is computed on federation-scoped tables (`competitions`, `competition_results`, `qualification_standards`).
3. `federation_admin` cannot directly edit a club's internal data (training_results, coach_notes, parent links) without explicit elevation logged in audit_logs.

### F.3 Acceptance criteria additions (extends §18.1)

- `GET /api/athletes` returns only athletes of the caller's club (or all clubs if federation_admin).
- A `club_admin` of Club A cannot read `athletes` of Club B even by ID — returns 404, not 403, to avoid enumeration.
- AI extraction of a results PDF uploaded by Club A's admin produces athlete matches only against Club A's athletes by default; federation admin can override.

---

## G. Remaining v1.0 gap fixes (cross-reference)

| Gap | Fix |
|---|---|
| §5.1 stored `category` | See B.3 — computed only. |
| §9.2 free-text `club` | See B.3 — replaced with `club_id` FK. |
| §11.2 PB pool_type ambiguity | See B.7 — `competition_results.pool_type` is authoritative. |
| §9.6 missing UNIQUE | See B.9. |
| Missing GDPR | See §C above. |
| Forgot password = Phase 2 | See §D — moved to Phase 1. |
| Missing i18n decision | See §E. |
| Single-club assumption | See §F + B.1, B.2, B.3, B.8, B.10. |

---

## H. Updated Phase 1 Deliverables (extends §17)

Add to Phase 1:
- `clubs` table + federation/club admin split
- i18n scaffolding (react-i18next, el + en locale files, switcher)
- Forgot password flow + email transport configured
- Consent record on athlete creation (blocks `is_active = true` without `data_processing` consent)
- Soft-delete + erasure-request endpoint stubs (full review workflow can wait for Phase 2)

---

## End of patch
