import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { toast } from "react-toastify";
import { errorText } from "./reportWorkflow";
import { deletePhoto, listPhotos, photoThumb, prepareGraphFile, reorderPhotos, updatePhoto, uploadPhotos } from "./reportPhotos";
import { FAMILIES, familyOf, photoModeOf, samplesOf } from "../../Reports/reportLayouts";

const isImage = (f) => /^image\//.test(f.mime || "");
const END = "@@end"; // the part of an ESS report after its stages

function Thumb({ file }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!isImage(file)) return undefined;
    let live = true;
    photoThumb(file.id)
      .then((u) => live && setSrc(u))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [file]);
  return (
    <Box sx={{ width: 96, height: 72, flexShrink: 0, bgcolor: "#eef2f6", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1, overflow: "hidden" }}>
      {isImage(file) ? src && <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: 72 }} /> : <DescriptionIcon color="primary" fontSize="large" />}
    </Box>
  );
}

// a field that saves when it loses focus
function Caption({ value, onSave }) {
  const [v, setV] = useState(value || "");
  useEffect(() => setV(value || ""), [value]);
  return (
    <TextField
      size="small"
      fullWidth
      label="Heading above it (optional)"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== (value || "") && onSave(v)}
      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
    />
  );
}

/**
 * Graphs and test documents, kept on the server: images and Word files (e.g. the vibration
 * controller's report) in any mix. Each is printed portrait or landscape, after the photos of a
 * sample / stage or at the end of the report. An ESS report has one section per stage, so the
 * pre-vibration, thermal cycling and post-vibration graphs each have their own place.
 */
