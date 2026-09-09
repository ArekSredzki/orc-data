import { derived, writable } from 'svelte/store';

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

export function getBoat(sailnumber) {
    if (sailnumber in cache) {
        return new Promise((resolve) => resolve(cache[sailnumber]));
    }
    // A static host answers an unknown sail number with an HTML 404 page, which parses as
    // neither JSON nor a boat. Rejecting here rather than caching the rejection matters for
    // links people keep: #print-… URLs get mailed around and outlive a yearly data refresh,
    // and a cached rejection would keep the page blank for the life of the tab.
    return fetch(`data/${sailnumber}.json`).then((response) => {
        if (!response.ok) {
            throw new Error(`No certificate for ${sailnumber} (${response.status})`);
        }
        cache[sailnumber] = response.json();
        return cache[sailnumber];
    });
}

export function getExtremes() {
    return fetch('extremes.json').then((response) => response.json());
}
