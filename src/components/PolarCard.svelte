<script>
import { DATA_YEAR, formatSailnumber, issueDate } from '../boat-meta.js';
import { COMPLETE_SHEET, polarCard, polarSheet, PRINT_SHEET } from '../polar-rows.js';

export let boat;
// 'card' is the cockpit target card. 'sheet' and 'page' are both the full table, set the
// same way; the difference is that 'sheet' honours the row switches and 'page' ignores
// them and prints the lot.
export let layout = 'sheet';
export let options = {};
// Body type in points, computed by the caller from the card's size and column count. Every
// other size in this component is an em, so the whole card scales with it.
export let fontPt = 11;
// 'mono' | 'tint' | 'screen' — see the header cell styling below.
export let colour = 'mono';
// Everything that is not the boat's identity or the numbers themselves is off by default.
// A printed polar is read at a glance on the water, and every line of prose above or below
// the table is a line competing with the figures.
//
// `details` adds the type, the sails the VPP assumed, the dimensions and the ratings;
// `notes` adds the units legend, the prediction caveat and the certificate provenance.
export let details = false;
export let notes = false;
// The boat's name and sail number. On by default — a printout nobody can identify is of
// limited use — but a tightly packed table may want the two lines back.
export let identity = true;

// The true wind angle and the boat speed are what you act on — steer to the angle, check
// the speed — so they carry the weight here as they do on the card. The apparent-wind and
// VMG rows are reference, and stay light.
const emphasised = (key) => key.endsWith('-twa') || key.endsWith('-speed') || key.startsWith('twa-');

// The blocks flattened into one run of rows, each knowing whether it opens a block, so the
// banding and the block rules can both be driven off a single index.
$: sheetRows = sheet
    ? sheet.blocks.flatMap((block) =>
          block.rows.map((row, index) => ({
              row,
              startsBlock: index === 0,
              emphasis: emphasised(row.key),
          })),
      )
    : [];

$: sheet =
    layout === 'card'
        ? null
        : polarSheet(boat.vpp, layout === 'page' ? COMPLETE_SHEET : { ...options, ...PRINT_SHEET });
