import { DEG2RAD, twa2awa, vmg2sog } from './util.js';

// Build the plotted points for a boat's VPP in the given angle mode.
//
// Returns an array with one entry per true wind speed:
//   { tws, points: [{ tws, twa, sog, angleRad, kind }] }
// where `points` is sorted by angle and `kind` is 'beat' | 'twa' | 'run'.
// `angleRad` is the plotting angle (apparent when angleMode === 'apparent');
// `twa` and `sog` are always the underlying true-wind values.
export function vppSeries(vpp, angleMode = 'true') {
    const apparent = angleMode === 'apparent';
    const makePoint = (twa, sog, tws, kind) => ({
        tws,
        twa,
        sog,
        kind,
        angleRad: (apparent ? twa2awa(twa, tws, sog) : twa) * DEG2RAD,
    });

    return vpp.speeds.map((tws, i) => {
        const points = [];
        if (vpp.beat_angle) {
            points.push(makePoint(vpp.beat_angle[i], vmg2sog(vpp.beat_angle[i], vpp.beat_vmg[i]), tws, 'beat'));
        }
        vpp.angles.forEach((twa) => {
            const sog = vpp[twa][i];
            if (sog > 0) points.push(makePoint(twa, sog, tws, 'twa'));
        });
        if (vpp.run_angle) {
            points.push(makePoint(vpp.run_angle[i], vmg2sog(vpp.run_angle[i], -vpp.run_vmg[i]), tws, 'run'));
        }
        points.sort((a, b) => a.angleRad - b.angleRad);
        return { tws, points };
    });
}
