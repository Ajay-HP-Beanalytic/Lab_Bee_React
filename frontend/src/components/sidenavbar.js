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
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import MarkChatUnreadIcon from "@mui/icons-material/MarkChatUnread";
import DeleteIcon from "@mui/icons-material/Delete";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { Avatar, Badge, Popover, SvgIcon, Tooltip } from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
// import EditNoteIcon from "@mui/icons-material/EditNote";
import CalendarMonthSharpIcon from "@mui/icons-material/CalendarMonthSharp";
import ArticleIcon from "@mui/icons-material/Article";
// import SettingsIcon from "@mui/icons-material/Settings";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import KitchenIcon from "@mui/icons-material/Kitchen";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import { Link, Outlet } from "react-router-dom";
// import axios from "axios";

import RobotoBoldFont from "../fonts/Roboto-Bold.ttf";
import UserProfile from "../LoginRegister/UserProfile";

// import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import { NotificationContext } from "../Pages/NotificationContext";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";

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
  const { notifications, setNotifications, newNotificationReceived } =
    useContext(NotificationContext);

  const [open, setOpen] = useState(false); // "true" to keep open, and "false" is for keep it closed

  //States and functions to handle the onclick events on Avatar:
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  //State to mark all the notifications as default unread:
  // const [readStatus, setReadStatus] = useState([]);
  const [readStatus, setReadStatus] = useState({});

  // const [searchNotificationText, setSearchNotificationText] = useState("");
  // const [filteredNotifications, setFilteredNotifications] =
  //   useState(notifications);

  const [numberOfUnreadNotifications, setNumberOfUnreadNotifications] =
    useState(0);

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
  // const handleClearNotifications = () => {
  //   notifications.length = 0;
  //   setNotificationAnchorEl(null);
  // };

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

  // const onChangeSearchNotificationText = (event) => {
  //   const searchText = event.target.value;
  //   setSearchNotificationText(searchText);
  // };

  // const onClearSearchNotificationText = () => {
  //   setSearchNotificationText("");
  // };

  //Fetch the number of un-read notifictions:
  const fetchUnreadNotificationsCount = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getUnreadNotificationsCount`,
        {
          params: {
            userName: loggedInUser,
            userRole: loggedInUserRole,
          },
        }
      );
      const fetchedUnreadCount = response.data?.count;
      setNumberOfUnreadNotifications(fetchedUnreadCount);
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
    }
  };

  //Fetch all the notifications which are recieved by the logged in users:
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          `${serverBaseAddress}/api/getAllNotifications`,
          {
            params: {
              userRole: loggedInUserRole,
            },
          }
        );

        const fetchedNotifications = response.data;

        // Filter out notifications marked as deleted by the user
        const filteredNotifications = fetchedNotifications.filter(
          (notification) =>
            !notification.isDeletedBy ||
            !notification.isDeletedBy.split(",").includes(loggedInUser)
        );
        // Update readStatus array based on isReadBy field
        const newReadStatus = filteredNotifications.map((notification) => {
          const isRead = notification.isReadBy
            ? notification.isReadBy.split(",").includes(loggedInUser)
            : false;

          return isRead;
        });

        setNotifications(filteredNotifications);
        setReadStatus(newReadStatus);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    //Call and initiate the function to fetch the notifications:
    fetchNotifications();

    //Call and initiate the function:
    fetchUnreadNotificationsCount();
  }, [loggedInUserRole, loggedInUser, newNotificationReceived]);

  //Function to mark the newly recieved notification as read:
  useEffect(() => {
    if (notifications.length > 0) {
      const newReadStatus = notifications.reduce((status, notification) => {
        // Ensure every notification has a valid ID
        if (!notification.id) {
          // console.error("Notification with missing ID:", notification);
          return status;
        }

        // Preserve existing readStatus or initialize it
        const isRead = readStatus.hasOwnProperty(notification.id)
          ? readStatus[notification.id]
          : notification.isReadBy
          ? notification.isReadBy.split(",").includes(loggedInUser)
          : false;

        status[notification.id] = isRead;
        return status;
      }, {});

      setReadStatus(newReadStatus);
    }
  }, [notifications, loggedInUser, newNotificationReceived]);

  ///////////////////////////////////////////////////////////////////////////////////////////
  //Function to make the notification as read:
  const handleReadSelectedNotification = (notificationId) => {
    // Mark the notification as read in the backend
    const markNotificationAsRead = async (notificationId, loggedInUser) => {
      try {
        const response = await axios.post(
          `${serverBaseAddress}/api/notifications/markAsRead/${notificationId}`,
          { userName: loggedInUser }
        );

        if (response.status === 200) {
          // Update the read status based on the notification id
          setReadStatus((prevReadStatus) => ({
            ...prevReadStatus,
            [notificationId]: true,
          }));
          await fetchUnreadNotificationsCount();
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    };

    markNotificationAsRead(notificationId, loggedInUser);
    // fetchUnreadNotificationsCount();
  };

  //Function to make the notification as unread:
  const handleUnreadSelectedNotification = (notificationId) => {
    // Mark the notification as unread in the backend
    const markNotificationAsUnRead = async (notificationId, loggedInUser) => {
      try {
        const response = await axios.post(
          `${serverBaseAddress}/api/notifications/markAsUnRead/${notificationId}`,
          { userName: loggedInUser }
        );

        if (response.status === 200) {
          setReadStatus((prevReadStatus) => ({
            ...prevReadStatus,
            [notificationId]: false,
          }));
          await fetchUnreadNotificationsCount();
        }
      } catch (error) {
        console.error("Error marking notification as un-read:", error);
      }
    };

    markNotificationAsUnRead(notificationId, loggedInUser);
    // fetchUnreadNotificationsCount();
  };

  // const handleDeleteSelectedNotification = (notificationId) => {
  //   // Delete the notification in the backend
  //   const deleteNotification = async (notificationId, loggedInUser) => {
  //     try {
  //       await axios.delete(
  //         `${serverBaseAddress}/api/deleteNotification/${notificationId}`,
  //         {
  //           data: { userName: loggedInUser },
  //         }
  //       );
  //     } catch (error) {
  //       console.error("Error deleting the notification", error);
  //     }
  //   };

  //   deleteNotification(notificationId, loggedInUser);

  //   // Update the notifications and read status states
  //   setNotifications((prevNotifications) =>
  //     prevNotifications.filter(
  //       (notification) => notification.id !== notificationId
  //     )
  //   );
  // };

  // Delete a notification
  const handleDeleteSelectedNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${serverBaseAddress}/api/deleteNotification/${notificationId}`,
        {
          data: { userName: loggedInUser },
        }
      );

      // Update the notifications and read status, then fetch the updated unread count
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
      setReadStatus((prevReadStatus) => {
        const updatedStatus = { ...prevReadStatus };
        delete updatedStatus[notificationId];
        return updatedStatus;
      });

      await fetchUnreadNotificationsCount();
    } catch (error) {
      console.error("Error deleting the notification", error);
    }
  };

  // Function to format the received date or time
  const formatDateOrTime = (receivedAt) => {
    if (!receivedAt) return "";

    const now = new Date();
    const notificationDate = new Date(receivedAt);

    const isToday = now.toDateString() === notificationDate.toDateString();

    if (isToday) {
      return notificationDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      const day = notificationDate.getDate();

      const dayString = day.toString().padStart(2, "0");
      const month = notificationDate.getMonth() + 1;
      const monthString = month.toString().padStart(2, "0");
      const year = notificationDate.getFullYear();

      const formattedNotificationDate = `${dayString}-${monthString}-${year}`;

      return formattedNotificationDate;
    }
  };

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
      label: "EMI/EMC JC Dashboard",
      icon: <DashboardIcon />,
      path: "/emi_jc_dashboard",
      gradientId: "emiDashboardGradient",
    },
    {
      i: 9,
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
      return [1, 2, 3, 4, 5, 6, 8].includes(item.i);
    } else if (loggedInUserDepartment === "Marketing") {
      return [2, 3, 8].includes(item.i);
    } else if (
      loggedInUserDepartment === "TS1 Testing" ||
      loggedInUserDepartment === "Reports & Scrutiny"
    ) {
      return [4, 6, 7].includes(item.i);
    } else if (
      loggedInUserDepartment === "Reliability" ||
      loggedInUserDepartment === "Software"
    ) {
      return [4, 5].includes(item.i);
    } else if (loggedInUserDepartment === "TS2 Testing") {
      return [8].includes(item.i);
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

            <IconButton
              title="Notifications"
              onClick={handleClickNotification}
              size="large"
            >
              <Badge
                showZero
                badgeContent={numberOfUnreadNotifications}
                color="error"
              >
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
              {notifications.length === 0 ? (
                <Typography variant="body1">No notifications found.</Typography>
              ) : (
                <List>
                  {notifications.map((notification) => {
                    const isRead = readStatus[notification.id]; // Access readStatus by notification ID

                    return (
                      <ListItem
                        key={notification.id}
                        sx={{
                          backgroundColor: isRead ? "white" : "#c3ddf8",
                          borderBottom: "1px solid #e0e0e0",
                          transition: "background-color 0.3s",
                          display: "flex", // Aligns items horizontally
                          justifyContent: "space-between", // Space between dot-message and buttons
                          alignItems: "center", // Aligns items vertically centered
                          "&:hover": {
                            backgroundColor: isRead ? "#e0e0e0" : "#c3ddf8",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {!isRead && (
                            <FiberManualRecordIcon
                              sx={{
                                fontSize: 10, // Size of the dot
                                color: "blue", // Color of the dot, adjust as needed
                                marginRight: 1, // Space between dot and message
                              }}
                            />
                          )}

                          <ListItemText
                            primary={notification.message} // Message text
                            secondary={formatDateOrTime(
                              notification.receivedAt
                            )} // Format the receivedAt date/time
                          />
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Tooltip
                            title={isRead ? "Mark as Un-Read" : "Mark as Read"}
                          >
                            <IconButton
                              onClick={() =>
                                isRead
                                  ? handleUnreadSelectedNotification(
                                      notification.id
                                    )
                                  : handleReadSelectedNotification(
                                      notification.id
                                    )
                              }
                            >
                              {isRead ? (
                                <MarkChatUnreadIcon />
                              ) : (
                                <MarkChatReadIcon />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Notification">
                            <IconButton
                              onClick={() =>
                                handleDeleteSelectedNotification(
                                  notification.id
                                )
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}
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
