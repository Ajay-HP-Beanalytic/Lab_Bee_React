// import {
//   Card,
//   CardContent,
//   Typography,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   LinearProgress,
//   Box,
//   Avatar,
//   Divider,
//   Accordion,
//   AccordionSummary,
//   AccordionDetails,
// } from "@mui/material";
// import {
//   ExpandMore,
//   Star,
//   TrendingUp,
//   Assignment,
//   CheckCircle,
//   Schedule,
// } from "@mui/icons-material";

// const EmployeePerformanceTable = ({ members, tasks }) => {
//   // Department colors
//   const departmentColors = {
//     Reliability: "#9c27b0",
//     Software: "#00bcd4",
//     Administration: "#795548",
//   };

//   //Calculate employee performance metrics:
//   const calculateEmployeeMetrics = (members, tasks) => {
//     return members.map((member) => {
//       const memberTasks = tasks.filter(
//         (task) => task.assigned_to === member.id
//       );
//       const completedTasks = memberTasks.filter(
//         (task) => task.status === "Done"
//       );
//       const inProgressTasks = memberTasks.filter(
//         (task) => task.status === "In Progress"
//       );
//       const todoTasks = memberTasks.filter((task) => task.status === "To Do");
//       const onHoldTasks = memberTasks.filter(
//         (task) => task.status === "On Hold"
//       );

//       const completionRate =
//         memberTasks.length > 0
//           ? Math.round((completedTasks.length / memberTasks.length) * 100)
//           : 0;
//       const storyPoints = memberTasks.reduce(
//         (sum, task) => sum + (task.story_points || 0),
//         0
//       );
//       const completedStoryPoints = completedTasks.reduce(
//         (sum, task) => sum + (task.story_points || 0),
//         0
//       );

//       return {
//         ...member,
//         totalTasks: memberTasks.length,
//         completedTasks: completedTasks.length,
//         inProgressTasks: inProgressTasks.length,
//         todoTasks: todoTasks.length,
//         onHoldTasks: onHoldTasks.length,
//         completionRate,
//         storyPoints,
//         completedStoryPoints,
//         efficiency:
//           storyPoints > 0
//             ? Math.round((completedStoryPoints / storyPoints) * 100)
//             : 0,
//       };
//     });
//   };

//   //Group employees by department:
//   const groupByDepartment = (employeeMetrics) => {
//     const grouped = employeeMetrics.reduce((acc, employee) => {
//       const department = employee.department;
//       if (!acc[department]) {
//         acc[department] = [];
//       }
//       acc[department].push(employee);
//       return acc;
//     }, {});

//     // Sort employees within each department by completion rate
//     Object.keys(grouped).forEach((dept) => {
//       grouped[dept].sort((a, b) => b.completionRate - a.completionRate);
//     });

//     return grouped;
//   };

//   const employeeMetrics = calculateEmployeeMetrics(members, tasks);
//   const departmentGroups = groupByDepartment(employeeMetrics);

//   // Calculate department averages
//   const calculateDepartmentAverages = (employees) => {
//     if (employees.length === 0)
//       return { avgCompletion: 0, totalTasks: 0, totalMembers: 0 };

//     const totalCompletion = employees.reduce(
//       (sum, emp) => sum + emp.completionRate,
//       0
//     );
//     const totalTasks = employees.reduce((sum, emp) => sum + emp.totalTasks, 0);

//     return {
//       avgCompletion: Math.round(totalCompletion / employees.length),
//       totalTasks,
//       totalMembers: employees.length,
//     };
//   };

//   const getPerformanceColor = (rate) => {
//     if (rate >= 80) return "#4caf50"; // Green
//     if (rate >= 60) return "#ff9800"; // Orange
//     if (rate >= 40) return "#f44336"; // Red
//     return "#9e9e9e"; // Gray
//   };

//   const getPerformanceLabel = (rate) => {
//     if (rate >= 80) return "Excellent";
//     if (rate >= 60) return "Good";
//     if (rate >= 40) return "Needs Improvement";
//     return "Critical";
//   };

//   return (
//     <Card sx={{ height: "100%" }}>
//       <CardContent>
//         <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
//           Employee Performance By Department
//         </Typography>

