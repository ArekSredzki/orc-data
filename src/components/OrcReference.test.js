import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import Boat from './Boat.svelte';
import Compare from './Compare.svelte';
import PrintView from './PrintView.svelte';
import fixture from '../../site/data/GER/ORC213.json';
import { getBoat, index } from '../api.js';
import App from '../App.svelte';
import { getHistory } from '../history-api.js';
import { certificateUrl } from '../orc-links.js';

vi.mock('../history-api.js', () => ({ getHistory: vi.fn() }));

vi.mock('../orc-links.js', () => ({ certificateUrl: vi.fn() }));

vi.mock('../api.js', () => ({
    getBoat: vi.fn(),
    index: writable([]),
    randomBoat: writable(null),
    getExtremes: vi.fn(),
}));
beforeEach(() => {
    getHistory.mockResolvedValue({ versions: [], aliases: {} });
    certificateUrl.mockImplementation(async (reference) =>
        reference ? `https://data.orc.org/public/WPub.dll/CC/${reference === '001ABC' ? '123' : '456'}` : null,
    );
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
    expect((await screen.findByRole('link', { name: '001ABC' })).getAttribute('href')).toBe(
        'https://data.orc.org/public/WPub.dll/CC/123',
    );
    expect(screen.getByRole('link', { name: 'Speed guides' }).getAttribute('href')).toBe(
        'https://orc.org/sailors/sailor-services/speed-guides',
    );
    expect(screen.getByText(/may require login and payment/)).toBeDefined();
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
    expect(cells.slice(0, 3).map((cell) => cell.textContent.trim())).toEqual(['ORC reference', '001ABC', '002DEF']);
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
            .slice(0, 3)
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
                .slice(0, 3)
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

it('keeps an unmapped reference readable without linking to a different certificate', async () => {
    certificateUrl.mockResolvedValue(null);
    render(Boat, { sailnumber: 'GER/A' });
    await screen.findByText('001ABC');
    expect(screen.queryByRole('link', { name: '001ABC' })).toBeNull();
});

it('links each comparison reference to its own original certificate', async () => {
    window.location.hash = '#compare-GER/A|GER/B';
    render(Compare);
    expect((await screen.findByRole('link', { name: '001ABC' })).getAttribute('href')).toBe(
        'https://data.orc.org/public/WPub.dll/CC/123',
    );
    expect((await screen.findByRole('link', { name: '002DEF' })).getAttribute('href')).toBe(
        'https://data.orc.org/public/WPub.dll/CC/456',
    );
});

function installHistory() {
    const make = (id, gph, date) => ({
        id,
        reference: id,
        issue_date: date,
        vpp_year: 2026,
        family: 'ORC',
        boat: {
            ...fixture,
            sailnumber: 'GER/A',
            reference: id,
            rating: { ...fixture.rating, gph },
            boat: { ...fixture.boat, issue_date: date },
        },
    });
    const versions = [make('NEW', 590, '2026-10-02'), make('OLD', 600, '2026-08-31')];
    getHistory.mockResolvedValue({ sailnumber: 'GER/A', latest: 'NEW', versions, aliases: {} });
    getBoat.mockImplementation(async (sailnumber, reference = '') => {
        const entry = versions.find((v) => v.id === (reference || 'NEW'));
        if (!entry) throw new Error('missing');
        const { boat, ...certificate } = entry;
        return { ...boat, sailnumber, certificate };
    });
    return versions;
}

it('opens a historical boat URL and keeps its certificate in print and compare links', async () => {
    installHistory();
    window.location.hash = '#GER/A?ref=OLD';
    render(App, { route: 'boat' });
    await screen.findByRole('link', { name: 'OLD', exact: true });
    expect(getBoat).toHaveBeenCalledWith('GER/A', 'OLD');
    expect(window.location.hash).toBe('#GER/A?ref=OLD');
    for (const link of screen.getAllByRole('link', { name: 'Print polar' }))
        expect(link.getAttribute('href')).toBe('#print-GER/A?ref=OLD');
    expect(screen.getByRole('link', { name: 'Compare boats' }).getAttribute('href')).toBe('#compare-GER/A|?refA=OLD');
    expect(document.querySelector('textarea').value).toContain('ORC OLD');
});

it('switches one same-boat comparison version and preserves the other through navigation', async () => {
    installHistory();
    window.location.hash = '#compare-GER/A|GER/A?refA=OLD&refB=NEW';
    render(Compare);
    await screen.findByRole('link', { name: 'OLD', exact: true });
    await screen.findByRole('link', { name: 'NEW', exact: true });
    expect(screen.getByText('−10')).toBeDefined();
    await fireEvent.change(await screen.findByLabelText('Certificate A'), { target: { value: 'NEW' } });
    await vi.waitFor(() => expect(window.location.hash).toBe('#compare-GER/A|GER/A?refA=NEW&refB=NEW'));
    window.location.hash = '#compare-GER/A|GER/A?refA=OLD&refB=NEW';
    window.dispatchEvent(new Event('hashchange'));
    await screen.findByRole('link', { name: 'OLD', exact: true });
    expect(screen.getByLabelText('Certificate A').value).toBe('OLD');
    expect(screen.getByLabelText('Certificate B').value).toBe('NEW');
});

it('offers a pinned comparison with the previous certificate', async () => {
    installHistory();
    render(Boat, { sailnumber: 'GER/A' });
    const link = await screen.findByRole('link', { name: 'Compare with previous certificate' });
    await vi.waitFor(() => expect(link.getAttribute('href')).toBe('#compare-GER/A|GER/A?refA=OLD&refB=NEW'));
});

it('shows a missing version error instead of substituting current data', async () => {
    installHistory();
    render(Boat, { sailnumber: 'GER/A', reference: 'MISSING' });
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(screen.queryByRole('link', { name: 'NEW', exact: true })).toBeNull();
    expect(screen.getByRole('link', { name: 'Latest certificate' }).getAttribute('href')).toBe('#GER/A');
});

it('ignores a slow certificate response after switching versions of the same boat', async () => {
    const versions = installHistory();
    let resolveOld;
    getBoat.mockImplementation((sailnumber, reference) =>
        reference === 'OLD'
            ? new Promise((resolve) => {
                  resolveOld = resolve;
              })
            : Promise.resolve(versions[0].boat),
    );
    window.location.hash = '#compare-GER/A|?refA=OLD';
    render(Compare);
    await vi.waitFor(() => expect(resolveOld).toBeDefined());
    window.location.hash = '#compare-GER/A|?refA=NEW';
    window.dispatchEvent(new Event('hashchange'));
    await screen.findByRole('link', { name: 'NEW', exact: true });
    resolveOld(versions[1].boat);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('link', { name: 'OLD', exact: true })).toBeNull();
});

it('keeps a historical certificate in the print URL, back link and printed identity', async () => {
    installHistory();
    window.location.hash = '#print-GER/A?ref=OLD&layout=sheet';
    const { container } = render(PrintView, { sailnumber: 'GER/A', reference: 'OLD' });
    await vi.waitFor(() =>
        expect(container.querySelector('.print-card .certificate')?.textContent).toContain('ORC OLD'),
    );
    expect(window.location.hash).toContain('ref=OLD');
    expect(container.querySelector('a.back').getAttribute('href')).toBe('#GER/A?ref=OLD');
    await fireEvent.click(screen.getByRole('radio', { name: 'Complete table' }));
    expect(window.location.hash).toContain('ref=OLD');
    expect(window.location.hash).toContain('layout=page');
});

it('shows separate wind grids without fabricating interpolated deltas', async () => {
    const versions = installHistory();
    versions[1].boat = {
        ...versions[1].boat,
        vpp: { ...versions[1].boat.vpp, speeds: versions[1].boat.vpp.speeds.slice(0, -1) },
    };
    window.location.hash = '#compare-GER/A|GER/A?refA=OLD&refB=NEW';
    render(Compare);
    expect(await screen.findByText(/Wind grids differ/)).toBeDefined();
});
