//Charge for one test from its test_prices row (prices exclude GST).
//  hour: rate x max(hours, minimum)
//  test / unit: rate x max(quantity, minimum)
//  plus add_on_rate x add-ons (e.g. CS114 add-on cables)
//For hourly prices the minimum can depend on the purpose: 'precompliance' or
//'compliance' use min_hours_precompliance / min_hours_compliance when set.

const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const UNIT_NAMES = { hour: "hour", test: "test" };

function minimumFor(price, purpose) {
  if (price.charged_per === "hour") {
    if (purpose === "compliance" && toNum(price.min_hours_compliance) != null) return toNum(price.min_hours_compliance);
    if (purpose === "precompliance" && toNum(price.min_hours_precompliance) != null) return toNum(price.min_hours_precompliance);
  }
  return toNum(price.min_qty) ?? 1;
}

/**
 * @param price  test_prices row
 * @param {{quantity?: number, hours?: number, addOns?: number, purpose?: string}} request
 *   quantity: tests or units (default 1); hours: test hours, for hourly prices
 * @returns {{amount: number, lines: {label: string, qty: number, rate: number, amount: number}[], minimumApplied: boolean, missing: string|null}}
 *   missing names what is needed but not given (e.g. hours), in which case the minimum is charged
 */
function calculatePrice(price, { quantity, hours, addOns = 0, purpose } = {}) {
  const rate = toNum(price.rate) || 0;
  const minimum = minimumFor(price, purpose);
  const hourly = price.charged_per === "hour";
  const asked = toNum(hourly ? hours : quantity ?? 1);
  const missing = hourly && asked == null ? "hours" : null;
  const qty = Math.max(asked ?? 0, minimum);
  const unit = UNIT_NAMES[price.charged_per] || price.unit_label || "unit";

  const lines = [{ label: `${price.name} (${qty} ${unit}${qty === 1 ? "" : "s"})`, qty, rate, amount: rate * qty }];
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

module.exports = { calculatePrice, minimumFor };