$: card = layout === 'card' ? polarCard(boat.vpp, options) : null;
$: speeds = sheet ? sheet.speeds : card.speeds;
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
    {#if identity || details}
        <header>
            {#if identity}
                <div class="identity">
                    <div class="name">{boat.name || 'Name unknown'}</div>
                    <div class="sail">{formatSailnumber(boat.sailnumber)}</div>
                </div>
            {/if}
            {#if details}
                <div class="meta">
                    {#if boat.boat.type}<span>{boat.boat.type}</span>{/if}
                    <span>{downwindSail}</span>
                    <span>LOA {sizes.loa} m · {sizes.displacement} kg</span>
                    {#if boat.rating?.gph != null}<span>GPH {boat.rating.gph.toFixed(1)}</span>{/if}
                    {#if boat.rating?.osn != null}<span>Offshore {boat.rating.osn.toFixed(1)}</span>{/if}
                </div>
            {/if}
        </header>
    {/if}

    {#if sheet}
        <table>
            <colgroup>
                <col class="stub-col" />
                {#each speeds as speed}
                    <col />
                {/each}
            </colgroup>
            <thead>
                <tr>
                    <th class="stub">Wind Speed</th>
                    {#each speeds as speed, i}
                        <th style={tint(i, speeds.length)} class={colour === 'screen' ? `tws-${speed}` : ''}>
                            {speed}
                        </th>
                    {/each}
                </tr>
            </thead>
            <!-- One tbody, so the banding alternates down the whole table rather than
                 restarting at each block, and the block rules are drawn on the rows that
                 begin one. -->
            <tbody>
                {#each sheetRows as entry, i}
                    <tr class:banded={i % 2 === 1} class:block-start={entry.startsBlock && i > 0}>
                        <th class="stub">{entry.row.short}</th>
                        {#each entry.row.values as value, column}
                            <td
                                class={colour === 'screen' ? `tws-${speeds[column]}` : ''}
                                class:emphasis={entry.emphasis}>{value.text}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {:else}
        <table>
            <colgroup>
                <col class="stub-col" />
                {#each card.columns as column, i}
                    {#if i > 0 && column.group !== card.columns[i - 1].group}
                        <!-- The gutter gets a column of its own. Hung off the data cells as
                             padding it came out of their width, and a fixed table layout
                             gives every column the same width, so the two columns either
                             side of it ended up a hair too narrow for their numbers. -->
                        <col class="gutter-col" />
                    {/if}
                    <col class={column.group} />
                {/each}
            </colgroup>
            <thead>
                <tr>
                    <th class="stub" rowspan="2">TWS</th>
                    {#each cardGroups as group, i}
                        <!-- The gutter is a column of the table, so this row has to account for
                             it too. Without it the row spanned one column fewer than the table
                             has: the group labels sat a column to the left of the figures they
                             head, and the rule under "Downwind" stopped short of the last one. -->
                        {#if i > 0}
                            <th class="gutter"></th>
                        {/if}
                        <th colspan={group.span} class="group group-{group.group}">{group.label}</th>
                    {/each}
                </tr>
                <tr>
                    {#each card.columns as column, i}
                        {#if i > 0 && column.group !== card.columns[i - 1].group}
                            <th class="gutter"></th>
                        {/if}
                        <th
                            class="column-head"
                            class:speed={column.key.endsWith('-bsp')}
                            class:angle={column.key.endsWith('-twa')}
                            class:group-end={i < card.columns.length - 1 && column.group !== card.columns[i + 1].group}>
                            {column.label}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each card.rows as row, i}
                    <tr>
                        <!-- The wind speed is the key you look the row up by, so it carries the
                             row's colour as well: you find the breeze, then read across in it. -->
                        <th
                            class="stub tws {colour === 'screen' ? `tws-${row.tws}` : ''}"
                            style={tint(i, card.rows.length)}>{row.tws}</th>
                        {#each row.values as value, column}
                            {#if column > 0 && card.columns[column].group !== card.columns[column - 1].group}
                                <td class="gutter"></td>
                            {/if}
                            <td
                                class={colour === 'screen' ? `tws-${row.tws}` : ''}
                                class:speed={card.columns[column].key.endsWith('-bsp')}
                                class:angle={card.columns[column].key.endsWith('-twa')}
                                class:group-end={column < card.columns.length - 1 &&
                                    card.columns[column].group !== card.columns[column + 1].group}>{value}</td>
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}

    {#if notes}
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
    {/if}
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
    /* The identity is for telling one printout from another, not for reading at the helm,
       so it takes as little of the page as it can get away with. */
    margin-bottom: 0.4em;
}
.identity {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1em;
}
.name {
    font-size: 1.15em;
    font-weight: 700;
    line-height: 1.1;
    /* A long name must not push the table down the page; the sail number identifies the
       card in a stack anyway. */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.sail {
    font-size: 1em;
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
    font-size: 1.1em;
}
.is-card .sail {
    font-size: 1em;
}

table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    /* Every cell is a single figure, so the default line box is carrying leading the
       numbers can have instead. Sixteen rows of it is most of a page. */
    line-height: 1.05;
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
    /* Horizontal padding is width that the figures could be using instead: the columns are
       separated by their own rules, so the cells do not need much air of their own. */
    padding: 0.16em 0.18em;
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
    /* Just wider than "Wind Speed", the longest label it carries — and the one set bold,
       which is what makes it the widest. */
    width: 6.1em;
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
.block-start th,
.block-start td {
    border-top: 0.75pt solid #000;
    padding-top: 0.45em;
}

/* Banding helps the eye hold a row across nine wind speeds, but it is redundant on
   purpose: every browser ships with background graphics switched off in the print dialog,
   so the rules above have to carry the structure on their own when this does not print.
   7% is the usable window — much lighter and a laser drops it, much darker and it starts
   to fight the numerals. */
.banded td,
.banded th,
.is-card tbody tr:nth-child(even) td {
    background: #f0f0f0;
}

/* Steer to the angle, check the speed. Apparent wind and VMG are reference figures and
   stay light, the same division the card makes between its columns. */
.emphasis {
    font-weight: 700;
}

/* The block headings over the card's two halves. */
.group {
    text-align: center;
    border-bottom: max(0.3pt, 0.02em) solid #bfbfbf;
    text-transform: uppercase;
    /* Set small enough that "Downwind" fits the columns it spans even when those columns
       are only as wide as a three-digit angle. */
    letter-spacing: 0.06em;
    font-size: 0.72em;
}
.column-head {
    font-size: 0.85em;
}

/* The rule between the upwind and downwind halves, so a row cannot be read across the join
   by accident. It sits on the spacer column with matching air either side: the preceding
   cell's own padding on the left, the spacer's width on the right. */
.gutter-col {
    width: 0.5em;
}
.gutter {
    padding: 0;
    border-left: 0.75pt solid #000;
}
.group-end {
    padding-right: 0.5em;
}

/* Light rules inside each block: the angle you steer, the angle the masthead shows and the
   speed you should be making are three different quantities, and at a glance in a seaway
   the eye needs a seam between them. Kept far lighter than the rule that divides upwind
   from downwind, which is the division that must never be misread. */
.is-card tbody td + td,
.is-card thead .column-head + .column-head {
    border-left: max(0.3pt, 0.02em) solid #dcdcdc;
}
/* The spacer is a cell like any other, so the rule above would draw a light line on it and
   another on the cell after it — two thin lines where the one heavy one belongs. The block
   rule wins on the spacer, and the cell following it carries none. */
.is-card .gutter {
    border-left: 0.75pt solid #000;
}
.is-card .gutter + td,
.is-card .gutter + .column-head {
    border-left: 0;
}

/* The true wind angle and the boat speed are the pair you act on — steer to the angle,
   check the speed. Both carry the weight; the apparent-wind column is there for the boats
   whose instruments only read apparent, and stays light. */
.speed,
.angle {
    font-weight: 700;
}
.is-card tbody .tws {
    font-size: 1.1em;
}
.is-card th,
.is-card td {
    padding-top: 0.14em;
    padding-bottom: 0.14em;
}
/* Every cell is a single number, so the default line box is carrying leading that the
   figures can have instead. */
.is-card table {
    line-height: 1.05;
}

footer {
    margin-top: auto;
    padding-top: 0.6em;
    font-size: 0.55em;
    line-height: 1.4;
    color: #666;
}
.legend {
    font-size: 0.85em;
}
.caveat {
    color: #333;
}
</style>
