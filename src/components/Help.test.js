import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import Help from './Help.svelte';
import HelpPair from './HelpPair.test.svelte';
import { GLOSSARY } from '../glossary.js';

const GPH = GLOSSARY.gph;

beforeEach(() => {
    // jsdom reports no pointer, which would disable the hover path; the click path under
    // test does not depend on it, but matchMedia has to exist at all.
    window.matchMedia = (query) => ({ matches: false, media: query, addListener() {}, removeListener() {} });
});

afterEach(cleanup);

describe('Help', () => {
    it('names the term in the button label', () => {
        render(Help, { term: 'gph' });

        expect(screen.getByRole('button', { name: /GPH/ })).toBeDefined();
        expect(screen.getByRole('button', { name: /General Purpose Handicap/ })).toBeDefined();
    });

    it('opens on click and shows the summary', async () => {
        render(Help, { term: 'gph' });
        const button = screen.getByRole('button');

        expect(button.getAttribute('aria-expanded')).toBe('false');
        await fireEvent.click(button);

        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByText(GPH.short)).toBeDefined();
        // The long form stays behind the disclosure until asked for.
        expect(screen.queryByText(GPH.long[0])).toBeNull();
    });

    it('reveals the full definition in place rather than linking away', async () => {
        render(Help, { term: 'gph' });
        await fireEvent.click(screen.getByRole('button'));
        await fireEvent.click(screen.getByRole('button', { name: 'More' }));

        for (const paragraph of GPH.long) {
            expect(screen.getByText(paragraph)).toBeDefined();
        }
        expect(screen.getByRole('link', { name: /Source/ }).getAttribute('href')).toBe(GPH.source);
    });

    it('closes on Escape and returns focus to the button', async () => {
        render(Help, { term: 'gph' });
        const button = screen.getByRole('button');
        await fireEvent.click(button);

        await fireEvent.keyDown(window, { key: 'Escape' });

        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(screen.queryByText(GPH.short)).toBeNull();
        expect(document.activeElement).toBe(button);
    });

    it('closes the previous panel when another opens, even for the same term', async () => {
        // Two icons for one term is the real case (`tws` appears on both the plot and the
        // table), and is why the open panel is tracked per instance rather than per term.
        render(HelpPair, { term: 'gph' });
        const [first, second] = screen.getAllByRole('button');

        await fireEvent.click(first);
        expect(first.getAttribute('aria-expanded')).toBe('true');

        await fireEvent.click(second);

        expect(second.getAttribute('aria-expanded')).toBe('true');
        expect(first.getAttribute('aria-expanded')).toBe('false');
        expect(screen.getAllByText(GPH.short)).toHaveLength(1);
    });

    it('warns and degrades instead of throwing for an unknown term', () => {
        render(Help, { term: 'not-a-real-term' });

        expect(screen.getByRole('button', { name: /not-a-real-term/ })).toBeDefined();
    });
});
