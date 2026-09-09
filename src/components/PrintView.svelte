<script>
import { onMount } from 'svelte';

import PolarCard from './PolarCard.svelte';
import { getBoat } from '../api.js';
import { cardFontSizePt, polarCard, polarSheet, sheetRowCount, widestValueEm } from '../polar-rows.js';
import {
    CARD_MARGIN_MM,
    cardGeometry,
    SHEET_TOLERANCE_MM,
    defaultPaper,
    PAGE_MARGIN_MM,
    PAPERS,
    pageRule,
    PER_SHEET,
    pageSize,
    printOptions,
} from '../print-paper.js';

// One-way from the router. Binding it would let App's own reactive statement rewrite the
// hash to the bare sail number and bounce the reader off this page.
export let sailnumber = null;

const STORAGE_KEY = 'orc-print-options';
const MM_PER_PX = 25.4 / 96;

let boat = null;
let error = null;
let loadedFor = null;

let options = {
    layout: 'card',
    paper: defaultPaper(typeof navigator === 'undefined' ? undefined : navigator.language),
    orientation: 'portrait',
    perSheet: 2,
    awa: true,
    vmg: false,
    beatRun: true,
    fullRange: false,
    colour: 'mono',
};

// The hash is the shareable form, so it wins over whatever this browser used last. Both
// are untrusted — one is a URL, the other is whatever is sitting in this browser's storage
// — so they are filtered against the values the UI actually offers.
onMount(() => {
    let stored;
    try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
        stored = null;
    }
    options = printOptions(options, stored, optionsFromHash());
    ready = true;
});

// The @page rule cannot be written in markup: a <style> tag inside <svelte:head> is taken
// as component CSS, and custom properties do not resolve in the page context, so the rule
// has to be literal text. Setting textContent rather than rendering {@html} means the
// paper and orientation can never be parsed as markup, whatever they contain.
onMount(() => {
    const element = document.createElement('style');
    document.head.appendChild(element);
    pageStyle = element;
    return () => element.remove();
});

let pageStyle;
$: if (pageStyle) {
    pageStyle.textContent = pageRule(options.paper, options.orientation);
}

let ready = false;

function optionsFromHash() {
    const query = window.location.hash.split('?')[1];
    if (!query) {
        return {};
    }
    const params = new URLSearchParams(query);
    const parsed = {};
    for (const [key, value] of params) {
        if (key === 'perSheet') {
            parsed[key] = Number(value);
        } else if (['awa', 'vmg', 'beatRun', 'fullRange'].includes(key)) {
            parsed[key] = value === '1';
        } else {
            parsed[key] = value;
        }
    }
    return parsed;
}

// replaceState rather than assigning location.hash: the options are not history entries,
// and rewriting the hash would re-run the router for a route that has not changed.
function persist(options, perSheet) {
    if (!ready || !sailnumber) {
        return;
    }
    const params = new URLSearchParams({
        layout: options.layout,
        paper: options.paper,
        orientation: options.orientation,
        perSheet: String(perSheet),
        awa: options.awa ? '1' : '0',
        vmg: options.vmg ? '1' : '0',
        beatRun: options.beatRun ? '1' : '0',
        fullRange: options.fullRange ? '1' : '0',
        colour: options.colour,
    });
    window.history.replaceState(null, '', `#print-${sailnumber}?${params}`);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
        // Private browsing: the preference simply does not stick.
    }
}

async function load(sailnumber) {
    loadedFor = sailnumber;
    error = null;
    try {
        boat = await getBoat(sailnumber);
    } catch {
        boat = null;
        error = sailnumber;
    }
}

$: if (sailnumber && sailnumber !== loadedFor) {
    load(sailnumber);
}
$: persist(options, perSheet);

// The row model is built here as well as inside the card because the type size has to be
// known before the card renders — it depends on how many wind speeds this particular
// certificate carries.
// The sheet always carries whatever wind speeds the certificate has; the card trims to
// 6–20 kt unless asked for the lot, because the 4 kt column is not something anyone steers
// to and it costs a row of type size.
$: rowOptions =
    options.layout === 'sheet'
        ? { awa: options.awa, vmg: options.vmg, beatRun: options.beatRun }
        : { awa: options.awa, vmg: options.vmg, ...(options.fullRange ? { range: null } : {}) };
$: model = boat
    ? options.layout === 'sheet'
        ? polarSheet(boat.vpp, rowOptions)
        : polarCard(boat.vpp, rowOptions)
    : null;
$: columns = model ? (options.layout === 'sheet' ? model.columns : model.columns.length) : 0;
$: bodyRows = model ? (options.layout === 'sheet' ? sheetRowCount(model) : model.rows.length) : 0;
// Measured from the values themselves, so a card carrying "DDW" gets the width it needs.
$: valueEm = model ? widestValueEm(model) : null;

