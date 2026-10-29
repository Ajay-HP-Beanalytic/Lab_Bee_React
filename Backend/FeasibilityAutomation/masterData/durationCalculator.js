//Chamber hours for one test, from its parameters. Same formulas as the
//"Environmental Test Duration Calculator" (frontend/src/Quote/TestHoursCalculator.jsx):
//  steady   - high / low temperature, damp heat, altitude, burn-in, per cycle:
//             ramp from start to target + duration + ramp back (+ extra, e.g. pressure change)
//             × cycles (default 1)
//  cycling  - per cycle: start → first extreme, dwell, → other extreme, dwell, → start
//             (every cycle returns to ambient) × cycles
//  shock    - per cycle: (transition + time to reach) + dwell, twice × cycles
//  per_axis - vibration, shock, bump: axes × minutes per axis × units
//  fixed    - salt fog, steps, combined: given duration × runs
//  per_test - charged per test, no hours
//Then + buffer hours (maintenance / setup) only when asked for (addBuffer),
//rounded up to whole hours for the quote, at least the minimum. Missing values are listed, never guessed; values that came from
//the master data instead of the customer are listed as defaults.

const METHODS = {
  steady: "Steady temperature (ramp + duration + ramp back)",
  cycling: "Temperature cycling (back to ambient each cycle)",
  shock: "Thermal shock (transition + dwell)",
  per_axis: "Per axis (vibration, shock, bump)",
  fixed: "Fixed duration",
  per_test: "Charged per test (no hours)",
};

// Parameters per method: key, label, unit, required
const PARAMS = {
  steady: [
    ["start_temp", "Start temperature", "°C"],
    ["target_temp", "Target temperature", "°C", true],
    ["ramp_rate", "Ramp rate", "°C/min", true],
    ["duration_min", "Duration at target", "min", true],
    ["extra_min", "Extra time (e.g. pressure change)", "min"],
    ["cycles", "Number of cycles", ""],
  ],
  cycling: [
    ["start_temp", "Start temperature", "°C"],
    ["high_temp", "High temperature", "°C", true],
    ["low_temp", "Low temperature", "°C", true],
    ["ramp_rate", "Ramp rate", "°C/min", true],
    ["ramp_up_rate", "Ramp up rate (if different)", "°C/min"],
    ["ramp_down_rate", "Ramp down rate (if different)", "°C/min"],
    ["dwell_min", "Dwell at each extreme", "min", true],
    ["dwell_high_min", "Dwell at high (if different)", "min"],
    ["dwell_low_min", "Dwell at low (if different)", "min"],
    ["cycles", "Number of cycles", "", true],
    ["start_from", "Start from (high / low)", ""],
  ],
  shock: [
    ["high_temp", "High temperature", "°C"],
    ["low_temp", "Low temperature", "°C"],
    ["transition_sec", "Transition time", "s", true],
    ["attain_high_min", "Time to reach high", "min"],
    ["attain_low_min", "Time to reach low", "min"],
    ["dwell_min", "Dwell at each extreme", "min", true],
    ["cycles", "Number of cycles", "", true],
  ],
  per_axis: [
    ["axes", "Number of axes", "", true],
    ["minutes_per_axis", "Duration per axis", "min", true],
    ["units", "Units / batches tested one after another", ""],
  ],
  fixed: [
    ["duration_min", "Duration", "min", true],
    ["runs", "Number of runs", ""],
  ],
  per_test: [],
};
const COMMON = [
  ["buffer_hours", "Buffer when added (maintenance / setup)", "h"],
  ["min_hours", "Minimum", "h"],
];

const num = (v) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const r2 = (n) => Math.round(n * 100) / 100;
const fmtMin = (m) => (m >= 120 ? `${r2(m / 60)} h` : `${r2(m)} min`);

