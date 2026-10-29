// Notification bell and panel: unread badge, All / Unread tabs, grouped by day,
// click to open the related page, per-item read / delete, mark all as read.
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListSubheader,
  Popover,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventIcon from "@mui/icons-material/Event";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import MarkunreadMailboxIcon from "@mui/icons-material/MarkunreadMailbox";
import DescriptionIcon from "@mui/icons-material/Description";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import axios from "axios";
import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../Pages/UserContext";
import { NotificationContext } from "../Pages/NotificationContext";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import { format, formatDistanceToNowStrict, isToday, isYesterday, isThisWeek } from "date-fns";

const PAGE_SIZE = 20;
const POLL_MS = 2 * 60 * 1000; // in case a live (socket) message was missed

// Icon and colour by what the notification is about
const CATEGORIES = [
  { key: "enquiry", test: (n) => n.link?.startsWith("/rfq_inbox") || /\bRFQ-\d+|enquiry/i.test(n.message), icon: MarkunreadMailboxIcon, color: "#6a1b9a" },
  { key: "quote", test: (n) => /quot/i.test(n.message), icon: RequestQuoteIcon, color: "#2e7d32" },
  { key: "slot", test: (n) => /slot|booking/i.test(n.message), icon: EventIcon, color: "#ef6c00" },
  { key: "report", test: (n) => /report/i.test(n.message), icon: DescriptionIcon, color: "#00838f" },
  { key: "jobcard", test: (n) => /\bJC\b|job ?card/i.test(n.message), icon: AssignmentIcon, color: "#1565c0" },
];
const categoryOf = (n) => CATEGORIES.find((c) => c.test(n)) || { key: "other", icon: InfoOutlinedIcon, color: "#546e7a" };

const dayGroup = (date) => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date, { weekStartsOn: 1 })) return "This week";
  return "Older";
};

const timeAgo = (date) => {
  const secs = (Date.now() - date.getTime()) / 1000;
  if (secs < 60) return "just now";
  return `${formatDistanceToNowStrict(date)} ago`;
};

