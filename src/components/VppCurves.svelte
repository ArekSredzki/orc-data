<script>
import { zip } from 'd3-array';
import { curveCardinal, lineRadial, symbol, symbolDiamond } from 'd3-shape';

import { DEG2RAD, twa2awa, vmg2sog } from '../util.js';

/* Component to render VPP data for a boat. */
export let vpp;
export let rScale;
export let index = 0;
export let angleMode = 'true';

// Build a [angleRad, sog] point, converting the angle to apparent wind when
// requested. `tws` is only needed for the apparent conversion.
const point = (degrees, sog, tws, apparent) => [
    (apparent ? twa2awa(degrees, tws, sog) : degrees) * DEG2RAD,
    sog,
];
const vmgPoint = (degrees, vmg, tws, apparent) => point(degrees, vmg2sog(degrees, vmg), tws, apparent);

function seriesFromVpp(vpp, angleMode) {
    const apparent = angleMode === 'apparent';
    let run_data = [];

    const vpp_data = vpp.speeds.map(function (tws, i) {
        var series = vpp.angles
            .map((angle) => point(angle, vpp[angle][i], tws, apparent))
            .filter((a) => a[1] > 0);
        if (vpp.beat_angle) {
            series.unshift(vmgPoint(vpp.beat_angle[i], vpp.beat_vmg[i], tws, apparent));
        }
        if (vpp.run_angle) {
            const run = vmgPoint(vpp.run_angle[i], -vpp.run_vmg[i], tws, apparent);
            series.push(run);
            run_data.push(run);
        }
        return series.sort((a, b) => a[0] - b[0]);
    });
    return { vpp: vpp_data, run: run_data };
}

$: data = seriesFromVpp(vpp, angleMode);
$: line = lineRadial()
    .angle((d) => d[0])
    .radius((d) => rScale(d[1]))
    .curve(curveCardinal.tension(0.2));
</script>

<!-- Curves for each true wind speed -->
{#each data.vpp as tws, i}
    <path class="line series-{index} tws-{vpp.speeds[i]}" d={line(tws)} stroke-width="2" />
{/each}
<!-- VMG diamonds -->
{#each data.run as [rad, vmg], i}
    <path
        class="vmg-run series-{index} tws-{vpp.speeds[i]}"
        d={symbol(symbolDiamond, 32)()}
        transform="translate({rScale(vmg) * Math.sin(rad)}, {rScale(vmg) * -Math.cos(rad)})"
        stroke-width="1" />
{/each}
