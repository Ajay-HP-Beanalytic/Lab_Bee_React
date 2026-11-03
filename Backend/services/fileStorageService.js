const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const mime = require("mime-types");

// An error with the HTTP status the API should answer with
const fail = (status, message) => Object.assign(new Error(message), { status });

// Folders created on start; Standards holds the standards library (see FeasibilityAutomation/standards)
const ROOT_FOLDERS = ["Quotation", "TS1", "TS2", "Standards"];

// Deleted items are moved here (hidden: names starting with "." are never listed)
const TRASH = ".trash";

// File types that can be uploaded, by extension (browsers do not always send the right MIME type)
const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "json",
  "jpg", "jpeg", "png", "gif", "webp", "mp4", "mp3", "wav", "ogg",
];

const isHidden = (name) => name.startsWith(".");

// A file or folder name that is safe on Windows and Linux
const safeName = (name) => {
  let base = path
    .basename(String(name || "").replace(/\\/g, "/"))
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/^[\s.]+|[\s.]+$/g, "");
  if (base.length > 200) {
    const ext = path.extname(base).slice(0, 20);
    base = base.slice(0, 200 - ext.length) + ext;
  }
  if (!base) throw fail(400, "Invalid name");
  return /^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(base) ? `_${base}` : base;
};

const sha256Of = (fullPath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(fullPath)
      .on("error", reject)
      .on("data", (d) => hash.update(d))
      .on("end", () => resolve(hash.digest("hex")));
  });

class FileStorageService {
  constructor() {
    // FILE_STORAGE_DIR moves the store (e.g. to a bigger disk); default: <repo>/shared-files
    this.baseDir = path.resolve(process.env.FILE_STORAGE_DIR || path.join(__dirname, "../../shared-files"));
    this.allowedExtensions = ALLOWED_EXTENSIONS;
    this.isHidden = isHidden;
    this.sha256Of = sha256Of;

    this.initializeStorage().catch((error) => console.error("❌ Failed to initialize file storage:", error));
  }

  async initializeStorage() {
    await this.ensureDirectoriesExist();
  }

  async ensureDirectoriesExist() {
    await fs.ensureDir(this.baseDir);
    for (const name of ROOT_FOLDERS) {
      await fs.ensureDir(path.join(this.baseDir, name)).catch((error) =>
        console.error(`❌ Failed to create directory ${name}: ${error.message}`),
      );
    }
  }

  async createDefaultStructure() {
    try {
      const subdirs = {
        Quotation: ["drafts", "approved", "archived"],
        TS1: ["procedures", "templates", "compliance"],
        TS2: ["procedures", "templates", "compliance"],
        uploads: [new Date().getFullYear().toString()],
        archived: [new Date().getFullYear().toString()],
        temp: [],
      };
      for (const [dirName, list] of Object.entries(subdirs)) {
        await fs.ensureDir(path.join(this.baseDir, dirName));
        for (const sub of list) await fs.ensureDir(path.join(this.baseDir, dirName, sub));
      }
    } catch (error) {
      console.error("❌ Error creating default structure:", error);
      // Don't throw here, as this is optional
    }
  }

