#!/usr/bin/env node
// makeseo.mjs — a thin, dependency-free client for the makeseo REST API.
//
// Node 18+ only (uses the global fetch). Nothing to install. Reads the key from
// the MAKESEO_API_KEY environment variable; override the base URL with
// MAKESEO_API_BASE (defaults to https://makeseo.co/api/v1).
//
// Every command prints the raw JSON response. A non-2xx response prints the
// error body and exits non-zero, so this composes with jq and shell pipelines.
//
// Examples:
//   export MAKESEO_API_KEY=mk_live_...
//   node makeseo.mjs projects
//   node makeseo.mjs keywords --project <PID>
//   node makeseo.mjs generate --project <PID> --plan-item <ITEM>
//   node makeseo.mjs publish --article <AID>

const BASE = (process.env.MAKESEO_API_BASE || "https://makeseo.co/api/v1").replace(/\/+$/, "");

function key() {
  const k = (process.env.MAKESEO_API_KEY || "").trim();
  if (!k) {
    console.error("MAKESEO_API_KEY is not set. Create one in makeseo -> Settings -> API keys, then: export MAKESEO_API_KEY=mk_live_...");
    process.exit(2);
  }
  return k;
}

// Minimal --flag value parser. Repeatable? No — last wins. Returns {_: [positional], flags}.
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const name = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[name] = true;
      else { flags[name] = next; i++; }
    } else positional.push(a);
  }
  return { _: positional, flags };
}

async function request(method, path, { params, body, timeoutMs = 300000 } = {}) {
  let url = BASE + path;
  if (params) {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
    const qs = new URLSearchParams(clean).toString();
    if (qs) url += "?" + qs;
  }
  const headers = { Authorization: `Bearer ${key()}` };
  let payload;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { method, headers, body: payload, signal: ctrl.signal });
  } catch (err) {
    clearTimeout(timer);
    console.error(`Network error contacting ${url}: ${err.message}`);
    process.exit(2);
  }
  clearTimeout(timer);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; }
  catch { json = { error: "http_error", message: text }; }
  return { status: res.status, json, retryAfter: res.headers.get("retry-after") };
}

function emit({ status, json, retryAfter }) {
  console.log(JSON.stringify(json, null, 2));
  if (status === 429 && retryAfter) console.error(`(rate limited — retry after ${retryAfter}s)`);
  // Set exitCode instead of process.exit(): a hard exit while undici's keep-alive
  // socket is still closing trips a libuv assertion on Windows. Letting the event
  // loop drain gives a clean exit with the right code.
  if (status >= 400) process.exitCode = 1;
}

function need(flags, name, hint) {
  if (!flags[name] || flags[name] === true) {
    console.error(`missing --${name}${hint ? " (" + hint + ")" : ""}`);
    process.exit(2);
  }
  return flags[name];
}

function csv(v) {
  return typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
}

