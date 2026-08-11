# 90-Day SEO Sprint (a makeseo sub-skill)

The **opinionated ordering** for using [makeseo](https://makeseo.co) in your first 90 days —
from a fresh (or under-worked) site to a compounding content engine. Thirteen weeks in four
phases: Pre-launch (day 0) → Foundation (days 1–30) → Content engine (days 31–60) → Authority
(days 61–90), plus a day-90 review.

## When it triggers
When someone asks "where do I start with SEO", wants a **90-day SEO sprint**, an **SEO sprint**,
a **3-month SEO plan**, their **first 1000 organic visitors**, or a week-by-week plan. It answers
the "what do I do, and in what order" question that the flat command list doesn't.

## What it is (and isn't)
- It's a **plan and a judgement layer**, not a second API. Every week routes to a real parent
  capability — `/makeseo-setup`, `/gsc-audit`, `/keyword-research`, `/cluster-plan`,
  `/content-calendar`, `/write-article`, `/internal-links`, `/news`, `/publish`, `/optimize`,
  `/backlinks`, `/ai-visibility` — or a real `/api/v1` endpoint.
- It **delegates** to the parent **makeseo** skill for all execution. `metadata.parent` is
  `makeseo`; this sub-skill contributes ordering, exit criteria, and the read-before-you-generate
  discipline.
- It invents **nothing**. No feature appears here that makeseo doesn't ship. Remember the frame:
  **makeseo generates the full article** — the agent picks topics, judges output, and publishes.

## The honest gating (stated up front, not at week 6)
The 3-day trial needs a card; generation and publishing need a **live subscription** and each
generated article spends one from the **monthly article quota**. A sprint that generates a lot
needs the right **article tier** chosen on day 0 — the sprint does that math before it schedules.

## Numbers
All thresholds (clusters, striking distance, internal links, CTR gaps, cannibalization, decay)
come from the parent's `rules/seo-thresholds.json`. This sub-skill cites the keys; it hard-codes
no number.

See `SKILL.md` for the full week-by-week plan and the task → capability routing table.
