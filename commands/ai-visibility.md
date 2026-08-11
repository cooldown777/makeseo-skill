---
description: GEO — track citations in AI answers (ChatGPT, Perplexity, Gemini …)
argument-hint: "[project_id]"
---

# /ai-visibility

makeseo tracks whether the brand is cited in AI answers and computes a GEO score. It **computes,
it doesn't guess** — figures come from measured prompt runs.

1. **Read** — `GET /ai-visibility?project_id=$PID`. Two blocks:
   - `prompts` — measured prompt analysis: a score (0–100), which providers were seen, and
     per-engine state (cited / mentioned / not cited).
   - `geo` — the deeper GEO analysis (six dimensions, recommendations) when one has run.

2. **Report honestly.**
   - `state: "empty"` means no analysis has run yet — that is **not** "zero visibility".
   - A platform with no access (e.g. AI Overviews, Copilot) is reported as not measurable, never
     as 0%. `null` = not measured; `0` = measured and zero. Keep that distinction.

3. **Recommend.** Every recommendation names the finding it came from (a number or a name). If
   there's no basis, there's no recommendation. To improve citations, point back to quotable,
   well-sourced articles (`/write-article`) and to fixing on-page issues (`/optimize`).
