import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import {
  InsertDriveFile,
  Folder,
  Search,
  Preview,
  CloudDownload,
  Upload,
  Delete,
  Add,
  Refresh,
  CreateNewFolder,
  Clear,
} from "@mui/icons-material";
import useFileStorage from "./useFileStorage";
import FileViewer from "./FileViewer";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import ConfirmationDialog from "../common/ConfirmationDialog";

const FileBrowser = () => {
  const {
    files,
    loading,
    error,
    listFiles,
    downloadFile,
    uploadFile,
    searchFiles,
    deleteFile,
    createDirectory,
    isViewableFile,
  } = useFileStorage();

  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // NEW: File viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingFilePath, setViewingFilePath] = useState(null);

  useEffect(() => {
    listFiles(currentPath);
  }, [currentPath]);

  const handleFolderClick = (folder) => {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(folder.path);
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleBreadcrumbClick = (pathIndex) => {
    if (pathIndex === -1) {
      // Go to root
      setCurrentPath("");
      setPathHistory([]);
    } else {
      // Go to specific path
      const newHistory = pathHistory.slice(0, pathIndex + 1);
      const targetPath = pathHistory[pathIndex];
      setCurrentPath(targetPath);
      setPathHistory(newHistory);
    }
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      searchFiles(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    listFiles(currentPath);
  };

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.path, file.name);
    } catch (error) {
      toast.error("Download failed");
      console.error("Download failed:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await uploadFile(file, currentPath || "uploads");
        setUploadDialogOpen(false);
        listFiles(currentPath); // Refresh file list
      } catch (error) {
        toast.error("Upload failed");
        console.error("Upload failed:", error);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const folderPath = currentPath
          ? `${currentPath}/${newFolderName}`
          : newFolderName;
        await createDirectory(folderPath);
        setNewFolderDialogOpen(false);
        setNewFolderName("");
        listFiles(currentPath); // Refresh file list
      } catch (error) {
        toast.error("Failed to create folder");
        console.error("Create folder failed:", error);
      }
    }
  };

  // NEW: Handle file viewing
  const handleViewFile = (file) => {
    setViewingFilePath(file.path);
    setViewerOpen(true);
  };

  const handleDelete = (file) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    try {
      await deleteFile(fileToDelete.path);
      setDeleteDialogOpen(false);
      setViewerOpen(false);
      listFiles(currentPath); // Refresh file list
    } catch (error) {
      toast.error("Delete failed");
      console.error("Delete failed:", error);
    }
  };

  // NEW: Handle file deletion
  const handleDeleteFile = async (file) => {
    // if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {

    try {
      await deleteFile(file.path);
      listFiles(currentPath); // Refresh file list
    } catch (error) {
      toast.error("Delete failed");
      console.error("Delete failed:", error);
    }
  };

  // Existing helper functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type === "folder") return "📁";

    const ext = file.name.split(".").pop()?.toLowerCase();
    const iconMap = {
      pdf: "📄",
      doc: "📝",
      docx: "📝",
      xls: "📊",
      xlsx: "📊",
      txt: "📄",
      csv: "📊",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      gif: "🖼️",
      mp4: "🎥",
      mp3: "🎵",
      zip: "🗜️",
      json: "🔧",
    };

    return iconMap[ext] || "📄";
  };

  return (
    <>
      <Box>
        <Card>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Organization Files</Typography>
              <Box display="flex" gap={1}>
                <Button
                  startIcon={<CreateNewFolder />}
                  onClick={() => setNewFolderDialogOpen(true)}
                  size="small"
                  variant="outlined"
                >
                  New Folder
                </Button>
                <Button
                  startIcon={<Upload />}
                  onClick={() => setUploadDialogOpen(true)}
                  size="small"
                  variant="outlined"
                >
                  Upload
                </Button>
                <Button
                  startIcon={<Refresh />}
                  onClick={() => listFiles(currentPath)}
                  disabled={loading}
                  size="small"
                  variant="outlined"
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            {/* Search Bar */}
            <Box display="flex" gap={1} mb={2}>
              <TextField
                fullWidth
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                size="small"
                InputProps={{
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={handleClearSearch}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                sx={{
                  borderRadius: 3,
                  mx: 0.5,
                  mb: 1,
                  bgcolor: "orange",
                  color: "white",
                  borderColor: "black",
                }}
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                startIcon={<Search />}
              >
                Search
              </Button>
            </Box>

            {/* Breadcrumbs */}
            {!isSearching && (
              <Breadcrumbs sx={{ mb: 1 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setCurrentPath("");
                    setPathHistory([]);
                  }}
                  underline="hover"
                >
                  Home
                </Link>
                {currentPath
                  .split("/")
                  .filter(Boolean)
                  .map((segment, idx, arr) => {
                    const path = arr.slice(0, idx + 1).join("/");
                    const isLast = idx === arr.length - 1;
                    return isLast ? (
                      <Typography color="text.primary" key={path}>
                        {segment}
                      </Typography>
                    ) : (
                      <Link
                        key={path}
                        component="button"
                        variant="body2"
                        onClick={() => setCurrentPath(path)}
                        underline="hover"
                      >
                        {segment}
                      </Link>
                    );
                  })}
              </Breadcrumbs>
            )}

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Files List */}
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : files?.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" py={4}>
                {isSearching ? "No files found" : "No files in this folder"}
              </Typography>
            ) : (
              <List size="small">
                {files.map((file) => (
                  <ListItem
                    key={file.id}
                    button={file.type === "folder"}
                    onClick={() =>
                      file.type === "folder" && handleFolderClick(file)
                    }
                    sx={{ size: "small" }}
                  >
                    <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={
                        file.type === "folder"
                          ? `Folder • ${new Date(
                              file.lastModified
                            ).toLocaleDateString()}`
                          : `${formatFileSize(file.size)} • ${new Date(
                              file.lastModified
                            ).toLocaleDateString()}`
                      }
                    />
                    {file.type === "file" && (
                      <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <IconButton
                            onClick={() => handleViewFile(file)}
                            title="View"
                          >
                            <Preview />
                          </IconButton>

                          <IconButton
                            onClick={() => handleDownload(file)}
                            title="Download"
                          >
                            <CloudDownload />
                          </IconButton>
                          <IconButton
                            // onClick={() => handleDeleteFile(file)}
                            onClick={() => handleDelete(file)}
                            title="Delete"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
        >
          <DialogTitle>Upload File</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Supported formats: PDF, Word, Excel, Text, CSV, JPG, JPEG, PNG,
              GIF
            </Typography>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif"
              style={{ marginTop: 16 }}
              multiple
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* New Folder Dialog */}
        <Dialog
          open={newFolderDialogOpen}
          onClose={() => setNewFolderDialogOpen(false)}
        >
          <DialogTitle>
            {" "}
            {currentPath
              ? `Create New Folder at ${currentPath}`
              : "Create New Folder"}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              fullWidth
              variant="outlined"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              variant="contained"
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {deleteDialogOpen && (
        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setFileToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          dialogTitle="Delete File"
          contentText="Are you sure you want to delete this file?"
        />
      )}
      {/* File Viewer Dialog */}
      {viewerOpen && (
        <FileViewer
          filePath={viewingFilePath}
          serverBaseAddress={serverBaseAddress}
          onClose={() => {
            setViewerOpen(false);
            setViewingFilePath(null);
          }}
        />
      )}
    </>
  );
};

export default FileBrowser;
