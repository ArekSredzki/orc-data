import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('backfill', Path(__file__).with_name('backfill-references.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BackfillTest(unittest.TestCase):
    def test_only_unambiguous_matching_certificates_are_updated(self):
        fixture = json.loads(Path('site/data/GER/ORC213.json').read_text())
        fixture.pop('reference', None)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'source/2026/GER2026.json'
            source.parent.mkdir(parents=True)
            target = root / 'site/GER/ORC213.json'
            target.parent.mkdir(parents=True)
            for references, gph, expected in [(['001ABC'], 753.7, '001ABC'),
                                               (['001ABC', '002DEF'], 753.7, None),
                                               (['001ABC'], 999, None)]:
                with self.subTest(references=references, gph=gph):
                    source.write_text(json.dumps({'rms': [{'SailNo': 'ORC213', 'RefNo': ref} for ref in references]}))
                    target.write_text(json.dumps(fixture))
                    def format_record(record):
                        return {**fixture, 'rating': {**fixture['rating'], 'gph': gph}, 'reference': record['RefNo']}
                    with patch.object(module, 'format_data', side_effect=format_record):
                        module.backfill(root / 'source', root / 'site')
                    result = json.loads(target.read_text())
                    self.assertEqual(result.get('reference'), expected)
                    result.pop('reference', None)
                    self.assertEqual(result, fixture)
