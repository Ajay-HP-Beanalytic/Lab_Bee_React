// TS1 chamber breakdowns and spare parts (frontend JC/Breakdowns).
//
// A breakdown is one failure of a chamber; its parts are what was replaced or
// repaired. A part taken "from stock" reduces the spare's quantity, and every
// change of quantity is a row in ts1_spare_stock_moves. An open breakdown keeps
// the chamber "Under Maintenance" (which takes it out of slot booking); closing
// the last open one sets it back to "Good".
//
// Who: anyone given the "Breakdowns & Spares" menu in Users & Access (TS1 Testing
// to start with). Costs are shown only to Administration and the Lab Manager.

const dayjs = require("dayjs");
const { db } = require("../db");
const { accessOf } = require("../access/accessControl");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);
const fail = (status, message) => Object.assign(new Error(message), { status });

const STATUSES = { open: "Open", waiting_parts: "Waiting for parts", under_repair: "Under repair", closed: "Closed" };
const CATEGORIES = ["Refrigeration", "Heater", "Controller", "Sensor", "Electrical", "Mechanical", "Water / humidity", "Software", "Other"];
const PART_ACTIONS = ["Replaced", "Repaired"];
const UNDER_MAINTENANCE = "Under Maintenance";
const GOOD = "Good";

const text = (v, max = 255) => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};
const number = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const when = (v) => (v && dayjs(v).isValid() ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : null);
const round = (n, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

async function ensureBreakdownTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_spare_parts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      part_name VARCHAR(255) NOT NULL,
      part_no VARCHAR(255),
      make VARCHAR(255),
      category VARCHAR(100),
      unit VARCHAR(30) NOT NULL DEFAULT 'Nos',
      qty_in_hand DECIMAL(12,2) NOT NULL DEFAULT 0,
      min_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
      location VARCHAR(255),
      vendor VARCHAR(255),
      unit_cost DECIMAL(14,2),
      lead_time_days INT,
      notes TEXT,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      updated_by VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) COMMENT='TS1 chamber spare parts and their stock'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_spare_part_chambers (
      spare_id INT NOT NULL,
      chamber_id INT NOT NULL,
      PRIMARY KEY (spare_id, chamber_id)
    ) COMMENT='Which chambers a spare part fits'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_chamber_breakdowns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chamber_id INT NOT NULL,
      chamber_name VARCHAR(1000),
      failed_at DATETIME NOT NULL,
      reported_by VARCHAR(255),
      jc_number VARCHAR(255),
      test_name VARCHAR(1000),
      symptom TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      root_cause TEXT,
      action_taken TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      repaired_at DATETIME,
      vendor VARCHAR(255),
      labour_cost DECIMAL(14,2),
      closed_by VARCHAR(255),
      updated_by VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_breakdown_chamber (chamber_id),
      INDEX idx_breakdown_status (status),
      INDEX idx_breakdown_failed (failed_at)
    ) COMMENT='TS1 chamber breakdowns'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_breakdown_parts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      breakdown_id INT NOT NULL,
      spare_id INT,
      part_name VARCHAR(255) NOT NULL,
      part_no VARCHAR(255),
      make VARCHAR(255),
      qty DECIMAL(12,2) NOT NULL,
      action VARCHAR(20) NOT NULL DEFAULT 'Replaced',
      from_stock TINYINT(1) NOT NULL DEFAULT 0,
      unit_cost DECIMAL(14,2),
      vendor VARCHAR(255),
      lead_time_days INT,
      INDEX idx_bp_breakdown (breakdown_id),
      INDEX idx_bp_spare (spare_id)
    ) COMMENT='Parts replaced or repaired in a breakdown'`);
  await query(`
    CREATE TABLE IF NOT EXISTS ts1_spare_stock_moves (
      id INT AUTO_INCREMENT PRIMARY KEY,
      spare_id INT NOT NULL,
      kind VARCHAR(20) NOT NULL,
      qty DECIMAL(12,2) NOT NULL,
      balance DECIMAL(12,2),
      breakdown_id INT,
      note VARCHAR(1000),
      done_by VARCHAR(255),
      done_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_move_spare (spare_id)
    ) COMMENT='Every change in spare part stock'`);
}

// The menu goes to TS1 Testing once. A row for department 0 remembers that it
// was done, so a menu taken away in Users & Access isn't put back.
async function seedMenu(tries = 6) {
  try {
    const [done] = await query("SELECT 1 FROM labbee_menu_access WHERE subject_id = 0 AND menu_key = 'ts1_breakdowns' LIMIT 1");
    if (done) return;
    const [{ n }] = await query("SELECT COUNT(*) AS n FROM labbee_departments");
    if (!n) throw new Error("departments not ready");
    await query(
      `INSERT IGNORE INTO labbee_menu_access (subject_type, subject_id, menu_key)
       SELECT 'department', id, 'ts1_breakdowns' FROM labbee_departments WHERE name = 'TS1 Testing'`,
    );
    await query("INSERT IGNORE INTO labbee_menu_access (subject_type, subject_id, menu_key) VALUES ('department', 0, 'ts1_breakdowns')");
  } catch (err) {
    if (tries > 1) setTimeout(() => seedMenu(tries - 1), 10000);
    else console.error("Breakdown menu seed failed:", err.message);
  }
}

async function who(req) {
  const access = await accessOf(req.session?.user_id);
  if (!access) throw fail(401, "Please log in again");
  if (!access.menus.includes("ts1_breakdowns")) throw fail(403, "You don't have access to Breakdowns & Spares");
  return { name: access.user.name, canSeeCost: access.isAdmin || access.role === "Lab Manager", isAdmin: access.isAdmin };
}

// ---- Stock ----------------------------------------------------------------------------------

const logMove = async (conn, spareId, kind, qty, { breakdownId = null, note = null, by }) => {
  const [[s]] = await conn.query("SELECT qty_in_hand FROM ts1_spare_parts WHERE id = ?", [spareId]);
  await conn.query(
    "INSERT INTO ts1_spare_stock_moves (spare_id, kind, qty, balance, breakdown_id, note, done_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [spareId, kind, qty, s?.qty_in_hand ?? null, breakdownId, note, by],
  );
};

async function takeFromStock(conn, spareId, qty, breakdownId, by) {
  const [res] = await conn.query("UPDATE ts1_spare_parts SET qty_in_hand = qty_in_hand - ? WHERE id = ? AND qty_in_hand >= ?", [qty, spareId, qty]);
  if (!res.affectedRows) {
    const [[s]] = await conn.query("SELECT part_name, qty_in_hand FROM ts1_spare_parts WHERE id = ?", [spareId]);
    throw fail(409, `Only ${Number(s?.qty_in_hand || 0)} of ${s?.part_name || "this part"} in stock. Add the stock received first, or untick "From stock".`);
  }
  await logMove(conn, spareId, "used", -qty, { breakdownId, by });
}

async function giveBack(conn, spareId, qty, breakdownId, by) {
  await conn.query("UPDATE ts1_spare_parts SET qty_in_hand = qty_in_hand + ? WHERE id = ?", [qty, spareId]);
  await logMove(conn, spareId, "returned", qty, { breakdownId, by });
}

// ---- Breakdowns -----------------------------------------------------------------------------

function cleanBreakdown(b) {
  const out = {
    failed_at: when(b.failed_at),
    symptom: text(b.symptom, 5000),
    category: b.category,
    status: b.status || "open",
    jc_number: text(b.jc_number),
    test_name: text(b.test_name, 1000),
    root_cause: text(b.root_cause, 5000),
    action_taken: text(b.action_taken, 5000),
    repaired_at: when(b.repaired_at),
    vendor: text(b.vendor),
  };
  if (!parseInt(b.chamber_id)) throw fail(400, "Choose the chamber");
  if (!out.failed_at) throw fail(400, "Enter when it broke down");
  if (dayjs(out.failed_at).isAfter(dayjs().add(1, "minute"))) throw fail(400, "The breakdown time can't be in the future");
  if (!out.symptom) throw fail(400, "Say what happened");
  if (!CATEGORIES.includes(out.category)) throw fail(400, "Choose what kind of failure it was");
  if (!STATUSES[out.status]) throw fail(400, "Unknown status");
  if (out.repaired_at && dayjs(out.repaired_at).isBefore(out.failed_at)) throw fail(400, "The repair can't be before the breakdown");
  if (out.repaired_at && dayjs(out.repaired_at).isAfter(dayjs().add(1, "minute"))) throw fail(400, "The repair time can't be in the future");
  if (out.status === "closed") {
    if (!out.repaired_at) throw fail(400, "To close it, enter when it was repaired");
    if (!out.root_cause) throw fail(400, "To close it, enter the root cause");
    if (!out.action_taken) throw fail(400, "To close it, enter the action taken");
  } else {
    out.repaired_at = null;
  }
  return out;
}

const cleanParts = (list) =>
  (Array.isArray(list) ? list : []).map((p) => {
    const qty = number(p.qty);
    const spareId = parseInt(p.spare_id) || null;
    const part = {
      id: parseInt(p.id) || null,
      spare_id: spareId,
      part_name: text(p.part_name),
      part_no: text(p.part_no),
      make: text(p.make),
      qty,
      action: PART_ACTIONS.includes(p.action) ? p.action : "Replaced",
      from_stock: spareId && p.from_stock ? 1 : 0,
      unit_cost: number(p.unit_cost),
      vendor: text(p.vendor),
      lead_time_days: parseInt(p.lead_time_days) >= 0 ? parseInt(p.lead_time_days) : null,
    };
    if (!part.part_name) throw fail(400, "Enter the name of every part");
    if (!(qty > 0)) throw fail(400, `Enter the quantity of ${part.part_name}`);
    return part;
  });

// Bring the saved parts in line with the form, moving stock for the differences
async function saveParts(conn, breakdownId, parts, me) {
  const [existing] = await conn.query("SELECT * FROM ts1_breakdown_parts WHERE breakdown_id = ? FOR UPDATE", [breakdownId]);
  const keep = new Set(parts.map((p) => p.id).filter(Boolean));
  for (const old of existing) {
    if (keep.has(old.id)) continue;
    if (old.from_stock) await giveBack(conn, old.spare_id, Number(old.qty), breakdownId, me.name);
    await conn.query("DELETE FROM ts1_breakdown_parts WHERE id = ?", [old.id]);
  }
  for (const p of parts) {
    const old = existing.find((x) => x.id === p.id);
    if (p.id && !old) throw fail(400, "A part on this form is no longer on the breakdown. Reload and try again.");
    let spareCost = null;
    if (p.spare_id) {
      const [[spare]] = await conn.query("SELECT unit_cost FROM ts1_spare_parts WHERE id = ?", [p.spare_id]);
      if (!spare) throw fail(400, `${p.part_name} is not in the spare parts list`);
      spareCost = spare.unit_cost;
    }
    const sameStock = old && old.from_stock && p.from_stock && old.spare_id === p.spare_id;
    if (sameStock) {
      const delta = p.qty - Number(old.qty);
      if (delta > 0) await takeFromStock(conn, p.spare_id, delta, breakdownId, me.name);
      if (delta < 0) await giveBack(conn, p.spare_id, -delta, breakdownId, me.name);
    } else {
      if (old?.from_stock) await giveBack(conn, old.spare_id, Number(old.qty), breakdownId, me.name);
      if (p.from_stock) await takeFromStock(conn, p.spare_id, p.qty, breakdownId, me.name);
    }
    const { id, ...values } = p;
    values.unit_cost = me.canSeeCost ? p.unit_cost ?? spareCost : old ? old.unit_cost : spareCost; // others can't see or set it
    if (old) await conn.query("UPDATE ts1_breakdown_parts SET ? WHERE id = ?", [values, old.id]);
    else await conn.query("INSERT INTO ts1_breakdown_parts SET ?", [{ ...values, breakdown_id: breakdownId }]);
  }
}

// An open breakdown holds the chamber; when the last one ends it is Good again
async function syncChambers(conn, { hold = [], release = [] }) {
  for (const id of hold) await conn.query("UPDATE chamber_calibration SET chamber_status = ? WHERE id = ?", [UNDER_MAINTENANCE, id]);
  for (const id of release) {
    if (hold.includes(id)) continue;
    const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM ts1_chamber_breakdowns WHERE chamber_id = ? AND status <> 'closed'", [id]);
    if (!n) await conn.query("UPDATE chamber_calibration SET chamber_status = ? WHERE id = ?", [GOOD, id]);
  }
}

async function inTransaction(work) {
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    const out = await work(conn);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function saveBreakdown(req) {
  const me = await who(req);
  const id = parseInt(req.params.id) || null;
  const b = req.body || {};
  const row = cleanBreakdown(b);
  const parts = cleanParts(b.parts);
  return inTransaction(async (conn) => {
    const [[chamber]] = await conn.query("SELECT id, chamber_name, chamber_id FROM chamber_calibration WHERE id = ?", [parseInt(b.chamber_id)]);
    if (!chamber) throw fail(400, "That chamber is not in the list");
    let before = null;
    if (id) {
      [[before]] = await conn.query("SELECT * FROM ts1_chamber_breakdowns WHERE id = ? FOR UPDATE", [id]);
      if (!before) throw fail(404, "Breakdown not found");
    }
    const values = {
      ...row,
      chamber_id: chamber.id,
      chamber_name: chamber.chamber_name,
      reported_by: before ? before.reported_by : text(b.reported_by) || me.name,
      updated_by: me.name,
      closed_by: row.status === "closed" ? (before?.status === "closed" ? before.closed_by : me.name) : null,
    };
    if (me.canSeeCost) values.labour_cost = number(b.labour_cost);
    let breakdownId = id;
    if (id) await conn.query("UPDATE ts1_chamber_breakdowns SET ? WHERE id = ?", [values, id]);
    else breakdownId = (await conn.query("INSERT INTO ts1_chamber_breakdowns SET ?", [values]))[0].insertId;
    await saveParts(conn, breakdownId, parts, me);
    const open = row.status !== "closed";
    const wasOpen = before && before.status !== "closed";
    await syncChambers(conn, {
      hold: open ? [chamber.id] : [],
      release: wasOpen && (!open || before.chamber_id !== chamber.id) ? [before.chamber_id] : [],
    });
    return { id: breakdownId };
  });
}

async function deleteBreakdown(req) {
  const me = await who(req);
  if (!me.canSeeCost) throw fail(403, "Only Administration and the Lab Manager can delete a breakdown");
  const id = parseInt(req.params.id);
  return inTransaction(async (conn) => {
    const [[before]] = await conn.query("SELECT * FROM ts1_chamber_breakdowns WHERE id = ? FOR UPDATE", [id]);
    if (!before) throw fail(404, "Breakdown not found");
    await saveParts(conn, id, [], me);
    await conn.query("DELETE FROM ts1_chamber_breakdowns WHERE id = ?", [id]);
    await syncChambers(conn, { release: before.status !== "closed" ? [before.chamber_id] : [] });
    return { deleted: true };
  });
}

const partOut = (me) => ({ unit_cost, qty, ...p }) => ({ ...p, qty: Number(qty), from_stock: !!p.from_stock, ...(me.canSeeCost ? { unit_cost: unit_cost == null ? null : Number(unit_cost) } : {}) });

async function loadBreakdowns(me) {
  const rows = await query(
    `SELECT b.*, c.chamber_id AS chamber_code FROM ts1_chamber_breakdowns b
     LEFT JOIN chamber_calibration c ON c.id = b.chamber_id
     ORDER BY (b.status = 'closed'), b.failed_at DESC`,
  );
  const parts = rows.length ? await query("SELECT * FROM ts1_breakdown_parts WHERE breakdown_id IN (?) ORDER BY id", [rows.map((r) => r.id)]) : [];
  const now = dayjs();
  return rows.map(({ labour_cost, ...r }) => ({
    ...r,
    status_label: STATUSES[r.status] || r.status,
    downtime_hours: round(dayjs(r.repaired_at || now).diff(dayjs(r.failed_at), "hour", true)),
    ...(me.canSeeCost ? { labour_cost: labour_cost == null ? null : Number(labour_cost) } : {}),
    parts: parts.filter((p) => p.breakdown_id === r.id).map(partOut(me)),
  }));
}

async function meta(req) {
  const me = await who(req);
  const [chambers, jobcards] = await Promise.all([
    query("SELECT id, chamber_name, chamber_id, chamber_status FROM chamber_calibration ORDER BY chamber_name"),
    query("SELECT jc_number FROM bea_jobcards WHERE jc_category = 'TS1' AND (jc_status IS NULL OR jc_status NOT IN ('Close', 'Closed')) ORDER BY id DESC LIMIT 300"),
  ]);
  return { chambers, jobcards: jobcards.map((j) => j.jc_number), categories: CATEGORIES, statuses: STATUSES, partActions: PART_ACTIONS, me };
}

// ---- Spare parts ----------------------------------------------------------------------------

async function loadSpares(me, { all = false } = {}) {
  const rows = await query(`SELECT * FROM ts1_spare_parts ${all ? "" : "WHERE is_active = 1"} ORDER BY part_name`);
  const fits = await query(
    `SELECT f.spare_id, c.id, c.chamber_name, c.chamber_id FROM ts1_spare_part_chambers f JOIN chamber_calibration c ON c.id = f.chamber_id`,
  );
  return rows.map(({ unit_cost, qty_in_hand, min_qty, ...r }) => ({
    ...r,
    qty_in_hand: Number(qty_in_hand),
    min_qty: Number(min_qty),
    low: Number(qty_in_hand) <= Number(min_qty),
    chambers: fits.filter((f) => f.spare_id === r.id).map((f) => ({ id: f.id, name: f.chamber_name, code: f.chamber_id })),
    ...(me.canSeeCost ? { unit_cost: unit_cost == null ? null : Number(unit_cost) } : {}),
  }));
}

const setFits = async (conn, spareId, chamberIds) => {
  await conn.query("DELETE FROM ts1_spare_part_chambers WHERE spare_id = ?", [spareId]);
  const ids = [...new Set((Array.isArray(chamberIds) ? chamberIds : []).map(Number).filter(Boolean))];
  if (ids.length) await conn.query("INSERT INTO ts1_spare_part_chambers (spare_id, chamber_id) VALUES ?", [ids.map((c) => [spareId, c])]);
};

const spareFields = (b, me) => {
  const out = {
    part_name: text(b.part_name),
    part_no: text(b.part_no),
    make: text(b.make),
    category: text(b.category, 100),
    unit: text(b.unit, 30) || "Nos",
    min_qty: number(b.min_qty) ?? 0,
    location: text(b.location),
    vendor: text(b.vendor),
    lead_time_days: parseInt(b.lead_time_days) >= 0 ? parseInt(b.lead_time_days) : null,
    notes: text(b.notes, 2000),
    updated_by: me.name,
  };
  if (me.canSeeCost) out.unit_cost = number(b.unit_cost);
  if (!out.part_name) throw fail(400, "Enter the part name");
  if (out.min_qty < 0) throw fail(400, "The minimum stock can't be negative");
  return out;
};

async function findSame(conn, { part_no, part_name }, exceptId = 0) {
  const [[same]] = part_no
    ? await conn.query("SELECT * FROM ts1_spare_parts WHERE LOWER(part_no) = LOWER(?) AND is_active = 1 AND id <> ? LIMIT 1", [part_no, exceptId])
    : await conn.query("SELECT * FROM ts1_spare_parts WHERE LOWER(part_name) = LOWER(?) AND part_no IS NULL AND is_active = 1 AND id <> ? LIMIT 1", [part_name, exceptId]);
  return same;
}

async function saveSpare(req) {
  const me = await who(req);
  const id = parseInt(req.params.id) || null;
  const b = req.body || {};
  const values = spareFields(b, me);
  return inTransaction(async (conn) => {
    if (await findSame(conn, values, id || 0)) throw fail(409, `${values.part_no || values.part_name} is already in the spare parts list`);
    let spareId = id;
    if (id) {
      const [res] = await conn.query("UPDATE ts1_spare_parts SET ? WHERE id = ?", [values, id]);
      if (!res.affectedRows) throw fail(404, "Spare part not found");
    } else {
      const opening = number(b.opening_qty) ?? 0;
      if (opening < 0) throw fail(400, "The stock can't be negative");
      spareId = (await conn.query("INSERT INTO ts1_spare_parts SET ?", [{ ...values, qty_in_hand: opening }]))[0].insertId;
      await logMove(conn, spareId, "opening", opening, { by: me.name, note: "Opening stock" });
    }
    await setFits(conn, spareId, b.chamber_ids);
    return { id: spareId };
  });
}

async function removeSpare(req) {
  const me = await who(req);
  const res = await query("UPDATE ts1_spare_parts SET is_active = 0, updated_by = ? WHERE id = ?", [me.name, parseInt(req.params.id)]);
  if (!res.affectedRows) throw fail(404, "Spare part not found");
  return { removed: true };
}

// received: stock came in; adjust: the quantity counted on the shelf
async function changeStock(req) {
  const me = await who(req);
  const id = parseInt(req.params.id);
  const { kind, note } = req.body || {};
  const qty = number(req.body?.qty);
  return inTransaction(async (conn) => {
    const [[spare]] = await conn.query("SELECT * FROM ts1_spare_parts WHERE id = ? AND is_active = 1 FOR UPDATE", [id]);
    if (!spare) throw fail(404, "Spare part not found");
    let delta;
    if (kind === "received") {
      if (!(qty > 0)) throw fail(400, "Enter the quantity received");
      delta = qty;
    } else if (kind === "adjust") {
      if (qty == null || qty < 0) throw fail(400, "Enter the quantity counted");
      if (!text(note)) throw fail(400, "Say why the stock is corrected");
      delta = qty - Number(spare.qty_in_hand);
      if (!delta) throw fail(409, "The stock is already that quantity");
    } else throw fail(400, "Unknown stock change");
    await conn.query("UPDATE ts1_spare_parts SET qty_in_hand = qty_in_hand + ?, updated_by = ? WHERE id = ?", [delta, me.name, id]);
    await logMove(conn, id, kind, delta, { by: me.name, note: text(note, 1000) });
    return { qty_in_hand: Number(spare.qty_in_hand) + delta };
  });
}

const stockMoves = async (req) => {
  await who(req);
  return query(
    `SELECT m.*, b.chamber_name FROM ts1_spare_stock_moves m LEFT JOIN ts1_chamber_breakdowns b ON b.id = m.breakdown_id
     WHERE m.spare_id = ? ORDER BY m.id DESC LIMIT 200`,
    [parseInt(req.params.id)],
  );
};

// Rows read from an Excel file. New parts get the quantity as opening stock;
// parts already listed keep their stock and only their details change.
async function importSpares(req) {
  const me = await who(req);
  const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 3000) : [];
  if (!rows.length) throw fail(400, "No rows found in the file");
  const chambers = await query("SELECT id, chamber_name, chamber_id FROM chamber_calibration");
  const byName = new Map();
  for (const c of chambers) {
    if (c.chamber_id) byName.set(String(c.chamber_id).trim().toLowerCase(), c.id);
    if (c.chamber_name) byName.set(String(c.chamber_name).trim().toLowerCase(), c.id);
  }
  return inTransaction(async (conn) => {
    const out = { added: 0, updated: 0, problems: [] };
    for (const [i, row] of rows.entries()) {
      const line = `Row ${i + 2}`;
      if (!text(row.part_name)) {
        out.problems.push(`${line}: no part name, skipped`);
        continue;
      }
      const values = spareFields(row, me);
      const names = String(row.chambers || "").split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      const chamberIds = names.map((n) => byName.get(n.toLowerCase())).filter(Boolean);
      const unknown = names.filter((n) => !byName.has(n.toLowerCase()));
      if (unknown.length) out.problems.push(`${line}: chamber not found: ${unknown.join(", ")}`);
      const same = await findSame(conn, values);
      let id = same?.id;
      if (same) {
        await conn.query("UPDATE ts1_spare_parts SET ? WHERE id = ?", [values, id]);
        out.updated += 1;
      } else {
        const opening = Math.max(number(row.qty) ?? 0, 0);
        id = (await conn.query("INSERT INTO ts1_spare_parts SET ?", [{ ...values, qty_in_hand: opening }]))[0].insertId;
        await logMove(conn, id, "opening", opening, { by: me.name, note: "Imported from Excel" });
        out.added += 1;
      }
      if (names.length) await setFits(conn, id, chamberIds);
    }
    return out;
  });
}

// ---- Dashboard ------------------------------------------------------------------------------

const countBy = (items, keyOf, weight = () => 1, limit = 10) =>
  [...items.reduce((m, it) => {
    const k = String(keyOf(it) || "").trim() || "Not given";
    return m.set(k, (m.get(k) || 0) + weight(it));
  }, new Map())]
    .map(([name, value]) => ({ name, value: round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

// Stock to keep: a part's use during its lead time (a month if not known), plus one
const suggestedMin = (usedPerYear, leadDays) => Math.ceil((usedPerYear / 365) * (leadDays || 30)) + 1;

async function dashboard(req) {
  const me = await who(req);
  const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 1500);
  const now = dayjs();
  const since = now.subtract(days, "day").startOf("day");
  const periodHours = now.diff(since, "hour", true);
  const yearAgo = now.subtract(365, "day");

  const [all, chambers, spares] = await Promise.all([
    loadBreakdowns(me),
    query("SELECT id, chamber_name, chamber_id, chamber_status FROM chamber_calibration"),
    loadSpares(me),
  ]);
  const open = all.filter((b) => b.status !== "closed");
  const inPeriod = all.filter((b) => !dayjs(b.failed_at).isBefore(since));
  // Hours each breakdown kept its chamber down inside the period
  const downIn = (b) => {
    const from = dayjs(b.failed_at).isBefore(since) ? since : dayjs(b.failed_at);
    const to = b.repaired_at ? dayjs(b.repaired_at) : now;
    return to.isBefore(since) ? 0 : Math.max(to.diff(from, "hour", true), 0);
  };
  const touching = all.filter((b) => downIn(b) > 0);
  const repaired = all.filter((b) => b.repaired_at && !dayjs(b.repaired_at).isBefore(since));
  const repairHours = repaired.map((b) => b.downtime_hours);
  const totalDown = touching.reduce((s, b) => s + downIn(b), 0);
  const partsCost = (b) => b.parts.reduce((s, p) => s + (p.unit_cost || 0) * p.qty, 0);

  const unit = days <= 31 ? "day" : days <= 183 ? "week" : "month";
  const slots = new Map();
  for (let d = since.startOf(unit); !d.isAfter(now); d = d.add(1, unit)) slots.set(d.format("YYYY-MM-DD"), { label: d.format(unit === "month" ? "MMM YY" : "DD MMM"), a: 0, b: 0 });
  const addTo = (date, key) => {
    const s = slots.get(dayjs(date).startOf(unit).format("YYYY-MM-DD"));
    if (s) s[key] += 1;
  };
  inPeriod.forEach((b) => addTo(b.failed_at, "a"));
  repaired.forEach((b) => addTo(b.repaired_at, "b"));

  const perChamber = chambers
    .map((c) => {
      const failures = inPeriod.filter((b) => b.chamber_id === c.id);
      const down = touching.filter((b) => b.chamber_id === c.id).reduce((s, b) => s + downIn(b), 0);
      const fixed = repaired.filter((b) => b.chamber_id === c.id);
      return {
        id: c.id,
        name: c.chamber_id || c.chamber_name,
        failures: failures.length,
        down_hours: round(down),
        mttr_hours: fixed.length ? round(fixed.reduce((s, b) => s + b.downtime_hours, 0) / fixed.length) : null,
        mtbf_hours: failures.length ? round((periodHours - down) / failures.length) : null,
        availability: round(Math.max(0, 1 - down / periodHours) * 100),
        ...(me.canSeeCost ? { cost: round(failures.reduce((s, b) => s + partsCost(b) + (b.labour_cost || 0), 0), 0) } : {}),
      };
    })
    .filter((c) => c.failures || c.down_hours)
    .sort((a, b) => b.down_hours - a.down_hours);

  // What to keep on the shelf, from the last 12 months of use
  const yearParts = all.filter((b) => dayjs(b.failed_at).isAfter(yearAgo)).flatMap((b) => b.parts.filter((p) => p.action === "Replaced"));
  const used = new Map();
  for (const p of yearParts) {
    const k = p.spare_id ? `s${p.spare_id}` : `n${p.part_name.toLowerCase()}`;
    const u = used.get(k) || { spare_id: p.spare_id, name: p.part_name, qty: 0, lead: [] };
    u.qty += p.qty;
    if (p.lead_time_days != null) u.lead.push(p.lead_time_days);
    used.set(k, u);
  }
  const reorder = [...used.values()]
    .map((u) => {
      const spare = spares.find((s) => s.id === u.spare_id);
      const lead = u.lead.length ? Math.max(...u.lead) : spare?.lead_time_days ?? null;
      const suggested = suggestedMin(u.qty, lead);
      return {
        name: u.name, used_12m: u.qty, lead_days: lead, listed: !!spare, in_hand: spare?.qty_in_hand ?? 0, min_qty: spare?.min_qty ?? null,
        suggested, short_by: Math.max(suggested - (spare?.qty_in_hand ?? 0), 0),
      };
    })
    .sort((a, b) => b.short_by - a.short_by || b.used_12m - a.used_12m);

  const periodParts = inPeriod.flatMap((b) => b.parts);
  const costs = me.canSeeCost
    ? {
        parts: round(inPeriod.reduce((s, b) => s + partsCost(b), 0), 0),
        labour: round(inPeriod.reduce((s, b) => s + (b.labour_cost || 0), 0), 0),
        stock_value: round(spares.reduce((s, x) => s + (x.unit_cost || 0) * x.qty_in_hand, 0), 0),
      }
    : null;

  return {
    days,
    canSeeCost: me.canSeeCost,
    now: {
      open: open.length,
      chambers_down: new Set(open.map((b) => b.chamber_id)).size,
      waiting_parts: open.filter((b) => b.status === "waiting_parts").length,
      oldest_open_hours: open.length ? Math.max(...open.map((b) => b.downtime_hours)) : null,
      low_stock: spares.filter((s) => s.low).length,
      out_of_stock: spares.filter((s) => s.qty_in_hand <= 0).length,
    },
    period: {
      breakdowns: inPeriod.length,
      repaired: repaired.length,
      down_hours: round(totalDown),
      mttr_hours: repairHours.length ? round(repairHours.reduce((s, x) => s + x, 0) / repairHours.length) : null,
      availability: chambers.length ? round(Math.max(0, 1 - totalDown / (periodHours * chambers.length)) * 100) : null,
      costs,
    },
    trend: [...slots.values()],
    by_category: countBy(inPeriod, (b) => b.category),
    down_by_chamber: perChamber.map((c) => ({ name: c.name, value: c.down_hours })),
    top_parts: countBy(periodParts, (p) => p.part_name, (p) => p.qty, 100),
    long_lead: [...new Map(periodParts.filter((p) => p.lead_time_days).sort((a, b) => b.lead_time_days - a.lead_time_days).map((p) => [p.part_name, p])).values()]
      .map((p) => ({ name: p.part_name, value: p.lead_time_days })),
    chambers: perChamber,
    reorder,
    low_stock: spares.filter((s) => s.low).map((s) => ({ id: s.id, name: s.part_name, part_no: s.part_no, in_hand: s.qty_in_hand, min_qty: s.min_qty, lead_days: s.lead_time_days, vendor: s.vendor })),
  };
}

// ---- Excel export (the file is made in the browser) ------------------------------------------

async function exportAll(req) {
  const me = await who(req);
  const [breakdowns, spares, moves] = await Promise.all([
    loadBreakdowns(me),
    loadSpares(me),
    query(
      `SELECT m.*, s.part_name, s.part_no, b.chamber_name FROM ts1_spare_stock_moves m
       JOIN ts1_spare_parts s ON s.id = m.spare_id
       LEFT JOIN ts1_chamber_breakdowns b ON b.id = m.breakdown_id ORDER BY m.id`,
    ),
  ]);
  return { canSeeCost: me.canSeeCost, breakdowns, spares, moves };
}

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (err) {
    if (!err.status) console.error("Chamber breakdowns error:", err);
    if (!res.headersSent) res.status(err.status || 500).json({ error: err.status ? err.message : "Something went wrong with chamber breakdowns" });
  }
};

function chamberBreakdownsAPIs(app) {
  ensureBreakdownTables()
    .then(() => seedMenu())
    .catch((err) => console.error("Chamber breakdown tables error:", err));
  app.get("/api/ts1/breakdowns/meta", handle(meta));
  app.get("/api/ts1/breakdowns/dashboard", handle(dashboard));
  app.get("/api/ts1/breakdowns/export", handle(exportAll));
  app.get("/api/ts1/breakdowns", handle(async (req) => loadBreakdowns(await who(req))));
  app.post("/api/ts1/breakdowns", handle(saveBreakdown));
  app.put("/api/ts1/breakdowns/:id", handle(saveBreakdown));
  app.delete("/api/ts1/breakdowns/:id", handle(deleteBreakdown));
  app.get("/api/ts1/spares", handle(async (req) => loadSpares(await who(req))));
  app.post("/api/ts1/spares/import", handle(importSpares));
  app.post("/api/ts1/spares", handle(saveSpare));
  app.put("/api/ts1/spares/:id", handle(saveSpare));
  app.delete("/api/ts1/spares/:id", handle(removeSpare));
  app.post("/api/ts1/spares/:id/stock", handle(changeStock));
  app.get("/api/ts1/spares/:id/moves", handle(stockMoves));
}

module.exports = {
  chamberBreakdownsAPIs, ensureBreakdownTables, seedMenu, saveBreakdown, deleteBreakdown, loadBreakdowns, saveSpare, changeStock, importSpares, removeSpare, dashboard, exportAll, suggestedMin,
};
