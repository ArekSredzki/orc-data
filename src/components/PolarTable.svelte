<script>
import { polarSheet } from '../polar-rows.js';

export let vpp;
export let hover = () => {};

$: sheet = polarSheet(vpp);

// The degree sign sits on the row label for the wind-angle rows ("52°") and in the cells
// for the beat and run angles, which is how this table has always read. Boat speeds carry
// no unit in the cells at all; the column header says knots.
const cellUnit = (block, row) => (row.unit === '°' && block.key !== 'grid' ? '°' : '');

function clearHighlight() {
    hover(undefined);
}
</script>

<table class="table table-sm polar-table">
    <thead>
        <tr>
            <th>Wind speed</th>
            {#each sheet.speeds as speed}
                <th class="tws-{speed}">{speed}kts</th>
            {/each}
        </tr>
    </thead>
    <tbody>
        {#each sheet.blocks as block}
            {#each block.rows as row}
                <tr class={block.key === 'grid' ? `twa-${row.label}` : ''}>
                    <td>{row.label}{block.key === 'grid' ? row.unit : ''}</td>
                    {#each row.values as value, i}
                        {#if value.point}
                            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                            <td
                                class="tws-{sheet.speeds[i]}"
                                on:mouseover={() => hover(value.point)}
                                on:mouseout={clearHighlight}>{value.text}</td>
                        {:else}
                            <td class="tws-{sheet.speeds[i]}">{value.text}{cellUnit(block, row)}</td>
                        {/if}
                    {/each}
                </tr>
            {/each}
        {/each}
    </tbody>
</table>

<style>
.polar-table td {
    text-align: right;
}
/* Keep the row label (first column) on a single line, e.g. "Beat angle (TWA)". */
.polar-table td:first-child {
    text-align: left;
    white-space: nowrap;
}
</style>