//         <Box sx={{ maxHeight: 600, overflow: "auto" }}>
//           {Object.entries(departmentGroups).map(([department, employees]) => {
//             const deptAvg = calculateDepartmentAverages(employees);

//             return (
//               <Accordion key={department} defaultExpanded sx={{ mb: 1 }}>
//                 <AccordionSummary
//                   expandIcon={<ExpandMore />}
//                   sx={{
//                     bgcolor: departmentColors[department],
//                     color: "white",
//                     "& .MuiAccordionSummary-content": {
//                       alignItems: "center",
//                     },
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 2,
//                       width: "100%",
//                     }}
//                   >
//                     <Typography variant="h6" sx={{ fontWeight: "bold" }}>
//                       {department}
//                     </Typography>
//                     <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
//                       <Chip
//                         label={`${deptAvg.totalMembers} Members`}
//                         size="small"
//                         sx={{
//                           bgcolor: "rgba(255,255,255,0.2)",
//                           color: "white",
//                         }}
//                       />
//                       <Chip
//                         label={`${deptAvg.avgCompletion}% Avg Completion`}
//                         size="small"
//                         sx={{
//                           bgcolor: "rgba(255,255,255,0.2)",
//                           color: "white",
//                         }}
//                       />
//                       <Chip
//                         label={`${deptAvg.totalTasks} Total Tasks`}
//                         size="small"
//                         sx={{
//                           bgcolor: "rgba(255,255,255,0.2)",
//                           color: "white",
//                         }}
//                       />
//                     </Box>
//                   </Box>
//                 </AccordionSummary>

//                 <AccordionDetails sx={{ p: 0 }}>
//                   <TableContainer>
//                     <Table size="small">
//                       <TableHead>
//                         <TableRow>
//                           <TableCell sx={{ fontWeight: "bold" }}>
//                             Rank
//                           </TableCell>
//                           <TableCell sx={{ fontWeight: "bold" }}>
//                             Employee
//                           </TableCell>
//                           <TableCell sx={{ fontWeight: "bold" }}>
//                             Tasks
//                           </TableCell>
//                           <TableCell sx={{ fontWeight: "bold" }}>
//                             Completion Rate
//                           </TableCell>
//                           <TableCell sx={{ fontWeight: "bold" }}>
//                             Story Points
//                           </TableCell>
//                           <TableCell sx={{ fontWeight: "bold" }}>
//                             Performance
//                           </TableCell>
//                         </TableRow>
//                       </TableHead>
//                       <TableBody>
//                         {employees.map((employee, index) => (
//                           <TableRow key={employee.id}>
//                             {/* Rank */}
//                             <TableCell>
//                               <Box
//                                 sx={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   gap: 1,
//                                 }}
//                               >
//                                 {index < 3 && (
//                                   <Star
//                                     sx={{
//                                       color:
//                                         index === 0
//                                           ? "#ffd700"
//                                           : index === 1
//                                           ? "#c0c0c0"
//                                           : "#cd7f32",
//                                       fontSize: 20,
//                                     }}
//                                   />
//                                 )}
//                                 <Typography
//                                   variant="body2"
//                                   sx={{ fontWeight: "bold" }}
//                                 >
//                                   #{index + 1}
//                                 </Typography>
//                               </Box>
//                             </TableCell>

//                             {/* Employee Info */}
//                             <TableCell>
//                               <Box
//                                 sx={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   gap: 1,
//                                 }}
//                               >
//                                 <Avatar sx={{ width: 32, height: 32 }}>
//                                   {employee.name.charAt(0)}
//                                 </Avatar>
//                                 <Typography
//                                   variant="body2"
//                                   sx={{ fontWeight: "medium" }}
//                                 >
//                                   {employee.name}
//                                 </Typography>
//                               </Box>
//                             </TableCell>

