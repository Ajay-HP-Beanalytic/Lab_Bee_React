import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import { serverBaseAddress } from "../Pages/APIPage";
import useProjectManagementStore from "./ProjectStore";
import dayjs from "dayjs";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { UserContext } from "../Pages/UserContext";

const columns = ["To Do", "In Progress", "Done", "On Hold"];
const columnColors = {
  "To Do": "#e3f2fd", // Light Blue
  "In Progress": "#fff9c4", // Light Yellow
  Done: "#c8e6c9", // Light Green
  "On Hold": "#ffcdd2", // Light Red
};
const cardBackgroundColor = "#ffffff"; // White for cards

const KanbanSheet = () => {
  const navigate = useNavigate();

  const { loggedInUserDepartment } = useContext(UserContext);

  const [departmentWiseTasks, setDepartmentWiseTasks] = useState({});

  const kanbanSheetData = useProjectManagementStore(
    (state) => state.allTasksData.kanbanSheetData
  );

  console.log("kanbanSheetData", kanbanSheetData);
  const setKanbanSheetData = useProjectManagementStore(
    (state) => state.setKanbanSheetData
  );

  useEffect(() => {
    if (!kanbanSheetData || !loggedInUserDepartment) return;

    if (loggedInUserDepartment === "Administration") {
      setDepartmentWiseTasks(kanbanSheetData);
    } else {
      const filtered = {};
      Object.keys(kanbanSheetData).forEach((status) => {
        filtered[status] = kanbanSheetData[status].filter(
          (task) => task.department === loggedInUserDepartment
        );
      });
      setDepartmentWiseTasks(filtered);
    }
  }, [kanbanSheetData, loggedInUserDepartment]);

  const handleDragEnd = async ({ source, destination }) => {
    if (!destination) return;
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (sourceCol === destCol) return;

    const movedTask = departmentWiseTasks[sourceCol][source.index];
    if (!movedTask) return;

    await axios.post(`${serverBaseAddress}/api/updateTaskStatus`, {
      task_id: movedTask.id,
      status: destCol,
    });

    const updated = { ...departmentWiseTasks };
    updated[sourceCol] = [...updated[sourceCol]];
    updated[destCol] = [...(updated[destCol] || [])];

    updated[sourceCol].splice(source.index, 1);
    updated[destCol].splice(destination.index, 0, movedTask);
    setKanbanSheetData(updated); // If you’re updating Zustand store
  };

  const [openTaskViewDialog, setOpenTaskViewDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const handleViewTask = (taskId) => {
    setSelectedTaskId(taskId);
    setOpenTaskViewDialog(true);
  };

  return (
    <>
      {/* <Paper sx={{ padding: "20px" }}> */}
      <Box
        sx={{
          mb: 2,
          mt: 1,
        }}
      >
        <h2>Status Wise Tasks</h2>
      </Box>
      <SearchBar placeholder="Search Tasks" />

      {Object.keys(kanbanSheetData || {}).length === 0 ? (
        <EmptyCard message="No Data Found." />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box display={"flex"} gap={2} mt={1} sx={{ width: "100%" }}>
            {columns.map((col) => (
              <Droppable
                droppableId={col}
                key={col}
                sx={{ width: "100%", backgroundColor: "red" }}
              >
                {(provided) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      backgroundColor: columnColors[col],
                      borderRadius: "8px",
                      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                      display: "flex",
                      flexDirection: "column",
                      width: 500,
                      minHeight: 400,
                      p: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        p: 1,
                        backgroundColor: "rgba(0,0,0,0.05)",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      {col}
                    </Typography>
                    {departmentWiseTasks[col]?.map((task, index) => (
                      <Draggable
                        draggableId={task.id.toString()}
                        index={index}
                        key={task.id}
                      >
                        {(provided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              p: 1.5,
                              my: 1,
                              borderRadius: "4px",
                              backgroundColor: cardBackgroundColor,
                              boxShadow: "0px 1px 3px rgba(0,0,0,0.15)",
                            }}
                          >
                            <Typography>
                              <span style={{ fontWeight: "bold" }}>
                                Title:{" "}
                              </span>
                              <span>{task.title}</span>
                            </Typography>
                            <Typography>
                              <span style={{ fontWeight: "bold" }}>
                                Assigned To:{" "}
                              </span>
                              <span>{task.assigned_to_name}</span>
                            </Typography>
                            <Typography>
                              <span style={{ fontWeight: "bold" }}>
                                Priority:{" "}
                              </span>
                              <span>{task.priority}</span>
                            </Typography>
                            <Typography>
                              <span style={{ fontWeight: "bold" }}>
                                Due Date:{" "}
                              </span>
                              <span>
                                {dayjs(task.task_due_date).format("DD-MM-YYYY")}
                              </span>
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end", // Aligns button to the right
                                mt: 1, // Adds some margin top to the button
                              }}
                            >
                              <Button
                                // onClick={() => handleViewTask(task.id)}
                                onClick={() => handleViewTask(task)}
                                size="medium"
                                startIcon={<VisibilityIcon />}
                              >
                                Show
                              </Button>
                            </Box>
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Paper>
                )}
              </Droppable>
            ))}
          </Box>
        </DragDropContext>
      )}
      {/* </Paper> */}

      <TaskDetailCard
        open={openTaskViewDialog}
        onClose={() => setOpenTaskViewDialog(false)}
        task={selectedTaskId}
        onUpdate={() => navigate(`/edit_task/${selectedTaskId.task_id}`)}
      />
    </>
  );
};

export default KanbanSheet;

const TaskDetailCard = ({ open, onClose, task, onUpdate }) => {
  const actionButtonStyle = {
    borderRadius: 1,
    bgcolor: "orange",
    color: "white",
    borderColor: "black",
    padding: { xs: "8px 16px", md: "6px 12px" },
    fontSize: { xs: "0.875rem", md: "1rem" },
    mt: "10px",
    mb: "10px",
  };

  return (
    <Paper>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Task Details</DialogTitle>

        <DialogContent>
          {task && (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Task ID:</b>{" "}
                <span style={{ fontWeight: 400 }}>{task.task_id}</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Title:</b>{" "}
                <span style={{ fontWeight: 400 }}>{task.title}</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Description:</b>{" "}
                <span style={{ fontWeight: 400 }}>{task.description}</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Assigned To:</b>{" "}
                <span style={{ fontWeight: 400 }}>{task.assigned_to_name}</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Priority:</b>{" "}
                <span style={{ fontWeight: 400 }}>{task.priority}</span>
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Due Date:</b>{" "}
                <span style={{ fontWeight: 400 }}>
                  {dayjs(task.task_due_date).format("DD-MM-YYYY")}
                </span>
              </Typography>
              {/* <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Status:</b>{" "}
                <span style={{ fontWeight: 400 }}>{task.status}</span>
              </Typography> */}
              <Typography variant="body1" sx={{ mb: 1 }}>
                <b>Last Updated By:</b>{" "}
                <span style={{ fontWeight: 400 }}>
                  {task.last_updated_by_name}
                </span>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            sx={actionButtonStyle}
            variant="contained"
            color="primary"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            sx={actionButtonStyle}
            variant="contained"
            color="primary"
            onClick={onUpdate}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
