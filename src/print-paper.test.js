import { describe, expect, it } from 'vitest';

import { cardGeometry, defaultPaper, PAGE_MARGIN_MM, pageRule, pageSize, printOptions } from './print-paper.js';

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

    it('gives the cards the margin back when it is narrowed', () => {
        const wide = cardGeometry('letter', 'portrait', 1, 16);
        const narrow = cardGeometry('letter', 'portrait', 1, 4);

        expect(narrow.w - wide.w).toBeCloseTo(24, 5);
        expect(narrow.h - wide.h).toBeCloseTo(24, 5);
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

    it('carries the chosen margin', () => {
        expect(pageRule('letter', 'portrait', 4)).toBe('@page { size: Letter portrait; margin: 4mm; }');
    });
});

describe('printOptions', () => {
    const DEFAULTS = {
        layout: 'card',
        paper: 'a4',
        orientation: 'portrait',
        perSheet: 2,
        margin: 8,
        awa: true,
        vmg: false,
        beatRun: true,
        fullRange: false,
        colour: 'mono',
    };

    it('takes the values the toolbar offers', () => {
        const options = printOptions(DEFAULTS, { layout: 'sheet', paper: 'letter', perSheet: 4, colour: 'tint' });

        expect(options).toMatchObject({ layout: 'sheet', paper: 'letter', perSheet: 4, colour: 'tint' });
    });

    it('applies sources in order, so the URL wins over stored preferences', () => {
        const options = printOptions(DEFAULTS, { paper: 'letter' }, { paper: 'a5' });

        expect(options.paper).toBe('a5');
    });

    it('drops anything it does not recognise rather than passing it along', () => {
        // These values reach a <style> element and a property lookup; the route takes them
        // from the URL, and those links get shared around.
        const options = printOptions(DEFAULTS, {
            orientation: 'portrait; } </style><script>alert(1)</script>',
            paper: '__proto__',
            perSheet: 999,
            margin: 3,
            colour: 'rainbow',
            unexpected: 'ignored',
        });

        expect(options.orientation).toBe('portrait');
        expect(options.paper).toBe('a4');
        expect(options.perSheet).toBe(2);
        expect(options.margin).toBe(8);
        expect(options.colour).toBe('mono');
        expect(options.unexpected).toBeUndefined();
    });

    it('keeps a hostile value out of the @page rule it feeds', () => {
        const options = printOptions(DEFAULTS, { orientation: '</style><script>alert(1)</script>' });

        expect(pageRule(options.paper, options.orientation)).toBe('@page { size: A4 portrait; margin: 8mm; }');
    });

    it('survives a null or corrupt source', () => {
        expect(printOptions(DEFAULTS, null, undefined)).toEqual(DEFAULTS);
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
