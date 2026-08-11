---
description: Check exchange credits and explain the backlink network
argument-hint: "[project_id]"
---

# /backlinks

makeseo runs a peer backlink exchange: link to another member in an article and makeseo credits
your project; more given → more received from real, high-DR businesses.

1. **Ledger** — `GET /backlinks` (org-scoped; credits belong to the account, not one project).
   Report: available credits, earned vs scheduled links, source domain ratings, and recent
   history. Never invent a DR or a count — show only what's returned; omit weak/empty values.

2. **Targets for the next article** — `GET /backlink-targets?project_id=$PID` lists member
   domains to reference. makeseo folds eligible network links into generated articles
   automatically, so you usually don't place them by hand — but you can point the user at good
   targets and confirm the project participates.

3. **Explain the economics** if asked: free/trial accounts don't participate (and their
   published articles carry a makeseo signature); paid accounts exchange links and drop the
   signature automatically.

Do not link to a competitor's domain, ever.
