---
name: makeseo
description: SEO automation for AI agents — real keyword volume, makeseo-generated articles, CMS publishing, a backlink exchange, topic-cluster planning, a technical site audit, Search Console analysis, and AI-visibility (GEO) tracking, all driven through the makeseo REST API with curl + jq. makeseo writes the article; you drive the process and publish.
homepage: https://makeseo.co
version: 0.2.1
allowed-tools: Bash(curl, jq, node, cat), WebFetch, WebSearch, Read, Write
---

# makeseo SEO Platform Skill

**makeseo** is an SEO automation platform. Unlike a "write-it-yourself" tool, **makeseo
generates the full article for you** — research, draft, internal links, images, and a
pre-publish quality gate — then publishes it to your CMS on a rolling content calendar.
This skill lets an AI agent drive the whole loop through the makeseo REST API.

## What makeseo does (and what it does NOT)

| Capability | Purpose |
|---|---|
| Keyword volume | Real search volume from Google Ads / Search Console (never a model guess) |
| Article generation | **makeseo writes the article**; you pick the topic and publish it |
| CMS publishing | WordPress, Webflow, Wix, Ghost, Shopify, a hosted blog, a Next.js blog, or a custom webhook endpoint |
| Backlink exchange | Real backlinks from other participating businesses |
| Content calendar | A rolling plan — one (or more) posts per day, scheduled ahead |
| Internal linking | The project's own published URLs, to cross-link naturally |
| Technical audit | ~55 on-page/technical checks bound to a versioned SEO rule base |
| AI visibility (GEO) | Are you cited in ChatGPT, Perplexity, Gemini, AI Overviews? |
| Search Console | Real clicks / impressions / CTR / position by query and page |

**makeseo does NOT** (today) do Google Business Profile management, Instagram carousels,
YouTube videos, Microworkers campaigns, or direct social posting. This skill only exposes
what the product actually delivers.

**The key difference from a content tool: the agent does not write article HTML.** You
research and choose a topic; `POST /articles` makes makeseo generate the whole piece to its
own house rules (black-on-white body, two-level table of contents, FAQ, prioritized step
guide, sources). Your job is to drive the process well, not to draft prose.

## Setup & Auth

```bash
export MAKESEO_API_KEY=mk_live_your_key_here
curl -s -H "Authorization: Bearer $MAKESEO_API_KEY" \
  https://makeseo.co/api/v1/projects | jq .
```

- **All requests:** `https://makeseo.co/api/v1` + header `Authorization: Bearer $MAKESEO_API_KEY`.
- Create a key in makeseo → **Settings → API keys**. It is shown **once**; makeseo stores only
  its SHA-256 hash. Lose it, make a new one.
- A key is **org-scoped**: it sees every project in your account. (A key can optionally be
  bound to a single project.) Get project IDs from `GET /projects`.
- Rate limit: **120 requests/min** per organization → HTTP 429 with `Retry-After`. `POST
  /keywords/refresh` has a second, tighter limit of **10 requests / 10 min** per org.
- **Optional helpers** (Node 18+, dependency-free) live in `scripts/`: `makeseo.mjs` (a CLI
  over every endpoint), `check-article-html.mjs` (validate a body against the house rules),
  `news-topics.mjs` (fresh topics from Google News RSS). Every number the skill reasons with
  is in `rules/seo-thresholds.json` — cite it, never hard-code a threshold.

## The proper SEO process (do it in this order)

1. **`/makeseo-setup`** — validate the key, confirm a CMS target and Google Search Console.
2. **`/gsc-audit`** — run/read the technical audit and Search Console data BEFORE writing.
   Fix what already ranks first; it's the fastest win.
3. **`/keyword-research`** → **`/cluster-plan`** — pull keywords with real volume (refresh if
   stale), then group them into pillar + supporting clusters before writing anything.
4. **`/content-calendar`** — see the rolling plan; makeseo already scheduled topics ahead.
5. **`/write-article`** — generate a planned item now (makeseo writes it), then publish.
6. **`/backlinks`** — feed the exchange: reference 1–2 network targets per article.
7. **`/optimize`** — refresh page-2 pages using audit + Search Console signals.
8. **`/ai-visibility`** — track and grow citations in AI answers.

