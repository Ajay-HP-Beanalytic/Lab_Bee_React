// Email intake agent: classifies an incoming email and extracts RFQ details.
//
// Order of checks:
//  1. Confidentiality policy  -> "confidential" (staff only, nothing sent to AI)
//  2. Internal staff mail     -> "internal" (no AI; attached to the thread later)
//  3. Claude extraction       -> "analysed"
//
// Claude is reached through Microsoft Foundry when ANTHROPIC_FOUNDRY_API_KEY is
// set, otherwise through the Claude API with ANTHROPIC_API_KEY.
//   CLAUDE_PROVIDER      - "anthropic" or "foundry" (optional, see getClient)
//   ANTHROPIC_FOUNDRY_API_KEY, ANTHROPIC_FOUNDRY_RESOURCE (or ANTHROPIC_FOUNDRY_BASE_URL)
//   CLAUDE_INTAKE_MODEL  - model ID or Foundry deployment name (default claude-opus-5-5)
//   INTERNAL_DOMAINS     - staff email domains (default beanalytic.com)

const Anthropic = require("@anthropic-ai/sdk");
const { AnthropicFoundry } = require("@anthropic-ai/foundry-sdk");
const { checkConfidential } = require("./confidentialityPolicy");
const { prepareAttachments } = require("./attachmentContent");
const { normalizeEut } = require("./normalize");

const MAX_BODY_CHARS = 30000;

const FREE_MAIL_DOMAINS =
  /@(gmail|googlemail|yahoo|ymail|rediffmail|hotmail|outlook|live|msn|icloud|me|aol|proton|protonmail|zoho)\.[a-z.]+$/i;

const internalDomains = () =>
  (process.env.INTERNAL_DOMAINS || "beanalytic.com")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

const isInternal = (address) => {
  const domain = (address || "").split("@")[1]?.toLowerCase();
  return !!domain && internalDomains().includes(domain);
};

const isForward = (subject) => /^\s*(fw|fwd)\s*:/i.test(subject || "");

let client = null;
const getClient = () => {
  if (client) return client;
  // CLAUDE_PROVIDER=anthropic | foundry. Without it, Foundry is used when its key is set.
  const provider =
    process.env.CLAUDE_PROVIDER ||
    (process.env.ANTHROPIC_FOUNDRY_API_KEY ? "foundry" : "anthropic");

  if (provider === "foundry") {
    if (!process.env.ANTHROPIC_FOUNDRY_API_KEY) {
      throw new Error("CLAUDE_PROVIDER=foundry but ANTHROPIC_FOUNDRY_API_KEY is not set");
    }
    client = new AnthropicFoundry({
      apiKey: process.env.ANTHROPIC_FOUNDRY_API_KEY,
      ...(process.env.ANTHROPIC_FOUNDRY_BASE_URL
        ? { baseURL: process.env.ANTHROPIC_FOUNDRY_BASE_URL }
        : { resource: process.env.ANTHROPIC_FOUNDRY_RESOURCE }),
    });
  } else if (process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } else {
    throw new Error(
      "Set ANTHROPIC_FOUNDRY_API_KEY + ANTHROPIC_FOUNDRY_RESOURCE (Microsoft Foundry) or ANTHROPIC_API_KEY (Claude API)",
    );
  }
  return client;
};

