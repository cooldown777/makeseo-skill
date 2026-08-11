---
description: List the project's own published URLs for cross-linking
argument-hint: "[project_id] [keyword]"
---

# /internal-links

Internal links spread authority between related pages. makeseo folds them into generated
articles automatically, but you can also list candidates to guide manual edits or the user.

1. **List** — `GET /internal-links?project_id=$PID&keyword=…`. Returns the project's own
   **published** pages (title + exact `url` + description), optionally filtered loosely by
   keyword. Only live URLs are returned, so no link is dead.

2. **Use them well** (if editing content by hand):
   - Take exact URLs from the response; never guess a path.
   - Place them in the middle of substantive paragraphs, not the intro or conclusion.
   - Use descriptive anchor text — never "click here".
   - Space links at least two paragraphs apart.

3. Never link to a competitor's domain. For cross-linking a brand-new article, prefer the
   pillar/cluster pages the calendar is built around.
