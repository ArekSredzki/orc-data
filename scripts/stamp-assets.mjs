// Stamp index.html's asset URLs with a version derived from the built files.
//
// build/index.js and build/index.css are unhashed filenames served through a CDN, and they
// have to agree: both carry Svelte's per-component scope hashes, so a browser that pairs a
// cached index.css with a freshly deployed index.js matches none of them and renders the
// page with every component style missing — no rules, no widths, no font stack, just the
// global stylesheets. That is exactly what happened on the live site after a run of quick
// deploys, and the only thing that keeps the pair together is this query string.
//
// Run automatically by `npm run build`.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const ASSETS = ['site/build/index.js', 'site/build/index.css'];
const PAGE = 'site/index.html';

const digest = createHash('sha256');
for (const asset of ASSETS) {
    digest.update(readFileSync(asset));
}
const version = digest.digest('hex').slice(0, 8);

const before = readFileSync(PAGE, 'utf8');
const after = before.replace(
    /(href|src)="(build\/index\.(?:js|css))(\?v=[a-f0-9]+)?"/g,
    (_match, attribute, path) => `${attribute}="${path}?v=${version}"`,
);

if (after === before) {
    console.log(`stamp-assets: ${PAGE} already at ?v=${version}`);
} else {
    writeFileSync(PAGE, after);
    console.log(`stamp-assets: ${PAGE} now loads its assets at ?v=${version}`);
}