const NotificationDialog = () => {
  const { loggedInUser, loggedInUserRole } = useContext(UserContext);
  const { notifications, setNotifications, newNotificationReceived } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const open = Boolean(anchorEl);
  const who = useMemo(() => ({ userName: loggedInUser, userRole: loggedInUserRole }), [loggedInUser, loggedInUserRole]);

  const fetchUnreadCount = useCallback(async () => {
    if (!loggedInUser) return;
    try {
      const { data } = await axios.get(`${serverBaseAddress}/api/getUnreadNotificationsCount`, { params: who });
      setUnreadCount(data?.count || 0);
    } catch (err) {
      console.error("Unread count error:", err);
    }
  }, [loggedInUser, who]);

  const fetchNotifications = useCallback(async () => {
    if (!loggedInUser) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${serverBaseAddress}/api/getAllNotifications`, { params: who });
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setError("Couldn't load the notifications.");
    } finally {
      setLoading(false);
    }
  }, [loggedInUser, who, setNotifications]);

  // Load on login, on every live notification, and every few minutes
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [newNotificationReceived, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const timer = setInterval(fetchUnreadCount, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchUnreadCount]);

  const openPanel = (e) => {
    setAnchorEl(e.currentTarget);
    setShown(PAGE_SIZE);
    fetchNotifications();
    fetchUnreadCount();
  };

  // isRead comes from the server; live messages added by NotificationsManagement have none
  const isRead = (n) => n.isRead === true;

  const list = useMemo(
    () => notifications.filter((n) => n.id && (tab === "all" || !isRead(n))),
    [notifications, tab],
  );
  const visible = list.slice(0, shown);
  const groups = useMemo(() => {
    const out = [];
    for (const n of visible) {
      const label = dayGroup(new Date(n.receivedAt));
      if (!out.length || out[out.length - 1].label !== label) out.push({ label, items: [] });
      out[out.length - 1].items.push(n);
    }
    return out;
  }, [visible]);

  // Change the list at once, save in the background, reload if saving fails
  const update = async (change, request, failMsg) => {
    const before = notifications;
    setNotifications(change(notifications));
    try {
      await request();
    } catch (err) {
      console.error(failMsg, err);
      setNotifications(before);
      toast.error(failMsg);
    } finally {
      fetchUnreadCount();
    }
  };

  const setRead = (n, read) =>
    update(
      (all) => all.map((x) => (x.id === n.id ? { ...x, isRead: read } : x)),
      () => axios.post(`${serverBaseAddress}/api/notifications/${read ? "markAsRead" : "markAsUnRead"}/${n.id}`, who),
      "Couldn't update the notification",
    );

  const remove = (n) =>
    update(
      (all) => all.filter((x) => x.id !== n.id),
      () => axios.delete(`${serverBaseAddress}/api/deleteNotification/${n.id}`, { data: who }),
      "Couldn't delete the notification",
    );

  const markAllRead = async () => {
    setBusy(true);
    await update(
      (all) => all.map((x) => ({ ...x, isRead: true })),
      () => axios.post(`${serverBaseAddress}/api/notifications/bulk`, { ...who, action: "read", ids: "all" }),
      "Couldn't mark all as read",
    );
    setBusy(false);
  };

  const clearRead = async () => {
    setConfirmClear(false);
    const ids = notifications.filter(isRead).map((n) => n.id);
    if (!ids.length) return;
    setBusy(true);
    await update(
      (all) => all.filter((x) => !isRead(x)),
      () => axios.post(`${serverBaseAddress}/api/notifications/bulk`, { ...who, action: "delete", ids }),
      "Couldn't clear the notifications",
    );
    setBusy(false);
  };

  const openItem = (n) => {
    if (!isRead(n)) setRead(n, true);
    if (n.link) {
      setAnchorEl(null);
      navigate(n.link);
    }
  };

  const readCount = notifications.filter(isRead).length;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={openPanel} size="large" aria-label={`${unreadCount} unread notifications`}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon sx={{ color: "white" }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: { xs: "calc(100vw - 32px)", sm: 440 }, maxHeight: "75vh", display: "flex", flexDirection: "column", borderRadius: 2 } } }}
      >
        {/* Header */}
        <Box sx={{ px: 2, pt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            Notifications
          </Typography>
          <Tooltip title="Mark all as read">
            <span>
              <IconButton size="small" onClick={markAllRead} disabled={busy || unreadCount === 0}>
                <DoneAllIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => { fetchNotifications(); fetchUnreadCount(); }} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setShown(PAGE_SIZE); }}
          sx={{ px: 1, minHeight: 36, "& .MuiTab-root": { minHeight: 36, textTransform: "none", py: 0 } }}
        >
          <Tab value="all" label="All" />
          <Tab value="unread" label={unreadCount ? `Unread (${unreadCount})` : "Unread"} />
        </Tabs>
        <Divider />

        {/* List */}
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }} action={<Button size="small" onClick={fetchNotifications}>Retry</Button>}>
              {error}
            </Alert>
          )}
          {loading && !notifications.length && (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress size={28} />
            </Box>
          )}
          {!loading && !error && list.length === 0 && (
            <Box textAlign="center" py={6} px={2} color="text.secondary">
              <NotificationsNoneIcon sx={{ fontSize: 44, opacity: 0.4 }} />
              <Typography variant="body2" mt={1}>
                {tab === "unread" ? "You're all caught up." : "No notifications."}
              </Typography>
            </Box>
          )}

          {groups.map((g) => (
            <Box key={g.label}>
              <ListSubheader sx={{ lineHeight: "28px", fontSize: 12, fontWeight: 700, bgcolor: "grey.50", color: "text.secondary" }}>
                {g.label}
              </ListSubheader>
              {g.items.map((n) => {
                const cat = categoryOf(n);
                const Icon = cat.icon;
                const read = isRead(n);
                const date = new Date(n.receivedAt);
                return (
                  <Box
                    key={n.id}
                    onClick={() => openItem(n)}
                    sx={{
                      "display": "flex",
                      "gap": 1.5,
                      "px": 2,
                      "py": 1.25,
                      "cursor": "pointer",
                      "borderBottom": "1px solid",
                      "borderColor": "divider",
                      "bgcolor": read ? "background.paper" : "#f3f8ff",
                      "&:hover": { bgcolor: read ? "grey.50" : "#e8f1fd" },
                      "&:hover .n-actions": { opacity: 1 },
                    }}
                  >
                    <Avatar sx={{ width: 34, height: 34, bgcolor: `${cat.color}1a`, color: cat.color }}>
                      <Icon sx={{ fontSize: 19 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={read ? 400 : 600}
                        sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}
                        title={n.message}
                      >
                        {n.message}
                      </Typography>
                      <Tooltip title={format(date, "dd MMM yyyy, HH:mm")} placement="bottom-start">
                        <Typography variant="caption" color="text.secondary">
                          {timeAgo(date)}
                          {n.sender && ` · ${n.sender}`}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={0.25}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: read ? "transparent" : "primary.main", mt: 0.75, mb: 0.5 }} />
                      <Box className="n-actions" sx={{ display: "flex", flexDirection: "column", opacity: { xs: 1, md: 0 }, transition: "opacity .15s" }}>
                        <Tooltip title={read ? "Mark as unread" : "Mark as read"}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRead(n, !read); }}>
                            {read ? <MarkEmailUnreadIcon sx={{ fontSize: 17 }} /> : <MarkEmailReadIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); remove(n); }}>
                            <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}

          {list.length > visible.length && (
            <Button fullWidth onClick={() => setShown((s) => s + PAGE_SIZE)} sx={{ py: 1.25, textTransform: "none" }}>
              Show more ({list.length - visible.length})
            </Button>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 0.75, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Last 90 days
              </Typography>
              <Button size="small" color="inherit" sx={{ textTransform: "none" }} disabled={busy || readCount === 0} onClick={() => setConfirmClear(true)}>
                Clear read ({readCount})
              </Button>
            </Box>
          </>
        )}
      </Popover>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogTitle>Clear read notifications?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {readCount} read notification(s) will be removed from your list. Other people still see theirs.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button onClick={clearRead} color="error" variant="contained">
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationDialog;
