import quoteRules from '../data/quote-rules.json';

export interface QuoteEstimate {
  low: number;
  high: number;
  currency: string;
  perUnit: string;

  // Journey details (customer-visible)
  distanceMiles?: number;
  durationMinutes?: number;

  // Return scenario
  returnType?: 'split' | 'wait' | 'separate';
  returnMessage?: string;

  // Line items
  journeyCost: number;
  journeyMiles: number;
  journeyMinutes: number;
  returnJourneyCost?: number;
  returnMiles?: number;
  returnMinutes?: number;
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
// London postcode areas map to "LDN" in the distance matrix
const LONDON_AREAS = new Set(['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC']);

function extractArea(input: string): string {
  const trimmed = input.trim().toUpperCase();

  // Try to extract leading letters (postcode area)
  const match = trimmed.match(/^([A-Z]{1,2})/);
  if (match) {
    const area = match[1];
    // Map London postcodes to a single LDN key
    if (LONDON_AREAS.has(area)) return 'LDN';
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
  const distance = fromRow[toArea] ?? fromRow['default'] ?? 50;
  // 50-mile fallback for unknown postcode areas — log so we can identify missing mappings
  if (fromRow[toArea] == null && (matrix['default'] as any)?.[toArea] == null) {
    console.warn(`[quote-engine] Distance fallback used: ${fromArea}\u2192${toArea}, defaulting to ${distance}mi`);
  }
  return distance;
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
 * Uses hardcoded base lat/lng first (no API call needed), then OSRM for driving route.
 * Falls back to distance matrix if OSRM fails.
 */
async function getDeadheadFromBase(pickupPostcode: string): Promise<{ miles: number; minutes: number }> {
  const bases = (quoteRules as any).bases as { name: string; postcode: string; lat: number; lng: number }[];
  if (!bases || !bases.length) return { miles: 0, minutes: 0 };

  const pickupCoords = await fetchCoords(pickupPostcode);
  if (!pickupCoords) {
    // Fallback: use matrix distance from B (Birmingham primary base)
    const pickupArea = extractArea(pickupPostcode);
    const miles = lookupDistance('B', pickupArea);
    const avgSpeedMph = (quoteRules.pricing as any)['private-hire']?.averageSpeedMph || 40;
    return { miles, minutes: Math.round((miles / avgSpeedMph) * 60) };
  }

  // Use hardcoded base coords — no API call needed for base geocoding
  let best: { miles: number; minutes: number } | null = null;

  for (const base of bases) {
    if (base.lat && base.lng) {
      const result = await fetchDrivingMiles(base.lat, base.lng, pickupCoords.lat, pickupCoords.lng);
      if (result && result.miles > 0) {
        const rounded = { miles: Math.round(result.miles), minutes: Math.round(result.minutes) };
        if (!best || rounded.miles < best.miles) {
          best = rounded;
        }
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

/** Round to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calculate a cost-based price for a leg using costPerMile + chargeOutRatePerHour.
 */
function calculateLegCost(miles: number, minutes: number): number {
  const costPerMile = (quoteRules as any).costPerMile ?? 0.45;
  const chargeOutRate = (quoteRules as any).chargeOutRatePerHour ?? 17;
  const hours = minutes / 60;
  return (miles * costPerMile) + (hours * chargeOutRate);
}

/**
 * Calculate an estimated price range for Private Hire or Airport Transfers.
 * Private hire uses a cost-based model (costPerMile + chargeOutRatePerHour).
 * Airport transfers use fixed-rate pricing.
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

  if (!answers.passengers) {
    throw new Error('Number of passengers is required');
  }

  let journeyCost: number;
  let journeyMiles: number;
  let journeyMinutes: number;
  let returnJourneyCost: number | undefined;
  let returnMilesVal: number | undefined;
  let returnMinutesVal: number | undefined;
  let returnTypeVal: 'split' | 'wait' | 'separate' | undefined;
  let returnMessage: string | undefined;
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
    const chargeOutRate = (quoteRules as any).chargeOutRatePerHour ?? 17;
    const deadheadThreshold = (quoteRules as any).deadheadThresholdMiles ?? 30;
    const minGapForSplit = (quoteRules as any).minGapForSplitReturnHours ?? 5;
    const dvsa = (quoteRules as any).dvsa || {};

    // Collect intermediate stops (filter out empty/blank values)
    const stops: string[] = [];
    if (answers.stop1 && answers.stop1.trim()) stops.push(answers.stop1.trim());
    if (answers.stop2 && answers.stop2.trim()) stops.push(answers.stop2.trim());
    numberOfStops = stops.length;

    // Calculate core journey distance (pickup → stops → destination)
    let coreDistance: { miles: number; minutes: number };
    if (stops.length > 0) {
      const waypoints = [answers.pickupPostcode || '', ...stops, answers.destinationPostcode || ''];
      const legs: Promise<{ miles: number; minutes: number }>[] = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        legs.push(getDistance(waypoints[i], waypoints[i + 1]));
      }
      const legResults = await Promise.all(legs);
      coreDistance = {
        miles: legResults.reduce((sum, r) => sum + r.miles, 0),
        minutes: legResults.reduce((sum, r) => sum + r.minutes, 0),
      };
    } else {
      coreDistance = await getDistance(
        answers.pickupPostcode || '',
        answers.destinationPostcode || '',
      );
    }

    // Get deadhead from nearest base
    const deadhead = await getDeadheadFromBase(answers.pickupPostcode || '');
    const deadheadApplies = deadhead.miles > deadheadThreshold;

    // Also get deadhead from destination to base (for return legs)
    const destDeadhead = answers.destinationPostcode
      ? await getDeadheadFromBase(answers.destinationPostcode)
      : { miles: 0, minutes: 0 };

    const passengerKey = answers.passengers || '1-8';
    const passengerMult = pricing.passengerMultipliers[passengerKey] ?? 1.0;

    if (answers.returnJourney === 'yes') {
      const isSameDay = answers.returnType !== 'no';

      if (!isSameDay) {
        // ── SCENARIO 1: Different-day return ──
        // Validate return date is after outbound date
        if (answers.returnDate && answers.date && answers.returnDate <= answers.date) {
          throw new Error('Return date must be after the outbound date');
        }
        // Two completely separate bookings priced independently
        returnTypeVal = 'separate';

        // Outbound: base→pickup→destination→base (deadhead rolled into total)
        let outboundMiles = coreDistance.miles;
        let outboundMinutes = coreDistance.minutes;
        if (deadheadApplies) {
          outboundMiles += deadhead.miles + destDeadhead.miles;
          outboundMinutes += deadhead.minutes + destDeadhead.minutes;
        }

        // Return: base→destination→pickup→base (reverse route, same core distance)
        let returnMiles = coreDistance.miles;
        let returnMin = coreDistance.minutes;
        if (deadheadApplies) {
          returnMiles += destDeadhead.miles + deadhead.miles;
          returnMin += destDeadhead.minutes + deadhead.minutes;
        }

        journeyCost = calculateLegCost(outboundMiles, outboundMinutes) * passengerMult;
        journeyMiles = outboundMiles;
        journeyMinutes = outboundMinutes;

        returnJourneyCost = calculateLegCost(returnMiles, returnMin) * passengerMult;
        returnMilesVal = returnMiles;
        returnMinutesVal = returnMin;

        distanceMiles = outboundMiles + returnMiles;
        durationMinutes = outboundMinutes + returnMin;

      } else {
        // Same-day return — determine SPLIT vs WAIT
        let gapHours = 0;

        if (answers.time && answers.returnPickupTime) {
          const pickupMin = parseTimeToMinutes(answers.time);
          const returnMin = parseTimeToMinutes(answers.returnPickupTime);
          const arrivalMin = pickupMin + coreDistance.minutes;
          const rawWaitingMin = returnMin - arrivalMin;
          gapHours = rawWaitingMin > 0 ? rawWaitingMin / 60 : 0;
        }

        const canSplit = !deadheadApplies || deadhead.miles <= deadheadThreshold;
        const gapLongEnough = gapHours >= minGapForSplit;

        if (canSplit && gapLongEnough) {
          // ── SCENARIO 2: Same-day SPLIT ──
          // Driver returns to base between legs — no waiting charge
          returnTypeVal = 'split';
          returnMessage = 'Your return will be handled as a separate collection \u2014 no waiting charges apply';

          // Leg 1: base → pickup → destination → base
          let leg1Miles = coreDistance.miles;
          let leg1Minutes = coreDistance.minutes;
          if (deadheadApplies) {
            leg1Miles += deadhead.miles + destDeadhead.miles;
            leg1Minutes += deadhead.minutes + destDeadhead.minutes;
          }

          // Leg 2: base → destination → pickup → base
          let leg2Miles = coreDistance.miles;
          let leg2Minutes = coreDistance.minutes;
          if (deadheadApplies) {
            leg2Miles += destDeadhead.miles + deadhead.miles;
            leg2Minutes += destDeadhead.minutes + deadhead.minutes;
          }

          const totalMiles = leg1Miles + leg2Miles;
          const totalMinutes = leg1Minutes + leg2Minutes;

          journeyCost = calculateLegCost(leg1Miles, leg1Minutes) * passengerMult;
          journeyMiles = leg1Miles;
          journeyMinutes = leg1Minutes;

          returnJourneyCost = calculateLegCost(leg2Miles, leg2Minutes) * passengerMult;
          returnMilesVal = leg2Miles;
          returnMinutesVal = leg2Minutes;

          distanceMiles = totalMiles;
          durationMinutes = totalMinutes;

        } else {
          // ── SCENARIO 3: Same-day WAIT ──
          // Driver stays at destination with vehicle
          returnTypeVal = 'wait';

          // Route: base → pickup → destination → (wait) → destination → pickup → base
          let totalMiles = coreDistance.miles * 2; // out and back
          let totalDrivingMinutes = coreDistance.minutes * 2;

          if (deadheadApplies) {
            totalMiles += deadhead.miles + destDeadhead.miles; // base→pickup + destination→base
            totalDrivingMinutes += deadhead.minutes + destDeadhead.minutes;
          }

          journeyCost = calculateLegCost(
            coreDistance.miles + (deadheadApplies ? deadhead.miles : 0),
            coreDistance.minutes + (deadheadApplies ? deadhead.minutes : 0),
          ) * passengerMult;
          journeyMiles = coreDistance.miles + (deadheadApplies ? deadhead.miles : 0);
          journeyMinutes = coreDistance.minutes + (deadheadApplies ? deadhead.minutes : 0);

          const returnCoreMiles = coreDistance.miles + (deadheadApplies ? destDeadhead.miles : 0);
          const returnCoreMin = coreDistance.minutes + (deadheadApplies ? destDeadhead.minutes : 0);
          returnJourneyCost = calculateLegCost(returnCoreMiles, returnCoreMin) * passengerMult;
          returnMilesVal = returnCoreMiles;
          returnMinutesVal = returnCoreMin;

          // Waiting time
          if (gapHours > 0) {
            waitingCostVal = gapHours * chargeOutRate;
            waitingHoursVal = Math.round(gapHours * 10) / 10;
          }

          // DVSA break
          const passengerNum = passengerKey.includes('-')
            ? parseInt(passengerKey.split('-').pop()!) || 1
            : parseInt(passengerKey) || 1;
          const dvsaThresholdHrs = dvsa.breakThresholdHours ?? 4.5;
          const dvsaBreakMin = dvsa.breakDurationMinutes ?? 45;
          const dvsaMinPax = dvsa.minimumPassengers ?? 9;
          if (passengerNum >= dvsaMinPax && (totalDrivingMinutes / 60) > dvsaThresholdHrs) {
            dvsaBreakCostVal = (dvsaBreakMin / 60) * chargeOutRate;
            dvsaBreakApplied = true;
          }

          distanceMiles = totalMiles;
          durationMinutes = totalDrivingMinutes;
        }
      }
    } else {
      // ── ONE-WAY TRIP ──
      // Route: base → pickup → destination → base
      let totalMiles = coreDistance.miles;
      let totalMinutes = coreDistance.minutes;

      if (deadheadApplies) {
        // Round-trip deadhead: base→pickup + destination→base
        totalMiles += deadhead.miles + destDeadhead.miles;
        totalMinutes += deadhead.minutes + destDeadhead.minutes;
      }

      journeyCost = calculateLegCost(totalMiles, totalMinutes) * passengerMult;
      journeyMiles = totalMiles;
      journeyMinutes = totalMinutes;
      distanceMiles = totalMiles;
      durationMinutes = totalMinutes;

      // DVSA break for one-way trips
      const passengerNum = passengerKey.includes('-')
        ? parseInt(passengerKey.split('-').pop()!) || 1
        : parseInt(passengerKey) || 1;
      const dvsaThresholdHrs = dvsa.breakThresholdHours ?? 4.5;
      const dvsaBreakMin = dvsa.breakDurationMinutes ?? 45;
      const dvsaMinPax = dvsa.minimumPassengers ?? 9;
      if (passengerNum >= dvsaMinPax && (totalMinutes / 60) > dvsaThresholdHrs) {
        dvsaBreakCostVal = (dvsaBreakMin / 60) * chargeOutRate;
        dvsaBreakApplied = true;
      }
    }

    // Stop waiting cost
    if (numberOfStops > 0) {
      const stopWaitMin = pricing.stopWaitingMinutes ?? 10;
      additionalStopsCostVal = numberOfStops * (stopWaitMin / 60) * chargeOutRate;
    }

  } else if (service === 'airport') {
    // Airport: keep existing fixed-rate model
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
    journeyCost = baseRate * passengerMult;
    journeyMiles = 0;
    journeyMinutes = 0;

    // Meet and greet
    if (answers.meetGreet === 'yes') {
      meetGreetCostVal = pricing.meetGreetSurcharge;
    }

    // Return journey: additional cost = pre-return total x (multiplier - 1)
    const preReturn = journeyCost + (meetGreetCostVal || 0);
    if (answers.returnJourney === 'yes') {
      returnJourneyCost = preReturn * (pricing.returnMultiplier - 1);
    }

    // Arrival waiting cost
    if (answers.direction === 'yes') {
      const airportChargeOutRate = (quoteRules as any).chargeOutRatePerHour ?? 17;
      airportArrivalCostVal = ((pricing.arrivalWaitingMinutes ?? 45) / 60) * airportChargeOutRate;
    }
  } else {
    throw new Error(`Unknown instant service: ${service}`);
  }

  // Round all individual cost components to 2dp before summing
  journeyCost = round2(journeyCost);
  if (returnJourneyCost != null) returnJourneyCost = round2(returnJourneyCost);
  if (waitingCostVal != null) waitingCostVal = round2(waitingCostVal);
  if (dvsaBreakCostVal != null) dvsaBreakCostVal = round2(dvsaBreakCostVal);
  if (additionalStopsCostVal != null) additionalStopsCostVal = round2(additionalStopsCostVal);
  if (meetGreetCostVal != null) meetGreetCostVal = round2(meetGreetCostVal);
  if (airportArrivalCostVal != null) airportArrivalCostVal = round2(airportArrivalCostVal);

  // Subtotal: sum of all rounded components
  const subtotal = round2(
    journeyCost
    + (returnJourneyCost || 0)
    + (waitingCostVal || 0)
    + (dvsaBreakCostVal || 0)
    + (additionalStopsCostVal || 0)
    + (meetGreetCostVal || 0)
    + (airportArrivalCostVal || 0),
  );

  // Surcharges — for different-day returns, combine surcharges from both legs
  let surchargeCostVal: number | undefined;
  const allSurchargeLabels: string[] = [];
  let totalSurchargePercent = 0;

  if (service === 'private-hire' && returnTypeVal === 'separate') {
    // Apply surcharges independently to each leg
    const outSurcharge = calculateSurcharges(answers.date || '', answers.time || '');
    // Only apply return-leg surcharges when an explicit return date is provided;
    // falling back to the outbound date would double-count the same surcharges.
    const retSurcharge = answers.returnDate
      ? calculateSurcharges(answers.returnDate, answers.returnPickupTime || '')
      : { percent: 0, labels: [] as string[] };

    let totalSurchargeCost = 0;
    if (outSurcharge.percent > 0) {
      totalSurchargeCost += journeyCost * outSurcharge.percent / 100;
    }
    if (retSurcharge.percent > 0 && returnJourneyCost) {
      totalSurchargeCost += returnJourneyCost * retSurcharge.percent / 100;
    }

    if (totalSurchargeCost > 0) {
      surchargeCostVal = round2(totalSurchargeCost);
      // Combine unique labels
      const seen = new Set<string>();
      [...outSurcharge.labels, ...retSurcharge.labels].forEach((l) => {
        if (!seen.has(l)) { seen.add(l); allSurchargeLabels.push(l); }
      });
      totalSurchargePercent = Math.round((surchargeCostVal / subtotal) * 100);
    }
  } else {
    const surchargeResult = calculateSurcharges(answers.date || '', answers.time || '');
    if (surchargeResult.percent > 0) {
      surchargeCostVal = round2(subtotal * surchargeResult.percent / 100);
      allSurchargeLabels.push(...surchargeResult.labels);
      totalSurchargePercent = surchargeResult.percent;
    }
  }

  const afterSurcharge = round2(subtotal + (surchargeCostVal || 0));

  // Regular discount (private-hire only)
  let regularDiscountPct: number | undefined;
  let regularDiscountAmt: number | undefined;
  if (service === 'private-hire' && answers.regularBooking === 'yes') {
    regularDiscountPct = pricing.regularDiscountPercent ?? 10;
    regularDiscountAmt = round2(afterSurcharge * regularDiscountPct / 100);
  }

  let total = round2(afterSurcharge - (regularDiscountAmt || 0));

  // Minimum booking floor
  let minimumApplied = false;
  const minimum = minimums[service];
  if (minimum) {
    if (returnTypeVal === 'separate' && returnJourneyCost != null) {
      // Different-day: apply minimum floor per-leg, not combined
      let adjustment = 0;
      if (journeyCost < minimum) {
        adjustment += minimum - journeyCost;
        minimumApplied = true;
      }
      if (returnJourneyCost < minimum) {
        adjustment += minimum - returnJourneyCost;
        minimumApplied = true;
      }
      total = round2(total + adjustment);
    } else if (total < minimum) {
      total = minimum;
      minimumApplied = true;
    }
  }

  // Guard: no quote component or total should ever be negative
  if (total < 0) {
    console.warn('[quote-engine] Negative total clamped to 0', { total, service });
    total = 0;
  }

  const spread = pricing.rangeSpread;
  const low = Math.max(0, Math.round(total * (1 - spread / 2)));
  const high = Math.max(0, Math.round(total * (1 + spread / 2)));

  return {
    low,
    high,
    currency: 'GBP',
    perUnit: svcConfig.perUnit,
    distanceMiles,
    durationMinutes,
    returnType: returnTypeVal,
    returnMessage,
    journeyCost,
    journeyMiles: journeyMiles!,
    journeyMinutes: journeyMinutes!,
    returnJourneyCost: returnJourneyCost || undefined,
    returnMiles: returnMilesVal,
    returnMinutes: returnMinutesVal,
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
    surchargePercent: totalSurchargePercent || undefined,
    surchargeLabels: allSurchargeLabels.length ? allSurchargeLabels : undefined,
    surchargeCost: surchargeCostVal || undefined,
    regularDiscountPercent: regularDiscountPct,
    regularDiscountAmount: regularDiscountAmt || undefined,
    total,
    minimumApplied: minimumApplied || undefined,
    heavyLuggage: answers.luggage === 'heavy' || undefined,
    wheelchairRequired: answers.wheelchair === 'yes' || undefined,
  };
}
