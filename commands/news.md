---
description: Surface fresh dated topics for newsjacking, then feed one into the plan
argument-hint: "[niche query]"
---

# /news

Newsjacking: catch a fresh, dated angle in the project's niche and turn it into an article while
it is still current. **makeseo generates the article — you do not draft it.** Your job here is
topic discovery and handing a good angle to the pipeline.

1. **Find dated topics** (no API key needed — Google News RSS):
   ```bash
   node scripts/news-topics.mjs --days 7 --lang de --country DE "<niche query>"
   ```
   Match `--lang`/`--country` to the project (the product's content is German, Du-form). Each row
   is a headline with a publish date and source. Prefer recent, evergreen-adjacent angles over
   one-day news that will be stale by publish time.

2. **Confirm the niche** — `GET /business-context?project_id=$PID` so the chosen angle fits the
   audience and brand voice, not just the keyword.

3. **Turn the angle into a keyword.** makeseo grows keywords through its planning pipeline; brand-
   new keyword ideas are added by the user in the dashboard ("Add keywords"). Once the topic
   exists as a keyword, refresh its volume if useful → `/keyword-research`.

4. **Generate** — hand the `keyword_id` (or a matching `plan_item_id`) to `/write-article`.
   makeseo writes the full article server-side; you review, gate, and publish it. Never paste your
   own HTML — there is no content-submission endpoint.

Move fast: the value of a newsjack decays. Run the readiness gate (see `/write-article`) and
publish while the angle is still fresh.
