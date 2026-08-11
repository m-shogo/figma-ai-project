from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED_SCRIPT = ROOT / "experiments" / "ref001-wordpress-acf" / "seed" / "seed-ref001.php"
SEED_README = ROOT / "experiments" / "ref001-wordpress-acf" / "seed" / "README.md"


class Ref001WordPressSeedScriptTests(unittest.TestCase):
    def test_seed_uses_acf_field_keys_and_readback(self) -> None:
        source = SEED_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("update_field( $field_key, $field_value, $post_id )", source)
        self.assertIn("get_field( $field_key, $post_id, false )", source)
        self.assertIn("0 !== strpos( $field_key, 'field_' )", source)

    def test_seed_does_not_require_php8_string_helpers(self) -> None:
        source = SEED_SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn("str_starts_with(", source)
        self.assertNotIn("str_contains(", source)

    def test_page_creation_is_explicit_opt_in(self) -> None:
        source = SEED_SCRIPT.read_text(encoding="utf-8")
        self.assertIn("$allow_create", source)
        self.assertIn("'create'", source)
        self.assertIn("does not exist", source)

    def test_direct_post_meta_write_is_only_used_for_wordpress_template_assignment(self) -> None:
        source = SEED_SCRIPT.read_text(encoding="utf-8")
        direct_meta_lines = [line.strip() for line in source.splitlines() if "update_post_meta(" in line]
        self.assertEqual(["update_post_meta( $post_id, '_wp_page_template', $template );"], direct_meta_lines)

    def test_readme_requires_capability_detection_for_acf_cli(self) -> None:
        readme = SEED_README.read_text(encoding="utf-8")
        self.assertIn('wp cli has-command "acf json import"', readme)
        self.assertIn("ACF Tools admin import", readme)


if __name__ == "__main__":
    unittest.main()
