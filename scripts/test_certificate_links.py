import importlib.util
from pathlib import Path
import unittest
import json
import tempfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('links', Path(__file__).with_name('certificate-links.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CertificateLinksTest(unittest.TestCase):
    def test_maps_exact_reference_to_numeric_certificate_id(self):
        xml = '<ROOT><DATA><ROW><RefNo>03430005194</RefNo><dxtID>264191</dxtID></ROW></DATA></ROOT>'
        self.assertEqual(module.parse_links(xml), {'03430005194': '264191'})

    def test_rejects_invalid_or_conflicting_identifiers(self):
        for rows in [
            '<ROW><RefNo>abc</RefNo><dxtID>../bad</dxtID></ROW>',
            '<ROW><RefNo>abc</RefNo><dxtID>1</dxtID></ROW><ROW><RefNo>abc</RefNo><dxtID>2</dxtID></ROW>',
        ]:
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                module.parse_links(f'<ROOT><DATA>{rows}</DATA></ROOT>')

    def test_empty_feed_is_valid_but_error_response_is_not(self):
        self.assertEqual(module.parse_links('<ROOT><DATA/></ROOT>'), {})
        with self.assertRaises(ValueError):
            module.parse_links('<ROOT><ERROR>Unavailable</ERROR></ROOT>')

    def test_refresh_preserves_old_links_and_failed_download_preserves_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'links.json'
            target.write_text(json.dumps({'old': '1'}))
            with patch.object(module, 'COUNTRIES', ['CAN']), patch.object(module, 'fetch_links', return_value={'new': '2'}):
                module.refresh(target)
            self.assertEqual(json.loads(target.read_text()), {'old': '1', 'new': '2'})
            before = target.read_bytes()
            with patch.object(module, 'COUNTRIES', ['CAN']), patch.object(module, 'fetch_links', side_effect=ValueError('failed')):
                with self.assertRaises(ValueError):
                    module.refresh(target)
            self.assertEqual(target.read_bytes(), before)