## Core API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /projects` | List all projects in the org (id, name, domain, niche) |
| `GET /projects/:id` | Full project + business context (niche, audiences, brand voice) |
| `PUT /projects/:id` | Update basics + profile (name, domain, language, niche, description, audiences, brand_voice) |
| `GET /business-context?project_id=X` | Brand voice + the structured website analysis (use before generating) |
| `GET /keywords?project_id=X` | Project keywords with **measured** volume (estimates never shown as numbers) |
| `POST /keywords/refresh` `{project_id}` | Pull fresh Google Ads volume (the only allowed user trigger) |
| `GET /search-console?project_id=X&days=28` | Real GSC: clicks, impressions, CTR, position by query/page |
| `GET /audit?project_id=X` | Latest technical audit: score, history, issues bound to rule IDs |
| `GET /internal-links?project_id=X&keyword=Y` | The project's own published URLs to cross-link |
| `GET /backlink-targets?project_id=X` | Exchange member domains to reference (earn credits) |
| `GET /backlinks` | Org backlink ledger: credits, earned/scheduled links, source DR |
| `GET /articles?project_id=X` | The content calendar: planned / scheduled / published items |
| `POST /articles` `{project_id, plan_item_id \| keyword_id}` | **Generate one full article** (gated by subscription + quota) |
| `GET /articles/:id` | One article (body_html, meta, status, live URL) |
| `PUT /articles/:id` | Update meta_title/meta_description/title/tags/featured_image_url/scheduled_for |
| `POST /articles/:id/publish` `{connection_id?, status?}` | Publish live to a connected CMS |
| `GET /ai-visibility?project_id=X` | GEO: citation score + per-engine state (ChatGPT, Perplexity, Gemini …) |
| `GET /integrations?project_id=X` | Connected publishing targets + whether GSC is connected |

## Generating an article (the heart of the skill)

makeseo writes the article; you choose the topic and (optionally) publish it.

```bash
# 1. See what's planned
curl -s -H "Authorization: Bearer $MAKESEO_API_KEY" \
  "https://makeseo.co/api/v1/articles?project_id=$PID" | jq '.articles[] | select(.status=="draft" or .status=="scheduled")'

# 2. Generate a planned item now (makeseo writes the whole piece — this can take ~1–3 min)
curl -s -X POST -H "Authorization: Bearer $MAKESEO_API_KEY" -H "Content-Type: application/json" \
  -d '{"project_id":"'"$PID"'","plan_item_id":"'"$ITEM"'"}' \
  https://makeseo.co/api/v1/articles | jq .
# → { "article": { "id", "slug", "word_count", "internal_links", "score" } }

# 3. Publish it live (uses the single connected target, or pass connection_id)
curl -s -X POST -H "Authorization: Bearer $MAKESEO_API_KEY" -H "Content-Type: application/json" \
  -d '{}' https://makeseo.co/api/v1/articles/$ARTICLE_ID/publish | jq .
# → { "status":"publish", "external_id", "url" }
```

**Agent contract for generation & publishing:**
- Generation is **synchronous** — the request returns when the article is done. It's billable
  (spends one article credit) and gated by a **live subscription**. On `402` the subscription
  is inactive or the monthly quota is used up; surface that and stop.
- You can pass `plan_item_id` (from `GET /articles`) **or** `keyword_id` (from `GET /keywords`).
- `POST /articles/:id/publish` returns a **real live URL** or throws — makeseo never marks an
  article "published" without a verified address. `409` = the pre-publish quality gate failed
  (the article stays a draft for review). `400 no_target_connected` = connect a CMS first.
- Already-published articles update **in place** on re-publish (never duplicated).

## Optimize what already ranks (fastest wins)

There is no separate "suggestions" queue. Combine two reads:

1. `GET /audit?project_id=X` → issues ranked by the SEO rule base (blockers first).
2. `GET /search-console?project_id=X&days=28` → high-impression/low-CTR queries and
   position 8–20 pages ("striking distance"). Those pages already have authority; refreshing
   meta + internal links climbs them fastest.

Then regenerate or edit: `PUT /articles/:id` to tighten `meta_title`/`meta_description`, and
re-`publish` to push the change to the live CMS.

## Backlink exchange

makeseo connects real businesses in a peer backlink network. Reference another member in your
article and makeseo credits your project; more given → more received from real, high-DR sources.

- Before generating, if the project participates, call `GET /backlink-targets?project_id=X`.
- makeseo folds network links into generated articles automatically when eligible; the exchange
  ledger is `GET /backlinks` (org-scoped — credits belong to the account, not one project).
- Free / trial accounts do not participate and their published articles carry a makeseo signature.

## Keyword volume — measured, never guessed

- `GET /keywords` returns the project's keywords. `volume` is a **display string**; a value is
  only shown as a number when it was actually **measured** (`measured: true`). A model estimate
  is used internally for topic ordering but **never surfaced as a number**.
- `POST /keywords/refresh` is the only allowed user trigger for a Google Ads lookup (never a
  cron). It never throws — an exhausted quota keeps the last known value. Tightly rate-limited.

