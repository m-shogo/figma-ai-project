#!/usr/bin/env python3
from __future__ import annotations

import copy
import unittest

import probe_adapter as pa


def manifest():
    return {
        "reference_id": "TEST",
        "run_id": "RUN-1",
        "viewports": {"pc": {"width": 1000}, "sp": {"width": 375, "figma_device_chrome_px": 40}},
        "sections": [
            {"id": "full-page", "web_selector": None, "web_index": 0, "geometry": {"pc": {"top": 0, "height": 400}, "sp": {"top": 0, "height": 700}}},
            {"id": "header", "web_selector": ".header", "web_index": 0, "geometry": {"pc": {"top": 0, "height": 80}, "sp": {"top": 0, "height": 60}}},
            {"id": "shared-cta-1", "web_selector": ".cta", "web_index": 0, "geometry": {"pc": {"top": 80, "height": 100}, "sp": {"top": 60, "height": 120}}},
            {"id": "shared-cta-2", "web_selector": ".cta", "web_index": 1, "geometry": {"pc": {"top": 180, "height": 100}, "sp": {"top": 180, "height": 120}}},
            {"id": "footer", "web_selector": ".footer", "web_index": 0, "geometry": {"pc": {"top": 280, "height": 120}, "sp": {"top": 300, "height": 400}}},
        ],
    }


def probe(width, sections, **extra):
    base = {
        "width": width,
        "bodyHeight": max(x["top"] + x["height"] for x in sections),
        "pageOverflowPx": 0,
        "readableTextClipping": [],
        "overflowElements": [],
        "imageFailures": [],
        "runtimeErrors": [],
        "primaryFonts": {"primary": True},
        "sections": sections,
    }
    base.update(extra)
    return base


def pc_sections():
    return [
        {"name": "header", "top": 0, "height": 80},
        {"name": "shared-cta", "top": 80, "height": 100},
        {"name": "shared-cta", "top": 180, "height": 100},
        {"name": "footer", "top": 280, "height": 120},
    ]


def sp_sections():
    return [
        {"name": "header", "top": 0, "height": 60},
        {"name": "shared-cta", "top": 60, "height": 120},
        {"name": "shared-cta", "top": 180, "height": 120},
        {"name": "footer", "top": 300, "height": 400},
    ]


class ProbeAdapterTests(unittest.TestCase):
    def test_reference_width_matches_without_false_drift(self):
        result = pa.reference_checkpoint(manifest(), [probe(1000, pc_sections())], "pc")
        self.assertFalse(result["cumulativeDrift"]["detected"])
        self.assertEqual(result["boundaryPattern"]["pattern"], "aligned")
        self.assertEqual(result["route"]["actions"][0]["target"], "no-repair")
        self.assertTrue(all(not row["diagnosis"]["categories"] for row in result["reports"]))

    def test_shared_cta_indices_are_resolved_independently(self):
        result = pa.reference_checkpoint(manifest(), [probe(1000, pc_sections())], "pc")
        rows = {row["id"]: row for row in result["boundaries"]}
        self.assertEqual(rows["shared-cta-1"]["actual"]["top"], 80)
        self.assertEqual(rows["shared-cta-2"]["actual"]["top"], 180)

    def test_intermediate_width_is_health_only(self):
        mid = probe(768, pc_sections(), pageOverflowPx=5, imageFailures=["broken"], runtimeErrors=["boom"], primaryFonts={"primary": False})
        result = pa.adapt_manifest_probes(manifest(), [probe(1000, pc_sections()), probe(375, sp_sections()), mid])
        self.assertEqual(len(result["intermediateRuntime"]), 1)
        health = result["intermediateRuntime"][0]
        self.assertEqual(health["width"], 768)
        self.assertEqual(health["pageOverflowPx"], 5)
        self.assertEqual(health["imageFailureCount"], 1)
        self.assertEqual(health["runtimeErrorCount"], 1)
        self.assertEqual(health["missingPrimaryFonts"], ["primary"])
        self.assertFalse(health["pass"])
        self.assertFalse(result["allIntermediateRuntimeHealthy"])
        self.assertTrue(result["policy"]["intermediateWidthsAreRuntimeHealthOnly"])

    def test_clean_intermediate_runtime_is_healthy(self):
        result = pa.adapt_manifest_probes(manifest(), [probe(1000, pc_sections()), probe(375, sp_sections()), probe(768, pc_sections())])
        self.assertTrue(result["allIntermediateRuntimeHealthy"])
        self.assertTrue(result["intermediateRuntime"][0]["pass"])
        self.assertEqual(result["intermediateRuntime"][0]["issues"], [])

    def test_device_chrome_is_declared_but_runtime_geometry_stays_page_based(self):
        result = pa.reference_checkpoint(manifest(), [probe(375, sp_sections())], "sp")
        self.assertEqual(result["figmaDeviceChromePx"], 40)
        self.assertEqual(result["geometryCoordinateSpace"], "runtime-page")
        self.assertEqual(result["boundaryPattern"]["pattern"], "aligned")

    def test_missing_reference_width_fails_fast(self):
        with self.assertRaisesRegex(ValueError, "reference width 1000"):
            pa.reference_checkpoint(manifest(), [probe(999, pc_sections())], "pc")

    def test_reference_shift_is_structured_not_pixel_only(self):
        shifted = copy.deepcopy(pc_sections())
        shifted[-1]["top"] = 286
        result = pa.reference_checkpoint(manifest(), [probe(1000, shifted)], "pc")
        footer = next(row for row in result["reports"] if row["id"] == "footer")
        self.assertIn("position", footer["diagnosis"]["categories"])
        self.assertIn("section-boundary", footer["diagnosis"]["categories"])
        self.assertEqual(result["boundaryPattern"]["pattern"], "isolated")

    def test_cumulative_growth_routes_to_shared_spacing(self):
        shifted = copy.deepcopy(pc_sections())
        shifted[1]["top"] += 2
        shifted[2]["top"] += 7
        shifted[3]["top"] += 15
        result = pa.reference_checkpoint(manifest(), [probe(1000, shifted)], "pc")
        self.assertTrue(result["cumulativeDrift"]["detected"])
        self.assertEqual(result["boundaryPattern"]["pattern"], "cumulative-growth")
        self.assertEqual(result["route"]["actions"][0]["target"], "cumulative-spacing-height")

    def test_step_shift_routes_to_first_divergent_section(self):
        shifted = copy.deepcopy(pc_sections())
        for item in shifted[1:]:
            item["top"] += 24
        result = pa.reference_checkpoint(manifest(), [probe(1000, shifted)], "pc")
        self.assertEqual(result["boundaryPattern"]["pattern"], "step-shift")
        self.assertEqual(result["boundaryPattern"]["rootCauseCandidate"], "shared-cta-1")
        self.assertEqual(result["route"]["actions"][0]["target"], "shared-cta-1")

    def test_constant_offset_routes_to_shared_root(self):
        shifted = copy.deepcopy(pc_sections())
        for item in shifted:
            item["top"] += 12
        result = pa.reference_checkpoint(manifest(), [probe(1000, shifted)], "pc")
        self.assertEqual(result["boundaryPattern"]["pattern"], "constant-offset")
        self.assertEqual(result["boundaryPattern"]["rootCauseCandidate"], "page-or-shared-root")
        self.assertEqual(result["route"]["actions"][0]["target"], "page-or-shared-root-offset")


if __name__ == "__main__":
    unittest.main()
