# Article structure — what makeseo produces, and the house rules that gate it

You do not draft article HTML. **makeseo generates the whole article server-side** (`POST /articles`,
synchronous, up to ~200 s, billable). Your job is to pick the topic, trigger generation, judge the
result, tune its metadata, and publish. This reference is the single source of truth for what a good
makeseo article looks like and for the exact house rules that `scripts/check-article-html.mjs`
enforces — so the doc and the gate never diverge.

Every **threshold** below cites a key in `rules/seo-thresholds.json` — never hard-code a limit in
prose. Descriptive counts of makeseo's output that have no threshold key (e.g. 2 intro paragraphs,
2–3 H3s per H2, a 4–6-question FAQ, 2–3 sources) are product behaviour, stated here for what to
expect, not skill thresholds to enforce.

---

## A. What makeseo produces

### The fixed anchor order
makeseo builds every article to one measured blueprint. The order is not negotiable:

```
Tags → H1 → meta → feature image → intro (2 short paragraphs, one cited stat)
     → two-level table of contents
     → H2 sections, each with 2–3 H3s
     → prioritized step guide → FAQ → sources → CTA
```

- **The H1 comes from the blog FRAME, not the article body.** The hosted-blog page (or CMS template)
  renders Tags, H1, publish date and reading time; the body fragment you validate starts at the
  feature image. This is why an H1 inside the body is a hard violation (see Part B) — there must be
  exactly one H1 (`single_h1` = 1) and the frame owns it.
- **Intro** = two short paragraphs with a hook and one cited statistic linked to its source — not
  "In today's fast-paced world…".
- **Two-level table of contents** whenever the article has at least `min_h2_per_article` (2) H2s: it
  lists each H2 and its H3s, each entry an in-page `#anchor` to the `<section>` wrapper that heading
  opens (makeseo anchors the section, not the `<h2>`).
- **Each H2 section carries 2–3 H3s** — the two-level depth the TOC reflects.
- **Step guide** = a prioritized, do-this-first list near the end. **FAQ** = 4–6 real questions, each
  answered in its first sentence in `faq_direct_answer_words` (40–60) words so AI engines can extract
  it. **Sources** = 2–3 real authority links, never a competitor blog for the same keyword. **CTA**
  closes.

### Presentation
- **Black on white.** The body carries no accent colour, tint, fill, or coloured bar. The only two
  coloured elements are inline links and one pull-quote's left edge, both taken from the customer's
  brand identity (or neutral when none is detected). Emphasis is size, weight, italics and whitespace,
  plus thin 1px neutral rules.
- **No diagrams.** Anything that would be a chart is rendered as a data table. No inline SVG, no CSS
  bars, not even black-and-white.
- **No JavaScript** in the body. FAQ is H3 + answer, the checklist is a list, the TOC jumps via anchors.

### Language and length
- **Language follows the project.** German content is **Du-form**. A language guard checks the whole
  article after generation; a wholesale mismatch is regenerated once, scattered slips are only warned.
- **Meta is pulled to the rule-base length**: `meta_title` to `title_length_chars` (50–60),
  `meta_description` to `meta_description_length_chars` (120–155).
- **There is NO fixed word count.** `target_word_count` is `null` on purpose — length is derived from
  what the top results need, then a little beyond. Never assert a word count as a rule or a target.

### Quality signals to check on a generated article
- `score` (returned by `POST /articles`, and on `GET /articles/:id`) — makeseo's own article score.
- Intro has a hook and a cited stat; FAQ answers first; sources are real authorities; internal links
  are present, mid-paragraph, with descriptive anchors (pull candidates from `GET /internal-links`).

---

## B. The house rules `scripts/check-article-html.mjs` enforces

The validator reads a **body fragment** (the article body HTML, e.g. `article.body_html`) and checks
these rules exactly. Document them here 1:1 — if you change one, change both.

1. **Fragment only.** These tags are forbidden anywhere in the body:
   `html`, `head`, `body`, `!doctype`, `h1`, `style`, `script`, `svg`, `canvas`, `iframe`.
   (`h1` is forbidden because the frame supplies it — `single_h1` = 1; `style`/`script`/`svg`/`canvas`
   because the body is JS-free and diagram-free.)

2. **No colour in the body.** Reject any inline `style` containing `color`, `background`, or
   `background-color`; any hex colour (`#rrggbb`); and any CSS custom property `var(--…)`. Colour lives
   only in the stylesheet outside the fragment, never in `body_html`.

