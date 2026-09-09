<script>
import Help from './Help.svelte';
import PolarPlot from './PolarPlot.svelte';
import PolarTable from './PolarTable.svelte';
import { getBoat } from '../api.js';
import {
    certificateRows,
    ratingRows as buildRatingRows,
    sails as buildSails,
    tripleRows as buildTripleRows,
} from '../boat-meta.js';
import { polarExport } from '../polar-csv.js';

export let sailnumber;

let boat;
let extended = false;

let sizes;
let rating;
let sails;

async function loadBoat(sailnumber) {
    boat = await getBoat(sailnumber);
    sizes = boat.boat.sizes;
    rating = boat.rating;
    sails = buildSails(sizes).map(({ label, value }) => [label, value + 'm\u00b2']);
}

$: sailnumber && loadBoat(sailnumber);

$: ratingRows = buildRatingRows(rating);
$: certificate = certificateRows(boat);
$: tripleRows = buildTripleRows(rating);

let plot;
</script>

{#if boat}
    <div class="row p-2">
        <div class="col-sm">
            <PolarPlot bind:this={plot} boats={[boat]} />
        </div>
        <div class="col-sm">
            <div class="title-row">
                <h1>
                    {#if boat.name}
                        {boat.name}
                    {:else}
                        <span class="text-muted">Name unknown</span>
                    {/if}
                </h1>
                <!-- The polar is at the bottom of a long page, so the action that puts it on
                     paper sits up here with the boat's name where it can be found. -->
                <a class="btn btn-outline-secondary btn-sm print-polar d-print-none" href="#print-{boat.sailnumber}">
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
                        <path
                            d="M4 1.5A1.5 1.5 0 0 1 5.5 0h5A1.5 1.5 0 0 1 12 1.5V4h1.5A1.5 1.5 0 0 1 15 5.5v5a1.5 1.5 0 0 1-1.5 1.5H12v2.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 14.5V12H2.5A1.5 1.5 0 0 1 1 10.5v-5A1.5 1.5 0 0 1 2.5 4H4V1.5Zm1 0V4h6V1.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5Zm6 9.5H5v3.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V11Zm1.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                    </svg>
                    Print polar
                </a>
            </div>

            <table class="table">
                <tr><th>Sail number</th><th>Type</th><th>Designer</th><th>Builder</th></tr>
                <tr>
                    <td>{boat.sailnumber}</td>
                    <td
                        >{#if boat.boat.type}<a href="#type-{boat.boat.type}">{boat.boat.type}</a>{:else}?{/if}</td>
                    <td>{boat.boat.designer}</td>
                    <td>{boat.boat.builder}</td>
                </tr>
                <tr>
                    <th>Length</th><th>Beam</th><th>Draft</th><th>Displacement<Help term="displacement" /></th>
                </tr>
                <tr>
                    <td>{sizes.loa} m</td>
                    <td>{sizes.beam} m</td>
                    <td>{sizes.draft} m</td>
                    <td>{sizes.displacement} kg</td>
                </tr>
                <tr>
                    {#each sails as [name, sail], i}
                        <th
                            >{name}{#if i === 0}<Help term="sail-areas" />{/if}</th>
                    {/each}
                </tr>
                <tr>
                    {#each sails as [name, sail]}
                        <td>{sail}</td>
                    {/each}
                </tr>

                {#if certificate.length > 0}
                    <tr>
                        {#each certificate as item}
                            <th>{item.label}<Help term={item.help} /></th>
                        {/each}
                    </tr>
                    <tr>
                        {#each certificate as item}
                            <td>{item.value}</td>
                        {/each}
                    </tr>
                {/if}
            </table>

            <table class="table ratings">
                <thead>
                    <tr>
                        <th>Rating</th>
                        <th class="num">Time-on-Distance<Help term="time-on-distance" /></th>
                        <th class="num">Time-on-Time<Help term="time-on-time" /></th>
                    </tr>
                </thead>
                <tbody>
                    {#each ratingRows as row}
                        <tr>
                            <th class="row-label">{row.label}<Help term={row.help} /></th>
                            <td class="num">{row.tod != null ? `${row.tod.toFixed(1)} s/NM` : '—'}</td>
                            <td class="num">{row.tot != null ? row.tot.toFixed(4) : '—'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            {#if tripleRows.length > 0}
                <table class="table ratings">
                    <thead>
                        <tr>
                            <th>Triple numbers<Help term="triple-numbers" /></th>
                            <th class="num">Low</th>
                            <th class="num">Medium</th>
                            <th class="num">High</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tripleRows as row}
                            <tr>
                                <th class="row-label">{row.label}</th>
                                {#each row.values as value}
                                    <td class="num">{value.toFixed(4)}</td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}

            <PolarTable vpp={boat.vpp} hover={plot?.hover} />
            <div class="d-print-none">
                <h5>
                    Polar (CSV)<Help term="polar-csv" />
                    <small>
                        <label>
                            <input type="checkbox" bind:checked={extended} />
                            <small>Extended CSV (including beat and run angles)</small>
                        </label>
                    </small>
                </h5>
                <textarea class:extended>{polarExport(boat, extended)} </textarea>
            </div>
        </div>
    </div>
{/if}

<style>
.title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}
.title-row h1 {
    margin: 0;
    min-width: 0;
}
.print-polar {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

/* Printing the boat page is not the printable-polar feature (that lives on #print-…), but
   it should at least not waste a page on browser chrome and an editable textarea. */
@media print {
    .row {
        display: block;
    }
    th {
        color: #000;
    }
}

th {
    color: #777;
    font-weight: 400;
}
td a {
    padding: 0;
}
/* Allow the columns to shrink below the plot SVG's intrinsic width, otherwise
   the SVG latches the column wide and the layout wraps and never recovers. */
.col-sm {
    min-width: 0;
}

/* The ratings live in their own table: dropping them into the identity/measurements table
   above would make one set of column widths resolve across both, and the four-column
   header/value rows there would fight with these three- and four-column ones. */
.ratings {
    max-width: 500px;
}
.ratings .num {
    text-align: right;
}
.ratings .row-label {
    color: #212529;
    white-space: nowrap;
}
</style>
