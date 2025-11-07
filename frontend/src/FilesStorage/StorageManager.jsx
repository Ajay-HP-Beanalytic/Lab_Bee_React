import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
} from "@mui/material";
import {
  Storage,
  Refresh,
  Build,
  CleaningServices,
  Add,
  CheckCircle,
  Error,
  Info,
  FolderOpen,
} from "@mui/icons-material";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";

const StorageManager = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDirPath, setNewDirPath] = useState("");
  const [newDirDescription, setNewDirDescription] = useState("");
  const [directoryStats, setDirectoryStats] = useState({});

  useEffect(() => {
    loadStorageInfo();
    verifyStructure();
  }, []);

  const loadStorageInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverBaseAddress}/api/files/storage-info`,
        {
          withCredentials: true,
        }
      );
      setStorageInfo(response.data);

      // Load stats for each directory
      const dirs = [
        "Quotation-files",
        "TS1-standards",
        "TS2-standards",
        "uploads",
        "temp",
        "archived",
      ];
      const stats = {};

      for (const dir of dirs) {
        try {
          const statResponse = await axios.get(
            `${serverBaseAddress}/api/files/stats/${dir}`,
            {
              withCredentials: true,
            }
          );
          stats[dir] = statResponse.data;
        } catch (err) {
          stats[dir] = { error: "Unable to load stats" };
        }
      }

      setDirectoryStats(stats);
    } catch (error) {
      setError("Failed to load storage information");
      console.error("Error loading storage info:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyStructure = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/files/verify-structure`,
        {
          withCredentials: true,
        }
      );
      setVerification(response.data);
    } catch (error) {
      setError("Failed to verify directory structure");
      console.error("Error verifying structure:", error);
    }
  };

  const recreateStructure = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${serverBaseAddress}/api/files/recreate-structure`,
        {},
        {
          withCredentials: true,
        }
      );

      setSuccess("Directory structure recreated successfully!");
      await verifyStructure();
      await loadStorageInfo();
    } catch (error) {
      setError("Failed to recreate directory structure");
      console.error("Error recreating structure:", error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupTempFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${serverBaseAddress}/api/files/cleanup-temp`,
        {},
        {
          withCredentials: true,
        }
      );

      setSuccess(response.data.message);
      await loadStorageInfo();
    } catch (error) {
      setError("Failed to cleanup temporary files");
      console.error("Error cleaning temp files:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCustomDirectory = async () => {
    try {
      setError(null);

      await axios.post(
        `${serverBaseAddress}/api/files/create-directory`,
        {
          path: newDirPath,
          description: newDirDescription,
        },
        {
          withCredentials: true,
        }
      );

      setSuccess(`Directory "${newDirPath}" created successfully!`);
      setCreateDialogOpen(false);
      setNewDirPath("");
      setNewDirDescription("");
      await verifyStructure();
      await loadStorageInfo();
    } catch (error) {
      setError("Failed to create directory");
      console.error("Error creating directory:", error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getDirectoryIcon = (dirName) => {
    const icons = {
      "Quotation-files": "💼",
      "TS1-standards": "📋",
      "TS2-standards": "📊",
      "uploads": "📁",
      "temp": "🗂️",
      "archived": "📦",
    };
    return icons[dirName] || "📁";
  };

  if (loading && !storageInfo) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading storage information...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <Storage sx={{ mr: 1, verticalAlign: "middle" }} />
        File Storage Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Storage Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: "middle" }} />
                Storage Overview
              </Typography>

              {storageInfo && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Base Directory: {storageInfo.baseDirectory}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Initialized:{" "}
                    {new Date(
                      storageInfo.systemInfo?.initialized || storageInfo.created
                    ).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Version: {storageInfo.systemInfo?.version || "Unknown"}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Configuration:</Typography>
                    <Chip
                      label={`Max File Size: ${
                        storageInfo.systemInfo?.configuration?.maxFileSize ||
                        "50MB"
                      }`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={`Auto Cleanup: ${
                        storageInfo.systemInfo?.configuration?.autoCleanup
                          ? "Enabled"
                          : "Disabled"
                      }`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Directory Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CheckCircle sx={{ mr: 1, verticalAlign: "middle" }} />
                Directory Status
              </Typography>

              {verification && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    {verification.allExist ? (
                      <CheckCircle color="success" sx={{ mr: 1 }} />
                    ) : (
                      <Error color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography>
                      {verification.allExist
                        ? "All directories exist"
                        : "Some directories are missing"}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2">
                    Existing: {verification.existing.length}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color={
                      verification.missing.length > 0
                        ? "error"
                        : "textSecondary"
                    }
                  >
                    Missing: {verification.missing.length}
                  </Typography>

                  {verification.missing.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Missing directories: {verification.missing.join(", ")}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Management Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Build sx={{ mr: 1, verticalAlign: "middle" }} />
                Management Actions
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => {
                    loadStorageInfo();
                    verifyStructure();
                  }}
                  disabled={loading}
                >
                  Refresh
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Build />}
                  onClick={recreateStructure}
                  disabled={loading}
                  color="primary"
                >
                  Recreate Structure
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<CleaningServices />}
                  onClick={cleanupTempFiles}
                  disabled={loading}
                  color="warning"
                >
                  Cleanup Temp Files
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Directory
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Directory Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FolderOpen sx={{ mr: 1, verticalAlign: "middle" }} />
                Directory Statistics
              </Typography>

              <Grid container spacing={2}>
                {Object.entries(directoryStats).map(([dirName, stats]) => (
                  <Grid item xs={12} sm={6} md={4} key={dirName}>
                    <Paper sx={{ p: 2, height: "100%" }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography
                          variant="h6"
                          component="span"
                          sx={{ mr: 1 }}
                        >
                          {getDirectoryIcon(dirName)}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {dirName}
                        </Typography>
                      </Box>

                      {stats.error ? (
                        <Typography variant="body2" color="error">
                          {stats.error}
                        </Typography>
                      ) : (
                        <Box>
                          <Typography variant="body2">
                            📁 Folders: {stats.folders || 0}
                          </Typography>
                          <Typography variant="body2">
                            📄 Files: {stats.files || 0}
                          </Typography>
                          <Typography variant="body2">
                            💾 Size: {formatFileSize(stats.totalSize || 0)}
                          </Typography>
                          {stats.lastModified && (
                            <Typography variant="body2" color="textSecondary">
                              Last modified:{" "}
                              {new Date(
                                stats.lastModified
                              ).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Directory Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Directory</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Directory Path"
              placeholder="e.g., custom-folder or uploads/2024/january"
              fullWidth
              variant="outlined"
              value={newDirPath}
              onChange={(e) => setNewDirPath(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              placeholder="Brief description of this directory's purpose"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newDirDescription}
              onChange={(e) => setNewDirDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={createCustomDirectory}
            variant="contained"
            disabled={!newDirPath.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0,0,0,0.3)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <Paper sx={{ p: 3, display: "flex", alignItems: "center" }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Processing...</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default StorageManager;
