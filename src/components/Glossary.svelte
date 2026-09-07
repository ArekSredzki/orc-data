<script>
import { onMount } from 'svelte';

import { GLOSSARY, GLOSSARY_GROUPS, glossaryAnchor } from '../glossary.js';

const PREFIX = 'glossary-';

// The browser fires hashchange before this component mounts, so by the time it tries to
// scroll to #glossary-gph the element does not exist yet and native anchor scrolling does
// nothing. Do it here instead, and again on hashchange, since navigating between two
// glossary anchors does not remount the component.
function scrollToHash() {
    const hash = window.location.hash.substring(1);
    if (!hash.startsWith(PREFIX) || hash === 'glossary') {
        return;
    }
    const target = document.getElementById(hash);
    if (target) {
        target.scrollIntoView({ block: 'start' });
    }
}

onMount(() => {
    scrollToHash();
    window.addEventListener('hashchange', scrollToHash, false);
    return () => window.removeEventListener('hashchange', scrollToHash, false);
});
</script>

<div class="container glossary">
    <div class="row">
        <div class="col-sm-12 col-lg-9">
            <h1>Glossary</h1>
            <p class="lead">
                What the numbers on an ORC certificate mean, and how to read the polar diagrams on this site.
            </p>
            <p class="text-muted">
                Definitions are quoted from the ORC Rating Systems rulebook and orc.org where possible; every entry
                links to its source. Rule numbers refer to the
                <a href="https://orc.org/uploads/files/Rules-Regulations/2023/ORC-Rating-Systems-2023-PDF.pdf">
                    2023 edition of the rulebook</a
                >.
            </p>

            {#each GLOSSARY_GROUPS as group}
                <h2>{group.title}</h2>
                {#each group.keys as key}
                    {@const entry = GLOSSARY[key]}
                    <section id={glossaryAnchor(key)}>
                        <h5>
                            {entry.title}
                            {#if entry.term !== entry.title}<small class="text-muted">({entry.term})</small>{/if}
                        </h5>
                        {#if entry.unit}
                            <p class="unit">Measured in {entry.unit}.</p>
                        {/if}
                        <p class="summary">{entry.short}</p>
                        {#each entry.long as paragraph}
                            <p>{paragraph}</p>
                        {/each}
                        <p>
                            <a class="source" href={entry.source} target="_blank" rel="noreferrer noopener">
                                Source: orc.org
                            </a>
                        </p>
                    </section>
                {/each}
            {/each}
        </div>
    </div>
</div>

<style>
.glossary {
    padding-bottom: 4rem;
}
h2 {
    margin-top: 2rem;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #777;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.25rem;
}
section {
    /* Leaves room for the sticky-ish navbar when an anchor is scrolled to. */
    scroll-margin-top: 1rem;
    margin: 1.5rem 0;
    max-width: 44rem;
}
section h5 {
    margin-bottom: 0.25rem;
}
.unit {
    margin-bottom: 0.25rem;
    color: #777;
    font-style: italic;
}
.summary {
    font-weight: 500;
}
.source {
    color: #777;
    font-size: 0.85rem;
}
</style>
