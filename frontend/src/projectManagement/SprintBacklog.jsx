import { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  Typography,
  LinearProgress,
} from "@mui/material";

import { UserContext } from "../Pages/UserContext";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import SearchBar from "../common/SearchBar";
import { DataGrid } from "@mui/x-data-grid";
import { addSerialNumbersToRows } from "../functions/UtilityFunctions";
import EmptyCard from "../common/EmptyCard";
import DeleteIcon from "@mui/icons-material/Delete";
import MoveUpIcon from "@mui/icons-material/MoveUp";
import SprintSelector from "./SprintSelector";
import useProjectManagementStore from "./ProjectStore";
import TaskDetailCard from "./TaskDetailCard";
import { useNavigate } from "react-router-dom";

const SprintBacklog = () => {
  const navigate = useNavigate();

  const [moveToSprintOpen, setMoveToSprintOpen] = useState(false);
  const [selectedTaskForSprint, setSelectedTaskForSprint] = useState(null);

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false); // To track if the dialog is in edit mode
  const [selectedTaskId, setSelectedTaskId] = useState(null); // To store the task_id of the selected task

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  //Send all tasks data to store in the project management store
  const setAllTasksData = useProjectManagementStore(
    (state) => state.setAllTasksData
  );

  const setTasksList = useProjectManagementStore((state) => state.setTasksList);

  const tasksData = useProjectManagementStore(
    (state) => state.allTasksData.tasks
  );

  //Fetch Kanbansheet data:
  const kanbanSheetData = useProjectManagementStore(
    (state) => state.allTasksData.kanbanSheetData
  );
  //Fetch and store status of the tasks:
  const setKanbanSheetData = useProjectManagementStore(
    (state) => state.setKanbanSheetData
  );

  const [reliabilityMembers, setReliabilityMembers] = useState([]);
  const [softwareMembers, setSoftwareMembers] = useState([]);
  const [administrationMembers, setAdministrationMembers] = useState([]);

  const [searchInputText, setSearchInputText] = useState("");
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [reliabilityTasks, setReliabilityTasks] = useState([]);
  const [softwareTasks, setSoftwareTasks] = useState([]);
  const [baseFilteredTasks, setBaseFilteredTasks] = useState([]);

  //Function to display the department-wise projects:
  useEffect(() => {
    if (
      tasksData &&
      tasksData.length > 0 &&
      loggedInUser &&
      loggedInUserDepartment
    ) {
      const reliability = tasksData.filter(
        (item) => item.department === "Reliability"
      );
      const software = tasksData.filter(
        (item) => item.department === "Software"
      );
      setReliabilityTasks(reliability);
      setSoftwareTasks(software);

      if (loggedInUserDepartment === "Reliability") {
        setBaseFilteredTasks(reliability);
        setFilteredTasks(reliability);
      } else if (loggedInUserDepartment === "Software") {
        setBaseFilteredTasks(software);
        setFilteredTasks(software);
      } else {
        setBaseFilteredTasks(tasksData);
        setFilteredTasks(tasksData);
      }
    }
  }, [tasksData, loggedInUser, loggedInUserDepartment]);

  const onChangeOfSearchInput = (e) => {
    const searchText = e.target.value;
    setSearchInputText(searchText);
    filteredTasksList(e.target.value);
  };

  //Function to filter the table
  const filteredTasksList = (searchValue) => {
    if (!searchValue) {
      // return tasks;
      setFilteredTasks(baseFilteredTasks); // Use the current department-filtered list
      return;
    }
    const filtered = baseFilteredTasks.filter((row) => {
      return Object.values(row).some(
        (value) =>
          value != null &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredTasks(filtered);
  };

  const onClearSearchInput = () => {
    setSearchInputText("");
    setFilteredTasks(baseFilteredTasks);
  };

  //Columns for Tasks Table:
  const tasksTableColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 50,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "corresponding_project_id",
      headerName: "Project ID",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    // {
    //   field: "department",
    //   headerName: "Department",
    //   width: 100,
    //   align: "center",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    // },
    {
      field: "title",
      headerName: "Title",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "assigned_to_name",
      headerName: "Task Assigned To",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "story_points",
      headerName: "Story Points",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "estimated_hours",
      headerName: "Estimated Hours",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "actual_hours",
      headerName: "Actual Hours",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "last_updated_by_name",
      headerName: "Last Updated By",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <div>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              deleteSelectedTask(params.row.task_id);
            }}
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              setSelectedTaskForSprint(params.row.task_id);
              setMoveToSprintOpen(true);
            }}
          >
            <MoveUpIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const tasksTableWithSerialNumbers = addSerialNumbersToRows(filteredTasks);

  //Function to fetch all the tasks from the database:
  const fetchTasksFromDatabase = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverBaseAddress}/api/getAllTasks`);
      setTasks(response.data);
      setTasksList(response.data); // Store tasks in Zustand
      setFilteredTasks(response.data); // Set initial filtered tasks

      // Group tasks by status for Kanban
      const groupedByStatus = {};
      response.data.forEach((task) => {
        if (!groupedByStatus[task.status]) groupedByStatus[task.status] = [];
        groupedByStatus[task.status].push({
          project_id: task.corresponding_project_id,
          id: task.id,
          department: task.department,
          task_id: task.task_id,
          title: task.title,
          description: task.description,
          assigned_to_name: task.assigned_to_name,
          priority: task.priority,
          task_due_date: task.task_due_date,
          last_updated_by_name: task.last_updated_by_name,
        });
      });

      setKanbanSheetData(groupedByStatus); // Store grouped data in Zustand
    } catch (error) {
      console.log("Error fetching tasks from database:", error);
    } finally {
      setLoading(false);
    }
  };

  //Function to populate the data to view and update the task data:
  // Function to handle row click in DataGrid
  const openSelectedTask = (row) => {
    const taskId = row.task_id;
    navigate(`/edit_task/${taskId}`);
  };

  //Function to fetch software and reliability team members from the database:
  const fetchTeamMembersFromDatabase = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getProjectManagementMembers`
      );
      setReliabilityMembers(response.data.reliabilityMembers || []);
      setSoftwareMembers(response.data.softwareMembers || []);
      setAdministrationMembers(response.data.adminMembers || []);
    } catch (error) {
      console.log("Error fetching team members from database:", error);
    }
  };

  useEffect(() => {
    fetchTasksFromDatabase();
    fetchTeamMembersFromDatabase();
  }, []);

  //Function to delete the task from the database:
  const deleteSelectedTask = async (row) => {
    const confirmDeleteTask = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (confirmDeleteTask) {
      try {
        const response = await axios.delete(
          `${serverBaseAddress}/api/deleteTask/${row.task_id}`
        );
        if (response.status === 200) {
          toast.success("Task deleted successfully");
          fetchTasksFromDatabase();
        } else {
          console.log(
            "Error deleting task from database, status:",
            response.status
          );
          toast.error(
            `Error deleting task: ${response.statusText || "Server error"}`
          );
        }
      } catch (error) {
        toast.error(`Error deleting task: ${error.message || "Network error"}`);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Tasks Table
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <>
      <Card sx={{ width: "100%", padding: "20px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <h2>Tasks</h2>
          <Button
            sx={{
              borderRadius: 1,
              bgcolor: "orange",
              color: "white",
              borderColor: "black",
              padding: { xs: "8px 16px", md: "6px 12px" }, // Adjust padding for different screen sizes
              fontSize: { xs: "0.875rem", md: "1rem" }, // Adjust font size for different screen sizes
              mb: "10px",
            }}
            variant="contained"
            color="primary"
            onClick={() => navigate("/add_task")}
          >
            Add Task
          </Button>
        </Box>

        <SearchBar
          placeholder="Search tasks..."
          searchInputText={searchInputText}
          onChangeOfSearchInput={onChangeOfSearchInput}
          onClearSearchInput={onClearSearchInput}
        />

        <Divider />

        {filteredTasks && filteredTasks.length === 0 ? (
          <EmptyCard message="No Data Found" />
        ) : (
          <Box
            sx={{
              height: 500,
              width: "100%",
              "& .custom-header-color": {
                backgroundColor: "#476f95",
                color: "whitesmoke",
                fontWeight: "bold",
                fontSize: "15px",
              },
              mt: 2,
            }}
          >
            <DataGrid
              columns={tasksTableColumns}
              rows={tasksTableWithSerialNumbers}
              sx={{ "&:hover": { cursor: "pointer" } }}
              getRowId={(row) => row.task_id}
              // onRowClick={(params) => openSelectedTask(params.row)}
              onRowClick={(params) =>
                navigate(`/edit_task/${params.row.task_id}`)
              }
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
        )}

        <SprintSelector
          open={moveToSprintOpen}
          onClose={() => setMoveToSprintOpen(false)}
          taskId={selectedTaskForSprint}
          onSuccess={fetchTasksFromDatabase}
        />
      </Card>
    </>
  );
};

export default SprintBacklog;
