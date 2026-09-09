// The polar as rows and columns, shared by the on-screen table and the printable sheet
// and card. Kept free of DOM so both renderers agree on every derived number and one set
// of tests covers all of them.
//
// Two shapes, because the two artifacts are transposed with respect to each other:
//   `polarSheet()` — wind speed across the top, one row per wind angle (the nav-station
//                    sheet, and what `PolarTable.svelte` has always drawn).
//   `polarCard()`  — wind speed down the side, upwind and downwind side by side (the
//                    cockpit card, where you look up the breeze and read off two answers).
//
// Cell values carry the number as text and leave the unit to the row or column, so the
// screen table can print "43.8°" in the cell while the card prints the degree sign once
// in its header instead of 56 times.

import { twa2awa, vmg2sog } from './util.js';

// ORC publishes allowances from 6 to 20 kt (rule 402.2); newer certificates extend to
// 4–24. The 4 kt column is a drifting-condition curiosity rather than something anyone
// steers to, so the card drops it and the sheet keeps whatever the certificate carries.
export const CARD_SPEED_RANGE = [6, 20];

// A run angle this deep means the VPP's optimum is dead downwind rather than a gybing
// angle, which is what "179.0°" is really saying.
export const DDW_THRESHOLD = 175;

const EM_DASH = '—';

// Four certificates in the ORC data set carry garbage in their 20 kt column (-81.08 kt
// among them). Non-positive speeds are not real, and `vpp.js` already drops them from the
// plot for the same reason. There is deliberately no upper bound: legitimate speeds in
// this data set reach 42 kt, so any cap would eat real numbers from real boats.
function speed(sog, decimals) {
    return sog > 0 ? sog.toFixed(decimals) : EM_DASH;
}

// Raw angles mix formats — 43.8 sits next to a bare 161 and 180 — which prints visibly
// ragged in a right-aligned column of tabular numerals.
function angle(deg, decimals) {
    return deg.toFixed(decimals);
}

const beatSog = (vpp, i) => vmg2sog(vpp.beat_angle[i], vpp.beat_vmg[i]);
const runSog = (vpp, i) => vmg2sog(vpp.run_angle[i], -vpp.run_vmg[i]);

// Indices of the wind speeds a layout shows, so every row is built against the same set.
function speedIndices(vpp, range) {
    const indices = vpp.speeds.map((_, i) => i);
    if (!range) {
        return indices;
    }
    const [min, max] = range;
    return indices.filter((i) => vpp.speeds[i] >= min && vpp.speeds[i] <= max);
}

// One row of the sheet. `values` are per wind speed; `point` is present only where a cell
// corresponds to a plotted polar point, which is what the screen table hovers on.
//
// `short` is the printed label. "Beat angle (TWA)" is the widest thing on the sheet, and it
// is the row labels rather than the numbers that strangle a small card — abbreviating them
// buys most of a point of body type at quarter-page.
function row(key, label, unit, values, short = label) {
    return { key, label, short, unit, values };
}

/**
 * The full-fidelity polar: wind speed across the top, wind angle down the side.
 *
 * @param vpp a boat's `vpp` block
 * @param options.awa       include the apparent-wind rows for beat and run
 * @param options.vmg       include the beat and run VMG rows
 * @param options.beatRun   include the beat and run blocks at all (off leaves the grid)
 * @param options.decimals  decimal places for boat speeds
 * @param options.angleDecimals decimal places for angles
 * @param options.range     [min, max] wind speed filter, or null for the whole certificate
 */
