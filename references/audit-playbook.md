# Audit playbook

An audit comes before writing. You read what already ranks, find the cheapest wins, and turn
each finding into a concrete makeseo action — never a vague suggestion. makeseo generates the
articles; your job here is diagnosis and prioritization on top of two data feeds.

Every number below is a KEY in `rules/seo-thresholds.json`. Cite the key; never hard-code the
value in prose — the SoT can change under you.

## The two sources

- `GET /audit?project_id=X` — the latest technical audit (~55 checks). Fields: `score`, score
  `history` (up to 52 points), and `issues[]`. Each issue carries `issue_type` (the stable SEO
  rule id — same identity as makeseo's own knowledge base), `severity` (`blocker` | `warning`
  | `hint`), `category`, and an affected-page count. **`audit` is `null` when no audit has ever
  run** — that is not "score 0", it is "not measured". Start one in the dashboard or point the
  user at the free `makeseo.co/seo-check`.
- `GET /search-console?project_id=X&days=7|28|90` — real performance. Per-query and per-page
  `clicks` / `impressions` / `ctr` / `position`, plus period-over-period deltas, plus a `state`.
  If `state` is `not_connected` or `reconnect`, **every performance analysis below is
  unavailable** — say so plainly and stop; do not infer traffic from the audit alone.

Throughout: `null` = not measured, `0` = measured and zero. Never collapse them. Never invent a
prior period you do not have.

---

## 1. CTR underperformance

Ranks fine, gets too few clicks → the title/meta is the lever, not the content.

- **Reads:** `GET /search-console` per-page (or per-query) rows: `position`, `impressions`,
  `ctr`.
- **Thresholds:** `analysis_defaults.expected_ctr_by_position` (bucket the rounded position;
  positions > 10 fall into `11_20` / `21_plus`), `analysis_defaults.ctr_gap_flag_factor`,
  `analysis_defaults.ctr_gap_min_impressions`.
- **Flag when:** `impressions >= ctr_gap_min_impressions` **and**
  `actual_ctr < expected_ctr_by_position[bucket] * ctr_gap_flag_factor`.

| page / query | position | impressions | actual_ctr | expected_ctr | gap (×expected) | flag |
|---|---|---|---|---|---|---|
| /blog/x | 3.1 | 420 | 0.041 | 0.10 | 0.41 | yes |

- **Action:** find the matching article (`GET /articles` → `plan_item_id`/`article_id` by
  slug/url), rewrite the snippet: `PUT /articles/:id` with a sharper `meta_title` (obey
  `onpage_mirrored.title_length_chars`) and `meta_description`
  (`onpage_mirrored.meta_description_length_chars`). The PUT returns a `sync_hint` — a live
  article must be **re-published** to push the new snippet: `POST /articles/:id/publish`.
- **Caveat:** the CTR benchmark only FLAGS; it never promises traffic. Below
  `ctr_gap_min_impressions` the sample is too small — leave it alone.

---

## 2. Striking distance (best ROI)

Pages already near page 1. A meta + internal-link refresh climbs them fastest.

- **Reads:** `GET /search-console` per-page: `position`, `impressions`.
- **Thresholds:** `analysis_defaults.striking_distance.position_min`,
  `.position_max`, `.min_impressions`.
- **Flag when:** `position_min <= position <= position_max` **and**
  `impressions >= striking_distance.min_impressions`.

| page | position | impressions | top query | in striking band |
|---|---|---|---|---|
| /blog/y | 12.4 | 180 | "…" | yes |

- **Action:** refresh the meta (`PUT` → re-`publish`, as in §1) **and** strengthen internal
  links pointing at it. Pull candidate anchors from
  `GET /internal-links?project_id&keyword=<query>` (published articles with a live
  `external_url`); if too few strong internal links exist, that itself is a gap → §7.
- **Caveat:** authority is already there; do not regenerate the whole article for a
  striking-distance page — that spends a quota credit to fix a snippet.

---

## 3. Content decay

Traffic falling on a page that used to earn it.

- **Reads:** `GET /search-console` per-page `clicks` and the period delta. Compare a period to
  the **previous equal period** — request `days=28` (or 90) so a real prior window exists.
