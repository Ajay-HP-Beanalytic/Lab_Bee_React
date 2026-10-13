// Unit conversion for values the AI extracted "as written". Arithmetic is done
// here, never by the model.

const TO_CM = { mm: 0.1, cm: 1, m: 100, in: 2.54, ft: 30.48 };
const TO_KG = { g: 0.001, kg: 1, lb: 0.45359237, t: 1000 };

const round = (n, dp = 2) =>
  n === null || n === undefined ? null : Math.round(n * 10 ** dp) / 10 ** dp;

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const toCm = (value, unit) => {
  const n = toNumber(value);
  const f = TO_CM[(unit || "").toLowerCase()];
  return n === null || !f ? null : round(n * f);
};

const toKg = (value, unit) => {
  const n = toNumber(value);
  const f = TO_KG[(unit || "").toLowerCase()];
  return n === null || !f ? null : round(n * f, 3);
};

//Add eut_length_cm / width / height / weight_kg to each extracted EUT item,
//matching the columns of feasibility_request_tests.
const normalizeEut = (item) => ({
  ...item,
  eut_length_cm: toCm(item.length, item.dimension_unit),
  eut_width_cm: toCm(item.width, item.dimension_unit),
  eut_height_cm: toCm(item.height, item.dimension_unit),
  eut_weight_kg: toKg(item.weight, item.weight_unit),
  eut_quantity: toNumber(item.quantity),
});

module.exports = { toCm, toKg, normalizeEut };
