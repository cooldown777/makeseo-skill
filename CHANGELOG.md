# Changelog

All notable changes to the makeseo skill are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the skill version is
the `version` field in `SKILL.md`'s frontmatter.

## Definition of Done (every future feature)

A feature is not done until **all** of these hold — this is what keeps the skill
from drifting the way a 122 KB monolith does:

1. **Command** — a file in `commands/` (1–4 KB) with `description` + `argument-hint`
   frontmatter, a numbered flow, and a pointer to its reference. No methodology in
   the command itself.
2. **Reference** — the methodology lives in `references/` (its own file, or a
   section of an existing one for a small feature). Cite exact endpoints.
3. **Numbers** — every threshold is a key in `rules/seo-thresholds.json`; no number
   is hard-coded in prose or code.
4. **Grounded in the real API** — only the actual makeseo endpoints; no invented
   features, and the agent never drafts article HTML (makeseo generates it).
5. **Listed** — a row in the command table of both `SKILL.md` and `README.md`; the
   two tables and the files in `commands/` agree.
6. **Recorded** — an entry here, and the `version` in `SKILL.md`'s frontmatter bumped.
7. **Scripts tested** — any `.mjs` runs clean (validator fixtures pass, a live read
   returns), and any rule documented in a reference matches what a script enforces.
8. **`SKILL.md` still < 20 KB** — if it grew past, move something into `references/`
   in the same change.

---

## [0.2.1] — 2026-08-11

### Fixed
- `scripts/check-article-html.mjs` corrected against a **real generated makeseo article body**
  (verified via a live API read): anchor ids live on `<section id>` wrappers (and `<h3 id>` /
  step `<li id>`), **not** on the `<h2>`. The validator now collects ids from every element so
  table-of-contents anchors resolve, and the false "missing H2 id" rule was dropped. makeseo's
  images legitimately carry `width`/`height` + `loading` for layout stability, so the
  "image-fixed-size" check was removed (the `alt`-text check stays). `references/article-structure.md`
  updated to match. A real makeseo body now validates clean; the only `--domain` finding it draws is
  the genuine "fewer than 3 internal links" advisory.

## [0.2.0] — 2026-08-11

### Added
- `rules/seo-thresholds.json` — the single source of every number the skill
  reasons with. On-page limits are mirrored from makeseo's own SEO knowledge
  base (by rule id); the audit/GSC analysis benchmarks are documented as
  skill-side defaults. Audit, optimize, write-article and the article validator
  all read from here — no number is hard-coded in prose or code.
- `scripts/check-article-html.mjs` — an executable gate that validates an
  article body fragment against the makeseo house rules (fragment-only, no
  colour in the body, unique H2 ids, resolving table-of-contents anchors, image
  alt text, distributed internal links, no competitor links, meta lengths).
  Exit non-zero on any violation.
- `scripts/news-topics.mjs` — fresh, datable niche topics from Google News RSS
  (no API key), de-duplicated and recency-sorted, with optional CSV export.
- `references/article-structure.md` — what makeseo produces, the house rules the
  validator enforces, and the safe-edit protocol for the metadata (PUT) path.
- `references/gsc-playbook.md` — Search Console data traps (2-day lag, weighted
  position, omitted queries, property types, the empty state) and the
  back-channel that turns every finding into a content-plan action.
- `references/cluster-planning.md` — pillar + supporting clusters from the
  `is_pillar` / `cluster_id` keyword fields, one URL per cluster, internal-link
  flow, and how a cluster becomes plan items.
- Commands `/cluster-plan` and `/news`.
- A `90-day-seo-sprint/` sub-skill (own frontmatter, `parent: makeseo`) — an
  opinionated 13-week ordering that routes every task to a real parent command.
- `LICENSE` (MIT), this changelog.

### Changed
- The optional client and helpers are now dependency-free **Node.js** (`.mjs`,
  Node 18+) instead of Python, matching the makeseo stack and making them
  testable. `makeseo_cli.py` → `scripts/makeseo.mjs`, now covering every
  endpoint including `PUT /articles/:id` and `PUT /projects/:id`.
- The audit playbook expanded from a summary into analyses with explicit
  thresholds and a per-finding makeseo action.
- Error handling documents the exact API error strings (`subscription_inactive`,
  `quota_exceeded`, `quality_gate_failed`, …) and the `/keywords/refresh`
  10-per-10-minute limit.

## [0.1.0] — 2026-08

### Added
- Initial skill: `SKILL.md`, the `commands/` set, the `references/` starters,
  and a Python client, wrapping the makeseo `/api/v1` REST surface.
