from __future__ import annotations

import unittest
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
REFERENCES = ROOT / "references"
REF001 = REFERENCES / "chiba-keizai-sample.reference.yaml"


def load_yaml(path: Path) -> dict:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise AssertionError(f"{path} must contain a top-level mapping")
    return value


class ReferenceBreakpointEvidenceTests(unittest.TestCase):
    def test_resolved_reference_breakpoints_keep_traceable_values(self) -> None:
        for path in sorted(REFERENCES.glob("*.reference.yaml")):
            with self.subTest(reference=path.name):
                data = load_yaml(path)
                evidence = data.get("responsive", {}).get("breakpoint_evidence", {})
                source = str(evidence.get("source", "UNKNOWN"))
                if source == "UNKNOWN":
                    continue

                source_refs = evidence.get("source_refs", [])
                values = evidence.get("values", [])
                self.assertTrue(source_refs, f"{path.name}: resolved breakpoint source requires source_refs")
                self.assertTrue(values, f"{path.name}: resolved breakpoint source requires values")

                for index, value in enumerate(values):
                    self.assertIsInstance(value, dict, f"{path.name}: values[{index}] must be a mapping")
                    self.assertTrue(str(value.get("name", "")).strip(), f"{path.name}: values[{index}] requires name")
                    self.assertTrue(
                        str(value.get("media_query", "")).strip()
                        or value.get("min_width_px") is not None
                        or value.get("max_width_px") is not None,
                        f"{path.name}: values[{index}] requires media_query and/or min/max width",
                    )

    def test_ref001_owner_breakpoint_is_synced_with_runtime_contract(self) -> None:
        data = load_yaml(REF001)
        responsive = data["responsive"]
        evidence = responsive["breakpoint_evidence"]

        self.assertEqual("OWNER", evidence["source"])
        values = {value["name"]: value for value in evidence["values"]}
        self.assertEqual(767, values["mobile"]["max_width_px"])
        self.assertEqual("(max-width: 767px)", values["mobile"]["media_query"])
        self.assertEqual(768, values["desktop"]["min_width_px"])
        self.assertEqual("(min-width: 768px)", values["desktop"]["media_query"])

        unresolved = "\n".join(
            [*responsive.get("unknowns", []), *data.get("material_unknowns", [])]
        ).lower()
        self.assertNotIn("production breakpoint", unresolved)

        notes = "\n".join(data.get("owner_notes", []))
        self.assertIn("768px", notes)
        self.assertIn("375/1380", notes)


if __name__ == "__main__":
    unittest.main()
