import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

it('loads once and links the exact reference to its ORC certificate page', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ '03430005194': '264191' }) });
    vi.stubGlobal('fetch', fetch);
    const { certificateUrl } = await import('./orc-links.js');
    expect(await certificateUrl('03430005194')).toBe('https://data.orc.org/public/WPub.dll/CC/264191');
    expect(await certificateUrl('missing')).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
});

it('does not fabricate a certificate link for missing or malformed IDs', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bad: '../other' }) });
    vi.stubGlobal('fetch', fetch);
    const { certificateUrl } = await import('./orc-links.js');
    expect(await certificateUrl(null)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(await certificateUrl('bad')).toBeNull();
});

it('retries a failed lookup without breaking the boat page', async () => {
    vi.stubGlobal(
        'fetch',
        vi
            .fn()
            .mockResolvedValueOnce({ ok: false })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ ref: '123' }) }),
    );
    const { certificateUrl } = await import('./orc-links.js');
    expect(await certificateUrl('ref')).toBeNull();
    expect(await certificateUrl('ref')).toBe('https://data.orc.org/public/WPub.dll/CC/123');
});
