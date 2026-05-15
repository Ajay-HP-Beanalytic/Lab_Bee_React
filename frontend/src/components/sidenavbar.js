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

import CalculateIcon from "@mui/icons-material/Calculate";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthSharpIcon from "@mui/icons-material/CalendarMonthSharp";
import ArticleIcon from "@mui/icons-material/Article";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import KitchenIcon from "@mui/icons-material/Kitchen";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ScienceIcon from "@mui/icons-material/Science";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

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
import { Source } from "@mui/icons-material";
import NotificationDialog from "./NotificationDialog";

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

// ─── Navigation data ──────────────────────────────────────────────────────────

const ALL_ITEMS = [
  {
    i: 1,
    label: "Home",
    icon: <HomeIcon />,
    path: "/home",
    gradientId: "homeGradient",
  },
  {
    i: 2,
    label: "Quotation",
    icon: <CurrencyRupeeIcon />,
    path: "/quotation_dashboard",
    gradientId: "quotationDashboardGradient",
  },
  {
    i: 3,
    label: "Quotation Essentials",
    icon: <NoteAddIcon />,
    path: "/quotation_essentials",
    gradientId: "quotationEssentialsGradient",
  },
  {
    i: 4,
    label: "Job-Card",
    icon: <ArticleIcon />,
    path: "/jobcard_dashboard",
    gradientId: "jcDashboardGradient",
  },
  {
    i: 5,
    label: "JC Essentials",
    icon: <NoteAddIcon />,
    path: "/jobcard_essentials",
    gradientId: "jcEssentialsGradient",
  },
  {
    i: 6,
    label: "Slot Booking",
    icon: <CalendarMonthSharpIcon />,
    path: "/slot_booking",
    gradientId: "slotBookingGradient",
  },
  {
    i: 7,
    label: "Chambers & Calibration",
    icon: <KitchenIcon />,
    path: "/chamber-calibration",
    gradientId: "chambersCalibrationGradient",
  },
  {
    i: 8,
    label: "Hours Calculation",
    icon: <CalculateIcon />,
    path: "/ts1_utitlity",
    gradientId: "hoursCalculationGradient",
  },
  {
    i: 9,
    label: "Job-Card",
    icon: <DashboardIcon />,
    path: "/emi_jc_dashboard",
    gradientId: "emiDashboardGradient",
  },
  {
    i: 10,
    label: "Slot Booking",
    icon: <CalendarMonthSharpIcon />,
    path: "/emi_slot_booking",
    gradientId: "emiSlotBookingGradient",
  },
  {
    i: 11,
    label: "Calibration Dashboard",
    icon: <KitchenIcon />,
    path: "/emi_calibration",
    gradientId: "emiChamberCalibrationGradient",
  },
  {
    i: 12,
    label: "Project Management",
    icon: <EventRepeatIcon />,
    path: "/projects",
    gradientId: "projectManagementGradient",
  },
  {
    i: 13,
    label: "Org Documents",
    icon: <Source />,
    path: "/org_docs",
    gradientId: "orgDocsGradient",
  },
  {
    i: 14,
    label: "Users Management",
    icon: <ManageAccountsIcon />,
    path: "/user_management",
    gradientId: "usersManagementGradient",
  },
  {
    i: 15,
    label: "Marketing Content",
    icon: <NewspaperIcon />,
    path: "/marketing",
    gradientId: "marketingGradient",
  },
  {
    i: 16,
    label: "Chamber Specs",
    icon: <TuneIcon />,
    path: "/ts1_chamber_specs",
    gradientId: "chamberSpecsGradient",
  },
  {
    i: 17,
    label: "Test Pricing",
    icon: <CurrencyRupeeIcon />,
    path: "/ts1_test_pricing",
    gradientId: "testPricingGradient",
  },
];

const GROUPS = [
  {
    id: "Finance",
    label: "Finance",
    icon: <AccountBalanceIcon />,
    gradientId: "grpFinanceGrad",
    itemIds: [1, 2, 3, 17],
  },
  {
    id: "TS1 Testing",
    label: "TS1 Testing",
    icon: <ScienceIcon />,
    gradientId: "grpTS1Grad",
    itemIds: [4, 5, 6, 7, 8, 16],
  },
  {
    id: "TS2 Testing",
    label: "TS2 Testing",
    icon: <ElectricBoltIcon />,
    gradientId: "grpTS2Grad",
    itemIds: [9, 10, 11],
  },
  {
    id: "Projects",
    label: "Projects",
    icon: <FolderOpenIcon />,
    gradientId: "grpProjectsGrad",
    itemIds: [12],
  },
  {
    id: "Administration",
    label: "Administration",
    icon: <AdminPanelSettingsIcon />,
    gradientId: "grpAdminGrad",
    itemIds: [13, 14, 15],
  },
];

const ACCESS_RULES = {
  "Accounts": [1, 2, 3, 4, 5, 6, 8, 9, 10, 17],
  "Marketing": [2, 3, 8, 9, 10],
  "TS1 Testing": [4, 5, 6, 7, 8, 16],
  "TS2 Testing": [9, 10, 11],
  "Reliability": [12],
  "Software": [12],
  "Reports & Scrutiny": [4, 5, 6, 7, 8, 9, 11],
  "Reports & Scrutiny Manager": [4, 5, 6, 7, 8, 9, 11],
  "Technical Support Writer": [4, 5, 6, 7, 8, 9, 11],
  "Quality Engineer": [4, 6, 7, 8, 9, 10, 11, 13],
};

const DEFAULT_GROUP_OPEN = GROUPS.reduce(
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
  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } =
    useContext(UserContext);

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

  // ─── Permission filtering ────────────────────────────────────────────────

  const allowedIds = (() => {
    if (loggedInUserDepartment === "Administration") return null;
    const byRole = ACCESS_RULES[loggedInUserRole] || [];
    const byDept = ACCESS_RULES[loggedInUserDepartment] || [];
    const ids = new Set([...byRole, ...byDept]);
    return ids.size > 0 ? ids : new Set();
  })();

  const isAllowed = (i) => allowedIds === null || allowedIds.has(i);

  const filteredItems = ALL_ITEMS.filter((item) => isAllowed(item.i));

  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    visibleItems: group.itemIds
      .map((id) => ALL_ITEMS.find((item) => item.i === id))
      .filter((item) => item && isAllowed(item.i)),
  })).filter((g) => g.visibleItems.length > 0);

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
            <GradientIcon gradientId={item.gradientId}>
              {item.icon}
            </GradientIcon>
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
