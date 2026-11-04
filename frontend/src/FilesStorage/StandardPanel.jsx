import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close, Download, MenuBook, OpenInNew, Search } from "@mui/icons-material";
import { serverBaseAddress } from "../Pages/APIPage";
import { apiError, fileDownloadUrl, fileServeUrl } from "./useFileStorage";

const pages = (from, to) => (from === to ? `p. ${from}` : `pp. ${from}–${to}`);

/**
 * A test's standard, opened at its method, in a panel on the right. The screen
 * behind stays usable, so the tester can read and fill in the job card / tests
 * at the same time.
 * reference: "MIL-STD-810H Method 507.6 Proc II"; method: optional extra ("CS114")
 */
export default function StandardPanel({ reference, method = "", onClose }) {
  const [standardId, setStandardId] = useState(null); // another copy picked by the user
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [find, setFind] = useState("");
  const [hits, setHits] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let live = true;
    setData(null);
    setError("");
    setHits(null);
    axios
      .get(`${serverBaseAddress}/api/standards/locate`, {
        params: { ref: reference, method, standard_id: standardId || undefined },
      })
      .then((res) => {
        if (!live) return;
        setData(res.data);
        setPage(res.data.method?.page || 1);
      })
      .catch((err) => live && setError(apiError(err, "Could not open the standard")));
    return () => {
      live = false;
    };
  }, [reference, method, standardId]);

  const std = data?.standard;
  const m = data?.method;

  const search = async () => {
    if (!std || find.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await axios.get(`${serverBaseAddress}/api/standards/search`, {
        params: { q: find.trim(), standard_id: std.id },
      });
      setHits(res.data.hits);
    } catch (err) {
      setError(apiError(err, "Search failed"));
    } finally {
      setSearching(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      // not modal: no backdrop and clicks go through to the screen behind
      ModalProps={{ hideBackdrop: true, disableEnforceFocus: true, disableScrollLock: true }}
      sx={{ zIndex: (t) => t.zIndex.modal + 1, pointerEvents: "none" }}
      PaperProps={{
        sx: { pointerEvents: "auto", width: { xs: "100vw", md: "52vw" }, display: "flex", flexDirection: "column" },
      }}
    >
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <MenuBook color="primary" />
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {std ? `${std.designation}${std.edition && !std.designation.endsWith(std.edition) ? ` (${std.edition})` : ""}` : reference}
          </Typography>
          {std && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {std.file_path.split("/").pop()}
              {std.status !== "current" && ` · ${std.status}`}
              {!std.checked && " · details not yet checked"}
            </Typography>
          )}
        </Box>
        {std && (
          <>
            <Tooltip title="Open in a new tab">
              <IconButton size="small" component="a" href={fileServeUrl(std.file_path, page)} target="_blank" rel="noopener">
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton size="small" component="a" href={fileDownloadUrl(std.file_path)}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />

      {error && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      {!data && !error && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={28} />
        </Box>
      )}

      {data && !std && (
        <Box p={2}>
          <Alert severity="info">
            <strong>{data.asked.designation || reference}</strong> is not in the standards library.
            {data.asked.method && ` (${data.asked.method} was asked for.)`}
          </Alert>
          <Typography variant="body2" color="text.secondary" mt={1.5}>
            Administration or the Quality Engineer can add the PDF in Org Documents → Standards. It can be read here once it's added.
          </Typography>
          <Button sx={{ mt: 1 }} size="small" startIcon={<OpenInNew />} onClick={() => window.open("/org_docs", "_blank", "noopener")}>
            Open Org Documents
          </Button>
        </Box>
      )}

      {std && (
        <>
          <Box sx={{ px: 2, pt: 1 }}>
            {data.note && (
              <Alert severity={data.match === "exact" ? "info" : "warning"} sx={{ mb: 1, py: 0 }}>
                {data.note}
              </Alert>
            )}
            {m?.note && (
              <Alert severity="warning" sx={{ mb: 1, py: 0 }}>
                {m.note}
              </Alert>
            )}
            {m && !m.found && (
              <Alert severity="info" sx={{ mb: 1, py: 0 }}>
                {m.label} wasn't found as a heading in this PDF. Try "Find in this standard" below.
              </Alert>
            )}
            <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center" mb={1}>
              {m?.found && (
                <Chip
                  size="small"
                  color="primary"
                  label={`${m.label} · ${pages(m.from, m.to)}`}
                  onClick={() => setPage(m.from)}
                  variant={page === m.from ? "filled" : "outlined"}
                />
              )}
              {m?.procedure &&
                (m.procedure.page ? (
                  <Chip
                    size="small"
                    color="primary"
                    label={`${m.procedure.label} · p. ${m.procedure.page}`}
                    onClick={() => setPage(m.procedure.page)}
                    variant={page === m.procedure.page ? "filled" : "outlined"}
                  />
                ) : (
                  <Chip size="small" variant="outlined" label={`${m.procedure.label} not found`} />
                ))}
              {m?.others?.map((o) => (
                <Tooltip key={o.from} title="The same method is also covered here (e.g. an appendix)">
                  <Chip size="small" variant="outlined" label={`Also ${pages(o.from, o.to)}`} onClick={() => setPage(o.from)} />
                </Tooltip>
              ))}
              {page !== 1 && <Chip size="small" variant="outlined" label="Page 1" onClick={() => setPage(1)} />}
            </Stack>
            {data.alternatives?.length > 0 && (
              <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Other copies:
                </Typography>
                {data.alternatives.map((a) => (
                  <Chip
                    key={a.id}
                    size="small"
                    variant="outlined"
                    label={`${a.designation}${a.edition && !a.designation.endsWith(a.edition) ? ` ${a.edition}` : ""}${a.published_year ? ` (${a.published_year})` : ""}`}
                    onClick={() => setStandardId(a.id)}
                  />
                ))}
              </Stack>
            )}
            {std.text_status === "done" && (
              <TextField
                size="small"
                fullWidth
                placeholder="Find in this standard, e.g. 'Procedure II' or 'dwell time'"
                value={find}
                onChange={(e) => setFind(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={search} disabled={searching || find.trim().length < 2}>
                        {searching ? <CircularProgress size={16} /> : <Search fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
            {hits && (
              <List dense sx={{ maxHeight: 180, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1, mt: 0.5 }}>
                {hits.length === 0 && (
                  <Typography variant="body2" color="text.secondary" p={1}>
                    Not found.
                  </Typography>
                )}
                {hits.map((h) => (
                  <ListItemButton key={h.page_no} selected={page === h.page_no} onClick={() => setPage(h.page_no)}>
                    <ListItemText
                      primary={`Page ${h.page_no}`}
                      secondary={h.snippet}
                      secondaryTypographyProps={{ sx: { fontSize: 12 } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
          <Box flex={1} minHeight={300} mt={1}>
            <iframe
              key={`${std.id}-${page}`}
              title={std.designation}
              src={fileServeUrl(std.file_path, page)}
              style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          </Box>
        </>
      )}
    </Drawer>
  );
}
