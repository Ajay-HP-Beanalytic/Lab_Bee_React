const multer = require("multer");
const { db } = require("./db");

const query = (sql, params) => db.promise().query(sql, params).then(([rows]) => rows);

const MAX_BYTES = 2 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES } });

// Image type from the file's first bytes (the quotation template takes PNG, JPEG and GIF)
const imageType = (buf) => {
  if (buf.length > 8 && buf.readUInt32BE(0) === 0x89504e47) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 6 && buf.toString("ascii", 0, 4) === "GIF8") return "image/gif";
  return null;
};

const sendLogo = (res, logo) => {
  if (!logo) return res.status(404).json({ error: "No logo for this customer" });
  res.set({ "Content-Type": logo.mime, "Cache-Control": "private, max-age=300" });
  res.send(logo.data);
};

//Customer logos (table customer_logos, one per customers_details row), used on the quotation download.
function customerLogosAPIs(app) {
  const requireUser = (req, res) => {
    const userId = req.session?.user_id;
    if (!userId) res.status(401).json({ error: "Not logged in" });
    return userId;
  };

  // Which customers have a logo: [{customer_id, updated_at}]
  app.get("/api/customer_logos", async (req, res) => {
    try {
      res.json(await query("SELECT customer_id, updated_at FROM customer_logos"));
    } catch (err) {
      console.error("customer logos error:", err);
      res.status(500).json({ error: "Failed to load the logos" });
    }
  });

  app.get("/api/customer_logo/:customerId", async (req, res) => {
    try {
      const [logo] = await query("SELECT mime, data FROM customer_logos WHERE customer_id = ?", [parseInt(req.params.customerId)]);
      sendLogo(res, logo);
    } catch (err) {
      console.error("customer logo error:", err);
      res.status(500).json({ error: "Failed to load the logo" });
    }
  });

  // By company code: quotations store the code (bea_quotations_table.customer_id)
  app.get("/api/customer_logo/by_code/:code", async (req, res) => {
    try {
      const [logo] = await query(
        `SELECT l.mime, l.data FROM customer_logos l JOIN customers_details c ON c.id = l.customer_id
         WHERE UPPER(c.company_id) = UPPER(?) ORDER BY c.id LIMIT 1`,
        [req.params.code],
      );
      sendLogo(res, logo);
    } catch (err) {
      console.error("customer logo error:", err);
      res.status(500).json({ error: "Failed to load the logo" });
    }
  });

  // Upload or replace: multipart field "logo"
  app.put("/api/customer_logo/:customerId", (req, res) => {
    const userId = requireUser(req, res);
    if (!userId) return;
    upload.single("logo")(req, res, async (uploadErr) => {
      if (uploadErr) {
        const tooBig = uploadErr.code === "LIMIT_FILE_SIZE";
        return res.status(400).json({ error: tooBig ? "The logo must be smaller than 2 MB" : "Upload failed" });
      }
      try {
        const customerId = parseInt(req.params.customerId);
        const [customer] = await query("SELECT id FROM customers_details WHERE id = ?", [customerId]);
        if (!customer) return res.status(404).json({ error: "Customer not found" });
        if (!req.file?.buffer?.length) return res.status(400).json({ error: "Choose an image" });
        const mime = imageType(req.file.buffer);
        if (!mime) return res.status(400).json({ error: "The logo must be a PNG, JPG or GIF image" });
        const row = {
          customer_id: customerId,
          mime,
          data: req.file.buffer,
          file_name: String(req.file.originalname || "").slice(0, 255) || null,
          updated_by: userId,
        };
        await query(
          `INSERT INTO customer_logos SET ? ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data),
             file_name = VALUES(file_name), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP`,
          [row],
        );
        res.json({ success: true });
      } catch (err) {
        console.error("customer logo upload error:", err);
        res.status(500).json({ error: "Failed to save the logo" });
      }
    });
  });

  app.delete("/api/customer_logo/:customerId", async (req, res) => {
    if (!requireUser(req, res)) return;
    try {
      await query("DELETE FROM customer_logos WHERE customer_id = ?", [parseInt(req.params.customerId)]);
      res.json({ success: true });
    } catch (err) {
      console.error("customer logo delete error:", err);
      res.status(500).json({ error: "Failed to remove the logo" });
    }
  });
}

module.exports = { customerLogosAPIs };
