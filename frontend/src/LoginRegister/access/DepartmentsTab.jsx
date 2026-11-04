import { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import { MENU_GROUPS } from "../../Pages/menuCatalog";
import ConfirmationDialog from "../../common/ConfirmationDialog";

export const SCOPE_LABELS = { all: "All enquiries", TS1: "TS1 enquiries only", TS2: "TS2 enquiries only", none: "No enquiries" };
const errorOf = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || fallback;

/** Add / edit a department: name, description, enquiries seen, quotes, first menu group */
function DepartmentDialog({ dept, onClose, onSaved }) {
  const isNew = !dept.id;
  const [form, setForm] = useState({
    name: dept.name || "",
    description: dept.description || "",
    enquiry_scope: dept.enquiry_scope || "none",
    can_create_quotes: !!dept.can_create_quotes,
    home_group: dept.home_group || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = isNew
        ? await axios.post(`${serverBaseAddress}/api/access/departments`, { ...form, menus: [] })
        : await axios.put(`${serverBaseAddress}/api/access/departments/${dept.id}`, form);
      toast.success(isNew ? `${form.name} added - now choose its menu items in Menu Access` : "Saved");
      onSaved(res.data);
    } catch (err) {
      toast.error(errorOf(err, "Could not save the department"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{isNew ? "Add department" : `Edit ${dept.name}`}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={dept.is_system}
            helperText={dept.is_system ? "Came with Lab Bee: the app uses this name, so it can't be renamed" : ""}
            fullWidth
            autoFocus={isNew}
          />
          <TextField label="Description (optional)" value={form.description} onChange={(e) => set("description", e.target.value)} fullWidth />
          {dept.is_admin ? (
            <Alert severity="info">Administration always sees everything and manages users and access.</Alert>
          ) : (
            <>
              <FormControl fullWidth>
                <InputLabel>Enquiries seen</InputLabel>
                <Select label="Enquiries seen" value={form.enquiry_scope} onChange={(e) => set("enquiry_scope", e.target.value)}>
                  {Object.entries(SCOPE_LABELS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" mt={-1.5}>
                TS1 / TS2 only: plus enquiries whose team is not decided yet, and those assigned to the person.
              </Typography>
              <FormControlLabel
                control={<Switch checked={form.can_create_quotes} onChange={(e) => set("can_create_quotes", e.target.checked)} />}
                label="Creates quotes from enquiries"
              />
            </>
          )}
          <FormControl fullWidth>
            <InputLabel>Menu group shown first</InputLabel>
            <Select label="Menu group shown first" value={form.home_group} onChange={(e) => set("home_group", e.target.value)}>
              <MenuItem value="">Usual order</MenuItem>
              {MENU_GROUPS.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={saving || !form.name.trim()}>
          {isNew ? "Add department" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Add / rename a role */
function RoleDialog({ role, dept, onClose, onSaved }) {
  const isNew = !role.id;
  const [name, setName] = useState(role.name || "");
  const [description, setDescription] = useState(role.description || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const res = isNew
        ? await axios.post(`${serverBaseAddress}/api/access/roles`, { department_id: dept.id, name, description, menus: [] })
        : await axios.put(`${serverBaseAddress}/api/access/roles/${role.id}`, { name, description });
      toast.success(isNew ? `Role ${name} added to ${dept.name}` : "Saved");
      onSaved(res.data);
    } catch (err) {
      toast.error(errorOf(err, "Could not save the role"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{isNew ? `Add a role to ${dept.name}` : `Edit role ${role.name}`}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField
            label="Role name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={role.is_system}
            helperText={role.is_system ? "Came with Lab Bee, so it can't be renamed" : "Renaming also changes it for the users who have it"}
            fullWidth
            autoFocus
          />
          <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={saving || !name.trim()}>
          {isNew ? "Add role" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DepartmentsTab({ config, setConfig }) {
  const [editDept, setEditDept] = useState(null);
  const [editRole, setEditRole] = useState(null); // { role, dept }
  const [confirm, setConfirm] = useState(null); // { kind, item }

  const remove = async () => {
    const { kind, item } = confirm;
    try {
      const res = await axios.delete(`${serverBaseAddress}/api/access/${kind === "department" ? "departments" : "roles"}/${item.id}`);
      setConfig(res.data);
      toast.success(`${item.name} deleted`);
    } catch (err) {
      toast.error(errorOf(err, "Could not delete"));
    }
    setConfirm(null);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2} gap={1} flexWrap="wrap">
        <Typography variant="body2" color="text.secondary" flex={1} minWidth={240}>
          <LockIcon sx={{ fontSize: 14, verticalAlign: "-2px" }} /> marks departments and roles that came with Lab Bee: the app uses their names, so they can't be
          renamed or deleted, but their settings and menus can be changed.
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditDept({})}>
          Add department
        </Button>
      </Box>
      <Grid container spacing={2}>
        {config.departments.map((d) => (
          <Grid item xs={12} md={6} lg={4} key={d.id}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={1}>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {d.is_system && <LockIcon sx={{ fontSize: 15, mr: 0.5, verticalAlign: "-2px" }} color="disabled" />}
                      {d.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {d.users} user{d.users === 1 ? "" : "s"}
                      {d.description ? ` · ${d.description}` : ""}
                    </Typography>
                  </Box>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setEditDept(d)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!d.is_system && (
                    <Tooltip title={d.users ? "Move its users first" : "Delete"}>
                      <span>
                        <IconButton size="small" disabled={d.users > 0} onClick={() => setConfirm({ kind: "department", item: d })}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
                <Stack direction="row" gap={0.5} flexWrap="wrap" my={1}>
                  {d.is_admin ? (
                    <Chip size="small" color="secondary" label="Full access" />
                  ) : (
                    <>
                      <Chip size="small" variant="outlined" label={SCOPE_LABELS[d.enquiry_scope] || d.enquiry_scope} />
                      {d.can_create_quotes && <Chip size="small" color="primary" variant="outlined" label="Creates quotes" />}
                      <Chip size="small" variant="outlined" label={`${d.menus.length} menu item${d.menus.length === 1 ? "" : "s"}`} />
                    </>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Roles
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                  {d.roles.map((r) => (
                    <Chip
                      key={r.id}
                      size="small"
                      label={`${r.name}${r.users ? ` (${r.users})` : ""}`}
                      icon={r.is_system ? <LockIcon sx={{ fontSize: "14px !important" }} /> : undefined}
                      onClick={() => setEditRole({ role: r, dept: d })}
                      onDelete={!r.is_system && !r.users ? () => setConfirm({ kind: "role", item: r }) : undefined}
                    />
                  ))}
                  <Chip size="small" variant="outlined" color="primary" icon={<AddIcon />} label="Add role" onClick={() => setEditRole({ role: {}, dept: d })} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {editDept && (
        <DepartmentDialog
          dept={editDept}
          onClose={() => setEditDept(null)}
          onSaved={(c) => {
            setConfig(c);
            setEditDept(null);
          }}
        />
      )}
      {editRole && (
        <RoleDialog
          role={editRole.role}
          dept={editRole.dept}
          onClose={() => setEditRole(null)}
          onSaved={(c) => {
            setConfig(c);
            setEditRole(null);
          }}
        />
      )}
      {confirm && (
        <ConfirmationDialog
          open
          onClose={() => setConfirm(null)}
          onConfirm={remove}
          dialogTitle={`Delete ${confirm.kind}`}
          contentText={`Delete the ${confirm.kind} "${confirm.item.name}"?`}
        />
      )}
    </Box>
  );
}
