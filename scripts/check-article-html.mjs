#!/usr/bin/env node
// check-article-html.mjs — validate a makeseo article body against the house rules.
//
// makeseo GENERATES the article HTML; you do not draft it. But you do read it
// (`GET /articles/:id` -> `body_html`), export it, and sometimes edit metadata or
// the body in the dashboard. This validator is the executable form of the house
// rules documented in `references/article-structure.md`: run it on a body fragment
// to confirm nothing broke — a dangling table-of-contents anchor after an edit, a
// stray colour, a competitor link, an <svg> where a table belongs.
//
// It is a GATE, not advice: a violation exits non-zero. The `/write-article` and
// `/optimize` commands run it before treating an article as ready.
//
// Dependency-free (Node 18+, standard library only). Thresholds come from
// `rules/seo-thresholds.json` so no number is hard-coded here.
//
// Usage:
//   node check-article-html.mjs body.html
//   curl -s .../articles/$AID -H "Authorization: Bearer $MAKESEO_API_KEY" \
//     | jq -r '.article.body_html' | node check-article-html.mjs -
//   node check-article-html.mjs body.html --domain example.com \
//     --competitors rival.com,othertool.io
//   node check-article-html.mjs body.html --meta-title "…" --meta-description "…"
//
// Exit codes: 0 = clean, 1 = one or more violations, 2 = usage/IO error.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_THRESHOLDS = resolve(HERE, "..", "rules", "seo-thresholds.json");

// makeseo owns the document shell, the <h1>, the <head>, and all CSS/JS.
// Charts/diagrams are rendered as tables, never drawn.
const FORBIDDEN_TAGS = new Set([
  "html", "head", "body", "!doctype", "h1", "style", "script",
  "svg", "canvas", "iframe",
]);

const COLOUR_RE = /(^|;)\s*(color|background|background-color)\s*:/i;
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const VAR_RE = /var\(\s*--/i;

function parseArgs(argv) {
  const args = { input: null, domain: null, competitors: "", metaTitle: null, metaDescription: null, thresholds: DEFAULT_THRESHOLDS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--domain") args.domain = argv[++i];
    else if (a === "--competitors") args.competitors = argv[++i] ?? "";
    else if (a === "--meta-title") args.metaTitle = argv[++i];
    else if (a === "--meta-description") args.metaDescription = argv[++i];
    else if (a === "--thresholds") args.thresholds = argv[++i];
    else if (!a.startsWith("--") && args.input === null) args.input = a;
  }
  return args;
}

function attrMap(raw) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  let m;
  while ((m = re.exec(raw))) {
    let val = m[2] ?? "";
    if (val && (val[0] === '"' || val[0] === "'")) val = val.slice(1, -1);
    attrs[m[1].toLowerCase()] = val;
  }
  return attrs;
}

