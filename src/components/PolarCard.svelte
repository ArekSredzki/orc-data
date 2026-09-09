<script>
import PolarTable from './PolarTable.svelte';
import { DATA_YEAR, issueDate } from '../boat-meta.js';
import { polarCard, polarSheet } from '../polar-rows.js';

export let boat;
// 'sheet' is the full-fidelity nav-station page, 'card' the cockpit target card, and
// 'page' the site's own wind-velocity table exactly as the boat page draws it.
export let layout = 'sheet';
export let options = {};
// Body type in points, computed by the caller from the card's size and column count. Every
// other size in this component is an em, so the whole card scales with it.
export let fontPt = 11;
// 'mono' | 'tint' | 'screen' — see the header cell styling below.
export let colour = 'mono';
// Certificate detail (dimensions, ratings) in the header. Off by default: none of it is
// something you act on while sailing, and it competes with the numbers that are.
export let details = false;

$: sheet = layout === 'sheet' ? polarSheet(boat.vpp, options) : null;
$: card = layout === 'card' ? polarCard(boat.vpp, options) : null;
$: speeds = sheet ? sheet.speeds : card ? card.speeds : boat.vpp.speeds;
$: sizes = boat.boat.sizes;
$: issued = issueDate(boat);

// Wind speed is an ordered quantity, so the header ramp runs pale to dark with it. The
// categorical plot palette cannot do this job on paper: converted to ink it is
// non-monotonic (6 kt lands at 59% grey, 12 kt at 70%, 20 kt at 42%) and three of its
// hues fall within four percent of each other on a mono laser.
const RAMP = [4, 9, 15, 22, 30, 40, 48, 55];

function tint(index, count) {
    if (colour !== 'tint') {
        return '';
    }
    const step = RAMP[Math.min(RAMP.length - 1, Math.round((index / Math.max(1, count - 1)) * (RAMP.length - 1)))];
    return `background: hsl(0 0% ${100 - step}%);`;
}

// Grouped column headers for the card: "Upwind" over three columns, "Downwind" over three.
$: cardGroups = card
    ? ['upwind', 'downwind'].map((group) => ({
          group,
          label: group === 'upwind' ? 'Upwind' : 'Downwind',
          span: card.columns.filter((column) => column.group === group).length,
      }))
    : [];

// Which kite the VPP assumed changes what the downwind targets mean, so the card says so
// in words. The sail areas themselves are certificate trivia and are not printed: nobody
// trims to a number in a header.
$: downwindSail =
    sizes.spinnaker > 0 ? 'symmetric spinnaker' : sizes.spinnaker_asym > 0 ? 'asymmetric spinnaker' : 'white sails';
</script>

