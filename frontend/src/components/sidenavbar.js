import { useContext, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import {
  Avatar,
  Popover,
  SvgIcon,
  Tooltip,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
} from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";
import UserProfile from "../LoginRegister/UserProfile";
import { UserContext } from "../Pages/UserContext";
import NotificationDialog from "./NotificationDialog";
import HelpButton from "./help/HelpButton";
import { MENU_GROUPS, visibleMenu } from "../Pages/menuCatalog";
import Badge from "@mui/material/Badge";
import useReportsCount from "../JC/ReportWorkflow/useReportsCount";

// ─── Layout constants ─────────────────────────────────────────────────────────

const DRAWER_OPEN_WIDTH = 220;
const DRAWER_CLOSED_WIDTH = 57;

const openedMixin = (theme) => ({
  width: DRAWER_OPEN_WIDTH,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `${DRAWER_CLOSED_WIDTH}px`,
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_OPEN_WIDTH,
    width: `calc(100% - ${DRAWER_OPEN_WIDTH}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: DRAWER_OPEN_WIDTH,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

// The menu items, their groups and who may open them: Pages/menuCatalog.jsx and
// Users & Access (Backend access/accessControl.js). Each group's gradient id:
const gradientOf = (id) => `grp_${id}_grad`;
const itemGradientOf = (key) => `item_${key}_grad`;

const DEFAULT_GROUP_OPEN = MENU_GROUPS.reduce(
  (acc, g) => ({ ...acc, [g.id]: true }),
  {},
);

function loadGroupState() {
  try {
    const saved = localStorage.getItem("labbee_sidebar_groups");
    return saved
      ? { ...DEFAULT_GROUP_OPEN, ...JSON.parse(saved) }
      : DEFAULT_GROUP_OPEN;
  } catch {
    return DEFAULT_GROUP_OPEN;
  }
}

// ─── Gradient icon wrapper ────────────────────────────────────────────────────
// Wraps a MUI icon inside an outer SvgIcon that injects gradient defs.
// The CSS selector targets the inner .MuiSvgIcon-root to apply the fill.

function GradientIcon({ children, gradientId }) {
  return (
    <SvgIcon sx={{ "& .MuiSvgIcon-root": { fill: `url(#${gradientId})` } }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#62cff4", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#2c67f2", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      {children}
    </SvgIcon>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SidenavigationBar() {
  const theme = useTheme();
  const { loggedInUser, access } = useContext(UserContext);
  // TS1 reports waiting on this user (badge on the Reports menu)
  const reportsWaiting = useReportsCount(!!access?.menus?.includes("ts1_reports"));

  const location = useLocation();

  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem("labbee_sidebar_open") === "true";
    } catch {
      return false;
    }
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [groupOpen, setGroupOpen] = useState(loadGroupState);

  // Derive margin directly from open — eliminates any sync issues
  const leftmargin = open ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH;

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleClickAvatar = (e) => setAnchorEl(e.currentTarget);
  const handleCloseAvatar = () => setAnchorEl(null);
  const isOpenUserProfileWindow = Boolean(anchorEl);

  const openDrawer = () => {
    setOpen(true);
    try {
      localStorage.setItem("labbee_sidebar_open", "true");
    } catch {}
  };
  const closeDrawer = () => {
    setOpen(false);
    try {
      localStorage.setItem("labbee_sidebar_open", "false");
    } catch {}
  };
  const toggleDrawer = () => (open ? closeDrawer() : openDrawer());

  const toggleGroup = (groupId) => {
    setGroupOpen((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem("labbee_sidebar_groups", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Clicking a group icon in collapsed mode: open drawer + ensure group is expanded
  const handleCollapsedGroupClick = (groupId) => {
    openDrawer();
    setGroupOpen((prev) => {
      const next = { ...prev, [groupId]: true };
      try {
        localStorage.setItem("labbee_sidebar_groups", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // ─── What this user may open (their department's group first) ────────────

  const visibleGroups = visibleMenu(access).map((g) => ({
    ...g,
    gradientId: gradientOf(g.id),
    visibleItems: g.items.map((item) => ({ ...item, i: item.key, gradientId: itemGradientOf(item.key) })),
  }));
  const filteredItems = visibleGroups.flatMap((g) => g.visibleItems);

  // ─── Render helpers ──────────────────────────────────────────────────────

  const iconSx = {
    minWidth: 0,
    mr: open ? 1.5 : "auto",
    display: "flex",
    alignItems: "center",
  };

  // Individual nav item (used inside open groups)
  const renderNavItem = (item) => (
    <Tooltip
      key={item.i}
      title={item.label}
      placement="right"
      arrow
      disableHoverListener={open}
    >
      <ListItem disablePadding sx={{ display: "block" }}>
        <ListItemButton
          component={Link}
          to={item.path}
          selected={location.pathname === item.path}
          sx={{
            "minHeight": 38,
            "pl": 3,
            "py": 0.5,
            "borderRadius": "0 20px 20px 0",
            "mr": 1,
            "&.Mui-selected": {
              "backgroundColor": "rgba(15,108,189,0.12)",
              "&:hover": { backgroundColor: "rgba(15,108,189,0.18)" },
            },
          }}
        >
          <ListItemIcon sx={iconSx}>
            <Badge
              color={reportsWaiting.overdue ? "error" : "primary"}
              badgeContent={item.key === "ts1_reports" ? reportsWaiting.count : 0}
              max={99}
            >
              <GradientIcon gradientId={item.gradientId}>
                {item.icon}
              </GradientIcon>
            </Badge>
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: "13px",
              fontWeight: 500,
              color: location.pathname === item.path ? "#0f6cbd" : "#333",
              noWrap: true,
            }}
          />
        </ListItemButton>
      </ListItem>
    </Tooltip>
  );

  // Group header row (open mode)
  const renderGroupHeader = (group) => (
    <ListItem key={`hdr-${group.id}`} disablePadding sx={{ display: "block" }}>
      <ListItemButton
        onClick={() => toggleGroup(group.id)}
        sx={{
          minHeight: 34,
          pl: 1.5,
          py: 0.4,
          mt: 0.5,
        }}
      >
        <ListItemIcon
          sx={{ minWidth: 0, mr: 1.5, display: "flex", alignItems: "center" }}
        >
          <GradientIcon gradientId={group.gradientId}>
            {group.icon}
          </GradientIcon>
        </ListItemIcon>
        <ListItemText
          primary={group.label}
          primaryTypographyProps={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#0f6cbd",
            noWrap: true,
          }}
        />
        {groupOpen[group.id] ? (
          <ExpandLessIcon
            sx={{ fontSize: 16, color: "#0f6cbd", flexShrink: 0 }}
          />
        ) : (
          <ExpandMoreIcon
            sx={{ fontSize: 16, color: "#0f6cbd", flexShrink: 0 }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  // Group icon in collapsed mode — clicking opens drawer + expands group
  const renderCollapsedGroupIcon = (group) => (
    <Tooltip
      key={`col-${group.id}`}
      title={group.label}
      placement="right"
      arrow
    >
      <ListItem disablePadding sx={{ display: "block" }}>
        <ListItemButton
          onClick={() => handleCollapsedGroupClick(group.id)}
          sx={{
            "minHeight": 44,
            "justifyContent": "center",
            "px": 1,
            "borderRadius": "0 20px 20px 0",
            "mr": 1,
            "&:hover": { backgroundColor: "rgba(15,108,189,0.1)" },
          }}
        >
          <GradientIcon gradientId={group.gradientId}>
            {group.icon}
          </GradientIcon>
        </ListItemButton>
      </ListItem>
    </Tooltip>
  );

  return (
    <>
      <Box
        sx={{
          paddingLeft: isMobile ? 0 : `${leftmargin}px`,
          paddingBottom: isMobile ? "70px" : 0,
          transition: "padding-left 0.2s ease-in-out",
        }}
      >
        <CssBaseline />

        {/* ── App bar ──────────────────────────────────────────────────────── */}
        <AppBar
          position="fixed"
          open={open}
          elevation={1}
          sx={{
            backgroundColor: "#0f6cbd",
            height: "64px",
            ...(isMobile && { width: "100%", marginLeft: 0 }),
          }}
        >
          <Toolbar>
            {!isMobile && (
              <IconButton
                aria-label="toggle drawer"
                onClick={toggleDrawer}
                edge="start"
              >
                <MenuIcon sx={{ color: "white" }} />
              </IconButton>
            )}
            <Typography
              variant="h6"
              noWrap
              component="div"
              color="white"
              sx={{ fontWeight: 700, letterSpacing: "0.04em" }}
            >
              Lab Bee
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <HelpButton />
            <NotificationDialog />
            <IconButton onClick={handleClickAvatar}>
              <Avatar sx={{ backgroundColor: "#ff3333", fontWeight: 700 }}>
                {loggedInUser.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Popover
              open={isOpenUserProfileWindow}
              anchorEl={anchorEl}
              onClose={handleCloseAvatar}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <UserProfile
                userAvatar={loggedInUser.charAt(0).toUpperCase()}
                userName={loggedInUser}
              />
            </Popover>
          </Toolbar>
        </AppBar>

        {/* ── Desktop drawer ───────────────────────────────────────────────── */}
        {!isMobile && (
          <Drawer variant="permanent" open={open}>
            <DrawerHeader>
              <IconButton onClick={closeDrawer}>
                {theme.direction === "rtl" ? (
                  <ChevronRightIcon />
                ) : (
                  <ChevronLeftIcon />
                )}
              </IconButton>
            </DrawerHeader>

            {open ? (
              // ── OPEN: grouped collapsible view ──────────────────────────
              visibleGroups.map((group, idx) => (
                <Box key={group.id}>
                  {idx > 0 && (
                    <Divider
                      sx={{
                        mx: 1.5,
                        my: 0.5,
                        borderColor: "rgba(15,108,189,0.15)",
                      }}
                    />
                  )}
                  {renderGroupHeader(group)}
                  <Collapse
                    in={groupOpen[group.id]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <Box sx={{ pb: 0.5 }}>
                      {group.visibleItems.map(renderNavItem)}
                    </Box>
                  </Collapse>
                </Box>
              ))
            ) : (
              // ── CLOSED: one icon per group ──────────────────────────────
              <>
                <Box sx={{ mt: 0.5 }} />
                {visibleGroups.map((group, idx) => (
                  <Box key={group.id}>
                    {idx > 0 && (
                      <Divider
                        sx={{
                          mx: 1,
                          my: 0.5,
                          borderColor: "rgba(15,108,189,0.15)",
                        }}
                      />
                    )}
                    {renderCollapsedGroupIcon(group)}
                  </Box>
                ))}
              </>
            )}
          </Drawer>
        )}

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
          <Box sx={{ height: 50 }} />
          <Outlet />
        </Box>

        {/* ── Mobile bottom navigation (flat, unchanged) ───────────────────── */}
        {isMobile && (
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
            }}
            elevation={3}
          >
            <BottomNavigation
              showLabels
              value={location.pathname}
              sx={{
                "height": 70,
                "overflowX": "auto",
                "justifyContent":
                  filteredItems.length > 4 ? "flex-start" : "center",
                "& .MuiBottomNavigationAction-root": {
                  "minWidth": "auto",
                  "padding": "10px 16px",
                  "color": "#5f6368",
                  "&.Mui-selected": { color: "#0f6cbd", paddingTop: "12px" },
                },
                "&::-webkit-scrollbar": { display: "none" },
                "scrollbarWidth": "none",
                "-ms-overflow-style": "none",
              }}
            >
              {filteredItems.map((item) => (
                <BottomNavigationAction
                  key={item.i}
                  label={item.label}
                  icon={
                    <GradientIcon gradientId={`${item.gradientId}_mob`}>
                      {item.icon}
                    </GradientIcon>
                  }
                  component={Link}
                  to={item.path}
                  value={item.path}
                />
              ))}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </>
  );
}
