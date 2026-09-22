import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import Boat from './Boat.svelte';
import Compare from './Compare.svelte';
import fixture from '../../site/data/GER/ORC213.json';
import { getBoat, index } from '../api.js';
import App from '../App.svelte';

vi.mock('../api.js', () => ({
    getBoat: vi.fn(),
    index: writable([]),
    randomBoat: writable(null),
    getExtremes: vi.fn(),
}));
beforeEach(() => {
    // jsdom does not resolve the CSS variables used by Svelecte's virtual list.
    const getStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
        const style = getStyle(element);
        return new Proxy(style, {
            get: (target, key) => {
                if (['maxHeight', 'paddingTop', 'paddingBottom'].includes(key) && !/^\d+px$/.test(target[key]))
                    return '0px';
                return target[key];
            },
        });
    });
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
    vi.restoreAllMocks();
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

it('preserves both URL selections while the index loads', async () => {
    index.set([]);
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    await screen.findByText('001ABC');
    expect(window.location.hash).toBe('#compare-GER/A|GER/B');
    index.set(['GER/A', 'GER/B'].map((sailnumber) => ({ sailnumber, name: sailnumber, type: 'Test' })));
    await screen.findByText('002DEF');
    expect(window.location.hash).toBe('#compare-GER/A|GER/B');
});

it('updates the comparison when navigating to another comparison URL', async () => {
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    await screen.findByText('001ABC');
    window.location.hash = '#compare-GER/B|GER/A';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => {
        const row = screen.getByText('ORC reference').closest('tr');
        expect(
            within(row)
                .getAllByRole('cell')
                .map((cell) => cell.textContent.trim()),
        ).toEqual(['ORC reference', '002DEF', '001ABC']);
    });
});

it('clears boats when navigating to an empty comparison', async () => {
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    await screen.findByText('001ABC');
    window.location.hash = '#compare-';
    window.dispatchEvent(new Event('hashchange'));
    await vi.waitFor(() => expect(screen.queryByText('ORC reference')).toBeNull());
});

it('keeps the full comparison URL in the navbar link', async () => {
    window.location.hash = '#compare-GER/A|GER/B';
    render(App, { route: 'compare' });
    await screen.findByText('001ABC');
    expect(screen.getByRole('link', { name: 'Compare boats' }).getAttribute('href')).toBe('#compare-GER/A|GER/B');
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
});

it('clears only the selected side when the user removes a boat', async () => {
    window.location.hash = '#compare-GER/A|GER/B';
    const { container } = render(Compare);
    await screen.findByText('001ABC');
    expect(container.querySelector('.sv-item')).not.toBeNull();
    await fireEvent.keyDown(container.querySelector('input'), { key: 'Backspace' });
    await vi.waitFor(() => expect(window.location.hash).toBe('#compare-|GER/B'));
    expect(screen.queryByText('001ABC')).toBeNull();
    expect(screen.getByText('002DEF')).toBeDefined();
});

it('retains a URL boat even when it is missing from the search index', async () => {
    index.set([{ sailnumber: 'GER/A', name: 'A', type: 'Test' }]);
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    await screen.findByText('002DEF');
    expect(window.location.hash).toBe('#compare-GER/A|GER/B');
});

it('ignores a previous boat response after navigation', async () => {
    let resolveA;
    getBoat.mockImplementation((sailnumber) =>
        sailnumber === 'GER/A'
            ? new Promise((resolve) => {
                  resolveA = resolve;
              })
            : Promise.resolve({ ...fixture, sailnumber, reference: '002DEF' }),
    );
    window.location.hash = '#compare-GER/A|';
    render(Compare);
    await vi.waitFor(() => expect(resolveA).toBeDefined());
    window.location.hash = '#compare-GER/B|';
    window.dispatchEvent(new Event('hashchange'));
    await screen.findByText('002DEF');
    resolveA({ ...fixture, sailnumber: 'GER/A', reference: '001ABC' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText('001ABC')).toBeNull();
    expect(screen.getByText('002DEF')).toBeDefined();
});
