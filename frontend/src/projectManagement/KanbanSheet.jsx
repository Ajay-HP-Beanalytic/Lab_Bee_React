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
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
  CardContent,
  CardActions,
  AvatarGroup,
} from "@mui/material";
import {
  VisibilityOutlined,
  EditOutlined,
  AccessTimeOutlined,
  PersonOutlined,
  FlagOutlined,
  AssignmentOutlined,
  CalendarTodayOutlined,
  MoreVertOutlined,
  DragIndicatorOutlined,
} from "@mui/icons-material";
import { serverBaseAddress } from "../Pages/APIPage";
import useProjectManagementStore from "./ProjectStore";
import dayjs from "dayjs";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import { UserContext } from "../Pages/UserContext";

const columns = ["To Do", "In Progress", "Done", "On Hold"];

// Enhanced column styling with gradients and modern design
const columnStyles = {
  "To Do": {
    background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
    headerColor: "#1976d2",
    borderColor: "#2196f3",
    icon: "📋",
  },
  "In Progress": {
    background: "linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)",
    headerColor: "#f57c00",
    borderColor: "#ff9800",
    icon: "⚡",
  },
  Done: {
    background: "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)",
    headerColor: "#388e3c",
    borderColor: "#4caf50",
    icon: "✅",
  },
  "On Hold": {
    background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
    headerColor: "#d32f2f",
    borderColor: "#f44336",
    icon: "🚫",
  },
};

