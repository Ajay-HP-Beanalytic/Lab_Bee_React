import { useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { serverBaseAddress } from "./APIPage";
import { UserContext } from "./UserContext";
import { NotificationContext } from "./NotificationContext";
import { io } from "socket.io-client";

// Socket events and the title of their desktop notification
const EVENT_TITLES = {
  jobcard_submit_notification: "New JC Created",
  jobcard_update_notification: "TS1 JC Update",
  jobcard_status_test_completed_notification: "JC Test Completed",
  jobcard_status_closed_notification: "JC Closed",
  jobcard_report_delivery_notification: "Report Delivery Instruction",
  jobcard_report_status_notification: "TS1 Report Status",
  new_slot_booking_notification: "New Slot Booking",
  update_slot_booking_notification: "Slot Update",
  delete_slot_booking_notification: "Slot Delete",
  new_quote_created_notification: "New Quote",
  quote_update_notification: "Quote Update",
  emi_jobcard_submit_notification: "New TS2 JC Created",
  rfq_notification: "Enquiry",
  report_notification: "TS1 Report",
};

const canNotifyDesktop = () => typeof window !== "undefined" && "Notification" in window;

export default function NotificationsManagement() {
  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } = useContext(UserContext);
  const { setNewNotificationReceived, setNotifications } = useContext(NotificationContext);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Ask once for desktop notifications (the browser remembers the answer)
  useEffect(() => {
    if (loggedInUser && canNotifyDesktop() && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [loggedInUser]);

  useEffect(() => {
    if (!loggedInUser) return undefined;
    const socket = io(serverBaseAddress, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const register = () =>
      socket.emit("user_connected", {
        username: loggedInUser,
        department: loggedInUserDepartment,
        userRole: loggedInUserRole,
      });
    // Register again after every reconnect, so live notifications keep arriving
    socket.on("connect", register);

    const handlers = Object.entries(EVENT_TITLES).map(([event, title]) => {
      const handler = ({ id, message, sender, receivedAt, link } = {}) => {
        if (!message || sender === loggedInUser) return;
        setNotifications((prev) =>
          id && prev.some((n) => n.id === id) ? prev : [{ id, message, receivedAt, sender, link, isRead: false }, ...prev],
        );
        // The panel reloads the list and the unread count
        setNewNotificationReceived((prev) => !prev);
        if (link?.startsWith("/ts1_reports")) window.dispatchEvent(new Event("ts1-report-notification"));

        toast.info(`${title}: ${message}`, {
          position: "bottom-right",
          autoClose: 8000,
          onClick: link ? () => navigateRef.current(link) : undefined,
        });

        if (canNotifyDesktop() && Notification.permission === "granted" && document.hidden) {
          try {
            const desktop = new Notification(title, { body: message, tag: id ? `labbee-${id}` : undefined });
            desktop.onclick = () => {
              window.focus();
              if (link) navigateRef.current(link);
              desktop.close();
            };
          } catch (err) {
            // some browsers only allow notifications from a service worker
          }
        }
      };
      socket.on(event, handler);
      return [event, handler];
    });

    return () => {
      socket.off("connect", register);
      handlers.forEach(([event, handler]) => socket.off(event, handler));
      socket.disconnect();
    };
  }, [loggedInUser, loggedInUserDepartment, loggedInUserRole, setNotifications, setNewNotificationReceived]);

  return null; // This component doesn't render anything
}
