import { useCallback, useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { toast } from "react-toastify";
import { errorText } from "./reportWorkflow";
import { PHASES, deletePhoto, listPhotos, photoThumb, preparePhoto, reorderPhotos, updatePhoto, uploadPhotos } from "./reportPhotos";
import { FAMILIES, photoModeOf, placesOffered, placesShown, samplesOf } from "../../Reports/reportLayouts";
import SectionCard from "../../components/ReportConfig/SectionCard";

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
    <Box sx={{ width: "100%", height: 110, bgcolor: "#eef2f6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 1 }}>
      {src ? <img src={src} alt="" style={{ maxWidth: "100%", maxHeight: 110, objectFit: "contain" }} /> : null}
    </Box>
  );
}

// a field that saves when it loses focus
function SaveField({ value, label, onSave, placeholder, sx }) {
  const [v, setV] = useState(value || "");
  useEffect(() => setV(value || ""), [value]);
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      placeholder={placeholder}
      value={v}
      sx={sx}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== (value || "") && onSave(v)}
      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      InputProps={{ sx: { fontSize: 13 } }}
      InputLabelProps={{ sx: { fontSize: 13 } }}
    />
  );
}

const zoneId = (phase, group) => `${phase}@@${group ?? "*"}`;

/**
 * The report's photos (Appendix A), kept on the server. Sample wise: each sample, batch or ESS
 * stage has its own places (Before / Setup / the axes for vibration / During / After, chosen with
 * the chips), printed under its heading. All together: the places once, with an optional group
 * per photo. Drag to order or to move a photo; each photo has a caption and a size (half width =
 * two per row, or full width).
 */
