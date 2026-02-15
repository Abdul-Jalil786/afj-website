import quoteRules from '../data/quote-rules.json';

export interface QuoteEstimate {
  low: number;
  high: number;
  currency: string;
  perUnit: string;
}

/**
 * Extract the postcode area letters from a UK postcode or city name.
 * e.g. "B7 4QS" → "B", "CV6 3BL" → "CV", "Manchester" → "M"
 */
function extractArea(input: string): string {
  const trimmed = input.trim().toUpperCase();

  // Try to extract leading letters (postcode area)
  const match = trimmed.match(/^([A-Z]{1,2})/);
  if (match) {
    const area = match[1];
    if (area in quoteRules.distanceMatrix) return area;
  }

  // Try city name lookup
  const lower = input.trim().toLowerCase();
  const cityArea = (quoteRules.cityLookup as Record<string, string>)[lower];
  if (cityArea) return cityArea;

  return 'default';
}

/**
 * Look up distance between two postcode areas in miles (hardcoded fallback).
 */
function lookupDistance(fromArea: string, toArea: string): number {
  const matrix = quoteRules.distanceMatrix as Record<string, Record<string, number>>;
  const fromRow = matrix[fromArea] || matrix['default'];
  return fromRow[toArea] ?? fromRow['default'] ?? 50;
}

/**
 * Fetch lat/lng coordinates for a UK postcode via Postcodes.io.
 */
async function fetchCoords(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result?.latitude != null && data.result?.longitude != null) {
      return { lat: data.result.latitude, lng: data.result.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get actual driving distance in miles between two coordinates via OSRM.
 */
async function fetchDrivingMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes?.[0]?.distance) {
      return data.routes[0].distance / 1609.344; // metres → miles
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get distance between two postcodes: tries real driving mileage first,
 * falls back to the hardcoded distance matrix.
 */
async function getDistance(pickup: string, destination: string): Promise<number> {
  const [fromCoords, toCoords] = await Promise.all([
    fetchCoords(pickup),
    fetchCoords(destination),
  ]);

  if (fromCoords && toCoords) {
    const miles = await fetchDrivingMiles(
      fromCoords.lat, fromCoords.lng,
      toCoords.lat, toCoords.lng,
    );
    if (miles != null && miles > 0) return Math.round(miles);
  }

  // Fallback to hardcoded matrix
  const fromArea = extractArea(pickup);
  const toArea = extractArea(destination);
  return lookupDistance(fromArea, toArea);
}

/**
 * Look up airport base rate from a postcode area.
 */
function lookupAirportRate(area: string, airportCode: string): number {
  const rates = quoteRules.airportRates as Record<string, Record<string, number>>;
  const areaRates = rates[area] || rates['default'];
  return areaRates[airportCode] ?? rates['default'][airportCode] ?? 200;
}

/**
 * Calculate an estimated price range for Private Hire or Airport Transfers.
 */
export async function estimateQuote(
  service: string,
  answers: Record<string, string>,
): Promise<QuoteEstimate> {
  const pricing = (quoteRules.pricing as Record<string, any>)[service];
  const svcConfig = (quoteRules.services as Record<string, any>)[service];

  if (!pricing || !svcConfig || svcConfig.type !== 'instant') {
    throw new Error(`No pricing available for service: ${service}`);
  }

  let rate: number;

  if (service === 'private-hire') {
    const distance = await getDistance(
      answers.pickupPostcode || '',
      answers.destinationPostcode || '',
    );

    rate = pricing.baseFare + distance * pricing.perMileRate;

    // Passenger tier multiplier
    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;
    rate *= passengerMult;

    // Return journey
    if (answers.returnJourney === 'yes') {
      rate *= pricing.returnMultiplier;
    }
  } else if (service === 'airport') {
    const pickupArea = extractArea(answers.pickupPostcode || '');
    const airportCode = (answers.airport || 'BHX').toUpperCase();

    rate = lookupAirportRate(pickupArea, airportCode);

    // Passenger tier multiplier
    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;
    rate *= passengerMult;

    // Meet and greet surcharge
    if (answers.meetGreet === 'yes') {
      rate += pricing.meetGreetSurcharge;
    }

    // Return journey
    if (answers.returnJourney === 'yes') {
      rate *= pricing.returnMultiplier;
    }
  } else {
    throw new Error(`Unknown instant service: ${service}`);
  }

  const spread = pricing.rangeSpread;
  const low = Math.round(rate * (1 - spread / 2));
  const high = Math.round(rate * (1 + spread / 2));

  return {
    low,
    high,
    currency: 'GBP',
    perUnit: svcConfig.perUnit,
  };
}
