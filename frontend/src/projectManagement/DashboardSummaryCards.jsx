import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  Assignment,
  PlayArrow,
  Schedule,
  Pause,
  CheckCircle,
  TrendingUp,
  Group,
  Timeline,
} from "@mui/icons-material";

const DashboardSummaryCards = ({ projectsData, tasksData, membersData }) => {
  // Calculate project status counts
  const projectStatusCounts = {
    total: projectsData?.length || 0,
    inProgress:
      projectsData?.filter((p) => p.project_status === "In Progress").length ||
      0,
    completed:
      projectsData?.filter((p) => p.project_status === "Done").length || 0,
    onHold:
      projectsData?.filter((p) => p.project_status === "On Hold").length || 0,
    planning:
      projectsData?.filter((p) => p.project_status === "Planning").length || 0,
  };

  // Calculate task status counts
  const taskStatusCounts = {
    total: tasksData?.length || 0,
    todo: tasksData?.filter((t) => t.status === "To Do").length || 0,
    inProgress:
      tasksData?.filter((t) => t.status === "In Progress").length || 0,
    completed: tasksData?.filter((t) => t.status === "Done").length || 0,
    blocked: tasksData?.filter((t) => t.status === "Blocked").length || 0,
  };

  // Calculate team metrics
  const teamMetrics = {
    totalMembers: membersData?.length || 0,
    activeMembers:
      membersData?.filter((m) =>
        tasksData?.some((t) => t.assigned_to === m.id && t.status !== "Done")
      ).length || 0,
    reliabilityMembers:
      membersData?.filter((m) => m.department === "Reliability").length || 0,
    softwareMembers:
      membersData?.filter((m) => m.department === "Software").length || 0,
  };

  // Calculate completion rates
  const projectCompletionRate =
    projectStatusCounts.total > 0
      ? Math.round(
          (projectStatusCounts.completed / projectStatusCounts.total) * 100
        )
      : 0;

  const taskCompletionRate =
    taskStatusCounts.total > 0
      ? Math.round((taskStatusCounts.completed / taskStatusCounts.total) * 100)
      : 0;

  return (
    <Grid container spacing={3}>
      {/* Projects Overview Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {projectStatusCounts.total}
                </Typography>
                <Typography variant="body2">Total Projects</Typography>
              </Box>
              <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PlayArrow sx={{ fontSize: 16 }} />
                  <Typography variant="caption">In Progress</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {projectStatusCounts.inProgress}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Completed</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {projectStatusCounts.completed}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Pause sx={{ fontSize: 16 }} />
                  <Typography variant="caption">On Hold</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {projectStatusCounts.onHold}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Tasks Overview Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {taskStatusCounts.total}
                </Typography>
                <Typography variant="body2">Total Tasks</Typography>
              </Box>
              <Timeline sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Schedule sx={{ fontSize: 16 }} />
                  <Typography variant="caption">To Do</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {taskStatusCounts.todo}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PlayArrow sx={{ fontSize: 16 }} />
                  <Typography variant="caption">In Progress</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {taskStatusCounts.inProgress}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Completed</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {taskStatusCounts.completed}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Project Success Rate Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {projectCompletionRate}%
                </Typography>
                <Typography variant="body2">Project Success Rate</Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 2 }} />

            <Box>
              <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                Progress Breakdown
              </Typography>
              <LinearProgress
                variant="determinate"
                value={projectCompletionRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "rgba(255,255,255,0.2)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "rgba(255,255,255,0.9)",
                  },
                }}
              />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="caption">
                  {projectStatusCounts.completed} Completed
                </Typography>
                <Typography variant="caption">
                  {projectStatusCounts.total - projectStatusCounts.completed}{" "}
                  Pending
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Team Overview Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "white",
            height: "100%",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {teamMetrics.totalMembers}
                </Typography>
                <Typography variant="body2">Team Members</Typography>
              </Box>
              <Group sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>

            <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)", mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption">Active Members</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {teamMetrics.activeMembers}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption">Reliability Team</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {teamMetrics.reliabilityMembers}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption">Software Team</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {teamMetrics.softwareMembers}
                </Typography>
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  Task Completion Rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={taskCompletionRate}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.2)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "rgba(255,255,255,0.9)",
                    },
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                  {taskCompletionRate}% of all tasks completed
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardSummaryCards;