<div class="print-card" class:is-card={layout === 'card'} style="font-size: {fontPt}pt">
    <header>
        <div class="identity">
            <div class="name">{boat.name || 'Name unknown'}</div>
            <div class="sail">{boat.sailnumber}</div>
        </div>
        <div class="meta">
            {#if boat.boat.type}<span>{boat.boat.type}</span>{/if}
            <span>{downwindSail}</span>
            {#if details}
                <span>LOA {sizes.loa} m · {sizes.displacement} kg</span>
                {#if boat.rating?.gph != null}<span>GPH {boat.rating.gph.toFixed(1)}</span>{/if}
                {#if boat.rating?.osn != null}<span>Offshore {boat.rating.osn.toFixed(1)}</span>{/if}
            {/if}
        </div>
    </header>

    {#if layout === 'page'}
        <!-- Literally the boat page's table, the same component with the same classes, so
             what comes out of the printer is what was on the screen. -->
        <div class="page-table" class:mono={colour === 'mono'}>
            <PolarTable vpp={boat.vpp} />
        </div>
    {:else if sheet}
        <table>
            <colgroup>
                <col class="stub-col" />
                {#each speeds as speed}
                    <col />
                {/each}
            </colgroup>
            <thead>
                <tr>
                    <th class="stub">TWS kt</th>
                    {#each speeds as speed, i}
                        <th style={tint(i, speeds.length)} class={colour === 'screen' ? `tws-${speed}` : ''}>
                            {speed}
                        </th>
                    {/each}
                </tr>
            </thead>
            {#each sheet.blocks as block}
                <tbody class="block-{block.key}">
                    {#each block.rows as row}
                        <tr>
                            <th class="stub">{row.short}</th>
                            {#each row.values as value, i}
                                <td class={colour === 'screen' ? `tws-${speeds[i]}` : ''}>{value.text}</td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>
            {/each}
        </table>
    {:else}
        <table>
            <colgroup>
                <col class="stub-col" />
                {#each card.columns as column}
                    <col class={column.group} />
                {/each}
            </colgroup>
            <thead>
                <tr>
                    <th class="stub" rowspan="2">TWS</th>
                    {#each cardGroups as group}
                        <th colspan={group.span} class="group group-{group.group}">{group.label}</th>
                    {/each}
                </tr>
                <tr>
                    {#each card.columns as column, i}
                        <th class="column-head" class:group-start={i > 0 && column.group !== card.columns[i - 1].group}>
                            {column.label}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each card.rows as row, i}
                    <tr>
                        <th class="stub tws" style={tint(i, card.rows.length)}>{row.tws}</th>
                        {#each row.values as value, column}
                            <td
                                class={colour === 'screen' ? `tws-${row.tws}` : ''}
                                class:group-start={column > 0 &&
                                    card.columns[column].group !== card.columns[column - 1].group}>{value}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}

    <footer>
        <div class="legend">
            Wind and boat speed in knots · angles in degrees · TWA true wind angle, AWA apparent{#if layout === 'card'}
                · DDW = optimum is dead downwind{/if}
        </div>
        <div class="caveat">
            VPP predictions, not measurements — expect less in waves, short-handed, or with a dirty bottom.
        </div>
        <div class="source">
            {#if issued}
                ORC certificate issued {issued}
            {:else}
                ORC {DATA_YEAR} data set — certificate date not published
            {/if}
            · orc.org
        </div>
    </footer>
</div>

<style>
/* Helvetica and its metric clones, deliberately not system-ui: SF Pro and Segoe UI
   Variable default to proportional figures, and a grid of sixty numbers loses its
   alignment if the tabular feature is dropped anywhere in the print path. These faces
   carry fixed-width lining digits with no OpenType support at all. Weights are 400 and 700
   only, because neither face has the intermediate weights and browsers synthesise them. */
.print-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    font-family: 'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', 'Nimbus Sans', sans-serif;
    font-variant-numeric: tabular-nums lining;
    font-feature-settings:
        'tnum' 1,
        'lnum' 1;
    color: #000;
    background: #fff;
    /* Row tints and header ramps are redundant with the rules, but ask for them anyway. */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

header {
    margin-bottom: 0.6em;
}
.identity {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1em;
}
.name {
    font-size: 1.7em;
    font-weight: 700;
    line-height: 1.1;
    /* A long name must not push the table down the page; the sail number identifies the
       card in a stack anyway. */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.sail {
    font-size: 1.25em;
    font-weight: 700;
    white-space: nowrap;
}
.meta,
.sails {
    font-size: 0.72em;
    line-height: 1.35;
    color: #333;
}
.meta span + span::before,
.meta .type + span::before {
    content: ' · ';
}
.sails {
    color: #666;
}
.is-card .meta,
.is-card .sails {
    font-size: 0.62em;
}
.is-card .name {
    font-size: 1.35em;
}

table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    /* Spend the slack between the table and the footer on the rows rather than leaving a
       band of dead paper at the foot of the page: the rows share it out, which is more air
       per row and an easier read across a wide grid. Rows never shrink below their
       content, so a card that only just fits is unaffected. */
    flex: 1 1 auto;
    /* One column grid across every block: independent widths per block read as sloppy from
       a metre away, and one corrupt certificate value must not widen a column. */
}
th,
td {
    padding: 0.28em 0.3em;
    text-align: right;
    font-weight: 400;
    /* Absolute floor: an em-scaled hairline goes below the reproduction limit on a small
       card and drops out of the print entirely. */
    border-bottom: max(0.3pt, 0.02em) solid #bfbfbf;
}
thead th {
    font-weight: 700;
    border-bottom: 1pt solid #000;
    vertical-align: bottom;
}
.stub {
    font-weight: 700;
    border-right: 1pt solid #000;
    text-align: right;
    white-space: nowrap;
}
.stub-col {
    width: 6.4em;
}
.is-card .stub-col {
    width: 3.2em;
}
tbody:last-of-type tr:last-child th,
tbody:last-of-type tr:last-child td {
    border-bottom: 0;
}

/* The beat and run blocks are the top and bottom of the same polar, so they are separated
   by a single rule and a little air rather than boxed off as different data. */
.block-grid tr:first-child th,
.block-grid tr:first-child td,
.block-run tr:first-child th,
.block-run tr:first-child td {
    border-top: 0.75pt solid #000;
    padding-top: 0.45em;
}

/* Banding helps the eye hold a row across nine wind speeds, but it is redundant on
   purpose: every browser ships with background graphics switched off in the print dialog,
   so the rules above have to carry the structure on their own when this does not print.
   7% is the usable window — much lighter and a laser drops it, much darker and it starts
   to fight the numerals. */
.block-grid tr:nth-child(even) td,
.block-grid tr:nth-child(even) th,
.is-card tbody tr:nth-child(even) td {
    background: #f0f0f0;
}

/* The page layout borrows the site's own table, which is sized for a browser column: it
   has to take this card's type size and give up its screen width cap. Its colours come
   from the global .tws-N classes, so "match the plot" needs no help here. */
.page-table {
    display: flex;
    flex: 1 1 auto;
}
.page-table :global(.polar-table) {
    font-size: inherit;
    max-width: none;
    width: 100%;
    margin: 0;
}
.page-table :global(.polar-table td),
.page-table :global(.polar-table th) {
    padding: 0.2em 0.35em;
    border-color: #ccc;
}
.page-table.mono :global(.polar-table td),
.page-table.mono :global(.polar-table th) {
    color: #000;
}
.group {
    text-align: center;
    border-bottom: max(0.3pt, 0.02em) solid #bfbfbf;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.78em;
}
.column-head {
    font-size: 0.85em;
}
/* A gutter between the upwind and downwind halves, so a row cannot be read across the
   join by accident. */
.group-start {
    border-left: 0.75pt solid #000;
    padding-left: 0.6em;
}
.is-card tbody .tws {
    font-size: 1.15em;
}

footer {
    margin-top: auto;
    padding-top: 0.6em;
    font-size: 0.55em;
    line-height: 1.4;
    color: #666;
}
.caveat {
    color: #333;
}
</style>
