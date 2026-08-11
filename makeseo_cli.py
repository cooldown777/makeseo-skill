#!/usr/bin/env python3
"""
makeseo_cli.py — a thin, dependency-free client for the makeseo REST API.

Uses only the Python standard library (urllib), so there is nothing to install.
Reads the API key from the MAKESEO_API_KEY environment variable.

Examples
--------
    export MAKESEO_API_KEY=mk_live_...
    python makeseo_cli.py projects
    python makeseo_cli.py keywords --project <PID>
    python makeseo_cli.py generate --project <PID> --plan-item <ITEM>
    python makeseo_cli.py publish --article <AID>

Every command prints the raw JSON response. Non-2xx responses print the error
body and exit non-zero, so this composes with shell pipelines and jq.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE_URL = os.environ.get("MAKESEO_API_BASE", "https://makeseo.co/api/v1")


def _key() -> str:
    key = os.environ.get("MAKESEO_API_KEY", "").strip()
    if not key:
        sys.exit(
            "MAKESEO_API_KEY is not set. Create one in makeseo → Settings → API keys, "
            "then: export MAKESEO_API_KEY=mk_live_..."
        )
    return key


def _request(method: str, path: str, params=None, body=None):
    url = BASE_URL.rstrip("/") + path
    if params:
        clean = {k: v for k, v in params.items() if v is not None}
        if clean:
            url += "?" + urllib.parse.urlencode(clean)

    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {_key()}")
    if data is not None:
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        try:
            payload = json.loads(raw)
        except ValueError:
            payload = {"error": "http_error", "message": raw}
        return exc.code, payload
    except urllib.error.URLError as exc:
        sys.exit(f"Network error contacting {url}: {exc.reason}")


def _emit(status: int, payload) -> None:
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    if status >= 400:
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="makeseo API client (stdlib only).")
    sub = parser.add_subparsers(dest="command", required=True)

    def with_project(p):
        p.add_argument("--project", required=True, help="project_id (see: projects)")
        return p

    sub.add_parser("projects", help="List all projects in the org")
    with_project(sub.add_parser("project", help="One project + business context"))
    with_project(sub.add_parser("business-context", help="Brand voice + website analysis"))
    with_project(sub.add_parser("keywords", help="Keywords with measured volume"))
    with_project(sub.add_parser("keywords-refresh", help="Refresh Google Ads volume"))

    sc = with_project(sub.add_parser("search-console", help="GSC performance"))
    sc.add_argument("--days", type=int, default=28, choices=[7, 28, 90])

    with_project(sub.add_parser("audit", help="Latest technical audit"))
    with_project(sub.add_parser("articles", help="Content calendar (plan items)"))
    with_project(sub.add_parser("integrations", help="Connected targets + GSC status"))
    with_project(sub.add_parser("backlink-targets", help="Exchange member domains"))
    with_project(sub.add_parser("ai-visibility", help="GEO / AI-citation state"))

    il = with_project(sub.add_parser("internal-links", help="Own URLs to cross-link"))
    il.add_argument("--keyword", default=None)

    sub.add_parser("backlinks", help="Org backlink ledger")

    art = sub.add_parser("article", help="One article by id")
    art.add_argument("--article", required=True)

    gen = sub.add_parser("generate", help="Generate one article (makeseo writes it)")
    gen.add_argument("--project", required=True)
    gen.add_argument("--plan-item", default=None, help="plan_item_id (from: articles)")
    gen.add_argument("--keyword-id", default=None, help="keyword_id (from: keywords)")

    pub = sub.add_parser("publish", help="Publish an article to a connected CMS")
    pub.add_argument("--article", required=True)
    pub.add_argument("--connection", default=None, help="connection_id if multiple targets")
    pub.add_argument("--status", default="publish", choices=["publish", "draft"])

    args = parser.parse_args()
    cmd = args.command

    if cmd == "projects":
        _emit(*_request("GET", "/projects"))
    elif cmd == "project":
        _emit(*_request("GET", f"/projects/{args.project}"))
    elif cmd == "business-context":
        _emit(*_request("GET", "/business-context", {"project_id": args.project}))
    elif cmd == "keywords":
        _emit(*_request("GET", "/keywords", {"project_id": args.project}))
    elif cmd == "keywords-refresh":
        _emit(*_request("POST", "/keywords/refresh", body={"project_id": args.project}))
    elif cmd == "search-console":
        _emit(*_request("GET", "/search-console", {"project_id": args.project, "days": args.days}))
    elif cmd == "audit":
        _emit(*_request("GET", "/audit", {"project_id": args.project}))
    elif cmd == "articles":
        _emit(*_request("GET", "/articles", {"project_id": args.project}))
    elif cmd == "integrations":
        _emit(*_request("GET", "/integrations", {"project_id": args.project}))
    elif cmd == "backlink-targets":
        _emit(*_request("GET", "/backlink-targets", {"project_id": args.project}))
    elif cmd == "ai-visibility":
        _emit(*_request("GET", "/ai-visibility", {"project_id": args.project}))
    elif cmd == "internal-links":
        _emit(*_request("GET", "/internal-links", {"project_id": args.project, "keyword": args.keyword}))
    elif cmd == "backlinks":
        _emit(*_request("GET", "/backlinks"))
    elif cmd == "article":
        _emit(*_request("GET", f"/articles/{args.article}"))
    elif cmd == "generate":
        body = {"project_id": args.project}
        if args.plan_item:
            body["plan_item_id"] = args.plan_item
        elif args.keyword_id:
            body["keyword_id"] = args.keyword_id
        else:
            sys.exit("generate needs --plan-item or --keyword-id")
        _emit(*_request("POST", "/articles", body=body))
    elif cmd == "publish":
        body = {"status": args.status}
        if args.connection:
            body["connection_id"] = args.connection
        _emit(*_request("POST", f"/articles/{args.article}/publish", body=body))
    else:  # pragma: no cover
        parser.error(f"unknown command: {cmd}")


if __name__ == "__main__":
    main()
