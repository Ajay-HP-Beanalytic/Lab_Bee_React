// List confidential requests and record the staff choice for one of them.
// (The dashboard will call the same functions through the API.)
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/confidentialChoice.js                          -> list
//   node FeasibilityAutomation/scripts/confidentialChoice.js --request 12 --ai --user 1
//   node FeasibilityAutomation/scripts/confidentialChoice.js --request 12 --manual --user 1

const path = require("path");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", "..", envFile) });

const { db } = require("../../db");
const { migrateFeasibilityForEmailIntake } = require("../feasibility_tables");
const { sendToAi, markManual } = require("../intake/confidentialHandling");

const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
};

(async () => {
  try {
    await migrateFeasibilityForEmailIntake();
    const requestId = parseInt(getArg("request"));

    if (!requestId) {
      const [rows] = await db.promise().query(
        `SELECT id, status, confidential_handling, contact_email, email_subject, request_flags
         FROM feasibility_requests WHERE is_confidential = 1 ORDER BY id`,
      );
      console.table(
        rows.map((r) => ({
          id: r.id,
          status: r.status,
          handling: r.confidential_handling,
          from: r.contact_email,
          subject: (r.email_subject || "").slice(0, 55),
          why: (r.request_flags?.confidential_reasons || []).join("; ").slice(0, 40),
        })),
      );
      return;
    }

    const userId = parseInt(getArg("user"));
    if (!userId) throw new Error("--user <your user id> is required");

    if (args.includes("--ai")) {
      const r = await sendToAi(requestId, userId);
      console.log(`Request ${r.requestId}: ${r.mails} email(s) analysed by AI.`);
      console.log(`Updated: ${r.changes.join(", ") || "nothing"}`);
    } else if (args.includes("--manual")) {
      await markManual(requestId, userId);
      console.log(`Request ${requestId} marked for manual handling.`);
    } else {
      throw new Error("Use --ai or --manual");
    }
  } catch (err) {
    console.error("❌", err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
})();
