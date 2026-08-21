from __future__ import annotations

import unittest

from scripts.validate_ref001_benchmark_replay import main


class BenchmarkReplayPipelineTests(unittest.TestCase):
    def test_ref001_benchmark_clean_replay_pipeline(self) -> None:
        self.assertEqual(0, main())


if __name__ == "__main__":
    unittest.main()
