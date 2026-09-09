<script>
import { onMount } from 'svelte';

import BoatSelect from './BoatSelect.svelte';
import Help from './Help.svelte';
import LineLegend from './LineLegend.svelte';
import PolarPlot from './PolarPlot.svelte';
import Sailnumber from './Sailnumber.svelte';
import { getBoat } from '../api.js';
import { pageTitle } from '../boat-meta.js';
import { round } from '../util.js';

let sailnumberA = undefined;
let sailnumberB = undefined;
let boatA = undefined;
let boatB = undefined;

let sailnumbers = [];
const PREFIX = 'compare-';
const SEPARATOR = '|';

onMount(() => {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith(PREFIX)) {
        [sailnumberA, sailnumberB] = hash.substring(PREFIX.length).split(SEPARATOR);
    }
});

function updateUrl(sailnumbers) {
    if (sailnumbers.some((x) => x)) {
        window.location.hash = `${PREFIX}${sailnumbers.join(SEPARATOR)}`;
    }
    return sailnumbers;
}
async function loadBoatA(sailnumber) {
    if (sailnumber === undefined) {
        target = undefined;
        return;
    }
    boatA = await getBoat(sailnumber);
}
async function loadBoatB(sailnumber) {
    if (sailnumber === undefined) {
        target = undefined;
        return;
    }
    boatB = await getBoat(sailnumber);
}

$: sailnumbers = updateUrl([sailnumberA, sailnumberB]);
$: sailnumberA && loadBoatA(sailnumberA);
$: sailnumberB && loadBoatB(sailnumberB);

function topSpeed(boat) {
    if (!boat) {
        return;
    }
    const vpp = boat.vpp;
    return Math.max(...vpp.angles.map((angle) => Math.max(...vpp[angle])));
}

// `label` may carry a `help` key naming a glossary entry, and `area: true` renders the m²
// suffix. Values are read through accessors so a missing boat is simply undefined.
const rows = [
    { label: 'Name', value: (boat) => boat?.name },
    { label: 'Type', value: (boat) => boat?.boat.type },
    { label: 'Year', value: (boat) => boat?.boat.year },
    { label: 'Designer', value: (boat) => boat?.boat.designer },
    { label: 'Builder', value: (boat) => boat?.boat.builder },
    { label: 'Issued', help: 'issue-date', value: (boat) => boat?.boat.issue_date?.substring(0, 10) },
    { separator: true },
    { label: 'LOA', value: (boat) => boat?.boat.sizes.loa, suffix: 'm' },
    { label: 'Beam', value: (boat) => boat?.boat.sizes.beam, suffix: 'm' },
    { label: 'Draft', value: (boat) => boat?.boat.sizes.draft, suffix: 'm' },
    { label: 'Displacement', help: 'displacement', value: (boat) => boat?.boat.sizes.displacement, suffix: 'kg' },
    { label: 'Wetted surface', help: 'wetted-surface', value: (boat) => boat?.boat.sizes.wetted_surface, area: true },
    // Rounded to match how the boat page prints it.
    { label: 'CDL', help: 'cdl', value: (boat) => round(boat?.boat.cdl, 2), suffix: 'm' },
    { separator: true },
    { label: 'Main', help: 'sail-areas', value: (boat) => boat?.boat.sizes.main, area: true },
    { label: 'Genoa', value: (boat) => boat?.boat.sizes.genoa, area: true },
    { label: 'Spinnaker', value: (boat) => boat?.boat.sizes.spinnaker, area: true },
    // Non-breaking space so the label does not wrap mid-term in a narrow column.
    { label: 'Spinnaker asym', value: (boat) => boat?.boat.sizes.spinnaker_asym, area: true },
    { separator: true },
    { label: 'Top speed', value: topSpeed, suffix: 'kts' },
    { label: 'Offshore (ToD)', help: 'osn', value: (boat) => boat?.rating.osn, suffix: 's/NM' },
    { label: 'Inshore (ToD)', help: 'ilc', value: (boat) => boat?.rating.ilc, suffix: 's/NM' },
    { label: 'All-purpose (ToD)', help: 'aph', value: (boat) => boat?.rating.aph_tod, suffix: 's/NM' },
    { label: 'GPH', help: 'gph', value: (boat) => boat?.rating.gph, suffix: 's/NM' },
];

// Hide a row neither boat can fill. Boats whose certificate predates a field are still in
// the database, and a labelled row with two empty cells tells the reader nothing about why
// it is empty.
$: visibleRows = rows.filter((row) => row.separator || [boatA, boatB].some((boat) => row.value(boat)));
</script>

<svelte:head>
    <title>{pageTitle('Compare boats')}</title>
</svelte:head>

<div class="container-fluid">
    <div class="row p-2 row-cols-2">
        <div class="col">
            <BoatSelect bind:sailnumber={sailnumberA} />
        </div>
        <div class="col">
            <BoatSelect bind:sailnumber={sailnumberB} />
        </div>
    </div>
    <div class="row p-2 row-cols-2"></div>
    <div class="row p-2">
        <div class="col-sm-6">
            <PolarPlot boats={[boatA, boatB]} />
        </div>
        <div class="col-sm-4">
            <div class="row">
                <table>
                    <tr>
                        <th></th>
                        <td><LineLegend series={0} /></td>
                        <td><LineLegend series={1} /></td>
                    </tr>
                    <tr>
                        <td>Sail number</td>
                        <td>
                            {#if sailnumberA}
                                <a href="#{sailnumberA}">
                                    <Sailnumber number={sailnumberA} />
                                </a>
                            {/if}
                        </td>
                        <td>
                            {#if sailnumberB}
                                <a href="#{sailnumberB}">
                                    <Sailnumber number={sailnumberB} />
                                </a>
                            {/if}
                        </td>
                    </tr>
                    {#each visibleRows as row}
                        {#if row.separator}
                            <tr><td colspan="3" class="separator"></td></tr>
                        {:else}
                            <tr>
                                <td class="label">
                                    {row.label}{#if row.help}<Help term={row.help} />{/if}
                                </td>
                                {#each [boatA, boatB] as boat}
                                    {@const value = row.value(boat)}
                                    <td class:text-end={typeof value === 'number'}>
                                        {#if value}
                                            <!-- Units are spaced off the number, matching the boat page. -->
                                            {value}{#if row.suffix}&nbsp;{row.suffix}{/if}{#if row.area}&nbsp;m<sup
                                                    >2</sup
                                                >{/if}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/if}
                    {/each}
                </table>
            </div>
        </div>
    </div>
</div>

<style>
td.separator {
    border-bottom: 1px solid #000;
    height: 2px;
}
td.label {
    white-space: nowrap;
}
/* Allow the columns to shrink below the plot SVG's intrinsic width, otherwise
   the SVG latches the column wide and the layout wraps and never recovers. */
.col-sm-6,
.col-sm-4 {
    min-width: 0;
}
</style>
