import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { toast } from "react-toastify";
import { errorText } from "./reportWorkflow";
import { PHASES, deletePhoto, listPhotos, photoThumb, preparePhoto, reorderPhotos, updatePhoto, uploadPhotos } from "./reportPhotos";

function Thumb({ id }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let live = true;
    photoThumb(id)
      .then((u) => live && setSrc(u))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [id]);
  return (
    <Box sx={{ width: "100%", height: 120, bgcolor: "#eef2f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 1 }}>
      {src ? <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }} /> : null}
    </Box>
  );
}

// a field that saves when it loses focus
function SaveField({ value, label, onSave, placeholder }) {
  const [v, setV] = useState(value || "");
  useEffect(() => setV(value || ""), [value]);
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      placeholder={placeholder}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== (value || "") && onSave(v)}
      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      InputProps={{ sx: { fontSize: 13 } }}
      InputLabelProps={{ sx: { fontSize: 13 } }}
    />
  );
}

/**
 * The report's photos (Appendix A), kept on the server: upload into a phase (and a group such
 * as a serial number or an axis), drag to order or to move to another phase, set each photo's
 * group, caption and size (half width = two per row, or full width).
 */
export default function PhotoManager({ testDetailId, onChanged }) {
  const [photos, setPhotos] = useState([]);
  const [phase, setPhase] = useState("before");
  const [group, setGroup] = useState("");
  const [busy, setBusy] = useState(null); // { done, total, text }
  const [notes, setNotes] = useState([]);

  const load = useCallback(() => {
    if (!testDetailId) return;
    listPhotos(testDetailId)
      .then(setPhotos)
      .catch((e) => toast.error(errorText(e, "Could not load the photos")));
  }, [testDetailId]);
  useEffect(() => {
    load();
  }, [load]);
  const changed = (next) => {
    setPhotos(next);
    onChanged?.();
  };

  const add = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const prepared = [];
    const issues = [];
    setBusy({ done: 0, total: files.length, text: "Preparing" });
    for (const [i, f] of files.entries()) {
      try {
        const p = await preparePhoto(f);
        prepared.push(p);
        if (p.small) issues.push(`${f.name}: small photo (${p.width}×${p.height}) - fine at half width, may look blurred at full width`);
      } catch (err) {
        issues.push(err.message);
      }
      setBusy({ done: i + 1, total: files.length, text: "Preparing" });
    }
    try {
      if (prepared.length) {
        setBusy({ done: 0, total: prepared.length, text: "Uploading" });
        await uploadPhotos(testDetailId, prepared, { phase, group: group.trim() }, (done, total) => setBusy({ done, total, text: "Uploading" }));
        const shrunk = prepared.filter((p) => p.resized).length;
        toast.success(`${prepared.length} photo${prepared.length > 1 ? "s" : ""} added${shrunk ? ` (${shrunk} large ones made smaller)` : ""}`);
      }
    } catch (err) {
      toast.error(errorText(err, "Could not upload the photos"));
    } finally {
      setBusy(null);
      setNotes(issues);
      load();
      onChanged?.();
    }
  };

  const save = async (p, patch) => {
    try {
      const next = await updatePhoto(p.id, patch);
      changed(photos.map((x) => (x.id === p.id ? next : x)));
      if (patch.phase) load();
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  const remove = async (p) => {
    if (!window.confirm("Remove this photo from the report?")) return;
    try {
      await deletePhoto(p.id);
      changed(photos.filter((x) => x.id !== p.id));
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  const onDragEnd = async ({ source, destination }) => {
    if (!destination) return;
    const lists = Object.fromEntries(PHASES.map(([k]) => [k, photos.filter((p) => p.phase === k)]));
    const [moved] = lists[source.droppableId].splice(source.index, 1);
    lists[destination.droppableId].splice(destination.index, 0, { ...moved, phase: destination.droppableId });
    const next = PHASES.flatMap(([k]) => lists[k].map((p, i) => ({ ...p, order: (i + 1) * 10 })));
    changed(next);
    try {
      await reorderPhotos(testDetailId, destination.droppableId, lists[destination.droppableId].map((p) => p.id));
      if (source.droppableId !== destination.droppableId) {
        await reorderPhotos(testDetailId, source.droppableId, lists[source.droppableId].map((p) => p.id));
      }
    } catch (err) {
      toast.error(errorText(err));
      load();
    }
  };

  if (!testDetailId) return <Alert severity="info">Save the job card first.</Alert>;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Photos (Appendix A)
      </Typography>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <TextField select size="small" label="Add to" value={phase} onChange={(e) => setPhase(e.target.value)} sx={{ minWidth: 160 }}>
            {PHASES.map(([k, t]) => (
              <MenuItem key={k} value={k}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Group (optional)"
            placeholder="e.g. Sample Serial Number: 01, X-axis, IPX8"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button variant="contained" component="label" startIcon={<AddPhotoAlternateIcon />} disabled={!!busy}>
            Add photos
            <input
              hidden
              multiple
              type="file"
              accept="image/jpeg,image/png,image/webp,.heic,.heif"
              onChange={(e) => {
                const f = e.target.files;
                add(f).finally(() => {
                  e.target.value = "";
                });
              }}
            />
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
          Any size works: big phone photos are made smaller (2000 px) before upload, photos are printed without being
          stretched, two per row (or full width). Photos with the same group get a heading, e.g. "Sample Serial Number: 01".
        </Typography>
        {busy && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption">
              {busy.text} {busy.done} / {busy.total}
            </Typography>
            <LinearProgress variant="determinate" value={(busy.done / Math.max(1, busy.total)) * 100} />
          </Box>
        )}
        {notes.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }} onClose={() => setNotes([])}>
            {notes.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </Alert>
        )}
      </Paper>

      <DragDropContext onDragEnd={onDragEnd}>
        {PHASES.map(([k, title]) => {
          const list = photos.filter((p) => p.phase === k);
          return (
            <Box key={k} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
                <Chip size="small" label={list.length} />
              </Stack>
              <Droppable droppableId={k} direction="horizontal">
                {(drop, snap) => (
                  <Box
                    ref={drop.innerRef}
                    {...drop.droppableProps}
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1,
                      minHeight: 70,
                      p: 1,
                      borderRadius: 1,
                      border: "1px dashed",
                      borderColor: snap.isDraggingOver ? "primary.main" : "divider",
                      bgcolor: snap.isDraggingOver ? "#eef5ff" : "transparent",
                    }}
                  >
                    {list.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                        No photos - drag here or add them above
                      </Typography>
                    )}
                    {list.map((p, i) => (
                      <Draggable key={p.id} draggableId={String(p.id)} index={i}>
                        {(drag) => (
                          <Paper
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            variant="outlined"
                            sx={{ width: p.layout === "full" ? 300 : 200, p: 1, ...drag.draggableProps.style }}
                          >
                            <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
                              <Box {...drag.dragHandleProps} sx={{ display: "flex", cursor: "grab" }}>
                                <DragIndicatorIcon fontSize="small" color="action" />
                              </Box>
                              <Typography variant="caption" sx={{ flex: 1 }} noWrap title={p.name}>
                                {i + 1}. {p.width}×{p.height}
                              </Typography>
                              {Math.max(p.width || 0, p.height || 0) < 700 && (
                                <Tooltip title="Small photo: may look blurred at full width">
                                  <Chip size="small" color="warning" label="small" sx={{ height: 18 }} />
                                </Tooltip>
                              )}
                              <IconButton size="small" color="error" onClick={() => remove(p)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                            <Thumb id={p.id} />
                            <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                              <SaveField label="Group" value={p.group} placeholder="Serial no., axis..." onSave={(v) => save(p, { group: v })} />
                              <SaveField label="Caption" value={p.caption} onSave={(v) => save(p, { caption: v })} />
                              <ToggleButtonGroup size="small" exclusive value={p.layout} onChange={(e, v) => v && save(p, { layout: v })}>
                                <ToggleButton value="half" sx={{ py: 0.25, fontSize: 11 }}>
                                  Half width
                                </ToggleButton>
                                <ToggleButton value="full" sx={{ py: 0.25, fontSize: 11 }}>
                                  Full width
                                </ToggleButton>
                              </ToggleButtonGroup>
                            </Stack>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {drop.placeholder}
                  </Box>
                )}
              </Droppable>
            </Box>
          );
        })}
      </DragDropContext>
    </Box>
  );
}
