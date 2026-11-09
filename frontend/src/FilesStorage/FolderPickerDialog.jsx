import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Folder } from "@mui/icons-material";
import { serverBaseAddress } from "../Pages/APIPage";
import { apiError } from "./useFileStorage";

/**
 * Pick a folder in Org Documents. exclude: paths that cannot be chosen
 * (the folders being moved). onPick(folderPath) - "" is Home.
 */
export default function FolderPickerDialog({ open, title, actionLabel, startPath = "", exclude = [], onClose, onPick }) {
  const [current, setCurrent] = useState(startPath);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) setCurrent(startPath);
  }, [open, startPath]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    axios
      .get(`${serverBaseAddress}/api/files`, { params: { folder: current } })
      .then((res) => setFolders(res.data.files.filter((f) => f.type === "folder")))
      .catch((e) => {
        setFolders([]);
        setError(apiError(e, "Could not load folders"));
      })
      .finally(() => setLoading(false));
  }, [open, current]);

  const blocked = (p) => exclude.some((x) => p === x || p.startsWith(`${x}/`));
  const parts = current.split("/").filter(Boolean);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link component="button" variant="body2" onClick={() => setCurrent("")} underline="hover">
            Home
          </Link>
          {parts.map((seg, i) => {
            const p = parts.slice(0, i + 1).join("/");
            return i === parts.length - 1 ? (
              <Typography key={p} variant="body2" color="text.primary">
                {seg}
              </Typography>
            ) : (
              <Link key={p} component="button" variant="body2" onClick={() => setCurrent(p)} underline="hover">
                {seg}
              </Link>
            );
          })}
        </Breadcrumbs>
        {loading ? (
          <Box textAlign="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : folders.length === 0 ? (
          <Typography color="text.secondary" py={2}>
            No sub-folders here
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
            {folders.map((f) => (
              <ListItemButton key={f.path} disabled={blocked(f.path)} onClick={() => setCurrent(f.path)}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Folder fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={f.name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, pl: 1 }} noWrap>
          To: {current || "Home"}
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={blocked(current)} onClick={() => onPick(current)}>
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
