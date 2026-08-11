from __future__ import annotations

import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import first_pass_evidence  # noqa: E402
import prepare_clean_replay  # noqa: E402


class EmptyEvidenceValidationReportingTests(unittest.TestCase):
    def test_first_pass_validate_reports_missing_run_records_as_skip(self) -> None:
        output = io.StringIO()
        with (
            patch.object(first_pass_evidence, "candidate_runs", return_value=[]),
            patch.object(sys, "argv", ["first_pass_evidence.py", "validate"]),
            redirect_stdout(output),
        ):
            self.assertEqual(0, first_pass_evidence.main())

        text = output.getvalue()
        self.assertIn("SKIP FIRST-PASS validation", text)
        self.assertIn("no run records found", text)
        self.assertIn("no immutable FIRST PASS evidence exists yet", text)

    def test_clean_replay_validate_reports_missing_pairs_as_skip(self) -> None:
        output = io.StringIO()
        with (
            patch.object(prepare_clean_replay, "candidate_replays", return_value=[]),
            patch.object(sys, "argv", ["prepare_clean_replay.py", "validate"]),
            redirect_stdout(output),
        ):
            self.assertEqual(0, prepare_clean_replay.main())

        text = output.getvalue()
        self.assertIn("SKIP clean-replay-pair validation", text)
        self.assertIn("no REPLAY run records found", text)
        self.assertIn("reproducibility has not been tested yet", text)


if __name__ == "__main__":
    unittest.main()
