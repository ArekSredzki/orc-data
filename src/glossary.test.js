import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { GLOSSARY, GLOSSARY_GROUPS, glossaryAnchor, glossaryUrl } from './glossary.js';

// `test.root` in vite.config.js pins the working directory to the repo root.
const SRC = resolve('src');

function svelteFiles(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            return svelteFiles(path);
        }
        return entry.name.endsWith('.svelte') ? [path] : [];
    });
}

// Terms are referenced two ways: directly in markup as <Help term="gph" />, and
// indirectly through the row-config arrays as { help: 'gph' } with <Help term={row.help} />.
// Both are collected from the source rather than listed here, so this cannot drift out of
// date when a component adds or removes an icon.
function referencedTerms() {
    const terms = new Map();
    for (const file of svelteFiles(SRC)) {
        const source = readFileSync(file, 'utf8');
        for (const [, term] of source.matchAll(/<Help\s+term="([a-z-]+)"/g)) {
            terms.set(term, file);
        }
        for (const [, term] of source.matchAll(/\bhelp: '([a-z-]+)'/g)) {
            terms.set(term, file);
        }
    }
    return terms;
}

describe('glossary', () => {
    it('has every entry filed in exactly one group', () => {
        const grouped = GLOSSARY_GROUPS.flatMap((group) => group.keys);

        expect(grouped.slice().sort()).toEqual(Object.keys(GLOSSARY).sort());
        expect(new Set(grouped).size).toBe(grouped.length);
    });

    it('cites a source for every entry', () => {
        for (const [key, entry] of Object.entries(GLOSSARY)) {
            expect(entry.source, `${key} has no source`).toMatch(/^https:\/\/orc\.org\//);
        }
    });

    it('resolves every term referenced by a component', () => {
        const referenced = referencedTerms();

        expect(referenced.size).toBeGreaterThan(0);
        for (const [term, file] of referenced) {
            expect(GLOSSARY[term], `${file} references unknown glossary term "${term}"`).toBeDefined();
        }
    });

    it('builds anchors that match the links pointing at them', () => {
        expect(glossaryUrl('gph')).toBe(`#${glossaryAnchor('gph')}`);
        // The route branch matches on the `glossary` prefix, so deep links must keep it.
        expect(glossaryUrl('gph').substring(1).startsWith('glossary')).toBe(true);
    });
});
