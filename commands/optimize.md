---
description: Find page-2 pages via audit + Search Console and refresh them
argument-hint: "[project_id]"
---

# /optimize

The fastest SEO wins come from pages that already rank. makeseo has no separate suggestions
queue — you combine two reads and act.

1. **Audit** — `GET /audit?project_id=$PID`. Note on-page issues per URL (missing/weak titles,
   thin meta, heading problems, missing internal links). Each is bound to a rule with a fix hint.

2. **Search Console** — `GET /search-console?project_id=$PID&days=28`. Identify:
   - **Striking distance**: `topQueries`/`topPages` at position 8–20.
   - **Low CTR**: high impressions, weak CTR → the title/meta is the lever.
   - **Decay**: negative deltas vs the previous period.
   The exact bands (striking-distance window, CTR-gap factor, decay flag, cannibalization) come
   from `rules/seo-thresholds.json` — never hard-code them. Full method: `references/gsc-playbook.md`.
   For reading and prioritizing on-page audit issues: `references/audit-playbook.md`.

3. **Act, ranked by impact.**
   - Quick metadata wins: `PUT /articles/:id` to sharpen `meta_title` / `meta_description`, then
     re-`publish` to push the change to the live CMS (published articles update in place).
   - Add internal links: `GET /internal-links?project_id=$PID&keyword=…` for exact URLs to weave
     into related articles.
   - For a genuinely thin page, generate a stronger companion piece via `/write-article`.

Present a short, prioritized list (blockers → striking distance → CTR → decay). Only cite numbers
the API returned.
