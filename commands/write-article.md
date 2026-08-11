---
description: Generate a planned article with makeseo, then publish it
argument-hint: "[keyword or plan item]"
---

# /write-article

**makeseo writes the article — you do not.** You choose the topic, trigger generation, and
publish. Never paste your own HTML; there is no content-submission endpoint.

1. **Pick a topic.**
   - From the calendar: `GET /articles?project_id=$PID` → choose a `draft`/`scheduled` item's
     `plan_item_id`.
   - Or from keywords: `GET /keywords?project_id=$PID` → a `keyword_id`.

2. **(Optional) prime the context.** `GET /business-context?project_id=$PID` to confirm niche,
   audiences, and brand voice look right; `GET /backlink-targets?project_id=$PID` if the project
   is in the exchange (makeseo folds eligible network links in automatically).

3. **Generate (synchronous, billable, ~1–3 min).**
   ```bash
   curl -s -X POST -H "Authorization: Bearer $MAKESEO_API_KEY" -H "Content-Type: application/json" \
     -d '{"project_id":"'"$PID"'","plan_item_id":"'"$ITEM"'"}' \
     https://makeseo.co/api/v1/articles | jq .
   ```
   - Success → `{ "article": { id, slug, word_count, internal_links, score } }`.
   - `402` → inactive subscription or the monthly article quota is used up. Surface it and stop —
     do not retry.

4. **Review** — `GET /articles/:id` to read `title`, `meta_*`, `body_html`, `score`. Optionally
   tune metadata with `PUT /articles/:id` (`meta_title`, `meta_description`, `tags`).

5. **Readiness gate** — save `body_html` to a file and validate it before publishing:
   ```bash
   node scripts/check-article-html.mjs body.html --domain "$DOMAIN" \
     --competitors "rivalA.com,rivalB.com" \
     --meta-title "$META_TITLE" --meta-description "$META_DESC"
   ```
   Exit 0 = clean, 1 = violations, 2 = I/O. Fix metadata via `PUT /articles/:id` and re-check
   until clean; the body itself is edited in the dashboard, not the API. Thresholds and the house
   structure behind each check live in `references/article-structure.md`.

6. **Publish** — see `/publish`, or:
   ```bash
   curl -s -X POST -H "Authorization: Bearer $MAKESEO_API_KEY" -H "Content-Type: application/json" \
     -d '{}' https://makeseo.co/api/v1/articles/$ARTICLE_ID/publish | jq .
   ```
   - `200` with a live `url` → done. `409` → the quality gate held it as a draft; review in
     makeseo. `400 no_target_connected` → connect a CMS first.

Confirm with the user before publishing (it is public and immediate). Report the live URL.
