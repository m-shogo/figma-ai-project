from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import build_sanitized_run_workspace as builder  # noqa: E402


class SanitizedRunWorkspaceTests(unittest.TestCase):
    def test_profile_rejects_repository_root_include(self) -> None:
        profile = {
            "schema_version": 1,
            "workspace_id": "TEST",
            "reference_id": "REF-TEST",
            "include_paths": ["."],
            "exclude_globs": [],
            "forbidden_globs": [],
        }
        errors = builder.validate_profile(profile)
        self.assertTrue(any("explicit repository-relative path" in error for error in errors))

    def test_forbidden_files_are_physically_absent_and_manifested_files_are_hashed(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent = Path(temp_dir)
            root = parent / "source"
            output = parent / "sanitized"
            root.mkdir()
            (root / "docs").mkdir()
            (root / "docs" / "workflow.md").write_text("workflow\n", encoding="utf-8")
            (root / "answer").mkdir()
            (root / "answer" / "final.css").write_text("secret-final-answer\n", encoding="utf-8")
            profile_path = root / "workspace.yaml"
            profile_path.write_text(
                "\n".join(
                    [
                        "schema_version: 1",
                        "workspace_id: TEST-SANITIZED",
                        "reference_id: REF-TEST",
                        "include_paths:",
                        "  - docs",
                        "  - answer",
                        "exclude_globs: []",
                        "forbidden_globs:",
                        "  - answer/*",
                        "",
                    ]
                ),
                encoding="utf-8",
            )

            manifest = builder.build_workspace(root, profile_path, output)
            self.assertEqual(1, manifest["file_count"])
            self.assertTrue((output / "docs" / "workflow.md").is_file())
            self.assertFalse((output / "answer").exists())
            self.assertEqual([], builder.audit_workspace(output, builder.load_profile(profile_path)))

            stored = json.loads((output / builder.MANIFEST_NAME).read_text(encoding="utf-8"))
            self.assertEqual("docs/workflow.md", stored["files"][0]["path"])
            self.assertEqual(builder.file_sha256(output / "docs" / "workflow.md"), stored["files"][0]["sha256"])

    def test_audit_rejects_unmanifested_contamination(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent = Path(temp_dir)
            root = parent / "source"
            output = parent / "sanitized"
            root.mkdir()
            (root / "docs").mkdir()
            (root / "docs" / "workflow.md").write_text("workflow\n", encoding="utf-8")
            profile_path = root / "workspace.yaml"
            profile_path.write_text(
                "\n".join(
                    [
                        "schema_version: 1",
                        "workspace_id: TEST-AUDIT",
                        "reference_id: REF-TEST",
                        "include_paths:",
                        "  - docs",
                        "exclude_globs: []",
                        "forbidden_globs:",
                        "  - leaked/*",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            profile = builder.load_profile(profile_path)
            builder.build_workspace(root, profile_path, output)
            (output / "leaked").mkdir()
            (output / "leaked" / "repair.txt").write_text("contaminated\n", encoding="utf-8")

            errors = builder.audit_workspace(output, profile)
            self.assertTrue(any("forbidden paths" in error for error in errors))
            self.assertTrue(any("unmanifested files" in error for error in errors))

    def test_replace_only_deletes_a_workspace_owned_by_same_profile(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent = Path(temp_dir)
            root = parent / "source"
            output = parent / "sanitized"
            root.mkdir()
            (root / "docs").mkdir()
            (root / "docs" / "workflow.md").write_text("v1\n", encoding="utf-8")
            profile_path = root / "workspace.yaml"
            profile_path.write_text(
                "\n".join(
                    [
                        "schema_version: 1",
                        "workspace_id: TEST-REPLACE",
                        "reference_id: REF-TEST",
                        "include_paths:",
                        "  - docs",
                        "exclude_globs: []",
                        "forbidden_globs: []",
                        "",
                    ]
                ),
                encoding="utf-8",
            )

            builder.build_workspace(root, profile_path, output)
            (root / "docs" / "workflow.md").write_text("v2\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "output already exists"):
                builder.build_workspace(root, profile_path, output)
            builder.build_workspace(root, profile_path, output, replace=True)
            self.assertEqual("v2\n", (output / "docs" / "workflow.md").read_text(encoding="utf-8"))

    def test_ref001_profile_selects_evidence_not_repaired_answer(self) -> None:
        profile_path = ROOT / "experiments" / "ref001-clean-run" / "workspace.yaml"
        profile = builder.load_profile(profile_path)
        files = builder.collect_source_files(ROOT, profile)
        relative = {path.relative_to(ROOT).as_posix() for path in files}

        self.assertIn("references/chiba-keizai-sample.reference.yaml", relative)
        self.assertIn("experiments/ref001-wordpress-acf/implementation-profile.yaml", relative)
        self.assertIn("docs/context-package.md", relative)
        self.assertFalse(any(path.startswith("experiments/ref001-wordpress-acf/fixture-theme/") for path in relative))
        self.assertFalse(any(path.startswith("experiments/ref001-wordpress-acf/visual-preview/") for path in relative))
        self.assertFalse(any(path.startswith("experiments/ref001-wordpress-acf/artifacts/") for path in relative))
        self.assertFalse(any(path.startswith("research/figma-web-friction/") for path in relative))
        self.assertFalse(any("ref001" in Path(path).name.lower() and path.startswith("scripts/") for path in relative))
        self.assertNotIn("scripts/validate_wordpress_learning_fixture.py", relative)


if __name__ == "__main__":
    unittest.main()
