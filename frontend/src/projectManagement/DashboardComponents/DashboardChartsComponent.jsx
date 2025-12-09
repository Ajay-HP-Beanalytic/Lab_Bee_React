import React from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Status Distribution Pie Chart Component
export const StatusDistributionChart = ({
  data,
  title = "Status Distribution",
}) => {
  const statusColors = {
    "In Progress": "#ff9800",
    "Done": "#4caf50",
    "To Do": "#2196f3",
    "Blocked": "#f44336",
    "On Hold": "#9e9e9e",
    "Planning": "#9c27b0",
  };

  const chartData =
    data?.map((item) => ({
      ...item,
      color: statusColors[item.name] || "#9e9e9e",
    })) || [];

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {title}
        </Typography>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : null
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <Typography>No data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Department Productivity Bar Chart Component
export const DepartmentProductivityChart = ({
  data,
  title = "Department Productivity",
}) => {
  const departmentColors = {
    Reliability: "#9c27b0",
    Software: "#00bcd4",
    Administration: "#795548",
  };

  const chartData =
    data?.map((item) => ({
      ...item,
      fill: departmentColors[item.department] || "#9e9e9e",
    })) || [];

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {title}
        </Typography>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis
                label={{
                  value: "Completion %",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value, _name) => [`${value}%`, "Completion Rate"]}
                labelFormatter={(label) => `Department: ${label}`}
              />
              <Bar dataKey="productivity" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <Typography>No data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Monthly Trends Line Chart Component
export const MonthlyTrendsChart = ({ data, title = "Monthly Trends" }) => {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {title}
        </Typography>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Reliability"
                stroke="#9c27b0"
                strokeWidth={3}
                dot={{ fill: "#9c27b0", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Software"
                stroke="#00bcd4"
                strokeWidth={3}
                dot={{ fill: "#00bcd4", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <Typography>No data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Task Creation vs Completion Chart Component
export const TaskTrendsChart = ({
  data,
  title = "Task Creation vs Completion",
}) => {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {title}
        </Typography>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#2196f3"
                strokeWidth={3}
                name="Tasks Created"
                dot={{ fill: "#2196f3", strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#4caf50"
                strokeWidth={3}
                name="Tasks Completed"
                dot={{ fill: "#4caf50", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: 350,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <Typography>No trends data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Priority Distribution Chart Component
export const PriorityDistributionChart = ({
  data,
  title = "Task Priority Distribution",
}) => {
  const priorityColors = {
    High: "#f44336",
    Medium: "#ff9800",
    Low: "#4caf50",
  };

  const chartData =
    data?.map((item) => ({
      ...item,
      color: priorityColors[item.name] || "#9e9e9e",
    })) || [];

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          {title}
        </Typography>
        {chartData.length > 0 ? (
          <Box>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {chartData.map((item) => (
                <Chip
                  key={item.name}
                  label={`${item.name}: ${item.value}`}
                  size="small"
                  sx={{
                    backgroundColor: item.color,
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            <Typography>No priority data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
