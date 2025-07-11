const { db } = require("./db");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const fileStorageService = require("./services/fileStorageService");

// Configure multer for file uploads:
const upload = multer({
  dest: "/tmp/",
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "application/json",
      "image/jpeg",
      "image/webp",
      "image/jpg",
      "image/png",
      "image/gif",
      "video/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

function fileStorageAPIs(app, io, labbeeUsers) {
  // Middleware to authenticate user via sessions to authenticate files
  const authenticateUser = (req, res, next) => {
    // console.log("🔐 File Storage Auth Check:");
    // console.log("  Session ID:", req.sessionID);
    // console.log("  Session:", req.session);
    // console.log("  Session user_id:", req.session?.user_id);

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

  // Helper function to verify user exists in database
  const verifyUserInDatabase = async (userId) => {
    return new Promise((resolve, reject) => {
      const query =
        "SELECT id, name, department, user_status FROM labbee_users WHERE id = ?";

      db.query(query, [userId], (error, results) => {
        if (error) {
          console.error("Database error:", error);
          reject(error);
          return;
        }

        if (results.length === 0) {
          resolve(false);
          return;
        }

        const user = results[0];

        //check if user status is enabled or not:
        if (user.user_status !== "Enable") {
          console.log("User account disabled:", userId, "Status:", user.status);
          resolve(false);
          return;
        }

        //If user is enabled, return true
        resolve(true);
      });
    });
  };

  // Enhanced logging function with user details:
  const logFileAccess = (userId, filePath, action) => {
    return new Promise((resolve, reject) => {
      // Get user details for better logging
      const query = "SELECT name, department FROM labbee_users WHERE id = ?";

      db.query(query, [userId], (userError, userResults) => {
        if (userError) {
          console.error("Database error:", userError);
          reject(userError);
          return;
        }

        const userName = userResults[0]?.name || "Unknown User";
        const userDepartment =
          userResults[0]?.department || "Unknown Department";

        // Log the file access
        const logQuery = `
        INSERT INTO file_access_log (user_id, file_path, action, accessed_at, user_name, user_department)
        VALUES (?, ?, ?, NOW(), ?, ?)
      `;

        db.query(
          logQuery,
          [userId, filePath, action, userName, userDepartment],
          (error, results) => {
            if (error) {
              console.error("Error logging file access:", error);
              reject(error);
            } else {
              // If the log was successful, resolve the promise
              resolve(results);
            }
          }
        );
      });
    });
  };

  // List files endpoint
  app.get("/api/files", authenticateUser, async (req, res) => {
    try {
      const { folder = "" } = req.query;
      const files = await fileStorageService.listFiles(folder);

      res.json({ files });
    } catch (error) {
      console.error("❌ Error in /api/files:", error);
      res
        .status(500)
        .json({ error: "Failed to list files", details: error.message });
    }
  });

  // Upload endpoint
  app.post(
    "/api/files/upload",
    authenticateUser,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { folder = "uploads" } = req.body;

        const uploadedFile = await fileStorageService.uploadFile(
          req.file,
          folder,
          req.file.originalname
        );

        // Log upload
        await logFileAccess(req.userId, uploadedFile.path, "upload");

        res.json({
          message: "File uploaded successfully",
          file: uploadedFile,
        });
      } catch (error) {
        console.error("❌ Error in upload:", error);
        res
          .status(500)
          .json({ error: "Failed to upload file", details: error.message });
      }
    }
  );

  // Download endpoint
  app.get(
    "/api/files/download/:path(*)",
    authenticateUser,
    async (req, res) => {
      try {
        const filePath = req.params.path;

        const fileInfo = await fileStorageService.downloadFile(filePath);

        // Log download
        await logFileAccess(req.userId, filePath, "download");

        res.download(fileInfo.fullPath, fileInfo.name);
      } catch (error) {
        console.error("❌ Error in download:", error);
        res.status(500).json({ error: "Failed to download file" });
      }
    }
  );

  // Search endpoint
  app.get("/api/files/search", authenticateUser, async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }

      const files = await fileStorageService.searchFiles(q);
      // Log search
      await logFileAccess(req.userId, `search:${q}`, "search");

      res.json({ files, query: q });
    } catch (error) {
      console.error("❌ Error in search:", error);
      res.status(500).json({ error: "Failed to search files" });
    }
  });

  // Delete endpoint
  app.delete("/api/files/:path(*)", authenticateUser, async (req, res) => {
    try {
      const filePath = req.params.path;

      await fileStorageService.deleteFile(filePath);

      // Log deletion
      await logFileAccess(req.userId, filePath, "delete");

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("❌ Error in delete:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Create directory endpoint
  app.post("/api/files/mkdir", authenticateUser, async (req, res) => {
    try {
      const { path: dirPath } = req.body;

      if (!dirPath) {
        return res.status(400).json({ error: "Directory path required" });
      }

      await fileStorageService.createDirectory(dirPath);

      // Log directory creation
      await logFileAccess(req.userId, dirPath, "mkdir");

      res.json({ message: "Directory created successfully" });
    } catch (error) {
      console.error("❌ Error in mkdir:", error);
      res.status(500).json({ error: "Failed to create directory" });
    }
  });

  // Get storage system information
  app.get("/api/files/storage-info", authenticateUser, async (req, res) => {
    try {
      const storageInfo = await fileStorageService.getStorageInfo();
      // Log storage info
      await logFileAccess(req.userId, "storage-info", "info");

      res.json(storageInfo);
    } catch (error) {
      console.error("❌ Error getting storage info:", error);
      res.status(500).json({ error: "Failed to get storage information" });
    }
  });

  //Verify the folder structure:
  // Verify directory structure
  app.get("/api/files/verify-structure", authenticateUser, async (req, res) => {
    try {
      const verification = await fileStorageService.verifyDirectoryStructure();

      // Log structure verification
      await logFileAccess(req.userId, "verify-structure", "verify");

      res.json(verification);
    } catch (error) {
      console.error("❌ Error verifying structure:", error);
      res.status(500).json({ error: "Failed to verify directory structure" });
    }
  });

  // Recreate missing directories
  app.post(
    "/api/files/recreate-structure",
    authenticateUser,
    async (req, res) => {
      try {
        await fileStorageService.ensureDirectoriesExist();
        await fileStorageService.createDefaultStructure();

        const verification =
          await fileStorageService.verifyDirectoryStructure();

        // Log structure recreation
        await logFileAccess(req.userId, "recreate-structure", "recreate");

        res.json({
          message: "Directory structure recreated successfully",
          verification,
        });
      } catch (error) {
        console.error("❌ Error recreating structure:", error);
        res
          .status(500)
          .json({ error: "Failed to recreate directory structure" });
      }
    }
  );

  // Clean up temporary files
  app.post("/api/files/cleanup-temp", authenticateUser, async (req, res) => {
    try {
      const cleanedCount = await fileStorageService.cleanupTempFiles();

      await logFileAccess(req.userId, "temp-cleanup", "cleanup");

      res.json({
        message: `Cleaned up ${cleanedCount} temporary files`,
        cleanedCount,
      });
    } catch (error) {
      console.error("❌ Error cleaning temp files:", error);
      res.status(500).json({ error: "Failed to cleanup temporary files" });
    }
  });

  // Create custom directory
  app.post(
    "/api/files/create-directory",
    authenticateUser,
    async (req, res) => {
      try {
        const { path: dirPath, description } = req.body;

        if (!dirPath) {
          return res.status(400).json({ error: "Directory path required" });
        }

        await logFileAccess(req.userId, dirPath, "create-directory");

        await fileStorageService.createCustomDirectory(dirPath, description);
        res.json({
          message: "Directory created successfully",
          path: dirPath,
        });
      } catch (error) {
        console.error("❌ Error creating custom directory:", error);
        res.status(500).json({ error: "Failed to create directory" });
      }
    }
  );

  // Get directory statistics
  app.get("/api/files/stats/:path(*)?", authenticateUser, async (req, res) => {
    try {
      const folderPath = req.params.path || "";

      const fullPath = path.join(fileStorageService.baseDir, folderPath);

      await logFileAccess(req.userId, fullPath, "stats");

      if (!fullPath.startsWith(fileStorageService.baseDir)) {
        return res.status(400).json({ error: "Invalid path" });
      }

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: "Directory not found" });
      }

      const files = await fileStorageService.listFiles(folderPath);

      const stats = {
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
      };

      res.json(stats);
    } catch (error) {
      console.error("❌ Error getting directory stats:", error);
      res.status(500).json({ error: "Failed to get directory statistics" });
    }
  });

  // View file endpoint
  app.get("/api/files/view/:path(*)", authenticateUser, async (req, res) => {
    try {
      const filePath = req.params.path;

      const fileInfo = await fileStorageService.viewFile(filePath);

      // await logFileAccess(req.userId, filePath, "View");

      res.json({ file: fileInfo });
    } catch (error) {
      console.error("❌ Error in view endpoint:", error);
      res.status(500).json({ error: "Failed to view file" });
    }
  });

  // Get file content for text files
  app.get("/api/files/content/:path(*)", authenticateUser, async (req, res) => {
    try {
      const filePath = req.params.path;

      const fileContent = await fileStorageService.getFileContent(filePath);

      await logFileAccess(req.userId, filePath, "Text Content ");

      res.json(fileContent);
    } catch (error) {
      console.error("❌ Error getting file content:", error);
      res.status(500).json({ error: "Failed to get file content" });
    }
  });

  // Serve files directly for viewing (alternative to download)
  app.get("/api/files/serve/:path(*)", authenticateUser, async (req, res) => {
    try {
      const filePath = req.params.path;

      const fileInfo = await fileStorageService.viewFile(filePath);

      // Set appropriate headers for inline viewing
      res.setHeader(
        "Content-Type",
        fileInfo.mimeType || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileInfo.name}"`
      );

      await logFileAccess(req.userId, filePath, "View");

      // Stream the file
      const fileStream = fs.createReadStream(fileInfo.fullPath);

      fileStream.pipe(res);
    } catch (error) {
      console.error("❌ Error serving file:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });
}

module.exports = { fileStorageAPIs };
