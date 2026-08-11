---
description: List and explain the rolling content plan
argument-hint: "[project_id]"
---

# /content-calendar

makeseo keeps a **rolling** plan: topics with keyword, title, and outline are scheduled ahead —
one (or more, on higher article tiers) per day — and a new topic slides in as one publishes.

1. **List** — `GET /articles?project_id=$PID`. Each item: `plan_item_id`, `title`, `keyword_id`,
   `scheduled_for`, `status` (draft / scheduled / generating / published / failed), and, when
   live, its `url`.

2. **Summarize** by status: how many published, ready-to-post, planned, failed; the next few
   scheduled dates and titles.

3. **Act:**
   - Generate a planned item now → `/write-article` with its `plan_item_id`.
   - Reschedule → `PUT /articles/:id { "scheduled_for": "ISO-8601" }` (published items are fixed
     and overdue dates are never back-dated — makeseo spreads them one per day).

Note: the plan refills from the project's existing keyword vocabulary and is bound to a live
subscription and remaining monthly quota. If it looks short, the keyword pool may be exhausted —
the user can add keywords in the dashboard.
