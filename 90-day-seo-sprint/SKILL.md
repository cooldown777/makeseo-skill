---
name: makeseo-90-day-sprint
description: The opinionated 90-day SEO sprint for makeseo. Use when the user asks "where do I start with SEO", wants a "90-day SEO sprint", an "SEO sprint", a "3-month SEO plan", their "first 1000 organic visitors", or a week-by-week plan to go from a fresh site to a compounding content engine. A 13-week, four-phase ordering that routes every task to a real makeseo capability.
homepage: https://makeseo.co
metadata: {"parent":"makeseo"}
---

# The makeseo 90-Day SEO Sprint

A calendar, not a checklist. Thirteen weeks in four phases, each week routing to a **real
parent capability** (a `/makeseo-*` command or a `/api/v1` endpoint). Nothing here invents a
feature makeseo does not have — no social posting, no outreach mailers, no video. The whole
sprint is: set up right → fix what already ranks → build clusters makeseo generates for you →
earn authority → review.

**This is a delegation skill.** Every step below is executed by the parent **makeseo** skill.
When a week says `/keyword-research`, run that command; when it says an endpoint, use the
parent's `curl`/`jq` patterns or `node scripts/makeseo.mjs`. This file is the ordering and the
judgement, not a second API.

## Before you start — the honest gating

Reads (audit, GSC, keywords, calendar) work on any account. Two things cost money and can stop
the sprint dead, so plan for them on **day 0**, not week 6:

- **The 3-day trial needs a card.** No card, no generation. Surface this immediately.
- **Generation and publishing need a live subscription** (`trialing`/`active`/`past_due` in
  grace). `POST /articles` and `POST /articles/:id/publish` throw `402 subscription_inactive`
  otherwise.
- **Every generated article spends one from the monthly article quota.** A sprint that
  generates a lot needs the right **article tier** picked up front — `402 quota_exceeded`
  means the month is used up, and the calendar quietly stops refilling until the period rolls.
  Do the arithmetic on day 0: how many articles does your cluster plan need this month?

If any of these isn't in place, the sprint pauses at generation. Say so plainly and don't fake
progress.

---

## Phase 0 — Pre-launch (Day 0)

**Goal: a validated key, a connected CMS, connected Search Console, and a tier that matches the
plan.** One bad connection here wastes the whole first week.

**Required first action:** run **`/makeseo-setup`**. It validates `MAKESEO_API_KEY`, lists
projects (`GET /projects`), and confirms two things exist:

1. **A publishing target** — `GET /integrations` → `publishing_targets[]` has one `status:"connected"` entry. No target means every article ends at `draft` = "ready to post" and nothing goes live. Connect WordPress / Webflow / Wix / Ghost / Shopify / a hosted blog / a Next.js blog / a custom endpoint before week 1.
2. **Search Console** — `GET /integrations` → `search_console.connected`. Without it the audit still runs, but Phase 1's "fix what already ranks" is blind. If `state` is `not_connected`/`reconnect`, fix it now.

Then confirm the business context is real: `GET /business-context?project_id=$PID` — niche,
audiences, brand voice. makeseo writes every article to this, so a thin profile means thin
articles. Fill gaps with `PUT /projects/:id` (`niche`, `description`, `audiences`, `brand_voice`).

**Exit criteria:** key valid · one connected CMS · GSC connected (or consciously deferred) ·
article tier chosen against the cluster math below · business context complete.

---

## Phase 1 — Foundation (Days 1–30)

**Goal: know your ground, then stake out clusters. Do not generate a single article until you've
read what already ranks.** The fastest wins on an existing site are pages you already have.

### Week 1 — Baseline everything (`/gsc-audit`)
Run **`/gsc-audit`**. It combines `GET /audit?project_id=$PID` (score, history ≤52 points,
issues each carrying an `issue_type` = SEO rule id, severity `blocker`/`warning`/`hint`) with
`GET /search-console?project_id=$PID&days=90`.

Read it as a triage, ordered by the parent's `analysis_defaults`:
- **Blockers first** — audit issues with `severity:"blocker"`. These cap everything downstream.
- **Striking distance** — pages in the `striking_distance` band (`position_min`–`position_max`, `min_impressions`). They already have authority; a refresh climbs them faster than any new article. Note them for Phase 3's `/optimize`.
- **CTR gaps** — queries above `ctr_gap_min_impressions` impressions whose CTR is below `expected_ctr_by_position` × `ctr_gap_flag_factor`. Usually a meta-title/description problem, not a content one.
- **Brand dependence** — if non-brand share sits below `brand_share_bands.moderate_min_pct`, your traffic leans on your name; the sprint must invest in non-brand content. Record the baseline number so day 90 can measure the shift.