function scan(html) {
  const tagRe = /<(\/?)([a-zA-Z!][-a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const state = {
    violations: [], h2Count: 0, ids: new Set(), dupeIds: new Set(),
    images: [], links: [], linkParas: [], para: 0,
  };
  let m;
  const lineAt = (idx) => html.slice(0, idx).split("\n").length;

  while ((m = tagRe.exec(html))) {
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const line = lineAt(m.index);
    if (closing) continue;
    const attrs = attrMap(m[3] || "");

    if (FORBIDDEN_TAGS.has(tag)) {
      state.violations.push(`[${line}] forbidden-tag: <${tag}> — makeseo owns the document shell / renders data as tables; the body is a fragment.`);
    }

    const style = attrs.style || "";
    if (style && (COLOUR_RE.test(style) || HEX_RE.test(style) || VAR_RE.test(style))) {
      state.violations.push(`[${line}] colour-in-body: inline style '${style.trim()}' — the body is black-on-white; colour lives only in the stylesheet.`);
    }

    // Anchor ids can sit on ANY element — makeseo puts them on <section id>
    // wrappers, <h3 id>, and step <li id>, not on the <h2> itself.
    const idAttr = (attrs.id || "").trim();
    if (idAttr) {
      if (state.ids.has(idAttr)) state.dupeIds.add(idAttr);
      state.ids.add(idAttr);
    }
    if (tag === "h2") state.h2Count += 1;
    if (tag === "p") state.para += 1;
    if (tag === "img") state.images.push({ line, alt: attrs.alt });
    if (tag === "a") {
      state.links.push({ line, href: (attrs.href || "").trim() });
      state.linkParas.push(state.para);
    }
  }
  return state;
}

function hostname(href) {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function validate(html, thresholds, domain, competitors) {
  const st = scan(html);
  const v = [...st.violations];
  const op = thresholds.onpage_mirrored || {};
  const an = thresholds.analysis_defaults || {};

  // 1. No duplicate ids — two targets for one #anchor breaks the jump link.
  for (const d of st.dupeIds) v.push(`duplicate-id: id '${d}' appears on more than one element.`);

  // 2. Two-level TOC when >= min_h2 sections; every in-page anchor must resolve
  //    to SOME element id in the fragment (section wrapper, heading, or step).
  const minH2 = (op.min_h2_per_article || {}).value ?? 2;
  for (const link of st.links) {
    if (link.href.startsWith("#")) {
      const frag = link.href.slice(1);
      if (!st.ids.has(frag)) v.push(`[${link.line}] dangling-anchor: href '#${frag}' resolves to no element id — a broken table-of-contents link.`);
    }
  }
  if (st.h2Count >= minH2) {
    const toc = st.links.filter((l) => l.href.startsWith("#"));
    if (toc.length === 0) v.push(`missing-toc: ${st.h2Count} H2 sections but no in-page anchor links — a two-level table of contents is expected.`);
  }

  // 3. Images: alt text. (width/height attributes are correct CLS markup.)
  for (const img of st.images) {
    if (!(img.alt || "").trim()) v.push(`[${img.line}] image-no-alt: <img> without alt text.`);
  }

  // 4. Links: no competitor domains; internal links distributed, not clustered.
  const comp = new Set(competitors.map((c) => c.trim().toLowerCase().replace(/^www\./, "")).filter(Boolean));
  const own = domain ? domain.toLowerCase().replace(/^www\./, "") : "";
  const internalParas = [];
  st.links.forEach((link, i) => {
    const href = link.href;
    const host = hostname(href);
    if (host && comp.has(host)) v.push(`[${link.line}] competitor-link: links to competitor '${host}'.`);
    // Internal content links only: an absolute link to our own domain, or a
    // root-relative path. In-page anchors (#toc), mailto:, tel: are navigation.
    if (own) {
      const isInternal = host === own || (host === "" && href.startsWith("/"));
      if (isInternal) internalParas.push(st.linkParas[i]);
    }
  });
  if (domain) {
    const minLinks = (op.min_internal_links_per_article || {}).value ?? 3;
    if (internalParas.length < minLinks) v.push(`too-few-internal-links: found ${internalParas.length} internal link(s) to ${domain}; the rule is >= ${minLinks}, distributed across the body.`);
    const gap = an.internal_link_min_paragraph_gap ?? 2;
    let clustered = 0;
    for (let i = 1; i < internalParas.length; i++) if (internalParas[i] - internalParas[i - 1] < gap && internalParas[i] !== 0) clustered++;
    if (clustered && internalParas.length >= 2) v.push(`clustered-internal-links: ${clustered} internal link(s) sit less than ${gap} paragraphs apart — spread them through the body.`);
  }

  return v;
}

function checkMeta(thresholds, title, desc) {
  const v = [];
  const op = thresholds.onpage_mirrored || {};
  if (title != null) {
    const t = op.title_length_chars || {};
    const n = title.length;
    if (!(n >= (t.min ?? 0) && n <= (t.max ?? 1e9))) v.push(`meta-title-length: ${n} chars (rule ${t.min}–${t.max}, ${t.rule_id}).`);
  }
  if (desc != null) {
    const d = op.meta_description_length_chars || {};
    const n = desc.length;
    if (!(n >= (d.min ?? 0) && n <= (d.max ?? 1e9))) v.push(`meta-description-length: ${n} chars (rule ${d.min}–${d.max}, ${d.rule_id}).`);
  }
  return v;
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.error("usage: node check-article-html.mjs <body.html|-> [--domain d] [--competitors a,b] [--meta-title t] [--meta-description d]");
    process.exit(2);
  }
  let html;
  try {
    html = args.input === "-" ? readStdin() : readFileSync(args.input, "utf8");
  } catch (exc) {
    console.error(`[2] cannot read ${args.input}: ${exc.message}`);
    process.exit(2);
  }
  let thresholds;
  try {
    thresholds = JSON.parse(readFileSync(args.thresholds, "utf8"));
  } catch (exc) {
    console.error(`[2] cannot read thresholds file ${args.thresholds}: ${exc.message}`);
    process.exit(2);
  }

  const competitors = args.competitors ? args.competitors.split(",") : [];
  const violations = [
    ...validate(html, thresholds, args.domain, competitors),
    ...checkMeta(thresholds, args.metaTitle, args.metaDescription),
  ];

  if (violations.length) {
    console.log(`FAIL — ${violations.length} violation(s):`);
    for (const line of violations) console.log(`  - ${line}`);
    process.exit(1);
  }
  console.log("OK — article body honours the makeseo house rules.");
}

main();
