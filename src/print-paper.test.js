import { describe, expect, it } from 'vitest';

import { cardGeometry, defaultPaper, PAGE_MARGIN_MM, pageRule, pageSize } from './print-paper.js';

describe('pageSize', () => {
    it('swaps the axes in landscape', () => {
        expect(pageSize('letter', 'landscape')).toEqual({ w: 279.4, h: 215.9 });
    });
});

describe('cardGeometry', () => {
    it('fills the page box with a single card', () => {
        const { cols, rows, w, h } = cardGeometry('letter', 'portrait', 1);

        expect([cols, rows]).toEqual([1, 1]);
        expect(w).toBeCloseTo(215.9 - 2 * PAGE_MARGIN_MM, 5);
        expect(h).toBeCloseTo(279.4 - 2 * PAGE_MARGIN_MM, 5);
    });

    it('stacks two landscape cards on a portrait page', () => {
        const { cols, rows, w, h } = cardGeometry('letter', 'portrait', 2);

        expect([cols, rows]).toEqual([1, 2]);
        expect(w).toBeGreaterThan(h);
    });

    it('puts two portrait cards side by side on a landscape page', () => {
        const { cols, rows } = cardGeometry('letter', 'landscape', 2);

        expect([cols, rows]).toEqual([2, 1]);
    });

    it('quarters the page in a 2x2 grid', () => {
        const { cols, rows, w, h } = cardGeometry('letter', 'portrait', 4);

        expect([cols, rows]).toEqual([2, 2]);
        expect(w).toBeCloseTo((215.9 - 2 * PAGE_MARGIN_MM) / 2, 5);
        expect(h).toBeCloseTo((279.4 - 2 * PAGE_MARGIN_MM) / 2, 5);
    });

    it('quarters A4 into cards a shade under A6, allowing for the page margin', () => {
        const { w, h } = cardGeometry('a4', 'portrait', 4);

        expect(w).toBeCloseTo(97, 0); // A6 is 105 x 148 before margins
        expect(h).toBeCloseTo(140.5, 0);
    });
});

describe('pageRule', () => {
    it('names the paper and orientation literally, because custom properties do not resolve in @page', () => {
        expect(pageRule('a4', 'landscape')).toBe('@page { size: A4 landscape; margin: 8mm; }');
    });
});

describe('defaultPaper', () => {
    it('guesses Letter for US and Canadian locales and A4 for the rest', () => {
        expect(defaultPaper('en-US')).toBe('letter');
        expect(defaultPaper('en-CA')).toBe('letter');
        expect(defaultPaper('nl-NL')).toBe('a4');
        expect(defaultPaper(undefined)).toBe('a4');
    });
});
