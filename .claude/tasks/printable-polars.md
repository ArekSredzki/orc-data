# Printable polar tables - DONE

**Status**: DONE
**Started**: 2026-09-09
**Completed**: 2026-09-09

## Overview

A `#print-<sailnumber>` route that turns a boat's VPP into paper: a full-fidelity
nav-station sheet, or a cockpit target card printed 1, 2 or 4 to a sheet with cut guides.
Printing a boat page previously produced the navbar, the CSV textarea and a table too small
to read at arm's length.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 1 | `@media print` on the existing boat page | DONE |
| 2 | `polar-rows.js` row model, shared with `PolarTable.svelte` | DONE |
| 3 | `PolarCard.svelte` - the printed piece | DONE |
| 4 | `PrintView.svelte`, routing, error handling, entry point | DONE |
| 5 | Paper geometry, N-up tiling, cut guides | DONE |
| 6 | Options, hash encoding, option gating from the fit calculation | DONE |

## Implementation Details

**Created:** `src/polar-rows.js`, `src/print-paper.js`, `src/boat-meta.js`,
`src/components/PolarCard.svelte`, `src/components/PrintView.svelte`, plus tests for each.
**Modified:** `src/App.svelte` (route, `d-print-none`, `DATA_YEAR`),
`src/components/PolarTable.svelte` (refactored onto the shared model),
`src/components/Boat.svelte` (entry point, shared certificate helpers), `src/api.js`
(`response.ok`, no cached rejections), `src/components/Help.svelte`,
`src/components/PolarPlot.svelte` (hidden when printing).

## Decisions worth remembering

- **Type size is computed, not measured.** `cardFontSizePt()` derives body type from the
  card's size, the column count and the widest value, using per-size ceilings and a hard
  8pt floor. jsdom has no layout engine and print has no resize event, so measuring was
  never an option; the constants are calibrated against the rendered card and noted as such
  in the source.
- **The fit calculation gates the option matrix.** Combinations that cannot reach 8pt are
  disabled in the toolbar ("2 too small"), rather than printed illegibly.
- **Column count varies** - 9 wind speeds for 55% of certificates, 7 for 38%, 8 for 7%.
  Everything is driven by the certificate rather than the familiar 7-column shape.
- **Structure lives in rules, not backgrounds.** Every browser ships with background
  graphics off in the print dialog, so tints are redundant decoration and the cut guides
  are ruled lines.
- `bind:clientWidth` is unusable here: Svelte 4 implements it with an injected `<iframe>`
  that overflows the page box. `PrintView` observes its own container, as `PolarPlot` does.
- The sheet is 1mm shy of the page box; sized to exactly the box, sub-pixel rounding spills
  a blank second page.

## Success Criteria
- [x] Full sheet and targets card, both honouring the certificate's wind speeds
- [x] Letter, A4, A5; portrait and landscape; 1, 2 and 4 cards per sheet with cut guides
- [x] Every combination prints to exactly one page at the right paper size (verified by PDF)
- [x] Corrupt certificate values masked; DDW instead of a 179 deg gybing angle
- [x] Provenance, units and the VPP caveat on every printed piece
- [x] 48 unit and component tests pass; eslint clean

## Notes

Deferred: a printable polar diagram (the user judged it unlikely to be printed; it would be
built standalone on `VppCurves.svelte`, never by refactoring `PolarPlot`), 8-up pocket cards
(measured at 6.8pt, below the legibility floor), and A6/4x6 as direct paper sizes.

Out of scope, noticed while working: `PolarPlot.svelte` scales its radial axis off the
corrupt 155.84 kt value in `FRA/FRA9786`, rendering that boat's diagram as a dot.
