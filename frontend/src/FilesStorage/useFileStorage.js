import { useState, useCallback } from "react";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";

// "TS1/Cal #3/a?.pdf" → "TS1/Cal%20%233/a%3F.pdf" (each part encoded, "/" kept)
export const encodeStoragePath = (filePath = "") =>
  String(filePath)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

export const fileServeUrl = (filePath, page) =>
  `${serverBaseAddress}/api/files/serve/${encodeStoragePath(filePath)}${page ? `#page=${page}` : ""}`;

export const fileDownloadUrl = (filePath) =>
  `${serverBaseAddress}/api/files/download/${encodeStoragePath(filePath)}`;

// The server's message for a failed request
export const apiError = (error, fallback) => error?.response?.data?.error || fallback;

// File types the server accepts (Backend/services/fileStorageService.js)
export const UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav,.ogg";

const useFileStorage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canManage, setCanManage] = useState(false);
  const [maxUploadMb, setMaxUploadMb] = useState(200);

  // List files in a folder:
  const listFiles = useCallback(async (folder = "") => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${serverBaseAddress}/api/files`, {
        params: { folder },
      });

      setFiles(response.data.files);
      setCanManage(!!response.data.canManage);
      if (response.data.maxUploadMb) setMaxUploadMb(response.data.maxUploadMb);
    } catch (error) {
      setFiles([]);
      setError(apiError(error, "Failed to load files"));
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Download file: the browser streams it straight from the server (no copy in memory)
  const downloadFile = async (filePath, fileName) => {
    const link = document.createElement("a");
    link.href = fileDownloadUrl(filePath);
    link.setAttribute("download", fileName || "");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Upload files (up to 50) to a folder; items are Files or {file, rel} where rel
  // keeps sub-folders ("IEC/60068-2-6.pdf"). onProgress(bytesSent); signal cancels.
  // Returns { files: [saved…], errors: [{name, error}] }
  const uploadFiles = async (items, folder = "uploads", onProgress, signal) => {
    const formData = new FormData();
    formData.append("folder", folder);
    for (const item of items) {
      if (item instanceof File) formData.append("files", item);
      else formData.append("files", item.file, item.rel);
    }

    const response = await axios.post(
      `${serverBaseAddress}/api/files/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        signal,
        onUploadProgress: (e) => onProgress && onProgress(e.loaded),
      }
    );
    return { files: response.data.files || [], errors: response.data.errors || [] };
  };

  //Upload File:
  const uploadFile = async (file, folder = "uploads") => {
    try {
      const { files: saved } = await uploadFiles([file], folder);
      return saved[0];
    } catch (error) {
      setError(apiError(error, "Failed to upload file"));
      throw error;
    }
  };

  // Search files
  const searchFiles = async (query) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/files/search`,
        {
          params: { q: query },
        }
      );
      setFiles(response.data.files);
    } catch (error) {
      setError(apiError(error, "Failed to search files"));
      console.error("Error searching files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a file or an empty folder
  const deleteFile = async (filePath) => {
    await axios.delete(`${serverBaseAddress}/api/files/${encodeStoragePath(filePath)}`);
  };

  // Create directory
  const createDirectory = async (dirPath) => {
    await axios.post(`${serverBaseAddress}/api/files/mkdir`, {
      path: dirPath,
    });
  };

  // Move or copy files/folders into a folder; returns { done: [...], errors: [...] }
  const transferFiles = async (paths, to, mode = "move") => {
    const response = await axios.post(`${serverBaseAddress}/api/files/transfer`, { paths, to, mode });
    return response.data;
  };

  // Re-read the whole store (files copied onto the server directly)
  const reindex = async () => {
    const response = await axios.post(`${serverBaseAddress}/api/files/reindex`);
    return response.data;
  };

  // View file - Get file information for viewing
  const viewFile = async (filePath) => {
    const response = await axios.get(
      `${serverBaseAddress}/api/files/view/${encodeStoragePath(filePath)}`
    );
    return response.data.file;
  };

  // Get file content for text files
  const getFileContent = async (filePath) => {
    const response = await axios.get(
      `${serverBaseAddress}/api/files/content/${encodeStoragePath(filePath)}`
    );
    return response.data;
  };

  // Get file URL for direct viewing/serving
  const getFileUrl = (filePath) => fileServeUrl(filePath);

  // Check if file can be viewed in browser
  const isViewableFile = (file) => {
    if (file.type === "folder") return false;

    const viewableExtensions = [
      "pdf",
      "txt",
      "csv",
      "json",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "mp4",
      "webm",
      "mp3",
      "wav",
      "ogg",
    ];

    const ext = file.name.split(".").pop()?.toLowerCase();
    return viewableExtensions.includes(ext);
  };

  return {
    files,
    loading,
    error,
    canManage,
    maxUploadMb,
    listFiles,
    downloadFile,
    uploadFile,
    uploadFiles,
    searchFiles,
    deleteFile,
    createDirectory,
    transferFiles,
    reindex,
    viewFile,
    getFileContent,
    getFileUrl,
    isViewableFile,
  };
};

export default useFileStorage;
