<script>
import Svelecte from 'svelecte';
import { createEventDispatcher } from 'svelte';

import { index } from '../api.js';
import { formatSailnumber } from '../boat-meta.js';

export let sailnumber = undefined;

const dispatch = createEventDispatcher();
function change(event) {
    sailnumber = event.detail?.sailnumber || null;
    dispatch('change', event.detail);
}

function renderer({ sailnumber, name, type }) {
    return `<span class="sailnumber">${formatSailnumber(sailnumber)}</span> ${name} (${type})`;
}
</script>

<!-- Reapply the requested value when options arrive; widget initialization cannot change the route. -->
{#key $index}
    <Svelecte
        options={$index}
        placeholder="Sail number, name or type"
        virtualList={true}
        valueField="sailnumber"
        labelField="name"
        searchField={['sailnumber', 'name', 'type']}
        value={$index.length ? sailnumber : null}
        {renderer}
        on:change={change} />
{/key}

<style>
:global(.svelecte-control) {
    min-width: 500px;
}

@media only screen and (max-width: 1300px) {
    :global(.svelecte-control) {
        min-width: 275px;
    }
}
</style>
