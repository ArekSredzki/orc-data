// Explanations for the ORC rating numbers and VPP terminology shown around the site.
//
// Every entry is sourced: `source` links to the ORC page or rule that backs the
// definition, and the glossary page renders it. Definitions quoted from the ORC Rating
// Systems rulebook keep their rule number so a reader can check them.
//
// Rule numbers refer to the ORC Rating Systems rulebook (2023 edition, the most recent
// one published at a stable PDF URL).

const RULEBOOK = 'https://orc.org/uploads/files/Rules-Regulations/2023/ORC-Rating-Systems-2023-PDF.pdf';
const SCORING = 'https://orc.org/race-managment/scoring';
const CERTIFICATE = 'https://orc.org/organization/monohulls/orc-club-certificate';

// `long` is an array of paragraphs so both the popover and the glossary page can render
// it without any HTML in the data.
export const GLOSSARY = {
    'time-on-distance': {
        term: 'ToD',
        title: 'Time-on-Distance',
        unit: 'seconds per nautical mile',
        short: 'A rating in seconds per nautical mile. Lower is faster. The scorer multiplies it by the length of the course and subtracts the result from your elapsed time.',
        long: [
            'Corrected time = Elapsed time − (ToD of the boat − ToD of the fastest boat) × Distance. The boat with the lowest ToD in the fleet corrects to her own elapsed time, and everyone else is given the difference. The course has to be measured for this to work.',
            'ORC calculates a single-number ToD for a course model by averaging the boat’s time allowances over a fixed spread of wind strengths: 6 kt at 5%, 8 kt at 10%, 10 kt at 20%, 12 kt at 30%, 14 kt at 20%, 16 kt at 10% and 20 kt at 5% (rule 403.2). That is why a single number is dominated by how the boat goes in about 12 knots.',
        ],
        source: SCORING,
    },
    'time-on-time': {
        term: 'ToT',
        title: 'Time-on-Time',
        unit: 'multiplier on elapsed time',
        short: 'A multiplier applied to your elapsed time. Higher is faster. The course does not need to be measured.',
        long: [
            'Corrected time = ToT × Elapsed time. Because only the elapsed time matters, the longer the race runs the larger the correction becomes.',
            'A boat’s ToT is not a separate rating from her Time-on-Distance number — it is the same handicap in different units, converted with ToT = 600 ÷ ToD (rule 403.3). Every pair of numbers in the ratings table on a boat page satisfies that relationship.',
        ],
        source: SCORING,
    },
    gph: {
        term: 'GPH',
        title: 'General Purpose Handicap',
        unit: 'seconds per nautical mile',
        short: 'A single all-round Time-on-Distance number, in seconds per nautical mile. Lower is faster. ORC now prints it for reference only.',
        long: [
            'Rule 401.4: GPH “is the number with similar intention as the APH used up to 01/01/2022 shown on the certificate as reference only.”',
            'In other words, GPH was the all-round single number until 2022, when the All-Purpose Handicap took over that job. It is still printed on certificates and is still a reasonable way to line boats up by speed, but ORC no longer treats it as a scoring number.',
        ],
        source: CERTIFICATE,
    },
    osn: {
        term: 'OSN',
        title: 'Offshore single number',
        unit: 'seconds per nautical mile',
        short: 'The Time-on-Distance rating for offshore racing, in seconds per nautical mile. Lower is faster. Its Time-on-Time twin is the offshore TMF.',
        long: [
            'A single number derived from the boat’s time allowances using an offshore course model and wind weighting chosen by ORC.',
            'Unlike the inshore and all-purpose numbers, the offshore single number cannot be reproduced from the course allowances printed on the certificate using the standard rule 403.2 wind distribution, so the exact weighting behind it is not something this site can show you.',
        ],
        source: SCORING,
    },
    ilc: {
        term: 'ILCWA',
        title: 'Inshore single number',
        unit: 'seconds per nautical mile',
        short: 'The Time-on-Distance rating for inshore windward/leeward racing, in seconds per nautical mile. Lower is faster. Its Time-on-Time twin is the inshore TMF.',
        long: [
            'Rule 402.9(a) defines the windward/leeward course model as “a conventional course where the race course consists of 50% upwind and 50% downwind legs”. Because half the course is upwind, this number is normally a higher — slower — figure in seconds per mile than the all-round APH.',
            'Checked against all 8,112 certificates in the 2026 data on this site, ILCWA is the boat’s own windward/leeward course allowances averaged with the rule 403.2 wind distribution, to within 0.09 s/NM.',
            'ORC’s published rules do not expand the abbreviation “ILCWA”, so this site labels the row by what it is for — inshore — rather than guessing at the letters.',
        ],
        source: RULEBOOK,
    },
    aph: {
        term: 'APH',
        title: 'All-Purpose Handicap',
        unit: 'seconds per nautical mile',
        short: 'The all-round Time-on-Distance rating that replaced GPH in 2022, in seconds per nautical mile. Lower is faster.',
        long: [
            'Rule 401.4: APH “is an average representation of all time allowances in all wind speeds and wind directions. It is also used as single number Time on Distance Rating as defined in 403.2. It may be used for simple comparisons between boats and possible class divisions.”',
            'The matching course model (rule 402.9(b)) “includes equal distribution of all wind directions” — the circular random course. Checked against all 8,112 certificates in the 2026 data on this site, APH is the boat’s circular random allowances averaged with the rule 403.2 wind distribution, to within 0.08 s/NM.',
        ],
        source: CERTIFICATE,
    },
    'triple-numbers': {
        term: 'Triple numbers',
        title: 'Triple number scoring',
        unit: 'Time-on-Time multipliers',
        short: 'Three Time-on-Time coefficients for light, medium and strong wind. The race committee scores the race with whichever band matches the day.',
        long: [
            'Rule 403.4 allows national rating offices to publish “multiple ToD and/or ToT coefficients for different wind ranges”, and requires that “the course type used to calculate these ratings and the methods of how they will be applied shall be specified in the Notice of Race and/or Sailing Instructions”.',
            'So the wind speeds that separate low from medium from high are set by the event, not fixed by ORC. Check the Notice of Race for the regatta you are sailing rather than assuming a range.',
            'These are Time-on-Time numbers, so higher is faster. The medium band usually lands very close to the corresponding single-number rating for the same course type.',
        ],
        source: RULEBOOK,
    },
    cdl: {
        term: 'CDL',
        title: 'Class Division Length',
        unit: 'metres',
        short: 'A length used to split fleets into classes. It blends the boat’s measured sailing length with how fast she actually goes upwind.',
        long: [
            'Rule 401.5: CDL “is the average of the effective sailing length (IMS L) and the rated length (RL) that is calculated from the upwind speed of the boat in a True Wind Speed of 12 knots. It is used for class divisions as a combination of the boat’s upwind speed and length.”',
            'It is a length in metres, not a handicap — two boats with a similar CDL are expected to make a fair class together.',
        ],
        source: CERTIFICATE,
    },
    'stability-index': {
        term: 'Stability Index',
        title: 'ORC Stability Index',
        short: 'A measure of how stiff the boat is — how hard she resists being knocked down. Higher is stiffer. Only shown for boats whose stability was actually measured.',
        long: [
            'Rule 106.1: Stability Index = LPS + Capsize Increment (CI) + Size Increment (SI), where LPS is the limit of positive stability — the heel angle beyond which the boat no longer rights herself.',
            'Many events use it as an eligibility threshold for offshore racing. ORC omits it when a boat’s stability has not been measured, which is the case for roughly three quarters of the club certificates in this data, so most boats on this site show “?”.',
        ],
        source: RULEBOOK,
    },
    division: {
        term: 'Division',
        title: 'IMS Division',
        short: 'ORC’s boat-type grouping: Cruiser/Racer, Sportboat or Racer.',
        long: [
            'Certificates carry a division letter: C for Cruiser/Racer, S for Sportboat and R for Racer (also written “Performance”).',
            'It affects more than paperwork — the Dynamic Allowance, a credit for how a boat behaves while manoeuvring, “is applied to the ratings of all Cruiser/Racers, as well as any Performance boats with a Series Date older than 30 years” (rule 103.2).',
        ],
        source: RULEBOOK,
    },
    'issue-date': {
        term: 'Issued',
        title: 'Certificate issue date',
        short: 'When this certificate was issued. Ratings are recalculated every rule year, so an older certificate does not reflect the current VPP.',
        long: [
            'ORC reissues certificates each rule year and the VPP changes between years, so two boats measured in different years are not strictly comparable.',
            'This site keeps boats from earlier years in its database once they stop appearing in the annual download, which is why some boats here show fewer rating numbers than others — their certificate predates the fields being collected.',
        ],
        source: CERTIFICATE,
    },
    displacement: {
        term: 'Displacement',
        title: 'Displacement',
        unit: 'kilograms',
        short: 'The measured weight of the boat. This is the measurement displacement, not the heavier sailing trim figure that includes crew and gear.',
        long: [
            'ORC records both a measurement displacement and a sailing-trim displacement; the figure shown here is the measurement one.',
            'Crew weight is carried separately on the certificate and is one of the inputs the VPP uses to work out righting moment.',
        ],
        source: CERTIFICATE,
    },
    'wetted-surface': {
        term: 'WSS',
        title: 'Wetted surface',
        unit: 'square metres',
        short: 'The area of hull and appendages in the water. It is the main source of drag in light air, so it matters most at the light end of the polar.',
        long: [
            'Wetted surface is one of the hull measurements feeding the VPP’s drag model. A boat with a lot of wetted surface for her sail area pays for it most in 6–8 knots, which is visible as a comparatively small inner ring on her polar.',
        ],
        source: CERTIFICATE,
    },
    'sail-areas': {
        term: 'Sail areas',
        title: 'Rated sail areas',
        unit: 'square metres',
        short: 'The largest mainsail, headsail and spinnaker the boat is rated for. A zero means the boat carries no sail of that type on this certificate.',
        long: [
            'These are the maximum rated areas, not necessarily what is in the sail locker. A boat rated without a spinnaker will show 0 for both the symmetric and asymmetric entries, and her polar will be noticeably slower downwind as a result.',
        ],
        source: CERTIFICATE,
    },
    vpp: {
        term: 'VPP',
        title: 'Velocity Prediction Program',
        short: 'The physics model ORC uses to predict how fast a boat should sail. Every speed on this site is a prediction from it, not a measurement.',
        long: [
            'The VPP takes a boat’s measured hull, rig, sail and stability figures and solves for the speed at which driving force and drag balance, for each combination of wind speed and wind angle. The result is the table of time allowances printed on the certificate.',
            'Nothing here is a recorded speed. A boat that is badly sailed, poorly prepared or carrying different sails from the ones she is rated for will not match her polar — and a boat whose measurements are generous to her may beat it.',
        ],
        source: SCORING,
    },
    'polar-diagram': {
        term: 'Polar',
        title: 'How to read the polar diagram',
        short: 'Each curve is one true wind speed. Distance from the centre is boat speed; the angle is the wind angle. Head to wind is straight up.',
        long: [
            'The origin is the boat. Straight up is dead into the wind, and the angle around the plot is the angle between the wind and the direction the boat is sailing. The dashed rings are boat speed in knots, labelled along the top.',
            'One curve is drawn per true wind speed, coloured to match the columns of the table beneath it. Reading outwards along a wind angle tells you how much faster the boat goes as the breeze builds; reading around a single curve tells you which angle is fastest in that breeze.',
            'The curves come from ORC’s Velocity Prediction Program, not from GPS. They are what the rule believes the boat can do with the sails she is rated for.',
            'The True/Apparent toggle switches the plot between true wind angle — the angle to the real wind, which is what you steer to — and apparent wind angle, which is what the masthead instruments read. Only the angles change; the boat speed at each point is the same either way.',
        ],
        source: SCORING,
    },
    'polar-table': {
        term: 'Polar table',
        title: 'The polar table',
        short: 'Predicted boat speed in knots at each true wind angle, one column per true wind speed, plus the best angles and speeds for sailing upwind and downwind.',
        long: [
            'Each column is a true wind speed (TWS) in knots; each of the numbered rows is a true wind angle (TWA) in degrees, and the cells are predicted boat speed in knots.',
            'The beat and run rows at the top and bottom are different: a boat cannot sail straight into the wind, so “beat angle” is the angle that gets her upwind fastest, and “beat VMG” is the speed she actually makes good towards the wind — always less than her speed through the water. The run rows are the same idea downwind.',
            'Beat and run angles are given twice, as true wind angle (TWA, relative to the real wind) and apparent wind angle (AWA, what the instruments at the masthead read). AWA is always the tighter number, because the boat’s own motion pulls the apparent wind forward.',
            'ORC certificates give allowances from 6 to 20 knots of true wind (rule 402.2); some newer certificates in this data extend from 4 to 24.',
        ],
        source: RULEBOOK,
    },
    tws: {
        term: 'TWS',
        title: 'True wind speed',
        unit: 'knots',
        short: 'The wind speed over the water, in knots — what a stationary observer would measure, not what the boat’s instruments read while moving.',
        long: [
            'Each column of the polar table and each curve on the polar diagram is one true wind speed. ORC weights 12 knots most heavily when it condenses these into a single-number rating (rule 403.2).',
        ],
        source: RULEBOOK,
    },
    'twa-awa': {
        term: 'TWA / AWA',
        title: 'True and apparent wind angle',
        unit: 'degrees',
        short: 'TWA is the angle to the real wind; AWA is the angle the boat’s instruments see once her own motion is added in. AWA is always the smaller number.',
        long: [
            'A boat moving forward creates her own headwind, so the wind she feels comes from further ahead and stronger than the wind actually blowing. That is the apparent wind.',
            'Polars are normally drawn and tabulated in true wind angle, because TWA describes the course over the water and is what you steer to. Apparent wind angle is what you read off the masthead and trim to. The toggle above the plot switches between the two; only the angles change, never the boat speed.',
        ],
        source: RULEBOOK,
    },
    vmg: {
        term: 'VMG',
        title: 'Velocity made good',
        unit: 'knots',
        short: 'The part of the boat’s speed that goes directly upwind or downwind. Always less than boat speed, because you cannot sail straight at the mark.',
        long: [
            'Sailing 42° off the wind at 7 knots only makes about 5.2 knots towards the windward mark: VMG = boat speed × cos(angle). Sailing further off the wind is faster through the water but points less at the mark, so there is a best compromise angle — the beat angle in the table.',
            'The same trade-off applies downwind, where a boat that will not sail dead downwind gybes through a wider angle to gain enough speed to make up for the extra distance.',
        ],
        source: RULEBOOK,
    },
    'time-allowance': {
        term: 'Time allowance',
        title: 'Time allowance',
        unit: 'seconds per nautical mile',
        short: 'The raw output of ORC’s VPP: how many seconds the boat should take to cover one nautical mile in given conditions. This site converts it to boat speed in knots.',
        long: [
            'Rule 402.2: certificates provide “a range of ratings (time allowances expressed in s/NM) for different wind conditions in the range of 6 – 20 knots of true wind speed from optimum beat, over 52, 60, 75, 90, 110, 120, 135, 150 degrees of true wind angle to the optimum run.”',
            'Speed in knots is simply 3600 ÷ the time allowance. Every rating number on this site is one of these allowances, or an average of them.',
        ],
        source: RULEBOOK,
    },
    'polar-csv': {
        term: 'Polar CSV',
        title: 'Polar CSV export',
        short: 'The polar in the semicolon-separated format routing and navigation software expects: first row true wind speeds, first column true wind angles, cells boat speed in knots.',
        long: [
            'The first cell is the literal text twa/tws. The rest of the first row is true wind speed in knots, the first column of each following row is true wind angle in degrees, and every other cell is boat speed in knots. Lines starting with # are comments and zeros are treated as no data.',
            'The extended option adds one row per wind speed for the optimum beat and run angles, with the VMG converted back to speed through the water. That gives routing software the pointing and gybing angles as well as the reaching numbers.',
        ],
        source: SCORING,
    },
};

// Section order for the glossary page. Every key in GLOSSARY belongs to exactly one group;
// the glossary page's own test asserts that, so a new entry cannot be added without also
// being filed here.
export const GLOSSARY_GROUPS = [
    {
        title: 'Reading the polar',
        keys: ['polar-diagram', 'vpp', 'polar-table', 'tws', 'twa-awa', 'vmg', 'time-allowance', 'polar-csv'],
    },
    {
        title: 'How ratings are applied',
        keys: ['time-on-distance', 'time-on-time', 'triple-numbers'],
    },
    {
        title: 'The rating numbers',
        keys: ['aph', 'osn', 'ilc', 'gph'],
    },
    {
        title: 'On the certificate',
        keys: ['cdl', 'stability-index', 'division', 'issue-date'],
    },
    {
        title: 'Measurements',
        keys: ['displacement', 'wetted-surface', 'sail-areas'],
    },
];

export function glossaryUrl(key) {
    return `#glossary-${key}`;
}

export function glossaryAnchor(key) {
    return `glossary-${key}`;
}