- **Thresholds:** `analysis_defaults.content_decay.clicks_drop_pct_flag`,
  `.min_prior_clicks`.
- **Flag when:** `prior_clicks >= content_decay.min_prior_clicks` **and** the drop
  `(prior - current) / prior * 100 >= content_decay.clicks_drop_pct_flag`.

| page | prior_clicks | current_clicks | drop % | flag |
|---|---|---|---|---|
| /blog/z | 90 | 48 | 47 | yes |

- **Action:** refresh the article — update `meta_title`/`meta_description` and re-`publish`; if
  the underlying topic has genuinely moved on, regenerate around a current angle
  (`POST /articles` with the same `keyword_id`) rather than patching stale claims.
- **Honesty caveat (load-bearing):** a single `GET /search-console` call is a point-in-time
  snapshot, **not a trend**. Only call decay when you have a real prior period to compare
  against (the API's own deltas, or two windows you actually fetched). Never call a page
  "decaying" from one number. `min_prior_clicks` exists so a page that had 3 clicks and now has
  1 is not screamed about as a 66% collapse.

---

## 4. Cannibalization

Two of the site's own pages fighting over one query splits the signal and caps both.

Two detection paths — run both:

- **Path A — own articles by target keyword.** `GET /articles` + `GET /keywords`
  (`cluster_id`, `is_pillar`). Group articles whose `keyword_id` maps to the same keyword or
  the same `cluster_id`. More than one published URL owning a cluster head term is a smell
  (`analysis_defaults.cluster.one_url_per_cluster`).
- **Path B — GSC one query, many pages.** In `GET /search-console` per-query rows, count
  distinct pages serving a single query.
- **Thresholds:** `analysis_defaults.cannibalization.min_pages_per_query`,
  `.min_impressions`.
- **Flag when:** a query is served by `>= cannibalization.min_pages_per_query` pages with query
  `impressions >= cannibalization.min_impressions`.

| query | pages serving it | impressions | flag |
|---|---|---|---|
| "…" | 3 | 140 | yes |

- **Action:** decide **consolidate vs split intent**. If the pages target the same intent,
  consolidate — keep the stronger URL, retire the weaker, and repoint internal links to the
  keeper. If they target genuinely different intents, differentiate them: retitle/re-angle the
  weaker one (`PUT` title/meta → re-`publish`). makeseo has no merge/redirect endpoint — the
  merge itself is a dashboard/CMS action; the API side is the retitle and the internal-link
  repointing.
- **Caveat:** Path B needs a connected Search Console (`state`); Path A works from the calendar
  alone and is always available.

---

## 5. Brand vs non-brand

How much traffic depends on people already searching the brand name.

- **Reads:** `GET /search-console` per-query. Classify each query as brand (contains the
  brand/domain token) vs non-brand; sum clicks each side.
- **Thresholds:** `analysis_defaults.brand_share_bands.healthy_min_pct`, `.moderate_min_pct`.
  Share = non-brand clicks ÷ total clicks × 100.
- **Bands:** `>= healthy_min_pct` healthy · `moderate_min_pct`–`healthy_min_pct` moderate ·
  `< moderate_min_pct` brand-dependent.

| brand clicks | non-brand clicks | non-brand share % | band |
|---|---|---|---|
| 220 | 180 | 45 | moderate |

- **Action:** when the share is low, the deficit is discovery content — plan and generate
  non-brand articles (`POST /articles`) around pillar/cluster topics (§7). This is a
  content-investment signal, not a per-page fix.
- **Caveat:** brand detection is a token match on the brand/domain — imperfect. Report it as a
  band, never a decimal-precise verdict.

---

## 6. Dead pages

Pages that fell to no traffic at all.

- **Reads:** `GET /search-console` per-page `clicks` over the window.
- **Threshold:** `analysis_defaults.dead_page_max_clicks`.
- **Flag when:** `clicks <= dead_page_max_clicks` **and** the page had prior clicks (otherwise
  it is simply new/unproven, not dead).

| page | prior_clicks | current_clicks | flag |
|---|---|---|---|
| /blog/old | 60 | 0 | yes |

- **Action:** **refresh or retire.** Refresh = regenerate around a current angle
  (`POST /articles` on the keyword) or update meta and re-`publish`. Retire = a dashboard/CMS
  decision; the API does not delete published posts.
- **Caveat:** `clicks: 0` here means measured-and-zero over a window where the page once earned
  traffic. A page with `null`/no history is **not** a dead page — it is unmeasured. Do not
  conflate.

---

## 7. Cluster gaps

Thin or missing topic clusters — a pillar with too few supporting articles, or a keyword
cluster with no pillar.

- **Reads:** `GET /keywords` (`cluster_id`, `is_pillar`) + `GET /articles` to see which
  clusters actually have published support.
- **Thresholds:** `analysis_defaults.cluster.min_supporting_articles`,
  `.max_supporting_articles`, `.one_url_per_cluster`.
- **Action:** generate the missing supporting articles (`POST /articles` by `keyword_id`).
- **Detail deferred:** the full cluster-planning method (pillar selection, supporting-article
  sizing, one-URL-per-head-term) lives in
  [`references/cluster-planning.md`](./cluster-planning.md). This playbook only surfaces the
  gap; that file plans the fill.

---

## 8. On-page basics

Mechanical checks against the mirrored product rules. The audit already runs most of these
server-side (each `issue.issue_type` IS the rule id); use this section to read them and to
sanity-check an article you are about to publish with `node scripts/check-article-html.mjs`.

| check | threshold key | rule id |
|---|---|---|
| title length | `onpage_mirrored.title_length_chars` (min/max) | `onpage.title.length` |
| meta description length | `onpage_mirrored.meta_description_length_chars` | `onpage.meta.length` |
| exactly one H1 | `onpage_mirrored.single_h1` | `onpage.h1.single` |
| ≥ 2 H2 | `onpage_mirrored.min_h2_per_article` | `onpage.heading.hierarchy` |
| ≥ 3 internal links, distributed | `onpage_mirrored.min_internal_links_per_article` | `intlink.distribution` |
| FAQ answer length | `onpage_mirrored.faq_direct_answer_words` | `onpage.answer_first` |
| word count | `onpage_mirrored.target_word_count` (**null — no fixed target**) | `onpage.no_target_wordcount` |
| Core Web Vitals | `onpage_mirrored.core_web_vitals` | `tech.cwv` |

- **Action:** title/meta issues → `PUT /articles/:id` then re-`publish`. Structural issues
  (H1/H2/internal-link distribution) live in the article body, which the API does **not** let
  you edit (`PUT` body is dashboard-only) — regenerate (`POST /articles`) or fix in the
  dashboard. Never assert a word-count rule: `target_word_count` is deliberately `null`.

---

## Prioritized action plan

Work top-down. Every finding must map to exactly one action; a finding with no action is not a
finding.

1. **Blockers first.** Every `GET /audit` issue with `severity: "blocker"`, ordered by affected
   page count. Indexability, canonicals, missing titles — no ranking work matters while a page
   cannot be indexed. Most are dashboard/CMS fixes; title/meta blockers go through `PUT` +
   re-`publish`.
2. **Striking distance (§2).** Highest ROI: authority already banked, one refresh from page 1.
   `PUT` meta + internal links → re-`publish`.
3. **Low-CTR (§1).** Cheap snippet rewrites on pages that rank but under-click. `PUT` → re-`publish`.
4. **Cannibalization (§4) & decay (§6/§3).** Consolidate/split, refresh or retire.
5. **Gaps (§5 non-brand, §7 clusters).** New articles via `POST /articles` — the only step that
   spends a quota credit and runs synchronously (~up to 200s, billable). Do it last, on purpose.

Then the remaining audit `warning`s and `hint`s in the same category order.

**Data-availability rules that override any of the above:**
- No Search Console connection (`state` = `not_connected`/`reconnect`) → §1–§6 Path-B are
  unavailable. Say so; run only audit-driven and calendar-driven checks (§4 Path A, §7, §8).
- No audit (`audit: null`) → the blocker step is empty until one runs; do not fabricate issues.
- Report only what the API returned. `null` ≠ `0`, ever.
