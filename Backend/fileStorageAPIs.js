const { db } = require("./db");
const os = require("os");
const fs = require("fs-extra");
const path = require("path");
const multer = require("multer");
const contentDisposition = require("content-disposition");
const fileStorageService = require("./services/fileStorageService");
const fileIndex = require("./services/fileIndex");
const standards = require("./FeasibilityAutomation/standards/standardsLibrary");

const MAX_UPLOAD_MB = Number(process.env.FILE_UPLOAD_MAX_MB) || 200;

// multer 1.x reads file names as latin1; browsers send UTF-8
const decodeName = (name) => {
  const utf8 = Buffer.from(String(name || ""), "latin1").toString("utf8");
  return utf8.includes("�") ? name : utf8;
};

// Configure multer for file uploads (checked by extension: browsers do not always send the right MIME type).
// preservePath keeps "Sub/folder/a.pdf" names from folder uploads. A file of a
// type that is not allowed is left out (and reported), not the whole batch.
const upload = multer({
  dest: os.tmpdir(),
  preservePath: true,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 50 },
  fileFilter: (req, file, cb) => {
    const name = decodeName(file.originalname);
    const ext = path.extname(name).slice(1).toLowerCase();
    if (fileStorageService.allowedExtensions.includes(ext)) return cb(null, true);
    (req.rejectedFiles ||= []).push({ name, error: `Files of type .${ext || "?"} cannot be uploaded`, status: 400 });
    cb(null, false);
  },
});

// Same people as the Org Documents page (route "org_docs" in App.js): they can
// delete, create folders and change the Standards library. Everyone logged in
// can view, download and upload (calibration certificates are uploaded from other pages).
const MANAGER_DEPARTMENTS = ["Administration"];
const MANAGER_ROLES = ["Quality Engineer"];
const canManageFiles = (session) =>
  String(session?.department || "")
    .split(",")
    .some((d) => MANAGER_DEPARTMENTS.includes(d.trim())) || MANAGER_ROLES.includes(session?.role);

