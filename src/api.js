import { derived, writable } from 'svelte/store';

import { getHistory, getVersion, withCertificate } from './history-api.js';
import { getRandomElement } from './util.js';

export const index = writable([]);
export const indexSize = derived(index, (_index) => index.length);

fetch('index.json')
    .then((response) => response.json())
    .then((items) => {
        index.set(items.map(([sailnumber, name, type]) => ({ sailnumber, name, type })));
    });

export const randomBoat = derived(index, (_index) => {
    if (_index.length === 0) {
        return null;
    }
    return getRandomElement(_index).sailnumber;
});

let cache = {};

export async function getBoat(sailnumber, reference = '') {
    if (reference) return getVersion(sailnumber, reference);
    if (!cache[sailnumber]) {
        cache[sailnumber] = fetch(`data/${sailnumber}.json`)
            .then((response) => {
                if (!response.ok) throw new Error(`No certificate for ${sailnumber} (${response.status})`);
                return response.json();
            })
            .catch((error) => {
                delete cache[sailnumber];
                throw error;
            });
    }
    const boat = await cache[sailnumber];
    try {
        const history = await getHistory(sailnumber);
        const entry = history.versions.find((entry) => entry.id === history.latest);
        // Do not label stale cached latest data with another certificate's identity.
        const matches =
            entry &&
            entry.reference === (boat.reference || null) &&
            entry.boat.sailnumber === boat.sailnumber &&
            entry.boat.rating.gph === boat.rating.gph &&
            entry.boat.rating.osn === boat.rating.osn &&
            Object.entries(boat.vpp).every(
                ([key, values]) => JSON.stringify(values) === JSON.stringify(entry.boat.vpp[key]),
            );
        return matches ? withCertificate(boat, entry) : boat;
    } catch {
        return boat; // History availability must not prevent viewing the latest export.
    }
}

export function getExtremes() {
    return fetch('extremes.json').then((response) => response.json());
}
