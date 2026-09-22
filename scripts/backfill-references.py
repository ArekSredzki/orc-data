"""Backfill references only when source identity, ratings and polars match stored data.

Usage: python3 scripts/backfill-references.py path/to/data
Older certificates without matching source data are left untouched.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parser.json_output import format_data  # noqa: E402


def fingerprint(boat):
    return json.dumps([boat['sailnumber'], boat['name'], boat['boat']['type'],
                       boat['rating']['gph'], boat['rating']['osn'], boat['vpp']], sort_keys=True)


def backfill(source_dir, site_dir=Path('site/data')):
    references = {}
    for source in sorted(Path(source_dir).glob('*/*.json')):
        try:
            records = json.loads(source.read_text(encoding='utf-8-sig'), strict=False)['rms']
        except (ValueError, KeyError):
            continue
        for record in records:
            # Anonymous generated sail numbers cannot safely be matched across runs.
            if not record.get('SailNo'):
                continue
            boat = format_data({**record, 'country': source.name[:3]})
            boat = json.loads(json.dumps(boat))  # Normalize integer VPP keys.
            if boat['reference']:
                references.setdefault(fingerprint(boat), set()).add(boat['reference'])
    updated = 0
    for path in Path(site_dir).glob('*/*.json'):
        boat = json.loads(path.read_text())
        matches = references.get(fingerprint(boat), set())
        if len(matches) == 1 and not boat.get('reference'):
            boat['reference'] = next(iter(matches))
            path.write_text(json.dumps(boat, indent=2))
            updated += 1
    return updated


if __name__ == '__main__':
    print(f'Added references to {backfill(sys.argv[1])} matching certificates.')
