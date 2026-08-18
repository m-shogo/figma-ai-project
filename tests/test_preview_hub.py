from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.attach_visual_baseline import write_preview_hub


class PreviewHubTests(unittest.TestCase):
    def test_hub_links_all_requested_previews(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory).resolve()
            (output / "ref-001").mkdir(parents=True)
            write_preview_hub(output)
            root = (output / "index.html").read_text(encoding="utf-8")
            for href in (
                "./ref-001/latest/preview/",
                "./ref-001/final/preview/",
                "./ref-001/v2/preview/",
                "./ref-001/v3/preview/",
                "./ref-002/latest/preview/",
            ):
                self.assertIn(href, root)
            self.assertIn("今ここを見る", root)
            ref001 = (output / "ref-001/index.html").read_text(encoding="utf-8")
            self.assertIn('href="./latest/preview/"', ref001)
            self.assertIn('href="../ref-002/latest/preview/"', ref001)


if __name__ == "__main__":
    unittest.main()
