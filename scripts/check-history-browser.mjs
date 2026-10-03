// Reusable end-to-end checks for an isolated Playwright Page (local or deployed).
// Usage: await checkHistory(page, 'http://127.0.0.1:18766/');
function assert(condition, message = 'Browser assertion failed') {
    if (!condition) throw new Error(message);
}
assert.equal = (actual, expected, message) => assert(actual === expected, message || `${actual} !== ${expected}`);
assert.deepEqual = (actual, expected) => assert(JSON.stringify(actual) === JSON.stringify(expected));

export async function checkHistory(page, baseURL) {
    const oldRef = '03430004WVE';
    const newRef = '03430005194';
    const sail = 'CAN/CAN1995';
    const compare = `#compare-${sail}|${sail}?refA=${oldRef}&refB=${newRef}`;
    const errors = [];
    const capture = (error) => errors.push(error.message);
    page.on('pageerror', capture);
    try {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(`${baseURL}#${sail}?ref=${oldRef}`);
        await page.getByLabel('Certificate version').waitFor();
        assert.equal(await page.getByLabel('Certificate version').inputValue(), oldRef);
        await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('ORC 03430004WVE'));
        assert((await page.locator('textarea').inputValue()).includes('2026-08-31'));
        assert.equal(
            await page.getByRole('link', { name: 'Print polar', exact: true }).first().getAttribute('href'),
            `#print-${sail}?ref=${oldRef}`,
        );

        await page.getByLabel('Certificate version').selectOption('');
        await page.waitForURL(`${baseURL}#${sail}`);
        await page.getByRole('link', { name: 'Compare with previous certificate' }).waitFor();
        await page.waitForFunction(
            (href) => [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === href),
            compare,
        );
        await page.getByRole('link', { name: 'Compare with previous certificate' }).click();
        await page.waitForURL(`${baseURL}${compare}`);
        await page.getByText('−1.2', { exact: true }).waitFor();
        assert.equal(await page.getByLabel('Certificate A').inputValue(), oldRef);
        assert.equal(await page.getByLabel('Certificate B').inputValue(), newRef);

        await page.getByLabel('Certificate A').selectOption(newRef);
        await page.waitForURL(`**refA=${newRef}&refB=${newRef}`);
        await page.goBack();
        await page.waitForURL(`${baseURL}${compare}`);
        await page.getByText('−1.2', { exact: true }).waitFor();
        assert.equal(await page.getByLabel('Certificate A').inputValue(), oldRef);
        await page.reload();
        await page.getByText('−1.2', { exact: true }).waitFor();

        await page.setViewportSize({ width: 390, height: 844 });
        assert(await page.getByLabel('Certificate A').isVisible());
        assert(await page.getByLabel('Certificate B').isVisible());
        assert(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
            'Mobile page overflows viewport',
        );
        await page.setViewportSize({ width: 1440, height: 1000 });

        await page.goto(`${baseURL}#print-${sail}?ref=${oldRef}&layout=sheet`);
        await page.locator('.print-card .certificate').first().waitFor();
        assert((await page.locator('.print-card .certificate').first().textContent()).includes(oldRef));
        await page.getByRole('radio', { name: 'Complete table', exact: true }).check();
        assert(page.url().includes(`ref=${oldRef}`));
        assert.equal(await page.locator('a.back').getAttribute('href'), `#${sail}?ref=${oldRef}`);

        await page.goto(`${baseURL}#${sail}?ref=not-a-certificate`);
        await page.getByRole('alert').waitFor();
        assert.equal(await page.locator('textarea').count(), 0, 'Missing version must not show latest data');
        await page.getByLabel('Certificate version').selectOption(oldRef);
        await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('ORC 03430004WVE'));
        assert.deepEqual(errors, []);
        return {
            historicalBoat: true,
            previousComparison: true,
            independentSelectors: true,
            navigation: true,
            mobile: true,
            print: true,
            missingVersion: true,
        };
    } finally {
        page.off('pageerror', capture);
    }
}
