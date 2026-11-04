import { useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import { MENU_GROUPS, MENU_ITEMS } from "../../Pages/menuCatalog";

const errorOf = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;
const keyOf = (type, id) => `${type}:${id}`;

/**
 * Which side-menu items each department may open (and extra items for a role).
 * A page that is not ticked is hidden from the menu and can't be opened.
 */
export default function MenuAccessTab({ config, setConfig }) {
  const [view, setView] = useState("departments"); // or a department id: its roles
  const [draft, setDraft] = useState({}); // "department:3" -> [menu keys] (changed only)
  const [saving, setSaving] = useState(false);

  const roleDept = view === "departments" ? null : config.departments.find((d) => d.id === view);
  const columns = useMemo(
    () =>
      roleDept
        ? roleDept.roles.map((r) => ({ type: "role", id: r.id, name: r.name, menus: r.menus, inherited: roleDept.is_admin ? config.menuKeys : roleDept.menus }))
        : config.departments.map((d) => ({ type: "department", id: d.id, name: d.name, menus: d.menus, admin: d.is_admin })),
    [roleDept, config],
  );

  const menusOf = (c) => draft[keyOf(c.type, c.id)] || c.menus;
  const toggle = (c, key) => {
    const now = new Set(menusOf(c));
    now.has(key) ? now.delete(key) : now.add(key);
    setDraft((d) => ({ ...d, [keyOf(c.type, c.id)]: [...now] }));
  };
  const changed = Object.keys(draft);

  const save = async () => {
    setSaving(true);
    try {
      let latest = null;
      for (const k of changed) {
        const [type, id] = k.split(":");
        const res = await axios.put(`${serverBaseAddress}/api/access/${type === "department" ? "departments" : "roles"}/${id}`, { menus: draft[k] });
        latest = res.data;
      }
      if (latest) setConfig(latest);
      setDraft({});
      toast.success("Menu access saved - users see it the next time their page loads");
    } catch (err) {
      toast.error(errorOf(err, "Could not save the menu access"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Show</InputLabel>
          <Select
            label="Show"
            value={view}
            onChange={(e) => {
              if (changed.length && !window.confirm("Leave without saving your changes?")) return;
              setDraft({});
              setView(e.target.value);
            }}
          >
            <MenuItem value="departments">Departments</MenuItem>
            {config.departments
              .filter((d) => !d.is_admin && d.roles.length)
              .map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  Extra items for roles of {d.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <Box flex={1} />
        {changed.length > 0 && (
          <Typography variant="body2" color="warning.main">
            {changed.length} column{changed.length === 1 ? "" : "s"} changed
          </Typography>
        )}
        <Button variant="contained" startIcon={<SaveIcon />} disabled={!changed.length || saving} onClick={save}>
          Save changes
        </Button>
      </Box>
      {roleDept && (
        <Alert severity="info" sx={{ mb: 2 }}>
          A role gets everything its department has (ticked and greyed out) plus what you tick here, e.g. the Quality Engineer also opens the NABL Scope.
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: "65vh" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, minWidth: 200, bgcolor: "background.paper" }}>Menu item</TableCell>
              {columns.map((c) => (
                <TableCell key={c.id} align="center" sx={{ fontWeight: 700, minWidth: 96, bgcolor: "background.paper", lineHeight: 1.2 }}>
                  {c.name}
                  {draft[keyOf(c.type, c.id)] && (
                    <Typography variant="caption" color="warning.main" display="block">
                      changed
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {MENU_GROUPS.map((g) => (
              <GroupRows key={g.id} group={g} columns={columns} menusOf={menusOf} toggle={toggle} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function GroupRows({ group, columns, menusOf, toggle }) {
  const items = MENU_ITEMS.filter((i) => i.group === group.id);
  return (
    <>
      <TableRow>
        <TableCell colSpan={columns.length + 1} sx={{ bgcolor: "action.hover", py: 0.5 }}>
          <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {group.label}
          </Typography>
        </TableCell>
      </TableRow>
      {items.map((item) => (
        <TableRow key={item.key} hover>
          <TableCell>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ color: "text.secondary", display: "flex", "& svg": { fontSize: 18 } }}>{item.icon}</Box>
              {item.label}
            </Box>
          </TableCell>
          {columns.map((c) => {
            if (c.admin) {
              return (
                <TableCell key={c.id} align="center">
                  <Tooltip title="Administration always has everything">
                    <span>
                      <Checkbox size="small" checked disabled />
                    </span>
                  </Tooltip>
                </TableCell>
              );
            }
            const inherited = c.inherited?.includes(item.key);
            return (
              <TableCell key={c.id} align="center">
                <Tooltip title={inherited ? "From the department" : ""}>
                  <span>
                    <Checkbox size="small" checked={inherited || menusOf(c).includes(item.key)} disabled={inherited} onChange={() => toggle(c, item.key)} />
                  </span>
                </Tooltip>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
