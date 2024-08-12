import { useContext, useEffect } from "react";
import { serverBaseAddress } from "./APIPage";
import { UserContext } from "./UserContext";
import { NotificationContext } from "./NotificationContext";
import { io } from "socket.io-client";

export default function NotificationsManagement() {
  const { loggedInUser, loggedInUserDepartment, loggedInUserRole } =
    useContext(UserContext);
  const { setNotifications } = useContext(NotificationContext);

  // const socket = io(serverBaseAddress); // Replace with your server address
  const socket = io(serverBaseAddress, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  //Handle notifications here:
  useEffect(() => {
    if (loggedInUser) {
      socket.emit("user_connected", {
        username: loggedInUser,
        department: loggedInUserDepartment,
        userRole: loggedInUserRole,
      });
    }

    /**
     * Handles a jobcard submit notification.
     *
     * @param {Object} options - The options object.
     * @param {string} options.message - The notification message.
     * @param {string} options.sender - The sender of the notification.
     * @return {void} This function does not return anything.
     */
    const handleJobcardSubmitNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    /**
     * Handles a jobcard update notification.
     *
     * @param {Object} options - The options object.
     * @param {string} options.message - The notification message.
     * @param {string} options.sender - The sender of the notification.
     */
    const handleJobcardUpdateNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    const handleJobcardTestCompletedNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("JC Test Completed Notification", { body: message });
        }
      }
    };

    const handleJobcardClosedNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("JC Closed Notification", { body: message });
        }
      }
    };

    const handleJobcardReportDeliveryNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("Report Delivery Notification", { body: message });
        }
      }
    };

    const handleJobcardReportStatusNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("Report Status Notification", { body: message });
        }
      }
    };

    const handleNewSlotBookingNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    const handleUpdateSlotBookingNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    const handleDeleteSlotBookingNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    const handleNewQuoteCreatedNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    const handleQuoteUpdateNotification = ({ message, sender }) => {
      if (sender !== loggedInUser) {
        setNotifications((prevNotifications) => [
          ...prevNotifications,
          message,
        ]);
        // Show a browser notification
        if (Notification.permission === "granted") {
          new Notification("New Notification", { body: message });
        }
      }
    };

    // Set up event listeners
    socket.on("jobcard_submit_notification", handleJobcardSubmitNotification);
    socket.on("jobcard_update_notification", handleJobcardUpdateNotification);
    socket.on(
      "jobcard_status_test_completed_notification",
      handleJobcardTestCompletedNotification
    );
    socket.on(
      "jobcard_status_closed_notification",
      handleJobcardClosedNotification
    );
    socket.on(
      "jobcard_report_delivery_notification",
      handleJobcardReportDeliveryNotification
    );
    socket.on(
      "jobcard_report_status_notification",
      handleJobcardReportStatusNotification
    );
    socket.on(
      "new_slot_booking_notification",
      handleNewSlotBookingNotification
    );
    socket.on(
      "update_slot_booking_notification",
      handleUpdateSlotBookingNotification
    );
    socket.on(
      "delete_slot_booking_notification",
      handleDeleteSlotBookingNotification
    );

    socket.on(
      "new_quote_created_notification",
      handleNewQuoteCreatedNotification
    );
    socket.on("quote_update_notification", handleQuoteUpdateNotification);

    // Cleanup function to remove event listeners
    return () => {
      socket.off(
        "jobcard_submit_notification",
        handleJobcardSubmitNotification
      );
      socket.off(
        "jobcard_update_notification",
        handleJobcardUpdateNotification
      );
      socket.off(
        "jobcard_status_test_completed_notification",
        handleJobcardTestCompletedNotification
      );
      socket.off(
        "jobcard_status_closed_notification",
        handleJobcardClosedNotification
      );
      socket.off(
        "jobcard_report_delivery_notification",
        handleJobcardReportDeliveryNotification
      );
      socket.off(
        "jobcard_report_status_notification",
        handleJobcardReportStatusNotification
      );
      socket.off(
        "update_slot_booking_notification",
        handleUpdateSlotBookingNotification
      );
      socket.off(
        "delete_slot_booking_notification",
        handleDeleteSlotBookingNotification
      );

      socket.off(
        "new_quote_created_notification",
        handleNewQuoteCreatedNotification
      );
      socket.off("quote_update_notification", handleQuoteUpdateNotification);
    };
  }, [loggedInUser, setNotifications, loggedInUserDepartment]);

  return null; // This component doesn't render anything
}
