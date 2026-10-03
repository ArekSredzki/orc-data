<script>
import CertificateSelect from './CertificateSelect.svelte';
import Help from './Help.svelte';
import OrcReference from './OrcReference.svelte';
import PolarPlot from './PolarPlot.svelte';
import PolarTable from './PolarTable.svelte';
import { getBoat } from '../api.js';
import {
    boatSubject,
    certificateRows,
    formatSailnumber,
    pageTitle,
    ratingRows as buildRatingRows,
    sails as buildSails,
    tripleRows as buildTripleRows,
} from '../boat-meta.js';
import { boatHref, comparisonHref, boatCertificateLabel } from '../certificate-history.js';
import { getHistory } from '../history-api.js';
import { polarExport } from '../polar-csv.js';

export let sailnumber;
export let reference = '';
let error;
let loadId = 0;
let history;
let previous;
let comparePrevious;

let boat;
let extended = false;

let sizes;
let rating;
let sails;

async function loadBoat(sailnumber, reference) {
    const request = ++loadId;
    boat = undefined;
    error = null;
    if (!sailnumber) return;
    try {
        const loaded = await getBoat(sailnumber, reference);
        if (request !== loadId) return;
        boat = loaded;
        sizes = boat.boat.sizes;
        rating = boat.rating;
        sails = buildSails(sizes).map(({ label, value }) => [label, value + 'm²']);
    } catch {
        if (request === loadId)
            error = 'This certificate could not be loaded. Choose another version or return to the latest certificate.';
    }
}

$: loadBoat(sailnumber, reference);
$: history = getHistory(sailnumber).catch(() => ({ versions: [] }));
$: previous = history.then((archive) => {
    const id = archive.aliases?.[reference] || reference || archive.latest;
    const index = archive.versions.findIndex((entry) => entry.id === id);
    return index >= 0 ? archive.versions[index + 1] : null;
});
$: comparePrevious = previous.then((entry) =>
    entry ? comparisonHref([sailnumber, sailnumber], [entry.id, reference || boat?.certificate?.id || '']) : null,
);

$: ratingRows = buildRatingRows(rating);
$: certificate = certificateRows(boat);
$: tripleRows = buildTripleRows(rating);

let plot;
</script>

<svelte:head>
    <title>{boat ? pageTitle(boatSubject(boat)) : pageTitle()}</title>
</svelte:head>

<div class="px-3 pt-2 d-print-none">
    <CertificateSelect
        {sailnumber}
        {reference}
        on:change={(event) => (window.location.hash = boatHref(sailnumber, event.detail))} />
    {#await comparePrevious then url}
        {#if url}<a href={url}>Compare with previous certificate</a>{/if}
    {/await}
    <p class="history-note text-muted">
        Available snapshots for this sail number; history may be incomplete and sail numbers can be reassigned.
    </p>
</div>
{#if error}
    <div class="p-3" role="alert">{error} <a href={boatHref(sailnumber)}>Latest certificate</a></div>
{/if}
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
                <a
                    class="btn btn-primary print-polar d-print-none"
                    href={boatHref(boat.sailnumber, reference, 'print-')}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
                        <path
                            d="M4 1.5A1.5 1.5 0 0 1 5.5 0h5A1.5 1.5 0 0 1 12 1.5V4h1.5A1.5 1.5 0 0 1 15 5.5v5a1.5 1.5 0 0 1-1.5 1.5H12v2.5a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 14.5V12H2.5A1.5 1.5 0 0 1 1 10.5v-5A1.5 1.5 0 0 1 2.5 4H4V1.5Zm1 0V4h6V1.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5Zm6 9.5H5v3.5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5V11Zm1.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                    </svg>
                    Print polar
                </a>
            </div>

            {#if boat.reference}
                <div class="mb-3">
                    <span class="text-muted">ORC reference</span>
                    <OrcReference reference={boat.reference} resources />
                </div>
            {/if}

            {#if boatCertificateLabel(boat)}<p class="certificate-identity">{boatCertificateLabel(boat)}</p>{/if}
            {#if boat.certificate}<p class="text-muted">
                    VPP year: {boat.certificate.vpp_year || 'unknown'} · Family: {boat.certificate.family || 'unknown'}
                </p>{/if}

            <table class="table">
                <tr><th>Sail number</th><th>Type</th><th>Designer</th><th>Builder</th></tr>
                <tr>
                    <td>{formatSailnumber(boat.sailnumber)}</td>
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
.history-note {
    font-size: 0.8rem;
    margin-top: 0.4rem;
}
.certificate-identity {
    font-size: 0.9rem;
}
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
