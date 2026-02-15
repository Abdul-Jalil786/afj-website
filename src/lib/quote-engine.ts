import quoteRules from '../data/quote-rules.json';

type ServiceKey = keyof typeof quoteRules.services;

export interface QuoteEstimate {
  low: number;
  high: number;
  currency: string;
  perUnit: string;
}

/**
 * Calculate an estimated price range based on service type and user answers.
 * Each answer maps to a question in quote-rules.json; its selected option
 * carries a multiplier that compounds on the base rate.
 */
export function estimateQuote(
  service: string,
  answers: Record<string, string>,
): QuoteEstimate {
  const serviceKey = service as ServiceKey;
  const config = quoteRules.services[serviceKey];

  if (!config) {
    throw new Error(`Unknown service: ${service}`);
  }

  let rate = config.baseRate;

  for (const question of config.questions) {
    const selectedValue = answers[question.id];
    if (!selectedValue) continue;

    const option = question.options.find((o) => o.value === selectedValue);
    if (option) {
      rate *= option.multiplier;
    }
  }

  const spread = config.rangeSpread;
  const low = Math.round(rate * (1 - spread / 2));
  const high = Math.round(rate * (1 + spread / 2));

  return {
    low,
    high,
    currency: 'GBP',
    perUnit: config.perUnit,
  };
}
