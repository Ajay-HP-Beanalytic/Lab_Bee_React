// How a TS1 report is laid out for each family of tests, following the lab's own reports
// (frontend/src/templates/Sample TS1 Testing Reports):
//   first page -> general info -> "It is certified..." chambers (+ test specifications)
//   -> Table 01 EUT/DUT -> Table 02 tests conducted (columns per family) -> notes -> Table 03
//   -> Appendix A photos (sample wise, or all before / setup / during / after)
//   -> test data page + graph (thermal) or controller printouts (vibration, on landscape pages;
//   ESS: pre-vibration photos + printouts, thermal cycling photos + test data + graph,
//   post-vibration photos + printouts) -> disclaimer -> end.

/** "Thermal Cycling Test" -> "THERMAL CYCLING" (the report adds "TEST REPORT" / "TEST PHOTOS") */
export const testTitle = (name) =>
  String(name || "")
    .trim()
    .replace(/\s+tests?$/i, "")
    .toUpperCase();

export const COLUMN_TEXT = {
  eutSerial: "EUT Serial No.",
  test: "Test",
  chamber: "Chamber/Make/Equipment SL no.",
  profile: "Test Profile",
  medium: "Medium Used",
  duration: "Total Duration",
  observation: "After Test Observation",
};

const NOTE_REPRESENTATIVE =
  "Note: All samples tested as per customer test profile and samples handed over to the representative of customer. Reports and Photos are in Appendix A.";
const NOTE_IP = "Note: All samples tested as per customer test profile and after test samples handed over to the customer.\nDetails and Photos are in Appendix A.";
const NOTE_FUNCTIONAL =
  "Note: All samples tested as per customer test profile and samples handed over to the customer for functional check.\nReports and Photos are in Appendix A.";
const GRAPH_TEMP = "NOTE: In the above graph X-axis indicates Date & Time (Hour) and Y-axis indicates Temperature (°C).";

export const FAMILIES = {
  ip: {
    label: "IP / Dust / Water / Rain",
    columns: ["eutSerial", "test", "chamber", "medium", "duration", "observation"],
    notes: NOTE_IP,
    observation: "No Ingress Observed",
    graph: false,
    graphNote: "",
    specs: true,
    photoMode: "sample",
  },
  thermal: {
    label: "Thermal / Climatic (graph)",
    columns: ["eutSerial", "test", "chamber", "profile", "observation"],
    notes: NOTE_REPRESENTATIVE,
    observation: "No Physical Damage Observed",
    graph: true,
    dataPage: true,
    graphNote: GRAPH_TEMP,
    specs: false,
    photoMode: "phase",
  },
  vibration: {
    label: "Vibration / Shock / Bump",
    landscapeGraphs: true,
    columns: ["eutSerial", "test", "chamber", "profile", "observation"],
    notes: NOTE_FUNCTIONAL,
    observation: "No Physical Damage Observed",
    graph: true,
    graphNote: "",
    specs: false,
    photoMode: "sample",
  },
  ess: {
    label: "ESS (Vibration + Thermal Cycling)",
    title: "ENVIRONMENTAL STRESS SCREENING",
    columns: ["eutSerial", "test", "chamber", "profile", "observation"],
    notes: NOTE_REPRESENTATIVE,
    observation: "No Physical Damage Observed",
    graph: true,
    dataPage: true,
    graphNote: GRAPH_TEMP,
    specs: false,
    photoMode: "sample",
    photoGroups: "test", // per sub-test: its photos, then its printouts (usually landscape)
    landscapeGraphs: true,
    table3: { title: "Table 03: Random Vibration", headers: "Batch | Qty | Serial Number", rows: "" },
  },
  saltfog: {
    label: "Salt Fog",
    columns: ["eutSerial", "test", "chamber", "duration", "observation"],
    notes: "Note: All samples tested as per customer test profile and samples handed over to the customer for functional test. Images and details included in Appendix-A.",
    observation: "Refer Table-03",
    graph: false,
    graphNote: "",
    specs: true,
    photoMode: "sample",
    table3: { title: "Table 03: After Test Observation details", headers: "Nomenclature | After Test Observation", rows: "" },
  },
  mechanical: {
    label: "Drop / Toppling",
    columns: ["eutSerial", "test", "chamber", "profile", "observation"],
    notes: NOTE_FUNCTIONAL,
    observation: "No Physical Damage Observed.",
    graph: false,
    graphNote: "",
    specs: false,
    photoMode: "sample",
  },
  general: {
    label: "Other tests",
    columns: ["eutSerial", "test", "chamber", "profile", "observation"],
    notes: NOTE_REPRESENTATIVE,
    observation: "No Physical Damage Observed",
    graph: true,
    graphNote: "",
    specs: false,
    photoMode: "phase",
  },
};

