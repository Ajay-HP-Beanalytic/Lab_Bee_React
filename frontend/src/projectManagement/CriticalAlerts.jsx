import { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Badge,
} from "@mui/material";
import {
  Warning,
  Error,
  ExpandMore,
  ExpandLess,
  Block,
} from "@mui/icons-material";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import dayjs from "dayjs";

const CriticalAlerts = ({ compact = false }) => {
  const [alerts, setAlerts] = useState([]);
  const [expanded, setExpanded] = useState(!compact);
  const [loading, setLoading] = useState(true);

  const fetchCriticalAlerts = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getCriticalAlerts`
      );
      setAlerts(response.data || []);
    } catch (error) {
      console.error("Error fetching critical alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriticalAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchCriticalAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case "overdue_task":
      case "project_overdue":
        return <Error color="error" />;
      case "blocked_task":
        return <Block color="warning" />;
      default:
        return <Warning color="warning" />;
    }
  };

  const getAlertSeverity = (priority) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      default:
        return "info";
    }
  };

  const highPriorityAlerts = alerts.filter(
    (alert) => alert.priority === "High"
  );
  const otherAlerts = alerts.filter((alert) => alert.priority !== "High");

  if (loading) {
    return null;
  }

  if (alerts.length === 0) {
    return compact ? null : (
      <Alert severity="success" sx={{ mb: 2 }}>
        <AlertTitle>All Good!</AlertTitle>
        No critical alerts at this time.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {compact ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            p: 1,
            borderRadius: 1,
            bgcolor: alerts.length > 0 ? "#fff3e0" : "#e8f5e8",
            border: `1px solid ${alerts.length > 0 ? "#ff9800" : "#4caf50"}`,
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Badge badgeContent={alerts.length} color="error" sx={{ mr: 2 }}>
            <Warning color={alerts.length > 0 ? "warning" : "success"} />
          </Badge>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {alerts.length > 0
              ? `${alerts.length} Critical Alert${alerts.length > 1 ? "s" : ""}`
              : "No Alerts"}
          </Typography>
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Critical Alerts ({alerts.length})
          </Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      )}

      <Collapse in={expanded}>
        <Box sx={{ mt: compact ? 1 : 0 }}>
          {/* High Priority Alerts */}
          {highPriorityAlerts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                color="error"
                sx={{ mb: 1, fontWeight: "bold" }}
              >
                High Priority
              </Typography>
              {highPriorityAlerts.map((alert, index) => (
                <Alert
                  key={index}
                  severity={getAlertSeverity(alert.priority)}
                  sx={{ mb: 1 }}
                  icon={getAlertIcon(alert.alert_type)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Project: {alert.project_id} • Assigned to:{" "}
                        {alert.assigned_to}
                      </Typography>
                      {alert.due_date && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Due: {dayjs(alert.due_date).format("MMM DD, YYYY")}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={alert.priority}
                      size="small"
                      color={getAlertSeverity(alert.priority)}
                    />
                  </Box>
                </Alert>
              ))}
            </Box>
          )}

          {/* Other Alerts */}
          {otherAlerts.length > 0 && (
            <Box>
              {!compact && (
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  Other Alerts
                </Typography>
              )}
              {otherAlerts.slice(0, compact ? 3 : 10).map((alert, index) => (
                <Alert
                  key={index}
                  severity={getAlertSeverity(alert.priority)}
                  sx={{ mb: 1 }}
                  icon={getAlertIcon(alert.alert_type)}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="body2">{alert.message}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Project: {alert.project_id}
                        {alert.assigned_to && ` • ${alert.assigned_to}`}
                      </Typography>
                    </Box>
                    <Chip
                      label={alert.priority}
                      size="small"
                      color={getAlertSeverity(alert.priority)}
                    />
                  </Box>
                </Alert>
              ))}
              {compact && otherAlerts.length > 3 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "center", mt: 1 }}
                >
                  +{otherAlerts.length - 3} more alerts
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default CriticalAlerts;
