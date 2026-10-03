"""Certificate snapshots, grouped by recorded sail number (not inferred boat identity)."""
import copy
import hashlib
import json
from pathlib import Path
import re


def history_path(root, sailnumber):
    # Hex preserves case on macOS and cannot introduce path traversal.
    return Path(root) / (sailnumber.encode('utf-8').hex() + '.json')


def fingerprint(boat):
    def numeric(value):
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, dict):
            return {str(k): numeric(v) for k, v in value.items()}
        if isinstance(value, list):
            return [numeric(v) for v in value]
        return value
    sizes = boat['boat']['sizes']
    core = [boat['sailnumber'], (boat.get('name') or '').strip().upper(),
            (boat['boat'].get('type') or '').strip().upper(),
            boat['rating'].get('gph'), boat['rating'].get('osn'), boat['vpp'],
            {key: sizes.get(key, 0) for key in ('loa', 'beam', 'draft', 'displacement', 'main', 'genoa',
                                              'spinnaker', 'spinnaker_asym', 'crew', 'wetted_surface')}]
    return hashlib.sha256(json.dumps(numeric(core), sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def enrich(existing, incoming):
    """Fill missing metadata without rewriting any archived measurements."""
    result = copy.deepcopy(existing)
    for key, value in incoming.items():
        if key not in result or result[key] is None or result[key] == '':
            result[key] = copy.deepcopy(value)
        elif isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = enrich(result[key], value)
    return result


class Archive:
    def __init__(self, root=Path('site/history')):
        self.root = Path(root)
        self.boats = {}
        self.dirty = set()

    def _load(self, sailnumber):
        if sailnumber not in self.boats:
            path = history_path(self.root, sailnumber)
            if path.exists():
                doc = json.loads(path.read_text())
                self.boats[sailnumber] = {**doc, 'versions': {v['id']: v for v in doc['versions']}}
            else:
                self.boats[sailnumber] = dict(sailnumber=sailnumber, latest=None, aliases={}, versions={})
        return self.boats[sailnumber]

    def add(self, boat, observed_at=None, source=None, latest=False, vpp_year=None, family=None):
        sailnumber = boat['sailnumber']
        if '/_' in sailnumber:
            return None  # generated anonymous numbers are not stable across imports
        reference = boat.get('reference')
        if reference and not re.fullmatch(r'[A-Za-z0-9]+', reference):
            reference = None
        signature = fingerprint(boat)
        identifier = reference or 'snapshot-' + signature[:24]
        doc = self._load(sailnumber)
        old = doc['versions'].get(identifier)
        if old and fingerprint(old['boat']) != signature:
            raise ValueError(f'Conflicting immutable certificate {sailnumber} {identifier}')
        entry = dict(id=identifier, reference=reference, issue_date=boat['boat'].get('issue_date'),
                     vpp_year=vpp_year, family=family, observed_at=observed_at, source=source,
                     boat=copy.deepcopy(boat))
        if old:
            # Additional metadata from a newer parser is not a new certificate.
            entry['boat'] = enrich(old['boat'], entry['boat'])
            for key in ('issue_date', 'vpp_year', 'family', 'observed_at', 'source'):
                entry[key] = old.get(key) or entry[key]
        doc['versions'][identifier] = entry
        if latest:
            doc['latest'] = identifier
        self.dirty.add(sailnumber)
        return identifier

    def document(self, sailnumber):
        doc = self._load(sailnumber)
        if not doc['versions']:
            return None
        versions = dict(doc['versions'])
        aliases = dict(doc['aliases'])
        referenced = {}
        for entry in versions.values():
            if entry['reference']:
                referenced.setdefault(fingerprint(entry['boat']), []).append(entry)
        for identifier, entry in list(versions.items()):
            if entry['reference']:
                continue
            matches = referenced.get(fingerprint(entry['boat']), [])
            matches = [v for v in matches if not entry['issue_date'] or not v['issue_date'] or entry['issue_date'] == v['issue_date']]
            if len(matches) == 1:
                aliases[identifier] = matches[0]['id']
                del versions[identifier]
        latest = aliases.get(doc['latest'], doc['latest'])
        ordered = sorted(versions.values(), key=lambda v: (v['id'] == latest, v['issue_date'] or v['observed_at'] or '', v['id']), reverse=True)
        return dict(sailnumber=sailnumber, latest=latest, aliases=aliases, versions=ordered)

    def save(self):
        self.root.mkdir(parents=True, exist_ok=True)
        for sailnumber in sorted(self.dirty):
            doc = self.document(sailnumber)
            if not doc:
                continue
            path = history_path(self.root, sailnumber)
            content = json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n'
            if not path.exists() or path.read_text() != content:
                temporary = path.with_suffix('.tmp')
                temporary.write_text(content)
                temporary.replace(path)
        self.dirty.clear()
