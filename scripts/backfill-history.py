"""Recover unique certificate snapshots from local Git; safe to rerun.

Usage: python3 scripts/backfill-history.py [--boat CAN/CAN1995] [--source-dir data/2026]
Only snapshots captured in this repository are recoverable. Commit dates are
observation dates, never certificate issue dates. Anonymous sail numbers are skipped.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parser.history import Archive  # noqa: E402


def backfill(boat_filter=None, source_dir=None):
    archive = Archive()
    pathspec = f'site/data/{boat_filter}.json' if boat_filter else 'site/data'
    log = subprocess.check_output(['git', '-c', 'core.quotepath=false', 'log',
                                   '--format=COMMIT %H %cI', '--raw', '--no-abbrev', '--no-renames',
                                   'HEAD', '--', pathspec], text=True)
    objects = {}
    for line in log.splitlines():
        if line.startswith('COMMIT '):
            _, commit, observed = line.split(' ', 2)
        elif line.startswith(':'):
            metadata, path = line.split('\t', 1)
            if path.startswith('"'):
                path = json.loads(path)
            blob = metadata.split()[3]
            if path.endswith('.json') and blob != '0' * 40:
                objects.setdefault(blob, (commit, observed))
    process = subprocess.Popen(['git', 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    try:
        for count, (blob, (commit, observed)) in enumerate(objects.items(), 1):
            process.stdin.write((blob + '\n').encode()); process.stdin.flush()
            header = process.stdout.readline().split()
            content = process.stdout.read(int(header[2])); process.stdout.read(1)
            boat = json.loads(content)
            if boat_filter and boat.get('sailnumber') != boat_filter:
                continue
            archive.add(boat, observed_at=observed, source=f'git:{commit}')
            if count % 10000 == 0:
                print(f'Read {count}/{len(objects)} unique Git snapshots', flush=True)
    finally:
        process.stdin.close(); process.stdout.close(); process.wait()
    metadata = {}
    if source_dir:
        source_dir = Path(source_dir)
        year = int(source_dir.name)
        for path in source_dir.glob('*.json'):
            for record in json.loads(path.read_text(encoding='utf-8-sig'), strict=False)['rms']:
                if record.get('RefNo'):
                    metadata[record['RefNo']] = (year, record.get('Family'))
    current = [Path(f'site/data/{boat_filter}.json')] if boat_filter else sorted(Path('site/data').glob('*/*.json'))
    for path in current:
        boat = json.loads(path.read_text())
        year, family = metadata.get(boat.get('reference'), (None, None))
        archive.add(boat, latest=True, vpp_year=year, family=family)
    archive.save()
    docs = [archive.document(key) for key in archive.boats]
    docs = [doc for doc in docs if doc]
    print(f'Saved {sum(len(d["versions"]) for d in docs)} certificate versions for {len(docs)} sail numbers; '
          f'{sum(len(d["versions"]) > 1 for d in docs)} have multiple versions.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--boat')
    parser.add_argument('--source-dir')
    args = parser.parse_args()
    backfill(args.boat, args.source_dir)
