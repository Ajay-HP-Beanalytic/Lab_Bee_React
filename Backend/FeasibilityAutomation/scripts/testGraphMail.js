// Read-only test for the Microsoft Graph mailbox connection.
//
// Usage (from the Backend folder):
//   node FeasibilityAutomation/scripts/testGraphMail.js                 -> last 7 days, max 50 mails
//   node FeasibilityAutomation/scripts/testGraphMail.js --days 30 --top 25
//   node FeasibilityAutomation/scripts/testGraphMail.js --rfq           -> only mails that look like RFQ/PO
//   node FeasibilityAutomation/scripts/testGraphMail.js --id <messageId> --save
//                                  -> show one mail and save it to scripts/output/
//   node FeasibilityAutomation/scripts/testGraphMail.js --days 30 --rfq --save-all
//                                  -> save every listed mail to scripts/output/
//
// Each saved mail becomes a folder:
//   output/<date>_<subject>/
//     mail.txt                 headers + plain-text body
//     files/                   PDF, Excel, Word, images, screenshots
//     forwarded_1_<subject>/   mail forwarded as attachment (same layout, nested)
//
// Nothing is modified in the mailbox: no mails are marked read, moved or sent.

const path = require("path");
const fs = require("fs");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
require("dotenv").config({ path: path.join(__dirname, "..", "..", envFile) });

const graph = require("../mailSource/graphAdapter");
const { parseEmail } = require("../mailSource/parseEmail");

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const days = parseInt(getArg("days", "7"));
const top = parseInt(getArg("top", "50"));
const messageId = getArg("id", null);
const OUTPUT_DIR = path.join(__dirname, "output");

// Rough keyword check just to eyeball results. The real classification will be
// done by the AI intake agent.
const RFQ_KEYWORDS =
  /\b(rfq|quotation|quote|enquiry|inquiry|feasibility|testing|test|purchase order|p\.?o\.?|slot|emi|emc|vibration|thermal|humidity|iec|mil-std|is \d+|jss)\b/i;

const hints = {
  invalid_client:
    "Client secret is wrong or expired. Use the secret VALUE, not the secret ID.",
  unauthorized_client: "MS_CLIENT_ID is wrong or the app is not in this tenant.",
  invalid_request: "Check MS_TENANT_ID.",
  ErrorAccessDenied:
    "App lacks Mail.Read (Application) permission, admin consent is missing, or an access policy blocks this mailbox.",
  Authorization_RequestDenied:
    "Admin consent is missing for the Application permission.",
  MailboxNotEnabledForRESTAPI:
    "Mailbox not found in Exchange Online, or it is on-premises / unlicensed.",
  ResourceNotFound: "RFQ_MAILBOX address not found in this tenant.",
  ErrorInvalidUser: "RFQ_MAILBOX address not found in this tenant.",
};

const fail = (step, err) => {
  console.error(`\n❌ ${step} failed: ${err.message}`);
  if (hints[err.code]) console.error(`   Hint: ${hints[err.code]}`);
  process.exit(1);
};

const safeName = (s, max = 50) =>
  (s || "no-subject")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max) || "no-subject";

//Write files to a folder, renaming duplicates (two "image001.png" etc.).
const writeFiles = (dir, files) => {
  if (!files.length) return;
  fs.mkdirSync(dir, { recursive: true });
  const used = new Set();
  for (const f of files) {
    let name = safeName(f.name, 100);
    for (let n = 2; used.has(name.toLowerCase()); n++) {
      const ext = path.extname(f.name || "");
      name = `${safeName(path.basename(f.name || "file", ext), 90)}_${n}${ext}`;
    }
    used.add(name.toLowerCase());
    fs.writeFileSync(path.join(dir, name), f.content);
  }
};

const fileLine = (f) =>
  `- ${f.name} (${f.contentType}, ${(f.size / 1024).toFixed(1)} KB)${f.isInline ? " [inline]" : ""}`;

//Save a parsed forwarded mail (and its own forwards) into `dir`.
const saveParsedEmail = (dir, mail, indent) => {
  fs.mkdirSync(dir, { recursive: true });
  const header = [
    `Subject : ${mail.subject}`,
    `From    : ${mail.from}`,
    `To      : ${mail.to}`,
    `Date    : ${mail.date}`,
    `Files   : ${mail.attachments.map((a) => a.name).join(", ") || "(none)"}`,
  ].join("\n");
  fs.writeFileSync(path.join(dir, "mail.txt"), `${header}\n\n${mail.text}\n`);
  writeFiles(path.join(dir, "files"), mail.attachments);

  console.log(`${indent}↳ Forwarded mail: "${mail.subject}" from ${mail.from}`);
  mail.attachments.forEach((a) => console.log(`${indent}  ${fileLine(a)}`));

  mail.forwarded.forEach((fwd, i) =>
    saveParsedEmail(
      path.join(dir, `forwarded_${i + 1}_${safeName(fwd.subject, 30)}`),
      fwd,
      indent + "  ",
    ),
  );
};