export function polarSheet(vpp, options = {}) {
    const { awa = true, vmg = true, beatRun = true, decimals = 2, angleDecimals = 1, range = null } = options;
    const indices = speedIndices(vpp, range);
    const speeds = indices.map((i) => vpp.speeds[i]);
    const blocks = [];

    if (beatRun) {
        const rows = [
            row(
                'beat-twa',
                'Beat angle (TWA)',
                '°',
                indices.map((i) => cell(angle(vpp.beat_angle[i], angleDecimals))),
                'Beat TWA',
            ),
        ];
        if (awa) {
            rows.push(
                row(
                    'beat-awa',
                    'Beat angle (AWA)',
                    '°',
                    indices.map((i) =>
                        cell(angle(twa2awa(vpp.beat_angle[i], vpp.speeds[i], beatSog(vpp, i)), angleDecimals)),
                    ),
                    'Beat AWA',
                ),
            );
        }
        rows.push(
            row(
                'beat-speed',
                'Beat speed',
                'kt',
                indices.map((i) => cell(speed(beatSog(vpp, i), decimals))),
                'Beat kt',
            ),
        );
        if (vmg) {
            rows.push(
                row(
                    'beat-vmg',
                    'Beat VMG',
                    'kt',
                    indices.map((i) => cell(speed(vpp.beat_vmg[i], decimals))),
                ),
            );
        }
        blocks.push({ key: 'beat', label: 'Beat', rows });
    }

    blocks.push({
        key: 'grid',
        label: null,
        rows: vpp.angles.map((twa) =>
            row(
                `twa-${twa}`,
                String(twa),
                '°',
                indices.map((i) =>
                    cell(speed(vpp[twa][i], decimals), { tws: vpp.speeds[i], sog: vpp[twa][i], cog: twa }),
                ),
            ),
        ),
    });

    if (beatRun) {
        const rows = [];
        if (vmg) {
            rows.push(
                row(
                    'run-vmg',
                    'Run VMG',
                    'kt',
                    indices.map((i) => cell(speed(vpp.run_vmg[i], decimals))),
                ),
            );
        }
        rows.push(
            row(
                'run-twa',
                'Run angle (TWA)',
                '°',
                indices.map((i) => cell(angle(vpp.run_angle[i], angleDecimals))),
                'Run TWA',
            ),
        );
        if (awa) {
            rows.push(
                row(
                    'run-awa',
                    'Run angle (AWA)',
                    '°',
                    indices.map((i) =>
                        cell(angle(twa2awa(vpp.run_angle[i], vpp.speeds[i], runSog(vpp, i)), angleDecimals)),
                    ),
                    'Run AWA',
                ),
            );
        }
        rows.push(
            row(
                'run-speed',
                'Run speed',
                'kt',
                indices.map((i) => cell(speed(runSog(vpp, i), decimals))),
                'Run kt',
            ),
        );
        blocks.push({ key: 'run', label: 'Run', rows });
    }

    return { speeds, columns: speeds.length, blocks };
}

function cell(text, point) {
    return point ? { text, point } : { text };
}

/**
 * The cockpit card: wind speed down the side, upwind and downwind targets side by side.
 * Angles default to whole degrees here — nobody steers to a tenth — but the format stays
 * consistent within the card rather than mixing precisions.
 */
export function polarCard(vpp, options = {}) {
    const {
        awa = true,
        vmg = false,
        decimals = 1,
        angleDecimals = 0,
        range = CARD_SPEED_RANGE,
        ddwThreshold = DDW_THRESHOLD,
    } = options;
    const indices = speedIndices(vpp, range);

    const columns = [];
    const push = (group, key, label, unit) => columns.push({ group, key, label, unit });
    push('upwind', 'up-twa', 'TWA', '°');
    if (awa) push('upwind', 'up-awa', 'AWA', '°');
    push('upwind', 'up-bsp', 'Boat', 'kt');
    if (vmg) push('upwind', 'up-vmg', 'VMG', 'kt');
    push('downwind', 'dn-twa', 'TWA', '°');
    if (awa) push('downwind', 'dn-awa', 'AWA', '°');
    push('downwind', 'dn-bsp', 'Boat', 'kt');
    if (vmg) push('downwind', 'dn-vmg', 'VMG', 'kt');

    const rows = indices.map((i) => {
        const tws = vpp.speeds[i];
        const up = beatSog(vpp, i);
        const dn = runSog(vpp, i);
        const values = {
            'up-twa': angle(vpp.beat_angle[i], angleDecimals),
            'up-awa': angle(twa2awa(vpp.beat_angle[i], tws, up), angleDecimals),
            'up-bsp': speed(up, decimals),
            'up-vmg': speed(vpp.beat_vmg[i], decimals),
            // A card that says "179°" sends the trimmer hunting for an angle the VPP does
            // not think exists; "DDW" says soak.
            'dn-twa': vpp.run_angle[i] >= ddwThreshold ? 'DDW' : angle(vpp.run_angle[i], angleDecimals),
            'dn-awa': angle(twa2awa(vpp.run_angle[i], tws, dn), angleDecimals),
            'dn-bsp': speed(dn, decimals),
            'dn-vmg': speed(vpp.run_vmg[i], decimals),
        };
        return { tws, values: columns.map((column) => values[column.key]) };
    });

    return { columns, rows, speeds: indices.map((i) => vpp.speeds[i]) };
}

// ---------------------------------------------------------------------------
// Fitting a layout to a piece of paper.
//
// The type size is computed rather than measured: jsdom has no layout engine, print has no
// resize event, and a card that is re-typeset after the user hits Print is worse than one
// that was always the right size. Digit widths are fixed by the typeface stack (Helvetica,
// Arial and Liberation Sans all use 0.556em lining figures), so the width a table needs is
// known from its column count alone.

const MM_PER_PT = 0.352778;
const DIGIT_EM = 0.556;
const POINT_EM = 0.278;
const CELL_PADDING_EM = 0.7;

