import json
import tempfile
import unittest
from pathlib import Path

from fast_loop_next import materialize_bytes
from visual_truth_guard import diagnose_reference_wrapper, durable_asset_state


class VisualTruthGuardTests(unittest.TestCase):
    def test_ref002_pc_final_truth_has_parent_only_one_px_left_gutter(self):
        result = diagnose_reference_wrapper(
            1381,
            [
                {"id": "2270:4566", "x": 1, "width": 1380},
                {"id": "2270:4567", "x": 1, "width": 1380},
                {"id": "2270:4568", "x": 1, "width": 1380},
                {"id": "2270:4569", "x": 1, "width": 1380},
                {"id": "2270:4570", "x": 1, "width": 1380},
                {"id": "2270:4571", "x": 1, "width": 1380},
                {"id": "2270:4572", "x": 1, "width": 1380},
                {"id": "2270:4573", "x": 1, "width": 1380},
            ],
        )
        self.assertEqual(result["kind"], "wrapper-only-gutter")
        self.assertEqual(result["leftGutter"], 1)
        self.assertEqual(result["rightGutter"], 0)
        self.assertEqual(result["runtimeTargetWidth"], 1380)
        self.assertTrue(result["normalizeReference"])
        self.assertFalse(result["mutateRuntime"])

    def test_ref002_structured_pc_is_aligned_at_1380(self):
        result = diagnose_reference_wrapper(
            1380,
            [
                {"id": "839:4677", "x": 0, "width": 1380},
                {"id": "839:4678", "x": 0, "width": 1380},
                {"id": "839:4688", "x": 0, "width": 1380},
            ],
        )
        self.assertEqual(result["kind"], "aligned")
        self.assertEqual(result["runtimeTargetWidth"], 1380)
        self.assertFalse(result["normalizeReference"])

    def test_ref002_sp_final_truth_has_no_wrapper_artifact(self):
        result = diagnose_reference_wrapper(
            375,
            [
                {"id": "sp-header", "x": 0, "width": 375},
                {"id": "sp-hero", "x": 0, "width": 375},
                {"id": "sp-news", "x": 0, "width": 375},
            ],
        )
        self.assertEqual(result["kind"], "aligned")
        self.assertFalse(result["normalizeReference"])

    def test_normal_content_inset_is_not_misclassified_as_wrapper(self):
        result = diagnose_reference_wrapper(
            1380,
            [
                {"id": "card-a", "x": 110, "width": 1160},
                {"id": "card-b", "x": 110, "width": 1160},
            ],
        )
        self.assertEqual(result["kind"], "mixed-or-content-inset")
        self.assertFalse(result["normalizeReference"])

    def test_inconsistent_children_do_not_create_wrapper_rule(self):
        result = diagnose_reference_wrapper(
            1381,
            [
                {"id": "a", "x": 1, "width": 1380},
                {"id": "b", "x": 0, "width": 1381},
            ],
        )
        self.assertEqual(result["kind"], "mixed-or-content-inset")

    def test_asset_is_pending_until_durable_bytes_exist(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            record = {
                "logicalId": "events-card",
                "sha256": "a" * 64,
                "sizeBytes": 100,
                "path": "sha256/aa/" + "a" * 64 + ".png",
            }
            result = durable_asset_state(record, root)
            self.assertEqual(result["state"], "ASSET_PENDING")
            self.assertFalse(result["ready"])
            self.assertEqual(result["reason"], "durable-bytes-not-present")

    def test_existing_materializer_record_becomes_ready_only_after_hash_verification(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            record = materialize_bytes(
                b"durable-ref002-fixture-bytes",
                root,
                "events-card",
                ".png",
                {"figmaFileKey": "RfAQQ28V1HGaeIcpgRmQq1", "nodeId": "894:19313"},
            )
            result = durable_asset_state(record, root)
            self.assertEqual(result["state"], "ASSET_READY")
            self.assertTrue(result["ready"])
            self.assertEqual(result["sha256"], record["sha256"])

    def test_modified_durable_bytes_are_corrupt_not_pending_or_ready(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            record = materialize_bytes(b"correct", root, "events-card", ".png")
            (root / record["path"]).write_bytes(b"changed")
            result = durable_asset_state(record, root)
            self.assertEqual(result["state"], "ASSET_CORRUPT")
            self.assertFalse(result["ready"])

    def test_ephemeral_url_in_registry_metadata_is_invalid(self):
        with tempfile.TemporaryDirectory() as tmp:
            ephemeral = "/".join(["https:", "", "www.figma.com", "api", "mcp", "asset", "REDACTED"])
            record = {
                "path": "asset.png",
                "sha256": "a" * 64,
                "sizeBytes": 10,
                "metadata": {"source": ephemeral},
            }
            result = durable_asset_state(record, Path(tmp))
            self.assertEqual(result["state"], "ASSET_INVALID_EPHEMERAL_METADATA")
            self.assertNotIn("source", result)
            self.assertNotIn("api/mcp/asset/", json.dumps(result))

    def test_unsafe_relative_path_never_becomes_ready(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = durable_asset_state(
                {"path": "../asset.png", "sha256": "a" * 64, "sizeBytes": 10},
                Path(tmp),
            )
            self.assertEqual(result["state"], "ASSET_PENDING")
            self.assertFalse(result["ready"])


if __name__ == "__main__":
    unittest.main()
