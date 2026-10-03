"""Refresh public certificate page IDs, retaining known links for older references."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from parser import COUNTRIES  # noqa: E402


def parse_links(xml):
    root = ET.fromstring(xml)
    data = root.find('DATA')
    if data is None:
        raise ValueError('ORC response has no certificate DATA')
    links = {}
    for row in data.findall('ROW'):
        reference = (row.findtext('RefNo') or '').strip()
        identifier = (row.findtext('dxtID') or '').strip()
        if not re.fullmatch(r'[A-Za-z0-9]+', reference) or not re.fullmatch(r'[0-9]+', identifier):
            raise ValueError('Invalid ORC certificate reference or page ID')
        if reference in links and links[reference] != identifier:
            raise ValueError(f'Conflicting page IDs for {reference}')
        links[reference] = identifier
    return links


def fetch_links(country):
    url = f'https://data.orc.org/public/WPub.dll?action=activecerts&CountryId={country}&Family=1'
    response = subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location',
                               '--retry', '3', '--max-time', '120', url], check=True, capture_output=True)
    return parse_links(response.stdout)


def refresh(destination=Path('site/certificate-links.json')):
    links = json.loads(destination.read_text()) if destination.exists() else {}
    # Validate all responses before replacing the existing map. A failed download
    # must not erase previously verified links or publish an incomplete refresh.
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(fetch_links, COUNTRIES):
            links.update(result)
    temporary = destination.with_suffix('.tmp')
    temporary.write_text(json.dumps(links, sort_keys=True, separators=(',', ':')) + '\n')
    temporary.replace(destination)
    print(f'Saved {len(links)} ORC certificate links.')


if __name__ == '__main__':
    refresh()
