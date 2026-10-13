// Parse a raw MIME email (.eml), such as a mail forwarded "as attachment".
// Returns its headers, plain-text body and attachments. Mails attached inside it
// (forward of a forward) are parsed recursively into `forwarded`.

const { simpleParser } = require("mailparser");

const MAX_DEPTH = 5;

const parseEmail = async (mimeBuffer, depth = 0) => {
  const mail = await simpleParser(mimeBuffer);

  const parsed = {
    subject: mail.subject || "",
    from: mail.from?.text || "",
    to: mail.to?.text || "",
    date: mail.date ? mail.date.toISOString() : null,
    messageId: mail.messageId || null,
    // Fall back to the HTML version converted to text when there is no text part
    text: (mail.text || mail.html?.replace(/<[^>]+>/g, " ") || "").trim(),
    attachments: [],
    forwarded: [],
  };

  for (const a of mail.attachments || []) {
    if (a.contentType === "message/rfc822" && depth < MAX_DEPTH) {
      parsed.forwarded.push(await parseEmail(a.content, depth + 1));
    } else {
      parsed.attachments.push({
        name: a.filename || `attachment.${(a.contentType || "bin").split("/")[1]}`,
        contentType: a.contentType,
        size: a.size,
        isInline: a.contentDisposition === "inline",
        content: a.content,
      });
    }
  }
  return parsed;
};

module.exports = { parseEmail };