  // "a/b.pdf" → absolute path inside the store. Rejects anything that leaves the
  // store ("../x", or a sibling folder such as shared-files2) and hidden items.
  resolve(relPath = "") {
    const rel = String(relPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const fullPath = path.resolve(this.baseDir, rel);
    if (fullPath !== this.baseDir && !fullPath.startsWith(this.baseDir + path.sep)) {
      throw fail(400, "Invalid path");
    }
    if (path.relative(this.baseDir, fullPath).split(path.sep).some(isHidden)) {
      throw fail(400, "Invalid path");
    }
    return fullPath;
  }

  // Absolute path → "a/b.pdf"
  relative(fullPath) {
    return path.relative(this.baseDir, fullPath).split(path.sep).join("/");
  }

  // Method to verify directory structure
  async verifyDirectoryStructure() {
    const results = { allExist: true, missing: [], existing: [] };
    for (const dir of ROOT_FOLDERS) {
      if (await fs.pathExists(path.join(this.baseDir, dir))) {
        results.existing.push(dir);
      } else {
        results.missing.push(dir);
        results.allExist = false;
      }
    }
    return results;
  }

  // Add method to create new directories on demand
  async createCustomDirectory(dirPath, description = "") {
    const fullPath = await this.createDirectory(dirPath);
    if (description) {
      const readmeContent = `# ${path.basename(fullPath)} Directory ${description} Created: ${new Date().toISOString()}`;
      await fs.writeFile(path.join(fullPath, "README.md"), readmeContent);
    }
    return true;
  }

  // Cleanup method for temporary files
  async cleanupTempFiles() {
    try {
      const tempDir = path.join(this.baseDir, "temp");
      if (!(await fs.pathExists(tempDir))) return 0;

      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      let cleanedCount = 0;
      for (const file of await fs.readdir(tempDir)) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          cleanedCount++;
        }
      }
      return cleanedCount;
    } catch (error) {
      console.error("Error cleaning temp files:", error);
      return 0;
    }
  }

  // Method to get storage statistics
  async getStorageInfo() {
    const stats = await fs.stat(this.baseDir);
    const infoPath = path.join(this.baseDir, "storage-info.json");
    const systemInfo = (await fs.pathExists(infoPath)) ? await fs.readJSON(infoPath) : {};
    return {
      baseDirectory: this.baseDir,
      created: stats.birthtime,
      lastModified: stats.mtime,
      systemInfo,
      directoryStructure: await this.verifyDirectoryStructure(),
    };
  }

  // One entry of a listing
  async describe(fullPath, dirent) {
    const stats = await fs.stat(fullPath);
    const isFolder = dirent ? dirent.isDirectory() : stats.isDirectory();
    const relPath = this.relative(fullPath);
    return {
      id: relPath,
      name: path.basename(fullPath),
      type: isFolder ? "folder" : "file",
      size: isFolder ? null : stats.size,
      mimeType: isFolder ? null : mime.lookup(fullPath) || null,
      lastModified: stats.mtime,
      path: relPath,
    };
  }

  // Folder contents: folders first, then by name (numbers in natural order)
  async listFiles(folderPath = "") {
    const fullPath = this.resolve(folderPath);
    if (!(await fs.pathExists(fullPath))) {
      if (fullPath === this.baseDir) {
        await fs.ensureDir(fullPath);
        return [];
      }
      throw fail(404, "Folder not found");
    }
    if (!(await fs.stat(fullPath)).isDirectory()) throw fail(400, "Not a folder");

    const items = (await fs.readdir(fullPath, { withFileTypes: true })).filter((d) => !isHidden(d.name));
    const files = await Promise.all(
      // An item that cannot be read (removed meanwhile, broken link) is left out
      items.map((d) => this.describe(path.join(fullPath, d.name), d).catch(() => null)),
    );
    return files
      .filter(Boolean)
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }) : a.type === "folder" ? -1 : 1));
  }

  // Free name in the folder: "x.pdf", else "x (1).pdf", "x (2).pdf" …
  async freeName(dirPath, name) {
    const ext = path.extname(name);
    const stem = name.slice(0, name.length - ext.length);
    let candidate = name;
    for (let i = 1; await fs.pathExists(path.join(dirPath, candidate)); i++) candidate = `${stem} (${i})${ext}`;
    return candidate;
  }

  // Moves an uploaded temp file into the folder. originalName may carry
  // sub-folders ("IEC/Part 2/60068-2-6.pdf", from a folder upload); they are created.
  // The same file uploaded again (same name, same content) is skipped; a different
  // file never overwrites an existing one: it gets a free name ("x (1).pdf").
  async uploadFile(file, destinationPath, originalName) {
    const parts = String(originalName || "").replace(/\\/g, "/").split("/").filter(Boolean);
    const wanted = safeName(parts.pop());
    const subFolders = parts.map(safeName);
    const ext = path.extname(wanted).slice(1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) throw fail(400, `Files of type .${ext || "?"} cannot be uploaded`);
    const dirPath = this.resolve([destinationPath, ...subFolders].filter(Boolean).join("/"));

    await fs.ensureDir(dirPath);
    if (!(await fs.stat(dirPath)).isDirectory()) throw fail(400, "Not a folder");
    const sha256 = await sha256Of(file.path);

    const existing = path.join(dirPath, wanted);
    const existingStats = await fs.stat(existing).catch(() => null);
    if (existingStats?.isFile() && existingStats.size === file.size && (await sha256Of(existing)) === sha256) {
      await fs.remove(file.path);
      return {
        name: wanted,
        path: this.relative(existing),
        size: existingStats.size,
        mimeType: mime.lookup(wanted) || null,
        lastModified: existingStats.mtime,
        sha256,
        renamed: false,
        skipped: true,
      };
    }

    const name = await this.freeName(dirPath, wanted);
    const fullPath = path.join(dirPath, name);
    await fs.move(file.path, fullPath, { overwrite: false });
    const stats = await fs.stat(fullPath);

    return {
      name,
      path: this.relative(fullPath),
      size: stats.size,
      mimeType: mime.lookup(name) || null,
      lastModified: stats.mtime,
      sha256,
      renamed: name !== wanted,
    };
  }

  //Method to view a file:
  async viewFile(filePath) {
    const fullPath = this.resolve(filePath);
    if (!(await fs.pathExists(fullPath))) throw fail(404, "File not found");
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) throw fail(400, "Not a file");
    const mimeType = mime.lookup(fullPath) || "application/octet-stream";

    return {
      name: path.basename(fullPath),
      path: this.relative(fullPath),
      fullPath,
      size: stats.size,
      mimeType,
      lastModified: stats.mtime,
      isViewable: this.isViewableFile(mimeType),
      viewType: this.getViewType(mimeType),
    };
  }

  // Check if file can be viewed in browser:
  isViewableFile(mimeType) {
    const viewableTypes = [
      "application/pdf",
      "application/json",
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
    ];
    return viewableTypes.includes(mimeType) || !!mimeType?.startsWith("text/");
  }

  // Get view type for different file formats
  getViewType(mimeType) {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    if (mimeType?.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType?.startsWith("text/") || mimeType === "application/json") return "text";
    return "download";
  }

  //Method to download the file:
  async downloadFile(filePath) {
    const info = await this.viewFile(filePath);
    return { success: true, ...info };
  }

  // Get file content for text files (the viewer shows at most 2 MB)
  async getFileContent(filePath, encoding = "utf8") {
    const info = await this.viewFile(filePath);
    if (!this.isTextFile(info.mimeType)) throw fail(400, "File is not a text file");
    if (info.size > 2 * 1024 * 1024) throw fail(413, "File is too large to show; download it instead");
    const content = await fs.readFile(info.fullPath, encoding);
    return { content, mimeType: info.mimeType, encoding };
  }

  // Check if file is text-based
  isTextFile(mimeType) {
    const textTypes = ["application/json", "application/xml"];
    return textTypes.includes(mimeType) || !!mimeType?.startsWith("text/");
  }

  // Delete a file or an empty folder. It is moved to .trash/<time>/<path>, so
  // a file deleted by mistake can still be got back on the server.
  async deleteFile(filePath) {
    const fullPath = this.resolve(filePath);
    if (fullPath === this.baseDir) throw fail(400, "The root folder cannot be deleted");
    if (!(await fs.pathExists(fullPath))) throw fail(404, "File not found");
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      if ((await fs.readdir(fullPath)).length) throw fail(409, "Only empty folders can be deleted");
      if (ROOT_FOLDERS.includes(this.relative(fullPath))) throw fail(400, "This folder cannot be deleted");
      await fs.remove(fullPath);
      return { folder: true };
    }
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "");
    const target = path.join(this.baseDir, TRASH, `${stamp}-${crypto.randomBytes(3).toString("hex")}`, this.relative(fullPath));
    await fs.move(fullPath, target);
    return { folder: false };
  }

  // Creates the folder (each part of the path must be a valid name)
  async createDirectory(dirPath) {
    const parts = String(dirPath || "").replace(/\\/g, "/").split("/").filter(Boolean);
    if (!parts.length) throw fail(400, "Directory path required");
    if (parts.some((p) => safeName(p) !== p)) throw fail(400, 'Folder names cannot contain \\ / : * ? " < > | or start/end with a dot');
    const fullPath = this.resolve(parts.join("/"));
    if ((await fs.pathExists(fullPath)) && !(await fs.stat(fullPath)).isDirectory()) {
      throw fail(409, "A file with that name already exists");
    }
    await fs.ensureDir(fullPath);
    return fullPath;
  }

  // Moves or copies a file/folder into another folder. A name already taken
  // there gets a free one ("x (1).pdf"). Returns the new path.
  async transfer(fromPath, toFolder, mode = "move") {
    const source = this.resolve(fromPath);
    if (source === this.baseDir) throw fail(400, "The root folder cannot be moved");
    if (!(await fs.pathExists(source))) throw fail(404, "File not found");
    const destDir = this.resolve(toFolder);
    if (!(await fs.pathExists(destDir)) || !(await fs.stat(destDir)).isDirectory()) throw fail(404, "Target folder not found");

    const isFolder = (await fs.stat(source)).isDirectory();
    if (isFolder && (destDir === source || destDir.startsWith(source + path.sep))) {
      throw fail(400, "A folder cannot go inside itself");
    }
    if (mode === "move") {
      if (ROOT_FOLDERS.includes(this.relative(source))) throw fail(400, "This folder cannot be moved");
      if (path.dirname(source) === destDir) throw fail(400, "Already in that folder");
    }

    const name = await this.freeName(destDir, path.basename(source));
    const target = path.join(destDir, name);
    if (mode === "copy") await fs.copy(source, target, { overwrite: false, errorOnExist: true });
    else await fs.move(source, target, { overwrite: false });
    return { from: this.relative(source), path: this.relative(target), name, isFolder, renamed: name !== path.basename(source) };
  }

  // Every folder and file in the store (hidden ones left out), for the search index
  async walk(onItem, dirPath = this.baseDir) {
    let items;
    try {
      items = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }
    for (const d of items) {
      if (isHidden(d.name)) continue;
      const fullPath = path.join(dirPath, d.name);
      const item = await this.describe(fullPath, d).catch(() => null);
      if (!item) continue;
      await onItem(item);
      if (d.isDirectory()) await this.walk(onItem, fullPath);
    }
  }
}

const service = new FileStorageService();
service.fail = fail;
service.safeName = safeName;
module.exports = service;
