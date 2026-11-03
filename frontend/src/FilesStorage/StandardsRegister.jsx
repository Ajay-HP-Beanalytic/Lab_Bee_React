import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit, Preview, Refresh, Replay, Search, Upload, Verified } from "@mui/icons-material";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../Pages/APIPage";
import { apiError } from "./useFileStorage";
import UploadFilesDialog from "./UploadFilesDialog";
import FileViewer from "./FileViewer";

const TEXT_STATUS = {
  pending: { label: "Waiting", color: "default" },
  reading: { label: "Reading…", color: "info" },
  done: { label: "Searchable", color: "success" },
  scanned: { label: "Scanned - no text", color: "warning" },
  failed: { label: "Could not read", color: "error" },
};

const STATUS_COLOR = { current: "success", superseded: "warning", withdrawn: "default" };

// Register of the standard PDFs in Org Documents → Standards, and search in their text
export default function StandardsRegister() {
  const [data, setData] = useState({ standards: [], families: [], folder: "Standards", canManage: false });
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [viewing, setViewing] = useState(null); // { path, page }
  const [find, setFind] = useState({ q: "", standardId: "" });
  const [hits, setHits] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/standards`);
      setData(res.data);
    } catch (error) {
      toast.error(apiError(error, "Could not load the standards"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // While PDFs are being read, refresh every few seconds
  const busy = data.standards.some((s) => ["pending", "reading"].includes(s.text_status));
  useEffect(() => {
    if (!busy) return undefined;
    const t = setInterval(() => {
      axios
        .get(`${serverBaseAddress}/api/standards`)
        .then((res) => setData(res.data))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(t);
  }, [busy]);

  const search = async () => {
    if (find.q.trim().length < 2) return;
    try {
      const res = await axios.get(`${serverBaseAddress}/api/standards/search`, {
        params: { q: find.q.trim(), standard_id: find.standardId || undefined },
      });
      setHits(res.data.hits);
    } catch (error) {
      toast.error(apiError(error, "Search failed"));
    }
  };

  const save = async () => {
    const { id, family, designation, edition, title, published_year, status, notes, checked } = edit;
    try {
      await axios.patch(`${serverBaseAddress}/api/standards/${id}`, {
        family,
        designation,
        edition,
        title,
        published_year,
        status,
        notes,
        checked,
      });
      toast.success("Saved");
      setEdit(null);
      load();
    } catch (error) {
      toast.error(apiError(error, "Could not save"));
    }
  };

  const reread = async (row) => {
    try {
      await axios.post(`${serverBaseAddress}/api/standards/${row.id}/read`);
      toast.info(`Reading ${row.designation} again`);
      load();
    } catch (error) {
      toast.error(apiError(error, "Could not start reading"));
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "designation",
        headerName: "Standard",
        flex: 1,
        minWidth: 170,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {row.checked ? (
              <Tooltip title={`Details checked${row.checked_by_name ? ` by ${row.checked_by_name}` : ""}`}>
                <Verified color="success" fontSize="small" />
              </Tooltip>
            ) : null}
            <span>{row.designation}</span>
          </Box>
        ),
      },
      { field: "edition", headerName: "Edition", width: 110 },
      { field: "family", headerName: "Family", width: 80 },
      { field: "published_year", headerName: "Year", width: 70 },
      { field: "title", headerName: "Title", flex: 1.4, minWidth: 180 },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: ({ value }) => <Chip size="small" label={value} color={STATUS_COLOR[value]} variant="outlined" />,
      },
      {
        field: "text_status",
        headerName: "Text",
        width: 150,
        renderCell: ({ row }) => {
          const s = TEXT_STATUS[row.text_status] || TEXT_STATUS.pending;
          const chip = <Chip size="small" label={s.label} color={s.color} />;
          return row.text_error ? <Tooltip title={row.text_error}>{chip}</Tooltip> : chip;
        },
      },
      { field: "page_count", headerName: "Pages", width: 70 },
      {
        field: "actions",
        headerName: "",
        width: 130,
        sortable: false,
        renderCell: ({ row }) => (
          <Box>
            <Tooltip title="Open">
              <IconButton size="small" onClick={() => setViewing({ path: row.file_path })}>
                <Preview fontSize="small" />
              </IconButton>
            </Tooltip>
            {data.canManage && (
              <Tooltip title="Edit details">
                <IconButton size="small" onClick={() => setEdit({ ...row, checked: !!row.checked })}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {data.canManage && ["failed", "scanned", "done"].includes(row.text_status) && (
              <Tooltip title="Read the text again">
                <IconButton size="small" onClick={() => reread(row)}>
                  <Replay fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.canManage]
  );

  const unchecked = data.standards.filter((s) => !s.checked).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <Box>
          <Typography variant="h6">Standards library</Typography>
          <Typography variant="body2" color="text.secondary">
            PDFs in the "{data.folder}" folder. Details are guessed from the file name and cover page - please check them.
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {data.canManage && (
            <Button startIcon={<Upload />} variant="outlined" size="small" onClick={() => setUploadOpen(true)}>
              Upload standards
            </Button>
          )}
          <Button startIcon={<Refresh />} variant="outlined" size="small" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </Box>
      </Box>

      {unchecked > 0 && data.canManage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {unchecked} standard{unchecked > 1 ? "s have" : " has"} details not checked yet (edit and tick "Details checked").
        </Alert>
      )}

      {/* Find in standards */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            fullWidth
            label='Find in standards (e.g. "Method 514.6", "salt fog")'
            value={find.q}
            onChange={(e) => setFind({ ...find, q: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <TextField
            select
            size="small"
            label="In"
            value={find.standardId}
            onChange={(e) => setFind({ ...find, standardId: e.target.value })}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All standards</MenuItem>
            {data.standards.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.designation}
                {s.edition && !s.designation.endsWith(s.edition) ? ` (${s.edition})` : ""}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<Search />} onClick={search} disabled={find.q.trim().length < 2}>
            Find
          </Button>
        </Stack>
        {hits && (
          <Box mt={1}>
            {hits.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Not found. Scanned PDFs cannot be searched yet.
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
                {hits.map((h) => (
                  <ListItemButton key={`${h.standard_id}-${h.page_no}`} onClick={() => setViewing({ path: h.file_path, page: h.page_no })}>
                    <ListItemText
                      primary={`${h.designation}${h.edition && !h.designation?.endsWith(h.edition) ? ` (${h.edition})` : ""} - page ${h.page_no}`}
                      secondary={h.snippet}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        )}
      </Paper>

      <DataGrid
        autoHeight
        density="compact"
        rows={data.standards}
        columns={columns}
        loading={loading}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        disableRowSelectionOnClick
      />

      <UploadFilesDialog
        open={uploadOpen}
        folder={data.folder}
        title="Upload standards"
        hint="PDF files, or drop a whole folder (sub-folders are kept). One file per standard, e.g. MIL-STD-810H.pdf, IEC 60068-2-6 2007.pdf, JSS 55555 Rev 3.pdf - a clear file name gives the best details."
        onClose={() => setUploadOpen(false)}
        onUploaded={load}
      />

      {edit && (
        <Dialog open onClose={() => setEdit(null)} fullWidth maxWidth="sm">
          <DialogTitle>Standard details</DialogTitle>
          <DialogContent>
            <Typography variant="caption" color="text.secondary">
              File: {edit.file_path}
            </Typography>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Family"
                  value={edit.family}
                  onChange={(e) => setEdit({ ...edit, family: e.target.value })}
                  sx={{ minWidth: 120 }}
                >
                  {data.families.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Designation"
                  fullWidth
                  required
                  value={edit.designation || ""}
                  onChange={(e) => setEdit({ ...edit, designation: e.target.value })}
                  helperText="As customers cite it, e.g. MIL-STD-810H, IEC 60068-2-6"
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Edition / revision"
                  value={edit.edition || ""}
                  onChange={(e) => setEdit({ ...edit, edition: e.target.value })}
                  helperText="e.g. H Change 1, Ed. 7.0, Rev 3"
                  fullWidth
                />
                <TextField
                  label="Year"
                  type="number"
                  value={edit.published_year || ""}
                  onChange={(e) => setEdit({ ...edit, published_year: e.target.value })}
                  sx={{ width: 120 }}
                />
                <TextField
                  select
                  label="Status"
                  value={edit.status}
                  onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="current">Current</MenuItem>
                  <MenuItem value="superseded">Superseded</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </TextField>
              </Stack>
              <TextField
                label="Title"
                value={edit.title || ""}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                fullWidth
              />
              <TextField
                label="Notes"
                value={edit.notes || ""}
                onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
              <FormControlLabel
                control={<Checkbox checked={!!edit.checked} onChange={(e) => setEdit({ ...edit, checked: e.target.checked })} />}
                label="Details checked against the document"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewing({ path: edit.file_path })}>Open PDF</Button>
            <Box flex={1} />
            <Button onClick={() => setEdit(null)}>Cancel</Button>
            <Button variant="contained" onClick={save} disabled={!String(edit.designation || "").trim()}>
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {viewing && (
        <FileViewer
          filePath={viewing.path}
          page={viewing.page}
          serverBaseAddress={serverBaseAddress}
          onClose={() => setViewing(null)}
        />
      )}
    </Box>
  );
}
