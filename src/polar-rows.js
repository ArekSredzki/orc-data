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
function row(key, label, unit, values) {
    return { key, label, unit, values };
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
                ),
            );
        }
        rows.push(
            row(
                'beat-speed',
                'Beat speed',
                'kt',
                indices.map((i) => cell(speed(beatSog(vpp, i), decimals))),
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
                ),
            );
        }
        rows.push(
            row(
                'run-speed',
                'Run speed',
                'kt',
                indices.map((i) => cell(speed(runSog(vpp, i), decimals))),
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

// Data type below this is not readable on a laminated card at arm's length in daylight,
// so combinations that cannot reach it are refused rather than printed small.
export const MIN_BODY_PT = 8;

// Ceilings by card width. Type cannot simply scale with the paper: a Letter page is a bit
// over twice the width of a quarter-page card but wants only ~1.4x the type, and linear
// scaling from either end produces a poster or a fly-speck at the other.
const CEILING = {
    sheet: [
        [200, 13],
        [140, 11],
        [0, 9.5],
    ],
    card: [
        [200, 18],
        [140, 16],
        [0, 15],
    ],
};

// Vertical space the identity header and the footer take, independent of the table.
const RESERVE_MM = { sheet: 34, card: 24 };
const ROW_PITCH_EM = 1.75;
// Row-label column: "Beat angle (TWA)" is the widest label on the sheet, but it is set
// smaller than the data and abbreviated in print.
const STUB_EM = { sheet: 7.2, card: 2.6 };

const emForChars = (digits, points) => digits * DIGIT_EM + points * POINT_EM;

function ceilingPt(layout, cardWmm) {
    return CEILING[layout].find(([width]) => cardWmm >= width)[1];
}

/**
 * Body type size for a layout on a given card, and whether that card can carry it at all.
 *
 * @returns { pt, fitPt, allowed } — `fitPt` is the size the geometry allows before the
 *          per-size ceiling is applied; `allowed` is false when it is below MIN_BODY_PT.
 */
export function cardFontSizePt({ cardWmm, cardHmm, columns, rows, layout = 'sheet', marginMm = 6 }) {
    // Widest data cell: "10.56" on the sheet, "148" or "6.1" on the card.
    const dataEm = layout === 'sheet' ? emForChars(4, 1) : emForChars(3, 0);
    const columnEm = dataEm + CELL_PADDING_EM;
    const widthEm = STUB_EM[layout] + columns * columnEm;
    const heightEm = rows * ROW_PITCH_EM;

    const usableWmm = cardWmm - 2 * marginMm;
    const usableHmm = cardHmm - 2 * marginMm - RESERVE_MM[layout];

    const fitPt = Math.min(usableWmm / widthEm, usableHmm / heightEm) / MM_PER_PT;

    return {
        fitPt,
        pt: Math.min(fitPt, ceilingPt(layout, cardWmm)),
        allowed: fitPt >= MIN_BODY_PT,
    };
}

// Rows a sheet occupies, for the fit calculation: the wind-speed header, the blocks, and
// the rules between them.
export function sheetRowCount(sheet) {
    return 1 + sheet.blocks.reduce((total, block) => total + block.rows.length, 0);
}
