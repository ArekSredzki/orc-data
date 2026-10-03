# Phase 4: Original ORC certificate links - IN_PROGRESS

**Status**: IN_PROGRESS
**Started**: 2026-10-02

## Overview
Link ORC references to original public certificates, provide related ORC resources, and deploy the refreshed certificates and UI.

## Tasks
| ID | Task | Status |
|----|------|--------|
| 4.1 | Map ORC references to published certificate page IDs | DONE |
| 4.2 | Link references on boat and comparison pages | DONE |
| 4.3 | Test, merge, deploy, and verify production | IN_PROGRESS |

## Implementation Details

### Task 4.1: Public certificate URLs - DONE
**Files:** Created `scripts/certificate-links.py`, `scripts/test_certificate_links.py`, `site/certificate-links.json`; modified `Makefile`.

**Summary:** Read the ORC active certificate XML feeds and map exact RefNo values to their published dxtID. Refresh links with `make site`, retain known historical mappings, and preserve the existing file if a download fails. Do not infer IDs from sail numbers. Off Piste reference `03430005194` maps to `https://data.orc.org/public/WPub.dll/CC/264191`.

### Task 4.2: Reference UI - DONE
**Files:** Created `src/orc-links.js`, `src/orc-links.test.js`, `src/components/OrcReference.svelte`; modified Boat, Compare, and reference component tests.

**Summary:** Lazy-load and share the certificate map. Link each available reference to its exact public certificate in a new tab. Missing IDs remain readable; failed map requests can retry. Boat pages link to official speed-guide information and Sailor Services, noting that login and payment may be required. No public boat-specific speed-guide URL was found.

## Success Criteria
- [x] Off Piste points to public certificate 264191.
- [x] Boat and comparison references link to their respective certificates.
- [x] Missing references, missing IDs, and failed requests are handled.
- [ ] Unit tests, lint, production build, and browser verification pass.
- [ ] Deployment verified on the public site.

## Notes
Sources: https://data.orc.org/active and its `public/activecerts.xsl` stylesheet; https://orc.org/sailors/sailor-services/speed-guides; https://orc.org/sailors/sailor-services.
