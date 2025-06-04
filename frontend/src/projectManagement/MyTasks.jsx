import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Grid,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Block,
  Schedule,
  Assignment,
  TrendingUp,
  CalendarToday,
  Priority,
} from "@mui/icons-material";
import { UserContext } from "../Pages/UserContext";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import EmptyCard from "../common/EmptyCard";
import useProjectManagementStore from "./ProjectStore";

const MyTasks = () => {
  const navigate = useNavigate();
  const { loggedInUser, loggedInUserDepartment, loggedInUserId } =
    useContext(UserContext);

  const [myTasks, setMyTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchInputText, setSearchInputText] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    onHold: 0,
    overdue: 0,
  });

  // Fetch tasks assigned to the logged-in user
  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverBaseAddress}/api/getMyTasks/${loggedInUserId}`
      );

      const tasks = response.data || [];
      setMyTasks(tasks);
      setFilteredTasks(tasks);
      calculateTaskStats(tasks);
    } catch (error) {
      console.error("Error fetching my tasks:", error);
      setMyTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate task statistics
  const calculateTaskStats = (tasks) => {
    const stats = {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "To Do").length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      done: tasks.filter((task) => task.status === "Done").length,
      onHold: tasks.filter((task) => task.status === "On Hold").length,
      overdue: tasks.filter((task) => isOverdue(task.task_due_date)).length,
    };
    setTaskStats(stats);
  };

  // Filter tasks based on tab selection
  const filterTasksByStatus = (status) => {
    if (status === "All") {
      return myTasks;
    }
    return myTasks.filter((task) => task.status === status);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const tabLabels = [
      "All",
      "To Do",
      "In Progress",
      "Done",
      "On Hold",
      "Overdue",
    ];
    const selectedStatus = tabLabels[newValue];
    const filtered = filterTasksByStatus(selectedStatus);
    setFilteredTasks(
      searchInputText
        ? filterTasksBySearch(filtered, searchInputText)
        : filtered
    );
  };

  // Search functionality
  const filterTasksBySearch = (tasks, searchValue) => {
    if (!searchValue) return tasks;
    return tasks.filter((task) =>
      Object.values(task).some(
        (value) =>
          value != null &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      )
    );
  };

  const onChangeOfSearchInput = (e) => {
    const searchText = e.target.value;
    setSearchInputText(searchText);

    const tabLabels = [
      "All",
      "To Do",
      "In Progress",
      "Done",
      "On Hold",
      "Overdue",
    ];
    const selectedStatus = tabLabels[tabValue];
    const statusFiltered = filterTasksByStatus(selectedStatus);
    const searchFiltered = filterTasksBySearch(statusFiltered, searchText);
    setFilteredTasks(searchFiltered);
  };

  const onClearSearchInput = () => {
    setSearchInputText("");
    const tabLabels = [
      "All",
      "To Do",
      "In Progress",
      "Done",
      "On Hold",
      "Overdue",
    ];
    const selectedStatus = tabLabels[tabValue];
    setFilteredTasks(filterTasksByStatus(selectedStatus));
  };

  // Get priority color
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

  // Get status icon and color
  const getStatusConfig = (status) => {
    switch (status) {
      case "To Do":
        return { icon: <Schedule />, color: "#2196f3", bgColor: "#e3f2fd" };
      case "In Progress":
        return { icon: <PlayArrow />, color: "#ff9800", bgColor: "#fff3e0" };
      case "Done":
        return { icon: <CheckCircle />, color: "#4caf50", bgColor: "#e8f5e8" };
      case "On Hold":
        return { icon: <Block />, color: "#f44336", bgColor: "#ffebee" };
      case "Overdue":
        return { icon: <TrendingUp />, color: "#f44336", bgColor: "#ffebee" };
      default:
        return { icon: <Assignment />, color: "#9e9e9e", bgColor: "#f5f5f5" };
    }
  };

  // Check if task is overdue
  const isOverdue = (dueDate, status) => {
    if (status === "Done") return false;
    return dayjs().isAfter(dayjs(dueDate));
  };

  // Handle task click
  const handleTaskClick = (taskId) => {
    navigate(`/edit_task/${taskId}`);
  };

  useEffect(() => {
    fetchMyTasks();
  }, [loggedInUserId]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: "center" }}>
          Loading your tasks...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* <Box sx={{ p: 3, backgroundColor: "#ffffff" }}> */}
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" color="text.secondary">
          Welcome back, {loggedInUser}! Here are your assigned tasks.
        </Typography>
      </Box>

      {/* Task Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f8f9fa" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {taskStats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#1976d2" }}
            >
              {taskStats.todo}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              To Do
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#f57c00" }}
            >
              {taskStats.inProgress}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e8" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#388e3c" }}
            >
              {taskStats.done}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#ffebee" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#d32f2f" }}
            >
              {taskStats.onHold}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              On Hold
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#FF2400" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#ffffff" }}
            >
              {taskStats.overdue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overdue
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <SearchBar
          placeholder="Search your tasks..."
          searchInputText={searchInputText}
          onChangeOfSearchInput={onChangeOfSearchInput}
          onClearSearchInput={onClearSearchInput}
        />
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${taskStats.total})`} />
          <Tab label={`To Do (${taskStats.todo})`} />
          <Tab label={`In Progress (${taskStats.inProgress})`} />
          <Tab label={`Done (${taskStats.done})`} />
          <Tab label={`On Hold (${taskStats.onHold})`} />
        </Tabs>
      </Box>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyCard message="No tasks found. Great job staying on top of everything!" />
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map((task) => {
            const statusConfig = getStatusConfig(task.status);
            const overdue = isOverdue(task.task_due_date, task.status);

            return (
              <Grid item xs={12} md={6} lg={4} key={task.task_id}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                    },
                    border: overdue ? "2px solid #f44336" : "1px solid #e0e0e0",
                  }}
                  onClick={() => handleTaskClick(task.task_id)}
                >
                  <CardContent>
                    {/* Header with status and priority */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Chip
                        icon={statusConfig.icon}
                        label={task.status}
                        size="small"
                        sx={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                          fontWeight: "bold",
                        }}
                      />
                      <Chip
                        label={task.priority}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(task.priority),
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </Box>

                    {/* Task Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 1,
                        fontWeight: "bold",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {task.title}
                    </Typography>

                    {/* Project ID */}
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ mb: 1, fontWeight: "medium" }}
                    >
                      Project: {task.corresponding_project_id}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {task.description}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    {/* Task Details */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {/* Due Date */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CalendarToday
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography
                          variant="body2"
                          color={overdue ? "error" : "text.secondary"}
                        >
                          Due:{" "}
                          {dayjs(task.task_due_date).format("MMM DD, YYYY")}
                          {overdue && (
                            <Chip
                              label="OVERDUE"
                              size="small"
                              color="error"
                              sx={{ ml: 1, fontSize: "0.7rem" }}
                            />
                          )}
                        </Typography>
                      </Box>

                      {/* Story Points and Hours */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Story Points: {task.story_points || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Est. Hours: {task.estimated_hours || "N/A"}
                        </Typography>
                      </Box>

                      {/* Progress Bar for In Progress tasks */}
                      {task.status === "In Progress" &&
                        task.estimated_hours &&
                        task.actual_hours && (
                          <Box sx={{ mt: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="caption">
                                Progress
                              </Typography>
                              <Typography variant="caption">
                                {Math.round(
                                  (task.actual_hours / task.estimated_hours) *
                                    100
                                )}
                                %
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(
                                (task.actual_hours / task.estimated_hours) *
                                  100,
                                100
                              )}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default MyTasks;
