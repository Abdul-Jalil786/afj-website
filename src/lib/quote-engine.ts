import quoteRules from '../data/quote-rules.json';

export interface QuoteEstimate {
  low: number;
  high: number;
  currency: string;
  perUnit: string;
  distanceMiles?: number;
  durationMinutes?: number;
  baseJourneyCost: number;
  returnJourneyCost?: number;
  deadheadCost?: number;
  deadheadMiles?: number;
  waitingCost?: number;
  waitingHours?: number;
  dvsaBreakCost?: number;
  dvsaBreakApplied?: boolean;
  additionalStopsCost?: number;
  numberOfStops?: number;
  meetGreetCost?: number;
  airportArrivalCost?: number;
  executiveUpgrade?: boolean;
  subtotal: number;
  surchargePercent?: number;
  surchargeLabels?: string[];
  surchargeCost?: number;
  regularDiscountPercent?: number;
  regularDiscountAmount?: number;
  total: number;
  minimumApplied?: boolean;
  heavyLuggage?: boolean;
  wheelchairRequired?: boolean;
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
 * Returns a full itemised breakdown of all cost components.
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

  let baseJourneyCost: number;
  let returnJourneyCost: number | undefined;
  let deadheadCostVal: number | undefined;
  let deadheadMilesVal: number | undefined;
  let waitingCostVal: number | undefined;
  let waitingHoursVal: number | undefined;
  let dvsaBreakCostVal: number | undefined;
  let dvsaBreakApplied = false;
  let additionalStopsCostVal: number | undefined;
  let numberOfStops = 0;
  let meetGreetCostVal: number | undefined;
  let airportArrivalCostVal: number | undefined;
  let executiveUpgrade = false;
  let distanceMiles: number | undefined;
  let durationMinutes: number | undefined;

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

    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;
    const wage = pricing.driverWagePerHour ?? 13;

    // Base one-way journey cost (includes passenger multiplier)
    const oneWay = (pricing.baseFare + distanceResult.miles * pricing.perMileRate) * passengerMult;
    baseJourneyCost = oneWay;

    // Deadhead from nearest base
    const deadhead = await getDeadheadFromBase(answers.pickupPostcode || '');
    const threshold = pricing.deadheadThresholdMiles ?? 30;

    if (answers.returnJourney === 'yes') {
      const isSameDay = answers.returnType !== 'no';
      returnJourneyCost = oneWay;

      if (isSameDay) {
        // Waiting time (separate from DVSA break for itemised display)
        if (answers.time && answers.returnPickupTime) {
          const pickupMin = parseTimeToMinutes(answers.time);
          const returnMin = parseTimeToMinutes(answers.returnPickupTime);
          const arrivalMin = pickupMin + distanceResult.minutes;
          const rawWaitingMin = returnMin - arrivalMin;

          if (rawWaitingMin > 0) {
            waitingCostVal = (rawWaitingMin / 60) * wage;

            const passengerNum = parseInt(passengerKey) || 1;
            const totalDrivingMin = distanceResult.minutes * 2;
            const dvsaThreshold = pricing.dvsaDrivingThresholdMinutes ?? 270;
            const dvsaBreakMin = pricing.dvsaBreakMinutes ?? 45;

            if (passengerNum >= 9 && totalDrivingMin > dvsaThreshold) {
              dvsaBreakCostVal = (dvsaBreakMin / 60) * wage;
              dvsaBreakApplied = true;
            }

            waitingHoursVal = Math.round(((rawWaitingMin + (dvsaBreakApplied ? dvsaBreakMin : 0)) / 60) * 10) / 10;
          }
        }

        // Deadhead: one round trip from base
        if (deadhead.miles > threshold) {
          deadheadCostVal = (deadhead.minutes / 60) * 2 * wage;
          deadheadMilesVal = deadhead.miles;
        }
      } else {
        // Different-day return: two separate round trips from base
        if (deadhead.miles > threshold) {
          deadheadCostVal = (deadhead.minutes / 60) * 2 * wage * 2;
          deadheadMilesVal = deadhead.miles;
        }
      }
    } else {
      // One-way: one round trip from base
      if (deadhead.miles > threshold) {
        deadheadCostVal = (deadhead.minutes / 60) * 2 * wage;
        deadheadMilesVal = deadhead.miles;
      }
    }

