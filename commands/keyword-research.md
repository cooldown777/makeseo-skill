---
description: List project keywords with real search volume; refresh if stale
argument-hint: "[project_id]"
---

# /keyword-research

makeseo derives keyword ideas during planning; Google provides the **metrics**. A model cannot
know search volume — so this command never invents one.

1. **List** — `GET /keywords?project_id=$PID`.
   - Each keyword has `volume` (a display string), `measured` (bool), `difficulty`, `intent`,
     and `is_pillar`. Show volume **only** where `measured: true`; otherwise it reads
     "not available" and you must not substitute a number.

2. **Refresh stale volume** — if many are unmeasured or old, offer to refresh:
   ```bash
   curl -s -X POST -H "Authorization: Bearer $MAKESEO_API_KEY" -H "Content-Type: application/json" \
     -d '{"project_id":"'"$PID"'"}' https://makeseo.co/api/v1/keywords/refresh | jq .
   ```
   This is the **only** allowed user trigger for a Google Ads lookup. It never throws (an
   exhausted daily quota keeps the last known value) and is tightly rate-limited. Re-list after.

3. **Sort and recommend.** Prioritize pillar keywords and measured, higher-volume, lower-
   difficulty terms with commercial/informational intent for the next `/write-article`.

Note: makeseo grows keywords through the planning pipeline; to add brand-new keyword ideas, the
user does that in the dashboard ("Add keywords"). This command works with the project's existing
keyword set.
