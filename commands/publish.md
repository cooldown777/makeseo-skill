---
description: Publish a ready article to a connected CMS
argument-hint: "[article_id]"
---

# /publish

Publish a generated article live. "Published" in makeseo means **live on a connected target with
a real, verified URL** — the status alone is never enough, so this endpoint returns a live URL or
throws.

1. **Check targets** — `GET /integrations?project_id=$PID`. If `publishing_targets` is empty,
   stop and tell the user to connect a CMS. If there are several, note their `id`s.

2. **Publish.**
   ```bash
   # single connected target → no body needed
   curl -s -X POST -H "Authorization: Bearer $MAKESEO_API_KEY" -H "Content-Type: application/json" \
     -d '{}' https://makeseo.co/api/v1/articles/$ARTICLE_ID/publish | jq .

   # multiple targets → name one, and optionally publish as a CMS draft
   #   -d '{"connection_id":"…","status":"draft"}'
   ```

3. **Interpret the result.**
   - `200` + `url` → live. Report the URL.
   - `409` → the pre-publish **quality gate** failed; the article stays a draft for review in
     makeseo. Do not force it.
   - `402` → the subscription is inactive; publishing is paused (already-published posts stay live).
   - `400 connection_id_required` → pass a `connection_id` from step 1.

Always confirm with the user before publishing — it's public and immediate. Re-publishing an
already-live article updates it **in place** (never a duplicate).
