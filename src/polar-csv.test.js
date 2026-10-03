import { expect, it } from 'vitest';

import { polarExport, polarImport } from './polar-csv.js';
import boat from '../site/data/CAN/CAN1995.json';

it('preserves certificate identity as a comment without breaking polar CSV round trips', () => {
    const csv = polarExport(boat, false);
    expect(csv.startsWith('twa/tws;')).toBe(true);
    expect(csv).toContain(`# Certificate: 2026-10-02 · ORC ${boat.reference}`);
    const polar = polarImport(csv);
    expect(polar.speeds).toEqual(boat.vpp.speeds);
    expect(polar[90]).toEqual(boat.vpp[90]);
});
