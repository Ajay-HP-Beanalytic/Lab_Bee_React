import { useEffect, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import SprintBacklog from "./SprintBacklog";
import KanbanSheet from "./KanbanSheet";
import VelocityChart from "./VelocityChart";
import RetrospectiveNotes from "./Retrospective";
import HoursAndStorypoints from "./HoursAndStorypoints";
import MyTasks from "./MyTasks";
import SprintSelector from "./SprintSelector";
import CreateProject from "./CreateProject";
import ProjectsTable from "./ProjectsTable";
import BreadCrumbs from "../components/Breadcrumb";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CreateTask from "./CreateTask";

const ProjectManagementDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [tabIndex, setTabIndex] = useState(0);

  // Determine which component to show based on the current path
  const getCurrentView = () => {
    const path = location.pathname;
    console.log("Current path:", path);

    if (path === "/create_project" || path.startsWith("/edit_project")) {
      return "create_project";
    } else if (path === "/add_task" || path.startsWith("/edit_task")) {
      return "create_task";
    } else if (path === "/tasks") {
      return "tasks";
    }
    return "default";
  };

  // Check if breadcrumbs should be shown
  const shouldShowBreadcrumbs = () => {
    const path = location.pathname;
    return (
      path === "/create_project" ||
      path.startsWith("/edit_project/") ||
      path === "/add_task" ||
      path.startsWith("/edit_task/")
    );
  };

  // Get custom breadcrumbs based on current route
  const getCustomBreadcrumbs = () => {
    const path = location.pathname;

    if (path === "/create_project") {
      return [
        { label: "Projects", link: "/projects" },
        { label: "Create Project", current: true },
      ];
    } else if (path.startsWith("/edit_project/")) {
      const projectId = params.id;
      return [
        { label: "Projects", link: "/projects" },
        { label: `Edit Project #${projectId}`, current: true },
      ];
    } else if (path === "/add_task") {
      return [
        { label: "Projects", link: "/projects" },
        { label: "Tasks", link: "/tasks" },
        { label: "Add Task", current: true },
      ];
    } else if (path.startsWith("/edit_task/")) {
      const taskId = params.id;
      return [
        { label: "Projects", link: "/projects" },
        { label: "Tasks", link: "/tasks" },
        { label: `Edit Task #${taskId}`, current: true },
      ];
    }
    return [];
  };

  // Update tab index based on current view
  useEffect(() => {
    const currentView = getCurrentView();
    console.log("Current view:", currentView);

    if (currentView === "create_project") {
      setTabIndex(0); // Projects List
    } else if (currentView === "tasks" || currentView === "create_task") {
      setTabIndex(1); // Tasks List
    }
  }, [location.pathname]);

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
    // Navigate to the appropriate route when tab changes
    switch (newValue) {
      case 0:
        navigate("/projects");
        break;
      case 1:
        navigate("/tasks");
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    const view = getCurrentView();

    if (view === "create_project") {
      return <CreateProject />;
    } else if (view === "create_task") {
      return <CreateTask />;
    }

    // Default tab-based rendering
    switch (tabIndex) {
      case 0:
        return <ProjectsTable />;
      case 1:
        return <SprintBacklog />;
      case 2:
        return <KanbanSheet />;
      case 3:
        return <VelocityChart />;
      case 4:
        return <MyTasks />;
      default:
        return <ProjectsTable />;
    }
  };

  return (
    <Box>
      {/* <BreadCrumbs /> */}
      {/* Only show breadcrumbs for create/edit pages */}
      {shouldShowBreadcrumbs() && (
        <BreadCrumbs customBreadcrumbs={getCustomBreadcrumbs()} />
      )}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Projects List" />
          <Tab label="Tasks List" />
          <Tab label="Kanban Board" />
          <Tab label="Velocity Chart" />
          <Tab label="My Tasks" />
        </Tabs>

        {/* Optional Sprint Selector */}
        <SprintSelector />
      </Box>

      {renderContent()}
    </Box>
  );
};

export default ProjectManagementDashboard;
