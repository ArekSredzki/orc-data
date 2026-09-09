// Certificate fields, filtered the way the boat page has always filtered them: a row is
// dropped when this boat's certificate does not carry the field, rather than printed with
// a "?" in it. Roughly 60% of the boats in this data set predate the fields ORC added in
// 2022, so blanking would be the common case, not the exception.
//
// Shared by the boat page and the printable card so the two cannot disagree about what a
// certificate says.

// The year of the data set the site was built from. Certificates that carry no issue date
// — most of them — fall back to this, because a printed card with no provenance at all is
// a hazard once it has been laminated and left in a bag for a season.
export const DATA_YEAR = 2026;

export const DIVISIONS = { C: 'Cruiser/Racer', S: 'Sportboat', R: 'Racer' };

export const SITE_NAME = 'ORC Sailboat Data';

// Sail numbers arrive from the parser as "CAN/CAN1995": a country folder joined to the
// number, which for most boats repeats that country. Read out, it is "CAN 1995" — so the
// slash goes, and the country is said once.
export function formatSailnumber(sailnumber) {
    if (!sailnumber) {
        return '';
    }
    const [country, ...rest] = String(sailnumber).split('/');
    const number = rest.join('/');
    if (!number) {
        return country;
    }
    return `${country} ${number.startsWith(country) ? number.slice(country.length) : number}`.trim();
}

// Document titles. A tab reading "ORC Sailboat Data" says nothing about which of the six
// boats you opened it for, and these pages get kept open side by side.
export function pageTitle(subject) {
    return subject ? `ORC Data - ${subject}` : SITE_NAME;
}

export function boatSubject(boat) {
    if (!boat) {
        return '';
    }
    const number = formatSailnumber(boat.sailnumber);
    return boat.name ? `${boat.name} ${number}` : number;
}

export function sails(sizes) {
    const list = [
        { label: 'Main', value: sizes.main },
        { label: 'Genoa', value: sizes.genoa },
    ];
    if (sizes.spinnaker > 0) {
        list.push({ label: 'Spinnaker', value: sizes.spinnaker });
    }
    if (sizes.spinnaker_asym > 0) {
        list.push({ label: 'Asym. spinnaker', value: sizes.spinnaker_asym });
    }
    return list;
}

// ORC omits the stability index unless the boat's stability was actually measured. It has
// been written as -1, as null and as an absent key by different generations of the parser,
// so test for a real value rather than relying on falsiness (-1 is truthy).
export function stabilityIndex(boat) {
    return boat?.boat.stability_index > 0 ? boat.boat.stability_index : null;
}

// Certificates carry a full ISO timestamp; the date alone is what matters and reads the
// same in every locale.
export function issueDate(boat) {
    return boat?.boat.issue_date ? boat.boat.issue_date.substring(0, 10) : null;
}

// One row per course model, each in both of the units ORC publishes: Time-on-Distance in
// seconds per mile and Time-on-Time as a multiplier, related by ToT = 600 / ToD.
export function ratingRows(rating) {
    if (!rating) {
        return [];
    }
    return [
        { label: 'Offshore', help: 'osn', tod: rating.osn, tot: rating.tmf_offshore },
        { label: 'Inshore', help: 'ilc', tod: rating.ilc, tot: rating.tmf_inshore },
        { label: 'All-purpose', help: 'aph', tod: rating.aph_tod, tot: rating.aph_tot },
        { label: 'General purpose', help: 'gph', tod: rating.gph, tot: null },
    ].filter((row) => row.tod != null || row.tot != null);
}

export function certificateRows(boat) {
    if (!boat) {
        return [];
    }
    const division = boat.boat.division;
    return [
        { label: 'CDL', help: 'cdl', value: boat.boat.cdl != null ? `${boat.boat.cdl.toFixed(2)} m` : null },
        { label: 'Division', help: 'division', value: division ? DIVISIONS[division] || division : null },
        { label: 'Stability index', help: 'stability-index', value: stabilityIndex(boat) },
        { label: 'Issued', help: 'issue-date', value: issueDate(boat) },
    ].filter((item) => item.value != null);
}

export function tripleRows(rating) {
    if (!rating) {
        return [];
    }
    return [
        { label: 'Inshore', values: rating.triple_inshore },
        { label: 'Offshore', values: rating.triple_offshore },
    ].filter((row) => row.values?.length === 3);
}
