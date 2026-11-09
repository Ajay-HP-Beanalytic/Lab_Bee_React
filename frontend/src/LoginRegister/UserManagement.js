import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Card, CircularProgress, Grid, Tab, Tabs, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import ApartmentIcon from "@mui/icons-material/Apartment";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import DataBackup from "../Pages/DataBackup";
import UsersTab from "./access/UsersTab";
import DepartmentsTab from "./access/DepartmentsTab";
import MenuAccessTab from "./access/MenuAccessTab";

// Users & Access (Administration): users, departments and roles, and which side-menu
// items each may open. The rules are kept in the backend (access/accessControl.js).
export default function UserManagement() {
  const { access, loggedInUserId, refreshAccess } = useContext(UserContext);
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem("labbee_access_tab") || "users";
    } catch {
      return "users";
    }
  });
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [u, c] = await Promise.all([axios.get(`${serverBaseAddress}/api/getAllUsers`), axios.get(`${serverBaseAddress}/api/access/config`)]);
      setUsers(u.data);
      setConfig(c.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Could not load the users");
    }
  }, []);

  useEffect(() => {
    if (access?.isAdmin) load();
  }, [access?.isAdmin, load]);

  // A change to the departments / menus may change the admin's own menu too
  const updateConfig = (c) => {
    setConfig(c);
    refreshAccess();
  };

  const chooseTab = (_, t) => {
    setTab(t);
    try {
      localStorage.setItem("labbee_access_tab", t);
    } catch {}
  };

  if (access && !access.isAdmin) {
    return <Alert severity="warning">Only Administration can manage users and access.</Alert>;
  }

  return (
    <>
      <Box display="flex" alignItems="baseline" gap={2} mb={1} flexWrap="wrap">
        <Typography variant="h5" fontWeight={700} color="#003366">
          Users &amp; Access
        </Typography>
        {config && (
          <Typography variant="body2" color="text.secondary">
            {users.filter((u) => u.user_status === "Enable").length} active users · {config.departments.length} departments
          </Typography>
        )}
      </Box>
      <Card variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Tabs value={tab} onChange={chooseTab} sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }} variant="scrollable" allowScrollButtonsMobile>
          <Tab value="users" icon={<PeopleIcon />} iconPosition="start" label="Users" />
          <Tab value="departments" icon={<ApartmentIcon />} iconPosition="start" label="Departments & Roles" />
          <Tab value="menus" icon={<MenuOpenIcon />} iconPosition="start" label="Menu Access" />
        </Tabs>
        {error && <Alert severity="error">{error}</Alert>}
        {!config && !error && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}
        {config && tab === "users" && (
          <UsersTab
            users={users}
            departments={config.departments.map((d) => ({ name: d.name, roles: d.roles.map((r) => r.name) }))}
            myId={Number(loggedInUserId)}
            reload={load}
          />
        )}
        {config && tab === "departments" && <DepartmentsTab config={config} setConfig={updateConfig} />}
        {config && tab === "menus" && <MenuAccessTab config={config} setConfig={updateConfig} />}
      </Card>

      <Grid container justifyContent="center" sx={{ mt: "10px" }}>
        <Grid item>
          <DataBackup />
        </Grid>
      </Grid>
    </>
  );
}
