import React, { createContext, useState } from "react";

const NotificationContext = createContext();

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [newNotificationReceived, setNewNotificationReceived] = useState(false);

  const addNotification = (message, receivedAt) => {
    const newNotification = {
      message,
      receivedAt,
    };

    setNotifications((prevNotifications) => {
      const updatedNotifications = [newNotification, ...prevNotifications];
      return updatedNotifications;
    });

    // Trigger re-fetch of notifications by toggling the state
    setNewNotificationReceived((prevState) => !prevState);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setNotifications,
        addNotification,
        newNotificationReceived,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export { NotificationContext, NotificationProvider };
