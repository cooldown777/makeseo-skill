# Search Console playbook

makeseo holds the raw Google Search Console connection for a project. That is the whole point of
this file: because the connection lives inside makeseo, decay, cannibalization and
striking-distance are actually **computable** here — not guessed from a keyword tool. Every read
below must end in a makeseo action, or it is reporting, not a product.

## The endpoint

```
GET /search-console?project_id=X&days=7|28|90   ->   { project_id, range, search_console }
```

- `days` accepts only `7`, `28`, `90`. **Any other value silently coerces to `28`** — don't
  pass `30` and assume you got a month; you got 28.
- `range` = `{ from, to, days, label }`. **`range.to` is the last date Google actually has data
  for**, not today. Read it and quote it.
- `search_console` carries per-query rows and per-page rows, each with `clicks`, `impressions`,
  `ctr`, `position`, plus period-over-period `deltas`, and a top-level `state`.
- `state` values include `not_connected` and `reconnect`. On either, stop analysing and tell the
  user to connect/reconnect GSC in the dashboard (**Settings -> Integrations**). Confirm with
  `GET /integrations` and read `search_console.connected` / `search_console.status` /
  `account_email` / `property`.

Deeper raw slicing — arbitrary date ranges, device/country breakdowns, page+query joins beyond
the three day presets — lives in the **dashboard GSC view**, not this API. Be honest about that
ceiling rather than faking a slice the endpoint can't return.

## Data traps (every implementation stumbles on these)

**1. The ~2-day lag. Never say "today."**
Google finalizes data on a roughly two-day delay. `range.to` is the real last-available date;
anchor every sentence to it ("in the 28 days ending {range.to}"), never to the current date. A
period that includes the last two days is incomplete and will look like a traffic cliff that
isn't real.

**2. `position` is ALREADY an average — never average the averages.**
Each row's `position` is impression-weighted over the range. To roll positions up across queries
or pages, weight by `impressions`:
`avg_position = Σ(position_i × impressions_i) / Σ(impressions_i)`.
A plain mean of row positions is wrong and will mis-rank striking-distance candidates.

**3. Google omits rare queries — rows never sum to the property total.**
For privacy, Google drops low-volume queries entirely. `Σ(query rows).clicks` is always **less
than** the property total, often much less. This is expected, not an error and not lost data. In
any table, label the query breakdown as a sample ("top queries; totals exceed the sum of rows"),
never present the shortfall as a bug.

**4. Property type changes the numbers.**
A `sc-domain:` property aggregates every subdomain and both http/https; a `https://…` URL-prefix
property covers exactly that origin and canonicalization can split or merge URLs differently. The
same site on the two property types reports different coverage. Read `integrations.search_console.property`
to know which one you're looking at before comparing anything.

**5. The empty state is NORMAL for a new project.**
A freshly launched project has no history — GSC needs pages indexed and crawled first, which takes
days to weeks. An empty `search_console` (or `state:"empty"`-style payload) is the expected case,
with a real reason ("no impressions yet — pages not indexed"). Never render an empty table as if a
call failed; say why it's empty and what unblocks it (publish, wait for indexing).

`null` = not measured; `0` = measured and genuinely zero. A query with `impressions:0` and one
that simply wasn't returned are different facts — keep them apart.

## Metrics logic (how the four numbers become findings)

The analyses below use the `analysis_defaults` block of `rules/seo-thresholds.json`. They mirror
the audit — see `references/audit-playbook.md` for how each finding turns into an ordered
worklist. Cite the JSON keys, never hard-code the numbers.

- **Striking distance** — a page ranking in `striking_distance.position_min`–`position_max` with
  at least `striking_distance.min_impressions` impressions already has authority; a meta +
  internal-link refresh is the highest-ROI move in an audit. Rank candidates by the
  impression-weighted position (trap 2).
- **CTR gap** — a row whose `ctr` is below `expected_ctr_by_position[position]` ×
  `ctr_gap_flag_factor`, with at least `ctr_gap_min_impressions` impressions, ranks fine but under-
  earns clicks — the title/meta is the lever. `expected_ctr_by_position` is a flag threshold only,
  never a traffic promise.
- **Content decay** — a page whose clicks fell by at least `content_decay.clicks_drop_pct_flag`
  percent versus the previous equal period, and had at least `content_decay.min_prior_clicks`
  before. This needs a **real prior period** (compare two `days` windows, or use the returned
  `deltas`); a single snapshot is not a trend — don't call it decay without the prior number.
- **Cannibalization** — one query served by at least `cannibalization.min_pages_per_query` of the
  project's own pages, above `cannibalization.min_impressions` impressions: split intent or
  consolidate to one URL per cluster (`cluster.one_url_per_cluster`).
- **Brand share** — split brand vs non-brand queries. Above `brand_share_bands.healthy_min_pct`,
  non-brand demand is strong; between that and `brand_share_bands.moderate_min_pct`, moderate;
  below, traffic is brand-dependent and the fix is more non-brand content.
- **Dead pages** — pages at `dead_page_max_clicks` clicks that previously earned traffic.

## The back-channel (the point of the whole thing)

A GSC table that ends in a chart is reporting. Every finding must land on a makeseo write:

| Finding | makeseo action |
|---|---|
| Striking-distance page (own article) | `PUT /articles/:id` to sharpen `meta_title`/`meta_description`, then re-`POST /articles/:id/publish` (heed the `sync_hint`). Add internal links from newer posts — see `GET /internal-links`. |
| Low CTR, good position | `PUT /articles/:id` meta_title/meta_description within `onpage_mirrored.title_length_chars` / `meta_description_length_chars`, then re-publish. |
| High-impression query with **no** article | `POST /keywords/refresh` to confirm volume, then `POST /articles` (by `keyword_id`) to generate one. |
| Content decay | Regenerate/refresh the ranking article, or add a supporting cluster article via `POST /articles`. |
| Cannibalization | Consolidate: keep one URL, retarget or repoint the others; update internal links so one page owns the head term. |
| Brand-dependent (low brand share) | Feed non-brand queries in as new keywords -> `POST /articles`. |

The body of a live article is **not** editable through the API (`PUT /articles/:id` covers
metadata, tags, image, schedule only) — body edits are a dashboard action, then re-publish. Makeseo
generates the article; you decide the topic from the GSC signal, trigger it, and ship it.

Report only what the endpoint returns, weighted correctly, anchored to `range.to`, with `null`
and `0` kept distinct.