export default function GraphManager({ testDetailId, content, onChanged }) {
  const [files, setFiles] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(null); // { done, total, name, section }
  const family = FAMILIES[content?.family];
  const sampleWise = photoModeOf(content) === "sample";
  const places = sampleWise ? samplesOf(content, photos) : [];
  const byStage = sampleWise && family?.photoGroups === "test";
  const isThermal = (place) => familyOf("", place) === "thermal";
  const sectionOf = (f) => (places.includes((f.group || "").trim()) ? f.group.trim() : END);

  const load = useCallback(() => {
    if (!testDetailId) return;
    listPhotos(testDetailId)
      .then((list) => {
        setFiles(list.filter((p) => p.phase === "graph"));
        setPhotos(list.filter((p) => p.phase !== "graph"));
      })
      .catch((e) => toast.error(errorText(e, "Could not load the graphs")));
  }, [testDetailId]);
  useEffect(() => {
    load();
  }, [load]);

  // One file at a time: an old Word file can take a while to convert, and a bad file doesn't stop the others
  const add = async (fileList, section) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    const group = section && section !== END ? section : "";
    const layout = byStage && section ? (isThermal(section) ? "portrait" : "landscape") : family?.landscapeGraphs ? "landscape" : "portrait";
    let added = 0;
    try {
      for (const [i, f] of picked.entries()) {
        setBusy({ done: i, total: picked.length, name: f.name, section, oldWord: /\.doc$/i.test(f.name) });
        try {
          const prepared = await prepareGraphFile(f);
          await uploadPhotos(testDetailId, [prepared], { phase: "graph", layout, group });
          added += 1;
        } catch (err) {
          toast.error(errorText(err, `Could not add ${f.name}`), { autoClose: 8000 });
        }
      }
      if (added) toast.success(`${added} file${added > 1 ? "s" : ""} added`);
    } finally {
      setBusy(null);
      load();
      onChanged?.();
    }
  };

  const save = async (f, patch) => {
    try {
      const next = await updatePhoto(f.id, patch);
      setFiles(files.map((x) => (x.id === f.id ? next : x)));
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  const remove = async (f) => {
    if (!window.confirm(`Remove "${f.name}" from the report?`)) return;
    try {
      await deletePhoto(f.id);
      setFiles(files.filter((x) => x.id !== f.id));
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  // Up or down among the files listed together
  const move = async (f, list, d) => {
    const other = list[list.indexOf(f) + d];
    const next = [...files];
    const a = next.indexOf(f);
    const b = next.indexOf(other);
    [next[a], next[b]] = [next[b], next[a]];
    setFiles(next);
    try {
      await reorderPhotos(testDetailId, "graph", next.map((x) => ({ id: x.id })));
      onChanged?.();
    } catch (err) {
      toast.error(errorText(err));
      load();
    }
  };

  if (!testDetailId) return <Alert severity="info">Save the job card first.</Alert>;

  const addButton = (section, label, variant = "contained") => (
    <Button
      size="small"
      variant={variant}
      component="label"
      startIcon={busy && busy.section === section ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
      disabled={!!busy}
      sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
    >
      {busy && busy.section === section ? "Adding..." : label}
      <input
        hidden
        multiple
        type="file"
        accept="image/jpeg,image/png,image/webp,.docx,.doc,.pdf"
        onChange={(e) => {
          const f = e.target.files;
          add(f, section).finally(() => {
            e.target.value = "";
          });
        }}
      />
    </Button>
  );

  const fileList = (list) => (
    <Stack spacing={1}>
      {list.map((f, i) => (
        <Paper key={f.id} variant="outlined" sx={{ p: 1.25 }}>
          <Stack direction="row" spacing={1.5}>
            <Thumb file={f} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" noWrap sx={{ flex: 1, fontWeight: 600 }} title={f.name}>
                  {i + 1}. {f.name}
                </Typography>
                <IconButton size="small" disabled={i === 0} onClick={() => move(f, list, -1)} title="Move up">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={i === list.length - 1} onClick={() => move(f, list, 1)} title="Move down">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => remove(f)} title="Remove">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                <ToggleButtonGroup size="small" exclusive value={f.layout === "landscape" ? "landscape" : "portrait"} onChange={(e, v) => v && save(f, { layout: v })}>
                  <ToggleButton value="portrait" sx={{ py: 0.5, fontSize: 12 }}>
                    Portrait
                  </ToggleButton>
                  <ToggleButton value="landscape" sx={{ py: 0.5, fontSize: 12 }}>
                    Landscape
                  </ToggleButton>
                </ToggleButtonGroup>
                {places.length > 0 && (
                  <TextField
                    select
                    size="small"
                    label="Printed"
                    value={places.includes((f.group || "").trim()) ? f.group.trim() : ""}
                    onChange={(e) => save(f, { group: e.target.value })}
                    sx={{ minWidth: 220 }}
                  >
                    <MenuItem value="">At the end of the report</MenuItem>
                    {places.map((p) => (
                      <MenuItem key={p} value={p}>
                        After {p}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <Caption value={f.caption} onSave={(v) => save(f, { caption: v })} />
              </Stack>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );

  const progress = busy && (
    <Paper variant="outlined" sx={{ position: "sticky", top: 0, zIndex: 2, p: 1.25, mb: 1.5, bgcolor: "background.paper" }}>
      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }} title={busy.name}>
        Adding file {busy.done + 1} of {busy.total}: {busy.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
        {busy.oldWord ? "Old Word files are converted on the server. This can take up to a minute." : "Please wait."}
      </Typography>
      <LinearProgress />
    </Paper>
  );

  const help = "JPG or PNG images and Word files (.doc or .docx), in any mix. A Word file is copied into the report with its text, tables and pictures.";

  if (byStage) {
    const atEnd = files.filter((f) => sectionOf(f) === END);
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
          {help} Each stage prints in this order: its photos, then the files below. Vibration files start on landscape pages, thermal cycling files on portrait pages.
        </Typography>
        {progress}
        <Stack spacing={1.5}>
          {places.map((place) => {
            const list = files.filter((f) => sectionOf(f) === place);
            return (
              <Paper key={place} variant="outlined" sx={{ p: 1.5, bgcolor: "#fafbfc" }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {place.replace(/\s*test setup$/i, "")} graphs
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isThermal(place) ? "The test details page prints before the first graph image." : "All batches and axes of this run, in the order listed."}
                    </Typography>
                  </Box>
                  {addButton(place, "Add files")}
                </Stack>
                {list.length ? fileList(list) : <Typography variant="caption" color="text.secondary">No files yet.</Typography>}
              </Paper>
            );
          })}
          {atEnd.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                At the end of the report
              </Typography>
              {fileList(atEnd)}
            </Paper>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {addButton(null, "Add images or Word files")}
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1, mb: 1.5 }}>
        {help}
        {family?.landscapeGraphs ? " New files start on landscape pages, as in the lab's vibration and ESS reports." : ""}
      </Typography>
      {progress}
      {files.length === 0 && <Alert severity="info">No graphs or documents yet.</Alert>}
      {fileList(files)}
    </Box>
  );
}
