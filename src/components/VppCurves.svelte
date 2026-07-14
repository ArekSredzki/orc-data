<script>
import { curveCardinal, lineRadial, symbol, symbolDiamond } from 'd3-shape';

import { vppSeries } from '../vpp.js';

/* Component to render VPP data for a boat. */
export let vpp;
export let rScale;
export let index = 0;
export let angleMode = 'true';

$: series = vppSeries(vpp, angleMode);
$: runPoints = series.map((s) => s.points.find((p) => p.kind === 'run')).filter(Boolean);
$: line = lineRadial()
    .angle((d) => d.angleRad)
    .radius((d) => rScale(d.sog))
    .curve(curveCardinal.tension(0.2));
</script>

<!-- Curves for each true wind speed -->
{#each series as s}
    <path class="line series-{index} tws-{s.tws}" d={line(s.points)} stroke-width="2" />
{/each}
<!-- VMG diamonds -->
{#each runPoints as p}
    <path
        class="vmg-run series-{index} tws-{p.tws}"
        d={symbol(symbolDiamond, 32)()}
        transform="translate({rScale(p.sog) * Math.sin(p.angleRad)}, {rScale(p.sog) * -Math.cos(p.angleRad)})"
        stroke-width="1" />
{/each}
