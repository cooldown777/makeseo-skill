# makeseo-skill

**SEO automation for AI agents.** Drive [makeseo](https://makeseo.co) from Claude Code (or any
agent that can run `curl` + `jq`): real keyword volume, **makeseo-generated articles**, CMS
publishing, a backlink exchange, a technical site audit, and AI-visibility (GEO) tracking.

Unlike a write-it-yourself content tool, **makeseo writes the article for you** — you pick the
topic, trigger generation, and publish. This skill is the agent-facing wrapper around the makeseo
REST API.

## Install
Copy this folder into your agent's skills directory (for Claude Code: `~/.claude/skills/makeseo`
or a project `.claude/skills/makeseo`). The commands in `commands/` register as slash commands.

## Setup
1. Create an API key in makeseo → **Settings → API keys** (shown once).
2. Export it:
   ```bash
   export MAKESEO_API_KEY=mk_live_your_key_here
   ```
3. Verify:
   ```bash
   curl -s -H "Authorization: Bearer $MAKESEO_API_KEY" https://makeseo.co/api/v1/projects | jq .
   ```
4. Run `/makeseo-setup`, then follow the 8-step process in `SKILL.md`.

## What's here
- `SKILL.md` — the full capability + API reference the agent loads.
- `commands/` — slash commands (`/makeseo`, `/gsc-audit`, `/keyword-research`, `/write-article`,
  `/optimize`, `/backlinks`, `/content-calendar`, `/ai-visibility`, `/seo-check`,
  `/internal-links`, `/publish`, `/makeseo-setup`).
- `references/` — deeper playbooks (onboarding, plans & backlinks, audit, platform map, writing).
- `makeseo_cli.py` — an optional thin Python client over the same API (no dependencies; uses the
  standard library).

## Requirements
- `MAKESEO_API_KEY` (org-scoped `mk_live_…` key).
- `curl` and `jq` for the shell examples; Python 3.9+ for `makeseo_cli.py`.
- A makeseo account with a live subscription for generation/publishing (reads work on any plan).

## Notes
- The API is org-scoped; one key sees all projects. Get IDs from `GET /projects`.
- Generation and publishing are billable and gated by a live subscription + monthly article quota.
- Publishing returns a real live URL or fails — makeseo never marks an article published without one.

Not affiliated with any other SEO-skill project; endpoints and behavior track the makeseo product.
