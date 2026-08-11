# Audit playbook

An audit comes before writing. makeseo's audit is a technical crawl (~55 checks) plus Search
Console signals, every issue bound to a versioned SEO rule with a fix hint.

## Sources
- `GET /audit?project_id=X` — the latest technical audit: `score`, score `history`, and `issues`.
  Each issue carries an `issue_type` (its rule identity), a `severity`, a `category`, and how
  many pages it affects. `null` means no audit has run yet — start one in the dashboard, or use
  the free `makeseo.co/seo-check` for a quick look.
- `GET /search-console?project_id=X&days=28` — real performance with period-over-period deltas.

## What to look for
- **Cannibalization** — several pages competing for one query (split intent or consolidate).
- **Content decay** — traffic down vs the previous period.
- **Striking distance** — position 11–20, one refresh from page 1 (the best ROI).
- **CTR underperformance** — ranks well, few clicks → title/meta is the lever.
- **Dead pages** — dropped to zero traffic.
- **On-page** — titles, meta, headings, internal links, indexability.

## Order of operations (fastest ROI first)
1. Fix **blockers** flagged by the audit (indexability, broken canonicals, missing titles).
2. `/optimize` the **striking-distance** pages (meta + internal links + refresh).
3. Rewrite **low-CTR** titles/meta with `PUT /articles/:id`, then re-`publish`.
4. Fill gaps with new articles (`/write-article`), built around pillar/cluster topics.

Report only what the API returns. `null` = not measured; `0` = measured and zero — never
collapse the two.