// "20@10; 100@5" (kg@°C/min) → fastest ramp the chamber allows for this load
const chamberRampFor = (chamber, loadKg) => {
  if (!chamber) return null;
  const limits = String(chamber.load_limits || "")
    .split(";")
    .map((p) => p.trim().match(/^([\d.]+)\s*@\s*([\d.]+)$/))
    .filter(Boolean)
    .map((m) => ({ kg: Number(m[1]), rate: Number(m[2]) }))
    .sort((a, b) => a.kg - b.kg);
  const load = num(loadKg);
  if (limits.length && load != null) {
    const fit = limits.find((l) => load <= l.kg);
    return fit ? fit.rate : limits[limits.length - 1].rate;
  }
  return num(chamber.temp_ramp_rate);
};

/**
 * @param method     one of METHODS
 * @param layers     parameter sources, lowest priority first:
 *                   [{source: "test type default", values}, {source: "IEC 60068-2-14", values}, {source: "customer", values}]
 * @param chamber    optional ts1_chamber_spec row (temp_ramp_rate, load_limits, chamber_name) to cap the ramp
 * @param loadKg     optional EUT load, for the chamber's load limits
 * @param addBuffer  add the buffer hours (maintenance / setup); off unless a person ticks it
 * @returns {{method, cycleMinutes, cycles, minutes, hours, billedHours, bufferAdded, steps:{label, minutes}[], missing:string[], defaults:string[], notes:string[]}}
 *   cycleMinutes: one cycle (or the whole test when it has no cycles); minutes / hours: total
 */
