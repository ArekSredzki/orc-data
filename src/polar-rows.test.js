import { describe, expect, it } from 'vitest';

import { cardFontSizePt, MIN_BODY_PT, polarCard, polarSheet, sheetRowCount } from './polar-rows.js';
import { twa2awa, vmg2sog } from './util.js';

// A 7-speed certificate, trimmed to three wind angles. Values are from EST/EST688 so the
// derived numbers can be checked against the real data.
const VPP = {
    angles: [52, 90, 150],
    speeds: [6, 8, 10, 12, 14, 16, 20],
    52: [4.26, 5.06, 5.58, 5.76, 5.85, 5.89, 5.91],
    90: [4.68, 5.56, 6.01, 6.2, 6.39, 6.54, 6.75],
    150: [3.42, 4.34, 5.2, 5.86, 6.19, 6.46, 7.07],
    beat_angle: [43.8, 42.6, 42.6, 42, 41.8, 41.4, 41.8],
    beat_vmg: [2.76, 3.32, 3.72, 3.9, 3.99, 4.04, 4.04],
    run_angle: [148.4, 152.9, 151.1, 161, 176.6, 179, 179],
    run_vmg: [2.96, 3.77, 4.51, 5.22, 5.76, 6.1, 6.63],
};

const rowsByKey = (sheet) =>
    Object.fromEntries(sheet.blocks.flatMap((block) => block.rows).map((row) => [row.key, row]));

describe('polarSheet', () => {
    it('orders the blocks beat, grid, run', () => {
        expect(polarSheet(VPP).blocks.map((block) => block.key)).toEqual(['beat', 'grid', 'run']);
    });

    it('derives beat speed from the beat angle and VMG', () => {
        const { 'beat-speed': beat } = rowsByKey(polarSheet(VPP));

        expect(beat.values[0].text).toBe(vmg2sog(43.8, 2.76).toFixed(2));
    });

    it('derives run speed from the negated run VMG, the way the plot does', () => {
        const { 'run-speed': run } = rowsByKey(polarSheet(VPP));

        expect(run.values[0].text).toBe(vmg2sog(148.4, -2.96).toFixed(2));
    });

    it('converts the beat and run angles to apparent wind', () => {
        const rows = rowsByKey(polarSheet(VPP));

        expect(rows['beat-awa'].values[0].text).toBe(twa2awa(43.8, 6, vmg2sog(43.8, 2.76)).toFixed(1));
        expect(rows['run-awa'].values[0].text).toBe(twa2awa(148.4, 6, vmg2sog(148.4, -2.96)).toFixed(1));
    });

    it('formats every angle to the same precision, including whole-degree ones', () => {
        const { 'run-twa': run } = rowsByKey(polarSheet(VPP));

        // 161 arrives from the JSON as a bare integer; 148.4 as a float.
        expect(run.values.map((value) => value.text)).toEqual([
            '148.4',
            '152.9',
            '151.1',
            '161.0',
            '176.6',
            '179.0',
            '179.0',
        ]);
    });

    it('carries a plot point on grid cells only, so the table can drive the plot highlight', () => {
        const sheet = polarSheet(VPP);
        const grid = sheet.blocks.find((block) => block.key === 'grid');

        expect(grid.rows[0].values[0].point).toEqual({ tws: 6, sog: 4.26, cog: 52 });
        expect(rowsByKey(sheet)['beat-speed'].values[0].point).toBeUndefined();
    });

    it('drops the apparent-wind and VMG rows when they are turned off', () => {
        const keys = Object.keys(rowsByKey(polarSheet(VPP, { awa: false, vmg: false })));

        expect(keys).not.toContain('beat-awa');
        expect(keys).not.toContain('run-awa');
        expect(keys).not.toContain('beat-vmg');
        expect(keys).not.toContain('run-vmg');
        expect(keys).toContain('beat-speed');
    });

    it('leaves just the speed grid when the beat and run blocks are turned off', () => {
        expect(polarSheet(VPP, { beatRun: false }).blocks.map((block) => block.key)).toEqual(['grid']);
    });

    it('follows the certificate, whether it carries 7 wind speeds or 9', () => {
        const extended = { ...VPP, speeds: [4, 6, 8, 10, 12, 14, 16, 20, 24] };
        for (const twa of extended.angles) {
            extended[twa] = [2.1, ...VPP[twa], 7.9];
        }
        for (const key of ['beat_angle', 'beat_vmg', 'run_angle', 'run_vmg']) {
            extended[key] = [VPP[key][0], ...VPP[key], VPP[key][6]];
        }

        const sheet = polarSheet(extended);

        expect(sheet.columns).toBe(9);
        expect(sheet.blocks[1].rows[0].values).toHaveLength(9);
    });

    it('masks the corrupt non-positive speeds four certificates carry', () => {
        // FRA/FRA9786 has -81.08 in its 20 kt column at 52 degrees.
        const corrupt = { ...VPP, 52: [4.26, 5.06, 5.58, 5.76, 5.85, 5.89, -81.08] };

        const grid = polarSheet(corrupt).blocks.find((block) => block.key === 'grid');

        expect(grid.rows[0].values[6].text).toBe('—');
    });
});