Write the baseline down. Everything at day 90 is measured against this read.

### Week 2 — Keywords with real volume (`/keyword-research`)
Run **`/keyword-research`**: `GET /keywords?project_id=$PID`. Show volume **only** where
`measured:true` — a `search_volume:null` means *not measured*, never zero, and you must not
substitute a model number. If most are unmeasured or stale, refresh once:
`POST /keywords/refresh {project_id}` — the **only** allowed Google Ads trigger, never a cron,
extra-limited to 10 / 10 min / org. Re-list after.

Rank by pillar status (`is_pillar`), measured volume, difficulty, and intent. This ranked set is
the raw material for the cluster plan.

### Weeks 3–4 — Cluster plan + calendar (`/cluster-plan`, `/content-calendar`)
Run **`/cluster-plan`**. Group keywords into topic clusters using the parent's `cluster` rule:
one pillar plus `min_supporting_articles`–`max_supporting_articles` supporting pieces, with
`one_url_per_cluster` — exactly one URL owning each cluster's head term, so you never compete
with yourself. This is where the **article-tier math** becomes concrete: count the supporting
articles you'll generate this month and confirm the quota covers them.

Then **`/content-calendar`**: `GET /articles?project_id=$PID` is the rolling plan makeseo already
scheduled — one (or more) posts per day depending on tier. Reorder/space topics with
`PUT /articles/:id` (`scheduled_for`) so each cluster ships pillar-first. Don't dump; the plan is
paced deliberately.

**Exit criteria:** blockers logged · striking-distance list saved · keywords measured · 1–2
clusters mapped (pillar + supporting) · calendar sequenced pillar-first.

---

## Phase 2 — The content engine (Days 31–60)

**Goal: ship the clusters, one URL per head term, cross-linked as they land.** This is the phase
that spends quota. Pace it against the tier.

### The generate loop (`/write-article`, `/publish`)
For each planned item, run **`/write-article`**:
`POST /articles {project_id, plan_item_id | keyword_id}`. **makeseo writes the whole piece** —
research, draft, internal links, images, quality gate. It's **synchronous** (up to ~200s),
billable, and gated. On `402` stop and report (inactive sub or quota); on `404` the plan item /
keyword vanished; on `400 missing_topic` you passed neither id.

You don't draft HTML — you **judge** the result. The response carries `word_count`,
`internal_links`, and `score`. Pull the body with `GET /articles/:id` and, if you want a
second read on structure, validate the fragment with
`node scripts/check-article-html.mjs <body.html>` against the house rules (single `single_h1`,
at least `min_h2_per_article` H2s, at least `min_internal_links_per_article` internal links
distributed across the body, `title_length_chars` and `meta_description_length_chars` in range,
FAQ answers `faq_direct_answer_words`). Note: makeseo has **no fixed word-count rule**
(`target_word_count` is null) — never flag length as a violation.

Tighten meta if needed with `PUT /articles/:id` (`meta_title`, `meta_description`, `tags`,
`featured_image_url`) — the **body is not editable via the API** (dashboard only). Then
**`/publish`**: `POST /articles/:id/publish`. It returns a **real live URL or throws** — makeseo
never marks an article published without a verified address. `409 quality_gate_failed` keeps it a
reviewable draft (people-first; fix and retry). `400 no_target_connected` / `connection_id_required`
means the CMS step from Phase 0 wasn't done — the error returns `targets[]` to choose from.

### Cross-link as you go (`/internal-links`)
After a cluster piece is live, run **`/internal-links`**:
`GET /internal-links?project_id=$PID&keyword=...` returns the project's own **published** URLs
(those with a live `external_url`). New articles get real internal links to siblings and the
pillar automatically at generation; use this to spot a pillar that isn't yet linked from its
supporting posts and re-generate/re-optimize to close the loop (`internal_link_min_paragraph_gap`
keeps them from bunching).

### Ride live demand (`/news`)
When the niche has a moving story, run **`/news`**:
`node scripts/news-topics.mjs --lang <l> --country <c> "<query>"` surfaces current Google News
topics (no key). Pick one that fits an existing cluster, then feed it through the same
`/write-article` loop as a timely supporting piece. It's a **topic source**, not a second
generator.

