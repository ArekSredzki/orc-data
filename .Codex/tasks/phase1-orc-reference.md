# Phase 1: ORC reference - DONE

**Status**: DONE
**Started**: 2026-09-21
**Completed**: 2026-09-21

## Overview
Preserve the ORC certificate reference and display it on boat pages and in comparisons.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 1.1 | Preserve RefNo during import and backfill matching certificates | DONE |
| 1.2 | Display references on boat and comparison pages | DONE |
| 1.3 | Test and build | DONE |

## Implementation Details
### Task 1.1: Source reference - DONE
**Files:** Modified `parser/json_output.py`; created `scripts/backfill-references.py`, parser and backfill unit tests; updated matching `site/data` records.

**Summary:** Preserve RefNo as text, including leading zeros. Backfilled 7,951 records from locally available 2026 sources only where sail number, name, class, GPH, OSN and complete polars match an unambiguous reference. Older records without matching source remain unchanged.

### Task 1.2: Display - DONE
**Files:** Modified `src/components/Boat.svelte`, `src/components/Compare.svelte`; created `src/components/OrcReference.test.js`.

**Summary:** Show ORC reference alongside boat identity and in aligned comparison cells; omit unavailable references.

## Success Criteria
- [x] Reference survives import without losing leading zeros.
- [x] Both views display references with graceful missing-data handling.
- [x] Component tests, Python tests and production build pass.

## Notes
No separate typecheck command exists in this JavaScript project. Existing Svelecte accessibility/build warnings remain.
