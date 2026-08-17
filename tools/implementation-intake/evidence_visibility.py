#!/usr/bin/env python3
"""Evidence-visibility guardrails learned from real third-party Web integrations."""
from __future__ import annotations

from collections import Counter
from typing import Any


def classify_stylesheet_visibility(diagnostics: list[dict[str, Any]] | None) -> dict[str, Any]:
    """Describe how much of the active CSSOM was actually observable.

    Cross-origin stylesheets can be applied by the browser while their cssRules are
    inaccessible to page JS. In that case matched-rule evidence is useful but partial;
    a cause engine must not claim complete CSS ownership.
    """
    rows = diagnostics or []
    if not rows:
        return {
            "kind": "unknown",
            "totalStylesheets": 0,
            "accessibleStylesheets": 0,
            "blockedStylesheets": 0,
            "blockedExternalStylesheets": 0,
            "canClaimCompleteCssOwnership": False,
            "cssOwnerConfidenceCeiling": None,
            "nextAction": "capture-stylesheet-diagnostics-before-css-owner-claim",
            "blockedReasons": {},
        }

    accessible = [row for row in rows if row.get("accessible") is True]
    blocked = [row for row in rows if row.get("accessible") is False]
    blocked_external = [row for row in blocked if row.get("href")]
    reasons = Counter(str(row.get("error") or "unknown") for row in blocked)

    if not blocked:
        kind = "full"
        confidence = 1.0
        next_action = "css-owner-evidence-can-be-ranked-normally"
    elif accessible:
        kind = "partial"
        confidence = 0.65
        next_action = "treat-css-owner-candidates-as-partial-evidence"
    else:
        kind = "blocked"
        confidence = 0.35
        next_action = "use-computed-style-library-hooks-and-source-inspection"

    return {
        "kind": kind,
        "totalStylesheets": len(rows),
        "accessibleStylesheets": len(accessible),
        "blockedStylesheets": len(blocked),
        "blockedExternalStylesheets": len(blocked_external),
        "canClaimCompleteCssOwnership": kind == "full",
        "cssOwnerConfidenceCeiling": confidence,
        "nextAction": next_action,
        "blockedReasons": dict(sorted(reasons.items())),
        "principle": "applied CSS can be invisible to CSSOM inspection; missing rules are not proof that the library has no relevant CSS",
    }


def instrumentation_collision_report(
    owned_attributes: list[str] | set[str] | tuple[str, ...],
    third_party_attributes: list[str] | set[str] | tuple[str, ...],
) -> dict[str, Any]:
    """Detect attribute-name collisions between project QA hooks and library DOM.

    This deliberately checks attribute *names*, not values. A real FullCalendar v7
    benchmark showed that a generic custom `data-calendar-view` attribute collided
    with library-generated DOM. Namespaced hooks avoid ambiguous selectors.
    """
    owned = {str(value).strip().lower() for value in owned_attributes if str(value).strip()}
    external = {str(value).strip().lower() for value in third_party_attributes if str(value).strip()}
    collisions = sorted(owned & external)
    unnamespaced = sorted(
        attr for attr in owned
        if attr.startswith("data-")
        and not attr.startswith(("data-ref", "data-project-", "data-app-", "data-qa-", "data-test-"))
    )
    return {
        "collision": bool(collisions),
        "collisions": collisions,
        "ownedAttributes": sorted(owned),
        "thirdPartyAttributes": sorted(external),
        "genericDataAttributes": unnamespaced,
        "nextAction": "namespace-owned-instrumentation" if collisions else "keep-owned-hooks-namespaced-and-library-independent",
        "principle": "selectors used for project QA/control state must not accidentally match third-party generated DOM",
    }


def measurement_target_report(candidates: list[dict[str, Any]] | None) -> dict[str, Any]:
    """Check that geometry evidence came from an actually visible target.

    A real Playwright benchmark selected a hidden desktop control while running the
    mobile viewport because a Node-side variable was referenced inside page.evaluate
    without being passed as an argument. The hidden node returned a convincing zero
    rectangle. Zero-size/hidden candidates therefore cannot be treated as successful
    geometry evidence, and multiple visible matches are ambiguous evidence.
    """
    rows = candidates or []

    def visible(row: dict[str, Any]) -> bool:
        width = float(row.get("width") or 0)
        height = float(row.get("height") or 0)
        display = str(row.get("display") or "").lower()
        visibility = str(row.get("visibility") or "").lower()
        connected = row.get("connected", True) is not False
        return connected and display != "none" and visibility not in {"hidden", "collapse"} and width > 0 and height > 0

    visible_rows = [row for row in rows if visible(row)]
    selected = next((row for row in rows if row.get("selected") is True), rows[0] if rows else None)
    selected_visible = bool(selected and visible(selected))

    if not rows:
        kind = "missing"
        next_action = "capture-target-candidates-before-geometry-claim"
    elif not visible_rows:
        kind = "hidden-or-zero-size"
        next_action = "reject-geometry-and-fix-selector-or-runtime-state"
    elif len(visible_rows) > 1:
        kind = "ambiguous-multiple-visible"
        next_action = "use-a-unique-namespaced-selector-or-explicit-index"
    elif not selected_visible:
        kind = "hidden-selected-visible-alternative"
        next_action = "reject-selected-target-and-select-the-visible-candidate-explicitly"
    else:
        kind = "valid-visible-target"
        next_action = "geometry-evidence-can-be-used"

    return {
        "kind": kind,
        "candidateCount": len(rows),
        "visibleCandidateCount": len(visible_rows),
        "selectedVisible": selected_visible,
        "canUseGeometry": kind == "valid-visible-target",
        "nextAction": next_action,
        "principles": [
            "hidden or zero-size DOM rectangles are not successful visual evidence",
            "Node-side values are not lexical closures inside Playwright page.evaluate; pass required values as explicit evaluate arguments",
        ],
    }