**Exit criteria:** first cluster(s) fully published pillar-first · every supporting post links
the pillar · quota spent on plan, not overshoot · calendar still refilling ahead.

---

## Phase 3 — Authority & compounding (Days 61–90)

**Goal: earn links, lift the pages already on the edge of page 1, and start showing up in AI
answers.** New content alone plateaus; this phase is what makes month 4 grow faster than month 2.

### Feed the exchange (`/backlinks`)
Run **`/backlinks`**. `GET /backlink-targets?project_id=$PID` lists other orgs that opted into
the exchange; makeseo folds 1–2 network references into eligible generated articles automatically,
and `GET /backlinks` is the org-scoped ledger (it never throws). More given → more received from
real, participating businesses. **Trial/free accounts don't participate** and their published
posts carry a makeseo signature — another reason the live subscription matters. Report earned vs
scheduled links honestly; never invent a DR or count a `null` as a number.

### Optimize the striking-distance list (`/optimize`)
Run **`/optimize`** against the list you saved in week 1. Re-read
`GET /search-console?project_id=$PID&days=28` and `GET /audit`, then for each striking-distance
page tighten `meta_title`/`meta_description` via `PUT /articles/:id` and re-`/publish` to push the
change live. Also sweep for two rot patterns:
- **Cannibalization** — one query served by ≥ `cannibalization.min_pages_per_query` of your own pages above `min_impressions`. Consolidate to the one URL that should own it (`one_url_per_cluster`).
- **Content decay** — a page whose clicks fell ≥ `content_decay.clicks_drop_pct_flag`% vs the previous equal period (only if it had ≥ `min_prior_clicks` before — a snapshot is not a trend). Refresh it.

### Track AI citation (`/ai-visibility`)
Run **`/ai-visibility`**: `GET /ai-visibility?project_id=$PID` returns the GEO score and per-engine
citation state (ChatGPT, Perplexity, Gemini, AI Overviews …). A `state:"empty"` means no runs yet,
not zero visibility. `measurable:false` on an engine means no access to measure — never render it as
0%. Use it to see whether the clusters are being cited, and let weak dimensions inform which topics
Phase 2's engine prioritizes next cycle.

**Exit criteria:** exchange contributing · striking-distance pages refreshed and re-published ·
cannibalization/decay swept · a first GEO reading on record.

---

## Day 90 — Review

Re-run the Phase 1 reads and compare to the baseline you saved:

- **`/gsc-audit`** — audit score vs day 1 (history ≤52 points); non-brand share vs `brand_share_bands`; how many pages left the striking-distance band upward.
- **`/content-calendar`** — clusters shipped vs planned; every head term owned by exactly one URL.
- **`/backlinks`** — earned links and credit balance vs zero at start.
- **`/ai-visibility`** — GEO score movement (in points, not percent-of-percent).

Then set the next 90: which cluster to deepen, which striking-distance pages still need a push,
whether the article tier should move to match real throughput. The sprint doesn't end — it rolls
into the next quarter with a measured baseline instead of a guess.

## Routing table (task → real capability)

| Sprint task | Parent capability |
|---|---|
| Validate key, confirm CMS + GSC | `/makeseo-setup`, `GET /integrations` |
| Baseline audit + Search Console | `/gsc-audit`, `GET /audit`, `GET /search-console` |
| Keywords + real volume | `/keyword-research`, `GET /keywords`, `POST /keywords/refresh` |
| Cluster mapping | `/cluster-plan`, `GET /keywords` |
| Sequence the calendar | `/content-calendar`, `GET /articles`, `PUT /articles/:id` |
| Generate an article (makeseo writes it) | `/write-article`, `POST /articles` |
| Validate structure | `node scripts/check-article-html.mjs` |
| Cross-link published posts | `/internal-links`, `GET /internal-links` |
| Timely topic source | `/news`, `node scripts/news-topics.mjs` |
| Publish live | `/publish`, `POST /articles/:id/publish` |
| Refresh page-2 pages | `/optimize`, `GET /audit` + `GET /search-console`, `PUT /articles/:id` |
| Backlink exchange | `/backlinks`, `GET /backlink-targets`, `GET /backlinks` |
| AI citation tracking | `/ai-visibility`, `GET /ai-visibility` |

Every number in this file lives in `rules/seo-thresholds.json`. Every action is executed by the
**makeseo** parent skill. This sprint is only the order to do them in — and the discipline to
read before you generate.
