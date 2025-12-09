import { useState, useEffect, useCallback } from "react";

const FileViewer = ({ filePath, onClose, serverBaseAddress }) => {
  const [fileInfo, setFileInfo] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFileInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get file information
      const response = await fetch(
        `${serverBaseAddress}/api/files/view/${filePath}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load file information");
      }

      const data = await response.json();
      setFileInfo(data.file);

      // Load content for text files
      if (data.file && data.file.viewType === "text") {
        try {
          const contentResponse = await fetch(
            `${serverBaseAddress}/api/files/content/${filePath}`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            setFileContent(contentData);
          }
        } catch (error) {
          console.error("Failed to load file content:", error);
        }
      }
    } catch (error) {
      setError("Failed to load file: " + error.message);
      console.error("Error loading file info:", error);
    } finally {
      setLoading(false);
    }
  }, [filePath, serverBaseAddress]);

  useEffect(() => {
    if (filePath) {
      loadFileInfo();
    }
  }, [filePath, loadFileInfo]);

  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = `${serverBaseAddress}/api/files/download/${filePath}`;
    link.download = fileInfo?.name || "file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileUrl = () => {
    return `${serverBaseAddress}/api/files/serve/${filePath}`;
  };

  // Handle escape key to close viewer
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.2s ease-in-out",
    },
    viewer: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      maxWidth: "90vw",
      maxHeight: "90vh",
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
      position: "relative",
      animation: "slideIn 0.3s ease-out",
    },
    header: {
      padding: "16px 20px",
      borderBottom: "1px solid #eee",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#fafafa",
    },
    title: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      margin: 0,
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    actions: {
      display: "flex",
      gap: "8px",
      marginLeft: "12px",
    },
    button: {
      background: "none",
      border: "none",
      padding: "8px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      transition: "background-color 0.2s",
      color: "#666",
    },
    closeButton: {
      position: "absolute",
      top: "12px",
      right: "12px",
      background: "rgba(0, 0, 0, 0.7)",
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "32px",
      height: "32px",
      cursor: "pointer",
      fontSize: "16px",
      zIndex: 2001,
      transition: "background-color 0.2s",
    },
    content: {
      maxHeight: "80vh",
      overflow: "auto",
      backgroundColor: "#fff",
    },
    loading: {
      padding: "60px",
      textAlign: "center",
      color: "#666",
    },
    error: {
      padding: "60px",
      textAlign: "center",
      color: "#e53e3e",
    },
    textViewer: {
      fontFamily: 'Monaco, "SF Mono", Consolas, monospace',
      fontSize: "14px",
      lineHeight: "1.6",
      padding: "20px",
      whiteSpace: "pre-wrap",
      backgroundColor: "#f8f9fa",
      color: "#2d3748",
      minHeight: "400px",
    },
    imageViewer: {
      textAlign: "center",
      padding: "20px",
      backgroundColor: "#f8f9fa",
    },
    image: {
      maxWidth: "100%",
      maxHeight: "70vh",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    mediaViewer: {
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#000",
    },
    video: {
      width: "100%",
      maxWidth: "800px",
      maxHeight: "70vh",
      borderRadius: "8px",
    },
    audio: {
      width: "100%",
      maxWidth: "400px",
      margin: "40px auto",
    },
    pdfViewer: {
      width: "80vw",
      height: "80vh",
      border: "none",
    },
    notSupported: {
      padding: "60px",
      textAlign: "center",
    },
    downloadButton: {
      backgroundColor: "#3182ce",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      marginTop: "20px",
      transition: "background-color 0.2s",
    },
  };

  const renderFileContent = () => {
    if (loading) {
      return (
        <div style={styles.loading}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>⏳</div>
          <div>Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.error}>
          <div style={{ fontSize: "24px", marginBottom: "12px" }}>❌</div>
          <div>{error}</div>
        </div>
      );
    }

    if (!fileInfo) return null;

    const fileUrl = getFileUrl();

    switch (fileInfo.viewType) {
      case "text":
        return (
          <div style={styles.textViewer}>
            {fileContent?.content || "Unable to load content"}
          </div>
        );

      case "image":
        return (
          <div style={styles.imageViewer}>
            <img src={fileUrl} alt={fileInfo.name} style={styles.image} />
          </div>
        );

      case "video":
        return (
          <div style={styles.mediaViewer}>
            <video controls style={styles.video} src={fileUrl}>
              Video not supported
            </video>
          </div>
        );

      case "audio":
        return (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🎵</div>
            <audio controls style={styles.audio} src={fileUrl}>
              Audio not supported
            </audio>
          </div>
        );

      case "pdf":
        return (
          <iframe
            src={fileUrl}
            style={styles.pdfViewer}
            title={fileInfo.name}
          />
        );

      default:
        return (
          <div style={styles.notSupported}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>
              Preview not available
            </div>
            <div
              style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}
            >
              {fileInfo.name}
            </div>
            <button
              style={styles.downloadButton}
              onClick={downloadFile}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#2c5aa0")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#3182ce")}
            >
              📥 Download File
            </button>
          </div>
        );
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { 
              opacity: 0; 
              transform: scale(0.9) translateY(-20px); 
            }
            to { 
              opacity: 1; 
              transform: scale(1) translateY(0); 
            }
          }
        `}
      </style>

      <div style={styles.overlay} onClick={onClose}>
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor = "rgba(0, 0, 0, 0.9)")
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor = "rgba(0, 0, 0, 0.7)")
          }
        >
          ×
        </button>

        <div style={styles.viewer} onClick={(e) => e.stopPropagation()}>
          {fileInfo && (
            <div style={styles.header}>
              <h3 style={styles.title}>{fileInfo.name}</h3>
              <div style={styles.actions}>
                <button
                  style={styles.button}
                  onClick={downloadFile}
                  title="Download"
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#f0f0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "transparent")
                  }
                >
                  📥
                </button>
              </div>
            </div>
          )}

          <div style={styles.content}>{renderFileContent()}</div>
        </div>
      </div>
    </>
  );
};

export default FileViewer;
