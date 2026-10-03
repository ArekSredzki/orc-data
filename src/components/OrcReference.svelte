<script>
import { certificateUrl } from '../orc-links.js';

export let reference;
export let resources = false;

$: certificate = certificateUrl(reference);
</script>

{#if reference}
    {#await certificate}
        {reference}
    {:then url}
        {#if url}
            <a href={url} target="_blank" rel="noopener noreferrer" title="View original ORC certificate"
                >{reference}</a>
        {:else}
            {reference}
        {/if}
    {/await}
{/if}
{#if resources}
    <div class="resources d-print-none">
        <a href="https://orc.org/sailors/sailor-services/speed-guides" target="_blank" rel="noopener noreferrer"
            >Speed guides</a>
        <span aria-hidden="true"> · </span>
        <a href="https://orc.org/sailors/sailor-services" target="_blank" rel="noopener noreferrer">Sailor Services</a>
        <span class="note">Speed guides and target speeds may require login and payment.</span>
    </div>
{/if}

<style>
.resources {
    margin-top: 0.3rem;
    font-size: 0.85rem;
}
.note {
    display: block;
    color: #666;
}
</style>
