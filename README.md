# makeseo-skill

**SEO automation for AI agents.** Drive [makeseo](https://makeseo.co) from Claude Code (or any
agent that can run `curl` + `jq`, or Node): real keyword volume, **makeseo-generated articles**,
CMS publishing, a backlink exchange, topic-cluster planning, a technical site audit, Search
Console analysis, and AI-visibility (GEO) tracking.

Unlike a write-it-yourself content tool, **makeseo writes the article for you** — you pick the
topic, trigger generation, judge and optimize the result, and publish. This skill is the
agent-facing wrapper around the makeseo REST API.

**→ [makeseo.co/skill](https://makeseo.co/skill)** — what it does in 60 seconds, and a 3-day trial.

## Install

```bash
npx skills add cooldown777/makeseo-skill
```

Or copy this folder into your agent's skills directory (Claude Code: `~/.claude/skills/makeseo`
or a project `.claude/skills/makeseo`). The files in `commands/` register as slash commands.

## Setup

1. Create an API key in makeseo → **Settings → API keys** (shown once; makeseo stores only its
   SHA-256 hash).
2. Export it:
   ```bash
   export MAKESEO_API_KEY=mk_live_your_key_here
   ```
3. Verify:
   ```bash
   curl -s -H "Authorization: Bearer $MAKESEO_API_KEY" https://makeseo.co/api/v1/projects | jq .
   # or: node scripts/makeseo.mjs projects
   ```
4. Run `/makeseo-setup`, then follow the 8-step process in `SKILL.md`.

## The SEO process (do it in order)

1. **Set up** — validate the key, confirm a CMS target and Google Search Console.
2. **Audit first** — read the technical audit + Search Console *before* writing. Fixing what
   already ranks is the fastest win.
3. **Keywords → clusters** — pull keywords with real volume, group them into pillar + supporting
   clusters (`is_pillar` / `cluster_id`).
4. **Plan** — the content calendar is already rolling; topics are scheduled ahead.
5. **Write** — trigger generation (makeseo writes the piece), validate the body, publish.
6. **Backlinks** — feed the exchange by referencing network members.
7. **Optimize** — refresh page-2 pages using audit + GSC signals.
8. **AI visibility** — track and grow citations in ChatGPT / Perplexity / Gemini answers.

## Commands

| Command | What it does |
|---|---|
| `/makeseo` | Overview + the 8-step process |
| `/makeseo-setup` | Validate the key, confirm a CMS target + GSC, list projects |
| `/gsc-audit` | Technical audit + Search Console (cannibalization, decay, striking distance) |
| `/keyword-research` | Project keywords with real volume; refresh stale volume |
| `/cluster-plan` | Group keywords into pillar + supporting clusters |
| `/write-article` | Pick a planned topic → makeseo generates it → validate → publish |
| `/optimize` | Find page-2 pages via audit + GSC and refresh them |
| `/backlinks` | Credits, earned/scheduled links, how the exchange works |
| `/content-calendar` | List and understand the rolling content plan |
| `/ai-visibility` | GEO score, per-engine citation state |
| `/news` | Fresh, datable niche topics (Google News RSS) to feed the plan |
| `/seo-check` | Point users at the free public audit (`makeseo.co/seo-check`) |
| `/internal-links` | The project's own URLs to cross-link |
| `/publish` | Publish a ready article to a connected CMS |

## References

| File | Covers |
|---|---|
| `references/article-structure.md` | What makeseo produces, the house rules the validator enforces, the safe-edit (PUT) protocol |
| `references/audit-playbook.md` | The audit analyses — each with a threshold and a concrete action |
| `references/gsc-playbook.md` | Search Console data traps + the finding→plan back-channel |
| `references/cluster-planning.md` | Pillar + supporting clusters, one URL per cluster, internal-link flow |
| `references/onboarding-guide.md` | What makeseo captures at onboarding and why |
| `references/plans-and-backlinks.md` | Plan, article/website upsells, the backlink exchange |
| `references/platform-guide.md` | Where things live in the makeseo dashboard |

## Rules & scripts

- **`rules/seo-thresholds.json`** — the single source of every number the skill reasons with.
  On-page limits are mirrored from makeseo's own SEO knowledge base (by rule id); the analysis
  benchmarks are documented skill-side defaults. Cite a key; never hard-code a threshold.
- **`scripts/makeseo.mjs`** — a dependency-free Node CLI over every endpoint.
- **`scripts/check-article-html.mjs`** — validate an article body against the house rules
  (a gate: exit non-zero on any violation).
- **`scripts/news-topics.mjs`** — fresh, dated niche topics from Google News RSS (no key).

All scripts are dependency-free **Node.js** (Node 18+). `curl` + `jq` cover the same API if you
prefer the shell.

## Validating a generated article

makeseo writes the HTML; you don't. But after an export or a dashboard body edit, confirm the
body still honours the house rules (fragment-only, black-on-white, unique H2 ids, resolving
table-of-contents anchors, image alt text, distributed internal links, no competitor links):

```bash
node scripts/makeseo.mjs article --article $AID \
  | jq -r '.article.body_html' \
  | node scripts/check-article-html.mjs - --domain yoursite.com --competitors rival.com
```

Exit `0` = clean, `1` = violations (one line each), `2` = usage/IO error. `/write-article` and
`/optimize` run it as a readiness gate.

## The backlink exchange

makeseo connects real businesses in a peer network. When a generated article references another
member, makeseo credits your project; more given → more received from real, high-DR sources.
`GET /backlinks` is the org ledger; `GET /backlink-targets` lists member domains. makeseo folds
eligible links into generated articles automatically — you don't place them by hand. Free/trial
accounts don't participate, and their published articles carry a makeseo signature (appended at
delivery, so it disappears on upgrade). Never link a competitor.

## API cheatsheet (curl)

```bash
BASE=https://makeseo.co/api/v1; H="Authorization: Bearer $MAKESEO_API_KEY"
curl -s -H "$H" "$BASE/projects" | jq .
curl -s -H "$H" "$BASE/keywords?project_id=$PID" | jq '.keywords[] | {keyword, volume, measured}'
curl -s -H "$H" "$BASE/audit?project_id=$PID" | jq '.audit.issues'
curl -s -H "$H" "$BASE/search-console?project_id=$PID&days=28" | jq '.search_console.state'
curl -s -X POST -H "$H" -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PID\",\"plan_item_id\":\"$ITEM\"}" "$BASE/articles" | jq '.article'
curl -s -X POST -H "$H" -H "Content-Type: application/json" \
  -d '{}' "$BASE/articles/$AID/publish" | jq '{status, url}'
```

## The 90-day sub-skill

`90-day-seo-sprint/` is an opinionated 13-week ordering (pre-launch → foundation → content
engine → authority) that routes every task to a real parent command. It triggers on prompts like
"where do I start with SEO" or "90-day SEO sprint".

## Requirements

- `MAKESEO_API_KEY` (org-scoped `mk_live_…` key).
- `curl` + `jq` for the shell examples, and/or Node 18+ for the `scripts/`.
- A makeseo account with a live subscription for generation/publishing (reads work on any plan).

## Notes

- The API is org-scoped; one key sees all projects. Get IDs from `GET /projects`.
- Generation and publishing are billable and gated by a live subscription + monthly article quota.
- Publishing returns a real live URL or fails — makeseo never marks an article published without one.

Endpoints and behavior track the makeseo product. MIT-licensed — see `LICENSE`. Changes are in
`CHANGELOG.md`.
