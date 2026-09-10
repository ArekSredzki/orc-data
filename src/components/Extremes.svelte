<script>
import { onMount } from 'svelte';

import { pageTitle } from '../boat-meta.js';
import Help from './Help.svelte';
import PolarPlot from './PolarPlot.svelte';
import Sailnumber from './Sailnumber.svelte';
import { getBoat, getExtremes, randomBoat, indexSize } from '../api.js';

let hoverSailnumber;
let boat;

hoverSailnumber = $randomBoat;

async function loadBoat(number) {
    if (number) {
        boat = await getBoat(number);
    }
}

$: loadBoat(hoverSailnumber);

// The speed extremes carry a help icon: they are VPP predictions, not measured speeds,
// which is not obvious from a leaderboard.
const labels = {
    max_speed: { text: 'Greatest maximum speed (kts)', help: 'vpp' },
    min_speed: { text: 'Smallest maximum speed (kts)', help: 'vpp' },
    max_length: { text: 'Greatest length over all (m)' },
    max_displacement: { text: 'Greatest displacement (kg)' },
    max_draft: { text: 'Greatest draft (m)' },
};
</script>

<svelte:head>
    <title>{pageTitle()}</title>
</svelte:head>

<div class="container-fluid">
    <div class="row gx-5">
        <div class="col col-sm-8 p-4">
            <p>
                Polar diagrams for {$indexSize || 'lots of'} sailyachts with ORC certificates. Select one of the boats below,
                search by sailnumber, name or type or select a
                <a href="#random" class="link-primary">random boat</a>.
            </p>

            <p>
                New to ORC ratings? The <a href="#glossary">glossary</a> explains what the numbers on a certificate mean
                and how to read a polar diagram.
            </p>

            <p>
                Questions/suggestions? Contact me on
                <a href="https://github.com/ArekSredzki/orc-data">GitHub</a>. All data is fetched from
                <a href="https://orc.org/index.asp?id=44">ORC.org</a>.
            </p>

            <p class="credit">
                This site was originally built by
                <a href="https://github.com/jieter">Jan Pieter Waagmeester</a> as
                <a href="https://github.com/jieter/orc-data">jieter/orc-data</a>, and is maintained here as a fork.
            </p>
        </div>
        <div class="col-sm-4 p-4">
            <a href="#random" class="btn btn-primary">Random boat</a>
        </div>
    </div>

    <div class="row gx-5">
        <div class="col col-sm-8 p-4">
            {#await getExtremes() then extremes}
                <div class="row">
                    {#each Object.entries(extremes) as [extreme, boats]}
                        <div class="col-md-6">
                            <h5>
                                {labels[extreme].text}
                                {#if labels[extreme].help}<Help term={labels[extreme].help} />{/if}
                            </h5>

                            <ul class="list-unstyled">
                                {#each boats as [number, name, type, value]}
                                    <li class="boat" on:mouseenter={() => loadBoat(number)}>
                                        <a href="#{number}" class="link">
                                            <Sailnumber {number} />
                                            {name || '?'}
                                            <span class="float-end">{value < 100 ? value.toFixed(2) : value}</span>
                                        </a>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                </div>
            {/await}
        </div>
        <div class="col-sm-4 p-4">
            {#if boat}
                <h6>
                    <a href="#{boat.sailnumber}">
                        <Sailnumber number={boat.sailnumber} />
                    </a>
                    {boat.name} ({boat.boat.type})
                </h6>

                <PolarPlot boats={[boat]} />
            {/if}
        </div>
    </div>
</div>

<style>
/* Credit where the project came from: set quietly, since it is provenance rather than
   something a visitor came here to read. */
.credit {
    font-size: 0.875rem;
    color: #6c757d;
}

.link-primary,
.boat {
    cursor: pointer;
}

.boat {
    list-style-type: none;
    padding: 1px 2px;
}
.boat:hover {
    background-color: #eee;
}

h6 {
    white-space: nowrap;
}

.link {
    color: inherit;
    text-decoration: none;
}
</style>