describe('polarCard', () => {
    it('reads down the wind speeds, skipping the 4 kt drifting column', () => {
        const extended = {
            ...VPP,
            speeds: [4, 6, 8, 10, 12, 14, 16, 20, 24],
            beat_angle: [50, ...VPP.beat_angle, 42],
            beat_vmg: [1.1, ...VPP.beat_vmg, 4.1],
            run_angle: [140, ...VPP.run_angle, 170],
            run_vmg: [1.2, ...VPP.run_vmg, 6.8],
        };

        expect(polarCard(extended).rows.map((row) => row.tws)).toEqual([6, 8, 10, 12, 14, 16, 20]);
    });

    it('pairs upwind and downwind columns', () => {
        const { columns } = polarCard(VPP);

        expect(columns.map((column) => column.key)).toEqual([
            'up-twa',
            'up-awa',
            'up-bsp',
            'dn-twa',
            'dn-awa',
            'dn-bsp',
        ]);
        expect(columns.filter((column) => column.group === 'upwind')).toHaveLength(3);
    });

    it('says DDW rather than an angle the VPP does not think exists', () => {
        const card = polarCard(VPP);
        const twa = card.columns.findIndex((column) => column.key === 'dn-twa');

        // 176.6, 179 and 179 at 14, 16 and 20 kt.
        expect(card.rows.map((row) => row.values[twa])).toEqual(['148', '153', '151', '161', 'DDW', 'DDW', 'DDW']);
    });

    it('keeps whole degrees and one decimal of boat speed', () => {
        const card = polarCard(VPP);
        const bsp = card.columns.findIndex((column) => column.key === 'up-bsp');

        expect(card.rows[0].values[bsp]).toBe(vmg2sog(43.8, 2.76).toFixed(1));
    });

    it('adds VMG columns on request', () => {
        expect(polarCard(VPP, { vmg: true }).columns.map((column) => column.key)).toContain('up-vmg');
    });
});

describe('cardFontSizePt', () => {
    // The fixture keeps three wind angles instead of the eight every certificate carries.
    const sheetRows = sheetRowCount(polarSheet(VPP)) + 5;

    const forCard = (cardWmm, cardHmm, columns, layout = 'sheet', bodyRows = sheetRows) =>
        cardFontSizePt({ cardWmm, cardHmm, columns, bodyRows, layout });

    it('gives a smaller size to a certificate with more wind speeds', () => {
        const seven = forCard(215.9, 279.4, 7);
        const nine = forCard(215.9, 279.4, 9);

        expect(nine.fitPt).toBeLessThan(seven.fitPt);
    });

    it('caps a full page at a readable size rather than scaling type with the paper', () => {
        const letter = forCard(215.9, 279.4, 7);

        expect(letter.fitPt).toBeGreaterThan(letter.pt);
        expect(letter.pt).toBe(13);
    });

    it('refuses the full sheet on a quarter page', () => {
        const quarter = forCard(107.95, 139.7, 9);

        expect(quarter.allowed).toBe(false);
        expect(quarter.fitPt).toBeLessThan(MIN_BODY_PT);
    });

    it('allows the card on a quarter page, which is what it is for', () => {
        const quarter = forCard(107.95, 139.7, 6, 'card', 8);

        expect(quarter.allowed).toBe(true);
        expect(quarter.pt).toBeGreaterThanOrEqual(MIN_BODY_PT);
    });

    it('allows the full sheet on Letter and A5', () => {
        expect(forCard(215.9, 279.4, 9).allowed).toBe(true);
        expect(forCard(148, 210, 9).allowed).toBe(true);
    });
});
