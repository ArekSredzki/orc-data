<script>
import Help from './Help.svelte';
import PolarPlot from './PolarPlot.svelte';
import PolarTable from './PolarTable.svelte';
import { getBoat } from '../api.js';
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
    sails = getSails();
}

$: sailnumber && loadBoat(sailnumber);

function getSails() {
    const sizes = boat.boat.sizes;
    const sails = [
        ['Main', sizes.main + 'm²'],
        ['Genoa', sizes.genoa + 'm²'],
    ];
    if (sizes.spinnaker > 0) {
        sails.push(['Spinnaker', sizes.spinnaker + 'm²']);
    }
    if (sizes.spinnaker_asym > 0) {
        sails.push(['Asym. spinnaker', sizes.spinnaker_asym + 'm²']);
    }
    return sails;
}

const DIVISIONS = { C: 'Cruiser/Racer', S: 'Sportboat', R: 'Racer' };

// ORC omits the stability index unless the boat's stability was actually measured. It has
// been written as -1, as null and as an absent key by different generations of the parser,
// so test for a real value rather than relying on falsiness (-1 is truthy).
$: stabilityIndex = boat?.boat.stability_index > 0 ? boat.boat.stability_index : null;
$: division = boat?.boat.division;
// Certificates carry a full ISO timestamp; the date alone is what matters and reads the
// same in every locale.
$: issued = boat?.boat.issue_date ? boat.boat.issue_date.substring(0, 10) : undefined;

// One row per course model, each in both of the units ORC publishes: Time-on-Distance in
// seconds per mile and Time-on-Time as a multiplier, related by ToT = 600 / ToD. Rows are
// dropped rather than blanked, because boats whose certificate predates these fields are
// still in the database and a column of "?" would say nothing useful.
$: ratingRows = rating
    ? [
          { label: 'Offshore', help: 'osn', tod: rating.osn, tot: rating.tmf_offshore },
          { label: 'Inshore', help: 'ilc', tod: rating.ilc, tot: rating.tmf_inshore },
          { label: 'All-purpose', help: 'aph', tod: rating.aph_tod, tot: rating.aph_tot },
          { label: 'General purpose', help: 'gph', tod: rating.gph, tot: null },
      ].filter((row) => row.tod != null || row.tot != null)
    : [];

// Same rule as the ratings: show a certificate field only when this boat's certificate
// carries it, rather than filling the row with "?" for the majority of boats whose data
// predates these fields.
$: certificate = boat
    ? [
          { label: 'CDL', help: 'cdl', value: boat.boat.cdl != null ? `${boat.boat.cdl.toFixed(2)} m` : null },
          { label: 'Division', help: 'division', value: division ? DIVISIONS[division] || division : null },
          { label: 'Stability index', help: 'stability-index', value: stabilityIndex },
          { label: 'Issued', help: 'issue-date', value: issued },
      ].filter((item) => item.value != null)
    : [];

$: tripleRows = rating
    ? [
          { label: 'Inshore', values: rating.triple_inshore },
          { label: 'Offshore', values: rating.triple_offshore },
      ].filter((row) => row.values?.length === 3)
    : [];

let plot;
</script>

{#if boat}
    <div class="row p-2">
        <div class="col-sm">
            <PolarPlot bind:this={plot} boats={[boat]} />
        </div>
        <div class="col-sm">
            <h1>
                {#if boat.name}
                    {boat.name}
                {:else}
                    <span class="text-muted">Name unknown</span>
                {/if}
            </h1>

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
