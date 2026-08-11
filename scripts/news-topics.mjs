#!/usr/bin/env node
// news-topics.mjs — fresh, datable topics for a niche, from Google News RSS.
//
// Newsjacking works when you publish while a story is hot. This pulls the Google
// News RSS feed for one or more queries (no API key, no dependency), parses each
// item, de-duplicates by normalised title, keeps only the last N days, sorts by
// recency, and (optionally) writes a CSV. Feed a promising title into the
// makeseo content plan (add a keyword, then `generate`), not straight to prose.
//
// It never invents anything: every row carries the source outlet and the real
// article link the headline came from.
//
// Usage:
//   node news-topics.mjs "seo automation" "ai search"
//   node news-topics.mjs --days 3 --lang en --country US "content marketing"
//   node news-topics.mjs --csv topics.csv "programmatic seo"
//
// Flags: --days N (default 7), --lang xx (default en), --country XX (default US),
//        --max N (default 40), --csv PATH (also write a CSV).

function parseArgs(argv) {
  const flags = { days: 7, lang: "en", country: "US", max: 40, csv: null };
  const queries = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--days") flags.days = parseInt(argv[++i], 10) || 7;
    else if (a === "--lang") flags.lang = argv[++i] || "en";
    else if (a === "--country") flags.country = argv[++i] || "US";
    else if (a === "--max") flags.max = parseInt(argv[++i], 10) || 40;
    else if (a === "--csv") flags.csv = argv[++i] || null;
    else if (!a.startsWith("--")) queries.push(a);
  }
  return { flags, queries };
}

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

// A Google News RSS <title> is usually "Headline - Outlet"; split the source out.
function splitTitle(rawTitle, sourceTag) {
  if (sourceTag) return { title: rawTitle.replace(new RegExp(`\\s*-\\s*${sourceTag}$`), "").trim(), source: sourceTag };
  const idx = rawTitle.lastIndexOf(" - ");
  if (idx > 0) return { title: rawTitle.slice(0, idx).trim(), source: rawTitle.slice(idx + 3).trim() };
  return { title: rawTitle.trim(), source: "" };
}

function normalise(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function fetchFeed(query, { lang, country }) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
  const res = await fetch(url, { headers: { "User-Agent": "makeseo-skill/news-topics" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for query "${query}"`);
  const xml = await res.text();
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const rawTitle = tag(block, "title");
    const sourceTag = tag(block, "source");
    const { title, source } = splitTitle(rawTitle, sourceTag);
    const pub = tag(block, "pubDate");
    const link = tag(block, "link");
    if (!title) continue;
    items.push({ query, title, source, link, pubDate: pub, ts: pub ? Date.parse(pub) : NaN });
  }
  return items;
}

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["title", "source", "published", "query", "link"];
  const lines = [head.join(",")];
  for (const r of rows) lines.push([r.title, r.source, r.pubDate, r.query, r.link].map(esc).join(","));
  return lines.join("\n") + "\n";
}

async function main() {
  const { flags, queries } = parseArgs(process.argv.slice(2));
  if (queries.length === 0) {
    console.error('usage: node news-topics.mjs [--days N] [--lang en] [--country US] [--max N] [--csv PATH] "query" ["query2" ...]');
    process.exit(2);
  }

  const cutoff = Date.now() - flags.days * 86400000;
  const all = [];
  for (const q of queries) {
    try { all.push(...await fetchFeed(q, flags)); }
    catch (err) { console.error(`skip "${q}": ${err.message}`); }
  }

  const seen = new Set();
  const rows = [];
  for (const it of all.sort((a, b) => (b.ts || 0) - (a.ts || 0))) {
    if (!Number.isNaN(it.ts) && it.ts < cutoff) continue;
    const k = normalise(it.title);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    rows.push(it);
    if (rows.length >= flags.max) break;
  }

  if (flags.csv) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(flags.csv, toCsv(rows), "utf8");
    console.error(`wrote ${rows.length} topic(s) -> ${flags.csv}`);
  }

  console.log(JSON.stringify({ days: flags.days, queries, count: rows.length, topics: rows.map(({ ts, ...r }) => r) }, null, 2));
}

main();
