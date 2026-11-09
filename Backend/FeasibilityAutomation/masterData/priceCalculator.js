//Charge for one test from its test_prices row (prices exclude GST).
//  hour: rate x max(hours, minimum)
//  test / unit: rate x max(quantity, minimum)
//  plus add_on_rate x add-ons (e.g. CS114 add-on cables)
//rate is the normal (compliance) rate. A price with rate_precompliance uses
//that rate for purpose 'precompliance' (TS2 EMC: 40,000 instead of 80,000 per
//test). When the purpose of such a price is not known the normal rate is used
//and "purpose" is reported missing, so the quote is never too low.

const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const UNIT_NAMES = { hour: "hour", test: "test" };

const PURPOSE_LABELS = { precompliance: "pre-compliance", compliance: "compliance" };

const hasPurposeRates = (price) => toNum(price.rate_precompliance) != null;

function rateFor(price, purpose) {
  if (purpose === "precompliance" && hasPurposeRates(price)) return toNum(price.rate_precompliance);
  return toNum(price.rate) || 0;
}

/**
 * @param price  test_prices row
 * @param {{quantity?: number, hours?: number, addOns?: number, purpose?: string}} request
 *   quantity: tests or units (default 1); hours: test hours, for hourly prices;
 *   purpose: 'precompliance' or 'compliance'
 * @returns {{amount: number, lines: {label: string, qty: number, rate: number, amount: number}[], minimumApplied: boolean, missing: string|null}}
 *   missing names what is needed but not given ("hours", "purpose" or "hours, purpose")
 */
function calculatePrice(price, { quantity, hours, addOns = 0, purpose } = {}) {
  const purposeKnown = purpose === "precompliance" || purpose === "compliance";
  const rate = rateFor(price, purpose);
  const minimum = toNum(price.min_qty) ?? 1;
  const hourly = price.charged_per === "hour";
  const asked = toNum(hourly ? hours : quantity ?? 1);
  const missing =
    [hourly && asked == null && "hours", hasPurposeRates(price) && !purposeKnown && "purpose"].filter(Boolean).join(", ") ||
    null;
  const qty = Math.max(asked ?? 0, minimum);
  const unit = UNIT_NAMES[price.charged_per] || price.unit_label || "unit";
  const label = hasPurposeRates(price) && purposeKnown ? `${price.name}, ${PURPOSE_LABELS[purpose]}` : price.name;

  const lines = [{ label: `${label} (${qty} ${unit}${qty === 1 ? "" : "s"})`, qty, rate, amount: rate * qty }];
  const extra = toNum(addOns) || 0;
  if (extra > 0 && toNum(price.add_on_rate)) {
    const addOnRate = toNum(price.add_on_rate);
    lines.push({ label: `${price.add_on_label || "Add-on"} (${extra})`, qty: extra, rate: addOnRate, amount: addOnRate * extra });
  }
  return {
    amount: lines.reduce((s, l) => s + l.amount, 0),
    lines,
    minimumApplied: (asked ?? 0) < minimum,
    missing,
  };
}

module.exports = { calculatePrice, rateFor };
