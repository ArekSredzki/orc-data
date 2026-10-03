import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from .history import Archive, history_path


def boat(reference='old', gph=600):
    return dict(sailnumber='CAN/CAN1995', country='CAN', name='Off Piste', reference=reference,
                rating=dict(gph=gph, osn=570), boat=dict(type='Salona 41', sizes={'loa': 12}, issue_date=None),
                vpp=dict(speeds=[6], angles=[90], **{'90': [5]}))


class HistoryTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)

    def test_retains_previous_certificate_and_latest_pointer(self):
        archive = Archive(self.root)
        archive.add(boat(), observed_at='2026-08-31', source='git:old')
        archive.add(boat('new', 590), observed_at='2026-10-02', source='import', latest=True, vpp_year=2026, family='ORC')
        result = archive.document('CAN/CAN1995')
        self.assertEqual(result['latest'], 'new')
        self.assertEqual({v['id'] for v in result['versions']}, {'old', 'new'})
        self.assertEqual(result['versions'][0]['vpp_year'], 2026)

    def test_metadata_enrichment_is_not_an_extra_certificate(self):
        archive = Archive(self.root)
        legacy = boat(None)
        alias = archive.add(legacy)
        richer = boat('old')
        richer['boat']['issue_date'] = '2026-08-31'
        richer['rating']['aph_tod'] = 500
        archive.add(richer, latest=True)
        result = archive.document(legacy['sailnumber'])
        self.assertEqual(len(result['versions']), 1)
        self.assertEqual(result['aliases'][alias], 'old')
        self.assertEqual(result['versions'][0]['boat']['rating']['aph_tod'], 500)

    def test_distinct_references_with_identical_ratings_are_retained(self):
        archive = Archive(self.root)
        archive.add(boat('one'))
        archive.add(boat('two'))
        self.assertEqual(len(archive.document('CAN/CAN1995')['versions']), 2)

    def test_conflicting_reference_is_not_overwritten(self):
        archive = Archive(self.root)
        archive.add(boat())
        with self.assertRaises(ValueError):
            archive.add(boat(gph=999))
        self.assertEqual(archive.document('CAN/CAN1995')['versions'][0]['boat']['rating']['gph'], 600)

    def test_unknown_dates_and_anonymous_boats(self):
        archive = Archive(self.root)
        archive.add(boat(None), observed_at='2025-06-02')
        entry = archive.document('CAN/CAN1995')['versions'][0]
        self.assertIsNone(entry['issue_date'])
        self.assertIsNone(entry['vpp_year'])
        anonymous = boat(); anonymous['sailnumber'] = 'CAN/_1'
        self.assertIsNone(archive.add(anonymous))
        self.assertIsNone(archive.document('CAN/_1'))

    def test_persist_reload_is_idempotent_and_case_safe(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            archive = Archive(root)
            archive.add(boat(), latest=True)
            archive.save()
            before = history_path(root, 'CAN/CAN1995').read_bytes()
            restored = Archive(root)
            restored.add(boat(), latest=True)
            restored.save()
            self.assertEqual(before, history_path(root, 'CAN/CAN1995').read_bytes())
            self.assertNotEqual(history_path(root, 'CAN/abc'), history_path(root, 'CAN/ABC'))
            self.assertEqual(history_path(root, '../odd').parent, root)

    def test_new_metadata_cannot_replace_existing_measurements(self):
        archive = Archive(self.root)
        original = boat(); original['rating']['aph_tod'] = 500
        archive.add(original)
        incoming = boat(); incoming['rating']['aph_tod'] = 999
        incoming['boat']['issue_date'] = '2026-08-31'
        with self.assertRaises(ValueError):
            archive.add(incoming)
        incoming['rating']['aph_tod'] = 500
        archive.add(incoming)
        saved = archive.document('CAN/CAN1995')['versions'][0]
        self.assertEqual(saved['boat']['rating']['aph_tod'], 500)
        self.assertEqual(saved['issue_date'], '2026-08-31')

    def test_site_export_archives_before_replacing_latest(self):
        from . import json_output
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory)
            target = site / 'data/CAN/CAN1995.json'
            target.parent.mkdir(parents=True)
            target.write_text(json.dumps(boat('old')))
            with patch.object(json_output, 'SITE_PATH', site), patch.object(json_output, 'DATA_PATH', site / 'data'), patch.object(json_output, 'INDEX_PATH', site / 'index.json'), patch.object(json_output, 'COUNTRIES', ['CAN']), patch.object(json_output, 'format_data', return_value=boat('new', 590)):
                # The exporter writes relative to its site root.
                json_output.jsonwriter_site([{'RefNo': 'new', 'Family': 'ORC'}], vpp_year=2026)
            document = json.loads(history_path(site / 'history', 'CAN/CAN1995').read_text())
            self.assertEqual(document['latest'], 'new')
            self.assertEqual({v['id'] for v in document['versions']}, {'old', 'new'})
            self.assertEqual(json.loads(target.read_text())['reference'], 'new')
