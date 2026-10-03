import { afterEach, expect, it, vi } from 'vitest';
const history = {
    sailnumber: 'CAN/A',
    latest: 'new',
    aliases: { 'snapshot-1': 'old' },
    versions: [
        { id: 'old', reference: 'old', boat: { sailnumber: 'CAN/A', rating: { gph: 600 } } },
        { id: 'new', reference: 'new', boat: { sailnumber: 'CAN/A', rating: { gph: 590 } } },
    ],
};
afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});
it('loads independent versions and resolves legacy aliases from one archive request', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => history });
    vi.stubGlobal('fetch', fetch);
    const { getVersion, getHistory } = await import('./history-api.js');
    expect((await getVersion('CAN/A', 'old')).rating.gph).toBe(600);
    expect((await getVersion('CAN/A', 'new')).rating.gph).toBe(590);
    expect((await getVersion('CAN/A', 'snapshot-1')).certificate.id).toBe('old');
    expect(await getHistory('CAN/A')).toEqual(history);
    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(getVersion('CAN/A', 'missing')).rejects.toThrow('not available');
});
it('retries failures and treats only 404 as no archive', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce({ ok: false, status: 404 }),
    );
    const { getHistory } = await import('./history-api.js');
    await expect(getHistory('CAN/A')).rejects.toThrow();
    expect((await getHistory('CAN/A')).versions).toEqual([]);
});
it('rejects certificates that belong to a different sail number', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => history }));
    const { getVersion } = await import('./history-api.js');
    await expect(getVersion('CAN/B', 'old')).rejects.toThrow();
});
