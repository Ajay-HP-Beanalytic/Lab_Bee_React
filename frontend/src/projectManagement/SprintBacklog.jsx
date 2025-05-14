import { useContext, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";

import RenderComponents from "../functions/RenderComponents";
import { useForm } from "react-hook-form";
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

const SprintBacklog = () => {
  const { control, register, setValue, watch, handleSubmit, reset } = useForm();

  const [moveToSprintOpen, setMoveToSprintOpen] = useState(false);
  const [selectedTaskForSprint, setSelectedTaskForSprint] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);

  const [newTaskAdded, setNewTaskAdded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // To track if the dialog is in edit mode
  const [selectedTaskId, setSelectedTaskId] = useState(null); // To store the task_id of the selected task

  const {
    loggedInUser,
    loggedInUserDepartment,
    loggedInUserRole,
    loggedInUserId,
  } = useContext(UserContext);

  const [reliabilityMembers, setReliabilityMembers] = useState([]);
  const [softwareMembers, setSoftwareMembers] = useState([]);
  const [administrationMembers, setAdministrationMembers] = useState([]);

  console.log("loggedInUserId", loggedInUserId);

  const [searchInputText, setSearchInputText] = useState("");
  const [filteredTasks, setFilteredTasks] = useState(tasks);

  const onChangeOfSearchInput = (e) => {
    const searchText = e.target.value;
    setSearchInputText(searchText);
    filteredTasksList(e.target.value);
  };

  //Function to filter the table
  const filteredTasksList = (searchValue) => {
    if (!searchValue) {
      return tasks;
    }
    const filtered = tasks.filter((row) => {
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
    setFilteredTasks(tasks);
  };

  //Form fields for the task form:
  const taskFormDatafields = [
    // {
    //   label: "Department",
    //   name: "department",
    //   type: "select",
    //   options: [
    //     { id: "Reliability", label: "Reliability" },
    //     { id: "Software", label: "Software" },
    //     { id: "Administration", label: "Administration" },
    //     // Change in future according to the requiremnet
    //   ],
    //   width: "100%",
    // },

    { label: "Title", name: "title", type: "textField", width: "100%" },
    {
      label: "Description",
      name: "description",
      type: "textArea",
      width: "100%",
    },
    {
      label: "Task Assigned To",
      name: "assigned_to",
      type: "select",
      options: (() => {
        switch (loggedInUserDepartment) {
          case "Reliability":
            return reliabilityMembers;
          case "Software":
            return softwareMembers;
          case "Administration":
            return [
              ...reliabilityMembers,
              ...softwareMembers,
              ...administrationMembers,
            ];
          default:
            return [];
        }
      })(),
      width: "100%",
    },

    {
      label: "Story Points",
      name: "story_points",
      type: "select",
      options: [
        { id: "1", label: "1" },
        { id: "2", label: "2" },
        { id: "3", label: "3" },
        { id: "5", label: "5" },
        { id: "8", label: "8" },
        { id: "13", label: "13" },
      ],
      width: "100%",
    },
    {
      label: "Estimated Hours",
      name: "estimated_hours",
      type: "number",
      width: "100%",
    },
    {
      label: "Actual Hours",
      name: "actual_hours",
      type: "number",
      width: "100%",
    },
    {
      label: "Priority",
      name: "priority",
      type: "select",
      options: [
        { id: "Low", label: "Low" },
        { id: "Medium", label: "Medium" },
        { id: "High", label: "High" },
      ],
      width: "100%",
    },
    {
      label: "Status",
      name: "status",
      type: "select",
      options: [
        { id: "To Do", label: "To Do" },
        { id: "In Progress", label: "In Progress" },
        { id: "Done", label: "Done" },
        { id: "Blocked", label: "Blocked" },
      ],
      width: "100%",
    },
  ];

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
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "story_points",
      headerName: "Story Points",
      width: 200,
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
              deleteSelectedTask(params.row);
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

  //Function to save the task to the database:
  const saveNewTaskToDatabase = async (data) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/saveNewTask`,
        data
      );
      setNewTaskAdded(true);
      // Handle success
      if (response.status === 200) {
        toast.success("Task saved to database successfully");
        fetchTasksFromDatabase();
        return true;
      } else {
        console.log("Error saving task to database, status:", response.status);
        toast.error(
          `Error saving task: ${response.statusText || "Server error"}`
        );
        return false;
      }
    } catch (error) {
      toast.error(`Error saving task: ${error.message || "Network error"}`);
      return false;
    }
  };

  // FUnction to update the task in the database:
  const updateTaskInDatabase = async (data) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateTask/${selectedTaskId}`,
        data
      );
      if (response.status === 200) {
        toast.success("Task updated successfully");
        fetchTasksFromDatabase();
        return true;
      } else {
        console.log(
          "Error updating task in database, status:",
          response.status
        );
        toast.error(
          `Error updating task: ${response.statusText || "Server error"}`
        );
        return false;
      }
    } catch (error) {
      toast.error(`Error saving task: ${error.message || "Network error"}`);
      return false;
    }
  };

  //Function to fetch all the tasks from the database:
  const fetchTasksFromDatabase = async () => {
    try {
      const response = await axios.get(`${serverBaseAddress}/api/getAllTasks`);
      setTasks(response.data);
    } catch (error) {
      console.log("Error fetching tasks from database:", error);
    }
  };

  //Function to populate the data to view and update the task data:
  // Function to handle row click in DataGrid
  const openSelectedTask = (row) => {
    // Populate the form fields with the selected row's data
    setValue("title", row.title);
    setValue("description", row.description);
    setValue("assigned_to", row.assigned_to);
    // setValue("assigned_to_name", row.assigned_to_name);
    setValue("story_points", row.story_points);
    setValue("estimated_hours", row.estimated_hours);
    setValue("actual_hours", row.actual_hours);
    setValue("priority", row.priority);
    setValue("status", row.status);

    // Set the task_id and open the dialog in edit mode
    setSelectedTaskId(row.task_id);
    setIsEditMode(true);
    setOpen(true);
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
      console.log("Team members fetched from database:", response.data);
    } catch (error) {
      console.log("Error fetching team members from database:", error);
    }
  };

  useEffect(() => {
    fetchTasksFromDatabase();
    fetchTeamMembersFromDatabase();
  }, []);

  //useEffect to filter the table based on the search input
  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  const handleCloseDialog = () => {
    setOpen(false);
    setIsEditMode(false);
    setSelectedTaskId(null);
    reset();
  };

  const handleSubmitTaskForm = async (data) => {
    data["task_assigned_by"] = loggedInUser;
    data["last_updated_by"] = loggedInUserId;

    if (isEditMode) {
      await updateTaskInDatabase(data);
    } else {
      await saveNewTaskToDatabase(data);
    }
    // await fetchTasksFromDatabase();
    handleCloseDialog();
  };

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

  return (
    <>
      <Card sx={{ width: "100%", padding: "20px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <h2>Sprint Backlog</h2>
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
            onClick={() => setOpen(true)}
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
              onRowClick={(params) => openSelectedTask(params.row)}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
        )}

        <Dialog open={open} onClose={handleCloseDialog}>
          <DialogTitle> {isEditMode ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogContent>
            <Grid item xs={12} sm={6} md={6}>
              <RenderComponents
                fields={taskFormDatafields}
                register={register}
                control={control}
                watch={watch}
                setValue={setValue}
              />
            </Grid>
          </DialogContent>

          <DialogActions sx={{ justifyContent: "center" }}>
            <Button
              sx={{
                borderRadius: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
                padding: { xs: "8px 16px", md: "6px 12px" },
                fontSize: { xs: "0.875rem", md: "1rem" },
                mb: "10px",
              }}
              variant="contained"
              color="primary"
              onClick={handleSubmit(handleSubmitTaskForm)}
            >
              Submit
            </Button>
            <Button
              sx={{
                borderRadius: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
                padding: { xs: "8px 16px", md: "6px 12px" },
                fontSize: { xs: "0.875rem", md: "1rem" },
                mb: "10px",
              }}
              variant="contained"
              color="primary"
              onClick={handleCloseDialog}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <SprintSelector
          open={moveToSprintOpen}
          onClose={() => setMoveToSprintOpen(false)}
          taskId={selectedTaskForSprint}
          onSuccess={fetchTasksFromDatabase}
        />

        <Grid container spacing={2}>
          {tasks.map((task) => (
            <Grid item xs={12} sm={6} md={6} key={task.id}>
              <TaskCard task={task} />
            </Grid>
          ))}
        </Grid>
      </Card>
    </>
  );
};

export default SprintBacklog;

function TaskCard({ task }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{task.task_name}</Typography>
        <Typography variant="body2">{task.task_description}</Typography>
        <Typography variant="body2">
          Assigned To: {task.task_assigned_to}
        </Typography>
        <Typography variant="body2">Priority: {task.priority}</Typography>
        <Typography variant="body2">Status: {task.status}</Typography>
      </CardContent>
    </Card>
  );
}