//Fetch one mail with all attachments; print it and optionally save it.
const processMessage = async (id, { print = true, save = false } = {}) => {
  const msg = await graph.getMessage(id);
  const from = `${msg.from?.emailAddress?.name} <${msg.from?.emailAddress?.address}>`;
  // Always ask for attachments: Graph reports hasAttachments=false when a mail only
  // has inline images (pasted screenshots), so that flag can't be trusted.
  const attachments = await graph.getAttachments(id);
  const files = attachments.filter((a) => a.kind === "file");
  const emails = attachments.filter((a) => a.kind === "email");
  const others = attachments.filter((a) => !["file", "email"].includes(a.kind));

  if (print) {
    console.log("\n================ MESSAGE ================");
    console.log("Subject   :", msg.subject);
    console.log("From      :", from);
    console.log("Received  :", msg.receivedDateTime);
    console.log("Thread ID :", msg.conversationId);
    console.log("Message-ID:", msg.internetMessageId);
    console.log("\n---------------- BODY (text) ----------------");
    console.log(msg.body?.content?.trim().slice(0, 4000) || "(empty)");
    if (attachments.length) {
      console.log("\n---------------- ATTACHMENTS ----------------");
      files.forEach((f) => console.log(fileLine(f)));
      others.forEach((o) =>
        console.log(`- ${o.name} [${o.kind}${o.error ? `: ${o.error}` : ""}]`),
      );
    }
  }

  let dir = null;
  if (save) {
    const date = msg.receivedDateTime.slice(0, 16).replace(/[T:]/g, "-");
    dir = path.join(OUTPUT_DIR, `${date}_${safeName(msg.subject)}`);
    fs.mkdirSync(dir, { recursive: true });
    const header = [
      `Subject   : ${msg.subject}`,
      `From      : ${from}`,
      `To        : ${(msg.toRecipients || []).map((r) => r.emailAddress.address).join(", ")}`,
      `Cc        : ${(msg.ccRecipients || []).map((r) => r.emailAddress.address).join(", ")}`,
      `Received  : ${msg.receivedDateTime}`,
      `Thread ID : ${msg.conversationId}`,
      `Graph ID  : ${msg.id}`,
      `Files     : ${files.map((f) => f.name).join(", ") || "(none)"}`,
      `Forwarded : ${emails.map((e) => e.name).join(", ") || "(none)"}`,
    ].join("\n");
    fs.writeFileSync(
      path.join(dir, "mail.txt"),
      `${header}\n\n${msg.body?.content?.trim() || ""}\n`,
    );
    writeFiles(path.join(dir, "files"), files);
  }

  // Mails forwarded as attachments: parse and show/save their content too
  for (const [i, e] of emails.entries()) {
    const parsed = await parseEmail(e.content);
    if (save) {
      const fwdDir = path.join(dir, `forwarded_${i + 1}_${safeName(parsed.subject, 30)}`);
      fs.writeFileSync(path.join(dir, `forwarded_${i + 1}.eml`), e.content);
      saveParsedEmail(fwdDir, parsed, "  ");
    } else if (print) {
      console.log(`↳ Forwarded mail: "${parsed.subject}" from ${parsed.from}`);
      parsed.attachments.forEach((a) => console.log(`  ${fileLine(a)}`));
      if (parsed.forwarded.length) {
        console.log(`  (+ ${parsed.forwarded.length} nested forwarded mail(s), use --save to see)`);
      }
    }
  }

  if (save && print) console.log(`\n💾 Saved to ${dir}`);
  return dir;
};

(async () => {
  // Step 1: token
  console.log("1. Getting app-only token...");
  let roles;
  try {
    roles = await graph.getTokenRoles();
  } catch (err) {
    fail("Token", err);
  }
  console.log(`   ✅ Token OK for app "${roles.appName}"`);
  console.log(
    `   Granted application permissions: ${roles.roles.join(", ") || "(none)"}`,
  );
  if (!roles.roles.some((r) => r.startsWith("Mail."))) {
    console.error(
      "\n❌ No Mail.* application permission in the token. Add Mail.Read under " +
        "API permissions → Microsoft Graph → Application permissions, then click " +
        '"Grant admin consent".',
    );
    process.exit(1);
  }

  // Step 2: single message mode
  if (messageId) {
    try {
      await processMessage(messageId, { save: hasFlag("save") });
    } catch (err) {
      fail("Reading message", err);
    }
    return;
  }

  // Step 3: list recent messages
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(
    `\n2. Reading ${process.env.RFQ_MAILBOX} inbox (last ${days} days, max ${top})...`,
  );
  let messages;
  try {
    messages = await graph.listMessages({ since, top });
  } catch (err) {
    fail("Listing messages", err);
  }
  console.log(`   ✅ ${messages.length} message(s) fetched`);

  const rows = messages
    .map((m) => ({
      received: m.receivedDateTime.replace("T", " ").slice(0, 16),
      from: m.from?.emailAddress?.address,
      subject: (m.subject || "").slice(0, 60),
      attach: m.hasAttachments ? "📎" : "",
      looksRfq: RFQ_KEYWORDS.test(`${m.subject} ${m.bodyPreview}`) ? "✔" : "",
      id: m.id,
    }))
    .filter((r) => !hasFlag("rfq") || r.looksRfq);

  console.table(rows.map(({ id, ...rest }) => rest));

  if (hasFlag("save-all")) {
    console.log(`\n3. Saving ${rows.length} mail(s)...`);
    for (const [i, r] of rows.entries()) {
      try {
        const dir = await processMessage(r.id, { print: false, save: true });
        console.log(`   [${i}] 💾 ${path.basename(dir)}`);
      } catch (err) {
        console.error(`   [${i}] ❌ ${r.subject}: ${err.message}`);
      }
    }
    console.log(`\nAll saved under ${OUTPUT_DIR}`);
    return;
  }

  console.log("\nMessage IDs (use with --id <id> --save to see body and attachments):");
  rows.forEach((r, i) => console.log(`[${i}] ${r.id}`));
})();
