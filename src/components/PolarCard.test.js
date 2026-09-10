import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import PolarCard from './PolarCard.svelte';
import { DATA_YEAR } from '../boat-meta.js';

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

const BOAT = {
    sailnumber: 'EST/EST688',
    name: 'MARY LOU',
    rating: { gph: 769.5, osn: 748.5 },
    boat: {
        type: 'RJ 85',
        sizes: { loa: 8.55, beam: 2.01, draft: 1.23, displacement: 2444, main: 17.57, genoa: 19.82, spinnaker: 39.55, spinnaker_asym: 0 },
    },
    vpp: VPP,
};

const withVpp = (vpp) => ({ ...BOAT, vpp: { ...VPP, ...vpp } });

afterEach(cleanup);

describe('PolarCard, full sheet', () => {
    it('gives a column to every wind speed the certificate carries', () => {
        const { container } = render(PolarCard, { boat: BOAT, layout: 'sheet' });

        // The wind-speed header row, less the row-label stub.
        expect(container.querySelectorAll('thead th')).toHaveLength(1 + 7);
    });

    it('follows a nine-speed certificate rather than assuming seven', () => {
        const nine = withVpp({
            speeds: [4, 6, 8, 10, 12, 14, 16, 20, 24],
            52: [2.1, 4.26, 5.06, 5.58, 5.76, 5.85, 5.89, 5.91, 6.2],
            90: [2.4, 4.68, 5.56, 6.01, 6.2, 6.39, 6.54, 6.75, 7.1],
            150: [1.9, 3.42, 4.34, 5.2, 5.86, 6.19, 6.46, 7.07, 7.9],
            beat_angle: [46, 43.8, 42.6, 42.6, 42, 41.8, 41.4, 41.8, 42],
            beat_vmg: [1.4, 2.76, 3.32, 3.72, 3.9, 3.99, 4.04, 4.04, 4.1],
            run_angle: [140, 148.4, 152.9, 151.1, 161, 176.6, 179, 179, 170],
            run_vmg: [1.5, 2.96, 3.77, 4.51, 5.22, 5.76, 6.1, 6.63, 7.2],
        });

        const { container } = render(PolarCard, { boat: nine, layout: 'sheet' });

        expect(container.querySelectorAll('thead th')).toHaveLength(1 + 9);
    });

    it('says which kite the VPP assumed, because the downwind targets depend on it', () => {
        render(PolarCard, { boat: BOAT, layout: 'sheet', details: true });

        expect(screen.getByText('symmetric spinnaker')).toBeDefined();
    });

    it('calls an asymmetric an asymmetric', () => {
        const asym = { ...BOAT, boat: { ...BOAT.boat, sizes: { ...BOAT.boat.sizes, spinnaker: 0, spinnaker_asym: 143.6 } } };
        render(PolarCard, { boat: asym, layout: 'sheet', details: true });

        expect(screen.getByText('asymmetric spinnaker')).toBeDefined();
    });

    it('prints nothing but the identity and the numbers by default', () => {
        render(PolarCard, { boat: BOAT, layout: 'sheet' });

        // Everything else — type, sails, dimensions, ratings, units, caveat, provenance —
        // is a line competing with the figures, so none of it prints unless it is asked for.
        expect(screen.queryByText(/GPH/)).toBeNull();
        expect(screen.queryByText(/LOA/)).toBeNull();
        expect(screen.queryByText(/spinnaker/)).toBeNull();
        expect(screen.queryByText(/VPP predictions/)).toBeNull();
        expect(screen.queryByText(/knots/)).toBeNull();
        expect(screen.getByText('MARY LOU')).toBeDefined();
    });

    it('adds them when they are asked for', () => {
        render(PolarCard, { boat: BOAT, layout: 'sheet', details: true });

        expect(screen.getByText(/GPH 769.5/)).toBeDefined();
        expect(screen.getByText(/LOA 8.55 m/)).toBeDefined();
    });

    it('prints every row in the complete table, whatever the row switches say', () => {
        // The complete table is the one you pick when you do not want to make choices, so
        // it ignores them: apparent wind and VMG are there even though both are switched off.
        render(PolarCard, { boat: BOAT, layout: 'page', options: { awa: false, vmg: false, beatRun: false } });

        for (const label of ['Beat TWA', 'Beat AWA', 'Beat kt', 'Beat VMG', 'Run VMG', 'Run TWA', 'Run AWA', 'Run kt']) {
            expect(screen.getByText(label)).toBeDefined();
        }
    });

    it('sets the complete table the same way as the sheet', () => {
        const { container } = render(PolarCard, { boat: BOAT, layout: 'page' });

        // Not the site's own table any more: the print markup, so it matches the other layouts.
        expect(container.querySelector('.polar-table')).toBeNull();
        expect(container.querySelector('.print-card table')).not.toBeNull();
    });

    it('masks a corrupt boat speed instead of printing it', () => {
        const corrupt = withVpp({ 52: [4.26, 5.06, 5.58, 5.76, 5.85, 5.89, -81.08] });
        const { container } = render(PolarCard, { boat: corrupt, layout: 'sheet' });

        expect([...container.querySelectorAll('td')].some((td) => td.textContent === '—')).toBe(true);
    });
});

describe('PolarCard, targets card', () => {
    it('reads down the wind speeds with upwind and downwind side by side', () => {
        render(PolarCard, { boat: BOAT, layout: 'card' });

        expect(screen.getByText('Upwind')).toBeDefined();
        expect(screen.getByText('Downwind')).toBeDefined();
    });

    it('says DDW where the VPP wants dead downwind', () => {
        render(PolarCard, { boat: BOAT, layout: 'card' });

        expect(screen.getAllByText('DDW').length).toBeGreaterThan(0);
    });
});

describe('PolarCard provenance', () => {
    it('prints the certificate date when the certificate has one', () => {
        const dated = { ...BOAT, boat: { ...BOAT.boat, issue_date: '2026-04-12T00:00:00' } };
        render(PolarCard, { boat: dated, layout: 'card', notes: true });

        expect(screen.getByText(/ORC certificate issued 2026-04-12/)).toBeDefined();
    });

    it('falls back to the data-set year, which is the common case', () => {
        // Roughly 60% of the certificates in this data set carry no issue date at all.
        render(PolarCard, { boat: BOAT, layout: 'card', notes: true });

        expect(screen.getByText(new RegExp(`ORC ${DATA_YEAR} data set`))).toBeDefined();
    });

    it('carries the caveat that these are predictions when the notes are on', () => {
        render(PolarCard, { boat: BOAT, layout: 'card', notes: true });

        expect(screen.getByText(/VPP predictions, not measurements/)).toBeDefined();
    });

    it('degrades for the boats that have no name', () => {
        render(PolarCard, { boat: { ...BOAT, name: '' }, layout: 'card' });

        expect(screen.getByText('Name unknown')).toBeDefined();
        expect(screen.getByText('EST 688')).toBeDefined();
    });
});