/** How the photos are arranged: "sample" (each sample: before, setup, during, after) or "phase" */
export const photoModeOf = (content) => content?.photoMode || FAMILIES[content?.family]?.photoMode || "phase";

/** Where a report's photos can go, in print order */
export const PHOTO_PLACES = [
  ["before", "Before test"],
  ["setup", "Test setup"],
  ["axis_x", "X-axis"],
  ["axis_y", "Y-axis"],
  ["axis_z", "Z-axis"],
  ["during", "During test"],
  ["after", "After test"],
];
const AXES = ["axis_x", "axis_y", "axis_z"];

// "group" is a sample or an ESS stage; null when all the photos are together
const isThermalStage = (group) => familyOf("", group || "") === "thermal";
const hasAxes = (content, group) => content?.family === "vibration" || (content?.family === "ess" && !isThermalStage(group));

/** The places that can be chosen: vibration has the axes too */
export const placesOffered = (content, group) => PHOTO_PLACES.filter(([k]) => hasAxes(content, group) || !AXES.includes(k));

/** The places in use: chosen in the builder, else the usual ones (a place with photos always stays) */
export const placesShown = (content, group, photos = []) => {
  const saved = content?.photoPlaces?.[group ?? "*"];
  const usual =
    content?.family === "ess" && group
      ? isThermalStage(group)
        ? ["setup"]
        : AXES
      : placesOffered(content, group).map(([k]) => k);
  const chosen = saved || usual;
  return PHOTO_PLACES.filter(([k]) => chosen.includes(k) || photos.some((p) => p.phase === k && (group === null || (p.group || "").trim() === group)));
};

// ESS: vibration, thermal cycling, vibration again; each stage has its photos, then its graphs
const essStages = (content) => {
  const names = (content?.rows || []).map((r) => (r.test || "").trim());
  const vibration = testTitle(names.find((n) => familyOf("", n) === "vibration")).replace(/^(PRE|POST)[-\s]*/, "") || "RANDOM VIBRATION";
  const thermal = testTitle(names.find((n) => familyOf("", n) === "thermal")) || "THERMAL CYCLING";
  return [`PRE-${vibration} TEST SETUP`, `${thermal} TEST SETUP`, `POST-${vibration} TEST SETUP`];
};

/** The samples / batches (or ESS stages) photos start with */
export const defaultSamples = (content) => {
  if (FAMILIES[content?.family]?.photoGroups === "test") return essStages(content);
  const serials = (content?.euts || []).flatMap((e) => String(e.serialNo || "").split(/[,;]/)).map((s) => s.trim()).filter(Boolean);
  return [...new Set(serials)].map((s) => `Sample Serial Number: ${s}`);
};

/** The samples in print order: the report's list, plus any group a photo already has */
export const samplesOf = (content, photos = []) => {
  const base = content?.photoSamples?.length ? content.photoSamples : defaultSamples(content);
  const extra = photos.filter((p) => p.phase !== "graph").map((p) => (p.group || "").trim()).filter(Boolean);
  return [...new Set([...base, ...extra])];
};

/** Table 01 rows as the builder edits them */
export const eutRowsOf = (eutRows = []) =>
  eutRows.map((e) => ({
    nomenclature: e.nomenclature || "",
    qty: String(e.qty ?? ""),
    partNo: e.partNo || "",
    modelNo: e.modelNo || "",
    serialNo: e.serialNo || "",
  }));

/** The family of a test from its category / name */
export const familyOf = (category = "", name = "") => {
  const c = `${category} ${name}`.toLowerCase();
  if (/\bess\b|environmental stress/.test(c)) return "ess";
  if (/salt|fog/.test(c)) return "saltfog";
  if (/vibration|shock|bump/.test(c)) return "vibration";
  if (/drop|toppl/.test(c)) return "mechanical";
  if (/ip tests|\bip ?[0-6x][0-9x]\b|\bipx|ingress|dust|rain|immersion|water test|drip|jet/.test(c)) return "ip";
  if (/thermal|temperature|cold|damp heat|humidity|altitude|cath|tropical|mixed gas|chemical|fluid|dry heat|heat/.test(c)) return "thermal";
  return "general";
};

// IP code in a test name ("IP68", "IPX7", "IP6X")
const ipCodeOf = (text) => (String(text || "").toUpperCase().match(/\bIP ?([0-6X][0-9X])\b/) || [])[1];

