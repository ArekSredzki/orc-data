<script>
import { onMount } from 'svelte';

import { randomBoat } from './api.js';
import { DATA_YEAR } from './boat-meta.js';
import Boat from './components/Boat.svelte';
import BoatSelect from './components/BoatSelect.svelte';
import Compare from './components/Compare.svelte';
import CustomPlot from './components/CustomPlot.svelte';
import Extremes from './components/Extremes.svelte';
import Glossary from './components/Glossary.svelte';
import PrintView from './components/PrintView.svelte';
import Table from './components/Table.svelte';
export let route = 'extremes';
export let sailnumber = null;

// The boat the hash names, kept separately from `sailnumber` because that one is bound into
// BoatSelect and svelecte empties it while its option list loads — which is why the navbar's
// Compare link has always pointed at "#compare-" on a boat page.
let boatSailnumber = null;

// A route is custom if it starts with one of the route prefixes. Sail numbers always begin
// with an uppercase country code, so none of these can collide with one.
const prefixes = ['extremes', 'customplot', 'compare', 'type', 'random', 'glossary', 'print'];
const isCustomRoute = (value) => prefixes.some((item) => value.startsWith(item));

function onhashchange() {
    const hash = window.location.hash;
    route = hash.length > 1 ? hash.substring(1) : 'extremes';

    if (isCustomRoute(route)) {
        sailnumber = null;
        boatSailnumber = null;
    } else {
        sailnumber = route;
        boatSailnumber = route;
        route = 'boat';
    }
}

onMount(() => {
    window.addEventListener('hashchange', onhashchange, false);
    onhashchange();
    return () => window.removeEventListener('hashchange', onhashchange, false);
});

$: {
    if (sailnumber && !isCustomRoute(sailnumber)) {
        window.location.hash = sailnumber;
    }
}
$: if (route == 'random') {
    window.location.hash = $randomBoat;
}

// The print route carries the boat in the route itself and its options in a query string
// after it: #print-EST/EST688?layout=card. The sail number is passed one-way to PrintView
// so that changing an option there cannot feed back into the router.
$: printSailnumber = route.startsWith('print-') ? route.substring('print-'.length).split('?')[0] : null;
</script>

<nav class="navbar navbar-expand-lg navbar-light bg-light d-print-none">
    <div class="container-fluid">
        <a class="navbar-brand" href="#extremes">ORC Sailboat Data ({DATA_YEAR})</a>
        <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation">
            <span class="navbar-toggler-icon" />
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                {#if !sailnumber || (sailnumber && !sailnumber.startsWith('compare'))}
                    <li class="nav-item d-block-md">
                        <BoatSelect bind:sailnumber />
                    </li>
                {/if}
                {#if boatSailnumber}
                    <li class="nav-item">
                        <a href="#print-{boatSailnumber}" class="nav-link print-link">Print polar</a>
                    </li>
                {/if}
                <li class="nav-item">
                    <a href="#compare-{boatSailnumber || sailnumber || ''}" class="nav-link">Compare boats</a>
                </li>
                <li class="nav-item"><a href="#customplot" class="nav-link">Plot custom CSV</a></li>
                <li class="nav-item"><a href="#glossary" class="nav-link">Glossary</a></li>
            </ul>

            <div class="d-flex navbar-text">
                <a href="https://github.com/ArekSredzki/orc-data/">GitHub</a>,
                <a href="https://orc.org/index.asp?id=44">Data &copy; ORC.org</a>
            </div>
            &nbsp;
        </div>
    </div>
</nav>

{#if route == 'extremes'}
    <Extremes />
{:else if route == 'customplot'}
    <CustomPlot />
{:else if route.startsWith('glossary')}
    <Glossary />
{:else if route.startsWith('print')}
    {#if printSailnumber}
        <PrintView sailnumber={printSailnumber} />
    {:else}
        <div class="container p-4">
            <p>Open a boat and choose “Print polar” to make a printable sheet.</p>
            <a href="#extremes">Back to the boat list</a>
        </div>
    {/if}
{:else if route.startsWith('compare')}
    <Compare />
{:else if route.startsWith('type')}
    <Table q={decodeURIComponent(route.substring(5))} />
{:else}
    <Boat {sailnumber} />
{/if}

<style>
/* The print view is the one action on a boat page you may want at any scroll position, so
   it sits in the navbar too and is weighted to stand out from the section links. */
.print-link {
    font-weight: 600;
}
</style>
