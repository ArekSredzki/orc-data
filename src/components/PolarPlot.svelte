<svelte:options accessors />

<script>
import { onMount } from 'svelte';
import { scaleLinear } from 'd3-scale';
import { symbol, symbolCircle } from 'd3-shape';

import VppCurves from './VppCurves.svelte';
import { DEG2RAD, twa2awa } from '../util.js';
export let boats = [];

// Angle reference frame for the plotted curves: 'true' (TWA) or 'apparent' (AWA).
let angleMode = 'true';

let container;
let width = 300;
let windowInnerHeight = 700;

// Layout margins (px) around the semicircle plot. The polar occupies the RIGHT
// half: the origin sits near the left edge, content spans `radius` to the right
// (plus angle labels) and `radius` both up and down.
const PAD_LEFT = 15;
const PAD_RIGHT = 40; // room for angle labels e.g. "165°"
const PAD_VERT = 30; // room for the "kts" ring labels and the top "0°" label
const CHROME = 100; // navbar + angle toggle above the plot

// Radius = pixel position of the 10kt ring. Fit the semicircle in both the
// container width and the available viewport height, then center it vertically.
$: radius = Math.max(
    0,
    Math.min(width - PAD_LEFT - PAD_RIGHT, (windowInnerHeight - CHROME) / 2 - PAD_VERT),
);
$: height = 2 * (radius + PAD_VERT);

// Scale for the r axis, mapping SOG to plot coordinates
$: rScale = scaleLinear().domain([0, 10]).range([0, radius]);

const sogs = [2, 4, 6, 8, 10, 12, 14, 16];
const maxSogLabel = 10;
const angles = [0, 45, 52, 60, 75, 90, 110, 120, 135, 150, 165];

let highlight = undefined;
export const hover = (_newHighlight) => {
    highlight = _newHighlight;
};

// Track the container's own width so the plot resizes live with the layout,
// not only on window resize.
onMount(() => {
    const observer = new ResizeObserver((entries) => {
        width = entries[0].contentRect.width;
    });
    observer.observe(container);
    return () => observer.disconnect();
});

// Angle at which to draw the highlight marker, converted to apparent when active.
$: highlightAngle =
    highlight &&
    (angleMode === 'apparent' ? twa2awa(highlight.cog, highlight.tws, highlight.sog) : highlight.cog);
</script>

<svelte:window bind:innerHeight={windowInnerHeight} />
<div bind:this={container}>
    <div class="angle-mode">
        <div class="btn-group btn-group-sm" role="group" aria-label="Wind angle reference">
            <input
                type="radio"
                class="btn-check"
                id="angle-true"
                value="true"
                bind:group={angleMode} />
            <label class="btn btn-outline-secondary" for="angle-true">True</label>
            <input
                type="radio"
                class="btn-check"
                id="angle-apparent"
                value="apparent"
                bind:group={angleMode} />
            <label class="btn btn-outline-secondary" for="angle-apparent">Apparent</label>
        </div>
        <small class="text-muted">
            Angle: {angleMode === 'apparent' ? 'Apparent (AWA)' : 'True (TWA)'}
        </small>
    </div>
    <svg {width} {height}>
        <g transform="translate({PAD_LEFT}, {height / 2})">
            <!-- Speed rings -->
            {#each sogs as sog}
                <g class="r axis sog-{sog}">
                    <circle r={rScale(sog)}></circle>
                    {#if sog <= maxSogLabel}
                        <text y={-rScale(sog) - 2} transform="rotate(25)" text-anchor="middle">
                            {sog} kts
                        </text>
                    {/if}
                </g>
            {/each}
            <!-- Course lines -->
            {#each angles as angle}
                <g class="a axis" transform="rotate({angle - 90})">
                    <line x1={rScale(0)} x2={rScale(10)} />
                    <text class="xlabel" x={rScale(10) + 5} y={0} text-anchor="start" alignment-baseline="middle">
                        {angle}°
                    </text>
                </g>
            {/each}
            {#each boats as boat, index}
                {#if boat}
                    <VppCurves vpp={boat.vpp} {index} {rScale} {angleMode} />
                {/if}
            {/each}
            {#if highlight}
                <path
                    class="highlight tws-{highlight.tws}"
                    d={symbol(symbolCircle, 80)()}
                    transform="translate({rScale(highlight.sog) * Math.sin(highlightAngle * DEG2RAD)}, {rScale(
                        highlight.sog,
                    ) * -Math.cos(highlightAngle * DEG2RAD)})"
                    transition="400ms"
                    stroke-width="1" />
            {/if}
        </g>
    </svg>
</div>

<style>
.angle-mode {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
}
</style>
