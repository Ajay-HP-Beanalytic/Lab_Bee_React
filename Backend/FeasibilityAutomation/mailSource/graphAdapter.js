// Microsoft Graph mailbox adapter (app-only / client-credentials flow).
// Reads mail from one mailbox (RFQ_MAILBOX) so the email intake agent never
// talks to Graph directly. Another adapter (IMAP, Gmail) can expose the same
// functions later without changing the agent.
//
// Required env vars:
//   MS_TENANT_ID      - Directory (tenant) ID of the Entra app
//   MS_CLIENT_ID      - Application (client) ID
//   MS_CLIENT_SECRET  - Client secret VALUE (not the secret ID)
//   RFQ_MAILBOX       - Mailbox to read, e.g. rfq@yourcompany.com

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

let cachedToken = null; // { accessToken, expiresAt }

const requireEnv = () => {
  const missing = [
    "MS_TENANT_ID",
    "MS_CLIENT_ID",
    "MS_CLIENT_SECRET",
    "RFQ_MAILBOX",
  ].filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
};

//Get an app-only access token, cached until 5 minutes before it expires.
const getAccessToken = async () => {
  requireEnv();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const url = `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    client_secret: process.env.MS_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(url, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(
      `Token request failed: ${data.error} - ${data.error_description}`,
    );
    err.code = data.error;
    throw err;
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
};

//Decode the token payload (no verification) to see which permissions were granted.
const getTokenRoles = async () => {
  const token = await getAccessToken();
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
  );
  return { roles: payload.roles || [], appName: payload.app_displayname };
};

//GET a Graph path relative to the mailbox, e.g. "/messages".
const graphGet = async (path, params = {}) => {
  const token = await getAccessToken();
  const mailbox = encodeURIComponent(process.env.RFQ_MAILBOX);
  const qs = new URLSearchParams(params).toString();
  const url = `${GRAPH_BASE}/users/${mailbox}${path}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Return the body as plain text so the AI extractor gets clean input
      Prefer: 'outlook.body-content-type="text"',
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(
      `Graph ${res.status}: ${data.error?.code} - ${data.error?.message}`,
    );
    err.status = res.status;
    err.code = data.error?.code;
    throw err;
  }
  return data;
};

//GET a Graph path and return the raw bytes (used for $value MIME downloads).
const graphGetRaw = async (path) => {
  const token = await getAccessToken();
  const mailbox = encodeURIComponent(process.env.RFQ_MAILBOX);
  const res = await fetch(`${GRAPH_BASE}/users/${mailbox}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(
      `Graph ${res.status}: ${data.error?.code} - ${data.error?.message}`,
    );
    err.status = res.status;
    err.code = data.error?.code;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
};

//List messages in a folder received after `since` (newest first).
const listMessages = async ({
  folder = "inbox",
  since = null,
  top = 25,
} = {}) => {
  const params = {
    $top: String(top),
    $orderby: "receivedDateTime desc",
    $select:
      "id,internetMessageId,conversationId,subject,from,toRecipients,receivedDateTime,hasAttachments,isRead,bodyPreview",
  };
  if (since) {
    params.$filter = `receivedDateTime ge ${new Date(since).toISOString()}`;
  }
  const data = await graphGet(`/mailFolders/${folder}/messages`, params);
  return data.value;
};

//Read Microsoft Purview sensitivity label names from the msip_labels header,
//e.g. "MSIP_Label_<guid>_Enabled=true; MSIP_Label_<guid>_Name=Confidential; ..."
const parseSensitivityLabels = (msipHeader) =>
  [...(msipHeader || "").matchAll(/MSIP_Label_[^_]+_Name=([^;]+)/gi)].map(
    (m) => m[1].trim(),
  );

//Get one message including its full (plain-text) body and confidentiality markers
//(sensitivity flag, Outlook categories, sensitivity labels).
const getMessage = async (messageId) => {
  const msg = await graphGet(`/messages/${messageId}`, {
    $select:
      "id,internetMessageId,conversationId,subject,from,toRecipients,ccRecipients,receivedDateTime,hasAttachments,body,sensitivity,categories,internetMessageHeaders",
  });
  const msip = (msg.internetMessageHeaders || []).find(
    (h) => h.name.toLowerCase() === "msip_labels",
  );
  msg.sensitivityLabels = parseSensitivityLabels(msip?.value);
  delete msg.internetMessageHeaders;
  return msg;
};

//List attachments with their content.
// kind = "file"  -> PDF, Excel, Word, images, inline screenshots (content = file bytes)
// kind = "email" -> mail forwarded as an attachment (content = raw MIME / .eml bytes,
//                   parse it with mailSource/parseEmail.js to get its body and files)
// kind = "link"  -> OneDrive/SharePoint link attachment (no content)
const getAttachments = async (messageId) => {
  const data = await graphGet(`/messages/${messageId}/attachments`);
  const result = [];

  for (const a of data.value) {
    const base = {
      id: a.id,
      name: a.name,
      contentType: a.contentType,
      size: a.size,
      isInline: a.isInline,
    };
    const type = a["@odata.type"];

    if (type === "#microsoft.graph.fileAttachment") {
      result.push({
        ...base,
        kind: "file",
        content: Buffer.from(a.contentBytes, "base64"),
      });
    } else if (type === "#microsoft.graph.itemAttachment") {
      // Only mails can be exported as MIME; calendar items/contacts are skipped
      try {
        const mime = await graphGetRaw(
          `/messages/${messageId}/attachments/${a.id}/$value`,
        );
        result.push({ ...base, kind: "email", content: mime });
      } catch (err) {
        result.push({ ...base, kind: "unsupported", error: err.message });
      }
    } else {
      result.push({ ...base, kind: "link", content: null });
    }
  }
  return result;
};

module.exports = {
  parseSensitivityLabels,
  getAccessToken,
  getTokenRoles,
  listMessages,
  getMessage,
  getAttachments,
};