/** Starting test specifications for a test, like the lab's reports */
export const specsFor = (testName = "") => {
  const t = testName.toLowerCase();
  const code = ipCodeOf(testName);
  if (/salt|fog/.test(t)) {
    return { title: "TEST SPECIFICATIONS", lines: "Salt solution: 5% ± 1%\nTemperature: 35°C ± 2°C\npH: 6.5 to 7.2\nDuration: " };
  }
  if (/dust/.test(t) || (code && code[0] !== "X" && code[1] === "X")) {
    return { title: `TEST SPECIFICATIONS (${code ? `IP${code}` : "IP6X"})`, lines: "Dust Type: Talcum powder\nDust Quantity: 02kg" };
  }
  if (/immersion|ipx7|ipx8/.test(t) || ["X7", "X8"].includes(code)) {
    return { title: `TEST SPECIFICATION (${code ? `IP${code}` : "IPX7"})`, lines: "Water Depth: 1meter\nImmersion Time: " };
  }
  if (/driving rain/.test(t)) return { title: "TEST PROCEDURE", lines: "Static Pressure: 200 kPa ± 15%\nDuration: " };
  if (/rain|drip|jet|water|ipx[1-6]/.test(t)) return { title: `TEST SPECIFICATION (${code ? `IP${code}` : "IPX5"})`, lines: "Nozzle: \nWater Flow Rate: \nDuration: " };
  return { title: "TEST SPECIFICATIONS", lines: "" };
};

const serialsText = (serials) => {
  const list = String(serials || "")
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 && list.length <= 3 ? list.join(", ") : "Refer Table-01";
};

/** Table 03 as {title, headers: [..], rows: [[..]]} from its text form ("a | b" per line) */
export const table3Of = (t) => {
  if (!t || !String(t.rows || "").trim()) return null;
  const split = (line) => line.split("|").map((x) => x.trim());
  return {
    title: t.title || "Table 03",
    headers: split(t.headers || ""),
    rows: String(t.rows)
      .split("\n")
      .filter((l) => l.trim())
      .map(split),
  };
};

/**
 * What the report's text starts with: family, title, Table 02 rows (one per test, editable),
 * notes, Table 03 and graph note.
 * @param {Array} reportTests - from prepareReportData (testName, eutSerialNo, standard, remarks, duration, testCategory)
 * @param {string} category - the main test's category
 * @param {Array} eutRows - the EUTs of the report (for Table 03 of salt fog)
 */
export const defaultContent = (reportTests = [], category = "", eutRows = []) => {
  const first = reportTests[0] || {};
  const family = familyOf(category || first.testCategory, reportTests.length > 1 ? `${first.testName} ess` : first.testName);
  return fill({ family, rows: [] }, family, reportTests, eutRows);
};

function fill(content, family, reportTests = [], eutRows = []) {
  const f = FAMILIES[family] || FAMILIES.general;
  const first = reportTests[0] || {};
  return {
    ...content,
    family,
    title: content.title || f.title || testTitle(first.testName),
    notes: f.notes,
    graphNote: f.graphNote,
    euts: eutRowsOf(eutRows),
    table3: f.table3
      ? {
          ...f.table3,
          rows:
            family === "saltfog"
              ? eutRows.map((e) => `${e.nomenclature || ""} | No Corrosion Observed`).join("\n")
              : f.table3.rows,
        }
      : null,
    rows: reportTests.map((t) => ({
      testId: t.id || null,
      eutSerial: family === "saltfog" ? "Refer Table-01" : serialsText(t.eutSerialNo),
      test: t.testName || "",
      profile: t.standard || "",
      medium: "",
      duration: t.duration || "",
      observation: t.remarks || f.observation,
      ...(f.specs ? { specs: specsFor(t.testName) } : {}),
    })),
  };
}

/** A content (saved from the last draft, or being edited) fitted to another family */
export const withFamily = (content, family) => {
  const f = FAMILIES[family] || FAMILIES.general;
  const old = FAMILIES[content.family] || FAMILIES.general;
  return {
    ...content,
    family,
    title: !content.title || content.title === old.title ? f.title || content.title : content.title,
    notes: !content.notes || content.notes === old.notes ? f.notes : content.notes,
    graphNote: !content.graphNote || content.graphNote === old.graphNote ? f.graphNote : content.graphNote,
    table3: content.table3 && String(content.table3.rows || "").trim() ? content.table3 : f.table3 ? { ...f.table3 } : content.table3 || null,
    rows: (content.rows || []).map((r) => ({
      ...r,
      observation: !r.observation || r.observation === old.observation ? f.observation : r.observation,
      ...(f.specs && !r.specs ? { specs: specsFor(r.test) } : {}),
    })),
  };
};
