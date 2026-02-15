import quoteRules from '../data/quote-rules.json';

export interface QuoteEstimate {
  low: number;
  high: number;
  currency: string;
  perUnit: string;
  distanceMiles?: number;
  durationMinutes?: number;
  waitingHours?: number;
  deadheadMiles?: number;
  dvsaBreakApplied?: boolean;
  surchargePercent?: number;
  surchargeLabels?: string[];
  regularDiscountApplied?: boolean;
  minimumApplied?: boolean;
  numberOfStops?: number;
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
): Promise<{ miles: number; minutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (route?.distance) {
      return {
        miles: route.distance / 1609.344,
        minutes: route.duration ? route.duration / 60 : 0,
      };
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
async function getDistance(pickup: string, destination: string): Promise<{ miles: number; minutes: number }> {
  const [fromCoords, toCoords] = await Promise.all([
    fetchCoords(pickup),
    fetchCoords(destination),
  ]);

  if (fromCoords && toCoords) {
    const result = await fetchDrivingMiles(
      fromCoords.lat, fromCoords.lng,
      toCoords.lat, toCoords.lng,
    );
    if (result != null && result.miles > 0) {
      return { miles: Math.round(result.miles), minutes: Math.round(result.minutes) };
    }
  }

  // Fallback to hardcoded matrix — estimate duration from distance at average speed
  const fromArea = extractArea(pickup);
  const toArea = extractArea(destination);
  const miles = lookupDistance(fromArea, toArea);
  const avgSpeedMph = (quoteRules.pricing as any)['private-hire']?.averageSpeedMph || 40;
  return { miles, minutes: Math.round((miles / avgSpeedMph) * 60) };
}

/**
 * Parse a "HH:MM" time string into minutes since midnight.
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Calculate applicable surcharges based on date and time.
 * Surcharges stack additively: time-of-day + day-of-week or bank holiday.
 */
function calculateSurcharges(date: string, time: string): { percent: number; labels: string[] } {
  const surcharges = quoteRules.surcharges as Record<string, any>;
  const bankHolidays = quoteRules.bankHolidays as string[];
  let totalPercent = 0;
  const labels: string[] = [];

  // Time-based surcharges
  if (time) {
    const timeMin = parseTimeToMinutes(time);
    if (surcharges.earlyMorning) {
      const beforeMin = parseTimeToMinutes(surcharges.earlyMorning.before);
      if (timeMin < beforeMin) {
        totalPercent += surcharges.earlyMorning.percent;
        labels.push(surcharges.earlyMorning.label + ' (+' + surcharges.earlyMorning.percent + '%)');
      }
    }
    if (surcharges.lateNight) {
      const afterMin = parseTimeToMinutes(surcharges.lateNight.after);
      if (timeMin >= afterMin) {
        totalPercent += surcharges.lateNight.percent;
        labels.push(surcharges.lateNight.label + ' (+' + surcharges.lateNight.percent + '%)');
      }
    }
  }

  // Date-based surcharges (bank holiday replaces day-of-week)
  if (date) {
    if (bankHolidays.includes(date)) {
      totalPercent += surcharges.bankHoliday.percent;
      labels.push(surcharges.bankHoliday.label + ' (+' + surcharges.bankHoliday.percent + '%)');
    } else {
      const dayOfWeek = new Date(date + 'T12:00:00').getDay();
      if (surcharges.saturday && dayOfWeek === surcharges.saturday.dayOfWeek) {
        totalPercent += surcharges.saturday.percent;
        labels.push(surcharges.saturday.label + ' (+' + surcharges.saturday.percent + '%)');
      }
      if (surcharges.sunday && dayOfWeek === surcharges.sunday.dayOfWeek) {
        totalPercent += surcharges.sunday.percent;
        labels.push(surcharges.sunday.label + ' (+' + surcharges.sunday.percent + '%)');
      }
    }
  }

  return { percent: totalPercent, labels };
}

/**
 * Calculate driving distance from the nearest company base to a pickup postcode.
 * Bases are defined in quote-rules.json.
 */
async function getDeadheadFromBase(pickupPostcode: string): Promise<{ miles: number; minutes: number }> {
  const bases = (quoteRules as any).bases as { postcode: string; label: string }[];
  if (!bases || !bases.length) return { miles: 0, minutes: 0 };

  const pickupCoords = await fetchCoords(pickupPostcode);
  if (!pickupCoords) {
    // Fallback: use matrix distance from B (Birmingham primary base)
    const pickupArea = extractArea(pickupPostcode);
    const miles = lookupDistance('B', pickupArea);
    const avgSpeedMph = (quoteRules.pricing as any)['private-hire']?.averageSpeedMph || 40;
    return { miles, minutes: Math.round((miles / avgSpeedMph) * 60) };
  }

  // Fetch coords for all bases in parallel
  const baseCoords = await Promise.all(bases.map((b) => fetchCoords(b.postcode)));

  // Calculate distance from each base to pickup
  let best: { miles: number; minutes: number } | null = null;

  for (let i = 0; i < bases.length; i++) {
    const bc = baseCoords[i];
    if (!bc) continue;

    const result = await fetchDrivingMiles(bc.lat, bc.lng, pickupCoords.lat, pickupCoords.lng);
    if (result && result.miles > 0) {
      const rounded = { miles: Math.round(result.miles), minutes: Math.round(result.minutes) };
      if (!best || rounded.miles < best.miles) {
        best = rounded;
      }
    }
  }

  if (best) return best;

  // Fallback: matrix from Birmingham
  const pickupArea = extractArea(pickupPostcode);
  const miles = lookupDistance('B', pickupArea);
  const avgSpeedMph = (quoteRules.pricing as any)['private-hire']?.averageSpeedMph || 40;
  return { miles, minutes: Math.round((miles / avgSpeedMph) * 60) };
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
  const minimums = (quoteRules.minimumBooking as Record<string, number>) || {};

  if (!pricing || !svcConfig || svcConfig.type !== 'instant') {
    throw new Error(`No pricing available for service: ${service}`);
  }

  let rate: number;
  let distanceMiles: number | undefined;
  let durationMinutes: number | undefined;
  let waitingHours: number | undefined;
  let deadheadMiles: number | undefined;
  let dvsaBreakApplied = false;
  let numberOfStops = 0;

  if (service === 'private-hire') {
    // Collect intermediate stops
    const stops: string[] = [];
    if (answers.stop1) stops.push(answers.stop1);
    if (answers.stop2) stops.push(answers.stop2);
    numberOfStops = stops.length;

    // Calculate total distance (chaining through stops)
    let distanceResult: { miles: number; minutes: number };
    if (stops.length > 0) {
      const waypoints = [answers.pickupPostcode || '', ...stops, answers.destinationPostcode || ''];
      const legs: Promise<{ miles: number; minutes: number }>[] = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        legs.push(getDistance(waypoints[i], waypoints[i + 1]));
      }
      const legResults = await Promise.all(legs);
      distanceResult = {
        miles: legResults.reduce((sum, r) => sum + r.miles, 0),
        minutes: legResults.reduce((sum, r) => sum + r.minutes, 0),
      };
    } else {
      distanceResult = await getDistance(
        answers.pickupPostcode || '',
        answers.destinationPostcode || '',
      );
    }

    distanceMiles = distanceResult.miles;
    durationMinutes = distanceResult.minutes;

    const oneWayCost = pricing.baseFare + distanceResult.miles * pricing.perMileRate;

    // Passenger tier multiplier
    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;

    // Deadhead: driver travel from nearest base
    const deadhead = await getDeadheadFromBase(answers.pickupPostcode || '');
    const threshold = pricing.deadheadThresholdMiles ?? 30;
    const wage = pricing.driverWagePerHour ?? 13;
    let deadheadCost = 0;

    // Stop waiting cost
    const stopWaitCost = numberOfStops * ((pricing.stopWaitingMinutes ?? 10) / 60) * wage;

    if (answers.returnJourney === 'yes') {
      const isSameDay = answers.returnType !== 'no'; // default is yes (same day)

      if (isSameDay) {
        // Same-day return: outbound + return journey + waiting time
        rate = oneWayCost * 2 * passengerMult;

        // Calculate waiting time from pickup and return pickup times
        if (answers.time && answers.returnPickupTime) {
          const pickupMin = parseTimeToMinutes(answers.time);
          const returnMin = parseTimeToMinutes(answers.returnPickupTime);
          const arrivalMin = pickupMin + distanceResult.minutes;
          let waitingMin = returnMin - arrivalMin;

          if (waitingMin > 0) {
            // DVSA break for 9+ passengers: 45-min break after 4.5h driving
            const passengerNum = parseInt(passengerKey) || 1;
            const totalDrivingMin = distanceResult.minutes * 2;
            const dvsaThreshold = pricing.dvsaDrivingThresholdMinutes ?? 270;
            const dvsaBreak = pricing.dvsaBreakMinutes ?? 45;

            if (passengerNum >= 9 && totalDrivingMin > dvsaThreshold) {
              waitingMin += dvsaBreak;
              dvsaBreakApplied = true;
            }

            waitingHours = Math.round((waitingMin / 60) * 10) / 10; // 1 decimal
            rate += (waitingMin / 60) * wage;
          }
        }

        // Deadhead: one round trip from base
        if (deadhead.miles > threshold) {
          deadheadCost = (deadhead.minutes / 60) * 2 * wage;
          deadheadMiles = deadhead.miles;
        }
      } else {
        // Different-day return: two separate one-way trips
        rate = oneWayCost * 2 * passengerMult;

        // Deadhead: two separate round trips from base
        if (deadhead.miles > threshold) {
          deadheadCost = (deadhead.minutes / 60) * 2 * wage * 2;
          deadheadMiles = deadhead.miles;
        }
      }
    } else {
      // One-way journey
      rate = oneWayCost * passengerMult;

      // Deadhead: one round trip from base
      if (deadhead.miles > threshold) {
        deadheadCost = (deadhead.minutes / 60) * 2 * wage;
        deadheadMiles = deadhead.miles;
      }
    }

    rate += deadheadCost + stopWaitCost;

  } else if (service === 'airport') {
    const pickupArea = extractArea(answers.pickupPostcode || '');
    const airportCode = (answers.airport || 'BHX').toUpperCase();

    let baseRate = lookupAirportRate(pickupArea, airportCode);

    // Executive upgrade on base rate before passenger multiplier
    if (answers.vehicleClass === 'executive') {
      baseRate *= 1 + (pricing.executivePercent ?? 30) / 100;
    }

    // Passenger tier multiplier
    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;
    rate = baseRate * passengerMult;

    // Meet and greet surcharge
    if (answers.meetGreet === 'yes') {
      rate += pricing.meetGreetSurcharge;
    }

    // Return journey
    if (answers.returnJourney === 'yes') {
      rate *= pricing.returnMultiplier;
    }

    // Arrival waiting cost (driver waits at airport)
    if (answers.direction === 'yes') {
      const arrivalWait = pricing.arrivalWaitingMinutes ?? 45;
      const wage = pricing.driverWagePerHour ?? 13;
      rate += (arrivalWait / 60) * wage;
    }
  } else {
    throw new Error(`Unknown instant service: ${service}`);
  }

  // Apply surcharges (both services)
  const surchargeResult = calculateSurcharges(answers.date || '', answers.time || '');
  if (surchargeResult.percent > 0) {
    rate *= 1 + surchargeResult.percent / 100;
  }

  // Apply regular booking discount (private-hire only)
  let regularDiscountApplied = false;
  if (service === 'private-hire' && answers.regularBooking === 'yes') {
    const discountPct = pricing.regularDiscountPercent ?? 10;
    rate *= 1 - discountPct / 100;
    regularDiscountApplied = true;
  }

  // Apply minimum booking floor
  let minimumApplied = false;
  const minimum = minimums[service];
  if (minimum && rate < minimum) {
    rate = minimum;
    minimumApplied = true;
  }

  const spread = pricing.rangeSpread;
  const low = Math.round(rate * (1 - spread / 2));
  const high = Math.round(rate * (1 + spread / 2));

  return {
    low,
    high,
    currency: 'GBP',
    perUnit: svcConfig.perUnit,
    distanceMiles,
    durationMinutes,
    waitingHours,
    deadheadMiles,
    dvsaBreakApplied: dvsaBreakApplied || undefined,
    surchargePercent: surchargeResult.percent || undefined,
    surchargeLabels: surchargeResult.labels.length ? surchargeResult.labels : undefined,
    regularDiscountApplied: regularDiscountApplied || undefined,
    minimumApplied: minimumApplied || undefined,
    numberOfStops: numberOfStops || undefined,
  };
}
