import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Box,
  Avatar,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  Error,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const DashboardProjectsTable = ({ projects, tasks }) => {
  const navigate = useNavigate();

  // Department colors
  const departmentColors = {
    Reliability: "#9c27b0",
    Software: "#00bcd4",
    Administration: "#795548",
  };

  // Calculate project progress and health
  const enrichedProjects = projects.map((project) => {
    const projectTasks = tasks.filter(
      (t) => t.corresponding_project_id === project.project_id
    );
    const completedTasks = projectTasks.filter(
      (t) => t.status === "Done"
    ).length;
    const blockedTasks = projectTasks.filter(
      (t) => t.status === "Blocked"
    ).length;
    const overdueTasks = projectTasks.filter(
      (t) => dayjs().isAfter(dayjs(t.task_due_date)) && t.status !== "Done"
    ).length;

    const progress =
      projectTasks.length > 0
        ? Math.round((completedTasks / projectTasks.length) * 100)
        : 0;

    const isProjectOverdue =
      dayjs().isAfter(dayjs(project.project_end_date)) &&
      project.project_status !== "Done";

    // Determine health status
    let healthStatus = "healthy";
    let healthColor = "success";
    let healthIcon = <CheckCircle />;

    if (isProjectOverdue) {
      healthStatus = "critical";
      healthColor = "error";
      healthIcon = <Error />;
    } else if (blockedTasks > 0 || overdueTasks > 0) {
      healthStatus = "warning";
      healthColor = "warning";
      healthIcon = <Warning />;
    } else if (progress > 80) {
      healthStatus = "healthy";
      healthColor = "success";
      healthIcon = <CheckCircle />;
    } else {
      healthStatus = "normal";
      healthColor = "info";
      healthIcon = <Schedule />;
    }

    return {
      ...project,
      projectTasks,
      completedTasks,
      blockedTasks,
      overdueTasks,
      progress,
      isProjectOverdue,
      healthStatus,
      healthColor,
      healthIcon,
    };
  });

  // Sort projects by health status (critical first) and then by due date
  const sortedProjects = enrichedProjects.sort((a, b) => {
    const statusPriority = {
      critical: 1,
      warning: 2,
      normal: 3,
      healthy: 4,
    };

    if (statusPriority[a.healthStatus] !== statusPriority[b.healthStatus]) {
      return statusPriority[a.healthStatus] - statusPriority[b.healthStatus];
    }

    return dayjs(a.project_end_date).unix() - dayjs(b.project_end_date).unix();
  });

  const handleProjectClick = (projectId) => {
    navigate(`/edit_project/${projectId}`);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Projects Overview ({projects.length} Total)
        </Typography>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Health
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Project Details
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Department
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Manager
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Progress
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Tasks
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Due Date
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", bgcolor: "#f5f5f5" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProjects.map((project) => (
                <TableRow
                  key={project.project_id}
                  sx={{
                    "&:hover": { backgroundColor: "#f9f9f9" },
                    borderLeft: `4px solid ${
                      project.healthStatus === "critical"
                        ? "#f44336"
                        : project.healthStatus === "warning"
                        ? "#ff9800"
                        : project.healthStatus === "healthy"
                        ? "#4caf50"
                        : "#2196f3"
                    }`,
                  }}
                >
                  {/* Health Status */}
                  <TableCell>
                    <Tooltip title={`Project health: ${project.healthStatus}`}>
                      <Chip
                        icon={project.healthIcon}
                        label={
                          project.healthStatus.charAt(0).toUpperCase() +
                          project.healthStatus.slice(1)
                        }
                        size="small"
                        color={project.healthColor}
                        sx={{ fontWeight: "bold" }}
                      />
                    </Tooltip>
                  </TableCell>

                  {/* Project Details */}
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => handleProjectClick(project.project_id)}
                      >
                        {project.project_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {project.project_id}
                      </Typography>
                      {project.company_name && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Client: {project.company_name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Department */}
                  <TableCell>
                    <Chip
                      label={project.department}
                      size="small"
                      sx={{
                        backgroundColor: departmentColors[project.department],
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </TableCell>

                  {/* Manager */}
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {project.project_manager_name?.charAt(0) || "?"}
                      </Avatar>
                      <Typography variant="body2">
                        {project.project_manager_name || "Unassigned"}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Progress */}
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 120,
                      }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          width: 80,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor:
                              project.progress >= 80
                                ? "#4caf50"
                                : project.progress >= 50
                                ? "#ff9800"
                                : "#f44336",
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {project.progress}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {project.completedTasks}/{project.projectTasks.length}{" "}
                      tasks
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip
                      label={project.project_status}
                      size="small"
                      color={
                        project.project_status === "Done"
                          ? "success"
                          : project.project_status === "In Progress"
                          ? "primary"
                          : project.project_status === "On Hold"
                          ? "warning"
                          : "default"
                      }
                      sx={{ fontWeight: "bold" }}
                    />
                  </TableCell>

                  {/* Tasks Summary */}
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {project.projectTasks.length} total
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                        {project.blockedTasks > 0 && (
                          <Chip
                            label={`${project.blockedTasks} blocked`}
                            size="small"
                            color="error"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                        )}
                        {project.overdueTasks > 0 && (
                          <Chip
                            label={`${project.overdueTasks} overdue`}
                            size="small"
                            color="warning"
                            sx={{ fontSize: "0.7rem", height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        project.isProjectOverdue ? "error" : "text.primary"
                      }
                      sx={{
                        fontWeight: project.isProjectOverdue
                          ? "bold"
                          : "normal",
                      }}
                    >
                      {dayjs(project.project_end_date).format("MMM DD, YYYY")}
                    </Typography>
                    {project.isProjectOverdue && (
                      <Typography variant="caption" color="error">
                        Overdue by{" "}
                        {dayjs().diff(dayjs(project.project_end_date), "day")}{" "}
                        days
                      </Typography>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Tooltip title="View Project Details">
                      <IconButton
                        size="small"
                        onClick={() => handleProjectClick(project.project_id)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {projects.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">
              No projects found. Create your first project to get started!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardProjectsTable;
