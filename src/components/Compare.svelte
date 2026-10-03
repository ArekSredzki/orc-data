<script>
import { onMount } from 'svelte';

import BoatSelect from './BoatSelect.svelte';
import CertificateSelect from './CertificateSelect.svelte';
import Help from './Help.svelte';
import LineLegend from './LineLegend.svelte';
import OrcReference from './OrcReference.svelte';
import PolarPlot from './PolarPlot.svelte';
import Sailnumber from './Sailnumber.svelte';
import { getBoat } from '../api.js';
import { pageTitle } from '../boat-meta.js';
import {
    boatHref,
    comparisonHref,
    readComparison,
    boatCertificateLabel,
    numericDelta,
} from '../certificate-history.js';
import { round } from '../util.js';

let sailnumberA = undefined;
let sailnumberB = undefined;
let boatA = undefined;
let boatB = undefined;
let referenceA = '';
let referenceB = '';
let errorA;
let errorB;
let requestA = 0;
let requestB = 0;

const PREFIX = 'compare-';

// The URL owns the selection. Select widgets may clear their internal values while
// options load; only an explicit user change should write a new history entry.
function readUrl() {
    const hash = window.location.hash.substring(1);
    if (hash === 'compare' || hash.startsWith(PREFIX)) {
        const selection = readComparison(hash);
        [sailnumberA, sailnumberB] = selection.boats;
        [referenceA, referenceB] = selection.references;
    }
}

onMount(() => {
    readUrl();
    window.addEventListener('hashchange', readUrl);
    return () => window.removeEventListener('hashchange', readUrl);
});

function selectBoat(side, event) {
    const selected = [sailnumberA || '', sailnumberB || ''];
    const references = [referenceA, referenceB];
    selected[side] = event.detail?.sailnumber || '';
    references[side] = '';
    window.location.hash = comparisonHref(selected, references);
    readUrl();
}

function selectVersion(side, reference) {
    const references = [referenceA, referenceB];
    references[side] = reference;
    window.location.hash = comparisonHref([sailnumberA, sailnumberB], references);
    readUrl();
}

async function loadBoatA(sailnumber, reference) {
    const request = ++requestA;
    boatA = undefined;
    errorA = null;
    if (!sailnumber) return;
    try {
        const loaded = await getBoat(sailnumber, reference);
        if (request === requestA) boatA = loaded;
    } catch {
        if (request === requestA) errorA = 'Certificate A could not be loaded. Choose another version.';
    }
}
async function loadBoatB(sailnumber, reference) {
    const request = ++requestB;
    boatB = undefined;
    errorB = null;
    if (!sailnumber) return;
    try {
        const loaded = await getBoat(sailnumber, reference);
        if (request === requestB) boatB = loaded;
    } catch {
        if (request === requestB) errorB = 'Certificate B could not be loaded. Choose another version.';
    }
}

$: loadBoatA(sailnumberA, referenceA);
$: loadBoatB(sailnumberB, referenceB);
$: differentGrids =
    boatA &&
    boatB &&
    (JSON.stringify(boatA.vpp.speeds) !== JSON.stringify(boatB.vpp.speeds) ||
        JSON.stringify(boatA.vpp.angles) !== JSON.stringify(boatB.vpp.angles));

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
    { label: 'ORC reference', reference: true, value: (boat) => boat?.reference },
    { label: 'VPP year', value: (boat) => (boat ? boat.certificate?.vpp_year || 'Unknown' : null) },
    { label: 'Certificate family', value: (boat) => (boat ? boat.certificate?.family || 'Unknown' : null) },
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
$: visibleRows = rows.filter(
    (row) => row.separator || [boatA, boatB].some((boat) => row.value(boat) != null && row.value(boat) !== ''),
);
</script>

<svelte:head>
    <title>{pageTitle('Compare boats')}</title>
</svelte:head>