//                             {/* Tasks Breakdown */}
//                             <TableCell>
//                               <Box>
//                                 <Typography
//                                   variant="body2"
//                                   sx={{ fontWeight: "bold" }}
//                                 >
//                                   {employee.totalTasks} total
//                                 </Typography>
//                                 <Box
//                                   sx={{ display: "flex", gap: 0.5, mt: 0.5 }}
//                                 >
//                                   <Chip
//                                     icon={<CheckCircle />}
//                                     label={employee.completedTasks}
//                                     size="small"
//                                     color="success"
//                                     sx={{ fontSize: "0.7rem", height: 20 }}
//                                   />
//                                   <Chip
//                                     icon={<Assignment />}
//                                     label={employee.inProgressTasks}
//                                     size="small"
//                                     color="primary"
//                                     sx={{ fontSize: "0.7rem", height: 20 }}
//                                   />
//                                   <Chip
//                                     icon={<Schedule />}
//                                     label={employee.todoTasks}
//                                     size="small"
//                                     color="info"
//                                     sx={{ fontSize: "0.7rem", height: 20 }}
//                                   />
//                                   {employee.blockedTasks > 0 && (
//                                     <Chip
//                                       label={employee.blockedTasks}
//                                       size="small"
//                                       color="error"
//                                       sx={{ fontSize: "0.7rem", height: 20 }}
//                                     />
//                                   )}
//                                 </Box>
//                               </Box>
//                             </TableCell>

//                             {/* Completion Rate */}
//                             <TableCell>
//                               <Box
//                                 sx={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   gap: 1,
//                                   minWidth: 120,
//                                 }}
//                               >
//                                 <LinearProgress
//                                   variant="determinate"
//                                   value={employee.completionRate}
//                                   sx={{
//                                     width: 60,
//                                     height: 6,
//                                     borderRadius: 3,
//                                     backgroundColor: "#e0e0e0",
//                                     "& .MuiLinearProgress-bar": {
//                                       backgroundColor: getPerformanceColor(
//                                         employee.completionRate
//                                       ),
//                                     },
//                                   }}
//                                 />
//                                 <Typography
//                                   variant="body2"
//                                   sx={{ fontWeight: "bold" }}
//                                 >
//                                   {employee.completionRate}%
//                                 </Typography>
//                               </Box>
//                             </TableCell>

//                             {/* Story Points */}
//                             <TableCell>
//                               <Box>
//                                 <Typography
//                                   variant="body2"
//                                   sx={{ fontWeight: "bold" }}
//                                 >
//                                   {employee.completedStoryPoints}/
//                                   {employee.storyPoints}
//                                 </Typography>
//                                 <Typography
//                                   variant="caption"
//                                   color="text.secondary"
//                                 >
//                                   {employee.efficiency}% efficiency
//                                 </Typography>
//                               </Box>
//                             </TableCell>

//                             {/* Performance Label */}
//                             <TableCell>
//                               <Chip
//                                 label={getPerformanceLabel(
//                                   employee.completionRate
//                                 )}
//                                 size="small"
//                                 sx={{
//                                   backgroundColor: getPerformanceColor(
//                                     employee.completionRate
//                                   ),
//                                   color: "white",
//                                   fontWeight: "bold",
//                                 }}
//                               />
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </TableContainer>
//                 </AccordionDetails>
//               </Accordion>
//             );
//           })}
//         </Box>

//         {members.length === 0 && (
//           <Box
//             sx={{
//               textAlign: "center",
//               py: 4,
//               color: "text.secondary",
//             }}
//           >
//             <Typography variant="body1">No team members found.</Typography>
//           </Box>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default EmployeePerformanceTable;

import React, { useState } from "react";
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  ExpandMore,
  Star,
  TrendingUp,
  Assignment,
  CheckCircle,
  Schedule,
  CalendarToday,
} from "@mui/icons-material";
import dayjs from "dayjs";

