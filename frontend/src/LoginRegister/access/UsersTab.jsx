import { useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyIcon from "@mui/icons-material/Key";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../../Pages/APIPage";
import ConfirmationDialog from "../../common/ConfirmationDialog";

const PASSWORD_RE = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
const PASSWORD_RULE = "8-15 characters with an upper case letter, a lower case letter, a digit and a special character";
const errorOf = (err, fallback) => err?.response?.data?.message || err?.response?.data?.error || fallback;
const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const EMPTY = { name: "", email: "", password: "", department: "", role: "", user_status: "Enable" };

/** Add / edit a user */
function UserDialog({ user, departments, onClose, onSaved }) {
  const isNew = !user.id;
  const [form, setForm] = useState({ ...EMPTY, ...user, password: "", user_status: user.user_status || "Enable" });
  const [saving, setSaving] = useState(false);
  const roles = departments.find((d) => d.name === form.department)?.roles || [];
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error("Name and email are required");
    if (isNew && !PASSWORD_RE.test(form.password)) return toast.error(`Password: ${PASSWORD_RULE}`);
    if (!form.department || !form.role) return toast.error("Choose the department and role");
    setSaving(true);
    try {
      const body = { name: form.name, email: form.email, department: form.department, role: form.role, user_status: form.user_status };
      const res = isNew
        ? await axios.post(`${serverBaseAddress}/api/admin/users`, { ...body, password: form.password })
        : await axios.post(`${serverBaseAddress}/api/addUser/${user.id}`, body);
      toast.success(isNew ? "User added" : res.data.sessions_ended ? "Saved - they will log in again with the new access" : "Saved");
      onSaved();
    } catch (err) {
      toast.error(errorOf(err, "Could not save the user"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{isNew ? "Add user" : user.department ? `Edit ${user.name}` : `Approve ${user.name}`}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <TextField label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} fullWidth autoFocus />
          <TextField label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} fullWidth />
          {isNew && (
            <TextField
              label="Password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              helperText={PASSWORD_RULE}
              error={!!form.password && !PASSWORD_RE.test(form.password)}
              fullWidth
            />
          )}
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={form.department || ""} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value, role: "" }))}>
              {departments.map((d) => (
                <MenuItem key={d.name} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!form.department}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roles.includes(form.role) ? form.role : ""} onChange={(e) => set("role", e.target.value)}>
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={form.user_status === "Enable"} onChange={(e) => set("user_status", e.target.checked ? "Enable" : "Disable")} />}
            label={form.user_status === "Enable" ? "Enabled - can log in" : "Disabled - can't log in"}
          />
          {!isNew && (
            <Typography variant="caption" color="text.secondary">
              Changing the department, role, status or email logs the user out, so the new access applies at once.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {isNew ? "Add user" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Set a new password for a user */
function PasswordDialog({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!PASSWORD_RE.test(password)) return toast.error(`Password: ${PASSWORD_RULE}`);
    setSaving(true);
    try {
      await axios.post(`${serverBaseAddress}/api/admin/users/${user.id}/password`, { password });
      toast.success(`New password set for ${user.name}`);
      onClose();
    } catch (err) {
      toast.error(errorOf(err, "Could not set the password"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onClose={() => !saving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>New password for {user.name}</DialogTitle>
      <DialogContent>
        <TextField
          sx={{ mt: 1 }}
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText={`${PASSWORD_RULE}. They are logged out everywhere.`}
          error={!!password && !PASSWORD_RE.test(password)}
          fullWidth
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          Set password
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UsersTab({ users, departments, myId, reload }) {
  const [dept, setDept] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [passwordFor, setPasswordFor] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: "delete"|"logout", user }

  const waiting = users.filter((u) => !u.department || !u.role);
  const counts = useMemo(() => {
    const m = new Map();
    for (const u of users) if (u.department) m.set(u.department, (m.get(u.department) || 0) + 1);
    return m;
  }, [users]);

  const shown = users.filter((u) => {
    if (dept !== "all" && (dept === "waiting" ? u.department && u.role : u.department !== dept)) return false;
    const q = search.trim().toLowerCase();
    return !q || [u.name, u.email, u.department, u.role].some((v) => String(v || "").toLowerCase().includes(q));
  });

  const runConfirmed = async () => {
    const { kind, user } = confirm;
    try {
      if (kind === "delete") {
        await axios.delete(`${serverBaseAddress}/api/deleteUser/${user.id}`);
        toast.success(`${user.name} removed`);
        reload();
      } else {
        const res = await axios.post(`${serverBaseAddress}/api/revokeUserSessions`, { user_id: user.id });
        toast.success(`${user.name} logged out (${res.data.sessionsRevoked} session(s))`);
      }
    } catch (err) {
      toast.error(errorOf(err, "Something went wrong"));
    }
    setConfirm(null);
  };

  return (
    <Box>
      {waiting.length > 0 && (
        <Alert
          severity="warning"
          icon={<HowToRegIcon />}
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setDept("waiting")}>
              Show
            </Button>
          }
        >
          {waiting.length} new sign-up{waiting.length === 1 ? "" : "s"} waiting: give them a department and role, and enable them.
        </Alert>
      )}

      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Search name, email, role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240, flex: "1 1 240px", maxWidth: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Box flex={1} />
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setEditing({})}>
          Add user
        </Button>
      </Box>

      <Stack direction="row" gap={0.75} flexWrap="wrap" mb={2}>
        <Chip label={`All (${users.length})`} color={dept === "all" ? "primary" : "default"} onClick={() => setDept("all")} />
        {waiting.length > 0 && (
          <Chip label={`Waiting (${waiting.length})`} color={dept === "waiting" ? "warning" : "default"} onClick={() => setDept("waiting")} />
        )}
        {departments.map((d) => (
          <Chip
            key={d.name}
            label={`${d.name} (${counts.get(d.name) || 0})`}
            color={dept === d.name ? "primary" : "default"}
            variant={counts.get(d.name) ? "filled" : "outlined"}
            onClick={() => setDept(d.name)}
          />
        ))}
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700, bgcolor: "action.hover" } }}>
              <TableCell>User</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No users here
                </TableCell>
              </TableRow>
            )}
            {shown.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: u.user_status === "Enable" ? "primary.main" : "grey.400" }}>
                      {initials(u.name)}
                    </Avatar>
                    <Box minWidth={0}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {u.name}
                        {u.id === myId && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {" "}
                            (you)
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {u.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{u.department || <Chip size="small" color="warning" label="Not set" />}</TableCell>
                <TableCell>{u.role || "–"}</TableCell>
                <TableCell>
                  <Chip size="small" color={u.user_status === "Enable" ? "success" : "default"} label={u.user_status === "Enable" ? "Enabled" : "Disabled"} />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Tooltip title={u.department ? "Edit" : "Approve: department, role, enable"}>
                    <IconButton size="small" onClick={() => setEditing(u)}>
                      {u.department ? <EditIcon fontSize="small" /> : <HowToRegIcon fontSize="small" color="warning" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Set a new password">
                    <IconButton size="small" onClick={() => setPasswordFor(u)}>
                      <KeyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Log out everywhere">
                    <IconButton size="small" onClick={() => setConfirm({ kind: "logout", user: u })}>
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={u.id === myId ? "You can't delete yourself" : "Delete"}>
                    <span>
                      <IconButton size="small" disabled={u.id === myId} onClick={() => setConfirm({ kind: "delete", user: u })}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editing && (
        <UserDialog
          user={editing}
          departments={departments}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {passwordFor && <PasswordDialog user={passwordFor} onClose={() => setPasswordFor(null)} />}
      {confirm && (
        <ConfirmationDialog
          open
          onClose={() => setConfirm(null)}
          onConfirm={runConfirmed}
          dialogTitle={confirm.kind === "delete" ? "Delete user" : "Log out everywhere"}
          contentText={
            confirm.kind === "delete"
              ? `Delete ${confirm.user.name}? To keep their history, you can disable the account instead.`
              : `Log ${confirm.user.name} out on all devices?`
          }
        />
      )}
    </Box>
  );
}
