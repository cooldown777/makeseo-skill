# Onboarding — what makeseo captures and why

makeseo works best when the project profile is complete. These are the fields that shape every
generated article; you can read them via `GET /projects/:id` and `GET /business-context`, and
update the safe subset via `PUT /projects/:id`.

## Business profile (feeds every prompt)
- **niche** — the one-line category the site competes in.
- **description** — the canonical business summary. **This is the downstream source** every
  content step reads; keep it accurate.
- **audiences** — who the content is for (list). Drives tone and examples.
- **brand_voice** — tone guidance. A structured brand-voice profile (person, forbidden phrases)
  exists too, but is edited in the dashboard, not via the API.

## Site & language
- **domain**, **language** — language follows the project (German content uses Du-form). The
  website analysis narrative (in `business-context`) is regenerated with live metrics on each read.

## What you connect (not via this API — done in the dashboard)
- **A publishing target**: WordPress, Webflow, Wix, Ghost, Shopify, a makeseo-hosted blog, a
  Next.js blog, or a custom webhook endpoint. Without one, finished articles stay "ready to post".
- **Google Search Console**: required for the audit, striking-distance detection, and optimization.

## The rolling plan
Onboarding builds an initial content plan (keywords → titles → outlines). From then on it is
**rolling**: as an article publishes, a new topic slides in at the end. The plan is bound to a
live subscription and the remaining monthly article quota.
