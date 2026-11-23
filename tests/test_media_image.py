"""Offline tests for synthetic image rendering in the public media lab."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "media-lab"))
from image_composer import compose, WIDTH, HEIGHT


class MediaImageTests(unittest.TestCase):
    def test_image_dimensions_and_visual_variety(self):
        im = compose({"title": "Exemplo de design", "body": "Texto fictício", "label": "TEST"})
        self.assertEqual(im.size, (WIDTH, HEIGHT))
        self.assertNotEqual(im.getpixel((0, 0)), im.getpixel((0, HEIGHT-1)))

    def test_input_validation(self):
        for data in ([], {}, {"title": ""}, {"title": "X" * 121}, {"title": "ok", "body": "Y" * 351}):
            with self.subTest(data=str(data)[:20]):
                with self.assertRaises(ValueError):
                    compose(data)


if __name__ == "__main__":
    unittest.main()
