import { expect, it } from 'vitest';

import { boatHref, comparisonHref, readComparison, certificateLabel, numericDelta } from './certificate-history.js';

it('round trips independent same-boat certificate references in shareable URLs', () => {
    const url = comparisonHref(['CAN/CAN1995', 'CAN/CAN1995'], ['03430004WVE', '03430005194']);
    expect(readComparison(url)).toEqual({
        boats: ['CAN/CAN1995', 'CAN/CAN1995'],
        references: ['03430004WVE', '03430005194'],
    });
    expect(boatHref('CAN/CAN1995', '03430004WVE', 'print-')).toBe('#print-CAN/CAN1995?ref=03430004WVE');
});
it('keeps legacy URLs and missing dates meaningful', () => {
    expect(readComparison('#compare-GER/A|')).toEqual({ boats: ['GER/A', ''], references: ['', ''] });
    expect(boatHref('GER/A')).toBe('#GER/A');
    expect(certificateLabel({ id: 'snapshot-123', observed_at: '2025-06-02' })).toContain('Issue date unknown');
    expect(certificateLabel({ id: 'snapshot-123', observed_at: '2025-06-02' })).toContain('saved 2025-06-02');
});
it('calculates signed changes without treating missing values as zero', () => {
    expect(numericDelta(590.8, 589.6)).toBe('−1.2');
    expect(numericDelta(0, 1.2)).toBe('+1.2');
    expect(numericDelta(0, 0)).toBe('0');
    expect(numericDelta(null, 1)).toBe('—');
});
