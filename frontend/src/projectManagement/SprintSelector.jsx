import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../Pages/APIPage";

const SprintSelector = ({ open, onClose, taskId, onSuccess }) => {
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [newSprint, setNewSprint] = useState({
    sprint_number: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (open) {
      axios
        .get(`${serverBaseAddress}/api/getAllSprints`)
        .then((res) => setSprints(res.data));
    }
  }, [open]);

  const handleAssign = async () => {
    if (!selectedSprintId) return;

    try {
      await axios.post(
        `${serverBaseAddress}/api/tasks/${taskId}/move-to-sprint`,
        {
          sprint_id: selectedSprintId,
        }
      );
      onSuccess();
      onClose();
      toast.success("Sprint assigned to sprint successfully");
    } catch (error) {
      toast.error(`Error assigning task: ${error.message || "Network error"}`);
    }
  };

  const handleCreateAndAssign = async () => {
    try {
      const res = await axios.post(
        `${serverBaseAddress}/api/createSprint`,
        newSprint
      );
      const newId = res.data.sprint_id;
      await axios.post(
        `${serverBaseAddress}/api/tasks/${taskId}/move-to-sprint`,
        {
          sprint_id: newId,
        }
      );
      onSuccess();
      onClose();
      toast.success("Sprint created and assigned to task successfully");
    } catch (error) {
      toast.error(`Error creating sprint: ${error.message || "Network error"}`);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Move Task to Sprint</DialogTitle>
      <DialogContent>
        {!createMode ? (
          <>
            <TextField
              select
              label="Select Sprint"
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              fullWidth
              margin="normal"
            >
              {sprints.map((sprint) => (
                <MenuItem key={sprint.id} value={sprint.id}>
                  {sprint.sprint_number}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Can't find a sprint?
            </Typography>
            <Button onClick={() => setCreateMode(true)} variant="text">
              Create New Sprint
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Sprint Label/Number"
              fullWidth
              margin="normal"
              value={newSprint.sprint_number}
              onChange={(e) =>
                setNewSprint({ ...newSprint, sprint_number: e.target.value })
              }
            />
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: -1, mb: 1, ml: 0.5, color: "text.secondary" }}
            >
              Note: This will be used as the display name for the sprint.
            </Typography>
            <TextField
              label="Goal"
              fullWidth
              margin="normal"
              multiline
              value={newSprint.goal}
              onChange={(e) =>
                setNewSprint({ ...newSprint, goal: e.target.value })
              }
            />
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={newSprint.start_date}
              onChange={(e) =>
                setNewSprint({ ...newSprint, start_date: e.target.value })
              }
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={newSprint.end_date}
              onChange={(e) =>
                setNewSprint({ ...newSprint, end_date: e.target.value })
              }
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {createMode ? (
          <Button onClick={handleCreateAndAssign} variant="contained">
            Create & Assign
          </Button>
        ) : (
          <Button
            onClick={handleAssign}
            variant="contained"
            disabled={!selectedSprintId}
          >
            Assign to Sprint
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SprintSelector;
