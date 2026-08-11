---
description: Group keywords into topic clusters (pillar + supporting) and surface gaps
argument-hint: "[project_id]"
---

# /cluster-plan

Ranking is won by **clusters**, not stray keywords: one pillar keyword plus a handful of
supporting articles that link back to it. This command reads the keyword set and reshapes the
flat list into that structure.

1. **List** — `GET /keywords?project_id=$PID`. Each keyword carries `cluster_id`, `is_pillar`,
   `intent`, `difficulty`, `measured`, and `volume` (display string — show a number **only** when
   `measured: true`; otherwise "not available", never a guess).

2. **Group.** Bucket keywords by `cluster_id`. In each bucket, name the pillar (`is_pillar: true`)
   and list its supporting keywords. Keywords with no `cluster_id` are unclustered — flag them.

3. **Judge each cluster** against the thresholds in `rules/seo-thresholds.json` (`cluster`):
   - Fewer than `min_supporting_articles` supporting pieces → **thin cluster**, needs more.
   - More than `max_supporting_articles` → risk of overlap; consolidate or split.
   - No pillar → **orphan cluster**; pick the highest-intent/volume term to promote.
   - Respect `one_url_per_cluster`: two keywords aiming the same page cannibalize each other.

4. **Cross-check coverage** — `GET /articles?project_id=$PID` to see which cluster keywords already
   have a planned or published article, and which are gaps with no article behind them.

5. **Recommend.** Present clusters as pillar → supporting, mark gaps, and propose the next
   `/write-article` targets (fill the pillar first, then its thinnest supporting slots). Weave the
   cluster together with `/internal-links`.

Full methodology, the pillar/supporting model, and gap scoring: `references/cluster-planning.md`.
