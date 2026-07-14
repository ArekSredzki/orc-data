export const DEG2RAD = Math.PI / 180;

export function vmg2sog(beat_angle, vmg) {
    return vmg / Math.cos(beat_angle * DEG2RAD);
}

// Convert a true wind angle to the apparent wind angle for a boat sailing at
// `sog` knots in `tws` knots of true wind. Only the angle changes; boat speed
// (the polar radius) is the same in either reference frame.
export function twa2awa(twaDeg, tws, sog) {
    const beta = twaDeg * DEG2RAD;
    const aws = Math.sqrt(tws * tws + sog * sog + 2 * tws * sog * Math.cos(beta));
    if (aws === 0) return twaDeg;
    const x = Math.max(-1, Math.min(1, (tws * Math.cos(beta) + sog) / aws));
    return Math.acos(x) / DEG2RAD;
}
export function round(x, n) {
    return n == null ? Math.round(x) : Math.round(x * (n = Math.pow(10, n))) / n;
}
export function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function zeros(n) {
    return Array.apply(null, new Array(n)).map(() => 0.0);
}

export function int(n) {
    return parseInt(n, 10);
}

export function float(n) {
    return +n;
}
