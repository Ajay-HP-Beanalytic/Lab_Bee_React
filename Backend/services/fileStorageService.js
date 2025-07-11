const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");

class FileStorageService {
  constructor() {
    // This is correct for Backend/services/fileStorageService.js
    this.baseDir = path.join(__dirname, "../../shared-files");

    // Initialize directories
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      await this.ensureDirectoriesExist();
      // await this.createDefaultStructure();  // To  create default sub folders:
    } catch (error) {
      console.error("❌ Failed to initialize file storage:", error);
      throw error;
    }
  }

  async ensureDirectoriesExist() {
    // Create the main shared-files directory if it doesn't exist
    if (!fs.existsSync(this.baseDir)) {
      try {
        await fs.ensureDir(this.baseDir);
      } catch (error) {
        console.error(`❌ Failed to create main directory: ${error.message}`);
        throw error;
      }
    } else {
      // console.log(`✓ Main directory already exists: ${this.baseDir}`);
    }

    // Define all subdirectories to create
    const directories = [
      {
        name: "Quotation",
        description: "Store quotation documents and related files",
      },
      {
        name: "TS1",
        description: "TS1 testing related files and documents",
      },
      {
        name: "TS2",
        description: "TS2 testing related files and documents",
      },
    ];

    // Create each directory
    for (const dir of directories) {
      try {
        const dirPath = path.join(this.baseDir, dir.name);
        if (!fs.existsSync(dirPath)) {
          await fs.ensureDir(dirPath);
        } else {
          // console.log(`✓ Directory exists: ${dir.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create directory: ${error.message}`);
      }
    }
  }

  async createDefaultStructure() {
    try {
      const directoryInfo = {
        Quotation: {
          subdirs: ["drafts", "approved", "archived"],
        },

        TS1: {
          subdirs: ["procedures", "templates", "compliance"],
        },

        TS2: {
          subdirs: ["procedures", "templates", "compliance"],
        },

        uploads: {
          subdirs: [new Date().getFullYear().toString()], // Create current year folder
        },

        temp: {
          subdirs: [],
        },

        archived: {
          subdirs: [new Date().getFullYear().toString()],
        },
      };

      // Create README files and subdirectories
      for (const [dirName, info] of Object.entries(directoryInfo)) {
        const mainDirPath = path.join(this.baseDir, dirName);

        // Create subdirectories
        for (const subdir of info.subdirs) {
          const subdirPath = path.join(mainDirPath, subdir);
          if (!fs.existsSync(subdirPath)) {
            await fs.ensureDir(subdirPath);
          }
        }
      }
    } catch (error) {
      console.error("❌ Error creating default structure:", error);
      // Don't throw here, as this is optional
    }
  }

  // Method to verify directory structure
  async verifyDirectoryStructure() {
    const requiredDirs = ["Quotation-files", "TS1-standards", "TS2-standards"];

    const results = {
      allExist: true,
      missing: [],
      existing: [],
    };

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.baseDir, dir);
      if (fs.existsSync(dirPath)) {
        results.existing.push(dir);
      } else {
        results.missing.push(dir);
        results.allExist = false;
      }
    }

    if (results.missing.length > 0) {
      console.log(`❌ Missing directories: ${results.missing.join(", ")}`);
    }

    return results;
  }

  // Add method to create new directories on demand
  async createCustomDirectory(dirPath, description = "") {
    try {
      const fullPath = path.join(this.baseDir, dirPath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      await fs.ensureDir(fullPath);

      // Create a README for the new directory
      if (description) {
        const readmePath = path.join(fullPath, "README.md");
        const readmeContent = `# ${path.basename(
          dirPath
        )} Directory ${description} Created: ${new Date().toISOString()}`;
        await fs.writeFile(readmePath, readmeContent);
      }
      console.log(`📁 Created custom directory: ${dirPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  // Cleanup method for temporary files
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.baseDir, "temp");
      if (!fs.existsSync(tempDir)) return;

      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      let cleanedCount = 0;
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} temporary files`);
      }

      return cleanedCount;
    } catch (error) {
      console.error("Error cleaning temp files:", error);
      return 0;
    }
  }

  // Method to get storage statistics
  async getStorageInfo() {
    try {
      const stats = await fs.stat(this.baseDir);
      const infoPath = path.join(this.baseDir, "storage-info.json");

      let systemInfo = {};
      if (fs.existsSync(infoPath)) {
        systemInfo = await fs.readJSON(infoPath);
      }

      return {
        baseDirectory: this.baseDir,
        created: stats.birthtime,
        lastModified: stats.mtime,
        systemInfo,
        directoryStructure: await this.verifyDirectoryStructure(),
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      throw error;
    }
  }

  // Method to list files
  async listFiles(folderPath = "") {
    try {
      const fullPath = path.join(this.baseDir, folderPath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      if (!(await fs.pathExists(fullPath))) {
        await fs.ensureDir(fullPath);
        return [];
      }

      const items = await fs.readdir(fullPath, { withFileTypes: true });

      const files = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(fullPath, item.name);
          const stats = await fs.stat(itemPath);

          return {
            id: path.join(folderPath, item.name).replace(/\\/g, "/"),
            name: item.name,
            type: item.isDirectory() ? "folder" : "file",
            size: item.isFile() ? stats.size : null,
            mimeType: item.isFile() ? mime.lookup(item.name) : null,
            lastModified: stats.mtime,
            path: path.join(folderPath, item.name).replace(/\\/g, "/"),
          };
        })
      );

      return files;
    } catch (error) {
      console.error("❌ Error listing files:", error);
      throw error;
    }
  }

  // Method to upload a file
  async uploadFile(file, destinationPath, originalName) {
    try {
      const fullDestPath = path.join(
        this.baseDir,
        destinationPath,
        originalName
      );

      if (!fullDestPath.startsWith(this.baseDir)) {
        throw new Error("Invalid destination path");
      }

      await fs.ensureDir(path.dirname(fullDestPath));
      await fs.move(file.path, fullDestPath);

      return {
        name: originalName,
        path: path.join(destinationPath, originalName).replace(/\\/g, "/"),
        size: file.size,
        mimeType: mime.lookup(originalName),
      };
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      throw error;
    }
  }

  //Method to view a file:
  async viewFile(filePath) {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      if (!(await fs.pathExists(fullPath))) {
        throw new Error("File not found");
      }

      const stats = await fs.stat(fullPath);
      const mimeType = mime.lookup(fullPath);

      return {
        name: path.basename(fullPath),
        path: filePath,
        fullPath: fullPath,
        size: stats.size,
        mimeType: mimeType,
        lastModified: stats.mtime,
        isViewable: this.isViewableFile(mimeType),
        viewType: this.getViewType(mimeType),
      };
    } catch (error) {
      console.error("❌ Error viewing file:", error);
      throw error;
    }
  }

  // Check if file can be viewed in browser:
  isViewableFile(mimeType) {
    const viewableTypes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
    ];

    return viewableTypes.includes(mimeType) || mimeType.startsWith("text/");
  }

  // Get view type for different file formats
  getViewType(mimeType) {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    if (mimeType?.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType?.startsWith("text/") || mimeType === "application/json")
      return "text";
    return "download";
  }

  //Method to download the file:
  // Alternative: Direct download stream method
  async downloadFile(filePath) {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      // Security check - prevent directory traversal
      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid file path - security violation");
      }

      // Check if file exists
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats
      const stats = await fs.stat(fullPath);

      // Check if it's a file (not a directory)
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      return {
        success: true,
        name: path.basename(filePath),
        path: filePath,
        fullPath: fullPath,
        size: stats.size,
        mimeType: mime.lookup(filePath),
        lastModified: stats.mtime,
        downloadInfo: {
          originalPath: filePath,
          fileName: path.basename(filePath),
          fileSize: stats.size,
          contentType: mime.lookup(filePath) || "application/octet-stream",
        },
      };
    } catch (error) {
      console.error("❌ Error preparing file download:", error);
      throw error;
    }
  }

  // Get file content for text files
  async getFileContent(filePath, encoding = "utf8") {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      const mimeType = mime.lookup(filePath);

      // Only read content for text files
      if (!this.isTextFile(mimeType)) {
        throw new Error("File is not a text file");
      }

      const content = await fs.readFile(fullPath, encoding);

      return {
        content,
        mimeType,
        encoding,
      };
    } catch (error) {
      console.error("❌ Error reading file content:", error);
      throw error;
    }
  }

  // Check if file is text-based
  isTextFile(mimeType) {
    const textTypes = [
      "text/plain",
      "text/csv",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "application/xml",
      "text/xml",
    ];

    return textTypes.includes(mimeType) || mimeType?.startsWith("text/");
  }

  // Method to delete a file:
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      await fs.remove(fullPath);
      return true;
    } catch (error) {
      console.error("❌ Error deleting file:", error);
      throw error;
    }
  }

  async createDirectory(dirPath) {
    try {
      const fullPath = path.join(this.baseDir, dirPath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      await fs.ensureDir(fullPath);
      return true;
    } catch (error) {
      console.error("❌ Error creating directory:", error);
      throw error;
    }
  }

  async searchFiles(query) {
    try {
      const results = [];
      await this.searchInDirectory(this.baseDir, query.toLowerCase(), results);
      return results;
    } catch (error) {
      console.error("❌ Error searching files:", error);
      throw error;
    }
  }

  async searchInDirectory(dirPath, query, results, relativePath = "") {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = path
        .join(relativePath, item.name)
        .replace(/\\/g, "/");

      if (item.name.toLowerCase().includes(query)) {
        const stats = await fs.stat(itemPath);
        results.push({
          id: itemRelativePath,
          name: item.name,
          type: item.isDirectory() ? "folder" : "file",
          size: item.isFile() ? stats.size : null,
          mimeType: item.isFile() ? mime.lookup(item.name) : null,
          lastModified: stats.mtime,
          path: itemRelativePath,
        });
      }

      if (item.isDirectory()) {
        await this.searchInDirectory(
          itemPath,
          query,
          results,
          itemRelativePath
        );
      }
    }
  }
}

module.exports = new FileStorageService();
