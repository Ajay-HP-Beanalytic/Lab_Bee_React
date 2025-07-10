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
  // Simplified auth for testing - REPLACE WITH YOUR ACTUAL AUTH
  const authenticateUser = (req, res, next) => {
    console.log(
      "🔐 Auth check - Session:",
      req.session?.userId,
      "User:",
      req.user?.id
    );

    // For testing only - remove in production
    req.userId = req.user?.id || req.session?.userId || 1;

    if (!req.userId) {
      console.log("❌ Authentication failed");
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("✅ User authenticated:", req.userId);
    next();
  };

  // List files endpoint
  app.get("/api/files", authenticateUser, async (req, res) => {
    try {
      console.log("📋 GET /api/files - folder:", req.query.folder);
      const { folder = "" } = req.query;
      const files = await fileStorageService.listFiles(folder);

      console.log("✅ Sending files response:", files.length, "items");
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
        console.log("📤 POST /api/files/upload");

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const { folder = "uploads" } = req.body;
        const uploadedFile = await fileStorageService.uploadFile(
          req.file,
          folder,
          req.file.originalname
        );

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
        console.log("📥 GET /api/files/download:", req.params.path);
        const filePath = req.params.path;
        const fileInfo = await fileStorageService.getFileInfo(filePath);
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
      console.log("🔍 GET /api/files/search:", req.query.q);
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }

      const files = await fileStorageService.searchFiles(q);
      res.json({ files, query: q });
    } catch (error) {
      console.error("❌ Error in search:", error);
      res.status(500).json({ error: "Failed to search files" });
    }
  });

  // Delete endpoint
  app.delete("/api/files/:path(*)", authenticateUser, async (req, res) => {
    try {
      console.log("🗑️ DELETE /api/files:", req.params.path);
      const filePath = req.params.path;
      await fileStorageService.deleteFile(filePath);
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("❌ Error in delete:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Create directory endpoint
  app.post("/api/files/mkdir", authenticateUser, async (req, res) => {
    try {
      console.log("📁 POST /api/files/mkdir:", req.body.path);
      const { path: dirPath } = req.body;

      if (!dirPath) {
        return res.status(400).json({ error: "Directory path required" });
      }

      await fileStorageService.createDirectory(dirPath);
      res.json({ message: "Directory created successfully" });
    } catch (error) {
      console.error("❌ Error in mkdir:", error);
      res.status(500).json({ error: "Failed to create directory" });
    }
  });

  console.log("🚀 File storage APIs registered successfully");

  // Get storage system information
  app.get("/api/files/storage-info", authenticateUser, async (req, res) => {
    try {
      console.log("📊 GET /api/files/storage-info");
      const storageInfo = await fileStorageService.getStorageInfo();
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
      console.log("🔍 GET /api/files/verify-structure");
      const verification = await fileStorageService.verifyDirectoryStructure();
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
        console.log("🔧 POST /api/files/recreate-structure");
        await fileStorageService.ensureDirectoriesExist();
        await fileStorageService.createDefaultStructure();

        const verification =
          await fileStorageService.verifyDirectoryStructure();
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
      console.log("🧹 POST /api/files/cleanup-temp");
      const cleanedCount = await fileStorageService.cleanupTempFiles();
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
        console.log("📁 POST /api/files/create-directory");
        const { path: dirPath, description } = req.body;

        if (!dirPath) {
          return res.status(400).json({ error: "Directory path required" });
        }

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
      console.log(`📈 GET /api/files/stats/${folderPath}`);

      const fullPath = path.join(fileStorageService.baseDir, folderPath);

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
      console.log("👁️ GET /api/files/view:", filePath);

      const fileInfo = await fileStorageService.viewFile(filePath);
      console.log("✅ File info:", fileInfo);
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
      console.log("📄 GET /api/files/content:", filePath);

      const fileContent = await fileStorageService.getFileContent(filePath);
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
      console.log("🔗 GET /api/files/serve:", filePath);

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
