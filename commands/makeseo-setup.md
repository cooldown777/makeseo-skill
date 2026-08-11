---
description: Validate the makeseo API key and confirm CMS + Search Console
---

# /makeseo-setup

1. **Key check.**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $MAKESEO_API_KEY" \
     https://makeseo.co/api/v1/projects
   ```
   - `200` → good. `401` → the key is missing/wrong; tell the user to create one in
     makeseo → **Settings → API keys** and `export MAKESEO_API_KEY=mk_live_…`.

2. **List projects** and let the user pick the one to work on; remember its `id` as `$PID`.
   ```bash
   curl -s -H "Authorization: Bearer $MAKESEO_API_KEY" https://makeseo.co/api/v1/projects | jq .
   ```

3. **Publishing target.** `GET /integrations?project_id=$PID`. If `publishing_targets` is empty,
   tell the user to connect a CMS (WordPress, Webflow, Wix, Ghost, Shopify, hosted blog,
   Next.js blog, or a custom endpoint). Without a target, generated articles stay "ready to post".

4. **Search Console.** Same response: `search_console.connected`. If false, tell the user to
   connect GSC — the audit and optimization depend on it.

5. Confirm readiness and suggest `/gsc-audit` next.
