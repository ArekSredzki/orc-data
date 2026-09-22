import { cleanup, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { writable } from 'svelte/store';
import Boat from './Boat.svelte';
import Compare from './Compare.svelte';
import fixture from '../../site/data/GER/ORC213.json';
import { getBoat, index } from '../api.js';

vi.mock('../api.js', () => ({ getBoat: vi.fn(), index: writable([]) }));
beforeEach(() => {
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe() {}
            disconnect() {}
        },
    );
    index.set(['GER/A', 'GER/B'].map((sailnumber) => ({ sailnumber, name: sailnumber, type: 'Test' })));
    getBoat.mockImplementation(async (sailnumber) => ({
        ...fixture,
        sailnumber,
        reference: sailnumber === 'GER/A' ? '001ABC' : '002DEF',
    }));
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.location.hash = '';
});

it('shows the certificate reference on the boat page, preserving leading zeros', async () => {
    render(Boat, { sailnumber: 'GER/A' });
    expect(await screen.findByText('001ABC')).toBeDefined();
    expect(screen.getByText('ORC reference')).toBeDefined();
});
it('omits the boat reference when unavailable', async () => {
    getBoat.mockResolvedValue(fixture);
    render(Boat, { sailnumber: fixture.sailnumber });
    await screen.findByText(fixture.name);
    expect(screen.queryByText('ORC reference')).toBeNull();
});
it('aligns references with their respective comparison boats', async () => {
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    const label = await screen.findByText('ORC reference');
    const cells = within(label.closest('tr')).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent.trim())).toEqual(['ORC reference', '001ABC', '002DEF']);
});
it('leaves a missing comparison reference blank', async () => {
    getBoat.mockImplementation(async (sailnumber) => ({
        ...fixture,
        sailnumber,
        reference: sailnumber === 'GER/A' ? '001ABC' : null,
    }));
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    const label = await screen.findByText('ORC reference');
    expect(
        within(label.closest('tr'))
            .getAllByRole('cell')
            .map((cell) => cell.textContent.trim()),
    ).toEqual(['ORC reference', '001ABC', '']);
});
