// Decides which emails must NEVER be sent to the AI (staff-only handling).
//
// An email is confidential when ANY of these is true:
//  1. The sender marked it Confidential / Private in Outlook (sensitivity flag).
//  2. It carries a Microsoft Purview sensitivity label whose name contains
//     "confidential", "restricted", "secret" or "private".
//  3. Staff put the Outlook category "Confidential" on it.
//  4. The subject contains a marker such as [CONFIDENTIAL] (staff can add it
//     when forwarding).
//  5. A restricted domain or keyword appears anywhere in it: sender, recipients,
//     subject, body, forwarded mails, attachment names or attachment text.
//
// The word "confidential" in the body is deliberately NOT used: most email
// footers contain it ("this e-mail may contain confidential information...").
//
// Extra domains and keywords can be added through env vars (comma separated):
//   RESTRICTED_DOMAINS=example.gov.in,another.com
//   RESTRICTED_KEYWORDS=Project X,Some Customer

const RESTRICTED_DOMAINS = [
  "hal-india.co.in",
  "bel.co.in",
  "drdo.in",
  "drdo.gov.in",
  "isro.gov.in",
  "bdl-india.in",
  "mod.gov.in",
  "cemilac.gov.in",
];

// Matched as whole words. Upper-case acronyms are matched case-sensitively so
// that e.g. "HAL" does not match "hal" inside ordinary words.
const RESTRICTED_KEYWORDS = [
  "HAL",
  "BEL",
  "DRDO",
  "ISRO",
  "CEMILAC",
  "DGAQA",
  "Hindustan Aeronautics",
  "Bharat Electronics",
  "Bharat Dynamics",
  "Indian Navy",
  "Indian Air Force",
  "Indian Army",
  "Coast Guard",
  "military",
  "defence",
  "defense",
];

const CONFIDENTIAL_CATEGORY = /^confidential$/i;
const SUBJECT_MARKER = /\[\s*(confidential|restricted|no[\s-]?ai)\s*\]/i;
const LABEL_WORDS = /confidential|restricted|secret|private/i;

const fromEnv = (name) =>
  (process.env[name] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const keywordPattern = (k) => {
  const isAcronym = k === k.toUpperCase();
  return new RegExp(`\\b${escapeRegex(k)}\\b`, isAcronym ? "" : "i");
};

//`markers` = { sensitivity, categories[], labels[], subject } of the mail and of
//every mail forwarded inside it. `texts` = all readable text (headers, body,
//attachment names, extracted attachment text).
const checkConfidential = ({ markers = [], texts = [] }) => {
  const reasons = [];

  for (const m of markers) {
    if (/confidential|private/i.test(m.sensitivity || "")) {
      reasons.push(`marked ${m.sensitivity} by sender`);
    }
    for (const label of m.labels || []) {
      if (LABEL_WORDS.test(label)) reasons.push(`sensitivity label: ${label}`);
    }
    if ((m.categories || []).some((c) => CONFIDENTIAL_CATEGORY.test(c))) {
      reasons.push("Outlook category: Confidential");
    }
    if (SUBJECT_MARKER.test(m.subject || "")) {
      reasons.push("subject marker");
    }
  }

  const all = texts.filter(Boolean).join("\n");
  const domains = [...RESTRICTED_DOMAINS, ...fromEnv("RESTRICTED_DOMAINS")];
  const keywords = [...RESTRICTED_KEYWORDS, ...fromEnv("RESTRICTED_KEYWORDS")];

  for (const d of domains) {
    // matches user@hal-india.co.in and user@sub.hal-india.co.in
    if (new RegExp(`[@.]${escapeRegex(d)}\\b`, "i").test(all)) {
      reasons.push(`domain: ${d}`);
    }
  }
  for (const k of keywords) {
    if (keywordPattern(k).test(all)) reasons.push(`keyword: ${k}`);
  }

  return { confidential: reasons.length > 0, reasons: [...new Set(reasons)] };
};

module.exports = { checkConfidential };
