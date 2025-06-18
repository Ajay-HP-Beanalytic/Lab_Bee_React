// Here we are using "Mini variant drawer" to create a side navigation bar with grouped items:

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
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";
import MarkChatUnreadIcon from "@mui/icons-material/MarkChatUnread";
import DeleteIcon from "@mui/icons-material/Delete";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import {
  Avatar,
  Badge,
  Popover,
  SvgIcon,
  Tooltip,
  useMediaQuery,
  Drawer as MobileDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import HomeIcon from "@mui/icons-material/Home";
import CalendarMonthSharpIcon from "@mui/icons-material/CalendarMonthSharp";
import ArticleIcon from "@mui/icons-material/Article";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import KitchenIcon from "@mui/icons-material/Kitchen";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ScienceIcon from "@mui/icons-material/Science";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

import UserProfile from "../LoginRegister/UserProfile";
import { serverBaseAddress } from "../Pages/APIPage";
import { UserContext } from "../Pages/UserContext";
import { NotificationContext } from "../Pages/NotificationContext";

const drawerWidth = 240;

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
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } =
    useContext(UserContext);
  const { notifications, setNotifications, newNotificationReceived } =
    useContext(NotificationContext);

  const [open, setOpen] = useState(!isMobile); // Auto-close on mobile
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Notification states
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [readStatus, setReadStatus] = useState({});
  const [numberOfUnreadNotifications, setNumberOfUnreadNotifications] =
    useState(0);

  // To highlight the selected button
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define menu groups with their items
  const menuGroups = [
    {
      id: "accounts",
      title: "Accounts",
      icon: <AccountBalanceIcon />,
      color: "#4caf50",
      items: [
        {
          id: 1,
          label: "Home",
          icon: <HomeIcon />,
          path: "/home",
        },
        {
          id: 2,
          label: "Quotation",
          icon: <CurrencyRupeeIcon />,
          path: "/quotation_dashboard",
        },
        {
          id: 3,
          label: "Quotation Essentials",
          icon: <NoteAddIcon />,
          path: "/quotation_essentials",
        },
      ],
    },
    {
      id: "ts1",
      title: "TS1 Testing",
      icon: <ScienceIcon />,
      color: "#2196f3",
      items: [
        {
          id: 4,
          label: "Job-Card",
          icon: <ArticleIcon />,
          path: "/jobcard_dashboard",
        },
        {
          id: 5,
          label: "JC Essentials",
          icon: <NoteAddIcon />,
          path: "/jobcard_essentials",
        },
        {
          id: 6,
          label: "Slot Booking",
          icon: <CalendarMonthSharpIcon />,
          path: "/slot_booking",
        },
        {
          id: 7,
          label: "Chambers & Calibration",
          icon: <KitchenIcon />,
          path: "/chamber-calibration",
        },
      ],
    },
    {
      id: "ts2",
      title: "TS2 Testing",
      icon: <ElectricBoltIcon />,
      color: "#ff9800",
      items: [
        {
          id: 8,
          label: "EMI/EMC JC Dashboard",
          icon: <DashboardIcon />,
          path: "/emi_jc_dashboard",
        },
      ],
    },
    {
      id: "project",
      title: "Project Management",
      icon: <EventRepeatIcon />,
      color: "#9c27b0",
      items: [
        {
          id: 10,
          label: "Project Management",
          icon: <EventRepeatIcon />,
          path: "/projects",
        },
      ],
    },
    {
      id: "admin",
      title: "Administration",
      icon: <ManageAccountsIcon />,
      color: "#f44336",
      items: [
        {
          id: 9,
          label: "Users Management",
          icon: <ManageAccountsIcon />,
          path: "/user_management",
        },
      ],
    },
  ];

  // Filter groups and items based on user permissions
  const getFilteredMenuGroups = () => {
    return menuGroups
      .map((group) => {
        const filteredItems = group.items.filter((item) => {
          if (loggedInUserDepartment === "Administration") {
            return true; // Show all items for Administration
          } else if (loggedInUserDepartment === "Accounts") {
            return [1, 2, 3, 4, 5, 6, 8].includes(item.id);
          } else if (loggedInUserDepartment === "Marketing") {
            return [2, 3, 8].includes(item.id);
          } else if (
            loggedInUserDepartment === "TS1 Testing" ||
            loggedInUserRole === "Reports & Scrutiny Manager"
          ) {
            return [4, 5, 6, 7].includes(item.id);
          } else if (
            loggedInUserDepartment === "Reliability" ||
            loggedInUserDepartment === "Software"
          ) {
            return [10].includes(item.id);
          } else if (loggedInUserDepartment === "TS2 Testing") {
            return [8].includes(item.id);
          } else if (loggedInUserRole === "Quality Engineer") {
            return [4, 6, 7, 8].includes(item.id);
          }
          return false;
        });

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group) => group.items.length > 0); // Only show groups with items
  };

  const filteredGroups = getFilteredMenuGroups();

  // Get all items for mobile bottom navigation
  const getAllItems = () => {
    return filteredGroups.flatMap((group) => group.items);
  };

  const allItems = getAllItems();

  // Handle group expand/collapse
  const handleGroupClick = (groupId) => {
    if (!open && !isMobile) {
      setOpen(true);
    }
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleListItemClick = (event, index, path) => {
    setSelectedIndex(index);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
    navigate(path);
  };

  const handleDrawerClose = () => {
    setOpen(false);
    setExpandedGroups({});
  };

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setOpen(!open);
    }
  };

  // Auto-adjust sidebar for responsive design
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setMobileDrawerOpen(false);
    }
  }, [isMobile]);

  // Create avatar texts to display in the sidebar
  const firstLetter = loggedInUser.charAt(0).toUpperCase();
  const userAvatar = firstLetter;

  const GradientIcon = ({ children, color }) => (
    <SvgIcon sx={{ color: color || "inherit" }}>{children}</SvgIcon>
  );

  // Notification handlers (keeping existing logic)
  const handleClickAvatar = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseAvatar = () => {
    setAnchorEl(null);
  };

  const handleClickNotification = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

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

  // Notification functions (keeping existing logic)
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
        const filteredNotifications = fetchedNotifications.filter(
          (notification) =>
            !notification.isDeletedBy ||
            !notification.isDeletedBy.split(",").includes(loggedInUser)
        );

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

    fetchNotifications();
    fetchUnreadNotificationsCount();
  }, [loggedInUserRole, loggedInUser, newNotificationReceived]);

  useEffect(() => {
    if (notifications.length > 0) {
      const newReadStatus = notifications.reduce((status, notification) => {
        if (!notification.id) {
          return status;
        }

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

  const handleReadSelectedNotification = (notificationId) => {
    const markNotificationAsRead = async (notificationId, loggedInUser) => {
      try {
        const response = await axios.post(
          `${serverBaseAddress}/api/notifications/markAsRead/${notificationId}`,
          { userName: loggedInUser }
        );

        if (response.status === 200) {
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
  };

  const handleUnreadSelectedNotification = (notificationId) => {
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
  };

  const handleDeleteSelectedNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${serverBaseAddress}/api/deleteNotification/${notificationId}`,
        {
          data: { userName: loggedInUser },
        }
      );

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
      return `${dayString}-${monthString}-${year}`;
    }
  };

  // Menu item component
  function MenuItem({ item, isNested = false }) {
    return (
      <Tooltip
        title={!open && !isNested ? item.label : ""}
        placement="right"
        arrow
      >
        <ListItem
          disablePadding
          sx={{ display: "block", pl: isNested ? 4 : 0 }}
          component={Link}
          to={item.path}
        >
          <ListItemButton
            selected={selectedIndex === item.id}
            onClick={(event) => handleListItemClick(event, item.id, item.path)}
            sx={{
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
              <GradientIcon>{item.icon}</GradientIcon>
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                opacity: open ? 1 : 0,
                "& .MuiListItemText-primary": {
                  fontSize: "14px",
                  fontWeight: isNested ? "normal" : "medium",
                },
              }}
            />
          </ListItemButton>
        </ListItem>
      </Tooltip>
    );
  }

  // Group header component
  function GroupHeader({ group }) {
    const isExpanded = expandedGroups[group.id];

    return (
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => handleGroupClick(group.id)}
          sx={{
            minHeight: 48,
            justifyContent: open ? "initial" : "center",
            px: 2.5,
            backgroundColor: open ? "rgba(0,0,0,0.05)" : "transparent",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.1)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : "auto",
              justifyContent: "center",
            }}
          >
            <GradientIcon color={group.color}>{group.icon}</GradientIcon>
          </ListItemIcon>
          <ListItemText
            primary={group.title}
            sx={{
              opacity: open ? 1 : 0,
              "& .MuiListItemText-primary": {
                fontSize: "15px",
                fontWeight: "bold",
                color: group.color,
              },
            }}
          />
          {open && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
    );
  }

  // Drawer content
  const drawerContent = (
    <div>
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === "rtl" ? (
            <ChevronRightIcon />
          ) : (
            <ChevronLeftIcon />
          )}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {filteredGroups.map((group) => (
          <div key={group.id}>
            <GroupHeader group={group} />
            <Collapse
              in={expandedGroups[group.id] && open}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>
                {group.items.map((item) => (
                  <MenuItem key={item.id} item={item} isNested={true} />
                ))}
              </List>
            </Collapse>
            {!open &&
              group.items.map((item) => <MenuItem key={item.id} item={item} />)}
          </div>
        ))}
      </List>
    </div>
  );

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />

        {/* App Bar */}
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            backgroundColor: "#0f6cbd",
            color: "#2f2f2f",
            height: "64px",
            ...(isMobile && { marginLeft: 0, width: "100%" }),
          }}
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

            {/* User Profile Popover */}
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

            {/* Notifications Popover */}
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
              <Box
                sx={{
                  padding: 2,
                  maxWidth: 400,
                  maxHeight: 500,
                  overflow: "auto",
                }}
              >
                <Typography variant="h6">Notifications</Typography>
                {notifications.length === 0 ? (
                  <Typography variant="body1">
                    No notifications found.
                  </Typography>
                ) : (
                  <List>
                    {notifications.map((notification) => {
                      const isRead = readStatus[notification.id];

                      return (
                        <ListItem
                          key={notification.id}
                          sx={{
                            backgroundColor: isRead ? "white" : "#c3ddf8",
                            borderBottom: "1px solid #e0e0e0",
                            transition: "background-color 0.3s",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            "&:hover": {
                              backgroundColor: isRead ? "#e0e0e0" : "#c3ddf8",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {!isRead && (
                              <FiberManualRecordIcon
                                sx={{
                                  fontSize: 10,
                                  color: "blue",
                                  marginRight: 1,
                                }}
                              />
                            )}

                            <ListItemText
                              primary={notification.message}
                              secondary={formatDateOrTime(
                                notification.receivedAt
                              )}
                            />
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Tooltip
                              title={
                                isRead ? "Mark as Un-Read" : "Mark as Read"
                              }
                            >
                              <IconButton
                                size="small"
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
                                size="small"
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
          </Toolbar>
        </AppBar>

        {/* Desktop Drawer */}
        {!isMobile && (
          <Drawer variant="permanent" open={open}>
            {drawerContent}
          </Drawer>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawerContent}
          </MobileDrawer>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            ...(isMobile && { pb: 10 }), // Add bottom padding for mobile bottom nav
            marginLeft: isMobile
              ? 0
              : open
              ? `${drawerWidth}px`
              : `calc(${theme.spacing(7)} + 1px)`,
            transition: theme.transitions.create(["margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            [theme.breakpoints.up("sm")]: {
              marginLeft: isMobile
                ? 0
                : open
                ? `${drawerWidth}px`
                : `calc(${theme.spacing(8)} + 1px)`,
            },
          }}
        >
          <DrawerHeader />
          <Outlet />
        </Box>

        {/* Mobile Bottom Navigation */}
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
              value={bottomNavValue}
              onChange={(event, newValue) => {
                setBottomNavValue(newValue);
                if (allItems[newValue]) {
                  navigate(allItems[newValue].path);
                }
              }}
              sx={{
                height: 70,
                "& .MuiBottomNavigationAction-root": {
                  minWidth: "auto",
                  fontSize: "12px",
                },
              }}
            >
              {allItems.slice(0, 5).map((item, index) => (
                <BottomNavigationAction
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  sx={{
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: "10px",
                      marginTop: "4px",
                    },
                  }}
                />
              ))}
              {allItems.length > 5 && (
                <BottomNavigationAction
                  label="More"
                  icon={<MenuIcon />}
                  onClick={() => setMobileDrawerOpen(true)}
                />
              )}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </>
  );
}
