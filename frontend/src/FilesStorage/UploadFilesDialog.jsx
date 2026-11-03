import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { CloudUpload, DriveFolderUpload, UploadFile } from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import useFileStorage, { apiError, UPLOAD_ACCEPT } from "./useFileStorage";
import { formatFileSize } from "./fileHelpers";
import { batchesOf, checkItems, itemsFromDrop, itemsFromInput } from "./folderUpload";

const SHOW_ROWS = 100; // rows listed before upload (a folder can hold thousands)
const SHOW_NOTES = 50;

/**
 * Pick or drop files or whole folders and upload them to `folder`; sub-folders
 * are created as on the PC. Files without a folder go to `fallbackFolder` when
 * `folder` is "" (Home). initialItems: [{file, rel}] dropped on the page.
 * onUploaded(savedFiles) after the upload.
 */
export default function UploadFilesDialog({
  open,
  folder,
  fallbackFolder = "uploads",
  initialItems,
  maxUploadMb = 200,
  onClose,
  onUploaded,
  title = "Upload files",
  hint,
}) {
  const { uploadFiles } = useFileStorage();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const abortRef = useRef(null);
  const [picked, setPicked] = useState([]);
  const [leftOut, setLeftOut] = useState([]);
  const [progress, setProgress] = useState(null); // { sent, total, files, done }
  const [notes, setNotes] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [reading, setReading] = useState(false);

  const uploading = progress !== null;

  const add = (items) => {
    const { ok, skipped } = checkItems(items, maxUploadMb);
    setPicked((prev) => {
      const have = new Set(prev.map((p) => p.rel));
      return [...prev, ...ok.filter((i) => !have.has(i.rel))];
    });
    setLeftOut((prev) => [...prev, ...skipped]);
    setNotes([]);
  };

  useEffect(() => {
    if (open && initialItems?.length) add(initialItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialItems]);

  // Warn before the tab is closed during an upload
  useEffect(() => {
    if (!uploading) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  const clearInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const reset = () => {
    setPicked([]);
    setLeftOut([]);
    setProgress(null);
    setNotes([]);
    clearInputs();
  };

  const close = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    setReading(true);
    try {
      add(await itemsFromDrop(e.dataTransfer));
    } catch (error) {
      toast.error("Could not read the dropped folder");
    } finally {
      setReading(false);
    }
  };

  const upload = async () => {
    const inFolders = picked.filter((i) => i.rel.includes("/"));
    const loose = picked.filter((i) => !i.rel.includes("/"));
    const jobs = [
      ...batchesOf(inFolders).map((items) => ({ items, to: folder })),
      ...batchesOf(loose).map((items) => ({ items, to: folder || fallbackFolder })),
    ];
    const total = picked.reduce((n, i) => n + i.file.size, 0);
    const saved = [];
    const problems = leftOut.map((s) => `${s.rel}: ${s.reason}`);
    let sentBefore = 0;
    let cancelled = false;
    abortRef.current = new AbortController();
    setProgress({ sent: 0, total, files: picked.length, done: 0 });

    try {
      for (const job of jobs) {
        const batchBytes = job.items.reduce((n, i) => n + i.file.size, 0);
        try {
          const result = await uploadFiles(
            job.items,
            job.to,
            (loaded) => setProgress((p) => ({ ...p, sent: sentBefore + Math.min(loaded, batchBytes) })),
            abortRef.current.signal
          );
          saved.push(...result.files);
          problems.push(...result.errors.map((err) => `${err.name}: ${err.error}`));
        } catch (error) {
          if (axios.isCancel(error)) {
            cancelled = true;
            break;
          }
          problems.push(...job.items.map((i) => `${i.rel}: ${apiError(error, "upload failed")}`));
        }
        sentBefore += batchBytes;
        setProgress((p) => ({ ...p, sent: sentBefore, done: p.done + job.items.length }));
      }
    } finally {
      setProgress(null);
      abortRef.current = null;
    }

    const added = saved.filter((f) => !f.skipped);
    const already = saved.length - added.length;
    const lines = [
      ...(cancelled ? ["Upload cancelled - drop the same folder again to continue (files already uploaded are skipped)."] : []),
      ...(already ? [`${already} file(s) were already there and were skipped.`] : []),
      ...added.filter((f) => f.renamed).map((f) => `${f.originalName} already existed with other content - saved as "${f.name}"`),
      ...added.filter((f) => f.duplicateOf).map((f) => `${f.path} has the same content as ${f.duplicateOf}`),
      ...problems,
    ];
    if (added.length) toast.success(added.length === 1 ? "File uploaded" : `${added.length} files uploaded`);
    if (saved.length) onUploaded?.(saved);

    if (lines.length) {
      // keep the dialog open so the notes can be read
      setNotes(lines);
      setPicked([]);
      setLeftOut([]);
      clearInputs();
    } else {
      reset();
      onClose();
    }
  };

  const totalBytes = picked.reduce((n, i) => n + i.file.size, 0);
  const folderCount = new Set(picked.filter((i) => i.rel.includes("/")).map((i) => i.rel.slice(0, i.rel.lastIndexOf("/")))).size;
  const pct = progress && progress.total ? Math.round((progress.sent / progress.total) * 100) : 0;

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>
        {title}
        <Typography variant="body2" color="text.secondary">
          To: {folder || "Home"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {hint && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {hint}
          </Alert>
        )}
        {!uploading && (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            sx={{
              border: "2px dashed",
              borderColor: dragOver ? "primary.main" : "divider",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              bgcolor: dragOver ? "action.hover" : "transparent",
            }}
          >
            <CloudUpload color="action" sx={{ fontSize: 40 }} />
            <Typography>{reading ? "Reading the folder…" : "Drop files or folders here"}</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Sub-folders are kept. Max {maxUploadMb} MB per file.
            </Typography>
            <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
              <Button size="small" variant="outlined" startIcon={<UploadFile />} onClick={() => fileInputRef.current?.click()}>
                Choose files
              </Button>
              <Button size="small" variant="outlined" startIcon={<DriveFolderUpload />} onClick={() => folderInputRef.current?.click()}>
                Choose folder
              </Button>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept={UPLOAD_ACCEPT}
              onChange={(e) => add(itemsFromInput(e.target.files))}
            />
            <input
              ref={folderInputRef}
              type="file"
              hidden
              webkitdirectory=""
              directory=""
              onChange={(e) => add(itemsFromInput(e.target.files))}
            />
          </Box>
        )}

        {picked.length > 0 && !uploading && (
          <>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <b>{picked.length}</b> file{picked.length > 1 ? "s" : ""}
              {folderCount ? ` in ${folderCount} folder${folderCount > 1 ? "s" : ""}` : ""} • {formatFileSize(totalBytes)}
              <Button size="small" sx={{ ml: 1 }} onClick={() => { setPicked([]); setLeftOut([]); clearInputs(); }}>
                Clear
              </Button>
            </Typography>
            <List dense sx={{ maxHeight: 240, overflow: "auto" }}>
              {picked.slice(0, SHOW_ROWS).map((item) => (
                <ListItem
                  key={item.rel}
                  secondaryAction={
                    <Button size="small" onClick={() => setPicked((prev) => prev.filter((p) => p !== item))}>
                      Remove
                    </Button>
                  }
                >
                  <ListItemText primary={item.rel} secondary={formatFileSize(item.file.size)} />
                </ListItem>
              ))}
              {picked.length > SHOW_ROWS && (
                <ListItem>
                  <ListItemText secondary={`… and ${picked.length - SHOW_ROWS} more`} />
                </ListItem>
              )}
            </List>
          </>
        )}

        {leftOut.length > 0 && !uploading && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {leftOut.length} file(s) will be left out (type not allowed or too large) - listed after the upload.
          </Alert>
        )}

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              {progress.done} of {progress.files} files • {formatFileSize(progress.sent)} of {formatFileSize(progress.total)} ({pct}%)
            </Typography>
            <LinearProgress variant="determinate" value={pct} />
            <Typography variant="caption" color="text.secondary">
              Keep this tab open until the upload finishes.
            </Typography>
          </Box>
        )}

        {notes.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2, maxHeight: 260, overflow: "auto" }}>
            {notes.slice(0, SHOW_NOTES).map((n) => (
              <div key={n}>{n}</div>
            ))}
            {notes.length > SHOW_NOTES && <div>… and {notes.length - SHOW_NOTES} more</div>}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {uploading ? (
          <Button color="error" onClick={() => abortRef.current?.abort()}>
            Cancel upload
          </Button>
        ) : (
          <Button onClick={close}>{notes.length ? "Close" : "Cancel"}</Button>
        )}
        <Button variant="contained" onClick={upload} disabled={!picked.length || uploading || reading}>
          Upload{picked.length > 1 ? ` ${picked.length} files` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
