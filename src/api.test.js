import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { getHistory, getVersion } from './history-api.js';

vi.mock('./history-api.js', () => ({
    getHistory: vi.fn(),
    getVersion: vi.fn(),
    withCertificate: (boat, entry) => ({ ...boat, certificate: entry }),
}));
const boat = {
    sailnumber: 'CAN/A',
    reference: null,
    rating: { gph: 600, osn: 570 },
    vpp: { angles: [90], speeds: [6], 90: [5] },
};
beforeEach(() => {
    vi.resetModules();
    getHistory.mockResolvedValue({ versions: [] });
});
afterEach(() => vi.unstubAllGlobals());
function mockFetch(handler) {
    vi.stubGlobal(
        'fetch',
        vi.fn((url) => (url === 'index.json' ? Promise.resolve({ json: async () => [] }) : handler(url))),
    );
}

it('retries a failed latest request and still loads latest when history is unavailable', async () => {
    const request = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({ ok: true, json: async () => boat });
    mockFetch(request);
    getHistory.mockRejectedValue(new Error('offline'));
    const { getBoat } = await import('./api.js');
    await expect(getBoat('CAN/A')).rejects.toThrow();
    expect(await getBoat('CAN/A')).toEqual(boat);
    expect(request).toHaveBeenCalledTimes(2);
});
it('never falls back to current data for an unavailable historical reference', async () => {
    const request = vi.fn();
    mockFetch(request);
    getVersion.mockRejectedValue(new Error('not available'));
    const { getBoat } = await import('./api.js');
    await expect(getBoat('CAN/A', 'missing')).rejects.toThrow('not available');
    expect(request).not.toHaveBeenCalled();
});
it('does not label a cached legacy boat with another snapshot having the same GPH', async () => {
    mockFetch(async () => ({ ok: true, json: async () => boat }));
    getHistory.mockResolvedValue({
        latest: 'new',
        versions: [{ id: 'new', reference: null, boat: { ...boat, vpp: { ...boat.vpp, 90: [6] } } }],
    });
    const { getBoat } = await import('./api.js');
    expect((await getBoat('CAN/A')).certificate).toBeUndefined();
});
