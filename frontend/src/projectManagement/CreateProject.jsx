import { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../Pages/UserContext";
import { Box, Button, Card, Grid, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import RenderComponents from "../functions/RenderComponents";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useProjectManagementStore from "./ProjectStore";

const CreateProject = () => {
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
  const { id: projectIdFromParams } = useParams();
  const location = useLocation();

  const { control, register, setValue, watch, handleSubmit, reset } = useForm();

  const [reliabilityMembers, setReliabilityMembers] = useState([]);
  const [softwareMembers, setSoftwareMembers] = useState([]);
  const [administrationMembers, setAdministrationMembers] = useState([]);
  const [reliabilityProjectManagers, setReliabilityProjectManagers] = useState(
    []
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const fetchReliabilityProjectManagers = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getReliabilityProjectManagers`
      );
      setReliabilityProjectManagers(response.data || []);
    } catch (error) {
      console.error("Error fetching reliability project managers:", error);
    }
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
  const projectFormDatafields = useMemo(
    () => [
      {
        label: "Project Name",
        name: "project_name",
        type: "textField",
        width: "30%",
      },
      {
        label: "Company Name",
        name: "company_name",
        type: "textField",
        width: "30%",
      },
      {
        label: "PO Number",
        name: "po_number",
        type: "textField",
        width: "30%",
      },

      {
        label: "Department",
        name: "department",
        type: "select",
        options: getDepartmentOptions(),
        width: "30%",
      },
      {
        label: "Project Manager",
        name: "project_manager",
        type: "select",
        options:
          loggedInUserDepartment === "Reliability"
            ? reliabilityProjectManagers.map((pm) => pm.name)
            : getAssignedToOptions().map((member) => member.name),
        width: "30%",
      },
      {
        label: "Project Start Date",
        name: "project_start_date",
        type: "datePicker",
        width: "30%",
      },
      {
        label: "Allocated Hours",
        name: "allocated_hours",
        type: "number",
        width: "30%",
      },
      {
        label: "Total Tasks Count",
        name: "total_tasks_count",
        type: "number",
        width: "30%",
      },
      {
        label: "Pending Tasks Count",
        name: "pending_tasks_count",
        type: "number",
        width: "30%",
      },
      {
        label: "In Progress Tasks Count",
        name: "in_progress_tasks_count",
        type: "number",
        width: "30%",
      },
      {
        label: "Completed Tasks Count",
        name: "completed_tasks_count",
        type: "number",
        width: "30%",
      },

      {
        label: "Project End Date",
        name: "project_end_date",
        type: "datePicker",
        width: "30%",
      },
      {
        label: "Status",
        name: "project_status",
        type: "select",
        options: [
          { id: "To Do", label: "To Do" },
          { id: "In Progress", label: "In Progress" },
          { id: "Completed", label: "Completed" },
          { id: "On Hold", label: "On Hold" },
        ],
        width: "30%",
      },
      {
        label: "Remarks/Notes",
        name: "remarks",
        type: "textArea",
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
  const fetchProjectDetailsAndPopulateForm = async (projectId) => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        `${serverBaseAddress}/api/getProjectData/${projectId}`
      );

      // FIX: The API returns an array, get the first item
      if (response.data) {
        const projectData = response.data;
        //populate the form fields with the task details:
        setValue("po_number", projectData.po_number || "");
        setValue("department", projectData.department || "");
        setValue("company_name", projectData.company_name || "");
        setValue("project_name", projectData.project_name || "");
        setValue("project_manager", projectData.project_manager || "");
        setValue("allocated_hours", projectData.allocated_hours || "");
        setValue("total_tasks_count", projectData.total_tasks_count || "");
        setValue("pending_tasks_count", projectData.pending_tasks_count || "");
        setValue(
          "project_start_date",
          projectData.project_start_date
            ? dayjs(projectData.project_start_date)
            : null
        );
        setValue(
          "project_end_date",
          projectData.project_end_date
            ? dayjs(projectData.project_end_date)
            : null
        );
        setValue(
          "in_progress_tasks_count",
          projectData.in_progress_tasks_count || ""
        );
        setValue(
          "completed_tasks_count",
          projectData.completed_tasks_count || ""
        );
        setValue("project_status", projectData.project_status || "");
        setValue("remarks", projectData.remarks || "");
      } else {
        toast.error("Project not found to update.");
        // navigate("/projects");
        handleNavigateBack();
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast.error(
        `Error fetching project details: ${error.message || "Server error"}`
      );
      // navigate("/projects");
      handleNavigateBack();
    } finally {
      setIsLoading(false);
    }
  };

  //Function to fetch and populate the task details based on the task_id:
  useEffect(() => {
    const initializeComponent = async () => {
      // Always fetch team members first
      await fetchTeamMembersFromDatabase();
      await fetchReliabilityProjectManagers();

      if (projectIdFromParams) {
        setIsEditMode(true);
        setSelectedProjectId(projectIdFromParams);
        await fetchProjectDetailsAndPopulateForm(projectIdFromParams);
      } else {
        setIsEditMode(false);
        setSelectedProjectId(null);
        reset();
      }
    };

    //Initialize the component:
    initializeComponent();
  }, [projectIdFromParams, location.pathname]);

  // Function to navigate back to projects list
  const handleNavigateBack = () => {
    // Navigate back to projects list with proper state management
    navigate("/projects", { replace: false });
  };

  // Function to save the new task to the database:
  const createNewProjectToDatabase = async (data) => {
    const requiredFields = [
      { key: "project_name", label: "Project Name" },
      { key: "company_name", label: "Company Name" },
      { key: "project_start_date", label: "Project Start Date" },
      { key: "department", label: "Department" },
      { key: "project_manager", label: "Project Manager" },
    ];

    const missingFields = requiredFields
      .filter((field) => !data[field.key])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      toast.warning(
        `Please fill in the following required fields: ${missingFields.join(
          ","
        )}`
      );
      return false;
    }

    try {
      const response = await axios.post(
        `${serverBaseAddress}/api/createProject`,
        data
      );
      // Handle success
      if (response.status === 200) {
        toast.success("Project saved to database successfully");
        return true;
      } else {
        console.log(
          "Error saving project to database, status:",
          response.status
        );
        toast.error(
          `Error saving project: ${response.statusText || "Server error"}`
        );
        return false;
      }
    } catch (error) {
      toast.error(`Error saving project: ${error.message || "Network error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // FUnction to update the project in the database:
  const updateProjectInDatabase = async (data) => {
    try {
      const response = await axios.put(
        `${serverBaseAddress}/api/updateProject/${selectedProjectId}`,
        data
      );
      if (response.status === 200) {
        toast.success("Project updated successfully");
        // fetchTasksFromDatabase();
        return true;
      } else {
        console.log(
          "Error updating project in database, status:",
          response.status
        );
        toast.error(
          `Error updating project: ${response.statusText || "Server error"}`
        );
        return false;
      }
    } catch (error) {
      toast.error(`Error saving project: ${error.message || "Network error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProjectForm = async (data) => {
    data["last_updated_by"] = loggedInUserId;

    // Format dates only if they are valid dayjs objects
    data["project_start_date"] =
      data["project_start_date"] && dayjs(data["project_start_date"]).isValid()
        ? dayjs(data["project_start_date"]).format("YYYY-MM-DD")
        : null;
    data["project_end_date"] =
      data["project_end_date"] && dayjs(data["project_end_date"]).isValid()
        ? dayjs(data["project_end_date"]).format("YYYY-MM-DD")
        : null;

    let success = false;

    if (isEditMode) {
      if (!selectedProjectId) {
        toast.error("No project selected for update.");
        return;
      }
      success = await updateProjectInDatabase(data);
    } else {
      success = await createNewProjectToDatabase(data);
    }

    // Only navigate if the operation was successful
    if (success) {
      // Small delay to allow user to see the success message
      setTimeout(() => {
        handleNavigateBack();
      }, 1500);
    }
    // If not successful, stay on the form so user can fix issues

    // await handleCloseCreateProjectWindow();
  };

  // Function to close the page
  const handleCloseCreateProjectWindow = async () => {
    setIsEditMode(false);
    setSelectedProjectId(null);
    reset();
    // navigate("/projects");
    handleNavigateBack();
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
            fields={projectFormDatafields}
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
          onClick={handleSubmit(handleSubmitProjectForm)}
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
          onClick={handleCloseCreateProjectWindow}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </Box>
    </>
  );
};

export default CreateProject;