const EmployeePerformanceTable = ({ tasks, members }) => {
  const [timeFrame, setTimeFrame] = useState("3months"); // Default to 3 months

  // Time frame options
  const timeFrameOptions = [
    { value: "1month", label: "Last 1 Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "1year", label: "Last 1 Year" },
    { value: "all", label: "All Time" },
  ];

  // Department colors
  const departmentColors = {
    Reliability: "#9c27b0",
    Software: "#00bcd4",
    Administration: "#795548",
  };

  // Filter tasks based on selected timeframe
  const filterTasksByTimeFrame = (tasks, timeFrame) => {
    if (timeFrame === "all") return tasks;

    const now = dayjs();
    let cutoffDate;

    switch (timeFrame) {
      case "1month":
        cutoffDate = now.subtract(1, "month");
        break;
      case "3months":
        cutoffDate = now.subtract(3, "month");
        break;
      case "6months":
        cutoffDate = now.subtract(6, "month");
        break;
      case "1year":
        cutoffDate = now.subtract(1, "year");
        break;
      default:
        return tasks;
    }

    return tasks.filter((task) => {
      // Consider tasks that were assigned or completed within the timeframe
      const assignedDate = task.task_assigned_date
        ? dayjs(task.task_assigned_date)
        : null;
      const completedDate = task.task_completed_date
        ? dayjs(task.task_completed_date)
        : null;

      return (
        (assignedDate && assignedDate.isAfter(cutoffDate)) ||
        (completedDate && completedDate.isAfter(cutoffDate))
      );
    });
  };

  // Calculate employee performance metrics with time filtering
  const calculateEmployeeMetrics = (members, allTasks, timeFrame) => {
    const filteredTasks = filterTasksByTimeFrame(allTasks, timeFrame);

    return members.map((member) => {
      const memberTasks = filteredTasks.filter(
        (t) => t.assigned_to === member.id
      );
      const completedTasks = memberTasks.filter((t) => t.status === "Done");
      const inProgressTasks = memberTasks.filter(
        (t) => t.status === "In Progress"
      );
      const todoTasks = memberTasks.filter((t) => t.status === "To Do");
      const blockedTasks = memberTasks.filter((t) => t.status === "Blocked");

      const completionRate =
        memberTasks.length > 0
          ? Math.round((completedTasks.length / memberTasks.length) * 100)
          : 0;

      const storyPoints = memberTasks.reduce(
        (sum, task) => sum + (parseInt(task.story_points) || 0),
        0
      );

      const completedStoryPoints = completedTasks.reduce(
        (sum, task) => sum + (parseInt(task.story_points) || 0),
        0
      );

      // Calculate average completion time for completed tasks
      const tasksWithCompletionTime = completedTasks.filter(
        (task) => task.task_assigned_date && task.task_completed_date
      );

      const avgCompletionDays =
        tasksWithCompletionTime.length > 0
          ? Math.round(
              tasksWithCompletionTime.reduce((sum, task) => {
                const assignedDate = dayjs(task.task_assigned_date);
                const completedDate = dayjs(task.task_completed_date);
                return sum + completedDate.diff(assignedDate, "day");
              }, 0) / tasksWithCompletionTime.length
            )
          : 0;

      return {
        ...member,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        todoTasks: todoTasks.length,
        blockedTasks: blockedTasks.length,
        completionRate,
        storyPoints,
        completedStoryPoints,
        efficiency:
          storyPoints > 0
            ? Math.round((completedStoryPoints / storyPoints) * 100)
            : 0,
        avgCompletionDays,
      };
    });
  };

  // Group employees by department
  const groupByDepartment = (employeeMetrics) => {
    const grouped = employeeMetrics.reduce((acc, employee) => {
      const dept = employee.department;
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(employee);
      return acc;
    }, {});

    // Sort employees within each department by completion rate
    Object.keys(grouped).forEach((dept) => {
      grouped[dept].sort((a, b) => {
        // Primary sort: completion rate
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        // Secondary sort: total tasks completed
        return b.completedTasks - a.completedTasks;
      });
    });

    return grouped;
  };

  const employeeMetrics = calculateEmployeeMetrics(members, tasks, timeFrame);
  const departmentGroups = groupByDepartment(employeeMetrics);

  // Calculate department averages
  const calculateDepartmentAverage = (employees) => {
    if (employees.length === 0)
      return {
        avgCompletion: 0,
        totalTasks: 0,
        totalMembers: 0,
        avgCompletionTime: 0,
      };

    const totalCompletion = employees.reduce(
      (sum, emp) => sum + emp.completionRate,
      0
    );
    const totalTasks = employees.reduce((sum, emp) => sum + emp.totalTasks, 0);
    const totalCompletionTime = employees.reduce(
      (sum, emp) => sum + emp.avgCompletionDays,
      0
    );

    return {
      avgCompletion: Math.round(totalCompletion / employees.length),
      totalTasks,
      totalMembers: employees.length,
      avgCompletionTime: Math.round(totalCompletionTime / employees.length),
    };
  };

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return "#4caf50"; // Green
    if (rate >= 60) return "#ff9800"; // Orange
    if (rate >= 40) return "#f44336"; // Red
    return "#9e9e9e"; // Gray
  };

  const getPerformanceLabel = (rate) => {
    if (rate >= 80) return "Excellent";
    if (rate >= 60) return "Good";
    if (rate >= 40) return "Needs Improvement";
    return "Critical";
  };

  const handleTimeFrameChange = (event) => {
    setTimeFrame(event.target.value);
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Employee Performance by Department
          </Typography>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timeFrame}
              label="Time Period"
              onChange={handleTimeFrameChange}
              startAdornment={<CalendarToday sx={{ mr: 1, fontSize: 16 }} />}
            >
              {timeFrameOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ maxHeight: 600, overflow: "auto" }}>
          {Object.entries(departmentGroups).map(([department, employees]) => {
            const deptAvg = calculateDepartmentAverage(employees);

            return (
              <Accordion key={department} defaultExpanded sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    bgcolor: departmentColors[department],
                    color: "white",
                    "& .MuiAccordionSummary-content": {
                      alignItems: "center",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {department}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
                      <Chip
                        label={`${deptAvg.totalMembers} Members`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                      />
                      <Chip
                        label={`${deptAvg.avgCompletion}% Avg Completion`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                      />
                      <Chip
                        label={`${deptAvg.totalTasks} Total Tasks`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                      />
                      {deptAvg.avgCompletionTime > 0 && (
                        <Chip
                          label={`${deptAvg.avgCompletionTime}d Avg Time`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(255,255,255,0.2)",
                            color: "white",
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Rank
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Employee
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Tasks
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Completion Rate
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Story Points
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Avg Time
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Performance
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employees.map((employee, index) => (
                          <TableRow key={employee.id}>
                            {/* Rank */}
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {index < 3 && (
                                  <Star
                                    sx={{
                                      color:
                                        index === 0
                                          ? "#ffd700"
                                          : index === 1
                                          ? "#c0c0c0"
                                          : "#cd7f32",
                                      fontSize: 20,
                                    }}
                                  />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  #{index + 1}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Employee Info */}
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {employee.name.charAt(0)}
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "medium" }}
                                >
                                  {employee.name}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Tasks Breakdown */}
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {employee.totalTasks} total
                                </Typography>
                                <Box
                                  sx={{ display: "flex", gap: 0.5, mt: 0.5 }}
                                >
                                  <Chip
                                    icon={<CheckCircle />}
                                    label={employee.completedTasks}
                                    size="small"
                                    color="success"
                                    sx={{ fontSize: "0.7rem", height: 20 }}
                                  />
                                  <Chip
                                    icon={<Assignment />}
                                    label={employee.inProgressTasks}
                                    size="small"
                                    color="primary"
                                    sx={{ fontSize: "0.7rem", height: 20 }}
                                  />
                                  <Chip
                                    icon={<Schedule />}
                                    label={employee.todoTasks}
                                    size="small"
                                    color="info"
                                    sx={{ fontSize: "0.7rem", height: 20 }}
                                  />
                                  {employee.blockedTasks > 0 && (
                                    <Chip
                                      label={employee.blockedTasks}
                                      size="small"
                                      color="error"
                                      sx={{ fontSize: "0.7rem", height: 20 }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Completion Rate */}
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
                                  value={employee.completionRate}
                                  sx={{
                                    width: 60,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: "#e0e0e0",
                                    "& .MuiLinearProgress-bar": {
                                      backgroundColor: getPerformanceColor(
                                        employee.completionRate
                                      ),
                                    },
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {employee.completionRate}%
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Story Points */}
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {employee.completedStoryPoints}/
                                  {employee.storyPoints}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {employee.efficiency}% efficiency
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Average Completion Time */}
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {employee.avgCompletionDays > 0
                                  ? `${employee.avgCompletionDays}d`
                                  : "N/A"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                avg completion
                              </Typography>
                            </TableCell>

                            {/* Performance Label */}
                            <TableCell>
                              <Chip
                                label={getPerformanceLabel(
                                  employee.completionRate
                                )}
                                size="small"
                                sx={{
                                  backgroundColor: getPerformanceColor(
                                    employee.completionRate
                                  ),
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {employees.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              sx={{ textAlign: "center", py: 2 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No activity in the selected time period
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>

        {members.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">No team members found.</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeePerformanceTable;