$: page = pageSize(options.paper, options.orientation);
$: geometry = cardGeometry(options.paper, options.orientation, perSheet);
$: fit = model
    ? cardFontSizePt({
          cardWmm: geometry.w,
          cardHmm: geometry.h,
          columns,
          bodyRows,
          valueEm,
          layout: options.layout,
      })
    : { pt: 10, allowed: true };

// Which cards-per-sheet values this layout can carry on this paper at a readable size.
// Combinations that cannot are disabled rather than warned about: a warning invites
// printing something illegible.
$: allowedPerSheet = model
    ? PER_SHEET.filter((perSheet) => {
          const candidate = cardGeometry(options.paper, options.orientation, perSheet);
          return cardFontSizePt({
              cardWmm: candidate.w,
              cardHmm: candidate.h,
              columns,
              bodyRows,
              valueEm,
              layout: options.layout,
          }).allowed;
      })
    : PER_SHEET;

// The choice in force, which is not always the one last clicked: switching to the full
// sheet, or to smaller paper, can make four-up unprintable. Derived rather than written
// back into `options`, because assigning to it here would make the row model depend on
// itself.
$: perSheet = allowedPerSheet.includes(options.perSheet)
    ? options.perSheet
    : allowedPerSheet[allowedPerSheet.length - 1] || 1;

$: tiles = Array.from({ length: geometry.cols * geometry.rows }, (_, i) => i);
// Interior trim lines only. The outer edge of the sheet is the page margin, not something
// to cut along. Drawing them as overlaid lines rather than tile borders keeps them exactly
// on the halves and quarters whatever the grid is.
$: guideCols = Array.from({ length: geometry.cols - 1 }, (_, i) => ((i + 1) / geometry.cols) * 100);
$: guideRows = Array.from({ length: geometry.rows - 1 }, (_, i) => ((i + 1) / geometry.rows) * 100);

// Preview scaling. The paper is drawn at its real size and then scaled down to fit the
// column; the wrapper's height has to follow, because a transform does not affect layout
// and would otherwise leave a page-sized hole under the preview.
//
// Measured with a ResizeObserver rather than `bind:clientWidth`, which Svelte implements by
// injecting a sized <iframe> into the element. That iframe overflows the page box and puts
// a blank second sheet in every print — the same reason PolarPlot.svelte observes its own
// container by hand.
let groundWidth = 800;

