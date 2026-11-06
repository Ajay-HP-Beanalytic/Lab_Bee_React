import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, FormControlLabel, IconButton, LinearProgress, Stack, Switch, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { renderAsync } from "docx-preview";
import { draftOverlaySx } from "./draftOverlay";

/**
 * The draft as it will come out, rebuilt a moment after each change (or on Refresh).
 * @param {object} props
 * @param {object} props.config - the report config being edited
 * @param {string} props.version - changes whenever the config (or the photos) change
 * @param {(config) => Promise<Blob>} props.onPreview - makes the draft
 */
export default function LivePreview({ config, version, onPreview }) {
  const box = useRef(null);
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(0.62);
  const [stamp, setStamp] = useState(null);
  const run = useRef(0);
  const latest = useRef(config);
  latest.current = config;

  const refresh = async () => {
    if (!onPreview || !box.current) return;
    const mine = ++run.current;
    setBusy(true);
    setError("");
    try {
      const blob = await onPreview(latest.current);
      if (mine !== run.current || !box.current) return;
      box.current.innerHTML = "";
      await renderAsync(blob, box.current, null, {
        className: "docx-preview",
        inWrapper: true,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
      });
      setStamp(new Date());
    } catch (err) {
      if (mine === run.current) setError(err?.response?.data?.error || err?.message || "The preview could not be made");
    } finally {
      if (mine === run.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(refresh, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, auto]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, borderBottom: "1px solid #e3e8ee", bgcolor: "#fafbfc" }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Live preview
          {stamp && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              updated {stamp.toLocaleTimeString()}
            </Typography>
          )}
        </Typography>
        <FormControlLabel control={<Switch size="small" checked={auto} onChange={(e) => setAuto(e.target.checked)} />} label={<Typography variant="caption">Auto</Typography>} />
        <Tooltip title="Smaller">
          <IconButton size="small" onClick={() => setZoom((z) => Math.max(0.35, z - 0.1))}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bigger">
          <IconButton size="small" onClick={() => setZoom((z) => Math.min(1.2, z + 0.1))}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button size="small" startIcon={<RefreshIcon />} onClick={refresh} disabled={busy}>
          Refresh
        </Button>
      </Stack>
      {busy && <LinearProgress />}
      {error && (
        <Alert severity="warning" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ flex: 1, overflow: "auto", bgcolor: "#e9edf1", p: 1 }}>
        <Box sx={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%`, ...draftOverlaySx }}>
          <div ref={box} />
        </Box>
      </Box>
    </Box>
  );
}
