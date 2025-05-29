import { useForm } from "react-hook-form";
import RenderComponents from "../functions/RenderComponents";
import { Box, Card, Grid, Typography } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../Pages/UserContext";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Button from "@mui/material/Button";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SprintBacklog from "./SprintBacklog";
import useProjectManagementStore from "./ProjectStore";

const CreateTask = () => {
  const {
    loggedInUser,
    loggedInUserDepartment,
    loggedInUserRole,
    loggedInUserId,
  } = useContext(UserContext);

  const projectsData = useProjectManagementStore(
    (state) => state.allTasksData.projectsList
  );

  const navigate = useNavigate();
  const { id: taskIdFromParams } = useParams();
  const location = useLocation();

  const { control, register, setValue, watch, handleSubmit, reset } = useForm();

  const [reliabilityMembers, setReliabilityMembers] = useState([]);
  const [softwareMembers, setSoftwareMembers] = useState([]);
  const [administrationMembers, setAdministrationMembers] = useState([]);

  const [newTaskAdded, setNewTaskAdded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // To track if the dialog is in edit mode
  const [selectedTaskId, setSelectedTaskId] = useState(null); // To store the task_id of the selected task
  const [isLoading, setIsLoading] = useState(false);

  const [projectIdsForDropdown, setProjectIdsForDropdown] = useState([]);

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

  const fetchProjectIdsForDropdown = async () => {
    const projectIds = projectsData.map((project) => project.project_id);
    setProjectIdsForDropdown(projectIds);
    return projectIds;
  };

  // Function to get options based on logged-in user's department
  const getAssignedToOptions = () => {
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
  };

  const getDepartmentOptions = () => {
    switch (loggedInUserDepartment) {
      case "Reliability":
        return ["Reliability"];
      case "Software":
        return ["Software"];
      case "Administration":
        return ["Reliability", "Software", "Administration"];
      default:
        return [];
    }
  };

  //Fields details to render in the form:
  const taskFormDatafields = useMemo(
    () => [
      {
        label: "Project ID",
        name: "corresponding_project_id",
        type: "select",
        options: projectIdsForDropdown,
        width: "30%",
      },
      {
        label: "Department",
        name: "department",
        type: "select",
        options: getDepartmentOptions(),
        width: "30%",
      },
      { label: "Title", name: "title", type: "textField", width: "30%" },
      {
        label: "Description",
        name: "description",
        type: "textArea",
        width: "30%",
      },
      {
        label: "Task Assigned To",
        name: "assigned_to",
        type: "select",
        options: getAssignedToOptions(),
        width: "30%",
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
        width: "30%",
      },
      {
        label: "Estimated Hours",
        name: "estimated_hours",
        type: "number",
        width: "30%",
      },
      {
        label: "Actual Hours",
        name: "actual_hours",
        type: "number",
        width: "30%",
      },
      {
        label: "Task Assigned Date",
        name: "task_assigned_date",
        type: "datePicker",
        width: "30%",
      },
      {
        label: "Task Due Date",
        name: "task_due_date",
        type: "datePicker",
        width: "30%",
      },
      {
        label: "Completed Date",
        name: "task_completed_date",
        type: "datePicker",
        width: "30%",
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
        width: "30%",
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
        width: "30%",
      },
    ],
    [
      reliabilityMembers,
      softwareMembers,
      administrationMembers,
      loggedInUserDepartment,
    ]
  );

  //Function to fetch the task data from the database:
  const fetchTaskDetailsAndPopulateForm = async (taskId) => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${serverBaseAddress}/api/getTaskData/${taskId}`
      );

      // FIX: The API returns an array, get the first item
      if (response.data) {
        const taskData = response.data;
        //populate the form fields with the task details:
        setValue(
          "corresponding_project_id",
          taskData.corresponding_project_id || ""
        );
        setValue("department", taskData.department || "");
        setValue("title", taskData.title || "");
        setValue("description", taskData.description || "");
        setValue("assigned_to", taskData.assigned_to || "");
        setValue("story_points", taskData.story_points?.toString() || "");
        setValue("estimated_hours", taskData.estimated_hours || "");
        setValue("actual_hours", taskData.actual_hours || "");
        setValue(
          "task_assigned_date",
          taskData.task_assigned_date
            ? dayjs(taskData.task_assigned_date)
            : null
        );
        setValue(
          "task_due_date",
          taskData.task_due_date ? dayjs(taskData.task_due_date) : null
        );
        setValue(
          "task_completed_date",
          taskData.task_completed_date
            ? dayjs(taskData.task_completed_date)
            : null
        );
        setValue("priority", taskData.priority || "");
        setValue("status", taskData.status || "");
      } else {
        toast.error("Task not found to update.");
        navigate("/tasks");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error(
        `Error fetching task details: ${error.message || "Server error"}`
      );
      navigate("/tasks");
    } finally {
      setIsLoading(false);
    }
  };

  //Function to fetch and populate the task details based on the task_id:
  useEffect(() => {
    const initializeComponent = async () => {
      // Always fetch team members first
      await fetchTeamMembersFromDatabase();
      await fetchProjectIdsForDropdown();

      if (taskIdFromParams) {
        setIsEditMode(true);
        setSelectedTaskId(taskIdFromParams);
        await fetchTaskDetailsAndPopulateForm(taskIdFromParams);
      } else {
        setIsEditMode(false);
        setSelectedTaskId(null);
        reset();
      }
    };

    //Initialize the component:
    initializeComponent();
  }, [taskIdFromParams, location.pathname]);

  // Function to save the new task to the database:
  const saveNewTaskToDatabase = async (data) => {
    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/saveNewTask`,
        data
      );
      // Handle success
      if (response.status === 200) {
        toast.success("Task saved to database successfully");
        // fetchTasksFromDatabase();
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
        // fetchTasksFromDatabase();
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

  const handleSubmitTaskForm = async (data) => {
    data["task_assigned_by"] = loggedInUser;
    data["last_updated_by"] = loggedInUserId;

    // Format dates only if they are valid dayjs objects
    data["task_assigned_date"] =
      data["task_assigned_date"] && dayjs(data["task_assigned_date"]).isValid()
        ? dayjs(data["task_assigned_date"]).format("YYYY-MM-DD")
        : null;
    data["task_due_date"] =
      data["task_due_date"] && dayjs(data["task_due_date"]).isValid()
        ? dayjs(data["task_due_date"]).format("YYYY-MM-DD")
        : null;
    data["task_completed_date"] =
      data["task_completed_date"] &&
      dayjs(data["task_completed_date"]).isValid()
        ? dayjs(data["task_completed_date"]).format("YYYY-MM-DD")
        : null;

    if (isEditMode) {
      if (!selectedTaskId) {
        toast.error("No task selected for update.");
        return;
      }
      await updateTaskInDatabase(data);
    } else {
      await saveNewTaskToDatabase(data);
    }

    handleCloseDialog();
  };

  // Function to close the page
  const handleCloseDialog = async () => {
    setIsEditMode(false);
    setSelectedTaskId(null);
    reset();
    navigate("/tasks");
  };

  return (
    <>
      <Card sx={{ mt: "10px" }}>
        <Grid
          container
          display={"flex"}
          justifyContent={"center"}
          spacing={2}
          gap={2}
          sx={{ mt: "10px", padding: "20px" }}
        >
          <RenderComponents
            fields={taskFormDatafields}
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
          />
        </Grid>
      </Card>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mt: "10px",
          gap: 2,
        }}
      >
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
            padding: { xs: "8px 16px", md: "6px 12px" },
            fontSize: { xs: "0.875rem", md: "1rem" },
            mt: "10px",
            mb: "10px",
          }}
          variant="contained"
          color="primary"
          onClick={handleSubmit(handleSubmitTaskForm)}
          disabled={isLoading}
        >
          {isEditMode ? "Update" : "Submit"}
        </Button>
        <Button
          sx={{
            borderRadius: 1,
            bgcolor: "orange",
            color: "white",
            borderColor: "black",
            padding: { xs: "8px 16px", md: "6px 12px" },
            fontSize: { xs: "0.875rem", md: "1rem" },
            mt: "10px",
            mb: "10px",
          }}
          variant="contained"
          color="primary"
          onClick={handleCloseDialog}
        >
          Cancel
        </Button>
      </Box>
    </>
  );
};

export default CreateTask;
