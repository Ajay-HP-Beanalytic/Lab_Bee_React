import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  Alert,
  AlertTitle,
} from "@mui/material";

import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import DashboardSummaryCards from "./DashboardSummaryCards";
import CriticalAlerts from "./CriticalAlerts";
import {
  DepartmentProductivityChart,
  MonthlyTrendsChart,
  PriorityDistributionChart,
  StatusDistributionChart,
  TaskTrendsChart,
} from "./DashboardChartsComponent";
import DashboardProjectsTable from "./DashboardProjectsTable";
dayjs.extend(relativeTime);

const ManagementDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    tasks: [],
    members: [],
  });

  const [processedData, setProcessedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsRes, tasksRes, membersRes] = await Promise.all([
        axios.get(`${serverBaseAddress}/api/getProjects`),
        axios.get(`${serverBaseAddress}/api/getAllTasks`),
        axios.get(`${serverBaseAddress}/api/getProjectManagementMembers`),
      ]);

      const projects = projectsRes.data || [];
      const tasks = tasksRes.data || [];
      const members = [
        ...(membersRes.data.reliabilityMembers || []),
        ...(membersRes.data.softwareMembers || []),
        ...(membersRes.data.adminMembers || []),
      ];

      setDashboardData({ projects, tasks, members });

      // Process data for charts
      const processed = processDataForCharts(projects, tasks, members);
      setProcessedData(processed);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process raw data into dashboard format
  const processDataForCharts = (projects, tasks, members) => {
    // Project status distribution
    const projectStatusData = [
      {
        name: "To Do",
        value: projects.filter((p) => p.project_status === "To Do").length,
      },
      {
        name: "In Progress",
        value: projects.filter((p) => p.project_status === "In Progress")
          .length,
      },
      {
        name: "Completed",
        value: projects.filter((p) => p.project_status === "Completed").length,
      },
      {
        name: "On Hold",
        value: projects.filter((p) => p.project_status === "On Hold").length,
      },
    ];

    // Task status distribution:
    const taskStatusData = [
      {
        name: "To Do",
        value: tasks.filter((t) => t.status === "To Do").length,
      },
      {
        name: "In Progress",
        value: tasks.filter((t) => t.status === "In Progress").length,
      },
      { name: "Done", value: tasks.filter((t) => t.status === "Done").length },
      {
        name: "On Hold",
        value: tasks.filter((t) => t.status === "On Hold").length,
      },
    ];

    // Task priority distribution
    const taskPriorityData = [
      {
        name: "High",
        value: tasks.filter((t) => t.priority === "High").length,
      },
      {
        name: "Medium",
        value: tasks.filter((t) => t.priority === "Medium").length,
      },
      { name: "Low", value: tasks.filter((t) => t.priority === "Low").length },
    ];

    // Department productivity
    const departmentProductivity = ["Reliability", "Software", "Administration"]
      .map((dept) => {
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
      })
      .filter((item) => item.totalTasks > 0);

    // Monthly project trends (last 6 months)
    const monthlyProjectsTrend = [];
    for (let i = 5; i >= 0; i--) {
      const month = dayjs().subtract(i, "month");
      const monthKey = month.format("MMM YYYY");

      const monthData = {
        month: monthKey,
        Reliability: projects.filter(
          (p) =>
            p.department === "Reliability" &&
            dayjs(p.project_start_date).format("MMM YYYY") === monthKey
        ).length,
        Software: projects.filter(
          (p) =>
            p.department === "Software" &&
            dayjs(p.project_start_date).format("MMM YYYY") === monthKey
        ).length,
      };

      monthlyProjectsTrend.push(monthData);
    }

    // Task trends (last 8 weeks)
    const taskTrends = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = dayjs().subtract(i, "week").startOf("week");
      const weekEnd = dayjs().subtract(i, "week").endOf("week");

      const taskCreated = tasks.filter((t) =>
        dayjs(t.task_assigned_date).isBetween(weekStart, weekEnd, null, "[]")
      ).length;
      const taskCompleted = tasks.filter((t) =>
        dayjs(t.task_completed_date).isBetween(weekStart, weekEnd, null, "[]")
      ).length;

      taskTrends.push({
        week: weekStart.format("MMM DD"),
        created: taskCreated,
        completed: taskCompleted,
      });
    }

    return {
      projectStatusData,
      taskStatusData,
      taskPriorityData,
      departmentProductivity,
      monthlyProjectsTrend,
      taskTrends,
    };
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Projects Dashboard
        </Typography>
        <LinearProgress />
        <Typography
          sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}
        >
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Projects Dashboard
        </Typography>
        <Alert severity="error">
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  const { projects, tasks, members } = dashboardData;
  const {
    projectStatusData,
    taskStatusData,
    taskPriorityData,
    departmentProductivity,
    monthlyProjectTrends,
    taskTrends,
  } = processedData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: "bold" }}>
          Project Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {/* Comprehensive overview of project performance and team productivity */}
          Monthly overview of project performance and team productivity
        </Typography>
      </Box>

      {/* Critical Alerts */}
      {/* <CriticalAlerts /> */}

      {/* Executive Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <DashboardSummaryCards
          projectsData={projects}
          tasksData={tasks}
          membersData={members}
        />
      </Box>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview Charts" />
          <Tab label="Project Analytics" />
          <Tab label="Task Analytics" />
          <Tab label="Trends & Forecasting" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Row 1: Status Distributions */}
          <Grid item xs={12} md={6}>
            <StatusDistributionChart
              data={projectStatusData}
              title="Project Status Distribution"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatusDistributionChart
              data={taskStatusData}
              title="Task Status Distribution"
            />
          </Grid>

          {/* Row 2: Productivity and Priority */}
          <Grid item xs={12} md={6}>
            <DepartmentProductivityChart
              data={departmentProductivity}
              title="Department Productivity"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <PriorityDistributionChart
              data={taskPriorityData}
              title="Task Priority Distribution"
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <DashboardProjectsTable projects={projects} tasks={tasks} />
          </Grid>

          {/* Project-focused analytics */}
          <Grid item xs={12} md={8}>
            <MonthlyTrendsChart
              data={monthlyProjectTrends}
              title="Monthly Project Initiation Trends"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatusDistributionChart
              data={projectStatusData}
              title="Current Project Status"
            />
          </Grid>

          <Grid item xs={12}>
            <DepartmentProductivityChart
              data={departmentProductivity}
              title="Department Performance Comparison"
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Task-focused analytics */}
          <Grid item xs={12} md={8}>
            <TaskTrendsChart
              data={taskTrends}
              title="Weekly Task Creation vs Completion"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <PriorityDistributionChart
              data={taskPriorityData}
              title="Priority Breakdown"
            />
          </Grid>

          <Grid item xs={12}>
            <StatusDistributionChart
              data={taskStatusData}
              title="Current Task Status Overview"
            />
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {/* Trends and forecasting */}
          <Grid item xs={12}>
            <TaskTrendsChart
              data={taskTrends}
              title="Task Velocity Trends (8 Weeks)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <MonthlyTrendsChart
              data={monthlyProjectTrends}
              title="Project Initiation Trends (6 Months)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DepartmentProductivityChart
              data={departmentProductivity}
              title="Department Efficiency Metrics"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ManagementDashboard;
