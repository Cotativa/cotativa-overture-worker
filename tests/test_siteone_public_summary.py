"""Tests ensuring the public worker never emits customer or URL-level data."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from siteone_public_summary import summarize, PUBLIC_SITE


class PublicSummaryTest(unittest.TestCase):
    def report(self):
        return {
            "qualityScores": {
                "overall": {"score": 86},
                "categories": [
                    {"code": "seo", "score": 80, "secret": "sensitive"},
                    {"code": "personalData", "score": 90},
                ],
            },
            "stats": {"totalUrls": 3, "privateEmail": "secret@example.com"},
            "summary": {"leads": [{"name": "private"}]},
            "results": [{"url": "https://cotativa.com/private-url", "token": "TOP_SECRET"}],
            "cotativa": {"request_id": "sensitive", "callback_token": "TOP_SECRET"},
        }

    def test_aggregate_only(self):
        result = summarize(self.report())
        self.assertEqual(result["target"], PUBLIC_SITE)
        self.assertEqual(result["overall_score"], 86.0)
        self.assertEqual(result["total_urls"], 3)
        self.assertEqual(result["categories"], [{"code": "seo", "score": 80.0}])
        self.assertNotIn("secret", str(result).lower())
        self.assertNotIn("private-url", str(result))
        self.assertNotIn("sensitive", str(result).lower())

    def test_reject_broken_report(self):
        with self.assertRaises(ValueError):
            summarize({"qualityScores": {}, "stats": {}, "summary": {}, "results": None})

    def test_reject_overrange_and_nonnumeric(self):
        result = self.report()
        result["qualityScores"]["overall"]["score"] = "99"
        result["stats"]["totalUrls"] = 1000000
        filtered = summarize(result)
        self.assertIsNone(filtered["overall_score"])
        self.assertIsNone(filtered["total_urls"])


if __name__ == "__main__":
    unittest.main()
