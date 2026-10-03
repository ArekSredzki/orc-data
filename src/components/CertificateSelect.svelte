<script>
import { createEventDispatcher } from 'svelte';

import { certificateLabel } from '../certificate-history.js';
import { getHistory } from '../history-api.js';

export let sailnumber;
export let reference = '';
export let label = 'Certificate version';
const dispatch = createEventDispatcher();
$: history = getHistory(sailnumber);
</script>

{#if sailnumber}
    {#await history then archive}
        {#if archive.versions.length > 1 || reference}
            <label class="version-select">
                <span>{label}</span>
                <select
                    class="form-select"
                    value={reference}
                    on:change={(event) => dispatch('change', event.target.value)}>
                    <option value="">Latest available</option>
                    {#if reference && !archive.versions.some((entry) => entry.id === reference)}
                        <option value={reference}
                            >{archive.aliases?.[reference] ? 'Saved snapshot' : 'Version unavailable'} · {reference}</option>
                    {/if}
                    {#each archive.versions as entry}
                        <option value={entry.id}
                            >{certificateLabel(entry)}{entry.id === archive.latest ? ' (latest)' : ''}</option>
                    {/each}
                </select>
            </label>
        {/if}
    {:catch}
        <p class="text-muted">Certificate history could not be loaded. Reload to retry.</p>
    {/await}
{/if}

<style>
.version-select {
    display: block;
    margin: 0.6rem 0;
    font-size: 0.9rem;
}
.version-select span {
    display: block;
    margin-bottom: 0.25rem;
}
select {
    width: 100%;
    max-width: 100%;
}
</style>
