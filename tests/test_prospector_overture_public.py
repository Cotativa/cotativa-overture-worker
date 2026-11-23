"""Deterministic public Prospector Overture tests; no company/customer data."""
import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from prospector_overture import norm, profile, sql_regex, parse_json, first_list, haversine, score


class ProspectorPublicTests(unittest.TestCase):
    def test_portuguese_normalization(self):
        self.assertEqual(norm("  Aquecedor São Paulo!  "), "aquecedor sao paulo")

    def test_known_taxonomy(self):
        categories, keywords = profile("Aquecedores")
        self.assertIn("water_heater_installation_repair", categories)
        self.assertIn("boiler", keywords)

    def test_generic_taxonomy_fallback(self):
        categories, terms = profile("Engenharia inovadora")
        self.assertEqual(categories, [])
        self.assertIn("engenharia", terms)

    def test_regex_normalizes_taxonomy(self):
        pattern = sql_regex(["water_heater_installation_repair"])
        self.assertEqual(pattern, "water.*heater.*installation.*repair")
        self.assertEqual(sql_regex(["Aquecedor", "aquecedor"]), "aquecedor")

    def test_json_parser_does_not_eval(self):
        self.assertEqual(parse_json('{"a": 1}', {}), {"a": 1})
        self.assertEqual(parse_json("invalid", []), [])
        self.assertEqual(first_list(["", "https://example.org"]), "https://example.org")

    def test_radius_distance(self):
        self.assertAlmostEqual(haversine(-23.55, -46.63, -23.55, -46.63), 0)
        self.assertTrue(math.isfinite(haversine(-23.55, -46.63, -23.56, -46.63)))

    def test_score_bounds(self):
        self.assertEqual(score({}), 64)
        self.assertLessEqual(score({"phone": "000", "email": "x", "address": "Public", "confidence": 1}), 96)


if __name__ == "__main__":
    unittest.main()
