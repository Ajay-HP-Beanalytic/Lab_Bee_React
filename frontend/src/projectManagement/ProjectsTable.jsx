import { useNavigate } from "react-router-dom";
import { serverBaseAddress } from "../Pages/APIPage";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { addSerialNumbersToRows } from "../functions/UtilityFunctions";
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";
import EmptyCard from "../common/EmptyCard";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import { DataGrid } from "@mui/x-data-grid";
import SearchBar from "../common/SearchBar";
import useProjectManagementStore from "./ProjectStore";
import { useContext } from "react";
import { UserContext } from "../Pages/UserContext";

const ProjectsTable = () => {
  const navigate = useNavigate();

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  const setProjectsList = useProjectManagementStore(
    (state) => state.setProjectsList
  );

  const projectsData = useProjectManagementStore(
    (state) => state.allTasksData.projectsList
  );

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  const [searchInputText, setSearchInputText] = useState("");
  const [filteredProjects, setFilteredProjects] = useState(projects);
  // eslint-disable-next-line no-unused-vars
  const [reliabilityProjects, setReliabilityProjects] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [softwareProjects, setSoftwareProjects] = useState([]);
  const [baseFilteredProjects, setBaseFilteredProjects] = useState([]);

  //Function to display the department-wise projects:
  useEffect(() => {
    if (
      projectsData &&
      projectsData.length > 0 &&
      loggedInUser &&
      loggedInUserDepartment
    ) {
      const reliability = projectsData.filter(
        (item) => item.department === "Reliability"
      );
      const software = projectsData.filter(
        (item) => item.department === "Software"
      );
      setReliabilityProjects(reliability);
      setSoftwareProjects(software);

      if (loggedInUserDepartment === "Reliability") {
        setBaseFilteredProjects(reliability);
        setFilteredProjects(reliability);
      } else if (loggedInUserDepartment === "Software") {
        setBaseFilteredProjects(software);
        setFilteredProjects(software);
      } else {
        setBaseFilteredProjects(projectsData);
        setFilteredProjects(projectsData);
      }
    }
  }, [projectsData, loggedInUser, loggedInUserDepartment]);

  const onChangeOfSearchInput = (e) => {
    const searchText = e.target.value;
    setSearchInputText(searchText);
    filteredProjectsList(e.target.value);
  };

  //Function to filter the table
  const filteredProjectsList = (searchValue) => {
    if (!searchValue) {
      setFilteredProjects(baseFilteredProjects);
      return;
    }
    const filtered = baseFilteredProjects.filter((row) => {
      return Object.values(row).some(
        (value) =>
          value != null &&
          value.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
    setFilteredProjects(filtered);
  };

  const onClearSearchInput = () => {
    setSearchInputText("");
    setFilteredProjects(baseFilteredProjects);
  };

  //Columns for Tasks Table:
  const projectsTableColumns = [
    {
      field: "serialNumbers",
      headerName: "SL No",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "project_id",
      headerName: "Project ID",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "project_name",
      headerName: "Project Name",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "department",
      headerName: "Department",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "project_manager_name",
      headerName: "Project Manager",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    // {
    //   field: "project_start_date",
    //   headerName: "Project Start Date",
    //   width: 200,
    //   align: "center",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    // },
    {
      field: "total_tasks_count",
      headerName: "Total Tasks Count",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    // {
    //   field: "project_end_date",
    //   headerName: "Project End Date",
    //   width: 100,
    //   align: "center",
    //   headerAlign: "center",
    //   headerClassName: "custom-header-color",
    // },
    {
      field: "project_status",
      headerName: "Status",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "last_updated_by_name",
      headerName: "Last Updated By",
      width: 180,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      renderCell: (params) => (
        <div>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              deleteSelectedProject(params.row.project_id);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </div>
      ),
    },
  ];

  const projectsTableWithSerialNumbers =
    addSerialNumbersToRows(filteredProjects);

  //Function to fetch all the tasks from the database:
  const fetchProjectsFromDatabase = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverBaseAddress}/api/getProjects`);
      setProjects(response.data);
      setFilteredProjects(response.data);
      setProjectsList(response.data); // Store projects data in Zustand
    } catch (error) {
      console.log("Error fetching tasks from database:", error);
    } finally {
      setLoading(false);
    }
  }, [setProjectsList]);

  useEffect(() => {
    fetchProjectsFromDatabase();
  }, [fetchProjectsFromDatabase]);

  //Function to delete the task from the database:
  const deleteSelectedProject = async (project_id) => {
    const confirmDeleteProject = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (confirmDeleteProject) {
      try {
        const response = await axios.delete(
          `${serverBaseAddress}/api/deleteProject/${project_id}`
        );
        if (response.status === 200) {
          toast.success("Project deleted successfully");
          await fetchProjectsFromDatabase();
        } else {
          console.log(
            "Error deleting project from database, status:",
            response.status
          );
          toast.error(
            `Error deleting project: ${response.statusText || "Server error"}`
          );
        }
      } catch (error) {
        toast.error(
          `Error deleting project: ${error.message || "Network error"}`
        );
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Projects Table
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <>
      <Card sx={{ width: "100%", padding: "20px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <h2>Projects</h2>
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
            onClick={() => navigate("/create_project")}
          >
            Add Project
          </Button>
        </Box>

        <SearchBar
          placeholder="Search projects..."
          searchInputText={searchInputText}
          onChangeOfSearchInput={onChangeOfSearchInput}
          onClearSearchInput={onClearSearchInput}
        />

        <Divider />

        {filteredProjects && filteredProjects.length === 0 ? (
          <EmptyCard message="No Projects Found" />
        ) : (
          <Box
            sx={{
              "height": 500,
              "width": "100%",
              "& .custom-header-color": {
                backgroundColor: "#476f95",
                color: "whitesmoke",
                fontWeight: "bold",
                fontSize: "15px",
              },
              "mt": 2,
            }}
          >
            <DataGrid
              columns={projectsTableColumns}
              rows={projectsTableWithSerialNumbers}
              sx={{ "&:hover": { cursor: "pointer" } }}
              getRowId={(row) => row.project_id}
              onRowClick={(params) =>
                navigate(`/edit_project/${params.row.project_id}`)
              }
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
            />
          </Box>
        )}
      </Card>
    </>
  );
};

export default ProjectsTable;
