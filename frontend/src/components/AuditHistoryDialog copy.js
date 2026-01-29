import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import dayjs from "dayjs";
import { serverBaseAddress } from "../Pages/APIPage";

/**
 * Audit History Dialog Component
 * Displays complete change log for a specific Job Card (TS1 or TS2)
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Close handler
 * @param {string} jcNumber - Job Card number to fetch history for
 */
export default function AuditHistoryDialog({ open, onClose, jcNumber }) {
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch audit trail when dialog opens
  useEffect(() => {
    if (open && jcNumber) {
      fetchAuditTrail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jcNumber]);

  const fetchAuditTrail = async () => {
    setLoading(true);
    setError(null);

    try {
      // URL encode the JC number to handle slashes (e.g., 2025-26/10-005)
      const encodedJcNumber = encodeURIComponent(jcNumber);
      const response = await axios.get(
        `${serverBaseAddress}/api/jobcard/audittrail/${encodedJcNumber}`
      );

      if (response.data.success) {
        setAuditTrail(response.data.auditTrail);
      } else {
        setError("Failed to fetch audit history");
      }
    } catch (err) {
      console.error("Error fetching audit trail:", err);
      setError("Error loading audit history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return dayjs(dateString).format("DD-MMM-YYYY HH:mm");
  };

  // Get color for action type chip
  const getActionColor = (actionType) => {
    switch (actionType) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "error";
      case "STATUS_CHANGE":
        return "warning";
      default:
        return "default";
    }
  };

  // Format field name for display (convert snake_case to Title Case)
  const formatFieldName = (fieldName) => {
    if (!fieldName) return "-";
    return fieldName
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Format table name for display
  const formatTableName = (tableName) => {
    if (tableName === "bea_jobcards") return "Main JC";
    if (tableName === "tests_details") return "Test Details";
    if (tableName === "eut_details") return "EUT Details";
    if (tableName === "jc_tests") return "Tests";
    return tableName;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6" align="center">
            Change History - JC {jcNumber}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box p={2}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : auditTrail.length === 0 ? (
          <Box p={2}>
            <Typography color="textSecondary">
              No change history available for this Job Card.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>Date & Time</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Action</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Section</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Field</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Old Value</strong>
                  </TableCell>
                  <TableCell>
                    <strong>New Value</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Changed By</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Role</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTrail.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(entry.changed_at)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action_type}
                        color={getActionColor(entry.action_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatTableName(entry.table_name)}</TableCell>
                    <TableCell>{formatFieldName(entry.field_name)}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={entry.old_value || ""}
                    >
                      {entry.old_value || "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight:
                          entry.action_type === "STATUS_CHANGE"
                            ? "bold"
                            : "normal",
                      }}
                      title={entry.new_value || ""}
                    >
                      {entry.new_value || "-"}
                    </TableCell>
                    <TableCell>{entry.changed_by}</TableCell>
                    <TableCell>{entry.user_role || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {auditTrail.length > 0 && (
          <Box
            mt={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="textSecondary">
              Total Changes: {auditTrail.length}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
