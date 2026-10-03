# Phase 6: Certificate history - IN_PROGRESS

**Status**: IN_PROGRESS
**Started**: 2026-10-02

## Overview
Preserve certificate versions across refreshes, recover historical snapshots from Git, and support viewing, sharing, printing, exporting, and comparing specific versions.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 6.1 | Archive imports and backfill Git snapshots | DONE |
| 6.2 | Add independent certificate selectors and version URLs | DONE |
| 6.3 | Preserve versions in print/CSV and display comparison changes | DONE |
| 6.4 | Validate data, tests, browser flows, merge and deploy | IN_PROGRESS |

## Implementation Details

### Task 6.1: Archive - DONE
**Files:** Created `parser/history.py`, `parser/test_history.py`, `scripts/backfill-history.py`, and `site/history/*.json`; modified `parser/json_output.py` and `scoring.py`.

**Summary:** Archive old and incoming certificates before replacing latest boat files. Store per-sail-number bundles with exact references, stable snapshot IDs, aliases for metadata-only enrichment, issue dates, source VPP year/family where available, and observation provenance. UTF-8 hex filenames avoid path traversal and case collisions. Reference conflicts fail instead of replacing archived measurements. Anonymous generated sail numbers are excluded from grouping. The backfill scans unique Git blobs through one batch process and is rerunnable.

Backfill: 135,268 unique Git records produced 91,131 versions for 33,089 sail numbers; 21,075 bundles have multiple versions, including historical sail numbers no longer in the latest search index. Off Piste has October and August 2026 certificates plus an older snapshot saved in 2025 with unknown issue date.

### Task 6.2: Viewing and comparison - DONE
**Files:** Created `src/history-api.js`, `src/certificate-history.js`, `src/components/CertificateSelect.svelte` and tests; modified `src/api.js`, `src/App.svelte`, Boat, Compare and component tests.

**Summary:** Keep latest URLs compatible. Pin a boat with `?ref=<id>` and comparison sides with `?refA=<id>&refB=<id>`. Version requests never fall back silently to latest. Handle missing history, failed requests, stale responses, aliases, and browser navigation. “Compare with previous certificate” pins both sides. Selectors label unknown dates honestly and explain archive incompleteness and sail-number reuse.

### Task 6.3: Identity and deltas - DONE
**Files:** Modified PolarPlot, PrintView, PolarCard and polar CSV export; added CSV regression tests.

**Summary:** Show B-minus-A changes for numeric ratings and measurements, display VPP year/family, and identify differing wind grids without interpolating numeric polar deltas. Preserve selected versions in print links, print options, back links, printed identities, plot tooltips, and CSV comments. CSV still begins with `twa/tws` and round trips through the importer.

## Success Criteria
- [x] Previous certificates survive refreshes and repeated imports.
- [x] Off Piste August and October versions can be selected independently.
- [x] Version selection survives direct URLs, navigation, print, and CSV export.
- [x] Missing versions do not silently display a newer certificate.
- [x] Archive integrity, unit tests, lint, build, and browser flows verified.
- [ ] Merge completeness and production deployment verified.

## Notes
Historical issue dates and VPP years are never inferred from commit dates. Existing search remains the latest boat catalog; deleted historical sail numbers are retained in the archive but not added back to the catalog. No paid or authenticated ORC data was fetched. The public ORC link map is retained separately and only supplies verified public page IDs.

Local validation: all 97 JavaScript tests, 14 Python tests, ESLint, and production build pass. Reusable Playwright checks in `scripts/check-history-browser.mjs` pass against the local build, including mobile viewport containment. All 33,089 bundles have valid unique IDs/aliases and boat identities; all 19,467 current named records match their archived latest certificate. Archive payload size is 117.9 MiB; the largest bundle is 23,608 bytes. Existing Svelte/Svelecte build warnings remain. No standalone typecheck is configured.
