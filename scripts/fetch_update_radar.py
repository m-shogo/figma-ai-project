#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable

import yaml

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "config" / "update-sources.yaml"
DEFAULT_OUTPUT_DIR = ROOT / "research" / "update-radar"
USER_AGENT = "figma-ai-project-update-radar/1.0 (+https://github.com/m-shogo/figma-ai-project)"


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"}:
            self._skip_depth += 1
        elif tag.lower() in {"p", "div", "section", "article", "li", "h1", "h2", "h3", "h4", "br"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"} and self._skip_depth:
            self._skip_depth -= 1
        elif tag.lower() in {"p", "div", "section", "article", "li", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self.parts.append(data)

    def text(self) -> str:
        return normalize_text(" ".join(self.parts))


@dataclass
class FetchResult:
    source_id: str
    lane: str
    authority: str
    kind: str
    url: str
    fetched_at: str
    fingerprint: str
    title: str
    items: list[dict[str, Any]]
    excerpt: str
    matched_keywords: list[str]
    retest_categories: list[str]
    impacts: list[str]
    topics: list[str]
    error: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "source_id": self.source_id,
            "lane": self.lane,
            "authority": self.authority,
            "kind": self.kind,
            "url": self.url,
            "fetched_at": self.fetched_at,
            "fingerprint": self.fingerprint,
            "title": self.title,
            "items": self.items,
            "excerpt": self.excerpt,
            "matched_keywords": self.matched_keywords,
            "retest_categories": self.retest_categories,
            "impacts": self.impacts,
            "topics": self.topics,
            "error": self.error,
        }


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def normalize_text(value: str) -> str:
    value = html.unescape(value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"top-level YAML must be an object: {path}")
    return value


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    value = json.loads(path.read_text(encoding="utf-8"))
    return value if isinstance(value, dict) else {}


def active_company_policy(root: Path) -> tuple[Path | None, dict[str, Any] | None]:
    candidates: list[Path] = []
    policies = root / "policies"
    if policies.exists():
        candidates.extend(sorted(policies.rglob("*.yaml")))
        candidates.extend(sorted(policies.rglob("*.yml")))
    for path in candidates:
        try:
            data = load_yaml(path)
        except Exception:
            continue
        if data.get("status") == "ACTIVE":
            return path, data
    return None, None


def target_profile_values(policy: dict[str, Any] | None) -> tuple[set[str], set[str]]:
    browsers: set[str] = set()
    engines: set[str] = set()
    if not policy:
        return browsers, engines
    profiles = policy.get("browser_support", {}).get("environment_profiles", [])
    for profile in profiles if isinstance(profiles, list) else []:
        if not isinstance(profile, dict) or profile.get("role") != "REQUIRED":
            continue
        browser = str(profile.get("browser", "")).strip()
        engine = str(profile.get("engine", "")).strip()
        if browser:
            browsers.add(browser.casefold())
        if engine:
            engines.add(engine.casefold())
    return browsers, engines


def lane_enabled(name: str, lane: dict[str, Any], policy: dict[str, Any] | None) -> bool:
    if lane.get("required_for_significant_run") is True:
        return True
    activation = lane.get("activation", {})
    profile_any = activation.get("company_profile_any", {}) if isinstance(activation, dict) else {}
    if not profile_any:
        return bool(lane.get("required_for_significant_run", False))
    browsers, engines = target_profile_values(policy)
    wanted_browsers = {str(value).casefold() for value in profile_any.get("browsers", [])}
    wanted_engines = {str(value).casefold() for value in profile_any.get("engines", [])}
    return bool(browsers & wanted_browsers or engines & wanted_engines)


def selected_sources(config: dict[str, Any], policy: dict[str, Any] | None) -> list[tuple[str, dict[str, Any]]]:
    selected: list[tuple[str, dict[str, Any]]] = []
    lanes = config.get("lanes", {})
    if not isinstance(lanes, dict):
        return selected
    for lane_name, lane in lanes.items():
        if not isinstance(lane, dict) or not lane_enabled(str(lane_name), lane, policy):
            continue
        for source in lane.get("sources", []):
            if isinstance(source, dict):
                selected.append((str(lane_name), source))
    return selected


def request_bytes(url: str, *, timeout: int, github_token: str = "") -> bytes:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github+json, application/json, application/atom+xml, application/rss+xml, text/html;q=0.9, */*;q=0.8",
    }
    if github_token and "api.github.com" in url:
        headers["Authorization"] = f"Bearer {github_token}"
        headers["X-GitHub-Api-Version"] = "2022-11-28"
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def keyword_snippets(text: str, keywords: Iterable[str], *, radius: int = 180, limit: int = 12) -> tuple[list[str], str]:
    lower = text.casefold()
    matched: list[str] = []
    snippets: list[str] = []
    for keyword in keywords:
        term = str(keyword).strip()
        if not term:
            continue
        index = lower.find(term.casefold())
        if index < 0:
            continue
        matched.append(term)
        start = max(0, index - radius)
        end = min(len(text), index + len(term) + radius)
        snippets.append(text[start:end])
        if len(snippets) >= limit:
            break
    return matched, normalize_text(" … ".join(snippets))


def parse_github_releases(payload: bytes, max_items: int) -> tuple[str, list[dict[str, Any]], str]:
    data = json.loads(payload.decode("utf-8"))
    if not isinstance(data, list):
        raise ValueError("GitHub releases response is not an array")
    items: list[dict[str, Any]] = []
    for release in data[:max_items]:
        if not isinstance(release, dict):
            continue
        items.append(
            {
                "id": str(release.get("id", "")),
                "name": normalize_text(str(release.get("name") or release.get("tag_name") or "")),
                "tag": str(release.get("tag_name", "")),
                "published_at": str(release.get("published_at") or release.get("created_at") or ""),
                "prerelease": bool(release.get("prerelease", False)),
                "url": str(release.get("html_url", "")),
                "summary": normalize_text(str(release.get("body", "")))[:4000],
            }
        )
    canonical = json.dumps(items, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    title = items[0]["name"] if items else ""
    excerpt = normalize_text(" ".join(f"{item['name']} {item['summary']}" for item in items))[:12000]
    return title, items, excerpt + "\n" + canonical


def parse_xml_feed(payload: bytes, max_items: int) -> tuple[str, list[dict[str, Any]], str]:
    root = ET.fromstring(payload)
    items: list[dict[str, Any]] = []

    def child_text(node: ET.Element, local_names: set[str]) -> str:
        for child in node.iter():
            local = child.tag.rsplit("}", 1)[-1]
            if local in local_names and child.text:
                return normalize_text(child.text)
        return ""

    candidates = [node for node in root.iter() if node.tag.rsplit("}", 1)[-1] in {"entry", "item"}]
    for node in candidates[:max_items]:
        title = child_text(node, {"title"})
        published = child_text(node, {"published", "updated", "pubDate"})
        summary = child_text(node, {"summary", "description", "content"})
        link = ""
        for child in node.iter():
            if child.tag.rsplit("}", 1)[-1] == "link":
                link = child.attrib.get("href", "") or normalize_text(child.text or "")
                if link:
                    break
        items.append(
            {
                "name": title,
                "published_at": published,
                "url": link,
                "summary": summary[:4000],
            }
        )
    canonical = json.dumps(items, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    title = items[0]["name"] if items else child_text(root, {"title"})
    excerpt = normalize_text(" ".join(f"{item['name']} {item['summary']}" for item in items))[:12000]
    return title, items, excerpt + "\n" + canonical


def parse_html(payload: bytes, include_keywords: list[str]) -> tuple[str, list[dict[str, Any]], str]:
    text = payload.decode("utf-8", errors="replace")
    extractor = TextExtractor()
    extractor.feed(text)
    visible = extractor.text()
    title_match = re.search(r"<title[^>]*>(.*?)</title>", text, flags=re.IGNORECASE | re.DOTALL)
    title = normalize_text(re.sub(r"<[^>]+>", " ", title_match.group(1))) if title_match else ""
    if include_keywords:
        _, snippet = keyword_snippets(visible, include_keywords, radius=500, limit=24)
        excerpt = snippet or visible[:12000]
    else:
        excerpt = visible[:12000]
    canonical = normalize_text(excerpt)
    return title, [], canonical


def _json_scalar_text(value: Any) -> str:
    if isinstance(value, str):
        return normalize_text(value)
    if value is None or isinstance(value, (bool, int, float)):
        return str(value)
    return ""


def relevant_json_subset(value: Any, include_keywords: Iterable[str]) -> Any | None:
    terms = [str(keyword).strip().casefold() for keyword in include_keywords if str(keyword).strip()]
    if not terms:
        return value

    def matches(text: str) -> bool:
        folded = text.casefold()
        return any(term in folded for term in terms)

    def extract(node: Any) -> Any | None:
        if isinstance(node, dict):
            direct_text = " ".join(
                _json_scalar_text(child)
                for child in node.values()
                if not isinstance(child, (dict, list))
            )
            if direct_text and matches(direct_text):
                return node

            kept: dict[str, Any] = {}
            for key, child in node.items():
                if not isinstance(child, (dict, list)):
                    continue
                relevant = extract(child)
                if relevant is not None:
                    kept[str(key)] = relevant
            return kept or None

        if isinstance(node, list):
            kept_items = []
            for child in node:
                relevant = extract(child)
                if relevant is not None:
                    kept_items.append(relevant)
            return kept_items or None

        text = _json_scalar_text(node)
        return node if text and matches(text) else None

    return extract(value)


def parse_json_digest(payload: bytes, include_keywords: list[str]) -> tuple[str, list[dict[str, Any]], str]:
    data = json.loads(payload.decode("utf-8"))
    subset = relevant_json_subset(data, include_keywords)
    if include_keywords and subset is None:
        subset = [] if isinstance(data, list) else {}
    canonical = json.dumps(subset, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return "", [], canonical


def retest_categories(text: str, keyword_map: dict[str, Any]) -> list[str]:
    lower = text.casefold()
    matched: list[str] = []
    for category, rule in keyword_map.items():
        keywords = rule.get("keywords", []) if isinstance(rule, dict) else []
        if any(str(keyword).casefold() in lower for keyword in keywords):
            matched.append(str(category))
    return matched


def fetch_source(
    lane: str,
    source: dict[str, Any],
    *,
    timeout: int,
    max_items: int,
    keyword_map: dict[str, Any],
    github_token: str = "",
) -> FetchResult:
    source_id = str(source.get("id", "")).strip()
    kind = str(source.get("kind", "HTML_DIGEST")).strip()
    url = str(source.get("url", "")).strip()
    fetched_at = utc_now()
    authority = str(source.get("authority", "OFFICIAL"))
    topics = [str(value) for value in source.get("topics", [])]
    impacts = [str(value) for value in source.get("impacts", [])]
    include_keywords = [str(value) for value in source.get("include_keywords", [])]

    try:
        payload = request_bytes(url, timeout=timeout, github_token=github_token)
        if kind == "GITHUB_RELEASES":
            title, items, canonical = parse_github_releases(payload, max_items)
        elif kind == "XML_FEED":
            title, items, canonical = parse_xml_feed(payload, max_items)
        elif kind == "JSON_DIGEST":
            title, items, canonical = parse_json_digest(payload, include_keywords)
        elif kind == "HTML_DIGEST":
            title, items, canonical = parse_html(payload, include_keywords)
        else:
            raise ValueError(f"unsupported source kind: {kind}")

        excerpt = normalize_text(canonical)[:12000]
        matched_keywords, _ = keyword_snippets(excerpt, include_keywords or topics, radius=100, limit=64)
        categories = retest_categories(excerpt, keyword_map)
        return FetchResult(
            source_id=source_id,
            lane=lane,
            authority=authority,
            kind=kind,
            url=url,
            fetched_at=fetched_at,
            fingerprint=sha256_text(canonical),
            title=title,
            items=items,
            excerpt=excerpt,
            matched_keywords=matched_keywords,
            retest_categories=categories,
            impacts=impacts,
            topics=topics,
        )
    except Exception as exc:
        return FetchResult(
            source_id=source_id,
            lane=lane,
            authority=authority,
            kind=kind,
            url=url,
            fetched_at=fetched_at,
            fingerprint="",
            title="",
            items=[],
            excerpt="",
            matched_keywords=[],
            retest_categories=[],
            impacts=impacts,
            topics=topics,
            error=f"{type(exc).__name__}: {exc}",
        )


def build_snapshot(
    config: dict[str, Any],
    *,
    policy_path: Path | None,
    policy: dict[str, Any] | None,
    previous_state: dict[str, Any],
    github_token: str = "",
) -> dict[str, Any]:
    settings = config.get("policy", {}) if isinstance(config.get("policy"), dict) else {}
    timeout = int(settings.get("fetch_timeout_seconds", 30))
    max_items = int(settings.get("max_items_per_feed", 12))
    keyword_map = config.get("retest_keyword_map", {}) if isinstance(config.get("retest_keyword_map"), dict) else {}

    previous_fingerprints = previous_state.get("fingerprints", {}) if isinstance(previous_state, dict) else {}
    results: list[dict[str, Any]] = []
    changed: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    for lane, source in selected_sources(config, policy):
        result = fetch_source(
            lane,
            source,
            timeout=timeout,
            max_items=max_items,
            keyword_map=keyword_map,
            github_token=github_token,
        )
        row = result.as_dict()
        previous = str(previous_fingerprints.get(result.source_id, ""))
        row["previous_fingerprint"] = previous
        row["changed"] = bool(result.fingerprint and previous and result.fingerprint != previous)
        row["first_observation"] = bool(result.fingerprint and not previous)
        results.append(row)
        if result.error:
            errors.append({"source_id": result.source_id, "error": result.error})
        elif row["changed"]:
            changed.append(
                {
                    "source_id": result.source_id,
                    "lane": result.lane,
                    "title": result.title,
                    "retest_categories": result.retest_categories,
                    "impacts": result.impacts,
                    "url": result.url,
                }
            )

    active_lanes = sorted({row["lane"] for row in results})
    policy_rel = str(policy_path.relative_to(ROOT)) if policy_path and ROOT in policy_path.resolve().parents else ""
    return {
        "schema_version": 1,
        "generated_at": utc_now(),
        "company_policy": {
            "path": policy_rel,
            "policy_id": str(policy.get("policy_id", "")) if policy else "",
            "status": str(policy.get("status", "")) if policy else "UNBOUND",
        },
        "active_lanes": active_lanes,
        "sources": results,
        "changes": changed,
        "fetch_errors": errors,
        "summary": {
            "source_count": len(results),
            "changed_count": len(changed),
            "error_count": len(errors),
            "first_observation_count": sum(1 for row in results if row["first_observation"]),
            "retest_categories": sorted({category for row in changed for category in row["retest_categories"]}),
        },
    }


def snapshot_state(snapshot: dict[str, Any]) -> dict[str, Any]:
    fingerprints = {
        str(row.get("source_id", "")): str(row.get("fingerprint", ""))
        for row in snapshot.get("sources", [])
        if row.get("source_id") and row.get("fingerprint")
    }
    return {
        "schema_version": 1,
        "updated_at": snapshot.get("generated_at", ""),
        "fingerprints": fingerprints,
    }


def markdown_report(snapshot: dict[str, Any]) -> str:
    summary = snapshot.get("summary", {})
    lines = [
        "# Update Radar — Latest Official Source Scan",
        "",
        f"Generated: `{snapshot.get('generated_at', '')}`",
        "",
        f"Active lanes: {', '.join(snapshot.get('active_lanes', [])) or 'none'}",
        "",
        "## Summary",
        "",
        f"- Sources checked: {summary.get('source_count', 0)}",
        f"- Changed since previous snapshot: {summary.get('changed_count', 0)}",
        f"- First observations: {summary.get('first_observation_count', 0)}",
        f"- Fetch errors: {summary.get('error_count', 0)}",
        f"- RETEST candidates: {', '.join(summary.get('retest_categories', [])) or 'none'}",
        "",
        "## Changed sources",
        "",
    ]
    changes = snapshot.get("changes", [])
    if changes:
        for change in changes:
            lines.extend(
                [
                    f"### {change.get('source_id', '')}",
                    "",
                    f"- Lane: `{change.get('lane', '')}`",
                    f"- Latest title: {change.get('title', '') or '(digest source)' }",
                    f"- Impacts: {', '.join(change.get('impacts', [])) or 'none'}",
                    f"- RETEST: {', '.join(change.get('retest_categories', [])) or 'manual triage'}",
                    f"- Source: {change.get('url', '')}",
                    "",
                ]
            )
    else:
        lines.extend(["No previously-known source fingerprint changed.", ""])

    errors = snapshot.get("fetch_errors", [])
    if errors:
        lines.extend(["## Fetch errors", ""])
        for error in errors:
            lines.append(f"- `{error.get('source_id', '')}` — {error.get('error', '')}")
        lines.append("")

    lines.extend(
        [
            "## Promotion rule",
            "",
            "A changed source is a `RETEST_CANDIDATE`, not an automatic Company Policy or Proven Playbook change.",
            "Validate against the active Company Policy, target browser/device matrix, and a reproducible experiment before promotion.",
            "",
        ]
    )
    return "\n".join(lines)


def write_outputs(output_dir: Path, snapshot: dict[str, Any], *, write_history: bool) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "latest.json").write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "latest.md").write_text(markdown_report(snapshot), encoding="utf-8")
    (output_dir / "state.json").write_text(
        json.dumps(snapshot_state(snapshot), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    if write_history and snapshot.get("changes"):
        stamp = str(snapshot.get("generated_at", "")).replace(":", "-")
        history = output_dir / "history"
        history.mkdir(parents=True, exist_ok=True)
        (history / f"{stamp}.json").write_text(
            json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch official Figma/agent/MCP/web-platform updates and diff source fingerprints")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--policy", type=Path, default=None, help="explicit ACTIVE Company Policy path")
    parser.add_argument("--write-history", action="store_true")
    parser.add_argument("--strict", action="store_true", help="return non-zero if any selected source cannot be fetched")
    args = parser.parse_args()

    config_path = args.config if args.config.is_absolute() else ROOT / args.config
    output_dir = args.output_dir if args.output_dir.is_absolute() else ROOT / args.output_dir
    config = load_yaml(config_path)

    if args.policy:
        policy_path = args.policy if args.policy.is_absolute() else ROOT / args.policy
        policy = load_yaml(policy_path)
        if policy.get("status") != "ACTIVE":
            raise ValueError("--policy must point to an ACTIVE Company Policy")
    else:
        policy_path, policy = active_company_policy(ROOT)

    previous_state = load_json(output_dir / "state.json")
    import os

    snapshot = build_snapshot(
        config,
        policy_path=policy_path,
        policy=policy,
        previous_state=previous_state,
        github_token=os.environ.get("GITHUB_TOKEN", ""),
    )
    write_outputs(output_dir, snapshot, write_history=args.write_history)

    summary = snapshot["summary"]
    print(
        f"UPDATE_RADAR sources={summary['source_count']} changed={summary['changed_count']} "
        f"first={summary['first_observation_count']} errors={summary['error_count']}"
    )
    if summary["retest_categories"]:
        print("RETEST_NOW candidates: " + ", ".join(summary["retest_categories"]))
    for error in snapshot.get("fetch_errors", []):
        print(f"WARN {error['source_id']}: {error['error']}", file=sys.stderr)

    return 1 if args.strict and snapshot.get("fetch_errors") else 0


if __name__ == "__main__":
    raise SystemExit(main())