// Paper the print view can target, and how a sheet of it is divided into cards.
//
// Only sizes a home or office printer actually feeds are offered. Smaller cards come from
// tiling copies onto Letter or A4 and cutting them up, which is both easier to feed and
// better typography than shrinking a full page: a quarter-page card is laid out for its
// own size rather than photographically reduced.

export const PAPERS = {
    letter: { label: 'US Letter', w: 215.9, h: 279.4, css: 'Letter' },
    a4: { label: 'A4', w: 210, h: 297, css: 'A4' },
    a5: { label: 'A5', w: 148, h: 210, css: 'A5' },
};

// Cards per sheet. Each step halves the page along its longer axis, so the cards stay as
// close to the page's proportions as halving allows. 8-up was measured at under 7pt of
// body type and left out: it is not readable on the water.
export const PER_SHEET = [1, 2, 4];

// The page box keeps this much clear of the paper edge. Consumer printers cannot print to
// the edge (typically 6.4mm, and some inkjets take more at the foot), so anything smaller
// risks being clipped by the driver rather than by us.
export const PAGE_MARGIN_MM = 8;

// Each card holds this much clear of its own trimmed edge, which is what absorbs a wobbly
// cut on a tiled sheet.
export const CARD_MARGIN_MM = 5;

// Shaved off the sheet's height. Sized to exactly the page box, the sheet spills a blank
// second page on any sub-pixel rounding in the print path; a millimetre of slack costs
// nothing visible and keeps every layout to the single page it was laid out for.
export const SHEET_TOLERANCE_MM = 1;

// Locales that use Letter. Everyone else gets A4; guessing wrong only costs one dropdown
// change, whereas making everyone choose costs a decision every time.
const LETTER_LOCALES = ['en-us', 'en-ca', 'fr-ca', 'es-mx', 'en-ph', 'es-cl', 'es-co', 'es-cr', 'es-ve'];

export function defaultPaper(locale) {
    return LETTER_LOCALES.includes(String(locale || '').toLowerCase()) ? 'letter' : 'a4';
}

export function pageSize(paper, orientation = 'portrait') {
    const { w, h } = PAPERS[paper];
    return orientation === 'landscape' ? { w: h, h: w } : { w, h };
}

/**
 * How one sheet is divided, and how big each card ends up.
 *
 * Halving runs along whichever axis is currently longer, so 2-up on a portrait page gives
 * two landscape cards stacked, and 2-up on a landscape page gives two portrait cards side
 * by side.
 */
export function cardGeometry(paper, orientation = 'portrait', perSheet = 1) {
    const page = pageSize(paper, orientation);
    let w = page.w - 2 * PAGE_MARGIN_MM;
    let h = page.h - 2 * PAGE_MARGIN_MM;
    let cols = 1;
    let rows = 1;

    for (let n = perSheet; n > 1; n /= 2) {
        if (h >= w) {
            h /= 2;
            rows *= 2;
        } else {
            w /= 2;
            cols *= 2;
        }
    }

    return { cols, rows, w, h, page };
}

// `@page` has to be written as literal text: custom properties do not resolve in the page
// context, so the rule is rebuilt whenever the paper changes rather than parameterised.
// Both values are interpolated into a stylesheet, so both must have come through
// `printOptions()` — never straight off the URL.
export function pageRule(paper, orientation = 'portrait') {
    return `@page { size: ${PAPERS[paper].css} ${orientation}; margin: ${PAGE_MARGIN_MM}mm; }`;
}

export const ORIENTATIONS = ['portrait', 'landscape'];
export const LAYOUTS = ['card', 'sheet'];
export const INKS = ['mono', 'tint', 'screen'];

const CHOICES = {
    layout: LAYOUTS,
    paper: Object.keys(PAPERS),
    orientation: ORIENTATIONS,
    colour: INKS,
};
const FLAGS = ['awa', 'vmg', 'beatRun', 'fullRange'];

/**
 * Fold untrusted option values into a set of defaults, keeping only values the UI itself
 * offers. The print view takes its options from the URL — that is the point of the route,
 * since the links get shared — and those values reach a `<style>` element and property
 * lookups, so anything unrecognised is dropped rather than passed along.
 */
export function printOptions(defaults, ...sources) {
    const options = { ...defaults };
    for (const source of sources) {
        for (const [key, value] of Object.entries(source || {})) {
            if (CHOICES[key]) {
                if (CHOICES[key].includes(value)) {
                    options[key] = value;
                }
            } else if (FLAGS.includes(key)) {
                options[key] = Boolean(value);
            } else if (key === 'perSheet') {
                const count = Number(value);
                if (PER_SHEET.includes(count)) {
                    options[key] = count;
                }
            }
        }
    }
    return options;
}
