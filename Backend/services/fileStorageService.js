const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");

class FileStorageService {
  constructor() {
    this.baseDir = path.join(__dirname, "../../shared-files");
    this.ensureDirectoriesExist();
  }

  //Ensure directories exist
  async ensureDirectoriesExist() {
    const directories = [
      "Quotaion-files",
      "TS1-standards",
      "TS2-standards",
      "uploads ",
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(this.baseDir, dir));
    }
  }

  // List files and folders
  async listFiles(folderPath = "") {
    try {
      const fullPath = path.join(this.baseDir, folderPath);

      // Security check - prevent directory traversal
      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      const items = await fs.readdir(fullPath, { withFileTypes: true });

      const files = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(fullPath, item.name);
          const stats = await fs.stat(itemPath);

          return {
            id: path.join(folderPath, item.name),
            name: item.name,
            type: item.isDirectory() ? "folder" : "file",
            size: item.isFile() ? stats.size : null,
            mimeType: item.isFile() ? mime.lookup(item.name) : null,
            lastModified: stats.mtime,
            path: path.join(folderPath, item.name),
          };
        })
      );

      return files;
    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
  }

  // Get file information
  async getFileInfo(filePath) {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      const stats = await fs.stat(fullPath);

      return {
        name: path.basename(filePath),
        size: stats.size,
        mimeType: mime.lookup(filePath),
        lastModified: stats.mtime,
        fullPath: fullPath,
      };
    } catch (error) {
      console.error("Error getting file info:", error);
      throw error;
    }
  }

  // Upload file
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
        path: path.join(destinationPath, originalName),
        size: file.size,
        mimeType: mime.lookup(originalName),
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.baseDir, filePath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      await fs.remove(fullPath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  // Search files
  async searchFiles(query) {
    try {
      const results = [];
      await this.searchInDirectory(this.baseDir, query.toLowerCase(), results);
      return results;
    } catch (error) {
      console.error("Error searching files:", error);
      throw error;
    }
  }

  // Helper method for recursive search
  async searchInDirectory(dirPath, query, results, relativePath = "") {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = path.join(relativePath, item.name);

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

  // Create directory
  async createDirectory(dirPath) {
    try {
      const fullPath = path.join(this.baseDir, dirPath);

      if (!fullPath.startsWith(this.baseDir)) {
        throw new Error("Invalid path");
      }

      await fs.ensureDir(fullPath);
      return true;
    } catch (error) {
      console.error("Error creating directory:", error);
      throw error;
    }
  }
}

module.exports = new FileStorageService();
