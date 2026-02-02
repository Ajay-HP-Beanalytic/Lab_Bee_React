// Here we are using "Mini variant drawer" to create a side navigation bar:

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
import CalculateIcon from "@mui/icons-material/Calculate";

import { Avatar, Popover, SvgIcon, Tooltip } from "@mui/material";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthSharpIcon from "@mui/icons-material/CalendarMonthSharp";
import ArticleIcon from "@mui/icons-material/Article";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import KitchenIcon from "@mui/icons-material/Kitchen";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { Link, Outlet } from "react-router-dom";

import UserProfile from "../LoginRegister/UserProfile";

// import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import { Source } from "@mui/icons-material";
import NotificationDialog from "./NotificationDialog";

const drawerWidth = 200;

const openedMixin = (theme) => ({
  width: drawerWidth,
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
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
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
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
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

export default function SidenavigationBar() {
  const theme = useTheme();

  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } =
    useContext(UserContext);

  const [open, setOpen] = useState(false); // "true" to keep open, and "false" is for keep it closed

  //States and functions to handle the onclick events on Avatar:
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickAvatar = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseAvatar = () => {
    setAnchorEl(null);
  };

  const isOpenUserProfileWindow = Boolean(anchorEl);
  const userProfileWindowId = isOpenUserProfileWindow
    ? "user-profile-window-popover"
    : undefined;

  // To highlight the selected or clicked buton
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  // Create avatar texts to display in the sidebar
  const firstLetter = loggedInUser.charAt(0).toUpperCase();
  const userAvatar = firstLetter;

  const GradientIcon = ({ children, gradientId }) => (
    <SvgIcon
      sx={{
        "& .MuiSvgIcon-root": {
          fill: `url(#${gradientId})`,
        },
      }}
    >
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

  const items = [
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
      label: "EMI/EMC JC Dashboard",
      icon: <DashboardIcon />,
      path: "/emi_jc_dashboard",
      gradientId: "emiDashboardGradient",
    },

    {
      i: 10,
      label: "EMI/EMC Slot Booking",
      icon: <CalendarMonthSharpIcon />,
      path: "/emi_slot_booking",
      gradientId: "emiSlotBookingGradient",
    },
    {
      i: 11,
      label: "EMI/EMC Calibration",
      icon: <KitchenIcon />,
      path: "/emi_calibration",
      gradientId: "emiChamberCalibrationGradient",
    },
    {
      i: 12,
      label: "Project Management",
      icon: <EventRepeatIcon />,
      // icon: (
      //   <img
      //     src="/images/project-management.png"
      //     alt="Project Management"
      //     style={{ width: 24, height: 24 }}
      //   />
      // ),
      path: "/projects",
      gradientId: "projectManagementGradient",
    },
    {
      i: 13,
      label: "Organisation Documents",
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
  ];

  const filteredItems = items.filter((item) => {
    if (loggedInUserDepartment === "Administration") {
      return true; // Show all items for Administration
    } else if (loggedInUserDepartment === "Accounts") {
      return [1, 2, 3, 4, 5, 6, 8, 9, 10].includes(item.i);
    } else if (loggedInUserDepartment === "Marketing") {
      return [2, 3, 8, 9, 10].includes(item.i);
    } else if (loggedInUserDepartment === "TS1 Testing") {
      return [4, 5, 6, 7, 8].includes(item.i);
    } else if (
      loggedInUserRole === "Reports & Scrutiny Manager" ||
      loggedInUserRole === "Technical Support Writer"
    ) {
      return [4, 5, 6, 7, 8, 9, 11].includes(item.i);
    } else if (
      loggedInUserDepartment === "Reliability" ||
      loggedInUserDepartment === "Software"
    ) {
      return [12].includes(item.i);
    } else if (loggedInUserDepartment === "TS2 Testing") {
      return [9, 10, 11].includes(item.i);
    } else if (loggedInUserRole === "Quality Engineer") {
      return [4, 6, 7, 8, 9, 10, 11, 13].includes(item.i);
    }
    return false; // Default: Hide the item
  });

  const [leftmargin, setLeftMargin] = useState(70);

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuToggle = () => {
    setOpen(!open);
    setLeftMargin(open ? 70 : 200);
  };

  function MenuItem({ item, index }) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
        <ListItem
          disablePadding
          sx={{ display: "block" }}
          as={Link}
          to={item.path}
        >
          <ListItemButton
            selected={selectedIndex === index}
            onClick={(event) => handleListItemClick(event, index)}
            sx={{
              display: "flex",
              alignItems: "left",
              minHeight: 48,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 1 : "auto",
                color: "hsl(216, 100%, 40%)",
              }}
            >
              {/* {item.icon} */}
              <GradientIcon gradientId={item.gradientId}>
                {item.icon}
              </GradientIcon>
            </ListItemIcon>

            <ListItemText
              primary={
                <span
                  style={{
                    fontFamily: "Roboto-Bold",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  {item.label}
                </span>
              }
              sx={{ opacity: open ? 1 : 0, color: "black" }}
            />
          </ListItemButton>
        </ListItem>
      </Tooltip>
    );
  }

  return (
    <>
      <Box
        sx={{ paddingLeft: `${leftmargin}px`, transition: "0.2s ease-in-out" }}
      >
        <CssBaseline />

        {/* To cutomize the top header or the app bar */}
        <AppBar
          position="fixed"
          elevation={1}
          sx={{ backgroundColor: "#0f6cbd", color: "#2f2f2f", height: "64px" }}
        >
          <Toolbar>
            <IconButton
              aria-label="open drawer"
              onClick={handleMenuToggle}
              edge="start"
            >
              <MenuIcon sx={{ color: "white" }} />
            </IconButton>

            <Typography variant="h6" noWrap component="div" color={"white"}>
              Lab Bee
            </Typography>

            {/* Add the box with flexGrow which will acts as a spacer item */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Notifications component */}
            <NotificationDialog />

            {/* Avatar/Profile component */}
            <IconButton onClick={handleClickAvatar}>
              <Avatar sx={{ backgroundColor: "#ff3333" }}>{userAvatar}</Avatar>
            </IconButton>

            <Popover
              id={userProfileWindowId}
              open={isOpenUserProfileWindow}
              anchorEl={anchorEl}
              onClose={handleCloseAvatar}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <UserProfile userAvatar={userAvatar} userName={loggedInUser} />
            </Popover>
          </Toolbar>
        </AppBar>

        <Drawer variant="permanent" open={open}>
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "rtl" ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          </DrawerHeader>

          {filteredItems.map((item) => (
            <MenuItem key={item.i} item={item} index={item.i} />
          ))}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
          <Box
            sx={{
              height: 50,
              marginTop: 0,
              paddingTop: 0,
            }}
          />
          <Outlet />
        </Box>
      </Box>
    </>
  );
}
