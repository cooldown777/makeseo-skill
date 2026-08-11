# Plans, quota, and the backlink exchange

## One plan, two upsells
makeseo sells **one plan, "Grow" (89 €/mo)** with two independent add-on dimensions:

| | Included | Articles | Websites |
|---|---|---|---|
| **Grow** | 5 seats, daily rank tracking (100 keywords), 30 prompts | **30/mo** | **1** |
| **Article upsell** | — | 60 for **+85 €**, 90 for **+160 €** | — |
| **Website upsell** | — | — | each extra **+49 €/mo** |

- The **monthly article quota** gates generation, not publishing. 30 ⇒ ~1 post/day, 60 ⇒ 2, 90 ⇒ 3.
- **Generation and publishing require a live subscription** (`trialing` / `active` / `past_due`
  in grace). If the subscription lapses, generation and further publishing pause — already-live
  articles stay live. `POST /articles` and `POST /articles/:id/publish` return `402` when inactive.
- **Trial** is 3 days with a card and replaces the old free window.

## What "free / trial" means for the API
A trial or free account (no live paid subscription):
- does **not** participate in the backlink exchange (neither as source nor target), and
- its published articles carry a **makeseo signature** (appended at delivery, so it disappears
  automatically on upgrade — even under already-published posts).

## The backlink exchange
makeseo connects real businesses in a peer network. When a generated article references another
member, makeseo credits the project; more links given → more received from real, high-DR sources.

- `GET /backlinks` — the org ledger: credits, earned vs scheduled links, source DR, history.
- `GET /backlink-targets?project_id=X` — member domains to reference. makeseo folds eligible
  links into generated articles automatically (it doesn't need you to place them by hand).
- Never link to a competitor's domain.
