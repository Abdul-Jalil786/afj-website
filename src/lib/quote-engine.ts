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
 * Look up distance between two postcode areas in miles.
 */
function lookupDistance(fromArea: string, toArea: string): number {
  const matrix = quoteRules.distanceMatrix as Record<string, Record<string, number>>;
  const fromRow = matrix[fromArea] || matrix['default'];
  return fromRow[toArea] ?? fromRow['default'] ?? 50;
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
export function estimateQuote(
  service: string,
  answers: Record<string, string>,
): QuoteEstimate {
  const pricing = (quoteRules.pricing as Record<string, any>)[service];
  const svcConfig = (quoteRules.services as Record<string, any>)[service];

  if (!pricing || !svcConfig || svcConfig.type !== 'instant') {
    throw new Error(`No pricing available for service: ${service}`);
  }

  let rate: number;

  if (service === 'private-hire') {
    const fromArea = extractArea(answers.pickupPostcode || '');
    const toArea = extractArea(answers.destinationPostcode || '');
    const distance = lookupDistance(fromArea, toArea);

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