const SYSTEM_PROMPT = `You read emails received by the sales mailbox of BE Analytic Solutions, an NABL-accredited testing laboratory in Bangalore, India.
The lab's main test disciplines are:
- Environmental & mechanical testing (TS1): high/low temperature, thermal shock, humidity, temperature cycling, altitude/low pressure, salt fog, vibration, mechanical shock, bump, burn-in, ESS, etc.
- EMI/EMC testing (TS2): conducted/radiated emission and susceptibility (e.g. MIL-STD-461, DO-160 EMI sections), ESD, surge, EFT, lightning induced transients, etc.
Customers send requests for quotation (RFQ), clarifications, purchase orders and other mail. Staff reply and forward mails internally.

Your job: classify the email and extract the details needed to check feasibility and prepare a quotation. Always answer by calling the record_email_analysis tool.

Classification:
- new_enquiry: a customer asks for a quotation, budgetary quote, feasibility or availability of a test/service for the first time.
- enquiry_followup: a customer adds information to, or chases, an earlier enquiry (e.g. replies with dimensions we asked for, "did you get my email?").
- po_or_approval: a purchase order, work order, quotation acceptance or request to book a slot against a quotation.
- tender_notice: a tender/bid/RFx notice from a procurement portal (e.g. SRM), usually with a bid number and closing date.
- internal_discussion: lab staff discussing a request among themselves (forwarding for feasibility, sharing prices, etc.).
- not_rfq: anything else (facility visit requests, support requests, reminders, newsletters, spam).

Extraction rules:
- Copy values exactly as written. Never guess, estimate or convert units. If a value is not stated, use null.
- Record dimensions as three numbers with the unit as written. If the order is given (e.g. WxDxH), map it to length/width/height and keep the original text in dimensions_as_written.
- When a mail was forwarded, the customer is the ORIGINAL external sender, not the staff member who forwarded it.
- Create one tests[] entry per distinct test (and per procedure if they are priced separately). Put severities, temperatures, durations, levels, categories and procedures in the fields provided.
- Create one eut_items[] entry per distinct product/version/unit type, with its quantity.
- Read the email body, forwarded mails and all attachments. Say where each test came from in source.
- missing_fields: list what the lab still needs to quote (for example: EUT dimensions, EUT weight, quantity, test standard, test severity/profile, test duration, operating condition during test). Only list fields that are really missing.
- requested_info: list what the customer wants in the reply besides the price (e.g. NABL certificate, lead time, earliest start date, payment terms, validity).
- non_testing_service: true when they ask for design, consultancy, analysis, calibration or other non-testing work.`;

const nullableString = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };

const ANALYSIS_TOOL = {
  name: "record_email_analysis",
  description: "Record the classification and the extracted RFQ details of the email.",
  input_schema: {
    type: "object",
    properties: {
      classification: {
        type: "string",
        enum: [
          "new_enquiry",
          "enquiry_followup",
          "po_or_approval",
          "tender_notice",
          "internal_discussion",
          "not_rfq",
        ],
      },
      classification_reason: { type: "string" },
      summary: { type: "string", description: "One or two sentences." },
      customer: {
        type: "object",
        properties: {
          company_name: nullableString,
          contact_person: nullableString,
          contact_email: nullableString,
          contact_phone: nullableString,
        },
        required: ["company_name", "contact_person", "contact_email", "contact_phone"],
      },
      customer_reference: {
        ...nullableString,
        description: "Customer's RFQ / bid / opportunity / PO number, if any.",
      },
      deadline: {
        ...nullableString,
        description: "Quote or bid due date as written, if any.",
      },
      requested_test_window: {
        ...nullableString,
        description: "When they want testing done, as written.",
      },
      eut_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            model_or_part_no: nullableString,
            quantity: nullableNumber,
            dimensions_as_written: nullableString,
            length: nullableNumber,
            width: nullableNumber,
            height: nullableNumber,
            dimension_unit: { type: ["string", "null"], enum: ["mm", "cm", "m", "in", "ft", null] },
            weight: nullableNumber,
            weight_unit: { type: ["string", "null"], enum: ["g", "kg", "lb", "t", null] },
            weight_as_written: nullableString,
            notes: nullableString,
          },
          required: ["name", "quantity", "length", "width", "height", "dimension_unit", "weight", "weight_unit"],
        },
      },
      tests: {
        type: "array",
        items: {
          type: "object",
          properties: {
            test_name: { type: "string", description: "As written by the customer." },
            discipline: {
              type: "string",
              enum: ["environmental", "mechanical", "emi_emc", "electrical", "rf", "ingress_protection", "other"],
            },
            standard: nullableString,
            method_or_section: nullableString,
            procedure_or_category: nullableString,
            conditions: {
              ...nullableString,
              description: "Severity, temperatures, levels, durations, cycles, operating state, as written.",
            },
            applies_to: {
              ...nullableString,
              description: "Which EUT item(s) / version(s) this test is for.",
            },
            source: {
              type: "string",
              description: "'body', 'forwarded mail' or the attachment file name.",
            },
          },
          required: ["test_name", "discipline", "standard", "conditions", "source"],
        },
      },
      requested_info: { type: "array", items: { type: "string" } },
      missing_fields: { type: "array", items: { type: "string" } },
      urgent: { type: "boolean" },
      non_testing_service: { type: "boolean" },
    },
    required: [
      "classification",
      "classification_reason",
      "summary",
      "customer",
      "eut_items",
      "tests",
      "missing_fields",
      "urgent",
      "non_testing_service",
    ],
  },
};