<div class="container-fluid">
    <div class="row p-2 row-cols-1 row-cols-md-2">
        <div class="col">
            <BoatSelect sailnumber={sailnumberA} on:change={(event) => selectBoat(0, event)} />
            <CertificateSelect
                sailnumber={sailnumberA}
                reference={referenceA}
                label="Certificate A"
                on:change={(event) => selectVersion(0, event.detail)} />
            {#if boatA}<p class="certificate-label">A · {boatA.name} · {boatCertificateLabel(boatA)}</p>{/if}
            {#if errorA}<p role="alert">{errorA}</p>{/if}
        </div>
        <div class="col">
            <BoatSelect sailnumber={sailnumberB} on:change={(event) => selectBoat(1, event)} />
            <CertificateSelect
                sailnumber={sailnumberB}
                reference={referenceB}
                label="Certificate B"
                on:change={(event) => selectVersion(1, event.detail)} />
            {#if boatB}<p class="certificate-label">B · {boatB.name} · {boatCertificateLabel(boatB)}</p>{/if}
            {#if errorB}<p role="alert">{errorB}</p>{/if}
        </div>
    </div>
    <p class="text-muted history-note">
        Available snapshots for each sail number; history may be incomplete. Ratings can change with VPP year and
        certificate family.
    </p>
    {#if differentGrids}<p class="text-muted history-note">
            Wind grids differ. Each curve uses its certificate’s own wind speeds and angles.
        </p>{/if}
    <div class="row p-2">
        <div class="col-xl-6">
            <PolarPlot boats={[boatA, boatB]} />
        </div>
        <div class="col-xl-6 comparison-table">
            <div class="table-scroll">
                <table>
                    <tr>
                        <th></th>
                        <td><LineLegend series={0} /></td>
                        <td><LineLegend series={1} /></td>
                        <th class="delta-heading">Change<br />(B − A)</th>
                    </tr>
                    <tr>
                        <td>Sail number</td>
                        <td>
                            {#if sailnumberA}
                                <a href={boatHref(sailnumberA, referenceA)}>
                                    <Sailnumber number={sailnumberA} />
                                </a>
                            {/if}
                        </td>
                        <td>
                            {#if sailnumberB}
                                <a href={boatHref(sailnumberB, referenceB)}>
                                    <Sailnumber number={sailnumberB} />
                                </a>
                            {/if}
                        </td>
                        <td></td>
                    </tr>
                    {#each visibleRows as row}
                        {#if row.separator}
                            <tr><td colspan="4" class="separator"></td></tr>
                        {:else}
                            <tr>
                                <td class="label">
                                    {row.label}{#if row.help}<Help term={row.help} />{/if}
                                </td>
                                {#each [boatA, boatB] as boat}
                                    {@const value = row.value(boat)}
                                    <td class:text-end={typeof value === 'number'}>
                                        {#if row.reference && value}
                                            <OrcReference reference={value} />
                                        {:else if value != null && value !== ''}
                                            <!-- Units are spaced off the number, matching the boat page. -->
                                            {value}{#if row.suffix}&nbsp;{row.suffix}{/if}{#if row.area}&nbsp;m<sup
                                                    >2</sup
                                                >{/if}
                                        {/if}
                                    </td>
                                {/each}
                                <td class="text-end delta"
                                    >{typeof row.value(boatA) === 'number' || typeof row.value(boatB) === 'number'
                                        ? numericDelta(row.value(boatA), row.value(boatB))
                                        : ''}</td>
                            </tr>
                        {/if}
                    {/each}
                </table>
            </div>
        </div>
    </div>
</div>

<style>
.history-note,
.certificate-label {
    font-size: 0.85rem;
    margin: 0.5rem;
}
.table-scroll {
    overflow-x: auto;
}
table {
    width: 100%;
}
.col {
    min-width: 0;
}
.delta,
.delta-heading {
    padding-left: 1rem;
    white-space: nowrap;
}
.delta-heading {
    font-weight: 500;
    font-size: 0.8rem;
}
td {
    padding: 0.2rem 0.4rem;
}
td.separator {
    border-bottom: 1px solid #000;
    height: 2px;
}
td.label {
    white-space: nowrap;
}
/* Allow the columns to shrink below the plot SVG's intrinsic width, otherwise
   the SVG latches the column wide and the layout wraps and never recovers. */
.col-xl-6,
.col-sm-4 {
    min-width: 0;
}
</style>
