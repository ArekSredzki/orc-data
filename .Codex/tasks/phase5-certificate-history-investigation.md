# Phase 5: Certificate history investigation - DONE

**Status**: DONE
**Started**: 2026-10-02
**Completed**: 2026-10-02

## Overview
Investigate viewing and comparing previous certificate versions after deploying the certificate refresh and original-certificate links. This completes the investigation; the history feature is not implemented.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 5.1 | Check recoverable history in Git and ORC public services | DONE |
| 5.2 | Assess version storage and comparison UI changes | DONE |
| 5.3 | Record implementation proposal and limitations | DONE |

## Implementation Details

### Task 5.1: Recoverable history - DONE
The repository contains these distinct Off Piste rating snapshots:

| Snapshot | Reference | Issue date | GPH | Offshore ToD | Asymmetric area |
|----------|-----------|------------|-----|--------------|-----------------|
| Current | 03430005194 | 2026-10-02 | 589.6 | 573.4 | 151.81 m² |
| Previous | 03430004WVE | 2026-08-31 | 590.8 | 574.5 | 143.60 m² |
| Older Git snapshot | Unknown | Unknown | 580.0 | 565.0 | 143.60 m² |

Current and previous versions have complete, compatible polar grids and can be compared using the existing plot. The previous version is recoverable from `f20503e3b:site/data/CAN/CAN1995.json`. The older data exists in `f6119103d` (recorded in June 2025); the Git commit date must not be presented as the certificate issue date. Other commits only add fields or references to the same underlying August certificate and must not become duplicate versions.

Live query of `https://data.orc.org/public/WPub.dll?action=DownBoatRMS&RefNo=03430004WVE&ext=json` returned an empty `rms` list. ORC documents this endpoint as serving currently active certificates. Do not assume it can backfill superseded records. ORC Sailor Services explicitly offers old and current certificates searched by year, but authenticated retrieval and historical machine-readable exports have not been verified.

The current site has 19,511 on-disk boats, 8,273 with references and 8,279 with issue dates. Legacy snapshots need explicit unknown metadata. The newly added link map retains known mappings across refreshes, but cannot infer an old public page ID from a reference that has never been mapped.

Sources checked:
- https://data.orc.org/tools.php?c=pcs (active-certificate data API)
- https://orc.org/sailors/sailor-services (historical search; speed guides and target speeds use paid credits)
- Local Git history of `site/data/CAN/CAN1995.json`

### Task 5.2: Recommended implementation - DONE
1. Preserve immutable certificate snapshots before each refresh overwrites the latest boat file. Store by exact certificate reference, retaining source country, VPP year, certificate family, issue date, public page ID, and import provenance. Retain the current latest-data paths for existing links.
2. Build a compact per-boat version manifest and backfill known snapshots from Git. Scan unique file blobs and deduplicate certificate-equivalent records; adding a missing field alone is not a new certificate. Use clearly identified snapshot IDs for records without references, with unknown issue date displayed honestly.
3. Add a certificate selector on the boat page and independently on each comparison side. Include date and reference in labels, tooltips, printouts, and CSV exports so two versions of the same boat are distinguishable. Add a “Compare with previous” action.
4. Extend the shareable route to include optional reference parameters; load/cache by sail number plus certificate identity. Preserve existing URLs, browser back/forward behavior, and protection against stale async responses. A prototype route could be `#compare-CAN/CAN1995|CAN/CAN1995?refA=03430004WVE&refB=03430005194`; this syntax is not supported today.
5. Compare rating and measurement deltas alongside overlaid polars. Keep VPP year and certificate family visible, since different models or crew configurations can change ratings independently of physical changes. Do not silently interpolate incompatible polar grids for numeric deltas.

Start with the verified August/October Off Piste pair to validate the complete flow, then expand the Git backfill and future-refresh archive. No server is required for this scope: static manifests and on-demand certificate files fit the existing GitHub Pages deployment.

### Task 5.3: Constraints and validation - DONE
- Current exports are keyed by normalized sail number and overwrite earlier certificates. Export and ingestion changes are required; a UI selector alone cannot recover lost versions.
- Sail numbers and names can change or be reused. Treat existing boat-path grouping as provisional and avoid globally merging boats solely by name; anonymous generated sail numbers are especially unsafe across runs.
- Archive completeness is limited to snapshots Git or future imports captured. Never label it a complete ORC history.
- Preserve source VPP year/family going forward. Existing transformed files omit them, and a certificate issue year is not a reliable substitute for VPP year.
- Test immutable storage, deduplication, unknown metadata, same-boat two-version comparison, independent selectors, direct links/back-forward, failed lookups, stale responses, and mismatched wind grids.
- Live browser checks should cover opening each historical certificate, sharing a comparison, and retaining the selected version in print/CSV output.

## Success Criteria
- [x] Identify a concrete recoverable prior Off Piste certificate with full polars.
- [x] Check the public API against a superseded reference.
- [x] Define a static-host-compatible version model and comparison flow.
- [x] Identify incomplete history, identity ambiguity, and metadata limitations.

## Notes
No credentials, paid products, or authenticated ORC services were accessed. No historical-viewing functionality was deployed as part of this investigation.