function calculateDuration({ method, layers = [], chamber = null, loadKg = null, addBuffer = false }) {
  const out = { method, cycleMinutes: null, cycles: null, minutes: null, hours: null, billedHours: null, bufferAdded: false, steps: [], missing: [], defaults: [], notes: [] };
  if (!METHODS[method]) {
    out.missing.push("how the hours are worked out (no duration rule for this test type)");
    return out;
  }
  if (method === "per_test") {
    out.notes.push("Charged per test - no hours needed");
    return out;
  }

  // The value of each parameter from the highest layer that has it
  const p = {};
  const from = {};
  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer?.values || {})) {
      if (v !== null && v !== undefined && v !== "") {
        p[k] = v;
        from[k] = layer.source;
      }
    }
  }
  const defs = [...PARAMS[method], ...COMMON];
  for (const [key, label, unit, required] of defs) {
    if (key === "buffer_hours" && !addBuffer) continue;
    if (p[key] === undefined) {
      if (required) out.missing.push(label);
    } else if (from[key] !== "customer") {
      out.defaults.push(`${label}: ${p[key]}${unit ? ` ${unit}` : ""} (${from[key]})`);
    }
  }
  // Ramp: separate up / down rates can stand in for the common one
  if (method === "cycling" && num(p.ramp_up_rate) && num(p.ramp_down_rate)) {
    out.missing = out.missing.filter((m) => m !== "Ramp rate");
  }
  if (out.missing.length) return out;

  const step = (label, minutes) => out.steps.push({ label, minutes: r2(minutes) });
  const start = num(p.start_temp) ?? 25;

  // Ramp rates, capped at what the chamber can do with this load
  const cap = chamberRampFor(chamber, loadKg);
  const capped = (rate, what) => {
    if (cap && rate > cap) {
      out.notes.push(`${what} ${rate} °C/min is above ${chamber.chamber_name || "the chamber"}'s ${cap} °C/min${num(loadKg) != null ? ` at ${loadKg} kg` : ""}; ${cap} °C/min used`);
      return cap;
    }
    return rate;
  };

  let minutes = 0;
  if (method === "steady") {
    const rate = capped(num(p.ramp_rate), "Ramp rate");
    const target = num(p.target_temp);
    const ramp = Math.abs(target - start) / rate;
    step(`Ramp ${start} → ${target} °C at ${rate} °C/min`, ramp);
    step(`At ${target} °C`, num(p.duration_min));
    step(`Ramp back to ${start} °C`, ramp);
    if (num(p.extra_min)) step("Extra time", num(p.extra_min));
    const cycle = out.steps.reduce((s, x) => s + x.minutes, 0);
    const cycles = num(p.cycles) || 1;
    if (cycles > 1) step(`× ${cycles} cycles`, cycle * (cycles - 1));
    out.cycleMinutes = r2(cycle);
    out.cycles = cycles;
    minutes = cycle * cycles;
  } else if (method === "cycling") {
    const up = capped(num(p.ramp_up_rate) ?? num(p.ramp_rate), "Ramp up rate");
    const down = capped(num(p.ramp_down_rate) ?? num(p.ramp_rate), "Ramp down rate");
    const hi = num(p.high_temp);
    const lo = num(p.low_temp);
    const dHi = num(p.dwell_high_min) ?? num(p.dwell_min);
    const dLo = num(p.dwell_low_min) ?? num(p.dwell_min);
    const cycles = num(p.cycles);
    const leg = (a, b) => Math.abs(b - a) / (b > a ? up : down);
    const lowFirst = String(p.start_from || "high").toLowerCase().startsWith("l") || String(p.start_from).toLowerCase().startsWith("neg");
    const order = lowFirst ? [[lo, dLo], [hi, dHi]] : [[hi, dHi], [lo, dLo]];
    const cycle =
      leg(start, order[0][0]) + order[0][1] + leg(order[0][0], order[1][0]) + order[1][1] + leg(order[1][0], start);
    step(
      `One cycle: ${start} → ${order[0][0]} °C, dwell ${order[0][1]} min, → ${order[1][0]} °C, dwell ${order[1][1]} min, → ${start} °C`,
      cycle,
    );
    step(`× ${cycles} cycles`, cycle * (cycles - 1));
    out.cycleMinutes = r2(cycle);
    out.cycles = cycles;
    minutes = cycle * cycles;
  } else if (method === "shock") {
    const trans = num(p.transition_sec) / 60;
    const dwell = num(p.dwell_min);
    const cycles = num(p.cycles);
    const cycle = trans + (num(p.attain_high_min) || 0) + dwell + trans + (num(p.attain_low_min) || 0) + dwell;
    step(`One cycle: 2 × (${num(p.transition_sec)} s transition + ${dwell} min dwell) + time to reach temperature`, cycle);
    step(`× ${cycles} cycles`, cycle * (cycles - 1));
    out.cycleMinutes = r2(cycle);
    out.cycles = cycles;
    minutes = cycle * cycles;
  } else if (method === "per_axis") {
    const units = num(p.units) || 1;
    minutes = num(p.axes) * num(p.minutes_per_axis) * units;
    step(`${num(p.axes)} axes × ${num(p.minutes_per_axis)} min${units > 1 ? ` × ${units} units` : ""}`, minutes);
  } else if (method === "fixed") {
    const runs = num(p.runs) || 1;
    minutes = num(p.duration_min) * runs;
    step(`${fmtMin(num(p.duration_min))}${runs > 1 ? ` × ${runs} runs` : ""}`, minutes);
  }

  if (out.cycleMinutes == null) {
    out.cycleMinutes = r2(minutes);
    out.cycles = 1;
  }
  const buffer = addBuffer ? num(p.buffer_hours) ?? 0 : 0;
  if (addBuffer && !buffer) out.notes.push("No buffer hours set for this test type");
  out.bufferAdded = buffer > 0;
  const min = num(p.min_hours) ?? 0;
  if (buffer) step("Buffer (maintenance / setup)", buffer * 60);
  const hours = minutes / 60 + buffer;
  out.minutes = r2(minutes + buffer * 60);
  out.hours = r2(hours);
  out.billedHours = Math.max(Math.ceil(hours - 1e-9), min);
  if (out.billedHours > Math.ceil(hours - 1e-9)) out.notes.push(`Minimum ${min} h applied`);
  return out;
}

module.exports = { METHODS, PARAMS, COMMON, calculateDuration, chamberRampFor };
