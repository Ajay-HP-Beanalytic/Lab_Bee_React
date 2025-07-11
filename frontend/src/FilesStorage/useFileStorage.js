import { useState } from "react";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";

const useFileStorage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // List files in a folder:
  const listFiles = async (folder = "") => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${serverBaseAddress}/api/files`, {
        params: { folder },
      });

      console.log("Fetched files-->", response.data.files);
      setFiles(response.data.files);
    } catch (error) {
      setError("Failed to load files");
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Download file
  const downloadFile = async (filePath, fileName) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/files/download/${filePath}`,
        {
          responseType: "blob",
        }
      );

      //Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to download file");
      throw error;
    }
  };

  //Upload File:
  // const uploadFile = async (files, folder) => {
  const uploadFile = async (file, folder = "uploads") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await axios.post(
        `${serverBaseAddress}/api/files/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      console.log("Uploaded file-->", response.data.file);

      return response.data.file;
    } catch (error) {
      setError("Failed to upload file");
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
      setError("Failed to search files");
      console.error("Error searching files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete file
  const deleteFile = async (filePath) => {
    try {
      await axios.delete(`${serverBaseAddress}/api/files/${filePath}`);
    } catch (error) {
      setError("Failed to delete file");
      throw error;
    }
  };

  // Create directory
  const createDirectory = async (dirPath) => {
    try {
      await axios.post(`${serverBaseAddress}/api/files/mkdir`, {
        path: dirPath,
      });
    } catch (error) {
      setError("Failed to create directory");
      throw error;
    }
  };

  // NEW: View file - Get file information for viewing
  const viewFile = async (filePath) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/files/view/${filePath}`,
        {
          withCredentials: true,
        }
      );

      return response.data.file;
    } catch (error) {
      setError("Failed to view file");
      console.error("Error viewing file:", error);
      throw error;
    }
  };

  // NEW: Get file content for text files
  const getFileContent = async (filePath) => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/files/content/${filePath}`,
        {
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      setError("Failed to get file content");
      console.error("Error getting file content:", error);
      throw error;
    }
  };

  // NEW: Get file URL for direct viewing/serving
  const getFileUrl = (filePath) => {
    return `${serverBaseAddress}/api/files/serve/${filePath}`;
  };

  // NEW: Check if file can be viewed in browser
  const isViewableFile = (file) => {
    if (file.type === "folder") return false;

    const viewableExtensions = [
      "pdf",
      "txt",
      "csv",
      "json",
      "html",
      "css",
      "js",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "svg",
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
    listFiles,
    downloadFile,
    uploadFile,
    searchFiles,
    deleteFile,
    createDirectory,
    viewFile,
    getFileContent,
    getFileUrl,
    isViewableFile,
  };
};

export default useFileStorage;
