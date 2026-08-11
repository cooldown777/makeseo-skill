---
description: makeseo overview and the proper SEO process
---

# /makeseo

Give the user a short orientation, then offer to start.

1. One-line what makeseo is: **it generates and publishes SEO articles for you** on a rolling
   content calendar, with real keyword data, a backlink exchange, a technical audit, and
   AI-visibility tracking.
2. Confirm the key is set: `curl -s -H "Authorization: Bearer $MAKESEO_API_KEY" https://makeseo.co/api/v1/projects | jq '.count'`. If it fails, run `/makeseo-setup`.
3. Show the process and ask where they want to start:

   1. `/makeseo-setup` — key + CMS + Search Console
   2. `/gsc-audit` — audit BEFORE writing (fix what ranks first)
   3. `/keyword-research` — real volume
   4. `/content-calendar` — the rolling plan
   5. `/write-article` — makeseo writes a planned topic, then publish
   6. `/backlinks` — feed the exchange
   7. `/optimize` — refresh page-2 pages
   8. `/ai-visibility` — grow AI citations

Do not write article HTML yourself — makeseo generates the article. Your job is to drive the
loop well.
