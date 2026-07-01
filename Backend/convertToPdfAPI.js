const multer = require("multer");
const libre = require("libreoffice-convert");

// Manual Promise wrapper — libre.convert is callback-based.
// Using util.promisify triggers a false DEP0174 warning on this library.
const libreConvert = (buffer, format, filter) =>
  new Promise((resolve, reject) => {
    libre.convert(buffer, format, filter, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

// Keep the DOCX in memory — no temp files on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const convertToPdfAPIs = (app) => {
  app.post("/api/convert-to-pdf", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file received." });
    }

    try {
      const pdfBuffer = await libreConvert(req.file.buffer, ".pdf", undefined);

      const pdfName = req.file.originalname.replace(/\.docx$/i, ".pdf");

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfName}"`,
        "Content-Length": pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (err) {
      console.error("[convert-to-pdf] LibreOffice error:", err.message);
      res
        .status(500)
        .json({
          error:
            "PDF conversion failed. Make sure LibreOffice is installed on the server.",
        });
    }
  });
};

module.exports = { convertToPdfAPIs };
