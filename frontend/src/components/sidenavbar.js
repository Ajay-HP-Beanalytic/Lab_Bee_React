// Here we are using "Mini variant drawer" to create a side navigation bar:

import React, { useContext, useEffect, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
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
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Popover,
  Tooltip,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
// import EditNoteIcon from "@mui/icons-material/EditNote";
import CalendarMonthSharpIcon from "@mui/icons-material/CalendarMonthSharp";
import ArticleIcon from "@mui/icons-material/Article";
// import SettingsIcon from "@mui/icons-material/Settings";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import KitchenIcon from "@mui/icons-material/Kitchen";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { Link, Outlet, useNavigate } from "react-router-dom";
// import axios from "axios";

import RobotoBoldFont from "../fonts/Roboto-Bold.ttf";
import UserProfile from "../LoginRegister/UserProfile";

// import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import { NotificationContext } from "../Pages/NotificationContext";

const styles = {
  "@font-face": {
    fontFamily: "Roboto-Bold",
    src: `url(${RobotoBoldFont}) format('truetype')`,
  },
};

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

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);
  const { notifications } = useContext(NotificationContext);

  const [open, setOpen] = useState(false); // "true" to keep open, and "false" is for keep it closed

  const [menudata, setMenudata] = useState("Home");

  //States and functions to handle the onclick events on Avatar:
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  const handleClickAvatar = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseAvatar = () => {
    setAnchorEl(null);
  };

  //Function to open the notification bar:
  const handleClickNotification = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  //Function to close the notification bar:
  const handleClearNotifications = () => {
    notifications.length = 0;
    setNotificationAnchorEl(null);
  };

  //Function to close the notification bar:
  const handleCloseNotification = () => {
    setNotificationAnchorEl(null);
  };

  const isOpenUserProfileWindow = Boolean(anchorEl);
  const userProfileWindowId = isOpenUserProfileWindow
    ? "user-profile-window-popover"
    : undefined;

  const isOpenNotificationWindow = Boolean(notificationAnchorEl);
  const notificationWindowId = isOpenNotificationWindow
    ? "notification-window-popover"
    : undefined;

  // To highlight the selected or clicked buton
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleListItemClick = (event, index) => {
    setSelectedIndex(index);
  };

  // Create avatar texts to display in the sidebar
  const firstLetter = loggedInUser.charAt(0).toUpperCase();
  const userAvatar = firstLetter;

  // Create items to display in the side navigation bar
  const items = [
    { i: 1, label: "Home", icon: <HomeIcon />, path: "/home" },
    {
      i: 2,
      label: "Quotation Dashboard",
      icon: <SpaceDashboardIcon />,
      path: "/quotation_dashboard",
    },
    {
      i: 3,
      label: "Add Quotation",
      icon: <RequestQuoteIcon />,
      path: "/quotation",
    },
    {
      i: 4,
      label: "Quotation Essentials",
      icon: <NoteAddIcon />,
      path: "/quotation_essentials",
    },
    {
      i: 5,
      label: "JC Dashboard",
      icon: <SpaceDashboardIcon />,
      path: "/jobcard_dashboard",
    },
    { i: 6, label: "Jobcard", icon: <ArticleIcon />, path: "/jobcard" },
    {
      i: 7,
      label: "Jobcard Essentials",
      icon: <NoteAddIcon />,
      path: "/jobcard_essentials",
    },
    {
      i: 8,
      label: "Slot Booking",
      icon: <CalendarMonthSharpIcon />,
      path: "/slot_booking",
    },
    {
      i: 9,
      label: "Chamber & Calibration",
      icon: <KitchenIcon />,
      path: "/chamber-calibration",
    },
    {
      i: 10,
      label: "User Management",
      icon: <ManageAccountsIcon />,
      path: "/user_management",
    },
  ];

  // Filter items based on the user's role
  // const filteredItems = items.filter((item) => {
  //   if (loggedInUserDepartment === "Administrator") {
  //     return true; // Show all items for Admin
  //   } else if (loggedInUserDepartment === "Accounts") {
  //     return [1, 2, 3, 4, 5, 6].includes(item.i);
  //   } else if (loggedInUserDepartment === "Marketing") {
  //     return [2, 3, 4].includes(item.i);
  //   } else if (loggedInUserDepartment === "Testing") {
  //     return [5, 6, 7, 8, 9].includes(item.i);
  //   } else if (
  //     loggedInUserDepartment === "Reliability" ||
  //     loggedInUserDepartment === "Software"
  //   ) {
  //     return [5, 6, 7].includes(item.i);
  //   }
  //   return false; // Default: Hide the item
  // });

  const filteredItems = items.filter((item) => {
    if (loggedInUserDepartment === "Administrator") {
      return true; // Show all items for Administrator
    } else if (loggedInUserDepartment === "Accounts") {
      return [1, 2, 3, 4, 5, 6].includes(item.i);
    } else if (loggedInUserDepartment === "Marketing") {
      return [2, 3, 4].includes(item.i);
    } else if (
      loggedInUserDepartment === "TS1 Testing" ||
      loggedInUserDepartment === "TS2 Testing"
    ) {
      return [5, 6, 7, 8, 9].includes(item.i);
    } else if (
      loggedInUserDepartment === "Reliability" ||
      loggedInUserDepartment === "Software"
    ) {
      return [5, 6, 7].includes(item.i);
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
              alignItems: "center",
              minHeight: 48,
              justifyContent: open ? "initial" : "center",
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : "auto",
                justifyContent: "center",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              // primary={item.label}
              primary={
                <span
                  style={{
                    fontFamily: "Roboto-Bold",
                    fontSize: "14px",
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
        {/* <Box> */}
        <CssBaseline />

        {/* To cutomize the top header or the app bar */}
        <AppBar
          position="fixed"
          elevation={4}
          sx={{ backgroundColor: "#0D809D", color: "#2f2f2f", height: "64px" }}
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

            <IconButton
              title="Notifications"
              onClick={handleClickNotification}
              size="large"
            >
              <Badge badgeContent={notifications.length} showZero color="error">
                <NotificationsIcon sx={{ color: "white" }} size="large" />
              </Badge>
            </IconButton>

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

          <Popover
            id={notificationWindowId}
            open={isOpenNotificationWindow}
            anchorEl={notificationAnchorEl}
            onClose={handleCloseNotification}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <Box sx={{ padding: 2 }}>
              <Typography variant="h6">Notifications</Typography>
              <List>
                {notifications.map((notification, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={notification} />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClearNotifications}
              >
                Clear Notifications
              </Button>
            </Box>
          </Popover>
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

          {/* Create a list and add the number of items in order show it in a sidebar */}
          {filteredItems.map((item) => (
            // Render your item component here
            <MenuItem key={item.i} item={item} index={item.i} />
          ))}
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
          <Box
            height={100}
            sx={{
              marginTop: "1",
              marginBottom: "0.5",
              marginRight: "1",
              paddingTop: "5",
            }}
          />
          <Outlet />
        </Box>
      </Box>
    </>
  );
}