export default function PhotoManager({ testDetailId, content, onContent, onChanged }) {
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(null); // { done, total, text }
  const [notes, setNotes] = useState([]);
  const [newSample, setNewSample] = useState("");
  const mode = photoModeOf(content);
  const perTest = FAMILIES[content?.family]?.photoGroups === "test";
  const samples = samplesOf(content, photos);

  const load = useCallback(() => {
    if (!testDetailId) return;
    listPhotos(testDetailId)
      .then((list) => setPhotos(list.filter((p) => p.phase !== "graph")))
      .catch((e) => toast.error(errorText(e, "Could not load the photos")));
  }, [testDetailId]);
  useEffect(() => {
    load();
  }, [load]);
  const changed = (next) => {
    setPhotos(next);
    onChanged?.();
  };

  const add = async (fileList, phase, group) => {
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
        await uploadPhotos(testDetailId, prepared, { phase, group: group || "" }, (done, total) => setBusy({ done, total, text: "Uploading" }));
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

  // the groups shown, in print order ("" = photos not given to a sample)
  const groupKeys = mode === "sample" ? ["", ...samples] : [null];
  const inZone = (list, phase, group) => list.filter((p) => p.phase === phase && (group === null || (p.group || "").trim() === group));

  const onDragEnd = async ({ source, destination }) => {
    if (!destination) return;
    const lists = {};
    for (const [phase] of PHASES) for (const g of groupKeys) lists[zoneId(phase, g)] = inZone(photos, phase, g);
    const [toPhase, toGroup] = destination.droppableId.split("@@");
    const [fromPhase] = source.droppableId.split("@@");
    const [moved] = lists[source.droppableId].splice(source.index, 1);
    lists[destination.droppableId].splice(destination.index, 0, { ...moved, phase: toPhase, ...(mode === "sample" ? { group: toGroup } : {}) });
    const next = PHASES.flatMap(([phase]) => groupKeys.flatMap((g) => lists[zoneId(phase, g)])).map((p, i) => ({ ...p, order: (i + 1) * 10 }));
    changed(next);
    try {
      for (const phase of new Set([toPhase, fromPhase])) {
        const items = next.filter((p) => p.phase === phase).map((p) => (mode === "sample" ? { id: p.id, group: p.group || "" } : { id: p.id }));
        if (items.length) await reorderPhotos(testDetailId, phase, items);
      }
    } catch (err) {
      toast.error(errorText(err));
      load();
    }
  };

  // ---- the list of samples / batches ----
  const setSamples = (list) => onContent({ photoSamples: list });
  const addSample = () => {
    const name = newSample.trim();
    if (!name) return;
    if (!samples.includes(name)) setSamples([...samples, name]);
    setNewSample("");
  };
  const moveSample = (i, d) => {
    const list = [...samples];
    [list[i], list[i + d]] = [list[i + d], list[i]];
    setSamples(list);
  };
  // photos and graphs of the sample keep following it
  const regroup = async (from, to) => {
    const all = await listPhotos(testDetailId);
    await Promise.all(all.filter((p) => (p.group || "").trim() === from).map((p) => updatePhoto(p.id, { group: to })));
    load();
    onChanged?.();
  };
  const renameSample = async (from, to) => {
    const name = to.trim();
    if (!name || samples.includes(name)) return;
    const { [from]: places, ...otherPlaces } = content?.photoPlaces || {};
    onContent({ photoSamples: samples.map((s) => (s === from ? name : s)), ...(places ? { photoPlaces: { ...otherPlaces, [name]: places } } : {}) });
    try {
      await regroup(from, name);
    } catch (err) {
      toast.error(errorText(err));
    }
  };
  const removeSample = async (name) => {
    const count = photos.filter((p) => (p.group || "").trim() === name).length;
    if (count && !window.confirm(`Remove "${name}"? Its ${count} photo(s) stay in the report, without a sample.`)) return;
    setSamples(samples.filter((s) => s !== name));
    try {
      if (count) await regroup(name, "");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  if (!testDetailId) return <Alert severity="info">Save the job card first.</Alert>;

  // (a plain function, not a component: a component made here would be new on every render and
  // would lose what is being typed or dragged)
  const zoneView = (phase, title, group) => {
    const list = inZone(photos, phase, group);
    return (
      <Box key={phase} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip size="small" label={list.length} sx={{ height: 18 }} />
          <Box sx={{ flex: 1 }} />
          <Button size="small" component="label" startIcon={<AddPhotoAlternateIcon />} disabled={!!busy}>
            Add photos
            <input
              hidden
              multiple
              type="file"
              accept="image/jpeg,image/png,image/webp,.heic,.heif"
              onChange={(e) => {
                const f = e.target.files;
                add(f, phase, group).finally(() => {
                  e.target.value = "";
                });
              }}
            />
          </Button>
        </Stack>
        <Droppable droppableId={zoneId(phase, group)} direction="horizontal">
          {(drop, snap) => (
            <Box
              ref={drop.innerRef}
              {...drop.droppableProps}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                minHeight: 56,
                p: 1,
                borderRadius: 1,
                border: "1px dashed",
                borderColor: snap.isDraggingOver ? "primary.main" : "divider",
                bgcolor: snap.isDraggingOver ? "#eef5ff" : "transparent",
              }}
            >
              {list.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                  No photos yet - add them, or drag one here
                </Typography>
              )}
              {list.map((p, i) => (
                <Draggable key={p.id} draggableId={String(p.id)} index={i}>
                  {(drag) => (
                    <Paper ref={drag.innerRef} {...drag.draggableProps} variant="outlined" sx={{ width: 190, p: 1, ...drag.draggableProps.style }}>
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
                        {group === null && <SaveField label="Group" value={p.group} placeholder="e.g. X-axis" onSave={(v) => save(p, { group: v })} />}
                        <SaveField label="Caption" value={p.caption} onSave={(v) => save(p, { caption: v })} />
                        <ToggleButtonGroup size="small" exclusive fullWidth value={p.layout} onChange={(e, v) => v && save(p, { layout: v })}>
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
  };
  // Which places this section uses; a place that has photos can't be switched off
  const placeChooser = (group) => {
    const shown = placesShown(content, group, photos).map(([k]) => k);
    const toggle = (k) =>
      onContent({
        photoPlaces: { ...(content?.photoPlaces || {}), [group ?? "*"]: shown.includes(k) ? shown.filter((x) => x !== k) : [...shown, k] },
      });
    return (
      <Stack direction="row" flexWrap="wrap" alignItems="center" useFlexGap spacing={0.75} sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Photos for:
        </Typography>
        {placesOffered(content, group).map(([k, t]) => {
          const inUse = inZone(photos, k, group).length > 0;
          return (
            <Chip
              key={k}
              size="small"
              label={t}
              clickable={!inUse}
              onClick={inUse ? undefined : () => toggle(k)}
              color={shown.includes(k) ? "primary" : "default"}
              variant={shown.includes(k) ? "filled" : "outlined"}
            />
          );
        })}
      </Stack>
    );
  };
  const zones = (group) => (
    <>
      {placeChooser(group)}
      {placesShown(content, group, photos).map(([k, t]) => zoneView(k, t, group))}
    </>
  );

  const free = photos.filter((p) => !(p.group || "").trim());

  return (
    <Box>
      <SectionCard
        title="How the photos are arranged"
        subtitle="Any size works: big phone photos are made smaller before upload, and photos are printed without being stretched."
      >
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(e, v) => v && onContent({ photoMode: v })}>
          <ToggleButton value="sample">{perTest ? "Per test stage" : "Sample / batch wise"}</ToggleButton>
          <ToggleButton value="phase">All together</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
          {mode === "sample"
            ? `Each ${perTest ? "test stage" : "sample or batch"} gets its heading in the report, then the photos of the places you choose under it. Empty places are not printed.`
            : "The places you choose once, for all samples. A photo's group prints as a sub heading."}
        </Typography>
        {mode === "sample" && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              label={perTest ? "Add a test stage" : "Add a sample or batch"}
              placeholder={perTest ? "e.g. FUNCTIONAL TEST SETUP" : "e.g. Sample Serial Number: 003, Batch 1"}
              value={newSample}
              onChange={(e) => setNewSample(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSample()}
            />
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addSample} sx={{ whiteSpace: "nowrap" }}>
              Add
            </Button>
          </Stack>
        )}
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
      </SectionCard>

      <DragDropContext onDragEnd={onDragEnd}>
        {mode === "phase" && <SectionCard title="Photos (Appendix A)">{zones(null)}</SectionCard>}
        {mode === "sample" && free.length > 0 && (
          <SectionCard title="Not given to a sample" subtitle="Printed first, without a sample heading. Drag them to a sample below.">
            {zones("")}
          </SectionCard>
        )}
        {mode === "sample" && samples.length === 0 && <Alert severity="info">Add a sample or batch above, then its photos.</Alert>}
        {mode === "sample" &&
          samples.map((s, i) => (
            <SectionCard
              key={s}
              title={
                <SaveField
                  label={perTest ? "Test stage (prints with PHOTOS after it)" : "Sample / batch heading"}
                  value={s}
                  onSave={(v) => renameSample(s, v)}
                  sx={{ maxWidth: 420, "& input": { fontWeight: 600 } }}
                />
              }
              action={
                <>
                  <IconButton size="small" disabled={i === 0} onClick={() => moveSample(i, -1)} title="Move up">
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" disabled={i === samples.length - 1} onClick={() => moveSample(i, 1)} title="Move down">
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => removeSample(s)} title="Remove">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              }
            >
              {zones(s)}
            </SectionCard>
          ))}
      </DragDropContext>
    </Box>
  );
}
