---
description: Run and read the technical audit + Search Console before writing
argument-hint: "[project_id]"
---

# /gsc-audit

SEO starts with an audit, not with publishing. Pull both signals and summarize.

1. **Technical audit** — `GET /audit?project_id=$PID`.
   - If `audit` is `null`, no audit has run yet. Tell the user to start one in the makeseo
     dashboard (or use the free public tool at `makeseo.co/seo-check` for a quick look), then
     re-run this command.
   - Otherwise report: score, score trend from history, and the top issues. Each issue carries
     an `issue_type` bound to a versioned SEO rule and a fix hint — surface the highest-severity
     ones first (blockers before quick wins).

2. **Search Console** — `GET /search-console?project_id=$PID&days=28`.
   - If `state` is `not_connected` or `reconnect`, tell the user to connect GSC and stop here.
   - If `ready`, surface: total clicks/impressions/CTR/position with period-over-period deltas,
     then the opportunities:
     - **Striking distance** — pages at position 8–20 (one refresh from page 1).
     - **Low CTR** — high impressions, low CTR (rewrite title/meta).
     - **Decay** — queries/pages down vs the previous period.

3. **Recommend a plan.** Map findings to actions: fix blockers, then `/optimize` the striking-
   distance pages, then `/write-article` for gaps. Do not invent numbers — only report what the
   API returned. `null` means "not measured", not "zero".
