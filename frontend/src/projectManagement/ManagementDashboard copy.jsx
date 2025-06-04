import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Assignment,
  Group,
  Schedule,
  CheckCircle,
  Warning,
  PlayArrow,
  Pause,
  Block,
  AccountCircle,
  Timeline,
  Assessment,
  Speed,
  Star,
  CalendarToday,
  Error,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const ManagementDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    executiveSummary: {},
    projectsOverview: [],
    teamPerformance: [],
    taskAnalytics: {},
    departmentMetrics: {},
    recentActivities: [],
    upcomingDeadlines: [],
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Color schemes for charts
  const statusColors = {
    "In Progress": "#ff9800",
    Done: "#4caf50",
    "To Do": "#2196f3",
    Blocked: "#f44336",
  };

  const departmentColors = {
    Reliability: "#9c27b0",
    Software: "#00bcd4",
    Administration: "#795548",
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes, membersRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/getProjects`),
        axios.get(`${serverBaseAddress}/api/getAllTasks`),
        axios.get(`${serverBaseAddress}/api/getProjectManagementMembers`),
      ]);

      const projects = projectsRes.data;
      const tasks = tasksRes.data;
      const members = membersRes.data;

      // Process data for dashboard
      const processedData = processDataForDashboard(projects, tasks, members);
      console.log("Processed Dashboard Data:", processedData);
      setDashboardData(processedData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process raw data into dashboard format
  const processDataForDashboard = (projects, tasks, members) => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.project_status === "Done"
    ).length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Done").length;

    // Executive Summary
    const executiveSummary = {
      totalProjects,
      completedProjects,
      activeProjects: totalProjects - completedProjects,
      totalTasks,
      completedTasks,
      taskCompletionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      projectCompletionRate:
        totalProjects > 0
          ? Math.round((completedProjects / totalProjects) * 100)
          : 0,
      totalMembers:
        (members.reliabilityMembers?.length || 0) +
        (members.softwareMembers?.length || 0) +
        (members.adminMembers?.length || 0),
    };

    // Projects Overview
    const projectsOverview = projects.map((project) => ({
      ...project,
      tasksInProject: tasks.filter(
        (t) => t.corresponding_project_id === project.project_id
      ),
      progress: calculateProjectProgress(
        tasks.filter((t) => t.corresponding_project_id === project.project_id)
      ),
      isOverdue:
        dayjs().isAfter(dayjs(project.project_end_date)) &&
        project.project_status !== "Done",
    }));

    // Team Performance
    const teamPerformance = calculateTeamPerformance(tasks, members);

    // Task Analytics
    const taskAnalytics = {
      tasksByStatus: getTasksByStatus(tasks),
      tasksByPriority: getTasksByPriority(tasks),
      tasksTrend: getTasksTrend(tasks),
      averageCompletionTime: calculateAverageCompletionTime(tasks),
    };

    // Department Metrics
    const departmentMetrics = {
      tasksByDepartment: getTasksByDepartment(tasks),
      projectsByDepartment: getProjectsByDepartment(projects),
      departmentProductivity: calculateDepartmentProductivity(tasks),
    };

    // Recent Activities and Upcoming Deadlines
    const recentActivities = getRecentActivities(tasks);
    const upcomingDeadlines = getUpcomingDeadlines(tasks);

    return {
      executiveSummary,
      projectsOverview,
      teamPerformance,
      taskAnalytics,
      departmentMetrics,
      recentActivities,
      upcomingDeadlines,
    };
  };

  // Helper functions for data processing
  const calculateProjectProgress = (projectTasks) => {
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t) => t.status === "Done").length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const calculateTeamPerformance = (tasks, members) => {
    const allMembers = [
      ...(members.reliabilityMembers || []),
      ...(members.softwareMembers || []),
      ...(members.adminMembers || []),
    ];

    return allMembers
      .map((member) => {
        const memberTasks = tasks.filter((t) => t.assigned_to === member.id);
        const completedTasks = memberTasks.filter((t) => t.status === "Done");
        const inProgressTasks = memberTasks.filter(
          (t) => t.status === "In Progress"
        );

        return {
          id: member.id,
          name: member.name,
          department: member.department,
          totalTasks: memberTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          completionRate:
            memberTasks.length > 0
              ? Math.round((completedTasks.length / memberTasks.length) * 100)
              : 0,
          storyPoints: memberTasks.reduce(
            (sum, task) => sum + (parseInt(task.story_points) || 0),
            0
          ),
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);
  };

  const getTasksByStatus = (tasks) => {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: statusColors[status] || "#9e9e9e",
    }));
  };

  const getTasksByPriority = (tasks) => {
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority,
      value: count,
    }));
  };

  const getTasksByDepartment = (tasks) => {
    const deptCounts = tasks.reduce((acc, task) => {
      acc[task.department] = (acc[task.department] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(deptCounts).map(([dept, count]) => ({
      name: dept,
      value: count,
      color: departmentColors[dept] || "#9e9e9e",
    }));
  };

  const getProjectsByDepartment = (projects) => {
    const deptCounts = projects.reduce((acc, project) => {
      acc[project.department] = (acc[project.department] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(deptCounts).map(([dept, count]) => ({
      name: dept,
      value: count,
    }));
  };

  const calculateDepartmentProductivity = (tasks) => {
    const departments = ["Reliability", "Software", "Administration"];
    return departments.map((dept) => {
      const deptTasks = tasks.filter((t) => t.department === dept);
      const completed = deptTasks.filter((t) => t.status === "Done").length;
      return {
        department: dept,
        totalTasks: deptTasks.length,
        completedTasks: completed,
        productivity:
          deptTasks.length > 0
            ? Math.round((completed / deptTasks.length) * 100)
            : 0,
      };
    });
  };

  const getTasksTrend = (tasks) => {
    // Group tasks by week for the last 8 weeks
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = dayjs().subtract(i, "week").startOf("week");
      const weekEnd = dayjs().subtract(i, "week").endOf("week");

      const tasksCreated = tasks.filter((t) =>
        dayjs(t.task_assigned_date).isBetween(weekStart, weekEnd, null, "[]")
      ).length;

      const tasksCompleted = tasks.filter((t) =>
        dayjs(t.task_completed_date).isBetween(weekStart, weekEnd, null, "[]")
      ).length;

      weeks.push({
        week: weekStart.format("MMM DD"),
        created: tasksCreated,
        completed: tasksCompleted,
      });
    }
    return weeks;
  };

  const calculateAverageCompletionTime = (tasks) => {
    const completedTasks = tasks.filter(
      (t) =>
        t.status === "Done" && t.task_assigned_date && t.task_completed_date
    );

    if (completedTasks.length === 0) return 0;

    const totalDays = completedTasks.reduce((sum, task) => {
      const start = dayjs(task.task_assigned_date);
      const end = dayjs(task.task_completed_date);
      return sum + end.diff(start, "day");
    }, 0);

    return Math.round(totalDays / completedTasks.length);
  };

  const getRecentActivities = (tasks) => {
    return tasks
      .filter((t) => t.status === "Done")
      .sort(
        (a, b) =>
          dayjs(b.task_completed_date).unix() -
          dayjs(a.task_completed_date).unix()
      )
      .slice(0, 5)
      .map((task) => ({
        ...task,
        timeAgo: dayjs(task.task_completed_date).fromNow(),
      }));
  };

  const getUpcomingDeadlines = (tasks) => {
    return tasks
      .filter((t) => t.status !== "Done" && t.task_due_date)
      .sort(
        (a, b) => dayjs(a.task_due_date).unix() - dayjs(b.task_due_date).unix()
      )
      .slice(0, 5)
      .map((task) => ({
        ...task,
        daysUntilDue: dayjs(task.task_due_date).diff(dayjs(), "day"),
        isOverdue: dayjs().isAfter(dayjs(task.task_due_date)),
      }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Project Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  const {
    executiveSummary,
    projectsOverview,
    teamPerformance,
    taskAnalytics,
    departmentMetrics,
    recentActivities,
    upcomingDeadlines,
  } = dashboardData;

  //   const barChartData = projectsOverview.map((project) => ({
  //     name: project.project_name,
  //     pv: project.tasksInProject.filter((t) => t.status === "Done").length,
  //     uv: project.tasksInProject.filter((t) => t.status !== "Done").length,
  //   }));

  const barChartData = [
    {
      name: "Page A",
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: "Page B",
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: "Page C",
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: "Page D",
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: "Page E",
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: "Page F",
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: "Page G",
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
          Project Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive overview of project performance and team productivity
        </Typography>
      </Box>

      {/* Executive Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {executiveSummary.totalProjects}
                  </Typography>
                  <Typography variant="body2">Total Projects</Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {executiveSummary.projectCompletionRate}%
                  </Typography>
                  <Typography variant="body2">Project Success Rate</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {executiveSummary.totalTasks}
                  </Typography>
                  <Typography variant="body2">Total Tasks</Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {executiveSummary.totalMembers}
                  </Typography>
                  <Typography variant="body2">Team Members</Typography>
                </Box>
                <Group sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different dashboard views */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Projects" />
          <Tab label="Team Performance" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Task Status Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Task Status Distribution
                </Typography>
                {/* <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskAnalytics.tasksByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {taskAnalytics.tasksByStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer> */}

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="pv" stackId="a" fill="#8884d8" />
                    <Bar dataKey="uv" stackId="a" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Department Performance */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Department Productivity
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentMetrics.departmentProductivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="productivity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Recent Task Completions
                </Typography>
                <List>
                  {recentActivities.map((activity, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "#4caf50" }}>
                          <CheckCircle />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={`Completed by ${activity.assigned_to_name} • ${activity.timeAgo}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Deadlines */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Upcoming Deadlines
                </Typography>
                <List>
                  {upcomingDeadlines.map((deadline, index) => (
                    <ListItem key={index}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: deadline.isOverdue ? "#f44336" : "#ff9800",
                          }}
                        >
                          {deadline.isOverdue ? <Error /> : <Schedule />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={deadline.title}
                        secondary={
                          deadline.isOverdue
                            ? `Overdue by ${Math.abs(
                                deadline.daysUntilDue
                              )} days`
                            : `Due in ${deadline.daysUntilDue} days`
                        }
                      />
                      <Chip
                        label={deadline.priority}
                        size="small"
                        color={
                          deadline.priority === "High"
                            ? "error"
                            : deadline.priority === "Medium"
                            ? "warning"
                            : "default"
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Projects Overview Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Projects Overview
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Project Name</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Manager</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Tasks</TableCell>
                        <TableCell>Due Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectsOverview.slice(0, 10).map((project, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "#f5f5f5" },
                          }}
                          onClick={() =>
                            navigate(`/edit_project/${project.project_id}`)
                          }
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {project.project_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {project.project_id}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={project.department}
                              size="small"
                              sx={{
                                backgroundColor:
                                  departmentColors[project.department],
                                color: "white",
                              }}
                            />
                          </TableCell>
                          <TableCell>{project.project_manager_name}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={project.progress}
                                sx={{ width: 80, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="body2">
                                {project.progress}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={project.project_status}
                              size="small"
                              color={
                                project.project_status === "Done"
                                  ? "success"
                                  : "primary"
                              }
                            />
                          </TableCell>
                          <TableCell>{project.tasksInProject.length}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={
                                project.isOverdue ? "error" : "text.primary"
                              }
                            >
                              {dayjs(project.project_end_date).format(
                                "MMM DD, YYYY"
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Top Performers */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Team Performance Rankings
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Team Member</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Total Tasks</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>In Progress</TableCell>
                        <TableCell>Completion Rate</TableCell>
                        <TableCell>Story Points</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamPerformance.slice(0, 10).map((member, index) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              {index < 3 && <Star sx={{ color: "#ffd700" }} />}
                              {index + 1}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {member.name.charAt(0)}
                              </Avatar>
                              {member.name}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={member.department}
                              size="small"
                              sx={{
                                backgroundColor:
                                  departmentColors[member.department],
                                color: "white",
                              }}
                            />
                          </TableCell>
                          <TableCell>{member.totalTasks}</TableCell>
                          <TableCell>{member.completedTasks}</TableCell>
                          <TableCell>{member.inProgressTasks}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={member.completionRate}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                              {member.completionRate}%
                            </Box>
                          </TableCell>
                          <TableCell>{member.storyPoints}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Task Trends */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Task Creation vs Completion Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={taskAnalytics.tasksTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#8884d8"
                      name="Tasks Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#82ca9d"
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Analytics Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Speed sx={{ fontSize: 48, color: "#ff9800", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {taskAnalytics.averageCompletionTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Days to Complete
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Timeline sx={{ fontSize: 48, color: "#4caf50", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {executiveSummary.taskCompletionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Task Completion Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <TrendingUp sx={{ fontSize: 48, color: "#2196f3", mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {executiveSummary.activeProjects}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ManagementDashboard;
