const cache = new Map();

export function getHistory(sailnumber) {
    if (!sailnumber) return Promise.resolve({ versions: [], aliases: {} });
    if (!cache.has(sailnumber)) {
        const filename = Array.from(new TextEncoder().encode(sailnumber), (byte) =>
            byte.toString(16).padStart(2, '0'),
        ).join('');
        const request = fetch(`history/${filename}.json`)
            .then(async (response) => {
                if (response.status === 404) return { sailnumber, versions: [], aliases: {} };
                if (!response.ok) throw new Error('Certificate history could not be loaded');
                const history = await response.json();
                if (history.sailnumber !== sailnumber || !Array.isArray(history.versions))
                    throw new Error('Invalid certificate history');
                return history;
            })
            .catch((error) => {
                cache.delete(sailnumber);
                throw error;
            });
        cache.set(sailnumber, request);
    }
    return cache.get(sailnumber);
}

export function withCertificate(boat, entry) {
    if (!entry) return boat;
    const { boat: ignored, ...certificate } = entry;
    return { ...boat, certificate };
}

export async function getVersion(sailnumber, reference) {
    const history = await getHistory(sailnumber);
    const id = history.aliases?.[reference] || reference;
    const entry = history.versions.find((version) => version.id === id);
    if (!entry || entry.boat?.sailnumber !== sailnumber) throw new Error('This certificate version is not available');
    return withCertificate(entry.boat, entry);
}