const inStandards = (relPath) => {
  const p = String(relPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return p === standards.ROOT || p.startsWith(`${standards.ROOT}/`);
};

function fileStorageAPIs(app, io, labbeeUsers) {
  // Middleware to authenticate user via sessions to authenticate files
  const authenticateUser = (req, res, next) => {
    //check if the user is logged in via session:
    const userId = req.session?.user_id;

    if (!userId) {
      return res.status(401).json({
        error: "User not authenticated",
        details: "Please log in to access files",
      });
    }

    // Verify user exists in database:
    verifyUserInDatabase(userId)
      .then((userExists) => {
        if (!userExists) {
          return res.status(401).json({
            error: "Invalid user session",
            details: "Please log in to access files",
          });
        }

        // Set userId for use in file operations
        req.userId = userId;
        req.canManageFiles = canManageFiles(req.session);

        next();
      })
      .catch((error) => {
        console.error("❌ Database error during authentication:", error);
        return res.status(500).json({
          error: "Authentication error",
          details: "Database verification failed",
        });
      });
  };

  const requireManager = (req, res, next) =>
    req.canManageFiles ? next() : res.status(403).json({ error: "Only Administration and the Quality Engineer can do this" });

  // Helper function to verify user exists in database
  const verifyUserInDatabase = async (userId) => {
    const [results] = await db
      .promise()
      .query("SELECT id, user_status FROM labbee_users WHERE id = ?", [userId]);
    //check if user status is enabled or not:
    return results.length > 0 && results[0].user_status === "Enable";
  };

  // Log who did what. A failed log entry never fails the request itself.
  const logFileAccess = (req, filePath, action) => {
    db.promise()
      .query(
        `INSERT INTO file_access_log (user_id, file_path, action, accessed_at, user_name, user_department)
         VALUES (?, ?, ?, NOW(), ?, ?)`,
        [req.userId, String(filePath).slice(0, 500), action, req.session?.username || null, req.session?.department || null],
      )
      .catch((error) => console.error("Error logging file access:", error.message));
  };

  // Answer an error: its own status and message when it has one (bad path, not found …)
  const sendError = (res, error, message) => {
    if (!error.status) console.error(`❌ ${message}:`, error);
    if (!res.headersSent) res.status(error.status || 500).json({ error: error.status ? error.message : message });
  };

  // Index the store and the standards register once the server is up
  setTimeout(() => {
    fileIndex
      .ensureTable()
      .then(() => standards.ensureTables())
      .then(() => fileIndex.reindex())
      .then(() => standards.syncWithFiles())
      .catch((error) => console.error("❌ File index / standards start-up:", error.message));
  }, 5000);

  // List files endpoint
  app.get("/api/files", authenticateUser, async (req, res) => {
    try {
      const folder = String(req.query.folder || "").replace(/^\/+|\/+$/g, "");
      const files = await fileStorageService.listFiles(folder);
      const uploadedBy = await fileIndex.uploaders(folder).catch(() => new Map());
      res.json({
        files: files.map((f) => ({ ...f, uploadedBy: uploadedBy.get(f.path) || null })),
        canManage: req.canManageFiles,
        maxUploadMb: MAX_UPLOAD_MB,
      });
      // bring the index in line with what is on disk
      fileIndex.syncFolder(folder, files).catch((error) => console.error("File index sync:", error.message));
    } catch (error) {
      sendError(res, error, "Failed to list files");
    }
  });

  // Upload endpoint: one file ("file") or several ("files"). A file name may
  // include sub-folders (folder upload). The same file again is skipped; a
  // different file with an existing name is saved as "name (1).pdf".
  const receiveFiles = (req, res, next) =>
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "files", maxCount: 50 },
    ])(req, res, (error) => {
      if (!error) return next();
      Object.values(req.files || {}).flat().forEach((f) => fs.remove(f.path).catch(() => {}));
      if (error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: `A file is larger than ${MAX_UPLOAD_MB} MB` });
      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ error: "Upload at most 50 files at a time" });
      res.status(error.status || 400).json({ error: error.message || "Upload failed" });
    });

  app.post("/api/files/upload", authenticateUser, receiveFiles, async (req, res) => {
    const incoming = Object.values(req.files || {}).flat();
    const rejected = req.rejectedFiles || [];
    if (!incoming.length) {
      return res.status(rejected[0]?.status || 400).json({ error: rejected[0]?.error || "No file uploaded", errors: rejected });
    }

    // no folder sent: "uploads"; "" = Home (folder uploads at the top level)
    const folder = req.body.folder === undefined ? "uploads" : String(req.body.folder);

    const saved = [];
    const errors = [...rejected];
    for (const file of incoming) {
      const name = decodeName(file.originalname);
      try {
        const target = [folder, ...name.replace(/\\/g, "/").split("/").slice(0, -1)].filter(Boolean).join("/");
        if (inStandards(target) && !req.canManageFiles) {
          throw Object.assign(new Error("Only Administration and the Quality Engineer can add standards"), { status: 403 });
        }
        const uploadedFile = await fileStorageService.uploadFile(file, folder, name);
        const parent = uploadedFile.path.split("/").slice(0, -1).join("/");
        if (parent) await fileIndex.recordFolder(parent).catch((e) => console.error("File index:", e.message));
        await fileIndex.recordUpload(uploadedFile, { id: req.userId, name: req.session?.username }).catch((e) => console.error("File index:", e.message));
        const duplicateOf = uploadedFile.skipped ? null : await fileIndex.sameContent(uploadedFile.sha256, uploadedFile.path).catch(() => null);
        let standardId = null;
        if (standards.isStandardFile(uploadedFile.path)) {
          standardId = await standards.register(uploadedFile.path, req.userId).catch((e) => console.error("Standards register:", e.message));
        }
        logFileAccess(req, uploadedFile.path, "upload");
        const { sha256, ...rest } = uploadedFile;
        saved.push({ ...rest, originalName: name, duplicateOf, standardId: standardId || null });
      } catch (error) {
        fs.remove(file.path).catch(() => {});
        if (!error.status) console.error("❌ Error in upload:", error);
        errors.push({ name, error: error.status ? error.message : "Could not be saved", status: error.status || 500 });
      }
    }

    if (!saved.length) {
      return res.status(errors[0].status).json({ error: errors[0].error, errors });
    }
    res.json({
      message: saved.length === 1 ? "File uploaded successfully" : `${saved.length} files uploaded`,
      file: saved[0],
      files: saved,
      errors,
    });
  });

  // Download endpoint (streamed, supports resuming)
  app.get("/api/files/download/:path(*)", authenticateUser, async (req, res) => {
    try {
      const fileInfo = await fileStorageService.downloadFile(req.params.path);
      logFileAccess(req, fileInfo.path, "download");
      res.download(fileInfo.fullPath, fileInfo.name, { dotfiles: "allow" }, (error) => {
        if (error && !res.headersSent) sendError(res, error, "Failed to download file");
      });
    } catch (error) {
      sendError(res, error, "Failed to download file");
    }
  });

  // Search endpoint: file and folder names (from the index; walks the folders if the index cannot be used)
  app.get("/api/files/search", authenticateUser, async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }

      let files;
      try {
        files = await fileIndex.search(q);
      } catch (error) {
        console.error("File index search failed, searching the folders:", error.message);
        files = [];
        const needle = q.toLowerCase();
        await fileStorageService.walk(async (item) => {
          if (files.length < 200 && item.name.toLowerCase().includes(needle)) files.push(item);
        });
      }
      logFileAccess(req, `search:${q}`, "search");

      res.json({ files, query: q });
    } catch (error) {
      sendError(res, error, "Failed to search files");
    }
  });

  // Delete a file (moved to the hidden .trash folder) or an empty folder
  app.delete("/api/files/:path(*)", authenticateUser, requireManager, async (req, res) => {
    try {
      const filePath = req.params.path;
      await fileStorageService.deleteFile(filePath);
      await fileIndex.remove(filePath).catch((e) => console.error("File index:", e.message));
      if (inStandards(filePath)) await standards.unregister(filePath).catch((e) => console.error("Standards:", e.message));
      logFileAccess(req, filePath, "delete");

      res.json({ message: "Deleted successfully" });
    } catch (error) {
      sendError(res, error, "Failed to delete file");
    }
  });

  // Create directory endpoint
  app.post("/api/files/mkdir", authenticateUser, requireManager, async (req, res) => {
    try {
      const { path: dirPath } = req.body;

      if (!dirPath) {
        return res.status(400).json({ error: "Directory path required" });
      }

      const fullPath = await fileStorageService.createDirectory(dirPath);
      await fileIndex.recordFolder(fileStorageService.relative(fullPath)).catch((e) => console.error("File index:", e.message));
      logFileAccess(req, dirPath, "mkdir");

      res.json({ message: "Directory created successfully" });
    } catch (error) {
      sendError(res, error, "Failed to create directory");
    }
  });

  // Other pages keep paths of stored files; a move updates them so their links keep working
  const FILE_REFERENCES = [
    ["chamber_calibration", "calibration_certificate_path"],
    ["emi_calibrations_table", "calibration_certificate_path"],
  ];
  const updateReferences = async (oldPath, newPath) => {
    for (const [table, column] of FILE_REFERENCES) {
      await db
        .promise()
        .query(
          `UPDATE ${table} SET ${column} = CONCAT(?, SUBSTRING(${column}, ?)) WHERE ${column} = ? OR ${column} LIKE ?`,
          [newPath, oldPath.length + 1, oldPath, `${oldPath.replace(/[\\%_]/g, (c) => `\\${c}`)}/%`],
        )
        .catch((e) => console.error(`File references (${table}):`, e.message));
    }
  };

  // Move or copy files/folders into another folder: { paths: [...], to: "TS1/x", mode: "move" | "copy" }
  app.post("/api/files/transfer", authenticateUser, requireManager, async (req, res) => {
    try {
      const { paths, to = "", mode = "move" } = req.body || {};
      if (!Array.isArray(paths) || !paths.length) return res.status(400).json({ error: "Nothing selected" });
      if (!["move", "copy"].includes(mode)) return res.status(400).json({ error: "mode must be move or copy" });

      const done = [];
      const errors = [];
      for (const from of paths.slice(0, 500)) {
        try {
          const result = await fileStorageService.transfer(from, to, mode);
          if (mode === "move") {
            await fileIndex.rename(result.from, result.path).catch((e) => console.error("File index:", e.message));
            await standards.renamePaths(result.from, result.path).catch((e) => console.error("Standards:", e.message));
            await updateReferences(result.from, result.path);
          } else {
            await fileIndex.indexTree(result.path).catch((e) => console.error("File index:", e.message));
          }
          logFileAccess(req, `${result.from} -> ${result.path}`, mode);
          done.push(result);
        } catch (error) {
          if (!error.status) console.error(`❌ Error in ${mode}:`, error);
          errors.push({ name: from, error: error.status ? error.message : `Could not ${mode}` });
        }
      }
      // PDFs that came into Standards/ join the register
      if (done.length && (inStandards(to) || done.some((d) => inStandards(d.path)))) {
        standards.syncWithFiles().catch((e) => console.error("Standards:", e.message));
      }
      if (!done.length) return res.status(400).json({ error: errors[0]?.error || "Nothing done", errors });
      res.json({ done, errors });
    } catch (error) {
      sendError(res, error, "Failed to move files");
    }
  });

  // Re-read the whole store into the search index (after files were copied onto the server directly)
  app.post("/api/files/reindex", authenticateUser, requireManager, async (req, res) => {
    try {
      const indexed = await fileIndex.reindex();
      const standardFiles = await standards.syncWithFiles();
      logFileAccess(req, "reindex", "reindex");
      res.json({ indexed, standards: standardFiles });
    } catch (error) {
      sendError(res, error, "Failed to re-index the files");
    }
  });

  // Get storage system information
  app.get("/api/files/storage-info", authenticateUser, async (req, res) => {
    try {
      const storageInfo = await fileStorageService.getStorageInfo();
      logFileAccess(req, "storage-info", "info");
      res.json(storageInfo);
    } catch (error) {
      sendError(res, error, "Failed to get storage information");
    }
  });

  // Verify directory structure
  app.get("/api/files/verify-structure", authenticateUser, async (req, res) => {
    try {
      const verification = await fileStorageService.verifyDirectoryStructure();
      logFileAccess(req, "verify-structure", "verify");
      res.json(verification);
    } catch (error) {
      sendError(res, error, "Failed to verify directory structure");
    }
  });

  // Recreate missing directories
  app.post("/api/files/recreate-structure", authenticateUser, requireManager, async (req, res) => {
    try {
      await fileStorageService.ensureDirectoriesExist();
      await fileStorageService.createDefaultStructure();
      const verification = await fileStorageService.verifyDirectoryStructure();
      logFileAccess(req, "recreate-structure", "recreate");

      res.json({
        message: "Directory structure recreated successfully",
        verification,
      });
    } catch (error) {
      sendError(res, error, "Failed to recreate directory structure");
    }
  });

  // Clean up temporary files
  app.post("/api/files/cleanup-temp", authenticateUser, requireManager, async (req, res) => {
    try {
      const cleanedCount = await fileStorageService.cleanupTempFiles();
      logFileAccess(req, "temp-cleanup", "cleanup");
      res.json({
        message: `Cleaned up ${cleanedCount} temporary files`,
        cleanedCount,
      });
    } catch (error) {
      sendError(res, error, "Failed to cleanup temporary files");
    }
  });

  // Create custom directory
  app.post("/api/files/create-directory", authenticateUser, requireManager, async (req, res) => {
    try {
      const { path: dirPath, description } = req.body;

      if (!dirPath) {
        return res.status(400).json({ error: "Directory path required" });
      }

      await fileStorageService.createCustomDirectory(dirPath, description);
      logFileAccess(req, dirPath, "create-directory");
      res.json({
        message: "Directory created successfully",
        path: dirPath,
      });
    } catch (error) {
      sendError(res, error, "Failed to create directory");
    }
  });

  // Get directory statistics
  app.get("/api/files/stats/:path(*)?", authenticateUser, async (req, res) => {
    try {
      const folderPath = req.params.path || "";
      const files = await fileStorageService.listFiles(folderPath);
      logFileAccess(req, folderPath || "/", "stats");

      res.json({
        path: folderPath,
        totalItems: files.length,
        folders: files.filter((f) => f.type === "folder").length,
        files: files.filter((f) => f.type === "file").length,
        totalSize: files
          .filter((f) => f.type === "file")
          .reduce((sum, f) => sum + (f.size || 0), 0),
        lastModified:
          files.length > 0
            ? new Date(Math.max(...files.map((f) => new Date(f.lastModified))))
            : null,
      });
    } catch (error) {
      sendError(res, error, "Failed to get directory statistics");
    }
  });

  // View file endpoint
  app.get("/api/files/view/:path(*)", authenticateUser, async (req, res) => {
    try {
      const { fullPath, ...fileInfo } = await fileStorageService.viewFile(req.params.path);
      res.json({ file: fileInfo });
    } catch (error) {
      sendError(res, error, "Failed to view file");
    }
  });

  // Get file content for text files
  app.get("/api/files/content/:path(*)", authenticateUser, async (req, res) => {
    try {
      const fileContent = await fileStorageService.getFileContent(req.params.path);
      logFileAccess(req, req.params.path, "Text Content");
      res.json(fileContent);
    } catch (error) {
      sendError(res, error, "Failed to get file content");
    }
  });

  // Serve files directly for viewing. Streamed with range support, so a large
  // PDF opens at once and can be opened at a page (…#page=12).
  app.get("/api/files/serve/:path(*)", authenticateUser, async (req, res) => {
    try {
      const fileInfo = await fileStorageService.viewFile(req.params.path);
      logFileAccess(req, fileInfo.path, "View");
      res.sendFile(
        fileInfo.fullPath,
        {
          dotfiles: "allow",
          headers: {
            "Content-Type": fileInfo.mimeType || "application/octet-stream",
            "Content-Disposition": contentDisposition(fileInfo.name, { type: "inline" }),
            "X-Content-Type-Options": "nosniff",
            // a stored HTML/SVG file must not run scripts on our domain
            ...(/html|svg|xml/.test(fileInfo.mimeType) ? { "Content-Security-Policy": "sandbox" } : {}),
          },
        },
        (error) => {
          if (error && !res.headersSent) sendError(res, error, "Failed to serve file");
        },
      );
    } catch (error) {
      sendError(res, error, "Failed to serve file");
    }
  });
}

module.exports = { fileStorageAPIs, canManageFiles };