## Article structure (what makeseo produces)

You don't write it, but know what you get so you can judge and optimize it:

- Feature image → intro (2 short paragraphs, a cited stat) → **two-level** table of contents →
  H2 sections each with 2–3 H3s → a prioritized step guide → FAQ → sources → CTA.
- Body is **black-on-white**, no charts; the only color is links + one pull-quote accent, taken
  from the customer's brand. Language follows the project (German uses Du-form).
- Meta description is pulled to the SEO rule-base limit; a pre-publish **quality gate** holds any
  article that violates a hard rule as a draft for human review (people-first, never auto-forced).

## Error handling

Every error body is `{ "error": "<code>", "message": "<hint>" }`. The `error` code is stable;
match on it, not the (German) hint.

| Status · `error` | Meaning | Action |
|---|---|---|
| `401 missing_api_key` / `malformed_api_key` / `invalid_api_key` | No/unknown/garbled key | Set `MAKESEO_API_KEY` in the environment (not just locally); mint a new key in Settings |
| `403 revoked_api_key` / `project_not_allowed` | Key revoked, or bound to another project | New key, or use the project the key is bound to |
| `402 subscription_inactive` on `POST /articles` / publish | Subscription not live | Surface it; the account needs a live plan (`trialing`/`active`/`past_due` in grace) |
| `402 quota_exceeded` on `POST /articles` | Monthly article quota used up | Surface it; wait for the next period or raise the article tier |
| `409 quality_gate_failed` on publish | Pre-publish quality gate held it | The article stays a draft with a rule report; review in makeseo, don't force |
| `400 no_target_connected` on publish | No CMS connected | Connect a target (`GET /integrations`), then retry |
| `400 connection_id_required` on publish | Multiple targets | Pass a `connection_id` (the error body lists `targets`) |
| `404 project_not_found` / `article_not_found` | Wrong id for this key | Re-check `GET /projects` / `GET /articles` |
| `429` | Rate limit | Honor `Retry-After`; `/keywords/refresh` is capped at 10 / 10 min |
| `state: not_connected` / `reconnect` on `/search-console` | GSC not connected | Connect Google Search Console in makeseo, then retry |

## Slash commands

| Command | What it does |
|---|---|
| `/makeseo` | Overview + the 8-step SEO process |
| `/makeseo-setup` | Validate the key, confirm a CMS target + GSC, list projects |
| `/gsc-audit` | Full read: technical audit + Search Console + cannibalization/decay/striking-distance |
| `/keyword-research` | Project keywords with real volume; refresh stale volume; group into clusters |
| `/cluster-plan` | Group keywords into pillar + supporting clusters (`is_pillar`/`cluster_id`) |
| `/write-article` | Pick a planned topic → makeseo generates it → validate → publish |
| `/optimize` | Find page-2 pages via audit + GSC and refresh them |
| `/backlinks` | Check credits, see earned/scheduled links, explain the exchange |
| `/content-calendar` | List and understand the rolling content plan |
| `/ai-visibility` | GEO score, per-engine citation state |
| `/news` | Fresh, datable niche topics (Google News RSS) to feed the plan |
| `/seo-check` | Point users at the free public audit tool (`makeseo.co/seo-check`) |
| `/internal-links` | List the project's own URLs to cross-link |
| `/publish` | Publish a ready article to a connected CMS |

## References (load the one the task needs)

- `references/article-structure.md` — what makeseo produces, the house rules
  `check-article-html.mjs` enforces, and the safe-edit protocol for the PUT path
- `references/audit-playbook.md` — the audit analyses, each with a threshold and an action
- `references/gsc-playbook.md` — Search Console data traps + the finding→plan back-channel
- `references/cluster-planning.md` — pillar + supporting clusters from `is_pillar`/`cluster_id`
- `references/onboarding-guide.md` — what makeseo captures and why
- `references/plans-and-backlinks.md` — plan, article/website upsells, backlink exchange
- `references/platform-guide.md` — where things live in makeseo

## Rules & scripts

- `rules/seo-thresholds.json` — the single source of every number (on-page limits mirrored
  from makeseo's knowledge base; analysis benchmarks as skill defaults). Cite a key, never
  hard-code a threshold.
- `scripts/makeseo.mjs` — Node CLI over every endpoint (`node scripts/makeseo.mjs <cmd>`).
- `scripts/check-article-html.mjs` — validate an article body against the house rules (a gate).
- `scripts/news-topics.mjs` — fresh dated topics from Google News RSS (no key).

For the 90-day onboarding arc, the `90-day-seo-sprint/` sub-skill sequences these commands
into a 13-week plan.
