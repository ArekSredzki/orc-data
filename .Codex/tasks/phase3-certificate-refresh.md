# Phase 3: Certificate refresh - DONE

**Status**: DONE
**Started**: 2026-10-02
**Completed**: 2026-10-02

## Overview
Refresh the current 2026 ORC certificates, including the new Off Piste certificate.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 3.1 | Download all configured country feeds and regenerate certificate data | DONE |
| 3.2 | Verify Off Piste and all exported records against downloaded feeds | DONE |
| 3.3 | Run unit tests, lint, and production build | DONE |

## Implementation Details

### Task 3.1: Refresh - DONE
**Files:** Modified `ALL2026.json`, `orc-data.json`, `site/data/**/*.json`, `site/index.json`, and `site/extremes.json`.

**Summary:** Downloaded fresh 2026 data from all 41 configured country feeds over HTTPS, validated every response as JSON, and imported 8,437 records using the existing exporters. Historical boats remain searchable. Source downloads remain in ignored `data/2026/`.

### Task 3.2: Off Piste - DONE
**Files:** Modified `site/data/CAN/CAN1995.json` and aggregate exports.

**Summary:** Confirmed reference `03430005194`, issued `2026-10-02T17:09:34.241Z`, replaces reference `03430004WVE`. GPH is 589.6 and offshore single number is 573.4. Verified exported certificate fields and polars against the source, aggregate consistency, and search index coverage.

### Task 3.3: Validation - DONE
**Summary:** All 75 JavaScript tests and both Python tests pass; ESLint and production build pass. No standalone typecheck is configured. Existing Svelte/dependency warnings remain. Build output is unchanged after excluding worktree-specific dependency source-map paths.

## Success Criteria
- [x] All configured country feeds downloaded and parsed successfully.
- [x] New Off Piste certificate appears in individual and aggregate data.
- [x] Imported certificates match source data and are searchable.
- [x] Tests, lint, and production build pass.

## Notes
This is a data refresh; application behavior and historical certificate retention are unchanged.
