// RFQ number of an enquiry: RFQ/DDMMYYYY/NN - the day the enquiry was received
// and its serial on that day (01, 02, … 99, 100 …).
//
// The serial comes from rfq_number_counters (one row per day). The INSERT … ON
// DUPLICATE KEY UPDATE locks that day's row, so two enquiries saved at the same
// moment (the mail reader, the portal, two people) always get different serials;
// feasibility_requests.rfq_number is UNIQUE as well. When the caller's
// transaction is rolled back, the serial is given back too.
const { db } = require("../../db");

const PREFIX = "RFQ";
const TIME_ZONE = "Asia/Kolkata";

// The day in the lab's time zone, as YYYY-MM-DD (the counter key) and DDMMYYYY
const dayOf = (when) => {
  const d = when ? new Date(when) : new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(Number.isNaN(d.getTime()) ? new Date() : d)
      .map((p) => [p.type, p.value]),
  );
  return { key: `${parts.year}-${parts.month}-${parts.day}`, text: `${parts.day}${parts.month}${parts.year}` };
};

const format = (dayText, serial) => `${PREFIX}/${dayText}/${String(serial).padStart(2, "0")}`;

// Number for the enquiry before RFQ numbers existed / when it has none yet
const legacyReference = (id) => `RFQ-${String(id).padStart(5, "0")}`;

// q: a query function on ONE connection (LAST_INSERT_ID is per connection).
// Gives the enquiry its number unless it has one; returns the number.
const assignWith = async (q, requestId, receivedAt) => {
  const [have] = await q("SELECT rfq_number FROM feasibility_requests WHERE id = ?", [requestId]);
  if (have?.rfq_number) return have.rfq_number;
  const day = dayOf(receivedAt);
  await q(
    "INSERT INTO rfq_number_counters (day, last_serial) VALUES (?, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE last_serial = LAST_INSERT_ID(last_serial + 1)",
    [day.key],
  );
  const [{ serial }] = await q("SELECT LAST_INSERT_ID() AS serial");
  const number = format(day.text, serial);
  await q("UPDATE feasibility_requests SET rfq_number = ? WHERE id = ? AND rfq_number IS NULL", [number, requestId]);
  return number;
};

// Same, on a connection of its own (callers without a transaction)
const assignNumber = async (requestId, receivedAt) => {
  const conn = await db.promise().getConnection();
  try {
    return await assignWith((sql, params) => conn.query(sql, params).then(([rows]) => rows), requestId, receivedAt);
  } finally {
    conn.release();
  }
};

// Enquiries saved before RFQ numbers: numbered by the day they were received, in order
const backfill = async (q) => {
  const rows = await q(`
    SELECT r.id, COALESCE((SELECT MIN(e.received_at) FROM inbound_emails e WHERE e.request_id = r.id), r.created_at) AS received
    FROM feasibility_requests r WHERE r.rfq_number IS NULL`);
  rows.sort((a, b) => new Date(a.received) - new Date(b.received) || a.id - b.id);
  const conn = await db.promise().getConnection();
  try {
    const cq = (sql, params) => conn.query(sql, params).then(([r]) => r);
    for (const r of rows) await assignWith(cq, r.id, r.received);
  } finally {
    conn.release();
  }
  return rows.length;
};

// The reference to show: the RFQ number, or the old one for an enquiry without it
const reference = (request) =>
  request && typeof request === "object" ? request.rfq_number || legacyReference(request.id) : legacyReference(request);

module.exports = { assignWith, assignNumber, backfill, reference, legacyReference, dayOf };
