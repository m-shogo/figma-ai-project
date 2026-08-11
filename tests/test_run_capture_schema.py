from __future__ import annotations

import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / "schemas" / "run.schema.json").read_text(encoding="utf-8"))
CAPTURE_SCHEMA = SCHEMA["$defs"]["capture"]


def capture(scope: str) -> dict:
    return {
        "capture_id": "cap-interaction-nav-ios",
        "scope": scope,
        "target_id": "nav-toggle",
        "frame_id": "sp-main",
        "environment_profile_id": "ios-safari",
        "runtime": {
            "browser": "Safari",
            "browser_version": "current",
            "os": "iOS",
            "os_version": "current",
            "engine": "WebKit",
            "webview": False,
            "viewport_width_css_px": 390,
            "viewport_height_css_px": 844,
            "dpr": 3,
            "zoom": 1.0,
            "text_scale": 1.0,
            "orientation": "PORTRAIT",
        },
        "input_state": {
            "primary_hover": "NONE",
            "primary_pointer": "COARSE",
            "touch": True,
        },
        "preferences": {
            "reduced_motion": "NO_PREFERENCE",
            "forced_colors": "NONE",
            "contrast": "NO_PREFERENCE",
            "color_scheme": "LIGHT",
        },
        "path": "evidence/nav-toggle-ios.png",
        "captured_at": "2026-08-11T09:00:00+09:00",
        "deterministic": True,
        "notes": [],
    }


class RunCaptureSchemaTests(unittest.TestCase):
    def test_interaction_is_a_valid_capture_scope(self) -> None:
        errors = list(Draft202012Validator(CAPTURE_SCHEMA).iter_errors(capture("INTERACTION")))
        self.assertEqual([], errors)

    def test_unknown_capture_scope_is_rejected(self) -> None:
        errors = list(Draft202012Validator(CAPTURE_SCHEMA).iter_errors(capture("INTERACTION_UNKNOWN")))
        self.assertTrue(errors)


if __name__ == "__main__":
    unittest.main()
