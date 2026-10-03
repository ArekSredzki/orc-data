export function boatHref(sailnumber, reference = '', prefix = '') {
    const params = new URLSearchParams();
    if (reference) params.set('ref', reference);
    return `#${prefix}${sailnumber}${params.size ? `?${params}` : ''}`;
}

export function comparisonHref(boats, references = []) {
    const params = new URLSearchParams();
    if (boats[0] && references[0]) params.set('refA', references[0]);
    if (boats[1] && references[1]) params.set('refB', references[1]);
    return `#compare-${boats.map((boat) => boat || '').join('|')}${params.size ? `?${params}` : ''}`;
}

export function readComparison(hash) {
    const [path, query] = hash.replace(/^#/, '').split('?');
    const boats = path.replace(/^compare-?/, '').split('|');
    const params = new URLSearchParams(query);
    return {
        boats: [boats[0] || '', boats[1] || ''],
        references: [params.get('refA') || '', params.get('refB') || ''],
    };
}

export function certificateLabel(entry) {
    if (!entry) return '';
    const date = entry.issue_date?.slice(0, 10) || 'Issue date unknown';
    const identity = entry.reference
        ? `ORC ${entry.reference}`
        : `Snapshot ${entry.id?.replace('snapshot-', '').slice(0, 8) || ''}`;
    const saved = !entry.issue_date && entry.observed_at ? ` · saved ${entry.observed_at.slice(0, 10)}` : '';
    return `${date} · ${identity}${saved}`;
}

export function boatCertificateLabel(boat) {
    return certificateLabel(
        boat?.certificate ||
            (boat?.reference ? { reference: boat.reference, issue_date: boat.boat?.issue_date } : null),
    );
}

export function numericDelta(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b)) return '—';
    const difference = Math.round((b - a) * 10000) / 10000;
    return difference === 0 ? '0' : `${difference < 0 ? '−' : '+'}${Math.abs(difference)}`;
}