const USAGE = `makeseo.mjs — makeseo API client (Node, dependency-free)

Reads:
  projects                                 list all projects in the org
  project           --project PID          one project + business context
  business-context  --project PID          brand voice + website analysis
  keywords          --project PID          keywords with measured volume
  search-console    --project PID [--days 7|28|90]
  audit             --project PID          latest technical audit
  articles          --project PID          the content calendar
  integrations      --project PID          connected targets + GSC status
  internal-links    --project PID [--keyword K] [--limit N]
  backlink-targets  --project PID [--limit N]
  ai-visibility     --project PID          GEO / AI-citation state
  backlinks                                org backlink ledger
  article           --article AID          one article by id

Writes (billable / stateful — confirm with the user first):
  keywords-refresh  --project PID          refresh Google Ads volume (10 / 10 min)
  generate          --project PID (--plan-item ITEM | --keyword-id KID)
  publish           --article AID [--connection CID] [--status publish|draft]
  update-article    --article AID [--title T] [--meta-title T] [--meta-description D]
                                    [--tags a,b] [--featured-image URL] [--scheduled-for ISO]
  update-project    --project PID [--name N] [--domain D] [--language L] [--niche N]
                                    [--description D] [--brand-voice V] [--audiences a,b]`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { flags } = parseArgs(rest);

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(USAGE);
    process.exit(cmd ? 0 : 2);
  }

  const P = () => need(flags, "project", "see: projects");

  switch (cmd) {
    case "projects": return emit(await request("GET", "/projects"));
    case "project": return emit(await request("GET", `/projects/${P()}`));
    case "business-context": return emit(await request("GET", "/business-context", { params: { project_id: P() } }));
    case "keywords": return emit(await request("GET", "/keywords", { params: { project_id: P() } }));
    // project_id goes in the QUERY string: this route resolves it via resolveProject
    // (route param -> ?project_id= -> key binding), it does NOT read the POST body.
    case "keywords-refresh": return emit(await request("POST", "/keywords/refresh", { params: { project_id: P() } }));
    case "search-console": return emit(await request("GET", "/search-console", { params: { project_id: P(), days: flags.days } }));
    case "audit": return emit(await request("GET", "/audit", { params: { project_id: P() } }));
    case "articles": return emit(await request("GET", "/articles", { params: { project_id: P() } }));
    case "integrations": return emit(await request("GET", "/integrations", { params: { project_id: P() } }));
    case "internal-links": return emit(await request("GET", "/internal-links", { params: { project_id: P(), keyword: flags.keyword, limit: flags.limit } }));
    case "backlink-targets": return emit(await request("GET", "/backlink-targets", { params: { project_id: P(), limit: flags.limit } }));
    case "ai-visibility": return emit(await request("GET", "/ai-visibility", { params: { project_id: P() } }));
    case "backlinks": return emit(await request("GET", "/backlinks"));
    case "article": return emit(await request("GET", `/articles/${need(flags, "article")}`));

    case "generate": {
      const body = { project_id: P() };
      if (flags["plan-item"] && flags["plan-item"] !== true) body.plan_item_id = flags["plan-item"];
      else if (flags["keyword-id"] && flags["keyword-id"] !== true) body.keyword_id = flags["keyword-id"];
      else { console.error("generate needs --plan-item or --keyword-id"); process.exit(2); }
      return emit(await request("POST", "/articles", { body }));
    }
    case "publish": {
      const aid = need(flags, "article");
      const body = { status: flags.status === "draft" ? "draft" : "publish" };
      if (flags.connection && flags.connection !== true) body.connection_id = flags.connection;
      return emit(await request("POST", `/articles/${aid}/publish`, { body, timeoutMs: 60000 }));
    }
    case "update-article": {
      const aid = need(flags, "article");
      const body = {};
      if (flags.title && flags.title !== true) body.title = flags.title;
      if (flags["meta-title"] && flags["meta-title"] !== true) body.meta_title = flags["meta-title"];
      if (flags["meta-description"] && flags["meta-description"] !== true) body.meta_description = flags["meta-description"];
      if (flags["featured-image"] && flags["featured-image"] !== true) body.featured_image_url = flags["featured-image"];
      if (flags["scheduled-for"] && flags["scheduled-for"] !== true) body.scheduled_for = flags["scheduled-for"];
      const tags = csv(flags.tags); if (tags) body.tags = tags;
      if (Object.keys(body).length === 0) { console.error("update-article needs at least one field to change"); process.exit(2); }
      return emit(await request("PUT", `/articles/${aid}`, { body }));
    }
    case "update-project": {
      const pid = P();
      const body = {};
      for (const [flag, field] of [["name", "name"], ["domain", "domain"], ["language", "language"], ["niche", "niche"], ["description", "description"], ["brand-voice", "brand_voice"]]) {
        if (flags[flag] && flags[flag] !== true) body[field] = flags[flag];
      }
      const aud = csv(flags.audiences); if (aud) body.audiences = aud;
      if (Object.keys(body).length === 0) { console.error("update-project needs at least one field to change"); process.exit(2); }
      return emit(await request("PUT", `/projects/${pid}`, { body }));
    }
    default:
      console.error(`unknown command: ${cmd}\n\n${USAGE}`);
      process.exit(2);
  }
}

main();
