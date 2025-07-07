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
} from "@mui/material";
import {
  InsertDriveFile,
  Folder,
  Search,
  CloudDownload,
  Upload,
  Delete,
  Add,
  Refresh,
  CreateNewFolder,
} from "@mui/icons-material";
import useFileStorage from "./useFileStorage";

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
  } = useFileStorage();

  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.path, file.name);
    } catch (error) {
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
        console.error("Create folder failed:", error);
      }
    }
  };

  const handleDelete = async (file) => {
    if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
      try {
        await deleteFile(file.path);
        listFiles(currentPath); // Refresh file list
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type === "folder") return <Folder color="primary" />;
    return <InsertDriveFile color="action" />;
  };

  return (
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
              >
                New Folder
              </Button>
              <Button
                startIcon={<Upload />}
                onClick={() => setUploadDialogOpen(true)}
                size="small"
              >
                Upload
              </Button>
              <Button
                startIcon={<Refresh />}
                onClick={() => listFiles(currentPath)}
                disabled={loading}
                size="small"
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
            />
            <Button
              variant="outlined"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              startIcon={<Search />}
            >
              Search
            </Button>
          </Box>

          {/* Breadcrumbs */}
          {!isSearching && (
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick(-1)}
                underline="hover"
              >
                Root
              </Link>
              {pathHistory.map((path, index) => (
                <Link
                  key={index}
                  component="button"
                  variant="body2"
                  onClick={() => handleBreadcrumbClick(index)}
                  underline="hover"
                >
                  {path.split("/").pop()}
                </Link>
              ))}
              {currentPath && (
                <Typography color="text.primary">
                  {currentPath.split("/").pop()}
                </Typography>
              )}
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
          ) : //   ) : files?.length === 0 ? (
          files === undefined ? (
            <Typography color="textSecondary" textAlign="center" py={4}>
              {isSearching ? "No files found" : "No files in this folder"}
            </Typography>
          ) : (
            <List>
              {files.map((file) => (
                <ListItem
                  key={file.id}
                  button={file.type === "folder"}
                  onClick={() =>
                    file.type === "folder" && handleFolderClick(file)
                  }
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
                          onClick={() => handleDownload(file)}
                          title="Download"
                        >
                          <CloudDownload />
                        </IconButton>
                        <IconButton
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
            Supported formats: PDF, Word, Excel, Text, CSV
          </Typography>
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            style={{ marginTop: 16 }}
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
        <DialogTitle>Create New Folder</DialogTitle>
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
          <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
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
  );
};

export default FileBrowser;