// An action rather than onMount, because the element only exists once the boat has loaded.
function measureWidth(node) {
    const observer = new ResizeObserver((entries) => {
        groundWidth = entries[0].contentRect.width;
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
}
$: pagePx = page.w / MM_PER_PX;
$: zoom = Math.max(0.1, Math.min(1, (groundWidth - 48) / pagePx));
$: previewHeight = (page.h / MM_PER_PX) * zoom;
</script>

{#if error}
    <div class="container p-4">
        <h1 class="h4">Couldn't load {error}</h1>
        <p class="text-muted">
            The certificate may have been withdrawn, or the sail number may have changed since this link was made.
        </p>
        <a href="#extremes">Back to the boat list</a>
    </div>
{:else if boat}
    <div class="print-page">
        <div class="toolbar d-print-none">
            <a class="back" href="#{boat.sailnumber}">← {boat.name || boat.sailnumber}</a>

            <fieldset>
                <legend>Layout</legend>
                <label><input type="radio" bind:group={options.layout} value="card" /> Targets card</label>
                <label><input type="radio" bind:group={options.layout} value="sheet" /> Full sheet</label>
            </fieldset>

            <fieldset>
                <legend>Paper</legend>
                {#each Object.entries(PAPERS) as [key, paper]}
                    <label><input type="radio" bind:group={options.paper} value={key} /> {paper.label}</label>
                {/each}
                <label><input type="radio" bind:group={options.orientation} value="portrait" /> Portrait</label>
                <label><input type="radio" bind:group={options.orientation} value="landscape" /> Landscape</label>
            </fieldset>

            <fieldset>
                <legend>Cards per sheet</legend>
                {#each PER_SHEET as choice}
                    <label class:disabled={!allowedPerSheet.includes(choice)}>
                        <input
                            type="radio"
                            name="per-sheet"
                            value={choice}
                            checked={perSheet === choice}
                            disabled={!allowedPerSheet.includes(choice)}
                            on:change={() => (options.perSheet = choice)} />
                        {choice}
                        {#if !allowedPerSheet.includes(choice)}<span class="why">too small</span>{/if}
                    </label>
                {/each}
            </fieldset>

            <fieldset>
                <legend>Rows</legend>
                <label><input type="checkbox" bind:checked={options.awa} /> Apparent wind angles</label>
                <label><input type="checkbox" bind:checked={options.vmg} /> VMG</label>
                {#if options.layout === 'sheet'}
                    <label><input type="checkbox" bind:checked={options.beatRun} /> Beat and run blocks</label>
                {:else}
                    <label><input type="checkbox" bind:checked={options.fullRange} /> All wind speeds</label>
                {/if}
            </fieldset>

            <fieldset>
                <legend>Ink</legend>
                <label><input type="radio" bind:group={options.colour} value="mono" /> Monochrome</label>
                <label><input type="radio" bind:group={options.colour} value="tint" /> Wind-speed tint</label>
                <label><input type="radio" bind:group={options.colour} value="screen" /> Match plot colours</label>
            </fieldset>

            <div class="actions">
                <button class="btn btn-primary btn-sm" on:click={() => window.print()}>Print</button>
                <p class="hint">
                    Body type {fit.pt.toFixed(1)} pt. In the print dialog choose {PAPERS[options.paper].label}, set
                    margins to None, and switch background graphics on.
                </p>
            </div>
        </div>

        <div class="ground" use:measureWidth>
            <div class="preview" style="height: {previewHeight}px">
                <div
                    class="paper"
                    style="width: {page.w}mm; height: {page.h}mm; padding: {PAGE_MARGIN_MM}mm; --zoom: {zoom}">
                    <div
                        class="sheet"
                        style="grid-template-columns: repeat({geometry.cols}, 1fr); grid-template-rows: repeat({geometry.rows}, 1fr); height: calc({geometry.rows *
                            geometry.h}mm - {SHEET_TOLERANCE_MM}mm)">
                        {#each tiles as tile (tile)}
                            <div class="tile" style="padding: {CARD_MARGIN_MM}mm">
                                <PolarCard
                                    {boat}
                                    layout={options.layout}
                                    options={rowOptions}
                                    fontPt={fit.pt}
                                    colour={options.colour} />
                            </div>
                        {/each}
                        {#each guideCols as left}
                            <div class="guide vertical" style="left: {left}%"></div>
                        {/each}
                        {#each guideRows as top}
                            <div class="guide horizontal" style="top: {top}%"></div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
.print-page {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

/* A left rail rather than a top bar: the hero is a tall sheet of paper, and a toolbar
   across the top would take the vertical space the preview needs. */
.toolbar {
    flex: 0 0 15rem;
    padding: 0.75rem;
    border-right: 1px solid #ddd;
    position: sticky;
    top: 0;
    font-size: 0.875rem;
}
.back {
    display: block;
    margin-bottom: 0.75rem;
}
fieldset {
    margin-bottom: 0.75rem;
}
legend {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #777;
    margin-bottom: 0.15rem;
}
label {
    display: block;
    line-height: 1.5;
}
label.disabled {
    color: #aaa;
}
.why {
    font-size: 0.75rem;
    color: #aaa;
}
.actions {
    margin-top: 1rem;
}
.hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #777;
}

.ground {
    flex: 1 1 auto;
    min-width: 0;
    background: #d9d9d9;
    padding: 1.5rem 0;
}
.preview {
    display: flex;
    justify-content: center;
}
.paper {
    box-sizing: border-box;
    background: #fff;
    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.1),
        0 8px 24px rgba(0, 0, 0, 0.16);
    transform: scale(var(--zoom));
    transform-origin: top center;
}
.sheet {
    display: grid;
    position: relative;
    width: 100%;
}
.tile {
    box-sizing: border-box;
    overflow: hidden;
}
/* Cut guides are ruled lines rather than backgrounds, because every browser ships with
   background graphics switched off in the print dialog. They run the full width or height
   of the sheet: these get cut with scissors against a ruler, not trimmed on a guillotine,
   so a continuous line beats corner marks. */
.guide {
    position: absolute;
    pointer-events: none;
}
.guide.vertical {
    top: 0;
    bottom: 0;
    border-left: 0.3pt solid #b3b3b3;
}
.guide.horizontal {
    left: 0;
    right: 0;
    border-top: 0.3pt solid #b3b3b3;
}

@media print {
    .print-page {
        display: block;
    }
    .ground {
        background: none;
        padding: 0;
    }
    .preview {
        display: block;
        height: auto !important;
    }
    /* The page box supplies the paper and the margin now, so the preview's own paper
       framing has to go — including the scale transform, which would otherwise print the
       sheet at preview size. */
    .paper {
        width: auto !important;
        height: auto !important;
        padding: 0 !important;
        box-shadow: none;
        transform: none;
    }
    .sheet {
        width: 100%;
    }
}
</style>