3. **No duplicate ids.** Anchor ids live on `<section id>` wrappers, on `<h3 id>`, and on step
   `<li id>` — **not on the `<h2>` itself** (makeseo wraps each section and puts the id on the
   wrapper). The validator collects ids from *every* element; two elements sharing an id break the
   jump link (two targets for one `#anchor`) and are flagged.

4. **Two-level TOC integrity.** When the body has `>= min_h2_per_article` (2) H2s, a two-level TOC is
   expected, and **every in-page `#anchor` must resolve to some element id in the fragment** — the
   section wrapper, a heading, or a step item. A dangling anchor (points at an id nothing carries)
   fails — a broken jump link is worse than no TOC.

5. **Images.** Every `<img>` needs non-empty `alt` text. makeseo *does* set `width`/`height` and
   `loading` on its images (correct markup for layout stability / no cumulative layout shift) — that
   is expected, not a violation.

6. **Internal links (with `--domain`).** The body needs `>= min_internal_links_per_article` (3) links
   to the project's own domain, spread at least `internal_link_min_paragraph_gap` (2) paragraphs apart.
   Clustered links (several in adjacent paragraphs) fail. In-page `#anchors` and `mailto:`/`tel:` links
   are navigation, **not** internal links and don't count.

7. **Competitors (with `--competitors`).** No link may point to a competitor domain you listed.

8. **Meta (optional).** `--meta-title` is checked against `title_length_chars` (50–60);
   `--meta-description` against `meta_description_length_chars` (120–155).

Exit code `0` = clean, `1` = violations found, `2` = I/O error.

---

## C. How and when to run the validator

Validate a saved fragment, declaring your domain and competitors:

```bash
node scripts/check-article-html.mjs body.html --domain example.com --competitors rival.com
```

Validate straight from the API without a temp file (pipe form, `-` reads stdin):

```bash
node scripts/makeseo.mjs article --article $AID | jq -r '.article.body_html' \
  | node scripts/check-article-html.mjs -
```

You can also pass `--meta-title "…"` and `--meta-description "…"` to length-check metadata in the same run.

**When to run it:**
- After an **HTML export** or a **dashboard body edit**, before pushing anything live.
- As the **readiness gate** inside `/write-article` (right after generation) and `/optimize` — a clean
  exit `0` is the go signal; `1` means fix or flag before publishing.

Note: the validator is a linter for the *fragment's* house rules. The authoritative pre-publish gate is
still makeseo's own (Part D) — the two agree because both trace to `rules/seo-thresholds.json` and the
product knowledge base, but the server gate is what blocks a live publish.

---

## D. Safe-edit protocol for metadata (the PUT path)

The body is **dashboard-only**. Through the API you can change exactly six fields, safely:

1. **Read first, keep as rollback.** `GET /articles/:id` (or `node scripts/makeseo.mjs article
   --article $AID`). Stash `meta_title`, `meta_description`, `title`, `tags`, `featured_image_url`,
   `scheduled_for` so you can restore them.

2. **Change only what PUT allows.** `PUT /articles/:id` accepts `meta_title`, `meta_description`,
   `title`, `tags` (string[]), `featured_image_url`, `scheduled_for` — nothing else. `body_html` is not
   editable here; `slug` and `status` are not settable. Keep meta within the length rules
   (`title_length_chars` 50–60, `meta_description_length_chars` 120–155).

   ```bash
   node scripts/makeseo.mjs update-article --article $AID \
     --meta-title "…" --meta-description "…" --tags "seo,ranking"
   ```

3. **Heed `sync_hint`.** The PUT response returns `sync_hint`. If the article is **live**, the change
   is not on the CMS yet — re-run `POST /articles/:id/publish` (`node scripts/makeseo.mjs publish
   --article $AID`) to push it. Publish **updates in place, never creates a duplicate** (compare-and-swap
   + idempotency behind the scenes). That is exactly what `sync_hint` reminds you to do.

4. **A `409` on publish is the quality gate, not an error to force past.** `quality_gate_failed` means
   the article violates a hard SEO rule; makeseo does **not** silently drop it — it stays a `draft` with
   a rule-by-rule (rule-id → pass/fail) report for human review (people-first). Fix the flagged rule,
   then publish again. Never try to route around the gate.

5. **Verify.** Re-read with `GET /articles/:id` and confirm the fields and `status`/`external_url`
   reflect what you intended. "Published" means a real live `url` came back — the status alone is never
   the proof.
