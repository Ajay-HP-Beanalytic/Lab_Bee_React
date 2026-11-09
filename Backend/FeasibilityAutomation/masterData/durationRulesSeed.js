//Starting duration rules, by test type code. They are saved as "not checked";
//the testing team confirms or corrects them on the Test Durations page.
//Defaults follow how the team quotes today: every cycle returns to ambient
//(25 °C), 1 h buffer for maintenance / setup when ticked, rounded up to whole hours.
//The buffer is only added when a person ticks it. The ramp rate comes from the
//customer's spec / standard, so it has no default (values by standard are
//switched off for now; see TestDurationsAPI.js).

const BUFFER = { start_temp: 25, buffer_hours: 1 };

const DURATION_RULES = [
  { code: "HT", method: "steady", params: BUFFER },
  { code: "LT", method: "steady", params: BUFFER },
  { code: "DH", method: "steady", params: BUFFER },
  { code: "ALT", method: "steady", params: BUFFER, notes: "Add the pressure change time as extra time" },
  { code: "BURNIN", method: "steady", params: BUFFER },
  { code: "TC", method: "cycling", params: { ...BUFFER, start_from: "high" } },
  { code: "TSH", method: "shock", params: { buffer_hours: 1 } },
  { code: "TSTEP", method: "fixed", params: { buffer_hours: 1 }, notes: "Duration = sum of all steps" },
  { code: "CATH", method: "fixed", params: { buffer_hours: 1 } },
  { code: "COMB", method: "fixed", params: { buffer_hours: 1 } },
  { code: "VIB", method: "per_axis", params: { axes: 3, buffer_hours: 1, min_hours: 1 } },
  { code: "SHOCK", method: "per_axis", params: { axes: 3, buffer_hours: 1, min_hours: 1 } },
  { code: "BUMP", method: "per_axis", params: { axes: 3, buffer_hours: 1, min_hours: 1 } },
  { code: "SALT", method: "fixed", params: { buffer_hours: 1 } },
  { code: "DUST", method: "fixed", params: { buffer_hours: 1 }, notes: "IEC 60529: 2 h at 40-60 volumes/h, otherwise 8 h" },

  // // Ramp rates asked for by common standards (suggested - check against the standard)
  // { code: "HT", standard: "IEC 60068-2-2", params: { ramp_rate: 1 }, notes: "Rate of change not more than 1 °C/min" },
  // { code: "LT", standard: "IEC 60068-2-1", params: { ramp_rate: 1 }, notes: "Rate of change not more than 1 °C/min" },
  // { code: "TC", standard: "IEC 60068-2-14", params: { ramp_rate: 1 }, notes: "Test Nb: 1 °C/min unless the spec says otherwise" },
  // { code: "HT", standard: "MIL-STD-810", params: { ramp_rate: 3 }, notes: "Not more than 3 °C/min" },
  // { code: "LT", standard: "MIL-STD-810", params: { ramp_rate: 3 }, notes: "Not more than 3 °C/min" },
  // { code: "TC", standard: "MIL-STD-810", params: { ramp_rate: 3 }, notes: "Not more than 3 °C/min" },
];

module.exports = { DURATION_RULES };
