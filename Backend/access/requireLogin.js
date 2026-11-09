// Every API and uploaded file needs a logged-in user, except the few that work
// before login and the token-protected customer links.

// Compared in lower case: Express routes ignore case ("/api/adduser" = "/api/addUser")
const PUBLIC_PATHS = new Set([
  "/api/login",
  "/api/logout",
  "/api/adduser", // registers a disabled account; Administration enables it
  "/api/checkresetpasswordemail",
  "/api/verifyotp",
  "/api/resetpassword",
  "/api/getuserstatus",
  "/api/getloggedinuser", // says whether this browser is logged in
  "/api/testing",
  "/api/feasibility/submit",
]);
const PUBLIC_PREFIXES = ["/api/public/reports/", "/api/feasibility/validate-token/", "/api/feasibility/status/"];

const isProtected = (p) => p === "/api" || p.startsWith("/api/") || p === "/filesuploaded" || p.startsWith("/filesuploaded/");

function isPublic(path) {
  const p = String(path || "").toLowerCase().replace(/\/+$/, "");
  return !isProtected(p) || PUBLIC_PATHS.has(p) || PUBLIC_PREFIXES.some((x) => p.startsWith(x));
}

const requireLogin = (req, res, next) => {
  if (req.method === "OPTIONS" || isPublic(req.path) || req.session?.user_id) return next();
  return res.status(401).json({ message: "Please log in", sessionInvalid: true });
};

// Browsers may call the API only from Lab Bee itself: the public address, the
// same host as the API, the office network, or ALLOWED_ORIGINS (comma separated)
const PRIVATE_HOST = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

function originAllowed(origin, host = "") {
  if (!origin) return true; // not a cross-site browser call
  let hostname;
  try {
    hostname = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  const extra = String(process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return (
    hostname === "labbee.beanalytic.com" ||
    PRIVATE_HOST.test(hostname) ||
    hostname === String(host).split(":")[0].toLowerCase() ||
    extra.includes(origin.toLowerCase()) ||
    extra.includes(hostname)
  );
}

// Uploaded web pages or scripts are downloaded, never run inside Lab Bee
const ACTIVE_FILE = /\.(html?|xhtml|svg|xml|js|mjs)$/i;
const blockActiveFile = (res, filePath) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (ACTIVE_FILE.test(String(filePath))) res.setHeader("Content-Disposition", "attachment");
};

module.exports = { requireLogin, isPublic, originAllowed, blockActiveFile };
