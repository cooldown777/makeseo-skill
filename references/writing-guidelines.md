# How makeseo writes (so you can judge and optimize the output)

You do not draft article HTML — makeseo generates it. This reference tells you what a good
makeseo article looks like, so you can review a generated piece, tune its metadata, and decide
whether it's ready to publish.

## Structure (fixed, measured against a reference article)
Tags → H1 → meta → feature image → intro (2 short paragraphs) → **two-level** table of contents →
H2 sections, each with **2–3 H3s** → a prioritized step guide → FAQ → sources → CTA.

## Presentation rules
- **Black on white.** The body carries no accent color, tint, or chart. The only two colored
  elements are inline links and one pull-quote's left edge — both taken from the customer's brand
  (or neutral if none is detected). Emphasis is size/weight/italics/whitespace, plus 1px rules.
- **No diagrams.** Data that would be a chart is rendered as a table.
- **Language follows the project.** German content is Du-form. A language guard checks the whole
  article after generation.

## Quality signals to check on a generated article
- `score` (from `POST /articles` / `GET /articles/:id`) — makeseo's own article score.
- **Intro**: a hook and a cited statistic, not "In today's world…".
- **FAQ**: 4–6 real questions, each answered in the first sentence (AI engines extract it).
- **Sources**: 2–3 real authority links; never a competitor blog for the same keyword.
- **Meta description**: pulled to the SEO rule-base length limit.
- **Internal links**: present, mid-paragraph, descriptive anchors (see `/internal-links`).

## What you can change via the API
`PUT /articles/:id` → `meta_title`, `meta_description`, `title`, `tags`, `featured_image_url`,
`scheduled_for`. The **body** is edited only in the dashboard editor. After changing metadata on
a live article, re-`publish` to push it to the CMS (updates in place, never a duplicate).

## The pre-publish quality gate
If an article violates a hard SEO rule, makeseo does **not** silently drop it — it stays a draft
with a rule-by-rule report for human review (people-first). A `409` on publish is that gate.