const KanbanSheet = () => {
  const navigate = useNavigate();
  const { loggedInUserDepartment } = useContext(UserContext);

  const [departmentWiseTasks, setDepartmentWiseTasks] = useState({});
  const [searchInputText, setSearchInputText] = useState("");
  const [filteredTasks, setFilteredTasks] = useState({});

  const kanbanSheetData = useProjectManagementStore(
    (state) => state.allTasksData.kanbanSheetData
  );

  const setKanbanSheetData = useProjectManagementStore(
    (state) => state.setKanbanSheetData
  );

  // Filter tasks by department
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

  // Search functionality
  useEffect(() => {
    if (!searchInputText) {
      setFilteredTasks(departmentWiseTasks);
      return;
    }

    const filtered = {};
    Object.keys(departmentWiseTasks).forEach((status) => {
      filtered[status] = departmentWiseTasks[status].filter((task) =>
        Object.values(task).some(
          (value) =>
            value != null &&
            value
              .toString()
              .toLowerCase()
              .includes(searchInputText.toLowerCase())
        )
      );
    });
    setFilteredTasks(filtered);
  }, [departmentWiseTasks, searchInputText]);

  const handleDragEnd = async ({ source, destination }) => {
    if (!destination) return;
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    if (sourceCol === destCol) return;

    const movedTask = (filteredTasks[sourceCol] || [])[source.index];
    if (!movedTask) return;

    try {
      await axios.post(`${serverBaseAddress}/api/updateTaskStatus`, {
        task_id: movedTask.id,
        status: destCol,
      });

      const updated = { ...filteredTasks };
      updated[sourceCol] = [...(updated[sourceCol] || [])];
      updated[destCol] = [...(updated[destCol] || [])];

      updated[sourceCol].splice(source.index, 1);
      updated[destCol].splice(destination.index, 0, {
        ...movedTask,
        status: destCol,
      });

      setFilteredTasks(updated);
      setKanbanSheetData(updated);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const [openTaskViewDialog, setOpenTaskViewDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const handleViewTask = (task) => {
    setSelectedTaskId(task);
    setOpenTaskViewDialog(true);
  };

  const onChangeOfSearchInput = (e) => {
    setSearchInputText(e.target.value);
  };

  const onClearSearchInput = () => {
    setSearchInputText("");
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#f44336";
      case "medium":
        return "#ff9800";
      case "low":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  // Calculate task statistics
  const getColumnStats = (columnTasks) => {
    const totalTasks = columnTasks?.length || 0;
    const highPriority =
      columnTasks?.filter((t) => t.priority === "High").length || 0;
    const overdue =
      columnTasks?.filter(
        (t) => dayjs().isAfter(dayjs(t.task_due_date)) && t.status !== "Done"
      ).length || 0;

    return { totalTasks, highPriority, overdue };
  };

  // Check if task is overdue
  const isTaskOverdue = (dueDate, status) => {
    if (status === "Done") return false;
    return dayjs().isAfter(dayjs(dueDate));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
          Kanban Board
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Drag and drop tasks to update their status
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          placeholder="Search tasks..."
          searchInputText={searchInputText}
          onChangeOfSearchInput={onChangeOfSearchInput}
          onClearSearchInput={onClearSearchInput}
        />
      </Box>

      {Object.keys(filteredTasks || {}).length === 0 ? (
        <EmptyCard message="No tasks found. Create your first task to get started!" />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Box
            sx={{
              display: "flex",
              gap: 3,
              overflowX: "auto",
              minHeight: "70vh",
              pb: 2,
            }}
          >
            {columns.map((col) => {
              const columnTasks = filteredTasks[col] || [];
              const stats = getColumnStats(columnTasks);
              const columnStyle = columnStyles[col];

              return (
                <Droppable droppableId={col} key={col}>
                  {(provided, snapshot) => (
                    <Paper
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      elevation={snapshot.isDraggingOver ? 8 : 2}
                      sx={{
                        background: columnStyle.background,
                        borderRadius: 3,
                        minWidth: 320,
                        maxWidth: 320,
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                        border: `2px solid ${
                          snapshot.isDraggingOver
                            ? columnStyle.borderColor
                            : "transparent"
                        }`,
                        transform: snapshot.isDraggingOver
                          ? "scale(1.02)"
                          : "scale(1)",
                      }}
                    >
                      {/* Column Header */}
                      <Box
                        sx={{
                          p: 2,
                          background: `linear-gradient(135deg, ${columnStyle.headerColor} 0%, ${columnStyle.borderColor} 100%)`,
                          color: "white",
                          borderRadius: "12px 12px 0 0",
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold" }}
                            >
                              {columnStyle.icon} {col}
                            </Typography>
                            <Badge
                              badgeContent={stats.totalTasks}
                              color="secondary"
                              sx={{
                                "& .MuiBadge-badge": {
                                  backgroundColor: "rgba(255,255,255,0.9)",
                                  color: columnStyle.headerColor,
                                  fontWeight: "bold",
                                },
                              }}
                            />
                          </Box>

                          {/* Column Statistics */}
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {stats.highPriority > 0 && (
                              <Chip
                                icon={<FlagOutlined />}
                                label={stats.highPriority}
                                size="small"
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.2)",
                                  color: "white",
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                            {stats.overdue > 0 && (
                              <Chip
                                icon={<AccessTimeOutlined />}
                                label={stats.overdue}
                                size="small"
                                sx={{
                                  bgcolor: "rgba(255,87,34,0.8)",
                                  color: "white",
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Tasks Container */}
                      <Box
                        sx={{
                          flex: 1,
                          p: 2,
                          minHeight: 200,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {columnTasks.map((task, index) => {
                          const overdue = isTaskOverdue(
                            task.task_due_date,
                            task.status
                          );

                          return (
                            <Draggable
                              draggableId={task.id.toString()}
                              index={index}
                              key={task.id}
                            >
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  elevation={snapshot.isDragging ? 8 : 2}
                                  sx={{
                                    backgroundColor: "white",
                                    borderRadius: 2,
                                    transition: "all 0.3s ease",
                                    transform: snapshot.isDragging
                                      ? "rotate(5deg)"
                                      : "rotate(0deg)",
                                    boxShadow: snapshot.isDragging
                                      ? "0 8px 25px rgba(0,0,0,0.15)"
                                      : "0 2px 8px rgba(0,0,0,0.1)",
                                    border: overdue
                                      ? "2px solid #f44336"
                                      : "1px solid #e0e0e0",
                                    "&:hover": {
                                      boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
                                      transform: "translateY(-2px)",
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{ p: 2, "&:last-child": { pb: 2 } }}
                                  >
                                    {/* Task Header */}
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 1,
                                      }}
                                    >
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          variant="subtitle2"
                                          sx={{
                                            fontWeight: "bold",
                                            color: "#1a1a1a",
                                            lineHeight: 1.3,
                                            mb: 0.5,
                                          }}
                                        >
                                          {task.title}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: "primary.main",
                                            backgroundColor: "primary.50",
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            fontWeight: "medium",
                                          }}
                                        >
                                          {task.project_id}
                                        </Typography>
                                      </Box>

                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <IconButton
                                          size="small"
                                          {...provided.dragHandleProps}
                                          sx={{ color: "text.secondary" }}
                                        >
                                          <DragIndicatorOutlined fontSize="small" />
                                        </IconButton>
                                        <Chip
                                          label={task.priority}
                                          size="small"
                                          sx={{
                                            backgroundColor: getPriorityColor(
                                              task.priority
                                            ),
                                            color: "white",
                                            fontWeight: "bold",
                                            fontSize: "0.7rem",
                                            height: 20,
                                          }}
                                        />
                                      </Box>
                                    </Box>

                                    {/* Task Details */}
                                    <Box sx={{ mb: 2 }}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                          mb: 1,
                                        }}
                                      >
                                        <PersonOutlined
                                          sx={{
                                            fontSize: 16,
                                            color: "text.secondary",
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {task.assigned_to_name}
                                        </Typography>
                                      </Box>

                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <CalendarTodayOutlined
                                          sx={{
                                            fontSize: 16,
                                            color: overdue
                                              ? "error.main"
                                              : "text.secondary",
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          color={
                                            overdue
                                              ? "error.main"
                                              : "text.secondary"
                                          }
                                          sx={{
                                            fontWeight: overdue
                                              ? "bold"
                                              : "normal",
                                          }}
                                        >
                                          {dayjs(task.task_due_date).format(
                                            "MMM DD, YYYY"
                                          )}
                                          {overdue && (
                                            <Chip
                                              label="OVERDUE"
                                              size="small"
                                              color="error"
                                              sx={{
                                                ml: 1,
                                                fontSize: "0.6rem",
                                                height: 16,
                                              }}
                                            />
                                          )}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    {/* Progress Bar for In Progress tasks */}
                                    {task.status === "In Progress" &&
                                      task.estimated_hours &&
                                      task.actual_hours && (
                                        <Box sx={{ mb: 2 }}>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              mb: 0.5,
                                            }}
                                          >
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              Progress
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              {Math.round(
                                                (task.actual_hours /
                                                  task.estimated_hours) *
                                                  100
                                              )}
                                              %
                                            </Typography>
                                          </Box>
                                          <LinearProgress
                                            variant="determinate"
                                            value={Math.min(
                                              (task.actual_hours /
                                                task.estimated_hours) *
                                                100,
                                              100
                                            )}
                                            sx={{
                                              height: 6,
                                              borderRadius: 3,
                                              backgroundColor: "#e0e0e0",
                                              "& .MuiLinearProgress-bar": {
                                                borderRadius: 3,
                                                backgroundColor:
                                                  columnStyle.headerColor,
                                              },
                                            }}
                                          />
                                        </Box>
                                      )}
                                  </CardContent>

                                  {/* Card Actions */}
                                  <CardActions
                                    sx={{
                                      px: 2,
                                      pb: 2,
                                      pt: 0,
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                      <Tooltip title="View Details">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewTask(task);
                                          }}
                                          sx={{
                                            backgroundColor: "primary.50",
                                            color: "primary.main",
                                            "&:hover": {
                                              backgroundColor: "primary.100",
                                            },
                                          }}
                                        >
                                          <VisibilityOutlined fontSize="small" />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Edit Task">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                              `/edit_task/${task.task_id}`
                                            );
                                          }}
                                          sx={{
                                            backgroundColor: "secondary.50",
                                            color: "secondary.main",
                                            "&:hover": {
                                              backgroundColor: "secondary.100",
                                            },
                                          }}
                                        >
                                          <EditOutlined fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>

                                    {/* Story Points Badge */}
                                    {task.story_points && (
                                      <Chip
                                        icon={<AssignmentOutlined />}
                                        label={`${task.story_points} SP`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: "0.7rem", height: 24 }}
                                      />
                                    )}
                                  </CardActions>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              py: 4,
                              color: "text.secondary",
                              opacity: 0.6,
                            }}
                          >
                            <Typography variant="body2">
                              No tasks in {col}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}
                </Droppable>
              );
            })}
          </Box>
        </DragDropContext>
      )}

      <TaskDetailDialog
        open={openTaskViewDialog}
        onClose={() => setOpenTaskViewDialog(false)}
        task={selectedTaskId}
        onUpdate={() => navigate(`/edit_task/${selectedTaskId?.task_id}`)}
      />
    </Box>
  );
};

// Enhanced Task Detail Dialog Component
const TaskDetailDialog = ({ open, onClose, task, onUpdate }) => {
  if (!task) return null;

  const overdue =
    dayjs().isAfter(dayjs(task.task_due_date)) && task.status !== "Done";

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#f44336";
      case "medium":
        return "#ff9800";
      case "low":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "To Do":
        return "#2196f3";
      case "In Progress":
        return "#ff9800";
      case "Done":
        return "#4caf50";
      case "On Hold":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Task Details
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={task.priority}
              size="small"
              sx={{
                backgroundColor: getPriorityColor(task.priority),
                color: "white",
                fontWeight: "bold",
              }}
            />
            <Chip
              label={task.status}
              size="small"
              sx={{
                backgroundColor: getStatusColor(task.status),
                color: "white",
                fontWeight: "bold",
              }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Task ID & Title */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: "bold" }}
            >
              TASK ID
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              {task.task_id}
            </Typography>
          </Box>

          <Divider />

          {/* Title */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: "bold" }}
            >
              TITLE
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
              {task.title}
            </Typography>
          </Box>

          {/* Description */}
          {task.description && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold" }}
              >
                DESCRIPTION
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.primary", lineHeight: 1.6 }}
              >
                {task.description}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Assignment and Due Details */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold" }}
              >
                ASSIGNED DATE
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {task.task_assigned_date
                  ? dayjs(task.task_assigned_date).format("MMM DD, YYYY")
                  : "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold" }}
              >
                DUE DATE
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: overdue ? "error.main" : "text.primary",
                  fontWeight: overdue ? "bold" : "normal",
                  mt: 0.5,
                }}
              >
                {dayjs(task.task_due_date).format("MMM DD, YYYY")}
                {overdue && " (OVERDUE)"}
              </Typography>
            </Box>
          </Box>

          {/* Assigned To & Last Updated */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold" }}
              >
                ASSIGNED TO
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center", // centers horizontally
                  gap: 1,
                  mt: 0.5,
                }}
              >
                <Typography variant="body2">{task.assigned_to_name}</Typography>
              </Box>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold" }}
              >
                LAST UPDATED BY
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {task.last_updated_by_name}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          onClick={onUpdate}
          variant="contained"
          sx={{
            borderRadius: 2,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          Edit Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KanbanSheet;
