# Phase 2: Comparison navigation - DONE

**Status**: DONE
**Started**: 2026-09-21
**Completed**: 2026-09-21

## Overview
Keep both comparison sail numbers in the URL and keep displayed boats synchronized with navigation.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 2.1 | Reproduce URL/navigation failures | DONE |
| 2.2 | Separate URL selection from widget initialization | DONE |
| 2.3 | Verify navigation and production build | DONE |

## Implementation Details
### Task 2.1: Investigation - DONE
Comparison state was read only on mount, while reactive writes could publish values cleared by selector initialization. The navbar link also reset an active comparison to an empty comparison URL. Clearing a selection left its previous boat data visible; asynchronous responses could overwrite later selections.

### Task 2.2: Fix - DONE
**Files:** Modified `src/components/Compare.svelte`, `src/components/BoatSelect.svelte`, `src/App.svelte`.

**Summary:** Read selections on hash changes, write the hash only on explicit selector changes, preserve requested selector values during index loading, keep the navbar link pointed at the full active comparison, hide its redundant global selector, clear removed boat data, and ignore responses for superseded selections.

### Task 2.3: Validation - DONE
**Files:** Expanded `src/components/OrcReference.test.js`; rebuilt tracked site assets.

**Summary:** Regression coverage includes delayed/missing index entries, changing comparison URLs, clearing all or one selection, navbar URLs, and stale asynchronous responses.

## Success Criteria
- [x] Both sail numbers survive selector initialization.
- [x] Hash navigation updates displayed boats.
- [x] Clearing one side preserves the other.
- [x] Navbar preserves the full active comparison.
- [x] All 75 JavaScript tests, Python tests, ESLint and production build pass.

## Notes
No standalone typecheck is configured. Production compilation validates Svelte components. Existing dependency accessibility warnings remain.
