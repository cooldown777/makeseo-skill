# Cluster planning (pillar + supporting)

A topic cluster is one broad **pillar** article that owns a head term, ringed by several
narrow **supporting** articles that each answer one long-tail question and link back to the
pillar. It concentrates a project's authority on one theme instead of scattering it across
overlapping pages.

makeseo already groups the keywords for you. `GET /keywords?project_id=X` returns, on every
keyword: `is_pillar` (bool) and `cluster_id`. **A cluster = the one keyword with
`is_pillar: true` sharing a `cluster_id`, plus every supporting keyword carrying the same
`cluster_id`.** You do not build clusters — you read them, then turn each keyword into an
article in the right order.

## The model

- **One pillar per cluster.** The head term, `is_pillar: true`. It is the URL you want to
  rank for the broad query.
- **Supporting articles.** Between `cluster.min_supporting_articles` and
  `cluster.max_supporting_articles` (see `rules/seo-thresholds.json`) long-tail pieces, each
  targeting a distinct sub-question. Fewer than the minimum and the pillar looks unsupported;
  more than the maximum and the sub-topics start overlapping (that overlap is
  cannibalization — see below).
- **Exactly one URL owns the head term** (`cluster.one_url_per_cluster`). The pillar owns it.
  A supporting article must chase a *different, narrower* query — never the pillar's head term.

Two articles targeting the same head term compete with each other in the SERP and split their
own signals. That is cannibalization; detect and resolve it with the
`cannibalization.min_pages_per_query` / `cannibalization.min_impressions` method in
[references/audit-playbook.md](audit-playbook.md) before you plan more articles into the
cluster.

## Internal linking inside a cluster

The links are what make a cluster a cluster. They must be **real live URLs**, mid-paragraph,
with descriptive anchor text — never a naked "click here" or a guessed path.

- **Supporting → pillar.** Every supporting article links up to the pillar.
- **Pillar → supporting.** The pillar links down to each supporting article it can reach.
- Source the URLs from `GET /internal-links?project_id=X` (optionally `&keyword=...` to filter
  by relevance, `&limit=...`). It returns only the project's **published** articles that have a
  live `external_url` — so every cross-link you plan actually resolves. A supporting article
  written before the pillar is live has nothing to link to yet; that is the whole reason for
  the publish order below.
- Meet `onpage_mirrored.min_internal_links_per_article` (in `rules/seo-thresholds.json`),
  distributed across the body, not clustered in one paragraph
  (`analysis_defaults.internal_link_min_paragraph_gap`). makeseo generates internal links
  during article generation from the project's own live URLs; your job is to make sure the
  targets *exist* by the time each article is generated.

## Turning a cluster into a content plan

Each pillar and supporting keyword becomes one article via `POST /articles`. You trigger
generation with either a `plan_item_id` (from `GET /articles`, the content calendar) or a
`keyword_id` (from `GET /keywords`). Generation is synchronous (up to ~200s), billable, and
returns the article's `id`, `slug`, `word_count`, `internal_links`, and `score`.

**Publish the pillar first, then the supporting pieces.** Only once the pillar is published
with a live `external_url` does it appear in `GET /internal-links` — so the supporting
articles generated afterward can actually receive it as a target, and you can add the
pillar → supporting links as each supporting URL goes live. Publishing supporting-first would
leave the pillar with no down-links and the supporting articles with no up-link.

Recommended sequence for one cluster:
1. `POST /articles` for the **pillar** keyword → `POST /articles/:id/publish` (real live URL).
2. For each **supporting** keyword: `POST /articles` → `publish`. Each new supporting URL is
   now a link target the pillar can point to.
3. Re-check `GET /internal-links?project_id=X&keyword=<pillar term>` to confirm the pillar and
   supporting URLs cross-reference each other.

`POST /articles` errors to expect: `402 subscription_inactive`, `402 quota_exceeded`,
`404 plan_item_not_found` / `404 keyword_not_found`, `400 missing_topic`. Publishing throws
rather than return a fake URL: `400 no_target_connected`, `409 quality_gate_failed`,
`402 subscription_inactive`.

## Reading the current cluster shape from the API

Three reads tell you exactly where a cluster stands:

| Question | Endpoint | Read |
|---|---|---|
| What are the clusters? | `GET /keywords?project_id=X` | Group by `cluster_id`; the `is_pillar: true` row is the head, the rest support it. |
| Which cluster keywords already have articles? | `GET /articles?project_id=X` | Match `keyword_id` / `status` / `url` against the cluster's keyword ids to see what's planned, drafted, or live. |
| What can each article link to? | `GET /internal-links?project_id=X` | The project's live URLs — the supply of real link targets. Empty for a keyword means nothing is published to link to yet. |

Count the supporting keywords per `cluster_id`. Below `cluster.min_supporting_articles`, the
cluster is thin — add long-tail keywords (`POST /keywords/refresh`, the only allowed Google
Ads trigger; rate-limited 10 / 10 min / org) and re-read. Above
`cluster.max_supporting_articles`, check the extras for head-term overlap before planning them.

## Worked example

`GET /keywords?project_id=proj_42` returns, among others:

```
{ id:"kw_01", keyword:"email marketing",            is_pillar:true,  cluster_id:"cl_email", search_volume:8100, measured:true }
{ id:"kw_02", keyword:"email marketing for saas",   is_pillar:false, cluster_id:"cl_email", search_volume:390,  measured:true }
{ id:"kw_03", keyword:"best email subject lines",   is_pillar:false, cluster_id:"cl_email", search_volume:1300, measured:true }
{ id:"kw_04", keyword:"email deliverability tips",   is_pillar:false, cluster_id:"cl_email", search_volume:720,  measured:true }
{ id:"kw_05", keyword:"welcome email sequence",      is_pillar:false, cluster_id:"cl_email", search_volume:590,  measured:true }
```

That is one cluster (`cl_email`): pillar `kw_01` + 4 supporting keywords — right at
`cluster.min_supporting_articles`. Plan it:

1. `node scripts/makeseo.mjs generate --project proj_42 --keyword-id kw_01` → pillar article
   `art_100`. Then `node scripts/makeseo.mjs publish --article art_100` → live at
   `https://acme.de/blog/email-marketing`.
2. `GET /internal-links?project_id=proj_42` now lists that pillar URL. Generate and publish
   the four supporting keywords in turn (`kw_02`…`kw_05`); each is generated with the pillar
   available as an up-link target, and each new supporting URL becomes a down-link target for
   the pillar.
3. If you later want the head term strengthened, add supporting keywords — never a second
   article on "email marketing" itself. One URL owns the head term.

Report only what the API returns. `null` = not measured; `0` = measured and zero — never
collapse the two.
