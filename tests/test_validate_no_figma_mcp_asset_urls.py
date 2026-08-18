from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import validate_no_figma_mcp_asset_urls as gate  # noqa: E402


EPHEMERAL_URL = "https://" + "www.figma.com" + "/api/mcp/asset/secret-value"


class LeakDetectionTests(unittest.TestCase):
    def test_detects_ephemeral_url_in_utf8_text(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "leak.md"
            path.write_text(f"before\n{EPHEMERAL_URL}\nafter\n", encoding="utf-8")
            self.assertEqual(gate.find_ephemeral_url_leaks([path]), [(path, 2)])

    def test_accepts_non_secret_figma_design_url(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "safe.md"
            path.write_text(
                "https://www.figma.com/design/ZYTdtw4wCgkcBy2cVnhxVI/sample?node-id=1-2\n",
                encoding="utf-8",
            )
            self.assertEqual(gate.find_ephemeral_url_leaks([path]), [])

    def test_accepts_split_documentation_of_host_and_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "safe.md"
            path.write_text("host: www.figma.com\npath: /api/mcp/asset/...\n", encoding="utf-8")
            self.assertEqual(gate.find_ephemeral_url_leaks([path]), [])

    def test_skips_binary_and_large_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            binary = root / "binary.bin"
            binary.write_bytes(b"\x00" + EPHEMERAL_URL.encode("utf-8"))
            large = root / "large.txt"
            large.write_text(EPHEMERAL_URL, encoding="utf-8")

            self.assertIsNone(gate.readable_text(binary))
            self.assertIsNone(gate.readable_text(large, max_bytes=1))

    def test_reports_every_matching_line(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "two.txt"
            path.write_text(f"{EPHEMERAL_URL}\nok\n{EPHEMERAL_URL}\n", encoding="utf-8")
            self.assertEqual(gate.find_ephemeral_url_leaks([path]), [(path, 1), (path, 3)])


class CliTests(unittest.TestCase):
    def test_main_fails_for_explicit_leaking_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "leak.txt"
            path.write_text(EPHEMERAL_URL, encoding="utf-8")
            self.assertEqual(gate.main([str(path)]), 1)

    def test_main_passes_for_explicit_safe_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp).resolve() / "safe.txt"
            path.write_text("no temporary Figma URL here\n", encoding="utf-8")
            self.assertEqual(gate.main([str(path)]), 0)


if __name__ == "__main__":
    unittest.main()