// Advance widths in the Helvetica/Arial/Liberation Sans stack the card is set in. Only the
// characters that can appear in a data cell are listed; "DDW" is the reason this exists at
// all, being half again as wide as the three digits it replaces.
const GLYPH_EM = { D: 0.722, W: 0.944, '.': POINT_EM, '—': 1.0 };
// The site's own table keeps a degree sign in every angle cell, which the print layouts
// move to the header. It is only worth counting where it is actually printed.
const DEGREE_EM = 0.4;
const glyphEm = (character) => GLYPH_EM[character] ?? DIGIT_EM;
const textEm = (text) => [...text].reduce((total, character) => total + glyphEm(character), 0);

/**
 * Width of the widest value in a model, in ems. The columns are laid out to a fixed, equal
 * width, so it is the widest cell anywhere that decides how large the type can be — and
 * getting this from the values rather than from an assumed digit count is what keeps "DDW"
 * from running into the column beside it.
 */
export function widestValueEm(model) {
    const values = model.blocks
        ? model.blocks.flatMap((block) => block.rows.flatMap((row) => row.values.map((value) => value.text)))
        : model.rows.flatMap((row) => row.values);
    return values.reduce((widest, text) => Math.max(widest, textEm(text)), 0);
}

// Data type below this is not readable on a laminated card at arm's length in daylight,
// so combinations that cannot reach it are refused rather than printed small.
export const MIN_BODY_PT = 8;

// Ceilings by card width. Type cannot simply scale with the paper: a Letter page is a bit
// over twice the width of a quarter-page card but wants only ~1.4x the type, and linear
// scaling from either end produces a poster or a fly-speck at the other.
// Thresholds are card widths after margins, not paper sizes: a Letter page's content box
// is 199.9mm, so a 200mm threshold would drop a full sheet into the small-paper class.
//
// The ceilings are deliberately high: the geometry should be what limits the type, not an
// arbitrary cap, and a printed polar is read at arm's length. They exist only to stop a
// sparse table from being blown up into a poster.
const CEILING = {
    sheet: [
        [180, 19],
        [120, 15],
        [0, 12],
    ],
    card: [
        [180, 26],
        [120, 21],
        [0, 17],
    ],
    page: [
        [180, 19],
        [120, 15],
        [0, 12],
    ],
};

// Everything above and below the body rows — the identity header, the column headers and
// the footer — in ems of body type, so it scales with the card the way the rest does.
// These are measured from the rendered card rather than guessed; if PolarCard's header or
// padding changes materially, re-measure them.
const OVERHEAD_EM = { sheet: 8.0, card: 10.5, page: 8.0 };
// Height of one body row, likewise measured: cell padding plus the line box, with the
// card's larger wind-speed stub setting the pitch there.
const ROW_PITCH_EM = { sheet: 2.15, card: 2.45, page: 2.3 };
// Row-label column: "Beat angle (TWA)" is the widest label on the sheet, but it is set
// smaller than the data and abbreviated in print.
// The page layout keeps the site's full row labels ("Beat angle (TWA)"), which is most of
// why it cannot be set as large as the sheet.
const STUB_EM = { sheet: 7.2, card: 2.6, page: 8.6 };

const emForChars = (digits, points) => digits * DIGIT_EM + points * POINT_EM;

function ceilingPt(layout, cardWmm) {
    return CEILING[layout].find(([width]) => cardWmm >= width)[1];
}

/**
 * Body type size for a layout on a given card, and whether that card can carry it at all.
 *
 * @param bodyRows rows of data — wind angles on the sheet, wind speeds on the card. The
 *        header rows are part of the layout's fixed overhead, not counted here.
 * @returns { pt, fitPt, allowed } — `fitPt` is the size the geometry allows before the
 *          per-size ceiling is applied; `allowed` is false when it is below MIN_BODY_PT.
 */
export function cardFontSizePt({
    cardWmm,
    cardHmm,
    columns,
    bodyRows,
    layout = 'sheet',
    marginMm = 5,
    valueEm = null,
}) {
    // Widest data cell, measured from the values when the caller has a model to hand and
    // otherwise assumed: "10.56" on the sheet, "148" on the card.
    const dataEm =
        (valueEm ?? (layout === 'card' ? emForChars(3, 0) : emForChars(4, 1))) + (layout === 'page' ? DEGREE_EM : 0);
    const columnEm = dataEm + CELL_PADDING_EM;
    const widthEm = STUB_EM[layout] + columns * columnEm;
    const heightEm = bodyRows * ROW_PITCH_EM[layout] + OVERHEAD_EM[layout];

    const usableWmm = cardWmm - 2 * marginMm;
    const usableHmm = cardHmm - 2 * marginMm;

    const fitPt = Math.min(usableWmm / widthEm, usableHmm / heightEm) / MM_PER_PT;

    return {
        fitPt,
        pt: Math.min(fitPt, ceilingPt(layout, cardWmm)),
        allowed: fitPt >= MIN_BODY_PT,
    };
}

// Data rows a sheet holds, for the fit calculation. The column header is part of the
// layout's fixed overhead and is not counted here.
export function sheetRowCount(sheet) {
    return sheet.blocks.reduce((total, block) => total + block.rows.length, 0);
}
