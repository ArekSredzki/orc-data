<script context="module">
import { writable } from 'svelte/store';

// Which Help instance currently has its panel open, keyed by a per-instance symbol.
// Keyed by instance rather than by term because the same term is used in more than one
// place (e.g. `tws` on both the polar plot and the polar table), and a term-keyed store
// would open every copy at once.
const openInstance = writable(null);
</script>

<script>
import { tick } from 'svelte';

import { GLOSSARY } from '../glossary.js';

export let term;

const id = Symbol(term);
const panelId = `help-panel-${Math.random().toString(36).slice(2, 9)}`;
const titleId = `${panelId}-title`;

const entry = GLOSSARY[term];
if (!entry) {
    console.warn(`<Help term="${term}"> has no entry in GLOSSARY (src/glossary.js).`);
}

// Distinguishes a panel opened by clicking (stays put, behaves as a dialog) from one
// merely previewed by hovering (follows the pointer away, behaves as a tooltip).
let pinned = false;
let expanded = false;

let wrapper;
let button;
let panel;
let openTimer;
let closeTimer;

// Below this width an anchored popover would be clamped against the viewport on almost
// every open, so the panel becomes a sheet across the bottom of the screen instead.
const SHEET_MAX_WIDTH = 576;
const EDGE = 8; // px kept clear of the viewport edge
const GAP = 6; // px between the icon and the panel

let sheet = false;
let left = 0;
let top = 0;

$: isOpen = $openInstance === id;
// Reset the disclosure whenever the panel closes, so it never reopens half-expanded.
$: if (!isOpen) {
    pinned = false;
    expanded = false;
}
// Reposition when the panel opens and whenever its height changes (the More disclosure).
$: if (isOpen || expanded) {
    position();
}

const canHover = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

async function position() {
    await tick();
    if (!button || !panel) {
        return;
    }
    sheet = window.innerWidth < SHEET_MAX_WIDTH;
    if (sheet) {
        return;
    }

    const rect = button.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;

    left = Math.min(Math.max(rect.left, EDGE), Math.max(EDGE, window.innerWidth - width - EDGE));
    // Prefer below the icon; flip above when that would run off the bottom.
    top = rect.bottom + GAP;
    if (top + height > window.innerHeight - EDGE) {
        top = Math.max(EDGE, rect.top - height - GAP);
    }
}

function open(pin) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    pinned = pinned || pin;
    openInstance.set(id);
}

function close() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    openInstance.update((current) => (current === id ? null : current));
}

function toggle() {
    if (isOpen && pinned) {
        close();
    } else {
        open(true);
    }
}

function onEnter() {
    // Touch browsers synthesise mouseover before click; opening on it would make the
    // click that follows immediately close the panel again.
    if (!canHover()) {
        return;
    }
    clearTimeout(closeTimer);
    openTimer = setTimeout(() => open(false), 150);
}

function onLeave() {
    clearTimeout(openTimer);
    if (pinned) {
        return;
    }
    // Delay so the pointer can travel from the icon into the panel without it vanishing.
    closeTimer = setTimeout(close, 200);
}

function onWindowKeydown(event) {
    if (isOpen && event.key === 'Escape') {
        event.stopPropagation();
        close();
        button?.focus();
    }
}

function onWindowPointerdown(event) {
    if (isOpen && wrapper && !wrapper.contains(event.target)) {
        close();
    }
}
</script>

<svelte:window
    on:keydown={onWindowKeydown}
    on:pointerdown={onWindowPointerdown}
    on:scroll={() => isOpen && position()}
    on:resize={() => isOpen && position()} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="help" bind:this={wrapper} on:mouseenter={onEnter} on:mouseleave={onLeave}>
    <button
        type="button"
        class="help-icon"
        bind:this={button}
        aria-label={entry ? `What is ${entry.term} (${entry.title})?` : `What is ${term}?`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-describedby={isOpen && !pinned ? panelId : undefined}
        on:click={toggle}>?</button>

    {#if isOpen}
        <div
            class="help-panel"
            class:sheet
            bind:this={panel}
            id={panelId}
            role={pinned ? 'dialog' : 'tooltip'}
            aria-labelledby={pinned ? titleId : undefined}
            tabindex="-1"
            style={sheet ? '' : `left: ${left}px; top: ${top}px;`}>
            {#if entry}
                <div class="help-title" id={titleId}>
                    {entry.title}
                    {#if entry.term !== entry.title}<span class="help-term">({entry.term})</span>{/if}
                </div>
                {#if entry.unit}
                    <div class="help-unit">{entry.unit}</div>
                {/if}
                <p class="help-short">{entry.short}</p>
                {#if expanded}
                    {#each entry.long as paragraph}
                        <p class="help-long">{paragraph}</p>
                    {/each}
                    <a class="help-source" href={entry.source} target="_blank" rel="noreferrer noopener">
                        Source: orc.org
                    </a>
                {:else}
                    <button type="button" class="help-more" on:click={() => (expanded = true)}>More</button>
                {/if}
            {:else}
                <p class="help-short">No description available for “{term}”.</p>
            {/if}
        </div>
    {/if}
</span>

<style>
.help {
    /* Keeps the icon on the same line as the label it annotates. */
    white-space: nowrap;
}

.help-icon {
    /* Padding gives a usable tap target without pushing the label around; the negative
       margin keeps the icon visually tight to the text it follows. */
    padding: 10px;
    margin: -10px -8px;
    border: 0;
    background: none;
    color: #aaa;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    cursor: help;
    vertical-align: super;
}
.help-icon:hover,
.help-icon:focus-visible,
.help-icon[aria-expanded='true'] {
    color: #0d6efd;
}

.help-panel {
    position: fixed;
    /* Above .plot-tooltip, which sits at 10. */
    z-index: 20;
    max-width: 22rem;
    padding: 8px 10px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.45;
    color: #212529;
    text-align: left;
    white-space: normal;
}
.help-panel:focus {
    outline: none;
}

/* On a narrow screen an anchored panel would be clamped against the viewport on nearly
   every open, so it spans the bottom of the screen instead. */
.help-panel.sheet {
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    max-width: none;
    max-height: 70vh;
    overflow-y: auto;
    border-radius: 8px 8px 0 0;
    border-bottom: 0;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.25);
    font-size: 14px;
}

.help-title {
    font-weight: 600;
}
.help-term {
    font-weight: 400;
    color: #777;
}
.help-unit {
    color: #777;
    font-style: italic;
}
.help-short,
.help-long {
    margin: 6px 0 0;
}
.help-more {
    margin-top: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: #0d6efd;
    font-size: inherit;
    cursor: pointer;
}
.help-source {
    display: inline-block;
    margin-top: 8px;
    color: #777;
    font-size: 11px;
}
</style>
