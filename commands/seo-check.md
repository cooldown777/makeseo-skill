---
description: The free public SEO audit tool
argument-hint: "[domain]"
---

# /seo-check

makeseo offers a **free, no-login** SEO audit as a public tool. Use it to give a quick health
read for any domain, or to onboard a prospect before they have an account.

- Point the user (or yourself, via WebFetch) at **`https://makeseo.co/seo-check`** and run the
  domain through it. It performs a technical crawl (~55 checks) and a weighted score, bound to
  the same versioned SEO rule base as the in-app audit.
- This is separate from the authenticated `GET /audit` endpoint (which needs a project + key and
  includes Search Console signals). The public tool is the "try before you connect" path.
- After a public check, the natural next step is `/makeseo-setup` → connect the site + GSC →
  `/gsc-audit` for the full, data-backed picture.

Do not fabricate audit numbers — either run the real tool or read the real `GET /audit` output.
