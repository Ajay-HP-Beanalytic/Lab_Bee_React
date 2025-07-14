// Enhanced NotificationDialog.jsx with confirmation, select-all, lazy loading, and date grouping
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import NotificationsIcon from "@mui/icons-material/Notifications";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Pages/UserContext";
import { NotificationContext } from "../Pages/NotificationContext";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import { format, isToday, isThisWeek } from "date-fns";

const NotificationDialog = () => {
  const { loggedInUser, loggedInUserRole } = useContext(UserContext);
  const { notifications, setNotifications, newNotificationReceived } =
    useContext(NotificationContext);

  const [readStatus, setReadStatus] = useState({});
  const [selected, setSelected] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);
  const id = open ? "notification-popover" : undefined;
  const itemsPerPage = 10;

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get(
        `${serverBaseAddress}/api/getUnreadNotificationsCount`,
        {
          params: { userName: loggedInUser, userRole: loggedInUserRole },
        }
      );
      setUnreadCount(data?.count || 0);
    } catch (err) {
      console.error("Unread count error:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${serverBaseAddress}/api/getAllNotifications`,
        {
          params: { userRole: loggedInUserRole },
        }
      );
      const filtered = data.filter(
        (n) =>
          !n.isDeletedBy || !n.isDeletedBy.split(",").includes(loggedInUser)
      );
      setNotifications(filtered);
      const statusMap = {};
      filtered.forEach((n) => {
        statusMap[n.id] = n.isReadBy?.split(",").includes(loggedInUser);
      });
      setReadStatus(statusMap);
      setLoading(false);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [loggedInUserRole, loggedInUser, newNotificationReceived]);

  const visibleNotifications = notifications.slice(0, page * itemsPerPage);

  const groupByDate = (list) => {
    const grouped = { today: [], thisWeek: [], older: [] };
    list.forEach((n) => {
      const date = new Date(n.receivedAt);
      if (isToday(date)) grouped.today.push(n);
      else if (isThisWeek(date)) grouped.thisWeek.push(n);
      else grouped.older.push(n);
    });
    return grouped;
  };

  const handleToggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === visibleNotifications.length) {
      setSelected([]);
    } else {
      setSelected(visibleNotifications.map((n) => n.id));
    }
  };

  const handleMarkAllAsRead = async () => {
    await Promise.all(
      selected.map((id) =>
        axios.post(`${serverBaseAddress}/api/notifications/markAsRead/${id}`, {
          userName: loggedInUser,
        })
      )
    );
    fetchNotifications();
    fetchUnreadCount();
    setSelected([]);
  };

  const handleMarkAllAsUnread = async () => {
    await Promise.all(
      selected.map((id) =>
        axios.post(
          `${serverBaseAddress}/api/notifications/markAsUnRead/${id}`,
          { userName: loggedInUser }
        )
      )
    );
    fetchNotifications();
    fetchUnreadCount();
    setSelected([]);
  };

  const handleDeleteSelected = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false);
    await Promise.all(
      selected.map((id) =>
        axios.delete(`${serverBaseAddress}/api/deleteNotification/${id}`, {
          data: { userName: loggedInUser },
        })
      )
    );
    fetchNotifications();
    fetchUnreadCount();
    setSelected([]);
    toast.success("Deleted selected notifications");
  };

  const groupedNotifications = groupByDate(visibleNotifications);

  const renderNotificationList = (label, items) =>
    items.length > 0 && (
      <>
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          {label}
        </Typography>
        {items.map((n) => (
          <ListItem
            key={n.id}
            sx={{ backgroundColor: readStatus[n.id] ? "white" : "#f0f8ff" }}
          >
            <Checkbox
              checked={selected.includes(n.id)}
              onChange={() => handleToggleSelection(n.id)}
            />
            {!readStatus[n.id] && (
              <FiberManualRecordIcon
                sx={{ fontSize: 10, color: "blue", mr: 1 }}
              />
            )}
            <ListItemText
              primary={n.message}
              secondary={format(new Date(n.receivedAt), "PPpp")}
            />
          </ListItem>
        ))}
      </>
    );

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="large">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ color: "white" }} />
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ padding: 2, width: 500 }}>
          <Typography variant="h6">Notifications</Typography>
          <Divider sx={{ my: 1 }} />

          {loading ? (
            <CircularProgress />
          ) : notifications.length === 0 ? (
            <Typography>No notifications found.</Typography>
          ) : (
            <>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Checkbox
                  checked={selected.length === visibleNotifications.length}
                  indeterminate={
                    selected.length > 0 &&
                    selected.length < visibleNotifications.length
                  }
                  onChange={handleSelectAll}
                />
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={!selected.length}
                >
                  Mark as Read
                </Button>
                <Button
                  onClick={handleMarkAllAsUnread}
                  disabled={!selected.length}
                >
                  Mark as Unread
                </Button>
                <Button
                  onClick={handleDeleteSelected}
                  color="error"
                  disabled={!selected.length}
                >
                  Delete
                </Button>
              </Box>

              <List>
                {renderNotificationList("Today", groupedNotifications.today)}
                {renderNotificationList(
                  "This Week",
                  groupedNotifications.thisWeek
                )}
                {renderNotificationList("Older", groupedNotifications.older)}
              </List>
              {notifications.length > visibleNotifications.length && (
                <Button fullWidth onClick={() => setPage((prev) => prev + 1)}>
                  Load more
                </Button>
              )}
            </>
          )}
        </Box>
      </Popover>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the selected notifications? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationDialog;
