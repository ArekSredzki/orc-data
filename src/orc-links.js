let lookup;

export async function certificateUrl(reference) {
    if (!reference) return null;
    try {
        if (!lookup)
            lookup = fetch('certificate-links.json').then((response) => {
                if (!response.ok) throw new Error('Certificate links unavailable');
                return response.json();
            });
        const links = await lookup;
        const id = Object.hasOwn(links, reference) ? links[reference] : null;
        return typeof id === 'string' && /^\d+$/.test(id) ? `https://data.orc.org/public/WPub.dll/CC/${id}` : null;
    } catch {
        lookup = undefined;
        return null;
    }
}