const formatAddress = (a) =>
  !a ? "" : typeof a === "string" ? a : a.name ? `${a.name} <${a.address}>` : a.address;

const truncate = (s, n) =>
  (s || "").length > n ? `${s.slice(0, n)}\n[...truncated]` : s || "";

//Render the mail and its forwarded mails (recursively) as plain text.
const renderEmail = (bundle) => {
  const lines = [
    `Subject: ${bundle.subject}`,
    `From: ${formatAddress(bundle.from)}`,
    `To: ${(bundle.to || []).map(formatAddress).join(", ")}`,
    `Cc: ${(bundle.cc || []).map(formatAddress).join(", ")}`,
    `Received: ${bundle.received}`,
    `Attachments: ${(bundle.attachments || []).map((a) => a.name).join(", ") || "none"}`,
    "",
    truncate(bundle.body, MAX_BODY_CHARS),
  ];
  (bundle.forwarded || []).forEach((f, i) => {
    lines.push("", `===== Forwarded mail ${i + 1} (attached to the mail above) =====`);
    lines.push(renderEmail({ ...f, body: f.body ?? f.text }));
  });
  return lines.join("\n");
};

//Collect attachments, readable text and confidentiality markers of a mail and
//every mail forwarded inside it.
const flatten = (bundle, acc = { attachments: [], markers: [], texts: [] }) => {
  acc.attachments.push(...(bundle.attachments || []));
  acc.markers.push({
    subject: bundle.subject,
    sensitivity: bundle.sensitivity,
    categories: bundle.categories,
    labels: bundle.sensitivityLabels,
  });
  acc.texts.push(
    bundle.subject,
    formatAddress(bundle.from),
    ...(bundle.to || []).map(formatAddress),
    ...(bundle.cc || []).map(formatAddress),
    bundle.body ?? bundle.text,
  );
  (bundle.forwarded || []).forEach((f) => flatten(f, acc));
  return acc;
};

//Analyse one email bundle:
//{ subject, from:{name,address}, to[], cc[], received, body, sensitivity,
//  categories[], sensitivityLabels[], attachments[{name, content}], forwarded[] }
//Options: { useAi: false } runs only the local checks (nothing is sent anywhere).
const analyzeEmail = async (bundle, { useAi = true } = {}) => {
  const { attachments, markers, texts } = flatten(bundle);
  const prepared = await prepareAttachments(attachments);
  const base = { attachmentNotes: prepared.notes };
  const notSent = (why) => ({
    attachmentNotes: attachments.map((a) => `${a.name}: not sent (${why})`),
  });

  const policy = checkConfidential({ markers, texts: [...texts, ...prepared.texts] });
  if (policy.confidential) {
    return { ...notSent("confidential mail"), decision: "confidential", reasons: policy.reasons };
  }

  const fromAddress = bundle.from?.address || "";
  if (isInternal(fromAddress) && !isForward(bundle.subject)) {
    return { ...notSent("internal mail"), decision: "internal", reasons: ["sent by lab staff"] };
  }

  if (!useAi) {
    return { ...base, decision: "would_send_to_ai", reasons: [] };
  }

  const model = process.env.CLAUDE_INTAKE_MODEL || "claude-opus-5-5";
  const response = await getClient().messages.create({
    model,
    max_tokens: 8192,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: renderEmail(bundle) },
          ...prepared.blocks,
          ...prepared.notes
            .filter((n) => /HELD BACK|NOT READ/.test(n))
            .map((n) => ({ type: "text", text: `Note: attachment ${n}` })),
        ],
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse || response.stop_reason === "max_tokens") {
    throw new Error(`No complete analysis returned (stop_reason: ${response.stop_reason})`);
  }

  const result = toolUse.input;
  result.eut_items = (result.eut_items || []).map(normalizeEut);
  const contactEmail = result.customer?.contact_email || fromAddress;
  result.free_mail_sender = FREE_MAIL_DOMAINS.test(contactEmail);

  return {
    ...base,
    decision: "analysed",
    reasons: [],
    model,
    usage: response.usage,
    result,
  };
};

module.exports = { analyzeEmail, isInternal, isForward };
