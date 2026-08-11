# Platform guide — where things live in makeseo

A quick map so you can tell the user where to click for things the API doesn't do.

- **Settings → API keys** — create/revoke the `mk_live_…` key this skill uses. Shown once.
- **Settings → Integrations** — connect a publishing target (WordPress, Webflow, Wix, Ghost,
  Shopify, hosted blog, Next.js blog, custom endpoint) and Google Search Console / GA4.
- **Content plan** — the rolling calendar (what the `GET /articles` endpoint reflects). Drag to
  reschedule; the "Publish now" button forces an immediate publish.
- **Article editor** — the only place to edit an article's **body** (structured blocks → one
  renderer). The API can change metadata/schedule, not the body.
- **Analytics** — Search Console performance, rank tracking, GA4 growth, and the GEO / AI-
  visibility dashboards (what `GET /ai-visibility` reflects).
- **Billing** — plan "Grow", the article tier (30/60/90), and extra websites.
- **`makeseo.co/seo-check`** — the free, public, no-login audit tool.

## Publishing model (important)
There is exactly **one** publishing path. `scheduled` articles are published by a daily sweep;
`POST /articles/:id/publish` is the manual trigger. An article is only "published" when it is live
with a verified URL (`external_url`). Push CMSs (WordPress/Shopify/Webflow/Ghost/Wix) are verified
by an HTTP check; pull targets (hosted blog, Next.js blog, webhook) are live by construction.