    // Stop waiting cost
    if (numberOfStops > 0) {
      additionalStopsCostVal = numberOfStops * ((pricing.stopWaitingMinutes ?? 10) / 60) * wage;
    }

  } else if (service === 'airport') {
    const pickupArea = extractArea(answers.pickupPostcode || '');
    const airportCode = (answers.airport || 'BHX').toUpperCase();

    let baseRate = lookupAirportRate(pickupArea, airportCode);

    // Executive upgrade on base rate before passenger multiplier
    if (answers.vehicleClass === 'executive') {
      baseRate *= 1 + (pricing.executivePercent ?? 30) / 100;
      executiveUpgrade = true;
    }

    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;
    baseJourneyCost = baseRate * passengerMult;

    // Meet and greet
    if (answers.meetGreet === 'yes') {
      meetGreetCostVal = pricing.meetGreetSurcharge;
    }

    // Return journey: additional cost = pre-return total × (multiplier - 1)
    const preReturn = baseJourneyCost + (meetGreetCostVal || 0);
    if (answers.returnJourney === 'yes') {
      returnJourneyCost = preReturn * (pricing.returnMultiplier - 1);
    }

    // Arrival waiting cost
    if (answers.direction === 'yes') {
      const wage = pricing.driverWagePerHour ?? 13;
      airportArrivalCostVal = ((pricing.arrivalWaitingMinutes ?? 45) / 60) * wage;
    }
  } else {
    throw new Error(`Unknown instant service: ${service}`);
  }

  // Subtotal: sum of all components
  const subtotal = baseJourneyCost
    + (returnJourneyCost || 0)
    + (deadheadCostVal || 0)
    + (waitingCostVal || 0)
    + (dvsaBreakCostVal || 0)
    + (additionalStopsCostVal || 0)
    + (meetGreetCostVal || 0)
    + (airportArrivalCostVal || 0);

  // Surcharges (both services)
  const surchargeResult = calculateSurcharges(answers.date || '', answers.time || '');
  let surchargeCostVal: number | undefined;
  if (surchargeResult.percent > 0) {
    surchargeCostVal = subtotal * surchargeResult.percent / 100;
  }

  const afterSurcharge = subtotal + (surchargeCostVal || 0);

  // Regular discount (private-hire only)
  let regularDiscountPct: number | undefined;
  let regularDiscountAmt: number | undefined;
  if (service === 'private-hire' && answers.regularBooking === 'yes') {
    regularDiscountPct = pricing.regularDiscountPercent ?? 10;
    regularDiscountAmt = afterSurcharge * regularDiscountPct / 100;
  }

  let total = afterSurcharge - (regularDiscountAmt || 0);

  // Minimum booking floor
  let minimumApplied = false;
  const minimum = minimums[service];
  if (minimum && total < minimum) {
    total = minimum;
    minimumApplied = true;
  }

  const spread = pricing.rangeSpread;
  const low = Math.round(total * (1 - spread / 2));
  const high = Math.round(total * (1 + spread / 2));

  return {
    low,
    high,
    currency: 'GBP',
    perUnit: svcConfig.perUnit,
    distanceMiles,
    durationMinutes,
    baseJourneyCost,
    returnJourneyCost: returnJourneyCost || undefined,
    deadheadCost: deadheadCostVal || undefined,
    deadheadMiles: deadheadMilesVal,
    waitingCost: waitingCostVal || undefined,
    waitingHours: waitingHoursVal,
    dvsaBreakCost: dvsaBreakCostVal || undefined,
    dvsaBreakApplied: dvsaBreakApplied || undefined,
    additionalStopsCost: additionalStopsCostVal || undefined,
    numberOfStops: numberOfStops || undefined,
    meetGreetCost: meetGreetCostVal || undefined,
    airportArrivalCost: airportArrivalCostVal || undefined,
    executiveUpgrade: executiveUpgrade || undefined,
    subtotal,
    surchargePercent: surchargeResult.percent || undefined,
    surchargeLabels: surchargeResult.labels.length ? surchargeResult.labels : undefined,
    surchargeCost: surchargeCostVal || undefined,
    regularDiscountPercent: regularDiscountPct,
    regularDiscountAmount: regularDiscountAmt || undefined,
    total,
    minimumApplied: minimumApplied || undefined,
    heavyLuggage: answers.luggage === 'heavy' || undefined,
    wheelchairRequired: answers.wheelchair === 'yes' || undefined,
  };
}
