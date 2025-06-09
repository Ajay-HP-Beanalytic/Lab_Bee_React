import { useContext, useEffect, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import SprintBacklog from "./SprintBacklog";
import KanbanSheet from "./KanbanSheet";
import MyTasks from "./MyTasks";
import CreateProject from "./CreateProject";
import ProjectsTable from "./ProjectsTable";
import BreadCrumbs from "../components/Breadcrumb";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CreateTask from "./CreateTask";
import ManagementDashboard from "./ManagementDashboard";
import { UserContext } from "../Pages/UserContext";

const ProjectManagementDashboard = () => {
  const { loggedInUserRole } = useContext(UserContext);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [tabIndex, setTabIndex] = useState(0);

  // Define whether user has dashboard access
  const hasDashboardAccess =
    loggedInUserRole === "Managing Director" ||
    loggedInUserRole === "Reliability Manager" ||
    loggedInUserRole === "Administrator";

  const tabConfig = [
    ...(hasDashboardAccess
      ? [{ label: "Dashboard", component: <ManagementDashboard /> }]
      : []),
    { label: "Projects List", component: <ProjectsTable /> },
    { label: "Tasks List", component: <SprintBacklog /> },
    { label: "Kanban Sheet", component: <KanbanSheet /> },
    { label: "My Tasks", component: <MyTasks /> },
  ];

  // Check if breadcrumbs should be shown
  const shouldShowBreadcrumbs = () => {
    const path = location.pathname;
    return (
      path === "/create_project" ||
      path.startsWith("/edit_project/") ||
      path === "/add_task" ||
      path.startsWith("/edit_task/") ||
      path === "/my_tasks"
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
        { label: `Edit Project > ${projectId}`, current: true },
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
        { label: `Edit Task > ${taskId}`, current: true },
      ];
    } else if (path === "/my_tasks") {
      return [
        { label: "Projects", link: "/projects" },
        { label: "Tasks", link: "/tasks" },
        { label: "My Tasks", current: true },
      ];
    }
    return [];
  };

  const renderContent = () => {
    const path = location.pathname;

    // Handle create/edit routes
    if (path === "/create_project" || path.startsWith("/edit_project/")) {
      return <CreateProject />;
    }
    if (path === "/add_task" || path.startsWith("/edit_task/")) {
      return <CreateTask />;
    }

    // For all other routes, use tab-based rendering
    const currentTab = tabConfig[tabIndex];
    return currentTab?.component || <ProjectsTable />;
  };

  const handleTabChange = (_, newValue) => {
    setTabIndex(newValue);
    const selectedTab = tabConfig[newValue]?.label;

    // Only navigate for routes that exist, and prevent navigation during create/edit
    if (isCreateEditRoute()) {
      return; // Don't navigate away from create/edit pages via tabs
    }

    switch (selectedTab) {
      case "Dashboard":
      case "Projects List":
        navigate("/projects");
        break;
      case "Tasks List":
        navigate("/tasks");
        break;
      case "My Tasks":
        navigate("/my_tasks");
        break;
      default:
        break;
    }
  };

  // Check if current route is create/edit
  const isCreateEditRoute = () => {
    const path = location.pathname;
    return (
      path === "/create_project" ||
      path.startsWith("/edit_project/") ||
      path === "/add_task" ||
      path.startsWith("/edit_task/")
    );
  };

  // Synchronize tab index with current route
  useEffect(() => {
    const path = location.pathname;

    // Don't change tab index for create/edit routes
    if (isCreateEditRoute()) {
      return;
    }

    // Only update tab index for routes that correspond to navigation
    // Don't change tab for create/edit routes or Kanban
    if (
      path === "/create_project" ||
      path.startsWith("/edit_project/") ||
      path === "/add_task" ||
      path.startsWith("/edit_task/")
    ) {
      return; // Don't change tab index for these routes
    }

    let correctTabIndex = 0;

    if (path === "/projects" || path === "/") {
      // For /projects route, show Dashboard if user has access, otherwise Projects List
      if (hasDashboardAccess) {
        correctTabIndex = 0; // Dashboard
      } else {
        correctTabIndex = 0; // Projects List (first tab for non-dashboard users)
      }
    } else if (path === "/tasks") {
      // Find Tasks List tab
      correctTabIndex = tabConfig.findIndex(
        (tab) => tab.label === "Tasks List"
      );
    } else if (path === "/my_tasks") {
      // Find My Tasks tab
      correctTabIndex = tabConfig.findIndex((tab) => tab.label === "My Tasks");
    }

    // Only update if the index is valid and different
    if (correctTabIndex >= 0 && correctTabIndex !== tabIndex) {
      setTabIndex(correctTabIndex);
    }
  }, [location.pathname, hasDashboardAccess, tabConfig.length]);

  // Reset tab index when user role changes (and thus tabConfig changes)
  useEffect(() => {
    // When user role changes and dashboard access changes, reset to first tab
    // setTabIndex(0);

    // When user role changes and dashboard access changes, reset to first tab
    // But only if we're not on a create/edit route
    if (!isCreateEditRoute()) {
      setTabIndex(0);
    }
  }, [hasDashboardAccess]);

  return (
    <Box>
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
          {tabConfig.map((tab, index) => (
            <Tab key={`${tab.label}-${index}`} label={tab.label} />
          ))}
        </Tabs>
      </Box>
      {/* Render the appropriate content */}
      {renderContent()}
    </Box>
  );
};

export default ProjectManagementDashboard;
