const { db } = require("./db");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const fileStorageService = require("./services/fileStorageService");

// Configure multer for file uploads:
const upload = multer({
  dest: "/tmp/", //Temporary directory
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, Word, Excel, and text files are allowed."
        )
      );
    }
  },
});

function fileStorageAPIs(app, io, labbeeUsers) {
  // Middleware to check authentication:
  const authenticateUser = (req, res, next) => {
    // Use your existing authentication middleware
    const userId = req.user?.id || req.session?.userId;

    if (!userId) {
      console.log("User not authenticated", error);
      return res.status(401).json({ error: "User not authenticated" });
    }

    req.userId = userId;
    next();
  };

  // List files and folders
  app.get("/api/files", authenticateUser, async (req, res) => {
    try {
      const { folder = "" } = req.query;
      const files = await fileStorageService.listFiles(folder);

      //Log access log:
      await logFileAccess(req.userId, folder || "root", "list");

      res.json(files);
    } catch (error) {
      console.log("Error listing files", error);
      console.error("Error listing files:", error);
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  // Download file
  app.get(
    "/api/files/download/:path(*)",
    authenticateUser,
    async (req, res) => {
      try {
        const filePath = req.params.path;
        const fileInfo = await fileStorageService.getFileInfo(filePath);

        //Log download:
        await logFileAccess(req.userId, fileInfo, "download");

        res.download(fileInfo.fullPath, fileInfo.name);
      } catch (error) {
        console.log("Error downloading file", error);
        console.error("Error downloading file:", error);
        res.status(500).json({ error: "Failed to download file" });
      }
    }
  );

  // Get file info
  app.get("/api/files/info/:path(*)", authenticateUser, async (req, res) => {
    try {
      const filePath = req.params.path;
      const fileInfo = await fileStorageService.getFileInfo(filePath);

      //Log access log:
      await logFileAccess(req.userId, fileInfo, "info");

      res.json({ file: fileInfo });
    } catch (error) {
      console.log("Error getting file info", error);
      console.error("Error getting file info:", error);
      res.status(500).json({ error: "Failed to get file info" });
    }
  });

  // Upload File:
  app.post("/api/files/upload", authenticateUser, async (req, res) => {
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
      console.log("Error uploading file", error);
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Search files
  app.get("/api/files/search", authenticateUser, async (req, res) => {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }

      const files = await fileStorageService.searchFiles(q);

      // Log search
      await logFileAccess(req.userId, "search", `search:${q}`);

      res.json({ files, query: q });
    } catch (error) {
      console.error("Error searching files:", error);
      res.status(500).json({ error: "Failed to search files" });
    }
  });

  // Delete file
  app.delete("/api/files/:path(*)", authenticateUser, async (req, res) => {
    try {
      const filePath = req.params.path;
      await fileStorageService.deleteFile(filePath);

      // Log deletion
      await logFileAccess(req.userId, filePath, "delete");

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Create directory
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
      console.error("Error creating directory:", error);
      res.status(500).json({ error: "Failed to create directory" });
    }
  });

  // Get file access logs
  app.get("/api/files/logs", authenticateUser, async (req, res) => {
    try {
      const { limit = 100 } = req.query;

      const query = `
                SELECT 
                    fal.*,
                    lu.name as user_name,
                    lu.department
                FROM file_access_log fal
                JOIN labbee_users lu ON fal.user_id = lu.id
                ORDER BY fal.accessed_at DESC 
                LIMIT ?
            `;

      db.query(query, [parseInt(limit)], (error, results) => {
        if (error) {
          console.error("Error fetching file logs:", error);
          return res.status(500).json({ error: "Failed to fetch logs" });
        }

        res.json({ logs: results });
      });
    } catch (error) {
      console.error("Error in logs endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Helper function to log file access
  async function logFileAccess(userId, filePath, action) {
    return new Promise((resolve, reject) => {
      const query = `
                INSERT INTO file_access_log (user_id, file_path, action)
                VALUES (?, ?, ?)
            `;

      db.query(query, [userId, filePath, action], (error, results) => {
        if (error) {
          console.error("Error logging file access:", error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
}

module.exports = { fileStorageAPIs };
