import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Tab,
  Tabs,
  Tooltip,
  Checkbox,
  Paper,
} from "@mui/material";
import {
  Search,
  Preview,
  CloudDownload,
  Upload,
  Delete,
  Refresh,
  CreateNewFolder,
  Clear,
  Sync,
  DriveFileMove,
  ContentCopy,
} from "@mui/icons-material";
import useFileStorage, { apiError } from "./useFileStorage";
import FileViewer from "./FileViewer";
import UploadFilesDialog from "./UploadFilesDialog";
import StandardsRegister from "./StandardsRegister";
import { itemsFromDrop } from "./folderUpload";
import FolderPickerDialog from "./FolderPickerDialog";
import { formatFileSize, getFileIcon } from "./fileHelpers";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import ConfirmationDialog from "../common/ConfirmationDialog";

const STANDARDS_FOLDER = "Standards";

// Rows dragged inside the list (moved / copied), as opposed to files dropped from the PC
const INTERNAL_DRAG = "application/x-labbee-paths";

const FileBrowser = () => {
  const {
    files,
    loading,
    error,
    canManage,
    maxUploadMb,
    listFiles,
    downloadFile,
    searchFiles,
    deleteFile,
    createDirectory,
    transferFiles,
    reindex,
  } = useFileStorage();

  const [tab, setTab] = useState("files");
  const [currentPath, setCurrentPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [fileToDelete, setFileToDelete] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [dropped, setDropped] = useState(null); // files/folders dropped on the page
  const [pageDragOver, setPageDragOver] = useState(false);
  const [selected, setSelected] = useState([]); // paths ticked for move / copy / delete
  const [picker, setPicker] = useState(null); // "move" | "copy"
  const [dropTarget, setDropTarget] = useState(null); // folder a row is dragged over

  // File viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingFilePath, setViewingFilePath] = useState(null);

  useEffect(() => {
    if (tab === "files") listFiles(currentPath);
  }, [currentPath, listFiles, tab]);

  // A selection belongs to the list on screen
  useEffect(() => {
    setSelected((prev) => prev.filter((p) => files.some((f) => f.path === p)));
  }, [files]);

  const refresh = () => (isSearching ? searchFiles(searchQuery) : listFiles(currentPath));

  const openFolder = (folderPath) => {
    setCurrentPath(folderPath);
    setIsSearching(false);
    setSearchQuery("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      searchFiles(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    listFiles(currentPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName.trim()}` : newFolderName.trim();
      await createDirectory(folderPath);
      setNewFolderDialogOpen(false);
      setNewFolderName("");
      listFiles(currentPath);
    } catch (error) {
      toast.error(apiError(error, "Failed to create folder"));
    }
  };

  const handleViewFile = (file) => {
    setViewingFilePath(file.path);
    setViewerOpen(true);
  };

  // fileToDelete: one file/folder, or { paths: [...] } for the ticked ones
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    const paths = fileToDelete.paths || [fileToDelete.path];
    const failed = [];
    for (const p of paths) {
      try {
        await deleteFile(p);
      } catch (error) {
        failed.push(`${p.split("/").pop()}: ${apiError(error, "delete failed")}`);
      }
    }
    const deleted = paths.length - failed.length;
    if (deleted) toast.success(paths.length === 1 ? `Deleted ${paths[0].split("/").pop()}` : `Deleted ${deleted} item(s)`);
    failed.forEach((m) => toast.error(m));
    setFileToDelete(null);
    setSelected([]);
    setViewerOpen(false);
    refresh();
  };

  // Move or copy paths into a folder ("" = Home)
  const doTransfer = async (paths, to, mode) => {
    const wanted = paths.filter((p) => p !== to && !to.startsWith(`${p}/`));
    if (!wanted.length) return;
    try {
      const { done, errors } = await transferFiles(wanted, to, mode);
      const verb = mode === "copy" ? "Copied" : "Moved";
      toast.success(`${verb} ${done.length} item(s) to ${to || "Home"}`);
      done.filter((d) => d.renamed).forEach((d) => toast.info(`Name taken - saved as "${d.name}"`));
      errors.forEach((e) => toast.error(`${e.name.split("/").pop()}: ${e.error}`));
    } catch (error) {
      toast.error(apiError(error, mode === "copy" ? "Copy failed" : "Move failed"));
    }
    setSelected([]);
    setPicker(null);
    refresh();
  };

  const toggleSelected = (p) => setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  // Drag a row (and the other ticked rows) onto a folder or a breadcrumb: move; with Ctrl: copy
  const dragProps = (file) =>
    canManage
      ? {
          draggable: true,
          onDragStart: (e) => {
            const paths = selected.includes(file.path) ? selected : [file.path];
            e.dataTransfer.setData(INTERNAL_DRAG, JSON.stringify(paths));
            e.dataTransfer.effectAllowed = "copyMove";
          },
          onDragEnd: () => setDropTarget(null),
        }
      : {};

  const dropProps = (targetPath) =>
    canManage
      ? {
          onDragOver: (e) => {
            if (!e.dataTransfer.types.includes(INTERNAL_DRAG)) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
            if (dropTarget !== targetPath) setDropTarget(targetPath);
          },
          onDragLeave: (e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null);
          },
          onDrop: (e) => {
            if (!e.dataTransfer.types.includes(INTERNAL_DRAG)) return;
            e.preventDefault();
            e.stopPropagation();
            setDropTarget(null);
            const paths = JSON.parse(e.dataTransfer.getData(INTERNAL_DRAG) || "[]");
            doTransfer(paths, targetPath, e.ctrlKey ? "copy" : "move");
          },
        }
      : {};

  const dropHighlight = (targetPath) =>
    dropTarget === targetPath ? { bgcolor: "action.selected", outline: "2px dashed", outlineColor: "primary.main" } : {};

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const result = await reindex();
      toast.success(
        `${result.indexed} items indexed` +
          (result.standards?.added ? `, ${result.standards.added} new standard(s) found` : "")
      );
      refresh();
    } catch (error) {
      toast.error(apiError(error, "Could not re-index"));
    } finally {
      setReindexing(false);
    }
  };

  // Files or folders dropped anywhere on the list open the upload dialog with them
  const canDropHere = tab === "files" && !isSearching;
  const pageDrop = {
    onDragOver: (e) => {
      if (!canDropHere || !e.dataTransfer.types.includes("Files")) return;
      e.preventDefault();
      setPageDragOver(true);
    },
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setPageDragOver(false);
    },
    onDrop: async (e) => {
      if (!canDropHere || e.dataTransfer.types.includes(INTERNAL_DRAG)) return;
      e.preventDefault();
      setPageDragOver(false);
      try {
        const items = await itemsFromDrop(e.dataTransfer);
        if (items.length) {
          setDropped(items);
          setUploadDialogOpen(true);
        }
      } catch {
        toast.error("Could not read the dropped files");
      }
    },
  };

  const inStandards = currentPath === STANDARDS_FOLDER || currentPath.startsWith(`${STANDARDS_FOLDER}/`);
  const parentOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");

  const secondaryText = (file) => {
    const parts = [
      file.type === "folder" ? "Folder" : formatFileSize(file.size),
      file.lastModified ? new Date(file.lastModified).toLocaleDateString() : null,
      file.uploadedBy ? `by ${file.uploadedBy}` : null,
      isSearching ? `in ${parentOf(file.path) || "Home"}` : null,
    ];
    return parts.filter(Boolean).join(" • ");
  };

  return (
    <>
      <Box>
        <Card
          {...pageDrop}
          sx={pageDragOver ? { outline: "3px dashed", outlineColor: "primary.main", outlineOffset: -6 } : undefined}
        >
          <CardContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab value="files" label="Files" />
              <Tab value="standards" label="Standards" />
            </Tabs>

            {tab === "standards" ? (
              <StandardsRegister />
            ) : (
              <>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  mb={2}
                >
                  <Typography variant="h6">Organization Files</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {canManage && (
                      <Button
                        startIcon={<CreateNewFolder />}
                        onClick={() => setNewFolderDialogOpen(true)}
                        size="small"
                        variant="outlined"
                        disabled={isSearching}
                      >
                        New Folder
                      </Button>
                    )}
                    <Button
                      startIcon={<Upload />}
                      onClick={() => setUploadDialogOpen(true)}
                      size="small"
                      variant="outlined"
                      disabled={isSearching || (inStandards && !canManage)}
                    >
                      Upload
                    </Button>
                    <Button
                      startIcon={<Refresh />}
                      onClick={refresh}
                      disabled={loading}
                      size="small"
                      variant="outlined"
                    >
                      Refresh
                    </Button>
                    {canManage && (
                      <Tooltip title="Pick up files that were copied onto the server directly">
                        <span>
                          <Button
                            startIcon={reindexing ? <CircularProgress size={16} /> : <Sync />}
                            onClick={handleReindex}
                            disabled={reindexing}
                            size="small"
                            variant="outlined"
                          >
                            Re-index
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Search Bar */}
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    placeholder="Search file and folder names (all folders)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    size="small"
                    InputProps={{
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton onClick={handleClearSearch} size="small">
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
                      onClick={() => openFolder("")}
                      underline="hover"
                      {...dropProps("")}
                      sx={dropHighlight("")}
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
                            onClick={() => openFolder(path)}
                            underline="hover"
                            {...dropProps(path)}
                            sx={dropHighlight(path)}
                          >
                            {segment}
                          </Link>
                        );
                      })}
                  </Breadcrumbs>
                )}

                {inStandards && !isSearching && (
                  <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                      <Button size="small" onClick={() => setTab("standards")}>
                        Open register
                      </Button>
                    }
                  >
                    PDFs in this folder form the standards library: their text is read so methods can be found by page.
                  </Alert>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {canManage && selected.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1, mb: 1, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {selected.length} selected
                    </Typography>
                    <Button size="small" startIcon={<DriveFileMove />} onClick={() => setPicker("move")}>
                      Move to…
                    </Button>
                    <Button size="small" startIcon={<ContentCopy />} onClick={() => setPicker("copy")}>
                      Copy to…
                    </Button>
                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => setFileToDelete({ paths: selected })}>
                      Delete
                    </Button>
                    <Button size="small" onClick={() => setSelected([])}>
                      Clear
                    </Button>
                  </Paper>
                )}
                {canManage && !loading && files?.length > 0 && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Tip: drag files or folders onto a folder (or "Home" above) to move them; hold Ctrl to copy.
                  </Typography>
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
                  <List dense>
                    {files.map((file) => {
                      const actions = (
                        <Box display="flex" gap={0.5}>
                          {file.type === "file" && (
                            <>
                              <IconButton onClick={() => handleViewFile(file)} title="View">
                                <Preview />
                              </IconButton>
                              <IconButton onClick={() => downloadFile(file.path, file.name)} title="Download">
                                <CloudDownload />
                              </IconButton>
                            </>
                          )}
                          {canManage && (
                            <IconButton
                              onClick={() => setFileToDelete(file)}
                              title={file.type === "folder" ? "Delete (empty folders only)" : "Delete"}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Box>
                      );
                      const content = (
                        <>
                          {canManage && (
                            <Checkbox
                              size="small"
                              edge="start"
                              checked={selected.includes(file.path)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleSelected(file.path)}
                              sx={{ mr: 0.5 }}
                            />
                          )}
                          <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={secondaryText(file)}
                            primaryTypographyProps={{ sx: { wordBreak: "break-word" } }}
                          />
                        </>
                      );
                      return file.type === "folder" ? (
                        <ListItem
                          key={file.id}
                          disablePadding
                          secondaryAction={actions}
                          {...dragProps(file)}
                          {...dropProps(file.path)}
                          sx={dropHighlight(file.path)}
                        >
                          <ListItemButton onClick={() => openFolder(file.path)}>{content}</ListItemButton>
                        </ListItem>
                      ) : (
                        <ListItem key={file.id} secondaryAction={actions} {...dragProps(file)}>
                          {content}
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <UploadFilesDialog
          open={uploadDialogOpen}
          folder={currentPath}
          fallbackFolder="uploads"
          initialItems={dropped}
          maxUploadMb={maxUploadMb}
          hint={
            inStandards
              ? "Standards: one PDF per standard with a clear name, e.g. MIL-STD-810H.pdf or IEC 60068-2-6 2007.pdf. You can drop a whole folder; its sub-folders are kept."
              : undefined
          }
          onClose={() => {
            setUploadDialogOpen(false);
            setDropped(null);
          }}
          onUploaded={() => listFiles(currentPath)}
        />

        {/* New Folder Dialog */}
        <Dialog open={newFolderDialogOpen} onClose={() => setNewFolderDialogOpen(false)}>
          <DialogTitle>
            {currentPath ? `Create New Folder at ${currentPath}` : "Create New Folder"}
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
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {fileToDelete && (
        <ConfirmationDialog
          open
          onClose={() => setFileToDelete(null)}
          onConfirm={handleConfirmDelete}
          dialogTitle={fileToDelete.paths ? "Delete" : fileToDelete.type === "folder" ? "Delete Folder" : "Delete File"}
          contentText={
            fileToDelete.paths
              ? `Delete ${fileToDelete.paths.length} selected item(s)? Folders are deleted only when empty.`
              : `Are you sure you want to delete "${fileToDelete.name}"?`
          }
        />
      )}
      <FolderPickerDialog
        open={!!picker}
        title={picker === "copy" ? `Copy ${selected.length} item(s) to…` : `Move ${selected.length} item(s) to…`}
        actionLabel={picker === "copy" ? "Copy here" : "Move here"}
        startPath={currentPath}
        exclude={picker === "move" ? selected.filter((p) => files.some((f) => f.path === p && f.type === "folder")) : []}
        onClose={() => setPicker(null)}
        onPick={(to) => doTransfer(selected, to, picker)}
      />
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
